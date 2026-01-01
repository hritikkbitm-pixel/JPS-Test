/**
 * Hardware News API Routes
 * 
 * GET /api/news - Get paginated news articles
 * POST /api/news/refresh - Trigger manual refresh (admin only)
 */

const express = require('express');
const router = express.Router();

// In-memory store fallback (since TypeScript services may not load in plain Node)
let articlesStore = [];
let lastRefreshTime = null;

// --- Auto-Refresh Configuration ---
const REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Internal refresh function (reusable)
async function doRefresh() {
    try {
        const Parser = require('rss-parser');
        const parser = new Parser({
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            }
        });

        const sources = [
            { id: 'techpowerup', name: 'TechPowerUp', rssUrl: 'https://www.techpowerup.com/rss/news' },
            { id: 'wccftech', name: 'Wccftech', rssUrl: 'https://wccftech.com/feed/' },
            { id: 'notebookcheck', name: 'NotebookCheck', rssUrl: 'https://www.notebookcheck.net/News.152.100.html' },
            { id: 'guru3d', name: 'Guru3D', rssUrl: 'https://www.guru3d.com/news/feed' }
        ];

        const allArticles = [];

        for (const source of sources) {
            try {
                const feed = await parser.parseURL(source.rssUrl);
                for (const item of (feed.items || []).slice(0, 20)) {
                    let publishedAt = item.isoDate || item.pubDate ? new Date(item.isoDate || item.pubDate).toISOString() : new Date().toISOString();
                    let summary = (item.contentSnippet || item.content || item.description || '').replace(/<[^>]*>/g, '').slice(0, 300);

                    allArticles.push({
                        title: item.title || 'Untitled',
                        summary: summary,
                        link: item.link || '',
                        publishedAt: publishedAt,
                        sourceId: source.id,
                        sourceName: source.name
                    });
                }
                console.log(`✅ [Auto] ${source.name}: ${feed.items?.length || 0} articles`);
            } catch (e) {
                console.error(`❌ [Auto] ${source.name}:`, e.message);
            }
        }

        allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        articlesStore = allArticles.slice(0, 100);
        lastRefreshTime = new Date().toISOString();
        console.log(`📰 [Auto-Refresh] Stored ${articlesStore.length} articles at ${lastRefreshTime}`);
    } catch (error) {
        console.error('❌ Auto-refresh failed:', error.message);
    }
}

// Start auto-refresh scheduler
setTimeout(() => {
    console.log('🚀 [News] Running initial auto-refresh...');
    doRefresh();
}, 5000); // First refresh 5 seconds after server start

setInterval(() => {
    console.log('🔄 [News] Running scheduled refresh...');
    doRefresh();
}, REFRESH_INTERVAL_MS);

console.log(`⏰ [News] Auto-refresh scheduled every ${REFRESH_INTERVAL_MS / 1000 / 60} minutes`);

// --- Validation Helpers ---

function validatePage(value) {
    const page = parseInt(value, 10);
    return isNaN(page) || page < 1 ? 1 : page;
}

function validateLimit(value) {
    const limit = parseInt(value, 10);
    if (isNaN(limit) || limit < 1) return 20;
    if (limit > 100) return 100;
    return limit;
}

// --- GET /api/news ---

router.get('/', async (req, res) => {
    try {
        const page = validatePage(req.query.page);
        const limit = validateLimit(req.query.limit);
        const sourceFilter = req.query.source?.toString().toLowerCase();
        const keywordFilter = req.query.keyword?.toString().toLowerCase();

        let articles = [...articlesStore];

        // Apply source filter
        if (sourceFilter) {
            articles = articles.filter(a => a.sourceId?.toLowerCase() === sourceFilter);
        }

        // Apply keyword filter
        if (keywordFilter) {
            articles = articles.filter(a =>
                a.title?.toLowerCase().includes(keywordFilter) ||
                a.summary?.toLowerCase().includes(keywordFilter)
            );
        }

        // Pagination
        const total = articles.length;
        const totalPages = Math.ceil(total / limit);
        const start = (page - 1) * limit;
        const end = start + limit;
        const items = articles.slice(start, end);

        res.json({ items, page, limit, total, totalPages });

    } catch (error) {
        console.error('GET /api/news error:', error);
        res.status(500).json({ error: 'Failed to fetch news', items: [], page: 1, total: 0 });
    }
});

// --- POST /api/news/refresh ---

router.post('/refresh', async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'];
        const admins = ['hritik@jps.com', 'admin@jps.com'];

        if (!userEmail || !admins.includes(userEmail)) {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        // Fetch RSS feeds using rss-parser
        const Parser = require('rss-parser');
        const parser = new Parser({
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            }
        });

        const sources = [
            { id: 'techpowerup', name: 'TechPowerUp', rssUrl: 'https://www.techpowerup.com/rss/news' },
            { id: 'wccftech', name: 'Wccftech', rssUrl: 'https://wccftech.com/feed/' },
            { id: 'notebookcheck', name: 'NotebookCheck', rssUrl: 'https://www.notebookcheck.net/News.152.100.html' },
            { id: 'guru3d', name: 'Guru3D', rssUrl: 'https://www.guru3d.com/news/feed' }
        ];

        const allArticles = [];

        for (const source of sources) {
            try {
                console.log(`📡 Fetching: ${source.name}`);
                const feed = await parser.parseURL(source.rssUrl);

                for (const item of (feed.items || []).slice(0, 20)) {
                    allArticles.push({
                        title: item.title || 'Untitled',
                        summary: (item.contentSnippet || item.content || item.description || '').replace(/<[^>]*>/g, '').slice(0, 300),
                        link: item.link || '',
                        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                        sourceId: source.id,
                        sourceName: source.name
                    });
                }
                console.log(`✅ ${source.name}: Fetched ${feed.items?.length || 0} articles`);
            } catch (e) {
                console.error(`❌ Failed to fetch ${source.name}:`, e.message);
            }
        }

        // Sort by date and limit to 100
        allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        articlesStore = allArticles.slice(0, 100);

        res.json({
            success: true,
            message: 'News refresh completed',
            stats: { fetched: allArticles.length, stored: articlesStore.length }
        });

    } catch (error) {
        console.error('POST /api/news/refresh error:', error);
        res.status(500).json({ error: 'Failed to refresh news' });
    }
});

// --- GET /api/news/status ---

router.get('/status', async (req, res) => {
    res.json({
        available: true,
        storage: 'memory',
        maxArticles: 100,
        articleCount: articlesStore.length
    });
});

module.exports = router;
