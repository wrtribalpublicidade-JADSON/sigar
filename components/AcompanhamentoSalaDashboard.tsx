import React, { useState } from 'react';
import {
    Eye, Edit3, CheckCircle2, Search, Filter, Plus, Bell,
    ChevronLeft, ChevronRight, FileText, Presentation, TrendingUp
} from 'lucide-react';

import { Escola, RecursoHumano } from '../types';
import { ObservacaoSalaForm } from './ObservacaoSalaForm';

interface Observacao {
    id: string;
    professor: string;
    iniciais: string;
    etapa: string;
    data: string;
    status: 'Concluído' | 'Rascunho' | 'Não Iniciado';
    cor: string;
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
}

export const AcompanhamentoSalaDashboard: React.FC<AcompanhamentoSalaDashboardProps> = ({ escolas = [] }) => {
    const [activeFilterTab, setActiveFilterTab] = useState('todas');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProfessor, setSelectedProfessor] = useState<{ id: string; nome: string; etapa: string; escolasVinculadas: { id: string; nome: string }[] } | null>(null);

    const allObservacoes = React.useMemo(() => {
        let obsList: Observacao[] = [];
        let index = 0;

        escolas.forEach(escola => {
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
                    });
                });
            }
        });

        // Sort alphabetically to maintain consistency
        obsList.sort((a, b) => a.professor.localeCompare(b.professor));

        return obsList;
    }, [escolas]);

    const filteredObservacoes = React.useMemo(() => {
        return allObservacoes.filter(obs => {
            // Apply text search
            if (searchTerm && !obs.professor.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !obs.etapa.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
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

            return true;
        });
    }, [allObservacoes, activeFilterTab, searchTerm]);

    const totalCount = filteredObservacoes.length;
    // As placeholders, we use 0 since we don't have real observational records
    const rascunhosCount = 0;
    const concluidoCount = 0;

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
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Pesquisar professor ou etapa..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                        <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                            <Filter className="w-4 h-4" />
                            Mais Filtros
                        </button>
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
                            ) : filteredObservacoes.map((obs) => (
                                <tr key={obs.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${obs.cor}`}>
                                                {obs.iniciais}
                                            </div>
                                            <span className="font-bold text-slate-800">{obs.professor}</span>
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

                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Mostrando {totalCount} professores</span>
                    <div className="flex items-center gap-1">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm">
                            1
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                            2
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                            3
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && selectedProfessor && (
                <ObservacaoSalaForm
                    professor={selectedProfessor}
                    escolasVinculadas={selectedProfessor.escolasVinculadas}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedProfessor(null);
                    }}
                />
            )}
        </div>
    );
};
