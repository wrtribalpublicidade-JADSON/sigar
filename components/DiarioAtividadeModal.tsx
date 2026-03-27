import React, { useState } from 'react';
import { 
    X, Users, Calendar, BookOpen, CheckCircle2, XCircle, 
    Plus, Search, UserPlus, Filter, ClipboardList, TrendingUp
} from 'lucide-react';
import { activitiesService, Atividade, AtividadeLog, AtividadePresenca } from '../services/activitiesService';
import { supabase } from '../services/supabase';

interface Student {
    id: number;
    nome: string;
    turma: string;
    escola: string;
    anoSerie: string;
    etapa: string;
    status: 'Ativo' | 'Inativo';
}

export const DiarioAtividadeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    atividade: Atividade | null;
}> = ({ isOpen, onClose, atividade }) => {
    const [activeTab, setActiveTab] = useState<'chamada' | 'alunos' | 'conteudo'>('chamada');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<Record<number, boolean>>({});
    const [students, setStudents] = useState<Student[]>([]);
    const [studentFrequency, setStudentFrequency] = useState<Record<number, number>>({});
    const [logs, setLogs] = useState<AtividadeLog[]>([]);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newLog, setNewLog] = useState('');

    const loadData = async () => {
        if (!atividade?.id) return;
        setIsLoading(true);
        try {
            const [enrolled, historyLogs, stats] = await Promise.all([
                activitiesService.getEnrolledStudents(atividade.id),
                activitiesService.getLogs(atividade.id),
                activitiesService.getAttendanceStats(atividade.id)
            ]);
            const enrolledStudents = enrolled as Student[];
            setStudents(enrolledStudents);
            setLogs(historyLogs);
            setStudentFrequency(stats);
            
            // Trigger loadAttendance with the loaded students to apply defaults
            await loadAttendance(enrolledStudents);
        } catch (err) {
            console.error('Error loading diary data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAttendance = async (enrolledList?: Student[]) => {
        if (!atividade?.id || !selectedDate) return;
        try {
            const data = await activitiesService.getAttendance(atividade.id, selectedDate);
            // Default all enrolled students to present, then override with saved records
            const attMap: Record<number, boolean> = {};
            (enrolledList || students).forEach(s => { attMap[s.id] = true; });
            data.forEach(a => { attMap[a.aluno_id] = a.presente; });
            setAttendance(attMap);
        } catch (err) {
            console.error('Error loading attendance:', err);
        }
    };

    const loadAllStudents = async () => {
        setIsLoadingStudents(true);
        try {
            // Fetch students, classes and schools separately to be 100% sure we get data
            const queryAlunos = supabase.from('alunos').select('id, name, class_id, status, stage, escola_id').order('name', { ascending: true });
            const queryTurmas = supabase.from('turmas').select('*');

            if (atividade?.escola_id) {
                queryAlunos.eq('escola_id', atividade.escola_id);
            }

            const [alunosRes, turmasRes, escolasRes] = await Promise.all([
                queryAlunos,
                queryTurmas,
                supabase.from('escolas').select('id, nome')
            ]);

            if (alunosRes.error) throw alunosRes.error;

            const turmasMap = new Map((turmasRes.data || []).map(t => [t.id, t]));
            const escolasMap = new Map((escolasRes.data || []).map(e => [e.id, e]));

            const mapped = (alunosRes.data || []).map((a: any) => {
                const t = turmasMap.get(a.class_id);
                const e = escolasMap.get(a.escola_id);

                return {
                    id: a.id,
                    nome: a.name || 'Sem nome',
                    turma: t?.name || '-',
                    escola: e?.nome || '-',
                    anoSerie: t ? `${t.year || '-'} - ${t.name || '-'}` : '-',
                    etapa: a.stage || '-',
                    status: a.status === 'active' ? 'Ativo' : 'Inativo' as any
                };
            });
            setAllStudents(mapped);
        } catch (err) {
            console.error('Error loading all students:', err);
        } finally {
            setIsLoadingStudents(false);
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            loadData();
            loadAttendance();
        }
    }, [isOpen, atividade?.id]);

    React.useEffect(() => {
        loadAttendance();
    }, [selectedDate]);

    // Load all students from DB when picker opens
    React.useEffect(() => {
        if (isAddingStudent && allStudents.length === 0) {
            loadAllStudents();
        }
        if (!isAddingStudent) {
            setStudentSearch('');
        }
    }, [isAddingStudent]);

    const handleAttendance = async (studentId: number, presente: boolean) => {
        try {
            const newAttendance = { ...attendance, [studentId]: presente };
            setAttendance(newAttendance);
            
            // Prepare all records for this date
            const records = students.map(s => ({
                aluno_id: s.id,
                presente: newAttendance[s.id] ?? false
            }));
            
            if (!atividade?.id) return;
            await activitiesService.saveAttendance(atividade.id, selectedDate, records);
        } catch (err) {
            console.error('Error saving attendance:', err);
            alert('Erro ao salvar presença.');
        }
    };

    const handleAddStudent = async (student: Student) => {
        if (students.find(s => s.id === student.id)) {
            alert('Este aluno já está vinculado a esta atividade.');
            return;
        }
        if (!atividade?.id) return; // Added optional chaining check
        try {
            await activitiesService.enrollStudent(atividade?.id, student.id);
            setStudents(prev => [...prev, student]);
            setIsAddingStudent(false);
            setStudentSearch('');
        } catch (err) {
            console.error('Error enrolling student:', err);
            alert('Erro ao vincular aluno.');
        }
    };

    const handleRemoveStudent = async (studentId: number, nome: string) => {
        if (confirm(`Remover "${nome}" desta atividade?`)) {
            if (!atividade?.id) return; // Added optional chaining check
            try {
                await activitiesService.unenrollStudent(atividade?.id, studentId);
                setStudents(prev => prev.filter(s => s.id !== studentId));
            } catch (err) {
                console.error('Error unenrolling student:', err);
                alert('Erro ao remover aluno.');
            }
        }
    };

    const handleAddLog = async () => {
        if (!newLog.trim()) return;
        if (!atividade?.id) return; // Added optional chaining check
        try {
            const logPaylod = {
                atividade_id: atividade.id,
                data: selectedDate,
                conteudo: newLog,
                instrutor: atividade.instrutor || 'Instrutor'
            };
            const saved = await activitiesService.saveLog(logPaylod);
            setLogs([saved, ...logs]);
            setNewLog('');
        } catch (err) {
            console.error('Error saving log:', err);
            alert('Erro ao salvar registro.');
        }
    };

    // Students to show in picker: all from DB filtered by search
    const pickerStudents = allStudents.filter(s => {
        if (!studentSearch) return true;
        const q = studentSearch.toLowerCase();
        return s.nome.toLowerCase().includes(q) ||
               (s.turma || '').toLowerCase().includes(q) ||
               (s.escola || '').toLowerCase().includes(q) ||
               (s.anoSerie || '').toLowerCase().includes(q);
    });
    const isEnrolled = (id: number) => !!students.find(s => s.id === id);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-50 w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20 relative">
                
                {/* Student Picker Overlay */}
                {isAddingStudent && (
                    <div className="absolute inset-0 z-[120] bg-white/80 backdrop-blur-md flex items-center justify-center p-10 animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Vincular Aluno</h3>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Selecione um aluno da rede</p>
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
                                {isLoadingStudents ? (
                                    <div className="py-10 text-center text-slate-400 font-bold">Carregando alunos...</div>
                                ) : pickerStudents.length > 0 ? (
                                    pickerStudents.map(s => {
                                        const enrolled = isEnrolled(s.id);
                                        return (
                                            <button 
                                                key={s.id}
                                                onClick={() => !enrolled && handleAddStudent(s)}
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

                {/* Header Section */}
                <div className="bg-white px-10 py-8 border-b border-slate-100 relative">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-6">
                            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                                <ClipboardList size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{atividade?.nome}</h2>
                                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{atividade?.categoria}</span>
                                </div>
                                <div className="flex items-center gap-4 text-slate-500 font-bold text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <Users size={16} className="text-indigo-400" />
                                        <span>{atividade?.instrutor}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={16} className="text-indigo-400" />
                                        <span>{atividade?.sala}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp size={16} className="text-emerald-400" />
                                        <span className="text-emerald-600">{students.length}/{atividade?.vagas} Inscritos</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-slate-50 rounded-2xl transition-all">
                            <X size={28} />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 mt-8">
                        {[
                            { id: 'chamada', label: 'Chamada Diária', icon: CheckCircle2 },
                            { id: 'alunos', label: 'Gestão de Alunos', icon: Users },
                            { id: 'conteudo', label: 'Conteúdo Pedagógico', icon: BookOpen },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-black transition-all border-2 ${
                                    activeTab === tab.id 
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                    : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
                    
                    {/* Tab: Chamada */}
                    {activeTab === 'chamada' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <div className="mb-2">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${atividade?.status === 'Ativa' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {atividade?.status || 'Planejada'}
                                </span>
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{atividade?.nome || 'Atividade'}</h2>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data da Aula</p>
                                        <input 
                                            type="date" 
                                            value={selectedDate}
                                            onChange={e => setSelectedDate(e.target.value)}
                                            className="font-black text-slate-800 bg-transparent border-none p-0 outline-none focus:ring-0 text-lg"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-center px-6 border-r border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Presentes</p>
                                        <p className="text-2xl font-black text-emerald-600">
                                            {Object.values(attendance).filter(v => v === true).length}
                                        </p>
                                    </div>
                                    <div className="text-center px-6">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faltas</p>
                                        <p className="text-2xl font-black text-rose-600">
                                            {students.length - Object.values(attendance).filter(v => v === true).length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50/50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudante</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Turma/Ano</th>
                                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Presença</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {students.map(student => {
                                            if (!student) return null;
                                            return (
                                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-sm italic">
                                                                {student.nome?.charAt(0) || '?'}
                                                            </div>
                                                            <span className="font-bold text-slate-800">{student.nome || 'Sem nome'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{student.escola}</span>
                                                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit">{student.anoSerie} • {student.etapa}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex justify-center gap-3">
                                                            <button 
                                                                onClick={() => handleAttendance(student.id, true)}
                                                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${attendance[student.id] === true ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100'}`}
                                                            >
                                                                <CheckCircle2 size={24} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleAttendance(student.id, false)}
                                                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${attendance[student.id] === false ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-slate-100'}`}
                                                            >
                                                                <XCircle size={24} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab: Alunos */}
                    {activeTab === 'alunos' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar aluno na oficina..." 
                                        className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={() => setIsAddingStudent(true)}
                                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                                >
                                    <UserPlus size={18} /> Vincular Aluno
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {students.map(student => (
                                    <div key={student.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group relative">
                                        <button 
                                            onClick={() => handleRemoveStudent(student.id, student.nome)}
                                            className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <XCircle size={20} />
                                        </button>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl italic uppercase tracking-tighter">
                                                {student.nome?.split(' ').map(n=>n[0]).join('').substring(0,2) || '?'}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 text-lg tracking-tight leading-tight">{student.nome || 'Sem nome'}</h4>
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{student.escola}</p>
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">{student.anoSerie} • {student.etapa}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Frequência Real</span>
                                            <span className={`${(studentFrequency[student.id] || 0) < 75 ? 'text-rose-600' : 'text-emerald-600'} font-black text-xs`}>
                                                {studentFrequency[student.id] || 0}% freq.
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab: Conteúdo */}
                    {activeTab === 'conteudo' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* New Log Input */}
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 p-8 space-y-4">
                                <div className="flex items-center gap-2 text-slate-800">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <BookOpen size={18} />
                                    </div>
                                    <h4 className="font-black text-sm uppercase tracking-wider">Novo Registro de Conteúdo</h4>
                                </div>
                                <textarea 
                                    rows={4}
                                    placeholder="Descreva o que foi desenvolvido na aula de hoje..."
                                    value={newLog}
                                    onChange={e => setNewLog(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-[1.5rem] px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all transition-all outline-none resize-none"
                                />
                                <div className="flex justify-end">
                                    <button 
                                        onClick={handleAddLog}
                                        className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                                    >
                                        Postar Registro
                                    </button>
                                </div>
                            </div>

                            {/* Logs History */}
                            <div className="space-y-6">
                                <h5 className="font-black text-xs text-slate-400 uppercase tracking-widest ml-1">Histórico de Aulas</h5>
                                {logs.map(log => (
                                    <div key={log.id} className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                                                    <Calendar size={16} />
                                                </div>
                                                <span className="font-black text-slate-800 text-sm">{new Date(log.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full">{log.instrutor}</span>
                                        </div>
                                        <p className="text-slate-600 font-medium leading-relaxed">{log.conteudo}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="bg-white border-t border-slate-100 px-10 py-6 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Diário Gerencial - Sistema Integrado de Gestão</p>
                    <button 
                        onClick={onClose}
                        className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Fechar Painel
                    </button>
                </div>
            </div>
        </div>
    );
};
