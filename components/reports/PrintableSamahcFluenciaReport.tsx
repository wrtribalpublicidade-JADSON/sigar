import React from 'react';
import { createPortal } from 'react-dom';
import { RegistroFluenciaSAMAHC } from '../../types';

interface PrintableSamahcFluenciaReportProps {
    data: {
        registro: RegistroFluenciaSAMAHC;
        escolaNome: string;
    }[];
    filtroPolo: string;
    filtroRegional: string;
}

export const PrintableSamahcFluenciaReport: React.FC<PrintableSamahcFluenciaReportProps> = ({
    data,
    filtroPolo,
    filtroRegional,
}) => {
    const currentYear = new Date().getFullYear();
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return createPortal(
        <div id="print-samahc-report" className="hidden print:block bg-white text-slate-900 px-8 py-4" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

            {/* ====== INSTITUTIONAL HEADER ====== */}
            <div className="text-center mb-6 pb-4" style={{ borderBottom: '2pt solid #0f172a' }}>
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
                <h1 style={{ fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 4pt' }}>
                    Detalhamento de Fluência Leitora - SAMAHC
                </h1>
                <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Relatório Individual de Desempenho - {currentYear}
                </p>
            </div>

            {/* ====== EMISSION INFO ====== */}
            <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8pt 12pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '12pt' }}>
                <div style={{ display: 'flex', gap: '20pt' }}>
                    <div>
                        <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                            Polo
                        </p>
                        <p style={{ fontSize: '9pt', fontWeight: 900, color: '#0f172a' }}>
                            {filtroPolo}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                            Regional
                        </p>
                        <p style={{ fontSize: '9pt', fontWeight: 900, color: '#0f172a' }}>
                            {filtroRegional}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                            Total de Registros
                        </p>
                        <p style={{ fontSize: '9pt', fontWeight: 900, color: '#f97316' }}>
                            {data.length}
                        </p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                        Data de Emissão
                    </p>
                    <p style={{ fontSize: '8pt', fontWeight: 600, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                        {emissionDate} às {emissionTime}
                    </p>
                </div>
            </div>

            {/* ====== TABLE ====== */}
            <div style={{ marginBottom: '20pt' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#0f172a' }}>
                            <th style={{ padding: '6pt 8pt', border: '0.5pt solid #334155', fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', color: '#fff', textAlign: 'left' }}>Estudante</th>
                            <th style={{ padding: '6pt 4pt', border: '0.5pt solid #334155', fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', color: '#fff', textAlign: 'left' }}>Unidade Escolar</th>
                            <th style={{ padding: '6pt 4pt', border: '0.5pt solid #334155', fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', color: '#fff', textAlign: 'center', width: '8%' }}>Série</th>
                            <th style={{ padding: '6pt 4pt', border: '0.5pt solid #334155', fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', color: '#fff', textAlign: 'center', width: '8%' }}>Turno</th>
                            <th style={{ padding: '6pt 4pt', border: '0.5pt solid #334155', fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', color: '#fff', textAlign: 'center', width: '10%' }}>Avaliação</th>
                            <th style={{ padding: '6pt 4pt', border: '0.5pt solid #334155', fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', color: '#fff', textAlign: 'center', width: '15%' }}>Nível Desempenho</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={{ padding: '4pt 8pt', border: '0.5pt solid #e2e8f0', fontSize: '7.5pt', fontWeight: 800, color: '#0f172a' }}>
                                    {item.registro.estudanteNome}
                                </td>
                                <td style={{ padding: '4pt 4pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 600, color: '#475569' }}>
                                    {item.escolaNome}
                                </td>
                                <td style={{ padding: '4pt 4pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
                                    {item.registro.anoSerie}
                                </td>
                                <td style={{ padding: '4pt 4pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 600, color: '#64748b', textAlign: 'center' }}>
                                    {item.registro.turno}
                                </td>
                                <td style={{ padding: '4pt 4pt', border: '0.5pt solid #e2e8f0', fontSize: '6.5pt', fontWeight: 800, color: '#f97316', textAlign: 'center' }}>
                                    {item.registro.tipoAvaliacao}
                                </td>
                                <td style={{ padding: '4pt 4pt', border: '0.5pt solid #e2e8f0', fontSize: '7.5pt', fontWeight: 900, color: '#0f172a', textAlign: 'center' }}>
                                    {item.registro.nivelDesempenho}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ marginTop: '20pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '8pt' }}>
                <span>SIGAR • Sistema Integrado de Gestão</span>
                <span>Relatório SAMAHC • {currentYear}</span>
                <span>Página 1</span>
            </div>
        </div>,
        document.body
    );
};
