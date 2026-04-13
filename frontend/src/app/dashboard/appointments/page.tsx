'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
    ChevronLeft, ChevronRight, Calendar, X, Check, Search, User, Scissors, Clock,
    CreditCard, CalendarX, Edit2, DollarSign, Ban, AlertCircle
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FormField, Input, Select, ActionButton } from '@/components/ui/FormField';

// ─── Tipos ──────────────────────────────────────────────────────────────────
interface Appointment {
    id: string;
    date: string;
    endDate?: string;
    duration?: number;
    status: string;
    client: Client;
    professional: { id: string; name: string };
    service: Service;
}
interface Client { id: string; name: string; phone?: string; }
interface Service { 
    id: string; 
    name: string; 
    duration: number; 
    price: number; 
    categoryId?: string; 
    category?: { 
        id: string; 
        name: string; 
        nicheId: string;
    } 
}

interface Professional {
    id: string;
    name: string;
    niches: { id: string; name: string }[];
    serviceIds: string[];
}

interface NichoHierarchy {
    id: string;
    name: string;
    categories: {
        id: string;
        name: string;
        services: Service[];
    }[];
}

// ─── Constantes de grade ──────────────────────────────────────────────────
const HOUR_START = 7;
const HOUR_END = 21;
const SLOT_MIN = 15;
const ROW_H = 56;

const ALL_SLOTS: string[] = [];
for (let h = HOUR_START; h < HOUR_END; h++) {
    ALL_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
    ALL_SLOTS.push(`${String(h).padStart(2, '0')}:15`);
    ALL_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
    ALL_SLOTS.push(`${String(h).padStart(2, '0')}:45`);
}

// ─── Cores de status ─────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
    SCHEDULED:  { bg: 'rgba(56,189,248,0.15)',  border: '#38bdf8', text: '#38bdf8',  label: 'Agendado' },
    CONFIRMED:  { bg: 'rgba(124,58,237,0.20)',  border: '#a78bfa', text: '#a78bfa',  label: 'Confirmado' },
    CHECKED_IN: { bg: 'rgba(245,158,11,0.20)',  border: '#f59e0b', text: '#f59e0b',  label: 'Check-in' },
    COMPLETED:  { bg: 'rgba(34,197,94,0.15)',   border: '#22c55e', text: '#22c55e',  label: 'Concluído' },
    CANCELLED:  { bg: 'rgba(239,68,68,0.12)',   border: '#ef4444', text: '#ef4444',  label: 'Cancelado' },
    NO_SHOW:    { bg: 'rgba(107,114,128,0.15)', border: '#6b7280', text: '#9ca3af',  label: 'Não compareceu' },
};

const PROF_COLORS = ['#7c3aed', '#38bdf8', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6'];

// ─── Funções utilitárias ──────────────────────────────────────────────────
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const isoToTime = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const slotsNeeded = (duration: number) => Math.max(1, Math.ceil(duration / SLOT_MIN));
const addMins = (time: string, mins: number) => {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + mins;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// ─── Componente Seletor de Serviços (Modal de Navegação) ──────────────────
interface ServiceSelectorModalProps {
    niches: NichoHierarchy[];
    professionalNicheIds: string[];
    enabledServiceIds: string[];
    onSelect: (service: Service) => void;
    onClose: () => void;
}

function ServiceSelectorModal({ niches, professionalNicheIds, enabledServiceIds, onSelect, onClose }: ServiceSelectorModalProps) {
    const [view, setView] = useState<'NICHES' | 'CATEGORIES' | 'SERVICES'>('NICHES');
    const [selectedNiche, setSelectedNiche] = useState<NichoHierarchy | null>(null);
    const [selectedCat, setSelectedCat] = useState<NichoHierarchy['categories'][0] | null>(null);

    // Filtra os nichos conforme as permissões do profissional
    const filteredNiches = niches
        .filter(n => professionalNicheIds.length === 0 || professionalNicheIds.includes(n.id))
        .map(n => ({
            ...n,
            categories: n.categories.map(cat => ({
                ...cat,
                services: cat.services.filter(s => enabledServiceIds.length === 0 || enabledServiceIds.includes(s.id))
            })).filter(cat => cat.services.length > 0)
        })).filter(n => n.categories.length > 0);

    const handleNicheClick = (n: NichoHierarchy) => {
        setSelectedNiche(n);
        // Se tiver apenas uma categoria, pula direto para ela
        if (n.categories.length === 1) {
            handleCatClick(n.categories[0]);
        } else {
            setView('CATEGORIES');
        }
    };

    const handleCatClick = (cat: NichoHierarchy['categories'][0]) => {
        setSelectedCat(cat);
        setView('SERVICES');
    };

    const goBack = () => {
        if (view === 'SERVICES') {
            if (selectedNiche?.categories.length === 1) setView('NICHES');
            else setView('CATEGORIES');
        } else if (view === 'CATEGORIES') {
            setView('NICHES');
        }
    };

    const getTitle = () => {
        if (view === 'SERVICES') return selectedCat?.name;
        if (view === 'CATEGORIES') return selectedNiche?.name;
        return 'Selecione...';
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="card w-full max-w-[440px] max-h-[85vh] z-10 overflow-hidden flex flex-col p-0 shadow-2xl animate-scale-in">
                
                {/* Cabeçalho */}
                <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-4">
                        {view !== 'NICHES' && (
                            <button onClick={goBack} className="p-2 -ml-2 rounded-full transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <h3 className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            {getTitle()}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <X size={22} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {view === 'NICHES' && (
                        <div className="flex flex-col gap-1">
                            {filteredNiches.map(n => (
                                <button key={n.id} onClick={() => handleNicheClick(n)} className="w-full py-3.5 px-5 flex items-center justify-between text-left rounded-xl transition-all group duration-200" style={{ color: 'var(--text-secondary)' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-base)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                                >
                                    <span className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>{n.name}</span>
                                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                                </button>
                            ))}
                        </div>
                    )}

                    {view === 'CATEGORIES' && selectedNiche && (
                        <div className="flex flex-col gap-1">
                            {selectedNiche.categories.map(cat => (
                                <button key={cat.id} onClick={() => handleCatClick(cat)} className="w-full py-3.5 px-5 flex items-center justify-between text-left rounded-xl transition-all group duration-200"
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-base)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                                >
                                    <span className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>{cat.name}</span>
                                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                                </button>
                            ))}
                        </div>
                    )}

                    {view === 'SERVICES' && selectedCat && (
                        <div className="flex flex-col gap-1">
                            {selectedCat.services.map(s => (
                                <button key={s.id} onClick={() => onSelect(s)} className="w-full py-3.5 px-5 flex items-center justify-between text-left rounded-xl transition-all group duration-200"
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-base)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                                >
                                    <div>
                                        <p className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                                <Clock size={12} />
                                                {s.duration}min
                                            </span>
                                            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>R$ {s.price.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


// ─── Componente Modal ─────────────────────────────────────────────────────
interface ModalProps {
    date: string; // yyyy-MM-dd
    slot: string; // HH:mm
    professional: Professional;
    professionals: Professional[];
    onClose: () => void;
    onSaved: () => void;
    appointment?: Appointment; // Se presente, modo edição
}

function BookingModal({ date, slot, professional, professionals, onClose, onSaved, appointment }: ModalProps) {
    const isEdit = !!appointment;
    const [clients, setClients] = useState<Client[]>([]);
    const [niches, setNiches] = useState<NichoHierarchy[]>([]);
    const [clientSearch, setClientSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(appointment?.client || null);
    const [selectedService, setSelectedService] = useState<Service | null>(appointment?.service || null);
    const [selectedProfId, setSelectedProfId] = useState(appointment?.professional.id || professional.id);
    const [selectedDate, setSelectedDate] = useState(date); // Suporte a mudar data
    
    // Início e Término
    const [startTime, setStartTime] = useState(appointment ? isoToTime(appointment.date) : slot);
    const [endTime, setEndTime] = useState('');

    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showClientList, setShowClientList] = useState(false);
    const [showServiceSelector, setShowServiceSelector] = useState(false);

    useEffect(() => {
        api.get('/clients').then(r => setClients(r.data)).catch(console.error);
        api.get('/service-categories/niches').then(r => setNiches(r.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedService && !isEdit) {
            // Sugere término baseado na duração do serviço
            setEndTime(addMins(startTime, selectedService.duration));
        } else if (isEdit && appointment) {
            // No modo edição, carregar o término correto
            const end = appointment.endDate ? isoToTime(appointment.endDate) : addMins(isoToTime(appointment.date), appointment.service.duration);
            setEndTime(end);
        }
    }, [selectedService]);

    useEffect(() => {
        if (selectedService && selectedProfId && selectedDate) {
            setLoadingSlots(true);
            api.get(`/appointments/available-slots`, {
                params: { professionalId: selectedProfId, serviceId: selectedService.id, date: selectedDate }
            })
            .then(res => setAvailableSlots(res.data))
            .catch(() => setAvailableSlots([]))
            .finally(() => setLoadingSlots(false));
        }
    }, [selectedProfId, selectedService, selectedDate]);

    // Identifica os nichos do profissional selecionado
    const selectedProfessional = professionals.find(p => p.id === selectedProfId);
    const professionalNicheIds = selectedProfessional?.niches?.map(c => c.id) || [];

    const diffMin = Math.round((toMin(endTime) - toMin(startTime)));

    const handleSave = async () => {
        if (!selectedClient) { setError('Selecione um cliente'); return; }
        if (!selectedService) { setError('Selecione um serviço'); return; }
        if (diffMin <= 0) { setError('Término deve ser após o início'); return; }
        
        setError('');
        setSaving(true);
        try {
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            
            const startISO = new Date(selectedDate + 'T00:00:00');
            startISO.setHours(sh, sm, 0, 0);
            
            const endISO = new Date(selectedDate + 'T00:00:00');
            endISO.setHours(eh, em, 0, 0);

            if (isEdit && appointment) {
                await api.patch(`/appointments/${appointment.id}`, {
                    clientId: selectedClient.id,
                    professionalId: selectedProfId,
                    serviceId: selectedService.id,
                    date: startISO.toISOString(),
                    endDate: endISO.toISOString(),
                });
            } else {
                await api.post('/appointments', {
                    clientId: selectedClient.id,
                    professionalId: selectedProfId,
                    serviceId: selectedService.id,
                    date: startISO.toISOString(),
                    endDate: endISO.toISOString(), // Envia o término customizado
                });
            }
            onSaved();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Erro ao salvar agendamento');
        } finally {
            setSaving(false);
        }
    };

    const displayDate = new Date(selectedDate + 'T00:00:00');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
            <div className="card animate-fade-in z-10 shadow-2xl overflow-hidden" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}
                onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                        <h2 style={{ fontSize: 17, fontWeight: 700 }}>{isEdit ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={e => setSelectedDate(e.target.value)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none' }} 
                            />
                        </div>
                    </div>
                    <button onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col gap-5">
                    {/* Profissional e Tempo */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Profissional" icon={User}>
                            <Select 
                                value={selectedProfId} 
                                onChange={e => {
                                    setSelectedProfId(e.target.value);
                                    setSelectedService(null);
                                }}
                            >
                                {professionals.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </Select>
                        </FormField>

                        <FormField label="Início" icon={Clock}>
                            <Input 
                                type="text"
                                list="times-suggestions"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                placeholder="00:00"
                            />
                        </FormField>

                        <FormField label="Término" icon={Clock}>
                            <Input 
                                type="text"
                                list="times-suggestions"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                placeholder="00:00"
                            />
                        </FormField>

                        <datalist id="times-suggestions">
                            {ALL_SLOTS.map(s => <option key={s} value={s} />)}
                        </datalist>
                    </div>

                    {/* Cliente */}
                    <FormField label="Cliente" icon={Search}>
                        {selectedClient ? (
                            <div className="input-field flex items-center justify-between !bg-green-500/10 !border-green-500/30">
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-semibold truncate text-green-400">{selectedClient.name}</span>
                                    {selectedClient.phone && <span className="text-[10px] text-green-500/70 truncate">{selectedClient.phone}</span>}
                                </div>
                                <button 
                                    onClick={() => { setSelectedClient(null); setClientSearch(''); }}
                                    className="p-1.5 hover:bg-green-500/20 rounded-md transition-colors text-green-400"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] mt-[1px]" />
                                    <Input
                                        className="!pl-11"
                                        value={clientSearch}
                                        onChange={e => { setClientSearch(e.target.value); setShowClientList(true); }}
                                        onFocus={() => setShowClientList(true)}
                                        placeholder="Pesquisar cliente por nome ou celular..."
                                    />
                                </div>
                                {showClientList && clients.length > 0 && (
                                    <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-[60] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-[220px] overflow-y-auto">
                                        {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 10).map(c => (
                                            <button 
                                                key={c.id} 
                                                onClick={() => { setSelectedClient(c); setShowClientList(false); }}
                                                className="w-full px-4 py-3 text-left hover:bg-white/5 border-b border-[var(--border)] last:border-0 transition-colors group"
                                            >
                                                <p className="text-sm font-medium group-hover:text-[var(--primary)] transition-colors">{c.name}</p>
                                                {c.phone && <p className="text-xs text-[var(--text-muted)] mt-0.5">{c.phone}</p>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </FormField>

                    {/* Serviço */}
                    <FormField label="Escolha o Serviço" icon={Scissors}>
                        <ActionButton 
                            onClick={() => setShowServiceSelector(true)}
                            icon={selectedService ? null : Scissors}
                        >
                            {selectedService ? (
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-[var(--primary)]">{selectedService.name}</span>
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">
                                        {selectedService.duration} min · R$ {selectedService.price.toFixed(2)}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-sm text-[var(--text-muted)]">Clique para selecionar um serviço...</span>
                            )}
                        </ActionButton>
                    </FormField>

                    {showServiceSelector && (
                        <ServiceSelectorModal 
                            niches={niches}
                            professionalNicheIds={professionalNicheIds}
                            enabledServiceIds={selectedProfessional?.serviceIds || []}
                            onClose={() => setShowServiceSelector(false)}
                            onSelect={(s) => {
                                setSelectedService(s);
                                setShowServiceSelector(false);
                            }}
                        />
                    )}

                    {/* Resumo de Tempo e Ações */}
                    <div style={{ marginTop: 8, padding: '14px', borderRadius: 12, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ fontSize: 13, color: diffMin > 0 ? 'var(--text-secondary)' : '#ef4444', fontWeight: 600 }}>
                                <Clock size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                                {diffMin > 0 ? `Duração: ${diffMin}min` : 'Horário inválido'}
                            </p>
                            {selectedService && diffMin !== selectedService.duration && diffMin > 0 && (
                                <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Customizado
                                </span>
                            )}
                        </div>

                        {error && (
                            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
                                <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>{error}</p>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                            <button onClick={onClose}
                                style={{
                                    flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                                    color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, transition: 'all 0.2s'
                                }}
                                className="hover:bg-white/5"
                            >
                                Cancelar
                            </button>
                            <button onClick={handleSave} disabled={saving} 
                                className="btn-cyan !rounded-xl"
                                style={{
                                    flex: 2, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                {saving ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Check size={18} />}
                                {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Modal de Detalhes do Agendamento ─────────────────────────────────────
function AppointmentDetailsModal({ ap, professionals, onClose, onSaved, onEdit }: { ap: Appointment, professionals: Professional[], onClose: () => void, onSaved: () => void, onEdit: (a: Appointment) => void }) {
    const [view, setView] = useState<'DETAILS'|'RESCHEDULE'|'CHECKOUT'>('DETAILS');
    const [saving, setSaving] = useState(false);

    // Reschedule State
    const [rDate, setRDate] = useState(ap.date.substring(0, 10));
    const [rTime, setRTime] = useState(isoToTime(ap.date));
    const [rProf, setRProf] = useState(ap.professional.id);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Checkout State
    const [discountType, setDiscountType] = useState<'VALUE'|'PERCENTAGE'>('VALUE');
    const [discount, setDiscount] = useState('');
    const [payments, setPayments] = useState<{ method: string; amount: string }[]>([{ method: 'PIX', amount: ap.service.price.toFixed(2) }]);

    useEffect(() => {
        if (view === 'RESCHEDULE' && rProf && rDate) {
            setLoadingSlots(true);
            api.get(`/appointments/available-slots`, {
                params: { professionalId: rProf, serviceId: ap.service.id, date: rDate }
            })
            .then(res => {
                setAvailableSlots(res.data);
                if (!res.data.includes(rTime)) {
                    setRTime(res.data[0] || '');
                }
            })
            .catch(e => {
                console.error('Erro ao buscar slots disponíveis', e);
                setAvailableSlots([]);
            })
            .finally(() => setLoadingSlots(false));
        }
    }, [view, rProf, rDate]);

    const subtotal = ap.service.price;
    const descValue = Number(discount) || 0;
    const descReais = discountType === 'PERCENTAGE' ? (subtotal * descValue / 100) : descValue;
    const total = Math.max(0, subtotal - descReais);

    // Ajusta o valor do pagamento se tiver apenas 1 ao mexer no desconto
    useEffect(() => {
        if (payments.length === 1) {
            setPayments([{ ...payments[0], amount: total.toFixed(2) }]);
        }
    }, [total]);

    const handleNoShow = async () => {
        if (!confirm('Marcar como não compareceu?')) return;
        try {
            setSaving(true);
            await api.patch(`/appointments/${ap.id}/no-show`);
            onSaved();
        } catch(e) { console.error(e); alert('Erro'); } finally { setSaving(false); }
    };

    const handleReschedule = async () => {
        try {
            setSaving(true);
            const [h, m] = rTime.split(':').map(Number);
            const newIso = new Date(rDate + 'T00:00:00');
            newIso.setHours(h, m, 0, 0);
            await api.patch('/appointments/reschedule', {
                appointmentId: ap.id,
                professionalId: rProf,
                newDate: newIso.toISOString()
            });
            onSaved();
        } catch(e) { console.error(e); alert('Erro'); } finally { setSaving(false); }
    };

    const handleCheckout = async () => {
        try {
            setSaving(true);
            const orderRes = await api.post('/orders', { clientId: ap.client.id });
            const orderId = orderRes.data.id;
            await api.patch(`/orders/${orderId}/appointments/${ap.id}`);
            await api.post(`/orders/${orderId}/checkout`, { 
                discount: Number(discount) || 0,
                discountType,
                payments: payments.map(p => ({ 
                    method: p.method, 
                    amount: Number(p.amount),
                    fee: Number((p as any).fee) || 0 
                }))
            });
            onSaved();
        } catch(e: any) { 
            console.error(e); 
            alert(e.response?.data?.message || 'Erro ao fechar comanda'); 
        } finally { setSaving(false); }
    };

    const st = STATUS_COLORS[ap.status] ?? STATUS_COLORS.SCHEDULED;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
            <div className="card animate-fade-in flex flex-col gap-4 z-10 shadow-2xl" style={{ width: '100%', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold">Detalhes do Agendamento</h2>
                        <span className="badge mt-2" style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>{st.label}</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
                </div>

                {view === 'DETAILS' && (
                    <div className="flex flex-col gap-4 mt-2">
                        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] flex gap-3 flex-col">
                            <p className="text-sm"><strong>Cliente:</strong> {ap.client.name}</p>
                            <p className="text-sm"><strong>Serviço:</strong> {ap.service.name} (R$ {ap.service.price.toFixed(2)})</p>
                            <p className="text-sm"><strong>Profissional:</strong> {ap.professional.name}</p>
                            <p className="text-sm"><strong>Horário:</strong> {format(new Date(ap.date), "dd/MM/yyyy 'às' HH:mm")} ({ap.service.duration} min)</p>
                        </div>
                        
                        {ap.status !== 'COMPLETED' && ap.status !== 'CANCELLED' && ap.status !== 'NO_SHOW' && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <button className="btn-secondary flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-sm font-bold uppercase tracking-widest text-[11px]" onClick={() => setView('CHECKOUT')} style={{ gridColumn: 'span 2', background: '#06b6d4', color: '#fff', border: 'none' }}>
                                    <DollarSign size={16}/> Abrir Comanda / Checkout
                                </button>
                                <button className="btn-secondary flex items-center justify-center gap-2 transition-all hover:scale-[1.02] text-[11px] font-bold uppercase tracking-widest" onClick={() => onEdit(ap)}>
                                    <Edit2 size={16}/> Editar
                                </button>
                                <button className="btn-secondary flex items-center justify-center gap-2 transition-all hover:scale-[1.02] text-[11px] font-bold uppercase tracking-widest" onClick={() => setView('RESCHEDULE')}>
                                    <Calendar size={16}/> Reagendar
                                </button>
                                <button className="btn-secondary flex items-center justify-center gap-2 transition-all hover:scale-[1.02] text-[11px] font-bold uppercase tracking-widest" onClick={handleNoShow} disabled={saving} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                                    <Ban size={16}/> Faltou
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {view === 'RESCHEDULE' && (
                    <div className="flex flex-col gap-4">
                        <FormField label="Nova Data" icon={Calendar}>
                            <Input type="date" value={rDate} onChange={e => setRDate(e.target.value)} />
                        </FormField>
                        
                        <FormField label="Novo Horário" icon={Clock}>
                            <Select value={rTime} onChange={e => setRTime(e.target.value)} disabled={loadingSlots}>
                                {loadingSlots ? (
                                    <option>Buscando horários...</option>
                                ) : availableSlots.length === 0 ? (
                                    <option>Nenhum horário disponível</option>
                                ) : (
                                    availableSlots.map(s => <option key={s} value={s}>{s}</option>)
                                )}
                            </Select>
                        </FormField>

                        <FormField label="Profissional" icon={User}>
                            <Select value={rProf} onChange={e => setRProf(e.target.value)}>
                                {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </Select>
                        </FormField>

                        <div className="flex gap-2 mt-2">
                            <button className="btn-secondary flex-1" onClick={() => setView('DETAILS')}>Voltar</button>
                            <button className="btn-primary flex-1" disabled={saving} onClick={handleReschedule}>
                                {saving ? "Salvando..." : "Confirmar Mudança"}
                            </button>
                        </div>
                    </div>
                )}

                {view === 'CHECKOUT' && (
                    <div className="flex flex-col gap-4">
                         <div className="p-4 rounded-xl border border-[var(--border)] bg-gray-500/5">
                            <p className="text-sm font-bold flex justify-between">
                                <span className="text-[var(--text-secondary)]">Subtotal:</span> <span>R$ {subtotal.toFixed(2)}</span>
                            </p>
                            {descReais > 0 && (
                                <p className="text-sm flex justify-between text-[var(--danger)] mt-2">
                                    <span className="font-bold">Desconto:</span> <span className="font-mono">- R$ {descReais.toFixed(2)}</span>
                                </p>
                            )}
                            <div className="h-[1px] bg-[var(--border)] my-3" />
                            <p className="text-lg font-bold flex justify-between text-[var(--primary)]">
                                <span>Total a Pagar:</span> <span>R$ {total.toFixed(2)}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-[1fr,80px] gap-3">
                            <FormField label="Desconto Opcional" icon={DollarSign}>
                                <Input type="number" placeholder="0.00" value={discount} onChange={e => setDiscount(e.target.value)} />
                            </FormField>
                            <FormField label="Tipo">
                                <Select value={discountType} onChange={e => setDiscountType(e.target.value as any)}>
                                    <option value="VALUE">R$</option>
                                    <option value="PERCENTAGE">%</option>
                                </Select>
                            </FormField>
                        </div>

                        <div className="mt-2">
                            <div className="flex justify-between items-center mb-3">
                                <label className="form-label mb-0">Formas de Pagamento</label>
                                <button className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-tighter hover:underline" onClick={() => setPayments([...payments, { method: 'CREDIT_CARD', amount: '0.00' }])}>
                                    + Adicionar
                                </button>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                {payments.map((p, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <Select style={{ flex: 1.5 }} value={p.method} onChange={e => {
                                            const newP = [...payments];
                                            newP[i].method = e.target.value;
                                            setPayments(newP);
                                        }}>
                                            <option value="PIX">PIX</option>
                                            <option value="CREDIT_CARD">Cartão de Crédito</option>
                                            <option value="DEBIT_CARD">Cartão de Débito</option>
                                            <option value="CASH">Dinheiro</option>
                                        </Select>
                                        <div className="relative" style={{ flex: 1 }}>
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] mt-[1px]">R$</span>
                                            <Input className="pl-8" value={p.amount} onChange={e => {
                                                const newP = [...payments];
                                                newP[i].amount = e.target.value;
                                                setPayments(newP);
                                            }} />
                                        </div>
                                        <div className="relative" style={{ flex: 0.8 }}>
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--danger)] font-bold mt-[1px]">Taxa</span>
                                            <Input className="pl-10 text-[var(--danger)] text-right" placeholder="0.00" value={(p as any).fee || ''} onChange={e => {
                                                const newP = [...payments];
                                                (newP[i] as any).fee = e.target.value;
                                                setPayments(newP);
                                            }} />
                                        </div>
                                        {payments.length > 1 && (
                                            <button className="h-[48px] px-2 text-[var(--danger)] hover:bg-red-500/10 rounded-lg transition-colors" onClick={() => setPayments(payments.filter((_, idx) => idx !== i))}>
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button className="btn-secondary flex-1" onClick={() => setView('DETAILS')}>Voltar</button>
                            <button 
                                className="flex-1 h-[48px] rounded-xl font-bold uppercase tracking-widest text-xs bg-[#06b6d4] text-white shadow-lg shadow-[#06b6d4]/20 hover:bg-[#0891b2] transition-all" 
                                disabled={saving || payments.reduce((acc, p) => acc + Number(p.amount), 0) < total - 0.01} 
                                onClick={handleCheckout} 
                            >
                                {saving ? "Processando..." : `Cobrar R$ ${total.toFixed(2)}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Componente Principal ──────────────────────────────────────────────────
export default function AppointmentsPage() {
    const { user, hydrate } = useAuthStore();
    const canScheduleOutside = user?.role === 'ADMIN' || user?.permissions?.includes('schedule_outside_hours');
    const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [allProfessionals, setAllProfessionals] = useState<Professional[]>([]);
    const [professionalSchedules, setProfessionalSchedules] = useState<Record<string, { dayOfWeek: number; startTime: string; endTime: string }[]>>({});
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{ slot: string; professional: Professional; appointment?: Appointment } | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const today = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => { hydrate(); }, []);

    const fetchAppointments = useCallback(() => {
        setLoading(true);
        api.get(`/appointments/day?date=${date}`)
            .then(r => setAppointments(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [date]);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    // Busca lista de profissionais para o seletor do modal
    useEffect(() => {
        api.get('/users/professionals').then(async (r) => {
            const profs = r.data as Professional[];
            setAllProfessionals(profs);

            // Fetch schedules for all professionals
            const schedulesMap: any = {};
            for (const p of profs) {
                try {
                    const res = await api.get(`/users/professional/${p.id}/working-hours`);
                    schedulesMap[p.id] = res.data;
                } catch (e) {
                    schedulesMap[p.id] = [];
                }
            }
            setProfessionalSchedules(schedulesMap);
        }).catch(console.error);
    }, []);

    const changeDay = (d: number) => {
        const base = new Date(date + 'T00:00:00');
        const next = d > 0 ? addDays(base, d) : subDays(base, Math.abs(d));
        setDate(format(next, 'yyyy-MM-dd'));
    };

    const handleEdit = (ap: Appointment) => {
        setSelectedAppointment(null);
        setModal({
            slot: isoToTime(ap.date),
            professional: allProfessionals.find(p => p.id === ap.professional.id) || ap.professional as any,
            appointment: ap
        });
    };

    const displayDate = new Date(date + 'T00:00:00');

    // Todos os profissionais aparecem como colunas, sempre
    const professionals: Professional[] = allProfessionals;

    // Mapa de agendamentos
    const byProf: Record<string, Appointment[]> = {};
    for (const ap of appointments) {
        if (ap.status === 'CANCELLED') continue;
        if (!byProf[ap.professional.id]) byProf[ap.professional.id] = [];
        byProf[ap.professional.id].push(ap);
    }

    const getAppointment = (profId: string, slot: string): Appointment | null => {
        const slotMin = toMin(slot);
        return byProf[profId]?.find(a => {
            const m = toMin(isoToTime(a.date));
            // O agendamento pertence a este slot se começar NESTE slot de 15 min
            return m >= slotMin && m < slotMin + 15;
        }) ?? null;
    };

    const isCovered = (profId: string, slot: string): boolean => {
        const slotMin = toMin(slot);
        return (byProf[profId] ?? []).some(a => {
            const start = toMin(isoToTime(a.date));
            const end = start + a.service.duration;
            return slotMin >= start && slotMin < end;
        });
    };

    const isWithinWorkingHours = (profId: string, slot: string): boolean => {
        const profSchedules = professionalSchedules[profId] || [];
        const dayOfWeek = displayDate.getDay();
        const slotMin = toMin(slot);

        return profSchedules.some(s => {
            if (s.dayOfWeek !== dayOfWeek) return false;
            const start = toMin(s.startTime);
            const end = toMin(s.endTime);
            return slotMin >= start && slotMin < end;
        });
    };

    // Para profissional: pré-seleciona o próprio profissional
    const modalProfessionals = professionals;

    const handleSlotClick = (slot: string, prof: Professional) => {
        const ap = getAppointment(prof.id, slot);
        const covered = isCovered(prof.id, slot);
        if (ap || covered) return; // slot ocupado, não abre modal
        // Para profissional, força o próprio profissional no modal
        const targetProf = user?.role === 'PROFESSIONAL' && user.professionalId
            ? (modalProfessionals.find(p => p.id === user.professionalId) ?? prof)
            : prof;
        setModal({ slot, professional: targetProf });
    };

    return (
        <div className="animate-fade-in w-full flex flex-col" style={{ minHeight: 0 }}>

            {/* ─── Header ────────────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>Atendimentos</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {appointments.filter(a => a.status !== 'CANCELLED').length} agendamentos ·{' '}
                        <span style={{ color: 'var(--text-muted)' }}>clique em um horário vazio para agendar</span>
                    </p>
                </div>
            </div>

            {/* ─── Navegador de data ────────────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '10px 16px',
            }}>
                <button onClick={() => changeDay(-1)}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={16} />
                </button>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize' }}>
                        {format(displayDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    {date === today && (
                        <span style={{
                            display: 'inline-block', marginTop: 2, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                            background: 'var(--accent-cyan-glow)', color: 'var(--accent-cyan)', borderRadius: 999, padding: '1px 10px',
                            border: '1px solid var(--accent-cyan-glow)'
                        }}>HOJE</span>
                    )}
                </div>
                <button onClick={() => changeDay(1)}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* ─── Grade da agenda ────────────────────────────────────────────────── */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
                    <span className="spinner" style={{ width: 36, height: 36 }} />
                </div>
            ) : professionals.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 10, padding: '60px 0',
                    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
                }}>
                    <Calendar size={40} style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhum agendamento neste dia</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Navegue para outro dia ou adicione profissionais ao sistema</p>
                </div>
            ) : (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ minWidth: Math.max(600, 64 + professionals.length * 180) }}>

                            {/* Cabeçalho dos profissionais */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `64px repeat(${professionals.length}, 1fr)`,
                                borderBottom: '1px solid var(--border)',
                                position: 'sticky', top: 0, zIndex: 10,
                                background: 'var(--bg-card)',
                            }}>
                                <div style={{ borderRight: '1px solid var(--border)' }} />
                                {professionals.map((prof, i) => (
                                    <div key={prof.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '12px 14px',
                                        borderRight: i < professionals.length - 1 ? '1px solid var(--border)' : 'none',
                                    }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                            background: `${PROF_COLORS[i % PROF_COLORS.length]}22`,
                                            border: `2px solid ${PROF_COLORS[i % PROF_COLORS.length]}55`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, fontWeight: 700,
                                            color: PROF_COLORS[i % PROF_COLORS.length],
                                        }}>
                                            {prof.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {prof.name.split(' ')[0]}
                                        </span>
                                        <span style={{
                                            marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                                            background: `${PROF_COLORS[i % PROF_COLORS.length]}22`,
                                            color: PROF_COLORS[i % PROF_COLORS.length],
                                            borderRadius: 999, padding: '2px 8px', flexShrink: 0,
                                        }}>
                                            {(byProf[prof.id] ?? []).length}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Corpo da grade */}
                            <div style={{ maxHeight: '62vh', overflowY: 'auto' }}>
                                    {ALL_SLOTS.map((slot) => {
                                        const isHour = slot.endsWith(':00');
                                        const isHalf = slot.endsWith(':30');
                                        return (
                                            <div key={slot} style={{
                                                display: 'grid',
                                                gridTemplateColumns: `64px repeat(${professionals.length}, 1fr)`,
                                                borderBottom: isHour ? '1px solid var(--border)' : '1px dashed var(--border)',
                                                borderStyle: isHour ? 'solid' : 'dashed',
                                                minHeight: ROW_H,
                                                background: isHour ? 'transparent' : 'transparent'
                                            }}>
                                                {/* Coluna de hora */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                                                    padding: '6px 10px 0 0',
                                                    borderRight: '1px solid var(--border)',
                                                    fontSize: 11, fontWeight: isHour ? 700 : 400,
                                                    color: isHour ? 'var(--text-secondary)' : 'var(--text-muted)',
                                                    userSelect: 'none',
                                                    background: 'var(--bg-body)',
                                                    zIndex: 1
                                                }}>
                                                    {isHour ? slot : ''}
                                                </div>

                                            {/* Células por profissional */}
                                            {professionals.map((prof, i) => {
                                                const ap = getAppointment(prof.id, slot);
                                                const covered = !ap && isCovered(prof.id, slot);
                                                const inShift = isWithinWorkingHours(prof.id, slot);
                                                const isUnavailable = !ap && !covered && !inShift;
                                                const isEmpty = !ap && !covered && inShift; // In-shift slots are always clickable
                                                const sc = ap ? (STATUS_COLORS[ap.status] ?? STATUS_COLORS.SCHEDULED) : null;
                                                const spans = ap ? slotsNeeded(ap.service.duration) : 1;

                                                // Determine interactivity
                                                const canClick = isEmpty || (isUnavailable && canScheduleOutside);

                                                return (
                                                    <div key={prof.id}
                                                        onClick={() => {
                                                            if (canClick) {
                                                                handleSlotClick(slot, prof);
                                                            } else if (isUnavailable && !canScheduleOutside) {
                                                                alert('Você não tem permissão para agendar fora do horário');
                                                            }
                                                        }}
                                                        style={{
                                                            borderRight: i < professionals.length - 1 ? '1px solid var(--border)' : 'none',
                                                            position: 'relative',
                                                            minHeight: ROW_H,
                                                            cursor: canClick ? 'pointer' : (isUnavailable ? 'not-allowed' : 'default'),
                                                            transition: 'background 0.12s',
                                                            background: isUnavailable ? 'rgba(0,0,0,0.03)' : 'transparent'
                                                        }}
                                                        onMouseEnter={e => {
                                                            if (canClick) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                                                        }}
                                                    >
                                                        {/* Ícone + hover para slot vazio ou autorizado fora do turno */}
                                                        {canClick && !ap && !covered && (
                                                            <div style={{
                                                                position: 'absolute', inset: 0,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                opacity: 0, transition: 'opacity 0.15s',
                                                            }}
                                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
                                                            >
                                                                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>+ agendar</span>
                                                            </div>
                                                        )}

                                                        {isUnavailable && (
                                                            <div style={{
                                                                position: 'absolute', inset: 0,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                opacity: canScheduleOutside ? 0.6 : 0.2,
                                                            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.025) 10px, rgba(0,0,0,0.025) 20px)',
                                                                border: (isUnavailable && canScheduleOutside) ? '1px dashed var(--text-muted)' : 'none',
                                                                transition: 'opacity 0.2s'
                                                            }}
                                                            title={canScheduleOutside ? 'Fora do horário de trabalho' : 'Indisponível'}>
                                                                <span style={{ 
                                                                    fontSize: 8, 
                                                                    color: canScheduleOutside ? 'var(--text-secondary)' : 'var(--text-muted)', 
                                                                    fontWeight: 800, 
                                                                    textTransform: 'uppercase', 
                                                                    letterSpacing: '0.1em' 
                                                                }}>
                                                                    {canScheduleOutside ? 'FORA DO TURNO' : 'Fechado'}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Card de agendamento */}
                                                        {ap && sc && (() => {
                                                            const appStartTime = isoToTime(ap.date);
                                                            const appInShift = isWithinWorkingHours(ap.professional.id, appStartTime);
                                                            const isOutside = !appInShift;
                                                            
                                                            // Cálculo preciso de posicionamento
                                                            const minutesFromSlotStart = toMin(appStartTime) % 15;
                                                            const verticalOffset = (minutesFromSlotStart / 15) * ROW_H;
                                                            const preciseHeight = (ap.service.duration / 15) * ROW_H;

                                                            return (
                                                                <div 
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedAppointment(ap); }}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: verticalOffset + 2, 
                                                                        left: 4, right: 4,
                                                                        height: `calc(${preciseHeight}px - 4px)`,
                                                                        zIndex: 5,
                                                                        background: sc.bg, 
                                                                        border: `1px solid ${sc.border}`,
                                                                        borderRadius: 8, 
                                                                        padding: '4px 8px',
                                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                                        cursor: 'pointer',
                                                                        display: 'flex', 
                                                                        flexDirection: 'column',
                                                                        borderLeftWidth: isOutside ? 4 : 1,
                                                                        borderLeftColor: isOutside ? 'var(--warning)' : sc.border,
                                                                        transition: 'transform 0.1s'
                                                                    }}
                                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
                                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                                                                >
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                        <span style={{ fontSize: 13, fontWeight: 700, color: sc.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {ap.client.name}
                                                                        </span>
                                                                        {isOutside && (
                                                                            <span title="Fora do turno" className="text-[var(--warning)]">
                                                                                <AlertCircle size={10} />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ fontSize: 11, fontWeight: 600, color: sc.text, opacity: 0.85, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {ap.service.name}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 mt-auto opacity-70">
                                                                        <Clock size={9} style={{ color: sc.text }} />
                                                                        <span style={{ fontSize: 9, fontWeight: 700, color: sc.text }}>{ap.service.duration} min</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Legenda */}
            {professionals.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
                    {Object.entries(STATUS_COLORS).map(([key, s]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.border }} />
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Modal de Agendamento ────────────────────────────────────────────────── */}
            {modal && (
                <BookingModal
                    date={date}
                    slot={modal.slot}
                    professional={modal.professional}
                    professionals={modalProfessionals}
                    onClose={() => setModal(null)}
                    onSaved={() => { setModal(null); fetchAppointments(); }}
                    appointment={modal.appointment}
                />
            )}

            {/* Modal de Detalhes de Agendamento Existente */}
            {selectedAppointment && (
                <AppointmentDetailsModal
                    ap={selectedAppointment}
                    professionals={modalProfessionals}
                    onClose={() => setSelectedAppointment(null)}
                    onSaved={() => { setSelectedAppointment(null); fetchAppointments(); }}
                    onEdit={handleEdit}
                />
            )}
        </div>
    );
}
