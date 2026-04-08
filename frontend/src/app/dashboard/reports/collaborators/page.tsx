'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ChevronLeft, Download, Trophy } from 'lucide-react';

interface CollaboratorRecord {
    id: string;
    name: string;
    avatarInitials: string;
    daysWorked: number;
    totalSalesQty: number;
    totalSalesValue: number;
    remuneration: number;
}

export default function CollaboratorsReport() {
    const router = useRouter();
    const [records, setRecords] = useState<CollaboratorRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [monthYear, setMonthYear] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let startDate: string | undefined;
                let endDate: string | undefined;

                if (monthYear) {
                    const [year, month] = monthYear.split('-').map(Number);
                    startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
                    endDate = new Date(year, month, 0).toISOString().split('T')[0];
                }

                const res = await api.get('/finance/report/collaborators', {
                    params: { startDate, endDate }
                });

                const rawData = res.data || [];
                const mapped: CollaboratorRecord[] = rawData.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    avatarInitials: p.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
                    daysWorked: p.daysCount || 0,
                    totalSalesQty: p.salesCount || 0,
                    totalSalesValue: p.totalSales || 0,
                    remuneration: p.commission || 0
                }));

                setRecords(mapped.sort((a, b) => b.totalSalesValue - a.totalSalesValue));
            } catch (e) {
                console.error('Erro ao buscar relatório de colaboradores:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [monthYear]);

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
        <div className="animate-fade-in w-full pb-20">
            <div className="mb-6 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-[#111827] transition-colors p-1">
                        <ChevronLeft size={28} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[32px] font-serif font-extrabold tracking-tight text-[#111827]">Colaboradores</h1>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-[8px] text-[13px] font-extrabold hover:bg-gray-50 transition-colors shadow-sm tracking-wide">
                    <Download size={16} strokeWidth={2.5}/>
                    EXPORTAR
                </button>
            </div>

            <div className="mb-6 flex gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-end w-fit">
                <div className="flex flex-col gap-1 w-48">
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Mês / Ano</label>
                    <input 
                        type="month" 
                        className="border border-gray-300 rounded-lg p-2 text-[14px] font-medium focus:border-[#5a79f2] outline-none" 
                        value={monthYear} 
                        onChange={(e) => setMonthYear(e.target.value)} 
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-gray-200 flex items-center gap-2 text-[#111827]">
                    <Trophy size={20} className="text-amber-500" />
                    <h2 className="font-extrabold text-[16px]">Ranking de Performance</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-[#f8f9fa] text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                                <th className="p-4 w-12 text-center">Pos</th>
                                <th className="p-4">Colaborador</th>
                                <th className="p-4 text-center">Dias c/ Atendimentos</th>
                                <th className="p-4 text-center">Qtd. Vendas</th>
                                <th className="p-4 text-right">Total Vendas</th>
                                <th className="p-4 text-right">Remuneração</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.map((record, idx) => (
                                <tr key={record.id} className="hover:bg-[#f8f9fa] transition-colors cursor-pointer group">
                                    <td className="p-4 text-center font-black text-gray-400">{idx + 1}º</td>
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#f8f9fa] border border-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs">
                                            {record.avatarInitials}
                                        </div>
                                        <span className="font-extrabold text-[#111827] text-[14px] group-hover:text-[#5a79f2] transition-colors">{record.name}</span>
                                    </td>
                                    <td className="p-4 text-[13px] font-bold text-gray-700 text-center">{record.daysWorked}</td>
                                    <td className="p-4 text-[13px] font-bold text-gray-700 text-center">{record.totalSalesQty}</td>
                                    <td className="p-4 text-[14px] font-extrabold text-[#111827] text-right">{formatCurrency(record.totalSalesValue)}</td>
                                    <td className="p-4 text-[14px] font-extrabold text-emerald-600 text-right">{formatCurrency(record.remuneration)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
