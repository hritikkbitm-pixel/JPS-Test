"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Banner {
    image: string;
    type: string;
    target: string;
    productIds?: string[];
}

interface HeroCarouselProps {
    banners: Banner[];
}

export default function HeroCarousel({ banners }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);

    if (banners.length === 0) return null;

    // Build target link - if productIds exist, link to product filter, else use target
    const getBannerLink = (b: Banner) => {
        if (b.productIds && b.productIds.length > 0) {
            return `/?productIds=${b.productIds.join(',')}`;
        }
        return b.target || '/';
    };

    return (
        <div className="mb-10 w-full">
            {/* Main Hero Carousel - Full Width */}
            <div className="w-full relative h-[250px] md:h-[400px] lg:h-[500px] bg-gray-900 rounded-lg overflow-hidden group cursor-pointer">
                <div id="carousel-track" className="w-full h-full relative">
                    {banners.map((b, i) => (
                        <Link
                            key={i}
                            href={getBannerLink(b)}
                            className={`carousel-slide absolute inset-0 transition-opacity duration-700 ${i === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        >
                            <img
                                src={b.image || "https://via.placeholder.com/1500x500?text=No+Banner"}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                                alt="Banner"
                            />
                        </Link>
                    ))}
                </div>

                {/* Dots Navigation */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                    {banners.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`w-2 h-2 rounded-full bg-white transition ${i === currentIndex ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                        />
                    ))}
                </div>

                {/* Navigation Arrows */}
                <button onClick={prevSlide} className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-brand-red text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition z-20 backdrop-blur-sm group-hover:opacity-100 opacity-0 duration-300">
                    <i className="fas fa-chevron-left text-xs md:text-base"></i>
                </button>
                <button onClick={nextSlide} className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-brand-red text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition z-20 backdrop-blur-sm group-hover:opacity-100 opacity-0 duration-300">
                    <i className="fas fa-chevron-right text-xs md:text-base"></i>
                </button>
            </div>
        </div>
    );
}
