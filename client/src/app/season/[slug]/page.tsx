'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/config';

interface OfferTile {
    id: string;
    title: string;
    subtitle: string;
    image_url: string;
    campaign: {
        slug: string;
        name: string;
    } | null;
}

interface Season {
    id: string;
    name: string;
    slug: string;
    hero_banner_image: string;
    subtitle: string;
}

export default function SeasonPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [season, setSeason] = useState<Season | null>(null);
    const [tiles, setTiles] = useState<OfferTile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSeason = async () => {
            try {
                const res = await fetch(`${API_URL}/seasons/${slug}`);
                if (!res.ok) {
                    throw new Error('Season not found');
                }
                const data = await res.json();
                setSeason(data.season);
                setTiles(data.tiles);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchSeason();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
            </div>
        );
    }

    if (error || !season) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-3xl font-bold mb-4">Season Not Found</h1>
                <p className="text-gray-600 mb-8">The seasonal campaign you're looking for doesn't exist or has ended.</p>
                <Link href="/" className="bg-brand-red text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-red-700 transition">
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Banner */}
            <div className="relative h-64 md:h-96 bg-gradient-to-r from-red-600 to-red-800 overflow-hidden">
                {season.hero_banner_image && (
                    <img
                        src={season.hero_banner_image}
                        alt={season.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight drop-shadow-lg">
                        {season.name}
                    </h1>
                    {season.subtitle && (
                        <p className="mt-4 text-lg md:text-xl max-w-2xl opacity-90">
                            {season.subtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="container mx-auto px-4 py-4">
                <nav className="text-sm text-gray-500">
                    <Link href="/" className="hover:text-brand-red">Home</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-800 font-medium">{season.name}</span>
                </nav>
            </div>

            {/* Offer Tiles Grid */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {tiles.map((tile) => (
                        <Link
                            key={tile.id}
                            href={tile.campaign ? `/campaign/${tile.campaign.slug}` : '#'}
                            className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                                {tile.image_url ? (
                                    <img
                                        src={tile.image_url}
                                        alt={tile.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <i className="fas fa-gift text-4xl"></i>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-gray-800 group-hover:text-brand-red transition">
                                    {tile.title}
                                </h3>
                                {tile.subtitle && (
                                    <p className="text-sm text-red-500 font-semibold mt-1">
                                        {tile.subtitle}
                                    </p>
                                )}
                                <div className="mt-3 text-xs text-brand-red font-bold uppercase tracking-wider flex items-center gap-1">
                                    Shop Now <i className="fas fa-arrow-right"></i>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {tiles.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <i className="fas fa-box-open text-4xl mb-4"></i>
                        <p>No offers available in this campaign yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
