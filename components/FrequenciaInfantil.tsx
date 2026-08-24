import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  ClipboardCheck, Calendar, School as SchoolIcon, Search, Save, CheckCircle, 
  XCircle, Percent, Users, Loader2, ListFilter, Trash2, RotateCcw, Printer, Edit,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Escola, Coordenador, Segmento } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';
import { SearchableSchoolSelect } from './ui/SearchableSchoolSelect';
import { PrintableFrequencia } from './PrintableFrequencia';
import { logAudit } from '../services/logService';

interface FrequenciaInfantilProps {
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

interface AttendanceSheetInfantil {
  id: string;
  data: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  anoSerie: string;
  periodo: string;
  presentesCount: number;
  totalCount: number;
  rate: number; // Percentage
  students: StudentAttendance[];
  criadoEm: string;
  professor?: string;
}

const PERIODOS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

export const FrequenciaInfantil: React.FC<FrequenciaInfantilProps> = ({ 
  escolas, 
  isDemoMode, 
  isAdmin, 
  userEmail, 
  currentUser, 
  subHeader 
}) => {
  const { showNotification } = useNotification();
  const [sheets, setSheets] = useState<AttendanceSheetInfantil[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string | number, boolean>>({});

  // Filter & Context State
  const [dataFreq, setDataFreq] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [periodo, setPeriodo] = useState('1º Bimestre');
  const [anoSerie, setAnoSerie] = useState('Creche III');

  // Search & Loading States
  const [studentSearch, setStudentSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit & Print States
  const [editingSheet, setEditingSheet] = useState<AttendanceSheetInfantil | null>(null);
  const [selectedSheetForPrint, setSelectedSheetForPrint] = useState<AttendanceSheetInfantil | null>(null);

  // History Filters & Teacher Map States
  const [coordenadoresList, setCoordenadoresList] = useState<any[]>([]);
  const [historyFilterEscola, setHistoryFilterEscola] = useState('');
  const [historyFilterAnoSerie, setHistoryFilterAnoSerie] = useState('');
  const [historyFilterTurma, setHistoryFilterTurma] = useState('');
  const [historyFilterPeriodo, setHistoryFilterPeriodo] = useState('');
  const [historyFilterProfessor, setHistoryFilterProfessor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);

  // Filter schools to only those offering Educação Infantil
  const escolasInfantil = useMemo(() => {
    return escolas.filter(e => 
      e.segmentos && e.segmentos.includes(Segmento.INFANTIL)
    );
  }, [escolas]);

  // Sync selectedEscolaId on mount
  useEffect(() => {
    if (escolasInfantil.length > 0 && !selectedEscolaId) {
      setSelectedEscolaId(escolasInfantil[0].id);
    }
  }, [escolasInfantil, selectedEscolaId]);

  // Load ECE turmas based on active school
  useEffect(() => {
    const fetchTurmas = async () => {
      if (!selectedEscolaId) {
        setTurmas([]);
        return;
      }

      if (isDemoMode) {
        let mockTurmas = [
          { id: 'demo-t1', name: 'Maternal A', year: 'Maternal A', anoSerie: 'Creche II', school_id: selectedEscolaId, shift: 'MANHÃ', stage: 'Educação Infantil' },
          { id: 'demo-t2', name: 'Creche III B', year: 'Creche III B', anoSerie: 'Creche III', school_id: selectedEscolaId, shift: 'TARDE', stage: 'Educação Infantil' },
          { id: 'demo-t3', name: 'Pré I A', year: 'Pré I A', anoSerie: 'Pré I', school_id: selectedEscolaId, shift: 'MANHÃ', stage: 'Educação Infantil' },
          { id: 'demo-t4', name: 'Pré II B', year: 'Pré II B', anoSerie: 'Pré II', school_id: selectedEscolaId, shift: 'TARDE', stage: 'Educação Infantil' },
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
          .eq('stage', 'Educação Infantil') // Only ECE classes
          .order('name');

        if (error) throw error;
        
        let filteredTurmas = data || [];
        if (currentUser && currentUser.funcao === 'Professor') {
          const assignedIds = currentUser.turmasIds || [];
          filteredTurmas = filteredTurmas.filter((t: any) => assignedIds.includes(t.id));
        }
        setTurmas(filteredTurmas);
      } catch (err) {
        console.error('Erro ao buscar turmas ECE:', err);
      }
    };

    fetchTurmas();
  }, [selectedEscolaId, isDemoMode]);

  // Helpers for filtering and matching
  const isTurmaInAnoSerie = (t: any, anoSerieVal: string): boolean => {
    if (!t || !anoSerieVal) return false;
    
    const normalize = (val: string) => {
      return val.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[-\s]/g, '');
    };

    const targetNorm = normalize(anoSerieVal);
    
    const getCleanGroup = (v: string) => {
      if (v === 'preescolai' || v === 'prei') return 'prei';
      if (v === 'preescolaii' || v === 'preii') return 'preii';
      if (v === 'crechei') return 'crechei';
      if (v === 'crecheii') return 'crecheii';
      if (v === 'crecheiii') return 'crecheiii';
      return v;
    };

    const targetClean = getCleanGroup(targetNorm);

    const valuesToCheck = [
      t.anoSerie || '',
      t.year || '',
      t.name || ''
    ].map(v => getCleanGroup(normalize(v)));

    return valuesToCheck.some(val => {
      if (!val) return false;
      if (val === targetClean) return true;
      
      // Evitar colisão entre Creche I, Creche II e Creche III
      if (val.includes('crecheiii') && targetClean.includes('crecheii') && !targetClean.includes('crecheiii')) return false;
      if (targetClean.includes('crecheiii') && val.includes('crecheii') && !val.includes('crecheiii')) return false;
      if (val.includes('crecheiii') && targetClean.includes('crechei') && !targetClean.includes('crecheiii')) return false;
      if (targetClean.includes('crecheiii') && val.includes('crechei') && !val.includes('crecheiii')) return false;
      if (val.includes('crecheii') && targetClean.includes('crechei') && !targetClean.includes('crecheii')) return false;
      if (targetClean.includes('crecheii') && val.includes('crechei') && !val.includes('crecheii')) return false;

      // Evitar colisão entre Pré I e Pré II
      if (val.includes('preii') && targetClean.includes('prei') && !targetClean.includes('preii')) return false;
      if (targetClean.includes('preii') && val.includes('prei') && !val.includes('preii')) return false;

      if (val.includes(targetClean) || targetClean.includes(val)) return true;
      return false;
    });
  };

  const FAIXAS_ETARIAS = ['Creche I', 'Creche II', 'Creche III', 'Pré I', 'Pré II'];

  // Compute available Faixas Etárias for the selected school
  const availableAnosSeries = useMemo(() => {
    if (turmas.length === 0) return [];
    return FAIXAS_ETARIAS.filter(ano => 
      turmas.some(t => isTurmaInAnoSerie(t, ano))
    );
  }, [turmas]);

  // Compute available Turmas for the selected school and Faixa Etária
  const availableTurmas = useMemo(() => {
    if (!anoSerie) return [];
    return turmas.filter(t => isTurmaInAnoSerie(t, anoSerie));
  }, [turmas, anoSerie]);

  // Sync anoSerie selection when availableAnosSeries changes
  useEffect(() => {
    const turmasMatchSchool = turmas.length === 0 || 
      turmas[0].school_id === selectedEscolaId || 
      (isDemoMode && turmas[0].id?.startsWith('demo'));

    if (turmasMatchSchool) {
      if (availableAnosSeries.length > 0) {
        if (!availableAnosSeries.includes(anoSerie) && !editingSheet) {
          setAnoSerie(availableAnosSeries[0]);
        }
      } else if (!editingSheet) {
        setAnoSerie('');
      }
    }
  }, [availableAnosSeries, anoSerie, selectedEscolaId, turmas, isDemoMode, editingSheet]);

  // Sync selectedTurmaId selection when availableTurmas changes
  useEffect(() => {
    const turmasMatchSchool = turmas.length === 0 || 
      turmas[0].school_id === selectedEscolaId || 
      (isDemoMode && turmas[0].id?.startsWith('demo'));

    if (turmasMatchSchool) {
      if (availableTurmas.length > 0) {
        const exists = availableTurmas.some(t => t.id === selectedTurmaId);
        if (!exists && !editingSheet) {
          setSelectedTurmaId(availableTurmas[0].id);
        }
      } else if (!editingSheet) {
        setSelectedTurmaId('');
      }
    }
  }, [availableTurmas, selectedTurmaId, selectedEscolaId, turmas, isDemoMode, editingSheet]);

  // Fetch teacher names from coordenadores
  useEffect(() => {
    const fetchCoordenadores = async () => {
      if (isDemoMode) return;
      try {
        const { data, error } = await supabase
          .from('coordenadores')
          .select('contato, nome');

        if (!error && data) {
          setCoordenadoresList(data);
        }
      } catch (err) {
        console.error('Erro ao carregar coordenadores ECE:', err);
      }
    };
    fetchCoordenadores();
  }, [isDemoMode]);

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
    return emailOrName;
  };

  // Load attendance sheets on mount or school change
  useEffect(() => {
    const loadSheets = async () => {
      try {
        if (!isDemoMode) {
          let allSheetsData: any[] = [];
          let page = 0;
          const pageSize = 1000;
          let hasMore = true;

          while (hasMore) {
            const { data, error } = await supabase
              .from('frequencia_sheets_infantil')
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

          let filteredSheetsData = allSheetsData;
          if (!isAdmin && currentUser && currentUser.funcao !== 'Administrador') {
            const userSchoolIds = (currentUser?.escolasIds || []).map(String);
            if (userSchoolIds.length > 0) {
              filteredSheetsData = filteredSheetsData.filter((d: any) => userSchoolIds.includes(String(d.escola_id)));
            }
          }
          if (currentUser && currentUser.funcao === 'Professor') {
            const assignedIds = (currentUser.turmasIds || []).map(String);
            filteredSheetsData = filteredSheetsData.filter((d: any) => assignedIds.includes(String(d.turma_id)));
          }

          const formatted: AttendanceSheetInfantil[] = filteredSheetsData.map(d => ({
            id: d.id,
            data: d.data,
            escolaId: d.escola_id,
            escolaNome: escolas.find(e => e.id === d.escola_id)?.nome || 'Unidade',
            turmaId: d.turma_id,
            turmaNome: d.ano_serie,
            anoSerie: d.ano_serie,
            periodo: d.periodo,
            presentesCount: d.presentes_count || 0,
            totalCount: d.total_count || 0,
            rate: d.rate,
            students: d.students || [],
            criadoEm: d.created_at,
            professor: getTeacherName(d.updated_by || d.created_by || d.professor)
          }));
          setSheets(formatted);
        } else {
          const saved = localStorage.getItem('sigar_frequencia_sheets_infantil');
          if (saved) {
            setSheets(JSON.parse(saved));
          }
        }
      } catch (err) {
        console.error('Erro ao buscar folhas de frequência:', err);
      }
    };

    loadSheets();
  }, [isDemoMode, escolas, coordMap]);

  // Fetch students for active ECE class
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedTurmaId) {
        setStudents([]);
        setAttendanceMap({});
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('alunos')
          .select('id, name')
          .eq('class_id', selectedTurmaId)
          .in('status', ['active', 'Ativo'])
          .order('name', { ascending: true });

        if (error) throw error;
        setStudents(data || []);

        // Check if we are currently editing a sheet for this turma
        const initialMap: Record<string | number, boolean> = {};
        const sheetStudentsMap = new Map<string, boolean>();
        
        if (editingSheet && editingSheet.turmaId === selectedTurmaId) {
          (editingSheet.students || []).forEach(st => {
            sheetStudentsMap.set(String(st.id), st.present);
          });
        } else {
          const existing = sheets.find(s => s.data === dataFreq && s.turmaId === selectedTurmaId);
          if (existing) {
            (existing.students || []).forEach(st => {
              sheetStudentsMap.set(String(st.id), st.present);
            });
            setPeriodo(existing.periodo);
          }
        }

        (data || []).forEach((s: any) => {
          const sIdStr = String(s.id);
          if (sheetStudentsMap.has(sIdStr)) {
            initialMap[s.id] = sheetStudentsMap.get(sIdStr)!;
          } else {
            initialMap[s.id] = true;
          }
        });
        setAttendanceMap(initialMap);

      } catch (err) {
        console.error('Erro ao carregar alunos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedTurmaId, dataFreq, sheets, editingSheet]);

  // Toggle single presence
  const toggleAttendance = (id: string | number) => {
    setAttendanceMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle all presence/absence
  const toggleAll = (present: boolean) => {
    const updated = { ...attendanceMap };
    students.forEach(s => {
      updated[s.id] = present;
    });
    setAttendanceMap(updated);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) return { total: 0, presents: 0, absents: 0, rate: 0 };
    
    let presents = 0;
    students.forEach(s => {
      if (attendanceMap[s.id]) presents++;
    });
    const absents = total - presents;
    const rate = Math.round((presents / total) * 100);
    return { total, presents, absents, rate };
  }, [students, attendanceMap]);

  // Handle Save
  const handleSave = async () => {
    if (!selectedEscolaId || !selectedTurmaId) {
      showNotification('error', 'Selecione a Escola e a Turma.');
      return;
    }

    if (students.length === 0) {
      showNotification('error', 'Não há alunos matriculados nesta turma.');
      return;
    }

    setSaving(true);
    const escolaNome = escolas.find(e => e.id === selectedEscolaId)?.nome || 'Unidade';
    const turmaObj = turmas.find(t => t.id === selectedTurmaId);
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.anoSerie} • ${turmaObj.turno || ''}` : 'Turma';

    const listStudents: StudentAttendance[] = students.map(s => ({
      id: s.id,
      name: s.name,
      present: !!attendanceMap[s.id]
    }));

    const sheetId = crypto.randomUUID();
    const payload: AttendanceSheetInfantil = {
      id: sheetId,
      data: dataFreq,
      escolaId: selectedEscolaId,
      escolaNome,
      turmaId: selectedTurmaId,
      turmaNome,
      anoSerie,
      periodo,
      presentesCount: stats.presents,
      totalCount: stats.total,
      rate: stats.rate,
      students: listStudents,
      criadoEm: new Date().toISOString()
    };

    // Check if sheet already exists to overwrite/update
    const existingIndex = sheets.findIndex(s => 
      s.data === dataFreq && 
      s.turmaId === selectedTurmaId
    );
         if (existingIndex > -1) {
      payload.id = sheets[existingIndex].id;
    }

    setSaving(true);
    try {
      if (!isDemoMode) {
        const dbPayload = {
          id: payload.id,
          data: payload.data,
          escola_id: payload.escolaId,
          turma_id: payload.turmaId,
          ano_serie: payload.anoSerie,
          periodo: payload.periodo,
          presentes_count: payload.presentesCount,
          total_count: payload.totalCount,
          rate: payload.rate,
          students: payload.students,
          updated_at: new Date().toISOString(),
          updated_by: userEmail || currentUser?.contato || 'user'
        };

        const { error } = await supabase
          .from('frequencia_sheets_infantil')
          .upsert(dbPayload);

        if (error) throw error;
      }

      let updatedSheets: AttendanceSheetInfantil[];
      if (existingIndex > -1) {
        updatedSheets = [...sheets];
        updatedSheets[existingIndex] = payload;
        showNotification('success', 'Chamada da Educação Infantil atualizada com sucesso!');
      } else {
        updatedSheets = [payload, ...sheets];
        showNotification('success', 'Chamada da Educação Infantil registrada com sucesso!');
      }

      setSheets(updatedSheets);
      if (isDemoMode) {
        localStorage.setItem('sigar_frequencia_sheets_infantil', JSON.stringify(updatedSheets));
      }

      await logAudit(
        existingIndex > -1 ? 'UPDATE' : 'CREATE',
        'FREQUENCIA_INFANTIL',
        payload.id,
        {
          data: payload.data,
          escola: payload.escolaNome,
          turma: payload.turmaNome,
          anoSerie: payload.anoSerie,
          periodo: payload.periodo,
          presentes: payload.presentesCount,
          total: payload.totalCount,
          taxa: payload.rate
        }
      );

      setEditingSheet(null);
    } catch (err) {
      console.error('Erro ao salvar chamada ECE:', err);
      showNotification('error', 'Erro ao salvar a chamada de Educação Infantil.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintSheet = (sheet: AttendanceSheetInfantil) => {
    setSelectedSheetForPrint(sheet);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleEditSheet = (sheet: AttendanceSheetInfantil) => {
    setEditingSheet(sheet);
    if (sheet.data) setDataFreq(sheet.data);
    if (sheet.escolaId) setSelectedEscolaId(sheet.escolaId);
    if (sheet.anoSerie) setAnoSerie(sheet.anoSerie);
    if (sheet.turmaId) setSelectedTurmaId(sheet.turmaId);
    if (sheet.periodo) setPeriodo(sheet.periodo);

    showNotification('success', `Chamada da turma ${sheet.turmaNome} (${sheet.data}) carregada no formulário para edição.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSheet = async (id: string) => {
    if (!confirm('Deseja realmente remover este registro de frequência?')) return;

    try {
      if (!isDemoMode) {
        const { error } = await supabase
          .from('frequencia_sheets_infantil')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      const sheetToDelete = sheets.find(s => s.id === id);
      const updated = sheets.filter(s => s.id !== id);
      setSheets(updated);
      if (isDemoMode) {
        localStorage.setItem('sigar_frequencia_sheets_infantil', JSON.stringify(updated));
      }
      showNotification('success', 'Registro de frequência removido com sucesso.');

      if (sheetToDelete) {
        await logAudit('DELETE', 'FREQUENCIA_INFANTIL', id, {
          data: sheetToDelete.data,
          turma: sheetToDelete.turmaNome,
          escola: sheetToDelete.escolaNome
        });
      }
    } catch (err) {
      console.error('Erro ao excluir registro:', err);
      showNotification('error', 'Erro ao excluir registro de frequência.');
    }
  };

  // History Options & Filtered sheets memoization
  const historyOptions = useMemo(() => {
    const escolasMap = new Map<string, string>();
    const anosSet = new Set<string>();
    const turmasSet = new Set<string>();
    const periodosSet = new Set<string>();
    const professoresSet = new Set<string>();

    sheets.forEach(sheet => {
      const matchEscola = !historyFilterEscola || sheet.escolaId === historyFilterEscola;
      const matchAno = !historyFilterAnoSerie || sheet.anoSerie === historyFilterAnoSerie;
      const matchTurma = !historyFilterTurma || sheet.turmaNome === historyFilterTurma;
      const matchPeriodo = !historyFilterPeriodo || sheet.periodo === historyFilterPeriodo;
      const profName = getTeacherName(sheet.professor);
      const matchProf = !historyFilterProfessor || profName === historyFilterProfessor || sheet.professor === historyFilterProfessor;

      if (sheet.escolaId && sheet.escolaNome) {
        if (matchAno && matchTurma && matchPeriodo && matchProf) {
          escolasMap.set(sheet.escolaId, sheet.escolaNome);
        }
      }

      if (sheet.anoSerie) {
        if (matchEscola && matchTurma && matchPeriodo && matchProf) {
          anosSet.add(sheet.anoSerie);
        }
      }

      if (sheet.turmaNome) {
        if (matchEscola && matchAno && matchPeriodo && matchProf) {
          turmasSet.add(sheet.turmaNome);
        }
      }

      if (sheet.periodo) {
        if (matchEscola && matchAno && matchTurma && matchProf) {
          periodosSet.add(sheet.periodo);
        }
      }

      if (profName) {
        if (matchEscola && matchAno && matchTurma && matchPeriodo) {
          professoresSet.add(profName);
        }
      }
    });

    escolasInfantil.forEach(e => {
      if (!escolasMap.has(e.id)) {
        escolasMap.set(e.id, e.nome);
      }
    });

    FAIXAS_ETARIAS.forEach(f => anosSet.add(f));
    PERIODOS.forEach(p => periodosSet.add(p));

    const escolasList = Array.from(escolasMap.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
    const anosList = Array.from(anosSet).sort();
    const turmasList = Array.from(turmasSet).sort((a, b) => a.localeCompare(b));
    const periodosList = Array.from(periodosSet).sort();
    const professoresList = Array.from(professoresSet).sort((a, b) => a.localeCompare(b));

    return {
      escolas: escolasList,
      anosSeries: anosList,
      turmas: turmasList,
      periodos: periodosList,
      professores: professoresList
    };
  }, [sheets, historyFilterEscola, historyFilterAnoSerie, historyFilterTurma, historyFilterPeriodo, historyFilterProfessor, coordMap, escolasInfantil, FAIXAS_ETARIAS]);

  const hasActiveHistoryFilters = Boolean(
    historyFilterEscola || historyFilterAnoSerie || historyFilterTurma || historyFilterPeriodo || historyFilterProfessor
  );

  const handleClearHistoryFilters = () => {
    setHistoryFilterEscola('');
    setHistoryFilterAnoSerie('');
    setHistoryFilterTurma('');
    setHistoryFilterPeriodo('');
    setHistoryFilterProfessor('');
  };

  const filteredSheets = useMemo(() => {
    return sheets.filter(sheet => {
      const profName = getTeacherName(sheet.professor);
      if (historyFilterEscola && sheet.escolaId !== historyFilterEscola) return false;
      if (historyFilterAnoSerie && sheet.anoSerie !== historyFilterAnoSerie) return false;
      if (historyFilterTurma && sheet.turmaNome !== historyFilterTurma) return false;
      if (historyFilterPeriodo && sheet.periodo !== historyFilterPeriodo) return false;
      if (historyFilterProfessor && profName !== historyFilterProfessor && sheet.professor !== historyFilterProfessor) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesEscola = sheet.escolaNome.toLowerCase().includes(term);
        const matchesTurma = sheet.turmaNome.toLowerCase().includes(term);
        const matchesGrupo = (sheet.anoSerie || '').toLowerCase().includes(term);
        if (!matchesEscola && !matchesTurma && !matchesGrupo) return false;
      }

      return true;
    });
  }, [sheets, historyFilterEscola, historyFilterAnoSerie, historyFilterTurma, historyFilterPeriodo, historyFilterProfessor, searchTerm, coordMap]);

  // Reset pagination to page 1 whenever any filter changes
  useEffect(() => {
    setHistoryCurrentPage(1);
  }, [historyFilterEscola, historyFilterAnoSerie, historyFilterTurma, historyFilterPeriodo, historyFilterProfessor, searchTerm]);

  // Pagination Math
  const totalHistoryItems = filteredSheets.length;
  const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryItems / historyItemsPerPage));
  const safeHistoryCurrentPage = Math.min(historyCurrentPage, totalHistoryPages);

  const paginatedSheetsHistory = useMemo(() => {
    const start = (safeHistoryCurrentPage - 1) * historyItemsPerPage;
    return filteredSheets.slice(start, start + historyItemsPerPage);
  }, [filteredSheets, safeHistoryCurrentPage, historyItemsPerPage]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(studentSearch.toLowerCase())
    );
  }, [students, studentSearch]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative text-left">
      <PageHeader 
        title="Frequência - Educação Infantil"
        subtitle="Registro de chamada diária, controle de frequência e taxa de assiduidade escolar"
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

      {/* Filters & Configuration */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <ListFilter className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Seleção de Turma e Período</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              escolas={escolasInfantil}
              selectedId={selectedEscolaId}
              onChange={setSelectedEscolaId}
              placeholder="Selecione a Unidade Escolar"
              inputClassName="pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Grupo/Faixa Etária *</label>
            <select 
              value={anoSerie}
              onChange={e => setAnoSerie(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            >
              {availableAnosSeries.length === 0 ? (
                <option value="">Nenhum grupo cadastrado</option>
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
                  <option key={t.id} value={t.id}>{`${t.name || t.anoSerie} • ${t.turno || t.shift || ''}`}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Período Letivo *</label>
            <select 
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            >
              {PERIODOS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* ATTENDANCE INTERACTION BLOCK */}
      {!selectedTurmaId ? (
        <Card className="bg-white border-slate-200 shadow-sm p-16 rounded-2xl text-center flex flex-col items-center justify-center">
          <SchoolIcon className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-base font-bold text-slate-700">Seleção Requerida</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Selecione uma Escola e Turma do segmento de Educação Infantil nos filtros acima para carregar a lista de chamada.
          </p>
        </Card>
      ) : (
        <>
          {/* Stats Summary cards */}
          {students.length > 0 && (
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
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden p-0">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Buscar estudante..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 outline-none text-xs font-semibold focus:border-brand-orange transition-all"
                />
              </div>

              <div className="flex gap-2 shrink-0">
                <Button 
                  variant="secondary" 
                  onClick={() => toggleAll(true)}
                  className="rounded-xl text-[10px] font-bold py-1.5 px-3 uppercase bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                >
                  Presente Todos
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => toggleAll(false)}
                  className="rounded-xl text-[10px] font-bold py-1.5 px-3 uppercase bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                >
                  Ausente Todos
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[450px]">
              {loading ? (
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
                      const isPresent = !!attendanceMap[student.id];
                      return (
                        <tr 
                          key={student.id} 
                          className={`transition-colors hover:bg-slate-50/50 cursor-pointer ${isPresent ? '' : 'bg-red-50/10'}`}
                          onClick={() => toggleAttendance(student.id)}
                        >
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-400 w-5">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span className="font-bold text-slate-800 uppercase tracking-tight text-left">
                                {student.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center" onClick={e => e.stopPropagation()}>
                            <div className="inline-flex items-center">
                              <button
                                onClick={() => toggleAttendance(student.id)}
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
                onClick={handleSave}
                disabled={loading || students.length === 0 || saving}
                className="rounded-xl text-xs font-black py-2.5 bg-brand-orange hover:bg-orange-600 shadow-md flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Chamada
              </Button>
            </div>
          </Card>
        </>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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

            {/* Grupo/Faixa Etária */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Grupo/Faixa Etária</label>
              <select
                value={historyFilterAnoSerie}
                onChange={e => setHistoryFilterAnoSerie(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
              >
                <option value="">Todos os Grupos</option>
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

            {/* Período Letivo */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Período Letivo</label>
              <select
                value={historyFilterPeriodo}
                onChange={e => setHistoryFilterPeriodo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
              >
                <option value="">Todos os Períodos</option>
                {historyOptions.periodos.map(p => (
                  <option key={p} value={p}>{p}</option>
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
                  <th className="px-6 py-4">Turma / Grupo (Período)</th>
                  <th className="px-6 py-4 text-center">Frequência</th>
                  <th className="px-6 py-4 text-center">Presentes / Total</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSheets.length === 0 ? (
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
                          {sheet.anoSerie} • {sheet.periodo}
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
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer" 
                            title="Imprimir Relatório de Frequência"
                          >
                            <Printer size={15} />
                          </button>
                          <button 
                            onClick={() => handleEditSheet(sheet)} 
                            className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-all cursor-pointer" 
                            title="Editar Chamada"
                          >
                            <Edit size={15} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSheet(sheet.id)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" 
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
      <PrintableFrequencia sheet={selectedSheetForPrint as any} />
    </div>
  );
};
