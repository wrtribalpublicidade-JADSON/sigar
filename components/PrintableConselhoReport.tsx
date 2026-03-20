import React from 'react';
import { createPortal } from 'react-dom';
import { Escola, Coordenador } from '../types';
import { TurmaData } from './modals/CadastroTurmaModal';

interface PrintableConselhoReportProps {
    escola?: Escola;
    turma?: TurmaData | null;
    etapa: 'fundamental' | 'infantil';
    context: string; // 'Resultado Consolidado' or '1º Bimestre', etc.
    componenteCurricular?: string;
    data: any[];
    coordenador?: Coordenador | null;
}

export const PrintableConselhoReport: React.FC<PrintableConselhoReportProps> = ({
    escola,
    turma,
    etapa,
    context,
    componenteCurricular,
    data,
    coordenador
}) => {
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const isConsolidado = context === 'Resultado Consolidado';

    return createPortal(
        <div id="print-report" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
            
            {/* ====== INSTITUTIONAL HEADER ====== */}
            <div className="text-center mb-4 pb-3" style={{ borderBottom: '2pt solid #0f172a' }}>
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
                <h1 style={{ fontSize: '14pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 4pt' }}>
                    Conselho de Classe - {etapa === 'fundamental' ? 'Ensino Fundamental' : 'Educação Infantil'}
                </h1>
                <p style={{ fontSize: '9pt', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    {context} {componenteCurricular ? `— ${componenteCurricular}` : ''}
                </p>
            </div>

            {/* ====== IDENTIFICATION BLOCK ====== */}
            <div style={{ padding: '8pt 10pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '10pt', borderRadius: '4pt' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15pt' }}>
                    <div>
                        <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1pt' }}>
                            Unidade Escolar
                        </p>
                        <p style={{ fontSize: '10pt', fontWeight: 800, color: '#0f172a' }}>
                            {escola?.nome || 'SEMEHC'}
                        </p>
                    </div>
                    <div>
                        <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1pt' }}>
                            Turma / Ano
                        </p>
                        <p style={{ fontSize: '10pt', fontWeight: 800, color: '#0f172a' }}>
                            {turma ? `${turma.anoSerie} - ${turma.identificacao} (${turma.turno})` : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ====== DATA TABLE ====== */}
            <div style={{ marginBottom: '20pt' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '0.5pt solid #e2e8f0' }}>
                    <thead>
                        {isConsolidado ? (
                            <tr style={{ background: '#0f172a' }}>
                                <th style={{ padding: '6pt 10pt', fontSize: '7pt', color: '#fff', textTransform: 'uppercase', textAlign: 'left', width: '40%' }}>Estudante</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '7pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>1º Bim</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '7pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>2º Bim</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '7pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>3º Bim</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '7pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>4º Bim</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '7pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>Média Final</th>
                            </tr>
                        ) : (
                            <tr style={{ background: '#0f172a' }}>
                                <th style={{ padding: '6pt 10pt', fontSize: '7pt', color: '#fff', textTransform: 'uppercase', textAlign: 'left', width: '30%' }}>Estudante</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '6pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>FRE</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '6pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>PAR</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '6pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>MAT</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '6pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>ATV</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '6pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>COM</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '6pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>PES</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '6pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>CON</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '7pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>AV1</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '7pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>AV2</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '7pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>AV3</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '7pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>REC</th>
                                <th style={{ padding: '6pt 10pt', fontSize: '7pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center' }}>Média</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {data.map((item, idx) => (
                            <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '0.5pt solid #e2e8f0' }}>
                                <td style={{ padding: '6pt 10pt', fontSize: '8pt', fontWeight: 600, color: '#334155' }}>
                                    {item.name}
                                </td>
                                {isConsolidado ? (
                                    <>
                                        <td style={{ padding: '6pt 10pt', fontSize: '9pt', color: '#475569', textAlign: 'center' }}>{item.b1 || '-'}</td>
                                        <td style={{ padding: '6pt 10pt', fontSize: '9pt', color: '#475569', textAlign: 'center' }}>{item.b2 || '-'}</td>
                                        <td style={{ padding: '6pt 10pt', fontSize: '9pt', color: '#475569', textAlign: 'center' }}>{item.b3 || '-'}</td>
                                        <td style={{ padding: '6pt 10pt', fontSize: '9pt', color: '#475569', textAlign: 'center' }}>{item.b4 || '-'}</td>
                                        <td style={{ padding: '6pt 10pt', fontSize: '10pt', fontWeight: 900, color: item.alert ? '#e11d48' : '#059669', textAlign: 'center' }}>
                                            {item.mediaFinal || '-'}
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td style={{ padding: '4pt 2pt', fontSize: '7pt', color: '#64748b', textAlign: 'center', fontWeight: 800 }}>{item.fre}</td>
                                        <td style={{ padding: '4pt 2pt', fontSize: '7pt', color: '#64748b', textAlign: 'center', fontWeight: 800 }}>{item.par}</td>
                                        <td style={{ padding: '4pt 2pt', fontSize: '7pt', color: '#64748b', textAlign: 'center', fontWeight: 800 }}>{item.mat}</td>
                                        <td style={{ padding: '4pt 2pt', fontSize: '7pt', color: '#64748b', textAlign: 'center', fontWeight: 800 }}>{item.atv}</td>
                                        <td style={{ padding: '4pt 2pt', fontSize: '7pt', color: '#64748b', textAlign: 'center', fontWeight: 800 }}>{item.com}</td>
                                        <td style={{ padding: '4pt 2pt', fontSize: '7pt', color: '#64748b', textAlign: 'center', fontWeight: 800 }}>{item.pes}</td>
                                        <td style={{ padding: '4pt 2pt', fontSize: '7pt', color: '#64748b', textAlign: 'center', fontWeight: 800 }}>{item.con}</td>
                                        <td style={{ padding: '4pt 2pt', fontSize: '8pt', color: '#475569', textAlign: 'center' }}>{item.notas?.av1 || '-'}</td>
                                        <td style={{ padding: '4pt 2pt', fontSize: '8pt', color: '#475569', textAlign: 'center' }}>{item.notas?.av2 || '-'}</td>
                                        <td style={{ padding: '4pt 2pt', fontSize: '8pt', color: '#475569', textAlign: 'center' }}>{item.notas?.av3 || '-'}</td>
                                        <td style={{ padding: '4pt 2pt', fontSize: '8pt', color: '#b45309', textAlign: 'center', fontWeight: 700 }}>{item.notas?.rec || '-'}</td>
                                        <td style={{ padding: '4pt 2pt', fontSize: '9pt', fontWeight: 900, color: '#0f172a', textAlign: 'center' }}>{item.media || '-'}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ====== LEGEND ====== */}
            {!isConsolidado && (
                <div style={{ marginBottom: '20pt', padding: '10pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10pt' }}>
                    <div style={{ fontSize: '6pt', color: '#64748b' }}>
                        <span style={{ fontWeight: 800 }}>FRE:</span> Frequência
                    </div>
                    <div style={{ fontSize: '6pt', color: '#64748b' }}>
                        <span style={{ fontWeight: 800 }}>PAR:</span> Participação
                    </div>
                    <div style={{ fontSize: '6pt', color: '#64748b' }}>
                        <span style={{ fontWeight: 800 }}>MAT:</span> Material
                    </div>
                    <div style={{ fontSize: '6pt', color: '#64748b' }}>
                        <span style={{ fontWeight: 800 }}>ATV:</span> Atividades
                    </div>
                    <div style={{ fontSize: '6pt', color: '#64748b' }}>
                        <span style={{ fontWeight: 800 }}>COM:</span> Comunicação
                    </div>
                    <div style={{ fontSize: '6pt', color: '#64748b' }}>
                        <span style={{ fontWeight: 800 }}>PES:</span> Pesquisa
                    </div>
                    <div style={{ fontSize: '6pt', color: '#64748b' }}>
                        <span style={{ fontWeight: 800 }}>CON:</span> Conduta
                    </div>
                    <div style={{ fontSize: '6pt', color: '#64748b' }}>
                        <span style={{ fontWeight: 800 }}>Conceitos:</span> E (Excel), B (Bom), R (Reg), I (Ins)
                    </div>
                </div>
            )}

            {/* ====== SIGNATURES ====== */}
            <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20pt', paddingTop: '40pt' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1pt solid #0f172a', width: '100%', marginBottom: '4pt' }} />
                    <p style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase' }}>Professor(a)</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1pt solid #0f172a', width: '100%', marginBottom: '4pt' }} />
                    <p style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase' }}>Coordenação Pedagógica</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1pt solid #0f172a', width: '100%', marginBottom: '4pt' }} />
                    <p style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase' }}>Direção Escolar</p>
                </div>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ marginTop: '30pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '6pt' }}>
                <span>SIGAR • Sistema Integrado de Gestão</span>
                <span>Relatório Gerado em {emissionDate} às {emissionTime}</span>
            </div>
        </div>,
        document.body
    );
};
