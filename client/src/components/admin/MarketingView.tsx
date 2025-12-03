'use client';

import React, { useState } from 'react';
import { useShop } from '@/context/ShopContext';
import { Banner } from '@/lib/data';

export default function MarketingView() {
    const { banners, addBanner, removeBanner } = useShop();
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

    const handleAddBanner = (e: React.FormEvent) => {
        e.preventDefault();
        addBanner(bannerForm as Banner);
        setBannerForm({ title: '', sub: '', image: '', target: '/store', type: 'hero', productIds: [], targetType: 'custom', targetValue: '' });
    };

    const handleRemoveBanner = (id: string) => {
        removeBanner(id);
    };

    return (
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
    );
}
