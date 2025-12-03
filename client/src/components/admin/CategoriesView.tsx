'use client';

import React, { useState } from 'react';
import { useShop } from '@/context/ShopContext';
import { Category } from '@/lib/data';

export default function CategoriesView() {
    const { categories, addCategory, updateCategory, deleteCategory } = useShop();
    const [categoryForm, setCategoryForm] = useState<Category>({
        id: '',
        label: '',
        image: ''
    });

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryForm.id || !categoryForm.label) return;
        addCategory(categoryForm);
        setCategoryForm({ id: '', label: '', image: '' });
    };

    const handleDeleteCategory = (id: string) => {
        deleteCategory(id);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add Category Form */}
            <div className="bg-white p-6 rounded shadow border border-gray-200">
                <h3 className="font-bold text-lg mb-4">Add New Category</h3>
                <form onSubmit={handleAddCategory} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID (e.g., 'cpu')</label>
                        <input
                            type="text"
                            value={categoryForm.id}
                            onChange={e => setCategoryForm({ ...categoryForm, id: e.target.value })}
                            className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                            placeholder="unique-id"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Label (e.g., 'Processors')</label>
                        <input
                            type="text"
                            value={categoryForm.label}
                            onChange={e => setCategoryForm({ ...categoryForm, label: e.target.value })}
                            className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                            placeholder="Display Name"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL</label>
                        <input
                            type="text"
                            value={categoryForm.image}
                            onChange={e => setCategoryForm({ ...categoryForm, image: e.target.value })}
                            className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                            placeholder="https://..."
                        />
                    </div>
                    <button type="submit" className="w-full bg-brand-red text-white font-bold py-2 rounded hover:bg-red-700 transition">ADD</button>
                </form>
            </div>

            {/* Category List */}
            <div>
                {categories.map(cat => (
                    <div key={cat.id} className="bg-white p-4 rounded shadow flex gap-4 items-start border border-gray-200 mb-4">
                        <img src={cat.image} alt={cat.label} className="w-24 h-24 object-cover rounded bg-gray-100" />
                        <div className="flex-grow">
                            <h4 className="font-bold text-lg mb-2">{cat.label}</h4>
                            <div className="mb-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        defaultValue={cat.image}
                                        onBlur={(e) => {
                                            if (e.target.value !== cat.image) {
                                                updateCategory({ ...cat, image: e.target.value });
                                            }
                                        }}
                                        className="w-full border p-2 rounded text-sm focus:outline-none focus:border-brand-red"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-400">ID: {cat.id}</p>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600 text-sm" title="Delete">
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
