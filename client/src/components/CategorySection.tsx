'use client';

import React from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/lib/data';

interface CategorySectionProps {
    title: string;
    category: string;
    products: Product[];
    onViewAll: () => void;
}

export default function CategorySection({ title, category, products, onViewAll }: CategorySectionProps) {
    const categoryProducts = products.filter(p => p.category === category).slice(0, 8);

    if (categoryProducts.length === 0) {
        return null;
    }

    return (
        <section className="my-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black uppercase tracking-tight text-gray-800">
                    {title}
                </h2>
                <button
                    onClick={onViewAll}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-2 rounded uppercase text-sm tracking-wider transition-all duration-300 shadow-sm hover:shadow-md"
                >
                    View All <i className="fas fa-arrow-right ml-2"></i>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categoryProducts.map((product, idx) => (
                    <div
                        key={product.id}
                        className="opacity-0 animate-fade-in"
                        style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'forwards' }}
                    >
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </section>
    );
}
