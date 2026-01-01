/**
 * RSS Fetch & Normalization Engine for JPS Hardware News
 * 
 * Fetches feeds from the RSS Source Registry and normalizes them
 * into a common structure for display and storage.
 */

import Parser from 'rss-parser';
import { getEnabledSources, RSSSource } from '../config/rssSources';

// --- Type Definitions ---

export interface NormalizedArticle {
    /** Article title */
    title: string;
    /** Short summary/description (HTML stripped) */
    summary: string;
    /** Link to the full article */
    link: string;
    /** Publication date (ISO 8601 format, UTC) */
    publishedAt: string;
    /** ID of the source from the registry */
    sourceId: string;
    /** Display name of the source */
    sourceName: string;
    /** Optional: Thumbnail image URL */
    imageUrl?: string;
}

// --- RSS Parser Instance ---

const parser = new Parser({
    timeout: 10000, // 10 second timeout per feed
    headers: {
        'User-Agent': 'JPS-Enterprises-News-Bot/1.0'
    }
});

// --- Helper Functions ---

/**
 * Strip HTML tags from a string
 */
function stripHtml(html: string | undefined): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
}

/**
 * Normalize a date string to ISO 8601 UTC format
 */
function normalizeDate(dateStr: string | undefined): string {
    if (!dateStr) return new Date().toISOString();

    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return new Date().toISOString();
        }
        return date.toISOString();
    } catch {
        return new Date().toISOString();
    }
}

/**
 * Extract image URL from content or media fields
 */
function extractImageUrl(item: Parser.Item): string | undefined {
    // Check for media:content
    const media = (item as any)['media:content'];
    if (media?.url) return media.url;

    // Check for enclosure
    if (item.enclosure?.url) return item.enclosure.url;

    // Try to extract from content
    const content = item.content || item['content:encoded'] || '';
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) return imgMatch[1];

    return undefined;
}

/**
 * Truncate summary to a reasonable length
 */
function truncateSummary(text: string, maxLength: number = 300): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// --- Main Fetch Function ---

/**
 * Fetch a single RSS feed and normalize its items
 */
async function fetchSingleFeed(source: RSSSource): Promise<NormalizedArticle[]> {
    try {
        console.log(`📡 Fetching RSS feed: ${source.name}`);
        const feed = await parser.parseURL(source.rssUrl);

        const articles: NormalizedArticle[] = (feed.items || []).map(item => ({
            title: item.title || 'Untitled',
            summary: truncateSummary(stripHtml(item.contentSnippet || item.content || item.description)),
            link: item.link || '',
            publishedAt: normalizeDate(item.pubDate || item.isoDate),
            sourceId: source.id,
            sourceName: source.name,
            imageUrl: extractImageUrl(item)
        }));

        console.log(`✅ ${source.name}: Fetched ${articles.length} articles`);
        return articles;

    } catch (error) {
        // Log error but don't fail the entire job
        console.error(`❌ Failed to fetch ${source.name}:`, (error as Error).message);
        return [];
    }
}

/**
 * Fetch and normalize all enabled RSS feeds
 * 
 * @returns Flat array of normalized articles from all sources, sorted by date (newest first)
 */
export async function fetchAndNormalizeFeeds(): Promise<NormalizedArticle[]> {
    const sources = getEnabledSources();

    if (sources.length === 0) {
        console.warn('⚠️ No enabled RSS sources found');
        return [];
    }

    console.log(`🚀 Starting RSS fetch for ${sources.length} sources...`);

    // Fetch all feeds in parallel
    const results = await Promise.allSettled(
        sources.map(source => fetchSingleFeed(source))
    );

    // Flatten results, ignoring failed fetches
    const allArticles: NormalizedArticle[] = [];
    for (const result of results) {
        if (result.status === 'fulfilled') {
            allArticles.push(...result.value);
        }
    }

    // Sort by publication date (newest first)
    allArticles.sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    console.log(`📰 Total articles fetched: ${allArticles.length}`);
    return allArticles;
}

/**
 * Fetch feeds from specific sources only
 */
export async function fetchFromSources(sourceIds: string[]): Promise<NormalizedArticle[]> {
    const sources = getEnabledSources().filter(s => sourceIds.includes(s.id));

    const results = await Promise.allSettled(
        sources.map(source => fetchSingleFeed(source))
    );

    const allArticles: NormalizedArticle[] = [];
    for (const result of results) {
        if (result.status === 'fulfilled') {
            allArticles.push(...result.value);
        }
    }

    allArticles.sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return allArticles;
}

export default fetchAndNormalizeFeeds;
