'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { checkIsAdmin } from '@/utils/isAdmin';

const Navbar = () => {
    const { cart } = useCart();
    const { user, login, logout, isLoading } = useAuth();
    const cartCount = cart.reduce((acc, item) => acc + ((item as any).quantity || 1), 0);

    return (
        <nav className="bg-gray-800 text-white p-4 sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold">JPS Store</Link>

                <div className="flex items-center space-x-6">
                    <Link href="/" className="hover:text-gray-300">Home</Link>
                    <Link href="/builder" className="hover:text-gray-300">PC Builder</Link>
                    {!isLoading && user && checkIsAdmin(user) && (
                        <Link href="/admin" className="hover:text-gray-300 text-red-400 font-bold">Admin</Link>
                    )}
                    <Link href="/cart" className="relative hover:text-gray-300">
                        <span>Cart</span>
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-gray-300">Hi, {user.name}</span>
                            <button onClick={logout} className="text-sm hover:text-red-400">Logout</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => login({ name: 'Hritik (Admin)', email: 'hritik@jps.com', addresses: [], orders: [] })}
                            className="bg-red-600 px-4 py-1 rounded text-sm font-bold hover:bg-red-700"
                        >
                            Login (Demo)
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
