'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
    BarChart2, TrendingUp, TrendingDown, DollarSign, Scissors, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface MonthlyReport {
    period: string;
    summary: {
        totalIncome: number;
        totalExpense: number;
        totalCommissionsPaid: number;
        realProfit: number;
        profitMarginPercent: number;
    };
    expensesByCategory: Record<string, number>;
    servicesStats: Record<string, { count: number; revenue: number }>;
    dailyCashFlow: { date: string; income: number; expense: number; balance: number }[];
}

const COLORS = ['#7c3aed', '#38bdf8', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa'];
const CAT_LABELS: Record<string, string> = {
    RENT: 'Aluguel', MATERIAL: 'Materiais', SALARY: 'Salários',
    PRO_LABORE: 'Pró-labore', PRODUCT: 'Produtos', OTHER: 'Outros',
    SERVICE: 'Serviços', COMANDA: 'Comandas', REMUNERACAO: 'Remunerações',
    DESPESA: 'Despesas Gerais', SANGRIA: 'Sangria de Caixa', MANUAL: 'Lançamentos Manuais',
};

export default function ReportsPage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [data, setData] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    useEffect(() => {
        setLoading(true);
        api.get(`/finance/report/monthly?year=${year}&month=${month}`)
            .then((r) => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [year, month]);

    const changeMonth = (dir: number) => {
        let m = month + dir; let y = year;
        if (m > 12) { m = 1; y++; }
        if (m < 1) { m = 12; y--; }
        setMonth(m); setYear(y);
    };

    const pieData = Object.entries(data?.expensesByCategory ?? {}).map(([k, v]) => ({
        name: CAT_LABELS[k] ?? k, value: v
    }));

    const servicesData = Object.entries(data?.servicesStats ?? {}).map(([k, v]) => ({
        servico: k, Atendimentos: v.count, Faturado: v.revenue
    })).sort((a, b) => b.Atendimentos - a.Atendimentos).slice(0, 8);

    return (
        <div className="animate-fade-in w-full">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Relatório Financeiro</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Visão consolidada do período</p>
            </div>

            {/* Navegador */}
            <div className="card mb-6 flex items-center gap-4">
                <button onClick={() => changeMonth(-1)} className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <ChevronLeft size={18} />
                </button>
                <p className="flex-1 text-center font-semibold">{MONTHS[month - 1]} {year}</p>
                <button onClick={() => changeMonth(1)} className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <ChevronRight size={18} />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="spinner" style={{ width: 40, height: 40 }} /></div>
            ) : (
                <div className="flex flex-col gap-6">

                    {/* KPIs */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                        {[
                            { label: 'Receita Bruta', val: data?.summary.totalIncome ?? 0, color: '#22c55e', icon: TrendingUp },
                            { label: 'Despesas', val: data?.summary.totalExpense ?? 0, color: '#ef4444', icon: TrendingDown },
                            { label: 'Comissões Pagas', val: data?.summary.totalCommissionsPaid ?? 0, color: '#f59e0b', icon: DollarSign },
                            { label: 'Lucro Real', val: data?.summary.realProfit ?? 0, color: '#a78bfa', icon: BarChart2 },
                        ].map(({ label, val, color, icon: Icon }) => (
                            <div key={label} className="card flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: `${color}18` }}>
                                    <Icon size={20} style={{ color }} />
                                </div>
                                <div>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                                    <p className="font-bold text-lg" style={{ color }}>
                                        R$ {val.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Margem */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold">Margem de Lucro</p>
                            <p className="font-bold" style={{ color: (data?.summary.profitMarginPercent ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                                {(data?.summary.profitMarginPercent ?? 0).toFixed(1)}%
                            </p>
                        </div>
                        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
                            <div className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${Math.min(Math.max(data?.summary.profitMarginPercent ?? 0, 0), 100)}%`,
                                    background: 'linear-gradient(90deg, #7c3aed, #22c55e)'
                                }} />
                        </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                        {/* Despesas por Categoria */}
                        <div className="card">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingDown size={16} style={{ color: '#ef4444' }} />
                                <h2 className="font-semibold text-sm">Despesas por Categoria</h2>
                            </div>
                            {pieData.length === 0 ? (
                                <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Sem despesas no período</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                            outerRadius={90} innerRadius={50} paddingAngle={3}>
                                            {pieData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#f4f4f8' }}
                                            formatter={(v: any) => `R$ ${Number(v).toFixed(2)}`}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Serviços mais realizados */}
                        <div className="card">
                            <div className="flex items-center gap-2 mb-4">
                                <Scissors size={16} style={{ color: 'var(--accent-light)' }} />
                                <h2 className="font-semibold text-sm">Serviços Realizados</h2>
                            </div>
                            {servicesData.length === 0 ? (
                                <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Sem atendimentos no período</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={servicesData} layout="vertical"
                                        margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" horizontal={false} />
                                        <XAxis type="number" tick={{ fill: '#9898b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis dataKey="servico" type="category" tick={{ fill: '#9898b0', fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#f4f4f8' }}
                                        />
                                        <Bar dataKey="Atendimentos" fill="#7c3aed" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
