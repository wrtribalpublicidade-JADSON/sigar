import React, { useState } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Users, BookOpen, UserCheck, AlertTriangle, GraduationCap, Edit, Trash2, Calendar, Hand, Book, CheckSquare, MessageCircle, Search, Printer, Lock, Send, CheckCircle2, FileText, LayoutDashboard, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, AlertCircle, FileDown, Download } from 'lucide-react';
import { CadastroTurmaModal, TurmaData } from './modals/CadastroTurmaModal';
import { StudentReportModal } from './modals/StudentReportModal';
import { ReuniaoEstudantilForm } from './ReuniaoEstudantilForm';

type Tab = 'estudantil' | 'avaliacao' | 'acompanhamento' | 'encaminhamentos';

export const ConselhoClasse: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('estudantil');

    // ============================================
    // ESTADOS: AVALIAÇÃO DOCENTE
    // ============================================
    const [avaliacaoBimestre, setAvaliacaoBimestre] = useState('Resultado Consolidado');
    const [isTurmaModalOpen, setIsTurmaModalOpen] = useState(false);
    const [isStudentReportOpen, setIsStudentReportOpen] = useState(false);
    const [activeStudentReport, setActiveStudentReport] = useState<any>(null);
    const [turmasCadastradas, setTurmasCadastradas] = useState<TurmaData[]>([
        { etapa: 'Anos Iniciais', anoSerie: '5º ANO', identificacao: 'Turma B', turno: 'MANHÃ', tipo: 'REGULAR' }
    ]);
    const [activeTurma, setActiveTurma] = useState<TurmaData>(turmasCadastradas[0]);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const handleSalvarTurma = (novaTurma: TurmaData) => {
        setTurmasCadastradas([...turmasCadastradas, novaTurma]);
        setActiveTurma(novaTurma);
        setIsTurmaModalOpen(false);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    const [studentsAvaliacao, setStudentsAvaliacao] = useState<any[]>([
        { id: 1, name: 'ANA BEATRIZ SILVA SANTOS', fre: 'E', par: 'B', mat: 'R', atv: 'I', com: 'E', pes: 'B', con: 'R', notas: { av1: 7, av2: 8, av3: 7.5, rec: null }, media: 7.5, parecer: 'PLENO' },
        { id: 2, name: 'BRUNO FERREIRA LIMA', fre: 'B', par: 'R', mat: 'I', atv: 'E', com: 'B', pes: 'R', con: 'I', notas: { av1: 7, av2: 8, av3: 7.5, rec: null }, media: 7.5, parecer: 'PLENO' },
        { id: 3, name: 'CARLA OLIVEIRA COSTA', fre: 'R', par: 'I', mat: 'E', atv: 'B', com: 'R', pes: 'I', con: 'E', notas: { av1: 7, av2: 8, av3: 7.5, rec: null }, media: 7.5, parecer: 'PLENO' },
        { id: 4, name: 'DANIEL SOUZA REIS', fre: 'I', par: 'E', mat: 'B', atv: 'R', com: 'I', pes: 'E', con: 'B', notas: { av1: 7, av2: 8, av3: 7.5, rec: null }, media: 7.5, parecer: 'PLENO' },
        { id: 5, name: 'ELIANA COSTA MENDES', fre: 'E', par: 'B', mat: 'R', atv: 'I', com: 'E', pes: 'B', con: 'R', notas: { av1: 7, av2: 8, av3: 7.5, rec: null }, media: 7.5, parecer: 'PLENO' },
        { id: 6, name: 'FABIO SANTOS JUNIOR', fre: 'B', par: 'R', mat: 'I', atv: 'E', com: 'B', pes: 'R', con: 'I', notas: { av1: 7, av2: 8, av3: 7.5, rec: null }, media: 7.5, parecer: 'PLENO' },
        { id: 7, name: 'GABRIELA LIMA VIANA', fre: 'R', par: 'I', mat: 'E', atv: 'B', com: 'R', pes: 'I', con: 'E', notas: { av1: 7, av2: 8, av3: 7.5, rec: null }, media: 7.5, parecer: 'PLENO' },
        { id: 8, name: 'HUGO ALMEIDA PRADO', fre: 'I', par: 'E', mat: 'B', atv: 'R', com: 'I', pes: 'E', con: 'B', notas: { av1: 7, av2: 8, av3: 7.5, rec: null }, media: 7.5, parecer: 'PLENO' },
        { id: 9, name: 'IARA GOMES MOTA', fre: 'E', par: 'B', mat: 'R', atv: 'I', com: 'E', pes: 'B', con: 'R', notas: { av1: 7, av2: 8, av3: 7.5, rec: null }, media: 7.5, parecer: 'PLENO' },
        { id: 10, name: 'JOÃO PEREIRA NETO', fre: 'B', par: 'R', mat: 'I', atv: 'E', com: 'B', pes: 'R', con: 'I', notas: { av1: 7, av2: 8, av3: 7.5, rec: null }, media: 7.5, parecer: 'PLENO' },
        { id: 11, name: 'KEILA ROCHA SILVA', fre: 'R', par: 'I', mat: 'E', atv: 'B', com: 'R', pes: 'I', con: 'E', notas: { av1: 7, av2: 8, av3: 7.5, rec: null }, media: 7.5, parecer: 'PLENO' },
        { id: 12, name: 'LUCAS MARTINS DIAS', fre: 'I', par: 'E', mat: 'B', atv: 'R', com: 'I', pes: 'E', con: 'B', notas: { av1: 7, av2: 8, av3: 7.5, rec: null }, media: 7.5, parecer: 'PLENO' },
        { id: 13, name: 'MARIA EDUARDA GOMES', fre: 'E', par: 'B', mat: 'R', atv: 'I', com: 'E', pes: 'B', con: 'R', notas: { av1: 7, av2: 8, av3: 7.5, rec: null }, media: 7.5, parecer: 'PLENO' },
    ]);

    const [editingGradesStudentId, setEditingGradesStudentId] = useState<number | null>(null);
    const [gradeForm, setGradeForm] = useState({ av1: '', av2: '', av3: '', rec: '' });

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
        setStudentsAvaliacao(prev => prev.map(student => {
            if (student.id === editingGradesStudentId) {
                const av1 = parseFloat(gradeForm.av1) || 0;
                const av2 = parseFloat(gradeForm.av2) || 0;
                const av3 = parseFloat(gradeForm.av3) || 0;
                const rec = gradeForm.rec ? parseFloat(gradeForm.rec) : null;

                let media = (av1 + av2 + av3) / 3;
                if (rec !== null && rec > media) {
                    media = rec;
                }

                return {
                    ...student,
                    notas: { av1, av2, av3, rec },
                    media: parseFloat(media.toFixed(1))
                };
            }
            return student;
        }));
        setEditingGradesStudentId(null);
    };

    const avaliacaoTabsList = ['Resultado Consolidado', '1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

    const [visaoGeralData, setVisaoGeralData] = useState([
        { id: 1, name: 'ANA BEATRIZ SILVA SANTOS', b1: 6.5, b2: 7.2, b3: 8.0, b4: 8.5, mediaFinal: 7.5 },
        { id: 2, name: 'BRUNO FERREIRA LIMA', b1: 5.0, b2: 4.5, b3: 5.5, b4: 6.0, mediaFinal: 5.3, alert: true },
        { id: 3, name: 'CARLA OLIVEIRA COSTA', b1: 8.5, b2: 8.8, b3: 9.2, b4: 9.5, mediaFinal: 9.0 },
        { id: 4, name: 'DANIEL SOUZA REIS', b1: 7.0, b2: 7.0, b3: 6.8, b4: 7.5, mediaFinal: 7.1, alert: true },
        { id: 5, name: 'ELIANA COSTA MENDES', b1: 9.0, b2: 8.5, b3: 8.0, b4: 8.2, mediaFinal: 8.4, alert: true },
        { id: 6, name: 'FABIO SANTOS JUNIOR', b1: 4.0, b2: 5.5, b3: 6.5, b4: 7.0, mediaFinal: 5.8 },
        { id: 7, name: 'GABRIELA LIMA VIANA', b1: 7.5, b2: 8.0, b3: 8.5, b4: 9.0, mediaFinal: 8.3 },
        { id: 8, name: 'HUGO ALMEIDA PRADO', b1: 6.0, b2: 6.5, b3: 6.0, b4: 6.5, mediaFinal: 6.3, alert: true },
        { id: 9, name: 'IARA GOMES MOTA', b1: 8.2, b2: 8.2, b3: 8.5, b4: 8.8, mediaFinal: 8.4 },
        { id: 10, name: 'JOÃO PEREIRA NETO', b1: 5.5, b2: 6.0, b3: 6.2, b4: 5.8, mediaFinal: 5.9, alert: true },
    ]);

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

    const renderConceptBadge = (concept: string) => {
        let colors = '';
        if (concept === 'E') colors = 'bg-emerald-50 text-emerald-500 border-emerald-200';
        else if (concept === 'B') colors = 'bg-blue-50 text-blue-500 border-blue-200';
        else if (concept === 'R') colors = 'bg-amber-50 text-amber-500 border-amber-200';
        else if (concept === 'I') colors = 'bg-red-50 text-red-500 border-red-200';
        else colors = 'bg-slate-50 text-slate-500 border-slate-200';

        return (
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold mx-auto transition-transform hover:scale-110 cursor-pointer ${colors}`}>
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

    const [mockAcompanhamentos, setMockAcompanhamentos] = useState([
        {
            id: '1',
            professor: 'Profa. Márcia',
            componente: 'História',
            turma: '8º Ano A',
            periodoLetivo: '1º Bimestre',
            data: '2026-03-10',
            estudante: 'João Pedro Alves',
            lider: 'Ana Beatriz Souza',
            dificuldades: 'Desatenção e conversas paralelas recolhidas durante as explicações, afetando o desempenho na última avaliação.',
            intervencao: 'Mudança de lugar para a primeira fileira. Acordo de metas de atenção com o líder da turma como apoio. Notificação no diário.'
        }
    ]);

    const handleSaveAcomp = () => {
        if (!acompForm.professor || !acompForm.estudante) return;
        if (acompForm.id) {
            setMockAcompanhamentos(prev => prev.map(m => m.id === acompForm.id ? acompForm : m));
        } else {
            setMockAcompanhamentos(prev => [...prev, { ...acompForm, id: Date.now().toString() }]);
        }
        setIsEditingAcomp(false);
        setAcompForm({ id: '', professor: '', componente: '', turma: '', periodoLetivo: '1º Bimestre', data: '', estudante: '', lider: '', dificuldades: '', intervencao: '' });
    };

    const handleEditAcomp = (acomp: any) => {
        setAcompForm(acomp);
        setIsEditingAcomp(true);
    };

    const handleDeleteAcomp = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            setMockAcompanhamentos(prev => prev.filter(m => m.id !== id));
        }
    };

    // ============================================
    // ESTADOS: ENCAMINHAMENTOS E INTERVENÇÕES
    // ============================================
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

    const [mockEncaminhamentos, setMockEncaminhamentos] = useState([
        {
            id: '1',
            estudante: 'Lucas Silva Mendes',
            turma: '7º Ano B',
            tipo: 'Pedagógico',
            descricao: 'Baixo rendimento em Matemática e dificuldade na entrega de atividades propostas.',
            encaminhamento: 'Acompanhamento no contraturno com monitoria de Matemática. Conversa com a família agendada para repassar cronograma.',
            data: '2026-03-12',
            periodoLetivo: '1º Bimestre',
            status: 'Em Andamento',
            responsavel: 'Coord. Ana Paula'
        },
        {
            id: '2',
            estudante: 'Mariana Costa',
            turma: '9º Ano A',
            tipo: 'Psicológico',
            descricao: 'Aluna tem se mostrado muito retraída e chorosa após o intervalo.',
            encaminhamento: 'Encaminhamento para acolhimento com o psicólogo escolar. Notificação preventiva aos responsáveis.',
            data: '2026-03-15',
            periodoLetivo: '1º Bimestre',
            status: 'Pendente',
            responsavel: 'Psic. Roberto'
        }
    ]);

    const handleSaveEnc = () => {
        if (!encForm.estudante || !encForm.descricao) return;
        if (encForm.id) {
            setMockEncaminhamentos(prev => prev.map(m => m.id === encForm.id ? encForm : m));
        } else {
            setMockEncaminhamentos(prev => [...prev, { ...encForm, id: Date.now().toString() }]);
        }
        setIsEditingEnc(false);
        setEncForm({ id: '', estudante: '', turma: '', tipo: 'Pedagógico', descricao: '', encaminhamento: '', data: '', periodoLetivo: '1º Bimestre', status: 'Pendente', responsavel: '' });
    };

    const handleEditEnc = (enc: any) => {
        setEncForm(enc);
        setIsEditingEnc(true);
    };

    const handleDeleteEnc = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este registro de encaminhamento?')) {
            setMockEncaminhamentos(prev => prev.filter(m => m.id !== id));
        }
    };

    const tabs = [
        { id: 'estudantil', label: 'Reunião Estudantil', icon: Users },
        { id: 'avaliacao', label: 'Avaliação Docente', icon: BookOpen },
        { id: 'acompanhamento', label: 'Acompanhamento Docente', icon: UserCheck },
        { id: 'encaminhamentos', label: 'Encaminhamentos e Intervenções', icon: AlertTriangle }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'estudantil':
                return (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <ReuniaoEstudantilForm />
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

                        {/* Tabs Bimestre */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-2 flex gap-2">
                            {avaliacaoTabsList.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setAvaliacaoBimestre(tab)}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${avaliacaoBimestre === tab ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
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
                                        <span className="text-amber-500 font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> SOMENTE LEITURA</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center gap-2 transition-all">
                                    <Printer className="w-4 h-4" /> Imprimir {avaliacaoBimestre === 'Resultado Consolidado' ? 'Relatório' : avaliacaoBimestre}
                                </button>
                                <button className="border border-amber-200 bg-amber-50 text-amber-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-amber-100 flex items-center gap-2 transition-all">
                                    <Lock className="w-4 h-4" /> Solicitar Desbloqueio
                                </button>
                                <button className="bg-slate-100 text-slate-400 px-4 py-2 rounded-xl font-bold text-sm cursor-not-allowed flex items-center gap-2">
                                    <Send className="w-4 h-4" /> Finalizar e Enviar Etapa
                                </button>
                            </div>
                        </div>

                        {/* Contexto Metadata always visible */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-sm divide-x divide-slate-100">
                            <div className="px-4">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Unidade Escolar</p>
                                <p className="text-sm font-semibold text-slate-800">Colégio Municipal Marechal Rondon</p>
                            </div>
                            <div className="px-4">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Responsável</p>
                                <p className="text-sm font-semibold text-slate-800">Prof. Marcelo Fernandes</p>
                            </div>
                            <div className="px-4">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Componente Curricular</p>
                                <p className="text-sm font-semibold text-slate-800">Língua Portuguesa - BNCC</p>
                            </div>
                            <div className="px-4 flex items-center gap-3">
                                <button
                                    onClick={() => setIsTurmaModalOpen(true)}
                                    className="group text-left"
                                >
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1 group-hover:text-blue-500 transition-colors flex items-center gap-1">
                                        Turma / Ano
                                        <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </p>
                                    <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                        {activeTurma ? `${activeTurma.anoSerie} ${activeTurma.identificacao.replace('Turma ', '')} • ${activeTurma.turno}` : '5º Ano B • Matutino'}
                                    </p>
                                </button>
                                <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-slate-400 border border-slate-200 rounded-lg p-2 bg-slate-50">
                                    <Lock className="w-3 h-3" />
                                    <span>ETAPA BLOQUEADA<br />ENVIADA À COORDENAÇÃO</span>
                                </div>
                            </div>
                        </div>

                        {/* Renderização Condicional do Conteúdo da Tab */}
                        {avaliacaoBimestre === 'Resultado Consolidado' ? (
                            <div className="space-y-6">

                                {/* Overview Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase">Evolução Média</h4>
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-slate-800">+12.5%</span>
                                            <span className="text-xs font-bold text-emerald-500 flex items-center"><ArrowUpRight className="w-3 h-3" /> vs. ant.</span>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase">Acima da Média</h4>
                                            <Users className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-slate-800">84%</span>
                                            <span className="text-xs font-medium text-slate-400">21 / 25</span>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase">Média Geral</h4>
                                            <LayoutDashboard className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-slate-800">7.8</span>
                                            <span className="text-xs font-medium text-slate-400 text-amber-500">Meta: 7.0</span>
                                        </div>
                                    </div>
                                    <div className="bg-red-50 rounded-2xl p-5 border border-red-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-100 rounded-full opacity-50"></div>
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <h4 className="text-xs font-bold text-red-800 uppercase">Alertas de Queda</h4>
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                        </div>
                                        <div className="flex items-baseline gap-2 relative z-10">
                                            <span className="text-2xl font-black text-red-600">06</span>
                                            <span className="text-xs font-bold text-red-500">estudantes</span>
                                        </div>
                                    </div>
                                </div>

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
                                                {visaoGeralData.map(student => (
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
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center rounded-b-2xl">
                                        <div className="text-xs text-slate-500 font-medium">
                                            Exibindo {visaoGeralData.length} de 25 alunos matriculados nesta turma
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
                        ) : (
                            <>
                                {/* Header Contexto previously duplicate */}

                                {/* Legenda */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-6">
                                        <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> Legenda de Conceitos:
                                        </span>
                                        <div className="flex gap-4">
                                            <span className="flex items-center gap-2 text-xs font-bold text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded-full"><span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">I</span> INSUFICIENTE</span>
                                            <span className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full"><span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">R</span> REGULAR</span>
                                            <span className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full"><span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">B</span> BOM</span>
                                            <span className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full"><span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">E</span> EXCELENTE</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400 italic flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Edição bloqueada pelo sistema após envio
                                    </div>
                                </div>

                                {/* Tabela de Avaliação */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-max">
                                            <thead>
                                                <tr className="bg-slate-800 text-white border-b border-slate-700">
                                                    <th className="p-4 rounded-tl-xl w-16 text-center text-slate-400 font-medium">#</th>
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
                                                        <span className="text-[10px] font-bold uppercase tracking-wider block mt-4">Média do Período</span>
                                                    </th>
                                                    <th className="p-4 text-center bg-emerald-800 rounded-tr-xl">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider block mt-4">Parecer da Etapa</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {studentsAvaliacao.map(student => (
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
                                                        <td className="p-4 text-center">{renderConceptBadge(student.fre)}</td>
                                                        <td className="p-4 text-center">{renderConceptBadge(student.par)}</td>
                                                        <td className="p-4 text-center">{renderConceptBadge(student.mat)}</td>
                                                        <td className="p-4 text-center">{renderConceptBadge(student.atv)}</td>
                                                        <td className="p-4 text-center">{renderConceptBadge(student.com)}</td>
                                                        <td className="p-4 text-center">{renderConceptBadge(student.pes)}</td>
                                                        <td className="p-4 text-center">{renderConceptBadge(student.con)}</td>
                                                        <td className="p-4 text-center">
                                                            <button onClick={() => handleOpenGradeEditor(student)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer min-w-[3rem]">
                                                                {student.media.toFixed(1)}
                                                            </button>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {calculateParecerEtapa(student)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Footer */}
                                    <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center rounded-b-2xl">
                                        <button className="text-sm font-bold text-slate-500 flex items-center gap-2 hover:text-emerald-600 transition-colors disabled:opacity-50" disabled>
                                            <Users className="w-4 h-4" /> Adicionar Novo Estudante
                                        </button>
                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                            <span>EXIBINDO {studentsAvaliacao.length} DE {studentsAvaliacao.length} REGISTROS</span>
                                            <div className="flex gap-1">
                                                <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 disabled:opacity-50" disabled>&laquo;</button>
                                                <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 disabled:opacity-50" disabled>&lsaquo;</button>
                                                <button className="w-6 h-6 rounded flex items-center justify-center bg-white border border-slate-200 text-emerald-600">1</button>
                                                <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 disabled:opacity-50" disabled>&rsaquo;</button>
                                                <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 disabled:opacity-50" disabled>&raquo;</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );
            case 'acompanhamento':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-left">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">ACOMPANHAMENTO DOCENTE</h3>
                                <p className="text-sm text-slate-500 mt-1">Registros de acompanhamento contínuo e feedback para os professores.</p>
                            </div>
                            {!isEditingAcomp && (
                                <button
                                    onClick={() => {
                                        setAcompForm({ id: '', professor: '', componente: '', turma: '', periodoLetivo: '1º Bimestre', data: '', estudante: '', lider: '', dificuldades: '', intervencao: '' });
                                        setIsEditingAcomp(true);
                                    }}
                                    className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                                >
                                    <UserCheck size={18} /> Novo Acompanhamento
                                </button>
                            )}
                        </div>

                        {isEditingAcomp && (
                            <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm mb-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Professor(a) Responsável</label>
                                        <input
                                            type="text"
                                            value={acompForm.professor}
                                            onChange={e => setAcompForm({ ...acompForm, professor: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                            placeholder="Nome do(a) professor(a)..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Componente Curricular</label>
                                        <input
                                            type="text"
                                            value={acompForm.componente}
                                            onChange={e => setAcompForm({ ...acompForm, componente: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                            placeholder="Ex: Português"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Turma</label>
                                        <input
                                            type="text"
                                            value={acompForm.turma}
                                            onChange={e => setAcompForm({ ...acompForm, turma: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                            placeholder="Ex: 8º Ano A"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Período Letivo</label>
                                        <select
                                            value={acompForm.periodoLetivo || '1º Bimestre'}
                                            onChange={e => setAcompForm({ ...acompForm, periodoLetivo: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none"
                                        >
                                            <option>1º Bimestre</option>
                                            <option>2º Bimestre</option>
                                            <option>3º Bimestre</option>
                                            <option>4º Bimestre</option>
                                            <option>1º Semestre</option>
                                            <option>2º Semestre</option>
                                            <option>Anual</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={acompForm.data}
                                                onChange={e => setAcompForm({ ...acompForm, data: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Líder de Turma</label>
                                        <input
                                            type="text"
                                            value={acompForm.lider}
                                            onChange={e => setAcompForm({ ...acompForm, lider: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                            placeholder="Nome do líder da turma..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estudante com Dificuldade</label>
                                        <input
                                            type="text"
                                            value={acompForm.estudante}
                                            onChange={e => setAcompForm({ ...acompForm, estudante: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                            placeholder="Nome do estudante..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dificuldades Encontradas</label>
                                        <textarea
                                            value={acompForm.dificuldades}
                                            onChange={e => setAcompForm({ ...acompForm, dificuldades: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none"
                                            placeholder="Descreva as dificuldades..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Intervenção Pedagógica do Professor</label>
                                        <textarea
                                            value={acompForm.intervencao}
                                            onChange={e => setAcompForm({ ...acompForm, intervencao: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none"
                                            placeholder="Descreva a intervenção aplicada..."
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                                    <button onClick={handleSaveAcomp} className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-colors flex items-center gap-2">
                                        Salvar Registro
                                    </button>
                                    <button onClick={() => setIsEditingAcomp(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-semibold transition-colors">
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {mockAcompanhamentos.map(acomp => (
                                <div key={acomp.id} className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between lg:items-start gap-6 group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <span className="px-3 py-1 text-xs font-bold uppercase rounded-full border border-slate-200 text-slate-500">
                                                {acomp.turma}
                                            </span>
                                            <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                {acomp.componente}
                                            </span>
                                            {acomp.data && (
                                                <span className="text-xs font-medium text-slate-400">
                                                    Data: {acomp.data}
                                                </span>
                                            )}
                                            {acomp.periodoLetivo && (
                                                <span className="text-xs font-medium text-slate-400 border-l border-slate-200 pl-3">
                                                    Período: {acomp.periodoLetivo}
                                                </span>
                                            )}
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
                                                        <p className="text-xs font-bold text-emerald-600/80 uppercase mb-1 flex items-center gap-1">
                                                            <UserCheck size={12} /> Líder de Turma
                                                        </p>
                                                        <p className="text-sm text-slate-600">{acomp.lider}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-row lg:flex-col justify-center">
                                        <button title="Editar" onClick={() => handleEditAcomp(acomp)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-brand-orange hover:border-orange-200 transition-all flex-shrink-0">
                                            <Edit size={16} />
                                        </button>
                                        <button title="Excluir" onClick={() => handleDeleteAcomp(acomp.id)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex-shrink-0">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {mockAcompanhamentos.length === 0 && !isEditingAcomp && (
                                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">Nenhum acompanhamento docente registrado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'encaminhamentos':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-left">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">ENCAMINHAMENTOS E INTERVENÇÕES</h3>
                                <p className="text-sm text-slate-500 mt-1">Gestão de planos de intervenção pedagógica e encaminhamentos multidisciplinares.</p>
                            </div>
                            {!isEditingEnc && (
                                <button
                                    onClick={() => {
                                        setEncForm({ id: '', estudante: '', turma: '', tipo: 'Pedagógico', descricao: '', encaminhamento: '', data: '', periodoLetivo: '1º Bimestre', status: 'Pendente', responsavel: '' });
                                        setIsEditingEnc(true);
                                    }}
                                    className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                                >
                                    <AlertTriangle size={18} /> Novo Encaminhamento
                                </button>
                            )}
                        </div>

                        {isEditingEnc && (
                            <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm mb-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estudante</label>
                                        <input
                                            type="text"
                                            value={encForm.estudante}
                                            onChange={e => setEncForm({ ...encForm, estudante: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                            placeholder="Nome do aluno..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Turma</label>
                                        <input
                                            type="text"
                                            value={encForm.turma}
                                            onChange={e => setEncForm({ ...encForm, turma: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                            placeholder="Ex: 6º Ano A"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Intervenção</label>
                                        <select
                                            value={encForm.tipo}
                                            onChange={e => setEncForm({ ...encForm, tipo: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none"
                                        >
                                            <option>Pedagógico</option>
                                            <option>Psicológico</option>
                                            <option>Familiar / Responsáveis</option>
                                            <option>Saúde / Rede de Apoio</option>
                                            <option>Disciplinar</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Período Letivo</label>
                                        <select
                                            value={encForm.periodoLetivo || '1º Bimestre'}
                                            onChange={e => setEncForm({ ...encForm, periodoLetivo: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none"
                                        >
                                            <option>1º Bimestre</option>
                                            <option>2º Bimestre</option>
                                            <option>3º Bimestre</option>
                                            <option>4º Bimestre</option>
                                            <option>1º Semestre</option>
                                            <option>2º Semestre</option>
                                            <option>Anual</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data do Registro</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={encForm.data}
                                                onChange={e => setEncForm({ ...encForm, data: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição do Caso / Motivo</label>
                                        <textarea
                                            value={encForm.descricao}
                                            onChange={e => setEncForm({ ...encForm, descricao: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none"
                                            placeholder="Descreva detalhadamente a situação e o motivo do encaminhamento..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Encaminhamento / Ação Proposta</label>
                                        <textarea
                                            value={encForm.encaminhamento}
                                            onChange={e => setEncForm({ ...encForm, encaminhamento: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none"
                                            placeholder="Especifique qual ação deve ser tomada, para onde ou para quem o aluno será encaminhado..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Responsável pela Ação</label>
                                        <input
                                            type="text"
                                            value={encForm.responsavel}
                                            onChange={e => setEncForm({ ...encForm, responsavel: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                            placeholder="Nome do/a responsável..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                                        <select
                                            value={encForm.status}
                                            onChange={e => setEncForm({ ...encForm, status: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none"
                                        >
                                            <option value="Pendente">Pendente</option>
                                            <option value="Em Andamento">Em Andamento</option>
                                            <option value="Concluído">Concluído</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                                    <button onClick={handleSaveEnc} className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-colors flex items-center gap-2">
                                        Salvar Registro
                                    </button>
                                    <button onClick={() => setIsEditingEnc(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-semibold transition-colors">
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {mockEncaminhamentos.map(enc => (
                                <div key={enc.id} className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between lg:items-center gap-6 group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${enc.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' :
                                                enc.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {enc.status}
                                            </span>
                                            <span className="px-3 py-1 text-xs font-bold uppercase rounded-full border border-slate-200 text-slate-500">
                                                {enc.tipo}
                                            </span>
                                            <span className="text-xs font-medium text-slate-400">
                                                Registrado em: {enc.data}
                                            </span>
                                            {enc.periodoLetivo && (
                                                <span className="text-xs font-medium text-slate-400 border-l border-slate-200 pl-3">
                                                    Período: {enc.periodoLetivo}
                                                </span>
                                            )}
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
                                            <p className="text-xs font-medium text-slate-500 tracking-wide flex items-center gap-1">
                                                Resp: {enc.responsavel}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity lg:flex-col justify-center">
                                        <button title="Editar Encaminhamento" onClick={() => handleEditEnc(enc)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-brand-orange hover:border-orange-200 transition-all flex-shrink-0">
                                            <Edit size={16} />
                                        </button>
                                        <button title="Excluir Registro" onClick={() => handleDeleteEnc(enc.id)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex-shrink-0">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {mockEncaminhamentos.length === 0 && !isEditingEnc && (
                                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">Nenhum encaminhamento ou intervenção registrada.</p>
                                </div>
                            )}
                        </div>
                    </div >
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 pb-12 animate-fade-in relative">
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
                {renderTabContent()}
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
                turmasExistentes={turmasCadastradas}
            />

            <StudentReportModal
                isOpen={isStudentReportOpen}
                onClose={() => setIsStudentReportOpen(false)}
                student={activeStudentReport}
                context={avaliacaoBimestre}
            />

            {/* Success Toast */}
            <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 transform ${showSuccessToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                <div className="bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Turma salva com sucesso!</span>
                </div>
            </div>
        </div>
    );
};
