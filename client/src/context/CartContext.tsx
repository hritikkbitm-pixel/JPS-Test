"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

import { Product } from '@/lib/data';

interface CartContextType {
    cart: Product[];
    addToCart: (product: Product) => void;
    removeFromCart: (index: number) => void;
    clearCart: () => void;
    cartTotal: number;
    isCartOpen: boolean;
    toggleCart: () => void;
    updateQuantity: (index: number, newQuantity: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [cart, setCart] = useState<Product[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('jps_cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('jps_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existingItemIndex = prev.findIndex(item => item.id === product.id);
            if (existingItemIndex > -1) {
                const newCart = [...prev];
                newCart[existingItemIndex].stock = (newCart[existingItemIndex].stock || 1) + 1;
                return newCart;
            }
            return [...prev, { ...product, stock: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (index: number) => {
        setCart((prev) => prev.filter((_, i) => i !== index));
    };

    const clearCart = () => {
        setCart([]);
    };

    const toggleCart = () => {
        setIsCartOpen((prev) => !prev);
    };

    const updateQuantity = (index: number, newQuantity: number) => {
        if (newQuantity < 1) return;
        setCart((prev) => {
            const newCart = [...prev];
            newCart[index] = { ...newCart[index], stock: newQuantity }; // Using stock property temporarily for quantity as CartItem extends Product
            return newCart;
        });
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.price * (item.stock || 1), 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal, isCartOpen, toggleCart, updateQuantity }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
