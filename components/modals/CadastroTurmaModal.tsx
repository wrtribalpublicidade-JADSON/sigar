import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Edit, Trash2, Plus } from 'lucide-react';

interface CadastroTurmaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (turma: TurmaData) => void;
    onDelete: (id: string) => void;
    turmasExistentes: TurmaData[];
}

export interface TurmaData {
    id?: string;
    etapa: string;
    anoSerie: string;
    identificacao: string;
    turno: string;
    tipo: string;
}

export const CadastroTurmaModal: React.FC<CadastroTurmaModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    turmasExistentes
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [etapa, setEtapa] = useState('');
    const [anoSerie, setAnoSerie] = useState('');
    const [identificacao, setIdentificacao] = useState('');
    const [turno, setTurno] = useState('');
    const [tipo, setTipo] = useState('');
    const [error, setError] = useState('');

    const anosPorEtapa: Record<string, string[]> = {
        'Educação Infantil': ['Creche II', 'Creche III', 'Pré-Escola I', 'Pré-Escola II'],
        'Anos Iniciais': ['1º ANO', '2º ANO', '3º ANO', '4º ANO', '5º ANO'],
        'Anos Finais': ['6º ANO', '7º ANO', '8º ANO', '9º ANO']
    };

    const identificacoes = ['Turma A', 'Turma B', 'Turma C', 'Turma D'];
    const turnos = ['MANHÃ', 'TARDE', 'INTEGRAL', 'NOITE'];
    const tipos = ['REGULAR', 'MULTISSERIADA', 'MULTIETAPA'];

    // Reset ano/série when etapa changes
    useEffect(() => {
        setAnoSerie('');
    }, [etapa]);

    const isFormValid = etapa !== '' && anoSerie !== '' && identificacao !== '' && turno !== '' && tipo !== '';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isFormValid) return;

        const isDuplicate = turmasExistentes.some(
            (t) => t.etapa === etapa && t.anoSerie === anoSerie && t.identificacao === identificacao && t.turno === turno
        );

        if (isDuplicate) {
            setError('Já existe uma turma cadastrada com esta combinação de Etapa, Ano/Série, Identificação e Turno.');
            return;
        }

        onSave({ id: editingId || undefined, etapa, anoSerie, identificacao, turno, tipo });

        // Reset form
        handleReset();
    };

    const handleReset = () => {
        setEditingId(null);
        setEtapa('');
        setAnoSerie('');
        setIdentificacao('');
        setTurno('');
        setTipo('');
        setError('');
    };

    const handleEdit = (turma: TurmaData) => {
        setEditingId(turma.id || null);
        setEtapa(turma.etapa);
        // We need a small timeout because changing Etapa resets anoSerie via useEffect
        setTimeout(() => {
            setAnoSerie(turma.anoSerie);
        }, 0);
        setIdentificacao(turma.identificacao);
        setTurno(turma.turno);
        setTipo(turma.tipo);
        setError('');
        
        // Scroll to form
        const form = document.querySelector('form');
        form?.scrollIntoView({ behavior: 'smooth' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="bg-slate-800 p-6 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">{editingId ? 'Editar Turma' : 'Cadastrar Nova Turma'}</h2>
                        <p className="text-sm text-slate-400 mt-1">Preencha os dados obrigatórios para identificação da turma.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex gap-3 text-sm font-medium">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                {/* Etapa de Ensino */}
                                <div>
                                    <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">
                                        Etapa de Ensino <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={etapa}
                                        onChange={(e) => setEtapa(e.target.value)}
                                        className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 block p-3 font-medium transition-all shadow-sm"
                                        required
                                    >
                                        <option value="" disabled>Selecione a etapa</option>
                                        {Object.keys(anosPorEtapa).map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                </div>

                                {/* Ano/Série */}
                                <div>
                                    <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">
                                        Ano/Série <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={anoSerie}
                                        onChange={(e) => setAnoSerie(e.target.value)}
                                        disabled={!etapa}
                                        className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 block p-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        required
                                    >
                                        <option value="" disabled>{etapa ? 'Selecione o ano/série' : 'Selecione uma etapa primeiro'}</option>
                                        {etapa && anosPorEtapa[etapa].map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Identificação */}
                                    <div>
                                        <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">
                                            Identificação <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={identificacao}
                                            onChange={(e) => setIdentificacao(e.target.value)}
                                            className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 block p-3 font-medium transition-all shadow-sm"
                                            required
                                        >
                                            <option value="" disabled>Selecione a turma</option>
                                            {identificacoes.map(i => <option key={i} value={i}>{i}</option>)}
                                        </select>
                                    </div>

                                    {/* Turno */}
                                    <div>
                                        <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">
                                            Turno <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={turno}
                                            onChange={(e) => setTurno(e.target.value)}
                                            className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 block p-3 font-medium transition-all shadow-sm"
                                            required
                                        >
                                            <option value="" disabled>Selecione o turno</option>
                                            {turnos.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Tipo de Turma */}
                                <div>
                                    <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">
                                        Tipo de Turma <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {tipos.map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setTipo(t)}
                                                className={`p-3 text-[10px] font-bold rounded-xl border transition-all ${tipo === t
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                Limpar
                            </button>
                            <button
                                type="submit"
                                disabled={!isFormValid}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                <span>{editingId ? 'Atualizar Turma' : 'Cadastrar Turma'}</span>
                            </button>
                        </div>
                    </form>

                    {/* Tabela de Gestão */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                Turmas Cadastradas ({turmasExistentes.length})
                            </h3>
                        </div>

                        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Etapa</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Ano/Série</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Identificação</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Turno</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Tipo</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {turmasExistentes.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-slate-400 font-medium">
                                                Nenhuma turma cadastrada.
                                            </td>
                                        </tr>
                                    ) : (
                                        turmasExistentes.map((t) => (
                                            <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${editingId === t.id ? 'bg-blue-50/50' : ''}`}>
                                                <td className="px-4 py-3 font-medium text-slate-700">{t.etapa}</td>
                                                <td className="px-4 py-3 font-bold text-slate-900">{t.anoSerie}</td>
                                                <td className="px-4 py-3 text-slate-600">{t.identificacao}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${t.turno === 'MANHÃ' ? 'bg-amber-100 text-amber-700' :
                                                        t.turno === 'TARDE' ? 'bg-orange-100 text-orange-700' :
                                                            t.turno === 'INTEGRAL' ? 'bg-indigo-100 text-indigo-700' :
                                                                'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {t.turno}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[10px] font-semibold text-slate-500">{t.tipo}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(t)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Editar"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => t.id && onDelete(t.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
