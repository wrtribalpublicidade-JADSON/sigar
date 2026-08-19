import React, { useState } from 'react';
import { 
  AlertTriangle, ShieldAlert, Clock, ArrowRight, X, Calendar, 
  School, Users, BookOpen, CheckCircle, ChevronLeft, ChevronRight,
  ExternalLink
} from 'lucide-react';
import { AlertaPendencia } from '../../types';
import { getDaysDifference } from '../../services/pendenciasEngineService';

interface AlertaObrigatorioPopupProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertaPendencia[];
  onNavigateToResolve: (alert: AlertaPendencia) => void;
}

export const AlertaObrigatorioPopup: React.FC<AlertaObrigatorioPopupProps> = ({
  isOpen,
  onClose,
  alerts,
  onNavigateToResolve
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || alerts.length === 0) return null;

  const currentAlert = alerts[currentIndex] || alerts[0];
  const { days, isOverdue } = getDaysDifference(currentAlert.prazo);
  const isExpired = currentAlert.status === 'VENCIDA' || isOverdue;
  const isEscalated = currentAlert.status === 'ESCALONADA';

  const handleNext = () => {
    if (currentIndex < alerts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in border border-slate-200 flex flex-col">
        
        {/* Header Header */}
        <div className={`p-6 text-white relative overflow-hidden ${
          isEscalated 
            ? 'bg-gradient-to-r from-purple-700 to-indigo-800' 
            : isExpired 
              ? 'bg-gradient-to-r from-rose-600 to-red-700' 
              : 'bg-gradient-to-r from-orange-500 to-amber-600'
        }`}>
          {/* Subtle Glows */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                {isEscalated ? (
                  <ShieldAlert className="w-7 h-7 text-white animate-bounce" />
                ) : (
                  <AlertTriangle className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/25 text-white">
                    {isEscalated ? 'Demanda Escalonada' : isExpired ? 'Prazo Vencido' : 'Pendência Identificada'}
                  </span>
                  <span className="text-[10px] font-bold text-white/80 uppercase">
                    Prioridade {currentAlert.prioridade}
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight mt-1">
                  Regularização Necessária
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              title="Fechar temporariamente nesta sessão"
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          
          {/* Alert Description */}
          <div>
            <h4 className="text-base font-black text-slate-800 leading-snug">
              {currentAlert.titulo}
            </h4>
            <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
              {currentAlert.descricao}
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Módulo</span>
              <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {currentAlert.modulo}
              </span>
            </div>

            {currentAlert.escola_nome && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Unidade Escolar</span>
                <span className="font-bold text-slate-700 text-right max-w-[250px] truncate">
                  {currentAlert.escola_nome}
                </span>
              </div>
            )}

            {currentAlert.turma_nome && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Turma / Grupo</span>
                <span className="font-bold text-slate-700">{currentAlert.turma_nome}</span>
              </div>
            )}

            {currentAlert.periodo && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Período Afetado</span>
                <span className="font-bold text-slate-700">{currentAlert.periodo}</span>
              </div>
            )}

            {currentAlert.prazo && (
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Prazo Estabelecido</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-slate-800">{new Date(currentAlert.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isOverdue 
                      ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {isOverdue ? `${days} dia(s) de atraso` : `${days} dia(s) restantes`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Observação da coordenação/administração */}
          {currentAlert.observacao_alerta && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-amber-900 uppercase text-[10px] tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Mensagem da Gestão Pedagógica
              </div>
              <p className="text-amber-800 font-medium leading-relaxed italic">
                "{currentAlert.observacao_alerta}"
              </p>
            </div>
          )}

          {/* Pagination for Multiple Alerts */}
          {alerts.length > 1 && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400">
                Pendência <strong className="text-slate-700">{currentIndex + 1}</strong> de <strong className="text-slate-700">{alerts.length}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === alerts.length - 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors uppercase tracking-wider"
          >
            Lembrar mais tarde
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigateToResolve(currentAlert);
            }}
            className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25 flex items-center gap-2 uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Resolver Pendência</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
