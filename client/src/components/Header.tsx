"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CategoryDropdown from './CategoryDropdown';

import { checkIsAdmin } from '../utils/isAdmin';

export default function Header() {
    const { cartTotal, toggleCart, cart } = useCart();
    const { user, isLoading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            {/* 1. TOP STRIP */}
            <div className="bg-black text-gray-400 text-[11px] font-medium py-2 hidden md:block tracking-wide">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div className="flex gap-6">
                        <a href="tel:+919415409650" className="hover:text-white cursor-pointer transition">
                            <i className="fas fa-phone-alt mr-2 text-gray-500"></i>Call Us: +91 9415409650
                        </a>
                        <a href="mailto:pawan@jpsenterprises.in" className="hover:text-white cursor-pointer transition">
                            <i className="fas fa-envelope mr-2 text-gray-500"></i>pawan@jpsenterprises.in
                        </a>
                    </div>
                    <div className="flex gap-6">
                        <span className="text-white font-bold animate-pulse">BLACK NOVEMBER DEALS LIVE!</span>
                        <span className="hover:text-white cursor-pointer">My Account</span>
                        <span className="hover:text-white cursor-pointer">Wishlist</span>
                        <span className="hover:text-white cursor-pointer" onClick={toggleCart}>Checkout</span>
                    </div>
                </div>
            </div>

            {/* 2. MAIN HEADER */}
            <header className="bg-white sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-4 py-5">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                        {/* Logo */}
                        <div className="flex items-center justify-between w-full md:w-auto">
                            <Link href="/" className="flex items-center gap-3 group">
                                <div className="bg-brand-red text-white font-black text-4xl px-2 py-1 rounded-sm transform -skew-x-12 shadow-lg">
                                    JPS
                                </div>
                                <div className="flex flex-col justify-center">
                                    <span className="font-black text-2xl leading-none tracking-tighter text-gray-900">ENTERPRISE</span>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold">Gaming & Workstations</span>
                                </div>
                            </Link>
                            <button
                                className="md:hidden text-2xl text-gray-700 border p-2 rounded"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                <i className="fas fa-bars"></i>
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="w-full md:w-5/12 relative group">
                            <div className="flex h-11">
                                <input type="text"
                                    className="w-full border border-gray-300 border-r-0 rounded-l-md px-4 text-sm focus:outline-none focus:border-brand-red transition bg-gray-50 focus:bg-white"
                                    placeholder="Search for products (e.g., 'Ultra 9', 'RTX 5090')..." />
                                <button
                                    className="bg-brand-dark text-white px-6 rounded-r-md hover:bg-brand-red transition duration-300">
                                    <i className="fas fa-search"></i>
                                </button>
                            </div>
                        </div>

                        {/* Action Icons & ADMIN BUTTON */}
                        <div className="flex items-center gap-6 text-gray-600">

                            {/* NEW ADMIN BUTTON */}
                            {!isLoading && user && checkIsAdmin(user) && (
                                <Link href="/admin"
                                    className="hidden md:flex bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-brand-red transition items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                    <i className="fas fa-user-shield"></i> Admin Panel
                                </Link>
                            )}

                            {/* LOGIN / ACCOUNT BUTTON */}
                            {user ? (
                                <button onClick={() => window.location.href = '/account'}
                                    className="hidden md:flex bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 transition items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                    <i className="fas fa-user text-brand-red"></i> {user.name.split(' ')[0]}
                                </button>
                            ) : (
                                <button onClick={() => window.location.href = '/account'}
                                    className="hidden md:flex bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 transition items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                    <i className="fab fa-google text-brand-red"></i> Login
                                </button>
                            )}

                            <div className="h-8 w-px bg-gray-300 mx-2 hidden md:block"></div>

                            <Link href="/builder"
                                className="hidden md:flex flex-col items-center group transition" title="PC Configurator">
                                <div
                                    className="bg-gray-100 group-hover:bg-brand-red group-hover:text-white w-10 h-10 rounded-full flex items-center justify-center transition duration-300 mb-1">
                                    <i className="fas fa-tools text-sm"></i>
                                </div>
                                <span className="text-[10px] font-bold uppercase">Builder</span>
                            </Link>

                            <button onClick={toggleCart}
                                className="flex flex-col items-center group transition relative">
                                <div
                                    className="bg-gray-100 group-hover:bg-brand-red group-hover:text-white w-10 h-10 rounded-full flex items-center justify-center transition duration-300 mb-1 relative">
                                    <i className="fas fa-shopping-cart text-sm"></i>
                                    <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                                        {cart.length}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-[10px] font-bold uppercase">Cart</span>
                                    <span className="text-[10px] font-bold text-brand-red">₹{cartTotal.toLocaleString()}</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* 3. NAVIGATION MENU */}
            {/* 3. NAVIGATION MENU */}
            <nav className="bg-white border-t border-gray-200 hidden md:block shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] relative z-40">
                <div className="container mx-auto px-4 flex items-center gap-8">
                    {/* Category Dropdown */}
                    <CategoryDropdown />

                    {/* Quick Links */}
                    <ul className="flex gap-8 text-[13px] font-bold uppercase tracking-wide text-gray-800 py-3 flex-1">
                        <li><button onClick={() => window.location.href = '/'} className="nav-item hover:text-brand-red transition">Home</button></li>
                        <li><button onClick={() => window.location.href = '/builder'} className="nav-item hover:text-brand-red transition">PC Builder</button></li>
                        <li className="ml-auto"><button onClick={() => window.location.href = '/?category=all'} className="text-brand-red hover:underline flex items-center"><i className="fas fa-bolt mr-1"></i>New Arrivals</button></li>
                    </ul>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t shadow-lg">
                    <div className="flex flex-col text-sm font-semibold text-gray-700">
                        <Link href="/" className="p-4 border-b hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>All Products</Link>
                        <Link href="/builder" className="p-4 border-b text-brand-red bg-red-50" onClick={() => setIsMobileMenuOpen(false)}>PC System Builder</Link>
                        <Link href="/?category=cpu" className="p-4 border-b hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Processors</Link>
                        {!isLoading && user && checkIsAdmin(user) && (
                            <Link href="/admin" className="p-4 border-b hover:bg-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Admin Panel</Link>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
