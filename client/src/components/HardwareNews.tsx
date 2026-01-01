'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_URL } from '@/config';

// --- Types ---

interface NewsArticle {
    title: string;
    summary: string;
    link: string;
    publishedAt: string;
    sourceId: string;
    sourceName: string;
    imageUrl?: string;
}

interface NewsResponse {
    items: NewsArticle[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// --- Helper Functions ---

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

// --- Skeleton Loader ---

function NewsCardSkeleton() {
    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
            <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-20 h-5 bg-gray-200 rounded"></div>
                    <div className="w-12 h-4 bg-gray-100 rounded"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-100 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-100 rounded w-5/6"></div>
            </div>
        </div>
    );
}

// --- News Card ---

function NewsCard({ article }: { article: NewsArticle }) {
    return (
        <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-brand-red transition-all duration-300 group block"
        >
            <div className="p-4">
                {/* Header: Source + Time */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-brand-red text-white text-xs font-bold px-2 py-0.5 rounded uppercase">
                        {article.sourceName}
                    </span>
                    <span className="text-gray-400 text-xs">
                        {timeAgo(article.publishedAt)}
                    </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-900 group-hover:text-brand-red transition-colors line-clamp-2 mb-2">
                    {article.title}
                </h3>

                {/* Summary */}
                <p className="text-gray-600 text-sm line-clamp-2">
                    {article.summary}
                </p>

                {/* Read More */}
                <div className="mt-3 flex items-center gap-1 text-brand-red text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Read More
                    <i className="fas fa-external-link-alt text-[10px]"></i>
                </div>
            </div>
        </a>
    );
}

// --- Main Component ---

export default function HardwareNews() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchNews();
    }, [page]);

    async function fetchNews() {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/news?page=${page}&limit=12`);
            const data: NewsResponse = await res.json();

            if (data.items) {
                setArticles(data.items);
                setTotalPages(data.totalPages || 1);
            } else {
                setArticles([]);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load news');
            setArticles([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 py-6">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-3">
                        <i className="fas fa-fire text-2xl text-brand-red animate-pulse"></i>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Hardware News</h1>
                            <p className="text-gray-500 text-sm">Latest updates from top tech sources</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-center">
                        <i className="fas fa-exclamation-circle mr-2"></i>
                        {error}
                        <button onClick={fetchNews} className="ml-4 underline">Retry</button>
                    </div>
                )}

                {/* Loading Skeleton */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <NewsCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {/* News Grid */}
                {!loading && articles.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {articles.map((article, i) => (
                            <NewsCard key={`${article.link}-${i}`} article={article} />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && articles.length === 0 && !error && (
                    <div className="text-center py-16 text-gray-500">
                        <i className="fas fa-newspaper text-4xl mb-4 block opacity-50"></i>
                        <p>No news articles available</p>
                        <button onClick={fetchNews} className="mt-4 text-brand-red underline">Refresh</button>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <span className="px-4 py-2 bg-gray-100 rounded">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
