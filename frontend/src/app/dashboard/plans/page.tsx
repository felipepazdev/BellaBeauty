'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CreditCard, Check, Sparkles, Building2, MessageSquare, X } from 'lucide-react';

interface SettingsData {
    plan: string;
    billingCycle: string;
}

export default function PlansPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentPlan, setCurrentPlan] = useState('');
    const [currentCycle, setCurrentCycle] = useState('');
    const [selectedCycle, setSelectedCycle] = useState('MONTHLY');
    const [success, setSuccess] = useState('');

    const fetchSettings = () => {
        setLoading(true);
        api.get('/settings')
            .then((r) => {
                setCurrentPlan(r.data.plan || 'STANDARD');
                setCurrentCycle(r.data.billingCycle || 'MONTHLY');
                setSelectedCycle(r.data.billingCycle || 'MONTHLY');
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchSettings(); }, []);

    const handleSubscribe = async (plan: string) => {
        try {
            setSaving(true);
            setSuccess('');
            await api.patch('/settings/plan', { plan, billingCycle: selectedCycle });
            setCurrentPlan(plan);
            setCurrentCycle(selectedCycle);
            setSuccess(`Plano ${plan === 'PREMIUM' ? 'Premium' : 'Standard'} ativado com sucesso!`);
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) {
            console.error(e);
            alert('Erro ao alterar o plano.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <span className="spinner" style={{ width: 32, height: 32, opacity: 0.5 }} />
            </div>
        );
    }

    const prices = {
        MONTHLY: { standard: 49.90, premium: 69.90 },
        QUARTERLY: { standard: 49.90 * 3 * 0.90, premium: 69.90 * 3 * 0.90 },
        YEARLY: { standard: 49.90 * 12 * 0.85, premium: 69.90 * 12 * 0.85 }
    };

    const periodLabels = { MONTHLY: 'mês', QUARTERLY: 'trimestre', YEARLY: 'ano' };

    return (
        <div className="animate-fade-in w-full max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center mb-10">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4">
                    <CreditCard className="text-white" size={24} />
                </div>
                <h1 className="text-[32px] leading-tight font-bold tracking-tight text-white mb-2">
                    Escolha o plano ideal para o seu salão
                </h1>
                <p className="text-[15px] text-white/50 max-w-xl">
                    Tenha o controle completo da sua barbearia ou salão com ferramentas profissionais e automatizações.
                </p>
            </div>

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-center mb-8 font-medium">
                    {success}
                </div>
            )}

            {/* Ciclo de Pagamento */}
            <div className="flex justify-center mb-10">
                <div className="bg-[#111116] border border-white/5 p-1 rounded-xl inline-flex relative">
                    {['MONTHLY', 'QUARTERLY', 'YEARLY'].map((cycle) => (
                        <button
                            key={cycle}
                            onClick={() => setSelectedCycle(cycle)}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedCycle === cycle 
                                    ? 'bg-white/10 text-white shadow-sm' 
                                    : 'text-white/40 hover:text-white/80'
                            }`}
                        >
                            {cycle === 'MONTHLY' && 'Mensal'}
                            {cycle === 'QUARTERLY' && 'Trimestral (-10%)'}
                            {cycle === 'YEARLY' && 'Anual (-15%)'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-4xl mx-auto">
                {/* Plano Standard */}
                <div className="bg-[#111116] border border-white/5 rounded-3xl p-8 relative flex flex-col h-full hover:border-white/10 transition-colors">
                    {currentPlan === 'STANDARD' && currentCycle === selectedCycle && (
                        <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
                            Seu Plano Atual
                        </div>
                    )}
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <Building2 size={24} className="text-white/50" />
                        Standard
                    </h2>
                    <p className="text-sm text-white/50 mb-6 h-10">
                        Essencial para o controle da sua agenda, finanças e profissionais.
                    </p>
                    <div className="mb-6">
                        <span className="text-4xl font-extrabold text-white tracking-tight">
                            R$ {prices[selectedCycle as keyof typeof prices].standard.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-white/40 text-sm ml-1">/{periodLabels[selectedCycle as keyof typeof periodLabels]}</span>
                    </div>

                    <button
                        onClick={() => handleSubscribe('STANDARD')}
                        disabled={saving || (currentPlan === 'STANDARD' && currentCycle === selectedCycle)}
                        className={`w-full py-3 rounded-xl font-semibold mb-8 transition-all ${
                            currentPlan === 'STANDARD' && currentCycle === selectedCycle
                                ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
                                : 'bg-white text-black hover:bg-white/90 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        {currentPlan === 'STANDARD' && currentCycle === selectedCycle ? 'Ativo' : 'Assinar Standard'}
                    </button>

                    <ul className="flex flex-col gap-4 text-sm text-white/70">
                        <li className="flex items-start gap-3">
                            <Check className="text-green-500 shrink-0" size={18} /> Gestão de Agenda e Agendamentos
                        </li>
                        <li className="flex items-start gap-3">
                            <Check className="text-green-500 shrink-0" size={18} /> Gestão de Profissionais e Comissões
                        </li>
                        <li className="flex items-start gap-3">
                            <Check className="text-green-500 shrink-0" size={18} /> Fluxo de Caixa e Despesas
                        </li>
                        <li className="flex items-start gap-3">
                            <Check className="text-green-500 shrink-0" size={18} /> Controle de Estoque de Produtos
                        </li>
                        <li className="flex items-start gap-3 opacity-30">
                            <X className="shrink-0" size={18} /> Lembretes via WhatsApp 
                        </li>
                    </ul>
                </div>

                {/* Plano Premium */}
                <div className="bg-gradient-to-b from-[#1c1c28] to-[#111116] border border-[#a78bfa]/30 rounded-3xl p-8 relative flex flex-col h-full shadow-[0_0_40px_rgba(124,58,237,0.1)] hover:shadow-[0_0_60px_rgba(124,58,237,0.15)] transition-shadow">
                    {currentPlan === 'PREMIUM' && currentCycle === selectedCycle ? (
                        <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-[#7c3aed] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                            Seu Plano Atual
                        </div>
                    ) : (
                        <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-[#7c3aed] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                            Recomendado
                        </div>
                    )}
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <Sparkles size={24} className="text-[#a78bfa]" />
                        Premium
                    </h2>
                    <p className="text-sm text-white/60 mb-6 h-10">
                        Para negócios que querem reduzir as faltas usando notificações automáticas.
                    </p>
                    <div className="mb-6">
                        <span className="text-4xl font-extrabold text-white tracking-tight">
                            R$ {prices[selectedCycle as keyof typeof prices].premium.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-white/40 text-sm ml-1">/{periodLabels[selectedCycle as keyof typeof periodLabels]}</span>
                    </div>

                    <button
                        onClick={() => handleSubscribe('PREMIUM')}
                        disabled={saving || (currentPlan === 'PREMIUM' && currentCycle === selectedCycle)}
                        className={`w-full py-3 rounded-xl font-semibold mb-8 transition-all ${
                            currentPlan === 'PREMIUM' && currentCycle === selectedCycle
                                ? 'bg-white/5 text-white/40 cursor-not-allowed border border-[#7c3aed]/30'
                                : 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] border border-[#a78bfa]/50'
                        }`}
                    >
                        {currentPlan === 'PREMIUM' && currentCycle === selectedCycle ? 'Ativo' : 'Assinar Premium'}
                    </button>

                    <ul className="flex flex-col gap-4 text-sm text-white/80 border-t border-white/10 pt-6 mt-auto">
                        <li className="flex items-start gap-3 font-medium text-white">
                            <Check className="text-[#a78bfa] shrink-0" size={18} /> <span className="flex-1">Tudo do plano Standard, <span className="font-bold underline decoration-[#a78bfa]/50 underline-offset-4">mais:</span></span>
                        </li>
                        <li className="flex items-start gap-3 text-white">
                            <span className="bg-[#a78bfa]/20 p-1 rounded-full shrink-0"><MessageSquare size={14} className="text-[#a78bfa]" /></span>
                            <span className="font-medium">Lembretes Automáticos de WhatsApp (24h e 2h antes)</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Check className="text-[#a78bfa] shrink-0" size={18} /> Uso de Evolution API ou API Oficial
                        </li>
                        <li className="flex items-start gap-3">
                            <Check className="text-[#a78bfa] shrink-0" size={18} /> Mensagens 100% personalizáveis
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
