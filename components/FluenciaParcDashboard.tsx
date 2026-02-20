import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Escola, RegistroFluenciaPARC, Coordenador } from '../types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, ComposedChart, Line, LineChart
} from 'recharts';
import {
    TrendingUp, Award, Users, Filter, Calendar, MapPin,
    ClipboardCheck, Info, ChevronDown, LayoutDashboard, History as HistoryIcon, GraduationCap, School, BookOpen, UserX,
    Map as MapIcon, UserCheck, Layers, Target, Activity
} from 'lucide-react';

interface FluenciaParcDashboardProps {
    escolas: Escola[];
    coordenadores: Coordenador[];
}

const COLORS = {
    fluente: '#FF4D00',     // Brand Orange
    iniciante: '#000000',   // Black
    preLeitor: '#52525B',   // Zinc 600
    n4: '#71717A',
    n3: '#A1A1AA',
    n2: '#D4D4D8',
    n1: '#E4E4E7'
};

type TabType = 'GERAL' | 'EVOLUCAO' | 'TURMAS';

export const FluenciaParcDashboard: React.FC<FluenciaParcDashboardProps> = ({ escolas = [], coordenadores = [] }) => {
    const [activeTab, setActiveTab] = useState<TabType>('GERAL');

    // Filtros
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedPolo, setSelectedPolo] = useState<string>('Todos');
    const [selectedEscola, setSelectedEscola] = useState<string>('Todas');
    const [selectedEdicao, setSelectedEdicao] = useState<string>('Todas');
    const [selectedLocalidade, setSelectedLocalidade] = useState<string>('Todas');
    const [selectedCoordenador, setSelectedCoordenador] = useState<string>('Todos');
    const [selectedTipoTurma, setSelectedTipoTurma] = useState<string>('Todos');
    const [showFilters, setShowFilters] = useState(true);

    // Consolidar registros
    const allRecords = useMemo(() => {
        const records: any[] = [];
        escolas?.forEach(escola => {
            const coord = coordenadores.find(c => c.escolasIds.includes(escola.id));
            const coordenadorNome = coord ? coord.nome : 'NÃO TEM';

            escola?.dadosEducacionais?.registrosFluenciaParc?.forEach(reg => {
                records.push({
                    ...reg,
                    escolaNome: escola.nome || 'Escola sem nome',
                    localizacao: escola.localizacao || 'N/A',
                    coordenadorEscola: coordenadorNome
                });
            });
        });
        return records;
    }, [escolas, coordenadores]);

    // Opções de filtro
    const filterOptions = useMemo(() => {
        const years = Array.from(new Set(allRecords.map(r => r.ano))).sort((a, b) => b - a);
        const polos = Array.from(new Set(allRecords.map(r => r.polo))).sort();
        const names = Array.from(new Set(allRecords.map(r => r.escolaNome))).sort();
        const coords = Array.from(new Set(allRecords.map(r => r.coordenadorEscola))).sort();
        const types = Array.from(new Set(allRecords.map(r => r.tipoTurma))).sort();

        return {
            years: years.length > 0 ? years : [new Date().getFullYear(), new Date().getFullYear() - 1],
            polos: ['Todos', ...polos],
            escolas: ['Todas', ...names],
            localidades: ['Todas', 'Sede', 'Zona Rural'],
            coordenadores: ['Todos', ...coords],
            tiposTurma: ['Todos', ...types]
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
            const matchEdicao = selectedEdicao === 'Todas' || r.edicao === selectedEdicao;
            const matchLocal = selectedLocalidade === 'Todas' || r.localizacao === selectedLocalidade;
            const matchCoord = selectedCoordenador === 'Todos' || r.coordenadorEscola === selectedCoordenador;
            const matchTurma = selectedTipoTurma === 'Todos' || r.tipoTurma === selectedTipoTurma;

            return matchYear && matchPolo && matchEscola && matchEdicao && matchLocal && matchCoord && matchTurma;
        });
    }, [allRecords, selectedYear, selectedPolo, selectedEscola, selectedEdicao, selectedLocalidade, selectedCoordenador, selectedTipoTurma]);

    // Cálculos Gerais
    const analysisData = useMemo(() => {
        const calc = (regs: any[]) => {
            const pres = regs.reduce((acc, r) => acc + (r.participacao?.presentes || 0), 0);
            const matr = regs.reduce((acc, r) => acc + (r.participacao?.matriculados || 0), 0);
            const flu = regs.reduce((acc, r) => acc + (r.classificacao?.leitorFluente || 0), 0);
            const ini = regs.reduce((acc, r) => acc + (r.classificacao?.leitorIniciante || 0), 0);
            const p1 = regs.reduce((acc, r) => acc + (r.classificacao?.preLeitorNivel1 || 0), 0);
            const p2 = regs.reduce((acc, r) => acc + (r.classificacao?.preLeitorNivel2 || 0), 0);
            const p3 = regs.reduce((acc, r) => acc + (r.classificacao?.preLeitorNivel3 || 0), 0);
            const p4 = regs.reduce((acc, r) => acc + (r.classificacao?.preLeitorNivel4 || 0), 0);
            const totalPre = p1 + p2 + p3 + p4;
            return {
                pres, matr, flu, ini, totalPre, p1, p2, p3, p4,
                pFlu: pres > 0 ? (flu / pres) * 100 : 0,
                pIni: pres > 0 ? (ini / pres) * 100 : 0,
                pPre: pres > 0 ? (totalPre / pres) * 100 : 0,
                pPart: matr > 0 ? (pres / matr) * 100 : 0
            };
        };

        const currentRegs = selectedEdicao === 'Todas' ?
            (filteredRecords.filter(r => r.edicao === 'Saída').length > 0 ? filteredRecords.filter(r => r.edicao === 'Saída') : filteredRecords) :
            filteredRecords;

        return { kpis: calc(currentRegs) };
    }, [filteredRecords, selectedEdicao]);

    // Dados Gráficos Visão Geral
    const chartData = useMemo(() => {
        const kpiRegs = selectedEdicao === 'Todas' ?
            (filteredRecords.filter(r => r.edicao === 'Saída').length > 0 ? filteredRecords.filter(r => r.edicao === 'Saída') : filteredRecords) :
            filteredRecords;

        const schoolMap = new Map();
        kpiRegs.forEach(r => {
            const cur = schoolMap.get(r.escolaNome) || { flu: 0, ini: 0, pre: 0 };
            cur.flu += (r.classificacao?.leitorFluente || 0);
            cur.ini += (r.classificacao?.leitorIniciante || 0);
            cur.pre += ((r.classificacao?.preLeitorNivel1 || 0) + (r.classificacao?.preLeitorNivel2 || 0) + (r.classificacao?.preLeitorNivel3 || 0) + (r.classificacao?.preLeitorNivel4 || 0));
            schoolMap.set(r.escolaNome, cur);
        });

        const volume = Array.from(schoolMap.entries()).map(([name, c]) => ({
            name: (name || '').length > 12 ? name.substring(0, 10) + '..' : name,
            Fluente: c.flu, Iniciante: c.ini, 'Pré-Leitor': c.pre, total: c.flu + c.ini + c.pre
        })).sort((a, b) => b.total - a.total);

        const donut = [
            { name: 'Fluente', value: analysisData.kpis.flu, color: COLORS.fluente },
            { name: 'Iniciante', value: analysisData.kpis.ini, color: COLORS.iniciante },
            { name: 'Pré-Leitor', value: analysisData.kpis.totalPre, color: COLORS.preLeitor }
        ];

        return { volume, donut };
    }, [filteredRecords, selectedEdicao, analysisData.kpis]);

    const ranking = useMemo(() => {
        const kpiRegs = selectedEdicao === 'Todas' ?
            (filteredRecords.filter(r => r.edicao === 'Saída').length > 0 ? filteredRecords.filter(r => r.edicao === 'Saída') : filteredRecords) :
            filteredRecords;

        const names = Array.from(new Set(kpiRegs.map(r => r.escolaNome)));
        return names.map(name => {
            const regs = kpiRegs.filter(r => r.escolaNome === name);
            const pres = regs.reduce((acc, r) => acc + (r.participacao?.presentes || 0), 0);
            const getP = (v: number) => pres > 0 ? Number(((v / pres) * 100).toFixed(1)) : 0;
            return {
                name,
                total: pres,
                flu: getP(regs.reduce((acc, r) => acc + (r.classificacao?.leitorFluente || 0), 0)),
                ini: getP(regs.reduce((acc, r) => acc + (r.classificacao?.leitorIniciante || 0), 0)),
                n4: getP(regs.reduce((acc, r) => acc + (r.classificacao?.preLeitorNivel4 || 0), 0)),
                n3: getP(regs.reduce((acc, r) => acc + (r.classificacao?.preLeitorNivel3 || 0), 0)),
                n2: getP(regs.reduce((acc, r) => acc + (r.classificacao?.preLeitorNivel2 || 0), 0)),
                n1: getP(regs.reduce((acc, r) => acc + (r.classificacao?.preLeitorNivel1 || 0), 0))
            };
        }).sort((a, b) => b.flu - a.flu);
    }, [filteredRecords, selectedEdicao]);

    const evolutionAnalysis = useMemo(() => {
        const periods = Array.from(new Set(allRecords.map(r => `${r.ano}|${r.edicao}`)))
            .sort((a, b) => {
                const [yA, eA] = a.split('|');
                const [yB, eB] = b.split('|');
                if (yA !== yB) return Number(yA) - Number(yB);
                return eA === 'Entrada' ? -1 : 1;
            });

        const timelineData = periods.map(p => {
            const [year, edition] = p.split('|');
            const regs = allRecords.filter(r => r.ano === Number(year) && r.edicao === edition);

            const finalRegs = regs.filter(r => {
                const matchPolo = selectedPolo === 'Todos' || r.polo === selectedPolo;
                const matchEscola = selectedEscola === 'Todas' || r.escolaNome === selectedEscola;
                const matchLocal = selectedLocalidade === 'Todas' || r.localizacao === selectedLocalidade;
                const matchCoord = selectedCoordenador === 'Todos' || r.coordenadorEscola === selectedCoordenador;
                const matchTurma = selectedTipoTurma === 'Todos' || r.tipoTurma === selectedTipoTurma;
                return matchPolo && matchEscola && matchLocal && matchCoord && matchTurma;
            });

            const pres = finalRegs.reduce((acc, r) => acc + (r.participacao?.presentes || 0), 0);
            const flu = finalRegs.reduce((acc, r) => acc + (r.classificacao?.leitorFluente || 0), 0);
            const ini = finalRegs.reduce((acc, r) => acc + (r.classificacao?.leitorIniciante || 0), 0);
            const pre = finalRegs.reduce((acc, r) => acc + (r.classificacao?.preLeitorNivel1 || 0) + (r.classificacao?.preLeitorNivel2 || 0) + (r.classificacao?.preLeitorNivel3 || 0) + (r.classificacao?.preLeitorNivel4 || 0), 0);

            const label = edition === 'Entrada' ? `${year}/1` : `${year}/${edition === 'Saída' ? '2' : '3'}`;

            return {
                period: p, display: label,
                flu: pres > 0 ? Number(((flu / pres) * 100).toFixed(1)) : 0,
                ini: pres > 0 ? Number(((ini / pres) * 100).toFixed(1)) : 0,
                pre: pres > 0 ? Number(((pre / pres) * 100).toFixed(1)) : 0,
                half: pres > 0 ? Number((((flu + ini) / pres) * 100).toFixed(1)) : 0,
                total: pres
            };
        }).filter(d => d.total > 0);

        const first = timelineData[0];
        const last = timelineData[timelineData.length - 1];
        const deltaFlu = last && first ? (last.flu - first.flu) : 0;
        const avgAlfabet = timelineData.length > 0 ? timelineData.reduce((acc, d) => acc + d.half, 0) / timelineData.length : 0;

        return { timelineData, deltaFlu, avgAlfabet };
    }, [allRecords, selectedPolo, selectedEscola, selectedLocalidade, selectedCoordenador, selectedTipoTurma]);

    const classAnalysis = useMemo(() => {
        const classMap = new Map();
        filteredRecords.forEach(r => {
            const key = `${r.escolaNome}|${r.turma?.nome || 'Turma Única'}`;
            const cur = classMap.get(key) || { escola: r.escolaNome, turma: r.turma?.nome || 'Turma Única', flu: 0, ini: 0, pre: 0, total: 0 };
            cur.flu += (r.classificacao?.leitorFluente || 0);
            cur.ini += (r.classificacao?.leitorIniciante || 0);
            cur.pre += ((r.classificacao?.preLeitorNivel1 || 0) + (r.classificacao?.preLeitorNivel2 || 0) + (r.classificacao?.preLeitorNivel3 || 0) + (r.classificacao?.preLeitorNivel4 || 0));
            cur.total += (r.participacao?.presentes || 0);
            classMap.set(key, cur);
        });
        return Array.from(classMap.values()).map(c => ({
            ...c,
            pAlfabet: c.total > 0 ? Number((((c.flu + c.ini) / c.total) * 100).toFixed(1)) : 0,
            pFlu: c.total > 0 ? Number(((c.flu / c.total) * 100).toFixed(1)) : 0,
            pIni: c.total > 0 ? Number(((c.ini / c.total) * 100).toFixed(1)) : 0,
            pPre: c.total > 0 ? Number(((c.pre / c.total) * 100).toFixed(1)) : 0
        })).sort((a, b) => b.pAlfabet - a.pAlfabet);
    }, [filteredRecords]);

    const renderGeral = () => (
        <div className="space-y-6 animate-fade-in relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-4">
                {[
                    { label: 'Participação PARC', val: analysisData.kpis.pPart.toFixed(1) + '%', icon: Users, color: 'bg-slate-900', iconColor: 'text-brand-orange', count: analysisData.kpis.pres },
                    { label: 'Leitores Fluentes', val: analysisData.kpis.pFlu.toFixed(1) + '%', icon: GraduationCap, color: 'bg-brand-acid', iconColor: 'text-brand-black', count: analysisData.kpis.flu },
                    { label: 'Leitores Iniciantes', val: analysisData.kpis.pIni.toFixed(1) + '%', icon: BookOpen, color: 'bg-brand-orange', iconColor: 'text-white', count: analysisData.kpis.ini },
                    { label: 'Pré-Leitores', val: analysisData.kpis.pPre.toFixed(1) + '%', icon: UserX, color: 'bg-brand-signal', iconColor: 'text-white', count: analysisData.kpis.totalPre }
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
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-slate-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Distribuição por Unidade (Volume Bruto)</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.volume}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} stroke="#64748b" />
                                <YAxis tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} stroke="#64748b" />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 500 }} />
                                <Bar dataKey="Fluente" stackId="a" fill={COLORS.fluente} radius={[0, 0, 4, 4]} />
                                <Bar dataKey="Iniciante" stackId="a" fill={COLORS.iniciante} radius={0} />
                                <Bar dataKey="Pré-Leitor" stackId="a" fill={COLORS.preLeitor} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center relative">
                    <h3 className="font-bold text-slate-800 text-lg mb-6 w-full text-center">Status de Fluência / Global</h3>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData.donut} innerRadius={80} outerRadius={105} paddingAngle={4} dataKey="value" stroke="none" cornerRadius={4}>
                                    {chartData.donut.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-4xl font-black text-slate-800 tracking-tight">{Math.round(analysisData.kpis.pFlu)}%</p>
                            <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mt-1">Fluência</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-8 w-full border-t border-slate-100 pt-6">
                        {chartData.donut.map((d, i) => (
                            <div key={i} className="flex flex-col items-center text-center border-r last:border-0 border-slate-100">
                                <span className="text-xs font-medium text-slate-400 uppercase">{d.name}</span>
                                <span className="text-lg font-bold text-slate-800">{((d.value / (analysisData.kpis.pres || 1)) * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEvolucao = () => (
        <div className="space-y-6 animate-fade-in relative">
            <div className="card-technical p-1">
                <div className="bg-white p-6">
                    <div className="flex items-center gap-4 mb-6 text-brand-black">
                        <TrendingUp className="w-8 h-8 text-brand-orange" strokeWidth={3} />
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Curva de Aprendizado / Fluência</h3>
                            <p className="text-[9px] text-brand-grey font-black uppercase tracking-widest mt-1">Comparativo entre entrada, monitoramento e saída</p>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={evolutionAnalysis.timelineData}>
                                <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.1)" />
                                <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '2px solid #FF4D00', color: '#fff' }} />
                                <Legend verticalAlign="top" iconType="rect" align="center" wrapperStyle={{ paddingBottom: '30px', fontFamily: 'JetBrains Mono', fontSize: '9px', fontWeight: 'bold' }} />
                                <Line type="monotone" dataKey="flu" name="Fluente" stroke={COLORS.fluente} strokeWidth={5} dot={{ r: 6, fill: COLORS.fluente, stroke: '#fff' }} />
                                <Line type="monotone" dataKey="ini" name="Iniciante" stroke={COLORS.iniciante} strokeWidth={3} strokeDasharray="5 5" dot={false} />
                                <Line type="monotone" dataKey="pre" name="Pré-Leitor" stroke={COLORS.preLeitor} strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-technical p-1">
                    <div className="bg-slate-900 p-6 text-white h-full">
                        <h4 className="font-black uppercase tracking-widest text-sm text-brand-orange mb-6">Delta de Evolução / Fluência</h4>
                        <div className="flex justify-between items-center bg-white/5 p-5 border-2 border-white/10 shadow-sharp-white">
                            <span className="text-[10px] font-black uppercase text-brand-grey">Crescimento Líquido</span>
                            <span className={`text-3xl font-black ${evolutionAnalysis.deltaFlu >= 0 ? 'text-brand-acid' : 'text-brand-signal'}`}>
                                {evolutionAnalysis.deltaFlu > 0 ? '+' : ''}{evolutionAnalysis.deltaFlu.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
                <div className="card-technical p-1 overflow-hidden">
                    <div className="bg-white h-full">
                        <table className="w-full text-left text-xs uppercase">
                            <thead className="bg-slate-50 border-b-2 border-brand-black">
                                <tr className="font-black text-brand-grey">
                                    <th className="px-6 py-3">Period</th>
                                    <th className="px-6 py-3 text-center bg-brand-orange/5">Alfabetizado</th>
                                    <th className="px-6 py-3 text-right">Volume</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-black/10">
                                {evolutionAnalysis.timelineData.map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 font-black">{d.display}</td>
                                        <td className="px-6 py-3 text-center text-brand-orange font-black">{d.half}%</td>
                                        <td className="px-6 py-3 text-right text-brand-grey">{d.total} PRS</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTurmas = () => (
        <div className="space-y-6 animate-fade-in relative">
            <div className="card-technical p-1 overflow-hidden">
                <div className="bg-slate-900 p-6 flex items-center justify-between border-b-2 border-brand-black">
                    <div className="flex items-center gap-3 text-white uppercase font-black tracking-widest text-sm">
                        <Layers className="w-6 h-6 text-brand-orange" strokeWidth={3} />
                        Análise Detalhada por Turma
                    </div>
                </div>
                <div className="overflow-x-auto bg-white">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b-2 border-brand-black">
                            <tr className="text-[9px] font-black text-brand-grey uppercase tracking-widest">
                                <th className="px-6 py-4">Unidade / Turma</th>
                                <th className="px-4 py-4 text-center">POP</th>
                                <th className="px-4 py-3 text-center bg-brand-acid/10">Fluente</th>
                                <th className="px-4 py-3 text-center bg-brand-orange/10">Iniciante</th>
                                <th className="px-4 py-3 text-center">Pré-Leitor</th>
                                <th className="px-6 py-4 text-right bg-slate-900 text-white">Score Alfabet.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-black/10">
                            {classAnalysis.map((c, i) => (
                                <tr key={i} className="group hover:bg-slate-50 transition-all text-xs uppercase">
                                    <td className="px-6 py-4 font-black">
                                        <div className="text-brand-black text-sm mb-1 line-clamp-1">{c.turma}</div>
                                        <div className="text-brand-grey text-[9px]">{c.escola}</div>
                                    </td>
                                    <td className="px-4 py-4 text-center">{c.total}</td>
                                    <td className="px-4 py-4 text-center font-black text-brand-acid">{c.pFlu}%</td>
                                    <td className="px-4 py-4 text-center font-black text-brand-orange">{c.pIni}%</td>
                                    <td className="px-4 py-4 text-center text-brand-grey">{c.pPre}%</td>
                                    <td className="px-6 py-4 text-right bg-slate-900/5 font-black text-sm">{c.pAlfabet}%</td>
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
                title="Análise PARC"
                subtitle="Monitoramento de Fluência Leitora"
                icon={Activity}
                badgeText="Fluência e Alfabetização"
                actions={[]}
            />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-wrap gap-2">
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
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 2xl:grid-cols-7 gap-3 mb-6">
                    {[
                        { label: 'Unidade', val: selectedEscola, set: setSelectedEscola, opts: filterOptions.escolas },
                        { label: 'Ano', val: selectedYear, set: (v: any) => setSelectedYear(Number(v)), opts: filterOptions.years },
                        { label: 'Edição', val: selectedEdicao, set: setSelectedEdicao, opts: ['Todas', 'Entrada', 'Saída'] },
                        { label: 'Polo', val: selectedPolo, set: setSelectedPolo, opts: filterOptions.polos },
                        { label: 'Localidade', val: selectedLocalidade, set: setSelectedLocalidade, opts: filterOptions.localidades },
                        { label: 'Regional', val: selectedCoordenador, set: setSelectedCoordenador, opts: filterOptions.coordenadores },
                        { label: 'Turma', val: selectedTipoTurma, set: setSelectedTipoTurma, opts: filterOptions.tiposTurma }
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
                {activeTab === 'TURMAS' && renderTurmas()}
            </div>
        </div>
    );
};
