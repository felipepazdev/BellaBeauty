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
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ 
        name: '', 
        price: '', 
        costPrice: '', 
        stock: '0', 
        minStock: '0', 
        description: '' 
    });

    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [productDetails, setProductDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    // Movimentação
    const [movType, setMovType] = useState<'IN'|'OUT'>('IN');
    const [movQuantity, setMovQuantity] = useState('1');
    const [movReason, setMovReason] = useState('ADJUSTMENT');
    const [movSaving, setMovSaving] = useState(false);

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

    const fetchProductDetails = async (id: string) => {
        setLoadingDetails(true);
        try {
            const res = await api.get(`/inventory/products/${id}`);
            setProductDetails(res.data);
        } catch(e) {
            console.error(e);
        } finally {
            setLoadingDetails(false);
        }
    }

    const openProductDetails = (product: any) => {
        setSelectedProduct(product);
        setMovQuantity('1');
        setMovType('IN');
        setMovReason('ADJUSTMENT');
        fetchProductDetails(product.id);
    }

    const handleMovement = async () => {
        if(!selectedProduct || !movQuantity || Number(movQuantity) <= 0) return;
        setMovSaving(true);
        try {
            await api.post(`/inventory/products/${selectedProduct.id}/movement`, {
                type: movType,
                quantity: Number(movQuantity),
                reason: movReason
            });
            setMovQuantity('1');
            fetchProductDetails(selectedProduct.id);
            fetchProducts();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Erro ao registrar movimentação');
        } finally {
            setMovSaving(false);
        }
    }

    const lowStock = products.filter(p => p.stock <= p.minStock);

    const translateReason = (reason: string) => {
        const map: any = { 'PURCHASE': 'Compra', 'SALE': 'Venda', 'LOSS': 'Perda / Avaria', 'ADJUSTMENT': 'Ajuste Manual', 'SERVICE_USE': 'Uso Interno' };
        return map[reason] || reason;
    }

    const totalStats = products.reduce((acc, curr) => acc + (curr.costPrice || 0) * curr.stock, 0);

    return (
        <>
        <div className="animate-opacity-in w-full pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div>
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-white mb-2">Estoque</h1>
                    <p className="text-sm mt-1 text-slate-500">
                        {products.length} produtos totais • R$ {totalStats.toLocaleString('pt-BR', {minimumFractionDigits: 2})} imobilizados
                    </p>
                </div>
                <button className="btn-cyan h-14 px-8 shadow-[var(--accent-cyan-glow)]" onClick={() => { setShowForm(true); setError(''); }}>
                    <Plus size={18} /> Novo Produto
                </button>
            </div>

            {/* Alerta de estoque baixo */}
            {lowStock.length > 0 && (
                <div className="flex items-center gap-4 p-5 rounded-2xl mb-8 border border-red-500/20 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                    <div>
                        <h4 className="font-bold text-red-500 text-sm">Alerta de Reposição</h4>
                        <p className="text-sm mt-1 text-red-400/80">
                            <strong>{lowStock.length}</strong> produto(s) abaixo do nível ideal de segurança.
                        </p>
                    </div>
                </div>
            )}

            {/* Lista */}
            {loading ? (
                <div className="flex justify-center py-20"><span className="w-10 h-10 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" /></div>
            ) : products.length === 0 ? (
                <div className="card flex flex-col items-center py-24 gap-4 border-dashed border-white/10">
                    <Package size={48} className="text-slate-600" />
                    <p className="text-slate-400 font-serif italic text-lg">
                        Sem produtos no estoque ainda.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {products.map((p) => {
                        const isLow = p.stock <= p.minStock;
                        return (
                            <div 
                                key={p.id} 
                                onClick={() => openProductDetails(p)}
                                className={`card flex items-center p-6 gap-5 bg-white/5 hover:bg-white/10 border transition-all cursor-pointer group/product ${isLow ? 'border-red-500/20 hover:border-red-500/40':'border-white/5 hover:border-[var(--accent-cyan)]/30'}`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${isLow ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-gradient-to-br from-[var(--bg-surface)] to(--bg-card) border-white/10 text-slate-400 group-hover/product:text-[var(--accent-cyan)] group-hover/product:border-[var(--accent-cyan)]/30'}`}>
                                    {isLow ? <AlertTriangle size={24} /> : <Package size={24} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-base text-white tracking-tight">{p.name}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Custo: R$ {p.costPrice?.toFixed(2)||'0.00'}</span>
                                        <div className="w-1 h-1 bg-white/10 rounded-full"/>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Venda: R$ {p.price.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Saldo Atual</p>
                                    <div className="flex items-center gap-2">
                                        {isLow && <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"/>}
                                        <span className={`text-2xl font-mono font-black ${isLow?'text-red-400':'text-white'}`}>{p.stock}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Modal Novo Produto */}
        {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setShowForm(false)}>
                <div className="card w-full max-w-[480px] bg-[#0c0c10] border border-white/10 rounded-[32px] p-8 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-serif font-bold text-white">Novo Produto</h2>
                        <button onClick={() => setShowForm(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex flex-col gap-5">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Nome *</label>
                            <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Ex: Tonalizante Wella" className="h-14 w-full bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:border-[var(--accent-cyan)]/50 transition-all outline-none font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Custo (R$)</label>
                                <input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                                    placeholder="0.00" className="h-14 w-full bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:border-[var(--accent-cyan)]/50 transition-all outline-none font-bold font-mono" min="0" step="0.01" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Preço Venda *</label>
                                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    placeholder="0.00" className="h-14 w-full bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:border-[var(--accent-cyan)]/50 transition-all outline-none font-bold font-mono" min="0" step="0.01" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Estoque Inicial</label>
                                <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                    className="h-14 w-full bg-white/5 border border-[var(--accent-cyan)]/20 shadow-[inset_0_0_15px_rgba(6,182,212,0.05)] rounded-2xl px-5 text-[var(--accent-cyan)] focus:border-[var(--accent-cyan)] transition-all outline-none font-bold font-mono" min="0" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black justify-between flex items-center text-slate-500 uppercase tracking-widest ml-1 mb-2">Estoque Min. (Alerta)</label>
                                <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                                    className="h-14 w-full bg-white/5 border border-red-500/20 shadow-[inset_0_0_15px_rgba(239,68,68,0.05)] rounded-2xl px-5 text-red-400 focus:border-red-500/50 transition-all outline-none font-bold font-mono" min="0" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Descrição (Opcional)</label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="h-24 py-4 resize-none w-full bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:border-[var(--accent-cyan)]/50 transition-all outline-none font-bold" />
                        </div>
                        {error && <p className="text-xs text-red-500 font-bold uppercase tracking-tight">{error}</p>}
                        <div className="flex gap-3 mt-4 pt-6 border-t border-white/5">
                            <button onClick={() => setShowForm(false)}
                                className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                Cancelar
                            </button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 h-14 btn-cyan shadow-[var(--accent-cyan-glow)]">
                                {saving ? 'Salvando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Ficha do Produto (Histórico de Movimento) */}
        {selectedProduct && (
             <div className="fixed inset-0 z-50 flex items-center justify-end p-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedProduct(null)}>
                <div className="w-full max-w-[500px] h-full bg-[#0c0c10] border-l border-white/10 flex flex-col transform transition-transform animate-slide-left shadow-2xl" onClick={e => e.stopPropagation()}>
                    
                    {/* Header Perfil */}
                    <div className="p-8 border-b border-white/5 relative shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-cyan)] text-2xl shadow-[var(--accent-cyan-glow)]">
                                <Package size={28}/>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Custo / Venda</p>
                                <p className="font-mono text-sm text-slate-300">
                                    R$ {selectedProduct.costPrice?.toFixed(2)||'0.00'} <span className="text-slate-600 mx-1">/</span> <span className="text-emerald-400 font-bold">R$ {selectedProduct.price.toFixed(2)}</span>
                                </p>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-white mb-2">{selectedProduct.name}</h2>
                            {selectedProduct.description && <p className="text-sm font-medium text-slate-500">{selectedProduct.description}</p>}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <div className="flex-1 p-4 rounded-2xl bg-[var(--accent-cyan)]/5 border border-[var(--accent-cyan)]/20 flex flex-col items-center">
                                <span className="text-[10px] font-black text-[var(--accent-cyan)] uppercase tracking-widest mb-1">Atual</span>
                                <span className="text-3xl font-mono font-black text-white">{productDetails?.stock ?? selectedProduct.stock}</span>
                            </div>
                            <div className="flex-1 p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex flex-col items-center">
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Segurança</span>
                                <span className="text-3xl font-mono font-black text-red-400">{selectedProduct.minStock}</span>
                            </div>
                        </div>
                    </div>

                    {/* Corpo */}
                    <div className="flex-1 overflow-y-auto p-8 relative flex flex-col">
                        {/* Form de movimentação */}
                        <div className="shrink-0 mb-8 p-5 rounded-2xl bg-white/5 border border-white/5">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Lançar Movimentação</h4>
                            <div className="flex gap-3 mb-4">
                                <button onClick={() => setMovType('IN')} className={`flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${movType==='IN'?'bg-emerald-500/10 border-emerald-500/30 text-emerald-400':'bg-transparent border-white/5 text-slate-500'}`}>Entrada</button>
                                <button onClick={() => setMovType('OUT')} className={`flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${movType==='OUT'?'bg-red-500/10 border-red-500/30 text-red-400':'bg-transparent border-white/5 text-slate-500'}`}>Saída</button>
                            </div>
                            <div className="flex gap-3 mb-4">
                                <div className="w-1/3">
                                    <input type="number" min="1" value={movQuantity} onChange={e=>setMovQuantity(e.target.value)} className="h-12 w-full bg-black/20 border border-white/10 rounded-xl text-center text-white font-mono font-bold outline-none" />
                                </div>
                                <div className="flex-1">
                                    <select value={movReason} onChange={e=>setMovReason(e.target.value)} className="h-12 w-full bg-black/20 border border-white/10 rounded-xl px-4 text-slate-300 font-bold outline-none appearance-none text-xs uppercase tracking-widest">
                                        {movType==='IN' ? (
                                            <>
                                                <option value="PURCHASE">Registro de Compra</option>
                                                <option value="ADJUSTMENT">Ajuste Positivo</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="SERVICE_USE">Uso no Lavatório / Serviços</option>
                                                <option value="SALE">Venda Avulsa</option>
                                                <option value="LOSS">Perda / Avaria / Vencido</option>
                                                <option value="ADJUSTMENT">Ajuste Negativo</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleMovement} disabled={movSaving} className="w-full h-12 btn-cyan !text-xs !shadow-none opacity-90">
                                {movSaving ? 'Registrando...' : 'Confirmar Lançamento'}
                            </button>
                        </div>

                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 shrink-0">Últimas 20 movimentações</h4>
                        
                        <div className="flex-1 space-y-3">
                            {loadingDetails ? (
                                <div className="flex justify-center p-10"><span className="w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" /></div>
                            ) : (!productDetails?.stockMovements || productDetails.stockMovements.length === 0) ? (
                                <p className="text-sm text-slate-500 italic text-center mt-10">Nenhuma movimentação registrada.</p>
                            ) : (
                                productDetails.stockMovements.map((mov: any) => (
                                    <div key={mov.id} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${mov.type==='IN'?'bg-emerald-500/10 text-emerald-400':'bg-red-500/10 text-red-400'}`}>
                                                {mov.type==='IN'?'+':'-'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-wider text-slate-300">{translateReason(mov.reason)}</p>
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(mov.createdAt).toLocaleString('pt-BR')}</p>
                                            </div>
                                        </div>
                                        <span className={`text-lg font-mono font-black ${mov.type==='IN'?'text-emerald-400':'text-red-400'}`}>
                                            {mov.quantity}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
