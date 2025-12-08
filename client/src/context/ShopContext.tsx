'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { products as initialProducts, orders as initialOrders, banners as initialBanners, initialCategories, Product, Order, Banner, Category } from '@/lib/data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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



    // Load banners from API
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await fetch(`${API_URL}/banners`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.length > 0) {
                        setBanners(data);
                    } else {
                        setBanners(ensureIds(initialBanners || []));
                        initialBanners.forEach(async (banner) => {
                            await fetch(`${API_URL}/banners`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...banner, id: Math.random().toString(36).substr(2, 9) })
                            });
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch banners:', error);
                setBanners(ensureIds(initialBanners || []));
            }
        };
        fetchBanners();
    }, []);

    // Load products from API
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${API_URL}/products`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.length > 0) {
                        setProductsState(data);
                    } else {
                        // If API returns empty, seed with initial products
                        setProductsState(initialProducts);
                        // Optional: Seed the database
                        initialProducts.forEach(async (prod) => {
                            await fetch(`${API_URL}/products`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                                body: JSON.stringify(prod)
                            });
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch products:', error);
                // Fallback to local storage or initial data
                const savedProducts = localStorage.getItem('shop_products');
                if (savedProducts) {
                    try {
                        setProductsState(JSON.parse(savedProducts));
                    } catch (e) {
                        setProductsState(initialProducts);
                    }
                } else {
                    setProductsState(initialProducts);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Load categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                console.log('Fetching categories...');
                const res = await fetch(`${API_URL}/categories`);
                console.log('Categories response status:', res.status);
                if (res.ok) {
                    const data = await res.json();
                    console.log('Categories data received:', data);
                    if (data.length > 0) {
                        setCategories([...data]);
                    } else {
                        console.log('Categories data is empty, setting empty array.');
                        setCategories([]);
                    }
                } else {
                    console.error('Categories fetch failed:', res.statusText);
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
                const savedCategories = localStorage.getItem('shop_categories');
                if (savedCategories) {
                    console.log('Loading categories from local storage');
                    setCategories(JSON.parse(savedCategories));
                } else {
                    console.log('No local storage categories found, setting empty.');
                    setCategories([]);
                }
            }
        };
        fetchCategories();
    }, []);

    // Load orders from API
    useEffect(() => {
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
        setBanners(prev => [...prev, newBanner]);
        try {
            await fetch(`${API_URL}/banners`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(newBanner)
            });
        } catch (error) {
            console.error('Failed to add banner:', error);
        }
    };

    const removeBanner = async (id: string) => {
        setBanners(prev => prev.filter(b => b.id !== id));
        try {
            await fetch(`${API_URL}/banners/${id}`, {
                method: 'DELETE',
                headers: { ...getAuthHeaders() }
            });
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
