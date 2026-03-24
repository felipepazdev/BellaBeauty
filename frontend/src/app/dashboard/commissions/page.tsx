'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Star, DollarSign, Clock, Search, X, ChevronLeft, ChevronRight, Scissors } from 'lucide-react';

interface Commission {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    professional: { id: string; name: string };
    appointment: {
        date: string;
        service: { name: string; price: number };
        client: { name: string };
    };
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'Pendente', cls: 'badge-warning' },
    PAID: { label: 'Pago', cls: 'badge-success' },
};

export default function CommissionsPage() {
    const { user } = useAuthStore();
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProf, setSelectedProf] = useState<{ name: string; items: Commission[] } | null>(null);

    const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    useEffect(() => {
        setLoading(true);
        api.get(`/commissions?year=${year}&month=${month}`)
            .then((r) => setCommissions(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [year, month]);

    const handlePay = async (id: string) => {
        try {
            await api.patch(`/commissions/${id}/pay`);
            setCommissions(prev => Object.values(prev).map(c => c.id === id ? { ...c, status: 'PAID' } : c));
            if (selectedProf) {
                setSelectedProf(prev => prev ? {
                    ...prev,
                    items: prev.items.map(c => c.id === id ? { ...c, status: 'PAID' } : c)
                } : null);
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao pagar a comissão.');
        }
    };

    const changeMonth = (dir: number) => {
        let m = month + dir;
        let y = year;
        if (m > 12) { m = 1; y++; }
        if (m < 1) { m = 12; y--; }
        setMonth(m);
        setYear(y);
    };

    const totalPending = commissions.filter(c => c.status === 'PENDING').reduce((a, c) => a + c.amount, 0);
    const totalPaid = commissions.filter(c => c.status === 'PAID').reduce((a, c) => a + c.amount, 0);

    // Grouping logic for commissions by professional
    const groupedCommissions = Object.values(commissions.reduce((acc, c) => {
        const profId = c.professional?.id || 'unknown';
        if (!acc[profId]) {
            acc[profId] = {
                professional: c.professional || { id: 'unknown', name: 'Desconhecido' },
                totalPending: 0,
                totalPaid: 0,
                items: []
            };
        }
        if (c.status === 'PENDING') acc[profId].totalPending += c.amount;
        if (c.status === 'PAID') acc[profId].totalPaid += c.amount;
        acc[profId].items.push(c);
        return acc;
    }, {} as Record<string, { professional: any; totalPending: number; totalPaid: number; items: Commission[] }>));

    return (
        <>
            <div className="animate-fade-in w-full pb-20">
                {/* ── Header ──────────────────────────────────────────── */}
                <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-serif font-bold tracking-tight text-white mb-2">
                            Remunerações
                        </h1>
                        <p className="text-sm font-medium text-slate-400">
                            {user?.role === 'PROFESSIONAL' ? 'Seu extrato detalhado de comissões' : 'Gestão e controle de repasses para a equipe'}
                        </p>
                    </div>

                    {/* Seletor de mês */}
                    <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <button onClick={() => changeMonth(-1)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                            <ChevronLeft size={18} />
                        </button>
                        
                        <div className="flex items-center gap-3 px-4 min-w-[160px] justify-center">
                            <Star size={16} className="text-[#8b5cf6]" />
                            <span className="text-sm font-bold tracking-wide text-white uppercase">
                                {MONTHS[month - 1]} {year}
                            </span>
                        </div>

                        <button onClick={() => changeMonth(1)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* ── KPIs Gerais ───────────────────────────────────── */}
                {user?.role !== 'PROFESSIONAL' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="card flex items-center gap-6 group">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/5 transition-transform group-hover:scale-105">
                                <Clock size={28} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">Total Pendente</p>
                                <p className="text-3xl font-serif font-bold text-white tracking-tight">
                                    R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        <div className="card flex items-center gap-6 group">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/5 transition-transform group-hover:scale-105">
                                <DollarSign size={28} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">Total Liquidado</p>
                                <p className="text-3xl font-serif font-bold text-white tracking-tight">
                                    R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Lista de Profissionais ───────────────────── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-4 mb-2">
                        <h2 className="text-sm font-bold tracking-widest text-slate-500 uppercase">Equipe & Performance</h2>
                        <span className="text-[11px] text-slate-600 font-medium">Total: {groupedCommissions.length} profissionais</span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                            <p className="text-sm text-slate-500 font-medium italic">Sincronizando dados financeiros...</p>
                        </div>
                    ) : commissions.length === 0 ? (
                        <div className="card flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-slate-900/50 flex items-center justify-center mb-6 text-slate-700">
                                <Star size={40} strokeWidth={1} />
                            </div>
                            <h3 className="text-lg font-serif font-bold text-slate-300 mb-2">Sem registros este mês</h3>
                            <p className="text-sm text-slate-500 max-w-[280px]">Nenhuma comissão foi processada para o período selecionado.</p>
                        </div>
                    ) : (
                        groupedCommissions.map((group) => (
                            <div key={group.professional.id} 
                                 className="card group hover:border-purple-500/30 transition-all duration-300">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 py-2">
                                    
                                    {/* Info Profissional */}
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-lg font-serif font-bold text-white shadow-xl group-hover:scale-105 transition-transform duration-300">
                                            {group.professional.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white capitalize tracking-tight group-hover:text-purple-400 transition-colors">
                                                {group.professional.name?.toLowerCase()}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                    {group.items.length} COMISSÕES REGISTRADAS
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Valores e Ação */}
                                    <div className="flex flex-wrap items-center gap-10">
                                        <div className="grid grid-cols-2 gap-8 md:gap-12">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pendente</span>
                                                <span className="text-lg font-bold text-amber-500 font-mono">
                                                    R$ {group.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Liquidado</span>
                                                <span className="text-lg font-bold text-emerald-500 font-mono">
                                                    R$ {group.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => setSelectedProf({ name: group.professional.name, items: group.items })}
                                            className="btn-primary !py-3 !px-6 text-[13px] font-bold flex items-center gap-2"
                                        >
                                            <Search size={16} strokeWidth={2.5} />
                                            <span>DETALHES</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── Modal Detalhamento ───────────────────────── */}
            {selectedProf && (
                <div className="fixed inset-0 z-[999] grid place-items-center p-4 md:p-8" onClick={() => setSelectedProf(null)}>
                    {/* Overlay com desfoque mais intenso para foco total */}
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in" />
                    
                    {/* Modal Card */}
                    <div className="relative w-full max-w-[740px] bg-[#0c0c10] border border-white/10 rounded-[32px] flex flex-col max-h-[90vh] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-scale-in" 
                         onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header Premium */}
                        <div className="shrink-0 flex items-center justify-between p-8 border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-white mb-2 leading-none">
                                    Histórico de Repasses
                                </h2>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
                                        {selectedProf.name} • {MONTHS[month-1]} {year}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedProf(null)} 
                                    className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                                <X size={24} />
                            </button>
                        </div>
                        
                        {/* Modal Content - Scroll area */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                            <div className="space-y-12">
                                {Object.entries(
                                    selectedProf.items.reduce((acc, c) => {
                                        const dateStr = c.appointment?.date || new Date().toISOString();
                                        const d = new Date(dateStr);
                                        const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
                                        if (!acc[label]) acc[label] = [];
                                        acc[label].push(c);
                                        return acc;
                                    }, {} as Record<string, Commission[]>)
                                ).map(([dateLabel, items]) => (
                                    <div key={dateLabel} className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap bg-white/5 px-3 py-1 rounded-full border border-white/5">{dateLabel}</span>
                                            <div className="h-[1px] w-full bg-gradient-to-r from-white/5 to-transparent" />
                                        </div>

                                        <div className="space-y-4">
                                            {items.map(c => {
                                                const total = c.appointment?.service?.price || 0;
                                                const isPaid = c.status === 'PAID';
                                                
                                                return (
                                                    <div key={c.id} className="p-6 rounded-[24px] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5 hover:border-purple-500/20 transition-all group relative overflow-hidden">
                                                        {/* Status indicator line */}
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                        
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                            <div className="flex items-center gap-5">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-current transition-colors
                                                                    ${isPaid ? 'bg-emerald-500/10 text-emerald-500/30' : 'bg-amber-500/10 text-amber-500/30'}`}>
                                                                    <Scissors size={24} strokeWidth={1.5} className={isPaid ? 'text-emerald-500' : 'text-amber-500'} />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-3 flex-wrap">
                                                                        <p className="font-bold text-white text-base tracking-tight">{c.appointment?.service?.name}</p>
                                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md tracking-widest border uppercase
                                                                            ${isPaid ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/20 text-amber-500 bg-amber-500/5'}`}>
                                                                            {isPaid ? 'PAGO' : 'PENDENTE'}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-500 mt-1.5 font-bold uppercase tracking-wider">
                                                                        {c.appointment?.client?.name} <span className="mx-2 text-slate-800">|</span> 
                                                                        {new Date(c.appointment?.date || "").toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-10">
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">Sua Comissão</p>
                                                                    <p className={`text-xl font-bold font-mono tracking-tighter ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                        R$ {c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                    </p>
                                                                </div>

                                                                {user?.role !== 'PROFESSIONAL' && !isPaid && (
                                                                    <button 
                                                                        onClick={() => handlePay(c.id)}
                                                                        className="h-12 px-6 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black rounded-2xl transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)] uppercase tracking-widest active:scale-95"
                                                                    >
                                                                        Pagar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Bottom details for Admin */}
                                                        {user?.role !== 'PROFESSIONAL' && (
                                                            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-start gap-12">
                                                                <div>
                                                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Total do Serviço</p>
                                                                    <p className="text-sm font-bold text-slate-400">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Manteve na Casa</p>
                                                                    <p className="text-sm font-bold text-slate-400">R$ {(total - c.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
