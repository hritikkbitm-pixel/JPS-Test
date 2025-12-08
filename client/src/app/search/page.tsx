'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import ProductCard from '@/components/ProductCard';
import Loading from '@/components/Loading';
import { Product } from '@/lib/data';

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const { products, isLoading } = useShop();
    const [results, setResults] = useState<Product[]>([]);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase().trim();

        // Search Logic
        const filtered = products.filter((product: Product) => {
            // 1. Check Name
            if (product.name.toLowerCase().includes(lowerQuery)) return true;

            // 2. Check Brand
            if (product.brand.toLowerCase().includes(lowerQuery)) return true;

            // 3. Check Category
            if (product.category.toLowerCase().includes(lowerQuery)) return true;

            // 4. Check Specs (CSV Data Pointers)
            if (product.specs) {
                const specsValues = Object.values(product.specs).join(' ').toLowerCase();
                if (specsValues.includes(lowerQuery)) return true;
            }

            return false;
        });

        setResults(filtered);
    }, [query, products]);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">
                Search Results for <span className="text-brand-red">"{query}"</span>
            </h1>

            {isLoading ? (
                <Loading />
            ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {results.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
                    <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
                    <h2 className="text-xl font-bold text-gray-600">No products found</h2>
                    <p className="text-gray-500 mt-2">Try adjusting your search terms or check for typos.</p>
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading search...</div>}>
            <SearchResultsContent />
        </Suspense>
    );
}
