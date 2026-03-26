import React, { useState, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { 
    BarChart3, Award, Users, Filter, School, MapPin, 
    Target, Activity, TrendingUp, GraduationCap, BookOpen, ChevronDown,
    Pencil, Trash2, Printer, Search
} from 'lucide-react';
import { Escola, Coordenador, RegistroFluenciaSAMAHC } from '../types';
import { SamahcFluenciaModal } from './modals/SamahcFluenciaModal';
import { SamahcEvolutionModal } from './modals/SamahcEvolutionModal';
import { PrintableSamahcFluenciaReport } from './reports/PrintableSamahcFluenciaReport';
import { samahcService } from '../services/samahcService';

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

interface SamahcDashboardProps {
    escolas: Escola[];
    coordenadores: Coordenador[];
    onUpdateEscola?: (escola: Escola) => void;
}

const COLORS = ['#FF4D00', '#000000', '#71717A', '#D6FF00', '#6366f1'];

export const SamahcDashboard: React.FC<SamahcDashboardProps> = ({ escolas, coordenadores, onUpdateEscola }) => {
    const [selectedPolo, setSelectedPolo] = useState('Todos');
    const [selectedRegional, setSelectedRegional] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeView, setActiveView] = useState<'VISÃO GERAL' | 'RANKINGS' | 'COMPARATIVO' | 'DETALHAMENTO'>('VISÃO GERAL');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;
    
    // States for editing
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<RegistroFluenciaSAMAHC | null>(null);
    const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null);

    // Data management for performance
    const [samahcRecords, setSamahcRecords] = useState<{ registro: RegistroFluenciaSAMAHC; escola: Escola }[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Evolution Stats
    const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
    const [selectedStudentForEvolution, setSelectedStudentForEvolution] = useState<{name: string, records: {registro: RegistroFluenciaSAMAHC, escola: Escola}[]} | null>(null);

    // Fetching logic
    React.useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Get school IDs that match the current UI filters (Polo and Regional)
                const schoolIds = filteredEscolas.map(e => e.id);
                
                const { records, totalCount } = await samahcService.getPaginatedRecords({
                    page: currentPage,
                    pageSize: pageSize,
                    searchTerm: debouncedSearch,
                    polo: selectedPolo,
                    regional: selectedRegional,
                    schoolIds: schoolIds
                });
                
                console.log('--- DASHBOARD DATA LOAD ---');
                console.log('Records Count from Service:', records.length);
                console.log('Total Count from Service:', totalCount);
                if (records.length > 0) console.log('First record from Service:', JSON.stringify(records[0]));
                
                setSamahcRecords(records.map(r => {
                    // Supabase join might return an object or an array depending on the configuration
                    const escolaData = Array.isArray(r.escola) ? r.escola[0] : r.escola;
                    
                    const item = {
                        registro: r,
                        escola: escolaData || { id: r.escola_id, nome: 'Escola não vinculada', polo: r.polo }
                    };
                    return item;
                }) as any);
                setTotalRecords(totalCount);
            } catch (error) {
                console.error('Error loading samahc records:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (activeView === 'DETALHAMENTO') {
            loadData();
        }
    }, [currentPage, debouncedSearch, selectedPolo, selectedRegional, activeView, escolas]);

    // Local filter for summary stats (keep but optimize if possible)
    const filteredEscolas = useMemo(() => {
        return escolas.filter(e => {
            const coord = coordenadores.find(c => c.escolasIds.includes(e.id));
            const matchesPolo = selectedPolo === 'Todos' || e.polo === selectedPolo;
            const matchesRegional = selectedRegional === 'Todos' || (coord && coord.nome === selectedRegional);
            return matchesPolo && matchesRegional;
        });
    }, [escolas, coordenadores, selectedPolo, selectedRegional]);

    // Reset page when filters or search change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedPolo, selectedRegional, debouncedSearch, activeView]);

    // Statistics
    const stats = useMemo(() => {
        const total = filteredEscolas.length || 1;
        const sum = filteredEscolas.reduce((acc, e) => {
            const s = e.dadosEducacionais?.dadosSamahc;
            return {
                seama: acc.seama + (s?.simuladoSeama || 0),
                saeb: acc.saeb + (s?.simuladoSaeb || 0),
                fluencia: acc.fluencia + (s?.fluencia || 0),
                lp: acc.lp + (s?.linguaPortuguesa || 0),
                mat: acc.mat + (s?.matematica || 0)
            };
        }, { seama: 0, saeb: 0, fluencia: 0, lp: 0, mat: 0 });

        return {
            seama: Number((sum.seama / total).toFixed(1)),
            saeb: Number((sum.saeb / total).toFixed(1)),
            fluencia: Number((sum.fluencia / total).toFixed(1)),
            lp: Number((sum.lp / total).toFixed(1)),
            mat: Number((sum.mat / total).toFixed(1))
        };
    }, [filteredEscolas]);

    // Radar Data for average
    const radarData = [
        { subject: 'SEAMA', A: stats.seama, fullMark: 100 },
        { subject: 'SAEB', A: stats.saeb, fullMark: 100 },
        { subject: 'Fluência', A: stats.fluencia, fullMark: 100 },
        { subject: 'Língua Port.', A: stats.lp, fullMark: 100 },
        { subject: 'Matemática', A: stats.mat, fullMark: 100 },
    ];

    // Top Schools
    const topSchools = useMemo(() => {
        return [...filteredEscolas].sort((a, b) => {
            const sA = a.dadosEducacionais?.dadosSamahc;
            const sB = b.dadosEducacionais?.dadosSamahc;
            const sumA = (sA?.simuladoSeama || 0) + (sA?.simuladoSaeb || 0) + (sA?.fluencia || 0);
            const sumB = (sB?.simuladoSeama || 0) + (sB?.simuladoSaeb || 0) + (sB?.fluencia || 0);
            return sumB - sumA;
        }).slice(0, 5);
    }, [filteredEscolas]);

    const handleEditRecord = (record: RegistroFluenciaSAMAHC, escola: Escola) => {
        setSelectedRecord(record);
        setSelectedEscola(escola);
        setIsEditModalOpen(true);
    };

    const handleDeleteRecord = (recordId: string, escola: Escola) => {
        if (!window.confirm('Tem certeza que deseja excluir este registro? Isso afetará os cálculos de fluência da escola.')) return;

        const updatedEscola = { ...escola };
        if (!updatedEscola.dadosEducacionais) return;

        updatedEscola.dadosEducacionais.registrosFluenciaSamahc = 
            (updatedEscola.dadosEducacionais.registrosFluenciaSamahc || []).filter(r => r.id !== recordId);

        // Recalculate fluencia percentage
        const regs = updatedEscola.dadosEducacionais.registrosFluenciaSamahc;
        const currentYear = new Date().getFullYear();
        const currentYearRegs = regs.filter((r: any) => (r.ano === currentYear || r.ano === currentYear - 1));
        
        if (currentYearRegs.length > 0) {
            const total = currentYearRegs.length;
            const fluentes = currentYearRegs.filter((r: any) => {
                const n = (r.nivelDesempenho || '').toUpperCase();
                return n.includes('FLUENTE') || n.includes('COM FLUÊNCIA') || n.includes('INICIANTE');
            }).length;
            const perc = Number(((fluentes / total) * 100).toFixed(1));
            
            if (updatedEscola.dadosEducacionais.dadosSamahc) {
                updatedEscola.dadosEducacionais.dadosSamahc.fluencia = perc;
            }
        } else if (updatedEscola.dadosEducacionais.dadosSamahc) {
            updatedEscola.dadosEducacionais.dadosSamahc.fluencia = 0;
        }

        onUpdateEscola?.(updatedEscola);
    };

    const handleSaveEdit = (editedRecord: RegistroFluenciaSAMAHC) => {
        if (!selectedEscola) return;

        const updatedEscola = { ...selectedEscola };
        if (!updatedEscola.dadosEducacionais) return;

        updatedEscola.dadosEducacionais.registrosFluenciaSamahc = 
            (updatedEscola.dadosEducacionais.registrosFluenciaSamahc || []).map(r => 
                r.id === editedRecord.id ? editedRecord : r
            );

        // Recalculate fluencia percentage
        const regs = updatedEscola.dadosEducacionais.registrosFluenciaSamahc;
        const currentYear = new Date().getFullYear();
        const currentYearRegs = regs.filter((r: any) => (r.ano === currentYear || r.ano === currentYear - 1));
        
        if (currentYearRegs.length > 0) {
            const total = currentYearRegs.length;
            const fluentes = currentYearRegs.filter((r: any) => {
                const n = (r.nivelDesempenho || '').toUpperCase();
                return n.includes('FLUENTE') || n.includes('COM FLUÊNCIA') || n.includes('INICIANTE');
            }).length;
            const perc = Number(((fluentes / total) * 100).toFixed(1));
            
            if (updatedEscola.dadosEducacionais.dadosSamahc) {
                updatedEscola.dadosEducacionais.dadosSamahc.fluencia = perc;
            }
        }

        onUpdateEscola?.(updatedEscola);
        setIsEditModalOpen(false);
    };

    const handleStudentEvolution = (studentName: string) => {
        // Find all records for this student across ALL schools
        const studentRecords: { registro: RegistroFluenciaSAMAHC; escola: Escola }[] = [];
        
        escolas.forEach(escola => {
            const regs = escola.dadosEducacionais?.registrosFluenciaSamahc || [];
            regs.forEach(r => {
                if (r.estudanteNome.trim().toUpperCase() === studentName.trim().toUpperCase()) {
                    studentRecords.push({ registro: r, escola });
                }
            });
        });

        setSelectedStudentForEvolution({ name: studentName, records: studentRecords });
        setIsEvolutionModalOpen(true);
    };

    const renderVisaoGeral = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'SIMULADO SEAMA', val: stats.seama, icon: GraduationCap, color: 'text-indigo-500' },
                    { label: 'SIMULADO SAEB', val: stats.saeb, icon: Target, color: 'text-red-500' },
                    { label: 'FLUÊNCIA', val: stats.fluencia + '%', icon: Activity, color: 'text-orange-500' },
                    { label: 'L. PORTUGUESA', val: stats.lp, icon: BookOpen, color: 'text-emerald-500' },
                    { label: 'MATEMÁTICA', val: stats.mat, icon: TrendingUp, color: 'text-blue-500' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg bg-slate-50 group-hover:bg-slate-100 transition-colors`}>
                                <s.icon className={`w-5 h-5 ${s.color}`} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        <h4 className="text-3xl font-black text-slate-800">{s.val}</h4>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
                        <BarChart3 className="w-5 h-5 text-orange-500" />
                        Desempenho Médio Consolidado
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={radarData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="A" name="Média Geral" fill="#FF4D00" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
                        <Award className="w-5 h-5 text-orange-500" />
                        Equilíbrio de Indicadores
                    </h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Média" dataKey="A" stroke="#FF4D00" fill="#FF4D00" fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderRankings = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-900 p-4 text-white">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        Top 5 Unidades (Geral)
                    </h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {topSchools.map((e, i) => {
                        const s = e.dadosEducacionais?.dadosSamahc;
                        const score = Number((( (s?.simuladoSeama || 0) + (s?.simuladoSaeb || 0) + (s?.fluencia || 0) ) / 3).toFixed(1));
                        return (
                            <div key={e.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-xs ${i === 0 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {i + 1}
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{e.nome}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">{ (e as any).polo || 'Sede' }</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-slate-800">{score}</p>
                                    <p className="text-[10px] text-orange-500 font-black uppercase tracking-tighter">Score Médio</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-900 p-4 text-white">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-orange-500" />
                        Maiores Taxas de Fluência
                    </h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {[...filteredEscolas].sort((a, b) => (b.dadosEducacionais?.dadosSamahc?.fluencia || 0) - (a.dadosEducacionais?.dadosSamahc?.fluencia || 0)).slice(0, 5).map((e, i) => (
                        <div key={e.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 font-black text-xs">
                                    {i + 1}
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{e.nome}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">{(e as any).polo || 'Sede'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-slate-800">{e.dadosEducacionais?.dadosSamahc?.fluencia || 0}%</p>
                                <p className="text-[10px] text-orange-500 font-black uppercase tracking-tighter">Leitores</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderComparativo = () => (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4">Unidade Escolar</th>
                        <th className="pb-4 text-center">Simulado Seama</th>
                        <th className="pb-4 text-center">Simulado Saeb</th>
                        <th className="pb-4 text-center">Fluência %</th>
                        <th className="pb-4 text-center">L. Portuguesa</th>
                        <th className="pb-4 text-center">Matemática</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {filteredEscolas.map(e => (
                        <tr key={e.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-4">
                                <p className="text-sm font-bold text-slate-700 group-hover:text-orange-600 transition-colors">{e.nome}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{(e as any).polo || 'N/A'}</p>
                            </td>
                            <td className="py-4 text-center font-bold text-slate-600">{e.dadosEducacionais?.dadosSamahc?.simuladoSeama || 0}</td>
                            <td className="py-4 text-center font-bold text-slate-600">{e.dadosEducacionais?.dadosSamahc?.simuladoSaeb || 0}</td>
                            <td className="py-4 text-center font-bold text-orange-600">{e.dadosEducacionais?.dadosSamahc?.fluencia || 0}%</td>
                            <td className="py-4 text-center font-bold text-slate-600">{e.dadosEducacionais?.dadosSamahc?.linguaPortuguesa || 0}</td>
                            <td className="py-4 text-center font-bold text-slate-600">{e.dadosEducacionais?.dadosSamahc?.matematica || 0}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderDetalhamento = () => (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por estudante ou escola..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                </div>
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-200 hover:bg-black transition-all"
                >
                    <Printer className="w-4 h-4 text-orange-500" />
                    IMPRIMIR RELATÓRIO
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                <th className="px-4 py-4">Polo</th>
                                <th className="px-4 py-4">Escola</th>
                                <th className="px-4 py-4 text-center">Ano</th>
                                <th className="px-4 py-4">Estudante</th>
                                <th className="px-4 py-4 text-center">Série</th>
                                <th className="px-4 py-4 text-center">Turno</th>
                                <th className="px-4 py-4 text-center">Avaliação</th>
                                <th className="px-4 py-4 text-center">Nível</th>
                                <th className="px-4 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Carregando dados...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : samahcRecords.length > 0 ? (
                                samahcRecords.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4 text-[10px] font-black text-slate-400 whitespace-nowrap">{item.escola.polo || 'SEDE'}</td>
                                        <td className="px-4 py-4">
                                            <p className="text-[10px] font-bold text-slate-600 line-clamp-1 truncate w-32">{item.escola.nome}</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-flex px-2 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 whitespace-nowrap border border-slate-100">
                                                {item.registro.ano}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <button 
                                                onClick={() => handleStudentEvolution(item.registro.estudanteNome || (item.registro as any).estudante_nome)}
                                                className="text-sm font-black text-slate-800 uppercase line-clamp-1 hover:text-orange-600 transition-colors text-left"
                                            >
                                                {item.registro.estudanteNome || (item.registro as any).estudante_nome}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-flex px-2 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 whitespace-nowrap">
                                                {item.registro.anoSerie || (item.registro as any).ano_serie}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-flex px-2 py-1 bg-indigo-50 rounded-lg text-[9px] font-black text-indigo-500 whitespace-nowrap">
                                                {item.registro.turno || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-flex px-2 py-1 bg-orange-50 rounded-lg text-[9px] font-black text-orange-500 whitespace-nowrap uppercase">
                                                {item.registro.tipoAvaliacao || (item.registro as any).tipo_avaliacao || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex px-2 py-1 rounded-lg text-[9px] font-black whitespace-nowrap ${
                                                String(item.registro.nivelDesempenho || (item.registro as any).nivel_desempenho || '').toUpperCase().includes('FLUENTE') ? 'bg-emerald-50 text-emerald-600' :
                                                String(item.registro.nivelDesempenho || (item.registro as any).nivel_desempenho || '').toUpperCase().includes('INICIANTE') ? 'bg-blue-50 text-blue-600' :
                                                'bg-rose-50 text-rose-600'
                                            }`}>
                                                {item.registro.nivelDesempenho || (item.registro as any).nivel_desempenho || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleStudentEvolution(item.registro.estudanteNome)}
                                                    className="p-2 text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                                                    title="Ver Evolução"
                                                >
                                                    <TrendingUp className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleEditRecord(item.registro, item.escola)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteRecord(item.registro.id, item.escola)}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <Search className="w-12 h-12 mb-2 opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-widest italic">Nenhum registro encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Standard Pagination Footer as per design */}
                <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-400">
                        Exibindo <span className="text-slate-600">{Math.min(currentPage * pageSize, totalRecords)}</span> de <span className="text-slate-600">{totalRecords}</span> estudantes
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1 || isLoading}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={`px-6 py-2 rounded-xl text-xs font-black border border-slate-200 transition-all ${currentPage === 1 || isLoading ? 'bg-slate-50 text-slate-300' : 'bg-white text-slate-600 shadow-sm hover:border-orange-500 hover:text-orange-500 active:scale-95'}`}
                        >
                            Anterior
                        </button>
                        <button
                            disabled={currentPage * pageSize >= totalRecords || isLoading}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className={`px-6 py-2 rounded-xl text-xs font-black border border-slate-200 transition-all ${currentPage * pageSize >= totalRecords || isLoading ? 'bg-slate-50 text-slate-300' : 'bg-white text-slate-600 shadow-sm hover:border-orange-500 hover:text-orange-500 active:scale-95'}`}
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            </div>
            
            <PrintableSamahcFluenciaReport 
                data={samahcRecords.map(r => ({ registro: r.registro, escolaNome: r.escola.nome }))}
                filtroPolo={selectedPolo}
                filtroRegional={selectedRegional}
            />
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                            <BarChart3 className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Análise SAMAHC</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Painel Consolidado de Indicadores Locais</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {['VISÃO GERAL', 'RANKINGS', 'COMPARATIVO', 'DETALHAMENTO'].map(v => (
                            <button
                                key={v}
                                onClick={() => setActiveView(v as any)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeView === v ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            >
                                {v === 'DETALHAMENTO' ? 'DETALHAMENTO DE ALUNOS' : v}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100">
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            <MapPin className="w-3 h-3 text-orange-500" />
                            Polo / Localidade
                        </label>
                        <div className="relative">
                            <select 
                                value={selectedPolo}
                                onChange={(e) => setSelectedPolo(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
                            >
                                <option value="Todos">Todos os Polos</option>
                                {Array.from(new Set(escolas.map(e => e.polo).filter(Boolean))).sort().map(p => (
                                    <option key={p} value={p!}>{p}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            <Users className="w-3 h-3 text-orange-500" />
                            Regional / Coordenador
                        </label>
                        <div className="relative">
                            <select 
                                value={selectedRegional}
                                onChange={(e) => setSelectedRegional(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
                            >
                                <option value="Todos">Todas as Regionais</option>
                                {coordenadores.map(c => (
                                    <option key={c.id} value={c.nome}>{c.nome}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex items-end">
                        <div className="w-full bg-orange-50 rounded-xl p-3 flex items-center justify-between border border-orange-100">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Unidades Filtradas</span>
                            </div>
                            <span className="text-lg font-black text-orange-600">{filteredEscolas.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                {activeView === 'VISÃO GERAL' && renderVisaoGeral()}
                {activeView === 'RANKINGS' && renderRankings()}
                {activeView === 'COMPARATIVO' && renderComparativo()}
                {activeView === 'DETALHAMENTO' && renderDetalhamento()}
            </div>

            {isEditModalOpen && (
                <SamahcFluenciaModal 
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    escola={selectedEscola!}
                    registro={selectedRecord}
                    onSave={handleSaveEdit}
                />
            )}

            {isEvolutionModalOpen && selectedStudentForEvolution && (
                <SamahcEvolutionModal 
                    isOpen={isEvolutionModalOpen}
                    onClose={() => setIsEvolutionModalOpen(false)}
                    studentName={selectedStudentForEvolution.name}
                    records={selectedStudentForEvolution.records}
                />
            )}
        </div>
    );
};
