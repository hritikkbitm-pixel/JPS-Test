'use client';

import React, { useEffect, useState, useRef } from 'react';
import { API_URL } from '@/config';

export default function AnimatedBanner() {
    const [bannerText, setBannerText] = useState('');
    const [isEnabled, setIsEnabled] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const res = await fetch(`${API_URL}/siteinfo`);
                if (res.ok) {
                    const data = await res.json();
                    setIsEnabled(data.bannerEnabled);
                    setBannerText(data.bannerText || '');
                }
            } catch (err) {
                console.error('Failed to fetch banner:', err);
            }
        };
        fetchBanner();
    }, []);

    // Manual scroll animation using requestAnimationFrame
    useEffect(() => {
        if (!isEnabled || !bannerText || !contentRef.current) return;

        let position = 0;
        let animationId: number;

        const animate = () => {
            position -= 1;
            if (contentRef.current) {
                const halfWidth = contentRef.current.scrollWidth / 2;
                if (Math.abs(position) >= halfWidth) {
                    position = 0;
                }
                contentRef.current.style.transform = `translateX(${position}px)`;
            }
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [isEnabled, bannerText]);

    if (!isEnabled || !bannerText) return null;

    return (
        <div
            className="bg-brand-red text-white py-2"
            style={{
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100vw'
            }}
        >
            <div
                ref={contentRef}
                className="flex whitespace-nowrap will-change-transform"
            >
                <span className="px-8 text-sm font-medium">{bannerText}</span>
                <span className="px-8 text-sm font-medium">{bannerText}</span>
                <span className="px-8 text-sm font-medium">{bannerText}</span>
                <span className="px-8 text-sm font-medium">{bannerText}</span>
            </div>
        </div>
    );
}
