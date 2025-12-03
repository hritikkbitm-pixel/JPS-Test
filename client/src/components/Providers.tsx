"use client";

import { SessionProvider } from "next-auth/react";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ShopProvider } from "../context/ShopContext";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
                <ShopProvider>
                    <AuthProvider>
                        <CartProvider>
                            {children}
                        </CartProvider>
                    </AuthProvider>
                </ShopProvider>
            </GoogleOAuthProvider>
        </SessionProvider>
    );
}
