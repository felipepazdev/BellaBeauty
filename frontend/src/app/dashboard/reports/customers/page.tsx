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
        <main className="min-h-screen p-4 sm:p-8 animate-fade-in bg-[#0a0a0c]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()} 
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <ChevronLeft size={24} strokeWidth={2.5} />
                    </button>
                    <div>
                        <h1 className="text-[32px] font-serif font-black text-white tracking-tight">Relatório de Clientes</h1>
                        <p className="text-slate-500 font-medium italic">Insights sobre perfil de consumo e fidelização</p>
                    </div>
                </div>
                <button className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-8 py-3.5 rounded-2xl font-black text-[13px] flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] uppercase tracking-widest">
                    <Download size={18} strokeWidth={3}/>
                    Exportar PDF
                </button>
            </div>

            {/* Dashboard de Indicadores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[30px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Users size={14} className="text-[#06b6d4]"/>
                        Base de Clientes
                    </span>
                    <span className="text-2xl font-black text-white">{totalClients}</span>
                </div>
                <div className="bg-gradient-to-br from-cyan-900/20 to-slate-900/40 backdrop-blur-xl border border-[#06b6d4]/20 p-6 rounded-[30px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#06b6d4]/10 blur-2xl rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-[#06b6d4] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <UserCircle size={14} className="text-[#06b6d4]"/>
                        Ticket Médio Geral
                    </span>
                    <span className="text-2xl font-black text-white tracking-tight">{formatCurrency(avgTicket)}</span>
                </div>
            </div>

            {/* Tabela de Lançamentos */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[35px] overflow-hidden shadow-2xl group">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <UserCircle size={22} className="text-[#06b6d4] drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                        <h2 className="font-serif font-black text-white text-[18px]">Listagem e Perfil de Consumo</h2>
                    </div>
                    <span className="text-[10px] font-black text-[#06b6d4] uppercase tracking-widest bg-[#06b6d4]/10 px-4 py-1.5 rounded-full">Atualizado</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-black/20 text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">
                                <th className="p-6">Cliente</th>
                                <th className="p-6 text-center">Última Visita</th>
                                <th className="p-6 text-center">Frequência</th>
                                <th className="p-6 text-right">Gasto Total</th>
                                <th className="p-6 text-right">LTV / Ticket</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {records.map(client => {
                                const clientTicket = client.totalAppointments > 0 ? client.totalSpent / client.totalAppointments : client.totalSpent;
                                return (
                                    <tr 
                                        key={client.id} 
                                        className="hover:bg-white/[0.03] transition-all cursor-pointer group/row" 
                                        onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                                    >
                                        <td className="p-6 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0c0c10] to-slate-900 border border-white/10 text-[#06b6d4] flex items-center justify-center font-black text-xs group-hover/row:scale-110 transition-all">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-[15px] group-hover/row:text-[#06b6d4] transition-colors flex items-center gap-2">
                                                    {client.name}
                                                    <ExternalLink size={12} className="opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                                </span>
                                                <span className="text-[11px] text-slate-500 font-medium tracking-wide">{client.phone}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-[13px] font-medium text-slate-400 text-center">
                                            {client.lastVisit ? format(new Date(client.lastVisit), "dd/MM/yyyy") : '-'}
                                        </td>
                                        <td className="p-6 text-[13px] font-bold text-slate-400 text-center">
                                            {client.totalAppointments || 0} atends.
                                        </td>
                                        <td className="p-6 text-[15px] font-black text-white text-right">
                                            {formatCurrency(client.totalSpent)}
                                        </td>
                                        <td className="p-6 text-[15px] font-black text-emerald-400 text-right">
                                            {formatCurrency(clientTicket)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {records.length === 0 && (
                    <div className="py-20 text-center text-slate-600 font-medium italic">
                        Nenhum cliente cadastrado no sistema.
                    </div>
                )}
            </div>
        </main>
        </div>
    );
}
