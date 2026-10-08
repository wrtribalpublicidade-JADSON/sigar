import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Atividade } from '../services/activitiesService';

export interface StudentMonthlyRow {
    id: number;
    nome: string;
    turma: string;
    escola: string;
    anoSerie: string;
    presencesCount: number;
    absencesCount: number;
    totalClasses: number;
    rate: number;
    daysMap: Record<string, boolean | undefined>;
}

interface PrintableAtividadeFrequenciaMensalReportProps {
    atividade: Atividade;
    monthName: string;
    year: number;
    dates: string[];
    studentsRows: StudentMonthlyRow[];
    onClose: () => void;
}

export const PrintableAtividadeFrequenciaMensalReport: React.FC<PrintableAtividadeFrequenciaMensalReportProps> = ({
    atividade,
    monthName,
    year,
    dates,
    studentsRows,
    onClose
}) => {
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

    const totalStudents = studentsRows.length;
    const totalClasses = dates.length;
    const overallRate = totalStudents > 0
        ? Math.round(studentsRows.reduce((acc, s) => acc + s.rate, 0) / totalStudents)
        : 0;

    const thStyle: React.CSSProperties = {
        padding: '5pt 4pt',
        border: '0.5pt solid #334155',
        fontSize: '6.5pt',
        fontWeight: 800,
        textTransform: 'uppercase',
        color: '#fff',
        background: '#0f172a',
        textAlign: 'center',
    };

    const tdStyle: React.CSSProperties = {
        padding: '4pt 4pt',
        border: '0.5pt solid #cbd5e1',
        fontSize: '7pt',
        color: '#1e293b',
    };

    const formatDayHeader = (dateStr: string) => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const day = parts[2];
            const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            const weekday = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'][dateObj.getDay()];
            return { day, weekday };
        }
        return { day: dateStr, weekday: '' };
    };

    return createPortal(
        <div id="print-report" className="hidden print:block bg-white text-slate-900 p-6" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
            
            {/* ====== INSTITUTIONAL HEADER ====== */}
            <div className="text-center mb-4 pb-2" style={{ borderBottom: '2pt solid #0f172a' }}>
                <p style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '2pt' }}>
                    Estado do Maranhão
                </p>
                <p style={{ fontSize: '10pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '2pt' }}>
                    Prefeitura Municipal de Humberto de Campos
                </p>
                <p style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '6pt' }}>
                    Secretaria Municipal de Educação
                </p>
                <div style={{ width: '60pt', height: '1.5pt', background: '#f97316', margin: '0 auto 6pt' }} />
                <h1 style={{ fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 2pt' }}>
                    Mapa Mensal de Frequência • Atividades Complementares
                </h1>
                <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Controle de Assiduidade • {monthName} de {year}
                </p>
            </div>

            {/* ====== IDENTIFICATION BLOCK ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
                <div style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '4pt 8pt' }}>
                    Identificação da Oficina e Turma
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '4pt 8pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '6.5pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', width: '18%', background: '#f8fafc' }}>
                                Atividade / Oficina
                            </td>
                            <td style={{ padding: '4pt 8pt', border: '0.5pt solid #e2e8f0', fontSize: '8.5pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                                {atividade.nome}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '4pt 8pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '6.5pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', background: '#f8fafc' }}>
                                Categoria
                            </td>
                            <td style={{ padding: '4pt 8pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 600, color: '#334155' }}>
                                {atividade.categoria}
                            </td>
                            <td style={{ padding: '4pt 8pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '6.5pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', width: '18%', background: '#f8fafc' }}>
                                Unidade Escolar
                            </td>
                            <td style={{ padding: '4pt 8pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 600, color: '#334155' }}>
                                {atividade.unidadeEscolar}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '4pt 8pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '6.5pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', background: '#f8fafc' }}>
                                Monitor / Professor
                            </td>
                            <td style={{ padding: '4pt 8pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 600, color: '#334155' }}>
                                {atividade.instrutor}
                            </td>
                            <td style={{ padding: '4pt 8pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '6.5pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', background: '#f8fafc' }}>
                                Resumo do Mês
                            </td>
                            <td style={{ padding: '4pt 8pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 700, color: '#0f172a' }}>
                                {totalClasses} Aulas Registradas • {totalStudents} Alunos • {overallRate}% Frequência Média
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ====== ATTENDANCE GRID TABLE ====== */}
            <div style={{ marginBottom: '14pt' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '22pt' }}>Nº</th>
                            <th style={{ ...thStyle, textAlign: 'left', minWidth: '130pt' }}>Estudante</th>
                            <th style={{ ...thStyle, width: '60pt' }}>Turma/Ano</th>
                            
                            {/* Days Columns */}
                            {dates.map(d => {
                                const { day, weekday } = formatDayHeader(d);
                                return (
                                    <th key={d} style={{ ...thStyle, width: '18pt', padding: '3pt 1pt' }}>
                                        <div>{day}</div>
                                        <div style={{ fontSize: '5pt', color: '#94a3b8' }}>{weekday}</div>
                                    </th>
                                );
                            })}

                            <th style={{ ...thStyle, width: '22pt', background: '#065f46' }}>P</th>
                            <th style={{ ...thStyle, width: '22pt', background: '#991b1b' }}>F</th>
                            <th style={{ ...thStyle, width: '24pt', background: '#0284c7' }}>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsRows.length === 0 ? (
                            <tr>
                                <td colSpan={dates.length + 6} style={{ ...tdStyle, textAlign: 'center', padding: '20pt', color: '#64748b', fontStyle: 'italic' }}>
                                    Nenhum aluno vinculado a esta oficina.
                                </td>
                            </tr>
                        ) : (
                            studentsRows.map((s, index) => {
                                const isAlert = s.rate < 75 && s.totalClasses > 0;
                                return (
                                    <tr key={s.id} style={{ background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, fontSize: '6.5pt', color: '#64748b' }}>
                                            {String(index + 1).padStart(2, '0')}
                                        </td>
                                        <td style={{ ...tdStyle, fontWeight: 700, textTransform: 'uppercase', color: '#0f172a' }}>
                                            {s.nome}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center', fontSize: '6.5pt', color: '#475569' }}>
                                            {s.turma}
                                        </td>

                                        {/* Day Cells */}
                                        {dates.map(d => {
                                            const status = s.daysMap[d];
                                            const isPresent = status === true;
                                            const isAbsent = status === false;
                                            return (
                                                <td key={d} style={{
                                                    ...tdStyle,
                                                    textAlign: 'center',
                                                    fontWeight: 800,
                                                    fontSize: '7pt',
                                                    padding: '2pt 1pt',
                                                    color: isPresent ? '#047857' : isAbsent ? '#b91c1c' : '#94a3b8',
                                                    background: isPresent ? '#ecfdf5' : isAbsent ? '#fef2f2' : 'transparent'
                                                }}>
                                                    {isPresent ? 'P' : isAbsent ? 'F' : '—'}
                                                </td>
                                            );
                                        })}

                                        {/* Presences */}
                                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, color: '#047857', background: '#f0fdf4' }}>
                                            {s.presencesCount}
                                        </td>

                                        {/* Absences */}
                                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, color: '#b91c1c', background: '#fef2f2' }}>
                                            {s.absencesCount}
                                        </td>

                                        {/* Rate */}
                                        <td style={{
                                            ...tdStyle,
                                            textAlign: 'center',
                                            fontWeight: 800,
                                            color: isAlert ? '#b91c1c' : '#0f172a',
                                            background: isAlert ? '#fee2e2' : '#f8fafc'
                                        }}>
                                            {s.rate}%
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    {studentsRows.length > 0 && dates.length > 0 && (
                        <tfoot>
                            <tr style={{ background: '#f1f5f9', fontWeight: 800, borderTop: '1pt solid #0f172a' }}>
                                <td colSpan={3} style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, fontSize: '6.5pt', textTransform: 'uppercase', color: '#0f172a' }}>
                                    Total de Presentes no Dia:
                                </td>
                                {dates.map(d => {
                                    const dayPresents = studentsRows.filter(s => s.daysMap[d] === true).length;
                                    return (
                                        <td key={d} style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, fontSize: '6.5pt', color: '#047857' }}>
                                            {dayPresents}
                                        </td>
                                    );
                                })}
                                <td colSpan={3} style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, fontSize: '6.5pt', color: '#0f172a' }}>
                                    {overallRate}% MÉDIA
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* ====== LEGEND & SIGNATURE BLOCK ====== */}
            <div className="print-avoid-break">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20pt', fontSize: '6.5pt', color: '#64748b' }}>
                    <div style={{ display: 'flex', gap: '12pt' }}>
                        <span><strong>LEGENDA:</strong></span>
                        <span style={{ color: '#047857', fontWeight: 700 }}>[ P ] Presença</span>
                        <span style={{ color: '#b91c1c', fontWeight: 700 }}>[ F ] Falta</span>
                        <span style={{ color: '#64748b' }}>[ — ] Sem Registro</span>
                    </div>
                    <div>
                        <span>Emissão do Sistema: {emissionDate} às {emissionTime} • SIGAR</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', marginTop: '25pt' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderBottom: '1pt solid #0f172a', marginBottom: '4pt' }}></div>
                        <p style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', color: '#0f172a', margin: '0' }}>
                            {atividade.instrutor}
                        </p>
                        <p style={{ fontSize: '6.5pt', color: '#64748b', textTransform: 'uppercase', margin: '0' }}>
                            Monitor / Professor da Oficina
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderBottom: '1pt solid #0f172a', marginBottom: '4pt' }}></div>
                        <p style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', color: '#0f172a', margin: '0' }}>
                            Coordenação Pedagógica / Direção
                        </p>
                        <p style={{ fontSize: '6.5pt', color: '#64748b', textTransform: 'uppercase', margin: '0' }}>
                            Visto e Homologação
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
