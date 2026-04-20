import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Escola } from '../../types';
import { Save, Target, Activity, TrendingUp, X, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';

interface SamahcIndicatorsModalProps {
    isOpen: boolean;
    onClose: () => void;
    escola: Escola;
    onSave: (dados: {
        simuladoSeama: number;
        simuladoSaeb: number;
        fluencia: number;
        linguaPortuguesa: number;
        matematica: number;
    }) => void;
}

export const SamahcIndicatorsModal: React.FC<SamahcIndicatorsModalProps> = ({
    isOpen,
    onClose,
    escola,
    onSave
}) => {
    const [formData, setFormData] = useState({
        simuladoSeama: 0,
        simuladoSaeb: 0,
        fluencia: 0,
        linguaPortuguesa: 0,
        matematica: 0
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && escola) {
            setFormData({
                simuladoSeama: escola.dadosEducacionais?.dadosSamahc?.simuladoSeama || 0,
                simuladoSaeb: escola.dadosEducacionais?.dadosSamahc?.simuladoSaeb || 0,
                fluencia: escola.dadosEducacionais?.dadosSamahc?.fluencia || 0,
                linguaPortuguesa: escola.dadosEducacionais?.dadosSamahc?.linguaPortuguesa || 0,
                matematica: escola.dadosEducacionais?.dadosSamahc?.matematica || 0
            });
        }
    }, [isOpen, escola]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            onSave(formData);
            setLoading(false);
            onClose();
        }, 600);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" showCloseButton={false}>
            <div className="overflow-hidden bg-white rounded-2xl">
                <div className="relative overflow-hidden bg-slate-900 px-6 py-6 leading-tight">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">Cadastro de Indicadores SAMAHC</h2>
                                <p className="text-orange-400 font-bold text-xs uppercase tracking-widest mt-0.5">{escola.nome}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Target className="w-3 h-3 text-orange-500" />
                                Simulado SEAMA
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                name="simuladoSeama"
                                required
                                value={formData.simuladoSeama}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Target className="w-3 h-3 text-orange-500" />
                                Simulado SAEB
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                name="simuladoSaeb"
                                required
                                value={formData.simuladoSaeb}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="w-3 h-3 text-orange-500" />
                                Fluência (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                name="fluencia"
                                required
                                value={formData.fluencia}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen className="w-3 h-3 text-orange-500" />
                                Língua Portuguesa
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                name="linguaPortuguesa"
                                required
                                value={formData.linguaPortuguesa}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen className="w-3 h-3 text-orange-500" />
                                Matemática
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                name="matematica"
                                required
                                value={formData.matematica}
                                onChange={handleChange}
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
