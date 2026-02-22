import React, { useState } from 'react';
import { PageHeader } from './ui/PageHeader';
import { AcompanhamentoSalaDashboard } from './AcompanhamentoSalaDashboard';
import { FileStack, Users, BookOpen, Target, FileText, Presentation } from 'lucide-react';
import { Escola } from '../types';

type Tab = 'reunioes' | 'formacao' | 'acao' | 'pedagogica' | 'sala';

interface InstrumentaisGestaoProps {
    escolas?: Escola[];
}

export const InstrumentaisGestao: React.FC<InstrumentaisGestaoProps> = ({ escolas = [] }) => {
    const [activeTab, setActiveTab] = useState<Tab>('reunioes');

    const tabs = [
        { id: 'reunioes', label: 'Ciclo de Reuniões', icon: Users },
        { id: 'formacao', label: 'Plano de Formação', icon: BookOpen },
        { id: 'acao', label: 'Plano de Ação', icon: Target },
        { id: 'pedagogica', label: 'Proposta Pedagógica', icon: FileText },
        { id: 'sala', label: 'Acompanhamento em Sala', icon: Presentation }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'reunioes':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Ciclo de Reuniões</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Acompanhamento e registro dos ciclos de reuniões pedagógicas e administrativas. Em breve, você poderá gerenciar as pautas e atas por aqui.
                        </p>
                    </div>
                );
            case 'formacao':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Plano de Formação</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Estruturação dos planos de formação continuada para a equipe escolar. Em breve, ferramentas para acompanhamento de trilhas de aprendizado.
                        </p>
                    </div>
                );
            case 'acao':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Target className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Plano de Ação</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Instrumental para elaboração e monitoramento de planos de intervenção e ações corretivas das escolas.
                        </p>
                    </div>
                );
            case 'pedagogica':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Proposta Pedagógica</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Repositório e acompanhamento das Propostas Pedagógicas (PPP) das unidades escolares.
                        </p>
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
            </div>
        </div>
    );
};
