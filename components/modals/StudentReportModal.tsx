import React from 'react';
import { X, Calendar, Hand, Book, CheckSquare, MessageCircle, Search, Users, Activity, Briefcase, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Award, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts';

interface StudentReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
    context: string; // 'Resultado Consolidado' ou '1º Bimestre', etc.
}

export const StudentReportModal: React.FC<StudentReportModalProps> = ({
    isOpen,
    onClose,
    student,
    context
}) => {

    if (!isOpen || !student) return null;

    const renderVisaoGeralTrend = (current: number, previous: number) => {
        if (current > previous) return <span className="text-emerald-500 font-bold flex items-center gap-1 justify-center"><ArrowUpRight className="w-4 h-4" /></span>;
        if (current < previous) return <span className="text-red-500 font-bold flex items-center gap-1 justify-center"><ArrowDownRight className="w-4 h-4" /></span>;
        return <span className="text-slate-400 font-bold flex items-center gap-1 justify-center"><Minus className="w-4 h-4" /></span>;
    };

    const isConsolidado = context === 'Resultado Consolidado';

    const renderConceptCard = (title: string, icon: React.ReactNode, value: string) => {
        let colors = 'bg-slate-50 text-slate-500 border-slate-200';
        let label = 'NÃO AVALIADO';

        switch (value) {
            case 'E': colors = 'bg-emerald-50 text-emerald-700 border-emerald-200'; label = 'EXCELENTE'; break;
            case 'B': colors = 'bg-blue-50 text-blue-700 border-blue-200'; label = 'BOM'; break;
            case 'R': colors = 'bg-amber-50 text-amber-700 border-amber-200'; label = 'REGULAR'; break;
            case 'I': colors = 'bg-red-50 text-red-700 border-red-200'; label = 'INSUFICIENTE'; break;
        }

        return (
            <div className={`p-4 rounded-2xl border ${colors} flex flex-col justify-center items-center text-center gap-2 transition-transform hover:-translate-y-1`}>
                <div className="opacity-70 mb-1">{icon}</div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-80">{title}</h4>
                <div className="text-sm font-black tracking-wide">{label}</div>
            </div>
        );
    };

    // Dados para o Gráfico de Linha (Consolidado)
    const lineChartData = [
        { name: '1º Bim', nota: student.b1 !== undefined ? student.b1 : null },
        { name: '2º Bim', nota: student.b2 !== undefined ? student.b2 : null },
        { name: '3º Bim', nota: student.b3 !== undefined ? student.b3 : null },
        { name: '4º Bim', nota: student.b4 !== undefined ? student.b4 : null },
    ].filter(item => item.nota !== null);

    // Gráficos Bimestrais
    const barChartData = [
        { name: 'Av1', nota: student.notas?.av1 || 0 },
        { name: 'Av2', nota: student.notas?.av2 || 0 },
        { name: 'Av3', nota: student.notas?.av3 || 0 },
    ];
    if (student.notas?.rec !== undefined && student.notas?.rec !== null && student.notas.rec !== '') {
        barChartData.push({ name: 'Rec.', nota: student.notas?.rec });
    }

    const conceptToValue = (concept: string) => {
        switch (concept) {
            case 'E': return 4;
            case 'B': return 3;
            case 'R': return 2;
            case 'I': return 1;
            default: return 0;
        }
    }

    const radarData = [
        { subject: 'Frequência', value: conceptToValue(student.fre), fullMark: 4 },
        { subject: 'Participação', value: conceptToValue(student.par), fullMark: 4 },
        { subject: 'Material', value: conceptToValue(student.mat), fullMark: 4 },
        { subject: 'Atividades', value: conceptToValue(student.atv), fullMark: 4 },
        { subject: 'Comunicação', value: conceptToValue(student.com), fullMark: 4 },
        { subject: 'Pesquisa', value: conceptToValue(student.pes), fullMark: 4 },
        { subject: 'Conduta', value: conceptToValue(student.con), fullMark: 4 },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-800 p-6 sm:p-8 text-white flex justify-between items-start shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative z-10 flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/10 shrink-0">
                            <span className="text-2xl font-black">{student.name.charAt(0)}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold tracking-tight">{student.name}</h2>
                                {student.alert && (
                                    <span className="bg-red-500/20 text-red-200 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                        <Activity className="w-3 h-3" /> Em Alerta
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-300 font-medium">
                                <span>Matrícula: {20240000 + student.id}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                                <span>{context}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50/50 flex-1">
                    {isConsolidado ? (
                        <div className="space-y-8">
                            {/* Resumo do Ano */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-4">
                                    <Award className="w-5 h-5 text-emerald-500" /> Desempenho Anual Consolidado
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase mb-2">1º Bimestre</span>
                                        <span className={`text-2xl font-black ${student.b1 < 6 ? 'text-red-500' : 'text-slate-800'}`}>{student.b1?.toFixed(1) || '-'}</span>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase mb-2">2º Bimestre</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-2xl font-black ${student.b2 < 6 ? 'text-red-500' : 'text-slate-800'}`}>{student.b2?.toFixed(1) || '-'}</span>
                                            {student.b2 && renderVisaoGeralTrend(student.b2, student.b1)}
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase mb-2">3º Bimestre</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-2xl font-black ${student.b3 < 6 ? 'text-red-500' : 'text-slate-800'}`}>{student.b3?.toFixed(1) || '-'}</span>
                                            {student.b3 && renderVisaoGeralTrend(student.b3, student.b2)}
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase mb-2">4º Bimestre</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-2xl font-black ${student.b4 < 6 ? 'text-red-500' : 'text-slate-800'}`}>{student.b4?.toFixed(1) || '-'}</span>
                                            {student.b4 && renderVisaoGeralTrend(student.b4, student.b3)}
                                        </div>
                                    </div>
                                    <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center shadow-inner ${student.mediaFinal < 6 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                        <span className={`text-[10px] font-bold uppercase mb-1 ${student.mediaFinal < 6 ? 'text-red-600' : 'text-emerald-700'}`}>Média Final</span>
                                        <span className={`text-3xl font-black ${student.mediaFinal < 6 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {student.mediaFinal?.toFixed(1) || '-'}
                                        </span>
                                    </div>
                                </div>

                                {/* Chart Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-6 flex items-center gap-2">
                                            <LineChartIcon className="w-4 h-4 text-blue-500" /> Evolução de Notas ao Longo do Ano
                                        </h4>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                                                    <RechartsTooltip
                                                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        itemStyle={{ fontWeight: 'bold' }}
                                                    />
                                                    <ReferenceLine y={6} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Média (6.0)', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                                                    <Line type="monotone" dataKey="nota" name="Nota" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 8 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800 p-8 rounded-2xl shadow-sm text-white flex flex-col justify-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                        <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Diagnóstico Anual</h4>
                                        <p className="text-2xl font-semibold leading-snug mb-4">
                                            {student.mediaFinal >= 6
                                                ? "O estudante apresentou um rendimento consolidado satisfatório, mantendo-se acima da média esperada."
                                                : "O estudante apresenta defasagens acadêmicas significativas e requer plano de intervenção pedagógica."}
                                        </p>
                                        <div className="flex gap-4 mt-auto">
                                            <div className="flex-1 bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Maior Nota</span>
                                                <span className="text-xl font-black text-emerald-400">{Math.max(student.b1 || 0, student.b2 || 0, student.b3 || 0, student.b4 || 0).toFixed(1)}</span>
                                            </div>
                                            <div className="flex-1 bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Menor Nota</span>
                                                <span className="text-xl font-black text-red-400">{Math.min(...[student.b1, student.b2, student.b3, student.b4].filter(n => n !== undefined && n !== null)).toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Avaliações Quantitativas (Notas do Bimestre) */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-4">
                                    <Briefcase className="w-5 h-5 text-blue-500" /> Notas Analíticas do Bimestre
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-6 flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-emerald-500" /> Distribuições de Notas
                                        </h4>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                                                    <RechartsTooltip
                                                        cursor={{ fill: 'transparent' }}
                                                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <ReferenceLine y={6} stroke="#ef4444" strokeDasharray="3 3" />
                                                    <Bar dataKey="nota" name="Nota" radius={[6, 6, 0, 0]}>
                                                        {barChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.name === 'Rec.' ? '#f59e0b' : (entry.nota >= 6 ? '#10b981' : '#ef4444')} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-center text-center flex-1 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                                            <span className="text-xs font-bold text-blue-700 uppercase mb-2 relative z-10">Média Geral do Período</span>
                                            <span className="text-5xl font-black text-blue-700 relative z-10 mb-2">{student.media?.toFixed(1) || '-'}</span>
                                            <span className="text-[10px] text-slate-500 font-semibold relative z-10">
                                                {student.media >= 6 ? 'Desempenho Adequado' : 'Abaixo da Média (Alerta)'}
                                            </span>
                                        </div>

                                        {student.notas?.rec !== undefined && student.notas?.rec !== null && student.notas.rec !== '' && (
                                            <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-6 flex flex-col justify-center text-center">
                                                <span className="text-xs font-bold text-amber-700 uppercase mb-2">Nota de Recuperação Empregada</span>
                                                <span className="text-2xl font-black text-amber-700">{typeof student.notas.rec === 'number' ? student.notas.rec.toFixed(1) : student.notas.rec}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Avaliações Qualitativas (Conceitos) */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-4 mt-8">
                                    <Activity className="w-5 h-5 text-purple-500" /> Avaliação Qualitativa Mapeada
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {renderConceptCard('Frequência', <Calendar className="w-6 h-6" />, student.fre)}
                                        {renderConceptCard('Participação', <Hand className="w-6 h-6" />, student.par)}
                                        {renderConceptCard('Material', <Book className="w-6 h-6" />, student.mat)}
                                        {renderConceptCard('Atividades', <CheckSquare className="w-6 h-6" />, student.atv)}
                                        {renderConceptCard('Comunicação', <MessageCircle className="w-6 h-6" />, student.com)}
                                        {renderConceptCard('Pesquisa', <Search className="w-6 h-6" />, student.pes)}
                                        {renderConceptCard('Conduta', <Users className="w-6 h-6" />, student.con)}
                                    </div>
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-center items-center h-64 lg:h-auto">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2 w-full text-left ml-4">Mapa de Competências</h4>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 4]} tick={false} axisLine={false} />
                                                <Radar name="Competência" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                                                <RechartsTooltip
                                                    cursor={{ fill: 'transparent' }}
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12, fontWeight: 'bold' }}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                        <div className="text-[10px] font-medium text-slate-400 mt-2 italic flex w-full justify-between px-2">
                                            <span>Centro: Insuficiente</span>
                                            <span>Borda: Excelente</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-100 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Fechar Relatório
                    </button>
                </div>
            </div>
        </div>
    );
};
