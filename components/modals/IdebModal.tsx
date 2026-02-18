
import React, { useState, useEffect } from 'react';
import { Escola, RegistroIDEB } from '../../types';
import { X, Save, Trash2, Plus, TrendingUp, ClipboardCheck } from 'lucide-react';
import { Button } from '../ui/Button';

interface IdebModalProps {
    isOpen: boolean;
    onClose: () => void;
    escola: Escola;
    onSave: (registro: Omit<RegistroIDEB, 'id' | 'escolaId' | 'dataRegistro' | 'responsavel'> & { id?: string }) => void;
    onDelete: (id: string) => void;
}

export const IdebModal: React.FC<IdebModalProps> = ({ isOpen, onClose, escola, onSave, onDelete }) => {
    const [registros, setRegistros] = useState<RegistroIDEB[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form States
    const [ano, setAno] = useState<string>('2023');
    const [anosIniciais, setAnosIniciais] = useState<string>('');
    const [anosFinais, setAnosFinais] = useState<string>('');

    useEffect(() => {
        if (escola && escola.dadosEducacionais && escola.dadosEducacionais.registrosIDEB) {
            setRegistros(escola.dadosEducacionais.registrosIDEB);
        } else {
            setRegistros([]);
        }
    }, [escola]);

    if (!isOpen) return null;

    const handleEdit = (registro: RegistroIDEB) => {
        setEditingId(registro.id);
        setAno(registro.ano.toString());
        setAnosIniciais(registro.anosIniciais.toString());
        setAnosFinais(registro.anosFinais.toString());
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setAno('2023');
        setAnosIniciais('');
        setAnosFinais('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        onSave({
            id: editingId || undefined,
            ano: parseInt(ano),
            anosIniciais: parseFloat(anosIniciais) || 0,
            anosFinais: parseFloat(anosFinais) || 0
        });

        handleCancelEdit();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Histórico IDEB</h2>
                            <p className="text-xs text-slate-500">{escola.nome}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                            {editingId ? 'Editar Registro' : 'Novo Registro'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Ano (Edição)</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none"
                                    value={ano}
                                    onChange={e => setAno(e.target.value)}
                                    required
                                >
                                    {/* Generate years from 2005 to 2030 step 2 */}
                                    {Array.from({ length: 14 }, (_, i) => 2005 + (i * 2)).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nota 5º Ano (Anos Iniciais)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none"
                                    value={anosIniciais}
                                    onChange={e => setAnosIniciais(e.target.value)}
                                    placeholder="Ex: 5.2"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nota 9º Ano (Anos Finais)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none"
                                    value={anosFinais}
                                    onChange={e => setAnosFinais(e.target.value)}
                                    placeholder="Ex: 4.8"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            {editingId && (
                                <Button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    variant="secondary"
                                    size="sm"
                                >
                                    Cancelar
                                </Button>
                            )}
                            <Button
                                type="submit"
                                variant="success" // Or primary, depending on consistency. Saeb uses success. Let's use primary for orange since Ideb header is orange-ish/main theme? Usually save is success. But IdebModal hardcoded orange-600.
                                // Actually, let's stick to 'primary' (orange) or 'success' (green).
                                // The raw button was bg-orange-600. So variant="primary" (orange gradient) is the best match.
                                // Wait, the user prompt showed a GREEN button "SALVAR INFORMAÇÕES".
                                // The other modals use variant="success" (emerald gradient now).
                                // If I use variant="primary" it will be orange.
                                // Ideb is an indicator. Maybe keep orange?
                                // Let's use variant="primary" to match the orange theme of the clean button I replaced.
                                icon={Save}
                            >
                                {editingId ? 'Atualizar' : 'Salvar Registro'}
                            </Button>
                        </div>
                    </form>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-100">
                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Edição</th>
                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-center">Anos Iniciais</th>
                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-center">Anos Finais</th>
                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {registros.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                                            Nenhum registro encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    [...registros].sort((a, b) => b.ano - a.ano).map((reg) => (
                                        <tr key={reg.id} className="hover:bg-slate-50 group">
                                            <td className="py-3 px-4 text-sm font-bold text-slate-700">{reg.ano}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${reg.anosIniciais >= 6.0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    {reg.anosIniciais > 0 ? reg.anosIniciais.toFixed(1) : '-'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${reg.anosFinais >= 6.0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                                    {reg.anosFinais > 0 ? reg.anosFinais.toFixed(1) : '-'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(reg)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Save className="w-4 h-4" /> {/* Reusing Save icon for Edit due to import */}
                                                    </button>
                                                    <button onClick={() => onDelete(reg.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
    );
};
