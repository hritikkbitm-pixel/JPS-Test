/**
 * Keyword Filter & Deduplication Module for JPS Hardware News
 * 
 * Filters articles by hardware-relevant keywords and removes duplicates.
 */

import { NormalizedArticle } from './rssFetcher';

// --- Keyword Configuration ---

/**
 * Articles must match at least ONE of these keywords (case-insensitive)
 */
export const INCLUDE_KEYWORDS = [
    // GPUs
    'GPU', 'RTX', 'GeForce', 'Radeon', 'RX', 'NVIDIA', 'Intel Arc',
    'HBM', 'GDDR6', 'GDDR7', 'VRAM',

    // CPUs
    'CPU', 'Intel', 'AMD', 'Ryzen', 'Core', 'Processor',

    // Memory
    'DDR4', 'DDR5', 'RAM', 'Memory',

    // Motherboards
    'Chipset', 'Motherboard', 'Z890', 'X870', 'B650',

    // Pricing & Supply
    'Price hike', 'Price drop', 'MSRP', 'Price cut',
    'Supply shortage', 'Wafer', 'Fab', 'TSMC', 'Samsung Foundry',

    // Enterprise & AI
    'AI accelerator', 'Datacenter GPU', 'Datacenter',

    // Peripherals
    'Laptop review', 'Gaming mouse', 'Headphones', 'Keyboard', 'Monitor',
    'Mechanical keyboard', 'Gaming headset'
];

/**
 * Articles matching ANY of these keywords are excluded (case-insensitive)
 */
export const EXCLUDE_KEYWORDS = [
    'Smartphone', 'Mobile', 'iPhone', 'Android',
    'Camera', 'Wearable', 'Smartwatch', 'Apple Watch',
    'Fitness tracker', 'Tablet'
];

// --- Filter Functions ---

/**
 * Check if text contains any keyword from a list (case-insensitive)
 */
function containsKeyword(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Filter articles by include/exclude keywords
 * 
 * Rules:
 * - Must match ≥1 include keyword
 * - Must NOT match any exclude keyword
 * - Checks both title and summary
 */
export function filterByKeywords(articles: NormalizedArticle[]): NormalizedArticle[] {
    return articles.filter(article => {
        const searchText = `${article.title} ${article.summary}`;

        // Must match at least one include keyword
        const hasInclude = containsKeyword(searchText, INCLUDE_KEYWORDS);
        if (!hasInclude) return false;

        // Must NOT match any exclude keyword
        const hasExclude = containsKeyword(searchText, EXCLUDE_KEYWORDS);
        if (hasExclude) return false;

        return true;
    });
}

/**
 * Filter articles to only include those from the last N days
 */
export function filterByDate(articles: NormalizedArticle[], days: number = 7): NormalizedArticle[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return articles.filter(article => {
        const articleDate = new Date(article.publishedAt);
        return articleDate >= cutoffDate;
    });
}

// --- Deduplication Functions ---

/**
 * Normalize a title for comparison (lowercase, remove punctuation, trim)
 */
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Remove duplicate articles
 * 
 * Deduplication rules:
 * 1. Same link = duplicate
 * 2. Same normalized title + same source = duplicate
 */
export function deduplicateArticles(articles: NormalizedArticle[]): NormalizedArticle[] {
    const seenLinks = new Set<string>();
    const seenTitleSource = new Set<string>();
    const result: NormalizedArticle[] = [];

    for (const article of articles) {
        // Check by link
        if (article.link && seenLinks.has(article.link)) {
            continue;
        }

        // Check by normalized title + source
        const titleSourceKey = `${normalizeTitle(article.title)}|${article.sourceId}`;
        if (seenTitleSource.has(titleSourceKey)) {
            continue;
        }

        // Mark as seen
        if (article.link) seenLinks.add(article.link);
        seenTitleSource.add(titleSourceKey);

        result.push(article);
    }

    return result;
}

// --- Combined Pipeline ---

/**
 * Apply all filters and deduplication in sequence
 * 
 * Pipeline:
 * 1. Filter by date (last 7 days)
 * 2. Filter by keywords
 * 3. Deduplicate
 */
export function processArticles(articles: NormalizedArticle[], options?: {
    days?: number;
    skipKeywordFilter?: boolean;
}): NormalizedArticle[] {
    const { days = 7, skipKeywordFilter = false } = options || {};

    let processed = articles;

    // Step 1: Filter by date
    processed = filterByDate(processed, days);
    console.log(`📅 After date filter (${days} days): ${processed.length} articles`);

    // Step 2: Filter by keywords
    if (!skipKeywordFilter) {
        processed = filterByKeywords(processed);
        console.log(`🔍 After keyword filter: ${processed.length} articles`);
    }

    // Step 3: Deduplicate
    processed = deduplicateArticles(processed);
    console.log(`🧹 After deduplication: ${processed.length} articles`);

    return processed;
}

export default processArticles;
