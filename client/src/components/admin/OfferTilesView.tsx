'use client';

import React, { useState, useEffect } from 'react';
import { API_URL } from '@/config';

interface OfferTile {
    id: string;
    season_id: string;
    title: string;
    subtitle: string;
    image_url: string;
    campaign_id: string;
    position: number;
    is_active: boolean;
}

interface Season { id: string; name: string; }
interface Campaign { id: string; name: string; season_id: string; }

export default function OfferTilesView() {
    const [tiles, setTiles] = useState<OfferTile[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTile, setEditingTile] = useState<OfferTile | null>(null);
    const [formData, setFormData] = useState({
        season_id: '',
        title: '',
        subtitle: '',
        image_url: '',
        campaign_id: '',
        position: 0,
        is_active: true
    });

    const fetchData = async () => {
        try {
            const [seasonsRes, campaignsRes] = await Promise.all([
                fetch(`${API_URL}/seasons`),
                fetch(`${API_URL}/campaigns`)
            ]);
            setSeasons(await seasonsRes.json());
            setCampaigns(await campaignsRes.json());
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTiles = async (seasonId: string) => {
        try {
            const res = await fetch(`${API_URL}/offer-tiles?season_id=${seasonId}`);
            setTiles(await res.json());
        } catch (err) {
            console.error('Failed to fetch tiles:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedSeason) {
            fetchTiles(selectedSeason);
        }
    }, [selectedSeason]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingTile ? `${API_URL}/offer-tiles/${editingTile.id}` : `${API_URL}/offer-tiles`;
            const method = editingTile ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, season_id: selectedSeason })
            });

            setShowForm(false);
            setEditingTile(null);
            setFormData({ season_id: '', title: '', subtitle: '', image_url: '', campaign_id: '', position: 0, is_active: true });
            fetchTiles(selectedSeason);
        } catch (err) {
            console.error('Failed to save tile:', err);
        }
    };

    const handleEdit = (tile: OfferTile) => {
        setEditingTile(tile);
        setFormData({
            season_id: tile.season_id,
            title: tile.title,
            subtitle: tile.subtitle || '',
            image_url: tile.image_url || '',
            campaign_id: tile.campaign_id,
            position: tile.position,
            is_active: tile.is_active
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this tile?')) return;
        try {
            await fetch(`${API_URL}/offer-tiles/${id}`, { method: 'DELETE' });
            fetchTiles(selectedSeason);
        } catch (err) {
            console.error('Failed to delete tile:', err);
        }
    };

    const seasonCampaigns = campaigns.filter(c => c.season_id === selectedSeason);

    if (loading) return <div className="animate-pulse">Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Offer Tiles</h3>
                <div className="flex gap-4 items-center">
                    <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)} className="border rounded px-3 py-2">
                        <option value="">Select Season...</option>
                        {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {selectedSeason && (
                        <button onClick={() => { setShowForm(true); setEditingTile(null); }} className="bg-brand-red text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-700">
                            + New Tile
                        </button>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4">{editingTile ? 'Edit Tile' : 'New Tile'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Title</label>
                                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border rounded px-3 py-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Subtitle</label>
                                <input type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="e.g., Up to 40% Off" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Image URL</label>
                                <input type="text" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full border rounded px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Linked Campaign</label>
                                <select value={formData.campaign_id} onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })} className="w-full border rounded px-3 py-2" required>
                                    <option value="">Select Campaign...</option>
                                    {seasonCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Position</label>
                                <input type="number" value={formData.position} onChange={(e) => setFormData({ ...formData, position: Number(e.target.value) })} className="w-full border rounded px-3 py-2" />
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

            {/* Tiles Grid */}
            {!selectedSeason ? (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-16 text-center text-gray-500">
                    <i className="fas fa-hand-pointer text-4xl mb-4"></i>
                    <p>Select a season to manage its offer tiles</p>
                </div>
            ) : tiles.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-16 text-center text-gray-500">
                    <i className="fas fa-th-large text-4xl mb-4"></i>
                    <p>No tiles yet. Create one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tiles.map((tile) => (
                        <div key={tile.id} className="bg-white rounded-lg shadow border overflow-hidden">
                            <div className="h-32 bg-gray-100 flex items-center justify-center">
                                {tile.image_url ? (
                                    <img src={tile.image_url} alt={tile.title} className="w-full h-full object-cover" />
                                ) : (
                                    <i className="fas fa-image text-3xl text-gray-300"></i>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold">{tile.title}</h4>
                                        <p className="text-sm text-red-500">{tile.subtitle}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${tile.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {tile.is_active ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mb-3">Position: {tile.position}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(tile)} className="text-blue-600 text-sm hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(tile.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
