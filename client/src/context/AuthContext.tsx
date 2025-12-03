"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ShippingAddress, Order } from '@/lib/data';

export interface User {
    name: string;
    email: string;
    addresses: ShippingAddress[];
    orders: Order[];
    role?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (userData: User) => void;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'loading') return;

        if (session?.user) {
            // Sync NextAuth session to AuthContext state
            setUser({
                name: session.user.name || '',
                email: session.user.email || '',
                addresses: [], // Fetch from DB if needed
                orders: [],    // Fetch from DB if needed
                role: (session.user as any).role
            });
        } else {
            // Fallback to localStorage if no session (e.g. legacy or dev)
            const savedUser = localStorage.getItem('jps_user');
            if (savedUser) {
                try {
                    setUser(JSON.parse(savedUser));
                } catch (e) {
                    console.error("Failed to parse user data", e);
                    localStorage.removeItem('jps_user');
                }
            } else {
                setUser(null);
            }
        }
        setIsLoading(false);
    }, [session, status]);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('jps_user', JSON.stringify(userData));
        document.cookie = `jps_user_email=${userData.email}; path=/; max-age=86400; SameSite=Strict`;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('jps_user');
        document.cookie = 'jps_user_email=; path=/; max-age=0; SameSite=Strict';
        signOut({ callbackUrl: '/' }); // Sign out from NextAuth
    };

    const updateUser = (userData: Partial<User>) => {
        setUser((prev) => {
            if (!prev) return null;
            const updated = { ...prev, ...userData };
            localStorage.setItem('jps_user', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
