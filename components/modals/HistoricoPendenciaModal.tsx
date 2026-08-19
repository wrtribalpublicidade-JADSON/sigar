import React, { useEffect, useState } from 'react';
import { X, History, Clock, CheckCircle, AlertTriangle, Send, ShieldAlert, ArrowUpRight, RefreshCw, FileText, User } from 'lucide-react';
import { AlertaPendencia, AlertaPendenciaHistorico } from '../../types';
import { pendenciasEngineService } from '../../services/pendenciasEngineService';

interface HistoricoPendenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AlertaPendencia | null;
}

export const HistoricoPendenciaModal: React.FC<HistoricoPendenciaModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  const [historico, setHistorico] = useState<AlertaPendenciaHistorico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && item) {
      loadHistorico();
    }
  }, [isOpen, item]);

  const loadHistorico = async () => {
    if (!item) return;
    setIsLoading(true);
    try {
      const data = await pendenciasEngineService.getHistorico(item.id);
      setHistorico(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  const getActionBadge = (acao: string) => {
    switch (acao) {
      case 'CRIACAO':
        return { icon: FileText, label: 'Identificação Automática', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'ENVIO_ALERTA':
        return { icon: Send, label: 'Alerta Emitido', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'LEMBRETE':
        return { icon: Clock, label: 'Lembrete Enviado', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'VENCIMENTO':
        return { icon: AlertTriangle, label: 'Prazo Vencido', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'ESCALONAMENTO':
        return { icon: ShieldAlert, label: 'Demanda Escalonada', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'RESOLUCAO':
        return { icon: CheckCircle, label: 'Pendência Resolvida', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { icon: History, label: acao, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-in border border-slate-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Histórico da Demanda</h3>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">
                {item.titulo} • {item.turma_nome || item.escola_nome}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs grid grid-cols-2 gap-2 text-slate-600">
          <div>
            <span className="font-bold text-slate-400 block text-[10px] uppercase">Responsável</span>
            <span className="font-bold text-slate-800">{item.usuario_nome || 'Não vinculado'}</span> ({item.usuario_perfil || 'Geral'})
          </div>
          <div>
            <span className="font-bold text-slate-400 block text-[10px] uppercase">Unidade Escolar</span>
            <span className="font-bold text-slate-800">{item.escola_nome}</span>
          </div>
          <div>
            <span className="font-bold text-slate-400 block text-[10px] uppercase">Status Atual</span>
            <span className="font-black text-orange-600 uppercase">{item.status}</span>
          </div>
          <div>
            <span className="font-bold text-slate-400 block text-[10px] uppercase">Prazo Fixado</span>
            <span className="font-bold text-slate-800">{item.prazo ? new Date(item.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não definido'}</span>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mb-2" />
              <span className="text-xs font-bold">Carregando linha do tempo...</span>
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              Nenhum evento registrado no histórico para esta demanda.
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
              {historico.map((h, idx) => {
                const badge = getActionBadge(h.acao);
                const IconComponent = badge.icon;
                const dateObj = new Date(h.created_at);
                const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={h.id || idx} className="relative group">
                    {/* Node Dot */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-orange-500 group-hover:scale-125 transition-transform" />

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.color}`}>
                          <IconComponent className="w-3 h-3" />
                          {badge.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {formattedDate} às {formattedTime}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {h.descricao}
                      </p>

                      {h.executado_por && (
                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 pt-1 border-t border-slate-100">
                          <User className="w-3 h-3" />
                          <span>Executado por: <strong className="text-slate-600">{h.executado_por}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors uppercase tracking-wider"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
