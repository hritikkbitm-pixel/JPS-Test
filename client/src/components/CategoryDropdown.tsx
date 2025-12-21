"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useShop } from '@/context/ShopContext';

// Icon mapping for well-known categories
const iconMap: Record<string, string> = {
    'cpu': 'fas fa-microchip',
    'motherboard': 'fas fa-memory',
    'gpu': 'fas fa-gamepad',
    'ram': 'fas fa-server',
    'storage': 'fas fa-hdd',
    'case': 'fas fa-box',
    'psu': 'fas fa-plug',
    'cooling': 'fas fa-fan',
    'all': 'fas fa-th-large'
};

// Category labels mapping
const categoryLabels: Record<string, string> = {
    'cpu': 'Processor',
    'motherboard': 'Motherboards',
    'gpu': 'Graphic Cards',
    'ram': 'RAM',
    'storage': 'SSD',
    'case': 'PC Cabinet',
    'psu': 'Power Supply',
    'cooling': 'CPU Coolers'
};

interface SubcategoryGroup {
    title: string;
    items: { label: string; filter: string }[];
}

export default function CategoryDropdown() {
    const { categories, products } = useShop();
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    // Generate subcategories from products grouped by brand and series
    const subcategories = useMemo(() => {
        const result: Record<string, SubcategoryGroup[]> = {};

        categories.forEach(cat => {
            const catProducts = products.filter(p => p.category === cat.id);
            const groups: SubcategoryGroup[] = [];

            // Group by brand
            const brandMap = new Map<string, number>();
            catProducts.forEach(p => {
                if (p.brand) {
                    brandMap.set(p.brand, (brandMap.get(p.brand) || 0) + 1);
                }
            });

            if (brandMap.size > 0) {
                const brandItems = Array.from(brandMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([brand]) => ({
                        label: brand,
                        filter: `brand=${brand}`
                    }));
                groups.push({ title: 'By Brand', items: brandItems });
            }

            // Group by series
            const seriesMap = new Map<string, number>();
            catProducts.forEach(p => {
                const specs = p.specs as Record<string, string> | undefined;
                const series = specs?.series || (p as any).series;
                if (series) {
                    seriesMap.set(series, (seriesMap.get(series) || 0) + 1);
                }
            });

            if (seriesMap.size > 0) {
                const seriesItems = Array.from(seriesMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([series]) => ({
                        label: series,
                        filter: `series=${series}`
                    }));
                groups.push({ title: 'By Series', items: seriesItems });
            }

            result[cat.id] = groups;
        });

        return result;
    }, [categories, products]);

    return (
        <div className="relative group z-50">
            {/* Trigger Button */}
            <button className="bg-black text-white px-6 py-4 font-bold uppercase tracking-wider flex items-center gap-3 hover:bg-gray-800 transition w-64">
                <i className="fas fa-bars"></i>
                Browse All Categories
                <i className="fas fa-chevron-down ml-auto text-xs"></i>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 w-64 bg-white shadow-xl border-t-2 border-brand-red hidden group-hover:block">
                <div className="flex flex-col">
                    {categories.length > 0 ? (
                        categories.map((category) => (
                            <div
                                key={category.id}
                                className="relative"
                                onMouseEnter={() => setActiveCategory(category.id)}
                                onMouseLeave={() => setActiveCategory(null)}
                            >
                                <Link
                                    href={`/?category=${category.id}`}
                                    className="group/item px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between cursor-pointer transition"
                                >
                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-700 group-hover/item:text-brand-red">
                                        <i className={`${iconMap[category.id] || 'fas fa-tag'} w-5 text-center text-gray-400 group-hover/item:text-brand-red`}></i>
                                        {categoryLabels[category.id] || category.label}
                                    </div>
                                    <i className="fas fa-chevron-right text-[10px] text-gray-300 group-hover/item:text-brand-red"></i>
                                </Link>

                                {/* Mega Menu Flyout */}
                                {activeCategory === category.id && subcategories[category.id]?.length > 0 && (
                                    <div
                                        className="absolute left-full top-0 bg-white shadow-xl border-l border-gray-100 min-w-[500px] p-6 grid grid-cols-2 gap-6"
                                        onMouseEnter={() => setActiveCategory(category.id)}
                                    >
                                        {subcategories[category.id].map((group, idx) => (
                                            <div key={idx}>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-2">
                                                    {group.title}
                                                </h4>
                                                <ul className="space-y-2">
                                                    {group.items.map((item, i) => (
                                                        <li key={i}>
                                                            <Link
                                                                href={`/?category=${category.id}&${item.filter}`}
                                                                className="text-sm text-gray-600 hover:text-brand-red transition block"
                                                            >
                                                                {item.label}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}

                                        {/* View All Link */}
                                        <div className="col-span-2 pt-4 border-t border-gray-100">
                                            <Link
                                                href={`/?category=${category.id}`}
                                                className="text-sm font-bold text-brand-red hover:underline flex items-center gap-2"
                                            >
                                                View All {categoryLabels[category.id] || category.label}
                                                <i className="fas fa-arrow-right text-xs"></i>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
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

