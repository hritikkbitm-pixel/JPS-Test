"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const { clearCart } = useCart();
    const router = useRouter();

    useEffect(() => {
        // Clear cart on successful payment
        clearCart();

        // Auto redirect after 5 seconds
        const timer = setTimeout(() => {
            router.push('/account');
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto border-t-8 border-green-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-check text-4xl text-green-600"></i>
                </div>
                <h1 className="text-3xl font-black text-gray-800 uppercase mb-2">Payment Successful!</h1>
                <p className="text-gray-600 mb-6">Your order has been placed successfully. Thank you for shopping with JPS Enterprise.</p>

                <div className="bg-gray-50 p-4 rounded mb-8 text-left">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Order ID:</span>
                        <span className="font-bold text-gray-800">{orderId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className="font-bold text-green-600">Paid</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link href="/account" className="block w-full bg-brand-red text-white font-bold py-3 rounded uppercase tracking-wider hover:bg-red-700 transition">
                        View My Orders
                    </Link>
                    <Link href="/" className="block w-full bg-gray-100 text-gray-700 font-bold py-3 rounded uppercase tracking-wider hover:bg-gray-200 transition">
                        Continue Shopping
                    </Link>
                </div>

                <p className="mt-6 text-xs text-gray-400">Redirecting to your account in 5 seconds...</p>
            </div>
        </div>
    );
}
