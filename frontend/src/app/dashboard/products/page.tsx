'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Package, Plus, X, AlertTriangle, TrendingDown } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number;
    costPrice?: number;
    stock: number;
    minStock: number;
    description?: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', price: '', costPrice: '', stock: '0', minStock: '0', description: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchProducts = () => {
        setLoading(true);
        api.get('/inventory/products')
            .then((r) => setProducts(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleSave = async () => {
        if (!form.name || !form.price) { setError('Nome e preço são obrigatórios'); return; }
        try {
            setSaving(true); setError('');
            await api.post('/inventory/products', {
                name: form.name,
                price: Number(form.price),
                costPrice: form.costPrice ? Number(form.costPrice) : undefined,
                stock: Number(form.stock),
                minStock: Number(form.minStock),
                description: form.description || undefined,
            });
            setForm({ name: '', price: '', costPrice: '', stock: '0', minStock: '0', description: '' });
            setShowForm(false);
            fetchProducts();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Erro ao salvar produto');
        } finally {
            setSaving(false);
        }
    };

    const lowStock = products.filter(p => p.stock <= p.minStock);

    return (
        <div className="animate-fade-in w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Produtos</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{products.length} produtos no estoque</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={() => { setShowForm(true); setError(''); }}>
                    <Plus size={16} /> Novo Produto
                </button>
            </div>

            {/* Alerta de estoque baixo */}
            {lowStock.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                    <p className="text-sm" style={{ color: '#f59e0b' }}>
                        <strong>{lowStock.length}</strong> produto(s) com estoque abaixo do mínimo:
                        {' '}{lowStock.map(p => p.name).join(', ')}
                    </p>
                </div>
            )}

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
                    <div className="card w-full max-w-[480px] animate-fade-in overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-bold">Novo Produto</h2>
                            <button onClick={() => setShowForm(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Nome *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Ex: Shampoo Profissional" className="input-field" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Preço Venda (R$) *</label>
                                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        placeholder="0,00" className="input-field" min="0" step="0.01" />
                                </div>
                                <div>
                                    <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Preço Custo (R$)</label>
                                    <input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                                        placeholder="0,00" className="input-field" min="0" step="0.01" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Estoque Inicial</label>
                                    <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                        className="input-field" min="0" />
                                </div>
                                <div>
                                    <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Estoque Mínimo</label>
                                    <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                                        className="input-field" min="0" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Descrição</label>
                                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Opcional" className="input-field" />
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
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista */}
            {loading ? (
                <div className="flex justify-center py-16"><span className="spinner" style={{ width: 36, height: 36 }} /></div>
            ) : products.length === 0 ? (
                <div className="card flex flex-col items-center py-16 gap-3">
                    <Package size={40} style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Nenhum produto cadastrado</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {products.map((p) => {
                        const isLow = p.stock <= p.minStock;
                        return (
                            <div key={p.id} className="card flex items-center gap-4 py-3 px-4"
                                style={{ borderColor: isLow ? 'rgba(245,158,11,0.3)' : undefined }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: isLow ? 'rgba(245,158,11,0.12)' : 'rgba(124,58,237,0.12)' }}>
                                    {isLow
                                        ? <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                                        : <Package size={18} style={{ color: 'var(--accent-light)' }} />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">{p.name}</p>
                                    {p.description && (
                                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="text-right">
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Preço</p>
                                        <p className="font-bold text-sm" style={{ color: '#22c55e' }}>R$ {p.price.toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Estoque</p>
                                        <p className="font-bold text-sm" style={{ color: isLow ? '#f59e0b' : 'var(--text-primary)' }}>
                                            {p.stock} {isLow && '⚠️'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
