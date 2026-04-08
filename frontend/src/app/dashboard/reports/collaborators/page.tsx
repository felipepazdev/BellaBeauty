'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    ChevronLeft, Calendar, 
    ChevronRight, ExternalLink,
    Filter, Download, ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CollaboratorReportItem {
    id: string;
    name: string;
    daysCount: number;
    salesCount: number;
    totalSales: number;
    commission: number;
}

export default function CollaboratorsReportPage() {
    const router = useRouter();
    const now = new Date();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CollaboratorReportItem[]>([]);
    
    // Date Picker States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [activeTab, setActiveTab] = useState<'dates' | 'months'>('dates');
    const [year] = useState(now.getFullYear());
    const [month] = useState(now.getMonth() + 1);
    const [selectedStart, setSelectedStart] = useState<Date | null>(new Date(now.getFullYear(), now.getMonth(), 1));
    const [selectedEnd, setSelectedEnd] = useState<Date | null>(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = (start?: string, end?: string) => {
        setLoading(true);
        const s = start || format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
        const e = end || format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
        
        api.get(`/finance/report/collaborators?startDate=${s}&endDate=${e}`)
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleFilter = () => {
        if (selectedStart && selectedEnd) {
            fetchData(format(selectedStart, 'yyyy-MM-dd'), format(selectedEnd, 'yyyy-MM-dd'));
        }
        setShowDatePicker(false);
    };

    const clearFilter = () => {
        const s = new Date(now.getFullYear(), now.getMonth(), 1);
        const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setSelectedStart(s);
        setSelectedEnd(e);
        fetchData(format(s, 'yyyy-MM-dd'), format(e, 'yyyy-MM-dd'));
        setShowDatePicker(false);
    };

    const formatCurrency = (val: number) => 
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Calendar logic helpers
    const calendarDays = useMemo(() => {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        const days = [];
        for (let i = 0; i < startOfMonth.getDay(); i++) days.push(null);
        for (let i = 1; i <= endOfMonth.getDate(); i++) days.push(i);
        return days;
    }, [year, month]);

    const handleDayClick = (d: number, m: number, y: number) => {
        const day = new Date(y, m, d);
        if (!selectedStart || (selectedStart && selectedEnd)) {
            setSelectedStart(day);
            setSelectedEnd(null);
        } else {
            if (day < selectedStart) {
                setSelectedStart(day);
            } else {
                setSelectedEnd(day);
            }
        }
    };

    const isSelected = (d: number, m: number, y: number) => {
        const day = new Date(y, m, d);
        if (selectedStart && !selectedEnd) return day.getTime() === selectedStart.getTime();
        if (selectedStart && selectedEnd) return day >= selectedStart && day <= selectedEnd;
        return false;
    };

    return (
        <div style={{ width: '100%', background: 'var(--bg-main)', minHeight: '100%', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40 }}>
                
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button 
                            onClick={() => router.back()}
                            style={{ 
                                background: 'transparent', border: 'none', cursor: 'pointer', 
                                color: 'var(--text-primary)'
                            }}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Colaboradores</h1>
                    </div>
                    <button style={{ background: 'transparent', border: 'none', fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', cursor: 'pointer' }}>
                        EXPORTAR
                    </button>
                </div>

                {/* GENERAL INFO SECTION */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 600 }}>Informações Gerais</h2>
                    
                    {/* PERIOD SELECTOR */}
                    <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><ChevronLeft size={20}/></button>
                            <button 
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                style={{ 
                                    background: 'transparent', border: 'none', fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                                    cursor: 'pointer', color: 'var(--text-primary)'
                                }}
                            >
                                {selectedStart ? format(selectedStart, 'dd MMMM yyyy', { locale: ptBR }) : format(now, 'MMMM/yyyy', { locale: ptBR })}
                                <ChevronDown size={18} />
                            </button>
                            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><ChevronRight size={20}/></button>
                        </div>

                        {showDatePicker && (
                            <div style={{ 
                                position: 'absolute', top: '120%', left: '50%', transform: 'translateX(-50%)', width: 320, background: 'white', 
                                borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                zIndex: 100, overflow: 'hidden'
                            }}>
                                <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', gap: 4 }}>
                                    <button onClick={() => setActiveTab('dates')} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, background: activeTab === 'dates' ? '#3B82F6' : 'transparent', color: activeTab === 'dates' ? 'white' : 'var(--text-muted)' }}>Datas</button>
                                    <button onClick={() => setActiveTab('months')} style={{ flex: 1, padding: '8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: activeTab === 'months' ? '#3B82F6' : 'transparent', border: activeTab === 'months' ? 'none' : '1px solid var(--border)', color: activeTab === 'months' ? 'white' : 'var(--text-muted)' }}>Meses</button>
                                </div>
                                <div style={{ padding: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><ChevronLeft size={16}/></button>
                                        <span style={{ fontSize: 14, fontWeight: 700 }}>{year}</span>
                                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><ChevronRight size={16}/></button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, textAlign: 'center' }}>
                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
                                            <span key={d} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>{d}</span>
                                        ))}
                                        {calendarDays.map((d, i) => {
                                            if (d === null) return <div key={i} />;
                                            const active = isSelected(d, month - 1, year);
                                            return (
                                                <div key={i} onClick={() => handleDayClick(d, month - 1, year)} style={{ fontSize: 11, fontWeight: 600, padding: '8px 0', cursor: 'pointer', background: active ? '#3B82F6' : 'transparent', color: active ? 'white' : 'var(--text-secondary)', borderRadius: active ? '50%' : '0' }}>{d}</div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                                    <button onClick={clearFilter} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #3B82F6', color: '#3B82F6', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>Limpar filtro</button>
                                    <button onClick={handleFilter} style={{ flex: 1, padding: '10px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>Filtrar</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* TABLE */}
                <div style={{ width: '100%', background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={TH_STYLE}>Colaborador</th>
                                <th style={{ ...TH_STYLE, textAlign: 'center', width: 140 }}>Dias com Atendimentos</th>
                                <th style={{ ...TH_STYLE, textAlign: 'center', width: 120 }}>Qtd. Vendas</th>
                                <th style={{ ...TH_STYLE, textAlign: 'right', width: 140 }}>Total Vendas</th>
                                <th style={{ ...TH_STYLE, textAlign: 'right', width: 140 }}>Remuneração</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum dado encontrado no período.</td></tr>
                            ) : data.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={TD_STYLE}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</span>
                                            <button 
                                                onClick={() => router.push(`/dashboard/reports/collaborators/${item.id}`)}
                                                style={{ background: 'transparent', border: 'none', padding: 0, color: '#E91E63', fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
                                            >
                                                Ver Dados Completos
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ ...TD_STYLE, textAlign: 'center' }}>{item.daysCount}</td>
                                    <td style={{ ...TD_STYLE, textAlign: 'center' }}>{item.salesCount}</td>
                                    <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.totalSales)}</td>
                                    <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.commission)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}

const TH_STYLE: React.CSSProperties = {
    padding: '24px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#64748b',
    background: '#fff'
};

const TD_STYLE: React.CSSProperties = {
    padding: '20px 24px',
    fontSize: '13px',
    color: 'var(--text-secondary)'
};
