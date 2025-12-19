"use client";

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PaymentFailurePage() {
    const searchParams = useSearchParams();
    const msg = searchParams.get('msg') || "Your transaction could not be processed.";
    const orderId = searchParams.get('orderId');

    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto border-t-8 border-red-500">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-times text-4xl text-red-600"></i>
                </div>
                <h1 className="text-3xl font-black text-gray-800 uppercase mb-2">Payment Failed</h1>
                <p className="text-gray-600 mb-6">{msg}</p>

                {orderId && (
                    <div className="bg-gray-50 p-4 rounded mb-8 text-left">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Reference Order ID:</span>
                            <span className="font-bold text-gray-800">{orderId}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <Link href="/cart" className="block w-full bg-brand-red text-white font-bold py-3 rounded uppercase tracking-wider hover:bg-red-700 transition">
                        Retry Checkout
                    </Link>
                    <Link href="/contact" className="block w-full bg-gray-100 text-gray-700 font-bold py-3 rounded uppercase tracking-wider hover:bg-gray-200 transition">
                        Contact Support
                    </Link>
                </div>

                <p className="mt-6 text-sm text-gray-500">If your money was debited, it will be refunded within 5-7 working days.</p>
            </div>
        </div>
    );
}
