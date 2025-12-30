'use client';

import React, { useState, useEffect } from 'react';
import { API_URL } from '@/config';

interface SiteInfo {
    bannerEnabled: boolean;
    bannerText: string;
    popupEnabled: boolean;
    popupTitle: string;
    popupContent: string;
}

export default function InformationView() {
    const [info, setInfo] = useState<SiteInfo>({
        bannerEnabled: true,
        bannerText: '',
        popupEnabled: true,
        popupTitle: '',
        popupContent: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        fetchInfo();
    }, []);

    const fetchInfo = async () => {
        try {
            const res = await fetch(`${API_URL}/siteinfo`);
            if (res.ok) {
                const data = await res.json();
                setInfo(data);
            }
        } catch (err) {
            console.error('Failed to fetch site info:', err);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            const res = await fetch(`${API_URL}/siteinfo`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(info)
            });
            if (res.ok) {
                setSaveMessage('Settings saved successfully!');
                setTimeout(() => setSaveMessage(''), 3000);
            } else {
                setSaveMessage('Failed to save settings');
            }
        } catch (err) {
            console.error('Save error:', err);
            setSaveMessage('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Save Message */}
            {saveMessage && (
                <div className={`p-4 rounded ${saveMessage.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {saveMessage}
                </div>
            )}

            {/* Scrolling Banner Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Scrolling Banner</h3>
                        <p className="text-sm text-gray-500">Animated marquee banner displayed below the navbar</p>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-sm font-medium text-gray-600">
                            {info.bannerEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={info.bannerEnabled}
                                onChange={(e) => setInfo({ ...info, bannerEnabled: e.target.checked })}
                                className="sr-only"
                            />
                            <div className={`w-14 h-7 rounded-full transition ${info.bannerEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${info.bannerEnabled ? 'translate-x-7' : ''}`}></div>
                        </div>
                    </label>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Banner Text</label>
                    <textarea
                        value={info.bannerText}
                        onChange={(e) => setInfo({ ...info, bannerText: e.target.value })}
                        rows={3}
                        className="w-full border rounded p-3 text-sm focus:outline-none focus:border-brand-red"
                        placeholder="Enter the scrolling banner text..."
                    />
                </div>

                {/* Preview */}
                {info.bannerEnabled && info.bannerText && (
                    <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Preview</label>
                        <div className="bg-brand-red text-white overflow-hidden whitespace-nowrap rounded">
                            <div className="py-2 px-4 text-sm font-medium">
                                {info.bannerText}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Popup Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Homepage Popup</h3>
                        <p className="text-sm text-gray-500">Disclaimer popup shown to visitors on the homepage</p>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-sm font-medium text-gray-600">
                            {info.popupEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={info.popupEnabled}
                                onChange={(e) => setInfo({ ...info, popupEnabled: e.target.checked })}
                                className="sr-only"
                            />
                            <div className={`w-14 h-7 rounded-full transition ${info.popupEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${info.popupEnabled ? 'translate-x-7' : ''}`}></div>
                        </div>
                    </label>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Popup Title</label>
                        <input
                            type="text"
                            value={info.popupTitle}
                            onChange={(e) => setInfo({ ...info, popupTitle: e.target.value })}
                            className="w-full border rounded p-3 text-sm focus:outline-none focus:border-brand-red"
                            placeholder="e.g., Important Notice"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Popup Content</label>
                        <textarea
                            value={info.popupContent}
                            onChange={(e) => setInfo({ ...info, popupContent: e.target.value })}
                            rows={6}
                            className="w-full border rounded p-3 text-sm focus:outline-none focus:border-brand-red"
                            placeholder="Enter the popup message content..."
                        />
                    </div>
                </div>

                {/* Preview */}
                {info.popupEnabled && info.popupContent && (
                    <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Preview</label>
                        <div className="border rounded-lg overflow-hidden max-w-md">
                            <div className="bg-brand-red text-white px-4 py-2 font-bold">
                                {info.popupTitle}
                            </div>
                            <div className="p-4 text-sm text-gray-700 whitespace-pre-line bg-gray-50">
                                {info.popupContent}
                            </div>
                            <div className="p-4 bg-gray-50 border-t">
                                <div className="bg-brand-red text-white text-center py-2 rounded text-sm font-bold">
                                    I Understand
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-brand-red text-white px-8 py-3 rounded font-bold uppercase tracking-wider hover:bg-red-700 transition disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
