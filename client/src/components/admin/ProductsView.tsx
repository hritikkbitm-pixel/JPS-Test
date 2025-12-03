'use client';

import React, { useState } from 'react';
import { useShop } from '@/context/ShopContext';
import { Product } from '@/lib/data';
import AdminDataTools from '../AdminDataTools';

export default function ProductsView() {
    const { products, addProduct, updateProduct, deleteProduct, toggleFeatured } = useShop();
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState<Partial<Product>>({
        name: '', price: 0, stock: 0, category: 'gpu', brand: '', image: '', specs: {}
    });

    const handleAddProduct = () => {
        setEditingProduct(null);
        setProductForm({ name: '', price: 0, stock: 0, category: 'gpu', brand: '', image: '', specs: {} });
        setIsProductModalOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductForm(product);
        setIsProductModalOpen(true);
    };

    const handleDeleteProduct = (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            deleteProduct(id);
        }
    };

    const handleSaveProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            updateProduct({ ...editingProduct, ...productForm } as Product);
        } else {
            addProduct({ ...productForm, id: Math.random().toString(36).substr(2, 9), sold: 0, available: true } as Product);
        }
        setIsProductModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button onClick={handleAddProduct} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold text-sm uppercase tracking-wider transition shadow-sm">
                    <i className="fas fa-plus mr-2"></i> Add Product
                </button>
            </div>

            <AdminDataTools />

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs uppercase text-gray-500 border-b bg-gray-50">
                            <th className="p-3">Product</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Stock</th>
                            <th className="p-3">Featured</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {products.map(product => (
                            <tr key={product.id} className="border-b hover:bg-gray-50 transition">
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <img src={product.image || "https://via.placeholder.com/40"} alt={product.name} className="w-10 h-10 object-contain border rounded bg-white" />
                                        <div>
                                            <div className="font-bold text-gray-800 line-clamp-1">{product.name}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-bold">{product.brand}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 text-gray-600 capitalize">{product.category}</td>
                                <td className="p-3 font-bold">₹{product.price.toLocaleString()}</td>
                                <td className="p-3">
                                    <span className={`font-bold ${product.stock < 5 ? 'text-red-600' : 'text-green-600'}`}>
                                        {product.stock}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <button
                                        onClick={() => toggleFeatured(product.id)}
                                        className={`text-2xl transition ${product.featured ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                                        title={product.featured ? 'Remove from featured' : 'Mark as featured'}
                                    >
                                        <i className="fas fa-star"></i>
                                    </button>
                                </td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleEditProduct(product)} className="text-blue-600 hover:text-blue-800 mr-3" title="Edit">
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button onClick={() => handleDeleteProduct(product.id)} className="text-red-400 hover:text-red-600" title="Delete">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm fade-in">
                    <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-lg flex flex-col shadow-2xl animate-scale-in">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                            <h3 className="font-black text-xl text-gray-800 uppercase">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-brand-red text-2xl transition">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <form onSubmit={handleSaveProduct} className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Product Name</label>
                                    <input type="text" required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Brand</label>
                                        <input type="text" required value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Category</label>
                                        <select required value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red bg-white">
                                            <option value="cpu">CPU</option>
                                            <option value="gpu">GPU</option>
                                            <option value="motherboard">Motherboard</option>
                                            <option value="ram">RAM</option>
                                            <option value="storage">Storage</option>
                                            <option value="psu">PSU</option>
                                            <option value="case">Case</option>
                                            <option value="cooling">Cooling</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Price (₹)</label>
                                        <input type="number" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Stock</label>
                                        <input type="number" required value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Image URL</label>
                                    <input type="url" value={productForm.image} onChange={e => setProductForm({ ...productForm, image: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
                                </div>
                                <button type="submit" className="w-full bg-brand-red text-white font-bold py-3 rounded hover:bg-red-700 transition uppercase tracking-wider text-sm shadow-md">
                                    {editingProduct ? 'Update Product' : 'Add Product'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
