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
        <div className="card flex items-center gap-5 group bg-[var(--bg-surface)] border border-[var(--border)] p-6 rounded-[2rem]">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon size={24} style={{ color }} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase mb-1">
                    {label}
                </p>
                <p className="text-2xl font-serif font-bold tracking-tight text-[var(--text-primary)] leading-none">
                    {value}
                </p>
                {sub && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-2 font-medium">{sub}</p>
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
            <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-[var(--text-primary)] mb-2">
                        {greeting()}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                        {user?.role === 'ADMIN' ? 'Visão geral da sua operação premium' : 'Seu resumo de atividades e performance'}
                    </p>
                </div>

                {/* Seletor de mês */}
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] backdrop-blur-md">
                    <button onClick={() => changeMonth(-1)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-xl transition-all">
                        <ChevronLeft size={18} />
                    </button>
                    
                    <div className="flex items-center gap-3 px-4 min-w-[160px] justify-center">
                        <CalendarDays size={16} className="text-[#8b5cf6]" />
                        <span className="text-sm font-bold tracking-wide text-[var(--text-primary)]">
                            {MONTHS[month - 1].toUpperCase()} {year}
                        </span>
                    </div>

                    <button onClick={() => changeMonth(1)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-xl transition-all">
                        <ChevronRight size={18} />
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
                    <div className="charts-grid mt-4">

                        {/* Top Serviços */}
                        <div className="card !p-8 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[2rem]">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-[#8b5cf6]">
                                        <Scissors size={18} strokeWidth={2} />
                                    </div>
                                    <h2 className="text-base font-serif font-bold tracking-wide text-[var(--text-primary)]">
                                        {isProfessional ? 'Serviços Prestados' : 'Top Performance de Serviços'}
                                    </h2>
                                </div>
                                <BarChart2 size={16} className="text-[var(--text-muted)]" />
                            </div>
                            
                            {!data?.topServices.length ? (
                                <div className="h-[220px] flex flex-col items-center justify-center text-slate-500">
                                    <BarChart2 size={32} className="opacity-10 mb-2" />
                                    <p className="text-sm">Sem dados registrados</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={data.topServices} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 10 }}>
                                        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="service" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }} width={100} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            cursor={{ fill: 'var(--bg-card)' }}
                                            contentStyle={{ 
                                                background: 'var(--bg-surface)', 
                                                border: '1px solid var(--border)', 
                                                borderRadius: '12px', 
                                                color: 'var(--text-primary)' 
                                            }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                        />
                                        <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 4, 4, 0]} barSize={20}>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#8b5cf6" />
                                                    <stop offset="100%" stopColor="#6d28d9" />
                                                </linearGradient>
                                            </defs>
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Top Clientes */}
                        <div className="card !p-8 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[2rem]">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#0ea5e9]">
                                        <Users size={18} strokeWidth={2} />
                                    </div>
                                    <h2 className="text-base font-serif font-bold tracking-wide text-[var(--text-primary)]">
                                        {isProfessional ? 'Fidelidade de Clientes' : 'Top Clientes do Mês'}
                                    </h2>
                                </div>
                                <Star size={16} className="text-[var(--text-muted)]" />
                            </div>

                            {!data?.topClients.length ? (
                                <div className="h-[220px] flex flex-col items-center justify-center text-slate-500">
                                    <Users size={32} className="opacity-10 mb-2" />
                                    <p className="text-sm">Sem movimentação</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {data.topClients.map((c, i) => (
                                        <div key={c.name} className="group/item flex items-center gap-4 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-all duration-300">
                                            <div className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] group-hover/item:text-[var(--text-primary)] transition-colors"
                                                 style={{ backgroundColor: `${COLORS[i]}15` }}>
                                                0{i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[var(--text-secondary)] truncate group-hover/item:text-[var(--text-primary)] transition-colors capitalize">
                                                    {c.name.toLowerCase()}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-bold text-[#10b981]">
                                                    R$ {c.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Ranking ───────────────────────────────────── */}
                    {!isProfessional && data?.topProfessionals && data.topProfessionals.length > 0 && (
                        <div className="card !p-8 mt-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[2rem]">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-[#f59e0b]">
                                        <Award size={18} strokeWidth={2} />
                                    </div>
                                    <h2 className="text-base font-serif font-bold tracking-wide text-[var(--text-primary)]">
                                        🏆 Performance por Colaborador
                                    </h2>
                                </div>
                                <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                                    {isAdmin ? 'Métricas de Venda / Serviço' : 'Volume de Atendimentos'}
                                </span>
                            </div>

                            <div className="ranking-grid">
                                {data.topProfessionals.map((p, i) => (
                                    <div key={p.professional} 
                                        className={`
                                            flex flex-col items-center text-center p-6 rounded-[24px] border transition-all duration-300 group
                                            ${i === 0 ? 'bg-amber-500/[0.03] border-amber-500/20 shadow-lg shadow-amber-500/5' : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--accent)]/30'}
                                        `}
                                    >
                                        <div className={`
                                            w-14 h-14 rounded-full flex items-center justify-center text-xl mb-4 shadow-inner
                                            ${i === 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-[var(--bg-base)] text-[var(--text-muted)] border border-[var(--border)]'}
                                        `}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                        </div>
                                        <p className="text-sm font-bold text-[var(--text-primary)] mb-1 capitalize leading-tight group-hover:text-[#8b5cf6] transition-colors">
                                            {p.professional.toLowerCase()}
                                        </p>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                                            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                                                {p.count} Atendimentos
                                            </p>
                                        </div>
                                        {isAdmin && p.revenue !== undefined && (
                                            <div className="mt-auto pt-4 border-t border-[var(--border)] w-full">
                                                <p className="text-xs text-[var(--text-muted)] mb-1">Faturamento</p>
                                                <p className="text-sm font-bold text-[var(--text-primary)]">
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
