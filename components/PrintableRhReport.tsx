import React from 'react';
import { Escola, Coordenador, RecursoHumano } from '../types';

interface PrintableRhReportProps {
    escola: Escola;
    coordenador?: Coordenador;
}

export const PrintableRhReport: React.FC<PrintableRhReportProps> = ({ escola, coordenador }) => {
    const currentYear = new Date().getFullYear();
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Agrupar por função ou vínculo se necessário, mas por enquanto lista simples
    const servidores = escola.recursosHumanos || [];

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
                    Relatório de Recursos Humanos
                </h1>
                <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Quadro de Servidores da Unidade Escolar
                </p>
            </div>

            {/* ====== EMISSION INFO ====== */}
            <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6pt 10pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '10pt' }}>
                <div>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                        Unidade Escolar
                    </p>
                    <p style={{ fontSize: '11pt', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                        {escola.nome}
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

            {/* ====== SUMMARY STATISTICS ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '14pt', display: 'flex', gap: '10pt' }}>
                <div style={{ flex: 1, padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#f1f5f9' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2pt' }}>Total de Servidores</p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, color: '#0f172a' }}>{servidores.length}</p>
                </div>
                <div style={{ flex: 1, padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#ecfdf5' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#047857', textTransform: 'uppercase', marginBottom: '2pt' }}>Efetivos</p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, color: '#065f46' }}>{servidores.filter(s => s.tipoVinculo === 'Efetivo').length}</p>
                </div>
                <div style={{ flex: 1, padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#fff7ed' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', marginBottom: '2pt' }}>Contratados</p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, color: '#9a3412' }}>{servidores.filter(s => s.tipoVinculo === 'Contratado').length}</p>
                </div>
            </div>

            {/* ====== LIST OF SERVERS ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
                <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                    Relação Nominal de Servidores
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'left' }}>Nome do Servidor</th>
                            <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'left' }}>Função / Cargo</th>
                            <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'center', width: '15%' }}>Vínculo</th>
                            <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'center', width: '15%' }}>Data Nomeação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {servidores.sort((a, b) => a.nome.localeCompare(b.nome)).map((servidor, index) => (
                            <tr key={servidor.id}>
                                <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#334155' }}>
                                    {servidor.nome}
                                    <div style={{ fontSize: '7pt', fontWeight: 400, color: '#64748b', marginTop: '1pt' }}>{servidor.email}</div>
                                </td>
                                <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', color: '#334155' }}>
                                    <div style={{ fontWeight: 600 }}>{servidor.funcao}</div>
                                    {servidor.etapaAtuacao && <div style={{ fontSize: '7pt', color: '#64748b' }}>{servidor.etapaAtuacao} {servidor.componenteCurricular ? `• ${servidor.componenteCurricular}` : ''}</div>}
                                </td>
                                <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 600, color: '#475569', textAlign: 'center', textTransform: 'uppercase' }}>
                                    {servidor.tipoVinculo}
                                </td>
                                <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', color: '#475569', textAlign: 'center' }}>
                                    {servidor.dataNomeacao ? new Date(servidor.dataNomeacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                                </td>
                            </tr>
                        ))}
                        {servidores.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: '10pt', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '9pt' }}>
                                    Nenhum servidor cadastrado nesta unidade escolar.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ====== SIGNATURES ====== */}
            <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '30pt', pageBreakInside: 'avoid' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        {escola.gestor || 'Gestor(a) Escolar'}
                    </p>
                    <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                        GESTOR(A) ESCOLAR
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Secretaria Municipal de Educação
                    </p>
                    <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                        VISTO / RECEBIDO
                    </p>
                </div>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ marginTop: '30pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '6pt' }}>
                <span>SIGAR • Sistema Integrado de Gestão</span>
                <span>{escola.nome}</span>
            </div>
        </div>
    );
};
