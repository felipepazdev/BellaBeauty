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
            <div style={{ width: '100%', paddingBottom: 80 }}>
                {/* ── Header ──────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 40 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                            Remunerações
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {user?.role === 'PROFESSIONAL' ? 'Seu extrato detalhado de comissões' : 'Gestão e controle de repasses para a equipe'}
                        </p>
                    </div>

                    {/* Seletor de mês */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 16, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        <button onClick={() => changeMonth(-1)} style={{ padding: 8, color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 10, display: 'flex', alignItems: 'center' }}>
                            <ChevronLeft size={18} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', minWidth: 160, justifyContent: 'center' }}>
                            <Star size={16} color="var(--accent)" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {MONTHS[month - 1]} {year}
                            </span>
                        </div>

                        <button onClick={() => changeMonth(1)} style={{ padding: 8, color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 10, display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* ── KPIs Gerais ───────────────────────────────────── */}
                {user?.role !== 'PROFESSIONAL' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 40 }}>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Clock size={26} color="#f59e0b" />
                            </div>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Total Pendente</p>
                                <p style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>
                                    R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <DollarSign size={26} color="#10b981" />
                            </div>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Total Liquidado</p>
                                <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                                    R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Lista de Profissionais ───────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 8 }}>
                        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Equipe &amp; Performance</h2>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total: {groupedCommissions.length} profissionais</span>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
                            <div className="spinner" style={{ width: 36, height: 36 }} />
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Sincronizando dados financeiros...</p>
                        </div>
                    ) : commissions.length === 0 ? (
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
                            <Star size={40} color="var(--border)" strokeWidth={1} style={{ marginBottom: 16 }} />
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Sem registros este mês</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280 }}>Nenhuma comissão foi processada para o período selecionado.</p>
                        </div>
                    ) : (
                        groupedCommissions.map((group) => (
                            <div key={group.professional.id} className="card" style={{ transition: 'all 0.2s' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '4px 0' }}>
                                    {/* Info Profissional */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                                            {group.professional.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                                {group.professional.name?.toLowerCase()}
                                            </h3>
                                            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                                                {group.items.length} comissões registradas
                                            </p>
                                        </div>
                                    </div>

                                    {/* Valores e Ação */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 32 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                            <div>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Pendente</span>
                                                <span style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>
                                                    R$ {group.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Liquidado</span>
                                                <span style={{ fontSize: 18, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                                                    R$ {group.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedProf({ name: group.professional.name, items: group.items })}
                                            className="btn-primary"
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
                                        >
                                            <Search size={15} strokeWidth={2.5} />
                                            <span>Detalhes</span>
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
                <div
                    onClick={() => setSelectedProf(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'grid', placeItems: 'center', padding: 16 }}
                >
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }} />

                    <div
                        style={{
                            position: 'relative', width: '100%', maxWidth: 700,
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 24, display: 'flex', flexDirection: 'column',
                            maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                                    Histórico de Repasses
                                </h2>
                                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                    {selectedProf.name} • {MONTHS[month - 1]} {year}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedProf(null)}
                                style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
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
                                    <div key={dateLabel} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', background: 'var(--bg-surface)', padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                                                {dateLabel}
                                            </span>
                                            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {items.map(c => {
                                                const total = c.appointment?.service?.price || 0;
                                                const isPaid = c.status === 'PAID';
                                                const statusColor = isPaid ? '#10b981' : '#f59e0b';

                                                return (
                                                    <div key={c.id} style={{ padding: '16px 20px', borderRadius: 16, background: 'var(--bg-surface)', border: `1px solid var(--border)`, position: 'relative', overflow: 'hidden' }}>
                                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: statusColor, borderRadius: '0 0 0 0' }} />
                                                        <div style={{ paddingLeft: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${statusColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                    <Scissors size={20} color={statusColor} strokeWidth={1.5} />
                                                                </div>
                                                                <div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{c.appointment?.service?.name}</p>
                                                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, border: `1px solid ${statusColor}30`, color: statusColor, background: `${statusColor}10`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                            {isPaid ? 'Pago' : 'Pendente'}
                                                                        </span>
                                                                    </div>
                                                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                                                                        {c.appointment?.client?.name} &nbsp;|&nbsp;
                                                                        {new Date(c.appointment?.date || "").toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Sua Comissão</p>
                                                                    <p style={{ fontSize: 20, fontWeight: 700, color: statusColor, fontFamily: 'monospace' }}>
                                                                        R$ {c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                    </p>
                                                                </div>

                                                                {user?.role !== 'PROFESSIONAL' && !isPaid && (
                                                                    <button
                                                                        onClick={() => handlePay(c.id)}
                                                                        style={{ height: 44, padding: '0 20px', background: '#10b981', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                                                    >
                                                                        Pagar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {user?.role !== 'PROFESSIONAL' && (
                                                            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 32 }}>
                                                                <div>
                                                                    <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Total do Serviço</p>
                                                                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                                <div>
                                                                    <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Retido (Salão)</p>
                                                                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>R$ {(total - c.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
