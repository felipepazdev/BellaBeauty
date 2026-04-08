'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Users, Search, Plus, Phone, Edit2 } from 'lucide-react';

interface Client {
    id: string;
    name: string;
    phone?: string;
    createdAt: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', phone: '' });

    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [clientDetails, setClientDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [activeTab, setActiveTab] = useState<'H' | 'F'>('H'); // Historico ou Fichas
    const [newRecord, setNewRecord] = useState('');

    const hydrate = useAuthStore(state => state.hydrate);

    const fetchClients = () => {
        setLoading(true);
        api.get('/clients')
            .then((r) => setClients(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { 
        hydrate();
        fetchClients();
    }, [hydrate]);

    const fetchClientDetails = async (id: string) => {
        setLoadingDetails(true);
        try {
            const res = await api.get(`/clients/${id}`);
            setClientDetails(res.data);
        } catch (e) {
            console.error(e);
        } finally { setLoadingDetails(false); }
    };

    const handleOpenClient = (client: any) => {
        setSelectedClient(client);
        setActiveTab('H');
        setNewRecord('');
        fetchClientDetails(client.id);
    };

    const handleSaveRecord = async () => {
        if (!newRecord.trim() || !clientDetails) return;
        try {
            await api.post(`/clients/${clientDetails.id}/records`, {
                type: 'NOTE',
                content: newRecord
            });
            setNewRecord('');
            fetchClientDetails(clientDetails.id); // reload
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar ficha.');
        }
    };

    const filtered = clients.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search)
    );

    const handleSave = async () => {
        if (!form.name.trim()) { setError('Nome é obrigatório'); return; }
        try {
            setSaving(true);
            setError('');
            await api.post('/clients', form);
            setForm({ name: '', phone: '' });
            setShowForm(false);
            fetchClients();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Erro ao salvar cliente');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-fade-in w-full pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div>
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-white mb-2">Carteira de Clientes</h1>
                    <p className="text-sm mt-1 text-slate-500">
                        {clients.length} clientes cadastrados em sua base.
                    </p>
                </div>
                <button className="btn-cyan h-14 px-8 shadow-[var(--accent-cyan-glow)]"
                    onClick={() => { setShowForm(true); setError(''); }}>
                    <Plus size={18} /> Novo Cliente
                </button>
            </div>

            {/* Busca */}
            <div className="relative mb-8 max-w-md">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome ou telefone..."
                    className="h-14 w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 text-white focus:border-[var(--accent-cyan)]/50 transition-all outline-none font-bold placeholder:text-slate-600 placeholder:font-medium" />
            </div>

            {/* Modal Novo Cliente */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="card w-full max-w-[480px] bg-[#0c0c10] border border-white/10 rounded-[32px] p-8 animate-scale-in">
                        <h2 className="text-2xl font-serif font-bold text-white mb-6">Novo Cliente</h2>
                        <div className="flex flex-col gap-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Nome *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Ex: Maria" className="h-14 w-full bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:border-[var(--accent-cyan)]/50 transition-all outline-none font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Telefone</label>
                                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder="(11) 99999-9999" className="h-14 w-full bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:border-[var(--accent-cyan)]/50 transition-all outline-none font-bold font-mono tracking-wider" />
                            </div>
                            {error && <p className="text-xs text-red-500 font-bold uppercase tracking-tight">{error}</p>}
                            <div className="flex gap-3 mt-4 pt-6 border-t border-white/5">
                                <button onClick={() => setShowForm(false)}
                                    className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                    Cancelar
                                </button>
                                 <button onClick={handleSave} disabled={saving} className="flex-1 h-14 btn-cyan shadow-[var(--accent-cyan-glow)]">
                                    {saving ? 'Registrando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Perfil Cliente (Histórico/Fichas) */}
            {selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-end p-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedClient(null)}>
                    <div className="w-full max-w-lg h-full bg-[#0c0c10] border-l border-white/10 flex flex-col transform transition-transform animate-slide-left shadow-2xl" onClick={e => e.stopPropagation()}>
                        
                        {/* Header Perfil */}
                        <div className="p-8 border-b border-white/5 relative shrink-0">
                            <button onClick={() => setSelectedClient(null)} className="absolute top-8 right-8 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white"><Edit2 size={16}/></button>
                            <div className="flex items-center gap-4 mb-2 mt-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-cyan)] to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-[var(--accent-cyan-glow)]">
                                    {selectedClient.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-white capitalize">{selectedClient.name.toLowerCase()}</h2>
                                    <p className="text-sm font-mono text-[var(--accent-cyan)] mt-1">{selectedClient.phone || 'Sem contato'}</p>
                                </div>
                            </div>
                            
                            {/* Tabs */}
                            <div className="flex gap-6 mt-8 border-b border-white/10">
                                <button onClick={() => setActiveTab('H')} className={`pb-3 text-xs font-black uppercase tracking-widest transition-colors relative ${activeTab === 'H' ? 'text-[var(--accent-cyan)]' : 'text-slate-500 hover:text-white'}`}>
                                    Histórico de Visitas
                                    {activeTab === 'H' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-cyan)] shadow-[var(--accent-cyan-glow)]" />}
                                </button>
                                <button onClick={() => setActiveTab('F')} className={`pb-3 text-xs font-black uppercase tracking-widest transition-colors relative ${activeTab === 'F' ? 'text-[var(--accent-cyan)]' : 'text-slate-500 hover:text-white'}`}>
                                    Fichas e Anotações
                                    {activeTab === 'F' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-cyan)] shadow-[var(--accent-cyan-glow)]" />}
                                </button>
                            </div>
                        </div>

                        {/* Corpo */}
                        <div className="flex-1 overflow-y-auto p-8 relative">
                            {loadingDetails ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                                    <div className="w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs uppercase tracking-widest font-black">Carregando Perfil...</p>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'H' && clientDetails?.appointments && (
                                        <div className="space-y-6">
                                            {clientDetails.appointments.length === 0 ? (
                                                <p className="text-sm text-slate-500 italic text-center mt-10">Este cliente ainda não realizou nenhum agendamento.</p>
                                            ) : (
                                                clientDetails.appointments.map((app: any) => (
                                                    <div key={app.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <p className="text-white font-bold">{app.service?.name || 'Serviço Excluído'}</p>
                                                                <p className="text-xs text-slate-500 uppercase tracking-widest font-black mt-1">
                                                                    {new Date(app.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-lg font-mono font-bold text-emerald-400">
                                                                    {app.payment?.amount ? `R$ ${app.payment.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '-'}
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-1">
                                                                    {app.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'F' && clientDetails?.records && (
                                        <div className="space-y-8 flex flex-col h-full">
                                            <div className="flex-1 space-y-4">
                                                {clientDetails.records.length === 0 ? (
                                                    <p className="text-sm text-slate-500 italic text-center mt-10">Nenhuma anotação ou ficha clínica registrada.</p>
                                                ) : (
                                                    clientDetails.records.map((rec: any) => (
                                                        <div key={rec.id} className="p-5 rounded-2xl bg-[var(--accent-cyan)]/5 border border-[var(--accent-cyan)]/10">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-cyan)] px-2 py-1 rounded bg-[var(--accent-cyan)]/10">
                                                                    {rec.type === 'ANAMNESIS' ? 'Ficha Anamnese' : 'Anotação'}
                                                                </span>
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                                                    {new Date(rec.createdAt).toLocaleDateString('pt-BR')}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{rec.content}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            <div className="shrink-0 pt-4 border-t border-white/5 space-y-3">
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nova Anotação ou Histórico</h4>
                                                <textarea 
                                                    value={newRecord} 
                                                    onChange={e => setNewRecord(e.target.value)}
                                                    placeholder="Digite restrições, fórmulas usadas, ou observações..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-[var(--accent-cyan)]/50 transition-all outline-none resize-none h-24 font-medium"
                                                />
                                                <button onClick={handleSaveRecord} disabled={!newRecord.trim()} className="w-full h-12 btn-cyan !text-xs">
                                                    Adicionar Ficha
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Lista */}
            {loading ? (
                <div className="flex justify-center py-20"><span className="w-10 h-10 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="card flex flex-col items-center py-24 gap-4 border-dashed border-white/10">
                    <Users size={48} className="text-slate-600" />
                    <p className="text-slate-400 font-serif italic text-lg">
                        {search ? 'Nenhum cliente encontrado.' : 'Sem clientes no sistema.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((c) => (
                        <div 
                            key={c.id} 
                            onClick={() => handleOpenClient(c)}
                            className="card flex items-center p-6 gap-5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[var(--accent-cyan)]/30 transition-all cursor-pointer group/client"
                        >
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-card)] border border-white/10 text-slate-300 group-hover/client:text-[var(--accent-cyan)] group-hover/client:border-[var(--accent-cyan)]/30 transition-all">
                                {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-base text-white tracking-tight capitalize truncate">{c.name.toLowerCase()}</p>
                                {c.phone && (
                                    <div className="flex items-center gap-1.5 mt-1.5 opacity-60">
                                        <Phone size={12} className="text-[var(--accent-cyan)]" />
                                        <span className="text-[11px] font-mono tracking-widest text-slate-300">{c.phone}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1 opacity-40 group-hover/client:opacity-100 transition-opacity">
                                <span className="text-[8px] font-black uppercase tracking-widest">Cadastro</span>
                                <span className="text-[10px] font-mono">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
