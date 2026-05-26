import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  GraduationCap, School as SchoolIcon, Search, Save, Percent, 
  TrendingUp, Award, AlertTriangle, Loader2, ListFilter, Trash2
} from 'lucide-react';
import { Escola, Coordenador } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';

interface NotasProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
}

interface StudentGrade {
  id: string | number;
  name: string;
  av1: number | '';
  av2: number | '';
  qualitativa: number | '';
  recuperacao: number | '';
  mediaFinal: number;
}

interface GradeSheet {
  id: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  componente: string;
  bimestre: string;
  mediaTurma: number;
  taxaAprovacao: number;
  students: StudentGrade[];
  criadoEm: string;
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
  '4º Bimestre'
];

export const Notas: React.FC<NotasProps> = ({ escolas, isDemoMode, isAdmin, userEmail, currentUser }) => {
  const { showNotification } = showNotificationContext();
  const [sheets, setSheets] = useState<GradeSheet[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // Spreadsheet States
  const [gradesMap, setGradesMap] = useState<Record<string | number, Omit<StudentGrade, 'id' | 'name'>>>({});

  // Filter & Selection State
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [componente, setComponente] = useState(COMPONENTES[0]);
  const [bimestre, setBimestre] = useState(BIMESTRES[0]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Search Filter
  const [studentSearch, setStudentSearch] = useState('');

  // Workaround for NotificationContext import issues (fallback to native alert if context fails)
  function showNotificationContext() {
    try {
      return useNotification();
    } catch {
      return {
        showNotification: (type: 'success' | 'error' | 'info', msg: string) => {
          alert(`${type.toUpperCase()}: ${msg}`);
        }
      };
    }
  }

  const fetchRealSheets = async () => {
    try {
      const { data, error } = await supabase
        .from('notas_sheets')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });

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

      const formatted: GradeSheet[] = (data || []).map((p: any) => {
        const escolaObj = escolas.find(esc => esc.id === p.escola_id);
        const escolaNome = escolaObj ? escolaObj.nome : 'Unidade';
        const turmaNome = turmaMap.get(p.turma_id) || 'Turma';

        return {
          id: p.id,
          escolaId: p.escola_id,
          escolaNome,
          turmaId: p.turma_id,
          turmaNome,
          componente: p.componente,
          bimestre: p.bimestre,
          mediaTurma: Number(p.media_turma),
          taxaAprovacao: p.taxa_aprovacao,
          students: p.students || [],
          criadoEm: p.created_at
        };
      });

      setSheets(formatted);
    } catch (err) {
      console.error('Erro ao buscar pautas de notas do Supabase:', err);
      showNotification('error', 'Erro ao carregar dados do Supabase. Utilizando dados locais.');
    }
  };

  // Load from localStorage or Supabase
  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('sigar_notas_sheets');
      if (saved) {
        try {
          setSheets(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      if (escolas.length > 0) {
        fetchRealSheets();
      }
    }

    if (escolas.length > 0) {
      setSelectedEscolaId(escolas[0].id);
    }
  }, [escolas, isDemoMode]);

  // Load turmas when selected school changes
  useEffect(() => {
    const fetchTurmas = async () => {
      if (!selectedEscolaId) {
        setTurmas([]);
        return;
      }

      if (isDemoMode) {
        setTurmas([
          { id: 'demo-t1', name: '1º ANO A', shift: 'MANHÃ' },
          { id: 'demo-t2', name: '2º ANO B', shift: 'TARDE' },
          { id: 'demo-t3', name: '5º ANO A', shift: 'MANHÃ' },
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
        if (data && data.length > 0) {
          setSelectedTurmaId(data[0].id);
        } else {
          setSelectedTurmaId('');
        }
      } catch (err) {
        console.error('Erro ao carregar turmas:', err);
      }
    };

    fetchTurmas();
  }, [selectedEscolaId, isDemoMode]);

  // Load students and matching sheet values when selected class/subject/term changes
  useEffect(() => {
    const fetchStudentsAndGrades = async () => {
      if (!selectedTurmaId) {
        setStudents([]);
        setGradesMap({});
        return;
      }

      setIsLoadingStudents(true);

      // Check if there is an existing saved sheet for this context
      const savedSheet = sheets.find(s => 
        s.escolaId === selectedEscolaId && 
        s.turmaId === selectedTurmaId && 
        s.componente === componente && 
        s.bimestre === bimestre
      );

      if (savedSheet) {
        // Load students and grades from the saved sheet
        const sheetStudents = savedSheet.students.map(s => ({ id: s.id, name: s.name }));
        setStudents(sheetStudents);
        
        const map: Record<string | number, Omit<StudentGrade, 'id' | 'name'>> = {};
        savedSheet.students.forEach(s => {
          map[s.id] = {
            av1: s.av1,
            av2: s.av2,
            qualitativa: s.qualitativa,
            recuperacao: s.recuperacao,
            mediaFinal: s.mediaFinal
          };
        });
        setGradesMap(map);
        setIsLoadingStudents(false);
        return;
      }

      // If no saved sheet, fetch students from database/mock and initialize blank grades
      if (isDemoMode) {
        const demoStudents = [
          { id: 101, name: 'Alice Silveira Barbosa' },
          { id: 102, name: 'Arthur Gabriel Fernandes' },
          { id: 103, name: 'Beatriz Costa Rodrigues' },
          { id: 104, name: 'Caio Roberto Lima' },
          { id: 105, name: 'Eduarda Vitória Gomes' },
          { id: 106, name: 'Felipe Augusto Santos' },
          { id: 107, name: 'Giovanna Mendes Vieira' },
          { id: 108, name: 'Heitor Nogueira Lopes' },
          { id: 109, name: 'Isabela Rocha Martins' },
          { id: 110, name: 'João Pedro Oliveira' }
        ];
        setStudents(demoStudents);
        
        const map: Record<string | number, Omit<StudentGrade, 'id' | 'name'>> = {};
        demoStudents.forEach(s => {
          map[s.id] = { av1: '', av2: '', qualitativa: '', recuperacao: '', mediaFinal: 0 };
        });
        setGradesMap(map);
        setIsLoadingStudents(false);
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

        const map: Record<string | number, Omit<StudentGrade, 'id' | 'name'>> = {};
        (data || []).forEach((s: any) => {
          map[s.id] = { av1: '', av2: '', qualitativa: '', recuperacao: '', mediaFinal: 0 };
        });
        setGradesMap(map);
      } catch (err) {
        console.error('Erro ao carregar estudantes:', err);
        showNotification('error', 'Erro ao carregar alunos.');
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudentsAndGrades();
  }, [selectedTurmaId, selectedEscolaId, componente, bimestre, sheets, isDemoMode]);

  // Calculate final average based on: (AV1 + AV2 + Qualitativa) / 3, and if recovery is higher, replace it
  const calculateFinalMedia = (av1: number | '', av2: number | '', qual: number | '', rec: number | ''): number => {
    const valAv1 = av1 === '' ? 0 : av1;
    const valAv2 = av2 === '' ? 0 : av2;
    const valQual = qual === '' ? 0 : qual;
    
    // Calculate simple average of the three evaluations
    const baseMedia = Number(((valAv1 + valAv2 + valQual) / 3).toFixed(1));
    
    if (rec !== '' && rec > baseMedia) {
      return Number(Math.max(baseMedia, rec).toFixed(1));
    }
    
    return baseMedia;
  };

  const handleGradeChange = (studentId: string | number, field: 'av1' | 'av2' | 'qualitativa' | 'recuperacao', value: string) => {
    let numVal: number | '';
    if (value === '') {
      numVal = '';
    } else {
      const parsed = parseFloat(value.replace(',', '.'));
      if (isNaN(parsed) || parsed < 0 || parsed > 10) return;
      numVal = parsed;
    }

    setGradesMap(prev => {
      const current = prev[studentId] || { av1: '', av2: '', qualitativa: '', recuperacao: '', mediaFinal: 0 };
      const updatedField = {
        ...current,
        [field]: numVal
      };
      
      const newMedia = calculateFinalMedia(
        updatedField.av1,
        updatedField.av2,
        updatedField.qualitativa,
        updatedField.recuperacao
      );

      return {
        ...prev,
        [studentId]: {
          ...updatedField,
          mediaFinal: newMedia
        }
      };
    });
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) return { mediaTurma: 0, taxaAprovacao: 0, recuperacaoCount: 0 };

    let sum = 0;
    let approved = 0;

    students.forEach(s => {
      const media = gradesMap[s.id]?.mediaFinal || 0;
      sum += media;
      if (media >= 6.0) {
        approved++;
      }
    });

    const mediaTurma = Number((sum / total).toFixed(1));
    const taxaAprovacao = Math.round((approved / total) * 100);
    const recuperacaoCount = total - approved;

    return { mediaTurma, taxaAprovacao, recuperacaoCount };
  }, [students, gradesMap]);

  const handleSaveGrades = async () => {
    if (students.length === 0) {
      showNotification('error', 'Não há estudantes carregados para lançar notas.');
      return;
    }

    const escolaNome = escolas.find(e => e.id === selectedEscolaId)?.nome || 'Unidade';
    const turmaObj = turmas.find(t => t.id === selectedTurmaId);
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.year} • ${turmaObj.shift || ''}` : 'Turma';

    const sheetStudents: StudentGrade[] = students.map(s => {
      const grade = gradesMap[s.id] || { av1: '', av2: '', qualitativa: '', recuperacao: '', mediaFinal: 0 };
      return {
        id: s.id,
        name: s.name,
        av1: grade.av1,
        av2: grade.av2,
        qualitativa: grade.qualitativa,
        recuperacao: grade.recuperacao,
        mediaFinal: grade.mediaFinal
      };
    });

    const payload: GradeSheet = {
      id: crypto.randomUUID(),
      escolaId: selectedEscolaId,
      escolaNome,
      turmaId: selectedTurmaId,
      turmaNome,
      componente,
      bimestre,
      mediaTurma: stats.mediaTurma,
      taxaAprovacao: stats.taxaAprovacao,
      students: sheetStudents,
      criadoEm: new Date().toISOString()
    };

    const existingIndex = sheets.findIndex(s => 
      s.escolaId === selectedEscolaId && 
      s.turmaId === selectedTurmaId && 
      s.componente === componente && 
      s.bimestre === bimestre
    );

    if (existingIndex > -1) {
      payload.id = sheets[existingIndex].id;
    }

    if (!isDemoMode) {
      const dbPayload = {
        id: payload.id,
        escola_id: payload.escolaId,
        turma_id: payload.turmaId,
        componente: payload.componente,
        bimestre: payload.bimestre,
        media_turma: payload.mediaTurma,
        taxa_aprovacao: payload.taxaAprovacao,
        students: payload.students,
        updated_at: new Date().toISOString(),
        updated_by: userEmail || currentUser?.contato || 'user'
      };

      const { error } = await supabase
        .from('notas_sheets')
        .upsert(dbPayload);

      if (error) {
        console.error('Erro ao salvar notas no Supabase:', error);
        showNotification('error', 'Erro ao salvar a pauta de notas no banco de dados.');
        return;
      }

      if (existingIndex > -1) {
        const updated = [...sheets];
        updated[existingIndex] = payload;
        setSheets(updated);
        showNotification('success', 'Pauta de notas atualizada com sucesso no Supabase!');
      } else {
        setSheets([payload, ...sheets]);
        showNotification('success', 'Notas salvas com sucesso no Supabase!');
      }
    } else {
      let updatedSheets: GradeSheet[];
      if (existingIndex > -1) {
        updatedSheets = [...sheets];
        updatedSheets[existingIndex] = payload;
        showNotification('success', 'Pauta de notas atualizada com sucesso!');
      } else {
        updatedSheets = [payload, ...sheets];
        showNotification('success', 'Notas salvas com sucesso!');
      }

      setSheets(updatedSheets);
      localStorage.setItem('sigar_notas_sheets', JSON.stringify(updatedSheets));
    }
  };

  const handleDeleteSheet = async (id: string) => {
    if (!confirm('Deseja realmente remover esta pauta de notas?')) return;
    
    if (!isDemoMode) {
      const { error } = await supabase
        .from('notas_sheets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir pauta de notas no Supabase:', error);
        showNotification('error', 'Erro ao excluir a pauta de notas no banco de dados.');
        return;
      }
      showNotification('success', 'Pauta de notas removida do Supabase.');
    } else {
      showNotification('success', 'Pauta de notas removida.');
    }

    const updated = sheets.filter(s => s.id !== id);
    setSheets(updated);
    if (isDemoMode) {
      localStorage.setItem('sigar_notas_sheets', JSON.stringify(updated));
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      <PageHeader 
        title="Notas"
        subtitle="Lançamento de boletins, avaliações, recuperação e fechamento de médias"
        icon={GraduationCap}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {/* Configuration & Selection Bar */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <ListFilter className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Filtros de Lançamento</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turma *</label>
            <select 
              value={selectedTurmaId}
              onChange={e => setSelectedTurmaId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            >
              {turmas.length === 0 ? (
                <option value="">Nenhuma turma cadastrada</option>
              ) : (
                turmas.map(t => (
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bimestre *</label>
            <select 
              value={bimestre}
              onChange={e => setBimestre(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-brand-orange transition-all"
            >
              {BIMESTRES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={handleSaveGrades}
              disabled={isLoadingStudents || students.length === 0}
              className="w-full rounded-xl text-xs font-black py-2 bg-brand-orange hover:bg-orange-600 shadow-md flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Salvar Notas
            </Button>
          </div>
        </div>
      </Card>

      {/* Grades Dashboard Summary Stats */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Média da Turma</p>
              <h3 className={`text-2xl font-black mt-1 ${stats.mediaTurma >= 6.0 ? 'text-emerald-600' : 'text-amber-600'}`}>{stats.mediaTurma}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-150 flex items-center justify-center text-slate-500 bg-slate-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </Card>

          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taxa de Aprovados (Nota &gt;= 6.0)</p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-2xl font-black text-emerald-600">{stats.taxaAprovacao}%</h3>
                <div className="w-20 bg-slate-100 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${stats.taxaAprovacao}%` }} />
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Award className="w-5 h-5" />
            </div>
          </Card>

          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alunos Abaixo da Média</p>
              <h3 className="text-2xl font-black text-red-500 mt-1">{stats.recuperacaoCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </Card>
        </div>
      )}

      {/* Spreadsheet Grade Card */}
      {selectedTurmaId && (
        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden p-0">
          <div className="p-4 border-b border-slate-100">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar estudante..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 outline-none text-xs font-semibold"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoadingStudents ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-brand-orange animate-spin mb-3" />
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Carregando lista de alunos...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-bold">
                Nenhum estudante encontrado para os filtros selecionados.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs table-fixed min-w-[650px]">
                <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[9px] font-black text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3 w-[40%]">Estudante</th>
                    <th className="px-3 py-3 text-center w-[12%]">Avaliação 1</th>
                    <th className="px-3 py-3 text-center w-[12%]">Avaliação 2</th>
                    <th className="px-3 py-3 text-center w-[12%]">Qualitativa</th>
                    <th className="px-3 py-3 text-center w-[12%]">Recuperação</th>
                    <th className="px-6 py-3 text-center w-[12%]">Média Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, idx) => {
                    const gradeObj = gradesMap[student.id] || { av1: '', av2: '', qualitativa: '', recuperacao: '', mediaFinal: 0 };
                    const isApproved = gradeObj.mediaFinal >= 6.0;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-2.5">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-slate-400 w-5">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="font-bold text-slate-800 uppercase tracking-tight truncate">
                              {student.name}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-3 py-2 text-center">
                          <input 
                            type="text"
                            value={gradeObj.av1}
                            onChange={e => handleGradeChange(student.id, 'av1', e.target.value)}
                            placeholder="0.0"
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:border-brand-orange outline-none"
                          />
                        </td>

                        <td className="px-3 py-2 text-center">
                          <input 
                            type="text"
                            value={gradeObj.av2}
                            onChange={e => handleGradeChange(student.id, 'av2', e.target.value)}
                            placeholder="0.0"
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:border-brand-orange outline-none"
                          />
                        </td>

                        <td className="px-3 py-2 text-center">
                          <input 
                            type="text"
                            value={gradeObj.qualitativa}
                            onChange={e => handleGradeChange(student.id, 'qualitativa', e.target.value)}
                            placeholder="0.0"
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:border-brand-orange outline-none"
                          />
                        </td>

                        <td className="px-3 py-2 text-center">
                          <input 
                            type="text"
                            value={gradeObj.recuperacao}
                            onChange={e => handleGradeChange(student.id, 'recuperacao', e.target.value)}
                            placeholder="0.0"
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:border-brand-orange outline-none bg-orange-50/30"
                          />
                        </td>

                        <td className="px-6 py-2 text-center">
                          <span className={`inline-block font-black text-sm px-2.5 py-0.5 rounded-lg
                            ${isApproved 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-100 text-red-600'}`}
                          >
                            {gradeObj.mediaFinal.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* Grade Sheets History */}
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Boletins e Pautas Lançadas</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Consulte as pautas de notas históricas salvas</p>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Escola</th>
                  <th className="px-6 py-4">Turma / Componente</th>
                  <th className="px-6 py-4 text-center">Período</th>
                  <th className="px-6 py-4 text-center">Média Geral</th>
                  <th className="px-6 py-4 text-center">Aprovação (%)</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      Nenhuma pauta de notas cadastrada no histórico.
                    </td>
                  </tr>
                ) : (
                  sheets.map(sheet => (
                    <tr key={sheet.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3 font-bold text-slate-800">
                        {sheet.escolaNome}
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{sheet.turmaNome}</div>
                        <div className="text-[10px] text-brand-orange font-bold uppercase mt-0.5">
                          {sheet.componente}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center font-bold text-slate-600">
                        {sheet.bimestre}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-block font-black text-xs px-2.5 py-0.5 rounded-full
                          ${sheet.mediaTurma >= 6.0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'}`}
                        >
                          {sheet.mediaTurma}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700">
                          <span>{sheet.taxaAprovacao}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDeleteSheet(sheet.id)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                            title="Remover Pauta"
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
