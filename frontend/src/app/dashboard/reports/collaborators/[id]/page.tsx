'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import {
    ChevronLeft, RefreshCcw, 
    ChevronRight, ExternalLink,
    ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Metrics {
    atendimento: { count: number; total: number; packageCount: number };
    productSales: { count: number; total: number };
    packageSales: { count: number; total: number };
    creditsSold: { count: number; total: number };
    commissions: { total: number; received: number };
    tips: { total: number; received: number };
    advances: { total: number };
    activeDays: number;
    productCost: number;
}

interface CollaboratorDetail {
    name: string;
    metrics: Metrics;
}

export default function CollaboratorDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const now = new Date();
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CollaboratorDetail | null>(null);
    // Layout and Navigation State
    const [viewMode, setViewMode] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('MONTHLY');
    const [baseDate, setBaseDate] = useState(new Date());
    const [showDropdown, setShowDropdown] = useState(false);
    
    // Custom Date Picker States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [activeTab, setActiveTab] = useState<'dates' | 'months'>('dates');
    const [year] = useState(now.getFullYear());
    const [month] = useState(now.getMonth() + 1);
    const [selectedStart, setSelectedStart] = useState<Date | null>(new Date(now.getFullYear(), now.getMonth(), 1));
    const [selectedEnd, setSelectedEnd] = useState<Date | null>(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    useEffect(() => {
        if (viewMode !== 'CUSTOM') {
            fetchReportData();
        }
    }, [id, viewMode, baseDate]);

    const getPeriodRange = (mode: string, date: Date) => {
        const d = new Date(date);
        let start: Date;
        let end: Date;

        if (mode === 'DAILY') {
            start = new Date(d.setHours(0, 0, 0, 0));
            end = new Date(d.setHours(23, 59, 59, 999));
        } else if (mode === 'WEEKLY') {
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            start = new Date(d.setDate(diff));
            start.setHours(0, 0, 0, 0);
            
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
        } else if (mode === 'MONTHLY') {
            start = new Date(d.getFullYear(), d.getMonth(), 1);
            end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        } else {
            // CUSTOM mode
            start = selectedStart || new Date(d.getFullYear(), d.getMonth(), 1);
            end = selectedEnd || new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        return { start, end };
    };

    const fetchReportData = () => {
        setLoading(true);
        const { start, end } = getPeriodRange(viewMode, baseDate);
        
        const s = format(start, 'yyyy-MM-dd');
        const e = format(end, 'yyyy-MM-dd');
        
        api.get(`/finance/report/collaborators/${id}?startDate=${s}&endDate=${e}`)
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleFilter = () => {
        if (selectedStart && selectedEnd) {
            setViewMode('CUSTOM');
            fetchReportData();
        }
        setShowDatePicker(false);
    };

    const clearFilter = () => {
        const s = new Date(now.getFullYear(), now.getMonth(), 1);
        const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setSelectedStart(s);
        setSelectedEnd(e);
        setViewMode('MONTHLY');
        setBaseDate(now);
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

    const navigatePeriod = (direction: 'next' | 'prev') => {
        const { start } = getPeriodRange(viewMode, baseDate);
        const d = new Date(start);
        const modifier = direction === 'next' ? 1 : -1;

        if (viewMode === 'DAILY') {
            d.setDate(d.getDate() + modifier);
        } else if (viewMode === 'WEEKLY') {
            d.setDate(d.getDate() + (7 * modifier));
        } else if (viewMode === 'MONTHLY') {
            d.setMonth(d.getMonth() + modifier);
        }
        setBaseDate(d);
    };

    const getPeriodLabel = () => {
        const { start, end } = getPeriodRange(viewMode, baseDate);
        if (viewMode === 'DAILY') return format(start, 'dd MMMM yyyy', { locale: ptBR });
        if (viewMode === 'WEEKLY') return `${format(start, 'dd')} - ${format(end, 'dd MMMM yyyy', { locale: ptBR })}`;
        if (viewMode === 'MONTHLY') return format(start, 'MMMM/yyyy', { locale: ptBR });
        return `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`;
    };

    if (!data && loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>;

    return (
        <div style={{ width: '100%', background: '#fff', minHeight: '100vh', padding: '24px' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
                
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <ChevronLeft size={24} color="#000" />
                        </button>
                        <h1 style={{ fontSize: 20, fontWeight: 700 }}>{data?.name || 'Carregando...'}</h1>
                    </div>
                    <button onClick={() => fetchReportData()} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <RefreshCcw size={20} color="#000" />
                    </button>
                </div>

                {/* PERIOD NAV */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 500 }}>Informações Gerais</h2>
                    
                    {/* PERIOD SELECTOR */}
                    <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button 
                                onClick={() => navigatePeriod('prev')}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <ChevronLeft size={20}/>
                            </button>
                            
                            <button 
                                onClick={() => setShowDropdown(!showDropdown)}
                                style={{ 
                                    background: 'transparent', border: 'none', fontSize: 16, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
                                    cursor: 'pointer', color: 'var(--text-primary)'
                                }}
                            >
                                {getPeriodLabel()}
                                <ChevronDown size={14} />
                            </button>
                            
                            <button 
                                onClick={() => navigatePeriod('next')}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <ChevronRight size={20}/>
                            </button>
                        </div>

                        {showDropdown && (
                            <div style={{ 
                                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 220, background: 'white', 
                                borderRadius: 8, border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginTop: 8
                            }}>
                                {['Dia', 'Semana', 'Mês', 'Personalizado'].map((opt) => (
                                    <button 
                                        key={opt}
                                        onClick={() => {
                                            if (opt === 'Dia') setViewMode('DAILY');
                                            if (opt === 'Semana') setViewMode('WEEKLY');
                                            if (opt === 'Mês') setViewMode('MONTHLY');
                                            if (opt === 'Personalizado') {
                                                setShowDropdown(false);
                                                setShowDatePicker(true);
                                                return;
                                            }
                                            setShowDropdown(false);
                                        }}
                                        style={{ 
                                            padding: '12px 16px', background: 'transparent', border: 'none', textAlign: 'left', 
                                            fontSize: 14, fontWeight: 400, color: '#000', cursor: 'pointer', borderBottom: opt !== 'Personalizado' ? '1px solid #f1f5f9' : 'none'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* CUSTOM DATE PICKER */}
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
                                    <button onClick={handleFilter} style={{ flex: 1, padding: '10px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>Aplicar Filtro</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* METRICS GRID */}
                {data && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        
                        {/* ATENDIMENTO */}
                        <MetricCard 
                            title="Atendimento"
                            rows={[
                                { label: 'QUANTIDADE', value: data.metrics.atendimento.count },
                                { label: 'QUANTIDADE EM PACOTES', value: data.metrics.atendimento.packageCount },
                                { label: 'VALOR TOTAL', value: formatCurrency(data.metrics.atendimento.total), isHighlight: true }
                            ]}
                        />

                        {/* VENDAS PRODUTOS */}
                        <MetricCard 
                            title="Vendas Produtos"
                            rows={[
                                { label: 'QUANTIDADE', value: data.metrics.productSales.count },
                                { label: 'VALOR TOTAL', value: formatCurrency(data.metrics.productSales.total), isHighlight: true }
                            ]}
                        />

                        {/* VENDAS PACOTES */}
                        <MetricCard 
                            title="Vendas Pacotes"
                            rows={[
                                { label: 'QUANTIDADE', value: data.metrics.packageSales.count },
                                { label: 'VALOR TOTAL', value: formatCurrency(data.metrics.packageSales.total), isHighlight: true }
                            ]}
                        />

                        {/* CRÉDITOS VENDIDOS */}
                        <MetricCard 
                            title="Créditos Vendidos"
                            rows={[
                                { label: 'QUANTIDADE', value: data.metrics.creditsSold.count },
                                { label: 'VALOR TOTAL', value: formatCurrency(data.metrics.creditsSold.total), isHighlight: true }
                            ]}
                        />

                        {/* COMISSÕES TOTAIS */}
                        <MetricCard 
                            title="Valor Comissões Totais"
                            rows={[
                                { label: '', value: formatCurrency(data.metrics.commissions.total), isLarge: true }
                            ]}
                        />

                        {/* COMISSÕES RECEBIDAS */}
                        <MetricCard 
                            title="Valor Comissões Recebidas"
                            rows={[
                                { label: '', value: formatCurrency(data.metrics.commissions.received), isLarge: true }
                            ]}
                        />

                        {/* GORJETAS TOTAIS */}
                        <MetricCard 
                            title="Valor Total Gorjetas"
                            rows={[
                                { label: '', value: formatCurrency(data.metrics.tips.total), isLarge: true }
                            ]}
                        />

                        {/* GORJETAS RECEBIDAS */}
                        <MetricCard 
                            title="Valor Gorjetas Recebidas"
                            rows={[
                                { label: '', value: formatCurrency(data.metrics.tips.received), isLarge: true }
                            ]}
                        />

                        {/* VALES */}
                        <MetricCard 
                            title="Valor Total Vales"
                            rows={[
                                { label: '', value: formatCurrency(data.metrics.advances.total), isLarge: true }
                            ]}
                        />

                        {/* DIAS COM ATENDIMENTO */}
                        <div style={CARD_STYLE}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ color: '#06b6d4', fontWeight: 700, fontSize: 13 }}>Dias com Atendimento</span>
                            </div>
                            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>Quantidade de dias que o colaborador realizou atendimentos.</p>
                            <span style={{ fontSize: 18, fontWeight: 800 }}>{data.metrics.activeDays}</span>
                        </div>

                         {/* GASTO TOTAL PRODUTOS */}
                         <div style={CARD_STYLE}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ color: '#06b6d4', fontWeight: 700, fontSize: 13 }}>Gasto Total Produtos</span>
                                <ExternalLink size={14} color="#06b6d4" />
                            </div>
                            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>Valor total gasto com produtos durante os atendimentos.</p>
                            <span style={{ fontSize: 18, fontWeight: 800 }}>{formatCurrency(data.metrics.productCost)}</span>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

function MetricCard({ title, rows }: { title: string, rows: { label: string, value: string | number, isHighlight?: boolean, isLarge?: boolean }[] }) {
    return (
        <div style={CARD_STYLE}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ color: '#06b6d4', fontWeight: 700, fontSize: 13 }}>{title}</span>
                <ExternalLink size={14} color="#06b6d4" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rows.map((row, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {row.label && <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B' }}>{row.label}</span>}
                        <span style={{ 
                            fontSize: row.isLarge ? 20 : 13, 
                            fontWeight: row.isHighlight || row.isLarge ? 800 : 500,
                            color: row.isLarge || row.isHighlight ? '#000' : '#475569'
                        }}>
                            {row.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const CARD_STYLE: React.CSSProperties = {
    background: '#fff',
    borderRadius: 16,
    border: '1px border solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};
