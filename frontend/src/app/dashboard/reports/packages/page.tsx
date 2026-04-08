'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
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
        const fetchData = async () => {
            setLoading(true);
            try {
                let year = new Date().getFullYear();
                let month = new Date().getMonth() + 1;

                if (monthYear) {
                    const [y, m] = monthYear.split('-').map(Number);
                    year = y;
                    month = m;
                }

                const res = await api.get('/finance/report/monthly', {
                    params: { year, month }
                });

                const stats = res.data.packagesStats || {};
                const mapped: PackageRecord[] = Object.entries(stats).map(([name, data]: [string, any], idx) => ({
                    id: String(idx),
                    name,
                    quantitySold: data.count,
                    value: data.revenue
                }));

                setRecords(mapped.sort((a, b) => b.value - a.value));
            } catch (e) {
                console.error('Erro ao buscar estatísticas de pacotes:', e);
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

    const totalValue = records.reduce((acc, r) => acc + r.value, 0);

    return (
        <div style={{ width: '100%', background: 'var(--bg-main)', minHeight: '100%', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 40px 0' }}>
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
                    <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Desempenho de Vendas (Pacotes)</h2>
                        <span className="text-[13px] font-bold text-gray-500">Total: {formatCurrency(totalValue)}</span>
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead className="sticky top-0 bg-[#f8f9fa] shadow-sm z-10">
                                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                                    <th className="p-4">Pacote</th>
                                    <th className="p-4 text-center">Unidades Vendidas</th>
                                    <th className="p-4 text-right">Receita (R$)</th>
                                </tr>
                            </thead>
                            <tbody>
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
