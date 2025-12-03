"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Banner {
    image: string;
    title: string;
    sub: string;
    type: string;
    target: string;
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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-10">
            <div className="lg:col-span-8 relative h-48 md:h-[380px] bg-gray-900 rounded-lg overflow-hidden group cursor-pointer relative">
                <div id="carousel-track" className="w-full h-full relative">
                    {banners.map((b, i) => (
                        <div key={i} className={`carousel-slide absolute inset-0 transition-opacity duration-700 ${i === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                            <img src={b.image} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-700" alt={b.title} />
                            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-10">
                                <span className="text-brand-red font-bold tracking-widest uppercase mb-1 md:mb-2 text-xs md:text-base">Featured</span>
                                <h2 className="text-2xl md:text-5xl font-black text-white mb-2 md:mb-4 leading-tight line-clamp-2">{b.title}</h2>
                                <p className="text-gray-300 mb-4 md:mb-6 max-w-md text-xs md:text-base line-clamp-2">{b.sub}</p>
                                <button className="bg-white text-black px-4 py-2 md:px-8 md:py-3 font-bold w-max hover:bg-brand-red hover:text-white transition uppercase tracking-wider text-xs md:text-sm">Shop Now</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                    {banners.map((_, i) => (
                        <button key={i} onClick={() => setCurrentIndex(i)} className={`w-2 h-2 rounded-full bg-white transition ${i === currentIndex ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}></button>
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
            <div className="lg:col-span-4 flex flex-col gap-4 h-48 md:h-[380px]">
                <div className="flex-1 relative bg-gray-800 rounded-lg overflow-hidden group">
                    <div className="absolute inset-0 z-10 p-4 md:p-6 flex flex-col justify-center">
                        <h3 className="text-lg md:text-2xl font-bold text-white italic">PC BUILDER</h3>
                        <p className="text-gray-300 text-xs md:text-sm">Custom Configurator</p>
                        <Link href="/builder" className="mt-2 text-brand-red font-bold text-xs md:text-sm hover:underline">Start Building &rarr;</Link>
                    </div>
                    <img src="https://img.freepik.com/free-photo/still-life-with-scales-justice_23-2149775044.jpg" className="absolute inset-0 w-full h-full object-cover opacity-40 transition group-hover:opacity-30" alt="PC Builder" />
                </div>
                <div className="flex-1 relative bg-gray-800 rounded-lg overflow-hidden group">
                    <div className="absolute inset-0 z-10 p-4 md:p-6 flex flex-col justify-center">
                        <h3 className="text-lg md:text-2xl font-bold text-white italic">NEW ARRIVALS</h3>
                        <p className="text-gray-300 text-xs md:text-sm">Check Latest Stock</p>
                    </div>
                    <img src="https://img.freepik.com/free-photo/top-view-motherboard-with-neon-lights_23-2151340260.jpg" className="absolute inset-0 w-full h-full object-cover opacity-40 transition group-hover:opacity-30" alt="New Arrivals" />
                </div>
            </div>
        </div>
    );
}
