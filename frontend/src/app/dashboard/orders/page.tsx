'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
    ClipboardList, Plus, ShoppingBag, User, DollarSign, X,
    CheckCircle2, Package, Printer, Edit3, Trash2, PlusCircle,
    Calendar, ChevronDown, Save, Scissors, AlertCircle, Trash,
    ChevronRight, TrendingDown, CreditCard, RotateCw, Filter, Download,
    Check, FileText, Search
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

const STATUS_MAP: Record<string, { label: string; cls: string; color: string; icon: any }> = {
    OPEN: { label: 'Comanda Aberta', cls: 'text-slate-600', color: '#64748b', icon: FileText },
    CLOSED: { label: 'Comanda Fechada', cls: 'text-slate-600', color: '#e91e63', icon: Check },
    CANCELLED: { label: 'Comanda Cancelada', cls: 'text-rose-600', color: '#dc2626', icon: X },
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
    const [searchTerm, setSearchTerm] = useState('');

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
        const nameMatch = o.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const idMatch = o.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'ALL' || o.status === filter;
        return (nameMatch || idMatch) && matchesFilter;
    });

    const calcSubtotal = (order: Order) => {
        const s = order.appointments?.reduce((a, ap) => a + (ap.service?.price ?? 0), 0) || 0;
        const p = order.products?.reduce((a, pr) => a + (pr.unitPrice * pr.quantity), 0) || 0;
        return s + p;
    };

    const calcTotal = (order: Order) => calcSubtotal(order) - order.discount;
    const calcPaid = (order: Order) => order.payments?.reduce((a, p) => a + p.amount, 0) || 0;
    
    // Formatação Salon 99: sem R$, com virgula
    const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="w-full px-6 animate-fade-in pb-12 overflow-x-hidden">
            <div className="mb-10">
                <h1 className="text-2xl font-semibold text-slate-800 tracking-tight mb-1">Comandas</h1>
            </div>

            {/* Toolbar Refinada - Espaçamento Amplo e Flat */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-10 w-full">
                <div className="flex items-center gap-10 w-full lg:w-auto">
                    {/* Filtro Discreto */}
                    <div className="flex items-center gap-2 group cursor-pointer relative min-w-fit">
                        <select 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="appearance-none bg-transparent text-slate-600 text-[14px] font-medium pr-8 focus:outline-none cursor-pointer border-none p-0 z-10"
                        >
                            <option value="ALL">Exibir Todas</option>
                            <option value="OPEN">Exibir Abertas</option>
                            <option value="CLOSED">Exibir Fechadas</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-cyan-500 transition-colors pointer-events-none" />
                    </div>

                    {/* Busca Transparente */}
                    <div className="relative flex-1 lg:w-[450px]">
                        <Search size={20} className="absolute left-0 top-1/2 -translate-y-1/2 text-rose-500" />
                        <input 
                            type="text" 
                            placeholder="Procurar por palavra..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 bg-transparent border-none text-[14px] text-slate-600 focus:ring-0 placeholder:text-slate-300 py-2 outline-none"
                        />
                    </div>
                </div>

                {/* Ícones de Ação - Espaçamento Generoso */}
                <div className="flex items-center gap-6 text-slate-400 lg:ml-auto">
                    <button onClick={fetchOrders} className="hover:text-cyan-600 transition-all transform hover:scale-110"><RotateCw size={22} /></button>
                    <button className="hover:text-cyan-600 transition-all transform hover:scale-110"><Filter size={22} /></button>
                    <button className="hover:text-cyan-600 transition-all transform hover:scale-110"><Download size={22} /></button>
                </div>
            </div>

            {/* Tabela de Comandas - Distribuição Espaçada */}
            <div className="w-full">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse table-auto min-w-[1100px]">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-6 pr-6 text-[13px] font-medium text-slate-400 whitespace-nowrap">Comanda</th>
                                <th className="pb-6 px-6 text-[13px] font-medium text-slate-400 whitespace-nowrap text-center">Data</th>
                                <th className="pb-6 px-6 text-[13px] font-medium text-slate-400 whitespace-nowrap">Cliente</th>
                                <th className="pb-6 px-6 text-[13px] font-medium text-slate-400 whitespace-nowrap text-right">Valor Total (R$)</th>
                                <th className="pb-6 px-6 text-[13px] font-medium text-slate-400 whitespace-nowrap text-right">Adicional (R$)</th>
                                <th className="pb-6 px-10 text-[13px] font-medium text-slate-400 whitespace-nowrap text-right">Pendente Pagamento (R$)</th>
                                <th className="pb-6 px-6 text-[13px] font-medium text-slate-400 whitespace-nowrap">Situação</th>
                                <th className="pb-6 pl-6 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-24 text-center text-slate-400 text-sm font-medium tracking-wide">Buscando dados das comandas...</td>
                                </tr>
                            ) : filteredOrders.map((order) => {
                                const total = calcTotal(order);
                                const paid = calcPaid(order);
                                const pending = Math.max(0, total - paid);
                                const isClosed = order.status === 'CLOSED';
                                const status = STATUS_MAP[order.status] || STATUS_MAP.OPEN;

                                return (
                                    <tr 
                                        key={order.id} 
                                        className="group hover:bg-slate-50/60 transition-colors cursor-pointer"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        <td className="py-6 pr-6 text-[14px] text-slate-700 font-medium">#{order.id.slice(0, 6).toUpperCase()}</td>
                                        <td className="py-6 px-6 text-[14px] text-slate-600 text-center">
                                            {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                                        </td>
                                        <td className="py-6 px-6">
                                            <div className="text-[14px] text-slate-800 font-medium capitalize truncate max-w-[200px]">{order.client?.name?.toLowerCase() || 'Sem cliente'}</div>
                                        </td>
                                        <td className="py-6 px-6 text-[14px] text-slate-700 text-right font-medium">{fmt(total)}</td>
                                        <td className="py-6 px-6 text-[14px] text-slate-300 text-right">-</td>
                                        <td className="py-6 px-10 text-right">
                                            <span className={`text-[14px] ${pending > 0.01 ? 'text-slate-700 font-bold' : 'text-emerald-600 font-bold'}`}>
                                                {pending > 0.01 ? fmt(pending) : 'Pago'}
                                            </span>
                                        </td>
                                        <td className="py-6 px-6 text-[13px] text-slate-600 font-medium">
                                            {status.label}
                                        </td>
                                        <td className="py-6 pl-6 text-right">
                                            {isClosed ? (
                                                <Check size={22} className="text-[#e91e63] ml-auto stroke-[3]" />
                                            ) : (
                                                <FileText size={22} className="text-slate-700 ml-auto" />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

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

// ─── Modal Principal mantendo integração ──────────────────────────────────────────────
function OrderModal({ order, onClose, onUpdate, clients, services, products, professionals }: any) {
    const [view, setView] = useState<'DETAILS' | 'MANAGE' | 'PAYMENT' | 'ADD_SERVICE' | 'ADD_PRODUCT'>('DETAILS');
    const [saving, setSaving] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Order>(order);

    const subtotal = (currentOrder.appointments?.reduce((a, ap) => a + (ap.service?.price ?? 0), 0) || 0) +
        (currentOrder.products?.reduce((a, p) => a + (p.unitPrice * p.quantity), 0) || 0);
    const total = subtotal - currentOrder.discount;
    const paid = currentOrder.payments?.reduce((a, p) => a + p.amount, 0) || 0;
    const remaining = Math.max(0, total - paid);
    const isClosed = currentOrder.status === 'CLOSED';

    const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

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

    const handleRemoveItem = async (type: 'SERVICE' | 'PRODUCT', itemId: string) => {
        if (isClosed) return;
        try {
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

    return (
        <div className="fixed inset-0 z-[999] p-4 flex items-center justify-center overflow-hidden" onClick={onClose}>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in" />

            <div 
                className="relative bg-white w-full max-w-[640px] shadow-2xl rounded-3xl flex flex-col overflow-hidden animate-scale-in"
                style={{ maxHeight: '90vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header Minimalista Modal */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Comanda #{currentOrder.id.slice(0, 6).toUpperCase()}</h2>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white border border-slate-100 text-slate-500 shadow-sm`}>
                            {currentOrder.status === 'CLOSED' ? 'Fechada' : 'Aberta'}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-300 hover:text-rose-500 hover:rotate-90 transition-all duration-300"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {view === 'DETAILS' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-2 gap-10">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Cliente</label>
                                    <div className="text-[16px] font-bold text-slate-800 capitalize">{currentOrder.client.name.toLowerCase()}</div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Data de Abertura</label>
                                    <div className="text-[16px] font-medium text-slate-600">{new Date(currentOrder.createdAt).toLocaleDateString('pt-BR')}</div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detalhamento de Valores</h3>
                                    {!isClosed && <button onClick={() => setView('MANAGE')} className="text-xs font-bold text-cyan-600 hover:text-cyan-700 underline underline-offset-4">Alterar Itens</button>}
                                </div>
                                <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between text-sm text-slate-600"><span className="font-medium">Consumo Total</span><span className="font-bold text-slate-800">R$ {fmt(subtotal)}</span></div>
                                    <div className="flex justify-between text-sm text-rose-500"><span className="font-medium">Descontos</span><span className="font-bold">- R$ {fmt(currentOrder.discount)}</span></div>
                                    <div className="flex justify-between text-lg font-black pt-4 border-t border-slate-200"><span className="text-slate-900">Total a Pagar</span><span className="text-cyan-600">R$ {fmt(total)}</span></div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Histórico Financeiro</h3>
                                    {!isClosed && remaining > 0.01 && (
                                        <button 
                                            onClick={() => setView('PAYMENT')} 
                                            className="bg-emerald-500 text-white px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all hover:-translate-y-0.5"
                                        >
                                            Receber Pagamento
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {currentOrder.payments?.length > 0 ? currentOrder.payments.map((p: any) => (
                                        <div key={p.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl">
                                            <div className="text-sm font-medium text-slate-600">{p.method} • <span className="text-[11px] text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span></div>
                                            <div className="text-sm font-bold text-slate-800">R$ {fmt(p.amount)}</div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-6 text-slate-300 text-xs italic font-medium">Nenhum pagamento registrado</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'MANAGE' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setView('DETAILS')} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-cyan-600 rotate-180 transition-all"><ChevronRight size={20} /></button>
                                <h3 className="text-base font-bold text-slate-800">Edição da Comanda</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-5">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Subtotal Consumo</label>
                                    <div className="text-xl font-black text-slate-700">R$ {fmt(subtotal)}</div>
                                </div>
                                <div className="p-5 bg-white rounded-2xl border-2 border-rose-100">
                                    <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-2">Desconto Manual</label>
                                    <input type="number" defaultValue={currentOrder.discount} onBlur={(e) => handleApplyDiscount(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-xl font-black text-rose-500 focus:ring-0" placeholder="0,00" />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setView('ADD_SERVICE')} className="flex-1 bg-slate-900 text-white py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-100">+ Adicionar Serviço</button>
                                <button onClick={() => setView('ADD_PRODUCT')} className="flex-1 bg-cyan-600 text-white py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-100">+ Adicionar Produto</button>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conteúdo da Comanda</h4>
                                {currentOrder.appointments?.map((ap: any) => (
                                    <div key={ap.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-cyan-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600"><Scissors size={18} /></div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 capitalize">{ap.service.name.toLowerCase()}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{ap.professional.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="text-[15px] font-bold text-slate-800">R$ {fmt(ap.service.price)}</span>
                                            <button onClick={() => handleRemoveItem('SERVICE', ap.id)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-400 hover:text-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                                {currentOrder.products?.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-cyan-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Package size={18} /></div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 capitalize">{p.product.name.toLowerCase()}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Qtd: {p.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="text-[15px] font-bold text-slate-800">R$ {fmt(p.unitPrice * p.quantity)}</span>
                                            <button onClick={() => handleRemoveItem('PRODUCT', p.id)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-400 hover:text-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {view === 'PAYMENT' && (
                        <div className="space-y-8 animate-fade-in text-center">
                            <div className="py-14 bg-emerald-500 rounded-[40px] text-white shadow-2xl shadow-emerald-200 border-4 border-emerald-400 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-120 transition-transform"><DollarSign size={120} /></div>
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-3 opacity-80">Saldo Pendente</p>
                                <p className="text-5xl font-black tracking-tighter">R$ {fmt(remaining)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {PAYMENT_METHODS.map(m => (
                                    <button 
                                        key={m.value} 
                                        onClick={() => handleAddPayment(m.value, remaining)} 
                                        className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-emerald-500 hover:bg-white transition-all group shadow-sm flex flex-col items-center gap-3"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-all"><CreditCard size={24} /></div>
                                        <span className="text-sm font-black text-slate-700">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setView('DETAILS')} className="w-full py-4 text-slate-400 text-[11px] font-bold uppercase tracking-widest hover:text-slate-600 transition-all">Voltar para Detalhes</button>
                        </div>
                    )}

                    {/* Vistas de Seleção (Add Service/Product) */}
                    {(view === 'ADD_SERVICE' || view === 'ADD_PRODUCT') && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setView('MANAGE')} className="p-2 bg-slate-50 rounded-lg text-slate-400 rotate-180"><ChevronRight size={20} /></button>
                                <h3 className="text-base font-bold text-slate-800">Selecionar {view === 'ADD_SERVICE' ? 'Serviço' : 'Produto'}</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-2.5">
                                {(view === 'ADD_SERVICE' ? services : products.filter((p: any) => p.stock > 0)).map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:border-cyan-200 hover:bg-white transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-cyan-600 transition-all">
                                                {view === 'ADD_SERVICE' ? <Scissors size={18} /> : <Package size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 capitalize">{item.name.toLowerCase()}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">R$ {fmt(item.price)}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => view === 'ADD_SERVICE' ? handleAddService(item.id, professionals[0]?.id) : handleAddProduct(item.id, 1)}
                                            className="bg-white border border-slate-200 text-slate-800 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600 hover:text-white hover:border-cyan-600 transition-all shadow-sm"
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" /> Bella Beauty Secure Workspace</div>
                    <span>© 2024</span>
                </div>
            </div>
        </div>
    );
}
