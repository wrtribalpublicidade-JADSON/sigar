import React, { useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { Escola, Visita, Coordenador, StatusMeta } from '../types';
import {
  School, TrendingUp, AlertTriangle, CheckCircle,
  Calendar, Users, ArrowRight, Download, ClipboardList, Target
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { exportToCSV } from '../utils';

interface DashboardProps {
  escolas: Escola[];
  visitas: Visita[];
  coordenadores: Coordenador[];
  onNavigateToEscolas: () => void;
  onNavigateToVisitas: () => void;
}

// Helper: Format Date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export const Dashboard: React.FC<DashboardProps> = ({
  escolas,
  visitas,
  coordenadores,
  onNavigateToEscolas,
  onNavigateToVisitas
}) => {
  // --- Cálculos ---
  const stats = useMemo(() => {
    const totalAlunos = escolas.reduce((acc, e) => acc + e.alunosMatriculados, 0);
    const metasAtrasadas = escolas.reduce((acc, e) => acc + e.planoAcao.filter(m => m.status === StatusMeta.ATRASADO).length, 0);
    const visitasRealizadas = visitas.filter(v => v.status === 'Realizada').length;
    const avgIdeb = escolas.length > 0 ? (escolas.reduce((acc, e) => acc + e.indicadores.ideb, 0) / escolas.length).toFixed(1) : '0';
    const avgFrequencia = escolas.length > 0 ? (escolas.reduce((acc, e) => acc + e.indicadores.frequenciaMedia, 0) / escolas.length).toFixed(0) : '0';

    return { totalAlunos, metasAtrasadas, visitasRealizadas, avgIdeb, avgFrequencia };
  }, [escolas, visitas]);

  // --- Dados de Gráficos ---
  const chartDataIdeb = useMemo(() => {
    return escolas.map(e => ({
      name: e.nome.substring(0, 15) + '...',
      IDEB: e.indicadores.ideb,
    })).slice(0, 5);
  }, [escolas]);

  const chartDataStatus = useMemo(() => {
    const atrasadas = escolas.reduce((acc, e) => acc + e.planoAcao.filter(m => m.status === StatusMeta.ATRASADO).length, 0);
    const emAndamento = escolas.reduce((acc, e) => acc + e.planoAcao.filter(m => m.status === StatusMeta.EM_ANDAMENTO).length, 0);
    const concluidas = escolas.reduce((acc, e) => acc + e.planoAcao.filter(m => m.status === StatusMeta.CONCLUIDO).length, 0);
    return [
      { name: 'Atrasadas', value: atrasadas, color: '#ef4444' },
      { name: 'Em Andamento', value: emAndamento, color: '#f97316' },
      { name: 'Concluídas', value: concluidas, color: '#22c55e' },
    ];
  }, [escolas]);

  const handleExportCSV = () => {
    const data = escolas.map(e => ({
      ESCOLA: e.nome, GESTOR: e.gestor, ALUNOS: e.alunosMatriculados,
      IDEB: e.indicadores.ideb, FREQUENCIA: e.indicadores.frequenciaMedia,
    }));
    exportToCSV(data, 'dashboard_sigar');
  };

  // --- Atividade Recente ---
  const recentActivity = useMemo(() => {
    return visitas.slice(0, 5).map(v => ({
      id: v.id,
      title: `Visita em ${v.escolaNome}`,
      date: formatDate(v.data),
      type: v.tipo,
      status: v.status,
    }));
  }, [visitas]);

  return (
    <div className="space-y-8 animate-fade-in relative">
      <PageHeader
        title="Painel de Monitoramento"
        subtitle="Secretaria Municipal de Educação - Humberto de Campos"
        icon={Target}
        badgeText="System Overview"
        actions={[
          { label: 'Exportar CSV', icon: Download, onClick: handleExportCSV, variant: 'secondary' }
        ]}
      />

      {/* KPI Cards - Modern Soft */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Escolas', val: escolas.length, icon: School, color: 'bg-slate-900', iconColor: 'text-orange-400' },
          { label: 'IDEB Médio', val: stats.avgIdeb, icon: TrendingUp, color: 'bg-emerald-500', iconColor: 'text-white' },
          { label: 'Metas Atrasadas', val: stats.metasAtrasadas, icon: AlertTriangle, color: 'bg-red-500', iconColor: 'text-white' },
          { label: 'Visitas Realizadas', val: stats.visitasRealizadas, icon: CheckCircle, color: 'bg-slate-900', iconColor: 'text-emerald-400' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${kpi.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
              </div>
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tight">{kpi.val}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* IDEB Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Ranking IDEB por Escola</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataIdeb} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 7]} tick={{ fontSize: 11, fontWeight: 500 }} stroke="#64748b" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fontWeight: 500 }} stroke="#64748b" />
                <Tooltip
                  cursor={{ fill: '#fff7ed' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="IDEB" fill="#f97316" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Situação das Metas</h3>
          </div>
          <div className="h-72 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {chartDataStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-4xl font-black text-slate-800 tracking-tight">
                {Math.round((chartDataStatus.find(d => d.name === 'Concluídas')?.value || 0) / (chartDataStatus.reduce((acc, curr) => acc + curr.value, 0) || 1) * 100)}%
              </p>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mt-1">Concluído</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Ações Rápidas</h3>
          </div>
          <div className="space-y-4">
            <button
              onClick={onNavigateToVisitas}
              className="w-full flex items-center justify-between p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wide">Nova Visita</span>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onNavigateToEscolas}
              className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-800/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <School className="w-5 h-5 text-orange-400" />
                <span className="font-bold text-sm uppercase tracking-wide">Ver Escolas</span>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-orange-400" />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-slate-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Atividade Recente</h3>
          </div>
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma atividade registrada.</p>
              </div>
            ) : (
              recentActivity.map(activity => (
                <div key={activity.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 gap-3 sm:gap-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                      <ClipboardList className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{activity.title}</p>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">{activity.date} • {activity.type}</p>
                    </div>
                  </div>
                  <span className={`self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${activity.status === 'Realizada' ? 'bg-emerald-100 text-emerald-700' :
                    activity.status === 'Relatório Pendente' ? 'bg-orange-100 text-orange-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                    {activity.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>

  );
};
