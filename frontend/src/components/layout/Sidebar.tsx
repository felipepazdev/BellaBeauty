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

import { ThemeToggle } from './ThemeToggle';

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
            <div className="flex items-center justify-between px-8 py-10 border-b border-[var(--border)]">
                <div className="flex items-center gap-5">
                    <div className="w-11 h-11 rounded-[1.25rem] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                        <Scissors size={22} color="#fff" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-xl font-serif font-bold tracking-tight text-[var(--text-primary)] leading-tight">Bella Beauty</p>
                        <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase mt-1">Premium Spa</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {onClose && (
                        <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors lg:hidden">
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Nav com grupos ───────────────────────────── */}
            <nav className="flex-1 overflow-y-auto px-5 py-10 custom-scrollbar">
                {NAV_GROUPS.map((group) => {
                    const visible = group.items.filter((item) => canSee(item.roles, item.permission));
                    if (!visible.length) return null;
                    return (
                        <div key={group.label} className="mb-12 last:mb-0">
                            {/* Label do grupo */}
                            <p className="px-4 mb-6 text-[10px] font-bold tracking-[0.25em] text-[var(--text-muted)] uppercase">
                                {group.label}
                            </p>
                            <div className="space-y-2">
                                {visible.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);
                                    return (
                                        <Link key={item.href} href={item.href} onClick={onClose}
                                            className={`
                                                flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] transition-all duration-300 group
                                                ${active 
                                                    ? 'bg-gradient-to-r from-[var(--accent)]/10 via-[var(--accent)]/5 to-transparent text-[var(--text-primary)] font-bold shadow-sm' 
                                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)]/5'
                                                }
                                            `}
                                        >
                                            <Icon size={18} className={`flex-shrink-0 transition-colors duration-300 ${active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`} />
                                            <span className="flex-1 tracking-wide">{item.label}</span>
                                            {active && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
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
            <div className="p-4 mt-auto border-t border-[var(--border)] bg-[var(--bg-base)]/50">
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center gap-3 shadow-sm">
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
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate capitalize">
                            {user?.name?.toLowerCase()}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-wider">
                            {user?.role ? roleLabel[user.role] : ''}
                        </p>
                    </div>
                    <button onClick={handleLogout} title="Sair do sistema"
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-all">
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
            <aside className="hidden lg:flex flex-col h-screen w-[270px] shrink-0 sticky top-0"
                style={{ 
                    background: 'var(--bg-base)', 
                    borderRight: '1px solid var(--border)',
                    boxShadow: '10px 0 30px rgba(0,0,0,0.2)'
                }}>
                <NavContent />
            </aside>

            {/* ── Mobile top bar ───────────────────────────── */}
            <div className="lg:hidden flex items-center justify-between fixed top-0 left-0 right-0 z-40 px-6 py-4 bg-[var(--bg-surface)]/80 border-b border-[var(--border)] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Scissors size={18} color="#fff" strokeWidth={2} />
                    </div>
                    <div>
                        <span className="text-sm font-serif font-bold text-[var(--text-primary)] block leading-none">Bella Beauty</span>
                        <span className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-wider">Premium Spa</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button onClick={() => setMobileOpen(true)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <Menu size={24} />
                    </button>
                </div>
            </div>

            {/* ── Mobile drawer ────────────────────────────── */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)} />
                    <aside className="relative w-[300px] h-full flex flex-col bg-[var(--bg-base)] border-r border-[var(--border)] shadow-2xl animate-scale-in">
                        <NavContent onClose={() => setMobileOpen(false)} />
                    </aside>
                </div>
            )}
        </>
    );
}
