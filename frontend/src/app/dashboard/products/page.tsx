'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
    Package, Plus, X, AlertTriangle, TrendingDown, 
    Search, Filter, Download, ArrowRight, Activity 
} from 'lucide-react';

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
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
        <main className="min-h-screen p-4 sm:p-8 animate-fade-in bg-[#0a0a0c]">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                <div>
                    <h1 className="text-[32px] font-serif font-black text-white tracking-tight flex items-center gap-3">
                        <Package className="text-[#06b6d4] drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]" size={32} />
                        Controle de Estoque
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic">
                        {products.length} itens cadastrados • Total imobilizado: <span className="text-[#06b6d4] font-bold">R$ {totalStats.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </p>
                </div>
                <button 
                    onClick={() => { setShowForm(true); setError(''); }}
                    className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-8 py-3.5 rounded-2xl font-black text-[14px] flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(6,182,212,0.25)] active:scale-95 uppercase tracking-wider"
                >
                    <Plus size={18} strokeWidth={3} /> NOVO PRODUTO
                </button>
            </div>

            {/* ── Alerta Crítico de Estoque ── */}
            {lowStock.length > 0 && (
                <div className="flex items-center gap-4 p-6 rounded-[28px] mb-10 border border-rose-500/20 bg-rose-500/5 backdrop-blur-md animate-pulse-subtle shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle size={28} className="text-rose-500" />
                    </div>
                    <div>
                        <h4 className="font-black text-rose-500 text-sm uppercase tracking-[0.15em]">Ruptura Detectada</h4>
                        <p className="text-[13px] mt-0.5 text-rose-400 font-medium">
                            Há <strong>{lowStock.length}</strong> itens operando abaixo da margem de segurança.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Filtros ── */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-10">
                <div className="md:col-span-8 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#06b6d4] transition-all" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar produto ou categoria..."
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-[20px] pl-14 pr-6 text-white text-[15px] font-medium placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/20 focus:border-[#06b6d4]/50 transition-all shadow-inner"
                    />
                </div>
                <div className="md:col-span-4 flex gap-4">
                    <button className="flex-1 h-14 bg-white/5 border border-white/10 rounded-[20px] flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-all font-bold text-[13px] uppercase tracking-widest">
                        <Filter size={18} /> Filtros
                    </button>
                    <button className="flex-1 h-14 bg-white/5 border border-white/10 rounded-[20px] flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-all font-bold text-[13px] uppercase tracking-widest">
                        <Download size={18} /> Arquivo
                    </button>
                </div>
            </div>

            {/* ── Grid de Produtos ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-44 bg-white/5 border border-white/10 rounded-[28px] animate-pulse" />
                    ))
                ) : products.length === 0 ? (
                    <div className="col-span-full py-32 bg-white/5 border border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center text-center shadow-inner">
                        <Package size={64} className="text-slate-800 mb-6" />
                        <h3 className="text-white font-bold text-2xl">Prateleiras Vazias</h3>
                        <p className="text-slate-500 mt-2">Inicie o inventário cadastrando seu primeiro produto premium.</p>
                    </div>
                ) : (
                    products.map((p) => {
                        const isLow = p.stock <= p.minStock;
                        return (
                            <div 
                                key={p.id} 
                                onClick={() => openProductDetails(p)}
                                className={`bg-white/[0.03] backdrop-blur-xl border rounded-[28px] p-6 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all cursor-pointer group relative overflow-hidden ${isLow ? 'border-rose-500/20' : 'border-white/10 hover:border-[#06b6d4]/30'}`}
                            >
                                {/* Accent lateral */}
                                <div className={`absolute top-0 right-0 w-1.5 h-full opacity-0 group-hover:opacity-100 transition-all ${isLow ? 'bg-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-[#06b6d4] shadow-[0_0_15px_rgba(6,182,212,0.6)]'}`} />

                                <div className="flex items-start gap-5 mb-6">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 ${isLow ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-gradient-to-br from-slate-800 to-slate-900 border-white/10 text-[#06b6d4] group-hover:scale-105 shadow-2xl'}`}>
                                        {isLow ? <AlertTriangle size={28} /> : <Package size={28} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold text-[18px] group-hover:text-[#06b6d4] transition-colors truncate">{p.name}</h3>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Venda</span>
                                                <span className="text-[14px] font-mono font-bold text-[#06b6d4]">R$ {p.price.toFixed(2)}</span>
                                            </div>
                                            <div className="w-px h-6 bg-white/5" />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Custo</span>
                                                <span className="text-[13px] font-mono font-bold text-slate-500">R$ {p.costPrice?.toFixed(2)||'0.00'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 group-hover:text-white group-hover:bg-[#06b6d4] transition-all">
                                        <ArrowRight size={18} />
                                    </div>
                                </div>

                                <div className="flex items-end justify-between px-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-1">Status Saldo</span>
                                        <span className={`text-[12px] font-black ${isLow ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {isLow ? 'REPOSIÇÃO URGENTE' : 'EM DIA'}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        {isLow && <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                                        <span className={`text-4xl font-serif font-black ${isLow ? 'text-rose-500' : 'text-white'}`}>{p.stock}</span>
                                        <span className="text-slate-600 text-[10px] font-black">UN</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal Cadastro de Produto */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setShowForm(false)} />
                    <div className="relative bg-[#0c0c10] border border-white/10 w-full max-w-[540px] rounded-[32px] overflow-hidden shadow-2xl animate-scale-up">
                        <div className="p-10">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-[26px] font-serif font-black text-white">Novo Produto</h2>
                                <button onClick={() => setShowForm(false)} className="p-2.5 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl text-slate-500 transition-all">
                                    <X size={22} />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 ml-1">Nome Comercial *</label>
                                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="w-full h-13 bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-white focus:outline-none focus:border-[#06b6d4]/50 transition-all font-medium" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 ml-1">Preço de Custo</label>
                                            <input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                                                className="w-full h-13 bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-white focus:outline-none focus:border-[#06b6d4]/50 font-mono" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 ml-1">Preço de Venda *</label>
                                            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                                                className="w-full h-13 bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-white focus:outline-none focus:border-[#06b6d4]/50 font-mono" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 ml-1">Estoque Atual</label>
                                            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                                className="w-full h-13 bg-cyan-500/10 border border-[#06b6d4]/20 rounded-xl py-3 px-5 text-[#06b6d4] font-black font-mono" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-1 ml-1">Mínimo (Segurança)</label>
                                            <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                                                className="w-full h-13 bg-rose-500/10 border border-rose-500/20 rounded-xl py-3 px-5 text-rose-500 font-black font-mono" />
                                        </div>
                                    </div>
                                </div>

                                {error && <p className="text-[11px] font-black text-rose-500 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 uppercase tracking-tight">{error}</p>}

                                <div className="pt-6 flex gap-4">
                                    <button onClick={() => setShowForm(false)} type="button" className="flex-1 h-14 bg-white/5 text-slate-500 py-3 rounded-2xl font-bold hover:bg-white/10 uppercase text-[12px] tracking-widest">Cancelar</button>
                                    <button type="submit" disabled={saving} className="flex-1 h-14 bg-[#06b6d4] text-white py-3 rounded-2xl font-black shadow-lg hover:bg-[#0891b2] transition-all active:scale-95 uppercase text-[12px] tracking-widest">{saving ? 'Gravando...' : 'Salvar Produto'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Gaveta Detalhes e Movimentação */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[110] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedProduct(null)} />
                    <div className="relative w-full max-w-xl bg-[#0c0c10] border-l border-white/10 h-full shadow-2xl animate-sidebar-right flex flex-col">
                        
                        {/* Header Drawer */}
                        <div className="p-10 pb-6 border-b border-white/5 relative shrink-0">
                            <button onClick={() => setSelectedProduct(null)} className="absolute top-8 right-8 w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-rose-500/20 transition-all group">
                                <X size={20} className="group-hover:rotate-90" />
                            </button>
                            
                            <div className="flex items-center justify-between mb-8 pr-14">
                                <div className="w-20 h-20 rounded-[30px] bg-cyan-500/10 flex items-center justify-center text-[#06b6d4] border border-[#06b6d4]/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                                    <Package size={36} strokeWidth={2.5}/>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Precificação</p>
                                    <p className="text-xl font-mono font-black text-white">
                                        R$ {selectedProduct.price.toFixed(2)}
                                    </p>
                                    <p className="text-[11px] text-[#06b6d4] font-bold mt-1">Custo: R$ {selectedProduct.costPrice?.toFixed(2)||'0.00'}</p>
                                </div>
                            </div>
                            <h2 className="text-[32px] font-serif font-black text-white leading-tight">{selectedProduct.name}</h2>
                            <p className="text-slate-500 text-sm mt-2 font-medium">{selectedProduct.description || 'Produto de Linha SASS Premium'}</p>
                        </div>

                        {/* Conteúdo Drawer */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-black/5">
                            {/* Registro de Movimento */}
                            <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-8 shadow-2xl">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-[#06b6d4]/10 flex items-center justify-center text-[#06b6d4]">
                                        <Activity size={20} />
                                    </div>
                                    <h4 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Registrar Atividade</h4>
                                </div>

                                <div className="flex p-1.5 bg-black/40 rounded-2xl mb-6 border border-white/5">
                                    <button onClick={() => setMovType('IN')} className={`flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${movType==='IN'?'bg-[#06b6d4] text-white shadow-lg':'text-slate-600 hover:text-slate-400'}`}>Entrada</button>
                                    <button onClick={() => setMovType('OUT')} className={`flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${movType==='OUT'?'bg-rose-500 text-white shadow-lg':'text-slate-600 hover:text-slate-400'}`}>Saída</button>
                                </div>

                                <div className="grid grid-cols-2 gap-5 mb-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Quantidade</label>
                                        <input type="number" min="1" value={movQuantity} onChange={e=>setMovQuantity(e.target.value)} className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl text-center text-white font-mono text-2xl font-black focus:border-[#06b6d4]/50 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Motivação</label>
                                        <select value={movReason} onChange={e=>setMovReason(e.target.value)} className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-4 text-white font-bold text-[12px] uppercase outline-none focus:border-[#06b6d4]/50 appearance-none">
                                            {movType==='IN' ? (
                                                <>
                                                    <option value="PURCHASE">Compra Técnica</option>
                                                    <option value="ADJUSTMENT">Ajuste de Saldo</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="SERVICE_USE">Uso em Cabine</option>
                                                    <option value="SALE">Venda Balcão</option>
                                                    <option value="LOSS">Perda / Defeito</option>
                                                    <option value="ADJUSTMENT">Retirada Manual</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <button onClick={handleMovement} disabled={movSaving} className="w-full h-15 bg-[#06b6d4] text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-cyan-500/20 active:scale-95 transition-all">
                                    {movSaving ? 'Sincronizando...' : 'Confirmar Lançamento'}
                                </button>
                            </div>

                            {/* Feed de Movimentações */}
                            <div className="space-y-6">
                                <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-1">Log de Movimentações</h3>
                                <div className="space-y-3">
                                    {loadingDetails ? (
                                        <div className="text-center py-10 animate-pulse text-slate-700 text-[10px] font-black uppercase">Rastreando lote...</div>
                                    ) : productDetails?.stockMovements?.map((mov: any) => (
                                        <div key={mov.id} className="bg-white/[0.03] border border-white/5 p-5 rounded-3xl flex items-center justify-between group/mov border-l-4" style={{ borderLeftColor: mov.type==='IN'?'#10b981':'#ef4444' }}>
                                            <div>
                                                <p className="text-white font-bold text-[13px] uppercase tracking-wide group-hover/mov:text-[#06b6d4] transition-colors">{translateReason(mov.reason)}</p>
                                                <p className="text-[10px] text-slate-600 mt-1">{new Date(mov.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xl font-mono font-black ${mov.type==='IN'?'text-emerald-500':'text-rose-500'}`}>
                                                    {mov.type==='IN' ? '+' : '-'}{mov.quantity}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Status */}
                        <div className="p-10 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Saldo Atual</span>
                                <span className={`text-3xl font-serif font-black ${selectedProduct.stock <= selectedProduct.minStock ? 'text-rose-500':'text-white'}`}>
                                    {productDetails?.stock ?? selectedProduct.stock} UN
                                </span>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                                <TrendingDown size={28} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
