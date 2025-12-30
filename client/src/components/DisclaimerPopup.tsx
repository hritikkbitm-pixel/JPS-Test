'use client';

import React, { useEffect, useState } from 'react';
import { API_URL } from '@/config';

export default function DisclaimerPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [popupTitle, setPopupTitle] = useState('');
    const [popupContent, setPopupContent] = useState('');

    useEffect(() => {
        const fetchPopup = async () => {
            try {
                // Check if user has already dismissed the popup in this session
                const dismissed = sessionStorage.getItem('disclaimer_dismissed');
                if (dismissed) return;

                // Only show on homepage/landing page (root path with no category or category=all)
                const path = window.location.pathname;
                const search = window.location.search;
                const isHomePage = path === '/' &&
                    (!search || search === '' || search === '?category=all' || search.startsWith('?category=all&'));

                if (!isHomePage) return;

                const res = await fetch(`${API_URL}/siteinfo`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.popupEnabled && data.popupContent) {
                        setPopupTitle(data.popupTitle || '');
                        setPopupContent(data.popupContent || '');
                        // Small delay for better UX
                        setTimeout(() => setIsVisible(true), 500);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch popup:', err);
            }
        };
        fetchPopup();
    }, []);

    const handleDismiss = () => {
        sessionStorage.setItem('disclaimer_dismissed', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full animate-scale-in overflow-hidden">
                {/* Header */}
                <div className="bg-brand-red text-white px-6 py-4">
                    <h2 className="text-xl font-bold">{popupTitle}</h2>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                        {popupContent}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button
                        onClick={handleDismiss}
                        className="w-full bg-brand-red text-white font-bold py-3 rounded uppercase tracking-wider hover:bg-red-700 transition"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
}
