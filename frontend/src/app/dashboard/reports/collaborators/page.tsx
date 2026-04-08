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
                        <h1 className="text-[32px] font-serif font-black text-white tracking-tight">Relatório de Colaboradores</h1>
                        <p className="text-slate-500 font-medium italic">Ranking de produtividade e rentabilidade da equipe</p>
                    </div>
                </div>
                <button className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-8 py-3.5 rounded-2xl font-black text-[13px] flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] uppercase tracking-widest">
                    <Download size={18} strokeWidth={3}/>
                    Exportar PDF
                </button>
            </div>

            {/* Filtro de Período */}
            <div className="mb-10 w-fit bg-white/[0.03] p-6 rounded-[30px] border border-white/10 shadow-inner">
                <div className="flex flex-col gap-2 w-52">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 ml-1">Mês / Ano</label>
                    <div className="relative">
                        <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                        <input 
                            type="month" 
                            className="w-full h-12 bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 text-white text-sm focus:border-[#06b6d4]/50 outline-none transition-all" 
                            value={monthYear} 
                            onChange={(e) => setMonthYear(e.target.value)} 
                        />
                    </div>
                </div>
            </div>

            {/* Tabela de Lançamentos */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[35px] overflow-hidden shadow-2xl group">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Trophy size={22} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                        <h2 className="font-serif font-black text-white text-[18px]">Ranking de Performance e Ganhos</h2>
                    </div>
                    <span className="text-[10px] font-black text-[#06b6d4] uppercase tracking-widest bg-[#06b6d4]/10 px-4 py-1.5 rounded-full">Sincronizado</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-black/20 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                <th className="p-6 w-16 text-center">Pos</th>
                                <th className="p-6">Colaborador</th>
                                <th className="p-6 text-center">Dias Ativos</th>
                                <th className="p-6 text-center">Total Vendas</th>
                                <th className="p-6 text-right">Volume (Bruto)</th>
                                <th className="p-6 text-right">Mão de Obra</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {records.map((record, idx) => (
                                <tr key={record.id} className="hover:bg-white/[0.03] transition-all cursor-pointer group/row">
                                    <td className="p-6 text-center font-black text-slate-600 text-[13px]">
                                        {idx === 0 ? (
                                            <span className="text-amber-500 text-lg">👑</span>
                                        ) : (
                                            `${idx + 1}º`
                                        )}
                                    </td>
                                    <td className="p-6 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0c0c10] to-slate-900 border border-white/10 text-[#06b6d4] flex items-center justify-center font-black text-xs group-hover/row:scale-110 transition-all">
                                            {record.avatarInitials}
                                        </div>
                                        <span className="font-bold text-white text-[15px] group-hover/row:text-[#06b6d4] transition-colors">{record.name}</span>
                                    </td>
                                    <td className="p-6 text-[13px] font-bold text-slate-400 text-center">{record.daysWorked}</td>
                                    <td className="p-6 text-[13px] font-bold text-slate-400 text-center">{record.totalSalesQty}</td>
                                    <td className="p-6 text-[14px] font-black text-white text-right">{formatCurrency(record.totalSalesValue)}</td>
                                    <td className="p-6 text-[15px] font-black text-emerald-400 text-right">{formatCurrency(record.remuneration)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {records.length === 0 && (
                    <div className="py-20 text-center text-slate-600 font-medium italic">
                        Nenhum dado de performance disponível para este período.
                    </div>
                )}
            </div>
        </main>
    );
}
