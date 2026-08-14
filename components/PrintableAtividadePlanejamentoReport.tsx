import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Atividade, AtividadeLog } from '../services/activitiesService';

interface PrintableAtividadePlanejamentoReportProps {
    atividade: Atividade;
    logs: AtividadeLog[];
    onClose: () => void;
}

export const PrintableAtividadePlanejamentoReport: React.FC<PrintableAtividadePlanejamentoReportProps> = ({
    atividade,
    logs,
    onClose
}) => {
    const currentYear = new Date().getFullYear();
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);

        const handleAfterPrint = () => {
            onClose();
        };

        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [onClose]);

    if (!atividade) return null;

    // Sort logs by date ascending for printing (logical order of lesson planning)
    const sortedLogs = [...logs].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    const thStyle: React.CSSProperties = {
        padding: '6pt 8pt',
        border: '0.5pt solid #334155',
        fontSize: '7pt',
        fontWeight: 800,
        textTransform: 'uppercase',
        color: '#fff',
        background: '#0f172a',
        textAlign: 'left',
        letterSpacing: '0.05em',
    };

    const tdStyle: React.CSSProperties = {
        padding: '8pt 10pt',
        border: '0.5pt solid #cbd5e1',
        fontSize: '8.5pt',
        fontWeight: 500,
        color: '#334155',
        verticalAlign: 'top',
        lineHeight: '1.4',
    };

    const content = (
        <div className="print-only bg-white text-slate-900" style={{ padding: '40px', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: '9pt' }}>
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .print-only, .print-only * {
                        visibility: visible !important;
                    }
                    .print-only {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        padding: 20px !important;
                        margin: 0 !important;
                        background: white !important;
                    }
                }
                `}
            </style>

            {/* ====== INSTITUTIONAL HEADER ====== */}
            <div className="text-center mb-4 pb-3" style={{ borderBottom: '2pt solid #0f172a' }}>
                <p style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '1pt' }}>
                    ESTADO DO MARANHÃO
                </p>
                <p style={{ fontSize: '10pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '1pt' }}>
                    PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
                </p>
                <p style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '8pt' }}>
                    SECRETARIA MUNICIPAL DE EDUCAÇÃO
                </p>
                <div style={{ width: '60pt', height: '1.5pt', background: '#f97316', margin: '0 auto 6pt' }} />
                <h1 style={{ fontSize: '14pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 3pt' }}>
                    Diário de Bordo — Conteúdo Pedagógico
                </h1>
                <p style={{ fontSize: '7pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Planejamento das Atividades Complementares — {currentYear}
                </p>
            </div>

            {/* ====== INFO BANNER ====== */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15pt', padding: '8pt 12pt', background: '#f8fafc', border: '0.5pt solid #cbd5e1', marginBottom: '12pt' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4pt' }}>
                    <div>
                        <span style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Atividade / Oficina</span>
                        <p style={{ fontSize: '12pt', fontWeight: 900, color: '#0f172a', margin: 0 }}>{atividade.nome}</p>
                    </div>
                    <div>
                        <span style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Categoria</span>
                        <p style={{ fontSize: '9pt', fontWeight: 700, color: '#334155', margin: 0 }}>{atividade.categoria}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <span style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Professor / Instrutor</span>
                        <p style={{ fontSize: '10pt', fontWeight: 900, color: '#ea580c', margin: 0 }}>{atividade.instrutor || 'Não informado'}</p>
                    </div>
                    <div>
                        <span style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Emissão</span>
                        <p style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569', margin: 0 }}>
                            {emissionDate} às {emissionTime}
                        </p>
                    </div>
                </div>
            </div>

            {/* ====== ACTIVITY DETAILS ====== */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8pt', marginBottom: '14pt', padding: '6pt 8pt', border: '0.5pt solid #cbd5e1', borderRadius: '4px', background: '#f8fafc' }}>
                <div>
                    <span style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Unidade Escolar</span>
                    <p style={{ fontSize: '8pt', fontWeight: 700, color: '#334155', margin: 0 }}>{atividade.unidadeEscolar || '-'}</p>
                </div>
                <div>
                    <span style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Sala / Espaço</span>
                    <p style={{ fontSize: '8pt', fontWeight: 700, color: '#334155', margin: 0 }}>{atividade.sala || '-'}</p>
                </div>
                <div>
                    <span style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Dias da Semana</span>
                    <p style={{ fontSize: '8pt', fontWeight: 700, color: '#334155', margin: 0 }}>{atividade.diasSemana?.join(', ') || '-'}</p>
                </div>
                <div>
                    <span style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Carga Horária / Horário</span>
                    <p style={{ fontSize: '8pt', fontWeight: 700, color: '#334155', margin: 0 }}>
                        {atividade.cargaHoraria || '-'} ({atividade.horarioInicio || '-'} - {atividade.horarioFim || '-'})
                    </p>
                </div>
            </div>

            {/* ====== LOGS / PLANNING TABLE ====== */}
            <div style={{ marginBottom: '25pt' }}>
                <h3 style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', borderBottom: '1pt solid #cbd5e1', paddingBottom: '3pt', marginBottom: '6pt' }}>
                    Planejamento de Aulas Registrado ({sortedLogs.length})
                </h3>
                {sortedLogs.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, width: '5%', textAlign: 'center' }}>Nº</th>
                                <th style={{ ...thStyle, width: '16%' }}>Data da Aula</th>
                                <th style={{ ...thStyle, width: '55%' }}>Conteúdo Desenvolvido / Planejamento</th>
                                <th style={{ ...thStyle, width: '24%' }}>Status / Avaliação da Coordenação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedLogs.map((log, idx) => {
                                const status = log.status || 'Em Análise';
                                const isApproved = status === 'Aprovado';
                                const isReturned = status === 'Devolvido para Correção';

                                return (
                                    <tr key={log.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                        <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', fontSize: '8pt', fontWeight: 700 }}>{idx + 1}</td>
                                        <td style={{ ...tdStyle, fontWeight: 700, color: '#0f172a' }}>
                                            {new Date(log.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            {log.periodo && (
                                                <div style={{ fontSize: '7pt', color: '#ea580c', fontWeight: 800, marginTop: '2pt' }}>
                                                    {log.periodo}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ ...tdStyle, whiteSpace: 'pre-line' }}>{log.conteudo}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center', borderRight: '0.5pt solid #cbd5e1' }}>
                                            <div style={{ 
                                                display: 'inline-block',
                                                fontSize: '7pt', 
                                                fontWeight: 800, 
                                                textTransform: 'uppercase',
                                                padding: '2pt 6pt',
                                                borderRadius: '3px',
                                                background: isApproved ? '#ecfdf5' : isReturned ? '#fff1f2' : '#fffbeb',
                                                color: isApproved ? '#047857' : isReturned ? '#be123c' : '#b45309',
                                                border: `0.5pt solid ${isApproved ? '#a7f3d0' : isReturned ? '#fecdd3' : '#fde68a'}`
                                            }}>
                                                {status}
                                            </div>
                                            {log.avaliado_por && (
                                                <div style={{ fontSize: '6.5pt', color: '#64748b', marginTop: '3pt' }}>
                                                    Visto: <strong>{log.avaliado_por}</strong>
                                                </div>
                                            )}
                                            <div style={{ borderBottom: '0.5pt dashed #cbd5e1', marginTop: '8pt', width: '100%', height: '1px' }} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '12pt', textAlign: 'center', border: '0.5pt dashed #cbd5e1', color: '#64748b', fontSize: '8pt', fontStyle: 'italic' }}>
                        Nenhum registro de conteúdo pedagógico cadastrado para esta atividade.
                    </div>
                )}
            </div>

            {/* ====== SIGNATURES ====== */}
            <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20pt', marginTop: '40pt', pageBreakInside: 'avoid' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '85%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Professor(a) / Instrutor(a)
                    </p>
                    <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>
                        {atividade.instrutor}
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '85%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Coordenador(a) Pedagógico(a)
                    </p>
                    <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>
                        Atividades Complementares
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '85%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Diretor(a) / Gestor(a) Escolar
                    </p>
                    <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>
                        ASSINATURA E CARIMBO
                    </p>
                </div>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '5pt', marginTop: '30pt' }}>
                <span>SIGAR • Sistema Integrado de Gestão</span>
                <span>Oficina: {atividade.nome} • {currentYear}</span>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};
