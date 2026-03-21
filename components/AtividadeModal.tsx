import React, { useState, useEffect } from 'react';
import { X, Save, Info, Calendar, Target, Briefcase, Clock, MapPin, Users, BookOpen, Edit } from 'lucide-react';

import { Atividade } from '../services/activitiesService';
import { supabase } from '../services/supabase';

interface AtividadeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (atividade: Omit<Atividade, 'id' | 'inscritos'>) => void;
    atividadeToEdit?: Atividade | null;
}

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CATEGORIAS = [
    { id: 'esportes', name: 'Esportes' },
    { id: 'artes', name: 'Artes' },
    { id: 'musica', name: 'Música' },
    { id: 'tecnologia', name: 'Tecnologia' },
    { id: 'reforco', name: 'Reforço' },
];

const PUBLICOS = [
    'Infantil (4 a 5 anos)',
    'Fundamental I (1º ao 5º ano)',
    'Fundamental II (6º ao 9º ano)',
    'EJA',
    'Todos'
];

export const AtividadeModal: React.FC<AtividadeModalProps> = ({ isOpen, onClose, onSave, atividadeToEdit }) => {
    const [formData, setFormData] = useState<Omit<Atividade, 'id' | 'inscritos'>>({
        nome: '',
        categoria: 'esportes',
        unidadeEscolar: '',
        instrutor: '',
        vagas: 20,
        diasSemana: [],
        horarioInicio: '',
        horarioFim: '',
        sala: '',
        cargaHoraria: '',
        publicoAlvo: 'Fundamental I (1º ao 5º ano)',
        objetivos: '',
        materiais: '',
        status: 'Ativa'
    });

    const [escolasDisponiveis, setEscolasDisponiveis] = useState<string[]>([]);
    const [monitoresDisponiveis, setMonitoresDisponiveis] = useState<string[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    useEffect(() => {
        const fetchRequiredData = async () => {
            setIsLoadingData(true);
            try {
                // Fetch schools that offer complementary activities
                const { data: schools } = await supabase
                    .from('escolas')
                    .select('nome')
                    .eq('oferta_atividade_complementar', true)
                    .order('nome');
                
                if (schools) {
                    setEscolasDisponiveis(schools.map(s => s.nome));
                }

                // Fetch monitors (servidores in recursos_humanos with specific function)
                const { data: personnel } = await supabase
                    .from('recursos_humanos')
                    .select('nome')
                    .eq('funcao', 'Monitor(a) de Atividade Complementar')
                    .order('nome');

                if (personnel) {
                    setMonitoresDisponiveis(personnel.map(p => p.nome));
                }
            } catch (error) {
                console.error('Error fetching modal data:', error);
            } finally {
                setIsLoadingData(false);
            }
        };

        if (isOpen) {
            fetchRequiredData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (atividadeToEdit) {
            setFormData({
                nome: atividadeToEdit.nome,
                categoria: atividadeToEdit.categoria,
                unidadeEscolar: atividadeToEdit.unidadeEscolar,
                instrutor: atividadeToEdit.instrutor,
                vagas: atividadeToEdit.vagas,
                diasSemana: atividadeToEdit.diasSemana,
                horarioInicio: atividadeToEdit.horarioInicio,
                horarioFim: atividadeToEdit.horarioFim,
                sala: atividadeToEdit.sala,
                cargaHoraria: atividadeToEdit.cargaHoraria,
                publicoAlvo: atividadeToEdit.publicoAlvo,
                objetivos: atividadeToEdit.objetivos,
                materiais: atividadeToEdit.materiais,
                status: atividadeToEdit.status
            });
        } else {
            setFormData({
                nome: '',
                categoria: 'esportes',
                unidadeEscolar: '',
                instrutor: '',
                vagas: 20,
                diasSemana: [],
                horarioInicio: '',
                horarioFim: '',
                sala: '',
                cargaHoraria: '',
                publicoAlvo: 'Fundamental I (1º ao 5º ano)',
                objetivos: '',
                materiais: '',
                status: 'Ativa'
            });
        }
    }, [atividadeToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const toggleDia = (dia: string) => {
        setFormData(prev => ({
            ...prev,
            diasSemana: prev.diasSemana.includes(dia)
                ? prev.diasSemana.filter(d => d !== dia)
                : [...prev.diasSemana, dia]
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-50 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 bg-white border-b border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                <span>Atividades</span>
                                <span>•</span>
                                <span className="text-orange-500">{atividadeToEdit ? 'Editar Atividade' : 'Nova Atividade'}</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                                {atividadeToEdit ? 'Editar Atividade' : 'Cadastro de Nova Atividade'}
                            </h3>
                            <p className="text-slate-500 font-medium text-sm mt-1">
                                {atividadeToEdit ? 'Atualize as configurações desta oficina ou projeto.' : 'Gerencie e configure novas oficinas e projetos extracurriculares.'}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    
                    {/* Section: Informações Básicas */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center gap-2 text-slate-800">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                <Info size={18} />
                            </div>
                            <h4 className="font-black text-sm uppercase tracking-wider">Informações Básicas</h4>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 ml-1">Nome da Atividade</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Ex: Oficina de Robótica Nível 1"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Categoria</label>
                                    <select 
                                        value={formData.categoria}
                                        onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="" disabled>Selecione a categoria</option>
                                        {CATEGORIAS.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Unidade Escolar</label>
                                    <select 
                                        value={formData.unidadeEscolar}
                                        onChange={e => setFormData({ ...formData, unidadeEscolar: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer"
                                        disabled={isLoadingData}
                                    >
                                        <option value="" disabled>{isLoadingData ? 'Carregando unidades...' : 'Selecione a unidade'}</option>
                                        {escolasDisponiveis.map(escola => (
                                            <option key={escola} value={escola}>{escola}</option>
                                        ))}
                                        {!isLoadingData && escolasDisponiveis.length === 0 && (
                                            <option value="" disabled>Nenhuma escola com oferta ativa</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 ml-1">Monitor / Professor da Atividade</label>
                                <select 
                                    value={formData.instrutor}
                                    onChange={e => setFormData({ ...formData, instrutor: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer"
                                    disabled={isLoadingData}
                                >
                                    <option value="" disabled>{isLoadingData ? 'Carregando monitores...' : 'Selecione o monitor responsável'}</option>
                                    {monitoresDisponiveis.map(monitor => (
                                        <option key={monitor} value={monitor}>{monitor}</option>
                                    ))}
                                    {!isLoadingData && monitoresDisponiveis.length === 0 && (
                                        <option value="" disabled>Nenhum monitor encontrado no RH</option>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section: Planejamento e Local */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center gap-2 text-slate-800">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                <Calendar size={18} />
                            </div>
                            <h4 className="font-black text-sm uppercase tracking-wider">Planejamento e Local</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-slate-500 ml-1">Dias da Semana</label>
                                <div className="flex gap-2 flex-wrap">
                                    {DIAS.map(dia => (
                                        <button
                                            key={dia}
                                            type="button"
                                            onClick={() => toggleDia(dia)}
                                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${formData.diasSemana.includes(dia) ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                        >
                                            {dia}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Horário</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input 
                                                type="time" 
                                                value={formData.horarioInicio}
                                                onChange={e => setFormData({ ...formData, horarioInicio: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                            />
                                        </div>
                                        <span className="text-slate-400 text-xs font-bold px-1">até</span>
                                        <div className="relative flex-1">
                                            <input 
                                                type="time" 
                                                value={formData.horarioFim}
                                                onChange={e => setFormData({ ...formData, horarioFim: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Local / Sala</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Laboratório Maker"
                                        value={formData.sala}
                                        onChange={e => setFormData({ ...formData, sala: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Capacidade Máxima</label>
                                    <input 
                                        type="number" 
                                        value={formData.vagas}
                                        onChange={e => setFormData({ ...formData, vagas: parseInt(e.target.value) })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Carga Horária Total (horas)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: 40"
                                        value={formData.cargaHoraria}
                                        onChange={e => setFormData({ ...formData, cargaHoraria: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 ml-1">Público-Alvo / Faixa Etária</label>
                                <select 
                                    value={formData.publicoAlvo}
                                    onChange={e => setFormData({ ...formData, publicoAlvo: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer"
                                >
                                    {PUBLICOS.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 ml-1">Status da Atividade</label>
                                <div className="flex gap-3">
                                    {['Ativo', 'Planejado'].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: s === 'Ativo' ? 'Ativa' : 'Planejada' })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                                                (s === 'Ativo' && formData.status === 'Ativa') || (s === 'Planejado' && formData.status === 'Planejada')
                                                ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${
                                                (s === 'Ativo' && formData.status === 'Ativa') ? 'bg-orange-500' :
                                                (s === 'Planejado' && formData.status === 'Planejada') ? 'bg-blue-500' : 'bg-slate-300'
                                            }`} />
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Objetivo Pedagógico */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center gap-2 text-slate-800">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                <BookOpen size={18} />
                            </div>
                            <h4 className="font-black text-sm uppercase tracking-wider">Objetivo Pedagógico</h4>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 ml-1">Correlação com a BNCC e Objetivos</label>
                            <textarea 
                                placeholder="Descreva as competências e habilidades que serão desenvolvidas nesta atividade..."
                                value={formData.objetivos}
                                onChange={e => setFormData({ ...formData, objetivos: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all min-h-[120px] resize-none"
                            />
                        </div>
                    </div>

                    {/* Section: Materiais Necessários */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center gap-2 text-slate-800">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                <Briefcase size={18} />
                            </div>
                            <h4 className="font-black text-sm uppercase tracking-wider">Materiais Necessários</h4>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 ml-1">Lista de Materiais e Equipamentos</label>
                            <textarea 
                                placeholder="Liste os materiais necessários (ex: Kit de robótica, cola, papel cartão, notebooks...)"
                                value={formData.materiais}
                                onChange={e => setFormData({ ...formData, materiais: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all min-h-[100px] resize-none"
                            />
                            <p className="text-[10px] text-slate-400 font-medium ml-1">Separe os itens por vírgula ou um por linha.</p>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-6">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-100 transition-all active:scale-95 flex items-center gap-2"
                    >
                        {atividadeToEdit ? <><Save size={18} /> Salvar Alterações</> : 'Salvar Atividade'}
                    </button>
                </div>
            </div>
        </div>
    );
};
