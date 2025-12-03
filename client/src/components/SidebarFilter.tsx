'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/data';

interface SidebarFilterProps {
    products: Product[];
    onFilterChange: (filteredProducts: Product[]) => void;
    category: string;
}

export default function SidebarFilter({ products, onFilterChange, category }: SidebarFilterProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 500000 });
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [inStockOnly, setInStockOnly] = useState(false);

    // Extract unique brands from products
    const brands = Array.from(new Set(products.map(p => p.brand))).sort();

    // Filter logic
    useEffect(() => {
        let filtered = products;

        // Search
        if (searchQuery) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Price
        filtered = filtered.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);

        // Brands
        if (selectedBrands.length > 0) {
            filtered = filtered.filter(p => selectedBrands.includes(p.brand));
        }

        // Availability
        if (inStockOnly) {
            filtered = filtered.filter(p => p.stock > 0 && p.available !== false);
        }

        onFilterChange(filtered);
    }, [searchQuery, priceRange, selectedBrands, inStockOnly, products, onFilterChange]);

    const handleBrandChange = (brand: string) => {
        setSelectedBrands(prev =>
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };

    return (
        <div className="bg-white p-4 rounded border border-gray-200">
            <h3 className="font-bold text-lg mb-4 border-b pb-2">Filter Products</h3>

            {/* Search */}
            <div className="mb-6">
                <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Search</h4>
                <input
                    type="text"
                    placeholder="Keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                />
            </div>

            {/* Price */}
            <div className="mb-6">
                <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Price Range</h4>
                <div className="flex gap-2 items-center">
                    <input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                        className="w-full border p-1 rounded text-sm"
                        placeholder="Min"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                        className="w-full border p-1 rounded text-sm"
                        placeholder="Max"
                    />
                </div>
            </div>

            {/* Manufacturer */}
            <div className="mb-6">
                <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Manufacturer</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                    {brands.map(brand => (
                        <label key={brand} className="flex items-center gap-2 text-sm cursor-pointer hover:text-brand-red">
                            <input
                                type="checkbox"
                                checked={selectedBrands.includes(brand)}
                                onChange={() => handleBrandChange(brand)}
                                className="accent-brand-red"
                            />
                            {brand}
                        </label>
                    ))}
                </div>
            </div>

            {/* Availability */}
            <div className="mb-6">
                <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Stock Status</h4>
                <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-brand-red">
                    <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="accent-brand-red"
                    />
                    In Stock
                </label>
            </div>
        </div>
    );
}
