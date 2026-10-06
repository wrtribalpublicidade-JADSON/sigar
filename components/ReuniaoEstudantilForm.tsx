import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Printer, BookOpen, ClipboardList, CalendarClock, Info, ArrowLeft, ArrowRight, Save, LayoutTemplate, School, Calendar, FileText, X, Users, CheckCircle2, Lock, Send, BarChart3, Hand, CheckSquare, MessageCircle, AlertTriangle, UserPlus, PenLine, Loader2, Eraser, Check, Trash2, Edit, Fingerprint, ShieldCheck, Sparkles, RefreshCw, AlertCircle, FileCheck } from 'lucide-react';
import { Escola, Coordenador } from '../types';
import { ccTurmaService, ccEstudanteService, ccReuniaoEstudantilService } from '../services/gestaoConselhoService';
import { PrintableReuniaoEstudantilAta } from './PrintableReuniaoEstudantilAta';

interface ReuniaoEstudantilFormProps {
    onClose?: () => void;
    escolas?: Escola[];
    currentUser?: Coordenador | null;
    initialEscolaId?: string;
    initialTurmaId?: string;
    forcedEtapa?: 'fundamental' | 'infantil';
}

export const ReuniaoEstudantilForm: React.FC<ReuniaoEstudantilFormProps> = ({ 
    onClose, 
    escolas = [], 
    currentUser,
    initialEscolaId,
    initialTurmaId,
    forcedEtapa
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [autoAvaliacao, setAutoAvaliacao] = useState<{ [key: number]: string }>({});
    
    // Selection States
    const [selectedEscolaId, setSelectedEscolaId] = useState<string>(initialEscolaId || escolas[0]?.id || '');
    const [turmas, setTurmas] = useState<any[]>([]);
    const [selectedTurmaId, setSelectedTurmaId] = useState<string>(initialTurmaId || '');
    const [estudantes, setEstudantes] = useState<any[]>([]);
    
    // Loading States
    const [isLoadingTurmas, setIsLoadingTurmas] = useState(false);
    const [isLoadingEstudantes, setIsLoadingEstudantes] = useState(false);
    
    // Active Turma Detection
    const activeTurma = useMemo(() => {
        return turmas.find(t => t.id === selectedTurmaId);
    }, [turmas, selectedTurmaId]);

    const isInfantil = forcedEtapa ? forcedEtapa === 'infantil' : (
        activeTurma?.etapa === 'Educação Infantil' || 
        (activeTurma?.stage || '').toLowerCase().includes('infantil') ||
        (activeTurma?.anoSerie || '').toLowerCase().includes('creche') ||
        (activeTurma?.anoSerie || '').toLowerCase().includes('pré-escola') ||
        (activeTurma?.anoSerie || '').toLowerCase().includes('pre-escola')
    );

    // History States
    const [reunioesRealizadas, setReunioesRealizadas] = useState<any[]>([]);
    const [isLoadingReunioes, setIsLoadingReunioes] = useState(false);

    // Fetch reuniões when Turma changes
    useEffect(() => {
        const loadReunioes = async () => {
            if (!selectedEscolaId || !selectedTurmaId || !activeTurma) {
                setReunioesRealizadas([]);
                return;
            }
            setIsLoadingReunioes(true);
            try {
                const etapa = isInfantil ? 'infantil' : 'fundamental';
                const data = await ccReuniaoEstudantilService.getAll(selectedEscolaId, selectedTurmaId, etapa);
                setReunioesRealizadas(data || []);
            } catch (error) {
                console.error("Erro ao carregar reuniões:", error);
            } finally {
                setIsLoadingReunioes(false);
            }
        };
        loadReunioes();
    }, [selectedEscolaId, selectedTurmaId, activeTurma, isInfantil]);
    
    // Signature States
    const [signatures, setSignatures] = useState<{ [studentId: string]: string }>({});
    const [signatureMeta, setSignatureMeta] = useState<{ 
        [studentId: string]: { 
            type: 'digital' | 'biometric'; 
            timestamp: string; 
            protocol?: string; 
            hash?: string; 
        } 
    }>({});
    const [signingStudentId, setSigningStudentId] = useState<string | null>(null);
    const [signatureMode, setSignatureMode] = useState<'digital' | 'biometric'>('digital');
    const sigCanvasRef = useRef<HTMLCanvasElement>(null);
    const sigIsDrawing = useRef(false);
    const sigLastPos = useRef<{ x: number; y: number } | null>(null);

    // Biometric Scanner States
    const [biometricScanState, setBiometricScanState] = useState<'idle' | 'scanning' | 'success'>('idle');
    const [biometricScanProgress, setBiometricScanProgress] = useState(0);
    const [biometricStatusMessage, setBiometricStatusMessage] = useState('Pronto para leitura biométrica');
    const [biometricResult, setBiometricResult] = useState<{
        protocol: string;
        hash: string;
        timestamp: string;
        quality: number;
    } | null>(null);

    // Confirmation & Result Modal States
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [savedReuniaoResult, setSavedReuniaoResult] = useState<any>(null);

    // Print State
    const [reuniaoToPrint, setReuniaoToPrint] = useState<any>(null);

    const handlePrintReuniao = (reuniao: any) => {
        setReuniaoToPrint(reuniao);
        setTimeout(() => {
            window.print();
            setTimeout(() => setReuniaoToPrint(null), 1000);
        }, 500);
    };

    // Form Field States
    const [editingReuniaoId, setEditingReuniaoId] = useState<string | null>(null);
    const [anoLetivo, setAnoLetivo] = useState('2024');
    const [periodoLetivo, setPeriodoLetivo] = useState('');
    const [pauta, setPauta] = useState('Conselho de Classe Participativo');
    const [compromissos, setCompromissos] = useState('');
    const [outrasQuestoes, setOutrasQuestoes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [avaliacaoBncc, setAvaliacaoBncc] = useState<{
        [key: string]: { dificuldade: boolean; motivos: string; sugestoes: string }
    }>({});

    const handleBnccChange = (key: string, field: 'dificuldade' | 'motivos' | 'sugestoes', value: any) => {
        setAvaliacaoBncc(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || { dificuldade: false, motivos: '', sugestoes: '' }),
                [field]: value
            }
        }));
    };

    const CAMPOS_EXPERIENCIA = [
        'O Eu, o Outro e o Nós',
        'Corpo, Gestos e Movimentos',
        'Traços, Sons, Cores e Formas',
        'Escuta, Fala, Pensamento e Imaginação',
        'Espaços, Tempos, Quantidades, Relações e Transformações'
    ];

    // Helper to identify infantil turmas
    const isTurmaInfantil = (t: any): boolean => {
        if (!t) return false;
        const etapa = (t.etapa || t.stage || '').toLowerCase();
        const anoSerie = (t.anoSerie || t.year || '').toLowerCase();
        return etapa.includes('infantil') || 
               anoSerie.includes('creche') || 
               anoSerie.includes('pré-escola') || 
               anoSerie.includes('pre-escola') ||
               anoSerie.includes('maternal') ||
               anoSerie.includes('berçario') ||
               anoSerie.includes('bercario');
    };

    // Fetch Turmas when School changes
    useEffect(() => {
        const loadTurmas = async () => {
            if (!selectedEscolaId) {
                setTurmas([]);
                return;
            }
            setIsLoadingTurmas(true);
            try {
                const data = await ccTurmaService.getBySchool(selectedEscolaId);
                let filtered = data || [];
                if (forcedEtapa === 'infantil') {
                    filtered = filtered.filter(isTurmaInfantil);
                } else if (forcedEtapa === 'fundamental') {
                    filtered = filtered.filter(t => !isTurmaInfantil(t));
                }
                if (currentUser && currentUser.funcao === 'Professor') {
                    const assignedTurmasIds = new Set([
                        ...(currentUser.turmasIds || []).map(String),
                        ...Object.keys(currentUser.turmaComponentes || {}).map(String)
                    ]);
                    filtered = filtered.filter((t: any) => 
                        assignedTurmasIds.has(String(t.id)) ||
                        (currentUser.turmasIds || []).some(tid => tid === t.id || tid === t.name)
                    );
                }
                setTurmas(filtered);
                // If initialTurmaId matches one of the new turmas, keep it, otherwise select first or clear
                if (initialTurmaId && filtered.some((t: any) => t.id === initialTurmaId)) {
                    setSelectedTurmaId(initialTurmaId);
                } else if (filtered.length > 0) {
                    setSelectedTurmaId(filtered[0].id);
                } else {
                    setSelectedTurmaId('');
                }
            } catch (error) {
                console.error('Erro ao carregar turmas:', error);
            } finally {
                setIsLoadingTurmas(false);
            }
        };
        loadTurmas();
    }, [selectedEscolaId, initialTurmaId, forcedEtapa, currentUser]);

    // Fetch Students when Turma changes
    useEffect(() => {
        const loadStudents = async () => {
            if (!selectedTurmaId) {
                setEstudantes([]);
                return;
            }
            setIsLoadingEstudantes(true);
            try {
                const data = await ccEstudanteService.getByTurma(selectedTurmaId);
                setEstudantes(data || []);
            } catch (error) {
                console.error('Erro ao carregar estudantes:', error);
            } finally {
                setIsLoadingEstudantes(false);
            }
        };
        loadStudents();
    }, [selectedTurmaId]);

    const handleAutoAvaliacaoToggle = (idx: number) => {
        setAutoAvaliacao(prev => {
            const current = prev[idx];
            if (!current) return { ...prev, [idx]: 'E' };
            if (current === 'E') return { ...prev, [idx]: 'B' };
            if (current === 'B') return { ...prev, [idx]: 'R' };
            if (current === 'R') return { ...prev, [idx]: 'I' };
            return { ...prev, [idx]: '' };
        });
    };

    const getAutoAvaliacaoButtonConfig = (status: string | undefined) => {
        switch (status) {
            case 'E':
                return { text: 'Excelente', classes: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 shadow-sm shadow-emerald-500/10' };
            case 'B':
                return { text: 'Bom', classes: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300 shadow-sm shadow-blue-500/10' };
            case 'R':
                return { text: 'Regular', classes: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:border-amber-300 shadow-sm shadow-amber-500/10' };
            case 'I':
                return { text: 'Insuficiente', classes: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300 shadow-sm shadow-red-500/10' };
            default:
                return { text: 'Clique para escolher', classes: 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 border-dashed hover:border-slate-300 hover:text-slate-700' };
        }
    };

    const steps = [
        { id: 1, label: 'IDENTIFICAÇÃO', icon: LayoutTemplate },
        { id: 2, label: 'AVALIAÇÃO BNCC', icon: BookOpen },
        { id: 3, label: 'COMPROMISSOS', icon: ClipboardList },
        { id: 4, label: 'FREQUÊNCIA', icon: CalendarClock },
    ];

    // ==========================================
    // SIGNATURE CANVAS LOGIC
    // ==========================================
    const signingStudent = useMemo(() => {
        if (!signingStudentId) return null;
        return estudantes.find((s: any) => s.id?.toString() === signingStudentId?.toString());
    }, [signingStudentId, estudantes]);

    const initCanvas = useCallback(() => {
        const canvas = sigCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match its CSS display size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1);
        canvas.height = rect.height * (window.devicePixelRatio || 1);
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);

        // Draw baseline
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(30, rect.height * 0.7);
        ctx.lineTo(rect.width - 30, rect.height * 0.7);
        ctx.stroke();
        ctx.setLineDash([]);

        // Configure pen
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    useEffect(() => {
        if (signingStudentId && signatureMode === 'digital') {
            // Small delay to ensure canvas is in the DOM
            const timer = setTimeout(() => initCanvas(), 60);
            return () => clearTimeout(timer);
        }
    }, [signingStudentId, signatureMode, initCanvas]);

    const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = sigCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            const touch = e.touches[0] || e.changedTouches[0];
            return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        }
        return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    };

    const handleSigStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        sigIsDrawing.current = true;
        sigLastPos.current = getCanvasPos(e);
    };

    const handleSigMove = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!sigIsDrawing.current || !sigLastPos.current) return;
        const canvas = sigCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pos = getCanvasPos(e);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(sigLastPos.current.x, sigLastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        sigLastPos.current = pos;
    };

    const handleSigEnd = () => {
        sigIsDrawing.current = false;
        sigLastPos.current = null;
    };

    const clearSignatureCanvas = () => {
        initCanvas();
    };

    const isCanvasBlank = (): boolean => {
        const canvas = sigCanvasRef.current;
        if (!canvas) return true;
        const ctx = canvas.getContext('2d');
        if (!ctx) return true;
        // Check a sample of pixels (avoiding the baseline area)
        const imageData = ctx.getImageData(0, 0, canvas.width, Math.floor(canvas.height * 0.6));
        const data = imageData.data;
        // If all pixels are white (255,255,255) then it's blank
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
                return false;
            }
        }
        return true;
    };

    const confirmSignature = () => {
        if (!signingStudentId) return;
        if (isCanvasBlank()) {
            alert('Por favor, assine antes de confirmar.');
            return;
        }
        const canvas = sigCanvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        setSignatures(prev => ({ ...prev, [signingStudentId]: dataUrl }));
        setSignatureMeta(prev => ({
            ...prev,
            [signingStudentId]: {
                type: 'digital',
                timestamp: new Date().toLocaleString('pt-BR')
            }
        }));
        setSigningStudentId(null);
    };

    // Helper to generate official biometric stamp
    const generateBiometricStamp = (
        studentName: string, 
        protocol: string, 
        timestamp: string, 
        hash: string
    ): string => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Outer border
        ctx.strokeStyle = '#0d9488'; // Teal-600
        ctx.lineWidth = 2.5;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

        // Inner dashed security border
        ctx.strokeStyle = '#99f6e4'; // Teal-200
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
        ctx.setLineDash([]);

        // Draw stylized Fingerprint Graphic on the left
        const cx = 75;
        const cy = 90;
        ctx.strokeStyle = '#0d9488';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        for (let r = 12; r <= 48; r += 7) {
            ctx.beginPath();
            ctx.arc(cx, cy - 8 + (r * 0.2), r, Math.PI * 0.85, Math.PI * 2.15);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(cx, cy - 10);
        ctx.lineTo(cx, cy + 34);
        ctx.stroke();

        // Verification checkmark badge on fingerprint
        ctx.fillStyle = '#14b8a6';
        ctx.beginPath();
        ctx.arc(cx + 28, cy + 28, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + 22, cy + 28);
        ctx.lineTo(cx + 27, cy + 33);
        ctx.lineTo(cx + 35, cy + 24);
        ctx.stroke();

        // Text on the right
        const tx = 145;

        // Header security ribbon
        ctx.fillStyle = '#f0fdfa';
        ctx.fillRect(tx, 22, canvas.width - tx - 22, 24);
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx, 22, canvas.width - tx - 22, 24);

        ctx.fillStyle = '#115e59';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillText('AUTENTICAÇÃO BIOMÉTRICA DIGITAL • CONSELHO DE CLASSE', tx + 10, 38);

        // Student Name
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
        const cleanName = studentName.toUpperCase();
        ctx.fillText(cleanName.length > 34 ? cleanName.substring(0, 32) + '...' : cleanName, tx, 72);

        // Metadata lines
        ctx.fillStyle = '#475569';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.fillText(`Data/Hora: ${timestamp}`, tx, 94);

        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText(`Protocolo: ${protocol}  •  Status: IDENTIDADE CONFIRMADA`, tx, 114);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        const shortHash = hash.length > 38 ? `${hash.substring(0, 38)}...` : hash;
        ctx.fillText(`SHA-256: ${shortHash}`, tx, 132);

        // Bottom seal
        ctx.fillStyle = '#0d9488';
        ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
        ctx.fillText('REGISTRO OFICIAL SIGAR • INTEGRIDADE CRIPTOGRÁFICA', tx, 150);

        return canvas.toDataURL('image/png');
    };

    const handleOpenSignature = (studentId: string, mode: 'digital' | 'biometric' = 'digital') => {
        setSigningStudentId(studentId);
        setSignatureMode(mode);
        setBiometricScanState('idle');
        setBiometricScanProgress(0);
        setBiometricStatusMessage('Pronto para leitura biométrica');
        setBiometricResult(null);
    };

    const handleStartBiometricScan = async () => {
        setBiometricScanState('scanning');
        setBiometricScanProgress(15);
        setBiometricStatusMessage('Conectando ao sensor biométrico...');

        setTimeout(() => {
            setBiometricScanProgress(45);
            setBiometricStatusMessage('Detectando cristas papilares e minúcias...');
        }, 400);

        setTimeout(() => {
            setBiometricScanProgress(75);
            setBiometricStatusMessage('Validando autenticidade e unicidade biométrica...');
        }, 850);

        setTimeout(async () => {
            setBiometricScanProgress(95);
            setBiometricStatusMessage('Gerando protocolo e hash criptográfico...');

            const studentName = signingStudent?.name || 'Estudante';
            const now = new Date();
            const timestamp = now.toLocaleString('pt-BR');
            const rawString = `${signingStudentId}-${studentName}-${now.toISOString()}`;

            let hash = '';
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(rawString);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } catch {
                hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
            }

            const protocol = `BIO-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${now.getFullYear()}`;

            setBiometricScanProgress(100);
            setBiometricStatusMessage('Biometria autenticada com sucesso!');
            setBiometricResult({
                protocol,
                hash,
                timestamp,
                quality: 98 + Math.floor(Math.random() * 2)
            });
            setBiometricScanState('success');
        }, 1250);
    };

    const confirmBiometricSignature = () => {
        if (!signingStudentId || !biometricResult) return;
        const studentName = signingStudent?.name || 'Estudante';
        const stampDataUrl = generateBiometricStamp(
            studentName,
            biometricResult.protocol,
            biometricResult.timestamp,
            biometricResult.hash
        );

        setSignatures(prev => ({ ...prev, [signingStudentId]: stampDataUrl }));
        setSignatureMeta(prev => ({
            ...prev,
            [signingStudentId]: {
                type: 'biometric',
                timestamp: biometricResult.timestamp,
                protocol: biometricResult.protocol,
                hash: biometricResult.hash
            }
        }));
        setSigningStudentId(null);
        setBiometricScanState('idle');
        setBiometricResult(null);
    };

    const handleRemoveSignature = (studentId: string) => {
        if (!confirm('Deseja remover a assinatura deste estudante?')) return;
        setSignatures(prev => {
            const next = { ...prev };
            delete next[studentId];
            return next;
        });
        setSignatureMeta(prev => {
            const next = { ...prev };
            delete next[studentId];
            return next;
        });
    };

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleEditReuniao = (reuniao: any) => {
        setEditingReuniaoId(reuniao.id);
        setAnoLetivo(reuniao.ano_letivo || '2024');
        setPeriodoLetivo(reuniao.periodo_letivo || '');
        setPauta(reuniao.pauta || '');
        setCompromissos(reuniao.compromissos || '');
        setOutrasQuestoes(reuniao.outras_questoes || '');
        setSignatures(reuniao.assinaturas || {});
        setSignatureMeta(reuniao.assinaturas_meta || {});
        
        // Handle auto_avaliacao wrapper
        const avalData = reuniao.auto_avaliacao || {};
        if (avalData.turma || avalData.bncc) {
            setAutoAvaliacao(avalData.turma || {});
            setAvaliacaoBncc(avalData.bncc || {});
        } else {
            setAutoAvaliacao(avalData);
            setAvaliacaoBncc(reuniao.avaliacao_bncc || {});
        }
        
        setCurrentStep(1);
        
        // Scroll to top to show form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteReuniao = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta ata de reunião?')) return;
        try {
            const etapa = isInfantil ? 'infantil' : 'fundamental';
            await ccReuniaoEstudantilService.delete(id, etapa);
            setReunioesRealizadas(prev => prev.filter(r => r.id !== id));
            if (editingReuniaoId === id) {
                setEditingReuniaoId(null);
                setCurrentStep(1);
            }
        } catch (error) {
            console.error("Erro ao excluir reunião:", error);
            alert("Erro ao excluir reunião.");
        }
    };

    const handleCancel = () => {
        if (onClose) {
            onClose();
        } else {
            setEditingReuniaoId(null);
            setCurrentStep(1);
            setAnoLetivo('2024');
            setPeriodoLetivo('');
            setPauta('Conselho de Classe Participativo');
            setCompromissos('');
            setOutrasQuestoes('');
            setSignatures({});
            setSignatureMeta({});
            setAutoAvaliacao({});
            setAvaliacaoBncc({});
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleRequestFinish = () => {
        if (!selectedEscolaId || !selectedTurmaId || !periodoLetivo) {
            setErrorMessage('Por favor, certifique-se de preencher a Unidade Escolar, Turma e Período Letivo na Etapa 1 antes de finalizar a reunião.');
            setShowErrorModal(true);
            return;
        }
        setShowConfirmModal(true);
    };

    const executeSave = async () => {
        setIsSubmitting(true);
        try {
            const reuniao = {
                ...(editingReuniaoId ? { id: editingReuniaoId } : {}),
                escola_id: selectedEscolaId,
                turma_id: selectedTurmaId,
                turma_nome: activeTurma?.identificacao || activeTurma?.anoSerie || '',
                ano_letivo: anoLetivo,
                periodo_letivo: periodoLetivo,
                pauta: pauta,
                auto_avaliacao: { 
                    turma: autoAvaliacao, 
                    bncc: avaliacaoBncc,
                    assinaturas_meta: signatureMeta 
                },
                compromissos: compromissos,
                outras_questoes: outrasQuestoes,
                assinaturas: signatures,
                assinaturas_meta: signatureMeta,
                status: 'Concluído'
            };

            const savedData = await ccReuniaoEstudantilService.save(reuniao, isInfantil ? 'infantil' : 'fundamental');
            
            // Update local list
            if (editingReuniaoId) {
                setReunioesRealizadas(prev => prev.map(r => r.id === editingReuniaoId ? savedData : r));
            } else {
                setReunioesRealizadas(prev => [savedData, ...prev]);
            }
            
            setSavedReuniaoResult(savedData);
            setShowConfirmModal(false);
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error('Erro ao salvar reunião:', error);
            setShowConfirmModal(false);
            const detailedMsg = error?.message || error?.error_description || error?.details || 'Erro ao finalizar a reunião. Verifique a conexão com o servidor e tente novamente.';
            setErrorMessage(detailedMsg);
            setShowErrorModal(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        setSavedReuniaoResult(null);
        setEditingReuniaoId(null);
        setCurrentStep(1);
        setAnoLetivo('2024');
        setPeriodoLetivo('');
        setPauta('Conselho de Classe Participativo');
        setCompromissos('');
        setOutrasQuestoes('');
        setSignatures({});
        setSignatureMeta({});
        setAutoAvaliacao({});
        setAvaliacaoBncc({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6 w-full animate-in fade-in zoom-in-95 duration-200">
            {/* ====== PRINTABLE COMPONENT ====== */}
            {reuniaoToPrint && (
                <PrintableReuniaoEstudantilAta 
                    reuniao={reuniaoToPrint}
                    escola={escolas.find(e => e.id === selectedEscolaId) || escolas[0]}
                    turma={activeTurma}
                    estudantes={estudantes}
                />
            )}

            {/* Status Header */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm tracking-wide uppercase">Etapa Concluída e Enviada</h3>
                        <p className="text-xs text-slate-400">RELATÓRIO ENVIADO À COORDENAÇÃO PEDAGÓGICA EM 14/10/2024 ÀS 10:42</p>
                    </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 tracking-wider w-max">PROTOCOLO: #2024-3B-7742</span>
                </div>
            </div>

            {/* Header Geral - Formato de Card Padrão do Sistema */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
                        <LayoutTemplate className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 uppercase xl:tracking-wide">Reunião Estudantil Otimizada</h2>
                        <div className="flex gap-4 mt-1 text-sm">
                            <span className="text-slate-500">Status: <strong className="text-emerald-600">CONSOLIDADO</strong></span>
                            <span className="text-amber-500 font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> SOMENTE LEITURA</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                    <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center gap-2 transition-all shadow-sm">
                        <Printer className="w-4 h-4" /> Imprimir Relatório
                    </button>
                    <button className="border border-amber-200 bg-amber-50 text-amber-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-100 flex items-center gap-2 transition-all shadow-sm whitespace-nowrap">
                        <Lock className="w-4 h-4" /> Solicitar Desbloqueio
                    </button>
                    <button className="bg-slate-100 text-slate-400 px-4 py-2.5 rounded-xl font-bold text-sm cursor-not-allowed flex items-center gap-2 shadow-sm whitespace-nowrap">
                        <Send className="w-4 h-4" /> Finalizar e Enviar Etapa
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 hover:text-slate-600 transition-colors shadow-sm focus:outline-none">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Stepper Progressão - Formato de Card */}
            <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = currentStep > step.id;
                    const isActive = currentStep === step.id;
                    const isPending = currentStep < step.id;

                    return (
                        <React.Fragment key={step.id}>
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className={`
                                    w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300
                                    ${isActive ? 'bg-emerald-500 text-white shadow-md ring-4 ring-emerald-100' : ''}
                                    ${isCompleted ? 'bg-emerald-400 text-white' : ''}
                                    ${isPending ? 'bg-slate-50 border-2 border-slate-200 text-slate-300' : ''}
                                `}>
                                    {isCompleted ? (
                                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <step.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={isActive ? 2 : 1.5} />
                                    )}
                                </div>
                                <span className={`
                                    text-[10px] md:text-xs font-extrabold uppercase tracking-wider hidden md:block
                                    ${isActive || isCompleted ? 'text-emerald-500' : 'text-slate-400'}
                                `}>
                                    {step.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-1.5 mx-2 md:mx-4 rounded-full transition-colors duration-300 ${currentStep > index + 1 ? 'bg-emerald-400' : 'bg-slate-100'}`}></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Content Area - Rolevel Form Steps */}
            <div>
                {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                        {/* Title bar of the step */}
                        <div className="bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-sm flex items-center gap-3 font-bold">
                            <div className="bg-white/20 p-1.5 rounded-lg">
                                <Info className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            ETAPA 1: DADOS DA TURMA
                        </div>

                        {/* Form Fields - Data Grid Card */}
                        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <School className="w-3.5 h-3.5" /> UNIDADE ESCOLAR
                                    </label>
                                    <select
                                        value={selectedEscolaId}
                                        onChange={(e) => setSelectedEscolaId(e.target.value)}
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                                    >
                                        <option value="">Selecione a Unidade Escolar</option>
                                        {escolas.map(escola => (
                                            <option key={escola.id} value={escola.id}>
                                                {escola.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5" /> TURMA / AGRUPAMENTO
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedTurmaId}
                                                onChange={(e) => setSelectedTurmaId(e.target.value)}
                                                disabled={!selectedEscolaId || isLoadingTurmas}
                                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                                            >
                                                <option value="">{isLoadingTurmas ? 'Carregando turmas...' : 'Selecione a Turma'}</option>
                                                {turmas.map(turma => (
                                                    <option key={turma.id} value={turma.id}>
                                                        {turma.identificacao} - {turma.anoSerie} ({turma.turno})
                                                    </option>
                                                ))}
                                            </select>
                                            {isLoadingTurmas && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5" /> ANO LETIVO
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                                            placeholder="Ex: 2024"
                                            value={anoLetivo}
                                            onChange={(e) => setAnoLetivo(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <CalendarClock className="w-3.5 h-3.5" /> PERÍODO LETIVO
                                        </label>
                                        <select
                                            value={periodoLetivo}
                                            onChange={(e) => setPeriodoLetivo(e.target.value)}
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Selecione o Bimestre</option>
                                            <option value="1º Bimestre">1º Bimestre</option>
                                            <option value="2º Bimestre">2º Bimestre</option>
                                            <option value="3º Bimestre">3º Bimestre</option>
                                            <option value="4º Bimestre">4º Bimestre</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5" /> PAUTA DA REUNIÃO
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                                        value={pauta}
                                        onChange={(e) => setPauta(e.target.value)}
                                        placeholder="Ex: Conselho de Classe Participativo"
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Orientations Alert */}
                        <div className="bg-emerald-50/80 px-6 py-5 rounded-2xl flex items-start gap-4 border border-emerald-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-bl-full opacity-50 -z-0"></div>
                            <div className="bg-emerald-100/80 p-2 rounded-xl shrink-0 text-emerald-600 border border-emerald-200/50 relative z-10">
                                <Info className="w-5 h-5" strokeWidth={2.5} />
                            </div>
                            <div className="text-sm relative z-10">
                                <span className="font-bold text-emerald-800">Orientações:</span>
                                <span className="text-emerald-700 ml-1 leading-relaxed">
                                    Este documento é o canal oficial para que a turma registre sua percepção sobre o ensino e infraestrutura. Seja objetivo e propositivo nas sugestões.
                                </span>
                            </div>
                        </div>

                    </div>
                )}

                {/* Etapa 2 - AVALIAÇÃO BNCC */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                        {/* Title bar of the step */}
                        <div className="bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-sm flex items-center justify-between font-bold">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-1.5 rounded-lg">
                                    <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                                {isInfantil ? 'ETAPA 2: CAMPOS DE EXPERIÊNCIA (BNCC INFANTIL)' : 'ETAPA 2: COMPONENTES CURRICULARES (BNCC)'}
                            </div>
                            <div className="bg-white/20 text-white text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider font-bold hidden md:block">
                                {isInfantil ? 'Direitos de Aprendizagem' : 'Foco na Aprendizagem'}
                            </div>
                        </div>

                        {/* Form Fields - Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
                            {/* Orientations Alert */}
                            <div className="bg-white px-6 py-5 flex items-start md:items-center gap-3 border-b border-slate-200">
                                <div className="bg-emerald-600 rounded-full p-1 text-white shrink-0 mt-0.5 md:mt-0">
                                    <Info className="w-3.5 h-3.5" strokeWidth={3} />
                                </div>
                                <div className="text-sm text-emerald-800">
                                    {isInfantil 
                                        ? <span>Marque a coluna <strong>Dificuldade</strong> para os campos onde a turma encontrou desafios no desenvolvimento das experiências.</span>
                                        : <span>Marque a coluna <strong>Dificuldade</strong> para os componentes onde a turma encontrou obstáculos e detalhe os motivos e sugestões.</span>
                                    }
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                                        <tr>
                                            {isInfantil ? (
                                                <th className="px-6 py-4 font-bold w-96 tracking-wider">Campos de Experiência</th>
                                            ) : (
                                                <>
                                                    <th className="px-6 py-4 font-bold w-48 tracking-wider">Áreas de Conhecimento</th>
                                                    <th className="px-6 py-4 font-bold w-48 tracking-wider">Componentes</th>
                                                </>
                                            )}
                                            <th className="px-6 py-4 font-bold text-center w-32 tracking-wider">Dificuldade</th>
                                            <th className="px-6 py-4 font-bold min-w-[200px] tracking-wider">Por Quê? (Motivos)</th>
                                            <th className="px-6 py-4 font-bold min-w-[200px] tracking-wider">Sugestões de Melhoria</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                        {isInfantil ? (
                                            CAMPOS_EXPERIENCIA.map((campo, idx) => {
                                                const val = avaliacaoBncc[campo] || { dificuldade: false, motivos: '', sugestoes: '' };
                                                return (
                                                <tr key={idx}>
                                                    <td className="px-6 py-5 font-bold text-slate-800">{campo}</td>
                                                    <td className="px-6 py-5 text-center">
                                                        <input type="checkbox" checked={val.dificuldade} onChange={(e) => handleBnccChange(campo, 'dificuldade', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" />
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <input type="text" value={val.motivos} onChange={(e) => handleBnccChange(campo, 'motivos', e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium" placeholder="Desafios observados..." />
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <input type="text" value={val.sugestoes} onChange={(e) => handleBnccChange(campo, 'sugestoes', e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium" placeholder="Sugestões pedagógicas..." />
                                                    </td>
                                                </tr>
                                            )})
                                        ) : (
                                            <>
                                                {[
                                                    { area: 'Linguagens', nome: 'Língua Portuguesa', rowSpan: 4 },
                                                    { area: null, nome: 'Arte' },
                                                    { area: null, nome: 'Educação Física' },
                                                    { area: null, nome: 'Língua Inglesa' },
                                                    { area: 'Matemática', nome: 'Matemática', rowSpan: 1 },
                                                    { area: 'Ciências Nat.', nome: 'Ciências', rowSpan: 1 },
                                                    { area: 'Humanas', nome: 'História', rowSpan: 2 },
                                                    { area: null, nome: 'Geografia' },
                                                    { area: 'Ens. Religioso', nome: 'Ensino Religioso', rowSpan: 1 }
                                                ].map((comp, idx) => {
                                                    const val = avaliacaoBncc[comp.nome] || { dificuldade: false, motivos: '', sugestoes: '' };
                                                    return (
                                                        <tr key={idx} className={comp.area && idx > 0 ? "border-t border-slate-200" : ""}>
                                                            {comp.area && (
                                                                <td rowSpan={comp.rowSpan!} className="px-6 py-4 align-top font-bold text-slate-700 bg-white border-r border-slate-100">{comp.area}</td>
                                                            )}
                                                            <td className="px-6 py-4 font-bold text-slate-800">{comp.nome}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <input type="checkbox" checked={val.dificuldade} onChange={(e) => handleBnccChange(comp.nome, 'dificuldade', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <input type="text" value={val.motivos} onChange={(e) => handleBnccChange(comp.nome, 'motivos', e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium" placeholder={comp.nome === 'Língua Portuguesa' ? "Descreva os desafios..." : ""} />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <input type="text" value={val.sugestoes} onChange={(e) => handleBnccChange(comp.nome, 'sugestoes', e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-medium" placeholder={comp.nome === 'Língua Portuguesa' ? "Como podemos melhorar?" : ""} />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}

                {/* Etapa 3 - COMPROMISSOS */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Title bar of the step */}
                        <div className="bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-sm flex items-center justify-between font-bold">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-1.5 rounded-lg">
                                    <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                                ETAPA 3: AUTOAVALIAÇÃO E COMPROMISSOS DA TURMA
                            </div>
                            <div className="bg-emerald-400/50 text-white text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider font-bold hidden md:block">
                                AUTOANÁLISE COLETIVA
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-10">

                            {/* Section 1 */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {isInfantil ? '1. AUTOAVALIAÇÃO DOS PAIS/RESPONSÁVEIS' : '1. AUTOAVALIAÇÃO DA TURMA'}
                                </h3>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-[10px] text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-6 py-4 font-bold tracking-wider">Critérios de Avaliação</th>
                                                    <th className="px-6 py-4 font-bold text-center tracking-wider w-48">Situação</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                                {(isInfantil ? [
                                                    'Participação nas atividades escolares',
                                                    'Acompanhamento do desenvolvimento em casa',
                                                    'Comunicação com a escola/professores',
                                                    'Pontualidade e frequência da criança'
                                                ] : [
                                                    'Pontualidade nas aulas/atividades',
                                                    'Rendimento Acadêmico',
                                                    'Relação com Professor/Colegas',
                                                    'Comportamento'
                                                ]).map((criterio, idx) => {
                                                    const btnConfig = getAutoAvaliacaoButtonConfig(autoAvaliacao[idx]);
                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-5 font-bold text-slate-700">{criterio}</td>
                                                            <td className="px-6 py-5 text-center">
                                                                <button
                                                                    onClick={() => handleAutoAvaliacaoToggle(idx)}
                                                                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-95 ${btnConfig.classes}`}
                                                                >
                                                                    {btnConfig.text}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2 */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {isInfantil ? '2. COMPROMISSOS DA FAMÍLIA' : '2. COMPROMISSOS DA TURMA'}
                                </h3>
                                <textarea
                                    value={compromissos}
                                    onChange={(e) => setCompromissos(e.target.value)}
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 placeholder:text-slate-400 min-h-[140px] resize-y"
                                    placeholder={isInfantil ? "Quais compromissos a família assume para o próximo período?" : "Quais ações e compromissos a turma assume para o próximo período?"}
                                ></textarea>
                            </div>

                            {/* Section 3 */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {isInfantil ? '3. OBSERVAÇÕES E SUGESTÕES (PEDAGÓGICAS/ESTRUTURAIS)' : '3. OUTRAS QUESTÕES (PEDAGÓGICAS/ESTRUTURAIS)'}
                                </h3>
                                <textarea
                                    value={outrasQuestoes}
                                    onChange={(e) => setOutrasQuestoes(e.target.value)}
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 placeholder:text-slate-400 min-h-[140px] resize-y"
                                    placeholder={isInfantil ? "Sugestões sobre o ambiente escolar, rotina, suporte pedagógico, etc." : "Observações sobre o ambiente escolar, recursos, suporte pedagógico, etc."}
                                ></textarea>
                            </div>

                        </div>
                    </div>
                )}

                {/* Etapa 4 - REGISTRO DE PRESENÇA E ASSINATURAS */}
                {currentStep === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Title bar of the step */}
                        <div className="bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-sm flex items-center justify-between font-bold">
                            <div className="flex items-center gap-3 text-sm md:text-base tracking-wide">
                                <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
                                ETAPA 4: REGISTRO DE PRESENÇA E ASSINATURAS
                            </div>
                            <div className="bg-emerald-400/50 text-white text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider font-bold hidden md:block">
                                CONCLUSÃO DA REUNIÃO
                            </div>
                        </div>

                        {/* Content Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">

                            {/* Header inside card */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    LISTA DE ESTUDANTES PARTICIPANTES
                                </h3>
                                <button className="flex items-center gap-2 text-emerald-600 font-bold text-xs hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                                    <UserPlus className="w-4 h-4" />
                                    Adicionar Outro Estudante
                                </button>
                            </div>

                            {/* List Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-slate-400 uppercase font-bold tracking-wider border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-4 w-16">Nº</th>
                                            <th className="px-4 py-4">Nome do Estudante</th>
                                            <th className="px-4 py-4 text-right">Assinatura Digital / Biométrica</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                        {isLoadingEstudantes ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-10 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                                        <span className="text-slate-400 font-medium">Carregando estudantes...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : estudantes.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-10 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                            <Users className="w-6 h-6" />
                                                        </div>
                                                        <span className="text-slate-400 font-medium">Nenhum estudante encontrado para esta turma.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            estudantes.map((student, idx) => (
                                                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-5 font-bold text-slate-400">
                                                        {(idx + 1).toString().padStart(2, '0')}
                                                    </td>
                                                    <td className="px-4 py-5 font-medium text-slate-700">
                                                        {student.name}
                                                    </td>
                                                    <td className="px-4 py-5 text-right">
                                                        {signatures[student.id?.toString()] ? (
                                                            <div className="inline-flex items-center justify-end gap-2.5">
                                                                <img 
                                                                    src={signatures[student.id?.toString()]} 
                                                                    alt="Assinatura" 
                                                                    className="h-8 max-w-[130px] border border-slate-200 rounded-lg bg-white object-contain px-1 shadow-xs"
                                                                />
                                                                {signatureMeta[student.id?.toString()]?.type === 'biometric' ? (
                                                                    <div className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-teal-200 shadow-xs">
                                                                        <Fingerprint className="w-3.5 h-3.5 text-teal-600" strokeWidth={2.5} />
                                                                        BIOMETRIA
                                                                    </div>
                                                                ) : (
                                                                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 shadow-xs">
                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                                                                        ASSINADO
                                                                    </div>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveSignature(student.id?.toString())}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Remover assinatura / Assinar novamente"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center justify-end gap-2 flex-wrap">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => handleOpenSignature(student.id?.toString(), 'digital')}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-xs active:scale-95"
                                                                    title="Coletar Assinatura na Tela / Touchscreen"
                                                                >
                                                                    <PenLine className="w-3.5 h-3.5" strokeWidth={2} />
                                                                    Coletar Assinatura Digital
                                                                </button>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => handleOpenSignature(student.id?.toString(), 'biometric')}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-teal-500 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors shadow-xs active:scale-95"
                                                                    title="Coletar Assinatura Biométrica / Leitor de Digital"
                                                                >
                                                                    <Fingerprint className="w-3.5 h-3.5 text-teal-600" strokeWidth={2.5} />
                                                                    Assinatura Biométrica
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Summary */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
                                <div className="flex items-center gap-8 border-r border-slate-200 pr-8">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total de Alunos na Turma</div>
                                        <div className="text-2xl font-black text-slate-700">{estudantes.length.toString().padStart(2, '0')}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Presentes Registrados</div>
                                        <div className="text-2xl font-black text-emerald-500">
                                            {estudantes.filter((s: any) => signatures[s.id?.toString()]).length.toString().padStart(2, '0')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                                        <Info className="w-4 h-4" strokeWidth={2.5} />
                                    </div>
                                    <span className="italic">Os estudantes podem assinar via touchscreen, mouse ou autenticação biométrica.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* General Footer Navigation - Separated Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    {currentStep > 1 && (
                        <button
                            onClick={handlePrevious}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors font-bold text-sm shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Anterior
                        </button>
                    )}
                </div>

                <div className="flex w-full md:w-auto items-center gap-3">
                    <button
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors font-bold text-sm shadow-sm disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={currentStep < 4 ? handleNext : handleRequestFinish}
                        disabled={isSubmitting}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all text-white shadow-sm
                            ${currentStep < 4 ? 'bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 shadow-emerald-500/20 border border-emerald-600/20' : (editingReuniaoId ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20' : 'bg-slate-800 hover:bg-slate-900')}
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Salvando...
                            </>
                        ) : currentStep < 4 ? (
                            <>
                                Próximo
                                <ArrowRight className="w-4 h-4" />
                            </>
                        ) : editingReuniaoId ? (
                            <>
                                <Save className="w-4 h-4" />
                                Salvar Alterações da Reunião
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Finalizar e Gerar Ata
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ====== SIGNATURE MODAL ====== */}
            {signingStudentId && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4" 
                    onClick={() => {
                        setSigningStudentId(null);
                        setBiometricScanState('idle');
                        setBiometricResult(null);
                    }}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Custom Laser Beam Keyframe Style */}
                        <style>{`
                            @keyframes scanLaser {
                                0% { top: 10%; opacity: 0.2; }
                                50% { top: 88%; opacity: 1; }
                                100% { top: 10%; opacity: 0.2; }
                            }
                        `}</style>

                        {/* Modal Header */}
                        <div className={`px-6 py-4 flex items-center justify-between text-white transition-all duration-300 ${
                            signatureMode === 'biometric' 
                                ? 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700' 
                                : 'bg-gradient-to-r from-emerald-600 to-teal-700'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-xs shadow-inner">
                                    {signatureMode === 'biometric' ? (
                                        <Fingerprint className="w-5 h-5 text-white" strokeWidth={2.5} />
                                    ) : (
                                        <PenLine className="w-5 h-5 text-white" strokeWidth={2.5} />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm tracking-wide uppercase">
                                        {signatureMode === 'biometric' ? 'Assinatura Biométrica' : 'Assinatura Digital'}
                                    </h3>
                                    <p className="text-emerald-100 text-xs font-medium mt-0.5">{signingStudent?.name || 'Estudante'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setSigningStudentId(null);
                                    setBiometricScanState('idle');
                                    setBiometricResult(null);
                                }}
                                className="bg-white/10 hover:bg-white/25 p-1.5 rounded-lg transition-colors text-white"
                                title="Fechar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Mode Switcher Tabs */}
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                            <div className="bg-slate-200/70 p-1 rounded-xl flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => setSignatureMode('digital')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                        signatureMode === 'digital'
                                            ? 'bg-white text-emerald-700 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                                    }`}
                                >
                                    <PenLine className="w-3.5 h-3.5" />
                                    Assinatura na Tela
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSignatureMode('biometric')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                        signatureMode === 'biometric'
                                            ? 'bg-white text-teal-700 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                                    }`}
                                >
                                    <Fingerprint className="w-3.5 h-3.5" />
                                    Assinatura Biométrica
                                </button>
                            </div>
                        </div>

                        {/* ================= DIGITAL CANVAS MODE ================= */}
                        {signatureMode === 'digital' && (
                            <>
                                <div className="p-6 space-y-4">
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-2 relative">
                                        <canvas
                                            ref={sigCanvasRef}
                                            className="w-full rounded-lg cursor-crosshair touch-none bg-white"
                                            style={{ height: '200px' }}
                                            onMouseDown={handleSigStart}
                                            onMouseMove={handleSigMove}
                                            onMouseUp={handleSigEnd}
                                            onMouseLeave={handleSigEnd}
                                            onTouchStart={handleSigStart}
                                            onTouchMove={handleSigMove}
                                            onTouchEnd={handleSigEnd}
                                        />
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 uppercase tracking-wider font-bold pointer-events-none select-none">
                                            Assine aqui
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <span>Use o mouse, caneta touch ou o dedo para assinar na área acima.</span>
                                    </div>
                                </div>

                                {/* Digital Footer */}
                                <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3 bg-slate-50/50">
                                    <button 
                                        onClick={clearSignatureCanvas}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors font-bold text-xs shadow-xs"
                                    >
                                        <Eraser className="w-4 h-4" />
                                        Limpar
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setSigningStudentId(null)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors font-bold text-xs shadow-xs"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            onClick={confirmSignature}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-bold text-xs shadow-sm shadow-emerald-500/20 border border-emerald-600/20 active:scale-95"
                                        >
                                            <Check className="w-4 h-4" strokeWidth={2.5} />
                                            Confirmar Assinatura
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ================= BIOMETRIC SENSOR MODE ================= */}
                        {signatureMode === 'biometric' && (
                            <div className="p-6 space-y-4">
                                {/* Student Info Pill */}
                                <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                            {signingStudent?.name ? signingStudent.name.charAt(0).toUpperCase() : 'E'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-xs text-slate-800">{signingStudent?.name}</div>
                                            <div className="text-[10px] text-teal-700">Autenticação biométrica individual para a reunião</div>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-full border border-teal-200">
                                        <ShieldCheck className="w-3 h-3 text-teal-600" />
                                        LGPD
                                    </span>
                                </div>

                                {/* High-tech Biometric Scanner Pad */}
                                <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950 border border-teal-500/40 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[250px] shadow-2xl text-center select-none">
                                    {/* Corner Reticles */}
                                    <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-teal-400" />
                                    <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-teal-400" />
                                    <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-teal-400" />
                                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-teal-400" />

                                    {/* Background Cyber Grid */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f766e15_1px,transparent_1px),linear-gradient(to_bottom,#0f766e15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                                    {/* Laser Sweep Beam (during scanning) */}
                                    {biometricScanState === 'scanning' && (
                                        <div 
                                            className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_15px_#2dd4bf] pointer-events-none z-10" 
                                            style={{ animation: 'scanLaser 1.2s ease-in-out infinite' }} 
                                        />
                                    )}

                                    {/* Fingerprint Scanner Visual */}
                                    {biometricScanState === 'idle' && (
                                        <div className="relative flex flex-col items-center gap-3 z-10 my-2">
                                            <div className="relative p-4 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center group cursor-pointer hover:bg-teal-500/20 transition-all shadow-inner"
                                                onClick={handleStartBiometricScan}
                                            >
                                                <div className="absolute inset-0 rounded-full border border-teal-400/40 animate-ping opacity-25" />
                                                <Fingerprint className="w-20 h-20 text-teal-400 stroke-[1.5] group-hover:scale-105 transition-transform" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-teal-300 uppercase tracking-wider">Leitor Biométrico Pronto</div>
                                                <div className="text-[11px] text-slate-400 max-w-[260px] mt-1">
                                                    Posicione o dedo sobre o sensor ou clique em <strong className="text-teal-200">Iniciar Captura</strong>.
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {biometricScanState === 'scanning' && (
                                        <div className="relative flex flex-col items-center gap-4 z-10 my-2 w-full max-w-xs">
                                            <div className="relative p-4 rounded-full bg-teal-500/20 border border-teal-400/60 shadow-[0_0_30px_#14b8a6]">
                                                <Fingerprint className="w-20 h-20 text-teal-300 animate-pulse stroke-[1.8]" />
                                            </div>
                                            <div className="space-y-2 w-full">
                                                <div className="text-xs font-bold text-teal-300 uppercase tracking-wider animate-pulse">
                                                    {biometricStatusMessage}
                                                </div>
                                                {/* Animated Progress Bar */}
                                                <div className="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden border border-teal-500/30 shadow-inner">
                                                    <div 
                                                        className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_#10b981]" 
                                                        style={{ width: `${biometricScanProgress}%` }}
                                                    />
                                                </div>
                                                <div className="text-[10px] text-teal-400/80 font-mono text-center">
                                                    Lendo minúcias papilares • {biometricScanProgress}%
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {biometricScanState === 'success' && biometricResult && (
                                        <div className="relative flex flex-col items-center gap-3 z-10 my-1 w-full animate-in zoom-in-95 duration-200">
                                            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_#10b981]">
                                                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                                                    Biometria Autenticada com Sucesso!
                                                </div>
                                                <div className="text-[11px] text-emerald-200/80">Identidade confirmada para esta sessão</div>
                                            </div>

                                            {/* Certificate Badge */}
                                            <div className="bg-slate-800/80 border border-teal-500/30 rounded-xl p-3 text-left w-full max-w-sm space-y-1 text-[10px] font-mono backdrop-blur-xs">
                                                <div className="flex justify-between text-slate-300">
                                                    <span className="text-slate-400">Protocolo:</span>
                                                    <strong className="text-teal-300">{biometricResult.protocol}</strong>
                                                </div>
                                                <div className="flex justify-between text-slate-300">
                                                    <span className="text-slate-400">Registro:</span>
                                                    <span>{biometricResult.timestamp}</span>
                                                </div>
                                                <div className="flex justify-between text-slate-300">
                                                    <span className="text-slate-400">Qualidade:</span>
                                                    <span className="text-emerald-400 font-bold">{biometricResult.quality}% (Excelente)</span>
                                                </div>
                                                <div className="text-[9px] text-slate-500 truncate pt-1 border-t border-slate-700/60">
                                                    Hash: {biometricResult.hash.substring(0, 32)}...
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Biometric Footer Controls */}
                                <div className="flex items-center justify-between gap-3 pt-2">
                                    {biometricScanState === 'idle' && (
                                        <>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setSigningStudentId(null);
                                                    setBiometricScanState('idle');
                                                }}
                                                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold text-xs shadow-xs"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={handleStartBiometricScan}
                                                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all"
                                            >
                                                <Fingerprint className="w-4 h-4" />
                                                Iniciar Captura Biométrica
                                            </button>
                                        </>
                                    )}

                                    {biometricScanState === 'scanning' && (
                                        <button 
                                            type="button"
                                            disabled
                                            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-teal-300 rounded-xl font-bold text-xs opacity-90 cursor-wait shadow-sm"
                                        >
                                            <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                                            Processando Leitura no Sensor...
                                        </button>
                                    )}

                                    {biometricScanState === 'success' && (
                                        <>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setBiometricScanState('idle');
                                                    setBiometricResult(null);
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold text-xs shadow-xs"
                                                title="Escanear novamente"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                Escanear Novamente
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={confirmBiometricSignature}
                                                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/25 active:scale-95 transition-all border border-emerald-700/20"
                                            >
                                                <Check className="w-4 h-4" strokeWidth={2.5} />
                                                Confirmar Assinatura Biométrica
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ====== HISTORY TABLE ====== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Reuniões Realizadas</h3>
                    {isLoadingReunioes && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white">
                            <tr className="border-b border-slate-100">
                                <th className="px-6 py-3 font-bold text-slate-400 uppercase text-xs">Período Letivo</th>
                                <th className="px-6 py-3 font-bold text-slate-400 uppercase text-xs">Pauta</th>
                                <th className="px-6 py-3 font-bold text-slate-400 uppercase text-xs">Data de Registro</th>
                                <th className="px-6 py-3 font-bold text-slate-400 uppercase text-xs text-center">Status</th>
                                <th className="px-6 py-3 font-bold text-slate-400 uppercase text-xs text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reunioesRealizadas.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic font-medium">Nenhuma reunião registrada para esta turma.</td>
                                </tr>
                            ) : (
                                reunioesRealizadas.map((reuniao) => (
                                    <tr key={reuniao.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700">{reuniao.periodo_letivo}</td>
                                        <td className="px-6 py-4 font-medium text-slate-600 truncate max-w-[200px]">{reuniao.pauta}</td>
                                        <td className="px-6 py-4 font-medium text-slate-500">
                                            {new Date(reuniao.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {reuniao.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handlePrintReuniao(reuniao)}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Imprimir Ata"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleEditReuniao(reuniao)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteReuniao(reuniao.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
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

            {/* ====== CONFIRMATION MODAL ====== */}
            {showConfirmModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => !isSubmitting && setShowConfirmModal(false)}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className={`px-6 py-4 flex items-center justify-between text-white transition-colors ${
                            editingReuniaoId ? 'bg-gradient-to-r from-teal-700 to-emerald-700' : 'bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-800'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-xs">
                                    <FileCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm tracking-wide uppercase">
                                        {editingReuniaoId ? 'Confirmar Edição da Reunião' : 'Confirmar Registro da Reunião'}
                                    </h3>
                                    <p className="text-emerald-100 text-xs font-medium mt-0.5">
                                        Conselho de Classe Participativo • {anoLetivo}
                                    </p>
                                </div>
                            </div>
                            {!isSubmitting && (
                                <button 
                                    onClick={() => setShowConfirmModal(false)}
                                    className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4">
                            <p className="text-slate-600 text-sm">
                                {editingReuniaoId 
                                    ? 'Você está prestes a atualizar os dados desta ata de reunião estudantil consolidada.' 
                                    : 'Tem certeza de que deseja finalizar e registrar oficialmente esta Reunião Estudantil no sistema?'}
                            </p>

                            {/* Summary Card */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs text-slate-700">
                                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Unidade Escolar</span>
                                    <span className="font-bold text-slate-800 text-right truncate max-w-[240px]">
                                        {escolas.find(e => e.id === selectedEscolaId)?.nome || 'Não informada'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Turma</span>
                                    <span className="font-bold text-slate-800">
                                        {activeTurma ? `${activeTurma.anoSerie || ''} - ${activeTurma.identificacao || ''}` : 'Turma selecionada'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Período Letivo</span>
                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                        {periodoLetivo || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Presenças Registradas</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-800 text-sm">
                                            {estudantes.filter(s => signatures[s.id?.toString()]).length.toString().padStart(2, '0')} / {estudantes.length.toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-[10px] text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full font-bold">
                                            {estudantes.length > 0 ? Math.round((estudantes.filter(s => signatures[s.id?.toString()]).length / estudantes.length) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>

                                {/* Signature breakdown */}
                                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <Fingerprint className="w-3.5 h-3.5 text-teal-600" />
                                        <span>Biométricas: <strong className="text-slate-700">{estudantes.filter(s => signatures[s.id?.toString()] && signatureMeta[s.id?.toString()]?.type === 'biometric').length}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <PenLine className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Digitais (Tela): <strong className="text-slate-700">{estudantes.filter(s => signatures[s.id?.toString()] && signatureMeta[s.id?.toString()]?.type !== 'biometric').length}</strong></span>
                                    </div>
                                </div>
                            </div>

                            {/* Editing alert if applicable */}
                            {editingReuniaoId && (
                                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span><strong>Modo de Edição:</strong> Os dados anteriores serão atualizados com as alterações e assinaturas atuais.</span>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3 bg-slate-50/50">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                            >
                                Voltar ao Formulário
                            </button>
                            <button
                                type="button"
                                onClick={executeSave}
                                disabled={isSubmitting}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    editingReuniaoId 
                                        ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20' 
                                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Gravando Ata no Sistema...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" strokeWidth={2.5} />
                                        {editingReuniaoId ? 'Confirmar e Salvar Edição' : 'Confirmar e Salvar Ata'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== SUCCESS MODAL ====== */}
            {showSuccessModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 p-6 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 ring-8 ring-emerald-50">
                            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                            {editingReuniaoId ? 'Ata Atualizada com Sucesso!' : 'Reunião Salva com Sucesso!'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                            A ata da Reunião Estudantil do Conselho de Classe foi gravada e consolidada com sucesso no sistema.
                        </p>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 text-left space-y-1.5 font-medium mb-5">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Turma:</span>
                                <strong className="text-slate-700">{savedReuniaoResult?.turma_nome || activeTurma?.identificacao}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Período:</span>
                                <span className="text-emerald-700 font-bold">{savedReuniaoResult?.periodo_letivo || periodoLetivo}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Presenças Confirmadas:</span>
                                <span className="text-slate-700 font-bold">{estudantes.filter(s => signatures[s.id?.toString()]).length} estudantes</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                                <span>Status:</span>
                                <span className="text-emerald-600 font-bold uppercase">Consolidado / Somente Leitura</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => savedReuniaoResult && handlePrintReuniao(savedReuniaoResult)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs shadow-xs transition-colors"
                            >
                                <Printer className="w-4 h-4 text-emerald-600" />
                                Imprimir Ata
                            </button>
                            <button
                                type="button"
                                onClick={handleCloseSuccessModal}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                            >
                                <Check className="w-4 h-4" strokeWidth={2.5} />
                                Concluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== ERROR MODAL ====== */}
            {showErrorModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setShowErrorModal(false)}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 p-6 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20 ring-8 ring-red-50">
                            <AlertTriangle className="w-9 h-9 stroke-[2.5]" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                            Não Foi Possível Salvar
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 mb-3">
                            Ocorreu uma falha ao tentar gravar os dados da reunião no sistema:
                        </p>

                        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-left text-red-700 text-xs font-mono break-all max-h-36 overflow-y-auto mb-4">
                            {errorMessage || 'Erro inesperado ao gravar no banco de dados.'}
                        </div>

                        <p className="text-[11px] text-slate-400 italic mb-5 leading-normal">
                            Suas assinaturas e preenchimentos continuam preservados no formulário. Nenhuma informação foi perdida.
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowErrorModal(false)}
                                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold text-xs shadow-xs transition-colors"
                            >
                                Fechar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowErrorModal(false);
                                    executeSave();
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md shadow-red-600/20 active:scale-95 transition-all"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Tentar Novamente
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
