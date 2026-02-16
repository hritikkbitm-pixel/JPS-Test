'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { API_URL } from '@/config';

interface QuotationItem {
    name: string;
    price: number;
    quantity: number;
    category: string;
    brand: string;
    image: string;
    isCustom: boolean;
}

interface QuotationData {
    token: string;
    items: QuotationItem[];
    total: number;
    customerName: string;
    notes: string;
    expiresAt?: string;
    status: string;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function QuotePaymentPage() {
    const params = useParams();
    const token = params.token as string;

    const [quotation, setQuotation] = useState<QuotationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errorStatus, setErrorStatus] = useState<string | null>(null);
    const [paying, setPaying] = useState(false);
    const [paid, setPaid] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetchQuotation();
    }, [token]);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); };
    }, []);

    const fetchQuotation = async () => {
        try {
            const res = await fetch(`${API_URL}/quotations/pay/${token}`);
            if (res.ok) {
                const data = await res.json();
                setQuotation(data);
            } else {
                const err = await res.json();
                setError(err.message || 'Quotation not found');
                setErrorStatus(err.status || null);
            }
        } catch (err) {
            setError('Failed to load quotation');
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        if (!quotation) return;
        setPaying(true);

        try {
            // Create Razorpay order
            const orderRes = await fetch(`${API_URL}/quotations/pay/${token}/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!orderRes.ok) {
                const err = await orderRes.json();
                alert(err.message || 'Failed to create payment order');
                setPaying(false);
                return;
            }

            const orderData = await orderRes.json();

            // Open Razorpay checkout
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'JPS Enterprises',
                description: `Quotation Payment`,
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    // Verify payment
                    try {
                        const verifyRes = await fetch(`${API_URL}/quotations/pay/${token}/complete`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        if (verifyRes.ok) {
                            setPaid(true);
                        } else {
                            alert('Payment verification failed. Please contact support.');
                        }
                    } catch (err) {
                        alert('Payment verification error. Please contact support.');
                    }
                    setPaying(false);
                },
                prefill: {
                    name: quotation.customerName || ''
                },
                theme: {
                    color: '#e11d48'
                },
                modal: {
                    ondismiss: function () {
                        setPaying(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            alert('Failed to initiate payment');
            setPaying(false);
        }
    };

    // ─── Loading State ───
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm">Loading quotation...</p>
                </div>
            </div>
        );
    }

    // ─── Error / Invalid State ───
    if (error) {
        const iconMap: Record<string, string> = {
            paid: 'fa-check-circle text-green-500',
            expired: 'fa-clock text-yellow-500',
            cancelled: 'fa-times-circle text-red-500'
        };
        const icon = errorStatus ? iconMap[errorStatus] || 'fa-exclamation-circle text-red-500' : 'fa-exclamation-circle text-red-500';

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className={`fas ${icon} text-4xl`}></i>
                    </div>
                    <h1 className="text-2xl font-black text-gray-800 uppercase mb-2">
                        {errorStatus === 'paid' ? 'Already Paid' : errorStatus === 'expired' ? 'Quotation Expired' : 'Not Available'}
                    </h1>
                    <p className="text-gray-500">{error}</p>
                    <a href="/" className="inline-block mt-6 bg-black text-white px-6 py-3 rounded-lg font-bold text-sm uppercase hover:bg-red-600 transition">
                        Visit JPS Enterprises
                    </a>
                </div>
            </div>
        );
    }

    // ─── Payment Success ───
    if (paid) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md w-full border-t-4 border-green-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-check text-4xl text-green-600"></i>
                    </div>
                    <h1 className="text-2xl font-black text-gray-800 uppercase mb-2">Payment Successful!</h1>
                    <p className="text-gray-500 mb-4">Your payment of <span className="font-black text-gray-800">₹{quotation?.total.toLocaleString()}</span> has been received.</p>
                    <p className="text-sm text-gray-400 mb-6">Thank you for your purchase. We&apos;ll process your order shortly.</p>
                    <a href="/" className="inline-block bg-black text-white px-8 py-3 rounded-lg font-bold text-sm uppercase hover:bg-red-600 transition">
                        Visit JPS Enterprises
                    </a>
                </div>
            </div>
        );
    }

    // ─── Quotation View ───
    if (!quotation) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-black text-white py-6">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-black tracking-tight">JPS <span className="text-red-500">ENTERPRISES</span></h1>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Custom Quotation</p>
                        </div>
                        {quotation.customerName && (
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase">Prepared for</p>
                                <p className="font-bold">{quotation.customerName}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Notes */}
                {quotation.notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                            <div>
                                <div className="text-xs font-bold text-blue-700 uppercase mb-1">Note from JPS Enterprises</div>
                                <p className="text-sm text-blue-800">{quotation.notes}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Items */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                    <div className="px-6 py-4 bg-gray-50 border-b">
                        <h2 className="font-black text-gray-800 uppercase text-sm">Your Items</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {quotation.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-5 hover:bg-gray-50 transition">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-16 h-16 object-contain rounded-lg border p-1 bg-white" />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center">
                                        <i className={`fas ${item.isCustom ? 'fa-star text-yellow-500' : 'fa-box text-gray-400'} text-xl`}></i>
                                    </div>
                                )}
                                <div className="flex-grow min-w-0">
                                    <div className="text-xs font-bold text-gray-400 uppercase">
                                        {item.brand}{item.category ? ` · ${item.category}` : ''}
                                    </div>
                                    <div className="font-bold text-gray-800">{item.name}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Qty: <span className="font-bold text-gray-600">{item.quantity}</span>
                                        {item.quantity > 1 && <span className="ml-2">@ ₹{item.price.toLocaleString()} each</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-gray-800 text-lg">₹{(item.price * item.quantity).toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total & Pay */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-500 font-bold uppercase text-sm">Total Amount</span>
                        <span className="text-3xl font-black text-red-600">₹{quotation.total.toLocaleString()}</span>
                    </div>

                    {quotation.expiresAt && (
                        <div className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                            <i className="fas fa-clock"></i>
                            Valid until {new Date(quotation.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    )}

                    <button
                        onClick={handlePay}
                        disabled={paying}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg transition uppercase tracking-wider text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {paying ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-lock"></i>
                                Pay ₹{quotation.total.toLocaleString()}
                            </>
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><i className="fas fa-shield-alt"></i> Secure Payment</span>
                        <span className="flex items-center gap-1"><i className="fas fa-lock"></i> One-time use link</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-xs text-gray-400">
                    <p>Powered by <a href="/" className="text-red-600 font-bold hover:underline">JPS Enterprises</a></p>
                </div>
            </div>
        </div>
    );
}
