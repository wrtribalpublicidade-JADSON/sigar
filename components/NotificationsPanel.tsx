import React, { useMemo, useState } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Escola } from '../types';
import {
    Bell, CheckCircle, AlertTriangle, XCircle, Search,
    Filter, ChevronRight, School, Users, FileText, Calendar, Target
} from 'lucide-react';
import { Card } from './ui/Card';

interface NotificationsPanelProps {
    escolas: Escola[];
    onNavigateToSchool: (escolaId: string) => void;
}

import { checkSchoolPendencies } from '../utils';
import { PendencyType } from '../types';

interface SchoolPendency {
    escola: Escola;
    pendencies: {
        type: PendencyType;
        label: string;
        severity: 'high' | 'medium' | 'low';
    }[];
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ escolas, onNavigateToSchool }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<PendencyType | 'ALL'>('ALL');

    const pendingData = useMemo(() => {
        const results: SchoolPendency[] = [];

        escolas.forEach(escola => {
            const pendencies = checkSchoolPendencies(escola);
            if (pendencies.length > 0) {
                results.push({ escola, pendencies });
            }
        });

        return results.sort((a, b) => b.pendencies.length - a.pendencies.length);
    }, [escolas]);

    const filteredData = pendingData.filter(item => {
        const matchesSearch = item.escola.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'ALL' || item.pendencies.some(p => p.type === filterType);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6 pb-12 animate-fade-in">
            <PageHeader
                title="Central de Notificações"
                subtitle="Acompanhamento de Pendências e Prazos"
                icon={Bell}
                badgeText={`${pendingData.length} Escolas com Pendências`}
            />

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar escola..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 outline-none transition-all"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setFilterType('ALL')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterType === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilterType('MATRICULA')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterType === 'MATRICULA' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                    >
                        Matrícula
                    </button>
                    <button
                        onClick={() => setFilterType('RH')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterType === 'RH' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                    >
                        RH
                    </button>
                    <button
                        onClick={() => setFilterType('PLANO_ACAO')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterType === 'PLANO_ACAO' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                    >
                        Plano de Ação
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredData.map(({ escola, pendencies }) => (
                    <Card key={escola.id} className="border-l-4 border-l-brand-orange overflow-hidden hover:shadow-lg transition-all group">
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-black text-slate-800 line-clamp-2 min-h-[3rem]">
                                    {escola.nome}
                                </h3>
                                {(escola.recursosHumanos?.length === 0) && (
                                    <span className="bg-red-100 text-red-700 text-[9px] px-2 py-1 rounded font-bold uppercase">Crítico</span>
                                )}
                            </div>

                            <div className="space-y-2 mb-4">
                                {pendencies.map((p, idx) => (
                                    <div key={idx} className="flex items-start gap-3 bg-slate-50 p-2 rounded-lg">
                                        {p.type === 'MATRICULA' && <Users className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />}
                                        {p.type === 'TURMAS' && <School className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />}
                                        {p.type === 'RH' && <Users className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />}
                                        {p.type === 'PLANO_ACAO' && <Target className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                                        {p.type === 'MONITORAMENTO' && <FileText className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />}

                                        <span className="text-xs font-medium text-slate-600 leading-tight">
                                            {p.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => onNavigateToSchool(escola.id)}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-brand-orange text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors"
                            >
                                <span>Resolver Ocorrências</span>
                                <ChevronRight className="w-3 h-3" strokeWidth={3} />
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredData.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 text-center opacity-50">
                    <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Tudo em dia!</h3>
                    <p className="text-slate-500">Nenhuma pendência encontrada para os filtros selecionados.</p>
                </div>
            )}
        </div>
    );
};
