'use client';

import React, { useState } from 'react';
import DashboardView from '@/components/admin/DashboardView';
import OrdersView from '@/components/admin/OrdersView';
import ProductsView from '@/components/admin/ProductsView';
import MarketingView from '@/components/admin/MarketingView';
import CategoriesView from '@/components/admin/CategoriesView';

export default function AdminPage() {
    const [view, setView] = useState('dashboard'); // dashboard, orders, products, marketing, categories

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-black text-white flex flex-col shadow-xl z-10">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-2xl font-black tracking-tighter text-brand-red">ADMIN<span className="text-white">PANEL</span></h1>
                </div>
                <nav className="flex-grow p-4 space-y-2">
                    <button
                        onClick={() => setView('dashboard')}
                        className={`w-full text-left p-3 rounded transition flex items-center gap-3 ${view === 'dashboard' ? 'bg-brand-red text-white shadow-md' : 'hover:bg-gray-900 text-gray-400'}`}
                    >
                        <i className="fas fa-chart-line w-5 text-center"></i> Dashboard
                    </button>
                    <button
                        onClick={() => setView('orders')}
                        className={`w-full text-left p-3 rounded transition flex items-center gap-3 ${view === 'orders' ? 'bg-brand-red text-white shadow-md' : 'hover:bg-gray-900 text-gray-400'}`}
                    >
                        <i className="fas fa-shopping-cart w-5 text-center"></i> Orders
                    </button>
                    <button
                        onClick={() => setView('products')}
                        className={`w-full text-left p-3 rounded transition flex items-center gap-3 ${view === 'products' ? 'bg-brand-red text-white shadow-md' : 'hover:bg-gray-900 text-gray-400'}`}
                    >
                        <i className="fas fa-box w-5 text-center"></i> Products
                    </button>
                    <button
                        onClick={() => setView('marketing')}
                        className={`w-full text-left p-3 rounded transition flex items-center gap-3 ${view === 'marketing' ? 'bg-brand-red text-white shadow-md' : 'hover:bg-gray-900 text-gray-400'}`}
                    >
                        <i className="fas fa-bullhorn w-5 text-center"></i> Ad & Offers
                    </button>
                    <button
                        onClick={() => setView('categories')}
                        className={`w-full text-left p-3 rounded transition flex items-center gap-3 ${view === 'categories' ? 'bg-brand-red text-white shadow-md' : 'hover:bg-gray-900 text-gray-400'}`}
                    >
                        <i className="fas fa-th-large w-5 text-center"></i> Categories
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
                    v1.0.0 Admin Console
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow p-8 overflow-y-auto h-screen">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">{view}</h2>
                </div>

                {view === 'dashboard' && <DashboardView />}
                {view === 'orders' && <OrdersView />}
                {view === 'products' && <ProductsView />}
                {view === 'marketing' && <MarketingView />}
                {view === 'categories' && <CategoriesView />}
            </div >
        </div>
    );
}

