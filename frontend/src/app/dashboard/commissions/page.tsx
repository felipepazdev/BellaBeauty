'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Star, DollarSign, Clock, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
        <div className="animate-fade-in w-full pb-16">
            <div className="mb-6">
                <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-white mb-1">Remunerações</h1>
                <p className="text-[14px] text-white/50 mb-4">
                    {user?.role === 'PROFESSIONAL' ? 'Suas comissões detalhadas no mês.' : 'Gestão de repasses financeiros para a equipe.'}
                </p>
            </div>

            {/* Seletor de Mês */}
            <div className="flex items-center justify-between mb-8 bg-[#111116] border border-white/5 rounded-2xl p-4">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/5 rounded-lg border border-white/5 transition-colors">
                    <ChevronLeft size={20} className="text-white/60" />
                </button>
                <span className="font-semibold text-white tracking-wide">{MONTHS[month - 1]} {year}</span>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/5 rounded-lg border border-white/5 transition-colors">
                    <ChevronRight size={20} className="text-white/60" />
                </button>
            </div>

            {/* KPIs Gerais */}
            {user?.role !== 'PROFESSIONAL' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    <div className="flex flex-col p-6 bg-[#111116] border border-white/5 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#f59e0b]" />
                        <span className="text-[12px] font-semibold tracking-wider uppercase text-white/40 mb-1">Pendente a Pagar</span>
                        <div className="flex items-center gap-3">
                            <span className="text-[32px] font-bold tracking-tight text-white">R$ {totalPending.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex flex-col p-6 bg-[#111116] border border-white/5 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#22c55e]" />
                        <span className="text-[12px] font-semibold tracking-wider uppercase text-white/40 mb-1">Total Já Pago</span>
                        <div className="flex items-center gap-3">
                            <span className="text-[32px] font-bold tracking-tight text-white">R$ {totalPaid.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista */}
            {loading ? (
                <div className="flex justify-center py-16"><span className="spinner" style={{ width: 32, height: 32, opacity: 0.5 }} /></div>
            ) : commissions.length === 0 ? (
                <div className="flex flex-col items-center py-20 gap-3 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <Star size={32} className="text-white/20" />
                    <p className="text-[14px] text-white/40">Nenhuma remuneração registrada</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {groupedCommissions.map((group) => (
                        <div key={group.professional.id} className="bg-[#111116] p-6 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-colors">
                            
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0 bg-white/5 text-white shadow-inner">
                                    {group.professional.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="font-semibold text-[16px] text-white tracking-tight">{group.professional.name}</h2>
                                    <p className="text-[13px] text-white/40">
                                        {group.items.length} comissões no período
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="flex items-center gap-8">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1">Pendente</span>
                                        <span className="font-semibold text-[15px] text-[#f59e0b]">R$ {group.totalPending.toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1">Pago</span>
                                        <span className="font-semibold text-[15px] text-[#22c55e]">R$ {group.totalPaid.toFixed(2)}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedProf({ name: group.professional.name, items: group.items })}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[13px] font-medium rounded-lg transition-colors border border-white/5 shadow-sm whitespace-nowrap"
                                >
                                    Ver Detalhes
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Detalhamento */}
            {selectedProf && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:pl-[230px]" onClick={() => setSelectedProf(null)}>
                    <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
                    <div className="card w-full max-w-[600px] flex flex-col max-h-[85vh] animate-fade-in p-0 z-10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                            <div>
                                <h2 className="font-bold text-lg">Detalhamento — {selectedProf.name}</h2>
                            </div>
                            <button onClick={() => setSelectedProf(null)} className="p-2 hover:bg-white/5 rounded-full text-zinc-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6">
                            {Object.entries(
                                selectedProf.items.reduce((acc, c) => {
                                    const date = new Date(c.appointment?.date || new Date());
                                    const monthYear = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                                    const capitalizedMonth = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
                                    
                                    if (!acc[capitalizedMonth]) acc[capitalizedMonth] = [];
                                    acc[capitalizedMonth].push(c);
                                    return acc;
                                }, {} as Record<string, typeof selectedProf.items>)
                            ).map(([month, items]) => (
                                <div key={month} className="flex flex-col gap-3">
                                    <h3 className="font-bold text-sm border-b pb-2" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                                        {month}
                                    </h3>
                                    {items.map(c => {
                                        const st = STATUS_MAP[c.status] ?? { label: c.status, cls: 'badge-gray' };
                                        const totalService = c.appointment?.service?.price || 0;
                                        const profPart = c.amount;
                                        const housePart = totalService - profPart;

                                        return (
                                    <div key={c.id} className="border rounded-xl p-3 flex flex-col gap-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-document)' }}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold">{c.appointment?.service?.name}</p>
                                                    <span className={`badge ${st.cls}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{st.label}</span>
                                                </div>
                                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                    Cliente: {c.appointment?.client?.name} | {c.appointment?.date ? new Date(c.appointment.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Data desconhecida'}
                                                </p>
                                            </div>
                                            {user?.role !== 'PROFESSIONAL' && c.status !== 'PAID' && (
                                                <button 
                                                    onClick={() => handlePay(c.id)}
                                                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-black text-[12px] font-bold rounded-lg transition-colors shadow-sm"
                                                >
                                                    Pagar
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className={`grid ${user?.role !== 'PROFESSIONAL' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'} gap-3 rounded-lg px-4 py-3 text-xs`} style={{ background: 'var(--bg-surface)' }}>
                                            {user?.role !== 'PROFESSIONAL' && (
                                                <>
                                                    <div className="flex flex-col">
                                                        <span style={{ color: 'var(--text-muted)' }} className="mb-0.5">Total do Serviço</span>
                                                        <span className="font-semibold text-sm">R$ {totalService.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex flex-col md:text-center">
                                                        <span style={{ color: 'var(--text-muted)' }} className="mb-0.5">Manteve na Casa</span>
                                                        <span className="font-semibold text-sm">R$ {housePart.toFixed(2)}</span>
                                                    </div>
                                                </>
                                            )}
                                            <div className={`flex flex-col col-span-2 md:col-span-1 ${user?.role === 'PROFESSIONAL' ? '' : 'md:text-right'}`}>
                                                <span style={{ color: 'var(--text-muted)' }} className="mb-0.5">Repasse (Profissional)</span>
                                                <span className="font-bold text-sm" style={{ color: c.status === 'PAID' ? '#22c55e' : '#f59e0b' }}>
                                                    R$ {profPart.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
