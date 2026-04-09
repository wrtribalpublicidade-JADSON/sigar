import React from 'react';
import { createPortal } from 'react-dom';
import { Atividade } from '../services/activitiesService';

interface PrintableAtividadesReportProps {
    atividades: (Atividade & { alunosList?: any[] })[];
    filtroCategoria: string;
    filtroStatus: string;
    filtroEscola: string;
}

export const PrintableAtividadesReport: React.FC<PrintableAtividadesReportProps> = ({
    atividades,
    filtroCategoria,
    filtroStatus,
    filtroEscola,
}) => {
    const currentYear = new Date().getFullYear();
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const totalInscritos = atividades.reduce((sum, a) => sum + (a.alunosList?.length || a.inscritos || 0), 0);
    const totalVagas = atividades.reduce((sum, a) => sum + (a.vagas || 0), 0);
    const ativas = atividades.filter(a => a.status === 'Ativa').length;

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
        verticalAlign: 'top',
    };

    return createPortal(
        <div id="print-atividades-report" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: '8pt' }}>

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
                <div style={{ width: '50pt', height: '1.5pt', background: '#7c3aed', margin: '0 auto 5pt' }} />
                <h1 style={{ fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 3pt' }}>
                    Relatório de Estudantes Matriculados em Atividades Complementares
                </h1>
                <p style={{ fontSize: '7pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Rede Municipal de Ensino — {currentYear}
                </p>
            </div>

            {/* ====== EMISSION INFO ====== */}
            <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4pt 8pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '8pt' }}>
                <div style={{ display: 'flex', gap: '20pt' }}>
                    <div>
                        <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1pt' }}>Categoria</p>
                        <p style={{ fontSize: '9pt', fontWeight: 900, color: '#0f172a' }}>{filtroCategoria}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1pt' }}>Status</p>
                        <p style={{ fontSize: '9pt', fontWeight: 900, color: '#7c3aed' }}>{filtroStatus}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1pt' }}>Unidade</p>
                        <p style={{ fontSize: '9pt', fontWeight: 900, color: '#0f172a' }}>{filtroEscola}</p>
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
                <div style={{ flex: 1.5, padding: '6pt', border: '0.5pt solid #e2e8f0', background: '#0f172a' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1pt' }}>Total de Atividades</p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, color: '#fff' }}>{atividades.length}</p>
                </div>
                <div style={{ flex: 1, padding: '6pt', border: '0.5pt solid #e2e8f0', background: '#f5f3ff' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '1pt' }}>Ativas</p>
                    <p style={{ fontSize: '11pt', fontWeight: 900, color: '#5b21b6' }}>{ativas}</p>
                </div>
                <div style={{ flex: 1, padding: '6pt', border: '0.5pt solid #e2e8f0', background: '#ecfdf5' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#047857', textTransform: 'uppercase', marginBottom: '1pt' }}>Total de Alunos</p>
                    <p style={{ fontSize: '11pt', fontWeight: 900, color: '#065f46' }}>{totalInscritos}</p>
                </div>
                <div style={{ flex: 1, padding: '6pt', border: '0.5pt solid #e2e8f0', background: '#fff7ed' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', marginBottom: '1pt' }}>Total de Vagas</p>
                    <p style={{ fontSize: '11pt', fontWeight: 900, color: '#9a3412' }}>{totalVagas}</p>
                </div>
            </div>

            {/* ====== ACTIVITIES + STUDENTS ====== */}
            {atividades.map((atv, atvIndex) => {
                const studentCount = atv.alunosList?.length || 0;
                return (
                    <div key={atv.id} className="print-avoid-break" style={{ marginBottom: '10pt' }}>
                        {/* Activity Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '4pt 8pt',
                            background: '#7c3aed',
                            color: '#fff',
                            marginBottom: '0',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8pt' }}>
                                <span style={{ fontSize: '7pt', fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '2pt 5pt', borderRadius: '3pt' }}>
                                    {String(atvIndex + 1).padStart(2, '0')}
                                </span>
                                <span style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                    {atv.nome}
                                </span>
                                <span style={{ fontSize: '6pt', fontWeight: 700, background: 'rgba(255,255,255,0.15)', padding: '1pt 4pt', borderRadius: '2pt', textTransform: 'uppercase' }}>
                                    {atv.categoria}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12pt', fontSize: '6.5pt', fontWeight: 700, opacity: 0.9 }}>
                                <span>{atv.unidadeEscolar || '-'}</span>
                                <span>•</span>
                                <span>{atv.instrutor || '-'}</span>
                                <span>•</span>
                                <span>{atv.diasSemana?.join('/') || '-'} {atv.horarioInicio}-{atv.horarioFim}</span>
                                <span>•</span>
                                <span style={{ fontWeight: 900 }}>{studentCount} aluno{studentCount !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        {/* Students Table */}
                        {studentCount === 0 ? (
                            <div style={{ padding: '6pt 8pt', background: '#fafafa', border: '0.5pt solid #e2e8f0', fontSize: '7pt', color: '#94a3b8', fontStyle: 'italic' }}>
                                Nenhum estudante inscrito nesta atividade.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ ...thStyle, width: '5%', textAlign: 'center' }}>Nº</th>
                                        <th style={{ ...thStyle, width: '38%' }}>Nome do Aluno</th>
                                        <th style={{ ...thStyle, width: '15%', textAlign: 'center' }}>Data de Nasc.</th>
                                        <th style={{ ...thStyle, width: '22%' }}>Escola</th>
                                        <th style={{ ...thStyle, width: '20%' }}>Ano/Série</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {atv.alunosList!.map((aluno: any, idx: number) => (
                                        <tr key={aluno.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                            <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', fontSize: '7pt' }}>{idx + 1}</td>
                                            <td style={{ ...tdStyle, fontWeight: 700, color: '#0f172a' }}>{aluno.nome}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center', fontSize: '7pt', fontFamily: "'JetBrains Mono', monospace" }}>
                                                {aluno.dataNascimento ? new Date(aluno.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                                            </td>
                                            <td style={{ ...tdStyle }}>{aluno.escola || '-'}</td>
                                            <td style={{ ...tdStyle }}>{aluno.anoSerie || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            })}

            {/* ====== TOTALS FOOTER ====== */}
            <div className="print-avoid-break" style={{ padding: '6pt 8pt', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', marginTop: '6pt', marginBottom: '15pt' }}>
                <span style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Total Geral: {atividades.length} atividades
                </span>
                <span style={{ fontSize: '8pt', fontWeight: 900, color: '#a78bfa' }}>
                    {totalInscritos} estudantes matriculados
                </span>
            </div>

            {/* ====== SIGNATURES ====== */}
            <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '30pt', pageBreakInside: 'avoid' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Coordenador(a) de Atividades Complementares
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
                <span>Atividades Complementares — Estudantes Matriculados • {currentYear}</span>
            </div>
        </div>,
        document.body
    );
};
