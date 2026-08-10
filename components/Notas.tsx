import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ConfirmModal } from './ui/ConfirmModal';
import { 
  GraduationCap, School as SchoolIcon, Search, Save, Percent, 
  TrendingUp, Award, AlertTriangle, Loader2, ListFilter, Trash2,
  Printer, Edit, ChevronLeft, ChevronRight, RotateCcw, Users, CheckCircle
} from 'lucide-react';
import { Escola, Coordenador } from '../types';
import { supabase } from '../services/supabase';
import { logAudit } from '../services/logService';
import { useNotification } from '../context/NotificationContext';
import { useConfiguracao } from '../context/ConfiguracaoContext';
import { SearchableSchoolSelect } from './ui/SearchableSchoolSelect';
import { PrintableBoletim } from './PrintableBoletim';
import { isEducaInfantilYear, isCampoExperienciaInfantil, normalizeSubjectName } from '../utils';

interface NotasProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
  subHeader?: React.ReactNode;
}

interface StudentGrade {
  id: string | number;
  name: string;
  av1: number | '';
  av2: number | '';
  qualitativa: number | '';
  recuperacao: number | '';
  mediaFinal: number;
}

interface GradeSheet {
  id: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  anoSerie?: string;
  componente: string;
  bimestre: string;
  mediaTurma: number;
  taxaAprovacao: number;
  students: StudentGrade[];
  criadoEm: string;
  createdBy?: string;
  updatedBy?: string;
  professorNome?: string;
}

const COMPONENTES = [
  'Língua Portuguesa',
  'Matemática',
  'Ciências',
  'História',
  'Geografia',
  'Arte',
  'Educação Física',
  'Língua Inglesa',
  'Ensino Religioso'
];

const BIMESTRES = [
  '1º Bimestre',
  '2º Bimestre',
  '3º Bimestre',
  '4º Bimestre'
];

// Helper to parse any grade value (string or number or empty) into a float or NaN
const parseGradeToFloat = (val: any): number => {
  if (val === undefined || val === null || val === '') return NaN;
  if (typeof val === 'number') return val;
  const parsed = parseFloat(String(val).replace(',', '.'));
  return parsed;
};

// Helper to format a float value (or empty string/null) to Brazilian format "X,XX"
const formatGradeValue = (val: any): string => {
  const num = parseGradeToFloat(val);
  if (isNaN(num)) return '';
  return num.toFixed(2).replace('.', ',');
};

export const Notas: React.FC<NotasProps> = ({ escolas, isDemoMode, isAdmin, userEmail, currentUser, subHeader }) => {
  const { configuracao, isPeriodoBloqueado } = useConfiguracao();
  const { showNotification } = showNotificationContext();
  const [sheets, setSheets] = useState<GradeSheet[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // Spreadsheet States
  const [gradesMap, setGradesMap] = useState<Record<string | number, {
    av1: string;
    av2: string;
    qualitativa: string;
    recuperacao: string;
    mediaFinal: number;
  }>>({});

  const editTurmaIdRef = useRef<string | null>(null);
  const [selectedSheetForPrint, setSelectedSheetForPrint] = useState<GradeSheet | null>(null);

  // Filter & Selection State
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedAnoSerie, setSelectedAnoSerie] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [componente, setComponente] = useState(COMPONENTES[0]);
  const [bimestre, setBimestre] = useState(BIMESTRES[0]);
  const isBlocked = isPeriodoBloqueado(bimestre, currentUser?.funcao);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [hasLoadedStudents, setHasLoadedStudents] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);

  // History Filters & Pagination State
  const [historyFilterEscola, setHistoryFilterEscola] = useState('');
  const [historyFilterAnoSerie, setHistoryFilterAnoSerie] = useState('');
  const [historyFilterTurma, setHistoryFilterTurma] = useState('');
  const [historyFilterComponente, setHistoryFilterComponente] = useState('');
  const [historyFilterBimestre, setHistoryFilterBimestre] = useState('');
  const [historyFilterProfessor, setHistoryFilterProfessor] = useState('');

  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);

  // Reset page to 1 whenever any filter or items-per-page changes
  useEffect(() => {
    setHistoryCurrentPage(1);
  }, [historyFilterEscola, historyFilterAnoSerie, historyFilterTurma, historyFilterComponente, historyFilterBimestre, historyFilterProfessor, historyItemsPerPage]);

  const allowedEscolas = useMemo(() => {
    if (isAdmin || currentUser?.funcao === 'Administrador') {
      return escolas;
    }
    const userSchoolIds = currentUser?.escolasIds || [];
    if (userSchoolIds.length > 0) {
      return escolas.filter(e => userSchoolIds.includes(e.id));
    }
    return escolas;
  }, [escolas, isAdmin, currentUser]);

  const componentesRede = useMemo(() => {
    if (configuracao && configuracao.componentes_curriculares && configuracao.componentes_curriculares.length > 0) {
      return configuracao.componentes_curriculares.map(c => normalizeSubjectName(c));
    }
    return COMPONENTES;
  }, [configuracao]);

  const allowedComponentes = useMemo(() => {
    if (currentUser && currentUser.funcao === 'Professor') {
      if (selectedTurmaId) {
        return currentUser.turmaComponentes?.[selectedTurmaId] || [];
      }
      const allTeacherAssigned = Object.values(currentUser.turmaComponentes || {}).flat();
      return Array.from(new Set(allTeacherAssigned));
    }
    return componentesRede;
  }, [currentUser, selectedTurmaId, componentesRede]);

  useEffect(() => {
    if (allowedComponentes.length > 0) {
      if (!allowedComponentes.includes(componente)) {
        setComponente(allowedComponentes[0]);
      }
    }
  }, [allowedComponentes, componente]);

  // Extract unique available Year/Grade levels (excluding Educação Infantil)
  const availableAnosSeries = useMemo(() => {
    const years = turmas.map(t => t.year).filter(Boolean).filter(y => !isEducaInfantilYear(y));
    return Array.from(new Set(years)).sort();
  }, [turmas]);

  // Filter available classes based on the selected Year/Grade
  const availableTurmas = useMemo(() => {
    if (!selectedAnoSerie) return [];
    return turmas.filter(t => t.year === selectedAnoSerie);
  }, [turmas, selectedAnoSerie]);

  // Search Filter
  const [studentSearch, setStudentSearch] = useState('');

  // Workaround for NotificationContext import issues (fallback to native alert if context fails)
  function showNotificationContext() {
    try {
      return useNotification();
    } catch {
      return {
        showNotification: (type: 'success' | 'error' | 'info', msg: string) => {
          alert(`${type.toUpperCase()}: ${msg}`);
        }
      };
    }
  }

  const fetchRealSheets = async () => {
    try {
      let allSheetsData: any[] = [];
      let sheetPage = 0;
      const pageSize = 1000;
      let hasMoreSheets = true;

      while (hasMoreSheets) {
        const { data: pageData, error } = await supabase
          .from('notas_sheets')
          .select('*')
          .eq('ativo', true)
          .order('created_at', { ascending: false })
          .range(sheetPage * pageSize, (sheetPage + 1) * pageSize - 1);

        if (error) throw error;
        if (pageData && pageData.length > 0) {
          allSheetsData = [...allSheetsData, ...pageData];
          if (pageData.length < pageSize) {
            hasMoreSheets = false;
          } else {
            sheetPage++;
          }
        } else {
          hasMoreSheets = false;
        }
      }

      // Also get turmas to map names (paginated in chunks to avoid 1000 row cap)
      let allTurmasData: any[] = [];
      let turmaPage = 0;
      let hasMoreTurmas = true;

      while (hasMoreTurmas) {
        const { data: tData, error: turmasError } = await supabase
          .from('turmas')
          .select('id, name, year, shift')
          .range(turmaPage * pageSize, (turmaPage + 1) * pageSize - 1);

        if (turmasError) break;
        if (tData && tData.length > 0) {
          allTurmasData = [...allTurmasData, ...tData];
          if (tData.length < pageSize) {
            hasMoreTurmas = false;
          } else {
            turmaPage++;
          }
        } else {
          hasMoreTurmas = false;
        }
      }

      const turmaMap = new Map<string, string>();
      const turmaAnoMap = new Map<string, string>();
      allTurmasData.forEach((t: any) => {
        turmaMap.set(t.id, `${t.name || t.year} • ${t.shift || ''}`);
        turmaAnoMap.set(t.id, t.year || '');
      });

      // Fetch coordenadores to map emails to teacher names
      const { data: allCoords } = await supabase
        .from('coordenadores')
        .select('contato, nome');

      const coordMap = new Map<string, string>();
      if (allCoords) {
        allCoords.forEach((c: any) => {
          if (c.contato && c.nome) {
            coordMap.set(c.contato.toLowerCase().trim(), c.nome.trim());
          }
        });
      }

      let filteredSheets = allSheetsData;
      // Exclude Early Childhood Education entries from Ensino Fundamental history
      filteredSheets = filteredSheets.filter((p: any) => {
        if (p.componente && isCampoExperienciaInfantil(p.componente)) return false;
        const anoSerie = turmaAnoMap.get(p.turma_id) || p.ano_serie || '';
        if (anoSerie && isEducaInfantilYear(anoSerie)) return false;
        return true;
      });

      if (!isAdmin && currentUser && currentUser.funcao !== 'Administrador') {
        const userSchoolIds = currentUser?.escolasIds || [];
        if (userSchoolIds.length > 0) {
          filteredSheets = filteredSheets.filter((p: any) => userSchoolIds.includes(p.escola_id));
        }
      }
      if (currentUser && currentUser.funcao === 'Professor') {
        const assignedIds = currentUser.turmasIds || [];
        const currentEmail = (currentUser.contato || userEmail || '').toLowerCase().trim();

        filteredSheets = filteredSheets.filter((p: any) => {
          if (!assignedIds.includes(p.turma_id)) return false;
          const assignedComps = currentUser.turmaComponentes?.[p.turma_id] || [];
          const authorEmail = (p.updated_by || p.created_by || '').toLowerCase().trim();

          if (authorEmail && currentEmail && authorEmail === currentEmail) return true;
          if (assignedComps.length > 0) {
            return assignedComps.includes(p.componente);
          }
          return false;
        });
      }

      const formatted: GradeSheet[] = filteredSheets.map((p: any) => {
        const escolaObj = escolas.find(esc => esc.id === p.escola_id);
        const escolaNome = escolaObj ? escolaObj.nome : 'Unidade';
        const turmaNome = turmaMap.get(p.turma_id) || 'Turma';
        const anoSerie = turmaAnoMap.get(p.turma_id) || '';

        const authorEmail = (p.updated_by || p.created_by || '').toLowerCase().trim();
        const professorNome = coordMap.get(authorEmail) || authorEmail || '';

        return {
          id: p.id,
          escolaId: p.escola_id,
          escolaNome,
          turmaId: p.turma_id,
          turmaNome,
          anoSerie,
          componente: normalizeSubjectName(p.componente),
          bimestre: p.bimestre,
          mediaTurma: Number(p.media_turma),
          taxaAprovacao: p.taxa_aprovacao,
          students: p.students || [],
          criadoEm: p.created_at,
          createdBy: p.created_by,
          updatedBy: p.updated_by,
          professorNome
        };
      });

      setSheets(formatted);
    } catch (err) {
      console.error('Erro ao buscar pautas de notas do Supabase:', err);
      showNotification('error', 'Erro ao carregar dados do Supabase. Utilizando dados locais.');
    }
  };

  // Load from localStorage or Supabase
  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('sigar_notas_sheets');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const demoTurmas = [
            { id: 'demo-t1', name: '1º ANO A', year: '1º ANO', shift: 'MANHÃ' },
            { id: 'demo-t2', name: '2º ANO B', year: '2º ANO', shift: 'TARDE' },
            { id: 'demo-t3', name: '5º ANO A', year: '5º ANO', shift: 'MANHÃ' },
          ];
          const demoTurmaAnoMap = new Map(demoTurmas.map(t => [t.id, t.year]));
          const mapped = parsed.map((s: any) => ({
            ...s,
            anoSerie: s.anoSerie || demoTurmaAnoMap.get(s.turmaId) || ''
          }));
          setSheets(mapped);
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      if (allowedEscolas.length > 0) {
        fetchRealSheets();
      }
    }

    if (allowedEscolas.length > 0) {
      if (!selectedEscolaId || !allowedEscolas.some(e => e.id === selectedEscolaId)) {
        setSelectedEscolaId(allowedEscolas[0].id);
      }
    }
  }, [allowedEscolas, isDemoMode]);

  // Load turmas when selected school changes
  useEffect(() => {
    const fetchTurmas = async () => {
      if (!selectedEscolaId) {
        setTurmas([]);
        return;
      }

      if (isDemoMode) {
        let demoTurmas = [
          { id: 'demo-t1', name: '1º ANO A', year: '1º ANO', shift: 'MANHÃ' },
          { id: 'demo-t2', name: '2º ANO B', year: '2º ANO', shift: 'TARDE' },
          { id: 'demo-t3', name: '5º ANO A', year: '5º ANO', shift: 'MANHÃ' },
        ];
        if (currentUser && currentUser.funcao === 'Professor') {
          const assignedIds = currentUser.turmasIds || [];
          demoTurmas = demoTurmas.filter(t => assignedIds.includes(t.id));
        }
        setTurmas(demoTurmas);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('school_id', selectedEscolaId)
          .order('name');

        if (error) throw error;
        
        let filteredTurmas = data || [];
        if (currentUser && currentUser.funcao === 'Professor') {
          const assignedIds = currentUser.turmasIds || [];
          filteredTurmas = filteredTurmas.filter((t: any) => assignedIds.includes(t.id));
        }
        filteredTurmas = filteredTurmas.filter((t: any) => !isEducaInfantilYear(t.year));
        setTurmas(filteredTurmas);
      } catch (err) {
        console.error('Erro ao carregar turmas:', err);
      }
    };

    fetchTurmas();
  }, [selectedEscolaId, isDemoMode]);

  // Sync selectedAnoSerie and selectedTurmaId when turmas change
  useEffect(() => {
    if (turmas.length > 0) {
      // 1. If we are editing/loading a historical sheet, we must resolve the target class
      if (editTurmaIdRef.current) {
        const targetTurma = turmas.find(t => t.id === editTurmaIdRef.current);
        if (targetTurma) {
          if (targetTurma.year) {
            setSelectedAnoSerie(targetTurma.year);
          }
          setSelectedTurmaId(targetTurma.id);
          editTurmaIdRef.current = null;
          return;
        }
      }
      
      // 2. Normal sync: Ensure selectedAnoSerie is valid
      const years = Array.from(new Set(turmas.map(t => t.year).filter(Boolean))).sort();
      if (years.length > 0) {
        if (!years.includes(selectedAnoSerie)) {
          setSelectedAnoSerie(years[0]);
        }
      } else {
        setSelectedAnoSerie('');
      }
    } else {
      setSelectedAnoSerie('');
      setSelectedTurmaId('');
    }
  }, [turmas, selectedAnoSerie]);

  // Sync selectedTurmaId when availableTurmas changes
  useEffect(() => {
    if (editTurmaIdRef.current) return;

    if (availableTurmas.length > 0) {
      const exists = availableTurmas.some(t => t.id === selectedTurmaId);
      if (!exists) {
        setSelectedTurmaId(availableTurmas[0].id);
      }
    } else {
      setSelectedTurmaId('');
    }
  }, [availableTurmas, selectedTurmaId]);

  // Reset student load state when filters change unless editing historical sheet
  useEffect(() => {
    if (!editTurmaIdRef.current) {
      setHasLoadedStudents(false);
      setStudents([]);
      setGradesMap({});
    }
  }, [selectedEscolaId, selectedAnoSerie, selectedTurmaId, componente, bimestre]);

  const canLoadStudents = Boolean(selectedEscolaId && selectedAnoSerie && selectedTurmaId && componente && bimestre);

  const fetchStudentsAndGrades = async () => {
    if (!selectedTurmaId) {
      setStudents([]);
      setGradesMap({});
      setHasLoadedStudents(false);
      return;
    }

    setIsLoadingStudents(true);

    // Check if there is an existing saved sheet for this context
    const savedSheet = sheets.find(s => 
      s.escolaId === selectedEscolaId && 
      s.turmaId === selectedTurmaId && 
      s.componente === componente && 
      s.bimestre === bimestre
    );

    if (savedSheet) {
      // Load students and grades from the saved sheet
      const sheetStudents = savedSheet.students.map(s => ({ id: s.id, name: s.name }));
      setStudents(sheetStudents);
      
      const map: Record<string | number, {
        av1: string;
        av2: string;
        qualitativa: string;
        recuperacao: string;
        mediaFinal: number;
      }> = {};
      savedSheet.students.forEach(s => {
        map[s.id] = {
          av1: formatGradeValue(s.av1),
          av2: formatGradeValue(s.av2),
          qualitativa: formatGradeValue(s.qualitativa),
          recuperacao: formatGradeValue(s.recuperacao),
          mediaFinal: s.mediaFinal
        };
      });
      setGradesMap(map);
      setIsLoadingStudents(false);
      setHasLoadedStudents(true);
      return;
    }

    // If no saved sheet, fetch students from database/mock and initialize blank grades
    if (isDemoMode) {
      const demoStudents = [
        { id: 101, name: 'Alice Silveira Barbosa' },
        { id: 102, name: 'Arthur Gabriel Fernandes' },
        { id: 103, name: 'Beatriz Costa Rodrigues' },
        { id: 104, name: 'Caio Roberto Lima' },
        { id: 105, name: 'Eduarda Vitória Gomes' },
        { id: 106, name: 'Felipe Augusto Santos' },
        { id: 107, name: 'Giovanna Mendes Vieira' },
        { id: 108, name: 'Heitor Nogueira Lopes' },
        { id: 109, name: 'Isabela Rocha Martins' },
        { id: 110, name: 'João Pedro Oliveira' }
      ];
      setStudents(demoStudents);
      
      const map: Record<string | number, {
        av1: string;
        av2: string;
        qualitativa: string;
        recuperacao: string;
        mediaFinal: number;
      }> = {};
      demoStudents.forEach(s => {
        map[s.id] = { av1: '', av2: '', qualitativa: '', recuperacao: '', mediaFinal: 0 };
      });
      setGradesMap(map);
      setIsLoadingStudents(false);
      setHasLoadedStudents(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('class_id', selectedTurmaId)
        .order('name');

      if (error) throw error;
      setStudents(data || []);

      const map: Record<string | number, {
        av1: string;
        av2: string;
        qualitativa: string;
        recuperacao: string;
        mediaFinal: number;
      }> = {};
      (data || []).forEach((s: any) => {
        map[s.id] = { av1: '', av2: '', qualitativa: '', recuperacao: '', mediaFinal: 0 };
      });
      setGradesMap(map);
      setHasLoadedStudents(true);
    } catch (err) {
      console.error('Erro ao carregar estudantes:', err);
      showNotification('error', 'Erro ao carregar alunos.');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Calculate final average based on: (AV1 + AV2 + Qualitativa) / 3, and if recovery is higher, replace it
  const calculateFinalMedia = (av1: string, av2: string, qual: string, rec: string): number => {
    const valAv1 = parseGradeToFloat(av1);
    const valAv2 = parseGradeToFloat(av2);
    const valQual = parseGradeToFloat(qual);
    const valRec = parseGradeToFloat(rec);
    
    const numAv1 = isNaN(valAv1) ? 0 : valAv1;
    const numAv2 = isNaN(valAv2) ? 0 : valAv2;
    const numQual = isNaN(valQual) ? 0 : valQual;
    
    // Calculate simple average of the three evaluations with 2 decimal places
    const baseMedia = Number(((numAv1 + numAv2 + numQual) / 3).toFixed(2));
    
    if (!isNaN(valRec) && valRec > baseMedia) {
      return Number(Math.max(baseMedia, valRec).toFixed(2));
    }
    
    return baseMedia;
  };

  const handleGradeChange = (studentId: string | number, field: 'av1' | 'av2' | 'qualitativa' | 'recuperacao', value: string) => {
    let normalized = value.replace('.', ',');
    
    if (normalized === '') {
      updateGradeState(studentId, field, '');
      return;
    }
    
    if (normalized === ',') {
      normalized = '0,';
    }
    
    // Allow digits and at most one comma, with up to 2 decimal places
    if (!/^\d*,?\d{0,2}$/.test(normalized)) {
      return;
    }
    
    const parsed = parseFloat(normalized.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 10) {
      return;
    }
    
    updateGradeState(studentId, field, normalized);
  };

  const updateGradeState = (studentId: string | number, field: 'av1' | 'av2' | 'qualitativa' | 'recuperacao', valStr: string) => {
    setGradesMap(prev => {
      const current = prev[studentId] || { av1: '', av2: '', qualitativa: '', recuperacao: '', mediaFinal: 0 };
      const updatedField = {
        ...current,
        [field]: valStr
      };
      
      const newMedia = calculateFinalMedia(
        String(updatedField.av1),
        String(updatedField.av2),
        String(updatedField.qualitativa),
        String(updatedField.recuperacao)
      );

      return {
        ...prev,
        [studentId]: {
          ...updatedField,
          mediaFinal: newMedia
        }
      };
    });
  };

  const handleGradeBlur = (studentId: string | number, field: 'av1' | 'av2' | 'qualitativa' | 'recuperacao') => {
    setGradesMap(prev => {
      const current = prev[studentId];
      if (!current) return prev;
      
      const formatted = formatGradeValue(current[field]);
      const updatedField = {
        ...current,
        [field]: formatted
      };
      
      const newMedia = calculateFinalMedia(
        String(updatedField.av1),
        String(updatedField.av2),
        String(updatedField.qualitativa),
        String(updatedField.recuperacao)
      );

      return {
        ...prev,
        [studentId]: {
          ...updatedField,
          mediaFinal: newMedia
        }
      };
    });
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) return { mediaTurma: 0, taxaAprovacao: 0, recuperacaoCount: 0 };

    let sum = 0;
    let approved = 0;

    students.forEach(s => {
      const media = gradesMap[s.id]?.mediaFinal || 0;
      sum += media;
      if (media >= (configuracao?.nota_minima_aprovacao ?? 7.0)) {
        approved++;
      }
    });

    const mediaTurma = Number((sum / total).toFixed(2));
    const taxaAprovacao = Math.round((approved / total) * 100);
    const recuperacaoCount = total - approved;

    return { mediaTurma, taxaAprovacao, recuperacaoCount };
  }, [students, gradesMap]);

  const handleSaveGrades = async () => {
    if (students.length === 0) {
      showNotification('error', 'Não há estudantes carregados para lançar notas.');
      return;
    }

    const escolaNome = escolas.find(e => e.id === selectedEscolaId)?.nome || 'Unidade';
    const turmaObj = turmas.find(t => t.id === selectedTurmaId);
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.year} • ${turmaObj.shift || ''}` : 'Turma';
    const anoSerie = turmaObj ? (turmaObj.year || '') : '';

    const sheetStudents: StudentGrade[] = students.map(s => {
      const grade = gradesMap[s.id] || { av1: '', av2: '', qualitativa: '', recuperacao: '', mediaFinal: 0 };
      const av1Val = parseGradeToFloat(grade.av1);
      const av2Val = parseGradeToFloat(grade.av2);
      const qualVal = parseGradeToFloat(grade.qualitativa);
      const recVal = parseGradeToFloat(grade.recuperacao);
      
      return {
        id: s.id,
        name: s.name,
        av1: isNaN(av1Val) ? '' : av1Val,
        av2: isNaN(av2Val) ? '' : av2Val,
        qualitativa: isNaN(qualVal) ? '' : qualVal,
        recuperacao: isNaN(recVal) ? '' : recVal,
        mediaFinal: Number(grade.mediaFinal)
      };
    });

    const payload: GradeSheet = {
      id: crypto.randomUUID(),
      escolaId: selectedEscolaId,
      escolaNome,
      turmaId: selectedTurmaId,
      turmaNome,
      anoSerie,
      componente,
      bimestre,
      mediaTurma: stats.mediaTurma,
      taxaAprovacao: stats.taxaAprovacao,
      students: sheetStudents,
      criadoEm: new Date().toISOString()
    };

    const existingIndex = sheets.findIndex(s => 
      s.escolaId === selectedEscolaId && 
      s.turmaId === selectedTurmaId && 
      s.componente === componente && 
      s.bimestre === bimestre
    );

    if (existingIndex > -1) {
      payload.id = sheets[existingIndex].id;
    }

    if (!isDemoMode) {
      const dbPayload = {
        id: payload.id,
        escola_id: payload.escolaId,
        turma_id: payload.turmaId,
        componente: payload.componente,
        bimestre: payload.bimestre,
        media_turma: payload.mediaTurma,
        taxa_aprovacao: payload.taxaAprovacao,
        students: payload.students,
        updated_at: new Date().toISOString(),
        updated_by: userEmail || currentUser?.contato || 'user'
      };

      const { error } = await supabase
        .from('notas_sheets')
        .upsert(dbPayload);

      if (error) {
        console.error('Erro ao salvar notas no Supabase:', error);
        showNotification('error', 'Erro ao salvar a pauta de notas no banco de dados.');
        return;
      }

      if (existingIndex > -1) {
        const updated = [...sheets];
        updated[existingIndex] = payload;
        setSheets(updated);
        showNotification('success', 'Pauta de notas atualizada com sucesso no Supabase!');
        await logAudit(
          'UPDATE',
          'NOTAS',
          payload.id,
          { school: payload.escolaNome, class: payload.turmaNome, component: payload.componente, period: payload.bimestre }
        );
      } else {
        setSheets([payload, ...sheets]);
        showNotification('success', 'Notas salvas com sucesso no Supabase!');
        await logAudit(
          'CREATE',
          'NOTAS',
          payload.id,
          { school: payload.escolaNome, class: payload.turmaNome, component: payload.componente, period: payload.bimestre }
        );
      }
    } else {
      let updatedSheets: GradeSheet[];
      if (existingIndex > -1) {
        updatedSheets = [...sheets];
        updatedSheets[existingIndex] = payload;
        showNotification('success', 'Pauta de notas atualizada com sucesso!');
      } else {
        updatedSheets = [payload, ...sheets];
        showNotification('success', 'Notas salvas com sucesso!');
      }

      setSheets(updatedSheets);
      localStorage.setItem('sigar_notas_sheets', JSON.stringify(updatedSheets));
    }
  };

  const handleEditSheet = (sheet: GradeSheet) => {
    setComponente(sheet.componente);
    setBimestre(sheet.bimestre);
    if (selectedEscolaId === sheet.escolaId) {
      const targetTurma = turmas.find(t => t.id === sheet.turmaId);
      if (targetTurma && targetTurma.year) {
        setSelectedAnoSerie(targetTurma.year);
      }
      setSelectedTurmaId(sheet.turmaId);
      editTurmaIdRef.current = null;
    } else {
      editTurmaIdRef.current = sheet.turmaId;
      setSelectedEscolaId(sheet.escolaId);
    }
    setHasLoadedStudents(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrintSheet = (sheet: GradeSheet) => {
    setSelectedSheetForPrint(sheet);
    setTimeout(() => {
      window.print();
      setSelectedSheetForPrint(null);
    }, 200);
  };

  const handleDeleteSheet = async (id: string) => {
    if (!confirm('Deseja realmente remover esta pauta de notas?')) return;
    
    const sheet = sheets.find(s => s.id === id);
    const sheetDetails = sheet ? {
      school: sheet.escolaNome,
      class: sheet.turmaNome,
      component: sheet.componente,
      period: sheet.bimestre
    } : {};

    if (!isDemoMode) {
      const { error } = await supabase
        .from('notas_sheets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir pauta de notas no Supabase:', error);
        showNotification('error', 'Erro ao excluir a pauta de notas no banco de dados.');
        return;
      }
      showNotification('success', 'Pauta de notas removida do Supabase.');
      await logAudit('DELETE', 'NOTAS', id, sheetDetails);
    } else {
      showNotification('success', 'Pauta de notas removida.');
    }

    const updated = sheets.filter(s => s.id !== id);
    setSheets(updated);
    if (isDemoMode) {
      localStorage.setItem('sigar_notas_sheets', JSON.stringify(updated));
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Derived Unique Filter Options from `sheets`
  const historyOptions = useMemo(() => {
    const escolasMap = new Map<string, string>();
    const anosSet = new Set<string>();
    const turmasSet = new Set<string>();
    const componentesSet = new Set<string>();
    const bimestresSet = new Set<string>();
    const professoresSet = new Set<string>();

    sheets.forEach(s => {
      const matchEscola = !historyFilterEscola || s.escolaId === historyFilterEscola;
      const matchAno = !historyFilterAnoSerie || s.anoSerie === historyFilterAnoSerie;
      const matchTurma = !historyFilterTurma || s.turmaNome === historyFilterTurma;
      const matchComp = !historyFilterComponente || s.componente === historyFilterComponente;
      const matchBimestre = !historyFilterBimestre || s.bimestre === historyFilterBimestre;
      const matchProf = !historyFilterProfessor || s.professorNome === historyFilterProfessor || s.updatedBy === historyFilterProfessor || s.createdBy === historyFilterProfessor;

      // 1. Escolas
      if (s.escolaId && s.escolaNome) {
        if (matchAno && matchTurma && matchComp && matchBimestre && matchProf) {
          escolasMap.set(s.escolaId, s.escolaNome);
        }
      }

      // 2. Anos/Séries
      if (s.anoSerie && !isEducaInfantilYear(s.anoSerie)) {
        if (matchEscola && matchTurma && matchComp && matchBimestre && matchProf) {
          anosSet.add(s.anoSerie);
        }
      }

      // 3. Turmas
      if (s.turmaNome) {
        if (matchEscola && matchAno && matchComp && matchBimestre && matchProf) {
          turmasSet.add(s.turmaNome);
        }
      }

      // 4. Componentes (Filter out Early Childhood Campos de Experiência)
      if (s.componente && !isCampoExperienciaInfantil(s.componente)) {
        if (matchEscola && matchAno && matchTurma && matchBimestre && matchProf) {
          componentesSet.add(s.componente);
        }
      }

      // 5. Bimestres
      if (s.bimestre) {
        if (matchEscola && matchAno && matchTurma && matchComp && matchProf) {
          bimestresSet.add(s.bimestre);
        }
      }

      // 6. Professores
      if (s.professorNome) {
        if (matchEscola && matchAno && matchTurma && matchComp && matchBimestre) {
          professoresSet.add(s.professorNome);
        }
      }
    });

    const escolasList = Array.from(escolasMap.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
    const anosList = Array.from(anosSet).sort();
    const turmasList = Array.from(turmasSet).sort((a, b) => a.localeCompare(b));
    const componentesList = Array.from(componentesSet).sort((a, b) => a.localeCompare(b));
    const bimestresList = Array.from(bimestresSet).sort();
    const professoresList = Array.from(professoresSet).sort((a, b) => a.localeCompare(b));

    return {
      escolas: escolasList,
      anosSeries: anosList,
      turmas: turmasList,
      componentes: componentesList,
      bimestres: bimestresList,
      professores: professoresList
    };
  }, [sheets, historyFilterEscola, historyFilterAnoSerie, historyFilterTurma, historyFilterComponente, historyFilterBimestre, historyFilterProfessor]);

  // Reset selected filters if no longer available in filtered historyOptions
  useEffect(() => {
    if (historyFilterTurma && !historyOptions.turmas.includes(historyFilterTurma)) {
      setHistoryFilterTurma('');
    }
    if (historyFilterProfessor && !historyOptions.professores.includes(historyFilterProfessor)) {
      setHistoryFilterProfessor('');
    }
  }, [historyOptions.turmas, historyOptions.professores, historyFilterTurma, historyFilterProfessor]);

  // Filtered History Sheets
  const filteredSheetsHistory = useMemo(() => {
    return sheets.filter(s => {
      // Exclude Early Childhood Education entries from Fundamental history
      if (s.anoSerie && isEducaInfantilYear(s.anoSerie)) return false;
      if (s.componente && isCampoExperienciaInfantil(s.componente)) return false;

      if (historyFilterEscola && s.escolaId !== historyFilterEscola) return false;
      if (historyFilterAnoSerie && s.anoSerie !== historyFilterAnoSerie) return false;
      if (historyFilterTurma && s.turmaNome !== historyFilterTurma) return false;
      if (historyFilterComponente && s.componente !== historyFilterComponente) return false;
      if (historyFilterBimestre && s.bimestre !== historyFilterBimestre) return false;
      if (historyFilterProfessor && s.professorNome !== historyFilterProfessor && s.updatedBy !== historyFilterProfessor && s.createdBy !== historyFilterProfessor) return false;
      return true;
    });
  }, [sheets, historyFilterEscola, historyFilterAnoSerie, historyFilterTurma, historyFilterComponente, historyFilterBimestre, historyFilterProfessor]);

  const hasActiveHistoryFilters = Boolean(
    historyFilterEscola || historyFilterAnoSerie || historyFilterTurma || historyFilterComponente || historyFilterBimestre || historyFilterProfessor
  );

  const handleClearHistoryFilters = () => {
    setHistoryFilterEscola('');
    setHistoryFilterAnoSerie('');
    setHistoryFilterTurma('');
    setHistoryFilterComponente('');
    setHistoryFilterBimestre('');
    setHistoryFilterProfessor('');
  };

  // Pagination Math
  const totalHistoryItems = filteredSheetsHistory.length;
  const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryItems / historyItemsPerPage));
  const safeHistoryCurrentPage = Math.min(historyCurrentPage, totalHistoryPages);

  const paginatedSheetsHistory = useMemo(() => {
    const start = (safeHistoryCurrentPage - 1) * historyItemsPerPage;
    return filteredSheetsHistory.slice(start, start + historyItemsPerPage);
  }, [filteredSheetsHistory, safeHistoryCurrentPage, historyItemsPerPage]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      <PageHeader 
        title="Notas"
        subtitle="Lançamento de boletins, avaliações, recuperação e fechamento de médias"
        icon={GraduationCap}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {subHeader}

      {/* Configuration & Selection Bar */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <ListFilter className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Filtros de Lançamento</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Escola *</label>
            <SearchableSchoolSelect
              escolas={allowedEscolas}
              selectedId={selectedEscolaId}
              onChange={setSelectedEscolaId}
              inputClassName="pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ano/Série *</label>
            <select 
              value={selectedAnoSerie}
              onChange={e => setSelectedAnoSerie(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            >
              {availableAnosSeries.length === 0 ? (
                <option value="">Nenhum ano cadastrado</option>
              ) : (
                availableAnosSeries.map(a => <option key={a} value={a}>{a}</option>)
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turma *</label>
            <select 
              value={selectedTurmaId}
              onChange={e => setSelectedTurmaId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            >
              {availableTurmas.length === 0 ? (
                <option value="">Nenhuma turma cadastrada</option>
              ) : (
                availableTurmas.map(t => (
                  <option key={t.id} value={t.id}>{`${t.name || t.year} • ${t.shift || ''}`}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Componente Curricular *</label>
            <select 
              value={componente}
              onChange={e => setComponente(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            >
              {allowedComponentes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bimestre *</label>
            <select 
              value={bimestre}
              onChange={e => setBimestre(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            >
              {BIMESTRES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={() => fetchStudentsAndGrades()}
              disabled={!canLoadStudents || isLoadingStudents}
              className="w-full rounded-xl text-xs font-black py-2 bg-brand-orange hover:bg-orange-600 shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              {isLoadingStudents ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              Carregar Estudantes
            </Button>
          </div>
        </div>
      </Card>

      {/* Show placeholder if students not loaded yet */}
      {!hasLoadedStudents && (
        <Card className="bg-slate-50/50 border border-dashed border-slate-200 p-8 text-center rounded-2xl">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-600 uppercase tracking-tight">Aguardando Seleção de Filtros</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Preencha todos os campos acima (Escola, Ano/Série, Turma, Componente e Bimestre) e clique no botão <span className="font-bold text-brand-orange">"Carregar Estudantes"</span> para exibir a pauta de lançamento de notas.
          </p>
        </Card>
      )}

      {/* Grades Dashboard Summary Stats */}
      {hasLoadedStudents && students.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Média da Turma</p>
              <h3 className={`text-2xl font-black mt-1 ${stats.mediaTurma >= (configuracao?.nota_minima_aprovacao ?? 7.0) ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stats.mediaTurma.toFixed(2).replace('.', ',')}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-150 flex items-center justify-center text-slate-500 bg-slate-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </Card>

          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taxa de Aprovados (Nota &gt;= {(configuracao?.nota_minima_aprovacao ?? 7.0).toFixed(1).replace('.', ',')})</p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-2xl font-black text-emerald-600">{stats.taxaAprovacao}%</h3>
                <div className="w-20 bg-slate-100 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${stats.taxaAprovacao}%` }} />
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Award className="w-5 h-5" />
            </div>
          </Card>

          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alunos Abaixo da Média</p>
              <h3 className="text-2xl font-black text-red-500 mt-1">{stats.recuperacaoCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </Card>
        </div>
      )}

      {/* Spreadsheet Grade Card */}
      {hasLoadedStudents && selectedTurmaId && (
        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden p-0">
          {isBlocked && (
            <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-4 flex items-start gap-3 border-b border-slate-105">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase">Lançamento Bloqueado</h4>
                <p className="text-[11px] font-semibold text-amber-700 mt-0.5 leading-relaxed">
                  O período selecionado ({bimestre}) está fora do prazo letivo permitido ou foi bloqueado manualmente pela rede de ensino. Apenas a visualização está liberada.
                </p>
              </div>
            </div>
          )}
          <div className="p-4 border-b border-slate-100">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar estudante..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 outline-none text-xs font-semibold"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoadingStudents ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-brand-orange animate-spin mb-3" />
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Carregando lista de alunos...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-bold">
                Nenhum estudante encontrado para os filtros selecionados.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs table-fixed min-w-[650px]">
                <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[9px] font-black text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3 w-[40%]">Estudante</th>
                    <th className="px-3 py-3 text-center w-[12%]">Avaliação 1</th>
                    <th className="px-3 py-3 text-center w-[12%]">Avaliação 2</th>
                    <th className="px-3 py-3 text-center w-[12%]">Qualitativa</th>
                    <th className="px-3 py-3 text-center w-[12%]">Recuperação</th>
                    <th className="px-6 py-3 text-center w-[12%]">Média Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, idx) => {
                    const gradeObj = gradesMap[student.id] || { av1: '', av2: '', qualitativa: '', recuperacao: '', mediaFinal: 0 };
                    const isApproved = gradeObj.mediaFinal >= (configuracao?.nota_minima_aprovacao ?? 7.0);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-2.5">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-slate-400 w-5">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="font-bold text-slate-800 uppercase tracking-tight truncate">
                              {student.name}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-3 py-2 text-center">
                          <input 
                            type="text"
                            value={gradeObj.av1}
                            onChange={e => handleGradeChange(student.id, 'av1', e.target.value)}
                            onBlur={() => handleGradeBlur(student.id, 'av1')}
                            placeholder="0,00"
                            disabled={isBlocked}
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:border-brand-orange outline-none disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        </td>
 
                        <td className="px-3 py-2 text-center">
                          <input 
                            type="text"
                            value={gradeObj.av2}
                            onChange={e => handleGradeChange(student.id, 'av2', e.target.value)}
                            onBlur={() => handleGradeBlur(student.id, 'av2')}
                            placeholder="0,00"
                            disabled={isBlocked}
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:border-brand-orange outline-none disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        </td>
 
                        <td className="px-3 py-2 text-center">
                          <input 
                            type="text"
                            value={gradeObj.qualitativa}
                            onChange={e => handleGradeChange(student.id, 'qualitativa', e.target.value)}
                            onBlur={() => handleGradeBlur(student.id, 'qualitativa')}
                            placeholder="0,00"
                            disabled={isBlocked}
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:border-brand-orange outline-none disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        </td>
 
                        <td className="px-3 py-2 text-center">
                          <input 
                            type="text"
                            value={gradeObj.recuperacao}
                            onChange={e => handleGradeChange(student.id, 'recuperacao', e.target.value)}
                            onBlur={() => handleGradeBlur(student.id, 'recuperacao')}
                            placeholder="0,00"
                            disabled={isBlocked}
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:border-brand-orange outline-none bg-orange-50/30 disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        </td>
 
                        <td className="px-6 py-2 text-center">
                          <span className={`inline-block font-black text-sm px-2.5 py-0.5 rounded-lg
                            ${isApproved 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-100 text-red-600'}`}
                          >
                            {gradeObj.mediaFinal.toFixed(2).replace('.', ',')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <Button 
              onClick={() => setShowSaveConfirmModal(true)}
              disabled={isLoadingStudents || students.length === 0 || isBlocked}
              className="rounded-xl text-xs font-black py-2.5 bg-brand-orange hover:bg-orange-600 shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Salvar Notas
            </Button>
          </div>
        </Card>
      )}

      {/* Grade Sheets History */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Boletins e Pautas Lançadas</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Consulte e filtre as pautas de notas históricas salvas</p>
          </div>
        </div>

        {/* History Filters Card */}
        <Card className="bg-white border-slate-200 shadow-sm p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <ListFilter className="text-brand-orange w-4 h-4" />
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Filtros do Histórico</span>
            </div>
            {hasActiveHistoryFilters && (
              <button
                onClick={handleClearHistoryFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-brand-orange transition-colors"
              >
                <RotateCcw size={12} />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Escola */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Escola</label>
              <select
                value={historyFilterEscola}
                onChange={e => setHistoryFilterEscola(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
              >
                <option value="">Todas as Escolas</option>
                {historyOptions.escolas.map(e => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>

            {/* Ano/Série */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ano/Série</label>
              <select
                value={historyFilterAnoSerie}
                onChange={e => setHistoryFilterAnoSerie(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
              >
                <option value="">Todos os Anos/Séries</option>
                {historyOptions.anosSeries.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Turma */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Turma</label>
              <select
                value={historyFilterTurma}
                onChange={e => setHistoryFilterTurma(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
              >
                <option value="">Todas as Turmas</option>
                {historyOptions.turmas.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Componente Curricular */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Componente</label>
              <select
                value={historyFilterComponente}
                onChange={e => setHistoryFilterComponente(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
              >
                <option value="">Todos os Componentes</option>
                {historyOptions.componentes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Bimestre */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bimestre</label>
              <select
                value={historyFilterBimestre}
                onChange={e => setHistoryFilterBimestre(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
              >
                <option value="">Todos os Bimestres</option>
                {historyOptions.bimestres.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Professor */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Professor</label>
              <select
                value={historyFilterProfessor}
                onChange={e => setHistoryFilterProfessor(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
              >
                <option value="">Todos os Professores</option>
                {historyOptions.professores.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* History Table & Pagination */}
        <Card className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Escola</th>
                  <th className="px-6 py-4">Ano/Série</th>
                  <th className="px-6 py-4">Turma / Componente</th>
                  <th className="px-6 py-4 text-center">Período</th>
                  <th className="px-6 py-4 text-center">Média Geral</th>
                  <th className="px-6 py-4 text-center">Aprovação (%)</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSheetsHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                      {sheets.length === 0 
                        ? 'Nenhuma pauta de notas cadastrada no histórico.' 
                        : 'Nenhuma pauta encontrada com os filtros selecionados.'}
                    </td>
                  </tr>
                ) : (
                  paginatedSheetsHistory.map(sheet => (
                    <tr key={sheet.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3 font-bold text-slate-800">
                        {sheet.escolaNome}
                      </td>
                      <td className="px-6 py-3 text-slate-600 font-semibold">
                        {sheet.anoSerie || '-'}
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{sheet.turmaNome}</div>
                        <div className="text-[10px] text-brand-orange font-bold uppercase mt-0.5">
                          {sheet.componente}
                        </div>
                        {sheet.professorNome && (
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                            <span>Prof:</span>
                            <span className="font-semibold text-slate-600 truncate max-w-[170px]" title={sheet.professorNome}>
                              {sheet.professorNome}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center font-bold text-slate-600">
                        {sheet.bimestre}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-block font-black text-xs px-2.5 py-0.5 rounded-full
                          ${sheet.mediaTurma >= (configuracao?.nota_minima_aprovacao ?? 7.0) ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'}`}
                        >
                          {Number(sheet.mediaTurma).toFixed(2).replace('.', ',')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700">
                          <span>{sheet.taxaAprovacao}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handlePrintSheet(sheet)} 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" 
                            title="Imprimir Boletim"
                          >
                            <Printer size={15} />
                          </button>
                          <button 
                            onClick={() => handleEditSheet(sheet)} 
                            className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-all" 
                            title="Editar Notas"
                          >
                            <Edit size={15} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSheet(sheet.id)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                            title="Remover Pauta"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalHistoryItems > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
              <div>
                Mostrando{' '}
                <span className="font-bold text-slate-800">
                  {Math.min((safeHistoryCurrentPage - 1) * historyItemsPerPage + 1, totalHistoryItems)}
                </span>{' '}
                a{' '}
                <span className="font-bold text-slate-800">
                  {Math.min(safeHistoryCurrentPage * historyItemsPerPage, totalHistoryItems)}
                </span>{' '}
                de <span className="font-bold text-slate-800">{totalHistoryItems}</span> pautas lançadas
              </div>

              <div className="flex items-center gap-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Exibir:</span>
                  <select
                    value={historyItemsPerPage}
                    onChange={e => setHistoryItemsPerPage(Number(e.target.value))}
                    className="px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none text-xs font-bold text-slate-700 focus:border-brand-orange transition-all"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Page Navigation Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setHistoryCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={safeHistoryCurrentPage === 1}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                    title="Página Anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="px-2 text-xs font-bold text-slate-700">
                    {safeHistoryCurrentPage} / {totalHistoryPages}
                  </span>

                  <button
                    onClick={() => setHistoryCurrentPage(prev => Math.min(totalHistoryPages, prev + 1))}
                    disabled={safeHistoryCurrentPage === totalHistoryPages}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                    title="Próxima Página"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {selectedSheetForPrint && (
        <PrintableBoletim sheet={selectedSheetForPrint} />
      )}

      {/* Confirm Save Grades Modal */}
      <ConfirmModal 
        isOpen={showSaveConfirmModal}
        onClose={() => setShowSaveConfirmModal(false)}
        onConfirm={async () => {
          setShowSaveConfirmModal(false);
          await handleSaveGrades();
          setShowSaveSuccessModal(true);
        }}
        title="Confirmar Lançamento de Notas"
        message="Deseja realmente salvar as notas lançadas para esta turma?"
        icon={GraduationCap}
        variant="warning"
        confirmText="Salvar Notas"
        cancelText="Cancelar"
        showCancel={true}
      />

      {/* Success Modal */}
      <ConfirmModal 
        isOpen={showSaveSuccessModal}
        onClose={() => setShowSaveSuccessModal(false)}
        onConfirm={() => setShowSaveSuccessModal(false)}
        title="Sucesso!"
        message="Dados salvos com sucesso!"
        icon={CheckCircle}
        variant="success"
        confirmText="OK"
        showCancel={false}
      />
    </div>
  );
};
