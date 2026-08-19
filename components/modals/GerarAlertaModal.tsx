import React, { useState } from 'react';
import { X, Send, Calendar, AlertTriangle, Clock, CheckCircle, ShieldAlert, Sparkles, School, Users, Layers } from 'lucide-react';
import { AlertaPendencia, PrioridadePendenciaAlerta } from '../../types';
import { addBusinessDays, formatISODate } from '../../services/pendenciasEngineService';

interface GerarAlertaModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: AlertaPendencia[];
  onSuccess: () => void;
  currentUserName?: string;
  currentUserRole?: string;
  onGenerate: (
    ids: string[], 
    prazo: string, 
    observacao: string, 
    prioridade: PrioridadePendenciaAlerta,
    destinatario?: 'RESPONSAVEL_DIRETO' | 'GESTAO_ESCOLAR' | 'AMBOS'
  ) => Promise<boolean | { success: number; failed: number }>;
}

export const GerarAlertaModal: React.FC<GerarAlertaModalProps> = ({
  isOpen,
  onClose,
  items,
  onSuccess,
  currentUserName = 'Administrador',
  currentUserRole = 'Coordenador Regional',
  onGenerate
}) => {
  const isRegionalUser = (currentUserRole || '').toLowerCase().includes('regional') || (currentUserRole || '').toLowerCase().includes('administrador');
  
  const [prazo, setPrazo] = useState<string>(() => formatISODate(addBusinessDays(new Date(), 5)));
  const [prioridade, setPrioridade] = useState<PrioridadePendenciaAlerta>('ALTA');
  const [observacao, setObservacao] = useState<string>('');
  const [destinatario, setDestinatario] = useState<'RESPONSAVEL_DIRETO' | 'GESTAO_ESCOLAR' | 'AMBOS'>(
    isRegionalUser ? 'GESTAO_ESCOLAR' : 'RESPONSAVEL_DIRETO'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || items.length === 0) return null;

  const isBatch = items.length > 1;

  const handleSetPresetDays = (days: number) => {
    setPrazo(formatISODate(addBusinessDays(new Date(), days)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prazo) {
      setError('Por favor, informe a data limite (prazo) para regularização.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const ids = items.map(i => i.id);
      const res = await onGenerate(ids, prazo, observacao, prioridade, destinatario);
      if (res) {
        onSuccess();
        onClose();
      } else {
        setError('Ocorreu um erro ao processar os alertas. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      setError('Falha ao enviar os alertas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-in border border-slate-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white relative overflow-hidden shrink-0">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">
                  {isBatch ? `Gerar Alertas em Massa (${items.length} itens)` : 'Gerar Alerta e Notificação'}
                </h3>
                <p className="text-orange-100 text-xs font-semibold mt-0.5">
                  {isBatch 
                    ? `Notificar múltiplos servidores e equipes gestoras`
                    : `${items[0]?.usuario_nome || 'Servidor'} • ${items[0]?.escola_nome || 'Escola'}`}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Target Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>{isBatch ? 'Pendências Selecionadas' : 'Detalhes da Demanda'}</span>
              <span className="text-orange-600 font-bold">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
            </div>
            
            <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {items.slice(0, 5).map((item, idx) => (
                <div key={item.id || idx} className="text-xs bg-white p-2.5 rounded-xl border border-slate-200/70 flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800">{item.titulo}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      <strong>Responsável:</strong> {item.usuario_nome} ({item.usuario_perfil || 'Docente'})
                    </p>
                    {item.co_responsaveis_nomes && (
                      <p className="text-orange-700 text-[10px] font-semibold mt-0.5">
                        <strong>Co-responsáveis:</strong> {item.co_responsaveis_nomes}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200/50 shrink-0">
                    {item.modulo}
                  </span>
                </div>
              ))}
              {items.length > 5 && (
                <p className="text-[11px] text-center text-slate-400 font-semibold py-1">
                  + {items.length - 5} outras pendências selecionadas
                </p>
              )}
            </div>
          </div>

          {/* FLUXO HIERÁRQUICO DE NOTIFICAÇÃO */}
          <div className="bg-gradient-to-br from-orange-50/60 to-slate-50 border border-orange-200/80 rounded-2xl p-4 space-y-2.5">
            <label className="block text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-orange-600" /> Fluxo de Notificação e Escalonamento *
              </span>
              <span className="text-[10px] bg-orange-100 text-orange-800 font-black px-2.5 py-0.5 rounded-full">
                Emissor: {currentUserRole || 'Regional'}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              
              {/* Opção 1: Gestão Escolar (Co-responsável) */}
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="destinatario"
                  value="GESTAO_ESCOLAR"
                  checked={destinatario === 'GESTAO_ESCOLAR'}
                  onChange={() => setDestinatario('GESTAO_ESCOLAR')}
                  className="sr-only peer"
                />
                <div className="p-3 rounded-xl border border-slate-200 bg-white peer-checked:border-orange-500 peer-checked:bg-orange-500 peer-checked:text-white transition-all text-left shadow-sm h-full flex flex-col justify-between hover:border-orange-300">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <School className="w-3.5 h-3.5" /> Gestão Escolar
                    </div>
                    <p className="text-[10px] opacity-80 mt-1 leading-tight">
                      Notifica Coordenadores Pedagógicos e Gestores da Escola.
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase mt-2 block tracking-wider opacity-90">
                    Regional ➔ Gestão
                  </span>
                </div>
              </label>

              {/* Opção 2: Responsável Direto (Professor/Servidor) */}
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="destinatario"
                  value="RESPONSAVEL_DIRETO"
                  checked={destinatario === 'RESPONSAVEL_DIRETO'}
                  onChange={() => setDestinatario('RESPONSAVEL_DIRETO')}
                  className="sr-only peer"
                />
                <div className="p-3 rounded-xl border border-slate-200 bg-white peer-checked:border-orange-500 peer-checked:bg-orange-500 peer-checked:text-white transition-all text-left shadow-sm h-full flex flex-col justify-between hover:border-orange-300">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Users className="w-3.5 h-3.5" /> Professor / Servidor
                    </div>
                    <p className="text-[10px] opacity-80 mt-1 leading-tight">
                      Notifica o docente ou profissional titular da demanda.
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase mt-2 block tracking-wider opacity-90">
                    Gestão ➔ Docente
                  </span>
                </div>
              </label>

              {/* Opção 3: Ambos */}
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="destinatario"
                  value="AMBOS"
                  checked={destinatario === 'AMBOS'}
                  onChange={() => setDestinatario('AMBOS')}
                  className="sr-only peer"
                />
                <div className="p-3 rounded-xl border border-slate-200 bg-white peer-checked:border-orange-500 peer-checked:bg-orange-500 peer-checked:text-white transition-all text-left shadow-sm h-full flex flex-col justify-between hover:border-orange-300">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Layers className="w-3.5 h-3.5" /> Gestão + Professor
                    </div>
                    <p className="text-[10px] opacity-80 mt-1 leading-tight">
                      Notifica concomitantemente todos os envolvidos.
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase mt-2 block tracking-wider opacity-90">
                    Notificação Conjunta
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Prazo */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-orange-500" /> Prazo para Regularização *
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Atalhos rápidos:</span>
            </label>

            {/* Presets */}
            <div className="flex gap-2 mb-2.5">
              {[
                { label: '3 dias', days: 3 },
                { label: '5 dias úteis', days: 5 },
                { label: '7 dias', days: 7 },
                { label: '10 dias', days: 10 }
              ].map(p => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => handleSetPresetDays(p.days)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <input
              type="date"
              value={prazo}
              min={formatISODate(new Date())}
              onChange={e => setPrazo(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
              required
            />
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Nível de Prioridade
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'BAIXA', label: 'Baixa', color: 'border-slate-200 text-slate-600 peer-checked:border-slate-800 peer-checked:bg-slate-900 peer-checked:text-white' },
                { id: 'MEDIA', label: 'Média', color: 'border-amber-200 text-amber-700 peer-checked:border-amber-500 peer-checked:bg-amber-500 peer-checked:text-white' },
                { id: 'ALTA', label: 'Alta (Crítica)', color: 'border-rose-200 text-rose-700 peer-checked:border-rose-500 peer-checked:bg-rose-500 peer-checked:text-white' }
              ].map(pr => (
                <label key={pr.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="prioridade"
                    value={pr.id}
                    checked={prioridade === pr.id}
                    onChange={() => setPrioridade(pr.id as PrioridadePendenciaAlerta)}
                    className="sr-only peer"
                  />
                  <div className={`py-2.5 px-3 rounded-xl border text-center text-xs font-bold transition-all ${pr.color} shadow-sm`}>
                    {pr.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Observação Complementar */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Orientação / Mensagem Complementar (Opcional)
            </label>
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Ex: Favor regularizar os lançamentos antes do fechamento bimestral da unidade escolar..."
              rows={3}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 resize-none font-medium"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 uppercase tracking-wider disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isBatch ? 'Emitir Alertas em Massa' : 'Enviar Alerta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
