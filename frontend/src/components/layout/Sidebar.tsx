'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
    LayoutDashboard, Calendar, ClipboardList, DollarSign,
    TrendingDown, BarChart2, Package, Users, UserCog,
    Scissors, LogOut, Star, Menu, X, ChevronRight, Layers,
    MessageSquare, CreditCard
} from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    roles?: string[];
    permission?: string;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
    {
        label: 'Principal',
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { label: 'Atendimentos', href: '/dashboard/appointments', icon: Calendar, permission: 'appointments_view' },
            { label: 'Comandas', href: '/dashboard/orders', icon: ClipboardList, permission: 'orders_manage' },
        ],
    },
    {
        label: 'Financeiro',
        items: [
            { label: 'Fluxo de Caixa', href: '/dashboard/cashflow', icon: DollarSign, roles: ['ADMIN', 'MANAGER'], permission: 'cashflow_view' },
            { label: 'Despesas', href: '/dashboard/expenses', icon: TrendingDown, roles: ['ADMIN', 'MANAGER'], permission: 'expenses_manage' },
            { label: 'Remunerações', href: '/dashboard/commissions', icon: Star },
            { label: 'Relatórios', href: '/dashboard/reports', icon: BarChart2, roles: ['ADMIN', 'MANAGER'], permission: 'reports_view' },
        ],
    },
    {
        label: 'Gestão',
        items: [
            { label: 'Serviços', href: '/dashboard/services', icon: Scissors, roles: ['ADMIN', 'MANAGER'], permission: 'services_manage' },
            { label: 'Produtos', href: '/dashboard/products', icon: Package, permission: 'products_manage' },
            { label: 'Clientes', href: '/dashboard/clients', icon: Users, permission: 'clients_manage' },
            { label: 'Colaboradores', href: '/dashboard/collaborators', icon: UserCog, roles: ['ADMIN', 'MANAGER'], permission: 'collaborators_view' },
            { label: 'WhatsApp', href: '/dashboard/whatsapp', icon: MessageSquare, roles: ['ADMIN', 'MANAGER'] },
            { label: 'Assinatura', href: '/dashboard/plans', icon: CreditCard, roles: ['ADMIN'] },
        ],
    },
];

const roleLabel: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    PROFESSIONAL: 'Profissional',
};

const roleColor: Record<string, string> = {
    ADMIN: '#7c3aed',
    MANAGER: '#0ea5e9',
    PROFESSIONAL: '#22c55e',
};

function NavContent({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

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

    return (
        <div className="flex flex-col h-full">

            {/* ── Logo ─────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-8 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                        <Scissors size={20} color="#fff" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-xl font-serif font-bold tracking-tight text-white leading-tight">Bella Beauty</p>
                        <p className="text-[10px] font-bold tracking-widest text-[#8b5cf6] uppercase mt-0.5">Premium Spa</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors lg:hidden">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* ── Nav com grupos ───────────────────────────── */}
            <nav className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
                {NAV_GROUPS.map((group) => {
                    const visible = group.items.filter((item) => canSee(item.roles, item.permission));
                    if (!visible.length) return null;
                    return (
                        <div key={group.label} className="mb-10 last:mb-0">
                            {/* Label do grupo */}
                            <p className="px-3 mb-4 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
                                {group.label}
                            </p>
                            <div className="space-y-1">
                                {visible.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);
                                    return (
                                        <Link key={item.href} href={item.href} onClick={onClose}
                                            className={`
                                                flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group
                                                ${active 
                                                    ? 'bg-gradient-to-r from-purple-500/10 to-transparent text-white font-semibold' 
                                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }
                                            `}
                                        >
                                            <Icon size={18} className={`flex-shrink-0 transition-colors ${active ? 'text-[#8b5cf6]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                            <span className="flex-1">{item.label}</span>
                                            {active && (
                                                <div className="w-1 h-1 rounded-full bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* ── Usuário Profile Card ──────────────────────── */}
            <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 shadow-sm">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0"
                         style={{ 
                            backgroundColor: `${roleColor[user?.role ?? 'ADMIN'] ?? '#7c3aed'}22`,
                            borderColor: `${roleColor[user?.role ?? 'ADMIN'] ?? '#7c3aed'}44`,
                            color: roleColor[user?.role ?? 'ADMIN'] ?? '#7c3aed'
                         }}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/90 truncate capitalize">
                            {user?.name?.toLowerCase()}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                            {user?.role ? roleLabel[user.role] : ''}
                        </p>
                    </div>
                    <button onClick={handleLogout} title="Sair do sistema"
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Sidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* ── Desktop ──────────────────────────────────── */}
            <aside className="hidden lg:flex flex-col h-screen w-[230px] shrink-0"
                style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
                <NavContent />
            </aside>

            {/* ── Mobile top bar ───────────────────────────── */}
            <div className="lg:hidden flex items-center justify-between" style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
                padding: '12px 16px',
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border)',
                backdropFilter: 'blur(8px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Scissors size={12} color="#fff" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Bella Beauty</span>
                </div>
                <button onClick={() => setMobileOpen(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}>
                    <Menu size={22} />
                </button>
            </div>

            {/* ── Mobile drawer ────────────────────────────── */}
            {mobileOpen && (
                <div className="lg:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }}
                        onClick={() => setMobileOpen(false)} />
                    <aside style={{
                        position: 'relative', width: 250, height: '100%', display: 'flex', flexDirection: 'column',
                        background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
                    }}>
                        <NavContent onClose={() => setMobileOpen(false)} />
                    </aside>
                </div>
            )}
        </>
    );
}
