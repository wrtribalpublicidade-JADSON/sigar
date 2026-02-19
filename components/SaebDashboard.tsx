import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from './ui/PageHeader';
import { ChevronDown } from 'lucide-react';
import { Escola, RegistroSAEB } from '../types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Line, LineChart
} from 'recharts';
import {
    TrendingUp, Award, Users, Filter, Calendar, MapPin,
    ClipboardCheck, LayoutDashboard, GraduationCap, School, BookOpen, UserX,
    Map as MapIcon, UserCheck, Layers, Target, Activity, History as HistoryIcon,
    ClipboardList, Search, BarChart3
} from 'lucide-react';

interface SaebDashboardProps {
    escolas: Escola[];
}

const COLORS = {
    avançado: '#000000',     // Black
    proficiente: '#FF4D00',  // Brand Orange
    basico: '#52525B',       // Neutral 600
    insuficiente: '#EF4444', // Red 500
};

type TabType = 'GERAL' | 'EVOLUCAO' | 'RANKING';

export const SaebDashboard: React.FC<SaebDashboardProps> = ({ escolas = [] }) => {
    const [activeTab, setActiveTab] = useState<TabType>('GERAL');

    // Filtros
    const [selectedYear, setSelectedYear] = useState<number>(2023);
    const [selectedPolo, setSelectedPolo] = useState<string>('Todos');
    const [selectedEscola, setSelectedEscola] = useState<string>('Todas');
    const [selectedLocalidade, setSelectedLocalidade] = useState<string>('Todas');
    const [selectedCoordenador, setSelectedCoordenador] = useState<string>('Todos');
    const [selectedComponente, setSelectedComponente] = useState<string>('Todos');
    const [selectedSerie, setSelectedSerie] = useState<string>('Todas');
    const [showFilters, setShowFilters] = useState(true);

    // Consolidar registros
    const allRecords = useMemo(() => {
        const records: any[] = [];
        escolas?.forEach(escola => {
            escola?.dadosEducacionais?.registrosSAEB?.forEach(reg => {
                records.push({
                    ...reg,
                    escolaNome: escola.nome || 'Escola sem nome',
                    localizacao: escola.localizacao || 'N/A',
                    coordenadorEscola: escola.coordenador || 'N/A',
                    polo: (escola as any).polo || 'N/A'
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

        return {
            years: years.length > 0 ? years : [new Date().getFullYear(), new Date().getFullYear() - 1],
            polos: ['Todos', ...polos],
            escolas: ['Todas', ...names],
            localidades: ['Todas', 'Sede', 'Zona Rural'],
            coordenadores: ['Todos', ...coords],
            componentes: ['Todos', ...components],
            series: ['Todas', ...series]
        };
    }, [allRecords]);

    useEffect(() => {
        if (filterOptions.years.length > 0 && !filterOptions.years.includes(selectedYear)) {
            setSelectedYear(filterOptions.years[0]);
        }
    }, [filterOptions.years, selectedYear]);

    // Filtragem
    const filteredRecords = useMemo(() => {
        return allRecords.filter(r => {
            const matchYear = r.ano === selectedYear;
            const matchPolo = selectedPolo === 'Todos' || r.polo === selectedPolo;
            const matchEscola = selectedEscola === 'Todas' || r.escolaNome === selectedEscola;
            const matchLocal = selectedLocalidade === 'Todas' || r.localizacao === selectedLocalidade;
            const matchCoord = selectedCoordenador === 'Todos' || r.coordenadorEscola === selectedCoordenador;
            const matchComp = selectedComponente === 'Todos' || r.componenteCurricular === selectedComponente;
            const matchSerie = selectedSerie === 'Todas' || r.anoSerie === selectedSerie;

            return matchYear && matchPolo && matchEscola && matchLocal && matchCoord && matchComp && matchSerie;
        });
    }, [allRecords, selectedYear, selectedPolo, selectedEscola, selectedLocalidade, selectedCoordenador, selectedComponente, selectedSerie]);

    // Cálculos Gerais
    const analysisData = useMemo(() => {
        const total = filteredRecords.length;
        if (total === 0) return {
            ins: 0, bas: 0, pro: 0, ava: 0,
            insCount: 0, basCount: 0, proCount: 0, avaCount: 0,
            proficiencia: 0, totalPrev: 0, totalAval: 0, notaSaebMedia: 0,
            notaPadLpMedia: 0, notaPadMatMedia: 0
        };

        const sumIns = filteredRecords.reduce((acc, r) => acc + (r.insuficiente || 0), 0);
        const sumBas = filteredRecords.reduce((acc, r) => acc + (r.basico || 0), 0);
        const sumPro = filteredRecords.reduce((acc, r) => acc + (r.proficiente || 0), 0);
        const sumAva = filteredRecords.reduce((acc, r) => acc + (r.avançado || 0), 0);
        const totalPrev = filteredRecords.reduce((acc, r) => acc + (r.estudantesPrevistos || 0), 0);
        const totalAval = filteredRecords.reduce((acc, r) => acc + (r.estudantesAvaliados || 0), 0);
        const sumNotaSaeb = filteredRecords.reduce((acc, r) => acc + (r.notaSaeb || 0), 0);
        const sumNotaPadLp = filteredRecords.reduce((acc, r) => acc + (r.notaPadronizadaLp || 0), 0);
        const sumNotaPadMat = filteredRecords.reduce((acc, r) => acc + (r.notaPadronizadaMat || 0), 0);

        // Absolute counts
        const insCount = Math.round((sumIns / 100) * (totalAval / (total || 1)));
        const basCount = Math.round((sumBas / 100) * (totalAval / (total || 1)));
        const proCount = Math.round((sumPro / 100) * (totalAval / (total || 1)));
        const avaCount = Math.round((sumAva / 100) * (totalAval / (total || 1)));

        return {
            ins: Number((sumIns / total).toFixed(1)),
            bas: Number((sumBas / total).toFixed(1)),
            pro: Number((sumPro / total).toFixed(1)),
            ava: Number((sumAva / total).toFixed(1)),
            insCount,
            basCount,
            proCount,
            avaCount,
            proficiencia: Number(((sumPro + sumAva) / total).toFixed(1)),
            notaSaebMedia: Number((sumNotaSaeb / total).toFixed(2)),
            notaPadLpMedia: Number((sumNotaPadLp / total).toFixed(2)),
            notaPadMatMedia: Number((sumNotaPadMat / total).toFixed(2)),
            totalPrev,
            totalAval
        };
    }, [filteredRecords]);

    // Dados Gráficos
    const chartData = useMemo(() => {
        const donut = [
            { name: 'Avançado', value: analysisData.ava, color: COLORS.avançado },
            { name: 'Proficiente', value: analysisData.pro, color: COLORS.proficiente },
            { name: 'Básico', value: analysisData.bas, color: COLORS.basico },
            { name: 'Insuficiente', value: analysisData.ins, color: COLORS.insuficiente }
        ];

        const schoolStats = new Map();
        filteredRecords.forEach(r => {
            const cur = schoolStats.get(r.escolaNome) || { ava: 0, pro: 0, bas: 0, ins: 0, count: 0 };
            cur.ava += (r.avançado || 0);
            cur.pro += (r.proficiente || 0);
            cur.bas += (r.basico || 0);
            cur.ins += (r.insuficiente || 0);
            cur.count += 1;
            schoolStats.set(r.escolaNome, cur);
        });

        const barData = Array.from(schoolStats.entries()).map(([name, c]) => ({
            name: name.length > 12 ? name.substring(0, 10) + '..' : name,
            fullName: name,
            Avançado: Number((c.ava / c.count).toFixed(1)),
            Proficiente: Number((c.pro / c.count).toFixed(1)),
            Básico: Number((c.bas / c.count).toFixed(1)),
            Insuficiente: Number((c.ins / c.count).toFixed(1)),
            combined: Number(((c.ava + c.pro) / c.count).toFixed(1))
        })).sort((a, b) => b.combined - a.combined);

        return { donut, barData };
    }, [filteredRecords, analysisData]);

    const ranking = useMemo(() => {
        const names = Array.from(new Set(filteredRecords.map(r => r.escolaNome)));
        return names.map(name => {
            const regs = filteredRecords.filter(r => r.escolaNome === name);
            const avg = (field: keyof RegistroSAEB) => {
                const sum = regs.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
                return regs.length > 0 ? Number((sum / regs.length).toFixed(1)) : 0;
            };

            const avgField = (field: keyof RegistroSAEB) => {
                const sum = regs.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
                return regs.length > 0 ? Number((sum / regs.length).toFixed(2)) : 0;
            };

            return {
                name,
                ava: avg('avançado'),
                pro: avg('proficiente'),
                bas: avg('basico'),
                ins: avg('insuficiente'),
                totalProf: Number((avg('proficiente') + avg('avançado')).toFixed(1)),
                lpMedia: avgField('notaPadronizadaLp'),
                matMedia: avgField('notaPadronizadaMat'),
                geralMedia: avgField('notaSaeb'),
                aval: regs.reduce((acc, r) => acc + (r.estudantesAvaliados || 0), 0),
                prev: regs.reduce((acc, r) => acc + (r.estudantesPrevistos || 0), 0)
            };
        }).sort((a, b) => b.geralMedia - a.geralMedia);
    }, [filteredRecords]);

    const evolutionData = useMemo(() => {
        const years = Array.from(new Set(allRecords.map(r => r.ano))).sort();
        return years.map(year => {
            const regs = allRecords.filter(r => {
                const matchYear = r.ano === year;
                const matchPolo = selectedPolo === 'Todos' || r.polo === selectedPolo;
                const matchEscola = selectedEscola === 'Todas' || r.escolaNome === selectedEscola;
                const matchComp = selectedComponente === 'Todos' || r.componenteCurricular === selectedComponente;
                const matchSerie = selectedSerie === 'Todas' || r.anoSerie === selectedSerie;
                return matchYear && matchPolo && matchEscola && matchComp && matchSerie;
            });

            const avg = (field: string) => {
                const sum = regs.reduce((acc, r) => acc + (r[field as keyof RegistroSAEB] as number || 0), 0);
                return regs.length > 0 ? Number((sum / regs.length).toFixed(1)) : 0;
            };

            const avgNota = (field: string) => {
                const sum = regs.reduce((acc, r) => acc + (r[field as keyof RegistroSAEB] as number || 0), 0);
                return regs.length > 0 ? Number((sum / regs.length).toFixed(2)) : 0;
            };

            return {
                year: year.toString(),
                proficiencia: Number((avg('proficiente') + avg('avançado')).toFixed(1)),
                proficiente: avg('proficiente'),
                avançado: avg('avançado'),
                basico: avg('basico'),
                insuficiente: avg('insuficiente'),
                notaSaebMedia: avgNota('notaSaeb')
            };
        }).filter(d => d.proficiencia > 0 || d.insuficiente > 0 || d.notaSaebMedia > 0);
    }, [allRecords, selectedPolo, selectedEscola, selectedComponente, selectedSerie]);

    const renderGeral = () => (
        <div className="space-y-6 animate-fade-in relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-4">
                {[
                    { label: 'Participação SAEB', val: Math.round((analysisData.totalAval / (analysisData.totalPrev || 1)) * 100) + '%', icon: Users, color: 'bg-slate-900', iconColor: 'text-brand-orange', count: analysisData.totalAval },
                    { label: 'Nota SAEB Média', val: analysisData.notaSaebMedia, icon: Target, color: 'bg-slate-900', iconColor: 'text-brand-orange', count: analysisData.totalAval },
                    { label: 'Proficiência (Pro+Ava)', val: analysisData.proficiencia + '%', icon: Award, color: 'bg-brand-acid', iconColor: 'text-brand-black', count: analysisData.proCount + analysisData.avaCount },
                    { label: 'Insuficiente (Alerta)', val: analysisData.ins + '%', icon: UserX, color: 'bg-brand-signal', iconColor: 'text-white', count: analysisData.insCount },
                ].map((k, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                        {k.count !== undefined && (
                            <span className="absolute top-4 right-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-lg">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-slate-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Distribuição SAEB por Unidade (%)</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.barData.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} stroke="#64748b" />
                                <YAxis tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} unit="%" stroke="#64748b" />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 500 }} />
                                <Bar dataKey="Avançado" stackId="a" fill={COLORS.avançado} radius={[0, 0, 4, 4]} />
                                <Bar dataKey="Proficiente" stackId="a" fill={COLORS.proficiente} radius={0} />
                                <Bar dataKey="Básico" stackId="a" fill={COLORS.basico} radius={0} />
                                <Bar dataKey="Insuficiente" stackId="a" fill={COLORS.insuficiente} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center relative">
                    <h3 className="font-bold text-slate-800 text-lg mb-8 w-full text-center">Composição Nacional SAEB</h3>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData.donut} innerRadius={80} outerRadius={105} paddingAngle={4} dataKey="value" stroke="none" cornerRadius={4}>
                                    {chartData.donut.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-4xl font-black text-slate-800 tracking-tight">{analysisData.proficiencia}%</p>
                            <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mt-1">Proficiência</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8 w-full border-t border-slate-100 pt-6">
                        {chartData.donut.map((d, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                <span className="text-xs font-medium text-slate-500 uppercase">{d.name}: {d.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEvolucao = () => (
        <div className="space-y-6 animate-fade-in relative">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Tendência Histórica Nacional</h3>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Comparativo entre edições do SAEB</p>
                    </div>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolutionData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend verticalAlign="top" iconType="circle" align="center" wrapperStyle={{ paddingBottom: '30px', fontSize: '12px', fontWeight: 500 }} />
                            <Line type="monotone" dataKey="notaSaebMedia" name="Média SAEB (Nji)" stroke="#FF4D00" strokeWidth={3} dot={{ r: 6, fill: '#FF4D00', strokeWidth: 2, stroke: '#fff' }} />
                            <Line type="monotone" dataKey="proficiencia" name="% Proficiência" stroke="#000" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 p-4 flex items-center gap-3 border-b border-slate-100">
                    <Target className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Matriz Cronológica SAEB</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-3 text-center">Edição</th>
                                <th className="px-6 py-3 text-center text-slate-700">Nota Média</th>
                                <th className="px-6 py-3 text-center text-slate-700">Avançado</th>
                                <th className="px-6 py-3 text-center text-slate-700">Proficiente</th>
                                <th className="px-6 py-3 text-center text-red-500">Insuficiente</th>
                                <th className="px-6 py-3 text-right">% Proficiência</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {evolutionData.map((d, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 font-bold text-slate-700 text-center">{d.year}</td>
                                    <td className="px-6 py-3 text-center font-bold text-orange-500 bg-orange-50/50 text-sm">{d.notaSaebMedia}</td>
                                    <td className="px-6 py-3 text-center text-xs font-medium text-slate-600">{d.avançado}%</td>
                                    <td className="px-6 py-3 text-center text-xs font-medium text-slate-600">{d.proficiente}%</td>
                                    <td className="px-6 py-3 text-center text-xs font-medium text-red-500">{d.insuficiente}%</td>
                                    <td className="px-6 py-3 text-right">
                                        <span className="font-bold text-slate-800 text-sm">{d.proficiencia}%</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderRanking = () => (
        <div className="space-y-6 animate-fade-in relative">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 p-4 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <Award className="w-6 h-6 text-orange-500" />
                        <div className="text-slate-800 uppercase font-bold text-sm">
                            Ranking de Excelência SAEB
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Pos</th>
                                <th className="px-6 py-3 text-left">Unidade</th>
                                <th className="px-4 py-3 text-center bg-orange-50/50 text-slate-700">Score SAEB</th>
                                <th className="px-4 py-3 text-center text-slate-700">Pad. LP</th>
                                <th className="px-4 py-3 text-center text-slate-700">Pad. MAT</th>
                                <th className="px-4 py-3 text-center text-slate-700">Prof %</th>
                                <th className="px-6 py-3 text-right">Status Part.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ranking.map((s, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-all duration-200">
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex w-8 h-8 items-center justify-center font-bold text-xs rounded-full ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-100 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>
                                            {idx + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="font-medium text-slate-800 text-sm group-hover:text-orange-600 transition-colors">{s.name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center bg-orange-50/30">
                                        <span className="text-lg font-bold text-orange-500">{s.geralMedia}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs font-medium text-slate-500 group-hover:text-slate-800">{s.lpMedia}</td>
                                    <td className="px-4 py-3 text-center text-xs font-medium text-slate-500 group-hover:text-slate-800">{s.matMedia}</td>
                                    <td className="px-4 py-3 text-center font-bold text-slate-600">{s.totalProf}%</td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-bold text-slate-700">{s.aval} / {s.prev}</span>
                                            <span className="text-[10px] font-bold text-slate-400 mt-0.5">{Math.round((s.aval / (s.prev || 1)) * 100)}% Presença</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-12 animate-fade-in relative">
            <PageHeader
                title="Sistema de Avaliação da Educação Básica"
                subtitle="Resultados e Metas por Escola"
                icon={BarChart3}
                badgeText="AVALIAÇÃO EXTERNA"
                actions={[]}
            />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-wrap gap-2">
                {[
                    { id: 'GERAL', label: 'VISÃO GERAL', icon: Target },
                    { id: 'EVOLUCAO', label: 'EVOLUÇÃO', icon: HistoryIcon },
                    { id: 'RANKING', label: 'RANKING', icon: Award }
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
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-7 gap-3 mb-6">
                    {[
                        { label: 'Unidade', val: selectedEscola, set: setSelectedEscola, opts: filterOptions.escolas },
                        { label: 'Ano', val: selectedYear, set: (v: any) => setSelectedYear(Number(v)), opts: filterOptions.years },
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

            <div className="mt-8">
                {activeTab === 'GERAL' && renderGeral()}
                {activeTab === 'EVOLUCAO' && renderEvolucao()}
                {activeTab === 'RANKING' && renderRanking()}
            </div>
        </div>
    );
};
