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
        <div className="animate-fade-in w-full pb-20">
            <div className="mb-6 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-[#111827] transition-colors p-1">
                        <ChevronLeft size={28} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[32px] font-serif font-extrabold tracking-tight text-[#111827]">Relatório de Clientes</h1>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-[8px] text-[13px] font-extrabold hover:bg-gray-50 transition-colors shadow-sm tracking-wide">
                    <Download size={16} strokeWidth={2.5}/>
                    EXPORTAR
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col w-64">
                    <span className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Users size={14} className="text-[#5a79f2]"/>
                        Meus Clientes
                    </span>
                    <span className="text-2xl font-black text-[#111827]">{totalClients}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col w-64">
                    <span className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <UserCircle size={14} className="text-emerald-500"/>
                        Ticket Médio Geral
                    </span>
                    <span className="text-2xl font-black text-[#111827]">{formatCurrency(avgTicket)}</span>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white">
                    <h2 className="font-extrabold text-[16px] text-[#111827]">Listagem e Perfil de Consumo</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f8f9fa]">
                            <tr className="border-b border-gray-200 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                                <th className="p-4">Cliente</th>
                                <th className="p-4 text-center">Última Venda</th>
                                <th className="p-4 text-center">Atendimentos</th>
                                <th className="p-4 text-right">Gasto Total</th>
                                <th className="p-4 text-right">Ticket Médio Cliente</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.map(client => {
                                const clientTicket = client.totalAppointments > 0 ? client.totalSpent / client.totalAppointments : client.totalSpent;
                                return (
                                    <tr key={client.id} className="hover:bg-[#f8f9fa] transition-colors cursor-pointer group" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-extrabold text-[#111827] text-[14px] group-hover:text-[#5a79f2] transition-colors flex flex-row items-center gap-1">
                                                    {client.name}
                                                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium">{client.phone}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-[13px] font-medium text-gray-600 text-center">
                                            {client.lastVisit ? format(new Date(client.lastVisit), "dd/MM/yyyy") : '-'}
                                        </td>
                                        <td className="p-4 text-[13px] font-bold text-gray-700 text-center">{client.totalAppointments || 0}</td>
                                        <td className="p-4 text-[14px] font-extrabold text-[#111827] text-right">{formatCurrency(client.totalSpent)}</td>
                                        <td className="p-4 text-[14px] font-bold text-emerald-600 text-right">{formatCurrency(clientTicket)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
