import React, { useState, useRef } from 'react';
import { PageHeader } from './ui/PageHeader';
import {
    BarChart3,
    Users,
    BookOpen,
    Target,
    TrendingUp,
    GraduationCap,
    Layout,
    LineChart,
    Search,
    Download,
    Activity,
    ChevronRight,
    MapPin,
    Settings,
    PieChart,
    CheckCircle2
} from 'lucide-react';
import { FluenciaParcDashboard } from './FluenciaParcDashboard';
import { CncaPnraDashboard } from './CncaPnraDashboard';
import { SeamaDashboard } from './SeamaDashboard';
import { SaebDashboard } from './SaebDashboard';
import { SamahcDashboard } from './SamahcDashboard';
import { 
    Coordenador, 
    Escola, 
    Segmento, 
    RegistroFluenciaPARC, 
    RegistroCNCA, 
    RegistroSEAMA, 
    RegistroSAEB, 
    RegistroIDEB,
    RegistroFluenciaSAMAHC,
    RecursoHumano
} from '../types';
import { Card } from './ui/Card';
import { generateUUID } from '../utils';
import { exportToCSV } from '../utils/exportUtils';
import { FluenciaParcModal } from './modals/FluenciaParcModal';
import { CncaModal } from './modals/CncaModal';
import { SeamaModal } from './modals/SeamaModal';
import { SaebModal } from './modals/SaebModal';
import { IdebModal } from './modals/IdebModal';
import { parseCSV } from '../utils/importUtils';
import { useNotification } from '../context/NotificationContext';
import * as XLSX from 'xlsx';

interface IndicatorsPanelProps {
    escolas: Escola[];
    coordenadores: Coordenador[];
    isDemoMode: boolean;
    onUpdateEscola: (updatedEscola: Escola) => void;
}

const COLORS = {
    brand: '#FF4D00',
    dark: '#000000',
    grey: '#71717A',
    acid: '#D6FF00'
};

type TabType = 'CENSO' | 'SAMAHC' | 'PARC' | 'SAEB' | 'IDEB' | 'SEAMA' | 'CNCA' | 'EI';

export const IndicatorsPanel: React.FC<IndicatorsPanelProps> = ({ escolas, coordenadores, isDemoMode, onUpdateEscola }) => {
    const [mainTab, setMainTab] = useState<'CADASTRO' | 'ANALISE'>('CADASTRO');
    const [activeAnalysis, setActiveAnalysis] = useState<'PARC' | 'SEAMA' | 'CNCA' | 'SAEB' | 'SAMAHC_FLUENCIA' | 'SAMAHC_SEAMA' | 'SAMAHC_SAEB' | 'SAMAHC_PORTUGUES' | 'SAMAHC_MATEMATICA'>('PARC');
    const [activeTab, setActiveTab] = useState<TabType>('CENSO');
    const [samahcSubTab, setSamahcSubTab] = useState<'SEAMA' | 'SAEB' | 'FLUENCIA' | 'PORTUGUES' | 'MATEMATICA'>('FLUENCIA');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSchoolForParc, setSelectedSchoolForParc] = useState<Escola | null>(null);
    const [showParcModal, setShowParcModal] = useState(false);
    const [selectedSchoolForCnca, setSelectedSchoolForCnca] = useState<Escola | null>(null);
    const [showCncaModal, setShowCncaModal] = useState(false);
    const [selectedSchoolForSeama, setSelectedSchoolForSeama] = useState<Escola | null>(null);
    const [showSeamaModal, setShowSeamaModal] = useState(false);
    const [selectedSchoolForSaeb, setSelectedSchoolForSaeb] = useState<Escola | null>(null);
    const [showSaebModal, setShowSaebModal] = useState(false);
    const [selectedSchoolForIdeb, setSelectedSchoolForIdeb] = useState<Escola | null>(null);
    const [showIdebModal, setShowIdebModal] = useState(false);
    const [showImportPreview, setShowImportPreview] = useState(false);
    const [pendingImportData, setPendingImportData] = useState<{
        schoolsToUpdate: Map<string, Escola>;
        successCount: number;
        errors: string[];
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showNotification } = useNotification();

    const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string; strokeWidth?: number }> }[] = [
        { id: 'CENSO', label: 'Censo Escolar', icon: Users },
        { id: 'SAMAHC', label: 'SAMAHC', icon: BarChart3 },
        { id: 'PARC', label: 'Fluência PARC', icon: BookOpen },
        { id: 'SAEB', label: 'SAEB', icon: Target },
        { id: 'IDEB', label: 'IDEB', icon: TrendingUp },
        { id: 'SEAMA', label: 'SEAMA', icon: GraduationCap },
        { id: 'CNCA', label: 'CNCA', icon: Layout },
        { id: 'EI', label: 'Relatório EI', icon: LineChart },
    ];

    const filteredEscolas = escolas.filter(escola => {
        const matchesSearch = escola.nome.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeTab === 'EI') {
            return matchesSearch && escola.segmentos.includes(Segmento.INFANTIL);
        }
        if (activeTab === 'PARC') {
            return matchesSearch && escola.segmentos.includes(Segmento.FUNDAMENTAL_I);
        }
        if (activeTab === 'SAEB') {
            return matchesSearch && (escola.segmentos.includes(Segmento.FUNDAMENTAL_I) || escola.segmentos.includes(Segmento.FUNDAMENTAL_II));
        }
        return matchesSearch;
    });

    const handleExport = () => {
        let columns: any[] = [];
        let dataToExport: any[] = [];

        if (activeTab === 'CENSO') {
            columns = [
                { header: 'Unidade Escolar', key: 'nome' },
                { header: 'Matrícula', key: (r: Escola) => calculateCensoStats(r).matricula },
                { header: 'Docentes', key: (r: Escola) => calculateCensoStats(r).docentes },
                { header: 'Turmas', key: (r: Escola) => calculateCensoStats(r).turmas }
            ];
            dataToExport = filteredEscolas;
        } else if (activeTab === 'SAMAHC') {
            columns = [
                { header: 'Unidade Escolar', key: 'nome' },
                { header: samahcSubTab, key: (r: Escola) => {
                    const s = r.dadosEducacionais?.dadosSamahc;
                    if (samahcSubTab === 'SEAMA') return s?.simuladoSeama || 0;
                    if (samahcSubTab === 'SAEB') return s?.simuladoSaeb || 0;
                    if (samahcSubTab === 'FLUENCIA') return (s?.fluencia || 0) + '%';
                    if (samahcSubTab === 'PORTUGUES') return s?.linguaPortuguesa || 0;
                    if (samahcSubTab === 'MATEMATICA') return s?.matematica || 0;
                    return 0;
                }}
            ];
            dataToExport = filteredEscolas;
        } else {
            dataToExport = [];
        }

        exportToCSV(dataToExport, columns, `indicadores_${activeTab.toLowerCase()}`);
    };

    const handleDownloadTemplate = () => {
        const templateData = escolas.map(e => ({
            'ANO': new Date().getFullYear(),
            'PÓLO': (e as any).polo || '',
            'UNIDADE ESCOLAR': e.nome,
            'NOME DO ESTUDANTE': '',
            'ANO/SÉRIE': '',
            'NÍVEL DE DESEMPENHO': 'Ex: LEITOR FLUENTE, LEITOR INICIANTE, NÃO LEITOR',
            'TURNO': '',
            'TIPO DE AVALIAÇÃO': 'DIAGNÓSTICA, FORMATIVA ou SOMATIVA',
            'TURMA DE MATRÍCULA': '',
            'ETAPA': ''
        }));

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Modelo Fluência');
        XLSX.writeFile(wb, 'modelo_fluencia_samahc.xlsx');
    };
    const handleImportFluencia = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

        reader.onload = (e) => {
            try {
                let parsedData: any[] = [];

                if (isExcel) {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    parsedData = XLSX.utils.sheet_to_json(worksheet);
                } else {
                    const text = e.target?.result as string;
                    parsedData = parseCSV(text);
                }
                
                if (!parsedData || parsedData.length === 0) {
                    showNotification('error', 'Arquivo vazio ou com formato inválido.');
                    return;
                }

                const schoolsToUpdate = new Map<string, Escola>();
                const errors: string[] = [];
                let successCount = 0;

                parsedData.forEach((row, index) => {
                    const lineNum = index + 2; // +1 for 0-index, +1 for header
                    const schoolName = row['UNIDADE ESCOLAR'];
                    const studentName = row['NOME DO ESTUDANTE'];
                    const performanceLevel = row['NÍVEL DE DESEMPENHO'];
                    const year = parseInt(row['ANO']);
                    const turno = row['TURNO'];
                    const tipoAvaliacao = row['TIPO DE AVALIAÇÃO']?.toString().toUpperCase().trim();

                    // Validation
                    if (!schoolName) {
                        errors.push(`Linha ${lineNum}: Unidade Escolar ausente.`);
                        return;
                    }

                    const escola = escolas.find(esc => esc.nome === schoolName);
                    if (!escola) {
                        errors.push(`Linha ${lineNum}: Escola "${schoolName}" não encontrada no sistema.`);
                        return;
                    }

                    if (!studentName) {
                        errors.push(`Linha ${lineNum}: Nome do estudante ausente.`);
                        return;
                    }

                    if (isNaN(year)) {
                        errors.push(`Linha ${lineNum}: Ano inválido.`);
                        return;
                    }

                    if (!tipoAvaliacao || !['DIAGNÓSTICA', 'FORMATIVA', 'SOMATIVA'].includes(tipoAvaliacao)) {
                        errors.push(`Linha ${lineNum}: Tipo de avaliação inválida ("${tipoAvaliacao}"). Use DIAGNÓSTICA, FORMATIVA ou SOMATIVA.`);
                        return;
                    }

                    let updatedEscola = schoolsToUpdate.get(escola.id) || JSON.parse(JSON.stringify(escola));
                    
                    if (!updatedEscola.dadosEducacionais.registrosFluenciaSamahc) {
                        updatedEscola.dadosEducacionais.registrosFluenciaSamahc = [];
                    }

                    const newRecord: RegistroFluenciaSAMAHC = {
                        id: generateUUID(),
                        escolaId: escola.id,
                        polo: row['PÓLO'] || '',
                        ano: year,
                        estudanteNome: studentName.toString().toUpperCase().trim(),
                        anoSerie: row['ANO/SÉRIE'] || '',
                        nivelDesempenho: performanceLevel?.toString().toUpperCase().trim() || 'NÃO INFORMADO',
                        turno: turno || '',
                        tipoAvaliacao: tipoAvaliacao as any,
                        turma: row['TURMA DE MATRÍCULA'] || '',
                        etapa: row['ETAPA'] || '',
                        createdAt: new Date().toISOString()
                    };

                    updatedEscola.dadosEducacionais.registrosFluenciaSamahc.push(newRecord);
                    schoolsToUpdate.set(escola.id, updatedEscola);
                    successCount++;
                });

                if (successCount === 0 && errors.length > 0) {
                    showNotification('error', `Falha na importação: ${errors[0]}`);
                    return;
                }

                // Instead of processing directly, set pending data for preview
                setPendingImportData({
                    schoolsToUpdate,
                    successCount,
                    errors
                });
                setShowImportPreview(true);

                // Reset file input
                if (event.target) event.target.value = '';

            } catch (error) {
                console.error('Error importing Fluency:', error);
                showNotification('error', 'Erro ao importar arquivo. Verifique se é um CSV ou Excel válido.');
            }
        };

        if (isExcel) {
            reader.readAsBinaryString(file);
        } else {
            reader.readAsText(file);
        }
    };

    const handleConfirmImport = () => {
        if (!pendingImportData) return;

        const { schoolsToUpdate, successCount, errors } = pendingImportData;

        // Calculate percentages and update each school
        schoolsToUpdate.forEach(updatedEscola => {
            const regs = updatedEscola.dadosEducacionais.registrosFluenciaSamahc || [];
            const currentYear = new Date().getFullYear();
            const currentYearRegs = regs.filter((r: RegistroFluenciaSAMAHC) => (r.ano === currentYear || r.ano === currentYear - 1));
            
            if (currentYearRegs.length > 0) {
                const total = currentYearRegs.length;
                const fluentes = currentYearRegs.filter((r: RegistroFluenciaSAMAHC) => {
                    const n = (r.nivelDesempenho || '').toUpperCase();
                    return n.includes('FLUENTE') || n.includes('COM FLUÊNCIA') || n.includes('INICIANTE');
                }).length;
                
                const perc = Number(((fluentes / total) * 100).toFixed(1));
                
                if (!updatedEscola.dadosEducacionais.dadosSamahc) {
                    updatedEscola.dadosEducacionais.dadosSamahc = { 
                        simuladoSeama: 0, 
                        simuladoSaeb: 0, 
                        fluencia: 0, 
                        linguaPortuguesa: 0, 
                        matematica: 0 
                    };
                }
                updatedEscola.dadosEducacionais.dadosSamahc.fluencia = perc;
            }
            
            onUpdateEscola(updatedEscola);
        });

        if (errors.length > 0) {
            showNotification('warning', `Importado com ressalvas: ${successCount} sucessos, ${errors.length} erros. Verifique os dados.`);
        } else {
            showNotification('success', `${successCount} registros importados com sucesso em ${schoolsToUpdate.size} escolas!`);
        }

        setShowImportPreview(false);
        setPendingImportData(null);
    };

    const renderImportPreview = () => {
        if (!pendingImportData) return null;

        const { schoolsToUpdate, errors } = pendingImportData;
        const allRecords: RegistroFluenciaSAMAHC[] = [];
        schoolsToUpdate.forEach(escola => {
            // Only get the new records we just added (they don't have a backend ID yet if it were a real push, but here we generate UUIDs)
            // Actually, we replaced the whole array in the clone, so we should be careful.
            // But for preview, let's just show some of the data.
            allRecords.push(...(escola.dadosEducacionais.registrosFluenciaSamahc || []).slice(-10)); // Show last 10 per school for preview
        });

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <Activity className="w-6 h-6 text-brand-orange" />
                                PRÉ-VISUALIZAÇÃO DA IMPORTAÇÃO
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Confira os dados antes de confirmar a gravação no sistema
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => { setShowImportPreview(false); setPendingImportData(null); }}
                                className="px-6 py-2.5 rounded-xl text-xs font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmImport}
                                className="px-8 py-2.5 rounded-xl text-xs font-black bg-brand-orange text-white shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
                            >
                                Confirmar Importação
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-6 space-y-6">
                        {errors.length > 0 && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                                <h3 className="text-sm font-black text-red-700 flex items-center gap-2 mb-2 uppercase tracking-tight">
                                    <Activity className="w-4 h-4 text-red-500" />
                                    Inconsistências Encontradas ({errors.length})
                                </h3>
                                <ul className="text-xs font-bold text-red-500 space-y-1 list-disc pl-4 max-h-32 overflow-auto">
                                    {errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                                    {errors.length > 10 && <li>E mais {errors.length - 10} erros...</li>}
                                </ul>
                            </div>
                        )}

                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="px-4 py-3">Escola</th>
                                        <th className="px-4 py-3">Ano</th>
                                        <th className="px-4 py-4">Estudante</th>
                                        <th className="px-4 py-3">Série</th>
                                        <th className="px-4 py-3">Turno</th>
                                        <th className="px-4 py-3">Avaliação</th>
                                        <th className="px-4 py-3">Nível</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {allRecords.slice(0, 50).map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 text-xs font-bold text-slate-600 truncate max-w-[200px]">
                                                {escolas.find(e => e.id === r.escolaId)?.nome}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-bold text-slate-500">{r.ano}</td>
                                            <td className="px-4 py-3 text-xs font-bold text-slate-800">{r.estudanteNome}</td>
                                            <td className="px-4 py-3 text-xs font-bold text-slate-600">{r.anoSerie}</td>
                                            <td className="px-4 py-3 text-xs">
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[9px] uppercase">
                                                    {r.turno}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                                    r.tipoAvaliacao === 'DIAGNÓSTICA' ? 'bg-blue-100 text-blue-600' :
                                                    r.tipoAvaliacao === 'FORMATIVA' ? 'bg-emerald-100 text-emerald-600' :
                                                    'bg-amber-100 text-amber-600'
                                                }`}>
                                                    {r.tipoAvaliacao}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-bold text-brand-orange">{r.nivelDesempenho}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {allRecords.length > 50 && (
                                <div className="p-3 bg-slate-50 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Exibindo 50 de {allRecords.length} registros
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleSchoolClick = (escola: Escola) => {
        if (activeTab === 'PARC') {
            setSelectedSchoolForParc(escola);
            setShowParcModal(true);
        } else if (activeTab === 'CNCA') {
            setSelectedSchoolForCnca(escola);
            setShowCncaModal(true);
        } else if (activeTab === 'SEAMA') {
            setSelectedSchoolForSeama(escola);
            setShowSeamaModal(true);
        } else if (activeTab === 'SAEB') {
            setSelectedSchoolForSaeb(escola);
            setShowSaebModal(true);
        } else if (activeTab === 'IDEB') {
            setSelectedSchoolForIdeb(escola);
            setShowIdebModal(true);
        }
    };

    const calculateConsolidatedParc = (registros: RegistroFluenciaPARC[]) => {
        const saidaRecords = (registros || []).filter(r => r.edicao === 'Saída');
        if (saidaRecords.length === 0) return 0;
        const maxYear = Math.max(...saidaRecords.map(r => r.ano));
        const recentSaida = saidaRecords.filter(r => r.ano === maxYear);
        const totalAlfabetizados = recentSaida.reduce((acc, r) => acc + (Number(r.classificacao.leitorIniciante) || 0) + (Number(r.classificacao.leitorFluente) || 0), 0);
        const totalPresentes = recentSaida.reduce((acc, r) => acc + (Number(r.participacao.presentes) || 0), 0);
        return totalPresentes > 0 ? Number(((totalAlfabetizados / totalPresentes) * 100).toFixed(1)) : 0;
    };

    const handleSaveParc = (registro: Omit<RegistroFluenciaPARC, 'id' | 'escolaId' | 'dataRegistro' | 'responsavel'> & { id?: string }) => {
        if (!selectedSchoolForParc) return;
        let novosRegistros = [...(selectedSchoolForParc.dadosEducacionais.registrosFluenciaParc || [])];
        if (registro.id) {
            novosRegistros = novosRegistros.map(r => r.id === registro.id ? { ...r, ...registro, id: r.id, escolaId: r.escolaId, dataRegistro: new Date().toISOString(), responsavel: r.responsavel } as RegistroFluenciaPARC : r);
        } else {
            const novoRegistro: RegistroFluenciaPARC = { ...(registro as any), id: generateUUID(), escolaId: selectedSchoolForParc.id, dataRegistro: new Date().toISOString(), responsavel: 'Coordenador Regional' };
            novosRegistros.push(novoRegistro);
        }
        const lastParcValue = calculateConsolidatedParc(novosRegistros);
        const escolaAtualizada: Escola = { ...selectedSchoolForParc, dadosEducacionais: { ...selectedSchoolForParc.dadosEducacionais, registrosFluenciaParc: novosRegistros, fluenciaLeitoraDetalhada: { ...selectedSchoolForParc.dadosEducacionais.fluenciaLeitoraDetalhada, parc: lastParcValue } } };
        onUpdateEscola(escolaAtualizada);
    };

    const handleSaveCnca = (registro: Omit<RegistroCNCA, 'id' | 'escolaId' | 'dataRegistro' | 'responsavel'> & { id?: string }) => {
        if (!selectedSchoolForCnca) return;
        let novosRegistros = [...(selectedSchoolForCnca.dadosEducacionais.registrosCNCA || [])];
        if (registro.id) {
            novosRegistros = novosRegistros.map(r => r.id === registro.id ? { ...r, ...registro, id: r.id, escolaId: r.escolaId, dataRegistro: new Date().toISOString(), responsavel: r.responsavel } as RegistroCNCA : r);
        } else {
            const novoRegistro: RegistroCNCA = { ...(registro as any), id: generateUUID(), escolaId: selectedSchoolForCnca.id, dataRegistro: new Date().toISOString(), responsavel: 'Coordenador Regional' };
            novosRegistros.push(novoRegistro);
        }
        const getMedia = (tipo: 'Diagnóstica' | 'Formativa' | 'Somativa') => {
            const regs = novosRegistros.filter((r: RegistroCNCA) => r.tipoAvaliacao === tipo);
            if (regs.length === 0) return 0;
            const sum = regs.reduce((acc: number, r: RegistroCNCA) => acc + r.aprendizadoAdequado, 0);
            return Number((sum / regs.length).toFixed(1));
        };
        const escolaAtualizada: Escola = { ...selectedSchoolForCnca, dadosEducacionais: { ...selectedSchoolForCnca.dadosEducacionais, registrosCNCA: novosRegistros, resultadosCNCA: { diagnostica: getMedia('Diagnóstica'), formativa: getMedia('Formativa'), somativa: getMedia('Somativa') } } };
        onUpdateEscola(escolaAtualizada);
        setSelectedSchoolForCnca(escolaAtualizada);
    };

    const handleDeleteCnca = (id: string) => {
        if (!selectedSchoolForCnca) return;
        const novosRegistros = (selectedSchoolForCnca.dadosEducacionais.registrosCNCA || []).filter((r: RegistroCNCA) => r.id !== id);
        const getMedia = (tipo: 'Diagnóstica' | 'Formativa' | 'Somativa') => {
            const regs = novosRegistros.filter((r: RegistroCNCA) => r.tipoAvaliacao === tipo);
            if (regs.length === 0) return 0;
            const sum = regs.reduce((acc: number, r: RegistroCNCA) => acc + r.aprendizadoAdequado, 0);
            return Number((sum / regs.length).toFixed(1));
        };
        const escolaAtualizada: Escola = { ...selectedSchoolForCnca, dadosEducacionais: { ...selectedSchoolForCnca.dadosEducacionais, registrosCNCA: novosRegistros, resultadosCNCA: { diagnostica: getMedia('Diagnóstica'), formativa: getMedia('Formativa'), somativa: getMedia('Somativa') } } };
        onUpdateEscola(escolaAtualizada);
        setSelectedSchoolForCnca(escolaAtualizada);
    };

    const handleDeleteParc = (id: string) => {
        if (!selectedSchoolForParc) return;
        const novosRegistros = (selectedSchoolForParc.dadosEducacionais.registrosFluenciaParc || []).filter((r: RegistroFluenciaPARC) => r.id !== id);
        const lastParcValue = calculateConsolidatedParc(novosRegistros);
        const escolaAtualizada: Escola = { ...selectedSchoolForParc, dadosEducacionais: { ...selectedSchoolForParc.dadosEducacionais, registrosFluenciaParc: novosRegistros, fluenciaLeitoraDetalhada: { ...selectedSchoolForParc.dadosEducacionais.fluenciaLeitoraDetalhada, parc: lastParcValue } } };
        onUpdateEscola(escolaAtualizada);
    };

    const handleSaveSeama = (registro: Omit<RegistroSEAMA, 'id' | 'escolaId' | 'dataRegistro' | 'responsavel'> & { id?: string }) => {
        if (!selectedSchoolForSeama) return;
        let novosRegistros = [...(selectedSchoolForSeama.dadosEducacionais.registrosSEAMA || [])];
        if (registro.id) {
            novosRegistros = novosRegistros.map(r => r.id === registro.id ? { ...r, ...registro, id: r.id, escolaId: r.escolaId, dataRegistro: new Date().toISOString(), responsavel: r.responsavel } as RegistroSEAMA : r);
        } else {
            const novoRegistro: RegistroSEAMA = { ...(registro as any), id: generateUUID(), escolaId: selectedSchoolForSeama.id, dataRegistro: new Date().toISOString(), responsavel: 'Coordenador Regional' };
            novosRegistros.push(novoRegistro);
        }
        const calculateSeamaScore = (regs: RegistroSEAMA[]) => {
            if (regs.length === 0) return 0;
            const sum = regs.reduce((acc: number, r: RegistroSEAMA) => acc + (r.adequado + r.avançado), 0);
            return Number((sum / regs.length).toFixed(1));
        };
        const escolaAtualizada: Escola = { ...selectedSchoolForSeama, dadosEducacionais: { ...selectedSchoolForSeama.dadosEducacionais, registrosSEAMA: novosRegistros, avaliacoesExternas: { ...selectedSchoolForSeama.dadosEducacionais.avaliacoesExternas, seama: calculateSeamaScore(novosRegistros) } } };
        onUpdateEscola(escolaAtualizada);
        setSelectedSchoolForSeama(escolaAtualizada);
    };

    const handleDeleteSeama = (id: string) => {
        if (!selectedSchoolForSeama) return;
        const novosRegistros = (selectedSchoolForSeama.dadosEducacionais.registrosSEAMA || []).filter((r: RegistroSEAMA) => r.id !== id);
        const calculateSeamaScore = (regs: RegistroSEAMA[]) => {
            if (regs.length === 0) return 0;
            const sum = regs.reduce((acc: number, r: RegistroSEAMA) => acc + (r.adequado + r.avançado), 0);
            return Number((sum / regs.length).toFixed(1));
        };
        const escolaAtualizada: Escola = { ...selectedSchoolForSeama, dadosEducacionais: { ...selectedSchoolForSeama.dadosEducacionais, registrosSEAMA: novosRegistros, avaliacoesExternas: { ...selectedSchoolForSeama.dadosEducacionais.avaliacoesExternas, seama: calculateSeamaScore(novosRegistros) } } };
        onUpdateEscola(escolaAtualizada);
        setSelectedSchoolForSeama(escolaAtualizada);
    };

    const handleSaveSaeb = (registro: Omit<RegistroSAEB, 'id' | 'escolaId' | 'dataRegistro' | 'responsavel'> & { id?: string }) => {
        if (!selectedSchoolForSaeb) return;
        let novosRegistros = [...(selectedSchoolForSaeb.dadosEducacionais.registrosSAEB || [])];
        if (registro.id) {
            novosRegistros = novosRegistros.map(r => r.id === registro.id ? { ...r, ...registro, id: r.id, escolaId: r.escolaId, dataRegistro: new Date().toISOString(), responsavel: r.responsavel } as RegistroSAEB : r);
        } else {
            const novoRegistro: RegistroSAEB = { ...(registro as any), id: generateUUID(), escolaId: selectedSchoolForSaeb.id, dataRegistro: new Date().toISOString(), responsavel: 'Coordenador Regional' };
            novosRegistros.push(novoRegistro);
        }
        const calculateSaebScore = (regs: RegistroSAEB[]) => {
            if (regs.length === 0) return 0;
            const latest = [...regs].sort((a, b) => b.ano - a.ano)[0];
            return latest.notaSaeb || 0;
        };
        const escolaAtualizada: Escola = { ...selectedSchoolForSaeb, dadosEducacionais: { ...selectedSchoolForSaeb.dadosEducacionais, registrosSAEB: novosRegistros, avaliacoesExternas: { ...selectedSchoolForSaeb.dadosEducacionais.avaliacoesExternas, saeb: calculateSaebScore(novosRegistros) } } };
        onUpdateEscola(escolaAtualizada);
        setSelectedSchoolForSaeb(escolaAtualizada);
    };

    const handleDeleteSaeb = (id: string) => {
        if (!selectedSchoolForSaeb) return;
        const novosRegistros = (selectedSchoolForSaeb.dadosEducacionais.registrosSAEB || []).filter((r: RegistroSAEB) => r.id !== id);
        const calculateSaebScore = (regs: RegistroSAEB[]) => {
            if (regs.length === 0) return 0;
            const latest = [...regs].sort((a, b) => b.ano - a.ano)[0];
            return latest ? (latest.notaSaeb || 0) : 0;
        };
        const escolaAtualizada: Escola = { ...selectedSchoolForSaeb, dadosEducacionais: { ...selectedSchoolForSaeb.dadosEducacionais, registrosSAEB: novosRegistros, avaliacoesExternas: { ...selectedSchoolForSaeb.dadosEducacionais.avaliacoesExternas, saeb: calculateSaebScore(novosRegistros) } } };
        onUpdateEscola(escolaAtualizada);
        setSelectedSchoolForSaeb(escolaAtualizada);
    };

    const handleSaveIdeb = (registro: Omit<RegistroIDEB, 'id' | 'escolaId' | 'dataRegistro' | 'responsavel'> & { id?: string }) => {
        if (!selectedSchoolForIdeb) return;
        let novosRegistros = [...(selectedSchoolForIdeb.dadosEducacionais.registrosIDEB || [])];
        if (registro.id) {
            novosRegistros = novosRegistros.map(r => r.id === registro.id ? { ...r, ...registro, id: r.id, escolaId: r.escolaId, dataRegistro: new Date().toISOString(), responsavel: r.responsavel } as RegistroIDEB : r);
        } else {
            const novoRegistro: RegistroIDEB = { ...(registro as any), id: generateUUID(), escolaId: selectedSchoolForIdeb.id, dataRegistro: new Date().toISOString(), responsavel: 'Coordenador Regional' };
            novosRegistros.push(novoRegistro);
        }

        // Update main IDEB Indicator with the latest Anos Iniciais (or highest of both)
        const calculateIdebScore = (regs: RegistroIDEB[]) => {
            if (regs.length === 0) return 0;
            const latest = [...regs].sort((a, b) => b.ano - a.ano)[0];
            return Number(Math.max(latest.anosIniciais, latest.anosFinais).toFixed(1));
        };

        const escolaAtualizada: Escola = { ...selectedSchoolForIdeb, dadosEducacionais: { ...selectedSchoolForIdeb.dadosEducacionais, registrosIDEB: novosRegistros, avaliacoesExternas: { ...selectedSchoolForIdeb.dadosEducacionais.avaliacoesExternas, ideb: calculateIdebScore(novosRegistros) } } };
        onUpdateEscola(escolaAtualizada);
        setSelectedSchoolForIdeb(escolaAtualizada);
    };

    const handleDeleteIdeb = (id: string) => {
        if (!selectedSchoolForIdeb) return;
        const novosRegistros = (selectedSchoolForIdeb.dadosEducacionais.registrosIDEB || []).filter((r: RegistroIDEB) => r.id !== id);

        const calculateIdebScore = (regs: RegistroIDEB[]) => {
            if (regs.length === 0) return 0;
            const latest = [...regs].sort((a, b) => b.ano - a.ano)[0];
            return Number(Math.max(latest.anosIniciais, latest.anosFinais).toFixed(1));
        };

        const escolaAtualizada: Escola = { ...selectedSchoolForIdeb, dadosEducacionais: { ...selectedSchoolForIdeb.dadosEducacionais, registrosIDEB: novosRegistros, avaliacoesExternas: { ...selectedSchoolForIdeb.dadosEducacionais.avaliacoesExternas, ideb: calculateIdebScore(novosRegistros) } } };
        onUpdateEscola(escolaAtualizada);
        setSelectedSchoolForIdeb(escolaAtualizada);
    };

    const renderTabContent = () => {
        return (
            <div className="overflow-x-auto bg-white">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b-2 border-brand-black">
                        <tr className="text-[9px] font-black text-brand-grey uppercase tracking-widest">
                            <th className="px-6 py-4">Unidade Escolar</th>
                            {activeTab === 'CENSO' && (
                                <>
                                    <th className="px-4 py-4 text-center">Matrícula Total</th>
                                    <th className="px-4 py-4 text-center">Docentes</th>
                                    <th className="px-4 py-4 text-center">Turmas</th>
                                </>
                            )}
                            {activeTab === 'SAMAHC' && (
                                <th className="px-4 py-4 text-center bg-brand-orange/5">
                                    {samahcSubTab === 'SEAMA' && 'Simulado SEAMA'}
                                    {samahcSubTab === 'SAEB' && 'Simulado SAEB'}
                                    {samahcSubTab === 'FLUENCIA' && 'Fluência (%)'}
                                    {samahcSubTab === 'PORTUGUES' && 'Língua Portuguesa'}
                                    {samahcSubTab === 'MATEMATICA' && 'Matemática'}
                                </th>
                            )}
                            {activeTab === 'PARC' && <th className="px-4 py-4 text-center bg-brand-orange/5 text-brand-orange">Último PARC (%)</th>}
                            {activeTab === 'SAEB' && (
                                <>
                                    <th className="px-4 py-4 text-center">SAEB (5º ANO)</th>
                                    <th className="px-4 py-4 text-center">SAEB (9º ANO)</th>
                                </>
                            )}
                            {activeTab === 'IDEB' && <th className="px-4 py-4 text-center">IDEB Rank</th>}
                            {activeTab === 'SEAMA' && (
                                <>
                                    <th className="px-2 py-4 text-center bg-indigo-50/50 text-indigo-900 border-r border-indigo-100">2º LP</th>
                                    <th className="px-2 py-4 text-center bg-indigo-50/50 text-indigo-900 border-r border-slate-200">2º MAT</th>
                                    <th className="px-2 py-4 text-center bg-emerald-50/50 text-emerald-900 border-r border-emerald-100">5º LP</th>
                                    <th className="px-2 py-4 text-center bg-emerald-50/50 text-emerald-900 border-r border-slate-200">5º MAT</th>
                                    <th className="px-2 py-4 text-center bg-amber-50/50 text-amber-900 border-r border-amber-100">9º LP</th>
                                    <th className="px-2 py-4 text-center bg-amber-50/50 text-amber-900">9º MAT</th>
                                </>
                            )}
                            {activeTab === 'CNCA' && (
                                <>
                                    <th className="px-4 py-4 text-center">Diagnóstica (%)</th>
                                    <th className="px-4 py-4 text-center">Formativa (%)</th>
                                    <th className="px-4 py-4 text-center bg-brand-acid/10">Somativa (%)</th>
                                </>
                            )}
                            {activeTab === 'EI' && <th className="px-4 py-4 text-center text-brand-acid bg-slate-900">Desenv. EI (%)</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-black/10">
                        {filteredEscolas.map((escola) => (
                            <tr
                                key={escola.id}
                                className={`group hover:bg-slate-50 transition-all text-xs uppercase ${(activeTab === 'PARC' || activeTab === 'CNCA' || activeTab === 'SEAMA' || activeTab === 'SAEB' || activeTab === 'IDEB') ? 'cursor-pointer' : ''}`}
                                onClick={() => handleSchoolClick(escola)}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-black text-brand-black text-sm">{escola.nome}</span>
                                        {(activeTab === 'PARC' || activeTab === 'CNCA' || activeTab === 'SEAMA' || activeTab === 'SAEB' || activeTab === 'IDEB') && (
                                            <span className="text-[8px] font-black text-brand-orange mt-1 flex items-center gap-1 group-hover:translate-x-1 transition-all uppercase tracking-widest">
                                                Inserir Dados <ChevronRight className="w-2 h-2" strokeWidth={4} />
                                            </span>
                                        )}
                                    </div>
                                </td>
                                {activeTab === 'CENSO' && (() => {
                                    const stats = calculateCensoStats(escola);
                                    return (
                                        <>
                                            <td className="px-4 py-4 text-center font-black text-brand-black">{stats.matricula}</td>
                                            <td className="px-4 py-4 text-center">{stats.docentes}</td>
                                            <td className="px-4 py-4 text-center">{stats.turmas}</td>
                                        </>
                                    );
                                })()}
                                {activeTab === 'SAMAHC' && (
                                    <td className="px-4 py-5 text-center font-black text-brand-orange text-sm">
                                        {samahcSubTab === 'SEAMA' && (escola.dadosEducacionais?.dadosSamahc?.simuladoSeama || 0)}
                                        {samahcSubTab === 'SAEB' && (escola.dadosEducacionais?.dadosSamahc?.simuladoSaeb || 0)}
                                        {samahcSubTab === 'FLUENCIA' && (escola.dadosEducacionais?.dadosSamahc?.fluencia || 0) + '%'}
                                        {samahcSubTab === 'PORTUGUES' && (escola.dadosEducacionais?.dadosSamahc?.linguaPortuguesa || 0)}
                                        {samahcSubTab === 'MATEMATICA' && (escola.dadosEducacionais?.dadosSamahc?.matematica || 0)}
                                    </td>
                                )}
                                {activeTab === 'PARC' && (
                                    <td className="px-4 py-5 text-center font-black text-brand-orange text-sm">
                                        {escola.dadosEducacionais?.fluenciaLeitoraDetalhada?.parc || 0}%
                                    </td>
                                )}
                                {activeTab === 'SAEB' && (
                                    <>
                                        {(() => {
                                            const regs = escola.dadosEducacionais?.registrosSAEB || [];
                                            const getScore = (serie: string) => {
                                                const specificRegs = regs.filter((r: RegistroSAEB) => r.anoSerie === serie);
                                                if (specificRegs.length === 0) return '-';
                                                const latest = specificRegs.sort((a: RegistroSAEB, b: RegistroSAEB) => b.ano - a.ano)[0];
                                                return latest.notaSaeb || '-';
                                            };
                                            return (
                                                <>
                                                    <td className="px-4 py-5 text-center font-black text-slate-900 bg-slate-50/50 border-r border-slate-200">
                                                        {getScore('5º ANO')}
                                                    </td>
                                                    <td className="px-4 py-5 text-center font-black text-slate-900 bg-slate-50/50">
                                                        {getScore('9º ANO')}
                                                    </td>
                                                </>
                                            );
                                        })()}
                                    </>
                                )}
                                {activeTab === 'IDEB' && (
                                    <td className="px-4 py-5 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {(() => {
                                                const regs = escola.dadosEducacionais?.registrosIDEB || [];
                                                const latest = [...regs].sort((a, b) => b.ano - a.ano)[0];
                                                if (!latest) return <span className="text-slate-300">-</span>;
                                                return (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] text-slate-400 font-bold w-4 text-right">AI</span>
                                                            <span className={`inline-flex px-2 py-0.5 font-black text-xs border rounded ${latest.anosIniciais >= 4.5 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                                {latest.anosIniciais > 0 ? latest.anosIniciais.toFixed(1) : '-'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] text-slate-400 font-bold w-4 text-right">AF</span>
                                                            <span className={`inline-flex px-2 py-0.5 font-black text-xs border rounded ${latest.anosFinais >= 4.5 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                                {latest.anosFinais > 0 ? latest.anosFinais.toFixed(1) : '-'}
                                                            </span>
                                                        </div>
                                                        <span className="text-[8px] text-slate-400 mt-1 font-bold">{latest.ano}</span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                )}
                                {activeTab === 'SEAMA' && (
                                    <>
                                        {(() => {
                                            const regs = escola.dadosEducacionais?.registrosSEAMA || [];

                                            // Helper to get value for specific grade and subject
                                            const getItem = (serie: string, comp: string) => {
                                                // Filter records for this series and component
                                                const specificRegs = regs.filter((r: RegistroSEAMA) => r.anoSerie === serie && r.componenteCurricular === comp);
                                                if (specificRegs.length === 0) return '-';

                                                // Get the latest one (by year)
                                                const latest = specificRegs.sort((a: RegistroSEAMA, b: RegistroSEAMA) => b.ano - a.ano)[0];
                                                return latest.proficienciaMedia || '-';
                                            };

                                            return (
                                                <>
                                                    <td className="px-2 py-5 text-center font-bold text-slate-700 bg-indigo-50/10 border-r border-indigo-50">{getItem('2º ANO', 'Língua Portuguesa')}</td>
                                                    <td className="px-2 py-5 text-center font-bold text-slate-700 bg-indigo-50/10 border-r border-slate-200">{getItem('2º ANO', 'Matemática')}</td>

                                                    <td className="px-2 py-5 text-center font-bold text-slate-700 bg-emerald-50/10 border-r border-emerald-50">{getItem('5º ANO', 'Língua Portuguesa')}</td>
                                                    <td className="px-2 py-5 text-center font-bold text-slate-700 bg-emerald-50/10 border-r border-slate-200">{getItem('5º ANO', 'Matemática')}</td>

                                                    <td className="px-2 py-5 text-center font-bold text-slate-700 bg-amber-50/10 border-r border-amber-50">{getItem('9º ANO', 'Língua Portuguesa')}</td>
                                                    <td className="px-2 py-5 text-center font-bold text-slate-700 bg-amber-50/10">{getItem('9º ANO', 'Matemática')}</td>
                                                </>
                                            );
                                        })()}
                                    </>
                                )}
                                {activeTab === 'CNCA' && (
                                    <>
                                        <td className="px-4 py-5 text-center">{escola.dadosEducacionais?.resultadosCNCA?.diagnostica || 0}%</td>
                                        <td className="px-4 py-5 text-center">{escola.dadosEducacionais?.resultadosCNCA?.formativa || 0}%</td>
                                        <td className="px-4 py-5 text-center font-black text-brand-orange bg-brand-orange/5">{escola.dadosEducacionais?.resultadosCNCA?.somativa || 0}%</td>
                                    </>
                                )}
                                {activeTab === 'EI' && (
                                    <td className="px-4 py-5 text-center font-black text-brand-acid bg-slate-900 border-l border-brand-acid/20">
                                        {escola.dadosEducacionais?.relatorioEI?.desenvolvimento || 0}%
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div >
        );
    };


    const calculateCensoStats = (escola: Escola) => {
        let matricula = 0;
        let turmas = 0;
        const det = escola.dadosEducacionais?.matriculaDetalhada;

        if (det) {
            // Helper to sum counts
            const sumNivel = (nivel: any) => {
                if (!nivel) return;
                matricula += (nivel.alunos?.integral || 0) + (nivel.alunos?.manha || 0) + (nivel.alunos?.tarde || 0) + (nivel.alunos?.noite || 0);
                turmas += (nivel.turmas?.integral || 0) + (nivel.turmas?.manha || 0) + (nivel.turmas?.tarde || 0) + (nivel.turmas?.noite || 0);
            };

            // Sum keys for Infantil
            if (det.infantil) Object.values(det.infantil).forEach(sumNivel);
            // Sum keys for Fundamental
            if (det.fundamental) Object.values(det.fundamental).forEach(sumNivel);
        }

        // Fallbacks
        if (matricula === 0 && escola.dadosEducacionais?.matricula) {
            const m = escola.dadosEducacionais.matricula;
            matricula = (m.infantil || 0) + (m.anosIniciais || 0) + (m.anosFinais || 0) + (m.eja || 0);
        }
        if (matricula === 0) matricula = escola.alunosMatriculados || 0;

        if (turmas === 0 && escola.dadosEducacionais?.turmas) {
            const t = escola.dadosEducacionais.turmas;
            turmas = (t.manha || 0) + (t.tarde || 0) + (t.noite || 0);
        }

        // Docentes count
        const docentes = (escola.recursosHumanos || []).filter((rh: RecursoHumano) =>
            rh.funcao.toLowerCase().includes('professor') ||
            rh.funcao.toLowerCase().includes('docente')
        ).length;

        // If no explicit 'docente' role found but there are RH entries, maybe check if they are allocated to classes?
        // User said "informado em recursos humanos e turmas".
        // If 0, fallback to censoEscolar.docentes just in case
        const finalDocentes = docentes > 0 ? docentes : (escola.dadosEducacionais?.censoEscolar?.docentes || 0);

        return { matricula, turmas, docentes: finalDocentes };
    };

    return (
        <div className="space-y-6 pb-12 animate-fade-in relative">
            <PageHeader
                title="Matriz de Indicadores"
                subtitle="Monitoramento Institucional e Desempenho"
                icon={Activity}
                badgeText="Metas e Resultados"
                actions={[
                    { label: 'Exportar Dados', icon: Download, onClick: handleExport, variant: 'secondary' }
                ]}
            />
            <div className="flex p-1 bg-slate-100 rounded-xl w-fit mb-8 shadow-inner border border-slate-200">
                <button
                    onClick={() => setMainTab('CADASTRO')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mainTab === 'CADASTRO' ? 'bg-white text-orange-600 shadow-md translate-y-[-1px]' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <Settings className={`w-4 h-4 ${mainTab === 'CADASTRO' ? 'text-orange-500' : 'text-slate-400'}`} />
                    Cadastro de Indicadores
                </button>
                <button
                    onClick={() => setMainTab('ANALISE')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mainTab === 'ANALISE' ? 'bg-white text-orange-600 shadow-md translate-y-[-1px]' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <PieChart className={`w-4 h-4 ${mainTab === 'ANALISE' ? 'text-orange-500' : 'text-slate-400'}`} />
                    Análise de Indicadores
                </button>
            </div>

            {mainTab === 'CADASTRO' ? (
                <>
                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar unidade escolar..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                        />
                    </div>

                    {activeTab === 'SAMAHC' && (
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div className="flex flex-wrap gap-2 animate-fade-in">
                                {['FLUENCIA', 'SEAMA', 'SAEB', 'PORTUGUES', 'MATEMATICA'].map((st) => (
                                    <button
                                        key={st}
                                        onClick={() => setSamahcSubTab(st as any)}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${samahcSubTab === st ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>

                            {samahcSubTab === 'FLUENCIA' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <Download className="w-3.5 h-3.5 text-orange-500" />
                                        Baixar Modelo
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-all shadow-md shadow-orange-500/20"
                                    >
                                        <Activity className="w-3.5 h-3.5" />
                                        Importar Fluência
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImportFluencia}
                                        className="hidden"
                                        accept=".csv, .xlsx, .xls"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div>
                            <div className="flex overflow-x-auto p-1 bg-slate-50/50 border-b border-slate-100">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${isActive ? 'border-orange-500 text-orange-600 bg-orange-50/10' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {renderTabContent()}
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-3 mb-4">
                        {[
                            { id: 'PARC', label: 'Análise PARC', icon: BookOpen },
                            { id: 'SEAMA', label: 'Análise SEAMA', icon: GraduationCap },
                            { id: 'CNCA', label: 'Análise CNCA/PNRA', icon: Layout },
                            { id: 'SAEB', label: 'Análise SAEB', icon: Target },
                            { id: 'SAMAHC_FLUENCIA', label: 'SAMAHC Fluência', icon: BarChart3 },
                            { id: 'SAMAHC_SEAMA', label: 'SAMAHC SEAMA', icon: BarChart3 },
                            { id: 'SAMAHC_SAEB', label: 'SAMAHC SAEB', icon: BarChart3 },
                            { id: 'SAMAHC_PORTUGUES', label: 'SAMAHC Português', icon: BarChart3 },
                            { id: 'SAMAHC_MATEMATICA', label: 'SAMAHC Matemática', icon: BarChart3 },
                        ].map((analysis) => (
                            <button
                                key={analysis.id}
                                onClick={() => setActiveAnalysis(analysis.id as any)}
                                className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-2 ${activeAnalysis === analysis.id
                                        ? 'bg-slate-900 text-white border-brand-orange shadow-lg scale-[1.02]'
                                        : 'bg-white text-slate-400 border-slate-100 hover:border-brand-orange/30 hover:text-slate-600'
                                    }`}
                            >
                                <analysis.icon className={`w-4 h-4 ${activeAnalysis === analysis.id ? 'text-brand-orange' : ''}`} />
                                {analysis.label}
                            </button>
                        ))}
                    </div>

                    <div className="animate-fade-in bg-slate-50/30 rounded-3xl p-4 border border-slate-100">
                        {activeAnalysis === 'PARC' && <FluenciaParcDashboard escolas={escolas} coordenadores={coordenadores} onUpdateEscola={onUpdateEscola} />}
                        {activeAnalysis === 'CNCA' && <CncaPnraDashboard escolas={escolas} coordenadores={coordenadores} onUpdateEscola={onUpdateEscola} />}
                        {activeAnalysis === 'SEAMA' && <SeamaDashboard escolas={escolas} coordenadores={coordenadores} onUpdateEscola={onUpdateEscola} />}
                        {activeAnalysis === 'SAEB' && <SaebDashboard escolas={escolas} coordenadores={coordenadores} onUpdateEscola={onUpdateEscola} />}
                        {activeAnalysis === 'SAMAHC_FLUENCIA' && <SamahcDashboard escolas={escolas} coordenadores={coordenadores} onUpdateEscola={onUpdateEscola} samahcSubIndicator="FLUENCIA" />}
                        {activeAnalysis === 'SAMAHC_SEAMA' && <SamahcDashboard escolas={escolas} coordenadores={coordenadores} onUpdateEscola={onUpdateEscola} samahcSubIndicator="SEAMA" />}
                        {activeAnalysis === 'SAMAHC_SAEB' && <SamahcDashboard escolas={escolas} coordenadores={coordenadores} onUpdateEscola={onUpdateEscola} samahcSubIndicator="SAEB" />}
                        {activeAnalysis === 'SAMAHC_PORTUGUES' && <SamahcDashboard escolas={escolas} coordenadores={coordenadores} onUpdateEscola={onUpdateEscola} samahcSubIndicator="PORTUGUES" />}
                        {activeAnalysis === 'SAMAHC_MATEMATICA' && <SamahcDashboard escolas={escolas} coordenadores={coordenadores} onUpdateEscola={onUpdateEscola} samahcSubIndicator="MATEMATICA" />}
                    </div>
                </div>
            )}

            {selectedSchoolForParc && (
                <FluenciaParcModal
                    isOpen={showParcModal}
                    onClose={() => { setShowParcModal(false); setSelectedSchoolForParc(null); }}
                    escola={selectedSchoolForParc}
                    onSave={handleSaveParc}
                    onDelete={handleDeleteParc}
                />
            )}

            {selectedSchoolForCnca && (
                <CncaModal
                    isOpen={showCncaModal}
                    onClose={() => { setShowCncaModal(false); setSelectedSchoolForCnca(null); }}
                    escola={selectedSchoolForCnca}
                    onSave={handleSaveCnca}
                    onDelete={handleDeleteCnca}
                />
            )}

            {selectedSchoolForSeama && (
                <SeamaModal
                    isOpen={showSeamaModal}
                    onClose={() => { setShowSeamaModal(false); setSelectedSchoolForSeama(null); }}
                    escola={selectedSchoolForSeama}
                    onSave={handleSaveSeama}
                    onDelete={handleDeleteSeama}
                />
            )}

            {selectedSchoolForSaeb && (
                <SaebModal
                    isOpen={showSaebModal}
                    onClose={() => { setShowSaebModal(false); setSelectedSchoolForSaeb(null); }}
                    escola={selectedSchoolForSaeb}
                    onSave={handleSaveSaeb}
                    onDelete={handleDeleteSaeb}
                />
            )}

            {selectedSchoolForIdeb && (
                <IdebModal
                    isOpen={showIdebModal}
                    onClose={() => { setShowIdebModal(false); setSelectedSchoolForIdeb(null); }}
                    escola={selectedSchoolForIdeb}
                    onSave={handleSaveIdeb}
                    onDelete={handleDeleteIdeb}
                />
            )}

            {showImportPreview && renderImportPreview()}
        </div>
    );
};
