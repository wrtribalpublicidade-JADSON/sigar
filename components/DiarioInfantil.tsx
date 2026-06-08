import React, { useState } from 'react';
import { 
  ClipboardList, BookOpen, FileText, ClipboardCheck, Camera, Heart,
  GraduationCap, BarChart3
} from 'lucide-react';
import { Escola, Coordenador } from '../types';
import { PlanoCursoInfantil } from './PlanoCursoInfantil';
import { PlanoAulaInfantil } from './PlanoAulaInfantil';
import { AulasMinistradasInfantil } from './AulasMinistradasInfantil';
import { PortfolioVisualInfantil } from './PortfolioVisualInfantil';
import { ParecerDescritivoInfantil } from './ParecerDescritivoInfantil';
import { FrequenciaInfantil } from './FrequenciaInfantil';
import { AvaliacaoDocenteInfantil } from './AvaliacaoDocenteInfantil';
import { PainelResultadosInfantil } from './PainelResultadosInfantil';

interface DiarioInfantilProps {
  escolas: Escola[];
  isDemoMode: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  currentUser: Coordenador | null;
}

type TabId = 'plano_curso' | 'plano_aula' | 'aulas_ministradas' | 'portfolio_visual' | 'parecer_descritivo' | 'frequencia' | 'avaliacao_docente' | 'painel_resultados';

export const DiarioInfantil: React.FC<DiarioInfantilProps> = ({
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
    { id: 'portfolio_visual' as TabId, label: 'Portfólio Visual', icon: Camera },
    { id: 'parecer_descritivo' as TabId, label: 'Parecer Descritivo', icon: Heart },
    { id: 'frequencia' as TabId, label: 'Frequência', icon: ClipboardCheck },
    { id: 'avaliacao_docente' as TabId, label: 'Avaliação Docente', icon: GraduationCap },
    { id: 'painel_resultados' as TabId, label: 'Painel de Resultados', icon: BarChart3 },
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
        return <PlanoCursoInfantil escolas={escolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'plano_aula':
        return <PlanoAulaInfantil escolas={escolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'aulas_ministradas':
        return <AulasMinistradasInfantil escolas={escolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'portfolio_visual':
        return <PortfolioVisualInfantil escolas={escolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'parecer_descritivo':
        return <ParecerDescritivoInfantil escolas={escolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'frequencia':
        return <FrequenciaInfantil escolas={escolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'avaliacao_docente':
        return <AvaliacaoDocenteInfantil escolas={escolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
      case 'painel_resultados':
        return <PainelResultadosInfantil escolas={escolas} isDemoMode={isDemoMode} isAdmin={isAdmin} userEmail={userEmail} currentUser={currentUser} subHeader={tabsNode} />;
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
