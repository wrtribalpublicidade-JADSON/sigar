import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertaPendencia } from '../types';
import { Printer, Download, X, FileText, CheckCircle2, AlertTriangle, AlertCircle, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { Button } from './ui/Button';
import { getDaysDifference } from '../services/pendenciasEngineService';

export interface PrintableAlertasPendenciasReportProps {
  items: AlertaPendencia[];
  filtroTipo?: string;
  filtroStatus?: string;
  filtroEscola?: string;
  filtroResponsavelNome?: string;
  filtroPerfil?: string;
  filtroPeriodo?: string;
  escolaNome?: string;
  currentUserName?: string;
  currentUserRole?: string;
  initialMode?: 'relatorio' | 'oficio';
  onClose: () => void;
}

export const PrintableAlertasPendenciasReport: React.FC<PrintableAlertasPendenciasReportProps> = ({
  items,
  filtroTipo = 'Todos',
  filtroStatus = 'Todos',
  filtroEscola = 'Todas as Escolas',
  filtroResponsavelNome = 'Todos',
  filtroPerfil = 'Todos',
  filtroPeriodo = 'Todos',
  escolaNome,
  currentUserName = 'Administrador',
  currentUserRole = 'Coordenação Regional',
  initialMode = 'relatorio',
  onClose,
}) => {
  const [mode, setMode] = useState<'relatorio' | 'oficio'>(initialMode);
  const [orientacao, setOrientacao] = useState<'landscape' | 'portrait'>('landscape');
  const [showPdfTip, setShowPdfTip] = useState(false);

  const currentYear = new Date().getFullYear();
  const emissionDate = new Date().toLocaleDateString('pt-BR');
  const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Calculate statistics
  const total = items.length;
  const emAlerta = items.filter(p => p.status === 'EM_ALERTA').length;
  const vencidas = items.filter(p => p.status === 'VENCIDA').length;
  const escalonadas = items.filter(p => p.status === 'ESCALONADA').length;
  const resolvidas = items.filter(p => p.status === 'RESOLVIDA').length;
  const pendentes = items.filter(p => p.status === 'PENDENTE').length;
  const taxaRegularizacao = total > 0 ? Math.round((resolvidas / total) * 100) : 100;

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = () => {
    setShowPdfTip(true);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case 'EM_ALERTA': return 'EM ALERTA';
      case 'VENCIDA': return 'VENCIDA';
      case 'ESCALONADA': return 'ESCALONADA';
      case 'RESOLVIDA': return 'RESOLVIDA';
      default: return 'PENDENTE';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EM_ALERTA': return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'VENCIDA': return { bg: '#ffe4e6', text: '#9f1239', border: '#fecdd3' };
      case 'ESCALONADA': return { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' };
      case 'RESOLVIDA': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      default: return { bg: '#f1f5f9', text: '#334155', border: '#e2e8f0' };
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-2 md:p-6 animate-fade-in">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }
            .printable-notificacoes-container, .printable-notificacoes-container * {
              visibility: visible !important;
            }
            .printable-notificacoes-container {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4 ${orientacao};
              margin: ${orientacao === 'landscape' ? '1cm' : '1.5cm'};
            }
            .page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
            tr {
              page-break-inside: avoid !important;
            }
          }
        `}
      </style>

      <div className="printable-notificacoes-container bg-white text-slate-900 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-4 flex flex-col">
        
        {/* ====== ACTIONS TOOLBAR (NO PRINT) ====== */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-sm uppercase tracking-wide text-white block">
                Impressão & Exportação PDF de Notificações
              </span>
              <span className="text-[11px] text-slate-400">
                {items.length} registro(s) selecionado(s) para impressão
              </span>
            </div>
          </div>

          {/* Controls: Mode + Orientation + Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Mode Switcher */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700 text-xs">
              <button
                onClick={() => {
                  setMode('relatorio');
                  setOrientacao('landscape');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  mode === 'relatorio' 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Relatório Geral (Tabela)
              </button>
              <button
                onClick={() => {
                  setMode('oficio');
                  setOrientacao('portrait');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  mode === 'oficio' 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Notificação Formal (Ofício)
              </button>
            </div>

            {/* Orientation */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700 text-xs">
              <button
                onClick={() => setOrientacao('landscape')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  orientacao === 'landscape' 
                    ? 'bg-slate-700 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Paisagem (Horizontal)"
              >
                Paisagem
              </button>
              <button
                onClick={() => setOrientacao('portrait')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  orientacao === 'portrait' 
                    ? 'bg-slate-700 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Retrato (Vertical)"
              >
                Retrato
              </button>
            </div>

            {/* Save as PDF */}
            <button
              onClick={handleSavePdf}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all border border-slate-700"
              title="Salvar como PDF no navegador"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span>Salvar em PDF</span>
            </button>

            {/* Print Button */}
            <Button
              onClick={handlePrint}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </Button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Fechar visualização"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Hint Banner */}
        {showPdfTip && (
          <div className="no-print bg-orange-50 border-b border-orange-200 px-6 py-2 flex items-center justify-between text-xs text-orange-800 font-medium animate-slide-down">
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4 text-orange-600 shrink-0" />
              <strong>Dica para Salvar em PDF:</strong> Na janela de impressão do seu navegador, altere o campo <em>Destino / Impressora</em> para <strong>"Salvar como PDF"</strong> e clique em <em>Salvar</em>.
            </span>
            <button onClick={() => setShowPdfTip(false)} className="text-orange-600 hover:text-orange-900 font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* ====== PRINTABLE DOCUMENT BODY ====== */}
        <div className="p-6 md:p-10 font-sans overflow-x-auto bg-white">
          
          {/* ========================================================= */}
          {/* MODO 1: RELATÓRIO GERAL DE NOTIFICAÇÕES (TABELA ANALÍTICA) */}
          {/* ========================================================= */}
          {mode === 'relatorio' ? (
            <div className="space-y-6">
              
              {/* INSTITUTIONAL HEADER */}
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <p className="text-[9px] font-bold tracking-[0.25em] text-slate-500 uppercase mb-0.5">
                  ESTADO DO MARANHÃO
                </p>
                <p className="text-xs font-black tracking-[0.15em] text-slate-900 uppercase mb-0.5">
                  PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
                </p>
                <p className="text-[10px] font-bold tracking-[0.2em] text-slate-600 uppercase mb-3">
                  SECRETARIA MUNICIPAL DE EDUCAÇÃO • SISTEMA INTEGRADO DE GESTÃO (SIGAR)
                </p>
                <div className="w-16 h-0.5 bg-orange-500 mx-auto mb-3" />
                <h1 className="text-base md:text-lg font-black uppercase text-slate-900 tracking-tight">
                  Relatório Oficial de Alertas e Notificações de Pendências
                </h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                  Acompanhamento Automatizado de Demandas e Prazos Operacionais da Rede
                </p>
              </div>

              {/* EMISSION INFO & PARAMETERS */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Tipo de Demanda</span>
                  <span className="font-bold text-slate-800">{filtroTipo || 'Todos'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Unidade Escolar</span>
                  <span className="font-bold text-slate-800 truncate block">{escolaNome || filtroEscola}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Bimestre / Período</span>
                  <span className="font-bold text-slate-800">{filtroPeriodo || 'Todos'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Emissão</span>
                  <span className="font-bold text-slate-800">{emissionDate} às {emissionTime}</span>
                </div>
              </div>

              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Total</span>
                  <span className="text-lg font-black text-slate-900">{total}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50">
                  <span className="text-[9px] font-bold text-amber-700 uppercase block">Em Alerta</span>
                  <span className="text-lg font-black text-amber-800">{emAlerta}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50">
                  <span className="text-[9px] font-bold text-rose-700 uppercase block">Vencidas</span>
                  <span className="text-lg font-black text-rose-800">{vencidas}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/50">
                  <span className="text-[9px] font-bold text-purple-700 uppercase block">Escalonadas</span>
                  <span className="text-lg font-black text-purple-900">{escalonadas}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <span className="text-[9px] font-bold text-emerald-700 uppercase block">Resolvidas</span>
                  <span className="text-lg font-black text-emerald-800">{resolvidas}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Regularização</span>
                  <span className="text-lg font-black text-slate-900">{taxaRegularizacao}%</span>
                </div>
              </div>

              {/* TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[9px] uppercase tracking-wider">
                      <th className="p-2 border border-slate-700 w-8 text-center">Nº</th>
                      <th className="p-2 border border-slate-700">Unidade Escolar</th>
                      <th className="p-2 border border-slate-700">Responsável & Perfil</th>
                      <th className="p-2 border border-slate-700">Turma / Componente</th>
                      <th className="p-2 border border-slate-700">Pendência / Demanda</th>
                      <th className="p-2 border border-slate-700 text-center">Período</th>
                      <th className="p-2 border border-slate-700 text-center">Prazo Limite</th>
                      <th className="p-2 border border-slate-700 text-center">Status</th>
                      <th className="p-2 border border-slate-700">Co-responsáveis / Gestão</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px] text-slate-700">
                    {items.map((item, idx) => {
                      const color = getStatusColor(item.status);
                      const { days, isOverdue } = getDaysDifference(item.prazo);

                      return (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="p-2 border border-slate-200 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-2 border border-slate-200 font-bold text-slate-800">
                            {item.escola_nome || '---'}
                          </td>
                          <td className="p-2 border border-slate-200">
                            <strong className="text-slate-900 block">{item.usuario_nome || 'Sem vínculo'}</strong>
                            <span className="text-[9px] text-slate-500">({item.usuario_perfil || 'Geral'})</span>
                          </td>
                          <td className="p-2 border border-slate-200">
                            <span className="font-semibold block">{item.turma_nome || 'Geral'}</span>
                            {item.componente && (
                              <span className="text-[9px] text-slate-500 block">{item.componente}</span>
                            )}
                          </td>
                          <td className="p-2 border border-slate-200">
                            <strong className="text-slate-900 block text-[10.5px]">{item.titulo}</strong>
                            <p className="text-[9.5px] text-slate-600 leading-tight line-clamp-2 mt-0.5">{item.descricao}</p>
                          </td>
                          <td className="p-2 border border-slate-200 text-center font-semibold text-slate-800 whitespace-nowrap">
                            {item.periodo || '---'}
                          </td>
                          <td className="p-2 border border-slate-200 text-center whitespace-nowrap">
                            {item.prazo ? (
                              <div>
                                <span className="font-bold text-slate-800 block">
                                  {new Date(item.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </span>
                                <span className={`text-[8.5px] font-black uppercase ${isOverdue ? 'text-rose-600' : 'text-amber-700'}`}>
                                  {isOverdue ? `(${days}d atraso)` : `(${days}d restam)`}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[9px]">Sem prazo</span>
                            )}
                          </td>
                          <td className="p-2 border border-slate-200 text-center whitespace-nowrap">
                            <span 
                              className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase inline-block border"
                              style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}
                            >
                              {getStatusBadgeText(item.status)}
                            </span>
                          </td>
                          <td className="p-2 border border-slate-200 text-[9px] text-slate-600 leading-tight">
                            {item.co_responsaveis_nomes || 'Gestão da Unidade Escolar'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* INSTITUTIONAL SIGNATURES & VALIDATION FOOTER */}
              <div className="pt-10 border-t border-slate-200 grid grid-cols-2 gap-12 text-center text-xs">
                <div>
                  <div className="border-t border-slate-800 mx-auto w-4/5 pt-1.5 font-black uppercase text-slate-800 text-[10px]">
                    Coordenação Pedagógica / Gestão Escolar
                  </div>
                  <span className="text-[9px] text-slate-500">Unidade Escolar / Rede Municipal</span>
                </div>
                <div>
                  <div className="border-t border-slate-800 mx-auto w-4/5 pt-1.5 font-black uppercase text-slate-800 text-[10px]">
                    Secretaria Municipal de Educação
                  </div>
                  <span className="text-[9px] text-slate-500">Coordenação Regional e Monitoramento</span>
                </div>
              </div>

              <div className="text-[8.5px] text-slate-400 text-center pt-4">
                Documento emitido eletronicamente pelo Sistema Integrado de Gestão (SIGAR) em {emissionDate} às {emissionTime}.
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* MODO 2: NOTIFICAÇÃO FORMAL INDIVIDUAL / EM LOTE (OFÍCIO FORMAL) */
            /* =============================================================== */
            <div className="space-y-12">
              {items.map((item, idx) => {
                const { days, isOverdue } = getDaysDifference(item.prazo);
                const color = getStatusColor(item.status);
                const protocolo = `NOT-${currentYear}-${String(idx + 1).padStart(4, '0')}`;

                return (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-xl border border-slate-300 p-8 md:p-12 text-slate-900 space-y-6 ${
                      idx < items.length - 1 ? 'page-break mb-8' : ''
                    }`}
                  >
                    {/* Header */}
                    <div className="text-center pb-5 border-b-2 border-slate-900">
                      <p className="text-[8.5px] font-bold tracking-[0.25em] text-slate-500 uppercase mb-0.5">
                        ESTADO DO MARANHÃO
                      </p>
                      <p className="text-xs font-black tracking-[0.15em] text-slate-900 uppercase mb-0.5">
                        PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
                      </p>
                      <p className="text-[9.5px] font-bold tracking-[0.2em] text-slate-600 uppercase mb-4">
                        SECRETARIA MUNICIPAL DE EDUCAÇÃO • SISTEMA INTEGRADO DE GESTÃO (SIGAR)
                      </p>
                      <div className="w-16 h-0.5 bg-orange-500 mx-auto mb-3" />
                      <h2 className="text-base md:text-lg font-black uppercase tracking-tight text-slate-900">
                        Notificação Formal de Pendência Operacional
                      </h2>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                        Protocolo Oficial: <strong>{protocolo}</strong>
                      </p>
                    </div>

                    {/* Meta Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Data de Identificação</span>
                        <span className="font-bold text-slate-800">
                          {new Date(item.data_identificacao).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Módulo do Sistema</span>
                        <span className="font-bold text-slate-800">{item.modulo}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Prioridade</span>
                        <span className="font-bold text-rose-700">Prioridade {item.prioridade}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Situação</span>
                        <span 
                          className="px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block border"
                          style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}
                        >
                          {getStatusBadgeText(item.status)}
                        </span>
                      </div>
                    </div>

                    {/* Notified Person Box */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <h3 className="font-black text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1 flex items-center justify-between">
                        <span>1. Dados do(a) Servidor(a) Notificado(a)</span>
                        <span className="text-[9px] font-semibold text-slate-500 normal-case">Destinatário Principal</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Nome do Servidor</span>
                          <strong className="text-slate-900 text-sm">{item.usuario_nome || 'Não especificado'}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Função / Perfil</span>
                          <span className="font-semibold text-slate-800">{item.usuario_perfil || 'Servidor da Educação'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Unidade Escolar</span>
                          <span className="font-semibold text-slate-800">{item.escola_nome}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Turma & Componente Curricular</span>
                          <span className="font-semibold text-slate-800">
                            {item.turma_nome || 'Geral'} {item.componente ? `• ${item.componente}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pending Details Box */}
                    <div className="p-4 bg-orange-50/40 rounded-xl border border-orange-200/80 space-y-2 text-xs">
                      <h3 className="font-black text-slate-900 uppercase text-[11px] tracking-wider border-b border-orange-200 pb-1 flex items-center justify-between">
                        <span>2. Discriminação da Pendência Operacional</span>
                        <span className="text-[9px] font-bold text-orange-700 uppercase">{item.periodo || 'Período Letivo'}</span>
                      </h3>
                      <div className="space-y-2 pt-1">
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">Assunto / Demanda</span>
                          <strong className="text-slate-900 text-sm">{item.titulo}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">Descrição e Ocorrência Verificada</span>
                          <p className="text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-orange-100">
                            {item.descricao}
                          </p>
                        </div>
                        {item.observacao_alerta && (
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase block">Orientações Complementares da Coordenação</span>
                            <p className="text-slate-800 italic bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                              "{item.observacao_alerta}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deadline and Administrative Instructions */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <h3 className="font-black text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                        3. Prazo e Determinações Administrativas
                      </h3>
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Prazo Impreterível para Regularização</span>
                            <span className="text-base font-black text-slate-900">
                              {item.prazo ? new Date(item.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : 'Imediato (em até 48 horas)'}
                            </span>
                          </div>
                          {item.prazo && (
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                              {isOverdue ? `Atraso de ${days} dias` : `${days} dias restantes`}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed text-justify">
                          Fica o(a) servidor(a) formalmente <strong>NOTIFICADO(A)</strong> a regularizar os lançamentos e registros escolares devidos no sistema informatizado dentro do prazo estipulado. O não atendimento implicará no encaminhamento do relatório de pendências à Direção Escolar e à Secretaria Municipal de Educação para as providências administrativas e regimentais cabíveis.
                        </p>

                        {item.co_responsaveis_nomes && (
                          <div className="text-[10px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                            <strong>Em Cópia / Co-responsáveis Institucionais:</strong> {item.co_responsaveis_nomes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Term of Acknowledgment & Signatures */}
                    <div className="pt-6 space-y-8">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 text-xs">
                        <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wide mb-1">
                          Termo de Ciência e Recebimento
                        </p>
                        <p className="text-[10.5px] text-slate-600 leading-relaxed text-justify mb-4">
                          Declaro que recebi e tomei ciência dos termos da presente Notificação de Pendência Operacional, comprometendo-me a adotar as providências necessárias para sua regularização dentro do prazo concedido.
                        </p>
                        <div className="grid grid-cols-2 gap-8 pt-4">
                          <div>
                            <div className="border-b border-slate-400 pb-1 text-slate-400 text-[10px]">
                              Data: _____ / _____ / {currentYear}
                            </div>
                          </div>
                          <div>
                            <div className="border-b border-slate-400 pb-1 text-center font-bold text-slate-700 text-[10px]">
                              Assinatura do(a) Servidor(a) Notificado(a)
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 text-center pt-2">
                        <div>
                          <div className="border-t border-slate-800 mx-auto w-4/5 pt-1.5 font-bold uppercase text-slate-800 text-[10px]">
                            Coordenação Pedagógica / Direção
                          </div>
                          <span className="text-[9px] text-slate-500">Notificante</span>
                        </div>
                        <div>
                          <div className="border-t border-slate-800 mx-auto w-4/5 pt-1.5 font-bold uppercase text-slate-800 text-[10px]">
                            Secretaria Municipal de Educação
                          </div>
                          <span className="text-[9px] text-slate-500">Monitoramento Regional • SIGAR</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
};
