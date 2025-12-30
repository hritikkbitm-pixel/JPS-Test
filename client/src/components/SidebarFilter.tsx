'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product } from '@/lib/data';

interface SidebarFilterProps {
    products: Product[];
    onFilterChange: (filteredProducts: Product[]) => void;
    category: string;
    initialSeries?: string;
    initialBrand?: string;
}

export default function SidebarFilter({ products, onFilterChange, category, initialSeries = '', initialBrand = '' }: SidebarFilterProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 500000 });
    const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrand ? [initialBrand] : []);
    const [inStockOnly, setInStockOnly] = useState(false);

    // GPU-specific filters
    const [selectedChipset, setSelectedChipset] = useState<string>('');
    const [selectedSeries, setSelectedSeries] = useState<string>(initialSeries);

    // Track if initial filters have been applied
    const initialFiltersApplied = useRef(false);

    // Extract unique brands from products
    const brands = Array.from(new Set(products.map(p => p.brand))).sort();

    // Extract GPU-specific data (chipset and series)
    const gpuData = useMemo(() => {
        if (category !== 'gpu') return { chipsets: [], seriesByChipset: {} };

        const chipsets = new Set<string>();
        const seriesByChipset: { [key: string]: Set<string> } = { 'NVIDIA': new Set(), 'AMD': new Set() };

        products.forEach(p => {
            const specs = p.specs as Record<string, unknown> | undefined;
            const chipset = specs?.chipset as string;
            const series = specs?.series as string;

            if (chipset) {
                chipsets.add(chipset);
                if (series) {
                    if (chipset.toUpperCase().includes('NVIDIA')) {
                        seriesByChipset['NVIDIA'].add(series);
                    } else if (chipset.toUpperCase().includes('AMD')) {
                        seriesByChipset['AMD'].add(series);
                    }
                }
            }
        });

        return {
            chipsets: Array.from(chipsets).sort(),
            seriesByChipset: {
                'NVIDIA': Array.from(seriesByChipset['NVIDIA']).sort(),
                'AMD': Array.from(seriesByChipset['AMD']).sort()
            }
        };
    }, [products, category]);

    // Apply initial filters from URL when component mounts or URL params change
    useEffect(() => {
        if (!initialFiltersApplied.current) {
            // Apply brand filter
            if (initialBrand) {
                setSelectedBrands([initialBrand]);
            }

            // Apply series filter
            if (initialSeries) {
                setSelectedSeries(initialSeries);

                // For GPU, also set the chipset based on series
                if (category === 'gpu') {
                    const isNvidia = gpuData.seriesByChipset['NVIDIA']?.includes(initialSeries);
                    const isAmd = gpuData.seriesByChipset['AMD']?.includes(initialSeries);

                    if (isNvidia) {
                        setSelectedChipset('NVIDIA');
                    } else if (isAmd) {
                        setSelectedChipset('AMD');
                    }
                }
            }

            initialFiltersApplied.current = true;
        }
    }, [category, initialSeries, initialBrand, gpuData.seriesByChipset]);

    // Reset filters when category changes
    useEffect(() => {
        setSelectedChipset('');
        setSelectedSeries(initialSeries || '');
        setSelectedBrands(initialBrand ? [initialBrand] : []);
        initialFiltersApplied.current = false;
    }, [category, initialSeries, initialBrand]);

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
            filtered = filtered.filter(p => p.available !== false);
        }

        // GPU Chipset filter (GPU-specific)
        if (category === 'gpu' && selectedChipset) {
            filtered = filtered.filter(p => {
                const specs = p.specs as Record<string, unknown> | undefined;
                const chipset = specs?.chipset as string;
                return chipset?.toUpperCase().includes(selectedChipset.toUpperCase());
            });
        }

        // Series filter (works for all categories)
        if (selectedSeries) {
            filtered = filtered.filter(p => {
                const specs = p.specs as Record<string, unknown> | undefined;
                const series = specs?.series as string || (p as any).series;
                return series === selectedSeries;
            });
        }

        onFilterChange(filtered);
    }, [searchQuery, priceRange, selectedBrands, inStockOnly, selectedChipset, selectedSeries, products, onFilterChange, category]);

    const handleBrandChange = (brand: string) => {
        setSelectedBrands(prev =>
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };

    return (
        <div className="bg-white p-4 rounded border border-gray-200">
            <h3 className="font-bold text-lg mb-4 border-b pb-2">Filter Products</h3>

            {/* GPU Chipset/Series Dropdown - Only for GPU category */}
            {category === 'gpu' && (
                <div className="mb-6">
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">GPU Type</h4>
                    <select
                        value={selectedChipset ? `${selectedChipset}${selectedSeries ? `|${selectedSeries}` : ''}` : ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (!value) {
                                setSelectedChipset('');
                                setSelectedSeries('');
                            } else if (value === 'NVIDIA' || value === 'AMD') {
                                setSelectedChipset(value);
                                setSelectedSeries('');
                            } else {
                                const [chipset, series] = value.split('|');
                                setSelectedChipset(chipset);
                                setSelectedSeries(series);
                            }
                        }}
                        className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                    >
                        <option value="">All Graphics Cards</option>

                        {/* NVIDIA Section */}
                        <optgroup label="NVIDIA">
                            <option value="NVIDIA">All NVIDIA</option>
                            {gpuData.seriesByChipset['NVIDIA']?.map(series => (
                                <option key={`NVIDIA-${series}`} value={`NVIDIA|${series}`}>
                                    &nbsp;&nbsp;{series}
                                </option>
                            ))}
                        </optgroup>

                        {/* AMD Section */}
                        <optgroup label="AMD">
                            <option value="AMD">All AMD</option>
                            {gpuData.seriesByChipset['AMD']?.map(series => (
                                <option key={`AMD-${series}`} value={`AMD|${series}`}>
                                    &nbsp;&nbsp;{series}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                </div>
            )}

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
