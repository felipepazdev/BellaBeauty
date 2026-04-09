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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FormField, Input, Select, ActionButton } from '@/components/ui/FormField';

interface Order {
    id: string;
    clientId: string;
    status: string;
    totalAmount: number;
    discount: number;
    client: { id: string; name: string; phone?: string };
    appointments: { id: string; service: { id: string; name: string; price: number }; professional: { name: string } }[];
    products: { id: string; quantity: number; unitPrice: number; product: { id: string; name: string } }[];
    payments: { id: string; method: string; amount: number; createdAt: string }[];
    createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string; color: string; icon: any }> = {
    OPEN: { label: 'Comanda Aberta', cls: 'text-slate-500', color: '#64748b', icon: FileText },
    CLOSED: { label: 'Comanda Fechada', cls: 'text-[#06b6d4]', color: '#06b6d4', icon: Check },
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
    
    const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="w-full px-8 animate-fade-in pb-12 overflow-x-hidden pt-4 bg-white min-h-screen">
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Comandas</h1>
                    <p className="text-[13px] text-slate-400 font-medium">Gerenciamento financeiro de atendimentos</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchOrders} className="p-3 text-slate-400 hover:text-[#06b6d4] transition-all bg-slate-50 border border-slate-100 rounded-xl">
                        <RotateCw size={18} />
                    </button>
                </div>
            </div>

            {/* Toolbar - Estilo Salão 99 */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 !mb-14 w-full">
                <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-12 w-full lg:w-auto">
                    {/* Filtros de Situação */}
                    <div className="flex items-center !gap-4 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                        {['ALL', 'OPEN', 'CLOSED'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-5 py-2 rounded-xl text-[12px] font-bold transition-all ${
                                    filter === f 
                                    ? 'bg-white text-[#06b6d4] shadow-sm ring-1 ring-slate-100' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {f === 'ALL' ? 'Todas' : f === 'OPEN' ? 'Abertas' : 'Fechadas'}
                            </button>
                        ))}
                    </div>

                    {/* Busca */}
                    <div className="relative w-full lg:w-[450px]">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#06b6d4]" />
                        <input 
                            type="text" 
                            placeholder="Buscar por cliente ou código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                             className="w-full !pl-16 pr-4 bg-white border border-slate-100 text-[14px] text-slate-600 focus:border-[#06b6d4] focus:ring-4 focus:ring-[#06b6d4]/5 placeholder:text-slate-300 h-11 rounded-2xl transition-all shadow-sm font-medium"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                     <button className="flex items-center gap-2 px-5 h-11 bg-[#06b6d4] text-white rounded-2xl font-bold text-xs hover:bg-[#0891b2] transition-all shadow-lg shadow-[#06b6d4]/20">
                        <Plus size={18} />
                        NOVA COMANDA
                    </button>
                </div>
            </div>

            {/* Tabela de Comandas - Layout Salão 99 */}
            <div className="w-full bg-white border border-slate-100 shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse table-auto min-w-[1400px]">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/50">
                                <th className="py-6 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Comanda</th>
                                <th className="py-6 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Data</th>
                                <th className="py-6 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                                <th className="py-6 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Total (R$)</th>
                                <th className="py-6 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Adicional</th>
                                <th className="py-6 px-16 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Pagamento (R$)</th>
                                <th className="py-6 px-16 text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Situação</th>
                                <th className="py-6 pr-8 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-32 text-center text-slate-400 text-sm font-medium tracking-wide">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-[#06b6d4] rounded-full animate-spin" />
                                            Sincronizando faturas...
                                        </div>
                                    </td>
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
                                        className="group hover:bg-[#06b6d4]/[0.02] transition-colors cursor-pointer"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        <td className="py-6 px-8 text-[14px] text-slate-900 font-bold">#{order.id.slice(0, 8).toUpperCase()}</td>
                                        <td className="py-6 px-6 text-[13px] text-slate-500 font-medium text-center">
                                            {format(new Date(order.createdAt), "dd/MMM/yy", { locale: ptBR })}
                                        </td>
                                        <td className="py-6 px-6">
                                            <div className="text-[14px] text-slate-800 font-bold capitalize truncate max-w-[200px]">{order.client?.name?.toLowerCase() || 'Sem cliente'}</div>
                                        </td>
                                        <td className="py-6 px-6 text-[15px] text-slate-900 text-right font-black tracking-tight">{fmt(total)}</td>
                                        <td className="py-6 px-6 text-[14px] text-slate-300 text-right">0,00</td>
                                        <td className="py-6 px-16 text-[15px] text-emerald-600 text-right font-bold tracking-tight">{fmt(paid)}</td>
                                        <td className="py-6 px-16">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                                isClosed ? 'bg-[#06b6d4]/10 text-[#06b6d4]' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-[#06b6d4]' : 'bg-slate-400'}`} />
                                                {status.label}
                                            </div>
                                        </td>
                                        <td className="py-6 pr-8 text-right">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-[#06b6d4] group-hover:text-white transition-all shadow-sm ml-auto">
                                                <ChevronRight size={20} />
                                            </div>
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

// ─── Modal Principal Redesenhado (Salão 99 Style) ──────────────────────────────────────
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
            if (amount >= remaining - 0.01) {
                setView('DETAILS');
            }
        } catch (e: any) { alert(e.response?.data?.message || 'Erro ao processar pagamento'); }
        finally { setSaving(false); }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[999] p-4 flex items-center justify-center overflow-hidden" onClick={onClose}>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[4px] animate-fade-in" />

            <div 
                className="relative bg-white w-full max-w-[700px] shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-scale-in border border-slate-200"
                style={{ maxHeight: '95vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header Salão 99 Style */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md ${
                            isClosed ? 'bg-[#06b6d4] shadow-[#06b6d4]/20' : 'bg-slate-800 shadow-slate-200'
                        }`}>
                            <ClipboardList size={20} />
                        </div>
                        <div>
                            <h2 className="text-[18px] font-black text-slate-900 tracking-tight leading-none mb-1">Comanda #{currentOrder.id.slice(0, 8).toUpperCase()}</h2>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{currentOrder.client.name.toLowerCase()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="p-3 text-slate-400 hover:text-[#06b6d4] transition-all bg-slate-50 rounded-xl border border-slate-100">
                            <Printer size={20} />
                        </button>
                        <button onClick={onClose} className="p-3 text-slate-400 hover:text-rose-500 hover:rotate-90 transition-all duration-300 bg-slate-50 rounded-xl border border-slate-100">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Sub-Header Navigation */}
                <div className="flex px-8 border-b border-slate-100 gap-8 bg-slate-50/50">
                    {[
                        { id: 'DETAILS', label: 'Resumo' },
                        { id: 'MANAGE', label: 'Gerenciar' },
                        { id: 'PAYMENT', label: 'Receber' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setView(tab.id as any)}
                            className={`py-4 text-[12px] font-black uppercase tracking-[0.15em] transition-all relative ${
                                view === tab.id ? 'text-[#06b6d4]' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab.label}
                            {view === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#06b6d4] rounded-t-full" />}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {view === 'DETAILS' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 relative overflow-hidden">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Proprietário</label>
                                    <div className="text-[15px] font-black text-slate-900 capitalize">{currentOrder.client.name.toLowerCase()}</div>
                                    <p className="text-[11px] text-slate-500 mt-1 font-medium">{currentOrder.client.phone || '(Sem telefone)'}</p>
                                </div>
                                <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 relative overflow-hidden">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Emissão</label>
                                    <div className="text-[15px] font-black text-slate-900">{format(new Date(currentOrder.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}</div>
                                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Abertura: {format(new Date(currentOrder.createdAt), "HH:mm")}</p>
                                </div>
                            </div>

                            {/* Resumo Financeiro */}
                            <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="flex justify-between items-center relative z-10">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 mb-3">Total Consumido</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-bold opacity-60">R$</span>
                                            <span className="text-3xl font-black tracking-tight">{fmt(total)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">Situação</p>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 ${
                                            isClosed ? 'bg-[#06b6d4] text-white' : 'bg-white/5 text-white'
                                        }`}>
                                            {isClosed ? 'Liquidado' : 'Aguardando Pagamento'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Itens</p>
                                    <p className="text-[15px] font-black text-slate-800">R$ {fmt(subtotal)}</p>
                                </div>
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Descontos</p>
                                    <p className="text-[15px] font-black text-rose-600">- R$ {fmt(currentOrder.discount)}</p>
                                </div>
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Já Pago</p>
                                    <p className="text-[15px] font-black text-emerald-600">R$ {fmt(paid)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'MANAGE' && (
                        <div className="space-y-8 animate-fade-in">
                            {!isClosed && (
                                <div className="flex gap-4">
                                    <button onClick={() => setView('ADD_SERVICE')} className="flex-1 h-14 bg-[#06b6d4] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#0891b2] transition-all shadow-lg shadow-[#06b6d4]/20 flex items-center justify-center gap-2">
                                        <PlusCircle size={20} />
                                        INCLUIR SERVIÇO
                                    </button>
                                    <button onClick={() => setView('ADD_PRODUCT')} className="flex-1 h-14 bg-slate-800 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2">
                                        <Package size={20} />
                                        INCLUIR PRODUTO
                                    </button>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Itens Selecionados</h4>
                                {currentOrder.appointments?.map((ap: any) => (
                                    <div key={ap.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-[#06b6d4]/30 transition-all shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-[#06b6d4]/5 flex items-center justify-center text-[#06b6d4]"><Scissors size={18} /></div>
                                            <div>
                                                <p className="text-[14px] font-black text-slate-800 capitalize leading-none mb-1">{ap.service.name.toLowerCase()}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ap.professional.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="text-[14px] font-black text-slate-900 tracking-tight">R$ {fmt(ap.service.price)}</span>
                                            {!isClosed && (
                                                <button onClick={() => handleRemoveItem('SERVICE', ap.id)} className="w-9 h-9 rounded-lg bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {currentOrder.products?.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-[#06b6d4]/30 transition-all shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><ShoppingBag size={18} /></div>
                                            <div>
                                                <p className="text-[14px] font-black text-slate-800 capitalize leading-none mb-1">{p.product.name.toLowerCase()}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantidade: {p.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="text-[14px] font-black text-slate-900 tracking-tight">R$ {fmt(p.unitPrice * p.quantity)}</span>
                                            {!isClosed && (
                                                <button onClick={() => handleRemoveItem('PRODUCT', p.id)} className="w-9 h-9 rounded-lg bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {currentOrder.appointments?.length === 0 && currentOrder.products?.length === 0 && (
                                    <div className="py-20 text-center text-slate-300 text-[13px] font-bold uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[40px]">
                                        Comanda Vazia
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {view === 'PAYMENT' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="p-8 bg-[#06b6d4] rounded-2xl text-white shadow-xl relative overflow-hidden group text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-70">Saldo em Aberto</p>
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="text-2xl font-bold opacity-60">R$</span>
                                    <span className="text-5xl font-black tracking-tighter">{fmt(remaining)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {PAYMENT_METHODS.map(m => (
                                    <button 
                                        key={m.value} 
                                        onClick={() => handleAddPayment(m.value, remaining)} 
                                        className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-[#06b6d4] hover:bg-slate-50 transition-all group flex flex-col items-center gap-3 text-center"
                                    >
                                        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#06b6d4] group-hover:bg-white transition-all">
                                            <CreditCard size={24} />
                                        </div>
                                        <div>
                                            <span className="text-[14px] font-black text-slate-800 block">{m.label}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Liquidurar Total</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {(view === 'ADD_SERVICE' || view === 'ADD_PRODUCT') && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[18px] font-black text-slate-900 tracking-tight">Vincular {view === 'ADD_SERVICE' ? 'Serviço' : 'Produto'}</h3>
                                <div className="relative w-64">
                                     <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                     <input type="text" placeholder="Filtrar itens..." className="w-full pl-10 h-10 bg-slate-50 border-none rounded-xl text-[12px] font-bold" />
                                </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#06b6d4] animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Bella Beauty Checkout System</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
