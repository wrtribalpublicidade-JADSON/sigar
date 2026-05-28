import React, { useState, useEffect } from 'react';
import { X, Save, Info, Calendar, Target, Briefcase, Clock, MapPin, Users, BookOpen, Edit } from 'lucide-react';

import { Atividade } from '../services/activitiesService';
import { supabase } from '../services/supabase';
import { normalizeCategoria } from './AtividadesComplementares';

interface AtividadeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (atividade: Omit<Atividade, 'id' | 'inscritos'>) => void;
    atividadeToEdit?: Atividade | null;
}

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const PUBLICOS = [
    'Infantil (4 a 5 anos)',
    'Fundamental I (1º ao 5º ano)',
    'Fundamental II (6º ao 9º ano)',
    'EJA',
    'Todos'
];

export const ATIVIDADES_ESTRUTURA = [
    {
        id: '1. Cultura, Artes e Educação Patrimonial',
        nome: '1. Cultura, Artes e Educação Patrimonial',
        subareas: [
            {
                nome: '11. Música',
                atividades: ['Canto coral', 'Banda', 'Iniciação Musical']
            },
            {
                nome: '12. Artes Plásticas',
                atividades: ['Desenho', 'Grafite', 'Pintura']
            },
            {
                nome: '13. Cinema',
                atividades: ['Cinema']
            },
            {
                nome: '14. Artes Cênicas',
                atividades: ['Teatro', 'Danças']
            },
            {
                nome: '15. Manifestações Culturais Regionais',
                atividades: ['Capoeira', 'Artesanato']
            },
            {
                nome: '16. Educação Patrimonial',
                atividades: ['Educação Patrimonial']
            },
            {
                nome: '17. Leituras e Salas Temáticas',
                atividades: ['Leitura', 'Linguas Estrangeiras (Inglês)']
            }
        ]
    },
    {
        id: '2. Esporte e Lazer',
        nome: '2. Esporte e Lazer',
        subareas: [
            {
                nome: '21. Recreação',
                atividades: ['Recreação (Brinquedoteca e jogos)']
            },
            {
                nome: '22. atividades Desportivas',
                atividades: [
                    'Atletismo', 'Basquete', 'Futebol', 'Futsal', 'Handebol', 
                    'Judô', 'Karatê', 'Taekwondo', 'Voleibol', 'Vôlei de praia', 
                    'Xadrez tradicional/virtual'
                ]
            }
        ]
    },
    {
        id: '3. Acompanhamento pedagógico',
        nome: '3. Acompanhamento pedagógico',
        subareas: [
            {
                nome: '31. Acompanhamento Pedagógico',
                atividades: ['Português', 'Matemática']
            }
        ]
    },
    {
        id: '7. Promoção da Saúde',
        nome: '7. Promoção da Saúde',
        subareas: [
            {
                nome: '71. Promoção da Saúde',
                atividades: ['Promoção da Saúde']
            }
        ]
    },
    {
        id: '10. Iniciação Cientifica',
        nome: '10. Iniciação Cientifica',
        subareas: [
            {
                nome: '101. Iniciação Cientifica',
                atividades: ['Iniciação Cientifica']
            }
        ]
    },
    {
        id: '13. Educação Ambiental e Desenvolvimento Sustentável',
        nome: '13. Educação Ambiental e Desenvolvimento Sustentável',
        subareas: [
            {
                nome: '133. Educação Ambiental e Desenvolvimento Sustentável',
                atividades: [
                    'Educação Ambiental e Desenvolvimento Sustentável',
                    'Conservação do solo e composteira: canteiros sustentáveis (horta) e/ou jardinagem Escolar.'
                ]
            }
        ]
    },
    {
        id: '14. Comunicação, uso de mídias e cultura Digital e Tecnológica',
        nome: '14. Comunicação, uso de mídias e cultura Digital e Tecnológica',
        subareas: [
            {
                nome: '141. Comunicação, uso de mídias',
                atividades: ['História em quadrinhos', 'Jornal Escolar', 'Rádio Escolar', 'Vídeo']
            },
            {
                nome: '142. Cultura Digital e Tecnológica',
                atividades: ['Robótica Educacional', 'Tecnológicas Educacionais', 'Ambientes de Redes Sociais']
            }
        ]
    },
    {
        id: '15. Educação para Valorização do Multiculturalismo nas Matrizes Históricas e Culturais Brasileiras',
        nome: '15. Educação para Valorização do Multiculturalismo nas Matrizes Históricas e Culturais Brasileiras',
        subareas: [
            {
                nome: '151. Memória e História das Comunidades Tradicionais',
                atividades: ['Memórias e Histórias das Comunidades Tradicionais']
            },
            {
                nome: '152. Memória e História das Culturas Afro-Brasileira e Africana',
                atividades: ['Memória e História das Culturas Afro-Brasileira e Africana']
            },
            {
                nome: '153. Memorias e História das Culturas e Indígenas',
                atividades: ['Memorias e História das Culturas e Indígenas']
            }
        ]
    }
];

export const AtividadeModal: React.FC<AtividadeModalProps> = ({ isOpen, onClose, onSave, atividadeToEdit }) => {
    const [selectedAreaId, setSelectedAreaId] = useState<string>('');
    const [selectedSubareaName, setSelectedSubareaName] = useState<string>('');

    const [formData, setFormData] = useState<Omit<Atividade, 'id' | 'inscritos'>>({
        nome: '',
        categoria: '',
        subarea: '',
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

    const handleAreaChange = (areaId: string) => {
        setSelectedAreaId(areaId);
        setSelectedSubareaName('');
        setFormData(prev => ({
            ...prev,
            categoria: areaId,
            subarea: '',
            nome: ''
        }));
    };

    const handleSubareaChange = (subName: string) => {
        setSelectedSubareaName(subName);
        setFormData(prev => ({
            ...prev,
            subarea: subName,
            nome: ''
        }));
    };

    const handleActivityChange = (actName: string) => {
        setFormData(prev => ({
            ...prev,
            nome: actName
        }));
    };

    const [escolasDisponiveis, setEscolasDisponiveis] = useState<{id: string, nome: string}[]>([]);
    const [monitoresDisponiveis, setMonitoresDisponiveis] = useState<string[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    useEffect(() => {
        const fetchRequiredData = async () => {
            setIsLoadingData(true);
            try {
                // Fetch schools that offer complementary activities
                const { data: schools } = await supabase
                    .from('escolas')
                    .select('id, nome')
                    .eq('oferta_atividade_complementar', true)
                    .order('nome');
                
                if (schools) {
                    setEscolasDisponiveis(schools);
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
            const normalizedCategory = normalizeCategoria(atividadeToEdit.categoria);
            let resolvedAreaId = '';
            let resolvedSubareaName = '';

            for (const area of ATIVIDADES_ESTRUTURA) {
                for (const sub of area.subareas) {
                    if (sub.atividades.includes(atividadeToEdit.nome)) {
                        resolvedAreaId = area.id;
                        resolvedSubareaName = sub.nome;
                        break;
                    }
                }
                if (resolvedAreaId) break;
            }

            if (!resolvedAreaId) {
                const matchedArea = ATIVIDADES_ESTRUTURA.find(a => a.id === normalizedCategory);
                if (matchedArea) {
                    resolvedAreaId = matchedArea.id;
                }
            }

            setSelectedAreaId(resolvedAreaId);
            setSelectedSubareaName(resolvedSubareaName);

            setFormData({
                nome: atividadeToEdit.nome,
                categoria: resolvedAreaId || normalizedCategory,
                subarea: resolvedSubareaName || atividadeToEdit.subarea || '',
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
                status: atividadeToEdit.status,
                escola_id: atividadeToEdit.escola_id
            });
        } else {
            setSelectedAreaId('');
            setSelectedSubareaName('');
            setFormData({
                nome: '',
                categoria: '',
                subarea: '',
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
        if (!selectedAreaId || !selectedSubareaName || !formData.nome) {
            alert('Por favor, selecione a Área, Subárea e Nome da Atividade.');
            return;
        }
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
                                <label className="text-[11px] font-bold text-slate-500 ml-1">Área (Código / Nome da Área)</label>
                                <select 
                                    value={selectedAreaId}
                                    onChange={e => handleAreaChange(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer text-slate-700"
                                >
                                    <option value="" disabled>Selecione a área de atuação</option>
                                    {ATIVIDADES_ESTRUTURA.map(area => (
                                        <option key={area.id} value={area.id}>{area.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Subárea (Código / Nome Subárea)</label>
                                    <select 
                                        value={selectedSubareaName}
                                        onChange={e => handleSubareaChange(e.target.value)}
                                        disabled={!selectedAreaId}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 text-slate-700"
                                    >
                                        <option value="" disabled>Selecione a subárea</option>
                                        {selectedAreaId && ATIVIDADES_ESTRUTURA.find(a => a.id === selectedAreaId)?.subareas.map(sub => (
                                            <option key={sub.nome} value={sub.nome}>{sub.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Nome da Atividade</label>
                                    <select 
                                        value={formData.nome}
                                        onChange={e => handleActivityChange(e.target.value)}
                                        disabled={!selectedSubareaName}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 text-slate-700"
                                    >
                                        <option value="" disabled>Selecione a atividade</option>
                                        {selectedSubareaName && ATIVIDADES_ESTRUTURA.find(a => a.id === selectedAreaId)?.subareas
                                            .find(s => s.nome === selectedSubareaName)?.atividades.map(act => (
                                                <option key={act} value={act}>{act}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Unidade Escolar</label>
                                    <select 
                                        value={formData.escola_id || ''}
                                        onChange={e => {
                                            const selectedEscola = escolasDisponiveis.find(esc => esc.id === e.target.value);
                                            setFormData({ 
                                                ...formData, 
                                                escola_id: e.target.value,
                                                unidadeEscolar: selectedEscola?.nome || ''
                                            });
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer text-slate-700"
                                        disabled={isLoadingData}
                                    >
                                        <option value="" disabled>{isLoadingData ? 'Carregando unidades...' : 'Selecione a unidade'}</option>
                                        {escolasDisponiveis.map(escola => (
                                            <option key={escola.id} value={escola.id}>{escola.nome}</option>
                                        ))}
                                        {!isLoadingData && escolasDisponiveis.length === 0 && (
                                            <option value="" disabled>Nenhuma escola com oferta ativa</option>
                                        )}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 ml-1">Monitor / Professor da Atividade</label>
                                    <select 
                                        value={formData.instrutor}
                                        onChange={e => setFormData({ ...formData, instrutor: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all cursor-pointer text-slate-700"
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
