import React from 'react';
import { createPortal } from 'react-dom';
import { MatrizCurricularConfig, calcularTotaisMatriz, formatarCargaComponente, formatarMinutosParaHoras } from '../services/configuracaoService';
import { Printer, X } from 'lucide-react';
import { Button } from './ui/Button';

interface PrintableMatrizCurricularProps {
  matriz: MatrizCurricularConfig;
  nomeRede?: string;
  onClose: () => void;
}

export const PrintableMatrizCurricular: React.FC<PrintableMatrizCurricularProps> = ({
  matriz,
  nomeRede = 'SISTEMA INTEGRADO DE GESTÃO DA REDE MUNICIPAL DE ENSINO',
  onClose
}) => {
  const totais = calcularTotaisMatriz(matriz);
  const isInfantil = matriz.etapaId === 'infantil';
  const isSemestral = matriz.tipoPeriodo === 'semestral';

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 md:p-8">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }
            .printable-matrix-modal, .printable-matrix-modal * {
              visibility: visible !important;
            }
            .printable-matrix-modal {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 20px !important;
              box-shadow: none !important;
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4 portrait;
              margin: 1.5cm;
            }
          }
        `}
      </style>

      <div className="printable-matrix-modal bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-4">
        {/* Actions Bar (No Print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-brand-orange" />
            <span className="font-bold text-sm uppercase tracking-wide">Impressão da Matriz Curricular</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handlePrint}
              className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir Matriz
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-8 md:p-12 font-sans">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600">{nomeRede}</h4>
            <h1 className="text-xl font-black uppercase text-slate-900 mt-1 tracking-tight">
              {matriz.titulo}
            </h1>
            {matriz.subtitulo && (
              <p className="text-xs font-semibold text-slate-600 mt-0.5 uppercase tracking-wide">
                {matriz.subtitulo}
              </p>
            )}
          </div>

          {/* Key Parameters Cards */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Dias Letivos</span>
              <span className="text-base font-black text-slate-900">{matriz.diasLetivos}</span>
            </div>
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                {isSemestral ? 'Semanas / Semestre' : 'Semanas / Ano'}
              </span>
              <span className="text-base font-black text-slate-900">{matriz.semanasPeriodo}</span>
            </div>
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Aulas / Dia</span>
              <span className="text-base font-black text-slate-900">{matriz.aulasDia}</span>
            </div>
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Carga Horária Total</span>
              <span className="text-base font-black text-slate-900">{totais.horasFormatadas}</span>
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border border-slate-800 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 text-center font-black uppercase text-[11px]">
                {!isInfantil && (
                  <th className="border border-slate-800 px-3 py-2.5 text-left w-1/4">
                    ÁREA DO CONHECIMENTO
                  </th>
                )}
                <th className="border border-slate-800 px-3 py-2.5 text-left">
                  {isInfantil ? 'CAMPOS DE EXPERIÊNCIA' : 'COMPONENTE CURRICULAR'}
                </th>
                <th className="border border-slate-800 px-2.5 py-2.5 w-24">
                  AULA SEMANAL
                </th>
                <th className="border border-slate-800 px-2.5 py-2.5 w-28">
                  {isSemestral ? 'AULAS SEMESTRAIS' : 'AULAS ANUAIS'}
                </th>
                <th className="border border-slate-800 px-2.5 py-2.5 w-32">
                  CARGA HORÁRIA COMPONENTE
                </th>
                <th className="border border-slate-800 px-2.5 py-2.5 w-28">
                  HORAS
                </th>
              </tr>
            </thead>
            <tbody>
              {matriz.itens.map((item, idx) => {
                const itemAulasSemanais = Number(item.aulasSemanais) || 0;
                const itemAulasTotais = itemAulasSemanais * matriz.semanasPeriodo;
                const duracaoMin = Number(item.duracaoMinutos) || matriz.duracaoPadraoMinutos || 50;
                const itemMinutos = itemAulasTotais * duracaoMin;
                const cargaComp = formatarCargaComponente(duracaoMin);
                const horasFormatadas = formatarMinutosParaHoras(itemMinutos);

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    {!isInfantil && (
                      <td className="border border-slate-800 px-3 py-2 font-bold text-slate-700 uppercase">
                        {item.area || '—'}
                      </td>
                    )}
                    <td className="border border-slate-800 px-3 py-2 font-semibold text-slate-900 uppercase">
                      {item.componente}
                      {item.observacao && (
                        <span className="text-brand-orange font-black ml-1">{item.observacao}</span>
                      )}
                    </td>
                    <td className="border border-slate-800 px-2.5 py-2 text-center font-bold">
                      {itemAulasSemanais}
                    </td>
                    <td className="border border-slate-800 px-2.5 py-2 text-center font-bold">
                      {itemAulasTotais}
                    </td>
                    <td className="border border-slate-800 px-2.5 py-2 text-center font-mono text-slate-700">
                      {cargaComp}
                    </td>
                    <td className="border border-slate-800 px-2.5 py-2 text-center font-mono font-bold text-slate-900">
                      {horasFormatadas}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200/80 font-black text-slate-900 border-t-2 border-slate-900">
                <td
                  colSpan={isInfantil ? 1 : 2}
                  className="border border-slate-800 px-3 py-2.5 uppercase tracking-wider text-right"
                >
                  TOTAL GERAL
                </td>
                <td className="border border-slate-800 px-2.5 py-2.5 text-center text-sm">
                  {totais.aulasSemanais}
                </td>
                <td className="border border-slate-800 px-2.5 py-2.5 text-center text-sm">
                  {totais.aulasTotais}
                </td>
                <td className="border border-slate-800 px-2.5 py-2.5 text-center font-mono text-slate-500">
                  —
                </td>
                <td className="border border-slate-800 px-2.5 py-2.5 text-center font-mono text-sm">
                  {totais.horasFormatadas}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Observations note */}
          <div className="mt-4 text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold">
              * Nota: Os componentes com asterisco possuem duração diferenciada (40 minutos) conforme matriz curricular homologada.
            </p>
            <p className="text-slate-500">
              Documento emitido em {today} pelo SIGAR – Sistema Integrado de Gestão da Rede Municipal.
            </p>
          </div>

          {/* Signature lines */}
          <div className="grid grid-cols-2 gap-12 mt-16 pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="border-t border-slate-900 pt-2 w-4/5 mx-auto">
                <p className="font-black text-xs uppercase text-slate-800">Secretaria Municipal de Educação</p>
                <p className="text-[10px] text-slate-500 font-medium">Gestão e Planejamento da Rede</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-900 pt-2 w-4/5 mx-auto">
                <p className="font-black text-xs uppercase text-slate-800">Coordenação Pedagógica</p>
                <p className="text-[10px] text-slate-500 font-medium">Supervisão Escolar e Curricular</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
