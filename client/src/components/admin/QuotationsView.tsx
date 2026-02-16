'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '@/context/ShopContext';
import { API_URL } from '@/config';
import { Product } from '@/lib/data';

interface QuotationItem {
    name: string;
    price: number;
    quantity: number;
    category: string;
    brand: string;
    image: string;
    productId: string;
    isCustom: boolean;
}

interface Quotation {
    _id: string;
    token: string;
    items: QuotationItem[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    notes: string;
    total: number;
    status: string;
    expiresAt?: string;
    createdBy: string;
    createdAt: string;
}

// ─── Simple QR Code Generator (no external dependency) ───
function generateQRDataURL(text: string, size: number = 256): string {
    // We use a Google Charts API fallback for QR generation
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
}

export default function QuotationsView() {
    const { products } = useShop();
    const [tab, setTab] = useState<'create' | 'list'>('list');

    // ─── Create Form State ───
    const [items, setItems] = useState<QuotationItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Custom product form
    const [customName, setCustomName] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [customQty, setCustomQty] = useState('1');
    const [customCategory, setCustomCategory] = useState('');
    const [showCustomForm, setShowCustomForm] = useState(false);

    // Customer info
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [expiryDays, setExpiryDays] = useState('7');

    // Result
    const [createdQuotation, setCreatedQuotation] = useState<Quotation | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── List State ───
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
    const [copySuccess, setCopySuccess] = useState('');

    // Close search dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSearch(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Search products
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        const q = searchQuery.toLowerCase();
        const results = products
            .filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
            .slice(0, 15);
        setSearchResults(results);
    }, [searchQuery, products]);

    // Load quotations
    const fetchQuotations = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/quotations`);
            if (res.ok) {
                const data = await res.json();
                setQuotations(data);
            }
        } catch (err) {
            console.error('Failed to fetch quotations', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (tab === 'list') fetchQuotations();
    }, [tab]);

    // Add catalog product
    const addCatalogProduct = (product: Product) => {
        const existing = items.findIndex(i => i.productId === product.id);
        if (existing > -1) {
            const updated = [...items];
            updated[existing].quantity += 1;
            setItems(updated);
        } else {
            setItems([...items, {
                name: product.name,
                price: product.price,
                quantity: 1,
                category: product.category,
                brand: product.brand,
                image: product.image,
                productId: product.id,
                isCustom: false
            }]);
        }
        setSearchQuery('');
        setShowSearch(false);
    };

    // Add custom product
    const addCustomProduct = () => {
        if (!customName.trim() || !customPrice) return;
        setItems([...items, {
            name: customName.trim(),
            price: parseFloat(customPrice),
            quantity: parseInt(customQty) || 1,
            category: customCategory.trim(),
            brand: 'Custom',
            image: '',
            productId: '',
            isCustom: true
        }]);
        setCustomName('');
        setCustomPrice('');
        setCustomQty('1');
        setCustomCategory('');
        setShowCustomForm(false);
    };

    // Remove item
    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Update quantity
    const updateQty = (index: number, qty: number) => {
        if (qty < 1) return;
        const updated = [...items];
        updated[index].quantity = qty;
        setItems(updated);
    };

    // Update price
    const updatePrice = (index: number, price: number) => {
        if (price < 0) return;
        const updated = [...items];
        updated[index].price = price;
        setItems(updated);
    };

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Create quotation
    const handleCreate = async () => {
        if (items.length === 0) return;
        setIsSubmitting(true);
        try {
            const expiresAt = expiryDays ? new Date(Date.now() + parseInt(expiryDays) * 86400000).toISOString() : null;
            const res = await fetch(`${API_URL}/quotations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    customerName,
                    customerEmail,
                    customerPhone,
                    notes,
                    expiresAt
                })
            });
            if (res.ok) {
                const data = await res.json();
                setCreatedQuotation(data);
            } else {
                alert('Failed to create quotation');
            }
        } catch (err) {
            console.error(err);
            alert('Error creating quotation');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setItems([]);
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        setNotes('');
        setExpiryDays('7');
        setCreatedQuotation(null);
    };

    // Get shareable link
    const getLink = (token: string) => {
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        return `${base}/quote/${token}`;
    };

    // Copy link
    const copyLink = (token: string) => {
        navigator.clipboard.writeText(getLink(token));
        setCopySuccess(token);
        setTimeout(() => setCopySuccess(''), 2000);
    };

    // Update status
    const updateStatus = async (id: string, status: string) => {
        try {
            await fetch(`${API_URL}/quotations/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchQuotations();
            if (selectedQuotation?._id === id) {
                setSelectedQuotation(prev => prev ? { ...prev, status } : null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Status badge
    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-700',
            sent: 'bg-blue-100 text-blue-700',
            paid: 'bg-green-100 text-green-700',
            expired: 'bg-yellow-100 text-yellow-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${colors[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    // ─── Created Success View ───
    if (createdQuotation) {
        const link = getLink(createdQuotation.token);
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center border-t-4 border-green-500">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-check text-3xl text-green-600"></i>
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase mb-2">Quotation Created!</h2>
                    <p className="text-gray-500 mb-6">Share the link or QR code with your customer.</p>

                    {/* Amount */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="text-sm text-gray-500 uppercase font-bold">Total Amount</div>
                        <div className="text-3xl font-black text-brand-red">₹{createdQuotation.total.toLocaleString()}</div>
                        <div className="text-xs text-gray-400 mt-1">{createdQuotation.items.length} item(s)</div>
                    </div>

                    {/* Link */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Shareable Link</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={link}
                                className="flex-grow bg-white border rounded px-3 py-2 text-sm text-gray-700 font-mono"
                            />
                            <button
                                onClick={() => copyLink(createdQuotation.token)}
                                className="bg-black text-white px-4 py-2 rounded font-bold text-sm uppercase hover:bg-brand-red transition"
                            >
                                {copySuccess === createdQuotation.token ? '✓ Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-3">QR Code</label>
                        <img
                            src={generateQRDataURL(link)}
                            alt="QR Code"
                            className="mx-auto w-48 h-48 border-4 border-white shadow-md rounded-lg"
                        />
                    </div>

                    {/* WhatsApp Share */}
                    <div className="flex gap-3 justify-center mb-6">
                        <a
                            href={`https://wa.me/${createdQuotation.customerPhone ? createdQuotation.customerPhone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(`Hi ${createdQuotation.customerName},\n\nYour quotation from JPS Enterprises is ready!\n\nTotal: ₹${createdQuotation.total.toLocaleString()}\n\nPay here: ${link}\n\nThis link is valid for one-time use only.`)}`}
                            target="_blank"
                            className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-sm uppercase hover:bg-green-700 transition flex items-center gap-2"
                        >
                            <i className="fab fa-whatsapp text-lg"></i> Share via WhatsApp
                        </a>
                    </div>

                    <div className="flex gap-3 justify-center">
                        <button onClick={resetForm} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold text-sm uppercase hover:bg-gray-300 transition">
                            Create Another
                        </button>
                        <button onClick={() => { resetForm(); setTab('list'); }} className="bg-black text-white px-6 py-3 rounded-lg font-bold text-sm uppercase hover:bg-brand-red transition">
                            View All Quotations
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setTab('create')}
                    className={`px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition ${tab === 'create' ? 'bg-brand-red text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-plus mr-2"></i>Create Quotation
                </button>
                <button
                    onClick={() => setTab('list')}
                    className={`px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition ${tab === 'list' ? 'bg-brand-red text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    <i className="fas fa-list mr-2"></i>All Quotations
                </button>
            </div>

            {/* ─── CREATE TAB ─── */}
            {tab === 'create' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Search Products */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-black text-gray-800 uppercase text-sm mb-4 flex items-center gap-2">
                                <i className="fas fa-search text-brand-red"></i> Add from Catalog
                            </h3>
                            <div ref={searchRef} className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products by name, brand, or category..."
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
                                    onFocus={() => setShowSearch(true)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none"
                                />
                                {showSearch && searchResults.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                                        {searchResults.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => addCatalogProduct(p)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-red-50 transition text-left border-b border-gray-50 last:border-0"
                                            >
                                                {p.image ? (
                                                    <img src={p.image} alt={p.name} className="w-10 h-10 object-contain rounded border p-0.5" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs">N/A</div>
                                                )}
                                                <div className="flex-grow min-w-0">
                                                    <div className="text-xs font-bold text-gray-400 uppercase">{p.brand} · {p.category}</div>
                                                    <div className="text-sm font-bold text-gray-800 truncate">{p.name}</div>
                                                </div>
                                                <div className="text-sm font-black text-brand-red whitespace-nowrap">₹{p.price.toLocaleString()}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Custom Product */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-gray-800 uppercase text-sm flex items-center gap-2">
                                    <i className="fas fa-plus-circle text-brand-red"></i> Custom Product
                                </h3>
                                <button
                                    onClick={() => setShowCustomForm(!showCustomForm)}
                                    className="text-xs font-bold text-brand-red hover:underline uppercase"
                                >
                                    {showCustomForm ? 'Cancel' : 'Add Custom'}
                                </button>
                            </div>
                            {showCustomForm && (
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        placeholder="Product Name *"
                                        value={customName}
                                        onChange={e => setCustomName(e.target.value)}
                                        className="col-span-2 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                                    />
                                    <input
                                        placeholder="Price (₹) *"
                                        type="number"
                                        value={customPrice}
                                        onChange={e => setCustomPrice(e.target.value)}
                                        className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                                    />
                                    <input
                                        placeholder="Quantity"
                                        type="number"
                                        value={customQty}
                                        onChange={e => setCustomQty(e.target.value)}
                                        className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                                    />
                                    <input
                                        placeholder="Category (optional)"
                                        value={customCategory}
                                        onChange={e => setCustomCategory(e.target.value)}
                                        className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                                    />
                                    <button
                                        onClick={addCustomProduct}
                                        disabled={!customName.trim() || !customPrice}
                                        className="bg-black text-white rounded-lg px-4 py-2 text-sm font-bold uppercase hover:bg-brand-red transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Add Item
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-black text-gray-800 uppercase text-sm mb-4 flex items-center gap-2">
                                <i className="fas fa-receipt text-brand-red"></i> Quotation Items ({items.length})
                            </h3>
                            {items.length === 0 ? (
                                <div className="text-center text-gray-400 py-12">
                                    <i className="fas fa-inbox text-4xl mb-3 opacity-30"></i>
                                    <p className="text-sm">No items added yet. Search for products or add custom items.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-xs uppercase text-gray-500 border-b">
                                                <th className="text-left py-3 px-2">Product</th>
                                                <th className="text-center py-3 px-2 w-24">Qty</th>
                                                <th className="text-right py-3 px-2 w-28">Price</th>
                                                <th className="text-right py-3 px-2 w-28">Subtotal</th>
                                                <th className="w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => (
                                                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                                                    <td className="py-3 px-2">
                                                        <div className="flex items-center gap-3">
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.name} className="w-10 h-10 object-contain rounded border p-0.5" />
                                                            ) : (
                                                                <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center">
                                                                    <i className={`fas ${item.isCustom ? 'fa-star text-yellow-500' : 'fa-box text-gray-400'} text-xs`}></i>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-bold text-gray-800 line-clamp-1">{item.name}</div>
                                                                <div className="text-xs text-gray-400">
                                                                    {item.isCustom ? <span className="text-yellow-600 font-bold">CUSTOM</span> : `${item.brand} · ${item.category}`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => updateQty(idx, item.quantity - 1)} className="w-7 h-7 bg-gray-100 rounded hover:bg-gray-200 font-bold text-gray-600">-</button>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={e => updateQty(idx, parseInt(e.target.value) || 1)}
                                                                className="w-12 text-center border rounded py-1 text-sm font-bold"
                                                            />
                                                            <button onClick={() => updateQty(idx, item.quantity + 1)} className="w-7 h-7 bg-gray-100 rounded hover:bg-gray-200 font-bold text-gray-600">+</button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 text-right">
                                                        <input
                                                            type="number"
                                                            value={item.price}
                                                            onChange={e => updatePrice(idx, parseFloat(e.target.value) || 0)}
                                                            className="w-24 text-right border rounded py-1 px-2 text-sm font-bold"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-2 text-right font-black text-gray-800">
                                                        ₹{(item.price * item.quantity).toLocaleString()}
                                                    </td>
                                                    <td className="py-3 px-2 text-center">
                                                        <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-600 transition">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-gray-200">
                                                <td colSpan={3} className="py-4 px-2 text-right font-black text-gray-800 uppercase">Total</td>
                                                <td className="py-4 px-2 text-right font-black text-xl text-brand-red">₹{total.toLocaleString()}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Customer Info & Submit */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-black text-gray-800 uppercase text-sm mb-4 flex items-center gap-2">
                                <i className="fas fa-user text-brand-red"></i> Customer Info
                            </h3>
                            <div className="space-y-3">
                                <input
                                    placeholder="Customer Name"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                                />
                                <input
                                    placeholder="Email"
                                    type="email"
                                    value={customerEmail}
                                    onChange={e => setCustomerEmail(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                                />
                                <input
                                    placeholder="Phone (with country code)"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                                />
                                <textarea
                                    placeholder="Notes (visible to customer)"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-black text-gray-800 uppercase text-sm mb-4 flex items-center gap-2">
                                <i className="fas fa-clock text-brand-red"></i> Expiry
                            </h3>
                            <select
                                value={expiryDays}
                                onChange={e => setExpiryDays(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                            >
                                <option value="1">1 Day</option>
                                <option value="3">3 Days</option>
                                <option value="7">7 Days (Default)</option>
                                <option value="14">14 Days</option>
                                <option value="30">30 Days</option>
                                <option value="">No Expiry</option>
                            </select>
                        </div>

                        {/* Summary */}
                        <div className="bg-black rounded-xl shadow-lg p-6 text-white">
                            <div className="text-xs uppercase font-bold text-gray-400 mb-1">Quotation Total</div>
                            <div className="text-3xl font-black text-white mb-1">₹{total.toLocaleString()}</div>
                            <div className="text-xs text-gray-400 mb-4">{items.length} item(s) · {items.reduce((s, i) => s + i.quantity, 0)} unit(s)</div>
                            <button
                                onClick={handleCreate}
                                disabled={items.length === 0 || isSubmitting}
                                className="w-full bg-brand-red text-white font-bold py-4 rounded-lg hover:bg-red-700 transition uppercase tracking-wider text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <><i className="fas fa-spinner fa-spin"></i> Creating...</>
                                ) : (
                                    <><i className="fas fa-paper-plane"></i> Create & Get Link</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── LIST TAB ─── */}
            {tab === 'list' && (
                <div>
                    {selectedQuotation ? (
                        // Detail View
                        <div>
                            <button onClick={() => setSelectedQuotation(null)} className="text-sm text-brand-red font-bold mb-4 hover:underline flex items-center gap-1">
                                <i className="fas fa-arrow-left"></i> Back to list
                            </button>
                            <div className="bg-white rounded-xl shadow-lg p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-800 uppercase">Quotation Details</h3>
                                        <div className="text-xs text-gray-400 font-mono mt-1">Token: {selectedQuotation.token}</div>
                                    </div>
                                    <StatusBadge status={selectedQuotation.status} />
                                </div>

                                {/* Customer */}
                                <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 rounded-lg p-4">
                                    <div>
                                        <div className="text-xs text-gray-400 font-bold uppercase">Customer</div>
                                        <div className="text-sm font-bold text-gray-800">{selectedQuotation.customerName || '—'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 font-bold uppercase">Email</div>
                                        <div className="text-sm text-gray-800">{selectedQuotation.customerEmail || '—'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 font-bold uppercase">Phone</div>
                                        <div className="text-sm text-gray-800">{selectedQuotation.customerPhone || '—'}</div>
                                    </div>
                                </div>

                                {/* Items */}
                                <table className="w-full text-sm mb-6">
                                    <thead>
                                        <tr className="text-xs uppercase text-gray-500 border-b">
                                            <th className="text-left py-2">Product</th>
                                            <th className="text-center py-2">Qty</th>
                                            <th className="text-right py-2">Price</th>
                                            <th className="text-right py-2">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedQuotation.items.map((item, idx) => (
                                            <tr key={idx} className="border-b border-gray-50">
                                                <td className="py-3 flex items-center gap-2">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-8 h-8 object-contain rounded" />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                                            <i className={`fas ${item.isCustom ? 'fa-star text-yellow-500' : 'fa-box text-gray-400'} text-xs`}></i>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-gray-800">{item.name}</div>
                                                        {item.isCustom && <span className="text-[10px] text-yellow-600 font-bold">CUSTOM</span>}
                                                    </div>
                                                </td>
                                                <td className="text-center font-bold">{item.quantity}</td>
                                                <td className="text-right">₹{item.price.toLocaleString()}</td>
                                                <td className="text-right font-bold">₹{(item.price * item.quantity).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2"><td colSpan={3} className="text-right font-black uppercase py-3">Total</td><td className="text-right font-black text-brand-red text-lg py-3">₹{selectedQuotation.total.toLocaleString()}</td></tr>
                                    </tfoot>
                                </table>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-3">
                                    {selectedQuotation.status === 'sent' && (
                                        <>
                                            <button onClick={() => copyLink(selectedQuotation.token)} className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm uppercase hover:bg-brand-red transition flex items-center gap-2">
                                                <i className="fas fa-copy"></i> {copySuccess === selectedQuotation.token ? 'Copied!' : 'Copy Link'}
                                            </button>
                                            <button onClick={() => updateStatus(selectedQuotation._id, 'cancelled')} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold text-sm uppercase hover:bg-red-200 transition">
                                                Cancel
                                            </button>
                                            <button onClick={() => updateStatus(selectedQuotation._id, 'expired')} className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg font-bold text-sm uppercase hover:bg-yellow-200 transition">
                                                Mark Expired
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* QR for active quotations */}
                                {selectedQuotation.status === 'sent' && (
                                    <div className="mt-6 text-center">
                                        <img src={generateQRDataURL(getLink(selectedQuotation.token))} alt="QR" className="mx-auto w-40 h-40 border-2 border-gray-200 rounded-lg" />
                                        <div className="text-xs text-gray-400 mt-2">Scan to pay</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // List View
                        <div className="bg-white rounded-xl shadow">
                            {isLoading ? (
                                <div className="p-12 text-center text-gray-400">
                                    <i className="fas fa-spinner fa-spin text-2xl"></i>
                                    <p className="mt-2 text-sm">Loading quotations...</p>
                                </div>
                            ) : quotations.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    <i className="fas fa-file-invoice text-4xl mb-3 opacity-30"></i>
                                    <p className="text-sm">No quotations yet. Create your first one!</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs uppercase text-gray-500 border-b bg-gray-50">
                                            <th className="text-left py-3 px-4">Customer</th>
                                            <th className="text-center py-3 px-4">Items</th>
                                            <th className="text-right py-3 px-4">Total</th>
                                            <th className="text-center py-3 px-4">Status</th>
                                            <th className="text-center py-3 px-4">Date</th>
                                            <th className="text-center py-3 px-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quotations.map(q => (
                                            <tr key={q._id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedQuotation(q)}>
                                                <td className="py-3 px-4">
                                                    <div className="font-bold text-gray-800">{q.customerName || 'No Name'}</div>
                                                    <div className="text-xs text-gray-400">{q.customerEmail || q.customerPhone || '—'}</div>
                                                </td>
                                                <td className="text-center py-3 px-4 font-bold">{q.items.length}</td>
                                                <td className="text-right py-3 px-4 font-black text-gray-800">₹{q.total.toLocaleString()}</td>
                                                <td className="text-center py-3 px-4"><StatusBadge status={q.status} /></td>
                                                <td className="text-center py-3 px-4 text-xs text-gray-500">{new Date(q.createdAt).toLocaleDateString()}</td>
                                                <td className="text-center py-3 px-4" onClick={e => e.stopPropagation()}>
                                                    {q.status === 'sent' && (
                                                        <button onClick={() => copyLink(q.token)} className="text-xs font-bold text-brand-red hover:underline">
                                                            {copySuccess === q.token ? '✓' : 'Copy Link'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
