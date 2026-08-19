import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, Clock, Search, Filter, 
  RefreshCw, Send, CheckSquare, Square, History, ExternalLink, 
  ChevronRight, ChevronLeft, Calendar, Users, School, BookOpen, Layers, 
  ArrowUpRight, AlertCircle, Sparkles, SlidersHorizontal, CheckCircle
} from 'lucide-react';
import { 
  AlertaPendencia, 
  Escola, 
  Coordenador, 
  TipoPendenciaAlerta, 
  StatusPendenciaAlerta, 
  PrioridadePendenciaAlerta,
  ViewState
} from '../types';
import { pendenciasEngineService, getDaysDifference } from '../services/pendenciasEngineService';
import { GerarAlertaModal } from './modals/GerarAlertaModal';
import { HistoricoPendenciaModal } from './modals/HistoricoPendenciaModal';
import { useNotification } from '../context/NotificationContext';

interface AlertasPendenciasTabProps {
  escolas: Escola[];
  coordenadores: Coordenador[];
  isDemoMode?: boolean;
  isAdmin?: boolean;
  currentUserName?: string;
  onNavigateToModule?: (view: ViewState, params?: any) => void;
}

export const AlertasPendenciasTab: React.FC<AlertasPendenciasTabProps> = ({
  escolas,
  coordenadores,
  isDemoMode = false,
  isAdmin = false,
  currentUserName = 'Administrador',
  onNavigateToModule
}) => {
  const { showNotification } = useNotification();
  const [pendencias, setPendencias] = useState<AlertaPendencia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<TipoPendenciaAlerta | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<StatusPendenciaAlerta | 'ALL'>('ALL');
  const [filterEscola, setFilterEscola] = useState('ALL');
  const [filterResponsavel, setFilterResponsavel] = useState('ALL');
  const [filterPerfil, setFilterPerfil] = useState('ALL');
  const [filterPeriodo, setFilterPeriodo] = useState('ALL');
  const [filterPrioridade, setFilterPrioridade] = useState<PrioridadePendenciaAlerta | 'ALL'>('ALL');

  // Selection for Mass Action
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [modalAlertaItems, setModalAlertaItems] = useState<AlertaPendencia[]>([]);
  const [isAlertaModalOpen, setIsAlertaModalOpen] = useState(false);
  const [historicoItem, setHistoricoItem] = useState<AlertaPendencia | null>(null);
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);

  // Escolas ordenadas em ordem alfabética
  const sortedEscolas = useMemo(() => {
    return [...escolas].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
  }, [escolas]);

  // Servidores vinculados à unidade selecionada (ou todos), ordenados alfabeticamente
  const filteredAndSortedResponsaveis = useMemo(() => {
    let list = coordenadores;
    if (filterEscola !== 'ALL') {
      list = list.filter(c => c.escolasIds && c.escolasIds.includes(filterEscola));
    }
    return [...list].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
  }, [coordenadores, filterEscola]);

  // Handler de alteração da unidade escolar (reseta o responsável caso não pertença à nova escola)
  const handleEscolaChange = (newEscolaId: string) => {
    setFilterEscola(newEscolaId);
    setCurrentPage(1);
    if (newEscolaId !== 'ALL' && filterResponsavel !== 'ALL') {
      const isStillValid = coordenadores.some(
        c => c.id === filterResponsavel && c.escolasIds && c.escolasIds.includes(newEscolaId)
      );
      if (!isStillValid) {
        setFilterResponsavel('ALL');
      }
    }
  };

  // Consultar / Carregar Registros por demanda (otimizado com filtros)
  const handleConsultar = async () => {
    setIsLoading(true);
    setCurrentPage(1);
    setSelectedIds([]);

    try {
      const options = {
        escolaId: filterEscola,
        tipoPendencia: filterTipo,
        periodo: filterPeriodo,
        usuarioId: filterResponsavel,
        perfil: filterPerfil,
        status: filterStatus
      };
      const data = await pendenciasEngineService.scanAndSyncPendencies(escolas, coordenadores, isDemoMode, options);
      setPendencias(data);
      setHasSearched(true);
      showNotification('success', `${data.length} pendências encontradas e carregadas com sucesso!`);
    } catch (e) {
      console.error(e);
      showNotification('error', 'Falha ao consultar pendências.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper para verificar se o servidor é Coordenador Pedagógico ou Gestor
  const isGestorOuCoordenador = (c?: Coordenador) => {
    if (!c) return false;
    const f = (c.funcao || '').toLowerCase();
    return f.includes('coordenador') || f.includes('gestor') || f.includes('diretor');
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return pendencias.filter(item => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        item.titulo.toLowerCase().includes(searchLower) ||
        item.descricao.toLowerCase().includes(searchLower) ||
        (item.usuario_nome && item.usuario_nome.toLowerCase().includes(searchLower)) ||
        (item.escola_nome && item.escola_nome.toLowerCase().includes(searchLower)) ||
        (item.turma_nome && item.turma_nome.toLowerCase().includes(searchLower)) ||
        (item.componente && item.componente.toLowerCase().includes(searchLower));

      // Tipo
      const matchesTipo = filterTipo === 'ALL' || item.tipo_pendencia === filterTipo;

      // Status
      const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;

      // Escola
      const matchesEscola = filterEscola === 'ALL' || item.escola_id === filterEscola;

      // Responsavel (Coordenador Pedagógico, Gestor Geral ou Gestor Pedagógico herdam todas as pendências da sua escola)
      let matchesResponsavel = true;
      if (filterResponsavel !== 'ALL') {
        const selectedCoord = coordenadores.find(c => c.id === filterResponsavel);
        if (selectedCoord && isGestorOuCoordenador(selectedCoord) && selectedCoord.escolasIds && selectedCoord.escolasIds.length > 0) {
          matchesResponsavel = item.usuario_id === filterResponsavel || 
            (!!item.escola_id && selectedCoord.escolasIds.includes(item.escola_id));
        } else {
          matchesResponsavel = item.usuario_id === filterResponsavel;
        }
      }

      // Perfil
      const matchesPerfil = filterPerfil === 'ALL' || item.usuario_perfil === filterPerfil;

      // Periodo
      const matchesPeriodo = filterPeriodo === 'ALL' || item.periodo === filterPeriodo;

      // Prioridade
      const matchesPrioridade = filterPrioridade === 'ALL' || item.prioridade === filterPrioridade;

      return matchesSearch && matchesTipo && matchesStatus && matchesEscola && 
             matchesResponsavel && matchesPerfil && matchesPeriodo && matchesPrioridade;
    });
  }, [pendencias, searchTerm, filterTipo, filterStatus, filterEscola, filterResponsavel, filterPerfil, filterPeriodo, filterPrioridade, coordenadores]);

  // Pagination Calculations
  const totalItems = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedList = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, safePage, itemsPerPage]);

  // Statistics Summary
  const stats = useMemo(() => {
    const list = filteredList;
    const total = list.length;
    const emAlerta = list.filter(p => p.status === 'EM_ALERTA').length;
    const vencidas = list.filter(p => p.status === 'VENCIDA').length;
    const escalonadas = list.filter(p => p.status === 'ESCALONADA').length;
    const resolvidas = list.filter(p => p.status === 'RESOLVIDA').length;
    const pendentes = list.filter(p => p.status === 'PENDENTE').length;

    const totalAtivas = total - resolvidas;
    const taxaRegularizacao = total > 0 ? Math.round((resolvidas / total) * 100) : 100;

    return { total, emAlerta, vencidas, escalonadas, resolvidas, pendentes, totalAtivas, taxaRegularizacao };
  }, [filteredList]);

  // Selection Helpers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedList.map(item => item.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Open Alert Modal
  const handleOpenAlertaIndividual = (item: AlertaPendencia) => {
    setModalAlertaItems([item]);
    setIsAlertaModalOpen(true);
  };

  const handleOpenAlertaMassa = () => {
    const items = pendencias.filter(p => selectedIds.includes(p.id));
    if (items.length === 0) {
      showNotification('warning', 'Selecione ao menos uma pendência para gerar alertas em massa.');
      return;
    }
    setModalAlertaItems(items);
    setIsAlertaModalOpen(true);
  };

  const handleGenerateAlerts = async (
    ids: string[], 
    prazo: string, 
    observacao: string, 
    prioridade: PrioridadePendenciaAlerta
  ) => {
    if (ids.length === 1) {
      const ok = await pendenciasEngineService.gerarAlertaIndividual(ids[0], prazo, observacao, prioridade, currentUserName);
      if (ok) {
        showNotification('success', 'Alerta emitido com sucesso!');
        await handleConsultar();
        setSelectedIds([]);
        return true;
      }
      return false;
    } else {
      const res = await pendenciasEngineService.gerarAlertasEmMassa(ids, prazo, observacao, prioridade, currentUserName);
      if (res.success > 0) {
        showNotification('success', `${res.success} alerta(s) emitido(s) com sucesso!`);
        await handleConsultar();
        setSelectedIds([]);
        return true;
      }
      return false;
    }
  };

  const handleNavigate = (item: AlertaPendencia) => {
    if (onNavigateToModule && item.view_destino) {
      onNavigateToModule(item.view_destino, {
        escolaId: item.escola_id,
        turmaId: item.turma_id,
        componente: item.componente,
        periodo: item.periodo
      });
    } else {
      showNotification('warning', `Direcionando para o módulo: ${item.modulo}`);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: StatusPendenciaAlerta, prazo?: string) => {
    const { days, isOverdue } = getDaysDifference(prazo);

    switch (status) {
      case 'PENDENTE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 w-fit">
            <Clock className="w-3 h-3 text-slate-500" />
            Pendente
          </span>
        );
      case 'EM_ALERTA':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5 w-fit animate-pulse">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Em Alerta {prazo ? `(${days}d)` : ''}
          </span>
        );
      case 'VENCIDA':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1.5 w-fit">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Vencida (+{days}d)
          </span>
        );
      case 'ESCALONADA':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-50 text-purple-900 border border-purple-300 flex items-center gap-1.5 w-fit">
            <ShieldAlert className="w-3 h-3 text-purple-600" />
            Escalonada
          </span>
        );
      case 'RESOLVIDA':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Resolvida
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. CARDS DE RESUMO ESTATÍSTICO (QUANDO CONSULTADO) */}
      {hasSearched && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-fade-in">
          
          {/* Total */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-900">{stats.total}</span>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{stats.totalAtivas} ativas</p>
            </div>
          </div>

          {/* Em Alerta */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm bg-gradient-to-br from-amber-50/40 to-white flex flex-col justify-between hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Em Alerta</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-amber-800">{stats.emAlerta}</span>
              <p className="text-[10px] text-amber-600/80 font-semibold mt-0.5">Com prazo ativo</p>
            </div>
          </div>

          {/* Vencidas */}
          <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm bg-gradient-to-br from-rose-50/40 to-white flex flex-col justify-between hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Vencidas</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-rose-800">{stats.vencidas}</span>
              <p className="text-[10px] text-rose-600/80 font-semibold mt-0.5">Prazo expirado</p>
            </div>
          </div>

          {/* Escalonadas */}
          <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-sm bg-gradient-to-br from-purple-50/40 to-white flex flex-col justify-between hover:border-purple-300 transition-all">
            <div className="flex items-center justify-between text-purple-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Escalonadas</span>
              <ShieldAlert className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-purple-900">{stats.escalonadas}</span>
              <p className="text-[10px] text-purple-600/80 font-semibold mt-0.5">Gestão informada</p>
            </div>
          </div>

          {/* Resolvidas */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Resolvidas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-emerald-800">{stats.resolvidas}</span>
              <p className="text-[10px] text-emerald-600/80 font-semibold mt-0.5">Regularizadas</p>
            </div>
          </div>

          {/* Regularização */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Taxa Regularização</span>
              <Sparkles className="w-4 h-4 text-orange-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-900">{stats.taxaRegularizacao}%</span>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.taxaRegularizacao}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BARRA DE FILTROS E BOTÃO CONSULTAR REGISTROS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Top Action Bar */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por professor, escola, turma, componente..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder-slate-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Mass Alert Button */}
            {selectedIds.length > 0 && (
              <button
                onClick={handleOpenAlertaMassa}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all animate-scale-in uppercase tracking-wider"
              >
                <Send className="w-3.5 h-3.5" />
                Gerar Alertas em Massa ({selectedIds.length})
              </button>
            )}

            {/* BOTÃO CONSULTAR REGISTROS */}
            <button
              onClick={handleConsultar}
              disabled={isLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all uppercase tracking-wider disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Search className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Consultando...' : 'Consultar Registros'}
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100">
          
          {/* Tipo de Pendência */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Demanda</label>
            <select
              value={filterTipo}
              onChange={e => {
                setFilterTipo(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="GUIA_APRENDIZAGEM">Guia de Aprendizagem</option>
              <option value="AULAS_MINISTRADAS">Aulas Ministradas</option>
              <option value="FREQUENCIA">Frequência Escolar</option>
              <option value="NOTAS">Notas</option>
              <option value="APROVACAO_GUIAS">Aprovação de Guias</option>
              <option value="CONSELHO_CLASSE_FUNDAMENTAL">Conselho Fundamental</option>
              <option value="CONSELHO_CLASSE_INFANTIL">Conselho Infantil</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={e => {
                setFilterStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="ALL">Todos os Status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM_ALERTA">Em Alerta</option>
              <option value="VENCIDA">Vencida</option>
              <option value="ESCALONADA">Escalonada</option>
              <option value="RESOLVIDA">Resolvida</option>
            </select>
          </div>

          {/* Escola */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unidade Escolar</label>
            <select
              value={filterEscola}
              onChange={e => handleEscolaChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 truncate"
            >
              <option value="ALL">Todas as Escolas</option>
              {sortedEscolas.map(esc => (
                <option key={esc.id} value={esc.id}>{esc.nome}</option>
              ))}
            </select>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Responsável {filterEscola !== 'ALL' && `(${filteredAndSortedResponsaveis.length})`}
            </label>
            <select
              value={filterResponsavel}
              onChange={e => {
                setFilterResponsavel(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 truncate"
            >
              <option value="ALL">
                {filterEscola === 'ALL' ? 'Todos os Usuários' : 'Todos da Unidade'}
              </option>
              {filteredAndSortedResponsaveis.map(c => (
                <option key={c.id} value={c.id}>{c.nome} ({c.funcao})</option>
              ))}
            </select>
          </div>

          {/* Perfil */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Perfil do Usuário</label>
            <select
              value={filterPerfil}
              onChange={e => {
                setFilterPerfil(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="ALL">Todos os Perfis</option>
              <option value="Professor">Professor</option>
              <option value="Coordenador Pedagógico">Coordenador Pedagógico</option>
              <option value="Monitor">Monitor</option>
              <option value="Gestor Geral">Gestor Geral</option>
            </select>
          </div>

          {/* Período / Bimestre */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bimestre / Período</label>
            <select
              value={filterPeriodo}
              onChange={e => {
                setFilterPeriodo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="ALL">Todos os Períodos</option>
              <option value="1º Bimestre">1º Bimestre</option>
              <option value="2º Bimestre">2º Bimestre</option>
              <option value="3º Bimestre">3º Bimestre</option>
              <option value="4º Bimestre">4º Bimestre</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. CONTEÚDO PRINCIPAL: ESTADO INICIAL OU LISTA PAGINADA */}
      {!hasSearched && !isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-inner">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Consulta de Alertas e Pendências</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Defina os filtros desejados acima (ou mantenha em <em>Todos</em>) e clique no botão <strong>Consultar Registros</strong> para pesquisar e monitorar as demandas ativas da rede municipal.
            </p>
          </div>
          <button
            onClick={handleConsultar}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl text-xs font-black shadow-xl shadow-orange-500/25 flex items-center gap-2 uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
          >
            <Search className="w-4 h-4" />
            Consultar Registros
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* TABELA / LISTA DE PENDÊNCIAS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Table Header Bar */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleSelectAll}
                  className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2 text-xs font-bold"
                >
                  {selectedIds.length > 0 && selectedIds.length === paginatedList.length ? (
                    <CheckSquare className="w-4 h-4 text-orange-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Selecionar Página ({paginatedList.length})</span>
                </button>

                {selectedIds.length > 0 && (
                  <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                    {selectedIds.length} selecionado(s)
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 font-semibold">
                Total de <strong className="text-slate-800">{totalItems}</strong> pendências encontradas
              </div>
            </div>

            {/* Content Rows */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-16 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-3" />
                <span className="text-sm font-bold">Consultando registros e verificando demandas...</span>
              </div>
            ) : paginatedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400/80 stroke-[1.5]" />
                <p className="text-sm font-bold text-slate-700">Nenhuma pendência encontrada</p>
                <p className="text-xs text-slate-400 max-w-sm text-center">
                  Todos os registros exigidos para os filtros selecionados estão em dia no sistema.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paginatedList.map(item => {
                  const isSelected = selectedIds.includes(item.id);
                  const { days, isOverdue } = getDaysDifference(item.prazo);

                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 transition-all hover:bg-slate-50/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        isSelected ? 'bg-orange-50/30' : ''
                      }`}
                    >
                      
                      {/* Left Column: Checkbox + Main Details */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleSelect(item.id)}
                          className="mt-1 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>

                        <div className="space-y-1 flex-1 min-w-0">
                          
                          {/* Top Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {renderStatusBadge(item.status, item.prazo)}
                            
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {item.modulo}
                            </span>

                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                              item.prioridade === 'ALTA' 
                                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                : item.prioridade === 'MEDIA'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              Prioridade {item.prioridade}
                            </span>
                          </div>

                          {/* Title & Description */}
                          <h4 className="text-sm font-black text-slate-800 mt-1">
                            {item.titulo}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {item.descricao}
                          </p>

                          {/* Metadata row */}
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 font-semibold">
                            <span className="flex items-center gap-1 text-slate-700">
                              <Users className="w-3 h-3 text-slate-400" />
                              <strong>{item.usuario_nome || 'Sem vínculo'}</strong> ({item.usuario_perfil || 'Geral'})
                            </span>

                            <span className="flex items-center gap-1">
                              <School className="w-3 h-3 text-slate-400" />
                              {item.escola_nome}
                            </span>

                            {item.turma_nome && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-slate-400" />
                                {item.turma_nome}
                              </span>
                            )}

                            {item.periodo && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <Calendar className="w-3 h-3" />
                                {item.periodo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Prazo & Actions */}
                      <div className="flex flex-row md:flex-col items-end justify-between gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        
                        {/* Prazo Details */}
                        {item.prazo ? (
                          <div className="text-right text-xs">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Prazo</span>
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="text-slate-800">{new Date(item.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isOverdue 
                                ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {isOverdue ? `${days}d atraso` : `${days}d restam`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold italic">Sem prazo fixado</span>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          
                          {/* Histórico */}
                          <button
                            onClick={() => {
                              setHistoricoItem(item);
                              setIsHistoricoModalOpen(true);
                            }}
                            title="Ver histórico e linha do tempo da demanda"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Gerar Alerta */}
                          {item.status !== 'RESOLVIDA' && (
                            <button
                              onClick={() => handleOpenAlertaIndividual(item)}
                              className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all uppercase tracking-wider"
                            >
                              <Send className="w-3 h-3" />
                              {item.status === 'EM_ALERTA' ? 'Reenviar Alerta' : 'Gerar Alerta'}
                            </button>
                          )}

                          {/* Resolver / Direcionar */}
                          {item.status !== 'RESOLVIDA' ? (
                            <button
                              onClick={() => handleNavigate(item)}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm uppercase tracking-wider"
                            >
                              <span>Resolver</span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-orange-400" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-default border border-emerald-200 uppercase"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Regularizado
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. BARRA DE PAGINAÇÃO / LIMITADOR (IDENTICO AO PADRÃO DOS INSTRUMENTAIS DE GESTÃO) */}
          {totalItems > 0 && (
            <div className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
              <div>
                Mostrando{' '}
                <span className="font-bold text-slate-800">
                  {Math.min((safePage - 1) * itemsPerPage + 1, totalItems)}
                </span>{' '}
                a{' '}
                <span className="font-bold text-slate-800">
                  {Math.min(safePage * itemsPerPage, totalItems)}
                </span>{' '}
                de <span className="font-bold text-slate-800">{totalItems}</span> pendências registradas
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Exibir:</span>
                  <select
                    value={itemsPerPage}
                    onChange={e => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none text-xs font-bold text-slate-700 focus:border-orange-500 transition-all cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                    title="Página Anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="px-2 text-xs font-bold text-slate-700">
                    {safePage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                    title="Próxima Página"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: GERAR ALERTA (INDIVIDUAL OU EM MASSA) */}
      <GerarAlertaModal
        isOpen={isAlertaModalOpen}
        onClose={() => setIsAlertaModalOpen(false)}
        items={modalAlertaItems}
        currentUserName={currentUserName}
        onGenerate={handleGenerateAlerts}
        onSuccess={() => {}}
      />

      {/* MODAL: HISTÓRICO DA PENDÊNCIA */}
      <HistoricoPendenciaModal
        isOpen={isHistoricoModalOpen}
        onClose={() => setIsHistoricoModalOpen(false)}
        item={historicoItem}
      />
    </div>
  );
};
