import React from 'react';
import { Escola, ItemAcompanhamento } from '../types';

interface PrintableChecklistReportProps {
    escola: Escola;
    acompanhamentoMensal: ItemAcompanhamento[];
}

export const PrintableChecklistReport: React.FC<PrintableChecklistReportProps> = ({ escola, acompanhamentoMensal }) => {
    // Separate items by category
    const itensGestao = acompanhamentoMensal.filter(i => i.categoria === 'Gestão');
    const itensFinanceiro = acompanhamentoMensal.filter(i => i.categoria === 'Financeiro');

    const renderCategory = (title: string, items: ItemAcompanhamento[]) => {
        if (items.length === 0) return null;
        return (
            <div className="mb-6">
                <div className="bg-slate-200 border border-black font-bold text-black p-1 mb-2 text-sm text-center uppercase">
                    {title}
                </div>
                <table className="w-full text-xs font-serif border-collapse border border-black">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border border-black p-1 text-left w-3/5">Pergunta</th>
                            <th className="border border-black p-1 text-center w-1/5">Resposta</th>
                            <th className="border border-black p-1 text-left w-1/5">Observação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id || index}>
                                <td className="border border-black p-1 font-medium">{item.pergunta}</td>
                                <td className="border border-black p-1 text-center font-bold">
                                    {item.resposta || '-'}
                                </td>
                                <td className="border border-black p-1 text-slate-700 italic">
                                    {item.observacao || ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="print-only" style={{ padding: '0px', width: '210mm', minHeight: '297mm', background: 'white' }}>
            {/* Header */}
            <div className="text-center font-serif text-black mb-6">
                <div className="flex justify-center mb-2 flex-col items-center">
                    <img src="https://i.imgur.com/K1Y97fL.png" alt="Brasão do Município" className="h-16 w-auto grayscale" />
                </div>
                <h1 className="text-sm font-bold uppercase leading-tight">Estado do Maranhão</h1>
                <h2 className="text-sm font-bold uppercase leading-tight">Prefeitura Municipal de Buriticupu</h2>
                <h3 className="text-sm font-bold uppercase leading-tight">Secretaria Municipal de Educação</h3>
                <div className="mt-4 border-b-2 border-black pb-2">
                    <h4 className="text-lg font-black uppercase tracking-wider">Monitoramento Mensal</h4>
                    <p className="text-sm font-bold">Checklist de Verificação - {(new Date()).toLocaleDateString('pt-BR')}</p>
                </div>
            </div>

            {/* School Info Header */}
            <div className="bg-white border-2 border-black p-2 mb-6 font-serif text-sm">
                <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-bold">Unidade Escolar:</span> {escola.nome}</div>
                    <div><span className="font-bold">Código INEP:</span> N/A</div>
                    <div className="col-span-2"><span className="font-bold">Endereço/Polo:</span> {escola.localizacao}</div>
                </div>
            </div>

            {/* Checklist items */}
            {renderCategory('Gestão Escolar e Pedagógica', itensGestao)}
            {renderCategory('Gestão Financeira e Administrativa', itensFinanceiro)}

            {/* Signatures */}
            <div className="mt-16 grid grid-cols-2 gap-12 text-center font-serif text-sm px-8" style={{ breakInside: 'avoid' }}>
                <div>
                    <div className="border-t border-black pt-2 w-full mx-auto">
                        <span className="font-bold block">GESTOR(A) ESCOLAR</span>
                        <span className="text-xs">Assinatura / Carimbo</span>
                    </div>
                </div>
                <div>
                    <div className="border-t border-black pt-2 w-full mx-auto">
                        <span className="font-bold block">COORDENADOR(A) REGIONAL</span>
                        <span className="text-xs">Assinatura / Carimbo</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
