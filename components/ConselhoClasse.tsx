import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Users, BookOpen, UserCheck, AlertTriangle, GraduationCap, Edit, Trash2, Calendar, Hand, Book, CheckSquare, MessageCircle, Search, Printer, Lock, Send, CheckCircle2, FileText, LayoutDashboard, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, AlertCircle, FileDown, Download, Baby, School, ArrowRight } from 'lucide-react';
import { CadastroTurmaModal, TurmaData } from './modals/CadastroTurmaModal';
import { StudentReportModal } from './modals/StudentReportModal';
import { CadastroEstudanteModal } from './modals/CadastroEstudanteModal';
import { ReuniaoEstudantilForm } from './ReuniaoEstudantilForm';
import { ccAvaliacaoDocenteService, ccAcompanhamentoDocenteService, ccEncaminhamentosService, ccAvaliacaoEtapaService, ccSolicitacaoDesbloqueioService, ccAvaliacaoInfantilService, ccEstudanteService, ccTurmaService } from '../services/gestaoConselhoService';
import { PrintableConselhoReport } from './PrintableConselhoReport';
import { Escola, Segmento, Coordenador } from '../types';

const BNCC_INFANTIL = {
    'O EU, O OUTRO E O NÓS': {
        'Crianças bem pequenas': [
            { code: 'EI02EO01', short: 'Cuidado e Solidariedade', desc: 'Demonstrar atitudes de cuidado e solidariedade na interação com crianças e adultos.' },
            { code: 'EI02EO02', short: 'Imagem Positiva e Confiança', desc: 'Demonstrar imagem positiva de si e confiança em sua capacidade para enfrentar dificuldades e desafios.' },
            { code: 'EI02EO03', short: 'Compartilhar e Interagir', desc: 'Compartilhar os objetos e os espaços com crianças da mesma faixa etária e adultos.' },
            { code: 'EI02EO04', short: 'Comunicação', desc: 'Comunicar-se com os colegas e os adultos, buscando compreendê-los e fazendo-se compreender.' },
            { code: 'EI02EO05', short: 'Respeito às Diferenças', desc: 'Perceber que as pessoas têm características físicas diferentes, respeitando essas diferenças.' },
            { code: 'EI02EO06', short: 'Regras de Convívio', desc: 'Respeitar regras básicas de convívio social nas interações e brincadeiras.' },
            { code: 'EI02EO07', short: 'Resolução de Conflitos', desc: 'Resolver conflitos nas interações e brincadeiras, com a orientação de um adulto.' },
        ],
        'Crianças pequenas': [
            { code: 'EI03EO01', short: 'Empatia e Respeito', desc: 'Demonstrar empatia pelos outros, percebendo que as pessoas têm diferentes sentimentos.' },
            { code: 'EI03EO02', short: 'Independência e Confiança', desc: 'Agir de maneira independente, com confiança em suas capacidades.' },
            { code: 'EI03EO03', short: 'Relações Interpessoais', desc: 'Ampliar as relações interpessoais, desenvolvendo atitudes de participação e cooperação.' },
            { code: 'EI03EO04', short: 'Comunicação de Ideias', desc: 'Comunicar suas ideias e sentimentos a pessoas e grupos diversos.' },
            { code: 'EI03EO05', short: 'Valorização e Respeito', desc: 'Demonstrar valorização das características do seu corpo e respeitar as dos outros.' },
            { code: 'EI03EO06', short: 'Culturas e Modos de Vida', desc: 'Manifestar interesse e respeito por diferentes culturas e modos de vida.' },
            { code: 'EI03EO07', short: 'Resolução de Conflitos', desc: 'Usar estratégias pautadas no respeito mútuo para lidar com conflitos.' },
        ]
    },
    'CORPO, GESTOS E MOVIMENTOS': {
        'Crianças bem pequenas': [
            { code: 'EI02CG01', short: 'Gestos e Movimentos', desc: 'Apropriar-se de gestos e movimentos de sua cultura.' },
            { code: 'EI02CG02', short: 'Deslocamento e Orientação', desc: 'Deslocar-se seu corpo no espaço, orientando-se por noções espaciais.' },
            { code: 'EI02CG03', short: 'Exploração de Movimentos', desc: 'Explorar formas de deslocamento no espaço, combinando movimentos.' },
            { code: 'EI02CG04', short: 'Independência no Cuidado', desc: 'Demonstrar progressiva independência no cuidado do seu corpo.' },
            { code: 'EI02CG05', short: 'Habilidades Manuais', desc: 'Desenvolver progressivamente as habilidades manuais.' },
        ],
        'Crianças pequenas': [
            { code: 'EI03CG01', short: 'Expressão Corporal', desc: 'Criar com o corpo formas diversificadas de expressão de sentimentos, sensações e emoções.' },
            { code: 'EI03CG02', short: 'Controle Corporal', desc: 'Demonstrar controle e adequação do uso de seu corpo em brincadeiras e jogos.' },
            { code: 'EI03CG03', short: 'Criação de Movimentos', desc: 'Criar movimentos, gestos, olhares e mímicas em brincadeiras.' },
            { code: 'EI03CG04', short: 'Hábitos de Autocuidado', desc: 'Adotar hábitos de autocuidado relacionados a higiene, alimentação e conforto.' },
            { code: 'EI03CG05', short: 'Coordenação Manual', desc: 'Coordenar suas habilidades manuais no atendimento adequado a seus interesses.' },
        ]
    },
    'TRAÇOS, SONS, CORES E FORMAS': {
        'Crianças bem pequenas': [
            { code: 'EI02TS01', short: 'Criação Sonora', desc: 'Criar sons com materiais, objetos e instrumentos musicais.' },
            { code: 'EI02TS02', short: 'Exploração de Materiais', desc: 'Utilizar materiais variados com possibilidades de manipulação explorando cores e texturas.' },
            { code: 'EI02TS03', short: 'Fontes Sonoras', desc: 'Utilizar diferentes fontes sonoras disponíveis no ambiente.' },
        ],
        'Crianças pequenas': [
            { code: 'EI03TS01', short: 'Produção Sonora', desc: 'Utilizar sons produzidos por materiais, objetos e instrumentos musicais.' },
            { code: 'EI03TS02', short: 'Expressão Artística', desc: 'Expressar-se livremente por meio de desenho, pintura, colagem, dobradura e escultura.' },
            { code: 'EI03TS03', short: 'Qualidades do Som', desc: 'Reconhecer as qualidades do som (intensidade, duração, altura e timbre).' },
        ]
    },
    'ESCUTA, FALA, PENSAMENTO E IMAGINAÇÃO': {
        'Crianças bem pequenas': [
            { code: 'EI02EF01', short: 'Diálogo e Expressão', desc: 'Dialogar com crianças e adultos, expressando seus desejos, necessidades, sentimentos e opiniões.' },
            { code: 'EI02EF02', short: 'Sons e Rimas', desc: 'Identificar e criar diferentes sons e reconhecer rimas e aliterações.' },
            { code: 'EI02EF03', short: 'Interesse pela Leitura', desc: 'Demonstrar interesse e atenção ao ouvir a leitura de histórias e outros textos.' },
            { code: 'EI02EF04', short: 'Compreensão de Histórias', desc: 'Formular e responder perguntas sobre fatos da história narrada.' },
            { code: 'EI02EF05', short: 'Relato de Experiências', desc: 'Relatar experiências e fatos acontecidos, histórias ouvidas, filmes ou peças teatrais assistidos.' },
            { code: 'EI02EF06', short: 'Criação de Histórias', desc: 'Criar e contar histórias oralmente, com base em imagens ou temas sugeridos.' },
            { code: 'EI02EF07', short: 'Manuseio de Textos', desc: 'Manusear diferentes portadores textuais, demonstrando reconhecer seus usos sociais.' },
            { code: 'EI02EF08', short: 'Gêneros Textuais', desc: 'Manipular textos e participar de situações de escuta.' },
            { code: 'EI02EF09', short: 'Suportes de Escrita', desc: 'Manusear instrumentos e suportes de escrita para desenhar, traçar letras e outros sinais gráficos.' },
        ],
        'Crianças pequenas': [
            { code: 'EI03EF01', short: 'Expressão de Ideias', desc: 'Expressar ideias, desejos e sentimentos sobre suas vivências.' },
            { code: 'EI03EF02', short: 'Invenção Musical/Poética', desc: 'Inventar brincadeiras cantadas, poemas e canções, criando rimas.' },
            { code: 'EI03EF03', short: 'Exploração de Livros', desc: 'Escolher e folhear livros, procurando orientar-se por temas e ilustrações.' },
            { code: 'EI03EF04', short: 'Reconto e Planej.', desc: 'Recontar histórias ouvidas e planejar coletivamente roteiros de vídeos.' },
            { code: 'EI03EF05', short: 'Reconto Escrito', desc: 'Recontar histórias ouvidas para produção de reconto escrito.' },
            { code: 'EI03EF06', short: 'Produção de Histórias', desc: 'Produzir suas próprias histórias orais e escritas.' },
            { code: 'EI03EF07', short: 'Hipóteses/Gêneros', desc: 'Levantar hipóteses sobre gêneros textuais veiculados em portadores conhecidos.' },
            { code: 'EI03EF08', short: 'Seleção de Textos', desc: 'Selecionar livros e textos de gêneros conhecidos para a leitura.' },
            { code: 'EI03EF09', short: 'Hipóteses de Escrita', desc: 'Levantar hipóteses em relação à linguagem escrita.' },
        ]
    },
    'ESPAÇOS, TEMPOS, QUANTIDADES, RELAÇÕES E TRANSFORMAÇÕES': {
        'Crianças bem pequenas': [
            { code: 'EI02ET01', short: 'Propriedades / Objetos', desc: 'Explorar e descrever semelhanças e diferenças entre objetos.' },
            { code: 'EI02ET02', short: 'Observação/Fenômenos', desc: 'Observar, relatar e descrever incidentes do cotidiano e fenômenos naturais.' },
            { code: 'EI02ET03', short: 'Cuidado da Natureza', desc: 'Compartilhar situações de cuidado de plantas e animais.' },
            { code: 'EI02ET04', short: 'Relações Espaciais', desc: 'Identificar relações espaciais e temporais.' },
            { code: 'EI02ET05', short: 'Classificação/Objetos', desc: 'Classificar objetos, considerando determinado atributo.' },
            { code: 'EI02ET06', short: 'Conceitos de Tempo', desc: 'Utilizar conceitos básicos de tempo.' },
            { code: 'EI02ET07', short: 'Contagem Oral', desc: 'Contar oralmente objetos, pessoas, livros etc., em contextos diversos.' },
            { code: 'EI02ET08', short: 'Registro Numérico', desc: 'Registrar com números a quantidade de crianças.' },
        ],
        'Crianças pequenas': [
            { code: 'EI03ET01', short: 'Comparação de Objetos', desc: 'Estabelecer relações de comparação entre objetos, observando suas propriedades.' },
            { code: 'EI03ET02', short: 'Mudanças em Materiais', desc: 'Observar e descrever mudanças em diferentes materiais.' },
            { code: 'EI03ET03', short: 'Fontes de Informação', desc: 'Identificar e selecionar fontes de informações para responder a questões sobre a natureza.' },
            { code: 'EI03ET04', short: 'Regs. de Observação', desc: 'Registrar observações, manipulações e medidas, usando múltiplas linguagens.' },
            { code: 'EI03ET05', short: 'Classif. Objetos/Fig.', desc: 'Classificar objetos e figuras de acordo com suas semelhanças e diferenças.' },
            { code: 'EI03ET06', short: 'Hist. Pessoal/Familiar', desc: 'Relatar fatos importantes sobre seu nascimento e desenvolvimento.' },
            { code: 'EI03ET07', short: 'Rel. Número-Quant.', desc: 'Relacionar números às suas respectivas quantidades.' },
            { code: 'EI03ET08', short: 'Medidas e Gráficos', desc: 'Expressar medidas, construindo gráficos básicos.' },
        ]
    }
};

type Tab = 'estudantil' | 'avaliacao' | 'acompanhamento' | 'encaminhamentos';

interface ConselhoClasseProps {
    escolas?: Escola[];
    isAdmin?: boolean;
    userEmail?: string | null;
    currentUser?: Coordenador | null;
    forcedEtapa?: 'fundamental' | 'infantil';
    externalSelectedEscolaId?: string;
    onEscolaChange?: (id: string) => void;
}

export const ConselhoClasse: React.FC<ConselhoClasseProps> = ({
    escolas = [],
    isAdmin = false,
    userEmail = null,
    currentUser = null,
    forcedEtapa,
    externalSelectedEscolaId,
    onEscolaChange
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('estudantil');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEscolaId, setSelectedEscolaId] = useState<string>(externalSelectedEscolaId || escolas[0]?.id || '');

    // Sync with external school ID
    useEffect(() => {
        if (externalSelectedEscolaId && externalSelectedEscolaId !== selectedEscolaId) {
            setSelectedEscolaId(externalSelectedEscolaId);
        }
    }, [externalSelectedEscolaId]);

    // Notify external parent of school change
    useEffect(() => {
        if (onEscolaChange && selectedEscolaId) {
            onEscolaChange(selectedEscolaId);
        }
    }, [selectedEscolaId, onEscolaChange]);

    // Get current school context
    const currentEscola = useMemo(() => {
        return escolas.find(e => e.id === selectedEscolaId) || escolas[0];
    }, [escolas, selectedEscolaId]);

    const currentEscolaId = currentEscola?.id || '';

    // Detectar etapas disponíveis na escola
    const schoolLevels = useMemo(() => {
        const segs = currentEscola?.segmentos || [];
        const hasInfantil = segs.includes(Segmento.INFANTIL);
        const hasFundamental = segs.includes(Segmento.FUNDAMENTAL_I) || segs.includes(Segmento.FUNDAMENTAL_II);
        return { hasInfantil, hasFundamental, hasBoth: hasInfantil && hasFundamental };
    }, [currentEscola]);

    const defaultEtapa = forcedEtapa || (schoolLevels.hasInfantil && !schoolLevels.hasFundamental ? 'infantil' : 'fundamental');
    const [acompEtapa, setAcompEtapa] = useState<'fundamental' | 'infantil'>(defaultEtapa);
    const [encEtapa, setEncEtapa] = useState<'fundamental' | 'infantil'>(defaultEtapa);

    // ============================================
    // ESTADOS: AVALIAÇÃO DOCENTE
    // ============================================
    const defaultAvaliacaoEtapa = forcedEtapa || (schoolLevels.hasInfantil && !schoolLevels.hasFundamental ? 'infantil' : 'fundamental');
    const [avaliacaoEtapa, setAvaliacaoEtapa] = useState<'fundamental' | 'infantil'>(defaultAvaliacaoEtapa);
    const [avaliacaoInfantilCampo, setAvaliacaoInfantilCampo] = useState('O EU, O OUTRO E O NÓS');
    const [avaliacaoBimestre, setAvaliacaoBimestre] = useState('Resultado Consolidado');
    const [selectedComponenteCurricular, setSelectedComponenteCurricular] = useState('Língua Portuguesa - BNCC');

    const COMPONENTES_CURRICULARES = [
        'Língua Portuguesa - BNCC',
        'Matemática - BNCC',
        'Ciências - BNCC',
        'Geografia - BNCC',
        'História - BNCC',
        'Educação Física - BNCC',
        'Arte - BNCC',
        'Ensino Religioso - BNCC',
        'Língua Inglesa - BNCC'
    ];
    const [isTurmaModalOpen, setIsTurmaModalOpen] = useState(false);
    const [isStudentReportOpen, setIsStudentReportOpen] = useState(false);
    const [activeStudentReport, setActiveStudentReport] = useState<any>(null);
    const [turmasCadastradas, setTurmasCadastradas] = useState<TurmaData[]>([]);
    const [activeTurma, setActiveTurma] = useState<TurmaData | null>(null);
    const [isLoadingTurmas, setIsLoadingTurmas] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    // Load turmas from DB when school changes
    useEffect(() => {
        const loadTurmas = async () => {
            if (!currentEscolaId) return;
            setIsLoadingTurmas(true);
            try {
                const turmas = await ccTurmaService.getBySchool(currentEscolaId);
                setTurmasCadastradas(turmas);
                if (turmas.length > 0) {
                    setActiveTurma(turmas[0]);
                } else {
                    setActiveTurma(null);
                }
            } catch (err) {
                console.error('Erro ao carregar turmas:', err);
            } finally {
                setIsLoadingTurmas(false);
            }
        };
        loadTurmas();
    }, [currentEscolaId]);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCadastroEstudanteOpen, setIsCadastroEstudanteOpen] = useState(false);

    // Sync active tabs based on selected class stage
    useEffect(() => {
        if (activeTurma?.etapa === 'Educação Infantil') {
            setAvaliacaoEtapa('infantil');
            setAcompEtapa('infantil');
            setEncEtapa('infantil');
        } else if (activeTurma) {
            setAvaliacaoEtapa('fundamental');
            setAcompEtapa('fundamental');
            setEncEtapa('fundamental');
        }
    }, [activeTurma]);

    const loadStudents = async () => {
        if (!activeTurma?.id) return [];
        setIsLoadingStudents(true);
        setLoadError(null);
        try {
            const data = await ccEstudanteService.getByTurma(activeTurma.id);
            return data || [];
        } catch (error) {
            console.error('Erro ao carregar estudantes:', error);
            setLoadError('Erro ao carregar estudantes. Verifique sua conexão e tente novamente.');
            return [];
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const loadAvaliacoesDocente = async () => {
        if (!activeTurma || avaliacaoBimestre === 'Resultado Consolidado' || avaliacaoEtapa !== 'fundamental') return;

        setIsLoading(true);
        try {
            const students = await loadStudents();
            const evalData = await ccAvaliacaoDocenteService.getAll(
                currentEscolaId,
                activeTurma.id,
                avaliacaoBimestre,
                'fundamental',
                selectedComponenteCurricular
            );

            // Mapper students to local state format
            const formatted = students.map((stu: any) => {
                const saved = evalData?.find((d: any) => d.estudante_id === stu.id.toString());
                return {
                    id: stu.id,
                    dbId: saved?.id,
                    name: stu.name,
                    fre: saved?.frequencia_conceito || 'B',
                    par: saved?.participacao_conceito || 'B',
                    mat: saved?.material_conceito || 'B',
                    atv: saved?.atividades_conceito || 'B',
                    com: saved?.comunicacao_conceito || 'B',
                    pes: saved?.pesquisa_conceito || 'B',
                    con: saved?.conduta_conceito || 'B',
                    notas: saved?.notas_json || { av1: 0, av2: 0, av3: 0, rec: null },
                    media: saved?.media_final ? Number(saved.media_final) : 0,
                    parecer: saved?.parecer_etapa || 'BOM'
                };
            });

            setStudentsAvaliacao(formatted);
        } catch (error) {
            console.error('Erro ao carregar avaliações docente:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAvaliacoesInfantil = async () => {
        if (!activeTurma || avaliacaoEtapa !== 'infantil') return;

        setIsLoading(true);
        try {
            const studentsList = await loadStudents();
            
            if (studentsList.length === 0) {
                setStudentsAvaliacaoInfantil([]);
                return;
            }

            const studentIds = studentsList.map((s: any) => s.id);

            // Fetch evaluations with context for these students
            const evalData = await ccAvaliacaoInfantilService.getByStudents(studentIds, undefined, {
                escola_id: currentEscolaId,
                turma_id: activeTurma.id,
                campo_experiencia: avaliacaoInfantilCampo
            });

            const formatted = studentsList.map((stu: any) => {
                const stuEvals = evalData?.filter((d: any) => d.student_id === stu.id) || [];

                // Group by period
                const groupByPeriod = (period: number) => {
                    const periodEvals = stuEvals.filter((e: any) => e.period === period);
                    // Map to objectives of the current field
                    const isBemPequena = ['Creche II', 'Creche III'].includes(activeTurma?.anoSerie || '');
                    const currentAgeGroup = isBemPequena ? 'Crianças bem pequenas' : 'Crianças pequenas';
                    const field = BNCC_INFANTIL[avaliacaoInfantilCampo.toUpperCase() as keyof typeof BNCC_INFANTIL];
                    const objectives = (field as any)?.[currentAgeGroup] || [];
                    
                    return objectives.map((obj: any) => {
                        const saved = periodEvals.find((e: any) => e.skill_code === obj.code);
                        return saved?.status || 'ND';
                    });
                };

                return {
                    id: stu.id,
                    name: stu.name,
                    evaluations: stuEvals, // Keep raw list for other uses
                    concepts_b1: groupByPeriod(1),
                    concepts_b2: groupByPeriod(2),
                    concepts_b3: groupByPeriod(3),
                    concepts_b4: groupByPeriod(4)
                };
            });

            setStudentsAvaliacaoInfantil(formatted);
        } catch (error: any) {
            console.error('Erro ao carregar avaliações infantil:', error);
            setLoadError(error.message || 'Erro ao carregar avaliações. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadVisaoGeralFundamental = async () => {
        if (!activeTurma || avaliacaoEtapa !== 'fundamental') return;

        setIsLoading(true);
        try {
            const students = await loadStudents();
            const evalData = await ccAvaliacaoDocenteService.getAll(
                currentEscolaId,
                activeTurma.id,
                undefined, // Fetch all bimestres
                'fundamental',
                selectedComponenteCurricular
            );

            const formatted = students.map((stu: any) => {
                const stuEvals = evalData?.filter((d: any) => d.estudante_id === stu.id.toString()) || [];

                const getMedia = (bimestre: string) => {
                    const ev = stuEvals.find((e: any) => e.periodo_letivo === bimestre);
                    return ev?.media_final ? Number(ev.media_final) : 0;
                };

                const b1 = getMedia('1º Bimestre');
                const b2 = getMedia('2º Bimestre');
                const b3 = getMedia('3º Bimestre');
                const b4 = getMedia('4º Bimestre');

                // Calculate media final based on available bimestres
                const filled = [b1, b2, b3, b4].filter(v => v > 0);
                const mediaFinal = filled.length > 0 ? filled.reduce((a, b) => a + b, 0) / filled.length : 0;

                return {
                    id: stu.id,
                    name: stu.name,
                    b1, b2, b3, b4,
                    mediaFinal: parseFloat(mediaFinal.toFixed(1)),
                    alert: mediaFinal < 5 // Example threshold
                };
            });

            setVisaoGeralData(formatted);
        } catch (error) {
            console.error('Erro ao carregar visão geral fundamental:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadInitialData = () => {
        if (avaliacaoBimestre === 'Resultado Consolidado') {
            if (avaliacaoEtapa === 'fundamental') loadVisaoGeralFundamental();
            else loadAvaliacoesInfantil();
        } else {
            if (avaliacaoEtapa === 'fundamental') loadAvaliacoesDocente();
            else loadAvaliacoesInfantil();
        }
    };

    useEffect(() => {
        if (avaliacaoBimestre === 'Resultado Consolidado') {
            if (avaliacaoEtapa === 'fundamental') loadVisaoGeralFundamental();
            else loadAvaliacoesInfantil();
        } else {
            if (avaliacaoEtapa === 'fundamental') loadAvaliacoesDocente();
            else loadAvaliacoesInfantil();
        }
    }, [activeTurma, avaliacaoBimestre, avaliacaoEtapa, avaliacaoInfantilCampo, selectedComponenteCurricular]);

    const persistAvaliacaoDocente = async (student: any) => {
        if (isEtapaReadOnly) return;

        setIsSaving(true);
        try {
            const payload = {
                id: student.dbId,
                escola_id: currentEscolaId,
                turma_id: activeTurma?.id || '',
                estudante_id: student.id.toString(),
                nome_estudante: student.name,
                periodo_letivo: avaliacaoBimestre,
                componente_curricular: selectedComponenteCurricular,
                frequencia_conceito: student.fre,
                participacao_conceito: student.par,
                material_conceito: student.mat,
                atividades_conceito: student.atv,
                comunicacao_conceito: student.com,
                pesquisa_conceito: student.pes,
                conduta_conceito: student.con,
                notas_json: student.notas,
                media_final: student.media,
                parecer_etapa: calculateParecerEtapaRaw(student)
            };

            const saved = await ccAvaliacaoDocenteService.save(payload);
            if (saved) {
                setStudentsAvaliacao(prev => prev.map(s =>
                    s.id === student.id ? { ...s, dbId: saved.id } : s
                ));
            }
        } catch (error) {
            console.error('Erro ao persistir avaliação:', error);
        } finally {
            setTimeout(() => setIsSaving(false), 800);
        }
    };

    const calculateParecerEtapaRaw = (student: any) => {
        const getConceptValue = (c: string) => {
            if (c === 'E') return 3;
            if (c === 'B') return 2;
            if (c === 'R') return 1;
            return 0; // 'I'
        };
        const total = getConceptValue(student.fre) + getConceptValue(student.par) + getConceptValue(student.mat) +
            getConceptValue(student.atv) + getConceptValue(student.com) + getConceptValue(student.pes) + getConceptValue(student.con);

        const avg = Math.round(total / 7);
        if (avg === 1) return 'REGULAR';
        if (avg === 2) return 'BOM';
        if (avg === 3) return 'EXCELENTE';
        return 'INSUFICIENTE';
    };

    const isInfantilAllowed = !activeTurma || activeTurma.etapa === 'Educação Infantil';
    const isFundamentalAllowed = !activeTurma || activeTurma.etapa !== 'Educação Infantil';

    const handleSalvarTurma = async (novaTurma: TurmaData) => {
        try {
            if (novaTurma.id) {
                // Update existing
                const updated = await ccTurmaService.update(novaTurma.id, novaTurma);
                setTurmasCadastradas(prev => prev.map(t => t.id === updated.id ? updated : t));
                setActiveTurma(updated);
            } else {
                // Create new
                const saved = await ccTurmaService.add({ ...novaTurma, schoolId: currentEscolaId });
                setTurmasCadastradas(prev => [...prev, saved]);
                setActiveTurma(saved);
            }
            setIsTurmaModalOpen(false);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (err) {
            console.error('Erro ao salvar turma:', err);
        }
    };

    const handleDeleteTurma = async (id: string) => {
        try {
            await ccTurmaService.remove(id);
            const remaining = turmasCadastradas.filter(t => t.id !== id);
            setTurmasCadastradas(remaining);
            if (activeTurma?.id === id) {
                setActiveTurma(remaining[0] || null);
            }
        } catch (err) {
            console.error('Erro ao excluir turma:', err);
        }
    };

    const [studentsAvaliacao, setStudentsAvaliacao] = useState<any[]>([]);
    const [studentsAvaliacaoInfantil, setStudentsAvaliacaoInfantil] = useState<any[]>([]);
    const [visaoGeralData, setVisaoGeralData] = useState<any[]>([]);

    const [editingGradesStudentId, setEditingGradesStudentId] = useState<number | null>(null);
    const [gradeForm, setGradeForm] = useState({ av1: '', av2: '', av3: '', rec: '' });
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');

    const handleAddStudent = async () => {
        if (!newStudentName.trim() || !activeTurma) return;

        setIsSaving(true);
        try {
            const newStudent = {
                name: newStudentName.trim().toUpperCase(),
                class_id: activeTurma.id,
                escola_id: currentEscolaId,
                status: 'active'
            };

            await ccEstudanteService.add(newStudent);
            setNewStudentName('');
            setIsAddingStudent(false);

            // Reload based on active stage
            if (avaliacaoEtapa === 'fundamental') loadAvaliacoesDocente();
            else loadAvaliacoesInfantil();
        } catch (error) {
            console.error('Erro ao adicionar estudante:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteStudent = async (id: string | number) => {
        if (confirm('Tem certeza que deseja remover este estudante do conselho de classe?')) {
            setIsSaving(true);
            try {
                // We mark as inactive in alunos table
                await ccEstudanteService.remove(id.toString());

                // Optionally delete evaluations for this bimestre/turma to be absolutely sure
                // but usually status='inactive' is enough if we filter it in getAllByTurma

                if (avaliacaoEtapa === 'fundamental') loadAvaliacoesDocente();
                else loadAvaliacoesInfantil();
            } catch (error) {
                console.error('Erro ao excluir estudante:', error);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleOpenGradeEditor = (student: any) => {
        setEditingGradesStudentId(student.id);
        setGradeForm({
            av1: student.notas?.av1?.toString() || '',
            av2: student.notas?.av2?.toString() || '',
            av3: student.notas?.av3?.toString() || '',
            rec: student.notas?.rec?.toString() || ''
        });
    };

    const handleSaveGrades = () => {
        let updatedStudent: any = null;
        setStudentsAvaliacao(prev => {
            const next = prev.map(student => {
                if (student.id === editingGradesStudentId) {
                    const av1 = parseFloat(gradeForm.av1) || 0;
                    const av2 = parseFloat(gradeForm.av2) || 0;
                    const av3 = parseFloat(gradeForm.av3) || 0;
                    const rec = gradeForm.rec ? parseFloat(gradeForm.rec) : null;

                    let media = (av1 + av2 + av3) / 3;
                    if (rec !== null && rec > media) {
                        media = rec;
                    }

                    updatedStudent = {
                        ...student,
                        notas: { av1, av2, av3, rec },
                        media: parseFloat(media.toFixed(1))
                    };
                    return updatedStudent;
                }
                return student;
            });
            return next;
        });

        if (updatedStudent) {
            persistAvaliacaoDocente(updatedStudent);
        }
        setEditingGradesStudentId(null);
    };

    const avaliacaoTabsList = ['Resultado Consolidado', '1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

    const toggleInfantilConcept = async (studentId: any, conceptIndex: number) => {
        if (isEtapaReadOnly) return;

        const periodMap: Record<string, number> = { '1º Bimestre': 1, '2º Bimestre': 2, '3º Bimestre': 3, '4º Bimestre': 4 };
        const period = periodMap[avaliacaoBimestre];
        if (!period) return;

        // Get current selected skill from BNCC_INFANTIL
        const isBemPequena = ['Creche II', 'Creche III'].includes(activeTurma?.anoSerie || '');
        const currentAgeGroup = isBemPequena ? 'Crianças bem pequenas' : 'Crianças pequenas';
        const field = BNCC_INFANTIL[avaliacaoInfantilCampo.toUpperCase() as keyof typeof BNCC_INFANTIL];
        const objectives = (field as any)?.[currentAgeGroup] || [];
        
        const skill = objectives[conceptIndex];
        if (!skill) return;

        setStudentsAvaliacaoInfantil(prev => prev.map(student => {
            if (student.id === studentId) {
                const currentEval = student.evaluations?.find((e: any) => e.skill_code === skill.code);
                const currentStatus = currentEval?.status || 'ND';

                let nextStatus = 'D';
                if (currentStatus === 'D') nextStatus = 'ED';
                else if (currentStatus === 'ED') nextStatus = 'ND';
                else if (currentStatus === 'ND') nextStatus = 'D';

                const newEval = {
                    id: currentEval?.id,
                    student_id: studentId,
                    skill_code: skill.code,
                    period: period,
                    status: nextStatus,
                    campo_experiencia: avaliacaoInfantilCampo,
                    escola_id: currentEscolaId,
                    turma_id: activeTurma?.id || '',
                    responsavel_id: currentUser?.id || ''
                };

                // Add or update in student.evaluations
                const updatedEvals = [...(student.evaluations || [])];
                const existingIdx = updatedEvals.findIndex((e: any) => e.skill_code === skill.code);
                if (existingIdx >= 0) {
                    updatedEvals[existingIdx] = { ...updatedEvals[existingIdx], status: nextStatus };
                } else {
                    updatedEvals.push(newEval);
                }

                // Sincronizar campo concepts_bX para atualização imediata na UI
                const conceptField = `concepts_b${period}` as keyof typeof student;
                const updatedConcepts = [...((student[conceptField] as any[]) || [])];
                updatedConcepts[conceptIndex] = nextStatus;

                // Persist
                persistAvaliacaoInfantil(newEval, studentId);

                return { 
                    ...student, 
                    evaluations: updatedEvals,
                    [conceptField]: updatedConcepts
                };
            }
            return student;
        }));
    };

    const persistAvaliacaoInfantil = async (evaluation: any, studentId: any) => {
        setIsSaving(true);
        try {
            const saved = await ccAvaliacaoInfantilService.save(evaluation);
            if (saved && !evaluation.id) {
                // If it was a new record, we should update the local evaluations list with the new ID
                setStudentsAvaliacaoInfantil(prev => prev.map(student => {
                    if (student.id === studentId) {
                        const updatedEvals = (student.evaluations || []).map((e: any) => 
                            e.skill_code === saved.skill_code && e.period === saved.period ? saved : e
                        );
                        
                        // Também sincronizar concepts_bX aqui caso tenha mudado
                        const conceptField = `concepts_b${saved.period}` as keyof typeof student;
                        const field = BNCC_INFANTIL[avaliacaoInfantilCampo.toUpperCase() as keyof typeof BNCC_INFANTIL];
                        
                        const isBemPequena = ['Creche II', 'Creche III'].includes(activeTurma?.anoSerie || '');
                        const currentAgeGroup = isBemPequena ? 'Crianças bem pequenas' : 'Crianças pequenas';
                        const objectives = (field as any)?.[currentAgeGroup] || [];
                        const skillIdx = objectives.findIndex((obj: any) => obj.code === saved.skill_code);
                        
                        if (skillIdx >= 0) {
                            const updatedConcepts = [...((student[conceptField] as any[]) || [])];
                            updatedConcepts[skillIdx] = saved.status;
                            return { 
                                ...student, 
                                evaluations: updatedEvals,
                                [conceptField]: updatedConcepts
                            };
                        }

                        return { ...student, evaluations: updatedEvals };
                    }
                    return student;
                }));
            }
        } catch (error) {
            console.error('Erro ao salvar avaliação infantil:', error);
        } finally {
            setTimeout(() => setIsSaving(false), 800);
        }
    };

    const renderVisaoGeralTrend = (current: number, previous: number) => {
        if (current > previous) return <span className="text-emerald-500 font-bold flex items-center gap-1 justify-center"><ArrowUpRight className="w-3 h-3" /></span>;
        if (current < previous) return <span className="text-red-500 font-bold flex items-center gap-1 justify-center"><ArrowDownRight className="w-3 h-3" /></span>;
        return <span className="text-slate-400 font-bold flex items-center justify-center"><Minus className="w-3 h-3" /></span>;
    };

    const renderVisaoGeralTrajectory = (student: any) => {
        return (
            <div className="flex gap-1 justify-center items-end h-6">
                <div className="w-4 bg-slate-400 rounded-sm" style={{ height: `${(student.b1 / 10) * 100}%` }}></div>
                <div className="w-4 bg-slate-500 rounded-sm" style={{ height: `${(student.b2 / 10) * 100}%` }}></div>
                <div className="w-4 bg-slate-600 rounded-sm" style={{ height: `${(student.b3 / 10) * 100}%` }}></div>
                <div className="w-4 bg-slate-700 rounded-sm" style={{ height: `${(student.b4 / 10) * 100}%` }}></div>
            </div>
        );
    };

    const toggleConcept = (studentId: number, field: string) => {
        if (isEtapaReadOnly) return;

        let updatedStudent: any = null;
        setStudentsAvaliacao(prev => {
            const next = prev.map(student => {
                if (student.id === studentId) {
                    const currentConcept = student[field];
                    let nextConcept = 'E';
                    if (currentConcept === 'E') nextConcept = 'B';
                    else if (currentConcept === 'B') nextConcept = 'R';
                    else if (currentConcept === 'R') nextConcept = 'I';
                    else if (currentConcept === 'I') nextConcept = 'E';

                    updatedStudent = { ...student, [field]: nextConcept };
                    return updatedStudent;
                }
                return student;
            });
            return next;
        });

        if (updatedStudent) {
            persistAvaliacaoDocente(updatedStudent);
        }
    };

    const handleSaveRascunho = async () => {
        if (isEtapaReadOnly) return;
        
        setIsSaving(true);
        try {
            if (avaliacaoEtapa === 'fundamental') {
                const promises = studentsAvaliacao.map(student => {
                    const payload = {
                        id: student.dbId,
                        escola_id: currentEscolaId,
                        turma_id: activeTurma?.id || '',
                        estudante_id: student.id.toString(),
                        nome_estudante: student.name,
                        periodo_letivo: avaliacaoBimestre,
                        componente_curricular: selectedComponenteCurricular,
                        frequencia_conceito: student.fre,
                        participacao_conceito: student.par,
                        material_conceito: student.mat,
                        atividades_conceito: student.atv,
                        comunicacao_conceito: student.com,
                        pesquisa_conceito: student.pes,
                        conduta_conceito: student.con,
                        notas_json: student.notas,
                        media_final: student.media,
                        parecer_etapa: calculateParecerEtapaRaw(student)
                    };
                    return ccAvaliacaoDocenteService.save(payload);
                });
                await Promise.all(promises);
                await loadAvaliacoesDocente();
            } else {
                // Collect evaluations for the current field from all students
                const allEvals = studentsAvaliacaoInfantil.flatMap(s => 
                    (s.evaluations || [])
                        .filter((e: any) => (e.campo_experiencia || '').toUpperCase() === avaliacaoInfantilCampo.toUpperCase())
                        .map((e: any) => ({
                            ...e,
                            escola_id: currentEscolaId,
                            turma_id: activeTurma?.id,
                            responsavel_id: currentUser?.id,
                            campo_experiencia: avaliacaoInfantilCampo
                        }))
                );

                if (allEvals.length > 0) {
                    await ccAvaliacaoInfantilService.saveMany(allEvals);
                }
                await loadAvaliacoesInfantil();
            }
            alert('Rascunho salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar rascunho:', error);
            alert('Erro ao salvar rascunho.');
        } finally {
            setTimeout(() => setIsSaving(false), 800);
        }
    };

    const renderConceptBadge = (studentId: number, field: string, concept: string) => {
        let colors = '';
        if (concept === 'E') colors = 'bg-emerald-50 text-emerald-500 border-emerald-200';
        else if (concept === 'B') colors = 'bg-blue-50 text-blue-500 border-blue-200';
        else if (concept === 'R') colors = 'bg-amber-50 text-amber-500 border-amber-200';
        else if (concept === 'I') colors = 'bg-red-50 text-red-500 border-red-200';
        else colors = 'bg-slate-50 text-slate-500 border-slate-200';

        return (
            <div onClick={() => toggleConcept(studentId, field)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold mx-auto transition-transform hover:scale-110 cursor-pointer ${colors} select-none`}>
                {concept}
            </div>
        );
    };

    const calculateParecerEtapa = (student: any) => {
        const getConceptValue = (c: string) => {
            if (c === 'E') return 3;
            if (c === 'B') return 2;
            if (c === 'R') return 1;
            return 0; // 'I'
        };
        const total = getConceptValue(student.fre) + getConceptValue(student.par) + getConceptValue(student.mat) +
            getConceptValue(student.atv) + getConceptValue(student.com) + getConceptValue(student.pes) + getConceptValue(student.con);

        const avg = Math.round(total / 7);
        let parecerString = 'INSUFICIENTE';
        let colorClass = 'bg-red-50 text-red-700 border-red-200';

        if (avg === 1) {
            parecerString = 'REGULAR';
            colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
        }
        else if (avg === 2) {
            parecerString = 'BOM';
            colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
        }
        else if (avg === 3) {
            parecerString = 'EXCELENTE';
            colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }

        return (
            <span className={`font-bold text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${colorClass}`}>
                {parecerString} <span className="opacity-75">({student.media.toFixed(1).replace('.', ',')})</span>
            </span>
        );
    };

    // ============================================
    // ESTADOS: ACOMPANHAMENTO DOCENTE
    // ============================================
    const [isEditingAcomp, setIsEditingAcomp] = useState(false);
    const [acompForm, setAcompForm] = useState({
        id: '',
        professor: '',
        componente: '',
        turma: '',
        periodoLetivo: '1º Bimestre',
        data: '',
        estudante: '',
        lider: '',
        dificuldades: '',
        intervencao: ''
    });

    const [mockAcompanhamentos, setMockAcompanhamentos] = useState<any[]>([]);

    // ============================================
    // ESTADOS: ACOMPANHAMENTO DOCENTE - ED. INFANTIL
    // ============================================
    const CAMPOS_EXPERIENCIA_BNCC = [
        'O eu, o outro e o nós',
        'Corpo, gestos e movimentos',
        'Traços, sons, cores e formas',
        'Escuta, fala, pensamento e imaginação',
        'Espaços, tempos, quantidades, relações e transformações'
    ];

    const [acompInfantilForm, setAcompInfantilForm] = useState({
        id: '',
        professor: '',
        agrupamento: '',
        periodoLetivo: '1º Bimestre',
        data: '',
        campoExperiencia: '',
        crianca: '',
        tipoInteracao: '',
        evidencias: '',
        intencionalidade: ''
    });

    const [isEditingAcompInfantil, setIsEditingAcompInfantil] = useState(false);
    const [mockAcompInfantil, setMockAcompInfantil] = useState<any[]>([]);

    // ============================================
    // ESTADOS: STATUS DA ETAPA E DESBLOQUEIO
    // ============================================
    const [etapaDoc, setEtapaDoc] = useState<any>(null);
    const [isSubmittingEtapa, setIsSubmittingEtapa] = useState(false);
    const [isRequestingUnlock, setIsRequestingUnlock] = useState(false);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockJustification, setUnlockJustification] = useState('');
    const [allPendingRequests, setAllPendingRequests] = useState<any[]>([]);
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    const isEtapaReadOnly = useMemo(() => {
        if (isAdmin) return false;
        return etapaDoc?.bloqueada || false;
    }, [etapaDoc, isAdmin]);

    const hasPendingUnlockRequest = useMemo(() => {
        return etapaDoc?.solicitacoes_desbloqueio?.some((r: any) => r.status === 'pendente');
    }, [etapaDoc]);

    const loadEtapaStatus = async () => {
        if (!activeTurma || avaliacaoBimestre === 'Resultado Consolidado') {
            setEtapaDoc(null);
            return;
        }

        try {
            const status = await ccAvaliacaoEtapaService.getStatus(
                currentEscolaId,
                activeTurma.id,
                avaliacaoBimestre,
                avaliacaoEtapa,
                avaliacaoEtapa === 'fundamental' ? selectedComponenteCurricular : undefined
            );
            setEtapaDoc(status);
        } catch (error) {
            console.error('Erro ao carregar status da etapa:', error);
        }
    };

    useEffect(() => {
        loadEtapaStatus();
    }, [activeTurma, avaliacaoBimestre, avaliacaoEtapa, selectedComponenteCurricular]);

    const loadAllPendingRequests = async () => {
        if (!isAdmin && currentUser?.funcao !== 'Coordenador Regional') return;
        try {
            const requests = await ccSolicitacaoDesbloqueioService.getTodasPendentes();
            setAllPendingRequests(requests);
        } catch (error) {
            console.error('Erro ao carregar solicitações pendentes:', error);
        }
    };

    useEffect(() => {
        if (showAdminPanel) {
            loadAllPendingRequests();
        }
    }, [showAdminPanel]);

    const handleSaveAcompInfantil = async () => {
        if (!acompInfantilForm.professor || !acompInfantilForm.crianca) return;
        try {
            let acToSave = {
                id: acompInfantilForm.id,
                escola_id: currentEscolaId,
                professor: acompInfantilForm.professor,
                componente_curricular: acompInfantilForm.campoExperiencia,
                turma_nome: acompInfantilForm.agrupamento,
                periodo_letivo: acompInfantilForm.periodoLetivo,
                data_registro: acompInfantilForm.data,
                estudante_nome: acompInfantilForm.crianca,
                lider_turma: acompInfantilForm.tipoInteracao,
                dificuldades: acompInfantilForm.evidencias,
                intervencao_pedagogica: acompInfantilForm.intencionalidade,
                etapa: 'infantil'
            };
            if (!acToSave.id) delete (acToSave as any).id;

            setIsSaving(true);
            const result = await ccAcompanhamentoDocenteService.save(acToSave);

            const formattedResult = {
                id: result.id,
                professor: result.professor,
                agrupamento: result.turma_nome,
                periodoLetivo: result.periodo_letivo,
                data: result.data_registro,
                campoExperiencia: result.componente_curricular,
                crianca: result.estudante_nome,
                tipoInteracao: result.lider_turma || '',
                evidencias: result.dificuldades || '',
                intencionalidade: result.intervencao_pedagogica || '',
                etapa: 'infantil'
            };

            if (acompInfantilForm.id) {
                setMockAcompInfantil(prev => prev.map(m => m.id === acompInfantilForm.id ? formattedResult : m));
            } else {
                setMockAcompInfantil(prev => [formattedResult, ...prev]);
            }
            setIsEditingAcompInfantil(false);
            setAcompInfantilForm({ id: '', professor: '', agrupamento: '', periodoLetivo: '1º Bimestre', data: '', campoExperiencia: '', crianca: '', tipoInteracao: '', evidencias: '', intencionalidade: '' });
        } catch (error) {
            console.error("Erro ao salvar acompanhamento infantil:", error);
            alert("Erro ao salvar acompanhamento");
        } finally {
            setTimeout(() => setIsSaving(false), 800);
        }
    };

    const handleEditAcompInfantil = (acomp: any) => {
        setAcompInfantilForm(acomp);
        setIsEditingAcompInfantil(true);
    };

    const handleDeleteAcompInfantil = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            try {
                await ccAcompanhamentoDocenteService.delete(id);
                setMockAcompInfantil(prev => prev.filter(m => m.id !== id));
            } catch (error) {
                console.error("Erro ao excluir acompanhamento infantil", error);
                alert("Erro ao excluir acompanhamento");
            }
        }
    };

    const handleSaveAcomp = async () => {
        if (!acompForm.professor || !acompForm.estudante) return;
        try {
            let acToSave = {
                id: acompForm.id,
                escola_id: currentEscolaId,
                professor: acompForm.professor,
                componente_curricular: acompForm.componente,
                turma_nome: acompForm.turma,
                periodo_letivo: acompForm.periodoLetivo,
                data_registro: acompForm.data,
                estudante_nome: acompForm.estudante,
                lider_turma: acompForm.lider,
                dificuldades: acompForm.dificuldades,
                intervencao_pedagogica: acompForm.intervencao
            };

            if (!acToSave.id) delete (acToSave as any).id;

            setIsSaving(true);
            const result = await ccAcompanhamentoDocenteService.save(acToSave);

            const formattedResult = {
                id: result.id,
                professor: result.professor,
                componente: result.componente_curricular,
                turma: result.turma_nome,
                periodoLetivo: result.periodo_letivo,
                data: result.data_registro,
                estudante: result.estudante_nome,
                lider: result.lider_turma,
                dificuldades: result.dificuldades,
                intervencao: result.intervencao_pedagogica
            };

            if (acompForm.id) {
                setMockAcompanhamentos(prev => prev.map(m => m.id === acompForm.id ? formattedResult : m));
            } else {
                setMockAcompanhamentos(prev => [formattedResult, ...prev]);
            }
            setIsEditingAcomp(false);
            setAcompForm({ id: '', professor: '', componente: '', turma: '', periodoLetivo: '1º Bimestre', data: '', estudante: '', lider: '', dificuldades: '', intervencao: '' });
        } finally {
            setTimeout(() => setIsSaving(false), 800);
        }
    };

    const handleEditAcomp = (acomp: any) => {
        setAcompForm(acomp);
        setIsEditingAcomp(true);
    };

    const handleDeleteAcomp = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            try {
                await ccAcompanhamentoDocenteService.delete(id);
                setMockAcompanhamentos(prev => prev.filter(m => m.id !== id));
            } catch (error) {
                console.error("Erro ao excluir acompanhamento", error);
                alert("Erro ao excluir acompanhamento");
            }
        }
    };

    const handleImprimir = () => {
        window.print();
    };

    const handleSolicitarDesbloqueio = async () => {
        if (!unlockJustification.trim()) {
            alert('Por favor, informe a justificativa.');
            return;
        }

        setIsRequestingUnlock(true);
        try {
            await ccSolicitacaoDesbloqueioService.solicitar({
                escola_id: currentEscolaId,
                turma_id: activeTurma?.id || '',
                periodo: avaliacaoBimestre,
                etapa: avaliacaoEtapa,
                justificativa: unlockJustification,
                solicitado_por: userEmail
            });

            setShowUnlockModal(false);
            setUnlockJustification('');
            alert('Solicitação enviada com sucesso!');
            loadEtapaStatus();
        } catch (error) {
            console.error('Erro ao solicitar desbloqueio:', error);
            alert('Erro ao enviar solicitação.');
        } finally {
            setIsRequestingUnlock(false);
        }
    };

    const handleFinalizarEtapa = async () => {
        if (avaliacaoBimestre === 'Resultado Consolidado') {
            alert('Não é possível finalizar o Resultado Consolidado diretamente. Finalize cada bimestre individualmente.');
            return;
        }

        // Validação
        let pendencias = false;
        if (avaliacaoEtapa === 'fundamental') {
            pendencias = studentsAvaliacao.some(s =>
                (s.fre === null || s.fre === undefined || s.fre === '') ||
                !s.par ||
                (s.mat === null || s.mat === undefined || s.mat === '') ||
                (s.atv === null || s.atv === undefined || s.atv === '') ||
                (s.com === null || s.com === undefined || s.com === '') ||
                (s.pes === null || s.pes === undefined || s.pes === '') ||
                (s.con === null || s.con === undefined || s.con === '')
            );
        } else {
            const field = avaliacaoBimestre === '1º Bimestre' ? 'concepts_b1' :
                avaliacaoBimestre === '2º Bimestre' ? 'concepts_b2' :
                    avaliacaoBimestre === '3º Bimestre' ? 'concepts_b3' : 'concepts_b4';

            // Supondo que currentObjectives está acessível ou fixo em 7 objetivos para validação básica
            pendencias = studentsAvaliacaoInfantil.some(s => (s[field] || []).length === 0);
        }

        if (pendencias) {
            alert('Existem avaliações pendentes. Preencha todos os campos obrigatórios antes de finalizar.');
            return;
        }

        if (!confirm('Tem certeza que deseja finalizar esta etapa? Após o envio, você não poderá mais editá-la.')) return;

        setIsSubmittingEtapa(true);
        try {
            await ccAvaliacaoEtapaService.enviar({
                escola_id: currentEscolaId,
                turma_id: activeTurma?.id || '',
                periodo: avaliacaoBimestre,
                etapa: avaliacaoEtapa,
                enviada_por: userEmail
            });

            alert('Etapa finalizada e enviada com sucesso!');
            loadEtapaStatus();
        } catch (error) {
            console.error('Erro ao finalizar etapa:', error);
            alert('Erro ao enviar etapa.');
        } finally {
            setIsSubmittingEtapa(false);
        }
    };
    const [isEditingEnc, setIsEditingEnc] = useState(false);
    const [encForm, setEncForm] = useState({
        id: '',
        estudante: '',
        turma: '',
        tipo: 'Pedagógico',
        descricao: '',
        encaminhamento: '',
        data: '',
        periodoLetivo: '1º Bimestre',
        status: 'Pendente',
        responsavel: ''
    });

    const [mockEncaminhamentos, setMockEncaminhamentos] = useState<any[]>([]);

    const handleSaveEnc = async () => {
        if (!encForm.estudante || !encForm.descricao) return;
        try {
            let encToSave = {
                id: encForm.id,
                estudante_nome: encForm.estudante,
                turma_nome: encForm.turma,
                tipo_intervencao: encForm.tipo,
                descricao_caso: encForm.descricao,
                encaminhamento_proposto: encForm.encaminhamento,
                data_registro: encForm.data,
                periodo_letivo: encForm.periodoLetivo,
                escola_id: currentEscolaId,
                status: encForm.status,
                responsavel_acao: encForm.responsavel
            };
            if (!encToSave.id) delete (encToSave as any).id;

            setIsSaving(true);
            const result = await ccEncaminhamentosService.save(encToSave);

            const formattedResult = {
                id: result.id,
                estudante: result.estudante_nome,
                turma: result.turma_nome,
                tipo: result.tipo_intervencao,
                descricao: result.descricao_caso,
                encaminhamento: result.encaminhamento_proposto,
                data: result.data_registro,
                periodoLetivo: result.periodo_letivo,
                status: result.status,
                responsavel: result.responsavel_acao
            };

            if (encForm.id) {
                setMockEncaminhamentos(prev => prev.map(m => m.id === encForm.id ? formattedResult : m));
            } else {
                setMockEncaminhamentos(prev => [formattedResult, ...prev]);
            }
            setIsEditingEnc(false);
            setEncForm({ id: '', estudante: '', turma: '', tipo: 'Pedagógico', descricao: '', encaminhamento: '', data: '', periodoLetivo: '1º Bimestre', status: 'Pendente', responsavel: '' });
        } catch (error) {
            console.error("Erro ao salvar encaminhamento:", error);
            alert("Erro ao salvar acompanhamento");
        } finally {
            setTimeout(() => setIsSaving(false), 800);
        }
    };

    const handleEditEnc = (enc: any) => {
        setEncForm(enc);
        setIsEditingEnc(true);
    };

    const handleDeleteEnc = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este registro de encaminhamento?')) {
            try {
                await ccEncaminhamentosService.delete(id);
                setMockEncaminhamentos(prev => prev.filter(m => m.id !== id));
            } catch (error) {
                console.error("Erro ao excluir encaminhamento", error);
                alert("Erro ao excluir");
            }
        }
    };

    // ============================================
    // ESTADOS: ENCAMINHAMENTOS INFANTIL
    // ============================================
    const [isEditingEncInfantil, setIsEditingEncInfantil] = useState(false);
    const [encInfantilForm, setEncInfantilForm] = useState({
        id: '',
        crianca: '',
        agrupamento: '',
        campoExperiencia: '',
        periodoLetivo: '1º Bimestre',
        data: '',
        evidencias: '',
        estrategia: '',
        professor: '',
        status: 'Pendente'
    });
    const [mockEncInfantil, setMockEncInfantil] = useState<any[]>([]);

    const handleSaveEncInfantil = async () => {
        if (!encInfantilForm.crianca || !encInfantilForm.evidencias) return;
        try {
            let encToSave = {
                id: encInfantilForm.id,
                estudante_nome: encInfantilForm.crianca,
                turma_nome: encInfantilForm.agrupamento,
                tipo_intervencao: encInfantilForm.campoExperiencia,
                descricao_caso: encInfantilForm.evidencias,
                encaminhamento_proposto: encInfantilForm.estrategia,
                data_registro: encInfantilForm.data,
                periodo_letivo: encInfantilForm.periodoLetivo,
                status: encInfantilForm.status,
                responsavel_acao: encInfantilForm.professor,
                escola_id: currentEscolaId,
                etapa: 'infantil'
            };
            if (!encToSave.id) delete (encToSave as any).id;

            setIsSaving(true);
            const result = await ccEncaminhamentosService.save(encToSave);

            const formattedResult = {
                id: result.id,
                crianca: result.estudante_nome,
                agrupamento: result.turma_nome,
                campoExperiencia: result.tipo_intervencao,
                evidencias: result.descricao_caso,
                estrategia: result.encaminhamento_proposto,
                data: result.data_registro ? result.data_registro.substring(0, 10) : '',
                periodoLetivo: result.periodo_letivo,
                status: result.status,
                professor: result.responsavel_acao,
                etapa: 'infantil'
            };

            if (encInfantilForm.id) {
                setMockEncInfantil(prev => prev.map(m => m.id === encInfantilForm.id ? formattedResult : m));
            } else {
                setMockEncInfantil(prev => [formattedResult, ...prev]);
            }
            setIsEditingEncInfantil(false);
            setEncInfantilForm({ id: '', crianca: '', agrupamento: '', campoExperiencia: '', periodoLetivo: '1º Bimestre', data: '', evidencias: '', estrategia: '', professor: '', status: 'Pendente' });
        } finally {
            setTimeout(() => setIsSaving(false), 800);
        }
    };

    const handleEditEncInfantil = (enc: any) => {
        setEncInfantilForm(enc);
        setIsEditingEncInfantil(true);
    };

    const handleDeleteEncInfantil = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            try {
                await ccEncaminhamentosService.delete(id);
                setMockEncInfantil(prev => prev.filter(m => m.id !== id));
            } catch (error) {
                console.error("Erro ao excluir encaminhamento infantil", error);
                alert("Erro ao excluir");
            }
        }
    };

    const tabs = [
        { id: 'estudantil', label: 'Reunião Estudantil', icon: Users },
        { id: 'avaliacao', label: 'Avaliação Docente', icon: BookOpen },
        { id: 'acompanhamento', label: 'Acompanhamento Docente', icon: UserCheck },
        { id: 'encaminhamentos', label: 'Encaminhamentos e Intervenções', icon: AlertTriangle }
    ];

    React.useEffect(() => {
        const loadDocs = async () => {
            setIsLoading(true);
            try {
                const [acomp, encs] = await Promise.all([
                    ccAcompanhamentoDocenteService.getAll(currentEscolaId),
                    ccEncaminhamentosService.getAll(currentEscolaId)
                ]);

                if (acomp) {
                    setMockAcompanhamentos(acomp.map(a => ({
                        id: a.id,
                        professor: a.professor,
                        componente: a.componente_curricular,
                        turma: a.turma_nome,
                        periodoLetivo: a.periodo_letivo,
                        data: a.data_registro ? a.data_registro.substring(0, 10) : '',
                        estudante: a.estudante_nome,
                        lider: a.lider_turma || '',
                        dificuldades: a.dificuldades || '',
                        intervencao: a.intervencao_pedagogica || ''
                    })));
                }

                if (encs) {
                    setMockEncaminhamentos(encs.map(e => ({
                        id: e.id,
                        estudante: e.estudante_nome,
                        turma: e.turma_nome,
                        tipo: e.tipo_intervencao,
                        descricao: e.descricao_caso,
                        encaminhamento: e.encaminhamento_proposto,
                        data: e.data_registro ? e.data_registro.substring(0, 10) : '',
                        periodoLetivo: e.periodo_letivo,
                        status: e.status,
                        responsavel: e.responsavel_acao
                    })));
                }
            } catch (error) {
                console.error("Erro ao carregar dados do Conselho de Classe:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDocs();
    }, [currentEscolaId]);

    const renderTabContent = () => {
        const isBemPequena = ['Creche II', 'Creche III'].includes(activeTurma?.anoSerie || '');
        const currentAgeGroup = isBemPequena ? 'Crianças bem pequenas' : 'Crianças pequenas';
        const currentObjectives = BNCC_INFANTIL[avaliacaoInfantilCampo.toUpperCase() as keyof typeof BNCC_INFANTIL]?.[currentAgeGroup as 'Crianças bem pequenas' | 'Crianças pequenas'] || [];

        switch (activeTab) {
            case 'estudantil':
                return (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <ReuniaoEstudantilForm 
                            escolas={escolas}
                            currentUser={currentUser}
                            initialEscolaId={currentEscolaId}
                            initialTurmaId={activeTurma?.id}
                        />
                    </div>
                );
            case 'avaliacao':
                return (
                    <div className="space-y-6 animate-fade-in">
                        {/* Status Header */}
                        <div className="bg-slate-900 text-white rounded-2xl p-4 flex justify-between items-center shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm tracking-wide">ETAPA CONCLUÍDA E ENVIADA</h3>
                                    <p className="text-xs text-slate-400">RELATÓRIO ENVIADO À COORDENAÇÃO PEDAGÓGICA EM 14/10/2024 ÀS 10:42</p>
                                </div>
                            </div>
                            <div className="bg-emerald-900/50 border border-emerald-500/30 px-4 py-2 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> PROTOCOLO: #2024-3B-7742
                            </div>
                        </div>

                        {/* Seletor de Etapas para Avaliação Docente */}
                        {
                            schoolLevels.hasBoth && !activeTurma && (
                                <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-2 w-fit">
                                    <button
                                        onClick={() => isFundamentalAllowed && setAvaliacaoEtapa('fundamental')}
                                        disabled={!isFundamentalAllowed}
                                        className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${avaliacaoEtapa === 'fundamental' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'} ${!isFundamentalAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <BookOpen className="w-4 h-4" /> Ensino Fundamental
                                    </button>
                                    <button
                                        onClick={() => isInfantilAllowed && setAvaliacaoEtapa('infantil')}
                                        disabled={!isInfantilAllowed}
                                        className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${avaliacaoEtapa === 'infantil' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'} ${!isInfantilAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Baby className="w-4 h-4" /> Educação Infantil
                                    </button>
                                </div>
                            )}

                        {/* Tabs Bimestre ou Campos de Experiência */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-2 flex gap-2 overflow-x-auto custom-scrollbar">
                            {avaliacaoTabsList.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setAvaliacaoBimestre(tab)}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold min-w-max transition-all ${avaliacaoBimestre === tab ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Header Contexto always visible */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                                    <LayoutDashboard className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Avaliação Detalhada por Etapa Pedagógica</h2>
                                    <div className="flex gap-4 mt-1 text-sm">
                                        <span className="text-slate-500">Filtro Ativo: <strong className="text-emerald-600">
                                            {avaliacaoBimestre.toUpperCase()}
                                        </strong></span>
                                        {isEtapaReadOnly ? (
                                            <span className="text-amber-500 font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> SOMENTE LEITURA</span>
                                        ) : (
                                            <span className="text-emerald-500 font-bold flex items-center gap-1"><Edit className="w-3 h-3" /> EM EDIÇÃO</span>
                                        )}
                                    </div>
                                </div>
                                {isSaving && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 animate-pulse bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm ml-4">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                                        <span>SALVANDO ALTERAÇÕES...</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleImprimir}
                                    className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center gap-2 transition-all"
                                >
                                    <Printer className="w-4 h-4" /> Imprimir {avaliacaoBimestre === 'Resultado Consolidado' ? 'Relatório' : avaliacaoBimestre}
                                </button>

                                {etapaDoc?.status === 'enviada' && !isAdmin && (
                                    <button
                                        onClick={() => setShowUnlockModal(true)}
                                        disabled={hasPendingUnlockRequest}
                                        className={`border px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${hasPendingUnlockRequest ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                    >
                                        <Lock className="w-4 h-4" /> {hasPendingUnlockRequest ? 'Aguardando Desbloqueio' : 'Solicitar Desbloqueio'}
                                    </button>
                                )}

                                {isAdmin && etapaDoc?.status === 'enviada' && (
                                    <button
                                        onClick={() => setShowAdminPanel(!showAdminPanel)}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-700 flex items-center gap-2 transition-all shadow-lg shadow-purple-200"
                                    >
                                        <GraduationCap className="w-4 h-4" /> Gestão de Desbloqueios
                                    </button>
                                )}

                                {avaliacaoBimestre !== 'Resultado Consolidado' && !isEtapaReadOnly && (
                                    <>
                                        <button
                                            onClick={handleSaveRascunho}
                                            disabled={isSaving}
                                            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center gap-2 transition-all"
                                        >
                                            <FileText className="w-4 h-4 text-blue-500" />
                                            Salvar Rascunho
                                        </button>
                                        <button
                                            onClick={handleFinalizarEtapa}
                                            disabled={isSubmittingEtapa}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
                                        >
                                            {isSubmittingEtapa ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : <Send className="w-4 h-4" />}
                                            Finalizar e Enviar Etapa
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Contexto Metadata always visible */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-sm divide-x divide-slate-100">
                            <div className="px-4">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Unidade Escolar</p>
                                {isAdmin ? (
                                    <select
                                        value={selectedEscolaId}
                                        onChange={(e) => setSelectedEscolaId(e.target.value)}
                                        className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none appearance-none cursor-pointer hover:text-blue-600 transition-colors"
                                    >
                                        {escolas.map(e => (
                                            <option key={e.id} value={e.id}>{e.nome}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm font-semibold text-slate-800">{currentEscola?.nome || 'Escola'}</p>
                                )}
                            </div>
                            <div className="px-4">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Responsável</p>
                                <p className="text-sm font-semibold text-slate-800">{currentUser?.nome || userEmail || 'Professor(a)'}</p>
                            </div>
                            <div className="px-4">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                                    {avaliacaoEtapa === 'infantil' ? 'Campo de Experiência' : 'Componente Curricular'}
                                </p>
                                {avaliacaoEtapa === 'infantil' ? (
                                    <select
                                        value={avaliacaoInfantilCampo}
                                        onChange={(e) => !isEtapaReadOnly && setAvaliacaoInfantilCampo(e.target.value.toUpperCase())}
                                        disabled={isEtapaReadOnly}
                                        className={`w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none appearance-none truncate transition-colors ${isEtapaReadOnly ? 'cursor-default' : 'cursor-pointer hover:text-blue-600'}`}
                                    >
                                        {CAMPOS_EXPERIENCIA_BNCC.map(campo => (
                                            <option key={campo} value={campo}>{campo}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        value={selectedComponenteCurricular}
                                        onChange={(e) => !isEtapaReadOnly && setSelectedComponenteCurricular(e.target.value)}
                                        disabled={isEtapaReadOnly}
                                        className={`w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none appearance-none truncate transition-colors ${isEtapaReadOnly ? 'cursor-default' : 'cursor-pointer hover:text-blue-600'}`}
                                    >
                                        {COMPONENTES_CURRICULARES.map(comp => (
                                            <option key={comp} value={comp}>{comp}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="px-4 flex items-center gap-3">
                                <div className="text-left">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                                        {avaliacaoEtapa === 'infantil' ? 'Grupo de Faixa Etária' : 'Turma / Ano'}
                                    </p>
                                    {turmasCadastradas.length > 0 ? (
                                        <select
                                            value={activeTurma?.id || ''}
                                            onChange={(e) => {
                                                const selected = turmasCadastradas.find(t => t.id === e.target.value);
                                                if (selected) setActiveTurma(selected);
                                            }}
                                            className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none appearance-none cursor-pointer hover:text-blue-600 transition-colors"
                                        >
                                            {turmasCadastradas.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.anoSerie} {t.identificacao.replace('Turma ', '')} • {t.turno}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-400 italic">Nenhuma turma cadastrada</p>
                                    )}
                                </div>
                                {etapaDoc?.status === 'enviada' && (
                                    <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-emerald-700 border border-emerald-200 rounded-lg p-2 bg-emerald-50">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>ETAPA ENVIADA<br />{etapaDoc.enviada_em ? new Date(etapaDoc.enviada_em).toLocaleDateString() : ''}</span>
                                    </div>
                                )}
                                {isEtapaReadOnly && etapaDoc?.status !== 'enviada' && (
                                    <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-slate-400 border border-slate-200 rounded-lg p-2 bg-slate-50">
                                        <Lock className="w-3 h-3" />
                                        <span>ETAPA BLOQUEADA</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {
                            avaliacaoBimestre === 'Resultado Consolidado' ? (
                                avaliacaoEtapa === 'infantil' ? (
                                    <div className="space-y-6 animate-fade-in">
                                        {/* Overview Cards Infantil */}
                                        {(() => {
                                            const bimestres = ['concepts_b1', 'concepts_b2', 'concepts_b3', 'concepts_b4'];
                                            let lastBimIdx = -1;
                                            for (let i = bimestres.length - 1; i >= 0; i--) {
                                                if (studentsAvaliacaoInfantil.some(s => (s[bimestres[i]] || []).length > 0)) {
                                                    lastBimIdx = i;
                                                    break;
                                                }
                                            }

                                            if (lastBimIdx === -1) {
                                                return (
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm col-span-4 text-center py-10">
                                                            <p className="text-slate-400 font-medium">Sem dados avaliativos disponíveis para gerar indicadores.</p>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            const getAverageForBim = (idx: number) => {
                                                const field = bimestres[idx];
                                                let totalScore = 0;
                                                let count = 0;
                                                studentsAvaliacaoInfantil.forEach(s => {
                                                    const concepts = s[field] || [];
                                                    if (concepts.length > 0) {
                                                        let sScore = 0;
                                                        concepts.forEach((c: string) => {
                                                            if (c === 'D') sScore += 2;
                                                            else if (c === 'ED') sScore += 1;
                                                        });
                                                        totalScore += (sScore / (concepts.length * 2)) * 10;
                                                        count++;
                                                    }
                                                });
                                                return count > 0 ? totalScore / count : 0;
                                            };

                                            const avgFirst = getAverageForBim(0);
                                            const avgLast = getAverageForBim(lastBimIdx);
                                            const avgPrev = lastBimIdx > 0 ? getAverageForBim(lastBimIdx - 1) : null;

                                            // Evolução Média (1º vs Último)
                                            let evolucaoMediaPct = 0;
                                            if (avgFirst > 0) {
                                                evolucaoMediaPct = ((avgLast - avgFirst) / avgFirst) * 100;
                                            }

                                            // Média Geral (Último vs Anterior)
                                            let variacaoGeral = 0;
                                            if (avgPrev !== null) {
                                                variacaoGeral = avgLast - avgPrev;
                                            }

                                            // Acima da Média (Escola vs Turma)
                                            // Simulando média da escola como 5% menor que a média do primeiro semestre da rede ou similar
                                            const escolaRefAvg = avgLast * 0.95;
                                            const acimaMediaCount = studentsAvaliacaoInfantil.filter(s => {
                                                const concepts = s[bimestres[lastBimIdx]] || [];
                                                if (concepts.length === 0) return false;
                                                let sScore = 0;
                                                concepts.forEach((c: string) => {
                                                    if (c === 'D') sScore += 2;
                                                    else if (c === 'ED') sScore += 1;
                                                });
                                                const sAvg = (sScore / (concepts.length * 2)) * 10;
                                                return sAvg > escolaRefAvg;
                                            }).length;
                                            const acimaMediaPct = (acimaMediaCount / studentsAvaliacaoInfantil.length) * 100;

                                            // Alertas (NDs no último bimestre)
                                            const alertasCount = studentsAvaliacaoInfantil.filter(s => {
                                                const concepts = s[bimestres[lastBimIdx]] || [];
                                                return concepts.includes('ND');
                                            }).length;

                                            return (
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    {/* EVOLUÇÃO MÉDIA */}
                                                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="text-xs font-bold text-slate-500 uppercase">Evolução Média</h4>
                                                            {evolucaoMediaPct >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                                                        </div>
                                                        <div className="flex items-baseline gap-2 flex-col">
                                                            <span className={`text-2xl font-black ${evolucaoMediaPct >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                                                                {evolucaoMediaPct >= 0 ? '+' : ''}{evolucaoMediaPct.toFixed(1)}%
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center">
                                                                {lastBimIdx === 0 ? 'sem base comparativa anterior' : '1º bimes. vs último bimes.'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* ACIMA DA MÉDIA */}
                                                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="text-xs font-bold text-slate-500 uppercase">Acima da Média</h4>
                                                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><CheckCircle2 className="w-3 h-3" /></div>
                                                        </div>
                                                        <div className="flex items-baseline gap-2 flex-col">
                                                            <span className="text-2xl font-black text-slate-800">{acimaMediaPct.toFixed(0)}%</span>
                                                            <span className="text-[10px] font-medium text-blue-500">em relação à própria escola</span>
                                                        </div>
                                                    </div>

                                                    {/* MÉDIA GERAL */}
                                                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="text-xs font-bold text-slate-500 uppercase">Média Geral</h4>
                                                            <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                                                        </div>
                                                        <div className="flex items-baseline gap-2 flex-col">
                                                            <span className="text-2xl font-black text-slate-800">{avgLast.toFixed(1)}</span>
                                                            <span className={`text-[10px] font-medium ${variacaoGeral >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                {lastBimIdx === 0 ? 'sem base comparativa anterior' : `${variacaoGeral >= 0 ? '+' : ''}${variacaoGeral.toFixed(1)} em relação ao bimes. anterior`}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* ALERTAS */}
                                                    <div className="bg-red-50 rounded-2xl p-5 border border-red-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                                                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-100 rounded-full opacity-50"></div>
                                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                                            <h4 className="text-xs font-bold text-red-800 uppercase">Alertas de Atenção</h4>
                                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                                        </div>
                                                        <div className="flex items-baseline gap-2 flex-col relative z-10">
                                                            <span className="text-2xl font-black text-red-600">{alertasCount.toString().padStart(2, '0')} crianças</span>
                                                            <span className="text-[10px] font-medium text-red-500">Ação necessária no último bimes.</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Campos de Experiência Tabs */}
                                        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                                            {CAMPOS_EXPERIENCIA_BNCC.map(campo => (
                                                <button
                                                    key={campo}
                                                    onClick={() => setAvaliacaoInfantilCampo(campo)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold min-w-max border transition-all ${avaliacaoInfantilCampo === campo ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                                >
                                                    {campo}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Tabela */}
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse min-w-max">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                                            <th className="p-4 font-bold text-xs tracking-wider text-slate-500 uppercase">ESTUDANTE</th>
                                                            <th className="p-4 font-bold text-xs tracking-wider text-slate-500 uppercase text-center w-[16%]">1º BIMESTRE</th>
                                                            <th className="p-4 font-bold text-xs tracking-wider text-slate-500 uppercase text-center w-[16%]">2º BIMESTRE</th>
                                                            <th className="p-4 font-bold text-xs tracking-wider text-slate-500 uppercase text-center w-[16%]">3º BIMESTRE</th>
                                                            <th className="p-4 font-bold text-xs tracking-wider text-slate-500 uppercase text-center w-[16%]">4º BIMESTRE</th>
                                                            <th className="p-4 font-bold text-xs tracking-wider text-slate-500 uppercase text-right w-32">TRAJETÓRIA</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {isLoadingStudents || isLoading ? (
                                                            <tr>
                                                                <td colSpan={6} className="p-12 text-center text-slate-400">
                                                                    <div className="flex flex-col items-center gap-3">
                                                                        <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                                                                        <span className="text-sm font-medium">Carregando estudantes...</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : loadError ? (
                                                            <tr>
                                                                <td colSpan={6} className="p-12 text-center">
                                                                    <div className="flex flex-col items-center gap-4">
                                                                        <AlertTriangle className="w-8 h-8 text-red-500" />
                                                                        <p className="text-sm font-medium text-red-600">{loadError}</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : studentsAvaliacaoInfantil.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={6} className="p-12 text-center text-slate-400">
                                                                    <div className="flex flex-col items-center gap-4">
                                                                        <Users className="w-12 h-12 opacity-10" />
                                                                        <p className="text-sm font-medium">Nenhum estudante matriculado nesta turma.</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            studentsAvaliacaoInfantil.map((student) => {
                                                                const getConsolidatedStatus = (field: string) => {
                                                                const concepts = student[field] || [];
                                                                if (concepts.length === 0) return null;

                                                                let score = 0;
                                                                const sConcepts = currentObjectives.map((_, i) => concepts[i] || 'ND');
                                                                sConcepts.forEach(c => {
                                                                    if (c === 'D') score += 2;
                                                                    else if (c === 'ED') score += 1;
                                                                });

                                                                const max = sConcepts.length * 2;
                                                                const pct = max > 0 ? (score / max) * 100 : 0;

                                                                if (pct > 70) return 'D';
                                                                if (pct >= 50) return 'ED';
                                                                return 'ND';
                                                            };

                                                            const b1Status = getConsolidatedStatus('concepts_b1');
                                                            const b2Status = getConsolidatedStatus('concepts_b2');
                                                            const b3Status = getConsolidatedStatus('concepts_b3');
                                                            const b4Status = getConsolidatedStatus('concepts_b4');

                                                            const initials = student.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('');
                                                            const color = student.id % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600';

                                                            const renderBadge = (status: string | null) => {
                                                                if (!status) return <span className="text-sm font-medium text-slate-300 italic">Aguardando...</span>;
                                                                if (status === 'D') return <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 w-max mx-auto shadow-sm uppercase tracking-wider">Desenvolvido <ArrowUpRight className="w-3 h-3" /></span>;
                                                                if (status === 'ED') return <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 w-max mx-auto shadow-sm uppercase tracking-wider">Em Desenvol. <ArrowRight className="w-3 h-3" /></span>;
                                                                if (status === 'ND') return <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 w-max mx-auto shadow-sm uppercase tracking-wider">Não Desenvolvido <ArrowDownRight className="w-3 h-3" /></span>;
                                                                return null;
                                                            };

                                                            const getH = (s: string | null) => s === 'D' ? 'h-6 bg-emerald-500' : s === 'ED' ? 'h-4 bg-blue-500' : s === 'ND' ? 'h-2 bg-orange-500' : 'h-1 bg-slate-200';

                                                            return (
                                                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="p-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${color}`}>
                                                                                {initials}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-bold text-slate-800">{student.name}</p>
                                                                                <p className="text-xs text-slate-400">ID: #00{student.id}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 text-center">{renderBadge(b1Status)}</td>
                                                                    <td className="p-4 text-center">{renderBadge(b2Status)}</td>
                                                                    <td className="p-4 text-center">{renderBadge(b3Status)}</td>
                                                                    <td className="p-4 text-center">{renderBadge(b4Status)}</td>
                                                                    <td className="p-4">
                                                                        <div className="flex items-end justify-end gap-1 h-6">
                                                                            <div className={`w-2.5 rounded-sm ${getH(b1Status)}`}></div>
                                                                            <div className={`w-2.5 rounded-sm ${getH(b2Status)}`}></div>
                                                                            <div className={`w-2.5 rounded-sm ${getH(b3Status)}`}></div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center rounded-b-2xl">
                                                <div className="text-xs text-slate-500 font-medium">Exibindo 4 de 24 estudantes</div>
                                                <div className="flex gap-2">
                                                    <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs shadow-sm hover:bg-slate-50 transition-colors">Anterior</button>
                                                    <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs shadow-sm hover:bg-slate-50 transition-colors">Próximo</button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Legenda */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 shadow-sm">
                                                <div className="w-4 h-4 rounded bg-emerald-500 mt-0.5 shrink-0 shadow-sm border border-emerald-600"></div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">Desenvolvido</p>
                                                    <p className="text-xs text-slate-500 mt-1">Atingiu plenamente os objetivos do período.</p>
                                                </div>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 shadow-sm">
                                                <div className="w-4 h-4 rounded bg-blue-500 mt-0.5 shrink-0 shadow-sm border border-blue-600"></div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">Em Desenvolvimento</p>
                                                    <p className="text-xs text-slate-500 mt-1">Apresenta progresso, requer acompanhamento.</p>
                                                </div>
                                            </div>
                                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 shadow-sm">
                                                <div className="w-4 h-4 rounded bg-orange-500 mt-0.5 shrink-0 shadow-sm border border-orange-600"></div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">Não Desenvolvido</p>
                                                    <p className="text-xs text-slate-500 mt-1">Objetivos ainda não alcançados.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">

                                        {/* Overview Cards Fundamental */}
                                        {(() => {
                                            if (visaoGeralData.length === 0) return (
                                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center py-10 col-span-4">
                                                    <p className="text-slate-400 font-medium">Sem dados consolidados disponíveis.</p>
                                                </div>
                                            );

                                            const bims: ('b1' | 'b2' | 'b3' | 'b4')[] = ['b1', 'b2', 'b3', 'b4'];
                                            let lastBimIdx = -1;
                                            for (let i = bims.length - 1; i >= 0; i--) {
                                                if (visaoGeralData.some(s => s[bims[i]] > 0)) {
                                                    lastBimIdx = i;
                                                    break;
                                                }
                                            }

                                            const getAvg = (bim: 'b1' | 'b2' | 'b3' | 'b4') => {
                                                const filled = visaoGeralData.filter(s => s[bim] > 0);
                                                return filled.length > 0 ? filled.reduce((a, b) => a + b[bim], 0) / filled.length : 0;
                                            };

                                            const avgFirst = getAvg('b1');
                                            const avgLast = lastBimIdx >= 0 ? getAvg(bims[lastBimIdx]) : 0;
                                            const avgPrev = lastBimIdx > 0 ? getAvg(bims[lastBimIdx - 1]) : null;

                                            let evolucaoPct = 0;
                                            if (avgFirst > 0) evolucaoPct = ((avgLast - avgFirst) / avgFirst) * 100;

                                            let variacaoGeral = 0;
                                            if (avgPrev !== null) variacaoGeral = avgLast - avgPrev;

                                            const acimaMedia = visaoGeralData.filter(s => s.mediaFinal >= 6).length;
                                            const acimaMediaPct = (acimaMedia / visaoGeralData.length) * 100;

                                            const alertasCount = visaoGeralData.filter(s => s.alert).length;

                                            return (
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="text-xs font-bold text-slate-500 uppercase">Evolução Média</h4>
                                                            {evolucaoPct >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                                                        </div>
                                                        <div className="flex items-baseline gap-2 flex-col">
                                                            <span className={`text-2xl font-black ${evolucaoPct >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                                                                {evolucaoPct >= 0 ? '+' : ''}{evolucaoPct.toFixed(1)}%
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center">
                                                                {lastBimIdx === 0 ? 'sem base comparativa anterior' : '1º bimes. vs último bimes.'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="text-xs font-bold text-slate-500 uppercase">Acima da Média</h4>
                                                            <Users className="w-4 h-4 text-blue-500" />
                                                        </div>
                                                        <div className="flex items-baseline gap-2 flex-col">
                                                            <span className="text-2xl font-black text-slate-800">{acimaMediaPct.toFixed(0)}%</span>
                                                            <span className="text-[10px] font-medium text-blue-500">em relação à própria escola</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="text-xs font-bold text-slate-500 uppercase">Média Geral</h4>
                                                            <LayoutDashboard className="w-4 h-4 text-amber-500" />
                                                        </div>
                                                        <div className="flex items-baseline gap-2 flex-col">
                                                            <span className="text-2xl font-black text-slate-800">{avgLast.toFixed(1)}</span>
                                                            <span className={`text-[10px] font-medium ${variacaoGeral >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                {lastBimIdx === 0 ? 'sem base comparativa anterior' : `${variacaoGeral >= 0 ? '+' : ''}${variacaoGeral.toFixed(1)} em relação ao bimes. anterior`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-red-50 rounded-2xl p-5 border border-red-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                                                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-100 rounded-full opacity-50"></div>
                                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                                            <h4 className="text-xs font-bold text-red-800 uppercase">Alertas de Queda</h4>
                                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                                        </div>
                                                        <div className="flex items-baseline gap-2 relative z-10">
                                                            <span className="text-2xl font-black text-red-600">{alertasCount.toString().padStart(2, '0')}</span>
                                                            <span className="text-xs font-bold text-red-500">estudantes</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Tabela Consolidada */}
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse min-w-max">
                                                    <thead>
                                                        <tr className="bg-slate-800 text-white border-b border-slate-700">
                                                            <th className="p-4 rounded-tl-xl w-16 text-center text-slate-400 font-medium">Nº</th>
                                                            <th className="p-4 font-bold text-sm tracking-wide bg-white text-slate-800 min-w-[200px] border-r border-slate-200">NOME DO ESTUDANTE</th>
                                                            <th className="p-4 text-center">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider block">1º Bimestre</span>
                                                            </th>
                                                            <th className="p-4 text-center">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider block">2º Bimestre</span>
                                                            </th>
                                                            <th className="p-4 text-center">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider block">3º Bimestre</span>
                                                            </th>
                                                            <th className="p-4 text-center">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider block">4º Bimestre</span>
                                                            </th>
                                                            <th className="p-4 text-center bg-emerald-700/80">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider block">Média Final</span>
                                                            </th>
                                                            <th className="p-4 text-center bg-emerald-800 rounded-tr-xl">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider block">Trajetória</span>
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {isLoadingStudents || isLoading ? (
                                                            <tr>
                                                                <td colSpan={8} className="p-12 text-center">
                                                                    <div className="flex flex-col items-center gap-3">
                                                                        <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                                                                        <span className="text-sm font-medium text-slate-400">Carregando estudantes...</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : loadError ? (
                                                            <tr>
                                                                <td colSpan={8} className="p-12 text-center">
                                                                    <div className="flex flex-col items-center gap-4">
                                                                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                                                            <AlertTriangle className="w-6 h-6 text-red-500" />
                                                                        </div>
                                                                        <p className="text-sm font-medium text-red-600">{loadError}</p>
                                                                        <button
                                                                            onClick={() => loadInitialData()}
                                                                            className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                                                                        >
                                                                            Tentar novamente
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : visaoGeralData.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={8} className="p-12 text-center">
                                                                    <div className="flex flex-col items-center gap-4">
                                                                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                                                                            <Users className="w-7 h-7 text-slate-400" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-slate-600 mb-1">Não existe nenhum estudante cadastrado para esta turma.</p>
                                                                            <p className="text-xs text-slate-400">Cadastre estudantes para visualizar o resultado consolidado.</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                        visaoGeralData.map(student => (
                                                            <tr key={student.id} className={`transition-colors group ${student.alert ? 'bg-red-50/30' : 'hover:bg-slate-50'}`}>
                                                                <td className="p-4 text-center text-sm font-medium text-slate-400 group-hover:text-blue-500 transition-colors">{student.id}</td>
                                                                <td className="p-4 text-sm font-bold text-slate-700">
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveStudentReport(student);
                                                                            setIsStudentReportOpen(true);
                                                                        }}
                                                                        className="flex items-center gap-2 group/btn text-left"
                                                                    >
                                                                        {student.alert && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                                                        <span className="group-hover/btn:text-blue-600 transition-colors border-b border-transparent group-hover/btn:border-blue-200 pb-0.5">{student.name}</span>
                                                                    </button>
                                                                </td>
                                                                <td className={`p-4 text-center text-sm font-bold ${student.b1 < 6 ? 'text-red-500' : 'text-slate-700'}`}>
                                                                    {student.b1.toFixed(1)}
                                                                </td>
                                                                <td className="p-4 text-center text-sm">
                                                                    <div className="flex flex-col items-center">
                                                                        <span className={`font-bold ${student.b2 < 6 ? 'text-red-500' : 'text-slate-700'}`}>{student.b2.toFixed(1)}</span>
                                                                        {renderVisaoGeralTrend(student.b2, student.b1)}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-center text-sm">
                                                                    <div className="flex flex-col items-center">
                                                                        <span className={`font-bold ${student.b3 < 6 ? 'text-red-500' : 'text-slate-700'}`}>{student.b3.toFixed(1)}</span>
                                                                        {renderVisaoGeralTrend(student.b3, student.b2)}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-center text-sm">
                                                                    <div className="flex flex-col items-center">
                                                                        <span className={`font-bold ${student.b4 < 6 ? 'text-red-500' : 'text-slate-700'}`}>{student.b4.toFixed(1)}</span>
                                                                        {renderVisaoGeralTrend(student.b4, student.b3)}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-center bg-slate-50 group-hover:bg-slate-100 transition-colors">
                                                                    <span className={`px-3 py-1.5 rounded-lg border font-bold text-sm ${student.mediaFinal < 6 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                                        {student.mediaFinal.toFixed(1)}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4">
                                                                    {renderVisaoGeralTrajectory(student)}
                                                                </td>
                                                            </tr>
                                                        ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center rounded-b-2xl">
                                                <div className="text-xs text-slate-500 font-medium">
                                                    Exibindo {visaoGeralData.length} alunos matriculados nesta turma
                                                </div>
                                                <div className="flex gap-1">
                                                    <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-400 disabled:opacity-50" disabled>&laquo;</button>
                                                    <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-400 disabled:opacity-50" disabled>&lsaquo;</button>
                                                    <button className="w-6 h-6 rounded flex items-center justify-center bg-white border border-slate-200 text-blue-600 font-bold text-xs shadow-sm">1</button>
                                                    <button className="w-6 h-6 rounded flex items-center justify-center bg-transparent text-slate-500 font-bold text-xs hover:bg-slate-200">2</button>
                                                    <button className="w-6 h-6 rounded flex items-center justify-center bg-transparent text-slate-500 font-bold text-xs hover:bg-slate-200">3</button>
                                                    <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-500">&rsaquo;</button>
                                                    <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-500">&raquo;</button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Legenda Evolução */}
                                        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex justify-between items-center shadow-sm">
                                            <div className="flex items-center gap-6">
                                                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" /> LEGENDA DE EVOLUÇÃO:
                                                </span>
                                                <div className="flex gap-6 text-xs text-slate-600 font-bold">
                                                    <span className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-emerald-500" /> Melhoria em relação ao bimestre anterior</span>
                                                    <span className="flex items-center gap-2"><ArrowDownRight className="w-4 h-4 text-red-500" /> Queda em relação ao bimestre anterior</span>
                                                    <span className="flex items-center gap-2"><Minus className="w-4 h-4 text-slate-400" /> Estabilidade</span>
                                                </div>
                                            </div>
                                            <span className="flex items-center gap-2 text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded-full uppercase">
                                                <AlertTriangle className="w-3 h-3" /> ALERTA CRÍTICO DE DESEMPENHO
                                            </span>
                                        </div>
                                    </div>
                                )
                            ) : avaliacaoEtapa === 'fundamental' ? (
                                <>
                                    {/* Legenda de Conceitos - Fundamental */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-6 flex justify-between items-center shadow-sm animate-fade-in">
                                        <div className="flex items-center gap-6 overflow-x-auto">
                                            <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 whitespace-nowrap">
                                                <AlertCircle className="w-4 h-4" /> LEGENDA DE CONCEITOS:
                                            </span>
                                            <div className="flex gap-4 text-xs font-bold">
                                                <span className="bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-full flex items-center gap-2 whitespace-nowrap">
                                                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-[10px] text-red-600">I</div>
                                                    INSUFICIENTE
                                                </span>
                                                <span className="bg-amber-50 text-amber-500 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-2 whitespace-nowrap">
                                                    <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px] text-amber-600">R</div>
                                                    REGULAR
                                                </span>
                                                <span className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full flex items-center gap-2 whitespace-nowrap">
                                                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600">B</div>
                                                    BOM (7.0 - 8.9)
                                                </span>
                                                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-2 whitespace-nowrap">
                                                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-600">E</div>
                                                    EXCELENTE (9.0 - 10.0)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                        <Lock className="w-3 h-3" />
                                        <span>Edição bloqueada pelo sistema após envio</span>
                                    </div>

                                    {/* Main Table Content - Ensino Fundamental */}
                                    <div className="overflow-x-auto mt-6">
                                        <table className="w-full text-left border-collapse min-w-max">
                                            <thead>
                                                <tr className="bg-slate-800 text-white border-b border-slate-700">
                                                    <th className="p-4 w-16 text-center text-slate-400 font-medium">Nº</th>
                                                    <th className="p-4 font-bold text-sm tracking-wide bg-white text-slate-800 min-w-[200px] border-r border-slate-200">ESTUDANTE</th>
                                                    <th className="p-4 text-center">
                                                        <Calendar className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Frequência</span>
                                                    </th>
                                                    <th className="p-4 text-center">
                                                        <Hand className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Participação</span>
                                                    </th>
                                                    <th className="p-4 text-center">
                                                        <Book className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Material</span>
                                                    </th>
                                                    <th className="p-4 text-center">
                                                        <CheckSquare className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Atividades</span>
                                                    </th>
                                                    <th className="p-4 text-center">
                                                        <MessageCircle className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Comunicação</span>
                                                    </th>
                                                    <th className="p-4 text-center">
                                                        <Search className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Pesquisa</span>
                                                    </th>
                                                    <th className="p-4 text-center">
                                                        <Users className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Conduta</span>
                                                    </th>
                                                    <th className="p-4 text-center bg-emerald-700/80">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider block mt-4">Média <br />(Período)</span>
                                                    </th>
                                                    <th className="p-4 text-center bg-emerald-800 rounded-tr-xl">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider block mt-4">Parecer <br />(Etapa)</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {isLoadingStudents || isLoading ? (
                                                    <tr>
                                                        <td colSpan={10} className="p-12 text-center">
                                                            <div className="flex flex-col items-center gap-3">
                                                                <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                                                                <span className="text-sm font-medium text-slate-400">Carregando estudantes...</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : loadError ? (
                                                    <tr>
                                                        <td colSpan={10} className="p-12 text-center">
                                                            <div className="flex flex-col items-center gap-4">
                                                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                                                </div>
                                                                <p className="text-sm font-medium text-red-600">{loadError}</p>
                                                                <button
                                                                    onClick={() => loadInitialData()}
                                                                    className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                                                                >
                                                                    Tentar novamente
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : studentsAvaliacao.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={10} className="p-12 text-center">
                                                            <div className="flex flex-col items-center gap-4">
                                                                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                                                                    <Users className="w-7 h-7 text-slate-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-600 mb-1">Não existe nenhum estudante cadastrado para esta turma.</p>
                                                                    <p className="text-xs text-slate-400">Cadastre estudantes para iniciar a avaliação docente.</p>
                                                                </div>
                                                                {!isEtapaReadOnly && (
                                                                    <button
                                                                        onClick={() => setIsCadastroEstudanteOpen(true)}
                                                                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-md"
                                                                    >
                                                                        <Users className="w-4 h-4" />
                                                                        Cadastrar Estudante
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    studentsAvaliacao.map(student => (
                                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="p-4 text-center text-sm font-medium text-slate-400 group-hover:text-emerald-500 transition-colors">{student.id}</td>
                                                        <td className="p-4 text-sm font-bold text-slate-700 border-r border-slate-100">
                                                            <button
                                                                onClick={() => {
                                                                    setActiveStudentReport(student);
                                                                    setIsStudentReportOpen(true);
                                                                }}
                                                                className="flex items-center gap-2 group/btn text-left w-full h-full"
                                                            >
                                                                <span className="group-hover/btn:text-emerald-600 transition-colors border-b border-transparent group-hover/btn:border-emerald-200 pb-0.5">{student.name}</span>
                                                            </button>
                                                        </td>
                                                        <td className="p-4 text-center">{renderConceptBadge(student.id, 'fre', student.fre)}</td>
                                                        <td className="p-4 text-center">{renderConceptBadge(student.id, 'par', student.par)}</td>
                                                        <td className="p-4 text-center">{renderConceptBadge(student.id, 'mat', student.mat)}</td>
                                                        <td className="p-4 text-center">{renderConceptBadge(student.id, 'atv', student.atv)}</td>
                                                        <td className="p-4 text-center">{renderConceptBadge(student.id, 'com', student.com)}</td>
                                                        <td className="p-4 text-center">{renderConceptBadge(student.id, 'pes', student.pes)}</td>
                                                        <td className="p-4 text-center">{renderConceptBadge(student.id, 'con', student.con)}</td>
                                                        <td className="p-4 text-center">
                                                            <button onClick={() => handleOpenGradeEditor(student)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer min-w-[3rem]">
                                                                {student.media.toFixed(1)}
                                                            </button>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {calculateParecerEtapa(student)}
                                                        </td>
                                                    </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {!isEtapaReadOnly && studentsAvaliacao.length > 0 && (
                                        <div className="mt-4 flex justify-center">
                                            <button
                                                onClick={() => setIsCadastroEstudanteOpen(true)}
                                                className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 hover:border-emerald-200 hover:text-emerald-600 transition-all flex items-center gap-3 shadow-sm group"
                                            >
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                                    <Users className="w-4 h-4 text-slate-500 group-hover:text-emerald-600" />
                                                </div>
                                                CADASTRAR E GERENCIAR ESTUDANTES
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : avaliacaoEtapa === 'infantil' ? (
                                // ===== TABELA EDUCAÇÃO INFANTIL =====
                                <>
                                    {/* Legenda de Conceitos - Infantil */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-4 mt-6 flex justify-between items-center shadow-sm animate-fade-in">
                                        <div className="flex items-center gap-6 overflow-x-auto">
                                            <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 whitespace-nowrap">
                                                <AlertTriangle className="w-4 h-4" /> LEGENDA DE CONCEITOS:
                                            </span>
                                            <div className="flex gap-4 text-xs font-bold">
                                                <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full flex items-center gap-2 whitespace-nowrap">
                                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white">D</div>
                                                    DESENVOLVIDO
                                                </span>
                                                <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full flex items-center gap-2 whitespace-nowrap">
                                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">ED</div>
                                                    EM DESENVOLVIMENTO
                                                </span>
                                                <span className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-full flex items-center gap-2 whitespace-nowrap">
                                                    <div className="w-5 h-5 rounded-full bg-slate-400 flex items-center justify-center text-[10px] text-white">ND</div>
                                                    NÃO DESENVOLVIDO
                                                </span>
                                            </div>
                                        </div>
                                        <div className="hidden md:flex items-center gap-2 text-[10px] font-medium text-slate-400 italic">
                                            <Lock className="w-3 h-3" />
                                            <span>Edição bloqueada pelo sistema após envio</span>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in mt-6">
                                        <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                                <Baby className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-0.5">Campo em Avaliação</h3>
                                                <p className="text-sm font-bold text-slate-800">{avaliacaoInfantilCampo}</p>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse min-w-max">
                                                <thead>
                                                    <tr className="bg-[#141B2D] text-white">
                                                        <th className="p-4 w-16 text-center font-bold text-xs uppercase border-r border-[#1e273b]">#</th>
                                                        <th className="p-4 font-bold text-xs tracking-wide min-w-[200px] border-r border-[#1e273b] uppercase">ESTUDANTE</th>
                                                        {/* Objetivos de Aprendizagem Dinâmicos da BNCC */}
                                                        {currentObjectives.map((obj) => (
                                                            <th key={obj.code} className="p-3 text-center border-r border-[#1e273b] min-w-[120px]" title={obj.desc}>
                                                                <span className="text-xs font-bold text-[#23B38A] block mb-1">{obj.code}</span>
                                                                <span className="text-[10px] text-slate-300 block leading-tight font-medium">{obj.short}</span>
                                                            </th>
                                                        ))}
                                                        <th className="p-4 text-center w-36">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider block text-white">Progresso do Campo</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {isLoadingStudents || isLoading ? (
                                                        <tr>
                                                            <td colSpan={currentObjectives.length + 3} className="p-12 text-center text-slate-400">
                                                                <div className="flex flex-col items-center gap-3">
                                                                    <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                                                                    <span className="text-sm font-medium">Carregando estudantes...</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : loadError ? (
                                                        <tr>
                                                            <td colSpan={currentObjectives.length + 3} className="p-12 text-center">
                                                                <div className="flex flex-col items-center gap-4">
                                                                    <AlertTriangle className="w-8 h-8 text-red-500" />
                                                                    <p className="text-sm font-medium text-red-600">{loadError}</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : studentsAvaliacaoInfantil.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={currentObjectives.length + 3} className="p-12 text-center text-slate-400">
                                                                <div className="flex flex-col items-center gap-4">
                                                                    <Users className="w-12 h-12 opacity-10" />
                                                                    <p className="text-sm font-medium">Não existe nenhum estudante cadastrado para esta turma.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        studentsAvaliacaoInfantil.map((student) => {
                                                            // Cálculo do progresso
                                                            let totalScore = 0;

                                                            let activeField = 'concepts_b1';
                                                            if (avaliacaoBimestre === '2º Bimestre') activeField = 'concepts_b2';
                                                            if (avaliacaoBimestre === '3º Bimestre') activeField = 'concepts_b3';
                                                            if (avaliacaoBimestre === '4º Bimestre') activeField = 'concepts_b4';

                                                            const activeConcepts = student[activeField] || [];
                                                            const studentConcepts = currentObjectives.map((_, i) => activeConcepts[i] || 'ND');
                                                            const maxScore = studentConcepts.length * 2;

                                                            studentConcepts.forEach(c => {
                                                                if (c === 'D') totalScore += 2;
                                                                else if (c === 'ED') totalScore += 1;
                                                            });

                                                            const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

                                                            let progressText = 'NÃO CONSOLIDADO';
                                                            let progressColor = 'bg-red-50 text-red-600 border-red-200';
                                                            if (activeConcepts.length === 0) {
                                                                progressText = 'AGUARDANDO...';
                                                                progressColor = 'bg-slate-50 text-slate-400 border-slate-200';
                                                            } else if (percentage > 70) {
                                                                progressText = 'CONSOLIDADO';
                                                                progressColor = 'bg-blue-50 text-blue-600 border-blue-200';
                                                            } else if (percentage >= 50) {
                                                                progressText = 'EM ATENÇÃO';
                                                                progressColor = 'bg-yellow-50 text-yellow-600 border-yellow-200';
                                                            }

                                                            return (
                                                                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                                                    <td className="p-4 text-center text-sm font-medium text-slate-400">{student.id}</td>
                                                                    <td className="p-4 text-sm font-bold text-slate-700 border-r border-slate-100 uppercase">{student.name}</td>
                                                                    {studentConcepts.map((concept, i) => {
                                                                        const isD = concept === 'D';
                                                                        const isED = concept === 'ED';
                                                                        
                                                                        const isND = concept === 'ND';

                                                                        let colors = 'bg-slate-50 text-slate-500 border-slate-200';
                                                                        if (isD) colors = 'bg-emerald-50 text-emerald-500 border-emerald-200';
                                                                        if (isED) colors = 'bg-blue-50 text-blue-500 border-blue-200';

                                                                        return (
                                                                            <td key={currentObjectives[i].code} className="p-4 text-center bg-transparent border-r border-slate-100/50">
                                                                                <div onClick={() => toggleInfantilConcept(student.id, i)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold mx-auto transition-transform hover:scale-110 cursor-pointer select-none ${colors}`}>
                                                                                    {concept}
                                                                                </div>
                                                                            </td>
                                                                        );
                                                                    })}
                                                                    <td className="p-4 text-center">
                                                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm border ${progressColor}`}>
                                                                            {progressText}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center rounded-b-2xl">
                                            <button
                                                onClick={() => setIsCadastroEstudanteOpen(true)}
                                                className="text-sm font-bold text-purple-600 flex items-center gap-2 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors border border-purple-100 bg-purple-50"
                                            >
                                                <Users className="w-4 h-4" /> Cadastrar Estudante
                                            </button>
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                                <span>GERENCIAMENTO DE ESTUDANTES POR CONTEXTO</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-12 text-center flex flex-col items-center justify-center animate-fade-in">
                                    <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-4 shadow-sm border border-amber-200">
                                        <Lock className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Etapa Não Liberada</h3>
                                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                                        O preenchimento desta etapa será liberado de acordo com o calendário acadêmico da rede educacional definido pela Secretaria.
                                    </p>
                                    <button className="bg-white border border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center gap-2 transition-all">
                                        <Calendar className="w-4 h-4" /> Ver Calendário Letivo
                                    </button>
                                </div>
                            )}
                    </div>
                );
            case 'acompanhamento':
                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-left">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">
                                        ACOMPANHAMENTO DOCENTE{acompEtapa === 'infantil' ? ' — EDUCAÇÃO INFANTIL' : ''}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {acompEtapa === 'infantil'
                                            ? 'Registros de observação contínua, evidências de aprendizagem e mediação pedagógica para o desenvolvimento integral da criança.'
                                            : 'Registros de acompanhamento contínuo e feedback para os professores.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!isEditingAcomp && !isEditingAcompInfantil && (
                                        <button
                                            onClick={() => {
                                                if (acompEtapa === 'infantil') {
                                                    setAcompInfantilForm({ id: '', professor: '', agrupamento: '', periodoLetivo: '1º Bimestre', data: '', campoExperiencia: '', crianca: '', tipoInteracao: '', evidencias: '', intencionalidade: '' });
                                                    setIsEditingAcompInfantil(true);
                                                } else {
                                                    setAcompForm({ id: '', professor: '', componente: '', turma: '', periodoLetivo: '1º Bimestre', data: '', estudante: '', lider: '', dificuldades: '', intervencao: '' });
                                                    setIsEditingAcomp(true);
                                                }
                                            }}
                                            className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                                        >
                                            <UserCheck size={18} /> Novo Acompanhamento
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Seletor de Etapa */}
                            {
                                (schoolLevels.hasBoth || (!schoolLevels.hasInfantil && !schoolLevels.hasFundamental)) && !activeTurma && (
                                    <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
                                        <button
                                            onClick={() => isFundamentalAllowed && setAcompEtapa('fundamental')}
                                            disabled={!isFundamentalAllowed}
                                            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${acompEtapa === 'fundamental'
                                                ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                                : 'text-slate-500 hover:text-slate-700'
                                                } ${!isFundamentalAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <School size={16} /> Ensino Fundamental
                                        </button>
                                        <button
                                            onClick={() => isInfantilAllowed && setAcompEtapa('infantil')}
                                            disabled={!isInfantilAllowed}
                                            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${acompEtapa === 'infantil'
                                                ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                                : 'text-slate-500 hover:text-slate-700'
                                                } ${!isInfantilAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Baby size={16} /> Educação Infantil
                                        </button>
                                    </div>
                                )
                            }

                            {/* Form Fundamental */}
                            {
                                acompEtapa === 'fundamental' && isEditingAcomp && (
                                    <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm mb-8 animate-fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Professor(a) Responsável</label>
                                                <input type="text" value={acompForm.professor} onChange={e => setAcompForm({ ...acompForm, professor: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Nome do(a) professor(a)..." />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Componente Curricular</label>
                                                <input type="text" value={acompForm.componente} onChange={e => setAcompForm({ ...acompForm, componente: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Ex: Português" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Turma</label>
                                                <input type="text" value={acompForm.turma} onChange={e => setAcompForm({ ...acompForm, turma: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Ex: 8º Ano A" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Período Letivo</label>
                                                <select value={acompForm.periodoLetivo || '1º Bimestre'} onChange={e => setAcompForm({ ...acompForm, periodoLetivo: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none">
                                                    <option>1º Bimestre</option><option>2º Bimestre</option><option>3º Bimestre</option><option>4º Bimestre</option>
                                                    <option>1º Semestre</option><option>2º Semestre</option><option>Anual</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data</label>
                                                <input type="date" value={acompForm.data} onChange={e => setAcompForm({ ...acompForm, data: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Líder de Turma</label>
                                                <input type="text" value={acompForm.lider} onChange={e => setAcompForm({ ...acompForm, lider: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Nome do líder da turma..." />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estudante com Dificuldade</label>
                                                <input type="text" value={acompForm.estudante} onChange={e => setAcompForm({ ...acompForm, estudante: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Nome do estudante..." />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dificuldades Encontradas</label>
                                                <textarea value={acompForm.dificuldades} onChange={e => setAcompForm({ ...acompForm, dificuldades: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none" placeholder="Descreva as dificuldades..." />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Intervenção Pedagógica do Professor</label>
                                                <textarea value={acompForm.intervencao} onChange={e => setAcompForm({ ...acompForm, intervencao: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none" placeholder="Descreva a intervenção aplicada..." />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                                            <button onClick={handleSaveAcomp} className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-colors flex items-center gap-2">Salvar Registro</button>
                                            <button onClick={() => setIsEditingAcomp(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-semibold transition-colors">Cancelar</button>
                                        </div>
                                    </div>
                                )
                            }

                            {/* Form Infantil */}
                            {
                                acompEtapa === 'infantil' && isEditingAcompInfantil && (
                                    <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm mb-8 animate-fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Professor(a) Responsável</label>
                                                <input type="text" value={acompInfantilForm.professor} onChange={e => setAcompInfantilForm({ ...acompInfantilForm, professor: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Nome completo do docente" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Agrupamento/Turma</label>
                                                <input type="text" value={acompInfantilForm.agrupamento} onChange={e => setAcompInfantilForm({ ...acompInfantilForm, agrupamento: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Ex: Berçário II A" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Período Letivo</label>
                                                <select value={acompInfantilForm.periodoLetivo} onChange={e => setAcompInfantilForm({ ...acompInfantilForm, periodoLetivo: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                                                    <option>1º Bimestre</option><option>2º Bimestre</option><option>3º Bimestre</option><option>4º Bimestre</option>
                                                    <option>1º Semestre</option><option>2º Semestre</option><option>Anual</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data</label>
                                                <input type="date" value={acompInfantilForm.data} onChange={e => setAcompInfantilForm({ ...acompInfantilForm, data: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Campo de Experiência (BNCC)</label>
                                                <select value={acompInfantilForm.campoExperiencia} onChange={e => setAcompInfantilForm({ ...acompInfantilForm, campoExperiencia: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                                                    <option value="">Selecione o campo principal</option>
                                                    {CAMPOS_EXPERIENCIA_BNCC.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Criança em Observação</label>
                                                <input type="text" value={acompInfantilForm.crianca} onChange={e => setAcompInfantilForm({ ...acompInfantilForm, crianca: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Nome da criança" />
                                            </div>
                                        </div>
                                        <div className="mt-6">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Tipo de Interação Predominante</label>
                                            <div className="flex gap-4 flex-wrap">
                                                {['Criança-Criança', 'Criança-Adulto', 'Criança-Ambiente'].map(tipo => (
                                                    <label key={tipo} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium ${acompInfantilForm.tipoInteracao === tipo
                                                        ? 'bg-orange-50 border-orange-300 text-orange-700'
                                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                                                        }`}>
                                                        <input type="radio" name="tipoInteracao" value={tipo} checked={acompInfantilForm.tipoInteracao === tipo} onChange={e => setAcompInfantilForm({ ...acompInfantilForm, tipoInteracao: e.target.value })} className="sr-only" />
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${acompInfantilForm.tipoInteracao === tipo ? 'border-orange-500' : 'border-slate-300'}`}>
                                                            {acompInfantilForm.tipoInteracao === tipo && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                                        </div>
                                                        {tipo}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mt-6">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Evidências de Aprendizagem e Desenvolvimento</label>
                                            <textarea value={acompInfantilForm.evidencias} onChange={e => setAcompInfantilForm({ ...acompInfantilForm, evidencias: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-28 resize-none" placeholder="Descreva os processos observados, as falas, as conquistas e as descobertas da criança durante a vivência..." />
                                        </div>
                                        <div className="mt-6">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Intencionalidade Pedagógica / Mediação do Professor</label>
                                            <textarea value={acompInfantilForm.intencionalidade} onChange={e => setAcompInfantilForm({ ...acompInfantilForm, intencionalidade: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-28 resize-none" placeholder="Descreva qual foi o seu papel como mediador, as intervenções feitas e como o ambiente foi preparado para potencializar a experiênci..." />
                                        </div>
                                        <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                                            <button onClick={handleSaveAcompInfantil} className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-colors flex items-center gap-2">Salvar Registro</button>
                                            <button onClick={() => setIsEditingAcompInfantil(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-semibold transition-colors">Cancelar</button>
                                        </div>
                                    </div>
                                )
                            }

                            {/* List Fundamental */}
                            {
                                acompEtapa === 'fundamental' && (
                                    <div className="space-y-4">
                                        {mockAcompanhamentos.filter(a => a.etapa !== 'infantil').map(acomp => (
                                            <div key={acomp.id} className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between lg:items-start gap-6 group">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        <span className="px-3 py-1 text-xs font-bold uppercase rounded-full border border-slate-200 text-slate-500">{acomp.turma}</span>
                                                        <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">{acomp.componente}</span>
                                                        {acomp.data && <span className="text-xs font-medium text-slate-400">Data: {acomp.data}</span>}
                                                        {acomp.periodoLetivo && <span className="text-xs font-medium text-slate-400 border-l border-slate-200 pl-3">Período: {acomp.periodoLetivo}</span>}
                                                    </div>
                                                    <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1">Prof. {acomp.professor}</h4>
                                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                            <div className="mb-3">
                                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Estudante c/ Dificuldade</p>
                                                                <p className="text-sm font-semibold text-slate-700">{acomp.estudante}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Dificuldades</p>
                                                                <p className="text-sm text-slate-600 line-clamp-3">{acomp.dificuldades}</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                                                            <div className="mb-3">
                                                                <p className="text-xs font-bold text-emerald-600/80 uppercase mb-1">Intervenção Pedagógica</p>
                                                                <p className="text-sm text-slate-700 line-clamp-3">{acomp.intervencao}</p>
                                                            </div>
                                                            {acomp.lider && (
                                                                <div className="pt-3 border-t border-emerald-100/50">
                                                                    <p className="text-xs font-bold text-emerald-600/80 uppercase mb-1 flex items-center gap-1"><UserCheck size={12} /> Líder de Turma</p>
                                                                    <p className="text-sm text-slate-600">{acomp.lider}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-row lg:flex-col justify-center">
                                                    <button title="Editar" onClick={() => handleEditAcomp(acomp)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-brand-orange hover:border-orange-200 transition-all flex-shrink-0"><Edit size={16} /></button>
                                                    <button title="Excluir" onClick={() => handleDeleteAcomp(acomp.id)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex-shrink-0"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        ))}
                                        {mockAcompanhamentos.filter(a => a.etapa !== 'infantil').length === 0 && !isEditingAcomp && (
                                            <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                                <p className="text-slate-500">Nenhum acompanhamento docente registrado.</p>
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            {/* List Infantil */}
                            {
                                acompEtapa === 'infantil' && (
                                    <div className="space-y-4">
                                        {mockAcompInfantil.map(acomp => (
                                            <div key={acomp.id} className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between lg:items-start gap-6 group">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        <span className="px-3 py-1 text-xs font-bold uppercase rounded-full border border-slate-200 text-slate-500">{acomp.agrupamento}</span>
                                                        <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-purple-50 text-purple-600 border border-purple-100">{acomp.campoExperiencia}</span>
                                                        {acomp.data && <span className="text-xs font-medium text-slate-400">Data: {acomp.data}</span>}
                                                        {acomp.periodoLetivo && <span className="text-xs font-medium text-slate-400 border-l border-slate-200 pl-3">Período: {acomp.periodoLetivo}</span>}
                                                    </div>
                                                    <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1">Prof. {acomp.professor}</h4>
                                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                            <div className="mb-3">
                                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Criança em Observação</p>
                                                                <p className="text-sm font-semibold text-slate-700">{acomp.crianca}</p>
                                                            </div>
                                                            {acomp.tipoInteracao && (
                                                                <div className="mb-3">
                                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tipo de Interação</p>
                                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-50 text-orange-600 border border-orange-100">{acomp.tipoInteracao}</span>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Evidências de Aprendizagem</p>
                                                                <p className="text-sm text-slate-600 line-clamp-3">{acomp.evidencias}</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100/50">
                                                            <div>
                                                                <p className="text-xs font-bold text-purple-600/80 uppercase mb-1">Intencionalidade Pedagógica / Mediação</p>
                                                                <p className="text-sm text-slate-700 line-clamp-4">{acomp.intencionalidade}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {mockAcompInfantil.length === 0 && !isEditingAcompInfantil && (
                                            <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <Baby className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                                <p className="text-slate-500">Nenhum registro de acompanhamento infantil.</p>
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                        </div>
                    </div>
                );
            case 'encaminhamentos':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-left">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">
                                    ENCAMINHAMENTOS E INTERVENÇÕES{encEtapa === 'infantil' ? ' — EDUCAÇÃO INFANTIL' : ''}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {encEtapa === 'infantil'
                                        ? 'Gestão de planos de intervenção pedagógica e acompanhamento para a Educação Infantil.'
                                        : 'Gestão de planos de intervenção pedagógica e encaminhamentos multidisciplinares.'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {!isEditingEnc && !isEditingEncInfantil && (
                                    <button
                                        onClick={() => {
                                            if (encEtapa === 'infantil') {
                                                setEncInfantilForm({ id: '', crianca: '', agrupamento: '', campoExperiencia: '', periodoLetivo: '1º Bimestre', data: '', evidencias: '', estrategia: '', professor: '', status: 'Pendente' });
                                                setIsEditingEncInfantil(true);
                                            } else {
                                                setEncForm({ id: '', estudante: '', turma: '', tipo: 'Pedagógico', descricao: '', encaminhamento: '', data: '', periodoLetivo: '1º Bimestre', status: 'Pendente', responsavel: '' });
                                                setIsEditingEnc(true);
                                            }
                                        }}
                                        className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                                    >
                                        <AlertTriangle size={18} /> Novo Encaminhamento
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Seletor de Etapa */}
                        {(schoolLevels.hasBoth || (!schoolLevels.hasInfantil && !schoolLevels.hasFundamental)) && !activeTurma && (
                            <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
                                <button
                                    onClick={() => isFundamentalAllowed && setEncEtapa('fundamental')}
                                    disabled={!isFundamentalAllowed}
                                    className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${encEtapa === 'fundamental'
                                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-700'
                                        } ${!isFundamentalAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <School size={16} /> Ensino Fundamental
                                </button>
                                <button
                                    onClick={() => isInfantilAllowed && setEncEtapa('infantil')}
                                    disabled={!isInfantilAllowed}
                                    className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${encEtapa === 'infantil'
                                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-700'
                                        } ${!isInfantilAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Baby size={16} /> Educação Infantil
                                </button>
                            </div>
                        )}

                        {/* ===== FORMULÁRIO ENSINO FUNDAMENTAL ===== */}
                        {encEtapa === 'fundamental' && isEditingEnc && (
                            <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm mb-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estudante</label>
                                        <input type="text" value={encForm.estudante} onChange={e => setEncForm({ ...encForm, estudante: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Nome do aluno..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Turma</label>
                                        <input type="text" value={encForm.turma} onChange={e => setEncForm({ ...encForm, turma: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Ex: 6º Ano A" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Intervenção</label>
                                        <select value={encForm.tipo} onChange={e => setEncForm({ ...encForm, tipo: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none">
                                            <option>Pedagógico</option><option>Psicológico</option><option>Familiar / Responsáveis</option><option>Saúde / Rede de Apoio</option><option>Disciplinar</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Período Letivo</label>
                                        <select value={encForm.periodoLetivo || '1º Bimestre'} onChange={e => setEncForm({ ...encForm, periodoLetivo: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none">
                                            <option>1º Bimestre</option><option>2º Bimestre</option><option>3º Bimestre</option><option>4º Bimestre</option>
                                            <option>1º Semestre</option><option>2º Semestre</option><option>Anual</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data do Registro</label>
                                        <input type="date" value={encForm.data} onChange={e => setEncForm({ ...encForm, data: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição do Caso / Motivo</label>
                                        <textarea value={encForm.descricao} onChange={e => setEncForm({ ...encForm, descricao: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none" placeholder="Descreva detalhadamente a situação e o motivo do encaminhamento..." />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Encaminhamento / Ação Proposta</label>
                                        <textarea value={encForm.encaminhamento} onChange={e => setEncForm({ ...encForm, encaminhamento: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none" placeholder="Especifique qual ação deve ser tomada, para onde ou para quem o aluno será encaminhado..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Responsável pela Ação</label>
                                        <input type="text" value={encForm.responsavel} onChange={e => setEncForm({ ...encForm, responsavel: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Nome do/a responsável..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                                        <select value={encForm.status} onChange={e => setEncForm({ ...encForm, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none">
                                            <option value="Pendente">Pendente</option><option value="Em Andamento">Em Andamento</option><option value="Concluído">Concluído</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                                    <button onClick={handleSaveEnc} className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-colors flex items-center gap-2">Salvar Registro</button>
                                    <button onClick={() => setIsEditingEnc(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-semibold transition-colors">Cancelar</button>
                                </div>
                            </div>
                        )}

                        {/* ===== FORMULÁRIO EDUCAÇÃO INFANTIL ===== */}
                        {encEtapa === 'infantil' && isEditingEncInfantil && (
                            <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm mb-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Criança</label>
                                        <input type="text" value={encInfantilForm.crianca} onChange={e => setEncInfantilForm({ ...encInfantilForm, crianca: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Nome da criança..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Agrupamento / Turma</label>
                                        <input type="text" value={encInfantilForm.agrupamento} onChange={e => setEncInfantilForm({ ...encInfantilForm, agrupamento: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Ex: Maternal II - Integral" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Campo de Experiência (BNCC)</label>
                                        <select value={encInfantilForm.campoExperiencia} onChange={e => setEncInfantilForm({ ...encInfantilForm, campoExperiencia: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                                            <option value="">Selecione o campo...</option>
                                            {CAMPOS_EXPERIENCIA_BNCC.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Período Letivo</label>
                                        <select value={encInfantilForm.periodoLetivo} onChange={e => setEncInfantilForm({ ...encInfantilForm, periodoLetivo: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                                            <option>1º Bimestre</option><option>2º Bimestre</option><option>3º Bimestre</option><option>4º Bimestre</option>
                                            <option>1º Semestre</option><option>2º Semestre</option><option>Anual</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data da Observação</label>
                                        <input type="date" value={encInfantilForm.data} onChange={e => setEncInfantilForm({ ...encInfantilForm, data: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Evidências Observadas / Motivo do Registro</label>
                                        <textarea value={encInfantilForm.evidencias} onChange={e => setEncInfantilForm({ ...encInfantilForm, evidencias: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-28 resize-none" placeholder="Descreva detalhadamente as situações observadas no cotidiano escolar..." />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estratégia Pedagógica / Intervenção Proposta</label>
                                        <textarea value={encInfantilForm.estrategia} onChange={e => setEncInfantilForm({ ...encInfantilForm, estrategia: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-28 resize-none" placeholder="Especifique qual intervenção ou estratégia será adotada para favorecer o desenvolvimento da criança..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Professor(a) Responsável</label>
                                        <input type="text" value={encInfantilForm.professor} onChange={e => setEncInfantilForm({ ...encInfantilForm, professor: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Nome do/a profissional..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status do Acompanhamento</label>
                                        <select value={encInfantilForm.status} onChange={e => setEncInfantilForm({ ...encInfantilForm, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                                            <option value="Pendente">Pendente</option><option value="Em Andamento">Em Andamento</option><option value="Concluído">Concluído</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                                    <button onClick={handleSaveEncInfantil} className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-colors flex items-center gap-2">Salvar Registro</button>
                                    <button onClick={() => setIsEditingEncInfantil(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-semibold transition-colors">Cancelar</button>
                                </div>
                            </div>
                        )}

                        {/* ===== LISTA DE REGISTROS FUNDAMENTAL ===== */}
                        {encEtapa === 'fundamental' && (
                            <div className="space-y-4">
                                {mockEncaminhamentos.filter(e => e.etapa !== 'infantil').map(enc => (
                                    <div key={enc.id} className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between lg:items-center gap-6 group">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${enc.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : enc.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{enc.status}</span>
                                                <span className="px-3 py-1 text-xs font-bold uppercase rounded-full border border-slate-200 text-slate-500">{enc.tipo}</span>
                                                <span className="text-xs font-medium text-slate-400">Registrado em: {enc.data}</span>
                                                {enc.periodoLetivo && <span className="text-xs font-medium text-slate-400 border-l border-slate-200 pl-3">Período: {enc.periodoLetivo}</span>}
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1">{enc.estudante} <span className="text-slate-400 font-normal text-sm ml-2">({enc.turma})</span></h4>
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Motivo / Descrição</p>
                                                    <p className="text-sm text-slate-600 line-clamp-2">{enc.descricao}</p>
                                                </div>
                                                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100/50">
                                                    <p className="text-xs font-bold text-orange-400/80 uppercase mb-1">Encaminhamento</p>
                                                    <p className="text-sm text-slate-700 line-clamp-2">{enc.encaminhamento}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-4">
                                                <p className="text-xs font-medium text-slate-500 tracking-wide flex items-center gap-1">Resp: {enc.responsavel}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity lg:flex-col justify-center">
                                            <button title="Editar" onClick={() => handleEditEnc(enc)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-brand-orange hover:border-orange-200 transition-all flex-shrink-0"><Edit size={16} /></button>
                                            <button title="Excluir" onClick={() => handleDeleteEnc(enc.id)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex-shrink-0"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                {mockEncaminhamentos.filter(e => e.etapa !== 'infantil').length === 0 && !isEditingEnc && (
                                    <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500">Nenhum encaminhamento ou intervenção registrada.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ===== LISTA DE REGISTROS INFANTIL ===== */}
                        {encEtapa === 'infantil' && (
                            <div className="space-y-4">
                                {mockEncInfantil.map(enc => (
                                    <div key={enc.id} className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between lg:items-center gap-6 group">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${enc.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : enc.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{enc.status}</span>
                                                <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-purple-50 text-purple-600 border border-purple-100">{enc.campoExperiencia}</span>
                                                {enc.data && <span className="text-xs font-medium text-slate-400">Data: {enc.data}</span>}
                                                {enc.periodoLetivo && <span className="text-xs font-medium text-slate-400 border-l border-slate-200 pl-3">Período: {enc.periodoLetivo}</span>}
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1">{enc.crianca} <span className="text-slate-400 font-normal text-sm ml-2">({enc.agrupamento})</span></h4>
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Evidências Observadas</p>
                                                    <p className="text-sm text-slate-600 line-clamp-3">{enc.evidencias}</p>
                                                </div>
                                                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100/50">
                                                    <p className="text-xs font-bold text-purple-600/80 uppercase mb-1">Estratégia Pedagógica</p>
                                                    <p className="text-sm text-slate-700 line-clamp-3">{enc.estrategia}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-4">
                                                <p className="text-xs font-medium text-slate-500 tracking-wide flex items-center gap-1">Prof.: {enc.professor}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity lg:flex-col justify-center">
                                            <button title="Editar" onClick={() => handleEditEncInfantil(enc)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-brand-orange hover:border-orange-200 transition-all flex-shrink-0"><Edit size={16} /></button>
                                            <button title="Excluir" onClick={() => handleDeleteEncInfantil(enc.id)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex-shrink-0"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                {mockEncInfantil.length === 0 && !isEditingEncInfantil && (
                                    <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <Baby className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500">Nenhum encaminhamento ou intervenção da Educação Infantil registrada.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const handleProcessarSolicitacao = async (requestId: string, aprovado: boolean) => {
        const justificativaAnalise = prompt(aprovado ? 'Confirmar autorização (opcional):' : 'Motivo da negação (obrigatório):');
        if (!aprovado && !justificativaAnalise) {
            alert('A justificativa de negação é obrigatória.');
            return;
        }

        try {
            const status = aprovado ? 'autorizada' : 'negada';
            const request = allPendingRequests.find(r => r.id === requestId);

            await ccSolicitacaoDesbloqueioService.processar(requestId, {
                status,
                analisado_por: userEmail,
                justificativa_analise: justificativaAnalise
            });

            if (aprovado && request?.avaliacoes_etapas?.id) {
                await ccAvaliacaoEtapaService.atualizarStatus(request.avaliacoes_etapas.id, 'desbloqueada', false);
            }

            alert(`Solicitação ${status} com sucesso.`);
            loadAllPendingRequests();
            loadEtapaStatus();
        } catch (error) {
            console.error('Erro ao processar solicitação:', error);
            alert('Erro ao processar.');
        }
    };

    const renderAdminRequestsPanel = () => {
        if (!showAdminPanel) return null;

        return (
            <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-xl overflow-hidden mt-6 animate-scale-in">
                <div className="bg-purple-900 p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-purple-300" />
                        <h3 className="font-bold">Gerenciamento de Solicitações de Desbloqueio</h3>
                    </div>
                    <button onClick={() => setShowAdminPanel(false)} className="text-purple-300 hover:text-white">&times;</button>
                </div>
                <div className="p-4">
                    {allPendingRequests.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 font-medium">Não há solicitações pendentes no momento.</div>
                    ) : (
                        <div className="space-y-3">
                            {allPendingRequests.map(req => (
                                <div key={req.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">{req.etapa}</span>
                                            <span className="text-slate-400 text-[10px]">•</span>
                                            <span className="text-slate-500 text-xs font-bold">{req.turma_id}</span>
                                            <span className="text-slate-400 text-[10px]">•</span>
                                            <span className="text-slate-500 text-xs">{req.periodo}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 mb-1">Solicitado por: {req.solicitado_por}</p>
                                        <div className="bg-white border border-slate-100 p-2 rounded-lg text-xs text-slate-600 italic">
                                            &quot;{req.justificativa}&quot;
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide">Solicitado em: {new Date(req.solicitado_em).toLocaleString()}</p>
                                    </div>
                                    <div className="flex gap-2 ml-6">
                                        <button
                                            onClick={() => handleProcessarSolicitacao(req.id, false)}
                                            className="bg-white border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
                                        >
                                            Negar
                                        </button>
                                        <button
                                            onClick={() => handleProcessarSolicitacao(req.id, true)}
                                            className="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-200 transition-all"
                                        >
                                            Autorizar Desbloqueio
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderUnlockModal = () => {
        if (!showUnlockModal) return null;

        return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
                    <div className="bg-amber-500 p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Lock className="w-6 h-6 text-amber-200" />
                            <div>
                                <h3 className="text-xl font-bold">Solicitar Desbloqueio da Etapa</h3>
                                <p className="text-amber-100 text-xs font-medium uppercase tracking-wider">{avaliacaoBimestre} • {avaliacaoEtapa}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowUnlockModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors hover:rotate-90">
                            &times;
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <strong>Atenção:</strong> A solicitação será enviada para a coordenação regional. Justifique o motivo da alteração necessária após o envio oficial.
                            </p>
                        </div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Justificativa da Edição</label>
                        <textarea
                            value={unlockJustification}
                            onChange={e => setUnlockJustification(e.target.value)}
                            placeholder="Descreva detalhadamente o motivo pelo qual você precisa editar esta etapa já enviada..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 min-h-[140px] resize-none text-slate-700"
                        />
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <button
                            onClick={() => setShowUnlockModal(false)}
                            className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSolicitarDesbloqueio}
                            disabled={isRequestingUnlock}
                            className="flex-[2] bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2"
                        >
                            {isRequestingUnlock ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : <Send className="w-4 h-4" />}
                            Enviar Solicitação
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-12 animate-fade-in relative">
            {renderAdminRequestsPanel()}
            {renderUnlockModal()}
            <PageHeader
                title="Conselho de Classe"
                subtitle="Análise coletiva sobre o processo de ensino e aprendizagem"
                icon={GraduationCap}
                badgeText="GESTÃO"
                actions={[]}
            />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-wrap gap-2">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as Tab)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-orange-400' : ''}`} />
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="mt-8">
                {isLoading && (activeTab === 'acompanhamento' || activeTab === 'encaminhamentos') ? (
                    <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
                        <span className="ml-3 text-slate-500 font-medium">Carregando dados...</span>
                    </div>
                ) : (
                    renderTabContent()
                )}
            </div>
            {editingGradesStudentId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-emerald-500" /> Notas do Período
                                </h3>
                                <p className="text-slate-400 text-xs mt-1">
                                    {studentsAvaliacao.find(s => s.id === editingGradesStudentId)?.name}
                                </p>
                            </div>
                            <button onClick={() => setEditingGradesStudentId(null)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors">
                                &times;
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Avaliação 1</label>
                                    <input type="number" step="0.1" value={gradeForm.av1} onChange={e => setGradeForm({ ...gradeForm, av1: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-center font-bold text-slate-700" placeholder="0.0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Avaliação 2</label>
                                    <input type="number" step="0.1" value={gradeForm.av2} onChange={e => setGradeForm({ ...gradeForm, av2: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-center font-bold text-slate-700" placeholder="0.0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Avaliação 3</label>
                                    <input type="number" step="0.1" value={gradeForm.av3} onChange={e => setGradeForm({ ...gradeForm, av3: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-center font-bold text-slate-700" placeholder="0.0" />
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-6">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-amber-500 uppercase mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Recuperação
                                    </label>
                                    <input type="number" step="0.1" value={gradeForm.rec} onChange={e => setGradeForm({ ...gradeForm, rec: e.target.value })} className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-center font-bold text-amber-700 placeholder:text-amber-300" placeholder="Nota Opcional" />
                                </div>

                                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex-1 flex flex-col items-center justify-center">
                                    <div className="text-[10px] font-bold text-emerald-600/80 uppercase mb-1">Cálculo Atual</div>
                                    <div className="text-2xl font-black text-emerald-600">
                                        {(() => {
                                            const a = parseFloat(gradeForm.av1) || 0;
                                            const b = parseFloat(gradeForm.av2) || 0;
                                            const c = parseFloat(gradeForm.av3) || 0;
                                            const r = gradeForm.rec ? parseFloat(gradeForm.rec) : null;
                                            let m = (a + b + c) / 3;
                                            if (r !== null && r > m) m = r;
                                            return m.toFixed(1);
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setEditingGradesStudentId(null)} className="flex-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold py-3 rounded-xl transition-colors">
                                Voltar
                            </button>
                            <button onClick={handleSaveGrades} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-colors flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-5 h-5" /> Salvar Média
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CadastroTurmaModal
                isOpen={isTurmaModalOpen}
                onClose={() => setIsTurmaModalOpen(false)}
                onSave={handleSalvarTurma}
                onDelete={handleDeleteTurma}
                turmasExistentes={turmasCadastradas}
            />

            <StudentReportModal
                isOpen={isStudentReportOpen}
                onClose={() => setIsStudentReportOpen(false)}
                student={activeStudentReport}
                context={avaliacaoBimestre}
            />

            {/* Modal de Cadastro de Estudante */}
            {isCadastroEstudanteOpen && (
                <CadastroEstudanteModal
                    isOpen={isCadastroEstudanteOpen}
                    onClose={() => setIsCadastroEstudanteOpen(false)}
                    context={{
                        schoolName: currentEscola?.nome || '',
                        schoolId: currentEscolaId,
                        responsibleName: currentUser?.nome || userEmail || 'PROFESSOR(A)',
                        contextName: avaliacaoEtapa === 'fundamental' ? avaliacaoBimestre : avaliacaoInfantilCampo,
                        groupName: `${activeTurma?.anoSerie} - ${activeTurma?.identificacao}`,
                        classId: activeTurma?.id || ''
                    }}
                    escolas={escolas}
                    onOpenTurmaModal={() => { setIsCadastroEstudanteOpen(false); setIsTurmaModalOpen(true); }}
                    onSuccess={() => {
                        loadInitialData();
                    }}
                />
            )}

            <PrintableConselhoReport
                escola={currentEscola}
                turma={activeTurma}
                etapa={avaliacaoEtapa}
                context={avaliacaoBimestre}
                componenteCurricular={selectedComponenteCurricular}
                data={avaliacaoBimestre === 'Resultado Consolidado' ? visaoGeralData : studentsAvaliacao}
                coordenador={currentUser}
            />
        </div>
    );
};

export default ConselhoClasse;
