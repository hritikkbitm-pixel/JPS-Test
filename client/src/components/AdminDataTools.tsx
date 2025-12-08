'use client';

import React, { useState } from 'react';
import { Download, Upload, FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { generateCSV, parseCSV } from '../utils/csvParser';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';

export default function AdminDataTools() {
    const { setProducts } = useShop();
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const generateCSVTemplate = () => {
        const sampleRows: any[] = [
            // CPU Sample
            {
                id: 'cpu-sample-1',
                name: 'Sample CPU i9',
                price: 50000,
                stock: 10,
                category: 'cpu',
                brand: 'Intel',
                image: '/images/cpu-placeholder.png',
                images: [],
                specs: { socket: 'LGA1700', tdp: 125, cores: 24, threads: 32, base_clock: '3.0GHz', boost_clock: '5.8GHz' },
                sold: 0,
                available: true
            },
            // GPU Sample
            {
                id: 'gpu-sample-1',
                name: 'Sample RTX 4090',
                price: 160000,
                stock: 5,
                category: 'gpu',
                brand: 'ASUS',
                image: '/images/gpu-placeholder.png',
                images: [],
                specs: { chipset: 'NVIDIA', memory: '24GB GDDR6X', length_mm: 357, tdp: 450, boost_clock: '2520MHz' },
                sold: 0,
                available: true
            },
            // Motherboard Sample
            {
                id: 'mobo-sample-1',
                name: 'Sample Z790 Board',
                price: 35000,
                stock: 8,
                category: 'motherboard',
                brand: 'MSI',
                image: '/images/mobo-placeholder.png',
                images: [],
                specs: { socket: 'LGA1700', form_factor: 'ATX', chipset: 'Z790', memory_type: 'DDR5', m2_slots_gen4: 4, sata_ports: 6, max_memory_gb: 128 },
                sold: 0,
                available: true
            }
        ];

        const csvContent = generateCSV(sampleRows);

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'jps_inventory_flat.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const csvText = event.target?.result as string;

                // LOUD DEBUGGING - Raw CSV Text Preview
                console.log("Raw CSV Text Preview:", csvText.substring(0, 200));

                const products = await parseCSV(csvText);

                // Deduplicate products by ID
                const uniqueProductsMap = new Map();
                products.forEach(p => {
                    if (p.id) {
                        uniqueProductsMap.set(p.id, p);
                    }
                });
                const uniqueProducts = Array.from(uniqueProductsMap.values());

                // LOUD DEBUGGING - Mapped Products
                if (uniqueProducts.length > 0) {
                    console.log("Mapped Product 1:", uniqueProducts[0]);
                    console.log("Mapped Product 1 Specs:", uniqueProducts[0].specs);
                    console.log(`Removed ${products.length - uniqueProducts.length} duplicates.`);
                } else {
                    console.warn("Parsed products array is empty!");
                }

                // Send parsed JSON to server
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
                const response = await axios.post(`${apiUrl}/products/batch`, { products: uniqueProducts }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-email': user?.email || ''
                    }
                });
                console.log(`Successfully uploaded ${products.length} products to server.`);

                // Update Global State
                setProducts(products);
                console.log("Global Store Updated. Current Count:", products.length);

                setMessage({ type: 'success', text: response.data.message || 'Inventory updated successfully!' });
            } catch (error: any) {
                console.error('Upload failed', error);
                setMessage({ type: 'error', text: error.message || 'Failed to upload CSV.' });
            } finally {
                setUploading(false);
                // Reset input
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-red" />
                Data Management
            </h3>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={generateCSVTemplate}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition"
                >
                    <Download className="w-4 h-4" /> Download Template
                </button>

                <div className="relative">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                    />
                    <button
                        className={`flex items-center justify-center gap-2 px-4 py-2 bg-brand-red hover:bg-red-700 text-white rounded-md font-medium transition w-full sm:w-auto ${uploading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Uploading...' : 'Upload Inventory CSV'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mt-4 p-3 rounded-md flex items-start gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
                <p><strong>Note:</strong> Uploading a CSV will update existing products by ID and create new ones. A backup is automatically created on the server.</p>
            </div>
        </div>
    );
}
