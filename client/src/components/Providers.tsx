"use client";

import { SessionProvider } from "next-auth/react";
import { ShopProvider } from "../context/ShopContext";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ShopProvider>
                <AuthProvider>
                    <CartProvider>
                        {children}
                    </CartProvider>
                </AuthProvider>
            </ShopProvider>
        </SessionProvider>
    );
}

