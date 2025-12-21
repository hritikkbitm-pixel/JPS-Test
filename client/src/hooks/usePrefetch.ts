'use client';

import { useCallback, useRef } from 'react';
import { API_URL } from '@/config';

// In-memory cache for prefetched data
const prefetchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Check if data is in cache and still valid
function getCachedData(key: string): any | null {
    const cached = prefetchCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    prefetchCache.delete(key);
    return null;
}

// Store data in cache
function setCachedData(key: string, data: any): void {
    prefetchCache.set(key, { data, timestamp: Date.now() });
}

// Prefetch product details
export async function prefetchProduct(productId: string): Promise<void> {
    const cacheKey = `product-${productId}`;
    if (getCachedData(cacheKey)) return;

    try {
        const res = await fetch(`${API_URL}/products/${productId}`);
        if (res.ok) {
            const data = await res.json();
            setCachedData(cacheKey, data);
        }
    } catch (error) {
        // Silently fail - prefetch is optional
    }
}

// Prefetch category products
export async function prefetchCategory(categoryId: string): Promise<void> {
    const cacheKey = `category-${categoryId}`;
    if (getCachedData(cacheKey)) return;

    try {
        const res = await fetch(`${API_URL}/products?category=${categoryId}&limit=12`);
        if (res.ok) {
            const data = await res.json();
            setCachedData(cacheKey, data);
        }
    } catch (error) {
        // Silently fail
    }
}

// Prefetch user addresses for checkout
export async function prefetchUserAddresses(): Promise<void> {
    const cacheKey = 'user-addresses';
    if (getCachedData(cacheKey)) return;

    try {
        const res = await fetch(`${API_URL}/user/address`);
        if (res.ok) {
            const data = await res.json();
            setCachedData(cacheKey, data);
        }
    } catch (error) {
        // Silently fail
    }
}

// Hook for debounced hover prefetch
export function useHoverPrefetch(prefetchFn: () => Promise<void>, delay: number = 150) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const onMouseEnter = useCallback(() => {
        timeoutRef.current = setTimeout(() => {
            prefetchFn();
        }, delay);
    }, [prefetchFn, delay]);

    const onMouseLeave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    return { onMouseEnter, onMouseLeave };
}

// Get cached data (for use in components)
export function getPrefetchedData(key: string): any | null {
    return getCachedData(key);
}
