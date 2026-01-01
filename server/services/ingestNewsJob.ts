/**
 * Scheduled RSS Ingestion Job for JPS Hardware News
 * 
 * Wires together the entire RSS pipeline:
 * Fetch → Normalize → Filter → Deduplicate → Store
 * 
 * Can be called by:
 * - Cron job
 * - Serverless scheduler
 * - Manual trigger via API
 */

import { fetchAndNormalizeFeeds } from './rssFetcher';
import { processArticles } from './newsFilter';
import { newsStore } from './newsStore';
import { getEnabledSources } from '../config/rssSources';

// --- Types ---

export interface IngestionResult {
    success: boolean;
    timestamp: string;
    stats: {
        sourcesEnabled: number;
        articlesFetched: number;
        articlesAfterDateFilter: number;
        articlesAfterKeywordFilter: number;
        articlesAfterDedup: number;
        articlesStored: number;
    };
    errors: string[];
    duration: number;
}

// --- Main Job Function ---

/**
 * Run the complete news ingestion pipeline
 * 
 * @param options - Optional configuration
 * @returns IngestionResult with stats and status
 */
export async function runNewsIngestionJob(options?: {
    days?: number;
    skipKeywordFilter?: boolean;
}): Promise<IngestionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const stats = {
        sourcesEnabled: 0,
        articlesFetched: 0,
        articlesAfterDateFilter: 0,
        articlesAfterKeywordFilter: 0,
        articlesAfterDedup: 0,
        articlesStored: 0
    };

    console.log('\n' + '='.repeat(50));
    console.log('🚀 STARTING NEWS INGESTION JOB');
    console.log('='.repeat(50) + '\n');

    try {
        // Step 0: Check enabled sources
        const sources = getEnabledSources();
        stats.sourcesEnabled = sources.length;
        console.log(`📋 Enabled sources: ${stats.sourcesEnabled}`);

        if (stats.sourcesEnabled === 0) {
            throw new Error('No enabled RSS sources found');
        }

        // Step 1: Fetch and normalize all feeds
        console.log('\n--- STEP 1: Fetching RSS Feeds ---');
        const rawArticles = await fetchAndNormalizeFeeds();
        stats.articlesFetched = rawArticles.length;
        console.log(`📰 Total articles fetched: ${stats.articlesFetched}`);

        if (stats.articlesFetched === 0) {
            console.warn('⚠️ No articles fetched from any source');
            return {
                success: true,
                timestamp: new Date().toISOString(),
                stats,
                errors,
                duration: Date.now() - startTime
            };
        }

        // Step 2: Process (filter + dedupe)
        console.log('\n--- STEP 2: Filtering & Deduplicating ---');
        const { days = 7, skipKeywordFilter = false } = options || {};

        // Import filter functions directly to track intermediate counts
        const { filterByDate, filterByKeywords, deduplicateArticles } = await import('./newsFilter');

        // 2a: Date filter
        let processed = filterByDate(rawArticles, days);
        stats.articlesAfterDateFilter = processed.length;
        console.log(`📅 After date filter (${days} days): ${stats.articlesAfterDateFilter}`);

        // 2b: Keyword filter
        if (!skipKeywordFilter) {
            processed = filterByKeywords(processed);
            stats.articlesAfterKeywordFilter = processed.length;
            console.log(`🔍 After keyword filter: ${stats.articlesAfterKeywordFilter}`);
        } else {
            stats.articlesAfterKeywordFilter = processed.length;
            console.log('⏭️ Keyword filter skipped');
        }

        // 2c: Deduplication
        processed = deduplicateArticles(processed);
        stats.articlesAfterDedup = processed.length;
        console.log(`🧹 After deduplication: ${stats.articlesAfterDedup}`);

        // Step 3: Store
        console.log('\n--- STEP 3: Storing Articles ---');
        await newsStore.saveArticles(processed);

        // Get actual stored count
        const storedArticles = await newsStore.getAllArticles();
        stats.articlesStored = storedArticles.length;
        console.log(`💾 Total articles in store: ${stats.articlesStored}`);

    } catch (error) {
        const errorMessage = (error as Error).message;
        errors.push(errorMessage);
        console.error(`\n❌ INGESTION ERROR: ${errorMessage}`);
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`${success ? '✅' : '❌'} INGESTION JOB ${success ? 'COMPLETED' : 'FAILED'}`);
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log(`📊 Stats: ${stats.articlesFetched} fetched → ${stats.articlesAfterDedup} processed → ${stats.articlesStored} stored`);
    if (errors.length > 0) {
        console.log(`⚠️ Errors: ${errors.join(', ')}`);
    }
    console.log('='.repeat(50) + '\n');

    return {
        success,
        timestamp: new Date().toISOString(),
        stats,
        errors,
        duration
    };
}

export default runNewsIngestionJob;
