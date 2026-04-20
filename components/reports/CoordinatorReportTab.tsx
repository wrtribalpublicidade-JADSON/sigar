import React, { useState, useEffect, useMemo } from 'react';
import { Download, Search, Printer, CheckSquare, AlertCircle, FileText, Calendar, Users, Briefcase, ChevronDown, Activity, MapPin, Building2, BarChart3, ChevronRight, ChevronUp } from 'lucide-react';
import { Escola, Visita, Coordenador, MetaAcao } from '../../types';
import { supabase } from '../../services/supabase';
import { exportToCSV } from '../../utils';
import { useNotification } from '../../context/NotificationContext';
import { getEdicoesStatus, IndicadorEdicaoKey } from '../../utils/edicoesHelper';

interface CoordinatorReportTabProps {
  escolas: Escola[];
  visitas: Visita[];
  coordenadores: Coordenador[];
  onPrint?: (data: any[], filtroCoord: string, filtroRegional: string) => void;
}

export const CoordinatorReportTab: React.FC<CoordinatorReportTabProps> = ({ escolas, visitas, coordenadores, onPrint }) => {
  const { showNotification } = useNotification();
  const [turmasCount, setTurmasCount] = useState<Record<string, number>>({});
  const [alunosCount, setAlunosCount] = useState<Record<string, number>>({});
  const [atividadesCount, setAtividadesCount] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [selectedCoordId, setSelectedCoordId] = useState<string>('Todos');
  const [selectedRegional, setSelectedRegional] = useState<string>('Todas');
  const [selectedEscolaId, setSelectedEscolaId] = useState<string>('Todas');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetchRemoteData();
  }, [escolas]);

  const fetchRemoteData = async () => {
    setIsLoading(true);
    try {
      const activeSchoolIds = escolas.map(e => e.id);
      if (activeSchoolIds.length === 0) return;

      // Helper para buscar todos os registros lidando com o limite de 1000 do Supabase
      const fetchAll = async (table: string, select: string, filterField: string) => {
        let allRecords: any[] = [];
        let from = 0;
        let to = 999;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from(table)
            .select(select)
            .in(filterField, activeSchoolIds)
            .range(from, to);

          if (error) throw error;
          if (data && data.length > 0) {
            allRecords = [...allRecords, ...data];
            if (data.length < 1000) {
              hasMore = false;
            } else {
              from += 1000;
              to += 1000;
            }
          } else {
            hasMore = false;
          }
        }
        return allRecords;
      };

      const [atividades] = await Promise.all([
        fetchAll('atividades_complementares', 'escola_id', 'escola_id')
      ]);

      const actCount: Record<string, number> = {};
      atividades?.forEach(a => { actCount[a.escola_id] = (actCount[a.escola_id] || 0) + 1; });
      setAtividadesCount(actCount);

    } catch (error) {
      console.error('Error fetching supplementary data:', error);
      showNotification('error', 'Erro ao carregar dados complementares do relatório.');
    } finally {
      setIsLoading(false);
    }
  };

  const coordenadoresRegionais = useMemo(() => {
    return coordenadores.filter(c => c.funcao === 'Coordenador Regional');
  }, [coordenadores]);

  const regionais = useMemo(() => {
    const rSet = new Set(coordenadoresRegionais.map(c => c.regiao).filter(Boolean));
    return Array.from(rSet).sort();
  }, [coordenadoresRegionais]);

  const coordenadoresFiltrados = useMemo(() => {
    let filtrados = coordenadoresRegionais;
    if (selectedCoordId !== 'Todos') {
      filtrados = filtrados.filter(c => c.id === selectedCoordId);
    }
    if (selectedRegional !== 'Todas') {
      filtrados = filtrados.filter(c => c.regiao === selectedRegional);
    }
    return filtrados;
  }, [coordenadoresRegionais, selectedCoordId, selectedRegional]);

  const analyzeSmart = (acao: MetaAcao) => {
    let score = 0;
    const faltam = [];
    if (acao.descricao && acao.descricao.trim() !== '') score++; else faltam.push('O que será feito');
    if (acao.prazo && acao.prazo.trim() !== '') score++; else faltam.push('Quando será feito');
    if (acao.responsavel && acao.responsavel.trim() !== '') score++; else faltam.push('Quem/Quanto');

    let status: 'Adequada' | 'Parcialmente Adequada' | 'Inadequada' = 'Inadequada';
    if (score === 3) status = 'Adequada';
    else if (score === 2) status = 'Parcialmente Adequada';
    
    return { status, faltam };
  };

   const aggregateMatriculaTotals = (detalhada: any) => {
     let totalTurmas = 0;
     let totalAlunos = 0;

     if (!detalhada) return { totalTurmas, totalAlunos };

     const processGroup = (group: any) => {
       if (!group) return;
       Object.values(group).forEach((nivel: any) => {
         if (nivel.turmas) {
           totalTurmas += (nivel.turmas.integral || 0) + (nivel.turmas.manha || 0) + (nivel.turmas.tarde || 0);
         }
         if (nivel.alunos) {
           totalAlunos += (nivel.alunos.integral || 0) + (nivel.alunos.manha || 0) + (nivel.alunos.tarde || 0);
         }
       });
     };

     processGroup(detalhada.infantil);
     processGroup(detalhada.fundamental);

     return { totalTurmas, totalAlunos };
   };

  const mappedData = useMemo(() => {
    const data = [];
    for (const coord of coordenadoresFiltrados) {
      if (!coord.escolasIds || coord.escolasIds.length === 0) continue;

      for (const escId of coord.escolasIds) {
        if (selectedEscolaId !== 'Todas' && escId !== selectedEscolaId) continue;
        
        const esc = escolas.find(e => e.id === escId);
        if (!esc) continue;

        // Cálculos por escola
        const temChecklist = esc.acompanhamentoMensal && esc.acompanhamentoMensal.length > 0;
        
        // Puxar totais do detalhamento (Alunos por Turma) conforme solicitado
        const { totalTurmas: detalhadasTurmas, totalAlunos: detalhadasAlunos } = aggregateMatriculaTotals(esc.dadosEducacionais?.matriculaDetalhada);
        const totalTurmas = detalhadasTurmas;
        const totalAlunos = detalhadasAlunos;

        const totalRH = esc.recursosHumanos ? esc.recursosHumanos.length : 0;
        const acoes = esc.planoAcao || [];
        const avaliacoesSmart = acoes.map(analyzeSmart);
        const temAcaoAdequada = avaliacoesSmart.some(a => a.status === 'Adequada');
        const totalVisitas = visitas.filter(v => v.escolaId === esc.id).length;
        const totalAtividades = atividadesCount[esc.id] || 0;

        // Regra de visite mensal (Nova Regra Mínimo 1 por mês para escolas Ativas)
        let pendenteVisitaMensal = false;
        if (esc.status === 'Ativo') {
            const agora = new Date();
            const mesAtual = agora.getMonth();
            const anoAtual = agora.getFullYear();
            const temVisitaEsteMes = visitas.some(v => {
                if (v.escolaId !== esc.id) return false;
                const dv = new Date(v.data);
                return dv.getMonth() === mesAtual && dv.getFullYear() === anoAtual;
            });
            if (!temVisitaEsteMes) {
                pendenteVisitaMensal = true;
            }
        }

        // Indicadores (baseado no controle de edições)
        let temIndicadores = false;
        let textStatusIndicadores = 'Sem metas';
        let indicadoresEsperadosTotal = 0;
        let pendenciasIndicadores = 0;

        if (esc.dadosEducacionais) {
           const chaves: IndicadorEdicaoKey[] = ['PARC', 'CNCA', 'SEAMA', 'SAEB', 'IDEB', 'SAMAHC_FLUENCIA', 'SAMAHC_SEAMA', 'SAMAHC_SAEB', 'SAMAHC_PORTUGUES', 'SAMAHC_MATEMATICA', 'EI'];
           
           for (const chave of chaves) {
               const status = getEdicoesStatus(esc, chave);
               if (status.esperadas > 0) {
                   indicadoresEsperadosTotal++;
                   if (status.pendentes > 0) {
                       pendenciasIndicadores++;
                   }
               }
           }
           
           if (indicadoresEsperadosTotal > 0) {
               if (pendenciasIndicadores === 0) {
                   temIndicadores = true;
                   textStatusIndicadores = 'Completo';
               } else {
                   temIndicadores = false;
                   textStatusIndicadores = `${pendenciasIndicadores} Pendentes`;
               }
           } else {
               // Fallback
               if (esc.dadosEducacionais.registrosFluenciaParc && esc.dadosEducacionais.registrosFluenciaParc.length > 0) {
                   temIndicadores = true;
               }
           }
        }

        // Checklist de eixos (7)
        let pontos = 0;
        if (temChecklist) pontos++;
        if (totalTurmas > 0) pontos++;
        if (totalRH > 0) pontos++;
        if (acoes.length > 0) pontos++;
        if (totalAlunos > 0) pontos++;
        if (temIndicadores) pontos++;
        if (totalVisitas > 0) pontos++;

        const cumprimentoPerm = (pontos / 7) * 100;

        data.push({
          coordenador: coord,
          escola: esc,
          temChecklist,
          totalTurmas,
          totalRH,
          planoAcao: acoes,
          avaliacoesSmart,
          temAcaoAdequada,
          totalAlunos,
          temIndicadores,
          totalVisitas,
          totalAtividades,
          cumprimentoPerm,
          pontos,
          textStatusIndicadores,
          pendenteVisitaMensal
        });
      }
    }
    return data;
  }, [coordenadoresFiltrados, escolas, turmasCount, alunosCount, atividadesCount, visitas, selectedEscolaId]);

  const stats = useMemo(() => {
    return {
      totalCoords: coordenadoresFiltrados.length,
      totalEscolas: mappedData.length,
      escolasChecklist: mappedData.filter(d => d.temChecklist).length,
      escolasTurmas: mappedData.filter(d => d.totalTurmas > 0).length,
      escolasRH: mappedData.filter(d => d.totalRH > 0).length,
      escolasPlano: mappedData.filter(d => d.planoAcao.length > 0).length,
      escolasAlunos: mappedData.filter(d => d.totalAlunos > 0).length,
      escolasIndicadores: mappedData.filter(d => d.temIndicadores).length,
      escolasVisitas: mappedData.filter(d => d.totalVisitas > 0).length,
    };
  }, [mappedData, coordenadoresFiltrados.length]);

  const handlePrint = () => {
    if (onPrint) {
      const coordName = selectedCoordId === 'Todos' ? 'Todos os Coordenadores' : coordenadores.find(c => c.id === selectedCoordId)?.nome || selectedCoordId;
      onPrint(mappedData, coordName, selectedRegional);
    } else {
      window.print();
    }
  };

  const handleExportCSV = () => {
    const csvData = mappedData.map(d => ({
      'COORDENADOR': d.coordenador.nome,
      'REGIONAL': d.coordenador.regiao || '',
      'ESCOLA': d.escola.nome,
      'ATV. COMPLEMENTARES': d.totalAtividades > 0 ? 'SIM' : 'NÃO',
      'CHECKLIST': d.temChecklist ? 'PREENCHIDO' : 'PENDENTE',
      'TURMAS': d.totalTurmas,
      'RH (SERVIDORES)': d.totalRH,
      'PLANO AÇÃO': d.planoAcao.length > 0 ? 'SIM' : 'NÃO',
      'SMART ADEQUADA': d.temAcaoAdequada ? 'SIM' : 'NÃO',
      'ESTUDANTES': d.totalAlunos,
      'INDICADORES': d.textStatusIndicadores || (d.temIndicadores ? 'PREENCHIDO' : 'PENDENTE'),
      'VISITAS': d.totalVisitas,
      '% CUMPRIMENTO': `${d.cumprimentoPerm.toFixed(1)}%`
    }));
    exportToCSV(csvData, 'relatorio_coordenadores_regionais');
    showNotification('success', 'Exportado com sucesso');
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-4">
             <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
             <p className="text-orange-600 font-bold animate-pulse">Carregando dados complementares...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" /> Coordenador
          </label>
          <select
            value={selectedCoordId}
            onChange={e => setSelectedCoordId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 outline-none focus:border-orange-500"
          >
            <option value="Todos">Todos os Coordenadores</option>
            {coordenadoresRegionais.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" /> Regional
          </label>
          <select
            value={selectedRegional}
            onChange={e => setSelectedRegional(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 outline-none focus:border-orange-500"
          >
            <option value="Todas">Todas as Regionais</option>
            {regionais.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-500" /> Escola
          </label>
          <select
            value={selectedEscolaId}
            onChange={e => setSelectedEscolaId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 outline-none focus:border-orange-500"
          >
            <option value="Todas">Todas as Escolas</option>
            {escolas.filter(e => {
                if(selectedCoordId === 'Todos') return true;
                const c = coordenadoresRegionais.find(co => co.id === selectedCoordId);
                return c?.escolasIds.includes(e.id);
            }).map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>

        <div className="flex items-end gap-2 text-sm">
           <button onClick={handleExportCSV} className="flex-1 bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 text-slate-600 py-2 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all"><Download className="w-4 h-4"/> CSV</button>
           <button onClick={handlePrint} className="flex-1 bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 text-slate-600 py-2 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all"><Printer className="w-4 h-4"/> Imprimir</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Coord. Regionais', val: stats.totalCoords, color: 'text-indigo-600', icon: Users },
          { label: 'Escolas Acompanhadas', val: stats.totalEscolas, color: 'text-slate-800', icon: Building2 },
          { label: 'Checklist OK', val: stats.escolasChecklist, color: 'text-emerald-500', icon: CheckSquare },
          { label: 'Plano Ação OK', val: stats.escolasPlano, color: 'text-blue-500', icon: Activity },
          { label: 'Turmas Cadastradas', val: stats.escolasTurmas, color: 'text-violet-500', icon: Users },
          { label: 'Estudantes OK', val: stats.escolasAlunos, color: 'text-indigo-400', icon: Users },
          { label: 'RH Prenchido', val: stats.escolasRH, color: 'text-fuchsia-500', icon: Briefcase },
          { label: 'Indicadores OK', val: stats.escolasIndicadores, color: 'text-orange-500', icon: BarChart3 },
          { label: 'Com Visitas', val: stats.escolasVisitas, color: 'text-emerald-600', icon: Calendar },
        ].map((k, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
               <k.icon className={`w-5 h-5 ${k.color}`} />
             </div>
             <div>
               <div className="text-[10px] uppercase font-bold text-slate-400">{k.label}</div>
               <div className="text-xl font-black text-slate-800">{k.val}</div>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="bg-slate-50 p-6 flex items-center justify-between border-b border-slate-100">
           <h3 className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
             <FileText className="w-5 h-5 text-orange-500" />
             Acompanhamento Consolidado por Escola
           </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                 <th className="px-4 py-3">Escola / Coordenador</th>
                 <th className="px-3 py-3 text-center">Atividades</th>
                 <th className="px-3 py-3 text-center">Checklist</th>
                 <th className="px-3 py-3 text-center">Turmas</th>
                 <th className="px-3 py-3 text-center">RH</th>
                 <th className="px-3 py-3 text-center">Plano Ação/SMART</th>
                 <th className="px-3 py-3 text-center">Alunos</th>
                 <th className="px-3 py-3 text-center">Indicadores</th>
                 <th className="px-3 py-3 text-center">Visitas</th>
                 <th className="px-3 py-3 text-center">% Cumprimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mappedData.map((d, i) => (
                <React.Fragment key={`${d.coordenador.id}-${d.escola.id}`}>
                <tr className={`hover:bg-slate-50 transition-colors cursor-pointer group ${expandedRow === `${d.coordenador.id}-${d.escola.id}` ? 'bg-orange-50/30' : ''}`} onClick={() => setExpandedRow(expandedRow === `${d.coordenador.id}-${d.escola.id}` ? null : `${d.coordenador.id}-${d.escola.id}`)}>
                  <td className="px-4 py-3">
                     <div className="font-bold text-slate-800 text-sm">{d.escola.nome}</div>
                     <div className="text-xs text-slate-500">{d.coordenador.nome} <span className="opacity-50">({d.coordenador.regiao})</span></div>
                  </td>
                  <td className="px-3 py-3 text-center">
                     <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${d.totalAtividades > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{d.totalAtividades}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                     {d.temChecklist ? <CheckSquare className="w-4 h-4 text-emerald-500 mx-auto" /> : <AlertCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-bold {d.totalTurmas > 0 ? 'text-slate-800' : 'text-slate-400'}">{d.totalTurmas || '-'}</td>
                  <td className="px-3 py-3 text-center text-sm font-bold {d.totalRH > 0 ? 'text-slate-800' : 'text-slate-400'}">{d.totalRH || '-'}</td>
                  <td className="px-3 py-3 text-center">
                     {d.planoAcao.length > 0 ? (
                       <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${d.temAcaoAdequada ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                         {d.planoAcao.length} ({d.temAcaoAdequada ? 'SMART' : 'Incompleto'})
                       </span>
                     ) : (
                       <span className="text-slate-300">-</span>
                     )}
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-bold {d.totalAlunos > 0 ? 'text-slate-800' : 'text-slate-400'}">{d.totalAlunos || '-'}</td>
                  <td className="px-3 py-3 text-center">
                     <div className="flex flex-col items-center gap-0.5">
                       {d.temIndicadores ? <CheckSquare className="w-4 h-4 text-emerald-500 mx-auto" /> : (d.textStatusIndicadores === 'Sem metas' ? <AlertCircle className="w-4 h-4 text-slate-300 mx-auto" /> : <AlertCircle className="w-4 h-4 text-amber-500 mx-auto" />)}
                       <span className={`text-[9px] font-bold ${d.textStatusIndicadores === 'Completo' ? 'text-emerald-600' : d.textStatusIndicadores === 'Sem metas' ? 'text-slate-400' : 'text-amber-600'}`}>
                         {d.textStatusIndicadores}
                       </span>
                     </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                     <div className="flex flex-col items-center gap-0.5 relative group/visita">
                       <span className={`text-sm font-bold ${d.totalVisitas > 0 ? 'text-slate-800' : 'text-slate-400'}`}>{d.totalVisitas || '-'}</span>
                       {d.pendenteVisitaMensal && (
                           <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest flex items-center gap-1 mt-1 bg-rose-100 px-1.5 py-0.5 rounded shadow-sm">
                             <AlertCircle className="w-3 h-3"/> Pendente Mês
                           </span>
                       )}
                     </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-sm font-black ${d.cumprimentoPerm >= 80 ? 'text-emerald-600' : d.cumprimentoPerm >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                        {d.cumprimentoPerm.toFixed(0)}%
                      </span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${d.cumprimentoPerm >= 80 ? 'bg-emerald-500' : d.cumprimentoPerm >= 50 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${d.cumprimentoPerm}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Details */}
                {expandedRow === `${d.coordenador.id}-${d.escola.id}` && (
                  <tr className="bg-orange-50/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.02)] print:hidden">
                    <td colSpan={10} className="p-4 border-b border-orange-100">
                      <div className="grid grid-cols-2 gap-6 pl-4 border-l-2 border-orange-200">
                        {/* Ações e SMART */}
                        <div>
                          <h4 className="text-xs font-bold text-orange-800 mb-3 uppercase flex items-center gap-2"><Activity className="w-4 h-4"/> Análise SMART - Plano de Ação</h4>
                          {d.planoAcao.length === 0 ? <p className="text-sm text-slate-500 italic">Nenhuma ação cadastrada.</p> : (
                            <div className="space-y-3">
                              {d.planoAcao.map((acao, idx) => {
                                const sa = d.avaliacoesSmart[idx];
                                return (
                                  <div key={idx} className="bg-white p-3 rounded border border-orange-100">
                                    <p className="text-sm font-medium text-slate-700 mb-1">{acao.descricao || 'Sem descrição'}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className={`px-1.5 py-0.5 rounded font-bold ${sa.status === 'Adequada' ? 'bg-emerald-100 text-emerald-700' : sa.status === 'Parcialmente Adequada' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                        {sa.status}
                                      </span>
                                      {sa.faltam.length > 0 && <span className="text-red-500">Falta: {sa.faltam.join(', ')}</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {/* Outros Detalhes Rápidos */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-orange-800 uppercase flex items-center gap-2"><Search className="w-4 h-4"/> Detalhamento Rápido</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded border border-slate-200">
                              <span className="block text-xs font-bold text-slate-400">Turmas/Alunos</span>
                              <span className="block text-sm font-bold text-slate-800">{d.totalTurmas} / {d.totalAlunos}</span>
                            </div>
                            <div className="bg-white p-3 rounded border border-slate-200">
                              <span className="block text-xs font-bold text-slate-400">Situação Checklist</span>
                              <span className={`block text-sm font-bold ${d.temChecklist ? 'text-emerald-600' : 'text-red-500'}`}>{d.temChecklist ? 'Respondido' : 'Pendente'}</span>
                            </div>
                            <div className="bg-white p-3 rounded border border-slate-200">
                              <span className="block text-xs font-bold text-slate-400">Recursos Humanos</span>
                              <span className="block text-sm font-bold text-slate-800">{d.totalRH} Servidores</span>
                            </div>
                            <div className="bg-white p-3 rounded border border-slate-200">
                              <span className="block text-xs font-bold text-slate-400">Visitas do Coord.</span>
                              <span className="block text-sm font-bold text-slate-800">{d.totalVisitas} Registradas</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
              {mappedData.length === 0 && !isLoading && (
                <tr>
                   <td colSpan={10} className="p-12 text-center text-slate-400">
                     <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                     <p>Nenhuma escola encontrada para os filtros selecionados.</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
