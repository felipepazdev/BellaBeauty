'use client';

import {
    Users, Activity, MinusCircle, Smile, 
    ShoppingBag, ClipboardList, Package, Tag, 
    ChevronRight, List, UserCircle, LayoutGrid, BarChart3
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
            description: 'Confira valores recebidos, despesas e dados estratégicos sobre o seu negócio',
            isNew: true,
            path: '/dashboard/reports/finance',
            icon: <Activity size={20} />
        },
        {
            id: 'atendimentos',
            title: 'Relatório de Atendimentos',
            description: 'Detalhamento de serviços, profissionais e produtividade por período',
            isNew: true,
            path: '/dashboard/reports/appointments',
            icon: <BarChart3 size={20} />
        },
        {
            id: 'colaboradores',
            title: 'Colaboradores',
            description: 'Ranking de rentabilidade e desempenho da sua equipe técnica.',
            isNew: true,
            path: '/dashboard/reports/collaborators',
            icon: <Users size={20} />
        },
        {
            id: 'clientes',
            title: 'Clientes',
            description: 'Insights sobre a jornada do cliente, gasto médio e fidelização.',
            path: '/dashboard/reports/customers',
            icon: <UserCircle size={20} />
        },
        {
            id: 'clientes-sumidos',
            title: 'Clientes Sumidos',
            description: 'Identifique clientes ausentes e crie campanhas de recuperação.',
            path: '/dashboard/reports/missing-customers',
            icon: <MinusCircle size={20} />
        },
        {
            id: 'clientes-ativos',
            title: 'Clientes Ativos',
            description: 'Fluxo de clientes recorrentes e novas conexões recentes.',
            path: '/dashboard/reports/active-customers',
            icon: <Smile size={20} />
        },
        {
            id: 'pacotes',
            title: 'Pacotes',
            description: 'Desempenho de vendas de pacotes e combos de fidelização.',
            path: '/dashboard/reports/packages',
            icon: <ShoppingBag size={20} />
        },
        {
            id: 'servicos',
            title: 'Serviços',
            description: 'Ranking dos procedimentos mais procurados e rentáveis.',
            path: '/dashboard/reports/services',
            icon: <ClipboardList size={20} />
        },
        {
            id: 'produtos',
            title: 'Produtos',
            description: 'Giro de estoque e produtos campeões de vendas no balcão.',
            path: '/dashboard/reports/products',
            icon: <Package size={20} />
        },
        {
            id: 'descontos',
            title: 'Descontos',
            description: 'Impacto de promoções e cupons na sua margem de lucro.',
            path: '/dashboard/reports/discounts',
            icon: <Tag size={20} />
        }
    ];

    return (
        <main className="min-h-screen p-4 sm:p-8 animate-fade-in bg-[#0a0a0c]">
            {/* ── Header ── */}
            <div className="mb-12">
                <h1 className="text-[36px] font-serif font-black text-white tracking-tight flex items-center gap-4">
                    <BarChart3 className="text-[#06b6d4] drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]" size={36} />
                    Central de Relatórios
                </h1>
                <p className="text-slate-500 mt-2 font-medium italic">Dados transformados em inteligência para o Bella Beauty</p>
            </div>

            {/* ── Grid de Categorias ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {reports.map((report) => (
                    <div 
                        key={report.id}
                        onClick={() => router.push(report.path)}
                        className="group relative cursor-pointer bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[30px] p-8 hover:border-[#06b6d4]/40 hover:bg-white/[0.06] transition-all duration-500 shadow-xl overflow-hidden"
                    >
                        {/* Accent Holográfico */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#06b6d4]/5 blur-[40px] rounded-full group-hover:bg-[#06b6d4]/10 transition-all duration-700" />
                        
                        <div className="flex flex-col h-full relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 text-[#06b6d4] group-hover:scale-110 group-hover:text-white group-hover:bg-[#06b6d4] transition-all duration-500 shadow-2xl">
                                    {report.icon}
                                </div>
                                {report.isNew && (
                                    <span className="px-3 py-1 bg-[#06b6d4] text-white text-[10px] font-black uppercase rounded-lg tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                                        Novo
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col flex-1">
                                <h3 className="text-[20px] font-serif font-black text-white mb-2 leading-tight group-hover:text-[#06b6d4] transition-colors">{report.title}</h3>
                                <p className="text-[14px] text-slate-500 leading-relaxed font-medium">
                                    {report.description}
                                </p>
                            </div>

                            <div className="mt-8 flex items-center gap-2 text-[#06b6d4] text-[11px] font-black uppercase tracking-[0.2em] transform group-hover:translate-x-2 transition-transform duration-300">
                                Analisar Dados
                                <ChevronRight size={14} strokeWidth={3} />
                            </div>
                        </div>

                        {/* Indicador lateral invisível até hover */}
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#06b6d4] opacity-0 group-hover:opacity-100 transition-all rounded-r-full shadow-[0_0_10px_rgba(6,182,212,1)]" />
                    </div>
                ))}
            </div>
        </main>
    );
}
