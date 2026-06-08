import React, { useState } from 'react';
import { 
  ClipboardList, BookOpen, FileText, ClipboardCheck, GraduationCap
} from 'lucide-react';
import { Escola, Coordenador } from '../types';
import { PlanoCurso } from './PlanoCurso';
import { PlanoAula } from './PlanoAula';
import { AulasMinistradas } from './AulasMinistradas';
import { Frequencia } from './Frequencia';
import { Notas } from './Notas';

interface DiarioFundamentalProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
}

type TabId = 'plano_curso' | 'plano_aula' | 'aulas_ministradas' | 'frequencia' | 'notas';

export const DiarioFundamental: React.FC<DiarioFundamentalProps> = ({
  escolas,
  isDemoMode,
  isAdmin,
  userEmail,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('plano_curso');

  const tabs = [
    { id: 'plano_curso' as TabId, label: 'Plano de Curso', icon: ClipboardList },
    { id: 'plano_aula' as TabId, label: 'Guia de Aprendizagem', icon: BookOpen },
    { id: 'aulas_ministradas' as TabId, label: 'Aulas Ministradas', icon: FileText },
    { id: 'frequencia' as TabId, label: 'Frequência', icon: ClipboardCheck },
    { id: 'notas' as TabId, label: 'Notas', icon: GraduationCap },
  ];

  const tabsNode = (
    <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl print:hidden">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-bold flex items-center gap-2 rounded-lg transition-all ${
              isActive
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'plano_curso':
        return <PlanoCurso escolas={escolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'plano_aula':
        return <PlanoAula escolas={escolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'aulas_ministradas':
        return <AulasMinistradas escolas={escolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'frequencia':
        return <Frequencia escolas={escolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'notas':
        return <Notas escolas={escolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      default:
        return null;
    }
  };

  return (
    <>
      {renderTabContent()}
    </>
  );
};
