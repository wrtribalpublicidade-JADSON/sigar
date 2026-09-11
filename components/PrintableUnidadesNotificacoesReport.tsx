import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Escola, PendencyType } from '../types';
import { Printer, Download, X, School, AlertTriangle, Users, Target, FileText } from 'lucide-react';
import { Button } from './ui/Button';

interface SchoolPendencyItem {
  escola: Escola;
  pendencies: {
    type: PendencyType;
    label: string;
    severity: 'critical' | 'warning';
  }[];
}

export interface PrintableUnidadesNotificacoesReportProps {
  data: SchoolPendencyItem[];
  filtroCoordenadorNome?: string;
  filtroTipo?: string;
  currentUserName?: string;
  onClose: () => void;
}

export const PrintableUnidadesNotificacoesReport: React.FC<PrintableUnidadesNotificacoesReportProps> = ({
  data,
  filtroCoordenadorNome = 'Todos',
  filtroTipo = 'Todas',
  currentUserName = 'Administrador',
  onClose,
}) => {
  const [showPdfTip, setShowPdfTip] = useState(false);
  const currentYear = new Date().getFullYear();
  const emissionDate = new Date().toLocaleDateString('pt-BR');
  const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const totalEscolas = data.length;
  const totalPendencias = data.reduce((acc, curr) => acc + curr.pendencies.length, 0);
  const totalCriticas = data.reduce((acc, curr) => acc + curr.pendencies.filter(p => p.severity === 'critical').length, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = () => {
    setShowPdfTip(true);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-2 md:p-6 animate-fade-in">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }
            .printable-unidades-container, .printable-unidades-container * {
              visibility: visible !important;
            }
            .printable-unidades-container {
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
              size: A4 landscape;
              margin: 1cm;
            }
            tr {
              page-break-inside: avoid !important;
            }
          }
        `}
      </style>

      <div className="printable-unidades-container bg-white text-slate-900 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-4 flex flex-col">
        
        {/* Actions Bar */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <School className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-sm uppercase tracking-wide text-white block">
                Relatório de Notificações das Unidades Escolares
              </span>
              <span className="text-[11px] text-slate-400">
                {totalEscolas} unidade(s) com pendências estruturais registradas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSavePdf}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span>Salvar em PDF</span>
            </button>

            <Button
              onClick={handlePrint}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </Button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Fechar"
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
              <strong>Dica para Salvar em PDF:</strong> Na tela de impressão do seu navegador, escolha <strong>"Salvar como PDF"</strong> no destino da impressora.
            </span>
            <button onClick={() => setShowPdfTip(false)} className="text-orange-600 hover:text-orange-900 font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Document Body */}
        <div className="p-6 md:p-10 font-sans bg-white space-y-6">
          
          {/* Header */}
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
              Relatório Consolidado de Notificações das Unidades Escolares
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Monitoramento de Demandas Estruturais, RH, Matrículas e Planos de Ação
            </p>
          </div>

          {/* Metadata info */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Tipo de Ocorrência</span>
              <span className="font-bold text-slate-800">{filtroTipo}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Coordenador Regional</span>
              <span className="font-bold text-slate-800">{filtroCoordenadorNome}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Total de Escolas</span>
              <span className="font-bold text-slate-800">{totalEscolas} escolas afetadas</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Emissão</span>
              <span className="font-bold text-slate-800">{emissionDate} às {emissionTime}</span>
            </div>
          </div>

          {/* Cards Summary */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Escolas com Ocorrências</span>
              <span className="text-xl font-black text-slate-900">{totalEscolas}</span>
            </div>
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
              <span className="text-[9px] font-bold text-amber-700 uppercase block">Total de Pendências</span>
              <span className="text-xl font-black text-amber-800">{totalPendencias}</span>
            </div>
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
              <span className="text-[9px] font-bold text-rose-700 uppercase block">Ocorrências Críticas</span>
              <span className="text-xl font-black text-rose-800">{totalCriticas}</span>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-900 text-white text-[9px] uppercase tracking-wider">
                <th className="p-2 border border-slate-700 w-8 text-center">Nº</th>
                <th className="p-2 border border-slate-700">Unidade Escolar</th>
                <th className="p-2 border border-slate-700">Localização / Bairro</th>
                <th className="p-2 border border-slate-700 text-center">Gravidade</th>
                <th className="p-2 border border-slate-700">Discriminação das Pendências da Unidade</th>
              </tr>
            </thead>
            <tbody className="text-[10.5px] text-slate-700">
              {data.map(({ escola, pendencies }, idx) => {
                const isCritico = pendencies.some(p => p.severity === 'critical');

                return (
                  <tr key={escola.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="p-2 border border-slate-200 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="p-2 border border-slate-200 font-black text-slate-900">
                      {escola.nome}
                    </td>
                    <td className="p-2 border border-slate-200 text-slate-600 font-semibold">
                      {escola.polo ? `${escola.localizacao} • Polo ${escola.polo}` : (escola.localizacao || 'Sede')}
                    </td>
                    <td className="p-2 border border-slate-200 text-center whitespace-nowrap">
                      {isCritico ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                          Crítico
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                          Atenção
                        </span>
                      )}
                    </td>
                    <td className="p-2 border border-slate-200">
                      <div className="space-y-1">
                        {pendencies.map((p, pIdx) => (
                          <div key={pIdx} className="flex items-start gap-1.5 text-[10px]">
                            <span className="font-bold text-slate-700 uppercase tracking-tight shrink-0">
                              • [{p.type}]:
                            </span>
                            <span className="text-slate-600 font-medium">
                              {p.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer */}
          <div className="pt-10 border-t border-slate-200 grid grid-cols-2 gap-12 text-center text-xs">
            <div>
              <div className="border-t border-slate-800 mx-auto w-4/5 pt-1.5 font-black uppercase text-slate-800 text-[10px]">
                Coordenação de Monitoramento e Acompanhamento
              </div>
              <span className="text-[9px] text-slate-500">SEMED • Humberto de Campos</span>
            </div>
            <div>
              <div className="border-t border-slate-800 mx-auto w-4/5 pt-1.5 font-black uppercase text-slate-800 text-[10px]">
                Secretaria Municipal de Educação
              </div>
              <span className="text-[9px] text-slate-500">Gestão da Rede Municipal</span>
            </div>
          </div>

          <div className="text-[8.5px] text-slate-400 text-center pt-2">
            Documento emitido eletronicamente pelo Sistema Integrado de Gestão (SIGAR) em {emissionDate} às {emissionTime}.
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
