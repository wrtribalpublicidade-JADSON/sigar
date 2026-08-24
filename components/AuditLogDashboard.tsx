
import React, { useState, useEffect, useCallback } from 'react';
import { AccessLog, AuditLog } from '../types';
import { fetchAccessLogs, fetchAuditLogs } from '../services/logService';
import { Search, Filter, Download, ArrowLeft, RefreshCw, Shield, Clock, User, Activity, FileText, RotateCcw } from 'lucide-react';

interface AuditLogDashboardProps {
    onBack: () => void;
}

export const AuditLogDashboard: React.FC<AuditLogDashboardProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'ACCESS' | 'AUDIT'>('ACCESS');
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [queriedTabs, setQueriedTabs] = useState<{ ACCESS: boolean; AUDIT: boolean }>({ ACCESS: false, AUDIT: false });
    const [searchInput, setSearchInput] = useState('');
    const [appliedUser, setAppliedUser] = useState('');
    const [filterModule, setFilterModule] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterDay, setFilterDay] = useState('');

    const MONTHS = [
        { value: '0', label: 'Janeiro' },
        { value: '1', label: 'Fevereiro' },
        { value: '2', label: 'Março' },
        { value: '3', label: 'Abril' },
        { value: '4', label: 'Maio' },
        { value: '5', label: 'Junho' },
        { value: '6', label: 'Julho' },
        { value: '7', label: 'Agosto' },
        { value: '8', label: 'Setembro' },
        { value: '9', label: 'Outubro' },
        { value: '10', label: 'Novembro' },
        { value: '11', label: 'Dezembro' }
    ];

    const loadDataWithFilters = useCallback(async (
        userVal = searchInput,
        moduleVal = filterModule,
        yearVal = filterYear,
        monthVal = filterMonth,
        dayVal = filterDay
    ) => {
        setLoading(true);
        setAppliedUser(userVal);
        setQueriedTabs(prev => ({ ...prev, [activeTab]: true }));
        try {
            const filters = {
                user: userVal,
                module: moduleVal,
                year: yearVal,
                month: monthVal,
                day: dayVal
            };
            if (activeTab === 'ACCESS') {
                const data = await fetchAccessLogs(filters);
                setAccessLogs(data);
            } else {
                const data = await fetchAuditLogs(filters);
                setAuditLogs(data);
            }
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, searchInput, filterModule, filterYear, filterMonth, filterDay]);

    const handleConsultar = () => {
        loadDataWithFilters(searchInput, filterModule, filterYear, filterMonth, filterDay);
    };

    const loadData = handleConsultar;

    const handleLimparFiltros = () => {
        setSearchInput('');
        setFilterModule('');
        setFilterYear('');
        setFilterMonth('');
        setFilterDay('');
        setAppliedUser('');
        setAccessLogs([]);
        setAuditLogs([]);
        setQueriedTabs(prev => ({ ...prev, [activeTab]: false }));
    };

    const years = React.useMemo(() => {
        const currentYear = new Date().getFullYear();
        const startYear = 2025;
        const list = [];
        for (let y = currentYear; y >= startYear; y--) {
            list.push(y.toString());
        }
        return list;
    }, []);

    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

    const matchesDate = (logDateStr: string) => {
        if (!logDateStr) return false;
        const date = new Date(logDateStr);
        const logYear = date.getFullYear().toString();
        const logMonth = date.getMonth().toString();
        const logDay = date.getDate().toString();

        const matchY = filterYear === '' || logYear === filterYear;
        const matchM = filterMonth === '' || logMonth === filterMonth;
        const matchD = filterDay === '' || logDay === filterDay;

        return matchY && matchM && matchD;
    };

    const filteredAccessLogs = accessLogs.filter(log =>
        (appliedUser === '' ||
         log.user_email?.toLowerCase().includes(appliedUser.toLowerCase()) || 
         log.user_name?.toLowerCase().includes(appliedUser.toLowerCase()) || 
         log.user_id?.includes(appliedUser)) &&
        matchesDate(log.created_at)
    );

    const filteredAuditLogs = auditLogs.filter(log => {
        const matchesUser = appliedUser === '' ||
            log.user_email?.toLowerCase().includes(appliedUser.toLowerCase()) || 
            log.user_name?.toLowerCase().includes(appliedUser.toLowerCase()) || 
            log.user_id?.includes(appliedUser);

        let matchesModule = true;
        if (filterModule) {
            if (filterModule === 'NAVEGACAO') {
                matchesModule = log.action === 'ACCESS' || log.action === 'NAVIGATE' || !!log.module?.startsWith('NAVEGACAO');
            } else if (filterModule === 'ALTERACOES') {
                matchesModule = log.action !== 'ACCESS' && log.action !== 'NAVIGATE' && !log.module?.startsWith('NAVEGACAO');
            } else if (filterModule === 'DIARIO') {
                matchesModule = ['PLANO_AULA', 'PLANO_AULA_AVALIACAO', 'PLANO_AULA_INFANTIL', 'PLANO_AULA_INFANTIL_AVALIACAO', 'FREQUENCIA', 'FREQUENCIA_INFANTIL', 'AULAS_MINISTRADAS', 'AULAS_MINISTRADAS_INFANTIL', 'PLANO_CURSO', 'PLANO_CURSO_INFANTIL', 'NOTAS', 'PARECER_INFANTIL', 'AVALIACAO_DOCENTE_INFANTIL', 'PORTFOLIO_INFANTIL'].includes(log.module);
            } else if (filterModule === 'GESTAO') {
                matchesModule = ['IG_REUNIAO', 'IG_FORMACAO', 'IG_ACAO', 'IG_PPP', 'IG_ACOMP_SALA', 'IG_CALENDARIO', 'CONSELHO_CLASSE', 'CONSELHO_ACOMP_DOCENTE', 'CONSELHO_ENCAMINHAMENTO', 'CONSELHO_STATUS_ETAPA', 'CONSELHO_SOLICITACAO', 'ATIVIDADE_COMPLEMENTAR', 'MERENDA_ITEM', 'MERENDA_ENTRADA', 'MERENDA_ENTREGA', 'GESTAO_REDE'].includes(log.module);
            } else if (filterModule === 'CADASTROS') {
                matchesModule = ['ESCOLA', 'VISITA', 'COORDENADOR', 'COORDENADOR_TURMAS', 'ESTUDANTE', 'TURMA', 'USUARIO', 'USUARIO_SENHA', 'PERMISSOES'].includes(log.module);
            } else {
                matchesModule = log.module === filterModule || (log.module?.startsWith('NAVEGACAO') && filterModule.startsWith('NAVEGACAO') && log.module === filterModule);
            }
        }

        return matchesUser && matchesModule && matchesDate(log.created_at);
    });

    const getAuditDescription = (log: AuditLog) => {
        if (log.action === 'ACCESS' || log.action === 'NAVIGATE' || log.module?.startsWith('NAVEGACAO')) {
            const grupo = log.details?.grupo || log.details?.group || 'Menu';
            const menu = log.details?.menu || log.details?.label || log.record_id || log.module;
            return `Acessou o menu "${menu}" no grupo [${grupo}]`;
        }

        const actionStr = log.action === 'CREATE' ? 'Cadastrou' : log.action === 'UPDATE' ? 'Alterou' : log.action === 'DELETE' ? 'Excluiu' : log.action;
        
        switch (log.module) {
            // === DIÁRIO DE CLASSE (FUNDAMENTAL & INFANTIL) ===
            case 'PLANO_AULA':
                return `${actionStr} guia de aprendizagem "${log.details?.titulo || ''}" • ${log.details?.turma || ''} (${log.details?.componente || ''})`;
            case 'PLANO_AULA_AVALIACAO':
                return `Avaliou guia de aprendizagem "${log.details?.titulo || ''}" como "${log.details?.status || ''}" • ${log.details?.turma || ''} (${log.details?.componente || ''})`;
            case 'PLANO_AULA_INFANTIL':
                return `${actionStr} guia ECE "${log.details?.titulo || ''}" • ${log.details?.turma || ''} (${log.details?.campoExperiencia || ''})`;
            case 'PLANO_AULA_INFANTIL_AVALIACAO':
                return `Avaliou guia ECE "${log.details?.titulo || ''}" como "${log.details?.status || ''}" • ${log.details?.turma || ''} (${log.details?.campoExperiencia || ''})`;
            case 'FREQUENCIA':
                return `${actionStr === 'Excluiu' ? 'Excluiu chamada' : actionStr === 'Alterou' ? 'Editou chamada' : 'Registrou chamada'} do dia ${log.details?.data || ''} • ${log.details?.turma || ''} (${log.details?.componente || ''})${log.details?.presentes !== undefined ? ` - ${log.details.presentes}/${log.details.total} presentes (${log.details.taxa}%)` : ''}`;
            case 'FREQUENCIA_INFANTIL':
                return `${actionStr === 'Excluiu' ? 'Excluiu chamada ECE' : actionStr === 'Alterou' ? 'Editou chamada ECE' : 'Registrou chamada ECE'} do dia ${log.details?.data || ''} • ${log.details?.turma || ''} (${log.details?.anoSerie || ''})${log.details?.presentes !== undefined ? ` - ${log.details.presentes}/${log.details.total} presentes (${log.details.taxa}%)` : ''}`;
            case 'AULAS_MINISTRADAS':
                return `${actionStr} registro de aula do dia ${log.details?.data || ''} • ${log.details?.turma || ''} (${log.details?.componente || ''}) - ${log.details?.aulas || 1} aula(s)${log.details?.conteudo ? `: "${log.details.conteudo}"` : ''}`;
            case 'AULAS_MINISTRADAS_INFANTIL':
                return `${actionStr} registro de aula ECE do dia ${log.details?.data || ''} • ${log.details?.turma || ''} (${log.details?.campoExperiencia || ''})${log.details?.conteudo ? `: "${log.details.conteudo}"` : ''}`;
            case 'PLANO_CURSO':
                return `${actionStr} plano de curso de ${log.details?.componente || ''} • ${log.details?.anoSerie || ''} (${log.details?.bimestre || ''} - Ref. ${log.details?.anoReferencia || ''})`;
            case 'PLANO_CURSO_INFANTIL':
                return `${actionStr} plano de curso ECE de ${log.details?.campoExperiencia || ''} • ${log.details?.anoSerie || ''} (${log.details?.bimestre || ''} - Ref. ${log.details?.anoReferencia || ''})`;
            case 'PLANO_CURSO_IMPORT':
            case 'PLANO_CURSO_INFANTIL_IMPORT':
                return `Importou ${log.details?.count || ''} planos de curso via planilha Excel (Ano ${log.details?.anoReferencia || ''})`;
            case 'PARECER_INFANTIL':
                return `${actionStr} parecer descritivo de ${log.details?.aluno || 'aluno'} • ${log.details?.turma || ''} (${log.details?.periodo || ''}) - Status: ${log.details?.status || 'Salvo'}`;
            case 'AVALIACAO_DOCENTE_INFANTIL':
                return `Registrou avaliação docente BNCC • Turma: ${log.details?.turma || ''} • Campo: ${log.details?.campo || ''} (${log.details?.bimestre || ''})`;
            case 'PORTFOLIO_INFANTIL':
                return `${actionStr} registro no Portfólio Visual "${log.details?.titulo || ''}" • ${log.details?.turma || ''} (${log.details?.data || ''}) - ${log.details?.fotosCount || 0} foto(s)`;
            case 'NOTAS':
                return `${actionStr === 'Excluiu' || log.action === 'DELETE' ? 'Apagou' : 'Lançou / Atualizou'} notas da turma ${log.details?.class || ''} (${log.details?.component || ''} - ${log.details?.period || ''})`;

            // === INSTRUMENTAIS DE GESTÃO & CONSELHO ===
            case 'IG_REUNIAO':
                return `${actionStr} reunião de ciclo de gestão: "${log.details?.tema || ''}" (${log.details?.dataReuniao || ''})`;
            case 'IG_FORMACAO':
                return `${actionStr} plano de formação continuada: "${log.details?.tema || ''}" (${log.details?.dataFormacao || ''})`;
            case 'IG_ACAO':
                return `${actionStr} meta/ação no Plano de Ação: "${log.details?.meta || ''}" (Prazo: ${log.details?.prazo || ''})`;
            case 'IG_PPP':
                return `${actionStr} Proposta Pedagógica (PPP) - Versão: ${log.details?.versao || ''} (${log.details?.ano || ''})`;
            case 'IG_ACOMP_SALA':
                return `${actionStr} acompanhamento em sala do(a) prof(a) ${log.details?.professor || ''} • Turma ${log.details?.turma || ''}`;
            case 'IG_CALENDARIO':
                return `${actionStr} evento oficial no calendário: "${log.details?.titulo || ''}" (${log.details?.data || ''})`;
            case 'CONSELHO_CLASSE':
                return `${actionStr} ata/registro do Conselho de Classe (${log.details?.turma || ''} - ${log.details?.periodo || ''})`;
            case 'CONSELHO_ACOMP_DOCENTE':
                return `${actionStr} acompanhamento docente do Conselho • Estudante: ${log.details?.estudante_nome || ''} (Prof: ${log.details?.professor || ''})`;
            case 'CONSELHO_ENCAMINHAMENTO':
                return `${actionStr} encaminhamento pedagógico (${log.details?.tipo || ''}) para o estudante ${log.details?.estudante || ''}`;
            case 'CONSELHO_STATUS_ETAPA':
                return `Atualizou status da etapa do conselho (${log.details?.periodo || ''} - ${log.details?.componente || ''}) para "${log.details?.status || ''}"`;
            case 'CONSELHO_SOLICITACAO':
                return `Enviou solicitação de desbloqueio para o ${log.details?.periodo || ''} (Motivo: ${log.details?.motivo || ''})`;

            // === ATIVIDADES COMPLEMENTARES ===
            case 'ATIVIDADE_COMPLEMENTAR':
                return `${actionStr} atividade/oficina "${log.details?.nome || ''}" (${log.details?.categoria || ''})`;
            case 'ATIVIDADE_COMPLEMENTAR_FREQUENCIA':
                return `Registrou frequência na oficina (${log.details?.data || ''}) - ${log.details?.presentes || 0}/${log.details?.totalAlunos || 0} presentes`;
            case 'ATIVIDADE_COMPLEMENTAR_MATRICULA':
                return `${actionStr === 'Excluiu' || log.action === 'DELETE' ? 'Desvinculou estudante da oficina' : 'Matriculou estudante na oficina'}`;

            // === MERENDA ESCOLAR ===
            case 'MERENDA_ITEM':
                return `${actionStr} item de merenda escolar "${log.details?.nome || ''}" (${log.details?.categoria || ''})`;
            case 'MERENDA_ENTRADA':
                return `Registrou entrada de estoque: ${log.details?.quantidade || ''} un. (Origem: ${log.details?.origem || 'Fornecedor'})`;
            case 'MERENDA_ENTREGA':
                return `${actionStr === 'Excluiu' || log.action === 'DELETE' ? 'Cancelou/Estornou' : 'Registrou'} entrega de merenda para escola (${log.details?.itensCount || ''} itens)`;
            case 'MERENDA_ESCOLAR':
                return `${actionStr} no controle de merenda escolar`;

            // === CADASTROS GERAIS E CONFIGURAÇÕES ===
            case 'ESCOLA':
                return `${actionStr} a escola ${log.details?.nome || log.details?.new?.nome || 'não identificada'}`;
            case 'VISITA':
                return `${actionStr} relatório de visita técnica para a escola ${log.details?.escolaNome || log.details?.escola_nome || 'não identificada'}`;
            case 'COORDENADOR':
                return `${actionStr} o cadastro do coordenador(a)/professor(a) ${log.details?.nome || 'não identificado'}`;
            case 'COORDENADOR_TURMAS':
                return `Vinculou turmas ao coordenador/professor`;
            case 'ESTUDANTE':
                if (log.details?.bulk) {
                    return `Importou ${log.details.count} estudantes em lote na escola ${log.details.school || ''}`;
                }
                return `${actionStr} o estudante ${log.details?.name || 'não identificado'}`;
            case 'TURMA':
                return `${actionStr} a turma ${log.details?.name || log.details?.identificacao || 'não identificada'}`;
            case 'USUARIO':
                return `Atualizou o perfil do usuário ${log.details?.nome || ''} (${log.details?.email || ''}) - Função: ${log.details?.funcao || ''}`;
            case 'USUARIO_SENHA':
                return `Solicitou envio de link para redefinição de senha do usuário ${log.details?.nome || ''} (${log.details?.email || ''})`;
            case 'PERMISSOES':
                return `Atualizou a matriz de permissões de acesso do perfil ${log.details?.funcao || log.record_id || ''}`;
            case 'GESTAO_REDE':
                return `Atualizou as diretrizes da rede municipal (Média: ${log.details?.notaMinima || '7.0'}, ${log.details?.periodosCount || 0} períodos)`;

            // === SUPORTE TÉCNICO ===
            case 'SUPORTE_CHAMADO':
                return `Abriu chamado de suporte "${log.details?.titulo || ''}" (#${log.record_id?.substring(0, 6)})`;
            case 'SUPORTE_MENSAGEM':
                return `Enviou mensagem no chamado de suporte #${log.details?.chamado_id?.substring(0, 6) || log.record_id?.substring(0, 6)}`;
            case 'SUPORTE_STATUS':
                return `Alterou status do chamado #${log.record_id?.substring(0, 6)} para "${log.details?.novo_status || ''}"`;

            default:
                if (log.details?.descricao) return log.details.descricao;
                return `${actionStr} no módulo ${log.module}`;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-brand-orange transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Voltar</span>
                    </button>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-brand-orange" />
                        Auditoria e Segurança
                    </h2>
                    <p className="text-slate-500 mt-1">Monitoramento de acesso e alterações no sistema</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-brand-orange transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Atualizar</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('ACCESS')}
                    className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ACCESS'
                        ? 'border-brand-orange text-brand-orange'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    Logs de Acesso
                </button>
                <button
                    onClick={() => setActiveTab('AUDIT')}
                    className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'AUDIT'
                        ? 'border-brand-orange text-brand-orange'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <FileText className="w-4 h-4" />
                    Logs de Auditoria (Alterações)
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center flex-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mr-1">
                        <Filter className="w-4 h-4 text-brand-orange" />
                        <span>Filtros:</span>
                    </div>

                    {/* Campo de Busca */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por usuário/nome/email..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleConsultar();
                                }
                            }}
                            className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange w-64 bg-slate-50/50 focus:bg-white transition"
                        />
                    </div>

                    {/* Filtro de Módulos */}
                    {activeTab === 'AUDIT' && (
                        <select
                            value={filterModule}
                            onChange={(e) => setFilterModule(e.target.value)}
                            className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange font-medium text-slate-700 bg-slate-50/50 focus:bg-white transition"
                        >
                            <option value="">Todos os Registros e Movimentações</option>
                            <option value="ALTERACOES">⚡ Apenas Ações / Alterações (Sem Navegação)</option>
                            <option value="DIARIO">📖 Diário de Classe (Geral)</option>
                            <option value="GESTAO">🏢 Gestão, Conselho & Merenda</option>
                            <option value="CADASTROS">👥 Cadastros Gerais & Usuários</option>

                            <optgroup label="Diário de Classe - Fundamental">
                                <option value="PLANO_AULA">Guia de Aprendizagem</option>
                                <option value="PLANO_AULA_AVALIACAO">Avaliação de Guia de Aprendizagem</option>
                                <option value="FREQUENCIA">Frequência / Chamada</option>
                                <option value="AULAS_MINISTRADAS">Aulas Ministradas</option>
                                <option value="PLANO_CURSO">Plano de Curso</option>
                                <option value="NOTAS">Lançamento de Notas</option>
                            </optgroup>

                            <optgroup label="Diário de Classe - Educação Infantil">
                                <option value="PLANO_AULA_INFANTIL">Guia ECE</option>
                                <option value="PLANO_AULA_INFANTIL_AVALIACAO">Avaliação de Guia ECE</option>
                                <option value="FREQUENCIA_INFANTIL">Frequência ECE</option>
                                <option value="AULAS_MINISTRADAS_INFANTIL">Aulas Ministradas ECE</option>
                                <option value="PLANO_CURSO_INFANTIL">Plano de Curso ECE</option>
                                <option value="PARECER_INFANTIL">Parecer Descritivo</option>
                                <option value="AVALIACAO_DOCENTE_INFANTIL">Avaliação Docente BNCC</option>
                                <option value="PORTFOLIO_INFANTIL">Portfólio Visual</option>
                            </optgroup>

                            <optgroup label="Instrumentais de Gestão & Conselho">
                                <option value="IG_REUNIAO">Reuniões de Gestão</option>
                                <option value="IG_FORMACAO">Planos de Formação</option>
                                <option value="IG_ACAO">Plano de Ação</option>
                                <option value="IG_PPP">Proposta Pedagógica (PPP)</option>
                                <option value="IG_ACOMP_SALA">Acompanhamento em Sala</option>
                                <option value="IG_CALENDARIO">Calendário Oficial</option>
                                <option value="CONSELHO_CLASSE">Conselho de Classe</option>
                                <option value="CONSELHO_ACOMP_DOCENTE">Acompanhamento Docente (Conselho)</option>
                                <option value="CONSELHO_ENCAMINHAMENTO">Encaminhamentos Pedagógicos</option>
                                <option value="CONSELHO_STATUS_ETAPA">Status de Etapa / Bloqueios</option>
                                <option value="CONSELHO_SOLICITACAO">Solicitações de Desbloqueio</option>
                            </optgroup>

                            <optgroup label="Outros Módulos">
                                <option value="ATIVIDADE_COMPLEMENTAR">Atividades Complementares / Oficinas</option>
                                <option value="MERENDA_ITEM">Merenda: Itens</option>
                                <option value="MERENDA_ENTRADA">Merenda: Entradas de Estoque</option>
                                <option value="MERENDA_ENTREGA">Merenda: Entregas</option>
                                <option value="ESCOLA">Escolas</option>
                                <option value="VISITA">Visitas Técnicas</option>
                                <option value="COORDENADOR">Coordenadores / Professores</option>
                                <option value="TURMA">Turmas</option>
                                <option value="ESTUDANTE">Estudantes</option>
                                <option value="USUARIO">Usuários</option>
                                <option value="PERMISSOES">Permissões de Usuários</option>
                                <option value="GESTAO_REDE">Configurações da Rede</option>
                            </optgroup>

                            <optgroup label="Suporte Técnico">
                                <option value="SUPORTE_CHAMADO">Suporte: Abertura de Chamados</option>
                                <option value="SUPORTE_MENSAGEM">Suporte: Envio de Mensagens</option>
                                <option value="SUPORTE_STATUS">Suporte: Alterações de Status</option>
                            </optgroup>

                            <optgroup label="Navegação de Menus">
                                <option value="NAVEGACAO">Todas as Navegações de Menus</option>
                            </optgroup>
                        </select>
                    )}

                    {/* Filtro de Ano */}
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange text-slate-700 bg-slate-50/50 focus:bg-white transition"
                    >
                        <option value="">Todos os Anos</option>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    {/* Filtro de Mês */}
                    <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange text-slate-700 bg-slate-50/50 focus:bg-white transition"
                    >
                        <option value="">Todos os Meses</option>
                        {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>

                    {/* Filtro de Dia */}
                    <select
                        value={filterDay}
                        onChange={(e) => setFilterDay(e.target.value)}
                        className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange text-slate-700 bg-slate-50/50 focus:bg-white transition"
                    >
                        <option value="">Todos os Dias</option>
                        {days.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                {/* Botões de Ação: Consultar Registros e Limpar */}
                <div className="flex items-center gap-2 self-end lg:self-center">
                    <button
                        onClick={handleConsultar}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 active:scale-95"
                    >
                        <Search className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>{loading ? 'Consultando...' : 'Consultar Registros'}</span>
                    </button>

                    {(searchInput || filterModule || filterYear || filterMonth || filterDay) && (
                        <button
                            onClick={handleLimparFiltros}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition active:scale-95"
                            title="Limpar todos os filtros"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Limpar</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Informações da Consulta */}
            {queriedTabs[activeTab] && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 text-xs text-slate-500 animate-fade-in">
                    <span className="font-medium">
                        Exibindo <strong className="text-slate-800 font-bold">{activeTab === 'ACCESS' ? filteredAccessLogs.length : filteredAuditLogs.length}</strong> registro(s) encontrado(s)
                    </span>
                    {(appliedUser || filterModule || filterYear || filterMonth || filterDay) && (
                        <span className="text-[11px] bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg border border-orange-200/50 mt-1 sm:mt-0 font-medium">
                            Filtros aplicados
                        </span>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {!queriedTabs[activeTab] ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center mb-4 border border-orange-100 shadow-sm">
                            <Search className="w-8 h-8 text-brand-orange" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-1">
                            Consulta de {activeTab === 'ACCESS' ? 'Logs de Acesso' : 'Logs de Auditoria'}
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mb-6">
                            Configure os filtros desejados acima e clique no botão <strong>"Consultar Registros"</strong> para carregar os dados.
                        </p>
                        <button
                            onClick={handleConsultar}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 hover:shadow-lg transition-all active:scale-95"
                        >
                            <Search className="w-4 h-4" />
                            <span>Consultar Registros</span>
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'ACCESS' ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Data/Hora</th>
                                        <th className="px-6 py-4">Usuário</th>
                                        <th className="px-6 py-4">Ação</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">IP / User Agent</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">Carregando logs de acesso...</td></tr>
                                    ) : filteredAccessLogs.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Nenhum registro de acesso encontrado com os filtros selecionados.</td></tr>
                                    ) : filteredAccessLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="font-medium text-slate-800">{log.user_name || log.user_email || 'N/A'}</div>
                                                {log.user_name && <div className="text-xs text-slate-400">{log.user_email}</div>}
                                                <div className="text-xs text-[10px] text-slate-400">{log.user_id}</div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${log.action === 'LOGIN' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {log.status === 'SUCCESS' ? 'Sucesso' : 'Falha'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-xs text-slate-500 max-w-xs truncate" title={log.user_agent}>
                                                <div>IP: {log.ip_address || '-'}</div>
                                                <div className="truncate">{log.user_agent}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Data/Hora</th>
                                        <th className="px-6 py-4">Usuário</th>
                                        <th className="px-6 py-4">Módulo / Ação</th>
                                        <th className="px-6 py-4">Descrição da Atividade</th>
                                        <th className="px-6 py-4">Registro ID</th>
                                        <th className="px-6 py-4">Detalhes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">Carregando logs de auditoria...</td></tr>
                                    ) : filteredAuditLogs.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Nenhum registro de auditoria encontrado com os filtros selecionados.</td></tr>
                                    ) : filteredAuditLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="font-medium text-slate-800">{log.user_name || log.user_email || 'N/A'}</div>
                                                {log.user_name && <div className="text-xs text-slate-400">{log.user_email}</div>}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-slate-500">{log.module}</span>
                                                    <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                        log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' :
                                                        log.action === 'UPDATE' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' :
                                                        log.action === 'DELETE' ? 'bg-rose-50 text-rose-700 border border-rose-200/50' :
                                                        'bg-sky-50 text-sky-700 border border-sky-200/50'
                                                    }`}>
                                                        {log.action === 'ACCESS' ? 'ACESSO' : log.action === 'NAVIGATE' ? 'NAVEGAÇÃO' : log.action}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-slate-700 font-medium whitespace-normal max-w-xs">
                                                {getAuditDescription(log)}
                                            </td>
                                            <td className="px-6 py-3 text-xs text-slate-500 font-mono">
                                                {log.record_id?.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-3 text-xs text-slate-500 max-w-sm">
                                                <details>
                                                    <summary className="cursor-pointer hover:text-brand-orange">Ver JSON</summary>
                                                    <pre className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 text-[10px] overflow-x-auto">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </details>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
