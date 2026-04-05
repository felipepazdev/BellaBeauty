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
        <div className="card flex items-center gap-4 group">
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ background: `${color}14`, border: `1px solid ${color}28` }}
            >
                <Icon size={22} style={{ color }} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                    {label}
                </p>
                <p className="text-xl font-serif font-bold tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
                    {value}
                </p>
                {sub && (
                    <p className="text-[11px] mt-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>{sub}</p>
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

            {/* ── Cabeçalho ──────────────────────────────────────────── */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                        {greeting()}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {user?.role === 'ADMIN' ? 'Visão geral da operação' : 'Seu resumo de atividades e desempenho'}
                    </p>
                </div>

                {/* Seletor de mês */}
                <div className="flex items-center gap-1 rounded-xl p-1"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <button
                        onClick={() => changeMonth(-1)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div className="flex items-center gap-2 px-3 min-w-[150px] justify-center">
                        <CalendarDays size={14} style={{ color: 'var(--accent-gold)' }} />
                        <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                            {MONTHS[month - 1]} {year}
                        </span>
                    </div>

                    <button
                        onClick={() => changeMonth(1)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center" style={{ height: 200 }}>
                    <span className="spinner" style={{ width: 32, height: 32 }} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* ── KPIs ─────────────────────────────────────── */}
                    {(isAdmin || isManager) && (
                        <div className="kpi-grid">
                            <StatCard icon={Scissors} label="Serviços realizados" value={totalServices} color="#7c3aed" sub="neste período" />
                            <StatCard icon={Users} label="Clientes atendidos" value={data?.topClients.length ?? 0} color="#0284c7" sub="top 5 exibidos" />
                            <StatCard icon={Award} label="Profissionais ativos" value={data?.topProfessionals.length ?? 0} color="#059669" />
                            {isAdmin && (
                                <StatCard icon={DollarSign} label="Faturamento bruto" value={`R$ ${totalRevenue.toFixed(2)}`} color="#b48c26" sub="receita total do período" />
                            )}
                        </div>
                    )}

                    {isProfessional && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <StatCard icon={Users} label="Meus clientes" value={data?.topClients.length ?? 0} color="#0284c7" />
                            <StatCard icon={Scissors} label="Meus serviços" value={totalServices} color="#7c3aed" />
                        </div>
                    )}

                    {/* ── Gráficos ──────────────────────────────────── */}
                    <div className="charts-grid mt-2">

                        {/* Top Serviços */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: 'rgba(212,175,55,0.12)', color: '#b48c26' }}>
                                        <Scissors size={16} strokeWidth={2} />
                                    </div>
                                    <h2 className="text-sm font-serif font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                                        {isProfessional ? 'Serviços Prestados' : 'Desempenho de Serviços'}
                                    </h2>
                                </div>
                                <BarChart2 size={15} style={{ color: 'var(--text-muted)' }} />
                            </div>

                            {!data?.topServices.length ? (
                                <div className="flex flex-col items-center justify-center gap-2" style={{ height: 200 }}>
                                    <BarChart2 size={28} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sem dados no período</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={data.topServices} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 8 }}>
                                        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="service"
                                            type="category"
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
                                            width={100}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'var(--bg-base)' }}
                                            contentStyle={{
                                                background: 'var(--bg-surface)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '10px',
                                                color: 'var(--text-primary)',
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                            }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                        />
                                        <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 4, 4, 0]} barSize={18}>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#b48c26" />
                                                    <stop offset="100%" stopColor="#d4af37" />
                                                </linearGradient>
                                            </defs>
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Top Clientes */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: 'rgba(2,132,199,0.12)', color: '#0284c7' }}>
                                        <Users size={16} strokeWidth={2} />
                                    </div>
                                    <h2 className="text-sm font-serif font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                                        {isProfessional ? 'Fidelidade de Clientes' : 'Melhores Clientes do Mês'}
                                    </h2>
                                </div>
                                <Star size={15} style={{ color: 'var(--text-muted)' }} />
                            </div>

                            {!data?.topClients.length ? (
                                <div className="flex flex-col items-center justify-center gap-2" style={{ height: 200 }}>
                                    <Users size={28} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sem movimentação</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {data.topClients.map((c, i) => (
                                        <div
                                            key={c.name}
                                            className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200"
                                            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                                        >
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border flex-shrink-0"
                                                style={{
                                                    backgroundColor: `${COLORS[i]}12`,
                                                    borderColor: `${COLORS[i]}30`,
                                                    color: COLORS[i],
                                                }}
                                            >
                                                0{i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate capitalize" style={{ color: 'var(--text-primary)' }}>
                                                    {c.name.toLowerCase()}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-bold" style={{ color: '#059669' }}>
                                                    R$ {c.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Ranking de Profissionais ───────────────────── */}
                    {!isProfessional && data?.topProfessionals && data.topProfessionals.length > 0 && (
                        <div className="card mt-2">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: 'rgba(212,175,55,0.12)', color: '#b48c26' }}>
                                        <Award size={16} strokeWidth={2} />
                                    </div>
                                    <h2 className="text-sm font-serif font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                                        🏆 Desempenho por Colaborador
                                    </h2>
                                </div>
                                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                                    {isAdmin ? 'Venda / Serviço' : 'Volume de Atendimentos'}
                                </span>
                            </div>

                            <div className="ranking-grid">
                                {data.topProfessionals.map((p, i) => (
                                    <div
                                        key={p.professional}
                                        className="flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-200 group"
                                        style={{
                                            background: i === 0 ? 'linear-gradient(135deg, #fffde7, #fff9e6)' : 'var(--bg-base)',
                                            border: `1px solid ${i === 0 ? 'rgba(212,175,55,0.3)' : 'var(--border)'}`,
                                        }}
                                    >
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3"
                                            style={{
                                                background: i === 0 ? 'rgba(212,175,55,0.15)' : 'var(--bg-surface)',
                                                border: `1px solid ${i === 0 ? 'rgba(212,175,55,0.3)' : 'var(--border)'}`,
                                            }}
                                        >
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                        </div>
                                        <p className="text-sm font-semibold mb-1 capitalize leading-tight" style={{ color: 'var(--text-primary)' }}>
                                            {p.professional.toLowerCase()}
                                        </p>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#059669' }} />
                                            <p className="text-[10px] font-bold uppercase tracking-tight" style={{ color: 'var(--text-muted)' }}>
                                                {p.count} atendimentos
                                            </p>
                                        </div>
                                        {isAdmin && p.revenue !== undefined && (
                                            <div className="pt-3 mt-auto border-t w-full" style={{ borderColor: 'var(--border)' }}>
                                                <p className="text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Faturamento</p>
                                                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                                    R$ {p.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
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
