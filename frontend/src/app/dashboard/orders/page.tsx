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

const STATUS_MAP: Record<string, { label: string; cls: string; color: string; icon: any }> = {
    OPEN: { label: 'Comanda Aberta', cls: 'text-amber-600 bg-amber-50', color: '#d97706', icon: ClipboardList },
    CLOSED: { label: 'Comanda Fechada', cls: 'text-slate-500 bg-slate-100', color: '#64748b', icon: CheckCircle2 },
    CANCELLED: { label: 'Comanda Cancelada', cls: 'text-rose-600 bg-rose-50', color: '#dc2626', icon: X },
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
    const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    return (
        <div className="w-full animate-fade-in pb-12">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 mb-1">Comandas</h1>
                <p className="text-sm text-slate-500 mb-6 font-medium">Gerencie o fluxo de caixa e itens de consumo dos seus clientes.</p>
            </div>

            {/* Toolbar Superior - Estilo Salão 99 */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Filtro Dropdown */}
                    <div className="relative">
                        <select 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-[13px] font-bold py-2.5 pl-4 pr-10 rounded-xl hover:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all cursor-pointer"
                        >
                            <option value="ALL">Exibir Todas</option>
                            <option value="OPEN">Exibir Abertas</option>
                            <option value="CLOSED">Exibir Fechadas</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                    </div>

                    {/* Barra de Busca */}
                    <div className="relative flex-1 md:w-80">
                        <Input 
                            type="text" 
                            placeholder="Buscar por cliente ou código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 h-11 bg-slate-50 border-slate-200 text-sm py-2.5 rounded-xl focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-400"
                        />
                        <ShoppingBag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ActionButton icon={Printer} label="Imprimir" onClick={() => {}} className="bg-white border-slate-200 text-slate-600 hover:text-cyan-600 shadow-none h-11 px-5 rounded-xl font-bold text-xs uppercase tracking-widest" />
                    <ActionButton icon={ClipboardList} label="Atualizar" onClick={() => fetchOrders()} className="bg-white border-slate-200 text-slate-600 hover:text-cyan-600 shadow-none h-11 px-5 rounded-xl font-bold text-xs uppercase tracking-widest" />
                </div>
            </div>

            {/* Lista de Comandas - Tabela Profissional */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden border-separate">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Comanda</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Data</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Cliente</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Valor Total (R$)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Adicional (R$)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Pendente (R$)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Situação</th>
                                <th className="px-6 py-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <span className="w-10 h-10 border-[3px] border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando dados...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-40">
                                            <ClipboardList size={40} className="text-slate-300" />
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma comanda encontrada</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.map((order) => {
                                const total = calcTotal(order);
                                const paid = calcPaid(order);
                                const pending = Math.max(0, total - paid);
                                const status = STATUS_MAP[order.status] || STATUS_MAP.OPEN;
                                const StatusIcon = status.icon;

                                return (
                                    <tr 
                                        key={order.id} 
                                        className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="text-[13px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                                #{order.id.slice(0, 6).toUpperCase()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-medium text-slate-500">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-6 py-5">
                                            <div className="text-[15px] font-bold text-slate-800 capitalize">{order.client?.name?.toLowerCase() || 'Cliente não informado'}</div>
                                            {order.appointments?.length > 0 && (
                                                <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{order.appointments[0].service.name} e mais...</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-[15px] font-bold text-slate-700 text-right">R$ {fmt(total)}</td>
                                        <td className="px-6 py-5 text-sm text-slate-300 text-right font-medium">-</td>
                                        <td className="px-6 py-5 text-right">
                                            <span className={`text-[15px] font-bold ${pending > 0.01 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {pending > 0.01 ? `R$ ${fmt(pending)}` : 'Pago'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.cls}`}>
                                                {status.label}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all ${order.status === 'CLOSED' ? 'text-emerald-500 bg-emerald-50 group-hover:bg-emerald-100' : 'text-slate-300 bg-slate-50 group-hover:bg-slate-100'}`}>
                                                <StatusIcon size={20} />
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

// ─── Modal Principal Estilo Salão 99 ──────────────────────────────────────────────
function OrderModal({ order, onClose, onUpdate, clients, services, products, professionals }: any) {
    const [view, setView] = useState<'DETAILS' | 'MANAGE' | 'PAYMENT' | 'ADD_SERVICE' | 'ADD_PRODUCT'>('DETAILS');
    const [saving, setSaving] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Order>(order);

    const [editDate, setEditDate] = useState(false);
    const [newDate, setNewDate] = useState(order.createdAt.substring(0, 10));

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
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" />

            <div 
                className="relative bg-white w-full max-w-[680px] shadow-2xl rounded-3xl flex flex-col overflow-hidden animate-scale-in"
                style={{ maxHeight: '92vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header - Estilo Salão 99 */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Comanda #{currentOrder.id.slice(0, 6).toUpperCase()}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sistema Bella Beauty</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${STATUS_MAP[currentOrder.status].cls}`}>
                            {STATUS_MAP[currentOrder.status].label}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white hover:shadow-sm hover:text-cyan-600 transition-all"><Printer size={20} /></button>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><X size={22} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {view === 'DETAILS' && (
                        <div className="p-8 space-y-8 animate-fade-in">
                            {/* Bloco Cliente/Data */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-5 rounded-2xl shadow-inner">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Cliente</label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-xs">
                                            {currentOrder.client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-[15px] font-bold text-slate-700 capitalize">{currentOrder.client.name.toLowerCase()}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Data da Abertura</label>
                                    <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                        <Calendar size={16} className="text-cyan-500" />
                                        {new Date(currentOrder.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            {/* Resumo de Valores */}
                            <div>
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Resumo Financeiro</h3>
                                    {!isClosed && (
                                        <button 
                                            onClick={() => setView('MANAGE')}
                                            className="text-[11px] font-bold text-cyan-600 hover:text-cyan-700 uppercase tracking-widest underline decoration-2 underline-offset-4"
                                        >
                                            Editar Itens
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4 px-1">
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-slate-500">Subtotal de consumo ({currentOrder.appointments?.length + currentOrder.products?.length} itens)</span>
                                        <span className="text-slate-800">R$ {fmt(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-slate-500">Descontos aplicados</span>
                                        <span className="text-rose-500 font-bold">- R$ {fmt(currentOrder.discount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-6 bg-cyan-50/50 border-y border-cyan-100 px-4 -mx-1 rounded-sm">
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em]">Total Final</span>
                                        <span className="text-3xl font-black text-cyan-600 tracking-tight">R$ {fmt(total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pagamentos */}
                            <div>
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Histórico de Pagamentos</h3>
                                    {!isClosed && remaining > 0.01 && (
                                        <button 
                                            onClick={() => setView('PAYMENT')}
                                            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md shadow-emerald-200 flex items-center gap-2"
                                        >
                                            <Plus size={14} /> Pagar Agora
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {currentOrder.payments?.length > 0 ? (
                                        currentOrder.payments.map((p: any) => (
                                            <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl group hover:border-emerald-200 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-500 shadow-sm transition-transform group-hover:scale-110">
                                                        <DollarSign size={22} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-bold text-slate-700">{PAYMENT_METHODS.find(m => m.value === p.method)?.label || p.method}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Valor Pago</p>
                                                    <p className="text-[17px] font-black text-slate-800">R$ {fmt(p.amount)}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-14 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-3">
                                            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-200"><DollarSign size={32} /></div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nenhum pagamento efetuado</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'MANAGE' && (
                        <div className="p-8 space-y-8 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setView('DETAILS')} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-cyan-600 transition-all"><ChevronRight size={22} className="rotate-180" /></button>
                                <h3 className="text-lg font-bold text-slate-800">Gerenciamento de Itens</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block">Subtotal Atual</label>
                                    <p className="text-2xl font-black text-slate-700">R$ {fmt(subtotal)}</p>
                                </div>
                                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block">Desconto (R$)</label>
                                    <input 
                                        type="number" 
                                        defaultValue={currentOrder.discount}
                                        onBlur={(e) => handleApplyDiscount(Number(e.target.value))}
                                        className="bg-transparent border-none p-0 text-2xl font-black text-rose-500 focus:ring-0 w-full"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Itens de Consumo</h4>
                                    <div className="flex gap-2">
                                        <button onClick={() => setView('ADD_SERVICE')} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all">+ Serviço</button>
                                        <button onClick={() => setView('ADD_PRODUCT')} className="bg-cyan-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-700 transition-all">+ Produto</button>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    {currentOrder.appointments?.map((ap: any) => (
                                        <div key={ap.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600"><Scissors size={20} /></div>
                                                <div>
                                                    <p className="text-[14px] font-bold text-slate-700 capitalize">{ap.service.name.toLowerCase()}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ap.professional.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="text-[15px] font-black text-slate-800">R$ {fmt(ap.service.price)}</span>
                                                <button onClick={() => handleRemoveItem('SERVICE', ap.id)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><Trash size={18} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {currentOrder.products?.map((p: any) => (
                                        <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Package size={20} /></div>
                                                <div>
                                                    <p className="text-[14px] font-bold text-slate-700 capitalize">{p.product.name.toLowerCase()}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">QTD: {p.quantity}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="text-[15px] font-black text-slate-800">R$ {fmt(p.unitPrice * p.quantity)}</span>
                                                <button onClick={() => handleRemoveItem('PRODUCT', p.id)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><Trash size={18} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'PAYMENT' && (
                        <div className="p-8 space-y-8 animate-fade-in text-center">
                            <div className="flex items-center gap-4 mb-2">
                                <button onClick={() => setView('DETAILS')} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-cyan-600 transition-all"><ChevronRight size={22} className="rotate-180" /></button>
                                <h3 className="text-lg font-bold text-slate-800">Fechar Conta</h3>
                            </div>

                            <div className="py-12 bg-emerald-500 rounded-[40px] text-white shadow-2xl shadow-emerald-200 border-4 border-emerald-400 mb-10">
                                <p className="text-xs font-black uppercase tracking-[0.4em] mb-2 opacity-80">Saldo Pendente</p>
                                <p className="text-5xl font-black tracking-tight">R$ {fmt(remaining)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {PAYMENT_METHODS.map(m => (
                                    <button
                                        key={m.value}
                                        onClick={() => handleAddPayment(m.value, remaining)}
                                        className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-emerald-500 hover:bg-white transition-all group flex flex-col items-center gap-4 shadow-sm"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all">
                                            <CreditCard size={28} />
                                        </div>
                                        <div className="text-center">
                                            <span className="text-base font-black text-slate-800 block mb-0.5">{m.label}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processamento Instantâneo</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View para Adicionar Itens */}
                    {(view === 'ADD_SERVICE' || view === 'ADD_PRODUCT') && (
                        <div className="p-8 space-y-6 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setView('MANAGE')} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-cyan-600 transition-all"><ChevronRight size={22} className="rotate-180" /></button>
                                <h3 className="text-lg font-bold text-slate-800">Adicionar {view === 'ADD_SERVICE' ? 'Serviço' : 'Produto'}</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5">
                                {(view === 'ADD_SERVICE' ? services : products.filter((p: any) => p.stock > 0)).map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:border-cyan-200 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-cyan-500">
                                                {view === 'ADD_SERVICE' ? <Scissors size={20} /> : <Package size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-slate-800 capitalize">{item.name.toLowerCase()}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">R$ {fmt(item.price)}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => view === 'ADD_SERVICE' ? handleAddService(item.id, professionals[0]?.id) : handleAddProduct(item.id, 1)}
                                            className="bg-white border border-slate-200 text-slate-800 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600 hover:text-white hover:border-cyan-600 transition-all shadow-sm"
                                        >
                                            Selecionar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Transações Criptografadas
                    </div>
                    <span>© Bella Beauty 2024</span>
                </div>
            </div>
        </div>
    );
}
