import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  BarChart3, School as SchoolIcon, Users, CheckCircle, 
  Loader2, AlertTriangle, HelpCircle, ArrowUpRight, TrendingUp,
  Award, ShieldAlert, Award as MedalIcon
} from 'lucide-react';
import { Escola, Coordenador, Segmento, Aluno } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';
import { BNCC_INFANTIL } from './ConselhoClasse';
import { ccAvaliacaoInfantilService, ccEstudanteService } from '../services/gestaoConselhoService';

interface PainelResultadosInfantilProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
  subHeader?: React.ReactNode;
}

const PERIODOS_FILTRO = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre', 'Resultado Consolidado'];

const CAMPOS_EXPERIENCIA = [
  "O eu, o outro e o nós",
  "Corpo, gestos e movimentos",
  "Traços, sons, cores e formas",
  "Escuta, fala, pensamento e imaginação",
  "Espaços, tempos, quantidades, relações e transformações"
];

export const PainelResultadosInfantil: React.FC<PainelResultadosInfantilProps> = ({
  escolas,
  isDemoMode,
  isAdmin,
  userEmail,
  currentUser,
  subHeader
}) => {
  const { showNotification } = useNotification();
  
  // Selection Context
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedGrupo, setSelectedGrupo] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [selectedPeriodoFiltro, setSelectedPeriodoFiltro] = useState(PERIODOS_FILTRO[4]); // Defaults to Resultado Consolidado

  // Loaded Data
  const [turmas, setTurmas] = useState<any[]>([]);
  const [students, setStudents] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);

  // Concept Map: studentId_skillCode -> Concept ('D' | 'ED' | 'ND')
  const [evaluations, setEvaluations] = useState<any[]>([]);

  // Filter schools for ECE
  const escolasInfantil = useMemo(() => {
    return escolas.filter(e => e.segmentos.includes(Segmento.INFANTIL));
  }, [escolas]);

  const FAiXAS_ETARIAS = ['Creche II', 'Creche III', 'Pré I', 'Pré II'];

  // Derive unique Grupo/Faixa Etária from active school's classes
  const availableAnosSeries = useMemo(() => {
    if (turmas.length === 0) return FAiXAS_ETARIAS;
    const unique = new Set<string>();
    turmas.forEach(t => {
      const val = t.year || t.anoSerie || '';
      if (val) unique.add(val);
    });
    return unique.size > 0 ? Array.from(unique) : FAiXAS_ETARIAS;
  }, [turmas]);

  // Filter ECE classes by selected Grupo/Faixa Etária
  const availableTurmas = useMemo(() => {
    return turmas.filter(t => {
      const tYear = (t.year || '').toLowerCase().trim();
      const tAnoSerie = (t.anoSerie || '').toLowerCase().trim();
      const target = selectedGrupo.toLowerCase().trim();
      return tYear === target || tAnoSerie === target;
    });
  }, [turmas, selectedGrupo]);

  const currentSchoolId = selectedEscolaId || (escolasInfantil.length > 0 ? escolasInfantil[0].id : '');

  // 1. Fetch ECE classes when school changes
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
        setTurmas(data || []);
      } catch (err) {
        console.error('Erro ao buscar turmas ECE:', err);
      }
    };

    if (isDemoMode) {
      setTurmas([
        { id: 't1', name: 'Creche II A', year: 'Creche II', anoSerie: 'Creche II', shift: 'Matutino', stage: 'Educação Infantil', schoolId: '2' },
        { id: 't2', name: 'Creche III B', year: 'Creche III', anoSerie: 'Creche III', shift: 'Vespertino', stage: 'Educação Infantil', schoolId: '2' },
        { id: 't3', name: 'Pré I A', year: 'Pré I', anoSerie: 'Pré I', shift: 'Matutino', stage: 'Educação Infantil', schoolId: '2' },
        { id: 't4', name: 'Pré II B', year: 'Pré II', anoSerie: 'Pré II', shift: 'Vespertino', stage: 'Educação Infantil', schoolId: '2' },
      ]);
    } else {
      fetchTurmas();
    }
  }, [currentSchoolId, isDemoMode]);

  // 2. Auto-select first Grupo when school changes
  useEffect(() => {
    if (availableAnosSeries.length > 0 && !availableAnosSeries.includes(selectedGrupo)) {
      setSelectedGrupo(availableAnosSeries[0]);
    }
  }, [availableAnosSeries, selectedGrupo]);

  // 3. Auto-select first class when Grupo changes
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

  // 4. Fetch students when selected class changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedTurmaId) {
        setStudents([]);
        return;
      }
      setLoading(true);
      try {
        if (isDemoMode) {
          const res = await ccEstudanteService.getByTurma(selectedTurmaId);
          setStudents(res || []);
        } else {
          const { data, error } = await supabase
            .from('alunos')
            .select('*')
            .eq('class_id', selectedTurmaId)
            .in('status', ['active', 'Ativo'])
            .order('name');

          if (error) throw error;
          setStudents(data || []);
        }
      } catch (err) {
        console.error('Erro ao buscar alunos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedTurmaId, isDemoMode]);

  // 5. Fetch all evaluations for students of selected class
  useEffect(() => {
    const loadAllEvaluations = async () => {
      if (students.length === 0 || !selectedTurmaId) {
        setEvaluations([]);
        return;
      }

      const studentIds = students.map(s => s.id);
      try {
        let evs: any[] = [];
        
        if (isDemoMode) {
          const localKey = `sigar_cc_i_avaliacoes_demo`;
          const saved = localStorage.getItem(localKey);
          if (saved) {
            const allLocal = JSON.parse(saved);
            evs = allLocal.filter((item: any) => studentIds.includes(item.student_id));
          } else {
            // Load ECE mock evaluations
            evs = await ccAvaliacaoInfantilService.getByStudents(studentIds);
          }
        } else {
          // Supabase service
          evs = await ccAvaliacaoInfantilService.getByStudents(studentIds);
        }

        setEvaluations(evs || []);
      } catch (err) {
        console.error('Erro ao carregar avaliações do painel:', err);
      }
    };

    loadAllEvaluations();
  }, [students, selectedTurmaId, isDemoMode]);

  // Filter evaluations matching active period/bimestre filter
  const activeEvaluations = useMemo(() => {
    if (selectedPeriodoFiltro === 'Resultado Consolidado') {
      return evaluations;
    }
    const bimNum = PERIODOS_FILTRO.indexOf(selectedPeriodoFiltro) + 1;
    return evaluations.filter(e => e.period === bimNum || e.bimestre === bimNum);
  }, [evaluations, selectedPeriodoFiltro]);

  // Determine current ECE BNCC Skills for active age group
  const ageGroupKey = useMemo(() => {
    if (['Creche II', 'Creche III'].includes(selectedGrupo)) {
      return 'Crianças bem pequenas';
    }
    return 'Crianças pequenas';
  }, [selectedGrupo]);

  const allClassObjectives = useMemo(() => {
    const objectives: any[] = [];
    CAMPOS_EXPERIENCIA.forEach(campo => {
      const list = BNCC_INFANTIL[campo.toUpperCase() as keyof typeof BNCC_INFANTIL]?.[ageGroupKey as 'Crianças bem pequenas' | 'Crianças pequenas'] || [];
      list.forEach(item => {
        objectives.push({
          ...item,
          campo
        });
      });
    });
    return objectives;
  }, [ageGroupKey]);

  // Compute metrics
  const dashboardStats = useMemo(() => {
    let d = 0, ed = 0, nd = 0;
    
    // Alunos com alertas (3 ou mais ND)
    const studentAlerts: Record<string | number, number> = {};
    students.forEach(s => { studentAlerts[s.id] = 0; });

    activeEvaluations.forEach(item => {
      const concept = item.status || item.conceito;
      if (concept === 'D') d++;
      else if (concept === 'ED') ed++;
      else if (concept === 'ND') {
        nd++;
        const sId = item.student_id || item.estudante_id;
        if (studentAlerts[sId] !== undefined) {
          studentAlerts[sId]++;
        }
      }
    });

    const totalCount = d + ed + nd;
    const consolidationRate = totalCount > 0 ? Math.round(((d * 2 + ed) / (totalCount * 2)) * 100) : 0;
    const alertCount = Object.values(studentAlerts).filter(count => count >= 3).length;

    // Split stats by Campo de Experiência
    const camposStats: Record<string, { d: number; ed: number; nd: number; total: number }> = {};
    CAMPOS_EXPERIENCIA.forEach(campo => {
      camposStats[campo] = { d: 0, ed: 0, nd: 0, total: 0 };
    });

    activeEvaluations.forEach(item => {
      const itemCampo = (item.campo_experiencia || '').toLowerCase().trim();
      const matchedCampo = CAMPOS_EXPERIENCIA.find(c => c.toLowerCase().trim() === itemCampo);
      if (matchedCampo) {
        const concept = item.status || item.conceito;
        if (concept === 'D') camposStats[matchedCampo].d++;
        else if (concept === 'ED') camposStats[matchedCampo].ed++;
        else if (concept === 'ND') camposStats[matchedCampo].nd++;
        camposStats[matchedCampo].total++;
      }
    });

    // Individual student metrics
    const studentStats = students.map(s => {
      let sD = 0, sEd = 0, sNd = 0;
      const sEvs = activeEvaluations.filter(e => String(e.student_id || e.estudante_id) === String(s.id));
      
      sEvs.forEach(item => {
        const concept = item.status || item.conceito;
        if (concept === 'D') sD++;
        else if (concept === 'ED') sEd++;
        else if (concept === 'ND') sNd++;
      });

      const sTotal = sD + sEd + sNd;
      const sConsolidation = sTotal > 0 ? Math.round(((sD * 2 + sEd) / (sTotal * 2)) * 100) : 0;

      return {
        id: s.id,
        name: s.name,
        d: sD,
        ed: sEd,
        nd: sNd,
        total: sTotal,
        consolidation: sConsolidation
      };
    }).sort((a, b) => b.consolidation - a.consolidation);

    return {
      d, ed, nd,
      totalCount,
      consolidationRate,
      alertCount,
      camposStats,
      studentStats
    };
  }, [activeEvaluations, students]);

  return (
    <div className="space-y-6 text-left">
      <PageHeader 
        title="Painel de Resultados - Educação Infantil"
        subtitle="Indicadores e consolidação de desempenho qualitativo dos objetivos da BNCC na Educação Infantil"
        icon={BarChart3}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {subHeader}

      {/* Selectors and Filters Card */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unidade Escolar *</label>
            <select 
              value={selectedEscolaId}
              onChange={e => setSelectedEscolaId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
            >
              {escolasInfantil.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Grupo/Faixa Etária *</label>
            <select 
              value={selectedGrupo}
              onChange={e => setSelectedGrupo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
            >
              {availableAnosSeries.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Turma *</label>
            <select 
              value={selectedTurmaId}
              onChange={e => setSelectedTurmaId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
            >
              {availableTurmas.length === 0 ? (
                <option value="">Nenhuma turma encontrada</option>
              ) : (
                availableTurmas.map(t => (
                  <option key={t.id} value={t.id}>{`${t.name || t.anoSerie || t.year} • ${t.shift || t.turno || ''}`}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filtro de Período *</label>
            <select 
              value={selectedPeriodoFiltro}
              onChange={e => setSelectedPeriodoFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
            >
              {PERIODOS_FILTRO.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-12 text-center bg-white border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-2" />
          <p className="text-xs font-bold text-slate-500 uppercase">Calculando indicadores...</p>
        </Card>
      ) : students.length === 0 ? (
        <Card className="p-12 text-center bg-white border-slate-200">
          <HelpCircle className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-500 uppercase">Selecione uma turma para carregar o Painel de Resultados.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in duration-200">
            <Card className="bg-slate-900 border-none text-white p-5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                <TrendingUp className="w-32 h-32 text-white" />
              </div>
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consolidação Geral</p>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> ECE
                </span>
              </div>
              <div className="mt-4">
                <h2 className="text-3xl font-black">{dashboardStats.consolidationRate}%</h2>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${dashboardStats.consolidationRate}%` }}
                  ></div>
                </div>
              </div>
            </Card>

            <Card className="bg-white border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Habilidades Desenvolvidas (D)</p>
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">D</span>
              </div>
              <div className="mt-4">
                <h2 className="text-3xl font-black text-slate-850">
                  {dashboardStats.d} <span className="text-xs text-slate-400 font-bold">registros</span>
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                  {dashboardStats.totalCount > 0 
                    ? `${Math.round((dashboardStats.d / dashboardStats.totalCount) * 100)}% das avaliações realizadas` 
                    : 'Nenhuma avaliação registrada'
                  }
                </p>
              </div>
            </Card>

            <Card className="bg-white border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Em Desenvolvimento (ED)</p>
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">ED</span>
              </div>
              <div className="mt-4">
                <h2 className="text-3xl font-black text-slate-850">
                  {dashboardStats.ed} <span className="text-xs text-slate-400 font-bold">registros</span>
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                  {dashboardStats.totalCount > 0 
                    ? `${Math.round((dashboardStats.ed / dashboardStats.totalCount) * 100)}% das avaliações` 
                    : 'Nenhuma avaliação'
                  }
                </p>
              </div>
            </Card>

            <Card className="bg-white border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alertas de Intervenção (&gt;=3 ND)</p>
                <span className="bg-red-50 text-red-600 p-1 rounded-lg">
                  <ShieldAlert className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <h2 className={`text-3xl font-black ${dashboardStats.alertCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {dashboardStats.alertCount} <span className="text-xs text-slate-400 font-bold">crianças</span>
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                  {dashboardStats.alertCount > 0 
                    ? 'Necessitam de reforço individualizado' 
                    : 'Nenhum alerta crítico pendente'
                  }
                </p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Progress by Experience Field */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                  <Award className="text-orange-600 w-5 h-5" />
                  <h3 className="text-sm font-black text-slate-850 uppercase tracking-tight">Evolução por Campo de Experiência</h3>
                </div>

                <div className="space-y-6">
                  {CAMPOS_EXPERIENCIA.map(campo => {
                    const cStat = dashboardStats.camposStats[campo];
                    const total = cStat.total;
                    const dPct = total > 0 ? Math.round((cStat.d / total) * 100) : 0;
                    const edPct = total > 0 ? Math.round((cStat.ed / total) * 100) : 0;
                    const ndPct = total > 0 ? Math.round((cStat.nd / total) * 100) : 0;

                    return (
                      <div key={campo} className="space-y-2 text-left">
                        <div className="flex justify-between items-start text-xs">
                          <span className="font-bold text-slate-700 max-w-[80%] leading-snug">{campo}</span>
                          <span className="font-black text-slate-800 text-[10px] bg-slate-100 px-2 py-0.5 rounded-md">
                            {total > 0 ? `${dPct + Math.round(edPct/2)}% Cons.` : 'S/ Reg.'}
                          </span>
                        </div>
                        {total > 0 ? (
                          <div className="w-full h-4 rounded-lg flex overflow-hidden border border-slate-100">
                            {cStat.d > 0 && (
                              <div 
                                className="bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center transition-all duration-300"
                                style={{ width: `${dPct}%` }}
                                title={`Desenvolvido: ${cStat.d} (${dPct}%)`}
                              >
                                {dPct > 15 && `D`}
                              </div>
                            )}
                            {cStat.ed > 0 && (
                              <div 
                                className="bg-blue-500 text-white text-[9px] font-black flex items-center justify-center transition-all duration-300"
                                style={{ width: `${edPct}%` }}
                                title={`Em Desenvolvimento: ${cStat.ed} (${edPct}%)`}
                              >
                                {edPct > 15 && `ED`}
                              </div>
                            )}
                            {cStat.nd > 0 && (
                              <div 
                                className="bg-slate-400 text-white text-[9px] font-black flex items-center justify-center transition-all duration-300"
                                style={{ width: `${ndPct}%` }}
                                title={`Não Desenvolvido: ${cStat.nd} (${ndPct}%)`}
                              >
                                {ndPct > 15 && `ND`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full bg-slate-100 h-4 rounded-lg flex items-center justify-center text-[9px] text-slate-400 italic">
                            Nenhuma avaliação realizada para este campo
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Individual Student Performance Grid */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-white border-slate-200 p-0 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-white">
                  <Users className="text-orange-650 w-5 h-5" />
                  <h3 className="text-sm font-black text-slate-850 uppercase tracking-tight">Consolidação por Criança</h3>
                </div>

                <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto custom-scrollbar">
                  {dashboardStats.studentStats.map((s, idx) => {
                    const isAlert = s.nd >= 3;
                    return (
                      <div key={s.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3 max-w-[65%]">
                          <span className="text-[10px] text-slate-400 font-bold w-4 text-center">{idx + 1}</span>
                          <div className="truncate">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{s.name}</h4>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                              {s.total > 0 ? `${s.total} avaliados • ${s.d} D, ${s.ed} ED, ${s.nd} ND` : 'Sem avaliações'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isAlert && (
                            <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[8px] font-black border border-red-200">
                              ALERTA
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            s.consolidation >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            s.consolidation >= 50 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {s.consolidation}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
