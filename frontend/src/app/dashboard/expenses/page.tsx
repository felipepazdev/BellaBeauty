'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { TrendingDown, Plus, X } from 'lucide-react';

interface Expense {
    id: string;
    category: string;
    description?: string;
    amount: number;
    createdAt: string;
}
interface ExpensesData {
    totalExpense: number;
    groupedByCategory: Record<string, number>;
    expenses: Expense[];
}

const CATEGORY_LABELS: Record<string, string> = {
    RENT: 'Aluguel',
    MATERIAL: 'Materiais',
    SALARY: 'Salários',
    PRO_LABORE: 'Pró-labore',
    PRODUCT: 'Produtos',
    OTHER: 'Outros',
    SERVICE: 'Serviço',
};

const CATEGORY_COLORS: Record<string, string> = {
    RENT: '#7c3aed',
    MATERIAL: '#38bdf8',
    SALARY: '#f59e0b',
    PRO_LABORE: '#a78bfa',
    PRODUCT: '#22c55e',
    OTHER: '#9ca3af',
    SERVICE: '#ef4444',
};

export default function ExpensesPage() {
    const [data, setData] = useState<ExpensesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ category: 'RENT', description: '', amount: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchData = () => {
        setLoading(true);
        api.get('/finance/expenses')
            .then((r) => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async () => {
        if (!form.amount || isNaN(Number(form.amount))) { setError('Informe um valor válido'); return; }
        try {
            setSaving(true);
            setError('');
            await api.post('/finance/expense', {
                category: form.category,
                description: form.description || undefined,
                amount: Number(form.amount),
            });
            setForm({ category: 'RENT', description: '', amount: '' });
            setShowForm(false);
            fetchData();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Erro ao registrar despesa');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
        <div className="animate-opacity-in w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-white mb-1">Despesas</h1>
                    <p className="text-[14px] text-white/50 mb-4">Gerencie os custos e gastos administrativos da unidade.</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold text-[14px] rounded-lg hover:bg-white/90 transition-colors shadow-sm" onClick={() => { setShowForm(true); setError(''); }}>
                    <Plus size={16} /> Nova Despesa
                </button>
            </div>

            {/* KPIs */}
            <div className="mb-8 p-6 bg-[#111116] border border-white/5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-[12px] font-semibold tracking-wider uppercase text-white/40 mb-1">Total Registrado</span>
                    <span className="text-[32px] font-bold tracking-tight text-white">
                        R$ {(data?.totalExpense ?? 0).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Categorias */}
            {data && Object.keys(data.groupedByCategory).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {Object.entries(data.groupedByCategory).map(([cat, val]) => (
                        <div key={cat} className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full"
                                    style={{ background: CATEGORY_COLORS[cat] ?? '#9ca3af' }} />
                                <span className="text-[13px] font-medium text-white/60">
                                    {CATEGORY_LABELS[cat] ?? cat}
                                </span>
                            </div>
                            <p className="text-[20px] font-semibold text-white tracking-tight">
                                R$ {val.toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Lista */}
            {loading ? (
                <div className="flex justify-center py-16"><span className="spinner" style={{ width: 32, height: 32, opacity: 0.5 }} /></div>
            ) : (data?.expenses ?? []).length === 0 ? (
                <div className="flex flex-col items-center py-20 gap-3 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <TrendingDown size={32} className="text-white/20" />
                    <p className="text-[14px] text-white/40">Nenhuma despesa registrada</p>
                </div>
            ) : (
                <div className="bg-[#111116] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.02] text-[12px] font-semibold text-white/40 uppercase tracking-wider">
                        <div className="col-span-6 md:col-span-8">Descrição</div>
                        <div className="col-span-3 md:col-span-2 text-right">Data</div>
                        <div className="col-span-3 md:col-span-2 text-right">Valor</div>
                    </div>
                    <div className="flex flex-col">
                        {data?.expenses.map((exp) => (
                            <div key={exp.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors last:border-0">
                                <div className="col-span-6 md:col-span-8 flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                                        style={{ background: CATEGORY_COLORS[exp.category] ?? '#9ca3af' }} />
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-[14px] font-medium text-white truncate">
                                            {CATEGORY_LABELS[exp.category] ?? exp.category}
                                        </p>
                                        <p className="text-[13px] text-white/40 truncate">
                                            {exp.description || 'Sem descrição'}
                                        </p>
                                    </div>
                                </div>
                                <div className="col-span-3 md:col-span-2 text-right">
                                    <span className="text-[13px] text-white/60">
                                        {new Date(exp.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                <div className="col-span-3 md:col-span-2 text-right">
                                    <p className="text-[14px] font-semibold text-white">R$ {exp.amount.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Modal */}
        {showForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
                <div className="card w-full max-w-[440px] max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in z-10 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold">Registrar Despesa</h2>
                        <button onClick={() => setShowForm(false)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="input-field">
                                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Descrição</label>
                            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Ex: Aluguel de fevereiro" className="input-field" />
                        </div>
                        <div>
                            <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Valor (R$)</label>
                            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                placeholder="0,00" className="input-field" min="0" step="0.01" />
                        </div>
                        {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
                        <div className="flex gap-3 mt-1">
                            <button onClick={() => setShowForm(false)}
                                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                Cancelar
                            </button>
                            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                {saving ? <span className="spinner" /> : null}
                                {saving ? 'Salvando...' : 'Registrar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
