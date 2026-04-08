'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    ChevronLeft, Calendar, Info, 
    ArrowUpRight, ArrowDownRight, 
    ChevronRight, ExternalLink,
    Search, Filter, Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentReportItem {
    id: string;
    date: string;
    clientName: string;
    category: string;
    serviceName: string;
    value: number;
    orderId: string;
}

interface AppointmentReport {
    summary: {
        totalRevenue: number;
        count: number;
        avgService: number;
        avgProduct: number;
        avgPackage: number;
    };
    appointments: AppointmentReportItem[];
}

export default function AppointmentsReportPage() {
    const router = useRouter();
    const now = new Date();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AppointmentReport | null>(null);
    
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
        
        api.get(`/finance/report/appointments?startDate=${s}&endDate=${e}`)
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
            <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
                
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <button 
                            onClick={() => router.back()}
                            style={{ 
                                background: 'transparent', border: 'none', cursor: 'pointer', 
                                color: 'var(--text-primary)', marginTop: 4 
                            }}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Relatório de Atendimentos</h1>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                                Confira informações detalhadas dos seus atendimentos, independente de pagamentos.
                            </p>
                        </div>
                    </div>
                </div>

                {/* SUMMARY CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                    <SummaryCard 
                        title="Valor total dos atendimentos" 
                        value={data?.summary.totalRevenue ?? 0}
                        subValue={`${data?.summary.count ?? 0} atendimentos`}
                        items={data?.topServices ?? []}
                    />
                    <SummaryCard 
                        title="Valor médio por serviço" 
                        value={data?.summary.avgService ?? 0}
                        subValue={`${data?.summary.count ?? 0} serviços`}
                        items={data?.topServices ?? []}
                    />
                    <SummaryCard 
                        title="Valor médio por produto" 
                        value={data?.summary.avgProduct ?? 0}
                        subValue="0 produtos"
                    />
                    <SummaryCard 
                        title="Valor médio por pacote" 
                        value={data?.summary.avgPackage ?? 0}
                        subValue="0 pacotes"
                    />
                </div>

                {/* DATE SELECTOR */}
                <div style={{ position: 'relative', width: 'fit-content' }}>
                    <button 
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        style={{ 
                            background: 'white', border: '1px solid var(--border)', padding: '8px 16px', 
                            borderRadius: 8, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                            cursor: 'pointer', color: showDatePicker ? '#3B82F6' : 'var(--text-primary)', transition: 'all 0.2s',
                            minWidth: 260, height: 40
                        }}
                    >
                        <Calendar size={14} />
                        {selectedStart ? format(selectedStart, 'dd MMMM yyyy', { locale: ptBR }) : '...'} - {selectedEnd ? format(selectedEnd, 'dd MMMM yyyy', { locale: ptBR }) : format(new Date(year, month, 0), 'dd MMMM yyyy', { locale: ptBR })}
                        <ChevronRight size={14} style={{ transform: showDatePicker ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }} />
                    </button>

                    {showDatePicker && (
                        <div style={{ 
                            position: 'absolute', top: '120%', left: 0, width: 320, background: 'white', 
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

                {/* TABLE */}
                <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={TH_STYLE}>Data da venda <ChevronRight size={10} style={{ transform: 'rotate(90deg)', marginLeft: 4 }} /></th>
                                    <th style={TH_STYLE}>cliente <ChevronRight size={10} style={{ transform: 'rotate(90deg)', marginLeft: 4 }} /></th>
                                    <th style={TH_STYLE}>categoria <ChevronRight size={10} style={{ transform: 'rotate(90deg)', marginLeft: 4 }} /></th>
                                    <th style={TH_STYLE}>serviço e produto <ChevronRight size={10} style={{ transform: 'rotate(90deg)', marginLeft: 4 }} /></th>
                                    <th style={TH_STYLE}>valor <ChevronRight size={10} style={{ transform: 'rotate(90deg)', marginLeft: 4 }} /></th>
                                    <th style={TH_STYLE}>comanda <ChevronRight size={10} style={{ transform: 'rotate(90deg)', marginLeft: 4 }} /></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando dados...</td>
                                    </tr>
                                ) : data?.appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum atendimento encontrado no período.</td>
                                    </tr>
                                ) : (
                                    data?.appointments.map((app) => (
                                        <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={TD_STYLE}>{format(new Date(app.date), 'dd/MM/yyyy')}</td>
                                            <td style={{ ...TD_STYLE, fontWeight: 700 }}>{app.clientName}</td>
                                            <td style={TD_STYLE}>{app.category}</td>
                                            <td style={TD_STYLE}>{app.serviceName}</td>
                                            <td style={{ ...TD_STYLE, fontWeight: 700 }}>{formatCurrency(app.value)}</td>
                                            <td style={TD_STYLE}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {app.orderId}
                                                    {app.orderId !== '-' && <ExternalLink size={12} color="#3B82F6" style={{ cursor: 'pointer' }} />}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

const TH_STYLE: React.CSSProperties = {
    padding: '16px 24px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const TD_STYLE: React.CSSProperties = {
    padding: '16px 24px',
    fontSize: '12px',
    color: 'var(--text-secondary)'
};

function SummaryCard({ title, value, subValue, items = [] }: any) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, height: 'fit-content', transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{title}</span>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800 }}>{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subValue}</p>
            </div>

            {expanded && items.length > 0 && (
                <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 12 }}>Mais vendidos</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {items.map((item: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.name}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                                    {item.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <button 
                    onClick={() => setExpanded(!expanded)}
                    style={{ 
                        padding: 4, border: '1.5px solid #3B82F6', color: '#3B82F6', 
                        borderRadius: 4, background: 'transparent', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                >
                    <ChevronRight size={12} style={{ transform: expanded ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }} />
                </button>
            </div>
        </div>
    );
}
