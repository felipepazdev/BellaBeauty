'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function useAuth(requireRole?: string[]) {
    const { user, token, hydrate } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        hydrate();
    }, []);

    useEffect(() => {
        if (!token) {
            router.replace('/login');
            return;
        }
        if (requireRole && user && !requireRole.includes(user.role)) {
            router.replace('/dashboard');
        }
    }, [token, user]);

    return { user, token };
}
