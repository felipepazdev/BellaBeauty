'use client';

import {
    Users, Activity, MinusCircle, Smile, 
    ShoppingBag, ClipboardList, Package, Tag, 
    ChevronRight, List, UserCircle
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
            path: '/dashboard/reports/finance',
            icon: null
        },
        {
            id: 'atendimentos',
            title: 'Relatório de Atendimentos',
            description: 'Confira os detalhes dos seus atendimentos, produtos, serviços e pacotes por período',
            isNew: true,
            path: '/dashboard/reports/appointments',
            icon: null
        },
        {
            id: 'colaboradores',
            title: 'Colaboradores',
            description: 'Confira os colaboradores mais rentáveis para seu negócio.',
            isNew: true,
            path: '/dashboard/reports/collaborators',
            icon: <Users size={18} strokeWidth={2} />
        },
        {
            id: 'clientes',
            title: 'Clientes',
            description: 'Confira os dados de seus clientes, como gasto médio e mais.',
            path: '/dashboard/reports/customers',
            icon: <UserCircle size={18} strokeWidth={2} />
        },
        {
            id: 'clientes-sumidos',
            title: 'Clientes Sumidos',
            description: 'Confira os clientes sumidos e o tempo de ausência.',
            path: '/dashboard/reports/missing-customers',
            icon: <MinusCircle size={18} strokeWidth={2} />
        },
        {
            id: 'clientes-ativos',
            title: 'Clientes Ativos',
            description: 'Confira os clientes que realizaram compras recentemente.',
            path: '/dashboard/reports/active-customers',
            icon: <Smile size={18} strokeWidth={2} />
        },
        {
            id: 'pacotes',
            title: 'Pacotes',
            description: 'Dados sobre pacotes, como pacotes mais vendidos no período, listagens e mais.',
            path: '/dashboard/reports/packages',
            icon: <ShoppingBag size={18} strokeWidth={2} />
        },
        {
            id: 'servicos',
            title: 'Serviços',
            description: 'Dados sobre serviços, como serviços mais realizados no período, listagens e mais.',
            path: '/dashboard/reports/services',
            icon: <ClipboardList size={18} strokeWidth={2} />
        },
        {
            id: 'produtos',
            title: 'Produtos',
            description: 'Dados sobre produtos, como produtos mais vendidos no período, listagens e mais.',
            path: '/dashboard/reports/products',
            icon: <Package size={18} strokeWidth={2} />
        },
        {
            id: 'descontos',
            title: 'Descontos',
            description: 'Listagem de descontos pré-cadastrados, com informações resumidas e detalhadas.',
            path: '/dashboard/reports/discounts',
            icon: <Tag size={18} strokeWidth={2} />
        }
    ];

    return (
        <div className="animate-fade-in w-full pb-20">
            <div className="mb-8 mt-2">
                <h1 className="text-[32px] font-serif font-extrabold tracking-tight text-[#111827] mb-2">Relatórios</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {reports.map((report) => (
                    <div 
                        key={report.id}
                        onClick={() => router.push(report.path)}
                        className="cursor-pointer bg-white border border-gray-200 hover:border-gray-300 transition-colors p-[22px] rounded-2xl flex flex-col relative"
                    >
                        <div className="flex items-center gap-2 mb-3 h-6">
                            {report.isNew && (
                                <span className="px-[8px] py-[3px] bg-[#5a79f2] text-white text-[10px] font-bold uppercase rounded-[5px] flex items-center justify-center tracking-wider leading-none">
                                    Novo
                                </span>
                            )}
                            {report.icon && (
                                <div className="text-[#4b5563]">
                                    {report.icon}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-start">
                            <div className="flex-1 pr-6">
                                <h3 className="text-[17px] font-extrabold text-[#111827] mb-[6px] font-serif tracking-tight">{report.title}</h3>
                                <p className="text-[14px] text-[#6b7280] leading-snug font-medium">
                                    {report.description}
                                </p>
                            </div>
                            <div className="text-gray-300 absolute right-6 top-1/2 -translate-y-1/2">
                                <ChevronRight size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
