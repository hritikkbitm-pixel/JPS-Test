'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { products as initialProducts, orders as initialOrders, banners as initialBanners, initialCategories, Product, Order, Banner, Category } from '@/lib/data';

import { API_URL } from '@/config';

interface ShopContextType {
    products: Product[];
    orders: Order[];
    banners: Banner[];
    categories: Category[];
    addProduct: (product: Product) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (productId: string) => void;
    setProducts: (products: Product[]) => void;
    addBanner: (banner: Banner) => void;
    removeBanner: (id: string) => void;
    updateCategory: (category: Category) => void;
    addCategory: (category: Category) => void;
    deleteCategory: (id: string) => void;
    addOrder: (order: Order) => void;
    updateOrderStatus: (orderId: string, status: string) => void;
    addOrderMessage: (orderId: string, text: string, sender: string) => void;
    toggleFeatured: (productId: string) => void;
    refreshOrders: () => Promise<void>;
    isLoading: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
    const [products, setProductsState] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [isLoading, setIsLoading] = useState(true);


    // Helper to ensure banners have IDs
    const ensureIds = (list: Banner[]) => list.map(b => ({
        ...b,
        id: b.id || Math.random().toString(36).substr(2, 9)
    }));

    const getAuthHeaders = () => {
        try {
            const userStr = localStorage.getItem('jps_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                return { 'x-user-email': user.email || '' };
            }
        } catch (e) { console.error(e); }
        return { 'x-user-email': '' };
    };



    // Load ALL data in parallel (3x faster than sequential)
    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);

            try {
                // Parallel fetch - all requests start at the same time
                const [productsRes, bannersRes, categoriesRes] = await Promise.all([
                    fetch(`${API_URL}/products`).catch(() => null),
                    fetch(`${API_URL}/banners`).catch(() => null),
                    fetch(`${API_URL}/categories`).catch(() => null),
                ]);

                // Process products
                if (productsRes?.ok) {
                    const data = await productsRes.json();
                    if (data.length > 0) {
                        setProductsState(data);
                    } else {
                        setProductsState(initialProducts);
                    }
                } else {
                    const savedProducts = localStorage.getItem('shop_products');
                    setProductsState(savedProducts ? JSON.parse(savedProducts) : initialProducts);
                }

                // Process banners
                if (bannersRes?.ok) {
                    const data = await bannersRes.json();
                    setBanners(data.length > 0 ? data : ensureIds(initialBanners || []));
                } else {
                    setBanners(ensureIds(initialBanners || []));
                }

                // Process categories
                if (categoriesRes?.ok) {
                    const data = await categoriesRes.json();
                    setCategories(data.length > 0 ? [...data] : initialCategories);
                } else {
                    const savedCategories = localStorage.getItem('shop_categories');
                    setCategories(savedCategories ? JSON.parse(savedCategories) : initialCategories);
                }

            } catch (error) {
                console.error('Failed to fetch data:', error);
                // Fallback to initial/cached data
                setProductsState(initialProducts);
                setBanners(ensureIds(initialBanners || []));
                setCategories(initialCategories);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []);


    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_URL}/orders`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            const savedOrders = localStorage.getItem('shop_orders');
            if (savedOrders) {
                setOrders(JSON.parse(savedOrders));
            } else {
                setOrders(initialOrders);
            }
        }
    };

    const refreshOrders = async () => {
        await fetchOrders();
    };

    // Load orders from API
    useEffect(() => {
        fetchOrders();
    }, []);

    // Save products to local storage as backup
    useEffect(() => {
        if (products.length > 0) {
            localStorage.setItem('shop_products', JSON.stringify(products));
        }
    }, [products]);

    const updateCategory = async (category: Category) => {
        setCategories(prev => prev.map(c => c.id === category.id ? category : c));
        try {
            await fetch(`${API_URL}/categories/${category.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(category)
            });
        } catch (error) {
            console.error('Failed to update category:', error);
        }
    };

    const addCategory = async (category: Category) => {
        setCategories(prev => [...prev, category]);
        try {
            await fetch(`${API_URL}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(category)
            });
        } catch (error) {
            console.error('Failed to add category:', error);
        }
    };

    const deleteCategory = async (id: string) => {
        setCategories(prev => prev.filter(c => c.id !== id));
        try {
            await fetch(`${API_URL}/categories/${id}`, {
                method: 'DELETE',
                headers: { ...getAuthHeaders() }
            });
        } catch (error) {
            console.error('Failed to delete category:', error);
        }
    };

    const addProduct = async (product: Product) => {
        setProductsState(prev => [...prev, product]);
        try {
            await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(product)
            });
        } catch (error) {
            console.error('Failed to add product:', error);
        }
    };

    const updateProduct = async (product: Product) => {
        setProductsState(prev => prev.map(p => p.id === product.id ? product : p));
        try {
            await fetch(`${API_URL}/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(product)
            });
        } catch (error) {
            console.error('Failed to update product:', error);
        }
    };

    const deleteProduct = async (productId: string) => {
        setProductsState(prev => prev.filter(p => p.id !== productId));
        try {
            await fetch(`${API_URL}/products/${productId}`, {
                method: 'DELETE',
                headers: { ...getAuthHeaders() }
            });
        } catch (error) {
            console.error('Failed to delete product:', error);
        }
    };

    const setProducts = (newProducts: Product[]) => {
        setProductsState(newProducts);
    };

    const addBanner = async (banner: Banner) => {
        const newBanner = { ...banner, id: Math.random().toString(36).substr(2, 9) };
        try {
            const res = await fetch(`${API_URL}/banners`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(newBanner)
            });
            if (res.ok) {
                const savedBanner = await res.json();
                setBanners(prev => [...prev, savedBanner]);
            } else {
                console.error('Failed to add banner:', await res.text());
            }
        } catch (error) {
            console.error('Failed to add banner:', error);
        }
    };

    const removeBanner = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/banners/${id}`, {
                method: 'DELETE',
                headers: { ...getAuthHeaders() }
            });
            if (res.ok) {
                setBanners(prev => prev.filter(b => b.id !== id));
            } else {
                console.error('Failed to remove banner:', await res.text());
            }
        } catch (error) {
            console.error('Failed to remove banner:', error);
        }
    };

    const addOrder = async (order: Order) => {
        setOrders(prev => [order, ...prev]);
        try {
            await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });
        } catch (error) {
            console.error('Failed to add order:', error);
        }
    };

    const updateOrderStatus = async (orderId: string, status: string) => {
        setOrders(prev => prev.map(order =>
            order.id === orderId ? { ...order, status } : order
        ));
        try {
            await fetch(`${API_URL}/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
        } catch (error) {
            console.error('Failed to update order status:', error);
        }
    };

    const addOrderMessage = async (orderId: string, text: string, sender: string) => {
        const newMessage = { text, sender, date: new Date().toLocaleString() };
        setOrders(prev => prev.map(order =>
            order.id === orderId ? { ...order, messages: [...(order.messages || []), newMessage] } : order
        ));
        try {
            await fetch(`${API_URL}/orders/${orderId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, sender })
            });
        } catch (error) {
            console.error('Failed to add order message:', error);
        }
    };

    const toggleFeatured = (productId: string) => {
        setProductsState(prev => prev.map(p =>
            p.id === productId ? { ...p, featured: !p.featured } : p
        ));
    };

    const value = React.useMemo(() => ({
        products,
        orders,
        banners,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        setProducts,
        addBanner,
        removeBanner,
        updateCategory,
        addCategory,
        deleteCategory,
        addOrder,
        updateOrderStatus,
        addOrderMessage,
        toggleFeatured,
        refreshOrders,
        isLoading
    }), [products, orders, banners, categories, isLoading]);

    return (
        <ShopContext.Provider value={value}>
            {children}
        </ShopContext.Provider>
    );
}

export function useShop() {
    const context = useContext(ShopContext);
    if (context === undefined) {
        throw new Error('useShop must be used within a ShopProvider');
    }
    return context;
}
