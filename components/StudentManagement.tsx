import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PageHeader } from './ui/PageHeader';
import { 
  Users, Search, Plus, Edit2, Trash2, 
  GraduationCap, X, RefreshCw, UserPlus, Upload, Printer, FileText,
  ArrowRightLeft, Bell
} from 'lucide-react';
import { CadastroEstudanteModal, formatCPF, formatNIS } from './modals/CadastroEstudanteModal';
import { CadastroTurmaModal, TurmaData } from './modals/CadastroTurmaModal';
import { ImportEstudantesModal } from './modals/ImportEstudantesModal';
import { TransferenciaEstudanteModal } from './modals/TransferenciaEstudanteModal';
import { TransferenciasPendentesPopup, useTransferenciasPendentesCount } from './modals/TransferenciasPendentesPopup';
import { PrintableBoletimIndividualEstudante } from './PrintableBoletimIndividualEstudante';
import { PrintableDossieEstudante } from './PrintableDossieEstudante';
import { Aluno, Escola, Coordenador } from '../types';
import { supabase } from '../services/supabase';
import { logAudit } from '../services/logService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useNotification } from '../context/NotificationContext';

interface StudentManagementProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  currentUser?: Coordenador | null;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ escolas, isDemoMode, isAdmin, currentUser }) => {
  const { showNotification } = useNotification();
  const [students, setStudents] = useState<Aluno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, schoolFilter, stageFilter, statusFilter]);
  
  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false);
  const [isTurmaModalOpen, setIsTurmaModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Aluno | null>(null);
  const [selectedStudentForDossier, setSelectedStudentForDossier] = useState<Aluno | null>(null);
  const [printBoletimStudent, setPrintBoletimStudent] = useState<Aluno | null>(null);
  const [printDossierStudent, setPrintDossierStudent] = useState<Aluno | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [turmas, setTurmas] = useState<TurmaData[]>([]);

  // Transfer state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStudent, setTransferStudent] = useState<Aluno | null>(null);
  const [isPendentesPopupOpen, setIsPendentesPopupOpen] = useState(false);

  // IDs of schools the current user has access to (for pending transfer badge)
  const escolasIds = useMemo(() => escolas.map(e => String(e.id)), [escolas]);
  const { count: pendentesCount, refresh: refreshPendentes } = useTransferenciasPendentesCount(escolasIds);

  const handleOpenTransfer = (student: Aluno) => {
    setTransferStudent(student);
    setIsTransferModalOpen(true);
  };

  const handlePrintDossier = (student: Aluno) => {
    setPrintDossierStudent(student);
  };

  const handleOpenModal = (student?: Aluno) => {
    setSelectedStudent(student || null);
    setIsCadastroModalOpen(true);
  };
  const loadStudents = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        let mockStudents = [
          { id: 1, name: 'Estudante Exemplo A', stage: '1º Ano', status: 'Ativo', escola_id: escolas[0]?.id || '1', class_id: 'demo-t1' },
          { id: 2, name: 'Estudante Exemplo B', stage: '5º Ano', status: 'Ativo', escola_id: escolas[1]?.id || '2', class_id: 'demo-t3' }
        ] as Aluno[];
        if (currentUser && currentUser.funcao === 'Professor') {
          const assignedIds = currentUser.turmasIds || [];
          mockStudents = mockStudents.filter(s => s.class_id && assignedIds.includes(s.class_id));
        }
        setStudents(mockStudents);
        return;
      }

      // Supabase returns max 1000 rows per request by default.
      // We paginate to load all students.
      const PAGE_SIZE = 1000;
      let allStudents: any[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('alunos')
          .select('*')
          .order('name', { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (!isAdmin) {
          const validIds = escolas.map(e => e.id);
          if (validIds.length === 0) {
            setStudents([]);
            setIsLoading(false);
            return;
          }
          query = query.in('escola_id', validIds);
        }

        const { data, error } = await query;
        if (error) throw error;

        const batch = data || [];
        allStudents = allStudents.concat(batch);

        if (batch.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          from += PAGE_SIZE;
        }
      }

      let filteredStudents = allStudents;
      if (currentUser && currentUser.funcao === 'Professor') {
        const assignedIds = currentUser.turmasIds || [];
        filteredStudents = allStudents.filter(s => s.class_id && assignedIds.includes(s.class_id));
      }
      setStudents(filteredStudents);
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erro ao carregar estudantes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadTurmas();
  }, []);

  const loadTurmas = async () => {
    try {
      if (isDemoMode) {
        let demoTurmas: TurmaData[] = [
          { id: 'demo-t1', etapa: 'Anos Iniciais', anoSerie: '1º Ano', identificacao: 'Turma A', turno: 'MANHÃ', tipo: 'REGULAR', escolaId: escolas[0]?.id || '1' },
          { id: 'demo-t2', etapa: 'Anos Iniciais', anoSerie: '2º Ano', identificacao: 'Turma B', turno: 'TARDE', tipo: 'REGULAR', escolaId: escolas[0]?.id || '1' },
          { id: 'demo-t3', etapa: 'Anos Iniciais', anoSerie: '5º Ano', identificacao: 'Turma A', turno: 'MANHÃ', tipo: 'REGULAR', escolaId: escolas[0]?.id || '1' },
        ];
        if (currentUser && currentUser.funcao === 'Professor') {
          const assignedIds = currentUser.turmasIds || [];
          demoTurmas = demoTurmas.filter(t => t.id && assignedIds.includes(t.id));
        }
        setTurmas(demoTurmas);
        return;
      }

      let query = supabase
        .from('turmas')
        .select('*')
        .order('name');

      if (!isAdmin) {
        const validIds = escolas.map(e => e.id);
        if (validIds.length === 0) {
          setTurmas([]);
          return;
        }
        query = query.in('school_id', validIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let filteredData = data || [];
      if (currentUser && currentUser.funcao === 'Professor') {
        const assignedIds = currentUser.turmasIds || [];
        filteredData = filteredData.filter((t: any) => assignedIds.includes(t.id));
      }

      const formattedTurmas: TurmaData[] = filteredData.map((t: any) => ({
        id: t.id,
        etapa: t.stage || (t.level === 'Infantil' ? 'Educação Infantil' : 'Anos Iniciais'),
        anoSerie: t.year || t.name,
        identificacao: t.name,
        turno: t.shift || 'MANHÃ',
        tipo: t.modality || 'REGULAR',
        escolaId: t.school_id
      }));
      setTurmas(formattedTurmas);
    } catch (error) {
      console.error('Error loading turmas:', error);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Must be linked to a valid school within the user's scope
      const isValidSchool = escolas.some(e => String(e.id) === String(s.escola_id));
      if (!isValidSchool) return false;

      const nameMatch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const cpfMatch = s.cpf?.includes(searchTerm);
      const matchSearch = searchTerm === '' || nameMatch || cpfMatch;
      const matchSchool = schoolFilter === 'ALL' || String(s.escola_id) === String(schoolFilter);
      
      let matchStage = stageFilter === 'ALL' || s.stage === stageFilter;
      if (stageFilter !== 'ALL' && !matchStage && s.class_id) {
        const turma = turmas.find(t => String(t.id) === String(s.class_id));
        if (turma) {
          const turmaInfo = `${turma.anoSerie} - ${turma.identificacao}`;
          if (turma.anoSerie === stageFilter || turmaInfo === stageFilter) {
            matchStage = true;
          }
        }
      }

      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchSearch && matchSchool && matchStage && matchStatus;
    });
  }, [students, searchTerm, schoolFilter, stageFilter, statusFilter, escolas, turmas]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;

  const getStudentTurmaInfo = (classId?: string) => {
    if (!classId) return '---';
    const turma = turmas.find(t => String(t.id) === String(classId));
    if (!turma) return '---';
    return `${turma.anoSerie} - ${turma.identificacao}`;
  };

  const handleSave = async () => {
    // This is now handled inside CadastroEstudanteModal
    loadStudents();
  };

  const handleSaveTurma = async (turmaData: TurmaData) => {
    try {
      if (isDemoMode) {
        showNotification('success', 'Turma salva (Simulado).');
        setIsTurmaModalOpen(false);
        return;
      }

      const payload = {
        name: turmaData.identificacao,
        stage: turmaData.etapa,
        year: turmaData.anoSerie,
        shift: turmaData.turno,
        modality: turmaData.tipo,
        school_id: turmaData.escolaId || (schoolFilter !== 'ALL' ? schoolFilter : (escolas[0]?.id || ''))
      };

      if (turmaData.id) {
        const { error } = await supabase.from('turmas').update(payload).eq('id', turmaData.id);
        if (error) throw error;
        showNotification('success', 'Turma atualizada com sucesso!');
        await logAudit('UPDATE', 'TURMA', turmaData.id, payload);
      } else {
        const { data, error } = await supabase.from('turmas').insert([payload]).select();
        if (error) throw error;
        showNotification('success', 'Nova turma cadastrada com sucesso!');
        if (data && data[0]) {
          await logAudit('CREATE', 'TURMA', data[0].id, payload);
        }
      }

      setIsTurmaModalOpen(false);
      loadTurmas();
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erro ao salvar turma.');
    }
  };

  const handleDeleteTurma = async (id: string) => {
    if (!confirm('Deseja realmente remover esta turma?')) return;
    try {
      let name = 'desconhecida';
      try {
        const { data } = await supabase.from('turmas').select('name').eq('id', id).maybeSingle();
        if (data) name = data.name;
      } catch (e) {}

      const { error } = await supabase.from('turmas').delete().eq('id', id);
      if (error) throw error;
      showNotification('success', 'Turma removida.');
      await logAudit('DELETE', 'TURMA', id, { name });
      loadTurmas();
    } catch (error) {
      console.error(error);
      showNotification('error', 'Erro ao excluir turma.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente remover este registro?')) return;
    
    try {
      if (isDemoMode) {
        showNotification('success', 'Remoção simulada.');
        return;
      }
      let studentName = 'desconhecido';
      try {
        const { data } = await supabase.from('alunos').select('name').eq('id', id).maybeSingle();
        if (data) studentName = data.name;
      } catch (e) {}

      const { error } = await supabase.from('alunos').delete().eq('id', id);
      if (error) throw error;
      showNotification('success', 'Estudante removido com sucesso.');
      await logAudit('DELETE', 'ESTUDANTE', String(id), { name: studentName });
      loadStudents();
    } catch (error) {
        console.error(error);
        showNotification('error', 'Erro ao excluir registro.');
    }
  };

  const stages = useMemo(() => {
    const uniqueTurmas = new Set<string>();
    turmas.forEach(t => {
      if (t.anoSerie && t.identificacao) {
        uniqueTurmas.add(`${t.anoSerie} - ${t.identificacao}`);
      }
    });
    return Array.from(uniqueTurmas).sort();
  }, [turmas]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
        <PageHeader 
            title="Gestão de Estudantes"
            subtitle="Base de dados unificada de alunos da rede municipal"
            icon={GraduationCap}
            actions={[
                {
                    label: 'Importar Excel',
                    icon: Upload,
                    onClick: () => setIsImportModalOpen(true),
                    variant: 'secondary'
                },
                {
                    label: 'Cadastrar Aluno',
                    icon: UserPlus,
                    onClick: () => handleOpenModal(),
                    variant: 'primary'
                }
            ]}
        />

        {/* Pending Transfers Alert Banner */}
        {pendentesCount > 0 && (
          <div 
            onClick={() => setIsPendentesPopupOpen(true)}
            className="cursor-pointer group bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-300 animate-fade-in"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-bounce shadow-sm">
                  {pendentesCount}
                </span>
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">
                  {pendentesCount === 1 ? 'Existe 1 solicitação' : `Existem ${pendentesCount} solicitações`} de transferência pendente{pendentesCount > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Clique para visualizar e gerenciar as solicitações de vaga
                </p>
              </div>
            </div>
            <div className="px-4 py-2 bg-amber-100 rounded-xl text-[10px] font-black text-amber-700 uppercase tracking-wider group-hover:bg-amber-200 transition-colors">
              Ver Solicitações
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-orange-500" />
                <input 
                    type="text" 
                    placeholder="Buscar por nome ou CPF..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium text-slate-700"
                />
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-100 rounded-xl shrink-0">
                <Users className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-black text-orange-600 uppercase tracking-wider whitespace-nowrap">
                    {filteredStudents.length} {filteredStudents.length === 1 ? 'estudante' : 'estudantes'}
                </span>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select 
                    value={schoolFilter}
                    onChange={e => setSchoolFilter(e.target.value)}
                    className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-orange-500 focus:bg-white transition-all min-w-[180px]"
                >
                    <option value="ALL">Todas as Unidades</option>
                    {escolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>

                <select 
                    value={stageFilter}
                    onChange={e => setStageFilter(e.target.value)}
                    className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-orange-500 focus:bg-white transition-all"
                >
                    <option value="ALL">Todos os Anos / Séries</option>
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200 shadow-xl bg-white rounded-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Matrícula / Nome</th>
                            <th className="px-6 py-4">Unidade Escolar</th>
                            <th className="px-6 py-4">Ano / Série</th>
                            <th className="px-6 py-4 text-center">Etapa</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="py-20 text-center text-slate-400">
                                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 opacity-20 text-orange-500" />
                                    <p className="font-bold text-sm tracking-wide">Sincronizando base de dados...</p>
                                </td>
                            </tr>
                        ) : filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-20 text-center text-slate-400">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                    <p className="font-semibold">Nenhum registro encontrado para os filtros atuais.</p>
                                </td>
                            </tr>
                        ) : (
                            paginatedStudents.map(student => (
                                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                                                {student.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800 text-sm uppercase">{student.name}</span>
                                                    {student.possui_deficiencia === 'Sim' && (
                                                        <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded-md border border-purple-200 uppercase tracking-wider">
                                                            AEE / Especial
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight flex items-center gap-2 flex-wrap">
                                                    <span>CPF: {student.cpf ? formatCPF(student.cpf) : '---'}</span>
                                                    <span>•</span>
                                                    <span>MAT: {student.registration_number || '---'}</span>
                                                    {student.nis && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-brand-orange font-black">NIS: {formatNIS(student.nis)}</span>
                                                        </>
                                                    )}
                                                    {student.id_educacenso && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-blue-600 font-black">INEP: {student.id_educacenso}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-500 uppercase">
                                            {escolas.find(e => e.id === student.escola_id)?.nome || 'Pendente'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-600 uppercase">
                                            {getStudentTurmaInfo(student.class_id)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                                            {student.stage || student.ano_serie || '---'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase
                                            ${(student.status as string === 'Ativo' || student.status as string === 'active') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${(student.status as string === 'Ativo' || student.status as string === 'active') ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            {(student.status as string === 'Ativo' || student.status as string === 'active') ? 'Ativo' : student.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenTransfer(student)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all" title="Transferir Estudante">
                                                <ArrowRightLeft size={16} />
                                            </button>
                                            <button onClick={() => setPrintBoletimStudent(student)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all" title="Imprimir Boletim de Desempenho Escolar">
                                                <FileText size={16} />
                                            </button>
                                            <button onClick={() => handlePrintDossier(student)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Imprimir Dossiê do Estudante">
                                                <Printer size={16} />
                                            </button>
                                            <button onClick={() => handleOpenModal(student)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Editar">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(student.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-2">
                        <span>Exibir</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>por vez</span>
                    </div>
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <p>
                        Exibindo <span className="text-slate-800 font-bold">{filteredStudents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> a{' '}
                        <span className="text-slate-800 font-bold">{Math.min(currentPage * pageSize, filteredStudents.length)}</span> de{' '}
                        <span className="text-slate-800 font-bold">{filteredStudents.length}</span> estudantes
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={`px-4 py-2 rounded-xl text-xs font-black border border-slate-200 transition-all ${
                            currentPage === 1
                                ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                : 'bg-white text-slate-600 shadow-sm hover:border-orange-500 hover:text-orange-500 active:scale-95'
                        }`}
                    >
                        Anterior
                    </button>
                    <span className="text-xs font-bold text-slate-500 px-2 whitespace-nowrap">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={`px-4 py-2 rounded-xl text-xs font-black border border-slate-200 transition-all ${
                            currentPage >= totalPages
                                ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                : 'bg-white text-slate-600 shadow-sm hover:border-orange-500 hover:text-orange-500 active:scale-95'
                        }`}
                    >
                        Próximo
                    </button>
                </div>
            </div>
        </Card>

        <CadastroEstudanteModal 
            isOpen={isCadastroModalOpen}
            onClose={() => setIsCadastroModalOpen(false)}
            onSuccess={loadStudents}
            escolas={escolas}
            initialStudent={selectedStudent}
            onOpenTurmaModal={() => setIsTurmaModalOpen(true)}
            context={{
                schoolId: schoolFilter !== 'ALL' ? schoolFilter : '',
                schoolName: escolas.find(e => e.id === schoolFilter)?.nome || '',
                classId: '',
                groupName: '',
                responsibleName: '',
                contextName: 'Gestão de Estudantes'
            }}
        />

        <CadastroTurmaModal 
            isOpen={isTurmaModalOpen}
            onClose={() => setIsTurmaModalOpen(false)}
            onSave={handleSaveTurma}
            onDelete={handleDeleteTurma}
            turmasExistentes={turmas}
            escolas={escolas}
        />

        <ImportEstudantesModal 
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onSuccess={loadStudents}
            selectedSchoolId={schoolFilter !== 'ALL' ? schoolFilter : (escolas[0]?.id || '')}
            turmas={turmas}
            escolas={escolas}
            isDemoMode={isDemoMode}
        />

        <TransferenciaEstudanteModal
            isOpen={isTransferModalOpen}
            onClose={() => { setIsTransferModalOpen(false); setTransferStudent(null); }}
            student={transferStudent}
            escolas={escolas}
            escolaOrigemId={transferStudent?.escola_id || ''}
            onSuccess={() => { loadStudents(); refreshPendentes(); }}
            currentUserName={currentUser?.nome || ''}
            isDemoMode={isDemoMode}
        />

        <TransferenciasPendentesPopup
            isOpen={isPendentesPopupOpen}
            onClose={() => setIsPendentesPopupOpen(false)}
            escolas={escolas}
            escolasIds={escolasIds}
            onTransferApproved={() => { loadStudents(); refreshPendentes(); }}
            currentUserName={currentUser?.nome || ''}
        />

      {/* ====== PRINTABLE DOSSIÊ COMPONENT ====== */}
      {printDossierStudent && (
        <PrintableDossieEstudante
          student={printDossierStudent}
          escola={escolas.find(e => String(e.id) === String(printDossierStudent.escola_id)) || null}
          turmaInfo={getStudentTurmaInfo(printDossierStudent.class_id)}
          onClose={() => setPrintDossierStudent(null)}
        />
      )}

      {/* Printable Individual Boletim Component */}
      {printBoletimStudent && (
        <PrintableBoletimIndividualEstudante
          escola={escolas.find(e => e.id === printBoletimStudent.escola_id) || escolas[0]}
          student={printBoletimStudent}
          turmaInfo={getStudentTurmaInfo(printBoletimStudent.class_id)}
          onClose={() => setPrintBoletimStudent(null)}
        />
      )}
    </div>
  );
};
