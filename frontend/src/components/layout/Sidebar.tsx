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
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            padding: '20px 12px',
        }}>
            {/* ── Logo / Branding ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '4px 8px', marginBottom: 28,
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(6,182,212,0.35)',
                }}>
                    <Scissors size={17} color="#fff" strokeWidth={2.5} />
                </div>
                <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                        Bella Beauty
                    </p>
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#0284c7', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Salão & Spa
                    </p>
                </div>
            </div>

            {/* ── Navegação principal ── */}
            <nav style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 12px',
                                borderRadius: 10,
                                textDecoration: 'none',
                                transition: 'all 0.15s ease',
                                background: active ? 'rgba(2, 132, 199, 0.08)' : 'transparent',
                                color: active ? '#0284c7' : '#6b7280',
                            }}
                            onMouseEnter={(e) => {
                                if (!active) {
                                    e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                                    e.currentTarget.style.color = '#374151';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#6b7280';
                                }
                            }}
                        >
                            <Icon
                                size={19}
                                strokeWidth={active ? 2.2 : 1.8}
                                style={{ color: active ? '#0284c7' : '#9ca3af', flexShrink: 0 }}
                            />
                            <span style={{
                                fontSize: 14,
                                fontWeight: active ? 600 : 400,
                                letterSpacing: '-0.01em',
                                lineHeight: 1,
                            }}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* ── Divider ── */}
            <div style={{ height: 1, background: '#f3f4f6', margin: '12px 4px' }} />

            {/* ── Perfil do usuário ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, background: '#f9fafb',
            }}>
                {/* Avatar */}
                <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(2, 132, 199, 0.12)',
                    border: '1.5px solid rgba(2, 132, 199, 0.25)',
                    color: '#0284c7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                }}>
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.name?.toLowerCase()}
                    </p>
                    <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {roleLabel[user?.role ?? ''] ?? ''}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    title="Sair"
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#9ca3af', padding: 6, borderRadius: 8,
                        display: 'flex', alignItems: 'center', transition: 'all 0.15s',
                        flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#dc2626';
                        e.currentTarget.style.background = '#fee2e2';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#9ca3af';
                        e.currentTarget.style.background = 'none';
                    }}
                >
                    <LogOut size={15} />
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
            <aside style={{
                width: 230, flexShrink: 0,
                height: '100vh', position: 'sticky', top: 0,
                background: '#ffffff',
                borderRight: '1px solid #f3f4f6',
                display: 'none',
            }} className="sidebar-desktop">
                <NavContent />
            </aside>

            {/* ── Estilos inline para responsividade ── */}
            <style>{`
                @media (min-width: 1024px) {
                    .sidebar-desktop { display: flex !important; flex-direction: column; }
                    .sidebar-topbar  { display: none !important; }
                }
            `}</style>

            {/* ── Mobile top bar ── */}
            <div
                className="sidebar-topbar"
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.95)',
                    borderBottom: '1px solid #f3f4f6',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Scissors size={14} color="#fff" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Bella Beauty</span>
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 6, borderRadius: 8, display: 'flex' }}
                >
                    <Menu size={20} />
                </button>
            </div>

            {/* ── Mobile drawer ── */}
            {mobileOpen && (
                <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
                    {/* Overlay */}
                    <div
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setMobileOpen(false)}
                    />
                    {/* Drawer */}
                    <aside style={{
                        position: 'relative', width: 260, height: '100%',
                        background: '#ffffff', borderRight: '1px solid #f3f4f6',
                        overflowY: 'auto',
                    }}>
                        <button
                            onClick={() => setMobileOpen(false)}
                            style={{
                                position: 'absolute', top: 14, right: 14,
                                background: '#f3f4f6', border: 'none', cursor: 'pointer',
                                color: '#6b7280', padding: 6, borderRadius: 8, display: 'flex',
                            }}
                        >
                            <X size={16} />
                        </button>
                        <NavContent onClose={() => setMobileOpen(false)} />
                    </aside>
                </div>
            )}
        </>
    );
}
