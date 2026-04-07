'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from '@/components/layout/Sidebar';

// Rotas que apenas ADMIN e MANAGER podem acessar
const ADMIN_MANAGER_ROUTES = [
    '/dashboard/cashflow',
    '/dashboard/expenses',
    '/dashboard/reports',
    '/dashboard/collaborators',
    '/dashboard/services',
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { token, user, hydrate } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => { hydrate(); }, []);

    // Redireciona para login se não autenticado
    useEffect(() => {
        if (token === null) {
            const t = setTimeout(() => {
                const stored = localStorage.getItem('bb_token');
                if (!stored) router.replace('/login');
            }, 100);
            return () => clearTimeout(t);
        }
    }, [token]);

    // Bloqueia acesso de PROFESSIONAL a rotas restritas
    useEffect(() => {
        if (!user) return;
        if (user.role === 'PROFESSIONAL') {
            const isRestricted = ADMIN_MANAGER_ROUTES.some(r => pathname?.startsWith(r));
            if (isRestricted) {
                router.replace('/dashboard');
            }
        }
    }, [user, pathname]);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#f5f6fa' }}>
            <Sidebar />
            {/* Área de conteúdo — no mobile tem padding-top por causa da top bar */}
            <main className="flex-1 overflow-y-auto pt-0 lg:pt-0 flex flex-col">
                {/* Espaçador visível apenas no mobile (top bar tem ~54px) */}
                <div className="h-[54px] lg:hidden shrink-0" />
                <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
