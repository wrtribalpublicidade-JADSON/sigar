import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Escola, RegistroFluenciaPARC } from '../../types';
import { Save, ClipboardCheck, Users, GraduationCap, TrendingUp, X, Calendar, Layers } from 'lucide-react';
import { Button } from '../ui/Button';

interface FluenciaParcModalProps {
    isOpen: boolean;
    onClose: () => void;
    escola: Escola;
    onSave: (registro: Omit<RegistroFluenciaPARC, 'id' | 'escolaId' | 'dataRegistro' | 'responsavel'> & { id?: string }) => void;
    onDelete: (id: string) => void;
}

export const FluenciaParcModal: React.FC<FluenciaParcModalProps> = ({
    isOpen,
    onClose,
    escola,
    onSave,
    onDelete
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        polo: '',
        ano: new Date().getFullYear(),
        edicao: 'Entrada' as 'Entrada' | 'Saída',
        etapaAplicacao: '',
        tipoTurma: 'Regular' as 'Regular' | 'Multisseriada',
        turmaNome: 'TURMA A',
        turmaAnoSerie: '2º ANO',
        matriculados: 0,
        presentes: 0,
        preLeitorNivel1: 0,
        preLeitorNivel2: 0,
        preLeitorNivel3: 0,
        preLeitorNivel4: 0,
        leitorIniciante: 0,
        leitorFluente: 0,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const sum =
            Number(formData.preLeitorNivel1) +
            Number(formData.preLeitorNivel2) +
            Number(formData.preLeitorNivel3) +
            Number(formData.preLeitorNivel4) +
            Number(formData.leitorIniciante) +
            Number(formData.leitorFluente);

        setFormData(prev => ({ ...prev, presentes: sum }));
    }, [
        formData.preLeitorNivel1,
        formData.preLeitorNivel2,
        formData.preLeitorNivel3,
        formData.preLeitorNivel4,
        formData.leitorIniciante,
        formData.leitorFluente
    ]);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                polo: '',
                ano: new Date().getFullYear(),
                edicao: 'Entrada',
                etapaAplicacao: '',
                tipoTurma: 'Regular',
                turmaNome: 'TURMA A',
                turmaAnoSerie: '2º ANO',
                matriculados: 0,
                presentes: 0,
                preLeitorNivel1: 0,
                preLeitorNivel2: 0,
                preLeitorNivel3: 0,
                preLeitorNivel4: 0,
                leitorIniciante: 0,
                leitorFluente: 0,
            });
            setEditingId(null);
            setError(null);
        }
    }, [isOpen, escola.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.presentes > formData.matriculados) {
            setError(`O número de PRESENTES (${formData.presentes}) não pode ser maior que o de MATRICULADOS (${formData.matriculados})`);
            return;
        }

        setError(null);
        setLoading(true);
        setTimeout(() => {
            const registro = {
                id: editingId || undefined,
                polo: formData.polo,
                ano: Number(formData.ano),
                edicao: formData.edicao,
                etapaAplicacao: formData.etapaAplicacao || `${formData.edicao} / ${formData.ano}`,
                tipoTurma: formData.tipoTurma,
                turma: {
                    nome: formData.turmaNome,
                    anoSerie: formData.turmaAnoSerie
                },
                participacao: {
                    matriculados: Number(formData.matriculados),
                    presentes: Number(formData.presentes)
                },
                classificacao: {
                    preLeitorNivel1: Number(formData.preLeitorNivel1),
                    preLeitorNivel2: Number(formData.preLeitorNivel2),
                    preLeitorNivel3: Number(formData.preLeitorNivel3),
                    preLeitorNivel4: Number(formData.preLeitorNivel4),
                    leitorIniciante: Number(formData.leitorIniciante),
                    leitorFluente: Number(formData.leitorFluente)
                }
            };
            onSave(registro);
            setLoading(false);
            if (!editingId) {
                // Se não estava editando, limpa os campos para o próximo registro
                setFormData(prev => ({
                    ...prev,
                    turmaNome: 'TURMA A',
                    matriculados: 0,
                    presentes: 0,
                    preLeitorNivel1: 0,
                    preLeitorNivel2: 0,
                    preLeitorNivel3: 0,
                    preLeitorNivel4: 0,
                    leitorIniciante: 0,
                    leitorFluente: 0,
                }));
            } else {
                setEditingId(null);
            }
        }, 800);
    };

    const handleEdit = (reg: RegistroFluenciaPARC) => {
        setEditingId(reg.id);
        setFormData({
            polo: reg.polo,
            ano: reg.ano,
            edicao: reg.edicao,
            etapaAplicacao: reg.etapaAplicacao,
            tipoTurma: reg.tipoTurma,
            turmaNome: reg.turma.nome,
            turmaAnoSerie: reg.turma.anoSerie,
            matriculados: reg.participacao.matriculados,
            presentes: reg.participacao.presentes,
            preLeitorNivel1: reg.classificacao.preLeitorNivel1,
            preLeitorNivel2: reg.classificacao.preLeitorNivel2,
            preLeitorNivel3: reg.classificacao.preLeitorNivel3,
            preLeitorNivel4: reg.classificacao.preLeitorNivel4,
            leitorIniciante: reg.classificacao.leitorIniciante,
            leitorFluente: reg.classificacao.leitorFluente,
        });
        // Scroll back to top
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
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">Registro de Fluência PARC</h2>
                                <p className="text-orange-400 font-bold text-xs uppercase tracking-widest mt-0.5">{escola.nome}</p>
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

                    {/* Identificação da Aplicação */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <ClipboardCheck className="w-4 h-4 text-orange-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação da Aplicação</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Polo */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block text-center tracking-tight">Polo de Aplicação</label>
                                <select
                                    name="polo"
                                    required
                                    value={formData.polo}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none text-center shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="">Selecione o Polo</option>
                                    <option value="01 - SEDE">01 - SEDE</option>
                                    <option value="02 - BOM JESUS">02 - BOM JESUS</option>
                                    <option value="03 - PRATA">03 - PRATA</option>
                                    <option value="04 - SERRARIA">04 - SERRARIA</option>
                                    <option value="05 - RAMPA">05 - RAMPA</option>
                                    <option value="06 - TABOA">06 - TABOA</option>
                                    <option value="07 - SÃO MIGUEL">07 - SÃO MIGUEL</option>
                                    <option value="08 - FAZENDINHA">08 - FAZENDINHA</option>
                                    <option value="09 - SANTA CRUZ">09 - SANTA CRUZ</option>
                                    <option value="10 - ACHUÍ">10 - ACHUÍ</option>
                                    <option value="11 - SANTA CLARA">11 - SANTA CLARA</option>
                                    <option value="12 - CEDRO">12 - CEDRO</option>
                                    <option value="13 - CARRAPATAL">13 - CARRAPATAL</option>
                                </select>
                            </div>

                            {/* Ano */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block text-center tracking-tight">Ano da Avaliação</label>
                                <input
                                    type="number"
                                    name="ano"
                                    required
                                    value={formData.ano}
                                    onChange={handleChange}
                                    placeholder="Ex: 2025"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none text-center shadow-sm"
                                />
                            </div>

                            {/* Edição */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block text-center tracking-tight">Edição / Momento</label>
                                <select
                                    name="edicao"
                                    required
                                    value={formData.edicao}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none text-center shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="Entrada">Entrada</option>
                                    <option value="Saída">Saída</option>
                                </select>
                            </div>

                            {/* Tipo de Turma */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block text-center tracking-tight">Tipo de Turma</label>
                                <select
                                    name="tipoTurma"
                                    value={formData.tipoTurma}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none text-center shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="Regular">Regular</option>
                                    <option value="Multisseriada">Multisseriada</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Informações da Turma */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Users className="w-4 h-4 text-orange-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informações da Turma</h3>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
                            <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-tight">Nome da Turma</label>
                                    <select
                                        name="turmaNome"
                                        required
                                        value={formData.turmaNome}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none shadow-sm appearance-none cursor-pointer"
                                    >
                                        <option value="TURMA A">TURMA A</option>
                                        <option value="TURMA B">TURMA B</option>
                                        <option value="TURMA C">TURMA C</option>
                                        <option value="TURMA D">TURMA D</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-tight">Ano / Série</label>
                                    <input
                                        type="text"
                                        name="turmaAnoSerie"
                                        required
                                        disabled
                                        value={formData.turmaAnoSerie}
                                        onChange={handleChange}
                                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-400 outline-none shadow-sm cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="lg:col-span-12 xl:col-span-5 grid grid-cols-2 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl shadow-slate-900/20">
                                <div className="space-y-1">
                                    <label className="block text-center text-[9px] font-black text-emerald-400 uppercase tracking-wider">Matriculados</label>
                                    <input
                                        type="number"
                                        name="matriculados"
                                        min="0"
                                        required
                                        value={formData.matriculados}
                                        onChange={handleChange}
                                        className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-2 text-xl font-black text-emerald-400 focus:border-emerald-500 outline-none text-center transition-colors"
                                    />
                                </div>
                                <div className="space-y-1 text-center">
                                    <label className="block text-center text-[9px] font-black text-blue-400 uppercase tracking-wider">Presentes</label>
                                    <div className={`w-full ${formData.presentes > formData.matriculados ? 'bg-rose-500/10 border-rose-500/50' : 'bg-blue-500/5 border-blue-500/10'} border rounded-lg px-2 py-2 text-xl font-black ${formData.presentes > formData.matriculados ? 'text-rose-500' : 'text-blue-400/60'} text-center transition-all`}>
                                        {formData.presentes}
                                    </div>
                                    {formData.presentes > formData.matriculados && (
                                        <p className="text-[9px] font-black text-rose-500 mt-0 uppercase">Excedente!</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Classificação de Fluência */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <GraduationCap className="w-4 h-4 text-orange-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classificação de Fluência Leitora</h3>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { label: 'Pré-leitor Nível 1', name: 'preLeitorNivel1', color: 'text-rose-600', border: 'border-rose-100', bg: 'bg-rose-50/50' },
                                { label: 'Pré-leitor Nível 2', name: 'preLeitorNivel2', color: 'text-orange-600', border: 'border-orange-100', bg: 'bg-orange-50/50' },
                                { label: 'Pré-leitor Nível 3', name: 'preLeitorNivel3', color: 'text-amber-600', border: 'border-amber-100', bg: 'bg-amber-50/50' },
                                { label: 'Pré-leitor Nível 4', name: 'preLeitorNivel4', color: 'text-blue-600', border: 'border-blue-100', bg: 'bg-blue-50/50' },
                                { label: 'Leitor Iniciante', name: 'leitorIniciante', color: 'text-indigo-600', border: 'border-indigo-100', bg: 'bg-indigo-50/50' },
                                { label: 'Leitor Fluente', name: 'leitorFluente', color: 'text-emerald-600', border: 'border-emerald-100', bg: 'bg-emerald-50/50' },
                            ].map((item) => (
                                <div key={item.name} className="space-y-2 flex flex-col items-center">
                                    <label className={`text-[10px] font-black uppercase text-center leading-none ${item.color}`}>{item.label}</label>
                                    <input
                                        type="number"
                                        name={item.name}
                                        min="0"
                                        value={(formData as any)[item.name]}
                                        onChange={handleChange}
                                        className={`w-full ${item.bg} ${item.border} border rounded-xl px-3 py-3 text-2xl font-black ${item.color} focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all outline-none text-center shadow-inner`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 pb-8 border-b border-slate-100">
                        <Button type="button" onClick={() => {
                            if (editingId) {
                                setEditingId(null);
                                setFormData(prev => ({
                                    ...prev,
                                    turmaNome: 'TURMA A',
                                    matriculados: 0,
                                    presentes: 0,
                                    preLeitorNivel1: 0,
                                    preLeitorNivel2: 0,
                                    preLeitorNivel3: 0,
                                    preLeitorNivel4: 0,
                                    leitorIniciante: 0,
                                    leitorFluente: 0,
                                }));
                            } else {
                                onClose();
                            }
                        }} variant="secondary" disabled={loading}>
                            {editingId ? 'Cancelar Edição' : 'Cancelar'}
                        </Button>
                        <Button type="submit" variant="success" disabled={loading} icon={Save} isLoading={loading}>
                            {loading ? 'Salvando...' : editingId ? 'Atualizar Registro PARC' : 'Confirmar Registro PARC'}
                        </Button>
                    </div>

                    {/* Tabela de Turmas Salvas */}
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-orange-500" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Turmas Registradas</h3>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Ano/Edição</th>
                                        <th className="px-6 py-4">Turma</th>
                                        <th className="px-6 py-4 text-center">Matr./Pres.</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {escola.dadosEducacionais.registrosFluenciaParc && escola.dadosEducacionais.registrosFluenciaParc.length > 0 ? (
                                        escola.dadosEducacionais.registrosFluenciaParc
                                            .sort((a, b) => b.ano - a.ano || (a.edicao === 'Entrada' ? -1 : 1))
                                            .map((reg) => (
                                                <tr key={reg.id} className={`hover:bg-slate-50/50 transition-colors ${editingId === reg.id ? 'bg-orange-50 text-orange-600' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800">{reg.ano}</div>
                                                        <div className="text-[10px] uppercase text-slate-400">{reg.edicao}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800">{reg.turma.nome}</div>
                                                        <div className="text-[10px] uppercase text-slate-400">{reg.turma.anoSerie}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-bold text-slate-600">{reg.participacao.matriculados}</span>
                                                        <span className="mx-1 text-slate-300">/</span>
                                                        <span className="font-bold text-emerald-600">{reg.participacao.presentes}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEdit(reg)}
                                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Editar"
                                                            >
                                                                <ClipboardCheck className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
                                                                        onDelete(reg.id);
                                                                    }
                                                                }}
                                                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Excluir"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs italic">
                                                Nenhum registro encontrado para esta unidade.
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
