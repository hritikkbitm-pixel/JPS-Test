import { MetadataRoute } from 'next';
import { API_URL } from '@/config';

/**
 * Dynamic Sitemap Generator for JPS Enterprises
 * 
 * This generates a sitemap that includes:
 * - Static pages (homepage, news, about, contact, policies)
 * - Dynamic product pages (fetched from API)
 * 
 * The sitemap is revalidated by Next.js ISR, so it stays fresh.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://jpsenterprises.in';

    // Static pages with their SEO priorities
    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), priority: 1.0, changeFrequency: 'weekly' },
        { url: `${baseUrl}/news`, lastModified: new Date(), priority: 0.9, changeFrequency: 'hourly' },
        { url: `${baseUrl}/about`, lastModified: new Date(), priority: 0.5, changeFrequency: 'monthly' },
        { url: `${baseUrl}/contact`, lastModified: new Date(), priority: 0.5, changeFrequency: 'monthly' },
        { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), priority: 0.3, changeFrequency: 'yearly' },
        { url: `${baseUrl}/refund-policy`, lastModified: new Date(), priority: 0.3, changeFrequency: 'yearly' },
        { url: `${baseUrl}/shipping-policy`, lastModified: new Date(), priority: 0.3, changeFrequency: 'yearly' },
        { url: `${baseUrl}/terms`, lastModified: new Date(), priority: 0.3, changeFrequency: 'yearly' },
    ];

    // Dynamic product pages
    let productPages: MetadataRoute.Sitemap = [];
    try {
        const res = await fetch(`${API_URL}/products?limit=1000`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (res.ok) {
            const data = await res.json();
            const products = data.items || data || [];

            productPages = products.map((product: { _id: string; updatedAt?: string }) => ({
                url: `${baseUrl}/product/${product._id}`,
                lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
                priority: 0.8,
                changeFrequency: 'daily' as const,
            }));
        }
    } catch (error) {
        console.error('Sitemap: Failed to fetch products for sitemap', error);
    }

    return [...staticPages, ...productPages];
}
