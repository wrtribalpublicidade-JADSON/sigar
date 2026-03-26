import React from 'react';
import { X, TrendingUp, Calendar, BookOpen, Clock, Award, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ResponsiveContainerProps } from 'recharts';
import { RegistroFluenciaSAMAHC, Escola } from '../../types';

interface SamahcEvolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    records: { registro: RegistroFluenciaSAMAHC; escola: Escola }[];
}

export const SamahcEvolutionModal: React.FC<SamahcEvolutionModalProps> = ({
    isOpen,
    onClose,
    studentName,
    records
}) => {
    if (!isOpen || !studentName) return null;

    // Sort records by date (createdAt) or Year/Evaluation type
    const sortedRecords = [...records].sort((a, b) => {
        const dateA = new Date(a.registro.createdAt || '').getTime();
        const dateB = new Date(b.registro.createdAt || '').getTime();
        return dateA - dateB;
    });

    // Map performance level to numeric values for the chart
    const getLevelValue = (level: string) => {
        const l = level.toUpperCase();
        if (l.includes('FLUENTE')) return 3;
        if (l.includes('INICIANTE')) return 2;
        if (l.includes('NÃO LEITOR')) return 1;
        return 0;
    };

    const chartData = sortedRecords.map(r => ({
        label: `${r.registro.ano} - ${r.registro.tipoAvaliacao}`,
        value: getLevelValue(r.registro.nivelDesempenho),
        fullLabel: `${r.registro.tipoAvaliacao} (${r.registro.ano})`,
        nivel: r.registro.nivelDesempenho
    }));

    const renderLevelBadge = (level: string) => {
        const l = level.toUpperCase();
        let colors = 'bg-slate-100 text-slate-500';
        if (l.includes('FLUENTE')) colors = 'bg-emerald-50 text-emerald-600 border-emerald-100';
        else if (l.includes('INICIANTE')) colors = 'bg-blue-50 text-blue-600 border-blue-100';
        else if (l.includes('NÃO LEITOR')) colors = 'bg-rose-50 text-rose-600 border-rose-100';

        return (
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${colors} uppercase tracking-wider`}>
                {level}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{studentName}</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Histórico de Evolução em Fluência</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-8">
                    {/* Evolution Chart */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" /> Curva de Aprendizado
                        </h3>
                        <div className="h-64 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="label" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        domain={[0, 3]} 
                                        ticks={[1, 2, 3]}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => {
                                            if (value === 1) return 'NÃO LEITOR';
                                            if (value === 2) return 'INICIANTE';
                                            if (value === 3) return 'FLUENTE';
                                            return '';
                                        }}
                                        tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                        labelStyle={{ fontWeight: 900, color: '#1e293b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase' }}
                                        formatter={(value: any, name: any, props: any) => [
                                            <span className="font-black text-indigo-600 uppercase text-[10px]">{props.payload.nivel}</span>,
                                            'NÍVEL'
                                        ]}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#6366f1" 
                                        strokeWidth={4} 
                                        dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                                        activeDot={{ r: 8, fill: '#6366f1', strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Records Table */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" /> Linha do Tempo de Avaliações
                        </h3>
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="px-4 py-3">Ano</th>
                                        <th className="px-4 py-3">Avaliação</th>
                                        <th className="px-4 py-3 text-center">Série</th>
                                        <th className="px-4 py-3">Escola</th>
                                        <th className="px-4 py-3 text-right">Desempenho</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {sortedRecords.map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="text-[11px] font-black text-slate-800">{r.registro.ano}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-700 uppercase">{r.registro.tipoAvaliacao}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{r.registro.turno || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 font-black text-[9px] uppercase">
                                                    {r.registro.anoSerie}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] font-bold text-slate-500 line-clamp-1 truncate max-w-[180px] uppercase">
                                                    {r.escola.nome}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {renderLevelBadge(r.registro.nivelDesempenho)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl text-[10px] font-black text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all uppercase tracking-widest"
                    >
                        Fechar Histórico
                    </button>
                </div>
            </div>
        </div>
    );
};
