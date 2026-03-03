import React, { useState, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { ChevronDown, FileText, Calendar, Printer, CheckSquare, AlertCircle, FileSpreadsheet, Download, Search, MapPin, Users, GraduationCap, Shield, UserCheck, BarChart3 } from 'lucide-react';
import { Visita, Escola, Coordenador } from '../types';
import { exportToCSV } from '../utils';
import { useNotification } from '../context/NotificationContext';
import { PrintableGerencialReport, TipoRelatorio, FiltroVinculo, SubtipoGestor } from './PrintableGerencialReport';

interface ReportsModuleProps {
   visitas: Visita[];
   escolas: Escola[];
   coordenadores: Coordenador[];
}

type ReportTab = 'visita' | 'gerenciais';

export const ReportsModule: React.FC<ReportsModuleProps> = ({ visitas, escolas, coordenadores }) => {
   const { showNotification } = useNotification();
   const [activeTab, setActiveTab] = useState<ReportTab>('visita');

   // === Visita Tab State ===
   const [selectedCoordId, setSelectedCoordId] = useState<string>('');
   const [startDate, setStartDate] = useState<string>('');
   const [endDate, setEndDate] = useState<string>('');

   // === Gerenciais Tab State ===
   const [selectedTipo, setSelectedTipo] = useState<TipoRelatorio>('professores');
   const [selectedVinculo, setSelectedVinculo] = useState<FiltroVinculo>('Todos');
   const [selectedSubtipoGestor, setSelectedSubtipoGestor] = useState<SubtipoGestor>('Todos');
   const [isPrintingGerencial, setIsPrintingGerencial] = useState(false);

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

   // === Gerenciais Stats ===
   const gerenciaisStats = useMemo(() => {
      const allRh = escolas.flatMap(e => e.recursosHumanos || []);
      const professores = allRh.filter(r => r.funcao === 'Professor(a)');
      const gestores = allRh.filter(r => r.funcao === 'Gestor(a) Geral' || r.funcao === 'Gestor(a) Pedagógico(a)');
      const coordenadoresPed = allRh.filter(r => r.funcao === 'Coordenador(a) Pedagógico(a)');
      return {
         totalProfessores: professores.length,
         professoresEfetivos: professores.filter(r => r.tipoVinculo === 'Efetivo').length,
         professoresContratados: professores.filter(r => r.tipoVinculo === 'Contratado').length,
         totalGestores: gestores.length,
         gestoresEfetivos: gestores.filter(r => r.tipoVinculo === 'Efetivo').length,
         gestoresContratados: gestores.filter(r => r.tipoVinculo === 'Contratado').length,
         totalCoordenadores: coordenadoresPed.length,
         coordenadoresEfetivos: coordenadoresPed.filter(r => r.tipoVinculo === 'Efetivo').length,
         coordenadoresContratados: coordenadoresPed.filter(r => r.tipoVinculo === 'Contratado').length,
      };
   }, [escolas]);

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

   const handlePrintGerencial = () => {
      setIsPrintingGerencial(true);
      setTimeout(() => {
         window.print();
         setIsPrintingGerencial(false);
      }, 300);
   };

   const reportCards = [
      {
         id: 'professores' as TipoRelatorio,
         icon: GraduationCap,
         title: 'Relação de Professores',
         description: 'Corpo docente da rede municipal de ensino',
         total: gerenciaisStats.totalProfessores,
         efetivos: gerenciaisStats.professoresEfetivos,
         contratados: gerenciaisStats.professoresContratados,
         color: 'bg-blue-500',
         lightColor: 'bg-blue-50',
         textColor: 'text-blue-600',
         borderColor: 'border-blue-200',
      },
      {
         id: 'gestores' as TipoRelatorio,
         icon: Shield,
         title: 'Relação de Gestores',
         description: 'Gestores gerais e pedagógicos das unidades',
         total: gerenciaisStats.totalGestores,
         efetivos: gerenciaisStats.gestoresEfetivos,
         contratados: gerenciaisStats.gestoresContratados,
         color: 'bg-purple-500',
         lightColor: 'bg-purple-50',
         textColor: 'text-purple-600',
         borderColor: 'border-purple-200',
      },
      {
         id: 'coordenadores' as TipoRelatorio,
         icon: UserCheck,
         title: 'Coordenadores Pedagógicos',
         description: 'Coordenadores pedagógicos das unidades escolares',
         total: gerenciaisStats.totalCoordenadores,
         efetivos: gerenciaisStats.coordenadoresEfetivos,
         contratados: gerenciaisStats.coordenadoresContratados,
         color: 'bg-emerald-500',
         lightColor: 'bg-emerald-50',
         textColor: 'text-emerald-600',
         borderColor: 'border-emerald-200',
      },
   ];

   return (
      <div className="space-y-8 pb-20 animate-fade-in relative">
         <PageHeader
            title="Central de Relatórios"
            subtitle="Exportação e Auditoria de Visitas"
            icon={FileSpreadsheet}
            badgeText="Auditoria Técnica"
            actions={activeTab === 'visita' ? [
               { label: 'Exportar CSV', icon: Download, onClick: handleExport, variant: 'primary' },
               { label: 'Imprimir', icon: Printer, onClick: handlePrint, variant: 'secondary' }
            ] : []}
         />

         {/* ====== TABS ====== */}
         <div className="flex gap-2 p-1 bg-slate-100 rounded-xl print:hidden">
            {[
               { id: 'visita' as ReportTab, icon: FileText, label: 'Relatório de Visita' },
               { id: 'gerenciais' as ReportTab, icon: BarChart3, label: 'Relatórios Gerenciais' },
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 text-sm font-bold flex items-center gap-2 rounded-lg transition-all ${activeTab === tab.id
                     ? 'bg-white text-orange-600 shadow-sm'
                     : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                     }`}
               >
                  <tab.icon className="w-4 h-4" /> {tab.label}
               </button>
            ))}
         </div>

         {/* ====== VISITA TAB ====== */}
         {activeTab === 'visita' && (
            <>
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
            </>
         )}

         {/* ====== GERENCIAIS TAB ====== */}
         {activeTab === 'gerenciais' && (
            <div className="space-y-8 animate-fade-in">
               {/* Report Type Cards */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {reportCards.map(card => (
                     <button
                        key={card.id}
                        onClick={() => setSelectedTipo(card.id)}
                        className={`text-left p-6 rounded-2xl border-2 transition-all group hover:shadow-lg ${selectedTipo === card.id
                           ? `${card.lightColor} ${card.borderColor} shadow-md`
                           : 'bg-white border-slate-200 hover:border-slate-300'
                           }`}
                     >
                        <div className="flex items-start gap-4">
                           <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg`}>
                              <card.icon className="w-6 h-6 text-white" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <h3 className={`font-bold text-sm mb-1 ${selectedTipo === card.id ? card.textColor : 'text-slate-800'}`}>
                                 {card.title}
                              </h3>
                              <p className="text-xs text-slate-500 mb-3">{card.description}</p>
                              <div className="flex gap-3">
                                 <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    <span className="text-xs font-bold text-slate-600">{card.efetivos} Efetivos</span>
                                 </div>
                                 <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                    <span className="text-xs font-bold text-slate-600">{card.contratados} Contratados</span>
                                 </div>
                              </div>
                           </div>
                           <div className={`text-2xl font-black ${selectedTipo === card.id ? card.textColor : 'text-slate-300'}`}>
                              {card.total}
                           </div>
                        </div>
                     </button>
                  ))}
               </div>

               {/* Filters & Print Action */}
               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-end">
                     <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                           <Users className="w-4 h-4 text-orange-500" /> Tipo de Vínculo
                        </label>
                        <div className="relative">
                           <select
                              value={selectedVinculo}
                              onChange={e => setSelectedVinculo(e.target.value as FiltroVinculo)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 appearance-none shadow-sm"
                           >
                              <option value="Todos">Todos os Vínculos</option>
                              <option value="Efetivo">Somente Efetivos</option>
                              <option value="Contratado">Somente Contratados</option>
                           </select>
                           <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                     </div>

                     {selectedTipo === 'gestores' && (
                        <div className="flex-1 space-y-2">
                           <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                              <Shield className="w-4 h-4 text-purple-500" /> Tipo de Gestor
                           </label>
                           <div className="relative">
                              <select
                                 value={selectedSubtipoGestor}
                                 onChange={e => setSelectedSubtipoGestor(e.target.value as SubtipoGestor)}
                                 className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 appearance-none shadow-sm"
                              >
                                 <option value="Todos">Todos os Gestores</option>
                                 <option value="Gestor(a) Geral">Gestor(a) Geral</option>
                                 <option value="Gestor(a) Pedagógico(a)">Gestor(a) Pedagógico(a)</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                           </div>
                        </div>
                     )}

                     <button
                        onClick={handlePrintGerencial}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
                     >
                        <Printer className="w-5 h-5" /> Imprimir Relatório
                     </button>
                  </div>
               </div>

               {/* Preview Table */}
               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 p-6 flex items-center justify-between border-b border-slate-100">
                     <div className="flex items-center gap-3">
                        {React.createElement(reportCards.find(c => c.id === selectedTipo)?.icon || FileText, { className: `w-5 h-5 ${reportCards.find(c => c.id === selectedTipo)?.textColor || 'text-orange-500'}` })}
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                           Pré-visualização — {reportCards.find(c => c.id === selectedTipo)?.title}
                        </h3>
                     </div>
                     <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-md">
                        {(() => {
                           const allRh = escolas.flatMap(e => (e.recursosHumanos || []).map(r => ({ ...r, escolaNome: e.nome })));
                           let filtered = allRh;
                           if (selectedTipo === 'professores') filtered = allRh.filter(r => r.funcao === 'Professor(a)');
                           else if (selectedTipo === 'gestores') {
                              if (selectedSubtipoGestor !== 'Todos') filtered = allRh.filter(r => r.funcao === selectedSubtipoGestor);
                              else filtered = allRh.filter(r => r.funcao === 'Gestor(a) Geral' || r.funcao === 'Gestor(a) Pedagógico(a)');
                           }
                           else filtered = allRh.filter(r => r.funcao === 'Coordenador(a) Pedagógico(a)');
                           if (selectedVinculo !== 'Todos') filtered = filtered.filter(r => r.tipoVinculo === selectedVinculo);
                           return `${filtered.length} registros`;
                        })()}
                     </span>
                  </div>
                  <div className="overflow-x-auto">
                     {(() => {
                        const allRh = escolas.flatMap(e => (e.recursosHumanos || []).map(r => ({ ...r, escolaNome: e.nome })));
                        let filtered = allRh;
                        if (selectedTipo === 'professores') filtered = allRh.filter(r => r.funcao === 'Professor(a)');
                        else if (selectedTipo === 'gestores') {
                           if (selectedSubtipoGestor !== 'Todos') filtered = allRh.filter(r => r.funcao === selectedSubtipoGestor);
                           else filtered = allRh.filter(r => r.funcao === 'Gestor(a) Geral' || r.funcao === 'Gestor(a) Pedagógico(a)');
                        }
                        else filtered = allRh.filter(r => r.funcao === 'Coordenador(a) Pedagógico(a)');
                        if (selectedVinculo !== 'Todos') filtered = filtered.filter(r => r.tipoVinculo === selectedVinculo);
                        filtered.sort((a, b) => {
                           const dateA = a.dataNomeacao ? new Date(a.dataNomeacao).getTime() : Infinity;
                           const dateB = b.dataNomeacao ? new Date(b.dataNomeacao).getTime() : Infinity;
                           return dateA - dateB;
                        });

                        if (filtered.length === 0) {
                           return (
                              <div className="p-20 text-center flex flex-col items-center justify-center text-slate-400">
                                 <Users className="w-12 h-12 mb-4 opacity-20" />
                                 <p className="font-medium">Nenhum servidor encontrado com os filtros selecionados.</p>
                              </div>
                           );
                        }

                        return (
                           <table className="w-full text-left">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                 <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4 w-12">Nº</th>
                                    <th className="px-6 py-4">Nome</th>
                                    <th className="px-6 py-4">Unidade Escolar</th>
                                    <th className="px-6 py-4">Função</th>
                                    <th className="px-6 py-4 text-center">Vínculo</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {filtered.map((srv, i) => (
                                    <tr key={`${srv.id}-${srv.escolaNome}-${i}`} className="group hover:bg-slate-50 transition-all">
                                       <td className="px-6 py-3 text-xs font-bold text-slate-400">{i + 1}</td>
                                       <td className="px-6 py-3">
                                          <div className="font-bold text-slate-800 text-sm">{srv.nome}</div>
                                          {srv.email && <div className="text-xs text-slate-400 mt-0.5">{srv.email}</div>}
                                       </td>
                                       <td className="px-6 py-3 text-sm text-slate-600 font-medium">{srv.escolaNome}</td>
                                       <td className="px-6 py-3">
                                          <div className="text-sm font-medium text-slate-700">{srv.funcao}</div>
                                          {selectedTipo === 'professores' && srv.etapaAtuacao && (
                                             <div className="text-xs text-slate-400 mt-0.5">
                                                {srv.etapaAtuacao}
                                                {srv.componenteCurricular ? ` • ${srv.componenteCurricular}` : ''}
                                             </div>
                                          )}
                                       </td>
                                       <td className="px-6 py-3 text-center">
                                          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${srv.tipoVinculo === 'Efetivo' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                             {srv.tipoVinculo}
                                          </span>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        );
                     })()}
                  </div>
               </div>
            </div>
         )}

         {/* ====== PRINT PORTAL ====== */}
         {isPrintingGerencial && (
            <PrintableGerencialReport
               tipo={selectedTipo}
               vinculo={selectedVinculo}
               subtipoGestor={selectedTipo === 'gestores' ? selectedSubtipoGestor : undefined}
               escolas={escolas}
            />
         )}
      </div>
   );
};
