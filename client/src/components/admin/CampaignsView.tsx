'use client';

import React, { useState, useEffect } from 'react';
import { API_URL } from '@/config';

interface Campaign {
    id: string;
    season_id: string;
    name: string;
    slug: string;
    filters: {
        category?: string;
        brand?: string;
        minDiscount?: number;
        maxPrice?: number;
    };
    is_active: boolean;
    priority: number;
}

interface Season {
    id: string;
    name: string;
}

const CATEGORIES = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling'];

export default function CampaignsView() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [previewCount, setPreviewCount] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        season_id: '',
        name: '',
        slug: '',
        filters: { category: '', brand: '', minDiscount: 0 } as { category?: string; brand?: string; minDiscount?: number },
        is_active: true,
        priority: 0
    });

    const fetchData = async () => {
        try {
            const [campaignsRes, seasonsRes] = await Promise.all([
                fetch(`${API_URL}/campaigns`),
                fetch(`${API_URL}/seasons`)
            ]);
            setCampaigns(await campaignsRes.json());
            setSeasons(await seasonsRes.json());
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePreview = async () => {
        try {
            const res = await fetch(`${API_URL}/campaigns/preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filters: formData.filters })
            });
            const data = await res.json();
            setPreviewCount(data.count);
        } catch (err) {
            console.error('Preview failed:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingCampaign ? `${API_URL}/campaigns/${editingCampaign.id}` : `${API_URL}/campaigns`;
            const method = editingCampaign ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            setShowForm(false);
            setEditingCampaign(null);
            setPreviewCount(null);
            setFormData({ season_id: '', name: '', slug: '', filters: { category: '', brand: '', minDiscount: 0 }, is_active: true, priority: 0 });
            fetchData();
        } catch (err) {
            console.error('Failed to save campaign:', err);
        }
    };

    const handleEdit = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setFormData({
            season_id: campaign.season_id,
            name: campaign.name,
            slug: campaign.slug,
            filters: campaign.filters || { category: '', brand: '', minDiscount: 0 },
            is_active: campaign.is_active,
            priority: campaign.priority
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this campaign?')) return;
        try {
            const res = await fetch(`${API_URL}/campaigns/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error);
                return;
            }
            fetchData();
        } catch (err) {
            console.error('Failed to delete campaign:', err);
        }
    };

    if (loading) return <div className="animate-pulse">Loading campaigns...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Campaigns</h3>
                <button
                    onClick={() => { setShowForm(true); setEditingCampaign(null); setPreviewCount(null); }}
                    className="bg-brand-red text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-700"
                >
                    + New Campaign
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Season</label>
                                <select value={formData.season_id} onChange={(e) => setFormData({ ...formData, season_id: e.target.value })} className="w-full border rounded px-3 py-2" required>
                                    <option value="">Select Season...</option>
                                    {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Name</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded px-3 py-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Slug</label>
                                <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="w-full border rounded px-3 py-2" required />
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-bold mb-3">Filter Rules</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Category</label>
                                        <select value={formData.filters.category} onChange={(e) => setFormData({ ...formData, filters: { ...formData.filters, category: e.target.value } })} className="w-full border rounded px-3 py-2">
                                            <option value="">All Categories</option>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Min Discount %</label>
                                        <input type="number" min="0" max="100" value={formData.filters.minDiscount || ''} onChange={(e) => setFormData({ ...formData, filters: { ...formData.filters, minDiscount: Number(e.target.value) } })} className="w-full border rounded px-3 py-2" placeholder="e.g., 20" />
                                    </div>
                                </div>
                                <button type="button" onClick={handlePreview} className="mt-3 text-sm text-blue-600 hover:underline">
                                    Preview Product Count
                                </button>
                                {previewCount !== null && (
                                    <p className="text-sm text-green-600 mt-1">{previewCount} products match these filters</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4" />
                                <label className="text-sm font-bold">Active</label>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="submit" className="bg-brand-red text-white px-4 py-2 rounded font-bold flex-1">Save</button>
                                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-2 rounded font-bold flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Campaigns Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left p-4 font-bold text-sm">Name</th>
                            <th className="text-left p-4 font-bold text-sm">Season</th>
                            <th className="text-left p-4 font-bold text-sm">Filters</th>
                            <th className="text-left p-4 font-bold text-sm">Status</th>
                            <th className="text-right p-4 font-bold text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaigns.map((campaign) => (
                            <tr key={campaign.id} className="border-t">
                                <td className="p-4 font-medium">{campaign.name}</td>
                                <td className="p-4 text-gray-500">{seasons.find(s => s.id === campaign.season_id)?.name || '-'}</td>
                                <td className="p-4 text-xs text-gray-500">
                                    {campaign.filters?.category && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded mr-1">{campaign.filters.category}</span>}
                                    {campaign.filters?.minDiscount && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{campaign.filters.minDiscount}%+ off</span>}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${campaign.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {campaign.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleEdit(campaign)} className="text-blue-600 hover:underline text-sm mr-3">Edit</button>
                                    <button onClick={() => handleDelete(campaign.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {campaigns.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No campaigns created yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
