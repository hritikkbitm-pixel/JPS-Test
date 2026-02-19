'use client';

import React, { useState, useMemo } from 'react';
import { useShop } from '@/context/ShopContext';
import { Banner } from '@/lib/data';

export default function MarketingView() {
    const { banners, addBanner, removeBanner, products, categories } = useShop();
    const [bannerForm, setBannerForm] = useState<Partial<Banner>>({
        image: '',
        target: '/',
        type: 'hero',
        productIds: [],
        targetType: 'filter',
        targetValue: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

    // Filter products for search
    const filteredProducts = useMemo(() => {
        if (!productSearch.trim()) return [];
        const searchLower = productSearch.toLowerCase();
        return products
            .filter(p =>
                p.name?.toLowerCase().includes(searchLower) ||
                p.id?.toLowerCase().includes(searchLower)
            )
            .slice(0, 10);
    }, [products, productSearch]);

    const handleAddProduct = (productId: string) => {
        if (!selectedProducts.includes(productId)) {
            setSelectedProducts([...selectedProducts, productId]);
        }
        setProductSearch('');
    };

    const handleRemoveProduct = (productId: string) => {
        setSelectedProducts(selectedProducts.filter(id => id !== productId));
    };

    const handleAddBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bannerForm.image) {
            alert('Please provide an image URL');
            return;
        }

        setIsLoading(true);

        // Compute target URL based on type
        let finalTarget = bannerForm.target || '/';
        if (bannerForm.targetType === 'filter' && selectedProducts.length > 0) {
            finalTarget = `/?productIds=${selectedProducts.join(',')}`;
        } else if (bannerForm.targetType === 'product' && bannerForm.targetValue) {
            finalTarget = `/product/${bannerForm.targetValue}`;
        } else if (bannerForm.targetType === 'category' && bannerForm.targetValue) {
            finalTarget = `/?category=${bannerForm.targetValue}`;
        }

        await addBanner({
            ...bannerForm,
            target: finalTarget,
            productIds: selectedProducts
        } as Banner);

        setBannerForm({ image: '', target: '/', type: 'hero', productIds: [], targetType: 'filter', targetValue: '' });
        setSelectedProducts([]);
        setIsLoading(false);
    };

    const handleRemoveBanner = async (id: string) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;
        await removeBanner(id);
    };

    // Get product name by ID
    const getProductName = (id: string) => {
        const product = products.find(p => p.id === id);
        return product?.name || id;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add Banner Form */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center text-brand-red">
                        <i className="fas fa-bullhorn text-lg"></i>
                    </div>
                    <div>
                        <h3 className="font-black text-xl text-gray-800 uppercase">Add New Banner</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Promotional Materials</p>
                    </div>
                </div>

                <form onSubmit={handleAddBanner} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Banner Image URL *</label>
                            <input
                                type="text"
                                value={bannerForm.image}
                                onChange={e => setBannerForm({ ...bannerForm, image: e.target.value })}
                                className="w-full border-2 border-gray-100 p-3 rounded-lg text-sm focus:outline-none focus:border-brand-red transition"
                                placeholder="https://..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Banner Type</label>
                            <select
                                value={bannerForm.type}
                                onChange={e => setBannerForm({ ...bannerForm, type: e.target.value })}
                                className="w-full border-2 border-gray-100 p-3 rounded-lg text-sm focus:outline-none focus:border-brand-red bg-white"
                            >
                                <option value="hero">Hero (Carousel)</option>
                                <option value="promo">Promo (Full Width)</option>
                                <option value="product-grid">Product Grid Banner</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Redirect Type</label>
                            <select
                                value={bannerForm.targetType}
                                onChange={e => setBannerForm({ ...bannerForm, targetType: e.target.value as any, targetValue: '', productIds: [] })}
                                className="w-full border-2 border-gray-100 p-3 rounded-lg text-sm focus:outline-none focus:border-brand-red bg-white"
                            >
                                <option value="filter">Selected Products (Filter)</option>
                                <option value="product">Single Product</option>
                                <option value="category">Category</option>
                                <option value="custom">Custom URL</option>
                            </select>
                        </div>
                    </div>

                    {/* Target Configuration */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                        {bannerForm.targetType === 'category' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Category</label>
                                <select
                                    value={bannerForm.targetValue}
                                    onChange={e => setBannerForm({ ...bannerForm, targetValue: e.target.value })}
                                    className="w-full border-2 border-white p-3 rounded-lg text-sm focus:outline-none focus:border-brand-red shadow-sm"
                                    required
                                >
                                    <option value="">Choose Category...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {bannerForm.targetType === 'custom' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target URL / Route</label>
                                <input
                                    type="text"
                                    value={bannerForm.target}
                                    onChange={e => setBannerForm({ ...bannerForm, target: e.target.value })}
                                    className="w-full border-2 border-white p-3 rounded-lg text-sm focus:outline-none focus:border-brand-red shadow-sm"
                                    placeholder="/cat/laptop or https://..."
                                    required
                                />
                            </div>
                        )}

                        {(bannerForm.targetType === 'filter' || bannerForm.targetType === 'product') && (
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-gray-500 uppercase">
                                    {bannerForm.targetType === 'filter' ? 'Selected Products' : 'Select Target Product'}
                                </label>

                                {bannerForm.targetType === 'product' && bannerForm.targetValue && (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-check-circle text-blue-600"></i>
                                            <span className="text-sm font-bold text-blue-900">{getProductName(bannerForm.targetValue)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setBannerForm({ ...bannerForm, targetValue: '' })}
                                            className="text-xs font-black uppercase text-blue-600 hover:text-blue-800"
                                        >
                                            Change
                                        </button>
                                    </div>
                                )}

                                {(!bannerForm.targetValue || bannerForm.targetType === 'filter') && (
                                    <div className="relative">
                                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                        <input
                                            type="text"
                                            value={productSearch}
                                            onChange={e => setProductSearch(e.target.value)}
                                            className="w-full border-2 border-white pl-10 pr-3 py-3 rounded-lg text-sm focus:outline-none focus:border-brand-red shadow-sm"
                                            placeholder="Search products..."
                                        />

                                        {filteredProducts.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-xl z-50 mt-1 max-h-60 overflow-y-auto overflow-x-hidden">
                                                {filteredProducts.map(product => (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onClick={() => {
                                                            if (bannerForm.targetType === 'product') {
                                                                setBannerForm({ ...bannerForm, targetValue: product.id });
                                                                setProductSearch('');
                                                            } else {
                                                                handleAddProduct(product.id!);
                                                            }
                                                        }}
                                                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-50 flex items-center gap-3 transition"
                                                    >
                                                        <img src={product.image || 'https://via.placeholder.com/50'} alt="" className="w-10 h-10 object-cover rounded bg-gray-100" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-gray-800 truncate text-sm">{product.name}</div>
                                                            <div className="text-xs text-gray-400">{product.brand} • ₹{product.price?.toLocaleString()}</div>
                                                        </div>
                                                        <i className="fas fa-plus-circle text-brand-red opacity-0 group-hover:opacity-100"></i>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {bannerForm.targetType === 'filter' && selectedProducts.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {selectedProducts.map(id => (
                                            <div key={id} className="bg-white border border-gray-200 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm animate-scale-in">
                                                <span className="text-xs font-bold text-gray-700">{getProductName(id)}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveProduct(id)}
                                                    className="text-gray-400 hover:text-brand-red transition"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-red text-white font-black py-4 rounded-xl hover:bg-red-700 transition shadow-lg shadow-brand-red/20 uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
                        {isLoading ? 'Processing...' : 'Add Banner to Store'}
                    </button>
                </form>
            </div>

            {/* Banner List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-xl text-gray-800 uppercase">Current Banners</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{banners.length} Active Placements</p>
                    </div>
                </div>

                {banners.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
                        <i className="fas fa-images text-4xl mb-4 opacity-20"></i>
                        <p className="font-bold">No active banners found.</p>
                        <p className="text-sm">Create one to start promoting products.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {banners.map(banner => (
                            <div key={banner.id} className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                                <div className="h-40 relative">
                                    <img src={banner.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                                        <div className="text-white">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-brand-red mb-1 drop-shadow-md">{banner.type} Banner</div>
                                            <div className="text-xs font-medium opacity-80 truncate mb-1">{banner.target}</div>
                                            {banner.productIds && banner.productIds.length > 0 && (
                                                <div className="text-[10px] bg-green-500/80 backdrop-blur-sm text-white px-2 py-0.5 rounded inline-flex items-center gap-1">
                                                    <i className="fas fa-tag"></i> {banner.productIds.length} Products
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveBanner(banner.id!)}
                                        className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-brand-red text-white rounded-lg flex items-center justify-center backdrop-blur-md transition-colors shadow-lg"
                                        title="Delete Placement"
                                    >
                                        <i className="fas fa-trash-alt text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
