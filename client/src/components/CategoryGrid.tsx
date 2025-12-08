'use client';

import React from 'react';

import { useShop } from '@/context/ShopContext';

interface CategoryGridProps {
    onSelectCategory: (category: string) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ onSelectCategory }) => {
    const { categories } = useShop();

    React.useEffect(() => {
        console.log('CategoryGrid updated categories:', categories);
    }, [categories]);

    return (
        <div className="mb-10">
            <h3 className="text-2xl font-bold mb-6">Shop by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        onClick={() => onSelectCategory(cat.id)}
                        className="cursor-pointer group relative rounded-lg overflow-hidden h-32 md:h-40 lg:h-56 w-full border shadow-sm hover:shadow-md transition bg-white"
                    >
                        <img src={cat.image || "https://via.placeholder.com/300?text=No+Category"} alt={cat.label} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                            <span className="text-white font-bold text-sm uppercase tracking-wider group-hover:text-red-400 transition">{cat.label}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryGrid;
