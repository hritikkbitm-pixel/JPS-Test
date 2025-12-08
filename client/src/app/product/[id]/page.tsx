'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Product } from '@/lib/data';
import UniversalProductView from '@/components/product/UniversalProductView';
import Loading from '@/components/Loading';

export default function ProductPage() {
    const { id } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                // Try fetching from API
                const res = await axios.get(`http://localhost:5001/api/products/${id}`);
                if (res.data) {
                    setProduct(res.data);
                } else {
                    setError('Product not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load product');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) return <Loading />;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">{error}</div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

    // SEO / Title handled by NEXT.js usually, but we are client-side here.
    // In a real App Router setup, we'd fetch in generateMetadata in a layout/server component.
    // For now, this is a Client Component page.

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Back Button / Breadcrumb could go here */}
            <UniversalProductView product={product} />
        </div>
    );
}
