/**
 * RSS Source Registry for JPS Hardware News
 * 
 * This module defines a whitelisted list of RSS feeds for hardware news.
 * Used by:
 * - RSS Fetcher service
 * - Admin panel (for enabling/disabling sources)
 * - Filtering logic
 */

// --- Type Definitions ---

export interface RSSSource {
    /** Unique identifier for the source */
    id: string;
    /** Display name of the source */
    name: string;
    /** Full URL to the RSS/Atom feed */
    rssUrl: string;
    /** Whether this source is currently active */
    enabled: boolean;
    /** Optional: Category tags for filtering */
    tags?: string[];
}

// --- RSS Source Registry ---

export const rssSources: RSSSource[] = [
    {
        id: 'anandtech',
        name: 'AnandTech',
        rssUrl: 'https://www.anandtech.com/rss/',
        enabled: true,
        tags: ['reviews', 'hardware', 'cpus', 'gpus']
    },
    {
        id: 'tomshardware',
        name: "Tom's Hardware",
        rssUrl: 'https://www.tomshardware.com/feeds/all',
        enabled: true,
        tags: ['news', 'reviews', 'benchmarks']
    },
    {
        id: 'techpowerup',
        name: 'TechPowerUp',
        rssUrl: 'https://www.techpowerup.com/rss/news',
        enabled: true,
        tags: ['news', 'gpus', 'drivers']
    },
    {
        id: 'videocardz',
        name: 'Videocardz',
        rssUrl: 'https://videocardz.com/feed',
        enabled: true,
        tags: ['leaks', 'gpus', 'rumors']
    }
];

// --- Helper Functions ---

/**
 * Get all enabled RSS sources
 */
export const getEnabledSources = (): RSSSource[] => {
    return rssSources.filter(source => source.enabled);
};

/**
 * Get a source by its ID
 */
export const getSourceById = (id: string): RSSSource | undefined => {
    return rssSources.find(source => source.id === id);
};

/**
 * Get sources by tag
 */
export const getSourcesByTag = (tag: string): RSSSource[] => {
    return rssSources.filter(source => source.tags?.includes(tag));
};

export default rssSources;
