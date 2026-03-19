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
    ADMIN: 'badge-danger',
    MANAGER: 'badge-warning',
    PROFESSIONAL: 'badge-purple',
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
                <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight">Colaboradores</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{collaborators.length} colaboradores cadastrados</p>
                    </div>

                    {/* Status Toggle Dropdown */}
                    <div className="relative ml-4">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-semibold"
                        >
                            {statusFilter === 'active' ? 'Ativos' : 'Excluídos'}
                            <MoreHorizontal size={14} className="opacity-40" />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-40 bg-[#1a1628] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <button 
                                    onClick={() => toggleStatus('active')}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors ${statusFilter === 'active' ? 'text-white font-bold bg-white/5' : 'text-white/40'}`}
                                >
                                    Ativos
                                </button>
                                <button 
                                    onClick={() => toggleStatus('inactive')}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors ${statusFilter === 'inactive' ? 'text-white font-bold bg-white/5' : 'text-white/40'}`}
                                >
                                    Excluídos
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openNew}>
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
                                            <h2 className="text-lg font-bold" style={{ color: 'var(--accent-light)' }}>Profissionais</h2>
                                            <div className="flex flex-col gap-2">
                                                {usersOfRole.map((c) => (
                                                    <div key={c.id} onClick={() => { setSelectedCollaborator(c); setActiveTab('PROFILE'); }}
                                                        className="card flex items-center gap-4 py-3 px-4 hover:border-[var(--accent-light)] transition-all cursor-pointer group">
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                                                            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                                                            {c.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-sm">{c.name}</p>
                                                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{c.email}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`badge ${ROLE_CLS[c.role] ?? 'badge-gray'}`}>
                                                                {ROLE_LABELS[c.role] ?? c.role}
                                                            </span>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(c); }} 
                                                                className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.name); }} 
                                                                className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-secondary)] transition-colors hover:text-red-400"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
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
                                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{ROLE_LABELS[roleType]}s</h2>
                                        <div className="flex flex-col gap-2">
                                            {usersOfRole.map((c) => (
                                                <div key={c.id} onClick={() => { setSelectedCollaborator(c); setActiveTab('PROFILE'); }}
                                                    className="card flex items-center gap-4 py-3 px-4 hover:border-[var(--accent-light)] transition-all cursor-pointer group">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                                                        style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--accent-light)' }}>
                                                        {c.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm">{c.name}</p>
                                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{c.email}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`badge ${ROLE_CLS[c.role] ?? 'badge-gray'}`}>
                                                            {ROLE_LABELS[c.role] ?? c.role}
                                                        </span>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(c); }} 
                                                            className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.name); }} 
                                                            className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-secondary)] transition-colors hover:text-red-400"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center lg:pl-[230px] p-4" onClick={() => setShowForm(false)}>
                    <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
                    <div className="card w-full max-w-[440px] max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in z-10 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-bold">{isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
                            <button onClick={() => setShowForm(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Nome *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Nome completo" className="input-field" />
                            </div>
                            <div>
                                <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>E-mail *</label>
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="email@exemplo.com" className="input-field" />
                            </div>
                            {!isEditing && (
                                <div>
                                    <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Senha *</label>
                                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        placeholder="Mínimo 6 caracteres" className="input-field" />
                                </div>
                            )}
                            <div>
                                <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Função / Perfil</label>
                                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="input-field" disabled={isEditing}>
                                    <option value="PROFESSIONAL">Profissional</option>
                                    <option value="MANAGER">Gerente</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                            
                            {form.role === 'PROFESSIONAL' && (
                                <>
                                <div>
                                    <label className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>Nichos de Atuação</label>
                                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white/5 border border-white/5">
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
                                                        flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border
                                                        ${isSelected 
                                                            ? 'bg-[var(--accent-light)] border-[var(--accent-light)] text-white' 
                                                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'}
                                                    `}
                                                >
                                                    {isSelected ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                                                    {n.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Tipo de Contrato</label>
                                    <select value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })}
                                        className="input-field">
                                        <option value="COMMISSION">Comissionado</option>
                                        <option value="RENT">Aluguel de Espaço (100% Repasse)</option>
                                    </select>
                                </div>
                                {form.contractType === 'COMMISSION' && (
                                    <div>
                                        <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Comissão do Profissional (%)</label>
                                        <input type="number" min="0" max="100" value={form.commission} onChange={(e) => setForm({ ...form, commission: Number(e.target.value) })}
                                            className="input-field" />
                                    </div>
                                )}
                                </>
                            )}

                            {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
                            <div className="flex gap-3 mt-1">
                                <button onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 rounded-xl text-sm font-medium"
                                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                    Cancelar
                                </button>
                                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    {saving ? <span className="spinner" /> : null}
                                    {saving ? (isEditing ? 'Salvando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Conta')}
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
                        className="text-white/40 hover:text-[var(--accent-pink)] transition-colors text-xs font-black tracking-[0.2em] uppercase">
                        EDITAR
                    </button>
                </div>

                {/* 2. Identity Row */}
                <div className="flex flex-col md:flex-row items-center gap-8" style={{ marginBottom: '48px' }}>
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-2 border-white/10 overflow-hidden shadow-2xl bg-[#1a1825]">
                             <div className="w-full h-full flex items-center justify-center text-5xl font-semibold bg-gradient-to-br from-[#2a243d] to-[#1a1628] text-white">
                                {collaborator.name.charAt(0).toUpperCase()}
                             </div>
                        </div>
                        <div className={`absolute bottom-1 right-1 w-7 h-7 rounded-full border-2 border-[#111019] ${collaborator.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="font-semibold text-white tracking-tight leading-tight mb-1" style={{ fontSize: '32px' }}>{collaborator.name}</h2>
                        <p className="text-base font-medium text-white/40">{collaborator.email}</p>
                    </div>
                </div>

                {/* 3. Underlined Navigation Tabs */}
                <div className="flex items-center gap-10 border-b border-white/5 overflow-x-auto no-scrollbar" style={{ marginBottom: '40px' }}>
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
                                pb-5 text-[11px] font-bold tracking-[0.15em] uppercase transition-all relative whitespace-nowrap
                                ${activeTab === tab.id 
                                    ? 'text-white' 
                                    : 'text-white/30 hover:text-white'}
                            `}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-2/3 h-0.5 bg-green-500 rounded-full mx-auto" />
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
            <div className="lg:col-span-7 flex flex-col gap-8">
                <div className="card border-white/5 bg-[#15121f]/30" style={{ padding: '32px' }}>
                    <h3 className="font-bold tracking-widest text-white/90" style={{ fontSize: '15px', marginBottom: '40px' }}>
                        INFORMAÇÕES DE ATUAÇÃO
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-8">
                        {[
                            { label: 'E-MAIL', value: collaborator.email },
                            { label: 'CARGO PRINCIPAL', value: ROLE_LABELS[collaborator.role] || 'N/A' },
                            { label: 'TELEFONE', value: 'Não informado' },
                            { label: 'NÍCHOS DE ATUAÇÃO', value: isProf && collaborator.professional?.niches?.length ? collaborator.professional.niches.map(n => n.name).join(', ') : 'Geral' },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col border-b border-white/5 pb-4">
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">{item.label}</p>
                                <p className="text-[15px] font-medium text-white/90 tracking-tight">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>


            </div>

            {/* Quick Actions / Side Card */}
            <div className="lg:col-span-5">
                <div className="card border-white/5 bg-[#15121f]/30" style={{ padding: '32px' }}>
                     <h3 className="font-bold tracking-widest text-white/90 mb-8 uppercase flex items-center gap-3" style={{ fontSize: '15px' }}>
                        RESUMO DO PERFIL
                     </h3>
                     <p className="text-[14px] leading-relaxed text-white/60 mb-10 font-medium">
                        Colaborador estratégico registrado na unidade Bella Beauty. Este perfil centraliza as configurações de comissão, agenda de serviços e histórico financeiro.
                     </p>
                     
                     <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">MEMBRO DESDE</span>
                            <span className="text-[14px] font-bold text-white/80">Março, 2026</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">NÍVEL DE ACESSO</span>
                            <span className="text-[14px] font-bold text-[var(--accent-light)]">{ROLE_LABELS[collaborator.role]}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">DESEMPENHO</span>
                            {collaborator.isActive ? (
                                <span className="text-[12px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase">ATIVO</span>
                            ) : (
                                <span className="text-[12px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded uppercase">INATIVO</span>
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
                        className="flex items-center gap-10 p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-[var(--accent-light)]/30 hover:bg-white/[0.05] cursor-pointer transition-all duration-300 group shadow-2xl">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 group-hover:bg-[var(--accent-light)] group-hover:scale-110 group-hover:text-white transition-all shadow-inner">
                            <item.icon size={28} className="opacity-60 group-hover:opacity-100" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-xl text-white/90 group-hover:text-white transition-colors">{item.label}</h4>
                            <p className="text-base opacity-40 font-medium group-hover:opacity-60 transition-opacity">{item.desc}</p>
                        </div>
                        <ChevronLeft size={24} className="rotate-180 opacity-20 group-hover:opacity-60 transition-all" />
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
                <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-3">
                    {saving ? 'SALVANDO...' : 'SALVAR PERMISSÕES'}
                </button>
            </div>

            <div className="mb-14">
                <h3 className="text-3xl font-black tracking-tight text-white mb-3 uppercase">Controle de Acesso</h3>
                <p className="text-base text-white/40 font-medium">
                    Defina o que <span className="text-white">{collaborator.name}</span> pode visualizar e gerenciar no sistema.
                    <br />
                    <span className="text-xs mt-2 block opacity-50 uppercase tracking-widest font-bold">Role Atual: {ROLE_LABELS[collaborator.role]}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SYSTEM_PERMISSIONS.map((perm) => {
                    const active = selectedPermissions.includes(perm.key);
                    return (
                        <div key={perm.key} 
                            onClick={() => togglePermission(perm.key)}
                            className={`flex items-center justify-between p-6 rounded-[2rem] border cursor-pointer transition-all duration-300 group ${
                                active 
                                ? 'bg-[var(--accent-light)]/10 border-[var(--accent-light)]/40 shadow-xl shadow-[var(--accent-light)]/5' 
                                : 'bg-white/5 border-white/5 hover:border-white/10'
                            }`}>
                            <div className="flex flex-col">
                                <p className={`text-[15px] font-bold transition-colors ${active ? 'text-white' : 'text-white/60'}`}>{perm.label}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1">{perm.key}</p>
                            </div>
                            
                            {/* Toggle UI */}
                            <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${active ? 'bg-[var(--accent-light)]' : 'bg-white/10'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
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
            <div className="w-10 h-10 border-4 border-[var(--accent-light)]/20 border-t-[var(--accent-light)] rounded-full animate-spin" />
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
                <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-3">
                    {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                </button>
            </div>

            <div className="mb-14">
                <h3 className="text-3xl font-black tracking-tight text-white mb-3 uppercase">Serviços Habilitados</h3>
                <p className="text-base text-white/40 font-medium whitespace-pre-wrap">
                    Defina quais procedimentos <span className="text-white">{collaborator.name}</span> está apto(a) a realizar no salão para os nichos: 
                    <span className="text-[var(--accent-light)] ml-2 italic">
                        {collaborator.professional?.niches?.map(n => n.name).join(', ') || 'Nenhum nicho vinculado'}
                    </span>
                </p>
            </div>

            <div className="space-y-20">
                {niches.length === 0 ? (
                    <div className="py-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                        <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Nenhum serviço disponível para os nichos vinculados.</p>
                        <p className="text-xs text-white/20 mt-2">Vincule nichos ao perfil do colaborador para habilitar serviços.</p>
                    </div>
                ) : (
                    niches.map(niche => (
                        <div key={niche.id} className="animate-slide-up">
                            <div className="flex items-center gap-6 mb-12">
                                <h4 className="text-2xl font-black tracking-tighter text-white uppercase italic bg-gradient-to-r from-[var(--accent-light)] to-transparent bg-clip-text text-transparent">
                                    {niche.name}
                                </h4>
                                <div className="h-[2px] flex-1 bg-gradient-to-r from-[var(--accent-light)]/30 to-transparent" />
                            </div>

                            <div className="space-y-16 pl-4 border-l-2 border-[var(--accent-light)]/10">
                                {niche.categories?.map((cat: any) => (
                                    <div key={cat.id}>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-2 h-2 rounded-full bg-[var(--accent-light)]" />
                                            <h5 className="text-lg font-black tracking-tight text-white/80 uppercase">{cat.name}</h5>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                                            {cat.services?.map((s: any) => {
                                                const selected = selectedIds.includes(s.id);
                                                return (
                                                    <div key={s.id} 
                                                         onClick={() => toggleService(s.id)}
                                                         className={`flex items-center gap-4 p-5 rounded-[2rem] border cursor-pointer transition-all duration-300 group ${
                                                            selected 
                                                            ? 'bg-[var(--accent-light)]/10 border-[var(--accent-light)]/40 shadow-xl shadow-[var(--accent-light)]/5' 
                                                            : 'bg-white/5 border-white/5 hover:border-white/10'
                                                         }`}>
                                                        <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
                                                            selected ? 'bg-[var(--accent-light)] border-[var(--accent-light)] scale-110' : 'border-white/10 group-hover:border-white/20'
                                                        }`}>
                                                            {selected && <Check size={16} className="text-white" strokeWidth={4} />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className={`text-[15px] font-bold transition-colors ${selected ? 'text-white' : 'text-white/60'}`}>{s.name}</p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{s.duration} MIN</span>
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-green-400/40">
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
        <div className="w-full card bg-[#15121f]/50 border-white/5 shadow-2xl" style={{ padding: '48px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '40px' }}>
                <h3 className="text-xl font-semibold tracking-wider text-white/80 uppercase">Últimos Atendimentos</h3>
                <div className="flex items-center gap-3">
                   <button className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                        <Search size={16} className="opacity-60" />
                   </button>
                   <button className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                        <Download size={16} className="opacity-60" />
                   </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase">Data e Hora</th>
                            <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase">Cliente</th>
                            <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase">Serviço Realizado</th>
                            <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase">Valor</th>
                            <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase text-right">Situação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {activities.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center opacity-40 font-bold tracking-widest text-xs uppercase">Nenhum atendimento encontrado</td>
                            </tr>
                        ) : (
                            activities.map((a: any) => (
                                <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-xs">{format(new Date(a.date), "dd/MMM/yy", { locale: ptBR })}</div>
                                        <div className="text-[10px] font-medium opacity-40 mt-1 uppercase tracking-wider">{format(new Date(a.date), "HH:mm 'hs'")}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black">
                                                {a.client?.name.charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold">{a.client?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold">
                                            <Calendar size={12} className="text-[var(--accent-pink)]" />
                                            {a.service?.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-black text-[var(--accent-light)]">R$ {a.service?.price.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`
                                            inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase
                                            ${a.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 'bg-white/10 text-white/40'}
                                        `}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'COMPLETED' ? 'bg-green-400' : 'bg-white/40'}`} />
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
                <div className="p-4 border-t border-white/5 text-center">
                    <button className="text-[10px] font-black tracking-widest text-white/40 hover:text-white transition-colors uppercase">Carregar mais atendimentos</button>
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
        <div className="w-full" style={{ gap: '48px', display: 'flex', flexDirection: 'column' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                <div className="card border-white/5 bg-gradient-to-br from-[#15121f] to-[#1a1628] shadow-2xl" style={{ padding: '40px' }}>
                    <p className="text-[12px] font-semibold tracking-wider opacity-40 uppercase mb-4">Total Acumulado</p>
                    <h4 className="text-4xl font-bold text-white leading-none">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                </div>
                <div className="card border-white/5 bg-[#15121f]/50 shadow-2xl" style={{ padding: '40px' }}>
                    <p className="text-[12px] font-semibold tracking-wider opacity-40 uppercase mb-4">Já Recebido</p>
                    <div className="flex items-center gap-4">
                        <h4 className="text-2xl font-bold text-green-400">R$ {paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                        <span className="px-3 py-1 rounded-lg bg-green-500/10 text-green-400 text-[10px] font-bold tracking-tight uppercase">PAGO</span>
                    </div>
                </div>
                <div className="card border-white/5 bg-[#15121f]/50 shadow-2xl" style={{ padding: '40px' }}>
                    <p className="text-[12px] font-semibold tracking-wider opacity-40 uppercase mb-4">Pendente</p>
                    <div className="flex items-center gap-4">
                        <h4 className="text-2xl font-bold text-[var(--accent-pink)]">R$ {pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                        <span className="px-3 py-1 rounded-lg bg-[var(--accent-pink)]/10 text-[var(--accent-pink)] text-[10px] font-bold tracking-tight uppercase">ABERTO</span>
                    </div>
                </div>
            </div>
            
            <div className="card border-white/5 bg-[#15121f]/50 shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-white/5 flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold tracking-wide text-white/80 uppercase">Extrato de Comissões</h3>
                    <Download size={18} className="opacity-40 hover:opacity-100 cursor-pointer transition-all" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase">Data</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase">Serviço</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase">Valor Total</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase">Repasse (%)</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase text-right">Seu Repasse (R$)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {commissions.map((c: any) => {
                                const svcPrice = c.appointment?.service?.price || 0;
                                const perc = svcPrice > 0 ? (c.amount / svcPrice) * 100 : 0;
                                return (
                                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 text-[11px] font-bold opacity-60">
                                            {format(new Date(c.appointment.date), "dd/MM/yyyy")}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold">{c.appointment?.service?.name}</td>
                                        <td className="px-6 py-4 text-xs opacity-60 italic">R$ {svcPrice.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-[var(--accent-light)]/10 text-[var(--accent-light)] text-[10px] font-black">{perc.toFixed(0)}%</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-white">
                                            R$ {c.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
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
        <div className="w-full" style={{ gap: '48px', display: 'flex', flexDirection: 'column' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="card border-white/5 bg-[#15121f]/50 shadow-2xl" style={{ padding: '40px' }}>
                    <p className="text-[12px] font-semibold tracking-wider opacity-40 uppercase mb-4">Dívida Total em Aberto</p>
                    <h4 className="text-4xl font-bold text-[var(--accent-pink)] leading-none">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                </div>
            </div>

            <div className="card border-white/5 bg-[#15121f]/50 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between" style={{ padding: '40px' }}>
                    <h3 className="text-lg font-semibold tracking-wide text-white/80 uppercase">Histórico de Adiantamentos</h3>
                    <button onClick={() => setShowAdd(true)} 
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-light)] text-white text-[13px] font-bold tracking-tight shadow-xl shadow-[var(--accent-pink)]/30 hover:scale-[1.02] transition-all">
                        <Plus size={22} /> ADICIONAR VALE
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase">Lançamento</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase">Descrição do Adiantamento</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase text-right">Valor Total (R$)</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-[0.2em] opacity-40 uppercase text-right">Abatido (R$)</th>
                                <th className="px-6 py-4 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {advances.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center opacity-40 font-bold tracking-widest text-xs uppercase">Nenhum vale registrado</td>
                                </tr>
                            ) : (
                                advances.map((v: any) => (
                                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 text-[11px] font-bold opacity-60 italic">{format(new Date(v.date), "dd/MMM/yy", { locale: ptBR })}</td>
                                        <td className="px-6 py-4 text-xs font-bold">{v.description}</td>
                                        <td className="px-6 py-4 text-right font-black text-white">R$ {v.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-right text-xs font-bold text-green-400">R$ {v.deductedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-right">
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
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="card w-full max-w-sm animate-zoom-in shadow-2xl p-8 border-white/5 bg-[#1a1628]">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-black tracking-tight">Novo Adiantamento</h2>
                            <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                <X size={20} className="opacity-40" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2 block">Motivo/Descrição</label>
                                <input className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm font-bold focus:border-[var(--accent-light)] transition-colors outline-none h-14" 
                                    placeholder="Ex: Passagem, Almoço..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2 block">Valor em Reais</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[var(--accent-light)]">R$</span>
                                    <input type="number" className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xl font-black focus:border-[var(--accent-light)] transition-colors outline-none h-14" 
                                        value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
                                </div>
                            </div>
                            <button onClick={handleAdd} className="w-full h-14 rounded-2xl bg-gradient-to-r from-[var(--accent-pink)] to-[var(--accent-light)] text-white font-black tracking-widest shadow-xl shadow-[var(--accent-pink)]/20 active:scale-95 transition-all">
                                CONFIRMAR VALE
                            </button>
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

    if (loading) return <div className="p-20 text-center opacity-40 font-bold uppercase tracking-widest animate-pulse">Carregando horários...</div>;

    return (
        <div className="w-full max-w-4xl mx-auto py-6 animate-fade-in">
            <div className="flex items-center justify-between mb-10">
                <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-tight text-[15px]">Voltar</span>
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-3">
                    {saving ? 'SALVANDO...' : 'SALVAR HORÁRIOS'}
                </button>
            </div>

            <div className="mb-14">
                <h3 className="text-3xl font-black tracking-tight text-white mb-3 uppercase">Agenda Semanal</h3>
                <p className="text-base text-white/40 font-medium">
                    Configure os turnos de trabalho de <span className="text-white">{collaborator.name}</span>. 
                    <br />
                    <span className="text-[10px] mt-2 block opacity-30 uppercase tracking-[0.2em] font-black">Horários fora destes intervalos estarão bloqueados para agendamento.</span>
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {days.map((dayName, dayIndex) => {
                    const daySlots = schedule
                        .map((s, i) => ({ ...s, originalIndex: i }))
                        .filter(s => s.dayOfWeek === dayIndex);

                    return (
                        <div key={dayName} className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-xl font-black text-white/90 uppercase tracking-tight">{dayName}</h4>
                                <button 
                                    onClick={() => addSlot(dayIndex)}
                                    className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--accent-light)] hover:opacity-70 transition-opacity"
                                >
                                    <Plus size={14} />
                                    Adicionar Turno
                                </button>
                            </div>

                            <div className="flex flex-col gap-3">
                                {daySlots.length === 0 ? (
                                    <div className="py-4 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                        <p className="text-sm text-white/20 font-bold uppercase tracking-widest">Folga / Não trabalha</p>
                                    </div>
                                ) : (
                                    daySlots.map((slot) => (
                                        <div key={slot.originalIndex} className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 hover:border-white/10 transition-colors group">
                                            <div className="flex-1 grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Início</span>
                                                    <input 
                                                        type="time" 
                                                        value={slot.startTime}
                                                        onChange={(e) => updateSlot(slot.originalIndex, 'startTime', e.target.value)}
                                                        className="bg-transparent border-none text-white font-bold text-lg focus:ring-0 p-0 ml-4 cursor-pointer"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Término</span>
                                                    <input 
                                                        type="time" 
                                                        value={slot.endTime}
                                                        onChange={(e) => updateSlot(slot.originalIndex, 'endTime', e.target.value)}
                                                        className="bg-transparent border-none text-white font-bold text-lg focus:ring-0 p-0 cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => removeSlot(slot.originalIndex)}
                                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white/20 hover:bg-red-500/10 hover:text-red-500 transition-all group-hover:bg-white/10"
                                            >
                                                <Trash2 size={18} />
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
