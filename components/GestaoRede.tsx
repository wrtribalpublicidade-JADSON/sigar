import React, { useState, useEffect } from 'react';
import { useConfiguracao } from '../context/ConfiguracaoContext';
import { configuracaoService, PeriodoLetivo } from '../services/configuracaoService';
import { useNotification } from '../context/NotificationContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
    Sliders, Calendar, BookOpen, GraduationCap, Save, Plus, Trash2, 
    ShieldAlert, Clock, Check, RefreshCw
} from 'lucide-react';

export const GestaoRede: React.FC = () => {
    const { configuracao, refreshConfiguracao } = useConfiguracao();
    const { showNotification } = useNotification();

    const [activeTab, setActiveTab] = useState<'metrics' | 'periods' | 'curriculum' | 'infantil'>('metrics');
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [notaMinima, setNotaMinima] = useState<string>('7.0');
    const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([]);
    const [componentes, setComponentes] = useState<string[]>([]);
    const [campos, setCampos] = useState<string[]>([]);

    // New item inputs
    const [newComponente, setNewComponente] = useState('');
    const [newCampo, setNewCampo] = useState('');

    useEffect(() => {
        if (configuracao) {
            setNotaMinima(configuracao.nota_minima_aprovacao.toString().replace('.', ','));
            setPeriodos(configuracao.periodos_letivos.map(p => ({ ...p })));
            setComponentes([...configuracao.componentes_curriculares]);
            setCampos([...configuracao.campos_experiencia]);
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
            await configuracaoService.saveConfiguracao({
                nota_minima_aprovacao: parsedNota,
                periodos_letivos: periodos,
                componentes_curriculares: componentes,
                campos_experiencia: campos
            });
            await refreshConfiguracao();
            showNotification('success', 'Configurações de rede atualizadas com sucesso!');
        } catch (err) {
            console.error('Error saving configuration:', err);
            showNotification('error', 'Ocorreu um erro ao salvar as configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePeriodChange = (id: string, field: keyof PeriodoLetivo, value: any) => {
        setPeriodos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
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

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">CONFIGURAÇÕES DA REDE</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Parametrização global de notas, períodos e diários</p>
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
                    {activeTab === 'curriculum' && (
                        <Card className="bg-white border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Componentes Curriculares</h3>
                                    <p className="text-xs text-slate-400 font-medium">Definição das disciplinas curriculares do Ensino Fundamental vigentes no sistema.</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Ex: Geografia, Educação Física..." 
                                    value={newComponente}
                                    onChange={e => setNewComponente(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddComponente()}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/10 focus:border-brand-orange"
                                />
                                <Button 
                                    onClick={handleAddComponente}
                                    className="bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-xs px-4 flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar
                                </Button>
                            </div>

                            <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                {componentes.map((comp) => (
                                    <div key={comp} className="flex justify-between items-center px-5 py-3 hover:bg-slate-50 transition-colors">
                                        <span className="text-xs font-bold text-slate-700">{comp}</span>
                                        <button 
                                            onClick={() => handleRemoveComponente(comp)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Excluir Componente"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Educacao Infantil */}
                    {activeTab === 'infantil' && (
                        <Card className="bg-white border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Campos de Experiência (BNCC)</h3>
                                    <p className="text-xs text-slate-400 font-medium">Definição dos Campos de Experiência vigentes para a Educação Infantil.</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Ex: Traços, Sons, Cores e Formas..." 
                                    value={newCampo}
                                    onChange={e => setNewCampo(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddCampo()}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/10 focus:border-brand-orange"
                                />
                                <Button 
                                    onClick={handleAddCampo}
                                    className="bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-xs px-4 flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar
                                </Button>
                            </div>

                            <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                {campos.map((c) => (
                                    <div key={c} className="flex justify-between items-center px-5 py-3 hover:bg-slate-50 transition-colors">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{c}</span>
                                        <button 
                                            onClick={() => handleRemoveCampo(c)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Excluir Campo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
