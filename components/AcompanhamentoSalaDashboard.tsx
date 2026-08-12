import React, { useState } from 'react';
import {
    Eye, Edit3, CheckCircle2, Search, Filter, Plus, Bell,
    ChevronLeft, ChevronRight, FileText, Presentation, TrendingUp,
    School, GraduationCap, RotateCcw, X
} from 'lucide-react';

import { Escola, RecursoHumano } from '../types';
import { ObservacaoSalaForm } from './ObservacaoSalaForm';
import { igAcompanhamentoSalaService } from '../services/gestaoConselhoService';

interface Observacao {
    id: string;
    professor: string;
    iniciais: string;
    etapa: string;
    data: string;
    status: 'Concluído' | 'Rascunho' | 'Não Iniciado';
    cor: string;
    escolaId?: string;
    escolaNome?: string;
    anoSerie?: string;
}

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getColors = (index: number) => {
    const colors = [
        'bg-blue-100 text-blue-600',
        'bg-pink-100 text-pink-600',
        'bg-emerald-100 text-emerald-600',
        'bg-amber-100 text-amber-600',
        'bg-purple-100 text-purple-600',
        'bg-indigo-100 text-indigo-600',
    ];
    return colors[index % colors.length];
};

interface AcompanhamentoSalaDashboardProps {
    escolas?: Escola[];
    selectedEscolaId?: string;
}

export const AcompanhamentoSalaDashboard: React.FC<AcompanhamentoSalaDashboardProps> = ({ escolas = [], selectedEscolaId = 'all' }) => {
    const [activeFilterTab, setActiveFilterTab] = useState('todas');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEscolaFilter, setSelectedEscolaFilter] = useState('ALL');
    const [selectedAnoSerieFilter, setSelectedAnoSerieFilter] = useState('ALL');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProfessor, setSelectedProfessor] = useState<{ id: string; nome: string; etapa: string; escolasVinculadas: { id: string; nome: string }[] } | null>(null);
    const [acompanhamentos, setAcompanhamentos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadDados = async () => {
        setIsLoading(true);
        try {
            const filterIds = selectedEscolaId === 'all' ? escolas.map(e => e.id) : [selectedEscolaId];
            const dados = await igAcompanhamentoSalaService.getAll(filterIds.length > 0 ? filterIds : undefined);
            setAcompanhamentos(dados || []);
        } catch (err) {
            console.error('Erro ao carregar acompanhamentos de sala:', err);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        loadDados();
    }, [escolas, selectedEscolaId]);

    const allObservacoes = React.useMemo(() => {
        let obsList: Observacao[] = [];
        let index = 0;

        const filteredEscolas = selectedEscolaId === 'all' 
            ? escolas 
            : escolas.filter(e => e.id === selectedEscolaId);

        filteredEscolas.forEach(escola => {
            if (escola.recursosHumanos) {
                const professores = escola.recursosHumanos.filter((rh: RecursoHumano) =>
                    rh.funcao && rh.funcao.toLowerCase().includes('professor')
                );

                professores.forEach((prof: RecursoHumano) => {
                    obsList.push({
                        id: prof.id,
                        professor: prof.nome,
                        iniciais: getInitials(prof.nome),
                        etapa: prof.etapaAtuacao || 'Não definida',
                        data: '-',
                        status: 'Não Iniciado',
                        cor: getColors(index++),
                        escolaId: escola.id,
                        escolaNome: escola.nome,
                        anoSerie: prof.etapaAtuacao || ''
                    });
                });
            }
        });

        // Sort alphabetically to maintain consistency
        obsList.sort((a, b) => a.professor.localeCompare(b.professor));

        // Merge with fetched records
        obsList = obsList.map(obs => {
            // Find the most recent record for this professor
            const professorRecords = acompanhamentos.filter(a => a.professor_id === obs.id).sort((a, b) => {
                return new Date(b.data_observacao || b.created_at).getTime() - new Date(a.data_observacao || a.created_at).getTime();
            });

            if (professorRecords.length > 0) {
                const latest = professorRecords[0];
                return {
                    ...obs,
                    status: latest.status as any,
                    data: latest.data_observacao ? new Date(latest.data_observacao).toLocaleDateString('pt-BR') : '-',
                    escolaId: latest.escola_id || obs.escolaId,
                    escolaNome: escolas.find(e => e.id === (latest.escola_id || obs.escolaId))?.nome || obs.escolaNome,
                    anoSerie: latest.ano_serie || latest.turma_nome || obs.etapa
                };
            }
            return obs;
        });

        return obsList;
    }, [escolas, acompanhamentos, selectedEscolaId]);

    const availableAnoSerieOptions = React.useMemo(() => {
        const optionsSet = new Set<string>();
        const defaults = [
            'Creche II', 'Creche III', 'Pré I', 'Pré II',
            '1º ANO', '2º ANO', '3º ANO', '4º ANO', '5º ANO',
            '6º ANO', '7º ANO', '8º ANO', '9º ANO',
            'Anos Iniciais', 'Anos Finais', 'Educação Infantil', 'EJA'
        ];
        defaults.forEach(d => optionsSet.add(d));

        allObservacoes.forEach(o => {
            if (o.etapa && o.etapa !== 'Não definida') optionsSet.add(o.etapa);
            if (o.anoSerie) optionsSet.add(o.anoSerie);
        });

        return Array.from(optionsSet).sort();
    }, [allObservacoes]);

    const filteredObservacoes = React.useMemo(() => {
        return allObservacoes.filter(obs => {
            // Apply text search
            if (searchTerm) {
                const term = searchTerm.toLowerCase().trim();
                const matchesProf = obs.professor.toLowerCase().includes(term);
                const matchesEtapa = obs.etapa.toLowerCase().includes(term);
                const matchesEscola = (obs.escolaNome || '').toLowerCase().includes(term);
                const matchesAno = (obs.anoSerie || '').toLowerCase().includes(term);
                if (!matchesProf && !matchesEtapa && !matchesEscola && !matchesAno) {
                    return false;
                }
            }

            // Apply tab filter
            if (activeFilterTab === 'infantil' && !obs.etapa.toLowerCase().includes('infantil')) {
                return false;
            }

            if (activeFilterTab === 'fundamental' &&
                (!obs.etapa.toLowerCase().includes('anos iniciais') &&
                    !obs.etapa.toLowerCase().includes('anos finais') &&
                    !obs.etapa.toLowerCase().includes('fundamental'))) {
                return false;
            }

            // Apply Unidade Escolar filter
            if (selectedEscolaFilter !== 'ALL' && obs.escolaId !== selectedEscolaFilter) {
                return false;
            }

            // Apply Status filter
            if (selectedStatusFilter !== 'ALL' && obs.status !== selectedStatusFilter) {
                return false;
            }

            // Apply Ano/Série/Grupo/Faixa filter
            if (selectedAnoSerieFilter !== 'ALL') {
                const target = selectedAnoSerieFilter.toLowerCase();
                const etapaVal = (obs.etapa || '').toLowerCase();
                const anoVal = (obs.anoSerie || '').toLowerCase();
                if (!etapaVal.includes(target) && !anoVal.includes(target)) {
                    return false;
                }
            }

            return true;
        });
    }, [allObservacoes, activeFilterTab, searchTerm, selectedEscolaFilter, selectedStatusFilter, selectedAnoSerieFilter]);

    const hasActiveFilters = selectedEscolaFilter !== 'ALL' || selectedAnoSerieFilter !== 'ALL' || selectedStatusFilter !== 'ALL';

    const handleClearFilters = () => {
        setSelectedEscolaFilter('ALL');
        setSelectedAnoSerieFilter('ALL');
        setSelectedStatusFilter('ALL');
        setSearchTerm('');
    };

    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [activeFilterTab, searchTerm, selectedEscolaId, selectedEscolaFilter, selectedAnoSerieFilter, selectedStatusFilter, itemsPerPage]);

    const totalCount = filteredObservacoes.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedObservacoes = React.useMemo(() => {
        const start = (safeCurrentPage - 1) * itemsPerPage;
        return filteredObservacoes.slice(start, start + itemsPerPage);
    }, [filteredObservacoes, safeCurrentPage, itemsPerPage]);

    const rascunhosCount = filteredObservacoes.filter(o => o.status === 'Rascunho').length;
    const concluidoCount = filteredObservacoes.filter(o => o.status === 'Concluído').length;

    return (
        <div className="space-y-6 animate-fade-in w-full text-left">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Visão Geral das Observações</h2>
            </div>

            {/* Metricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-bold text-slate-500">Total de Professores</h3>
                        <Eye className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-4xl font-black text-slate-800 tracking-tight mb-2">{allObservacoes.length}</p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                        <span>Base de servidores atualizada</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-bold text-slate-500">Rascunhos Pendentes</h3>
                        <Edit3 className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-4xl font-black text-amber-500 tracking-tight mb-2">{rascunhosCount}</p>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 italic">
                        <span>Necessitam conclusão</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-bold text-slate-500">Avaliações Concluídas</h3>
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                    </div>
                    <p className="text-4xl font-black text-emerald-500 tracking-tight mb-2">{concluidoCount}</p>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 italic">
                        <span>Protocolos finalizados</span>
                    </div>
                </div>
            </div>

            {/* Listagem */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                    {/* Filtros de aba */}
                    <div className="flex flex-wrap gap-2 mb-6 bg-slate-50 p-1.5 rounded-xl w-fit">
                        {[
                            { id: 'todas', label: 'Todas as Etapas' },
                            { id: 'infantil', label: 'Educação Infantil' },
                            { id: 'fundamental', label: 'Ensino Fundamental' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilterTab(f.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeFilterTab === f.id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Busca e filtros */}
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Pesquisar professor, escola, etapa ou ano/série..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilterPanel(!showFilterPanel)}
                                className={`flex items-center justify-center gap-2 px-5 py-2.5 border rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                    showFilterPanel || hasActiveFilters
                                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Filter className="w-4 h-4 text-blue-600" />
                                <span>Mais Filtros</span>
                                {hasActiveFilters && (
                                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse ml-0.5" />
                                )}
                            </button>
                            {hasActiveFilters && (
                                <button
                                    onClick={handleClearFilters}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    title="Limpar todos os filtros"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Limpar</span>
                                </button>
                            )}
                        </div>

                        {/* Filtros expandidos */}
                        {(showFilterPanel || hasActiveFilters) && (
                            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                                {/* Unidade Escolar */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                        <School className="w-3.5 h-3.5 text-blue-500" />
                                        Unidade Escolar
                                    </label>
                                    <select
                                        value={selectedEscolaFilter}
                                        onChange={(e) => setSelectedEscolaFilter(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                    >
                                        <option value="ALL">Todas as Unidades Escolares</option>
                                        {escolas.map(e => (
                                            <option key={e.id} value={e.id}>{e.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Ano/Série/Grupo/Faixa */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                        <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                                        Ano / Série / Grupo / Faixa
                                    </label>
                                    <select
                                        value={selectedAnoSerieFilter}
                                        onChange={(e) => setSelectedAnoSerieFilter(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                    >
                                        <option value="ALL">Todos os Anos / Séries / Grupos</option>
                                        {availableAnoSerieOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                                        Status da Observação
                                    </label>
                                    <select
                                        value={selectedStatusFilter}
                                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                    >
                                        <option value="ALL">Todos os Status</option>
                                        <option value="Concluído">Concluído</option>
                                        <option value="Rascunho">Rascunho</option>
                                        <option value="Não Iniciado">Não Iniciado</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Nome do Professor</th>
                                <th className="px-6 py-4">Série/Etapa</th>
                                <th className="px-6 py-4">Data da Observação</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredObservacoes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Nenhum professor encontrado com os filtros atuais.
                                    </td>
                                </tr>
                            ) : paginatedObservacoes.map((obs) => (
                                <tr key={obs.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${obs.cor}`}>
                                                {obs.iniciais}
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-800 block">{obs.professor}</span>
                                                {obs.escolaNome && (
                                                    <span className="text-[11px] text-slate-400 font-medium block truncate max-w-[220px]">
                                                        {obs.escolaNome}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-600 text-sm">{obs.etapa}</td>
                                    <td className="px-6 py-4 font-medium text-slate-600 text-sm">{obs.data}</td>
                                    <td className="px-6 py-4">
                                        {obs.status === 'Concluído' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Concluído
                                            </span>
                                        ) : obs.status === 'Rascunho' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-600 font-bold text-xs">
                                                <Edit3 className="w-3.5 h-3.5" />
                                                Rascunho
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
                                                Não Iniciado
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                const profEscolas = escolas
                                                    .filter(esc => esc.recursosHumanos?.some(rh => rh.id === obs.id))
                                                    .map(esc => ({ id: esc.id, nome: esc.nome }));

                                                setSelectedProfessor({
                                                    id: obs.id,
                                                    nome: obs.professor,
                                                    etapa: obs.etapa,
                                                    escolasVinculadas: profEscolas
                                                });
                                                setIsModalOpen(true);
                                            }}
                                            className={`text-sm font-bold transition-colors ${obs.status === 'Concluído' ? 'text-blue-600 hover:text-blue-700' : 'text-slate-600 hover:text-slate-800'}`}
                                        >
                                            {obs.status === 'Concluído' ? 'Ver Relatório' : obs.status === 'Rascunho' ? 'Continuar Edição' : 'Iniciar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalCount > 0 && (
                    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
                        <div>
                            Mostrando{' '}
                            <span className="font-bold text-slate-800">
                                {Math.min((safeCurrentPage - 1) * itemsPerPage + 1, totalCount)}
                            </span>{' '}
                            a{' '}
                            <span className="font-bold text-slate-800">
                                {Math.min(safeCurrentPage * itemsPerPage, totalCount)}
                            </span>{' '}
                            de <span className="font-bold text-slate-800">{totalCount}</span> professores registrados
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Items per page selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">Exibir:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={e => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none text-xs font-bold text-slate-700 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={30}>30</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            {/* Page Navigation Buttons */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={safeCurrentPage === 1}
                                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                                    title="Página Anterior"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <span className="px-2 text-xs font-bold text-slate-700">
                                    {safeCurrentPage} / {totalPages}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={safeCurrentPage === totalPages}
                                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                                    title="Próxima Página"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && selectedProfessor && (
                <ObservacaoSalaForm
                    professor={selectedProfessor}
                    escolasVinculadas={selectedProfessor.escolasVinculadas}
                    historico={acompanhamentos.filter(a => a.professor_id === selectedProfessor.id).sort((a, b) => new Date(b.data_observacao || b.created_at).getTime() - new Date(a.data_observacao || a.created_at).getTime())}
                    onSaveSuccess={() => {
                        loadDados();
                    }}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedProfessor(null);
                    }}
                />
            )}
        </div>
    );
};
