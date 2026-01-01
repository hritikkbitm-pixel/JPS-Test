import React, { useState } from 'react';
import { Product } from '@/lib/data';
import ProductHero from './ProductHero';
import ProductSpecs from './ProductSpecs';
import CompatibilitySection from './CompatibilitySection';

export default function UniversalProductView({ product }: { product: Product }) {
    const [imageLoaded, setImageLoaded] = useState(false);

    if (!product) return <div>Product not found</div>;

    // Check if this is a laptop with a long spec image
    const isLaptop = product.category === 'laptop';
    const longSpecImage = (product.specs as any)?.long_spec_image;
    const hasLongSpecImage = isLaptop && longSpecImage;

    // Helper to format descriptions
    const renderDescription = (text: string) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => <p key={i} className="mb-4 text-gray-600 leading-relaxed">{line}</p>);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* 1. Hero */}
            <ProductHero product={product} />

            {/* Laptop with Long Spec Image - Full Width Layout */}
            {hasLongSpecImage ? (
                <div className="mt-8">
                    {/* Section Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                        <h2 className="text-xl font-black uppercase text-gray-800 flex items-center gap-2">
                            <i className="fas fa-laptop text-brand-red"></i>
                            Full Specifications
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Scroll to view complete specifications</p>
                    </div>

                    {/* Long Spec Image Container with Lazy Loading */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
                        {/* Skeleton Loader */}
                        {!imageLoaded && (
                            <div className="animate-pulse">
                                <div className="bg-gray-200 w-full" style={{ height: '600px' }}>
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <i className="fas fa-image text-4xl mb-3"></i>
                                        <span className="text-sm">Loading specifications...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scrollable Image Container */}
                        <div
                            className={`max-h-[80vh] overflow-y-auto overflow-x-hidden transition-opacity duration-300 ${!imageLoaded ? 'opacity-0 absolute' : 'opacity-100'}`}
                            style={{ scrollbarWidth: 'thin' }}
                        >
                            <img
                                src={longSpecImage}
                                alt={`${product.name} full specifications`}
                                className="w-full h-auto"
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageLoaded(true)}
                            />
                        </div>

                        {/* Scroll Indicator */}
                        {imageLoaded && (
                            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none">
                                <i className="fas fa-arrow-down animate-bounce"></i>
                                Scroll for more
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Regular Layout for Non-Laptop Products */
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* LEFT: Main Content */}
                    <div className="w-full lg:w-2/3">

                        {/* 2. Compatibility (Dynamic) */}
                        <CompatibilitySection product={product} />

                        {/* 3. Description */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8">
                            <h2 className="text-xl font-black uppercase text-gray-800 mb-6 flex items-center gap-2">
                                Overview
                            </h2>
                            {/* Key Features */}
                            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-bold uppercase text-gray-700 mb-2">Key Features</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    {(product.specs as any).key_features ?
                                        String((product.specs as any).key_features).split(';').map((feat, idx) => (
                                            <li key={idx} className="text-sm text-gray-600">{feat.trim()}</li>
                                        ))
                                        : <li className="text-sm text-gray-400 italic">No key features listed.</li>
                                    }
                                </ul>
                            </div>

                            {/* Long Description */}
                            <div>
                                {renderDescription((product.specs as any).long_description || (product.specs as any).short_description)}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT: Specs Sidebar (Sticky on Desktop) */}
                    <div className="w-full lg:w-1/3">
                        <div className="sticky top-24">
                            <ProductSpecs product={product} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

