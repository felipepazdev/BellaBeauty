'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ChevronLeft, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StockMovement {
    id: string;
    type: 'IN' | 'OUT';
    reason: string;
    quantity: number;
    createdAt: string;
    product: {
        name: string;
    };
}

export default function StockReport() {
    const router = useRouter();
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // Em um cenário real, poderíamos ter uma rota genérica '/inventory/movements'.
        // Caso não exista, simulamos ou tentamos agrupar produtos. Usando try-catch por segurança.
        api.get('/inventory/products')
            .then(async (res) => {
                const products = res.data;
                const allMovements: StockMovement[] = [];
                // Se não houver rota agregada, mockamos ou extraímos o `movements` se ele vier aninhado.
                // Como não podemos fazer n requests grandes na UI sem peso, exibiremos os reports.
                // Aqui podemos adicionar um aviso ou um relatório consolidado.
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Placeholder until real movements endpoint is implemented
    const dummyMovements: StockMovement[] = [
        { id: '1', type: 'IN', reason: 'Compra', quantity: 10, createdAt: new Date().toISOString(), product: { name: 'Shampoo L\'Oreal' } },
        { id: '2', type: 'OUT', reason: 'Uso Interno', quantity: 2, createdAt: new Date().toISOString(), product: { name: 'Condicionador Wella' } },
        { id: '3', type: 'OUT', reason: 'Venda Avulsa', quantity: 1, createdAt: new Date().toISOString(), product: { name: 'Óleo Reparador' } },
        { id: '4', type: 'OUT', reason: 'Perda/Avaria', quantity: 1, createdAt: new Date().toISOString(), product: { name: 'Esmalte Vermelho' } },
    ];

    return (
        <div style={{ width: '100%', background: 'var(--bg-main)', minHeight: '100%', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 40px 0' }}>
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-start gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-300 hover:text-white mt-1 border border-transparent hover:border-white/10"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold tracking-tight text-white mb-2">Movimentações de Estoque</h1>
                        <p className="text-sm text-slate-400">
                            Dados sobre entradas, saídas e justificativas de uso de material.
                        </p>
                    </div>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-2">Produto & Motivo</div>
                    <div>Data/Hora</div>
                    <div className="text-right">Quantidade</div>
                </div>
                
                <div className="divide-y divide-white/5">
                    {dummyMovements.map((mov) => {
                        return (
                            <div key={mov.id} className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                                <div className="col-span-2 flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mov.type === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                        {mov.type === 'IN' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{mov.product.name}</p>
                                        <p className={`text-xs font-bold ${mov.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {mov.reason}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-slate-300">
                                    {format(new Date(mov.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </div>
                                <div className={`text-right font-black flex items-center justify-end gap-2 ${mov.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {mov.type === 'IN' ? '+' : '-'}{mov.quantity}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
