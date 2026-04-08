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
    const [selectedProf, setSelectedProf] = useState<{ id: string; name: string; items: Commission[], totalPending: number } | null>(null);
    const [payoutModal, setPayoutModal] = useState<{ id: string, name: string, pending: number } | null>(null);
    const [payoutDetails, setPayoutDetails] = useState<{ advances: number, netPayout: number } | null>(null);
    const [processing, setProcessing] = useState(false);

    const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    useEffect(() => {
        loadData();
    }, [year, month]);

    const loadData = () => {
        setLoading(true);
        api.get(`/commissions?year=${year}&month=${month}`)
            .then((r) => setCommissions(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleOpenPayout = async (profId: string, profName: string, pendingAmount: number) => {
        setPayoutModal({ id: profId, name: profName, pending: pendingAmount });
        setPayoutDetails(null);
        try {
            // Fetch vales for this professional for current month
            const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
            const endd = new Date(year, month, 0);
            const endStr = `${year}-${String(month).padStart(2, '0')}-${endd.getDate()}`;
            const res = await api.get(`/finance/report/collaborators/${profId}?startDate=${startStr}&endDate=${endStr}`);
            const advances = res.data.metrics.advances?.total || 0;
            setPayoutDetails({ advances, netPayout: Math.max(0, pendingAmount - advances) });
        } catch (e) {
            console.error(e);
            setPayoutDetails({ advances: 0, netPayout: pendingAmount });
        }
    };

    const handleConfirmPayout = async () => {
        if (!payoutModal || !payoutDetails) return;
        setProcessing(true);
        try {
            const endd = new Date(year, month, 0);
            const endStr = `${year}-${String(month).padStart(2, '0')}-${endd.getDate()}`;
            await api.post(`/finance/collaborators/${payoutModal.id}/payout`, {
                endDate: endStr,
                netPayout: payoutDetails.netPayout
            });
            alert('Folha liquidada com sucesso! Saída registrada no Fluxo de Caixa.');
            setPayoutModal(null);
            loadData();
        } catch (e) {
            console.error(e);
            alert('Erro ao registrar pagamento.');
        } finally {
            setProcessing(false);
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

    // ... (grouping logic)
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

    const totalPending = commissions.filter(c => c.status === 'PENDING').reduce((a, c) => a + c.amount, 0);
    const totalPaid = commissions.filter(c => c.status === 'PAID').reduce((a, c) => a + c.amount, 0);

    return (
        <>
            <div style={{ width: '100%', paddingBottom: 80 }}>
                {/* ── Header ──────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 40 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                            Folha de Remunerações
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {user?.role === 'PROFESSIONAL' ? 'Seu extrato detalhado de comissões' : 'Gestão de repasses, vales e fechamento de folha'}
                        </p>
                    </div>

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

                {user?.role !== 'PROFESSIONAL' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 40 }}>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Clock size={26} color="#f59e0b" />
                            </div>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Pendente Total (Bruto)</p>
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
                                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Pagas no Mês</p>
                                <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                                    R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 8 }}>
                        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Repasses da Equipe</h2>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{groupedCommissions.length} profissionais ativos</span>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
                            <div className="spinner" style={{ width: 36, height: 36 }} />
                        </div>
                    ) : commissions.length === 0 ? (
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
                            <Star size={40} color="var(--border)" strokeWidth={1} style={{ marginBottom: 16 }} />
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Sem registro de comissões</h3>
                        </div>
                    ) : (
                        groupedCommissions.map((group) => (
                            <div key={group.professional.id} className="card" style={{ transition: 'all 0.2s', padding: 20 }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                                            {group.professional.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                                {group.professional.name?.toLowerCase()}
                                            </h3>
                                            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                                                {group.items.length} agendamentos no mês
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 32 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                            <div>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Acumulado (Pendente)</span>
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

                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                onClick={() => setSelectedProf({ id: group.professional.id, name: group.professional.name, items: group.items, totalPending: group.totalPending })}
                                                className="btn-secondary"
                                            >
                                                Ver Lançamentos
                                            </button>
                                            
                                            {user?.role !== 'PROFESSIONAL' && group.totalPending > 0 && (
                                                <button
                                                    onClick={() => handleOpenPayout(group.professional.id, group.professional.name, group.totalPending)}
                                                    className="btn-cyan"
                                                >
                                                    Pagar Pendentes
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MODAL DE PAGAMENTO (CEREJA DO BOLO) */}
            {payoutModal && (
                 <div
                 style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
             >
                 <div className="card" style={{ width: '100%', maxWidth: 450, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
                     <div>
                         <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Registrar Pagamento</h2>
                         <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Fechamento de comissões para {payoutModal.name}</p>
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--border)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Total de Comissões</span>
                             <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>R$ {payoutModal.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                         </div>
                         
                         {payoutDetails ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Adiantamentos (Vales)</span>
                                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--danger)' }}>- R$ {payoutDetails.advances.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div style={{ width: '100%', height: 1, borderTop: '1px dashed var(--border)' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 15, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor Líquido a Pagar</span>
                                    <span style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>R$ {payoutDetails.netPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </>
                         ) : (
                             <div className="spinner" style={{ alignSelf: 'center', margin: '10px 0' }} />
                         )}
                     </div>

                     <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                        Ao confirmar, o sistema irá marcar todos os agendamentos como "Pagos" e registrar uma saída automática do valor líquido no Fluxo de Caixa.
                     </p>

                     <div style={{ display: 'flex', gap: 12 }}>
                         <button className="btn-secondary flex-1" onClick={() => setPayoutModal(null)} disabled={processing}>Cancelar</button>
                         <button className="btn-cyan flex-1" style={{ background: '#10b981', color: '#fff', borderColor: '#10b981' }} onClick={handleConfirmPayout} disabled={!payoutDetails || processing}>
                             {processing ? 'Processando...' : 'Confirmar Pagamento'}
                         </button>
                     </div>
                 </div>
             </div>
            )}

            {/* Modal Detalhamento de Lançamentos */}
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
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                                    Lançamentos Detalhados
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
                                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: statusColor }} />
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
                                                                        {c.appointment?.client?.name}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div style={{ textAlign: 'right' }}>
                                                                <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Comissão Lançada</p>
                                                                <p style={{ fontSize: 20, fontWeight: 700, color: statusColor, fontFamily: 'monospace' }}>
                                                                    R$ {c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </p>
                                                            </div>
                                                        </div>
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
