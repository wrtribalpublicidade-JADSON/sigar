import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  ClipboardCheck, Calendar, School as SchoolIcon, Search, Save, CheckCircle, 
  XCircle, Percent, Users, Loader2, ListFilter, Trash2
} from 'lucide-react';
import { Escola, Coordenador, Segmento } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from '../context/NotificationContext';

interface FrequenciaInfantilProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
  subHeader?: React.ReactNode;
}

interface StudentAttendance {
  id: string | number;
  name: string;
  present: boolean;
}

interface AttendanceSheetInfantil {
  id: string;
  data: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  anoSerie: string;
  periodo: string;
  presentesCount: number;
  totalCount: number;
  rate: number; // Percentage
  students: StudentAttendance[];
  criadoEm: string;
}

const PERIODOS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

export const FrequenciaInfantil: React.FC<FrequenciaInfantilProps> = ({ 
  escolas, 
  isDemoMode, 
  isAdmin, 
  userEmail, 
  currentUser, 
  subHeader 
}) => {
  const { showNotification } = useNotification();
  const [sheets, setSheets] = useState<AttendanceSheetInfantil[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string | number, boolean>>({});

  // Filter & Context State
  const [dataFreq, setDataFreq] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEscolaId, setSelectedEscolaId] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [periodo, setPeriodo] = useState('1º Bimestre');
  const [anoSerie, setAnoSerie] = useState('Creche III');

  // Search & Loading States
  const [studentSearch, setStudentSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter schools to only those offering Educação Infantil
  const escolasInfantil = useMemo(() => {
    return escolas.filter(e => 
      e.segmentos && e.segmentos.includes(Segmento.INFANTIL)
    );
  }, [escolas]);

  // Get active school context
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
          .eq('stage', 'Educação Infantil'); // Only ECE classes

        if (error) throw error;
        setTurmas(data || []);
        if (data && data.length > 0) {
          setSelectedTurmaId(data[0].id);
          setAnoSerie(data[0].anoSerie || 'Creche III');
        } else {
          setSelectedTurmaId('');
        }
      } catch (err) {
        console.error('Erro ao buscar turmas ECE:', err);
      }
    };

    fetchTurmas();
  }, [currentSchoolId]);

  // Sync grade when selected class changes
  useEffect(() => {
    const t = turmas.find(x => x.id === selectedTurmaId);
    if (t) {
      setAnoSerie(t.anoSerie || 'Creche III');
    }
  }, [selectedTurmaId, turmas]);

  // Load attendance sheets on mount or school change
  useEffect(() => {
    const loadSheets = async () => {
      try {
        if (!isDemoMode) {
          const { data, error } = await supabase
            .from('frequencia_sheets_infantil')
            .select('*')
            .eq('ativo', true)
            .order('data', { ascending: false });

          if (error) throw error;

          const formatted: AttendanceSheetInfantil[] = (data || []).map(d => ({
            id: d.id,
            data: d.data,
            escolaId: d.escola_id,
            escolaNome: escolas.find(e => e.id === d.escola_id)?.nome || 'Unidade',
            turmaId: d.turma_id,
            turmaNome: d.ano_serie, // Placeholder or fetch
            anoSerie: d.ano_serie,
            periodo: d.periodo,
            presentesCount: d.presentes_count || 0,
            totalCount: d.total_count || 0,
            rate: d.rate,
            students: d.students || [],
            criadoEm: d.created_at
          }));
          setSheets(formatted);
        } else {
          const saved = localStorage.getItem('sigar_frequencia_sheets_infantil');
          if (saved) {
            setSheets(JSON.parse(saved));
          }
        }
      } catch (err) {
        console.error('Erro ao buscar folhas de frequência:', err);
      }
    };

    loadSheets();
  }, [isDemoMode, escolas]);

  // Fetch students for active ECE class
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedTurmaId) {
        setStudents([]);
        setAttendanceMap({});
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('alunos')
          .select('id, name')
          .eq('class_id', selectedTurmaId)
          .eq('status', 'active')
          .order('name', { ascending: true });

        if (error) throw error;
        setStudents(data || []);

        // Try to check if sheet already exists for this date and ECE class
        const existing = sheets.find(s => 
          s.data === dataFreq && 
          s.turmaId === selectedTurmaId
        );

        if (existing) {
          // Load existing attendance map
          const map: Record<string | number, boolean> = {};
          existing.students.forEach(s => {
            map[s.id] = s.present;
          });
          setAttendanceMap(map);
          setPeriodo(existing.periodo);
          showNotification('success', 'Presenças salvas carregadas para a data selecionada.');
        } else {
          // Default all present
          const map: Record<string | number, boolean> = {};
          (data || []).forEach(s => {
            map[s.id] = true;
          });
          setAttendanceMap(map);
        }

      } catch (err) {
        console.error('Erro ao carregar alunos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedTurmaId, dataFreq, sheets]);

  // Toggle single presence
  const toggleAttendance = (id: string | number) => {
    setAttendanceMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle all presence/absence
  const toggleAll = (present: boolean) => {
    const updated = { ...attendanceMap };
    students.forEach(s => {
      updated[s.id] = present;
    });
    setAttendanceMap(updated);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) return { total: 0, present: 0, absent: 0, rate: 0 };
    
    let present = 0;
    students.forEach(s => {
      if (attendanceMap[s.id]) present++;
    });
    const absent = total - present;
    const rate = Math.round((present / total) * 100);
    return { total, present, absent, rate };
  }, [students, attendanceMap]);

  // Handle Save
  const handleSave = async () => {
    if (!selectedEscolaId || !selectedTurmaId) {
      showNotification('error', 'Selecione a Escola e a Turma.');
      return;
    }

    if (students.length === 0) {
      showNotification('error', 'Não há alunos matriculados nesta turma.');
      return;
    }

    setSaving(true);
    const escolaNome = escolas.find(e => e.id === selectedEscolaId)?.nome || 'Unidade';
    const turmaObj = turmas.find(t => t.id === selectedTurmaId);
    const turmaNome = turmaObj ? `${turmaObj.name || turmaObj.anoSerie} • ${turmaObj.turno || ''}` : 'Turma';

    const listStudents: StudentAttendance[] = students.map(s => ({
      id: s.id,
      name: s.name,
      present: !!attendanceMap[s.id]
    }));

    const sheetId = crypto.randomUUID();
    const payload: AttendanceSheetInfantil = {
      id: sheetId,
      data: dataFreq,
      escolaId: selectedEscolaId,
      escolaNome,
      turmaId: selectedTurmaId,
      turmaNome,
      anoSerie,
      periodo,
      presentesCount: stats.present,
      totalCount: stats.total,
      rate: stats.rate,
      students: listStudents,
      criadoEm: new Date().toISOString()
    };

    // Check if sheet already exists to overwrite/update
    const existingIndex = sheets.findIndex(s => 
      s.data === dataFreq && 
      s.turmaId === selectedTurmaId
    );

    try {
      if (!isDemoMode) {
        const dbPayload = {
          id: existingIndex > -1 ? sheets[existingIndex].id : payload.id,
          data: payload.data,
          escola_id: payload.escolaId,
          turma_id: payload.turmaId,
          ano_serie: payload.anoSerie,
          periodo: payload.periodo,
          presentes_count: payload.presentesCount,
          total_count: payload.totalCount,
          rate: payload.rate,
          students: payload.students,
          updated_at: new Date().toISOString(),
          updated_by: userEmail || currentUser?.contato || 'user'
        };

        const { error } = await supabase
          .from('frequencia_sheets_infantil')
          .upsert(dbPayload);

        if (error) throw error;
      }

      let updatedSheets: AttendanceSheetInfantil[];
      if (existingIndex > -1) {
        updatedSheets = [...sheets];
        updatedSheets[existingIndex] = { ...payload, id: sheets[existingIndex].id };
        showNotification('success', 'Chamada ECE atualizada com sucesso!');
      } else {
        updatedSheets = [payload, ...sheets];
        showNotification('success', 'Chamada ECE registrada com sucesso!');
      }

      setSheets(updatedSheets);
      if (isDemoMode) {
        localStorage.setItem('sigar_frequencia_sheets_infantil', JSON.stringify(updatedSheets));
      }
    } catch (err) {
      console.error('Erro ao salvar chamada ECE:', err);
      showNotification('error', 'Erro ao salvar a chamada.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSheet = async (id: string) => {
    if (!confirm('Deseja realmente remover esta folha de frequência?')) return;
    
    try {
      if (!isDemoMode) {
        const { error } = await supabase
          .from('frequencia_sheets_infantil')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
      }

      const updated = sheets.filter(s => s.id !== id);
      setSheets(updated);
      if (isDemoMode) {
        localStorage.setItem('sigar_frequencia_sheets_infantil', JSON.stringify(updated));
      }
      showNotification('success', 'Registro de frequência excluído.');
    } catch (err) {
      console.error('Erro ao excluir chamada:', err);
      showNotification('error', 'Falha ao deletar do banco.');
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(studentSearch.toLowerCase())
    );
  }, [students, studentSearch]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative text-left">
      <PageHeader 
        title="Frequência - Educação Infantil"
        subtitle="Registro de chamada diária, controle de frequência e taxa de assiduidade escolar"
        icon={ClipboardCheck}
        badgeText="DIÁRIO DE CLASSE"
        actions={[]}
      />

      {subHeader}

      {/* FILTERS & CONFIGURATION */}
      <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <ListFilter className="text-brand-orange w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight text-left">Filtros de Turma e Chamada</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data da Chamada *</label>
            <div className="relative">
              <input 
                type="date"
                value={dataFreq}
                onChange={e => setDataFreq(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 shadow-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unidade Escolar *</label>
            <select
              value={selectedEscolaId}
              onChange={e => setSelectedEscolaId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 appearance-none shadow-sm"
            >
              <option value="">Selecione a Unidade Escolar</option>
              {escolasInfantil.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turma ECE *</label>
            <select
              value={selectedTurmaId}
              onChange={e => setSelectedTurmaId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 appearance-none shadow-sm"
            >
              <option value="">Selecione a Turma</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.name || t.anoSerie} • {t.turno}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Período Letivo *</label>
            <select
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 appearance-none shadow-sm"
            >
              {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* ATTENDANCE INTERACTION BLOCK */}
      {selectedTurmaId ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Attendance Checklist */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                  <input 
                    type="text"
                    placeholder="Filtrar aluno pelo nome..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-700 placeholder-slate-400 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => toggleAll(true)}
                    variant="secondary"
                    size="sm"
                    className="text-xs flex items-center gap-1.5 font-bold"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Todos Presentes
                  </Button>
                  <Button
                    onClick={() => toggleAll(false)}
                    variant="secondary"
                    size="sm"
                    className="text-xs flex items-center gap-1.5 font-bold"
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-500" /> Todos Ausentes
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
                  <p className="text-xs text-slate-400">Buscando lista de alunos...</p>
                </div>
              ) : filteredStudents.length > 0 ? (
                <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto pr-2">
                  {filteredStudents.map((student, index) => {
                    const isPresent = !!attendanceMap[student.id];
                    return (
                      <div 
                        key={student.id}
                        className="py-3 flex items-center justify-between hover:bg-slate-50/50 rounded-lg px-2 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-300 w-5">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="text-sm font-bold text-slate-700 uppercase">
                            {student.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleAttendance(student.id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all border ${
                              isPresent
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm'
                                : 'bg-red-50 border-red-200 text-red-600 shadow-sm'
                            }`}
                          >
                            {isPresent ? 'PRESENTE' : 'AUSENTE'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 italic text-xs">
                  Nenhum aluno encontrado para os critérios selecionados.
                </div>
              )}

              {students.length > 0 && (
                <div className="border-t border-slate-100 pt-4 mt-6 flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    variant="primary"
                    className="flex items-center gap-2 font-bold"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Frequência Diária
                  </Button>
                </div>
              )}

            </Card>
          </div>

          {/* Quick Stats & History */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Class Stats */}
            <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">Estatísticas do Dia</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Presenças</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1">{stats.present}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Faltas</span>
                  <span className="text-2xl font-black text-red-500 mt-1">{stats.absent}</span>
                </div>
                <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Assiduidade</span>
                    <span className="text-2xl font-black text-brand-orange block mt-0.5">{stats.rate}%</span>
                  </div>
                  <Percent className="w-8 h-8 text-orange-200" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-blue-50/50 border border-blue-100 p-2.5 rounded-xl text-left">
                <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>Total de matriculados na turma: {stats.total} alunos.</span>
              </div>
            </Card>

            {/* Attendance History list */}
            <Card className="bg-white border-slate-200 shadow-sm p-6 rounded-2xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">Histórico de Chamadas</h3>
              
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {sheets.filter(s => s.turmaId === selectedTurmaId).length > 0 ? (
                  sheets.filter(s => s.turmaId === selectedTurmaId).map(sheet => (
                    <div key={sheet.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-left">
                      <div>
                        <span className="text-xs font-black text-slate-700">
                          {new Date(sheet.data).toLocaleDateString('pt-BR')}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-bold">
                          <span>Rate: {sheet.rate}%</span>
                          <span>•</span>
                          <span>Presenças: {sheet.presentesCount}/{sheet.totalCount}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteSheet(sheet.id)}
                        className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 border border-transparent hover:border-slate-200 transition-all"
                        title="Deletar Chamada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-400 italic text-[10px]">Sem histórico para esta turma.</p>
                )}
              </div>
            </Card>

          </div>

        </div>
      ) : (
        <Card className="bg-white border-slate-200 shadow-sm p-16 rounded-2xl text-center flex flex-col items-center justify-center">
          <SchoolIcon className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-base font-bold text-slate-700">Seleção Requerida</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Selecione uma Escola e Turma do segmento de Educação Infantil nos filtros acima para carregar a lista de chamada.
          </p>
        </Card>
      )}

    </div>
  );
};
