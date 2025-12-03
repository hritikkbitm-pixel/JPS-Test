'use client';

import React from 'react';
import { useShop } from '@/context/ShopContext';
import AuditLogViewer from '../AuditLogViewer';

export default function DashboardView() {
    const { orders, products } = useShop();

    // Dashboard Calculations
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const lowStockProducts = products.filter(p => p.stock < 5).length;

    // Revenue Chart Data (Mock)
    const revenueData = orders.slice(0, 7).map(o => ({ date: o.date, total: o.total })).reverse();

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <div className="text-blue-500 text-sm font-bold uppercase tracking-wider mb-1">Total Revenue</div>
                    <div className="text-3xl font-black text-gray-800">₹{totalRevenue.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                    <div className="text-green-500 text-sm font-bold uppercase tracking-wider mb-1">Total Orders</div>
                    <div className="text-3xl font-black text-gray-800">{totalOrders}</div>
                </div>
                <div className="bg-red-50 p-6 rounded-lg border border-red-100">
                    <div className="text-red-500 text-sm font-bold uppercase tracking-wider mb-1">Low Stock Items</div>
                    <div className="text-3xl font-black text-gray-800">{lowStockProducts}</div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div>
                <h3 className="text-lg font-bold mb-4">Revenue Trends</h3>
                <div className="h-64 flex items-end gap-2 border-b border-l border-gray-300 p-4 bg-gray-50 rounded">
                    {revenueData.length > 0 ? revenueData.map((item, idx) => {
                        const max = Math.max(...revenueData.map(d => d.total));
                        const height = (item.total / max) * 100;
                        return (
                            <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative">
                                <div
                                    className="w-full bg-brand-red opacity-80 hover:opacity-100 transition-all rounded-t"
                                    style={{ height: `${height}%` }}
                                ></div>
                                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-1 rounded z-10 whitespace-nowrap">
                                    {item.date}: ₹{item.total.toLocaleString()}
                                </div>
                                <div className="mt-2 text-xs text-gray-500 rotate-45 origin-left">{item.date}</div>
                            </div>
                        );
                    }) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No data available</div>
                    )}
                </div>
            </div>

            <AuditLogViewer />
        </div>
    );
}
