"use client";

import React from 'react';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
    const { isCartOpen, toggleCart, cart, removeFromCart, cartTotal, updateQuantity } = useCart();

    return (
        <div id="cart-modal" className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={toggleCart}></div>
            <div className={`absolute right-0 top-0 h-full w-full md:w-[450px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
                id="cart-panel">
                <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-xl text-gray-800">Shopping Cart</h2>
                    <button onClick={toggleCart}
                        className="text-gray-400 hover:text-brand-red text-2xl">&times;</button>
                </div>
                <div id="cart-items" className="flex-grow overflow-y-auto p-5 space-y-6">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">Your cart is empty.</div>
                    ) : (
                        cart.map((item, index) => (
                            <div key={index} className="flex gap-4 items-center border-b pb-4">
                                <img src={item.image || "https://via.placeholder.com/64"} alt={item.name} className="w-16 h-16 object-contain border rounded p-1" />
                                <div className="flex-grow">
                                    <div className="text-[10px] font-bold text-gray-500 uppercase">{item.brand}</div>
                                    <div className="font-bold text-sm text-gray-800 line-clamp-1">{item.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center border rounded">
                                            <button onClick={() => updateQuantity(index, (item.stock || 1) - 1)} className="px-2 py-0.5 text-gray-500 hover:text-brand-red font-bold">-</button>
                                            <span className="px-2 text-xs font-bold">{item.stock || 1}</span>
                                            <button onClick={() => updateQuantity(index, (item.stock || 1) + 1)} className="px-2 py-0.5 text-gray-500 hover:text-brand-red font-bold">+</button>
                                        </div>
                                        <div className="font-black text-brand-red text-sm">₹{(item.price * (item.stock || 1)).toLocaleString()}</div>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(index)} className="text-gray-400 hover:text-red-600">
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-6 bg-gray-50 border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between text-gray-600 mb-2 text-sm">
                        <span>Subtotal</span>
                        <span id="cart-subtotal">₹{cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black text-gray-900 mb-6">
                        <span>Total</span>
                        <span id="cart-total" className="text-brand-red">₹{cartTotal.toLocaleString()}</span>
                    </div>
                    <a href="/cart" onClick={toggleCart}
                        className="block w-full bg-brand-red hover:bg-red-700 text-white font-bold py-4 rounded shadow-lg transition transform hover:-translate-y-1 uppercase tracking-widest text-sm text-center">
                        Proceed to Checkout
                    </a>
                </div>
            </div>
        </div>
    );
}
