"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';

export default function AccountPage() {
    const { user, logout } = useAuth();
    const { orders } = useShop();
    const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');
    const [showRegister, setShowRegister] = useState(false);

    // Fetch addresses when tab changes to addresses
    React.useEffect(() => {
        if (activeTab === 'addresses' && user?.email) {
            fetch('/api/user/address')
                .then(res => res.json())
                .then(data => {
                    if (data.addresses) {
                        setLocalAddresses(data.addresses);
                    }
                })
                .catch(err => console.error("Failed to load addresses", err));
        }
    }, [activeTab, user]);

    const [localAddresses, setLocalAddresses] = useState<any[]>([]);

    // Sync local addresses with user.addresses initially
    React.useEffect(() => {
        if (user?.addresses) {
            setLocalAddresses(user.addresses);
        }
    }, [user]);

    const handleDeleteAddress = async (index: number) => {
        if (!confirm("Are you sure you want to delete this address?")) return;

        try {
            const res = await fetch('/api/user/address', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ index }),
            });
            const data = await res.json();
            if (data.addresses) {
                setLocalAddresses(data.addresses);
            }
        } catch (err) {
            console.error("Failed to delete address", err);
            alert("Failed to delete address");
        }
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-10">
                <div className="max-w-md mx-auto">
                    {showRegister ? (
                        <>
                            <RegisterForm />
                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <button
                                        onClick={() => setShowRegister(false)}
                                        className="text-brand-red font-bold hover:underline"
                                    >
                                        Login
                                    </button>
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <LoginForm />
                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-600">
                                    Don't have an account?{' '}
                                    <button
                                        onClick={() => setShowRegister(true)}
                                        className="text-brand-red font-bold hover:underline"
                                    >
                                        Register
                                    </button>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b pb-4">
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Welcome Back</div>
                    <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">{user.name}</h2>
                </div>
                <button onClick={logout} className="text-xs font-bold text-brand-red hover:underline mt-4 md:mt-0">LOGOUT</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-2">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`w-full p-4 rounded font-bold text-sm flex justify-between items-center shadow-md transition ${activeTab === 'orders' ? 'bg-brand-red text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                        <span><i className="fas fa-box-open mr-2"></i> My Orders</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'orders' ? 'bg-white text-brand-red' : 'bg-gray-200 text-gray-600'}`}>{user.orders?.length || 0}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('addresses')}
                        className={`w-full p-4 rounded font-bold text-sm flex justify-between items-center shadow-md transition ${activeTab === 'addresses' ? 'bg-brand-red text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                        <span><i className="fas fa-map-marker-alt mr-2"></i> My Addresses</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    {activeTab === 'orders' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold mb-4">Order History</h3>
                            {user.orders && user.orders.length > 0 ? (
                                user.orders.map((userOrder) => {
                                    // Find live order data from ShopContext (API)
                                    const liveOrder = orders.find(o => o.id === userOrder.id) || userOrder;

                                    return (
                                        <div key={liveOrder.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                            <div className="flex justify-between items-start mb-4 border-b pb-4">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</span>
                                                    <div className="font-bold text-lg text-gray-800">{liveOrder.id}</div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</span>
                                                    <div className="font-bold text-gray-600">{liveOrder.date}</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2 mb-4">
                                                {liveOrder.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-700">{item.name}</span>
                                                        <span className="font-bold text-gray-900">₹{item.price.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Messages Section */}
                                            {liveOrder.messages && liveOrder.messages.length > 0 && (
                                                <div className="mb-4 bg-gray-50 p-3 rounded text-sm">
                                                    <div className="font-bold text-gray-500 text-xs uppercase mb-2">Messages</div>
                                                    <div className="space-y-2">
                                                        {liveOrder.messages.map((msg, idx) => (
                                                            <div key={idx} className="border-l-2 border-brand-red pl-2">
                                                                <div className="text-gray-800">{msg.text}</div>
                                                                <div className="text-xs text-gray-400">{msg.sender} • {msg.date}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                                <div className="font-bold text-brand-red">
                                                    Total: ₹{liveOrder.total.toLocaleString()}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${liveOrder.status === 'Shipped' ? 'bg-green-100 text-green-800' : liveOrder.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {liveOrder.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    No orders found.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'addresses' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold mb-4">Saved Addresses</h3>
                            {localAddresses && localAddresses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {localAddresses.map((addr, idx) => (
                                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm relative group">
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={() => handleDeleteAddress(idx)} className="text-gray-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                                            </div>
                                            <div className="font-bold text-gray-800 mb-2">{addr.label}</div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div>{addr.line1}</div>
                                                {addr.line2 && <div>{addr.line2}</div>}
                                                <div>{addr.city}, {addr.state} {addr.zip}</div>
                                                <div className="pt-2 font-bold text-gray-500">{addr.phone}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    No addresses saved.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
