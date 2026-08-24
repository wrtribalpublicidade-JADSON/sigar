import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ConfirmModal } from './ui/ConfirmModal';
import { 
  ClipboardCheck, Calendar, School as SchoolIcon, Search, Save, CheckCircle, 
  XCircle, Percent, Users, Loader2, ListFilter, Trash2, AlertTriangle, RotateCcw,
  Printer, Edit, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Escola, Coordenador } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';
import { useConfiguracao } from '../context/ConfiguracaoContext';
import { SearchableSchoolSelect } from './ui/SearchableSchoolSelect';
import { isEducaInfantilYear, isCampoExperienciaInfantil, normalizeSubjectName } from '../utils';
import { PrintableFrequencia } from './PrintableFrequencia';
import { logAudit } from '../services/logService';

interface FrequenciaProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
  subHeader?: React.ReactNode;
}

interface StudentAttendance {
  id: string | number;
  name: string;
  present: boolean;
}

interface AttendanceSheet {
  id: string;
  data: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  anoSerie?: string;
  componente: string;
  bimestre?: string;
  presentesCount: number;
  totalCount: number;
  rate: number;
  students: StudentAttendance[];
  criadoEm: string;
  professor?: string;
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

export const Frequencia: React.FC<FrequenciaProps> = ({ escolas, isDemoMode, isAdmin, userEmail, currentUser, subHeader }) => {
  const { configuracao, isDataBloqueada } = useConfiguracao();
  const { showNotification } = useNotification();
  const [sheets, setSheets] = useState<AttendanceSheet[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string | number, boolean>>({});
  const [selectedSheetForPrint, setSelectedSheetForPrint] = useState<AttendanceSheet | null>(null);
  const [editingSheet, setEditingSheet] = useState<AttendanceSheet | null>(null);

  // Filter & Context State
  const [dataFreq, setDataFreq] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedAnoSerie, setSelectedAnoSerie] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [componente, setComponente] = useState(COMPONENTES[0]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [hasLoadedStudents, setHasLoadedStudents] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const isBlocked = isDataBloqueada(dataFreq, currentUser?.funcao);

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

  // Search & History Filter States
  const [studentSearch, setStudentSearch] = useState('');
  const [historyFilterEscola, setHistoryFilterEscola] = useState('');
  const [historyFilterAnoSerie, setHistoryFilterAnoSerie] = useState('');
  const [historyFilterTurma, setHistoryFilterTurma] = useState('');
  const [historyFilterComponente, setHistoryFilterComponente] = useState('');
  const [historyFilterBimestre, setHistoryFilterBimestre] = useState('');
  const [historyFilterProfessor, setHistoryFilterProfessor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [coordenadoresList, setCoordenadoresList] = useState<any[]>([]);

  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);

  // Reset page to 1 whenever any history filter, search term or items-per-page changes
  useEffect(() => {
    setHistoryCurrentPage(1);
  }, [
    historyFilterEscola,
    historyFilterAnoSerie,
    historyFilterTurma,
    historyFilterComponente,
    historyFilterBimestre,
    historyFilterProfessor,
    searchTerm,
    historyItemsPerPage
  ]);

  // Fetch team / coordinators to resolve emails to teacher names
  useEffect(() => {
    const fetchCoordenadores = async () => {
      try {
        const { data, error } = await supabase
          .from('coordenadores')
          .select('contato, nome')
          .range(0, 4999);
        if (!error && data) {
          setCoordenadoresList(data);
        }
      } catch (err) {
        console.error('Erro ao carregar coordenadores em Frequencia:', err);
      }
    };
    fetchCoordenadores();
  }, []);

  const coordMap = useMemo(() => {
    const map = new Map<string, string>();
    if (coordenadoresList && coordenadoresList.length > 0) {
      coordenadoresList.forEach((c: any) => {
        if (c.contato && c.nome) {
          map.set(c.contato.toLowerCase().trim(), c.nome.trim());
        }
      });
    }
    if (currentUser) {
      if (currentUser.contato && currentUser.nome) {
        map.set(currentUser.contato.toLowerCase().trim(), currentUser.nome.trim());
      }
      if ((currentUser as any).email && currentUser.nome) {
        map.set(((currentUser as any).email as string).toLowerCase().trim(), currentUser.nome.trim());
      }
    }
    return map;
  }, [coordenadoresList, currentUser]);

  const getTeacherName = (emailOrName: string | undefined): string => {
    if (!emailOrName) return '---';
    const lower = emailOrName.toLowerCase().trim();
    if (coordMap.has(lower)) {
      return coordMap.get(lower)!;
    }
    if (!emailOrName.includes('@')) return emailOrName;

    const username = emailOrName.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  const fetchRealSheets = async () => {
    setIsLoadingSheets(true);
    try {
      let allSheetsData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('frequencia_sheets')
          .select('*')
          .or('ativo.eq.true,ativo.is.null')
          .order('data', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
          allSheetsData = allSheetsData.concat(data);
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      // Also get turmas to map names
      const { data: allTurmas, error: turmasError } = await supabase
        .from('turmas')
        .select('id, name, year, shift')
        .range(0, 4999);
      
      const turmaMap = new Map<string, string>();
      const turmaAnoMap = new Map<string, string>();
      if (!turmasError && allTurmas) {
        allTurmas.forEach((t: any) => {
          turmaMap.set(String(t.id), `${t.name || t.year} • ${t.shift || ''}`);
          turmaAnoMap.set(String(t.id), t.year || '');
        });
      }

      let filteredSheets = allSheetsData;
      // Filter out Early Childhood Education entries (ECE stages and Campos de Experiência)
      filteredSheets = filteredSheets.filter((p: any) => {
        if (p.componente && isCampoExperienciaInfantil(p.componente)) return false;
        const anoSerie = turmaAnoMap.get(String(p.turma_id)) || p.ano_serie || '';
        if (anoSerie && isEducaInfantilYear(anoSerie)) return false;
        return true;
      });

      if (!isAdmin && currentUser && currentUser.funcao !== 'Administrador') {
        const userSchoolIds = (currentUser?.escolasIds || []).map(String);
        if (userSchoolIds.length > 0) {
          filteredSheets = filteredSheets.filter((p: any) => userSchoolIds.includes(String(p.escola_id)));
        }
      }
      if (currentUser && currentUser.funcao === 'Professor') {
        const assignedIds = (currentUser.turmasIds || []).map(String);
        const currentEmail = (currentUser.contato || userEmail || '').toLowerCase().trim();

        filteredSheets = filteredSheets.filter((p: any) => {
          const authorEmail = (p.updated_by || p.created_by || '').toLowerCase().trim();
          if (authorEmail && currentEmail && authorEmail === currentEmail) return true;
          if (assignedIds.length > 0 && !assignedIds.includes(String(p.turma_id))) return false;

          const assignedComps = currentUser.turmaComponentes?.[p.turma_id] || currentUser.turmaComponentes?.[String(p.turma_id)] || [];
          if (assignedComps.length > 0) {
            const normPComp = normalizeSubjectName(p.componente);
            return assignedComps.some((c: string) => normalizeSubjectName(c) === normPComp);
          }
          return true;
        });
      }

      const formatted: AttendanceSheet[] = filteredSheets.map((p: any) => {
        const escolaObj = escolas.find(esc => esc.id === p.escola_id);
        const escolaNome = escolaObj ? escolaObj.nome : 'Unidade';
        const turmaNome = turmaMap.get(String(p.turma_id)) || 'Turma';
        const anoSerie = turmaAnoMap.get(String(p.turma_id)) || p.ano_serie || '';
        const professor = p.professor || p.updated_by || p.created_by || p.responsavel || '';

        return {
          id: p.id,
          data: p.data,
          escolaId: p.escola_id,
          escolaNome,
          turmaId: p.turma_id,
          turmaNome,
          anoSerie,
          componente: normalizeSubjectName(p.componente),
          bimestre: p.bimestre || p.periodo || '',
          presentesCount: p.presentes_count,
          totalCount: p.total_count,
          rate: p.rate,
          students: p.students || [],
          criadoEm: p.created_at,
          professor
        };
      });

      setSheets(formatted);
    } catch (err) {
      console.error('Erro ao buscar pautas de frequência do Supabase:', err);
      showNotification('error', 'Erro ao carregar dados do Supabase. Utilizando dados locais.');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Load from localStorage or Supabase & Set default school
  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('sigar_frequencia_sheets');
      if (saved) {
        try {
          setSheets(JSON.parse(saved));
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
        let mockTurmas = [
          { id: 'demo-t1', name: '1º ANO A', year: '1º ANO', shift: 'MANHÃ' },
          { id: 'demo-t2', name: '2º ANO B', year: '2º ANO', shift: 'TARDE' },
          { id: 'demo-t3', name: '5º ANO A', year: '5º ANO', shift: 'MANHÃ' },
        ];
        if (currentUser && currentUser.funcao === 'Professor') {
          const assignedIds = currentUser.turmasIds || [];
          mockTurmas = mockTurmas.filter(t => assignedIds.includes(t.id));
        }
        setTurmas(mockTurmas);
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

  // Sync selectedAnoSerie when availableAnosSeries changes
  useEffect(() => {
    if (availableAnosSeries.length > 0) {
      if (!availableAnosSeries.includes(selectedAnoSerie) && !editingSheet) {
        setSelectedAnoSerie(availableAnosSeries[0]);
      }
    } else if (!editingSheet) {
      setSelectedAnoSerie('');
    }
  }, [availableAnosSeries, selectedAnoSerie, editingSheet]);

  // Sync selectedTurmaId when availableTurmas changes
  useEffect(() => {
    if (availableTurmas.length > 0) {
      const exists = availableTurmas.some(t => t.id === selectedTurmaId);
      if (!exists && !editingSheet) {
        setSelectedTurmaId(availableTurmas[0].id);
      }
    } else if (!editingSheet) {
      setSelectedTurmaId('');
    }
  }, [availableTurmas, selectedTurmaId, editingSheet]);

  // Reset student load state when filters change unless editing sheet
  useEffect(() => {
    if (!editingSheet) {
      setHasLoadedStudents(false);
      setStudents([]);
      setAttendanceMap({});
    }
  }, [selectedEscolaId, selectedAnoSerie, selectedTurmaId, componente, dataFreq]);

  const canLoadStudents = Boolean(dataFreq && selectedEscolaId && selectedAnoSerie && selectedTurmaId && componente);

  const fetchStudents = async () => {
    if (!selectedTurmaId) {
      setStudents([]);
      setAttendanceMap({});
      setHasLoadedStudents(false);
      return;
    }

    setIsLoadingStudents(true);

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
      
      const initialMap: Record<string | number, boolean> = {};
      const sheetStudentsMap = new Map<string, boolean>();
      if (editingSheet && editingSheet.turmaId === selectedTurmaId) {
        (editingSheet.students || []).forEach(st => {
          sheetStudentsMap.set(String(st.id), st.present);
        });
      }

      demoStudents.forEach(s => {
        const sIdStr = String(s.id);
        if (editingSheet && editingSheet.turmaId === selectedTurmaId && sheetStudentsMap.has(sIdStr)) {
          initialMap[s.id] = sheetStudentsMap.get(sIdStr)!;
        } else {
          initialMap[s.id] = true;
        }
      });
      setAttendanceMap(initialMap);
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
      const loadedStudents = data || [];
      setStudents(loadedStudents);
      
      const initialMap: Record<string | number, boolean> = {};
      const sheetStudentsMap = new Map<string, boolean>();
      if (editingSheet && editingSheet.turmaId === selectedTurmaId) {
        (editingSheet.students || []).forEach(st => {
          sheetStudentsMap.set(String(st.id), st.present);
        });
      }

      loadedStudents.forEach((s: any) => {
        const sIdStr = String(s.id);
        if (editingSheet && editingSheet.turmaId === selectedTurmaId && sheetStudentsMap.has(sIdStr)) {
          initialMap[s.id] = sheetStudentsMap.get(sIdStr)!;
        } else {
          initialMap[s.id] = true; // Default to present
        }
      });
      setAttendanceMap(initialMap);
      setHasLoadedStudents(true);
    } catch (err) {
      console.error('Erro ao carregar estudantes:', err);
      showNotification('error', 'Erro ao carregar alunos.');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleToggleAttendance = (studentId: string | number) => {
    if (isBlocked) return;
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleMarkAll = (present: boolean) => {
    if (isBlocked) return;
    const updatedMap: Record<string | number, boolean> = {};
    students.forEach(s => {
      updatedMap[s.id] = present;
    });
    setAttendanceMap(updatedMap);
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) return { total: 0, presents: 0, absents: 0, rate: 0 };

    const presents = Object.values(attendanceMap).filter(val => val === true).length;
    const absents = total - presents;
    const rate = Math.round((presents / total) * 100);

    return { total, presents, absents, rate };
  }, [students, attendanceMap]);

  const handleSaveSheet = async () => {
    if (students.length === 0) {
      showNotification('error', 'Não há estudantes carregados para registrar a frequência.');
      return;
    }

    const escolaNome = escolas.find(e => e.id === selectedEscolaId)?.nome || 'Unidade';
    const turmaObj = turmas.find(t => t.id === selectedTurmaId);
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.year} • ${turmaObj.shift || ''}` : 'Turma';

    const sheetStudents: StudentAttendance[] = students.map(s => ({
      id: s.id,
      name: s.name,
      present: attendanceMap[s.id] ?? true
    }));

    const payload: AttendanceSheet = {
      id: crypto.randomUUID(),
      data: dataFreq,
      escolaId: selectedEscolaId,
      escolaNome,
      turmaId: selectedTurmaId,
      turmaNome,
      componente,
      presentesCount: stats.presents,
      totalCount: stats.total,
      rate: stats.rate,
      students: sheetStudents,
      criadoEm: new Date().toISOString()
    };

    // Check if there is already a sheet for this class, date and component
    const existingIndex = sheets.findIndex(s => s.data === dataFreq && s.turmaId === selectedTurmaId && s.componente === componente);
    
    if (existingIndex > -1) {
      if (!confirm('Já existe uma chamada salva para esta turma, data e componente. Deseja sobrescrever os dados?')) return;
      
      // Keep same ID for primary key upsert
      payload.id = sheets[existingIndex].id;
    }

    if (!isDemoMode) {
      const dbPayload = {
        id: payload.id,
        data: payload.data,
        escola_id: payload.escolaId,
        turma_id: payload.turmaId,
        componente: payload.componente,
        presentes_count: payload.presentesCount,
        total_count: payload.totalCount,
        rate: payload.rate,
        students: payload.students,
        updated_at: new Date().toISOString(),
        updated_by: userEmail || currentUser?.contato || 'user'
      };

      const { error } = await supabase
        .from('frequencia_sheets')
        .upsert(dbPayload);

      if (error) {
        console.error('Erro ao salvar chamada no Supabase:', error);
        showNotification('error', 'Erro ao salvar a chamada no banco de dados.');
        return;
      }

      if (existingIndex > -1) {
        const updated = [...sheets];
        updated[existingIndex] = payload;
        setSheets(updated);
        showNotification('success', 'Chamada atualizada com sucesso no Supabase!');
      } else {
        setSheets([payload, ...sheets]);
        showNotification('success', 'Frequência registrada com sucesso no Supabase!');
      }
    } else {
      let updatedSheets: AttendanceSheet[];
      if (existingIndex > -1) {
        updatedSheets = [...sheets];
        updatedSheets[existingIndex] = payload;
        showNotification('success', 'Chamada atualizada com sucesso!');
      } else {
        updatedSheets = [payload, ...sheets];
        showNotification('success', 'Frequência registrada com sucesso!');
      }

      setSheets(updatedSheets);
      localStorage.setItem('sigar_frequencia_sheets', JSON.stringify(updatedSheets));
    }

    await logAudit(
      existingIndex > -1 ? 'UPDATE' : 'CREATE',
      'FREQUENCIA',
      payload.id,
      {
        data: payload.data,
        escola: payload.escolaNome,
        turma: payload.turmaNome,
        componente: payload.componente,
        presentes: payload.presentesCount,
        total: payload.totalCount,
        taxa: payload.rate
      }
    );

    setEditingSheet(null);
  };

  const handlePrintSheet = (sheet: AttendanceSheet) => {
    setSelectedSheetForPrint(sheet);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleEditSheet = (sheet: AttendanceSheet) => {
    setEditingSheet(sheet);
    if (sheet.data) setDataFreq(sheet.data);
    if (sheet.escolaId) setSelectedEscolaId(sheet.escolaId);
    if (sheet.anoSerie) setSelectedAnoSerie(sheet.anoSerie);
    if (sheet.turmaId) setSelectedTurmaId(sheet.turmaId);
    if (sheet.componente) setComponente(sheet.componente);

    setHasLoadedStudents(true);
    showNotification('success', `Chamada da turma ${sheet.turmaNome} (${sheet.data}) carregada no formulário para edição.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSheet = async (id: string) => {
    if (!confirm('Deseja realmente remover esta folha de frequência?')) return;
    
    if (!isDemoMode) {
      const { error } = await supabase
        .from('frequencia_sheets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir chamada no Supabase:', error);
        showNotification('error', 'Erro ao excluir a chamada no banco de dados.');
        return;
      }
      showNotification('success', 'Registro de chamada removido do Supabase.');
    } else {
      showNotification('success', 'Registro de chamada removido.');
    }

    const sheetToDelete = sheets.find(s => s.id === id);
    const updated = sheets.filter(s => s.id !== id);
    setSheets(updated);
    if (isDemoMode) {
      localStorage.setItem('sigar_frequencia_sheets', JSON.stringify(updated));
    }

    if (sheetToDelete) {
      await logAudit('DELETE', 'FREQUENCIA', id, {
        data: sheetToDelete.data,
        turma: sheetToDelete.turmaNome,
        componente: sheetToDelete.componente,
        escola: sheetToDelete.escolaNome
      });
    }
  };

  // Compute options for history filters dynamically (Matching Notas.tsx & AulasMinistradas.tsx)
  const historyOptions = useMemo(() => {
    const escolasMap = new Map<string, string>();
    const anosSet = new Set<string>();
    const turmasSet = new Set<string>();
    const componentesSet = new Set<string>();
    const bimestresSet = new Set<string>();
    const professoresSet = new Set<string>();

    sheets.forEach(sheet => {
      const matchEscola = !historyFilterEscola || sheet.escolaId === historyFilterEscola;
      const matchAno = !historyFilterAnoSerie || sheet.anoSerie === historyFilterAnoSerie;
      const matchTurma = !historyFilterTurma || sheet.turmaNome === historyFilterTurma;
      const matchComp = !historyFilterComponente || sheet.componente === historyFilterComponente;
      const matchBimestre = !historyFilterBimestre || sheet.bimestre === historyFilterBimestre;
      const profName = getTeacherName(sheet.professor);
      const matchProf = !historyFilterProfessor || profName === historyFilterProfessor;

      // 1. Escolas
      if (sheet.escolaId && sheet.escolaNome) {
        if (matchAno && matchTurma && matchComp && matchBimestre && matchProf) {
          escolasMap.set(sheet.escolaId, sheet.escolaNome);
        }
      }

      // 2. Anos/Séries (Filter out Early Childhood Education)
      if (sheet.anoSerie && !isEducaInfantilYear(sheet.anoSerie) && sheet.anoSerie !== 'Outros') {
        if (matchEscola && matchTurma && matchComp && matchBimestre && matchProf) {
          anosSet.add(sheet.anoSerie);
        }
      }

      // 3. Turmas
      if (sheet.turmaNome) {
        if (matchEscola && matchAno && matchComp && matchBimestre && matchProf) {
          turmasSet.add(sheet.turmaNome);
        }
      }

      // 4. Componentes (Filter out Early Childhood Campos de Experiência)
      if (sheet.componente && !isCampoExperienciaInfantil(sheet.componente)) {
        if (matchEscola && matchAno && matchTurma && matchBimestre && matchProf) {
          componentesSet.add(sheet.componente);
        }
      }

      // 5. Bimestres
      if (sheet.bimestre) {
        if (matchEscola && matchAno && matchTurma && matchComp && matchProf) {
          bimestresSet.add(sheet.bimestre);
        }
      }

      // 6. Professores
      if (profName && profName !== '---') {
        if (matchEscola && matchAno && matchTurma && matchComp && matchBimestre) {
          professoresSet.add(profName);
        }
      }
    });

    escolas.forEach(e => escolasMap.set(e.id, e.nome));
    
    if (anosSet.size === 0) {
      ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', 'EJA - 1º Segmento', 'EJA - 2º Segmento'].forEach(a => anosSet.add(a));
    }

    if (componentesSet.size === 0) {
      COMPONENTES.forEach(c => componentesSet.add(c));
    }

    if (bimestresSet.size === 0) {
      ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre', 'Anual'].forEach(b => bimestresSet.add(b));
    }

    if (professoresSet.size === 0 && currentUser?.nome) {
      professoresSet.add(currentUser.nome);
    }

    return {
      escolas: Array.from(escolasMap.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome)),
      anosSeries: Array.from(anosSet).sort(),
      turmas: Array.from(turmasSet).sort((a, b) => a.localeCompare(b)),
      componentes: Array.from(componentesSet).sort((a, b) => a.localeCompare(b)),
      bimestres: Array.from(bimestresSet).sort(),
      professores: Array.from(professoresSet).sort((a, b) => a.localeCompare(b))
    };
  }, [
    sheets, 
    escolas, 
    currentUser, 
    coordMap,
    historyFilterEscola, 
    historyFilterAnoSerie, 
    historyFilterTurma, 
    historyFilterComponente, 
    historyFilterBimestre, 
    historyFilterProfessor
  ]);

  const hasActiveHistoryFilters = useMemo(() => {
    return Boolean(
      historyFilterEscola ||
      historyFilterAnoSerie ||
      historyFilterTurma ||
      historyFilterComponente ||
      historyFilterBimestre ||
      historyFilterProfessor ||
      searchTerm
    );
  }, [
    historyFilterEscola,
    historyFilterAnoSerie,
    historyFilterTurma,
    historyFilterComponente,
    historyFilterBimestre,
    historyFilterProfessor,
    searchTerm
  ]);

  const handleClearHistoryFilters = () => {
    setHistoryFilterEscola('');
    setHistoryFilterAnoSerie('');
    setHistoryFilterTurma('');
    setHistoryFilterComponente('');
    setHistoryFilterBimestre('');
    setHistoryFilterProfessor('');
    setSearchTerm('');
  };

  const filteredSheets = useMemo(() => {
    return sheets.filter(sheet => {
      // Exclude Early Childhood Education entries from Fundamental history
      if (sheet.anoSerie && isEducaInfantilYear(sheet.anoSerie)) return false;
      if (sheet.componente && isCampoExperienciaInfantil(sheet.componente)) return false;

      const matchesSearch = !searchTerm || 
        sheet.componente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sheet.turmaNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sheet.escolaNome.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEscola = !historyFilterEscola || sheet.escolaId === historyFilterEscola;

      const matchesAnoSerie = !historyFilterAnoSerie || 
        (sheet.anoSerie && sheet.anoSerie === historyFilterAnoSerie) || 
        (sheet.anoSerie && sheet.anoSerie.toLowerCase().includes(historyFilterAnoSerie.toLowerCase()));

      const matchesTurma = !historyFilterTurma || 
        sheet.turmaNome === historyFilterTurma || 
        sheet.turmaNome.toLowerCase().includes(historyFilterTurma.toLowerCase()) || 
        sheet.turmaId === historyFilterTurma;

      const matchesComponente = !historyFilterComponente || 
        sheet.componente.toLowerCase() === historyFilterComponente.toLowerCase();

      const matchesBimestre = !historyFilterBimestre || 
        (sheet.bimestre && sheet.bimestre.toLowerCase() === historyFilterBimestre.toLowerCase());

      const profName = getTeacherName(sheet.professor);
      const matchesProfessor = !historyFilterProfessor || 
        profName.toLowerCase() === historyFilterProfessor.toLowerCase() ||
        (sheet.professor && sheet.professor.toLowerCase() === historyFilterProfessor.toLowerCase());

      return matchesSearch && matchesEscola && matchesAnoSerie && matchesTurma && matchesComponente && matchesBimestre && matchesProfessor;
    });
  }, [
    sheets,
    searchTerm,
    historyFilterEscola,
    historyFilterAnoSerie,
    historyFilterTurma,
    historyFilterComponente,
    historyFilterBimestre,
    historyFilterProfessor,
    coordMap
  ]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Pagination Math
  const totalHistoryItems = filteredSheets.length;
  const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryItems / historyItemsPerPage));
  const safeHistoryCurrentPage = Math.min(historyCurrentPage, totalHistoryPages);

  const paginatedSheetsHistory = useMemo(() => {
    const start = (safeHistoryCurrentPage - 1) * historyItemsPerPage;
    return filteredSheets.slice(start, start + historyItemsPerPage);
  }, [filteredSheets, safeHistoryCurrentPage, historyItemsPerPage]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      <PageHeader 
        title="Frequência"
        subtitle="Registro de chamada diária e taxa de assiduidade escolar"
        icon={ClipboardCheck}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {subHeader}

      {/* Configuration & Selection Bar */}
      {editingSheet && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs font-bold text-amber-900 shadow-sm">
          <div className="flex items-center gap-2">
            <Edit className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Modo de Edição Ativo: Editando chamada da turma <strong>{editingSheet.turmaNome}</strong> referente a <strong>{new Date(editingSheet.data + 'T12:00:00').toLocaleDateString()}</strong>.
            </span>
          </div>
          <Button 
            onClick={() => setEditingSheet(null)}
            className="bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0"
          >
            Cancelar Edição
          </Button>
        </div>
      )}

      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <ListFilter className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Seleção de Turma e Período</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data da Chamada *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="date" 
                value={dataFreq}
                onChange={e => setDataFreq(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              />
            </div>
          </div>

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

          <div className="flex items-end">
            <Button 
              onClick={() => fetchStudents()}
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
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-600 uppercase tracking-tight">Aguardando Seleção de Filtros</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Preencha todos os campos acima (Data, Escola, Ano/Série, Turma e Componente) e clique no botão <span className="font-bold text-brand-orange">"Carregar Estudantes"</span> para exibir a lista de presença.
          </p>
        </Card>
      )}

      {/* Stats Summary cards */}
      {hasLoadedStudents && students.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Alunos</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
              <Users className="w-5 h-5" />
            </div>
          </Card>

          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Presentes</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.presents}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
          </Card>

          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Ausentes</p>
              <h3 className="text-2xl font-black text-red-500 mt-1">{stats.absents}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-400">
              <XCircle className="w-5 h-5" />
            </div>
          </Card>

          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-brand-orange uppercase tracking-wider">Frequência da Aula</p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-2xl font-black text-brand-orange">{stats.rate}%</h3>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-brand-orange h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.rate}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-brand-orange shrink-0 ml-2">
              <Percent className="w-5 h-5" />
            </div>
          </Card>
        </div>
      )}

      {/* Student List Sheet & Quick Action buttons */}
      {hasLoadedStudents && selectedTurmaId && (
        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden p-0">
          {isBlocked && (
            <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-4 flex items-start gap-3 border-b border-slate-100">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase">Lançamento Bloqueado</h4>
                <p className="text-[11px] font-semibold text-amber-700 mt-0.5 leading-relaxed">
                  A data selecionada ({new Date(dataFreq + 'T12:00:00').toLocaleDateString('pt-BR')}) está fora do período letivo permitido ou foi bloqueada manualmente pela rede de ensino. Apenas a visualização está liberada.
                </p>
              </div>
            </div>
          )}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar estudante..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 outline-none text-xs font-semibold"
              />
            </div>

            <div className="flex gap-2 shrink-0">
              <Button 
                variant="secondary" 
                onClick={() => handleMarkAll(true)}
                disabled={isBlocked}
                className="rounded-xl text-[10px] font-bold py-1.5 px-3 uppercase bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
              >
                Presente Todos
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleMarkAll(false)}
                disabled={isBlocked}
                className="rounded-xl text-[10px] font-bold py-1.5 px-3 uppercase bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
              >
                Ausente Todos
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[450px]">
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
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[9px] font-black text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Número / Nome</th>
                    <th className="px-6 py-3 text-center w-40">Status de Presença</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, idx) => {
                    const isPresent = attendanceMap[student.id] ?? true;
                    return (
                      <tr 
                        key={student.id} 
                        className={`transition-colors hover:bg-slate-50/50 cursor-pointer ${isPresent ? '' : 'bg-red-50/10'}`}
                        onClick={() => !isBlocked && handleToggleAttendance(student.id)}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 w-5">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="font-bold text-slate-800 uppercase tracking-tight">
                              {student.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <div className="inline-flex items-center">
                            <button
                              onClick={() => handleToggleAttendance(student.id)}
                              className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none
                                ${isPresent ? 'bg-emerald-500' : 'bg-red-500'}`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                  ${isPresent ? 'translate-x-6' : 'translate-x-0'}`}
                              />
                            </button>
                            <span className={`text-[10px] font-black uppercase tracking-wider ml-2.5 w-12 text-left
                              ${isPresent ? 'text-emerald-600' : 'text-red-500'}`}
                            >
                              {isPresent ? 'Pres' : 'Falt'}
                            </span>
                          </div>
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
              Salvar Chamada
            </Button>
          </div>
        </Card>
      )}

      {/* Saved Sheets History */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Histórico de Chamadas Registradas</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Histórico de pautas de frequências salvas no sistema</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por turma, escola..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-brand-orange transition-all text-xs font-semibold"
            />
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

            {/* Componente */}
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

        <Card className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Data / Escola</th>
                  <th className="px-6 py-4">Turma / Componente</th>
                  <th className="px-6 py-4 text-center">Frequência</th>
                  <th className="px-6 py-4 text-center">Presentes / Total</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingSheets ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-6 h-6 text-brand-orange animate-spin mb-2" />
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Carregando histórico completo de chamadas...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSheets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                      Nenhum registro de frequência salvo no histórico.
                    </td>
                  </tr>
                ) : (
                  paginatedSheetsHistory.map(sheet => (
                    <tr key={sheet.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-800">
                          {new Date(sheet.data + 'T12:00:00').toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight truncate max-w-[200px]">
                          {sheet.escolaNome}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{sheet.turmaNome}</div>
                        <div className="text-[10px] text-brand-orange font-bold uppercase mt-0.5">
                          {sheet.componente}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-block font-black px-2.5 py-0.5 rounded-full text-[10px]
                          ${sheet.rate >= 90 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : sheet.rate >= 75 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-red-50 text-red-500'}`}
                        >
                          {sheet.rate}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center font-semibold text-slate-600">
                        {sheet.presentesCount} / {sheet.totalCount}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handlePrintSheet(sheet)} 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" 
                            title="Imprimir Relatório de Frequência"
                          >
                            <Printer size={15} />
                          </button>
                          <button 
                            onClick={() => handleEditSheet(sheet)} 
                            className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-all" 
                            title="Editar Chamada"
                          >
                            <Edit size={15} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSheet(sheet.id)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                            title="Excluir Registro"
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

          {/* Pagination Bar Footer */}
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
                de <span className="font-bold text-slate-800">{totalHistoryItems}</span> chamadas registradas
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

      {/* Printable Report Portal Component */}
      <PrintableFrequencia sheet={selectedSheetForPrint} />

      {/* Confirm Save Attendance Modal */}
      <ConfirmModal 
        isOpen={showSaveConfirmModal}
        onClose={() => setShowSaveConfirmModal(false)}
        onConfirm={async () => {
          setShowSaveConfirmModal(false);
          await handleSaveSheet();
          setShowSaveSuccessModal(true);
        }}
        title="Confirmar Registro de Chamada"
        message="Deseja realmente salvar a pauta de frequência com as marcações de presença/falta atuais?"
        icon={ClipboardCheck}
        variant="warning"
        confirmText="Salvar Chamada"
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
