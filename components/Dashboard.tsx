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
import { exportToCSV, checkSchoolPendencies } from '../utils';
import { PendingAlerts } from './PendingAlerts';

interface DashboardProps {
  escolas: Escola[];
  visitas: Visita[];
  coordenadores: Coordenador[];
  currentUser?: Coordenador;
  onNavigateToEscolas: () => void;
  onNavigateToVisitas: () => void;
  onNavigateToDetail?: (id: string) => void;
  onNavigateToNotifications: () => void;
  notificationCount?: number;
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
  currentUser,
  onNavigateToEscolas,
  onNavigateToVisitas,
  onNavigateToDetail,
  onNavigateToNotifications,
  notificationCount
}) => {
  // --- Cálculos ---
  const stats = useMemo(() => {
    const totalAlunos = escolas.reduce((acc, e) => acc + e.alunosMatriculados, 0);
    const metasAtrasadas = escolas.reduce((acc, e) => acc + e.planoAcao.filter(m => m.status === StatusMeta.ATRASADO).length, 0);
    const visitasRealizadas = visitas.filter(v => v.status === 'Realizada').length;

    // Calculate Average IDEB for 5th (AI) and 9th (AF)
    const idebAIValues = escolas.map(e => {
      const regs = e.dadosEducacionais?.registrosIDEB || [];
      const latest = regs.length > 0 ? [...regs].sort((a, b) => b.ano - a.ano)[0] : null;
      // Fallback to generic ideb if no specific record found, assuming it might be primary
      return latest ? latest.anosIniciais : (e.indicadores?.ideb || 0);
    }).filter(v => v > 0);
    const avgIdebAI = idebAIValues.length > 0 ? (idebAIValues.reduce((a, b) => a + b, 0) / idebAIValues.length).toFixed(1) : '0.0';

    const idebAFValues = escolas.map(e => {
      const regs = e.dadosEducacionais?.registrosIDEB || [];
      const latest = regs.length > 0 ? [...regs].sort((a, b) => b.ano - a.ano)[0] : null;
      return latest ? latest.anosFinais : 0;
    }).filter(v => v > 0);
    const avgIdebAF = idebAFValues.length > 0 ? (idebAFValues.reduce((a, b) => a + b, 0) / idebAFValues.length).toFixed(1) : '0.0';

    const avgFrequencia = escolas.length > 0 ? (escolas.reduce((acc, e) => acc + e.indicadores.frequenciaMedia, 0) / escolas.length).toFixed(0) : '0';

    return { totalAlunos, metasAtrasadas, visitasRealizadas, avgIdebAI, avgIdebAF, avgFrequencia };
  }, [escolas, visitas]);

  // Use prop if available, otherwise default to 0 (or internal calc if we really wanted fallback, but prop is better for sync)
  const activePendencies = notificationCount || 0;


  // --- Dados de Gráficos ---
  const { chartDataAI, chartDataAF } = useMemo(() => {
    const dataAI = escolas.map(e => {
      const regs = e.dadosEducacionais?.registrosIDEB || [];
      // Get latest record based on year
      const latest = regs.length > 0 ? [...regs].sort((a, b) => b.ano - a.ano)[0] : null;
      return {
        name: e.nome.substring(0, 25) + (e.nome.length > 25 ? '...' : ''),
        IDEB: latest ? latest.anosIniciais : (e.indicadores?.ideb || 0),
      };
    }).filter(d => d.IDEB > 0).sort((a, b) => b.IDEB - a.IDEB).slice(0, 10);

    const dataAF = escolas.map(e => {
      const regs = e.dadosEducacionais?.registrosIDEB || [];
      const latest = regs.length > 0 ? [...regs].sort((a, b) => b.ano - a.ano)[0] : null;
      return {
        name: e.nome.substring(0, 25) + (e.nome.length > 25 ? '...' : ''),
        IDEB: latest ? latest.anosFinais : 0, // Fallback to 0 for AF if no generic IDEB implies AF
      };
    }).filter(d => d.IDEB > 0).sort((a, b) => b.IDEB - a.IDEB).slice(0, 10);

    return { chartDataAI: dataAI, chartDataAF: dataAF };
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

  // KPI List Builder
  interface KpiItem {
    label: string;
    val: number | string;
    icon: React.ElementType;
    color: string;
    iconColor: string;
    isAlert?: boolean;
  }

  const kpiList: KpiItem[] = [
    { label: 'Total de Escolas', val: escolas.length, icon: School, color: 'bg-slate-900', iconColor: 'text-orange-400' },
    { label: 'IDEB Médio (5º Ano)', val: stats.avgIdebAI, icon: TrendingUp, color: 'bg-emerald-500', iconColor: 'text-white' },
    { label: 'IDEB Médio (9º Ano)', val: stats.avgIdebAF, icon: TrendingUp, color: 'bg-sky-500', iconColor: 'text-white' },
    { label: 'Metas Atrasadas', val: stats.metasAtrasadas, icon: AlertTriangle, color: 'bg-red-500', iconColor: 'text-white' },
    { label: 'Visitas Realizadas', val: stats.visitasRealizadas, icon: CheckCircle, color: 'bg-slate-900', iconColor: 'text-emerald-400' },
  ];


  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Dynamic Pendency Alert */}
      {activePendencies > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 rounded-r-xl p-4 shadow-sm animate-pulse-slow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-rose-100 rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-rose-800 text-lg">Atenção Necessária</h3>
              <p className="text-rose-700 font-medium">
                Você possui <span className="font-black text-rose-900">{activePendencies}</span> pendência(s) ativa(s) que requer(em) sua atenção imediata.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToNotifications}
            className="whitespace-nowrap flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all shadow-md active:scale-95 text-sm"
          >
            Ver Pendências
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Alerts System */}
      {currentUser && onNavigateToDetail && (
        <div id="pending-alerts-section">
          <PendingAlerts
            escolas={escolas}
            coordenador={currentUser}
            onNavigateToEscola={onNavigateToDetail}
          />
        </div>
      )}


      {/* Pending Alerts System */}
      {currentUser && onNavigateToDetail && (
        <div id="pending-alerts-section">
          <PendingAlerts
            escolas={escolas}
            coordenador={currentUser}
            onNavigateToEscola={onNavigateToDetail}
          />
        </div>
      )}

      {/* KPI Cards - Modern Soft */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiList.map((kpi, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 relative overflow-hidden group hover:shadow-md transition-all duration-300 ${kpi.isAlert ? 'cursor-pointer ring-2 ring-rose-500 ring-offset-2' : ''}`}
            onClick={() => {
              if (kpi.isAlert) {
                document.getElementById('pending-alerts-section')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${kpi.color} rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
              </div>
              {kpi.isAlert && <span className="text-[10px] font-bold text-rose-500 bg-rose-100 px-2 py-1 rounded-full uppercase">Ação Necessária</span>}
            </div>
            <p className={`text-3xl font-black tracking-tight ${kpi.isAlert ? 'text-rose-600' : 'text-slate-800'}`}>{kpi.val}</p>
            <p className={`text-xs font-bold uppercase tracking-wider mt-2 ${kpi.isAlert ? 'text-rose-400' : 'text-slate-400'}`}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* IDEB Chart - Anos Iniciais */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Ranking IDEB - 5º Ano (AI)</h3>
          </div>
          <div className="h-72 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataAI} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11, fontWeight: 500 }} stroke="#64748b" />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11, fontWeight: 500 }} stroke="#64748b" />
                <Tooltip
                  cursor={{ fill: '#fff7ed' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="IDEB" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* IDEB Chart - Anos Finais */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Ranking IDEB - 9º Ano (AF)</h3>
          </div>
          <div className="h-72 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataAF} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11, fontWeight: 500 }} stroke="#64748b" />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11, fontWeight: 500 }} stroke="#64748b" />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="IDEB" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions & Activity */}
      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
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

  );
};