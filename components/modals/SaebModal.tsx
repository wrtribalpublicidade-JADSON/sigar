import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Escola, RegistroSAEB } from '../../types';
import { Save, ClipboardCheck, Users, TrendingUp, X, Calendar, Target, Activity, Award } from 'lucide-react';
import { Button } from '../ui/Button';

interface SaebModalProps {
    isOpen: boolean;
    onClose: () => void;
    escola: Escola;
    onSave: (registro: Omit<RegistroSAEB, 'id' | 'escolaId' | 'dataRegistro' | 'responsavel'> & { id?: string }) => void;
    onDelete: (id: string) => void;
}

const SAEB_LIMITS: Record<string, { lp: { inf: number; sup: number }; mat: { inf: number; sup: number } }> = {
    '2º ANO': {
        lp: { inf: 49, sup: 324 },
        mat: { inf: 60, sup: 322 }
    },
    '5º ANO': {
        lp: { inf: 49, sup: 324 },
        mat: { inf: 60, sup: 322 }
    },
    '9º ANO': {
        lp: { inf: 100, sup: 400 },
        mat: { inf: 100, sup: 400 }
    }
};

export const SaebModal: React.FC<SaebModalProps> = ({
    isOpen,
    onClose,
    escola,
    onSave,
    onDelete
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        ano: new Date().getFullYear(),
        tipoAvaliacao: 'SAEB' as const,
        componenteCurricular: 'Língua Portuguesa' as 'Língua Portuguesa' | 'Matemática',
        anoSerie: '2º ANO' as '2º ANO' | '5º ANO' | '9º ANO',
        estudantesAvaliados: 0,
        estudantesPrevistos: 0,
        proficienciaLp: 0,
        proficienciaMat: 0,
        notaPadronizadaLp: 0,
        notaPadronizadaMat: 0,
        notaSaeb: 0,
        insuficiente: 0,
        basico: 0,
        proficiente: 0,
        avançado: 0,
        proficienciaMedia: 0,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Automate calculations
    useEffect(() => {
        const limits = SAEB_LIMITS[formData.anoSerie];
        if (!limits) return;

        const calcNormalized = (prof: number, inf: number, sup: number) => {
            if (prof <= 0) return 0;
            if (prof <= inf) return 0;
            if (prof >= sup) return 10;
            return Number(((prof - inf) / (sup - inf) * 10).toFixed(2));
        };

        const nLP = calcNormalized(formData.proficienciaLp, limits.lp.inf, limits.lp.sup);
        const nMAT = calcNormalized(formData.proficienciaMat, limits.mat.inf, limits.mat.sup);
        const finalSaeb = Number(((nLP + nMAT) / 2).toFixed(2));

        setFormData(prev => {
            // Só atualiza se houver mudança para evitar loops infinitos desnecessários
            if (prev.notaPadronizadaLp === nLP && prev.notaPadronizadaMat === nMAT && prev.notaSaeb === finalSaeb) {
                return prev;
            }
            return {
                ...prev,
                notaPadronizadaLp: nLP,
                notaPadronizadaMat: nMAT,
                notaSaeb: finalSaeb
            };
        });
    }, [formData.proficienciaLp, formData.proficienciaMat, formData.anoSerie]);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                ano: new Date().getFullYear(),
                tipoAvaliacao: 'SAEB',
                componenteCurricular: 'Língua Portuguesa',
                anoSerie: '2º ANO',
                estudantesAvaliados: 0,
                estudantesPrevistos: 0,
                proficienciaLp: 0,
                proficienciaMat: 0,
                notaPadronizadaLp: 0,
                notaPadronizadaMat: 0,
                notaSaeb: 0,
                insuficiente: 0,
                basico: 0,
                proficiente: 0,
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
                proficienciaLp: Number(formData.proficienciaLp),
                proficienciaMat: Number(formData.proficienciaMat),
                notaPadronizadaLp: Number(formData.notaPadronizadaLp),
                notaPadronizadaMat: Number(formData.notaPadronizadaMat),
                notaSaeb: Number(formData.notaSaeb),
                insuficiente: Number(formData.insuficiente),
                basico: Number(formData.basico),
                proficiente: Number(formData.proficiente),
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
                    proficienciaLp: 0,
                    proficienciaMat: 0,
                    notaPadronizadaLp: 0,
                    notaPadronizadaMat: 0,
                    notaSaeb: 0,
                    insuficiente: 0,
                    basico: 0,
                    proficiente: 0,
                    avançado: 0,
                    proficienciaMedia: 0,
                }));
            } else {
                setEditingId(null);
            }
        }, 800);
    };

    const handleEdit = (reg: RegistroSAEB) => {
        setEditingId(reg.id);
        setFormData({
            ano: reg.ano,
            tipoAvaliacao: reg.tipoAvaliacao,
            componenteCurricular: reg.componenteCurricular,
            anoSerie: reg.anoSerie,
            estudantesAvaliados: reg.estudantesAvaliados,
            estudantesPrevistos: reg.estudantesPrevistos,
            proficienciaLp: reg.proficienciaLp || 0,
            proficienciaMat: reg.proficienciaMat || 0,
            notaPadronizadaLp: reg.notaPadronizadaLp || 0,
            notaPadronizadaMat: reg.notaPadronizadaMat || 0,
            notaSaeb: reg.notaSaeb || 0,
            insuficiente: reg.insuficiente || 0,
            basico: reg.basico || 0,
            proficiente: reg.proficiente || 0,
            avançado: reg.avançado || 0,
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
                <div className="relative overflow-hidden bg-slate-900 px-6 py-8 leading-tight">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Award className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Cadastro de Informações SAEB</h2>
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
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter">Ano / Série</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['2º ANO', '5º ANO', '9º ANO'] as const).map((ano) => (
                                        <button
                                            key={ano}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, anoSerie: ano }))}
                                            className={`py-4 rounded-xl text-sm font-black transition-all border-2 ${formData.anoSerie === ano ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-orange-200'}`}
                                        >
                                            {ano}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Activity className="w-5 h-5 text-orange-500" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Resultados SAEB</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter">Proficiência Média Língua Portuguesa</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="proficienciaLp"
                                    required
                                    value={formData.proficienciaLp}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-lg font-black text-slate-900 focus:border-orange-500 outline-none transition-all shadow-sm"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter">Proficiência Média Matemática</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="proficienciaMat"
                                    required
                                    value={formData.proficienciaMat}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-lg font-black text-slate-900 focus:border-orange-500 outline-none transition-all shadow-sm"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter flex justify-between">
                                    Nota Padronizada LP
                                    <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 rounded-md">Automático</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="notaPadronizadaLp"
                                    readOnly
                                    value={formData.notaPadronizadaLp}
                                    className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-4 py-4 text-lg font-black text-slate-500 cursor-not-allowed outline-none transition-all shadow-sm"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter flex justify-between">
                                    Nota Padronizada Matemática
                                    <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 rounded-md">Automático</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="notaPadronizadaMat"
                                    readOnly
                                    value={formData.notaPadronizadaMat}
                                    className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-4 py-4 text-lg font-black text-slate-500 cursor-not-allowed outline-none transition-all shadow-sm"
                                />
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[11px] font-black text-orange-600 uppercase block tracking-tighter flex justify-between">
                                    Resultado SAEB (Nji)
                                    <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 rounded-md">Média das Notas Padronizadas</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="notaSaeb"
                                    readOnly
                                    value={formData.notaSaeb}
                                    className="w-full bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-4 text-3xl font-black text-orange-700 cursor-not-allowed outline-none transition-all shadow-md"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Users className="w-5 h-5 text-orange-500" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Participação</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter">Estudantes Previstos</label>
                                <input
                                    type="number"
                                    name="estudantesPrevistos"
                                    required
                                    value={formData.estudantesPrevistos}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-lg font-black text-slate-900 focus:border-orange-500 outline-none transition-all shadow-sm"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase block tracking-tighter">Estudantes Avaliados</label>
                                <input
                                    type="number"
                                    name="estudantesAvaliados"
                                    required
                                    value={formData.estudantesAvaliados}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-lg font-black text-slate-900 focus:border-orange-500 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 pb-8 border-b border-slate-100">
                        <Button type="button" onClick={onClose} variant="secondary" disabled={loading}>
                            {editingId ? 'Cancelar Edição' : 'Fechar'}
                        </Button>
                        <Button type="submit" variant="success" disabled={loading} icon={Save} isLoading={loading}>
                            {loading ? 'Salvando...' : editingId ? 'Atualizar Dados' : 'Salvar Informações'}
                        </Button>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-orange-500" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Histórico de Lançamentos SAEB</h3>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Ano/Série</th>
                                        <th className="px-4 py-4 text-center">LP (Prof/Pad)</th>
                                        <th className="px-4 py-4 text-center">MAT (Prof/Pad)</th>
                                        <th className="px-4 py-4 text-center bg-orange-50 text-orange-600">Nota SAEB</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {escola.dadosEducacionais.registrosSAEB && escola.dadosEducacionais.registrosSAEB.length > 0 ? (
                                        escola.dadosEducacionais.registrosSAEB
                                            .sort((a, b) => b.ano - a.ano)
                                            .map((reg) => (
                                                <tr key={reg.id} className={`hover:bg-slate-50/50 transition-colors ${editingId === reg.id ? 'bg-orange-50 text-orange-600' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800">{reg.anoSerie}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">SAEB ({reg.ano})</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="font-bold text-slate-700">{reg.proficienciaLp}</div>
                                                        <div className="text-[10px] text-slate-400">{reg.notaPadronizadaLp}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="font-bold text-slate-700">{reg.proficienciaMat}</div>
                                                        <div className="text-[10px] text-slate-400">{reg.notaPadronizadaMat}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center bg-orange-50/50 font-black text-orange-700">{reg.notaSaeb}</td>
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
