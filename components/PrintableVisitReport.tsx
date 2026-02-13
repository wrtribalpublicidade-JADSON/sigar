import React from 'react';
import { Visita, Escola, Coordenador, TopicoPauta, EncaminhamentoVisita } from '../types';

interface PrintableVisitReportProps {
    visita: Visita;
    escola?: Escola;
    coordenador?: Coordenador;
}

export const PrintableVisitReport: React.FC<PrintableVisitReportProps> = ({ visita, escola, coordenador }) => {
    const currentYear = new Date().getFullYear();
    const protocolNumber = visita.id.split('-')[0].toUpperCase();
    const visitDate = new Date(visita.data + 'T12:00:00');
    const formattedDate = visitDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div id="print-report" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

            {/* ====== INSTITUTIONAL HEADER ====== */}
            <div className="text-center mb-3 pb-3" style={{ borderBottom: '2pt solid #0f172a' }}>
                <p style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '2pt' }}>
                    ESTADO DO MARANHÃO
                </p>
                <p style={{ fontSize: '10pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '2pt' }}>
                    PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
                </p>
                <p style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '10pt' }}>
                    SECRETARIA MUNICIPAL DE EDUCAÇÃO
                </p>
                <div style={{ width: '60pt', height: '1.5pt', background: '#f97316', margin: '0 auto 6pt' }} />
                <h1 style={{ fontSize: '16pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 4pt' }}>
                    Relatório de Visita Técnica
                </h1>
                <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Superintendência de Ensino • Coordenação Pedagógica Regional
                </p>
            </div>

            {/* ====== PROTOCOL & EMISSION ====== */}
            <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6pt 10pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '10pt' }}>
                <div>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                        Identificação do Documento
                    </p>
                    <p style={{ fontSize: '13pt', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                        RELATÓRIO Nº {protocolNumber}/{currentYear}
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

            {/* ====== IDENTIFICATION BLOCK ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '14pt' }}>
                <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt', marginBottom: '0' }}>
                    Dados de Identificação
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '22%', background: '#f8fafc' }}>
                                Unidade Escolar
                            </td>
                            <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                                {escola?.nome || visita.escolaNome}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                                Localização
                            </td>
                            <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', color: '#334155' }}>
                                {escola?.localizacao || 'Sede Municipal'}
                            </td>
                            <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '18%', background: '#f8fafc' }}>
                                Gestor(a)
                            </td>
                            <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                                {escola?.gestor || 'N/A'}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                                Data da Visita
                            </td>
                            <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                                {formattedDate}
                            </td>
                            <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                                Natureza
                            </td>
                            <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>
                                {visita.tipo}
                            </td>
                        </tr>
                        {coordenador && (
                            <tr>
                                <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                                    Coordenador(a)
                                </td>
                                <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }} colSpan={3}>
                                    {coordenador.nome} — Região: {coordenador.regiao}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ====== OBSERVATION MATRIX ====== */}
            {visita.foco && visita.foco.length > 0 && (
                <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
                    <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                        Matriz de Observação
                    </div>
                    <div style={{ padding: '8pt 10pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', display: 'flex', flexWrap: 'wrap', gap: '4pt' }}>
                        {visita.foco.map(item => (
                            <span key={item} style={{ padding: '3pt 8pt', border: '1pt solid #0f172a', fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a' }}>
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ====== AGENDA ITEMS (PAUTA) ====== */}
            {visita.topicosPauta && visita.topicosPauta.length > 0 && (
                <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
                    <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                        Tópicos de Pauta e Deliberações
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '6%', textAlign: 'center' }}>
                                    Nº
                                </th>
                                <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'left' }}>
                                    Descrição do Assunto Abordado
                                </th>
                                <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '18%', textAlign: 'center' }}>
                                    Eixo Temático
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visita.topicosPauta.map((t: TopicoPauta, index: number) => (
                                <tr key={t.id}>
                                    <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
                                        {String(index + 1).padStart(2, '0')}
                                    </td>
                                    <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', color: '#334155', lineHeight: '1.5' }}>
                                        {t.descricao}
                                    </td>
                                    <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>
                                        {t.categoria}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ====== DIRECTIVES (ENCAMINHAMENTOS) ====== */}
            {visita.encaminhamentosRegistrados && visita.encaminhamentosRegistrados.length > 0 && (
                <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
                    <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                        Encaminhamentos, Diretrizes e Prazos
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '6%', textAlign: 'center' }}>
                                    Nº
                                </th>
                                <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'left' }}>
                                    Ação / Diretriz
                                </th>
                                <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '18%', textAlign: 'center' }}>
                                    Responsável
                                </th>
                                <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '14%', textAlign: 'center' }}>
                                    Prazo
                                </th>
                                <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '12%', textAlign: 'center' }}>
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visita.encaminhamentosRegistrados.map((enc: EncaminhamentoVisita, index: number) => (
                                <tr key={enc.id}>
                                    <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
                                        {String(index + 1).padStart(2, '0')}
                                    </td>
                                    <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', color: '#334155', lineHeight: '1.5' }}>
                                        {enc.descricao}
                                    </td>
                                    <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>
                                        {enc.responsavel}
                                    </td>
                                    <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 600, color: '#334155', textAlign: 'center' }}>
                                        {new Date(enc.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </td>
                                    <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>
                                        {enc.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ====== QUALITATIVE CONCLUSIONS ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
                <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                    Considerações Qualitativas e Conclusão
                </div>
                <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9.5pt', color: '#334155', lineHeight: '1.7', minHeight: '60pt', fontStyle: 'italic' }}>
                    {visita.encaminhamentos || 'Sem observações qualitativas complementares para este registro oficial.'}
                </div>
            </div>

            {/* ====== SIGNATURES ====== */}
            <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '20pt' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '100%', marginBottom: '6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        {escola?.gestor || 'Gestor(a) Geral'}
                    </p>
                    <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                        GESTOR(A) GERAL
                    </p>
                    <p style={{ fontSize: '7pt', color: '#94a3b8', fontStyle: 'italic' }}>
                        Assinatura e Carimbo
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '100%', marginBottom: '6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        {coordenador?.nome || 'Coordenador(a) Regional'}
                    </p>
                    <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                        COORDENADOR(A) PEDAGÓGICO(A) REGIONAL
                    </p>
                    <p style={{ fontSize: '7.5pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', marginBottom: '2pt' }}>
                        {coordenador?.regiao || 'Regional Responsável'}
                    </p>
                    <p style={{ fontSize: '7pt', color: '#94a3b8', fontStyle: 'italic' }}>
                        Assinatura e Carimbo
                    </p>
                </div>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ marginTop: '30pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '6pt' }}>
                <span>SIGAR • Sistema Integrado de Gestão e Acompanhamento Regional</span>
                <span>Secretaria Municipal de Educação • Humberto de Campos/MA</span>
            </div>
        </div>
    );
};
