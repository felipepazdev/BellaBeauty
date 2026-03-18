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
            <div className="mb-4">
                <h1 className="text-2xl font-bold">Remunerações</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {user?.role === 'PROFESSIONAL' ? 'Suas comissões detalhadas no mês' : 'Repasses pendentes e pagos por colaborador'}
                </p>
            </div>

            {/* Seletor de Mês */}
            <div className="flex items-center justify-between mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/5 rounded-lg border border-zinc-800 transition-colors">
                    <ChevronLeft size={20} className="text-zinc-400" />
                </button>
                <span className="font-semibold">{MONTHS[month - 1]} {year}</span>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/5 rounded-lg border border-zinc-800 transition-colors">
                    <ChevronRight size={20} className="text-zinc-400" />
                </button>
            </div>

            {/* KPIs Gerais */}
            {user?.role !== 'PROFESSIONAL' && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="card flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
                            <Clock size={20} style={{ color: '#f59e0b' }} />
                        </div>
                        <div>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Geral a Pagar</p>
                            <p className="text-xl font-bold" style={{ color: '#f59e0b' }}>R$ {totalPending.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="card flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)' }}>
                            <DollarSign size={20} style={{ color: '#22c55e' }} />
                        </div>
                        <div>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Geral Já Pago</p>
                            <p className="text-xl font-bold" style={{ color: '#22c55e' }}>R$ {totalPaid.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista */}
            {loading ? (
                <div className="flex justify-center py-16"><span className="spinner" style={{ width: 36, height: 36 }} /></div>
            ) : commissions.length === 0 ? (
                <div className="card flex flex-col items-center py-16 gap-3">
                    <Star size={40} style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Nenhuma remuneração encontrada</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {groupedCommissions.map((group) => (
                        <div key={group.professional.id} className="card p-0 overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                            
                            {/* Cabeçalho do Profissional */}
                            <div className="p-4 flex items-center justify-between" style={{ background: 'var(--bg-document)', borderBottom: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                                        style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                                        {group.professional.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-base">{group.professional.name}</h2>
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            {group.items.length} comissões registradas
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>A pagar:</span>
                                        <span className="font-bold text-sm" style={{ color: '#f59e0b' }}>R$ {group.totalPending.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Já pago:</span>
                                        <span className="font-bold text-sm" style={{ color: '#22c55e' }}>R$ {group.totalPaid.toFixed(2)}</span>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedProf({ name: group.professional.name, items: group.items })}
                                        className="mt-3 text-xs font-semibold px-4 py-1.5 rounded-full"
                                        style={{ background: 'var(--bg-document)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    >
                                        Ver Detalhamento
                                    </button>
                                </div>
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
