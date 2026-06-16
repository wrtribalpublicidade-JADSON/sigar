import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  BarChart3, School as SchoolIcon, Users, CheckCircle, 
  Loader2, AlertTriangle, HelpCircle, ArrowUpRight, TrendingUp,
  Award, ShieldAlert, Award as MedalIcon, User, Search, Printer, 
  TrendingDown, Minus, BookOpen, GraduationCap, FileDown, Download
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from 'recharts';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
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

// Recharts Custom Tooltip for ECE Annual Evolution
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-xl text-left">
        <p className="text-xs font-black text-slate-800 uppercase mb-2">{label}</p>
        <div className="space-y-1 text-[11px] font-bold">
          <p className="text-emerald-600">
            Desenvolvido (D): {data.dCount} ({data.d}%)
          </p>
          <p className="text-amber-500">
            Em Desenvolvimento (ED): {data.edCount} ({data.ed}%)
          </p>
          <p className="text-red-500">
            A Desenvolver (ND): {data.ndCount} ({data.nd}%)
          </p>
          <p className="text-slate-400 border-t border-slate-100 pt-1 mt-1 text-[10px]">
            Total de Avaliações: {data.total}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

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
  const [selectedSkillByCampo, setSelectedSkillByCampo] = useState<Record<string, string>>({});

  // Loaded Data
  const [turmas, setTurmas] = useState<any[]>([]);
  const [students, setStudents] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);

  // Concept Map: studentId_skillCode -> Concept ('D' | 'ED' | 'ND')
  const [evaluations, setEvaluations] = useState<any[]>([]);

  // Tab State
  type TabType = 'bimestre' | 'evolucao' | 'boletim';
  const [activeTab, setActiveTab] = useState<TabType>('bimestre');

  // Boletim & Printing States
  const [boletimSelectedStudentId, setBoletimSelectedStudentId] = useState<string>('');
  const [boletimSearchQuery, setBoletimSearchQuery] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);

  // Auto-select first student for Boletim when student list changes
  useEffect(() => {
    if (students.length > 0) {
      const exists = students.some(s => String(s.id) === String(boletimSelectedStudentId));
      if (!exists) {
        setBoletimSelectedStudentId(String(students[0].id));
      }
    } else {
      setBoletimSelectedStudentId('');
    }
  }, [students, boletimSelectedStudentId]);

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

  // Helper to get overall stats for a specific bimester
  const getBimesterStats = (bimNum: number) => {
    const bEvs = evaluations.filter(e => e.period === bimNum || e.bimestre === bimNum);
    let d = 0, ed = 0, nd = 0;
    bEvs.forEach(item => {
      const concept = item.status || item.conceito;
      if (concept === 'D') d++;
      else if (concept === 'ED') ed++;
      else if (concept === 'ND') nd++;
    });
    const total = d + ed + nd;
    const rate = total > 0 ? Math.round(((d * 2 + ed) / (total * 2)) * 100) : null;
    return { d, ed, nd, total, rate };
  };

  // Annual Class Evolution data
  const bimesterEvolutionData = useMemo(() => {
    return [1, 2, 3, 4].map(b => {
      const stats = getBimesterStats(b);
      return {
        name: `${b}º Bim`,
        label: `${b}º Bimestre`,
        bimester: b,
        rate: stats.rate,
        total: stats.total,
        d: stats.d,
        ed: stats.ed,
        nd: stats.nd,
      };
    });
  }, [evaluations]);

  // Chart data (only include bimesters that have evaluations)
  const chartData = useMemo(() => {
    return bimesterEvolutionData.filter(d => d.total > 0);
  }, [bimesterEvolutionData]);

  // Annual Student Evolution metrics
  const studentBimesterStats = useMemo(() => {
    return students.map(s => {
      const rates = [1, 2, 3, 4].map(b => {
        const bEvs = evaluations.filter(e => 
          String(e.student_id || e.estudante_id) === String(s.id) && 
          (e.period === b || e.bimestre === b)
        );
        let d = 0, ed = 0, nd = 0;
        bEvs.forEach(item => {
          const concept = item.status || item.conceito;
          if (concept === 'D') d++;
          else if (concept === 'ED') ed++;
          else if (concept === 'ND') nd++;
        });
        const total = d + ed + nd;
        const rate = total > 0 ? Math.round(((d * 2 + ed) / (total * 2)) * 100) : null;
        return { rate, total, d, ed, nd };
      });

      // Calculate Trend
      const validRates = rates.map(r => r.rate).filter((r): r is number => r !== null);
      let trend: 'up' | 'down' | 'neutral' | 'none' = 'none';
      if (validRates.length >= 2) {
        const first = validRates[0];
        const last = validRates[validRates.length - 1];
        if (last > first) trend = 'up';
        else if (last < first) trend = 'down';
        else trend = 'neutral';
      }

      return {
        id: s.id,
        name: s.name,
        rates,
        trend
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, evaluations]);

  // Group objectives by Experience Field for Boletim
  const objectivesByCampo = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    allClassObjectives.forEach(obj => {
      const campoName = obj.campo;
      if (!grouped[campoName]) {
        grouped[campoName] = [];
      }
      grouped[campoName].push(obj);
    });
    return grouped;
  }, [allClassObjectives]);

  // Helper to lookup a concept for a specific student, skill, and bimester
  const getStudentConceptForObjective = (studentId: string | number, skillCode: string, bimester: number) => {
    const ev = evaluations.find(e => 
      String(e.student_id || e.estudante_id) === String(studentId) && 
      e.skill_code === skillCode && 
      (e.period === bimester || e.bimestre === bimester)
    );
    return ev?.status || ev?.conceito || null;
  };

  // Filter students list in Boletim
  const filteredBoletimStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(boletimSearchQuery.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, boletimSearchQuery]);

  // Find currently selected student object
  const selectedBoletimStudent = useMemo(() => {
    return students.find(s => String(s.id) === String(boletimSelectedStudentId)) || null;
  }, [students, boletimSelectedStudentId]);

  // Lookup the school name to print
  const selectedEscolaName = useMemo(() => {
    const escId = selectedEscolaId || (escolasInfantil.length > 0 ? escolasInfantil[0].id : '');
    const esc = escolas.find(e => String(e.id) === String(escId));
    return esc ? esc.nome : 'Rede Municipal';
  }, [escolas, selectedEscolaId, escolasInfantil]);

  // Lookup class name
  const selectedTurmaObj = useMemo(() => {
    return turmas.find(t => String(t.id) === String(selectedTurmaId));
  }, [turmas, selectedTurmaId]);

  const selectedTurmaName = useMemo(() => {
    if (!selectedTurmaObj) return '';
    return `${selectedTurmaObj.name || selectedTurmaObj.anoSerie || selectedTurmaObj.year} - ${selectedTurmaObj.shift || ''}`;
  }, [selectedTurmaObj]);

  // Calcula os Pontos de Atenção para cada Campo de Experiência
  const pontosAtencao = useMemo(() => {
    return CAMPOS_EXPERIENCIA.map(campo => {
      // Filtrar objetivos deste Campo
      const fieldObjectives = allClassObjectives.filter(
        obj => obj.campo.toLowerCase().trim() === campo.toLowerCase().trim()
      );
      
      let maxPct = 0;
      let maxObj = fieldObjectives[0] || null;
      let maxStats = { ndCount: 0, totalCount: 0 };
      
      fieldObjectives.forEach(obj => {
        const evs = activeEvaluations.filter(
          e => String(e.skill_code) === String(obj.code)
        );
        const totalCount = evs.length;
        const ndCount = evs.filter(e => (e.status || e.conceito) === 'ND').length;
        const pct = totalCount > 0 ? (ndCount / totalCount) * 100 : 0;
        
        // Critério de desempate: preferir o que tem mais avaliações totais
        if (pct > maxPct || (pct === maxPct && totalCount > maxStats.totalCount) || !maxObj) {
          maxPct = pct;
          maxObj = obj;
          maxStats = { ndCount, totalCount };
        }
      });
      
      return {
        campo: campo.toUpperCase(),
        code: maxObj?.code || '',
        short: maxObj?.short || '',
        desc: maxObj?.desc || '',
        percentage: maxPct > 0 ? parseFloat(maxPct.toFixed(1)) : 0,
        ndCount: maxStats.ndCount,
        totalCount: maxStats.totalCount
      };
    });
  }, [allClassObjectives, activeEvaluations]);

  // Função para exportar os dados do painel para planilha Excel
  const handleExportExcel = () => {
    try {
      const activeSchool = escolas.find(e => String(e.id) === String(currentSchoolId));
      const schoolName = activeSchool ? activeSchool.nome : 'Rede Municipal';
      const className = selectedTurmaObj ? selectedTurmaObj.name || selectedTurmaObj.anoSerie : 'Turma';
      
      // 1. Resumo por Habilidade
      const summaryData = allClassObjectives.map(obj => {
        const evs = activeEvaluations.filter(e => String(e.skill_code) === String(obj.code));
        const totalCount = evs.length;
        const dCount = evs.filter(e => (e.status || e.conceito) === 'D').length;
        const edCount = evs.filter(e => (e.status || e.conceito) === 'ED').length;
        const ndCount = evs.filter(e => (e.status || e.conceito) === 'ND').length;
        
        return {
          'Código': obj.code,
          'Campo de Experiência': obj.campo,
          'Habilidade': obj.short,
          'Descrição': obj.desc,
          'Total Avaliações': totalCount,
          'Desenvolvido (D)': dCount,
          'Em Desenvolvimento (ED)': edCount,
          'Não Desenvolvido (ND)': ndCount,
          '% A Desenvolver (ND)': totalCount > 0 ? parseFloat(((ndCount / totalCount) * 100).toFixed(1)) : 0
        };
      });

      // 2. Desempenho dos Alunos
      const studentData = students.map(s => {
        const row: Record<string, any> = {
          'Estudante': s.name,
        };
        
        allClassObjectives.forEach(obj => {
          const ev = activeEvaluations.find(e => 
            String(e.student_id || e.estudante_id) === String(s.id) && 
            String(e.skill_code) === String(obj.code)
          );
          row[obj.code] = ev?.status || ev?.conceito || '-';
        });
        
        return row;
      });

      const wb = XLSX.utils.book_new();
      
      // Aba 1: Resumo Habilidades
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Habilidades');
      
      // Aba 2: Desempenho Alunos
      const wsStudents = XLSX.utils.json_to_sheet(studentData);
      XLSX.utils.book_append_sheet(wb, wsStudents, 'Desempenho Alunos');
      
      const sanitizedSchool = schoolName.replace(/[\\/*?:[\]]/g, '_');
      const sanitizedClass = className.replace(/[\\/*?:[\]]/g, '_');
      const fileName = `Painel_EI_${sanitizedSchool}_${sanitizedClass}_${selectedPeriodoFiltro.replace(/\s+/g, '_')}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
      showNotification('success', 'Planilha exportada com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar planilha:', err);
      showNotification('error', 'Erro ao exportar planilha.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="print:hidden space-y-6">
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
          <div className={`grid grid-cols-1 ${activeTab === 'bimestre' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
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

            {activeTab === 'bimestre' && (
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
            )}
          </div>
        </Card>

        {/* Navigation Tabs */}
        {students.length > 0 && !loading && (
          <div className="bg-slate-100/60 p-1.5 rounded-2xl inline-flex gap-1 border border-slate-200/40">
            <button
              onClick={() => setActiveTab('bimestre')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'bimestre' 
                  ? 'bg-white text-indigo-650 shadow-sm border border-slate-100/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Visão por Bimestre
            </button>
            <button
              onClick={() => setActiveTab('evolucao')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'evolucao' 
                  ? 'bg-white text-indigo-650 shadow-sm border border-slate-100/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Evolução Anual
            </button>
            <button
              onClick={() => setActiveTab('boletim')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'boletim' 
                  ? 'bg-white text-indigo-650 shadow-sm border border-slate-100/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              Boletim
            </button>
          </div>
        )}
      </div>

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
          {activeTab === 'bimestre' && renderBimestreTab()}
          {activeTab === 'evolucao' && renderEvolucaoTab()}
          {activeTab === 'boletim' && renderBoletimTab()}
        </div>
      )}

      {/* Printing Portal */}
      {isPrinting && selectedBoletimStudent && (
        <PrintableBoletim
          student={selectedBoletimStudent}
          escolaName={selectedEscolaName}
          grupo={selectedGrupo}
          turmaName={selectedTurmaName}
          objectivesByCampo={objectivesByCampo}
          getConcept={(skillCode, bimester) => getStudentConceptForObjective(selectedBoletimStudent.id, skillCode, bimester)}
          onClose={() => setIsPrinting(false)}
        />
      )}
    </div>
  );

  // Helper to render concept badges in tables
  function renderConceptBadge(concept: string | null) {
    if (!concept) return <span className="text-slate-300 font-bold">-</span>;
    
    switch (concept) {
      case 'D':
        return (
          <span className="bg-emerald-50 text-emerald-700 font-black border border-emerald-200 px-2 py-0.5 rounded text-[10px] uppercase shadow-sm">
            D
          </span>
        );
      case 'ED':
        return (
          <span className="bg-blue-50 text-blue-700 font-black border border-blue-200 px-2 py-0.5 rounded text-[10px] uppercase shadow-sm">
            ED
          </span>
        );
      case 'ND':
        return (
          <span className="bg-slate-50 text-slate-500 font-black border border-slate-200 px-2 py-0.5 rounded text-[10px] uppercase shadow-sm">
            ND
          </span>
        );
      default:
        return <span className="text-slate-400 font-bold">{concept}</span>;
    }
  }

  // Auxiliar para obter cores e textos dos Campos de Experiência
  function getCampoConfig(campoName: string) {
    const norm = campoName.toLowerCase().trim();
    if (norm.includes('eu, o outro')) {
      return {
        abbr: 'EO',
        borderClass: 'border-l-4 border-blue-500',
        textClass: 'text-blue-400',
        badgeClass: 'bg-blue-600 text-white',
        circleBg: 'bg-blue-100 text-blue-700',
        darkBadge: 'bg-blue-950/40 border-blue-900/60 text-blue-300'
      };
    }
    if (norm.includes('corpo, gestos')) {
      return {
        abbr: 'CG',
        borderClass: 'border-l-4 border-emerald-500',
        textClass: 'text-emerald-400',
        badgeClass: 'bg-emerald-600 text-white',
        circleBg: 'bg-emerald-100 text-emerald-700',
        darkBadge: 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
      };
    }
    if (norm.includes('traços, sons')) {
      return {
        abbr: 'TS',
        borderClass: 'border-l-4 border-amber-500',
        textClass: 'text-amber-400',
        badgeClass: 'bg-amber-500 text-white',
        circleBg: 'bg-amber-100 text-amber-700',
        darkBadge: 'bg-amber-950/40 border-amber-900/60 text-amber-300'
      };
    }
    if (norm.includes('escuta, fala')) {
      return {
        abbr: 'EF',
        borderClass: 'border-l-4 border-rose-500',
        textClass: 'text-rose-400',
        badgeClass: 'bg-rose-600 text-white',
        circleBg: 'bg-rose-100 text-rose-700',
        darkBadge: 'bg-rose-950/40 border-rose-900/60 text-rose-300'
      };
    }
    if (norm.includes('espaços, tempos')) {
      return {
        abbr: 'ET',
        borderClass: 'border-l-4 border-purple-500',
        textClass: 'text-purple-400',
        badgeClass: 'bg-purple-650 text-white',
        circleBg: 'bg-purple-100 text-purple-700',
        darkBadge: 'bg-purple-950/40 border-purple-900/60 text-purple-300'
      };
    }
    return {
      abbr: 'BNCC',
      borderClass: 'border-l-4 border-slate-500',
      textClass: 'text-slate-400',
      badgeClass: 'bg-slate-600 text-white',
      circleBg: 'bg-slate-100 text-slate-700',
      darkBadge: 'bg-slate-950/40 border-slate-900/60 text-slate-305'
    };
  }

  // TAB 1: Visão por Bimestre
  function renderBimestreTab() {
    // Label curto para o período selecionado
    const selectedPeriodoFiltroShort = selectedPeriodoFiltro === 'Resultado Consolidado'
      ? 'Consolidado'
      : selectedPeriodoFiltro.replace('estre', ''); // "1º Bimestre" -> "1º Bim"

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Painel Administrativo - Pontos de Atenção (Dark Box) */}
        <div className="bg-[#0b1329] text-white p-6 rounded-3xl shadow-xl border border-slate-800/80">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-100">
              Painel Administrativo - Pontos de Atenção ({selectedPeriodoFiltroShort})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {pontosAtencao.map(p => {
              const config = getCampoConfig(p.campo);
              return (
                <div 
                  key={p.campo} 
                  className={`bg-[#12192c] p-5 rounded-2xl flex flex-col justify-between shadow-md relative overflow-hidden transition-all duration-300 hover:bg-[#161e35] hover:scale-[1.01] ${config.borderClass}`}
                >
                  <div>
                    <p className={`text-[9px] font-black uppercase tracking-wider ${config.textClass}`}>
                      {p.campo}
                    </p>
                    <h4 className="text-sm font-black text-white mt-1.5 uppercase">
                      {p.code || 'Sem Registro'}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-2 leading-relaxed line-clamp-2 min-h-[34px]">
                      {p.desc || 'Nenhum objetivo avaliado neste período para este campo.'}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/50">
                    <span className="bg-red-950/50 border border-red-900/50 text-red-400 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">
                      {p.percentage}% A Desenvolver
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 tracking-widest uppercase">
                      MAIOR ÍNDICE DO CAMPO
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grade dos Campos de Experiência com Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {CAMPOS_EXPERIENCIA.map(campo => {
            const config = getCampoConfig(campo);
            // Filtra os objetivos do grupo etário ativo neste campo
            const fieldObjectives = allClassObjectives.filter(
              obj => obj.campo.toLowerCase().trim() === campo.toLowerCase().trim()
            );
            
            return (
              <Card key={campo} className="bg-white border-slate-200 p-6 rounded-[24px] shadow-sm flex flex-col justify-between">
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-center gap-3 mb-6 text-left">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs ${config.badgeClass} shadow-sm`}>
                      {config.abbr}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                        {campo}
                      </h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        Análise de Habilidades
                      </p>
                    </div>
                  </div>
                  
                  {/* Lista de Habilidades */}
                  <div className="space-y-4">
                    {fieldObjectives.map(obj => {
                      const evs = activeEvaluations.filter(e => String(e.skill_code) === String(obj.code));
                      const totalCount = evs.length;
                      const dCount = evs.filter(e => (e.status || e.conceito) === 'D').length;
                      const edCount = evs.filter(e => (e.status || e.conceito) === 'ED').length;
                      const ndCount = evs.filter(e => (e.status || e.conceito) === 'ND').length;
                      
                      const dPct = totalCount > 0 ? (dCount / totalCount) * 100 : 0;
                      const edPct = totalCount > 0 ? (edCount / totalCount) * 100 : 0;
                      const ndPct = totalCount > 0 ? (ndCount / totalCount) * 100 : 0;
                      
                      return (
                        <div key={obj.code} className="flex items-center gap-4">
                          {/* Código da Habilidade */}
                          <div className="w-14 text-left" title={obj.desc}>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight cursor-help hover:text-indigo-650 transition-colors">
                              {obj.code}
                            </span>
                          </div>
                          
                          {/* Área do Gráfico de Barra Empilhada */}
                          <div className="relative flex-1 h-6 flex items-center">
                            {/* Linhas de Grade Tracejadas */}
                            <div className="absolute inset-y-0 left-0 right-0 flex justify-between pointer-events-none z-0">
                              <span className="w-px h-full border-r border-dashed border-slate-100"></span>
                              <span className="w-px h-full border-r border-dashed border-slate-100"></span>
                              <span className="w-px h-full border-r border-dashed border-slate-100"></span>
                              <span className="w-px h-full border-r border-dashed border-slate-100"></span>
                              <span className="w-px h-full border-r border-dashed border-slate-100"></span>
                            </div>
                            
                            {/* Barra Horizontal Empilhada */}
                            {totalCount > 0 ? (
                              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex relative z-10 shadow-inner">
                                {dCount > 0 && (
                                  <div 
                                    className="bg-[#10b981] h-full transition-all duration-500"
                                    style={{ width: `${dPct}%` }}
                                    title={`Desenvolvido (D): ${dCount} (${dPct.toFixed(1)}%)`}
                                  />
                                )}
                                {edCount > 0 && (
                                  <div 
                                    className="bg-[#f59e0b] h-full transition-all duration-500"
                                    style={{ width: `${edPct}%` }}
                                    title={`Em Desenvolvimento (ED): ${edCount} (${edPct.toFixed(1)}%)`}
                                  />
                                )}
                                {ndCount > 0 && (
                                  <div 
                                    className="bg-[#ef4444] h-full transition-all duration-500"
                                    style={{ width: `${ndPct}%` }}
                                    title={`A Desenvolver (ND): ${ndCount} (${ndPct.toFixed(1)}%)`}
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-3.5 bg-slate-100/60 border border-slate-200/20 rounded-full flex items-center justify-center relative z-10">
                                <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">
                                  Sem Registros
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Legenda de Conceitos no Rodapé */}
                <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-slate-100 text-[9px] font-black uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#ef4444] rounded-sm"></span> A Desenv.
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#10b981] rounded-sm"></span> Desenv.
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#f59e0b] rounded-sm"></span> Em Desenv.
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 mt-6 print:hidden">
          <Button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all border-none"
          >
            <FileDown className="w-4 h-4" />
            Exportar Planilha
          </Button>
          <Button
            onClick={() => window.print()}
            className="bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all border-none"
          >
            <Download className="w-4 h-4" />
            Gerar Relatório PDF
          </Button>
        </div>
      </div>
    );
  }

  // TAB 2: Evolução Anual

  function renderEvolucaoTab() {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        
        {/* Grid dos Campos de Experiência com Gráficos de Evolução Anual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {CAMPOS_EXPERIENCIA.map(campo => {
            const config = getCampoConfig(campo);
            // Get skills of active age group for this field
            const fieldObjectives = allClassObjectives.filter(
              obj => obj.campo.toLowerCase().trim() === campo.toLowerCase().trim()
            );
            
            const activeSkill = selectedSkillByCampo[campo] || 'all';

            // Compute bimester data (1º to 4º Bim)
            const bimesterData = [1, 2, 3, 4].map(b => {
              const bEvs = evaluations.filter(e => {
                const isBim = (e.period === b || e.bimestre === b);
                if (!isBim) return false;
                
                return activeSkill === 'all' 
                  ? fieldObjectives.some(obj => String(obj.code) === String(e.skill_code))
                  : String(e.skill_code) === String(activeSkill);
              });

              let d = 0, ed = 0, nd = 0;
              bEvs.forEach(item => {
                const concept = item.status || item.conceito;
                if (concept === 'D') d++;
                else if (concept === 'ED') ed++;
                else if (concept === 'ND') nd++;
              });

              const total = d + ed + nd;
              
              // We want percentages for the stacked bar
              const dPct = total > 0 ? parseFloat(((d / total) * 100).toFixed(1)) : 0;
              const edPct = total > 0 ? parseFloat(((ed / total) * 100).toFixed(1)) : 0;
              const ndPct = total > 0 ? parseFloat(((nd / total) * 100).toFixed(1)) : 0;

              return {
                name: `${b}º Bim`,
                d: dPct,
                ed: edPct,
                nd: ndPct,
                dCount: d,
                edCount: ed,
                ndCount: nd,
                total
              };
            });

            const hasData = bimesterData.some(d => d.total > 0);

            return (
              <Card key={campo} className="bg-white border-slate-200 p-6 rounded-[24px] shadow-sm flex flex-col justify-between">
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3 text-left">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${config.badgeClass} shadow-sm`}>
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                          {campo}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Evolução por Bimestre
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={activeSkill}
                        onChange={(e) => setSelectedSkillByCampo(prev => ({ ...prev, [campo]: e.target.value }))}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-indigo-500 bg-slate-50/50 text-slate-700 max-w-[200px] truncate"
                      >
                        <option value="all">Todas as Habilidades (Média)</option>
                        {fieldObjectives.map(obj => (
                          <option key={obj.code} value={obj.code}>{obj.code} - {obj.short}</option>
                        ))}
                      </select>
                      <button className="p-1.5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Área do Gráfico de Barra Empilhada */}
                  {!hasData ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center bg-slate-50/40 rounded-2xl border border-dashed border-slate-200/60 p-6">
                      <HelpCircle className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-400 uppercase">Nenhum registro encontrado para este campo.</p>
                    </div>
                  ) : (
                    <div className="h-64 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bimesterData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                            dy={5}
                          />
                          <YAxis 
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                          />
                          <Tooltip 
                            content={<CustomTooltip />}
                            cursor={{ fill: '#f8fafc', opacity: 0.4 }}
                          />
                          {/* Stacking order: bottom is 'd', middle is 'ed', top is 'nd' */}
                          <Bar dataKey="d" name="D" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="ed" name="ED" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="nd" name="ND" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Legenda de Conceitos no Rodapé */}
                <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-slate-100 text-[10px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-red-500">
                    <span className="w-2.5 h-2.5 bg-[#ef4444] rounded-sm"></span> A Desenv.
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-500">
                    <span className="w-2.5 h-2.5 bg-[#10b981] rounded-sm"></span> Desenv.
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-500">
                    <span className="w-2.5 h-2.5 bg-[#f59e0b] rounded-sm"></span> Em Desenv.
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Detailed Individual Evolution Table */}
        <Card className="bg-white border-slate-200 p-0 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="text-indigo-650 w-5 h-5" />
              <h3 className="text-sm font-black text-slate-850 uppercase tracking-tight">Acompanhamento de Evolução Individual</h3>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase">
              {students.length} Crianças
            </span>
          </div>

          <div className="overflow-x-auto text-left">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Nome da Criança</th>
                  <th className="px-6 py-3.5 text-center">1º Bimestre</th>
                  <th className="px-6 py-3.5 text-center">2º Bimestre</th>
                  <th className="px-6 py-3.5 text-center">3º Bimestre</th>
                  <th className="px-6 py-3.5 text-center">4º Bimestre</th>
                  <th className="px-6 py-3.5 text-right">Tendência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentBimesterStats.map(s => {
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="text-xs font-black text-slate-850 uppercase tracking-tight">{s.name}</span>
                      </td>
                      {[0, 1, 2, 3].map(idx => {
                        const r = s.rates[idx];
                        const hasRate = r.total > 0;
                        return (
                          <td key={idx} className="px-6 py-3.5 text-center">
                            {hasRate ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                                r.rate! >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                r.rate! >= 50 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-red-50 text-red-700 border border-red-100'
                              }`}>
                                {r.rate}%
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-355 font-bold">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-3.5 text-right">
                        {s.trend === 'up' && (
                          <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 w-fit ml-auto">
                            <TrendingUp className="w-3.5 h-3.5" /> MELHORIA
                          </span>
                        )}
                        {s.trend === 'down' && (
                          <span className="bg-rose-50 text-rose-700 text-[8px] font-black px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1 w-fit ml-auto">
                            <TrendingDown className="w-3.5 h-3.5" /> QUEDA
                          </span>
                        )}
                        {s.trend === 'neutral' && (
                          <span className="bg-slate-50 text-slate-600 text-[8px] font-black px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 w-fit ml-auto">
                            <Minus className="w-3.5 h-3.5" /> ESTÁVEL
                          </span>
                        )}
                        {s.trend === 'none' && (
                          <span className="text-[10px] text-slate-300 font-bold">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Rodapé de Ações na aba de evolução também */}
        <div className="flex justify-end gap-3 mt-6 print:hidden">
          <Button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all border-none"
          >
            <FileDown className="w-4 h-4" />
            Exportar Planilha
          </Button>
          <Button
            onClick={() => window.print()}
            className="bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all border-none"
          >
            <Download className="w-4 h-4" />
            Gerar Relatório PDF
          </Button>
        </div>
      </div>
    );
  }

  // TAB 3: Boletim
  function renderBoletimTab() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
        {/* Left Side Pane: Student List with Search */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-white border-slate-200 p-4 rounded-2xl shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar estudante..."
                value={boletimSearchQuery}
                onChange={e => setBoletimSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-indigo-500 transition-all bg-white"
              />
            </div>
          </Card>

          <Card className="bg-white border-slate-200 p-0 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[580px]">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-405 uppercase tracking-widest">Estudantes ({filteredBoletimStudents.length})</span>
            </div>
            
            <div className="divide-y divide-slate-100 overflow-y-auto custom-scrollbar flex-1">
              {filteredBoletimStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase italic">
                  Nenhum estudante encontrado
                </div>
              ) : (
                filteredBoletimStudents.map((s) => {
                  const isActive = String(s.id) === String(boletimSelectedStudentId);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setBoletimSelectedStudentId(String(s.id))}
                      className={`w-full text-left px-4 py-3.5 transition-all flex flex-col gap-0.5 ${
                        isActive 
                          ? 'bg-indigo-50 border-r-4 border-indigo-650 text-indigo-950 font-black' 
                          : 'hover:bg-slate-50/50 text-slate-700'
                      }`}
                    >
                      <span className="text-xs uppercase tracking-tight font-black">{s.name}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Educação Infantil</span>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Side Pane: Selected Student Report Card */}
        <div className="lg:col-span-8">
          {!selectedBoletimStudent ? (
            <Card className="p-12 text-center bg-white border-slate-200 rounded-2xl shadow-sm">
              <HelpCircle className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-400 uppercase">Selecione uma criança na lista para ver o boletim.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-sm">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-850 uppercase tracking-tight">{selectedBoletimStudent.name}</h3>
                      <p className="text-[10px] font-bold text-slate-405 uppercase tracking-wider mt-0.5">
                        {selectedEscolaName} • {selectedGrupo} ({selectedTurmaName})
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsPrinting(true)}
                    className="flex items-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all self-start sm:self-center px-4 py-2 text-xs font-bold rounded-xl"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir Boletim
                  </Button>
                </div>

                {/* Bulletin Contents */}
                <div className="space-y-8">
                  {Object.entries(objectivesByCampo).map(([campo, list]) => (
                    <div key={campo} className="space-y-3">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-l-4 border-indigo-655 pl-2">
                        {campo}
                      </h4>
                      <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-405 uppercase tracking-wider">
                              <th className="px-4 py-2.5 w-[12%] text-center">Cód.</th>
                              <th className="px-4 py-2.5 w-[58%]">Objetivo de Desenvolvimento</th>
                              <th className="px-4 py-2.5 w-[7.5%] text-center">1º Bim</th>
                              <th className="px-4 py-2.5 w-[7.5%] text-center">2º Bim</th>
                              <th className="px-4 py-2.5 w-[7.5%] text-center">3º Bim</th>
                              <th className="px-4 py-2.5 w-[7.5%] text-center">4º Bim</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {list.map((obj) => (
                              <tr key={obj.code} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-4 py-3 text-center text-xs font-black text-indigo-600 bg-indigo-50/10">
                                  {obj.code}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-[11px] font-bold text-slate-750 block leading-snug">{obj.short}</span>
                                  <span className="text-[9px] text-slate-450 mt-0.5 block leading-normal font-medium">{obj.desc}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {renderConceptBadge(getStudentConceptForObjective(selectedBoletimStudent.id, obj.code, 1))}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {renderConceptBadge(getStudentConceptForObjective(selectedBoletimStudent.id, obj.code, 2))}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {renderConceptBadge(getStudentConceptForObjective(selectedBoletimStudent.id, obj.code, 3))}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {renderConceptBadge(getStudentConceptForObjective(selectedBoletimStudent.id, obj.code, 4))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legenda */}
                <div className="mt-8 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Legenda de Conceitos</h5>
                  <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-tight text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="bg-emerald-50 text-emerald-700 font-black px-1.5 py-0.5 rounded text-[9px] border border-emerald-200">D</span> Desenvolvido
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="bg-blue-50 text-blue-700 font-black px-1.5 py-0.5 rounded text-[9px] border border-blue-200">ED</span> Em Desenvolvimento
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="bg-slate-50 text-slate-500 font-black px-1.5 py-0.5 rounded text-[9px] border border-slate-200">ND</span> Não Desenvolvido / Não Avaliado
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }
};

// ====== PRINTABLE BOLETIM PORTAL COMPONENT ======
interface PrintableBoletimProps {
  student: Aluno;
  escolaName: string;
  grupo: string;
  turmaName: string;
  objectivesByCampo: Record<string, any[]>;
  getConcept: (skillCode: string, bimester: number) => string | null;
  onClose: () => void;
}

const PrintableBoletim: React.FC<PrintableBoletimProps> = ({
  student,
  escolaName,
  grupo,
  turmaName,
  objectivesByCampo,
  getConcept,
  onClose
}) => {
  const currentYear = new Date().getFullYear();
  const emissionDate = new Date().toLocaleDateString('pt-BR');
  const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    const handleAfterPrint = () => {
      onClose();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClose]);

  const thStyle: React.CSSProperties = {
    padding: '6pt 8pt',
    border: '0.5pt solid #334155',
    fontSize: '7.5pt',
    fontWeight: 800,
    textTransform: 'uppercase',
    color: '#fff',
    background: '#0f172a',
    textAlign: 'left',
    letterSpacing: '0.05em',
  };

  const tdStyle: React.CSSProperties = {
    padding: '5pt 8pt',
    border: '0.5pt solid #cbd5e1',
    fontSize: '7.5pt',
    fontWeight: 600,
    color: '#334155',
    verticalAlign: 'middle',
  };

  const conceptBadgePrint = (concept: string | null) => {
    if (!concept) return <span style={{ color: '#cbd5e1', fontWeight: 900 }}>-</span>;
    let color = '#475569';
    let bg = '#f1f5f9';
    if (concept === 'D') { color = '#15803d'; bg = '#dcfce7'; }
    else if (concept === 'ED') { color = '#1d4ed8'; bg = '#dbeafe'; }
    else if (concept === 'ND') { color = '#94a3b8'; bg = '#f8fafc'; }

    return (
      <span style={{
        background: bg,
        color: color,
        padding: '2pt 6pt',
        borderRadius: '3px',
        fontWeight: 900,
        fontSize: '7.5pt',
        border: '0.5pt solid ' + (concept === 'D' ? '#bbf7d0' : concept === 'ED' ? '#bfdbfe' : '#cbd5e1'),
        display: 'inline-block'
      }}>
        {concept}
      </span>
    );
  };

  const content = (
    <div className="print-only bg-white text-slate-900" style={{ padding: '40px', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: '8.5pt' }}>
      <style>
        {`
        @media print {
            body * {
                visibility: hidden !important;
            }
            .print-only, .print-only * {
                visibility: visible !important;
            }
            .print-only {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                padding: 20px !important;
                margin: 0 !important;
                background: white !important;
            }
        }
        `}
      </style>

      {/* ====== INSTITUTIONAL HEADER ====== */}
      <div className="text-center mb-4 pb-3" style={{ borderBottom: '2pt solid #0f172a' }}>
        <p style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '1pt' }}>
          ESTADO DO MARANHÃO
        </p>
        <p style={{ fontSize: '10pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '1pt' }}>
          PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
        </p>
        <p style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '8pt' }}>
          SECRETARIA MUNICIPAL DE EDUCAÇÃO
        </p>
        <div style={{ width: '60pt', height: '1.5pt', background: '#4f46e5', margin: '0 auto 6pt' }} />
        <h1 style={{ fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 3pt' }}>
          Boletim de Desempenho Escolar
        </h1>
        <p style={{ fontSize: '7pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Educação Infantil — Ano Letivo: {currentYear}
        </p>
      </div>

      {/* ====== INFO BANNER ====== */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15pt', padding: '8pt 12pt', background: '#f8fafc', border: '0.5pt solid #cbd5e1', marginBottom: '12pt' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4pt' }}>
          <div>
            <span style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Estudante</span>
            <p style={{ fontSize: '11pt', fontWeight: 900, color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>{student.name}</p>
          </div>
          <div>
            <span style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Unidade Escolar</span>
            <p style={{ fontSize: '8.5pt', fontWeight: 700, color: '#334155', margin: 0 }}>{escolaName}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <div style={{ marginRight: '10px' }}>
              <span style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Grupo/Faixa</span>
              <p style={{ fontSize: '9pt', fontWeight: 900, color: '#4f46e5', margin: 0 }}>{grupo}</p>
            </div>
            <div>
              <span style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Turma</span>
              <p style={{ fontSize: '9pt', fontWeight: 900, color: '#4f46e5', margin: 0 }}>{turmaName}</p>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Emissão</span>
            <p style={{ fontSize: '7pt', fontWeight: 600, color: '#475569', margin: 0 }}>
              {emissionDate} às {emissionTime}
            </p>
          </div>
        </div>
      </div>

      {/* ====== OBJECTIVES TABLE ====== */}
      {Object.entries(objectivesByCampo).map(([campo, list]) => (
        <div key={campo} style={{ marginBottom: '14pt', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '8.5pt', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', borderBottom: '1pt solid #cbd5e1', paddingBottom: '2pt', marginBottom: '5pt' }}>
            {campo}
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '12%', textAlign: 'center' }}>Cód.</th>
                <th style={{ ...thStyle, width: '58%' }}>Objetivo de Aprendizagem e Desenvolvimento</th>
                <th style={{ ...thStyle, width: '7.5%', textAlign: 'center' }}>1º Bim</th>
                <th style={{ ...thStyle, width: '7.5%', textAlign: 'center' }}>2º Bim</th>
                <th style={{ ...thStyle, width: '7.5%', textAlign: 'center' }}>3º Bim</th>
                <th style={{ ...thStyle, width: '7.5%', textAlign: 'center' }}>4º Bim</th>
              </tr>
            </thead>
            <tbody>
              {list.map((obj, idx) => (
                <tr key={obj.code} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 900, color: '#4f46e5', fontSize: '7.5pt' }}>{obj.code}</td>
                  <td style={{ ...tdStyle }}>
                    <span style={{ fontWeight: 800, color: '#1e293b' }}>{obj.short}</span>
                    <p style={{ fontSize: '6.5pt', color: '#64748b', margin: '1pt 0 0', fontWeight: 500, lineHeight: '1.2' }}>{obj.desc}</p>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{conceptBadgePrint(getConcept(obj.code, 1))}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{conceptBadgePrint(getConcept(obj.code, 2))}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{conceptBadgePrint(getConcept(obj.code, 3))}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{conceptBadgePrint(getConcept(obj.code, 4))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* ====== LEGENDA ====== */}
      <div style={{ marginTop: '20pt', padding: '10px 15px', background: '#f8fafc', border: '0.5pt solid #e2e8f0', borderRadius: '6px', pageBreakInside: 'avoid' }}>
        <p style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase', color: '#475569', marginBottom: '5px' }}>Legenda de Conceitos:</p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ fontSize: '7.5pt', fontWeight: 700, color: '#334155' }}>
            <strong style={{ color: '#15803d', marginRight: '3px' }}>D:</strong> Desenvolvido
          </span>
          <span style={{ fontSize: '7.5pt', fontWeight: 700, color: '#334155' }}>
            <strong style={{ color: '#1d4ed8', marginRight: '3px' }}>ED:</strong> Em Desenvolvimento
          </span>
          <span style={{ fontSize: '7.5pt', fontWeight: 700, color: '#334155' }}>
            <strong style={{ color: '#64748b', marginRight: '3px' }}>ND:</strong> Não Desenvolvido / Não Avaliado
          </span>
        </div>
      </div>

      {/* ====== SIGNATURES ====== */}
      <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', marginTop: '35pt', pageBreakInside: 'avoid' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
          <p style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
            Professor(a) Regente
          </p>
          <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b' }}>
            EDUCAÇÃO INFANTIL
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
          <p style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
            Diretor(a) / Coordenador(a) Pedagógico(a)
          </p>
          <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b' }}>
            ASSINATURA E CARIMBO
          </p>
        </div>
      </div>

      {/* ====== FOOTER ====== */}
      <div className="print-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '5pt', marginTop: '25pt' }}>
        <span>SIGAR • Sistema Integrado de Gestão</span>
        <span>Boletim do Aluno: {student.name} • {currentYear}</span>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
