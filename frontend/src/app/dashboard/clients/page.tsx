'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Users, Search, Plus, Phone, Edit2, Filter, UserPlus, ChevronRight, MoreVertical, Trash2 } from 'lucide-react';

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
    const [sortBy, setSortBy] = useState<'name' | 'newest' | 'oldest'>('name');
    const [showSortMenu, setShowSortMenu] = useState(false);

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

    const filtered = clients
        .filter((c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.phone || '').includes(search)
        )
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name, 'pt-BR');
            if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            return 0;
        });

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
            const msg = e.response?.data?.message;
            if (Array.isArray(msg)) {
                const translated = msg.map(m => {
                    const low = m.toLowerCase();
                    if (low.includes('name')) {
                        if (low.includes('empty')) return 'O nome é obrigatório.';
                        if (low.includes('string')) return 'O nome deve ser um texto.';
                        return 'Erro no campo Nome.';
                    }
                    if (low.includes('phone')) {
                        return 'O telefone deve ser um texto válido.';
                    }
                    if (low.includes('should not exist')) return 'Dados extras não permitidos.';
                    return m;
                }).join(' ');
                setError(translated);
            } else {
                setError(msg || 'Erro ao salvar cliente. Verifique os dados.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja remover o cliente ${name}?`)) return;
        try {
            await api.delete(`/clients/${id}`);
            fetchClients();
        } catch (e) {
            console.error(e);
            alert('Erro ao remover cliente.');
        }
    };

    return (
        <div className="animate-opacity-in w-full pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-[var(--text-primary)] mb-2">Carteira de Clientes</h1>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
                        <p className="text-sm font-medium text-slate-500">
                            {clients.length} {clients.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
                        </p>
                    </div>
                </div>
                <button className="btn-cyan h-12 px-6 shadow-[var(--accent-cyan-glow)] flex items-center gap-2"
                    onClick={() => { setShowForm(true); setError(''); }}>
                    <UserPlus size={18} /> Novo Cliente
                </button>
            </div>

            {/* Busca e Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none transition-colors group-focus-within:text-[var(--accent-cyan)]" />
                    <input 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Pesquise por nome ou telefone..."
                        className="h-12 w-full !bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl !pl-14 !pr-4 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] transition-all outline-none font-medium placeholder:text-slate-400" 
                    />
                </div>
                
                <div className="relative">
                    <button 
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className={`h-12 px-5 border rounded-xl transition-all flex items-center gap-2 text-sm font-bold ${
                            showSortMenu || sortBy !== 'name' 
                            ? 'bg-[var(--accent-cyan-glow)] border-[var(--accent-cyan)] text-[var(--accent-cyan)]' 
                            : 'bg-[var(--bg-surface)] border-[var(--border)] text-slate-500 hover:text-[var(--accent-cyan)]'
                        }`}
                    >
                        <Filter size={16} /> 
                        {sortBy === 'name' ? 'Ordem: A-Z' : sortBy === 'newest' ? 'Mais Novos' : 'Mais Antigos'}
                    </button>

                    {showSortMenu && (
                        <>
                            <div className="fixed inset-0 z-[100]" onClick={() => setShowSortMenu(false)} />
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-[101] overflow-hidden animate-scale-in">
                                <div className="p-2 border-b border-slate-50">
                                    <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Ordenar por:</p>
                                </div>
                                <div className="p-1">
                                    <button 
                                        onClick={() => { setSortBy('name'); setShowSortMenu(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-colors ${sortBy === 'name' ? 'bg-slate-50 text-[var(--accent-cyan)]' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        Nome (A-Z)
                                        {sortBy === 'name' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] shadow-[var(--accent-cyan-glow)]" />}
                                    </button>
                                    <button 
                                        onClick={() => { setSortBy('newest'); setShowSortMenu(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-colors ${sortBy === 'newest' ? 'bg-slate-50 text-[var(--accent-cyan)]' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        Mais Novos primeiro
                                        {sortBy === 'newest' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] shadow-[var(--accent-cyan-glow)]" />}
                                    </button>
                                    <button 
                                        onClick={() => { setSortBy('oldest'); setShowSortMenu(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-colors ${sortBy === 'oldest' ? 'bg-slate-50 text-[var(--accent-cyan)]' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        Mais Antigos primeiro
                                        {sortBy === 'oldest' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] shadow-[var(--accent-cyan-glow)]" />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal Novo Cliente (Centralização Absoluta na Janela) */}
            {showForm && (
                <div className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-md">
                    <div className="card w-full max-w-[480px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-[32px] p-10 shadow-[0_30px_70px_rgba(0,0,0,0.4)] animate-scale-in">
                        <h2 className="text-3xl font-serif font-bold text-[var(--text-primary)] mb-8 text-center">Novo Cadastro</h2>
                        <div className="flex flex-col gap-6">
                            <div>
                                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Nome Completo *</label>
                                <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Ex: Maria Oliveira" className="h-14 w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] transition-all outline-none font-semibold text-lg" />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">WhatsApp / Telefone</label>
                                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder="(11) 99999-9999" className="h-14 w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] transition-all outline-none font-bold font-mono tracking-widest text-lg" />
                            </div>
                            {error && <p className="text-[11px] text-red-500 font-bold uppercase tracking-tight bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
                            <div className="flex gap-4 mt-4 pt-8 border-t border-slate-100">
                                <button onClick={() => setShowForm(false)}
                                    className="flex-1 h-14 rounded-2xl bg-slate-100 text-[12px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all">
                                    Cancelar
                                </button>
                                 <button onClick={handleSave} disabled={saving} className="flex-1 h-14 btn-cyan shadow-[var(--accent-cyan-glow)] !text-[12px]">
                                    {saving ? 'Gravando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Perfil Cliente (Histórico/Fichas) */}
            {selectedClient && (
                <div className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-end bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedClient(null)}>
                    <div className="w-full max-w-lg h-full bg-[var(--bg-surface)] border-l border-[var(--border)] flex flex-col transform transition-transform animate-slide-left shadow-2xl" onClick={e => e.stopPropagation()}>
                        
                        {/* Header Perfil */}
                        <div className="p-8 border-b border-slate-100 relative shrink-0">
                            <button onClick={() => setSelectedClient(null)} className="absolute top-8 right-8 w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-glow)] transition-all"><Edit2 size={16}/></button>
                            <div className="flex items-center gap-5 mb-2 mt-4">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-cyan-deep)] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-[var(--accent-cyan-glow)]">
                                    {selectedClient.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)] capitalize">{selectedClient.name.toLowerCase()}</h2>
                                    <p className="text-sm font-mono text-[var(--accent-cyan)] font-bold mt-1 tracking-wider">{selectedClient.phone || 'Nenhum telefone'}</p>
                                </div>
                            </div>
                            
                            {/* Tabs Estilizadas */}
                            <div className="flex gap-6 mt-10">
                                <button onClick={() => setActiveTab('H')} className={`pb-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all relative ${activeTab === 'H' ? 'text-[var(--accent-cyan)]' : 'text-slate-400 hover:text-slate-600'}`}>
                                    Histórico
                                    {activeTab === 'H' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-cyan)] shadow-[0_2px_8px_var(--accent-cyan-glow)]" />}
                                </button>
                                <button onClick={() => setActiveTab('F')} className={`pb-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all relative ${activeTab === 'F' ? 'text-[var(--accent-cyan)]' : 'text-slate-400 hover:text-slate-600'}`}>
                                    Fichas e Notas
                                    {activeTab === 'F' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-cyan)] shadow-[0_2px_8px_var(--accent-cyan-glow)]" />}
                                </button>
                            </div>
                        </div>

                        {/* Corpo com Scroll Suave */}
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                            {loadingDetails ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                                    <div className="w-10 h-10 border-4 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[10px] uppercase tracking-widest font-bold">Carregando dados...</p>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'H' && (
                                        <div className="space-y-4">
                                            {(!clientDetails?.appointments || clientDetails.appointments.length === 0) ? (
                                                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                                    <Users size={40} className="mb-4 text-slate-300" />
                                                    <p className="text-sm text-slate-500 font-medium italic text-center px-10 line-height-relaxed">
                                                        Este cliente ainda não realizou nenhum serviço em nosso espaço.
                                                    </p>
                                                </div>
                                            ) : (
                                                clientDetails.appointments.map((app: any) => (
                                                    <div key={app.id} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[var(--accent-cyan-glow)] transition-all">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <p className="text-[var(--text-primary)] font-bold text-base">{app.service?.name || 'Serviço'}</p>
                                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1">
                                                                    {new Date(app.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-lg font-mono font-bold text-[var(--accent-cyan-deep)]">
                                                                    {app.payment?.amount ? `R$ ${app.payment.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'R$ 0,00'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                                                app.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                                            }`}>
                                                                {app.status === 'COMPLETED' ? 'Concluído' : app.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'F' && (
                                        <div className="flex flex-col h-full space-y-6">
                                            <div className="flex-1 space-y-4">
                                                {(!clientDetails?.records || clientDetails.records.length === 0) ? (
                                                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                                        <Edit2 size={40} className="mb-4 text-slate-300" />
                                                        <p className="text-sm text-slate-500 font-medium italic text-center px-10">
                                                            Ainda não há observações ou restrições técnicas para este perfil.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    clientDetails.records.map((rec: any) => (
                                                        <div key={rec.id} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-cyan)] bg-[var(--accent-cyan-glow)] px-2 py-1 rounded">
                                                                    {rec.type === 'ANAMNESIS' ? 'Prontuário' : 'Nota'}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    {new Date(rec.createdAt).toLocaleDateString('pt-BR')}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{rec.content}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            <div className="shrink-0 pt-6 border-t border-slate-100 space-y-3">
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registrar Nova Observação</h4>
                                                <textarea 
                                                    value={newRecord} 
                                                    onChange={e => setNewRecord(e.target.value)}
                                                    placeholder="Digite aqui fórmulas químicas, restrições ou preferências..."
                                                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-[var(--text-primary)] text-sm focus:border-[var(--accent-cyan)] transition-all outline-none resize-none h-28 font-medium shadow-inner"
                                                />
                                                <button onClick={handleSaveRecord} disabled={!newRecord.trim()} className="w-full h-12 btn-cyan shadow-[var(--accent-cyan-glow)]">
                                                    Salvar no Histórico
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

            {/* Lista Final - Fiel ao Exemplo (Nome e WhatsApp Lado a Lado) */}
            {loading ? (
                <div className="flex justify-center py-32"><div className="w-12 h-12 border-4 border-slate-200 border-t-[var(--accent-cyan)] rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="card flex flex-col items-center py-28 gap-4 border-dashed bg-slate-50/50">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <Users size={32} />
                    </div>
                    <p className="text-slate-400 font-serif italic text-xl">
                        {search ? 'Nenhum cliente encontrado...' : 'Sua carteira de clientes está vazia.'}
                    </p>
                </div>
            ) : (
                <div className="mt-12 w-full bg-white">
                    {/* Header - Alinhamento Horizontal Forçado */}
                    <div className="flex items-center px-10 py-3 border-b border-slate-50 bg-slate-50/30">
                        <div className="flex-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 italic">Nome</span>
                        </div>
                        <div className="w-[180px]">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">WhatsApp</span>
                        </div>
                        <div className="w-[120px] text-center">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Cadastro</span>
                        </div>
                        <div className="w-[80px] text-right">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Ações</span>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {filtered.map((c) => (
                            <div 
                                key={c.id} 
                                onClick={() => handleOpenClient(c)}
                                className="flex items-center px-10 py-2 hover:bg-slate-50/80 transition-all cursor-pointer group"
                            >
                                {/* Nome */}
                                <div className="flex-1 flex items-center gap-2">
                                    <span className="text-slate-200 font-bold">.</span>
                                    <span className="font-medium text-slate-700 text-[13px] capitalize truncate">
                                        {c.name.toLowerCase()}
                                    </span>
                                </div>
                                
                                {/* WhatsApp - LADO A LADO */}
                                <div className="w-[180px]">
                                    <span className="text-[12px] font-medium text-slate-400 font-mono tracking-tight">
                                        {c.phone || '-'}
                                    </span>
                                </div>

                                {/* Cadastro */}
                                <div className="w-[120px] text-center">
                                    <span className="text-[11px] font-medium text-slate-300">
                                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '-'}
                                    </span>
                                </div>

                                {/* Ações */}
                                <div className="w-[80px] flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleOpenClient(c); }}
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-[var(--accent-cyan)] hover:bg-white transition-all"
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemove(c.id, c.name); }}
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-white transition-all"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
