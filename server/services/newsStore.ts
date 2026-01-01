/**
 * News Storage Layer for JPS Hardware News
 * 
 * Storage-agnostic implementation with:
 * - Redis support (preferred)
 * - In-memory fallback
 * - Max 100 articles limit
 * - Sorted by publishedAt DESC
 * - Duplicate prevention
 */

import { NormalizedArticle } from './rssFetcher';

// --- Configuration ---

const MAX_ARTICLES = 100;
const REDIS_KEY = 'jps:news:articles';

// --- Storage Interface ---

interface StorageAdapter {
    save(articles: NormalizedArticle[]): Promise<void>;
    getAll(): Promise<NormalizedArticle[]>;
    clear(): Promise<void>;
}

// --- In-Memory Store (Fallback) ---

class InMemoryStore implements StorageAdapter {
    private articles: NormalizedArticle[] = [];

    async save(articles: NormalizedArticle[]): Promise<void> {
        // Merge with existing, deduplicate by link
        const existingLinks = new Set(this.articles.map(a => a.link));
        const newArticles = articles.filter(a => !existingLinks.has(a.link));

        this.articles = [...newArticles, ...this.articles]
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
            .slice(0, MAX_ARTICLES);
    }

    async getAll(): Promise<NormalizedArticle[]> {
        return [...this.articles];
    }

    async clear(): Promise<void> {
        this.articles = [];
    }
}

// --- Redis Store ---

class RedisStore implements StorageAdapter {
    private client: any;

    constructor(redisClient: any) {
        this.client = redisClient;
    }

    async save(articles: NormalizedArticle[]): Promise<void> {
        if (!this.client || !this.client.isOpen) {
            throw new Error('Redis client not connected');
        }

        // Get existing articles
        const existingRaw = await this.client.get(REDIS_KEY);
        const existing: NormalizedArticle[] = existingRaw ? JSON.parse(existingRaw) : [];

        // Merge, deduplicate, sort, and limit
        const existingLinks = new Set(existing.map(a => a.link));
        const newArticles = articles.filter(a => !existingLinks.has(a.link));

        const merged = [...newArticles, ...existing]
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
            .slice(0, MAX_ARTICLES);

        // Save back to Redis
        await this.client.set(REDIS_KEY, JSON.stringify(merged));
    }

    async getAll(): Promise<NormalizedArticle[]> {
        if (!this.client || !this.client.isOpen) {
            throw new Error('Redis client not connected');
        }

        const raw = await this.client.get(REDIS_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    async clear(): Promise<void> {
        if (!this.client || !this.client.isOpen) {
            throw new Error('Redis client not connected');
        }

        await this.client.del(REDIS_KEY);
    }
}

// --- News Store Singleton ---

class NewsStore {
    private adapter: StorageAdapter;
    private isRedis: boolean = false;

    constructor() {
        // Default to in-memory store
        this.adapter = new InMemoryStore();
        console.log('📦 NewsStore initialized with in-memory storage');
    }

    /**
     * Connect to Redis (optional upgrade from in-memory)
     */
    async connectRedis(redisClient: any): Promise<void> {
        try {
            if (redisClient && redisClient.isOpen) {
                this.adapter = new RedisStore(redisClient);
                this.isRedis = true;
                console.log('📦 NewsStore upgraded to Redis storage');
            }
        } catch (error) {
            console.warn('⚠️ Failed to connect Redis, using in-memory store:', (error as Error).message);
        }
    }

    /**
     * Save articles to storage
     */
    async saveArticles(articles: NormalizedArticle[]): Promise<void> {
        if (articles.length === 0) return;

        try {
            await this.adapter.save(articles);
            console.log(`💾 Saved ${articles.length} articles to ${this.isRedis ? 'Redis' : 'memory'}`);
        } catch (error) {
            console.error('❌ Failed to save articles:', (error as Error).message);

            // Fallback to in-memory if Redis fails
            if (this.isRedis) {
                console.log('⚠️ Falling back to in-memory storage');
                this.adapter = new InMemoryStore();
                this.isRedis = false;
                await this.adapter.save(articles);
            }
        }
    }

    /**
     * Get paginated articles
     */
    async getArticles(options?: { page?: number; limit?: number }): Promise<{
        articles: NormalizedArticle[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { page = 1, limit = 20 } = options || {};

        const allArticles = await this.adapter.getAll();
        const total = allArticles.length;
        const totalPages = Math.ceil(total / limit);

        const start = (page - 1) * limit;
        const end = start + limit;
        const articles = allArticles.slice(start, end);

        return {
            articles,
            total,
            page,
            limit,
            totalPages
        };
    }

    /**
     * Get all articles (unpaginated)
     */
    async getAllArticles(): Promise<NormalizedArticle[]> {
        return this.adapter.getAll();
    }

    /**
     * Clear all stored articles
     */
    async clearArticles(): Promise<void> {
        await this.adapter.clear();
        console.log('🗑️ Cleared all stored articles');
    }

    /**
     * Get storage status
     */
    getStatus(): { type: 'redis' | 'memory'; maxArticles: number } {
        return {
            type: this.isRedis ? 'redis' : 'memory',
            maxArticles: MAX_ARTICLES
        };
    }
}

// --- Singleton Export ---

export const newsStore = new NewsStore();

export default newsStore;
