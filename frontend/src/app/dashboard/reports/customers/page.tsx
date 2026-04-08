'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ChevronLeft, Download, UserCircle, Users, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface ClientRecord {
    id: string;
    name: string;
    phone: string;
    totalAppointments: number;
    totalSpent: number;
    lastVisit: string | null;
}

export default function CustomersReport() {
    const router = useRouter();
    const [records, setRecords] = useState<ClientRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('');

    useEffect(() => {
        setLoading(true);
        // Using real DB fetch mimicking the original missing-customers approach
        api.get('/clients')
            .then((res) => {
                const allClients: ClientRecord[] = res.data;
                // Sort by total spent by default
                allClients.sort((a, b) => b.totalSpent - a.totalSpent);
                setRecords(allClients);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedMonth]);

    const formatCurrency = (val: number) => 
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="w-10 h-10 border-4 border-[#5a79f2] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const totalClients = records.length;
    const avgTicket = totalClients > 0 ? records.reduce((acc, c) => acc + c.totalSpent, 0) / records.reduce((acc, c) => acc + (c.totalAppointments || 1), 0) : 0;

    return (
        <div style={{ width: '100%', background: 'var(--bg-main)', minHeight: '100%', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 40px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <ChevronLeft size={28} strokeWidth={2.5} />
                        </button>
                        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            Relatório de Clientes
                        </h1>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                    <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Users size={14} color="#3B82F6"/>
                            Meus Clientes
                        </span>
                        <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{totalClients}</span>
                    </div>
                    <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <UserCircle size={14} color="#10b981"/>
                            Ticket Médio Geral
                        </span>
                        <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(avgTicket)}</span>
                    </div>
                </div>

                <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Listagem e Perfil de Consumo</h2>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                                    <th style={{ padding: 16, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cliente</th>
                                    <th style={{ padding: 16, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Última Visita</th>
                                    <th style={{ padding: 16, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Atendimentos</th>
                                    <th style={{ padding: 16, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Gasto Total</th>
                                    <th style={{ padding: 16, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Ticket Médio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(client => {
                                    const clientTicket = client.totalAppointments > 0 ? client.totalSpent / client.totalAppointments : client.totalSpent;
                                    return (
                                        <tr key={client.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s ease' }} 
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                                            <td style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        {client.name}
                                                    </span>
                                                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{client.phone}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: 16, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center' }}>
                                                {client.lastVisit ? format(new Date(client.lastVisit), "dd/MM/yyyy") : '-'}
                                            </td>
                                            <td style={{ padding: 16, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>{client.totalAppointments || 0}</td>
                                            <td style={{ padding: 16, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'right' }}>{formatCurrency(client.totalSpent)}</td>
                                            <td style={{ padding: 16, fontSize: 14, fontWeight: 700, color: '#10b981', textAlign: 'right' }}>{formatCurrency(clientTicket)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

