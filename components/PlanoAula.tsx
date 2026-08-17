import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  BookOpen, Plus, Search, Edit2, Trash2, Printer, 
  X, Calendar, School as SchoolIcon, Bookmark, Save,
  Layers, Check, Maximize2, Minimize2, ListFilter, RotateCcw, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, Clock, MessageSquare, Eye, FileText
} from 'lucide-react';
import { Escola, Coordenador } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';
import { SearchableSchoolSelect } from './ui/SearchableSchoolSelect';
import { isEducaInfantilYear, isCampoExperienciaInfantil, normalizeSubjectName } from '../utils';

interface PlanoAulaProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
  subHeader?: React.ReactNode;
}

interface LessonPlan {
  id: string;
  data: string;
  dataInicio?: string;
  dataTermino?: string;
  dataCriacao?: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  componente: string;
  titulo: string;
  objetivos: string;
  habilidades: string;
  metodologia: string;
  recursos: string;
  avaliacao: string;
  criadoEm: string;
  anoSerie: string;
  periodo: string;
  professor?: string;
  status?: 'Em Análise' | 'Aprovado' | 'Devolvido para Correção';
  observacaoCoordenacao?: string;
  avaliadoPor?: string;
  avaliadoEm?: string;
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
  'EJA',
  'Outros'
];

export const PlanoAula: React.FC<PlanoAulaProps> = ({ escolas, isDemoMode, isAdmin, userEmail, currentUser, subHeader }) => {
  const { showNotification } = useNotification();
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPlan, setViewingPlan] = useState<LessonPlan | null>(null);
  const [dataPlan, setDataPlan] = useState(new Date().toISOString().split('T')[0]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataTermino, setDataTermino] = useState('');
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [anoSerie, setAnoSerie] = useState(ANOS_SERIES[0]);
  const [componente, setComponente] = useState(COMPONENTES[0]);
  const [periodo, setPeriodo] = useState(BIMESTRES[0]);
  const [titulo, setTitulo] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [habilidades, setHabilidades] = useState('');
  const [metodologia, setMetodologia] = useState('');
  const [recursos, setRecursos] = useState('');
  const [avaliacao, setAvaliacao] = useState('');
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});

  // Evaluation Modal & Filter state
  const [evaluatingPlan, setEvaluatingPlan] = useState<LessonPlan | null>(null);
  const [evalObsText, setEvalObsText] = useState('');
  const [evalTargetStatus, setEvalTargetStatus] = useState<'Aprovado' | 'Devolvido para Correção'>('Aprovado');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('');

  const canEvaluateGuia = useMemo(() => {
    if (isAdmin) return true;
    if (!currentUser?.funcao) return true;
    const f = currentUser.funcao.toLowerCase();
    return f.includes('coordenador') || f.includes('gestor') || f.includes('diretor') || f.includes('administrador') || f.includes('técnico') || f.includes('tecnico');
  }, [isAdmin, currentUser]);

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

  const allowedComponentes = useMemo(() => {
    if (currentUser && currentUser.funcao === 'Professor') {
      if (selectedTurmaId) {
        return currentUser.turmaComponentes?.[selectedTurmaId] || [];
      }
      const allTeacherAssigned = Object.values(currentUser.turmaComponentes || {}).flat();
      return Array.from(new Set(allTeacherAssigned));
    }
    return COMPONENTES;
  }, [currentUser, selectedTurmaId]);

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

  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);



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
      console.error('Erro ao buscar planos de curso do Supabase para guias:', err);
    }
  };

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

  // Reset selection when grade/component/period changes
  useEffect(() => {
    setSelectedObjetoIds([]);
    setSelectedHabilidadeIds([]);
  }, [componente, anoSerie, periodo]);

  // Auto-fill form values from interactive selections
  const updateTextFromSelections = (objIds: string[], habIds: string[]) => {
    const selectedObjs = planData.objetos
      .filter((o: any) => objIds.includes(o.id))
      .map((o: any) => o.descricao);
    
    const selectedHabs = planData.habilidades
      .filter((h: any) => habIds.includes(h.id))
      .map((h: any) => `${h.codigo}: ${h.descricao}`);
      
    setObjetivos(selectedObjs.join('\n'));
    setHabilidades(selectedHabs.join('\n'));
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

  // Pre-populate selections when editing existing plan
  useEffect(() => {
    if (editingId && activeCoursePlan) {
      const matchedObjIds = planData.objetos
        .filter((o: any) => objetivos.includes(o.descricao))
        .map((o: any) => o.id);
        
      const matchedHabIds = planData.habilidades
        .filter((h: any) => habilidades.includes(h.codigo) || habilidades.includes(h.descricao))
        .map((h: any) => h.id);
        
      setSelectedObjetoIds(matchedObjIds);
      setSelectedHabilidadeIds(matchedHabIds);
    }
  }, [editingId, activeCoursePlan]);

  // History Filter States & Teacher Map
  const [coordenadoresList, setCoordenadoresList] = useState<any[]>([]);
  const [historyFilterEscola, setHistoryFilterEscola] = useState('');
  const [historyFilterAnoSerie, setHistoryFilterAnoSerie] = useState('');
  const [historyFilterTurma, setHistoryFilterTurma] = useState('');
  const [historyFilterComponente, setHistoryFilterComponente] = useState('');
  const [historyFilterBimestre, setHistoryFilterBimestre] = useState('');
  const [historyFilterProfessor, setHistoryFilterProfessor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Print Mode State
  const [printPlan, setPrintPlan] = useState<LessonPlan | null>(null);

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
        console.error('Erro ao carregar coordenadores:', err);
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

  const fetchRealPlans = async () => {
    try {
      // Fetch all records with chunking to surpass Supabase 1000-row limit
      let allPlansData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('guias_aprendizagem')
          .select('*')
          .or('ativo.eq.true,ativo.is.null')
          .order('data', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
          allPlansData = allPlansData.concat(data);
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      // Also we need to get turmas for all schools to map their names properly
      const { data: allTurmas, error: turmasError } = await supabase
        .from('turmas')
        .select('id, name, year, shift')
        .range(0, 4999);
      
      const turmaMap = new Map<string, string>();
      if (!turmasError && allTurmas) {
        allTurmas.forEach((t: any) => {
          turmaMap.set(String(t.id), `${t.name || t.year} • ${t.shift || ''}`);
        });
      }

      let filteredPlansData = allPlansData;
      if (!isAdmin && currentUser && currentUser.funcao !== 'Administrador') {
        const userSchoolIds = (currentUser?.escolasIds || []).map(String);
        if (userSchoolIds.length > 0) {
          filteredPlansData = filteredPlansData.filter((p: any) => userSchoolIds.includes(String(p.escola_id)));
        }
      }
      if (currentUser && currentUser.funcao === 'Professor') {
        const assignedIds = (currentUser.turmasIds || []).map(String);
        const currentEmail = (userEmail || currentUser?.contato || '').toLowerCase().trim();

        filteredPlansData = filteredPlansData.filter((p: any) => {
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

      const formattedPlans: LessonPlan[] = filteredPlansData.map((p: any) => {
        const escolaObj = escolas.find(esc => String(esc.id) === String(p.escola_id));
        const escolaNome = escolaObj ? escolaObj.nome : (p.escola_nome || 'Unidade');
        const turmaNome = turmaMap.get(String(p.turma_id)) || p.turma_nome || p.turmaNome || 'Turma';
        const criacaoData = p.data_criacao || (p.created_at ? p.created_at.split('T')[0] : (p.data || new Date().toISOString().split('T')[0]));

        return {
          id: p.id,
          data: p.data || p.data_inicio || criacaoData,
          dataCriacao: criacaoData,
          dataInicio: p.data_inicio || '',
          dataTermino: p.data_termino || '',
          escolaId: String(p.escola_id),
          escolaNome,
          turmaId: String(p.turma_id),
          turmaNome,
          componente: normalizeSubjectName(p.componente),
          titulo: p.titulo,
          objetivos: p.objetivos || '',
          habilidades: p.habilidades || '',
          metodologia: p.metodologia || '',
          recursos: p.recursos || '',
          avaliacao: p.avaliacao || '',
          anoSerie: p.ano_serie,
          periodo: p.periodo,
          criadoEm: p.created_at,
          professor: getTeacherName(p.updated_by || p.created_by || p.professor),
          status: p.status || 'Em Análise',
          observacaoCoordenacao: p.observacao_coordenacao || p.observacaoCoordenacao || '',
          avaliadoPor: p.avaliado_por || p.avaliadoPor || '',
          avaliadoEm: p.avaliado_em || p.avaliadoEm || ''
        };
      });

      setPlans(formattedPlans);
    } catch (err) {
      console.error('Erro ao buscar guias de aprendizagem do Supabase:', err);
      showNotification('error', 'Erro ao carregar dados do Supabase. Utilizando dados locais.');
    }
  };

  // Load from localStorage or Supabase
  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('sigar_planos_aula');
      if (saved) {
        try {
          setPlans(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      if (allowedEscolas.length > 0) {
        fetchRealPlans();
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

    if (!selectedEscolaId || !selectedTurmaId || !titulo.trim() || !objetivos.trim()) {
      showNotification('error', 'Preencha todos os campos obrigatórios (*).');
      return;
    }

    if (!dataInicio || !dataTermino) {
      showNotification('warning', 'Informe a data de Início do Guia e Término do Guia.');
      return;
    }

    if (dataTermino < dataInicio) {
      showNotification('error', 'A data de Término do Guia não pode ser anterior à data de Início do Guia.');
      return;
    }

    const escolaNome = escolas.find(e => e.id === selectedEscolaId)?.nome || 'Unidade';
    const turmaObj = turmas.find(t => t.id === selectedTurmaId);
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.year} • ${turmaObj.shift || ''}` : 'Turma';

    const existingPlan = editingId ? plans.find(p => p.id === editingId) : null;
    const criacaoDate = existingPlan
      ? (existingPlan.dataCriacao || (existingPlan.criadoEm ? existingPlan.criadoEm.split('T')[0] : existingPlan.data))
      : new Date().toISOString().split('T')[0];

    const payload: LessonPlan = {
      id: editingId || crypto.randomUUID(),
      data: dataInicio || dataPlan || criacaoDate,
      dataCriacao: criacaoDate,
      dataInicio,
      dataTermino,
      escolaId: selectedEscolaId,
      escolaNome,
      turmaId: selectedTurmaId,
      turmaNome,
      componente,
      titulo,
      objetivos,
      habilidades,
      metodologia,
      recursos,
      avaliacao,
      anoSerie,
      periodo,
      criadoEm: new Date().toISOString(),
      status: 'Em Análise',
      observacaoCoordenacao: editingId ? (plans.find(p => p.id === editingId)?.observacaoCoordenacao || '') : ''
    };

    if (!isDemoMode) {
      const dbPayload = {
        id: payload.id,
        data: payload.data,
        data_criacao: payload.dataCriacao,
        data_inicio: payload.dataInicio,
        data_termino: payload.dataTermino,
        escola_id: payload.escolaId,
        turma_id: payload.turmaId,
        componente: payload.componente,
        titulo: payload.titulo,
        objetivos: payload.objetivos,
        habilidades: payload.habilidades,
        metodologia: payload.metodologia,
        recursos: payload.recursos,
        avaliacao: payload.avaliacao,
        ano_serie: payload.anoSerie,
        periodo: payload.periodo,
        status: payload.status || 'Em Análise',
        observacao_coordenacao: payload.observacaoCoordenacao || '',
        avaliado_por: payload.avaliadoPor || null,
        avaliado_em: payload.avaliadoEm || null,
        ativo: true,
        updated_at: new Date().toISOString(),
        updated_by: userEmail || currentUser?.contato || 'user'
      };

      const { error } = await supabase
        .from('guias_aprendizagem')
        .upsert(dbPayload);

      if (error) {
        console.error('Erro ao salvar guia no Supabase:', error);
        showNotification('error', 'Erro ao salvar a guia de aprendizagem no banco de dados.');
        return;
      }

      if (editingId) {
        setPlans(plans.map(p => p.id === editingId ? payload : p));
        showNotification('success', 'Guia de Aprendizagem atualizada com sucesso no Supabase!');
      } else {
        setPlans([payload, ...plans]);
        showNotification('success', 'Guia de Aprendizagem cadastrada com sucesso no Supabase!');
      }
    } else {
      let updatedPlans: LessonPlan[];
      if (editingId) {
        updatedPlans = plans.map(p => p.id === editingId ? payload : p);
        showNotification('success', 'Guia de Aprendizagem atualizada com sucesso!');
      } else {
        updatedPlans = [payload, ...plans];
        showNotification('success', 'Guia de Aprendizagem cadastrada com sucesso!');
      }

      setPlans(updatedPlans);
      localStorage.setItem('sigar_planos_aula', JSON.stringify(updatedPlans));
    }

    resetForm();
  };

  const handleEdit = (plan: LessonPlan) => {
    setEditingId(plan.id);
    setDataPlan(plan.dataCriacao || (plan.criadoEm ? plan.criadoEm.split('T')[0] : (plan.data || new Date().toISOString().split('T')[0])));
    setDataInicio(plan.dataInicio || '');
    setDataTermino(plan.dataTermino || '');
    setSelectedEscolaId(plan.escolaId);
    // Timeout to let turmas update and then select
    setTimeout(() => {
      setSelectedTurmaId(plan.turmaId);
    }, 150);
    setAnoSerie(plan.anoSerie || ANOS_SERIES[0]);
    setComponente(plan.componente);
    setPeriodo(plan.periodo || BIMESTRES[0]);
    setTitulo(plan.titulo);
    setObjetivos(plan.objetivos);
    setHabilidades(plan.habilidades);
    setMetodologia(plan.metodologia);
    setRecursos(plan.recursos);
    setAvaliacao(plan.avaliacao);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta Guia de Aprendizagem?')) return;
    
    if (!isDemoMode) {
      const { error } = await supabase
        .from('guias_aprendizagem')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar guia no Supabase:', error);
        showNotification('error', 'Erro ao excluir a guia de aprendizagem no banco de dados.');
        return;
      }
      showNotification('success', 'Guia de Aprendizagem removida do Supabase.');
    } else {
      showNotification('success', 'Guia de Aprendizagem removida.');
    }

    const updated = plans.filter(p => p.id !== id);
    setPlans(updated);
    if (isDemoMode) {
      localStorage.setItem('sigar_planos_aula', JSON.stringify(updated));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setDataPlan(new Date().toISOString().split('T')[0]);
    setDataInicio('');
    setDataTermino('');
    setAnoSerie(ANOS_SERIES[0]);
    setPeriodo(BIMESTRES[0]);
    setTitulo('');
    setObjetivos('');
    setHabilidades('');
    setMetodologia('');
    setRecursos('');
    setAvaliacao('');
    setSelectedObjetoIds([]);
    setSelectedHabilidadeIds([]);
  };

  // History Options & Filtered plans memoization
  const historyOptions = useMemo(() => {
    const escolasMap = new Map<string, string>();
    const anosSet = new Set<string>();
    const turmasSet = new Set<string>();
    const componentesSet = new Set<string>();
    const bimestresSet = new Set<string>();
    const professoresSet = new Set<string>();

    plans.forEach(plan => {
      // Exclude ECE entries and campos de experiência from Fundamental view
      if (plan.anoSerie && isEducaInfantilYear(plan.anoSerie)) return;
      if (plan.componente && isCampoExperienciaInfantil(plan.componente)) return;

      const normComp = normalizeSubjectName(plan.componente);
      const profName = getTeacherName(plan.professor);

      const matchEscola = !historyFilterEscola || String(plan.escolaId) === String(historyFilterEscola);
      const matchAno = !historyFilterAnoSerie || plan.anoSerie === historyFilterAnoSerie;
      const matchTurma = !historyFilterTurma || plan.turmaNome === historyFilterTurma || String(plan.turmaId) === String(historyFilterTurma);
      const matchComp = !historyFilterComponente || normComp === historyFilterComponente;
      const matchBimestre = !historyFilterBimestre || plan.periodo === historyFilterBimestre;
      const matchProf = !historyFilterProfessor || profName === historyFilterProfessor || plan.professor === historyFilterProfessor;

      // Escolas
      if (plan.escolaId && plan.escolaNome) {
        if (matchAno && matchTurma && matchComp && matchBimestre && matchProf) {
          escolasMap.set(String(plan.escolaId), plan.escolaNome);
        }
      }

      // Anos/Séries
      if (plan.anoSerie) {
        if (matchEscola && matchTurma && matchComp && matchBimestre && matchProf) {
          anosSet.add(plan.anoSerie);
        }
      }

      // Turmas
      if (plan.turmaNome) {
        if (matchEscola && matchAno && matchComp && matchBimestre && matchProf) {
          turmasSet.add(plan.turmaNome);
        }
      }

      // Componentes
      if (normComp) {
        if (matchEscola && matchAno && matchTurma && matchBimestre && matchProf) {
          componentesSet.add(normComp);
        }
      }

      // Bimestres
      if (plan.periodo) {
        if (matchEscola && matchAno && matchTurma && matchComp && matchProf) {
          bimestresSet.add(plan.periodo);
        }
      }

      // Professores
      if (profName) {
        if (matchEscola && matchAno && matchTurma && matchComp && matchBimestre) {
          professoresSet.add(profName);
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
  }, [plans, historyFilterEscola, historyFilterAnoSerie, historyFilterTurma, historyFilterComponente, historyFilterBimestre, historyFilterProfessor, coordMap]);

  const openEvaluationModal = (plan: LessonPlan, initialStatus: 'Aprovado' | 'Devolvido para Correção') => {
    setEvaluatingPlan(plan);
    setEvalTargetStatus(initialStatus);
    setEvalObsText(plan.observacaoCoordenacao || '');
  };

  const handleSaveEvaluation = async () => {
    if (!evaluatingPlan) return;

    if (evalTargetStatus === 'Devolvido para Correção' && !evalObsText.trim()) {
      showNotification('error', 'Por favor, informe a observação do que deve ser ajustado.');
      return;
    }

    const avaliadorNome = currentUser?.nome || userEmail || 'Coordenador';
    const nowIso = new Date().toISOString();

    const updatedPlan: LessonPlan = {
      ...evaluatingPlan,
      status: evalTargetStatus,
      observacaoCoordenacao: evalObsText.trim(),
      avaliadoPor: avaliadorNome,
      avaliadoEm: nowIso
    };

    if (!isDemoMode) {
      const { error } = await supabase
        .from('guias_aprendizagem')
        .update({
          status: evalTargetStatus,
          observacao_coordenacao: evalObsText.trim(),
          avaliado_por: avaliadorNome,
          avaliado_em: nowIso,
          updated_at: nowIso,
          updated_by: avaliadorNome
        })
        .eq('id', evaluatingPlan.id);

      if (error) {
        console.error('Erro ao atualizar avaliação no Supabase:', error);
        showNotification('error', 'Erro ao salvar avaliação no banco de dados.');
        return;
      }
    }

    const updatedPlans = plans.map(p => p.id === evaluatingPlan.id ? updatedPlan : p);
    setPlans(updatedPlans);
    if (isDemoMode) {
      localStorage.setItem('sigar_planos_aula', JSON.stringify(updatedPlans));
    }

    showNotification('success', evalTargetStatus === 'Aprovado' 
      ? 'Guia de Aprendizagem APROVADA com sucesso!' 
      : 'Guia de Aprendizagem DEVOLVIDA para correção.');

    setEvaluatingPlan(null);
    setEvalObsText('');
  };

  const renderStatusBadge = (status?: string) => {
    const currentStatus = status || 'Em Análise';
    if (currentStatus === 'Aprovado') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprovado
        </span>
      );
    }
    if (currentStatus === 'Devolvido para Correção') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
          <AlertCircle className="w-3 h-3 text-rose-600" /> Devolvido para Correção
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
        <Clock className="w-3 h-3 text-amber-600" /> Em Análise
      </span>
    );
  };

  const hasActiveHistoryFilters = Boolean(
    historyFilterEscola || historyFilterAnoSerie || historyFilterTurma || historyFilterComponente || historyFilterBimestre || historyFilterProfessor || historyFilterStatus
  );

  const handleClearHistoryFilters = () => {
    setHistoryFilterEscola('');
    setHistoryFilterAnoSerie('');
    setHistoryFilterTurma('');
    setHistoryFilterComponente('');
    setHistoryFilterBimestre('');
    setHistoryFilterProfessor('');
    setHistoryFilterStatus('');
  };

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      // Exclude ECE entries and campos de experiência from Fundamental view
      if (plan.anoSerie && isEducaInfantilYear(plan.anoSerie)) return false;
      if (plan.componente && isCampoExperienciaInfantil(plan.componente)) return false;

      const normComp = normalizeSubjectName(plan.componente);
      const profName = getTeacherName(plan.professor);

      if (historyFilterEscola && String(plan.escolaId) !== String(historyFilterEscola)) return false;
      if (historyFilterAnoSerie && plan.anoSerie !== historyFilterAnoSerie) return false;
      if (historyFilterTurma && plan.turmaNome !== historyFilterTurma && String(plan.turmaId) !== String(historyFilterTurma)) return false;
      if (historyFilterComponente && normComp !== historyFilterComponente) return false;
      if (historyFilterBimestre && plan.periodo !== historyFilterBimestre) return false;
      if (historyFilterProfessor && profName !== historyFilterProfessor && plan.professor !== historyFilterProfessor) return false;
      if (historyFilterStatus && (plan.status || 'Em Análise') !== historyFilterStatus) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesTitulo = (plan.titulo || '').toLowerCase().includes(term);
        const matchesObjetivos = (plan.objetivos || '').toLowerCase().includes(term);
        const matchesEscola = (plan.escolaNome || '').toLowerCase().includes(term);
        const matchesTurma = (plan.turmaNome || '').toLowerCase().includes(term);
        const matchesComp = normComp.toLowerCase().includes(term);
        if (!matchesTitulo && !matchesObjetivos && !matchesEscola && !matchesTurma && !matchesComp) return false;
      }

      return true;
    });
  }, [plans, historyFilterEscola, historyFilterAnoSerie, historyFilterTurma, historyFilterComponente, historyFilterBimestre, historyFilterProfessor, historyFilterStatus, searchTerm, coordMap]);

  // Reset pagination to page 1 whenever any filter changes
  useEffect(() => {
    setHistoryCurrentPage(1);
  }, [historyFilterEscola, historyFilterAnoSerie, historyFilterTurma, historyFilterComponente, historyFilterBimestre, historyFilterProfessor, historyFilterStatus, searchTerm]);

  // Pagination Math
  const totalHistoryItems = filteredPlans.length;
  const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryItems / historyItemsPerPage));
  const safeHistoryCurrentPage = Math.min(historyCurrentPage, totalHistoryPages);

  const paginatedPlansHistory = useMemo(() => {
    const start = (safeHistoryCurrentPage - 1) * historyItemsPerPage;
    return filteredPlans.slice(start, start + historyItemsPerPage);
  }, [filteredPlans, safeHistoryCurrentPage, historyItemsPerPage]);

  const printCoursePlan = useMemo(() => {
    if (!printPlan) return null;
    return coursePlans.find((p: any) => 
      p.componente === printPlan.componente && 
      p.anoSerie === printPlan.anoSerie && 
      p.bimestre === printPlan.periodo
    );
  }, [coursePlans, printPlan]);

  const printPlanData = useMemo(() => {
    if (!printCoursePlan || !printCoursePlan.itens) {
      return { objetos: [], habilidades: [], links: [] };
    }
    
    const objetosMap = new Map<string, any>();
    const habilidadesMap = new Map<string, any>();
    const links: { objetoId: string; habilidadeId: string }[] = [];
    
    printCoursePlan.itens.forEach((item: any) => {
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
  }, [printCoursePlan]);

  const printedObjectsAndSkills = useMemo(() => {
    if (!printPlan) return [];
    
    const { objetos, habilidades, links } = printPlanData;
    
    // Find which objects from course plan are selected in the printPlan
    const selectedObjs = objetos.filter((o: any) => 
      printPlan.objetivos.toLowerCase().includes(o.descricao.toLowerCase().trim())
    );
    
    // Find which skills from course plan are selected in the printPlan
    const selectedHabs = habilidades.filter((h: any) => 
      printPlan.habilidades.toLowerCase().includes(h.codigo.toLowerCase().trim())
    );

    // Group selected skills by selected objects
    const grouped: { objeto: string; habilidades: string[] }[] = [];
    const matchedHabIds = new Set<string>();

    selectedObjs.forEach((obj: any) => {
      // Find links for this object
      const linkedHabIds = links
        .filter(l => l.objetoId === obj.id)
        .map(l => l.habilidadeId);
      
      const linkedHabs = selectedHabs.filter((h: any) => linkedHabIds.includes(h.id));
      
      grouped.push({
        objeto: obj.descricao,
        habilidades: linkedHabs.map((h: any) => `${h.codigo}: ${h.descricao}`)
      });

      linkedHabs.forEach((h: any) => matchedHabIds.add(h.id));
    });

    // Are there any selected skills that weren't linked to any selected object?
    const orphanedHabs = selectedHabs.filter((h: any) => !matchedHabIds.has(h.id));
    if (orphanedHabs.length > 0) {
      grouped.push({
        objeto: 'Outras Habilidades Vinculadas',
        habilidades: orphanedHabs.map((h: any) => `${h.codigo}: ${h.descricao}`)
      });
    }

    return grouped;
  }, [printPlan, printPlanData]);

  const handlePrint = (plan: LessonPlan) => {
    setPrintPlan(plan);
    setTimeout(() => {
      window.print();
      setPrintPlan(null);
    }, 150);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      <PageHeader 
        title="Guia de Aprendizagem"
        subtitle="Elaboração e acompanhamento de guias de aprendizagem para os professores"
        icon={BookOpen}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {subHeader}

      {/* Printable Area - Hidden on Screen */}
      {printPlan && createPortal(
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
              GUIA DE APRENDIZAGEM DOCENTE
            </h1>
            <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              ENSINO FUNDAMENTAL
            </p>
          </div>

          {/* ====== PROTOCOL & EMISSION ====== */}
          <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6pt 10pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '10pt' }}>
            <div>
              <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                Identificação do Documento
              </p>
              <p style={{ fontSize: '12pt', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                GUIA Nº {printPlan.id?.split('-')[0].toUpperCase() || 'REF'}/{new Date().getFullYear()}
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
                    {printPlan.escolaNome}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '22%' }}>
                    Turma / Ano
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155', width: '28%' }}>
                    {printPlan.turmaNome} {printPlan.anoSerie ? `— ${printPlan.anoSerie}` : ''}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '22%' }}>
                    Componente Curricular
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a', width: '28%' }}>
                    {printPlan.componente}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Período de Utilização
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a' }}>
                    {printPlan.dataInicio && printPlan.dataTermino
                      ? `${new Date(printPlan.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(printPlan.dataTermino + 'T12:00:00').toLocaleDateString('pt-BR')}`
                      : new Date(printPlan.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Data de Elaboração / Criação
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                    {new Date((printPlan.dataCriacao || (printPlan.criadoEm ? printPlan.criadoEm.split('T')[0] : printPlan.data)) + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Bimestre / Período
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                    {printPlan.periodo || '---'}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Título da Aula
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a' }}>
                    {printPlan.titulo}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ====== CONTENT SECTIONS ====== */}
          <div className="space-y-3">
            {printedObjectsAndSkills.length > 0 ? (
              <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
                <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                  Objetos de Conhecimento e Habilidades BNCC Associadas
                </div>
                <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '8pt' }}>
                  {printedObjectsAndSkills.map((group, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', padding: '8pt 10pt', border: '0.5pt solid #e2e8f0', borderRadius: '4pt' }}>
                      <p style={{ fontSize: '8.5pt', fontWeight: 700, color: '#0f172a', margin: '0 0 4pt' }}>
                        <strong>Objeto de Conhecimento:</strong> {group.objeto}
                      </p>
                      {group.habilidades.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '14pt', listStyleType: 'disc' }}>
                          {group.habilidades.map((hab, hIdx) => (
                            <li key={hIdx} style={{ fontSize: '7.5pt', color: '#334155', lineHeight: '1.4' }}>
                              {hab}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ fontSize: '7.5pt', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                          Nenhuma habilidade BNCC explicitamente vinculada neste objeto.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
                  <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                    Objetivos de Aprendizagem / Objetos de Conhecimento
                  </div>
                  <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt' }}>
                    <p className="whitespace-pre-line">{printPlan.objetivos}</p>
                  </div>
                </div>
                
                {printPlan.habilidades && (
                  <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
                    <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                      Habilidades BNCC
                    </div>
                    <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt' }}>
                      <p className="whitespace-pre-line">{printPlan.habilidades}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
              <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                Procedimentos Metodológicos
              </div>
              <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt' }}>
                <p className="whitespace-pre-line">{printPlan.metodologia || '---'}</p>
              </div>
            </div>

            {printPlan.recursos && (
              <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
                <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                  Recursos Didáticos
                </div>
                <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt' }}>
                  <p className="whitespace-pre-line">{printPlan.recursos}</p>
                </div>
              </div>
            )}

            <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
              <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                Critérios de Avaliação
              </div>
              <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt' }}>
                <p className="whitespace-pre-line">{printPlan.avaliacao || '---'}</p>
              </div>
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
                PROFESSOR(A) RESPONSÁVEL
              </p>
              <p style={{ fontSize: '7pt', color: '#94a3b8', fontStyle: 'italic' }}>
                Assinatura e Carimbo
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1.5pt solid #0f172a', width: '100%', marginBottom: '6pt' }} />
              <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                Coordenação Pedagógica
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

      {/* Main Content Form */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Bookmark className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
            {editingId ? 'Editar Guia de Aprendizagem' : 'Nova Guia de Aprendizagem'}
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {editingId && plans.find(p => p.id === editingId)?.status === 'Devolvido para Correção' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-rose-900 mb-0.5">
                  Guia Devolvida para Correção pela Coordenação Pedagógica
                </div>
                <p className="text-xs font-medium text-rose-700">
                  {plans.find(p => p.id === editingId)?.observacaoCoordenacao || 'Efetue os ajustes necessários conforme as orientações.'}
                </p>
                {plans.find(p => p.id === editingId)?.avaliadoPor && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-rose-500">
                    Devolvido por: {plans.find(p => p.id === editingId)?.avaliadoPor}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3 items-end">
            {/* 1. DATA DE CRIAÇÃO (Automática e Travada) */}
            <div className="col-span-12 sm:col-span-2 md:col-span-1 lg:col-span-1 min-w-[130px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title="Data de Criação">
                Data de Criação
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="date" 
                  value={dataPlan}
                  disabled
                  readOnly
                  title="A data de criação é registrada automaticamente pelo sistema e não pode ser retroativa ou futura."
                  className="w-full pl-9 pr-2 py-2 border border-slate-200 bg-slate-50/80 text-slate-600 font-bold rounded-xl outline-none text-xs cursor-not-allowed"
                />
              </div>
            </div>

            {/* 2. INÍCIO DO GUIA */}
            <div className="col-span-12 sm:col-span-2 md:col-span-1 lg:col-span-1 min-w-[140px]">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 truncate" title="Início do Guia">
                Início do Guia *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange w-4 h-4" />
                <input 
                  type="date" 
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  required
                  className="w-full pl-9 pr-2 py-2 border border-slate-200 bg-white rounded-xl outline-none text-xs font-semibold focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                />
              </div>
            </div>

            {/* 3. TÉRMINO DO GUIA */}
            <div className="col-span-12 sm:col-span-2 md:col-span-1 lg:col-span-1 min-w-[140px]">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 truncate" title="Término do Guia">
                Término do Guia *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange w-4 h-4" />
                <input 
                  type="date" 
                  value={dataTermino}
                  min={dataInicio}
                  onChange={e => setDataTermino(e.target.value)}
                  required
                  className="w-full pl-9 pr-2 py-2 border border-slate-200 bg-white rounded-xl outline-none text-xs font-semibold focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                />
              </div>
            </div>

            {/* 4. BIMESTRE / ETAPA */}
            <div className="col-span-12 sm:col-span-2 md:col-span-1 lg:col-span-1 min-w-[130px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title="Bimestre / Etapa">
                Bimestre / Etapa *
              </label>
              <select 
                value={periodo}
                onChange={e => setPeriodo(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              >
                {BIMESTRES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* 5. UNIDADE ESCOLAR */}
            <div className="col-span-12 sm:col-span-4 md:col-span-3 lg:col-span-3 min-w-[220px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title="Unidade Escolar">
                Unidade Escolar *
              </label>
              <SearchableSchoolSelect
                escolas={allowedEscolas}
                selectedId={selectedEscolaId}
                onChange={setSelectedEscolaId}
                placeholder="Selecione a Unidade Escolar"
                inputClassName="pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              />
            </div>

            {/* 6. ANO/SÉRIE */}
            <div className="col-span-12 sm:col-span-2 md:col-span-1 lg:col-span-1 min-w-[110px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title="Ano/Série">
                Ano/Série *
              </label>
              <select 
                value={anoSerie}
                onChange={e => setAnoSerie(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              >
                {availableAnosSeries.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* 7. TURMA */}
            <div className="col-span-12 sm:col-span-3 md:col-span-2 lg:col-span-2 min-w-[150px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title="Turma">
                Turma *
              </label>
              <select 
                value={selectedTurmaId}
                onChange={e => setSelectedTurmaId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
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

            {/* 8. COMPONENTE CURRICULAR */}
            <div className="col-span-12 sm:col-span-3 md:col-span-2 lg:col-span-2 min-w-[170px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title="Componente Curricular">
                Componente Curricular *
              </label>
              <select 
                value={componente}
                onChange={e => setComponente(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              >
                {allowedComponentes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título da Guia/Tema da Aula *</label>
            <input 
              type="text" 
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Frações e divisões na prática cotidiana"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            />
          </div>

          {planData.objetos.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 animate-fade-in">
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
                          <span className="font-semibold leading-normal">{obj.descricao}</span>
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
                              </div>
                              <p className="font-semibold leading-normal text-slate-600 text-[11px]">{hab.descricao}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Objeto de Conhecimento *</label>
              <div className="relative group">
                <textarea 
                  value={objetivos}
                  onChange={e => setObjetivos(e.target.value)}
                  placeholder="Descreva o objeto de conhecimento..."
                  required
                  rows={expandedFields['objetivos'] ? 15 : 3}
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
                />
                <button
                  type="button"
                  onClick={() => setExpandedFields(prev => ({ ...prev, objetivos: !prev.objetivos }))}
                  className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors shadow-sm"
                  title={expandedFields['objetivos'] ? "Recolher caixa de texto" : "Expandir caixa de texto"}
                >
                  {expandedFields['objetivos'] ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Habilidades BNCC (Códigos/Descrição)</label>
              <div className="relative group">
                <textarea 
                  value={habilidades}
                  onChange={e => setHabilidades(e.target.value)}
                  placeholder="Ex: EF05MA03, EF05MA04..."
                  rows={expandedFields['habilidades'] ? 15 : 3}
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
                />
                <button
                  type="button"
                  onClick={() => setExpandedFields(prev => ({ ...prev, habilidades: !prev.habilidades }))}
                  className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors shadow-sm"
                  title={expandedFields['habilidades'] ? "Recolher caixa de texto" : "Expandir caixa de texto"}
                >
                  {expandedFields['habilidades'] ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Procedimentos Metodológicos</label>
              <div className="relative group">
                <textarea 
                  value={metodologia}
                  onChange={e => setMetodologia(e.target.value)}
                  placeholder="Como a aula será conduzida..."
                  rows={expandedFields['metodologia'] ? 15 : 3}
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
                />
                <button
                  type="button"
                  onClick={() => setExpandedFields(prev => ({ ...prev, metodologia: !prev.metodologia }))}
                  className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors shadow-sm"
                  title={expandedFields['metodologia'] ? "Recolher caixa de texto" : "Expandir caixa de texto"}
                >
                  {expandedFields['metodologia'] ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Recursos Didáticos</label>
              <div className="relative group">
                <textarea 
                  value={recursos}
                  onChange={e => setRecursos(e.target.value)}
                  placeholder="Livros, projetor, cartolina..."
                  rows={expandedFields['recursos'] ? 15 : 3}
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
                />
                <button
                  type="button"
                  onClick={() => setExpandedFields(prev => ({ ...prev, recursos: !prev.recursos }))}
                  className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors shadow-sm"
                  title={expandedFields['recursos'] ? "Recolher caixa de texto" : "Expandir caixa de texto"}
                >
                  {expandedFields['recursos'] ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Critérios de Avaliação</label>
              <div className="relative group">
                <textarea 
                  value={avaliacao}
                  onChange={e => setAvaliacao(e.target.value)}
                  placeholder="Como o aprendizado será aferido..."
                  rows={expandedFields['avaliacao'] ? 15 : 3}
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
                />
                <button
                  type="button"
                  onClick={() => setExpandedFields(prev => ({ ...prev, avaliacao: !prev.avaliacao }))}
                  className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors shadow-sm"
                  title={expandedFields['avaliacao'] ? "Recolher caixa de texto" : "Expandir caixa de texto"}
                >
                  {expandedFields['avaliacao'] ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm} className="rounded-xl text-xs font-bold py-2">
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="primary" className="rounded-xl text-xs font-black py-2 bg-brand-orange hover:bg-orange-600 shadow-md flex items-center gap-1.5">
              <Save className="w-4 h-4" />
              {editingId ? 'Salvar Edição' : 'Salvar Plano'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Saved plans list */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Histórico de Guias de Aprendizagem</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Consulte, edite ou exporte as guias já elaboradas</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por tema..."
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
            {/* Unidade Escolar */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unidade Escolar</label>
              <select
                value={historyFilterEscola}
                onChange={e => setHistoryFilterEscola(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
              >
                <option value="">Todas as Unidades Escolares</option>
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

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status de Avaliação</label>
              <select
                value={historyFilterStatus}
                onChange={e => setHistoryFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
              >
                <option value="">Todos os Status</option>
                <option value="Em Análise">Em Análise</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Devolvido para Correção">Devolvido para Correção</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Data / Unidade Escolar</th>
                  <th className="px-6 py-4">Turma / Componente</th>
                  <th className="px-6 py-4">Ano/Série / Período</th>
                  <th className="px-6 py-4">Tema da Aula</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                      Nenhuma Guia de Aprendizagem encontrada.
                    </td>
                  </tr>
                ) : (
                  paginatedPlansHistory.map(plan => (
                    <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-800">
                          {plan.dataInicio && plan.dataTermino ? (
                            <span>{new Date(plan.dataInicio + 'T12:00:00').toLocaleDateString()} a {new Date(plan.dataTermino + 'T12:00:00').toLocaleDateString()}</span>
                          ) : (
                            <span>{new Date(plan.data + 'T12:00:00').toLocaleDateString()}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight truncate max-w-[200px]">
                          {plan.escolaNome}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Criado em: {new Date((plan.dataCriacao || (plan.criadoEm ? plan.criadoEm.split('T')[0] : plan.data)) + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{plan.turmaNome}</div>
                        <div className="text-[10px] text-brand-orange font-bold uppercase mt-0.5">
                          {normalizeSubjectName(plan.componente)}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{plan.anoSerie || '---'}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                          {plan.periodo || '---'}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-slate-800 line-clamp-1">{plan.titulo}</div>
                          {renderStatusBadge(plan.status)}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">
                          Obj: {plan.objetivos}
                        </div>
                        {plan.status === 'Devolvido para Correção' && plan.observacaoCoordenacao && (
                          <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Ajustes Solicitados:</span> {plan.observacaoCoordenacao}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEvaluateGuia && (
                            <>
                              <button
                                onClick={() => openEvaluationModal(plan, 'Aprovado')}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Aprovar Guia de Aprendizagem"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                onClick={() => openEvaluationModal(plan, 'Devolvido para Correção')}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Devolver para Correção"
                              >
                                <AlertCircle size={16} />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => setViewingPlan(plan)} 
                            className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-all" 
                            title="Visualizar Guia e Aulas Ministradas"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            onClick={() => handlePrint(plan)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                            title="Imprimir Ficha"
                          >
                            <Printer size={15} />
                          </button>
                          <button 
                            onClick={() => handleEdit(plan)} 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" 
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(plan.id)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
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
                de <span className="font-bold text-slate-800">{totalHistoryItems}</span> guias de aprendizagem registradas
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

      {/* Evaluation Modal for Coordinators */}
      {evaluatingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-brand-orange" />
                <h3 className="text-base font-bold text-slate-800">
                  Avaliar Guia de Aprendizagem
                </h3>
              </div>
              <button
                onClick={() => setEvaluatingPlan(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1 text-xs text-slate-700">
              <div><span className="font-bold text-slate-500 uppercase text-[10px]">Guia / Tema:</span> <span className="font-bold text-slate-800">{evaluatingPlan.titulo}</span></div>
              <div><span className="font-bold text-slate-500 uppercase text-[10px]">Escola / Turma:</span> {evaluatingPlan.escolaNome} — {evaluatingPlan.turmaNome} ({evaluatingPlan.anoSerie})</div>
              <div><span className="font-bold text-slate-500 uppercase text-[10px]">Componente:</span> {evaluatingPlan.componente} ({evaluatingPlan.periodo})</div>
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px]">Período de Utilização:</span>{' '}
                <span className="font-bold text-brand-orange">
                  {evaluatingPlan.dataInicio && evaluatingPlan.dataTermino
                    ? `${new Date(evaluatingPlan.dataInicio + 'T12:00:00').toLocaleDateString()} a ${new Date(evaluatingPlan.dataTermino + 'T12:00:00').toLocaleDateString()}`
                    : new Date(evaluatingPlan.data + 'T12:00:00').toLocaleDateString()}
                </span>
                {' '}&bull;{' '}
                <span className="font-bold text-slate-500 uppercase text-[10px]">Criado em:</span>{' '}
                {new Date((evaluatingPlan.dataCriacao || (evaluatingPlan.criadoEm ? evaluatingPlan.criadoEm.split('T')[0] : evaluatingPlan.data)) + 'T12:00:00').toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Selecione a Decisão
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEvalTargetStatus('Aprovado')}
                  className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                    evalTargetStatus === 'Aprovado'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Aprovar Guia
                </button>
                <button
                  type="button"
                  onClick={() => setEvalTargetStatus('Devolvido para Correção')}
                  className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                    evalTargetStatus === 'Devolvido para Correção'
                      ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Devolver p/ Correção
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Observações da Coordenação {evalTargetStatus === 'Devolvido para Correção' ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal">(Opcional)</span>}
                </label>
                <textarea
                  value={evalObsText}
                  onChange={e => setEvalObsText(e.target.value)}
                  placeholder={evalTargetStatus === 'Devolvido para Correção' 
                    ? "Descreva detalhadamente o que o professor deve ajustar na guia..." 
                    : "Observações ou orientações pedagógicas complementares..."}
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-2xl text-xs outline-none focus:border-brand-orange transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setEvaluatingPlan(null)}>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSaveEvaluation}
                className={evalTargetStatus === 'Aprovado' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
              >
                {evalTargetStatus === 'Aprovado' ? 'Confirmar Aprovação' : 'Confirmar Devolução'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Sheet Viewer Modal (Style of Atas Finais de Resultados) */}
      {viewingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-slate-100 rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden">
            
            {/* Top Toolbar */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 text-brand-orange rounded-2xl border border-orange-100 shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    Visualizador da Guia de Aprendizagem e Aulas Ministradas
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Documento oficial de planejamento curricular docente e acompanhamento pedagógico
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => handlePrint(viewingPlan)}
                  className="flex items-center gap-2 text-xs py-2 px-4 shadow-sm bg-brand-orange hover:bg-brand-orange/90"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Guia</span>
                </Button>
                <button
                  onClick={() => setViewingPlan(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                  title="Fechar Visualização"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Sheet Area */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-200/80">
              <div className="bg-white shadow-2xl max-w-4xl mx-auto p-8 sm:p-14 text-slate-800 font-serif border border-slate-300 rounded-sm">
                
                {/* Official Header */}
                <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                  <h4 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">ESTADO DO MARANHÃO</h4>
                  <h2 className="text-sm font-black tracking-wider text-slate-800 mt-1 uppercase">PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS</h2>
                  <h5 className="text-[9px] font-black tracking-widest text-slate-500 mt-0.5 uppercase">SECRETARIA MUNICIPAL DE EDUCAÇÃO</h5>
                  <div className="w-24 h-0.5 bg-brand-orange mx-auto my-3" />
                  <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                    GUIA DE APRENDIZAGEM DOCENTE E AULAS MINISTRADAS
                  </h1>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    ENSINO FUNDAMENTAL
                  </p>
                </div>

                {/* Protocol Bar */}
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs mb-6 font-sans">
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Identificação do Documento</span>
                    <span className="font-black text-slate-800 text-sm">
                      GUIA Nº {viewingPlan.id.split('-')[0].toUpperCase()}/{new Date().getFullYear()}
                    </span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Status Pedagógico</span>
                      <div className="mt-0.5">{renderStatusBadge(viewingPlan.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Identification Grid Block */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-6 border border-slate-200 p-4 bg-slate-50/70 rounded-lg font-sans">
                  <div className="col-span-2">
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Unidade Escolar</span>
                    <span className="font-black text-slate-800 uppercase text-xs">{viewingPlan.escolaNome}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Turma / Ano</span>
                    <span className="font-bold text-slate-800">{viewingPlan.turmaNome} {viewingPlan.anoSerie ? `— ${viewingPlan.anoSerie}` : ''}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Componente Curricular</span>
                    <span className="font-black text-brand-orange">{viewingPlan.componente}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Início do Guia</span>
                    <span className="font-bold text-slate-800">
                      {viewingPlan.dataInicio ? new Date(viewingPlan.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Término do Guia</span>
                    <span className="font-bold text-slate-800">
                      {viewingPlan.dataTermino ? new Date(viewingPlan.dataTermino + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Bimestre / Etapa</span>
                    <span className="font-bold text-slate-800">{viewingPlan.periodo || '---'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Data de Criação</span>
                    <span className="font-bold text-slate-800">
                      {new Date((viewingPlan.dataCriacao || (viewingPlan.criadoEm ? viewingPlan.criadoEm.split('T')[0] : viewingPlan.data)) + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-4 font-sans text-xs">
                  {/* 1. Tema */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider">
                      1. Título da Aula / Tema da Guia
                    </div>
                    <div className="p-4 bg-white font-bold text-slate-900 text-sm">
                      {viewingPlan.titulo}
                    </div>
                  </div>

                  {/* 2. Objetivos */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider">
                      2. Objetivos de Aprendizagem
                    </div>
                    <div className="p-4 bg-white text-slate-700 leading-relaxed whitespace-pre-line">
                      {viewingPlan.objetivos || 'Nenhum objetivo especificado.'}
                    </div>
                  </div>

                  {/* 3. Habilidades BNCC */}
                  {viewingPlan.habilidades && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider">
                        3. Objetos de Conhecimento e Habilidades BNCC
                      </div>
                      <div className="p-4 bg-white text-slate-700 leading-relaxed whitespace-pre-line font-mono text-[11px]">
                        {viewingPlan.habilidades}
                      </div>
                    </div>
                  )}

                  {/* 4. Metodologia / Aulas Ministradas */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider">
                      4. Procedimentos Metodológicos / Vivências e Aulas Ministradas
                    </div>
                    <div className="p-4 bg-white text-slate-700 leading-relaxed whitespace-pre-line">
                      {viewingPlan.metodologia || 'Não informado.'}
                    </div>
                  </div>

                  {/* 5. Recursos */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider">
                      5. Recursos Didáticos e Tecnológicos
                    </div>
                    <div className="p-4 bg-white text-slate-700 leading-relaxed whitespace-pre-line">
                      {viewingPlan.recursos || 'Não informado.'}
                    </div>
                  </div>

                  {/* 6. Avaliação */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider">
                      6. Critérios e Instrumentos de Avaliação
                    </div>
                    <div className="p-4 bg-white text-slate-700 leading-relaxed whitespace-pre-line">
                      {viewingPlan.avaliacao || 'Não informado.'}
                    </div>
                  </div>

                  {/* 7. Parecer da Coordenação */}
                  {viewingPlan.observacaoCoordenacao && (
                    <div className="border border-amber-200 bg-amber-50/60 rounded-lg overflow-hidden">
                      <div className="bg-amber-600 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Parecer e Orientações da Coordenação Pedagógica</span>
                      </div>
                      <div className="p-4 text-amber-950 leading-relaxed">
                        <p className="font-medium">{viewingPlan.observacaoCoordenacao}</p>
                        {viewingPlan.avaliadoPor && (
                          <div className="mt-2 text-[10px] font-bold text-amber-800">
                            Avaliador(a): {viewingPlan.avaliadoPor} {viewingPlan.avaliadoEm ? `• em ${new Date(viewingPlan.avaliadoEm).toLocaleDateString('pt-BR')}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Signatures Block */}
                  <div className="grid grid-cols-2 gap-8 pt-8 mt-8 border-t border-slate-200 text-center font-sans">
                    <div>
                      <div className="border-t border-slate-800 w-4/5 mx-auto mb-2" />
                      <p className="font-black text-slate-800 uppercase text-[10px]">{viewingPlan.professor || 'Docente Responsável'}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-medium">Assinatura do(a) Professor(a)</p>
                    </div>
                    <div>
                      <div className="border-t border-slate-800 w-4/5 mx-auto mb-2" />
                      <p className="font-black text-slate-800 uppercase text-[10px]">{viewingPlan.avaliadoPor || 'Coordenação Pedagógica'}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-medium">Equipe Gestora / Visto</p>
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[8px] text-slate-400 font-sans uppercase font-bold tracking-wider">
                  <span>SIGAR • Sistema Integrado de Gestão de Aprendizagem</span>
                  <span>Secretaria Municipal de Educação • Humberto de Campos/MA</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
