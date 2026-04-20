import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Escola } from '../../types';
import { Save, Activity, TrendingUp, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface RelatorioEiModalProps {
    isOpen: boolean;
    onClose: () => void;
    escola: Escola;
    onSave: (dados: { desenvolvimento: number }) => void;
}

export const RelatorioEiModal: React.FC<RelatorioEiModalProps> = ({
    isOpen,
    onClose,
    escola,
    onSave
}) => {
    const [desenvolvimento, setDesenvolvimento] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && escola) {
            setDesenvolvimento(escola.dadosEducacionais?.relatorioEI?.desenvolvimento || 0);
        }
    }, [isOpen, escola]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            onSave({ desenvolvimento });
            setLoading(false);
            onClose();
        }, 600);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
            <div className="overflow-hidden bg-white rounded-2xl">
                <div className="relative overflow-hidden bg-slate-900 px-6 py-6 leading-tight">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">Cadastro de Relatório EI</h2>
                                <p className="text-orange-400 font-bold text-xs uppercase tracking-widest mt-0.5">{escola.nome}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="w-3 h-3 text-orange-500" />
                                Desenvolvimento EI (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={desenvolvimento}
                                onChange={e => setDesenvolvimento(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" onClick={onClose} variant="secondary" disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="success" disabled={loading} icon={Save} isLoading={loading}>
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
