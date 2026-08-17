import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  FileText, Plus, Search, Edit2, Trash2, Printer, 
  X, Calendar, School as SchoolIcon, Bookmark, Save,
  Check, Info, ClipboardList, Layers
} from 'lucide-react';
import { Escola, Coordenador, Segmento } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';
import { SearchableSchoolSelect } from './ui/SearchableSchoolSelect';
import { BNCC_INFANTIL } from './ConselhoClasse';

interface AulasMinistradasInfantilProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
  subHeader?: React.ReactNode;
}

interface ClassLogInfantil {
  id: string;
  data: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  campoExperiencia: string;
  rotina: string; // ECE daily routine (Roda, Acolhida, etc)
  conteudo: string; // Developed experiences
  atividades: string;
  observacoes: string;
  anoSerie: string;
  periodo: string;
  selectedHabilidadeIds: string[]; // ECE BNCC Objective codes
  selectedObjetoIds?: string[]; // Linked Campo de Experiência IDs
  criadoEm: string;
}

const CAMPOS_EXPERIENCIA = [
  'O eu, o outro e o nós',
  'Corpo, gestos e movimentos',
  'Traços, sons, cores e formas',
  'Escuta, fala, pensamento e imaginação',
  'Espaços, tempos, quantidades, relações e transformações',
  'Interdisciplinar'
];

const PERIODOS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

export const AulasMinistradasInfantil: React.FC<AulasMinistradasInfantilProps> = ({ 
  escolas, 
  isDemoMode, 
  isAdmin, 
  userEmail, 
  currentUser, 
  subHeader 
}) => {
  const { showNotification } = useNotification();
  const [logs, setLogs] = useState<ClassLogInfantil[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [campoExperiencia, setCampoExperiencia] = useState(CAMPOS_EXPERIENCIA[0]);
  const [rotina, setRotina] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [atividades, setAtividades] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [anoSerie, setAnoSerie] = useState('Creche III');
  const [periodo, setPeriodo] = useState(PERIODOS[0]);

  // ECE Course Plans integration
  const [coursePlans, setCoursePlans] = useState<any[]>([]);
  const [selectedObjetoIds, setSelectedObjetoIds] = useState<string[]>([]);
  const [selectedHabilidadeIds, setSelectedHabilidadeIds] = useState<string[]>([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  // Printing State
  const [printLog, setPrintLog] = useState<ClassLogInfantil | null>(null);

  // Filter schools to only those offering Educação Infantil
  const escolasInfantil = useMemo(() => {
    return escolas.filter(e => 
      e.segmentos && e.segmentos.includes(Segmento.INFANTIL)
    );
  }, [escolas]);

  // Fetch real logs
  const fetchRealLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('aulas_ministradas_infantil')
        .select('*')
        .eq('ativo', true)
        .order('data', { ascending: false });

      if (error) throw error;

      // Also get turmas to map names
      const { data: allTurmas, error: turmasError } = await supabase
        .from('turmas')
        .select('id, name, year, shift, anoSerie');
      
      const turmaMap = new Map<string, string>();
      if (!turmasError && allTurmas) {
        allTurmas.forEach((t: any) => {
          turmaMap.set(t.id, `${t.name || t.anoSerie || t.year} • ${t.shift || t.turno || ''}`);
        });
      }

      let filteredLogs = data || [];
      if (currentUser && currentUser.funcao === 'Professor') {
        const assignedIds = currentUser.turmasIds || [];
        filteredLogs = filteredLogs.filter((d: any) => assignedIds.includes(d.turma_id));
      }

      const formatted: ClassLogInfantil[] = filteredLogs.map(d => {
        const escolaObj = escolas.find(esc => esc.id === d.escola_id);
        const escolaNome = escolaObj ? escolaObj.nome : 'Unidade';
        const turmaNome = turmaMap.get(d.turma_id) || d.ano_serie || 'Turma';

        return {
          id: d.id,
          data: d.data,
          escolaId: d.escola_id,
          escolaNome,
          turmaId: d.turma_id,
          turmaNome,
          campoExperiencia: d.campo_experiencia,
          rotina: d.rotina,
          conteudo: d.conteudo,
          atividades: d.atividades || '',
          observacoes: d.observacoes || '',
          anoSerie: d.ano_serie,
          periodo: d.periodo,
          selectedHabilidadeIds: d.selected_habilidade_ids || [],
          selectedObjetoIds: d.selected_objeto_ids || [],
          criadoEm: d.created_at
        };
      });
      setLogs(formatted);
    } catch (err) {
      console.error('Erro ao buscar registros de aula:', err);
      showNotification('error', 'Erro ao carregar dados do Supabase. Utilizando dados locais.');
    }
  };

  // Fetch real course plans
  const fetchRealCoursePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('planos_curso_infantil')
        .select('*')
        .or('ativo.is.null,ativo.eq.true');

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
      console.error('Erro ao buscar planos de curso do Supabase para aulas:', err);
    }
  };

  // Load logs on mount
  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('sigar_aulas_ministradas_infantil');
      if (saved) {
        try {
          setLogs(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      if (escolas.length > 0) {
        fetchRealLogs();
      }
    }

    if (escolasInfantil.length > 0) {
      setSelectedEscolaId(escolasInfantil[0].id);
    }
  }, [escolas, isDemoMode, escolasInfantil]);

  // Load course plans on mount
  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('sigar_planos_curso_infantil');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const formatted = parsed.map((p: any) => ({
            id: p.id,
            anoReferencia: p.anoReferencia || p.ano_referencia,
            componente: p.campoExperiencia || p.campo_experiencia || p.componente,
            bimestre: p.bimestre,
            anoSerie: p.anoSerie || p.ano_serie,
            itens: p.itens || [],
            criadoEm: p.criadoEm || p.created_at
          }));
          setCoursePlans(formatted);
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      fetchRealCoursePlans();
    }
  }, [isDemoMode]);

  // Load turmas when selected school changes
  useEffect(() => {
    const fetchTurmas = async () => {
      if (!selectedEscolaId) {
        setTurmas([]);
        return;
      }

      if (isDemoMode) {
        let mockTurmas = [
          { id: 'demo-t1', name: 'Maternal A', year: 'Maternal A', anoSerie: 'Creche II', shift: 'MANHÃ', stage: 'Educação Infantil' },
          { id: 'demo-t2', name: 'Creche III B', year: 'Creche III B', anoSerie: 'Creche III', shift: 'TARDE', stage: 'Educação Infantil' },
          { id: 'demo-t3', name: 'Pré I A', year: 'Pré I A', anoSerie: 'Pré I', shift: 'MANHÃ', stage: 'Educação Infantil' },
          { id: 'demo-t4', name: 'Pré II B', year: 'Pré II B', anoSerie: 'Pré II', shift: 'TARDE', stage: 'Educação Infantil' },
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
        console.error('Erro ao carregar turmas:', err);
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

  const FAiXAS_ETARIAS = ['Creche II', 'Creche III', 'Pré I', 'Pré II'];

  // Compute available Faixas Etárias for the selected school
  const availableAnosSeries = useMemo(() => {
    if (turmas.length === 0) return [];
    return FAiXAS_ETARIAS.filter(ano => 
      turmas.some(t => isTurmaInAnoSerie(t, ano))
    );
  }, [turmas]);

  // Compute available Turmas for the selected school and Faixa Etária
  const availableTurmas = useMemo(() => {
    return turmas.filter(t => isTurmaInAnoSerie(t, anoSerie));
  }, [turmas, anoSerie]);

  // Sync anoSerie selection when availableAnosSeries changes
  useEffect(() => {
    const turmasMatchSchool = turmas.length === 0 || 
      turmas[0].school_id === selectedEscolaId || 
      (isDemoMode && turmas[0].id?.startsWith('demo'));

    if (turmasMatchSchool) {
      if (availableAnosSeries.length > 0) {
        if (!availableAnosSeries.includes(anoSerie)) {
          setAnoSerie(availableAnosSeries[0]);
        }
      } else {
        setAnoSerie('');
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

  // Aggregate objects and skills from active Course Plan items (single component or Interdisciplinar all components)
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

  // Reset selection when parameters change
  useEffect(() => {
    if (!editingId) {
      setSelectedObjetoIds([]);
      setSelectedHabilidadeIds([]);
    }
  }, [campoExperiencia, anoSerie, periodo, selectedTurmaId, editingId]);

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
      newContent += `Campo de Experiência:\n- ${selectedObjs.join('\n- ')}\n\n`;
    }
    if (selectedHabs.length > 0) {
      newContent += `Objetivos de Aprendizagem:\n- ${selectedHabs.join(', ')}`;
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
      const matchesCampo = campoExperiencia === 'Interdisciplinar' || log.campoExperiencia === campoExperiencia;
      if (
        log.id !== editingId &&
        log.turmaId === selectedTurmaId &&
        matchesCampo &&
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
  }, [logs, selectedTurmaId, campoExperiencia, anoSerie, periodo, editingId]);

  // Compute objectives statistics
  const skillStats = useMemo(() => {
    const total = planData.habilidades.length;
    if (total === 0) return { total: 0, worked: 0, percentage: 0, missing: 0 };
    
    const uniqueWorkedHabilidadeIds = new Set<string>();
    
    logs.forEach(log => {
      const matchesCampo = campoExperiencia === 'Interdisciplinar' || log.campoExperiencia === campoExperiencia;
      if (
        log.turmaId === selectedTurmaId &&
        matchesCampo &&
        log.anoSerie === anoSerie &&
        log.periodo === periodo
      ) {
        if (log.selectedHabilidadeIds) {
          log.selectedHabilidadeIds.forEach(id => {
            if (planData.habilidades.some(h => h.id === id || h.codigo === id)) {
              const match = planData.habilidades.find(h => h.id === id || h.codigo === id);
              if (match) {
                uniqueWorkedHabilidadeIds.add(match.id);
              }
            }
          });
        }
      }
    });

    selectedHabilidadeIds.forEach(id => {
      const match = planData.habilidades.find(h => h.id === id || h.codigo === id);
      if (match) {
        uniqueWorkedHabilidadeIds.add(match.id);
      }
    });
    
    const worked = uniqueWorkedHabilidadeIds.size;
    const percentage = Math.round((worked / total) * 100);
    const missing = total - worked;
    
    return { total, worked, percentage, missing };
  }, [planData.habilidades, logs, selectedTurmaId, campoExperiencia, anoSerie, periodo, selectedHabilidadeIds]);

  // Fetch available ECE BNCC objectives for the form (fallback)
  const availableObjectives = useMemo(() => {
    const ageGroup = ['Creche II', 'Creche III'].includes(anoSerie)
      ? 'Crianças bem pequenas'
      : 'Crianças pequenas';
    
    const normalizedCampo = campoExperiencia.toUpperCase();
    const fieldData = BNCC_INFANTIL[normalizedCampo as keyof typeof BNCC_INFANTIL];
    if (!fieldData) return [];
    
    return (fieldData as any)[ageGroup] || [];
  }, [campoExperiencia, anoSerie]);

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEscolaId || !selectedTurmaId || !conteudo.trim() || !rotina.trim()) {
      showNotification('error', 'Preencha todos os campos obrigatórios (*).');
      return;
    }

    const escolaNome = escolas.find(e => e.id === selectedEscolaId)?.nome || 'Unidade';
    const turmaObj = turmas.find(t => t.id === selectedTurmaId);
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.anoSerie || turmaObj.year} • ${turmaObj.shift || turmaObj.turno || ''}` : 'Turma';

    const payload: ClassLogInfantil = {
      id: editingId || crypto.randomUUID(),
      data: dataAula,
      escolaId: selectedEscolaId,
      escolaNome,
      turmaId: selectedTurmaId,
      turmaNome,
      campoExperiencia,
      rotina,
      conteudo: conteudo.trim(),
      atividades,
      observacoes,
      anoSerie,
      periodo,
      selectedHabilidadeIds,
      selectedObjetoIds,
      criadoEm: new Date().toISOString()
    };

    try {
      if (!isDemoMode) {
        const dbPayload = {
          id: payload.id,
          data: payload.data,
          escola_id: payload.escolaId,
          turma_id: payload.turmaId,
          campo_experiencia: payload.campoExperiencia,
          rotina: payload.rotina,
          conteudo: payload.conteudo,
          atividades: payload.atividades,
          observacoes: payload.observacoes,
          ano_serie: payload.anoSerie,
          periodo: payload.periodo,
          selected_habilidade_ids: payload.selectedHabilidadeIds,
          selected_objeto_ids: payload.selectedObjetoIds || [],
          updated_at: new Date().toISOString(),
          updated_by: userEmail || currentUser?.contato || 'user'
        };

        const { error } = await supabase
          .from('aulas_ministradas_infantil')
          .upsert(dbPayload);

        if (error) throw error;
      }

      let updatedLogs: ClassLogInfantil[];
      if (editingId) {
        updatedLogs = logs.map(l => l.id === editingId ? payload : l);
        showNotification('success', 'Registro de aula ECE atualizado com sucesso!');
      } else {
        updatedLogs = [payload, ...logs];
        showNotification('success', 'Aula ministrada ECE registrada com sucesso!');
      }

      setLogs(updatedLogs);
      if (isDemoMode) {
        localStorage.setItem('sigar_aulas_ministradas_infantil', JSON.stringify(updatedLogs));
      }

      resetForm();
    } catch (err) {
      console.error('Erro ao salvar registro de aula:', err);
      showNotification('error', 'Falha ao gravar os dados.');
    }
  };

  const handleEdit = (log: ClassLogInfantil) => {
    setEditingId(log.id);
    setDataAula(log.data);
    setSelectedEscolaId(log.escolaId);
    setTimeout(() => {
      setSelectedTurmaId(log.turmaId);
    }, 150);
    setCampoExperiencia(log.campoExperiencia);
    setRotina(log.rotina);
    setConteudo(log.conteudo);
    setAtividades(log.atividades);
    setObservacoes(log.observacoes);
    setAnoSerie(log.anoSerie || 'Creche III');
    setPeriodo(log.periodo || '1º Bimestre');
    setSelectedHabilidadeIds(log.selectedHabilidadeIds || []);
    setSelectedObjetoIds(log.selectedObjetoIds || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este registro de aula?')) return;

    try {
      if (!isDemoMode) {
        const { error } = await supabase
          .from('aulas_ministradas_infantil')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
      }

      const updated = logs.filter(l => l.id !== id);
      setLogs(updated);
      if (isDemoMode) {
        localStorage.setItem('sigar_aulas_ministradas_infantil', JSON.stringify(updated));
      }
      showNotification('success', 'Registro de aula removido com sucesso!');
    } catch (err) {
      console.error('Erro ao remover registro:', err);
      showNotification('error', 'Erro ao excluir do banco.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setRotina('');
    setConteudo('');
    setAtividades('');
    setObservacoes('');
    setSelectedHabilidadeIds([]);
    setSelectedObjetoIds([]);
  };

  const handlePrint = (log: ClassLogInfantil) => {
    setPrintLog(log);
    setTimeout(() => {
      window.print();
      setPrintLog(null);
    }, 150);
  };

  // Filter lists for dashboard
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = l.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            l.campoExperiencia.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSchool = schoolFilter === 'ALL' || l.escolaId === schoolFilter;
      const matchesClass = classFilter === 'ALL' || l.turmaId === classFilter;
      return matchesSearch && matchesSchool && matchesClass;
    });
  }, [logs, searchTerm, schoolFilter, classFilter]);

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

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative text-left">
      <PageHeader 
        title="Aulas Ministradas - Educação Infantil"
        subtitle="Registro de vivências diárias, rotina pedagógica e desenvolvimento infantil"
        icon={FileText}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {subHeader}

      {/* Form Card (always visible) */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <FileText className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
            {editingId ? 'Editar Registro de Aula ECE' : 'Novo Registro de Aula ECE'}
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
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
                escolas={escolasInfantil}
                selectedId={selectedEscolaId}
                onChange={setSelectedEscolaId}
                inputClassName="pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Grupo/Faixa Etária *</label>
              <select 
                value={anoSerie}
                onChange={e => setAnoSerie(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
              >
                {availableAnosSeries.length === 0 ? (
                  <option value="">Nenhum grupo cadastrado</option>
                ) : (
                  availableAnosSeries.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turma *</label>
              <select 
                value={selectedTurmaId}
                onChange={e => setSelectedTurmaId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
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

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Campo de Experiência *</label>
              <select 
                value={campoExperiencia}
                onChange={e => setCampoExperiencia(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
              >
                {CAMPOS_EXPERIENCIA.map(c => (
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
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
              >
                {PERIODOS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rotina Diária *</label>
              <input 
                type="text" 
                value={rotina}
                onChange={e => setRotina(e.target.value)}
                required
                placeholder="Ex: Acolhida, Roda..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              />
            </div>
          </div>

          {/* Progresso Curricular dos Objetivos */}
          {skillStats.total > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 animate-fade-in shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="text-brand-orange w-4 h-4" />
                    Progresso Curricular dos Objetivos no Período
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                    {skillStats.worked} de {skillStats.total} Objetivos de Aprendizagem trabalhados nesta turma ({skillStats.percentage}%)
                  </p>
                </div>
                
                <div className="w-full md:w-auto text-right">
                  <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    skillStats.missing === 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-brand-orange/10 text-brand-orange'
                  }`}>
                    {skillStats.missing === 0 ? '✓ 100% Concluído' : `Faltam trabalhar ${skillStats.missing} objetivos`}
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

          {/* Painel de Seleção Rápida (Plano de Curso ECE) */}
          {planData.objetos.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 animate-fade-in shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="text-brand-orange w-4 h-4" />
                  Vincular Conteúdo do Plano de Curso Unificado (ECE)
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
                                ⚠️ Já trabalhado nesta turma
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Objetivos de Aprendizagem Column */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col space-y-2">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-wider border-b pb-1.5 flex justify-between items-center">
                    <span>Objetivos de Aprendizagem ({planData.habilidades.length})</span>
                    {selectedHabilidadeIds.length > 0 && (
                      <span className="text-[9px] bg-brand-orange/15 text-brand-orange font-bold px-1.5 py-0.2 rounded-full">
                        {selectedHabilidadeIds.length} selecionado(s)
                      </span>
                    )}
                  </h4>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {planData.habilidades.length === 0 ? (
                      <p className="text-slate-400 text-xs italic text-center py-6">Nenhum objetivo neste plano.</p>
                    ) : (
                      planData.habilidades.map((hab: any) => {
                        const isSelected = selectedHabilidadeIds.includes(hab.id || hab.codigo);
                        const isAlreadyUsed = previouslyUsedData.usedHabilidades.has(hab.id || hab.codigo);
                        return (
                          <button
                            type="button"
                            key={hab.id || hab.codigo}
                            onClick={() => toggleHabilidadeSelection(hab.id || hab.codigo)}
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
                                    ⚠️ Já trabalhado
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

          {/* Fallback Objectives checklist from BNCC_INFANTIL if no course plan objects exist */}
          {planData.objetos.length === 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Objetivos BNCC Trabalhados (Fallback)</label>
              <div className="max-h-[160px] overflow-y-auto space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {availableObjectives.map((obj: any) => {
                  const isSelected = selectedHabilidadeIds.includes(obj.code);
                  return (
                    <div 
                      key={obj.code}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedHabilidadeIds(selectedHabilidadeIds.filter(c => c !== obj.code));
                        } else {
                          setSelectedHabilidadeIds([...selectedHabilidadeIds, obj.code]);
                        }
                      }}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2 ${
                        isSelected 
                          ? 'bg-orange-50/50 border-orange-200' 
                          : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`text-[8px] font-black px-1 py-0.5 rounded leading-none mt-0.5 ${
                        isSelected ? 'bg-brand-orange text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {obj.code}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{obj.short}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{obj.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Text fields are always visible for ECE to allow describing interactions and plays */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vivências Desenvolvidas (Conteúdo) *</label>
              <textarea
                rows={3}
                value={conteudo}
                onChange={e => setConteudo(e.target.value)}
                required
                placeholder="Quais brincadeiras, interações e experiências foram desenvolvidas com o grupo..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Atividades / Materiais Utilizados</label>
                <textarea
                  rows={2}
                  value={atividades}
                  onChange={e => setAtividades(e.target.value)}
                  placeholder="Ex: Brinquedos de montar, tintas guache, blocos lógicos..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Observações Coletivas</label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Observações sobre o comportamento e envolvimento coletivo..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
                />
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
              {editingId ? 'Salvar Edição' : 'Salvar Registro'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Saved logs list */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Histórico de Aulas e Vivências</h3>
            <p className="text-xs text-slate-500 mt-0.5">Veja todas as vivências registradas no diário de classe da Educação Infantil</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por conteúdo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-brand-orange transition-all text-xs font-semibold"
              />
            </div>

            <SearchableSchoolSelect
              escolas={escolasInfantil}
              selectedId={schoolFilter}
              onChange={setSchoolFilter}
              showAllOption={true}
              allOptionLabel="Todas Unidades"
              className="max-w-[240px]"
              inputClassName="pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            />

            <select 
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-brand-orange"
            >
              <option value="ALL">Todas as Turmas ECE</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.name || t.anoSerie} • {t.turno || t.shift || ''}</option>)}
            </select>
          </div>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Data / Escola</th>
                  <th className="px-6 py-4">Turma / Campo de Experiência</th>
                  <th className="px-6 py-4">Grupo / Período</th>
                  <th className="px-6 py-4">Vivências Desenvolvidas</th>
                  <th className="px-6 py-4">Rotina Diária</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      Nenhuma aula ou vivência registrada para a Educação Infantil.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-800">
                          {new Date(log.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight truncate max-w-[200px]">
                          {log.escolaNome}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{log.turmaNome}</div>
                        <div className="text-[10px] text-brand-orange font-bold uppercase mt-0.5 truncate max-w-[250px]" title={log.campoExperiencia}>
                          {log.campoExperiencia}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{log.anoSerie}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                          {log.periodo}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-semibold text-slate-800 line-clamp-1">{log.conteudo}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {log.selectedHabilidadeIds && log.selectedHabilidadeIds.map(code => (
                            <span key={code} className="bg-slate-100 text-slate-600 text-[8px] font-bold px-1 py-0.2 rounded font-mono">
                              {code}
                            </span>
                          ))}
                        </div>
                        {log.observacoes && (
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                            Obs: {log.observacoes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-semibold text-slate-700 max-w-[150px] truncate" title={log.rotina}>
                          {log.rotina}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handlePrint(log)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                            title="Imprimir Relatório"
                          >
                            <Printer size={15} />
                          </button>
                          <button 
                            onClick={() => handleEdit(log)} 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" 
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(log.id)} 
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

      {/* PRINTABLE COMPONENT AREA */}
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
              DIÁRIO DE CLASSE • EDUCAÇÃO INFANTIL
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
                    Faixa Etária / Grupo
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155', width: '28%' }}>
                    {printLog.anoSerie}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '22%' }}>
                    Campo de Experiência
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a', width: '28%' }}>
                    {printLog.campoExperiencia}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Bimestre / Período
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                    {printLog.periodo}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Data de Referência
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a' }}>
                    {new Date(printLog.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                </tr>
                {printLog.rotina && (
                  <tr>
                    <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                      Rotina Diária
                    </td>
                    <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }} colSpan={3}>
                      {printLog.rotina}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ====== OBJETIVOS BNCC TRABALHADOS ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
              Objetivos BNCC Trabalhados
            </div>
            <div style={{ padding: '8pt 10pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', display: 'flex', flexWrap: 'wrap', gap: '4pt' }}>
              {printLog.selectedHabilidadeIds && printLog.selectedHabilidadeIds.length > 0 ? (
                printLog.selectedHabilidadeIds.map(code => (
                  <span key={code} style={{ padding: '3pt 8pt', border: '1pt solid #0f172a', fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a' }}>
                    {code}
                  </span>
                ))
              ) : (
                <p style={{ fontSize: '9pt', color: '#94a3b8', fontStyle: 'italic' }}>Nenhum objetivo específico trabalhado.</p>
              )}
            </div>
          </div>

          {/* ====== VIVÊNCIAS E PRÁTICAS DESENVOLVIDAS ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
              Vivências e Práticas Desenvolvidas
            </div>
            <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '40pt' }}>
              <p className="whitespace-pre-line">{printLog.conteudo}</p>
            </div>
          </div>

          {/* ====== MATERIAIS E ATIVIDADES PROPOSTAS ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
              Materiais e Atividades Propostas
            </div>
            <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '40pt' }}>
              <p className="whitespace-pre-line">{printLog.atividades || 'Nenhuma atividade complementar registrada.'}</p>
            </div>
          </div>

          {/* ====== OBSERVAÇÕES E REGISTRO DO GRUPO ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
              Observações e Registro do Grupo
            </div>
            <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt' }}>
              <p className="whitespace-pre-line">{printLog.observacoes || 'Nenhuma observação registrada.'}</p>
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

    </div>
  );
};
