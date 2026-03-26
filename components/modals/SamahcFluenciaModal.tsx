import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Escola, RegistroFluenciaSAMAHC } from '../../types';
import { Save, User, GraduationCap, TrendingUp, X, Calendar, Layers, Clock, Activity } from 'lucide-react';
import { Button } from '../ui/Button';

interface SamahcFluenciaModalProps {
    isOpen: boolean;
    onClose: () => void;
    escola: Escola;
    registro: RegistroFluenciaSAMAHC | null;
    onSave: (registro: RegistroFluenciaSAMAHC) => void;
}

export const SamahcFluenciaModal: React.FC<SamahcFluenciaModalProps> = ({
    isOpen,
    onClose,
    escola,
    registro,
    onSave
}) => {
    const [formData, setFormData] = useState<RegistroFluenciaSAMAHC>({
        id: '',
        escolaId: '',
        polo: '',
        ano: new Date().getFullYear(),
        estudanteNome: '',
        anoSerie: '',
        nivelDesempenho: '',
        turno: '',
        tipoAvaliacao: 'DIAGNÓSTICA',
        turma: '',
        etapa: '',
        createdAt: new Date().toISOString()
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && registro) {
            setFormData({ ...registro });
        }
    }, [isOpen, registro]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        // Simulate a small delay for premium feel
        setTimeout(() => {
            onSave(formData);
            setLoading(false);
            onClose();
        }, 600);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" showCloseButton={false}>
            <div className="overflow-hidden bg-white rounded-2xl">
                {/* Header Premium */}
                <div className="relative overflow-hidden bg-slate-900 px-6 py-6 leading-tight">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">Editar Registro de Aluno</h2>
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
                        {/* Estudante */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3 h-3 text-orange-500" />
                                Nome do Estudante
                            </label>
                            <input
                                type="text"
                                name="estudanteNome"
                                required
                                value={formData.estudanteNome}
                                onChange={handleChange}
                                placeholder="NOME COMPLETO"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none uppercase"
                            />
                        </div>

                        {/* Série e Turma */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <GraduationCap className="w-3 h-3 text-orange-500" />
                                Ano / Série
                            </label>
                            <input
                                type="text"
                                name="anoSerie"
                                required
                                value={formData.anoSerie}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-3 h-3 text-orange-500" />
                                Turma de Matrícula
                            </label>
                            <input
                                type="text"
                                name="turma"
                                value={formData.turma}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none"
                            />
                        </div>

                        {/* Turno e Avaliação */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3 h-3 text-orange-500" />
                                Turno
                            </label>
                            <select
                                name="turno"
                                value={formData.turno}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none appearance-none"
                            >
                                <option value="">Não Informado</option>
                                <option value="MATUTINO">MATUTINO</option>
                                <option value="VESPERTINO">VESPERTINO</option>
                                <option value="NOTURNO">NOTURNO</option>
                                <option value="INTEGRAL">INTEGRAL</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-3 h-3 text-orange-500" />
                                Tipo de Avaliação
                            </label>
                            <select
                                name="tipoAvaliacao"
                                required
                                value={formData.tipoAvaliacao}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none appearance-none"
                            >
                                <option value="DIAGNÓSTICA">DIAGNÓSTICA</option>
                                <option value="FORMATIVA">FORMATIVA</option>
                                <option value="SOMATIVA">SOMATIVA</option>
                            </select>
                        </div>

                        {/* Nível de Desempenho */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="w-3 h-3 text-orange-500" />
                                Nível de Desempenho
                            </label>
                            <select
                                name="nivelDesempenho"
                                required
                                value={formData.nivelDesempenho}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none appearance-none"
                            >
                                <option value="">Selecione o Nível</option>
                                <option value="LEITOR FLUENTE">LEITOR FLUENTE</option>
                                <option value="LEITOR INICIANTE">LEITOR INICIANTE</option>
                                <option value="PRÉ-LEITOR">PRÉ-LEITOR</option>
                                <option value="NÃO LEITOR">NÃO LEITOR</option>
                                <option value="NÃO AVALIADO">NÃO AVALIADO</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-orange-500" />
                                Ano de Referência
                            </label>
                            <input
                                type="number"
                                name="ano"
                                required
                                value={formData.ano}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-3 h-3 text-orange-500" />
                                Etapa de Ensino
                            </label>
                            <input
                                type="text"
                                name="etapa"
                                value={formData.etapa}
                                onChange={handleChange}
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 outline-none"
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
