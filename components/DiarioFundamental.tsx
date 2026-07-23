import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, BookOpen, FileText, ClipboardCheck, GraduationCap
} from 'lucide-react';
import { Escola, Coordenador, Segmento } from '../types';
import { PlanoCurso } from './PlanoCurso';
import { PlanoAula } from './PlanoAula';
import { AulasMinistradas } from './AulasMinistradas';
import { Frequencia } from './Frequencia';
import { Notas } from './Notas';
import { hasTabAccess } from '../utils/permissions';

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
  const fundamentalEscolas = useMemo(() => {
    return escolas.filter(e => {
      if (e.segmentos && e.segmentos.length > 0 && e.segmentos.every(s => s === Segmento.INFANTIL)) {
        return false;
      }
      return true;
    });
  }, [escolas]);

  const tabs = [
    { id: 'plano_curso' as TabId, label: 'Plano de Curso', icon: ClipboardList },
    { id: 'plano_aula' as TabId, label: 'Guia de Aprendizagem', icon: BookOpen },
    { id: 'aulas_ministradas' as TabId, label: 'Aulas Ministradas', icon: FileText },
    { id: 'frequencia' as TabId, label: 'Frequência', icon: ClipboardCheck },
    { id: 'notas' as TabId, label: 'Notas', icon: GraduationCap },
  ];

  const filteredTabs = tabs.filter(tab => 
    isAdmin || hasTabAccess('diario_fundamental', tab.id, currentUser?.funcao)
  );

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    return filteredTabs[0]?.id || 'plano_curso';
  });

  const tabsNode = (
    <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl print:hidden">
      {filteredTabs.map(tab => {
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
    if (filteredTabs.length === 0) {
      return (
        <div className="p-8 text-center text-slate-500 font-medium">
          Você não tem permissão para acessar nenhuma das abas deste Diário de Classe.
        </div>
      );
    }
    switch (activeTab) {
      case 'plano_curso':
        return <PlanoCurso escolas={fundamentalEscolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'plano_aula':
        return <PlanoAula escolas={fundamentalEscolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'aulas_ministradas':
        return <AulasMinistradas escolas={fundamentalEscolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'frequencia':
        return <Frequencia escolas={fundamentalEscolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'notas':
        return <Notas escolas={fundamentalEscolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
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
