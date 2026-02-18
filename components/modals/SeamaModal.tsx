import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Escola, RegistroSEAMA } from '../../types';
import { Save, ClipboardCheck, Users, TrendingUp, X, Calendar, Target, Activity, Award } from 'lucide-react';
import { Button } from '../ui/Button';

interface SeamaModalProps {
    isOpen: boolean;
    onClose: () => void;
    escola: Escola;
    onSave: (registro: Omit<RegistroSEAMA, 'id' | 'escolaId' | 'dataRegistro' | 'responsavel'> & { id?: string }) => void;
    onDelete: (id: string) => void;
}

export const SeamaModal: React.FC<SeamaModalProps> = ({
    isOpen,
    onClose,
    escola,
    onSave,
    onDelete
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        ano: new Date().getFullYear(),
        tipoAvaliacao: 'SEAMA' as const,
        componenteCurricular: 'Língua Portuguesa' as 'Língua Portuguesa' | 'Matemática',
        anoSerie: '2º ANO' as '2º ANO' | '5º ANO' | '9º ANO',
        estudantesAvaliados: 0,
        estudantesPrevistos: 0,
        abaixoBasico: 0,
        basico: 0,
        adequado: 0,
        avançado: 0,
        proficienciaMedia: 0,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                ano: new Date().getFullYear(),
                tipoAvaliacao: 'SEAMA',
                componenteCurricular: 'Língua Portuguesa',
                anoSerie: '2º ANO',
                estudantesAvaliados: 0,
                estudantesPrevistos: 0,
                abaixoBasico: 0,
                basico: 0,
                adequado: 0,
                avançado: 0,
                proficienciaMedia: 0,
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

        const totalPercent = Number(formData.abaixoBasico) + Number(formData.basico) + Number(formData.adequado) + Number(formData.avançado);
        if (totalPercent > 100.1) { // Pequena tolerância para arredondamentos
            setError(`A soma dos percentuais (${totalPercent.toFixed(1)}%) não pode ultrapassar 100%`);
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
                estudantesAvaliados: Number(formData.estudantesAvaliados),
                estudantesPrevistos: Number(formData.estudantesPrevistos),
                abaixoBasico: Number(formData.abaixoBasico),
                basico: Number(formData.basico),
                adequado: Number(formData.adequado),
                avançado: Number(formData.avançado),
                proficienciaMedia: Number(formData.proficienciaMedia),
            };

            onSave(registro);
            setLoading(false);

            if (!editingId) {
                setFormData(prev => ({
                    ...prev,
                    estudantesAvaliados: 0,
                    estudantesPrevistos: 0,
                    abaixoBasico: 0,
                    basico: 0,
                    adequado: 0,
                    avançado: 0,
                    proficienciaMedia: 0,
                }));
            } else {
                setEditingId(null);
            }
        }, 800);
    };

    const handleEdit = (reg: RegistroSEAMA) => {
        setEditingId(reg.id);
        setFormData({
            ano: reg.ano,
            tipoAvaliacao: reg.tipoAvaliacao,
            componenteCurricular: reg.componenteCurricular,
            anoSerie: reg.anoSerie,
            estudantesAvaliados: reg.estudantesAvaliados,
            estudantesPrevistos: reg.estudantesPrevistos,
            abaixoBasico: reg.abaixoBasico,
            basico: reg.basico,
            adequado: reg.adequado,
            avançado: reg.avançado,
            proficienciaMedia: reg.proficienciaMedia || 0,
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
                <div className="relative overflow-hidden bg-slate-900 px-5 py-5 leading-tight">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Award className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">Cadastro SEAMA</h2>
                                <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest mt-0.5">{escola.nome}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar shadow-inner bg-slate-50/10">
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
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação da Avaliação</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-tight">Ano de Referência</label>
                                <input
                                    type="number"
                                    name="ano"
                                    required
                                    value={formData.ano}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-tight">Componente Curricular</label>
                                <select
                                    name="componenteCurricular"
                                    required
                                    value={formData.componenteCurricular}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="Língua Portuguesa">Língua Portuguesa</option>
                                    <option value="Matemática">Matemática</option>
                                </select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-tight">Ano / Série</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['2º ANO', '5º ANO', '9º ANO'] as const).map((ano) => (
                                        <button
                                            key={ano}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, anoSerie: ano }))}
                                            className={`py-3 rounded-xl text-xs font-black transition-all border ${formData.anoSerie === ano ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-indigo-200'}`}
                                        >
                                            {ano}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dados Quantitativos */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Users className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Participantes e Cobertura</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 font-semibold">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-tight">Estudantes Previstos</label>
                                <input
                                    type="number"
                                    name="estudantesPrevistos"
                                    min="0"
                                    required
                                    value={formData.estudantesPrevistos}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xl font-black text-slate-700 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-2 font-semibold">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-tight">Estudantes Avaliados</label>
                                <input
                                    type="number"
                                    name="estudantesAvaliados"
                                    min="0"
                                    required
                                    value={formData.estudantesAvaliados}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xl font-black text-blue-600 focus:border-blue-500 outline-none transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-2 font-semibold md:col-span-2">
                                <label className="text-[10px] font-bold text-indigo-500 uppercase block tracking-tight">Proficiência Média da Turma</label>
                                <input
                                    type="number"
                                    name="proficienciaMedia"
                                    step="0.1"
                                    min="0"
                                    required
                                    value={formData.proficienciaMedia}
                                    onChange={handleChange}
                                    placeholder="Ex: 245.5"
                                    className="w-full bg-indigo-50/30 border border-indigo-100 rounded-xl px-3 py-3 text-xl font-black text-indigo-700 focus:border-indigo-500 outline-none transition-all shadow-inner placeholder:text-indigo-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Desempenho e Níveis */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Activity className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Níveis de Proficiência (%)</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-rose-600 uppercase block text-center tracking-tight">Abaixo do Básico (%)</label>
                                <input
                                    type="number"
                                    name="abaixoBasico"
                                    min="0"
                                    max="100"
                                    required
                                    value={formData.abaixoBasico}
                                    onChange={handleChange}
                                    className="w-full bg-rose-50 border border-rose-100 rounded-xl px-3 py-3 text-2xl font-black text-rose-600 focus:border-rose-400 outline-none text-center transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-amber-600 uppercase block text-center tracking-tight">Básico (%)</label>
                                <input
                                    type="number"
                                    name="basico"
                                    min="0"
                                    max="100"
                                    required
                                    value={formData.basico}
                                    onChange={handleChange}
                                    className="w-full bg-amber-50 border border-amber-100 rounded-xl px-3 py-3 text-2xl font-black text-amber-600 focus:border-amber-400 outline-none text-center transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-emerald-600 uppercase block text-center tracking-tight">Adequado (%)</label>
                                <input
                                    type="number"
                                    name="adequado"
                                    min="0"
                                    max="100"
                                    required
                                    value={formData.adequado}
                                    onChange={handleChange}
                                    className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-3 text-2xl font-black text-emerald-600 focus:border-emerald-400 outline-none text-center transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-indigo-600 uppercase block text-center tracking-tight">Avançado (%)</label>
                                <input
                                    type="number"
                                    name="avançado"
                                    min="0"
                                    max="100"
                                    required
                                    value={formData.avançado}
                                    onChange={handleChange}
                                    className="w-full bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-3 text-2xl font-black text-indigo-600 focus:border-indigo-400 outline-none text-center transition-all shadow-inner"
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

                    {/* Histórico SEAMA */}
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Histórico de Lançamentos</h3>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Série/Ano/Comp.</th>
                                        <th className="px-4 py-4 text-center">Partic.</th>
                                        <th className="px-4 py-4 text-center">Ab. Básico</th>
                                        <th className="px-4 py-4 text-center">Básico</th>
                                        <th className="px-4 py-4 text-center">Adequado</th>
                                        <th className="px-4 py-4 text-center">Avançado</th>
                                        <th className="px-4 py-4 text-center bg-indigo-50 text-indigo-600">Média</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {escola.dadosEducacionais.registrosSEAMA && escola.dadosEducacionais.registrosSEAMA.length > 0 ? (
                                        escola.dadosEducacionais.registrosSEAMA
                                            .sort((a, b) => b.ano - a.ano || a.componenteCurricular.localeCompare(b.componenteCurricular))
                                            .map((reg) => (
                                                <tr key={reg.id} className={`hover:bg-slate-50/50 transition-colors ${editingId === reg.id ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800">{reg.anoSerie} - {reg.componenteCurricular}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                            SEAMA ({reg.ano})
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="font-bold text-slate-600">{reg.estudantesAvaliados}</span>
                                                        <span className="text-slate-300 mx-1">/</span>
                                                        <span className="text-slate-400">{reg.estudantesPrevistos}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-rose-500 font-bold">{reg.abaixoBasico}%</td>
                                                    <td className="px-4 py-4 text-center text-amber-500 font-bold">{reg.basico}%</td>
                                                    <td className="px-4 py-4 text-center text-emerald-500 font-bold">{reg.adequado}%</td>
                                                    <td className="px-4 py-4 text-center text-indigo-500 font-bold">{reg.avançado}%</td>
                                                    <td className="px-4 py-4 text-center bg-indigo-50/50 font-black text-indigo-700">{reg.proficienciaMedia}</td>
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
                                            <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs italic">
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
