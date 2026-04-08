'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download, ShoppingBag } from 'lucide-react';

interface PackageRecord {
    id: string;
    name: string;
    quantitySold: number;
    value: number;
}

export default function PackagesReport() {
    const router = useRouter();
    const [records, setRecords] = useState<PackageRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [monthYear, setMonthYear] = useState('');

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setRecords([
                { id: '1', name: 'Pacote Noiva Premium', quantitySold: 3, value: 4500 },
                { id: '2', name: 'Cronograma Capilar (4 sessões)', quantitySold: 12, value: 3600 },
                { id: '3', name: 'Spa Day Completo', quantitySold: 5, value: 1750 }
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

    const totalValue = records.reduce((acc, r) => acc + r.value, 0);

    return (
        <div className="animate-fade-in w-full pb-20">
            <div className="mb-6 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-[#111827] transition-colors p-1">
                        <ChevronLeft size={28} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-[32px] font-serif font-extrabold tracking-tight text-[#111827]">Pacotes</h1>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <ShoppingBag size={48} strokeWidth={1} className="text-gray-300 mb-4" />
                    <h3 className="text-[16px] font-extrabold text-[#111827] mb-1">Pacotes Mais Vendidos</h3>
                    <p className="text-[13px] text-gray-500 text-center">Gráficos de volumetria em desenvolvimento.</p>
                </div>

                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white">
                        <h2 className="font-extrabold text-[16px] text-[#111827]">Desempenho de Vendas (Pacotes)</h2>
                        <span className="text-[13px] font-bold text-gray-500">Total: {formatCurrency(totalValue)}</span>
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#f8f9fa] shadow-sm z-10">
                                <tr className="border-b border-gray-200 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                                    <th className="p-4">Pacote</th>
                                    <th className="p-4 text-center">Unidades Vendidas</th>
                                    <th className="p-4 text-right">Receita (R$)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.map(record => (
                                    <tr key={record.id} className="hover:bg-[#f8f9fa] transition-colors cursor-pointer group">
                                        <td className="p-4 font-extrabold text-[#111827] text-[14px] group-hover:text-[#5a79f2] transition-colors">{record.name}</td>
                                        <td className="p-4 text-[13px] font-bold text-gray-700 text-center">{record.quantitySold}</td>
                                        <td className="p-4 text-[14px] font-extrabold text-[#111827] text-right">{formatCurrency(record.value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
