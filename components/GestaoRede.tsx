import React, { useState, useEffect, useMemo } from 'react';
import { useConfiguracao } from '../context/ConfiguracaoContext';
import { 
    configuracaoService, PeriodoLetivo, HorariosConfig, DEFAULT_HORARIOS_CONFIG, calcularGradeHorarios,
    ItemMatrizCurricular, MatrizCurricularConfig, MatrizesCurricularesRede, DEFAULT_MATRIZES_CURRICULARES,
    calcularTotaisMatriz, formatarCargaComponente, formatarMinutosParaHoras
} from '../services/configuracaoService';
import { useNotification } from '../context/NotificationContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { PrintableMatrizCurricular } from './PrintableMatrizCurricular';
import { logAudit } from '../services/logService';
import { normalizeSubjectName } from '../utils';
import { 
    Sliders, Calendar, BookOpen, GraduationCap, Save, Plus, Trash2, 
    ShieldAlert, Clock, Check, RefreshCw, Edit2, X, Sun, Sunset, Moon, Coffee, Sparkles, Info,
    Printer, RotateCcw, AlertCircle, Award, CheckCircle2, Bookmark
} from 'lucide-react';

export const GestaoRede: React.FC = () => {
    const { configuracao, refreshConfiguracao } = useConfiguracao();
    const { showNotification } = useNotification();

    const [activeTab, setActiveTab] = useState<'metrics' | 'periods' | 'curriculum' | 'infantil' | 'horarios'>('metrics');
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [notaMinima, setNotaMinima] = useState<string>('7.0');
    const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([]);
    const [componentes, setComponentes] = useState<string[]>([]);
    const [campos, setCampos] = useState<string[]>([]);
    const [horariosConfig, setHorariosConfig] = useState<HorariosConfig>(DEFAULT_HORARIOS_CONFIG);

    // Matrizes Curriculares states
    const [matrizes, setMatrizes] = useState<MatrizesCurricularesRede>(DEFAULT_MATRIZES_CURRICULARES);
    const [fundSubTab, setFundSubTab] = useState<'fundamentalIniciais' | 'fundamentalFinais' | 'ejaIniciais' | 'ejaFinais'>('fundamentalIniciais');
    const [printingMatriz, setPrintingMatriz] = useState<MatrizCurricularConfig | null>(null);

    // Item modal states (Add / Edit)
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [itemModalMatrizKey, setItemModalMatrizKey] = useState<keyof MatrizesCurricularesRede | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [modalArea, setModalArea] = useState('');
    const [modalComponente, setModalComponente] = useState('');
    const [modalAulasSemanais, setModalAulasSemanais] = useState<number>(2);
    const [modalDuracaoMinutos, setModalDuracaoMinutos] = useState<number>(50);
    const [modalObservacao, setModalObservacao] = useState('');

    // Horarios preview state
    const [previewTurno, setPreviewTurno] = useState<'matutino' | 'vespertino' | 'noturno'>('matutino');
    const [previewEtapa, setPreviewEtapa] = useState<'educacaoInfantil' | 'anosIniciais' | 'anosFinais'>('anosIniciais');

    // New item inputs (legado)
    const [newComponente, setNewComponente] = useState('');
    const [newCampo, setNewCampo] = useState('');

    // Editing states (legado)
    const [editingComponente, setEditingComponente] = useState<string | null>(null);
    const [editingComponenteValue, setEditingComponenteValue] = useState<string>('');

    const [editingCampo, setEditingCampo] = useState<string | null>(null);
    const [editingCampoValue, setEditingCampoValue] = useState<string>('');

    useEffect(() => {
        if (configuracao) {
            setNotaMinima(configuracao.nota_minima_aprovacao.toString().replace('.', ','));
            setPeriodos(configuracao.periodos_letivos.map(p => ({ ...p })));
            setComponentes([...configuracao.componentes_curriculares]);
            setCampos([...configuracao.campos_experiencia]);
            if (configuracao.horarios_config) {
                setHorariosConfig(JSON.parse(JSON.stringify(configuracao.horarios_config)));
            }
            if (configuracao.matrizes_curriculares) {
                setMatrizes(JSON.parse(JSON.stringify(configuracao.matrizes_curriculares)));
            }
        }
    }, [configuracao]);

    const handleSave = async () => {
        const parsedNota = parseFloat(notaMinima.replace(',', '.'));
        if (isNaN(parsedNota) || parsedNota < 0 || parsedNota > 10) {
            showNotification('error', 'Por favor, informe uma nota mínima válida entre 0 e 10.');
            return;
        }

        setIsSaving(true);
        try {
            // Sincronizar listas legadas a partir das matrizes homologadas para garantir compatibilidade
            const seenCampos = new Set<string>();
            const syncedCampos: string[] = [];
            for (const item of (matrizes.infantil?.itens || [])) {
                const cleaned = item.componente.replace(/\*/g, '').trim().toUpperCase();
                if (cleaned && !seenCampos.has(cleaned)) {
                    seenCampos.add(cleaned);
                    syncedCampos.push(cleaned);
                }
            }

            const allFundItems = [
                ...(matrizes.fundamentalIniciais?.itens || []),
                ...(matrizes.fundamentalFinais?.itens || []),
                ...(matrizes.ejaIniciais?.itens || []),
                ...(matrizes.ejaFinais?.itens || []),
            ];
            const seenComps = new Set<string>();
            const syncedComponentes: string[] = [];
            for (const item of allFundItems) {
                const cleaned = item.componente.replace(/\*/g, '').trim();
                const canonical = normalizeSubjectName(cleaned);
                const lowerKey = canonical.toLowerCase();
                if (canonical && !seenComps.has(lowerKey)) {
                    seenComps.add(lowerKey);
                    syncedComponentes.push(canonical);
                }
            }

            const finalComponentes = syncedComponentes.length > 0
                ? syncedComponentes
                : Array.from(new Set(componentes.map(c => normalizeSubjectName(c)).filter(Boolean)));
            const finalCampos = syncedCampos.length > 0 ? syncedCampos : campos;

            await configuracaoService.saveConfiguracao({
                nota_minima_aprovacao: parsedNota,
                periodos_letivos: periodos,
                componentes_curriculares: finalComponentes,
                campos_experiencia: finalCampos,
                horarios_config: horariosConfig,
                matrizes_curriculares: matrizes
            });

            setComponentes(finalComponentes);
            setCampos(finalCampos);

            await refreshConfiguracao();
            await logAudit('UPDATE', 'GESTAO_REDE', 'config', {
                notaMinima: parsedNota,
                periodosCount: periodos.length,
                componentesCount: finalComponentes.length,
                camposCount: finalCampos.length,
                horariosConfig,
                matrizesCurriculares: matrizes
            });
            showNotification('success', 'Configurações de rede e matrizes curriculares salvas com sucesso!');
        } catch (err: any) {
            console.error('Error saving configuration:', err);
            showNotification('error', err?.message || 'Ocorreu um erro ao salvar as configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePeriodChange = (id: string, field: keyof PeriodoLetivo, value: any) => {
        setPeriodos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    // Matriz Curricular Handlers
    const handleOpenAddItem = (matrizKey: keyof MatrizesCurricularesRede) => {
        const targetMatriz = matrizes[matrizKey];
        setItemModalMatrizKey(matrizKey);
        setEditingItemId(null);
        setModalArea(matrizKey === 'infantil' ? '' : 'LINGUAGENS');
        setModalComponente('');
        setModalAulasSemanais(2);
        setModalDuracaoMinutos(targetMatriz?.duracaoPadraoMinutos || 50);
        setModalObservacao('');
        setItemModalOpen(true);
    };

    const handleOpenEditItem = (matrizKey: keyof MatrizesCurricularesRede, item: ItemMatrizCurricular) => {
        setItemModalMatrizKey(matrizKey);
        setEditingItemId(item.id);
        setModalArea(item.area || '');
        setModalComponente(item.componente);
        setModalAulasSemanais(item.aulasSemanais);
        setModalDuracaoMinutos(item.duracaoMinutos);
        setModalObservacao(item.observacao || '');
        setItemModalOpen(true);
    };

    const handleSaveItemModal = () => {
        if (!itemModalMatrizKey) return;
        const compClean = modalComponente.trim();
        if (!compClean) {
            showNotification('warning', 'O nome do componente ou campo de experiência é obrigatório.');
            return;
        }
        if (modalAulasSemanais <= 0) {
            showNotification('warning', 'A quantidade de aulas semanais deve ser maior que zero.');
            return;
        }

        setMatrizes(prev => {
            const currentMatriz = prev[itemModalMatrizKey];
            let newItens: ItemMatrizCurricular[];

            if (editingItemId) {
                newItens = currentMatriz.itens.map(it => {
                    if (it.id === editingItemId) {
                        return {
                            ...it,
                            area: itemModalMatrizKey === 'infantil' ? undefined : (modalArea.trim() || undefined),
                            componente: compClean,
                            aulasSemanais: Number(modalAulasSemanais),
                            duracaoMinutos: Number(modalDuracaoMinutos) || currentMatriz.duracaoPadraoMinutos || 50,
                            observacao: modalObservacao.trim() || undefined,
                        };
                    }
                    return it;
                });
            } else {
                const newItem: ItemMatrizCurricular = {
                    id: `${itemModalMatrizKey}-${Date.now()}`,
                    area: itemModalMatrizKey === 'infantil' ? undefined : (modalArea.trim() || undefined),
                    componente: compClean,
                    aulasSemanais: Number(modalAulasSemanais),
                    duracaoMinutos: Number(modalDuracaoMinutos) || currentMatriz.duracaoPadraoMinutos || 50,
                    observacao: modalObservacao.trim() || undefined,
                };
                newItens = [...currentMatriz.itens, newItem];
            }

            return {
                ...prev,
                [itemModalMatrizKey]: {
                    ...currentMatriz,
                    itens: newItens
                }
            };
        });

        showNotification('success', editingItemId ? 'Item da matriz atualizado com sucesso!' : 'Novo item incluído na matriz curricular!');
        setItemModalOpen(false);
    };

    const handleDeleteItem = (matrizKey: keyof MatrizesCurricularesRede, itemId: string) => {
        if (!window.confirm('Tem certeza que deseja remover este item da matriz curricular?')) return;
        setMatrizes(prev => ({
            ...prev,
            [matrizKey]: {
                ...prev[matrizKey],
                itens: prev[matrizKey].itens.filter(i => i.id !== itemId)
            }
        }));
        showNotification('success', 'Item removido da matriz.');
    };

    const handleRestoreDefaultMatriz = (matrizKey: keyof MatrizesCurricularesRede) => {
        const defaultMatriz = DEFAULT_MATRIZES_CURRICULARES[matrizKey];
        if (window.confirm(`Deseja restaurar a matriz "${defaultMatriz.titulo}" para o padrão oficial homologado?`)) {
            setMatrizes(prev => ({
                ...prev,
                [matrizKey]: JSON.parse(JSON.stringify(defaultMatriz))
            }));
            showNotification('success', 'Matriz curricular restaurada para a estrutura oficial da BNCC.');
        }
    };

    const handleAddComponente = () => {
        const cleaned = newComponente.trim();
        if (!cleaned) return;
        if (componentes.includes(cleaned)) {
            showNotification('warning', 'Este componente curricular já existe.');
            return;
        }
        setComponentes(prev => [...prev, cleaned]);
        setNewComponente('');
    };

    const handleRemoveComponente = (comp: string) => {
        setComponentes(prev => prev.filter(c => c !== comp));
    };

    const handleAddCampo = () => {
        const cleaned = newCampo.trim().toUpperCase();
        if (!cleaned) return;
        if (campos.includes(cleaned)) {
            showNotification('warning', 'Este campo de experiência já existe.');
            return;
        }
        setCampos(prev => [...prev, cleaned]);
        setNewCampo('');
    };

    const handleRemoveCampo = (campo: string) => {
        setCampos(prev => prev.filter(c => c !== campo));
    };

    // Componente Edit Handlers (legado)
    const handleStartEditComponente = (comp: string) => {
        setEditingComponente(comp);
        setEditingComponenteValue(comp);
    };

    const handleSaveEditComponente = (oldVal: string) => {
        const cleaned = editingComponenteValue.trim();
        if (!cleaned) {
            showNotification('warning', 'O nome do componente não pode ficar em branco.');
            return;
        }
        if (cleaned !== oldVal && componentes.includes(cleaned)) {
            showNotification('warning', 'Este componente curricular já existe.');
            return;
        }
        setComponentes(prev => prev.map(c => c === oldVal ? cleaned : c));
        setEditingComponente(null);
        setEditingComponenteValue('');
    };

    const handleCancelEditComponente = () => {
        setEditingComponente(null);
        setEditingComponenteValue('');
    };

    // Campo de Experiencia Edit Handlers (legado)
    const handleStartEditCampo = (campo: string) => {
        setEditingCampo(campo);
        setEditingCampoValue(campo);
    };

    const handleSaveEditCampo = (oldVal: string) => {
        const cleaned = editingCampoValue.trim();
        if (!cleaned) {
            showNotification('warning', 'O nome do campo de experiência não pode ficar em branco.');
            return;
        }
        if (cleaned !== oldVal && campos.includes(cleaned)) {
            showNotification('warning', 'Este campo de experiência já existe.');
            return;
        }
        setCampos(prev => prev.map(c => c === oldVal ? cleaned : c));
        setEditingCampo(null);
        setEditingCampoValue('');
    };

    const handleCancelEditCampo = () => {
        setEditingCampo(null);
        setEditingCampoValue('');
    };

    const handleTurnoChange = (turnoKey: 'matutino' | 'vespertino' | 'noturno', field: string, value: any) => {
        setHorariosConfig(prev => ({
            ...prev,
            turnos: {
                ...prev.turnos,
                [turnoKey]: {
                    ...prev.turnos[turnoKey],
                    [field]: value
                }
            }
        }));
    };

    const handleDuracaoAulaChange = (etapaKey: 'educacaoInfantil' | 'anosIniciais' | 'anosFinais', value: number) => {
        setHorariosConfig(prev => ({
            ...prev,
            duracaoAulas: {
                ...prev.duracaoAulas,
                [etapaKey]: value
            }
        }));

        // Sincronizar com a duração padrão da respectiva matriz curricular
        setMatrizes(prev => {
            const copy = { ...prev };
            if (etapaKey === 'educacaoInfantil' && copy.infantil) {
                copy.infantil = { ...copy.infantil, duracaoPadraoMinutos: value };
            } else if (etapaKey === 'anosIniciais' && copy.fundamentalIniciais) {
                copy.fundamentalIniciais = { ...copy.fundamentalIniciais, duracaoPadraoMinutos: value };
            } else if (etapaKey === 'anosFinais' && copy.fundamentalFinais) {
                copy.fundamentalFinais = { ...copy.fundamentalFinais, duracaoPadraoMinutos: value };
            }
            return copy;
        });
    };

    const handleSincronizarDuracaoMatriz = () => {
        setHorariosConfig(prev => ({
            ...prev,
            duracaoAulas: {
                educacaoInfantil: 50,
                anosIniciais: 50,
                anosFinais: 50
            }
        }));
        setMatrizes(prev => ({
            ...prev,
            infantil: { ...prev.infantil, duracaoPadraoMinutos: 50 },
            fundamentalIniciais: { ...prev.fundamentalIniciais, duracaoPadraoMinutos: 50 },
            fundamentalFinais: { ...prev.fundamentalFinais, duracaoPadraoMinutos: 50 }
        }));
        showNotification('success', 'Duração das aulas sincronizada para 50 minutos, em total conformidade com a Matriz Curricular!');
    };

    const previewSlots = useMemo(() => {
        const turnoConfig = horariosConfig.turnos[previewTurno];
        const duracao = horariosConfig.duracaoAulas[previewEtapa];
        return calcularGradeHorarios(turnoConfig, duracao);
    }, [horariosConfig, previewTurno, previewEtapa]);

    const totalMinutosTurno = useMemo(() => {
        if (previewSlots.length === 0) return 0;
        const first = previewSlots[0];
        const last = previewSlots[previewSlots.length - 1];
        const [h1, m1] = first.inicio.split(':').map(Number);
        const [h2, m2] = last.fim.split(':').map(Number);
        return (h2 * 60 + m2) - (h1 * 60 + m1);
    }, [previewSlots]);

    const totalHorasStr = useMemo(() => {
        const h = Math.floor(totalMinutosTurno / 60);
        const m = totalMinutosTurno % 60;
        return `${h}h${m > 0 ? ` ${m}min` : ''}`;
    }, [totalMinutosTurno]);

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">CONFIGURAÇÕES DA REDE</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Parametrização global de notas, períodos, diários e horários</p>
                </div>
                <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-brand-orange hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/10 font-bold text-xs py-3 px-6 flex items-center gap-2 transition-all hover:scale-102"
                >
                    {isSaving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    SALVAR TODAS AS ALTERAÇÕES
                </Button>
            </div>

            {/* Layout tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Tabs Panel */}
                <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('metrics')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-xs uppercase tracking-wider transition-all ${
                            activeTab === 'metrics' 
                                ? 'bg-slate-900 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        <Sliders size={16} />
                        Métricas de Aprovação
                    </button>
                    <button
                        onClick={() => setActiveTab('periods')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-xs uppercase tracking-wider transition-all ${
                            activeTab === 'periods' 
                                ? 'bg-slate-900 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        <Calendar size={16} />
                        Períodos Letivos
                    </button>
                    <button
                        onClick={() => setActiveTab('curriculum')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-xs uppercase tracking-wider transition-all ${
                            activeTab === 'curriculum' 
                                ? 'bg-slate-900 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        <BookOpen size={16} />
                        Ensino Fundamental
                    </button>
                    <button
                        onClick={() => setActiveTab('infantil')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-xs uppercase tracking-wider transition-all ${
                            activeTab === 'infantil' 
                                ? 'bg-slate-900 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        <GraduationCap size={16} />
                        Educação Infantil
                    </button>
                    <button
                        onClick={() => setActiveTab('horarios')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-xs uppercase tracking-wider transition-all ${
                            activeTab === 'horarios' 
                                ? 'bg-slate-900 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        <Clock size={16} />
                        Horários e Turnos
                    </button>
                </div>

                {/* Content Panel */}
                <div className="lg:col-span-9 space-y-6">
                    {/* Metricas */}
                    {activeTab === 'metrics' && (
                        <Card className="bg-white border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Métricas de Aprovação</h3>
                                <p className="text-xs text-slate-400 font-medium">Definição do rendimento escolar mínimo para aprovação dos estudantes na rede escolar.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Média Mínima para Aprovação</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={notaMinima}
                                            onChange={e => {
                                                const val = e.target.value.replace('.', ',');
                                                if (/^\d*,?\d{0,2}$/.test(val)) setNotaMinima(val);
                                            }}
                                            placeholder="7,00"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-lg font-black focus:ring-2 focus:ring-indigo-500/10 focus:border-brand-orange outline-none transition-all"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">PONTOS</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-start gap-4">
                                    <ShieldAlert className="w-6 h-6 text-brand-orange shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase">Impacto nas Pautas de Notas</h4>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            A alteração deste valor modificará dinamicamente o status de aprovação de todos os alunos da rede escolar nas planilhas, boletins e conselhos de classe.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Periodos Letivos */}
                    {activeTab === 'periods' && (
                        <Card className="bg-white border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Períodos Letivos</h3>
                                <p className="text-xs text-slate-400 font-medium">Controle de datas de início e término de cada bimestre e bloqueio manual para novos lançamentos.</p>
                            </div>

                            <div className="space-y-4">
                                {periodos.map((p) => (
                                    <div key={p.id} className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800">{p.nome}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Lançamento de diários</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Início</label>
                                                <input 
                                                    type="date"
                                                    value={p.inicio}
                                                    onChange={e => handlePeriodChange(p.id, 'inicio', e.target.value)}
                                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Término</label>
                                                <input 
                                                    type="date"
                                                    value={p.fim}
                                                    onChange={e => handlePeriodChange(p.id, 'fim', e.target.value)}
                                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 pt-4 md:pt-0">
                                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={p.bloqueado}
                                                        onChange={e => handlePeriodChange(p.id, 'bloqueado', e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                                                    <span className="ml-2 text-xs font-black text-slate-500 uppercase peer-checked:text-rose-600">Bloquear</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Ensino Fundamental */}
                    {activeTab === 'curriculum' && (() => {
                        const currentMatriz = matrizes[fundSubTab] || DEFAULT_MATRIZES_CURRICULARES.fundamentalIniciais;
                        const fundTotais = calcularTotaisMatriz(currentMatriz);
                        const isSemestral = currentMatriz.tipoPeriodo === 'semestral';

                        const getAreaBadgeColor = (area?: string) => {
                            const a = (area || '').toUpperCase();
                            if (a.includes('LINGUA') || a.includes('ARTE') || a.includes('EDUCAÇÃO FÍSICA') || a.includes('INGL')) {
                                return 'bg-blue-50 text-blue-700 border-blue-200';
                            }
                            if (a.includes('MATEM')) {
                                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            }
                            if (a.includes('NATUREZA') || a.includes('CIÊNCIAS') || a.includes('CIENCIAS')) {
                                return 'bg-cyan-50 text-cyan-700 border-cyan-200';
                            }
                            if (a.includes('HUMANAS') || a.includes('HIST') || a.includes('GEOG')) {
                                return 'bg-amber-50 text-amber-700 border-amber-200';
                            }
                            if (a.includes('RELIG')) {
                                return 'bg-purple-50 text-purple-700 border-purple-200';
                            }
                            return 'bg-slate-100 text-slate-700 border-slate-200';
                        };

                        return (
                            <div className="space-y-6">
                                {/* Sub-tabs Navigation */}
                                <div className="bg-white border border-slate-100 p-2 rounded-2xl shadow-sm flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setFundSubTab('fundamentalIniciais')}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                            fundSubTab === 'fundamentalIniciais'
                                                ? 'bg-slate-900 text-white shadow-md'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        1º ao 5º Ano (Anos Iniciais)
                                    </button>
                                    <button
                                        onClick={() => setFundSubTab('fundamentalFinais')}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                            fundSubTab === 'fundamentalFinais'
                                                ? 'bg-slate-900 text-white shadow-md'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        6º ao 9º Ano (Anos Finais)
                                    </button>
                                    <button
                                        onClick={() => setFundSubTab('ejaIniciais')}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                            fundSubTab === 'ejaIniciais'
                                                ? 'bg-brand-orange text-white shadow-md'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <Bookmark className="w-3.5 h-3.5" />
                                        EJA Iniciais (2 Semestres)
                                    </button>
                                    <button
                                        onClick={() => setFundSubTab('ejaFinais')}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                            fundSubTab === 'ejaFinais'
                                                ? 'bg-brand-orange text-white shadow-md'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <Bookmark className="w-3.5 h-3.5" />
                                        EJA Finais (4 Semestres)
                                    </button>
                                </div>

                                {/* Matrix Header & Actions */}
                                <Card className="bg-white border-slate-100 p-6 rounded-3xl shadow-sm space-y-5">
                                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-50 text-brand-orange border border-orange-200">
                                                    {isSemestral ? 'Regime Semestral' : 'Regime Anual'}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                                                    BNCC Homologada
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mt-2">
                                                {currentMatriz.titulo}
                                            </h3>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                {currentMatriz.subtitulo || 'Estrutura curricular e distribuição de carga horária por área de conhecimento.'}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                onClick={() => setPrintingMatriz(currentMatriz)}
                                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-sm"
                                            >
                                                <Printer className="w-3.5 h-3.5 text-brand-orange" />
                                                Imprimir Matriz
                                            </Button>
                                            <Button
                                                onClick={() => handleRestoreDefaultMatriz(fundSubTab)}
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs px-3.5 py-2 flex items-center gap-1.5"
                                                title="Restaurar valores de fábrica desta matriz"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                Restaurar Padrão
                                            </Button>
                                            <Button
                                                onClick={() => handleOpenAddItem(fundSubTab)}
                                                className="bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-1.5 shadow-md shadow-orange-500/10"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Adicionar Componente
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Parameter Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                Dias Letivos
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-black text-slate-800">
                                                    {currentMatriz.diasLetivos}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">dias</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                {isSemestral ? 'Semanas no Semestre' : 'Semanas no Ano'}
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-black text-slate-800">
                                                    {currentMatriz.semanasPeriodo}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">semanas</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                Aulas por Dia
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-black text-slate-800">
                                                    {currentMatriz.aulasDia}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">aulas/dia</span>
                                            </div>
                                        </div>

                                        <div className="bg-orange-50/60 border border-orange-200/60 rounded-2xl p-4">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange block">
                                                Carga Horária Total
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-black text-slate-900 font-mono">
                                                    {fundTotais.horasFormatadas}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">horas</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Table Card */}
                                <Card className="bg-white border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                                                    <th className="px-5 py-3.5">Área do Conhecimento</th>
                                                    <th className="px-5 py-3.5">Componente Curricular</th>
                                                    <th className="px-4 py-3.5 text-center">Aula Semanal</th>
                                                    <th className="px-4 py-3.5 text-center">
                                                        {isSemestral ? 'Aulas Semestrais' : 'Aulas Anuais'}
                                                    </th>
                                                    <th className="px-4 py-3.5 text-center">Carga Horária Comp.</th>
                                                    <th className="px-4 py-3.5 text-center">Horas Totais</th>
                                                    <th className="px-5 py-3.5 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {currentMatriz.itens.map((item, idx) => {
                                                    const itemSemanais = Number(item.aulasSemanais) || 0;
                                                    const itemTotais = itemSemanais * currentMatriz.semanasPeriodo;
                                                    const itemDuracao = Number(item.duracaoMinutos) || currentMatriz.duracaoPadraoMinutos || 50;
                                                    const itemMinutos = itemTotais * itemDuracao;
                                                    const cargaComp = formatarCargaComponente(itemDuracao);
                                                    const horasFormatadas = formatarMinutosParaHoras(itemMinutos);

                                                    return (
                                                        <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-5 py-3.5">
                                                                <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getAreaBadgeColor(item.area)}`}>
                                                                    {item.area || 'GERAL'}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3.5 font-bold text-slate-800 uppercase tracking-tight">
                                                                <span>{item.componente}</span>
                                                                {item.observacao && (
                                                                    <span className="text-brand-orange font-black ml-1 text-sm">{item.observacao}</span>
                                                                )}
                                                                {item.duracaoMinutos !== currentMatriz.duracaoPadraoMinutos && (
                                                                    <span className="ml-2 text-[10px] font-semibold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                                                        {item.duracaoMinutos} min
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 font-black text-slate-800">
                                                                    {itemSemanais}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                                                                {itemTotais}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center font-mono font-semibold text-slate-600">
                                                                {cargaComp}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center font-mono font-black text-slate-900">
                                                                {horasFormatadas}
                                                            </td>
                                                            <td className="px-5 py-3.5 text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <button
                                                                        onClick={() => handleOpenEditItem(fundSubTab, item)}
                                                                        className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-all"
                                                                        title="Editar componente"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteItem(fundSubTab, item.id)}
                                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                        title="Excluir componente"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-100/80 border-t-2 border-slate-200 text-slate-900 font-black">
                                                    <td colSpan={2} className="px-5 py-4 uppercase tracking-wider text-right font-black text-xs">
                                                        TOTAL GERAL DA MATRIZ:
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs">
                                                            {fundTotais.aulasSemanais}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-sm font-black text-slate-900">
                                                        {fundTotais.aulasTotais}
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-mono text-slate-400">
                                                        —
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-mono text-sm font-black text-slate-900">
                                                        {fundTotais.horasFormatadas}
                                                    </td>
                                                    <td className="px-5 py-4"></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {/* Footnotes alert */}
                                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-start gap-3 text-xs text-slate-500">
                                        <Info className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-slate-700">
                                                * Observação de Carga Horária Diferenciada:
                                            </p>
                                            <p className="mt-0.5">
                                                Componentes assinalados com asterisco (*) possuem duração de aula de 40 minutos para adequação exata ao total legal de 800 horas anuais nos Anos Iniciais do Ensino Fundamental.
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        );
                    })()}

                    {/* Educacao Infantil */}
                    {activeTab === 'infantil' && (() => {
                        const infantilMatriz = matrizes.infantil || DEFAULT_MATRIZES_CURRICULARES.infantil;
                        const infantilTotais = calcularTotaisMatriz(infantilMatriz);

                        return (
                            <div className="space-y-6">
                                {/* Header Card */}
                                <Card className="bg-white border-slate-100 p-6 rounded-3xl shadow-sm space-y-5">
                                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-50 text-brand-orange border border-orange-200">
                                                    Regime Anual
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                                                    BNCC – 5 Campos de Experiência
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mt-2">
                                                {infantilMatriz.titulo}
                                            </h3>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                {infantilMatriz.subtitulo || 'Estrutura curricular e distribuição de carga horária para Creche e Pré-Escola.'}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                onClick={() => setPrintingMatriz(infantilMatriz)}
                                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-sm"
                                            >
                                                <Printer className="w-3.5 h-3.5 text-brand-orange" />
                                                Imprimir Matriz
                                            </Button>
                                            <Button
                                                onClick={() => handleRestoreDefaultMatriz('infantil')}
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs px-3.5 py-2 flex items-center gap-1.5"
                                                title="Restaurar padrão oficial da Educação Infantil"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                Restaurar Padrão
                                            </Button>
                                            <Button
                                                onClick={() => handleOpenAddItem('infantil')}
                                                className="bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-1.5 shadow-md shadow-orange-500/10"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Adicionar Campo
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Parameter Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                Dias Letivos
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-black text-slate-800">
                                                    {infantilMatriz.diasLetivos}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">dias</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                Semanas no Ano
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-black text-slate-800">
                                                    {infantilMatriz.semanasPeriodo}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">semanas</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                                Aulas por Dia
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-black text-slate-800">
                                                    {infantilMatriz.aulasDia}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">aulas/dia</span>
                                            </div>
                                        </div>

                                        <div className="bg-orange-50/60 border border-orange-200/60 rounded-2xl p-4">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange block">
                                                Carga Horária Total
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-black text-slate-900 font-mono">
                                                    {infantilTotais.horasFormatadas}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">horas</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Table Card */}
                                <Card className="bg-white border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                                                    <th className="px-5 py-3.5">Campos de Experiência (BNCC)</th>
                                                    <th className="px-4 py-3.5 text-center">Aula Semanal</th>
                                                    <th className="px-4 py-3.5 text-center">Aulas Anuais</th>
                                                    <th className="px-4 py-3.5 text-center">Carga Horária Comp.</th>
                                                    <th className="px-4 py-3.5 text-center">Horas Totais</th>
                                                    <th className="px-5 py-3.5 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {infantilMatriz.itens.map((item, idx) => {
                                                    const itemSemanais = Number(item.aulasSemanais) || 0;
                                                    const itemTotais = itemSemanais * infantilMatriz.semanasPeriodo;
                                                    const itemDuracao = Number(item.duracaoMinutos) || infantilMatriz.duracaoPadraoMinutos || 50;
                                                    const itemMinutos = itemTotais * itemDuracao;
                                                    const cargaComp = formatarCargaComponente(itemDuracao);
                                                    const horasFormatadas = formatarMinutosParaHoras(itemMinutos);

                                                    return (
                                                        <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-5 py-3.5 font-bold text-slate-800 uppercase tracking-tight">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-brand-orange shrink-0"></span>
                                                                    <span>{item.componente}</span>
                                                                    {item.observacao && (
                                                                        <span className="text-brand-orange font-black ml-1 text-sm">{item.observacao}</span>
                                                                    )}
                                                                    {item.duracaoMinutos !== infantilMatriz.duracaoPadraoMinutos && (
                                                                        <span className="ml-2 text-[10px] font-semibold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                                                            {item.duracaoMinutos} min
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 font-black text-slate-800">
                                                                    {itemSemanais}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                                                                {itemTotais}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center font-mono font-semibold text-slate-600">
                                                                {cargaComp}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center font-mono font-black text-slate-900">
                                                                {horasFormatadas}
                                                            </td>
                                                            <td className="px-5 py-3.5 text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <button
                                                                        onClick={() => handleOpenEditItem('infantil', item)}
                                                                        className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-all"
                                                                        title="Editar campo de experiência"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteItem('infantil', item.id)}
                                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                        title="Excluir campo de experiência"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-100/80 border-t-2 border-slate-200 text-slate-900 font-black">
                                                    <td className="px-5 py-4 uppercase tracking-wider text-right font-black text-xs">
                                                        TOTAL GERAL DA MATRIZ:
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs">
                                                            {infantilTotais.aulasSemanais}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-sm font-black text-slate-900">
                                                        {infantilTotais.aulasTotais}
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-mono text-slate-400">
                                                        —
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-mono text-sm font-black text-slate-900">
                                                        {infantilTotais.horasFormatadas}
                                                    </td>
                                                    <td className="px-5 py-4"></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {/* Footnotes alert */}
                                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-start gap-3 text-xs text-slate-500">
                                        <Info className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-slate-700">
                                                * Duração Diferenciada do Campo "Corpo, Gestos e Movimentos":
                                            </p>
                                            <p className="mt-0.5">
                                                Com duração de aula de 40 minutos (em vez de 50 minutos), este campo totaliza 133h20 anuais que, somadas aos outros 4 campos de 50 min (100h + 233h20 + 100h + 233h20 = 666h40), totalizam com precisão matemática as 800 horas anuais obrigatórias pela LDB (Lei nº 9.394/1996).
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        );
                    })()}

                    {/* Horarios e Turnos */}
                    {activeTab === 'horarios' && (
                        <div className="space-y-6">
                            {/* Header Card */}
                            <Card className="bg-white border-slate-100 p-6 rounded-3xl shadow-sm space-y-3">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-brand-orange" />
                                            Horários, Intervalos e Duração de Aulas
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                                            Parametrização do horário de início dos turnos, duração do intervalo e tempo de aula por etapa de ensino.
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-brand-orange border border-orange-200 shrink-0">
                                        <Sparkles className="w-3.5 h-3.5" /> Vinculado ao Quadro Docente
                                    </span>
                                </div>
                            </Card>

                            {/* 1. Duração das Aulas por Etapa */}
                            <Card className="bg-white border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-50 text-brand-orange border border-orange-200">
                                                Matriz Curricular Integrada
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mt-1.5">
                                            <BookOpen className="w-4 h-4 text-indigo-600" />
                                            Tempo de Cada Aula por Etapa de Ensino
                                        </h4>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                                            Definição do tempo padrão de aula (em minutos) compatibilizado com a distribuição de carga horária da Matriz Curricular.
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={handleSincronizarDuracaoMatriz}
                                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-sm self-start sm:self-auto shrink-0"
                                        title="Redefinir todas as etapas para o tempo padrão de 50 minutos da Matriz Curricular"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 text-brand-orange" />
                                        Sincronizar com a Matriz (50 min)
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {/* Educacao Infantil */}
                                    <div className="p-5 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-4 hover:border-purple-300 transition-all flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 font-bold">
                                                    <GraduationCap size={18} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md">
                                                    Creche & Pré
                                                </span>
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">Educação Infantil</h5>
                                                <p className="text-[10px] text-slate-400 font-medium">Duração padrão de cada aula</p>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={20}
                                                    max={120}
                                                    step={5}
                                                    value={horariosConfig.duracaoAulas.educacaoInfantil}
                                                    onChange={e => handleDuracaoAulaChange('educacaoInfantil', Math.max(15, Number(e.target.value)))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                                />
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                                                    MINUTOS
                                                </span>
                                            </div>

                                            {/* Status Badge de compatibilidade */}
                                            {horariosConfig.duracaoAulas.educacaoInfantil === 50 ? (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span>Compatível com Matriz (800h anuais)</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                                                    <div className="flex items-center gap-1">
                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                        <span>Diverge da Matriz (50 min)</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDuracaoAulaChange('educacaoInfantil', 50)}
                                                        className="underline font-black text-brand-orange hover:text-orange-700"
                                                    >
                                                        Ajustar para 50 min
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Detalhamento da Matriz Curricular */}
                                        <div className="pt-3 border-t border-slate-200/60 space-y-1.5 text-[11px] bg-white/70 p-3 rounded-xl border border-slate-100">
                                            <div className="flex justify-between text-slate-600">
                                                <span>Duração Padrão:</span>
                                                <strong className="text-slate-800 font-bold">50 min (4 campos)</strong>
                                            </div>
                                            <div className="flex justify-between text-brand-orange">
                                                <span>Duração Diferenciada (*):</span>
                                                <strong className="font-bold">40 min (Corpo e Gestos)</strong>
                                            </div>
                                            <div className="flex justify-between text-slate-700 pt-1.5 border-t border-dashed border-slate-200">
                                                <span>Carga Horária Total:</span>
                                                <strong className="text-slate-900 font-black font-mono">800:00:00 h</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Anos Iniciais */}
                                    <div className="p-5 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-4 hover:border-emerald-300 transition-all flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
                                                    <BookOpen size={18} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                                                    1º ao 5º Ano
                                                </span>
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">Anos Iniciais</h5>
                                                <p className="text-[10px] text-slate-400 font-medium">Duração padrão de cada aula</p>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={20}
                                                    max={120}
                                                    step={5}
                                                    value={horariosConfig.duracaoAulas.anosIniciais}
                                                    onChange={e => handleDuracaoAulaChange('anosIniciais', Math.max(15, Number(e.target.value)))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                />
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                                                    MINUTOS
                                                </span>
                                            </div>

                                            {/* Status Badge de compatibilidade */}
                                            {horariosConfig.duracaoAulas.anosIniciais === 50 ? (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span>Compatível com Matriz (800h anuais)</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                                                    <div className="flex items-center gap-1">
                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                        <span>Diverge da Matriz (50 min)</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDuracaoAulaChange('anosIniciais', 50)}
                                                        className="underline font-black text-brand-orange hover:text-orange-700"
                                                    >
                                                        Ajustar para 50 min
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Detalhamento da Matriz Curricular */}
                                        <div className="pt-3 border-t border-slate-200/60 space-y-1.5 text-[11px] bg-white/70 p-3 rounded-xl border border-slate-100">
                                            <div className="flex justify-between text-slate-600">
                                                <span>Duração Padrão:</span>
                                                <strong className="text-slate-800 font-bold">50 min (5 componentes)</strong>
                                            </div>
                                            <div className="flex justify-between text-brand-orange">
                                                <span>Duração Diferenciada (*):</span>
                                                <strong className="font-bold">40 min (Arte, Geog, Ens. Rel)</strong>
                                            </div>
                                            <div className="flex justify-between text-slate-700 pt-1.5 border-t border-dashed border-slate-200">
                                                <span>Carga Horária Total:</span>
                                                <strong className="text-slate-900 font-black font-mono">800:00:00 h</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Anos Finais */}
                                    <div className="p-5 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-4 hover:border-orange-300 transition-all flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-brand-orange font-bold">
                                                    <BookOpen size={18} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md">
                                                    6º ao 9º Ano
                                                </span>
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">Anos Finais</h5>
                                                <p className="text-[10px] text-slate-400 font-medium">Duração padrão de cada aula</p>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={20}
                                                    max={120}
                                                    step={5}
                                                    value={horariosConfig.duracaoAulas.anosFinais}
                                                    onChange={e => handleDuracaoAulaChange('anosFinais', Math.max(15, Number(e.target.value)))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                                                />
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                                                    MINUTOS
                                                </span>
                                            </div>

                                            {/* Status Badge de compatibilidade */}
                                            {horariosConfig.duracaoAulas.anosFinais === 50 ? (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span>Compatível com Matriz (833h20 anuais)</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                                                    <div className="flex items-center gap-1">
                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                        <span>Diverge da Matriz (50 min)</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDuracaoAulaChange('anosFinais', 50)}
                                                        className="underline font-black text-brand-orange hover:text-orange-700"
                                                    >
                                                        Ajustar para 50 min
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Detalhamento da Matriz Curricular */}
                                        <div className="pt-3 border-t border-slate-200/60 space-y-1.5 text-[11px] bg-white/70 p-3 rounded-xl border border-slate-100">
                                            <div className="flex justify-between text-slate-600">
                                                <span>Duração Padrão:</span>
                                                <strong className="text-slate-800 font-bold">50 min (9 componentes)</strong>
                                            </div>
                                            <div className="flex justify-between text-slate-400">
                                                <span>Duração Diferenciada:</span>
                                                <span className="font-medium">Sem diferenciação</span>
                                            </div>
                                            <div className="flex justify-between text-slate-700 pt-1.5 border-t border-dashed border-slate-200">
                                                <span>Carga Horária Total:</span>
                                                <strong className="text-slate-900 font-black font-mono">833:20:00 h</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Banner explicativo de conformidade com a Matriz Curricular */}
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-start gap-3.5 text-xs text-slate-600">
                                    <Sparkles className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-800">
                                            Distribuição da Carga Horária e Integração com a Matriz Curricular:
                                        </p>
                                        <p className="text-slate-500 leading-relaxed">
                                            O tempo de <strong>50 minutos</strong> é a referência oficial para o sinal e organização semanal da grade horária nas escolas municipais. Nas matrizes da <strong>Educação Infantil</strong> e dos <strong>Anos Iniciais</strong>, os componentes assinalados com asterisco (*) possuem carga horária de <strong>40 minutos</strong>, o que equaliza com exatidão matemática a exigência legal de <strong>800 horas anuais</strong> em 200 dias letivos (LDB nº 9.394/96). Nos <strong>Anos Finais</strong>, a totalidade em 50 minutos assegura <strong>833h20 anuais</strong>.
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* 2. Horário de Início e Intervalo por Turno */}
                            <Card className="bg-white border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
                                <div className="border-b border-slate-100 pb-3">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-500" />
                                        Horário de Início e Intervalo por Turno
                                    </h4>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                                        Configure o horário de início das aulas, a duração do intervalo (recreio) e o número de aulas para cada turno.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Matutino */}
                                    <div className="p-5 border border-amber-200 bg-amber-50/20 rounded-2xl space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                                                <Sun size={18} />
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">Turno Matutino</h5>
                                                <span className="text-[10px] text-amber-700 font-bold uppercase">Manhã</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                                    Início das Aulas
                                                </label>
                                                <input
                                                    type="time"
                                                    value={horariosConfig.turnos.matutino.inicio}
                                                    onChange={e => handleTurnoChange('matutino', 'inicio', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                                    Duração do Intervalo
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={60}
                                                        step={5}
                                                        value={horariosConfig.turnos.matutino.duracaoIntervalo}
                                                        onChange={e => handleTurnoChange('matutino', 'duracaoIntervalo', Number(e.target.value))}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                                                        MIN
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                                    Intervalo Após
                                                </label>
                                                <select
                                                    value={horariosConfig.turnos.matutino.intervaloAposAula}
                                                    onChange={e => handleTurnoChange('matutino', 'intervaloAposAula', Number(e.target.value))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                >
                                                    <option value={1}>Após a 1ª Aula</option>
                                                    <option value={2}>Após a 2ª Aula</option>
                                                    <option value={3}>Após a 3ª Aula</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                                    Total de Aulas no Turno
                                                </label>
                                                <select
                                                    value={horariosConfig.turnos.matutino.aulasPorTurno}
                                                    onChange={e => handleTurnoChange('matutino', 'aulasPorTurno', Number(e.target.value))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                >
                                                    <option value={4}>4 Aulas</option>
                                                    <option value={5}>5 Aulas</option>
                                                    <option value={6}>6 Aulas</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vespertino */}
                                    <div className="p-5 border border-orange-200 bg-orange-50/20 rounded-2xl space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-orange-100 text-orange-700 rounded-xl flex items-center justify-center">
                                                <Sunset size={18} />
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">Turno Vespertino</h5>
                                                <span className="text-[10px] text-orange-700 font-bold uppercase">Tarde</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                                    Início das Aulas
                                                </label>
                                                <input
                                                    type="time"
                                                    value={horariosConfig.turnos.vespertino.inicio}
                                                    onChange={e => handleTurnoChange('vespertino', 'inicio', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                                    Duração do Intervalo
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={60}
                                                        step={5}
                                                        value={horariosConfig.turnos.vespertino.duracaoIntervalo}
                                                        onChange={e => handleTurnoChange('vespertino', 'duracaoIntervalo', Number(e.target.value))}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                                                        MIN
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                                    Intervalo Após
                                                </label>
                                                <select
                                                    value={horariosConfig.turnos.vespertino.intervaloAposAula}
                                                    onChange={e => handleTurnoChange('vespertino', 'intervaloAposAula', Number(e.target.value))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                >
                                                    <option value={1}>Após a 1ª Aula</option>
                                                    <option value={2}>Após a 2ª Aula</option>
                                                    <option value={3}>Após a 3ª Aula</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                                    Total de Aulas no Turno
                                                </label>
                                                <select
                                                    value={horariosConfig.turnos.vespertino.aulasPorTurno}
                                                    onChange={e => handleTurnoChange('vespertino', 'aulasPorTurno', Number(e.target.value))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                >
                                                    <option value={4}>4 Aulas</option>
                                                    <option value={5}>5 Aulas</option>
                                                    <option value={6}>6 Aulas</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Noturno */}
                                    <div className="p-5 border border-indigo-200 bg-indigo-50/20 rounded-2xl space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center">
                                                <Moon size={18} />
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">Turno Noturno</h5>
                                                <span className="text-[10px] text-indigo-700 font-bold uppercase">Noite / EJA</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                                    Início das Aulas
                                                </label>
                                                <input
                                                    type="time"
                                                    value={horariosConfig.turnos.noturno.inicio}
                                                    onChange={e => handleTurnoChange('noturno', 'inicio', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                                    Duração do Intervalo
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={60}
                                                        step={5}
                                                        value={horariosConfig.turnos.noturno.duracaoIntervalo}
                                                        onChange={e => handleTurnoChange('noturno', 'duracaoIntervalo', Number(e.target.value))}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                                                        MIN
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                                    Intervalo Após
                                                </label>
                                                <select
                                                    value={horariosConfig.turnos.noturno.intervaloAposAula}
                                                    onChange={e => handleTurnoChange('noturno', 'intervaloAposAula', Number(e.target.value))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <option value={1}>Após a 1ª Aula</option>
                                                    <option value={2}>Após a 2ª Aula</option>
                                                    <option value={3}>Após a 3ª Aula</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                                                    Total de Aulas no Turno
                                                </label>
                                                <select
                                                    value={horariosConfig.turnos.noturno.aulasPorTurno}
                                                    onChange={e => handleTurnoChange('noturno', 'aulasPorTurno', Number(e.target.value))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <option value={3}>3 Aulas</option>
                                                    <option value={4}>4 Aulas</option>
                                                    <option value={5}>5 Aulas</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* 3. Pré-Visualização Dinâmica da Grade */}
                            <Card className="bg-white border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-brand-orange" />
                                            Simulador & Pré-Visualização da Grade Calculada
                                        </h4>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                                            Veja em tempo real como a grade horária será gerada nos quadros das escolas com as configurações atuais.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                                        <span>Carga horária total:</span>
                                        <span className="font-black text-brand-orange">{totalHorasStr}</span>
                                    </div>
                                </div>

                                {/* Selectors for Preview */}
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    {/* Turno selector */}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewTurno('matutino')}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                                previewTurno === 'matutino'
                                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <Sun className="w-3.5 h-3.5" /> Matutino
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewTurno('vespertino')}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                                previewTurno === 'vespertino'
                                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <Sunset className="w-3.5 h-3.5" /> Vespertino
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewTurno('noturno')}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                                previewTurno === 'noturno'
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <Moon className="w-3.5 h-3.5" /> Noturno
                                        </button>
                                    </div>

                                    {/* Etapa selector */}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewEtapa('educacaoInfantil')}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                                previewEtapa === 'educacaoInfantil'
                                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            Ed. Infantil ({horariosConfig.duracaoAulas.educacaoInfantil}m)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewEtapa('anosIniciais')}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                                previewEtapa === 'anosIniciais'
                                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            Anos Iniciais ({horariosConfig.duracaoAulas.anosIniciais}m)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewEtapa('anosFinais')}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                                previewEtapa === 'anosFinais'
                                                    ? 'bg-brand-orange text-white shadow-md shadow-orange-500/20'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            Anos Finais ({horariosConfig.duracaoAulas.anosFinais}m)
                                        </button>
                                    </div>
                                </div>

                                {/* Generated Timetable Table */}
                                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">Aula</th>
                                                <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Início</th>
                                                <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Término</th>
                                                <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Duração</th>
                                                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {previewSlots.map((slot, idx) => {
                                                if (slot.intervalo) {
                                                    return (
                                                        <tr key={`slot-${idx}`} className="bg-amber-50/40">
                                                            <td className="px-5 py-2.5 font-bold text-xs text-amber-700 flex items-center gap-1.5">
                                                                <Coffee className="w-3.5 h-3.5" /> Intervalo
                                                            </td>
                                                            <td className="px-4 py-2.5 text-center font-bold text-xs text-amber-900">{slot.inicio}</td>
                                                            <td className="px-4 py-2.5 text-center font-bold text-xs text-amber-900">{slot.fim}</td>
                                                            <td className="px-4 py-2.5 text-center font-bold text-xs text-amber-700">
                                                                {horariosConfig.turnos[previewTurno].duracaoIntervalo} min
                                                            </td>
                                                            <td className="px-5 py-2.5">
                                                                <span className="text-[10px] font-bold text-amber-700 uppercase bg-amber-100 px-2 py-0.5 rounded-full">
                                                                    Recreio / Intervalo
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return (
                                                    <tr key={`slot-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-5 py-3 font-black text-xs text-slate-700">
                                                            {slot.numero}ª Aula
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-xs text-slate-800">{slot.inicio}</td>
                                                        <td className="px-4 py-3 text-center font-bold text-xs text-slate-800">{slot.fim}</td>
                                                        <td className="px-4 py-3 text-center font-bold text-xs text-slate-600">
                                                            {horariosConfig.duracaoAulas[previewEtapa]} min
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-full">
                                                                Aula Regular
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 text-xs text-slate-500">
                                    <Info className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                                    <span>
                                        Ao clicar em <strong>"SALVAR TODAS AS ALTERAÇÕES"</strong> no topo da página, as configurações de início, intervalo e duração de aulas entrarão em vigor para todos os quadros de horário docente das escolas da rede municipal.
                                    </span>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Adicionar / Editar Item da Matriz */}
            <Modal
                isOpen={itemModalOpen}
                onClose={() => setItemModalOpen(false)}
                size="lg"
                showCloseButton={true}
            >
                <div className="p-6 space-y-5">
                    <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-50 text-brand-orange border border-orange-200">
                                {itemModalMatrizKey === 'infantil' ? 'Educação Infantil' : 'Ensino Fundamental'}
                            </span>
                        </div>
                        <h3 className="text-base font-black text-slate-800 uppercase tracking-tight mt-1.5">
                            {editingItemId ? 'Editar Item da Matriz Curricular' : 'Adicionar Item à Matriz Curricular'}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {itemModalMatrizKey && matrizes[itemModalMatrizKey]?.titulo}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Área do Conhecimento (apenas para Fundamental e EJA) */}
                        {itemModalMatrizKey !== 'infantil' && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                    Área do Conhecimento (BNCC)
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {['LINGUAGENS', 'MATEMÁTICA', 'CIÊNCIAS DA NATUREZA', 'CIÊNCIAS HUMANAS', 'ENSINO RELIGIOSO'].map(a => (
                                        <button
                                            key={a}
                                            type="button"
                                            onClick={() => setModalArea(a)}
                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                                modalArea === a
                                                    ? 'bg-slate-900 text-white border-slate-900'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={modalArea}
                                    onChange={e => setModalArea(e.target.value.toUpperCase())}
                                    placeholder="Ex: LINGUAGENS, MATEMÁTICA..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-1 focus:ring-brand-orange"
                                />
                            </div>
                        )}

                        {/* Nome do Componente ou Campo */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                {itemModalMatrizKey === 'infantil' ? 'Campo de Experiência (BNCC)' : 'Componente Curricular / Disciplina'}
                            </label>
                            <input
                                type="text"
                                value={modalComponente}
                                onChange={e => setModalComponente(e.target.value)}
                                placeholder={itemModalMatrizKey === 'infantil' ? 'Ex: CORPO, GESTOS E MOVIMENTOS' : 'Ex: LÍNGUA PORTUGUESA'}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                            />
                        </div>

                        {/* Grid: Aulas Semanais e Duração da Aula */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                    Aulas Semanais
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={modalAulasSemanais}
                                    onChange={e => setModalAulasSemanais(Math.max(1, Number(e.target.value)))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                    Duração por Aula (Minutos)
                                </label>
                                <div className="flex gap-2">
                                    {[50, 40].map(min => (
                                        <button
                                            key={min}
                                            type="button"
                                            onClick={() => setModalDuracaoMinutos(min)}
                                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                                                modalDuracaoMinutos === min
                                                    ? 'bg-brand-orange text-white border-brand-orange shadow-sm'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {min} min {min === 50 ? '(Padrão)' : '(*) Diferenciada'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Observação */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                Observação / Marcador (Opcional)
                            </label>
                            <input
                                type="text"
                                value={modalObservacao}
                                onChange={e => setModalObservacao(e.target.value)}
                                placeholder="Ex: * (para indicar tempo diferenciado)"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                            />
                        </div>

                        {/* Real-time calculated preview box */}
                        {itemModalMatrizKey && (() => {
                            const targetMat = matrizes[itemModalMatrizKey];
                            const semTotais = (modalAulasSemanais || 0) * (targetMat?.semanasPeriodo || 40);
                            const minTotais = semTotais * (modalDuracaoMinutos || 50);
                            return (
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                        Cálculo em Tempo Real da Carga Horária
                                    </span>
                                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                        <div className="bg-white p-2 rounded-xl border border-slate-100">
                                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Aulas no Período</span>
                                            <span className="text-sm font-black text-slate-800">{semTotais}</span>
                                        </div>
                                        <div className="bg-white p-2 rounded-xl border border-slate-100">
                                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Carga / Aula</span>
                                            <span className="text-sm font-mono font-bold text-slate-700">{formatarCargaComponente(modalDuracaoMinutos)}</span>
                                        </div>
                                        <div className="bg-white p-2 rounded-xl border border-orange-200 bg-orange-50/50">
                                            <span className="text-[9px] uppercase font-bold text-brand-orange block">Horas Totais</span>
                                            <span className="text-sm font-mono font-black text-slate-900">{formatarMinutosParaHoras(minTotais)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <Button
                            type="button"
                            onClick={() => setItemModalOpen(false)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs px-4 py-2.5"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveItemModal}
                            className="bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-xs px-5 py-2.5 flex items-center gap-1.5 shadow-md shadow-orange-500/10"
                        >
                            <Check className="w-4 h-4" />
                            {editingItemId ? 'Salvar Alterações' : 'Inserir na Matriz'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Impressão Oficial da Matriz Curricular */}
            {printingMatriz && (
                <PrintableMatrizCurricular
                    matriz={printingMatriz}
                    onClose={() => setPrintingMatriz(null)}
                />
            )}
        </div>
    );
};
