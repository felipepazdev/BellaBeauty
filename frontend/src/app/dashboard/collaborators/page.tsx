"use client";

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { 
    UserCog, Plus, X, Shield, Edit2, Trash2, ChevronLeft, ChevronRight, 
    User, Settings, Clock, DollarSign, Wallet, Search, 
    Download, CheckCircle2, MoreHorizontal, Calendar, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '@/store/auth.store';

interface Collaborator {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions?: string;
    isActive: boolean;
    createdAt: string;
    professional?: { 
        id: string; 
        name: string; 
        commission?: number; 
        contractType?: string; 
        niches?: { id: string; name: string }[];
        services?: { id: string; name: string }[];
    };
}

interface ProfNiche {
    id: string;
    name: string;
}

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    PROFESSIONAL: 'Profissional',
};
const ROLE_CLS: Record<string, string> = {
    ADMIN: 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20',
    MANAGER: 'badge-warning',
    PROFESSIONAL: 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20',
};

const SYSTEM_PERMISSIONS = [
    { key: 'dashboard_view', label: 'Ver Dashboard' },
    { key: 'appointments_view', label: 'Ver Agendamentos' },
    { key: 'appointments_manage', label: 'Gerenciar Agendamentos' },
    { key: 'cashflow_view', label: 'Ver Fluxo de Caixa' },
    { key: 'expenses_manage', label: 'Gerenciar Despesas' },
    { key: 'services_manage', label: 'Gerenciar Serviços' },
    { key: 'products_manage', label: 'Gerenciar Produtos' },
    { key: 'clients_manage', label: 'Gerenciar Clientes' },
    { key: 'collaborators_view', label: 'Ver Colaboradores' },
    { key: 'collaborators_manage', label: 'Gerenciar Colaboradores' },
    { key: 'orders_manage', label: 'Gerenciar Comandas' },
    { key: 'reports_view', label: 'Ver Relatórios' },
    { key: 'schedule_outside_hours', label: 'Agendar fora do horário' },
];

export default function CollaboratorsPage() {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [niches, setNiches] = useState<ProfNiche[]>([]);
    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ id: '', name: '', email: '', password: '', role: 'PROFESSIONAL', nicheIds: [] as string[], commission: 50, contractType: 'COMMISSION' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'SETTINGS' | 'ACTIVITIES' | 'SALARIES' | 'ADVANCES'>('PROFILE');

    const openNew = () => {
        setForm({ id: '', name: '', email: '', password: '', role: 'PROFESSIONAL', nicheIds: [], commission: 50, contractType: 'COMMISSION' });
        setIsEditing(false);
        setShowForm(true);
        setError('');
    };

    const handleEdit = (c: Collaborator) => {
        setForm({
            id: c.id,
            name: c.name,
            email: c.email,
            password: '',
            role: c.role,
            nicheIds: c.professional?.niches?.map(n => n.id) || [],
            commission: c.professional?.commission ?? 50,
            contractType: c.professional?.contractType || 'COMMISSION',
        });
        setIsEditing(true);
        setShowForm(true);
        setError('');
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Tem certeza que deseja remover o colaborador ${name}?`)) return;
        try {
            await api.delete(`/users/${id}`);
            fetchData();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Erro ao remover colaborador');
        }
    };

    const fetchData = async (currentStatus?: 'active' | 'inactive' | 'all') => {
        setLoading(true);
        try {
            const statusToFetch = currentStatus || statusFilter;
            const [usersRes, nichesRes] = await Promise.all([
                api.get(`/users?status=${statusToFetch}`),
                api.get('/service-categories/niches')
            ]);
            setCollaborators(usersRes.data);
            setNiches(nichesRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const toggleStatus = (st: 'active' | 'inactive') => {
        setStatusFilter(st);
        setDropdownOpen(false);
        fetchData(st);
    };

    const handleSave = async () => {
        if (!form.name || !form.email || (!isEditing && !form.password)) { setError('Preencha os campos obrigatórios'); return; }
        try {
            setSaving(true); setError('');
            const payload: any = { name: form.name, email: form.email, role: form.role };
            if (form.role === 'PROFESSIONAL') {
                payload.nicheIds = form.nicheIds;
                payload.commission = Number(form.commission);
                payload.contractType = form.contractType;
            }
            if (!isEditing) payload.password = form.password;

            if (isEditing) {
                await api.put(`/users/${form.id}`, payload);
            } else {
                await api.post('/users', payload);
            }

            setForm({ id: '', name: '', email: '', password: '', role: 'PROFESSIONAL', nicheIds: [], commission: 50, contractType: 'COMMISSION' });
            setIsEditing(false);
            setShowForm(false);
            fetchData();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Erro ao salvar colaborador');
        } finally {
            setSaving(false);
        }
    };

    // If selectedCollaborator is set, we show the profile instead of the list
    // But we don't return early here to keep the Modal and other common elements accessible

    return (
        <div className="animate-fade-in w-full">
            {selectedCollaborator ? (
                <CollaboratorProfile 
                    collaborator={selectedCollaborator} 
                    onBack={() => { setSelectedCollaborator(null); fetchData(); }}
                    onEdit={() => handleEdit(selectedCollaborator)}
                    niches={niches}
                />
            ) : (
                <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-[var(--text-primary)] mb-1">Colaboradores</h1>
                        <p className="text-[14px] text-[var(--text-secondary)]">{collaborators.length} colaboradores cadastrados na equipe.</p>
                    </div>

                    {/* Status Toggle Dropdown */}
                    <div className="relative ml-4">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-all text-sm font-semibold text-[var(--text-primary)]"
                        >
                            {statusFilter === 'active' ? 'Ativos' : 'Excluídos'}
                            <MoreHorizontal size={14} className="opacity-40" />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-40 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <button 
                                    onClick={() => toggleStatus('active')}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-[var(--accent)]/5 transition-colors ${statusFilter === 'active' ? 'text-[var(--text-primary)] font-bold bg-[var(--accent)]/5' : 'text-[var(--text-secondary)]'}`}
                                >
                                    Ativos
                                </button>
                                <button 
                                    onClick={() => toggleStatus('inactive')}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-[var(--accent)]/5 transition-colors ${statusFilter === 'inactive' ? 'text-[var(--text-primary)] font-bold bg-[var(--accent)]/5' : 'text-[var(--text-secondary)]'}`}
                                >
                                    Excluídos
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <button className="btn-gold px-6 py-2.5 flex items-center gap-2" onClick={openNew}>
                    <Plus size={16} /> Novo Colaborador
                </button>
            </div>

                    {/* Lista */}
                    {loading ? (
                        <div className="flex justify-center py-16"><span className="spinner" style={{ width: 36, height: 36 }} /></div>
                    ) : collaborators.length === 0 ? (
                        <div className="card flex flex-col items-center py-16 gap-3">
                            <UserCog size={40} style={{ color: 'var(--text-muted)' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Nenhum colaborador cadastrado</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8">
                            {/* Render grouped professionals */}
                            {['PROFESSIONAL', 'MANAGER', 'ADMIN'].map(roleType => {
                                const usersOfRole = collaborators.filter(c => c.role === roleType);
                                if (usersOfRole.length === 0) return null;

                                if (roleType === 'PROFESSIONAL') {
                                    return (
                                        <div key={roleType} className="flex flex-col gap-4">
                                            <h2 className="text-[14px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 mt-4">Profissionais</h2>
                                            <div className="flex flex-col gap-3">
                                                {usersOfRole.map((c) => (
                                                    <div key={c.id} onClick={() => { setSelectedCollaborator(c); setActiveTab('PROFILE'); }}
                                                        className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl flex items-center gap-5 p-5 hover:border-[var(--accent)]/30 hover:bg-[var(--bg-card-hover)] transition-all cursor-pointer group">
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0 bg-[var(--bg-card)] text-[var(--text-primary)] shadow-inner">
                                                            {c.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <p className="font-semibold text-[16px] text-[var(--text-primary)] tracking-tight leading-none mb-1.5">{c.name}</p>
                                                            <p className="text-[13px] text-[var(--text-secondary)] leading-none">{c.email}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`badge ${ROLE_CLS[c.role] ?? 'badge-gray'} !px-3 !py-1 !text-[11px]`}>
                                                                {ROLE_LABELS[c.role] ?? c.role}
                                                            </span>
                                                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleEdit(c); }} 
                                                                    className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.name); }} 
                                                                    className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] transition-colors hover:text-[var(--danger)]"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                // Admins or Managers
                                return (
                                    <div key={roleType} className="flex flex-col gap-4">
                                        <h2 className="text-[14px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 mt-4">{ROLE_LABELS[roleType]}s</h2>
                                        <div className="flex flex-col gap-3">
                                            {usersOfRole.map((c) => (
                                                <div key={c.id} onClick={() => { setSelectedCollaborator(c); setActiveTab('PROFILE'); }}
                                                    className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl flex items-center gap-5 p-5 hover:border-[var(--accent)]/30 hover:bg-[var(--bg-card-hover)] transition-all cursor-pointer group">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0 bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-gold-deep)] text-[#1a1505] shadow-lg shadow-[var(--accent-gold-glow)] ring-1 ring-white/10">
                                                        {c.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <p className="font-semibold text-[16px] text-[var(--text-primary)] tracking-tight leading-none mb-1.5">{c.name}</p>
                                                        <p className="text-[13px] text-[var(--text-secondary)] leading-none">{c.email}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`badge ${ROLE_CLS[c.role] ?? 'badge-gray'} !px-3 !py-1 !text-[11px]`}>
                                                            {ROLE_LABELS[c.role] ?? c.role}
                                                        </span>
                                                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(c); }} 
                                                                className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.name); }} 
                                                                className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] transition-colors hover:text-[var(--danger)]"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setShowForm(false)}>
                    <div 
                        className="w-full max-w-lg lg:ml-[230px] bg-[var(--bg-surface)] border border-[var(--border)] p-8 rounded-[2rem] shadow-2xl animate-scale-in relative max-h-[90vh] overflow-y-auto custom-scrollbar"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black uppercase tracking-widest text-[var(--text-primary)]">
                                {isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Nome completo *</label>
                                <input 
                                    className="w-full h-14 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-5 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                                    placeholder="Ex: Maria Antonieta"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">E-mail de acesso *</label>
                                <input 
                                    type="email"
                                    className="w-full h-14 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-5 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                                    placeholder="email@exemplo.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>

                            {!isEditing && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Senha de acesso *</label>
                                    <input 
                                        type="password"
                                        className="w-full h-14 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-5 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                                        placeholder="Mínimo 6 caracteres"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Função do colaborador</label>
                                <select 
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    disabled={isEditing}
                                    className="w-full h-14 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-5 text-[14px] font-bold text-[var(--text-primary)] appearance-none focus:outline-none focus:border-[var(--accent)] transition-all"
                                >
                                    <option value="PROFESSIONAL" className="bg-[var(--bg-surface)]">Profissional</option>
                                    <option value="MANAGER" className="bg-[var(--bg-surface)]">Gerente</option>
                                    <option value="ADMIN" className="bg-[var(--bg-surface)]">Administrador</option>
                                </select>
                            </div>

                            {form.role === 'PROFESSIONAL' && (
                                <div className="pt-4 flex flex-col gap-6 border-t border-white/5">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nichos de Atuação no sistema</label>
                                        <div className="flex flex-wrap gap-2">
                                            {niches.map(n => {
                                                const isSelected = form.nicheIds.includes(n.id);
                                                return (
                                                    <button
                                                        key={n.id}
                                                        onClick={() => {
                                                            const newIds = isSelected 
                                                                ? form.nicheIds.filter(id => id !== n.id)
                                                                : [...form.nicheIds, n.id];
                                                            setForm({ ...form, nicheIds: newIds });
                                                        }}
                                                        className={`
                                                            px-4 py-2 rounded-xl text-xs font-bold transition-all
                                                            ${isSelected 
                                                                ? 'bg-[var(--accent-gold)] text-[#1a1505] shadow-lg shadow-[var(--accent-gold-glow)]' 
                                                                : 'bg-white/5 text-white/40 hover:bg-white/10'}
                                                        `}
                                                    >
                                                        {n.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Tipo de Contrato</label>
                                            <select 
                                                value={form.contractType}
                                                onChange={(e) => setForm({ ...form, contractType: e.target.value })}
                                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-[14px] font-bold text-white appearance-none focus:outline-none focus:border-[var(--accent-light)] transition-all"
                                            >
                                                <option value="COMMISSION" className="bg-[#1a1628]">Comissionado</option>
                                                <option value="RENT" className="bg-[#1a1628]">Aluguel</option>
                                            </select>
                                        </div>

                                        {form.contractType === 'COMMISSION' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Comissão Geral (%)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={form.commission}
                                                        onChange={(e) => setForm({ ...form, commission: Number(e.target.value) })}
                                                        min={0} max={100}
                                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 pr-12 text-[14px] font-bold text-white focus:outline-none focus:border-[var(--accent-light)] transition-all"
                                                    />
                                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 font-bold">%</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {error && <p className="text-xs font-bold text-red-500 bg-red-500/10 p-4 rounded-2xl">{error}</p>}

                            <div className="flex items-center gap-4 pt-4">
                                <button onClick={() => setShowForm(false)}
                                    className="flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">
                                    Cancelar
                                </button>
                                <button onClick={handleSave} disabled={saving} 
                                    className="flex-[1.5] h-12 btn-gold shadow-[var(--accent-gold-glow)]">
                                    {saving ? 'CRIANDO...' : (isEditing ? 'SALVAR ALTERAÇÕES' : 'CRIAR CONTA')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SUB-COMPONENTS FOR PROFILE VIEW ---

function CollaboratorProfile({ collaborator, onBack, onEdit, niches }: { 
    collaborator: Collaborator; 
    onBack: () => void; 
    onEdit: () => void;
    niches: ProfNiche[];
}) {
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'SETTINGS' | 'ACTIVITIES' | 'SALARIES' | 'ADVANCES'>('PROFILE');

    return (
        <div className="animate-fade-in w-full min-h-[calc(100vh-120px)] pb-10 px-4 flex items-center justify-center">
            {/* Main Profile Card */}
            <div className="w-full max-w-5xl bg-[#111019] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden" 
                 style={{ padding: '48px' }}>
                {/* 1. Header Navigation */}
                <div className="flex items-center justify-between" style={{ marginBottom: '80px' }}>
                    <button onClick={onBack} 
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold tracking-tight text-[15px]">Colaborador</span>
                    </button>
                    <button onClick={onEdit} 
                        className="text-white/40 hover:text-[var(--accent-gold)] transition-colors text-xs font-black tracking-[0.2em] uppercase">
                        EDITAR
                    </button>
                </div>

                {/* 2. Identity Row */}
                <div className="flex flex-col md:flex-row items-center gap-8" style={{ marginBottom: '48px' }}>
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full border-4 border-[#111019] overflow-hidden shadow-2xl bg-white/5 flex items-center justify-center">
                             <div className="text-4xl font-semibold text-white">
                                {collaborator.name.charAt(0).toUpperCase()}
                             </div>
                        </div>
                        <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-[#111019] ${collaborator.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="font-semibold text-white tracking-tight leading-tight mb-2 text-[28px]">{collaborator.name}</h2>
                        <p className="text-[15px] text-white/50">{collaborator.email}</p>
                    </div>
                </div>

                {/* 3. Underlined Navigation Tabs */}
                <div className="flex items-center gap-8 border-b border-white/5 overflow-x-auto no-scrollbar" style={{ marginBottom: '40px' }}>
                    {[
                        { id: 'PROFILE', label: 'PERFIL' },
                        { id: 'SETTINGS', label: 'CONFIGURAÇÕES' },
                        { id: 'ACTIVITIES', label: 'ATIVIDADES' },
                        { id: 'SALARIES', label: 'SALÁRIOS' },
                        { id: 'ADVANCES', label: 'VALES' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                pb-4 text-[13px] font-semibold tracking-wide transition-all relative whitespace-nowrap
                                ${activeTab === tab.id 
                                    ? 'text-white' 
                                    : 'text-white/40 hover:text-white/80'}
                            `}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* 4. Internal Content Container */}
                <div className="animate-slide-up">
                    {activeTab === 'PROFILE' && <ProfileTab collaborator={collaborator} />}
                    {activeTab === 'SETTINGS' && <SettingsTab collaborator={collaborator} />}
                    {activeTab === 'ACTIVITIES' && <ActivitiesTab collaborator={collaborator} />}
                    {activeTab === 'SALARIES' && <SalariesTab collaborator={collaborator} />}
                    {activeTab === 'ADVANCES' && <AdvancesTab collaborator={collaborator} />}
                </div>
            </div>
        </div>
    );
}

function ProfileTab({ collaborator }: { collaborator: Collaborator }) {
    const isProf = collaborator.role === 'PROFESSIONAL';
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Identity Card */}
            <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="bg-[#15151e] border border-white/5 rounded-2xl p-8">
                    <h3 className="text-[14px] font-bold uppercase tracking-widest text-white/40 mb-8">
                        Informações de Atuação
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-8">
                        {[
                            { label: 'E-mail', value: collaborator.email },
                            { label: 'Cargo Principal', value: ROLE_LABELS[collaborator.role] || 'N/A' },
                            { label: 'Telefone', value: 'Não informado' },
                            { label: 'Nichos de Atuação', value: isProf && collaborator.professional?.niches?.length ? collaborator.professional.niches.map(n => n.name).join(', ') : 'Geral' },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col border-white/5 pb-2">
                                <p className="text-[12px] font-medium text-white/40 mb-1">{item.label}</p>
                                <p className="text-[15px] font-semibold text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>


            </div>

            {/* Quick Actions / Side Card */}
            <div className="lg:col-span-5">
                <div className="bg-[#15151e] border border-white/5 rounded-2xl p-8">
                     <h3 className="text-[14px] font-bold uppercase tracking-widest text-white/40 mb-6">
                        Resumo do Perfil
                     </h3>
                     <p className="text-[14px] leading-relaxed text-white/50 mb-8">
                        Colaborador estratégico registrado na unidade Bella Beauty. Este perfil centraliza as configurações de comissão, agenda de serviços e histórico financeiro.
                     </p>
                     
                     <div className="space-y-4 pt-6 mt-6 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] text-white/50">Membro desde</span>
                            <span className="text-[14px] font-semibold text-white">Março, 2026</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] text-white/50">Nível de Acesso</span>
                            <span className="badge badge-gray !px-2 !py-0.5 !text-[11px]">{ROLE_LABELS[collaborator.role]}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] text-white/50">Desempenho</span>
                            {collaborator.isActive ? (
                                <span className="text-[11px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded uppercase tracking-wide">Ativo</span>
                            ) : (
                                <span className="text-[11px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded uppercase tracking-wide">Inativo</span>
                            )}
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
}

const SETTINGS_ITEMS = [
    { id: 'HOURS', icon: Clock, label: 'Horários de Trabalho', desc: 'Configure os horários de trabalho do colaborador' },
    { id: 'SERVICES', icon: UserCog, label: 'Serviços', desc: 'Configure os serviços que o colaborador pode executar' },
    { id: 'PERMISSIONS', icon: Shield, label: 'Permissões', desc: 'Defina as permissões do colaborador no sistema', adminOnly: true },
];

function SettingsTab({ collaborator }: { collaborator: Collaborator }) {
    const [view, setView] = useState<'LIST' | 'SERVICES' | 'HOURS' | 'PERMISSIONS'>('LIST');
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN';

    if (view === 'SERVICES') {
        return <ProfessionalServicesSelection collaborator={collaborator} onBack={() => setView('LIST')} />;
    }

    if (view === 'PERMISSIONS') {
        return <PermissionsTab collaborator={collaborator} onBack={() => setView('LIST')} />;
    }

    if (view === 'HOURS') {
        return <WorkingHoursTab collaborator={collaborator} onBack={() => setView('LIST')} />;
    }

    return (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto py-10">
            {SETTINGS_ITEMS.map((item, idx) => {
                // Se o item é apenas para admin e o usuário atual não é admin, oculta
                if (item.adminOnly && !isAdmin) return null;

                return (
                    <div key={idx} 
                        onClick={() => {
                            if (item.id === 'SERVICES') setView('SERVICES');
                            if (item.id === 'PERMISSIONS') setView('PERMISSIONS');
                            if (item.id === 'HOURS') setView('HOURS');
                        }}
                        className="flex items-center gap-6 p-6 md:p-8 rounded-3xl bg-[#15151e] border border-white/5 hover:border-[var(--accent-light)]/30 hover:bg-[#1a1a24] cursor-pointer transition-all duration-300 group shadow-lg">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 group-hover:bg-[var(--accent-light)] group-hover:text-white transition-all">
                            <item.icon size={24} className="opacity-60 group-hover:opacity-100" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-[16px] text-white/90 group-hover:text-white transition-colors mb-1">{item.label}</h4>
                            <p className="text-[13px] text-white/40 group-hover:text-white/60 transition-colors">{item.desc}</p>
                        </div>
                        <ChevronLeft size={20} className="rotate-180 opacity-20 group-hover:opacity-60 transition-all group-hover:translate-x-1" />
                    </div>
                );
            })}
        </div>
    );
}

function PermissionsTab({ collaborator, onBack }: { collaborator: Collaborator; onBack: () => void }) {
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        collaborator.permissions ? collaborator.permissions.split(',') : []
    );
    const [saving, setSaving] = useState(false);

    const togglePermission = (key: string) => {
        setSelectedPermissions(prev => 
            prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/users/${collaborator.id}`, { 
                permissions: selectedPermissions.join(',') 
            });
            alert('Permissões atualizadas com sucesso!');
            onBack();
        } catch (e) {
            alert('Erro ao salvar permissões');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto py-6 animate-fade-in">
            <div className="flex items-center justify-between mb-10">
                <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-tight text-[15px]">Voltar</span>
                </button>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-white text-black font-semibold text-[14px] rounded-lg hover:bg-white/90 transition-colors shadow-sm flex items-center gap-2">
                    {saving ? <span className="spinner opacity-50 border-black/20 border-t-black !w-4 !h-4" /> : null}
                    {saving ? 'SALVANDO...' : 'SALVAR PERMISSÕES'}
                </button>
            </div>

            <div className="mb-14">
                <h3 className="text-[28px] font-semibold tracking-tight text-white mb-2">Controle de Acesso</h3>
                <p className="text-[15px] text-white/50">
                    Defina o que <span className="text-white font-medium">{collaborator.name}</span> pode visualizar e gerenciar no sistema.
                    <br />
                    <span className="text-[12px] mt-2 block text-[var(--accent-gold)] uppercase tracking-wide font-bold">Role: {ROLE_LABELS[collaborator.role]}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SYSTEM_PERMISSIONS.map((perm) => {
                    const active = selectedPermissions.includes(perm.key);
                    return (
                        <div key={perm.key} 
                            onClick={() => togglePermission(perm.key)}
                            className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                                active 
                                ? 'bg-[var(--accent-gold)]/10 border-[var(--accent-gold)]/40 shadow-sm' 
                                : 'bg-[#15151e] border-white/5 hover:border-white/10 hover:bg-[#1a1a24]'
                            }`}>
                            <div className="flex flex-col">
                                <p className={`text-[14px] font-semibold transition-colors ${active ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>{perm.label}</p>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mt-1">{perm.key}</p>
                            </div>
                            
                            {/* Toggle UI */}
                            <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 ${active ? 'bg-[var(--accent-gold)]' : 'bg-white/10'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ProfessionalServicesSelection({ collaborator, onBack }: { collaborator: Collaborator; onBack: () => void }) {
    const [niches, setNiches] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>(collaborator.professional?.services?.map(s => s.id) || []);
    const [statusFilter, setStatusFilter] = useState<'all' | 'selected'>('all'); // To allow toggling view if needed later
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch the full niche hierarchy
                const res = await api.get('/service-categories/niches');
                
                // Get collaborator niche IDs
                const collaboratorNicheIds = collaborator.professional?.niches?.map(n => n.id) || [];
                
                // Filter niches to show only those assigned to the collaborator
                const filteredNiches = res.data.filter((n: any) => collaboratorNicheIds.includes(n.id));
                
                setNiches(filteredNiches);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [collaborator]);

    const toggleService = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/users/${collaborator.id}`, { serviceIds: selectedIds });
            alert('Serviços atualizados com sucesso!');
            onBack();
        } catch (e) {
            alert('Erro ao salvar serviços');
        } finally { setSaving(false); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[var(--accent-gold)]/20 border-t-[var(--accent-gold)] rounded-full animate-spin" />
            <p className="text-sm font-bold tracking-widest opacity-40 uppercase">Carregando serviços...</p>
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto py-6 animate-fade-in">
            <div className="flex items-center justify-between mb-10">
                <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-tight text-[15px]">Voltar</span>
                </button>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-white text-black font-semibold text-[14px] rounded-lg hover:bg-white/90 transition-colors shadow-sm flex items-center gap-2">
                    {saving ? <span className="spinner opacity-50 border-black/20 border-t-black !w-4 !h-4" /> : null}
                    {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                </button>
            </div>

            <div className="mb-14">
                <h3 className="text-[28px] font-semibold tracking-tight text-white mb-2">Serviços Habilitados</h3>
                <p className="text-[15px] text-white/50 whitespace-pre-wrap">
                    Defina quais procedimentos <span className="text-white font-medium">{collaborator.name}</span> está apto(a) a realizar. 
                    <br />Nichos vinculados: <span className="text-[var(--accent-light)] font-medium">
                        {collaborator.professional?.niches?.map(n => n.name).join(', ') || 'Nenhum nicho vinculado'}
                    </span>
                </p>
            </div>

            <div className="space-y-16">
                {niches.length === 0 ? (
                    <div className="py-20 text-center bg-[#15151e] rounded-3xl border border-white/5">
                        <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Nenhum serviço disponível.</p>
                        <p className="text-xs text-white/20 mt-2">Vincule nichos ao perfil do colaborador para habilitar serviços.</p>
                    </div>
                ) : (
                    niches.map(niche => (
                        <div key={niche.id} className="animate-slide-up bg-[#15151e] border border-white/5 rounded-3xl p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <h4 className="text-[18px] font-semibold text-white tracking-tight">
                                    {niche.name}
                                </h4>
                                <div className="h-[1px] flex-1 bg-white/5" />
                            </div>

                            <div className="space-y-10 pl-2">
                                {niche.categories?.map((cat: any) => (
                                    <div key={cat.id}>
                                        <div className="flex items-center gap-3 mb-5 pl-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-light)]" />
                                            <h5 className="text-[14px] font-semibold uppercase tracking-widest text-[#a1a1aa]">{cat.name}</h5>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                                            {cat.services?.map((s: any) => {
                                                const selected = selectedIds.includes(s.id);
                                                return (
                                                    <div key={s.id} 
                                                         onClick={() => toggleService(s.id)}
                                                         className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                                                            selected 
                                                            ? 'bg-[var(--accent-light)]/10 border-[var(--accent-light)]/40 shadow-sm' 
                                                            : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-[#1a1a24]'
                                                         }`}>
                                                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                                                            selected ? 'bg-[var(--accent-light)] border-[var(--accent-light)]' : 'border-white/20 group-hover:border-white/30'
                                                        }`}>
                                                            {selected && <Check size={14} className="text-white" strokeWidth={3} />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className={`text-[14px] font-semibold transition-colors ${selected ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>{s.name}</p>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <span className="text-[11px] font-bold uppercase tracking-widest text-white/30">{s.duration} MIN</span>
                                                                <span className="text-[11px] font-bold uppercase tracking-widest text-green-400">
                                                                    {s.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ActivitiesTab({ collaborator }: { collaborator: Collaborator }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/appointments/professional/${collaborator.professional?.id || 'null'}`)
            .then(res => setActivities(res.data))
            .catch(() => setActivities([]))
            .finally(() => setLoading(false));
    }, [collaborator]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[var(--accent-light)]/20 border-t-[var(--accent-light)] rounded-full animate-spin" />
            <p className="text-sm font-bold tracking-widest opacity-40 uppercase">Carregando histórico...</p>
        </div>
    );

    return (
        <div className="w-full bg-[#15151e] rounded-3xl border border-white/5 shadow-lg p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-[16px] font-semibold text-white tracking-tight">Últimos Atendimentos</h3>
                <div className="flex items-center gap-2">
                   <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white">
                        <Search size={18} />
                   </button>
                   <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white">
                        <Download size={18} />
                   </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest">Data e Hora</th>
                            <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest">Cliente</th>
                            <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest">Serviço Realizado</th>
                            <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest">Valor</th>
                            <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest text-right">Situação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {activities.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-16 text-center text-white/40 font-medium text-[13px]">Nenhum atendimento encontrado.</td>
                            </tr>
                        ) : (
                            activities.map((a: any) => (
                                <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-5 py-4">
                                        <div className="font-semibold text-[14px] text-white/90">{format(new Date(a.date), "dd/MMM/yy", { locale: ptBR })}</div>
                                        <div className="text-[12px] text-white/40 mt-0.5">{format(new Date(a.date), "HH:mm 'hs'")}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#111116] border border-white/10 flex items-center justify-center text-[12px] font-bold text-white/80">
                                                {a.client?.name.charAt(0)}
                                            </div>
                                            <span className="text-[14px] font-semibold text-white/90">{a.client?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111116] border border-white/5 text-[12px] font-semibold text-white/80">
                                            <Calendar size={14} className="text-white/40" />
                                            {a.service?.name}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-[14px] font-bold text-[var(--accent-light)]">R$ {a.service?.price.toFixed(2)}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className={`
                                            inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest
                                            ${a.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/50'}
                                        `}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'COMPLETED' ? 'bg-green-400' : 'bg-white/30'}`} />
                                            {a.status === 'COMPLETED' ? 'Finalizado' : a.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {activities.length > 0 && (
                <div className="p-4 border-t border-white/5 text-center mt-4">
                    <button className="text-[13px] font-semibold text-white/40 hover:text-white transition-colors">Ver mais atendimentos</button>
                </div>
            )}
        </div>
    );
}

function SalariesTab({ collaborator }: { collaborator: Collaborator }) {
    const [commissions, setCommissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/commissions?professionalId=${collaborator.professional?.id || 'null'}`)
            .then(res => setCommissions(res.data))
            .catch(() => setCommissions([]))
            .finally(() => setLoading(false));
    }, [collaborator]);

    const total = commissions.reduce((sum, c) => sum + c.amount, 0);
    const paid = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0);
    const pending = total - paid;

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[var(--accent-light)]/20 border-t-[var(--accent-light)] rounded-full animate-spin" />
            <p className="text-sm font-bold tracking-widest opacity-40 uppercase">Calculando rendimentos...</p>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#15151e] border border-white/5 rounded-3xl p-8">
                    <p className="text-[13px] font-medium text-white/40 uppercase tracking-widest mb-4">Total Acumulado</p>
                    <h4 className="text-[32px] font-semibold text-white leading-none">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                </div>
                <div className="bg-[#15151e] border border-white/5 rounded-3xl p-8">
                    <p className="text-[13px] font-medium text-white/40 uppercase tracking-widest mb-4">Já Recebido</p>
                    <div className="flex items-center gap-4">
                        <h4 className="text-[28px] font-semibold text-green-400">R$ {paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                        <span className="px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 text-[11px] font-bold tracking-widest uppercase">PAGO</span>
                    </div>
                </div>
                <div className="bg-[#15151e] border border-white/5 rounded-3xl p-8">
                    <p className="text-[13px] font-medium text-white/40 uppercase tracking-widest mb-4">Pendente</p>
                    <div className="flex items-center gap-4">
                        <h4 className="text-[28px] font-semibold text-[var(--accent-light)]">R$ {pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                        <span className="px-2.5 py-1 rounded-md bg-[var(--accent-light)]/10 text-[var(--accent-light)] text-[11px] font-bold tracking-widest uppercase">ABERTO</span>
                    </div>
                </div>
            </div>
            
            <div className="bg-[#15151e] border border-white/5 rounded-3xl p-6 md:p-8 overflow-hidden">
                <div className="border-b border-white/5 pb-6 flex items-center justify-between mb-2">
                    <h3 className="text-[16px] font-semibold text-white tracking-tight">Extrato de Comissões</h3>
                    <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white">
                        <Download size={18} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest">Data</th>
                                <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest">Serviço</th>
                                <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest">Valor do Serviço</th>
                                <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest text-center">Repasse (%)</th>
                                <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest text-right">Seu Repasse</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {commissions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-white/40 font-medium text-[13px]">Nenhuma comissão encontrada.</td>
                                </tr>
                            ) : (
                            commissions.map((c: any) => {
                                const svcPrice = c.appointment?.service?.price || 0;
                                const perc = svcPrice > 0 ? (c.amount / svcPrice) * 100 : 0;
                                return (
                                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-4 text-[13px] text-white/60">
                                            {format(new Date(c.appointment.date), "dd/MM/yyyy")}
                                        </td>
                                        <td className="px-5 py-4 text-[14px] font-semibold text-white/90">{c.appointment?.service?.name}</td>
                                        <td className="px-5 py-4 text-[14px] text-white/60">R$ {svcPrice.toFixed(2)}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="px-2.5 py-1 rounded-md bg-[var(--accent-light)]/10 text-[var(--accent-light)] text-[11px] font-bold">{perc.toFixed(0)}%</span>
                                        </td>
                                        <td className="px-5 py-4 text-right font-bold text-[14px] text-white">
                                            R$ {c.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            }))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function AdvancesTab({ collaborator }: { collaborator: Collaborator }) {
    const [advances, setAdvances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ description: '', amount: 0 });

    const fetchAdvances = () => {
        setLoading(true);
        api.get(`/advances?professionalId=${collaborator.role === 'PROFESSIONAL' ? (collaborator.professional?.id || 'null') : (collaborator.id)}`)
            .then(res => setAdvances(res.data))
            .catch(() => setAdvances([]))
            .finally(() => setLoading(false));
    }

    useEffect(() => { fetchAdvances(); }, [collaborator]);

    const handleAdd = async () => {
        if (!form.description || form.amount <= 0) return;
        try {
            await api.post('/advances', { 
                ...form, 
                professionalId: collaborator.professional?.id || collaborator.id 
            });
            setShowAdd(false);
            setForm({ description: '', amount: 0 });
            fetchAdvances();
        } catch (e) { alert('Erro ao adicionar vale'); }
    };

    const handleDelete = async (id: string) => {
        if(!window.confirm('Excluir este vale?')) return;
        try {
            await api.delete(`/advances/${id}`);
            fetchAdvances();
        } catch(e) { alert('Erro ao excluir'); }
    }

    const totalAdvances = advances.reduce((sum, v) => sum + v.amount, 0);
    const totalDeducted = advances.reduce((sum, v) => sum + v.deductedAmount, 0);
    const balance = totalAdvances - totalDeducted;

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[var(--accent-light)]/20 border-t-[var(--accent-light)] rounded-full animate-spin" />
            <p className="text-sm font-bold tracking-widest opacity-40 uppercase">Carregando vales...</p>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="bg-[#15151e] border border-white/5 rounded-3xl p-8">
                    <p className="text-[13px] font-medium text-white/40 uppercase tracking-widest mb-4">Dívida Total em Aberto</p>
                    <h4 className="text-[32px] font-semibold text-red-400 leading-none">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                </div>
            </div>

            <div className="bg-[#15151e] border border-white/5 rounded-3xl p-6 md:p-8 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/5 mb-2 gap-4">
                    <h3 className="text-[16px] font-semibold text-white tracking-tight">Histórico de Adiantamentos</h3>
                    <button onClick={() => setShowAdd(true)} 
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold text-[14px] rounded-lg hover:bg-white/90 transition-colors shadow-sm whitespace-nowrap">
                        <Plus size={16} /> Novo Adiantamento
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest">Lançamento</th>
                                <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest">Descrição</th>
                                <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest text-right">Valor Inicial</th>
                                <th className="px-5 py-4 text-[12px] font-semibold text-white/40 uppercase tracking-widest text-right">Abatido</th>
                                <th className="px-5 py-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {advances.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-white/40 font-medium text-[13px]">Nenhum adiantamento registrado.</td>
                                </tr>
                            ) : (
                                advances.map((v: any) => (
                                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-5 py-4 text-[13px] text-white/60">{format(new Date(v.date), "dd/MMM/yy", { locale: ptBR })}</td>
                                        <td className="px-5 py-4 text-[14px] font-semibold text-white/90">{v.description}</td>
                                        <td className="px-5 py-4 text-right font-medium text-[14px] text-white">R$ {v.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-5 py-4 text-right text-[14px] font-medium text-green-400">R$ {v.deductedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-5 py-4 text-right">
                                            <button onClick={() => handleDelete(v.id)} 
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAdd && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAdd(false)} />
                    <div className="bg-[#111116] border border-white/10 w-full max-w-sm z-10 animate-zoom-in shadow-2xl rounded-2xl p-6 md:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-[20px] font-semibold text-white tracking-tight">Novo Adiantamento</h2>
                            <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-5">
                            <div>
                                <label className="text-[13px] font-medium text-white/60 mb-2 block">Motivo/Descrição</label>
                                <input className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all" 
                                    placeholder="Ex: Passagem, Almoço..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-white/60 mb-2 block">Valor em Reais</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-[14px] text-white/40">R$</span>
                                    <input type="number" className="w-full h-11 pl-10 bg-white/5 border border-white/10 rounded-lg pr-4 text-[14px] text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all" 
                                        value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/5 flex flex-col">
                                <button onClick={handleAdd} className="w-full py-2.5 bg-white text-black rounded-lg text-[14px] font-semibold hover:bg-white/90 transition-colors shadow-sm">
                                    Confirmar Vale
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
}


function WorkingHoursTab({ collaborator, onBack }: { collaborator: Collaborator; onBack: () => void }) {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const [schedule, setSchedule] = useState<{ dayOfWeek: number; startTime: string; endTime: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchHours = async () => {
            try {
                const res = await api.get(`/users/professional/${collaborator.professional?.id}/working-hours`);
                setSchedule(res.data);
            } catch (e) {
                console.error('Erro ao buscar horários', e);
            } finally {
                setLoading(false);
            }
        };
        fetchHours();
    }, [collaborator]);

    const addSlot = (dayOfWeek: number) => {
        setSchedule(prev => [...prev, { dayOfWeek, startTime: '08:00', endTime: '18:00' }]);
    };

    const removeSlot = (index: number) => {
        setSchedule(prev => prev.filter((_, i) => i !== index));
    };

    const updateSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
        setSchedule(prev => prev.map((slot, i) => i === index ? { ...slot, [field]: value } : slot));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Ordenar por horário de início antes de salvar
            const sortedSchedule = [...schedule].sort((a, b) => {
                if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
                return a.startTime.localeCompare(b.startTime);
            });

            await api.put(`/users/professional/${collaborator.professional?.id}/working-hours`, sortedSchedule);
            alert('Horários salvos com sucesso!');
            onBack();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Erro ao salvar horários');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[var(--accent-light)]/20 border-t-[var(--accent-light)] rounded-full animate-spin" />
            <p className="text-[13px] font-semibold text-white/40 uppercase tracking-widest">Carregando horários...</p>
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto py-6 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-semibold text-[15px]">Voltar</span>
                </button>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-white text-black font-semibold text-[14px] rounded-lg hover:bg-white/90 transition-colors shadow-sm flex items-center gap-2">
                    {saving && <span className="spinner opacity-50 border-black/20 border-t-black !w-4 !h-4" />}
                    {saving ? 'SALVANDO...' : 'SALVAR HORÁRIOS'}
                </button>
            </div>

            <div className="mb-10">
                <h3 className="text-[28px] font-semibold tracking-tight text-white mb-2">Agenda Semanal</h3>
                <p className="text-[15px] text-white/50">
                    Configure os turnos de trabalho de <span className="text-white font-medium">{collaborator.name}</span>. 
                    <br />
                    <span className="text-[13px] text-amber-400/60 font-medium mt-1 block">Horários fora destes intervalos estarão bloqueados para agendamento.</span>
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {days.map((dayName, dayIndex) => {
                    const daySlots = schedule
                        .map((s, i) => ({ ...s, originalIndex: i }))
                        .filter(s => s.dayOfWeek === dayIndex);

                    return (
                        <div key={dayName} className="p-6 md:p-8 rounded-3xl bg-[#15151e] border border-white/5 shadow-lg relative overflow-hidden group">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                                <h4 className="text-[18px] font-semibold text-white/90 tracking-tight">{dayName}</h4>
                                <button 
                                    onClick={() => addSlot(dayIndex)}
                                    className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-widest text-[var(--accent-light)] hover:text-white transition-colors"
                                >
                                    <Plus size={16} />
                                    Adicionar Turno
                                </button>
                            </div>

                            <div className="flex flex-col gap-3 relative z-10">
                                {daySlots.length === 0 ? (
                                    <div className="py-6 text-center border border-dashed border-white/5 bg-white/[0.01] rounded-2xl">
                                        <p className="text-[13px] text-white/40 font-medium">Folga / Não trabalha</p>
                                    </div>
                                ) : (
                                    daySlots.map((slot) => (
                                        <div key={slot.originalIndex} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#111116] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group/slot">
                                            <div className="flex-1 grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1.5 border-r border-white/5 pr-4">
                                                    <span className="text-[11px] font-medium text-white/40 uppercase tracking-widest px-2">Início</span>
                                                    <input 
                                                        type="time" 
                                                        value={slot.startTime}
                                                        onChange={(e) => updateSlot(slot.originalIndex, 'startTime', e.target.value)}
                                                        className="h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white font-medium text-[14px] focus:outline-none focus:border-white/30 transition-all cursor-pointer"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5 pl-4 sm:pl-0 sm:border-r-0 border-white/5">
                                                    <span className="text-[11px] font-medium text-white/40 uppercase tracking-widest px-2">Término</span>
                                                    <input 
                                                        type="time" 
                                                        value={slot.endTime}
                                                        onChange={(e) => updateSlot(slot.originalIndex, 'endTime', e.target.value)}
                                                        className="h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white font-medium text-[14px] focus:outline-none focus:border-white/30 transition-all cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => removeSlot(slot.originalIndex)}
                                                className="self-end sm:self-center h-10 w-10 flex items-center justify-center rounded-md bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                                title="Remover turno"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
