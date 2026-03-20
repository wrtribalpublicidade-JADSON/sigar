import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Edit, Users, Calendar, AlertTriangle, Search, Info, Lock } from 'lucide-react';
import { ccEstudanteService } from '../../services/gestaoConselhoService';
import { supabase } from '../../services/supabase';

interface CadastroEstudanteModalProps {
    isOpen: boolean;
    onClose: () => void;
    context: {
        schoolName: string;
        schoolId: string;
        responsibleName: string;
        contextName: string; // Field of Experience or Component
        groupName: string;   // Age Group or Turma/Ano
        classId: string;
    };
    escolas: any[];
    onOpenTurmaModal: () => void;
    onSuccess: () => void;
}

export const CadastroEstudanteModal: React.FC<CadastroEstudanteModalProps> = ({
    isOpen,
    onClose,
    context,
    escolas,
    onOpenTurmaModal,
    onSuccess
}) => {
    // Form state
    const [id, setId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('');
    const [status, setStatus] = useState('active');
    const [observations, setObservations] = useState('');
    
    // Interactive context state
    const [selectedSchoolId, setSelectedSchoolId] = useState(context.schoolId);
    const [selectedResponsible, setSelectedResponsible] = useState(context.responsibleName);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

    // UI state
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen && context.classId) {
            loadStudents();
        }
    }, [isOpen, context.classId]);

    useEffect(() => {
        if (isOpen && selectedSchoolId) {
            loadTeachers();
        }
    }, [isOpen, selectedSchoolId]);

    const loadTeachers = async () => {
        setIsLoadingTeachers(true);
        try {
            // Fetching from ccRecursosHumanosService if available or direct query
            const { data, error } = await supabase
                .from('recursos_humanos')
                .select('nome')
                .eq('escola_id', selectedSchoolId)
                .order('nome');
            
            if (error) throw error;
            setTeachers(data || []);
        } catch (err) {
            console.error('Error loading teachers:', err);
        } finally {
            setIsLoadingTeachers(false);
        }
    };

    const loadStudents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await ccEstudanteService.getByTurma(context.classId);
            setStudents(data || []);
        } catch (err: any) {
            console.error('Error loading students:', err);
            setError('Erro ao carregar estudantes.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('O nome é obrigatório.');
            return;
        }

        if (!selectedSchoolId) {
            setError('Selecione uma Unidade Escolar.');
            setIsSaving(false);
            return;
        }

        if (!context.classId) {
            setError('Uma turma/grupo deve estar selecionada.');
            setIsSaving(false);
            return;
        }

        setIsSaving(true);
        setError(null);

        const payload = {
            name: name.trim().toUpperCase(),
            birth_date: birthDate || null,
            gender: gender || null,
            status,
            observations: observations.trim() || null,
            stage: context.groupName.split('-')[0].trim(), 
            class_id: context.classId,
            escola_id: selectedSchoolId,
            professor_responsavel: selectedResponsible
        };

        try {
            if (id) {
                await ccEstudanteService.update(id, payload);
            } else {
                await ccEstudanteService.add(payload);
            }
            
            resetForm();
            loadStudents();
            onSuccess(); // Refresh main screen
        } catch (err: any) {
            console.error('Error saving student:', err);
            setError('Erro ao salvar estudante.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (student: any) => {
        setId(student.id);
        setName(student.name);
        setBirthDate(student.birth_date || '');
        setGender(student.gender || '');
        setStatus(student.status || 'active');
        setObservations(student.observations || '');
        setError(null);
    };

    const handleDelete = async (studentId: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este estudante? Esta ação não pode ser desfeita.')) return;

        try {
            await ccEstudanteService.remove(studentId);
            loadStudents();
            onSuccess();
        } catch (err: any) {
            console.error('Error deleting student:', err);
            setError('Erro ao remover estudante.');
        }
    };

    const resetForm = () => {
        setId(null);
        setName('');
        setBirthDate('');
        setGender('');
        setStatus('active');
        setObservations('');
        setError(null);
    };

    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-blue-100 text-blue-600',
            'bg-emerald-100 text-emerald-600',
            'bg-purple-100 text-purple-600',
            'bg-orange-100 text-orange-600',
            'bg-rose-100 text-rose-600',
            'bg-cyan-100 text-cyan-600'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[2.5rem] w-full max-w-5xl h-[95vh] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-scale-up">
                {/* Header */}
                <div className="bg-[#1a1f26] p-8 text-white relative flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                            <Users className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight uppercase">Cadastro de Estudantes</h2>
                            <p className="text-slate-400 text-sm font-medium">Gestão integrada e contextualizada no Conselho de Classe</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all group"
                    >
                        <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-slate-50/30">
                    {/* Interactive Context Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="cursor-pointer group relative">
                            <ContextCard 
                                icon={<div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-[10px] text-blue-600 font-bold">UE</div>} 
                                label="Unidade Escolar" 
                                value={escolas.find(e => e.id === selectedSchoolId)?.nome || context.schoolName} 
                                isInteractive={true}
                            />
                            <select 
                                value={selectedSchoolId}
                                onChange={(e) => setSelectedSchoolId(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                            >
                                {escolas.map(e => (
                                    <option key={e.id} value={e.id}>{e.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div className="cursor-pointer group relative">
                            <ContextCard 
                                icon={<div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-[10px] text-emerald-600 font-bold"><Users className="w-4 h-4" /></div>} 
                                label="Professor Responsável" 
                                value={selectedResponsible} 
                                isInteractive={true}
                            />
                            <select 
                                value={selectedResponsible}
                                onChange={(e) => setSelectedResponsible(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                disabled={isLoadingTeachers}
                            >
                                <option value="">Selecione um professor...</option>
                                {teachers.map((t, idx) => (
                                    <option key={idx} value={t.nome}>{t.nome}</option>
                                ))}
                            </select>
                            {isLoadingTeachers && (
                                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        <div 
                            className="cursor-pointer group"
                            onClick={onOpenTurmaModal}
                        >
                            <ContextCard 
                                icon={<div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-[10px] text-orange-600 font-bold">TR</div>} 
                                label="Turma/Grupo" 
                                value={context.groupName} 
                                isInteractive={true}
                            />
                        </div>
                    </div>

                    {/* Form Section - Full Width and Top */}
                    <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm relative overflow-hidden group/form">
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500 opacity-0 group-hover/form:opacity-100 transition-opacity"></div>
                        <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-8 flex items-center gap-3">
                            <Edit className="w-5 h-5" />
                            {id ? 'Editar Estudante' : 'Novo Estudante'}
                        </h3>

                        <form onSubmit={handleSave} className="space-y-8">
                            {error && (
                                <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-100 flex gap-3 text-sm font-bold animate-shake">
                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-3 ml-1">Nome Completo *</label>
                                <input
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nome completo do estudante..."
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-base font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                    <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-3 ml-1">Nascimento</label>
                                    <div className="relative">
                                        <Calendar className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={birthDate}
                                            onChange={(e) => setBirthDate(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-base font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-3 ml-1">Sexo</label>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-base font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Feminino</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-3 ml-1">Status</label>
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 h-[60px]">
                                        <button
                                            type="button"
                                            onClick={() => setStatus('active')}
                                            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center ${status === 'active' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            ATIVO
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStatus('inactive')}
                                            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center ${status === 'inactive' ? 'bg-slate-300 text-slate-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            INATIVO
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-3 ml-1">Observações</label>
                                <textarea
                                    rows={3}
                                    value={observations}
                                    onChange={(e) => setObservations(e.target.value)}
                                    placeholder="Alguma observação relevante..."
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-base font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none placeholder:text-slate-300"
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-10 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase hover:bg-slate-300 transition-all tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-3 tracking-widest"
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Check className="w-5 h-5" />
                                    )}
                                    {id ? 'Atualizar Estudante' : 'Salvar Estudante'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* List Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                <Users className="w-5 h-5 text-emerald-600" />
                                Estudantes Cadastrados
                            </h3>
                            <div className="relative w-80">
                                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Pesquisar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3 text-sm font-bold text-slate-600 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all w-full shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm border-t-4 border-t-slate-50">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Estudante</th>
                                        <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Nascimento</th>
                                        <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-24 text-center">
                                                <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-6"></div>
                                                <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">Carregando estudantes...</p>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-24 text-center text-slate-400">
                                                <Users className="w-16 h-16 mx-auto mb-6 opacity-5" />
                                                <p className="text-sm font-black uppercase tracking-widest">Nenhum estudante encontrado</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr 
                                                key={student.id} 
                                                className={`transition-all group ${id === student.id ? 'bg-emerald-50 hover:bg-emerald-50/80 shadow-inner' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${getAvatarColor(student.name)}`}>
                                                            {getInitials(student.name)}
                                                        </div>
                                                        <div>
                                                            <div className={`font-black text-sm uppercase ${id === student.id ? 'text-emerald-900' : 'text-slate-700'}`}>{student.name}</div>
                                                            {student.observations && (
                                                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-bold">
                                                                    <Info className="w-3 h-3" />
                                                                    {student.observations.substring(0, 50)}{student.observations.length > 50 ? '...' : ''}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center text-xs font-bold text-slate-500">
                                                    {student.birth_date ? new Date(student.birth_date).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${student.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {student.status === 'active' ? 'ATIVO' : 'INATIVO'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button
                                                            onClick={() => handleEdit(student)}
                                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border shadow-sm ${id === student.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-blue-500 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600'}`}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(student.id)}
                                                            className="w-9 h-9 rounded-xl bg-white text-rose-500 border border-rose-100 flex items-center justify-center hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-6 px-10 border-t border-slate-100 flex justify-between items-center shrink-0">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        ESTUDANTES NESSE CONTEXTO: <span className="text-slate-800 ml-1">{students.length}</span>
                    </p>

                </div>
            </div>
        </div>
    );
};

const ContextCard = ({ icon, label, value, isInteractive }: { icon: React.ReactNode, label: string, value: string, isInteractive?: boolean }) => (
    <div className={`bg-white border border-slate-100 rounded-[2rem] p-6 flex items-center gap-5 transition-all duration-300 shadow-sm border-b-4 border-b-slate-50 relative group ${isInteractive ? 'hover:shadow-xl hover:-translate-y-1 hover:border-emerald-500/30' : ''}`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${isInteractive ? 'bg-emerald-50 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-slate-50 border border-slate-100'}`}>
            {icon}
        </div>
        <div className="overflow-hidden flex-1">
            <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1.5 group-hover:text-emerald-600 transition-colors">{label}</span>
            <span className="block text-base font-black text-slate-800 uppercase truncate group-hover:text-slate-900 transition-colors">{value || '-'}</span>
        </div>
        {isInteractive && (
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                <Edit className="w-4 h-4 text-emerald-600" />
            </div>
        )}
        <div className="absolute right-6 top-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Lock className="w-4 h-4 text-slate-400" />
        </div>
    </div>
);
