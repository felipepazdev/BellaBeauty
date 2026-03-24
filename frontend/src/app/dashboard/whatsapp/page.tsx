'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MessageSquare, Save, Settings, Lock } from 'lucide-react';
import Link from 'next/link';

interface SettingsData {
    plan: string;
    whatsappProvider: string;
    whatsappToken: string;
    whatsappPhoneId: string;
    whatsappTemplate24h: string;
    whatsappTemplate2h: string;
}

export default function WhatsAppSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState<SettingsData>({
        plan: 'STANDARD',
        whatsappProvider: 'NONE',
        whatsappToken: '',
        whatsappPhoneId: '',
        whatsappTemplate24h: '',
        whatsappTemplate2h: '',
    });

    const fetchSettings = () => {
        setLoading(true);
        api.get('/settings')
            .then((r) => {
                const data = r.data;
                setForm({
                    plan: data.plan || 'STANDARD',
                    whatsappProvider: data.whatsappProvider || 'NONE',
                    whatsappToken: data.whatsappToken || '',
                    whatsappPhoneId: data.whatsappPhoneId || '',
                    whatsappTemplate24h: data.whatsappTemplate24h || '',
                    whatsappTemplate2h: data.whatsappTemplate2h || '',
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchSettings(); }, []);

    const handleSave = async () => {
        if (form.plan !== 'PREMIUM') return;
        try {
            setSaving(true);
            setError('');
            setSuccess('');
            await api.patch('/settings', form);
            setSuccess('Configurações salvas com sucesso!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Erro ao salvar configurações');
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

    const isPremium = form.plan === 'PREMIUM';

    return (
        <div className="animate-fade-in w-full max-w-4xl relative">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-white mb-1 flex items-center gap-3">
                        <MessageSquare className="text-green-500" /> WhatsApp
                    </h1>
                    <p className="text-[14px] text-white/50 mb-4">
                        Configure o envio automático de mensagens e lembretes para seus clientes.
                    </p>
                </div>
            </div>

            {!isPremium && (
                <div className="mb-6 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-purple-500/20 p-3 rounded-full shrink-0">
                            <Lock className="text-purple-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">Funcionalidade Premium</h3>
                            <p className="text-white/60 text-sm">
                                Para enviar mensagens automáticas via WhatsApp (Lembretes inteligentes 24h e 2h antes) faça o upgrade do seu plano.
                            </p>
                        </div>
                    </div>
                    <Link href="/dashboard/plans" className="shrink-0 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors shadow-lg">
                        Fazer Upgrade
                    </Link>
                </div>
            )}

            <div className={`bg-[#111116] border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col gap-6 relative ${!isPremium ? 'opacity-40 pointer-events-none grayscale-[0.8]' : ''}`}>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Provider Setting */}
                    <div className="md:col-span-2">
                        <label className="text-sm mb-1 block text-white/60 font-medium">Provedor do WhatsApp</label>
                        <select 
                            value={form.whatsappProvider} 
                            onChange={(e) => setForm({ ...form, whatsappProvider: e.target.value })}
                            className="bg-black border border-white/10 rounded-xl px-4 py-3 w-full text-white text-[14px] focus:outline-none focus:border-green-500/50 transition-colors"
                        >
                            <option value="NONE">Desativado</option>
                            <option value="EVOLUTION">Evolution API</option>
                            <option value="OFFICIAL">API Oficial do WhatsApp (Meta)</option>
                        </select>
                        <p className="text-xs text-white/40 mt-2">Escolha qual serviço fará o envio das mensagens.</p>
                    </div>

                    {form.whatsappProvider === 'OFFICIAL' && (
                        <>
                            <div>
                                <label className="text-sm mb-1 block text-white/60 font-medium">Token de Acesso (Meta)</label>
                                <input 
                                    type="password"
                                    value={form.whatsappToken} 
                                    onChange={(e) => setForm({ ...form, whatsappToken: e.target.value })}
                                    placeholder="EAABw..." 
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 w-full text-white text-[14px] focus:outline-none focus:border-green-500/50 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-sm mb-1 block text-white/60 font-medium">Phone ID (Meta)</label>
                                <input 
                                    type="text"
                                    value={form.whatsappPhoneId} 
                                    onChange={(e) => setForm({ ...form, whatsappPhoneId: e.target.value })}
                                    placeholder="123456789012345" 
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 w-full text-white text-[14px] focus:outline-none focus:border-green-500/50 transition-colors"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="h-px bg-white/5 my-2 w-full" />

                <div className="flex flex-col gap-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Settings size={18} className="text-white/50" /> Mensagens Automáticas
                    </h3>
                    
                    <p className="text-sm text-white/40">
                        Variáveis disponíveis: <code className="text-green-400 bg-green-400/10 px-1 py-0.5 rounded">{'{{clientName}}'}</code>, 
                        <code className="text-green-400 bg-green-400/10 px-1 py-0.5 rounded ml-1">{'{{serviceName}}'}</code>, 
                        <code className="text-green-400 bg-green-400/10 px-1 py-0.5 rounded ml-1">{'{{salonName}}'}</code>, 
                        <code className="text-green-400 bg-green-400/10 px-1 py-0.5 rounded ml-1">{'{{date}}'}</code>, 
                        <code className="text-green-400 bg-green-400/10 px-1 py-0.5 rounded ml-1">{'{{time}}'}</code>
                    </p>

                    <div>
                        <label className="text-sm mb-1 block text-white/60 font-medium">Lembrete (24 horas antes)</label>
                        <textarea 
                            value={form.whatsappTemplate24h} 
                            onChange={(e) => setForm({ ...form, whatsappTemplate24h: e.target.value })}
                            placeholder={`Olá *{{clientName}}*!\nPassando para confirmar o seu agendamento de *{{serviceName}}* amanhã ({{date}}) às *{{time}}* no *{{salonName}}*.\nNos vemos em breve!`}
                            className="bg-black border border-white/10 rounded-xl px-4 py-3 w-full text-white text-[14px] focus:outline-none focus:border-green-500/50 transition-colors min-h-[120px]"
                        />
                    </div>

                    <div>
                        <label className="text-sm mb-1 block text-white/60 font-medium">Lembrete (2 horas antes)</label>
                        <textarea 
                            value={form.whatsappTemplate2h} 
                            onChange={(e) => setForm({ ...form, whatsappTemplate2h: e.target.value })}
                            placeholder={`Olá *{{clientName}}*, seu agendamento de *{{serviceName}}* no *{{salonName}}* é em 2 horas!\nEstamos aguardando você.`}
                            className="bg-black border border-white/10 rounded-xl px-4 py-3 w-full text-white text-[14px] focus:outline-none focus:border-green-500/50 transition-colors min-h-[120px]"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex-1">
                        {error && <p className="text-sm text-red-400">{error}</p>}
                        {success && <p className="text-sm text-green-400">{success}</p>}
                    </div>
                    
                    <button 
                        onClick={handleSave} 
                        disabled={saving} 
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] font-semibold text-[14px] rounded-lg transition-all"
                    >
                        {saving ? <span className="spinner border-black" style={{ width: 16, height: 16 }} /> : <Save size={18} />}
                        {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>
        </div>
    );
}
