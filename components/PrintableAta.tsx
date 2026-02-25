import React from 'react';
import { createPortal } from 'react-dom';

interface PrintableAtaProps {
    reuniao: any;
}

export const PrintableAta: React.FC<PrintableAtaProps> = ({ reuniao }) => {
    if (!reuniao) return null;

    const currentYear = new Date().getFullYear();
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Format the date properly for display
    let formattedDate = reuniao.dataReuniao;
    if (formattedDate && formattedDate.includes('-')) {
        const parts = formattedDate.split('-');
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return createPortal(
        <div id="print-ata" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

            {/* ====== INSTITUTIONAL HEADER ====== */}
            <div className="text-center mb-6 pb-4" style={{ borderBottom: '2pt solid #0f172a' }}>
                <p style={{ fontSize: '10pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '2pt' }}>
                    ESTADO DO MARANHÃO
                </p>
                <p style={{ fontSize: '12pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '4pt' }}>
                    PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
                </p>
                <p style={{ fontSize: '10pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '10pt' }}>
                    SECRETARIA MUNICIPAL DE EDUCAÇÃO
                </p>
                <div style={{ width: '80pt', height: '2pt', background: '#f97316', margin: '0 auto 8pt' }} />
                <h1 style={{ fontSize: '18pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 4pt' }}>
                    ATA DE REUNIÃO
                </h1>
            </div>

            {/* ====== IDENTIFICATION BLOCK ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '16pt' }}>
                <div style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '6pt 12pt', marginBottom: '0' }}>
                    Identificação
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '20%', background: '#f8fafc' }}>
                                Pauta
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '11pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                                {reuniao.pauta}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                                Data
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', color: '#334155' }}>
                                {formattedDate}
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '20%', background: '#f8fafc' }}>
                                Horário
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', fontWeight: 600, color: '#334155' }}>
                                {reuniao.horaInicio || '--:--'} às {reuniao.horaFim || '--:--'}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                                Local
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', color: '#334155' }} colSpan={3}>
                                {reuniao.local || 'Não informado'}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                                Tipo
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', color: '#334155', textTransform: 'uppercase' }}>
                                {reuniao.tipo}
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                                Convocante
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', fontWeight: 600, color: '#334155' }}>
                                {reuniao.responsavel}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ====== RECORD / TEXT ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '16pt' }}>
                <div style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '6pt 12pt', marginBottom: '0' }}>
                    Relato/Registro da Reunião
                </div>
                <div style={{ padding: '12pt', border: '0.5pt solid #e2e8f0', minHeight: '120pt', whiteSpace: 'pre-wrap', fontSize: '10pt', lineHeight: '1.6', color: '#334155' }}>
                    {reuniao.registro || '(Nenhum relato detalhado registrado para esta reunião)'}
                </div>
            </div>

            {/* ====== ENCAMINHAMENTOS ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '16pt' }}>
                <div style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '6pt 12pt', marginBottom: '0' }}>
                    Encaminhamentos e Decisões
                </div>
                <div style={{ padding: '12pt', border: '0.5pt solid #e2e8f0', minHeight: '60pt', whiteSpace: 'pre-wrap', fontSize: '10pt', lineHeight: '1.6', color: '#334155' }}>
                    {reuniao.encaminhamentos || '(Nenhum encaminhamento ou decisão registrado)'}
                </div>
            </div>

            {/* ====== PARTICIPANTES ====== */}
            {reuniao.participantes && reuniao.participantes.length > 0 && (
                <div className="print-avoid-break" style={{ marginBottom: '24pt' }}>
                    <div style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '6pt 12pt', marginBottom: '0' }}>
                        Lista de Presença ({reuniao.participantes.length})
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '6pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'left', width: '50%' }}>
                                    Nome do Participante
                                </th>
                                <th style={{ padding: '6pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'center', width: '50%' }}>
                                    Assinatura
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {reuniao.participantes.map((p: string, i: number) => (
                                <tr key={i}>
                                    <td style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', color: '#334155' }}>
                                        {p}
                                    </td>
                                    <td style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0' }}>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ====== SIGNATURES MAIN RESPONSIBLE ====== */}
            <div className="print-avoid-break" style={{ marginTop: '40pt', textAlign: 'center' }}>
                <div style={{ borderTop: '1.5pt solid #0f172a', width: '50%', margin: '0 auto 6pt' }} />
                <p style={{ fontSize: '11pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                    {reuniao.responsavel}
                </p>
                <p style={{ fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                    RESPONSÁVEL / CONVOCANTE
                </p>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ marginTop: '40pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '7pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '8pt' }}>
                <span>SIGAR • Documento Gerado em {emissionDate} às {emissionTime}</span>
                <span>Secretaria Municipal de Educação</span>
            </div>
        </div>,
        document.body
    );
};
