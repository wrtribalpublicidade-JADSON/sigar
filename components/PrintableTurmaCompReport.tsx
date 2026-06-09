import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TurmaComp } from '../services/turmaCompService';
import { Atividade } from '../services/activitiesService';

interface Student {
    id: number;
    nome: string;
    turma: string;
    escola: string;
    anoSerie: string;
    etapa: string;
    status: 'Ativo' | 'Inativo';
}

interface PrintableTurmaCompReportProps {
    turma: TurmaComp;
    students: Student[];
    linkedActivities: Atividade[];
    escolaName?: string;
    onClose: () => void;
}

export const PrintableTurmaCompReport: React.FC<PrintableTurmaCompReportProps> = ({
    turma,
    students,
    linkedActivities,
    escolaName,
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

    if (!turma) return null;

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
        padding: '5pt 8pt',
        border: '0.5pt solid #cbd5e1',
        fontSize: '8pt',
        fontWeight: 600,
        color: '#334155',
        verticalAlign: 'middle',
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
                <div style={{ width: '60pt', height: '1.5pt', background: '#4f46e5', margin: '0 auto 6pt' }} />
                <h1 style={{ fontSize: '14pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 3pt' }}>
                    Relatório da Turma Complementar
                </h1>
                <p style={{ fontSize: '7pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Rede Municipal de Ensino — {currentYear}
                </p>
            </div>

            {/* ====== INFO BANNER ====== */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15pt', padding: '8pt 12pt', background: '#f8fafc', border: '0.5pt solid #cbd5e1', marginBottom: '12pt' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4pt' }}>
                    <div>
                        <span style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Turma Complementar</span>
                        <p style={{ fontSize: '12pt', fontWeight: 900, color: '#0f172a', margin: 0 }}>{turma.nome}</p>
                    </div>
                    <div>
                        <span style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Unidade Escolar</span>
                        <p style={{ fontSize: '9pt', fontWeight: 700, color: '#334155', margin: 0 }}>{escolaName || students[0]?.escola || 'Rede Municipal'}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <span style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total de Alunos</span>
                        <p style={{ fontSize: '12pt', fontWeight: 900, color: '#4f46e5', margin: 0 }}>{students.length}</p>
                    </div>
                    <div>
                        <span style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Emissão</span>
                        <p style={{ fontSize: '7.5pt', fontWeight: 600, color: '#475569', margin: 0 }}>
                            {emissionDate} às {emissionTime}
                        </p>
                    </div>
                </div>
            </div>

            {/* ====== LINKED ACTIVITIES ====== */}
            <div style={{ marginBottom: '14pt' }}>
                <h3 style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', borderBottom: '1pt solid #cbd5e1', paddingBottom: '3pt', marginBottom: '6pt' }}>
                    Atividades Vinculadas ({linkedActivities.length})
                </h3>
                {linkedActivities.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8pt' }}>
                        {linkedActivities.map((atv, idx) => (
                            <div key={atv.id || idx} style={{ padding: '6pt 8pt', border: '0.5pt solid #e2e8f0', background: '#f8fafc', borderRadius: '4px' }}>
                                <span style={{ fontSize: '6.5pt', fontWeight: 800, background: '#4f46e5', color: '#fff', padding: '1pt 3pt', borderRadius: '2pt', textTransform: 'uppercase' }}>
                                    {atv.categoria?.split('.')[1]?.trim() || atv.categoria || 'Atividade'}
                                </span>
                                <p style={{ fontSize: '8.5pt', fontWeight: 900, color: '#0f172a', marginTop: '3pt', marginBottom: '2pt', textTransform: 'uppercase' }}>{atv.nome}</p>
                                <p style={{ fontSize: '7pt', fontWeight: 600, color: '#64748b', margin: 0 }}>Instrutor: {atv.instrutor}</p>
                                <p style={{ fontSize: '7pt', fontWeight: 500, color: '#64748b', margin: 0 }}>Horário: {atv.diasSemana?.join('/')} • {atv.horarioInicio}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '8pt', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Nenhuma atividade vinculada a esta turma complementar.</p>
                )}
            </div>

            {/* ====== STUDENT TABLE ====== */}
            <div style={{ marginBottom: '25pt' }}>
                <h3 style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', borderBottom: '1pt solid #cbd5e1', paddingBottom: '3pt', marginBottom: '6pt' }}>
                    Estudantes Matriculados
                </h3>
                {students.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, width: '6%', textAlign: 'center' }}>Nº</th>
                                <th style={{ ...thStyle, width: '44%' }}>Nome do Aluno</th>
                                <th style={{ ...thStyle, width: '25%' }}>Ano / Série Regular</th>
                                <th style={{ ...thStyle, width: '25%' }}>Unidade Escolar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, idx) => (
                                <tr key={student.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', fontSize: '7.5pt' }}>{idx + 1}</td>
                                    <td style={{ ...tdStyle, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>{student.nome}</td>
                                    <td style={{ ...tdStyle }}>
                                        <span style={{ fontSize: '7.5pt', fontWeight: 700 }}>
                                            {student.anoSerie}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle }}>{student.escola}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '12pt', textAlign: 'center', border: '0.5pt dashed #cbd5e1', color: '#64748b', fontSize: '8pt', fontStyle: 'italic' }}>
                        Nenhum estudante matriculado nesta turma complementar.
                    </div>
                )}
            </div>

            {/* ====== SIGNATURES ====== */}
            <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', marginTop: '40pt', pageBreakInside: 'avoid' }}>
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
                        Diretor(a) / Gestor(a) Escolar
                    </p>
                    <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                        ASSINATURA E CARIMBO
                    </p>
                </div>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '5pt', marginTop: '30pt' }}>
                <span>SIGAR • Sistema Integrado de Gestão</span>
                <span>Turma Complementar: {turma.nome} • {currentYear}</span>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};
