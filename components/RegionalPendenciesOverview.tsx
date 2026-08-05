import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, BookOpen, FileText, CheckSquare, GraduationCap, Sparkles,
  Presentation, Award, Target, FileCheck, Eye, Calendar, ClipboardCheck,
  UserCheck, HeartHandshake, AlertCircle, Search, Filter, AlertTriangle,
  CheckCircle, ChevronRight, School, RefreshCw, X, Building2, ExternalLink
} from 'lucide-react';
import { Escola, Coordenador, StatusMeta } from '../types';
import { supabase } from '../services/supabase';

interface RegionalPendenciesOverviewProps {
  escolas: Escola[];
  coordenadores?: Coordenador[];
  currentUser?: Coordenador;
  onNavigateToEscola?: (escolaId: string) => void;
}

export interface DimensionDef {
  id: string;
  title: string;
  description: string;
  category: 'Docência & Turmas' | 'Pedagógico' | 'Gestão' | 'Atividades & Reuniões';
  icon: React.ElementType;
  check: (escola: Escola, dbData: Record<string, Set<string>>, coordenadores?: Coordenador[]) => { isPending: boolean; reason: string };
}

export const RegionalPendenciesOverview: React.FC<RegionalPendenciesOverviewProps> = ({
  escolas,
  coordenadores = [],
  currentUser,
  onNavigateToEscola
}) => {
  const [dbData, setDbData] = useState<Record<string, Set<string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedDimension, setSelectedDimension] = useState<DimensionDef | null>(null);

  // Escolas da regional do coordenador (ou todas para admin)
  const regionalEscolas = useMemo(() => {
    if (!currentUser) return escolas;
    if (currentUser.funcao === 'Administrador' || currentUser.funcao === 'Gestor') {
      return escolas;
    }
    if (currentUser.escolasIds && currentUser.escolasIds.length > 0) {
      return escolas.filter(e => currentUser.escolasIds.includes(e.id));
    }
    return escolas;
  }, [escolas, currentUser]);

  // Carregar dados de presenças em cada tabela do Supabase de forma segura
  useEffect(() => {
    let isMounted = true;

    const loadDbPresence = async () => {
      setIsLoading(true);

      const safeFetchSet = async (table: string, fields = ['escola_id', 'school_id']) => {
        try {
          const { data, error } = await supabase.from(table).select(fields.join(', '));
          if (error || !data) return new Set<string>();
          const set = new Set<string>();
          data.forEach((row: any) => {
            if (row.escola_id) set.add(String(row.escola_id));
            if (row.school_id) set.add(String(row.school_id));
          });
          return set;
        } catch {
          return new Set<string>();
        }
      };

      const safeFetchArray = async (table: string, fields: string) => {
        try {
          const { data, error } = await supabase.from(table).select(fields);
          if (error || !data) return [];
          return data;
        } catch {
          return [];
        }
      };

      const [
        planosCurso,
        planosCursoInfantil,
        aulasMinistradas,
        frequencias,
        notas,
        atividadesComp,
        reunioes,
        formacao,
        ppp,
        acompSala,
        calendario,
        conselhoClasse,
        reuniaoEstudantil,
        avaliacaoDocente,
        acompanhamentoDocente,
        encaminhamentos,
        dbCoords,
        dbCoordEscolas,
        dbCoordTurmas
      ] = await Promise.all([
        safeFetchSet('planos_curso'),
        safeFetchSet('planos_curso_infantil'),
        safeFetchSet('aulas_ministradas'),
        safeFetchSet('frequencias'),
        safeFetchSet('conselho_classe_notas'),
        safeFetchSet('atividades_complementares'),
        safeFetchSet('ig_ciclo_reunioes', ['escola_id']),
        safeFetchSet('ig_plano_formacao', ['escola_id']),
        safeFetchSet('ig_proposta_pedagogica', ['escola_id']),
        safeFetchSet('ig_acompanhamento_sala', ['escola_id']),
        safeFetchSet('ig_calendario_interno', ['escola_id']),
        safeFetchSet('conselhos_classe'),
        safeFetchSet('ig_reuniao_estudantil', ['escola_id']),
        safeFetchSet('avaliacao_docente_infantil', ['escola_id']),
        safeFetchSet('acompanhamento_docente', ['escola_id']),
        safeFetchSet('encaminhamentos', ['escola_id']),
        safeFetchArray('coordenadores', 'id, funcao, escolas_ids, turmas_ids'),
        safeFetchArray('coordenador_escolas', 'coordenador_id, escola_id'),
        safeFetchArray('coordenador_turmas', 'coordenador_id, turma_id')
      ]);

      if (!isMounted) return;

      // Process teacher maps
      const professoresSet = new Set<string>();
      const professoresComTurmasSet = new Set<string>();

      const coordEscolaMap: Record<string, string[]> = {};
      dbCoordEscolas.forEach((ce: any) => {
        if (ce.coordenador_id && ce.escola_id) {
          const cid = String(ce.coordenador_id);
          if (!coordEscolaMap[cid]) coordEscolaMap[cid] = [];
          coordEscolaMap[cid].push(String(ce.escola_id));
        }
      });

      const coordTurmaCount: Record<string, number> = {};
      dbCoordTurmas.forEach((ct: any) => {
        if (ct.coordenador_id) {
          const cid = String(ct.coordenador_id);
          coordTurmaCount[cid] = (coordTurmaCount[cid] || 0) + 1;
        }
      });

      dbCoords.forEach((c: any) => {
        if (c.funcao === 'Professor') {
          const cid = String(c.id);
          const schIds = c.escolas_ids || coordEscolaMap[cid] || [];
          const hasTurmas = (c.turmas_ids && c.turmas_ids.length > 0) || (coordTurmaCount[cid] && coordTurmaCount[cid] > 0);

          schIds.forEach((sid: any) => {
            const sStr = String(sid);
            professoresSet.add(sStr);
            if (hasTurmas) {
              professoresComTurmasSet.add(sStr);
            }
          });
        }
      });

      // Merge planos_curso
      const guiasSet = new Set([...planosCurso, ...planosCursoInfantil]);

      setDbData({
        guias: guiasSet,
        aulas: aulasMinistradas,
        frequencias,
        notas,
        atividadesComp,
        reunioes,
        formacao,
        ppp,
        acompSala,
        calendario,
        conselhoClasse,
        reuniaoEstudantil,
        avaliacaoDocente,
        acompanhamentoDocente,
        encaminhamentos,
        professores: professoresSet,
        professoresComTurmas: professoresComTurmasSet
      });

      setIsLoading(false);
    };

    loadDbPresence();
    return () => { isMounted = false; };
  }, []);

  // Lista das 17 dimensões de acompanhamento
  const dimensions: DimensionDef[] = useMemo(() => [
    {
      id: 'professores_vinculos',
      title: 'Professores e Vínculos',
      description: 'Quadro de docentes e alocação nas turmas da unidade',
      category: 'Docência & Turmas',
      icon: Users,
      check: (escola, db, coordenadoresList) => {
        const schoolIdStr = String(escola.id);

        // 1. Check in coordenadores list from props or state
        const teachersFromProps = (coordenadoresList || []).filter(
          c => c.funcao === 'Professor' && c.escolasIds && c.escolasIds.some(id => String(id) === schoolIdStr)
        );

        // 2. Check in DB teacher sets
        const hasDbTeachers = db.professores && db.professores.has(schoolIdStr);
        const hasDbTeachersWithTurmas = db.professoresComTurmas && db.professoresComTurmas.has(schoolIdStr);

        // 3. Check in escola.recursosHumanos
        const teachersFromRH = (escola.recursosHumanos || []).filter(
          r => r.funcao === 'Professor' || r.funcao?.toLowerCase().includes('profess')
        );

        const totalProfessors = teachersFromProps.length + teachersFromRH.length + (hasDbTeachers ? 1 : 0);

        if (totalProfessors === 0) {
          return { isPending: true, reason: 'Nenhum professor alocado no quadro' };
        }

        const teachersWithTurmasFromProps = teachersFromProps.filter(
          t => (t.turmasIds && t.turmasIds.length > 0) || (t.turmaComponentes && Object.keys(t.turmaComponentes).length > 0)
        );

        const hasTurmasVinculadas = teachersWithTurmasFromProps.length > 0 || hasDbTeachersWithTurmas || teachersFromRH.length > 0;

        if (!hasTurmasVinculadas) {
          return { isPending: true, reason: 'Professores cadastrados sem vínculo de turmas' };
        }

        return { isPending: false, reason: 'Quadro de professores e vínculos ativo' };
      }
    },
    {
      id: 'guias_aprendizagem',
      title: 'Guias de Aprendizagem do Período',
      description: 'Planos de curso e guias de aprendizagem dos componentes',
      category: 'Pedagógico',
      icon: BookOpen,
      check: (escola, db) => {
        const hasDb = db.guias && db.guias.has(String(escola.id));
        if (!hasDb) return { isPending: true, reason: 'Nenhum guia de aprendizagem/plano registrado' };
        return { isPending: false, reason: 'Guias de aprendizagem em dia' };
      }
    },
    {
      id: 'aulas_ministradas',
      title: 'Aulas Ministradas',
      description: 'Diário de registro de aulas e conteúdos ministrados',
      category: 'Pedagógico',
      icon: FileText,
      check: (escola, db) => {
        const hasDb = db.aulas && db.aulas.has(String(escola.id));
        if (!hasDb) return { isPending: true, reason: 'Sem aulas ministradas registradas no período' };
        return { isPending: false, reason: 'Registro de aulas em dia' };
      }
    },
    {
      id: 'frequencia',
      title: 'Registro de Frequência',
      description: 'Acompanhamento da assiduidade e chamada dos alunos',
      category: 'Pedagógico',
      icon: CheckSquare,
      check: (escola, db) => {
        const hasDb = db.frequencias && db.frequencias.has(String(escola.id));
        const freqMedia = escola.indicadores?.frequenciaMedia || 0;
        if (!hasDb && freqMedia === 0) return { isPending: true, reason: 'Frequência escolar pendente de lançamento' };
        return { isPending: false, reason: 'Registro de frequência em dia' };
      }
    },
    {
      id: 'notas',
      title: 'Lançamento de Notas e Avaliações',
      description: 'Registro de notas, conceitos e notas bimestrais',
      category: 'Pedagógico',
      icon: GraduationCap,
      check: (escola, db) => {
        const hasDb = db.notas && db.notas.has(String(escola.id));
        if (!hasDb) return { isPending: true, reason: 'Lançamento de notas/conceitos pendente' };
        return { isPending: false, reason: 'Avaliações e notas atualizadas' };
      }
    },
    {
      id: 'atividades_complementares',
      title: 'Registro de Atividades Complementares',
      description: 'Programas de ampliação de jornada e oficinas',
      category: 'Atividades & Reuniões',
      icon: Sparkles,
      check: (escola, db) => {
        if (!escola.ofertaAtividadeComplementar) {
          return { isPending: false, reason: 'Não aplica (Escola sem oferta de Atividade Complementar)' };
        }
        const hasDb = db.atividadesComp && db.atividadesComp.has(String(escola.id));
        if (!hasDb) return { isPending: true, reason: 'Atividades complementares sem registros/frequência' };
        return { isPending: false, reason: 'Atividades complementares em dia' };
      }
    },
    {
      id: 'ciclo_reunioes',
      title: 'Ciclo de Reuniões',
      description: 'Atas e pautas das reuniões pedagógicas e administrativas',
      category: 'Atividades & Reuniões',
      icon: Presentation,
      check: (escola, db) => {
        const hasDb = db.reunioes && db.reunioes.has(String(escola.id));
        if (!hasDb) return { isPending: true, reason: 'Nenhuma reunião registrada no ciclo atual' };
        return { isPending: false, reason: 'Ciclo de reuniões registrado' };
      }
    },
    {
      id: 'plano_formacao',
      title: 'Plano de Formação Continuada',
      description: 'Encontros de formação e capacitação dos educadores',
      category: 'Gestão',
      icon: Award,
      check: (escola, db) => {
        const hasDb = db.formacao && db.formacao.has(String(escola.id));
        if (!hasDb) return { isPending: true, reason: 'Plano de formação continuada pendente' };
        return { isPending: false, reason: 'Formação continuada em dia' };
      }
    },
    {
      id: 'plano_acao',
      title: 'Plano de Ação Escolar',
      description: 'Metas estratégicas e plano de ação pedagógico',
      category: 'Gestão',
      icon: Target,
      check: (escola) => {
        const plano = escola.planoAcao || [];
        const hasStarted = plano.some(m => m.status !== StatusMeta.NAO_INICIADO);
        if (plano.length === 0) return { isPending: true, reason: 'Plano de ação não cadastrado' };
        if (!hasStarted) return { isPending: true, reason: 'Nenhuma meta do plano de ação foi iniciada' };
        return { isPending: false, reason: 'Plano de ação em execução' };
      }
    },
    {
      id: 'proposta_pedagogica',
      title: 'Proposta Pedagógica (PPP)',
      description: 'Projeto Político-Pedagógico e diretrizes da escola',
      category: 'Gestão',
      icon: FileCheck,
      check: (escola, db) => {
        const hasDb = db.ppp && db.ppp.has(String(escola.id));
        if (!hasDb) return { isPending: true, reason: 'Proposta Político-Pedagógica não cadastrada/atualizada' };
        return { isPending: false, reason: 'PPP registrado no sistema' };
      }
    },
    {
      id: 'acompanhamento_sala',
      title: 'Acompanhamento em Sala de Aula',
      description: 'Observação da prática docente e escuta pedagógica',
      category: 'Pedagógico',
      icon: Eye,
      check: (escola, db) => {
        const hasDb = db.acompSala && db.acompSala.has(String(escola.id));
        if (!hasDb) return { isPending: true, reason: 'Sem registros de acompanhamento em sala de aula' };
        return { isPending: false, reason: 'Acompanhamentos de sala registrados' };
      }
    },
    {
      id: 'calendario_interno',
      title: 'Calendário Interno',
      description: 'Eventos, avaliações e planejamento do calendário escolar',
      category: 'Gestão',
      icon: Calendar,
      check: (escola, db) => {
        const hasDb = db.calendario && db.calendario.has(String(escola.id));
        if (!hasDb) return { isPending: true, reason: 'Calendário de eventos internos não configurado' };
        return { isPending: false, reason: 'Calendário interno atualizado' };
      }
    },
    {
      id: 'conselho_classe',
      title: 'Conselho de Classe',
      description: 'Atas, pareceres e deliberações do Conselho de Classe',
      category: 'Pedagógico',
      icon: ClipboardCheck,
      check: (escola, db) => {
        const hasDb = db.conselhoClasse && db.conselhoClasse.has(String(escola.id));
        if (!hasDb) return { isPending: true, reason: 'Fechamento de Conselho de Classe pendente' };
        return { isPending: false, reason: 'Conselho de classe concluído' };
      }
    },
    {
      id: 'reuniao_estudantil',
      title: 'Reunião Estudantil / Grêmio',
      description: 'Assembleias estudantis e reuniões com representantes',
      category: 'Atividades & Reuniões',
      icon: Presentation,
      check: (escola, db) => {
        const hasDb = db.reuniaoEstudantil && db.reuniaoEstudantil.has(String(escola.id));
        if (!hasDb) return { isPending: true, reason: 'Registros de reuniões estudantis pendentes' };
        return { isPending: false, reason: 'Reuniões estudantis registradas' };
      }
    },
    {
      id: 'avaliacao_docente',
      title: 'Avaliação Docente',
      description: 'Autoavaliação e avaliação de desempenho dos educadores',
      category: 'Docência & Turmas',
      icon: UserCheck,
      check: (escola, db) => {
        const hasDb = db.avaliacaoDocente && db.avaliacaoDocente.has(String(escola.id));
        if (!hasDb) return { isPending: true, reason: 'Avaliação docente não realizada no período' };
        return { isPending: false, reason: 'Avaliações docentes registradas' };
      }
    },
    {
      id: 'acompanhamento_docente',
      title: 'Acompanhamento Docente',
      description: 'Devolutivas pedagógicas e suporte individual ao professor',
      category: 'Docência & Turmas',
      icon: HeartHandshake,
      check: (escola, db) => {
        const hasDb = db.acompanhamentoDocente && db.acompanhamentoDocente.has(String(escola.id));
        if (!hasDb) return { isPending: true, reason: 'Sem fichas de acompanhamento docente preenchidas' };
        return { isPending: false, reason: 'Acompanhamento docente em dia' };
      }
    },
    {
      id: 'encaminhamentos_intervencoes',
      title: 'Encaminhamentos e Intervenções',
      description: 'Intervenções pedagógicas e encaminhamentos da visita',
      category: 'Gestão',
      icon: AlertCircle,
      check: (escola, db) => {
        const hasDb = db.encaminhamentos && db.encaminhamentos.has(String(escola.id));
        const hasVisitaEncaminhamento = escola.relatoriosVisita && escola.relatoriosVisita.length > 0;
        if (!hasDb && !hasVisitaEncaminhamento) {
          return { isPending: true, reason: 'Nenhum encaminhamento ou intervenção cadastrada' };
        }
        return { isPending: false, reason: 'Encaminhamentos e intervenções em acompanhamento' };
      }
    }
  ], []);

  // Calcular status de cada dimensão
  const dimensionStats = useMemo(() => {
    return dimensions.map(dim => {
      const pendingEscolas: { escola: Escola; reason: string }[] = [];
      const okEscolas: Escola[] = [];

      regionalEscolas.forEach(escola => {
        const result = dim.check(escola, dbData, coordenadores);
        if (result.isPending) {
          pendingEscolas.push({ escola, reason: result.reason });
        } else {
          okEscolas.push(escola);
        }
      });

      const total = regionalEscolas.length;
      const pendingCount = pendingEscolas.length;
      const okCount = okEscolas.length;
      const percentOk = total > 0 ? Math.round((okCount / total) * 100) : 100;

      return {
        dimension: dim,
        total,
        pendingCount,
        okCount,
        percentOk,
        pendingEscolas,
        okEscolas
      };
    });
  }, [dimensions, regionalEscolas, dbData, coordenadores]);

  // Filtro por termo e categoria
  const filteredStats = useMemo(() => {
    return dimensionStats.filter(item => {
      const matchCategory = selectedCategory === 'TODAS' || item.dimension.category === selectedCategory;
      const matchSearch = searchTerm === '' ||
        item.dimension.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.dimension.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [dimensionStats, selectedCategory, searchTerm]);

  // Totais gerais do dashboard regional
  const totals = useMemo(() => {
    const totalDimensions = dimensionStats.length;
    const totalEscolas = regionalEscolas.length;
    const totalPendingCount = dimensionStats.reduce((acc, curr) => acc + curr.pendingCount, 0);
    const fullyCompliantEscolas = regionalEscolas.filter(escola => {
      return dimensions.every(dim => !dim.check(escola, dbData, coordenadores).isPending);
    }).length;

    return { totalDimensions, totalEscolas, totalPendingCount, fullyCompliantEscolas };
  }, [dimensionStats, regionalEscolas, dimensions, dbData, coordenadores]);

  const categories = ['TODAS', 'Docência & Turmas', 'Pedagógico', 'Gestão', 'Atividades & Reuniões'];

  return (
    <div className="space-y-6 my-8 animate-fade-in">
      {/* Banner Principal do Coordenador Regional */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-black uppercase tracking-wider border border-orange-500/30">
              <Building2 className="w-3.5 h-3.5" />
              Painel de Monitoramento Regional • 17 Dimensões
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
              Acompanhamento de Pendências Escolares
            </h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Total consolidado de unidades escolares com pendência em cada um dos 17 módulos de gestão, ensino e acompanhamento docente da regional.
            </p>
          </div>

          {/* Cards Sintéticos do Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Escolas da Regional</p>
              <p className="text-2xl font-black text-white mt-1">{totals.totalEscolas}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Escolas 100% Em Dia</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{totals.fullyCompliantEscolas}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-400">Dimensões em Alerta</p>
              <p className="text-2xl font-black text-rose-400 mt-1">
                {dimensionStats.filter(d => d.pendingCount > 0).length} <span className="text-xs text-slate-400 font-medium">/ 17</span>
              </p>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar dimensão de pendência (ex: notas, frequência, PPP, professores)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4 opacity-50" />
          <p className="font-bold text-slate-700 text-sm">Sincronizando 17 dimensões de pendências...</p>
          <p className="text-xs text-slate-400 mt-1">Carregando dados das escolas da regional</p>
        </div>
      ) : (
        /* Grid das 17 Dimensões */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStats.map(({ dimension: dim, total, pendingCount, okCount, percentOk, pendingEscolas }) => {
            const IconComp = dim.icon;
            const hasPending = pendingCount > 0;
            const isCritical = pendingCount >= Math.max(1, Math.ceil(total * 0.3));

            return (
              <div
                key={dim.id}
                onClick={() => setSelectedDimension(dim)}
                className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between relative group overflow-hidden ${
                  hasPending
                    ? isCritical
                      ? 'border-rose-200 hover:border-rose-300'
                      : 'border-amber-200 hover:border-amber-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left accent bar */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 transition-colors ${
                  hasPending ? (isCritical ? 'bg-rose-500' : 'bg-amber-500') : 'bg-emerald-500'
                }`} />

                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        hasPending
                          ? isCritical ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                          {dim.category}
                        </span>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-orange-600 transition-colors">
                          {dim.title}
                        </h3>
                      </div>
                    </div>

                    {/* Badge Pill */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                      hasPending
                        ? isCritical
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {hasPending ? `${pendingCount} Pendentes` : '100% Em Dia'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-2 leading-relaxed">
                    {dim.description}
                  </p>
                </div>

                <div>
                  {/* Barra de Progresso de Conformidade */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-500">Conformidade na Regional</span>
                      <span className={hasPending ? (isCritical ? 'text-rose-600' : 'text-amber-600') : 'text-emerald-600'}>
                        {okCount} de {total} escolas em dia ({percentOk}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-500 ${
                          hasPending ? (isCritical ? 'bg-rose-500' : 'bg-amber-500') : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentOk}%` }}
                      />
                    </div>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span className="text-[11px] text-slate-400 group-hover:text-slate-600 transition-colors">
                      {hasPending ? 'Clique para detalhar escolas' : 'Nenhuma pendência'}
                    </span>
                    <div className="flex items-center gap-1 text-orange-600 font-bold group-hover:translate-x-1 transition-transform">
                      <span className="text-[10px] uppercase tracking-wider">Ver Detalhes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detalhado de Escolas com Pendência na Dimensão */}
      {selectedDimension && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedDimension(null)}
          />

          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 animate-scale-up">
            {/* Header Modal */}
            <div className="bg-slate-900 p-6 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center text-orange-400">
                    {React.createElement(selectedDimension.icon, { className: 'w-5 h-5' })}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                      {selectedDimension.category}
                    </span>
                    <h3 className="text-lg font-black text-white leading-tight">
                      {selectedDimension.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDimension(null)}
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                {selectedDimension.description}
              </p>
            </div>

            {/* Content List */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1 bg-slate-50/50">
              {(() => {
                const statItem = dimensionStats.find(d => d.dimension.id === selectedDimension.id);
                if (!statItem) return null;

                const { pendingEscolas, okEscolas, pendingCount, total } = statItem;

                return (
                  <>
                    {/* Resumo da Dimensão */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                        <p className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Com Pendência</p>
                        <p className="text-2xl font-black text-rose-700 mt-0.5">{pendingCount} <span className="text-xs text-rose-500 font-semibold">escolas</span></p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Em Dia / Regular</p>
                        <p className="text-2xl font-black text-emerald-700 mt-0.5">{okEscolas.length} <span className="text-xs text-emerald-600 font-semibold">escolas</span></p>
                      </div>
                    </div>

                    {/* Lista de Escolas com Pendência */}
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        Escolas com Pendência ({pendingCount})
                      </h4>

                      {pendingEscolas.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
                          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                          <p className="font-bold text-slate-800 text-sm">Parabéns! Nenhuma pendência encontrada.</p>
                          <p className="text-xs text-slate-400 mt-1">Todas as {total} escolas da regional estão em dia com este módulo.</p>
                        </div>
                      ) : (
                        pendingEscolas.map(({ escola, reason }) => (
                          <div
                            key={escola.id}
                            className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
                                <School className="w-4 h-4" />
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-800 text-sm">{escola.nome}</h5>
                                <p className="text-xs font-semibold text-rose-600 mt-0.5 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  {reason}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium mt-1">
                                  Gestor(a): {escola.gestor || 'Não informado'} • Polo/Região: {escola.polo || escola.localizacao || 'Sede'}
                                </p>
                              </div>
                            </div>

                            {onNavigateToEscola && (
                              <button
                                onClick={() => {
                                  const id = escola.id;
                                  setSelectedDimension(null);
                                  onNavigateToEscola(id);
                                }}
                                className="whitespace-nowrap px-3.5 py-2 bg-slate-900 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-end sm:self-center"
                              >
                                Ver Escola
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDimension(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
