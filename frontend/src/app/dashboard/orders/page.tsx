'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ClipboardList, Plus, ShoppingBag, User, DollarSign, X, CheckCircle2, Package, Printer, Edit3, Trash2, PlusCircle, Calendar, ChevronDown, Save, Scissors, AlertCircle, Trash, ChevronRight, TrendingDown, CreditCard } from 'lucide-react';
import { FormField, Input, Select, ActionButton } from '@/components/ui/FormField';

interface Order {
    id: string;
    clientId: string;
    status: string;
    totalAmount: number;
    discount: number;
    client: { id: string; name: string };
    appointments: { id: string; service: { id: string; name: string; price: number }; professional: { name: string } }[];
    products: { id: string; quantity: number; unitPrice: number; product: { id: string; name: string } }[];
    payments: { id: string; method: string; amount: number; createdAt: string }[];
    createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string; color: string }> = {
    OPEN: { label: 'Aberta', cls: 'badge-warning', color: '#f59e0b' },
    CLOSED: { label: 'Fechada', cls: 'badge-success', color: '#10b981' },
    CANCELLED: { label: 'Cancelada', cls: 'badge-danger', color: '#ef4444' },
};

const PAYMENT_METHODS = [
    { value: 'PIX', label: 'PIX' },
    { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
    { value: 'DEBIT_CARD', label: 'Cartão de Débito' },
    { value: 'CASH', label: 'Dinheiro' },
];

export default function OrdersPage() {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

    // Manage Items state
    const [allServices, setAllServices] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [allProfessionals, setAllProfessionals] = useState<any[]>([]);
    const [allClients, setAllClients] = useState<any[]>([]);

    const fetchOrders = () => {
        setLoading(true);
        api.get('/orders')
            .then((r) => setOrders(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const fetchMetadata = async () => {
        const [s, p, pr, c] = await Promise.all([
            api.get('/services'),
            api.get('/products'),
            api.get('/professionals'),
            api.get('/clients')
        ]);
        setAllServices(s.data);
        setAllProducts(p.data);
        setAllProfessionals(pr.data);
        setAllClients(c.data);
    };

    useEffect(() => { 
        fetchOrders();
        fetchMetadata();
    }, []);

    const filteredOrders = orders.filter(o => {
        if (filter === 'ALL') return true;
        return o.status === filter;
    });

    const calcSubtotal = (order: Order) => {
        const s = order.appointments.reduce((a, ap) => a + (ap.service?.price ?? 0), 0);
        const p = order.products.reduce((a, pr) => a + (pr.unitPrice * pr.quantity), 0);
        return s + p;
    };

    const calcTotal = (order: Order) => calcSubtotal(order) - order.discount;
    const calcPaid = (order: Order) => order.payments?.reduce((a, p) => a + p.amount, 0) || 0;

    return (
        <>
            <div className="w-full animate-fade-in pb-20">
                {/* ── Header ──────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-3xl font-serif font-bold tracking-tight text-white mb-2">
                            Comandas
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                <ShoppingBag size={12} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{orders.filter(o => o.status === 'OPEN').length} abertas</span>
                            </div>
                            <span className="text-[11px] font-medium text-slate-500 italic">
                                Total de {orders.length} registros no sistema
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md self-start md:self-center">
                        {(['ALL', 'OPEN', 'CLOSED'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                                    filter === f 
                                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/20 active:scale-95' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {f === 'ALL' ? 'Todas' : f === 'OPEN' ? 'Abertas' : 'Fechadas'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Grid de Comandas ─────────────────────────────── */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                        <div className="relative">
                            <div className="w-16 h-16 border-2 border-purple-500/20 rounded-full animate-ping absolute inset-0" />
                            <div className="w-16 h-16 border-2 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin relative z-10" />
                        </div>
                        <p className="text-sm font-serif italic text-slate-500">Sincronizando comandas em tempo real...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="card flex flex-col items-center justify-center py-32 border-dashed border-white/10 opacity-60">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-700">
                            <ClipboardList size={40} strokeWidth={1} />
                        </div>
                        <h3 className="text-lg font-serif font-bold text-slate-300 mb-2">Nenhum registro encontrado</h3>
                        <p className="text-sm text-slate-500 max-w-[300px] text-center">
                            {orders.length === 0 ? 'Não há comandas registradas no sistema.' : 'Nenhuma comanda corresponde ao filtro selecionado.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredOrders.map((order) => {
                            const paid = calcPaid(order);
                            const total = calcTotal(order);
                            const isPaid = paid >= total && total > 0;
                            const status = STATUS_MAP[order.status] || { label: order.status, cls: 'badge-gray', color: '#999' };

                            return (
                                <div 
                                    key={order.id} 
                                    onClick={() => { setSelectedOrder(order); }}
                                    className="card group relative flex flex-col gap-6 cursor-pointer hover:border-purple-500/40 hover:-translate-y-2 transition-all duration-500"
                                >
                                    {/* Glass reflection effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[20px]" />
                                    
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:text-purple-400 transition-colors">
                                                #{order.id.slice(0, 4).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-base text-white capitalize tracking-tight group-hover:translate-x-1 transition-transform">{order.client.name?.toLowerCase()}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                        <div className={`badge ${status.cls === 'badge-warning' ? 'badge-warning' : status.cls === 'badge-success' ? 'badge-success' : 'badge-danger'}`}>
                                            {status.label}
                                        </div>
                                    </div>

                                    {/* Itens List Snapshot */}
                                    <div className="space-y-3 relative z-10 min-h-[60px]">
                                        {order.appointments.slice(0, 2).map((ap) => (
                                            <div key={ap.id} className="flex items-center justify-between text-[11px] group-hover:translate-x-1 transition-transform">
                                                <span className="text-slate-500 font-medium">{ap.service.name}</span>
                                                <span className="font-bold text-white/60 font-mono">R$ {ap.service.price.toFixed(2)}</span>
                                            </div>
                                        ))}
                                        {order.appointments.length > 2 && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-purple-500" />
                                                <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">+ {order.appointments.length - 2} SERVIÇOS</p>
                                            </div>
                                        )}
                                        {order.appointments.length === 0 && order.products.length > 0 && (
                                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">{order.products.length} PRODUTOS REGISTRADOS</p>
                                        )}
                                    </div>

                                    {/* Footer do Card */}
                                    <div className="mt-auto pt-5 border-t border-white/5 flex items-end justify-between relative z-10">
                                        <div>
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-1">Montante Total</span>
                                            <span className="text-2xl font-black text-white tracking-tighter font-serif group-hover:text-purple-400 transition-colors">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isPaid ? 'bg-emerald-500/10 text-emerald-500 animate-pulse' : 'bg-white/5 text-slate-600 group-hover:bg-purple-500/10 group-hover:text-purple-500'}`}>
                                            {isPaid ? <CheckCircle2 size={22} strokeWidth={2.5} /> : <DollarSign size={22} />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Modal Detalhes ───────────────────────── */}
            {selectedOrder && (
                <OrderModal 
                    order={selectedOrder}
                    onClose={() => { setSelectedOrder(null); fetchOrders(); }}
                    onUpdate={fetchOrders}
                    clients={allClients}
                    services={allServices}
                    products={allProducts}
                    professionals={allProfessionals}
                />
            )}
        </>
    );
}

// ─── Componente Modal Principal ──────────────────────────────────────────────
function OrderModal({ order, onClose, onUpdate, clients, services, products, professionals }: any) {
    const [view, setView] = useState<'DETAILS' | 'MANAGE' | 'PAYMENT' | 'ADD_SERVICE' | 'ADD_PRODUCT'>('DETAILS');
    const [saving, setSaving] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Order>(order);

    // Form inputs
    const [editDate, setEditDate] = useState(false);
    const [newDate, setNewDate] = useState(order.createdAt.substring(0, 10));

    // Totais calculados
    const subtotal = currentOrder.appointments.reduce((a, ap) => a + (ap.service?.price ?? 0), 0) + 
                     currentOrder.products.reduce((a, p) => a + (p.unitPrice * p.quantity), 0);
    const total = subtotal - currentOrder.discount;
    const paid = currentOrder.payments?.reduce((a, p) => a + p.amount, 0) || 0;
    const remaining = total - paid;
    const isClosed = currentOrder.status === 'CLOSED';

    const handleUpdateDate = async () => {
        try {
            setSaving(true);
            const res = await api.patch(`/orders/${currentOrder.id}`, { date: newDate });
            setCurrentOrder(prev => ({ ...prev, createdAt: res.data.createdAt }));
            setEditDate(false);
            onUpdate();
        } catch (e) { alert('Erro ao atualizar data'); }
        finally { setSaving(false); }
    };

    const handleAddPayment = async (method: string, amount: number) => {
        try {
            setSaving(true);
            const res = await api.post(`/orders/${currentOrder.id}/checkout`, {
                payments: [{ method, amount }]
            });
            setCurrentOrder(res.data);
            onUpdate();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro ao processar pagamento'); }
        finally { setSaving(false); }
    };

    const handleRemoveItem = async (type: 'SERVICE' | 'PRODUCT', itemId: string) => {
        try {
            if (isClosed) return;
            setSaving(true);
            const endpoint = type === 'SERVICE' 
                ? `/orders/${currentOrder.id}/appointments/${itemId}/remove`
                : `/orders/${currentOrder.id}/products/${itemId}/remove`;
            
            await api.patch(endpoint);
            const res = await api.get(`/orders/${currentOrder.id}`);
            setCurrentOrder(res.data);
            onUpdate();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro ao remover item'); }
        finally { setSaving(false); }
    };

    const handleAddService = async (serviceId: string, profId: string) => {
        try {
            setSaving(true);
            await api.post('/appointments', {
                clientId: currentOrder.client.id,
                serviceId,
                professionalId: profId,
                orderId: currentOrder.id, // Garante que vincula à comanda certa
                date: currentOrder.createdAt,
            });
            const res = await api.get(`/orders/${currentOrder.id}`);
            setCurrentOrder(res.data);
            setView('MANAGE');
            onUpdate();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro ao adicionar serviço'); }
        finally { setSaving(false); }
    };

    const handleAddProduct = async (productId: string, quantity: number) => {
        try {
            setSaving(true);
            await api.post(`/orders/${currentOrder.id}/products`, { productId, quantity });
            const res = await api.get(`/orders/${currentOrder.id}`);
            setCurrentOrder(res.data);
            setView('MANAGE');
            onUpdate();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro ao adicionar produto'); }
        finally { setSaving(false); }
    };

    const handleApplyDiscount = async (val: number) => {
        try {
            setSaving(true);
            const res = await api.post(`/orders/${currentOrder.id}/checkout`, {
                discount: val,
                discountType: 'VALUE'
            });
            setCurrentOrder(res.data);
            onUpdate();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro ao aplicar desconto'); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-[999] grid place-items-center p-4 md:p-8" onClick={onClose}>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in" />
            
            {/* Modal Card */}
            <div className="relative w-full max-w-[620px] bg-[#0c0c10] border border-white/10 rounded-[40px] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] animate-scale-in" 
                 onClick={e => e.stopPropagation()}>
                
                {/* Header Premium */}
                <div className="shrink-0 px-10 py-8 border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-serif font-bold text-white leading-none">
                                Comanda #{currentOrder.id.slice(0, 6).toUpperCase()}
                            </h2>
                            <div className={`badge ${currentOrder.status === 'OPEN' ? 'badge-warning' : currentOrder.status === 'CLOSED' ? 'badge-success' : 'badge-danger'}`}>
                                {STATUS_MAP[currentOrder.status].label}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-purple-400 capitalize">{currentOrder.client.name?.toLowerCase()}</p>
                            <span className="w-1 h-1 bg-white/10 rounded-full" />
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => !isClosed && setEditDate(true)}>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                                    {new Date(currentOrder.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                                {!isClosed && <Edit3 size={12} className="text-slate-600 group-hover:text-purple-400 transition-colors" />}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                            <Printer size={20} />
                        </button>
                        <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Sub-Header / Content Views */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {view === 'DETAILS' && (
                        <div className="p-10 space-y-12">
                            {/* Resumo Financeiro */}
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Resumo da Comanda</h3>
                                    {!isClosed && (
                                        <button onClick={() => setView('MANAGE')} className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-500/20">
                                            Gerenciar Itens
                                        </button>
                                    )}
                                </div>
                                
                                <div className="space-y-4 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium tracking-tight">Qtd. de Itens</span>
                                        <span className="font-bold text-white">{currentOrder.appointments.length + currentOrder.products.length} itens</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium tracking-tight">Subtotal</span>
                                        <span className="font-bold text-white">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium tracking-tight">Descontos Aplicados</span>
                                        <span className="font-bold text-red-500">- R$ {currentOrder.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-5 mt-2 border-t border-white/5">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total a Pagar</span>
                                        <span className="text-3xl font-serif font-bold text-white tracking-tighter">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Fluxo de Pagamento */}
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Pagamentos efetuados</h3>
                                    {!isClosed && remaining > 0 && (
                                        <button onClick={() => setView('PAYMENT')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                                            <PlusCircle size={14} /> Novo Pagamento
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {currentOrder.payments?.length > 0 ? (
                                        currentOrder.payments.map((p: any) => (
                                            <div key={p.id} className="flex items-center justify-between p-5 rounded-[24px] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                        <DollarSign size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white uppercase tracking-tight">{PAYMENT_METHODS.find(m => m.value === p.method)?.label || p.method}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Liquidado em {new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                                                    </div>
                                                </div>
                                                <span className="text-lg font-bold text-white font-mono">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 bg-white/[0.01] rounded-[24px] border border-dashed border-white/5 flex flex-col items-center justify-center gap-3">
                                            <AlertCircle size={24} className="text-slate-800" />
                                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-600">Aguardando Pagamento</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* View Gerenciar Itens */}
                    {view === 'MANAGE' && (
                        <div className="p-10 space-y-10 animate-fade-in">
                            <div className="flex items-center gap-4 mb-2">
                                <button onClick={() => setView('DETAILS')} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                                    <ChevronRight size={20} className="rotate-180" />
                                </button>
                                <h3 className="text-lg font-bold text-white">Configurar Itens</h3>
                            </div>
                            
                            {/* Desconto */}
                            <section>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3 ml-1">Desconto Manual (R$)</label>
                                <div className="flex gap-4">
                                    <div className="relative flex-1">
                                        <Input 
                                            type="number" 
                                            defaultValue={currentOrder.discount}
                                            onBlur={(e) => handleApplyDiscount(Number(e.target.value))}
                                            className="!h-14 !bg-white/5 !border-white/10 !rounded-2xl !pl-12 font-bold !text-lg"
                                            placeholder="0.00"
                                        />
                                        <DollarSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" />
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                        <TrendingDown size={24} />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center justify-between mb-4 ml-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block underline underline-offset-4 decoration-purple-500/50">Itens Atuais na Comanda</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setView('ADD_SERVICE')} className="flex items-center gap-1.5 text-[9px] font-black text-purple-400 uppercase bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/10 hover:bg-purple-500/20 transition-all">+ Serviço</button>
                                        <button onClick={() => setView('ADD_PRODUCT')} className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/10 hover:bg-emerald-500/20 transition-all">+ Produto</button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {currentOrder.appointments.map((ap: any) => (
                                        <div key={ap.id} className="group flex items-center justify-between bg-white/[0.03] border border-white/5 p-5 rounded-[24px] hover:border-purple-500/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                                    <Scissors size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white capitalize">{ap.service.name?.toLowerCase()}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{ap.professional.name?.toLowerCase()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-5">
                                                <span className="font-bold text-sm font-mono text-white/80">R$ {ap.service.price.toFixed(2)}</span>
                                                {!isClosed && (
                                                    <button onClick={() => handleRemoveItem('SERVICE', ap.id)} className="w-10 h-10 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500/40 hover:text-red-500 transition-all flex items-center justify-center">
                                                        <Trash2 size={16} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {currentOrder.products.map((p: any) => (
                                        <div key={p.id} className="group flex items-center justify-between bg-white/[0.03] border border-white/5 p-5 rounded-[24px] hover:border-emerald-500/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white capitalize">{p.product.name?.toLowerCase()}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Quantidade: {p.quantity}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-5">
                                                <span className="font-bold text-sm font-mono text-white/80">R$ {(p.unitPrice * p.quantity).toFixed(2)}</span>
                                                {!isClosed && (
                                                    <button onClick={() => handleRemoveItem('PRODUCT', p.id)} className="w-10 h-10 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500/40 hover:text-red-500 transition-all flex items-center justify-center">
                                                        <Trash2 size={16} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* View Add Service */}
                    {(view === 'ADD_SERVICE' || view === 'ADD_PRODUCT') && (
                         <div className="p-10 space-y-8 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setView('MANAGE')} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                                    <ChevronRight size={20} className="rotate-180" />
                                </button>
                                <h3 className="text-lg font-bold text-white">Adicionar {view === 'ADD_SERVICE' ? 'Serviço' : 'Produto'}</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {(view === 'ADD_SERVICE' ? services : products.filter((p:any) => p.stock > 0)).map((s: any) => (
                                    <div key={s.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-[24px] hover:border-purple-500/20 transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${view === 'ADD_SERVICE' ? 'bg-purple-500/10 text-purple-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                {view === 'ADD_SERVICE' ? <Scissors size={18} /> : <Package size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white capitalize">{s.name?.toLowerCase()}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{view === 'ADD_PRODUCT' ? `Estoque: ${s.stock} • ` : ''}R$ {s.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => view === 'ADD_SERVICE' ? handleAddService(s.id, professionals[0]?.id) : handleAddProduct(s.id, 1)}
                                            className={`h-10 px-5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95
                                                ${view === 'ADD_SERVICE' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'}`}
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                ))}
                            </div>
                         </div>
                    )}

                    {/* View Payment */}
                    {view === 'PAYMENT' && (
                        <div className="p-10 space-y-10 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setView('DETAILS')} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                                    <ChevronRight size={20} className="rotate-180" />
                                </button>
                                <h3 className="text-lg font-bold text-white">Consolidação de Pagamento</h3>
                            </div>

                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] py-10 flex flex-col items-center justify-center gap-2">
                                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500/50">Restante pendente</span>
                                <span className="text-5xl font-serif font-black text-emerald-500 tracking-tighter">R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {PAYMENT_METHODS.map(m => (
                                    <button 
                                        key={m.value}
                                        onClick={() => handleAddPayment(m.value, remaining)}
                                        className="relative group overflow-hidden p-6 rounded-[28px] bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all text-left flex flex-col gap-4"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 group-hover:opacity-20 transition-all duration-700">
                                            <div className="w-12 h-12 rounded-full border-2 border-emerald-500" />
                                        </div>
                                        
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-emerald-500/10 flex items-center justify-center transition-colors">
                                            <CreditCard size={20} className="text-slate-600 group-hover:text-emerald-500" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">{m.label}</span>
                                            <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Liquidação imediata</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Fixo Premium */}
                <div className="shrink-0 px-10 py-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1">Montante total pago</span>
                        <div className="flex items-center gap-4">
                            <span className="text-3xl font-serif font-bold text-white tracking-tighter">R$ {paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            {isClosed && (
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl border border-emerald-500/10">
                                    <CheckCircle2 size={14} strokeWidth={2.5} /> Liquidado
                                </div>
                            )}
                        </div>
                    </div>
                    {(view === 'DETAILS' || view === 'PAYMENT') && remaining > 0 && (
                        <button onClick={() => setView('PAYMENT')} className="h-16 px-10 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-[24px] shadow-2xl shadow-purple-600/20 active:scale-95 transition-all animate-pulse-slow">
                            Efetuar Checkout
                        </button>
                    )}
                    {view !== 'DETAILS' && (
                         <button onClick={() => setView('DETAILS')} className="h-16 px-10 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-[0.2em] rounded-[24px] border border-white/5 active:scale-95 transition-all">
                            Retornar
                        </button>
                    )}
                </div>

                {/* Sub-modal de Data */}
                {editDate && (
                    <div className="absolute inset-0 z-[110] bg-[#060608]/95 backdrop-blur-md flex items-center justify-center p-10 animate-fade-in shadow-2xl">
                        <div className="w-full max-w-[360px] flex flex-col gap-8">
                            <div className="text-center">
                                <h4 className="text-xl font-serif font-bold text-white mb-2">Ajustar Data</h4>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Altere o registro cronológico</p>
                            </div>
                            
                            <Input 
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="!h-16 !text-xl !font-bold !bg-white/5 !border-white/10 !rounded-[24px] text-center"
                            />
                            
                            <div className="flex gap-4">
                                <button onClick={() => setEditDate(false)} className="flex-1 h-14 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Cancelar</button>
                                <button onClick={handleUpdateDate} disabled={saving} className="flex-1 h-14 bg-purple-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-600/20 transition-all active:scale-95">
                                    {saving ? '...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
