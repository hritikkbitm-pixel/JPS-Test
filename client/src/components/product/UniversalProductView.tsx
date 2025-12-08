import React from 'react';
import { Product } from '@/lib/data';
import ProductHero from './ProductHero';
import ProductSpecs from './ProductSpecs';
import CompatibilitySection from './CompatibilitySection';

export default function UniversalProductView({ product }: { product: Product }) {
    if (!product) return <div>Product not found</div>;

    // Helper to format descriptions
    const renderDescription = (text: string) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => <p key={i} className="mb-4 text-gray-600 leading-relaxed">{line}</p>);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* 1. Hero */}
            <ProductHero product={product} />

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
        </div>
    );
}
