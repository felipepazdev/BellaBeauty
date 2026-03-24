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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* ── Logo ─────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 16px 16px',
                borderBottom: '1px solid var(--border)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
                        flexShrink: 0,
                    }}>
                        <Scissors size={15} color="#fff" />
                    </div>
                    <div>
                        <p style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>Bella Beauty</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Gestão de Salão</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* ── Nav com grupos ───────────────────────────── */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
                {NAV_GROUPS.map((group) => {
                    const visible = group.items.filter((item) => canSee(item.roles, item.permission));
                    if (!visible.length) return null;
                    return (
                        <div key={group.label} style={{ marginBottom: 8 }}>
                            {/* Label do grupo */}
                            <p style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                                color: 'var(--text-muted)', textTransform: 'uppercase',
                                padding: '8px 8px 4px',
                            }}>
                                {group.label}
                            </p>
                            {visible.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link key={item.href} href={item.href} onClick={onClose}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '9px 10px', borderRadius: 10,
                                            fontSize: 13, fontWeight: active ? 600 : 400,
                                            color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
                                            background: active ? 'rgba(124,58,237,0.14)' : 'transparent',
                                            border: active ? '1px solid rgba(124,58,237,0.22)' : '1px solid transparent',
                                            marginBottom: 2,
                                            textDecoration: 'none',
                                            transition: 'all 0.15s ease',
                                        }}>
                                        <Icon size={15} style={{ flexShrink: 0 }} />
                                        <span style={{ flex: 1 }}>{item.label}</span>
                                        {active && <ChevronRight size={13} />}
                                    </Link>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            {/* ── Usuário ──────────────────────────────────── */}
            <div style={{ padding: '10px', borderTop: '1px solid var(--border)' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 12,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                }}>
                    {/* Avatar */}
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: `${roleColor[user?.role ?? 'ADMIN'] ?? '#7c3aed'}22`,
                        border: `2px solid ${roleColor[user?.role ?? 'ADMIN'] ?? '#7c3aed'}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                        color: roleColor[user?.role ?? 'ADMIN'] ?? '#7c3aed',
                    }}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.name}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                            {user?.role ? roleLabel[user.role] : ''}
                        </p>
                    </div>
                    <button onClick={handleLogout} title="Sair"
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                            display: 'flex', alignItems: 'center',
                        }}>
                        <LogOut size={14} />
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
