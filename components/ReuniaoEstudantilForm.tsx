import React, { useState, useEffect, useMemo } from 'react';
import { Printer, BookOpen, ClipboardList, CalendarClock, Info, ArrowLeft, ArrowRight, Save, LayoutTemplate, School, Calendar, FileText, X, Users, CheckCircle2, Lock, Send, BarChart3, Hand, CheckSquare, MessageCircle, AlertTriangle, UserPlus, PenLine, Loader2 } from 'lucide-react';
import { Escola, Coordenador } from '../types';
import { ccTurmaService, ccEstudanteService } from '../services/gestaoConselhoService';

interface ReuniaoEstudantilFormProps {
    onClose?: () => void;
    escolas?: Escola[];
    currentUser?: Coordenador | null;
    initialEscolaId?: string;
    initialTurmaId?: string;
}

export const ReuniaoEstudantilForm: React.FC<ReuniaoEstudantilFormProps> = ({ 
    onClose, 
    escolas = [], 
    currentUser,
    initialEscolaId,
    initialTurmaId
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [autoAvaliacao, setAutoAvaliacao] = useState<{ [key: number]: string }>({});
    
    // Selection States
    const [selectedEscolaId, setSelectedEscolaId] = useState<string>(initialEscolaId || escolas[0]?.id || '');
    const [turmas, setTurmas] = useState<any[]>([]);
    const [selectedTurmaId, setSelectedTurmaId] = useState<string>(initialTurmaId || '');
    const [estudantes, setEstudantes] = useState<any[]>([]);
    
    // Loading States
    const [isLoadingTurmas, setIsLoadingTurmas] = useState(false);
    const [isLoadingEstudantes, setIsLoadingEstudantes] = useState(false);
    
    // Active Turma Detection
    const activeTurma = useMemo(() => {
        return turmas.find(t => t.id === selectedTurmaId);
    }, [turmas, selectedTurmaId]);

    const isInfantil = activeTurma?.etapa === 'Educação Infantil';

    const CAMPOS_EXPERIENCIA = [
        'O Eu, o Outro e o Nós',
        'Corpo, Gestos e Movimentos',
        'Traços, Sons, Cores e Formas',
        'Escuta, Fala, Pensamento e Imaginação',
        'Espaços, Tempos, Quantidades, Relações e Transformações'
    ];

    // Fetch Turmas when School changes
    useEffect(() => {
        const loadTurmas = async () => {
            if (!selectedEscolaId) {
                setTurmas([]);
                return;
            }
            setIsLoadingTurmas(true);
            try {
                const data = await ccTurmaService.getBySchool(selectedEscolaId);
                setTurmas(data || []);
                // If initialTurmaId matches one of the new turmas, keep it, otherwise clear it
                if (initialTurmaId && data.some((t: any) => t.id === initialTurmaId)) {
                    setSelectedTurmaId(initialTurmaId);
                } else {
                    setSelectedTurmaId('');
                }
            } catch (error) {
                console.error('Erro ao carregar turmas:', error);
            } finally {
                setIsLoadingTurmas(false);
            }
        };
        loadTurmas();
    }, [selectedEscolaId, initialTurmaId]);

    // Fetch Students when Turma changes
    useEffect(() => {
        const loadStudents = async () => {
            if (!selectedTurmaId) {
                setEstudantes([]);
                return;
            }
            setIsLoadingEstudantes(true);
            try {
                const data = await ccEstudanteService.getByTurma(selectedTurmaId);
                setEstudantes(data || []);
            } catch (error) {
                console.error('Erro ao carregar estudantes:', error);
            } finally {
                setIsLoadingEstudantes(false);
            }
        };
        loadStudents();
    }, [selectedTurmaId]);

    const handleAutoAvaliacaoToggle = (idx: number) => {
        setAutoAvaliacao(prev => {
            const current = prev[idx];
            if (!current) return { ...prev, [idx]: 'E' };
            if (current === 'E') return { ...prev, [idx]: 'B' };
            if (current === 'B') return { ...prev, [idx]: 'R' };
            if (current === 'R') return { ...prev, [idx]: 'I' };
            return { ...prev, [idx]: '' };
        });
    };

    const getAutoAvaliacaoButtonConfig = (status: string | undefined) => {
        switch (status) {
            case 'E':
                return { text: 'Excelente', classes: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 shadow-sm shadow-emerald-500/10' };
            case 'B':
                return { text: 'Bom', classes: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300 shadow-sm shadow-blue-500/10' };
            case 'R':
                return { text: 'Regular', classes: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:border-amber-300 shadow-sm shadow-amber-500/10' };
            case 'I':
                return { text: 'Insuficiente', classes: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300 shadow-sm shadow-red-500/10' };
            default:
                return { text: 'Clique para escolher', classes: 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 border-dashed hover:border-slate-300 hover:text-slate-700' };
        }
    };

    const steps = [
        { id: 1, label: 'IDENTIFICAÇÃO', icon: LayoutTemplate },
        { id: 2, label: 'AVALIAÇÃO BNCC', icon: BookOpen },
        { id: 3, label: 'COMPROMISSOS', icon: ClipboardList },
        { id: 4, label: 'FREQUÊNCIA', icon: CalendarClock },
    ];

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    return (
        <div className="space-y-6 w-full animate-in fade-in zoom-in-95 duration-200">
            {/* Status Header */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm tracking-wide uppercase">Etapa Concluída e Enviada</h3>
                        <p className="text-xs text-slate-400">RELATÓRIO ENVIADO À COORDENAÇÃO PEDAGÓGICA EM 14/10/2024 ÀS 10:42</p>
                    </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 tracking-wider w-max">PROTOCOLO: #2024-3B-7742</span>
                </div>
            </div>

            {/* Header Geral - Formato de Card Padrão do Sistema */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
                        <LayoutTemplate className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 uppercase xl:tracking-wide">Reunião Estudantil Otimizada</h2>
                        <div className="flex gap-4 mt-1 text-sm">
                            <span className="text-slate-500">Status: <strong className="text-emerald-600">CONSOLIDADO</strong></span>
                            <span className="text-amber-500 font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> SOMENTE LEITURA</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                    <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center gap-2 transition-all shadow-sm">
                        <Printer className="w-4 h-4" /> Imprimir Relatório
                    </button>
                    <button className="border border-amber-200 bg-amber-50 text-amber-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-100 flex items-center gap-2 transition-all shadow-sm whitespace-nowrap">
                        <Lock className="w-4 h-4" /> Solicitar Desbloqueio
                    </button>
                    <button className="bg-slate-100 text-slate-400 px-4 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed flex items-center gap-2 shadow-sm whitespace-nowrap">
                        <Send className="w-4 h-4" /> Finalizar e Enviar Etapa
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 hover:text-slate-600 transition-colors shadow-sm focus:outline-none">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Stepper Progressão - Formato de Card */}
            <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = currentStep > step.id;
                    const isActive = currentStep === step.id;
                    const isPending = currentStep < step.id;

                    return (
                        <React.Fragment key={step.id}>
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className={`
                                    w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300
                                    ${isActive ? 'bg-emerald-500 text-white shadow-md ring-4 ring-emerald-100' : ''}
                                    ${isCompleted ? 'bg-emerald-400 text-white' : ''}
                                    ${isPending ? 'bg-slate-50 border-2 border-slate-200 text-slate-300' : ''}
                                `}>
                                    {isCompleted ? (
                                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <step.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={isActive ? 2 : 1.5} />
                                    )}
                                </div>
                                <span className={`
                                    text-[10px] md:text-xs font-extrabold uppercase tracking-wider hidden md:block
                                    ${isActive || isCompleted ? 'text-emerald-500' : 'text-slate-400'}
                                `}>
                                    {step.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-1.5 mx-2 md:mx-4 rounded-full transition-colors duration-300 ${currentStep > index + 1 ? 'bg-emerald-400' : 'bg-slate-100'}`}></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Content Area - Rolevel Form Steps */}
            <div>
                {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                        {/* Title bar of the step */}
                        <div className="bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-sm flex items-center gap-3 font-bold">
                            <div className="bg-white/20 p-1.5 rounded-lg">
                                <Info className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            ETAPA 1: DADOS DA TURMA
                        </div>

                        {/* Form Fields - Data Grid Card */}
                        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <School className="w-3.5 h-3.5" /> UNIDADE ESCOLAR
                                    </label>
                                    <select
                                        value={selectedEscolaId}
                                        onChange={(e) => setSelectedEscolaId(e.target.value)}
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                                    >
                                        <option value="">Selecione a Unidade Escolar</option>
                                        {escolas.map(escola => (
                                            <option key={escola.id} value={escola.id}>
                                                {escola.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5" /> TURMA / AGRUPAMENTO
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedTurmaId}
                                                onChange={(e) => setSelectedTurmaId(e.target.value)}
                                                disabled={!selectedEscolaId || isLoadingTurmas}
                                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                                            >
                                                <option value="">{isLoadingTurmas ? 'Carregando turmas...' : 'Selecione a Turma'}</option>
                                                {turmas.map(turma => (
                                                    <option key={turma.id} value={turma.id}>
                                                        {turma.identificacao} - {turma.anoSerie} ({turma.turno})
                                                    </option>
                                                ))}
                                            </select>
                                            {isLoadingTurmas && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5" /> ANO LETIVO
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                                            placeholder="Ex: 2024"
                                            defaultValue="2024"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <CalendarClock className="w-3.5 h-3.5" /> PERÍODO LETIVO
                                        </label>
                                        <select
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Selecione o Bimestre</option>
                                            <option value="1">1º Bimestre</option>
                                            <option value="2">2º Bimestre</option>
                                            <option value="3">3º Bimestre</option>
                                            <option value="4">4º Bimestre</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5" /> PAUTA DA REUNIÃO
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                                        defaultValue="Conselho de Classe Participativo"
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Orientations Alert */}
                        <div className="bg-emerald-50/80 px-6 py-5 rounded-2xl flex items-start gap-4 border border-emerald-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-bl-full opacity-50 -z-0"></div>
                            <div className="bg-emerald-100/80 p-2 rounded-xl shrink-0 text-emerald-600 border border-emerald-200/50 relative z-10">
                                <Info className="w-5 h-5" strokeWidth={2.5} />
                            </div>
                            <div className="text-sm relative z-10">
                                <span className="font-bold text-emerald-800">Orientações:</span>
                                <span className="text-emerald-700 ml-1 leading-relaxed">
                                    Este documento é o canal oficial para que a turma registre sua percepção sobre o ensino e infraestrutura. Seja objetivo e propositivo nas sugestões.
                                </span>
                            </div>
                        </div>

                    </div>
                )}

                {/* Etapa 2 - AVALIAÇÃO BNCC */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                        {/* Title bar of the step */}
                        <div className="bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-sm flex items-center justify-between font-bold">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-1.5 rounded-lg">
                                    <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                                {isInfantil ? 'ETAPA 2: CAMPOS DE EXPERIÊNCIA (BNCC INFANTIL)' : 'ETAPA 2: COMPONENTES CURRICULARES (BNCC)'}
                            </div>
                            <div className="bg-white/20 text-white text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider font-bold hidden md:block">
                                {isInfantil ? 'Direitos de Aprendizagem' : 'Foco na Aprendizagem'}
                            </div>
                        </div>

                        {/* Form Fields - Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
                            {/* Orientations Alert */}
                            <div className="bg-white px-6 py-5 flex items-start md:items-center gap-3 border-b border-slate-200">
                                <div className="bg-emerald-600 rounded-full p-1 text-white shrink-0 mt-0.5 md:mt-0">
                                    <Info className="w-3.5 h-3.5" strokeWidth={3} />
                                </div>
                                <div className="text-sm text-emerald-800">
                                    {isInfantil 
                                        ? <span>Marque a coluna <strong>Dificuldade</strong> para os campos onde a turma encontrou desafios no desenvolvimento das experiências.</span>
                                        : <span>Marque a coluna <strong>Dificuldade</strong> para os componentes onde a turma encontrou obstáculos e detalhe os motivos e sugestões.</span>
                                    }
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                                        <tr>
                                            {isInfantil ? (
                                                <th className="px-6 py-4 font-bold w-96 tracking-wider">Campos de Experiência</th>
                                            ) : (
                                                <>
                                                    <th className="px-6 py-4 font-bold w-48 tracking-wider">Áreas de Conhecimento</th>
                                                    <th className="px-6 py-4 font-bold w-48 tracking-wider">Componentes</th>
                                                </>
                                            )}
                                            <th className="px-6 py-4 font-bold text-center w-32 tracking-wider">Dificuldade</th>
                                            <th className="px-6 py-4 font-bold min-w-[200px] tracking-wider">Por Quê? (Motivos)</th>
                                            <th className="px-6 py-4 font-bold min-w-[200px] tracking-wider">Sugestões de Melhoria</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                        {isInfantil ? (
                                            CAMPOS_EXPERIENCIA.map((campo, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-6 py-5 font-bold text-slate-800">{campo}</td>
                                                    <td className="px-6 py-5 text-center">
                                                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" />
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium" placeholder="Desafios observados..." />
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium" placeholder="Sugestões pedagógicas..." />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <>
                                                {/* Linguagens */}
                                                <tr>
                                                    <td rowSpan={4} className="px-6 py-4 align-top font-bold text-slate-700 bg-white border-r border-slate-100">Linguagens</td>
                                                    <td className="px-6 py-4 font-bold text-slate-800">Língua Portuguesa</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium" placeholder="Descreva os desafios..." />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium" placeholder="Como podemos melhorar?" />
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="px-6 py-4 font-bold text-slate-800">Arte</td>
                                                    <td className="px-6 py-4 text-center"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                </tr>
                                                <tr>
                                                    <td className="px-6 py-4 font-bold text-slate-800">Educação Física</td>
                                                    <td className="px-6 py-4 text-center"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                </tr>
                                                <tr>
                                                    <td className="px-6 py-4 font-bold text-slate-800">Língua Inglesa</td>
                                                    <td className="px-6 py-4 text-center"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                </tr>

                                                {/* Matemática */}
                                                <tr className="border-t border-slate-200">
                                                    <td className="px-6 py-4 align-top font-bold text-slate-700 bg-white border-r border-slate-100">Matemática</td>
                                                    <td className="px-6 py-4 font-bold text-slate-800">Matemática</td>
                                                    <td className="px-6 py-4 text-center"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                </tr>

                                                {/* Ciências Naturais */}
                                                <tr className="border-t border-slate-200">
                                                    <td className="px-6 py-4 align-top font-bold text-slate-700 bg-white border-r border-slate-100">Ciências Nat.</td>
                                                    <td className="px-6 py-4 font-bold text-slate-800">Ciências</td>
                                                    <td className="px-6 py-4 text-center"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                </tr>

                                                {/* Humanas */}
                                                <tr className="border-t border-slate-200">
                                                    <td rowSpan={2} className="px-6 py-4 align-top font-bold text-slate-700 bg-white border-r border-slate-100">Humanas</td>
                                                    <td className="px-6 py-4 font-bold text-slate-800">História</td>
                                                    <td className="px-6 py-4 text-center"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                </tr>
                                                <tr>
                                                    <td className="px-6 py-4 font-bold text-slate-800">Geografia</td>
                                                    <td className="px-6 py-4 text-center"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                </tr>

                                                {/* Ensino Religioso */}
                                                <tr className="border-t border-slate-200">
                                                    <td className="px-6 py-4 align-top font-bold text-slate-700 bg-white border-r border-slate-100">Ens. Religioso</td>
                                                    <td className="px-6 py-4 font-bold text-slate-800">Ensino Religioso</td>
                                                    <td className="px-6 py-4 text-center"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                    <td className="px-6 py-4"><input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" /></td>
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}

                {/* Etapa 3 - COMPROMISSOS */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Title bar of the step */}
                        <div className="bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-sm flex items-center justify-between font-bold">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-1.5 rounded-lg">
                                    <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                                ETAPA 3: AUTOAVALIAÇÃO E COMPROMISSOS DA TURMA
                            </div>
                            <div className="bg-emerald-400/50 text-white text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider font-bold hidden md:block">
                                AUTOANÁLISE COLETIVA
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-10">

                            {/* Section 1 */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {isInfantil ? '1. AUTOAVALIAÇÃO DOS PAIS/RESPONSÁVEIS' : '1. AUTOAVALIAÇÃO DA TURMA'}
                                </h3>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-[10px] text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-6 py-4 font-bold tracking-wider">Critérios de Avaliação</th>
                                                    <th className="px-6 py-4 font-bold text-center tracking-wider w-48">Situação</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                                {(isInfantil ? [
                                                    'Participação nas atividades escolares',
                                                    'Acompanhamento do desenvolvimento em casa',
                                                    'Comunicação com a escola/professores',
                                                    'Pontualidade e frequência da criança'
                                                ] : [
                                                    'Pontualidade nas aulas/atividades',
                                                    'Rendimento Acadêmico',
                                                    'Relação com Professor/Colegas',
                                                    'Comportamento'
                                                ]).map((criterio, idx) => {
                                                    const btnConfig = getAutoAvaliacaoButtonConfig(autoAvaliacao[idx]);
                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-5 font-bold text-slate-700">{criterio}</td>
                                                            <td className="px-6 py-5 text-center">
                                                                <button
                                                                    onClick={() => handleAutoAvaliacaoToggle(idx)}
                                                                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-95 ${btnConfig.classes}`}
                                                                >
                                                                    {btnConfig.text}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2 */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {isInfantil ? '2. COMPROMISSOS DA FAMÍLIA' : '2. COMPROMISSOS DA TURMA'}
                                </h3>
                                <textarea
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 placeholder:text-slate-400 min-h-[140px] resize-y"
                                    placeholder={isInfantil ? "Quais compromissos a família assume para o próximo período?" : "Quais ações e compromissos a turma assume para o próximo período?"}
                                ></textarea>
                            </div>

                            {/* Section 3 */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {isInfantil ? '3. OBSERVAÇÕES E SUGESTÕES (PEDAGÓGICAS/ESTRUTURAIS)' : '3. OUTRAS QUESTÕES (PEDAGÓGICAS/ESTRUTURAIS)'}
                                </h3>
                                <textarea
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 placeholder:text-slate-400 min-h-[140px] resize-y"
                                    placeholder={isInfantil ? "Sugestões sobre o ambiente escolar, rotina, suporte pedagógico, etc." : "Observações sobre o ambiente escolar, recursos, suporte pedagógico, etc."}
                                ></textarea>
                            </div>

                        </div>
                    </div>
                )}

                {/* Etapa 4 - REGISTRO DE PRESENÇA E ASSINATURAS */}
                {currentStep === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Title bar of the step */}
                        <div className="bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-sm flex items-center justify-between font-bold">
                            <div className="flex items-center gap-3 text-sm md:text-base tracking-wide">
                                <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
                                ETAPA 4: REGISTRO DE PRESENÇA E ASSINATURAS
                            </div>
                            <div className="bg-emerald-400/50 text-white text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider font-bold hidden md:block">
                                CONCLUSÃO DA REUNIÃO
                            </div>
                        </div>

                        {/* Content Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">

                            {/* Header inside card */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    LISTA DE ESTUDANTES PARTICIPANTES
                                </h3>
                                <button className="flex items-center gap-2 text-emerald-600 font-bold text-xs hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                                    <UserPlus className="w-4 h-4" />
                                    Adicionar Outro Estudante
                                </button>
                            </div>

                            {/* List Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-slate-400 uppercase font-bold tracking-wider border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-4 w-16">Nº</th>
                                            <th className="px-4 py-4">Nome do Estudante</th>
                                            <th className="px-4 py-4 text-right">Assinatura Digital</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                        {isLoadingEstudantes ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-10 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                                        <span className="text-slate-400 font-medium">Carregando estudantes...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : estudantes.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-10 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                            <Users className="w-6 h-6" />
                                                        </div>
                                                        <span className="text-slate-400 font-medium">Nenhum estudante encontrado para esta turma.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            estudantes.map((student, idx) => (
                                                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-5 font-bold text-slate-400">
                                                        {(idx + 1).toString().padStart(2, '0')}
                                                    </td>
                                                    <td className="px-4 py-5 font-medium text-slate-700">
                                                        {student.name}
                                                    </td>
                                                    <td className="px-4 py-5 text-right">
                                                        {student.status_assinatura === 'signed' ? (
                                                            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-xs font-bold border border-emerald-100">
                                                                <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                                                                ASSINADO
                                                            </div>
                                                        ) : (
                                                            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border border-emerald-500 text-emerald-600 hover:bg-emerald-50 transition-colors">
                                                                <PenLine className="w-4 h-4" strokeWidth={2} />
                                                                Coletar Assinatura Digital
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Summary */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
                                <div className="flex items-center gap-8 border-r border-slate-200 pr-8">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total de Alunos na Turma</div>
                                        <div className="text-2xl font-black text-slate-700">{estudantes.length.toString().padStart(2, '0')}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Presentes Registrados</div>
                                        <div className="text-2xl font-black text-emerald-500">
                                            {estudantes.filter((s: any) => s.status_assinatura === 'signed').length.toString().padStart(2, '0')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                                        <Info className="w-4 h-4" strokeWidth={2.5} />
                                    </div>
                                    <span className="italic">Os estudantes devem assinar utilizando o touchscreen ou mouse.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* General Footer Navigation - Separated Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    {currentStep > 1 && (
                        <button
                            onClick={handlePrevious}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors font-bold text-sm shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Anterior
                        </button>
                    )}
                </div>

                <div className="flex w-full md:w-auto items-center gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors font-bold text-sm shadow-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={currentStep < 4 ? handleNext : () => { }}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all text-white shadow-sm
                            ${currentStep < 4 ? 'bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 shadow-emerald-500/20 border border-emerald-600/20' : 'bg-slate-800 hover:bg-slate-900'}
                        `}
                    >
                        {currentStep < 4 ? (
                            <>
                                Próximo
                                <ArrowRight className="w-4 h-4" />
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Finalizar e Gerar Ata
                            </>
                        )}
                    </button>
                </div>
            </div>

        </div>
    );
};
