"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface SubCategory {
    name: string;
    href: string;
}

interface Category {
    id: string;
    name: string;
    icon: string;
    subcategories: SubCategory[];
}

const categories: Category[] = [
    {
        id: 'core',
        name: 'Core Components',
        icon: 'fas fa-microchip',
        subcategories: [
            { name: 'Processors', href: '/?category=cpu' },
            { name: 'Motherboards', href: '/?category=motherboard' },
            { name: 'Graphics Cards', href: '/?category=gpu' },
        ]
    },
    {
        id: 'memory',
        name: 'Memory & Storage',
        icon: 'fas fa-memory',
        subcategories: [
            { name: 'Desktop Memory', href: '/?category=ram' },
            { name: 'Storage (SSD/HDD)', href: '/?category=storage' },
        ]
    },
    {
        id: 'power',
        name: 'Power & Cabinet',
        icon: 'fas fa-plug',
        subcategories: [
            { name: 'Power Supply (SMPS)', href: '/?category=psu' },
            { name: 'Cabinets', href: '/?category=case' },
        ]
    },
    {
        id: 'accessories',
        name: 'Accessories',
        icon: 'fas fa-keyboard',
        subcategories: [
            { name: 'All Products', href: '/?category=all' },
        ]
    }
];

export default function CategoryDropdown() {
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
            <div className="absolute top-full left-0 w-64 bg-white shadow-xl border-t-2 border-brand-red hidden group-hover:block">
                <div className="flex flex-col relative">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="group/item"
                            onMouseEnter={() => setActiveCategory(category.id)}
                        >
                            <div className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between cursor-pointer transition">
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-700 group-hover/item:text-brand-red">
                                    <i className={`${category.icon} w-5 text-center text-gray-400 group-hover/item:text-brand-red`}></i>
                                    {category.name}
                                </div>
                                <i className="fas fa-chevron-right text-xs text-gray-300 group-hover/item:text-brand-red"></i>
                            </div>

                            {/* Subcategory Menu (Mega Menu Style) */}
                            <div className="absolute top-0 left-full w-64 h-full min-h-[200px] bg-white shadow-xl border-l border-gray-100 hidden group-hover/item:block p-4">
                                <h3 className="font-black text-gray-800 uppercase tracking-wide mb-3 border-b pb-2 text-sm">
                                    {category.name}
                                </h3>
                                <ul className="space-y-2">
                                    {category.subcategories.map((sub) => (
                                        <li key={sub.name}>
                                            <Link href={sub.href} className="text-sm text-gray-600 hover:text-brand-red hover:translate-x-1 transition-transform block">
                                                {sub.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
