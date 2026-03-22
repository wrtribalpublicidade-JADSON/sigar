import React, { useState, useRef } from 'react';
import { X, Upload, FileType, Check, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../services/supabase';

interface ImportEstudantesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedSchoolId: string;
    turmas: any[];
    escolas: any[];
    isDemoMode: boolean;
}

export const ImportEstudantesModal: React.FC<ImportEstudantesModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    selectedSchoolId: initialSchoolId,
    turmas: initialTurmas,
    escolas,
    isDemoMode
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Selection state
    const [selectedSchoolId, setSelectedSchoolId] = useState(initialSchoolId);
    const [selectedTurmaId, setSelectedTurmaId] = useState('');
    const [selectedResponsible, setSelectedResponsible] = useState('');
    const [teachers, setTeachers] = useState<any[]>([]);
    const [localTurmas, setLocalTurmas] = useState<any[]>(initialTurmas);
    const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
    const [isLoadingTurmas, setIsLoadingTurmas] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load teachers and turmas when school changes
    React.useEffect(() => {
        if (isOpen && selectedSchoolId) {
            loadTeachers();
            loadTurmas();
        }
    }, [isOpen, selectedSchoolId]);

    const loadTeachers = async () => {
        if (isDemoMode) {
            setTeachers([{ nome: 'Professor Demo A' }, { nome: 'Professor Demo B' }]);
            setIsLoadingTeachers(false);
            return;
        }
        setIsLoadingTeachers(true);
        try {
            const { data, error } = await supabase
                .from('recursos_humanos')
                .select('nome')
                .eq('escola_id', selectedSchoolId)
                .order('nome');
            if (error) throw error;
            setTeachers(data || []);
        } catch (err) {
            console.error('Error loading teachers:', err);
        } finally {
            setIsLoadingTeachers(false);
        }
    };

    const loadTurmas = async () => {
        if (isDemoMode) {
            setLocalTurmas([
                { id: 't1', anoSerie: '1º Ano', identificacao: 'Turma A', etapa: 'Alfabetização' },
                { id: 't2', anoSerie: '2º Ano', identificacao: 'Turma B', etapa: 'Alfabetização' }
            ]);
            setIsLoadingTurmas(false);
            return;
        }
        setIsLoadingTurmas(true);
        try {
            const { data, error } = await supabase
                .from('turmas')
                .select('*')
                .eq('school_id', selectedSchoolId)
                .order('name');
            if (error) throw error;
            
            const formatted = (data || []).map(t => ({
                id: t.id,
                etapa: t.stage || (t.level === 'Infantil' ? 'Educação Infantil' : 'Anos Iniciais'),
                anoSerie: t.year || t.name,
                identificacao: t.name
            }));
            setLocalTurmas(formatted);
        } catch (err) {
            console.error('Error loading turmas:', err);
        } finally {
            setIsLoadingTurmas(false);
        }
    };

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

                // Basic validation of columns
                const firstRow = jsonData[0] as any;
                if (!firstRow['Nome do Estudante']) {
                    throw new Error('A coluna "Nome do Estudante" não foi encontrada.');
                }

                setData(jsonData);
            } catch (err: any) {
                console.error('Error processing Excel:', err);
                setError(err.message || 'Erro ao processar o arquivo.');
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
                'Nome do Estudante': 'EXEMPLO: JOÃO DA SILVA',
                'Nascimento': '01/01/2010',
                'Sexo': 'M',
                'CPF': '000.000.000-00',
                'Matrícula': '2024001',
                'Observações': 'PCD, Alergia a lactose, etc.'
            }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
        XLSX.writeFile(wb, 'Modelo_Importacao_Estudantes.xlsx');
    };

    const handleSave = async () => {
        if (!selectedTurmaId) {
            setError('Selecione uma turma para vincular os estudantes.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            if (isDemoMode) {
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1000);
                return;
            }

            const currentTurma = localTurmas.find(t => t.id === selectedTurmaId);
            
            const studentsToSave = data.map(item => ({
                name: item['Nome do Estudante']?.toString().toUpperCase().trim(),
                birth_date: item['Nascimento'] ? formatDate(item['Nascimento']) : null,
                gender: item['Sexo']?.toString().toUpperCase().trim() === 'F' ? 'F' : 'M',
                cpf: item['CPF']?.toString().replace(/\D/g, ''),
                registration_number: item['Matrícula']?.toString(),
                observations: item['Observações']?.toString(),
                escola_id: selectedSchoolId,
                class_id: selectedTurmaId,
                status: 'Ativo',
                stage: currentTurma?.etapa || currentTurma?.stage,
                professor_responsavel: selectedResponsible || null
            }));

            const { error: saveError } = await supabase
                .from('alunos')
                .insert(studentsToSave);

            if (saveError) throw saveError;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving students:', err);
            setError('Erro ao salvar no banco de dados. Verifique a conexão e os dados.');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateValue: any) => {
        if (!dateValue) return null;
        // Handle Excel date format or string
        if (typeof dateValue === 'number') {
            const date = XLSX.SSF.parse_date_code(dateValue);
            return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }
        
        // Handle string DD/MM/AAAA
        const parts = dateValue.toString().split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateValue;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                {/* Header */}
                <div className="bg-[#1a1f26] p-8 text-white flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                            <Upload className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight uppercase">Importar Estudantes</h2>
                            <p className="text-slate-400 text-sm font-medium">Carregue dados em massa via planilha Excel</p>
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
                            className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group border-b-4 border-b-emerald-500/10"
                        >
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <FileType className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Passo 2</span>
                                <span className="block text-base font-black text-slate-800 uppercase">Selecionar Arquivo</span>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".xlsx, .xls" 
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
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.length} registros encontrados</div>
                                    </div>
                                </div>
                                <button onClick={() => { setFile(null); setData([]); }} className="text-xs font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest">Remover</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase ml-1">Unidade Escolar *</label>
                                    <select
                                        value={selectedSchoolId}
                                        onChange={(e) => setSelectedSchoolId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    >
                                        {escolas.map(e => (
                                            <option key={e.id} value={e.id}>{e.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase ml-1">Professor/Responsável</label>
                                    <select
                                        value={selectedResponsible}
                                        onChange={(e) => setSelectedResponsible(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                        disabled={isLoadingTeachers}
                                    >
                                        <option value="">Selecione o professor...</option>
                                        {teachers.map((t, idx) => (
                                            <option key={idx} value={t.nome}>{t.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase ml-1">Turma/Grupo *</label>
                                    <select
                                        value={selectedTurmaId}
                                        onChange={(e) => setSelectedTurmaId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                        disabled={isLoadingTurmas}
                                    >
                                        <option value="">Selecione a turma...</option>
                                        {localTurmas.map(t => (
                                            <option key={t.id} value={t.id}>{t.anoSerie} - {t.identificacao}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left text-[11px]">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="px-5 py-4 font-black uppercase text-slate-400">Nome</th>
                                            <th className="px-5 py-4 font-black uppercase text-slate-400">Nascimento</th>
                                            <th className="px-5 py-4 font-black uppercase text-slate-400">CPF</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.slice(0, 10).map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="px-5 py-3 font-bold text-slate-600 uppercase">{row['Nome do Estudante']}</td>
                                                <td className="px-5 py-3 text-slate-500">{row['Nascimento']}</td>
                                                <td className="px-5 py-3 text-slate-500">{row['CPF']}</td>
                                            </tr>
                                        ))}
                                        {data.length > 10 && (
                                            <tr>
                                                <td colSpan={3} className="px-5 py-3 text-center text-slate-400 font-bold italic">E mais {data.length - 10} registros...</td>
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
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
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
                        disabled={!file || data.length === 0 || isSaving || !selectedTurmaId}
                        onClick={handleSave}
                        className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-3 tracking-widest"
                    >
                        {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        {isSaving ? 'Salvando...' : 'Confirmar Importação'}
                    </button>
                </div>
            </div>
        </div>
    );
};
