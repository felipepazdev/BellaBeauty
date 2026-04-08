'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ChevronLeft, Download, TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
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

                // Map transactions to the UI model
                const mapped: FinancialRecord[] = transactionsRes.data.map((t: any) => ({
                    id: t.id,
                    saleId: t.payment?.order?.id.substring(0, 5).toUpperCase() || (t.type === 'SAIDA' ? 'DESPESA' : 'AVULSO'),
                    date: t.createdAt,
                    clientName: t.payment?.order?.client?.name || t.description || 'N/A',
                    grossValue: t.amount,
                    fee: 0, // Backend might not calculate fee per transaction yet in this endpoint
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
            <div className="flex items-center justify-center h-[80vh]">
                <div className="w-10 h-10 border-4 border-[#5a79f2] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const totalRecebido = summary?.totalIncome || 0;
    const despesas = summary?.totalExpense || 0;
    const lucroLiquido = summary?.netBalance || 0;

    return (
        <div className="animate-fade-in w-full pb-20">
            <div className="mb-6 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-[#111827] transition-colors p-1">
                        <ChevronLeft size={28} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[32px] font-serif font-extrabold tracking-tight text-[#111827]">Relatório Financeiro</h1>
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
                        <TrendingUp size={14} className="text-emerald-500"/>
                        Valor Recebido
                    </span>
                    <span className="text-2xl font-black text-[#111827]">{formatCurrency(totalRecebido)}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <span className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <TrendingDown size={14} className="text-rose-500"/>
                        Despesas Pagas
                    </span>
                    <span className="text-2xl font-black text-[#111827]">{formatCurrency(despesas)}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <span className="text-[12px] font-extrabold text-[#5a79f2] uppercase tracking-widest mb-1 flex items-center gap-2">
                        <DollarSign size={14} className="text-[#5a79f2]"/>
                        Lucro Líquido
                    </span>
                    <span className="text-2xl font-black text-[#111827]">{formatCurrency(lucroLiquido)}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <span className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <CreditCard size={14} className="text-orange-500"/>
                        Créditos Disponíveis
                    </span>
                    <span className="text-2xl font-black text-[#111827]">{formatCurrency(0)}</span>
                </div>
            </div>

            <div className="mb-6 flex gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-end">
                <div className="flex flex-col gap-1 w-40">
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">De</label>
                    <input type="date" className="border border-gray-300 rounded-lg p-2 text-[14px] font-medium focus:border-[#5a79f2] focus:ring-1 focus:ring-[#5a79f2]" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1 w-40">
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Até</label>
                    <input type="date" className="border border-gray-300 rounded-lg p-2 text-[14px] font-medium focus:border-[#5a79f2] focus:ring-1 focus:ring-[#5a79f2]" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                {/* Simulated Estabelecimento Filter */}
                <div className="flex flex-col gap-1 flex-1 max-w-xs">
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Estabelecimento</label>
                    <select className="border border-gray-300 rounded-lg p-2 text-[14px] font-medium focus:border-[#5a79f2] focus:ring-1 focus:ring-[#5a79f2] bg-white text-gray-900">
                        <option>Bella Beauty (Matriz)</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-gray-200 bg-white flex justify-between items-center">
                    <h2 className="font-bold text-[#111827] text-[16px]">Formas de Pagamento</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-[#f8f9fa] text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                                <th className="p-4">Venda</th>
                                <th className="p-4">Data/Hora</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4 text-right">Valor</th>
                                <th className="p-4 text-right">Taxa</th>
                                <th className="p-4 text-right">Valor Líquido</th>
                                <th className="p-4">Forma de Pag.</th>
                                <th className="p-4">Lançamento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.map(record => (
                                <tr key={record.id} className="hover:bg-[#f8f9fa] transition-colors cursor-pointer">
                                    <td className="p-4 font-extrabold text-[#5a79f2] text-[14px]">{record.saleId}</td>
                                    <td className="p-4 text-[13px] font-medium text-gray-600">{format(new Date(record.date), 'dd/MM/yyyy HH:mm')}</td>
                                    <td className="p-4 text-[14px] font-bold text-[#111827]">{record.clientName}</td>
                                    <td className="p-4 text-[14px] font-medium text-gray-600 text-right">{formatCurrency(record.grossValue)}</td>
                                    <td className="p-4 text-[14px] font-medium text-rose-500 text-right">{formatCurrency(record.fee)}</td>
                                    <td className="p-4 text-[14px] font-extrabold text-[#111827] text-right">{formatCurrency(record.netValue)}</td>
                                    <td className="p-4 text-[13px] font-bold text-gray-700">{record.paymentMethod}</td>
                                    <td className="p-4 text-[12px] font-bold">
                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md uppercase tracking-wider">{record.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
