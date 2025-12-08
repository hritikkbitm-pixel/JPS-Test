import { useState, useEffect } from 'react';
import axios from 'axios';
import { Product } from '../lib/data';

interface CompatibilityResult {
    loading: boolean;
    recommendations: Record<string, Product[]>;
}

export function useCompatibility(product: Product | null) {
    const [result, setResult] = useState<CompatibilityResult>({
        loading: false,
        recommendations: {}
    });

    useEffect(() => {
        if (!product) return;

        const fetchRecommendations = async () => {
            setResult(prev => ({ ...prev, loading: true }));
            const recs: Record<string, Product[]> = {};

            try {
                // normalize helper
                const norm = (s: any) => String(s || '').toLowerCase().replace(/\s+/g, '');

                const category = product.category;
                const specs = product.specs as any;

                // --- 1. CPU -> Motherboards ---
                if (category === 'cpu' || category === 'cpus') {
                    const socket = norm(specs.socket);
                    if (socket) {
                        const res = await axios.get(`http://localhost:5001/api/products?category=motherboard`);
                        recs['Compatible Motherboards'] = res.data.filter((p: any) =>
                            norm(p.specs?.cpu_socket || p.specs?.socket) === socket
                        ).slice(0, 4);
                    }
                }

                // --- 2. Motherboard -> CPU, RAM ---
                if (category === 'motherboard' || category === 'motherboards') {
                    const socket = norm(specs.cpu_socket || specs.socket);
                    const memType = norm(specs.memory_type);

                    if (socket) {
                        const resCpu = await axios.get(`http://localhost:5001/api/products?category=cpu`);
                        recs['Compatible Processors'] = resCpu.data.filter((p: any) =>
                            norm(p.specs?.socket) === socket
                        ).slice(0, 4);
                    }
                    if (memType) {
                        const resRam = await axios.get(`http://localhost:5001/api/products?category=ram`);
                        recs['Compatible Memory'] = resRam.data.filter((p: any) =>
                            norm(p.specs?.memory_type) === memType
                        ).slice(0, 4);
                    }
                }

                // --- 3. GPU -> PSU ---
                if (category === 'gpu' || category === 'gpus') {
                    const recommendedWatts = Number(specs.recommended_psu || specs.recommended_psu_wattage || 650);
                    const resPsu = await axios.get(`http://localhost:5001/api/products?category=psu`);
                    recs['Recommended Power Supplies'] = resPsu.data.filter((p: any) => {
                        const psuWatts = Number(p.specs?.wattage || 0);
                        return psuWatts >= recommendedWatts;
                    }).slice(0, 4);
                }

                // --- 4. RAM -> Motherboard ---
                if (category === 'ram') {
                    const memType = norm(specs.memory_type);
                    if (memType) {
                        const resMobo = await axios.get(`http://localhost:5001/api/products?category=motherboard`);
                        recs['Compatible Motherboards'] = resMobo.data.filter((p: any) =>
                            norm(p.specs?.memory_type) === memType
                        ).slice(0, 4);
                    }
                }

                // --- 5. Case -> Motherboard Form Factors ---
                if (category === 'case' || category === 'cabinets') {
                    // Logic: Get supported mobo types
                    // This is complex as "E-ATX|ATX" string needs parsing.
                    // For now, let's just suggest "Popular Compatible Motherboards" (ATX usually safe)
                    const resMobo = await axios.get(`http://localhost:5001/api/products?category=motherboard`);
                    // Simple filter: if case says 'ITX' only, filter. Else show ATX.
                    const supportStr = (specs.form_factor || '').toUpperCase();
                    recs['Compatible Motherboards'] = resMobo.data.filter((p: any) => {
                        const moboFF = (p.specs?.form_factor || 'ATX').toUpperCase();
                        if (supportStr.includes(moboFF)) return true;
                        if (supportStr.includes('ATX') && moboFF === 'ATX') return true;
                        return false;
                    }).slice(0, 4);
                }

            } catch (err) {
                console.error("Failed to fetch recommendations", err);
            } finally {
                setResult({ loading: false, recommendations: recs });
            }
        };

        fetchRecommendations();
    }, [product]);

    return result;
}
