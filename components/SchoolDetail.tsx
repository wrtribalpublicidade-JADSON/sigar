import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Target, TrendingUp, History, FileText, Save, Users, Calculator, Briefcase, Plus, Trash2, Edit, ClipboardCheck, AlertCircle, AlertTriangle, CheckCircle2, School as SchoolIcon, LayoutDashboard, GraduationCap, Clock, Activity, Award, BookOpen, UserPlus, X, MapPin, ChevronRight, CheckSquare, Printer, Loader2, Search, RefreshCw } from 'lucide-react';
import { PageHeader } from './ui/PageHeader';
import { PrintableVisitReport } from './PrintableVisitReport';
import { PrintableRhReport } from './PrintableRhReport';
import { CadastroEstudanteModal } from './modals/CadastroEstudanteModal';
import { CadastroTurmaModal } from './modals/CadastroTurmaModal';
import { PrintableChecklistReport } from './PrintableChecklistReport';
import { PrintableCartaApresentacao } from './PrintableCartaApresentacao';
import { PrintableSchoolDocument } from './PrintableSchoolDocument';
import { AtasFinaisTab } from './AtasFinaisTab';
import { hasTabAccess, hasFullTabAccess } from '../utils/permissions';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { generateUUID } from '../utils';
import { generateAcompanhamentoMensal } from '../constants';
import { Button } from './ui/Button';
import { Escola, Visita, DadosEducacionais, ItemAcompanhamento, RecursoHumano, MetaAcao, StatusMeta, Coordenador, Segmento, Aluno } from '../types';
import { igPlanoAcaoService } from '../services/gestaoConselhoService';
import { supabase } from '../services/supabase';
 
interface SchoolDetailProps {
  escola: Escola;
  coordenadores: Coordenador[];
  historicoVisitas: Visita[];
  onBack: () => void;
  onUpdate: (escola: Escola) => void;
  onUpdateVisitStatus: (visitId: string, newStatus: Visita['status']) => void;
  isDemoMode: boolean;
  userRole?: string;
  onUpdateCoordenadorTurmas?: (coordenadorId: string, turmasIds: string[], turmaComponentes?: Record<string, string[]>) => Promise<void> | void;
}

const COLORS = {
  brand: '#FF4D00',
  dark: '#000000',
  grey: '#F4F4F5',
  acid: '#D6FF00',
  signal: '#FF1F00'
};

const COMPONENTES_CURRICULARES = [
  'Língua Portuguesa',
  'Matemática',
  'Ciências',
  'Geografia',
  'História',
  'Educação Física',
  'Arte',
  'Ensino Religioso',
  'Língua Inglesa'
];

const CAMPOS_EXPERIENCIA = [
  'O eu, o outro e o nós',
  'Corpo, gestos e movimentos',
  'Traços, sons, cores e formas',
  'Escuta, fala, pensamento e imaginação',
  'Espaços, tempos, quantidades, relações e transformações'
];

const ETAPAS_COHORTS = [
  {
    id: 'infantil',
    title: 'Educação Infantil',
    cohorts: ['Creche II', 'Creche III', 'Pré-Escola I', 'Pré-Escola II', 'Pré I', 'Pré II']
  },
  {
    id: 'anos_iniciais',
    title: 'Ensino Fundamental - Anos Iniciais',
    cohorts: ['1º ANO', '2º ANO', '3º ANO', '4º ANO', '5º ANO']
  },
  {
    id: 'anos_finais',
    title: 'Ensino Fundamental - Anos Finais',
    cohorts: ['6º ANO', '7º ANO', '8º ANO', '9º ANO']
  },
  {
    id: 'eja',
    title: 'EJA (Educação de Jovens e Adultos)',
    cohorts: ['I ETAPA', 'II ETAPA', 'III ETAPA', 'IV ETAPA']
  }
];

export const SchoolDetail: React.FC<SchoolDetailProps> = ({ escola, coordenadores = [], historicoVisitas, onBack, onUpdate, onUpdateVisitStatus, isDemoMode, userRole, onUpdateCoordenadorTurmas }) => {
  const [activeTab, setActiveTab] = useState<'plano' | 'visitas' | 'turmas' | 'rh' | 'acompanhamento' | 'detalhamento_turmas' | 'documentos' | 'matriculas' | 'professores' | 'atas_finais'>('acompanhamento');
  const [selectedVisitForPrint, setSelectedVisitForPrint] = useState<Visita | null>(null);
  const [selectedServidorForCarta, setSelectedServidorForCarta] = useState<RecursoHumano | null>(null);
  const [formData, setFormData] = useState<DadosEducacionais>(escola.dadosEducacionais);
  
  // State for teachers tab
  const [selectedTeacherForTurmas, setSelectedTeacherForTurmas] = useState<Coordenador | null>(null);
  const [tempSelectedTurmas, setTempSelectedTurmas] = useState<string[]>([]);
  const [tempTurmaComponentes, setTempTurmaComponentes] = useState<Record<string, string[]>>({});
  const [isSavingTurmas, setIsSavingTurmas] = useState(false);

  // State for Matriculas tab
  const [searchTermMatriculas, setSearchTermMatriculas] = useState('');
  const [stageFilterMatriculas, setStageFilterMatriculas] = useState('ALL');
  const [statusFilterMatriculas, setStatusFilterMatriculas] = useState('ALL');
  const [currentPageMatriculas, setCurrentPageMatriculas] = useState(1);
  const [pageSizeMatriculas] = useState(10);
  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false);
  const [isTurmaModalOpen, setIsTurmaModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Aluno | null>(null);

  // State for document generation
  const [selectedDocType, setSelectedDocType] = useState<'notificacao_frequencia' | 'autorizacao_imagem'>('notificacao_frequencia');
  const [docStudentId, setDocStudentId] = useState<string | number>('');
  const [docResponsavelNome, setDocResponsavelNome] = useState('');
  const [docResponsavelCpf, setDocResponsavelCpf] = useState('');
  const [docResponsavelEndereco, setDocResponsavelEndereco] = useState('');
  const [docResponsavelTelefone, setDocResponsavelTelefone] = useState('');
  const [docFrequenciaAtual, setDocFrequenciaAtual] = useState<number>(70);
  const [docTotalFaltas, setDocTotalFaltas] = useState<number>(15);
  const [docDataAtendimento, setDocDataAtendimento] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow
  );
  const [docHorarioAtendimento, setDocHorarioAtendimento] = useState('09:00');
  
  // Printing states
  const [students, setStudents] = useState<Aluno[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentForPrint, setSelectedStudentForPrint] = useState<Aluno | null>(null);
  const [printDocData, setPrintDocData] = useState<any>(null);
  const [isPrintingDocument, setIsPrintingDocument] = useState(false);

  const loadStudentsList = async () => {
    if (!escola.id) return;
    setLoadingStudents(true);
    try {
      if (isDemoMode) {
        // Generate 10 realistic mock students for this school
        const mockStudents: Aluno[] = [
          { id: 1, name: 'Arthur Silva Santos', stage: 'Creche II', status: 'Ativo', escola_id: escola.id },
          { id: 2, name: 'Beatriz Ramos Lima', stage: '1º Ano', status: 'Ativo', escola_id: escola.id },
          { id: 3, name: 'Carlos Eduardo Souza', stage: '5º Ano', status: 'Ativo', escola_id: escola.id },
          { id: 4, name: 'Daniela Ferreira Costa', stage: '9º Ano', status: 'Ativo', escola_id: escola.id },
          { id: 5, name: 'Gabriel Nascimento Rocha', stage: 'Creche III', status: 'Ativo', escola_id: escola.id },
          { id: 6, name: 'Helena Mendes Abreu', stage: '2º Ano', status: 'Ativo', escola_id: escola.id },
          { id: 7, name: 'Igor Miranda Alves', stage: '6º Ano', status: 'Ativo', escola_id: escola.id },
          { id: 8, name: 'Julia Martins Oliveira', stage: 'Pré I', status: 'Ativo', escola_id: escola.id },
          { id: 9, name: 'Lucas Pinheiro Castro', stage: '3º Ano', status: 'Ativo', escola_id: escola.id },
          { id: 10, name: 'Mariana Santos Pereira', stage: 'Pré II', status: 'Ativo', escola_id: escola.id },
        ];
        setStudents(mockStudents);
        return;
      }

      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('escola_id', escola.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'documentos' || activeTab === 'matriculas') {
      loadStudentsList();
    }
  }, [activeTab, escola.id, isDemoMode]);

  useEffect(() => {
    setCurrentPageMatriculas(1);
  }, [searchTermMatriculas, stageFilterMatriculas, statusFilterMatriculas]);

  const selectedStudentObj = useMemo(() => {
    return students.find(s => String(s.id) === String(docStudentId)) || null;
  }, [students, docStudentId]);

  const handleGenerateDocument = () => {
    if (!selectedStudentObj) return;
    
    setSelectedStudentForPrint(selectedStudentObj);
    setPrintDocData({
      responsavelNome: docResponsavelNome,
      responsavelCpf: docResponsavelCpf,
      responsavelEndereco: docResponsavelEndereco,
      responsavelTelefone: docResponsavelTelefone,
      frequenciaAtual: docFrequenciaAtual,
      totalFaltas: docTotalFaltas,
      dataAtendimento: docDataAtendimento,
      horarioAtendimento: docHorarioAtendimento
    });
    setIsPrintingDocument(true);
  };

  const visibleTabs = useMemo(() => {
    const allTabs = [
      { id: 'acompanhamento', icon: ClipboardCheck, label: 'Monitoramento' },
      { id: 'turmas', icon: CheckSquare, label: 'Turmas' },
      { id: 'detalhamento_turmas', icon: GraduationCap, label: 'Detalhamento de Turmas' },
      { id: 'matriculas', icon: Users, label: 'Matrículas' },
      { id: 'rh', icon: Briefcase, label: 'Recursos Humanos' },
      { id: 'plano', icon: Target, label: 'Plano de Ação' },
      { id: 'visitas', icon: History, label: 'Histórico' },
      { id: 'documentos', icon: FileText, label: 'Documentos' },
      { id: 'professores', icon: Users, label: 'Professores' },
      { id: 'atas_finais', icon: FileText, label: 'Atas Finais' }
    ];
    return allTabs.filter(tab => hasTabAccess('escolas', tab.id, userRole));
  }, [userRole]);

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(t => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id as any);
    }
  }, [visibleTabs, activeTab]);

  const canEditTab = useMemo(() => {
    if (!userRole) return true;
    return userRole === 'Administrador' || hasFullTabAccess('escolas', activeTab, userRole);
  }, [activeTab, userRole]);

  const regionalCoordinator = useMemo(() => {
    return coordenadores.find(c => c.escolasIds.includes(escola.id) && c.funcao === 'Coordenador Regional')
      || coordenadores.find(c => c.escolasIds.includes(escola.id));
  }, [coordenadores, escola.id]);

  const schoolTeachers = useMemo(() => {
    return coordenadores.filter(c => c.funcao === 'Professor' && c.escolasIds.includes(escola.id));
  }, [coordenadores, escola.id]);

  const handlePrint = (visita: Visita) => {
    setSelectedVisitForPrint(visita);
    setTimeout(() => {
      window.print();
      setSelectedVisitForPrint(null);
    }, 100);
  };

  // helper: check if servidor is eligible for a letter
  const servidorElegivelCarta = (funcao: string) => {
    return true;
  };

  const handlePrintCarta = (rh: RecursoHumano) => {
    setSelectedServidorForCarta(rh);
    setTimeout(() => {
      window.print();
      setSelectedServidorForCarta(null);
    }, 300);
  };

  const [isPrintingRh, setIsPrintingRh] = useState(false);

  const handlePrintRh = () => {
    setIsPrintingRh(true);
    setTimeout(() => {
      window.print();
      setIsPrintingRh(false);
    }, 500);
  };

  const [isPrintingChecklist, setIsPrintingChecklist] = useState(false);

  const handlePrintChecklist = () => {
    setIsPrintingChecklist(true);
    setTimeout(() => {
      window.print();
      setIsPrintingChecklist(false);
    }, 500);
  };

  const initialAcompanhamento = useMemo(() => {
    const template = generateAcompanhamentoMensal();
    if (escola.acompanhamentoMensal && escola.acompanhamentoMensal.length > 0) {
      const savedMap = new Map(escola.acompanhamentoMensal.map(item => [item.pergunta, item]));

      return template.map(templateItem => {
        const savedItem = savedMap.get(templateItem.pergunta);
        if (savedItem) {
          return {
            ...templateItem,
            id: savedItem.id,
            resposta: savedItem.resposta,
            observacao: savedItem.observacao
          };
        }
        return templateItem;
      });
    }
    return template;
  }, [escola.id, escola.acompanhamentoMensal]);

  const [localAcompanhamento, setLocalAcompanhamento] = useState<ItemAcompanhamento[]>(initialAcompanhamento);

  useEffect(() => {
    setLocalAcompanhamento(initialAcompanhamento);
  }, [initialAcompanhamento]);

  const [schoolTurmas, setSchoolTurmas] = useState<any[]>([]);
  const [isLoadingTurmas, setIsLoadingTurmas] = useState(false);

  const sortTurmas = (turmasList: any[]): any[] => {
    const getStageScore = (stage: string = ''): number => {
      const s = stage.toLowerCase();
      if (s.includes('infantil') || s.includes('creche') || s.includes('pré') || s.includes('pre')) return 1000;
      if (s.includes('iniciais') || s.includes('fundamental i') || s.includes('fundamental 1')) return 2000;
      if (s.includes('finais') || s.includes('fundamental ii') || s.includes('fundamental 2')) return 3000;
      if (s.includes('eja')) return 4000;
      return 5000;
    };

    const getYearScore = (year: string = ''): number => {
      const y = year.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
      if (y.includes('creche i') && !y.includes('creche ii') && !y.includes('creche iii')) return 1;
      if (y.includes('creche ii')) return 2;
      if (y.includes('creche iii')) return 3;
      if (y.includes('pré i') || y.includes('pre i') || y.includes('pré escola i') || y.includes('preescola i') || y.includes('pré-escola i')) return 4;
      if (y.includes('pré ii') || y.includes('pre ii') || y.includes('pré escola ii') || y.includes('preescola ii') || y.includes('pré-escola ii')) return 5;
      
      if (y.startsWith('1') || y.includes('1 ano') || y.includes('1º') || y.includes('1o')) return 1;
      if (y.startsWith('2') || y.includes('2 ano') || y.includes('2º') || y.includes('2o')) return 2;
      if (y.startsWith('3') || y.includes('3 ano') || y.includes('3º') || y.includes('3o')) return 3;
      if (y.startsWith('4') || y.includes('4 ano') || y.includes('4º') || y.includes('4o')) return 4;
      if (y.startsWith('5') || y.includes('5 ano') || y.includes('5º') || y.includes('5o')) return 5;
      
      if (y.startsWith('6') || y.includes('6 ano') || y.includes('6º') || y.includes('6o')) return 6;
      if (y.startsWith('7') || y.includes('7 ano') || y.includes('7º') || y.includes('7o')) return 7;
      if (y.startsWith('8') || y.includes('8 ano') || y.includes('8º') || y.includes('8o')) return 8;
      if (y.startsWith('9') || y.includes('9 ano') || y.includes('9º') || y.includes('9o')) return 9;
      
      if (y.includes('i etapa')) return 1;
      if (y.includes('ii etapa')) return 2;
      if (y.includes('iii etapa')) return 3;
      if (y.includes('iv etapa')) return 4;
      return 100;
    };

    return [...turmasList].sort((a, b) => {
      const stageA = getStageScore(a.stage);
      const stageB = getStageScore(b.stage);
      if (stageA !== stageB) return stageA - stageB;

      const yearA = getYearScore(a.year || a.anoSerie);
      const yearB = getYearScore(b.year || b.anoSerie);
      if (yearA !== yearB) return yearA - yearB;

      return (a.name || '').localeCompare(b.name || '');
    });
  };

  const loadSchoolTurmas = async () => {
    if (!escola.id) return;
    setIsLoadingTurmas(true);
    try {
      if (isDemoMode) {
        // Generate demo turmas for the school
        const demoTurmas = [
          { id: 'dt-1', stage: 'Educação Infantil', year: 'Creche II', name: 'Turma A', shift: 'MANHÃ', modality: 'REGULAR' },
          { id: 'dt-2', stage: 'Educação Infantil', year: 'Pré-Escola I', name: 'Turma A', shift: 'MANHÃ', modality: 'REGULAR' },
          { id: 'dt-3', stage: 'Educação Infantil', year: 'Pré-Escola I', name: 'Turma B', shift: 'TARDE', modality: 'REGULAR' },
          { id: 'dt-4', stage: 'Anos Iniciais', year: '1º ANO', name: 'Turma A', shift: 'MANHÃ', modality: 'REGULAR' },
          { id: 'dt-5', stage: 'Anos Iniciais', year: '2º ANO', name: 'Turma A', shift: 'MANHÃ', modality: 'REGULAR' },
          { id: 'dt-6', stage: 'Anos Iniciais', year: '5º ANO', name: 'Turma B', shift: 'TARDE', modality: 'REGULAR' },
          { id: 'dt-7', stage: 'Anos Finais', year: '6º ANO', name: 'Turma A', shift: 'MANHÃ', modality: 'REGULAR' },
          { id: 'dt-8', stage: 'Anos Finais', year: '9º ANO', name: 'Turma A', shift: 'INTEGRAL', modality: 'REGULAR' },
          { id: 'dt-9', stage: 'EJA', year: 'I ETAPA', name: 'Turma A', shift: 'NOITE', modality: 'REGULAR' }
        ];
        setSchoolTurmas(sortTurmas(demoTurmas));
      } else {
        const { data, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('school_id', escola.id)
          .order('name');
        
        if (error) throw error;
        setSchoolTurmas(sortTurmas(data || []));
      }
    } catch (err) {
      console.error('Erro ao buscar turmas:', err);
    } finally {
      setIsLoadingTurmas(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'detalhamento_turmas' || activeTab === 'matriculas' || activeTab === 'professores' || activeTab === 'turmas') {
      loadSchoolTurmas();
    }
  }, [escola.id, activeTab, isDemoMode]);

  const handleSaveTurma = async (turmaData: any) => {
    try {
      if (isDemoMode) {
        alert('Turma salva (Simulado).');
        setIsTurmaModalOpen(false);
        return;
      }

      const payload = {
        name: turmaData.identificacao,
        stage: turmaData.etapa,
        year: turmaData.anoSerie,
        shift: turmaData.turno,
        modality: turmaData.tipo,
        school_id: escola.id
      };

      if (turmaData.id) {
        const { error } = await supabase.from('turmas').update(payload).eq('id', turmaData.id);
        if (error) throw error;
        alert('Turma atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('turmas').insert([payload]);
        if (error) throw error;
        alert('Nova turma cadastrada com sucesso!');
      }

      setIsTurmaModalOpen(false);
      loadSchoolTurmas();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar turma.');
    }
  };

  const handleDeleteTurma = async (id: string) => {
    if (!confirm('Deseja realmente remover esta turma?')) return;
    try {
      const { error } = await supabase.from('turmas').delete().eq('id', id);
      if (error) throw error;
      alert('Turma removida.');
      loadSchoolTurmas();
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir turma.');
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Deseja realmente remover este registro?')) return;
    try {
      if (isDemoMode) {
        alert('Remoção simulada.');
        setStudents(prev => prev.filter(s => s.id !== id));
        return;
      }
      const { error } = await supabase.from('alunos').delete().eq('id', id);
      if (error) throw error;
      alert('Estudante removido com sucesso.');
      loadStudentsList();
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir registro.');
    }
  };

  const stagesMatriculas = useMemo(() => {
    const uniqueTurmas = new Set<string>();
    schoolTurmas.forEach(t => {
      const year = t.year || t.anoSerie;
      const name = t.name || t.identificacao;
      if (year && name) {
        uniqueTurmas.add(`${year} - ${name}`);
      }
    });
    return Array.from(uniqueTurmas).sort();
  }, [schoolTurmas]);

  const filteredStudentsMatriculas = useMemo(() => {
    return students.filter(s => {
      const nameMatch = s.name?.toLowerCase().includes(searchTermMatriculas.toLowerCase());
      const cpfMatch = s.cpf?.includes(searchTermMatriculas);
      const matchSearch = searchTermMatriculas === '' || nameMatch || cpfMatch;
      
      let matchStage = stageFilterMatriculas === 'ALL' || s.stage === stageFilterMatriculas;
      if (stageFilterMatriculas !== 'ALL' && !matchStage && s.class_id) {
        const turma = schoolTurmas.find(t => String(t.id) === String(s.class_id));
        if (turma) {
          const turmaInfo = `${turma.year || turma.anoSerie || ''} - ${turma.name || turma.identificacao || ''}`;
          if ((turma.year || turma.anoSerie) === stageFilterMatriculas || turmaInfo === stageFilterMatriculas) {
            matchStage = true;
          }
        }
      }

      const matchStatus = statusFilterMatriculas === 'ALL' || s.status === statusFilterMatriculas;
      return matchSearch && matchStage && matchStatus;
    });
  }, [students, searchTermMatriculas, stageFilterMatriculas, statusFilterMatriculas, schoolTurmas]);

  const paginatedStudentsMatriculas = useMemo(() => {
    const startIndex = (currentPageMatriculas - 1) * pageSizeMatriculas;
    return filteredStudentsMatriculas.slice(startIndex, startIndex + pageSizeMatriculas);
  }, [filteredStudentsMatriculas, currentPageMatriculas, pageSizeMatriculas]);

  const totalPagesMatriculas = Math.ceil(filteredStudentsMatriculas.length / pageSizeMatriculas) || 1;

  const getStudentTurmaInfo = (classId?: string) => {
    if (!classId) return '---';
    const turma = schoolTurmas.find(t => String(t.id) === String(classId));
    if (!turma) return '---';
    return `${turma.year || turma.anoSerie || ''} - ${turma.name || turma.identificacao || ''}`;
  };

  const visibleEtapas = useMemo(() => {
    return ETAPAS_COHORTS.filter(etapa => {
      // Check if school has this segment in its segmentos array
      const hasSegment = (
        (etapa.id === 'infantil' && escola.segmentos.includes(Segmento.INFANTIL)) ||
        (etapa.id === 'anos_iniciais' && escola.segmentos.includes(Segmento.FUNDAMENTAL_I)) ||
        (etapa.id === 'anos_finais' && escola.segmentos.includes(Segmento.FUNDAMENTAL_II))
      );
      
      // Or if there's any active schoolTurma matching this stage
      const hasTurmas = schoolTurmas.some(t => {
        const tStage = (t.stage || '').toLowerCase();
        if (etapa.id === 'infantil') return tStage.includes('infantil') || tStage.includes('creche') || tStage.includes('pré');
        if (etapa.id === 'anos_iniciais') return tStage.includes('iniciais') || tStage.includes('fundamental i');
        if (etapa.id === 'anos_finais') return tStage.includes('finais') || tStage.includes('fundamental ii');
        if (etapa.id === 'eja') return tStage.includes('eja');
        return false;
      });

      return hasSegment || hasTurmas;
    });
  }, [escola.segmentos, schoolTurmas]);

  const classifiedTurmas = useMemo(() => {
    const map: Record<string, any[]> = {};
    const unclassified: any[] = [];
    
    schoolTurmas.forEach(t => {
      let matched = false;
      const tYear = (t.year || '').toLowerCase().trim();
      const tStage = (t.stage || '').toLowerCase().trim();
      const tYearNorm = tYear.replace(/[^a-z0-9]/g, '');

      // Try to match stage first
      for (const etapa of ETAPAS_COHORTS) {
        const stageMatches = (
          (etapa.id === 'infantil' && (tStage.includes('infantil') || tStage.includes('creche') || tStage.includes('pré'))) ||
          (etapa.id === 'anos_iniciais' && (tStage.includes('iniciais') || tStage.includes('fundamental i'))) ||
          (etapa.id === 'anos_finais' && (tStage.includes('finais') || tStage.includes('fundamental ii'))) ||
          (etapa.id === 'eja' && tStage.includes('eja'))
        );

        if (stageMatches) {
          const matchedCohort = etapa.cohorts.find(c => {
            const cNorm = c.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            return tYearNorm === cNorm || tYear === c.toLowerCase().trim();
          });

          if (matchedCohort) {
            const key = `${etapa.id}_${matchedCohort}`;
            if (!map[key]) map[key] = [];
            map[key].push(t);
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        // Fallback: try to match just the cohort name without stage constraint
        for (const etapa of ETAPAS_COHORTS) {
          const matchedCohort = etapa.cohorts.find(c => {
            const cNorm = c.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            return tYearNorm === cNorm || tYear === c.toLowerCase().trim();
          });

          if (matchedCohort) {
            const key = `${etapa.id}_${matchedCohort}`;
            if (!map[key]) map[key] = [];
            map[key].push(t);
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        unclassified.push(t);
      }
    });

    return { map, unclassified };
  }, [schoolTurmas]);

  const [isAddingRh, setIsAddingRh] = useState(false);
  const [editingRhId, setEditingRhId] = useState<string | null>(null);
  const [cpfError, setCpfError] = useState<string>('');
  const [rhForm, setRhForm] = useState<RecursoHumano>({
    id: '', funcao: '', nome: '', telefone: '', email: '', dataNomeacao: '',
    tipoVinculo: 'Efetivo', cargaHoraria: '', cpf: '', dataNascimento: '',
    etapaAtuacao: undefined, componenteCurricular: '', modalidadeInfantil: [], anosIniciaisAtuacao: []
  });

  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState<MetaAcao>({
    id: '', descricao: '', prazo: '', status: StatusMeta.NAO_INICIADO, responsavel: ''
  });

  // Local state for plano de ação, fetched directly to ensure freshness
  const [localPlanoAcao, setLocalPlanoAcao] = useState<MetaAcao[]>(escola.planoAcao || []);
  const [isLoadingPlano, setIsLoadingPlano] = useState(false);

  useEffect(() => {
    const fetchPlano = async () => {
      if (!escola.id) return;
      setIsLoadingPlano(true);
      try {
        const data = await igPlanoAcaoService.getAll(escola.id);
        if (data && Array.isArray(data)) {
          setLocalPlanoAcao(data.map((m: any) => ({ ...m, status: m.status as StatusMeta })));
        }
      } catch (e) {
        console.error('Erro ao carregar plano de ação:', e);
        // fallback to prop data
        setLocalPlanoAcao(escola.planoAcao || []);
      } finally {
        setIsLoadingPlano(false);
      }
    };
    fetchPlano();
  }, [escola.id]);

  const handleInputChange = (section: keyof DadosEducacionais, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: Number(value) }
    }));
  };

  const handleTurmaChange = (
    segmento: 'infantil' | 'fundamental',
    nivel: string,
    tipo: 'turmas' | 'alunos',
    turno: 'integral' | 'manha' | 'tarde',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      matriculaDetalhada: {
        ...prev.matriculaDetalhada,
        [segmento]: {
          ...prev.matriculaDetalhada[segmento],
          [nivel]: {
            ...(prev.matriculaDetalhada[segmento] as any)[nivel],
            [tipo]: {
              ...(prev.matriculaDetalhada[segmento] as any)[nivel][tipo],
              [turno]: Number(value)
            }
          }
        }
      }
    }));
  };

  const handleSaveIndicators = () => {
    // 1. Calcular totais do detalhamento
    const det = formData.matriculaDetalhada;
    const sumAlunos = (node: any) => (node.alunos.integral || 0) + (node.alunos.manha || 0) + (node.alunos.tarde || 0);

    const infantilTotal = sumAlunos(det.infantil.creche2) + sumAlunos(det.infantil.creche3) +
      sumAlunos(det.infantil.pre1) + sumAlunos(det.infantil.pre2);

    const iniciaisTotal = sumAlunos(det.fundamental.ano1) + sumAlunos(det.fundamental.ano2) +
      sumAlunos(det.fundamental.ano3) + sumAlunos(det.fundamental.ano4) +
      sumAlunos(det.fundamental.ano5);

    const finaisTotal = sumAlunos(det.fundamental.ano6) + sumAlunos(det.fundamental.ano7) +
      sumAlunos(det.fundamental.ano8) + sumAlunos(det.fundamental.ano9);

    const ejaTotal = sumAlunos(det.fundamental.eja);
    const totalGeral = infantilTotal + iniciaisTotal + finaisTotal + ejaTotal;

    // 2. Sincronizar com o resumo e o total da escola
    const updatedFormData: DadosEducacionais = {
      ...formData,
      matricula: {
        infantil: infantilTotal,
        anosIniciais: iniciaisTotal,
        anosFinais: finaisTotal,
        eja: ejaTotal
      }
    };

    const updatedEscola = {
      ...escola,
      alunosMatriculados: totalGeral,
      dadosEducacionais: updatedFormData,
      indicadores: { ...escola.indicadores, ideb: formData.avaliacoesExternas.ideb }
    };

    onUpdate(updatedEscola);
  };

  const handleAddRh = () => {
    if (editingRhId) {
      // Update existing
      const updatedList = (escola.recursosHumanos || []).map(rh =>
        rh.id === editingRhId ? { ...rhForm, id: editingRhId } : rh
      );
      onUpdate({ ...escola, recursosHumanos: updatedList });
      setEditingRhId(null);
    } else {
      // Add new
      const newRh = { ...rhForm, id: generateUUID() };
      const updatedList = [...(escola.recursosHumanos || []), newRh];
      onUpdate({ ...escola, recursosHumanos: updatedList });
    }
    setIsAddingRh(false);
    setCpfError('');
    setRhForm({ id: '', funcao: '', nome: '', telefone: '', email: '', dataNomeacao: '', tipoVinculo: 'Efetivo', cargaHoraria: '', cpf: '', dataNascimento: '', etapaAtuacao: undefined, componenteCurricular: '', modalidadeInfantil: [], anosIniciaisAtuacao: [] });
  };

  const handleEditRh = (rh: RecursoHumano) => {
    setRhForm({ ...rh });
    setEditingRhId(rh.id);
    setIsAddingRh(true);
  };

  const handleDeleteRh = (id: string) => {
    if (confirm('Deseja remover este servidor?')) {
      const updatedList = (escola.recursosHumanos || []).filter(rh => rh.id !== id);
      onUpdate({ ...escola, recursosHumanos: updatedList });
    }
  };

  const handleAcompanhamentoChange = (id: string, field: 'resposta' | 'observacao', value: any) => {
    setLocalAcompanhamento(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSaveAcompanhamento = () => {
    const pendentesCount = localAcompanhamento.filter(i => !i.resposta).length;
    if (pendentesCount > 0) {
      alert(`Atenção: Existem ${pendentesCount} itens sem resposta. Por favor, preencha todos os itens antes de salvar.`);
      return;
    }
    onUpdate({ ...escola, acompanhamentoMensal: localAcompanhamento });
  };

  const handleClearAcompanhamento = () => {
    if (confirm('Tem certeza que deseja apagar todos os registros do Checklist? Esta ação não pode ser desfeita.')) {
      const emptyChecklist = generateAcompanhamentoMensal();
      setLocalAcompanhamento(emptyChecklist);
      onUpdate({ ...escola, acompanhamentoMensal: emptyChecklist });
    }
  };

  const handleSaveMeta = () => {
    if (!metaForm.descricao || !metaForm.prazo) return;
    let updatedPlano;
    if (metaForm.id) {
      updatedPlano = localPlanoAcao.map(m => m.id === metaForm.id ? metaForm : m);
    } else {
      const newMeta = { ...metaForm, id: generateUUID() };
      updatedPlano = [...localPlanoAcao, newMeta];
    }
    setLocalPlanoAcao(updatedPlano);
    onUpdate({ ...escola, planoAcao: updatedPlano });
    setIsEditingMeta(false);
    setMetaForm({ id: '', descricao: '', prazo: '', status: StatusMeta.NAO_INICIADO, responsavel: '' });
  };

  const handleEditMeta = (meta: MetaAcao) => {
    setMetaForm(meta);
    setIsEditingMeta(true);
  };

  const handleDeleteMeta = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      const updatedPlano = localPlanoAcao.filter(m => m.id !== id);
      setLocalPlanoAcao(updatedPlano);
      onUpdate({ ...escola, planoAcao: updatedPlano });
    }
  };

  const indicatorsData = [
    { name: 'Frequência', value: escola.indicadores.frequenciaMedia, fill: COLORS.dark },
    { name: 'Fluência', value: escola.indicadores.fluenciaLeitora, fill: COLORS.brand },
    { name: 'Aprovação', value: escola.indicadores.taxaAprovacao, fill: '#71717A' },
  ];

  const rowsInfantil = [
    { key: 'creche2', label: 'CRECHE II' },
    { key: 'creche3', label: 'CRECHE III' },
    { key: 'pre1', label: 'PRÉ I' },
    { key: 'pre2', label: 'PRÉ II' },
  ];

  const rowsFundamental = [
    { key: 'ano1', label: '1º ANO' }, { key: 'ano2', label: '2º ANO' }, { key: 'ano3', label: '3º ANO' },
    { key: 'ano4', label: '4º ANO' }, { key: 'ano5', label: '5º ANO' }, { key: 'ano6', label: '6º ANO' },
    { key: 'ano7', label: '7º ANO' }, { key: 'ano8', label: '8º ANO' }, { key: 'ano9', label: '9º ANO' },
    { key: 'eja', label: 'EJA' },
  ];

  const renderRow = (segmento: 'infantil' | 'fundamental', rowKey: string, label: string) => {
    const data = (formData.matriculaDetalhada as any)[segmento][rowKey];
    const totalTurmas = (data.turmas.integral || 0) + (data.turmas.manha || 0) + (data.turmas.tarde || 0);
    const totalAlunos = (data.alunos.integral || 0) + (data.alunos.manha || 0) + (data.alunos.tarde || 0);

    const inputClass = `w-full text-center border rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-semibold py-2.5 appearance-none outline-none ${!canEditTab ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`;

    return (
      <tr key={rowKey} className="border-b border-slate-100 hover:bg-orange-50/30 transition-colors group text-sm">
        <td className="px-5 py-3.5 font-bold text-slate-700 bg-slate-50/50 border-r border-slate-200 whitespace-nowrap">{label}</td>
        <td className="p-1.5"><input type="number" disabled={!canEditTab} className={inputClass} value={data.turmas.integral} onChange={(e) => handleTurmaChange(segmento, rowKey, 'turmas', 'integral', e.target.value)} /></td>
        <td className="p-1.5"><input type="number" disabled={!canEditTab} className={inputClass} value={data.turmas.manha} onChange={(e) => handleTurmaChange(segmento, rowKey, 'turmas', 'manha', e.target.value)} /></td>
        <td className="p-1.5"><input type="number" disabled={!canEditTab} className={inputClass} value={data.turmas.tarde} onChange={(e) => handleTurmaChange(segmento, rowKey, 'turmas', 'tarde', e.target.value)} /></td>
        <td className="px-3 py-3.5 bg-slate-100/80 text-slate-800 text-center font-bold border-x border-slate-200">{totalTurmas}</td>
        <td className="p-1.5"><input type="number" disabled={!canEditTab} className={inputClass} value={data.alunos.integral} onChange={(e) => handleTurmaChange(segmento, rowKey, 'alunos', 'integral', e.target.value)} /></td>
        <td className="p-1.5"><input type="number" disabled={!canEditTab} className={inputClass} value={data.alunos.manha} onChange={(e) => handleTurmaChange(segmento, rowKey, 'alunos', 'manha', e.target.value)} /></td>
        <td className="p-1.5"><input type="number" disabled={!canEditTab} className={inputClass} value={data.alunos.tarde} onChange={(e) => handleTurmaChange(segmento, rowKey, 'alunos', 'tarde', e.target.value)} /></td>
        <td className="px-3 py-3.5 text-orange-600 text-center font-bold">{totalAlunos}</td>
      </tr>
    );
  };

  const renderTotalFooter = (segmento: 'infantil' | 'fundamental', rows: { key: string }[]) => {
    let tInt = 0, tMan = 0, tTar = 0, tTot = 0;
    let aInt = 0, aMan = 0, aTar = 0, aTot = 0;
    rows.forEach(r => {
      const d = (formData.matriculaDetalhada as any)[segmento][r.key];
      tInt += (d.turmas.integral || 0); tMan += (d.turmas.manha || 0); tTar += (d.turmas.tarde || 0);
      tTot += (d.turmas.integral || 0) + (d.turmas.manha || 0) + (d.turmas.tarde || 0);
      aInt += (d.alunos.integral || 0); aMan += (d.alunos.manha || 0); aTar += (d.alunos.tarde || 0);
      aTot += (d.alunos.integral || 0) + (d.alunos.manha || 0) + (d.alunos.tarde || 0);
    });

    return (
      <tr className="bg-gradient-to-r from-slate-800 to-slate-900 text-white text-sm font-bold uppercase tracking-wide">
        <td className="px-5 py-4 font-bold">TOTAL</td>
        <td className="text-center">{tInt}</td>
        <td className="text-center">{tMan}</td>
        <td className="text-center">{tTar}</td>
        <td className="text-center bg-white/10 font-bold">{tTot}</td>
        <td className="text-center">{aInt}</td>
        <td className="text-center">{aMan}</td>
        <td className="text-center">{aTar}</td>
        <td className="text-center text-orange-400 font-bold">{aTot}</td>
      </tr>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 relative">
      <PageHeader
        title={escola.nome}
        subtitle="Unidade Escolar do Sistema Municipal"
        icon={SchoolIcon}
        badgeText={`ID: ${escola.id.split('-')[0]}`}
        actions={[]}
        onBack={onBack}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Gestor(a)</p>
            <p className="font-bold text-slate-800">{escola.gestor}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Localização</p>
            <p className="font-bold text-slate-800">{escola.localizacao}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">IDEB</p>
            <p className="font-bold text-slate-800 text-2xl">{escola.indicadores.ideb.toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl mb-6">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-bold flex items-center gap-2 rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] max-w-full">
        <div className="p-5 md:p-6">


          {
            activeTab === 'acompanhamento' && (() => {
              const pendentesCount = localAcompanhamento.filter(i => !i.resposta).length;

              return (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center pb-5 border-b border-slate-100">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Checklist de Verificação</h3>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        Status: Monitoramento Mensal
                        {pendentesCount > 0 ? (
                          <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                            {pendentesCount} itens pendentes
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 size={12} /> Tudo preenchido
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {canEditTab && (
                        <button onClick={handleClearAcompanhamento} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2">
                          <Trash2 size={18} /> Apagar Registros
                        </button>
                      )}
                      <button onClick={handlePrintChecklist} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2">
                        <Printer size={18} /> Imprimir Relatório
                      </button>
                      {canEditTab && (
                        <button onClick={handleSaveAcompanhamento} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                          <Save size={18} /> Salvar Registros
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-5">
                    {['Gestão', 'Financeiro'].map(cat => {
                      const itens = localAcompanhamento.filter(i => i.categoria === cat);
                      return (
                        <div key={cat} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center">
                            <span>{cat}</span>
                            <span className="text-xs font-normal text-slate-500 bg-slate-200 px-2 py-1 rounded-md">{itens.length} itens</span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {itens.map(item => (
                              <div key={item.id} className="p-6 flex flex-col md:flex-row gap-6 items-start hover:bg-slate-50/50 transition-colors">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-800 leading-relaxed mb-3">{item.pergunta}</p>
                                  <input 
                                    type="text" 
                                    placeholder={canEditTab ? "Adicionar observação..." : "Sem observação"} 
                                    disabled={!canEditTab}
                                    value={item.observacao} 
                                    onChange={e => handleAcompanhamentoChange(item.id, 'observacao', e.target.value)} 
                                    className={`w-full border rounded-lg px-4 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${!canEditTab ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                                  />
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  {['Sim', 'Não', 'Parcialmente'].map(res => (
                                    <button 
                                      key={res} 
                                      disabled={!canEditTab}
                                      onClick={() => handleAcompanhamentoChange(item.id, 'resposta', res)} 
                                      className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${!canEditTab ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${item.resposta === res ? 'bg-orange-500 border-orange-600 text-white shadow-md shadow-orange-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                      {res}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          }

          {
            activeTab === 'turmas' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Alunos por Turmas</h3>
                    <p className="text-slate-500 text-sm mt-1">Detalhamento de turmas e alunos por nível e turno.</p>
                  </div>
                  {canEditTab && (
                    <button onClick={handleSaveIndicators} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2">
                      <Save size={18} /> Salvar Dados
                    </button>
                  )}
                </div>
                <div className="space-y-8">
                  {['infantil', 'fundamental'].filter(seg => {
                    if (seg === 'fundamental') {
                      // Se a escola for EXCLUSIVAMENTE Infantil, não mostra fundamental
                      const isExclusivelyInfantil = escola.segmentos.every(s => s === Segmento.INFANTIL) && escola.segmentos.length > 0;
                      return !isExclusivelyInfantil;
                    }
                    if (seg === 'infantil') {
                      // Se a escola for EXCLUSIVAMENTE Fundamental (I ou II), não mostra infantil
                      const isExclusivelyFundamental = escola.segmentos.every(s => s === Segmento.FUNDAMENTAL_I || s === Segmento.FUNDAMENTAL_II) && escola.segmentos.length > 0;
                      return !isExclusivelyFundamental;
                    }
                    return true;
                  }).map(seg => (
                    <div key={seg} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 text-center">
                        <h4 className="text-white font-bold text-sm uppercase tracking-widest">{seg === 'infantil' ? 'Educação Infantil' : 'Ensino Fundamental'}</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr>
                              <th rowSpan={2} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase bg-slate-50 border-b border-r border-slate-200 w-32">Nível</th>
                              <th colSpan={4} className="px-2 py-2.5 text-center text-xs font-bold text-slate-600 uppercase bg-slate-50 border-b border-r border-slate-200">Turmas</th>
                              <th colSpan={4} className="px-2 py-2.5 text-center text-xs font-bold text-orange-600 uppercase bg-orange-50/50 border-b border-slate-200">Alunos</th>
                            </tr>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              <th className="px-2 py-2.5 text-center">Integral</th>
                              <th className="px-2 py-2.5 text-center">Manhã</th>
                              <th className="px-2 py-2.5 text-center">Tarde</th>
                              <th className="px-3 py-2.5 text-center bg-slate-100/80 text-slate-500 border-x border-slate-200">Total</th>
                              <th className="px-2 py-2.5 text-center">Integral</th>
                              <th className="px-2 py-2.5 text-center">Manhã</th>
                              <th className="px-2 py-2.5 text-center">Tarde</th>
                              <th className="px-3 py-2.5 text-center text-orange-500 font-bold">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(seg === 'infantil' ? rowsInfantil : rowsFundamental).map(r => renderRow(seg as any, r.key, r.label))}
                          </tbody>
                          <tfoot>
                            {renderTotalFooter(seg as any, seg === 'infantil' ? rowsInfantil : rowsFundamental)}
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          {
            activeTab === 'detalhamento_turmas' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Detalhamento de Turmas</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Relação de todas as turmas vinculadas à unidade escolar por etapa, ano/série e turno.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-100 rounded-xl shrink-0">
                    <GraduationCap className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-black text-orange-600 uppercase tracking-wider whitespace-nowrap">
                      {schoolTurmas.length} {schoolTurmas.length === 1 ? 'turma ativa' : 'turmas ativas'}
                    </span>
                  </div>
                </div>

                {isLoadingTurmas ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Buscando turmas vinculadas...</p>
                  </div>
                ) : schoolTurmas.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 border border-slate-100 rounded-2xl">
                    <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h4 className="text-sm font-bold text-slate-700">Nenhuma turma cadastrada</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Use o módulo de Gestão de Estudantes para cadastrar turmas para esta unidade escolar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {visibleEtapas.map(etapa => {
                      const hasTurmasInEtapa = etapa.cohorts.some(cohort => {
                        const key = `${etapa.id}_${cohort}`;
                        return classifiedTurmas.map[key]?.length > 0;
                      });

                      if (!hasTurmasInEtapa) return null;

                      return (
                        <div key={etapa.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 border-b border-slate-200">
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider">
                              {etapa.title}
                            </h4>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {etapa.cohorts.map(cohort => {
                              const key = `${etapa.id}_${cohort}`;
                              const cohortTurmas = classifiedTurmas.map[key] || [];

                              if (cohortTurmas.length === 0) return null;

                              return (
                                <div key={cohort} className="p-5 flex flex-col sm:flex-row sm:items-start gap-4 hover:bg-slate-50/50 transition-colors">
                                  <div className="sm:w-1/4 shrink-0 pt-1">
                                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg uppercase tracking-wide">
                                      {cohort}
                                    </span>
                                  </div>
                                  <div className="flex-1 flex flex-wrap gap-3">
                                    {cohortTurmas.map(turma => {
                                      const isManha = (turma.shift || '').toUpperCase() === 'MANHÃ';
                                      const isTarde = (turma.shift || '').toUpperCase() === 'TARDE';
                                      const isIntegral = (turma.shift || '').toUpperCase() === 'INTEGRAL';
                                      const isNoite = (turma.shift || '').toUpperCase() === 'NOITE';

                                      const shiftColor = isManha 
                                        ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                        : isTarde 
                                        ? 'bg-orange-100 text-orange-800 border-orange-200' 
                                        : isIntegral 
                                        ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
                                        : 'bg-slate-100 text-slate-800 border-slate-200';

                                      return (
                                        <div 
                                          key={turma.id} 
                                          className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-orange-300 transition-all min-w-[140px]"
                                        >
                                          <div>
                                            <div className="font-bold text-slate-800 uppercase text-xs">
                                              {turma.name}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${shiftColor}`}>
                                                {turma.shift || 'MANHÃ'}
                                              </span>
                                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-150">
                                                {turma.modality || 'REGULAR'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {classifiedTurmas.unclassified.length > 0 && (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                        <div className="bg-slate-700 px-6 py-4 border-b border-slate-200">
                          <h4 className="text-white font-bold text-sm uppercase tracking-wider">
                            Outras Turmas / Não Classificadas
                          </h4>
                        </div>
                        <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="sm:w-1/4 shrink-0 pt-1">
                            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg uppercase tracking-wide">
                              Diversas
                            </span>
                          </div>
                          <div className="flex-1 flex flex-wrap gap-3">
                            {classifiedTurmas.unclassified.map(turma => {
                              const isManha = (turma.shift || '').toUpperCase() === 'MANHÃ';
                              const isTarde = (turma.shift || '').toUpperCase() === 'TARDE';
                              const isIntegral = (turma.shift || '').toUpperCase() === 'INTEGRAL';
                              const isNoite = (turma.shift || '').toUpperCase() === 'NOITE';

                              const shiftColor = isManha 
                                ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                : isTarde 
                                ? 'bg-orange-100 text-orange-800 border-orange-200' 
                                : isIntegral 
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
                                : 'bg-slate-100 text-slate-800 border-slate-200';

                              return (
                                <div 
                                  key={turma.id} 
                                  className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-orange-300 transition-all min-w-[140px]"
                                >
                                  <div>
                                    <div className="font-bold text-slate-800 uppercase text-xs">
                                      {turma.name} {turma.year ? `(${turma.year})` : ''}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${shiftColor}`}>
                                        {turma.shift || 'MANHÃ'}
                                      </span>
                                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-150">
                                        {turma.modality || 'REGULAR'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          }

          {
            activeTab === 'rh' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Recursos Humanos</h3>
                    <p className="text-slate-500 text-sm mt-1">Gestão de servidores da unidade escolar.</p>
                  </div>
                  {!isAddingRh && (
                    <div className="flex gap-2">
                      <button onClick={handlePrintRh} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all flex items-center gap-2">
                        <Printer size={18} /> Imprimir Relatório
                      </button>
                      {canEditTab && (
                        <button onClick={() => setIsAddingRh(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2">
                          <UserPlus size={18} /> Adicionar Servidor
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Summary badges */}
                {(escola.recursosHumanos?.length || 0) > 0 && (() => {
                  const efetivos = escola.recursosHumanos?.filter(r => r.tipoVinculo === 'Efetivo').length || 0;
                  const contratados = escola.recursosHumanos?.filter(r => r.tipoVinculo === 'Contratado').length || 0;
                  return (
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                        <span className="text-sm font-bold text-emerald-700">{efetivos} Efetivo{efetivos !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                        <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                        <span className="text-sm font-bold text-orange-700">{contratados} Contratado{contratados !== 1 ? 's' : ''}</span>
                      </div>
                      {(() => {
                        const permutados = escola.recursosHumanos?.filter(r => r.tipoVinculo === 'Permutado').length || 0;
                        if (permutados === 0) return null;
                        return (
                          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                            <span className="text-sm font-bold text-blue-700">{permutados} Permutado{permutados !== 1 ? 's' : ''}</span>
                          </div>
                        );
                      })()}
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                        <Users size={14} className="text-slate-500" />
                        <span className="text-sm font-bold text-slate-600">{escola.recursosHumanos?.length || 0} Total</span>
                      </div>
                    </div>
                  );
                })()}

                {isAddingRh && (
                  <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-6 mb-8">
                      {['nome', 'email', 'telefone'].map(f => (
                        <div key={f} className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">{f}</label>
                          <input type="text" value={(rhForm as any)[f]} onChange={e => setRhForm({ ...rhForm, [f]: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" placeholder={`Digite o ${f}...`} />
                        </div>
                      ))}

                      {/* CPF com máscara e validação */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">CPF</label>
                        <input
                          type="text"
                          maxLength={14}
                          value={rhForm.cpf || ''}
                          onChange={e => {
                            // Aplica máscara CPF: xxx.xxx.xxx-xx
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                            let masked = raw;
                            if (raw.length > 9) {
                              masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
                            } else if (raw.length > 6) {
                              masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
                            } else if (raw.length > 3) {
                              masked = `${raw.slice(0, 3)}.${raw.slice(3)}`;
                            }
                            setRhForm({ ...rhForm, cpf: masked });
                            // Valida CPF
                            if (raw.length === 11) {
                              // Algoritmo de validação CPF
                              const digits = raw.split('').map(Number);
                              const calcDigit = (arr: number[], len: number) => {
                                const sum = arr.slice(0, len).reduce((acc, d, i) => acc + d * (len + 1 - i), 0);
                                const r = sum % 11;
                                return r < 2 ? 0 : 11 - r;
                              };
                              const valid = calcDigit(digits, 9) === digits[9] && calcDigit(digits, 10) === digits[10]
                                && !/^(\d)\1{10}$/.test(raw);
                              setCpfError(valid ? '' : 'CPF inválido');
                            } else {
                              setCpfError('');
                            }
                          }}
                          className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                            cpfError ? 'border-red-400 bg-red-50' : 'border-slate-200'
                          }`}
                          placeholder="000.000.000-00"
                        />
                        {cpfError && <p className="text-xs text-red-500 font-semibold mt-1">{cpfError}</p>}
                      </div>

                      {/* Data de Nascimento */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Data de Nascimento</label>
                        <input
                          type="date"
                          value={rhForm.dataNascimento || ''}
                          onChange={e => setRhForm({ ...rhForm, dataNascimento: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Função</label>
                        <select value={rhForm.funcao} onChange={e => setRhForm({ ...rhForm, funcao: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                          <option value="">Selecione a função...</option>
                          <option value="Gestor(a) Geral">Gestor(a) Geral</option>
                          <option value="Gestor(a) Pedagógico(a)">Gestor(a) Pedagógico(a)</option>
                          <option value="Coordenador(a) Pedagógico(a)">Coordenador(a) Pedagógico(a)</option>
                          <option value="Professor(a)">Professor(a)</option>
                          <option value="Auxiliar Administrativo">Auxiliar Administrativo</option>
                          <option value="Vigia">Vigia</option>
                          <option value="Merendeira">Merendeira</option>
                          <option value="Zelador">Zelador</option>
                          <option value="Auxiliar de Serviços Gerais">Auxiliar de Serviços Gerais</option>
                          <option value="Porteiro">Porteiro</option>
                          <option value="Auxiliar de Creche">Auxiliar de Creche</option>
                          <option value="Monitor(a) de Atividade Complementar">Monitor(a) de Atividade Complementar</option>
                          <option value="Profissional de Apoio">Profissional de Apoio</option>
                          <option value="Monitor de Transporte Escolar">Monitor de Transporte Escolar</option>
                          <option value="Professor do AEE">Professor do AEE</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Tipo de Vínculo</label>
                        <select value={rhForm.tipoVinculo} onChange={e => setRhForm({ ...rhForm, tipoVinculo: e.target.value as any })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                          <option value="Efetivo">Efetivo</option>
                          <option value="Contratado">Contratado</option>
                          <option value="Permutado">Permutado</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Carga Horária</label>
                        <select value={rhForm.cargaHoraria || ''} onChange={e => setRhForm({ ...rhForm, cargaHoraria: e.target.value as any })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                          <option value="">Selecione a carga horária...</option>
                          <option value="20h">20 horas</option>
                          <option value="25h">25 horas</option>
                          <option value="40h">40 horas</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Data da Nomeação</label>
                        <input type="date" value={rhForm.dataNomeacao} onChange={e => setRhForm({ ...rhForm, dataNomeacao: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" />
                      </div>
                      {rhForm.funcao === 'Professor(a)' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">Etapa de Atuação</label>
                          <select value={rhForm.etapaAtuacao || ''} onChange={e => setRhForm({ ...rhForm, etapaAtuacao: e.target.value as any, componenteCurricular: '', modalidadeInfantil: [], anosIniciaisAtuacao: [] })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                            <option value="">Selecione a etapa...</option>
                            <option value="Educação Infantil">Educação Infantil</option>
                            <option value="Anos Iniciais">Anos Iniciais</option>
                            <option value="Anos Finais">Anos Finais</option>
                            <option value="EJA">EJA</option>
                            <option value="Sala de Recurso">Sala de Recurso</option>
                            <option value="Recomposição - Língua Portuguesa">Recomposição - Língua Portuguesa</option>
                            <option value="Recomposição - Matemática">Recomposição - Matemática</option>
                            <option value="Outros">Outros</option>
                          </select>
                        </div>
                      )}
                      {rhForm.funcao === 'Professor(a)' && rhForm.etapaAtuacao === 'Educação Infantil' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">Modalidade Infantil</label>
                          <div className="flex gap-4">
                            {['Creche', 'Pré-Escola'].map(mod => (
                              <label key={mod} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={rhForm.modalidadeInfantil?.includes(mod as any)}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setRhForm({ ...rhForm, modalidadeInfantil: [...(rhForm.modalidadeInfantil || []), mod as any] });
                                    } else {
                                      setRhForm({ ...rhForm, modalidadeInfantil: (rhForm.modalidadeInfantil || []).filter(m => m !== mod) });
                                    }
                                  }}
                                  className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm text-slate-700">{mod}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {rhForm.funcao === 'Professor(a)' && rhForm.etapaAtuacao === 'Anos Iniciais' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">Ano/Série de Atuação</label>
                          <div className="flex flex-wrap gap-4">
                            {['1º ano', '2º ano', '3º ano', '4º ano', '5º ano'].map(ano => (
                              <label key={ano} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={rhForm.anosIniciaisAtuacao?.includes(ano as any)}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setRhForm({ ...rhForm, anosIniciaisAtuacao: [...(rhForm.anosIniciaisAtuacao || []), ano as any] });
                                    } else {
                                      setRhForm({ ...rhForm, anosIniciaisAtuacao: (rhForm.anosIniciaisAtuacao || []).filter(a => a !== ano) });
                                    }
                                  }}
                                  className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm text-slate-700">{ano}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {rhForm.funcao === 'Professor(a)' && rhForm.etapaAtuacao === 'Anos Finais' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase">Componente Curricular</label>
                          <select value={rhForm.componenteCurricular || ''} onChange={e => setRhForm({ ...rhForm, componenteCurricular: e.target.value as any })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
                            <option value="">Selecione o componente...</option>
                            <option value="Língua Portuguesa">Língua Portuguesa</option>
                            <option value="Matemática">Matemática</option>
                            <option value="Geografia">Geografia</option>
                            <option value="História">História</option>
                            <option value="Ciências">Ciências</option>
                            <option value="Educação Física">Educação Física</option>
                            <option value="Língua Inglesa">Língua Inglesa</option>
                            <option value="Arte">Arte</option>
                            <option value="Ensino Religioso">Ensino Religioso</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleAddRh} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20">{editingRhId ? 'Atualizar Dados' : 'Salvar Dados'}</button>
                      <button onClick={() => { setIsAddingRh(false); setEditingRhId(null); setRhForm({ id: '', funcao: '', nome: '', telefone: '', email: '', dataNomeacao: '', tipoVinculo: 'Efetivo', etapaAtuacao: undefined, componenteCurricular: '', modalidadeInfantil: [], anosIniciaisAtuacao: [] }); }} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-xl font-semibold">Cancelar</button>
                    </div>
                  </div>
                )}

                {/* Table view */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <th className="text-left px-6 py-4">Nome / Função</th>
                          <th className="text-left px-4 py-4">Contato</th>
                          <th className="text-center px-4 py-4">Vínculo</th>
                          <th className="text-center px-4 py-4">Atuação</th>
                          <th className="text-center px-4 py-4 w-20">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {escola.recursosHumanos?.map(rh => (
                          <tr key={rh.id} className="border-b border-slate-100 hover:bg-orange-50/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 uppercase text-sm">{rh.nome}</div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {rh.funcao}
                                {rh.dataNomeacao && <> • Desde {new Date(rh.dataNomeacao + 'T12:00:00').toLocaleDateString('pt-BR')}</>}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {rh.telefone && <div className="text-sm text-slate-700 font-medium">{rh.telefone}</div>}
                              {rh.email && <div className="text-xs text-orange-500 mt-0.5">{rh.email}</div>}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${rh.tipoVinculo === 'Efetivo' ? 'bg-emerald-100 text-emerald-700' : rh.tipoVinculo === 'Permutado' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                {rh.tipoVinculo}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center text-sm text-slate-600">
                              {rh.etapaAtuacao || '-'}
                              {rh.modalidadeInfantil && rh.modalidadeInfantil.length > 0 && <div className="text-xs text-slate-400 mt-0.5">{rh.modalidadeInfantil.join(', ')}</div>}
                              {rh.anosIniciaisAtuacao && rh.anosIniciaisAtuacao.length > 0 && <div className="text-xs text-slate-400 mt-0.5">{rh.anosIniciaisAtuacao.join(', ')}</div>}
                              {rh.componenteCurricular && <div className="text-xs text-slate-400 mt-0.5">{rh.componenteCurricular}</div>}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {servidorElegivelCarta(rh.funcao) && (
                                  <button
                                    title="Imprimir Carta de Apresentação"
                                    onClick={() => handlePrintCarta(rh)}
                                    className="text-slate-300 hover:text-indigo-500 transition-colors p-1.5 hover:bg-indigo-50 rounded-lg"
                                  >
                                    <Printer size={16} />
                                  </button>
                                )}
                                {canEditTab && (
                                  <>
                                    <button onClick={() => handleEditRh(rh)} className="text-slate-300 hover:text-orange-500 transition-colors p-1.5 hover:bg-orange-50 rounded-lg" title="Editar"><Edit size={16} /></button>
                                    <button onClick={() => handleDeleteRh(rh.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={16} /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(!escola.recursosHumanos || escola.recursosHumanos.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">Nenhum servidor cadastrado.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          }

          {
            activeTab === 'plano' && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Plano de Ação</h3>
                    <p className="text-sm text-slate-500 mt-1">Gestão de metas e prazos para melhoria dos indicadores.</p>
                  </div>
                  {!isEditingMeta && canEditTab && <button onClick={() => { setMetaForm({ id: '', descricao: '', prazo: '', status: StatusMeta.NAO_INICIADO, responsavel: '' }); setIsEditingMeta(true); }} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"><Target size={18} /> Nova Meta</button>}
                </div>

                {isEditingMeta && (
                  <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm mb-8 animate-fade-in">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição da Meta</label>
                        <input type="text" value={metaForm.descricao} onChange={e => setMetaForm({ ...metaForm, descricao: e.target.value })} className="w-full text-lg font-medium text-slate-800 border-b border-slate-200 py-2 focus:border-orange-500 focus:outline-none placeholder-slate-300" placeholder="Descreva a meta..." />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prazo</label>
                          <input type="date" value={metaForm.prazo} onChange={e => setMetaForm({ ...metaForm, prazo: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Responsável</label>
                          <input type="text" value={metaForm.responsavel} onChange={e => setMetaForm({ ...metaForm, responsavel: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Nome do responsável" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                          <select value={metaForm.status} onChange={e => setMetaForm({ ...metaForm, status: e.target.value as StatusMeta })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                            <option value={StatusMeta.NAO_INICIADO}>{StatusMeta.NAO_INICIADO}</option>
                            <option value={StatusMeta.EM_ANDAMENTO}>{StatusMeta.EM_ANDAMENTO}</option>
                            <option value={StatusMeta.CONCLUIDO}>{StatusMeta.CONCLUIDO}</option>
                            <option value={StatusMeta.ATRASADO}>{StatusMeta.ATRASADO}</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button onClick={handleSaveMeta} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20">Salvar Meta</button>
                        <button onClick={() => setIsEditingMeta(false)} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-xl font-semibold">Cancelar</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {isLoadingPlano ? (
                    <div className="py-12 text-center text-slate-400 text-sm">Carregando ações...</div>
                  ) : localPlanoAcao.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">Nenhuma meta cadastrada.</div>
                  ) : null}
                  {!isLoadingPlano && localPlanoAcao.map(meta => (
                    <div key={meta.id} className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-6 group">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${meta.status === StatusMeta.CONCLUIDO ? 'bg-emerald-100 text-emerald-700' : meta.status === StatusMeta.EM_ANDAMENTO ? 'bg-blue-100 text-blue-700' : meta.status === StatusMeta.ATRASADO ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{meta.status}</span>
                          <span className="text-xs font-medium text-slate-400 flex items-center gap-1"><Clock size={12} /> {meta.prazo}</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 leading-tight">{meta.descricao}</h4>
                        <p className="text-xs font-medium text-orange-600 mt-2 uppercase tracking-wide">Responsável: {meta.responsavel}</p>
                      </div>
                      {canEditTab && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditMeta(meta)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-all"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteMeta(meta.id)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          {
            activeTab === 'visitas' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">REGISTROS DE VISITAS</h3>
                  <p className="text-sm text-slate-500 mt-1">Histórico completo de acompanhamento</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-900 px-6 py-4">
                    <div className="grid grid-cols-12 gap-4 text-xs font-bold text-white uppercase tracking-wider items-center">
                      <div className="col-span-5">Escola / Data</div>
                      <div className="col-span-3 text-center">Tipo</div>
                      <div className="col-span-2 text-center">Status</div>
                      <div className="col-span-2 text-right">Ações</div>
                    </div>
                  </div>

                  {historicoVisitas.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <p className="font-medium text-sm">Nenhuma visita registrada até o momento.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {historicoVisitas.map(visita => (
                        <div key={visita.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 transition-colors group text-sm">
                          <div className="col-span-5">
                            <div className="font-bold text-slate-800">{new Date(visita.data + 'T12:00:00').toLocaleDateString()}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{escola.nome}</div>
                          </div>
                          <div className="col-span-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${visita.tipo === 'Emergencial' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                              {visita.tipo}
                            </span>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${visita.status === 'Realizada' ? 'bg-emerald-100 text-emerald-700' : visita.status === 'Planejada' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${visita.status === 'Realizada' ? 'bg-emerald-500' : visita.status === 'Planejada' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                              {visita.status}
                            </span>
                          </div>
                          <div className="col-span-2 flex justify-end gap-2">
                            <button
                              onClick={() => handlePrint(visita)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Printer size={14} /> Relatório
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedVisitForPrint && (
                    <PrintableVisitReport
                      visita={selectedVisitForPrint}
                      escola={escola}
                      coordenador={regionalCoordinator}
                    />
                  )}
                </div>
              </div>
            )
          }

          {
            activeTab === 'documentos' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Emissão de Documentos</h3>
                    <p className="text-sm text-slate-500 mt-1">Gere notificações de frequência e autorizações oficiais</p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                    <button
                      onClick={() => setSelectedDocType('notificacao_frequencia')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        selectedDocType === 'notificacao_frequencia'
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Notificação de Frequência
                    </button>
                    <button
                      onClick={() => setSelectedDocType('autorizacao_imagem')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        selectedDocType === 'autorizacao_imagem'
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Autorização de Imagem e Som
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Form Card */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b pb-3">
                      {selectedDocType === 'notificacao_frequencia' 
                        ? 'Dados da Notificação por Baixa Frequência' 
                        : 'Dados do Termo de Autorização de Imagem/Som'}
                    </h4>

                    {loadingStudents ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Student Selector */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Selecionar Estudante *
                          </label>
                          <select
                            value={docStudentId}
                            onChange={(e) => setDocStudentId(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                          >
                            <option value="">Selecione um estudante...</option>
                            {students.map(student => (
                              <option key={student.id} value={student.id}>
                                {student.name} ({student.stage})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Common Fields */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Nome do Pai, Mãe ou Responsável Legal *
                          </label>
                          <input
                            type="text"
                            value={docResponsavelNome}
                            onChange={(e) => setDocResponsavelNome(e.target.value)}
                            placeholder="Nome completo do responsável"
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                          />
                        </div>

                        {/* Attendance specific fields */}
                        {selectedDocType === 'notificacao_frequencia' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Frequência Atual do Aluno (%) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={docFrequenciaAtual}
                                onChange={(e) => setDocFrequenciaAtual(Number(e.target.value))}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Total de Faltas Acumuladas *
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={docTotalFaltas}
                                onChange={(e) => setDocTotalFaltas(Number(e.target.value))}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Data de Comparecimento na Escola *
                              </label>
                              <input
                                type="date"
                                value={docDataAtendimento}
                                onChange={(e) => setDocDataAtendimento(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Horário do Comparecimento *
                              </label>
                              <input
                                type="time"
                                value={docHorarioAtendimento}
                                onChange={(e) => setDocHorarioAtendimento(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                              />
                            </div>
                          </div>
                        )}

                        {/* Image authorization specific fields */}
                        {selectedDocType === 'autorizacao_imagem' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                  CPF do Responsável *
                                </label>
                                <input
                                  type="text"
                                  value={docResponsavelCpf}
                                  onChange={(e) => setDocResponsavelCpf(e.target.value)}
                                  placeholder="000.000.000-00"
                                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                  Telefone de Contato *
                                </label>
                                <input
                                  type="text"
                                  value={docResponsavelTelefone}
                                  onChange={(e) => setDocResponsavelTelefone(e.target.value)}
                                  placeholder="(98) 99999-9999"
                                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Endereço Residencial Completo *
                              </label>
                              <input
                                type="text"
                                value={docResponsavelEndereco}
                                onChange={(e) => setDocResponsavelEndereco(e.target.value)}
                                placeholder="Rua, Número, Bairro, Cidade - MA"
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
                              />
                            </div>
                          </div>
                        )}

                        <div className="pt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={handleGenerateDocument}
                            disabled={!docStudentId || !docResponsavelNome}
                            className={`px-6 py-3 bg-brand-orange text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-orange-600 shadow-sm transition-all ${
                              (!docStudentId || !docResponsavelNome) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <Printer size={16} /> Emitir e Imprimir Documento
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Information / Preview panel */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b pb-3 mb-4">
                        Orientações de Emissão
                      </h4>
                      {selectedDocType === 'notificacao_frequencia' ? (
                        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                          <p>
                            A <strong>Notificação por Baixa Frequência</strong> deve ser emitida para estudantes cuja frequência escolar acumulada esteja abaixo do mínimo constitucional exigido (75%).
                          </p>
                          <p>
                            Este documento serve como a <strong>primeira notificação formal</strong> à família e integra o histórico do aluno de acordo com o estatuto da criança e do adolescente (ECA).
                          </p>
                          <p className="font-bold text-orange-600 bg-orange-50 p-2.5 rounded-lg border border-orange-100">
                            Atenção: Caso o responsável não compareça ou não haja melhoria na frequência após a notificação, a escola deverá encaminhar a ficha FICAI ao Conselho Tutelar.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                          <p>
                            O <strong>Termo de Autorização de Imagem e Som</strong> é indispensável para todos os estudantes menores de idade.
                          </p>
                          <p>
                            A escola só poderá veicular fotos, vídeos ou áudios dos estudantes em murais públicos, redes sociais ou materiais didáticos caso possua este termo devidamente assinado e arquivado na secretaria escolar.
                          </p>
                          <p className="font-bold text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                            Recomendação: Colete esta autorização durante o ato de matrícula no início do ano letivo.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 border-t border-slate-200 pt-4 text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SEMED - Humberto de Campos</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          {
            activeTab === 'matriculas' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Controle de Matrículas</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Gerenciamento de alunos matriculados nesta unidade de ensino.
                    </p>
                  </div>
                  {canEditTab && (
                    <button
                      onClick={() => { setSelectedStudent(null); setIsCadastroModalOpen(true); }}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                    >
                      <UserPlus size={18} /> Cadastrar Aluno
                    </button>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-orange-500" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome ou CPF..."
                      value={searchTermMatriculas}
                      onChange={e => setSearchTermMatriculas(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium text-slate-700 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-100 rounded-xl shrink-0">
                    <Users className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-black text-orange-600 uppercase tracking-wider whitespace-nowrap">
                      {filteredStudentsMatriculas.length} {filteredStudentsMatriculas.length === 1 ? 'estudante' : 'estudantes'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <select 
                      value={stageFilterMatriculas}
                      onChange={e => setStageFilterMatriculas(e.target.value)}
                      className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-orange-500 focus:bg-white transition-all"
                    >
                      <option value="ALL">Todos os Anos / Séries</option>
                      {stagesMatriculas.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select 
                      value={statusFilterMatriculas}
                      onChange={e => setStatusFilterMatriculas(e.target.value)}
                      className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-orange-500 focus:bg-white transition-all"
                    >
                      <option value="ALL">Todos os Status</option>
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-hidden border border-slate-200 shadow-sm bg-white rounded-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Matrícula / Nome</th>
                          <th className="px-6 py-4">CPF</th>
                          <th className="px-6 py-4">Ano / Série</th>
                          <th className="px-6 py-4 text-center">Etapa</th>
                          <th className="px-6 py-4 text-center">Status</th>
                          {canEditTab && <th className="px-6 py-4 text-right">Ações</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loadingStudents ? (
                          <tr>
                            <td colSpan={canEditTab ? 6 : 5} className="py-20 text-center text-slate-400">
                              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 opacity-20 text-orange-500" />
                              <p className="font-bold text-sm tracking-wide">Sincronizando base de dados de alunos...</p>
                            </td>
                          </tr>
                        ) : filteredStudentsMatriculas.length === 0 ? (
                          <tr>
                            <td colSpan={canEditTab ? 6 : 5} className="py-20 text-center text-slate-400">
                              <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                              <p className="font-semibold text-sm">Nenhum aluno matriculado encontrado para os filtros atuais.</p>
                            </td>
                          </tr>
                        ) : (
                          paginatedStudentsMatriculas.map(student => (
                            <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs uppercase">
                                    {student.name?.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800 text-sm uppercase">{student.name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">
                                      MAT: {student.registration_number || '---'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs font-bold text-slate-500">{student.cpf || '---'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs font-bold text-slate-600 uppercase">
                                  {getStudentTurmaInfo(student.class_id)}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                                  {student.stage}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase
                                  ${(student.status as string === 'Ativo' || student.status as string === 'active') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${(student.status as string === 'Ativo' || student.status as string === 'active') ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                  {(student.status as string === 'Ativo' || student.status as string === 'active') ? 'Ativo' : student.status}
                                </span>
                              </td>
                              {canEditTab && (
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => { setSelectedStudent(student); setIsCadastroModalOpen(true); }}
                                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                      title="Editar Aluno"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStudent(student.id)}
                                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                      title="Excluir Aluno"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {!loadingStudents && filteredStudentsMatriculas.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-400 uppercase">
                        Mostrando {paginatedStudentsMatriculas.length} de {filteredStudentsMatriculas.length} registros
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={currentPageMatriculas === 1}
                          onClick={() => setCurrentPageMatriculas(p => Math.max(1, p - 1))}
                          className={`px-4 py-2 rounded-xl text-xs font-black border border-slate-200 transition-all ${
                            currentPageMatriculas === 1
                              ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                              : 'bg-white text-slate-600 shadow-sm hover:border-orange-500 hover:text-orange-500 active:scale-95'
                          }`}
                        >
                          Anterior
                        </button>
                        <span className="text-xs font-bold text-slate-500 px-2 whitespace-nowrap">
                          Página {currentPageMatriculas} de {totalPagesMatriculas}
                        </span>
                        <button
                          type="button"
                          disabled={currentPageMatriculas >= totalPagesMatriculas}
                          onClick={() => setCurrentPageMatriculas(p => Math.min(totalPagesMatriculas, p + 1))}
                          className={`px-4 py-2 rounded-xl text-xs font-black border border-slate-200 transition-all ${
                            currentPageMatriculas >= totalPagesMatriculas
                              ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                              : 'bg-white text-slate-600 shadow-sm hover:border-orange-500 hover:text-orange-500 active:scale-95'
                          }`}
                        >
                          Próximo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          {
            activeTab === 'professores' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Professores e Vínculos</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Gerenciamento dos professores vinculados a esta unidade escolar e suas turmas.
                    </p>
                  </div>
                </div>

                {schoolTeachers.length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-12 text-center">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-slate-700">Nenhum professor vinculado</h4>
                    <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
                      Não há coordenadores com a função "Professor" vinculados a esta escola. Para vincular um professor a esta escola, vá em Equipe/Gestão de Usuários.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {schoolTeachers.map((teacher) => {
                      const teacherTurmas = schoolTurmas.filter(t => (teacher.turmasIds || []).includes(t.id));
                      return (
                        <div key={teacher.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-bold text-lg">
                                {teacher.nome.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 text-lg leading-tight">{teacher.nome}</h4>
                                <p className="text-slate-400 text-xs mt-0.5">{teacher.contato}</p>
                              </div>
                            </div>

                             <div className="space-y-2">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Turmas Vinculadas ({teacherTurmas.length})</span>
                               {teacherTurmas.length === 0 ? (
                                 <p className="text-slate-400 text-xs italic">Nenhuma turma vinculada a este professor nesta escola.</p>
                               ) : (
                                 <div className="flex flex-col gap-2">
                                   {teacherTurmas.map((t) => {
                                     const comps = teacher.turmaComponentes?.[t.id] || [];
                                     return (
                                       <div key={t.id} className="bg-slate-50 text-slate-700 text-xs font-semibold p-3 rounded-xl border border-slate-200/60 shadow-sm space-y-1.5">
                                         <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                           <GraduationCap className="w-4 h-4 text-orange-500" />
                                           {(t.year || t.anoSerie) ? `${t.year || t.anoSerie} - ` : ''}{t.name || ''} • {t.shift || ''}
                                         </div>
                                         {comps.length > 0 ? (
                                           <div className="flex flex-wrap gap-1">
                                             {comps.map(comp => (
                                               <span key={comp} className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-100 uppercase tracking-tight">
                                                 {comp}
                                               </span>
                                             ))}
                                           </div>
                                         ) : (
                                           <span className="text-[10px] text-slate-400 italic block">Nenhum componente curricular ou campo de experiência vinculado</span>
                                        )}
                                       </div>
                                     );
                                   })}
                                 </div>
                               )}
                             </div>
                           </div>
 
                           {canEditTab && (
                             <div className="mt-6 border-t border-slate-100 pt-4 flex justify-end">
                               <Button
                                 size="sm"
                                 variant="secondary"
                                 onClick={() => {
                                   setSelectedTeacherForTurmas(teacher);
                                   setTempSelectedTurmas(teacher.turmasIds || []);
                                   setTempTurmaComponentes(teacher.turmaComponentes || {});
                                 }}
                                 className="flex items-center gap-2"
                               >
                                 <Edit className="w-4 h-4" />
                                 Vincular Turmas
                               </Button>
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 )}
 
                 {/* Modal for Vincular Turmas */}
                 {selectedTeacherForTurmas && (
                   <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
                       <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                         <div>
                           <h4 className="text-xl font-bold text-slate-800">Vincular Turmas</h4>
                           <p className="text-xs text-slate-500 mt-1">{selectedTeacherForTurmas.nome}</p>
                         </div>
                         <button
                           onClick={() => setSelectedTeacherForTurmas(null)}
                           className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 border border-slate-200/60 shadow-sm transition-colors"
                         >
                           <X className="w-4 h-4" />
                         </button>
                       </div>
 
                       <div className="p-6 overflow-y-auto space-y-4 flex-1">
                         <p className="text-slate-500 text-sm leading-relaxed">
                           Selecione as turmas da unidade <strong>{escola.nome}</strong> que este professor lecionará e vincule os componentes/campos correspondentes:
                         </p>
                         
                         {schoolTurmas.length === 0 ? (
                           <div className="text-center py-6">
                             <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                             <p className="text-slate-400 text-xs italic">Nenhuma turma cadastrada nesta escola.</p>
                           </div>
                         ) : (
                           <div className="space-y-3">
                             {schoolTurmas.map((t) => {
                               const isChecked = tempSelectedTurmas.includes(t.id);
                               const isInfantil = t.stage === 'Educação Infantil';
                               const currentSelected = tempTurmaComponentes[t.id] || [];
                               const listToUse = isInfantil ? CAMPOS_EXPERIENCIA : COMPONENTES_CURRICULARES;

                               return (
                                 <div key={t.id} className={`rounded-2xl border transition-all overflow-hidden ${isChecked ? 'bg-orange-50/20 border-orange-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                   {/* Header Row */}
                                   <div 
                                     onClick={() => {
                                       if (isChecked) {
                                         setTempSelectedTurmas(tempSelectedTurmas.filter(id => id !== t.id));
                                         const updated = { ...tempTurmaComponentes };
                                         delete updated[t.id];
                                         setTempTurmaComponentes(updated);
                                       } else {
                                         setTempSelectedTurmas([...tempSelectedTurmas, t.id]);
                                         setTempTurmaComponentes({
                                           ...tempTurmaComponentes,
                                           [t.id]: []
                                         });
                                       }
                                     }}
                                     className="flex items-center gap-3 p-3.5 cursor-pointer select-none bg-white hover:bg-slate-50/50"
                                   >
                                     <input
                                       type="checkbox"
                                       checked={isChecked}
                                       readOnly
                                       className="w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500 pointer-events-none"
                                     />
                                     <div className="flex-1">
                                       <span className="font-bold text-slate-800 text-sm block">{(t.year || t.anoSerie) ? `${t.year || t.anoSerie} - ` : ''}{t.name || ''}</span>
                                       <span className="text-[10px] text-slate-400 font-medium block uppercase mt-0.5">{t.stage || 'Regular'} • {t.shift || 'MANHÃ'}</span>
                                     </div>
                                   </div>

                                   {/* Curricular Components / Fields of Experience Selection */}
                                   {isChecked && (
                                     <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-2.5">
                                       <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                         {isInfantil ? 'Campos de Experiência' : 'Componentes Curriculares'}
                                       </span>
                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                         {listToUse.map((comp) => {
                                           const isCompChecked = currentSelected.includes(comp);
                                           return (
                                             <label 
                                               key={comp} 
                                               className="flex items-start gap-2.5 p-2 rounded-xl border bg-white border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors text-xs font-semibold text-slate-700 leading-normal"
                                             >
                                               <input
                                                 type="checkbox"
                                                 checked={isCompChecked}
                                                 onChange={(e) => {
                                                   const newComponents = e.target.checked
                                                     ? [...currentSelected, comp]
                                                     : currentSelected.filter(item => item !== comp);
                                                   setTempTurmaComponentes({
                                                     ...tempTurmaComponentes,
                                                     [t.id]: newComponents
                                                   });
                                                 }}
                                                 className="w-3.5 h-3.5 rounded text-orange-500 border-slate-300 focus:ring-orange-500 mt-0.5"
                                               />
                                               <span>{comp}</span>
                                             </label>
                                           );
                                         })}
                                       </div>
                                     </div>
                                   )}
                                 </div>
                               );
                             })}
                           </div>
                         )}
                       </div>
 
                       <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                         <Button
                           variant="ghost"
                           onClick={() => setSelectedTeacherForTurmas(null)}
                           disabled={isSavingTurmas}
                         >
                           Cancelar
                         </Button>
                         <Button
                           variant="primary"
                           onClick={async () => {
                             if (!onUpdateCoordenadorTurmas) return;
                             setIsSavingTurmas(true);
                             try {
                               await onUpdateCoordenadorTurmas(selectedTeacherForTurmas.id, tempSelectedTurmas, tempTurmaComponentes);
                               setSelectedTeacherForTurmas(null);
                             } catch (err) {
                               console.error(err);
                             } finally {
                               setIsSavingTurmas(false);
                             }
                           }}
                          disabled={isSavingTurmas}
                          className="flex items-center gap-2"
                        >
                          {isSavingTurmas ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Salvar Vínculos
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          }
          {
            activeTab === 'atas_finais' && (
              <AtasFinaisTab
                escola={escola}
                schoolTurmas={schoolTurmas}
                isDemoMode={isDemoMode}
                userRole={userRole}
              />
            )
          }
        </div>
      </div>

      {isPrintingRh && (
        <PrintableRhReport
          escola={escola}
          coordenador={regionalCoordinator}
        />
      )}

      {isPrintingChecklist && (
        <PrintableChecklistReport
          escola={escola}
          acompanhamentoMensal={localAcompanhamento}
        />
      )}

      {selectedServidorForCarta && (
        <PrintableCartaApresentacao
          escola={escola}
          servidor={selectedServidorForCarta}
          coordenadorRegional={regionalCoordinator}
        />
      )}

      {isPrintingDocument && (
        <PrintableSchoolDocument
          documentType={selectedDocType}
          student={selectedStudentForPrint}
          escolaNome={escola.nome}
          data={printDocData}
          onClose={() => {
            setIsPrintingDocument(false);
            setSelectedStudentForPrint(null);
            setPrintDocData(null);
          }}
        />
      )}

      {isCadastroModalOpen && (
        <CadastroEstudanteModal 
          isOpen={isCadastroModalOpen}
          onClose={() => setIsCadastroModalOpen(false)}
          onSuccess={loadStudentsList}
          escolas={[escola]}
          initialStudent={selectedStudent}
          onOpenTurmaModal={() => setIsTurmaModalOpen(true)}
          context={{
            schoolId: escola.id,
            schoolName: escola.nome,
            classId: '',
            groupName: '',
            responsibleName: '',
            contextName: 'Controle de Matrículas'
          }}
        />
      )}

      {isTurmaModalOpen && (
        <CadastroTurmaModal 
          isOpen={isTurmaModalOpen}
          onClose={() => setIsTurmaModalOpen(false)}
          onSave={handleSaveTurma}
          onDelete={handleDeleteTurma}
          turmasExistentes={schoolTurmas.map(t => ({
            id: t.id,
            etapa: t.stage || (t.level === 'Infantil' ? 'Educação Infantil' : 'Anos Iniciais'),
            anoSerie: t.year || t.name,
            identificacao: t.name,
            turno: t.shift || 'MANHÃ',
            tipo: t.modality || 'REGULAR',
            escolaId: t.school_id
          }))}
          escolas={[escola]}
        />
      )}
    </div>
  );
};
