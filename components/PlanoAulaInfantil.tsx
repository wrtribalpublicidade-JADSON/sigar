import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  BookOpen, Plus, Search, Edit2, Trash2, Printer, 
  X, Calendar, School as SchoolIcon, Bookmark, Save,
  Check, Info, Layers, CheckCircle2, AlertCircle, Clock, MessageSquare, Eye, FileText
} from 'lucide-react';
import { Escola, Coordenador, Segmento } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';
import { SearchableSchoolSelect } from './ui/SearchableSchoolSelect';
import { BNCC_INFANTIL } from './ConselhoClasse';

interface PlanoAulaInfantilProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
  subHeader?: React.ReactNode;
}

interface LessonPlanInfantil {
  id: string;
  data: string;
  dataInicio?: string;
  dataTermino?: string;
  dataCriacao?: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  campoExperiencia: string;
  titulo: string;
  objetivos: string;
  habilidades: string[]; // ECE BNCC objective codes
  metodologia: string;
  recursos: string;
  avaliacao: string;
  anoSerie: string;
  periodo: string;
  criadoEm: string;
  status?: 'Em Análise' | 'Aprovado' | 'Devolvido para Correção';
  observacaoCoordenacao?: string;
  avaliadoPor?: string;
  avaliadoEm?: string;
}

const FAiXAS_ETARIAS = ['Creche II', 'Creche III', 'Pré I', 'Pré II'];

const CAMPOS_EXPERIENCIA = [
  'O eu, o outro e o nós',
  'Corpo, gestos e movimentos',
  'Traços, sons, cores e formas',
  'Escuta, fala, pensamento e imaginação',
  'Espaços, tempos, quantidades, relações e transformações',
  'Interdisciplinar'
];

const PERIODOS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

export const PlanoAulaInfantil: React.FC<PlanoAulaInfantilProps> = ({ 
  escolas, 
  isDemoMode, 
  isAdmin, 
  userEmail, 
  currentUser, 
  subHeader 
}) => {
  const { showNotification } = useNotification();
  const [plans, setPlans] = useState<LessonPlanInfantil[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPlan, setViewingPlan] = useState<LessonPlanInfantil | null>(null);
  const [dataPlan, setDataPlan] = useState(new Date().toISOString().split('T')[0]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataTermino, setDataTermino] = useState('');
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [campoExperiencia, setCampoExperiencia] = useState('O eu, o outro e o nós');
  const [titulo, setTitulo] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [habilidades, setHabilidades] = useState<string[]>([]); // Selected ECE Objective codes
  const [habilidadesText, setHabilidadesText] = useState('');
  const [metodologia, setMetodologia] = useState('');
  const [recursos, setRecursos] = useState('');
  const [avaliacao, setAvaliacao] = useState('');
  const [anoSerie, setAnoSerie] = useState(FAiXAS_ETARIAS[0]);
  const [periodo, setPeriodo] = useState('1º Bimestre');

  // Course Plans integration state
  const [coursePlans, setCoursePlans] = useState<any[]>([]);
  const [selectedObjetoIds, setSelectedObjetoIds] = useState<string[]>([]);
  const [selectedHabilidadeIds, setSelectedHabilidadeIds] = useState<string[]>([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('');

  // Evaluation Modal state
  const [evaluatingPlan, setEvaluatingPlan] = useState<LessonPlanInfantil | null>(null);
  const [evalObsText, setEvalObsText] = useState('');
  const [evalTargetStatus, setEvalTargetStatus] = useState<'Aprovado' | 'Devolvido para Correção'>('Aprovado');

  const canEvaluateGuia = useMemo(() => {
    if (isAdmin) return true;
    if (!currentUser?.funcao) return true;
    const f = currentUser.funcao.toLowerCase();
    return f.includes('coordenador') || f.includes('gestor') || f.includes('diretor') || f.includes('administrador') || f.includes('técnico') || f.includes('tecnico');
  }, [isAdmin, currentUser]);

  // Printing State
  const [printPlan, setPrintPlan] = useState<LessonPlanInfantil | null>(null);

  // Filter schools to only those offering Educação Infantil
  const escolasInfantil = useMemo(() => {
    return escolas.filter(e => 
      e.segmentos && e.segmentos.includes(Segmento.INFANTIL)
    );
  }, [escolas]);

  // Get active school context
  const currentSchoolId = selectedEscolaId || (escolasInfantil.length > 0 ? escolasInfantil[0].id : '');

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

  // Derive unique Ano/Série values directly from loaded turmas
  const availableAnosSeries = useMemo(() => {
    if (turmas.length === 0) return [];
    return FAiXAS_ETARIAS.filter(ano => 
      turmas.some(t => isTurmaInAnoSerie(t, ano))
    );
  }, [turmas]);

  // Filter turmas matching the selected Ano/Série
  const availableTurmas = useMemo(() => {
    if (!anoSerie) return [];
    return turmas.filter(t => isTurmaInAnoSerie(t, anoSerie));
  }, [turmas, anoSerie]);

  // Load ECE turmas based on active school
  useEffect(() => {
    const fetchTurmas = async () => {
      if (!currentSchoolId) return;
      try {
        const { data, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('school_id', currentSchoolId)
          .eq('stage', 'Educação Infantil'); // Only ECE classes

        if (error) throw error;
        
        let filteredTurmas = data || [];
        if (currentUser && currentUser.funcao === 'Professor') {
          const assignedIds = currentUser.turmasIds || [];
          filteredTurmas = filteredTurmas.filter((t: any) => assignedIds.includes(t.id));
        }
        setTurmas(filteredTurmas);
      } catch (err) {
        console.error('Erro ao buscar turmas:', err);
      }
    };

    if (isDemoMode) {
      let mockTurmas = [
        { id: 'demo-t1', name: 'Creche II A', year: 'Creche II', anoSerie: 'Creche II', shift: 'Matutino', stage: 'Educação Infantil' },
        { id: 'demo-t2', name: 'Creche III B', year: 'Creche III', anoSerie: 'Creche III', shift: 'Vespertino', stage: 'Educação Infantil' },
        { id: 'demo-t3', name: 'Pré I A', year: 'Pré-Escola I', anoSerie: 'Pré I', shift: 'Matutino', stage: 'Educação Infantil' },
        { id: 'demo-t4', name: 'Pré II B', year: 'Pré-Escola II', anoSerie: 'Pré II', shift: 'Vespertino', stage: 'Educação Infantil' },
      ];
      if (currentUser && currentUser.funcao === 'Professor') {
        const assignedIds = currentUser.turmasIds || [];
        mockTurmas = mockTurmas.filter(t => assignedIds.includes(t.id));
      }
      setTurmas(mockTurmas);
    } else {
      fetchTurmas();
    }
  }, [currentSchoolId, isDemoMode]);

  // Auto-select first Ano/Série when turmas list changes (school change)
  useEffect(() => {
    if (availableAnosSeries.length > 0) {
      if (!availableAnosSeries.includes(anoSerie)) {
        setAnoSerie(availableAnosSeries[0]);
      }
    } else {
      setAnoSerie('');
    }
  }, [availableAnosSeries, anoSerie]);

  // Auto-select first Turma when Ano/Série changes
  useEffect(() => {
    if (availableTurmas.length > 0) {
      const exists = availableTurmas.some(t => t.id === selectedTurmaId);
      if (!exists) {
        setSelectedTurmaId(availableTurmas[0].id);
      }
    } else {
      setSelectedTurmaId('');
    }
  }, [availableTurmas, selectedTurmaId]);

  // Fetch ECE course plans
  const fetchRealCoursePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('planos_curso_infantil')
        .select('*')
        .eq('ativo', true);

      if (error) throw error;

      const formatted: any[] = (data || []).map((p: any) => ({
        id: p.id,
        anoReferencia: p.ano_referencia,
        componente: p.campo_experiencia,
        bimestre: p.bimestre,
        anoSerie: p.ano_serie,
        itens: p.itens || [],
        criadoEm: p.created_at
      }));

      setCoursePlans(formatted);
    } catch (err) {
      console.error('Erro ao buscar planos de curso ECE para guias:', err);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('sigar_planos_curso_infantil');
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

  // Aggregate ECE Course Plan items (single component or Interdisciplinar all components)
  const planData = useMemo(() => {
    let matchingPlans: any[] = [];
    if (campoExperiencia === 'Interdisciplinar') {
      matchingPlans = coursePlans.filter((p: any) => 
        p.anoSerie === anoSerie && 
        p.bimestre === periodo
      );
    } else {
      const match = coursePlans.find((p: any) => 
        p.componente === campoExperiencia && 
        p.anoSerie === anoSerie && 
        p.bimestre === periodo
      );
      if (match) matchingPlans = [match];
    }

    if (matchingPlans.length === 0) {
      return { objetos: [], habilidades: [], links: [] };
    }
    
    const objetosMap = new Map<string, any>();
    const habilidadesMap = new Map<string, any>();
    const links: { objetoId: string; habilidadeId: string }[] = [];
    
    matchingPlans.forEach((plan: any) => {
      if (plan.itens) {
        plan.itens.forEach((item: any) => {
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
      }
    });
    
    return {
      objetos: Array.from(objetosMap.values()),
      habilidades: Array.from(habilidadesMap.values()),
      links
    };
  }, [coursePlans, campoExperiencia, anoSerie, periodo]);

  // Reset linkage selections when parameters change
  useEffect(() => {
    setSelectedObjetoIds([]);
    setSelectedHabilidadeIds([]);
  }, [campoExperiencia, anoSerie, periodo]);

  // Update text values from linkage selections
  const updateTextFromSelections = (objIds: string[], habIds: string[]) => {
    const selectedObjs = planData.objetos
      .filter((o: any) => objIds.includes(o.id))
      .map((o: any) => o.descricao);
    
    const selectedHabs = planData.habilidades
      .filter((h: any) => habIds.includes(h.id))
      .map((h: any) => `${h.codigo}: ${h.descricao}`);
      
    setObjetivos(selectedObjs.join('\n'));
    setHabilidadesText(selectedHabs.join('\n'));
    setHabilidades(planData.habilidades.filter((h: any) => habIds.includes(h.id)).map((h: any) => h.codigo));
  };

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
    if (editingId && planData.objetos.length > 0) {
      const matchedObjIds = planData.objetos
        .filter((o: any) => objetivos.includes(o.descricao))
        .map((o: any) => o.id);
        
      const matchedHabIds = planData.habilidades
        .filter((h: any) => habilidades.includes(h.codigo) || habilidades.includes(h.descricao))
        .map((h: any) => h.id);
        
      setSelectedObjetoIds(matchedObjIds);
      setSelectedHabilidadeIds(matchedHabIds);
    }
  }, [editingId, planData]);

  const handleHabilidadesTextChange = (value: string) => {
    setHabilidadesText(value);
    const extractedCodes = (value.match(/EI\d{2}[A-Z]{2}\d{2}/g) || []).map(code => code.toUpperCase());
    const uniqueCodes = Array.from(new Set(extractedCodes));
    setHabilidades(uniqueCodes);
  };

  // Helper to retrieve ECE BNCC objective descriptions
  const getObjectiveDescription = (code: string) => {
    let foundDesc = '';
    Object.values(BNCC_INFANTIL).forEach((ageGroups: any) => {
      Object.values(ageGroups).forEach((objectives: any) => {
        const match = objectives.find((o: any) => o.code === code);
        if (match) {
          foundDesc = match.desc;
        }
      });
    });
    return foundDesc;
  };

  // Load lesson guides on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!isDemoMode) {
          const { data, error } = await supabase
            .from('guias_aprendizagem_infantil')
            .select('*')
            .eq('ativo', true)
            .order('data', { ascending: false });

          if (error) throw error;

          let filteredPlansData = data || [];
          if (currentUser && currentUser.funcao === 'Professor') {
            const assignedIds = currentUser.turmasIds || [];
            filteredPlansData = filteredPlansData.filter((d: any) => assignedIds.includes(d.turma_id));
          }

          const formatted: LessonPlanInfantil[] = filteredPlansData.map(d => {
            const criacaoData = d.data_criacao || d.data || (d.created_at ? d.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
            return {
              id: d.id,
              data: criacaoData,
              dataCriacao: criacaoData,
              dataInicio: d.data_inicio || '',
              dataTermino: d.data_termino || '',
              escolaId: d.escola_id,
              escolaNome: escolas.find(e => e.id === d.escola_id)?.nome || 'Unidade',
              turmaId: d.turma_id,
              turmaNome: d.ano_serie, // Placeholder or fetch
              campoExperiencia: d.campo_experiencia,
              titulo: d.titulo,
              objetivos: d.objetivos,
              habilidades: typeof d.habilidades === 'string' ? JSON.parse(d.habilidades) : (d.habilidades || []),
              metodologia: d.metodologia,
              recursos: d.recursos,
              avaliacao: d.avaliacao,
              anoSerie: d.ano_serie,
              periodo: d.periodo,
              criadoEm: d.created_at,
              status: d.status || 'Em Análise',
              observacaoCoordenacao: d.observacao_coordenacao || d.observacaoCoordenacao || '',
              avaliadoPor: d.avaliado_por || d.avaliadoPor || '',
              avaliadoEm: d.avaliado_em || d.avaliadoEm || ''
            };
          });
          setPlans(formatted);
        } else {
          const saved = localStorage.getItem('sigar_guias_aprendizagem_infantil');
          if (saved) {
            setPlans(JSON.parse(saved));
          }
        }
      } catch (err) {
        console.error('Erro ao buscar guias de aprendizagem:', err);
      }
    };

    loadData();
  }, [isDemoMode, escolas]);

  // Handle Save
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
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.anoSerie || turmaObj.year} • ${turmaObj.shift || turmaObj.turno || ''}` : 'Turma';

    // Parse any manually typed or edited codes from the textarea
    const extractedCodes = (habilidadesText.match(/EI\d{2}[A-Z]{2}\d{2}/g) || []).map(code => code.toUpperCase());
    const finalHabilidades = Array.from(new Set([...habilidades, ...extractedCodes]));

    const criacaoDate = editingId
      ? (plans.find(p => p.id === editingId)?.dataCriacao || plans.find(p => p.id === editingId)?.data || dataPlan)
      : new Date().toISOString().split('T')[0];

    const payload: LessonPlanInfantil = {
      id: editingId || crypto.randomUUID(),
      data: criacaoDate,
      dataCriacao: criacaoDate,
      dataInicio,
      dataTermino,
      escolaId: selectedEscolaId,
      escolaNome,
      turmaId: selectedTurmaId,
      turmaNome,
      campoExperiencia,
      titulo,
      objetivos,
      habilidades: finalHabilidades,
      metodologia,
      recursos,
      avaliacao,
      anoSerie,
      periodo,
      criadoEm: new Date().toISOString(),
      status: 'Em Análise',
      observacaoCoordenacao: editingId ? (plans.find(p => p.id === editingId)?.observacaoCoordenacao || '') : ''
    };

    try {
      if (!isDemoMode) {
        const dbPayload = {
          id: payload.id,
          data: payload.data,
          data_criacao: payload.dataCriacao,
          data_inicio: payload.dataInicio,
          data_termino: payload.dataTermino,
          escola_id: payload.escolaId,
          turma_id: payload.turmaId,
          campo_experiencia: payload.campoExperiencia,
          titulo: payload.titulo,
          objetivos: payload.objetivos,
          habilidades: JSON.stringify(payload.habilidades),
          metodologia: payload.metodologia,
          recursos: payload.recursos,
          avaliacao: payload.avaliacao,
          ano_serie: payload.anoSerie,
          periodo: payload.periodo,
          status: payload.status || 'Em Análise',
          observacao_coordenacao: payload.observacaoCoordenacao || '',
          avaliado_por: payload.avaliadoPor || null,
          avaliado_em: payload.avaliadoEm || null,
          updated_at: new Date().toISOString(),
          updated_by: userEmail || currentUser?.contato || 'user'
        };

        const { error } = await supabase
          .from('guias_aprendizagem_infantil')
          .upsert(dbPayload);

        if (error) throw error;
      }

      let updatedPlans: LessonPlanInfantil[];
      if (editingId) {
        updatedPlans = plans.map(p => p.id === editingId ? payload : p);
        showNotification('success', 'Guia ECE atualizada com sucesso!');
      } else {
        updatedPlans = [payload, ...plans];
        showNotification('success', 'Guia ECE cadastrada com sucesso!');
      }

      setPlans(updatedPlans);
      if (isDemoMode) {
        localStorage.setItem('sigar_guias_aprendizagem_infantil', JSON.stringify(updatedPlans));
      }

      resetForm();
    } catch (err) {
      console.error('Erro ao salvar guia de aprendizagem:', err);
      showNotification('error', 'Falha ao gravar os dados.');
    }
  };

  const handleEdit = (plan: LessonPlanInfantil) => {
    setEditingId(plan.id);
    setDataPlan(plan.dataCriacao || plan.data || new Date().toISOString().split('T')[0]);
    setDataInicio(plan.dataInicio || '');
    setDataTermino(plan.dataTermino || '');
    setSelectedEscolaId(plan.escolaId);
    setTimeout(() => {
      setSelectedTurmaId(plan.turmaId);
    }, 150);
    setCampoExperiencia(plan.campoExperiencia);
    setTitulo(plan.titulo);
    setObjetivos(plan.objetivos);
    
    // Set Habilidades lists
    const habsList = plan.habilidades || [];
    setHabilidades(habsList);
    
    const textLines: string[] = [];
    habsList.forEach(code => {
      const desc = getObjectiveDescription(code);
      if (desc) {
        textLines.push(`${code}: ${desc}`);
      } else {
        textLines.push(`${code}`);
      }
    });
    setHabilidadesText(textLines.join('\n'));

    setMetodologia(plan.metodologia);
    setRecursos(plan.recursos);
    setAvaliacao(plan.avaliacao);
    setAnoSerie(plan.anoSerie);
    setPeriodo(plan.periodo);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover esta guia de aprendizagem?')) return;

    try {
      if (!isDemoMode) {
        const { error } = await supabase
          .from('guias_aprendizagem_infantil')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
      }

      const updated = plans.filter(p => p.id !== id);
      setPlans(updated);
      if (isDemoMode) {
        localStorage.setItem('sigar_guias_aprendizagem_infantil', JSON.stringify(updated));
      }
      showNotification('success', 'Guia de aprendizagem removida com sucesso!');
    } catch (err) {
      console.error('Erro ao remover guia:', err);
      showNotification('error', 'Erro ao excluir do banco.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setDataPlan(new Date().toISOString().split('T')[0]);
    setDataInicio('');
    setDataTermino('');
    setTitulo('');
    setObjetivos('');
    setHabilidades([]);
    setHabilidadesText('');
    setMetodologia('');
    setRecursos('');
    setAvaliacao('');
    setSelectedObjetoIds([]);
    setSelectedHabilidadeIds([]);
  };

  const handlePrint = (plan: LessonPlanInfantil) => {
    setPrintPlan(plan);
    setTimeout(() => {
      window.print();
      setPrintPlan(null);
    }, 150);
  };

  const openEvaluationModal = (plan: LessonPlanInfantil, initialStatus: 'Aprovado' | 'Devolvido para Correção') => {
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

    const updatedPlan: LessonPlanInfantil = {
      ...evaluatingPlan,
      status: evalTargetStatus,
      observacaoCoordenacao: evalObsText.trim(),
      avaliadoPor: avaliadorNome,
      avaliadoEm: nowIso
    };

    if (!isDemoMode) {
      const { error } = await supabase
        .from('guias_aprendizagem_infantil')
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

    const updatedList = plans.map(p => p.id === evaluatingPlan.id ? updatedPlan : p);
    setPlans(updatedList);
    if (isDemoMode) {
      localStorage.setItem('sigar_guias_aprendizagem_infantil', JSON.stringify(updatedList));
    }

    showNotification('success', evalTargetStatus === 'Aprovado' 
      ? 'Guia ECE APROVADA com sucesso!' 
      : 'Guia ECE DEVOLVIDA para correção.');

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

  // Filtered plans for historical view
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const matchesSearch = 
        plan.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.objetivos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.campoExperiencia.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSchool = schoolFilter === 'ALL' || plan.escolaId === schoolFilter;
      const matchesClass = classFilter === 'ALL' || plan.turmaId === classFilter;
      const matchesStatus = !historyFilterStatus || (plan.status || 'Em Análise') === historyFilterStatus;

      return matchesSearch && matchesSchool && matchesClass && matchesStatus;
    });
  }, [plans, searchTerm, schoolFilter, classFilter, historyFilterStatus]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative text-left">
      <PageHeader 
        title="Guia de Aprendizagem - Educação Infantil"
        subtitle="Registro de projetos de vivências, campos de experiência e mediação pedagógica"
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
              EDUCAÇÃO INFANTIL
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
                    Faixa Etária / Grupo
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155', width: '28%' }}>
                    {printPlan.anoSerie}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '22%' }}>
                    Campo de Experiência
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a', width: '28%' }}>
                    {printPlan.campoExperiencia}
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
                    {new Date((printPlan.dataCriacao || printPlan.data) + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Bimestre / Período
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                    {printPlan.periodo}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Faixa Etária / Grupo
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                    {printPlan.anoSerie}
                  </td>
                </tr>
                {printPlan.titulo && (
                  <tr>
                    <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                      Projeto / Tema
                    </td>
                    <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                      {printPlan.titulo}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ====== OBJETIVOS DE DESENVOLVIMENTO BNCC ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
              Objetivos de Desenvolvimento BNCC Trabalhados
            </div>
            <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none' }}>
              {printPlan.habilidades && printPlan.habilidades.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '14pt', listStyleType: 'disc' }}>
                  {printPlan.habilidades.map(code => {
                    const desc = getObjectiveDescription(code);
                    return (
                      <li key={code} style={{ fontSize: '8pt', color: '#334155', lineHeight: '1.5', marginBottom: '2pt' }}>
                        <strong style={{ color: '#0f172a' }}>{code}</strong>{desc ? `: ${desc}` : ''}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p style={{ fontSize: '9pt', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Nenhum objetivo específico selecionado.</p>
              )}
            </div>
          </div>

          {/* ====== VIVÊNCIAS / CAMPO DE EXPERIÊNCIA ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
              Vivências / Campo de Experiência
            </div>
            <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt' }}>
              <p className="whitespace-pre-wrap">{printPlan.objetivos}</p>
            </div>
          </div>

          {/* ====== VIVÊNCIAS E METODOLOGIA APLICADA ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
              Vivências e Metodologia Aplicada
            </div>
            <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt' }}>
              <p className="whitespace-pre-wrap">{printPlan.metodologia}</p>
            </div>
          </div>

          {/* ====== RECURSOS E AVALIAÇÃO ====== */}
          <div className="grid grid-cols-2 gap-4 print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div>
              <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                Recursos Didáticos
              </div>
              <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '40pt' }}>
                <p className="whitespace-pre-wrap">{printPlan.recursos}</p>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                Avaliação / Registros Pedagógicos
              </div>
              <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '40pt' }}>
                <p className="whitespace-pre-wrap">{printPlan.avaliacao}</p>
              </div>
            </div>
          </div>

          {/* ====== SIGNATURES ====== */}
          <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '24pt', marginTop: '16pt' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1.5pt solid #0f172a', width: '100%', marginBottom: '6pt' }} />
              <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                Assinatura do Professor(a)
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
                Assinatura da Coordenação Pedagógica
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
            {editingId ? 'Editar Guia de Aprendizagem ECE' : 'Nova Guia de Aprendizagem ECE'}
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
                {PERIODOS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* 5. UNIDADE ESCOLAR */}
            <div className="col-span-12 sm:col-span-4 md:col-span-3 lg:col-span-3 min-w-[220px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title="Unidade Escolar">
                Unidade Escolar *
              </label>
              <SearchableSchoolSelect
                escolas={escolasInfantil}
                selectedId={selectedEscolaId}
                onChange={setSelectedEscolaId}
                placeholder="Selecione a Unidade Escolar"
                inputClassName="pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              />
            </div>

            {/* 6. GRUPO/FAIXA ETÁRIA */}
            <div className="col-span-12 sm:col-span-2 md:col-span-1 lg:col-span-1 min-w-[120px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title="Grupo/Faixa Etária">
                Grupo/Faixa Etária *
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
                    <option key={t.id} value={t.id}>{`${t.name || t.anoSerie || t.year} • ${t.shift || t.turno || ''}`}</option>
                  ))
                )}
              </select>
            </div>

            {/* 8. CAMPO DE EXPERIÊNCIA */}
            <div className="col-span-12 sm:col-span-3 md:col-span-2 lg:col-span-2 min-w-[170px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title="Campo de Experiência">
                Campo de Experiência *
              </label>
              <select 
                value={campoExperiencia}
                onChange={e => setCampoExperiencia(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              >
                {CAMPOS_EXPERIENCIA.map(c => (
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
              placeholder="Ex: Projeto Identidade - Quem sou eu?"
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
                  {periodo} • {anoSerie} • {campoExperiencia}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Campo de Experiência Column */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col space-y-2">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-wider border-b pb-1.5 flex justify-between items-center">
                    <span>Campo de Experiência ({planData.objetos.length})</span>
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

                {/* Objetivos de Aprendizagem e Desenvolvimento Column */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col space-y-2">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-wider border-b pb-1.5 flex justify-between items-center">
                    <span>Objetivos de Aprendizagem e Desenvolvimento ({planData.habilidades.length})</span>
                    {selectedHabilidadeIds.length > 0 && (
                      <span className="text-[9px] bg-brand-orange/15 text-brand-orange font-bold px-1.5 py-0.2 rounded-full">
                        {selectedHabilidadeIds.length} selecionada(s)
                      </span>
                    )}
                  </h4>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {planData.habilidades.length === 0 ? (
                      <p className="text-slate-400 text-xs italic text-center py-6">Nenhum objetivo de aprendizagem neste plano.</p>
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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Campo de Experiência *</label>
              <textarea 
                value={objetivos}
                onChange={e => setObjetivos(e.target.value)}
                placeholder="Descreva o campo de experiência..."
                required
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Objetivos de Aprendizagem e Desenvolvimento (Códigos/Descrição)</label>
              <textarea 
                value={habilidadesText}
                onChange={e => handleHabilidadesTextChange(e.target.value)}
                placeholder="Ex: EI02EO01, EI03CG05..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Procedimentos Metodológicos *</label>
              <textarea 
                value={metodologia}
                onChange={e => setMetodologia(e.target.value)}
                placeholder="Quais situações de exploração, jogos e vivências serão realizadas..."
                required
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Recursos Didáticos *</label>
              <textarea 
                value={recursos}
                onChange={e => setRecursos(e.target.value)}
                placeholder="Materiais concretos, tintas, brinquedos, contos..."
                required
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Formas de Registro / Avaliação *</label>
              <textarea 
                value={avaliacao}
                onChange={e => setAvaliacao(e.target.value)}
                placeholder="Observação contínua, portfólio coletivo, desenhos, fotos..."
                required
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
              />
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
              {editingId ? 'Salvar Edição' : 'Salvar Guia'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Saved plans list */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Histórico de Guias de Aprendizagem ECE</h3>
            <p className="text-xs text-slate-500 mt-0.5">Consulte, edite ou exporte as guias já elaboradas da Educação Infantil</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por tema..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-brand-orange transition-all text-xs font-semibold"
              />
            </div>

            <select
              value={historyFilterStatus}
              onChange={e => setHistoryFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
            >
              <option value="">Todos os Status</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Devolvido para Correção">Devolvido para Correção</option>
            </select>

            <SearchableSchoolSelect
              escolas={escolasInfantil}
              selectedId={schoolFilter}
              onChange={setSchoolFilter}
              showAllOption={true}
              allOptionLabel="Todas Unidades"
              className="max-w-[240px]"
              inputClassName="pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            />
          </div>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Data / Unidade Escolar</th>
                  <th className="px-6 py-4">Turma / Campo de Experiência</th>
                  <th className="px-6 py-4">Faixa Etária / Período</th>
                  <th className="px-6 py-4">Tema do Projeto / Vivência</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                      Nenhuma Guia de Aprendizagem ECE encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map(plan => (
                    <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-800">
                          {plan.dataInicio && plan.dataTermino ? (
                            <span>{new Date(plan.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(plan.dataTermino + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                          ) : (
                            <span>{new Date(plan.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight truncate max-w-[200px]">
                          {plan.escolaNome}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Criado em: {new Date((plan.dataCriacao || plan.data) + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{plan.turmaNome}</div>
                        <div className="text-[10px] text-brand-orange font-bold uppercase mt-0.5">
                          {plan.campoExperiencia}
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
                          Campo de Experiência: {plan.objetivos}
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
                            title="Imprimir Guia"
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
                  Avaliar Guia de Aprendizagem ECE
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
              <div><span className="font-bold text-slate-500 uppercase text-[10px]">Campo de Experiência:</span> {evaluatingPlan.campoExperiencia} ({evaluatingPlan.periodo})</div>
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px]">Período de Utilização:</span>{' '}
                <span className="font-bold text-brand-orange">
                  {evaluatingPlan.dataInicio && evaluatingPlan.dataTermino
                    ? `${new Date(evaluatingPlan.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(evaluatingPlan.dataTermino + 'T12:00:00').toLocaleDateString('pt-BR')}`
                    : new Date(evaluatingPlan.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                </span>
                {' '}&bull;{' '}
                <span className="font-bold text-slate-500 uppercase text-[10px]">Criado em:</span>{' '}
                {new Date((evaluatingPlan.dataCriacao || evaluatingPlan.data) + 'T12:00:00').toLocaleDateString('pt-BR')}
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
                    Documento oficial de planejamento pedagógico da Educação Infantil e registro das vivências
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
                    EDUCAÇÃO INFANTIL
                  </p>
                </div>

                {/* Protocol Bar */}
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs mb-6 font-sans">
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Identificação do Documento</span>
                    <span className="font-black text-slate-800 text-sm">
                      GUIA ECE Nº {viewingPlan.id.split('-')[0].toUpperCase()}/{new Date().getFullYear()}
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
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Faixa Etária / Grupo</span>
                    <span className="font-bold text-slate-800">{viewingPlan.anoSerie}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Campo de Experiência</span>
                    <span className="font-black text-brand-orange">{viewingPlan.campoExperiencia}</span>
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
                    <span className="font-bold text-slate-800">{viewingPlan.periodo}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Data de Criação</span>
                    <span className="font-bold text-slate-800">
                      {new Date((viewingPlan.dataCriacao || viewingPlan.data) + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-4 font-sans text-xs">
                  {/* 1. Projeto / Tema */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider">
                      1. Projeto / Tema Central / Vivência
                    </div>
                    <div className="p-4 bg-white font-bold text-slate-900 text-sm">
                      {viewingPlan.titulo}
                    </div>
                  </div>

                  {/* 2. Objetivos Principais */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider">
                      2. Contexto do Campo de Experiência e Objetivos
                    </div>
                    <div className="p-4 bg-white text-slate-700 leading-relaxed whitespace-pre-line">
                      {viewingPlan.objetivos || 'Nenhum objetivo especificado.'}
                    </div>
                  </div>

                  {/* 3. Objetivos BNCC ECE */}
                  {viewingPlan.habilidades && viewingPlan.habilidades.length > 0 && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider">
                        3. Objetivos de Aprendizagem e Desenvolvimento (BNCC Infantil)
                      </div>
                      <div className="p-4 bg-white space-y-2">
                        {viewingPlan.habilidades.map((code: string, idx: number) => {
                          const desc = getObjectiveDescription(code);
                          return (
                            <div key={idx} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                              <span className="font-black text-brand-orange font-mono mr-2">{code}</span>
                              <span className="text-slate-700">{desc || 'Objetivo de aprendizagem associado'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. Metodologia / Situações de Exploração e Vivências Ministradas */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider">
                      4. Procedimentos Metodológicos / Situações de Exploração e Vivências Ministradas
                    </div>
                    <div className="p-4 bg-white text-slate-700 leading-relaxed whitespace-pre-line">
                      {viewingPlan.metodologia || 'Não informado.'}
                    </div>
                  </div>

                  {/* 5. Recursos */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider">
                      5. Recursos Didáticos e Materiais Concretos
                    </div>
                    <div className="p-4 bg-white text-slate-700 leading-relaxed whitespace-pre-line">
                      {viewingPlan.recursos || 'Não informado.'}
                    </div>
                  </div>

                  {/* 6. Avaliação */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-wider">
                      6. Instrumentos de Acompanhamento e Registro da Aprendizagem
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
                      <p className="font-black text-slate-800 uppercase text-[10px]">Professor(a) de Educação Infantil</p>
                      <p className="text-[9px] text-slate-500 uppercase font-medium">Assinatura do(a) Docente</p>
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
