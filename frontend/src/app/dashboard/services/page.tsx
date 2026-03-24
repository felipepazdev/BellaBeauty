'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { 
    Scissors, Plus, X, Edit2, Trash2, DollarSign, 
    Clock, FolderPlus, Settings2, Boxes, ChevronDown, ChevronRight,
    AlertCircle
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
        <div className="animate-fade-in w-full pb-20">
            {/* ── Header ────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                <div>
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-white mb-2">
                        Gestão de Serviços
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500">
                            <Boxes size={12} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{niches.length} Nichos Ativos</span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 italic">
                            Hierarquia: Nicho → Categoria → Serviço
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start md:self-center">
                    <button 
                        onClick={openNewNiche}
                        className="h-14 px-8 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                    >
                        <FolderPlus size={18} /> Novo Nicho
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6 text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-2 border-purple-500/20 rounded-full animate-ping absolute inset-0" />
                        <div className="w-16 h-16 border-2 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin relative z-10" />
                    </div>
                    <p className="text-sm font-serif italic text-slate-500">Sincronizando catálogo de serviços...</p>
                </div>
            ) : niches.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-32 border-dashed border-white/10 opacity-60">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-700">
                        <Boxes size={40} strokeWidth={1} />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-slate-300 mb-2">Seu catálogo está vazio</h3>
                    <p className="text-sm text-slate-500 max-w-[300px] text-center mb-8">
                        Comece criando seu primeiro nicho de atuação para organizar seus serviços.
                    </p>
                    <button 
                        onClick={openNewNiche}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all"
                    >
                        Criar Primeiro Nicho
                    </button>
                </div>
            ) : (
                <div className="space-y-16">
                    {niches.map(niche => {
                        const isNicheExpanded = expandedNiches.includes(niche.id);
                        return (
                            <div key={niche.id} className="relative group/niche-section">
                                {/* Nicho Background Glow (Subtle) */}
                                <div className="absolute -inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                
                                <div className="flex items-center justify-between mb-8">
                                    <div 
                                        className="flex items-center gap-6 cursor-pointer" 
                                        onClick={() => toggleNiche(niche.id)}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-purple-400 transition-all duration-500 ${isNicheExpanded ? 'rotate-0 shadow-lg shadow-purple-500/10' : '-rotate-90 opacity-40'}`}>
                                            <ChevronDown size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-serif font-bold tracking-tight text-white group-hover/niche-section:text-purple-400 transition-colors">
                                                {niche.name}
                                            </h2>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 ml-1">
                                                {niche.categories?.length || 0} Categorias Registradas
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => openNewCategory(niche.id)}
                                            className="px-5 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-400 uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all duration-300"
                                        >
                                            + Categoria
                                        </button>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/niche-section:opacity-100 transition-all duration-300 translate-x-4 group-hover/niche-section:translate-x-0">
                                            <button onClick={() => handleEditNiche(niche)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                                                <Settings2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteNiche(niche.id, niche.name)} className="w-10 h-10 rounded-xl bg-red-500/5 flex items-center justify-center text-red-500/30 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {isNicheExpanded && (
                                    <div className="space-y-12 animate-fade-in pl-4 md:pl-8 border-l border-white/5 ml-6">
                                        {!niche.categories?.length ? (
                                            <div className="py-12 px-8 rounded-3xl border border-dashed border-white/5 flex flex-col items-center gap-4 text-center">
                                                <p className="text-sm font-serif italic text-slate-600">Nenhuma categoria cadastrada em {niche.name}.</p>
                                                <button onClick={() => openNewCategory(niche.id)} className="text-[9px] font-black uppercase tracking-widest text-purple-400 py-1 underline">Adicionar categoria agora</button>
                                            </div>
                                        ) : (
                                            niche.categories.map(cat => {
                                                const isExpanded = expandedCats.includes(cat.id);
                                                const catServices = services.filter(s => s.categoryId === cat.id);
                                                return (
                                                    <div key={cat.id} className="relative group/category">
                                                        <div className="flex items-center justify-between mb-8 group/cat-header">
                                                            <div 
                                                                className="flex items-center gap-4 cursor-pointer" 
                                                                onClick={() => toggleCat(cat.id)}
                                                            >
                                                                <div className={`transition-all duration-500 ${isExpanded ? 'rotate-0 opacity-100' : '-rotate-90 opacity-20'}`}>
                                                                    <ChevronDown size={18} className="text-slate-400" />
                                                                </div>
                                                                <h3 className="text-xl font-bold tracking-tight text-white group-hover/category:text-purple-300 transition-colors">
                                                                    {cat.name}
                                                                </h3>
                                                                <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5">
                                                                    {catServices.length} {catServices.length === 1 ? 'SERVIÇO' : 'SERVIÇOS'}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-4">
                                                                <button 
                                                                    onClick={() => openNewService(cat.id)}
                                                                    className="text-[9px] font-black tracking-[0.2em] text-slate-500 hover:text-purple-400 uppercase transition-all"
                                                                >
                                                                    + ADICIONAR SERVIÇO
                                                                </button>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover/category:opacity-100 transition-all duration-300 translate-x-2 group-hover/category:translate-x-0">
                                                                    <button onClick={() => handleEditCategory(cat)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-600 hover:text-white transition-colors">
                                                                        <Settings2 size={12} />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center text-red-500/20 hover:text-red-500 transition-colors">
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in pl-4 md:pl-8 border-l border-white/5 ml-2.5">
                                                                {catServices.length === 0 ? (
                                                                    <div className="col-span-full py-8 text-center border border-dashed border-white/5 rounded-3xl">
                                                                        <p className="text-xs font-serif italic text-slate-700">Explorar novos serviços para {cat.name}...</p>
                                                                    </div>
                                                                ) : (
                                                                    catServices.map(s => (
                                                                        <div 
                                                                            key={s.id} 
                                                                            className="card group/card-service flex flex-col gap-6 p-6 hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-500 cursor-default"
                                                                        >
                                                                            <div className="flex items-start justify-between">
                                                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-purple-400 group-hover/card-service:scale-110 transition-transform duration-500">
                                                                                    <Scissors size={22} strokeWidth={1.5} />
                                                                                </div>
                                                                                <div className="flex items-center gap-1 opacity-0 group-hover/card-service:opacity-100 transition-opacity">
                                                                                    <button onClick={() => handleEditService(s)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"><Edit2 size={14} /></button>
                                                                                    <button onClick={() => handleDeleteService(s.id, s.name)} className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                                                                </div>
                                                                            </div>

                                                                            <div>
                                                                                <h4 className="text-lg font-bold text-white capitalize tracking-tight mb-2 group-hover/card-service:translate-x-1 transition-transform">
                                                                                    {s.name?.toLowerCase()}
                                                                                </h4>
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Valor</span>
                                                                                        <span className="text-base font-black text-emerald-400 font-mono">
                                                                                            {s.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="w-px h-6 bg-white/5" />
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Tempo</span>
                                                                                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                                                                                            <Clock size={12} strokeWidth={2.5} />
                                                                                            <span>{s.duration} min</span>
                                                                                        </div>
                                                                                    </div>
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

            {/* MODALS ────────────────────────────────────────── */}
            {(showForm || showCategoryForm || showNicheForm) && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[999] grid place-items-center p-4 md:p-8">
                    {/* Overlay */}
                    <div 
                        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in" 
                        onClick={() => { setShowForm(false); setShowCategoryForm(false); setShowNicheForm(false); }} 
                    />
                    
                    {/* Modal Card */}
                    <div 
                        className="relative w-full max-w-[480px] bg-[#0c0c10] border border-white/10 rounded-[40px] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col animate-scale-in" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-10 py-8 border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-white leading-none mb-2">
                                    {showForm ? (isEditing ? 'Editar Serviço' : 'Novo Serviço') : 
                                     showNicheForm ? (isEditingNiche ? 'Editar Nicho' : 'Novo Nicho') :
                                     (isEditingCategory ? 'Editar Categoria' : 'Nova Categoria')}
                                </h2>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Configurações Catalogaís</p>
                            </div>
                            <button 
                                onClick={() => { setShowForm(false); setShowCategoryForm(false); setShowNicheForm(false); }}
                                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-10 space-y-6">
                            {showForm && (
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Serviço</label>
                                        <input 
                                            value={form.name} 
                                            onChange={e => setForm({...form, name: e.target.value})} 
                                            className="h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:border-purple-500/50 transition-all outline-none font-bold" 
                                            placeholder="Ex: Corte Premium" 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preço (R$)</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={form.price} 
                                                    onChange={e => setForm({...form, price: e.target.value})} 
                                                    className="h-14 w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 text-white focus:border-purple-500/50 transition-all outline-none font-mono font-bold" 
                                                    placeholder="0.00" 
                                                />
                                                <DollarSign size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Duração (min)</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={form.duration} 
                                                    onChange={e => setForm({...form, duration: e.target.value})} 
                                                    className="h-14 w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 text-white focus:border-purple-500/50 transition-all outline-none font-bold" 
                                                    placeholder="60" 
                                                />
                                                <Clock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showCategoryForm && (
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nicho Relacionado</label>
                                        <select 
                                            value={categoryForm.nicheId} 
                                            onChange={e => setCategoryForm({...categoryForm, nicheId: e.target.value})}
                                            className="h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:border-purple-500/50 transition-all outline-none font-bold appearance-none"
                                        >
                                            <option value="" className="bg-[#0c0c10]">Selecione um Nicho</option>
                                            {niches.map(n => <option key={n.id} value={n.id} className="bg-[#0c0c10]">{n.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Categoria</label>
                                        <input 
                                            value={categoryForm.name} 
                                            onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} 
                                            className="h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:border-purple-500/50 transition-all outline-none font-bold" 
                                            placeholder="Ex: Tratamento Capilar" 
                                        />
                                    </div>
                                </div>
                            )}

                            {showNicheForm && (
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Nicho</label>
                                        <input 
                                            value={nicheForm.name} 
                                            onChange={e => setNicheForm({...nicheForm, name: e.target.value})} 
                                            className="h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:border-purple-500/50 transition-all outline-none font-bold" 
                                            placeholder="Ex: Cabelos e Penteados" 
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ordem de Exibição</label>
                                        <input 
                                            type="number" 
                                            value={nicheForm.order} 
                                            onChange={e => setNicheForm({...nicheForm, order: Number(e.target.value)})} 
                                            className="h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:border-purple-500/50 transition-all outline-none font-bold" 
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 animate-fade-in">
                                    <AlertCircle size={18} />
                                    <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-10 py-8 bg-black/40 border-t border-white/5 flex gap-4">
                            <button 
                                onClick={() => { setShowForm(false); setShowCategoryForm(false); setShowNicheForm(false); }} 
                                className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={showForm ? handleSaveService : showNicheForm ? handleSaveNiche : handleSaveCategory} 
                                disabled={saving}
                                className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-600/20 active:scale-95 transition-all"
                            >
                                {saving ? 'Sincronizando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
