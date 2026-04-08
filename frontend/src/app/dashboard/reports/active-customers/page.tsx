'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ChevronLeft, Download } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Client {
    id: string;
    name: string;
    phone: string;
    totalAppointments: number;
    totalSpent: number;
    lastVisit: string | null;
}

export default function ActiveCustomersReport() {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState<string>(''); 

    useEffect(() => {
        setLoading(true);
        api.get('/clients')
            .then((res) => {
                const allClients: Client[] = res.data;
                const active = allClients.filter(c => {
                    if (!c.lastVisit) return false; 
                    
                    if (fromDate) {
                        const targetDate = new Date(fromDate);
                        return new Date(c.lastVisit) >= targetDate; // Ativo a partir desta data
                    }
                    
                    // Se não tiver filtro, mostrar todos que já visitaram ordenados por venda mais recente
                    return true;
                }).sort((a, b) => {
                    const dateA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
                    const dateB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
                    return dateB - dateA; 
                });
                setClients(active);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [fromDate]);

    const formatCurrency = (val: number) => 
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="w-10 h-10 border-4 border-[#5a79f2] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', background: 'var(--bg-main)', minHeight: '100%', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 40px 0' }}>
            <div className="mb-6 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-[#111827] transition-colors p-1"
                    >
                        <ChevronLeft size={28} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[32px] font-serif font-extrabold tracking-tight text-[#111827]">Clientes Ativos</h1>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-[8px] text-[13px] font-extrabold hover:bg-gray-50 transition-colors shadow-sm tracking-wide">
                    <Download size={16} strokeWidth={2.5}/>
                    EXPORTAR
                </button>
            </div>

            <div className="mb-6 flex items-center gap-4">
                <div className="flex flex-col gap-1 w-48">
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">A partir</label>
                    <input 
                        type="date" 
                        className="border border-gray-300 rounded-lg p-2.5 text-[14px] font-medium text-[#111827] outline-none focus:border-[#5a79f2] focus:ring-1 focus:ring-[#5a79f2] transition-shadow shadow-sm"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr className="border-b border-gray-200 bg-[#f8f9fa] text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                                <th className="p-5">Cliente</th>
                                <th className="p-5">Última Venda</th>
                                <th className="p-5 text-right">Total Pago (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => {
                                return (
                                    <tr key={client.id} className="hover:bg-[#f8f9fa] transition-colors group cursor-pointer" onClick={() => router.push(`/dashboard/customers/${client.id}`)}>
                                        <td className="p-5 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-extrabold text-[#111827] text-[14px] group-hover:text-[#5a79f2] transition-colors">{client.name}</span>
                                        </td>
                                        <td className="p-5 text-[14px] font-medium text-gray-600">
                                            {client.lastVisit ? format(new Date(client.lastVisit), "dd/MM/yyyy") : '-'}
                                        </td>
                                        <td className="p-5 text-[14px] font-extrabold text-[#111827] text-right">
                                            {formatCurrency(client.totalSpent || 0)}
                                        </td>
                                    </tr>
                                );
                            })}
                            {clients.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-12 text-center text-gray-500 font-medium text-[14px]">
                                        Nenhum cliente ativo encontrado no período.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </div>
    );
}
