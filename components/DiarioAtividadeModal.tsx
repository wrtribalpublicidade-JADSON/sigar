import React, { useState, useMemo } from 'react';
import { 
    X, Users, Calendar, BookOpen, CheckCircle2, XCircle, 
    Plus, Search, UserPlus, Filter, ClipboardList, TrendingUp,
    Pencil, Trash2, Printer, Bookmark, CheckCheck, RotateCcw, MapPin,
    Clock, AlertCircle, AlertTriangle, ShieldCheck, ChevronLeft, ChevronRight,
    CalendarCheck, MoreVertical, FileText, Check, Loader2
} from 'lucide-react';
import { activitiesService, Atividade, AtividadeLog, AtividadePresenca } from '../services/activitiesService';
import { supabase } from '../services/supabase';
import { PrintableAtividadePlanejamentoReport } from './PrintableAtividadePlanejamentoReport';
import { PrintableAtividadeFrequenciaMensalReport, StudentMonthlyRow } from './PrintableAtividadeFrequenciaMensalReport';
import { Coordenador } from '../types';

const MESES = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
];

const PERIODOS_LETIVOS = [
    '1º Bimestre',
    '2º Bimestre',
    '3º Bimestre',
    '4º Bimestre'
];

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
    currentUser?: Coordenador | null;
    userEmail?: string | null;
    isAdmin?: boolean;
}> = ({ isOpen, onClose, atividade, currentUser, userEmail, isAdmin }) => {
    const [activeTab, setActiveTab] = useState<'chamada' | 'frequencia_mensal' | 'alunos' | 'conteudo'>('chamada');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedPeriod, setSelectedPeriod] = useState(PERIODOS_LETIVOS[0]);
    const [attendance, setAttendance] = useState<Record<number, boolean>>({});
    const [students, setStudents] = useState<Student[]>([]);
    const [studentFrequency, setStudentFrequency] = useState<Record<number, number>>({});
    const [logs, setLogs] = useState<AtividadeLog[]>([]);
    const [isAddingStudent, setIsAddingStudent] = useState(false);

    // Monthly Attendance State
    const [selectedMonth, setSelectedMonth] = useState<number>(() => {
        const d = new Date();
        return d.getMonth() + 1;
    });
    const [selectedYear, setSelectedYear] = useState<number>(() => {
        return new Date().getFullYear();
    });
    const [monthlyRecords, setMonthlyRecords] = useState<AtividadePresenca[]>([]);
    const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);
    const [savingCellKey, setSavingCellKey] = useState<string | null>(null);
    const [searchMonthlyStudent, setSearchMonthlyStudent] = useState('');
    const [filterMonthlyRate, setFilterMonthlyRate] = useState<'all' | '100' | 'alert'>('all');
    const [showAllDaysInMonth, setShowAllDaysInMonth] = useState(false);
    const [isAddDayModalOpen, setIsAddDayModalOpen] = useState(false);
    const [newDayToRegister, setNewDayToRegister] = useState('');
    const [newDayDefaultPresent, setNewDayDefaultPresent] = useState(true);
    const [isPrintingMonthly, setIsPrintingMonthly] = useState(false);
    const [activeDateMenu, setActiveDateMenu] = useState<string | null>(null);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newLog, setNewLog] = useState('');
    const [editingLog, setEditingLog] = useState<AtividadeLog | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [logsToPrint, setLogsToPrint] = useState<AtividadeLog[]>([]);

    // Coordinator Evaluation State
    const [evaluatingLog, setEvaluatingLog] = useState<AtividadeLog | null>(null);
    const [evalTargetStatus, setEvalTargetStatus] = useState<'Aprovado' | 'Devolvido para Correção'>('Aprovado');
    const [evalObsText, setEvalObsText] = useState('');
    const [isSavingEval, setIsSavingEval] = useState(false);

    const isCoordenador = isAdmin || 
        currentUser?.funcao === 'Administrador' || 
        currentUser?.funcao === 'Coordenador Pedagógico' || 
        currentUser?.funcao === 'Coordenador Regional' || 
        currentUser?.funcao === 'Gestor' || 
        currentUser?.funcao === 'Gestor Pedagógico' || 
        currentUser?.funcao === 'Gestor Geral' || 
        currentUser?.funcao === 'Técnico Pedagógico' || 
        !currentUser?.funcao || 
        (currentUser?.funcao !== 'Professor' && 
         currentUser?.funcao !== 'Monitor de Atividade Complementar' && 
         currentUser?.funcao !== 'Professor(a) de Recomposição');

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
            await loadMonthlyAttendance(selectedYear, selectedMonth);
        } catch (err) {
            console.error('Error loading diary data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMonthlyAttendance = async (year = selectedYear, month = selectedMonth) => {
        if (!atividade?.id) return;
        setIsLoadingMonthly(true);
        try {
            const data = await activitiesService.getMonthlyAttendance(atividade.id, year, month);
            setMonthlyRecords(data);
        } catch (err) {
            console.error('Error loading monthly attendance:', err);
        } finally {
            setIsLoadingMonthly(false);
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
            loadMonthlyAttendance(selectedYear, selectedMonth);
        } catch (err) {
            console.error('Error saving attendance:', err);
            alert('Erro ao salvar presença.');
        }
    };

    const handleMarkAll = async (presente: boolean) => {
        if (students.length === 0) return;
        try {
            const newAttendance: Record<number, boolean> = {};
            students.forEach(s => { newAttendance[s.id] = presente; });
            setAttendance(newAttendance);
            
            const records = students.map(s => ({
                aluno_id: s.id,
                presente
            }));
            if (!atividade?.id) return;
            await activitiesService.saveAttendance(atividade.id, selectedDate, records);
            loadMonthlyAttendance(selectedYear, selectedMonth);
        } catch (err) {
            console.error('Error saving attendance:', err);
        }
    };

    // Monthly Attendance Logic & Helpers
    const handlePrevMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(prev => prev - 1);
        } else {
            setSelectedMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(prev => prev + 1);
        } else {
            setSelectedMonth(prev => prev + 1);
        }
    };

    const handleCurrentMonth = () => {
        const now = new Date();
        setSelectedMonth(now.getMonth() + 1);
        setSelectedYear(now.getFullYear());
    };

    React.useEffect(() => {
        if (isOpen && atividade?.id) {
            loadMonthlyAttendance(selectedYear, selectedMonth);
        }
    }, [isOpen, atividade?.id, selectedMonth, selectedYear, activeTab]);

    // Distinct registered dates for the month
    const registeredDates = useMemo(() => {
        const datesSet = new Set<string>();
        monthlyRecords.forEach(r => {
            if (r.data) datesSet.add(r.data);
        });
        return Array.from(datesSet).sort();
    }, [monthlyRecords]);

    // All dates of the month (1..lastDay)
    const allMonthDates = useMemo(() => {
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const list: string[] = [];
        for (let d = 1; d <= lastDay; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            list.push(dateStr);
        }
        return list;
    }, [selectedYear, selectedMonth]);

    const displayDates = showAllDaysInMonth ? allMonthDates : registeredDates;

    // Monthly Rows for each student
    const studentsMonthlyRows: StudentMonthlyRow[] = useMemo(() => {
        return students.map(student => {
            const daysMap: Record<string, boolean | undefined> = {};
            monthlyRecords.forEach(r => {
                if (r.aluno_id === student.id) {
                    daysMap[r.data] = r.presente;
                }
            });

            let presences = 0;
            let absences = 0;
            let totalClasses = 0;

            registeredDates.forEach(d => {
                const status = daysMap[d];
                if (status === true) {
                    presences++;
                    totalClasses++;
                } else if (status === false) {
                    absences++;
                    totalClasses++;
                }
            });

            const rate = totalClasses > 0 ? Math.round((presences / totalClasses) * 100) : 100;

            return {
                id: student.id,
                nome: student.nome,
                turma: student.turma,
                escola: student.escola,
                anoSerie: student.anoSerie,
                presencesCount: presences,
                absencesCount: absences,
                totalClasses,
                rate,
                daysMap
            };
        });
    }, [students, monthlyRecords, registeredDates]);

    // Filtered monthly rows by search and status
    const filteredStudentsMonthlyRows = useMemo(() => {
        return studentsMonthlyRows.filter(s => {
            if (searchMonthlyStudent.trim()) {
                const q = searchMonthlyStudent.toLowerCase();
                const matchesName = s.nome.toLowerCase().includes(q);
                const matchesTurma = s.turma.toLowerCase().includes(q);
                if (!matchesName && !matchesTurma) return false;
            }
            if (filterMonthlyRate === '100') {
                return s.rate === 100 && s.totalClasses > 0;
            }
            if (filterMonthlyRate === 'alert') {
                return s.rate < 75 && s.totalClasses > 0;
            }
            return true;
        });
    }, [studentsMonthlyRows, searchMonthlyStudent, filterMonthlyRate]);

    // Summary statistics for the month
    const monthlyStats = useMemo(() => {
        const totalRegisteredDays = registeredDates.length;
        const totalEnrolled = students.length;
        let totalPresences = 0;
        let totalAbsences = 0;

        studentsMonthlyRows.forEach(s => {
            totalPresences += s.presencesCount;
            totalAbsences += s.absencesCount;
        });

        const totalEntries = totalPresences + totalAbsences;
        const avgRate = totalEntries > 0 ? Math.round((totalPresences / totalEntries) * 100) : 100;
        const alertStudents = studentsMonthlyRows.filter(s => s.rate < 75 && s.totalClasses > 0).length;
        const perfectStudents = studentsMonthlyRows.filter(s => s.rate === 100 && s.totalClasses > 0).length;

        return {
            totalRegisteredDays,
            totalEnrolled,
            totalPresences,
            totalAbsences,
            avgRate,
            alertStudents,
            perfectStudents
        };
    }, [registeredDates, students, studentsMonthlyRows]);

    const handleToggleCell = async (studentId: number, dateStr: string) => {
        if (!atividade?.id) return;
        const cellKey = `${studentId}_${dateStr}`;
        setSavingCellKey(cellKey);

        const currentRecord = monthlyRecords.find(r => r.aluno_id === studentId && r.data === dateStr);
        const newStatus = currentRecord ? !currentRecord.presente : true;

        // Optimistic UI update
        setMonthlyRecords(prev => {
            const exists = prev.some(r => r.aluno_id === studentId && r.data === dateStr);
            if (exists) {
                return prev.map(r => (r.aluno_id === studentId && r.data === dateStr) ? { ...r, presente: newStatus } : r);
            } else {
                return [...prev, { aluno_id: studentId, data: dateStr, presente: newStatus }];
            }
        });

        try {
            await activitiesService.toggleStudentAttendance(atividade.id, dateStr, studentId, newStatus);
            const stats = await activitiesService.getAttendanceStats(atividade.id);
            setStudentFrequency(stats);
        } catch (err) {
            console.error('Error toggling attendance cell:', err);
            await loadMonthlyAttendance(selectedYear, selectedMonth);
            alert('Erro ao atualizar presença do aluno.');
        } finally {
            setSavingCellKey(null);
        }
    };

    const handleSetAllForDate = async (dateStr: string, presente: boolean) => {
        if (!atividade?.id || students.length === 0) return;
        try {
            const records = students.map(s => ({
                aluno_id: s.id,
                presente
            }));
            await activitiesService.saveAttendance(atividade.id, dateStr, records);
            await loadMonthlyAttendance(selectedYear, selectedMonth);
            const stats = await activitiesService.getAttendanceStats(atividade.id);
            setStudentFrequency(stats);
            setActiveDateMenu(null);
        } catch (err) {
            console.error('Error setting all for date:', err);
            alert('Erro ao atualizar registros do dia.');
        }
    };

    const handleDeleteDateRecords = async (dateStr: string) => {
        if (!atividade?.id) return;
        const parts = dateStr.split('-');
        const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
        if (confirm(`Deseja realmente remover os registros de frequência do dia ${formatted}?`)) {
            try {
                await activitiesService.deleteAttendanceForDate(atividade.id, dateStr);
                await loadMonthlyAttendance(selectedYear, selectedMonth);
                const stats = await activitiesService.getAttendanceStats(atividade.id);
                setStudentFrequency(stats);
                setActiveDateMenu(null);
            } catch (err) {
                console.error('Error deleting date records:', err);
                alert('Erro ao excluir registros do dia.');
            }
        }
    };

    const handleJumpToChamada = (dateStr: string) => {
        setSelectedDate(dateStr);
        setActiveTab('chamada');
        setActiveDateMenu(null);
    };

    const handleAddNewDayToMonth = async (dateStr: string, defaultPresent: boolean) => {
        if (!atividade?.id || !dateStr) return;
        try {
            const records = students.map(s => ({
                aluno_id: s.id,
                presente: defaultPresent
            }));
            await activitiesService.saveAttendance(atividade.id, dateStr, records);
            await loadMonthlyAttendance(selectedYear, selectedMonth);
            const stats = await activitiesService.getAttendanceStats(atividade.id);
            setStudentFrequency(stats);
            setIsAddDayModalOpen(false);
            setNewDayToRegister('');
        } catch (err) {
            console.error('Error adding new attendance day:', err);
            alert('Erro ao registrar nova data de frequência.');
        }
    };

    const selectedMonthObj = MESES.find(m => m.value === selectedMonth) || MESES[0];

    const handleAddStudent = async (student: Student) => {
        if (students.find(s => s.id === student.id)) {
            alert('Este aluno já está vinculado a esta atividade.');
            return;
        }
        if (atividade && students.length >= (atividade.vagas || 0)) {
            alert('A capacidade máxima da turma já foi atingida, e é necessário abrir uma nova turma para cadastrar os demais alunos.');
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
        if (!atividade?.id) return;
        try {
            if (editingLog) {
                const logPayload: Partial<AtividadeLog> = {
                    data: selectedDate,
                    conteudo: newLog.trim(),
                    periodo: selectedPeriod,
                    status: 'Em Análise',
                    updated_at: new Date().toISOString()
                };
                const updated = await activitiesService.updateLog(editingLog.id, logPayload);
                setLogs(logs.map(l => l.id === editingLog.id ? { ...l, ...updated } : l));
                setEditingLog(null);
                setNewLog('');
                setSelectedDate(new Date().toISOString().split('T')[0]);
                setSelectedPeriod(PERIODOS_LETIVOS[0]);
            } else {
                const logPayload: Omit<AtividadeLog, 'id'> = {
                    atividade_id: atividade.id,
                    data: selectedDate,
                    conteudo: newLog.trim(),
                    instrutor: atividade.instrutor || currentUser?.nome || userEmail || 'Instrutor',
                    periodo: selectedPeriod,
                    status: 'Em Análise'
                };
                const saved = await activitiesService.saveLog(logPayload);
                setLogs([saved, ...logs]);
                setNewLog('');
            }
        } catch (err: any) {
            console.error('Error saving log:', err);
            alert(`Erro ao salvar registro: ${err?.message || 'Verifique a conexão ou tente novamente.'}`);
        }
    };

    const openEvaluationModal = (log: AtividadeLog, initialStatus: 'Aprovado' | 'Devolvido para Correção') => {
        setEvaluatingLog(log);
        setEvalTargetStatus(initialStatus);
        setEvalObsText(log.observacao_coordenacao || '');
    };

    const handleSaveEvaluation = async () => {
        if (!evaluatingLog) return;

        if (evalTargetStatus === 'Devolvido para Correção' && !evalObsText.trim()) {
            alert('Por favor, informe a observação do que deve ser ajustado pelo instrutor/professor.');
            return;
        }

        setIsSavingEval(true);
        try {
            const avaliadorNome = currentUser?.nome || userEmail || 'Coordenador Pedagógico';
            const nowIso = new Date().toISOString();

            const updatedPayload: Partial<AtividadeLog> = {
                status: evalTargetStatus,
                observacao_coordenacao: evalObsText.trim(),
                avaliado_por: avaliadorNome,
                avaliado_em: nowIso,
                updated_at: nowIso,
                updated_by: avaliadorNome
            };

            await activitiesService.updateLog(evaluatingLog.id, updatedPayload);

            setLogs(logs.map(l => l.id === evaluatingLog.id ? { ...l, ...updatedPayload } : l));
            setEvaluatingLog(null);
            setEvalObsText('');
        } catch (err: any) {
            console.error('Error saving evaluation:', err);
            alert(`Erro ao salvar avaliação: ${err?.message || 'Tente novamente.'}`);
        } finally {
            setIsSavingEval(false);
        }
    };

    const renderStatusBadge = (status?: string) => {
        const currentStatus = status || 'Em Análise';
        if (currentStatus === 'Aprovado') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Aprovado
                </span>
            );
        }
        if (currentStatus === 'Devolvido para Correção') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shrink-0 shadow-sm">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Devolvido para Correção
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shrink-0 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Em Análise
            </span>
        );
    };

    const handleStartEdit = (log: AtividadeLog) => {
        setEditingLog(log);
        setNewLog(log.conteudo);
        setSelectedDate(log.data);
        setSelectedPeriod(log.periodo || PERIODOS_LETIVOS[0]);
    };

    const handleCancelEdit = () => {
        setEditingLog(null);
        setNewLog('');
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setSelectedPeriod(PERIODOS_LETIVOS[0]);
    };

    const handleDeleteLog = async (id: string) => {
        if (confirm('Deseja realmente excluir este registro de conteúdo?')) {
            try {
                await activitiesService.deleteLog(id);
                setLogs(logs.filter(l => l.id !== id));
                if (editingLog?.id === id) {
                    handleCancelEdit();
                }
            } catch (err) {
                console.error('Error deleting log:', err);
                alert('Erro ao excluir registro.');
            }
        }
    };

    const handlePrintAllLogs = () => {
        setLogsToPrint(logs);
        setIsPrinting(true);
    };

    const handlePrintSingleLog = (log: AtividadeLog) => {
        setLogsToPrint([log]);
        setIsPrinting(true);
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
            <div className="bg-slate-50 w-full max-w-6xl xl:max-w-7xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20 relative">
                
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
                                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-black focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none"
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
                                                        : 'bg-white border-slate-50 hover:border-orange-200 hover:bg-slate-50 cursor-pointer'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className={`w-12 h-12 rounded-xl shadow-sm flex items-center justify-center font-black transition-all ${
                                                        enrolled ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 group-hover:bg-brand-orange group-hover:text-white'
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
                                                            <span className="text-[10px] font-bold text-brand-orange uppercase tracking-widest">{s.anoSerie} • {s.etapa}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`p-2 rounded-lg transition-all ${
                                                    enrolled
                                                        ? 'bg-emerald-100 text-emerald-600'
                                                        : 'bg-slate-100 text-slate-400 group-hover:bg-orange-50 group-hover:text-brand-orange'
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
                <div className="bg-white px-8 sm:px-10 py-6 sm:py-8 border-b border-slate-100 relative">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-4 sm:gap-6 items-start flex-1 min-w-0">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0 mt-0.5">
                                <ClipboardList className="w-7 h-7 sm:w-8 sm:h-8" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight leading-snug">
                                        {atividade?.nome}
                                    </h2>
                                    {atividade?.categoria && (
                                        <span className="bg-orange-50 text-brand-orange border border-orange-100 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0">
                                            {atividade.categoria}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 font-bold text-xs sm:text-sm">
                                    {atividade?.instrutor && (
                                        <div className="flex items-center gap-1.5">
                                            <Users size={15} className="text-brand-orange" />
                                            <span>{atividade.instrutor}</span>
                                        </div>
                                    )}
                                    {atividade?.sala && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={15} className="text-brand-orange" />
                                            <span>{atividade.sala}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp size={15} className="text-emerald-500" />
                                        <span className="text-emerald-700 font-bold">{students.length}/{atividade?.vagas || 0} Inscritos</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="text-slate-400 hover:text-slate-700 p-2.5 hover:bg-slate-100 rounded-2xl transition-all shrink-0 cursor-pointer"
                            title="Fechar Painel"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 mt-6 sm:mt-8 overflow-x-auto pb-1">
                        {[
                            { id: 'chamada', label: 'Chamada Diária', icon: CheckCircle2 },
                            { id: 'frequencia_mensal', label: 'Frequência Mensal', icon: Calendar },
                            { id: 'alunos', label: 'Gestão de Alunos', icon: Users },
                            { id: 'conteudo', label: 'Conteúdo Pedagógico', icon: BookOpen },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-black transition-all border-2 whitespace-nowrap cursor-pointer ${
                                    activeTab === tab.id 
                                    ? 'bg-brand-orange border-brand-orange text-white shadow-lg shadow-orange-500/20' 
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
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-50/50">
                    
                    {/* Tab: Chamada */}
                    {activeTab === 'chamada' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            
                            {/* Chamada Toolbar Card */}
                            <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
                                
                                {/* Left: Status & Quick Attendance Controls */}
                                <div className="flex flex-col justify-center gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                atividade?.status === 'Ativa' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                            }`}>
                                                {atividade?.status || 'Ativa'}
                                            </span>
                                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                                Frequência da Oficina
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-medium mt-1">
                                            Marque a presença dos estudantes para o dia selecionado
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 pt-0.5">
                                        <button
                                            type="button"
                                            onClick={() => handleMarkAll(true)}
                                            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-emerald-200/60 active:scale-95 cursor-pointer shadow-sm"
                                            title="Marcar todos como presentes"
                                        >
                                            <CheckCheck size={15} />
                                            <span>Todos Presentes</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMarkAll(false)}
                                            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-200/80 active:scale-95 cursor-pointer"
                                            title="Marcar todos como faltantes"
                                        >
                                            <RotateCcw size={14} />
                                            <span>Limpar</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Right: Date Picker Box aligned perfectly to span from Total to Faltas */}
                                <div className="flex flex-col gap-2.5 w-full sm:w-80 shrink-0">
                                    {/* Date Selector Box spanning full width from Total to Faltas */}
                                    <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-inner w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-50 text-brand-orange rounded-xl border border-orange-100 shrink-0">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Data da Aula</span>
                                                <input 
                                                    type="date" 
                                                    value={selectedDate}
                                                    onChange={e => setSelectedDate(e.target.value)}
                                                    className="font-black text-slate-800 bg-transparent border-none p-0 outline-none focus:ring-0 text-sm cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metrics KPI Badges (Grid of 3 equal columns spanning exact width of Date Box) */}
                                    <div className="grid grid-cols-3 gap-2 w-full">
                                        <div className="bg-slate-50 border border-slate-100 py-2 px-2 rounded-2xl text-center">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total</span>
                                            <span className="text-base sm:text-lg font-black text-slate-800">{students.length}</span>
                                        </div>
                                        <div className="bg-emerald-50 border border-emerald-100 py-2 px-2 rounded-2xl text-center">
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Presentes</span>
                                            <span className="text-base sm:text-lg font-black text-emerald-700">
                                                {Object.values(attendance).filter(v => v === true).length}
                                            </span>
                                        </div>
                                        <div className="bg-rose-50 border border-rose-100 py-2 px-2 rounded-2xl text-center">
                                            <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block">Faltas</span>
                                            <span className="text-base sm:text-lg font-black text-rose-700">
                                                {students.length - Object.values(attendance).filter(v => v === true).length}
                                            </span>
                                        </div>
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
                                                            <div className="w-10 h-10 bg-orange-50 text-brand-orange rounded-xl flex items-center justify-center font-black text-sm italic">
                                                                {student.nome?.charAt(0) || '?'}
                                                            </div>
                                                            <span className="font-bold text-slate-800">{student.nome || 'Sem nome'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{student.escola}</span>
                                                            <span className="bg-orange-50/80 text-brand-orange px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit">{student.anoSerie} • {student.etapa}</span>
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

                    {/* Tab: Frequência Mensal */}
                    {activeTab === 'frequencia_mensal' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            
                            {/* Monthly Toolbar Card */}
                            <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6">
                                
                                {/* Left Info */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
                                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                            Controle e Consulta Mensal de Frequência
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold">
                                        {atividade?.diasSemana && atividade.diasSemana.length > 0 ? (
                                            <span>Dias de Atendimento: <strong className="text-brand-orange">{Array.isArray(atividade.diasSemana) ? atividade.diasSemana.join(', ') : atividade.diasSemana}</strong></span>
                                        ) : (
                                            <span>Dias de atendimento da oficina</span>
                                        )}
                                        {atividade?.cargaHoraria ? ` • ${atividade.cargaHoraria}` : ''}
                                        {atividade?.horarioInicio ? ` • ${atividade.horarioInicio} às ${atividade.horarioFim}` : ''}
                                    </p>
                                </div>

                                {/* Month / Year Controls */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 p-1.5 rounded-2xl shadow-inner">
                                        <button
                                            type="button"
                                            onClick={handlePrevMonth}
                                            className="p-2 hover:bg-white text-slate-600 hover:text-slate-900 rounded-xl transition-all hover:shadow-sm cursor-pointer"
                                            title="Mês Anterior"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <div className="flex items-center gap-1 px-1">
                                            <select
                                                value={selectedMonth}
                                                onChange={e => setSelectedMonth(Number(e.target.value))}
                                                className="font-black text-xs sm:text-sm text-slate-800 bg-transparent border-none outline-none focus:ring-0 cursor-pointer uppercase py-1"
                                            >
                                                {MESES.map(m => (
                                                    <option key={m.value} value={m.value}>{m.label}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={selectedYear}
                                                onChange={e => setSelectedYear(Number(e.target.value))}
                                                className="font-black text-xs sm:text-sm text-slate-800 bg-transparent border-none outline-none focus:ring-0 cursor-pointer py-1"
                                            >
                                                {[2024, 2025, 2026, 2027].map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleNextMonth}
                                            className="p-2 hover:bg-white text-slate-600 hover:text-slate-900 rounded-xl transition-all hover:shadow-sm cursor-pointer"
                                            title="Próximo Mês"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleCurrentMonth}
                                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                                    >
                                        Mês Atual
                                    </button>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const now = new Date();
                                                const defaultDate = (now.getFullYear() === selectedYear && (now.getMonth() + 1) === selectedMonth)
                                                    ? now.toISOString().split('T')[0]
                                                    : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
                                                setNewDayToRegister(defaultDate);
                                                setIsAddDayModalOpen(true);
                                            }}
                                            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                                        >
                                            <Plus size={16} />
                                            <span>Novo Dia</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setIsPrintingMonthly(true)}
                                            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                                            title="Imprimir Mapa Mensal de Frequência"
                                        >
                                            <Printer size={16} />
                                            <span className="hidden sm:inline">Imprimir Mapa</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* KPI Metrics Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center shrink-0">
                                        <CalendarCheck size={22} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dias com Registro</p>
                                        <p className="text-xl font-black text-slate-800">
                                            {registeredDates.length} <span className="text-xs font-bold text-slate-400 font-normal">dia(s)</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <TrendingUp size={22} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Média do Mês</p>
                                        <p className="text-xl font-black text-emerald-700">
                                            {monthlyStats.avgRate}% <span className="text-xs font-bold text-slate-400 font-normal">presença</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={22} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alunos 100%</p>
                                        <p className="text-xl font-black text-slate-800">
                                            {monthlyStats.perfectStudents} <span className="text-xs font-bold text-slate-400 font-normal">de {students.length}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <AlertTriangle size={22} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alerta Infrequência</p>
                                        <p className={`text-xl font-black ${monthlyStats.alertStudents > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                            {monthlyStats.alertStudents} <span className="text-xs font-bold text-slate-400 font-normal">(&lt; 75%)</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Filters Bar & View Mode Toggle */}
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                                <div className="relative flex-1 w-full max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar aluno na tabela mensal..." 
                                        value={searchMonthlyStudent}
                                        onChange={e => setSearchMonthlyStudent(e.target.value)}
                                        className="w-full bg-white border border-slate-200/80 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {/* View Toggle */}
                                    <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-2xl text-xs font-bold">
                                        <button
                                            type="button"
                                            onClick={() => setShowAllDaysInMonth(false)}
                                            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                                                !showAllDaysInMonth
                                                    ? 'bg-white text-slate-900 shadow-sm font-black'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Dias com Registro ({registeredDates.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowAllDaysInMonth(true)}
                                            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                                                showAllDaysInMonth
                                                    ? 'bg-white text-slate-900 shadow-sm font-black'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Todos os Dias ({allMonthDates.length})
                                        </button>
                                    </div>

                                    {/* Filter Status Pills */}
                                    <button
                                        type="button"
                                        onClick={() => setFilterMonthlyRate('all')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            filterMonthlyRate === 'all'
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        Todos ({studentsMonthlyRows.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterMonthlyRate('100')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            filterMonthlyRate === '100'
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        100% ({monthlyStats.perfectStudents})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterMonthlyRate('alert')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            filterMonthlyRate === 'alert'
                                                ? 'bg-rose-600 text-white shadow-sm'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        Alerta ({monthlyStats.alertStudents})
                                    </button>
                                </div>
                            </div>

                            {/* Monthly Attendance Table or Empty State */}
                            {isLoadingMonthly ? (
                                <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center space-y-3">
                                    <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
                                    <p className="text-sm font-black text-slate-700">Carregando mapa mensal de frequência...</p>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedMonthObj.label} / {selectedYear}</p>
                                </div>
                            ) : registeredDates.length === 0 && !showAllDaysInMonth ? (
                                <div className="bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm text-center max-w-xl mx-auto space-y-4 animate-in fade-in">
                                    <div className="w-16 h-16 bg-orange-50 text-brand-orange rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                        <Calendar size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                            Nenhum registro de frequência em {selectedMonthObj.label} de {selectedYear}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                                            Ainda não há chamadas lançadas para esta oficina neste mês. Você pode registrar um dia de aula agora ou navegar para outros meses.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const now = new Date();
                                                const defaultDate = (now.getFullYear() === selectedYear && (now.getMonth() + 1) === selectedMonth)
                                                    ? now.toISOString().split('T')[0]
                                                    : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
                                                setNewDayToRegister(defaultDate);
                                                setIsAddDayModalOpen(true);
                                            }}
                                            className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                                        >
                                            <Plus size={16} />
                                            <span>+ Registrar Novo Dia neste Mês</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowAllDaysInMonth(true)}
                                            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                                        >
                                            Ver Calendário Completo
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                    
                                    {/* Table Scroll Container */}
                                    <div className="overflow-x-auto w-full max-h-[60vh] overflow-y-auto">
                                        <table className="w-full border-collapse text-left">
                                            <thead className="bg-slate-50/90 backdrop-blur sticky top-0 z-20 border-b border-slate-200">
                                                <tr>
                                                    {/* Sticky Left: # and Student */}
                                                    <th className="p-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 sticky left-0 bg-slate-50/95 z-30 border-r border-slate-100">
                                                        #
                                                    </th>
                                                    <th className="p-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px] sticky left-12 bg-slate-50/95 z-30 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                                        Estudante ({filteredStudentsMonthlyRows.length})
                                                    </th>

                                                    {/* Day Headers */}
                                                    {displayDates.map(d => {
                                                        const parts = d.split('-');
                                                        const dayNum = parts[2];
                                                        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                                                        const weekday = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'][dateObj.getDay()];
                                                        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                                                        const hasRecords = registeredDates.includes(d);

                                                        const presentsInDay = studentsMonthlyRows.filter(s => s.daysMap[d] === true).length;
                                                        const absentsInDay = studentsMonthlyRows.filter(s => s.daysMap[d] === false).length;
                                                        const totalMarked = presentsInDay + absentsInDay;

                                                        return (
                                                            <th
                                                                key={d}
                                                                className={`p-2.5 text-center min-w-[62px] border-r border-slate-100 select-none relative group transition-colors ${
                                                                    isWeekend ? 'bg-slate-100/50' : hasRecords ? 'bg-orange-50/40 hover:bg-orange-50/70' : 'bg-slate-50/80 hover:bg-slate-100/60'
                                                                }`}
                                                            >
                                                                <div className="flex flex-col items-center gap-0.5">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{weekday}</span>
                                                                    <span className={`text-sm font-black leading-tight ${hasRecords ? 'text-brand-orange' : 'text-slate-700'}`}>
                                                                        {dayNum}
                                                                    </span>
                                                                    {hasRecords && totalMarked > 0 ? (
                                                                        <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100 mt-0.5">
                                                                            {presentsInDay}/{totalMarked}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[8.5px] font-bold text-slate-300 mt-0.5">—</span>
                                                                    )}
                                                                </div>

                                                                {/* Day Header Context Menu */}
                                                                <div className="relative mt-0.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setActiveDateMenu(activeDateMenu === d ? null : d)}
                                                                        className="p-1 text-slate-300 hover:text-slate-600 rounded-lg hover:bg-white/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                                                        title="Opções deste dia"
                                                                    >
                                                                        <MoreVertical size={12} />
                                                                    </button>

                                                                    {activeDateMenu === d && (
                                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-40 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 w-48 text-left text-xs font-bold animate-in fade-in zoom-in-95">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleJumpToChamada(d)}
                                                                                className="w-full px-3 py-2 text-slate-700 hover:bg-orange-50 hover:text-brand-orange flex items-center gap-2 cursor-pointer"
                                                                            >
                                                                                <CheckCircle2 size={14} /> Abrir Chamada Diária
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSetAllForDate(d, true)}
                                                                                className="w-full px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                                                            >
                                                                                <CheckCheck size={14} /> Marcar Todos Presentes
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSetAllForDate(d, false)}
                                                                                className="w-full px-3 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                                                            >
                                                                                <XCircle size={14} /> Marcar Todos Ausentes
                                                                            </button>
                                                                            {hasRecords && (
                                                                                <>
                                                                                    <div className="border-t border-slate-100 my-1" />
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleDeleteDateRecords(d)}
                                                                                        className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                                                                    >
                                                                                        <Trash2 size={14} /> Excluir Registro do Dia
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </th>
                                                        );
                                                    })}

                                                    {/* Sticky Right: Presences, Absences, Rate */}
                                                    <th className="p-3.5 text-center text-[10px] font-black text-emerald-700 bg-emerald-50/95 uppercase tracking-widest w-16 border-r border-emerald-100">
                                                        P
                                                    </th>
                                                    <th className="p-3.5 text-center text-[10px] font-black text-rose-700 bg-rose-50/95 uppercase tracking-widest w-16 border-r border-rose-100">
                                                        F
                                                    </th>
                                                    <th className="p-3.5 text-center text-[10px] font-black text-slate-700 bg-slate-100/95 uppercase tracking-widest w-16 border-r border-slate-200">
                                                        Aulas
                                                    </th>
                                                    <th className="p-3.5 text-center text-[10px] font-black text-brand-orange bg-orange-50/95 uppercase tracking-widest w-24">
                                                        % Freq
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {filteredStudentsMonthlyRows.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={displayDates.length + 6} className="py-12 text-center text-slate-400 font-bold italic">
                                                            Nenhum estudante encontrado com o filtro atual.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredStudentsMonthlyRows.map((student, idx) => {
                                                        const isAlert = student.rate < 75 && student.totalClasses > 0;
                                                        return (
                                                            <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                                                                
                                                                {/* Column 1: Index */}
                                                                <td className="p-3 text-center text-xs font-black text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 border-r border-slate-100">
                                                                    {String(idx + 1).padStart(2, '0')}
                                                                </td>

                                                                {/* Column 2: Student */}
                                                                <td className="p-3 sticky left-12 bg-white group-hover:bg-slate-50/80 z-10 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-xl bg-orange-50 text-brand-orange font-black text-xs flex items-center justify-center shrink-0">
                                                                            {student.nome?.charAt(0) || '?'}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="font-black text-slate-800 text-xs truncate uppercase">
                                                                                {student.nome}
                                                                            </p>
                                                                            <p className="text-[10px] font-bold text-slate-400 truncate">
                                                                                {student.turma} • {student.escola}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Day Cells */}
                                                                {displayDates.map(d => {
                                                                    const status = student.daysMap[d];
                                                                    const isPresent = status === true;
                                                                    const isAbsent = status === false;
                                                                    const isSavingThis = savingCellKey === `${student.id}_${d}`;

                                                                    return (
                                                                        <td
                                                                            key={d}
                                                                            className="p-1.5 text-center border-r border-slate-100"
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                disabled={isSavingThis}
                                                                                onClick={() => handleToggleCell(student.id, d)}
                                                                                title={
                                                                                    isPresent ? "Presente (P) • Clique para alterar para Falta" :
                                                                                    isAbsent ? "Falta (F) • Clique para alterar para Presença" :
                                                                                    "Sem registro • Clique para marcar Presença"
                                                                                }
                                                                                className={`w-8 h-8 rounded-xl font-black text-xs inline-flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm ${
                                                                                    isPresent
                                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                                                        : isAbsent
                                                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                                                                        : 'bg-slate-50 text-slate-300 border border-slate-100 hover:bg-orange-50 hover:text-brand-orange hover:border-orange-200'
                                                                                }`}
                                                                            >
                                                                                {isSavingThis ? (
                                                                                    <span className="w-3.5 h-3.5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                                                                                ) : isPresent ? (
                                                                                    'P'
                                                                                ) : isAbsent ? (
                                                                                    'F'
                                                                                ) : (
                                                                                    '—'
                                                                                )}
                                                                            </button>
                                                                        </td>
                                                                    );
                                                                })}

                                                                {/* Presences Count */}
                                                                <td className="p-3 text-center font-black text-xs text-emerald-700 bg-emerald-50/40 border-r border-emerald-100">
                                                                    {student.presencesCount}
                                                                </td>

                                                                {/* Absences Count */}
                                                                <td className="p-3 text-center font-black text-xs text-rose-700 bg-rose-50/40 border-r border-rose-100">
                                                                    {student.absencesCount}
                                                                </td>

                                                                {/* Total Classes */}
                                                                <td className="p-3 text-center font-bold text-xs text-slate-600 bg-slate-50/40 border-r border-slate-200">
                                                                    {student.totalClasses}
                                                                </td>

                                                                {/* Monthly Rate */}
                                                                <td className="p-3 text-center">
                                                                    <div className="inline-flex items-center gap-1">
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                                                            student.rate >= 75
                                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                                : student.rate >= 50
                                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                        }`}>
                                                                            {student.rate}%
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                            {filteredStudentsMonthlyRows.length > 0 && (
                                                <tfoot className="bg-slate-50 border-t-2 border-slate-200 sticky bottom-0 z-20">
                                                    <tr className="font-black text-xs text-slate-700">
                                                        <td colSpan={2} className="p-3 text-right uppercase tracking-wider text-slate-500 sticky left-0 bg-slate-50 z-30 border-r border-slate-200">
                                                            Presentes no Dia:
                                                        </td>
                                                        {displayDates.map(d => {
                                                            const pCount = studentsMonthlyRows.filter(s => s.daysMap[d] === true).length;
                                                            return (
                                                                <td key={d} className="p-2 text-center text-emerald-700 font-black border-r border-slate-100">
                                                                    {pCount}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="p-3 text-center text-emerald-700 bg-emerald-50/50 border-r border-emerald-100">
                                                            {monthlyStats.totalPresences}
                                                        </td>
                                                        <td className="p-3 text-center text-rose-700 bg-rose-50/50 border-r border-rose-100">
                                                            {monthlyStats.totalAbsences}
                                                        </td>
                                                        <td className="p-3 text-center text-slate-500 bg-slate-100/50 border-r border-slate-200">
                                                            —
                                                        </td>
                                                        <td className="p-3 text-center text-brand-orange bg-orange-50/50 font-black">
                                                            {monthlyStats.avgRate}%
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>

                                    {/* Bottom Legend */}
                                    <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4">
                                        <div className="flex items-center gap-4">
                                            <span className="font-black uppercase tracking-wider text-[10px] text-slate-400">Legenda:</span>
                                            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                                                <span className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200 text-center font-black leading-5 text-[10px]">P</span>
                                                Presença
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold">
                                                <span className="w-5 h-5 rounded-md bg-rose-50 border border-rose-200 text-center font-black leading-5 text-[10px]">F</span>
                                                Falta
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium">
                                                <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 text-center font-bold leading-5 text-[10px]">—</span>
                                                Sem Registro
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 italic font-medium">
                                            * Clique em qualquer célula para alternar rapidamente entre Presença (P) e Falta (F).
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                        className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-brand-orange/20 transition-all font-medium outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={() => setIsAddingStudent(true)}
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-orange-500/20 active:scale-95"
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
                                            <div className="w-14 h-14 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center font-black text-xl italic uppercase tracking-tighter">
                                                {student.nome?.split(' ').map(n=>n[0]).join('').substring(0,2) || '?'}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 text-lg tracking-tight leading-tight">{student.nome || 'Sem nome'}</h4>
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{student.escola}</p>
                                                <span className="text-[10px] font-black text-brand-orange uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md">{student.anoSerie} • {student.etapa}</span>
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
                            {/* New/Edit Log Input */}
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 p-8 space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <div className="p-2 bg-orange-50 text-brand-orange rounded-lg">
                                            <BookOpen size={18} />
                                        </div>
                                        <h4 className="font-black text-sm uppercase tracking-wider">
                                            {editingLog ? 'Editar Registro de Conteúdo' : 'Novo Registro de Conteúdo'}
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-2 border border-slate-100 bg-slate-50 px-4 py-2 rounded-xl">
                                            <Bookmark size={16} className="text-brand-orange" />
                                            <select 
                                                value={selectedPeriod}
                                                onChange={e => setSelectedPeriod(e.target.value)}
                                                className="font-bold text-slate-700 bg-transparent border-none p-0 outline-none focus:ring-0 text-xs cursor-pointer"
                                            >
                                                {PERIODOS_LETIVOS.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2 border border-slate-100 bg-slate-50 px-4 py-2 rounded-xl">
                                            <Calendar size={16} className="text-brand-orange" />
                                            <input 
                                                type="date" 
                                                value={selectedDate}
                                                onChange={e => setSelectedDate(e.target.value)}
                                                className="font-bold text-slate-700 bg-transparent border-none p-0 outline-none focus:ring-0 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <textarea 
                                    rows={4}
                                    placeholder="Descreva o que foi desenvolvido na aula de hoje..."
                                    value={newLog}
                                    onChange={e => setNewLog(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-[1.5rem] px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none resize-none"
                                />
                                <div className="flex justify-end gap-3">
                                    {editingLog && (
                                        <button 
                                            onClick={handleCancelEdit}
                                            className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleAddLog}
                                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-orange-500/20 active:scale-95"
                                    >
                                        {editingLog ? 'Salvar Alterações' : 'Postar Registro'}
                                    </button>
                                </div>
                            </div>

                            {/* Logs History */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center ml-1">
                                    <h5 className="font-black text-xs text-slate-400 uppercase tracking-widest">Histórico de Aulas</h5>
                                    {logs.length > 0 && (
                                        <button 
                                            onClick={handlePrintAllLogs}
                                            className="text-[10px] font-black text-brand-orange hover:text-orange-700 uppercase tracking-widest flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl border border-slate-100 hover:border-slate-200 transition-all shadow-sm"
                                        >
                                            <Printer size={14} /> Imprimir Planejamento
                                        </button>
                                    )}
                                </div>
                                {logs.map(log => {
                                    const isApproved = log.status === 'Aprovado';
                                    const isReturned = log.status === 'Devolvido para Correção';

                                    return (
                                        <div key={log.id} className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden group space-y-4">
                                            <div className={`absolute top-0 left-0 w-2 h-full ${
                                                isApproved ? 'bg-emerald-500' : isReturned ? 'bg-rose-500' : 'bg-brand-orange'
                                            }`} />
                                            
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                                                        <Calendar size={16} />
                                                    </div>
                                                    <span className="font-black text-slate-800 text-sm">
                                                        {new Date(log.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                    </span>
                                                    {log.periodo && (
                                                        <span className="bg-orange-50 text-brand-orange border border-orange-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                            {log.periodo}
                                                        </span>
                                                    )}
                                                    {renderStatusBadge(log.status)}
                                                </div>

                                                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full">
                                                        {log.instrutor}
                                                    </span>

                                                    {/* Coordinator Quick Action Buttons */}
                                                    {isCoordenador && (
                                                        <div className="flex items-center gap-1.5 bg-slate-50/80 p-1 rounded-xl border border-slate-200/60">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEvaluationModal(log, 'Aprovado')}
                                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                                                                    isApproved 
                                                                        ? 'bg-emerald-600 text-white shadow-sm' 
                                                                        : 'text-emerald-700 hover:bg-emerald-100/70'
                                                                }`}
                                                                title="Aprovar registro pedagógico"
                                                            >
                                                                <CheckCircle2 size={13} />
                                                                <span>Aprovar</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openEvaluationModal(log, 'Devolvido para Correção')}
                                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                                                                    isReturned 
                                                                        ? 'bg-rose-600 text-white shadow-sm' 
                                                                        : 'text-rose-700 hover:bg-rose-100/70'
                                                                }`}
                                                                title="Devolver para correção"
                                                            >
                                                                <AlertCircle size={13} />
                                                                <span>Devolver</span>
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handlePrintSingleLog(log)}
                                                            title="Imprimir registro"
                                                            className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Printer size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleStartEdit(log)}
                                                            title="Editar registro"
                                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteLog(log.id)}
                                                            title="Excluir registro"
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                                                {log.conteudo}
                                            </p>

                                            {/* Coordination Feedback Alert if Devolvido */}
                                            {isReturned && log.observacao_coordenacao && (
                                                <div className="bg-rose-50/90 border-l-4 border-rose-500 rounded-r-2xl p-4 space-y-1 animate-fade-in shadow-sm">
                                                    <div className="flex items-center gap-2 text-rose-800 font-black text-xs uppercase tracking-wide">
                                                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                                        <span>Orientações da Coordenação Pedagógica</span>
                                                        {log.avaliado_por && (
                                                            <span className="text-[10px] text-rose-600 font-bold normal-case">
                                                                — por {log.avaliado_por}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-semibold text-rose-800 leading-relaxed whitespace-pre-line pl-6">
                                                        {log.observacao_coordenacao}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Approved Note */}
                                            {isApproved && log.avaliado_por && (
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50/60 px-3 py-1.5 rounded-xl w-fit border border-emerald-100/80">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>Aprovado por <strong className="font-extrabold">{log.avaliado_por}</strong>{log.avaliado_em ? ` em ${new Date(log.avaliado_em).toLocaleDateString('pt-BR')}` : ''}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="bg-white border-t border-slate-100 px-10 py-6 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Diário Gerencial - Sistema Integrado de Gestão</p>
                    <button 
                        onClick={onClose}
                        className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                        Fechar Painel
                    </button>
                </div>
            </div>

            {/* Coordinator Evaluation Modal */}
            {evaluatingLog && (
                <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
                        <div className="flex items-center justify-between border-b border-slate-100 p-6 pb-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <Bookmark className="w-5 h-5 text-brand-orange" />
                                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                                    Avaliar Conteúdo Pedagógico
                                </h3>
                            </div>
                            <button
                                onClick={() => setEvaluatingLog(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 pt-3 space-y-4 overflow-y-auto flex-1 min-h-0">
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-700">
                                <div>
                                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Atividade / Oficina</span>
                                    <span className="font-extrabold text-slate-800">{atividade?.nome}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50">
                                    <div>
                                        <span className="font-bold text-slate-400 uppercase text-[10px] block">Data da Aula</span>
                                        <span className="font-bold text-slate-700">{new Date(evaluatingLog.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-400 uppercase text-[10px] block">Período</span>
                                        <span className="font-bold text-slate-700">{evaluatingLog.periodo || '1º Bimestre'}</span>
                                    </div>
                                </div>
                                <div className="pt-1 border-t border-slate-200/50">
                                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Conteúdo Registrado</span>
                                    <p className="text-slate-600 font-medium italic max-h-32 overflow-y-auto whitespace-pre-wrap">"{evaluatingLog.conteudo}"</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Decisão da Coordenação
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEvalTargetStatus('Aprovado')}
                                        className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                                            evalTargetStatus === 'Aprovado'
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        Aprovar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEvalTargetStatus('Devolvido para Correção')}
                                        className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                                            evalTargetStatus === 'Devolvido para Correção'
                                                ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        <AlertCircle className="w-4 h-4 text-rose-600" />
                                        Devolver p/ Correção
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                                        Observações da Coordenação {evalTargetStatus === 'Devolvido para Correção' ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal">(Opcional)</span>}
                                    </label>
                                    <textarea
                                        value={evalObsText}
                                        onChange={e => setEvalObsText(e.target.value)}
                                        placeholder={evalTargetStatus === 'Devolvido para Correção' 
                                            ? "Descreva detalhadamente o que o instrutor/professor deve ajustar no registro deste conteúdo..." 
                                            : "Observações ou orientações pedagógicas complementares..."}
                                        rows={4}
                                        className="w-full p-3 border border-slate-200 rounded-2xl text-xs outline-none focus:border-brand-orange transition-all font-medium resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 p-6 pt-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
                            <button 
                                type="button"
                                onClick={() => setEvaluatingLog(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button"
                                disabled={isSavingEval}
                                onClick={handleSaveEvaluation}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                                    evalTargetStatus === 'Aprovado' 
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                                }`}
                            >
                                {isSavingEval ? 'Salvando...' : (evalTargetStatus === 'Aprovado' ? 'Confirmar Aprovação' : 'Confirmar Devolução')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Add New Day Modal */}
            {isAddDayModalOpen && (
                <div className="fixed inset-0 z-[125] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Novo Dia de Frequência</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {selectedMonthObj.label} / {selectedYear}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddDayModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Data da Aula / Chamada
                                </label>
                                <input
                                    type="date"
                                    value={newDayToRegister}
                                    onChange={e => setNewDayToRegister(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-orange/20 cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Lançamento Inicial da Turma
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewDayDefaultPresent(true)}
                                        className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                                            newDayDefaultPresent
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        <CheckCheck size={16} /> Todos Presentes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewDayDefaultPresent(false)}
                                        className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                                            !newDayDefaultPresent
                                                ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        <RotateCcw size={16} /> Todos Ausentes
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium mt-2">
                                    Após registrar, você poderá alterar presenças ou faltas individualmente a qualquer momento.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsAddDayModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAddNewDayToMonth(newDayToRegister, newDayDefaultPresent)}
                                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-brand-orange hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                            >
                                Confirmar e Registrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPrinting && atividade && (
                <PrintableAtividadePlanejamentoReport 
                    atividade={atividade}
                    logs={logsToPrint}
                    onClose={() => setIsPrinting(false)}
                />
            )}

            {isPrintingMonthly && atividade && (
                <PrintableAtividadeFrequenciaMensalReport
                    atividade={atividade}
                    monthName={selectedMonthObj.label}
                    year={selectedYear}
                    dates={registeredDates}
                    studentsRows={studentsMonthlyRows}
                    onClose={() => setIsPrintingMonthly(false)}
                />
            )}
        </div>
    );
};
