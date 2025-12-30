'use client';

import React, { useState, useMemo } from 'react';
import { useShop } from '@/context/ShopContext';
import { Banner } from '@/lib/data';

export default function MarketingView() {
    const { banners, addBanner, removeBanner, products } = useShop();
    const [bannerForm, setBannerForm] = useState<Partial<Banner>>({
        image: '',
        target: '/',
        type: 'hero',
        productIds: [],
        targetType: 'product',
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

    const handleAddProduct = (productId: string, productName: string) => {
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
        await addBanner({ ...bannerForm, productIds: selectedProducts } as Banner);
        setBannerForm({ image: '', target: '/', type: 'hero', productIds: [], targetType: 'product', targetValue: '' });
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add Banner Form */}
            <div className="bg-white p-6 rounded shadow border border-gray-200">
                <h3 className="font-bold text-lg mb-2">Add New Banner</h3>

                {/* Dimension Guidelines */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-xs">
                    <p className="font-bold text-blue-700 mb-1">📐 Recommended Dimensions:</p>
                    <ul className="text-blue-600 space-y-1">
                        <li><strong>Hero Banner:</strong> 1200 × 400 px (3:1 ratio)</li>
                    </ul>
                    <p className="text-blue-500 mt-2 italic">Use high-quality images. No text overlay needed.</p>
                </div>

                <form onSubmit={handleAddBanner} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL *</label>
                        <input
                            type="text"
                            value={bannerForm.image}
                            onChange={e => setBannerForm({ ...bannerForm, image: e.target.value })}
                            className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                            placeholder="https://..."
                            required
                        />
                    </div>

                    {/* Product Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Filter Products (clicking banner will show these products)
                        </label>

                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                value={productSearch}
                                onChange={e => setProductSearch(e.target.value)}
                                className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                                placeholder="Search products by name..."
                            />

                            {/* Search Results Dropdown */}
                            {filteredProducts.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white border rounded-b shadow-lg z-20 max-h-48 overflow-y-auto">
                                    {filteredProducts.map(product => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => handleAddProduct(product.id!, product.name!)}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                        >
                                            <img src={product.image || 'https://via.placeholder.com/100x100?text=No+Image'} alt="" className="w-8 h-8 object-cover rounded" />
                                            <div className="flex-1 truncate">
                                                <div className="font-medium truncate">{product.name}</div>
                                                <div className="text-xs text-gray-400">₹{product.price?.toLocaleString()}</div>
                                            </div>
                                            <i className="fas fa-plus text-green-500"></i>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Products */}
                        {selectedProducts.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {selectedProducts.map(id => (
                                    <span key={id} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded flex items-center gap-1">
                                        {getProductName(id)}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveProduct(id)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <p className="text-xs text-gray-400 mt-1">
                            {selectedProducts.length === 0
                                ? 'No products selected - banner will link to homepage'
                                : `${selectedProducts.length} product(s) selected`}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-red text-white font-bold py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
                    >
                        {isLoading ? 'Adding...' : 'ADD BANNER'}
                    </button>
                </form>
            </div>

            {/* Banner List */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg mb-2">Current Banners ({banners.length})</h3>
                {banners.length === 0 && (
                    <div className="text-gray-400 text-center py-8 bg-gray-50 rounded">
                        No banners added yet
                    </div>
                )}
                {banners.map(banner => (
                    <div key={banner.id} className="bg-white p-4 rounded shadow border border-gray-200 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition" style={{ backgroundImage: `url(${banner.image})` }}></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex-1">
                                <div className="text-xs uppercase font-bold text-gray-400 mb-1">{banner.type || 'hero'}</div>
                                <div className="text-sm text-gray-600 truncate max-w-xs">{banner.image}</div>
                                {banner.productIds && banner.productIds.length > 0 && (
                                    <div className="text-xs text-green-600 mt-1">
                                        <i className="fas fa-filter mr-1"></i>
                                        {banner.productIds.length} product(s) linked
                                    </div>
                                )}
                            </div>
                            <button onClick={() => handleRemoveBanner(banner.id!)} className="text-red-400 hover:text-red-600 bg-white rounded-full p-2 shadow-sm" title="Delete">
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
