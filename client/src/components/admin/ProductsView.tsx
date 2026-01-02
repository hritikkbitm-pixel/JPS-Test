'use client';

import React, { useState, useEffect } from 'react';
import { API_URL } from '@/config';
import { useShop } from '@/context/ShopContext';
import { Product } from '@/lib/data';
import AdminDataTools from '../AdminDataTools';
import axios from 'axios';

// Categories config
export default function ProductsView() {
    const { toggleFeatured, categories } = useShop();

    const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || 'cpu');
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [productForm, setProductForm] = useState<any>({});
    const [searchQuery, setSearchQuery] = useState('');

    // Update selected category if it no longer exists
    useEffect(() => {
        if (categories.length > 0 && !categories.find(c => c.id === selectedCategory)) {
            setSelectedCategory(categories[0].id);
        }
    }, [categories, selectedCategory]);

    // Fetch products for selected category from MongoDB (same as storefront)
    useEffect(() => {
        const fetchCategoryProducts = async () => {
            setIsLoading(true);
            try {
                // Use the same endpoint as storefront - reads from MongoDB
                const res = await axios.get(`${API_URL}/products?category=${selectedCategory}`, {
                    headers: { 'x-user-email': 'admin@jps.com' }
                });
                setProducts(res.data);
            } catch (err) {
                console.error("Failed to load products", err);
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (selectedCategory) {
            fetchCategoryProducts();
        }
    }, [selectedCategory]);

    const filteredProducts = products.filter(product => {
        const name = product.name || product.full_name || '';
        const brand = product.brand || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            brand.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleAddProduct = () => {
        setEditingProduct(null);
        setProductForm({
            category: selectedCategory,
            brand: '', name: '', price: '', stock_status: 'In Stock', image_url: ''
        });
        setIsProductModalOpen(true);
    };

    const handleEditProduct = (product: any) => {
        setEditingProduct(product);
        setProductForm(product);
        setIsProductModalOpen(true);
    };

    const handleDeleteProduct = async (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await axios.delete(`${API_URL}/products/cat/${selectedCategory}/${id}`, {
                    headers: { 'x-user-email': 'admin@jps.com' }
                });
                setProducts(prev => prev.filter(p => p.id !== id));
            } catch (err) {
                alert('Failed to delete product');
                console.error(err);
            }
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await axios.put(`${API_URL}/products/cat/${selectedCategory}/${editingProduct.id}`, productForm, {
                    headers: { 'x-user-email': 'admin@jps.com' }
                });
                setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productForm } : p));
            } else {
                const res = await axios.post(`${API_URL}/products/cat/${selectedCategory}`, productForm, {
                    headers: { 'x-user-email': 'admin@jps.com' }
                });
                setProducts(prev => [...prev, res.data]);
            }
            setIsProductModalOpen(false);
        } catch (err) {
            alert('Failed to save product');
            console.error(err);
        }
    };

    const handleDownloadCsv = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const fileName = `${selectedCategory || 'export'}_inventory.csv`;
            const res = await axios.get(`${API_URL}/products/cat/${selectedCategory}/csv`, {
                responseType: 'blob',
                headers: { 'x-user-email': 'admin@jps.com' }
            });

            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed", err);
            alert("Failed to download CSV.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1 w-full md:w-auto flex gap-2">
                    <div className="relative flex-grow">
                        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Search in category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-brand-red"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadCsv}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-bold uppercase tracking-wider transition border border-gray-300 flex items-center gap-2"
                            title="Download CSV"
                        >
                            <i className="fas fa-download"></i> <span className="hidden sm:inline">CSV</span>
                        </button>
                        <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-bold uppercase tracking-wider transition border border-gray-300 flex items-center gap-2 cursor-pointer">
                            <i className="fas fa-upload"></i> <span className="hidden sm:inline">Upload</span>
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        if (!confirm(`Upload ${file.name} to replace ${selectedCategory} inventory?`)) return;

                                        const formData = new FormData();
                                        formData.append('file', file);
                                        try {
                                            setIsLoading(true);
                                            await axios.post(`${API_URL}/products/cat/${selectedCategory}/csv`, formData, {
                                                headers: {
                                                    'x-user-email': 'admin@jps.com',
                                                    'Content-Type': 'multipart/form-data'
                                                }
                                            });
                                            alert('CSV Uploaded Successfully!');
                                            window.location.reload();
                                        } catch (err) {
                                            console.error(err);
                                            alert('Failed to upload CSV.');
                                            setIsLoading(false);
                                        }
                                    }
                                }}
                            />
                        </label>
                        {/* Lenovo-specific upload - only for laptops */}
                    </div>
                </div>
                <button onClick={handleAddProduct} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold text-sm uppercase tracking-wider transition shadow-sm whitespace-nowrap">
                    <i className="fas fa-plus mr-2"></i>Add Item
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat: any) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition ${selectedCategory === cat.id ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Lenovo Vendor CSV Upload - only visible for laptops */}
            {(selectedCategory === 'laptop' || selectedCategory === 'laptops') && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <i className="fas fa-laptop text-lg"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-900 text-sm">Lenovo Vendor Import</h4>
                            <p className="text-blue-700 text-xs">Upload vendor CSV with special schema (Series, MTM, final-price, etc.)</p>
                        </div>
                    </div>
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-md whitespace-nowrap">
                        <i className="fas fa-upload"></i> Upload Lenovo CSV
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];

                                    // Ask if user wants to clear existing Lenovo products
                                    const clearExisting = confirm(
                                        `🗑️ Clear existing Lenovo laptops before import?\n\n` +
                                        `Click OK to DELETE all existing Lenovo laptops and import fresh.\n` +
                                        `Click Cancel to ADD/UPDATE without deleting existing products.`
                                    );

                                    if (!confirm(`Upload Lenovo vendor CSV: ${file.name}?`)) return;

                                    const formData = new FormData();
                                    formData.append('file', file);
                                    try {
                                        setIsLoading(true);
                                        const url = clearExisting
                                            ? `${API_URL}/products/cat/laptops/lenovo/csv?clear=true`
                                            : `${API_URL}/products/cat/laptops/lenovo/csv`;
                                        const res = await axios.post(url, formData, {
                                            headers: {
                                                'x-user-email': 'admin@jps.com',
                                                'Content-Type': 'multipart/form-data'
                                            }
                                        });
                                        alert(res.data.message || 'Lenovo CSV Uploaded Successfully!');
                                        window.location.reload();
                                    } catch (err: any) {
                                        console.error(err);
                                        alert(err.response?.data?.message || 'Failed to upload Lenovo CSV.');
                                        setIsLoading(false);
                                    }
                                }
                            }}
                        />
                    </label>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading {selectedCategory} data...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs uppercase text-gray-500 border-b bg-gray-50">
                                    <th className="p-3">Image</th>
                                    <th className="p-3">Product Name</th>
                                    <th className="p-3">Brand</th>
                                    <th className="p-3">Price</th>
                                    <th className="p-3">Stock</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredProducts.length === 0 ? (
                                    <tr><td colSpan={6} className="p-4 text-center text-gray-400">No products found.</td></tr>
                                ) : (
                                    filteredProducts.map((product, idx) => (
                                        <tr key={product.id || idx} className="border-b hover:bg-gray-50 transition">
                                            <td className="p-3">
                                                <img src={product.image_url || product.image || "/placeholder.svg"} alt="" className="w-10 h-10 object-contain border rounded bg-white" />
                                            </td>
                                            <td className="p-3 font-bold text-gray-800">{product.name || product.full_name}</td>
                                            <td className="p-3 text-gray-600">{product.brand}</td>
                                            <td className="p-3 font-bold">₹{Number(product.price)?.toLocaleString()}</td>
                                            <td className="p-3">
                                                <span className={`font-bold ${product.stock_status === 'Out of Stock' ? 'text-red-600' : 'text-green-600'}`}>
                                                    {product.stock_status || (product.available === 'true' || product.available === true ? 'In Stock' : 'Out of Stock')}
                                                </span>
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isProductModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm fade-in">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-lg flex flex-col shadow-2xl animate-scale-in">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                            <h3 className="font-black text-xl text-gray-800 uppercase">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-brand-red text-2xl transition">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <form onSubmit={handleSaveProduct} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.keys(productForm).length > 0 ? Object.keys(productForm).map(key => {
                                        if (key === 'id') return null;
                                        return (
                                            <div key={key} className="col-span-1">
                                                <label className="block text-gray-700 text-xs font-bold mb-1 uppercase truncate" title={key}>{key.replace(/_/g, ' ')}</label>
                                                <input
                                                    type="text"
                                                    value={productForm[key]}
                                                    onChange={e => setProductForm({ ...productForm, [key]: e.target.value })}
                                                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-red"
                                                />
                                            </div>
                                        )
                                    }) : (
                                        <div className="col-span-2 text-gray-500">Add a product to see fields...</div>
                                    )}
                                </div>

                                <button type="submit" className="w-full bg-brand-red text-white font-bold py-3 rounded hover:bg-red-700 transition uppercase tracking-wider text-sm shadow-md mt-4">
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
