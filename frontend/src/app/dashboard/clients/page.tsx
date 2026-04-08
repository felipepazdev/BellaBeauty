'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { 
    Users, Search, UserPlus, Phone, Mail, 
    ArrowRight, Filter, Download, X, ClipboardList 
} from 'lucide-react';

interface Client {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    document?: string;
    createdAt: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientDetails, setClientDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [activeTab, setActiveTab] = useState<'H' | 'F'>('H');
    const [newRecord, setNewRecord] = useState('');
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', document: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const hydrate = useAuthStore(state => state.hydrate);

    const fetchClients = () => {
        setIsLoading(true);
        api.get('/clients')
            .then((r) => setClients(r.data))
            .catch(console.error)
            .finally(() => setIsLoading(false));
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

    const handleOpenClient = (client: Client) => {
        setSelectedClient(client);
        setActiveTab('H');
        setNewRecord('');
        fetchClientDetails(client.id);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) { setError('Nome é obrigatório'); return; }
        try {
            setSaving(true);
            setError('');
            await api.post('/clients', formData);
            setFormData({ name: '', phone: '', email: '', document: '' });
            setIsModalOpen(false);
            fetchClients();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Erro ao salvar cliente');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveRecord = async () => {
        if (!newRecord.trim() || !selectedClient) return;
        try {
            await api.post(`/clients/${selectedClient.id}/records`, {
                type: 'NOTE',
                content: newRecord
            });
            setNewRecord('');
            fetchClientDetails(selectedClient.id);
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar ficha.');
        }
    };

    const filteredClients = clients.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search)
    );

    return (
        <main className="min-h-screen p-4 sm:p-8 animate-fade-in bg-[#0a0a0c]">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-[32px] font-serif font-black text-white tracking-tight flex items-center gap-3">
                        <Users className="text-[#06b6d4] drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]" size={32} />
                        Gestão de Clientes
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Base estratégica de clientes Bella Beauty</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-8 py-3.5 rounded-2xl font-black text-[14px] flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(6,182,212,0.25)] active:scale-95 uppercase tracking-wider"
                    >
                        <UserPlus size={18} strokeWidth={3} />
                        Novo Cliente
                    </button>
                </div>
            </div>

            {/* ── Filtros e Busca ── */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-10">
                <div className="md:col-span-8 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#06b6d4] transition-all" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, CPF ou telefone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-[20px] pl-14 pr-6 text-white text-[15px] font-medium placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/20 focus:border-[#06b6d4]/50 transition-all shadow-inner"
                    />
                </div>
                <div className="md:col-span-4 flex gap-4">
                    <button className="flex-1 h-14 bg-white/5 border border-white/10 rounded-[20px] px-4 flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-white/10 transition-all font-bold text-[13px] uppercase tracking-widest">
                        <Filter size={18} />
                        Filtros
                    </button>
                    <button className="flex-1 h-14 bg-white/5 border border-white/10 rounded-[20px] px-4 flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-white/10 transition-all font-bold text-[13px] uppercase tracking-widest">
                        <Download size={18} />
                        Exportar
                    </button>
                </div>
            </div>

            {/* ── Grid de Clientes ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-44 bg-white/5 border border-white/10 rounded-[28px] animate-pulse" />
                    ))
                ) : filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                        <div
                            key={client.id}
                            onClick={() => handleOpenClient(client)}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[28px] p-6 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] hover:border-[#06b6d4]/30 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            {/* Accent lateral */}
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-[#06b6d4] opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_15px_rgba(6,182,212,0.6)]" />

                            <div className="flex items-start gap-5 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-2xl font-serif font-black text-[#06b6d4] shadow-2xl group-hover:scale-105 transition-all duration-500">
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold text-[18px] group-hover:text-[#06b6d4] transition-colors truncate">{client.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                                        <p className="text-slate-500 text-[13px] font-medium">{client.email || 'Registro Premium'}</p>
                                    </div>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 group-hover:text-white group-hover:bg-[#06b6d4] transition-all duration-300">
                                    <ArrowRight size={18} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.15em] mb-1">Telefone</p>
                                    <p className="text-white text-[13px] font-bold font-mono tracking-tight">{client.phone || '-'}</p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.15em] mb-1">Última Visita</p>
                                    <p className="text-white text-[13px] font-bold">Hoje</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-24 bg-white/5 border border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center text-center shadow-inner">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-700">
                            <Users size={48} />
                        </div>
                        <h3 className="text-white font-bold text-2xl">Nenhum cliente na mira</h3>
                        <p className="text-slate-500 max-w-sm mt-2 mx-auto">Ajuste os filtros ou inicie uma nova conexão cadastrando um cliente.</p>
                    </div>
                )}
            </div>

            {/* ── Modal de Cadastro ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-[#0c0c10] border border-white/10 w-full max-w-[480px] rounded-[32px] overflow-hidden shadow-2xl animate-scale-up">
                        <div className="p-10">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-[26px] font-serif font-black text-white">Cadastrar Cliente</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl text-slate-500 transition-all">
                                    <X size={22} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-5">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 ml-1">Nome Completo *</label>
                                        <input
                                            type="text" required
                                            className="w-full h-13 bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-white focus:outline-none focus:border-[#06b6d4]/50 focus:ring-2 focus:ring-[#06b6d4]/20 transition-all font-medium"
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 ml-1">WhatsApp / Telefone</label>
                                        <input
                                            type="text"
                                            className="w-full h-13 bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-white focus:outline-none focus:border-[#06b6d4]/50 focus:ring-2 focus:ring-[#06b6d4]/20 transition-all font-medium font-mono"
                                            value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 ml-1">E-mail</label>
                                        <input
                                            type="email"
                                            className="w-full h-13 bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-white focus:outline-none focus:border-[#06b6d4]/50 focus:ring-2 focus:ring-[#06b6d4]/20 transition-all font-medium"
                                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-[11px] font-black text-rose-500 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 uppercase tracking-tight">{error}</p>}

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 h-14 bg-white/5 text-slate-500 py-3 rounded-2xl font-bold hover:bg-white/10 transition-all uppercase text-[12px] tracking-widest"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit" disabled={saving}
                                        className="flex-1 h-14 bg-[#06b6d4] text-white py-3 rounded-2xl font-black shadow-lg shadow-[#06b6d4]/20 hover:bg-[#0891b2] transition-all active:scale-95 uppercase text-[12px] tracking-widest disabled:opacity-50"
                                    >
                                        {saving ? 'Gravando...' : 'Salvar Cliente'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Drawer de Perfil (Direita) ── */}
            {selectedClient && (
                <div className="fixed inset-0 z-[110] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedClient(null)} />
                    <div className="relative w-full max-w-xl bg-[#0c0c10] border-l border-white/10 h-full shadow-2xl animate-sidebar-right flex flex-col">
                        
                        {/* Header Perfil */}
                        <div className="p-10 pb-6 border-b border-white/5 relative shrink-0">
                            <button onClick={() => setSelectedClient(null)} className="absolute top-8 right-8 w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-rose-500/20 transition-all group">
                                <X size={20} className="group-hover:rotate-90 transition-transform" />
                            </button>
                            
                            <div className="flex flex-col items-center text-center">
                                <div className="w-28 h-28 rounded-[38px] bg-gradient-to-br from-[#06b6d4] to-[#7c3aed] p-1 shadow-2xl shadow-cyan-500/20 animate-scale-in mb-6">
                                    <div className="w-full h-full rounded-[36px] bg-[#0c0c10] flex items-center justify-center text-4xl font-serif font-black text-white">
                                        {selectedClient.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <h2 className="text-[32px] font-serif font-black text-white leading-tight">{selectedClient.name}</h2>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-[#06b6d4] text-[11px] font-black uppercase tracking-[0.2em]">Perfil VIP</span>
                                    <span className="text-slate-600 font-bold font-mono text-xs">#{selectedClient.id.slice(-6)}</span>
                                </div>
                            </div>

                            {/* Tabs Minimalistas */}
                            <div className="flex gap-10 mt-12">
                                <button onClick={() => setActiveTab('H')} className={`pb-4 text-[12px] font-black uppercase tracking-[0.15em] transition-all relative ${activeTab === 'H' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}>
                                    Histórico
                                    {activeTab === 'H' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#06b6d4] shadow-[0_0_10px_rgba(6,182,212,1)]" />}
                                </button>
                                <button onClick={() => setActiveTab('F')} className={`pb-4 text-[12px] font-black uppercase tracking-[0.15em] transition-all relative ${activeTab === 'F' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}>
                                    Fichas
                                    {activeTab === 'F' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#06b6d4] shadow-[0_0_10px_rgba(6,182,212,1)]" />}
                                </button>
                            </div>
                        </div>

                        {/* Conteúdo Dinâmico */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-black/5">
                            {loadingDetails ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
                                    <div className="w-12 h-12 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Codificando dados...</p>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'H' && (
                                        <div className="space-y-6">
                                            {/* Métricas do Perfil */}
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 shadow-xl">
                                                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-2">Visitas Totais</p>
                                                    <p className="text-white text-3xl font-serif font-black">{clientDetails?.appointments?.length || 0}</p>
                                                </div>
                                                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 shadow-xl">
                                                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-2">Ticket Médio</p>
                                                    <p className="text-[#06b6d4] text-3xl font-serif font-black">R$ 145</p>
                                                </div>
                                            </div>

                                            {/* Timeline de Visitas */}
                                            <div className="space-y-4">
                                                <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-1">Atendimentos Recentes</h4>
                                                {clientDetails?.appointments?.length === 0 ? (
                                                    <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-10 text-center">
                                                        <p className="text-slate-500 italic text-sm">Nenhuma visita detectada</p>
                                                    </div>
                                                ) : (
                                                    clientDetails?.appointments?.map((app: any) => (
                                                        <div key={app.id} className="bg-white/5 border border-white/5 p-5 rounded-3xl hover:border-[#06b6d4]/20 transition-all group/app flex items-center justify-between">
                                                            <div>
                                                                <p className="text-white font-bold text-base group-hover/app:text-[#06b6d4] transition-colors">{app.service?.name || 'Serviço Premium'}</p>
                                                                <p className="text-[11px] text-slate-600 font-black uppercase tracking-wider mt-1">{new Date(app.date).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-white font-serif font-black text-lg">R$ {app.payment?.amount?.toLocaleString()}</p>
                                                                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Pago</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'F' && (
                                        <div className="flex flex-col h-full space-y-8">
                                            <div className="flex-1 space-y-4">
                                                <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-1">Registros de Evolução</h4>
                                                {clientDetails?.records?.length === 0 ? (
                                                    <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-10 text-center text-slate-600 italic text-sm">
                                                        Sem registros até o momento
                                                    </div>
                                                ) : (
                                                    clientDetails?.records?.map((rec: any) => (
                                                        <div key={rec.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <span className="px-3 py-1 rounded-lg bg-[#06b6d4]/10 text-[#06b6d4] text-[10px] font-black uppercase tracking-widest">
                                                                    {rec.type === 'ANAMNESIS' ? 'Anamnese' : 'Observação'}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-600 uppercase">
                                                                    {new Date(rec.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-300 text-sm font-medium leading-relaxed">{rec.content}</p>
                                                            {rec.professional && <p className="text-[11px] text-slate-600 font-bold border-t border-white/5 pt-3">Resp: {rec.professional.name}</p>}
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
                                                <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-1">Nova Anotação Técnica</h4>
                                                <textarea 
                                                    value={newRecord} 
                                                    onChange={e => setNewRecord(e.target.value)}
                                                    placeholder="Digite fórmulas, preferências ou observações da sessão..."
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white text-sm font-medium focus:border-[#06b6d4]/50 transition-all outline-none resize-none h-32"
                                                />
                                                <button onClick={handleSaveRecord} disabled={!newRecord.trim()} 
                                                    className="w-full h-14 bg-[#06b6d4] text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50 transition-all"
                                                >
                                                    Salvar Registro
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer Bloqueado */}
                        <div className="p-10 border-t border-white/5 bg-black/40 backdrop-blur-md">
                            <button className="w-full h-15 bg-white/10 hover:bg-[#06b6d4] text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group">
                                <ClipboardList size={22} className="group-hover:scale-110 transition-transform" />
                                Iniciar Procedimento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
