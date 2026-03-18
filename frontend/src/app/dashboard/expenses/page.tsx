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
        <div className="animate-fade-in w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Despesas</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Total: <strong style={{ color: '#ef4444' }}>R$ {(data?.totalExpense ?? 0).toFixed(2)}</strong>
                    </p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={() => { setShowForm(true); setError(''); }}>
                    <Plus size={16} /> Nova Despesa
                </button>
            </div>

            {/* Categorias */}
            {data && Object.keys(data.groupedByCategory).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
                    {Object.entries(data.groupedByCategory).map(([cat, val]) => (
                        <div key={cat} className="card py-3 px-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ background: CATEGORY_COLORS[cat] ?? '#9ca3af' }} />
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    {CATEGORY_LABELS[cat] ?? cat}
                                </span>
                            </div>
                            <p className="font-bold" style={{ color: CATEGORY_COLORS[cat] ?? '#9ca3af' }}>
                                R$ {val.toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
                    <div className="card w-full max-w-[440px] animate-fade-in">
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

            {/* Lista */}
            {loading ? (
                <div className="flex justify-center py-16"><span className="spinner" style={{ width: 36, height: 36 }} /></div>
            ) : (data?.expenses ?? []).length === 0 ? (
                <div className="card flex flex-col items-center py-16 gap-3">
                    <TrendingDown size={40} style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Nenhuma despesa registrada</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {data?.expenses.map((exp) => (
                        <div key={exp.id} className="card flex items-center gap-4 py-3 px-4">
                            <div className="w-3 h-8 rounded-full shrink-0"
                                style={{ background: CATEGORY_COLORS[exp.category] ?? '#9ca3af' }} />
                            <div className="flex-1">
                                <p className="text-sm font-semibold">
                                    {CATEGORY_LABELS[exp.category] ?? exp.category}
                                </p>
                                {exp.description && (
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{exp.description}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="font-bold" style={{ color: '#ef4444' }}>R$ {exp.amount.toFixed(2)}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {new Date(exp.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
