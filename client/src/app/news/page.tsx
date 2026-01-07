import { Metadata } from 'next';
import HardwareNews from '@/components/HardwareNews';
import { API_URL } from '@/config';

// ISR: Revalidate every 10 minutes
// The page is generated ONCE, then served from cache - super fast!
export const revalidate = 600;

export const metadata: Metadata = {
    title: 'Tech & Hardware News | JPS Enterprises',
    description: 'Latest tech news from top sources including CNET, The Verge, Tom\'s Hardware, and more. Stay updated on GPUs, CPUs, and PC hardware.',
};

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

async function getInitialNews(): Promise<NewsResponse> {
    try {
        const res = await fetch(`${API_URL}/news?page=1&limit=12`, {
            next: { revalidate: 600 }
        });
        if (!res.ok) {
            return { items: [], page: 1, limit: 12, total: 0, totalPages: 0 };
        }
        return res.json();
    } catch {
        return { items: [], page: 1, limit: 12, total: 0, totalPages: 0 };
    }
}

export default async function NewsPage() {
    const initialData = await getInitialNews();

    // JSON-LD ItemList Schema for SEO
    const newsListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Tech & Hardware News',
        description: 'Latest tech news curated by JPS Enterprises',
        numberOfItems: initialData.items.length,
        itemListElement: initialData.items.slice(0, 10).map((article, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'NewsArticle',
                headline: article.title,
                datePublished: article.publishedAt,
                url: article.link,
                publisher: {
                    '@type': 'Organization',
                    name: article.sourceName
                }
            }
        }))
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(newsListSchema) }}
            />
            <HardwareNews initialData={initialData} />
        </>
    );
}
