import React from 'react';
import { createPortal } from 'react-dom';
import { Coordenador, Escola } from '../types';

interface MappedData {
    coordenador: Coordenador;
    escola: Escola;
    temChecklist: boolean;
    totalTurmas: number;
    totalRH: number;
    planoAcao: any[];
    avaliacoesSmart: { status: string; faltam: string[] }[];
    temAcaoAdequada: boolean;
    totalAlunos: number;
    temIndicadores: boolean;
    totalVisitas: number;
    totalAtividades: number;
    cumprimentoPerm: number;
    pontos: number;
}

interface PrintableCoordinatorReportProps {
    data: MappedData[];
    filtroCoordenador: string;
    filtroRegional: string;
}

export const PrintableCoordinatorReport: React.FC<PrintableCoordinatorReportProps> = ({
    data,
    filtroCoordenador,
    filtroRegional,
}) => {
    const currentYear = new Date().getFullYear();
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const totalEscolas = data.length;
    const mediaCumprimento = data.length > 0 ? data.reduce((acc, d) => acc + d.cumprimentoPerm, 0) / data.length : 0;

    const thStyle: React.CSSProperties = {
        padding: '4pt 6pt',
        border: '0.5pt solid #334155',
        fontSize: '6.5pt',
        fontWeight: 800,
        textTransform: 'uppercase',
        color: '#fff',
        background: '#0f172a',
        textAlign: 'left',
        letterSpacing: '0.05em',
    };

    const tdStyle: React.CSSProperties = {
        padding: '3pt 6pt',
        border: '0.5pt solid #e2e8f0',
        fontSize: '7.5pt',
        fontWeight: 600,
        color: '#334155',
        verticalAlign: 'middle',
    };

    return createPortal(
        <div id="print-coordinator-report" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: '8pt' }}>

            {/* ====== INSTITUTIONAL HEADER ====== */}
            <div className="text-center mb-3 pb-3" style={{ borderBottom: '2pt solid #0f172a' }}>
                <p style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '1pt' }}>
                    ESTADO DO MARANHÃO
                </p>
                <p style={{ fontSize: '9pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '1pt' }}>
                    PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
                </p>
                <p style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '8pt' }}>
                    SECRETARIA MUNICIPAL DE EDUCAÇÃO
                </p>
                <div style={{ width: '50pt', height: '1.5pt', background: '#f97316', margin: '0 auto 5pt' }} />
                <h1 style={{ fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 3pt' }}>
                    Relatório de Atividades do Coordenador Regional
                </h1>
                <p style={{ fontSize: '7pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Acompanhamento de Unidades Escolares — {currentYear}
                </p>
            </div>

            {/* ====== EMISSION INFO ====== */}
            <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4pt 8pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '8pt' }}>
                <div style={{ display: 'flex', gap: '20pt' }}>
                    <div>
                        <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1pt' }}>Coordenador</p>
                        <p style={{ fontSize: '9pt', fontWeight: 900, color: '#0f172a' }}>{filtroCoordenador}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1pt' }}>Regional</p>
                        <p style={{ fontSize: '9pt', fontWeight: 900, color: '#f97316' }}>{filtroRegional}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1pt' }}>Emissão</p>
                    <p style={{ fontSize: '8pt', fontWeight: 600, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                        {emissionDate} às {emissionTime}
                    </p>
                </div>
            </div>

            {/* ====== SUMMARY STATISTICS ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '8pt', display: 'flex', gap: '6pt' }}>
                <div style={{ flex: 1, padding: '6pt', border: '0.5pt solid #e2e8f0', background: '#0f172a' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1pt' }}>Escolas Monitoradas</p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, color: '#fff' }}>{totalEscolas}</p>
                </div>
                <div style={{ flex: 1, padding: '6pt', border: '0.5pt solid #e2e8f0', background: '#fff7ed' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', marginBottom: '1pt' }}>Média de Cumprimento</p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, color: '#c2410c' }}>{mediaCumprimento.toFixed(1)}%</p>
                </div>
                <div style={{ flex: 1, padding: '6pt', border: '0.5pt solid #e2e8f0', background: '#ecfdf5' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#047857', textTransform: 'uppercase', marginBottom: '1pt' }}>Total de Visitas</p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, color: '#065f46' }}>{data.reduce((acc, d) => acc + d.totalVisitas, 0)}</p>
                </div>
            </div>

            {/* ====== MAIN TABLE ====== */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15pt' }}>
                <thead>
                    <tr>
                        <th style={{ ...thStyle, width: '22%' }}>Escola / Coordenador</th>
                        <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>Ativ.</th>
                        <th style={{ ...thStyle, width: '9%', textAlign: 'center' }}>Checklist</th>
                        <th style={{ ...thStyle, width: '7%', textAlign: 'center' }}>Turmas</th>
                        <th style={{ ...thStyle, width: '7%', textAlign: 'center' }}>RH</th>
                        <th style={{ ...thStyle, width: '15%', textAlign: 'center' }}>Plano de Ação</th>
                        <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>Alunos</th>
                        <th style={{ ...thStyle, width: '9%', textAlign: 'center' }}>Indicadores</th>
                        <th style={{ ...thStyle, width: '7%', textAlign: 'center' }}>Visitas</th>
                        <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>% Cump.</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((d, idx) => (
                        <tr key={`${d.coordenador.id}-${d.escola.id}`} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                            <td style={tdStyle}>
                                <div style={{ fontWeight: 800, color: '#0f172a' }}>{d.escola.nome}</div>
                                <div style={{ fontSize: '6.5pt', color: '#64748b', textTransform: 'uppercase' }}>{d.coordenador.nome}</div>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <span style={{ color: d.totalAtividades > 0 ? '#059669' : '#94a3b8' }}>{d.totalAtividades}</span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <span style={{ color: d.temChecklist ? '#059669' : '#e11d48', fontWeight: 900 }}>
                                    {d.temChecklist ? 'OK' : 'PEND'}
                                </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{d.totalTurmas || '-'}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{d.totalRH || '-'}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <div style={{ fontSize: '6.5pt' }}>
                                    <div style={{ fontWeight: 800 }}>{d.planoAcao.length} Ações</div>
                                    <div style={{ color: d.temAcaoAdequada ? '#059669' : '#d97706', fontWeight: 800 }}>
                                        {d.temAcaoAdequada ? 'SMART OK' : 'INCOMPLETO'}
                                    </div>
                                </div>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{d.totalAlunos || '-'}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <span style={{ color: d.temIndicadores ? '#059669' : '#e11d48', fontWeight: 900 }}>
                                    {d.temIndicadores ? 'OK' : 'PEND'}
                                </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{d.totalVisitas || '-'}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <div style={{ 
                                    fontWeight: 900, 
                                    color: d.cumprimentoPerm >= 80 ? '#059669' : d.cumprimentoPerm >= 50 ? '#d97706' : '#e11d48'
                                }}>
                                    {d.cumprimentoPerm.toFixed(0)}%
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ====== FOOTER SIGNATURES ====== */}
            <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '30pt', pageBreakInside: 'avoid' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Responsável pelo Acompanhamento
                    </p>
                    <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                        SME - HUMBERTO DE CAMPOS
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Secretaria Municipal de Educação
                    </p>
                    <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                        VISTO / HOMOLOGADO
                    </p>
                </div>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ marginTop: '20pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '5pt' }}>
                <span>SIGAR • Sistema Integrado de Gestão</span>
                <span>Relatório Consolidado — Coordenação Regional • {currentYear}</span>
            </div>
        </div>,
        document.body
    );
};
