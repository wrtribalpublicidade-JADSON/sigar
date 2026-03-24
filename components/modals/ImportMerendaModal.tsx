import React, { useState, useRef } from 'react';
import { X, Upload, FileType, Check, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { importarLoteMerenda } from '../../services/merendaService';

interface ImportMerendaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ImportMerendaModal: React.FC<ImportMerendaModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            processExcel(selectedFile);
        }
    };

    const processExcel = (file: File) => {
        setIsProcessing(true);
        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const bstr = e.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws);
                
                if (jsonData.length === 0) {
                    throw new Error('A planilha está vazia.');
                }

                // Basic validation of columns expected
                const firstRow = jsonData[0] as any;
                if (!firstRow['Nome do Item']) {
                    throw new Error('A coluna "Nome do Item" não foi encontrada no cabeçalho.');
                }
                if (!firstRow['Categoria']) {
                    throw new Error('A coluna "Categoria" não foi encontrada no cabeçalho.');
                }

                setData(jsonData);
            } catch (err: any) {
                console.error('Error processing Excel:', err);
                setError(err.message || 'Erro ao processar o arquivo. Verifique o modelo.');
                setFile(null);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.onerror = () => {
            setError('Erro ao ler o arquivo.');
            setIsProcessing(false);
        };
        reader.readAsBinaryString(file);
    };

    const handleDownloadTemplate = () => {
        const template = [
            {
                'Nome do Item': 'Arroz Branco',
                'Categoria': 'Grãos',
                'Capacidade': 500,
                'Unidade': 'kg',
                'Qtd Inicial': 100,
                'Origem': 'Licitação'
            },
            {
                'Nome do Item': 'Alface',
                'Categoria': 'Hortifruti',
                'Capacidade': 50,
                'Unidade': 'unid',
                'Qtd Inicial': 20,
                'Origem': 'Agricultura Familiar'
            }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Modelo Merenda');
        XLSX.writeFile(wb, 'Modelo_Importacao_Merenda.xlsx');
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const itemsToSave = data.map(item => ({
                nome: String(item['Nome do Item'] || '').trim(),
                categoria: String(item['Categoria'] || 'Outros').trim(),
                estoque_ideal: item['Capacidade'] || 100,
                unidade: String(item['Unidade'] || 'unid').trim(),
                qtd_inicial: item['Qtd Inicial'] || 0,
                origem: String(item['Origem'] || 'Licitação').trim()
            }));

            // Filter out empty rows
            const validItems = itemsToSave.filter(i => i.nome !== '');

            if (validItems.length === 0) {
                throw new Error('Nenhum item válido encontrado na planilha.');
            }

            await importarLoteMerenda(validItems);

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error importing items:', err);
            setError(`Erro ao importar para o banco de dados: ${err.message || JSON.stringify(err)}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                {/* Header */}
                <div className="bg-[#1a1f26] p-8 text-white flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-brand-orange/20 rounded-2xl flex items-center justify-center border border-brand-orange/30">
                            <Upload className="w-7 h-7 text-brand-orange" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight uppercase">Importar Merenda</h2>
                            <p className="text-slate-400 text-sm font-medium">Carregue o estoque de materiais via planilha Excel</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all group">
                        <X className="w-6 h-6 text-slate-400 group-hover:text-white" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/30">
                    {/* Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div 
                            onClick={handleDownloadTemplate}
                            className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group border-b-4 border-b-blue-500/10"
                        >
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Download className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Passo 1</span>
                                <span className="block text-base font-black text-slate-800 uppercase">Baixar Planilha Modelo</span>
                            </div>
                        </div>

                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group border-b-4 border-b-brand-orange/10"
                        >
                            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-all">
                                <FileType className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Passo 2</span>
                                <span className="block text-base font-black text-slate-800 uppercase">Selecionar Arquivo</span>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".xlsx, .xls, .csv" 
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-100 flex gap-3 text-sm font-bold animate-shake">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {file && (
                        <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-6 shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                        <Check className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-800 uppercase">{file.name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.length} itens encontrados</div>
                                    </div>
                                </div>
                                <button onClick={() => { setFile(null); setData([]); }} className="text-xs font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest">Remover</button>
                            </div>

                            <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left text-[11px]">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="px-5 py-4 font-black uppercase text-slate-400">Nome do Item</th>
                                            <th className="px-5 py-4 font-black uppercase text-slate-400">Categoria</th>
                                            <th className="px-5 py-4 font-black uppercase text-slate-400">Qtd INICIAL</th>
                                            <th className="px-5 py-4 font-black uppercase text-slate-400">Origem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.slice(0, 50).map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="px-5 py-3 font-bold text-slate-600">{row['Nome do Item']}</td>
                                                <td className="px-5 py-3 text-slate-500">{row['Categoria']}</td>
                                                <td className="px-5 py-3 text-slate-500 font-bold">{row['Qtd Inicial'] || '0'} <span className="text-slate-400">{row['Unidade']}</span></td>
                                                <td className="px-5 py-3 text-slate-500 text-xs">{row['Origem'] || 'Licitação'}</td>
                                            </tr>
                                        ))}
                                        {data.length > 50 && (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-3 text-center text-slate-400 font-bold italic">E mais {data.length - 50} itens...</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {!file && !isProcessing && (
                        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                            <Upload className="w-16 h-16 text-slate-200 mb-6" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Nenhum arquivo selecionado</p>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-orange rounded-full animate-spin mb-6"></div>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Processando planilha...</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-8 px-10 border-t border-slate-100 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase hover:bg-slate-300 transition-all tracking-widest"
                    >
                        Cancelar
                    </button>
                    <button
                        disabled={!file || data.length === 0 || isSaving}
                        onClick={handleSave}
                        className="px-10 py-4 bg-brand-orange text-white rounded-2xl font-black text-xs uppercase hover:bg-orange-600 transition-all shadow-xl shadow-brand-orange/20 disabled:opacity-50 flex items-center gap-3 tracking-widest"
                    >
                        {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        {isSaving ? 'Importando...' : 'Confirmar Importação'}
                    </button>
                </div>
            </div>
        </div>
    );
};
