'use client';

import {
    Users, UserCircle, MinusCircle, Smile, 
    ShoppingBag, ClipboardList, Package, Tag, 
    List, ChevronRight, BarChart3
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReportCategory {
    id: string;
    title: string;
    description: string;
    icon?: React.ReactNode;
    isNew?: boolean;
    path: string;
}

export default function ReportsPage() {
    const router = useRouter();

    const reports: ReportCategory[] = [
        {
            id: 'financeiro',
            title: 'Relatório Financeiro',
            description: 'Confira valores recebidos, despesas e dados sobre o seu negócio',
            isNew: true,
            path: '/dashboard/reports/finance'
        },
        {
            id: 'atendimentos',
            title: 'Relatório de Atendimentos',
            description: 'Confira os detalhes dos seus atendimentos, produtos, serviços e pacotes por período',
            isNew: true,
            path: '/dashboard/reports/appointments'
        },
        {
            id: 'colaboradores',
            title: 'Colaboradores',
            description: 'Confira os colaboradores mais rentáveis para seu negócio.',
            icon: <Users size={20} />,
            isNew: true,
            path: '/dashboard/reports/collaborators'
        },
        {
            id: 'clientes',
            title: 'Clientes',
            description: 'Confira os dados de seus clientes, como gasto médio e mais.',
            icon: <UserCircle size={20} />,
            path: '/dashboard/reports/customers'
        },
        {
            id: 'clientes-sumidos',
            title: 'Clientes Sumidos',
            description: 'Confira os clientes sumidos e o tempo de ausência.',
            icon: <MinusCircle size={20} />,
            path: '/dashboard/reports/missing-customers'
        },
        {
            id: 'clientes-ativos',
            title: 'Clientes Ativos',
            description: 'Confira os clientes que realizaram compras recentemente.',
            icon: <Smile size={20} />,
            path: '/dashboard/reports/active-customers'
        },
        {
            id: 'pacotes',
            title: 'Pacotes',
            description: 'Dados sobre pacotes, como pacotes mais vendidos no período, listagens e mais.',
            icon: <ShoppingBag size={20} />,
            path: '/dashboard/reports/packages'
        },
        {
            id: 'servicos',
            title: 'Serviços',
            description: 'Dados sobre serviços, como serviços mais realizados no período, listagens e mais.',
            icon: <ClipboardList size={20} />,
            path: '/dashboard/reports/services'
        },
        {
            id: 'produtos',
            title: 'Produtos',
            description: 'Dados sobre produtos, como produtos mais vendidos no período, listagens e mais.',
            icon: <Package size={20} />,
            path: '/dashboard/reports/products'
        },
        {
            id: 'descontos',
            title: 'Descontos',
            description: 'Listagem de descontos pré-cadastrados, com informações resumidas e detalhadas.',
            icon: <Tag size={20} />,
            path: '/dashboard/reports/discounts'
        },
        {
            id: 'movimentacoes',
            title: 'Movimentações de Estoque',
            description: 'Dados sobre movimentações de estoque, como entradas e saídas de produtos.',
            icon: <List size={20} />,
            path: '/dashboard/reports/stock'
        }
    ];

    return (
        <div style={{ width: '100%', background: 'var(--bg-main)', minHeight: '100%', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 40px 0' }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        Relatórios
                    </h1>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', 
                    gap: 16 
                }}>
                    {reports.map((report) => (
                        <div 
                            key={report.id}
                            onClick={() => router.push(report.path)}
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 16,
                                padding: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                height: '100%'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, paddingRight: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {report.isNew && (
                                        <span style={{ 
                                            background: '#3B82F6', 
                                            color: '#FFF', 
                                            fontSize: 10, 
                                            fontWeight: 800, 
                                            padding: '4px 8px', 
                                            borderRadius: 6,
                                            textTransform: 'uppercase'
                                        }}>
                                            Novo
                                        </span>
                                    )}
                                    {report.icon && (
                                        <div style={{ color: 'var(--text-primary)' }}>
                                            {report.icon}
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                        {report.title}
                                    </h3>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: '90%' }}>
                                        {report.description}
                                    </p>
                                </div>
                            </div>

                            <div style={{ color: 'var(--text-muted)' }}>
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
