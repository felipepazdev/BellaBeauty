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
                        <h1 className="text-[32px] font-serif font-black text-white tracking-tight">Relatório de Atendimentos</h1>
                        <p className="text-slate-500 font-medium italic">Análise detalhada de produtividade e serviços</p>
                    </div>
                </div>
                <button className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-8 py-3.5 rounded-2xl font-black text-[13px] flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] uppercase tracking-widest">
                    <Download size={18} strokeWidth={3}/>
                    Exportar PDF
                </button>
            </div>

            {/* Resumo - Dashboard de Indicadores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[30px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        Total de Vendas
                    </span>
                    <span className="text-2xl font-black text-white">{totalVendas}</span>
                </div>
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[30px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-500/5 blur-2xl rounded-full" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        Subtotal
                    </span>
                    <span className="text-2xl font-black text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[30px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-2xl rounded-full" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        Descontos
                    </span>
                    <span className="text-2xl font-black text-rose-500">{formatCurrency(0)}</span>
                </div>
                <div className="bg-gradient-to-br from-cyan-900/20 to-slate-900/40 backdrop-blur-xl border border-[#06b6d4]/20 p-6 rounded-[30px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#06b6d4]/10 blur-2xl rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-[#06b6d4] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <DollarSign size={14} className="text-[#06b6d4]"/>
                        Total Geral
                    </span>
                    <span className="text-2xl font-black text-white tracking-tight">{formatCurrency(total)}</span>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col lg:flex-row gap-5 bg-white/[0.03] p-6 rounded-[30px] border border-white/10 mb-10 items-end shadow-inner">
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 ml-1">De</label>
                        <div className="relative">
                            <Scissors className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input type="date" className="w-full h-12 bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 text-white text-sm focus:border-[#06b6d4]/50 outline-none transition-all" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 ml-1">Até</label>
                        <div className="relative">
                            <Scissors className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input type="date" className="w-full h-12 bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 text-white text-sm focus:border-[#06b6d4]/50 outline-none transition-all" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="space-y-2 w-full lg:max-w-md">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 ml-1">Pesquisar</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar cliente, item..."
                            className="w-full h-12 bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 text-white text-sm focus:border-[#06b6d4]/50 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Abas */}
            <div className="flex border-b border-white/5 mb-8 space-x-10 px-4">
                <button className="py-4 text-[11px] font-black text-[#06b6d4] border-b-2 border-[#06b6d4] uppercase tracking-[0.2em]">
                    Serviços & Produtos
                </button>
                <button className="py-4 text-[11px] font-black text-slate-600 border-b-2 border-transparent hover:text-white transition-colors uppercase tracking-[0.2em]">
                    Pacotes Vendidos
                </button>
            </div>

            {/* Tabela */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[35px] overflow-hidden shadow-2xl group">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-black/20 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                <th className="p-6">Venda</th>
                                <th className="p-6">Data/Hora</th>
                                <th className="p-6">Cliente</th>
                                <th className="p-6">Serviços / Itens</th>
                                <th className="p-6">Colaborador(es)</th>
                                <th className="p-6 text-right">Valor Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredRecords.map(record => (
                                <tr key={record.id} className="hover:bg-white/[0.03] transition-all cursor-pointer group/row">
                                    <td className="p-6 flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-[#06b6d4]/10 text-[#06b6d4]">
                                            {record.type === 'Comanda' ? <Scissors size={14}/> : <DollarSign size={14}/>}
                                        </div>
                                        <span className="font-black text-[#06b6d4] text-[13px]">{record.saleId}</span>
                                    </td>
                                    <td className="p-6 text-[13px] font-medium text-slate-400">
                                        {format(new Date(record.date), 'dd/MM/yyyy')} 
                                        <span className="text-slate-600 ml-2">{format(new Date(record.date), 'HH:mm')}</span>
                                    </td>
                                    <td className="p-6 text-[14px] font-bold text-white group-hover/row:text-[#06b6d4] transition-colors">
                                        {record.clientName}
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-wrap gap-2">
                                            {record.items.map((item, i) => (
                                                <span key={i} className="bg-white/5 px-3 py-1 rounded-lg text-slate-300 text-[11px] font-bold border border-white/5 group-hover/row:border-[#06b6d4]/20 transition-all">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-6 text-[13px] font-bold text-slate-400">
                                        {record.collaborators.length > 0 ? record.collaborators.join(', ') : 'N/A'}
                                    </td>
                                    <td className="p-6 text-[15px] font-black text-white text-right">
                                        {formatCurrency(record.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredRecords.length === 0 && (
                    <div className="py-20 text-center text-slate-600 font-medium italic">
                        Nenhum atendimento encontrado para os critérios selecionados.
                    </div>
                )}
            </div>
        </main>
    );
}
