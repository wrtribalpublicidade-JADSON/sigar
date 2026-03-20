import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Escola, RegistroIDEB } from '../../types';
import { Save, TrendingUp, X, Calendar, ClipboardCheck } from 'lucide-react';
import { Button } from '../ui/Button';

interface IdebModalProps {
    isOpen: boolean;
    onClose: () => void;
    escola: Escola;
    onSave: (registro: Omit<RegistroIDEB, 'id' | 'escolaId' | 'dataRegistro' | 'responsavel'> & { id?: string }) => void;
    onDelete: (id: string) => void;
}

export const IdebModal: React.FC<IdebModalProps> = ({ isOpen, onClose, escola, onSave, onDelete }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [ano, setAno] = useState<string>('2023');
    const [anosIniciais, setAnosIniciais] = useState<string>('');
    const [anosFinais, setAnosFinais] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEditingId(null);
            setAno('2023');
            setAnosIniciais('');
            setAnosFinais('');
        }
    }, [isOpen, escola.id]);

    if (!isOpen) return null;

    const handleEdit = (registro: RegistroIDEB) => {
        setEditingId(registro.id);
        setAno(registro.ano.toString());
        setAnosIniciais(registro.anosIniciais > 0 ? registro.anosIniciais.toString() : '');
        setAnosFinais(registro.anosFinais > 0 ? registro.anosFinais.toString() : '');
        const formContainer = document.querySelector('.overflow-y-auto');
        if (formContainer) formContainer.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setAno('2023');
        setAnosIniciais('');
        setAnosFinais('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            onSave({
                id: editingId || undefined,
                ano: parseInt(ano),
                anosIniciais: parseFloat(anosIniciais) || 0,
                anosFinais: parseFloat(anosFinais) || 0,
            });
            setLoading(false);
            handleCancelEdit();
        }, 600);
    };

    const registros = (escola.dadosEducacionais?.registrosIDEB || []).slice().sort((a, b) => b.ano - a.ano);

    const getColor = (val: number) => {
        if (val <= 0) return 'bg-slate-100 text-slate-500';
        if (val >= 6.0) return 'bg-emerald-100 text-emerald-700';
        if (val >= 4.5) return 'bg-amber-100 text-amber-700';
        return 'bg-rose-100 text-rose-700';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" showCloseButton={false}>
            <div className="overflow-hidden bg-white rounded-2xl">
                {/* Header — dark like SaebModal */}
                <div className="relative overflow-hidden bg-slate-900 px-5 py-5 leading-tight">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">Cadastro IDEB</h2>
                                <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mt-0.5">{escola.nome}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[75vh] overflow-y-auto bg-slate-50/10">
                    {/* Form section */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {editingId ? 'Editar Registro' : 'Novo Registro'}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-tight">Ano (Edição)</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none shadow-sm"
                                    value={ano}
                                    onChange={e => setAno(e.target.value)}
                                    required
                                >
                                    {Array.from({ length: 14 }, (_, i) => 2005 + (i * 2)).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-tight">Nota 5º Ano (Anos Iniciais)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm"
                                    value={anosIniciais}
                                    onChange={e => setAnosIniciais(e.target.value)}
                                    placeholder="Ex: 5.2"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-tight">Nota 9º Ano (Anos Finais)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm"
                                    value={anosFinais}
                                    onChange={e => setAnosFinais(e.target.value)}
                                    placeholder="Ex: 4.8"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Meta reference */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 flex items-center gap-4">
                        <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Meta Nacional</div>
                        <div className="flex gap-4 text-xs font-bold text-emerald-600">
                            <span>≥ 6.0 <span className="font-normal text-emerald-500">Excelente</span></span>
                            <span>≥ 4.5 <span className="font-normal text-amber-500">Regular</span></span>
                            <span>&lt; 4.5 <span className="font-normal text-rose-500">Crítico</span></span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 pb-2 border-b border-slate-100">
                        {editingId && (
                            <Button type="button" onClick={handleCancelEdit} variant="secondary" disabled={loading}>
                                Cancelar Edição
                            </Button>
                        )}
                        <Button type="button" onClick={onClose} variant="secondary" disabled={loading}>
                            Fechar
                        </Button>
                        <Button type="submit" variant="success" disabled={loading} icon={Save} isLoading={loading}>
                            {loading ? 'Salvando...' : editingId ? 'Atualizar Dados' : 'Salvar Informações'}
                        </Button>
                    </div>

                    {/* Historical table */}
                    <div className="mt-4 space-y-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Histórico de Lançamentos IDEB</h3>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Edição</th>
                                        <th className="px-4 py-4 text-center">Anos Iniciais</th>
                                        <th className="px-4 py-4 text-center bg-emerald-50/50 text-emerald-700">Anos Finais</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {registros.length > 0 ? (
                                        registros.map(reg => (
                                            <tr key={reg.id} className={`hover:bg-slate-50/50 transition-colors ${editingId === reg.id ? 'bg-emerald-50' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-slate-800 text-base">{reg.ano}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">IDEB ({reg.ano})</div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-black ${getColor(reg.anosIniciais)}`}>
                                                        {reg.anosIniciais > 0 ? reg.anosIniciais.toFixed(1) : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center bg-emerald-50/30">
                                                    <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-black ${getColor(reg.anosFinais)}`}>
                                                        {reg.anosFinais > 0 ? reg.anosFinais.toFixed(1) : '-'}
                                                    </span>
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
                                                            onClick={() => { if (window.confirm('Excluir este lançamento?')) onDelete(reg.id); }}
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
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs italic">
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
