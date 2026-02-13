import React, { useState } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Escola, RegistroFluenciaPARC, RegistroCNCA, RegistroSEAMA, RegistroSAEB } from '../types';
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

    const filteredEscolas = escolas.filter(escola =>
        escola.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    const renderTabContent = () => {
        return (
            <div className="overflow-x-auto bg-white">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b-2 border-brand-black">
                        <tr className="font-mono text-[9px] font-black text-brand-grey uppercase tracking-widest">
                            <th className="px-8 py-5">Unidade Escolar</th>
                            {activeTab === 'CENSO' && (
                                <>
                                    <th className="px-4 py-5 text-center">Matrícula Total</th>
                                    <th className="px-4 py-5 text-center">Docentes</th>
                                    <th className="px-4 py-5 text-center">Turmas</th>
                                </>
                            )}
                            {activeTab === 'SAMAHC' && (
                                <th className="px-4 py-5 text-center bg-brand-orange/5">
                                    {samahcSubTab === 'SEAMA' && 'Simulado SEAMA'}
                                    {samahcSubTab === 'SAEB' && 'Simulado SAEB'}
                                    {samahcSubTab === 'FLUENCIA' && 'Fluência (%)'}
                                    {samahcSubTab === 'PORTUGUES' && 'Língua Portuguesa'}
                                    {samahcSubTab === 'MATEMATICA' && 'Matemática'}
                                </th>
                            )}
                            {activeTab === 'PARC' && <th className="px-4 py-5 text-center bg-brand-orange/5 text-brand-orange">Último PARC (%)</th>}
                            {activeTab === 'SAEB' && <th className="px-4 py-5 text-center">SAEB Score</th>}
                            {activeTab === 'IDEB' && <th className="px-4 py-5 text-center">IDEB Rank</th>}
                            {activeTab === 'SEAMA' && (
                                <>
                                    <th className="px-4 py-5 text-center text-slate-900 bg-slate-100/30">Língua Portuguesa</th>
                                    <th className="px-4 py-5 text-center text-slate-900 bg-slate-100/30">Matemática</th>
                                    <th className="px-4 py-5 text-center bg-slate-900 text-white">Média Geral</th>
                                </>
                            )}
                            {activeTab === 'CNCA' && (
                                <>
                                    <th className="px-4 py-5 text-center">Diagnóstica (%)</th>
                                    <th className="px-4 py-5 text-center">Formativa (%)</th>
                                    <th className="px-4 py-5 text-center bg-brand-acid/10">Somativa (%)</th>
                                </>
                            )}
                            {activeTab === 'EI' && <th className="px-4 py-5 text-center text-brand-acid bg-slate-900">Desenv. EI (%)</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-black/10">
                        {filteredEscolas.map((escola) => (
                            <tr
                                key={escola.id}
                                className={`group hover:bg-slate-50 transition-all font-mono text-xs uppercase ${(activeTab === 'PARC' || activeTab === 'CNCA' || activeTab === 'SEAMA' || activeTab === 'SAEB') ? 'cursor-pointer' : ''}`}
                                onClick={() => handleSchoolClick(escola)}
                            >
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-black text-brand-black text-sm">{escola.nome}</span>
                                        {(activeTab === 'PARC' || activeTab === 'CNCA' || activeTab === 'SEAMA' || activeTab === 'SAEB') && (
                                            <span className="text-[8px] font-black text-brand-orange mt-1 flex items-center gap-1 group-hover:translate-x-1 transition-all uppercase tracking-widest">
                                                Inserir Dados <ChevronRight className="w-2 h-2" strokeWidth={4} />
                                            </span>
                                        )}
                                    </div>
                                </td>
                                {activeTab === 'CENSO' && (
                                    <>
                                        <td className="px-4 py-5 text-center font-black text-brand-black">{escola.dadosEducacionais?.censoEscolar?.matriculaTotal || 0}</td>
                                        <td className="px-4 py-5 text-center">{escola.dadosEducacionais?.censoEscolar?.docentes || 0}</td>
                                        <td className="px-4 py-5 text-center">{escola.dadosEducacionais?.censoEscolar?.turmas || 0}</td>
                                    </>
                                )}
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
                                        <span className={`inline-flex px-3 py-1 font-black text-xs border-2 border-brand-black ${escola.dadosEducacionais.avaliacoesExternas.ideb >= 4.5 ? 'bg-brand-acid text-brand-black shadow-sharp-sm' : 'bg-brand-signal text-white'}`}>
                                            {(escola.dadosEducacionais?.avaliacoesExternas?.ideb || 0)}
                                        </span>
                                    </td>
                                )}
                                {activeTab === 'SEAMA' && (
                                    <>
                                        {(() => {
                                            const regs = escola.dadosEducacionais?.registrosSEAMA || [];
                                            const maxYear = regs.length > 0 ? Math.max(...regs.map(r => r.ano)) : null;
                                            const latestRegs = maxYear ? regs.filter(r => r.ano === maxYear) : [];
                                            const getAvgForComp = (comp: string) => {
                                                const compRegs = latestRegs.filter(r => r.componenteCurricular === comp);
                                                if (compRegs.length === 0) return 0;
                                                const sum = compRegs.reduce((acc, r) => acc + (r.proficienciaMedia || 0), 0);
                                                return Number((sum / compRegs.length).toFixed(1));
                                            };
                                            const lp = getAvgForComp('Língua Portuguesa');
                                            const mat = getAvgForComp('Matemática');
                                            const mediaGeral = Number(((lp + mat) / (lp > 0 && mat > 0 ? 2 : 1)).toFixed(1));
                                            return (
                                                <>
                                                    <td className="px-4 py-5 text-center font-bold text-slate-600">{lp || '-'}</td>
                                                    <td className="px-4 py-5 text-center font-bold text-slate-600">{mat || '-'}</td>
                                                    <td className="px-4 py-5 text-center font-black text-sm bg-slate-900 text-white">{mediaGeral || '-'}</td>
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
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-20 animate-fade-in relative">
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
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${isActive ? 'border-orange-500 text-orange-600 bg-orange-50/10' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
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
        </div>
    );
};
