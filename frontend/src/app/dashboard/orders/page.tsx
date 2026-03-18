'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ClipboardList, Plus, ShoppingBag, User, DollarSign, X, CheckCircle2, Package, Printer, Edit3, Trash2, PlusCircle, Calendar, ChevronDown, Save, Scissors, AlertCircle, Trash } from 'lucide-react';
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
        <div className="w-full animate-fade-in p-6">
            {/* Header com Filtros */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Comandas</h1>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <ShoppingBag size={14} />
                        <span>{orders.filter(o => o.status === 'OPEN').length} abertas</span>
                        <span className="opacity-20">•</span>
                        <span>Total de {orders.length} registros</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
                    {(['ALL', 'OPEN', 'CLOSED'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                                filter === f 
                                ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' 
                                : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {f === 'ALL' ? 'Todas' : f === 'OPEN' ? 'Abertas' : 'Fechadas'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
                    <p className="text-sm font-medium text-[var(--text-muted)]">Carregando comandas...</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <ClipboardList size={32} className="text-white/20" />
                    </div>
                    <p className="text-[var(--text-muted)] font-medium">
                        {orders.length === 0 ? 'Nenhuma comanda aberta no momento' : 'Nenhuma comanda para o filtro selecionado'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredOrders.map((order) => {
                        const paid = calcPaid(order);
                        const total = calcTotal(order);
                        const isPaid = paid >= total && total > 0;
                        const status = STATUS_MAP[order.status] || { label: order.status, cls: 'badge-gray', color: '#999' };

                        return (
                            <div 
                                key={order.id} 
                                onClick={() => { setSelectedOrder(order); }}
                                className="group relative bg-[#1A1A1A] border border-white/5 hover:border-[var(--primary)]/40 rounded-3xl p-5 transition-all cursor-pointer hover:shadow-2xl hover:shadow-[var(--primary)]/5 flex flex-col gap-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/40">
                                            #{order.id.slice(0, 4)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white/90 truncate max-w-[120px]">{order.client.name}</p>
                                            <p className="text-[10px] text-[var(--text-muted)] font-medium">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.cls}`}>
                                        {status.label}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {order.appointments.slice(0, 2).map((ap) => (
                                        <div key={ap.id} className="flex items-center justify-between text-[11px] text-white/50">
                                            <span>{ap.service.name}</span>
                                            <span className="font-medium text-white/70">R$ {ap.service.price.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {order.appointments.length > 2 && (
                                        <p className="text-[10px] text-[var(--primary)] font-bold">+ {order.appointments.length - 2} itens</p>
                                    )}
                                </div>

                                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tight">Total</span>
                                        <span className="text-lg font-black text-white">R$ {total.toFixed(2)}</span>
                                    </div>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${isPaid ? 'bg-green-500/10 text-green-500' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
                                        {isPaid ? <CheckCircle2 size={18} /> : <DollarSign size={18} />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Detalhes da Comanda */}
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
        </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-[540px] bg-[#121212] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col animate-scale-in max-h-[90vh]">
                
                {/* Header */}
                <div className="px-8 py-7 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-black text-white/90 tracking-tight">Comanda #{currentOrder.id.slice(0, 6)}</h2>
                            <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${STATUS_MAP[currentOrder.status].cls}`}>
                                {STATUS_MAP[currentOrder.status].label}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-[var(--primary)]">{currentOrder.client.name}</p>
                            <span className="w-1 h-1 bg-white/10 rounded-full" />
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => !isClosed && setEditDate(true)}>
                                <p className="text-xs text-white/40 font-medium">{new Date(currentOrder.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                {!isClosed && <Edit3 size={12} className="text-white/20 group-hover:text-[var(--primary)] transition-colors" />}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 transition-all">
                            <Printer size={20} />
                        </button>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Sub-Header / Tabs */}
                {view === 'DETAILS' && (
                    <div className="px-8 py-6 flex flex-col gap-8 flex-1 overflow-y-auto custom-scrollbar">
                        
                        {/* Seção Resumo */}
                        <section>
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Resumo de Itens</h3>
                                {!isClosed && (
                                    <button onClick={() => setView('MANAGE')} className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] hover:opacity-70 transition-all bg-[var(--primary)]/5 px-3 py-1.5 rounded-lg border border-[var(--primary)]/20">
                                        Gerenciar Itens
                                    </button>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/40 font-medium">Quantidade</span>
                                    <span className="font-bold text-white/80">{currentOrder.appointments.length + currentOrder.products.length} itens</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/40 font-medium">Subtotal</span>
                                    <span className="font-bold text-white/80">R$ {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-white/40 font-medium">Descontos</span>
                                    <span className="font-bold text-red-500">- R$ {currentOrder.discount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <span className="text-xs font-black uppercase tracking-widest text-white/30">Valor Total</span>
                                    <span className="text-2xl font-black text-white tracking-tight">R$ {total.toFixed(2)}</span>
                                </div>
                            </div>
                        </section>

                        {/* Seção Pagamentos */}
                        <section>
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Fluxo de Pagamento</h3>
                                {!isClosed && remaining > 0 && (
                                    <button onClick={() => setView('PAYMENT')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500/10 transition-all bg-green-500/5 px-3 py-1.5 rounded-lg border border-green-500/20">
                                        <Plus size={12} /> Lançar Pagamento
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {currentOrder.payments?.length > 0 ? (
                                    currentOrder.payments.map((p: any) => (
                                        <div key={p.id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-4 group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                                    <DollarSign size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white/80">{PAYMENT_METHODS.find(m => m.value === p.method)?.label || p.method}</p>
                                                    <p className="text-[10px] text-white/30 font-medium">Pago em {new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-sm text-white/90">R$ {p.amount.toFixed(2)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 bg-white/[0.01] rounded-2xl border border-dashed border-white/5 flex flex-col items-center justify-center gap-2">
                                        <AlertCircle size={20} className="text-white/10" />
                                        <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Aguardando Pagamento</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {/* View Gerenciar Itens */}
                {view === 'MANAGE' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-8 py-4 bg-white/5 flex items-center gap-4">
                            <button onClick={() => setView('DETAILS')} className="p-2 hover:bg-white/5 rounded-xl text-white/40">
                                <ChevronDown className="rotate-90" size={20} />
                            </button>
                            <h3 className="text-sm font-bold text-white/80">Gerenciar Itens</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
                            
                            {/* Desconto */}
                            <section>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-3">Desconto Manual (R$)</label>
                                <div className="flex gap-3">
                                    <Input 
                                        type="number" 
                                        defaultValue={currentOrder.discount}
                                        onBlur={(e) => handleApplyDiscount(Number(e.target.value))}
                                        className="!h-12 !bg-white/5 !border-white/10"
                                        placeholder="0.00"
                                    />
                                    <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                                        <DollarSign size={20} />
                                    </div>
                                </div>
                            </section>

                            {/* Lista de Itens Atuais */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block">Itens Atuais</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setView('ADD_SERVICE')} className="text-[9px] font-bold text-[var(--primary)] uppercase bg-[var(--primary)]/5 px-2 py-1 rounded-lg">+ Serviço</button>
                                        <button onClick={() => setView('ADD_PRODUCT')} className="text-[9px] font-bold text-green-500 uppercase bg-green-500/5 px-2 py-1 rounded-lg">+ Produto</button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {currentOrder.appointments.map((ap: any) => (
                                        <div key={ap.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <Scissors size={16} className="text-[var(--primary)]" />
                                                <div>
                                                    <p className="text-sm font-bold text-white/90">{ap.service.name}</p>
                                                    <p className="text-[10px] text-white/30">{ap.professional.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-sm">R$ {ap.service.price.toFixed(2)}</span>
                                                {currentOrder.payments.length === 0 && (
                                                    <button onClick={() => handleRemoveItem('SERVICE', ap.id)} className="p-2 hover:bg-red-500/20 text-red-500/40 hover:text-red-500 transition-all rounded-lg">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {currentOrder.products.map((p: any) => (
                                        <div key={p.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <Package size={16} className="text-green-500" />
                                                <div>
                                                    <p className="text-sm font-bold text-white/90">{p.product.name}</p>
                                                    <p className="text-[10px] text-white/30">Quantidade: {p.quantity}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-sm">R$ {(p.unitPrice * p.quantity).toFixed(2)}</span>
                                                {currentOrder.payments.length === 0 && (
                                                    <button onClick={() => handleRemoveItem('PRODUCT', p.id)} className="p-2 hover:bg-red-500/20 text-red-500/40 hover:text-red-500 transition-all rounded-lg">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {/* View Add Service */}
                {view === 'ADD_SERVICE' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-8 py-4 bg-white/5 flex items-center gap-4">
                            <button onClick={() => setView('MANAGE')} className="p-2 hover:bg-white/5 rounded-xl text-white/40">
                                <ChevronDown className="rotate-90" size={20} />
                            </button>
                            <h3 className="text-sm font-bold text-white/80">Adicionar Serviço</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar space-y-4">
                            {services.map((s: any) => (
                                <div key={s.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-[var(--primary)] transition-all flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-white/90">{s.name}</p>
                                        <p className="text-[10px] text-white/30">R$ {s.price.toFixed(2)}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleAddService(s.id, professionals[0]?.id)}
                                        className="btn-primary !px-4 !py-2 !text-[10px] !rounded-lg"
                                    >
                                        Selecionar
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* View Add Product */}
                {view === 'ADD_PRODUCT' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-8 py-4 bg-white/5 flex items-center gap-4">
                            <button onClick={() => setView('MANAGE')} className="p-2 hover:bg-white/5 rounded-xl text-white/40">
                                <ChevronDown className="rotate-90" size={20} />
                            </button>
                            <h3 className="text-sm font-bold text-white/80">Adicionar Produto</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar space-y-4">
                            {products.filter((p:any) => p.stock > 0).map((p: any) => (
                                <div key={p.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-green-500/40 transition-all flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-white/90">{p.name}</p>
                                        <p className="text-[10px] text-white/30">Estoque: {p.stock} • R$ {p.price.toFixed(2)}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleAddProduct(p.id, 1)}
                                        className="!bg-green-500/10 !text-green-500 hover:!bg-green-500/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
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
                    <div className="flex-1 flex flex-col p-8 gap-8 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setView('DETAILS')} className="p-2 hover:bg-white/5 rounded-xl text-white/40">
                                <ChevronDown className="rotate-90" size={20} />
                            </button>
                            <h3 className="text-sm font-bold text-white/80">Lançar Pagamento</h3>
                        </div>

                        <div className="bg-green-500/5 border border-green-500/20 rounded-3xl p-6 flex flex-col items-center justify-center gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-500/50">Restante a Pagar</span>
                            <span className="text-4xl font-black text-green-500 tracking-tight">R$ {remaining.toFixed(2)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {PAYMENT_METHODS.map(m => (
                                <button 
                                    key={m.value}
                                    onClick={() => handleAddPayment(m.value, remaining)}
                                    className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-[var(--primary)] transition-all text-left flex flex-col gap-3 group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-[var(--primary)]/10 flex items-center justify-center transition-colors">
                                        <DollarSign size={18} className="text-white/40 group-hover:text-[var(--primary)]" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-white/60 group-hover:text-white">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Fixo */}
                <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between flex-shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Montante Final Pago</span>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-white">R$ {paid.toFixed(2)}</span>
                            {isClosed && (
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase bg-green-500/10 text-green-500 px-2 py-0.5 rounded-md">
                                    <CheckCircle2 size={12} /> Liquidado
                                </span>
                            )}
                        </div>
                    </div>
                    {(view === 'DETAILS' || view === 'PAYMENT') && remaining > 0 && (
                        <button onClick={() => setView('PAYMENT')} className="btn-primary !px-8 !py-4 !rounded-2xl !text-xs !font-black !uppercase !tracking-[0.2em] shadow-xl shadow-[var(--primary)]/20 animate-pulse-slow">
                            Efetuar Checkout
                        </button>
                    )}
                    {view === 'MANAGE' && (
                         <button onClick={() => setView('DETAILS')} className="btn-primary !px-8 !py-4 !rounded-2xl !text-xs !font-black !uppercase !tracking-[0.2em]">
                            Concluir
                        </button>
                    )}
                </div>

                {/* Edit Date Modal */}
                {editDate && (
                    <div className="absolute inset-0 z-[110] bg-[#121212]/95 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
                        <div className="w-full max-w-[320px] flex flex-col gap-6">
                            <h4 className="text-center font-black uppercase tracking-widest text-white/30">Alterar Data</h4>
                            <Input 
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="!h-14 !text-center !text-lg !font-bold"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setEditDate(false)} className="flex-1 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest">Fechar</button>
                                <button onClick={handleUpdateDate} disabled={saving} className="flex-1 py-4 bg-[var(--primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-white">
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
