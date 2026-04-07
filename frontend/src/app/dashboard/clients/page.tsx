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
    const { user, hydrate } = useAuthStore();
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { hydrate(); }, []);

    const fetchClients = () => {
        setLoading(true);
        api.get('/clients')
            .then((r) => setClients(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchClients(); }, []);

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
        <div className="animate-fade-in w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Clientes</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {clients.length} clientes cadastrados
                    </p>
                </div>
                <button className="btn-cyan flex items-center gap-2 !rounded-xl"
                    onClick={() => { setShowForm(true); setError(''); }}>
                    <Plus size={16} /> Novo Cliente
                </button>
            </div>

            {/* Busca */}
            <div className="relative mb-5">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome ou telefone..."
                    className="input-field pl-9" />
            </div>

            {/* Modal / Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="card w-full max-w-[440px] animate-fade-in">
                        <h2 className="font-semibold text-base mb-5">Novo Cliente</h2>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Nome *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Nome do cliente" className="input-field" />
                            </div>
                            <div>
                                <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Telefone</label>
                                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder="(11) 99999-9999" className="input-field" />
                            </div>
                            {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
                            <div className="flex gap-3 mt-2">
                                <button onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                    Cancelar
                                </button>
                                 <button onClick={handleSave} disabled={saving} className="btn-cyan flex-1 flex items-center justify-center gap-2 !rounded-xl">
                                    {saving ? <span className="spinner" /> : null}
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista */}
            {loading ? (
                <div className="flex justify-center py-16"><span className="spinner" style={{ width: 36, height: 36 }} /></div>
            ) : filtered.length === 0 ? (
                <div className="card flex flex-col items-center py-16 gap-3">
                    <Users size={40} style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>
                        {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {filtered.map((c) => (
                        <div key={c.id} className="card flex items-center gap-4 py-3 px-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                                style={{ background: 'var(--accent-cyan-glow)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan-glow)' }}>
                                {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{c.name}</p>
                                {c.phone && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.phone}</span>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
