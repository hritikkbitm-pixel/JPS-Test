import React from 'react';
import { Product } from '@/lib/data';

interface ProductSpecsProps {
    product: Product;
}

export default function ProductSpecs({ product }: ProductSpecsProps) {
    const specs = product.specs as Record<string, any>;
    const ignoredKeys = ['description', 'short_description', 'long_description', 'key_features', 'image', 'images', 'stock_status'];

    // Filter valid specs
    const validSpecs = Object.entries(specs).filter(([key, value]) => {
        if (ignoredKeys.includes(key)) return false;
        if (!value) return false;
        if (typeof value === 'object') return false; // Ignore arrays/objects for table
        return true;
    });

    if (validSpecs.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8">
            <h2 className="text-xl font-black uppercase text-gray-800 mb-6 flex items-center gap-2">
                <i className="fas fa-list-ul text-brand-red"></i> Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {validSpecs.map(([key, value], idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <span className="text-xs font-bold uppercase text-gray-500 tracking-wide">
                            {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 text-right">
                            {String(value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
