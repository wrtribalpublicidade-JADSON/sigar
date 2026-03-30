import React, { useState, useMemo } from 'react';
import { PageHeader } from './ui/PageHeader';
import { ChevronDown, ChevronRight, FileText, Calendar, Printer, CheckSquare, AlertCircle, FileSpreadsheet, Download, Search, MapPin, Users, GraduationCap, Shield, UserCheck, BarChart3, Briefcase, Building2, Phone, Mail } from 'lucide-react';
import { Visita, Escola, Coordenador, RecursoHumano } from '../types';
import { exportToCSV } from '../utils';
import { useNotification } from '../context/NotificationContext';
import { PrintableGerencialReport, TipoRelatorio, FiltroVinculo, SubtipoGestor } from './PrintableGerencialReport';
import { PrintableMatriculaReport } from './PrintableMatriculaReport';
import { PrintableMatriculaDetalhadaReport } from './PrintableMatriculaDetalhadaReport';
import { PrintableServidoresReport } from './PrintableServidoresReport';

interface ReportsModuleProps {
   visitas: Visita[];
   escolas: Escola[];
   coordenadores: Coordenador[];
}

type ReportTab = 'visita' | 'gerenciais' | 'matriculas' | 'servidores';

interface ServidorCompleto extends RecursoHumano {
   escolaNome: string;
   escolaId: string;
   escolaLocalizacao: string;
}

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

   // === Matriculas Tab State ===
   const [selectedLocalizacao, setSelectedLocalizacao] = useState<string>('Todas');
   const [isPrintingMatricula, setIsPrintingMatricula] = useState(false);
   const [isPrintingMatriculaDetalhada, setIsPrintingMatriculaDetalhada] = useState(false);
   const [expandedEscolaId, setExpandedEscolaId] = useState<string | null>(null);
   const [matriculaSubTab, setMatriculaSubTab] = useState<'consolidado' | 'detalhado'>('consolidado');
   const [selectedTurno, setSelectedTurno] = useState<'Todos' | 'Integral' | 'Manhã' | 'Tarde'>('Todos');

   // === Servidores Tab State ===
   const [servidorFuncaoFilter, setServidorFuncaoFilter] = useState<string>('Todas');
   const [servidorVinculoFilter, setServidorVinculoFilter] = useState<string>('Todos');
   const [servidorEscolaFilter, setServidorEscolaFilter] = useState<string>('Todas');
   const [servidorSearchTerm, setServidorSearchTerm] = useState<string>('');
   const [isPrintingServidores, setIsPrintingServidores] = useState(false);

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

   const handlePrintMatricula = () => {
        if (matriculaSubTab === 'detalhado') {
            setIsPrintingMatriculaDetalhada(true);
            setTimeout(() => {
                window.print();
                setIsPrintingMatriculaDetalhada(false);
            }, 300);
        } else {
            setIsPrintingMatricula(true);
            setTimeout(() => {
                window.print();
                setIsPrintingMatricula(false);
            }, 300);
        }
    };

    // Helper to extract alunos by turno from a DadosNivel node
    const getAlunosByTurno = (node: any, turno: 'Todos' | 'Integral' | 'Manhã' | 'Tarde'): number => {
        if (!node?.alunos) return 0;
        if (turno === 'Todos') return (node.alunos.integral || 0) + (node.alunos.manha || 0) + (node.alunos.tarde || 0);
        if (turno === 'Integral') return node.alunos.integral || 0;
        if (turno === 'Manhã') return node.alunos.manha || 0;
        if (turno === 'Tarde') return node.alunos.tarde || 0;
        return 0;
    };

    // Grade definitions for the detailed report
    const GRADES = [
        { key: 'creche2', label: 'Creche II', segment: 'infantil', group: 'Educação Infantil' },
        { key: 'creche3', label: 'Creche III', segment: 'infantil', group: 'Educação Infantil' },
        { key: 'pre1', label: 'Pré I', segment: 'infantil', group: 'Educação Infantil' },
        { key: 'pre2', label: 'Pré II', segment: 'infantil', group: 'Educação Infantil' },
        { key: 'ano1', label: '1º Ano', segment: 'fundamental', group: 'Anos Iniciais' },
        { key: 'ano2', label: '2º Ano', segment: 'fundamental', group: 'Anos Iniciais' },
        { key: 'ano3', label: '3º Ano', segment: 'fundamental', group: 'Anos Iniciais' },
        { key: 'ano4', label: '4º Ano', segment: 'fundamental', group: 'Anos Iniciais' },
        { key: 'ano5', label: '5º Ano', segment: 'fundamental', group: 'Anos Iniciais' },
        { key: 'ano6', label: '6º Ano', segment: 'fundamental', group: 'Anos Finais' },
        { key: 'ano7', label: '7º Ano', segment: 'fundamental', group: 'Anos Finais' },
        { key: 'ano8', label: '8º Ano', segment: 'fundamental', group: 'Anos Finais' },
        { key: 'ano9', label: '9º Ano', segment: 'fundamental', group: 'Anos Finais' },
        { key: 'eja', label: 'EJA', segment: 'fundamental', group: 'EJA' },
    ] as const;

    // === Matricula Stats ===
    const matriculaStats = useMemo(() => {
        const filtered = escolas.filter(e => selectedLocalizacao === 'Todas' || e.localizacao === selectedLocalizacao);
        return filtered.reduce((acc, e) => {
            acc.total += e.alunosMatriculados || 0;
            acc.infantil += e.dadosEducacionais?.matricula?.infantil || 0;
            acc.iniciais += e.dadosEducacionais?.matricula?.anosIniciais || 0;
            acc.finais += e.dadosEducacionais?.matricula?.anosFinais || 0;
            acc.eja += e.dadosEducacionais?.matricula?.eja || 0;
            return acc;
        }, { total: 0, infantil: 0, iniciais: 0, finais: 0, eja: 0 });
    }, [escolas, selectedLocalizacao]);

    // === Detailed Matricula Stats (by grade, respecting turno filter) ===
    const matriculaDetalhada = useMemo(() => {
        const filtered = escolas.filter(e => selectedLocalizacao === 'Todas' || e.localizacao === selectedLocalizacao);
        const gradeMap: Record<string, number> = {};
        let total = 0;
        GRADES.forEach(g => {
            gradeMap[g.key] = 0;
            filtered.forEach(e => {
                const det = e.dadosEducacionais?.matriculaDetalhada as any;
                if (!det) return;
                const node = det?.[g.segment]?.[g.key];
                const val = getAlunosByTurno(node, selectedTurno);
                gradeMap[g.key] += val;
                total += val;
            });
        });
        return { gradeMap, total };
    }, [escolas, selectedLocalizacao, selectedTurno]);

   // === Servidores: All HR employees across all schools ===
   const todosServidores = useMemo<ServidorCompleto[]>(() => {
      return escolas.flatMap(escola =>
         (escola.recursosHumanos || []).map(srv => ({
            ...srv,
            escolaNome: escola.nome,
            escolaId: escola.id,
            escolaLocalizacao: escola.localizacao || '',
         }))
      );
   }, [escolas]);

   const funcoesDisponiveis = useMemo(() => {
      const set = new Set(todosServidores.map(s => s.funcao));
      return Array.from(set).sort();
   }, [todosServidores]);

   const servidoresFiltrados = useMemo(() => {
      let filtered = todosServidores;
      if (servidorFuncaoFilter !== 'Todas') {
         filtered = filtered.filter(s => s.funcao === servidorFuncaoFilter);
      }
      if (servidorVinculoFilter !== 'Todos') {
         filtered = filtered.filter(s => s.tipoVinculo === servidorVinculoFilter);
      }
      if (servidorEscolaFilter !== 'Todas') {
         filtered = filtered.filter(s => s.escolaId === servidorEscolaFilter);
      }
      if (servidorSearchTerm.trim()) {
         const term = servidorSearchTerm.toLowerCase().trim();
         filtered = filtered.filter(s =>
            s.nome.toLowerCase().includes(term) ||
            (s.email && s.email.toLowerCase().includes(term)) ||
            (s.cpf && s.cpf.includes(term))
         );
      }
      return filtered.sort((a, b) => a.nome.localeCompare(b.nome));
   }, [todosServidores, servidorFuncaoFilter, servidorVinculoFilter, servidorEscolaFilter, servidorSearchTerm]);

   const servidoresStats = useMemo(() => {
      const efetivos = servidoresFiltrados.filter(s => s.tipoVinculo === 'Efetivo').length;
      const contratados = servidoresFiltrados.filter(s => s.tipoVinculo === 'Contratado').length;
      const permutados = servidoresFiltrados.filter(s => s.tipoVinculo === 'Permutado').length;
      const escolasComServidor = new Set(servidoresFiltrados.map(s => s.escolaId)).size;
      const funcoes = new Set(servidoresFiltrados.map(s => s.funcao)).size;
      return { total: servidoresFiltrados.length, efetivos, contratados, permutados, escolasComServidor, funcoes };
   }, [servidoresFiltrados]);

   const handlePrintServidores = () => {
      setIsPrintingServidores(true);
      setTimeout(() => {
         window.print();
         setIsPrintingServidores(false);
      }, 300);
   };

   const handleExportServidoresCSV = () => {
      const dataToExport = servidoresFiltrados.map((s, i) => ({
         'Nº': i + 1,
         'NOME': s.nome,
         'CPF': s.cpf || '',
         'DATA NASCIMENTO': s.dataNascimento ? new Date(s.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '',
         'FUNÇÃO': s.funcao,
         'VÍNCULO': s.tipoVinculo,
         'CARGA HORÁRIA': s.cargaHoraria || '',
         'UNIDADE ESCOLAR': s.escolaNome,
         'LOCALIZAÇÃO': s.escolaLocalizacao,
         'TELEFONE': s.telefone || '',
         'E-MAIL': s.email || '',
         'DATA NOMEAÇÃO': s.dataNomeacao ? new Date(s.dataNomeacao + 'T12:00:00').toLocaleDateString('pt-BR') : '',
         'ETAPA ATUAÇÃO': s.etapaAtuacao || '',
         'COMPONENTE CURRICULAR': s.componenteCurricular || '',
      }));
      exportToCSV(dataToExport, 'controle_geral_servidores');
      showNotification('success', 'Relatório de servidores exportado com sucesso');
   };

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
               { id: 'matriculas' as ReportTab, icon: GraduationCap, label: 'Controle de Matrículas' },
               { id: 'servidores' as ReportTab, icon: Briefcase, label: 'Controle de Servidores' },
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
                           {coordenadores.map(c => <option key={c.id} value={c.id}>{(c.nome || '').toUpperCase()} - {(c.regiao || 'Sem Região').toUpperCase()}</option>)}
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

         {/* ====== MATRICULAS TAB ====== */}
         {activeTab === 'matriculas' && (
            <div className="space-y-8 animate-fade-in">
               {/* Sub-tabs: Consolidado / Detalhado */}
               <div className="flex gap-2 print:hidden">
                  {[
                     { id: 'consolidado' as const, label: 'Consolidado por Segmento', icon: BarChart3 },
                     { id: 'detalhado' as const, label: 'Detalhado por Ano/Série', icon: GraduationCap },
                  ].map(sub => (
                     <button
                        key={sub.id}
                        onClick={() => setMatriculaSubTab(sub.id)}
                        className={`px-5 py-2.5 text-sm font-bold flex items-center gap-2 rounded-xl border-2 transition-all ${
                           matriculaSubTab === sub.id
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                        }`}
                     >
                        <sub.icon className="w-4 h-4" /> {sub.label}
                     </button>
                  ))}
               </div>

               {/* Filters & Export */}
               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-end">
                     <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                           <MapPin className="w-4 h-4 text-indigo-500" /> Localização das Unidades
                        </label>
                        <div className="relative">
                           <select
                              value={selectedLocalizacao}
                              onChange={e => setSelectedLocalizacao(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none shadow-sm"
                           >
                              <option value="Todas">Todas as Localizações</option>
                              <option value="Sede">Sede</option>
                              <option value="Zona Rural">Zona Rural</option>
                           </select>
                           <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                     </div>

                     {matriculaSubTab === 'detalhado' && (
                        <div className="flex-1 space-y-2">
                           <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-indigo-500" /> Turno
                           </label>
                           <div className="relative">
                              <select
                                 value={selectedTurno}
                                 onChange={e => setSelectedTurno(e.target.value as any)}
                                 className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none shadow-sm"
                              >
                                 <option value="Todos">Todos os Turnos</option>
                                 <option value="Integral">Integral</option>
                                 <option value="Manhã">Manhã</option>
                                 <option value="Tarde">Tarde</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                           </div>
                        </div>
                     )}

                     <button
                        onClick={handlePrintMatricula}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
                     >
                        <Printer className="w-5 h-5" /> Imprimir Relatório
                     </button>
                  </div>
               </div>

               {/* ====== CONSOLIDADO SUB-TAB ====== */}
               {matriculaSubTab === 'consolidado' && (
                  <>
                     {/* KPI Matrix */}
                     <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                           { label: 'Total Geral', val: matriculaStats.total, color: 'bg-slate-900', textColor: 'text-white' },
                           { label: 'Infantil', val: matriculaStats.infantil, color: 'bg-white', textColor: 'text-indigo-600' },
                           { label: 'Anos Iniciais', val: matriculaStats.iniciais, color: 'bg-white', textColor: 'text-indigo-600' },
                           { label: 'Anos Finais', val: matriculaStats.finais, color: 'bg-white', textColor: 'text-indigo-600' },
                           { label: 'EJA', val: matriculaStats.eja, color: 'bg-white', textColor: 'text-indigo-600' },
                        ].map((k, i) => (
                           <div key={i} className={`${k.color} rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center text-center`}>
                              <p className={`text-[10px] font-bold ${k.textColor} opacity-60 uppercase tracking-wider mb-1`}>{k.label}</p>
                              <p className={`text-2xl font-black ${k.textColor}`}>{k.val.toLocaleString()}</p>
                           </div>
                        ))}
                     </div>

                     {/* Table Consolidada */}
                     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-6 border-b border-slate-100">
                           <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                              <FileText className="w-5 h-5 text-indigo-600" /> Consolidado de Matrículas por Unidade
                           </h3>
                        </div>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                 <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Escola</th>
                                    <th className="px-4 py-4 text-center">Infantil</th>
                                    <th className="px-4 py-4 text-center">Iniciais</th>
                                    <th className="px-4 py-4 text-center">Finais</th>
                                    <th className="px-4 py-4 text-center">EJA</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {escolas
                                    .filter(e => selectedLocalizacao === 'Todas' || e.localizacao === selectedLocalizacao)
                                    .sort((a,b) => b.alunosMatriculados - a.alunosMatriculados)
                                    .map(escola => (
                                    <React.Fragment key={escola.id}>
                                       <tr 
                                          onClick={() => setExpandedEscolaId(expandedEscolaId === escola.id ? null : escola.id)}
                                          className={`transition-colors cursor-pointer ${expandedEscolaId === escola.id ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}
                                       >
                                          <td className="px-6 py-4">
                                             <div className="flex items-center gap-3">
                                                <div className={`transition-transform duration-200 ${expandedEscolaId === escola.id ? 'rotate-90' : ''}`}>
                                                   <ChevronRight className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <div>
                                                   <div className="font-bold text-slate-800 text-sm">{escola.nome}</div>
                                                   <div className="text-[10px] text-slate-400 font-bold uppercase">{escola.localizacao}</div>
                                                </div>
                                             </div>
                                          </td>
                                          <td className="px-4 py-4 text-center text-sm font-medium text-slate-600">{escola.dadosEducacionais?.matricula?.infantil || 0}</td>
                                          <td className="px-4 py-4 text-center text-sm font-medium text-slate-600">{escola.dadosEducacionais?.matricula?.anosIniciais || 0}</td>
                                          <td className="px-4 py-4 text-center text-sm font-medium text-slate-600">{escola.dadosEducacionais?.matricula?.anosFinais || 0}</td>
                                          <td className="px-4 py-4 text-center text-sm font-medium text-slate-600">{escola.dadosEducacionais?.matricula?.eja || 0}</td>
                                          <td className="px-6 py-4 text-right">
                                             <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                                                {escola.alunosMatriculados}
                                             </span>
                                          </td>
                                       </tr>
                                       {expandedEscolaId === escola.id && (
                                          <tr className="bg-slate-50/30 border-b border-slate-100">
                                             <td colSpan={6} className="px-8 py-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in">
                                                   <div className="space-y-3">
                                                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2">Educação Infantil</h4>
                                                      <div className="space-y-2">
                                                         {[
                                                            { label: 'Creche II', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.infantil?.creche2 },
                                                            { label: 'Creche III', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.infantil?.creche3 },
                                                            { label: 'Pré I', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.infantil?.pre1 },
                                                            { label: 'Pré II', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.infantil?.pre2 },
                                                         ].map(item => (
                                                            <div key={item.label} className="flex justify-between items-center text-xs">
                                                               <span className="text-slate-500 font-medium">{item.label}</span>
                                                               <span className="font-bold text-slate-700">{ (item.val?.alunos?.integral || 0) + (item.val?.alunos?.manha || 0) + (item.val?.alunos?.tarde || 0) }</span>
                                                            </div>
                                                         ))}
                                                      </div>
                                                   </div>
                                                   <div className="space-y-3">
                                                      <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2">Anos Iniciais</h4>
                                                      <div className="space-y-2">
                                                         {[
                                                            { label: '1º Ano', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.fundamental?.ano1 },
                                                            { label: '2º Ano', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.fundamental?.ano2 },
                                                            { label: '3º Ano', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.fundamental?.ano3 },
                                                            { label: '4º Ano', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.fundamental?.ano4 },
                                                            { label: '5º Ano', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.fundamental?.ano5 },
                                                         ].map(item => (
                                                            <div key={item.label} className="flex justify-between items-center text-xs">
                                                               <span className="text-slate-500 font-medium">{item.label}</span>
                                                               <span className="font-bold text-slate-700">{ (item.val?.alunos?.integral || 0) + (item.val?.alunos?.manha || 0) + (item.val?.alunos?.tarde || 0) }</span>
                                                            </div>
                                                         ))}
                                                      </div>
                                                   </div>
                                                   <div className="space-y-3">
                                                      <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest border-b border-orange-100 pb-2">Anos Finais</h4>
                                                      <div className="space-y-2">
                                                         {[
                                                            { label: '6º Ano', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.fundamental?.ano6 },
                                                            { label: '7º Ano', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.fundamental?.ano7 },
                                                            { label: '8º Ano', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.fundamental?.ano8 },
                                                            { label: '9º Ano', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.fundamental?.ano9 },
                                                         ].map(item => (
                                                            <div key={item.label} className="flex justify-between items-center text-xs">
                                                               <span className="text-slate-500 font-medium">{item.label}</span>
                                                               <span className="font-bold text-slate-700">{ (item.val?.alunos?.integral || 0) + (item.val?.alunos?.manha || 0) + (item.val?.alunos?.tarde || 0) }</span>
                                                            </div>
                                                         ))}
                                                      </div>
                                                   </div>
                                                   <div className="space-y-3">
                                                      <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-200 pb-2">EJA / Outros</h4>
                                                      <div className="space-y-2">
                                                         {[
                                                            { label: 'EJA', val: (escola.dadosEducacionais?.matriculaDetalhada as any)?.fundamental?.eja },
                                                         ].map(item => (
                                                            <div key={item.label} className="flex justify-between items-center text-xs">
                                                               <span className="text-slate-500 font-medium">{item.label}</span>
                                                               <span className="font-bold text-slate-700">{ (item.val?.alunos?.integral || 0) + (item.val?.alunos?.manha || 0) + (item.val?.alunos?.tarde || 0) }</span>
                                                            </div>
                                                         ))}
                                                      </div>
                                                   </div>
                                                </div>
                                             </td>
                                          </tr>
                                       )}
                                    </React.Fragment>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </>
               )}

               {/* ====== DETALHADO SUB-TAB ====== */}
               {matriculaSubTab === 'detalhado' && (
                  <>
                     {/* KPI per grade */}
                     <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
                        <div className="col-span-full lg:col-span-1 bg-slate-900 rounded-2xl border border-slate-700 shadow-sm p-4 flex flex-col items-center justify-center text-center">
                           <p className="text-[9px] font-bold text-white opacity-60 uppercase tracking-wider mb-1">Total Geral</p>
                           <p className="text-2xl font-black text-white">{matriculaDetalhada.total.toLocaleString()}</p>
                           {selectedTurno !== 'Todos' && <p className="text-[9px] text-indigo-300 font-bold mt-1">Turno: {selectedTurno}</p>}
                        </div>
                        {GRADES.map(g => {
                           const val = matriculaDetalhada.gradeMap[g.key];
                           const groupColor = g.group === 'Educação Infantil' ? 'text-indigo-600' :
                              g.group === 'Anos Iniciais' ? 'text-emerald-600' :
                              g.group === 'Anos Finais' ? 'text-orange-600' : 'text-slate-600';
                           return (
                              <div key={g.key} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col items-center justify-center text-center hover:shadow-md transition-all">
                                 <p className={`text-[8px] font-bold ${groupColor} uppercase tracking-wider mb-0.5`}>{g.label}</p>
                                 <p className={`text-lg font-black ${groupColor}`}>{val}</p>
                              </div>
                           );
                        })}
                     </div>

                     {/* Detailed Table */}
                     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
                           <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                              <GraduationCap className="w-5 h-5 text-indigo-600" /> Detalhamento de Matrículas por Ano/Série
                              {selectedTurno !== 'Todos' && <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md ml-2">Turno: {selectedTurno}</span>}
                           </h3>
                           <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-md">
                              {escolas.filter(e => selectedLocalizacao === 'Todas' || e.localizacao === selectedLocalizacao).length} unidades
                           </span>
                        </div>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left" style={{ minWidth: '1200px' }}>
                              <thead>
                                 <tr className="bg-slate-800 text-white">
                                    <th rowSpan={2} className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider border-r border-slate-700 sticky left-0 bg-slate-800 z-10 min-w-[200px]">Unidade Escolar</th>
                                    <th colSpan={4} className="px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-center border-r border-slate-700 bg-indigo-900/50">Educação Infantil</th>
                                    <th colSpan={5} className="px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-center border-r border-slate-700 bg-emerald-900/50">Anos Iniciais</th>
                                    <th colSpan={4} className="px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-center border-r border-slate-700 bg-orange-900/50">Anos Finais</th>
                                    <th className="px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-center border-r border-slate-700 bg-slate-700">EJA</th>
                                    <th rowSpan={2} className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-center bg-slate-900">Total</th>
                                 </tr>
                                 <tr className="bg-slate-700 text-white text-[8px] font-bold uppercase tracking-wider">
                                    {GRADES.map(g => (
                                       <th key={g.key} className="px-1 py-2 text-center border-r border-slate-600 whitespace-nowrap">{g.label}</th>
                                    ))}
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {escolas
                                    .filter(e => selectedLocalizacao === 'Todas' || e.localizacao === selectedLocalizacao)
                                    .sort((a, b) => a.nome.localeCompare(b.nome))
                                    .map((escola, idx) => {
                                       const det = escola.dadosEducacionais?.matriculaDetalhada as any;
                                       let rowTotal = 0;
                                       const values = GRADES.map(g => {
                                          const node = det?.[g.segment]?.[g.key];
                                          const val = getAlunosByTurno(node, selectedTurno);
                                          rowTotal += val;
                                          return val;
                                       });
                                       return (
                                          <tr key={escola.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/30 transition-colors`}>
                                             <td className="px-4 py-3 sticky left-0 z-10" style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                                <div className="font-bold text-slate-800 text-xs">{escola.nome}</div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase">{escola.localizacao}</div>
                                             </td>
                                             {values.map((val, i) => (
                                                <td key={GRADES[i].key} className={`px-1 py-3 text-center text-xs font-medium ${
                                                   val > 0 ? 'text-slate-700' : 'text-slate-300'
                                                } ${i === 3 || i === 8 || i === 12 ? 'border-r border-slate-200' : ''}`}>
                                                   {val || '-'}
                                                </td>
                                             ))}
                                             <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                                                   {rowTotal}
                                                </span>
                                             </td>
                                          </tr>
                                       );
                                    })}
                              </tbody>
                              <tfoot>
                                 <tr className="bg-slate-900 text-white font-bold">
                                    <td className="px-4 py-3 text-xs uppercase tracking-wider sticky left-0 z-10 bg-slate-900">Total da Rede</td>
                                    {GRADES.map(g => (
                                       <td key={g.key} className={`px-1 py-3 text-center text-xs ${g.key === 'pre2' || g.key === 'ano5' || g.key === 'ano9' ? 'border-r border-slate-700' : ''}`}>
                                          {matriculaDetalhada.gradeMap[g.key]}
                                       </td>
                                    ))}
                                    <td className="px-4 py-3 text-center text-sm font-black text-orange-400">
                                       {matriculaDetalhada.total}
                                    </td>
                                 </tr>
                              </tfoot>
                           </table>
                        </div>
                     </div>
                  </>
               )}
            </div>
         )}

         {/* ====== SERVIDORES TAB ====== */}
         {activeTab === 'servidores' && (
            <div className="space-y-8 animate-fade-in">
               {/* Filters */}
               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                     {/* Busca por nome */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                           <Search className="w-4 h-4 text-cyan-500" /> Buscar Servidor
                        </label>
                        <div className="relative">
                           <input
                              type="text"
                              value={servidorSearchTerm}
                              onChange={e => setServidorSearchTerm(e.target.value)}
                              placeholder="Nome, e-mail ou CPF..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 shadow-sm"
                           />
                        </div>
                     </div>

                     {/* Filtro por Função */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                           <Briefcase className="w-4 h-4 text-cyan-500" /> Função / Cargo
                        </label>
                        <div className="relative">
                           <select
                              value={servidorFuncaoFilter}
                              onChange={e => setServidorFuncaoFilter(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 appearance-none shadow-sm"
                           >
                              <option value="Todas">Todas as Funções</option>
                              {funcoesDisponiveis.map(f => <option key={f} value={f}>{f}</option>)}
                           </select>
                           <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                     </div>

                     {/* Filtro por Vínculo */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                           <Users className="w-4 h-4 text-cyan-500" /> Tipo de Vínculo
                        </label>
                        <div className="relative">
                           <select
                              value={servidorVinculoFilter}
                              onChange={e => setServidorVinculoFilter(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 appearance-none shadow-sm"
                           >
                              <option value="Todos">Todos os Vínculos</option>
                              <option value="Efetivo">Efetivo</option>
                              <option value="Contratado">Contratado</option>
                              <option value="Permutado">Permutado</option>
                           </select>
                           <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                     </div>

                     {/* Filtro por Escola */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                           <Building2 className="w-4 h-4 text-cyan-500" /> Unidade Escolar
                        </label>
                        <div className="relative">
                           <select
                              value={servidorEscolaFilter}
                              onChange={e => setServidorEscolaFilter(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 appearance-none shadow-sm"
                           >
                              <option value="Todas">Todas as Unidades</option>
                              {escolas.sort((a, b) => a.nome.localeCompare(b.nome)).map(e => (
                                 <option key={e.id} value={e.id}>{e.nome}</option>
                              ))}
                           </select>
                           <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                     </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 justify-end">
                     <button
                        onClick={handleExportServidoresCSV}
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2"
                     >
                        <Download className="w-5 h-5" /> Exportar CSV
                     </button>
                     <button
                        onClick={handlePrintServidores}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
                     >
                        <Printer className="w-5 h-5" /> Imprimir Relatório
                     </button>
                  </div>
               </div>

               {/* KPI Cards */}
               <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  {[
                     { label: 'Total Geral', val: servidoresStats.total, color: 'bg-slate-900', textColor: 'text-white' },
                     { label: 'Efetivos', val: servidoresStats.efetivos, color: 'bg-emerald-500', textColor: 'text-white' },
                     { label: 'Contratados', val: servidoresStats.contratados, color: 'bg-orange-500', textColor: 'text-white' },
                     { label: 'Permutados', val: servidoresStats.permutados, color: 'bg-blue-500', textColor: 'text-white' },
                     { label: 'Unidades', val: servidoresStats.escolasComServidor, color: 'bg-white', textColor: 'text-cyan-600' },
                     { label: 'Funções', val: servidoresStats.funcoes, color: 'bg-white', textColor: 'text-cyan-600' },
                  ].map((k, i) => (
                     <div key={i} className={`${k.color} rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition-all`}>
                        <p className={`text-[10px] font-bold ${k.textColor} opacity-70 uppercase tracking-wider mb-1`}>{k.label}</p>
                        <p className={`text-2xl font-black ${k.textColor}`}>{k.val.toLocaleString()}</p>
                     </div>
                  ))}
               </div>

               {/* Table */}
               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 p-6 flex items-center justify-between border-b border-slate-100">
                     <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-cyan-600" />
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                           Controle Geral de Servidores — Recursos Humanos
                        </h3>
                     </div>
                     <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-md">
                        {servidoresFiltrados.length} registros
                     </span>
                  </div>
                  <div className="overflow-x-auto">
                     {servidoresFiltrados.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center justify-center text-slate-400">
                           <Users className="w-12 h-12 mb-4 opacity-20" />
                           <p className="font-medium">Nenhum servidor encontrado com os filtros selecionados.</p>
                        </div>
                     ) : (
                        <table className="w-full text-left">
                           <thead className="bg-slate-50 border-b border-slate-200">
                              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                 <th className="px-4 py-4 w-12">Nº</th>
                                 <th className="px-4 py-4">Nome / Contato</th>
                                 <th className="px-4 py-4">Unidade Escolar</th>
                                 <th className="px-4 py-4">Função / Cargo</th>
                                 <th className="px-4 py-4 text-center">Vínculo</th>
                                 <th className="px-4 py-4 text-center">C. Horária</th>
                                 <th className="px-4 py-4 text-center">Nomeação</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {servidoresFiltrados.map((srv, i) => (
                                 <tr key={`${srv.id}-${srv.escolaId}-${i}`} className="group hover:bg-cyan-50/30 transition-all">
                                    <td className="px-4 py-3 text-xs font-bold text-slate-400">{i + 1}</td>
                                    <td className="px-4 py-3">
                                       <div className="font-bold text-slate-800 text-sm">{srv.nome}</div>
                                       <div className="flex items-center gap-3 mt-1">
                                          {srv.email && (
                                             <span className="text-xs text-cyan-500 flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {srv.email}
                                             </span>
                                          )}
                                          {srv.telefone && (
                                             <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {srv.telefone}
                                             </span>
                                          )}
                                       </div>
                                       {srv.cpf && <div className="text-[10px] text-slate-400 mt-0.5">CPF: {srv.cpf}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                       <div className="text-sm font-medium text-slate-700">{srv.escolaNome}</div>
                                       <div className="text-[10px] text-slate-400 font-bold uppercase">{srv.escolaLocalizacao}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                       <div className="text-sm font-medium text-slate-700">{srv.funcao}</div>
                                       {srv.etapaAtuacao && (
                                          <div className="text-xs text-slate-400 mt-0.5">
                                             {srv.etapaAtuacao}
                                             {srv.componenteCurricular ? ` • ${srv.componenteCurricular}` : ''}
                                          </div>
                                       )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                       <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                                          srv.tipoVinculo === 'Efetivo' ? 'bg-emerald-100 text-emerald-700' :
                                          srv.tipoVinculo === 'Permutado' ? 'bg-blue-100 text-blue-700' :
                                          'bg-orange-100 text-orange-700'
                                       }`}>
                                          {srv.tipoVinculo}
                                       </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600 font-medium">
                                       {srv.cargaHoraria || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                                       {srv.dataNomeacao ? new Date(srv.dataNomeacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* ====== PRINT PORTALS ====== */}
         {isPrintingGerencial && (
            <PrintableGerencialReport
               tipo={selectedTipo}
               vinculo={selectedVinculo}
               subtipoGestor={selectedTipo === 'gestores' ? selectedSubtipoGestor : undefined}
               escolas={escolas}
            />
         )}

         {isPrintingMatricula && (
            <PrintableMatriculaReport 
               escolas={escolas}
               filtroLocalizacao={selectedLocalizacao}
            />
         )}

         {isPrintingMatriculaDetalhada && (
            <PrintableMatriculaDetalhadaReport 
               escolas={escolas}
               filtroLocalizacao={selectedLocalizacao}
               filtroTurno={selectedTurno}
            />
         )}

         {isPrintingServidores && (
            <PrintableServidoresReport
               servidores={servidoresFiltrados}
               filtroFuncao={servidorFuncaoFilter}
               filtroVinculo={servidorVinculoFilter}
               filtroEscola={servidorEscolaFilter !== 'Todas' ? escolas.find(e => e.id === servidorEscolaFilter)?.nome || 'Todas' : 'Todas'}
            />
         )}
      </div>
   );
};
