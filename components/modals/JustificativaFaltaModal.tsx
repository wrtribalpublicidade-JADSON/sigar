import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, AlertCircle, Calendar, School, User, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface JustificativaFaltaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
  onRemove?: () => void;
  studentName: string;
  currentJustification?: string;
  dataChamada?: string;
  turmaNome?: string;
  componente?: string;
}

const PRESET_MOTIVOS = [
  'Atestado Médico / Tratamento de Saúde',
  'Consulta / Exames Clínicos',
  'Declaração de Comparecimento',
  'Problema de Transporte / Linha Escolar',
  'Motivo Familiar / Força Maior',
  'Luto Familiar',
  'Intempérie Climática / Condições de Acesso'
];

export const JustificativaFaltaModal: React.FC<JustificativaFaltaModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onRemove,
  studentName,
  currentJustification = '',
  dataChamada,
  turmaNome,
  componente
}) => {
  const [justificativa, setJustificativa] = useState(currentJustification);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setJustificativa(currentJustification || '');
      setError(null);
    }
  }, [isOpen, currentJustification]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: string) => {
    if (!justificativa.trim()) {
      setJustificativa(preset);
    } else if (!justificativa.includes(preset)) {
      setJustificativa(prev => `${prev.trim()}; ${preset}`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = justificativa.trim();
    if (!cleaned) {
      setError('Por favor, informe a justificativa da ausência ou clique em cancelar.');
      return;
    }
    onConfirm(cleaned);
    onClose();
  };

  const formattedDate = dataChamada
    ? new Date(dataChamada + 'T12:00:00').toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in border border-slate-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 p-5 text-white relative overflow-hidden shrink-0">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Justificativa de Ausência</h3>
                <p className="text-amber-100 text-xs font-semibold mt-0.5">
                  Registro de falta justificada / abonada
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors text-white"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Student Info Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                {studentName}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 pt-1 border-t border-slate-200/60">
              {dataChamada && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Data: <strong className="text-slate-700">{formattedDate}</strong></span>
                </div>
              )}
              {turmaNome && (
                <div className="flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-slate-400" />
                  <span>Turma: <strong className="text-slate-700">{turmaNome}</strong></span>
                </div>
              )}
              {componente && (
                <div className="text-brand-orange font-bold">
                  • {componente}
                </div>
              )}
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Motivos Frequentes (Clique para Inserir)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_MOTIVOS.map((preset) => {
                const isSelected = justificativa.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`text-[10.5px] font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100/80 border-amber-300 text-amber-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50/50'
                    }`}
                  >
                    + {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Descrição / Observação da Justificativa *
            </label>
            <textarea
              value={justificativa}
              onChange={(e) => {
                setJustificativa(e.target.value);
                if (error) setError(null);
              }}
              rows={3}
              placeholder="Ex: Atestado médico apresentado pelo responsável em 25/08, CID..., repouso médico de 2 dias."
              className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-semibold text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all resize-none"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs font-bold mt-1.5 animate-shake">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
            {onRemove && currentJustification ? (
              <button
                type="button"
                onClick={() => {
                  onRemove();
                  onClose();
                }}
                className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover Justificativa</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="rounded-xl text-xs font-bold py-2 px-3.5 border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-black py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white shadow-md flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Salvar Justificativa
              </Button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
