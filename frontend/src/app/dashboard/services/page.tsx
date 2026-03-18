'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { 
    Scissors, Plus, X, Edit2, Trash2, DollarSign, 
    Clock, FolderPlus, Settings2, Boxes, ChevronDown, ChevronRight 
} from 'lucide-react';

interface Service {
    id: string;
    name: string;
    price: number;
    duration: number;
    bufferTime: number;
    categoryId: string;
    category?: { 
        id: string; 
        name: string;
        niche?: { id: string; name: string }
    };
}

interface ServiceCategory {
    id: string;
    name: string;
    order: number;
    nicheId: string;
    services?: Service[];
}

interface ServiceNicho {
    id: string;
    name: string;
    order: number;
    categories?: ServiceCategory[];
}

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [niches, setNiches] = useState<ServiceNicho[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedNiches, setExpandedNiches] = useState<string[]>([]);
    const [expandedCats, setExpandedCats] = useState<string[]>([]);
    
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ id: '', name: '', price: '', duration: '', bufferTime: '0', categoryId: '' });
    
    const [showNicheForm, setShowNicheForm] = useState(false);
    const [isEditingNiche, setIsEditingNiche] = useState(false);
    const [nicheForm, setNicheForm] = useState({ id: '', name: '', order: 0 });

    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [categoryForm, setCategoryForm] = useState({ id: '', name: '', order: 0, nicheId: '' });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [servRes, nicheRes] = await Promise.all([
                api.get('/services'),
                api.get('/service-categories/niches')
            ]);
            setServices(servRes.data);
            setNiches(nicheRes.data);
            
            // Auto expand all by default if first load
            if (expandedNiches.length === 0) {
                setExpandedNiches(nicheRes.data.map((n: any) => n.id));
                const allCatIds = nicheRes.data.flatMap((n: any) => n.categories.map((c: any) => c.id));
                setExpandedCats(allCatIds);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const toggleNiche = (id: string) => {
        setExpandedNiches(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleCat = (id: string) => {
        setExpandedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // NICHO CRUD
    const openNewNiche = () => {
        setNicheForm({ id: '', name: '', order: niches.length });
        setIsEditingNiche(false);
        setShowNicheForm(true);
        setError('');
    };

    const handleEditNiche = (n: ServiceNicho) => {
        setNicheForm({ id: n.id, name: n.name, order: n.order });
        setIsEditingNiche(true);
        setShowNicheForm(true);
        setError('');
    };

    const handleDeleteNiche = async (id: string, name: string) => {
        if (!window.confirm(`Remover nicho ${name}? (Apenas se sem categorias)`)) return;
        try { await api.delete(`/service-categories/niches/${id}`); fetchData(); }
        catch (e: any) { alert(e.response?.data?.message || 'Erro ao remover'); }
    };

    const handleSaveNiche = async () => {
        if (!nicheForm.name) { setError('Nome obrigatório'); return; }
        try {
            setSaving(true); setError('');
            if (isEditingNiche) await api.put(`/service-categories/niches/${nicheForm.id}`, nicheForm);
            else await api.post('/service-categories/niches', nicheForm);
            setShowNicheForm(false);
            fetchData();
        } catch (e: any) { setError(e.response?.data?.message || 'Erro ao salvar'); } 
        finally { setSaving(false); }
    };

    // SERVICE CRUD
    const openNewService = (catId: string) => {
        setForm({ id: '', name: '', price: '', duration: '', bufferTime: '0', categoryId: catId });
        setIsEditing(false);
        setShowForm(true);
        setError('');
    };

    const handleEditService = (s: Service) => {
        setForm({
            id: s.id,
            name: s.name,
            price: s.price.toString(),
            duration: s.duration.toString(),
            bufferTime: s.bufferTime.toString(),
            categoryId: s.categoryId || '',
        });
        setIsEditing(true);
        setShowForm(true);
        setError('');
    };

    const handleDeleteService = async (id: string, name: string) => {
        if (!window.confirm(`Tem certeza que deseja remover o serviço ${name}?`)) return;
        try {
            await api.delete(`/services/${id}`);
            fetchData();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Erro ao remover serviço');
        }
    };

    const handleSaveService = async () => {
        if (!form.name || !form.price || !form.duration || !form.categoryId) { 
            setError('Preencha os campos obrigatórios'); 
            return; 
        }
        try {
            setSaving(true); setError('');
            const payload = { ...form, price: Number(form.price), duration: Number(form.duration), bufferTime: Number(form.bufferTime) };
            if (isEditing) await api.put(`/services/${form.id}`, payload);
            else await api.post('/services', payload);
            setShowForm(false);
            fetchData();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Erro ao salvar serviço');
        } finally { setSaving(false); }
    };

    // CATEGORY CRUD
    const openNewCategory = (nicheId: string = '') => {
        const niche = niches.find(n => n.id === nicheId);
        setCategoryForm({ id: '', name: '', order: niche?.categories?.length || 0, nicheId });
        setIsEditingCategory(false);
        setShowCategoryForm(true);
        setError('');
    };

    const handleEditCategory = (c: ServiceCategory) => {
        setCategoryForm({ id: c.id, name: c.name, order: c.order, nicheId: c.nicheId });
        setIsEditingCategory(true);
        setShowCategoryForm(true);
        setError('');
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name || !categoryForm.nicheId) { setError('Nome e Nicho são obrigatórios'); return; }
        try {
            setSaving(true); setError('');
            if (isEditingCategory) await api.put(`/service-categories/${categoryForm.id}`, categoryForm);
            else await api.post('/service-categories', categoryForm);
            setShowCategoryForm(false);
            fetchData();
        } catch (e: any) { setError(e.response?.data?.message || 'Erro ao salvar'); } 
        finally { setSaving(false); }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!window.confirm(`Remover categoria ${name}? (Apenas se sem serviços)`)) return;
        try { await api.delete(`/service-categories/${id}`); fetchData(); }
        catch (e: any) { alert(e.response?.data?.message || 'Erro ao remover'); }
    };

    return (
        <div className="animate-fade-in w-full pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Gestão de Serviços</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Hierarquia: Nicho → Categoria → Serviço
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-primary flex items-center gap-2" onClick={openNewNiche}>
                        <FolderPlus size={16} /> Novo Nicho
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-24"><span className="spinner" style={{ width: 48, height: 48 }} /></div>
            ) : niches.length === 0 ? (
                <div className="card flex flex-col items-center py-20 gap-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-2">
                        <Boxes size={40} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Nenhum nicho encontrado</h3>
                        <p className="text-sm text-white/40 mt-1 max-w-sm">Crie um nicho principal (ex: Cabelo, Unhas) para começar.</p>
                    </div>
                    <button className="btn-primary mt-4" onClick={openNewNiche}>Criar Primeiro Nicho</button>
                </div>
            ) : (
                <div className="flex flex-col gap-12">
                    {niches.map(niche => {
                        const isNicheExpanded = expandedNiches.includes(niche.id);
                        return (
                            <div key={niche.id} className="animate-slide-up border border-white/5 rounded-3xl p-6 bg-white/[0.02]">
                                {/* Niche Header */}
                                <div className="flex items-center justify-between mb-6 group/niche">
                                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleNiche(niche.id)}>
                                        <div className={`transition-transform duration-300 ${isNicheExpanded ? 'rotate-0' : '-rotate-90'}`}>
                                            <ChevronDown size={24} className="text-[var(--accent-light)]" />
                                        </div>
                                        <h2 className="text-3xl font-black tracking-tighter uppercase italic" style={{ color: 'var(--accent-light)' }}>
                                            {niche.name}
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => openNewCategory(niche.id)}
                                                className="text-[10px] font-black tracking-widest text-[var(--accent-light)] hover:opacity-70 uppercase transition-all px-4 py-2 rounded-xl bg-[var(--accent-light)]/10 border border-[var(--accent-light)]/20">
                                            + Categoria
                                        </button>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/niche:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditNiche(niche)} className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-all"><Settings2 size={18} /></button>
                                            <button onClick={() => handleDeleteNiche(niche.id, niche.name)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                </div>

                                {isNicheExpanded && (
                                    <div className="flex flex-col gap-10 mt-10">
                                        {!niche.categories?.length ? (
                                            <p className="text-sm italic text-white/20 pl-4">Nenhuma categoria cadastrada para {niche.name}.</p>
                                        ) : (
                                            niche.categories.map(cat => {
                                                const isExpanded = expandedCats.includes(cat.id);
                                                const catServices = services.filter(s => s.categoryId === cat.id);
                                                return (
                                                    <div key={cat.id} className="animate-slide-up pl-4 md:pl-8 border-l-2 border-white/5">
                                                        {/* Category Header */}
                                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 group/cat">
                                                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleCat(cat.id)}>
                                                                <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                                                                    <ChevronDown size={18} className="text-white/20" />
                                                                </div>
                                                                <h3 className="text-xl font-black tracking-tight uppercase text-white/80">
                                                                    {cat.name}
                                                                </h3>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-white/30 uppercase tracking-widest">
                                                                    {catServices.length} {catServices.length === 1 ? 'item' : 'itens'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <button onClick={() => openNewService(cat.id)}
                                                                        className="text-[10px] font-black tracking-[0.2em] text-[var(--accent-light)] hover:opacity-70 uppercase transition-all">
                                                                    + ADICIONAR SERVIÇO
                                                                </button>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                                                                    <button onClick={() => handleEditCategory(cat)} className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-all"><Settings2 size={14} /></button>
                                                                    <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pl-4 md:pl-8 border-l border-white/5 ml-2">
                                                                {catServices.length === 0 ? (
                                                                    <p className="text-sm italic text-white/20 col-span-full">Nenhum serviço cadastrado em {cat.name}.</p>
                                                                ) : (
                                                                    catServices.map(s => (
                                                                        <div key={s.id} className="card group/card hover:border-[var(--accent-light)]/30 transition-all duration-300">
                                                                            <div className="flex items-start justify-between">
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--accent-light)]/5 text-[var(--accent-light)] border border-[var(--accent-light)]/10">
                                                                                        <Scissors size={20} />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="font-bold text-base text-white/90 leading-tight mb-1">{s.name}</p>
                                                                                        <div className="flex items-center gap-4 flex-wrap">
                                                                                            <div className="flex items-center gap-1.5">
                                                                                                <span className="text-green-400 text-sm font-black">
                                                                                                    {s.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-1.5">
                                                                                                <Clock size={12} className="text-white/30" />
                                                                                                <span className="text-xs font-bold text-white/30">
                                                                                                    {s.duration}min
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                                                    <button onClick={() => handleEditService(s)} className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-colors"><Edit2 size={16} /></button>
                                                                                    <button onClick={() => handleDeleteService(s.id, s.name)} className="p-2 rounded-xl hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODALS - Minimalistic & Premium */}
            {(showForm || showCategoryForm || showNicheForm) && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center lg:pl-[230px] p-4">
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => { setShowForm(false); setShowCategoryForm(false); setShowNicheForm(false); }} />
                    <div className="card w-full max-w-[460px] animate-slide-up z-10 shadow-2xl border-white/5 bg-[#111019]" style={{ padding: '40px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">
                                    {showForm ? (isEditing ? 'EDITAR SERVIÇO' : 'NOVO SERVIÇO') : 
                                        showNicheForm ? (isEditingNiche ? 'EDITAR NICHO' : 'NOVO NICHO') :
                                        (isEditingCategory ? 'EDITAR CATEGORIA' : 'NOVA CATEGORIA')}
                                </h2>
                                <p className="text-[10px] font-bold text-white/30 tracking-[0.2em] mt-1 uppercase">Preencha os dados abaixo</p>
                            </div>
                            <button onClick={() => { setShowForm(false); setShowCategoryForm(false); setShowNicheForm(false); }}
                                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 text-white/30 hover:text-white transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {showForm && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Nome</label>
                                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" placeholder="Ex: Volume Russo" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Preço (R$)</label>
                                        <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="input-field" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Duração (min)</label>
                                        <input type="number" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="input-field" placeholder="60" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {showCategoryForm && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Nicho</label>
                                    <select 
                                        value={categoryForm.nicheId} 
                                        onChange={e => setCategoryForm({...categoryForm, nicheId: e.target.value})}
                                        className="input-field"
                                    >
                                        <option value="">Selecione um Nicho</option>
                                        {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Nome da Categoria</label>
                                    <input value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="input-field" placeholder="Ex: Cílios, Unhas..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Ordem de Exibição</label>
                                    <input type="number" value={categoryForm.order} onChange={e => setCategoryForm({...categoryForm, order: Number(e.target.value)})} className="input-field" />
                                </div>
                            </div>
                        )}

                        {showNicheForm && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Nome do Nicho</label>
                                    <input value={nicheForm.name} onChange={e => setNicheForm({...nicheForm, name: e.target.value})} className="input-field" placeholder="Ex: Cabelo, Designer..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Ordem de Exibição</label>
                                    <input type="number" value={nicheForm.order} onChange={e => setNicheForm({...nicheForm, order: Number(e.target.value)})} className="input-field" />
                                </div>
                            </div>
                        )}

                        {error && <p className="text-xs text-red-400 font-bold bg-red-400/10 p-3 rounded-xl mt-6">{error}</p>}
                        
                        <div className="grid grid-cols-2 gap-4 mt-10">
                            <button onClick={() => { setShowForm(false); setShowCategoryForm(false); setShowNicheForm(false); }} className="px-6 py-4 rounded-2xl bg-white/5 font-bold hover:bg-white/10 transition-all uppercase tracking-widest text-xs">Cancelar</button>
                            <button onClick={showForm ? handleSaveService : showNicheForm ? handleSaveNiche : handleSaveCategory} disabled={saving} className="btn-primary py-4">
                                {saving ? 'SALVANDO...' : 'CONFIRMAR'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
