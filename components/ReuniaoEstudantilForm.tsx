import React, { useState } from 'react';
import { Printer, BookOpen, ClipboardList, CalendarClock, Info, ArrowLeft, ArrowRight, Save, LayoutTemplate, School, Calendar, FileText, X, Users, CheckCircle2, Lock, Send, BarChart3, Hand, CheckSquare, MessageCircle, AlertTriangle, UserPlus, PenLine } from 'lucide-react';

interface ReuniaoEstudantilFormProps {
    onClose?: () => void;
}

export const ReuniaoEstudantilForm: React.FC<ReuniaoEstudantilFormProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [autoAvaliacao, setAutoAvaliacao] = useState<{ [key: number]: string }>({});

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
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                                        placeholder="Informe o nome completo da escola"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5" /> TURMA / AGRUPAMENTO
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                                            placeholder="Ex: 9º Ano B"
                                        />
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
                                ETAPA 2: COMPONENTES CURRICULARES (BNCC)
                            </div>
                            <div className="bg-white/20 text-white text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider font-bold hidden md:block">
                                Foco na Aprendizagem
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
                                    Marque a coluna <strong>Dificuldade</strong> para os componentes onde a turma encontrou obstáculos e detalhe os motivos e sugestões.
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-bold w-48 tracking-wider">Áreas de Conhecimento</th>
                                            <th className="px-6 py-4 font-bold w-48 tracking-wider">Componentes</th>
                                            <th className="px-6 py-4 font-bold text-center w-32 tracking-wider">Dificuldade</th>
                                            <th className="px-6 py-4 font-bold min-w-[200px] tracking-wider">Por Quê? (Motivos)</th>
                                            <th className="px-6 py-4 font-bold min-w-[200px] tracking-wider">Sugestões de Melhoria</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
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
                                    1. AUTOAVALIAÇÃO DA TURMA
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
                                                {[
                                                    'Pontualidade nas aulas/atividades',
                                                    'Rendimento Acadêmico',
                                                    'Relação com Professor/Colegas',
                                                    'Comportamento'
                                                ].map((criterio, idx) => {
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
                                    2. COMPROMISSOS DA TURMA
                                </h3>
                                <textarea
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 placeholder:text-slate-400 min-h-[140px] resize-y"
                                    placeholder="Quais ações e compromissos a turma assume para o próximo período?"
                                ></textarea>
                            </div>

                            {/* Section 3 */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    3. OUTRAS QUESTÕES (PEDAGÓGICAS/ESTRUTURAIS)
                                </h3>
                                <textarea
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 placeholder:text-slate-400 min-h-[140px] resize-y"
                                    placeholder="Observações sobre o ambiente escolar, recursos, suporte pedagógico, etc."
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
                                        {[
                                            { n: '01', nome: 'Ana Beatriz Silva', status: 'pending', active: true },
                                            { n: '02', nome: 'Carlos Eduardo Oliveira', status: 'signed', active: true },
                                            { n: '03', nome: 'Nome completo do estudante', status: 'pending', active: false },
                                            { n: '04', nome: 'Nome completo do estudante', status: 'pending', active: false },
                                        ].map((student, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className={`px-4 py-5 font-bold ${student.active ? 'text-slate-400' : 'text-slate-300'}`}>{student.n}</td>
                                                <td className={`px-4 py-5 ${student.active ? 'font-medium text-slate-700' : 'font-medium text-slate-300'}`}>{student.nome}</td>
                                                <td className="px-4 py-5 text-right">
                                                    {student.status === 'signed' ? (
                                                        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-xs font-bold border border-emerald-100">
                                                            <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                                                            ASSINADO
                                                        </div>
                                                    ) : (
                                                        <button className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${student.active ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50' : 'border-emerald-300 text-emerald-400 hover:bg-emerald-50'}`}>
                                                            <PenLine className="w-4 h-4" strokeWidth={2} />
                                                            Coletar Assinatura Digital
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Summary */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
                                <div className="flex items-center gap-8 border-r border-slate-200 pr-8">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total de Alunos na Turma</div>
                                        <div className="text-2xl font-black text-slate-700">32</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Presentes Registrados</div>
                                        <div className="text-2xl font-black text-emerald-500">02</div>
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
