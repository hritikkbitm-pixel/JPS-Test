'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/config';
import ProductCard from '@/components/ProductCard';
import SidebarFilter from '@/components/SidebarFilter';
import { Product } from '@/lib/data';

interface Campaign {
    id: string;
    name: string;
    slug: string;
    filters: Record<string, any>;
}

interface Season {
    id: string;
    name: string;
    slug: string;
}

export default function CampaignPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [season, setSeason] = useState<Season | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                // Fetch campaign metadata
                const metaRes = await fetch(`${API_URL}/campaigns/${slug}`);
                if (!metaRes.ok) {
                    throw new Error('Campaign not found');
                }
                const metaData = await metaRes.json();
                setCampaign(metaData.campaign);
                setSeason(metaData.season);

                // Fetch filtered products
                const productsRes = await fetch(`${API_URL}/campaigns/${slug}/products`);
                const productsData = await productsRes.json();
                setProducts(productsData);
                setFilteredProducts(productsData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCampaign();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
            </div>
        );
    }

    if (error || !campaign || !season) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-3xl font-bold mb-4">Campaign Not Found</h1>
                <p className="text-gray-600 mb-8">This campaign is no longer available or the season has ended.</p>
                <Link href="/" className="bg-brand-red text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-red-700 transition">
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 py-8">
                <div className="container mx-auto px-4">
                    {/* Breadcrumb */}
                    <nav className="text-sm text-red-100 mb-4">
                        <Link href="/" className="hover:text-white">Home</Link>
                        <span className="mx-2">/</span>
                        <Link href={`/season/${season.slug}`} className="hover:text-white">{season.name}</Link>
                        <span className="mx-2">/</span>
                        <span className="text-white font-medium">{campaign.name}</span>
                    </nav>
                    <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                        {campaign.name}
                    </h1>
                    <p className="text-red-100 mt-2">
                        {products.length} products available
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Filter */}
                    <div className="lg:col-span-1">
                        <SidebarFilter
                            products={products}
                            onFilterChange={setFilteredProducts}
                            category={campaign.filters?.category || ''}
                        />
                    </div>

                    {/* Product Grid */}
                    <div className="lg:col-span-3">
                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-gray-500">
                                <i className="fas fa-search text-4xl mb-4"></i>
                                <p>No products match your filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
