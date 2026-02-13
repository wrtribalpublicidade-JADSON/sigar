import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Escola, RegistroCNCA } from '../../types';
import { Save, ClipboardCheck, Users, TrendingUp, X, Calendar, Target, Activity } from 'lucide-react';
import { Button } from '../ui/Button';

interface CncaModalProps {
    isOpen: boolean;
    onClose: () => void;
    escola: Escola;
    onSave: (registro: Omit<RegistroCNCA, 'id' | 'escolaId' | 'dataRegistro' | 'responsavel'> & { id?: string }) => void;
    onDelete: (id: string) => void;
}

export const CncaModal: React.FC<CncaModalProps> = ({
    isOpen,
    onClose,
    escola,
    onSave,
    onDelete
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        ano: new Date().getFullYear(),
        tipoAvaliacao: 'Diagnóstica' as 'Diagnóstica' | 'Formativa' | 'Somativa',
        componenteCurricular: 'Língua Portuguesa' as 'Língua Portuguesa' | 'Matemática',
        anoSerie: '1º ANO' as any,
        tipoTurma: 'Regular' as 'Regular' | 'Multiseriada',
        estudantesAvaliados: 0,
        estudantesPrevistos: 0,
        defasagem: 0,
        aprendizadoIntermediario: 0,
        aprendizadoAdequado: 0,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                ano: new Date().getFullYear(),
                tipoAvaliacao: 'Diagnóstica',
                componenteCurricular: 'Língua Portuguesa',
                anoSerie: '1º ANO',
                tipoTurma: 'Regular',
                estudantesAvaliados: 0,
                estudantesPrevistos: 0,
                defasagem: 0,
                aprendizadoIntermediario: 0,
                aprendizadoAdequado: 0,
            });
            setEditingId(null);
            setError(null);
        }
    }, [isOpen, escola.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.estudantesAvaliados > formData.estudantesPrevistos) {
            setError(`O número de ESTUDANTES AVALIADOS (${formData.estudantesAvaliados}) não pode ser maior que o de PREVISTOS (${formData.estudantesPrevistos})`);
            return;
        }

        setError(null);
        setLoading(true);

        setTimeout(() => {
            const registro = {
                id: editingId || undefined,
                ano: Number(formData.ano),
                tipoAvaliacao: formData.tipoAvaliacao,
                componenteCurricular: formData.componenteCurricular,
                anoSerie: formData.anoSerie,
                tipoTurma: formData.tipoTurma,
                estudantesAvaliados: Number(formData.estudantesAvaliados),
                estudantesPrevistos: Number(formData.estudantesPrevistos),
                defasagem: Number(formData.defasagem),
                aprendizadoIntermediario: Number(formData.aprendizadoIntermediario),
                aprendizadoAdequado: Number(formData.aprendizadoAdequado),
            };

            onSave(registro);
            setLoading(false);

            if (!editingId) {
                setFormData(prev => ({
                    ...prev,
                    estudantesAvaliados: 0,
                    estudantesPrevistos: 0,
                    defasagem: 0,
                    aprendizadoIntermediario: 0,
                    aprendizadoAdequado: 0,
                }));
            } else {
                setEditingId(null);
            }
        }, 800);
    };

    const handleEdit = (reg: RegistroCNCA) => {
        setEditingId(reg.id);
        setFormData({
            ano: reg.ano,
            tipoAvaliacao: reg.tipoAvaliacao,
            componenteCurricular: reg.componenteCurricular,
            anoSerie: reg.anoSerie,
            tipoTurma: reg.tipoTurma,
            estudantesAvaliados: reg.estudantesAvaliados,
            estudantesPrevistos: reg.estudantesPrevistos,
            defasagem: reg.defasagem,
            aprendizadoIntermediario: reg.aprendizadoIntermediario,
            aprendizadoAdequado: reg.aprendizadoAdequado,
        });

        const formContainer = document.querySelector('.overflow-y-auto');
        if (formContainer) formContainer.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" showCloseButton={false}>
            <div className="overflow-hidden bg-white rounded-2xl">
                {/* Header Premium */}
                <div className="relative overflow-hidden bg-slate-900 px-6 py-8 leading-tight">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Target className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Cadastro de Informações CNCA/PNRA</h2>
                                <p className="text-orange-400 font-bold text-sm uppercase tracking-widest mt-0.5">{escola.nome}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar shadow-inner bg-slate-50/10">
                    {error && (
                        <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shrink-0">
                                <X className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-black text-rose-600 uppercase tracking-tight">Erro de Consistência</p>
                                <p className="text-sm font-bold text-rose-500">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Identificação e Visão Geral */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Calendar className="w-5 h-5 text-orange-500" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Identificação da Avaliação</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter">Ano de Referência</label>
                                <input
                                    type="number"
                                    name="ano"
                                    required
                                    value={formData.ano}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-lg font-black text-slate-900 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none shadow-sm"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter">Tipo de Avaliação</label>
                                <select
                                    name="tipoAvaliacao"
                                    required
                                    value={formData.tipoAvaliacao}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-lg font-black text-slate-900 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="Diagnóstica">Diagnóstica</option>
                                    <option value="Formativa">Formativa</option>
                                    <option value="Somativa">Somativa</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter">Componente Curricular</label>
                                <select
                                    name="componenteCurricular"
                                    required
                                    value={formData.componenteCurricular}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-lg font-black text-slate-900 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="Língua Portuguesa">Língua Portuguesa</option>
                                    <option value="Matemática">Matemática</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter">Tipo de Turma</label>
                                <select
                                    name="tipoTurma"
                                    required
                                    value={formData.tipoTurma}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-lg font-black text-slate-900 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="Regular">Regular</option>
                                    <option value="Multiseriada">Multiseriada</option>
                                </select>
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter">Ano / Série</label>
                                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                                    {(['1º ANO', '2º ANO', '3º ANO', '4º ANO', '5º ANO', '6º ANO', '7º ANO', '8º ANO', '9º ANO'] as const).map((ano) => (
                                        <button
                                            key={ano}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, anoSerie: ano }))}
                                            className={`py-3 rounded-xl text-xs font-black transition-all border-2 ${formData.anoSerie === ano ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-orange-200'}`}
                                        >
                                            {ano}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dados Quantitativos */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Users className="w-5 h-5 text-orange-500" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Participantes e Cobertura</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3 font-semibold">
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter">Estudantes Previstos</label>
                                <input
                                    type="number"
                                    name="estudantesPrevistos"
                                    min="0"
                                    required
                                    value={formData.estudantesPrevistos}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-2xl font-black text-slate-700 focus:border-orange-500 outline-none transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-3 font-semibold">
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter">Estudantes Avaliados</label>
                                <input
                                    type="number"
                                    name="estudantesAvaliados"
                                    min="0"
                                    required
                                    value={formData.estudantesAvaliados}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-2xl font-black text-blue-600 focus:border-blue-500 outline-none transition-all shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Desempenho e Níveis */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Activity className="w-5 h-5 text-orange-500" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Métricas de Aprendizado (%)</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-rose-600 uppercase block text-center tracking-tighter">Defasagem (%)</label>
                                <input
                                    type="number"
                                    name="defasagem"
                                    min="0"
                                    max="100"
                                    required
                                    value={formData.defasagem}
                                    onChange={handleChange}
                                    className="w-full bg-rose-50 border-2 border-rose-100 rounded-2xl px-4 py-5 text-3xl font-black text-rose-600 focus:border-rose-400 outline-none text-center transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-orange-600 uppercase block text-center tracking-tighter">I. Intermediário (%)</label>
                                <input
                                    type="number"
                                    name="aprendizadoIntermediario"
                                    min="0"
                                    max="100"
                                    required
                                    value={formData.aprendizadoIntermediario}
                                    onChange={handleChange}
                                    className="w-full bg-orange-50 border-2 border-orange-100 rounded-2xl px-4 py-5 text-3xl font-black text-orange-600 focus:border-orange-400 outline-none text-center transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-emerald-600 uppercase block text-center tracking-tighter">Adequado (%)</label>
                                <input
                                    type="number"
                                    name="aprendizadoAdequado"
                                    min="0"
                                    max="100"
                                    required
                                    value={formData.aprendizadoAdequado}
                                    onChange={handleChange}
                                    className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-4 py-5 text-3xl font-black text-emerald-600 focus:border-emerald-400 outline-none text-center transition-all shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 pb-8 border-b border-slate-100">
                        <Button type="button" onClick={onClose} variant="secondary" disabled={loading}>
                            {editingId ? 'Cancelar Edição' : 'Fechar'}
                        </Button>
                        <Button type="submit" variant="success" disabled={loading} icon={Save} isLoading={loading}>
                            {loading ? 'Salvando...' : editingId ? 'Atualizar Dados' : 'Salvar Informações'}
                        </Button>
                    </div>

                    {/* Histórico CNCA */}
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-orange-500" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Histórico de Lançamentos</h3>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Série/Ano/Comp.</th>
                                        <th className="px-4 py-4">Tipo/Turma</th>
                                        <th className="px-4 py-4 text-center">Partic.</th>
                                        <th className="px-4 py-4 text-center">Defasagem</th>
                                        <th className="px-4 py-4 text-center">Adequado</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {escola.dadosEducacionais.registrosCNCA && escola.dadosEducacionais.registrosCNCA.length > 0 ? (
                                        escola.dadosEducacionais.registrosCNCA
                                            .sort((a, b) => b.ano - a.ano || a.tipoAvaliacao.localeCompare(b.tipoAvaliacao))
                                            .map((reg) => (
                                                <tr key={reg.id} className={`hover:bg-slate-50/50 transition-colors ${editingId === reg.id ? 'bg-orange-50 text-orange-600' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800">{reg.anoSerie} - {reg.componenteCurricular}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                            {reg.tipoAvaliacao} ({reg.ano})
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${reg.tipoTurma === 'Regular' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                            {reg.tipoTurma}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="font-bold text-slate-600">{reg.estudantesAvaliados}</span>
                                                        <span className="text-slate-300 mx-1">/</span>
                                                        <span className="text-slate-400">{reg.estudantesPrevistos}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-bold text-rose-500">
                                                        {reg.defasagem}%
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-bold text-emerald-600">
                                                        {reg.aprendizadoAdequado}%
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEdit(reg)}
                                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                            >
                                                                <ClipboardCheck className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (window.confirm('Excluir este lançamento?')) {
                                                                        onDelete(reg.id);
                                                                    }
                                                                }}
                                                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs italic">
                                                Nenhum registro encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
