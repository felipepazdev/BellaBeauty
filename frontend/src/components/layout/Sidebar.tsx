'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
    LayoutDashboard, Calendar, ClipboardList, DollarSign,
    TrendingDown, BarChart2, Package, Users, UserCog,
    Scissors, LogOut, Menu, X, Percent, Settings, Star
} from 'lucide-react';

/* ── Itens de navegação — lista plana igual à referência ── */
interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    roles?: string[];
    permission?: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard',      href: '/dashboard',                    icon: LayoutDashboard },
    { label: 'Agenda',         href: '/dashboard/appointments',       icon: Calendar,    permission: 'appointments_view' },
    { label: 'Comandas',       href: '/dashboard/orders',             icon: ClipboardList, permission: 'orders_manage' },
    { label: 'Clientes',       href: '/dashboard/clients',            icon: Users,       permission: 'clients_manage' },
    { label: 'Profissionais',  href: '/dashboard/collaborators',      icon: UserCog,     roles: ['ADMIN', 'MANAGER'], permission: 'collaborators_view' },
    { label: 'Serviços',       href: '/dashboard/services',           icon: Scissors,    roles: ['ADMIN', 'MANAGER'], permission: 'services_manage' },
    { label: 'Produtos',       href: '/dashboard/products',           icon: Package,     permission: 'products_manage' },
    { label: 'Financeiro',     href: '/dashboard/cashflow',           icon: DollarSign,  roles: ['ADMIN', 'MANAGER'], permission: 'cashflow_view' },
    { label: 'Relatórios',     href: '/dashboard/reports',            icon: BarChart2,   roles: ['ADMIN', 'MANAGER'], permission: 'reports_view' },
    { label: 'Comissões',      href: '/dashboard/commissions',        icon: Star },
    { label: 'Configurações',  href: '/dashboard/plans',              icon: Settings,    roles: ['ADMIN'] },
];

const roleLabel: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    PROFESSIONAL: 'Profissional',
};

/* ── Conteúdo interno da sidebar ── */
function NavContent({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    if (!user) return null;

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isActive = (href: string) =>
        href === '/dashboard' ? pathname === href : pathname.startsWith(href);

    const canSee = (roles?: string[], permission?: string) => {
        if (user?.role === 'ADMIN') return true;
        if (roles && user?.role && roles.includes(user.role)) return true;
        if (permission && user?.permissions) {
            return user.permissions.split(',').includes(permission);
        }
        return !roles && !permission;
    };

    const visibleItems = NAV_ITEMS.filter(item => canSee(item.roles, item.permission));

    return (
        <div className="flex flex-col h-full p-5 bg-[#0c0c10]/95 backdrop-blur-xl border-r border-white/5">
            {/* ── Logo / Branding ── */}
            <div className="flex items-center gap-3 px-2 mb-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#7c3aed] flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse-subtle">
                    <Scissors size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                    <p className="text-base font-serif font-black text-white tracking-tight leading-none">
                        Bella Beauty
                    </p>
                    <p className="text-[10px] font-black text-[#06b6d4] uppercase tracking-[0.2em] mt-1">
                        SASS PREMIUM
                    </p>
                </div>
            </div>

            {/* ── Navegação principal ── */}
            <nav className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                                active 
                                ? 'bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon
                                size={20}
                                strokeWidth={active ? 2.5 : 2}
                                className={`transition-all duration-300 ${
                                    active ? 'text-[#06b6d4] drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'text-slate-500 group-hover:text-slate-300'
                                }`}
                            />
                            <span className={`text-[13.5px] tracking-wide ${active ? 'font-bold' : 'font-medium'}`}>
                                {item.label}
                            </span>
                            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#06b6d4] shadow-[0_0_8px_rgba(6,182,212,1)]" />}
                        </Link>
                    );
                })}
            </nav>

            {/* ── Divider ── */}
            <div className="h-px bg-white/5 my-6 mx-2" />

            {/* ── Perfil do usuário ── */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-white text-sm font-black shadow-lg">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white truncate capitalize">
                        {user?.name?.toLowerCase()}
                    </p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                        {roleLabel[user?.role ?? ''] ?? ''}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    title="Encerrar Sessão"
                    className="p-2.5 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
    );
}

/* ── Sidebar principal ── */
export default function Sidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* ── Desktop ── */}
            <aside className="hidden lg:flex flex-col w-[260px] h-screen sticky top-0 bg-[#07070a] border-r border-white/5">
                <NavContent />
            </aside>

            {/* ── Mobile top bar ── */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-[#0c0c10]/95 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#06b6d4] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Scissors size={14} className="text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-serif font-black text-white">Bella Beauty</span>
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-all"
                >
                    <Menu size={22} />
                </button>
            </div>

            {/* ── Mobile drawer ── */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="relative w-[280px] h-full bg-[#0c0c10] border-r border-white/10 shadow-2xl animate-slide-right">
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute top-5 right-5 p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-all z-10"
                        >
                            <X size={18} />
                        </button>
                        <NavContent onClose={() => setMobileOpen(false)} />
                    </aside>
                </div>
            )}
        </>
    );
}
