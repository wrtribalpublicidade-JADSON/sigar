import React, { useState, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    PieChart, Pie, Cell, LabelList
} from 'recharts';
import { 
    BarChart3, Award, Users, Filter, School, MapPin, 
    Target, Activity, TrendingUp, GraduationCap, BookOpen, ChevronDown,
    Pencil, Trash2, Printer, Search, Loader2
} from 'lucide-react';
import { Button } from './ui/Button';
import { Escola, Coordenador, RegistroFluenciaSAMAHC } from '../types';
import { SamahcFluenciaModal } from './modals/SamahcFluenciaModal';
import { SamahcEvolutionModal } from './modals/SamahcEvolutionModal';
import { PrintableSamahcFluenciaReport } from './reports/PrintableSamahcFluenciaReport';
import { PrintableAlfabetometroModal } from './modals/PrintableAlfabetometroModal';
import { PrintableAlfabetometroReport, AlfabetometroDocumentView } from './reports/PrintableAlfabetometroReport';
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
    samahcSubIndicator?: 'SEAMA' | 'SAEB' | 'FLUENCIA' | 'PORTUGUES' | 'MATEMATICA';
}

const COLORS = ['#FF4D00', '#000000', '#71717A', '#D6FF00', '#6366f1'];

export interface SchoolLiteracyStats {
    schoolId: string;
    schoolName: string;
    total: number;
    fluent: number;
    beginner: number;
    preReaderIV: number;
    preReaderIII: number;
    preReaderII: number;
    preReaderI: number;
    pctFluent: number;
    pctBeginner: number;
    pctPreReader: number;
    pctLiterate: number;
}

export const SamahcDashboard: React.FC<SamahcDashboardProps> = ({ escolas, coordenadores, onUpdateEscola, samahcSubIndicator = 'FLUENCIA' }) => {
    const [selectedPolo, setSelectedPolo] = useState('Todos');
    const [selectedRegional, setSelectedRegional] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeView, setActiveView] = useState<'VISÃO GERAL' | 'RANKINGS' | 'COMPARATIVO' | 'DETALHAMENTO' | 'ALFABETÔMETRO'>('VISÃO GERAL');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;
    const [schoolsLiteracy, setSchoolsLiteracy] = useState<SchoolLiteracyStats[]>([]);
    const [alfabetometroSchoolSearch, setAlfabetometroSchoolSearch] = useState('');
    
    // States for editing
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<RegistroFluenciaSAMAHC | null>(null);
    const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null);

    // States for printable Alfabetômetro
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printReportData, setPrintReportData] = useState<{
        schoolName: string;
        grade: string;
        year: number;
        records: any[];
    } | null>(null);

    // States for inline Alfabetômetro document preview
    const [alfabetometroEscolaId, setAlfabetometroEscolaId] = useState<string>('Todas');
    const [alfabetometroModo, setAlfabetometroModo] = useState<string>('page');
    const [alfabetometroGrade, setAlfabetometroGrade] = useState<string>('Toda a escola (consolidado)');
    const [alfabetometroAno, setAlfabetometroAno] = useState<number>(new Date().getFullYear());
    const [alfabetometroPreviewRecords, setAlfabetometroPreviewRecords] = useState<any[]>([]);
    const [isLoadingAlfabetometroPreview, setIsLoadingAlfabetometroPreview] = useState<boolean>(false);

    // Fetch records for inline Alfabetômetro preview
    React.useEffect(() => {
        if (activeView !== 'ALFABETÔMETRO') return;

        let isMounted = true;
        const fetchPreviewRecords = async () => {
            setIsLoadingAlfabetometroPreview(true);
            try {
                const recs = await samahcService.getPrintRecords(
                    alfabetometroEscolaId,
                    alfabetometroAno,
                    alfabetometroGrade
                );
                if (isMounted) {
                    setAlfabetometroPreviewRecords(recs);
                }
            } catch (err) {
                console.error('Error fetching alfabetometro preview records:', err);
            } finally {
                if (isMounted) {
                    setIsLoadingAlfabetometroPreview(false);
                }
            }
        };

        fetchPreviewRecords();
        return () => { isMounted = false; };
    }, [activeView, alfabetometroEscolaId, alfabetometroGrade, alfabetometroAno]);

    // Data management for performance
    const [samahcRecords, setSamahcRecords] = useState<{ registro: RegistroFluenciaSAMAHC; escola: Escola }[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Local filter for summary stats (keep but optimize if possible)
    const filteredEscolas = useMemo(() => {
        return escolas.filter(e => {
            const coord = (coordenadores || []).find(c => c.escolasIds.includes(e.id));
            const matchesPolo = selectedPolo === 'Todos' || e.polo === selectedPolo;
            const matchesRegional = selectedRegional === 'Todos' || (coord && coord.nome === selectedRegional);
            return matchesPolo && matchesRegional;
        });
    }, [escolas, coordenadores, selectedPolo, selectedRegional]);

    // Advanced Detail Filters
    const [detalheEscolaId, setDetalheEscolaId] = useState('Todas');
    const [detalheAno, setDetalheAno] = useState(0);
    const [detalheSerie, setDetalheSerie] = useState('Todas');
    const [detalheTurno, setDetalheTurno] = useState('Todos');
    const [detalheAvaliacao, setDetalheAvaliacao] = useState('Todas');
    const [detalheNivel, setDetalheNivel] = useState('Todos');

    // Reset individual school filter if it's no longer in the filtered list
    React.useEffect(() => {
        if (detalheEscolaId !== 'Todas' && !filteredEscolas.find(e => e.id === detalheEscolaId)) {
            setDetalheEscolaId('Todas');
        }
    }, [filteredEscolas, detalheEscolaId]);

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
                    schoolIds: schoolIds,
                    escola_id: detalheEscolaId,
                    ano: detalheAno,
                    ano_serie: detalheSerie,
                    turno: detalheTurno,
                    tipo_avaliacao: detalheAvaliacao,
                    nivel_desempenho: detalheNivel
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
                        escola: { 
                            ...(escolaData || { id: r.escola_id, nome: 'Escola não vinculada' }), 
                            polo: r.polo 
                        }
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

        if (activeView === 'DETALHAMENTO' || activeView === 'ALFABETÔMETRO') {
            loadData();
        }
    }, [currentPage, debouncedSearch, selectedPolo, selectedRegional, activeView, escolas,
        detalheEscolaId, detalheAno, detalheSerie, detalheTurno, detalheAvaliacao, detalheNivel]);

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

    // Fluency-specific stats (fetched directly from DB since escola objects don't carry this data)
    const [fluencyStats, setFluencyStats] = useState({
        participatingSchools: 0,
        totalStudents: 0,
        pctFluent: 0,
        pctBeginner: 0,
        pctPreReaderIV: 0,
        pctPreReaderIII: 0,
        pctPreReaderII: 0,
        pctPreReaderI: 0,
        pctTotalPreReaders: 0,
        fluentCount: 0,
        beginnerCount: 0,
        preReaderIVCount: 0,
        preReaderIIICount: 0,
        preReaderIICount: 0,
        preReaderICount: 0,
        totalPreReaders: 0
    });
    const [participatingSchoolIdsSet, setParticipatingSchoolIdsSet] = useState<Set<string>>(new Set());

    React.useEffect(() => {
        
        const fetchFluencyStats = async () => {
            try {
                const schoolIds = filteredEscolas.map(e => e.id);
                const records = await samahcService.getAllStatsRecords(schoolIds, {
                    escola_id: detalheEscolaId,
                    ano: detalheAno,
                    ano_serie: detalheSerie,
                    turno: detalheTurno,
                    tipo_avaliacao: detalheAvaliacao,
                    nivel_desempenho: detalheNivel
                });
                
                let totalStudents = 0;
                let fluentCount = 0;
                let beginnerCount = 0;
                let preReaderIVCount = 0;
                let preReaderIIICount = 0;
                let preReaderIICount = 0;
                let preReaderICount = 0;
                const participatingSchoolIds = new Set<string>();

                const schoolStatsMap = new Map<string, {
                    total: number;
                    fluent: number;
                    beginner: number;
                    preReaderIV: number;
                    preReaderIII: number;
                    preReaderII: number;
                    preReaderI: number;
                }>();

                records.forEach((r: any) => {
                    totalStudents++;
                    participatingSchoolIds.add(r.escola_id);
                    const nivel = (r.nivel_desempenho || '').toUpperCase();
                    
                    let isFluent = false;
                    let isBeginner = false;
                    let isIV = false;
                    let isIII = false;
                    let isII = false;
                    let isI = false;

                    if (nivel.includes('FLUENTE')) {
                        fluentCount++;
                        isFluent = true;
                    } else if (nivel.includes('INICIANTE')) {
                        beginnerCount++;
                        isBeginner = true;
                    } else if (nivel.includes('NÍVEL IV') || nivel.includes('NIVEL IV')) {
                        preReaderIVCount++;
                        isIV = true;
                    } else if (nivel.includes('NÍVEL III') || nivel.includes('NIVEL III')) {
                        preReaderIIICount++;
                        isIII = true;
                    } else if (nivel.includes('NÍVEL II') || nivel.includes('NIVEL II')) {
                        preReaderIICount++;
                        isII = true;
                    } else if (nivel.includes('NÍVEL I') || nivel.includes('NIVEL I')) {
                        preReaderICount++;
                        isI = true;
                    }

                    const schId = r.escola_id;
                    if (!schoolStatsMap.has(schId)) {
                        schoolStatsMap.set(schId, {
                            total: 0,
                            fluent: 0,
                            beginner: 0,
                            preReaderIV: 0,
                            preReaderIII: 0,
                            preReaderII: 0,
                            preReaderI: 0
                        });
                    }
                    const sData = schoolStatsMap.get(schId)!;
                    sData.total++;
                    if (isFluent) sData.fluent++;
                    if (isBeginner) sData.beginner++;
                    if (isIV) sData.preReaderIV++;
                    if (isIII) sData.preReaderIII++;
                    if (isII) sData.preReaderII++;
                    if (isI) sData.preReaderI++;
                });

                const pctFluent = totalStudents > 0 ? Number(((fluentCount / totalStudents) * 100).toFixed(1)) : 0;
                const pctBeginner = totalStudents > 0 ? Number(((beginnerCount / totalStudents) * 100).toFixed(1)) : 0;
                const pctPreReaderIV = totalStudents > 0 ? Number(((preReaderIVCount / totalStudents) * 100).toFixed(1)) : 0;
                const pctPreReaderIII = totalStudents > 0 ? Number(((preReaderIIICount / totalStudents) * 100).toFixed(1)) : 0;
                const pctPreReaderII = totalStudents > 0 ? Number(((preReaderIICount / totalStudents) * 100).toFixed(1)) : 0;
                const pctPreReaderI = totalStudents > 0 ? Number(((preReaderICount / totalStudents) * 100).toFixed(1)) : 0;
                
                const totalPreReaders = preReaderIVCount + preReaderIIICount + preReaderIICount + preReaderICount;
                const pctTotalPreReaders = totalStudents > 0 ? Number(((totalPreReaders / totalStudents) * 100).toFixed(1)) : 0;

                setFluencyStats({
                    participatingSchools: participatingSchoolIds.size,
                    totalStudents,
                    pctFluent,
                    pctBeginner,
                    pctPreReaderIV,
                    pctPreReaderIII,
                    pctPreReaderII,
                    pctPreReaderI,
                    pctTotalPreReaders,
                    fluentCount,
                    beginnerCount,
                    preReaderIVCount,
                    preReaderIIICount,
                    preReaderIICount,
                    preReaderICount,
                    totalPreReaders
                });
                setParticipatingSchoolIdsSet(participatingSchoolIds);

                const computedSchools: SchoolLiteracyStats[] = [];
                schoolStatsMap.forEach((val, key) => {
                    const escolaObj = filteredEscolas.find(e => e.id === key);
                    const schoolName = escolaObj ? escolaObj.nome : 'Escola Não Identificada';
                    const pctSchFluent = val.total > 0 ? Number(((val.fluent / val.total) * 100).toFixed(1)) : 0;
                    const pctSchBeginner = val.total > 0 ? Number(((val.beginner / val.total) * 100).toFixed(1)) : 0;
                    const preReadersTotal = val.preReaderIV + val.preReaderIII + val.preReaderII + val.preReaderI;
                    const pctSchPreReader = val.total > 0 ? Number(((preReadersTotal / val.total) * 100).toFixed(1)) : 0;
                    const pctSchLiterate = val.total > 0 ? Number((((val.fluent + val.beginner) / val.total) * 100).toFixed(1)) : 0;

                    computedSchools.push({
                        schoolId: key,
                        schoolName,
                        total: val.total,
                        fluent: val.fluent,
                        beginner: val.beginner,
                        preReaderIV: val.preReaderIV,
                        preReaderIII: val.preReaderIII,
                        preReaderII: val.preReaderII,
                        preReaderI: val.preReaderI,
                        pctFluent: pctSchFluent,
                        pctBeginner: pctSchBeginner,
                        pctPreReader: pctSchPreReader,
                        pctLiterate: pctSchLiterate
                    });
                });
                
                computedSchools.sort((a, b) => b.pctLiterate - a.pctLiterate || a.schoolName.localeCompare(b.schoolName));
                setSchoolsLiteracy(computedSchools);
            } catch (error) {
                console.error('Error fetching fluency stats:', error);
            }
        };

        fetchFluencyStats();
    }, [filteredEscolas, detalheEscolaId, detalheAno, detalheSerie, detalheTurno, detalheAvaliacao, detalheNivel]);

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

    const handleStudentEvolution = async (studentName: string) => {
        if (!studentName) return;
        setIsLoading(true);
        try {
            const rawRecords = await samahcService.getAllForEvolution(studentName);
            
            const studentRecords = rawRecords.map(r => {
                const escolaObj = Array.isArray(r.escolas) ? r.escolas[0] : (r.escola || r.escolas);
                return {
                    registro: {
                        id: r.id,
                        estudanteNome: r.estudante_nome || r.estudanteNome,
                        anoSerie: r.ano_serie || r.anoSerie,
                        nivelDesempenho: r.nivel_desempenho || r.nivelDesempenho,
                        tipoAvaliacao: r.tipo_avaliacao || r.tipoAvaliacao,
                        ano: r.ano,
                        turno: r.turno,
                        createdAt: r.created_at || r.createdAt
                    } as RegistroFluenciaSAMAHC,
                    escola: {
                        id: r.escola_id,
                        nome: escolaObj?.nome || 'Escola não vinculada'
                    } as Escola
                };
            });

            setSelectedStudentForEvolution({ name: studentName, records: studentRecords });
            setIsEvolutionModalOpen(true);
        } catch (error) {
            console.error('Error fetching student evolution:', error);
            alert('Erro ao carregar o histórico de evolução do estudante.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrintAlfabetometro = async (params: { escolaId: string; escolaNome: string; grade: string; year: number }) => {
        try {
            const records = await samahcService.getPrintRecords(params.escolaId, params.year, params.grade);
            setPrintReportData({
                schoolName: params.escolaNome,
                grade: params.grade,
                year: params.year,
                records: records
            });
            setTimeout(() => {
                window.print();
            }, 300);
        } catch (error) {
            console.error('Error preparing print data:', error);
            alert('Erro ao buscar dados para geração do Alfabetômetro.');
        }
    };

    const renderVisaoGeral = () => {
        // Build card data based on sub-indicator
        const cardData = samahcSubIndicator === 'FLUENCIA' ? [
            { label: 'ESCOLAS PARTICIPANTES', val: fluencyStats.participatingSchools, icon: School, color: 'text-indigo-500', key: 'SEAMA' },
            { label: 'ESTUDANTES AVALIADOS', val: fluencyStats.totalStudents, icon: Users, color: 'text-red-500', key: 'SAEB' },
            { label: 'LEITORES FLUENTES', val: fluencyStats.pctFluent + '%', icon: Activity, color: 'text-orange-500', key: 'FLUENCIA' },
            { label: 'LEITORES INICIANTES', val: fluencyStats.pctBeginner + '%', icon: BookOpen, color: 'text-emerald-500', key: 'PORTUGUES' },
            { label: 'PRÉ-LEITORES', val: fluencyStats.pctTotalPreReaders + '%', icon: TrendingUp, color: 'text-blue-500', key: 'MATEMATICA' },
        ] : [
            { label: 'SIMULADO SEAMA', val: stats.seama, icon: GraduationCap, color: 'text-indigo-500', key: 'SEAMA' },
            { label: 'SIMULADO SAEB', val: stats.saeb, icon: Target, color: 'text-red-500', key: 'SAEB' },
            { label: 'FLUÊNCIA', val: stats.fluencia + '%', icon: Activity, color: 'text-orange-500', key: 'FLUENCIA' },
            { label: 'L. PORTUGUESA', val: stats.lp, icon: BookOpen, color: 'text-emerald-500', key: 'PORTUGUES' },
            { label: 'MATEMÁTICA', val: stats.mat, icon: TrendingUp, color: 'text-blue-500', key: 'MATEMATICA' },
        ];

        // Specific data for Fluency Charts
        const fluencyBarData = [
            { subject: 'Fluentes', A: fluencyStats.pctFluent },
            { subject: 'Iniciantes', A: fluencyStats.pctBeginner },
            { subject: 'Pré-Leitor IV', A: fluencyStats.pctPreReaderIV },
            { subject: 'Pré-Leitor III', A: fluencyStats.pctPreReaderIII },
            { subject: 'Pré-Leitor II', A: fluencyStats.pctPreReaderII },
            { subject: 'Pré-Leitor I', A: fluencyStats.pctPreReaderI },
        ];

        const fluencyPieData = [
            { name: 'Leitores', value: fluencyStats.pctFluent + fluencyStats.pctBeginner, color: '#FF4D00' },
            { name: 'Pré-Leitores', value: fluencyStats.pctTotalPreReaders, color: '#CBD5E1' }
        ];

        const barData = samahcSubIndicator === 'FLUENCIA' ? fluencyBarData : radarData;

        return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {cardData.map((s, i) => (
                    <div key={i} className={`bg-white p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md group ${samahcSubIndicator === s.key ? 'border-orange-400 ring-2 ring-orange-200' : 'border-slate-200'}`}>
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
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="A" name="Média Geral" fill="#FF4D00" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="A" position="top" formatter={(val: any) => `${val}%`} style={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                                </Bar>
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
                            {samahcSubIndicator === 'FLUENCIA' ? (
                                <PieChart>
                                    <Pie
                                        data={fluencyPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                                    >
                                        {fluencyPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            ) : (
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Média" dataKey="A" stroke="#FF4D00" fill="#FF4D00" fillOpacity={0.6} />
                                    <Tooltip />
                                </RadarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )};

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
                        {samahcSubIndicator === 'SEAMA' ? 'Maiores Notas SEAMA' :
                         samahcSubIndicator === 'SAEB' ? 'Maiores Notas SAEB' :
                         samahcSubIndicator === 'PORTUGUES' ? 'Maiores Notas L. Portuguesa' :
                         samahcSubIndicator === 'MATEMATICA' ? 'Maiores Notas Matemática' :
                         'Maiores Taxas de Fluência'}
                    </h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {[...filteredEscolas].sort((a, b) => {
                        const sA = a.dadosEducacionais?.dadosSamahc;
                        const sB = b.dadosEducacionais?.dadosSamahc;
                        const getVal = (s: any) => {
                            if (samahcSubIndicator === 'SEAMA') return s?.simuladoSeama || 0;
                            if (samahcSubIndicator === 'SAEB') return s?.simuladoSaeb || 0;
                            if (samahcSubIndicator === 'PORTUGUES') return s?.linguaPortuguesa || 0;
                            if (samahcSubIndicator === 'MATEMATICA') return s?.matematica || 0;
                            return s?.fluencia || 0;
                        };
                        return getVal(sB) - getVal(sA);
                    }).slice(0, 5).map((e, i) => {
                        const s = e.dadosEducacionais?.dadosSamahc;
                        const val = samahcSubIndicator === 'SEAMA' ? (s?.simuladoSeama || 0) :
                                    samahcSubIndicator === 'SAEB' ? (s?.simuladoSaeb || 0) :
                                    samahcSubIndicator === 'PORTUGUES' ? (s?.linguaPortuguesa || 0) :
                                    samahcSubIndicator === 'MATEMATICA' ? (s?.matematica || 0) :
                                    (s?.fluencia || 0);
                        const suffix = samahcSubIndicator === 'FLUENCIA' ? '%' : '';
                        const labelText = samahcSubIndicator === 'FLUENCIA' ? 'Leitores' :
                                          samahcSubIndicator === 'SEAMA' ? 'Sim. SEAMA' :
                                          samahcSubIndicator === 'SAEB' ? 'Sim. SAEB' :
                                          samahcSubIndicator === 'PORTUGUES' ? 'L. Portuguesa' : 'Matemática';
                        return (
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
                                <p className="text-lg font-black text-slate-800">{val}{suffix}</p>
                                <p className="text-[10px] text-orange-500 font-black uppercase tracking-tighter">{labelText}</p>
                            </div>
                        </div>
                        );
                    })}
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
                        <th className={`pb-4 text-center ${samahcSubIndicator === 'SEAMA' ? 'text-orange-600 bg-orange-50/50' : ''}`}>Simulado Seama</th>
                        <th className={`pb-4 text-center ${samahcSubIndicator === 'SAEB' ? 'text-orange-600 bg-orange-50/50' : ''}`}>Simulado Saeb</th>
                        <th className={`pb-4 text-center ${samahcSubIndicator === 'FLUENCIA' ? 'text-orange-600 bg-orange-50/50' : ''}`}>Fluência %</th>
                        <th className={`pb-4 text-center ${samahcSubIndicator === 'PORTUGUES' ? 'text-orange-600 bg-orange-50/50' : ''}`}>L. Portuguesa</th>
                        <th className={`pb-4 text-center ${samahcSubIndicator === 'MATEMATICA' ? 'text-orange-600 bg-orange-50/50' : ''}`}>Matemática</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {filteredEscolas.filter(e => {
                        // Only show schools that participated in at least one test
                        const s = e.dadosEducacionais?.dadosSamahc;
                        const hasRecords = participatingSchoolIdsSet.has(e.id);
                        const hasData = (s?.simuladoSeama || 0) > 0 || (s?.simuladoSaeb || 0) > 0 || (s?.fluencia || 0) > 0 || (s?.linguaPortuguesa || 0) > 0 || (s?.matematica || 0) > 0;
                        return hasRecords || hasData;
                    }).map(e => (
                        <tr key={e.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-4">
                                <p className="text-sm font-bold text-slate-700 group-hover:text-orange-600 transition-colors">{e.nome}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{(e as any).polo || 'N/A'}</p>
                            </td>
                            <td className={`py-4 text-center font-bold ${samahcSubIndicator === 'SEAMA' ? 'text-orange-600 bg-orange-50/30' : 'text-slate-600'}`}>{e.dadosEducacionais?.dadosSamahc?.simuladoSeama || 0}</td>
                            <td className={`py-4 text-center font-bold ${samahcSubIndicator === 'SAEB' ? 'text-orange-600 bg-orange-50/30' : 'text-slate-600'}`}>{e.dadosEducacionais?.dadosSamahc?.simuladoSaeb || 0}</td>
                            <td className={`py-4 text-center font-bold ${samahcSubIndicator === 'FLUENCIA' ? 'text-orange-600 bg-orange-50/30' : 'text-slate-600'}`}>{e.dadosEducacionais?.dadosSamahc?.fluencia || 0}%</td>
                            <td className={`py-4 text-center font-bold ${samahcSubIndicator === 'PORTUGUES' ? 'text-orange-600 bg-orange-50/30' : 'text-slate-600'}`}>{e.dadosEducacionais?.dadosSamahc?.linguaPortuguesa || 0}</td>
                            <td className={`py-4 text-center font-bold ${samahcSubIndicator === 'MATEMATICA' ? 'text-orange-600 bg-orange-50/30' : 'text-slate-600'}`}>{e.dadosEducacionais?.dadosSamahc?.matematica || 0}</td>
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
                        placeholder="Buscar por estudante..."
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

    const renderAlfabetometro = () => {
        const total = fluencyStats.totalStudents || 1;
        const indexAlfabetizacao = fluencyStats.pctFluent + fluencyStats.pctBeginner;
        
        const filteredSchoolsLiteracy = schoolsLiteracy.filter(s => 
            s.schoolName.toLowerCase().includes(alfabetometroSchoolSearch.toLowerCase())
        );

        const selectedSchoolObj = escolas.find(e => e.id === alfabetometroEscolaId);
        const previewSchoolName = alfabetometroEscolaId === 'Todas' || !selectedSchoolObj
            ? 'Rede Municipal de Ensino'
            : selectedSchoolObj.nome;

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Control Card for Filters & Printing */}
                <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                            {/* UNIDADE ESCOLAR */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                    Selecionar UNIDADE ESCOLAR
                                </label>
                                <select
                                    value={alfabetometroEscolaId}
                                    onChange={e => setAlfabetometroEscolaId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold"
                                >
                                    <option value="Todas">Todas as Escolas (Rede Municipal)</option>
                                    {filteredEscolas.map(e => (
                                        <option key={e.id} value={e.id}>{e.nome}</option>
                                    ))}
                                </select>
                            </div>

                            {/* MODO DE IMPRESSÃO */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                    MODO DE IMPRESSÃO
                                </label>
                                <select
                                    value={alfabetometroModo}
                                    onChange={e => setAlfabetometroModo(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold"
                                >
                                    <option value="page">Uma página (escola ou ano específico)</option>
                                </select>
                            </div>

                            {/* ANO / SÉRIE */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                    Selecionar ANO / SÉRIE
                                </label>
                                <select
                                    value={alfabetometroGrade}
                                    onChange={e => setAlfabetometroGrade(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold"
                                >
                                    <option value="Toda a escola (consolidado)">Toda a escola (consolidado)</option>
                                    {['1º ANO', '2º ANO', '3º ANO', '4º ANO', '5º ANO', '6º ANO', '7º ANO', '8º ANO', '9º ANO', 'EJA', 'MULTI'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* ANO LETIVO */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                    Selecionar ANO LETIVO
                                </label>
                                <select
                                    value={alfabetometroAno}
                                    onChange={e => setAlfabetometroAno(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold"
                                >
                                    {[new Date().getFullYear(), new Date().getFullYear() - 1, 2025, 2024, 2023].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap gap-2">
                            <Button
                                onClick={() => handlePrintAlfabetometro({
                                    escolaId: alfabetometroEscolaId,
                                    escolaNome: previewSchoolName,
                                    grade: alfabetometroGrade,
                                    year: alfabetometroAno
                                })}
                                className="rounded-xl px-5 py-3 text-xs font-bold bg-brand-orange hover:bg-orange-600 shadow-sm flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                GERAR E IMPRIMIR
                            </Button>
                            <Button
                                onClick={() => setIsPrintModalOpen(true)}
                                variant="secondary"
                                className="rounded-xl px-4 py-3 text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 shadow-sm flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4 text-orange-500" />
                                ABRIR MODAL
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Document Live Preview Container (matching Atas Finais layout) */}
                {isLoadingAlfabetometroPreview ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200">
                        <Loader2 className="w-10 h-10 text-brand-orange animate-spin mb-3" />
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Carregando pré-visualização do Alfabetômetro...</p>
                    </div>
                ) : (
                    <div className="bg-slate-100 rounded-3xl border border-slate-200 p-6 overflow-x-auto">
                        <AlfabetometroDocumentView 
                            schoolName={previewSchoolName}
                            grade={alfabetometroGrade}
                            year={alfabetometroAno}
                            records={alfabetometroPreviewRecords}
                            isInline={true}
                        />
                    </div>
                )}

                {/* Top Summary Widget */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Index Card */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                            <GraduationCap className="w-40 h-40 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">ÍNDICE GERAL DE LEITURA</span>
                                <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-bold text-slate-300">
                                    SAMAHC FLUÊNCIA
                                </span>
                            </div>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-tight">Alfabetização & Leitura</h3>
                            <div className="flex items-baseline gap-2 mt-4">
                                <span className="text-5xl font-black text-white tracking-tight">{indexAlfabetizacao.toFixed(1)}%</span>
                                <span className="text-xs text-orange-400 font-bold uppercase">Leitores</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 font-medium">
                                Porcentagem de alunos classificados como Leitores Fluentes ou Leitores Iniciantes.
                            </p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Fluentes: {fluencyStats.pctFluent}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Iniciantes: {fluencyStats.pctBeginner}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar Widget */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                                <TrendingUp className="w-5 h-5 text-orange-500" />
                                Alfabetômetro Geral
                            </h3>
                            <p className="text-xs text-slate-400 uppercase font-black tracking-widest mt-1">
                                Distribuição de estudantes por níveis de desempenho de leitura
                            </p>
                        </div>

                        {/* Large Segmented Bar */}
                        <div className="my-6">
                            <div className="h-8 w-full rounded-xl flex overflow-hidden shadow-inner bg-slate-100">
                                {fluencyStats.pctFluent > 0 && (
                                    <div 
                                        style={{ width: `${fluencyStats.pctFluent}%` }} 
                                        className="bg-emerald-500 hover:opacity-90 transition-opacity flex items-center justify-center text-white text-[10px] font-black"
                                        title={`Leitor Fluente: ${fluencyStats.pctFluent}% (${fluencyStats.fluentCount} alunos)`}
                                    >
                                        {fluencyStats.pctFluent >= 8 && `${fluencyStats.pctFluent}%`}
                                    </div>
                                )}
                                {fluencyStats.pctBeginner > 0 && (
                                    <div 
                                        style={{ width: `${fluencyStats.pctBeginner}%` }} 
                                        className="bg-blue-500 hover:opacity-90 transition-opacity flex items-center justify-center text-white text-[10px] font-black"
                                        title={`Leitor Iniciante: ${fluencyStats.pctBeginner}% (${fluencyStats.beginnerCount} alunos)`}
                                    >
                                        {fluencyStats.pctBeginner >= 8 && `${fluencyStats.pctBeginner}%`}
                                    </div>
                                )}
                                {fluencyStats.pctPreReaderIV > 0 && (
                                    <div 
                                        style={{ width: `${fluencyStats.pctPreReaderIV}%` }} 
                                        className="bg-orange-400 hover:opacity-90 transition-opacity flex items-center justify-center text-white text-[10px] font-black"
                                        title={`Pré-Leitor Nível IV: ${fluencyStats.pctPreReaderIV}% (${fluencyStats.preReaderIVCount} alunos)`}
                                    >
                                        {fluencyStats.pctPreReaderIV >= 8 && `${fluencyStats.pctPreReaderIV}%`}
                                    </div>
                                )}
                                {fluencyStats.pctPreReaderIII > 0 && (
                                    <div 
                                        style={{ width: `${fluencyStats.pctPreReaderIII}%` }} 
                                        className="bg-amber-400 hover:opacity-90 transition-opacity flex items-center justify-center text-slate-800 text-[10px] font-black"
                                        title={`Pré-Leitor Nível III: ${fluencyStats.pctPreReaderIII}% (${fluencyStats.preReaderIIICount} alunos)`}
                                    >
                                        {fluencyStats.pctPreReaderIII >= 8 && `${fluencyStats.pctPreReaderIII}%`}
                                    </div>
                                )}
                                {fluencyStats.pctPreReaderII > 0 && (
                                    <div 
                                        style={{ width: `${fluencyStats.pctPreReaderII}%` }} 
                                        className="bg-rose-400 hover:opacity-90 transition-opacity flex items-center justify-center text-white text-[10px] font-black"
                                        title={`Pré-Leitor Nível II: ${fluencyStats.pctPreReaderII}% (${fluencyStats.preReaderIICount} alunos)`}
                                    >
                                        {fluencyStats.pctPreReaderII >= 8 && `${fluencyStats.pctPreReaderII}%`}
                                    </div>
                                )}
                                {fluencyStats.pctPreReaderI > 0 && (
                                    <div 
                                        style={{ width: `${fluencyStats.pctPreReaderI}%` }} 
                                        className="bg-red-500 hover:opacity-90 transition-opacity flex items-center justify-center text-white text-[10px] font-black"
                                        title={`Pré-Leitor Nível I: ${fluencyStats.pctPreReaderI}% (${fluencyStats.preReaderICount} alunos)`}
                                    >
                                        {fluencyStats.pctPreReaderI >= 8 && `${fluencyStats.pctPreReaderI}%`}
                                    </div>
                                )}
                            </div>

                            {/* Legend Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-4 text-[10px] font-bold text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                                    <span>L. Fluente ({fluencyStats.fluentCount})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                                    <span>L. Iniciante ({fluencyStats.beginnerCount})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 bg-orange-400 rounded-sm" />
                                    <span>P. Leitor IV ({fluencyStats.preReaderIVCount})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 bg-amber-400 rounded-sm" />
                                    <span>P. Leitor III ({fluencyStats.preReaderIIICount})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 bg-rose-400 rounded-sm" />
                                    <span>P. Leitor II ({fluencyStats.preReaderIICount})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 bg-red-500 rounded-sm" />
                                    <span>P. Leitor I ({fluencyStats.preReaderICount})</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-black text-slate-400 border-t border-slate-100 pt-4">
                            <span>TOTAL AVALIADO: {fluencyStats.totalStudents} ALUNOS</span>
                            <span>{fluencyStats.participatingSchools} ESCOLAS PARTICIPANTES</span>
                        </div>
                    </div>
                </div>

                {/* Level Detail Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Leitor Fluente Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 rounded-xl">
                                <GraduationCap className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-slate-800">{fluencyStats.pctFluent}%</span>
                                <p className="text-[10px] font-bold text-slate-400">{fluencyStats.fluentCount} Alunos</p>
                            </div>
                        </div>
                        <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">Leitor Fluente</h4>
                        <p className="text-xs text-slate-500 mt-2 flex-grow leading-relaxed">
                            Lê com ritmo, precisão e entonação adequados. Demonstra compreensão global do texto e vocabulário amplo.
                        </p>
                        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${fluencyStats.pctFluent}%` }} />
                        </div>
                    </div>

                    {/* Leitor Iniciante Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-slate-800">{fluencyStats.pctBeginner}%</span>
                                <p className="text-[10px] font-bold text-slate-400">{fluencyStats.beginnerCount} Alunos</p>
                            </div>
                        </div>
                        <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">Leitor Iniciante</h4>
                        <p className="text-xs text-slate-500 mt-2 flex-grow leading-relaxed">
                            Lê sílabas, palavras ou frases simples de forma pausada ou silabada. Está em fase de consolidação do processo de decodificação.
                        </p>
                        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${fluencyStats.pctBeginner}%` }} />
                        </div>
                    </div>

                    {/* Pré-Leitor IV Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-orange-50 rounded-xl">
                                <Users className="w-6 h-6 text-orange-500" />
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-slate-800">{fluencyStats.pctPreReaderIV}%</span>
                                <p className="text-[10px] font-bold text-slate-400">{fluencyStats.preReaderIVCount} Alunos</p>
                            </div>
                        </div>
                        <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">Pré-Leitor Nível IV</h4>
                        <p className="text-xs text-slate-500 mt-2 flex-grow leading-relaxed">
                            Identifica a maioria das letras do alfabeto e consegue ler palavras simples isoladas. Lê pequenos grupos de sílabas.
                        </p>
                        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-orange-400 h-full rounded-full transition-all duration-500" style={{ width: `${fluencyStats.pctPreReaderIV}%` }} />
                        </div>
                    </div>

                    {/* Pré-Leitor III Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 rounded-xl">
                                <Users className="w-6 h-6 text-amber-500" />
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-slate-800">{fluencyStats.pctPreReaderIII}%</span>
                                <p className="text-[10px] font-bold text-slate-400">{fluencyStats.preReaderIIICount} Alunos</p>
                            </div>
                        </div>
                        <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">Pré-Leitor Nível III</h4>
                        <p className="text-xs text-slate-500 mt-2 flex-grow leading-relaxed">
                            Reconhece o som de várias consoantes e lê sílabas simples isoladas. Associa fonemas e grafemas com alguma frequência.
                        </p>
                        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${fluencyStats.pctPreReaderIII}%` }} />
                        </div>
                    </div>

                    {/* Pré-Leitor II Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-rose-50 rounded-xl">
                                <Users className="w-6 h-6 text-rose-500" />
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-slate-800">{fluencyStats.pctPreReaderII}%</span>
                                <p className="text-[10px] font-bold text-slate-400">{fluencyStats.preReaderIICount} Alunos</p>
                            </div>
                        </div>
                        <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">Pré-Leitor Nível II</h4>
                        <p className="text-xs text-slate-500 mt-2 flex-grow leading-relaxed">
                            Reconhece principalmente as vogais e algumas consoantes de seu próprio nome ou contexto próximo.
                        </p>
                        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-rose-400 h-full rounded-full transition-all duration-500" style={{ width: `${fluencyStats.pctPreReaderII}%` }} />
                        </div>
                    </div>

                    {/* Pré-Leitor I Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-50 rounded-xl">
                                <Users className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-slate-800">{fluencyStats.pctPreReaderI}%</span>
                                <p className="text-[10px] font-bold text-slate-400">{fluencyStats.preReaderICount} Alunos</p>
                            </div>
                        </div>
                        <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">Pré-Leitor Nível I</h4>
                        <p className="text-xs text-slate-500 mt-2 flex-grow leading-relaxed">
                            Ainda não associa de forma consistente as letras aos sons. Fase inicial de apropriação do sistema de escrita alfabético.
                        </p>
                        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${fluencyStats.pctPreReaderI}%` }} />
                        </div>
                    </div>
                </div>

                {/* Table of Literacy by School */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                    <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                                <School className="w-5 h-5 text-orange-500" />
                                Alfabetômetro por Unidade Escolar
                            </h3>
                            <p className="text-xs text-slate-400 uppercase font-black tracking-widest mt-1">
                                Desempenho e proporção de leitores por escola filtrada
                            </p>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar escola..."
                                value={alfabetometroSchoolSearch}
                                onChange={(e) => setAlfabetometroSchoolSearch(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                    <th className="px-6 py-4">Escola</th>
                                    <th className="px-4 py-4 text-center">Avaliados</th>
                                    <th className="px-6 py-4">Distribuição do Alfabetômetro</th>
                                    <th className="px-4 py-4 text-center">Leitores</th>
                                    <th className="px-4 py-4 text-center">Pré-Leitores</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSchoolsLiteracy.length > 0 ? (
                                    filteredSchoolsLiteracy.map((sch) => (
                                        <tr key={sch.schoolId} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-800">{sch.schoolName}</p>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-slate-600">
                                                {sch.total}
                                            </td>
                                            <td className="px-6 py-4 min-w-[280px]">
                                                {/* Mini Segmented Bar */}
                                                <div className="h-4 w-full rounded-md flex overflow-hidden bg-slate-100 shadow-inner">
                                                    {sch.fluent > 0 && (
                                                        <div 
                                                            style={{ width: `${sch.pctFluent}%` }} 
                                                            className="bg-emerald-500" 
                                                            title={`Leitor Fluente: ${sch.pctFluent}% (${sch.fluent} alunos)`} 
                                                        />
                                                    )}
                                                    {sch.beginner > 0 && (
                                                        <div 
                                                            style={{ width: `${sch.pctBeginner}%` }} 
                                                            className="bg-blue-500" 
                                                            title={`Leitor Iniciante: ${sch.pctBeginner}% (${sch.beginner} alunos)`} 
                                                        />
                                                    )}
                                                    {sch.preReaderIV > 0 && (
                                                        <div 
                                                            style={{ width: `${(sch.preReaderIV / sch.total) * 100}%` }} 
                                                            className="bg-orange-400" 
                                                            title={`Pré-Leitor Nível IV: ${((sch.preReaderIV / sch.total) * 100).toFixed(1)}% (${sch.preReaderIV} alunos)`} 
                                                        />
                                                    )}
                                                    {sch.preReaderIII > 0 && (
                                                        <div 
                                                            style={{ width: `${(sch.preReaderIII / sch.total) * 100}%` }} 
                                                            className="bg-amber-400" 
                                                            title={`Pré-Leitor Nível III: ${((sch.preReaderIII / sch.total) * 100).toFixed(1)}% (${sch.preReaderIII} alunos)`} 
                                                        />
                                                    )}
                                                    {sch.preReaderII > 0 && (
                                                        <div 
                                                            style={{ width: `${(sch.preReaderII / sch.total) * 100}%` }} 
                                                            className="bg-rose-400" 
                                                            title={`Pré-Leitor Nível II: ${((sch.preReaderII / sch.total) * 100).toFixed(1)}% (${sch.preReaderII} alunos)`} 
                                                        />
                                                    )}
                                                    {sch.preReaderI > 0 && (
                                                        <div 
                                                            style={{ width: `${(sch.preReaderI / sch.total) * 100}%` }} 
                                                            className="bg-red-500" 
                                                            title={`Pré-Leitor Nível I: ${((sch.preReaderI / sch.total) * 100).toFixed(1)}% (${sch.preReaderI} alunos)`} 
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-black ${
                                                    sch.pctLiterate >= 60 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                    sch.pctLiterate >= 30 ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                    'bg-red-50 text-red-700 border border-red-100'
                                                }`}>
                                                    {sch.pctLiterate}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-slate-500">
                                                {sch.pctPreReader}%
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                                            Nenhuma escola encontrada para a busca "{alfabetometroSchoolSearch}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

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
                        {['VISÃO GERAL', 'RANKINGS', 'COMPARATIVO', 'DETALHAMENTO', 'ALFABETÔMETRO'].map(v => (
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

            {/* Filtros Avançados (Compartilhados entre todas as views) */}
            {samahcSubIndicator === 'FLUENCIA' && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Escola</label>
                    <div className="relative">
                        <select 
                            value={detalheEscolaId}
                            onChange={(e) => setDetalheEscolaId(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 appearance-none"
                        >
                            <option value="Todas">Todas as Escolas</option>
                            {filteredEscolas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ano</label>
                    <div className="relative">
                        <select 
                            value={detalheAno}
                            onChange={(e) => setDetalheAno(Number(e.target.value))}
                            className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 appearance-none"
                        >
                            <option value={0}>Todos</option>
                            <option value={2025}>2025</option>
                            <option value={2024}>2024</option>
                            <option value={2023}>2023</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Série</label>
                    <div className="relative">
                        <select 
                            value={detalheSerie}
                            onChange={(e) => setDetalheSerie(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 appearance-none"
                        >
                            <option value="Todas">Todas</option>
                            {['1º ANO', '2º ANO', '3º ANO', '4º ANO', '5º ANO', '6º ANO', '7º ANO', '8º ANO', '9º ANO', 'EJA', 'MULTI'].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Turno</label>
                    <div className="relative">
                        <select 
                            value={detalheTurno}
                            onChange={(e) => setDetalheTurno(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 appearance-none"
                        >
                            <option value="Todos">Todos</option>
                            {['MATUTINO', 'VESPERTINO', 'INTEGRAL', 'A DEFINIR'].map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Avaliação</label>
                    <div className="relative">
                        <select 
                            value={detalheAvaliacao}
                            onChange={(e) => setDetalheAvaliacao(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 appearance-none"
                        >
                            <option value="Todas">Todas</option>
                            {['DIAGNÓSTICA', 'FORMATIVA', 'SOMATIVA'].map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nível</label>
                    <div className="relative">
                        <select 
                            value={detalheNivel}
                            onChange={(e) => setDetalheNivel(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 appearance-none"
                        >
                            <option value="Todos">Todos</option>
                            {['LEITOR FLUENTE', 'LEITOR INICIANTE', 'PRÉ-LEITOR | NÍVEL I', 'PRÉ-LEITOR | NÍVEL II', 'PRÉ-LEITOR | NÍVEL III', 'PRÉ-LEITOR | NÍVEL IV', 'NÃO AVALIADO'].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>
            )}

            <div className="mt-8">
                {activeView === 'VISÃO GERAL' && renderVisaoGeral()}
                {activeView === 'RANKINGS' && renderRankings()}
                {activeView === 'COMPARATIVO' && renderComparativo()}
                {activeView === 'DETALHAMENTO' && renderDetalhamento()}
                {activeView === 'ALFABETÔMETRO' && renderAlfabetometro()}
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

            {isPrintModalOpen && (
                <PrintableAlfabetometroModal 
                    isOpen={isPrintModalOpen}
                    onClose={() => setIsPrintModalOpen(false)}
                    escolas={escolas}
                    defaultEscolaId={detalheEscolaId !== 'Todas' ? detalheEscolaId : ''}
                    defaultAno={detalheAno || new Date().getFullYear()}
                    onPrint={handlePrintAlfabetometro}
                />
            )}

            {printReportData && (
                <PrintableAlfabetometroReport 
                    isOpen={true}
                    schoolName={printReportData.schoolName}
                    grade={printReportData.grade}
                    year={printReportData.year}
                    records={printReportData.records}
                />
            )}
        </div>
    );
};
