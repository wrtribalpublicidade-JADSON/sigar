import React, { useState, useEffect, useRef } from 'react';
import {
    Calendar, ChevronLeft, ChevronRight, Plus, X, Edit, Trash2,
    Filter, Printer, AlertTriangle, Check, Clock, BookOpen,
    Users, Star, Briefcase, GraduationCap, Info, ShieldCheck
} from 'lucide-react';
import { Escola } from '../types';
import { igCalendarioOficialService, igCalendarioInternoService } from '../services/gestaoConselhoService';

// ========== Types ==========
interface EventoOficial {
    id: string;
    data: string;
    data_fim?: string;
    titulo: string;
    tipo: 'feriado' | 'recesso' | 'pedagogico' | 'letivo_especial';
    obrigatorio: boolean;
    ano_letivo: string;
}

interface EventoInterno {
    id: string;
    escola_id?: string;
    data: string;
    data_fim?: string;
    titulo: string;
    tipo: 'reuniao_pedagogica' | 'conselho_classe' | 'evento_escolar' | 'projeto' | 'formacao_interna' | 'outro';
    classificacao: 'letivo' | 'nao_letivo' | 'institucional';
    descricao?: string;
    responsavel?: string;
}

interface CalendarioInternoProps {
    escolas?: Escola[];
    currentUser?: string | null;
}

// ========== Constants ==========
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const TIPOS_OFICIAL: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    feriado: { label: 'Feriado', color: 'text-red-700', bg: 'bg-red-100 border-red-200', icon: Star },
    recesso: { label: 'Recesso', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-200', icon: Clock },
    pedagogico: { label: 'Data Pedagógica', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200', icon: BookOpen },
    letivo_especial: { label: 'Letivo Especial', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200', icon: GraduationCap }
};

const TIPOS_INTERNO: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
    reuniao_pedagogica: { label: 'Reunião Pedagógica', color: 'text-teal-700', bg: 'bg-teal-50', dotColor: 'bg-teal-500' },
    conselho_classe: { label: 'Conselho de Classe', color: 'text-indigo-700', bg: 'bg-indigo-50', dotColor: 'bg-indigo-500' },
    evento_escolar: { label: 'Evento Escolar', color: 'text-pink-700', bg: 'bg-pink-50', dotColor: 'bg-pink-500' },
    projeto: { label: 'Projeto', color: 'text-cyan-700', bg: 'bg-cyan-50', dotColor: 'bg-cyan-500' },
    formacao_interna: { label: 'Formação Interna', color: 'text-orange-700', bg: 'bg-orange-50', dotColor: 'bg-orange-500' },
    outro: { label: 'Outro', color: 'text-slate-700', bg: 'bg-slate-50', dotColor: 'bg-slate-400' }
};

const CLASSIFICACOES: Record<string, { label: string; badge: string }> = {
    letivo: { label: 'Letivo', badge: 'bg-emerald-100 text-emerald-700' },
    nao_letivo: { label: 'Não Letivo', badge: 'bg-red-100 text-red-700' },
    institucional: { label: 'Institucional', badge: 'bg-blue-100 text-blue-700' }
};

const META_DIAS_LETIVOS = 200;

// ========== Helpers ==========
function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}
function formatDateKey(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function parseDateStr(d: string) {
    const [y, m, da] = d.split('-').map(Number);
    return new Date(y, m - 1, da);
}
function isDateInRange(dateKey: string, inicio: string, fim?: string) {
    if (!fim) return dateKey === inicio;
    const d = parseDateStr(dateKey);
    return d >= parseDateStr(inicio) && d <= parseDateStr(fim);
}
function isWeekend(year: number, month: number, day: number) {
    const dow = new Date(year, month, day).getDay();
    return dow === 0 || dow === 6;
}

// ========== Component ==========
export const CalendarioInterno: React.FC<CalendarioInternoProps> = ({ escolas = [], currentUser = '' }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [eventosOficiais, setEventosOficiais] = useState<EventoOficial[]>([]);
    const [eventosInternos, setEventosInternos] = useState<EventoInterno[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [editingEvento, setEditingEvento] = useState<EventoInterno | null>(null);
    const [form, setForm] = useState({
        titulo: '', tipo: 'reuniao_pedagogica', classificacao: 'letivo',
        descricao: '', responsavel: currentUser || '', data_fim: ''
    });

    // Filters
    const [filtroTipo, setFiltroTipo] = useState<string>('todos');

    // Detail popover
    const [detailDate, setDetailDate] = useState<string | null>(null);

    // ---- Fetch ----
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const [oficiais, internos] = await Promise.all([
                    igCalendarioOficialService.getAll(String(currentYear)),
                    igCalendarioInternoService.getAll()
                ]);
                if (oficiais) setEventosOficiais(oficiais);
                if (internos) setEventosInternos(internos);
            } catch (err) {
                console.error('Erro ao carregar calendário:', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [currentYear]);

    // ---- Navigation ----
    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
    };
    const goToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); };

    // ---- Events for date ----
    const getOficiaisForDate = (dateKey: string) =>
        eventosOficiais.filter(e => isDateInRange(dateKey, e.data, e.data_fim));
    const getInternosForDate = (dateKey: string) =>
        eventosInternos.filter(e => isDateInRange(dateKey, e.data, e.data_fim));

    // ---- Letive day count (full year) ----
    const countDiasLetivos = () => {
        let count = 0;
        for (let m = 0; m < 12; m++) {
            const days = getDaysInMonth(currentYear, m);
            for (let d = 1; d <= days; d++) {
                if (isWeekend(currentYear, m, d)) continue;
                const dk = formatDateKey(currentYear, m, d);
                const oficiais = getOficiaisForDate(dk);
                const isNaoLetivo = oficiais.some(e => e.tipo === 'feriado' || e.tipo === 'recesso');
                const internos = getInternosForDate(dk);
                const isInternoNaoLetivo = internos.some(e => e.classificacao === 'nao_letivo');
                if (!isNaoLetivo && !isInternoNaoLetivo) count++;
            }
        }
        return count;
    };
    const diasLetivos = countDiasLetivos();
    const diasPercentual = Math.min(100, Math.round((diasLetivos / META_DIAS_LETIVOS) * 100));

    // ---- Conflicts ----
    const hasConflict = (dateKey: string) => {
        const oficiais = getOficiaisForDate(dateKey);
        const internos = getInternosForDate(dateKey);
        if (oficiais.length > 0 && internos.length > 0) {
            const isNaoLetivo = oficiais.some(e => e.tipo === 'feriado' || e.tipo === 'recesso');
            const hasLetivoInterno = internos.some(e => e.classificacao === 'letivo');
            return isNaoLetivo && hasLetivoInterno;
        }
        return false;
    };

    // ---- Modal handlers ----
    const openNewEvent = (dateKey: string) => {
        setSelectedDate(dateKey);
        setEditingEvento(null);
        setForm({ titulo: '', tipo: 'reuniao_pedagogica', classificacao: 'letivo', descricao: '', responsavel: currentUser || '', data_fim: '' });
        setShowModal(true);
    };
    const openEditEvent = (ev: EventoInterno) => {
        setSelectedDate(ev.data);
        setEditingEvento(ev);
        setForm({
            titulo: ev.titulo, tipo: ev.tipo, classificacao: ev.classificacao,
            descricao: ev.descricao || '', responsavel: ev.responsavel || '', data_fim: ev.data_fim || ''
        });
        setShowModal(true);
        setDetailDate(null);
    };
    const handleSave = async () => {
        if (!form.titulo.trim()) return;
        try {
            const payload: any = {
                titulo: form.titulo, tipo: form.tipo, classificacao: form.classificacao,
                descricao: form.descricao, responsavel: form.responsavel,
                data: selectedDate, data_fim: form.data_fim || null
            };
            if (editingEvento) payload.id = editingEvento.id;
            const result = await igCalendarioInternoService.save(payload);
            if (editingEvento) {
                setEventosInternos(prev => prev.map(e => e.id === editingEvento.id ? result : e));
            } else {
                setEventosInternos(prev => [...prev, result]);
            }
            setShowModal(false);
        } catch (err: any) {
            console.error('Erro ao salvar evento:', err);
            alert('Erro ao salvar evento: ' + (err?.message || ''));
        }
    };
    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este evento interno?')) return;
        try {
            await igCalendarioInternoService.delete(id);
            setEventosInternos(prev => prev.filter(e => e.id !== id));
            setDetailDate(null);
        } catch (err: any) {
            console.error('Erro ao excluir:', err);
            alert('Erro ao excluir evento: ' + (err?.message || ''));
        }
    };

    // ---- Official event handlers ----
    const [showOficialModal, setShowOficialModal] = useState(false);
    const [oficialForm, setOficialForm] = useState({
        titulo: '', tipo: 'feriado', data: '', data_fim: '', obrigatorio: true, ano_letivo: String(currentYear)
    });
    const handleSaveOficial = async () => {
        if (!oficialForm.titulo.trim() || !oficialForm.data) return;
        try {
            const result = await igCalendarioOficialService.save({
                ...oficialForm,
                data_fim: oficialForm.data_fim || null,
                ano_letivo: oficialForm.ano_letivo || String(currentYear)
            });
            setEventosOficiais(prev => [...prev, result]);
            setShowOficialModal(false);
            setOficialForm({ titulo: '', tipo: 'feriado', data: '', data_fim: '', obrigatorio: true, ano_letivo: String(currentYear) });
        } catch (err: any) {
            alert('Erro ao salvar evento oficial: ' + (err?.message || ''));
        }
    };
    const handleDeleteOficial = async (id: string) => {
        if (!confirm('Excluir este evento oficial?')) return;
        try {
            await igCalendarioOficialService.delete(id);
            setEventosOficiais(prev => prev.filter(e => e.id !== id));
            setDetailDate(null);
        } catch (err: any) {
            alert('Erro ao excluir: ' + (err?.message || ''));
        }
    };

    // ---- Print ----
    const handlePrint = () => window.print();

    // ---- Filtered events for sidebar list ----
    const filteredInternos = filtroTipo === 'todos'
        ? eventosInternos
        : eventosInternos.filter(e => e.tipo === filtroTipo);

    const monthInternos = filteredInternos.filter(e => {
        const d = parseDateStr(e.data);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).sort((a, b) => a.data.localeCompare(b.data));

    const monthOficiais = eventosOficiais.filter(e => {
        const d = parseDateStr(e.data);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).sort((a, b) => a.data.localeCompare(b.data));

    // ---- Calendar grid ----
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    // ===== RENDER =====
    return (
        <div className="space-y-6 print:space-y-2">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-orange-500" /> CALENDÁRIO INTERNO
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Gestão do calendário escolar e eventos da unidade</p>
                    </div>
                    <div className="flex gap-2 flex-wrap print:hidden">
                        <button onClick={() => { setOficialForm({ titulo: '', tipo: 'feriado', data: '', data_fim: '', obrigatorio: true, ano_letivo: String(currentYear) }); setShowOficialModal(true); }}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all">
                            <ShieldCheck size={16} /> Evento Oficial
                        </button>
                        <button onClick={() => openNewEvent(formatDateKey(currentYear, currentMonth, today.getDate()))}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
                            <Plus size={16} /> Novo Evento
                        </button>
                        <button onClick={handlePrint}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all">
                            <Printer size={16} /> Imprimir
                        </button>
                    </div>
                </div>

                {/* Dias Letivos Progress */}
                <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dias Letivos {currentYear}</span>
                        <span className={`text-sm font-black ${diasLetivos >= META_DIAS_LETIVOS ? 'text-emerald-600' : diasLetivos >= 180 ? 'text-amber-600' : 'text-red-600'}`}>
                            {diasLetivos} / {META_DIAS_LETIVOS}
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${diasLetivos >= META_DIAS_LETIVOS ? 'bg-emerald-500' : diasLetivos >= 180 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${diasPercentual}%` }} />
                    </div>
                    {diasLetivos < META_DIAS_LETIVOS && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <AlertTriangle size={12} /> Faltam {META_DIAS_LETIVOS - diasLetivos} dias para atingir a meta mínima
                        </p>
                    )}
                </div>
            </div>

            {/* Filters + Legend */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                        <option value="todos">Todos os Eventos</option>
                        {Object.entries(TIPOS_INTERNO).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Feriado</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Recesso</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-400 inline-block" /> Pedagógico</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> Letivo Especial</span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-teal-500 inline-block" /> Reunião</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> Conselho</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-pink-500 inline-block" /> Evento</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Formação</span>
                </div>
            </div>

            {/* Navigation + Calendar Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Month nav */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <button onClick={prevMonth} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all print:hidden">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h4 className="text-xl font-black text-slate-800">{MESES[currentMonth]}</h4>
                        <p className="text-xs text-slate-400 font-medium">{currentYear}</p>
                    </div>
                    <div className="flex gap-2 print:hidden">
                        <button onClick={goToday} className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all">
                            Hoje
                        </button>
                        <button onClick={nextMonth} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Week headers */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                    {DIAS_SEMANA.map((d, i) => (
                        <div key={d} className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-red-400 bg-red-50/50' : 'text-slate-400'}`}>
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar cells */}
                <div className="grid grid-cols-7">
                    {Array.from({ length: totalCells }).map((_, idx) => {
                        const day = idx - firstDay + 1;
                        const isValid = day >= 1 && day <= daysInMonth;
                        if (!isValid) return <div key={idx} className="min-h-[90px] bg-slate-50/40 border-b border-r border-slate-50" />;

                        const dateKey = formatDateKey(currentYear, currentMonth, day);
                        const dow = new Date(currentYear, currentMonth, day).getDay();
                        const weekend = dow === 0 || dow === 6;
                        const isToday = dateKey === formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
                        const oficiais = getOficiaisForDate(dateKey);
                        const internos = filtroTipo === 'todos'
                            ? getInternosForDate(dateKey)
                            : getInternosForDate(dateKey).filter(e => e.tipo === filtroTipo);
                        const conflict = hasConflict(dateKey);
                        const allEvents = [...oficiais, ...internos];

                        return (
                            <div key={idx}
                                onClick={() => { if (detailDate === dateKey) { setDetailDate(null); } else if (allEvents.length > 0) { setDetailDate(dateKey); } else { openNewEvent(dateKey); } }}
                                className={`min-h-[90px] border-b border-r border-slate-100 p-1.5 cursor-pointer transition-all group relative
                                    ${weekend ? 'bg-red-50/30' : 'bg-white hover:bg-blue-50/30'}
                                    ${isToday ? 'ring-2 ring-inset ring-blue-400' : ''}
                                    ${conflict ? 'ring-2 ring-inset ring-amber-400' : ''}`
                                }>
                                <div className="flex justify-between items-start">
                                    <span className={`text-sm font-bold leading-none ${isToday ? 'bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center' : weekend ? 'text-red-400' : 'text-slate-600'}`}>
                                        {day}
                                    </span>
                                    {conflict && <AlertTriangle size={12} className="text-amber-500 animate-pulse" />}
                                </div>

                                <div className="mt-1 space-y-0.5 overflow-hidden max-h-[52px]">
                                    {oficiais.slice(0, 2).map(ev => (
                                        <div key={ev.id} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate border ${TIPOS_OFICIAL[ev.tipo]?.bg || 'bg-slate-100'} ${TIPOS_OFICIAL[ev.tipo]?.color || 'text-slate-600'}`}>
                                            {ev.titulo}
                                        </div>
                                    ))}
                                    {internos.slice(0, 2 - oficiais.length).map(ev => (
                                        <div key={ev.id} className="flex items-center gap-1">
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TIPOS_INTERNO[ev.tipo]?.dotColor || 'bg-slate-400'}`} />
                                            <span className="text-[10px] font-medium text-slate-600 truncate">{ev.titulo}</span>
                                        </div>
                                    ))}
                                    {allEvents.length > 2 && (
                                        <span className="text-[9px] text-slate-400 font-bold">+{allEvents.length - 2} mais</span>
                                    )}
                                </div>

                                {/* Hover add */}
                                <button onClick={(e) => { e.stopPropagation(); openNewEvent(dateKey); }}
                                    className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                                    title="Adicionar evento">
                                    <Plus size={12} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detail popover for selected date */}
            {detailDate && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 animate-fade-in print:hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-slate-800">
                            📅 {parseDateStr(detailDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </h4>
                        <div className="flex gap-2">
                            <button onClick={() => openNewEvent(detailDate)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all">
                                <Plus size={14} /> Evento
                            </button>
                            <button onClick={() => setDetailDate(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                    </div>

                    {/* Official events */}
                    {getOficiaisForDate(detailDate).map(ev => {
                        const info = TIPOS_OFICIAL[ev.tipo];
                        const Icon = info?.icon || Info;
                        return (
                            <div key={ev.id} className={`p-3 rounded-xl border mb-2 flex items-center justify-between ${info?.bg || 'bg-slate-50'}`}>
                                <div className="flex items-center gap-3">
                                    <Icon size={18} className={info?.color || 'text-slate-600'} />
                                    <div>
                                        <p className={`text-sm font-bold ${info?.color || ''}`}>{ev.titulo}</p>
                                        <p className="text-[10px] text-slate-400 flex items-center gap-1"><ShieldCheck size={10} /> Evento Oficial SEMED — {info?.label}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteOficial(ev.id)} className="text-slate-400 hover:text-red-500 p-1 transition-colors" title="Excluir oficial">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}

                    {/* Internal events */}
                    {getInternosForDate(detailDate).map(ev => {
                        const info = TIPOS_INTERNO[ev.tipo];
                        const classInfo = CLASSIFICACOES[ev.classificacao];
                        return (
                            <div key={ev.id} className={`p-3 rounded-xl border border-slate-100 mb-2 ${info?.bg || 'bg-slate-50'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${info?.dotColor || 'bg-slate-400'}`} />
                                        <p className="text-sm font-bold text-slate-800">{ev.titulo}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${classInfo?.badge || ''}`}>{classInfo?.label}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEditEvent(ev)} className="p-1 text-slate-400 hover:text-blue-500 transition-colors"><Edit size={14} /></button>
                                        <button onClick={() => handleDelete(ev.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                {ev.descricao && <p className="text-xs text-slate-500 mt-1 ml-5">{ev.descricao}</p>}
                                {ev.responsavel && <p className="text-[10px] text-slate-400 mt-1 ml-5">Responsável: {ev.responsavel}</p>}
                            </div>
                        );
                    })}

                    {getOficiaisForDate(detailDate).length === 0 && getInternosForDate(detailDate).length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">Nenhum evento nesta data.</p>
                    )}
                </div>
            )}

            {/* Sidebar: Month event list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
                {/* Official events list */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h5 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-purple-500" /> Eventos Oficiais — {MESES[currentMonth]}
                    </h5>
                    {monthOficiais.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">Nenhum evento oficial neste mês.</p>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {monthOficiais.map(ev => {
                                const info = TIPOS_OFICIAL[ev.tipo];
                                return (
                                    <div key={ev.id} className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${info?.bg || 'bg-slate-50'}`}>
                                        <span className={`text-xs font-black ${info?.color || ''}`}>
                                            {parseDateStr(ev.data).getDate().toString().padStart(2, '0')}
                                        </span>
                                        <span className={`font-semibold ${info?.color || ''}`}>{ev.titulo}</span>
                                        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold border ${info?.bg || 'bg-slate-100'} ${info?.color || ''}`}>
                                            {info?.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Internal events list */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h5 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
                        <Calendar size={14} className="text-blue-500" /> Eventos Internos — {MESES[currentMonth]}
                    </h5>
                    {monthInternos.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">Nenhum evento interno neste mês.</p>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {monthInternos.map(ev => {
                                const info = TIPOS_INTERNO[ev.tipo];
                                const classInfo = CLASSIFICACOES[ev.classificacao];
                                return (
                                    <div key={ev.id} className="p-3 rounded-xl border border-slate-100 text-sm flex items-center gap-3 hover:bg-slate-50 transition-colors">
                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${info?.dotColor || 'bg-slate-400'}`} />
                                        <span className="text-xs font-black text-slate-400">
                                            {parseDateStr(ev.data).getDate().toString().padStart(2, '0')}
                                        </span>
                                        <span className="font-semibold text-slate-700 truncate">{ev.titulo}</span>
                                        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${classInfo?.badge || ''}`}>
                                            {classInfo?.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ============ MODAL: New/Edit Internal Event ============ */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Calendar size={20} /> {editingEvento ? 'Editar Evento' : 'Novo Evento Interno'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 rounded-xl px-4 py-2 text-sm text-blue-700 font-semibold flex items-center gap-2">
                                <Calendar size={16} /> Data: {parseDateStr(selectedDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título do Evento *</label>
                                <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="Ex: Reunião pedagógica do 1º bimestre" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                    <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                                        {Object.entries(TIPOS_INTERNO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Classificação</label>
                                    <select value={form.classificacao} onChange={e => setForm({ ...form, classificacao: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                                        {Object.entries(CLASSIFICACOES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Final (opcional, para períodos)</label>
                                <input type="date" value={form.data_fim} onChange={e => setForm({ ...form, data_fim: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                                <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 h-20 resize-none"
                                    placeholder="Detalhes do evento..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsável</label>
                                <input type="text" value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="Nome do responsável" />
                            </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
                            <button onClick={() => setShowModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all">
                                {editingEvento ? 'Salvar Alterações' : 'Adicionar Evento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ MODAL: Official Event ============ */}
            {showOficialModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <ShieldCheck size={20} /> Cadastrar Evento Oficial (SEMED)
                            </h3>
                            <button onClick={() => setShowOficialModal(false)} className="text-white/80 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título *</label>
                                <input type="text" value={oficialForm.titulo} onChange={e => setOficialForm({ ...oficialForm, titulo: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                    placeholder="Ex: Carnaval, Recesso Escolar..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                    <select value={oficialForm.tipo} onChange={e => setOficialForm({ ...oficialForm, tipo: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20">
                                        {Object.entries(TIPOS_OFICIAL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ano Letivo</label>
                                    <input type="text" value={oficialForm.ano_letivo} onChange={e => setOficialForm({ ...oficialForm, ano_letivo: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Início *</label>
                                    <input type="date" value={oficialForm.data} onChange={e => setOficialForm({ ...oficialForm, data: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Fim (opcional)</label>
                                    <input type="date" value={oficialForm.data_fim} onChange={e => setOficialForm({ ...oficialForm, data_fim: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="obrigatorio-check" checked={oficialForm.obrigatorio}
                                    onChange={e => setOficialForm({ ...oficialForm, obrigatorio: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                                <label htmlFor="obrigatorio-check" className="text-sm font-medium text-slate-600">
                                    Obrigatório (não pode ser alterado pelas escolas)
                                </label>
                            </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
                            <button onClick={() => setShowOficialModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSaveOficial} className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/20 transition-all">
                                Salvar Evento Oficial
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};
