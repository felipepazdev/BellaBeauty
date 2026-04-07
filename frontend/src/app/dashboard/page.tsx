'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import {
    Scissors, Award, DollarSign, Users,
    ChevronLeft, ChevronRight, CalendarDays,
    TrendingDown, Percent, BarChart2, Star
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Cell, PieChart, Pie
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

// Gradientes em ciano — azul escuro → ciano → turquesa → verde-água
const KPI_GRADIENTS = [
    'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
    'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
    'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
    'linear-gradient(135deg, #0e7490 0%, #0f766e 100%)',
];

const BAR_COLORS = ['#1971c2', '#1971c2', '#1971c2', '#1971c2', '#1971c2'];
const DONUT_COLORS_1 = ['#1971c2', '#74c0fc', '#e9c46a', '#f4a261'];
const DONUT_COLORS_2 = ['#1971c2', '#e9c46a', '#2f9e44', '#e03131'];
const DONUT_COLORS_3 = ['#1971c2', '#74c0fc'];

/* ── KPI Card compacto ── */
function KpiCard({ icon: Icon, label, value, gradient, sub }: {
    icon: React.ElementType; label: string; value: string | number;
    gradient: string; sub?: string;
}) {
    return (
        <div style={{
            background: gradient, borderRadius: 8, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)', position: 'relative', overflow: 'hidden',
        }}>
            <div style={{ position: 'absolute', right: -10, top: -10, width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon size={15} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>
                    {label}
                </span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                {value}
            </p>
            {sub && <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{sub}</p>}
        </div>
    );
}

/* ── Card branco com título ── */
function WhiteCard({ title, children, style }: {
    title: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
    return (
        <div style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #e9ecef', padding: '16px 18px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)', ...style,
        }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 14, fontFamily: 'Inter, sans-serif' }}>
                {title}
            </p>
            {children}
        </div>
    );
}

/* ── Empty state ── */
function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, gap: 8 }}>
            <Icon size={26} color="#dee2e6" />
            <p style={{ fontSize: 12, color: '#adb5bd' }}>{text}</p>
        </div>
    );
}

/* ── Donut chart reutilizável ── */
function DonutChart({ data, colors, formatLabel }: {
    data: { name: string; value: number }[]; colors: string[];
    formatLabel?: (v: number) => string;
}) {
    const total = data.reduce((a, d) => a + d.value, 0);
    if (!total) return <Empty icon={BarChart2} text="Sem dados" />;
    return (
        <div>
            <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                        paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                        {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                    </Pie>
                    <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: 8, fontSize: 11 }}
                        formatter={(v) => [formatLabel ? formatLabel(Number(v)) : `${v}`, '']}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', justifyContent: 'center', marginTop: 4 }}>
                {data.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[i % colors.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: '#6c757d', textTransform: 'capitalize' }}>
                            {d.name.toLowerCase()} {total > 0 ? `${((d.value / total) * 100).toFixed(0)}%` : ''}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Página ── */
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
        let m = month + dir, y = year;
        if (m > 12) { m = 1; y++; }
        if (m < 1) { m = 12; y--; }
        setMonth(m); setYear(y);
    };

    const isAdmin = user?.role === 'ADMIN';
    const isManager = user?.role === 'MANAGER';
    const isProfessional = user?.role === 'PROFESSIONAL';

    const greeting = () => {
        const h = new Date().getHours();
        return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    };

    const totalRevenue = data?.totalRevenue ?? 0;
    const totalExpenses = data?.totalExpenses ?? 0;
    const totalServices = data?.topServices.reduce((a, s) => a + s.count, 0) ?? 0;
    const lucro = totalRevenue - totalExpenses;
    const margem = totalRevenue > 0 ? (lucro / totalRevenue) * 100 : 0;
    const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const adminKpis = [
        { icon: DollarSign, label: 'Total de Vendas', value: fmt(totalRevenue), gradient: KPI_GRADIENTS[0] },
        { icon: Scissors, label: 'Qtde. Serviços', value: totalServices, gradient: KPI_GRADIENTS[1] },
        { icon: Users, label: 'Clientes', value: data?.topClients.length ?? 0, gradient: KPI_GRADIENTS[2], sub: 'top clientes' },
        { icon: TrendingDown, label: 'Custo', value: fmt(totalExpenses), gradient: KPI_GRADIENTS[3] },
        { icon: Percent, label: 'Margem', value: `${margem.toFixed(2)}%`, gradient: KPI_GRADIENTS[4] },
        { icon: Award, label: 'Lucro', value: fmt(lucro), gradient: KPI_GRADIENTS[5] },
    ];
    const managerKpis = [
        { icon: Scissors, label: 'Serviços', value: totalServices, gradient: KPI_GRADIENTS[0] },
        { icon: Users, label: 'Clientes', value: data?.topClients.length ?? 0, gradient: KPI_GRADIENTS[2] },
        { icon: Award, label: 'Colaboradores', value: data?.topProfessionals.length ?? 0, gradient: KPI_GRADIENTS[4] },
    ];
    const professionalKpis = [
        { icon: Scissors, label: 'Meus Serviços', value: totalServices, gradient: KPI_GRADIENTS[0] },
        { icon: Users, label: 'Meus Clientes', value: data?.topClients.length ?? 0, gradient: KPI_GRADIENTS[3] },
    ];
    const kpis = isAdmin ? adminKpis : isManager ? managerKpis : professionalKpis;

    const clientsDonut = (data?.topClients ?? []).map(c => ({ name: c.name.split(' ')[0], value: c.spent }));
    const profDonut = (data?.topProfessionals ?? []).map(p => ({ name: p.professional.split(' ')[0], value: p.count }));
    const revenueDonut = [{ name: 'Faturamento', value: totalRevenue }, { name: 'Despesas', value: totalExpenses }];

    return (
        <div className="animate-fade-in" style={{ width: '100%', background: '#f8f9fa', minHeight: '100vh' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                    <h1 style={{ fontSize: 19, fontWeight: 700, color: '#212529', marginBottom: 2 }}>
                        {greeting()}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p style={{ fontSize: 13, color: '#6c757d' }}>
                        {isAdmin ? 'Visão geral da operação' : 'Resumo de atividades'}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#fff', border: '1px solid #dee2e6', borderRadius: 8, padding: '5px 8px' }}>
                    <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d', display: 'flex', padding: '2px 4px' }}>
                        <ChevronLeft size={15} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', minWidth: 140, justifyContent: 'center' }}>
                        <CalendarDays size={13} color="#7c3aed" />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#212529' }}>{MONTHS[month - 1]} {year}</span>
                    </div>
                    <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d', display: 'flex', padding: '2px 4px' }}>
                        <ChevronRight size={15} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <span className="spinner" style={{ width: 30, height: 30, borderTopColor: '#7c3aed' }} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* ── KPI Row — uma linha, gradiente roxo→rosa ── */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${kpis.length}, 1fr)`,
                        gap: 8,
                    }}>
                        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
                    </div>

                    {/* ── Gráficos principais ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                        {/* Top 5 Serviços — barra horizontal */}
                        <WhiteCard title="Top 5 — Serviços por quantidade">
                            {!data?.topServices.length ? (
                                <Empty icon={BarChart2} text="Sem dados no período" />
                            ) : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={data.topServices.slice(0, 5)} layout="vertical"
                                        margin={{ top: 0, right: 28, bottom: 0, left: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="service" type="category"
                                            tick={{ fill: '#495057', fontSize: 11 }} width={115}
                                            axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: '#f8f9fa' }}
                                            contentStyle={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: 8, fontSize: 11 }}
                                            formatter={(v) => [`${v} serviço(s)`, '']}
                                        />
                                        <Bar dataKey="count" radius={[0, 5, 5, 0]} barSize={20}>
                                            {data.topServices.slice(0, 5).map((_, i) => (
                                                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </WhiteCard>

                        {/* Top Clientes */}
                        <WhiteCard title="Melhores Clientes do Mês">
                            {!data?.topClients.length ? (
                                <Empty icon={Users} text="Sem movimentação" />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                    {data.topClients.slice(0, 5).map((c, i) => (
                                        <div key={c.name} style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '8px 10px', borderRadius: 8,
                                            background: '#f8f9fa', border: '1px solid #f1f3f5',
                                        }}>
                                            <div style={{
                                                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                                                background: `${BAR_COLORS[0]}18`, border: `1.5px solid ${BAR_COLORS[0]}40`,
                                                color: BAR_COLORS[0], display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', fontSize: 9, fontWeight: 700,
                                            }}>
                                                {String(i + 1).padStart(2, '0')}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: '#212529', textTransform: 'capitalize', marginBottom: 3 }}>
                                                    {c.name.toLowerCase()}
                                                </p>
                                                <div style={{ background: '#e9ecef', borderRadius: 3, height: 3 }}>
                                                    <div style={{
                                                        width: `${Math.min(100, (c.spent / (data.topClients[0]?.spent || 1)) * 100)}%`,
                                                        background: BAR_COLORS[0], height: '100%', borderRadius: 3,
                                                    }} />
                                                </div>
                                            </div>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: '#2f9e44', flexShrink: 0 }}>
                                                {fmt(c.spent)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </WhiteCard>
                    </div>

                    {/* ── 3 Donuts ── */}
                    {isAdmin && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <WhiteCard title="Faturamento vs Despesas">
                                <DonutChart
                                    data={revenueDonut}
                                    colors={DONUT_COLORS_2}
                                    formatLabel={fmt}
                                />
                            </WhiteCard>
                            <WhiteCard title="Distribuição de Clientes">
                                <DonutChart
                                    data={clientsDonut}
                                    colors={DONUT_COLORS_1}
                                    formatLabel={fmt}
                                />
                            </WhiteCard>
                            <WhiteCard title="Profissionais — Atendimentos">
                                <DonutChart
                                    data={profDonut}
                                    colors={DONUT_COLORS_3}
                                    formatLabel={(v) => `${v} atend.`}
                                />
                            </WhiteCard>
                        </div>
                    )}

                    {/* ── Ranking profissionais ── */}
                    {!isProfessional && data?.topProfessionals && data.topProfessionals.length > 0 && (
                        <WhiteCard title="🏆 Desempenho por Colaborador">
                            <div className="ranking-grid">
                                {data.topProfessionals.map((p, i) => (
                                    <div key={p.professional} style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        textAlign: 'center', padding: '14px 10px', borderRadius: 10,
                                        background: i === 0 ? 'linear-gradient(135deg, #fff9e6, #fffdf5)' : '#f8f9fa',
                                        border: `1px solid ${i === 0 ? 'rgba(212,175,55,0.3)' : '#e9ecef'}`,
                                    }}>
                                        <div style={{
                                            width: 42, height: 42, borderRadius: '50%', fontSize: 18,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                                            background: i === 0 ? 'rgba(212,175,55,0.15)' : '#fff',
                                            border: `1px solid ${i === 0 ? 'rgba(212,175,55,0.3)' : '#e9ecef'}`,
                                        }}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                        </div>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: '#212529', textTransform: 'capitalize', marginBottom: 3 }}>
                                            {p.professional.toLowerCase()}
                                        </p>
                                        <p style={{ fontSize: 10, color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>
                                            {p.count} atend.
                                        </p>
                                        {isAdmin && p.revenue !== undefined && (
                                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e9ecef', width: '100%' }}>
                                                <p style={{ fontSize: 10, color: '#adb5bd' }}>Faturamento</p>
                                                <p style={{ fontSize: 12, fontWeight: 700, color: '#212529' }}>
                                                    {fmt(p.revenue)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </WhiteCard>
                    )}

                </div>
            )}
        </div>
    );
}
