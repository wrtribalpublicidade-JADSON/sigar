import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Building2, MapPin, Clock, FileText, Send, AlertTriangle, ChevronRight, School, RefreshCw } from 'lucide-react';
import { Aluno, Escola, TransferenciaEstudante } from '../../types';
import { supabase } from '../../services/supabase';
import { logAudit } from '../../services/logService';
import { ESCOLAS_MOCK } from '../../constants';

interface TransferenciaEstudanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Aluno | null;
  escolas: Escola[];
  escolaOrigemId: string;
  onSuccess: () => void;
  currentUserName?: string;
  isDemoMode?: boolean;
}

interface TurmaOption {
  id: string;
  name: string;
  year: string;
  shift: string;
  stage: string;
}

export const TransferenciaEstudanteModal: React.FC<TransferenciaEstudanteModalProps> = ({
  isOpen,
  onClose,
  student,
  escolas,
  escolaOrigemId,
  onSuccess,
  currentUserName = '',
  isDemoMode = false
}) => {
  const [activeTab, setActiveTab] = useState<'INTERNA' | 'EXTERNA'>('INTERNA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Todas as escolas do município para destino
  const [todasEscolas, setTodasEscolas] = useState<Escola[]>(escolas);
  const [isLoadingEscolas, setIsLoadingEscolas] = useState(false);

  // Interna fields
  const [escolaDestinoId, setEscolaDestinoId] = useState('');
  const [turmaDestinoId, setTurmaDestinoId] = useState('');
  const [turnoDestino, setTurnoDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [turmasDestino, setTurmasDestino] = useState<TurmaOption[]>([]);
  const [isLoadingTurmas, setIsLoadingTurmas] = useState(false);

  // Externa fields
  const [escolaExternaNome, setEscolaExternaNome] = useState('');
  const [motivoExterna, setMotivoExterna] = useState('');

  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchTodasEscolas();
    }
  }, [isOpen]);

  const fetchTodasEscolas = async () => {
    if (isDemoMode) {
      setTodasEscolas([...ESCOLAS_MOCK].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
      return;
    }
    setIsLoadingEscolas(true);
    try {
      const { data, error } = await supabase
        .from('escolas')
        .select('id, nome, localizacao, segmentos, status')
        .order('nome');

      if (error) throw error;
      if (data && data.length > 0) {
        const sorted = (data as Escola[]).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setTodasEscolas(sorted);
      } else {
        setTodasEscolas(escolas);
      }
    } catch (err) {
      console.error('Erro ao carregar todas as escolas do município:', err);
      setTodasEscolas(escolas);
    } finally {
      setIsLoadingEscolas(false);
    }
  };

  useEffect(() => {
    if (escolaDestinoId) {
      loadTurmasDestino(escolaDestinoId);
    } else {
      setTurmasDestino([]);
      setTurmaDestinoId('');
      setTurnoDestino('');
    }
  }, [escolaDestinoId]);

  const resetForm = () => {
    setActiveTab('INTERNA');
    setEscolaDestinoId('');
    setTurmaDestinoId('');
    setTurnoDestino('');
    setMotivo('');
    setEscolaExternaNome('');
    setMotivoExterna('');
    setError(null);
    setSuccess(false);
    setTurmasDestino([]);
  };

  const loadTurmasDestino = async (schoolId: string) => {
    setIsLoadingTurmas(true);
    try {
      const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .eq('school_id', schoolId)
        .order('name');

      if (error) throw error;
      const formatted: TurmaOption[] = (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        year: t.year || t.name,
        shift: t.shift || 'MANHÃ',
        stage: t.stage || ''
      })).sort((a, b) => `${a.year} - ${a.name}`.localeCompare(`${b.year} - ${b.name}`, 'pt-BR'));
      setTurmasDestino(formatted);
    } catch (err) {
      console.error('Erro ao carregar turmas destino:', err);
      setTurmasDestino([]);
    } finally {
      setIsLoadingTurmas(false);
    }
  };

  const escolaOrigem = todasEscolas.find(e => String(e.id) === String(escolaOrigemId)) || escolas.find(e => String(e.id) === String(escolaOrigemId));
  const escolasDestino = todasEscolas.filter(e => String(e.id) !== String(escolaOrigemId));

  const handleSubmitInterna = async () => {
    if (!student) return;
    if (!escolaDestinoId) { setError('Selecione a escola de destino.'); return; }
    if (!turmaDestinoId) { setError('Selecione a turma de destino.'); return; }
    if (!motivo.trim()) { setError('Informe o motivo da transferência.'); return; }

    setIsSubmitting(true);
    setError(null);

    const escolaDestinoObj = todasEscolas.find(e => String(e.id) === String(escolaDestinoId)) || escolas.find(e => String(e.id) === String(escolaDestinoId));
    const turmaDestinoObj = turmasDestino.find(t => t.id === turmaDestinoId);

    const payload = {
      aluno_id: student.id,
      aluno_nome: student.name,
      tipo: 'INTERNA',
      escola_origem_id: escolaOrigemId,
      escola_origem_nome: escolaOrigem?.nome || 'Desconhecida',
      turma_origem_id: student.class_id || null,
      escola_destino_id: escolaDestinoId,
      escola_destino_nome: escolaDestinoObj?.nome || 'Desconhecida',
      turma_destino_id: turmaDestinoId,
      turma_destino_nome: turmaDestinoObj ? `${turmaDestinoObj.year} - ${turmaDestinoObj.name}` : '',
      turno_destino: turmaDestinoObj?.shift || turnoDestino,
      status: 'PENDENTE',
      motivo: motivo.trim(),
      solicitado_por: currentUserName
    };

    try {
      const { data, error: insertError } = await supabase
        .from('transferencias_estudantes')
        .insert([payload])
        .select();

      if (insertError) throw insertError;

      await logAudit('CREATE', 'TRANSFERENCIA_ESTUDANTE', data?.[0]?.id || '', {
        tipo: 'INTERNA',
        aluno: student.name,
        destino: escolaDestinoObj?.nome
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Erro ao solicitar transferência:', err);
      setError('Erro ao solicitar transferência. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitExterna = async () => {
    if (!student) return;
    if (!escolaExternaNome.trim()) { setError('Informe o nome da escola externa.'); return; }
    if (!motivoExterna.trim()) { setError('Informe o motivo da transferência.'); return; }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      aluno_id: student.id,
      aluno_nome: student.name,
      tipo: 'EXTERNA',
      escola_origem_id: escolaOrigemId,
      escola_origem_nome: escolaOrigem?.nome || 'Desconhecida',
      turma_origem_id: student.class_id || null,
      escola_externa_nome: escolaExternaNome.trim(),
      status: 'APROVADO',
      motivo: motivoExterna.trim(),
      solicitado_por: currentUserName
    };

    try {
      const { data, error: insertError } = await supabase
        .from('transferencias_estudantes')
        .insert([payload])
        .select();

      if (insertError) throw insertError;

      // Update student status to Transferido
      await supabase
        .from('alunos')
        .update({ status: 'Transferido' })
        .eq('id', student.id);

      await logAudit('CREATE', 'TRANSFERENCIA_ESTUDANTE', data?.[0]?.id || '', {
        tipo: 'EXTERNA',
        aluno: student.name,
        destino: escolaExternaNome.trim()
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Erro ao registrar transferência externa:', err);
      setError('Erro ao registrar transferência. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Transferência de Estudante</h2>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">
                  {student.name} • MAT: {student.registration_number || '---'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all">
              <X className="w-5 h-5 text-slate-400 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Student Info Card */}
        <div className="px-6 -mt-3 relative z-10">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-black text-orange-600 text-sm">
              {student.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-800 uppercase truncate">{student.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                {escolaOrigem?.nome || 'Escola não identificada'} • {student.stage || '---'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-100">
              <Building2 className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] font-black text-orange-600 uppercase">Origem</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 mt-4">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setActiveTab('INTERNA'); setError(null); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2
                ${activeTab === 'INTERNA'
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                  : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Interna
            </button>
            <button
              onClick={() => { setActiveTab('EXTERNA'); setError(null); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2
                ${activeTab === 'EXTERNA'
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                  : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Externa
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-slate-800">
                {activeTab === 'INTERNA' ? 'Solicitação Enviada!' : 'Transferência Registrada!'}
              </h3>
              <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">
                {activeTab === 'INTERNA'
                  ? 'A escola de destino receberá a solicitação para aprovação.'
                  : 'O estudante foi marcado como transferido.'}
              </p>
            </div>
          ) : activeTab === 'INTERNA' ? (
            <div className="space-y-4">
              {/* Tip */}
              <div className="flex items-start gap-3 p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-orange-700 font-medium leading-relaxed">
                  A transferência interna será enviada como <strong>solicitação de vaga</strong> para a escola de destino, que poderá <strong>aprovar</strong>, manter <strong>em análise</strong> ou <strong>negar</strong>.
                </p>
              </div>

              {/* Escola Destino */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Escola de Destino *
                  </label>
                  {isLoadingEscolas ? (
                    <span className="text-[10px] text-orange-500 font-bold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Carregando escolas do município...
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {escolasDestino.length} {escolasDestino.length === 1 ? 'escola disponível' : 'escolas municipais'}
                    </span>
                  )}
                </div>
                <select
                  value={escolaDestinoId}
                  onChange={e => setEscolaDestinoId(e.target.value)}
                  disabled={isLoadingEscolas}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all disabled:opacity-50"
                >
                  <option value="">Selecione a unidade escolar...</option>
                  {escolasDestino.map(e => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
              </div>

              {/* Turma Destino */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Ano/Série — Turma/Grupo *
                </label>
                {isLoadingTurmas ? (
                  <div className="flex items-center gap-2 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                    <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                    <span className="text-xs text-slate-500 font-semibold">Carregando turmas...</span>
                  </div>
                ) : !escolaDestinoId ? (
                  <div className="py-3 px-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400 font-semibold">
                    Selecione uma escola primeiro
                  </div>
                ) : turmasDestino.length === 0 ? (
                  <div className="py-3 px-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-600 font-semibold">
                    Nenhuma turma cadastrada nesta escola
                  </div>
                ) : (
                  <select
                    value={turmaDestinoId}
                    onChange={e => {
                      setTurmaDestinoId(e.target.value);
                      const t = turmasDestino.find(t => t.id === e.target.value);
                      if (t) setTurnoDestino(t.shift);
                    }}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  >
                    <option value="">Selecione turma/grupo...</option>
                    {turmasDestino.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.year} - {t.name} ({t.shift})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Turno (auto-preenchido) */}
              {turmaDestinoId && turnoDestino && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Turno: <span className="text-orange-600">{turnoDestino}</span></span>
                </div>
              )}

              {/* Motivo */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Motivo / Justificativa *
                </label>
                <textarea
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Informe o motivo da transferência..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none"
                />
              </div>
            </div>
          ) : (
            /* TAB EXTERNA */
            <div className="space-y-4">
              {/* Tip */}
              <div className="flex items-start gap-3 p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-orange-700 font-medium leading-relaxed">
                  A transferência externa registrará a saída do estudante para uma escola <strong>fora da rede municipal</strong>. O status será atualizado automaticamente para <strong>Transferido</strong>.
                </p>
              </div>

              {/* Escola Externa */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Nome da Escola de Destino (externa) *
                </label>
                <input
                  type="text"
                  value={escolaExternaNome}
                  onChange={e => setEscolaExternaNome(e.target.value)}
                  placeholder="Ex: Colégio São Francisco, Escola Estadual..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Motivo / Justificativa *
                </label>
                <textarea
                  value={motivoExterna}
                  onChange={e => setMotivoExterna(e.target.value)}
                  placeholder="Informe o motivo da transferência..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-2 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-xs font-bold text-rose-600">{error}</p>
          </div>
        )}

        {/* Footer */}
        {!success && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-black text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              onClick={activeTab === 'INTERNA' ? handleSubmitInterna : handleSubmitExterna}
              disabled={isSubmitting}
              className="px-8 py-2.5 text-xs font-black text-white rounded-xl uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/25 hover:shadow-orange-500/40 hover:from-orange-600 hover:to-orange-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  {activeTab === 'INTERNA' ? 'Solicitar Transferência' : 'Registrar Transferência'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
