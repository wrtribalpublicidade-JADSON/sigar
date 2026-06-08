import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  GraduationCap, School as SchoolIcon, Users, CheckCircle, 
  Loader2, Save, AlertTriangle, HelpCircle, FileSpreadsheet, RefreshCw,
  Percent
} from 'lucide-react';
import { Escola, Coordenador, Segmento, Aluno } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';
import { BNCC_INFANTIL } from './ConselhoClasse';
import { ccAvaliacaoInfantilService, ccEstudanteService } from '../services/gestaoConselhoService';

interface AvaliacaoDocenteInfantilProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
  subHeader?: React.ReactNode;
}

const PERIODOS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

const CAMPOS_EXPERIENCIA = [
  "O eu, o outro e o nós",
  "Corpo, gestos e movimentos",
  "Traços, sons, cores e formas",
  "Escuta, fala, pensamento e imaginação",
  "Espaços, tempos, quantidades, relações e transformações"
];

export const AvaliacaoDocenteInfantil: React.FC<AvaliacaoDocenteInfantilProps> = ({
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
  const [selectedBimestre, setSelectedBimestre] = useState(PERIODOS[0]);
  const [selectedCampo, setSelectedCampo] = useState(CAMPOS_EXPERIENCIA[0]);

  // Loaded Data
  const [turmas, setTurmas] = useState<any[]>([]);
  const [students, setStudents] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Concept Map: studentId_skillCode -> Concept ('D' | 'ED' | 'ND')
  const [evaluations, setEvaluations] = useState<Record<string, 'D' | 'ED' | 'ND'>>({});
  const [initialEvaluations, setInitialEvaluations] = useState<Record<string, 'D' | 'ED' | 'ND'>>({});

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
          // Fallback to ccEstudanteService or filter
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
        showNotification('error', 'Erro ao carregar lista de estudantes.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedTurmaId, isDemoMode]);

  // Bimestre mapper (1º Bimestre -> 1)
  const bimestreNum = useMemo(() => {
    return PERIODOS.indexOf(selectedBimestre) + 1;
  }, [selectedBimestre]);

  // Determine current BNCC Skills
  const ageGroupKey = useMemo(() => {
    if (['Creche II', 'Creche III'].includes(selectedGrupo)) {
      return 'Crianças bem pequenas';
    }
    return 'Crianças pequenas';
  }, [selectedGrupo]);

  const currentObjectives = useMemo(() => {
    const key = selectedCampo.toUpperCase() as keyof typeof BNCC_INFANTIL;
    return BNCC_INFANTIL[key]?.[ageGroupKey as 'Crianças bem pequenas' | 'Crianças pequenas'] || [];
  }, [selectedCampo, ageGroupKey]);

  // 5. Load evaluations for current combination
  useEffect(() => {
    const loadEvaluations = async () => {
      if (students.length === 0 || !selectedTurmaId) {
        setEvaluations({});
        setInitialEvaluations({});
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
            evs = allLocal.filter((item: any) => 
              studentIds.includes(item.student_id) && 
              item.period === bimestreNum &&
              item.campo_experiencia.toUpperCase() === selectedCampo.toUpperCase()
            );
          } else {
            // Load from service mock
            evs = await ccAvaliacaoInfantilService.getByStudents(studentIds, bimestreNum, {
              escola_id: currentSchoolId,
              turma_id: selectedTurmaId,
              campo_experiencia: selectedCampo
            });
          }
        } else {
          // Supabase service
          evs = await ccAvaliacaoInfantilService.getByStudents(studentIds, bimestreNum, {
            escola_id: currentSchoolId,
            turma_id: selectedTurmaId,
            campo_experiencia: selectedCampo
          });
        }

        const map: Record<string, 'D' | 'ED' | 'ND'> = {};
        evs.forEach(item => {
          const key = `${item.student_id}_${item.skill_code}`;
          map[key] = item.status || item.conceito;
        });

        setEvaluations(map);
        setInitialEvaluations({ ...map });
      } catch (err) {
        console.error('Erro ao carregar avaliações:', err);
      }
    };

    loadEvaluations();
  }, [students, selectedTurmaId, bimestreNum, selectedCampo, isDemoMode, currentSchoolId]);

  // Check if there are changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(evaluations) !== JSON.stringify(initialEvaluations);
  }, [evaluations, initialEvaluations]);

  // Concepts summary stats
  const stats = useMemo(() => {
    let d = 0, ed = 0, nd = 0;
    const totalCells = students.length * currentObjectives.length;
    let evaluatedCount = 0;

    Object.entries(evaluations).forEach(([key, val]) => {
      // Key format: studentId_skillCode
      const [studentId, skillCode] = key.split('_');
      // Ensure this matches currently loaded student and skills
      const studentExists = students.some(s => String(s.id) === studentId);
      const skillExists = currentObjectives.some(obj => obj.code === skillCode);

      if (studentExists && skillExists) {
        evaluatedCount++;
        if (val === 'D') d++;
        else if (val === 'ED') ed++;
        else if (val === 'ND') nd++;
      }
    });

    const completionRate = totalCells > 0 ? Math.round((evaluatedCount / totalCells) * 100) : 0;
    const consolidationRate = evaluatedCount > 0 ? Math.round(((d * 2 + ed) / (evaluatedCount * 2)) * 100) : 0;

    return { d, ed, nd, completionRate, consolidationRate, pending: totalCells - evaluatedCount };
  }, [evaluations, students, currentObjectives]);

  // Set concept handler
  const handleSetConcept = (studentId: number, skillCode: string, concept: 'D' | 'ED' | 'ND') => {
    const key = `${studentId}_${skillCode}`;
    setEvaluations(prev => {
      if (prev[key] === concept) {
        const next = { ...prev };
        delete next[key]; // Toggle off if clicked same
        return next;
      }
      return { ...prev, [key]: concept };
    });
  };

  // Quick fill all students for a specific skill
  const handleQuickFillSkill = (skillCode: string, concept: 'D' | 'ED' | 'ND') => {
    setEvaluations(prev => {
      const next = { ...prev };
      students.forEach(s => {
        next[`${s.id}_${skillCode}`] = concept;
      });
      return next;
    });
  };

  // Save changes
  const handleSave = async () => {
    if (students.length === 0) return;
    setSaving(true);
    try {
      const payload: any[] = [];
      students.forEach(s => {
        currentObjectives.forEach(obj => {
          const key = `${s.id}_${obj.code}`;
          const val = evaluations[key];
          if (val) {
            payload.push({
              escola_id: currentSchoolId,
              responsavel_id: currentUser?.id || null,
              turma_id: selectedTurmaId,
              campo_experiencia: selectedCampo.toUpperCase(),
              bimestre: bimestreNum,
              estudante_id: s.id,
              skill_code: obj.code,
              conceito: val,
              status: val,
              updated_at: new Date().toISOString()
            });
          }
        });
      });

      if (isDemoMode) {
        const localKey = `sigar_cc_i_avaliacoes_demo`;
        const saved = localStorage.getItem(localKey) || '[]';
        const allLocal = JSON.parse(saved);
        
        // Remove old matches to avoid duplicates
        const studentIds = students.map(s => s.id);
        const filtered = allLocal.filter((item: any) => 
          !(studentIds.includes(item.student_id) && 
            item.period === bimestreNum &&
            item.campo_experiencia.toUpperCase() === selectedCampo.toUpperCase())
        );

        // Append new evaluations
        const newItems = payload.map(p => ({
          id: `demo-${crypto.randomUUID()}`,
          student_id: p.estudante_id,
          period: p.bimestre,
          skill_code: p.skill_code,
          status: p.conceito,
          campo_experiencia: p.campo_experiencia,
          escola_id: p.escola_id,
          turma_id: p.turma_id
        }));

        localStorage.setItem(localKey, JSON.stringify([...filtered, ...newItems]));
        showNotification('success', 'Avaliações salvas com sucesso em modo de demonstração!');
      } else {
        await ccAvaliacaoInfantilService.saveMany(payload);
        showNotification('success', 'Avaliações salvas com sucesso no banco de dados!');
      }

      setInitialEvaluations({ ...evaluations });
    } catch (err) {
      console.error('Erro ao salvar avaliações:', err);
      showNotification('error', 'Erro ao salvar avaliações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <PageHeader 
        title="Avaliação Docente - Educação Infantil"
        subtitle="Registro qualitativo do desenvolvimento dos estudantes em relação aos objetivos de aprendizagem BNCC"
        icon={GraduationCap}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {subHeader}

      {/* Selectors and Filters Card */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Período Avaliativo *</label>
            <select 
              value={selectedBimestre}
              onChange={e => setSelectedBimestre(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
            >
              {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Campo de Experiência *</label>
            <select 
              value={selectedCampo}
              onChange={e => setSelectedCampo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all bg-white"
            >
              {CAMPOS_EXPERIENCIA.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Summary Stats Panels */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <Card className="bg-slate-55 border-slate-200/50 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Estudantes</p>
              <h4 className="text-md font-black text-slate-800">{students.length} matriculados</h4>
            </div>
          </Card>

          <Card className="bg-slate-55 border-slate-200/50 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-black">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Preenchimento</p>
              <h4 className="text-md font-black text-slate-800">{stats.completionRate}% concluído</h4>
            </div>
          </Card>

          <Card className="bg-slate-55 border-slate-200/50 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Consolidação Média</p>
              <h4 className="text-md font-black text-slate-800">{stats.consolidationRate}% consolidado</h4>
            </div>
          </Card>

          <Card className="bg-slate-55 border-slate-200/50 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-black">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Células Pendentes</p>
              <h4 className="text-md font-black text-slate-800">{stats.pending} objetivos</h4>
            </div>
          </Card>
        </div>
      )}

      {/* Main Grid / Assessment Table */}
      {loading ? (
        <Card className="p-12 text-center bg-white border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-2" />
          <p className="text-xs font-bold text-slate-500 uppercase">Carregando dados da turma...</p>
        </Card>
      ) : students.length === 0 ? (
        <Card className="p-12 text-center bg-white border-slate-200">
          <HelpCircle className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-500 uppercase">Selecione uma turma com estudantes matriculados para iniciar.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white rounded-2xl animate-in fade-in duration-300">
          {/* Legend header */}
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-4 text-[10px] font-bold">
              <span className="text-slate-400 uppercase tracking-wider">CONCEITOS:</span>
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]">D</span>
                Desenvolvido
              </span>
              <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px]">ED</span>
                Em Desenvolvimento
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="w-4 h-4 rounded-full bg-slate-400 text-white flex items-center justify-center text-[9px]">ND</span>
                Não Desenvolvido
              </span>
            </div>

            <div className="flex gap-2 text-[10px]">
              {hasChanges && (
                <div className="text-amber-600 font-bold flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-100 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Alterações não salvas
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">#</th>
                  <th className="px-4 py-4 min-w-[200px]">Estudante</th>
                  {currentObjectives.map(obj => (
                    <th key={obj.code} className="px-3 py-4 text-center border-l border-slate-100 min-w-[120px]" title={obj.desc}>
                      <div className="font-bold text-orange-600">{obj.code}</div>
                      <div className="text-[9px] text-slate-400 font-bold lowercase mt-0.5 truncate max-w-[120px]">{obj.short}</div>
                    </th>
                  ))}
                  <th className="px-4 py-4 text-center border-l border-slate-100 w-28">Consolidação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Quick actions row */}
                <tr className="bg-orange-50/20 font-bold text-[10px] text-slate-500">
                  <td className="px-4 py-2 text-center">-</td>
                  <td className="px-4 py-2 uppercase tracking-wide">Ação rápida para toda coluna</td>
                  {currentObjectives.map(obj => (
                    <td key={obj.code} className="px-3 py-2 text-center border-l border-slate-100">
                      <div className="flex justify-center gap-1">
                        <button 
                          type="button"
                          onClick={() => handleQuickFillSkill(obj.code, 'D')}
                          className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border hover:bg-emerald-100 transition-colors"
                          title="Marcar tudo D"
                        >
                          D
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleQuickFillSkill(obj.code, 'ED')}
                          className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border hover:bg-blue-100 transition-colors"
                          title="Marcar tudo ED"
                        >
                          ED
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleQuickFillSkill(obj.code, 'ND')}
                          className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border hover:bg-slate-200 transition-colors"
                          title="Marcar tudo ND"
                        >
                          ND
                        </button>
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-2 text-center border-l border-slate-100">-</td>
                </tr>

                {students.map((student, idx) => {
                  let totalScore = 0;
                  let objEvaluatedCount = 0;
                  
                  currentObjectives.forEach(obj => {
                    const concept = evaluations[`${student.id}_${obj.code}`];
                    if (concept) {
                      objEvaluatedCount++;
                      if (concept === 'D') totalScore += 2;
                      else if (concept === 'ED') totalScore += 1;
                    }
                  });

                  const studentConsolidation = objEvaluatedCount > 0 
                    ? Math.round((totalScore / (objEvaluatedCount * 2)) * 100) 
                    : 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors font-medium">
                      <td className="px-4 py-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-800 uppercase tracking-tight">{student.name}</div>
                      </td>
                      {currentObjectives.map(obj => {
                        const currentVal = evaluations[`${student.id}_${obj.code}`];
                        return (
                          <td key={obj.code} className="px-3 py-3 text-center border-l border-slate-100">
                            <div className="flex justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSetConcept(student.id, obj.code, 'D')}
                                className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center transition-all ${
                                  currentVal === 'D'
                                    ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-200 scale-110'
                                    : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200/50'
                                }`}
                              >
                                D
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetConcept(student.id, obj.code, 'ED')}
                                className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center transition-all ${
                                  currentVal === 'ED'
                                    ? 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-200 scale-110'
                                    : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/50'
                                }`}
                              >
                                ED
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetConcept(student.id, obj.code, 'ND')}
                                className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center transition-all ${
                                  currentVal === 'ND'
                                    ? 'bg-slate-400 text-white shadow-sm ring-2 ring-slate-200 scale-110'
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200/50'
                                }`}
                              >
                                ND
                              </button>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 border-l border-slate-100 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            studentConsolidation >= 80 ? 'bg-emerald-50 text-emerald-700' :
                            studentConsolidation >= 50 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {studentConsolidation}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Form Actions footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {stats.pending > 0 ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                  Restam {stats.pending} avaliações de habilidades para preenchimento completo.
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Todos os conceitos foram preenchidos com sucesso!
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (window.confirm('Deseja descartar as alterações não salvas?')) {
                    setEvaluations({ ...initialEvaluations });
                  }
                }}
                disabled={!hasChanges || saving}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 bg-white transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Descartar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar Avaliações
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
