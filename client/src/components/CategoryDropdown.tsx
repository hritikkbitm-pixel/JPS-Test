"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useShop } from '@/context/ShopContext';

// Icon mapping for well-known categories
const iconMap: Record<string, string> = {
    'cpu': 'fas fa-microchip',
    'motherboard': 'fas fa-memory',
    'gpu': 'fas fa-gamepad',
    'ram': 'fas fa-memory',
    'storage': 'fas fa-hdd',
    'case': 'fas fa-box',
    'psu': 'fas fa-plug',
    'cooling': 'fas fa-fan',
    'all': 'fas fa-th-large'
};

export default function CategoryDropdown() {
    const { categories } = useShop();
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    return (
        <div className="relative group z-50">
            {/* Trigger Button */}
            <button className="bg-black text-white px-6 py-4 font-bold uppercase tracking-wider flex items-center gap-3 hover:bg-gray-800 transition w-64">
                <i className="fas fa-bars"></i>
                Categories
                <i className="fas fa-chevron-down ml-auto text-xs"></i>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 w-64 bg-white shadow-xl border-t-2 border-brand-red hidden group-hover:block max-h-[70vh] overflow-y-auto scrollbar-hide">
                <div className="flex flex-col">
                    {categories.length > 0 ? (
                        categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/?category=${category.id}`}
                                className="group/item px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between cursor-pointer transition"
                            >
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-700 group-hover/item:text-brand-red">
                                    <i className={`${iconMap[category.id] || 'fas fa-tag'} w-5 text-center text-gray-400 group-hover/item:text-brand-red`}></i>
                                    {category.label}
                                </div>
                                <i className="fas fa-chevron-right text-[10px] text-gray-300 group-hover/item:text-brand-red"></i>
                            </Link>
                        ))
                    ) : (
                        <div className="px-4 py-6 text-center text-gray-400 text-sm">
                            <i className="fas fa-folder-open mb-2 block text-xl"></i>
                            No categories found
                        </div>
                    )}

                    {/* Always show "All Products" link at bottom */}
                    <Link
                        href="/?category=all"
                        className="px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition border-t border-gray-100"
                    >
                        <div className="flex items-center gap-3 text-sm font-bold text-brand-red">
                            <i className="fas fa-th-large w-5 text-center"></i>
                            All Products
                        </div>
                        <i className="fas fa-bolt text-[10px] text-brand-red"></i>
                    </Link>
                </div>
            </div>
        </div>
    );
}
