import React, { useState } from 'react';
import { PageHeader } from './ui/PageHeader';
import { AcompanhamentoSalaDashboard } from './AcompanhamentoSalaDashboard';
import { FileStack, Users, BookOpen, Target, FileText, Presentation, Upload, Clock, Edit, Trash2, Calendar, Settings, Plus, Check, X, Printer, FileDown, Eye } from 'lucide-react';
import { Escola } from '../types';
import { generateAtaDocx } from '../utils/docxUtils';
import { PrintableAta } from './PrintableAta';

type Tab = 'reunioes' | 'formacao' | 'acao' | 'pedagogica' | 'sala';

interface InstrumentaisGestaoProps {
    escolas?: Escola[];
    currentUser?: string | null;
}

export const InstrumentaisGestao: React.FC<InstrumentaisGestaoProps> = ({ escolas = [], currentUser = '' }) => {
    const [activeTab, setActiveTab] = useState<Tab>('reunioes');

    const tabs = [
        { id: 'reunioes', label: 'Ciclo de Reuniões', icon: Users },
        { id: 'formacao', label: 'Plano de Formação', icon: BookOpen },
        { id: 'acao', label: 'Plano de Ação', icon: Target },
        { id: 'pedagogica', label: 'Proposta Pedagógica', icon: FileText },
        { id: 'sala', label: 'Acompanhamento em Sala', icon: Presentation }
    ];

    // ============================================
    // ESTADOS: CICLO DE REUNIÕES & ATA DE REUNIÃO
    // ============================================
    const [isEditingReuniao, setIsEditingReuniao] = useState(false);
    const [reuniaoForm, setReuniaoForm] = useState({
        id: '',
        dataReuniao: '',
        horaInicio: '',
        horaFim: '',
        tipo: 'Pedagógica',
        pauta: '',
        local: '',
        registro: '',
        encaminhamentos: '',
        status: 'Agendada',
        responsavel: currentUser || '',
        participantes: [] as string[]
    });
    const [novoParticipante, setNovoParticipante] = useState('');
    const [showAtaModal, setShowAtaModal] = useState<any | null>(null);
    const [reuniaoParaImprimir, setReuniaoParaImprimir] = useState<any | null>(null);

    const [mockReunioes, setMockReunioes] = useState<any[]>([
        {
            id: '1',
            dataReuniao: '2026-02-18',
            horaInicio: '08:00',
            horaFim: '10:00',
            tipo: 'Administrativa',
            pauta: 'Alocação de Recursos Q1',
            status: 'Realizada',
            responsavel: 'João Silva',
            local: 'Sala da Direção',
            registro: 'Aprovada a realocação...',
            encaminhamentos: 'João vai fazer X',
            participantes: ['João Silva', 'Maria Sousa']
        }
    ]);

    const [tiposReuniao, setTiposReuniao] = useState<string[]>(['Pedagógica', 'Administrativa', 'Conselho Escolar', 'Reunião de Pais e Mestres']);
    const [isGerenciandoTipos, setIsGerenciandoTipos] = useState(false);
    const [novoTipo, setNovoTipo] = useState('');
    const [tipoEditando, setTipoEditando] = useState<string | null>(null);
    const [tipoEditadoNome, setTipoEditadoNome] = useState('');

    const handleAddParticipante = () => {
        if (novoParticipante.trim() && !reuniaoForm.participantes.includes(novoParticipante.trim())) {
            setReuniaoForm({ ...reuniaoForm, participantes: [...reuniaoForm.participantes, novoParticipante.trim()] });
            setNovoParticipante('');
        }
    };

    const handleRemoveParticipante = (nome: string) => {
        setReuniaoForm({ ...reuniaoForm, participantes: reuniaoForm.participantes.filter(p => p !== nome) });
    };

    const handleSaveReuniao = () => {
        if (!reuniaoForm.pauta || !reuniaoForm.dataReuniao) return;

        let savedReuniao = { ...reuniaoForm, responsavel: currentUser || '' };
        if (reuniaoForm.id) {
            setMockReunioes(prev => prev.map(m => m.id === reuniaoForm.id ? savedReuniao : m));
        } else {
            savedReuniao.id = Date.now().toString();
            setMockReunioes(prev => [...prev, savedReuniao]);
        }

        setIsEditingReuniao(false);
        setReuniaoForm({ id: '', dataReuniao: '', horaInicio: '', horaFim: '', local: '', registro: '', encaminhamentos: '', tipo: 'Pedagógica', pauta: '', status: 'Agendada', responsavel: currentUser || '', participantes: [] });

        setShowAtaModal(savedReuniao);
    };

    const handleEditReuniao = (reuniao: any) => {
        setReuniaoForm({
            ...reuniao,
            local: reuniao.local || '',
            registro: reuniao.registro || '',
            encaminhamentos: reuniao.encaminhamentos || '',
        });
        setIsEditingReuniao(true);
    };

    const handleDeleteReuniao = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este registro de reunião?')) {
            setMockReunioes(prev => prev.filter(m => m.id !== id));
        }
    };

    const handleGerarAta = (reuniao: any) => {
        setShowAtaModal(reuniao);
    };

    const handlePrintAta = () => {
        if (!showAtaModal) return;
        setReuniaoParaImprimir(showAtaModal);

        // Timeout to allow DOM rendering before printing
        setTimeout(() => {
            window.print();
            setReuniaoParaImprimir(null);
            setShowAtaModal(null);
        }, 300);
    };

    const handleDownloadDocxAta = async () => {
        if (!showAtaModal) return;
        try {
            await generateAtaDocx(showAtaModal);
        } catch (error) {
            console.error(error);
            alert('Falha ao gerar o arquivo DOCX. Tente novamente.');
        }
        setShowAtaModal(null);
    };

    const handleAddTipoReuniao = () => {
        if (novoTipo.trim() && !tiposReuniao.includes(novoTipo.trim())) {
            setTiposReuniao([...tiposReuniao, novoTipo.trim()]);
            setNovoTipo('');
        }
    };

    const handleEditTipoReuniao = (oldNome: string) => {
        setTipoEditando(oldNome);
        setTipoEditadoNome(oldNome);
    };

    const handleSaveEditTipoReuniao = () => {
        if (tipoEditando && tipoEditadoNome.trim() && !tiposReuniao.includes(tipoEditadoNome.trim())) {
            setTiposReuniao(tiposReuniao.map(t => t === tipoEditando ? tipoEditadoNome.trim() : t));
            if (reuniaoForm.tipo === tipoEditando) {
                setReuniaoForm({ ...reuniaoForm, tipo: tipoEditadoNome.trim() });
            }
        }
        setTipoEditando(null);
        setTipoEditadoNome('');
    };

    const handleDeleteTipoReuniao = (nome: string) => {
        if (confirm(`Tem certeza que deseja excluir o tipo "${nome}"?`)) {
            setTiposReuniao(tiposReuniao.filter(t => t !== nome));
            if (reuniaoForm.tipo === nome) {
                setReuniaoForm({ ...reuniaoForm, tipo: 'Pedagógica' });
            }
        }
    };

    // ============================================
    // ESTADOS: PLANO DE AÇÃO
    // ============================================
    const [isEditingMeta, setIsEditingMeta] = useState(false);
    const [metaForm, setMetaForm] = useState({
        id: '',
        descricao: '',
        prazo: '',
        status: 'Não Iniciado',
        responsavel: ''
    });
    const [mockMetas, setMockMetas] = useState([
        { id: '1', descricao: 'Aprimorar leitura fluente do 2º ano', prazo: '2026-04-30', status: 'Em Andamento', responsavel: 'Silvana (Coordenadora)' },
        { id: '2', descricao: 'Oficina de Matemática Divertida', prazo: '2026-03-15', status: 'Concluído', responsavel: 'Carlos (Professor)' },
    ]);

    const handleSaveMeta = () => {
        if (!metaForm.descricao) return;
        if (metaForm.id) {
            setMockMetas(prev => prev.map(m => m.id === metaForm.id ? metaForm : m));
        } else {
            setMockMetas(prev => [...prev, { ...metaForm, id: Date.now().toString() }]);
        }
        setIsEditingMeta(false);
        setMetaForm({ id: '', descricao: '', prazo: '', status: 'Não Iniciado', responsavel: '' });
    };

    const handleEditMeta = (meta: any) => {
        setMetaForm(meta);
        setIsEditingMeta(true);
    };

    const handleDeleteMeta = (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta meta?')) {
            setMockMetas(prev => prev.filter(m => m.id !== id));
        }
    };

    // ============================================
    // ESTADOS: PLANO DE FORMAÇÃO
    // ============================================
    const [isEditingFormacao, setIsEditingFormacao] = useState(false);
    const [formacaoForm, setFormacaoForm] = useState({
        id: '',
        especificacao: '',
        objetivo: '',
        data: '',
        publicoAlvo: '',
        responsavel: currentUser || '',
        custo: ''
    });
    const [mockFormacoes, setMockFormacoes] = useState([
        {
            id: '1',
            especificacao: 'Metodologias Ativas no Ensino Fundamental',
            objetivo: 'Capacitar professores no uso de ferramentas digitais e metodologias participativas.',
            data: '2026-03-20',
            publicoAlvo: 'Professores do Ensino Fundamental',
            responsavel: 'Maria Nogueira',
            custo: 'R$ 1.500,00'
        }
    ]);

    const handleSaveFormacao = () => {
        if (!formacaoForm.especificacao || !formacaoForm.data) return;
        if (formacaoForm.id) {
            setMockFormacoes(prev => prev.map(m => m.id === formacaoForm.id ? formacaoForm : m));
        } else {
            setMockFormacoes(prev => [...prev, { ...formacaoForm, id: Date.now().toString() }]);
        }
        setIsEditingFormacao(false);
        setFormacaoForm({ id: '', especificacao: '', objetivo: '', data: '', publicoAlvo: '', responsavel: currentUser || '', custo: '' });
    };

    const handleEditFormacao = (formacao: any) => {
        setFormacaoForm(formacao);
        setIsEditingFormacao(true);
    };

    const handleDeleteFormacao = (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta formação?')) {
            setMockFormacoes(prev => prev.filter(m => m.id !== id));
        }
    };

    // ============================================
    // ESTADOS: PROPOSTA PEDAGÓGICA (PPP)
    // ============================================
    // ============================================
    // ESTADOS: PROPOSTA PEDAGÓGICA (PPP)
    // ============================================
    const [pppHistory, setPppHistory] = useState([
        {
            id: '1',
            arquivo: 'PPP_2026_Escola_Municipal_Centro.pdf',
            dataEnvio: '15/02/2026 às 14:30',
            usuario: 'Jadson Carlos',
            coordenadorRegional: 'Ana Silva',
            status: 'Aprovado',
            tamanho: '1.2 MB'
        },
        {
            id: '2',
            arquivo: 'Anexo_I_Metodologias_Ativas_Revisado.pdf',
            dataEnvio: '20/02/2026 às 09:15',
            usuario: 'Jadson Carlos',
            coordenadorRegional: 'Ana Silva',
            status: 'Aguardando Análise',
            tamanho: '850 KB'
        }
    ]);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation for 2MB limit
        if (file.size > 2 * 1024 * 1024) {
            alert('O tamanho do arquivo não pode exceder 2MB.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const sizeInMb = file.size / (1024 * 1024);
        const sizeFormatted = sizeInMb >= 1
            ? `${sizeInMb.toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;

        const now = new Date();
        const formattedDate = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

        const newPpp = {
            id: Date.now().toString(),
            arquivo: file.name,
            dataEnvio: formattedDate,
            usuario: currentUser || 'Usuário logado',
            coordenadorRegional: 'Ana Silva',
            status: 'Aguardando Análise',
            tamanho: sizeFormatted
        };

        setPppHistory([newPpp, ...pppHistory]);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDownloadArquivo = (arquivoNome: string) => {
        // Simulação de download
        const blob = new Blob([`Conteúdo simulado do arquivo PDF: ${arquivoNome}`], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = arquivoNome;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const toggleStatus = (id: string, currentStatus: string) => {
        let nextStatus = '';
        if (currentStatus === 'Aguardando Análise') nextStatus = 'Em Análise';
        else if (currentStatus === 'Em Análise') nextStatus = 'Aprovado';
        else nextStatus = 'Aguardando Análise';

        setPppHistory(prev => prev.map(item => item.id === id ? { ...item, status: nextStatus } : item));
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'reunioes':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-left">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">CICLO DE REUNIÕES</h3>
                                <p className="text-sm text-slate-500 mt-1">Acompanhamento e registro dos ciclos pedagógicos e geração de atas.</p>
                            </div>
                            {!isEditingReuniao && (
                                <button
                                    onClick={() => {
                                        setReuniaoForm({ id: '', dataReuniao: '', horaInicio: '', horaFim: '', local: '', registro: '', encaminhamentos: '', tipo: 'Pedagógica', pauta: '', status: 'Agendada', responsavel: currentUser || '', participantes: [] });
                                        setIsEditingReuniao(true);
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                                >
                                    <Users size={18} /> Nova Reunião
                                </button>
                            )}
                        </div>

                        {isEditingReuniao && (
                            <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm mb-8 animate-fade-in relative">
                                <button onClick={() => setIsGerenciandoTipos(!isGerenciandoTipos)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 p-2 rounded-xl" title="Configurar Tipos de Reunião">
                                    <Settings size={18} />
                                </button>
                                {isGerenciandoTipos ? (
                                    <div className="mb-6 p-6 border border-amber-200 bg-amber-50 rounded-xl">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-amber-800 flex items-center gap-2"><Settings size={16} /> Gerenciar Tipos de Reunião</h4>
                                            <button onClick={() => setIsGerenciandoTipos(false)} className="text-amber-600 hover:text-amber-800"><X size={20} /></button>
                                        </div>
                                        <div className="flex gap-2 mb-4">
                                            <input
                                                type="text"
                                                value={novoTipo}
                                                onChange={(e) => setNovoTipo(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddTipoReuniao()}
                                                placeholder="Novo Tipo de Reunião"
                                                className="flex-1 bg-white border border-amber-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                            />
                                            <button onClick={handleAddTipoReuniao} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16} /> Adicionar</button>
                                        </div>
                                        <div className="space-y-2">
                                            {tiposReuniao.map(tipo => (
                                                <div key={tipo} className="flex justify-between items-center bg-white p-2 rounded-lg border border-amber-100">
                                                    {tipoEditando === tipo ? (
                                                        <input
                                                            value={tipoEditadoNome}
                                                            onChange={e => setTipoEditadoNome(e.target.value)}
                                                            className="flex-1 border-b border-amber-300 focus:outline-none px-2 py-1 text-sm bg-amber-50 rounded"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-medium text-slate-700">{tipo}</span>
                                                    )}
                                                    <div className="flex gap-1 ml-4 justify-end">
                                                        {tipoEditando === tipo ? (
                                                            <button onClick={handleSaveEditTipoReuniao} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={16} /></button>
                                                        ) : (
                                                            <button onClick={() => handleEditTipoReuniao(tipo)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                                                        )}
                                                        <button onClick={() => handleDeleteTipoReuniao(tipo)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tema / Pauta da Reunião</label>
                                                <input
                                                    type="text"
                                                    value={reuniaoForm.pauta}
                                                    onChange={e => setReuniaoForm({ ...reuniaoForm, pauta: e.target.value })}
                                                    className="w-full text-lg font-medium text-slate-800 border-b border-slate-200 py-2 focus:border-blue-500 focus:outline-none placeholder-slate-300"
                                                    placeholder="Descreva o objetivo principal..."
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Local da Reunião</label>
                                                <input
                                                    type="text"
                                                    value={reuniaoForm.local}
                                                    onChange={e => setReuniaoForm({ ...reuniaoForm, local: e.target.value })}
                                                    className="w-full text-lg font-medium text-slate-800 border-b border-slate-200 py-2 focus:border-blue-500 focus:outline-none placeholder-slate-300"
                                                    placeholder="Ex: Sala dos Professores, Plataforma Google Meet..."
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data da Reunião</label>
                                                <input
                                                    type="date"
                                                    value={reuniaoForm.dataReuniao}
                                                    onChange={e => setReuniaoForm({ ...reuniaoForm, dataReuniao: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hora de Início</label>
                                                <input
                                                    type="time"
                                                    value={reuniaoForm.horaInicio}
                                                    onChange={e => setReuniaoForm({ ...reuniaoForm, horaInicio: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hora de Término</label>
                                                <input
                                                    type="time"
                                                    value={reuniaoForm.horaFim}
                                                    onChange={e => setReuniaoForm({ ...reuniaoForm, horaFim: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo</label>
                                                <select
                                                    value={reuniaoForm.tipo}
                                                    onChange={e => setReuniaoForm({ ...reuniaoForm, tipo: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                >
                                                    {tiposReuniao.map(tipo => (
                                                        <option key={tipo} value={tipo}>{tipo}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Responsável/Convocante</label>
                                                <input
                                                    type="text"
                                                    value={reuniaoForm.responsavel || currentUser || ''}
                                                    readOnly
                                                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed focus:outline-none"
                                                    placeholder="Nome do responsável"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                                                <select
                                                    value={reuniaoForm.status}
                                                    onChange={e => setReuniaoForm({ ...reuniaoForm, status: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                >
                                                    <option value="Agendada">Agendada</option>
                                                    <option value="Realizada">Realizada</option>
                                                    <option value="Cancelada">Cancelada</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Adicionar Participante</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={novoParticipante}
                                                        onChange={e => setNovoParticipante(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleAddParticipante()}
                                                        placeholder="Nome do participante"
                                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                    <button onClick={handleAddParticipante} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl font-semibold transition-colors">
                                                        Adicionar
                                                    </button>
                                                </div>
                                                {reuniaoForm.participantes.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {reuniaoForm.participantes.map((p, index) => (
                                                            <span key={`${p}-${index}`} className="xs-auto px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1 border border-blue-100">
                                                                {p}
                                                                <button onClick={() => handleRemoveParticipante(p)} className="hover:bg-blue-200 rounded-full p-0.5 ml-1 transition-colors">
                                                                    <X size={12} />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 mt-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Relato/Registro da Reunião</label>
                                                <textarea
                                                    value={reuniaoForm.registro}
                                                    onChange={e => setReuniaoForm({ ...reuniaoForm, registro: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 h-32 resize-none"
                                                    placeholder="Descreva as discussões e observações detalhadas..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Encaminhamentos / Decisões</label>
                                                <textarea
                                                    value={reuniaoForm.encaminhamentos}
                                                    onChange={e => setReuniaoForm({ ...reuniaoForm, encaminhamentos: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 h-32 resize-none"
                                                    placeholder="Registre os encaminhamentos, tarefas atribuídas e prazos estabelecidos..."
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                            <button onClick={handleSaveReuniao} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20">
                                                Salvar Reunião
                                            </button>
                                            <button onClick={() => setIsEditingReuniao(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-semibold">
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-4">
                            {mockReunioes.map(reuniao => (
                                <div key={reuniao.id} className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-6 group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${reuniao.status === 'Realizada' ? 'bg-emerald-100 text-emerald-700' :
                                                reuniao.status === 'Agendada' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                {reuniao.status}
                                            </span>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border border-slate-200 text-slate-500`}>
                                                {reuniao.tipo}
                                            </span>
                                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                                <Calendar size={12} /> {reuniao.dataReuniao} {reuniao.horaInicio && `às ${reuniao.horaInicio}`} {reuniao.horaFim && `- ${reuniao.horaFim}`}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 leading-tight">{reuniao.pauta}</h4>
                                        <div className="flex items-center gap-4 mt-2">
                                            <p className="text-xs font-medium text-blue-600 tracking-wide">Responsável: {reuniao.responsavel}</p>
                                            {reuniao.participantes && reuniao.participantes.length > 0 && (
                                                <p className="text-xs font-medium text-slate-500 tracking-wide flex items-center gap-1">
                                                    <Users size={12} /> {reuniao.participantes.length} Participante{reuniao.participantes.length > 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button title="Gerar Ata da Reunião" onClick={() => handleGerarAta(reuniao)} className="w-10 h-10 border border-emerald-200 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 transition-all flex-shrink-0">
                                            <Printer size={16} />
                                        </button>
                                        <button title="Editar Reunião" onClick={() => handleEditReuniao(reuniao)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all flex-shrink-0">
                                            <Edit size={16} />
                                        </button>
                                        <button title="Excluir Reunião" onClick={() => handleDeleteReuniao(reuniao.id)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all flex-shrink-0">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'formacao':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-left">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">PLANO DE FORMAÇÃO</h3>
                                <p className="text-sm text-slate-500 mt-1">Estruturação e acompanhamento das formações continuadas.</p>
                            </div>
                            {!isEditingFormacao && (
                                <button
                                    onClick={() => {
                                        setFormacaoForm({ id: '', especificacao: '', objetivo: '', data: '', publicoAlvo: '', responsavel: currentUser || '', custo: '' });
                                        setIsEditingFormacao(true);
                                    }}
                                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
                                >
                                    <BookOpen size={18} /> Nova Formação
                                </button>
                            )}
                        </div>

                        {isEditingFormacao && (
                            <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm mb-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Especificação da Formação</label>
                                        <input
                                            type="text"
                                            value={formacaoForm.especificacao}
                                            onChange={e => setFormacaoForm({ ...formacaoForm, especificacao: e.target.value })}
                                            className="w-full text-lg font-medium text-slate-800 border-b border-slate-200 py-2 focus:border-purple-500 focus:outline-none placeholder-slate-300"
                                            placeholder="Tema / Título da Formação..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Objetivo</label>
                                        <textarea
                                            value={formacaoForm.objetivo}
                                            onChange={e => setFormacaoForm({ ...formacaoForm, objetivo: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 h-24 resize-none"
                                            placeholder="Descreva o principal objetivo desta formação..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data / Período</label>
                                        <input
                                            type="date"
                                            value={formacaoForm.data}
                                            onChange={e => setFormacaoForm({ ...formacaoForm, data: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Público-Alvo</label>
                                        <input
                                            type="text"
                                            value={formacaoForm.publicoAlvo}
                                            onChange={e => setFormacaoForm({ ...formacaoForm, publicoAlvo: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                            placeholder="Ex: Professores de Matemática"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Responsável</label>
                                        <input
                                            type="text"
                                            value={formacaoForm.responsavel}
                                            onChange={e => setFormacaoForm({ ...formacaoForm, responsavel: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                            placeholder="Nome do responsável..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Custo Estimado / Planejado</label>
                                        <input
                                            type="text"
                                            value={formacaoForm.custo}
                                            onChange={e => setFormacaoForm({ ...formacaoForm, custo: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                            placeholder="Ex: R$ 0,00"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                                    <button onClick={handleSaveFormacao} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-purple-500/20 transition-colors">
                                        Salvar Formação
                                    </button>
                                    <button onClick={() => setIsEditingFormacao(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-semibold transition-colors">
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {mockFormacoes.map(formacao => (
                                <div key={formacao.id} className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-6 group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-purple-100 text-purple-700">
                                                Formação
                                            </span>
                                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                                <Calendar size={12} /> {formacao.data}
                                            </span>
                                            {formacao.custo && (
                                                <span className="text-xs font-medium text-amber-600 flex items-center gap-1 border-l border-slate-200 pl-3">
                                                    Custo: {formacao.custo}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1">{formacao.especificacao}</h4>
                                        <p className="text-sm text-slate-500 mb-3">{formacao.objetivo}</p>
                                        <div className="flex items-center gap-4">
                                            <p className="text-xs font-medium text-purple-600 tracking-wide">Resp: {formacao.responsavel}</p>
                                            <p className="text-xs font-medium text-slate-500 tracking-wide flex items-center gap-1">
                                                <Users size={12} /> Público: {formacao.publicoAlvo}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button title="Editar Formação" onClick={() => handleEditFormacao(formacao)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-purple-50 hover:text-purple-600 transition-all flex-shrink-0">
                                            <Edit size={16} />
                                        </button>
                                        <button title="Excluir Formação" onClick={() => handleDeleteFormacao(formacao.id)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all flex-shrink-0">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {mockFormacoes.length === 0 && !isEditingFormacao && (
                                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">Nenhum plano de formação cadastrado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'acao':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-left">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">PLANO DE AÇÃO</h3>
                                <p className="text-sm text-slate-500 mt-1">Acompanhamento e monitoramento estratégico de metas escolares.</p>
                            </div>
                            {!isEditingMeta && (
                                <button
                                    onClick={() => {
                                        setMetaForm({ id: '', descricao: '', prazo: '', status: 'Não Iniciado', responsavel: '' });
                                        setIsEditingMeta(true);
                                    }}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                                >
                                    <Target size={18} /> Cadastrar Meta
                                </button>
                            )}
                        </div>

                        {isEditingMeta && (
                            <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm mb-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição da Meta</label>
                                        <input
                                            type="text"
                                            value={metaForm.descricao}
                                            onChange={e => setMetaForm({ ...metaForm, descricao: e.target.value })}
                                            className="w-full text-lg font-medium text-slate-800 border-b border-slate-200 py-2 focus:border-emerald-500 focus:outline-none placeholder-slate-300"
                                            placeholder="Ex: Aumentar a taxa de aprovação em Matemática..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prazo</label>
                                        <input
                                            type="date"
                                            value={metaForm.prazo}
                                            onChange={e => setMetaForm({ ...metaForm, prazo: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Responsável Principal</label>
                                        <input
                                            type="text"
                                            value={metaForm.responsavel}
                                            onChange={e => setMetaForm({ ...metaForm, responsavel: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            placeholder="Nome do responsável..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status Inicial</label>
                                        <select
                                            value={metaForm.status}
                                            onChange={e => setMetaForm({ ...metaForm, status: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="Não Iniciado">Não Iniciado</option>
                                            <option value="Em Andamento">Em Andamento</option>
                                            <option value="Concluído">Concluído</option>
                                            <option value="Atrasado">Atrasado</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                                    <button onClick={handleSaveMeta} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-colors">
                                        Salvar Meta
                                    </button>
                                    <button onClick={() => setIsEditingMeta(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-semibold transition-colors">
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {mockMetas.map(meta => (
                                <div key={meta.id} className="p-6 border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-6 group relative overflow-hidden">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${meta.status === 'Concluído' ? 'bg-emerald-500' :
                                        meta.status === 'Atrasado' ? 'bg-rose-500' :
                                            meta.status === 'Em Andamento' ? 'bg-blue-500' : 'bg-slate-300'
                                        }`} />
                                    <div className="flex-1 pl-4">
                                        <h4 className="text-lg font-bold text-slate-900 leading-tight mb-2">{meta.descricao}</h4>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md ${meta.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' :
                                                meta.status === 'Atrasado' ? 'bg-rose-100 text-rose-700' :
                                                    meta.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {meta.status}
                                            </span>
                                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                <Calendar size={14} /> Prazo: {meta.prazo}
                                            </span>
                                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1 border-l border-slate-200 pl-4">
                                                <Users size={14} /> Resp: {meta.responsavel}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditMeta(meta)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all flex-shrink-0">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteMeta(meta.id)} className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all flex-shrink-0">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'pedagogica':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-left">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">PROPOSTA PEDAGÓGICA</h3>
                                <p className="text-sm text-slate-500 mt-1">Repositório e acompanhamento dos PPPs.</p>
                            </div>
                            <div>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                                >
                                    <Upload size={18} /> Subir Arquivo (PDF)
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="p-4 py-3">Arquivo Enviado</th>
                                        <th className="p-4 py-3">Tamanho</th>
                                        <th className="p-4 py-3">Data do Envio</th>
                                        <th className="p-4 py-3">Responsável</th>
                                        <th className="p-4 py-3">Coordenador Regional</th>
                                        <th className="p-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pppHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td
                                                className="p-4 text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer underline decoration-blue-200 underline-offset-4"
                                                onClick={() => handleDownloadArquivo(item.arquivo)}
                                            >
                                                {item.arquivo}
                                            </td>
                                            <td className="p-4 text-sm font-medium text-slate-500">{item.tamanho}</td>
                                            <td className="p-4 text-sm font-bold text-slate-700">{item.dataEnvio}</td>
                                            <td className="p-4 text-sm font-medium text-slate-600">{item.usuario}</td>
                                            <td className="p-4 text-sm font-medium text-slate-600">{item.coordenadorRegional}</td>
                                            <td className="p-4">
                                                <span
                                                    onClick={() => toggleStatus(item.id, item.status)}
                                                    className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors active:scale-95 inline-block select-none ${item.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                                                            item.status === 'Aguardando Análise' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                                                                item.status === 'Em Análise' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                                                    'bg-slate-100 text-slate-700'
                                                        }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'sala':
                return <AcompanhamentoSalaDashboard escolas={escolas} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 pb-12 animate-fade-in relative">
            <PageHeader
                title="Instrumentais de Gestão"
                subtitle="Guia de documentações e planejamentos"
                icon={FileStack}
                badgeText="GESTÃO"
                actions={[]}
            />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-wrap gap-2">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as Tab)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-orange-400' : ''}`} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="mt-6">
                {renderTabContent()}

                {/* Modal de Configuração da Ata */}
                {showAtaModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
                            <div className="bg-blue-500 px-6 py-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <FileText size={20} /> Ata de Reunião
                                </h3>
                                <button onClick={() => setShowAtaModal(null)} className="text-white/80 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-8 text-center bg-blue-50/30">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                                    <Check size={40} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-800 mb-2">Reunião Registrada!</h4>
                                <p className="text-sm text-slate-500 mb-8 max-w-[280px] mx-auto">
                                    A ata foi gerada automaticamente. Como você deseja proceder com o documento oficial?
                                </p>

                                <div className="space-y-3">
                                    <button
                                        onClick={handlePrintAta}
                                        className="w-full flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3.5 font-semibold text-sm transition-all shadow-md shadow-blue-500/20"
                                    >
                                        <Printer size={18} /> Imprimir / PDF
                                    </button>
                                    <button
                                        onClick={handleDownloadDocxAta}
                                        className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl py-3.5 font-semibold text-sm transition-all"
                                    >
                                        <FileDown size={18} className="text-indigo-500" /> Baixar em DOCX (Word)
                                    </button>
                                </div>
                            </div>
                            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-center">
                                <button onClick={() => setShowAtaModal(null)} className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
                                    Concluir e Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bloco de Impressão Oculto */}
                {reuniaoParaImprimir && (
                    <PrintableAta reuniao={reuniaoParaImprimir} />
                )}
            </div>
        </div>
    );
};
