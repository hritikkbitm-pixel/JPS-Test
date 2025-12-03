import { User } from '@/context/AuthContext';

export const checkIsAdmin = (user: User | null | undefined) => {
    if (!user || !user.email) return false;

    // 1. Check Role (Primary Source of Truth)
    if ((user as any).role === 'admin') return true;

    // 2. Fallback: Check Email List (Legacy/Dev)
    const admins = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    if (admins.length === 0) return ['hritik@jps.com', 'admin@jps.com'].includes(user.email);
    return admins.includes(user.email);
};
