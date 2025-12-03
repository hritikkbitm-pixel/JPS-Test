'use client';

import React, { useState } from 'react';
import { useShop } from '@/context/ShopContext';
import { Product, Order, Banner, Category } from '@/lib/data';
import AdminDataTools from '@/components/AdminDataTools';
import AuditLogViewer from '@/components/AuditLogViewer';

export default function AdminPage() {
    const { products, orders, banners, categories, addProduct, updateProduct, deleteProduct, setProducts, addBanner, removeBanner, updateCategory, addCategory, deleteCategory, updateOrderStatus, addOrderMessage, toggleFeatured } = useShop();
    const [view, setView] = useState('dashboard'); // dashboard, orders, products, marketing
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [messageText, setMessageText] = useState('');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form state for product
    const [productForm, setProductForm] = useState<Partial<Product>>({
        name: '', price: 0, stock: 0, category: 'gpu', brand: '', image: '', specs: {}
    });

    // Form state for banner
    const [bannerForm, setBannerForm] = useState<Partial<Banner>>({
        title: '',
        sub: '',
        image: '',
        target: '/store',
        type: 'hero',
        productIds: [],
        targetType: 'custom',
        targetValue: ''
    });

    // Form state for category
    const [categoryForm, setCategoryForm] = useState<Category>({
        id: '',
        label: '',
        image: ''
    });

    // Dashboard Calculations
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const lowStockProducts = products.filter(p => p.stock < 5).length;

    // Revenue Chart Data (Mock)
    const revenueData = orders.slice(0, 7).map(o => ({ date: o.date, total: o.total })).reverse();

    // Product Functions
    const handleAddProduct = () => {
        setEditingProduct(null);
        setProductForm({ name: '', price: 0, stock: 0, category: 'gpu', brand: '', image: '', specs: {} });
        setIsProductModalOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductForm(product);
        setIsProductModalOpen(true);
    };

    const handleDeleteProduct = (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            deleteProduct(id);
        }
    };

    const handleSaveProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            updateProduct({ ...editingProduct, ...productForm } as Product);
        } else {
            addProduct({ ...productForm, id: Math.random().toString(36).substr(2, 9), sold: 0, available: true } as Product);
        }
        setIsProductModalOpen(false);
    };

    // Banner Functions
    const handleAddBanner = (e: React.FormEvent) => {
        e.preventDefault();
        addBanner(bannerForm as Banner);
        setBannerForm({ title: '', sub: '', image: '', target: '/store', type: 'hero', productIds: [], targetType: 'custom', targetValue: '' });
    };

    const handleRemoveBanner = (id: string) => {
        // Removed confirm dialog as it might be blocked or annoying
        removeBanner(id);
    };

    // Category Functions
    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryForm.id || !categoryForm.label) return;
        addCategory(categoryForm);
        setCategoryForm({ id: '', label: '', image: '' });
    };

    const handleDeleteCategory = (id: string) => {
        deleteCategory(id);
    };

    const handleUpdateStatus = (id: string, status: string) => {
        updateOrderStatus(id, status);
        if (selectedOrder && selectedOrder.id === id) {
            setSelectedOrder({ ...selectedOrder, status });
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder || !messageText.trim()) return;

        addOrderMessage(selectedOrder.id, messageText, 'Admin');

        // Optimistically update local selectedOrder to show message immediately
        const newMessage = { text: messageText, sender: 'Admin', date: new Date().toLocaleString() };
        setSelectedOrder({
            ...selectedOrder,
            messages: [...(selectedOrder.messages || []), newMessage]
        });

        setMessageText('');
    };

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-black text-white flex flex-col shadow-xl z-10">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-2xl font-black tracking-tighter text-brand-red">ADMIN<span className="text-white">PANEL</span></h1>
                </div>
                <nav className="flex-grow p-4 space-y-2">
                    <button
                        onClick={() => setView('dashboard')}
                        className={`w-full text-left p-3 rounded transition flex items-center gap-3 ${view === 'dashboard' ? 'bg-brand-red text-white shadow-md' : 'hover:bg-gray-900 text-gray-400'}`}
                    >
                        <i className="fas fa-chart-line w-5 text-center"></i> Dashboard
                    </button>
                    <button
                        onClick={() => setView('orders')}
                        className={`w-full text-left p-3 rounded transition flex items-center gap-3 ${view === 'orders' ? 'bg-brand-red text-white shadow-md' : 'hover:bg-gray-900 text-gray-400'}`}
                    >
                        <i className="fas fa-shopping-cart w-5 text-center"></i> Orders
                    </button>
                    <button
                        onClick={() => setView('products')}
                        className={`w-full text-left p-3 rounded transition flex items-center gap-3 ${view === 'products' ? 'bg-brand-red text-white shadow-md' : 'hover:bg-gray-900 text-gray-400'}`}
                    >
                        <i className="fas fa-box w-5 text-center"></i> Products
                    </button>
                    <button
                        onClick={() => setView('marketing')}
                        className={`w-full text-left p-3 rounded transition flex items-center gap-3 ${view === 'marketing' ? 'bg-brand-red text-white shadow-md' : 'hover:bg-gray-900 text-gray-400'}`}
                    >
                        <i className="fas fa-bullhorn w-5 text-center"></i> Ad & Offers
                    </button>
                    <button
                        onClick={() => setView('categories')}
                        className={`w-full text-left p-3 rounded transition flex items-center gap-3 ${view === 'categories' ? 'bg-brand-red text-white shadow-md' : 'hover:bg-gray-900 text-gray-400'}`}
                    >
                        <i className="fas fa-th-large w-5 text-center"></i> Categories
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
                    v1.0.0 Admin Console
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow p-8 overflow-y-auto h-screen">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">{view}</h2>
                    {view === 'products' && (
                        <div className="flex gap-3">
                            <button onClick={handleAddProduct} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold text-sm uppercase tracking-wider transition shadow-sm">
                                <i className="fas fa-plus mr-2"></i> Add
                            </button>
                        </div>
                    )}
                </div>

                {/* DASHBOARD VIEW */}
                {view === 'dashboard' && (
                    <div className="space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                                <div className="text-blue-500 text-sm font-bold uppercase tracking-wider mb-1">Total Revenue</div>
                                <div className="text-3xl font-black text-gray-800">₹{totalRevenue.toLocaleString()}</div>
                            </div>
                            <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                                <div className="text-green-500 text-sm font-bold uppercase tracking-wider mb-1">Total Orders</div>
                                <div className="text-3xl font-black text-gray-800">{totalOrders}</div>
                            </div>
                            <div className="bg-red-50 p-6 rounded-lg border border-red-100">
                                <div className="text-red-500 text-sm font-bold uppercase tracking-wider mb-1">Low Stock Items</div>
                                <div className="text-3xl font-black text-gray-800">{lowStockProducts}</div>
                            </div>
                        </div>

                        {/* Revenue Chart */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Revenue Trends</h3>
                            <div className="h-64 flex items-end gap-2 border-b border-l border-gray-300 p-4 bg-gray-50 rounded">
                                {revenueData.length > 0 ? revenueData.map((item, idx) => {
                                    const max = Math.max(...revenueData.map(d => d.total));
                                    const height = (item.total / max) * 100;
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative">
                                            <div
                                                className="w-full bg-brand-red opacity-80 hover:opacity-100 transition-all rounded-t"
                                                style={{ height: `${height}%` }}
                                            ></div>
                                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-1 rounded z-10 whitespace-nowrap">
                                                {item.date}: ₹{item.total.toLocaleString()}
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500 rotate-45 origin-left">{item.date}</div>
                                        </div>
                                    );
                                }) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">No data available</div>
                                )}
                            </div>
                        </div>

                        <AuditLogViewer />
                    </div>
                )}

                {/* ORDERS VIEW */}
                {view === 'orders' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs uppercase text-gray-500 border-b bg-gray-50">
                                    <th className="p-4">Order ID</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {orders.map(order => (
                                    <tr key={order.id} className="border-b hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                        <td className="p-4 font-bold text-gray-800">#{order.id}</td>
                                        <td className="p-4 text-gray-600">{order.date}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800">{order.shippingAddress?.label || 'Guest'}</div>
                                            <div className="text-xs text-gray-500">{order.shippingAddress?.city}</div>
                                        </td>
                                        <td className="p-4 font-bold text-gray-800">₹{order.total.toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === 'Shipped' ? 'bg-green-100 text-green-800' : order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                                className="border rounded p-1 text-xs bg-white focus:outline-none focus:border-brand-red"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PRODUCTS VIEW */}
                {view === 'products' && (
                    <div className="space-y-6">
                        <AdminDataTools />

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-xs uppercase text-gray-500 border-b bg-gray-50">
                                        <th className="p-3">Product</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Price</th>
                                        <th className="p-3">Stock</th>
                                        <th className="p-3">Featured</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {products.map(product => (
                                        <tr key={product.id} className="border-b hover:bg-gray-50 transition">
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={product.image || "https://via.placeholder.com/40"} alt={product.name} className="w-10 h-10 object-contain border rounded bg-white" />
                                                    <div>
                                                        <div className="font-bold text-gray-800 line-clamp-1">{product.name}</div>
                                                        <div className="text-[10px] text-gray-500 uppercase font-bold">{product.brand}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-gray-600 capitalize">{product.category}</td>
                                            <td className="p-3 font-bold">₹{product.price.toLocaleString()}</td>
                                            <td className="p-3">
                                                <span className={`font-bold ${product.stock < 5 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => toggleFeatured(product.id)}
                                                    className={`text-2xl transition ${product.featured ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                                                    title={product.featured ? 'Remove from featured' : 'Mark as featured'}
                                                >
                                                    <i className="fas fa-star"></i>
                                                </button>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleEditProduct(product)} className="text-blue-600 hover:text-blue-800 mr-3" title="Edit">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button onClick={() => handleDeleteProduct(product.id)} className="text-red-400 hover:text-red-600" title="Delete">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div >
                )
                }

                {/* MARKETING VIEW */}
                {
                    view === 'marketing' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Add Banner Form */}
                            <div className="bg-white p-6 rounded shadow border border-gray-200">
                                <h3 className="font-bold text-lg mb-4">Add New Banner</h3>
                                <form onSubmit={handleAddBanner} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={bannerForm.title}
                                            onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
                                            className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                                            placeholder="Banner Title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subtitle</label>
                                        <input
                                            type="text"
                                            value={bannerForm.sub}
                                            onChange={e => setBannerForm({ ...bannerForm, sub: e.target.value })}
                                            className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                                            placeholder="Subtitle text"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL</label>
                                        <input
                                            type="text"
                                            value={bannerForm.image}
                                            onChange={e => setBannerForm({ ...bannerForm, image: e.target.value })}
                                            className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Link</label>
                                        <input
                                            type="text"
                                            value={bannerForm.target}
                                            onChange={e => setBannerForm({ ...bannerForm, target: e.target.value })}
                                            className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                                            placeholder="/store"
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-brand-red text-white font-bold py-2 rounded hover:bg-red-700 transition">ADD BANNER</button>
                                </form>
                            </div>

                            {/* Banner List */}
                            <div className="space-y-4">
                                {banners.map(banner => (
                                    <div key={banner.id} className="bg-white p-4 rounded shadow border border-gray-200 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition" style={{ backgroundImage: `url(${banner.image})` }}></div>
                                        <div className="relative z-10 flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-lg">{banner.title}</h4>
                                                <p className="text-sm text-gray-600">{banner.sub}</p>
                                                <div className="text-xs text-gray-400 mt-2">{banner.target}</div>
                                            </div>
                                            <button onClick={() => handleRemoveBanner(banner.id!)} className="text-red-400 hover:text-red-600 bg-white rounded-full p-2 shadow-sm" title="Delete">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* CATEGORIES VIEW */}
                {
                    view === 'categories' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Add Category Form */}
                            <div className="bg-white p-6 rounded shadow border border-gray-200">
                                <h3 className="font-bold text-lg mb-4">Add New Category</h3>
                                <form onSubmit={handleAddCategory} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID (e.g., 'cpu')</label>
                                        <input
                                            type="text"
                                            value={categoryForm.id}
                                            onChange={e => setCategoryForm({ ...categoryForm, id: e.target.value })}
                                            className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                                            placeholder="unique-id"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Label (e.g., 'Processors')</label>
                                        <input
                                            type="text"
                                            value={categoryForm.label}
                                            onChange={e => setCategoryForm({ ...categoryForm, label: e.target.value })}
                                            className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                                            placeholder="Display Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL</label>
                                        <input
                                            type="text"
                                            value={categoryForm.image}
                                            onChange={e => setCategoryForm({ ...categoryForm, image: e.target.value })}
                                            className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-brand-red text-white font-bold py-2 rounded hover:bg-red-700 transition">ADD</button>
                                </form>
                            </div>

                            {/* Category List */}
                            {categories.map(cat => (
                                <div key={cat.id} className="bg-white p-4 rounded shadow flex gap-4 items-start border border-gray-200">
                                    <img src={cat.image} alt={cat.label} className="w-24 h-24 object-cover rounded bg-gray-100" />
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-lg mb-2">{cat.label}</h4>
                                        <div className="mb-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    defaultValue={cat.image}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== cat.image) {
                                                            updateCategory({ ...cat, image: e.target.value });
                                                        }
                                                    }}
                                                    className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-400">ID: {cat.id}</p>
                                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600 text-sm" title="Delete">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }
            </div >

            {/* Order Details Modal */}
            {
                selectedOrder && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm fade-in">
                        <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-lg flex flex-col shadow-2xl animate-scale-in">
                            <div className="p-6 border-b flex justify-between items-start bg-gray-50 rounded-t-lg">
                                <div>
                                    <h3 className="font-black text-2xl text-gray-800">Order #{selectedOrder.id}</h3>
                                    <p className="text-gray-500 text-sm font-medium">Placed on {selectedOrder.date}</p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-brand-red text-2xl transition">&times;</button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
                                    <h4 className="font-bold text-xs uppercase text-blue-800 mb-2 tracking-wider">Shipping Address</h4>
                                    {selectedOrder.shippingAddress ? (
                                        <div className="text-sm text-gray-700">
                                            <div className="font-bold text-gray-900">{selectedOrder.shippingAddress.label}</div>
                                            <div>{selectedOrder.shippingAddress.line1}</div>
                                            {selectedOrder.shippingAddress.line2 && <div>{selectedOrder.shippingAddress.line2}</div>}
                                            <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}</div>
                                            <div className="mt-2 font-bold flex items-center gap-2"><i className="fas fa-phone text-xs"></i> {selectedOrder.shippingAddress.phone}</div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 italic">No address provided</div>
                                    )}
                                </div>

                                <h4 className="font-bold text-lg mb-4 border-b pb-2">Items Ordered</h4>
                                <div className="space-y-4 mb-8">
                                    {selectedOrder.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-4 border p-3 rounded hover:shadow-sm transition bg-white">
                                            <img src={item.image || "https://via.placeholder.com/64"} alt={item.name} className="w-16 h-16 object-contain border rounded p-1" />
                                            <div className="flex-grow">
                                                <div className="font-bold text-sm text-gray-800">{item.name}</div>
                                                <div className="text-xs text-gray-500 font-bold uppercase">{item.brand}</div>
                                            </div>
                                            <div className="font-black text-brand-red">₹{item.price.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Messages Section */}
                                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                    <h4 className="font-bold text-sm uppercase text-gray-700 mb-4">Messages & Updates</h4>
                                    <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                                        {selectedOrder.messages && selectedOrder.messages.length > 0 ? (
                                            selectedOrder.messages.map((msg, idx) => (
                                                <div key={idx} className={`p-3 rounded text-sm ${msg.sender === 'Admin' ? 'bg-blue-100 ml-8' : 'bg-white border mr-8'}`}>
                                                    <div className="font-bold text-xs mb-1">{msg.sender} <span className="font-normal text-gray-500 text-[10px] ml-2">{msg.date}</span></div>
                                                    <div>{msg.text}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-gray-400 text-sm italic text-center py-2">No messages yet.</div>
                                        )}
                                    </div>
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={messageText}
                                            onChange={e => setMessageText(e.target.value)}
                                            placeholder="Type a message to the customer..."
                                            className="flex-grow border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red"
                                        />
                                        <button type="submit" className="bg-brand-red text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-700 transition">Send</button>
                                    </form>
                                </div>
                            </div>
                            <div className="p-4 border-t bg-gray-50 text-right rounded-b-lg">
                                <button onClick={() => setSelectedOrder(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded font-bold hover:bg-gray-300 uppercase text-xs tracking-wider transition">Close</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Product Modal */}
            {
                isProductModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm fade-in">
                        <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-lg flex flex-col shadow-2xl animate-scale-in">
                            <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                                <h3 className="font-black text-xl text-gray-800 uppercase">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                                <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-brand-red text-2xl transition">&times;</button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <form onSubmit={handleSaveProduct} className="space-y-4">
                                    <div>
                                        <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Product Name</label>
                                        <input type="text" required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Brand</label>
                                            <input type="text" required value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Category</label>
                                            <select required value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red bg-white">
                                                <option value="cpu">CPU</option>
                                                <option value="gpu">GPU</option>
                                                <option value="motherboard">Motherboard</option>
                                                <option value="ram">RAM</option>
                                                <option value="storage">Storage</option>
                                                <option value="psu">PSU</option>
                                                <option value="case">Case</option>
                                                <option value="cooling">Cooling</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Price (₹)</label>
                                            <input type="number" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Stock</label>
                                            <input type="number" required value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Image URL</label>
                                        <input type="url" value={productForm.image} onChange={e => setProductForm({ ...productForm, image: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
                                    </div>
                                    <button type="submit" className="w-full bg-brand-red text-white font-bold py-3 rounded hover:bg-red-700 transition uppercase tracking-wider text-sm shadow-md">
                                        {editingProduct ? 'Update Product' : 'Add Product'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
