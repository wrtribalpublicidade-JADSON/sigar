import React, { useState } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Escola, RegistroFluenciaPARC, RegistroCNCA, RegistroSEAMA, RegistroSAEB, RegistroIDEB, Segmento } from '../types';
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
    MapPin
} from 'lucide-react';
import { Card } from './ui/Card';
import { exportToCSV, generateUUID } from '../utils';
import { FluenciaParcModal } from './modals/FluenciaParcModal';
import { CncaModal } from './modals/CncaModal';
import { SeamaModal } from './modals/SeamaModal';
import { SaebModal } from './modals/SaebModal';
import { IdebModal } from './modals/IdebModal';

interface IndicatorsPanelProps {
    escolas: Escola[];
    onUpdateEscola: (updatedEscola: Escola) => void;
}

const COLORS = {
    brand: '#FF4D00',
    dark: '#000000',
    grey: '#71717A',
    acid: '#D6FF00'
};

type TabType = 'CENSO' | 'SAMAHC' | 'PARC' | 'SAEB' | 'IDEB' | 'SEAMA' | 'CNCA' | 'EI';

export const IndicatorsPanel: React.FC<IndicatorsPanelProps> = ({ escolas, onUpdateEscola }) => {
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
        return matchesSearch;
    });

    const handleExport = () => {
        let dataToExport: any[] = [];
        // Implementation for export if needed
        exportToCSV(dataToExport, `indicadores_${activeTab.toLowerCase()}`);
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
        const novosRegistros = (selectedSchoolForCnca.dadosEducacionais.registrosCNCA || []).filter(r => r.id !== id);
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
                            {activeTab === 'SAEB' && <th className="px-4 py-4 text-center">SAEB Score</th>}
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
                                    <td className="px-4 py-5 text-center font-black text-slate-900 bg-slate-50/50">
                                        {escola.dadosEducacionais?.avaliacoesExternas?.saeb || '-'}
                                    </td>
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
                                                const specificRegs = regs.filter(r => r.anoSerie === serie && r.componenteCurricular === comp);
                                                if (specificRegs.length === 0) return '-';

                                                // Get the latest one (by year)
                                                const latest = specificRegs.sort((a, b) => b.ano - a.ano)[0];
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
        const docentes = (escola.recursosHumanos || []).filter(rh =>
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
                <div className="flex flex-wrap gap-2 animate-fade-in mb-6">
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
        </div>
    );
};
