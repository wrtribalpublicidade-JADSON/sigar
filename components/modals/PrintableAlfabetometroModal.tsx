import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Escola } from '../../types';
import { Printer, X, School, FileText, Calendar, Layers, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';

interface PrintableAlfabetometroModalProps {
    isOpen: boolean;
    onClose: () => void;
    escolas: Escola[];
    defaultEscolaId?: string;
    defaultAno?: number;
    onPrint: (params: { escolaId: string; escolaNome: string; grade: string; year: number }) => void;
}

export const PrintableAlfabetometroModal: React.FC<PrintableAlfabetometroModalProps> = ({
    isOpen,
    onClose,
    escolas = [],
    defaultEscolaId = '',
    defaultAno = new Date().getFullYear(),
    onPrint
}) => {
    const [selectedEscolaId, setSelectedEscolaId] = useState('');
    const [selectedModo, setSelectedModo] = useState('page');
    const [selectedGrade, setSelectedGrade] = useState('Toda a escola (consolidado)');
    const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedEscolaId(defaultEscolaId || (escolas.length > 0 ? escolas[0].id : ''));
            setSelectedAno(defaultAno || new Date().getFullYear());
            setSelectedModo('page');
            setSelectedGrade('Toda a escola (consolidado)');
        }
    }, [isOpen, defaultEscolaId, defaultAno, escolas]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEscolaId) return;

        setLoading(true);
        const schoolObj = escolas.find(esc => esc.id === selectedEscolaId);
        const schoolName = schoolObj ? schoolObj.nome : 'Unidade Escolar';

        setTimeout(() => {
            onPrint({
                escolaId: selectedEscolaId,
                escolaNome: schoolName,
                grade: selectedGrade,
                year: selectedAno
            });
            setLoading(false);
            onClose();
        }, 500);
    };

    const distinctYears = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2, 2025, 2024, 2023].filter(
        (val, id, self) => self.indexOf(val) === id
    ).sort((a, b) => b - a);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" showCloseButton={false}>
            <div className="overflow-hidden bg-white rounded-2xl">
                {/* Modal Header */}
                <div className="relative overflow-hidden bg-slate-900 px-6 py-6 leading-tight">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Printer className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">Imprimir Alfabetômetro</h2>
                                <p className="text-orange-400 font-bold text-xs uppercase tracking-widest mt-0.5">Configurações de Impressão</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* School Selector */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <School className="w-3.5 h-3.5 text-orange-500" />
                                Unidade Escolar
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    value={selectedEscolaId}
                                    onChange={(e) => setSelectedEscolaId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none appearance-none"
                                >
                                    <option value="">Selecione uma Unidade Escolar</option>
                                    {escolas.map((esc) => (
                                        <option key={esc.id} value={esc.id}>
                                            {esc.nome}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Print Mode */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-orange-500" />
                                Modo de Impressão
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedModo}
                                    onChange={(e) => setSelectedModo(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none appearance-none"
                                >
                                    <option value="page">Uma página (escola ou ano específico)</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Year/Series Selector */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-orange-500" />
                                Ano / Série
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedGrade}
                                    onChange={(e) => setSelectedGrade(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none appearance-none"
                                >
                                    <option value="Toda a escola (consolidado)">Toda a escola (consolidado)</option>
                                    {['1º ANO', '2º ANO', '3º ANO', '4º ANO', '5º ANO', '6º ANO', '7º ANO', '8º ANO', '9º ANO', 'EJA', 'MULTI'].map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Reference Year */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                                Ano Letivo
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedAno}
                                    onChange={(e) => setSelectedAno(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none appearance-none"
                                >
                                    {distinctYears.map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" onClick={onClose} variant="secondary" disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading || !selectedEscolaId} icon={Printer} isLoading={loading}>
                            Gerar e Imprimir
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
