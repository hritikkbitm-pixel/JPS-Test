'use client';

import React, { useState, useEffect } from 'react';
import { API_URL } from '@/config';

interface Season {
    id: string;
    name: string;
    slug: string;
    hero_banner_image: string;
    subtitle: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export default function SeasonsView() {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSeason, setEditingSeason] = useState<Season | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        hero_banner_image: '',
        subtitle: '',
        start_date: '',
        end_date: '',
        is_active: false
    });

    const fetchSeasons = async () => {
        try {
            const res = await fetch(`${API_URL}/seasons`);
            const data = await res.json();
            setSeasons(data);
        } catch (err) {
            console.error('Failed to fetch seasons:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeasons();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingSeason ? `${API_URL}/seasons/${editingSeason.id}` : `${API_URL}/seasons`;
            const method = editingSeason ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            setShowForm(false);
            setEditingSeason(null);
            setFormData({ name: '', slug: '', hero_banner_image: '', subtitle: '', start_date: '', end_date: '', is_active: false });
            fetchSeasons();
        } catch (err) {
            console.error('Failed to save season:', err);
        }
    };

    const handleEdit = (season: Season) => {
        setEditingSeason(season);
        setFormData({
            name: season.name,
            slug: season.slug,
            hero_banner_image: season.hero_banner_image || '',
            subtitle: season.subtitle || '',
            start_date: season.start_date ? new Date(season.start_date).toISOString().split('T')[0] : '',
            end_date: season.end_date ? new Date(season.end_date).toISOString().split('T')[0] : '',
            is_active: season.is_active
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this season?')) return;
        try {
            const res = await fetch(`${API_URL}/seasons/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error);
                return;
            }
            fetchSeasons();
        } catch (err) {
            console.error('Failed to delete season:', err);
        }
    };

    const handleToggleActive = async (season: Season) => {
        try {
            await fetch(`${API_URL}/seasons/${season.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...season, is_active: !season.is_active })
            });
            fetchSeasons();
        } catch (err) {
            console.error('Failed to toggle season:', err);
        }
    };

    if (loading) {
        return <div className="animate-pulse">Loading seasons...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Seasonal Campaigns</h3>
                <button
                    onClick={() => { setShowForm(true); setEditingSeason(null); setFormData({ name: '', slug: '', hero_banner_image: '', subtitle: '', start_date: '', end_date: '', is_active: false }); }}
                    className="bg-brand-red text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-700"
                >
                    + New Season
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4">{editingSeason ? 'Edit Season' : 'New Season'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Name</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded px-3 py-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Slug (URL-friendly)</label>
                                <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="w-full border rounded px-3 py-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Hero Banner Image URL</label>
                                <input type="text" value={formData.hero_banner_image} onChange={(e) => setFormData({ ...formData, hero_banner_image: e.target.value })} className="w-full border rounded px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Subtitle</label>
                                <input type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} className="w-full border rounded px-3 py-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Start Date</label>
                                    <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">End Date</label>
                                    <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full border rounded px-3 py-2" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4" />
                                <label className="text-sm font-bold">Active (shown on Home Page)</label>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="submit" className="bg-brand-red text-white px-4 py-2 rounded font-bold flex-1">Save</button>
                                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded font-bold flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Seasons Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left p-4 font-bold text-sm">Name</th>
                            <th className="text-left p-4 font-bold text-sm">Slug</th>
                            <th className="text-left p-4 font-bold text-sm">Status</th>
                            <th className="text-left p-4 font-bold text-sm">Dates</th>
                            <th className="text-right p-4 font-bold text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {seasons.map((season) => (
                            <tr key={season.id} className="border-t">
                                <td className="p-4 font-medium">{season.name}</td>
                                <td className="p-4 text-gray-500">/season/{season.slug}</td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleToggleActive(season)}
                                        className={`px-2 py-1 rounded text-xs font-bold ${season.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                    >
                                        {season.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </button>
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {season.start_date && new Date(season.start_date).toLocaleDateString()} - {season.end_date && new Date(season.end_date).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleEdit(season)} className="text-blue-600 hover:underline text-sm mr-3">Edit</button>
                                    <button onClick={() => handleDelete(season.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {seasons.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">No seasons created yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
