"use client";

import React from 'react';
import { useCart } from '../context/CartContext';
import { Product } from '@/lib/data';

import Link from 'next/link';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const isAvailable = product.available !== false;

    return (
        <div className={`bg-white border border-gray-100 rounded-lg product-card flex flex-col relative group overflow-hidden ${!isAvailable ? 'opacity-75 grayscale' : ''}`}>
            <Link href={`/product/${product.id}`} className="block">
                <div className="h-48 p-6 flex items-center justify-center relative cursor-pointer">
                    <img src={product.image || "https://via.placeholder.com/300?text=No+Image"} className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-110" alt={product.name} />
                    {product.stock !== undefined && product.stock < 5 && isAvailable && (
                        <span className="absolute top-2 left-2 text-red-600 text-[10px] font-bold uppercase animate-pulse">Low Stock</span>
                    )}
                    {!isAvailable && (
                        <span className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-10 text-brand-red font-black text-xl uppercase -rotate-12 border-4 border-brand-red">Unavailable</span>
                    )}
                </div>
            </Link>
            <div className="p-4 flex flex-col flex-grow border-t border-gray-50">
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{product.brand}</div>
                <Link href={`/product/${product.id}`} className="block">
                    <h3 className="font-bold text-gray-800 text-sm leading-snug mb-2 line-clamp-2 min-h-[2.5em] group-hover:text-brand-red transition cursor-pointer">{product.name}</h3>
                </Link>
                <div className="mt-auto">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-gray-400 line-through">₹{Math.round(product.price * 1.1).toLocaleString()}</span>
                        <span className="text-lg font-black text-brand-red">₹{product.price.toLocaleString()}</span>
                    </div>
                    {isAvailable ? (
                        <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="add-btn w-full bg-gray-100 text-gray-800 font-bold py-2 rounded text-xs uppercase tracking-wider hover:shadow-md transition flex items-center justify-center gap-2">
                            <i className="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                    ) : (
                        <button disabled className="w-full bg-gray-200 text-gray-400 font-bold py-2 rounded text-xs uppercase tracking-wider cursor-not-allowed">
                            Unavailable
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
