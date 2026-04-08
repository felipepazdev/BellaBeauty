'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download, Tag } from 'lucide-react';

interface DiscountRecord {
    id: string;
    name: string;
    quantity: number;
    totalDiscounted: number;
}

export default function DiscountsReport() {
    const router = useRouter();
    const [records, setRecords] = useState<DiscountRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [monthYear, setMonthYear] = useState('');

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setRecords([
                { id: '1', name: 'Desconto Fidelidade (10%)', quantity: 15, totalDiscounted: 450 },
                { id: '2', name: 'Promoção Mês da Mulher', quantity: 30, totalDiscounted: 1200 },
                { id: '3', name: 'Cortesia Pessoal', quantity: 2, totalDiscounted: 100 }
            ]);
            setLoading(false);
        }, 800);
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

    const overallDiscount = records.reduce((acc, r) => acc + r.totalDiscounted, 0);

    return (
        <div style={{ width: '100%', background: 'var(--bg-main)', minHeight: '100%', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 40px 0' }}>
            <div className="mb-6 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-[#111827] transition-colors p-1">
                        <ChevronLeft size={28} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[32px] font-serif font-extrabold tracking-tight text-[#111827]">Descontos</h1>
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

            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                        <Tag size={18} className="text-[#5a79f2]"/>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Histórico de Descontos Concedidos</h2>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr className="border-b border-gray-200 bg-[#f8f9fa] text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                                <th className="p-4">Desconto (Campanha / Motivo)</th>
                                <th className="p-4 text-center">Quantidade Aplicada</th>
                                <th className="p-4 text-right">Valor Descontado (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(record => (
                                <tr key={record.id} className="hover:bg-[#f8f9fa] transition-colors cursor-pointer group">
                                    <td className="p-4 font-extrabold text-[#111827] text-[14px] group-hover:text-[#5a79f2] transition-colors">{record.name}</td>
                                    <td className="p-4 text-[13px] font-bold text-gray-700 text-center">{record.quantity}</td>
                                    <td className="p-4 text-[14px] font-extrabold text-rose-500 text-right">- {formatCurrency(record.totalDiscounted)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-[#f8f9fa] border-t border-gray-200">
                            <tr>
                                <td className="p-4 font-extrabold text-gray-500 text-[14px] uppercase tracking-wider">Total Geral Concedido</td>
                                <td className="p-4"></td>
                                <td className="p-4 text-[16px] font-black text-[#111827] text-right">- {formatCurrency(overallDiscount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
