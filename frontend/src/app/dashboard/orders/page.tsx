'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
    ClipboardList, Plus, ShoppingBag, User, DollarSign, X,
    CheckCircle2, Package, Printer, Edit3, Trash2, PlusCircle,
    Calendar, ChevronDown, Save, Scissors, AlertCircle, Trash,
    ChevronRight, TrendingDown, CreditCard
} from 'lucide-react';
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
    OPEN: { label: 'Aberta', cls: 'badge-warning', color: '#d97706' },
    CLOSED: { label: 'Fechada', cls: 'badge-success', color: '#059669' },
    CANCELLED: { label: 'Cancelada', cls: 'badge-danger', color: '#dc2626' },
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
            <div className="w-full animate-fade-in pb-12">
                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">
                    <div>
                        <h1 className="text-2xl font-serif font-bold tracking-tight mb-1.5" style={{ color: 'var(--text-primary)' }}>
                            Comandas
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                                style={{
                                    background: 'rgba(217,119,6,0.1)',
                                    border: '1px solid rgba(217,119,6,0.2)',
                                    color: '#d97706'
                                }}>
                                <ShoppingBag size={11} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {orders.filter(o => o.status === 'OPEN').length} abertas
                                </span>
                            </div>
                            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                {orders.length} registros no total
                            </span>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="flex items-center gap-1 p-1 rounded-xl self-start md:self-center"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        {(['ALL', 'OPEN', 'CLOSED'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className="px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-[0.08em] transition-all duration-200"
                                style={filter === f ? {
                                    background: 'var(--accent)',
                                    color: '#fff',
                                    boxShadow: '0 2px 8px var(--accent-glow)',
                                } : {
                                    color: 'var(--text-muted)',
                                }}
                            >
                                {f === 'ALL' ? 'Todas' : f === 'OPEN' ? 'Abertas' : 'Fechadas'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conteúdo */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-4" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
                        <span className="spinner" style={{ width: 36, height: 36 }} />
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando comandas...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="card flex flex-col items-center justify-center" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                            <ClipboardList size={32} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <h3 className="text-base font-serif font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                            Nenhum registro encontrado
                        </h3>
                        <p className="text-sm text-center max-w-[280px]" style={{ color: 'var(--text-muted)' }}>
                            {orders.length === 0
                                ? 'Não há comandas registradas no sistema.'
                                : 'Nenhuma comanda corresponde ao filtro selecionado.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredOrders.map((order) => {
                            const paid = calcPaid(order);
                            const total = calcTotal(order);
                            const isPaid = paid >= total && total > 0;
                            const status = STATUS_MAP[order.status] || { label: order.status, cls: 'badge-gray', color: '#999' };

                            return (
                                <div
                                    key={order.id}
                                    onClick={() => { setSelectedOrder(order); }}
                                    className="card group flex flex-col gap-4 cursor-pointer hover:-translate-y-0.5 transition-all duration-300"
                                    style={{ paddingTop: '1.25rem', paddingBottom: '1.25rem' }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold"
                                                style={{
                                                    background: 'var(--bg-base)',
                                                    border: '1px solid var(--border)',
                                                    color: 'var(--text-muted)',
                                                }}>
                                                #{order.id.slice(0, 4).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm capitalize" style={{ color: 'var(--text-primary)' }}>
                                                    {order.client.name?.toLowerCase()}
                                                </p>
                                                <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`badge ${status.cls}`}>
                                            {status.label}
                                        </div>
                                    </div>

                                    {/* Itens resumidos */}
                                    <div className="space-y-1.5 min-h-[40px]">
                                        {order.appointments.slice(0, 2).map((ap) => (
                                            <div key={ap.id} className="flex items-center justify-between text-[11px]">
                                                <span style={{ color: 'var(--text-secondary)' }}>{ap.service.name}</span>
                                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    R$ {ap.service.price.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                        {order.appointments.length > 2 && (
                                            <p className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>
                                                + {order.appointments.length - 2} serviços
                                            </p>
                                        )}
                                        {order.appointments.length === 0 && order.products.length > 0 && (
                                            <p className="text-[10px] font-bold" style={{ color: '#059669' }}>
                                                {order.products.length} produtos registrados
                                            </p>
                                        )}
                                    </div>

                                    {/* Rodapé do card */}
                                    <div className="pt-3 border-t flex items-end justify-between" style={{ borderColor: 'var(--border)' }}>
                                        <div>
                                            <span className="text-[9px] font-bold uppercase tracking-widest block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                                                Total
                                            </span>
                                            <span className="text-xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
                                                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300`}
                                            style={isPaid ? {
                                                background: 'rgba(5,150,105,0.1)',
                                                color: '#059669',
                                            } : {
                                                background: 'var(--bg-base)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-muted)',
                                            }}>
                                            {isPaid ? <CheckCircle2 size={20} strokeWidth={2} /> : <DollarSign size={20} />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de detalhes */}
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

// ─── Modal Principal ──────────────────────────────────────────────
function OrderModal({ order, onClose, onUpdate, clients, services, products, professionals }: any) {
    const [view, setView] = useState<'DETAILS' | 'MANAGE' | 'PAYMENT' | 'ADD_SERVICE' | 'ADD_PRODUCT'>('DETAILS');
    const [saving, setSaving] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Order>(order);

    const [editDate, setEditDate] = useState(false);
    const [newDate, setNewDate] = useState(order.createdAt.substring(0, 10));

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
                orderId: currentOrder.id,
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
            <div className="fixed inset-0 animate-fade-in"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }} />

            {/* Modal Card */}
            <div
                className="relative w-full max-w-[600px] flex flex-col overflow-hidden animate-scale-in"
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '24px',
                    maxHeight: '90vh',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Cabeçalho do Modal */}
                <div className="shrink-0 px-8 py-6 flex items-center justify-between"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <h2 className="text-xl font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
                                Comanda #{currentOrder.id.slice(0, 6).toUpperCase()}
                            </h2>
                            <div className={`badge ${currentOrder.status === 'OPEN' ? 'badge-warning' : currentOrder.status === 'CLOSED' ? 'badge-success' : 'badge-danger'}`}>
                                {STATUS_MAP[currentOrder.status].label}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold capitalize" style={{ color: 'var(--accent)' }}>
                                {currentOrder.client.name?.toLowerCase()}
                            </p>
                            <span style={{ color: 'var(--border)' }}>·</span>
                            <div
                                className="flex items-center gap-1.5 cursor-pointer group"
                                onClick={() => !isClosed && setEditDate(true)}
                            >
                                <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                    {new Date(currentOrder.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                                {!isClosed && <Edit3 size={11} style={{ color: 'var(--text-muted)' }} />}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                        >
                            <Printer size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Conteúdo do Modal */}
                <div className="flex-1 overflow-y-auto">
                    {view === 'DETAILS' && (
                        <div className="p-8 space-y-8">
                            {/* Resumo Financeiro */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                                        Resumo da Comanda
                                    </h3>
                                    {!isClosed && (
                                        <button
                                            onClick={() => setView('MANAGE')}
                                            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all"
                                            style={{
                                                background: 'rgba(124,58,237,0.08)',
                                                color: 'var(--accent)',
                                                border: '1px solid rgba(124,58,237,0.2)',
                                            }}
                                        >
                                            Gerenciar Itens
                                        </button>
                                    )}
                                </div>

                                <div className="p-5 rounded-2xl space-y-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                                    <div className="flex justify-between items-center text-sm">
                                        <span style={{ color: 'var(--text-secondary)' }}>Qtd. de Itens</span>
                                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {currentOrder.appointments.length + currentOrder.products.length} itens
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span style={{ color: 'var(--text-secondary)' }}>Descontos</span>
                                        <span className="font-semibold" style={{ color: '#dc2626' }}>
                                            - R$ {currentOrder.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
                                            Total a Pagar
                                        </span>
                                        <span className="text-2xl font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
                                            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* Pagamentos */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                                        Pagamentos Efetuados
                                    </h3>
                                    {!isClosed && remaining > 0 && (
                                        <button
                                            onClick={() => setView('PAYMENT')}
                                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all"
                                            style={{
                                                background: 'rgba(5,150,105,0.08)',
                                                color: '#059669',
                                                border: '1px solid rgba(5,150,105,0.2)',
                                            }}
                                        >
                                            <PlusCircle size={13} /> Novo Pagamento
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    {currentOrder.payments?.length > 0 ? (
                                        currentOrder.payments.map((p: any) => (
                                            <div
                                                key={p.id}
                                                className="flex items-center justify-between p-4 rounded-xl"
                                                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                        style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>
                                                        <DollarSign size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                            {PAYMENT_METHODS.find(m => m.value === p.method)?.label || p.method}
                                                        </p>
                                                        <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                                            Liquidado em {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                                                    R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 rounded-xl flex flex-col items-center justify-center gap-2"
                                            style={{ background: 'var(--bg-base)', border: '1px dashed var(--border)' }}>
                                            <AlertCircle size={22} style={{ color: 'var(--text-muted)' }} />
                                            <p className="text-[10px] uppercase font-bold tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                                                Aguardando Pagamento
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* View Gerenciar Itens */}
                    {view === 'MANAGE' && (
                        <div className="p-8 space-y-7 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setView('DETAILS')}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                                >
                                    <ChevronRight size={18} className="rotate-180" />
                                </button>
                                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Gerenciar Itens</h3>
                            </div>

                            {/* Desconto */}
                            <section>
                                <label className="form-label">Desconto (R$)</label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Input
                                            type="number"
                                            defaultValue={currentOrder.discount}
                                            onBlur={(e) => handleApplyDiscount(Number(e.target.value))}
                                            style={{ paddingLeft: '2.75rem' }}
                                            placeholder="0.00"
                                        />
                                        <DollarSign
                                            size={16}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2"
                                            style={{ color: 'var(--text-muted)' }}
                                        />
                                    </div>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: 'var(--accent)' }}>
                                        <TrendingDown size={20} />
                                    </div>
                                </div>
                            </section>

                            {/* Listagem de itens */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="form-label" style={{ marginBottom: 0 }}>Itens da Comanda</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setView('ADD_SERVICE')}
                                            className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                                            style={{ background: 'rgba(124,58,237,0.08)', color: 'var(--accent)', border: '1px solid rgba(124,58,237,0.2)' }}
                                        >
                                            + Serviço
                                        </button>
                                        <button
                                            onClick={() => setView('ADD_PRODUCT')}
                                            className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                                            style={{ background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}
                                        >
                                            + Produto
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {currentOrder.appointments.map((ap: any) => (
                                        <div
                                            key={ap.id}
                                            className="flex items-center justify-between p-4 rounded-xl transition-all"
                                            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                    style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--accent)' }}>
                                                    <Scissors size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                                                        {ap.service.name?.toLowerCase()}
                                                    </p>
                                                    <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                                        {ap.professional.name?.toLowerCase()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    R$ {ap.service.price.toFixed(2)}
                                                </span>
                                                {!isClosed && (
                                                    <button
                                                        onClick={() => handleRemoveItem('SERVICE', ap.id)}
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                                        style={{ color: '#dc2626', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {currentOrder.products.map((p: any) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between p-4 rounded-xl transition-all"
                                            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                    style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>
                                                    <Package size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                                                        {p.product.name?.toLowerCase()}
                                                    </p>
                                                    <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                                        Quantidade: {p.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    R$ {(p.unitPrice * p.quantity).toFixed(2)}
                                                </span>
                                                {!isClosed && (
                                                    <button
                                                        onClick={() => handleRemoveItem('PRODUCT', p.id)}
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                                        style={{ color: '#dc2626', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Adicionar Serviço ou Produto */}
                    {(view === 'ADD_SERVICE' || view === 'ADD_PRODUCT') && (
                        <div className="p-8 space-y-6 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setView('MANAGE')}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                                >
                                    <ChevronRight size={18} className="rotate-180" />
                                </button>
                                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Adicionar {view === 'ADD_SERVICE' ? 'Serviço' : 'Produto'}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {(view === 'ADD_SERVICE' ? services : products.filter((p: any) => p.stock > 0)).map((s: any) => (
                                    <div
                                        key={s.id}
                                        className="p-4 rounded-xl flex items-center justify-between transition-all"
                                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                style={{
                                                    background: view === 'ADD_SERVICE' ? 'rgba(124,58,237,0.1)' : 'rgba(5,150,105,0.1)',
                                                    color: view === 'ADD_SERVICE' ? 'var(--accent)' : '#059669',
                                                }}>
                                                {view === 'ADD_SERVICE' ? <Scissors size={16} /> : <Package size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                                                    {s.name?.toLowerCase()}
                                                </p>
                                                <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                                    {view === 'ADD_PRODUCT' ? `Estoque: ${s.stock} · ` : ''}R$ {s.price.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => view === 'ADD_SERVICE'
                                                ? handleAddService(s.id, professionals[0]?.id)
                                                : handleAddProduct(s.id, 1)}
                                            className="h-9 px-4 text-[11px] font-bold rounded-lg transition-all"
                                            style={view === 'ADD_SERVICE' ? {
                                                background: 'var(--accent)',
                                                color: '#fff',
                                            } : {
                                                background: '#059669',
                                                color: '#fff',
                                            }}
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pagamento */}
                    {view === 'PAYMENT' && (
                        <div className="p-8 space-y-7 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setView('DETAILS')}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                                >
                                    <ChevronRight size={18} className="rotate-180" />
                                </button>
                                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Efetuar Pagamento</h3>
                            </div>

                            <div className="py-8 rounded-2xl flex flex-col items-center justify-center gap-1"
                                style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)' }}>
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: '#059669', opacity: 0.6 }}>
                                    Valor Pendente
                                </span>
                                <span className="text-4xl font-serif font-bold" style={{ color: '#059669' }}>
                                    R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {PAYMENT_METHODS.map(m => (
                                    <button
                                        key={m.value}
                                        onClick={() => handleAddPayment(m.value, remaining)}
                                        className="p-5 rounded-2xl flex flex-col gap-3 text-left transition-all group"
                                        style={{
                                            background: 'var(--bg-base)',
                                            border: '1px solid var(--border)',
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(5,150,105,0.4)';
                                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(5,150,105,0.04)';
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                                            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-base)';
                                        }}
                                    >
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-emerald-50"
                                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                            <CreditCard size={18} />
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>
                                                {m.label}
                                            </span>
                                            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                Liquidação imediata
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Rodapé Fixo */}
                <div
                    className="shrink-0 px-8 py-5 flex items-center justify-between"
                    style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border)' }}
                >
                    <div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                            Total pago
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
                                R$ {paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            {isClosed && (
                                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg"
                                    style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>
                                    <CheckCircle2 size={12} strokeWidth={2.5} /> Liquidado
                                </div>
                            )}
                        </div>
                    </div>
                    {(view === 'DETAILS' || view === 'PAYMENT') && remaining > 0 && (
                        <button
                            onClick={() => setView('PAYMENT')}
                            className="h-12 px-8 rounded-xl font-bold text-sm transition-all active:scale-95"
                            style={{
                                background: 'var(--accent)',
                                color: '#fff',
                                boxShadow: '0 4px 16px var(--accent-glow)',
                            }}
                        >
                            Finalizar Pagamento
                        </button>
                    )}
                    {view !== 'DETAILS' && (
                        <button
                            onClick={() => setView('DETAILS')}
                            className="h-12 px-8 rounded-xl font-bold text-sm transition-all active:scale-95"
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            Voltar
                        </button>
                    )}
                </div>

                {/* Sub-modal de Data */}
                {editDate && (
                    <div className="absolute inset-0 z-[110] flex items-center justify-center p-8 animate-fade-in"
                        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}>
                        <div className="w-full max-w-[340px] flex flex-col gap-6">
                            <div className="text-center">
                                <h4 className="text-xl font-serif font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                    Ajustar Data
                                </h4>
                                <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                    Altere o registro cronológico da comanda
                                </p>
                            </div>

                            <Input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                style={{ height: '3.5rem', fontSize: '1.1rem', fontWeight: 600, textAlign: 'center' }}
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEditDate(false)}
                                    className="flex-1 h-12 rounded-xl text-sm font-bold transition-all"
                                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdateDate}
                                    disabled={saving}
                                    className="flex-1 h-12 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                                    style={{ background: 'var(--accent)', boxShadow: '0 4px 12px var(--accent-glow)' }}
                                >
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
