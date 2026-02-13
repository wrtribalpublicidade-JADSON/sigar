import React, { useState, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Escola, RegistroCNCA } from '../types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, ComposedChart, Line, LineChart
} from 'recharts';
import {
    TrendingUp, Award, Users, Filter, Calendar, MapPin,
    ClipboardCheck, Info, ChevronDown, LayoutDashboard, History as HistoryIcon, GraduationCap, School, BookOpen, UserX,
    Map as MapIcon, UserCheck, Layers, Target, Activity
} from 'lucide-react';

interface CncaPnraDashboardProps {
    escolas: Escola[];
}

const COLORS = {
    adequado: '#FF4D00',      // Brand Orange
    intermediario: '#000000',  // Black
    defasagem: '#71717A',      // Zinc 600
};

type TabType = 'GERAL' | 'EVOLUCAO' | 'TURMAS';

export const CncaPnraDashboard: React.FC<CncaPnraDashboardProps> = ({ escolas = [] }) => {
    const [activeTab, setActiveTab] = useState<TabType>('GERAL');

    // Filtros
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedPolo, setSelectedPolo] = useState<string>('Todos');
    const [selectedEscola, setSelectedEscola] = useState<string>('Todas');
    const [selectedAvaliacao, setSelectedAvaliacao] = useState<string>('Todas');
    const [selectedLocalidade, setSelectedLocalidade] = useState<string>('Todas');
    const [selectedCoordenador, setSelectedCoordenador] = useState<string>('Todos');
    const [selectedTipoTurma, setSelectedTipoTurma] = useState<string>('Todos');
    const [selectedComponente, setSelectedComponente] = useState<string>('Todos');
    const [selectedSerie, setSelectedSerie] = useState<string>('Todas');
    const [showFilters, setShowFilters] = useState(true);

    // Consolidar registros
    const allRecords = useMemo(() => {
        const records: any[] = [];
        escolas?.forEach(escola => {
            escola?.dadosEducacionais?.registrosCNCA?.forEach(reg => {
                records.push({
                    ...reg,
                    escolaNome: escola.nome || 'Escola sem nome',
                    localizacao: escola.localizacao || 'N/A',
                    coordenadorEscola: escola.coordenador || 'N/A'
                });
            });
        });
        return records;
    }, [escolas]);

    // Opções de filtro
    const filterOptions = useMemo(() => {
        const years = Array.from(new Set(allRecords.map(r => r.ano))).sort((a, b) => b - a);
        const polos = Array.from(new Set(allRecords.map(r => r.polo))).sort();
        const names = Array.from(new Set(allRecords.map(r => r.escolaNome))).sort();
        const coords = Array.from(new Set(allRecords.map(r => r.coordenadorEscola))).sort();
        const components = Array.from(new Set(allRecords.map(r => r.componenteCurricular))).sort();
        const series = Array.from(new Set(allRecords.map(r => r.anoSerie))).sort();
        const types = Array.from(new Set(allRecords.map(r => r.tipoTurma))).sort();

        return {
            years: years.length > 0 ? years : [2024, 2025, 2026],
            polos: ['Todos', ...polos],
            escolas: ['Todas', ...names],
            localidades: ['Todas', 'Sede', 'Zona Rural'],
            coordenadores: ['Todos', ...coords],
            componentes: ['Todos', ...components],
            series: ['Todas', ...series],
            tiposTurma: ['Todos', ...types]
        };
    }, [allRecords]);

    // Filtragem
    const filteredRecords = useMemo(() => {
        return allRecords.filter(r => {
            const matchYear = r.ano === selectedYear;
            const matchPolo = selectedPolo === 'Todos' || r.polo === selectedPolo;
            const matchEscola = selectedEscola === 'Todas' || r.escolaNome === selectedEscola;
            const matchAval = selectedAvaliacao === 'Todas' || r.tipoAvaliacao === selectedAvaliacao;
            const matchLocal = selectedLocalidade === 'Todas' || r.localizacao === selectedLocalidade;
            const matchCoord = selectedCoordenador === 'Todos' || r.coordenadorEscola === selectedCoordenador;
            const matchTurma = selectedTipoTurma === 'Todos' || r.tipoTurma === selectedTipoTurma;
            const matchComp = selectedComponente === 'Todos' || r.componenteCurricular === selectedComponente;
            const matchSerie = selectedSerie === 'Todas' || r.anoSerie === selectedSerie;

            return matchYear && matchPolo && matchEscola && matchAval && matchLocal && matchCoord && matchTurma && matchComp && matchSerie;
        });
    }, [allRecords, selectedYear, selectedPolo, selectedEscola, selectedAvaliacao, selectedLocalidade, selectedCoordenador, selectedTipoTurma, selectedComponente, selectedSerie]);

    // Cálculos Gerais
    const analysisData = useMemo(() => {
        const calc = (regs: any[]) => {
            const total = regs.length;
            if (total === 0) return { ade: 0, int: 0, def: 0, pAde: 0, pInt: 0, pDef: 0, totalPrev: 0, totalAval: 0, adeCount: 0, intCount: 0, defCount: 0 };

            const sumAde = regs.reduce((acc, r) => acc + (r.aprendizadoAdequado || 0), 0);
            const sumInt = regs.reduce((acc, r) => acc + (r.aprendizadoIntermediario || 0), 0);
            const sumDef = regs.reduce((acc, r) => acc + (r.defasagem || 0), 0);
            const totalPrev = regs.reduce((acc, r) => acc + (r.estudantesPrevistos || 0), 0);
            const totalAval = regs.reduce((acc, r) => acc + (r.estudantesAvaliados || 0), 0);

            // Absolute counts based on averages (since records are already grouped/filtered)
            const adeCount = Math.round((sumAde / 100) * (totalAval / (total || 1)));
            const intCount = Math.round((sumInt / 100) * (totalAval / (total || 1)));
            const defCount = Math.round((sumDef / 100) * (totalAval / (total || 1)));

            return {
                ade: Number((sumAde / total).toFixed(1)),
                int: Number((sumInt / total).toFixed(1)),
                def: Number((sumDef / total).toFixed(1)),
                pAde: Number((sumAde / total).toFixed(1)),
                pInt: Number((sumInt / total).toFixed(1)),
                pDef: Number((sumDef / total).toFixed(1)),
                totalPrev,
                totalAval,
                adeCount,
                intCount,
                defCount
            };
        };

        const currentRegs = selectedAvaliacao === 'Todas' ?
            (filteredRecords.filter(r => r.tipoAvaliacao === 'Somativa').length > 0 ? filteredRecords.filter(r => r.tipoAvaliacao === 'Somativa') : filteredRecords) :
            filteredRecords;

        return { kpis: calc(currentRegs) };
    }, [filteredRecords, selectedAvaliacao]);

    // Dados Gráficos Visão Geral
    const chartData = useMemo(() => {
        const kpiRegs = selectedAvaliacao === 'Todas' ?
            (filteredRecords.filter(r => r.tipoAvaliacao === 'Somativa').length > 0 ? filteredRecords.filter(r => r.tipoAvaliacao === 'Somativa') : filteredRecords) :
            filteredRecords;

        const schoolMap = new Map();
        kpiRegs.forEach(r => {
            const cur = schoolMap.get(r.escolaNome) || { ade: 0, int: 0, def: 0, count: 0 };
            cur.ade += (r.aprendizadoAdequado || 0);
            cur.int += (r.aprendizadoIntermediario || 0);
            cur.def += (r.defasagem || 0);
            cur.count += 1;
            schoolMap.set(r.escolaNome, cur);
        });

        const volume = Array.from(schoolMap.entries()).map(([name, c]) => ({
            name: (name || '').length > 12 ? name.substring(0, 10) + '..' : name,
            Adequado: Number((c.ade / c.count).toFixed(1)),
            Intermediário: Number((c.int / c.count).toFixed(1)),
            Defasagem: Number((c.def / c.count).toFixed(1))
        })).sort((a, b) => b.Adequado - a.Adequado);

        const donut = [
            { name: 'Adequado', value: analysisData.kpis.ade, color: COLORS.adequado },
            { name: 'Intermediário', value: analysisData.kpis.int, color: COLORS.intermediario },
            { name: 'Defasagem', value: analysisData.kpis.def, color: COLORS.defasagem }
        ];

        return { volume, donut };
    }, [filteredRecords, selectedAvaliacao, analysisData.kpis]);

    const ranking = useMemo(() => {
        const kpiRegs = selectedAvaliacao === 'Todas' ?
            (filteredRecords.filter(r => r.tipoAvaliacao === 'Somativa').length > 0 ? filteredRecords.filter(r => r.tipoAvaliacao === 'Somativa') : filteredRecords) :
            filteredRecords;

        const names = Array.from(new Set(kpiRegs.map(r => r.escolaNome)));
        return names.map(name => {
            const regs = kpiRegs.filter(r => r.escolaNome === name);
            const avg = (field: keyof RegistroCNCA) => {
                const sum = regs.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
                return regs.length > 0 ? Number((sum / regs.length).toFixed(1)) : 0;
            };

            return {
                name,
                ade: avg('aprendizadoAdequado'),
                int: avg('aprendizadoIntermediario'),
                def: avg('defasagem'),
                prev: regs.reduce((acc, r) => acc + (r.estudantesPrevistos || 0), 0),
                aval: regs.reduce((acc, r) => acc + (r.estudantesAvaliados || 0), 0)
            };
        }).sort((a, b) => b.ade - a.ade);
    }, [filteredRecords, selectedAvaliacao]);

    const evolutionAnalysis = useMemo(() => {
        const periods = Array.from(new Set(allRecords.map(r => `${r.ano}|${r.tipoAvaliacao}`)))
            .sort((a, b) => {
                const [yA, tA] = a.split('|');
                const [yB, tB] = b.split('|');
                if (yA !== yB) return Number(yA) - Number(yB);
                const order = { 'Diagnóstica': 1, 'Formativa': 2, 'Somativa': 3 };
                return (order[tA as keyof typeof order] || 0) - (order[tB as keyof typeof order] || 0);
            });

        const timelineData = periods.map(p => {
            const [year, type] = p.split('|');
            const regs = allRecords.filter(r => r.ano === Number(year) && r.tipoAvaliacao === type);

            const finalRegs = regs.filter(r => {
                const matchPolo = selectedPolo === 'Todos' || r.polo === selectedPolo;
                const matchEscola = selectedEscola === 'Todas' || r.escolaNome === selectedEscola;
                const matchLocal = selectedLocalidade === 'Todas' || r.localizacao === selectedLocalidade;
                const matchCoord = selectedCoordenador === 'Todos' || r.coordenadorEscola === selectedCoordenador;
                const matchTurma = selectedTipoTurma === 'Todos' || r.tipoTurma === selectedTipoTurma;
                const matchComp = selectedComponente === 'Todos' || r.componenteCurricular === selectedComponente;
                const matchSerie = selectedSerie === 'Todas' || r.anoSerie === selectedSerie;
                return matchPolo && matchEscola && matchLocal && matchCoord && matchTurma && matchComp && matchSerie;
            });

            const avg = (field: string) => {
                const sum = finalRegs.reduce((acc, r) => acc + (r[field as keyof RegistroCNCA] as number || 0), 0);
                return finalRegs.length > 0 ? Number((sum / finalRegs.length).toFixed(1)) : 0;
            };

            const label = `${year.substring(2)} - ${type.substring(0, 4)}`;

            return {
                period: p, display: label,
                ade: avg('aprendizadoAdequado'),
                int: avg('aprendizadoIntermediario'),
                def: avg('defasagem'),
                count: finalRegs.length
            };
        }).filter(d => d.count > 0);

        const first = timelineData[0];
        const last = timelineData[timelineData.length - 1];
        const deltaAde = last && first ? (last.ade - first.ade) : 0;
        const avgAde = timelineData.length > 0 ? timelineData.reduce((acc, d) => acc + d.ade, 0) / timelineData.length : 0;

        return { timelineData, deltaAde, avgAde };
    }, [allRecords, selectedPolo, selectedEscola, selectedLocalidade, selectedCoordenador, selectedTipoTurma, selectedComponente, selectedSerie]);

    const classAnalysis = useMemo(() => {
        const classMap = new Map();
        filteredRecords.forEach(r => {
            const key = `${r.escolaNome}|${r.anoSerie}|${r.componenteCurricular}`;
            const cur = classMap.get(key) || { escola: r.escolaNome, serie: r.anoSerie, comp: r.componenteCurricular, ade: 0, int: 0, def: 0, count: 0, aval: 0, prev: 0 };
            cur.ade += (r.aprendizadoAdequado || 0);
            cur.int += (r.aprendizadoIntermediario || 0);
            cur.def += (r.defasagem || 0);
            cur.aval += (r.estudantesAvaliados || 0);
            cur.prev += (r.estudantesPrevistos || 0);
            cur.count += 1;
            classMap.set(key, cur);
        });
        return Array.from(classMap.values()).map(c => ({
            ...c,
            label: `${c.serie} - ${c.comp}`,
            pAde: Number((c.ade / c.count).toFixed(1)),
            pInt: Number((c.int / c.count).toFixed(1)),
            pDef: Number((c.def / c.count).toFixed(1))
        })).sort((a, b) => b.pAde - a.pAde);
    }, [filteredRecords]);

    const renderGeral = () => (
        <div className="space-y-8 animate-fade-in relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Participação', val: Math.round((analysisData.kpis.totalAval / (analysisData.kpis.totalPrev || 1)) * 100) + '%', icon: Users, color: 'bg-slate-900', iconColor: 'text-brand-orange', p: 'Aproveitamento', count: analysisData.kpis.totalAval },
                    { label: 'Aprendizado Adequado', val: analysisData.kpis.ade + '%', icon: GraduationCap, color: 'bg-brand-acid', iconColor: 'text-brand-black', p: 'ADEQ_RT', count: analysisData.kpis.adeCount },
                    { label: 'I. Intermediário', val: analysisData.kpis.int + '%', icon: BookOpen, color: 'bg-brand-orange', iconColor: 'text-white', p: 'INT_RT', count: analysisData.kpis.intCount },
                    { label: 'Defasagem', val: analysisData.kpis.def + '%', icon: UserX, color: 'bg-brand-signal', iconColor: 'text-white', p: 'ALERT', count: analysisData.kpis.defCount }
                ].map((k, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                        <span className="absolute top-4 right-4 text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{k.p}</span>
                        {k.count !== undefined && (
                            <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                {k.count} Alunos
                            </span>
                        )}
                        <div className={`w-12 h-12 ${k.color} rounded-xl flex items-center justify-center shadow-lg mb-4 mt-4 group-hover:scale-110 transition-transform duration-300`}>
                            <k.icon className={`w-6 h-6 ${k.iconColor}`} />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{k.label}</p>
                        <p className="text-4xl font-black text-slate-800 tracking-tight">{k.val}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-slate-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Desempenho Médio por Escola (%)</h3>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.volume}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} stroke="#64748b" />
                                <YAxis tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} unit="%" stroke="#64748b" />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 500 }} />
                                <Bar dataKey="Adequado" stackId="a" fill={COLORS.adequado} radius={[0, 0, 4, 4]} />
                                <Bar dataKey="Intermediário" stackId="a" fill={COLORS.intermediario} radius={0} />
                                <Bar dataKey="Defasagem" stackId="a" fill={COLORS.defasagem} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center relative">
                    <h3 className="font-bold text-slate-800 text-lg mb-8 w-full text-center">Composição de Aprendizado</h3>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData.donut} innerRadius={80} outerRadius={105} paddingAngle={4} dataKey="value" stroke="none" cornerRadius={4}>
                                    {chartData.donut.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-4xl font-black text-slate-800 tracking-tight">{Math.round(analysisData.kpis.ade)}%</p>
                            <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mt-1">Adequado</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-8 w-full border-t border-slate-100 pt-6">
                        {chartData.donut.map((d, i) => (
                            <div key={i} className="flex flex-col items-center text-center border-r last:border-0 border-slate-100">
                                <span className="text-xs font-medium text-slate-400 uppercase">{d.name}</span>
                                <span className="text-lg font-bold text-slate-800">{d.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card-technical overflow-hidden p-1">
                <div className="bg-slate-900 p-6 flex items-center justify-between border-b-2 border-brand-black">
                    <div className="flex items-center gap-3 text-white uppercase font-black tracking-widest text-sm">
                        <Award className="w-6 h-6 text-brand-orange" strokeWidth={3} />
                        Ranking de Unidades Escolares / CNCA
                    </div>
                </div>
                <div className="overflow-x-auto bg-white">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b-2 border-brand-black">
                            <tr className="font-mono text-[10px] font-black uppercase tracking-widest text-brand-grey">
                                <th className="px-8 py-4">Pos</th>
                                <th className="px-8 py-4 text-left">Unidade Escolar</th>
                                <th className="px-6 py-4 text-center bg-brand-orange/10">Adequado</th>
                                <th className="px-6 py-4 text-center">Intermediário</th>
                                <th className="px-4 py-4 text-center">Defasagem</th>
                                <th className="px-8 py-4 text-right">Particip.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-black/10">
                            {ranking.map((s, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-all font-mono text-xs uppercase">
                                    <td className="px-8 py-5"><span className={`inline-flex w-8 h-8 items-center justify-center font-black border-2 border-brand-black ${idx === 0 ? 'bg-brand-acid text-brand-black' : idx === 1 ? 'bg-slate-200' : idx === 2 ? 'bg-brand-orange text-white' : 'bg-white'}`}>{idx + 1}</span></td>
                                    <td className="px-8 py-5 font-black text-brand-black">{s.name}</td>
                                    <td className="px-6 py-5 text-center bg-brand-orange/[0.02] text-sm font-black text-brand-orange">{s.ade}%</td>
                                    <td className="px-6 py-5 text-center">{s.int}%</td>
                                    <td className="px-4 py-5 text-center text-brand-signal">{s.def}%</td>
                                    <td className="px-8 py-5 text-right text-brand-grey font-bold">{s.aval} / {s.prev}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderEvolucao = () => (
        <div className="space-y-8 animate-fade-in relative">
            <div className="card-technical p-1">
                <div className="bg-white p-8">
                    <div className="flex items-center gap-4 mb-10 text-brand-black">
                        <TrendingUp className="w-10 h-10 text-brand-orange" strokeWidth={3} />
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Tendência Histórica de Aprendizado</h3>
                            <p className="font-mono text-[9px] text-brand-grey font-black uppercase tracking-widest mt-1">Diagnóstica ➔ Formativa ➔ Somativa</p>
                        </div>
                    </div>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={evolutionAnalysis.timelineData}>
                                <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.1)" />
                                <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '2px solid #FF4D00', color: '#fff' }} />
                                <Legend verticalAlign="top" iconType="rect" align="center" wrapperStyle={{ paddingBottom: '30px', fontFamily: 'JetBrains Mono', fontSize: '9px', fontWeight: 'bold' }} />
                                <Line type="monotone" dataKey="ade" name="Adequado" stroke={COLORS.adequado} strokeWidth={5} dot={{ r: 6, fill: COLORS.adequado, stroke: '#fff' }} />
                                <Line type="monotone" dataKey="int" name="Intermediário" stroke={COLORS.intermediario} strokeWidth={3} strokeDasharray="5 5" />
                                <Line type="monotone" dataKey="def" name="Defasagem" stroke="#71717A" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTurmas = () => (
        <div className="space-y-8 animate-fade-in relative">
            <div className="card-technical p-1 overflow-hidden">
                <div className="bg-slate-900 p-6 flex items-center justify-between border-b-2 border-brand-black">
                    <div className="flex items-center gap-3 text-white uppercase font-black tracking-widest text-sm">
                        <Layers className="w-6 h-6 text-brand-orange" strokeWidth={3} />
                        Performance Detalhada por Turma e Componente
                    </div>
                </div>
                <div className="overflow-x-auto bg-white">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b-2 border-brand-black">
                            <tr className="font-mono text-[9px] font-black text-brand-grey uppercase tracking-widest">
                                <th className="px-8 py-5">Unidade / Turma / Componente</th>
                                <th className="px-6 py-5 text-center">PRS</th>
                                <th className="px-6 py-4 text-center bg-brand-acid/10">Adequado</th>
                                <th className="px-6 py-4 text-center bg-brand-orange/10">Interméd.</th>
                                <th className="px-6 py-4 text-center">Defasagem</th>
                                <th className="px-8 py-5 text-right bg-slate-900 text-white">Indice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-black/10">
                            {classAnalysis.map((c, i) => (
                                <tr key={i} className="group hover:bg-slate-50 transition-all font-mono text-xs uppercase">
                                    <td className="px-8 py-6 font-black">
                                        <div className="text-brand-black text-sm mb-1">{c.label}</div>
                                        <div className="text-brand-grey text-[9px]">{c.escola}</div>
                                    </td>
                                    <td className="px-6 py-6 text-center">{c.aval}</td>
                                    <td className="px-6 py-6 text-center font-black text-brand-acid">{c.pAde}%</td>
                                    <td className="px-6 py-6 text-center font-black text-brand-orange">{c.pInt}%</td>
                                    <td className="px-6 py-6 text-center text-brand-grey">{c.pDef}%</td>
                                    <td className="px-8 py-6 text-right font-black text-sm">{c.pAde}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const donut = chartData.donut;

    return (
        <div className="space-y-8 pb-20 animate-fade-in relative">
            <PageHeader
                title="Análise CNCA"
                subtitle="Monitoramento Institucional Qualitativo"
                icon={Target}
                badgeText="Monitoramento de Aprendizado"
                actions={[]}
            />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 mb-8 flex flex-wrap gap-2">
                {[
                    { id: 'GERAL', label: 'VISÃO GERAL', icon: Target },
                    { id: 'EVOLUCAO', label: 'EVOLUÇÃO', icon: HistoryIcon },
                    { id: 'TURMAS', label: 'RANKING', icon: Award }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as TabType)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-orange-400' : ''}`} />
                        {t.label}
                    </button>
                ))}
            </div>

            {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'Unidade', val: selectedEscola, set: setSelectedEscola, opts: filterOptions.escolas },
                        { label: 'Ano', val: selectedYear, set: (v: any) => setSelectedYear(Number(v)), opts: filterOptions.years },
                        { label: 'Avaliação', val: selectedAvaliacao, set: setSelectedAvaliacao, opts: ['Todas', 'Diagnóstica', 'Formativa', 'Somativa'] },
                        { label: 'Componente', val: selectedComponente, set: setSelectedComponente, opts: filterOptions.componentes },
                        { label: 'Série', val: selectedSerie, set: setSelectedSerie, opts: filterOptions.series },
                        { label: 'Polo', val: selectedPolo, set: setSelectedPolo, opts: filterOptions.polos },
                        { label: 'Localidade', val: selectedLocalidade, set: setSelectedLocalidade, opts: filterOptions.localidades },
                        { label: 'Regional', val: selectedCoordenador, set: setSelectedCoordenador, opts: filterOptions.coordenadores }
                    ].map((f, i) => (
                        <div key={i}>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{f.label}</label>
                            <div className="relative">
                                <select value={f.val} onChange={e => f.set(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm font-medium text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 appearance-none shadow-sm pb-2.5">
                                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    ))}
                </div>
            )
            }

            <div className="mt-12">
                {activeTab === 'GERAL' && renderGeral()}
                {activeTab === 'EVOLUCAO' && renderEvolucao()}
                {activeTab === 'TURMAS' && renderTurmas()}
            </div>
        </div>
    );
};
