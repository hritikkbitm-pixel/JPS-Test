'use client';

import React, { useState } from 'react';
import { useShop } from '@/context/ShopContext';
import { Order } from '@/lib/data';

export default function OrdersView() {
    const { orders, updateOrderStatus, addOrderMessage } = useShop();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [messageText, setMessageText] = useState('');

    const handleUpdateStatus = (id: string, status: string) => {
        updateOrderStatus(id, status);
        if (selectedOrder && selectedOrder.id === id) {
            setSelectedOrder({ ...selectedOrder, status });
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder || !messageText.trim()) return;

        addOrderMessage(selectedOrder.id, messageText, 'Admin');

        // Optimistically update local selectedOrder to show message immediately
        const newMessage = { text: messageText, sender: 'Admin', date: new Date().toLocaleString() };
        setSelectedOrder({
            ...selectedOrder,
            messages: [...(selectedOrder.messages || []), newMessage]
        });

        setMessageText('');
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs uppercase text-gray-500 border-b bg-gray-50">
                            <th className="p-4">Order ID</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Total</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {orders.map(order => (
                            <tr key={order.id} className="border-b hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                <td className="p-4 font-bold text-gray-800">#{order.id}</td>
                                <td className="p-4 text-gray-600">{order.date}</td>
                                <td className="p-4">
                                    <div className="font-bold text-gray-800">{order.shippingAddress?.label || 'Guest'}</div>
                                    <div className="text-xs text-gray-500">{order.shippingAddress?.city}</div>
                                </td>
                                <td className="p-4 font-bold text-gray-800">₹{order.total.toLocaleString()}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === 'Shipped' ? 'bg-green-100 text-green-800' : order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                        className="border rounded p-1 text-xs bg-white focus:outline-none focus:border-brand-red"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm fade-in">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-lg flex flex-col shadow-2xl animate-scale-in">
                        <div className="p-6 border-b flex justify-between items-start bg-gray-50 rounded-t-lg">
                            <div>
                                <h3 className="font-black text-2xl text-gray-800">Order #{selectedOrder.id}</h3>
                                <p className="text-gray-500 text-sm font-medium">Placed on {selectedOrder.date}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-brand-red text-2xl transition">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
                                <h4 className="font-bold text-xs uppercase text-blue-800 mb-2 tracking-wider">Shipping Address</h4>
                                {selectedOrder.shippingAddress ? (
                                    <div className="text-sm text-gray-700">
                                        <div className="font-bold text-gray-900">{selectedOrder.shippingAddress.label}</div>
                                        <div>{selectedOrder.shippingAddress.line1}</div>
                                        {selectedOrder.shippingAddress.line2 && <div>{selectedOrder.shippingAddress.line2}</div>}
                                        <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}</div>
                                        <div className="mt-2 font-bold flex items-center gap-2"><i className="fas fa-phone text-xs"></i> {selectedOrder.shippingAddress.phone}</div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 italic">No address provided</div>
                                )}
                            </div>

                            <h4 className="font-bold text-lg mb-4 border-b pb-2">Items Ordered</h4>
                            <div className="space-y-4 mb-8">
                                {selectedOrder.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 border p-3 rounded hover:shadow-sm transition bg-white">
                                        <img src={item.image || "https://via.placeholder.com/64"} alt={item.name} className="w-16 h-16 object-contain border rounded p-1" />
                                        <div className="flex-grow">
                                            <div className="font-bold text-sm text-gray-800">{item.name}</div>
                                            <div className="text-xs text-gray-500 font-bold uppercase">{item.brand}</div>
                                        </div>
                                        <div className="font-black text-brand-red">₹{item.price.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Messages Section */}
                            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                <h4 className="font-bold text-sm uppercase text-gray-700 mb-4">Messages & Updates</h4>
                                <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                                    {selectedOrder.messages && selectedOrder.messages.length > 0 ? (
                                        selectedOrder.messages.map((msg, idx) => (
                                            <div key={idx} className={`p-3 rounded text-sm ${msg.sender === 'Admin' ? 'bg-blue-100 ml-8' : 'bg-white border mr-8'}`}>
                                                <div className="font-bold text-xs mb-1">{msg.sender} <span className="font-normal text-gray-500 text-[10px] ml-2">{msg.date}</span></div>
                                                <div>{msg.text}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-400 text-sm italic text-center py-2">No messages yet.</div>
                                    )}
                                </div>
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={messageText}
                                        onChange={e => setMessageText(e.target.value)}
                                        placeholder="Type a message to the customer..."
                                        className="flex-grow border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red"
                                    />
                                    <button type="submit" className="bg-brand-red text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-700 transition">Send</button>
                                </form>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 text-right rounded-b-lg">
                            <button onClick={() => setSelectedOrder(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded font-bold hover:bg-gray-300 uppercase text-xs tracking-wider transition">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
