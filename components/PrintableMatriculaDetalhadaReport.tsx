import React from 'react';
import { createPortal } from 'react-dom';
import { Escola } from '../types';

interface PrintableMatriculaDetalhadaReportProps {
    escolas: Escola[];
    filtroLocalizacao: string;
    filtroTurno: 'Todos' | 'Integral' | 'Manhã' | 'Tarde';
}

const GRADES = [
    { key: 'creche2', label: 'Creche II', segment: 'infantil', group: 'Ed. Infantil' },
    { key: 'creche3', label: 'Creche III', segment: 'infantil', group: 'Ed. Infantil' },
    { key: 'pre1', label: 'Pré I', segment: 'infantil', group: 'Ed. Infantil' },
    { key: 'pre2', label: 'Pré II', segment: 'infantil', group: 'Ed. Infantil' },
    { key: 'ano1', label: '1º Ano', segment: 'fundamental', group: 'Anos Iniciais' },
    { key: 'ano2', label: '2º Ano', segment: 'fundamental', group: 'Anos Iniciais' },
    { key: 'ano3', label: '3º Ano', segment: 'fundamental', group: 'Anos Iniciais' },
    { key: 'ano4', label: '4º Ano', segment: 'fundamental', group: 'Anos Iniciais' },
    { key: 'ano5', label: '5º Ano', segment: 'fundamental', group: 'Anos Iniciais' },
    { key: 'ano6', label: '6º Ano', segment: 'fundamental', group: 'Anos Finais' },
    { key: 'ano7', label: '7º Ano', segment: 'fundamental', group: 'Anos Finais' },
    { key: 'ano8', label: '8º Ano', segment: 'fundamental', group: 'Anos Finais' },
    { key: 'ano9', label: '9º Ano', segment: 'fundamental', group: 'Anos Finais' },
    { key: 'eja', label: 'EJA', segment: 'fundamental', group: 'EJA' },
] as const;

const getAlunosByTurno = (node: any, turno: string): number => {
    if (!node?.alunos) return 0;
    if (turno === 'Todos') return (node.alunos.integral || 0) + (node.alunos.manha || 0) + (node.alunos.tarde || 0);
    if (turno === 'Integral') return node.alunos.integral || 0;
    if (turno === 'Manhã') return node.alunos.manha || 0;
    if (turno === 'Tarde') return node.alunos.tarde || 0;
    return 0;
};

export const PrintableMatriculaDetalhadaReport: React.FC<PrintableMatriculaDetalhadaReportProps> = ({
    escolas,
    filtroLocalizacao,
    filtroTurno,
}) => {
    const currentYear = new Date().getFullYear();
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const filteredEscolas = escolas
        .filter(e => filtroLocalizacao === 'Todas' || e.localizacao === filtroLocalizacao)
        .sort((a, b) => a.nome.localeCompare(b.nome));

    // Compute totals per grade
    const gradeTotals: Record<string, number> = {};
    let grandTotal = 0;
    GRADES.forEach(g => {
        gradeTotals[g.key] = 0;
        filteredEscolas.forEach(e => {
            const det = e.dadosEducacionais?.matriculaDetalhada as any;
            if (!det) return;
            const node = det?.[g.segment]?.[g.key];
            const val = getAlunosByTurno(node, filtroTurno);
            gradeTotals[g.key] += val;
            grandTotal += val;
        });
    });

    // Group summary
    const groupTotals = {
        infantil: (gradeTotals['creche2'] || 0) + (gradeTotals['creche3'] || 0) + (gradeTotals['pre1'] || 0) + (gradeTotals['pre2'] || 0),
        iniciais: (gradeTotals['ano1'] || 0) + (gradeTotals['ano2'] || 0) + (gradeTotals['ano3'] || 0) + (gradeTotals['ano4'] || 0) + (gradeTotals['ano5'] || 0),
        finais: (gradeTotals['ano6'] || 0) + (gradeTotals['ano7'] || 0) + (gradeTotals['ano8'] || 0) + (gradeTotals['ano9'] || 0),
        eja: gradeTotals['eja'] || 0,
    };

    const thStyle: React.CSSProperties = {
        padding: '3pt 2pt',
        border: '0.5pt solid #334155',
        fontSize: '5.5pt',
        fontWeight: 800,
        textTransform: 'uppercase',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: '0.05em',
    };

    const tdStyle: React.CSSProperties = {
        padding: '2.5pt 2pt',
        border: '0.5pt solid #e2e8f0',
        fontSize: '7pt',
        textAlign: 'center',
        fontWeight: 600,
        color: '#334155',
    };

    return createPortal(
        <div id="print-matricula-detalhada-report" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: '8pt' }}>

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
                <div style={{ width: '50pt', height: '1.5pt', background: '#4f46e5', margin: '0 auto 5pt' }} />
                <h1 style={{ fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 3pt' }}>
                    Controle Detalhado de Matrículas por Ano/Série
                </h1>
                <p style={{ fontSize: '7pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Rede Municipal de Ensino — {currentYear}
                </p>
            </div>

            {/* ====== EMISSION INFO ====== */}
            <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4pt 8pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '8pt' }}>
                <div style={{ display: 'flex', gap: '20pt' }}>
                    <div>
                        <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1pt' }}>
                            Localização
                        </p>
                        <p style={{ fontSize: '9pt', fontWeight: 900, color: '#0f172a' }}>
                            {filtroLocalizacao}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1pt' }}>
                            Turno
                        </p>
                        <p style={{ fontSize: '9pt', fontWeight: 900, color: '#4f46e5' }}>
                            {filtroTurno}
                        </p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1pt' }}>
                        Emissão
                    </p>
                    <p style={{ fontSize: '8pt', fontWeight: 600, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                        {emissionDate} às {emissionTime}
                    </p>
                </div>
            </div>

            {/* ====== SUMMARY STATISTICS ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '8pt', display: 'flex', gap: '6pt' }}>
                <div style={{ flex: 1.5, padding: '6pt', border: '0.5pt solid #e2e8f0', background: '#0f172a' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1pt' }}>Total Geral</p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, color: '#fff' }}>{grandTotal.toLocaleString()}</p>
                </div>
                <div style={{ flex: 1, padding: '6pt', border: '0.5pt solid #e2e8f0', background: '#eef2ff' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', marginBottom: '1pt' }}>Ed. Infantil</p>
                    <p style={{ fontSize: '11pt', fontWeight: 900, color: '#3730a3' }}>{groupTotals.infantil}</p>
                </div>
                <div style={{ flex: 1, padding: '6pt', border: '0.5pt solid #e2e8f0', background: '#ecfdf5' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#047857', textTransform: 'uppercase', marginBottom: '1pt' }}>Anos Iniciais</p>
                    <p style={{ fontSize: '11pt', fontWeight: 900, color: '#065f46' }}>{groupTotals.iniciais}</p>
                </div>
                <div style={{ flex: 1, padding: '6pt', border: '0.5pt solid #e2e8f0', background: '#fff7ed' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', marginBottom: '1pt' }}>Anos Finais</p>
                    <p style={{ fontSize: '11pt', fontWeight: 900, color: '#9a3412' }}>{groupTotals.finais}</p>
                </div>
                <div style={{ flex: 1, padding: '6pt', border: '0.5pt solid #e2e8f0', background: '#f8fafc' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '1pt' }}>EJA</p>
                    <p style={{ fontSize: '11pt', fontWeight: 900, color: '#334155' }}>{groupTotals.eja}</p>
                </div>
            </div>

            {/* ====== TABLE ====== */}
            <div style={{ marginBottom: '10pt' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        {/* Group header row */}
                        <tr>
                            <th rowSpan={2} style={{ ...thStyle, background: '#0f172a', textAlign: 'left', padding: '4pt 6pt', minWidth: '140pt' }}>Unidade Escolar</th>
                            <th colSpan={4} style={{ ...thStyle, background: '#3730a3' }}>Educação Infantil</th>
                            <th colSpan={5} style={{ ...thStyle, background: '#047857' }}>Anos Iniciais</th>
                            <th colSpan={4} style={{ ...thStyle, background: '#c2410c' }}>Anos Finais</th>
                            <th style={{ ...thStyle, background: '#475569' }}>EJA</th>
                            <th rowSpan={2} style={{ ...thStyle, background: '#0f172a', fontSize: '6pt', width: '6%' }}>Total</th>
                        </tr>
                        {/* Grade names row */}
                        <tr>
                            {GRADES.map(g => {
                                const bg = g.group === 'Ed. Infantil' ? '#4338ca' :
                                    g.group === 'Anos Iniciais' ? '#059669' :
                                    g.group === 'Anos Finais' ? '#ea580c' : '#64748b';
                                return (
                                    <th key={g.key} style={{ ...thStyle, background: bg, fontSize: '5pt', whiteSpace: 'nowrap' }}>
                                        {g.label}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEscolas.map((escola, index) => {
                            const det = escola.dadosEducacionais?.matriculaDetalhada as any;
                            let rowTotal = 0;
                            const values = GRADES.map(g => {
                                const node = det?.[g.segment]?.[g.key];
                                const val = getAlunosByTurno(node, filtroTurno);
                                rowTotal += val;
                                return val;
                            });
                            return (
                                <tr key={escola.id} style={{ background: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td style={{ ...tdStyle, textAlign: 'left', padding: '3pt 6pt', fontSize: '7pt', fontWeight: 700 }}>
                                        {escola.nome}
                                        <div style={{ fontSize: '5.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{escola.localizacao}</div>
                                    </td>
                                    {values.map((val, i) => (
                                        <td key={GRADES[i].key} style={{
                                            ...tdStyle,
                                            color: val > 0 ? '#334155' : '#d1d5db',
                                            borderRight: (i === 3 || i === 8 || i === 12) ? '1pt solid #cbd5e1' : '0.5pt solid #e2e8f0',
                                        }}>
                                            {val || '-'}
                                        </td>
                                    ))}
                                    <td style={{
                                        ...tdStyle,
                                        fontWeight: 900,
                                        color: '#0f172a',
                                        background: index % 2 === 0 ? '#f1f5f9' : '#e2e8f0',
                                        fontSize: '8pt',
                                    }}>
                                        {rowTotal}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: '#0f172a' }}>
                            <td style={{ ...thStyle, textAlign: 'left', padding: '4pt 6pt', fontSize: '6.5pt', color: '#f8fafc' }}>
                                TOTAL DA REDE
                            </td>
                            {GRADES.map(g => (
                                <td key={g.key} style={{
                                    ...thStyle,
                                    background: '#0f172a',
                                    fontSize: '7pt',
                                    borderRight: (g.key === 'pre2' || g.key === 'ano5' || g.key === 'ano9') ? '1pt solid #475569' : '0.5pt solid #334155',
                                }}>
                                    {gradeTotals[g.key]}
                                </td>
                            ))}
                            <td style={{ ...thStyle, background: '#1e293b', fontSize: '9pt', color: '#fb923c' }}>
                                {grandTotal}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* ====== SIGNATURES ====== */}
            <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '30pt', pageBreakInside: 'avoid' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Responsável pelo Censo/Matrícula
                    </p>
                    <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                        SME - HUMBERTO DE CAMPOS
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Secretário(a) Municipal de Educação
                    </p>
                    <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                        VISTO / HOMOLOGADO
                    </p>
                </div>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ marginTop: '20pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '5pt' }}>
                <span>SIGAR • Sistema Integrado de Gestão</span>
                <span>Matrículas Detalhadas por Ano/Série • {currentYear}</span>
            </div>
        </div>,
        document.body
    );
};
