'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ChevronLeft, Download, Search, Scissors, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentRecord {
    id: string;
    saleId: string;
    date: string;
    clientName: string;
    items: string[];
    collaborators: string[];
    total: number;
    type: 'Comanda' | 'Venda Direta';
}

export default function AppointmentsReport() {
    const router = useRouter();
    const [records, setRecords] = useState<AppointmentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [summary, setSummary] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = {
                    startDate: dateFrom || undefined,
                    endDate: dateTo || undefined
                };
                
                const res = await api.get('/finance/report/appointments', { params });
                
                // Map records to the UI model
                const mapped: AppointmentRecord[] = res.data.appointments.map((a: any) => ({
                    id: a.id,
                    saleId: a.orderId,
                    date: a.date,
                    clientName: a.clientName,
                    items: [a.serviceName],
                    collaborators: [], // Backend doesn't return collaborators in this summary yet
                    total: a.value,
                    type: 'Comanda'
                }));

                setRecords(mapped);
                setSummary(res.data.summary);
            } catch (e) {
                console.error('Erro ao buscar atendimentos:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateFrom, dateTo]);

    const formatCurrency = (val: number) => 
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="w-10 h-10 border-4 border-[#5a79f2] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const totalVendas = summary?.count || 0;
    const subtotal = summary?.totalRevenue || 0;
    const total = subtotal; // Simulado sem descontos no exemplo

    const filteredRecords = records.filter(r => 
        r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.items.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="animate-fade-in w-full pb-20">
            <div className="mb-6 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-[#111827] transition-colors p-1">
                        <ChevronLeft size={28} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[32px] font-serif font-extrabold tracking-tight text-[#111827]">Relatório de Atendimentos</h1>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-[8px] text-[13px] font-extrabold hover:bg-gray-50 transition-colors shadow-sm tracking-wide">
                    <Download size={16} strokeWidth={2.5}/>
                    EXPORTAR
                </button>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <span className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        Total de vendas
                    </span>
                    <span className="text-2xl font-black text-[#111827]">{totalVendas}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <span className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        Subtotal
                    </span>
                    <span className="text-2xl font-black text-[#111827]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <span className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        Descontos
                    </span>
                    <span className="text-2xl font-black text-rose-500">{formatCurrency(0)}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <span className="text-[12px] font-extrabold text-[#5a79f2] uppercase tracking-widest mb-1 flex items-center gap-2">
                        <DollarSign size={14} className="text-[#5a79f2]"/>
                        Total
                    </span>
                    <span className="text-2xl font-black text-[#111827]">{formatCurrency(total)}</span>
                </div>
            </div>

            <div className="mb-6 flex gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-end flex-wrap">
                <div className="flex flex-col gap-1 w-40">
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">De</label>
                    <input type="date" className="border border-gray-300 rounded-lg p-2 text-[14px] font-medium focus:border-[#5a79f2] outline-none" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1 w-40">
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Até</label>
                    <input type="date" className="border border-gray-300 rounded-lg p-2 text-[14px] font-medium focus:border-[#5a79f2] outline-none" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Buscar</label>
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar cliente, item..."
                            className="w-full border border-gray-300 rounded-lg p-2 pl-10 text-[14px] font-medium focus:border-[#5a79f2] outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Abas simuladas conforme descrito */}
            <div className="flex border-b border-gray-200 mb-6 space-x-8">
                <button className="py-3 px-1 text-[13px] font-extrabold border-b-2 border-[#5a79f2] text-[#5a79f2] uppercase tracking-wide">
                    Serviços & Produtos
                </button>
                <button className="py-3 px-1 text-[13px] font-bold border-b-2 border-transparent text-gray-500 hover:text-gray-900 uppercase tracking-wide">
                    Pacotes Vendidos
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-[#f8f9fa] text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                                <th className="p-4">Venda</th>
                                <th className="p-4">Data/Hora</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Serviços / Itens</th>
                                <th className="p-4">Colaborador(es)</th>
                                <th className="p-4 text-right">Valor Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRecords.map(record => (
                                <tr key={record.id} className="hover:bg-[#f8f9fa] transition-colors cursor-pointer">
                                    <td className="p-4 flex items-center gap-2">
                                        {record.type === 'Comanda' ? <Scissors size={16} className="text-gray-400"/> : <DollarSign size={16} className="text-gray-400"/>}
                                        <span className="font-extrabold text-[#5a79f2] text-[14px]">{record.saleId}</span>
                                    </td>
                                    <td className="p-4 text-[13px] font-medium text-gray-600">{format(new Date(record.date), 'dd/MM/yyyy HH:mm')}</td>
                                    <td className="p-4 text-[14px] font-bold text-[#111827]">{record.clientName}</td>
                                    <td className="p-4 text-[13px] font-medium text-gray-600">
                                        <div className="flex flex-col gap-1">
                                            {record.items.map((item, i) => (
                                                <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 max-w-fit">{item}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-[13px] font-bold text-gray-700">{record.collaborators.join(', ')}</td>
                                    <td className="p-4 text-[14px] font-extrabold text-[#111827] text-right">{formatCurrency(record.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
