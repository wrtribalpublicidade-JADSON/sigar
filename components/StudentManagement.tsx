import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { 
  Users, Search, Plus, Edit2, Trash2, 
  GraduationCap, X, RefreshCw, UserPlus, Upload
} from 'lucide-react';
import { CadastroEstudanteModal } from './modals/CadastroEstudanteModal';
import { CadastroTurmaModal, TurmaData } from './modals/CadastroTurmaModal';
import { ImportEstudantesModal } from './modals/ImportEstudantesModal';
import { Aluno, Escola } from '../types';
import { supabase } from '../services/supabase';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useNotification } from '../context/NotificationContext';

interface StudentManagementProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ escolas, isDemoMode, isAdmin }) => {
  const { showNotification } = useNotification();
  const [students, setStudents] = useState<Aluno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false);
  const [isTurmaModalOpen, setIsTurmaModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Aluno | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [turmas, setTurmas] = useState<TurmaData[]>([]);

  const handleOpenModal = (student?: Aluno) => {
    setSelectedStudent(student || null);
    setIsCadastroModalOpen(true);
  };
  const loadStudents = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setStudents([
          { id: 1, name: 'Estudante Exemplo A', stage: '1º Ano', status: 'Ativo', escola_id: escolas[0]?.id || '1' },
          { id: 2, name: 'Estudante Exemplo B', stage: '5º Ano', status: 'Ativo', escola_id: escolas[1]?.id || '2' }
        ] as Aluno[]);
        return;
      }

      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
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
      const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .order('name');
      if (error) throw error;
      
      const formattedTurmas: TurmaData[] = (data || []).map(t => ({
        id: t.id,
        etapa: t.stage || (t.level === 'Infantil' ? 'Educação Infantil' : 'Anos Iniciais'),
        anoSerie: t.year || t.name,
        identificacao: t.name,
        turno: t.shift || 'MANHÃ',
        tipo: t.modality || 'REGULAR'
      }));
      setTurmas(formattedTurmas);
    } catch (error) {
      console.error('Error loading turmas:', error);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const nameMatch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const cpfMatch = s.cpf?.includes(searchTerm);
      const matchSearch = searchTerm === '' || nameMatch || cpfMatch;
      const matchSchool = schoolFilter === 'ALL' || s.escola_id === schoolFilter;
      const matchStage = stageFilter === 'ALL' || s.stage === stageFilter;
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchSearch && matchSchool && matchStage && matchStatus;
    });
  }, [students, searchTerm, schoolFilter, stageFilter, statusFilter]);

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
        school_id: schoolFilter !== 'ALL' ? schoolFilter : (escolas[0]?.id || '')
      };

      if (turmaData.id) {
        const { error } = await supabase.from('turmas').update(payload).eq('id', turmaData.id);
        if (error) throw error;
        showNotification('success', 'Turma atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('turmas').insert([payload]);
        if (error) throw error;
        showNotification('success', 'Nova turma cadastrada com sucesso!');
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
      const { error } = await supabase.from('turmas').delete().eq('id', id);
      if (error) throw error;
      showNotification('success', 'Turma removida.');
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
      const { error } = await supabase.from('alunos').delete().eq('id', id);
      if (error) throw error;
      showNotification('success', 'Estudante removido com sucesso.');
      loadStudents();
    } catch (error) {
        console.error(error);
        showNotification('error', 'Erro ao excluir registro.');
    }
  };

  const stages = [
    'Creche II', 'Creche III', 'Pré I', 'Pré II',
    '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano',
    '6º Ano', '7º Ano', '8º Ano', '9º Ano', 'EJA'
  ];

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
                    <option value="ALL">Todas as Etapas</option>
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
                            <th className="px-6 py-4">Série / Etapa</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center text-slate-400">
                                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 opacity-20 text-orange-500" />
                                    <p className="font-bold text-sm tracking-wide">Sincronizando base de dados...</p>
                                </td>
                            </tr>
                        ) : filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center text-slate-400">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                    <p className="font-semibold">Nenhum registro encontrado para os filtros atuais.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredStudents.map(student => (
                                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                                                {student.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm uppercase">{student.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">
                                                    CPF: {student.cpf || '---'} • MAT: {student.registration_number || '---'}
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
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                                            {student.stage}
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
        </Card>

        <CadastroEstudanteModal 
            isOpen={isCadastroModalOpen}
            onClose={() => setIsCadastroModalOpen(false)}
            onSuccess={loadStudents}
            escolas={escolas}
            hideList={true}
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
    </div>
  );
};
