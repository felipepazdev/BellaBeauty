'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MessageSquare, Save, Settings, Lock, ChevronRight } from 'lucide-react';
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
                <span className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        );
    }

    const isPremium = form.plan === 'PREMIUM';

    return (
        <div className="animate-fade-in w-full max-w-3xl">
            {/* Cabeçalho */}
            <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <MessageSquare size={22} color="#16a34a" />
                </div>
                <div>
                    <h1 className="text-2xl font-serif font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        Integração WhatsApp
                    </h1>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Configure o envio automático de lembretes e mensagens para seus clientes.
                    </p>
                </div>
            </div>

            {/* Banner Premium */}
            {!isPremium && (
                <div className="mb-6 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
                    style={{
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(99,102,241,0.06))',
                        border: '1px solid rgba(124,58,237,0.2)',
                    }}>
                    <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--accent)' }}>
                            <Lock size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                Recurso Exclusivo do Plano Premium
                            </h3>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Para enviar mensagens automáticas via WhatsApp (lembretes inteligentes 24h e 2h antes do agendamento), faça upgrade do seu plano.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/plans"
                        className="flex items-center gap-2 shrink-0 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                        style={{ background: 'var(--accent)', boxShadow: '0 4px 12px var(--accent-glow)' }}
                    >
                        Fazer Upgrade <ChevronRight size={16} />
                    </Link>
                </div>
            )}

            {/* Formulário */}
            <div
                className={`card flex flex-col gap-8 ${!isPremium ? 'opacity-50 pointer-events-none grayscale' : ''}`}
                style={{ padding: '2rem' }}
            >
                {/* Provedor */}
                <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: 'var(--text-muted)' }}>
                        Configuração do Provedor
                    </h3>
                    <div className="flex flex-col gap-1.5">
                        <label className="form-label">Provedor do WhatsApp</label>
                        <select
                            value={form.whatsappProvider}
                            onChange={(e) => setForm({ ...form, whatsappProvider: e.target.value })}
                            className="input-field"
                        >
                            <option value="NONE">Desativado</option>
                            <option value="EVOLUTION">Evolution API (Recomendado)</option>
                            <option value="OFFICIAL">API Oficial do WhatsApp (Meta)</option>
                        </select>
                        <p className="text-[11px] mt-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                            Escolha qual serviço realizará o envio das mensagens.
                        </p>
                    </div>
                </section>

                {form.whatsappProvider === 'OFFICIAL' && (
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="form-label">Token de Acesso (Meta)</label>
                            <input
                                type="password"
                                value={form.whatsappToken}
                                onChange={(e) => setForm({ ...form, whatsappToken: e.target.value })}
                                placeholder="EAABw..."
                                className="input-field"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="form-label">Phone ID (Meta)</label>
                            <input
                                type="text"
                                value={form.whatsappPhoneId}
                                onChange={(e) => setForm({ ...form, whatsappPhoneId: e.target.value })}
                                placeholder="123456789012345"
                                className="input-field"
                            />
                        </div>
                    </section>
                )}

                {/* Separador */}
                <div className="h-px" style={{ background: 'var(--border)' }} />

                {/* Mensagens Automáticas */}
                <section>
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                            <Settings size={16} />
                        </div>
                        <h3 className="text-sm font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
                            Mensagens Automáticas
                        </h3>
                    </div>

                    <div className="p-4 rounded-xl mb-6" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                        <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                            Variáveis disponíveis para personalização:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {['{{clientName}}', '{{serviceName}}', '{{salonName}}', '{{date}}', '{{time}}'].map((v) => (
                                <code key={v} className="text-[10px] font-bold px-2 py-1 rounded-lg"
                                    style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.2)' }}>
                                    {v}
                                </code>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="form-label">
                                <span className="badge badge-warning">24h</span>
                                Lembrete 24 horas antes
                            </label>
                            <textarea
                                value={form.whatsappTemplate24h}
                                onChange={(e) => setForm({ ...form, whatsappTemplate24h: e.target.value })}
                                placeholder={`Olá *{{clientName}}*!\nPassando para confirmar o seu agendamento de *{{serviceName}}* amanhã ({{date}}) às *{{time}}* no *{{salonName}}*.\nNos vemos em breve!`}
                                className="input-field"
                                style={{ height: 'auto', minHeight: '120px', paddingTop: '12px', paddingBottom: '12px', lineHeight: 1.6, resize: 'vertical' }}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="form-label">
                                <span className="badge badge-info">2h</span>
                                Lembrete 2 horas antes
                            </label>
                            <textarea
                                value={form.whatsappTemplate2h}
                                onChange={(e) => setForm({ ...form, whatsappTemplate2h: e.target.value })}
                                placeholder={`Olá *{{clientName}}*, seu agendamento de *{{serviceName}}* no *{{salonName}}* é em 2 horas!\nEstamos aguardando você.`}
                                className="input-field"
                                style={{ height: 'auto', minHeight: '120px', paddingTop: '12px', paddingBottom: '12px', lineHeight: 1.6, resize: 'vertical' }}
                            />
                        </div>
                    </div>
                </section>

                {/* Rodapé */}
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div>
                        {error && <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>{error}</p>}
                        {success && <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>{success}</p>}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: '#16a34a', boxShadow: '0 4px 12px rgba(22,163,74,0.2)' }}
                    >
                        {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Save size={16} />}
                        {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>
        </div>
    );
}
