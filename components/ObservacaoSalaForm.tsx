import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, X, CheckSquare, Square, Building2, Edit, Printer, Trash2 } from 'lucide-react';

interface ObservacaoSalaFormProps {
    onClose: () => void;
    professor: {
        id: string;
        nome: string;
        etapa: string;
    };
    escolasVinculadas: { id: string; nome: string }[];
}

export const ObservacaoSalaForm: React.FC<ObservacaoSalaFormProps> = ({ onClose, professor, escolasVinculadas }) => {
    const [step, setStep] = useState(1);
    const [escolaSelecionada, setEscolaSelecionada] = useState(escolasVinculadas.length === 1 ? escolasVinculadas[0].id : '');
    const [observacaoEscola, setObservacaoEscola] = useState(false); // Validar se a escola foi escolhida

    // Validar se a escola foi escolhida
    const isInfantil = professor.etapa.toLowerCase().includes('infantil');

    // Formulário de Educação Infantil e Ensino Fundamental
    type RespostaType = 'SIM' | 'NÃO' | 'PARCIALMENTE';
    const [respostas, setRespostas] = useState<Record<string, RespostaType>>({});
    const [observacoesAdicionais, setObservacoesAdicionais] = useState<Record<number, string>>({});
    const [registroCoordenador, setRegistroCoordenador] = useState({
        pontosFortes: '',
        pontosMelhoria: '',
        encaminhamentos: '',
        dataRetorno: '',
        statusPlano: 'Aguardando Início'
    });

    const cycleResposta = (id: string) => {
        setRespostas(prev => {
            const current = prev[id];
            if (!current) return { ...prev, [id]: 'SIM' };
            if (current === 'SIM') return { ...prev, [id]: 'NÃO' };
            if (current === 'NÃO') return { ...prev, [id]: 'PARCIALMENTE' };
            const newState = { ...prev };
            delete newState[id]; // Volta ao estado inicial
            return newState;
        });
    };

    // Mock history data for demonstration
    const mockHistorico = [
        { id: 1, dataObservacao: '15/08/2023', dataRetorno: '30/08/2023', status: 'Concluído' },
        { id: 2, dataObservacao: '12/10/2023', dataRetorno: '26/10/2023', status: 'Aguardando Início' },
    ];

    const handleNext = () => {
        if (step === 1 && escolasVinculadas.length > 1 && !escolaSelecionada) {
            setObservacaoEscola(true);
            return;
        }
        if (step < 6) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const progress = (step / 6) * 100;

    const renderCheckboxItem = (id: string, label: string) => {
        const status = respostas[id];
        let bg = 'bg-white border-slate-200';
        let text = 'text-slate-600';
        let badgeBg = 'bg-slate-100 text-slate-500';
        let icon = null;

        if (status === 'SIM') {
            bg = 'bg-emerald-50/50 border-emerald-500';
            text = 'text-emerald-900';
            badgeBg = 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20';
            icon = <Check className="w-3.5 h-3.5" />;
        } else if (status === 'NÃO') {
            bg = 'bg-rose-50/50 border-rose-500';
            text = 'text-rose-900';
            badgeBg = 'bg-rose-500 text-white shadow-sm shadow-rose-500/20';
            icon = <X className="w-3.5 h-3.5" />;
        } else if (status === 'PARCIALMENTE') {
            bg = 'bg-amber-50/50 border-amber-500';
            text = 'text-amber-900';
            badgeBg = 'bg-amber-500 text-white shadow-sm shadow-amber-500/20';
            icon = <span className="font-black text-sm leading-none mt-[-2px]">-</span>;
        }

        return (
            <button
                key={id}
                onClick={() => cycleResposta(id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${bg}`}
            >
                <span className={`text-sm font-bold flex-1 pr-4 ${text}`}>
                    {label}
                </span>
                <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors ${badgeBg}`}>
                    {status ? (
                        <>
                            {icon}
                            {status}
                        </>
                    ) : (
                        'AVALIAR'
                    )}
                </div>
            </button>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                {/* Header Section */}
                <div className="bg-white border-b border-slate-200 p-6 flex flex-col gap-6 flex-shrink-0">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-lg uppercase">
                                {professor.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-lg">{professor.nome}</h3>
                                <p className="text-sm text-slate-500 font-medium">
                                    {professor.etapa} &bull; {escolaSelecionada ? escolasVinculadas.find(e => e.id === escolaSelecionada)?.nome : 'Múltiplas Escolas'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">DATA DA OBSERVAÇÃO</span>
                            <span className="text-sm font-bold text-slate-800">
                                {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1 block">
                                ETAPA {step} DE 6
                            </span>
                            <h2 className="text-2xl font-black text-slate-800">
                                {step === 1 && '1. Aspectos Organizacionais'}
                                {step === 2 && '2. Aspectos Pedagógicos'}
                                {step === 3 && '3. Relação Professor-Aluno'}
                                {step === 4 && '4. Avaliação da Aprendizagem'}
                                {step === 5 && '5. Indicadores de Impacto'}
                                {step === 6 && '6. Registro do Coordenador'}
                            </h2>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="text-sm font-bold text-slate-500">{Math.round(progress)}% concluído</span>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* School Selection (Only on Step 1 if multiple schools) */}
                    {step === 1 && escolasVinculadas.length > 1 && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Local da Observação</h3>
                                    <p className="text-sm text-slate-500">Este professor atua em mais de uma unidade.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {escolasVinculadas.map(esc => (
                                    <button
                                        key={esc.id}
                                        onClick={() => {
                                            setEscolaSelecionada(esc.id);
                                            setObservacaoEscola(false);
                                        }}
                                        className={`p-4 border-2 rounded-xl text-left font-bold text-sm transition-all ${escolaSelecionada === esc.id
                                            ? 'border-blue-500 bg-blue-50/50 text-blue-800'
                                            : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                                            }`}
                                    >
                                        {esc.nome}
                                    </button>
                                ))}
                            </div>
                            {observacaoEscola && (
                                <p className="text-sm font-bold text-red-500 mt-2">Por favor, selecione a escola onde ocorreu a observação.</p>
                            )}
                        </div>
                    )}

                    {step === 1 && (
                        <>
                            {/* 1.1 Planejamento */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-black">1.1</span>
                                    <h3 className="text-lg font-bold text-slate-800">Planejamento</h3>
                                </div>
                                <div className="space-y-3">
                                    {isInfantil ? (
                                        <>
                                            {renderCheckboxItem('p1', 'Apresenta planejamento alinhado aos Campos de Experiência e à BNCC')}
                                            {renderCheckboxItem('p2', 'Define objetivos claros adequados à faixa etária')}
                                            {renderCheckboxItem('p3', 'Explicita intencionalidade pedagógica nas propostas')}
                                            {renderCheckboxItem('p4', 'Organiza a rotina diária (acolhida, roda, exploração, lanche, parque)')}
                                            {renderCheckboxItem('p5', 'Prepara materiais e experiências adequadas ao desenvolvimento infantil')}
                                            {renderCheckboxItem('p6', 'Prevê registros de acompanhamento das crianças')}
                                            {renderCheckboxItem('p7', 'Planejamento estruturado por Campos de Experiência')}
                                            {renderCheckboxItem('p8', 'Aprendizagem mediada por interações e brincadeiras')}
                                            {renderCheckboxItem('p9', 'Organização equilibrada entre atividades dirigidas e livres')}
                                        </>
                                    ) : (
                                        <>
                                            {renderCheckboxItem('p1_ef', 'Plano alinhado ao Plano de Curso e à BNCC')}
                                            {renderCheckboxItem('p2_ef', 'Objetivos de aprendizagem claros (habilidades)')}
                                            {renderCheckboxItem('p3_ef', 'Estratégias diferenciadas previstas')}
                                            {renderCheckboxItem('p4_ef', 'Organização equilibrada do tempo pedagógico')}
                                            {renderCheckboxItem('p5_ef', 'Recursos didáticos adequados')}
                                            {renderCheckboxItem('p6_ef', 'Instrumentos de avaliação coerentes')}
                                            <div className="mt-4 mb-2">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ensino Fundamental – Anos Iniciais</h4>
                                            </div>
                                            {renderCheckboxItem('p7_ef', 'Foco em alfabetização/letramento')}
                                            {renderCheckboxItem('p8_ef', 'Estratégias de recomposição previstas')}
                                            {renderCheckboxItem('p9_ef', 'Uso de sequências didáticas')}
                                            <div className="mt-4 mb-2">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ensino Fundamental – Anos Finais</h4>
                                            </div>
                                            {renderCheckboxItem('p10_ef', 'Progressão conceitual estruturada')}
                                            {renderCheckboxItem('p11_ef', 'Metodologias ativas quando pertinente')}
                                            {renderCheckboxItem('p12_ef', 'Articulação entre conteúdos e competências')}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* 1.2 Organização do Ambiente */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-black">1.2</span>
                                    <h3 className="text-lg font-bold text-slate-800">Organização do Ambiente</h3>
                                </div>
                                <div className="space-y-3">
                                    {isInfantil ? (
                                        <>
                                            {renderCheckboxItem('oa1', 'Espaço organizado e funcional')}
                                            {renderCheckboxItem('oa2', 'Cantinhos pedagógicos estruturados')}
                                            {renderCheckboxItem('oa3', 'Materiais manipuláveis acessíveis')}
                                            {renderCheckboxItem('oa4', 'Ambiente acolhedor, seguro e estimulante')}
                                            {renderCheckboxItem('oa5', 'Uso de diferentes espaços (pátio, parque, biblioteca)')}
                                        </>
                                    ) : (
                                        <>
                                            {renderCheckboxItem('oa1_ef', 'Sala organizada e funcional')}
                                            {renderCheckboxItem('oa2_ef', 'Recursos visuais pedagógicos expostos')}
                                            {renderCheckboxItem('oa3_ef', 'Materiais acessíveis')}
                                            {renderCheckboxItem('oa4_ef', 'Uso de espaços diversificados')}
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {/* 2.1 Desenvolvimento da Aula */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-black">2.1</span>
                                    <h3 className="text-lg font-bold text-slate-800">Desenvolvimento da Aula</h3>
                                </div>
                                <div className="space-y-3">
                                    {isInfantil ? (
                                        <>
                                            {renderCheckboxItem('da1', 'Estimula oralidade e expressão')}
                                            {renderCheckboxItem('da2', 'Promove experiências sensoriais')}
                                            {renderCheckboxItem('da3', 'Incentiva autonomia e protagonismo')}
                                            {renderCheckboxItem('da4', 'Media conflitos pedagogicamente')}
                                            {renderCheckboxItem('da5', 'Respeita o ritmo individual das crianças')}
                                            {renderCheckboxItem('da6', 'Observa e intervém com intencionalidade')}
                                        </>
                                    ) : (
                                        <>
                                            {renderCheckboxItem('da1_ef', 'Retoma conhecimentos prévios')}
                                            {renderCheckboxItem('da2_ef', 'Explica objetivos da aula')}
                                            {renderCheckboxItem('da3_ef', 'Apresentação clara e estruturada')}
                                            {renderCheckboxItem('da4_ef', 'Estratégias diversificadas')}
                                            {renderCheckboxItem('da5_ef', 'Participação ativa dos estudantes')}
                                            {renderCheckboxItem('da6_ef', 'Intervenções pedagógicas qualificadas')}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* 2.2 Alfabetização e Linguagem / Recomposição */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-black">2.2</span>
                                    <h3 className="text-lg font-bold text-slate-800">
                                        {isInfantil ? 'Alfabetização e Linguagem (Pré-escola)' : 'Alfabetização e Recomposição (quando aplicável)'}
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {isInfantil ? (
                                        <>
                                            {renderCheckboxItem('al1', 'Trabalha consciência fonológica de forma lúdica')}
                                            {renderCheckboxItem('al2', 'Desenvolve contato significativo com textos')}
                                            {renderCheckboxItem('al3', 'Incentiva produção oral e registros espontâneos')}
                                        </>
                                    ) : (
                                        <>
                                            {renderCheckboxItem('ar1_ef', 'Consciência fonológica (1º/2º ano)')}
                                            {renderCheckboxItem('ar2_ef', 'Desenvolvimento da fluência leitora')}
                                            {renderCheckboxItem('ar3_ef', 'Trabalho com compreensão textual')}
                                            {renderCheckboxItem('ar4_ef', 'Diferenciação por nível')}
                                            {renderCheckboxItem('ar5_ef', 'Uso de dados diagnósticos (SAMAHC)')}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* 2.3 Metodologias e Recursos */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-black">2.3</span>
                                    <h3 className="text-lg font-bold text-slate-800">Metodologias e Recursos</h3>
                                </div>
                                <div className="space-y-3">
                                    {isInfantil ? (
                                        <>
                                            {renderCheckboxItem('mr1', 'Aprendizagem baseada em brincadeira')}
                                            {renderCheckboxItem('mr2', 'Exploração corporal e sensorial')}
                                            {renderCheckboxItem('mr3', 'Interações qualificadas adulto-criança')}
                                            {renderCheckboxItem('mr4', 'Integração entre diferentes campos de experiência')}
                                        </>
                                    ) : (
                                        <>
                                            {renderCheckboxItem('mr1_ef', 'Uso de recursos além do livro didático')}
                                            {renderCheckboxItem('mr2_ef', 'Resolução de problemas (Matemática)')}
                                            {renderCheckboxItem('mr3_ef', 'Leitura significativa')}
                                            {renderCheckboxItem('mr4_ef', 'Integra teoria e prática')}
                                            {renderCheckboxItem('mr5_ef', 'Aprendizagem colaborativa')}
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            {/* 3. Relação Professor-Aluno */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-black">3</span>
                                    <h3 className="text-lg font-bold text-slate-800">Relação Professor-Aluno</h3>
                                </div>
                                <div className="space-y-3">
                                    {isInfantil ? (
                                        <>
                                            {renderCheckboxItem('rpa1', 'Postura ética e respeitosa')}
                                            {renderCheckboxItem('rpa2', 'Afetividade e escuta sensível')}
                                            {renderCheckboxItem('rpa3', 'Ambiente emocionalmente seguro')}
                                            {renderCheckboxItem('rpa4', 'Incentivo à expressão e autonomia')}
                                            {renderCheckboxItem('rpa5', 'Respeito ao ritmo infantil')}
                                        </>
                                    ) : (
                                        <>
                                            {renderCheckboxItem('rpa1_ef', 'Postura ética e respeitosa')}
                                            {renderCheckboxItem('rpa2_ef', 'Ambiente emocionalmente seguro')}
                                            {renderCheckboxItem('rpa3_ef', 'Estimula autonomia')}
                                            {renderCheckboxItem('rpa4_ef', 'Valoriza participação')}
                                            {renderCheckboxItem('rpa5_ef', 'Media conflitos pedagogicamente')}
                                            {renderCheckboxItem('rpa6_ef', 'Estabelece combinados claros')}
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {step === 4 && (
                        <>
                            {/* 4. Avaliação da Aprendizagem */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-black">4</span>
                                    <h3 className="text-lg font-bold text-slate-800">Avaliação da Aprendizagem</h3>
                                </div>
                                <div className="space-y-3">
                                    {isInfantil ? (
                                        <>
                                            {renderCheckboxItem('aa1', 'Observação sistemática')}
                                            {renderCheckboxItem('aa2', 'Registros descritivos organizados')}
                                            {renderCheckboxItem('aa3', 'Portfólio atualizado')}
                                            {renderCheckboxItem('aa4', 'Replanejamento com base nas observações')}
                                        </>
                                    ) : (
                                        <>
                                            {renderCheckboxItem('aa1_ef', 'Avaliação contínua e formativa')}
                                            {renderCheckboxItem('aa2_ef', 'Registros organizados')}
                                            {renderCheckboxItem('aa3_ef', 'Devolutiva construtiva')}
                                            {renderCheckboxItem('aa4_ef', 'Replanejamento com base nos resultados')}
                                            {renderCheckboxItem('aa5_ef', 'Instrumentos variados (provas, rubricas, projetos)')}
                                            {renderCheckboxItem('aa6_ef', 'Análise de erros como estratégia pedagógica')}
                                            {renderCheckboxItem('aa7_ef', 'Monitoramento de metas (especialmente alfabetização)')}
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {step === 5 && (
                        <>
                            {/* 5. Indicadores de Impacto */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-black">5</span>
                                    <h3 className="text-lg font-bold text-slate-800">Indicadores de Impacto</h3>
                                </div>
                                <div className="space-y-3">
                                    {isInfantil ? (
                                        <>
                                            {renderCheckboxItem('ii1', 'Participação ativa das crianças')}
                                            {renderCheckboxItem('ii2', 'Evidência de desenvolvimento nas interações')}
                                            {renderCheckboxItem('ii3', 'Coerência entre planejamento e prática')}
                                            {renderCheckboxItem('ii4', 'Adequação das propostas à faixa etária')}
                                        </>
                                    ) : (
                                        <>
                                            {renderCheckboxItem('ii1_ef', 'Participação ativa dos estudantes')}
                                            {renderCheckboxItem('ii2_ef', 'Evidência de aprendizagem durante a aula')}
                                            {renderCheckboxItem('ii3_ef', 'Clareza na devolutiva')}
                                            {renderCheckboxItem('ii4_ef', 'Coerência entre planejamento e execução')}
                                            {renderCheckboxItem('ii5_ef', 'Adequação ao nível real da turma')}
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {step === 6 && (
                        <>
                            {/* 6. Registro do Coordenador */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-black">6</span>
                                    <h3 className="text-lg font-bold text-slate-800">Registro do Coordenador</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Pontos Fortes Observados</label>
                                        <textarea
                                            value={registroCoordenador.pontosFortes}
                                            onChange={(e) => setRegistroCoordenador({ ...registroCoordenador, pontosFortes: e.target.value })}
                                            className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                            placeholder="Descreva as fortalezas do professor na regência..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Pontos de Melhoria</label>
                                        <textarea
                                            value={registroCoordenador.pontosMelhoria}
                                            onChange={(e) => setRegistroCoordenador({ ...registroCoordenador, pontosMelhoria: e.target.value })}
                                            className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                            placeholder="Identifique as oportunidades de aprimoramento pedagógico..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Encaminhamentos (com prazo)</label>
                                        <textarea
                                            value={registroCoordenador.encaminhamentos}
                                            onChange={(e) => setRegistroCoordenador({ ...registroCoordenador, encaminhamentos: e.target.value })}
                                            className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                            placeholder="Ex: Refatorar o planejamento para a próxima quinzena."
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Data do Retorno/Acompanhamento</label>
                                            <input
                                                type="date"
                                                value={registroCoordenador.dataRetorno}
                                                onChange={(e) => setRegistroCoordenador({ ...registroCoordenador, dataRetorno: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Status do Plano</label>
                                            <select
                                                value={registroCoordenador.statusPlano}
                                                onChange={(e) => setRegistroCoordenador({ ...registroCoordenador, statusPlano: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            >
                                                <option value="Aguardando Início">Aguardando Início</option>
                                                <option value="Concluído">Concluído</option>
                                                <option value="Rascunho">Rascunho</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Observation History Table */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
                                <h3 className="text-sm font-bold text-slate-800 mb-4 tracking-wider uppercase">Histórico de Observações</h3>
                                <div className="overflow-hidden border border-slate-200 rounded-xl">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <th className="p-4 py-3">Data da Observação</th>
                                                <th className="p-4 py-3">Data do Retorno/Acompanhamento</th>
                                                <th className="p-4 py-3">Status</th>
                                                <th className="p-4 py-3 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {mockHistorico.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 text-sm font-bold text-slate-700">{item.dataObservacao}</td>
                                                    <td className="p-4 text-sm font-medium text-slate-600">{item.dataRetorno}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${item.status === 'Concluído'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 flex items-center justify-end gap-2">
                                                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Imprimir">
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Excluir">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {step < 6 && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Observações Adicionais (Etapa {step})</label>
                            <textarea
                                value={observacoesAdicionais[step] || ''}
                                onChange={(e) => setObservacoesAdicionais({ ...observacoesAdicionais, [step]: e.target.value })}
                                className="w-full h-24 bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                placeholder="Descreva aqui pontos relevantes observados nesta etapa..."
                            />
                        </div>
                    )}
                </div>

                {/* Footer / Navigation Actions */}
                <div className="bg-white border-t border-slate-200 p-6 flex items-center justify-between flex-shrink-0">
                    <button
                        onClick={handleBack}
                        disabled={step === 1}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${step === 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                            }`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                    </button>

                    <div className="flex items-center gap-3">
                        <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all hidden sm:block">
                            Salvar Rascunho
                        </button>
                        <button
                            onClick={step === 6 ? onClose : handleNext}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                        >
                            {step === 6 ? 'Finalizar Relatório' : 'Próximo'}
                            {step < 6 && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
