'use client';

import React, { useState } from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/lib/data';

interface FeaturedProductsProps {
    products: Product[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const featuredProducts = products.filter(p => p.featured);

    const handlePrevious = () => {
        setCurrentIndex((prev) => {
            const newIndex = prev - 8;
            return newIndex < 0 ? Math.max(0, featuredProducts.length - 8) : newIndex;
        });
    };

    const handleNext = () => {
        setCurrentIndex((prev) => {
            const newIndex = prev + 8;
            return newIndex >= featuredProducts.length ? 0 : newIndex;
        });
    };

    if (featuredProducts.length === 0) {
        return null;
    }

    const visibleProducts = featuredProducts.slice(currentIndex, currentIndex + 8);
    const showControls = featuredProducts.length > 8;

    return (
        <section className="my-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black uppercase tracking-tight text-gray-800">
                    <i className="fas fa-star text-yellow-500 mr-2"></i>
                    Featured Products
                </h2>
                {showControls && (
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrevious}
                            className="bg-white border-2 border-gray-200 hover:border-brand-red hover:text-brand-red text-gray-600 w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md"
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <button
                            onClick={handleNext}
                            className="bg-white border-2 border-gray-200 hover:border-brand-red hover:text-brand-red text-gray-600 w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md"
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                )}
            </div>

            <div className="relative overflow-hidden">
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-500 ease-in-out"
                    style={{ transform: `translateX(0)` }}
                >
                    {visibleProducts.map((product, idx) => (
                        <div
                            key={product.id}
                            className="relative opacity-0 animate-fade-in"
                            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'forwards' }}
                        >
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-lg">
                                <i className="fas fa-star text-sm"></i>
                            </div>
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>

                {showControls && (
                    <div className="flex justify-center mt-6 gap-2">
                        {Array.from({ length: Math.ceil(featuredProducts.length / 8) }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx * 8)}
                                className={`h-2 rounded-full transition-all duration-300 ${Math.floor(currentIndex / 8) === idx
                                        ? 'bg-brand-red w-6'
                                        : 'bg-gray-300 hover:bg-gray-400 w-2'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
