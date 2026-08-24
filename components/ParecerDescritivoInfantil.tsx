import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  FileText, Plus, Search, Edit2, Trash2, Printer, 
  Calendar, School as SchoolIcon, Bookmark, Save,
  Check, Info, Users, Loader2, Award, Heart, Shield, Compass, Brain,
  Activity, MessageSquare, Download,
  ListFilter, RotateCcw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Escola, Coordenador, Segmento, Aluno } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';
import { SearchableSchoolSelect } from './ui/SearchableSchoolSelect';
import { logAudit } from '../services/logService';

interface ParecerDescritivoInfantilProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
  subHeader?: React.ReactNode;
}

interface ParecerEntry {
  id: string;
  escolaId: string;
  escolaNome: string;
  anoSerie: string;
  turmaId: string;
  turmaNome: string;
  alunoId: number;
  alunoNome: string;
  periodo: string;
  parecer: string;
  aspectos: Record<string, string>; // Mapeamento de aspecto -> nível
  criadoEm: string;
}

const PERIODOS = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];

export const ParecerDescritivoInfantil: React.FC<ParecerDescritivoInfantilProps> = ({
  escolas,
  isDemoMode,
  isAdmin,
  userEmail,
  currentUser,
  subHeader
}) => {
  const { showNotification } = useNotification();

  // State Variables
  const [entries, setEntries] = useState<ParecerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [anoSerie, setAnoSerie] = useState('');
  const [selectedAlunoId, setSelectedAlunoId] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState(PERIODOS[0]);
  const [parecerText, setParecerText] = useState(''); // Stores "Parecer Geral"
  
  // ECE Descriptive Tabbed Areas
  const [activeTab, setActiveTab] = useState<'cognitivo' | 'socioemocional' | 'motor' | 'linguagem'>('cognitivo');
  const [cognitivoText, setCognitivoText] = useState('');
  const [socioemocionalText, setSocioemocionalText] = useState('');
  const [motorText, setMotorText] = useState('');
  const [linguagemText, setLinguagemText] = useState('');

  // Other ECE Fields
  const [pontosFortes, setPontosFortes] = useState('');
  const [areasDesenvolver, setAreasDesenvolver] = useState('');
  const [recomendacoesFamilia, setRecomendacoesFamilia] = useState('');
  const [statusValue, setStatusValue] = useState<'Rascunho' | 'Finalizado'>('Rascunho');

  // Search & History Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [historyFilterEscola, setHistoryFilterEscola] = useState('');
  const [historyFilterAnoSerie, setHistoryFilterAnoSerie] = useState('');
  const [historyFilterTurma, setHistoryFilterTurma] = useState('');
  const [historyFilterBimestre, setHistoryFilterBimestre] = useState('');
  const [historyFilterStatus, setHistoryFilterStatus] = useState('');
  const [historyFilterAluno, setHistoryFilterAluno] = useState('');

  // Pagination State
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);

  // Print Portal
  const [printEntry, setPrintEntry] = useState<ParecerEntry | null>(null);

  // Lists from DB
  const [selectedGrupo, setSelectedGrupo] = useState('');
  const [turmas, setTurmas] = useState<any[]>([]);
  const [students, setStudents] = useState<Aluno[]>([]);

  // Filter schools for ECE
  const escolasInfantil = useMemo(() => {
    return escolas.filter(e => e.segmentos.includes(Segmento.INFANTIL));
  }, [escolas]);

  const FAiXAS_ETARIAS = ['Creche II', 'Creche III', 'Pré I', 'Pré II'];

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

  const getAnoSerieFromTurma = (t: any): string => {
    if (!t) return 'Creche III';
    if (t.anoSerie) return t.anoSerie;
    
    const val = (t.year || t.name || '').toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[-\s]/g, '');

    if (val.includes('preescolaii') || val.includes('preii')) return 'Pré II';
    if (val.includes('preescolai') || val.includes('prei')) return 'Pré I';
    if (val.includes('crecheiii')) return 'Creche III';
    if (val.includes('crecheii')) return 'Creche II';
    if (val.includes('crechei')) return 'Creche I';
    
    return t.year || 'Creche III';
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
    if (!selectedGrupo) return [];
    return turmas.filter(t => isTurmaInAnoSerie(t, selectedGrupo));
  }, [turmas, selectedGrupo]);

  const currentSchoolId = selectedEscolaId || (escolasInfantil.length > 0 ? escolasInfantil[0].id : '');

  // Load ECE turmas based on active school
  useEffect(() => {
    const fetchTurmas = async () => {
      if (!currentSchoolId) return;
      try {
        const { data, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('school_id', currentSchoolId)
          .eq('stage', 'Educação Infantil');

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
      if (!availableAnosSeries.includes(selectedGrupo)) {
        setSelectedGrupo(availableAnosSeries[0]);
      }
    } else {
      setSelectedGrupo('');
    }
  }, [availableAnosSeries, selectedGrupo]);

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

  // Sync grade when selected class changes
  useEffect(() => {
    const t = turmas.find(x => x.id === selectedTurmaId);
    if (t) {
      setAnoSerie(getAnoSerieFromTurma(t));
    }
  }, [selectedTurmaId, turmas]);

  // Fetch students for selected class
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedTurmaId) {
        setStudents([]);
        setSelectedAlunoId('');
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
        if (data && data.length > 0) {
          setSelectedAlunoId(String(data[0].id));
        } else {
          setSelectedAlunoId('');
        }
      } catch (err) {
        console.error('Erro ao buscar alunos:', err);
      }
    };

    fetchStudents();
  }, [selectedTurmaId]);

  // Load entries on mount/school change
  const loadEntries = async () => {
    setLoading(true);
    try {
      if (!isDemoMode) {
        let allPareceresData: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('parecer_descritivo_infantil')
            .select(`
              *,
              alunos (
                name
              ),
              turmas (
                name,
                year,
                shift
              )
            `)
            .or('ativo.eq.true,ativo.is.null')
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error) throw error;
          if (data && data.length > 0) {
            allPareceresData = allPareceresData.concat(data);
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }

        let filteredData = allPareceresData;
        if (!isAdmin && currentUser && currentUser.funcao !== 'Administrador') {
          const userSchoolIds = (currentUser?.escolasIds || []).map(String);
          if (userSchoolIds.length > 0) {
            filteredData = filteredData.filter((d: any) => userSchoolIds.includes(String(d.escola_id)));
          }
        }
        if (currentUser && currentUser.funcao === 'Professor') {
          const assignedIds = (currentUser.turmasIds || []).map(String);
          filteredData = filteredData.filter((d: any) => assignedIds.includes(String(d.turma_id)));
        }

        const formatted: ParecerEntry[] = filteredData.map((d: any) => {
          const classObj = turmas.find(t => t.id === d.turma_id);
          const studentObj = students.find(s => s.id === d.aluno_id);
          
          const studentName = (Array.isArray(d.alunos) ? d.alunos[0]?.name : d.alunos?.name)
            || studentObj?.name
            || `Estudante #${d.aluno_id}`;

          const turmaRelation = Array.isArray(d.turmas) ? d.turmas[0] : d.turmas;
          let resolvedTurmaNome = 'Turma';
          if (turmaRelation) {
            const tName = turmaRelation.name || turmaRelation.year || '';
            const tShift = turmaRelation.shift || '';
            resolvedTurmaNome = tName && tShift ? `${tName} • ${tShift}` : (tName || tShift || 'Turma');
          } else if (classObj) {
            resolvedTurmaNome = `${classObj.name || classObj.anoSerie} • ${classObj.turno || ''}`;
          }

          const resolvedAnoSerie = turmaRelation 
            ? getAnoSerieFromTurma(turmaRelation) 
            : (classObj ? getAnoSerieFromTurma(classObj) : (d.ano_serie || 'Creche III'));

          return {
            id: d.id,
            escolaId: d.escola_id,
            escolaNome: escolas.find(e => e.id === d.escola_id)?.nome || 'Unidade',
            turmaId: d.turma_id,
            turmaNome: resolvedTurmaNome,
            alunoId: d.aluno_id,
            alunoNome: studentName,
            periodo: d.periodo,
            parecer: d.parecer,
            aspectos: d.aspectos || {},
            anoSerie: resolvedAnoSerie,
            criadoEm: d.created_at
          };
        });
        setEntries(formatted);
      } else {
        const saved = localStorage.getItem('sigar_parecer_descritivo_infantil');
        if (saved) {
          setEntries(JSON.parse(saved));
        } else {
          const demo: ParecerEntry[] = [
            {
              id: 'demo-pd-1',
              escolaId: escolasInfantil.length > 0 ? escolasInfantil[0].id : 'demo-esc-1',
              escolaNome: escolasInfantil.length > 0 ? escolasInfantil[0].nome : 'Escola Demo ECE',
              anoSerie: 'Creche III',
              turmaId: 'demo-t3',
              turmaNome: 'Pré I A',
              alunoId: 1,
              alunoNome: 'Arthur Silva Souza',
              periodo: '1º Bimestre',
              parecer: 'Desenvolvimento dentro do esperado para a idade.',
              aspectos: {
                cognitivo: 'Apresenta curiosidade e participa das atividades propostas com bastante interesse.',
                socioemocional: 'Arthur interage muito bem com seus colegas, demonstra empatia e gosta de colaborar nas tarefas da sala.',
                motor: 'Mostra boa agilidade, corre com segurança e já consegue realizar recortes simples e traçados firmes.',
                linguagem: 'Comunica suas necessidades e ideias com clareza, utilizando vocabulário rico para sua idade.',
                pontosFortes: 'Comunicação e interação.',
                areasDesenvolver: 'Foco em atividades prolongadas.',
                recomendacoesFamilia: 'Estimular leitura em casa.',
                status: 'Finalizado'
              },
              criadoEm: new Date().toISOString()
            },
            {
              id: 'demo-pd-2',
              escolaId: escolasInfantil.length > 0 ? escolasInfantil[0].id : 'demo-esc-1',
              escolaNome: escolasInfantil.length > 0 ? escolasInfantil[0].nome : 'Escola Demo ECE',
              anoSerie: 'Pré I',
              turmaId: 'demo-t4',
              turmaNome: 'Pré II B',
              alunoId: 2,
              alunoNome: 'Beatriz Santos Oliveira',
              periodo: '1º Bimestre',
              parecer: 'Apresenta excelente evolução pedagógica.',
              aspectos: {
                cognitivo: 'Demonstra raciocínio lógico rápido ao resolver pequenos quebra-cabeças e desafios.',
                socioemocional: 'Beatriz é muito afetuosa e busca a mediação quando encontra divergências com os colegas.',
                motor: 'Desenvolveu grande equilíbrio nas brincadeiras ao ar livre e no manuseio de materiais diversos.',
                linguagem: 'Expressa-se criativamente por meio de histórias inventadas e interpretações corporais.',
                pontosFortes: 'Criatividade e expressão corporal.',
                areasDesenvolver: 'Compartilhamento de brinquedos disputados.',
                recomendacoesFamilia: 'Continuar incentivando brincadeiras lúdicas e interativas em família.',
                status: 'Rascunho'
              },
              criadoEm: new Date().toISOString()
            }
          ];
          localStorage.setItem('sigar_parecer_descritivo_infantil', JSON.stringify(demo));
          setEntries(demo);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar pareceres:', err);
      showNotification('error', 'Erro ao carregar pareceres descritivos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [isDemoMode, selectedTurmaId, students]);

  const resetForm = () => {
    setEditingId(null);
    setSelectedPeriodo(PERIODOS[0]);
    setParecerText('');
    setCognitivoText('');
    setSocioemocionalText('');
    setMotorText('');
    setLinguagemText('');
    setPontosFortes('');
    setAreasDesenvolver('');
    setRecomendacoesFamilia('');
    setStatusValue('Rascunho');
    setActiveTab('cognitivo');
    setSelectedGrupo('');
  };

  // Save Parecer Entry
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscolaId || !selectedTurmaId || !selectedAlunoId) {
      showNotification('error', 'Preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const schoolObj = escolas.find(es => es.id === selectedEscolaId);
      const classObj = turmas.find(t => t.id === selectedTurmaId);
      const studentObj = students.find(s => s.id === Number(selectedAlunoId));

      const escolaNome = schoolObj?.nome || 'Unidade';
      const turmaNome = classObj ? `${classObj.name || classObj.anoSerie} • ${classObj.turno || ''}` : 'Turma';
      const alunoNome = studentObj ? studentObj.name : 'Estudante';
      const parsedAlunoId = studentObj ? studentObj.id : 0;

      const aspectosPayload = {
        cognitivo: cognitivoText,
        socioemocional: socioemocionalText,
        motor: motorText,
        linguagem: linguagemText,
        pontosFortes,
        areasDesenvolver,
        recomendacoesFamilia,
        status: statusValue
      };

      const payload = {
        escola_id: selectedEscolaId,
        ano_serie: anoSerie,
        turma_id: selectedTurmaId,
        aluno_id: parsedAlunoId,
        periodo: selectedPeriodo,
        parecer: parecerText,
        aspectos: aspectosPayload,
        ativo: true
      };

      if (!isDemoMode) {
        if (editingId) {
          const { error } = await supabase
            .from('parecer_descritivo_infantil')
            .update(payload)
            .eq('id', editingId);
          if (error) throw error;
          showNotification('success', 'Parecer descritivo atualizado com sucesso!');
        } else {
          // Check duplicate
          const { data: dup, error: dupErr } = await supabase
            .from('parecer_descritivo_infantil')
            .select('id')
            .eq('aluno_id', parsedAlunoId)
            .eq('periodo', selectedPeriodo)
            .eq('ativo', true);
          
          if (!dupErr && dup && dup.length > 0) {
            showNotification('error', `Já existe um parecer cadastrado para este aluno no ${selectedPeriodo}.`);
            setSaving(false);
            return;
          }

          const { error } = await supabase
            .from('parecer_descritivo_infantil')
            .insert([payload]);
          if (error) throw error;
          showNotification('success', 'Parecer descritivo cadastrado com sucesso!');
        }
      } else {
        const localEntries = [...entries];
        if (editingId) {
          const idx = localEntries.findIndex(le => le.id === editingId);
          if (idx !== -1) {
            localEntries[idx] = {
              ...localEntries[idx],
              escolaId: selectedEscolaId,
              escolaNome,
              turmaId: selectedTurmaId,
              turmaNome,
              alunoId: parsedAlunoId,
              alunoNome,
              periodo: selectedPeriodo,
              parecer: parecerText,
              aspectos: aspectosPayload as any,
              anoSerie
            };
          }
        } else {
          // Check duplicate in local
          const hasDup = localEntries.some(le => le.alunoId === parsedAlunoId && le.periodo === selectedPeriodo);
          if (hasDup) {
            showNotification('error', `Já existe um parecer cadastrado para este aluno no ${selectedPeriodo}.`);
            setSaving(false);
            return;
          }

          const newEntry: ParecerEntry = {
            id: crypto.randomUUID(),
            escolaId: selectedEscolaId,
            escolaNome,
            turmaId: selectedTurmaId,
            turmaNome,
            alunoId: parsedAlunoId,
            alunoNome,
            periodo: selectedPeriodo,
            parecer: parecerText,
            aspectos: aspectosPayload as any,
            anoSerie,
            criadoEm: new Date().toISOString()
          };
          localEntries.unshift(newEntry);
        }
        localStorage.setItem('sigar_parecer_descritivo_infantil', JSON.stringify(localEntries));
        setEntries(localEntries);
        showNotification('success', editingId ? 'Parecer atualizado no modo demo!' : 'Parecer salvo no modo demo!');
      }

      await logAudit(
        editingId ? 'UPDATE' : 'CREATE',
        'PARECER_INFANTIL',
        editingId || String(parsedAlunoId),
        {
          aluno: alunoNome,
          turma: turmaNome,
          escola: escolaNome,
          anoSerie,
          periodo: selectedPeriodo,
          status: statusValue
        }
      );

      resetForm();
      loadEntries();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erro ao salvar parecer descritivo.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: ParecerEntry) => {
    setEditingId(entry.id);
    setSelectedEscolaId(entry.escolaId);
    setSelectedGrupo(entry.anoSerie);
    setSelectedTurmaId(entry.turmaId);
    setAnoSerie(entry.anoSerie);
    setSelectedAlunoId(String(entry.alunoId));
    setSelectedPeriodo(entry.periodo);
    setParecerText(entry.parecer);
    
    // Unpack aspects from JSONB
    const asp = entry.aspectos || {};
    setCognitivoText(asp.cognitivo || '');
    setSocioemocionalText(asp.socioemocional || '');
    setMotorText(asp.motor || '');
    setLinguagemText(asp.linguagem || '');
    setPontosFortes(asp.pontosFortes || '');
    setAreasDesenvolver(asp.areasDesenvolver || '');
    setRecomendacoesFamilia(asp.recomendacoesFamilia || '');
    setStatusValue((asp.status as 'Rascunho' | 'Finalizado') || 'Rascunho');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja deletar este Parecer Descritivo?')) return;
    try {
      if (!isDemoMode) {
        const { error } = await supabase
          .from('parecer_descritivo_infantil')
          .update({ ativo: false })
          .eq('id', id);
        if (error) throw error;
      } else {
        const localEntries = entries.filter(le => le.id !== id);
        localStorage.setItem('sigar_parecer_descritivo_infantil', JSON.stringify(localEntries));
        setEntries(localEntries);
      }
      const entryToDelete = entries.find(le => le.id === id);
      showNotification('success', 'Parecer descritivo removido!');
      if (entryToDelete) {
        await logAudit('DELETE', 'PARECER_INFANTIL', id, {
          aluno: entryToDelete.alunoNome,
          turma: entryToDelete.turmaNome,
          escola: entryToDelete.escolaNome,
          periodo: entryToDelete.periodo
        });
      }
      loadEntries();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erro ao deletar parecer descritivo.');
    }
  };

  const hasActiveHistoryFilters = Boolean(
    historyFilterEscola ||
    historyFilterAnoSerie ||
    historyFilterTurma ||
    historyFilterBimestre ||
    historyFilterStatus ||
    historyFilterAluno
  );

  const handleClearHistoryFilters = () => {
    setHistoryFilterEscola('');
    setHistoryFilterAnoSerie('');
    setHistoryFilterTurma('');
    setHistoryFilterBimestre('');
    setHistoryFilterStatus('');
    setHistoryFilterAluno('');
  };

  const historyOptions = useMemo(() => {
    const escolasMap = new Map<string, string>();
    const faixasSet = new Set<string>();
    const turmasSet = new Set<string>();
    const bimestresSet = new Set<string>();
    const statusSet = new Set<string>();
    const alunosSet = new Set<string>();

    entries.forEach(entry => {
      const entryStatus = entry.aspectos?.status || 'Finalizado';
      const matchEscola = !historyFilterEscola || String(entry.escolaId) === String(historyFilterEscola);
      const matchFaixa = !historyFilterAnoSerie || entry.anoSerie === historyFilterAnoSerie;
      const matchTurma = !historyFilterTurma || entry.turmaNome === historyFilterTurma || String(entry.turmaId) === String(historyFilterTurma);
      const matchBimestre = !historyFilterBimestre || entry.periodo === historyFilterBimestre;
      const matchStatus = !historyFilterStatus || entryStatus === historyFilterStatus;
      const matchAluno = !historyFilterAluno || entry.alunoNome === historyFilterAluno || String(entry.alunoId) === String(historyFilterAluno);

      // Escolas
      if (entry.escolaId && entry.escolaNome) {
        if (matchFaixa && matchTurma && matchBimestre && matchStatus && matchAluno) {
          escolasMap.set(String(entry.escolaId), entry.escolaNome);
        }
      }

      // Faixas Etárias
      if (entry.anoSerie) {
        if (matchEscola && matchTurma && matchBimestre && matchStatus && matchAluno) {
          faixasSet.add(entry.anoSerie);
        }
      }

      // Turmas
      if (entry.turmaNome) {
        if (matchEscola && matchFaixa && matchBimestre && matchStatus && matchAluno) {
          turmasSet.add(entry.turmaNome);
        }
      }

      // Bimestres
      if (entry.periodo) {
        if (matchEscola && matchFaixa && matchTurma && matchStatus && matchAluno) {
          bimestresSet.add(entry.periodo);
        }
      }

      // Status
      if (entryStatus) {
        if (matchEscola && matchFaixa && matchTurma && matchBimestre && matchAluno) {
          statusSet.add(entryStatus);
        }
      }

      // Alunos
      if (entry.alunoNome) {
        if (matchEscola && matchFaixa && matchTurma && matchBimestre && matchStatus) {
          alunosSet.add(entry.alunoNome);
        }
      }
    });

    escolasInfantil.forEach(e => {
      if (!escolasMap.has(e.id)) {
        escolasMap.set(e.id, e.nome);
      }
    });

    FAiXAS_ETARIAS.forEach(f => faixasSet.add(f));
    PERIODOS.forEach(p => bimestresSet.add(p));
    statusSet.add('Finalizado');
    statusSet.add('Rascunho');

    const escolasList = Array.from(escolasMap.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
    const faixasList = Array.from(faixasSet).sort();
    const turmasList = Array.from(turmasSet).sort((a, b) => a.localeCompare(b));
    const bimestresList = Array.from(bimestresSet).sort();
    const statusList = Array.from(statusSet).sort();
    const alunosList = Array.from(alunosSet).sort((a, b) => a.localeCompare(b));

    return {
      escolas: escolasList,
      anosSeries: faixasList,
      turmas: turmasList,
      bimestres: bimestresList,
      status: statusList,
      alunos: alunosList
    };
  }, [entries, historyFilterEscola, historyFilterAnoSerie, historyFilterTurma, historyFilterBimestre, historyFilterStatus, historyFilterAluno, escolasInfantil]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const entryStatus = e.aspectos?.status || 'Finalizado';
      if (historyFilterEscola && String(e.escolaId) !== String(historyFilterEscola)) return false;
      if (historyFilterAnoSerie && e.anoSerie !== historyFilterAnoSerie && !e.anoSerie?.toLowerCase().includes(historyFilterAnoSerie.toLowerCase())) return false;
      if (historyFilterTurma && e.turmaNome !== historyFilterTurma && String(e.turmaId) !== String(historyFilterTurma)) return false;
      if (historyFilterBimestre && e.periodo !== historyFilterBimestre) return false;
      if (historyFilterStatus && entryStatus !== historyFilterStatus) return false;
      if (historyFilterAluno && e.alunoNome !== historyFilterAluno && String(e.alunoId) !== String(historyFilterAluno)) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchAluno = (e.alunoNome || '').toLowerCase().includes(term);
        const matchParecer = (e.parecer || '').toLowerCase().includes(term);
        const matchTurma = (e.turmaNome || '').toLowerCase().includes(term);
        const matchEscola = (e.escolaNome || '').toLowerCase().includes(term);
        if (!matchAluno && !matchParecer && !matchTurma && !matchEscola) return false;
      }

      return true;
    });
  }, [entries, historyFilterEscola, historyFilterAnoSerie, historyFilterTurma, historyFilterBimestre, historyFilterStatus, historyFilterAluno, searchTerm]);

  // Reset pagination to page 1 whenever any filter changes
  useEffect(() => {
    setHistoryCurrentPage(1);
  }, [historyFilterEscola, historyFilterAnoSerie, historyFilterTurma, historyFilterBimestre, historyFilterStatus, historyFilterAluno, searchTerm]);

  // Pagination Math
  const totalHistoryItems = filteredEntries.length;
  const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryItems / historyItemsPerPage));
  const safeHistoryCurrentPage = Math.min(historyCurrentPage, totalHistoryPages);

  const paginatedEntries = useMemo(() => {
    const start = (safeHistoryCurrentPage - 1) * historyItemsPerPage;
    return filteredEntries.slice(start, start + historyItemsPerPage);
  }, [filteredEntries, safeHistoryCurrentPage, historyItemsPerPage]);

  return (
    <div className="space-y-6 text-left">
      <PageHeader 
        title="Parecer Descritivo - Educação Infantil"
        subtitle="Registro qualitativo e individual do desenvolvimento cognitivo, motor e socioemocional da criança"
        icon={FileText}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {subHeader}

      {/* Printable Area - Hidden on Screen */}
      {printEntry && createPortal(
        <div id="print-report" className="hidden print:block bg-white p-8 text-black text-xs font-sans text-left">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-lg font-black tracking-tight">SISTEMA INTEGRADO DE GESTÃO DE APRENDIZAGEM (SIGAR)</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Parecer Descritivo do Desenvolvimento Individual - Educação Infantil</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 border p-4 rounded-lg bg-gray-50 text-[11px]">
            <div>
              <p><strong>Unidade Escolar:</strong> {printEntry.escolaNome}</p>
              <p><strong>Grupo/Faixa Etária:</strong> {printEntry.anoSerie}</p>
              <p><strong>Turma:</strong> {printEntry.turmaNome}</p>
            </div>
            <div>
              <p><strong>Estudante:</strong> <strong className="text-slate-800 uppercase">{printEntry.alunoNome}</strong></p>
              <p><strong>Período Avaliativo:</strong> {printEntry.periodo}</p>
              <p><strong>Status:</strong> {printEntry.aspectos.status || 'Finalizado'}</p>
              <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Areas of Development */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <h3 className="font-bold text-xs border-b pb-1 mb-2 uppercase text-slate-800">Desenvolvimento Cognitivo</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-700 bg-slate-50/50 p-2.5 rounded border border-slate-100 min-h-[40px]">
                  {printEntry.aspectos.cognitivo || 'Nenhum registro.'}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-xs border-b pb-1 mb-2 uppercase text-slate-800">Desenvolvimento Socioemocional</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-700 bg-slate-50/50 p-2.5 rounded border border-slate-100 min-h-[40px]">
                  {printEntry.aspectos.socioemocional || 'Nenhum registro.'}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-xs border-b pb-1 mb-2 uppercase text-slate-800">Desenvolvimento Motor</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-700 bg-slate-50/50 p-2.5 rounded border border-slate-100 min-h-[40px]">
                  {printEntry.aspectos.motor || 'Nenhum registro.'}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-xs border-b pb-1 mb-2 uppercase text-slate-800">Desenvolvimento de Linguagem</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-700 bg-slate-50/50 p-2.5 rounded border border-slate-100 min-h-[40px]">
                  {printEntry.aspectos.linguagem || 'Nenhum registro.'}
                </p>
              </div>
            </div>

            {/* Strengths & Areas to Develop */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold text-xs border-b pb-1 mb-2 uppercase text-slate-800">Pontos Fortes</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-700 bg-slate-50/50 p-2.5 rounded border border-slate-100 min-h-[40px]">
                  {printEntry.aspectos.pontosFortes || 'Nenhum registro.'}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-xs border-b pb-1 mb-2 uppercase text-slate-800">Áreas a Desenvolver</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-700 bg-slate-50/50 p-2.5 rounded border border-slate-100 min-h-[40px]">
                  {printEntry.aspectos.areasDesenvolver || 'Nenhum registro.'}
                </p>
              </div>
            </div>

            {/* Recommendations for family */}
            <div>
              <h3 className="font-bold text-xs border-b pb-1 mb-2 uppercase text-slate-800">Recomendações para a Família</h3>
              <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-700 bg-slate-50/50 p-2.5 rounded border border-slate-100 min-h-[40px]">
                {printEntry.aspectos.recomendacoesFamilia || 'Nenhum registro.'}
              </p>
            </div>

            {/* General Report */}
            <div>
              <h3 className="font-bold text-xs border-b pb-1 mb-2 uppercase text-slate-800">Parecer Geral</h3>
              <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-700 bg-slate-50/50 p-2.5 rounded border border-slate-100 min-h-[40px]">
                {printEntry.parecer || 'Nenhum registro.'}
              </p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 text-center pt-8 border-t text-[10px]">
            <div>
              <div className="border-t border-black w-48 mx-auto mt-6"></div>
              <p className="font-bold mt-1">Professor(a) Responsável</p>
            </div>
            <div>
              <div className="border-t border-black w-48 mx-auto mt-6"></div>
              <p className="font-bold mt-1">Equipe Pedagógica / Direção</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Form Card */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Bookmark className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
            {editingId ? 'Editar Parecer Descritivo' : 'Novo Parecer Descritivo'}
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Seletor de Unidade, Grupo/Faixa Etária e Turma */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unidade Escolar *</label>
              <SearchableSchoolSelect
                escolas={escolasInfantil}
                selectedId={selectedEscolaId}
                onChange={setSelectedEscolaId}
                placeholder="Selecione a Unidade"
                inputClassName="pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Grupo/Faixa Etária *</label>
              <select 
                value={selectedGrupo}
                onChange={e => setSelectedGrupo(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
              >
                {availableAnosSeries.length === 0 ? (
                  <option value="">Nenhum grupo cadastrado</option>
                ) : (
                  <>
                    <option value="">Selecione o Grupo/Faixa Etária</option>
                    {availableAnosSeries.map(a => <option key={a} value={a}>{a}</option>)}
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Turma *</label>
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
          </div>

          {/* Top Row: Aluno, Período, Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-6 text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Aluno *</label>
              <select 
                value={selectedAlunoId}
                onChange={e => setSelectedAlunoId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-indigo-500 transition-all bg-white shadow-sm"
              >
                <option value="">Selecione o Aluno</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="lg:col-span-4 text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Período</label>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                {PERIODOS.map(p => {
                  const label = p.replace("estre", ""); // "1º Bimestre" -> "1º Bim"
                  const isSelected = selectedPeriodo === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPeriodo(p)}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all text-center ${
                        isSelected 
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                {(['Rascunho', 'Finalizado'] as const).map(status => {
                  const isSelected = statusValue === status;
                  let selectedClasses = '';
                  if (isSelected) {
                    selectedClasses = status === 'Finalizado' 
                      ? 'bg-emerald-100 text-emerald-800 shadow-sm border border-emerald-200'
                      : 'bg-white text-slate-700 shadow-sm border border-slate-200/50';
                  }
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusValue(status)}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all text-center border border-transparent ${
                        isSelected 
                          ? selectedClasses
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-8 border-b border-slate-200 text-left">
            <div className="flex gap-6">
              {[
                { id: 'cognitivo', label: 'Cognitivo', icon: Brain },
                { id: 'socioemocional', label: 'Socioemocional', icon: Heart },
                { id: 'motor', label: 'Motor', icon: Activity },
                { id: 'linguagem', label: 'Linguagem', icon: MessageSquare }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all outline-none ${
                      isActive 
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab Textarea */}
          <div className="mt-4">
            <textarea
              value={
                activeTab === 'cognitivo' ? cognitivoText :
                activeTab === 'socioemocional' ? socioemocionalText :
                activeTab === 'motor' ? motorText : linguagemText
              }
              onChange={e => {
                const val = e.target.value;
                if (activeTab === 'cognitivo') setCognitivoText(val);
                else if (activeTab === 'socioemocional') setSocioemocionalText(val);
                else if (activeTab === 'motor') setMotorText(val);
                else setLinguagemText(val);
              }}
              placeholder={`Digite o parecer descritivo para o desenvolvimento ${activeTab}...`}
              rows={5}
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none text-xs font-semibold focus:border-indigo-500 transition-all bg-white resize-none shadow-sm text-left"
            />
          </div>

          {/* Grids for Strengths and Areas to Develop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-left">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Pontos Fortes</label>
              <textarea
                value={pontosFortes}
                onChange={e => setPontosFortes(e.target.value)}
                placeholder="Ex: Comunicação e interação..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none text-xs font-semibold focus:border-indigo-500 transition-all bg-white resize-none shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Áreas a Desenvolver</label>
              <textarea
                value={areasDesenvolver}
                onChange={e => setAreasDesenvolver(e.target.value)}
                placeholder="Ex: Foco em atividades prolongadas..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none text-xs font-semibold focus:border-indigo-500 transition-all bg-white resize-none shadow-sm"
              />
            </div>
          </div>

          {/* Recommendations for Family */}
          <div className="mt-6 text-left">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Recomendações para a Família</label>
            <textarea
              value={recomendacoesFamilia}
              onChange={e => setRecomendacoesFamilia(e.target.value)}
              placeholder="Ex: Estimular leitura em casa..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none text-xs font-semibold focus:border-indigo-500 transition-all bg-white resize-none shadow-sm"
            />
          </div>

          {/* General Report */}
          <div className="mt-6 text-left">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Parecer Geral</label>
            <textarea
              value={parecerText}
              onChange={e => setParecerText(e.target.value)}
              placeholder="Ex: Desenvolvimento dentro do esperado para a idade..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none text-xs font-semibold focus:border-indigo-500 transition-all bg-white resize-none shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={resetForm} 
              className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 bg-white transition-all"
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                if (!selectedEscolaId || !selectedTurmaId || !selectedAlunoId) {
                  showNotification('error', 'Selecione a Unidade, Turma e Aluno antes de imprimir.');
                  return;
                }
                const schoolObj = escolas.find(es => es.id === selectedEscolaId);
                const classObj = turmas.find(t => t.id === selectedTurmaId);
                const studentObj = students.find(s => s.id === Number(selectedAlunoId));

                const currentPrint: ParecerEntry = {
                  id: editingId || 'temp-print',
                  escolaId: selectedEscolaId,
                  escolaNome: schoolObj?.nome || 'Unidade',
                  turmaId: selectedTurmaId,
                  turmaNome: classObj ? `${classObj.name || classObj.anoSerie} • ${classObj.turno || ''}` : 'Turma',
                  alunoId: Number(selectedAlunoId),
                  alunoNome: studentObj?.name || 'Estudante',
                  periodo: selectedPeriodo,
                  parecer: parecerText,
                  aspectos: {
                    cognitivo: cognitivoText,
                    socioemocional: socioemocionalText,
                    motor: motorText,
                    linguagem: linguagemText,
                    pontosFortes,
                    areasDesenvolver,
                    recomendacoesFamilia,
                    status: statusValue
                  },
                  anoSerie: anoSerie,
                  criadoEm: new Date().toISOString()
                };
                
                setPrintEntry(currentPrint);
                setTimeout(() => {
                  window.print();
                  setPrintEntry(null);
                }, 150);
              }}
              className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 bg-white transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar PDF
            </Button>
            <Button 
              type="button" 
              onClick={(e) => {
                setStatusValue('Rascunho');
                setTimeout(() => {
                  const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                  handleSave(fakeEvent);
                }, 50);
              }}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 transition-all flex items-center gap-1.5 border border-indigo-100/50"
            >
              Salvar Rascunho
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {editingId ? 'Salvar Edição' : 'Criar'}
            </Button>
          </div>
        </form>
      </Card>

      {/* History table list */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Histórico de Pareceres</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Pesquise e consulte os pareceres individuais emitidos na Educação Infantil</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por estudante..."
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
                <option value="">Todas as Unidades</option>
                {historyOptions.escolas.map(e => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>

            {/* Faixa Etária / Ano */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Faixa Etária / Ano</label>
              <select
                value={historyFilterAnoSerie}
                onChange={e => setHistoryFilterAnoSerie(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
              >
                <option value="">Todas as Faixas Etárias</option>
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
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
              <select
                value={historyFilterStatus}
                onChange={e => setHistoryFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
              >
                <option value="">Todos os Status</option>
                {historyOptions.status.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Estudante */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estudante</label>
              <select
                value={historyFilterAluno}
                onChange={e => setHistoryFilterAluno(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white text-slate-700"
              >
                <option value="">Todos os Estudantes</option>
                {historyOptions.alunos.map(al => (
                  <option key={al} value={al}>{al}</option>
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
                  <th className="px-6 py-4">Estudante</th>
                  <th className="px-6 py-4">Unidade / Turma</th>
                  <th className="px-6 py-4">Grupo / Período</th>
                  <th className="px-6 py-4">Resumo do Desenvolvimento</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-orange mb-2" />
                      Carregando dados...
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold italic">
                      Nenhum parecer descritivo cadastrado.
                    </td>
                  </tr>
                ) : (
                  paginatedEntries.map(entry => {
                    const status = entry.aspectos?.status || 'Finalizado';
                    const isFinalizado = status === 'Finalizado';
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-black text-slate-800 uppercase tracking-tight">{entry.alunoNome}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Matrícula ECE</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-700">{entry.escolaNome}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{entry.turmaNome}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-700">{entry.anoSerie}</div>
                          <div className="text-[10px] text-brand-orange font-bold uppercase mt-0.5">{entry.periodo}</div>
                        </td>
                        <td className="px-6 py-4 max-w-[280px]">
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border max-w-fit mb-1 ${
                            isFinalizado
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {status}
                          </div>
                          <p className="text-slate-400 truncate text-[10px] italic">"{entry.parecer || 'Sem parecer geral'}"</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              onClick={() => {
                                setPrintEntry(entry);
                                setTimeout(() => {
                                  window.print();
                                  setPrintEntry(null);
                                }, 150);
                              }} 
                              variant="secondary" 
                              size="sm" 
                              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border"
                              title="Imprimir Parecer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              onClick={() => handleEdit(entry)} 
                              variant="secondary" 
                              size="sm" 
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg border"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              onClick={() => handleDelete(entry.id)} 
                              variant="secondary" 
                              size="sm" 
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border"
                              title="Deletar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                de <span className="font-bold text-slate-800">{totalHistoryItems}</span> pareceres descritivos registrados
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
                    <ChevronLeft size={14} />
                  </button>

                  <span className="px-2 font-bold text-slate-700">
                    {safeHistoryCurrentPage} / {totalHistoryPages}
                  </span>

                  <button
                    onClick={() => setHistoryCurrentPage(prev => Math.min(totalHistoryPages, prev + 1))}
                    disabled={safeHistoryCurrentPage === totalHistoryPages}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                    title="Próxima Página"
                  >
                    <ChevronRight size={14} />
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
