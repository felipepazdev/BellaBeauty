'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import {
    Scissors, Award, BarChart2, Star, DollarSign, Users,
    ChevronLeft, ChevronRight, CalendarDays, TrendingUp, Package
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    Cell
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

/* ── KPI Card com gradiente (igual à imagem de referência) ── */
function KpiCard({
    icon: Icon,
    label,
    value,
    sub,
    gradient,
    iconBg,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    gradient: string;
    iconBg?: string;
}) {
    return (
        <div
            className="relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between group transition-transform duration-200 hover:-translate-y-0.5"
            style={{
                background: gradient,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                minHeight: 110,
            }}
        >
            {/* Círculo decorativo de fundo */}
            <div
                className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20"
                style={{ background: 'rgba(255,255,255,0.3)' }}
            />
            <div
                className="absolute -right-1 -bottom-6 w-16 h-16 rounded-full opacity-10"
                style={{ background: 'rgba(255,255,255,0.5)' }}
            />

            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-[11px] font-bold tracking-widest uppercase mb-1.5 opacity-80" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {label}
                    </p>
                    <p className="text-2xl font-bold leading-none" style={{ color: '#fff' }}>
                        {value}
                    </p>
                    {sub && (
                        <p className="text-[11px] mt-1.5 font-medium opacity-75" style={{ color: 'rgba(255,255,255,0.85)' }}>
                            {sub}
                        </p>
                    )}
                </div>
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: iconBg ?? 'rgba(255,255,255,0.22)' }}
                >
                    <Icon size={22} color="#fff" strokeWidth={2} />
                </div>
            </div>
        </div>
    );
}

/* ── Chart Card Container ── */
function ChartCard({ title, icon: Icon, iconColor, children }: {
    title: string;
    icon: React.ElementType;
    iconColor: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className="rounded-2xl p-5"
            style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            }}
        >
            <div className="flex items-center gap-2.5 mb-5">
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${iconColor}18`, color: iconColor }}
                >
                    <Icon size={15} strokeWidth={2.5} />
                </div>
                <h2 className="text-sm font-bold" style={{ color: '#111827', fontFamily: 'Inter, sans-serif' }}>
                    {title}
                </h2>
            </div>
            {children}
        </div>
    );
}

const BAR_COLORS = ['#7c3aed', '#a78bfa', '#818cf8', '#6366f1', '#4f46e5'];
const CLIENT_COLORS = ['#7c3aed', '#0284c7', '#059669', '#d97706', '#dc2626'];

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
    const totalExpenses = data?.totalExpenses ?? 0;
    const totalServices = data?.topServices.reduce((a, s) => a + s.count, 0) ?? 0;
    const lucro = totalRevenue - totalExpenses;

    return (
        <div
            className="animate-fade-in min-h-screen"
            style={{ width: '100%', background: '#f5f6fa' }}
        >
            {/* ── Cabeçalho ── */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold tracking-tight mb-0.5" style={{ color: '#111827', fontFamily: 'Inter, sans-serif' }}>
                        {greeting()}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-sm" style={{ color: '#6b7280' }}>
                        {user?.role === 'ADMIN' ? 'Visão geral da operação' : 'Seu resumo de atividades'}
                    </p>
                </div>

                {/* Seletor de mês */}
                <div
                    className="flex items-center gap-1 rounded-xl p-1"
                    style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                >
                    <button
                        onClick={() => changeMonth(-1)}
                        className="p-1.5 rounded-lg transition-all hover:bg-gray-100"
                        style={{ color: '#6b7280' }}
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div className="flex items-center gap-2 px-3 min-w-[150px] justify-center">
                        <CalendarDays size={14} style={{ color: '#7c3aed' }} />
                        <span className="text-sm font-semibold" style={{ color: '#111827' }}>
                            {MONTHS[month - 1]} {year}
                        </span>
                    </div>

                    <button
                        onClick={() => changeMonth(1)}
                        className="p-1.5 rounded-lg transition-all hover:bg-gray-100"
                        style={{ color: '#6b7280' }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center" style={{ height: 200 }}>
                    <span className="spinner" style={{ width: 32, height: 32, borderTopColor: '#7c3aed' }} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* ── KPIs coloridos ── */}
                    {(isAdmin || isManager) && (
                        <div className="kpi-grid">
                            <KpiCard
                                icon={Scissors}
                                label="Serviços Realizados"
                                value={totalServices}
                                sub="neste período"
                                gradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
                            />
                            <KpiCard
                                icon={Users}
                                label="Clientes Atendidos"
                                value={data?.topClients.length ?? 0}
                                sub="top clientes"
                                gradient="linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)"
                            />
                            <KpiCard
                                icon={Award}
                                label="Colaboradores Ativos"
                                value={data?.topProfessionals.length ?? 0}
                                gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
                            />
                            {isAdmin && (
                                <KpiCard
                                    icon={DollarSign}
                                    label="Faturamento Bruto"
                                    value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                    sub="receita total"
                                    gradient="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
                                />
                            )}
                        </div>
                    )}

                    {/* KPIs extras para Admin (Despesas e Lucro) */}
                    {isAdmin && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <KpiCard
                                icon={TrendingUp}
                                label="Despesas do Período"
                                value={`R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                gradient="linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
                            />
                            <KpiCard
                                icon={Package}
                                label="Lucro Líquido"
                                value={`R$ ${lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                gradient={lucro >= 0
                                    ? "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)"
                                    : "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)"
                                }
                            />
                        </div>
                    )}

                    {isProfessional && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <KpiCard
                                icon={Users}
                                label="Meus Clientes"
                                value={data?.topClients.length ?? 0}
                                gradient="linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)"
                            />
                            <KpiCard
                                icon={Scissors}
                                label="Meus Serviços"
                                value={totalServices}
                                gradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
                            />
                        </div>
                    )}

                    {/* ── Gráficos ── */}
                    <div className="charts-grid mt-1">

                        {/* Top Serviços — Barras horizontais */}
                        <ChartCard
                            title={isProfessional ? 'Serviços Prestados' : 'Top 5 — Serviços'}
                            icon={BarChart2}
                            iconColor="#7c3aed"
                        >
                            {!data?.topServices.length ? (
                                <div className="flex flex-col items-center justify-center gap-2" style={{ height: 220 }}>
                                    <BarChart2 size={28} style={{ color: '#d1d5db' }} />
                                    <p className="text-sm" style={{ color: '#9ca3af' }}>Sem dados no período</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={data.topServices.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
                                        <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="service"
                                            type="category"
                                            tick={{ fill: '#374151', fontSize: 11, fontWeight: 500 }}
                                            width={110}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{
                                                background: '#ffffff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '10px',
                                                color: '#111827',
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                                fontSize: 12,
                                            }}
                                            itemStyle={{ color: '#7c3aed', fontWeight: 600 }}
                                            formatter={(v) => [`${v} serviço(s)`, '']}
                                        />
                                        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                                            {data.topServices.slice(0, 5).map((_, i) => (
                                                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        {/* Top Clientes */}
                        <ChartCard
                            title={isProfessional ? 'Fidelidade de Clientes' : 'Melhores Clientes do Mês'}
                            icon={Star}
                            iconColor="#0284c7"
                        >
                            {!data?.topClients.length ? (
                                <div className="flex flex-col items-center justify-center gap-2" style={{ height: 220 }}>
                                    <Users size={28} style={{ color: '#d1d5db' }} />
                                    <p className="text-sm" style={{ color: '#9ca3af' }}>Sem movimentação</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {data.topClients.map((c, i) => (
                                        <div
                                            key={c.name}
                                            className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:shadow-sm"
                                            style={{
                                                background: '#f9fafb',
                                                border: '1px solid #f3f4f6',
                                            }}
                                        >
                                            {/* Rank badge */}
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                                style={{
                                                    background: `${CLIENT_COLORS[i]}15`,
                                                    border: `1.5px solid ${CLIENT_COLORS[i]}35`,
                                                    color: CLIENT_COLORS[i],
                                                }}
                                            >
                                                {String(i + 1).padStart(2, '0')}
                                            </div>

                                            {/* Barra de progresso proporcional */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-semibold truncate capitalize mb-1" style={{ color: '#111827' }}>
                                                    {c.name.toLowerCase()}
                                                </p>
                                                <div style={{ background: '#e5e7eb', borderRadius: 4, height: 4 }}>
                                                    <div style={{
                                                        width: `${Math.min(100, (c.spent / (data.topClients[0]?.spent || 1)) * 100)}%`,
                                                        background: CLIENT_COLORS[i],
                                                        height: '100%',
                                                        borderRadius: 4,
                                                    }} />
                                                </div>
                                            </div>

                                            <p className="text-sm font-bold flex-shrink-0" style={{ color: '#059669' }}>
                                                R$ {c.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ChartCard>
                    </div>

                    {/* ── Ranking de Profissionais ── */}
                    {!isProfessional && data?.topProfessionals && data.topProfessionals.length > 0 && (
                        <div
                            className="rounded-2xl p-5 mt-1"
                            style={{
                                background: '#ffffff',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                            }}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: 'rgba(212,175,55,0.15)', color: '#b48c26' }}>
                                        <Award size={15} strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-sm font-bold" style={{ color: '#111827', fontFamily: 'Inter, sans-serif' }}>
                                        🏆 Desempenho por Colaborador
                                    </h2>
                                </div>
                                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#9ca3af' }}>
                                    {isAdmin ? 'Venda / Serviço' : 'Atendimentos'}
                                </span>
                            </div>

                            <div className="ranking-grid">
                                {data.topProfessionals.map((p, i) => (
                                    <div
                                        key={p.professional}
                                        className="flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                                        style={{
                                            background: i === 0
                                                ? 'linear-gradient(135deg, #fffde7 0%, #fff9e6 100%)'
                                                : '#f9fafb',
                                            border: `1px solid ${i === 0 ? 'rgba(212,175,55,0.35)' : '#e5e7eb'}`,
                                        }}
                                    >
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3"
                                            style={{
                                                background: i === 0 ? 'rgba(212,175,55,0.18)' : '#ffffff',
                                                border: `1px solid ${i === 0 ? 'rgba(212,175,55,0.3)' : '#e5e7eb'}`,
                                            }}
                                        >
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                        </div>
                                        <p className="text-sm font-semibold mb-1 capitalize leading-tight" style={{ color: '#111827' }}>
                                            {p.professional.toLowerCase()}
                                        </p>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#059669' }} />
                                            <p className="text-[10px] font-bold uppercase tracking-tight" style={{ color: '#6b7280' }}>
                                                {p.count} atendimentos
                                            </p>
                                        </div>
                                        {isAdmin && p.revenue !== undefined && (
                                            <div className="pt-3 mt-auto border-t w-full" style={{ borderColor: '#e5e7eb' }}>
                                                <p className="text-[10px] mb-0.5" style={{ color: '#9ca3af' }}>Faturamento</p>
                                                <p className="text-sm font-bold" style={{ color: '#111827' }}>
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
