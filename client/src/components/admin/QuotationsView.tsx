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

interface CustomerAddress {
    street: string;
    city: string;
    state: string;
    pinCode: string;
}

interface EditLog {
    editedAt: string;
    editedBy: string;
    changes: string;
}

interface Quotation {
    _id: string;
    token: string;
    items: QuotationItem[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress?: CustomerAddress;
    notes: string;
    total: number;
    status: string;
    expiresAt?: string;
    createdBy: string;
    createdAt: string;
    editHistory?: EditLog[];
    gstEnabled?: boolean;
    gstin?: string;
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

    // Address
    const [addressStreet, setAddressStreet] = useState('');
    const [addressCity, setAddressCity] = useState('');
    const [addressState, setAddressState] = useState('');
    const [addressPin, setAddressPin] = useState('');

    // GST
    const [gstEnabled, setGstEnabled] = useState(false);
    const [gstin, setGstin] = useState('');

    // Result
    const [createdQuotation, setCreatedQuotation] = useState<Quotation | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── List State ───
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
    const [copySuccess, setCopySuccess] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    // ─── Edit Mode ───
    const [editingId, setEditingId] = useState<string | null>(null);

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
            const res = await fetch(`${API_URL}/quotations${showArchived ? '?archived=true' : ''}`);
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
    }, [tab, showArchived]);

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
            const payload = {
                items,
                customerName,
                customerEmail,
                customerPhone,
                customerAddress: { street: addressStreet, city: addressCity, state: addressState, pinCode: addressPin },
                notes,
                expiresAt,
                gstEnabled,
                gstin: gstEnabled ? gstin : ''
            };

            if (editingId) {
                // Update existing
                const res = await fetch(`${API_URL}/quotations/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, editedBy: 'Admin' })
                });
                if (res.ok) {
                    const data = await res.json();
                    setCreatedQuotation(data);
                    setEditingId(null);
                } else {
                    alert('Failed to update quotation');
                }
            } else {
                // Create new
                const res = await fetch(`${API_URL}/quotations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const data = await res.json();
                    setCreatedQuotation(data);
                } else {
                    alert('Failed to create quotation');
                }
            }
        } catch (err) {
            console.error(err);
            alert('Error saving quotation');
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
        setAddressStreet('');
        setAddressCity('');
        setAddressState('');
        setAddressPin('');
        setGstEnabled(false);
        setGstin('');
        setEditingId(null);
    };

    // Start editing a quotation
    const startEdit = (q: Quotation) => {
        setItems(q.items);
        setCustomerName(q.customerName);
        setCustomerEmail(q.customerEmail);
        setCustomerPhone(q.customerPhone);
        setNotes(q.notes);
        setAddressStreet(q.customerAddress?.street || '');
        setAddressCity(q.customerAddress?.city || '');
        setAddressState(q.customerAddress?.state || '');
        setAddressPin(q.customerAddress?.pinCode || '');
        setGstEnabled(q.gstEnabled || false);
        setGstin(q.gstin || '');
        setExpiryDays('');
        setEditingId(q._id);
        setSelectedQuotation(null);
        setTab('create');
    };

    // Restore archived quotation
    const restoreQuotation = async (id: string) => {
        try {
            await fetch(`${API_URL}/quotations/${id}/restore`, { method: 'PUT' });
            fetchQuotations();
        } catch (err) {
            console.error(err);
        }
    };

    // Permanent delete
    const permanentDelete = async (id: string) => {
        if (!confirm('Permanently delete this quotation? This cannot be undone.')) return;
        try {
            await fetch(`${API_URL}/quotations/${id}/permanent`, { method: 'DELETE' });
            fetchQuotations();
            if (selectedQuotation?._id === id) setSelectedQuotation(null);
        } catch (err) {
            console.error(err);
        }
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

    // ─── Export PDF ───
    const generatePDF = (q: Quotation) => {
        const dateStr = new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const expiryStr = q.expiresAt ? new Date(q.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

        const itemRows = q.items.map((item, i) => `
            <tr style="${i % 2 === 0 ? 'background:#FAFAFA;' : ''}">
                <td style="padding:14px 20px;font-size:13px;color:#1d1d1f;border-bottom:1px solid #f0f0f0;">
                    <div style="font-weight:600;letter-spacing:-0.01em;">${item.name}</div>
                    <div style="font-size:11px;color:#86868b;margin-top:3px;">${item.brand || ''}${item.category ? ' · ' + item.category : ''}${item.isCustom ? ' · Custom' : ''}</div>
                </td>
                <td style="padding:14px 20px;text-align:center;font-size:13px;color:#1d1d1f;border-bottom:1px solid #f0f0f0;font-weight:500;">${item.quantity}</td>
                <td style="padding:14px 20px;text-align:right;font-size:13px;color:#1d1d1f;border-bottom:1px solid #f0f0f0;">₹${item.price.toLocaleString('en-IN')}</td>
                <td style="padding:14px 20px;text-align:right;font-size:13px;color:#1d1d1f;border-bottom:1px solid #f0f0f0;font-weight:600;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
            </tr>
        `).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation — JPS Enterprises</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1d1d1f; background: #fff; -webkit-font-smoothing: antialiased; }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
        }
        @page { size: A4; margin: 0; }
    </style>
</head>
<body>
    <div style="max-width:800px;margin:0 auto;padding:48px 56px;">

        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;padding-bottom:28px;border-bottom:2px solid #1d1d1f;">
            <div>
                <div style="font-size:28px;font-weight:900;letter-spacing:-0.03em;color:#1d1d1f;">JPS <span style="color:#e11d48;">ENTERPRISES</span></div>
                <div style="font-size:11px;letter-spacing:0.08em;color:#86868b;text-transform:uppercase;margin-top:4px;">Technology & Computer Solutions</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#1d1d1f;">QUOTATION</div>
                <div style="font-size:11px;color:#86868b;margin-top:4px;">${dateStr}</div>
                <div style="font-size:10px;font-family:monospace;color:#86868b;margin-top:2px;">REF: ${q.token.substring(0, 8).toUpperCase()}</div>
            </div>
        </div>

        <!-- Customer Info -->
        ${q.customerName || q.customerEmail || q.customerPhone ? `
        <div style="display:flex;gap:40px;margin-bottom:40px;">
            <div style="flex:1;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#86868b;margin-bottom:8px;">Prepared For</div>
                ${q.customerName ? `<div style="font-size:16px;font-weight:700;color:#1d1d1f;letter-spacing:-0.01em;">${q.customerName}</div>` : ''}
                ${q.customerEmail ? `<div style="font-size:13px;color:#424245;margin-top:4px;">${q.customerEmail}</div>` : ''}
                ${q.customerPhone ? `<div style="font-size:13px;color:#424245;margin-top:2px;">${q.customerPhone}</div>` : ''}
                ${q.customerAddress && (q.customerAddress.street || q.customerAddress.city) ? `<div style="font-size:13px;color:#424245;margin-top:4px;">${[q.customerAddress.street, q.customerAddress.city, q.customerAddress.state, q.customerAddress.pinCode].filter(Boolean).join(', ')}</div>` : ''}
            </div>
            <div style="text-align:right;">
                <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#86868b;margin-bottom:8px;">From</div>
                <div style="font-size:13px;color:#424245;line-height:1.6;">JPS Enterprises<br>Shop 7 & 11, UGF Shree Chambers<br>Naza Market, Lalbagh<br>Lucknow, Uttar Pradesh 226001<br>Phone: 9415409650</div>
            </div>
        </div>` : ''}

        ${q.gstEnabled && q.gstin ? `
        <div style="background:#EFF6FF;border-radius:8px;padding:12px 20px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1e40af;">GSTIN</div>
            <div style="font-size:14px;font-weight:600;color:#1e3a5f;font-family:monospace;">${q.gstin}</div>
        </div>` : ''}

        <!-- Items Table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
            <thead>
                <tr style="border-bottom:2px solid #1d1d1f;">
                    <th style="padding:12px 20px;text-align:left;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#86868b;">Item</th>
                    <th style="padding:12px 20px;text-align:center;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#86868b;width:80px;">Qty</th>
                    <th style="padding:12px 20px;text-align:right;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#86868b;width:120px;">Unit Price</th>
                    <th style="padding:12px 20px;text-align:right;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#86868b;width:120px;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows}
            </tbody>
        </table>

        <!-- Totals -->
        <div style="border-top:2px solid #1d1d1f;padding-top:20px;margin-top:0;margin-bottom:40px;">
            <div style="display:flex;justify-content:flex-end;">
                <div style="width:280px;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;">
                        <span style="font-size:12px;color:#86868b;text-transform:uppercase;letter-spacing:0.05em;">Subtotal</span>
                        <span style="font-size:14px;font-weight:600;color:#1d1d1f;">₹${q.total.toLocaleString('en-IN')}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:16px 0;margin-top:8px;border-top:1px solid #e0e0e0;">
                        <span style="font-size:14px;font-weight:800;color:#1d1d1f;text-transform:uppercase;letter-spacing:0.03em;">Total</span>
                        <span style="font-size:24px;font-weight:900;color:#e11d48;letter-spacing:-0.02em;">₹${q.total.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Notes -->
        ${q.notes ? `
        <div style="background:#f5f5f7;border-radius:12px;padding:20px 24px;margin-bottom:40px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#86868b;margin-bottom:8px;">Notes</div>
            <div style="font-size:13px;color:#424245;line-height:1.7;">${q.notes}</div>
        </div>` : ''}

        <!-- Validity -->
        ${expiryStr ? `
        <div style="text-align:center;margin-bottom:40px;">
            <div style="display:inline-block;background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:10px 24px;">
                <span style="font-size:12px;color:#9A3412;font-weight:600;">⏱ This quotation is valid until ${expiryStr}</span>
            </div>
        </div>` : ''}

        <!-- Footer -->
        <div style="border-top:1px solid #e0e0e0;padding-top:24px;margin-top:auto;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                    <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#86868b;margin-bottom:6px;">Terms & Conditions</div>
                    <div style="font-size:11px;color:#86868b;line-height:1.8;max-width:400px;">Prices are subject to change without prior notice. All prices are inclusive of applicable taxes unless stated otherwise. Payment is due upon acceptance of this quotation.</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:16px;font-weight:900;letter-spacing:-0.02em;color:#1d1d1f;">JPS <span style="color:#e11d48;">ENTERPRISES</span></div>
                    <div style="font-size:11px;color:#86868b;margin-top:4px;">jpsenterprises.in</div>
                </div>
            </div>
        </div>

    </div>

    <!-- Auto Print Button -->
    <div class="no-print" style="position:fixed;bottom:32px;right:32px;display:flex;gap:12px;">
        <button onclick="window.print()" style="background:#1d1d1f;color:#fff;border:none;padding:14px 32px;border-radius:12px;font-family:Inter,sans-serif;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:-0.01em;box-shadow:0 4px 20px rgba(0,0,0,0.15);">Save as PDF</button>
    </div>
    <script>window.onload=function(){setTimeout(function(){window.print()},600)}<\/script>
</body>
</html>`;

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
        }
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

                    {/* WhatsApp Share & Export PDF */}
                    <div className="flex gap-3 justify-center mb-6">
                        <a
                            href={`https://wa.me/${createdQuotation.customerPhone ? createdQuotation.customerPhone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(`Hi ${createdQuotation.customerName},\n\nYour quotation from JPS Enterprises is ready!\n\nTotal: ₹${createdQuotation.total.toLocaleString()}\n\nPay here: ${link}\n\nThis link is valid for one-time use only.`)}`}
                            target="_blank"
                            className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-sm uppercase hover:bg-green-700 transition flex items-center gap-2"
                        >
                            <i className="fab fa-whatsapp text-lg"></i> Share via WhatsApp
                        </a>
                        <button
                            onClick={() => generatePDF(createdQuotation)}
                            className="bg-gray-800 text-white px-6 py-3 rounded-lg font-bold text-sm uppercase hover:bg-brand-red transition flex items-center gap-2"
                        >
                            <i className="fas fa-file-pdf"></i> Export PDF
                        </button>
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

                        {/* Address */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-black text-gray-800 uppercase text-sm mb-4 flex items-center gap-2">
                                <i className="fas fa-map-marker-alt text-brand-red"></i> Shipping Address
                            </h3>
                            <div className="space-y-3">
                                <input
                                    placeholder="Street / Locality"
                                    value={addressStreet}
                                    onChange={e => setAddressStreet(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        placeholder="City"
                                        value={addressCity}
                                        onChange={e => setAddressCity(e.target.value)}
                                        className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                                    />
                                    <input
                                        placeholder="State"
                                        value={addressState}
                                        onChange={e => setAddressState(e.target.value)}
                                        className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                                    />
                                </div>
                                <input
                                    placeholder="PIN Code"
                                    value={addressPin}
                                    onChange={e => setAddressPin(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                                />
                            </div>
                        </div>

                        {/* GST Toggle */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-black text-gray-800 uppercase text-sm flex items-center gap-2">
                                    <i className="fas fa-file-invoice text-brand-red"></i> GST
                                </h3>
                                <button
                                    onClick={() => setGstEnabled(!gstEnabled)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${gstEnabled ? 'bg-brand-red' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${gstEnabled ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>
                            {gstEnabled && (
                                <input
                                    placeholder="GSTIN Number"
                                    value={gstin}
                                    onChange={e => setGstin(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-red outline-none font-mono"
                                />
                            )}
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
                                    <><i className="fas fa-spinner fa-spin"></i> {editingId ? 'Updating...' : 'Creating...'}</>
                                ) : (
                                    <><i className={`fas ${editingId ? 'fa-save' : 'fa-paper-plane'}`}></i> {editingId ? 'Update Quotation' : 'Create & Get Link'}</>
                                )}
                            </button>
                            {editingId && (
                                <button onClick={resetForm} className="w-full mt-2 bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition uppercase tracking-wider text-sm">
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── LIST TAB ─── */}
            {tab === 'list' && (
                <div>
                    {/* Archive Toggle */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setShowArchived(false)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${!showArchived ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            <i className="fas fa-inbox mr-1"></i> Active
                        </button>
                        <button
                            onClick={() => setShowArchived(true)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${showArchived ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            <i className="fas fa-archive mr-1"></i> Archived
                        </button>
                    </div>
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
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gray-50 rounded-lg p-4">
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
                                    {selectedQuotation.customerAddress && (selectedQuotation.customerAddress.street || selectedQuotation.customerAddress.city) && (
                                        <div>
                                            <div className="text-xs text-gray-400 font-bold uppercase">Address</div>
                                            <div className="text-sm text-gray-800">
                                                {[selectedQuotation.customerAddress.street, selectedQuotation.customerAddress.city, selectedQuotation.customerAddress.state, selectedQuotation.customerAddress.pinCode].filter(Boolean).join(', ')}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* GST Info */}
                                {selectedQuotation.gstEnabled && selectedQuotation.gstin && (
                                    <div className="mb-6 bg-blue-50 rounded-lg p-3 text-sm">
                                        <span className="font-bold text-blue-700 uppercase text-xs">GSTIN:</span>
                                        <span className="ml-2 font-mono text-blue-900">{selectedQuotation.gstin}</span>
                                    </div>
                                )}

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
                                    <button onClick={() => generatePDF(selectedQuotation)} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm uppercase hover:bg-brand-red transition flex items-center gap-2">
                                        <i className="fas fa-file-pdf"></i> Export PDF
                                    </button>
                                    {(selectedQuotation.status === 'draft' || selectedQuotation.status === 'sent') && (
                                        <button onClick={() => startEdit(selectedQuotation)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm uppercase hover:bg-blue-700 transition flex items-center gap-2">
                                            <i className="fas fa-edit"></i> Edit
                                        </button>
                                    )}
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
                                    {(selectedQuotation.status === 'cancelled' || selectedQuotation.status === 'expired') && (
                                        <>
                                            <button onClick={() => restoreQuotation(selectedQuotation._id)} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm uppercase hover:bg-green-200 transition flex items-center gap-2">
                                                <i className="fas fa-undo"></i> Restore
                                            </button>
                                            <button onClick={() => permanentDelete(selectedQuotation._id)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm uppercase hover:bg-red-700 transition flex items-center gap-2">
                                                <i className="fas fa-trash"></i> Delete Permanently
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

                                {/* Edit History */}
                                {selectedQuotation.editHistory && selectedQuotation.editHistory.length > 0 && (
                                    <div className="mt-6 border-t pt-4">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3"><i className="fas fa-history mr-1"></i> Edit History</h4>
                                        <div className="space-y-2">
                                            {selectedQuotation.editHistory.map((log, i) => (
                                                <div key={i} className="flex items-start gap-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                                                    <i className="fas fa-pencil-alt text-gray-400 mt-0.5"></i>
                                                    <div>
                                                        <span className="font-bold text-gray-700">{log.editedBy}</span>
                                                        <span className="mx-1">—</span>
                                                        <span>{log.changes}</span>
                                                        <div className="text-gray-400 mt-0.5">{new Date(log.editedAt).toLocaleString('en-IN')}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
                                                    {showArchived ? (
                                                        <div className="flex gap-2 justify-center">
                                                            <button onClick={() => restoreQuotation(q._id)} className="text-xs font-bold text-green-600 hover:underline">Restore</button>
                                                            <button onClick={() => permanentDelete(q._id)} className="text-xs font-bold text-red-600 hover:underline">Delete</button>
                                                        </div>
                                                    ) : (
                                                        q.status === 'sent' && (
                                                            <button onClick={() => copyLink(q.token)} className="text-xs font-bold text-brand-red hover:underline">
                                                                {copySuccess === q.token ? '✓' : 'Copy Link'}
                                                            </button>
                                                        )
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
