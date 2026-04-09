'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import {
    Scissors, Award, DollarSign, Users,
    ChevronLeft, ChevronRight, CalendarDays,
    TrendingDown, Percent, BarChart2, Briefcase, Activity
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
    commissionPaid: number;
    materialCost: number;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const DONUT_COLORS_1 = ['#1e3a8a', '#3b82f6', '#93c5fd', '#eab308', '#06b6d4'];
const DONUT_COLORS_2 = ['#1e3a8a', '#06b6d4'];
const DONUT_COLORS_3 = ['#eab308', '#3b82f6', '#93c5fd'];

function KpiCard({ icon: Icon, label, value, sub }: {
    icon: React.ElementType; label: string; value: string | number;
    sub?: string;
}) {
    return (
        <div className="flex flex-col p-3 rounded-md bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-sm h-24 relative overflow-hidden">
            <span className="text-[11px] font-medium text-center tracking-wide">{label}</span>
            <div className="flex items-center justify-between mt-auto w-full px-1">
                <Icon size={24} className="opacity-90" />
                <span className="text-xl font-bold tracking-tight">{value}</span>
            </div>
            {sub && <span className="absolute bottom-1 right-2 text-[8px] opacity-70">{sub}</span>}
        </div>
    );
}

function SectionCard({ title, children, className = "" }: {
    title: string; children: React.ReactNode; className?: string;
}) {
    return (
        <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-full flex flex-col ${className}`}>
            <h3 className="text-center text-sm font-medium text-slate-600 mb-4">{title}</h3>
            <div className="flex-1 flex flex-col justify-center">
                {children}
            </div>
        </div>
    );
}

function Empty({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-50">
            <Activity size={24} className="text-slate-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{text}</p>
        </div>
    );
}

function DonutChart({ data, colors, formatLabel }: {
    data: { name: string; value: number }[]; colors: string[];
    formatLabel?: (v: number) => string;
}) {
    const total = data.reduce((a, d) => a + d.value, 0);
    if (!total) return <Empty text="Sem dados" />;
    return (
        <div className="flex flex-col items-center w-full">
            <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                        paddingAngle={1} dataKey="value" stroke="none"
                        label={({ name, percent }) => (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''}
                        labelLine={false}
                    >
                        {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                    </Pie>
                    <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }}
                        itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 'bold' }}
                        formatter={(v) => [formatLabel ? formatLabel(Number(v)) : `${v}`, '']}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
                {data.map((d, i) => {
                    const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : '0';
                    return (
                        <div key={d.name} className="flex flex-col items-center pt-1">
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">{d.name}</span>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-700">
                                    {formatLabel ? formatLabel(d.value) : d.value}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

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
    const commPaid = data?.commissionPaid ?? 0;
    const matCost = data?.materialCost ?? 0;
    const totalServices = data?.topServices.reduce((a, s) => a + s.count, 0) ?? 0;
    const lucro = totalRevenue - totalExpenses;
    const margem = totalRevenue > 0 ? (lucro / totalRevenue) * 100 : 0;
    const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const adminKpis = [
        { icon: DollarSign, label: 'Receita Bruta', value: fmt(totalRevenue) },
        { icon: Scissors, label: 'Serviços', value: totalServices },
        { icon: Users, label: 'Clientes Únicos', value: data?.topClients.length ?? 0 },
        { icon: TrendingDown, label: 'Despesas Gerais', value: fmt(totalExpenses) },
        { icon: Percent, label: 'Margem %', value: `${margem.toFixed(2)}%` },
        { icon: Award, label: 'Lucro Líquido', value: fmt(lucro) }
    ];
    const managerKpis = [
        { icon: Scissors, label: 'Serviços Prestados', value: totalServices },
        { icon: Users, label: 'Clientes Atendidos', value: data?.topClients.length ?? 0 },
        { icon: Award, label: 'Colaboradores Ativos', value: data?.topProfessionals.length ?? 0 },
    ];
    const professionalKpis = [
        { icon: Scissors, label: 'Meus Serviços', value: totalServices },
        { icon: Users, label: 'Meus Clientes', value: data?.topClients.length ?? 0 },
    ];
    const kpis = isAdmin ? adminKpis : isManager ? managerKpis : professionalKpis;

    const clientsDonut = (data?.topClients ?? []).slice(0, 4).map(c => ({ name: c.name.split(' ')[0], value: c.spent }));
    if ((data?.topClients?.length ?? 0) > 4) {
        clientsDonut.push({ name: 'Outros', value: data!.topClients.slice(4).reduce((a, c) => a + c.spent, 0) });
    }
    const revenueDonut = [{ name: 'Receita', value: totalRevenue }, { name: 'Despesas', value: totalExpenses }];

    // Análise de Custos
    const expensesBreakdown = [
        { name: 'Comissões', value: commPaid },
        { name: 'Produtos', value: matCost },
        { name: 'Outros', value: totalExpenses - (commPaid + matCost) > 0 ? totalExpenses - (commPaid + matCost) : 0 }
    ];

    return (
        <div className="animate-fade-in w-full pb-20 bg-slate-50 min-h-screen px-4 md:px-8 pt-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 mb-1">
                        {greeting()}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-xs text-slate-500">
                        {isAdmin ? 'Visão avançada de performance e finanças' : 'Resumo das suas atividades do mês'}
                    </p>
                </div>
                
                {/* Month Picker */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                    <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-cyan-600 transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center justify-center min-w-[120px] h-8 border-x border-slate-100">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-700">
                            {MONTHS[month - 1]} {year}
                        </span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-cyan-600 transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="flex flex-col gap-4 max-w-7xl mx-auto">

                    {/* Row 1: KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
                    </div>

                    {/* Row 2: Analysis & Rankings */}
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                        {/* Clientes (simula a Vendas Mensais do layout em proporção) */}
                        <div className="lg:col-span-2 flex flex-col h-full">
                            <SectionCard title="Melhores Clientes" className="h-full">
                                {!data?.topClients.length ? <Empty text="Sem dados" /> : (
                                    <div className="flex flex-col gap-3 pb-2 h-full justify-center">
                                        {data.topClients.slice(0, 5).map((c, i) => (
                                            <div key={c.name} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                                    <span className="text-xs text-slate-600 font-medium truncate w-24 md:w-32">{c.name}</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">{fmt(c.spent)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </SectionCard>
                        </div>

                        {/* Top 5 Serviços por valor/venda */}
                        <div className="lg:col-span-3 flex flex-col h-full">
                            <SectionCard title="Top 5 - Serviços mais realizados" className="h-full">
                                {!data?.topServices.length ? <Empty text="Sem dados" /> : (
                                    <div className="flex flex-col justify-center h-full gap-3">
                                        {data.topServices.slice(0, 5).map((s, i) => (
                                            <div key={s.service} className="flex items-center gap-3 w-full">
                                                <span className="text-xs text-slate-600 font-medium w-1/3 text-right truncate">
                                                    {s.service}
                                                </span>
                                                <div className="w-2/3 flex items-center pr-4">
                                                    <div 
                                                        className="h-5 bg-[#3b82f6] rounded-sm transition-all"
                                                        style={{ width: `${Math.max(5, (s.count / (data.topServices[0]?.count || 1)) * 100)}%` }}
                                                    />
                                                    <span className="text-[10px] text-slate-500 font-bold ml-2 w-8">
                                                        {s.count}x
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </SectionCard>
                        </div>

                        {/* Imagem/Destaque */}
                        <div className="lg:col-span-1 flex flex-col h-full">
                            {!isProfessional && data?.topProfessionals && data.topProfessionals.length > 0 ? (
                                <SectionCard title="Top / Destaque" className="h-full">
                                    <div className="flex flex-col items-center justify-center p-2 h-full text-center mt-2">
                                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-cyan-500 mb-3 shadow-inner border border-slate-100 relative">
                                            <Award size={32} />
                                            <div className="absolute -top-1 -right-1 bg-yellow-400 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border-2 border-white shadow-sm">1</div>
                                        </div>
                                        <h4 className="font-bold text-slate-700 text-sm">{data.topProfessionals[0].professional}</h4>
                                        <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">{data.topProfessionals[0].count} Serviços</p>
                                    </div>
                                </SectionCard>
                            ) : (
                                <SectionCard title="Top / Destaque" className="h-full">
                                    <Empty text="Sem Destaque" />
                                </SectionCard>
                            )}
                        </div>
                    </div>

                    {/* Row 3: Admin Donut Charts */}
                    {isAdmin && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SectionCard title="Fluxo e Custos Analíticos">
                                <DonutChart data={expensesBreakdown} colors={DONUT_COLORS_1} formatLabel={fmt} />
                            </SectionCard>

                            <SectionCard title="Receita vs Despesa">
                                <DonutChart data={revenueDonut} colors={DONUT_COLORS_2} formatLabel={fmt} />
                            </SectionCard>
                            
                            <SectionCard title="Distribuição de Clientes">
                                <DonutChart data={clientsDonut} colors={DONUT_COLORS_3} formatLabel={fmt} />
                            </SectionCard>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}

