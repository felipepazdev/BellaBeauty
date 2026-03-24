'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import {
    Scissors, Award, BarChart2, Star, DollarSign, Users,
    ChevronLeft, ChevronRight, CalendarDays
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

interface DashboardData {
    topClients: { name: string; spent: number }[];
    topServices: { service: string; count: number }[];
    topProfessionals: { professional: string; count: number; revenue?: number }[];
    totalRevenue: number;
    totalExpenses: number;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const COLORS = ['#7c3aed', '#a78bfa', '#818cf8', '#38bdf8', '#22c55e'];

/* ── Stat Card ─────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, sub }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    sub?: string;
}) {
    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
        }}>
            <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon size={22} style={{ color }} />
            </div>
            <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>
                    {label}
                </p>
                <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1, letterSpacing: -0.5 }}>
                    {value}
                </p>
                {sub && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>
                )}
            </div>
        </div>
    );
}

/* ── Página ─────────────────────────────────────────── */
export default function DashboardPage() {
    const { user, hydrate } = useAuthStore();
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { hydrate(); }, []);

    useEffect(() => {
        setLoading(true);
        api.get(`/dashboard?month=${month}&year=${year}`)
            .then((r) => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [month, year]);

    const changeMonth = (dir: number) => {
        let m = month + dir;
        let y = year;
        if (m > 12) { m = 1; y++; }
        if (m < 1) { m = 12; y--; }
        setMonth(m); setYear(y);
    };

    const isAdmin = user?.role === 'ADMIN';
    const isManager = user?.role === 'MANAGER';
    const isProfessional = user?.role === 'PROFESSIONAL';

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Bom dia';
        if (h < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const totalRevenue = data?.totalRevenue ?? 0;
    const totalServices = data?.topServices.reduce((a, s) => a + s.count, 0) ?? 0;

    return (
        <div className="animate-fade-in" style={{ width: '100%' }}>

            {/* ── Header ──────────────────────────────────────────── */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                marginBottom: 32,
            }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
                        {greeting()}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p style={{ fontSize: 13, marginTop: 6, color: 'var(--text-secondary)' }}>
                        Resumo do período selecionado
                    </p>
                </div>

                {/* Seletor de mês */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '8px 14px',
                }}>
                    <CalendarDays size={15} style={{ color: 'var(--accent-light)' }} />
                    <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                        <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 600, minWidth: 120, textAlign: 'center' }}>
                        {MONTHS[month - 1]} {year}
                    </span>
                    <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <span className="spinner" style={{ width: 36, height: 36 }} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* ── KPIs ─────────────────────────────────────── */}
                    {(isAdmin || isManager) && (
                        <div className="kpi-grid">
                            <StatCard icon={Scissors} label="Serviços realizados" value={totalServices} color="#38bdf8" sub="neste período" />
                            <StatCard icon={Users} label="Clientes atendidos" value={data?.topClients.length ?? 0} color="#7c3aed" sub="top 5 exibidos" />
                            <StatCard icon={Award} label="Profissionais ativos" value={data?.topProfessionals.length ?? 0} color="#22c55e" />
                            {isAdmin && (
                                <StatCard icon={DollarSign} label="Faturamento bruto" value={`R$ ${totalRevenue.toFixed(2)}`} color="#f59e0b" sub="receita total do período" />
                            )}
                        </div>
                    )}

                    {isProfessional && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <StatCard icon={Users} label="Meus top clientes" value={data?.topClients.length ?? 0} color="#7c3aed" />
                            <StatCard icon={Scissors} label="Meus serviços" value={totalServices} color="#38bdf8" />
                        </div>
                    )}

                    {/* ── Gráficos ──────────────────────────────────── */}
                    <div className="charts-grid">

                        {/* Top Serviços */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                                <BarChart2 size={17} style={{ color: 'var(--accent-light)' }} />
                                <h2 style={{ fontSize: 14, fontWeight: 600 }}>
                                    {isProfessional ? 'Meus Serviços' : 'Top 5 Serviços'}
                                </h2>
                            </div>
                            {!data?.topServices.length ? (
                                <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 14, color: 'var(--text-muted)' }}>
                                    Nenhum dado no período
                                </p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={data.topServices} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" horizontal={false} />
                                        <XAxis type="number" tick={{ fill: '#9898b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis dataKey="service" type="category" tick={{ fill: '#9898b0', fontSize: 11 }} width={95} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#f4f4f8' }} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
                                        <Bar dataKey="count" fill="#7c3aed" radius={[0, 6, 6, 0]} name="Realizações" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Top Clientes */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                                <Users size={17} style={{ color: '#38bdf8' }} />
                                <h2 style={{ fontSize: 14, fontWeight: 600 }}>
                                    {isProfessional ? 'Meus Melhores Clientes' : 'Top 5 Clientes'}
                                </h2>
                            </div>
                            {!data?.topClients.length ? (
                                <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 14, color: 'var(--text-muted)' }}>
                                    Nenhum dado no período
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {data.topClients.map((c, i) => (
                                        <div key={c.name} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent',
                                        }}>
                                            <span style={{
                                                width: 28, height: 28, borderRadius: '50%',
                                                background: `${COLORS[i]}22`, color: COLORS[i],
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 12, fontWeight: 700, flexShrink: 0,
                                            }}>
                                                {i + 1}
                                            </span>
                                            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {c.name}
                                            </span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>
                                                R$ {c.spent.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Ranking ───────────────────────────────────── */}
                    {!isProfessional && data?.topProfessionals && data.topProfessionals.length > 0 && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                                <Star size={17} style={{ color: '#f59e0b' }} />
                                <h2 style={{ fontSize: 14, fontWeight: 600 }}>🏆 Ranking de Colaboradores</h2>
                                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                                    {isAdmin ? 'Atendimentos + Faturamento' : 'Atendimentos realizados'}
                                </span>
                            </div>
                            <div className="ranking-grid">
                                {data.topProfessionals.map((p, i) => (
                                    <div key={p.professional} style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        gap: 10,
                                        padding: '20px 16px',
                                        borderRadius: 14,
                                        background: 'var(--bg-surface)',
                                        border: i === 0 ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--border)',
                                    }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: '50%',
                                            background: `${COLORS[i] ?? '#6b7280'}22`, color: COLORS[i] ?? '#6b7280',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 16, fontWeight: 700,
                                        }}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                        </div>
                                        <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{p.professional}</p>
                                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.count} atend.</p>
                                        {isAdmin && p.revenue !== undefined && (
                                            <p style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>
                                                R$ {p.revenue.toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
