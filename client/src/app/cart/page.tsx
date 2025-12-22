"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useShop } from '@/context/ShopContext';

import { API_URL } from '@/config';
import { loadRazorpayScript } from '@/utils/razorpay';

declare global {
    interface Window {
        Razorpay: any;
    }
}

// Razorpay Logo SVG Component
const RazorpayLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="24" viewBox="0 0 100 24" fill="none">
        <path d="M10.5 0L0 24H5.5L16 0H10.5Z" fill="#3395FF" />
        <path d="M16.5 0L6 24H11.5L22 0H16.5Z" fill="#072654" />
        <path d="M29.5 6.5H27V17.5H29.5V6.5Z" fill="#072654" />
        <path d="M28.25 3C27.28 3 26.5 3.78 26.5 4.75C26.5 5.72 27.28 6.5 28.25 6.5C29.22 6.5 30 5.72 30 4.75C30 3.78 29.22 3 28.25 3Z" fill="#072654" />
        <path d="M37.5 6.5C35.98 6.5 34.84 7.08 34.1 8.02V6.5H31.6V17.5H34.1V11.8C34.1 9.92 35.22 9 36.6 9C37.98 9 38.8 9.82 38.8 11.5V17.5H41.3V11.1C41.3 8.28 39.52 6.5 37.5 6.5Z" fill="#072654" />
        <path d="M48.75 6.5C45.1 6.5 42.75 9.08 42.75 12C42.75 15.02 45.2 17.5 48.85 17.5C51.1 17.5 52.9 16.5 53.75 15.1L51.75 13.8C51.2 14.6 50.15 15.1 48.9 15.1C47.2 15.1 45.95 14.2 45.55 12.8H54.1V12.1C54.1 9.08 51.95 6.5 48.75 6.5ZM45.45 10.8C45.8 9.5 46.9 8.7 48.5 8.7C50.05 8.7 51.1 9.55 51.4 10.8H45.45Z" fill="#072654" />
        <path d="M62.4 6.5C60.88 6.5 59.74 7.08 59 8.02V6.5H56.5V21H59V16.1C59.74 16.98 60.82 17.5 62.4 17.5C65.5 17.5 67.9 15.02 67.9 12C67.9 8.98 65.5 6.5 62.4 6.5ZM62 15.1C60.2 15.1 59 13.8 59 12C59 10.2 60.2 8.9 62 8.9C63.8 8.9 65 10.2 65 12C65 13.8 63.8 15.1 62 15.1Z" fill="#072654" />
        <path d="M75.3 6.5C73.78 6.5 72.64 7.08 71.9 8.02V6.5H69.4V17.5H71.9V11.8C71.9 9.92 73.02 9 74.4 9C75.78 9 76.6 9.82 76.6 11.5V17.5H79.1V11.1C79.1 8.28 77.32 6.5 75.3 6.5Z" fill="#072654" />
        <path d="M86.55 6.5C82.9 6.5 80.55 9.08 80.55 12C80.55 15.02 83 17.5 86.65 17.5C88.9 17.5 90.7 16.5 91.55 15.1L89.55 13.8C89 14.6 87.95 15.1 86.7 15.1C85 15.1 83.75 14.2 83.35 12.8H91.9V12.1C91.9 9.08 89.75 6.5 86.55 6.5ZM83.25 10.8C83.6 9.5 84.7 8.7 86.3 8.7C87.85 8.7 88.9 9.55 89.2 10.8H83.25Z" fill="#072654" />
        <path d="M99.5 6.5H96.1L92.6 11.5V6.5H90.1V17.5H92.6V13.2L93.5 12.2L96.7 17.5H99.7L95.3 10.6L99.5 6.5Z" fill="#072654" />
    </svg>
);

export default function CartPage() {
    const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
    const { user, updateUser, refreshUser } = useAuth();
    const { addOrder, refreshOrders } = useShop();
    const router = useRouter();

    const [step, setStep] = useState<'cart' | 'shipping' | 'payment'>('cart');
    const [isGuestCheckout, setIsGuestCheckout] = useState(false);
    const [shippingAddress, setShippingAddress] = useState({
        fullName: '',
        email: '',
        label: 'Home',
        line1: '',
        line2: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        whatsappNumber: ''
    });

    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [shouldSaveAddress, setShouldSaveAddress] = useState(false);

    // Fetch saved addresses on load (only for logged-in users)
    useEffect(() => {
        if (user?.email) {
            setShippingAddress(prev => ({ ...prev, email: user.email || '' }));

            fetch(`${API_URL}/user/address`)
                .then(res => res.json())
                .then(data => {
                    if (data.addresses) {
                        setSavedAddresses(data.addresses);
                    }
                })
                .catch(err => console.error("Failed to load addresses", err));
        }
    }, [user]);

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
    };

    const handleSelectAddress = (index: number) => {
        if (index === -1) {
            setShippingAddress({ fullName: '', email: user?.email || '', label: 'Home', line1: '', line2: '', city: '', state: '', zip: '', phone: '', whatsappNumber: '' });
        } else {
            setShippingAddress({ ...savedAddresses[index], email: user?.email || savedAddresses[index].email || '', whatsappNumber: '' });
        }
    };

    const handlePlaceOrder = async () => {
        // Validate required fields
        if (!shippingAddress.fullName || !shippingAddress.email || !shippingAddress.line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip || !shippingAddress.phone) {
            alert("Please fill in all required fields (Name, Email, Address, Phone).");
            return;
        }

        // For guest checkout, require WhatsApp number
        if (isGuestCheckout && !shippingAddress.whatsappNumber) {
            alert("Please provide your WhatsApp number so we can contact you with shipping details.");
            return;
        }

        const createOrderObject = () => ({
            id: 'ORD-' + Math.floor(Math.random() * 100000),
            email: shippingAddress.email,
            date: new Date().toLocaleDateString(),
            items: [...cart],
            total: cartTotal,
            status: 'Pending Payment',
            shippingAddress: shippingAddress,
            paymentMethod: 'RAZORPAY',
            isGuestOrder: isGuestCheckout,
            whatsappNumber: isGuestCheckout ? shippingAddress.whatsappNumber : undefined,
            messages: [],
            invoice: '#'
        });

        const newOrder = createOrderObject();

        try {
            // Save order first
            await addOrder(newOrder);

            // Create Razorpay order
            const res = await fetch(`${API_URL}/payment/razorpay/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: cartTotal,
                    currency: 'INR',
                    receipt: newOrder.id,
                })
            });
            const orderData = await res.json();

            if (!orderData.success) {
                alert("Payment initialization failed: " + orderData.message);
                return;
            }

            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                alert("Razorpay SDK failed to load. Are you online?");
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "JPS Enterprises",
                description: "Checkout Payment",
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    // Verify payment on server
                    const verifyRes = await fetch(`${API_URL}/payment/razorpay/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: newOrder.id,
                        })
                    });
                    const verifyData = await verifyRes.json();

                    if (verifyData.success) {
                        // Update local state
                        await refreshOrders();
                        if (!isGuestCheckout) {
                            await refreshUser();
                        }
                        clearCart();
                        alert("Order placed successfully! Thank you for your purchase.");
                        router.push(isGuestCheckout ? '/' : '/account');
                    } else {
                        alert("Payment verification failed: " + verifyData.message);
                    }
                },
                prefill: {
                    name: shippingAddress.fullName,
                    email: shippingAddress.email,
                    contact: shippingAddress.phone,
                },
                theme: {
                    color: "#E21D26", // brand-red
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error(err);
            alert('Order/Payment Error. Please try again.');
        }
    };

    if (cart.length === 0 && step === 'cart') {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
                <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
                <Link href="/" className="bg-brand-red text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-red-700 transition">
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 fade-in relative">
            <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight mb-8">Checkout</h1>

            {/* Steps Indicator */}
            <div className="flex justify-center mb-10">
                <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'cart' ? 'bg-brand-red text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                    <span className={`ml-2 font-bold ${step === 'cart' ? 'text-gray-800' : 'text-gray-500'}`}>Cart</span>
                </div>
                <div className="w-16 h-1 bg-gray-200 mx-4"></div>
                <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'shipping' ? 'bg-brand-red text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                    <span className={`ml-2 font-bold ${step === 'shipping' ? 'text-gray-800' : 'text-gray-500'}`}>Shipping</span>
                </div>
                <div className="w-16 h-1 bg-gray-200 mx-4"></div>
                <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'payment' ? 'bg-brand-red text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                    <span className={`ml-2 font-bold ${step === 'payment' ? 'text-gray-800' : 'text-gray-500'}`}>Payment</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    {step === 'cart' && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                            <div className="p-6 border-b bg-gray-50 font-bold text-gray-700 uppercase tracking-wider text-sm">Order Summary</div>
                            <div className="p-6 space-y-6">
                                {cart.map((item, index) => (
                                    <div key={index} className="flex gap-4 items-center border-b pb-6 last:border-0 last:pb-0">
                                        <img src={item.image} alt={item.name} className="w-24 h-24 object-contain border rounded p-2" />
                                        <div className="flex-grow">
                                            <div className="text-xs font-bold text-gray-500 uppercase mb-1">{item.brand}</div>
                                            <h3 className="font-bold text-gray-800 mb-2">{item.name}</h3>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center border rounded">
                                                    <button onClick={() => updateQuantity(index, (item.stock || 1) - 1)} className="px-3 py-1 text-gray-500 hover:text-brand-red font-bold">-</button>
                                                    <span className="px-3 font-bold">{item.stock || 1}</span>
                                                    <button onClick={() => updateQuantity(index, (item.stock || 1) + 1)} className="px-3 py-1 text-gray-500 hover:text-brand-red font-bold">+</button>
                                                </div>
                                                <button onClick={() => removeFromCart(index)} className="text-sm text-gray-400 hover:text-red-600 underline">Remove</button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-xl text-brand-red">₹{(item.price * (item.stock || 1)).toLocaleString()}</div>
                                            <div className="text-xs text-gray-500">₹{item.price.toLocaleString()} each</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'shipping' && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-6">Shipping Address</h2>

                            {/* Guest Checkout Notice */}
                            {isGuestCheckout && (
                                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        <div>
                                            <h3 className="font-bold text-green-800 mb-1">Guest Checkout</h3>
                                            <p className="text-sm text-green-700">Please enter your <strong>WhatsApp number</strong> so we can contact you with shipping updates and delivery details.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Saved Addresses (only for logged-in users) */}
                            {!isGuestCheckout && savedAddresses.length > 0 && (
                                <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
                                    <label className="block text-blue-800 text-sm font-bold mb-2">Select Saved Address</label>
                                    <select
                                        onChange={(e) => handleSelectAddress(Number(e.target.value))}
                                        className="w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-red bg-white"
                                    >
                                        <option value={-1}>-- Use a new address --</option>
                                        {savedAddresses.map((addr, idx) => (
                                            <option key={idx} value={idx}>
                                                {addr.label} - {addr.line1}, {addr.city}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-1">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Full Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="fullName" value={shippingAddress.fullName} onChange={handleAddressChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-red" placeholder="John Doe" required />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Email Address <span className="text-red-500">*</span></label>
                                    <input type="email" name="email" value={shippingAddress.email} onChange={handleAddressChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-red" placeholder="john@example.com" required />
                                </div>

                                {/* WhatsApp Number - shown for guest checkout */}
                                {isGuestCheckout && (
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            WhatsApp Number <span className="text-red-500">*</span>
                                            <span className="ml-2 text-xs font-normal text-green-600">(We'll contact you here for shipping updates)</span>
                                        </label>
                                        <div className="flex items-center">
                                            <span className="bg-gray-100 border border-r-0 rounded-l px-3 py-2 text-gray-600">+91</span>
                                            <input
                                                type="tel"
                                                name="whatsappNumber"
                                                value={shippingAddress.whatsappNumber}
                                                onChange={handleAddressChange}
                                                className="w-full border rounded-r px-3 py-2 focus:outline-none focus:border-brand-red"
                                                placeholder="9876543210"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Address Label (e.g. Home, Office)</label>
                                    <input type="text" name="label" value={shippingAddress.label} onChange={handleAddressChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-red" placeholder="Home" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Address Line 1 <span className="text-red-500">*</span></label>
                                    <input type="text" name="line1" value={shippingAddress.line1} onChange={handleAddressChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-red" placeholder="Street Address" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Address Line 2</label>
                                    <input type="text" name="line2" value={shippingAddress.line2} onChange={handleAddressChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-red" placeholder="Apartment, Suite, etc." />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">City <span className="text-red-500">*</span></label>
                                    <input type="text" name="city" value={shippingAddress.city} onChange={handleAddressChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-red" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">State <span className="text-red-500">*</span></label>
                                    <input type="text" name="state" value={shippingAddress.state} onChange={handleAddressChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-red" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">ZIP Code <span className="text-red-500">*</span></label>
                                    <input type="text" name="zip" value={shippingAddress.zip} onChange={handleAddressChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-red" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Phone <span className="text-red-500">*</span></label>
                                    <input type="text" name="phone" value={shippingAddress.phone} onChange={handleAddressChange} className="w-full border rounded px-3 py-2 focus:outline-none focus:border-brand-red" />
                                </div>

                                {/* Save address option - only for logged-in users */}
                                {!isGuestCheckout && (
                                    <div className="md:col-span-2 mt-4">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={shouldSaveAddress}
                                                onChange={(e) => setShouldSaveAddress(e.target.checked)}
                                                className="mr-2 h-4 w-4 text-brand-red focus:ring-brand-red"
                                            />
                                            <span className="text-gray-700 font-bold">Save this address for future orders</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'payment' && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-6">Payment Method</h2>

                            {/* Razorpay Only */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="font-bold text-gray-800">Pay with Razorpay</span>
                                    </div>
                                    <RazorpayLogo />
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                    <span className="bg-white px-2 py-1 rounded border">UPI</span>
                                    <span className="bg-white px-2 py-1 rounded border">Credit/Debit Cards</span>
                                    <span className="bg-white px-2 py-1 rounded border">Net Banking</span>
                                    <span className="bg-white px-2 py-1 rounded border">Wallets</span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 mt-4 text-center">
                                Secure payment powered by Razorpay. Your payment information is encrypted and secure.
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 sticky top-24">
                        <h3 className="text-lg font-bold mb-4">Order Total</h3>
                        <div className="space-y-2 mb-4 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>₹{cartTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span className="text-green-600 font-bold">FREE</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax (18% GST)</span>
                                <span>Included</span>
                            </div>
                        </div>
                        <div className="border-t pt-4 mb-6">
                            <div className="flex justify-between text-xl font-black text-gray-900">
                                <span>Total</span>
                                <span className="text-brand-red">₹{cartTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        {step === 'cart' && (
                            <div className="space-y-3">
                                {user ? (
                                    <button onClick={() => setStep('shipping')} className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-3 rounded uppercase tracking-wider transition shadow-md">
                                        Continue to Shipping
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => { setIsGuestCheckout(true); setStep('shipping'); }}
                                            className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-3 rounded uppercase tracking-wider transition shadow-md"
                                        >
                                            Checkout as Guest
                                        </button>
                                        <Link
                                            href="/account"
                                            className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded uppercase tracking-wider transition"
                                        >
                                            Login to Checkout
                                        </Link>
                                    </>
                                )}
                            </div>
                        )}
                        {step === 'shipping' && (
                            <div className="flex gap-2">
                                <button onClick={() => setStep('cart')} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded uppercase tracking-wider transition">
                                    Back
                                </button>
                                <button onClick={() => setStep('payment')} className="flex-1 bg-brand-red hover:bg-red-700 text-white font-bold py-3 rounded uppercase tracking-wider transition shadow-md">
                                    Payment
                                </button>
                            </div>
                        )}
                        {step === 'payment' && (
                            <div className="flex gap-2">
                                <button onClick={() => setStep('shipping')} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded uppercase tracking-wider transition">
                                    Back
                                </button>
                                <button onClick={handlePlaceOrder} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    Pay Now
                                </button>
                            </div>
                        )}

                        {/* Guest checkout indicator */}
                        {isGuestCheckout && step !== 'cart' && (
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
                                <strong>Guest Checkout</strong> - We'll contact you via WhatsApp for order updates.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
