'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import {
    ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    TrendingUp, TrendingDown, Wallet, ArrowRight,
    Calendar, LayoutGrid, List, Filter, Search,
    ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    startOfMonth, endOfMonth, startOfYear, endOfYear,
    eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval,
    isWithinInterval, format, startOfToday, subDays,
    addMonths, subMonths, addYears, subYears, isSameMonth, isSameYear,
    startOfWeek, endOfWeek, parseISO, isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- TYPES ---
type ViewMode = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL';

interface Transaction {
    id: string;
    type: string;
    category: string;
    description: string;
    amount: number;
    createdAt: string;
}

interface AggregatedRow {
    id: string;
    label: string;
    startDate: Date;
    initialBalance: number;
    income: number;
    expense: number;
    netResult: number;
    finalBalance: number;
    transactions: Transaction[];
}

export default function CashFlowPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('DAILY');
    const [date, setDate] = useState(new Date());

    const [showAllRows, setShowAllRows] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [initialBalance, setInitialBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    const periodRange = useMemo(() => {
        if (viewMode === 'DAILY' || viewMode === 'WEEKLY') {
            return { start: startOfMonth(date), end: endOfMonth(date) };
        }
        if (viewMode === 'MONTHLY') {
            return { start: startOfYear(date), end: endOfYear(date) };
        }
        // ANNUAL: mostra 5 anos (2 antes, atual, 2 depois)
        return { start: subYears(startOfYear(date), 2), end: addYears(endOfYear(date), 2) };
    }, [viewMode, date]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Busca saldo histórico antes do início do período
            const balanceRes = await api.get(`/finance/summary?endDate=${periodRange.start.toISOString()}`);
            setInitialBalance(balanceRes.data.netBalance || 0);

            // 2. Busca todas as transações do período
            const transRes = await api.get(`/finance/transactions?startDate=${periodRange.start.toISOString()}&endDate=${periodRange.end.toISOString()}`);
            setTransactions(transRes.data);
        } catch (e) {
            console.error('Erro ao buscar dados financeiros:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [periodRange]);

    // --- AGGREGATION ENGINE ---
    const aggregatedData = useMemo(() => {
        let intervals: Date[] = [];
        const { start, end } = periodRange;

        if (viewMode === 'DAILY') intervals = eachDayOfInterval({ start, end });
        else if (viewMode === 'WEEKLY') intervals = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        else if (viewMode === 'MONTHLY') intervals = eachMonthOfInterval({ start, end });
        else if (viewMode === 'ANNUAL') intervals = eachYearOfInterval({ start, end });

        let currentRunningBalance = initialBalance;
        const rows: AggregatedRow[] = [];

        intervals.forEach((intervalStart, idx) => {
            let intervalEnd: Date;
            let label: string;

            if (viewMode === 'DAILY') {
                intervalEnd = new Date(intervalStart.getTime() + 86399999);
                label = format(intervalStart, "dd 'de' MMM", { locale: ptBR });
            } else if (viewMode === 'WEEKLY') {
                intervalEnd = endOfWeek(intervalStart, { weekStartsOn: 1 });
                label = `Semana ${format(intervalStart, 'dd/MM')} - ${format(intervalEnd, 'dd/MM')}`;
            } else if (viewMode === 'MONTHLY') {
                intervalEnd = endOfMonth(intervalStart);
                label = format(intervalStart, 'MMMM yyyy', { locale: ptBR });
            } else {
                intervalEnd = endOfYear(intervalStart);
                label = format(intervalStart, 'yyyy');
            }

            const inPeriod = transactions.filter(t => {
                const tDate = parseISO(t.createdAt);
                return tDate >= intervalStart && tDate <= intervalEnd;
            });

            const income = inPeriod.reduce((acc, t) => (t.type === 'ENTRADA' ? acc + t.amount : acc), 0);
            const expense = inPeriod.reduce((acc, t) => (t.type === 'SAIDA' ? acc + t.amount : acc), 0);
            const netResult = income - expense;
            const startBal = currentRunningBalance;
            currentRunningBalance += netResult;

            // Filtro para não mostrar linhas vazias no futuro se for diário/semanal
            const isFuture = intervalStart > new Date() && (viewMode === 'DAILY' || viewMode === 'WEEKLY');
            if (isFuture && income === 0 && expense === 0) return;

            rows.push({
                id: intervalStart.toISOString(),
                label,
                startDate: intervalStart,
                initialBalance: startBal,
                income,
                expense,
                netResult,
                finalBalance: currentRunningBalance,
                transactions: inPeriod
            });
        });

        return rows.reverse(); // Mais recente primeiro na tabela
    }, [transactions, viewMode, initialBalance, periodRange]);

    const totals = useMemo(() => {
        const income = transactions.reduce((acc, t) => (t.type === 'ENTRADA' ? acc + t.amount : acc), 0);
        const expense = transactions.reduce((acc, t) => (t.type === 'SAIDA' ? acc + t.amount : acc), 0);
        return {
            initial: initialBalance,
            income,
            expense,
            net: income - expense,
            final: initialBalance + (income - expense)
        };
    }, [transactions, initialBalance]);

    const chartData = useMemo(() => {
        return [...aggregatedData].reverse().map(row => ({
            name: row.label.split(' de ')[0], // Compacto para o gráfico
            Receitas: row.income,
            Despesas: row.expense,
        }));
    }, [aggregatedData]);

    const navigate = (dir: number) => {
        if (viewMode === 'DAILY' || viewMode === 'WEEKLY') {
            setDate(dir > 0 ? addMonths(date, 1) : subMonths(date, 1));
        } else if (viewMode === 'MONTHLY') {
            setDate(dir > 0 ? addYears(date, 1) : subYears(date, 1));
        } else {
            setDate(dir > 0 ? addYears(date, 5) : subYears(date, 5));
        }
    };

    // --- VIEW CONFIGURATION ---
    const VIEW_CONFIG = {
        DAILY: {
            title: format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR }),
            subtitle: "Fluxo Diário Consolidado",
            chartLabel: "COMPARATIVO DO DIA"
        },
        WEEKLY: {
            title: `Semana de ${format(startOfWeek(date, { weekStartsOn: 1 }), "d 'de' MMM", { locale: ptBR })}`,
            subtitle: "Resultados Semanais",
            chartLabel: "COMPARATIVO DA SEMANA"
        },
        MONTHLY: {
            title: format(date, 'MMMM yyyy', { locale: ptBR }),
            subtitle: "Performance Mensal",
            chartLabel: "COMPARATIVO DO MÊS"
        },
        ANNUAL: {
            title: "Visão Multianual",
            subtitle: "Performance Anual",
            chartLabel: "COMPARATIVO DO ANO"
        }
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="w-full min-h-screen bg-[#07070a] text-white">
            <div className="max-w-[1280px] mx-auto px-8 py-10 flex flex-col gap-8">

                {/* HEADER & CONTROLS */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">Fluxo de Caixa</h1>
                        <p className="text-white/40 text-xs uppercase font-bold tracking-widest mt-1">{VIEW_CONFIG[viewMode].subtitle}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* VIEW SELECTOR */}
                        <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-2xl p-1.5 gap-2">
                            {[
                                { id: 'DAILY', label: 'Diária' },
                                { id: 'WEEKLY', label: 'Semanal' },
                                { id: 'MONTHLY', label: 'Mensal' },
                                { id: 'ANNUAL', label: 'Anual' }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setViewMode(m.id as ViewMode)}
                                    className={`
                                        px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-300
                                        ${viewMode === m.id
                                            ? 'bg-white text-black shadow-[0_8px_20px_-6px_rgba(255,255,255,0.3)]'
                                            : 'text-white/30 hover:text-white/60 hover:bg-white/5'}
                                    `}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        <button className="bg-[#22c55e] text-black h-11 px-6 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Nova Entrada
                        </button>
                    </div>
                </div>

                {/* PERIOD NAVIGATION */}
                <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                    <button onClick={() => navigate(-1)} className="p-3 hover:bg-white/10 rounded-xl transition-colors text-white/40">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center flex flex-col items-center">
                        <div className="flex items-center gap-2">
                            {isSameDay(date, new Date()) && viewMode === 'DAILY' && (
                                <span className="px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] text-[8px] font-black uppercase rounded-full border border-[#22c55e]/20">HOJE</span>
                            )}
                            <span className="text-lg font-black tracking-tighter text-white/90 first-letter:uppercase">
                                {VIEW_CONFIG[viewMode].title}
                            </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-white/20 tracking-[0.3em]">
                            {VIEW_CONFIG[viewMode].subtitle}
                        </span>
                    </div>
                    <button onClick={() => navigate(1)} className="p-3 hover:bg-white/10 rounded-xl transition-colors text-white/40">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* SUMMARY CARDS (5 Indicators) */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 h-auto">
                    <Card title="Saldo Inicial" value={totals.initial} icon={<Wallet size={16} />} />
                    <Card title="Receitas (+)" value={totals.income} green icon={<TrendingUp size={16} />} />
                    <Card title="Despesas (-)" value={totals.expense} red icon={<TrendingDown size={16} />} />
                    <Card title="Resultado (=)" value={totals.net} highlight icon={<ArrowRight size={16} />} />
                    <Card title="Saldo Final" value={totals.final} fill icon={<LayoutGrid size={16} />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr] gap-8">
                    {/* CHART */}
                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl h-[380px] flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                                {VIEW_CONFIG[viewMode].chartLabel}
                            </h2>
                            <div className="flex gap-4">
                                <LegendItem color="#22c55e" label="ENTRADAS" />
                                <LegendItem color="#ef4444" label="SAÍDAS" />
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#111116', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }} labelStyle={{ color: 'rgba(255,255,255,1)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                                    <Area type="monotone" dataKey="Receitas" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorInc)" />
                                    <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden min-h-[400px]">
                        <div className="p-8 border-b border-white/5 flex flex-col items-center justify-center text-center gap-2 bg-white/[0.01]">
                            <h3 className="text-[16px] font-black uppercase tracking-[0.3em] text-white/90">Detalhes dos Lançamentos</h3>
                            <span className="text-[12px] font-bold text-white/20 uppercase tracking-widest">{aggregatedData.length} registros encontrados</span>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-50">
                                <div className="w-10 h-10 border-4 border-white/5 border-t-white rounded-full animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Processando Balanço...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/[0.01] border-b border-white/5">
                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/30">Período</th>
                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/30">S. Inicial</th>
                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-[#22c55e]/50">Entradas (+)</th>
                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-[#ef4444]/50">Saídas (-)</th>
                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/30">Resultado</th>
                                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white/30">S. Final</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {aggregatedData.slice(0, showAllRows ? undefined : 7).map(row => (
                                                <tr key={row.id} className="hover:bg-white/[0.03] transition-colors group">
                                                    <td className="px-10 py-5">
                                                        <div className="flex flex-col justify-center gap-1.5">
                                                            <p className="text-[14px] font-black text-white leading-none">{row.label}</p>
                                                            <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">{row.transactions.length} transações</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-[12px] font-medium text-white/40">{formatCurrency(row.initialBalance)}</td>
                                                    <td className="px-6 py-5 text-[13px] font-black text-[#22c55e]">{formatCurrency(row.income)}</td>
                                                    <td className="px-6 py-5 text-[13px] font-black text-[#ef4444]">{formatCurrency(row.expense)}</td>
                                                    <td className={`px-6 py-5 text-[13px] font-black ${row.netResult >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                                                        {row.netResult > 0 ? '+' : ''} {formatCurrency(row.netResult)}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`px-3 py-1.5 rounded-lg text-[12px] font-black ${row.finalBalance >= 0 ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#ef4444]/10 text-[#ef4444]'}`}>
                                                            {formatCurrency(row.finalBalance)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {aggregatedData.length > 7 && (
                                    <div className="p-4 border-t border-white/5 flex justify-center bg-white/[0.01]">
                                        <button
                                            onClick={() => setShowAllRows(!showAllRows)}
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all active:scale-[0.98]"
                                        >
                                            {showAllRows ? (
                                                <>Ver menos registros <ChevronUp size={14} /></>
                                            ) : (
                                                <>Ver todos os registros ({aggregatedData.length}) <ChevronDown size={14} /></>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SUBCOMPONENTS ---

function Card({ title, value, green, red, highlight, fill, icon }: { title: string, value: number, green?: boolean, red?: boolean, highlight?: boolean, fill?: boolean, icon?: React.ReactNode }) {
    return (
        <div className={`
            relative overflow-hidden p-8 rounded-3xl border transition-all duration-500 group
            ${fill ? 'bg-white text-black border-white shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'}
            flex flex-col items-center justify-center text-center gap-3 min-h-[180px]
        `}>
            {/* BACKGROUND ICON DECORATION */}
            <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 ${fill ? 'text-black' : 'text-white'}`}>
                {icon ? <div className="scale-[4]">{icon}</div> : null}
            </div>

            <div className="flex flex-col items-center gap-1.5 relative z-10">
                <span className={`text-[13px] font-medium uppercase tracking-[0.15em] ${fill ? 'text-black/50' : 'text-white/40'}`}>
                    {title}
                </span>
                <h3 className={`text-[36px] font-black tracking-tighter leading-none ${fill ? 'text-black' : highlight ? 'text-white' : (value >= 0 && !red) ? 'text-white' : 'text-[#ef4444]'}`}>
                    {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
            </div>

            <div className={`h-1.5 w-10 rounded-full transition-all duration-500 group-hover:w-16 ${fill ? 'bg-black/10' : green ? 'bg-[#22c55e]' : red ? 'bg-[#ef4444]' : 'bg-white/10'}`} />
        </div>
    );
}

function LegendItem({ color, label }: { color: string, label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[8px] font-black text-white/30 tracking-widest">{label}</span>
        </div>
    );
}