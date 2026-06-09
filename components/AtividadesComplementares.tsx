import React, { useState } from 'react';
import { 
    BookOpen, Trophy, Music, Palette, Code, Users, 
    Calendar, Search, Plus, Filter, ChevronRight, 
    Clock, MapPin, Star, Pencil, Trash2, Heart, Brain, Leaf,
    UserPlus, X, CheckCircle2, Printer
} from 'lucide-react';
import { AtividadeModal } from './AtividadeModal';
import { DiarioAtividadeModal } from './DiarioAtividadeModal';
import { activitiesService, Atividade } from '../services/activitiesService';
import { supabase } from '../services/supabase';
import { turmaCompService, TurmaComp } from '../services/turmaCompService';
import { PrintableTurmaCompReport } from './PrintableTurmaCompReport';

interface Student {
    id: number;
    nome: string;
    turma: string;
    escola: string;
    anoSerie: string;
    etapa: string;
    status: 'Ativo' | 'Inativo';
}

export const normalizeCategoria = (cat: string): string => {
    if (!cat) return '1. Cultura, Artes e Educação Patrimonial';
    const c = cat.trim().toLowerCase();
    if (c === 'esportes') return '2. Esporte e Lazer';
    if (c === 'artes' || c === 'musica') return '1. Cultura, Artes e Educação Patrimonial';
    if (c === 'reforco') return '3. Acompanhamento pedagógico';
    if (c === 'tecnologia') return '14. Comunicação, uso de mídias e cultura Digital e Tecnológica';
    return cat;
};

const CATEGORIAS = [
    { id: '1. Cultura, Artes e Educação Patrimonial', name: 'Cultura e Artes', icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50' },
    { id: '2. Esporte e Lazer', name: 'Esporte e Lazer', icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: '3. Acompanhamento pedagógico', name: 'Acompanhamento Pedagógico', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: '7. Promoção da Saúde', name: 'Promoção da Saúde', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: '10. Iniciação Cientifica', name: 'Iniciação Científica', icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: '13. Educação Ambiental e Desenvolvimento Sustentável', name: 'Educação Ambiental', icon: Leaf, color: 'text-teal-500', bg: 'bg-teal-50' },
    { id: '14. Comunicação, uso de mídias e cultura Digital e Tecnológica', name: 'Tecnologia e Mídia', icon: Code, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: '15. Educação para Valorização do Multiculturalismo nas Matrizes Históricas e Culturais Brasileiras', name: 'Multiculturalismo', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
];

interface AtividadesComplementaresProps {
    userEscolaIds?: string[];
    escolaName?: string;
}

export const AtividadesComplementares: React.FC<AtividadesComplementaresProps> = ({ userEscolaIds, escolaName }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCat, setSelectedCat] = useState('todas');
    const [atividades, setAtividades] = useState<Atividade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAtividade, setEditingAtividade] = useState<Atividade | null>(null);
    const [isDiarioOpen, setIsDiarioOpen] = useState(false);
    const [activityForDiario, setActivityForDiario] = useState<Atividade | null>(null);

    // Formacao de Turmas (Turmas Complementares) states
    const [activeTab, setActiveTab] = useState<'cadastro' | 'formacao'>('cadastro');
    const [turmasComp, setTurmasComp] = useState<TurmaComp[]>([]);
    const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
    const [turmaDetails, setTurmaDetails] = useState<{ students: Student[], activitiesIds: string[] }>({ students: [], activitiesIds: [] });
    const [isLoadingTurmaDetails, setIsLoadingTurmaDetails] = useState(false);
    const [isPrintingTurma, setIsPrintingTurma] = useState(false);

    // Modals
    const [isTurmaModalOpen, setIsTurmaModalOpen] = useState(false);
    const [newTurmaNome, setNewTurmaNome] = useState('');
    const [selectedSchoolIdForNewTurma, setSelectedSchoolIdForNewTurma] = useState<string>('');
    const [editingTurma, setEditingTurma] = useState<TurmaComp | null>(null);
    const [escolasComplementares, setEscolasComplementares] = useState<{ id: string; nome: string }[]>([]);
    const [isManageActivitiesOpen, setIsManageActivitiesOpen] = useState(false);
    const [selectedActivitiesForTurma, setSelectedActivitiesForTurma] = useState<string[]>([]);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [isLoadingAllStudents, setIsLoadingAllStudents] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [searchTurmaTerm, setSearchTurmaTerm] = useState('');
    const [turmaStudentSearch, setTurmaStudentSearch] = useState('');

    const selectedTurma = turmasComp.find(t => t.id === selectedTurmaId) || null;

    const handleSelectTurma = async (id: string) => {
        setSelectedTurmaId(id);
        setIsLoadingTurmaDetails(true);
        try {
            const details = await turmaCompService.getTurmaDetails(id);
            setTurmaDetails(details);
            setSelectedActivitiesForTurma(details.activitiesIds);
        } catch (err) {
            console.error('Error loading class details:', err);
        } finally {
            setIsLoadingTurmaDetails(false);
        }
    };

    const loadAllStudents = async () => {
        if (!selectedTurma) return;
        setIsLoadingAllStudents(true);
        try {
            const queryAlunos = supabase.from('alunos').select('id, name, class_id, status, stage, escola_id').order('name', { ascending: true });
            const queryTurmas = supabase.from('turmas').select('*');

            if (selectedTurma.escola_id) {
                queryAlunos.eq('escola_id', selectedTurma.escola_id);
            } else if (userEscolaIds && userEscolaIds.length > 0) {
                queryAlunos.in('escola_id', userEscolaIds);
            }

            const [alunosRes, turmasRes, escolasRes] = await Promise.all([
                queryAlunos,
                queryTurmas,
                supabase.from('escolas').select('id, nome')
            ]);

            if (alunosRes.error) throw alunosRes.error;

            const turmasMap = new Map((turmasRes.data || []).map(t => [t.id, t]));
            const escolasMap = new Map((escolasRes.data || []).map(e => [e.id, e]));

            const mapped: Student[] = (alunosRes.data || []).map((a: any) => {
                const t = turmasMap.get(a.class_id);
                const e = escolasMap.get(a.escola_id);

                return {
                    id: a.id,
                    nome: a.name || 'Sem nome',
                    turma: t?.name || '-',
                    escola: e?.nome || '-',
                    anoSerie: t ? `${t.year || '-'} - ${t.name || '-'}` : '-',
                    etapa: a.stage || '-',
                    status: a.status === 'active' ? 'Ativo' : 'Inativo'
                };
            });
            setAllStudents(mapped);
        } catch (err) {
            console.error('Error loading all students:', err);
        } finally {
            setIsLoadingAllStudents(false);
        }
    };

    const fetchEscolasComplementares = async () => {
        try {
            let query = supabase
                .from('escolas')
                .select('id, nome')
                .eq('oferta_atividade_complementar', true);
            
            if (userEscolaIds && userEscolaIds.length > 0) {
                query = query.in('id', userEscolaIds);
            }
            
            const { data, error } = await query.order('nome');
            if (error) throw error;
            if (data) {
                setEscolasComplementares(data);
            }
        } catch (err) {
            console.error('Error fetching schools:', err);
        }
    };

    const openNewTurmaModal = () => {
        setNewTurmaNome('');
        setEditingTurma(null);
        if (escolasComplementares.length === 1) {
            setSelectedSchoolIdForNewTurma(escolasComplementares[0].id);
        } else if (userEscolaIds && userEscolaIds.length === 1) {
            setSelectedSchoolIdForNewTurma(userEscolaIds[0]);
        } else {
            setSelectedSchoolIdForNewTurma('');
        }
        setIsTurmaModalOpen(true);
    };

    const openEditTurmaModal = (turma: TurmaComp) => {
        setNewTurmaNome(turma.nome);
        setEditingTurma(turma);
        setSelectedSchoolIdForNewTurma(turma.escola_id);
        setIsTurmaModalOpen(true);
    };

    const handleSaveTurma = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTurmaNome.trim()) return;
        if (!selectedSchoolIdForNewTurma) {
            alert('Por favor, selecione uma unidade escolar.');
            return;
        }

        try {
            if (editingTurma) {
                const updated = await turmaCompService.updateTurma(editingTurma.id, newTurmaNome.trim(), selectedSchoolIdForNewTurma);
                await fetchTurmasComp();
                setNewTurmaNome('');
                setSelectedSchoolIdForNewTurma('');
                setEditingTurma(null);
                setIsTurmaModalOpen(false);
                handleSelectTurma(updated.id);
            } else {
                const newTurma = await turmaCompService.createTurma(newTurmaNome.trim(), selectedSchoolIdForNewTurma);
                await fetchTurmasComp();
                setNewTurmaNome('');
                setSelectedSchoolIdForNewTurma('');
                setIsTurmaModalOpen(false);
                handleSelectTurma(newTurma.id);
            }
        } catch (err) {
            console.error('Error saving class:', err);
            alert('Erro ao salvar turma.');
        }
    };

    const handleDeleteTurma = async (id: string, nome: string) => {
        if (confirm(`Tem certeza que deseja excluir a turma "${nome}"? Os estudantes serão desvinculados de suas atividades correspondentes.`)) {
            try {
                await turmaCompService.deleteTurma(id);
                if (selectedTurmaId === id) {
                    setSelectedTurmaId(null);
                    setTurmaDetails({ students: [], activitiesIds: [] });
                }
                await fetchTurmasComp();
                fetchAtividades();
            } catch (err) {
                console.error('Error deleting class:', err);
                alert('Erro ao excluir turma.');
            }
        }
    };

    const handleSaveActivitiesForTurma = async () => {
        if (!selectedTurmaId) return;
        if (selectedActivitiesForTurma.length > 5) {
            alert('Uma turma pode ser vinculada a no máximo 5 atividades.');
            return;
        }
        try {
            await turmaCompService.linkActivitiesToTurma(selectedTurmaId, selectedActivitiesForTurma);
            setIsManageActivitiesOpen(false);
            await handleSelectTurma(selectedTurmaId);
            fetchTurmasComp();
            fetchAtividades();
        } catch (err) {
            console.error('Error linking activities to class:', err);
            alert('Erro ao salvar vínculo de atividades.');
        }
    };

    const handleAddStudentToTurma = async (student: Student) => {
        if (!selectedTurmaId) return;
        if (turmaDetails.students.some(s => s.id === student.id)) {
            alert('Este estudante já está vinculado a esta turma.');
            return;
        }
        try {
            await turmaCompService.addStudentToTurma(selectedTurmaId, student.id);
            await handleSelectTurma(selectedTurmaId);
            fetchTurmasComp();
            fetchAtividades();
        } catch (err) {
            console.error('Error adding student to class:', err);
            alert('Erro ao vincular estudante.');
        }
    };

    const handleRemoveStudentFromTurma = async (studentId: number, nome: string) => {
        if (!selectedTurmaId) return;
        if (confirm(`Remover o estudante "${nome}" desta turma?`)) {
            try {
                await turmaCompService.removeStudentFromTurma(selectedTurmaId, studentId);
                await handleSelectTurma(selectedTurmaId);
                fetchTurmasComp();
                fetchAtividades();
            } catch (err) {
                console.error('Error removing student from class:', err);
                alert('Erro ao desvincular estudante.');
            }
        }
    };

    const fetchTurmasComp = async () => {
        try {
            const data = await turmaCompService.getTurmas(userEscolaIds);
            setTurmasComp(data);
        } catch (err) {
            console.error('Error fetching complementary classes:', err);
        }
    };

    React.useEffect(() => {
        if (isAddingStudent) {
            loadAllStudents();
        } else {
            setStudentSearch('');
        }
    }, [isAddingStudent, selectedTurmaId]);

    React.useEffect(() => {
        if (activeTab === 'formacao' && !selectedTurmaId && turmasComp.length > 0) {
            handleSelectTurma(turmasComp[0].id);
        }
    }, [activeTab, turmasComp, selectedTurmaId]);

    const fetchAtividades = async () => {
        setIsLoading(true);
        try {
            const data = await activitiesService.getAtividades(userEscolaIds);
            setAtividades(data);
        } catch (err) {
            console.error('Error fetching activities:', err);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAtividades();
        fetchTurmasComp();
        fetchEscolasComplementares();
    }, [userEscolaIds]);

    const handleSaveAtividade = async (newAtv: Omit<Atividade, 'id' | 'inscritos'>) => {
        try {
            if (editingAtividade) {
                await activitiesService.saveAtividade({ ...newAtv, id: editingAtividade.id });
            } else {
                await activitiesService.saveAtividade(newAtv);
            }
            fetchAtividades();
            setEditingAtividade(null);
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error saving activity:', err);
            alert('Erro ao salvar atividade. Tente novamente.');
        }
    };

    const handleDeleteAtividade = async (id: string, nome: string) => {
        if (confirm(`Tem certeza que deseja excluir a atividade "${nome}"?`)) {
            try {
                await activitiesService.deleteAtividade(id);
                fetchAtividades();
            } catch (err) {
                console.error('Error deleting activity:', err);
                alert('Erro ao excluir atividade.');
            }
        }
    };

    const openEditModal = (atv: Atividade) => {
        setEditingAtividade(atv);
        setIsModalOpen(true);
    };

    const openNewModal = () => {
        setEditingAtividade(null);
        setIsModalOpen(true);
    };

    const openDiario = (atv: Atividade) => {
        setActivityForDiario(atv);
        setIsDiarioOpen(true);
    };

    const filteredAtividades = atividades.filter(atv => {
        if (!atv) return false;
        const search = searchTerm.toLowerCase();
        const matchesSearch = (atv.nome?.toLowerCase()?.includes(search) || 
                               atv.instrutor?.toLowerCase()?.includes(search) || false);
        const normalizedCat = normalizeCategoria(atv.categoria);
        const matchesCat = selectedCat === 'todas' || normalizedCat === selectedCat;
        return matchesSearch && matchesCat;
    });

    // Dynamic Stats Calculation
    const totalInscritos = atividades.reduce((sum: number, atv: Atividade) => sum + (atv?.inscritos || 0), 0);
    const totalOficinasAtivas = atividades.filter(a => a?.status === 'Ativa').length;
    
    // Filter turmas complementares for list
    const filteredTurmasComp = turmasComp.filter(t => {
        if (!t) return false;
        const q = searchTurmaTerm.toLowerCase();
        return t.nome.toLowerCase().includes(q);
    });

    // Filter students in selected turma
    const filteredTurmaStudents = turmaDetails.students.filter(s => {
        if (!turmaStudentSearch) return true;
        const q = turmaStudentSearch.toLowerCase();
        return s.nome.toLowerCase().includes(q) ||
               (s.turma || '').toLowerCase().includes(q) ||
               (s.anoSerie || '').toLowerCase().includes(q);
    });

    const linkedActivities = selectedActivitiesForTurma
        .map(aid => atividades.find(a => a.id === aid))
        .filter(Boolean) as Atividade[];

    // Student picker overlay list filtering
    const pickerStudents = allStudents.filter(s => {
        if (!studentSearch) return true;
        const q = studentSearch.toLowerCase();
        return s.nome.toLowerCase().includes(q) ||
               (s.turma || '').toLowerCase().includes(q) ||
               (s.escola || '').toLowerCase().includes(q) ||
               (s.anoSerie || '').toLowerCase().includes(q);
    });

    const isStudentEnrolledInTurma = (id: number) => turmaDetails.students.some(s => s.id === id);

    return (
        <div className="space-y-8 animate-fade-in pb-10 relative">
            {/* Student Picker Modal Overlay for Formacao de Turmas */}
            {isAddingStudent && (
                <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Vincular Estudante</h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Selecione um aluno da unidade escolar</p>
                            </div>
                            <button 
                                onClick={() => setIsAddingStudent(false)}
                                className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 pb-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Buscar por nome ou turma..." 
                                    value={studentSearch}
                                    onChange={e => setStudentSearch(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-black focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-3">
                            {isLoadingAllStudents ? (
                                <div className="py-10 text-center text-slate-400 font-bold">Carregando alunos...</div>
                            ) : pickerStudents.length > 0 ? (
                                pickerStudents.map(s => {
                                    const enrolled = isStudentEnrolledInTurma(s.id);
                                    return (
                                        <button 
                                            key={s.id}
                                            onClick={() => !enrolled && handleAddStudentToTurma(s)}
                                            disabled={enrolled}
                                            className={`w-full flex items-center justify-between p-4 border rounded-2xl transition-all group ${
                                                enrolled
                                                    ? 'bg-emerald-50 border-emerald-200 cursor-default'
                                                    : 'bg-white border-slate-50 hover:border-indigo-100 hover:bg-slate-50 cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className={`w-12 h-12 rounded-xl shadow-sm flex items-center justify-center font-black transition-all ${
                                                    enrolled ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'
                                                }`}>
                                                    {s.nome?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className={`font-black text-sm tracking-tight ${
                                                        enrolled ? 'text-emerald-700' : 'text-slate-800'
                                                    }`}>{s.nome || 'Sem nome'}</p>
                                                    <div className="flex gap-2 items-center flex-wrap">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.escola}</span>
                                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{s.anoSerie} • {s.etapa}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`p-2 rounded-lg transition-all ${
                                                enrolled
                                                    ? 'bg-emerald-100 text-emerald-600'
                                                    : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                            }`}>
                                                {enrolled ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="py-10 text-center text-slate-400 font-bold italic">
                                    Nenhum aluno encontrado.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Turma Creation Modal */}
            {isTurmaModalOpen && (
                <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <form onSubmit={handleSaveTurma} className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">{editingTurma ? 'Editar Turma' : 'Cadastrar Nova Turma'}</h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Atividades Complementares</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsTurmaModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nome da Turma</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Ex: Turma A - Oficinas da Tarde" 
                                    value={newTurmaNome}
                                    onChange={e => setNewTurmaNome(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Unidade Escolar</label>
                                <select 
                                    value={selectedSchoolIdForNewTurma}
                                    onChange={e => setSelectedSchoolIdForNewTurma(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none text-slate-700 cursor-pointer"
                                    required
                                >
                                    <option value="" disabled>Selecione a unidade escolar</option>
                                    {escolasComplementares.map(esc => (
                                        <option key={esc.id} value={esc.id}>{esc.nome}</option>
                                    ))}
                                    {escolasComplementares.length === 0 && (
                                        <option value="" disabled>Carregando unidades...</option>
                                    )}
                                </select>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-b-[2rem] flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => setIsTurmaModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-100 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all"
                            >
                                {editingTurma ? 'Salvar Alterações' : 'Cadastrar Turma'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Manage Activities Modal */}
            {isManageActivitiesOpen && selectedTurma && (
                <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Vincular Atividades</h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Turma: {selectedTurma.nome}</p>
                            </div>
                            <button 
                                onClick={() => setIsManageActivitiesOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="flex justify-between items-center bg-indigo-50/50 text-indigo-700 p-4 rounded-xl text-xs font-black uppercase tracking-wider mb-2">
                                <span>Atividades selecionadas</span>
                                <span className={selectedActivitiesForTurma.length > 5 ? 'text-rose-600 font-black text-sm animate-pulse' : ''}>
                                    {selectedActivitiesForTurma.length} / 5
                                </span>
                            </div>
                            
                            <div className="space-y-2">
                                {atividades.map(atv => {
                                    const isChecked = selectedActivitiesForTurma.includes(atv.id);
                                    const isDisabled = !isChecked && selectedActivitiesForTurma.length >= 5;
                                    return (
                                        <button
                                            key={atv.id}
                                            onClick={() => {
                                                if (isChecked) {
                                                    setSelectedActivitiesForTurma(prev => prev.filter(id => id !== atv.id));
                                                } else {
                                                    if (selectedActivitiesForTurma.length < 5) {
                                                        setSelectedActivitiesForTurma(prev => [...prev, atv.id]);
                                                    }
                                                }
                                            }}
                                            disabled={isDisabled}
                                            className={`w-full flex items-center justify-between p-4 border rounded-2xl text-left transition-all ${
                                                isChecked
                                                    ? 'bg-indigo-50/40 border-indigo-200 text-indigo-900 font-bold'
                                                    : isDisabled
                                                        ? 'bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed'
                                                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div>
                                                <h4 className="font-bold text-sm">{atv.nome}</h4>
                                                <p className="text-[10px] text-slate-400 font-medium">{atv.instrutor} • {atv.categoria}</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                                isChecked 
                                                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                                                    : 'border-slate-300'
                                            }`}>
                                                {isChecked && <CheckCircle2 size={12} />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-b-[2rem] flex justify-end gap-3">
                            <button 
                                onClick={() => setIsManageActivitiesOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-100 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveActivitiesForTurma}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all"
                            >
                                Salvar Vínculos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                            <BookOpen size={24} />
                        </div>
                        Atividades Complementares
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Gestão de oficinas, esportes e projetos extracurriculares</p>
                </div>
                {activeTab === 'cadastro' && (
                    <button 
                        onClick={openNewModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-95 self-start md:self-center"
                    >
                        <Plus size={20} /> Nova Atividade
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-200/60 pb-2">
                <button
                    onClick={() => setActiveTab('cadastro')}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black transition-all border-2 ${
                        activeTab === 'cadastro' 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                        : 'bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    <BookOpen size={18} />
                    Cadastro de Atividades
                </button>
                <button
                    onClick={() => setActiveTab('formacao')}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black transition-all border-2 ${
                        activeTab === 'formacao' 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                        : 'bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    <Users size={18} />
                    Formação de Turmas
                </button>
            </div>

            {/* Tab: Cadastro de Atividades */}
            {activeTab === 'cadastro' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alunos Inscritos</p>
                                <p className="text-2xl font-black text-slate-800">{totalInscritos}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                <Star size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Oficinas Ativas</p>
                                <p className="text-2xl font-black text-slate-800">{totalOficinasAtivas}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unidade Escolar</p>
                                <p className="text-xl font-black text-slate-800 truncate max-w-[200px]" title={escolaName || 'Múltiplas Unidades'}>
                                    {escolaName || (userEscolaIds && userEscolaIds.length > 0 ? 'Múltiplas Unidades' : 'Todas as Unidades')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl shadow-slate-200/20 p-4 sticky top-4 z-20">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por atividade ou instrutor..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                />
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                                <button 
                                    onClick={() => setSelectedCat('todas')}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedCat === 'todas' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
                                >
                                    Todas
                                </button>
                                {CATEGORIAS.map(cat => (
                                    <button 
                                        key={cat.id}
                                        onClick={() => setSelectedCat(cat.id)}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${selectedCat === cat.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
                                    >
                                        <cat.icon size={14} />
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredAtividades.map(atv => {
                            const normalizedCat = normalizeCategoria(atv.categoria);
                            const cat = CATEGORIAS.find(c => c.id === normalizedCat);
                            const percentInscritos = (atv.inscritos / atv.vagas) * 100;
                            
                            return (
                                <div key={atv.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden flex flex-col relative">
                                    {/* Actions overlay */}
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(atv);
                                            }}
                                            className="p-2 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-slate-100"
                                            title="Editar Atividade"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteAtividade(atv.id, atv.nome);
                                            }}
                                            className="p-2 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-slate-100"
                                            title="Excluir Atividade"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 rounded-2xl ${cat?.bg || 'bg-slate-50'} ${cat?.color || 'text-slate-600'}`}>
                                                    {cat && <cat.icon size={24} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Unidade Escolar</span>
                                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight truncate max-w-[150px]" title={atv.unidadeEscolar || 'Múltiplas Unidades'}>
                                                        {atv.unidadeEscolar || 'Múltiplas Unidades'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${atv.status === 'Ativa' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {atv.status}
                                            </span>
                                        </div>
                                        
                                        <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{atv.nome}</h3>
                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-4">
                                            <Users size={14} />
                                            <span>{atv.instrutor}</span>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Clock size={16} className="text-indigo-400" />
                                                <span className="text-xs font-bold">{atv.diasSemana?.join('/')} {atv.horarioInicio}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <MapPin size={16} className="text-indigo-400" />
                                                <span className="text-xs font-bold">{atv.sala}</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ocupação</span>
                                                <span className="text-sm font-black text-indigo-600">{atv.inscritos}/{atv.vagas}</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${percentInscritos > 90 ? 'bg-rose-500' : percentInscritos > 50 ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${percentInscritos}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => openDiario(atv)}
                                        className="mt-auto w-full py-4 bg-slate-50 group-hover:bg-indigo-600 transition-colors text-slate-400 group-hover:text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-t border-slate-100/50"
                                    >
                                        Visualizar Diário <ChevronRight size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {filteredAtividades.length === 0 && (
                        <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-slate-200 py-24 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Filter size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">Nenhuma atividade encontrada</h3>
                            <p className="text-slate-500 font-medium">Tente ajustar seus filtros de busca.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Formação de Turmas */}
            {activeTab === 'formacao' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
                    {/* Left Column: Classes Selector */}
                    <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                            <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Turmas Complementares</h3>
                            <button 
                                onClick={openNewTurmaModal}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-1.5 rounded-lg transition-all"
                                title="Cadastrar Nova Turma"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Filtrar turmas..." 
                                value={searchTurmaTerm}
                                onChange={e => setSearchTurmaTerm(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                            {filteredTurmasComp.map(t => {
                                const isSelected = selectedTurmaId === t.id;
                                return (
                                    <div 
                                        key={t.id}
                                        className={`group w-full rounded-2xl border transition-all flex flex-col p-4 gap-2 relative ${
                                            isSelected 
                                            ? 'bg-indigo-50/50 border-indigo-200' 
                                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                                        }`}
                                    >
                                        <button
                                            onClick={() => handleSelectTurma(t.id)}
                                            className="w-full text-left flex flex-col gap-1 pr-8"
                                        >
                                            <h4 className={`font-black text-sm uppercase tracking-tight truncate ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                {t.nome}
                                            </h4>
                                            <div className="flex justify-between items-center w-full text-[10px] text-slate-400 font-bold">
                                                <span>{t.alunos_count} alunos</span>
                                                <span className={isSelected ? 'text-indigo-600 font-black' : 'text-slate-500'}>
                                                    {t.atividades_count} atividades
                                                </span>
                                            </div>
                                        </button>
                                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditTurmaModal(t);
                                                }}
                                                className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Editar Turma"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTurma(t.id, t.nome);
                                                }}
                                                className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Excluir Turma"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredTurmasComp.length === 0 && (
                                <div className="py-8 text-center text-slate-400 text-xs italic font-bold">
                                    Nenhuma turma complementar cadastrada.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Selected Turma Details and Students List */}
                    <div className="lg:col-span-8 space-y-6">
                        {selectedTurma ? (
                            <>
                                {/* Selected Turma Banner */}
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                Turma Complementar
                                            </span>
                                            <span className="text-slate-400 font-bold text-xs">
                                                {turmaDetails.students.length} alunos
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                            {selectedTurma.nome}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Atividades ({selectedActivitiesForTurma.length}/5):</span>
                                            {selectedActivitiesForTurma.length > 0 ? (
                                                selectedActivitiesForTurma.map(aid => {
                                                    const atv = atividades.find(a => a.id === aid);
                                                    return (
                                                        <span key={aid} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">
                                                            {atv?.nome || 'Oficina'}
                                                        </span>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-slate-400 font-bold text-xs italic">Nenhuma atividade vinculada</span>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    setSelectedActivitiesForTurma(turmaDetails.activitiesIds);
                                                    setIsManageActivitiesOpen(true);
                                                }}
                                                className="text-xs text-indigo-600 hover:text-indigo-800 font-black ml-2 uppercase tracking-widest"
                                            >
                                                [ Gerenciar ]
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 items-center self-stretch md:self-auto">
                                        <button
                                            onClick={() => setIsPrintingTurma(true)}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 self-stretch sm:self-auto text-center justify-center"
                                            title="Imprimir Informações da Turma"
                                        >
                                            <Printer size={16} /> Imprimir
                                        </button>
                                        <button
                                            onClick={() => setIsAddingStudent(true)}
                                            className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 self-stretch sm:self-auto text-center justify-center animate-in fade-in"
                                        >
                                            <UserPlus size={16} /> Vincular Aluno
                                        </button>
                                    </div>
                                </div>

                                {/* Current Enrolled Students Card */}
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                                    <div className="flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center pb-4 border-b border-slate-50">
                                        <div>
                                            <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">Estudantes Matriculados</h4>
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">
                                                Total de {turmaDetails.students.length} alunos vinculados
                                            </p>
                                        </div>
                                        <div className="relative min-w-[240px]">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input 
                                                type="text" 
                                                placeholder="Buscar na turma..." 
                                                value={turmaStudentSearch}
                                                onChange={e => setTurmaStudentSearch(e.target.value)}
                                                className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    {linkedActivities.length > 0 && (
                                        <div className="flex items-center gap-3 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 flex-wrap">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                                                <Calendar size={14} className="text-indigo-500" />
                                                Visualizar Diário de Classe:
                                            </span>
                                            <div className="flex gap-2 flex-wrap">
                                                {linkedActivities.map(atv => (
                                                    <button
                                                        key={atv.id}
                                                        onClick={() => openDiario(atv)}
                                                        className="bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border border-indigo-100/60 hover:border-indigo-600 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                                                    >
                                                        <BookOpen size={12} />
                                                        {atv.nome}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {isLoadingTurmaDetails ? (
                                        <div className="py-12 text-center text-slate-400 font-bold">
                                            Carregando turma...
                                        </div>
                                    ) : filteredTurmaStudents.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <th className="pb-3 pl-2">Nome</th>
                                                        <th className="pb-3">Ano / Série</th>
                                                        <th className="pb-3">Unidade Escolar</th>
                                                        <th className="pb-3 text-right pr-2">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {filteredTurmaStudents.map(student => (
                                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="py-4 pl-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-sm italic uppercase">
                                                                        {student.nome?.charAt(0) || '?'}
                                                                    </div>
                                                                    <span className="font-bold text-slate-800 text-sm">{student.nome}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4">
                                                                <span className="bg-indigo-50/70 text-indigo-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                                                                    {student.anoSerie}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-xs font-bold text-slate-500">
                                                                {student.escola}
                                                            </td>
                                                            <td className="py-4 text-right pr-2">
                                                                <button
                                                                    onClick={() => handleRemoveStudentFromTurma(student.id, student.nome)}
                                                                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                                    title="Desvincular Estudante"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="py-16 text-center text-slate-400/80">
                                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                                                <Users size={24} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-500">Nenhum estudante matriculado</p>
                                            <p className="text-xs font-medium text-slate-400">Clique em "Vincular Aluno" para adicionar estudantes a esta turma.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-24 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <Users size={32} />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Formação de Turmas</h3>
                                <p className="text-slate-400 font-medium max-w-sm mx-auto mt-1 text-sm">
                                    Selecione ou cadastre uma turma na lista ao lado para gerenciar seus alunos e atividades complementares.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AtividadeModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveAtividade}
                atividadeToEdit={editingAtividade}
            />

            <DiarioAtividadeModal 
                isOpen={isDiarioOpen}
                onClose={() => setIsDiarioOpen(false)}
                atividade={activityForDiario}
            />

            {isPrintingTurma && selectedTurma && (
                <PrintableTurmaCompReport
                    turma={selectedTurma}
                    students={turmaDetails.students}
                    linkedActivities={linkedActivities}
                    escolaName={escolaName}
                    onClose={() => setIsPrintingTurma(false)}
                />
            )}
        </div>
    );
};
