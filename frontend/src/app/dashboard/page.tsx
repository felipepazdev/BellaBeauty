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

const BAR_COLORS = ['#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'];
const DONUT_COLORS_1 = ['#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'];
const DONUT_COLORS_2 = ['#10b981', '#ef4444'];
const DONUT_COLORS_3 = ['#06b6d4', '#0ea5e9', '#3b82f6'];

function KpiCard({ icon: Icon, label, value, sub, isCyan = false, isAccent = false, isRed = false }: {
    icon: React.ElementType; label: string; value: string | number;
    sub?: string; isCyan?: boolean; isAccent?: boolean; isRed?: boolean;
}) {
    return (
        <div className={`card overflow-hidden relative p-6 flex flex-col gap-2 rounded-3xl border transition-all hover:-translate-y-1 ${
            isCyan ? 'bg-gradient-to-br from-[var(--bg-surface)] to-[#0c0c10] border-[var(--accent-cyan)]/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 
            isRed ? 'bg-red-500/5 border-red-500/20' :
            'bg-white/5 border-white/5 hover:border-white/10'
        }`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none ${
                isCyan ? 'bg-[var(--accent-cyan)]' : 
                isRed ? 'bg-red-500' :
                'bg-white'
            }`} />
            
            <div className="flex items-center gap-3 relative z-10">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isCyan ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border-[var(--accent-cyan)]/20' : 
                    isRed ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-white/5 text-slate-400 border-white/5'
                }`}>
                    <Icon size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {label}
                </span>
            </div>

            <p className={`text-3xl font-serif font-black relative z-10 mt-2 ${
                isCyan ? 'text-[var(--accent-cyan)]' : 
                isRed ? 'text-red-400' :
                'text-white'
            }`}>
                {value}
            </p>
            {sub && <p className="text-xs text-slate-500 font-medium relative z-10">{sub}</p>}
        </div>
    );
}

function SectionCard({ title, children, icon: Icon }: {
    title: string; children: React.ReactNode; icon: React.ElementType;
}) {
    return (
        <div className="card bg-[#0c0c10] border border-white/10 rounded-[32px] p-8 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] flex items-center justify-center border border-[var(--accent-cyan)]/20">
                    <Icon size={20} />
                </div>
                <h3 className="text-lg font-serif font-bold text-white tracking-tight">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function Empty({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 gap-4 opacity-50">
            <Activity size={32} className="text-slate-500" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{text}</p>
        </div>
    );
}

function DonutChart({ data, colors, formatLabel }: {
    data: { name: string; value: number }[]; colors: string[];
    formatLabel?: (v: number) => string;
}) {
    const total = data.reduce((a, d) => a + d.value, 0);
    if (!total) return <Empty text="Sem dados suficientes" />;
    return (
        <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                        paddingAngle={5} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                        {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                    </Pie>
                    <Tooltip
                        contentStyle={{ background: '#0c0c10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        formatter={(v) => [formatLabel ? formatLabel(Number(v)) : `${v}`, '']}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 justify-center mt-2">
                {data.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />
                        <span className="text-xs text-slate-400 font-medium">
                            {d.name} <span className="text-white ml-1 font-bold">{total > 0 ? `${((d.value / total) * 100).toFixed(0)}%` : ''}</span>
                        </span>
                    </div>
                ))}
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
        { icon: DollarSign, label: 'Receita Bruta', value: fmt(totalRevenue), sub: 'Todas entradas do caixa' },
        { icon: TrendingDown, label: 'Despesas Gerais', value: fmt(totalExpenses), isRed: true, sub: 'Todas saídas do caixa' },
        { icon: Award, label: 'Lucro Líquido', value: fmt(lucro), isCyan: true, sub: 'Receita - Despesas' },
        { icon: Percent, label: 'Margem %', value: `${margem.toFixed(2)}%` },
        { icon: Scissors, label: 'Serviços', value: totalServices },
        { icon: Users, label: 'Clientes Únicos', value: data?.topClients.length ?? 0 }
    ];
    const managerKpis = [
        { icon: Scissors, label: 'Serviços Prestados', value: totalServices, isCyan: true },
        { icon: Users, label: 'Clientes Atendidos', value: data?.topClients.length ?? 0 },
        { icon: Award, label: 'Colaboradores Ativos', value: data?.topProfessionals.length ?? 0 },
    ];
    const professionalKpis = [
        { icon: Scissors, label: 'Meus Serviços', value: totalServices, isCyan: true },
        { icon: Users, label: 'Meus Clientes', value: data?.topClients.length ?? 0 },
    ];
    const kpis = isAdmin ? adminKpis : isManager ? managerKpis : professionalKpis;

    const clientsDonut = (data?.topClients ?? []).map(c => ({ name: c.name.split(' ')[0], value: c.spent }));
    const profDonut = (data?.topProfessionals ?? []).map(p => ({ name: p.professional.split(' ')[0], value: p.count }));
    const revenueDonut = [{ name: 'Receita', value: totalRevenue }, { name: 'Despesas', value: totalExpenses }];

    // Análise de Custos
    const expensesBreakdown = [
        { name: 'Comissões', value: commPaid },
        { name: 'Produtos/Materiais', value: matCost },
        { name: 'Outros Custos', value: totalExpenses - (commPaid + matCost) > 0 ? totalExpenses - (commPaid + matCost) : 0 }
    ];

    return (
        <div className="animate-fade-in w-full pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div>
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-white mb-2">
                        {greeting()}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-sm mt-1 text-slate-500">
                        {isAdmin ? 'Visão avançada de performance e finanças' : 'Resumo das suas atividades do mês'}
                    </p>
                </div>
                
                {/* Month Picker */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
                    <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex flex-col items-center justify-center rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-3 px-6 h-10 border-x border-white/5">
                        <CalendarDays size={16} className="text-[var(--accent-cyan)]" />
                        <span className="text-sm font-black uppercase tracking-widest text-white">
                            {MONTHS[month - 1]} {year}
                        </span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="w-10 h-10 flex flex-col items-center justify-center rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="w-10 h-10 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="flex flex-col gap-8">

                    {/* KPI Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
                    </div>

                    {/* Advanced Metrics Admin */}
                    {isAdmin && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <SectionCard title="Fluxo e Custos Analíticos" icon={TrendingDown}>
                                <div className="flex flex-col h-full justify-center pb-8">
                                    <div className="mb-6 flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Lucratividade Real</span>
                                        <span className="text-xl font-mono font-black text-emerald-400">
                                            {totalRevenue ? ((lucro / totalRevenue)*100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                    <DonutChart data={expensesBreakdown} colors={['#8b5cf6', '#d946ef', '#475569']} formatLabel={fmt} />
                                </div>
                            </SectionCard>

                            <SectionCard title="Receita vs Despesa" icon={DollarSign}>
                                <div className="flex flex-col h-full justify-center pb-8">
                                    <DonutChart data={revenueDonut} colors={DONUT_COLORS_2} formatLabel={fmt} />
                                </div>
                            </SectionCard>
                            
                            <SectionCard title="Distribuição de Clientes" icon={Users}>
                                <div className="flex flex-col h-full justify-center pb-8">
                                    <DonutChart data={clientsDonut} colors={DONUT_COLORS_1} formatLabel={fmt} />
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* Gráficos em Lista */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Serviços */}
                        <SectionCard title="Top 5 - Serviços" icon={Scissors}>
                            {!data?.topServices.length ? <Empty text="Sem atendimentos" /> : (
                                <div className="flex flex-col gap-4">
                                    {data.topServices.slice(0, 5).map((s, i) => (
                                        <div key={s.service} className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between uppercase tracking-widest">
                                                <span className="text-xs font-bold text-white">{s.service}</span>
                                                <span className="text-[10px] text-[var(--accent-cyan)] font-black">{s.count} vezes</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-[#0369a1] to-[var(--accent-cyan)] rounded-full"
                                                    style={{ width: `${Math.min(100, (s.count / (data.topServices[0]?.count || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SectionCard>

                        {/* Top Clientes */}
                        <SectionCard title="Consumo por Cliente" icon={Users}>
                            {!data?.topClients.length ? <Empty text="Sem movimentação" /> : (
                                <div className="flex flex-col gap-3">
                                    {data.topClients.slice(0, 5).map((c, i) => (
                                        <div key={c.name} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0c0c10] to-[var(--bg-surface)] border border-white/10 flex items-center justify-center font-serif font-bold text-slate-300">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-white truncate">{c.name}</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-0.5">Top Consumidor</p>
                                            </div>
                                            <p className="font-mono font-black text-emerald-400">
                                                {fmt(c.spent)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    </div>

                    {/* Ranking de Profissionais */}
                    {!isProfessional && data?.topProfessionals && data.topProfessionals.length > 0 && (
                        <SectionCard title="Ranking de Talentos" icon={Briefcase}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                {data.topProfessionals.map((p, i) => (
                                    <div key={p.professional} className={`flex flex-col items-center text-center p-6 rounded-3xl border transition-all ${
                                        i === 0 ? 'bg-gradient-to-b from-[var(--accent-cyan)]/20 to-transparent border-[var(--accent-cyan)]/30' : 
                                        'bg-white/5 border-white/5'
                                    }`}>
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 border ${
                                            i === 0 ? 'bg-[var(--accent-cyan)]/20 border-[var(--accent-cyan)]/40 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 
                                            'bg-[#0c0c10] border-white/10'
                                        }`}>
                                            {i === 0 ? '👑' : i === 1 ? '🌟' : i === 2 ? '🔥' : i + 1}
                                        </div>
                                        <p className="font-bold text-white text-sm tracking-tight mb-2 uppercase min-h-[40px] flex items-center">{p.professional}</p>
                                        
                                        <div className="flex flex-col w-full gap-2 mt-2 pt-4 border-t border-white/5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Volumetria</span>
                                                <span className="font-mono text-xs font-bold text-white">{p.count}</span>
                                            </div>
                                            {isAdmin && p.revenue !== undefined && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Rec. Gerada</span>
                                                    <span className="font-mono text-xs font-bold text-emerald-400">{fmt(p.revenue)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                </div>
            )}
        </div>
    );
}
