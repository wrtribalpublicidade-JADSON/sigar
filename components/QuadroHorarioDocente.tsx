import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Clock, Plus, X, Save, Trash2, Edit, Loader2, Printer, 
  Sun, Moon, Sunset, GraduationCap, BookOpen, Users, ChevronDown, Sparkles 
} from 'lucide-react';
import { Button } from './ui/Button';
import { Coordenador, Escola, Segmento } from '../types';
import { supabase } from '../services/supabase';
import { useConfiguracao } from '../context/ConfiguracaoContext';
import { 
  calcularGradeHorarios, 
  SlotHorarioCalculado, 
  DEFAULT_HORARIOS_CONFIG 
} from '../services/configuracaoService';
import { normalizeSubjectName, isEducaInfantilYear } from '../utils';

interface QuadroHorarioDocenteProps {
  escolaId: string;
  escola?: Escola;
  schoolTeachers: Coordenador[];
  schoolTurmas: any[];
  isDemoMode: boolean;
  canEdit: boolean;
}

interface HorarioSlot {
  id: string;
  school_id: string;
  teacher_id: string;
  turma_id: string;
  componente: string;
  dia_semana: string;
  turno: string;
  horario_inicio: string;
  horario_fim: string;
  numero_aula: number;
  etapa?: string;
}

const DIAS_SEMANA = [
  { id: 'SEGUNDA', label: 'Segunda-feira', short: 'SEG' },
  { id: 'TERCA', label: 'Terça-feira', short: 'TER' },
  { id: 'QUARTA', label: 'Quarta-feira', short: 'QUA' },
  { id: 'QUINTA', label: 'Quinta-feira', short: 'QUI' },
  { id: 'SEXTA', label: 'Sexta-feira', short: 'SEX' },
];

const TURNOS = [
  { id: 'MATUTINO', label: 'Matutino', key: 'matutino' as const, icon: Sun, color: 'amber' },
  { id: 'VESPERTINO', label: 'Vespertino', key: 'vespertino' as const, icon: Sunset, color: 'orange' },
  { id: 'NOTURNO', label: 'Noturno', key: 'noturno' as const, icon: Moon, color: 'indigo' },
];

const ETAPAS_DISPONIVEIS = [
  { id: 'Educação Infantil', label: 'Educação Infantil', sub: 'Creche e Pré-Escola', icon: GraduationCap, color: 'purple' },
  { id: 'Anos Iniciais', label: 'Anos Iniciais', sub: '1º ao 5º Ano', icon: BookOpen, color: 'emerald' },
  { id: 'Anos Finais', label: 'Anos Finais', sub: '6º ao 9º Ano', icon: BookOpen, color: 'orange' },
];

const DEFAULT_COMPONENTES = [
  'Língua Portuguesa', 'Matemática', 'Ciências', 'Geografia', 'História',
  'Educação Física', 'Arte', 'Ensino Religioso', 'Língua Inglesa'
];

const DEFAULT_CAMPOS_INFANTIL = [
  'O eu, o outro e o nós', 'Corpo, gestos e movimentos',
  'Traços, sons, cores e formas', 'Escuta, fala, pensamento e imaginação',
  'Espaços, tempos, quantidades, relações e transformações'
];

// Color palette for teachers
const TEACHER_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', badge: 'bg-violet-100 text-violet-700' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', badge: 'bg-cyan-100 text-cyan-700' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', badge: 'bg-pink-100 text-pink-700' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', badge: 'bg-teal-100 text-teal-700' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-700' },
  { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-800', badge: 'bg-lime-100 text-lime-700' },
];

const isEtapaOfertadaPelaEscola = (etapaId: string, escola?: Escola, schoolTurmas: any[] = []): boolean => {
  // 1. Verificar segmentos declarados na escola
  const hasSegment = escola?.segmentos?.some(s => {
    const sStr = String(s).trim().toLowerCase();
    if (etapaId === 'Educação Infantil') {
      return s === Segmento.INFANTIL || sStr.includes('infantil') || sStr.includes('creche') || sStr.includes('pré');
    }
    if (etapaId === 'Anos Iniciais') {
      return s === Segmento.FUNDAMENTAL_I || (sStr.includes('fundamental i') && !sStr.includes('fundamental ii')) || sStr.includes('iniciais');
    }
    if (etapaId === 'Anos Finais') {
      return s === Segmento.FUNDAMENTAL_II || sStr.includes('fundamental ii') || sStr.includes('finais');
    }
    return false;
  });

  // 2. Verificar turmas ativas da escola
  const hasTurma = schoolTurmas.some(t => {
    const stage = (t.stage || '').toLowerCase();
    const level = (t.level || '').toLowerCase();
    const year = (t.year || t.anoSerie || '').toLowerCase();

    if (etapaId === 'Educação Infantil') {
      return stage.includes('infantil') || stage.includes('creche') || stage.includes('pré') || level === 'infantil' || isEducaInfantilYear(year);
    }
    if (etapaId === 'Anos Iniciais') {
      return stage.includes('iniciais') || (!stage.includes('finais') && (/^[1-5]º?\s*ano/i.test(year) || /fundamental\s*i\b/i.test(stage)));
    }
    if (etapaId === 'Anos Finais') {
      return stage.includes('finais') || /^[6-9]º?\s*ano/i.test(year) || /fundamental\s*ii\b/i.test(stage);
    }
    return false;
  });

  if (escola?.segmentos && escola.segmentos.length > 0) {
    return Boolean(hasSegment || hasTurma);
  }
  if (schoolTurmas.length > 0) {
    return Boolean(hasTurma);
  }
  return true;
};

export const QuadroHorarioDocente: React.FC<QuadroHorarioDocenteProps> = ({
  escolaId,
  escola,
  schoolTeachers,
  schoolTurmas,
  isDemoMode,
  canEdit
}) => {
  const { configuracao } = useConfiguracao();
  const hc = configuracao?.horarios_config || DEFAULT_HORARIOS_CONFIG;

  // Filtrar apenas etapas que a escola oferta (por segmentos cadastrados ou turmas ativas)
  const etapasOfertadas = useMemo(() => {
    const filtradas = ETAPAS_DISPONIVEIS.filter(etapa =>
      isEtapaOfertadaPelaEscola(etapa.id, escola, schoolTurmas)
    );
    return filtradas.length > 0 ? filtradas : ETAPAS_DISPONIVEIS;
  }, [escola, schoolTurmas]);

  const [activeTurno, setActiveTurno] = useState<'MATUTINO' | 'VESPERTINO' | 'NOTURNO'>('MATUTINO');
  const [activeEtapa, setActiveEtapa] = useState<string>(() => {
    const filtradas = ETAPAS_DISPONIVEIS.filter(etapa =>
      isEtapaOfertadaPelaEscola(etapa.id, escola, schoolTurmas)
    );
    return filtradas.length > 0 ? filtradas[0].id : 'Anos Iniciais';
  });

  // Manter activeEtapa sincronizada caso a lista de etapas ofertadas mude
  useEffect(() => {
    if (etapasOfertadas.length > 0 && !etapasOfertadas.some(e => e.id === activeEtapa)) {
      setActiveEtapa(etapasOfertadas[0].id);
    }
  }, [etapasOfertadas, activeEtapa]);

  const [horarios, setHorarios] = useState<HorarioSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ 
    dia: string; 
    numero: number; 
    turno: string; 
    horarioInfo: { inicio: string; fim: string };
    existing?: HorarioSlot 
  } | null>(null);

  const [formTeacher, setFormTeacher] = useState('');
  const [formTurma, setFormTurma] = useState('');
  const [formComponente, setFormComponente] = useState('');

  const teacherColorMap = useMemo(() => {
    const map: Record<string, typeof TEACHER_COLORS[0]> = {};
    schoolTeachers.forEach((t, i) => {
      map[t.id] = TEACHER_COLORS[i % TEACHER_COLORS.length];
    });
    return map;
  }, [schoolTeachers]);

  // Obter duração em minutos da aula da etapa selecionada
  const getDuracaoAulaMinutos = useCallback((etapa: string): number => {
    if (etapa === 'Educação Infantil') {
      return hc.duracaoAulas?.educacaoInfantil || 50;
    }
    if (etapa === 'Anos Finais') {
      return hc.duracaoAulas?.anosFinais || 50;
    }
    return hc.duracaoAulas?.anosIniciais || 50;
  }, [hc]);

  const duracaoAulaAtiva = useMemo(() => {
    return getDuracaoAulaMinutos(activeEtapa);
  }, [getDuracaoAulaMinutos, activeEtapa]);

  // Obter a configuração do turno selecionado
  const currentTurnoKey = useMemo(() => {
    return (activeTurno.toLowerCase()) as 'matutino' | 'vespertino' | 'noturno';
  }, [activeTurno]);

  const currentTurnoConfig = useMemo(() => {
    return hc.turnos[currentTurnoKey] || hc.turnos.matutino;
  }, [hc, currentTurnoKey]);

  // Grade dinâmica calculada com base na configuração da rede
  const currentTurnoHorarios: SlotHorarioCalculado[] = useMemo(() => {
    return calcularGradeHorarios(currentTurnoConfig, duracaoAulaAtiva);
  }, [currentTurnoConfig, duracaoAulaAtiva]);

  const currentTurnoDef = useMemo(() => {
    return TURNOS.find(t => t.id === activeTurno)!;
  }, [activeTurno]);

  // Carregar dados de horários
  const loadHorarios = useCallback(async () => {
    if (!escolaId) return;
    setIsLoading(true);
    try {
      if (isDemoMode) {
        // Dados demonstrativos
        const demo: HorarioSlot[] = [];
        if (schoolTeachers.length > 0 && schoolTurmas.length > 0) {
          const t1 = schoolTeachers[0];
          const turma1 = schoolTurmas[0];
          demo.push(
            { 
              id: 'demo-1', 
              school_id: escolaId, 
              teacher_id: t1.id, 
              turma_id: turma1?.id || '', 
              componente: 'Língua Portuguesa', 
              dia_semana: 'SEGUNDA', 
              turno: 'MATUTINO', 
              horario_inicio: currentTurnoConfig.inicio, 
              horario_fim: '08:20', 
              numero_aula: 1,
              etapa: turma1?.stage || 'Anos Iniciais'
            },
            { 
              id: 'demo-2', 
              school_id: escolaId, 
              teacher_id: t1.id, 
              turma_id: turma1?.id || '', 
              componente: 'Língua Portuguesa', 
              dia_semana: 'QUARTA', 
              turno: 'MATUTINO', 
              horario_inicio: currentTurnoConfig.inicio, 
              horario_fim: '08:20', 
              numero_aula: 1,
              etapa: turma1?.stage || 'Anos Iniciais'
            },
          );
          if (schoolTeachers.length > 1) {
            const t2 = schoolTeachers[1];
            const turma2 = schoolTurmas[1] || schoolTurmas[0];
            demo.push(
              { 
                id: 'demo-3', 
                school_id: escolaId, 
                teacher_id: t2.id, 
                turma_id: turma2?.id || '', 
                componente: 'Matemática', 
                dia_semana: 'SEGUNDA', 
                turno: 'MATUTINO', 
                horario_inicio: '08:20', 
                horario_fim: '09:10', 
                numero_aula: 2,
                etapa: turma2?.stage || 'Anos Iniciais'
              },
              { 
                id: 'demo-4', 
                school_id: escolaId, 
                teacher_id: t2.id, 
                turma_id: turma2?.id || '', 
                componente: 'Matemática', 
                dia_semana: 'TERCA', 
                turno: 'MATUTINO', 
                horario_inicio: currentTurnoConfig.inicio, 
                horario_fim: '08:20', 
                numero_aula: 1,
                etapa: turma2?.stage || 'Anos Iniciais'
              },
            );
          }
        }
        setHorarios(demo);
      } else {
        const { data, error } = await supabase
          .from('horarios_docentes')
          .select('*')
          .eq('school_id', escolaId);
        if (error) throw error;
        setHorarios(data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar horários:', err);
    } finally {
      setIsLoading(false);
    }
  }, [escolaId, isDemoMode, schoolTeachers, schoolTurmas, currentTurnoConfig.inicio]);

  useEffect(() => {
    loadHorarios();
  }, [loadHorarios]);

  // Recupera o slot alocado para o dia, número de aula, turno e etapa selecionados
  const getSlot = (dia: string, numero: number): HorarioSlot | undefined => {
    return horarios.find(h => 
      h.dia_semana === dia && 
      h.numero_aula === numero && 
      h.turno === activeTurno &&
      (!h.etapa || h.etapa === activeEtapa)
    );
  };

  const openEditor = (dia: string, numero: number, horarioInfo: { inicio: string; fim: string }) => {
    if (!canEdit) return;
    const existing = getSlot(dia, numero);
    setEditingSlot({ dia, numero, turno: activeTurno, horarioInfo, existing });
    setFormTeacher(existing?.teacher_id || '');
    setFormTurma(existing?.turma_id || '');
    setFormComponente(existing?.componente ? normalizeSubjectName(existing.componente) : '');
  };

  const handleSaveSlot = async () => {
    if (!editingSlot || !formTeacher || !formTurma) return;
    setIsSaving(true);

    const slotHorario = currentTurnoHorarios.find(h => h.numero === editingSlot.numero);
    const turmaObj = schoolTurmas.find(t => String(t.id) === String(formTurma));
    const slotEtapa = turmaObj?.stage || (turmaObj?.level === 'Infantil' ? 'Educação Infantil' : activeEtapa);
    const normalizedComp = normalizeSubjectName(formComponente);

    try {
      if (isDemoMode) {
        const newSlot: HorarioSlot = {
          id: editingSlot.existing?.id || `demo-${Date.now()}`,
          school_id: escolaId,
          teacher_id: formTeacher,
          turma_id: formTurma,
          componente: normalizedComp,
          dia_semana: editingSlot.dia,
          turno: editingSlot.turno,
          horario_inicio: slotHorario?.inicio || editingSlot.horarioInfo.inicio,
          horario_fim: slotHorario?.fim || editingSlot.horarioInfo.fim,
          numero_aula: editingSlot.numero,
          etapa: slotEtapa,
        };
        if (editingSlot.existing) {
          setHorarios(prev => prev.map(h => h.id === editingSlot.existing!.id ? newSlot : h));
        } else {
          setHorarios(prev => [...prev, newSlot]);
        }
      } else {
        if (editingSlot.existing) {
          const { error } = await supabase
            .from('horarios_docentes')
            .update({
              teacher_id: formTeacher,
              turma_id: formTurma,
              componente: normalizedComp,
              etapa: slotEtapa,
              horario_inicio: slotHorario?.inicio || editingSlot.horarioInfo.inicio,
              horario_fim: slotHorario?.fim || editingSlot.horarioInfo.fim,
              updated_at: new Date().toISOString(),
            })
            .eq('id', editingSlot.existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('horarios_docentes')
            .insert({
              school_id: escolaId,
              teacher_id: formTeacher,
              turma_id: formTurma,
              componente: normalizedComp,
              dia_semana: editingSlot.dia,
              turno: editingSlot.turno,
              horario_inicio: slotHorario?.inicio || editingSlot.horarioInfo.inicio,
              horario_fim: slotHorario?.fim || editingSlot.horarioInfo.fim,
              numero_aula: editingSlot.numero,
              etapa: slotEtapa,
            });
          if (error) throw error;
        }
        await loadHorarios();
      }
      if (slotEtapa && slotEtapa !== activeEtapa && etapasOfertadas.some(e => e.id === slotEtapa)) {
        setActiveEtapa(slotEtapa);
      }
      setEditingSlot(null);
    } catch (err) {
      console.error('Erro ao salvar horário:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!editingSlot?.existing) return;
    setIsSaving(true);
    try {
      if (isDemoMode) {
        setHorarios(prev => prev.filter(h => h.id !== editingSlot.existing!.id));
      } else {
        const { error } = await supabase
          .from('horarios_docentes')
          .delete()
          .eq('id', editingSlot.existing.id);
        if (error) throw error;
        await loadHorarios();
      }
      setEditingSlot(null);
    } catch (err) {
      console.error('Erro ao remover horário:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getTeacherName = (id: string) => schoolTeachers.find(t => t.id === id)?.nome || '—';
  const getTurmaLabel = (id: string) => {
    const t = schoolTurmas.find(t => String(t.id) === String(id));
    if (!t) return '—';
    return `${t.year || t.anoSerie || ''} - ${t.name || ''}`.trim();
  };

  // Professor atualmente selecionado no modal
  const selectedTeacher = useMemo(() => {
    return schoolTeachers.find(t => t.id === formTeacher);
  }, [schoolTeachers, formTeacher]);

  // Apenas as turmas da unidade escolar às quais o professor esteja vinculado
  const teacherVinculatedTurmas = useMemo(() => {
    if (!selectedTeacher) return [];
    const vinculatedIds = (selectedTeacher.turmasIds || []).map(String);
    return schoolTurmas.filter(t => vinculatedIds.includes(String(t.id)));
  }, [selectedTeacher, schoolTurmas]);

  // Turma atualmente selecionada no formulário
  const selectedTurmaObj = useMemo(() => {
    return schoolTurmas.find(t => String(t.id) === String(formTurma));
  }, [schoolTurmas, formTurma]);

  // Identificar se a turma selecionada pertence à Educação Infantil
  const isSelectedTurmaInfantil = useMemo(() => {
    if (selectedTurmaObj) {
      const stage = (selectedTurmaObj.stage || '').toLowerCase();
      const level = (selectedTurmaObj.level || '').toLowerCase();
      const year = selectedTurmaObj.year || selectedTurmaObj.anoSerie || '';
      return stage.includes('infantil') || level === 'infantil' || isEducaInfantilYear(year);
    }
    return activeEtapa === 'Educação Infantil';
  }, [selectedTurmaObj, activeEtapa]);

  // Apenas o Campo de Experiência / componente curricular aos quais o professor esteja vinculado
  const selectedTurmaForComponents = useMemo(() => {
    if (!formTeacher || !formTurma) {
      return [];
    }

    const assignedComps = selectedTeacher?.turmaComponentes?.[formTurma] || [];

    // Se o professor possui componentes vinculados a esta turma na unidade escolar:
    // Exibir APENAS esses componentes vinculados!
    if (assignedComps.length > 0) {
      const seen = new Set<string>();
      const uniqueList: string[] = [];

      for (const item of assignedComps) {
        if (!item) continue;
        const normalized = isSelectedTurmaInfantil
          ? item.replace(/\*/g, '').trim().toUpperCase()
          : normalizeSubjectName(item);

        if (!normalized) continue;
        const key = normalized.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueList.push(normalized);
        }
      }
      return uniqueList;
    }

    // Fallback: se o professor estiver vinculado à turma mas sem disciplinas específicas no perfil
    // (ex: docente regente polivalente da Educação Infantil ou Anos Iniciais):
    let fallbackList: string[] = [];
    if (isSelectedTurmaInfantil) {
      const matrizInfantil = configuracao?.matrizes_curriculares?.infantil?.itens?.map(i => i.componente) || [];
      const configCampos = configuracao?.campos_experiencia || [];
      fallbackList = matrizInfantil.length > 0 ? matrizInfantil : (configCampos.length > 0 ? configCampos : DEFAULT_CAMPOS_INFANTIL);
    } else {
      const stageLower = (selectedTurmaObj?.stage || activeEtapa).toLowerCase();
      if (stageLower.includes('iniciais')) {
        const matrizIni = configuracao?.matrizes_curriculares?.fundamentalIniciais?.itens?.map(i => i.componente) || [];
        fallbackList = matrizIni.length > 0 ? matrizIni : (configuracao?.componentes_curriculares || DEFAULT_COMPONENTES);
      } else {
        const matrizFin = configuracao?.matrizes_curriculares?.fundamentalFinais?.itens?.map(i => i.componente) || [];
        fallbackList = matrizFin.length > 0 ? matrizFin : (configuracao?.componentes_curriculares || DEFAULT_COMPONENTES);
      }
    }

    const seen = new Set<string>();
    const uniqueList: string[] = [];
    for (const item of fallbackList) {
      if (!item) continue;
      const normalized = isSelectedTurmaInfantil
        ? item.replace(/\*/g, '').trim().toUpperCase()
        : normalizeSubjectName(item);
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push(normalized);
      }
    }
    return uniqueList;
  }, [formTeacher, formTurma, selectedTeacher, isSelectedTurmaInfantil, selectedTurmaObj, configuracao, activeEtapa]);

  // Estatísticas filtradas por turno e etapa
  const turnoHorarios = useMemo(() => {
    return horarios.filter(h => 
      h.turno === activeTurno && (!h.etapa || h.etapa === activeEtapa)
    );
  }, [horarios, activeTurno, activeEtapa]);

  const totalSlots = currentTurnoHorarios.filter(h => !h.intervalo).length * DIAS_SEMANA.length;
  const filledSlots = turnoHorarios.length;
  const uniqueTeachersInTurno = new Set(turnoHorarios.map(h => h.teacher_id)).size;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="ml-3 text-slate-500 font-medium">Carregando quadro de horários...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Quadro de Horário Docente
          </h4>
          <p className="text-slate-500 text-xs mt-1">
            Distribuição semanal de aulas por professor, turma e componente curricular vinculada às diretrizes da rede.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            <span>Aula: {duracaoAulaAtiva} min</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="print:hidden flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Etapa Tabs */}
      <div className="bg-slate-50/80 p-2 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-2 mr-1">
            Etapa:
          </span>
          {etapasOfertadas.map(etapa => {
            const isCurrent = activeEtapa === etapa.id;
            const EtapaIcon = etapa.icon;
            const duracaoEtapa = getDuracaoAulaMinutos(etapa.id);
            const countEtapa = horarios.filter(h => 
              h.turno === activeTurno && (h.etapa === etapa.id || (!h.etapa && etapa.id === 'Anos Iniciais'))
            ).length;

            return (
              <button
                key={etapa.id}
                type="button"
                onClick={() => setActiveEtapa(etapa.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200
                  ${isCurrent
                    ? etapa.id === 'Educação Infantil'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                      : etapa.id === 'Anos Finais'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                      : 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }
                `}
              >
                <EtapaIcon className="w-4 h-4" />
                <span>{etapa.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {duracaoEtapa} min
                </span>
                {countEtapa > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${isCurrent ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {countEtapa}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] font-bold text-slate-500 pr-2">
          Horários parametrizados globalmente em Configurações da Rede
        </div>
      </div>

      {/* Turno Tabs */}
      <div className="flex flex-wrap gap-2 print:hidden">
        {TURNOS.map(turno => {
          const TurnoIcon = turno.icon;
          const isActive = activeTurno === turno.id;
          const turnoCount = horarios.filter(h => 
            h.turno === turno.id && (!h.etapa || h.etapa === activeEtapa)
          ).length;
          const turnoCfg = hc.turnos[turno.key] || hc.turnos.matutino;

          return (
            <button
              key={turno.id}
              onClick={() => setActiveTurno(turno.id as any)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200
                ${isActive
                  ? turno.id === 'MATUTINO' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                  : turno.id === 'VESPERTINO' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }
              `}
            >
              <TurnoIcon className="w-4 h-4" />
              <span>{turno.label}</span>
              <span className={`text-[10px] font-medium opacity-90 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                (Início: {turnoCfg.inicio})
              </span>
              {turnoCount > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {turnoCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Header Info for Print */}
      <div className="hidden print:block border-b border-slate-200 pb-3 mb-4">
        <h3 className="text-xl font-black text-slate-900 uppercase">
          Quadro de Horário Docente — {activeEtapa}
        </h3>
        <p className="text-sm text-slate-600 font-bold mt-1">
          Turno: {currentTurnoDef.label} (Início: {currentTurnoConfig.inicio}) • Duração da Aula: {duracaoAulaAtiva} min • Intervalo: {currentTurnoConfig.duracaoIntervalo} min
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 flex-wrap print:hidden">
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alocações ({activeEtapa})</span>
            <span className="text-sm font-black text-slate-800">{filledSlots}/{totalSlots}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Docentes Alocados</span>
            <span className="text-sm font-black text-slate-800">{uniqueTeachersInTurno}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ocupação da Grade</span>
            <span className="text-sm font-black text-slate-800">{totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0}%</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intervalo / Recreio</span>
            <span className="text-sm font-black text-slate-800">{currentTurnoConfig.duracaoIntervalo} min (Após {currentTurnoConfig.intervaloAposAula}ª aula)</span>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200 w-[130px]">
                  Horário
                </th>
                {DIAS_SEMANA.map(dia => (
                  <th key={dia.id} className="text-center px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-slate-200 last:border-r-0">
                    <span className="hidden sm:inline">{dia.label}</span>
                    <span className="sm:hidden">{dia.short}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTurnoHorarios.map((horario, idx) => {
                if (horario.intervalo) {
                  return (
                    <tr key={`intervalo-${idx}`} className="bg-amber-50/50">
                      <td
                        colSpan={6}
                        className="text-center py-2.5 text-[10px] font-black text-amber-700 uppercase tracking-widest border-b border-slate-200"
                      >
                        ☕ Intervalo / Recreio — {horario.inicio} às {horario.fim} ({currentTurnoConfig.duracaoIntervalo} min)
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={`aula-${horario.numero}`} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-2 border-b border-r border-slate-200 bg-slate-50/50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{horario.numero}ª Aula</span>
                        <span className="text-[10px] text-slate-500 font-bold">{horario.inicio} - {horario.fim}</span>
                        <span className="text-[9px] text-slate-400 font-medium">{duracaoAulaAtiva} min</span>
                      </div>
                    </td>
                    {DIAS_SEMANA.map(dia => {
                      const slot = getSlot(dia.id, horario.numero);
                      const colors = slot ? teacherColorMap[slot.teacher_id] || TEACHER_COLORS[0] : null;
                      return (
                        <td
                          key={dia.id}
                          className={`px-1.5 py-1.5 border-b border-r border-slate-200 last:border-r-0 align-top ${canEdit ? 'cursor-pointer' : ''}`}
                          onClick={() => openEditor(dia.id, horario.numero, horario)}
                        >
                          {slot ? (
                            <div className={`${colors!.bg} ${colors!.border} border rounded-xl p-2.5 h-full min-h-[64px] transition-all hover:shadow-sm group relative`}>
                              <div className={`text-[11px] font-bold ${colors!.text} leading-tight truncate`}>
                                {getTeacherName(slot.teacher_id).split(' ').slice(0, 2).join(' ')}
                              </div>
                              <div className="text-[10px] text-slate-600 font-bold truncate mt-0.5">
                                {getTurmaLabel(slot.turma_id)}
                              </div>
                              {slot.componente && (
                                <span className={`inline-block mt-1 text-[8.5px] font-bold px-1.5 py-0.5 rounded-md ${colors!.badge} truncate max-w-full`}>
                                  {normalizeSubjectName(slot.componente)}
                                </span>
                              )}
                              {canEdit && (
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Edit className="w-3 h-3 text-slate-400" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`rounded-xl h-full min-h-[64px] flex items-center justify-center border border-dashed transition-all ${canEdit ? 'border-slate-200 hover:border-orange-300 hover:bg-orange-50/30' : 'border-slate-100'}`}>
                              {canEdit && (
                                <Plus className="w-4 h-4 text-slate-300 hover:text-orange-400 transition-colors" />
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      {schoolTeachers.length > 0 && turnoHorarios.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 print:hidden">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Legenda de Professores</span>
          <div className="flex flex-wrap gap-2">
            {schoolTeachers.filter(t => turnoHorarios.some(h => h.teacher_id === t.id)).map(teacher => {
              const colors = teacherColorMap[teacher.id] || TEACHER_COLORS[0];
              return (
                <div key={teacher.id} className={`${colors.bg} ${colors.border} border rounded-lg px-3 py-1.5 flex items-center gap-2`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${colors.badge.split(' ')[0]}`} />
                  <span className={`text-[10px] font-bold ${colors.text}`}>{teacher.nome}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {schoolTeachers.length === 0 && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-12 text-center print:hidden">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-slate-600">Nenhum professor vinculado</h4>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
            Vincule professores a esta escola na aba "Professores e Vínculos" para montar o quadro de horários.
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h4 className="text-lg font-bold text-slate-800">
                  {editingSlot.existing ? 'Editar Horário' : 'Novo Horário'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {DIAS_SEMANA.find(d => d.id === editingSlot.dia)?.label} — {editingSlot.numero}ª Aula ({editingSlot.horarioInfo.inicio} - {editingSlot.horarioInfo.fim}) • {activeEtapa}
                </p>
              </div>
              <button
                onClick={() => setEditingSlot(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 border border-slate-200/60 shadow-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Professor */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Professor
                </label>
                <div className="relative">
                  <select
                    value={formTeacher}
                    onChange={(e) => {
                      const newTeacherId = e.target.value;
                      setFormTeacher(newTeacherId);
                      const teacher = schoolTeachers.find(t => t.id === newTeacherId);
                      const tTurmas = schoolTurmas.filter(t => (teacher?.turmasIds || []).includes(t.id));
                      if (tTurmas.length === 1) {
                        const singleTurmaId = String(tTurmas[0].id);
                        setFormTurma(singleTurmaId);
                        const comps = teacher?.turmaComponentes?.[singleTurmaId] || [];
                        if (comps.length === 1) {
                          setFormComponente(normalizeSubjectName(comps[0]));
                        } else {
                          setFormComponente('');
                        }
                      } else {
                        setFormTurma('');
                        setFormComponente('');
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none appearance-none pr-10"
                  >
                    <option value="">Selecione um professor...</option>
                    {schoolTeachers.map(t => {
                      const vinculadasCount = (t.turmasIds || []).length;
                      return (
                        <option key={t.id} value={t.id}>
                          {t.nome} {vinculadasCount > 0 ? `(${vinculadasCount} turma${vinculadasCount > 1 ? 's' : ''})` : '(Sem turmas)'}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Turma (Apenas as turmas vinculadas ao professor na unidade escolar) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Turma {selectedTeacher ? `(${selectedTeacher.nome.split(' ').slice(0, 2).join(' ')})` : ''}
                  </label>
                  <span className={`text-[10px] font-bold ${!formTeacher ? 'text-slate-400' : teacherVinculatedTurmas.length === 0 ? 'text-rose-500' : 'text-brand-orange'}`}>
                    {!formTeacher 
                      ? 'Selecione o professor' 
                      : `${teacherVinculatedTurmas.length} turma(s) vinculada(s)`
                    }
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={formTurma}
                    disabled={!formTeacher || teacherVinculatedTurmas.length === 0}
                    onChange={(e) => {
                      const newTurmaId = e.target.value;
                      setFormTurma(newTurmaId);
                      const comps = selectedTeacher?.turmaComponentes?.[newTurmaId] || [];
                      if (comps.length === 1) {
                        setFormComponente(normalizeSubjectName(comps[0]));
                      } else {
                        setFormComponente('');
                      }
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none appearance-none pr-10 ${
                      !formTeacher || teacherVinculatedTurmas.length === 0
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-slate-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                  >
                    {!formTeacher ? (
                      <option value="">Selecione primeiro um professor...</option>
                    ) : teacherVinculatedTurmas.length === 0 ? (
                      <option value="">Nenhuma turma vinculada a este professor</option>
                    ) : (
                      <>
                        <option value="">Selecione uma turma...</option>
                        {teacherVinculatedTurmas.map(t => (
                          <option key={t.id} value={t.id}>
                            {(t.year || t.anoSerie) ? `${t.year || t.anoSerie} - ` : ''}{t.name || ''} • {t.shift || 'MANHÃ'}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {formTeacher && teacherVinculatedTurmas.length === 0 && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    Este professor não possui turmas vinculadas nesta unidade escolar.
                  </p>
                )}
              </div>

              {/* Componente Curricular / Campo de Experiência (Apenas aos quais o professor está vinculado) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {isSelectedTurmaInfantil ? 'Campo de Experiência' : 'Componente Curricular'}
                  </label>
                  {formTurma && (
                    <span className="text-[10px] font-bold text-slate-400">
                      {selectedTurmaForComponents.length} vinculado(s)
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={normalizeSubjectName(formComponente)}
                    disabled={!formTurma || selectedTurmaForComponents.length === 0}
                    onChange={(e) => setFormComponente(normalizeSubjectName(e.target.value))}
                    className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none appearance-none pr-10 ${
                      !formTurma
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-slate-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                  >
                    {!formTurma ? (
                      <option value="">Selecione primeiro a turma...</option>
                    ) : selectedTurmaForComponents.length === 0 ? (
                      <option value="">Nenhum componente vinculado a este professor</option>
                    ) : (
                      <>
                        <option value="">Selecione (opcional)...</option>
                        {selectedTurmaForComponents.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between gap-3">
              <div>
                {editingSlot.existing && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteSlot}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSlot(null)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveSlot}
                  disabled={isSaving || !formTeacher || !formTurma}
                  className="bg-brand-orange hover:bg-orange-600 text-white flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
