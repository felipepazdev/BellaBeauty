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
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    // Default to current month
    const [selectedStart, setSelectedStart] = useState<Date>(new Date(now.getFullYear(), now.getMonth(), 1));
    const [selectedEnd, setSelectedEnd] = useState<Date>(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = (overrideStart?: Date, overrideEnd?: Date) => {
        setLoading(true);
        const s = format(overrideStart || selectedStart, 'yyyy-MM-dd');
        const e = format(overrideEnd || selectedEnd, 'yyyy-MM-dd');
        
        api.get(`/finance/report/collaborators/${id}?startDate=${s}&endDate=${e}`)
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const formatCurrency = (val: number) => 
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
                    <button onClick={() => fetchData()} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <RefreshCcw size={20} color="#000" />
                    </button>
                </div>

                {/* PERIOD NAV */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 600 }}>Informações Gerais</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button style={{ background: 'transparent', border: 'none', color: '#94a3b8' }}><ChevronLeft size={20}/></button>
                        <div style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {format(selectedStart, 'MMMM/yyyy', { locale: ptBR })}
                            <ChevronDown size={14} />
                        </div>
                        <button style={{ background: 'transparent', border: 'none', color: '#94a3b8' }}><ChevronRight size={20}/></button>
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
                                <span style={{ color: '#E91E63', fontWeight: 700, fontSize: 13 }}>Dias com Atendimento</span>
                            </div>
                            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>Quantidade de dias que o colaborador realizou atendimentos.</p>
                            <span style={{ fontSize: 18, fontWeight: 800 }}>{data.metrics.activeDays}</span>
                        </div>

                         {/* GASTO TOTAL PRODUTOS */}
                         <div style={CARD_STYLE}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ color: '#E91E63', fontWeight: 700, fontSize: 13 }}>Gasto Total Produtos</span>
                                <ExternalLink size={14} color="#E91E63" />
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
                <span style={{ color: '#E91E63', fontWeight: 700, fontSize: 13 }}>{title}</span>
                <ExternalLink size={14} color="#E91E63" />
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
