import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  FileText, Plus, Search, Edit2, Trash2, Printer, 
  X, Calendar, School as SchoolIcon, BookOpen, Save, ClipboardList,
  Layers, Check
} from 'lucide-react';
import { Escola, Coordenador } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';

interface AulasMinistradasProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
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
  'Ensino Religioso',
  'Campos de Experiência (EI)'
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
  'Creche II',
  'Creche III',
  'Pré I',
  'Pré II',
  'EJA',
  'Outros'
];

export const AulasMinistradas: React.FC<AulasMinistradasProps> = ({ escolas, isDemoMode, isAdmin, userEmail, currentUser }) => {
  const { showNotification } = useNotification();
  const [logs, setLogs] = useState<ClassLog[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);

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

  // Course Plans integration state
  const [coursePlans, setCoursePlans] = useState<any[]>([]);
  const [selectedObjetoIds, setSelectedObjetoIds] = useState<string[]>([]);
  const [selectedHabilidadeIds, setSelectedHabilidadeIds] = useState<string[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  // Print Mode State
  const [printLog, setPrintLog] = useState<ClassLog | null>(null);

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

      const formatted: ClassLog[] = (data || []).map((p: any) => {
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
          componente: p.componente,
          aulas: p.aulas,
          conteudo: p.conteudo,
          atividades: p.atividades || '',
          observacoes: p.observacoes || '',
          anoSerie: p.ano_serie,
          periodo: p.periodo,
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
      if (escolas.length > 0) {
        fetchRealLogs();
      }
    }

    if (escolas.length > 0) {
      setSelectedEscolaId(escolas[0].id);
    }
  }, [escolas, isDemoMode]);

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
        setTurmas([
          { id: 'demo-t1', name: '1º ANO A', year: '1º Ano', shift: 'MANHÃ' },
          { id: 'demo-t2', name: '2º ANO B', year: '2º Ano', shift: 'TARDE' },
          { id: 'demo-t3', name: '5º ANO A', year: '5º Ano', shift: 'MANHÃ' },
        ]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('school_id', selectedEscolaId)
          .order('name');

        if (error) throw error;
        setTurmas(data || []);
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

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.componente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool = schoolFilter === 'ALL' || l.escolaId === schoolFilter;
    const matchesClass = classFilter === 'ALL' || l.turmaId === classFilter;
    return matchesSearch && matchesSchool && matchesClass;
  });

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

      {/* Printable Area - Hidden on Screen */}
      {printLog && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black text-xs font-sans">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-lg font-black tracking-tight">SISTEMA INTEGRADO DE GESTÃO DE APRENDIZAGEM (SIGAR)</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Registro Diário de Aulas Ministradas</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 border p-4 rounded-lg bg-gray-50">
            <div>
              <p><strong>Unidade Escolar:</strong> {printLog.escolaNome}</p>
              <p><strong>Turma:</strong> {printLog.turmaNome}</p>
              <p><strong>Ano/Série:</strong> {printLog.anoSerie || '---'}</p>
              <p><strong>Data da Aula:</strong> {new Date(printLog.data + 'T12:00:00').toLocaleDateString()}</p>
            </div>
            <div>
              <p><strong>Componente Curricular:</strong> {printLog.componente}</p>
              <p><strong>Período:</strong> {printLog.periodo || '---'}</p>
              <p><strong>Quantidade de Aulas:</strong> {printLog.aulas} {printLog.aulas === 1 ? 'aula' : 'aulas'}</p>
              <p><strong>Sequência de Aulas:</strong> {logSequences[printLog.id]?.lessonRange || '---'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border p-3 rounded-lg">
              <h3 className="font-bold border-b pb-1 mb-1 text-slate-800 uppercase text-[9px] tracking-widest">Conteúdo Ministrado</h3>
              <p className="whitespace-pre-line text-gray-700">{printLog.conteudo}</p>
            </div>

            <div className="border p-3 rounded-lg">
              <h3 className="font-bold border-b pb-1 mb-1 text-slate-800 uppercase text-[9px] tracking-widest">Procedimentos e Atividades Realizadas</h3>
              <p className="whitespace-pre-line text-gray-700">{printLog.atividades || '---'}</p>
            </div>

            <div className="border p-3 rounded-lg">
              <h3 className="font-bold border-b pb-1 mb-1 text-slate-800 uppercase text-[9px] tracking-widest">Observações / Ocorrências</h3>
              <p className="whitespace-pre-line text-gray-700">{printLog.observacoes || 'Sem observações registradas.'}</p>
            </div>
          </div>

          <div className="mt-20 flex justify-around">
            <div className="text-center w-60 border-t pt-2">
              <p className="font-bold text-[10px] text-gray-600">Assinatura do Docente</p>
            </div>
            <div className="text-center w-60 border-t pt-2">
              <p className="font-bold text-[10px] text-gray-600">Direção / Coordenação</p>
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
              <div className="relative">
                <SchoolIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select 
                  value={selectedEscolaId}
                  onChange={e => setSelectedEscolaId(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all appearance-none"
                >
                  {escolas.map(e => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
              </div>
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
                {COMPONENTES.map(c => (
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

          {planData.objetos.length === 0 && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Conteúdo Letivo Ministrado *</label>
                <textarea 
                  value={conteudo}
                  onChange={e => setConteudo(e.target.value)}
                  placeholder="Descreva o conteúdo desenvolvido nesta aula..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Atividades e Procedimentos Realizados</label>
                  <textarea 
                    value={atividades}
                    onChange={e => setAtividades(e.target.value)}
                    placeholder="Ex: Leitura dirigida, exercícios no caderno, dinâmicas de grupo..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Observações / Ocorrências Pedagógicas</label>
                  <textarea 
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    placeholder="Ex: Aluno X apresentou dificuldades com a matéria, aula reduzia devido à chuva..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all resize-none"
                  />
                </div>
              </div>
            </>
          )}

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
            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Histórico de Aulas Ministradas</h3>
            <p className="text-xs text-slate-500 mt-0.5">Veja todas as aulas ministradas registradas no diário de classe</p>
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

            <select 
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-brand-orange"
            >
              <option value="ALL">Todas Unidades</option>
              {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
        </div>

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
                  filteredLogs.map(log => (
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
    </div>
  );
};
