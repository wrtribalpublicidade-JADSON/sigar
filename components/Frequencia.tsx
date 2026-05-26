import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  ClipboardCheck, Calendar, School as SchoolIcon, Search, Save, CheckCircle, 
  XCircle, Percent, Users, Loader2, ListFilter, Trash2
} from 'lucide-react';
import { Escola, Coordenador } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';

interface FrequenciaProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
}

interface StudentAttendance {
  id: string | number;
  name: string;
  present: boolean;
}

interface AttendanceSheet {
  id: string;
  data: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  componente: string;
  presentesCount: number;
  totalCount: number;
  rate: number;
  students: StudentAttendance[];
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

export const Frequencia: React.FC<FrequenciaProps> = ({ escolas, isDemoMode, isAdmin, userEmail, currentUser }) => {
  const { showNotification } = useNotification();
  const [sheets, setSheets] = useState<AttendanceSheet[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string | number, boolean>>({});

  // Filter & Context State
  const [dataFreq, setDataFreq] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [componente, setComponente] = useState(COMPONENTES[0]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Search Filter
  const [studentSearch, setStudentSearch] = useState('');

  const fetchRealSheets = async () => {
    try {
      const { data, error } = await supabase
        .from('frequencia_sheets')
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

      const formatted: AttendanceSheet[] = (data || []).map((p: any) => {
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
          presentesCount: p.presentes_count,
          totalCount: p.total_count,
          rate: p.rate,
          students: p.students || [],
          criadoEm: p.created_at
        };
      });

      setSheets(formatted);
    } catch (err) {
      console.error('Erro ao buscar pautas de frequência do Supabase:', err);
      showNotification('error', 'Erro ao carregar dados do Supabase. Utilizando dados locais.');
    }
  };

  // Load from localStorage or Supabase & Set default school
  useEffect(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('sigar_frequencia_sheets');
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

  // Load students when selected class changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedTurmaId) {
        setStudents([]);
        setAttendanceMap({});
        return;
      }

      setIsLoadingStudents(true);

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
        // Pre-fill presence map with true
        const initialMap: Record<string | number, boolean> = {};
        demoStudents.forEach(s => { initialMap[s.id] = true; });
        setAttendanceMap(initialMap);
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
        
        const initialMap: Record<string | number, boolean> = {};
        (data || []).forEach((s: any) => {
          initialMap[s.id] = true; // Default to present
        });
        setAttendanceMap(initialMap);
      } catch (err) {
        console.error('Erro ao carregar estudantes:', err);
        showNotification('error', 'Erro ao carregar alunos.');
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [selectedTurmaId, isDemoMode]);

  const handleToggleAttendance = (studentId: string | number) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleMarkAll = (present: boolean) => {
    const updatedMap: Record<string | number, boolean> = {};
    students.forEach(s => {
      updatedMap[s.id] = present;
    });
    setAttendanceMap(updatedMap);
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) return { total: 0, presents: 0, absents: 0, rate: 0 };

    const presents = Object.values(attendanceMap).filter(val => val === true).length;
    const absents = total - presents;
    const rate = Math.round((presents / total) * 100);

    return { total, presents, absents, rate };
  }, [students, attendanceMap]);

  const handleSaveSheet = async () => {
    if (students.length === 0) {
      showNotification('error', 'Não há estudantes carregados para registrar a frequência.');
      return;
    }

    const escolaNome = escolas.find(e => e.id === selectedEscolaId)?.nome || 'Unidade';
    const turmaObj = turmas.find(t => t.id === selectedTurmaId);
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.year} • ${turmaObj.shift || ''}` : 'Turma';

    const sheetStudents: StudentAttendance[] = students.map(s => ({
      id: s.id,
      name: s.name,
      present: attendanceMap[s.id] ?? true
    }));

    const payload: AttendanceSheet = {
      id: crypto.randomUUID(),
      data: dataFreq,
      escolaId: selectedEscolaId,
      escolaNome,
      turmaId: selectedTurmaId,
      turmaNome,
      componente,
      presentesCount: stats.presents,
      totalCount: stats.total,
      rate: stats.rate,
      students: sheetStudents,
      criadoEm: new Date().toISOString()
    };

    // Check if there is already a sheet for this class, date and component
    const existingIndex = sheets.findIndex(s => s.data === dataFreq && s.turmaId === selectedTurmaId && s.componente === componente);
    
    if (existingIndex > -1) {
      if (!confirm('Já existe uma chamada salva para esta turma, data e componente. Deseja sobrescrever os dados?')) return;
      
      // Keep same ID for primary key upsert
      payload.id = sheets[existingIndex].id;
    }

    if (!isDemoMode) {
      const dbPayload = {
        id: payload.id,
        data: payload.data,
        escola_id: payload.escolaId,
        turma_id: payload.turmaId,
        componente: payload.componente,
        presentes_count: payload.presentesCount,
        total_count: payload.totalCount,
        rate: payload.rate,
        students: payload.students,
        updated_at: new Date().toISOString(),
        updated_by: userEmail || currentUser?.contato || 'user'
      };

      const { error } = await supabase
        .from('frequencia_sheets')
        .upsert(dbPayload);

      if (error) {
        console.error('Erro ao salvar chamada no Supabase:', error);
        showNotification('error', 'Erro ao salvar a chamada no banco de dados.');
        return;
      }

      if (existingIndex > -1) {
        const updated = [...sheets];
        updated[existingIndex] = payload;
        setSheets(updated);
        showNotification('success', 'Chamada atualizada com sucesso no Supabase!');
      } else {
        setSheets([payload, ...sheets]);
        showNotification('success', 'Frequência registrada com sucesso no Supabase!');
      }
    } else {
      let updatedSheets: AttendanceSheet[];
      if (existingIndex > -1) {
        updatedSheets = [...sheets];
        updatedSheets[existingIndex] = payload;
        showNotification('success', 'Chamada atualizada com sucesso!');
      } else {
        updatedSheets = [payload, ...sheets];
        showNotification('success', 'Frequência registrada com sucesso!');
      }

      setSheets(updatedSheets);
      localStorage.setItem('sigar_frequencia_sheets', JSON.stringify(updatedSheets));
    }
  };

  const handleDeleteSheet = async (id: string) => {
    if (!confirm('Deseja realmente remover esta folha de frequência?')) return;
    
    if (!isDemoMode) {
      const { error } = await supabase
        .from('frequencia_sheets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir chamada no Supabase:', error);
        showNotification('error', 'Erro ao excluir a chamada no banco de dados.');
        return;
      }
      showNotification('success', 'Registro de chamada removido do Supabase.');
    } else {
      showNotification('success', 'Registro de chamada removido.');
    }

    const updated = sheets.filter(s => s.id !== id);
    setSheets(updated);
    if (isDemoMode) {
      localStorage.setItem('sigar_frequencia_sheets', JSON.stringify(updated));
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      <PageHeader 
        title="Frequência"
        subtitle="Registro de chamada diária e taxa de assiduidade escolar"
        icon={ClipboardCheck}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {/* Filters & Configuration */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <ListFilter className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Seleção de Turma e Período</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data da Chamada *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="date" 
                value={dataFreq}
                onChange={e => setDataFreq(e.target.value)}
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
        </div>
      </Card>

      {/* Stats Summary cards */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Alunos</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
              <Users className="w-5 h-5" />
            </div>
          </Card>

          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Presentes</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.presents}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
          </Card>

          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Ausentes</p>
              <h3 className="text-2xl font-black text-red-500 mt-1">{stats.absents}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-400">
              <XCircle className="w-5 h-5" />
            </div>
          </Card>

          <Card className="bg-white border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-brand-orange uppercase tracking-wider">Frequência da Aula</p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-2xl font-black text-brand-orange">{stats.rate}%</h3>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-brand-orange h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.rate}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-brand-orange shrink-0 ml-2">
              <Percent className="w-5 h-5" />
            </div>
          </Card>
        </div>
      )}

      {/* Student List Sheet & Quick Action buttons */}
      {selectedTurmaId && (
        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden p-0">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar estudante..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 outline-none text-xs font-semibold"
              />
            </div>

            <div className="flex gap-2 shrink-0">
              <Button 
                variant="secondary" 
                onClick={() => handleMarkAll(true)}
                className="rounded-xl text-[10px] font-bold py-1.5 px-3 uppercase bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
              >
                Presente Todos
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleMarkAll(false)}
                className="rounded-xl text-[10px] font-bold py-1.5 px-3 uppercase bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
              >
                Ausente Todos
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[450px]">
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
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[9px] font-black text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Número / Nome</th>
                    <th className="px-6 py-3 text-center w-40">Status de Presença</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, idx) => {
                    const isPresent = attendanceMap[student.id] ?? true;
                    return (
                      <tr 
                        key={student.id} 
                        className={`transition-colors hover:bg-slate-50/50 cursor-pointer ${isPresent ? '' : 'bg-red-50/10'}`}
                        onClick={() => handleToggleAttendance(student.id)}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 w-5">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="font-bold text-slate-800 uppercase tracking-tight">
                              {student.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <div className="inline-flex items-center">
                            <button
                              onClick={() => handleToggleAttendance(student.id)}
                              className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none
                                ${isPresent ? 'bg-emerald-500' : 'bg-red-500'}`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                  ${isPresent ? 'translate-x-6' : 'translate-x-0'}`}
                              />
                            </button>
                            <span className={`text-[10px] font-black uppercase tracking-wider ml-2.5 w-12 text-left
                              ${isPresent ? 'text-emerald-600' : 'text-red-500'}`}
                            >
                              {isPresent ? 'Pres' : 'Falt'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <Button 
              onClick={handleSaveSheet}
              disabled={isLoadingStudents || students.length === 0}
              className="rounded-xl text-xs font-black py-2.5 bg-brand-orange hover:bg-orange-600 shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Salvar Chamada
            </Button>
          </div>
        </Card>
      )}

      {/* Saved Sheets History */}
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-black text-slate-800 uppercase tracking-wider">Histórico de Chamadas Registradas</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Histórico de pautas de frequências salvas no sistema</p>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Data / Escola</th>
                  <th className="px-6 py-4">Turma / Componente</th>
                  <th className="px-6 py-4 text-center">Frequência</th>
                  <th className="px-6 py-4 text-center">Presentes / Total</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                      Nenhum registro de frequência salvo no histórico.
                    </td>
                  </tr>
                ) : (
                  sheets.map(sheet => (
                    <tr key={sheet.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-800">
                          {new Date(sheet.data + 'T12:00:00').toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight truncate max-w-[200px]">
                          {sheet.escolaNome}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-slate-700">{sheet.turmaNome}</div>
                        <div className="text-[10px] text-brand-orange font-bold uppercase mt-0.5">
                          {sheet.componente}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-block font-black px-2.5 py-0.5 rounded-full text-[10px]
                          ${sheet.rate >= 90 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : sheet.rate >= 75 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-red-50 text-red-500'}`}
                        >
                          {sheet.rate}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center font-semibold text-slate-600">
                        {sheet.presentesCount} / {sheet.totalCount}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDeleteSheet(sheet.id)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                            title="Excluir Registro"
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
