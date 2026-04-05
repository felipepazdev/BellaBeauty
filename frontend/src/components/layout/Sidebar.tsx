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
            { label: 'Painel', href: '/dashboard', icon: LayoutDashboard },
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
    MANAGER: '#0284c7',
    PROFESSIONAL: '#059669',
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
        <div className="flex flex-col h-full py-5 px-4">
            {/* Logo */}
            <div className="flex items-center justify-between px-2 mb-6 animate-scale-in">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                        style={{
                            background: 'linear-gradient(135deg, #d4af37, #b48c26)',
                            boxShadow: '0 2px 8px rgba(180,140,38,0.3)'
                        }}>
                        <Scissors size={18} color="#3d2800" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[15px] font-serif font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                            Bella Beauty
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5" style={{ color: '#b48c26' }}>
                            Salão &amp; Spa
                        </span>
                    </div>
                </div>
                <ThemeToggle />
            </div>

            {/* Separador */}
            <div className="h-px mx-2 mb-5" style={{ background: 'var(--border)' }} />

            <nav className="flex-1 overflow-y-auto space-y-6 pr-1">
                {NAV_GROUPS.map((group) => {
                    const visible = group.items.filter((item) => canSee(item.roles, item.permission));
                    if (!visible.length) return null;
                    return (
                        <div key={group.label}>
                            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                                {group.label}
                            </p>
                            <div className="space-y-0.5">
                                {visible.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onClose}
                                            className={`
                                                flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 group
                                                ${active
                                                    ? 'font-semibold'
                                                    : 'hover:bg-black/[0.04]'
                                                }
                                            `}
                                            style={active ? {
                                                background: 'rgba(124,58,237,0.08)',
                                                color: 'var(--accent)',
                                            } : {
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            <Icon
                                                size={17}
                                                className="flex-shrink-0"
                                                style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
                                            />
                                            <span className="flex-1">{item.label}</span>
                                            {active && (
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Widget de Assinatura */}
                {settings && (
                    <div className="px-1 pt-2">
                        <Link href="/dashboard/plans"
                            className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 group"
                            style={{
                                background: settings.plan === 'PREMIUM'
                                    ? 'linear-gradient(135deg, #fff9e6, #fffdf5)'
                                    : 'var(--bg-card)',
                                border: `1px solid ${settings.plan === 'PREMIUM' ? 'rgba(180,140,38,0.3)' : 'var(--border)'}`,
                            }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                    background: settings.plan === 'PREMIUM' ? 'rgba(212,175,55,0.15)' : 'rgba(100,116,139,0.1)',
                                    color: settings.plan === 'PREMIUM' ? '#b48c26' : '#64748b',
                                }}>
                                {settings.plan === 'PREMIUM' ? <Sparkles size={16} /> : <CreditCard size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-0.5"
                                    style={{ color: settings.plan === 'PREMIUM' ? '#b48c26' : 'var(--text-muted)' }}>
                                    Plano {settings.plan}
                                </p>
                                <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                    Assinatura ativa
                                </p>
                            </div>
                            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                        </Link>
                    </div>
                )}
            </nav>

            {/* Perfil do usuário */}
            <div className="pt-4 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{ background: 'var(--bg-base)' }}>
                    {/* Avatar */}
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border"
                        style={{
                            backgroundColor: `${roleColor[user?.role ?? 'ADMIN'] ?? '#7c3aed'}18`,
                            borderColor: `${roleColor[user?.role ?? 'ADMIN'] ?? '#7c3aed'}40`,
                            color: roleColor[user?.role ?? 'ADMIN'] ?? '#7c3aed',
                        }}
                    >
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate capitalize" style={{ color: 'var(--text-primary)' }}>
                            {user?.name?.toLowerCase()}
                        </p>
                        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            {user?.role ? roleLabel[user.role] : ''}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Sair do sistema"
                        className="p-2 rounded-lg transition-all"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = '#dc2626';
                            (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                    >
                        <LogOut size={15} />
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
            {/* Desktop */}
            <aside
                className="hidden lg:flex flex-col h-screen w-[250px] shrink-0 sticky top-0"
                style={{
                    background: 'var(--bg-surface)',
                    borderRight: '1px solid var(--border)',
                    boxShadow: '1px 0 0 var(--border)',
                }}
            >
                <NavContent />
            </aside>

            {/* Mobile top bar */}
            <div
                className="lg:hidden flex items-center justify-between fixed top-0 left-0 right-0 z-40 px-4 py-3"
                style={{
                    background: 'rgba(255,255,255,0.92)',
                    borderBottom: '1px solid var(--border)',
                    backdropFilter: 'blur(16px)',
                }}
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #d4af37, #b48c26)' }}>
                        <Scissors size={16} color="#3d2800" strokeWidth={2.5} />
                    </div>
                    <div>
                        <span className="text-sm font-serif font-bold block leading-none" style={{ color: 'var(--text-primary)' }}>
                            Bella Beauty
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.18em] mt-0.5 block" style={{ color: '#b48c26' }}>
                            Salão &amp; Spa
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    <Menu size={22} />
                </button>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in">
                    <div
                        className="absolute inset-0"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside
                        className="relative w-[280px] h-full flex flex-col animate-scale-in"
                        style={{
                            background: 'var(--bg-surface)',
                            borderRight: '1px solid var(--border)',
                        }}
                    >
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: 'var(--text-muted)', background: 'var(--bg-base)' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <NavContent onClose={() => setMobileOpen(false)} />
                    </aside>
                </div>
            )}
        </>
    );
}
