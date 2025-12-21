'use client';

import React, { useState } from 'react';
import { useShop } from '@/context/ShopContext';
import { Order } from '@/lib/data';

// WhatsApp icon component
const WhatsAppIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

export default function OrdersView() {
    const { orders, updateOrderStatus, addOrderMessage } = useShop();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [messageText, setMessageText] = useState('');

    const handleWipeOrders = async () => {
        if (!confirm("Are you sure you want to delete ALL orders? This cannot be undone.")) return;
        try {
            await fetch('/api/orders/wipe', { method: 'DELETE' });
            window.location.reload();
        } catch (error) {
            console.error("Failed to wipe orders", error);
            alert("Failed to wipe orders");
        }
    };

    const formatWhatsAppLink = (number: string) => {
        // Remove any non-digit characters and add country code if needed
        const cleaned = number.replace(/\D/g, '');
        const withCountryCode = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
        return `https://wa.me/${withCountryCode}`;
    };

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
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Orders Management</h2>
                    <button onClick={handleWipeOrders} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm uppercase tracking-wider transition shadow-sm">
                        <i className="fas fa-trash mr-2"></i> Wipe All Orders
                    </button>
                </div>
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
                        {orders.map((order: any) => (
                            <tr key={order.id} className="border-b hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800">#{order.id}</span>
                                        {order.isGuestOrder && (
                                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Guest</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600">{order.date}</td>
                                <td className="p-4">
                                    <div className="font-bold text-gray-800">{order.shippingAddress?.fullName || order.shippingAddress?.label || 'Guest'}</div>
                                    <div className="text-xs text-gray-500">{order.shippingAddress?.city}</div>
                                    {order.isGuestOrder && order.whatsappNumber && (
                                        <a
                                            href={formatWhatsAppLink(order.whatsappNumber)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1 mt-1 text-xs text-green-600 hover:text-green-700 font-medium"
                                        >
                                            <WhatsAppIcon />
                                            <span>WhatsApp</span>
                                        </a>
                                    )}
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
                                        <option value="Pending Payment">Pending Payment</option>
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
                                <div className="flex items-center gap-2">
                                    <h3 className="font-black text-2xl text-gray-800">Order #{selectedOrder.id}</h3>
                                    {(selectedOrder as any).isGuestOrder && (
                                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded uppercase">Guest Order</span>
                                    )}
                                </div>
                                <p className="text-gray-500 text-sm font-medium">Placed on {selectedOrder.date}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-brand-red text-2xl transition">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {/* Guest Order WhatsApp Contact */}
                            {(selectedOrder as any).isGuestOrder && (selectedOrder as any).whatsappNumber && (
                                <div className="mb-6 bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h4 className="font-bold text-xs uppercase text-green-800 mb-2 tracking-wider flex items-center gap-2">
                                        <WhatsAppIcon />
                                        Guest Contact (WhatsApp)
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-gray-800">+91 {(selectedOrder as any).whatsappNumber}</span>
                                        <a
                                            href={formatWhatsAppLink((selectedOrder as any).whatsappNumber)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold text-sm transition flex items-center gap-2"
                                        >
                                            <WhatsAppIcon />
                                            Open Chat
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
                                <h4 className="font-bold text-xs uppercase text-blue-800 mb-2 tracking-wider">Shipping Address</h4>
                                {selectedOrder.shippingAddress ? (
                                    <div className="text-sm text-gray-700">
                                        <div className="font-bold text-gray-900">{(selectedOrder.shippingAddress as any).fullName || selectedOrder.shippingAddress.label}</div>
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
