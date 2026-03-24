'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CreditCard, Check, Sparkles, Building2, MessageSquare, X } from 'lucide-react';

interface SettingsData {
    plan: string;
    billingCycle: string;
    planStartedAt?: string;
    planActiveUntil?: string;
}

export default function PlansPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<SettingsData | null>(null);
    const [selectedCycle, setSelectedCycle] = useState('MONTHLY');
    const [success, setSuccess] = useState('');

    const fetchSettings = () => {
        setLoading(true);
        api.get('/settings')
            .then((r) => {
                setData(r.data);
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
            const res = await api.patch('/settings/plan', { plan, billingCycle: selectedCycle });
            setData(prev => prev ? { ...prev, plan, billingCycle: selectedCycle, planStartedAt: res.data.planStartedAt, planActiveUntil: res.data.planActiveUntil } : null);
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
            <div className="flex flex-col items-center justify-center py-40 gap-6 text-center">
                <div className="relative">
                    <div className="w-16 h-16 border-2 border-purple-500/20 rounded-full animate-ping absolute inset-0" />
                    <div className="w-16 h-16 border-2 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin relative z-10" />
                </div>
                <p className="text-sm font-serif italic text-slate-500 tracking-wide">Sincronizando seus dados de acesso...</p>
            </div>
        );
    }

    const prices = {
        MONTHLY: { standard: 49.90, premium: 69.90 },
        QUARTERLY: { standard: 49.90 * 3 * 0.90, premium: 69.90 * 3 * 0.90 },
        YEARLY: { standard: 49.90 * 12 * 0.85, premium: 69.90 * 12 * 0.85 }
    };

    const periodLabels = { MONTHLY: 'mês', QUARTERLY: 'trimestre', YEARLY: 'ano' };

    const calculateRemainingDays = (expiry?: string) => {
        if (!expiry) return 0;
        const diff = new Date(expiry).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const remainingDays = calculateRemainingDays(data?.planActiveUntil);

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full py-10 animate-fade-in">
            <div className="w-full max-w-6xl space-y-12">
                {/* ── Header ────────────────────────────────────────── */}
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-purple-600 to-purple-500 p-[1px] shadow-2xl shadow-purple-600/20">
                        <div className="w-full h-full rounded-[2.5rem] bg-[#0c0c10] flex items-center justify-center">
                            <CreditCard className="text-purple-400" size={32} strokeWidth={1.5} />
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h1 className="text-5xl font-serif font-bold text-white tracking-tight">
                            Escolha o plano ideal
                        </h1>
                        <p className="text-base text-slate-500 max-w-lg mx-auto font-medium">
                            Tenha o controle completo da sua barbearia ou salão com ferramentas profissionais e automatizações de ponta.
                        </p>
                    </div>

                    {/* Infobar Subscription Status */}
                    {data?.planActiveUntil && (
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 animate-scale-in">
                            <div className="px-6 py-4 rounded-[1.5rem] bg-white/[0.03] border border-white/5 backdrop-blur-md flex flex-col items-start gap-1">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Assinado em</span>
                                <span className="text-sm font-bold text-white">{new Date(data.planStartedAt!).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="px-6 py-4 rounded-[1.5rem] bg-white/[0.03] border border-white/5 backdrop-blur-md flex flex-col items-start gap-1">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Expira em</span>
                                <span className="text-sm font-bold text-white">{new Date(data.planActiveUntil).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="px-6 py-4 rounded-[1.5rem] bg-purple-500/10 border border-purple-500/20 backdrop-blur-md flex flex-col items-start gap-1">
                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Tempo Restante</span>
                                <span className="text-sm font-black text-white">{remainingDays} {remainingDays === 1 ? 'dia' : 'dias'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-5 rounded-2xl text-center font-bold text-xs uppercase tracking-widest animate-fade-in mx-auto max-w-2xl">
                        {success}
                    </div>
                )}

                {/* ── Toggle Ciclo ───────────────────────────────────── */}
                <div className="flex justify-center">
                    <div className="bg-[#0c0c10] border border-white/10 p-2 rounded-2xl grid grid-cols-3 gap-1 shadow-2xl w-full max-w-lg">
                        {['MONTHLY', 'QUARTERLY', 'YEARLY'].map((cycle) => (
                            <button
                                key={cycle}
                                onClick={() => setSelectedCycle(cycle)}
                                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                                    selectedCycle === cycle 
                                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-600/30' 
                                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {cycle === 'MONTHLY' && 'Mensal'}
                                {cycle === 'QUARTERLY' && 'Trimestral'}
                                {cycle === 'YEARLY' && 'Anual'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Plan Cards ────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
                    {/* Plano Standard */}
                    <div className={`relative group p-[1px] rounded-[1.5rem] transition-all duration-500 ${data?.plan === 'STANDARD' ? 'bg-gradient-to-b from-slate-400/20 to-transparent' : 'bg-white/5 hover:bg-white/10'}`}>
                        <div className="bg-[#0c0c10] rounded-[1.5rem] p-12 h-full flex flex-col relative">
                            {data?.plan === 'STANDARD' && (
                                <div className="absolute top-8 right-8 px-4 py-1.5 bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-full backdrop-blur-md">
                                    Plano Ativo
                                </div>
                            )}
                            
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/5">
                                <Building2 size={24} className="text-slate-500" />
                            </div>

                            <h2 className="text-3xl font-serif font-bold text-white mb-2">Standard</h2>
                            <p className="text-sm text-slate-500 mb-8 min-h-[40px] font-medium leading-relaxed">
                                Essencial para o controle total da sua agenda, finanças e profissionais.
                            </p>

                            <div className="mb-10">
                                <span className="text-5xl font-black text-white tracking-tighter font-mono">
                                    R$ {prices[selectedCycle as keyof typeof prices].standard.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-slate-600 text-[11px] font-black uppercase tracking-widest ml-3">/ {periodLabels[selectedCycle as keyof typeof periodLabels]}</span>
                            </div>

                            <button
                                onClick={() => handleSubscribe('STANDARD')}
                                disabled={saving || data?.plan === 'STANDARD'}
                                className={`w-full py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl ${
                                    data?.plan === 'STANDARD'
                                        ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                                        : 'bg-white text-black hover:scale-[1.02] active:scale-95 shadow-white/5'
                                }`}
                            >
                                {data?.plan === 'STANDARD' ? 'Plano Atual' : 'Assinar Agora'}
                            </button>

                            <div className="mt-12 space-y-5">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 mb-2">O que está incluso:</p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-4 text-sm font-medium text-slate-400">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center"><Check size={12} className="text-emerald-500" /></div>
                                        Agenda e Agendamentos
                                    </li>
                                    <li className="flex items-center gap-4 text-sm font-medium text-slate-400">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center"><Check size={12} className="text-emerald-500" /></div>
                                        Gestão de Profissionais e Comissões
                                    </li>
                                    <li className="flex items-center gap-4 text-sm font-medium text-slate-400">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center"><Check size={12} className="text-emerald-500" /></div>
                                        Fluxo de Caixa e Despesas
                                    </li>
                                    <li className="flex items-center gap-4 text-sm font-medium text-slate-400 opacity-30 grayscale">
                                        <div className="w-5 h-5 rounded-full bg-slate-500/10 flex items-center justify-center"><X size={12} className="text-slate-500" /></div>
                                        Lembretes de WhatsApp
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Plano Premium */}
                    <div className={`relative group p-[1.5px] rounded-[1.5rem] transition-all duration-500 ${data?.plan === 'PREMIUM' ? 'bg-gradient-to-b from-purple-500 to-transparent shadow-[0_30px_100px_rgba(124,58,237,0.1)]' : 'bg-white/5 hover:bg-white/10'}`}>
                        <div className="bg-[#0c0c10] rounded-[1.5rem] p-12 h-full flex flex-col relative">
                            <div className="absolute top-8 right-8 px-4 py-1.5 bg-purple-600 text-[10px] font-black text-white uppercase tracking-widest rounded-full shadow-lg shadow-purple-600/30">
                                {data?.plan === 'PREMIUM' ? 'Plano Ativo' : 'Recomendado'}
                            </div>

                            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 border border-purple-500/10">
                                <Sparkles size={24} className="text-purple-400" />
                            </div>

                            <h2 className="text-3xl font-serif font-bold text-white mb-2">Premium</h2>
                            <p className="text-sm text-slate-500 mb-8 min-h-[40px] font-medium leading-relaxed">
                                Para negócios que buscam excelência e zero faltas com notificações inteligentes.
                            </p>

                            <div className="mb-10">
                                <span className="text-5xl font-black text-white tracking-tighter font-mono">
                                    R$ {prices[selectedCycle as keyof typeof prices].premium.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-slate-600 text-[11px] font-black uppercase tracking-widest ml-3">/ {periodLabels[selectedCycle as keyof typeof periodLabels]}</span>
                            </div>

                            <button
                                onClick={() => handleSubscribe('PREMIUM')}
                                disabled={saving || data?.plan === 'PREMIUM'}
                                className={`w-full py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl ${
                                    data?.plan === 'PREMIUM'
                                        ? 'bg-purple-500/5 text-purple-400/50 cursor-not-allowed border border-purple-500/10'
                                        : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:scale-[1.02] active:scale-95 shadow-purple-600/30'
                                }`}
                            >
                                {data?.plan === 'PREMIUM' ? 'Plano Atual' : 'Upgrade para Premium'}
                            </button>

                            <div className="mt-12 space-y-6 pt-10 border-t border-white/5">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 mb-2">Inclui Standard e MAIS:</p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center"><MessageSquare size={16} className="text-purple-400" /></div>
                                        <span className="text-sm font-bold text-white tracking-tight">Lembretes WhatsApp (24h e 2h)</span>
                                    </li>
                                    <li className="flex items-center gap-4 text-sm font-medium text-slate-400">
                                        <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center"><Check size={12} className="text-purple-400" /></div>
                                        WhatsApp via Evolution ou API Oficial
                                    </li>
                                    <li className="flex items-center gap-4 text-sm font-medium text-slate-400">
                                        <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center"><Check size={12} className="text-purple-400" /></div>
                                        Mensagens 100% Personalizáveis
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
