import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  BookOpen, Plus, Search, Edit2, Trash2, Printer, 
  X, Calendar, School as SchoolIcon, Bookmark, Save,
  Check, Info, Layers
} from 'lucide-react';
import { Escola, Coordenador, Segmento } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';
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
}

const FAiXAS_ETARIAS = ['Creche II', 'Creche III', 'Pré I', 'Pré II'];

const CAMPOS_EXPERIENCIA = [
  'O eu, o outro e o nós',
  'Corpo, gestos e movimentos',
  'Traços, sons, cores e formas',
  'Escuta, fala, pensamento e imaginação',
  'Espaços, tempos, quantidades, relações e transformações'
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
  const [dataPlan, setDataPlan] = useState(new Date().toISOString().split('T')[0]);
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

  // Derive unique Ano/Série values directly from loaded turmas
  const availableAnosSeries = useMemo(() => {
    if (turmas.length === 0) return FAiXAS_ETARIAS;
    const unique = new Set<string>();
    turmas.forEach(t => {
      const val = t.year || t.anoSerie || '';
      if (val) unique.add(val);
    });
    return unique.size > 0 ? Array.from(unique) : FAiXAS_ETARIAS;
  }, [turmas]);

  // Filter turmas matching the selected Ano/Série
  const availableTurmas = useMemo(() => {
    return turmas.filter(t => {
      const tYear = (t.year || '').toLowerCase().trim();
      const tAnoSerie = (t.anoSerie || '').toLowerCase().trim();
      const target = anoSerie.toLowerCase().trim();
      return tYear === target || tAnoSerie === target;
    });
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
        setTurmas(data || []);
      } catch (err) {
        console.error('Erro ao buscar turmas:', err);
      }
    };

    if (isDemoMode) {
      setTurmas([
        { id: 'demo-t1', name: 'Creche II A', year: 'Creche II', anoSerie: 'Creche II', shift: 'Matutino', stage: 'Educação Infantil' },
        { id: 'demo-t2', name: 'Creche III B', year: 'Creche III', anoSerie: 'Creche III', shift: 'Vespertino', stage: 'Educação Infantil' },
        { id: 'demo-t3', name: 'Pré I A', year: 'Pré-Escola I', anoSerie: 'Pré I', shift: 'Matutino', stage: 'Educação Infantil' },
        { id: 'demo-t4', name: 'Pré II B', year: 'Pré-Escola II', anoSerie: 'Pré II', shift: 'Vespertino', stage: 'Educação Infantil' },
      ]);
    } else {
      fetchTurmas();
    }
  }, [currentSchoolId, isDemoMode]);

  // Auto-select first Ano/Série when turmas list changes (school change)
  useEffect(() => {
    if (availableAnosSeries.length > 0 && !availableAnosSeries.includes(anoSerie)) {
      setAnoSerie(availableAnosSeries[0]);
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

  // Match course plan unificado
  const activeCoursePlan = useMemo(() => {
    return coursePlans.find((p: any) => 
      p.componente === campoExperiencia && 
      p.anoSerie === anoSerie && 
      p.bimestre === periodo
    );
  }, [coursePlans, campoExperiencia, anoSerie, periodo]);

  // Aggregate ECE Course Plan items
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

          const formatted: LessonPlanInfantil[] = (data || []).map(d => ({
            id: d.id,
            data: d.data,
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
            criadoEm: d.created_at
          }));
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

    const escolaNome = escolas.find(e => e.id === selectedEscolaId)?.nome || 'Unidade';
    const turmaObj = turmas.find(t => t.id === selectedTurmaId);
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.anoSerie || turmaObj.year} • ${turmaObj.shift || turmaObj.turno || ''}` : 'Turma';

    // Parse any manually typed or edited codes from the textarea
    const extractedCodes = (habilidadesText.match(/EI\d{2}[A-Z]{2}\d{2}/g) || []).map(code => code.toUpperCase());
    const finalHabilidades = Array.from(new Set([...habilidades, ...extractedCodes]));

    const payload: LessonPlanInfantil = {
      id: editingId || crypto.randomUUID(),
      data: dataPlan,
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
          titulo: payload.titulo,
          objetivos: payload.objetivos,
          habilidades: JSON.stringify(payload.habilidades),
          metodologia: payload.metodologia,
          recursos: payload.recursos,
          avaliacao: payload.avaliacao,
          ano_serie: payload.anoSerie,
          periodo: payload.periodo,
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
    setDataPlan(plan.data);
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

  // Filter lists for dashboard
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchesSearch = p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.campoExperiencia.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSchool = schoolFilter === 'ALL' || p.escolaId === schoolFilter;
      const matchesClass = classFilter === 'ALL' || p.turmaId === classFilter;
      return matchesSearch && matchesSchool && matchesClass;
    });
  }, [plans, searchTerm, schoolFilter, classFilter]);

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
        <div id="print-report" className="hidden print:block bg-white p-8 text-black text-xs font-sans text-left">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-lg font-black tracking-tight">SISTEMA INTEGRADO DE GESTÃO DE APRENDIZAGEM (SIGAR)</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Guia de Aprendizagem e Projetos - Educação Infantil</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 border p-4 rounded-lg bg-gray-50">
            <div>
              <p><strong>Unidade Escolar:</strong> {printPlan.escolaNome}</p>
              <p><strong>Bimestre / Período:</strong> {printPlan.periodo}</p>
              <p><strong>Data de Referência:</strong> {new Date(printPlan.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p><strong>Faixa Etária / Grupo:</strong> {printPlan.anoSerie}</p>
              <p><strong>Campo de Experiência:</strong> {printPlan.campoExperiencia}</p>
              <p><strong>Projeto / Tema:</strong> {printPlan.titulo}</p>
            </div>
          </div>

          <div className="space-y-4 text-[10px]">
            <div>
              <h3 className="font-bold border-b pb-1 mb-1 text-xs">Objetivos de Desenvolvimento BNCC Trabalhados</h3>
              <ul className="list-disc pl-5 space-y-1">
                {printPlan.habilidades && printPlan.habilidades.length > 0 ? (
                  printPlan.habilidades.map(code => {
                    const desc = getObjectiveDescription(code);
                    return (
                      <li key={code}>
                        <strong>{code}</strong>{desc ? `: ${desc}` : ''}
                      </li>
                    );
                  })
                ) : (
                  <p className="italic text-gray-400">Nenhum objetivo específico selecionado.</p>
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-bold border-b pb-1 mb-1 text-xs">Vivências / Saberes e Conhecimentos</h3>
              <p className="whitespace-pre-wrap">{printPlan.objetivos}</p>
            </div>

            <div>
              <h3 className="font-bold border-b pb-1 mb-1 text-xs">Vivências e Metodologia Aplicada</h3>
              <p className="whitespace-pre-wrap">{printPlan.metodologia}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold border-b pb-1 mb-1 text-xs">Recursos Didáticos</h3>
                <p className="whitespace-pre-wrap">{printPlan.recursos}</p>
              </div>
              <div>
                <h3 className="font-bold border-b pb-1 mb-1 text-xs">Avaliação / Registros Pedagógicos</h3>
                <p className="whitespace-pre-wrap">{printPlan.avaliacao}</p>
              </div>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-12 text-center">
            <div className="border-t pt-2">
              <p className="font-bold">Assinatura do Professor(a)</p>
            </div>
            <div className="border-t pt-2">
              <p className="font-bold">Assinatura da Coordenação Pedagógica</p>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="date" 
                  value={dataPlan}
                  onChange={e => setDataPlan(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unidade Escolar *</label>
              <div className="relative">
                <SchoolIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select 
                  value={selectedEscolaId}
                  onChange={e => setSelectedEscolaId(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all appearance-none"
                >
                  <option value="">Selecione a Unidade Escolar</option>
                  {escolasInfantil.map(e => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Grupo/Faixa Etária *</label>
              <select 
                value={anoSerie}
                onChange={e => setAnoSerie(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
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
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-brand-orange"
            >
              <option value="ALL">Todas Unidades</option>
              {escolasInfantil.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
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
                          {new Date(plan.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight truncate max-w-[200px]">
                          {plan.escolaNome}
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
                        <div className="font-semibold text-slate-800 line-clamp-1">{plan.titulo}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          Saberes: {plan.objetivos}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
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

    </div>
  );
};
