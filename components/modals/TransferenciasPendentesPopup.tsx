import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRightLeft, Check, Search, XCircle, Clock, ChevronDown, ChevronUp, Building2, User, Calendar, FileText, AlertTriangle, RefreshCw, Bell } from 'lucide-react';
import { TransferenciaEstudante, Escola } from '../../types';
import { supabase } from '../../services/supabase';
import { logAudit } from '../../services/logService';

interface TransferenciasPendentesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  escolas: Escola[];
  escolasIds: string[];  // IDs das escolas do usuário logado
  onTransferApproved: () => void;
  currentUserName?: string;
}

export const TransferenciasPendentesPopup: React.FC<TransferenciasPendentesPopupProps> = ({
  isOpen,
  onClose,
  escolas,
  escolasIds,
  onTransferApproved,
  currentUserName = ''
}) => {
  const [transferencias, setTransferencias] = useState<TransferenciaEstudante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [recusandoId, setRecusandoId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'NEGADO'>('ALL');

  const loadTransferencias = useCallback(async () => {
    if (escolasIds.length === 0) {
      setTransferencias([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('transferencias_estudantes')
        .select('*')
        .in('escola_destino_id', escolasIds)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setTransferencias((data as TransferenciaEstudante[]) || []);
    } catch (err) {
      console.error('Erro ao carregar transferências:', err);
    } finally {
      setIsLoading(false);
    }
  }, [escolasIds]);

  useEffect(() => {
    if (isOpen) {
      loadTransferencias();
    }
  }, [isOpen, loadTransferencias]);

  const filteredTransferencias = filterStatus === 'ALL'
    ? transferencias
    : transferencias.filter(t => t.status === filterStatus);

  const pendentesCount = transferencias.filter(t => t.status === 'PENDENTE' || t.status === 'EM_ANALISE').length;

  const handleAprovar = async (transferencia: TransferenciaEstudante) => {
    setActionLoading(transferencia.id);
    try {
      // 1. Update transfer status to APROVADO
      const { error: updateError } = await supabase
        .from('transferencias_estudantes')
        .update({
          status: 'APROVADO',
          respondido_por: currentUserName,
          updated_at: new Date().toISOString()
        })
        .eq('id', transferencia.id);

      if (updateError) throw updateError;

      // 2. Update the student record — move to the new school/turma
      const updatePayload: any = {
        escola_id: transferencia.escola_destino_id,
        status: 'Ativo'
      };

      if (transferencia.turma_destino_id) {
        updatePayload.class_id = transferencia.turma_destino_id;
      }

      const { error: studentError } = await supabase
        .from('alunos')
        .update(updatePayload)
        .eq('id', transferencia.aluno_id);

      if (studentError) throw studentError;

      await logAudit('UPDATE', 'TRANSFERENCIA_ESTUDANTE', transferencia.id, {
        acao: 'APROVADO',
        aluno: transferencia.aluno_nome,
        destino: transferencia.escola_destino_nome
      });

      loadTransferencias();
      onTransferApproved();
    } catch (err) {
      console.error('Erro ao aprovar transferência:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEmAnalise = async (transferencia: TransferenciaEstudante) => {
    setActionLoading(transferencia.id);
    try {
      const { error } = await supabase
        .from('transferencias_estudantes')
        .update({
          status: 'EM_ANALISE',
          respondido_por: currentUserName,
          updated_at: new Date().toISOString()
        })
        .eq('id', transferencia.id);

      if (error) throw error;

      await logAudit('UPDATE', 'TRANSFERENCIA_ESTUDANTE', transferencia.id, {
        acao: 'EM_ANALISE',
        aluno: transferencia.aluno_nome
      });

      loadTransferencias();
    } catch (err) {
      console.error('Erro ao atualizar transferência:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleNegar = async (transferencia: TransferenciaEstudante) => {
    if (!motivoRecusa.trim()) return;
    
    setActionLoading(transferencia.id);
    try {
      const { error } = await supabase
        .from('transferencias_estudantes')
        .update({
          status: 'NEGADO',
          motivo_resposta: motivoRecusa.trim(),
          respondido_por: currentUserName,
          updated_at: new Date().toISOString()
        })
        .eq('id', transferencia.id);

      if (error) throw error;

      await logAudit('UPDATE', 'TRANSFERENCIA_ESTUDANTE', transferencia.id, {
        acao: 'NEGADO',
        aluno: transferencia.aluno_nome,
        motivo: motivoRecusa.trim()
      });

      setRecusandoId(null);
      setMotivoRecusa('');
      loadTransferencias();
    } catch (err) {
      console.error('Erro ao negar transferência:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            PENDENTE
          </span>
        );
      case 'EM_ANALISE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" />
            EM ANÁLISE
          </span>
        );
      case 'APROVADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3" />
            APROVADO
          </span>
        );
      case 'NEGADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            NEGADO
          </span>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Popup */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm relative">
                <Bell className="w-6 h-6" />
                {pendentesCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-rose-600 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm animate-bounce">
                    {pendentesCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Solicitações de Transferência</h2>
                <p className="text-white/70 text-xs font-semibold mt-0.5">
                  {pendentesCount > 0
                    ? `${pendentesCount} solicitação(ões) pendente(s) de aprovação`
                    : 'Nenhuma solicitação pendente'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pt-4 flex gap-2 flex-wrap">
          {(['ALL', 'PENDENTE', 'EM_ANALISE', 'APROVADO', 'NEGADO'] as const).map(status => {
            const count = status === 'ALL' ? transferencias.length : transferencias.filter(t => t.status === status).length;
            const labels: Record<string, string> = { ALL: 'Todas', PENDENTE: 'Pendentes', EM_ANALISE: 'Em Análise', APROVADO: 'Aprovadas', NEGADO: 'Negadas' };
            const isActive = filterStatus === status;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                  isActive
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {labels[status]} ({count})
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500 opacity-40 mb-4" />
              <p className="text-sm text-slate-400 font-bold">Carregando solicitações...</p>
            </div>
          ) : filteredTransferencias.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <ArrowRightLeft className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400">Nenhuma solicitação encontrada</p>
              <p className="text-xs text-slate-300 mt-1">Não há transferências com o filtro selecionado.</p>
            </div>
          ) : (
            filteredTransferencias.map(t => {
              const isExpanded = expandedId === t.id;
              const isRecusando = recusandoId === t.id;
              const isPendente = t.status === 'PENDENTE' || t.status === 'EM_ANALISE';

              return (
                <div
                  key={t.id}
                  className={`rounded-xl border overflow-hidden transition-all duration-300 ${
                    isPendente
                      ? 'border-amber-200 bg-amber-50/30 shadow-sm'
                      : t.status === 'APROVADO'
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between gap-3 hover:bg-white/60 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : t.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        isPendente ? 'bg-amber-100 text-amber-600' : t.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {t.aluno_nome?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 uppercase truncate">{t.aluno_nome}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 truncate">
                          De: {t.escola_origem_nome} → Para: {t.escola_destino_nome}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(t.status)}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Card Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-100/80 pt-3 animate-fade-in">
                      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Escola Origem</p>
                            <p className="font-bold text-slate-700">{t.escola_origem_nome}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Escola Destino</p>
                            <p className="font-bold text-slate-700">{t.escola_destino_nome}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Turma / Turno</p>
                            <p className="font-bold text-slate-700">{t.turma_destino_nome || '---'} • {t.turno_destino || '---'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Data da Solicitação</p>
                            <p className="font-bold text-slate-700">
                              {t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : '---'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 col-span-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Motivo</p>
                            <p className="font-medium text-slate-600">{t.motivo || 'Não informado'}</p>
                          </div>
                        </div>
                        {t.solicitado_por && (
                          <div className="flex items-start gap-2 col-span-2">
                            <User className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Solicitado por</p>
                              <p className="font-medium text-slate-600">{t.solicitado_por}</p>
                            </div>
                          </div>
                        )}
                        {t.motivo_resposta && (
                          <div className="flex items-start gap-2 col-span-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-rose-400 uppercase">Motivo da Recusa</p>
                              <p className="font-medium text-rose-600">{t.motivo_resposta}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons (only for pending/analysis) */}
                      {isPendente && (
                        <div className="space-y-3">
                          {/* Rejection form */}
                          {isRecusando && (
                            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-2 animate-fade-in">
                              <label className="block text-[10px] font-black text-rose-500 uppercase tracking-wider">
                                Motivo da recusa *
                              </label>
                              <textarea
                                value={motivoRecusa}
                                onChange={e => setMotivoRecusa(e.target.value)}
                                placeholder="Informe o motivo da recusa..."
                                rows={2}
                                className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-sm font-medium text-slate-700 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 outline-none resize-none"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => { setRecusandoId(null); setMotivoRecusa(''); }}
                                  className="px-3 py-1.5 text-[10px] font-black text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all uppercase"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleNegar(t)}
                                  disabled={!motivoRecusa.trim() || actionLoading === t.id}
                                  className="px-4 py-1.5 text-[10px] font-black text-white bg-rose-500 rounded-lg hover:bg-rose-600 transition-all uppercase disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  {actionLoading === t.id ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <XCircle className="w-3 h-3" />
                                  )}
                                  Confirmar Recusa
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Main action buttons */}
                          {!isRecusando && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setRecusandoId(t.id)}
                                disabled={actionLoading === t.id}
                                className="px-4 py-2 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Negar
                              </button>
                              {t.status === 'PENDENTE' && (
                                <button
                                  onClick={() => handleEmAnalise(t)}
                                  disabled={actionLoading === t.id}
                                  className="px-4 py-2 text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {actionLoading === t.id ? (
                                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5" />
                                  )}
                                  Em Análise
                                </button>
                              )}
                              <button
                                onClick={() => handleAprovar(t)}
                                disabled={actionLoading === t.id}
                                className="px-5 py-2 text-[10px] font-black text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 active:scale-[0.98]"
                              >
                                {actionLoading === t.id ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                )}
                                Aprovar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Hook utilitário para contar transferências pendentes (para uso em badges)
export const useTransferenciasPendentesCount = (escolasIds: string[]) => {
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async () => {
    if (escolasIds.length === 0) { setCount(0); return; }
    try {
      const { count: total, error } = await supabase
        .from('transferencias_estudantes')
        .select('*', { count: 'exact', head: true })
        .in('escola_destino_id', escolasIds)
        .in('status', ['PENDENTE', 'EM_ANALISE']);

      if (error) throw error;
      setCount(total || 0);
    } catch (err) {
      console.error('Erro ao contar transferências pendentes:', err);
    }
  }, [escolasIds]);

  useEffect(() => {
    loadCount();
    // Poll every 30 seconds for new transfers
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [loadCount]);

  return { count, refresh: loadCount };
};
