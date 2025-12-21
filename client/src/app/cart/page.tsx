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
        Paytm: any;
        Razorpay: any;
    }
}

export default function CartPage() {
    const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
    const { user, updateUser, refreshUser } = useAuth();
    const { addOrder, refreshOrders } = useShop();
    const router = useRouter();

    const [step, setStep] = useState<'cart' | 'shipping' | 'payment'>('cart');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [shippingAddress, setShippingAddress] = useState({
        fullName: '',
        email: '',
        label: 'Home',
        line1: '',
        line2: '',
        city: '',
        state: '',
        zip: '',
        phone: ''
    });

    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [shouldSaveAddress, setShouldSaveAddress] = useState(false);

    // Fetch saved addresses on load
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
            setShippingAddress({ fullName: '', email: user?.email || '', label: 'Home', line1: '', line2: '', city: '', state: '', zip: '', phone: '' });
        } else {
            setShippingAddress({ ...savedAddresses[index], email: user?.email || savedAddresses[index].email || '' });
        }
    };

    const loadPaytmScript = (mid: string) => {
        return new Promise((resolve) => {
            if (window.Paytm && window.Paytm.CheckoutJS) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            // Use securegw-stage.paytm.in for Staging
            script.src = `https://securegw-stage.paytm.in/merchantpgpui/checkoutjs/merchants/${mid}.js`;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePlaceOrder = async () => {
        if (!user) {
            alert("Please login to place an order.");
            router.push('/account');
            return;
        }

        if (!shippingAddress.fullName || !shippingAddress.email || !shippingAddress.line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip || !shippingAddress.phone) {
            alert("Please fill in all required fields (Name, Email, Address, Phone).");
            return;
        }

        const createOrderObject = () => ({
            id: 'ORD-' + Math.floor(Math.random() * 100000),
            email: shippingAddress.email,
            date: new Date().toLocaleDateString(),
            items: [...cart],
            total: cartTotal,
            status: 'Processing',
            shippingAddress: shippingAddress,
            paymentMethod: paymentMethod,
            messages: [],
            invoice: '#'
        });

        if (paymentMethod === 'PAYTM' || paymentMethod === 'PHONEPE' || paymentMethod === 'RAZORPAY') {
            const newOrder = createOrderObject();
            newOrder.status = 'Pending Payment';

            try {
                // Save order first
                await addOrder(newOrder);

                if (paymentMethod === 'RAZORPAY') {
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
                        alert("Razorpay order creation failed: " + orderData.message);
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
                        name: "JPS Enterprise",
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
                                await refreshUser();
                                clearCart();
                                alert("Order placed successfully!");
                                router.push('/account');
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
                } else if (paymentMethod === 'PHONEPE') {
                    const res = await fetch(`${API_URL}/payment/phonepe/pay`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            amount: cartTotal,
                            userId: user.email,
                            mobileNumber: shippingAddress.phone,
                            orderId: newOrder.id
                        })
                    });
                    const data = await res.json();
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    } else {
                        alert('PhonePe initialization failed.');
                    }
                } else if (paymentMethod === 'PAYTM') {
                    const res = await fetch(`${API_URL}/payment/paytm/pay`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            amount: cartTotal,
                            email: shippingAddress.email,
                            mobile: shippingAddress.phone,
                            orderId: newOrder.id
                        })
                    });
                    const data = await res.json();

                    if (data.success && data.txnToken) {
                        // Load Paytm Script Dynamically using the MID returned from server
                        const scriptLoaded = await loadPaytmScript(data.mid);

                        if (scriptLoaded && window.Paytm && window.Paytm.CheckoutJS) {
                            const config = {
                                "root": "",
                                "flow": "DEFAULT",
                                "data": {
                                    "orderId": data.orderId,
                                    "token": data.txnToken,
                                    "tokenType": "TXN_TOKEN",
                                    "amount": data.amount
                                },
                                "merchant": {
                                    "mid": data.mid,
                                    "redirect": true,
                                    "callbackUrl": `${API_URL}/payment/paytm/callback`,
                                    "name": "JPS Enterprise"
                                },
                                "handler": {
                                    "notifyMerchant": function (eventName: string, data: any) {
                                        console.log("Paytm Notify:", eventName, data);
                                    },
                                    "transactionStatus": function (data: any) {
                                        console.log("Paytm Transaction Status", data);
                                    }
                                }
                            };

                            window.Paytm.CheckoutJS.init(config).then(function () {
                                window.Paytm.CheckoutJS.invoke();
                            }).catch(function (error: any) {
                                console.error("Paytm Init Error", error);
                                alert("Failed to open payment window.");
                            });
                        } else {
                            alert("Failed to load payment gateway.");
                        }
                    } else {
                        alert('Paytm initialization failed: ' + (data.error || 'Unknown error'));
                    }
                }
            } catch (err) {
                console.error(err);
                alert('Order/Payment Error');
            }
            return;
        }

        // COD Logic
        if (shouldSaveAddress) {
            try {
                await fetch(`${API_URL}/user/address`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: shippingAddress }),
                });
            } catch (err) {
                console.error("Failed to save address", err);
            }
        }

        const newOrder = createOrderObject();
        await addOrder(newOrder);
        await refreshOrders();
        await refreshUser();
        clearCart();
        alert("Order placed successfully via Cash on Delivery!");
        router.push('/account');
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

                            {savedAddresses.length > 0 && (
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
                            </div>
                        </div>
                    )}

                    {step === 'payment' && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-6">Payment Method</h2>
                            <div className="space-y-4">
                                <label className={`flex items-center p-4 border rounded cursor-pointer ${paymentMethod === 'COD' ? 'bg-indigo-50 border-brand-red ring-1 ring-brand-red' : 'bg-white hover:bg-gray-50'}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="COD"
                                        checked={paymentMethod === 'COD'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="mr-3 h-4 w-4 text-brand-red focus:ring-brand-red"
                                    />
                                    <span className="font-bold">Cash on Delivery</span>
                                </label>

                                <label className={`flex items-center p-4 border rounded cursor-pointer ${paymentMethod === 'PHONEPE' ? 'bg-indigo-50 border-brand-red ring-1 ring-brand-red' : 'bg-white hover:bg-gray-50'}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="PHONEPE"
                                        checked={paymentMethod === 'PHONEPE'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="mr-3 h-4 w-4 text-brand-red focus:ring-brand-red"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-bold">PhonePe</span>
                                        <span className="text-xs text-gray-500">UPI, Cards, NetBanking</span>
                                    </div>
                                </label>

                                <label className={`flex items-center p-4 border rounded cursor-pointer ${paymentMethod === 'PAYTM' ? 'bg-indigo-50 border-brand-red ring-1 ring-brand-red' : 'bg-white hover:bg-gray-50'}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="PAYTM"
                                        checked={paymentMethod === 'PAYTM'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="mr-3 h-4 w-4 text-brand-red focus:ring-brand-red"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-bold">Paytm</span>
                                        <span className="text-xs text-gray-500">Wallet, UPI, Cards, Postpaid</span>
                                    </div>
                                </label>

                                <label className={`flex items-center p-4 border rounded cursor-pointer ${paymentMethod === 'RAZORPAY' ? 'bg-indigo-50 border-brand-red ring-1 ring-brand-red' : 'bg-white hover:bg-gray-50'}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="RAZORPAY"
                                        checked={paymentMethod === 'RAZORPAY'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="mr-3 h-4 w-4 text-brand-red focus:ring-brand-red"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-bold">Razorpay</span>
                                        <span className="text-xs text-gray-500">UPI, Cards, NetBanking, Wallets</span>
                                    </div>
                                </label>
                            </div>
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
                            <button onClick={() => setStep('shipping')} className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-3 rounded uppercase tracking-wider transition shadow-md">
                                Continue to Shipping
                            </button>
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
                                <button onClick={handlePlaceOrder} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded uppercase tracking-wider transition shadow-md">
                                    Place Order
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
