import React from 'react';
import { Visita, Escola, Coordenador, TopicoPauta, EncaminhamentoVisita } from '../types';
import { ClipboardList, Calendar, MapPin, User, CheckSquare, Clock } from 'lucide-react';

interface PrintableVisitReportProps {
    visita: Visita;
    escola?: Escola;
    coordenador?: Coordenador;
}

export const PrintableVisitReport: React.FC<PrintableVisitReportProps> = ({ visita, escola, coordenador }) => {
    const currentYear = new Date().getFullYear();
    const protocolNumber = visita.id.split('-')[0].toUpperCase();

    return (
        <div className="hidden print:block p-12 bg-white text-slate-900 font-sans">
            {/* Official State/Municipal Header */}
            <div className="text-center mb-10 border-b-2 border-slate-900 pb-6">
                <h2 className="text-xs font-black tracking-[0.3em] uppercase mb-1 text-slate-500">Estado do Piauí</h2>
                <h2 className="text-sm font-black tracking-[0.2em] uppercase mb-4 text-slate-800">Prefeitura Municipal de Ensino</h2>
                <div className="w-16 h-1 bg-slate-900 mx-auto mb-4"></div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Relatório Oficial de Visita Técnica</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 transform scale-90">Secretaria Municipal de Educação • Superintendência de Ensino</p>
            </div>

            {/* Protocol & Info Row */}
            <div className="flex justify-between items-start mb-10 bg-slate-50 p-6 border border-slate-200 rounded-lg">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Identificação do Documento</p>
                    <p className="text-xl font-black text-slate-900 tracking-tight">RELATÓRIO Nº {protocolNumber}/{currentYear}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Emissão do Sistema</p>
                    <p className="font-mono text-xs font-bold text-slate-700">{new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}</p>
                </div>
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 gap-12 mb-12 border-b border-slate-100 pb-10">
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 p-1 bg-slate-900 text-white rounded"><MapPin size={14} /></div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Unidade Escolar Atendida</p>
                            <p className="text-sm font-black text-slate-900 uppercase leading-tight">{escola?.nome || visita.escolaNome}</p>
                            <p className="text-[10px] text-slate-500 mt-1 font-medium italic">{escola?.localizacao || 'Sede Municipal'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="mt-1 p-1 bg-slate-900 text-white rounded"><User size={14} /></div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Gestor(a) Responsável</p>
                            <p className="text-sm font-black text-slate-900 uppercase">{escola?.gestor || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-6 text-right">
                    <div className="flex items-start gap-4 justify-end text-right">
                        <div className="order-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Data da Intervenção</p>
                            <p className="text-sm font-black text-slate-900">{new Date(visita.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="order-2 mt-1 p-1 bg-slate-900 text-white rounded"><Calendar size={14} /></div>
                    </div>
                    <div className="flex items-start gap-4 justify-end text-right">
                        <div className="order-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Natureza da Visita</p>
                            <p className="text-sm font-black text-slate-900 uppercase">{visita.tipo}</p>
                        </div>
                        <div className="order-2 mt-1 p-1 bg-slate-900 text-white rounded"><ClipboardList size={14} /></div>
                    </div>
                </div>
            </div>

            {/* Matrix Section */}
            <div className="mb-12">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] bg-slate-900 text-white px-5 py-2.5 mb-5 inline-block">Matriz de Observação</h3>
                <div className="flex flex-wrap gap-2">
                    {visita.foco.map(item => (
                        <span key={item} className="px-4 py-1.5 border-2 border-slate-900 text-[9px] font-black uppercase tracking-[0.15em]">{item}</span>
                    ))}
                </div>
            </div>

            {/* Pauta Section */}
            <div className="mb-12">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-slate-900 pb-2 mb-5">Tópicos de Pauta e Deliberações</h3>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">
                            <th className="pb-4 border-b border-slate-200">Descrição Detalhada do Assunto Abordado</th>
                            <th className="pb-4 border-b border-slate-200 w-32 text-center">Eixo Temático</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 italic font-mono">
                        {visita.topicosPauta?.map((t: TopicoPauta) => (
                            <tr key={t.id}>
                                <td className="py-4 text-xs text-slate-700 leading-relaxed pr-8">{t.descricao}</td>
                                <td className="py-4 text-[9px] font-black uppercase text-center align-top whitespace-nowrap bg-slate-50/50">{t.categoria}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Encaminhamentos Section */}
            <div className="mb-12 page-break-before">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] bg-slate-100 p-5 border-l-[12px] border-slate-900 mb-6 flex items-center gap-4 text-slate-900">
                    <CheckSquare size={20} /> Encaminhamentos, Diretrizes e Prazos
                </h3>
                <div className="space-y-8">
                    {visita.encaminhamentosRegistrados?.map((enc: EncaminhamentoVisita) => (
                        <div key={enc.id} className="border-b border-slate-200 pb-6 relative">
                            <div className="flex justify-between items-start mb-3">
                                <p className="font-bold text-slate-900 text-sm leading-relaxed max-w-[80%]">{enc.descricao}</p>
                                <div className="text-right shrink-0">
                                    <span className="text-[9px] font-black bg-slate-900 text-white px-3 py-1 rounded uppercase tracking-widest">{enc.responsavel}</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={10} className="text-slate-900" /> Prazo de Execução: <span className="text-slate-900">{new Date(enc.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                </p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-300"></div> Status: <span className="text-slate-900">{enc.status}</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Final Considerations */}
            <div className="mb-20">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-slate-900 pb-2 mb-5 text-slate-400">Considerações Qualitativas e Conclusão</h3>
                <div className="p-8 bg-slate-50 rounded italic text-sm text-slate-700 leading-relaxed border-2 border-dashed border-slate-200 min-h-[120px]">
                    {visita.encaminhamentos || 'Sem observações qualitativas complementares para este registro oficial.'}
                </div>
            </div>

            {/* Signatures */}
            <div className="mt-24 pt-12 grid grid-cols-2 gap-24 overflow-visible">
                <div className="text-center relative">
                    <div className="border-t-2 border-slate-900 w-full mb-3"></div>
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-900">{escola?.gestor || 'Gestor(a) Geral'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5 font-mono">GESTOR(A) GERAL</p>
                    <p className="text-[8px] text-slate-300 mt-1 italic">Assinatura e Carimbo</p>
                </div>
                <div className="text-center relative">
                    <div className="border-t-2 border-slate-900 w-full mb-3"></div>
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-900">{coordenador?.nome || 'Coordenador(a) Regional'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5 font-mono text-center">COORDENADOR(A) PEDAGÓGICO(A) REGIONAL</p>
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mt-1 text-center scale-90">{coordenador?.regiao || 'Regional Responsável'}</p>
                    <p className="text-[8px] text-slate-300 mt-1 italic">Assinatura e Carimbo</p>
                </div>
            </div>

            {/* Page Info */}
            <div className="mt-20 flex justify-between items-center text-[8px] font-bold text-slate-300 uppercase tracking-[0.4em] border-t border-slate-50 pt-8">
                <p>SIGAR • SISTEMA DE GESTÃO E ACOMPANHAMENTO REGIONAL</p>
                <p>SECRETARIA MUNICIPAL DE EDUCAÇÃO</p>
            </div>
        </div>
    );
};
