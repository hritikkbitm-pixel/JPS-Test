import React from 'react';
import { Product } from '@/lib/data';
import { useCompatibility } from '@/hooks/useCompatibility';
import Link from 'next/link';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface CompatibilitySectionProps {
    product: Product;
}

export default function CompatibilitySection({ product }: CompatibilitySectionProps) {
    const { loading, recommendations } = useCompatibility(product);

    if (loading) return <div className="p-4 bg-gray-50 rounded animate-pulse">Checking compatibility...</div>;

    // Check if we have any recommendations
    const hasRecs = Object.values(recommendations).some(list => list.length > 0);

    if (!hasRecs) return null;

    return (
        <div className="bg-green-50 rounded-xl border border-green-100 p-6 lg:p-8 mb-8">
            <h2 className="text-xl font-black uppercase text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Recommended Compatible Parts
            </h2>
            <p className="text-sm text-green-700 mb-6">Based on the specifications of <strong>{product.name}</strong>, these parts are guaranteed to work.</p>

            <div className="space-y-6">
                {Object.entries(recommendations).map(([label, parts]) => (
                    parts.length > 0 && (
                        <div key={label}>
                            <h3 className="text-xs font-bold uppercase text-gray-500 mb-3 ml-1">{label}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {parts.map(part => (
                                    <Link key={part.id} href={`/product/${part.id}`} className="group bg-white p-3 rounded-lg border border-green-200 hover:shadow-md transition block">
                                        <div className="h-24 flex items-center justify-center mb-2 px-2">
                                            <img src={part.image || "https://via.placeholder.com/150"} alt={part.name} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition" />
                                        </div>
                                        <div className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-brand-red mb-1">
                                            {part.name}
                                        </div>
                                        <div className="text-xs font-black text-green-600">₹{part.price.toLocaleString()}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}
