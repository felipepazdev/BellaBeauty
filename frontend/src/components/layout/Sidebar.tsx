'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
import { useEffect } from 'react';
import {
    LayoutDashboard, Calendar, ClipboardList, DollarSign,
    TrendingDown, BarChart2, Package, Users, UserCog,
    Scissors, LogOut, Star, Menu, X, ChevronRight, Layers,
    MessageSquare, CreditCard, Sparkles
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
    const { settings, fetchSettings } = useSettingsStore();

    useEffect(() => {
        if (!settings) fetchSettings();
    }, []);

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

    return (
        <div className="flex flex-col h-full py-8 px-6">
            {/* Logo */}
            <div className="flex items-center gap-4 px-4 mb-20 animate-scale-in">
                <div className="w-10 h-10 rounded-[1.2rem] bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-gold-deep)] flex items-center justify-center shadow-lg shadow-[var(--accent-gold-glow)] ring-1 ring-white/10">
                    <Scissors size={20} color="#1a1505" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-serif font-bold text-[var(--text-primary)] leading-none tracking-tight">Bella Beauty</span>
                    <span className="text-[9px] font-black text-[var(--accent-gold)] uppercase tracking-[0.2em] mt-1.5">Premium Spa</span>
                </div>
            </div>

            <nav className="flex-1 space-y-12 overflow-y-auto px-2 -mx-2 pr-4 custom-scrollbar">
                {NAV_GROUPS.map((group) => {
                    const visible = group.items.filter((item) => canSee(item.roles, item.permission));
                    if (!visible.length) return null;
                    return (
                        <div key={group.label} className="mb-16 last:mb-0">
                            {/* Label do grupo */}
                            <p className="px-4 mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">
                                {group.label}
                            </p>
                            <div className="space-y-4">
                                {visible.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);
                                    return (
                                        <Link key={item.href} href={item.href} onClick={onClose}
                                            className={`
                                                flex items-center gap-5 px-5 py-4 rounded-2xl text-[14px] transition-all duration-300 group
                                                ${active 
                                                    ? 'bg-gradient-to-r from-[var(--accent)]/10 via-[var(--accent)]/5 to-transparent text-[var(--text-primary)] font-bold shadow-sm' 
                                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)]/5'
                                                }
                                            `}
                                        >
                                            <Icon size={20} className={`flex-shrink-0 transition-colors duration-300 ${active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`} />
                                            <span className="flex-1 tracking-tight">{item.label}</span>
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

                {/* Subscription Status Widget */}
                {settings && (
                    <div className="mt-4 mb-16 px-4">
                        <Link href="/dashboard/plans" className={`
                            relative overflow-hidden p-5 rounded-[1.8rem] border transition-all duration-500 group/sub
                            ${settings.plan === 'PREMIUM' 
                                ? 'bg-gradient-to-br from-[#1a1505] to-[#0c0c10] border-[var(--accent-gold)]/30 shadow-lg shadow-[var(--accent-gold-glow)]' 
                                : 'bg-[var(--bg-card)] border-[var(--border)]'
                            }
                        `}>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className={`
                                    w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover/sub:scale-110
                                    ${settings.plan === 'PREMIUM' ? 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]' : 'bg-slate-500/10 text-slate-400'}
                                `}>
                                    {settings.plan === 'PREMIUM' ? <Sparkles size={20} /> : <CreditCard size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 ${settings?.plan === 'PREMIUM' ? 'text-[var(--accent-gold)]' : 'text-[var(--text-muted)]'}`}>
                                        Plano {settings?.plan}
                                    </p>
                                    <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">
                                        Assinatura Ativa
                                    </p>
                                </div>
                                <ChevronRight size={14} className="text-[var(--text-muted)] group-hover/sub:translate-x-1 transition-transform" />
                            </div>
                            
                            {settings.plan === 'PREMIUM' && (
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-gold)]/5 rounded-full blur-2xl -translate-y-12 translate-x-12" />
                            )}
                        </Link>
                    </div>
                )}
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
                    <div className="w-10 h-10 rounded-[1.2rem] bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-gold-deep)] flex items-center justify-center shadow-lg shadow-[var(--accent-gold-glow)] ring-1 ring-white/10">
                        <Scissors size={20} color="#1a1505" strokeWidth={2.5} />
                    </div>
                    <div>
                        <span className="text-base font-serif font-bold text-[var(--text-primary)] block leading-none tracking-tight">Bella Beauty</span>
                        <span className="text-[9px] font-black text-[var(--accent-gold)] uppercase tracking-[0.2em] mt-1 block">Premium Spa</span>
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
