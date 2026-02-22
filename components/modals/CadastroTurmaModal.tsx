import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';

interface CadastroTurmaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (turma: TurmaData) => void;
    turmasExistentes: TurmaData[];
}

export interface TurmaData {
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
    turmasExistentes
}) => {
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

        onSave({ etapa, anoSerie, identificacao, turno, tipo });

        // Reset form
        setEtapa('');
        setAnoSerie('');
        setIdentificacao('');
        setTurno('');
        setTipo('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Cadastrar Nova Turma</h2>
                        <p className="text-sm text-slate-400 mt-1">Preencha os dados obrigatórios para identificação da turma.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex gap-3 text-sm font-medium">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Etapa de Ensino */}
                        <div>
                            <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">
                                Etapa de Ensino <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={etapa}
                                onChange={(e) => setEtapa(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 block p-3 font-medium transition-all"
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
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 block p-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                required
                            >
                                <option value="" disabled>{etapa ? 'Selecione o ano/série' : 'Selecione uma etapa primeiro'}</option>
                                {etapa && anosPorEtapa[etapa].map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Identificação */}
                            <div>
                                <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">
                                    Identificação da Turma <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={identificacao}
                                    onChange={(e) => setIdentificacao(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 block p-3 font-medium transition-all"
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
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 block p-3 font-medium transition-all"
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
                                        className={`p-3 text-xs font-bold rounded-xl border transition-all ${tipo === t
                                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500'
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!isFormValid}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm group"
                        >
                            <Check className="w-4 h-4" />
                            <span>Salvar Turma</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
