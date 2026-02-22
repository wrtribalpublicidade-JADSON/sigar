import React, { useState } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Users, BookOpen, UserCheck, AlertTriangle, GraduationCap } from 'lucide-react';

type Tab = 'estudantil' | 'avaliacao' | 'acompanhamento' | 'encaminhamentos';

export const ConselhoClasse: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('estudantil');

    const tabs = [
        { id: 'estudantil', label: 'Reunião Estudantil', icon: Users },
        { id: 'avaliacao', label: 'Avaliação Docente', icon: BookOpen },
        { id: 'acompanhamento', label: 'Acompanhamento Docente', icon: UserCheck },
        { id: 'encaminhamentos', label: 'Encaminhamentos e Intervenções', icon: AlertTriangle }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'estudantil':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Reunião Estudantil</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Acompanhamento e registro dos Conselhos de Classe participativos com foco nos estudantes.
                        </p>
                    </div>
                );
            case 'avaliacao':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Avaliação Docente</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Instrumentos para avaliação de desempenho e práticas pedagógicas da equipe docente.
                        </p>
                    </div>
                );
            case 'acompanhamento':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <UserCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Acompanhamento Docente</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Registros de acompanhamento contínuo e feedback para os professores.
                        </p>
                    </div>
                );
            case 'encaminhamentos':
                return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-brand-orange/10 text-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Encaminhamentos e Intervenções</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Plano de intervenção pedagógica e encaminhamentos gerados a partir do Conselho de Classe.
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 pb-12 animate-fade-in relative">
            <PageHeader
                title="Conselho de Classe"
                subtitle="Análise coletiva sobre o processo de ensino e aprendizagem"
                icon={GraduationCap}
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

            <div className="mt-8">
                {renderTabContent()}
            </div>
        </div>
    );
};
