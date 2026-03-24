import React from 'react';
import { createPortal } from 'react-dom';

interface PrintableMerendaReportProps {
    entrega: any;
    responsavel?: string;
}

export const PrintableMerendaReport: React.FC<PrintableMerendaReportProps> = ({ entrega, responsavel = 'Funcionário' }) => {
    if (!entrega) return null;

    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // The name of the destiny school is expected to be passed somehow, or we use a fallback if we expand it later.
    const destiniesName = entrega.escolaNome || 'Escola Destino';

    return createPortal(
        <div id="print-merenda-report" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

            {/* ====== INSTITUTIONAL HEADER ====== */}
            <div className="text-center mb-3 pb-3" style={{ borderBottom: '2pt solid #0f172a' }}>
                <p style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '2pt' }}>
                    ESTADO DO MARANHÃO
                </p>
                <p style={{ fontSize: '10pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '2pt' }}>
                    PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
                </p>
                <p style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '10pt' }}>
                    SECRETARIA MUNICIPAL DE EDUCAÇÃO - SETOR DE ALMOXARIFADO E MERENDA
                </p>
                <div style={{ width: '60pt', height: '1.5pt', background: '#f97316', margin: '0 auto 6pt' }} />
                <h1 style={{ fontSize: '16pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 4pt' }}>
                    Guia de Remessa de Merenda Escolar
                </h1>
                <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Documento de Despacho e Entrega de Itens
                </p>
            </div>

            {/* ====== EMISSION INFO ====== */}
            <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6pt 10pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '10pt' }}>
                <div>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                        Destino (Unidade Escolar)
                    </p>
                    <p style={{ fontSize: '11pt', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
                        {destiniesName}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                        Emissão do Sistema
                    </p>
                    <p style={{ fontSize: '9pt', fontWeight: 600, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                        {emissionDate} às {emissionTime}
                    </p>
                </div>
            </div>

            {/* ====== METADATA ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '14pt', display: 'flex', gap: '10pt' }}>
                <div style={{ flex: 1, padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#f1f5f9' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2pt' }}>Status da Expedição</p>
                    <p style={{ fontSize: '12pt', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>{entrega.status}</p>
                </div>
                <div style={{ flex: 1, padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#fff7ed' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', marginBottom: '2pt' }}>Data de Saída</p>
                    <p style={{ fontSize: '12pt', fontWeight: 900, color: '#9a3412', textTransform: 'uppercase' }}>{new Date(entrega.data).toLocaleDateString('pt-BR')}</p>
                </div>
            </div>

            {/* ====== LIST OF ITEMS ====== */}
            <div style={{ marginBottom: '10pt' }}>
                <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                    Relação de Itens Despachados
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'left', width: '60%' }}>Produto / Item</th>
                            <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'center', width: '20%' }}>Und.</th>
                            <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'center', width: '20%' }}>Quantidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entrega.merenda_entrega_itens && entrega.merenda_entrega_itens.map((item: any, index: number) => (
                            <tr key={item.item_id || index}>
                                <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#334155' }}>
                                    {item.merenda_itens?.nome}
                                </td>
                                <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 600, color: '#475569', textAlign: 'center', textTransform: 'uppercase' }}>
                                    {item.merenda_itens?.unidade}
                                </td>
                                <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', fontWeight: 900, color: '#0f172a', textAlign: 'center' }}>
                                    {item.quantidade}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {entrega.observacoes && (
                <div style={{ marginTop: '10pt', padding: '10pt', border: '1pt dashed #cbd5e1', background: '#f8fafc' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4pt' }}>Observações da Remessa</p>
                    <p style={{ fontSize: '9pt', color: '#334155' }}>{entrega.observacoes}</p>
                </div>
            )}

            {/* ====== SIGNATURES ====== */}
            <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '45pt', pageBreakInside: 'avoid' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        {responsavel}
                    </p>
                    <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                        EMISSOR DO ESTOQUE
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Gestor(a) Geral Escolar
                    </p>
                    <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                        RECEBEDOR (Unidade Escolar)
                    </p>
                </div>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ marginTop: '30pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '6pt' }}>
                <span>SIGAR • Sistema Integrado de Gestão</span>
                <span>Id de Transação: {entrega.id}</span>
            </div>
        </div>,
        document.body
    );
};
