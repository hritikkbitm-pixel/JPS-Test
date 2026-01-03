"use client";

import React, { useCallback } from 'react';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import { Product } from '@/lib/data';
import { useHoverPrefetch, prefetchProduct } from '@/hooks/usePrefetch';

import Link from 'next/link';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const isAvailable = product.available !== false;
    const hasDiscount = product.mrp && product.mrp > product.price;
    const discountPercentage = hasDiscount ? Math.ceil(((product.mrp! - product.price) / product.mrp!) * 100) : 0;

    // Prefetch product details on hover
    const prefetchFn = useCallback(() => prefetchProduct(product.id), [product.id]);
    const { onMouseEnter, onMouseLeave } = useHoverPrefetch(prefetchFn);

    return (
        <div
            className={`bg-white border border-gray-100 rounded-lg product-card flex flex-col relative group overflow-hidden`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {hasDiscount && (
                <div className="absolute top-2 left-2 z-10">
                    <span className="bg-[#e53e3e] text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm">
                        -{discountPercentage}%
                    </span>
                </div>
            )}
            <Link href={`/product/${product.id}`} className="block">
                <div className="h-48 p-4 flex items-center justify-center relative cursor-pointer">
                    <div className="relative w-full h-full">
                        <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className={`object-contain transition duration-300 group-hover:scale-110 ${!isAvailable ? 'grayscale' : ''}`}
                            loading="lazy"
                            unoptimized={product.image?.includes('freepik.com')}
                        />
                    </div>
                    {product.stock !== undefined && product.stock < 5 && isAvailable && !hasDiscount && (
                        <span className="absolute top-2 left-2 text-red-600 text-[10px] font-bold uppercase animate-pulse">Low Stock</span>
                    )}
                    {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="bg-gray-900 text-white font-black text-sm uppercase px-4 py-2 rounded-sm tracking-wider shadow-lg">
                                Out of Stock
                            </span>
                        </div>
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
                        {hasDiscount ? (
                            <>
                                <span className="text-xs text-gray-400 line-through">Rs. {product.mrp?.toLocaleString()}</span>
                                <span className="text-lg font-black text-brand-red">Rs. {product.price.toLocaleString()}</span>
                            </>
                        ) : (
                            <span className="text-lg font-black text-brand-red ml-auto">Rs. {product.price.toLocaleString()}</span>
                        )}
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
