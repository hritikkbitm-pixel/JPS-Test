import React from 'react';
import { API_URL } from '@/config';
import { Product } from '@/lib/data';
import UniversalProductView from '@/components/product/UniversalProductView';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// ISR: Revalidate product pages every 5 minutes
export const revalidate = 300;

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    try {
        const res = await fetch(`${API_URL}/products/${id}`, { next: { revalidate: 300 } });
        if (!res.ok) return { title: 'Product Not Found' };
        const product: Product = await res.json();
        return {
            title: `${product.name} | JPS Enterprises`,
            description: `Buy ${product.name} from ${product.brand} at best price. ${product.category} available at JPS Enterprises.`,
        };
    } catch {
        return { title: 'Product | JPS Enterprises' };
    }
}

// Server Component - no 'use client'
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch on server with ISR caching
    const res = await fetch(`${API_URL}/products/${id}`, {
        next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!res.ok) {
        notFound();
    }

    const product: Product = await res.json();

    if (!product) {
        notFound();
    }

    // JSON-LD Product Schema for SEO Rich Results
    const productSchema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        description: `Buy ${product.name} from ${product.brand} at best price.`,
        brand: {
            '@type': 'Brand',
            name: product.brand || 'JPS Enterprises'
        },
        offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: product.price,
            availability: 'https://schema.org/InStock',
            seller: {
                '@type': 'Organization',
                name: 'JPS Enterprises'
            }
        },
        image: product.image,
        category: product.category
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
            <div className="min-h-screen bg-gray-50 pb-20">
                <UniversalProductView product={product} />
            </div>
        </>
    );
}
