'use client';

import React from 'react';
import ProductCard from './ProductCard';
import { Banner, Product } from '@/lib/data';
import Link from 'next/link';

interface PromoBannerProps {
    banner: Banner;
    products: Product[];
}

export default function PromoBanner({ banner, products }: PromoBannerProps) {
    // Filter products based on productIds if provided
    const displayProducts = banner.productIds
        ? products.filter(p => banner.productIds?.includes(p.id)).slice(0, 8)
        : [];

    if (banner.type === 'hero') {
        return null; // Hero banners are handled by HeroCarousel
    }

    // Product Grid Banner
    if (banner.type === 'product-grid' && displayProducts.length > 0) {
        return (
            <section
                className="my-12 p-8 rounded-lg shadow-sm"
                style={{
                    backgroundColor: banner.backgroundColor || '#1a1a1a',
                    color: banner.textColor || '#ffffff'
                }}
            >
                {banner.description && (
                    <div className="mb-6">
                        <p className="text-lg opacity-90 max-w-3xl">
                            {banner.description}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {displayProducts.map((product, idx) => (
                        <div
                            key={product.id}
                            className="opacity-0 animate-fade-in"
                            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'forwards' }}
                        >
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>

                {banner.target && (
                    <div className="mt-8 text-center">
                        <Link
                            href={banner.target}
                            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded uppercase text-sm tracking-wider transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                            View All <i className="fas fa-arrow-right ml-2"></i>
                        </Link>
                    </div>
                )}
            </section>
        );
    }

    // Promotional Banner (full-width with image)
    if (banner.type === 'promo') {
        return (
            <section className="my-12">
                <Link href={banner.target} className="block group">
                    <div
                        className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 h-64 md:h-80"
                        style={{
                            backgroundImage: `url(${banner.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {banner.description && (
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex items-center p-8 md:p-12">
                                <div className="max-w-2xl">
                                    <p className="text-lg md:text-xl text-gray-200 mb-6">
                                        {banner.description}
                                    </p>
                                    <div className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded uppercase text-sm tracking-wider transition-all duration-300 shadow-md group-hover:shadow-lg">
                                        Browse Products <i className="fas fa-arrow-right ml-2"></i>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Link>
            </section>
        );
    }

    return null;
}
