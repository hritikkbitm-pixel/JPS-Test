"use client";

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (email && password) {
            try {
                const res = await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                });

                if (res?.error) {
                    setError('Invalid email or password.');
                } else {
                    // Login successful - AuthContext will likely pick up session change if configured,
                    // or we can manually trigger a refresh/redirect.
                    // For now, let's just reload or redirect to ensure state is fresh.
                    // Ideally, AuthContext should listen to NextAuth session.
                    // But since we are using a custom AuthContext, we might need to sync it.
                    // However, the original mock logic called login() directly.
                    // Let's assume for now we just want to secure the login.
                    // We can fetch the user details if needed, or rely on the session.

                    // To maintain compatibility with existing AuthContext if it's not fully integrated with NextAuth yet:
                    // We can't easily get the user object here without another call or session hook.
                    // But the goal is SECURITY.

                    // Let's redirect to /account which checks session/user.
                    window.location.reload();
                }
            } catch (err) {
                setError('An error occurred during login.');
                console.error(err);
            }
        } else {
            setError('Please enter both email and password.');
        }
    };

    const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            try {
                const decoded: any = jwtDecode(credentialResponse.credential);
                login({
                    name: decoded.name,
                    email: decoded.email,
                    addresses: [],
                    orders: []
                });
            } catch (e) {
                console.error("Error decoding Google token", e);
                setError("Failed to sign in with Google.");
            }
        }
    };

    const handleGoogleError = () => {
        setError("Google Sign-In failed.");
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                        Email Address
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                        id="password"
                        type="password"
                        placeholder="******************"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-between mb-4">
                    <button
                        className="bg-brand-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition"
                        type="submit"
                    >
                        Sign In
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                </div>

                <div className="flex justify-center mb-4">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_blue"
                        shape="rectangular"
                        width="100%"
                    />
                </div>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account? <span className="text-brand-red cursor-pointer hover:underline">Register</span>
                    </p>
                </div>
            </form>
        </div>
    );
}
