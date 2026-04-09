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
        <div className="relative flex flex-col p-4 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-sm h-[110px] overflow-hidden">
            <span className="text-[13px] font-medium text-center w-full z-10 opacity-90">{label}</span>
            <div className="flex-1 flex items-center justify-center w-full z-10 pt-1">
                <span className="text-[24px] font-bold tracking-tight">{value}</span>
            </div>
            <Icon size={24} className="absolute left-4 bottom-4 opacity-60 z-10" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        </div>
    );
}

function SectionCard({ title, children, className = "" }: {
    title: string; children: React.ReactNode; className?: string;
}) {
    return (
        <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col ${className}`}>
            <h3 className="text-center text-[15px] font-medium text-slate-700 mb-6">{title}</h3>
            <div className="flex-1 flex flex-col w-full h-full justify-center">
                {children}
            </div>
        </div>
    );
}

function Empty({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-2 opacity-50 py-10">
            <Activity size={28} className="text-slate-400" />
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
        <div className="flex flex-col items-center w-full h-full">
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                        paddingAngle={2} dataKey="value" stroke="none"
                        label={({ name, percent }) => (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''}
                        labelLine={false}
                    >
                        {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                    </Pie>
                    <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }}
                        itemStyle={{ color: '#1e293b', fontSize: '13px', fontWeight: 'bold' }}
                        formatter={(v) => [formatLabel ? formatLabel(Number(v)) : `${v}`, '']}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mt-2 w-full px-2">
                {data.map((d, i) => {
                    const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : '0';
                    return (
                        <div key={d.name} className="flex flex-col items-center pt-1">
                            <span className="text-[12px] font-medium text-slate-500 whitespace-nowrap mb-1">{d.name}</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors[i % colors.length] }} />
                                <span className="text-[14px] font-bold text-slate-700">
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
        <div className="animate-fade-in w-full pb-20 bg-slate-50 min-h-screen px-4 lg:px-8 pt-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 mb-1">
                        {greeting()}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-[13px] text-slate-500">
                        {isAdmin ? 'Visão avançada de performance e finanças' : 'Resumo das suas atividades do mês'}
                    </p>
                </div>
                
                {/* Month Picker */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 p-1.5 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
                    <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-cyan-600 transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center justify-center min-w-[120px] h-8 border-x border-slate-100">
                        <span className="text-[13px] font-bold uppercase tracking-widest text-slate-700">
                            {MONTHS[month - 1]} {year}
                        </span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-cyan-600 transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="flex flex-col gap-5 w-full">

                    {/* Row 1: KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
                    </div>

                    {/* Row 2: Analysis & Rankings */}
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 lg:gap-5">
                        {/* Clientes */}
                        <div className="lg:col-span-2 h-[340px]">
                            <SectionCard title="Melhores Clientes" className="h-full">
                                {!data?.topClients.length ? <Empty text="Sem dados" /> : (
                                    <div className="flex flex-col h-full gap-4 pt-2">
                                        {data.topClients.slice(0, 5).map((c, i) => (
                                            <div key={c.name} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                                                    <span className="text-[14px] text-slate-700 font-medium truncate w-32 md:w-48">{c.name}</span>
                                                </div>
                                                <span className="text-[14px] font-bold text-slate-800">{fmt(c.spent)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </SectionCard>
                        </div>

                        {/* Top 5 Serviços por valor/venda */}
                        <div className="lg:col-span-3 h-[340px]">
                            <SectionCard title="Top 5 - Serviços mais realizados" className="h-full">
                                {!data?.topServices.length ? <Empty text="Sem dados" /> : (
                                    <div className="flex flex-col justify-around h-full w-full pb-2">
                                        {data.topServices.slice(0, 5).map((s, i) => (
                                            <div key={s.service} className="flex items-center gap-4 w-full">
                                                <span className="text-[13px] text-slate-700 font-medium w-[130px] text-right truncate">
                                                    {s.service}
                                                </span>
                                                <div className="flex-1 flex items-center pr-4">
                                                    <div 
                                                        className="h-8 bg-[#2563eb] rounded-sm transition-all shadow-[0_2px_8px_-2px_rgba(37,99,235,0.4)]"
                                                        style={{ width: `${Math.max(5, (s.count / (data.topServices[0]?.count || 1)) * 100)}%` }}
                                                    />
                                                    <span className="text-[13px] text-slate-600 font-bold ml-3 w-8">
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
                        <div className="lg:col-span-1 h-[340px]">
                            {!isProfessional && data?.topProfessionals && data.topProfessionals.length > 0 ? (
                                <SectionCard title="Top / Destaque" className="h-full">
                                    <div className="flex flex-col items-center justify-center p-2 h-full text-center pb-4">
                                        <div className="w-28 h-28 rounded-full bg-slate-50 flex items-center justify-center text-cyan-500 mb-5 shadow-inner border border-slate-100 relative">
                                            <Award size={48} />
                                            <div className="absolute -top-1 -right-1 bg-yellow-400 text-white w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border-4 border-white shadow-sm hover:scale-110 transition-transform">1</div>
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-[16px]">{data.topProfessionals[0].professional}</h4>
                                        <p className="text-[11px] text-slate-500 font-medium mt-1 uppercase tracking-widest">{data.topProfessionals[0].count} Serviços</p>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                            <div className="h-[340px]">
                                <SectionCard title="Fluxo e Custos Analíticos" className="h-full">
                                    <DonutChart data={expensesBreakdown} colors={DONUT_COLORS_1} formatLabel={fmt} />
                                </SectionCard>
                            </div>

                            <div className="h-[340px]">
                                <SectionCard title="Receita vs Despesa" className="h-full">
                                    <DonutChart data={revenueDonut} colors={DONUT_COLORS_2} formatLabel={fmt} />
                                </SectionCard>
                            </div>
                            
                            <div className="h-[340px]">
                                <SectionCard title="Distribuição de Clientes" className="h-full">
                                    <DonutChart data={clientsDonut} colors={DONUT_COLORS_3} formatLabel={fmt} />
                                </SectionCard>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}

