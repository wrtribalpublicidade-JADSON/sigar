import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  FileText, Plus, Search, Edit2, Trash2, Printer, 
  X, Calendar, School as SchoolIcon, BookOpen, Save, ClipboardList,
  Layers, Check, AlertTriangle, ListFilter, RotateCcw, ChevronLeft, ChevronRight,
  Eye, Bookmark
} from 'lucide-react';
import { Escola, Coordenador } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';
import { useConfiguracao } from '../context/ConfiguracaoContext';
import { SearchableSchoolSelect } from './ui/SearchableSchoolSelect';
import { isEducaInfantilYear, isCampoExperienciaInfantil, normalizeSubjectName } from '../utils';

interface AulasMinistradasProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
  subHeader?: React.ReactNode;
}

interface ClassLog {
  id: string;
  data: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  componente: string;
  aulas: number; // Quantidade de aulas (1 a 5)
  conteudo: string;
  atividades: string;
  observacoes: string;
  criadoEm: string;
  anoSerie: string;
  periodo: string;
  professor?: string;
  selectedObjetoIds?: string[];
  selectedHabilidadeIds?: string[];
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
  '4º Bimestre',
  'Anual'
];

const ANOS_SERIES = [
  '1º Ano',
  '2º Ano',
  '3º Ano',
  '4º Ano',
  '5º Ano',
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano',
  'EJA - 1º Segmento',
  'EJA - 2º Segmento'
];

export const AulasMinistradas: React.FC<AulasMinistradasProps> = ({ escolas, isDemoMode, isAdmin, userEmail, currentUser, subHeader }) => {
  const { configuracao, isPeriodoBloqueado, isDataBloqueada } = useConfiguracao();
  const { showNotification } = useNotification();
  const [logs, setLogs] = useState<ClassLog[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [coordenadoresList, setCoordenadoresList] = useState<any[]>([]);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [anoSerie, setAnoSerie] = useState(ANOS_SERIES[0]);
  const [componente, setComponente] = useState(COMPONENTES[0]);
  const [periodo, setPeriodo] = useState(BIMESTRES[0]);
  const [aulas, setAulas] = useState<number>(2);
  const [conteudo, setConteudo] = useState('');
  const [atividades, setAtividades] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const isBlocked = isPeriodoBloqueado(periodo, currentUser?.funcao) || isDataBloqueada(dataAula, currentUser?.funcao);

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

  // Course Plans integration state
  const [coursePlans, setCoursePlans] = useState<any[]>([]);
  const [selectedObjetoIds, setSelectedObjetoIds] = useState<string[]>([]);
  const [selectedHabilidadeIds, setSelectedHabilidadeIds] = useState<string[]>([]);

  // History Filters State (matching Boletins e Pautas Lançadas)
  const [historyFilterEscola, setHistoryFilterEscola] = useState('');
  const [historyFilterAnoSerie, setHistoryFilterAnoSerie] = useState('');
  const [historyFilterTurma, setHistoryFilterTurma] = useState('');
  const [historyFilterComponente, setHistoryFilterComponente] = useState('');
  const [historyFilterBimestre, setHistoryFilterBimestre] = useState('');
  const [historyFilterProfessor, setHistoryFilterProfessor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);

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

  // Print & View Mode States
  const [printLog, setPrintLog] = useState<ClassLog | null>(null);
  const [viewingLog, setViewingLog] = useState<ClassLog | null>(null);
  const [guiasAprendizagem, setGuiasAprendizagem] = useState<any[]>([]);

  // Fetch team / coordinators to resolve emails to names
  useEffect(() => {
    const fetchCoordenadores = async () => {
      try {
        const { data, error } = await supabase
          .from('coordenadores')
          .select('contato, nome');
        if (!error && data) {
          setCoordenadoresList(data);
        }
      } catch (err) {
        console.error('Erro ao carregar coordenadores:', err);
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

  const fetchRealLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('aulas_ministradas')
        .select('*')
        .eq('ativo', true)
        .order('data', { ascending: false });

      if (error) throw error;

      // Also get turmas to map names
      const { data: allTurmas, error: turmasError } = await supabase
        .from('turmas')
        .select('id, name, year, shift');
      
      const turmaMap = new Map<string, string>();
      if (!turmasError && allTurmas) {
        allTurmas.forEach((t: any) => {
          turmaMap.set(t.id, `${t.name || t.year} • ${t.shift || ''}`);
        });
      }

      let filteredLogs = data || [];
      // Filter out Early Childhood Education entries (ECE stages and Campos de Experiência)
      filteredLogs = filteredLogs.filter((p: any) => {
        if (p.componente && isCampoExperienciaInfantil(p.componente)) return false;
        if (p.ano_serie && isEducaInfantilYear(p.ano_serie)) return false;
        return true;
      });

      if (!isAdmin && currentUser && currentUser.funcao !== 'Administrador') {
        const userSchoolIds = currentUser?.escolasIds || [];
        if (userSchoolIds.length > 0) {
          filteredLogs = filteredLogs.filter((p: any) => userSchoolIds.includes(p.escola_id));
        }
      }
      if (currentUser && currentUser.funcao === 'Professor') {
        const assignedIds = currentUser.turmasIds || [];
        const currentEmail = (currentUser.contato || userEmail || '').toLowerCase().trim();

        filteredLogs = filteredLogs.filter((p: any) => {
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

      const formatted: ClassLog[] = filteredLogs.map((p: any) => {
        const escolaObj = escolas.find(esc => esc.id === p.escola_id);
        const escolaNome = escolaObj ? escolaObj.nome : 'Unidade';
        const turmaNome = turmaMap.get(p.turma_id) || 'Turma';

        return {
          id: p.id,
          data: p.data,
          escolaId: p.escola_id,
          escolaNome,
          turmaId: p.turma_id,
          turmaNome,
          componente: normalizeSubjectName(p.componente),
          aulas: p.aulas,
          conteudo: p.conteudo,
          atividades: p.atividades || '',
          observacoes: p.observacoes || '',
          anoSerie: p.ano_serie,
          periodo: p.periodo,
          professor: getTeacherName(p.professor || p.updated_by || p.created_by || p.responsavel),
          selectedObjetoIds: p.selected_objeto_ids || [],
          selectedHabilidadeIds: p.selected_habilidade_ids || [],
          criadoEm: p.created_at
        };
      });

      setLogs(formatted);
    } catch (err) {
      console.error('Erro ao buscar aulas ministradas do Supabase:', err);
      showNotification('error', 'Erro ao carregar dados do Supabase. Utilizando dados locais.');
    }
  };

  const fetchRealCoursePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('planos_curso')
        .select('*')
        .eq('ativo', true);

      if (error) throw error;

      const formatted: any[] = (data || []).map((p: any) => ({
        id: p.id,
        anoReferencia: p.ano_referencia,
        componente: p.componente,
        bimestre: p.bimestre,
        anoSerie: p.ano_serie,
        itens: p.itens || [],
        criadoEm: p.created_at
      }));

      setCoursePlans(formatted);
    } catch (err) {
      console.error('Erro ao buscar planos de curso do Supabase para aulas:', err);
    }
  };

  // Load logs
  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('sigar_aulas_ministradas');
      if (saved) {
        try {
          setLogs(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      if (allowedEscolas.length > 0) {
        fetchRealLogs();
      }
    }

    if (allowedEscolas.length > 0) {
      if (!selectedEscolaId || !allowedEscolas.some(e => e.id === selectedEscolaId)) {
        setSelectedEscolaId(allowedEscolas[0].id);
      }
    }
  }, [allowedEscolas, isDemoMode]);

  // Load course plans
  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('sigar_planos_curso');
      if (saved) {
        try {
          setCoursePlans(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      } else {
        setCoursePlans([]);
      }
    } else {
      fetchRealCoursePlans();
    }
  }, [isDemoMode]);

  const fetchRealGuiasAprendizagem = async () => {
    try {
      const { data, error } = await supabase
        .from('guias_aprendizagem')
        .select('*')
        .eq('ativo', true);

      if (error) throw error;
      setGuiasAprendizagem(data || []);
    } catch (err) {
      console.error('Erro ao buscar guias de aprendizagem do Supabase para aulas:', err);
    }
  };

  // Load guias de aprendizagem
  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('sigar_planos_aula');
      if (saved) {
        try {
          setGuiasAprendizagem(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      } else {
        setGuiasAprendizagem([]);
      }
    } else {
      fetchRealGuiasAprendizagem();
    }
  }, [isDemoMode]);

  // Helper to match a ClassLog to its corresponding Guia de Aprendizagem
  const getMatchingGuia = (log: ClassLog | null) => {
    if (!log || guiasAprendizagem.length === 0) return null;

    const normalizedComp = normalizeSubjectName(log.componente);

    // 1. Exact match: turma_id + componente + periodo
    let matches = guiasAprendizagem.filter(g => 
      g.turma_id === log.turmaId &&
      normalizeSubjectName(g.componente) === normalizedComp &&
      (g.periodo === log.periodo || g.bimestre === log.periodo)
    );

    // 2. Match by escola_id + ano_serie + componente + periodo
    if (matches.length === 0) {
      matches = guiasAprendizagem.filter(g => 
        g.escola_id === log.escolaId &&
        (g.ano_serie === log.anoSerie || g.anoSerie === log.anoSerie) &&
        normalizeSubjectName(g.componente) === normalizedComp &&
        (g.periodo === log.periodo || g.bimestre === log.periodo)
      );
    }

    // 3. Match by ano_serie + componente + periodo
    if (matches.length === 0) {
      matches = guiasAprendizagem.filter(g => 
        (g.ano_serie === log.anoSerie || g.anoSerie === log.anoSerie) &&
        normalizeSubjectName(g.componente) === normalizedComp &&
        (g.periodo === log.periodo || g.bimestre === log.periodo)
      );
    }

    if (matches.length === 0) return null;

    // Check if log.data falls between data_inicio and data_termino
    const logDate = log.data;
    if (logDate) {
      const dateMatched = matches.find(g => {
        if (g.data_inicio && g.data_termino) {
          return logDate >= g.data_inicio && logDate <= g.data_termino;
        }
        if (g.data) {
          return g.data === logDate;
        }
        return false;
      });
      if (dateMatched) return dateMatched;
    }

    return matches[0];
  };

  const activeFormGuia = useMemo(() => {
    return getMatchingGuia({
      id: 'current-form',
      data: dataAula,
      escolaId: selectedEscolaId,
      escolaNome: '',
      turmaId: selectedTurmaId,
      turmaNome: '',
      componente,
      aulas,
      conteudo,
      atividades,
      observacoes,
      anoSerie,
      periodo,
      criadoEm: ''
    });
  }, [guiasAprendizagem, dataAula, selectedEscolaId, selectedTurmaId, componente, anoSerie, periodo]);

  // Get active Course Plan unificado matching selections
  const activeCoursePlan = useMemo(() => {
    return coursePlans.find((p: any) => 
      p.componente === componente && 
      p.anoSerie === anoSerie && 
      p.bimestre === periodo
    );
  }, [coursePlans, componente, anoSerie, periodo]);

  // Aggregate objects and skills from active Course Plan items
  const planData = useMemo(() => {
    if (!activeCoursePlan || !activeCoursePlan.itens) {
      return { objetos: [], habilidades: [], links: [] };
    }
    
    const objetosMap = new Map<string, any>();
    const habilidadesMap = new Map<string, any>();
    const links: { objetoId: string; habilidadeId: string }[] = [];
    
    activeCoursePlan.itens.forEach((item: any) => {
      if (item.objetos) {
        item.objetos.forEach((obj: any) => {
          objetosMap.set(obj.id, obj);
        });
      }
      if (item.habilidades) {
        item.habilidades.forEach((hab: any) => {
          habilidadesMap.set(hab.id, hab);
        });
      }
      if (item.links) {
        item.links.forEach((link: any) => {
          links.push(link);
        });
      }
    });
    
    return {
      objetos: Array.from(objetosMap.values()),
      habilidades: Array.from(habilidadesMap.values()),
      links
    };
  }, [activeCoursePlan]);

  // Reset selection when grade/component/period/turma changes
  useEffect(() => {
    if (!editingId) {
      setSelectedObjetoIds([]);
      setSelectedHabilidadeIds([]);
    }
  }, [componente, anoSerie, periodo, selectedTurmaId, editingId]);

  // Auto-fill form values from interactive selections
  const updateTextFromSelections = (objIds: string[], habIds: string[]) => {
    const selectedObjs = planData.objetos
      .filter((o: any) => objIds.includes(o.id))
      .map((o: any) => o.descricao);
    
    const selectedHabs = planData.habilidades
      .filter((h: any) => habIds.includes(h.id))
      .map((h: any) => h.codigo);
      
    let newContent = '';
    if (selectedObjs.length > 0) {
      newContent += `Objetos de Conhecimento:\n- ${selectedObjs.join('\n- ')}\n\n`;
    }
    if (selectedHabs.length > 0) {
      newContent += `Habilidades Trabalhadas:\n- ${selectedHabs.join(', ')}`;
    }
    
    setConteudo(newContent);
  };

  // Interactive selection handlers
  const toggleObjetoSelection = (objId: string) => {
    const isSelected = selectedObjetoIds.includes(objId);
    let newObjetoIds: string[];
    let newHabilidadeIds = [...selectedHabilidadeIds];
    
    if (!isSelected) {
      newObjetoIds = [...selectedObjetoIds, objId];
      const linkedHabs = planData.links
        .filter(l => l.objetoId === objId)
        .map(l => l.habilidadeId);
      
      linkedHabs.forEach(habId => {
        if (!newHabilidadeIds.includes(habId)) {
          newHabilidadeIds.push(habId);
        }
      });
    } else {
      newObjetoIds = selectedObjetoIds.filter(id => id !== objId);
      const linkedHabs = planData.links
        .filter(l => l.objetoId === objId)
        .map(l => l.habilidadeId);
      
      linkedHabs.forEach(habId => {
        const linkedToOtherSelectedObj = planData.links.some(l => 
          l.habilidadeId === habId && 
          l.objetoId !== objId && 
          newObjetoIds.includes(l.objetoId)
        );
        if (!linkedToOtherSelectedObj) {
          newHabilidadeIds = newHabilidadeIds.filter(id => id !== habId);
        }
      });
    }
    
    setSelectedObjetoIds(newObjetoIds);
    setSelectedHabilidadeIds(newHabilidadeIds);
    updateTextFromSelections(newObjetoIds, newHabilidadeIds);
  };

  const toggleHabilidadeSelection = (habId: string) => {
    const isSelected = selectedHabilidadeIds.includes(habId);
    let newHabilidadeIds: string[];
    let newObjetoIds = [...selectedObjetoIds];
    
    if (!isSelected) {
      newHabilidadeIds = [...selectedHabilidadeIds, habId];
      const linkedObjs = planData.links
        .filter(l => l.habilidadeId === habId)
        .map(l => l.objetoId);
      
      linkedObjs.forEach(objId => {
        if (!newObjetoIds.includes(objId)) {
          newObjetoIds.push(objId);
        }
      });
    } else {
      newHabilidadeIds = selectedHabilidadeIds.filter(id => id !== habId);
      const linkedObjs = planData.links
        .filter(l => l.habilidadeId === habId)
        .map(l => l.objetoId);
      
      linkedObjs.forEach(objId => {
        const linkedToOtherSelectedHab = planData.links.some(l => 
          l.objetoId === objId && 
          l.habilidadeId !== habId && 
          newHabilidadeIds.includes(l.habilidadeId)
        );
        if (!linkedToOtherSelectedHab) {
          newObjetoIds = newObjetoIds.filter(id => id !== objId);
        }
      });
    }
    
    setSelectedHabilidadeIds(newHabilidadeIds);
    setSelectedObjetoIds(newObjetoIds);
    updateTextFromSelections(newObjetoIds, newHabilidadeIds);
  };

  // Compute previously used objects and skills in this class, component, and period
  const previouslyUsedData = useMemo(() => {
    const usedObjetos = new Set<string>();
    const usedHabilidades = new Set<string>();
    
    logs.forEach(log => {
      if (
        log.id !== editingId &&
        log.turmaId === selectedTurmaId &&
        log.componente === componente &&
        log.anoSerie === anoSerie &&
        log.periodo === periodo
      ) {
        if (log.selectedObjetoIds) {
          log.selectedObjetoIds.forEach(id => usedObjetos.add(id));
        }
        if (log.selectedHabilidadeIds) {
          log.selectedHabilidadeIds.forEach(id => usedHabilidades.add(id));
        }
      }
    });
    
    return { usedObjetos, usedHabilidades };
  }, [logs, selectedTurmaId, componente, anoSerie, periodo, editingId]);

  // Compute skills statistics
  const skillStats = useMemo(() => {
    const total = planData.habilidades.length;
    if (total === 0) return { total: 0, worked: 0, percentage: 0, missing: 0 };
    
    const uniqueWorkedHabilidadeIds = new Set<string>();
    
    logs.forEach(log => {
      if (
        log.turmaId === selectedTurmaId &&
        log.componente === componente &&
        log.anoSerie === anoSerie &&
        log.periodo === periodo
      ) {
        if (log.selectedHabilidadeIds) {
          log.selectedHabilidadeIds.forEach(id => {
            if (planData.habilidades.some(h => h.id === id)) {
              uniqueWorkedHabilidadeIds.add(id);
            }
          });
        }
      }
    });

    selectedHabilidadeIds.forEach(id => {
      if (planData.habilidades.some(h => h.id === id)) {
        uniqueWorkedHabilidadeIds.add(id);
      }
    });
    
    const worked = uniqueWorkedHabilidadeIds.size;
    const percentage = Math.round((worked / total) * 100);
    const missing = total - worked;
    
    return { total, worked, percentage, missing };
  }, [planData.habilidades, logs, selectedTurmaId, componente, anoSerie, periodo, selectedHabilidadeIds]);

  // Calculate chronological sequence and lesson numbers for logs
  const logSequences = useMemo(() => {
    const filtered = logs.filter(l => l.turmaId && l.componente && l.periodo);
    
    const sorted = [...filtered].sort((a, b) => {
      const dateDiff = a.data.localeCompare(b.data);
      if (dateDiff !== 0) return dateDiff;
      return a.criadoEm.localeCompare(b.criadoEm);
    });

    const sequences: Record<string, { entrySeq: number; lessonRange: string }> = {};
    const counters: Record<string, { currentLesson: number; currentEntry: number }> = {};

    sorted.forEach((log) => {
      const key = `${log.turmaId}-${log.componente}-${log.periodo}`;
      if (!counters[key]) {
        counters[key] = { currentLesson: 0, currentEntry: 0 };
      }
      
      const count = counters[key];
      count.currentEntry += 1;
      
      const startLesson = count.currentLesson + 1;
      const endLesson = count.currentLesson + log.aulas;
      count.currentLesson = endLesson;

      const lessonRange = startLesson === endLesson 
        ? `Aula ${startLesson}` 
        : `Aulas ${startLesson} e ${endLesson}`;

      sequences[log.id] = {
        entrySeq: count.currentEntry,
        lessonRange
      };
    });

    return sequences;
  }, [logs]);

  // Load turmas when selected school changes
  useEffect(() => {
    const fetchTurmas = async () => {
      if (!selectedEscolaId) {
        setTurmas([]);
        return;
      }

      if (isDemoMode) {
        let mockTurmas = [
          { id: 'demo-t1', name: '1º ANO A', year: '1º Ano', shift: 'MANHÃ' },
          { id: 'demo-t2', name: '2º ANO B', year: '2º Ano', shift: 'TARDE' },
          { id: 'demo-t3', name: '5º ANO A', year: '5º Ano', shift: 'MANHÃ' },
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

  // Helpers for filtering and matching
  const isTurmaInAnoSerie = (t: any, anoSerieVal: string): boolean => {
    if (!t) return false;
    const target = anoSerieVal.toLowerCase().trim();
    const tYear = (t.year || '').toLowerCase().trim();
    const tName = (t.name || '').toLowerCase().trim();
    
    if (tYear) {
      if (tYear === target) return true;
      if (target.includes(tYear) || tYear.includes(target)) return true;
    }
    
    if (tName) {
      if (tName === target) return true;
      if (tName.includes(target)) return true;
      
      const normalizedTarget = target.replace(/[-\s]/g, '');
      const normalizedName = tName.replace(/[-\s]/g, '');
      if (normalizedName.includes(normalizedTarget)) return true;
    }
    
    return false;
  };

  // Compute available Anos/Séries for the selected school
  const availableAnosSeries = useMemo(() => {
    if (turmas.length === 0) return ANOS_SERIES;
    const filtered = ANOS_SERIES.filter(ano => 
      turmas.some(t => isTurmaInAnoSerie(t, ano))
    );
    return filtered.length > 0 ? filtered : ANOS_SERIES;
  }, [turmas]);

  // Compute available Turmas for the selected school and Ano/Série
  const availableTurmas = useMemo(() => {
    return turmas.filter(t => isTurmaInAnoSerie(t, anoSerie));
  }, [turmas, anoSerie]);

  // Sync anoSerie selection when availableAnosSeries changes
  useEffect(() => {
    const turmasMatchSchool = turmas.length === 0 || 
      turmas[0].school_id === selectedEscolaId || 
      (isDemoMode && turmas[0].id?.startsWith('demo'));

    if (turmasMatchSchool) {
      if (availableAnosSeries.length > 0 && !availableAnosSeries.includes(anoSerie)) {
        setAnoSerie(availableAnosSeries[0]);
      }
    }
  }, [availableAnosSeries, anoSerie, selectedEscolaId, turmas, isDemoMode]);

  // Sync selectedTurmaId selection when availableTurmas changes
  useEffect(() => {
    const turmasMatchSchool = turmas.length === 0 || 
      turmas[0].school_id === selectedEscolaId || 
      (isDemoMode && turmas[0].id?.startsWith('demo'));

    if (turmasMatchSchool) {
      if (availableTurmas.length > 0) {
        const exists = availableTurmas.some(t => t.id === selectedTurmaId);
        if (!exists) {
          setSelectedTurmaId(availableTurmas[0].id);
        }
      } else {
        setSelectedTurmaId('');
      }
    }
  }, [availableTurmas, selectedTurmaId, selectedEscolaId, turmas, isDemoMode]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;

    if (!selectedEscolaId || !selectedTurmaId || !conteudo.trim()) {
      showNotification('error', 'Preencha todos os campos obrigatórios (*).');
      return;
    }

    const htmlStrippedContent = conteudo.trim();
    const escolaNome = escolas.find(e => e.id === selectedEscolaId)?.nome || 'Unidade';
    const turmaObj = turmas.find(t => t.id === selectedTurmaId);
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.year} • ${turmaObj.shift || ''}` : 'Turma';

    const payload: ClassLog = {
      id: editingId || crypto.randomUUID(),
      data: dataAula,
      escolaId: selectedEscolaId,
      escolaNome,
      turmaId: selectedTurmaId,
      turmaNome,
      componente,
      aulas,
      conteudo: htmlStrippedContent,
      atividades,
      observacoes,
      anoSerie,
      periodo,
      professor: currentUser?.nome || userEmail || '',
      selectedObjetoIds,
      selectedHabilidadeIds,
      criadoEm: new Date().toISOString()
    };

    if (!isDemoMode) {
      const dbPayload = {
        id: payload.id,
        data: payload.data,
        escola_id: payload.escolaId,
        turma_id: payload.turmaId,
        componente: payload.componente,
        aulas: payload.aulas,
        conteudo: payload.conteudo,
        atividades: payload.atividades,
        observacoes: payload.observacoes,
        ano_serie: payload.anoSerie,
        periodo: payload.periodo,
        selected_objeto_ids: payload.selectedObjetoIds,
        selected_habilidade_ids: payload.selectedHabilidadeIds,
        updated_at: new Date().toISOString(),
        updated_by: userEmail || currentUser?.contato || 'user'
      };

      const { error } = await supabase
        .from('aulas_ministradas')
        .upsert(dbPayload);

      if (error) {
        console.error('Erro ao salvar registro no Supabase:', error);
        showNotification('error', 'Erro ao salvar o registro de aula no banco de dados.');
        return;
      }

      if (editingId) {
        setLogs(logs.map(l => l.id === editingId ? payload : l));
        showNotification('success', 'Registro de aula atualizado com sucesso no Supabase!');
      } else {
        setLogs([payload, ...logs]);
        showNotification('success', 'Aula ministrada registrada com sucesso no Supabase!');
      }
    } else {
      let updatedLogs: ClassLog[];
      if (editingId) {
        updatedLogs = logs.map(l => l.id === editingId ? payload : l);
        showNotification('success', 'Registro de aula atualizado com sucesso!');
      } else {
        updatedLogs = [payload, ...logs];
        showNotification('success', 'Aula ministrada registrada com sucesso!');
      }

      setLogs(updatedLogs);
      localStorage.setItem('sigar_aulas_ministradas', JSON.stringify(updatedLogs));
    }

    resetForm();
  };

  const handleEdit = (log: ClassLog) => {
    setEditingId(log.id);
    setDataAula(log.data);
    setSelectedEscolaId(log.escolaId);
    // Timeout to let turmas update and then select
    setTimeout(() => {
      setSelectedTurmaId(log.turmaId);
    }, 150);
    setAnoSerie(log.anoSerie || ANOS_SERIES[0]);
    setComponente(log.componente);
    setPeriodo(log.periodo || BIMESTRES[0]);
    setAulas(log.aulas);
    setConteudo(log.conteudo);
    setAtividades(log.atividades);
    setObservacoes(log.observacoes);
    setSelectedObjetoIds(log.selectedObjetoIds || []);
    setSelectedHabilidadeIds(log.selectedHabilidadeIds || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro de aula?')) return;
    
    if (!isDemoMode) {
      const { error } = await supabase
        .from('aulas_ministradas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir registro no Supabase:', error);
        showNotification('error', 'Erro ao excluir o registro de aula no banco de dados.');
        return;
      }
      showNotification('success', 'Registro de aula removido do Supabase.');
    } else {
      showNotification('success', 'Registro de aula removido.');
    }

    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    if (isDemoMode) {
      localStorage.setItem('sigar_aulas_ministradas', JSON.stringify(updated));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setAnoSerie(ANOS_SERIES[0]);
    setPeriodo(BIMESTRES[0]);
    setConteudo('');
    setAtividades('');
    setObservacoes('');
    setAulas(2);
    setSelectedObjetoIds([]);
    setSelectedHabilidadeIds([]);
  };

  // Compute options for history filters dynamically (Matching Notas.tsx behavior)
  const historyOptions = useMemo(() => {
    const escolasMap = new Map<string, string>();
    const anosSet = new Set<string>();
    const turmasSet = new Set<string>();
    const componentesSet = new Set<string>();
    const bimestresSet = new Set<string>();
    const professoresSet = new Set<string>();

    logs.forEach(log => {
      const matchEscola = !historyFilterEscola || log.escolaId === historyFilterEscola;
      const matchAno = !historyFilterAnoSerie || log.anoSerie === historyFilterAnoSerie;
      const matchTurma = !historyFilterTurma || log.turmaNome === historyFilterTurma;
      const matchComp = !historyFilterComponente || log.componente === historyFilterComponente;
      const matchBimestre = !historyFilterBimestre || log.periodo === historyFilterBimestre;
      const profName = getTeacherName(log.professor);
      const matchProf = !historyFilterProfessor || profName === historyFilterProfessor;

      // 1. Escolas
      if (log.escolaId && log.escolaNome) {
        if (matchAno && matchTurma && matchComp && matchBimestre && matchProf) {
          escolasMap.set(log.escolaId, log.escolaNome);
        }
      }

      // 2. Anos/Séries (Filter out Early Childhood Education and "Outros")
      if (log.anoSerie && !isEducaInfantilYear(log.anoSerie) && log.anoSerie !== 'Outros') {
        if (matchEscola && matchTurma && matchComp && matchBimestre && matchProf) {
          anosSet.add(log.anoSerie);
        }
      }

      // 3. Turmas
      if (log.turmaNome) {
        if (matchEscola && matchAno && matchComp && matchBimestre && matchProf) {
          turmasSet.add(log.turmaNome);
        }
      }

      // 4. Componentes (Filter out Early Childhood Campos de Experiência)
      if (log.componente && !isCampoExperienciaInfantil(log.componente)) {
        if (matchEscola && matchAno && matchTurma && matchBimestre && matchProf) {
          componentesSet.add(log.componente);
        }
      }

      // 5. Bimestres
      if (log.periodo) {
        if (matchEscola && matchAno && matchTurma && matchComp && matchProf) {
          bimestresSet.add(log.periodo);
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
      ANOS_SERIES.forEach(a => {
        if (!isEducaInfantilYear(a) && a !== 'Outros') anosSet.add(a);
      });
    }

    if (componentesSet.size === 0) {
      COMPONENTES.forEach(c => componentesSet.add(c));
    }

    if (bimestresSet.size === 0) {
      BIMESTRES.forEach(b => bimestresSet.add(b));
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
    logs, 
    escolas, 
    currentUser, 
    coordenadoresList,
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

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      // Exclude Early Childhood Education entries from Fundamental history
      if (l.anoSerie && isEducaInfantilYear(l.anoSerie)) return false;
      if (l.componente && isCampoExperienciaInfantil(l.componente)) return false;

      const matchesSearch = !searchTerm || 
        l.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.componente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.turmaNome.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEscola = !historyFilterEscola || l.escolaId === historyFilterEscola;

      const matchesAnoSerie = !historyFilterAnoSerie || 
        l.anoSerie === historyFilterAnoSerie || 
        l.anoSerie?.toLowerCase().includes(historyFilterAnoSerie.toLowerCase());

      const matchesTurma = !historyFilterTurma || 
        l.turmaNome === historyFilterTurma || 
        l.turmaNome?.toLowerCase().includes(historyFilterTurma.toLowerCase()) || 
        l.turmaId === historyFilterTurma;

      const matchesComponente = !historyFilterComponente || 
        l.componente.toLowerCase() === historyFilterComponente.toLowerCase();

      const matchesBimestre = !historyFilterBimestre || 
        l.periodo.toLowerCase() === historyFilterBimestre.toLowerCase();

      const profName = getTeacherName(l.professor);
      const matchesProfessor = !historyFilterProfessor || 
        profName.toLowerCase() === historyFilterProfessor.toLowerCase() ||
        (l.professor && l.professor.toLowerCase() === historyFilterProfessor.toLowerCase());

      return matchesSearch && matchesEscola && matchesAnoSerie && matchesTurma && matchesComponente && matchesBimestre && matchesProfessor;
    });
  }, [
    logs,
    searchTerm,
    historyFilterEscola,
    historyFilterAnoSerie,
    historyFilterTurma,
    historyFilterComponente,
    historyFilterBimestre,
    historyFilterProfessor,
    coordenadoresList,
    currentUser
  ]);

  // Pagination Math
  const totalHistoryItems = filteredLogs.length;
  const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryItems / historyItemsPerPage));
  const safeHistoryCurrentPage = Math.min(historyCurrentPage, totalHistoryPages);

  const paginatedLogsHistory = useMemo(() => {
    const start = (safeHistoryCurrentPage - 1) * historyItemsPerPage;
    return filteredLogs.slice(start, start + historyItemsPerPage);
  }, [filteredLogs, safeHistoryCurrentPage, historyItemsPerPage]);

  const handlePrint = (log: ClassLog) => {
    setPrintLog(log);
    setTimeout(() => {
      window.print();
      setPrintLog(null);
    }, 150);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      <PageHeader 
        title="Aulas ministradas"
        subtitle="Registro diário das aulas ministradas e conteúdos letivos desenvolvidos"
        icon={ClipboardList}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {subHeader}

      {/* Printable Area - Hidden on Screen */}
      {printLog && createPortal(
        <div id="print-report" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
          
          {/* ====== INSTITUTIONAL HEADER ====== */}
          <div className="text-center mb-3 pb-3" style={{ borderBottom: '2pt solid #0f172a' }}>
            <p style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '2pt' }}>
              ESTADO DO MARANHÃO
            </p>
            <p style={{ fontSize: '10pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '2pt' }}>
              PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
            </p>
            <p style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '10pt' }}>
              SECRETARIA MUNICIPAL DE EDUCAÇÃO
            </p>
            <div style={{ width: '60pt', height: '1.5pt', background: '#f97316', margin: '0 auto 6pt' }} />
            <h1 style={{ fontSize: '16pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 4pt' }}>
              REGISTRO DIÁRIO DE AULAS MINISTRADAS
            </h1>
            <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              DIÁRIO DE CLASSE • ENSINO FUNDAMENTAL
            </p>
          </div>

          {/* ====== PROTOCOL & EMISSION ====== */}
          <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6pt 10pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '10pt' }}>
            <div>
              <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                Identificação do Documento
              </p>
              <p style={{ fontSize: '12pt', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                REGISTRO Nº {printLog.id?.split('-')[0].toUpperCase() || 'REF'}/{new Date().getFullYear()}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                Emissão do Sistema
              </p>
              <p style={{ fontSize: '9pt', fontWeight: 600, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* ====== IDENTIFICATION BLOCK ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '12pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt', marginBottom: '0' }}>
              Dados de Identificação
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '22%', background: '#f8fafc' }}>
                    Unidade Escolar
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                    {printLog.escolaNome}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '22%' }}>
                    Turma / Turno
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155', width: '28%' }}>
                    {printLog.turmaNome}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '22%' }}>
                    Componente Curricular
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a', width: '28%' }}>
                    {printLog.componente}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Ano / Série
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                    {printLog.anoSerie || '---'}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Bimestre / Período
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                    {printLog.periodo || '---'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Data da Aula
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a' }}>
                    {new Date(printLog.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Quantidade / Sequência
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                    {printLog.aulas} {printLog.aulas === 1 ? 'aula' : 'aulas'} {logSequences[printLog.id]?.lessonRange ? `(${logSequences[printLog.id]?.lessonRange})` : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ====== CONTEÚDO MINISTRADO ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
              Conteúdo Ministrado
            </div>
            <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt' }}>
              <p className="whitespace-pre-line">{printLog.conteudo}</p>
            </div>
          </div>

          {/* ====== PROCEDIMENTOS METODOLÓGICOS (GUIA DE APRENDIZAGEM) ====== */}
          {(() => {
            const matchedGuia = getMatchingGuia(printLog);
            return (
              <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
                <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                  Procedimentos Metodológicos
                </div>
                <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt' }}>
                  {matchedGuia?.metodologia ? (
                    <p className="whitespace-pre-line">{matchedGuia.metodologia}</p>
                  ) : (
                    <p className="whitespace-pre-line">{printLog.atividades || 'Procedimentos metodológicos desenvolvidos em conformidade com o planejamento curricular.'}</p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ====== RECURSOS DIDÁTICOS & CRITÉRIOS DE AVALIAÇÃO (GUIA DE APRENDIZAGEM) ====== */}
          {(() => {
            const matchedGuia = getMatchingGuia(printLog);
            return (
              <div className="print-avoid-break" style={{ marginBottom: '10pt', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt' }}>
                <div>
                  <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                    Recursos Didáticos
                  </div>
                  <div style={{ padding: '8pt 10pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.5', minHeight: '35pt' }}>
                    <p className="whitespace-pre-line">{matchedGuia?.recursos || 'Quadro branco, livros didáticos, caderno e materiais pedagógicos complementares.'}</p>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                    Critérios de Avaliação
                  </div>
                  <div style={{ padding: '8pt 10pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.5', minHeight: '35pt' }}>
                    <p className="whitespace-pre-line">{matchedGuia?.avaliacao || 'Acompanhamento contínuo, participação e resolução das atividades propostas.'}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ====== OBSERVAÇÕES / OCORRÊNCIAS ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
              Observações / Ocorrências
            </div>
            <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt' }}>
              <p className="whitespace-pre-line">{printLog.observacoes || 'Sem observações registradas.'}</p>
            </div>
          </div>

          {/* ====== SIGNATURES ====== */}
          <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '24pt', marginTop: '16pt' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1.5pt solid #0f172a', width: '100%', marginBottom: '6pt' }} />
              <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                Assinatura do Docente
              </p>
              <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                {printLog.professor || 'DOCENTE RESPONSÁVEL'}
              </p>
              <p style={{ fontSize: '7pt', color: '#94a3b8', fontStyle: 'italic' }}>
                Assinatura e Carimbo
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1.5pt solid #0f172a', width: '100%', marginBottom: '6pt' }} />
              <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                Direção / Coordenação Pedagógica
              </p>
              <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                EQUIPE GESTORA / PEDAGÓGICA
              </p>
              <p style={{ fontSize: '7pt', color: '#94a3b8', fontStyle: 'italic' }}>
                Assinatura e Carimbo
              </p>
            </div>
          </div>

          {/* ====== FOOTER ====== */}
          <div className="print-footer" style={{ marginTop: '24pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '6pt' }}>
            <span>SIGAR • Sistema Integrado de Gestão de Aprendizagem</span>
            <span>Secretaria Municipal de Educação • Humberto de Campos/MA</span>
          </div>
        </div>,
        document.body
      )}

      {/* Document Sheet Viewer Modal (Style of Atas Finais & Guia de Aprendizagem) */}
      {viewingLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-slate-100 rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden">
            
            {/* Top Toolbar */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center border border-orange-100 shadow-sm">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight uppercase">
                    Registro de Aula Ministrada
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {viewingLog.escolaNome} • {viewingLog.turmaNome} • {viewingLog.componente}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="primary" 
                  onClick={() => handlePrint(viewingLog)}
                  className="bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 py-2 px-4 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Documento
                </Button>
                <button
                  onClick={() => setViewingLog(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  title="Fechar visualizador"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Sheet Body Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 max-w-3xl mx-auto space-y-6 text-slate-900">
                
                {/* Header */}
                <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                  <p className="text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">ESTADO DO MARANHÃO</p>
                  <p className="text-xs font-black tracking-[0.15em] text-slate-900 uppercase">PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS</p>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">SECRETARIA MUNICIPAL DE EDUCAÇÃO</p>
                  <div className="w-16 h-0.5 bg-brand-orange mx-auto my-2" />
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">REGISTRO DIÁRIO DE AULAS MINISTRADAS</h2>
                  <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">DIÁRIO DE CLASSE • ENSINO FUNDAMENTAL</p>
                </div>

                {/* Identification Table */}
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-t-lg">
                    Dados de Identificação
                  </div>
                  <div className="border border-slate-200 rounded-b-lg overflow-hidden text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 border-b border-slate-100">
                      <span className="p-2.5 bg-slate-50 font-bold text-slate-500 uppercase text-[10px] border-r border-slate-100">Unidade Escolar</span>
                      <span className="p-2.5 font-bold text-slate-800 sm:col-span-3">{viewingLog.escolaNome}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100">
                      <span className="p-2.5 bg-slate-50 font-bold text-slate-500 uppercase text-[10px] border-r border-slate-100">Turma / Turno</span>
                      <span className="p-2.5 font-semibold text-slate-700 sm:border-r border-slate-100">{viewingLog.turmaNome}</span>
                      <span className="p-2.5 bg-slate-50 font-bold text-slate-500 uppercase text-[10px] border-r border-slate-100">Componente</span>
                      <span className="p-2.5 font-bold text-slate-800">{viewingLog.componente}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100">
                      <span className="p-2.5 bg-slate-50 font-bold text-slate-500 uppercase text-[10px] border-r border-slate-100">Ano / Série</span>
                      <span className="p-2.5 font-semibold text-slate-700 sm:border-r border-slate-100">{viewingLog.anoSerie || '---'}</span>
                      <span className="p-2.5 bg-slate-50 font-bold text-slate-500 uppercase text-[10px] border-r border-slate-100">Bimestre</span>
                      <span className="p-2.5 font-semibold text-slate-700">{viewingLog.periodo || '---'}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4">
                      <span className="p-2.5 bg-slate-50 font-bold text-slate-500 uppercase text-[10px] border-r border-slate-100">Data da Aula</span>
                      <span className="p-2.5 font-bold text-slate-800 sm:border-r border-slate-100">{new Date(viewingLog.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      <span className="p-2.5 bg-slate-50 font-bold text-slate-500 uppercase text-[10px] border-r border-slate-100">Quantidade</span>
                      <span className="p-2.5 font-semibold text-slate-700">{viewingLog.aulas} {viewingLog.aulas === 1 ? 'aula' : 'aulas'} {logSequences[viewingLog.id]?.lessonRange ? `(${logSequences[viewingLog.id]?.lessonRange})` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Conteúdo Ministrado */}
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-t-lg">
                    Conteúdo Ministrado
                  </div>
                  <div className="border border-slate-200 rounded-b-lg p-3.5 text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                    {viewingLog.conteudo}
                  </div>
                </div>

                {/* Procedimentos Metodológicos */}
                {(() => {
                  const matchedGuia = getMatchingGuia(viewingLog);
                  return (
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-t-lg flex items-center justify-between">
                        <span>Procedimentos Metodológicos</span>
                        {matchedGuia && <span className="text-[9px] text-orange-200 font-bold">Integrado ao Guia de Aprendizagem</span>}
                      </div>
                      <div className="border border-slate-200 rounded-b-lg p-3.5 text-xs font-medium text-slate-700 leading-relaxed space-y-2">
                        {matchedGuia?.metodologia ? (
                          <p className="whitespace-pre-line">{matchedGuia.metodologia}</p>
                        ) : (
                          <p className="whitespace-pre-line">{viewingLog.atividades || 'Procedimentos metodológicos desenvolvidos em conformidade com o planejamento curricular.'}</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Recursos Didáticos & Critérios de Avaliação */}
                {(() => {
                  const matchedGuia = getMatchingGuia(viewingLog);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-t-lg">
                          Recursos Didáticos
                        </div>
                        <div className="border border-slate-200 rounded-b-lg p-3 text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line min-h-[50px]">
                          {matchedGuia?.recursos || 'Quadro branco, livros didáticos, caderno e materiais pedagógicos complementares.'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-t-lg">
                          Critérios de Avaliação
                        </div>
                        <div className="border border-slate-200 rounded-b-lg p-3 text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line min-h-[50px]">
                          {matchedGuia?.avaliacao || 'Acompanhamento contínuo, participação e resolução das atividades propostas.'}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Observações / Ocorrências */}
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-t-lg">
                    Observações / Ocorrências
                  </div>
                  <div className="border border-slate-200 rounded-b-lg p-3.5 text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                    {viewingLog.observacoes || 'Sem observações registradas.'}
                  </div>
                </div>

                {/* Assinaturas */}
                <div className="grid grid-cols-2 gap-10 pt-8 mt-6 border-t border-slate-200 text-center">
                  <div>
                    <div className="border-t-2 border-slate-800 w-full mb-2" />
                    <p className="text-xs font-black uppercase text-slate-900">Assinatura do Docente</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{viewingLog.professor || 'DOCENTE RESPONSÁVEL'}</p>
                  </div>
                  <div>
                    <div className="border-t-2 border-slate-800 w-full mb-2" />
                    <p className="text-xs font-black uppercase text-slate-900">Direção / Coordenação</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">EQUIPE GESTORA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <FileText className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
            {editingId ? 'Editar Registro de Aula' : 'Novo Registro de Aula'}
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {isBlocked && (
            <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-4 flex items-start gap-3 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase">Lançamento Bloqueado</h4>
                <p className="text-[11px] font-semibold text-amber-700 mt-0.5 leading-relaxed">
                  O período letivo selecionado ({periodo}) ou a data ({new Date(dataAula + 'T12:00:00').toLocaleDateString('pt-BR')}) estão fora do prazo letivo permitido ou foram bloqueados manualmente pela rede de ensino. Apenas a visualização está liberada.
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="date" 
                  value={dataAula}
                  onChange={e => setDataAula(e.target.value)}
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
                value={anoSerie}
                onChange={e => setAnoSerie(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              >
                {availableAnosSeries.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Período *</label>
              <select 
                value={periodo}
                onChange={e => setPeriodo(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              >
                {BIMESTRES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Qtd. Aulas *</label>
              <select 
                value={aulas}
                onChange={e => setAulas(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'aula' : 'aulas'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Progresso Curricular das Habilidades */}
          {skillStats.total > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 animate-fade-in shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="text-brand-orange w-4 h-4" />
                    Progresso Curricular das Habilidades no Período
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                    {skillStats.worked} de {skillStats.total} Habilidades trabalhadas nesta turma ({skillStats.percentage}%)
                  </p>
                </div>
                
                <div className="w-full md:w-auto text-right">
                  <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    skillStats.missing === 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-brand-orange/10 text-brand-orange'
                  }`}>
                    {skillStats.missing === 0 ? '✓ 100% Concluído' : `Faltam trabalhar ${skillStats.missing} habilidades`}
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden border border-slate-100">
                <div 
                  className="bg-brand-orange h-full rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${skillStats.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Painel de Seleção Rápida */}
          {planData.objetos.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 animate-fade-in shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="text-brand-orange w-4 h-4" />
                  Vincular Conteúdo do Plano de Curso Unificado
                </h3>
                <span className="text-[10px] text-slate-500 font-bold bg-slate-200 px-2 py-0.5 rounded-full uppercase tracking-tight">
                  {periodo} • {anoSerie} • {componente}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Objetos de Conhecimento Column */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col space-y-2">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-wider border-b pb-1.5 flex justify-between items-center">
                    <span>Objetos de Conhecimento ({planData.objetos.length})</span>
                    {selectedObjetoIds.length > 0 && (
                      <span className="text-[9px] bg-brand-orange/15 text-brand-orange font-bold px-1.5 py-0.2 rounded-full">
                        {selectedObjetoIds.length} selecionado(s)
                      </span>
                    )}
                  </h4>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {planData.objetos.map((obj: any) => {
                      const isSelected = selectedObjetoIds.includes(obj.id);
                      const isAlreadyUsed = previouslyUsedData.usedObjetos.has(obj.id);
                      return (
                        <button
                          type="button"
                          key={obj.id}
                          onClick={() => toggleObjetoSelection(obj.id)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex gap-2.5 items-start ${
                            isSelected 
                              ? 'border-brand-orange bg-brand-orange/5 text-slate-800 shadow-sm font-semibold' 
                              : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 text-slate-600'
                          }`}
                        >
                          <div className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected 
                              ? 'border-brand-orange bg-brand-orange text-white' 
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold leading-normal break-words block text-slate-700">{obj.descricao}</span>
                            {isAlreadyUsed && (
                              <span className="inline-flex items-center gap-1 text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 mt-1">
                                ⚠️ Já ministrado anteriormente em outra aula
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Habilidades BNCC Column */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col space-y-2">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-wider border-b pb-1.5 flex justify-between items-center">
                    <span>Habilidades BNCC ({planData.habilidades.length})</span>
                    {selectedHabilidadeIds.length > 0 && (
                      <span className="text-[9px] bg-brand-orange/15 text-brand-orange font-bold px-1.5 py-0.2 rounded-full">
                        {selectedHabilidadeIds.length} selecionada(s)
                      </span>
                    )}
                  </h4>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {planData.habilidades.length === 0 ? (
                      <p className="text-slate-400 text-xs italic text-center py-6">Nenhuma habilidade neste plano.</p>
                    ) : (
                      planData.habilidades.map((hab: any) => {
                        const isSelected = selectedHabilidadeIds.includes(hab.id);
                        const isAlreadyUsed = previouslyUsedData.usedHabilidades.has(hab.id);
                        return (
                          <button
                            type="button"
                            key={hab.id}
                            onClick={() => toggleHabilidadeSelection(hab.id)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex gap-2.5 items-start ${
                              isSelected 
                                ? 'border-brand-orange bg-brand-orange/5 text-slate-800 shadow-sm font-semibold' 
                                : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 text-slate-600'
                            }`}
                          >
                            <div className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected 
                                ? 'border-brand-orange bg-brand-orange text-white' 
                                : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="bg-brand-orange/10 text-brand-orange text-[9px] font-black px-1.5 py-0.5 rounded font-mono">
                                  {hab.codigo}
                                </span>
                                {isAlreadyUsed && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5">
                                    ⚠️ Já utilizado
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold leading-normal text-slate-600 text-[11px] break-words">{hab.descricao}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conteúdo Letivo Ministrado (Always visible and editable) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Conteúdo Letivo Ministrado *
              </label>
              {planData.objetos.length > 0 && (
                <span className="text-[10px] text-brand-orange font-bold">
                  {selectedObjetoIds.length > 0 || selectedHabilidadeIds.length > 0 
                    ? '✓ Preenchido a partir das seleções da BNCC (editável)' 
                    : 'Selecione os itens acima ou digite livremente'}
                </span>
              )}
            </div>
            <textarea 
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
              placeholder="Descreva o conteúdo desenvolvido nesta aula..."
              required
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
            />
          </div>

          {/* Linked Guia de Aprendizagem Indicator */}
          {activeFormGuia && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3 animate-fade-in shadow-sm">
              <Bookmark className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 leading-relaxed">
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-emerald-700 block mb-0.5">
                  Guia de Aprendizagem Vinculado ({activeFormGuia.titulo || 'Ativo'})
                </span>
                Procedimentos Metodológicos, Recursos Didáticos e Critérios de Avaliação cadastrados na guia serão puxados automaticamente na impressão e na visualização oficial deste registro.
              </div>
            </div>
          )}

          {/* Observações / Ocorrências Pedagógicas */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Observações / Ocorrências Pedagógicas
            </label>
            <textarea 
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Ex: Aluno X apresentou dificuldades conceituais, aula remanejada, registro de faltas ou ocorrências pedagógicas/disciplinares..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm} className="rounded-xl text-xs font-bold py-2">
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="primary" disabled={isBlocked} className="rounded-xl text-xs font-black py-2 bg-brand-orange hover:bg-orange-600 shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
              <Save className="w-4 h-4" />
              {editingId ? 'Salvar Edição' : 'Salvar Registro'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Saved logs list */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Histórico de Aulas Ministradas</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Veja todas as aulas ministradas registradas no diário de classe</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por conteúdo..."
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
                  <th className="px-6 py-4">Ano/Série / Período</th>
                  <th className="px-6 py-4">Conteúdo Desenvolvido</th>
                  <th className="px-6 py-4 text-center">Aulas</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      Nenhuma aula ministrada registrada.
                    </td>
                  </tr>
                ) : (
                  paginatedLogsHistory.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-800">
                          {new Date(log.data + 'T12:00:00').toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight truncate max-w-[200px]">
                          {log.escolaNome}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{log.turmaNome}</div>
                        <div className="text-[10px] text-brand-orange font-bold uppercase mt-0.5">
                          {log.componente}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{log.anoSerie || '---'}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                          {log.periodo || '---'}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-semibold text-slate-800 line-clamp-1">{log.conteudo}</div>
                        {log.observacoes && (
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            Obs: {log.observacoes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="font-bold text-slate-800">
                          {logSequences[log.id]?.lessonRange || 'Aula ---'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                          ({log.aulas} {log.aulas === 1 ? 'aula' : 'aulas'})
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setViewingLog(log)} 
                            className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-all cursor-pointer" 
                            title="Visualizar Registro de Aula"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            onClick={() => handlePrint(log)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" 
                            title="Imprimir Relatório"
                          >
                            <Printer size={15} />
                          </button>
                          <button 
                            onClick={() => handleEdit(log)} 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer" 
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(log.id)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" 
                            title="Excluir"
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
                de <span className="font-bold text-slate-800">{totalHistoryItems}</span> aulas ministradas registradas
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
    </div>
  );
};
