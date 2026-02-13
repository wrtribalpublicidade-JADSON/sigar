import React, { useState, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { ChevronDown, FileText, Calendar, Printer, CheckSquare, AlertCircle, FileSpreadsheet, Download, Search, MapPin } from 'lucide-react';
import { Visita, Escola, Coordenador } from '../types';
import { exportToCSV } from '../utils';
import { useNotification } from '../context/NotificationContext';

interface ReportsModuleProps {
   visitas: Visita[];
   escolas: Escola[];
   coordenadores: Coordenador[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ visitas, escolas, coordenadores }) => {
   const { showNotification } = useNotification();
   const [selectedCoordId, setSelectedCoordId] = useState<string>('');
   const [startDate, setStartDate] = useState<string>('');
   const [endDate, setEndDate] = useState<string>('');

   const filteredData = useMemo(() => {
      return visitas.filter(visita => {
         if (selectedCoordId) {
            const coordenador = coordenadores.find(c => c.id === selectedCoordId);
            if (!coordenador || !coordenador.escolasIds.includes(visita.escolaId)) return false;
         }
         if (startDate && new Date(visita.data) < new Date(startDate)) return false;
         if (endDate && new Date(visita.data) > new Date(endDate)) return false;
         return true;
      }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
   }, [visitas, coordenadores, selectedCoordId, startDate, endDate]);

   const stats = useMemo(() => {
      const total = filteredData.length;
      const realizadas = filteredData.filter(v => v.status === 'Realizada').length;
      const escolasAtendidas = new Set(filteredData.map(v => v.escolaId)).size;
      const encaminhamentosPendentes = filteredData.reduce((acc, v) => acc + (v.encaminhamentosRegistrados?.filter(e => e.status === 'Pendente').length || 0), 0);
      return { total, realizadas, escolasAtendidas, encaminhamentosPendentes };
   }, [filteredData]);

   const handleExport = () => {
      const dataToExport = filteredData.map(v => ({
         DATA: new Date(v.data).toLocaleDateString(), ESCOLA: v.escolaNome, TIPO: v.tipo, STATUS: v.status,
         PAUTA: v.topicosPauta?.map(t => t.descricao).join('; ') || '',
         ENCAMINHAMENTOS: v.encaminhamentosRegistrados?.map(e => `${e.descricao} (${e.responsavel})`).join('; ') || '',
         FEEDBACK: v.encaminhamentos || ''
      }));
      exportToCSV(dataToExport, 'relatorio_consolidado_visitas');
      showNotification('success', 'Relatório exportado com sucesso');
   };

   const handlePrint = () => window.print();

   return (
      <div className="space-y-8 pb-20 animate-fade-in relative">
         <PageHeader
            title="Central de Relatórios"
            subtitle="Exportação e Auditoria de Visitas"
            icon={FileSpreadsheet}
            badgeText="Auditoria Técnica"
            actions={[
               { label: 'Exportar CSV', icon: Download, onClick: handleExport, variant: 'primary' },
               { label: 'Imprimir', icon: Printer, onClick: handlePrint, variant: 'secondary' }
            ]}
         />

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden">
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Search className="w-4 h-4 text-orange-500" /> Coordenador
               </label>
               <div className="relative">
                  <select
                     value={selectedCoordId}
                     onChange={e => setSelectedCoordId(e.target.value)}
                     className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 appearance-none shadow-sm"
                  >
                     <option value="">Todos os Coordenadores</option>
                     {coordenadores.map(c => <option key={c.id} value={c.id}>{c.nome.toUpperCase()} - {c.regiao.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" /> Data Inicial
               </label>
               <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 shadow-sm"
               />
            </div>

            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" /> Data Final
               </label>
               <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 shadow-sm"
               />
            </div>
         </div>

         <div id="print-area" className="space-y-8">
            {/* KPI Matrix */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                  { label: 'Visitas Identificadas', val: stats.total, icon: FileText, color: 'bg-slate-900', iconColor: 'text-orange-500' },
                  { label: 'Unidades Atendidas', val: stats.escolasAtendidas, icon: MapPin, color: 'bg-slate-900', iconColor: 'text-orange-500' },
                  { label: 'Confirmadas', val: stats.realizadas, icon: CheckSquare, color: 'bg-emerald-500', iconColor: 'text-white' },
                  { label: 'Pendências Críticas', val: stats.encaminhamentosPendentes, icon: AlertCircle, color: 'bg-red-500', iconColor: 'text-white' },
               ].map((k, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center group hover:shadow-md transition-all">
                     <div className={`w-12 h-12 ${k.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                        <k.icon className={`w-6 h-6 ${k.iconColor}`} />
                     </div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{k.label}</p>
                     <p className="text-3xl font-black text-slate-800">{k.val}</p>
                  </div>
               ))}
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="bg-slate-50 p-6 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                     <FileText className="w-5 h-5 text-orange-500" />
                     <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Log Consolidado de Visitas Técnicas</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-md">Records: {filteredData.length}</span>
               </div>
               <div className="overflow-x-auto">
                  {filteredData.length === 0 ? (
                     <div className="p-20 text-center flex flex-col items-center justify-center text-slate-400">
                        <Search className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium">Nenhuma ocorrência identificada no período.</p>
                     </div>
                  ) : (
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                           <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              <th className="px-8 py-4">Data / Escola</th>
                              <th className="px-6 py-4">Classificação / Status</th>
                              <th className="px-6 py-4">Focos Prioritários</th>
                              <th className="px-8 py-4 text-right">Encaminhamentos</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {filteredData.map(visita => (
                              <tr key={visita.id} className="group hover:bg-slate-50 transition-all">
                                 <td className="px-8 py-4">
                                    <div className="text-xs font-bold text-orange-600 mb-0.5">{new Date(visita.data).toLocaleDateString()}</div>
                                    <div className="font-bold text-slate-800 text-sm">{visita.escolaNome}</div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex flex-col gap-2">
                                       <span className={`inline-flex px-2 py-1 text-[10px] font-bold rounded-md w-fit ${visita.tipo === 'Emergencial' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                                          {visita.tipo}
                                       </span>
                                       <span className={`text-[10px] font-bold uppercase tracking-wide ${visita.status === 'Relatório Pendente' ? 'text-orange-500' : 'text-green-600'}`}>
                                          {visita.status}
                                       </span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1 mb-2">
                                       {visita.foco.map(f => (<span key={f} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{f}</span>))}
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 italic">"{visita.encaminhamentos || 'Sem feedback'}"</p>
                                 </td>
                                 <td className="px-8 py-4 text-right">
                                    <div className="flex flex-col items-end gap-1">
                                       <span className="text-xl font-bold text-slate-800">{visita.encaminhamentosRegistrados?.length || 0}</span>
                                       <span className="text-[10px] font-bold text-slate-400 uppercase">Diretrizes</span>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}
               </div>
            </div>
         </div>
         <style>{`@media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; border: none !important; } }`}</style>
      </div>
   );
};
