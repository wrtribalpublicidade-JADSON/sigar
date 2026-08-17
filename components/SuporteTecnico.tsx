import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ConfirmModal } from './ui/ConfirmModal';
import { useNotification } from '../context/NotificationContext';
import {
    LifeBuoy, Plus, Search, Filter, MessageSquare, Clock, CheckCircle2,
    AlertCircle, AlertTriangle, XCircle, Send, User, School, Phone, Mail,
    ExternalLink, RefreshCw, HelpCircle, ChevronDown, ChevronUp, ChevronRight,
    Shield, Calendar, ArrowLeft, Trash2, Tag, Check, MessageCircle,
    Image as ImageIcon, Paperclip, UploadCloud, Maximize2, Eye, Download, X
} from 'lucide-react';
import {
    ChamadoSuporte, MensagemSuporte, StatusSuporte,
    PrioridadeSuporte, CategoriaSuporte, Escola, Coordenador
} from '../types';
import {
    fetchChamados, createChamado, addMensagemChamado,
    updateStatusChamado, updatePrioridadeChamado, deleteChamado
} from '../services/suporteService';

// Helper to format bytes
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Image compression and base64 helper
async function processAndCompressImage(file: File): Promise<{ dataUrl: string; name: string; sizeFormatted: string }> {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('O arquivo selecionado não é uma imagem válida.'));
            return;
        }

        // 15MB limit check before processing
        if (file.size > 15 * 1024 * 1024) {
            reject(new Error('A imagem selecionada excede o limite de 15MB.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const rawDataUrl = e.target?.result as string;
            const img = new Image();
            img.onload = () => {
                const MAX_WIDTH = 1600;
                const MAX_HEIGHT = 1600;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                    if (width > height) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    } else {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Draw white background in case of transparent png to save cleanly
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    const approximateSize = Math.round((compressedDataUrl.length * 3) / 4);
                    resolve({
                        dataUrl: compressedDataUrl,
                        name: file.name || `screenshot_${Date.now()}.jpg`,
                        sizeFormatted: formatFileSize(approximateSize)
                    });
                } else {
                    resolve({
                        dataUrl: rawDataUrl,
                        name: file.name || `screenshot_${Date.now()}.png`,
                        sizeFormatted: formatFileSize(file.size)
                    });
                }
            };
            img.onerror = () => reject(new Error('Não foi possível processar a imagem.'));
            img.src = rawDataUrl;
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo do dispositivo.'));
        reader.readAsDataURL(file);
    });
}

interface SuporteTecnicoProps {
    currentUser?: Coordenador | null;
    isAdmin: boolean;
    userEmail: string | null;
    escolas: Escola[];
    isDemoMode: boolean;
}

const CATEGORIAS: CategoriaSuporte[] = [
    'Erro / Falha no Sistema',
    'Dúvidas de Uso',
    'Cadastro e Permissões',
    'Diário de Classe',
    'Matrículas e Alunos',
    'Sugestão / Melhoria',
    'Outros'
];

const PRIORIDADES: PrioridadeSuporte[] = ['Baixa', 'Média', 'Alta', 'Urgente'];

const FAQ_ITEMS = [
    {
        pergunta: 'Como recuperar ou alterar minha senha de acesso?',
        resposta: 'Na tela de login do SIGAR, clique na opção "Esqueci minha senha" para receber um link de redefinição no seu e-mail cadastrado. Se não receber o link, solicite a redefinição através de um chamado de suporte ou contate o Administrador do sistema.'
    },
    {
        pergunta: 'Como vincular turmas ou componentes curriculares ao meu usuário?',
        resposta: 'A vinculação de turmas e componentes é gerenciada pelo Coordenador Regional ou Administrador. Você pode abrir um chamado na categoria "Cadastro e Permissões" informando sua escola, ano/série e turno desejado.'
    },
    {
        pergunta: 'Como registrar frequência e notas no Diário de Classe?',
        resposta: 'Acesse o menu "Diário de Classe" > "Ensino Fundamental" ou "Educação Infantil". Selecione sua escola, turma e componente. Na aba de Frequência, marque as presenças e faltas e clique em "Salvar". Na aba de Notas, insira os valores bimestrais e confirme o salvamento.'
    },
    {
        pergunta: 'Como emitir atas finais e relatórios gerenciais?',
        resposta: 'No menu lateral, acesse "Relatórios" ou navegue até "Escolas" > selecione a escola desejada > aba "Atas Finais" ou "Documentos". Lá você encontrará opções para visualização e impressão em PDF dos relatórios oficiais.'
    },
    {
        pergunta: 'O que fazer se uma escola não aparecer para mim no sistema?',
        resposta: 'Se você é Coordenador ou Professor e não consegue visualizar sua escola, certifique-se de que seu usuário foi devidamente associado à referida unidade escolar. Abra um chamado de suporte solicitando o vínculo institucional.'
    },
    {
        pergunta: 'Como solicitar ajuste de permissões para acessar novos módulos?',
        resposta: 'O acesso aos módulos segue a matriz de permissões por perfil definida pela gestão da rede. Caso necessite de permissão especial para um instrumental ou relatório, abra um chamado informando a justificativa para avaliação do Administrador.'
    }
];

export const SuporteTecnico: React.FC<SuporteTecnicoProps> = ({
    currentUser,
    isAdmin,
    userEmail,
    escolas,
    isDemoMode
}) => {
    const { showNotification } = useNotification();

    const [activeTab, setActiveTab] = useState<'CHAMADOS' | 'FAQ'>('CHAMADOS');
    const [chamados, setChamados] = useState<ChamadoSuporte[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'ALL' | 'MINE'>(isAdmin ? 'ALL' : 'MINE');

    // Modals
    const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
    const [selectedChamado, setSelectedChamado] = useState<ChamadoSuporte | null>(null);
    const [chamadoToDelete, setChamadoToDelete] = useState<ChamadoSuporte | null>(null);

    // New Ticket Form State
    const [formAssunto, setFormAssunto] = useState<string>('');
    const [formCategoria, setFormCategoria] = useState<CategoriaSuporte>('Dúvidas de Uso');
    const [formPrioridade, setFormPrioridade] = useState<PrioridadeSuporte>('Média');
    const [formEscolaId, setFormEscolaId] = useState<string>('');
    const [formContato, setFormContato] = useState<string>(currentUser?.contato || '');
    const [formDescricao, setFormDescricao] = useState<string>('');
    const [formAnexo, setFormAnexo] = useState<{ dataUrl: string; name: string; sizeFormatted: string } | null>(null);
    const [isUploadingFormImg, setIsUploadingFormImg] = useState<boolean>(false);
    const [isDraggingOverForm, setIsDraggingOverForm] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Message reply in ticket details
    const [replyMessage, setReplyMessage] = useState<string>('');
    const [replyAnexo, setReplyAnexo] = useState<{ dataUrl: string; name: string; sizeFormatted: string } | null>(null);
    const [isUploadingReplyImg, setIsUploadingReplyImg] = useState<boolean>(false);
    const [isSendingReply, setIsSendingReply] = useState<boolean>(false);

    // Lightbox Modal
    const [previewImageModal, setPreviewImageModal] = useState<{ url: string; title: string; filename?: string } | null>(null);

    // File input refs
    const formFileInputRef = useRef<HTMLInputElement>(null);
    const replyFileInputRef = useRef<HTMLInputElement>(null);

    // FAQ state
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
    const [faqSearch, setFaqSearch] = useState<string>('');

    // Escape listener for image preview modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && previewImageModal) {
                setPreviewImageModal(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewImageModal]);

    // Load data
    const loadChamados = async (showRefreshState = false) => {
        if (showRefreshState) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const data = await fetchChamados(
                userEmail,
                isAdmin,
                isDemoMode
            );
            setChamados(data);
        } catch (err) {
            console.error('Erro ao carregar chamados:', err);
            showNotification('error', 'Não foi possível carregar os chamados de suporte.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadChamados();
    }, [userEmail, isAdmin, isDemoMode]);

    // Initial school preselection for form
    useEffect(() => {
        if (currentUser?.escolasIds && currentUser.escolasIds.length > 0) {
            setFormEscolaId(currentUser.escolasIds[0]);
        }
    }, [currentUser]);

    // Metrics
    const metrics = useMemo(() => {
        const total = chamados.length;
        const abertos = chamados.filter(c => c.status === 'Aberto').length;
        const emAtendimento = chamados.filter(c => c.status === 'Em Atendimento').length;
        const resolvidos = chamados.filter(c => c.status === 'Resolvido').length;
        const cancelados = chamados.filter(c => c.status === 'Cancelado').length;
        return { total, abertos, emAtendimento, resolvidos, cancelados };
    }, [chamados]);

    // Filtered Tickets
    const filteredChamados = useMemo(() => {
        return chamados.filter(c => {
            // View Mode filter (Mine vs All)
            if (viewMode === 'MINE' && userEmail) {
                if (c.usuario_email.toLowerCase() !== userEmail.toLowerCase()) {
                    return false;
                }
            }

            // Status filter
            if (statusFilter !== 'ALL' && c.status !== statusFilter) {
                return false;
            }

            // Priority filter
            if (priorityFilter !== 'ALL' && c.prioridade !== priorityFilter) {
                return false;
            }

            // Category filter
            if (categoryFilter !== 'ALL' && c.categoria !== categoryFilter) {
                return false;
            }

            // Search query
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const matchProtocolo = c.protocolo?.toLowerCase().includes(term);
                const matchAssunto = c.assunto?.toLowerCase().includes(term);
                const matchDescricao = c.descricao?.toLowerCase().includes(term);
                const matchUsuario = c.usuario_nome?.toLowerCase().includes(term);
                const matchEmail = c.usuario_email?.toLowerCase().includes(term);
                const matchEscola = c.escola_nome?.toLowerCase().includes(term);
                if (!matchProtocolo && !matchAssunto && !matchDescricao && !matchUsuario && !matchEmail && !matchEscola) {
                    return false;
                }
            }

            return true;
        });
    }, [chamados, viewMode, userEmail, statusFilter, priorityFilter, categoryFilter, searchTerm]);

    // Filtered FAQ
    const filteredFaq = useMemo(() => {
        if (!faqSearch.trim()) return FAQ_ITEMS;
        const term = faqSearch.toLowerCase();
        return FAQ_ITEMS.filter(item =>
            item.pergunta.toLowerCase().includes(term) || item.resposta.toLowerCase().includes(term)
        );
    }, [faqSearch]);

    // Handle image file selection & compression
    const handleImageFileSelect = async (file: File, target: 'FORM' | 'REPLY') => {
        try {
            if (target === 'FORM') setIsUploadingFormImg(true);
            else setIsUploadingReplyImg(true);

            const processed = await processAndCompressImage(file);
            if (target === 'FORM') {
                setFormAnexo(processed);
                showNotification('success', 'Captura de tela anexada com sucesso!');
            } else {
                setReplyAnexo(processed);
                showNotification('success', 'Captura de tela anexada à resposta!');
            }
        } catch (err: any) {
            console.error('Erro ao processar imagem:', err);
            showNotification('error', err?.message || 'Falha ao processar imagem.');
        } finally {
            if (target === 'FORM') setIsUploadingFormImg(false);
            else setIsUploadingReplyImg(false);
        }
    };

    // Handle Paste event for quick screenshot capture (Ctrl+V)
    const handlePaste = (e: React.ClipboardEvent, target: 'FORM' | 'REPLY') => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    e.preventDefault();
                    handleImageFileSelect(file, target);
                    break;
                }
            }
        }
    };

    // Handle Create Ticket
    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formAssunto.trim() || !formDescricao.trim()) {
            showNotification('warning', 'Preencha o assunto e a descrição do chamado.');
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedEscola = escolas.find(esc => esc.id === formEscolaId);

            const novo = await createChamado(
                {
                    usuario_id: currentUser?.id,
                    usuario_nome: currentUser?.nome || userEmail?.split('@')[0] || 'Usuário SIGAR',
                    usuario_email: userEmail || 'usuario@sigar.gov.br',
                    usuario_funcao: currentUser?.funcao || (isAdmin ? 'Administrador' : 'Usuário'),
                    usuario_contato: formContato,
                    escola_id: formEscolaId || undefined,
                    escola_nome: selectedEscola?.nome || undefined,
                    categoria: formCategoria,
                    prioridade: formPrioridade,
                    assunto: formAssunto,
                    descricao: formDescricao,
                    anexo_url: formAnexo?.dataUrl,
                    anexo_nome: formAnexo?.name
                },
                isDemoMode
            );

            showNotification('success', `Chamado aberto com sucesso! Protocolo: ${novo.protocolo}`);
            setIsNewModalOpen(false);
            setFormAssunto('');
            setFormDescricao('');
            setFormAnexo(null);
            await loadChamados();
            setSelectedChamado(novo);
        } catch (err) {
            console.error('Erro ao abrir chamado:', err);
            showNotification('error', 'Falha ao abrir chamado de suporte.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Send Reply
    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChamado || (!replyMessage.trim() && !replyAnexo)) return;

        setIsSendingReply(true);
        try {
            const autorTipo = isAdmin ? 'ADMIN' : 'USUARIO';
            const autorNome = currentUser?.nome || (isAdmin ? 'Administrador SIGAR' : userEmail?.split('@')[0] || 'Usuário');
            const autorEmail = userEmail || 'contato@sigar.gov.br';

            const atualizado = await addMensagemChamado(
                selectedChamado,
                replyMessage.trim() || (replyAnexo ? 'Captura de tela anexada.' : ''),
                autorNome,
                autorEmail,
                autorTipo,
                replyAnexo?.dataUrl,
                replyAnexo?.name,
                isDemoMode
            );

            setSelectedChamado(atualizado);
            setReplyMessage('');
            setReplyAnexo(null);
            showNotification('success', 'Resposta enviada com sucesso!');
            await loadChamados();
        } catch (err) {
            console.error('Erro ao enviar mensagem:', err);
            showNotification('error', 'Falha ao enviar resposta.');
        } finally {
            setIsSendingReply(false);
        }
    };

    // Handle Status Change
    const handleStatusChange = async (novoStatus: StatusSuporte) => {
        if (!selectedChamado) return;

        try {
            const atendente = currentUser?.nome || 'Administrador';
            await updateStatusChamado(
                selectedChamado.id,
                novoStatus,
                atendente,
                userEmail || undefined,
                currentUser?.nome,
                isDemoMode
            );

            const atualizado: ChamadoSuporte = {
                ...selectedChamado,
                status: novoStatus,
                atendente_nome: atendente,
                resolvido_em: novoStatus === 'Resolvido' ? new Date().toISOString() : undefined
            };

            setSelectedChamado(atualizado);
            showNotification('success', `Status atualizado para: ${novoStatus}`);
            await loadChamados();
        } catch (err) {
            console.error('Erro ao alterar status:', err);
            showNotification('error', 'Falha ao atualizar status do chamado.');
        }
    };

    // Handle Priority Change
    const handlePriorityChange = async (novaPrioridade: PrioridadeSuporte) => {
        if (!selectedChamado) return;

        try {
            await updatePrioridadeChamado(
                selectedChamado.id,
                novaPrioridade,
                userEmail || undefined,
                currentUser?.nome,
                isDemoMode
            );

            const atualizado = { ...selectedChamado, prioridade: novaPrioridade };
            setSelectedChamado(atualizado);
            showNotification('success', `Prioridade alterada para: ${novaPrioridade}`);
            await loadChamados();
        } catch (err) {
            console.error('Erro ao alterar prioridade:', err);
            showNotification('error', 'Falha ao atualizar prioridade.');
        }
    };

    // Handle Delete Ticket
    const handleDelete = async () => {
        if (!chamadoToDelete) return;

        try {
            await deleteChamado(
                chamadoToDelete.id,
                userEmail || undefined,
                currentUser?.nome,
                isDemoMode
            );

            showNotification('success', 'Chamado excluído com sucesso.');
            if (selectedChamado?.id === chamadoToDelete.id) {
                setSelectedChamado(null);
            }
            setChamadoToDelete(null);
            await loadChamados();
        } catch (err) {
            console.error('Erro ao excluir chamado:', err);
            showNotification('error', 'Falha ao excluir o chamado.');
        }
    };

    // Helper for Status Badge
    const renderStatusBadge = (status: StatusSuporte) => {
        switch (status) {
            case 'Aberto':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Aberto
                    </span>
                );
            case 'Em Atendimento':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Em Atendimento
                    </span>
                );
            case 'Resolvido':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                        Resolvido
                    </span>
                );
            case 'Cancelado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelado
                    </span>
                );
            default:
                return null;
        }
    };

    // Helper for Priority Badge
    const renderPriorityBadge = (prioridade: PrioridadeSuporte) => {
        switch (prioridade) {
            case 'Urgente':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        Urgente
                    </span>
                );
            case 'Alta':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-orange-100 text-orange-800 border border-orange-200">
                        Alta
                    </span>
                );
            case 'Média':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        Média
                    </span>
                );
            case 'Baixa':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        Baixa
                    </span>
                );
            default:
                return null;
        }
    };

    // Generate WhatsApp link
    const getWhatsAppLink = (phone?: string, assunto?: string, protocolo?: string) => {
        if (!phone) return null;
        const clean = phone.replace(/\D/g, '');
        if (clean.length < 10) return null;
        const formatted = clean.startsWith('55') ? clean : `55${clean}`;
        const text = encodeURIComponent(`Olá! Referente ao chamado ${protocolo || ''} ("${assunto || 'Suporte SIGAR'}") no SIGAR:`);
        return `https://wa.me/${formatted}?text=${text}`;
    };

    return (
        <div className="space-y-6 pb-16 animate-fade-in">
            {/* Page Header */}
            <PageHeader
                title="Central de Suporte Técnico"
                subtitle="Solicitações de Atendimento, Suporte ao Usuário e Dúvidas Frequentes"
                icon={LifeBuoy}
                badgeText={metrics.abertos > 0 ? `${metrics.abertos} ${metrics.abertos === 1 ? 'Chamado Aberto' : 'Chamados Abertos'}` : 'Nenhum Chamado Pendente'}
            >
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => loadChamados(true)}
                        disabled={isRefreshing}
                        className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm"
                        title="Recarregar dados"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Atualizar</span>
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setIsNewModalOpen(true)}
                        className="shadow-lg shadow-orange-500/20 bg-brand-orange hover:bg-orange-600 text-white"
                    >
                        <Plus className="w-5 h-5 mr-1" />
                        <span>Novo Chamado</span>
                    </Button>
                </div>
            </PageHeader>

            {/* Top Navigation Tabs (Tickets vs FAQ) */}
            <div className="flex border-b border-slate-200 bg-white px-6 rounded-2xl shadow-sm">
                <button
                    onClick={() => setActiveTab('CHAMADOS')}
                    className={`py-4 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'CHAMADOS'
                            ? 'border-brand-orange text-brand-orange'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chamados de Suporte</span>
                    <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-bold">
                        {chamados.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('FAQ')}
                    className={`py-4 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'FAQ'
                            ? 'border-brand-orange text-brand-orange'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <HelpCircle className="w-4 h-4" />
                    <span>Dúvidas Frequentes (FAQ)</span>
                </button>
            </div>

            {activeTab === 'CHAMADOS' && (
                <>
                    {/* KPI Metrics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Chamados</p>
                                <p className="text-3xl font-black text-slate-900 mt-1">{metrics.total}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Registros na central</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                <LifeBuoy className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Abertos (Pendentes)</p>
                                <p className="text-3xl font-black text-amber-600 mt-1">{metrics.abertos}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Aguardando atendimento</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                <Clock className="w-6 h-6 animate-pulse" />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Em Atendimento</p>
                                <p className="text-3xl font-black text-blue-600 mt-1">{metrics.emAtendimento}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Em análise pelo suporte</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolvidos</p>
                                <p className="text-3xl font-black text-emerald-600 mt-1">{metrics.resolvidos}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Finalizados com sucesso</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
                            <div className="relative w-full lg:w-96">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar por protocolo, assunto, solicitante ou escola..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                    >
                                        Limpar
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                                {/* Admin View Mode Toggle */}
                                {isAdmin && (
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button
                                            onClick={() => setViewMode('ALL')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                viewMode === 'ALL'
                                                    ? 'bg-white text-slate-800 shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            Todos da Rede ({chamados.length})
                                        </button>
                                        <button
                                            onClick={() => setViewMode('MINE')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                viewMode === 'MINE'
                                                    ? 'bg-white text-slate-800 shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            Meus Chamados
                                        </button>
                                    </div>
                                )}

                                {/* Category Select */}
                                <select
                                    value={categoryFilter}
                                    onChange={e => setCategoryFilter(e.target.value)}
                                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                                >
                                    <option value="ALL">Todas as Categorias</option>
                                    {CATEGORIAS.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>

                                {/* Priority Select */}
                                <select
                                    value={priorityFilter}
                                    onChange={e => setPriorityFilter(e.target.value)}
                                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                                >
                                    <option value="ALL">Todas as Prioridades</option>
                                    {PRIORIDADES.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Status Filter Badges */}
                        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 text-xs border-t border-slate-100">
                            <span className="text-slate-400 font-bold text-[11px] uppercase mr-1">Status:</span>
                            <button
                                onClick={() => setStatusFilter('ALL')}
                                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                    statusFilter === 'ALL'
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Todos ({chamados.length})
                            </button>
                            <button
                                onClick={() => setStatusFilter('Aberto')}
                                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                    statusFilter === 'Aberto'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                            >
                                Abertos ({metrics.abertos})
                            </button>
                            <button
                                onClick={() => setStatusFilter('Em Atendimento')}
                                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                    statusFilter === 'Em Atendimento'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                            >
                                Em Atendimento ({metrics.emAtendimento})
                            </button>
                            <button
                                onClick={() => setStatusFilter('Resolvido')}
                                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                    statusFilter === 'Resolvido'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                            >
                                Resolvidos ({metrics.resolvidos})
                            </button>
                            <button
                                onClick={() => setStatusFilter('Cancelado')}
                                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                    statusFilter === 'Cancelado'
                                        ? 'bg-slate-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Cancelados ({metrics.cancelados})
                            </button>
                        </div>
                    </div>

                    {/* Tickets Table / List */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                                <RefreshCw className="w-8 h-8 animate-spin text-brand-orange mb-3" />
                                <p className="text-sm font-medium">Carregando chamados de suporte...</p>
                            </div>
                        ) : filteredChamados.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-brand-orange mb-4">
                                    <LifeBuoy className="w-8 h-8" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 mb-1">Nenhum chamado encontrado</h4>
                                <p className="text-sm text-slate-500 max-w-md mb-6">
                                    {searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL'
                                        ? 'Não foram encontrados registros para os filtros selecionados.'
                                        : 'Você ainda não possui chamados de suporte abertos.'}
                                </p>
                                <Button
                                    variant="primary"
                                    onClick={() => setIsNewModalOpen(true)}
                                    className="bg-brand-orange text-white"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Abrir Primeiro Chamado
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Protocolo / Data</th>
                                            <th className="px-6 py-4">Solicitante</th>
                                            <th className="px-6 py-4">Assunto / Categoria</th>
                                            <th className="px-6 py-4">Prioridade</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredChamados.map(c => {
                                            const waLink = getWhatsAppLink(c.usuario_contato, c.assunto, c.protocolo);
                                            const msgCount = c.mensagens ? c.mensagens.length : 1;

                                            return (
                                                <tr
                                                    key={c.id}
                                                    onClick={() => setSelectedChamado(c)}
                                                    className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                                                >
                                                    {/* Protocol & Date */}
                                                    <td className="px-6 py-4 align-top">
                                                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded-md border border-slate-200 group-hover:border-brand-orange/40">
                                                            {c.protocolo}
                                                        </span>
                                                        <div className="text-[11px] text-slate-400 font-medium mt-1.5 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>

                                                    {/* Requester */}
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="font-bold text-slate-900 leading-snug">
                                                            {c.usuario_nome}
                                                        </div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-xs">
                                                            <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                                                            <span className="truncate">{c.usuario_email}</span>
                                                        </div>
                                                        {c.usuario_funcao && (
                                                            <span className="inline-block mt-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                {c.usuario_funcao}
                                                            </span>
                                                        )}
                                                        {c.escola_nome && (
                                                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate max-w-xs">
                                                                <School className="w-3 h-3 shrink-0 text-slate-400" />
                                                                <span className="truncate" title={c.escola_nome}>{c.escola_nome}</span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Subject & Category */}
                                                    <td className="px-6 py-4 align-top max-w-md">
                                                        <div className="font-bold text-slate-900 text-sm group-hover:text-brand-orange transition-colors">
                                                            {c.assunto}
                                                        </div>
                                                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                                            {c.descricao}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                                                <Tag className="w-2.5 h-2.5" />
                                                                {c.categoria}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-full">
                                                                <MessageSquare className="w-2.5 h-2.5" />
                                                                {msgCount} {msgCount === 1 ? 'mensagem' : 'mensagens'}
                                                            </span>
                                                            {(c.anexo_url || (c.mensagens && c.mensagens.some(m => !!m.anexo_url))) && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full" title="Possui captura de tela / print anexado">
                                                                    <ImageIcon className="w-2.5 h-2.5 text-brand-orange" />
                                                                    Print anexado
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Priority */}
                                                    <td className="px-6 py-4 align-top">
                                                        {renderPriorityBadge(c.prioridade)}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-6 py-4 align-top">
                                                        {renderStatusBadge(c.status)}
                                                        {c.atendente_nome && (
                                                            <div className="text-[10px] text-slate-400 mt-1 font-medium">
                                                                Atendente: {c.atendente_nome}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-4 align-top text-right" onClick={e => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {waLink && (
                                                                <a
                                                                    href={waLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                                    title="Conversar no WhatsApp"
                                                                >
                                                                    <MessageCircle className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() => setSelectedChamado(c)}
                                                                className="px-3 py-1.5 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                                            >
                                                                <span>Atender</span>
                                                                <ChevronRight className="w-3 h-3" />
                                                            </button>
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={() => setChamadoToDelete(c)}
                                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                                    title="Excluir Chamado"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* FAQ Section Tab */}
            {activeTab === 'FAQ' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10 max-w-2xl">
                            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Base de Conhecimento</span>
                            <h3 className="text-2xl font-black mt-1">Como podemos te ajudar hoje?</h3>
                            <p className="text-slate-300 text-sm mt-2">
                                Encontre respostas rápidas para as dúvidas mais comuns sobre o SIGAR, diário de classe, permissões e relatórios.
                            </p>

                            <div className="relative mt-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por assunto ou palavra-chave..."
                                    value={faqSearch}
                                    onChange={e => setFaqSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white text-slate-900 rounded-xl shadow-md outline-none text-sm font-medium focus:ring-4 focus:ring-brand-orange/30"
                                />
                            </div>
                        </div>
                        <HelpCircle className="absolute -right-6 -bottom-6 w-48 h-48 text-white/5 pointer-events-none" />
                    </div>

                    <div className="space-y-3">
                        {filteredFaq.map((faq, idx) => {
                            const isOpen = openFaqIndex === idx;
                            return (
                                <div
                                    key={idx}
                                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                                >
                                    <button
                                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                        className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-brand-orange transition-colors"
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-lg bg-orange-50 text-brand-orange flex items-center justify-center text-xs font-black">
                                                {idx + 1}
                                            </span>
                                            {faq.pergunta}
                                        </span>
                                        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                                    </button>
                                    {isOpen && (
                                        <div className="px-6 pb-5 pt-1 text-slate-600 text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50 animate-fade-in">
                                            <p>{faq.resposta}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {filteredFaq.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                                <p className="text-slate-500 text-sm">Nenhuma resposta encontrada para "{faqSearch}".</p>
                            </div>
                        )}
                    </div>

                    {/* Still Need Help CTA */}
                    <div className="p-6 bg-orange-50 rounded-2xl border border-orange-200 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-orange text-white flex items-center justify-center shrink-0">
                                <LifeBuoy className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Não encontrou o que precisava?</h4>
                                <p className="text-xs text-slate-600 mt-0.5">Nossa equipe de administração do sistema está pronta para ajudar você.</p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => {
                                setActiveTab('CHAMADOS');
                                setIsNewModalOpen(true);
                            }}
                            className="bg-brand-orange text-white whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Abrir Chamado Agora
                        </Button>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: NOVO CHAMADO */}
            {/* ========================================================================= */}
            {isNewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center text-white">
                                    <LifeBuoy className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">Novo Chamado de Suporte</h3>
                                    <p className="text-xs text-slate-400">Envie sua solicitação diretamente ao Administrador do SIGAR</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsNewModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form 
                            onSubmit={handleCreateTicket} 
                            onPaste={e => handlePaste(e, 'FORM')}
                            className="p-6 space-y-4 overflow-y-auto flex-1"
                        >
                            {/* Requester Info summary */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div>
                                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Solicitante</span>
                                    <span className="font-bold text-slate-800">{currentUser?.nome || userEmail}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Perfil</span>
                                    <span className="font-bold text-slate-800">{currentUser?.funcao || 'Usuário'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-bold uppercase block text-[10px]">E-mail</span>
                                    <span className="font-medium text-slate-600">{userEmail}</span>
                                </div>
                            </div>

                            {/* Row: Category & Priority */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                        Categoria da Solicitação *
                                    </label>
                                    <select
                                        value={formCategoria}
                                        onChange={e => setFormCategoria(e.target.value as CategoriaSuporte)}
                                        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none font-medium"
                                        required
                                    >
                                        {CATEGORIAS.map(cat => (
                                             <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                        Nível de Prioridade *
                                    </label>
                                    <select
                                        value={formPrioridade}
                                        onChange={e => setFormPrioridade(e.target.value as PrioridadeSuporte)}
                                        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none font-medium"
                                        required
                                    >
                                        <option value="Baixa">Baixa (Dúvida pontual / sugestão)</option>
                                        <option value="Média">Média (Ajuste ou esclarecimento)</option>
                                        <option value="Alta">Alta (Impacta lançamento de notas/presença)</option>
                                        <option value="Urgente">Urgente (Sistema travado / bloqueio de acesso)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row: School & WhatsApp Contact */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                        Escola Relacionada (Opcional)
                                    </label>
                                    <select
                                        value={formEscolaId}
                                        onChange={e => setFormEscolaId(e.target.value)}
                                        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none font-medium truncate"
                                    >
                                        <option value="">Geral / Toda a Rede</option>
                                        {escolas.map(esc => (
                                            <option key={esc.id} value={esc.id}>{esc.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                        Telefone / WhatsApp para Contato
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="(98) 98888-0000"
                                        value={formContato}
                                        onChange={e => setFormContato(e.target.value)}
                                        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none font-medium"
                                    />
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                    Assunto / Título do Chamado *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Erro ao salvar notas da turma 5º Ano B ou Solicitação de acesso"
                                    value={formAssunto}
                                    onChange={e => setFormAssunto(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none font-medium"
                                    required
                                    maxLength={150}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                    Descrição Detalhada do Problema ou Dúvida *
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Descreva detalhadamente o ocorrido. Se houver mensagens de erro, informe o texto exibido na tela ou os passos para reproduzir o problema."
                                    value={formDescricao}
                                    onChange={e => setFormDescricao(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none font-medium resize-none"
                                    required
                                />
                            </div>

                            {/* Row: Screenshot / Image Attachment Dropzone */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <ImageIcon className="w-3.5 h-3.5 text-brand-orange" />
                                        Anexar Captura de Tela ou Imagem do Erro (Opcional)
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-normal">PNG, JPG ou WEBP até 15MB</span>
                                </label>

                                <input
                                    type="file"
                                    ref={formFileInputRef}
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageFileSelect(file, 'FORM');
                                        e.target.value = '';
                                    }}
                                />

                                {!formAnexo ? (
                                    <div
                                        onDragOver={e => { e.preventDefault(); setIsDraggingOverForm(true); }}
                                        onDragLeave={() => setIsDraggingOverForm(false)}
                                        onDrop={e => {
                                            e.preventDefault();
                                            setIsDraggingOverForm(false);
                                            const file = e.dataTransfer.files?.[0];
                                            if (file) handleImageFileSelect(file, 'FORM');
                                        }}
                                        onClick={() => formFileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                                            isDraggingOverForm
                                                ? 'border-brand-orange bg-orange-50/70 scale-[1.01]'
                                                : 'border-slate-300 hover:border-brand-orange/60 bg-slate-50/70 hover:bg-orange-50/30'
                                        }`}
                                    >
                                        {isUploadingFormImg ? (
                                            <div className="py-3 flex flex-col items-center justify-center text-slate-500">
                                                <RefreshCw className="w-6 h-6 animate-spin text-brand-orange mb-2" />
                                                <p className="text-xs font-bold">Otimizando e anexando imagem...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-1">
                                                <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-brand-orange flex items-center justify-center shrink-0">
                                                    <UploadCloud className="w-5 h-5" />
                                                </div>
                                                <div className="text-center sm:text-left">
                                                    <p className="text-xs font-bold text-slate-700">
                                                        Clique para selecionar uma imagem ou arraste o arquivo aqui
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        Dica: Você também pode colar um print diretamente com <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-mono text-[10px] font-bold">Ctrl + V</kbd>
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div 
                                                onClick={() => setPreviewImageModal({
                                                    url: formAnexo.dataUrl,
                                                    title: formAssunto || 'Print do Chamado',
                                                    filename: formAnexo.name
                                                })}
                                                className="relative w-14 h-14 rounded-xl overflow-hidden border border-orange-300 bg-slate-100 shrink-0 cursor-pointer group shadow-sm"
                                                title="Clique para ampliar a imagem"
                                            >
                                                <img
                                                    src={formAnexo.dataUrl}
                                                    alt="Anexo"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                    <Eye className="w-4 h-4" />
                                                </div>
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-200/80 text-orange-900">
                                                        Print Anexado
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 font-mono">{formAnexo.sizeFormatted}</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-800 truncate mt-0.5" title={formAnexo.name}>
                                                    {formAnexo.name}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewImageModal({
                                                        url: formAnexo.dataUrl,
                                                        title: formAssunto || 'Print do Chamado',
                                                        filename: formAnexo.name
                                                    })}
                                                    className="text-[11px] text-brand-orange hover:underline font-bold flex items-center gap-1 mt-0.5"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    Visualizar em tamanho real
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => formFileInputRef.current?.click()}
                                                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition"
                                                title="Trocar imagem"
                                            >
                                                Trocar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormAnexo(null)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                                                title="Remover anexo"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Helpful Tips Alert */}
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-bold">Dica para atendimento rápido:</p>
                                    <p className="text-[11px] text-amber-700 mt-0.5">
                                        Ao abrir o chamado, você receberá um número de protocolo. Se houver prints de tela anexados, a equipe técnica poderá diagnosticar o problema com mais rapidez e assertividade.
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsNewModalOpen(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                                >
                                    Cancelar
                                </button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isSubmitting}
                                    className="bg-brand-orange text-white px-6 py-2.5"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-1.5" />
                                            Enviar Solicitação
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: DETALHES E LINHA DO TEMPO DO CHAMADO */}
            {/* ========================================================================= */}
            {selectedChamado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center text-white font-mono font-bold text-xs">
                                    SUP
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-black text-sm text-orange-400">
                                            {selectedChamado.protocolo}
                                        </span>
                                        {renderStatusBadge(selectedChamado.status)}
                                        {renderPriorityBadge(selectedChamado.prioridade)}
                                    </div>
                                    <h3 className="text-base font-bold text-white mt-0.5 line-clamp-1">
                                        {selectedChamado.assunto}
                                    </h3>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedChamado(null)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Ticket Info Card */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                                <div>
                                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Solicitante</span>
                                    <span className="font-bold text-slate-800 text-sm">{selectedChamado.usuario_nome}</span>
                                    <div className="text-slate-500 mt-0.5">{selectedChamado.usuario_email}</div>
                                    {selectedChamado.usuario_funcao && (
                                        <span className="inline-block mt-1 text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                            {selectedChamado.usuario_funcao}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Escola / Categoria</span>
                                    <div className="font-bold text-slate-800 truncate" title={selectedChamado.escola_nome || 'Geral'}>
                                        {selectedChamado.escola_nome || 'Geral / Rede'}
                                    </div>
                                    <div className="text-brand-orange font-bold mt-1">
                                        {selectedChamado.categoria}
                                    </div>
                                    <div className="text-slate-400 text-[11px] mt-1">
                                        Aberto em: {new Date(selectedChamado.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Contato Rápido</span>
                                    <div className="font-bold text-slate-800">
                                        {selectedChamado.usuario_contato || 'Não informado'}
                                    </div>
                                    {selectedChamado.usuario_contato && getWhatsAppLink(selectedChamado.usuario_contato, selectedChamado.assunto, selectedChamado.protocolo) && (
                                        <a
                                            href={getWhatsAppLink(selectedChamado.usuario_contato, selectedChamado.assunto, selectedChamado.protocolo)!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            WhatsApp
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Admin Management Bar (If Admin) */}
                            {isAdmin && (
                                <div className="p-4 bg-orange-50/70 rounded-2xl border border-orange-200 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-brand-orange" />
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                            Controle Administrativo:
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {selectedChamado.status !== 'Em Atendimento' && selectedChamado.status !== 'Resolvido' && (
                                            <button
                                                onClick={() => handleStatusChange('Em Atendimento')}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                                            >
                                                Iniciar Atendimento
                                            </button>
                                        )}

                                        {selectedChamado.status !== 'Resolvido' && (
                                            <button
                                                onClick={() => handleStatusChange('Resolvido')}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                Marcar como Resolvido
                                            </button>
                                        )}

                                        {selectedChamado.status === 'Resolvido' && (
                                            <button
                                                onClick={() => handleStatusChange('Em Atendimento')}
                                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                                            >
                                                Reabrir Chamado
                                            </button>
                                        )}

                                        {selectedChamado.status !== 'Cancelado' && (
                                            <button
                                                onClick={() => handleStatusChange('Cancelado')}
                                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition"
                                            >
                                                Cancelar
                                            </button>
                                        )}

                                        <select
                                            value={selectedChamado.prioridade}
                                            onChange={e => handlePriorityChange(e.target.value as PrioridadeSuporte)}
                                            className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl outline-none"
                                            title="Alterar prioridade"
                                        >
                                            {PRIORIDADES.map(p => (
                                                <option key={p} value={p}>Prioridade: {p}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Conversation Timeline */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-slate-400" />
                                    Histórico de Mensagens e Respostas
                                </h4>

                                <div className="space-y-3.5">
                                    {(selectedChamado.mensagens || []).map((msg, idx) => {
                                        const isAdminMsg = msg.autor_tipo === 'ADMIN';

                                        return (
                                            <div
                                                key={msg.id || idx}
                                                className={`p-4 rounded-2xl text-sm ${
                                                    isAdminMsg
                                                        ? 'bg-orange-50/80 border border-orange-200 ml-4 md:ml-12'
                                                        : 'bg-slate-100 border border-slate-200 mr-4 md:mr-12'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                            isAdminMsg
                                                                ? 'bg-brand-orange text-white'
                                                                : 'bg-slate-800 text-white'
                                                        }`}>
                                                            {isAdminMsg ? 'A' : 'U'}
                                                        </div>
                                                        <span className="font-bold text-slate-900 text-xs">
                                                            {msg.autor_nome}
                                                        </span>
                                                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                            isAdminMsg
                                                                ? 'bg-orange-200 text-orange-800'
                                                                : 'bg-slate-200 text-slate-700'
                                                        }`}>
                                                            {isAdminMsg ? 'Suporte / Administrador' : 'Solicitante'}
                                                        </span>
                                                    </div>

                                                    <span className="text-[11px] text-slate-400 font-medium">
                                                        {new Date(msg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                                                    {msg.mensagem}
                                                </p>

                                                {msg.anexo_url && (
                                                    <div className="mt-3">
                                                        <div 
                                                            onClick={() => setPreviewImageModal({
                                                                url: msg.anexo_url!,
                                                                title: `Captura de Tela - ${msg.autor_nome}`,
                                                                filename: msg.anexo_nome || 'screenshot.jpg'
                                                            })}
                                                            className="inline-flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-brand-orange/50 hover:shadow-md transition-all cursor-pointer group max-w-sm"
                                                            title="Clique para visualizar a imagem em tamanho real"
                                                        >
                                                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                                                <img
                                                                    src={msg.anexo_url}
                                                                    alt={msg.anexo_nome || 'Captura de Tela Anexada'}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                />
                                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                                    <Maximize2 className="w-3.5 h-3.5" />
                                                                </div>
                                                            </div>

                                                            <div className="min-w-0 pr-2">
                                                                <span className="text-[10px] font-bold text-brand-orange uppercase flex items-center gap-1">
                                                                    <ImageIcon className="w-3 h-3" />
                                                                    Captura Anexada
                                                                </span>
                                                                <p className="text-xs font-bold text-slate-800 truncate mt-0.5" title={msg.anexo_nome || 'Captura de Tela'}>
                                                                    {msg.anexo_nome || 'Visualizar Imagem'}
                                                                </p>
                                                                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 group-hover:text-brand-orange">
                                                                    <Eye className="w-3 h-3" />
                                                                    Ampliar imagem
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Reply Form Footer */}
                        {selectedChamado.status !== 'Resolvido' && selectedChamado.status !== 'Cancelado' ? (
                            <form onSubmit={handleSendReply} className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
                                {/* Reply Attachment Chip if present */}
                                {replyAnexo && (
                                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-orange-200 shadow-sm animate-fade-in">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <img
                                                src={replyAnexo.dataUrl}
                                                alt="Anexo Resposta"
                                                onClick={() => setPreviewImageModal({
                                                    url: replyAnexo.dataUrl,
                                                    title: `Anexo de Resposta - ${selectedChamado.protocolo}`,
                                                    filename: replyAnexo.name
                                                })}
                                                className="w-10 h-10 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate" title={replyAnexo.name}>
                                                    {replyAnexo.name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                    {replyAnexo.sizeFormatted} • Captura pronta para envio
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setReplyAnexo(null)}
                                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                                            title="Remover anexo da resposta"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-2 items-center">
                                    <input
                                        type="file"
                                        ref={replyFileInputRef}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageFileSelect(file, 'REPLY');
                                            e.target.value = '';
                                        }}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => replyFileInputRef.current?.click()}
                                        disabled={isSendingReply || isUploadingReplyImg}
                                        className={`p-3 rounded-xl border transition flex items-center justify-center shrink-0 ${
                                            replyAnexo 
                                                ? 'bg-orange-100 border-brand-orange text-brand-orange' 
                                                : 'bg-white border-slate-200 text-slate-600 hover:text-brand-orange hover:border-brand-orange/40 hover:bg-orange-50/50'
                                        }`}
                                        title="Anexar captura de tela ou print do erro (ou cole com Ctrl+V)"
                                    >
                                        {isUploadingReplyImg ? (
                                            <RefreshCw className="w-4 h-4 animate-spin text-brand-orange" />
                                        ) : (
                                            <ImageIcon className="w-4 h-4" />
                                        )}
                                    </button>

                                    <input
                                        type="text"
                                        placeholder={isAdmin ? "Escreva uma resposta oficial ao usuário (ou cole print com Ctrl+V)..." : "Adicione mais detalhes ou responda ao suporte (ou cole print com Ctrl+V)..."}
                                        value={replyMessage}
                                        onChange={e => setReplyMessage(e.target.value)}
                                        onPaste={e => handlePaste(e, 'REPLY')}
                                        className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none"
                                        disabled={isSendingReply}
                                    />

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={isSendingReply || (!replyMessage.trim() && !replyAnexo)}
                                        className="bg-brand-orange text-white px-5 shrink-0"
                                    >
                                        {isSendingReply ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-1.5" />
                                                Responder
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-4 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500">
                                Este chamado está <strong className="text-slate-700">{selectedChamado.status.toLowerCase()}</strong>. Para novas solicitações, abra um novo chamado.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: LIGHTBOX / VISUALIZADOR DE IMAGEM / PRINT EM TELA CHEIA */}
            {/* ========================================================================= */}
            {previewImageModal && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
                    onClick={() => setPreviewImageModal(null)}
                >
                    <div 
                        className="relative max-w-5xl max-h-[92vh] w-full flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 animate-scale-in"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Lightbox Header */}
                        <div className="px-6 py-3.5 bg-slate-950/90 backdrop-blur text-white flex items-center justify-between border-b border-slate-800">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-brand-orange/20 text-brand-orange flex items-center justify-center shrink-0">
                                    <ImageIcon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate">{previewImageModal.title}</h4>
                                    {previewImageModal.filename && (
                                        <p className="text-[11px] text-slate-400 font-mono truncate max-w-md">{previewImageModal.filename}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href={previewImageModal.url}
                                    download={previewImageModal.filename || 'screenshot-suporte-sigar.jpg'}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                                    title="Baixar imagem original"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Baixar</span>
                                </a>
                                <button
                                    onClick={() => setPreviewImageModal(null)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                                    title="Fechar (Esc)"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Lightbox Image Viewport */}
                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60 min-h-[300px]">
                            <img
                                src={previewImageModal.url}
                                alt={previewImageModal.title}
                                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                            />
                        </div>

                        {/* Lightbox Footer */}
                        <div className="px-6 py-2.5 bg-slate-950 text-slate-400 text-xs flex items-center justify-between border-t border-slate-800">
                            <span>Pressione <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">Esc</kbd> ou clique fora da imagem para fechar.</span>
                            <span className="font-medium text-slate-500">Visualizador de Capturas • Suporte SIGAR</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!chamadoToDelete}
                title="Excluir Chamado de Suporte"
                message={`Deseja realmente excluir o chamado protocolo ${chamadoToDelete?.protocolo}? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                cancelText="Cancelar"
                variant="danger"
                icon={Trash2}
                onConfirm={handleDelete}
                onClose={() => setChamadoToDelete(null)}
            />
        </div>
    );
};
