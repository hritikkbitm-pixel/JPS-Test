import React, { useState } from 'react';
import { Product } from '@/lib/data';
import { useCart } from '@/context/CartContext';

interface ProductHeroProps {
    product: Product;
}

export default function ProductHero({ product }: ProductHeroProps) {
    const { addToCart } = useCart();
    const [activeImage, setActiveImage] = useState(product.image);

    // Collect all unique images
    const images = [product.image, ...(product.images || [])].filter((img, index, self) => img && self.indexOf(img) === index);

    // Badges based on specs
    const getBadges = () => {
        const specs = product.specs as any;
        const badges = [];
        if (specs.socket) badges.push(specs.socket);
        if (specs.memory_type) badges.push(specs.memory_type);
        if (specs.wattage) badges.push(`${specs.wattage}W`);
        if (specs.efficiency_rating) badges.push(specs.efficiency_rating);
        if (specs.form_factor) badges.push(specs.form_factor);
        return badges.slice(0, 3);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-10 mb-8">
            <div className="flex flex-col lg:flex-row gap-10">
                {/* Image Section */}
                <div className="w-full lg:w-1/2 flex flex-col items-center">
                    <div className="w-full h-80 lg:h-96 flex items-center justify-center bg-gray-50 rounded-xl mb-4 p-4 transition duration-300 hover:shadow-inner">
                        <img
                            src={activeImage || "https://via.placeholder.com/400?text=No+Image"}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain mix-blend-multiply filter drop-shadow-sm transition-transform duration-500 hover:scale-105"
                        />
                    </div>
                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto w-full justify-center pb-2">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(img)}
                                    className={`w-16 h-16 border-2 rounded-lg p-1 flex items-center justify-center transition ${activeImage === img ? 'border-brand-red ring-1 ring-brand-red bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <img src={img} alt={`View ${idx}`} className="max-h-full max-w-full object-contain" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="w-full lg:w-1/2 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{product.brand}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{product.category}</span>
                    </div>

                    <h1 className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight mb-4">{product.name}</h1>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {getBadges().map((badge, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                {badge}
                            </span>
                        ))}
                    </div>

                    <div className="mt-auto">
                        <div className="flex items-end gap-3 mb-6">
                            <span className="text-4xl font-black text-brand-red tracking-tight">₹{product.price.toLocaleString()}</span>
                            {product.available ? (
                                <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-xs mb-2">● IN STOCK</span>
                            ) : (
                                <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded text-xs mb-2">● OUT OF STOCK</span>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => addToCart(product as any)}
                                disabled={!product.available}
                                className="flex-1 bg-brand-red text-white py-4 rounded-lg font-bold uppercase tracking-wider hover:bg-red-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <button className="flex-none w-14 flex items-center justify-center border-2 border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 transition">
                                <i className="far fa-heart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
