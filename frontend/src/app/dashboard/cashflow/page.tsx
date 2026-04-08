'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import {
    ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    TrendingUp, TrendingDown, Wallet, ArrowRight,
    LayoutGrid
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    startOfMonth, endOfMonth, startOfYear, endOfYear,
    startOfDay, endOfDay,
    eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval,
    format,
    addDays, subDays, addWeeks, subWeeks,
    addMonths, subMonths, addYears, subYears,
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
        if (viewMode === 'DAILY') {
            return { start: startOfDay(date), end: endOfDay(date) };
        }
        if (viewMode === 'WEEKLY') {
            return {
                start: startOfWeek(date, { weekStartsOn: 1 }),
                end: endOfWeek(date, { weekStartsOn: 1 })
            };
        }
        if (viewMode === 'MONTHLY') {
            return { start: startOfMonth(date), end: endOfMonth(date) };
        }
        // ANNUAL
        return { start: startOfYear(date), end: endOfYear(date) };
    }, [viewMode, date]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const balanceRes = await api.get(`/finance/summary?endDate=${periodRange.start.toISOString()}`);
            setInitialBalance(balanceRes.data.netBalance || 0);

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

        intervals.forEach((intervalStart) => {
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

            const income = inPeriod.reduce((acc, t) => {
                const tp = t.type?.toUpperCase();
                return (tp === 'ENTRADA' || tp === 'INCOME' || tp === 'RECEITA') ? acc + t.amount : acc;
            }, 0);
            const expense = inPeriod.reduce((acc, t) => {
                const tp = t.type?.toUpperCase();
                return (tp === 'SAIDA' || tp === 'EXPENSE' || tp === 'DESPESA') ? acc + t.amount : acc;
            }, 0);
            const netResult = income - expense;
            const startBal = currentRunningBalance;
            currentRunningBalance += netResult;

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

        return rows.reverse();
    }, [transactions, viewMode, initialBalance, periodRange]);

    const totals = useMemo(() => {
        const income = transactions.reduce((acc, t) => {
            const tp = t.type?.toUpperCase();
            return (tp === 'ENTRADA' || tp === 'INCOME' || tp === 'RECEITA') ? acc + t.amount : acc;
        }, 0);
        const expense = transactions.reduce((acc, t) => {
            const tp = t.type?.toUpperCase();
            return (tp === 'SAIDA' || tp === 'EXPENSE' || tp === 'DESPESA') ? acc + t.amount : acc;
        }, 0);
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
            name: row.label.split(' de ')[0],
            Receitas: row.income,
            Despesas: row.expense,
        }));
    }, [aggregatedData]);

    const navigatePeriod = (direction: 'next' | 'prev', mode: ViewMode) => {
        setDate((prev) => {
            if (mode === 'DAILY') {
                return direction === 'next' ? addDays(prev, 1) : subDays(prev, 1);
            } else if (mode === 'WEEKLY') {
                return direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1);
            } else if (mode === 'MONTHLY') {
                return direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1);
            } else {
                return direction === 'next' ? addYears(prev, 1) : subYears(prev, 1);
            }
        });
    };

    const startWeek = startOfWeek(date, { weekStartsOn: 1 });
    const endWeek = endOfWeek(date, { weekStartsOn: 1 });
    const isSameMonthWeek = startWeek.getMonth() === endWeek.getMonth();
    const weeklyTitle = isSameMonthWeek 
        ? `${format(startWeek, 'dd')} – ${format(endWeek, "dd MMM", { locale: ptBR })}`
        : `${format(startWeek, "dd MMM", { locale: ptBR })} – ${format(endWeek, "dd MMM", { locale: ptBR })}`;

    const VIEW_CONFIG = {
        DAILY: {
            title: format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
            subtitle: "Fluxo Diário Consolidado",
            chartLabel: "COMPARATIVO DIÁRIO"
        },
        WEEKLY: {
            title: weeklyTitle,
            subtitle: "Resultados Semanais",
            chartLabel: "COMPARATIVO SEMANAL"
        },
        MONTHLY: {
            title: format(date, 'MMMM yyyy', { locale: ptBR }),
            subtitle: "Performance Mensal",
            chartLabel: "COMPARATIVO MENSAL"
        },
        ANNUAL: {
            title: format(date, 'yyyy'),
            subtitle: "Performance Anual",
            chartLabel: "COMPARATIVO ANUAL"
        }
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div style={{ width: '100%', background: 'var(--bg-main)', color: 'var(--text-primary)', minHeight: '100%' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* HEADER & CONTROLS */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                            Fluxo de Caixa
                        </h1>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                            {VIEW_CONFIG[viewMode].subtitle}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* VIEW SELECTOR */}
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 6, gap: 4 }}>
                            {[
                                { id: 'DAILY', label: 'Diária' },
                                { id: 'WEEKLY', label: 'Semanal' },
                                { id: 'MONTHLY', label: 'Mensal' },
                                { id: 'ANNUAL', label: 'Anual' }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setViewMode(m.id as ViewMode)}
                                    style={{
                                        padding: '8px 18px',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        borderRadius: 10,
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: viewMode === m.id ? 'var(--accent)' : 'transparent',
                                        color: viewMode === m.id ? '#fff' : 'var(--text-muted)',
                                    }}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        <button className="btn-primary" style={{ height: 42, padding: '0 24px', fontSize: 12 }}>
                            Nova Entrada
                        </button>
                    </div>
                </div>

                {/* PERIOD NAVIGATION */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', padding: '10px 16px', borderRadius: 16, border: '1px solid var(--border)' }}>
                    <button
                        onClick={() => navigatePeriod('prev', viewMode)}
                        style={{ padding: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 10, display: 'flex', alignItems: 'center' }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {isSameDay(date, new Date()) && viewMode === 'DAILY' && (
                                <span style={{ padding: '2px 8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)' }}>
                                    HOJE
                                </span>
                            )}
                            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                {VIEW_CONFIG[viewMode].title}
                            </span>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                            {VIEW_CONFIG[viewMode].subtitle}
                        </span>
                    </div>
                    <button
                        onClick={() => navigatePeriod('next', viewMode)}
                        style={{ padding: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 10, display: 'flex', alignItems: 'center' }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* SUMMARY CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                    <SummaryCard title="Saldo Inicial" value={totals.initial} icon={<Wallet size={18} />} />
                    <SummaryCard title="Receitas (+)" value={totals.income} color="#10b981" icon={<TrendingUp size={18} />} />
                    <SummaryCard title="Despesas (-)" value={totals.expense} color="#ef4444" icon={<TrendingDown size={18} />} />
                    <SummaryCard title="Resultado (=)" value={totals.net} highlight icon={<ArrowRight size={18} />} />
                    <SummaryCard title="Saldo Final" value={totals.final} accent icon={<LayoutGrid size={18} />} />
                </div>

                {/* CHART */}
                <div className="card" style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                            {VIEW_CONFIG[viewMode].chartLabel}
                        </h2>
                        <div style={{ display: 'flex', gap: 20 }}>
                            {[{ color: '#10b981', label: 'ENTRADAS' }, { color: '#ef4444', label: 'SAÍDAS' }].map(l => (
                                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{l.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    labelStyle={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorInc)" />
                                <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TABLE */}
                <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Detalhes dos Lançamentos
                        </h3>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                            {aggregatedData.length} registros encontrados
                        </span>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
                            <div className="spinner" style={{ width: 36, height: 36 }} />
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Processando Balanço...
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                                            {['Período', 'S. Inicial', 'Entradas (+)', 'Saídas (-)', 'Resultado', 'S. Final'].map((h, i) => (
                                                <th key={h} style={{
                                                    padding: '12px 20px',
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.08em',
                                                    color: i === 2 ? '#10b981' : i === 3 ? '#ef4444' : 'var(--text-muted)',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aggregatedData.slice(0, showAllRows ? undefined : 7).map(row => (
                                            <tr
                                                key={row.id}
                                                style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                                                            {row.label}
                                                        </p>
                                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            {row.transactions.length} transações
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
                                                    {formatCurrency(row.initialBalance)}
                                                </td>
                                                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                                                    {formatCurrency(row.income)}
                                                </td>
                                                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
                                                    {formatCurrency(row.expense)}
                                                </td>
                                                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: row.netResult >= 0 ? '#10b981' : '#ef4444' }}>
                                                    {row.netResult > 0 ? '+' : ''}{formatCurrency(row.netResult)}
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: 8,
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        background: row.finalBalance >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                        color: row.finalBalance >= 0 ? '#10b981' : '#ef4444',
                                                    }}>
                                                        {formatCurrency(row.finalBalance)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {aggregatedData.length > 7 && (
                                <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setShowAllRows(!showAllRows)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '8px 20px', borderRadius: 10,
                                            background: 'transparent', border: '1px solid var(--border)',
                                            cursor: 'pointer', fontSize: 11, fontWeight: 700,
                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                            color: 'var(--text-muted)', transition: 'all 0.2s'
                                        }}
                                    >
                                        {showAllRows ? (
                                            <>Ver menos <ChevronUp size={14} /></>
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
    );
}

// --- SUBCOMPONENTS ---

function SummaryCard({ title, value, icon, color, highlight, accent }: {
    title: string;
    value: number;
    icon?: React.ReactNode;
    color?: string;
    highlight?: boolean;
    accent?: boolean;
}) {
    const displayColor = accent
        ? 'var(--accent)'
        : color
        ? color
        : highlight
        ? (value >= 0 ? '#10b981' : '#ef4444')
        : 'var(--text-secondary)';

    return (
        <div className="card" style={{
            display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 22px',
            ...(accent ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent)' } : {})
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${displayColor}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: displayColor, flexShrink: 0
                }}>
                    {icon}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3 }}>
                    {title}
                </span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color: displayColor, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <div style={{ height: 3, borderRadius: 4, background: `${displayColor}30`, width: '100%' }} />
        </div>
    );
}