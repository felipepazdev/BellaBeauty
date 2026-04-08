'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ChevronLeft, Download, TrendingUp, TrendingDown, DollarSign, CreditCard, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface FinancialRecord {
    id: string;
    saleId: string;
    date: string;
    clientName: string;
    grossValue: number;
    fee: number;
    netValue: number;
    paymentMethod: string;
    status: string;
}

export default function FinanceReport() {
    const router = useRouter();
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [summary, setSummary] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = {
                    startDate: dateFrom || undefined,
                    endDate: dateTo || undefined
                };
                
                const [transactionsRes, summaryRes] = await Promise.all([
                    api.get('/finance/transactions', { params }),
                    api.get('/finance/summary', { params })
                ]);

                const mapped: FinancialRecord[] = transactionsRes.data.map((t: any) => ({
                    id: t.id,
                    saleId: t.payment?.order?.id.substring(0, 5).toUpperCase() || (t.type === 'SAIDA' ? 'DESPESA' : 'AVULSO'),
                    date: t.createdAt,
                    clientName: t.payment?.order?.client?.name || t.description || 'N/A',
                    grossValue: t.amount,
                    fee: 0,
                    netValue: t.amount,
                    paymentMethod: t.method === 'CREDIT_CARD' ? 'Cartão' : t.method === 'PIX' ? 'Pix' : 'Dinheiro',
                    status: 'Conciliado'
                }));

                setRecords(mapped);
                setSummary(summaryRes.data);
            } catch (e) {
                console.error('Erro ao carregar financeiro:', e);
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
            <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
                <div className="w-12 h-12 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const totalRecebido = summary?.totalIncome || 0;
    const despesas = summary?.totalExpense || 0;
    const lucroLiquido = summary?.netBalance || 0;

    return (
        <main className="min-h-screen p-4 sm:p-8 animate-fade-in bg-[#0a0a0c]">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()} 
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <ChevronLeft size={24} strokeWidth={2.5} />
                    </button>
                    <div>
                        <h1 className="text-[32px] font-serif font-black text-white tracking-tight">Fluxo Financeiro</h1>
                        <p className="text-slate-500 font-medium italic">Monitoramento em tempo real do capital</p>
                    </div>
                </div>
                <button className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-8 py-3.5 rounded-2xl font-black text-[13px] flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] uppercase tracking-widest">
                    <Download size={18} strokeWidth={3}/>
                    Gerar PDF
                </button>
            </div>

            {/* ── Dashboard de Indicadores ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[30px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-2xl rounded-full" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <TrendingUp size={14} className="text-emerald-500"/>
                        Receita Bruta
                    </span>
                    <span className="text-2xl font-black text-white">{formatCurrency(totalRecebido)}</span>
                </div>
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[30px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-2xl rounded-full" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <TrendingDown size={14} className="text-rose-500"/>
                        Saídas / Custos
                    </span>
                    <span className="text-2xl font-black text-white">{formatCurrency(despesas)}</span>
                </div>
                <div className="bg-gradient-to-br from-cyan-900/20 to-slate-900/40 backdrop-blur-xl border border-[#06b6d4]/20 p-6 rounded-[30px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#06b6d4]/10 blur-2xl rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-[#06b6d4] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <DollarSign size={14} className="text-[#06b6d4]"/>
                        Lucro Líquido
                    </span>
                    <span className="text-2xl font-black text-white tracking-tight">{formatCurrency(lucroLiquido)}</span>
                </div>
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[30px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 blur-2xl rounded-full" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <CreditCard size={14} className="text-orange-500"/>
                        Pendentes
                    </span>
                    <span className="text-2xl font-black text-white">{formatCurrency(0)}</span>
                </div>
            </div>

            {/* ── Filtros de Período ── */}
            <div className="flex flex-col lg:flex-row gap-5 bg-white/[0.03] p-6 rounded-[30px] border border-white/10 mb-10 items-end shadow-inner">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 ml-1">Data Inicial</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input type="date" className="w-full h-12 bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 text-white text-sm focus:border-[#06b6d4]/50 outline-none transition-all" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 ml-1">Data Final</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input type="date" className="w-full h-12 bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 text-white text-sm focus:border-[#06b6d4]/50 outline-none transition-all" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="space-y-2 w-full lg:max-w-xs">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 ml-1">Estabelecimento</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                        <select className="w-full h-12 bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 text-white text-sm font-bold focus:border-[#06b6d4]/50 outline-none appearance-none">
                            <option>Bella Beauty (Matriz)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Tabela de Lançamentos ── */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[35px] overflow-hidden shadow-2xl group">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <h2 className="font-serif font-black text-white text-[18px]">Extrato Detalhado de Operações</h2>
                    <span className="text-[10px] font-black text-[#06b6d4] uppercase tracking-widest bg-[#06b6d4]/10 px-4 py-1.5 rounded-full">Sincronizado</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-black/20 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                <th className="p-6">Referência</th>
                                <th className="p-6">Data/Hora</th>
                                <th className="p-6">Origem / Cliente</th>
                                <th className="p-6 text-right">Valor Bruto</th>
                                <th className="p-6 text-right">Encargos</th>
                                <th className="p-6 text-right">Recebimento</th>
                                <th className="p-6">Método</th>
                                <th className="p-6">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {records.map(record => (
                                <tr key={record.id} className="hover:bg-white/[0.03] transition-all cursor-pointer group/row">
                                    <td className="p-6">
                                        <span className="font-black text-[#06b6d4] text-[13px] bg-[#06b6d4]/10 px-3 py-1 rounded-lg">
                                            {record.saleId}
                                        </span>
                                    </td>
                                    <td className="p-6 text-[13px] font-medium text-slate-400">
                                        {format(new Date(record.date), 'dd/MM/yyyy')} 
                                        <span className="text-slate-600 ml-2">{format(new Date(record.date), 'HH:mm')}</span>
                                    </td>
                                    <td className="p-6 text-[14px] font-bold text-white group-hover/row:text-[#06b6d4] transition-colors">
                                        {record.clientName}
                                    </td>
                                    <td className="p-6 text-[14px] font-bold text-slate-300 text-right">
                                        {formatCurrency(record.grossValue)}
                                    </td>
                                    <td className="p-6 text-[14px] font-bold text-rose-500/80 text-right">
                                        -{formatCurrency(record.fee)}
                                    </td>
                                    <td className="p-6 text-[15px] font-black text-white text-right">
                                        {formatCurrency(record.netValue)}
                                    </td>
                                    <td className="p-6 text-[12px] font-black text-slate-500 uppercase tracking-widest italic">
                                        {record.paymentMethod}
                                    </td>
                                    <td className="p-6">
                                        <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {records.length === 0 && (
                    <div className="py-20 text-center text-slate-600 font-medium italic">
                        Nenhuma transação encontrada para o período selecionado.
                    </div>
                )}
            </div>
        </main>
    );
}
