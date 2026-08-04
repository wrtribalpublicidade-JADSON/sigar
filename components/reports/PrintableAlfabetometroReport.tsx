import React from 'react';
import { createPortal } from 'react-dom';

export interface AlfabetometroDocumentViewProps {
    schoolName: string;
    grade: string;
    year: number;
    records: any[];
    isInline?: boolean;
}

export const AlfabetometroDocumentView: React.FC<AlfabetometroDocumentViewProps> = ({
    schoolName,
    grade,
    year,
    records = [],
    isInline = false
}) => {

    // Helper functions for mapping database values
    const getNivelKey = (nivel: string): 'fluente' | 'iniciante' | 'n4' | 'n3' | 'n2' | 'n1' => {
        const n = (nivel || '').toUpperCase();
        if (n.includes('FLUENTE')) return 'fluente';
        if (n.includes('INICIANTE')) return 'iniciante';
        if (n.includes('IV') || n.includes('4')) return 'n4';
        if (n.includes('III') || n.includes('3')) return 'n3';
        if (n.includes('II') || n.includes('2')) return 'n2';
        if (n.includes('I') || n.includes('1') || n.includes('NÃO LEITOR') || n.includes('NAO LEITOR') || n.includes('NÃO LER') || n.includes('NAO LER') || n.includes('NÃO LEU') || n.includes('NAO LEU')) return 'n1';
        return 'n1'; // Fallback
    };

    const getPeriodKey = (tipo: string, etapa: string, createdAt: string): 'diag' | 'form1' | 'form2' | 'somativa' => {
        const t = (tipo || '').toUpperCase();
        const e = (etapa || '').toUpperCase();
        
        if (t.includes('DIAGN')) return 'diag';
        if (t.includes('SOMAT')) return 'somativa';
        if (t.includes('FORMAT')) {
            if (e.includes('1') || e.includes('1ª') || e.includes('MAIO')) return 'form1';
            if (e.includes('2') || e.includes('2ª') || e.includes('AGOSTO') || e.includes('AGO')) return 'form2';
            
            // Month fallback
            if (createdAt) {
                const date = new Date(createdAt);
                if (!isNaN(date.getTime()) && date.getMonth() < 6) { // Before July
                    return 'form1';
                }
            }
            return 'form2'; // default formativa
        }
        return 'diag'; // default fallback
    };

    // Aggregate counts
    const counts = {
        fluente: { diag: 0, form1: 0, form2: 0, somativa: 0 },
        iniciante: { diag: 0, form1: 0, form2: 0, somativa: 0 },
        n4: { diag: 0, form1: 0, form2: 0, somativa: 0 },
        n3: { diag: 0, form1: 0, form2: 0, somativa: 0 },
        n2: { diag: 0, form1: 0, form2: 0, somativa: 0 },
        n1: { diag: 0, form1: 0, form2: 0, somativa: 0 }
    };

    const totals = { diag: 0, form1: 0, form2: 0, somativa: 0 };

    records.forEach(r => {
        const nivel = getNivelKey(r.nivelDesempenho || r.nivel_desempenho);
        const period = getPeriodKey(r.tipoAvaliacao || r.tipo_avaliacao, r.etapa, r.createdAt || r.created_at);
        
        counts[nivel][period]++;
        totals[period]++;
    });

    const totalStudents = records.length;

    // Percentages helper
    const getPercent = (count: number, total: number) => {
        return total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
    };

    // Calculate rates for the main diagnosis thermometer
    const diagTotal = totals.diag || 1;
    const pctFluenteDiag = getPercent(counts.fluente.diag, totals.diag);
    const pctInicianteDiag = getPercent(counts.iniciante.diag, totals.diag);
    
    const preReaderTotalDiag = counts.n4.diag + counts.n3.diag + counts.n2.diag + counts.n1.diag;
    const pctPreReaderDiag = getPercent(preReaderTotalDiag, totals.diag);

    const countAlfabetizadosDiag = counts.fluente.diag + counts.iniciante.diag;
    const pctAlfabetizadosDiag = getPercent(countAlfabetizadosDiag, totals.diag);

    // Progressive goals or actual values
    const pctForm1Real = totals.form1 > 0 ? getPercent(counts.fluente.form1 + counts.iniciante.form1, totals.form1) : null;
    const pctForm2Real = totals.form2 > 0 ? getPercent(counts.fluente.form2 + counts.iniciante.form2, totals.form2) : null;
    const pctSomativaReal = totals.somativa > 0 ? getPercent(counts.fluente.somativa + counts.iniciante.somativa, totals.somativa) : null;

    // Display goals (progressive metas based on actual baseline if no actual data exists)
    const displayForm1Pct = pctForm1Real !== null ? pctForm1Real : Math.min(98, Math.round(pctAlfabetizadosDiag + 1));
    const displayForm2Pct = pctForm2Real !== null ? pctForm2Real : Math.min(99, Math.round(pctAlfabetizadosDiag + 2));
    const displaySomativaPct = pctSomativaReal !== null ? pctSomativaReal : Math.min(100, Math.round(pctAlfabetizadosDiag + 3));

    const displayForm1Count = pctForm1Real !== null ? (counts.fluente.form1 + counts.iniciante.form1) : Math.round((displayForm1Pct / 100) * (totals.form1 || totalStudents));
    const displayForm2Count = pctForm2Real !== null ? (counts.fluente.form2 + counts.iniciante.form2) : Math.round((displayForm2Pct / 100) * (totals.form2 || totalStudents));
    const displaySomativaCount = pctSomativaReal !== null ? (counts.fluente.somativa + counts.iniciante.somativa) : Math.round((displaySomativaPct / 100) * (totals.somativa || totalStudents));

    return (
        <div 
            id={isInline ? undefined : "print-report"} 
            className={isInline ? "bg-[#FFFBEA] text-slate-900 p-6 md:p-8 max-w-5xl mx-auto shadow-2xl rounded-sm min-h-[850px] flex flex-col justify-between" : "hidden print:block bg-white text-slate-900 print-keep-bg p-8"} 
            style={{ 
                fontFamily: "'Inter', sans-serif", 
                backgroundColor: '#FFFBEA', 
                minHeight: isInline ? 'auto' : '280mm',
                boxSizing: 'border-box',
                border: 'none',
                margin: '0 auto',
                padding: '24px'
            }}
        >
            {/* ====== HEADER ====== */}
            <div className="flex justify-between items-center border-b-4 border-yellow-400 pb-3 mb-4">
                <div className="flex items-center gap-3">
                    {/* Circle Logo Graphic */}
                    <img 
                        src="/semed-logo.png" 
                        alt="Logo SEMED" 
                        className="print-keep-bg object-contain" 
                        style={{ 
                            width: '64px', 
                            height: '64px'
                        }} 
                    />
                    <div>
                        <h2 style={{ fontSize: '10px', fontWeight: 800, color: '#475569', margin: 0, letterSpacing: '0.05em' }}>PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS</h2>
                        <h3 style={{ fontSize: '11px', fontWeight: 900, color: '#1E293B', margin: 0, letterSpacing: '0.02em' }}>SECRETARIA MUNICIPAL DE EDUCAÇÃO</h3>
                    </div>
                </div>
                <div className="text-right">
                    <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#C21B1B', margin: 0, letterSpacing: '-0.02em' }}>ALFABETÔMETRO</h1>
                </div>
            </div>

            {/* ====== METADATA BLOCK ====== */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white p-3 rounded-xl border border-yellow-300 shadow-sm print-keep-bg">
                    <span style={{ fontSize: '7px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ESCOLA</span>
                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', marginTop: '2px', textTransform: 'uppercase' }} className="truncate">
                        {schoolName}
                    </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-yellow-300 shadow-sm print-keep-bg">
                    <span style={{ fontSize: '7px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ANO/SÉRIE</span>
                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', marginTop: '2px', textTransform: 'uppercase' }}>
                        {grade === 'Toda a escola (consolidado)' ? 'Todos os anos' : grade}
                    </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-yellow-300 shadow-sm print-keep-bg">
                    <span style={{ fontSize: '7px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ESTUDANTES</span>
                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                        {totalStudents}
                    </p>
                </div>
            </div>

            {/* ====== MAIN CONTENT: THERMOMETER & TABLE ====== */}
            <div className="grid grid-cols-12 gap-4 items-stretch mb-6">
                {/* Thermometer Column */}
                <div className="col-span-3 flex flex-col items-center justify-between py-2 pr-2 border-r border-yellow-200">
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>DIAGNÓSTICO ATUAL</span>
                    
                    {/* The Thermometer Body */}
                    <div className="flex-1 flex flex-col justify-end items-center w-full min-h-[300px]">
                        {/* Thermometer Tube */}
                        <div 
                            className="w-14 rounded-full border-4 border-slate-800 flex flex-col overflow-hidden bg-slate-200 print-keep-bg relative"
                            style={{ height: '260px' }}
                        >
                            {/* Fluente Segment */}
                            {pctFluenteDiag > 0 && (
                                <div 
                                    className="bg-emerald-600 print-keep-bg flex items-center justify-center text-white text-[9px] font-black"
                                    style={{ 
                                        height: `${pctFluenteDiag}%`, 
                                        backgroundColor: '#059669 !important' 
                                    }}
                                >
                                    {pctFluenteDiag >= 10 && `${Math.round(pctFluenteDiag)}%`}
                                </div>
                            )}
                            {/* Iniciante Segment */}
                            {pctInicianteDiag > 0 && (
                                <div 
                                    className="bg-lime-500 print-keep-bg flex items-center justify-center text-slate-800 text-[9px] font-black border-t border-slate-800/10"
                                    style={{ 
                                        height: `${pctInicianteDiag}%`, 
                                        backgroundColor: '#84CC16 !important' 
                                    }}
                                >
                                    {pctInicianteDiag >= 10 && `${Math.round(pctInicianteDiag)}%`}
                                </div>
                            )}
                            {/* Pré-Leitores Segment */}
                            {pctPreReaderDiag > 0 && (
                                <div 
                                    className="bg-red-500 print-keep-bg flex items-center justify-center text-white text-[9px] font-black border-t border-slate-800/10"
                                    style={{ 
                                        height: `${pctPreReaderDiag}%`, 
                                        backgroundColor: '#EF4444 !important' 
                                    }}
                                >
                                    {pctPreReaderDiag >= 10 && `${Math.round(pctPreReaderDiag)}%`}
                                </div>
                            )}
                        </div>

                        {/* Bulb Circle (Connector) */}
                        <div 
                            className="w-20 h-20 rounded-full border-4 border-slate-800 -mt-2 bg-gradient-to-br from-emerald-500 to-lime-500 flex flex-col items-center justify-center print-keep-bg shadow-md"
                            style={{ 
                                zIndex: 10,
                                background: 'linear-gradient(to bottom right, #10B981, #84CC16) !important'
                            }}
                        >
                            <span style={{ fontSize: '18px', fontWeight: 950, color: '#FFFFFF', lineHeight: 1 }}>
                                {pctAlfabetizadosDiag.toFixed(0)}%
                            </span>
                        </div>
                    </div>

                    <span style={{ fontSize: '9px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '6px' }}>ALFABETIZADOS</span>
                </div>

                {/* Grid Table Column */}
                <div className="col-span-9">
                    <table className="w-full text-left" style={{ borderCollapse: 'separate', borderSpacing: '0 6px' }}>
                        <thead>
                            <tr style={{ background: 'transparent' }}>
                                <th style={{ border: 'none', padding: '4px 8px', fontSize: '8px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase' }}>NÍVEL</th>
                                <th style={{ border: 'none', padding: '4px 8px', fontSize: '8px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase' }}>DESCRIÇÃO</th>
                                <th style={{ border: 'none', padding: '4px 8px', fontSize: '8px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', textAlign: 'center', width: '13%' }}>DIAGNÓSTICO<br/><span style={{ fontSize: '6px', fontWeight: 700 }}>Fev</span></th>
                                <th style={{ border: 'none', padding: '4px 8px', fontSize: '8px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', textAlign: 'center', width: '13%' }}>1ª FORMATIVA<br/><span style={{ fontSize: '6px', fontWeight: 700 }}>Maio</span></th>
                                <th style={{ border: 'none', padding: '4px 8px', fontSize: '8px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', textAlign: 'center', width: '13%' }}>2ª FORMATIVA<br/><span style={{ fontSize: '6px', fontWeight: 700 }}>Ago</span></th>
                                <th style={{ border: 'none', padding: '4px 8px', fontSize: '8px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', textAlign: 'center', width: '13%' }}>SOMATIVA<br/><span style={{ fontSize: '6px', fontWeight: 700 }}>Nov</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { 
                                    key: 'fluente', 
                                    name: 'Fluente', 
                                    desc: 'Leu textos com fluência', 
                                    color: '#059669', 
                                    bgColor: '#ECFDF5' 
                                },
                                { 
                                    key: 'iniciante', 
                                    name: 'Iniciante', 
                                    desc: 'Leu frases e pequenos textos sem fluência', 
                                    color: '#84CC16', 
                                    bgColor: '#F7FEE7' 
                                },
                                { 
                                    key: 'n4', 
                                    name: 'Pré-leitor N4', 
                                    desc: 'Leu palavras', 
                                    color: '#F59E0B', 
                                    bgColor: '#FFFBEB' 
                                },
                                { 
                                    key: 'n3', 
                                    name: 'Pré-leitor N3', 
                                    desc: 'Leu sílabas / silabando', 
                                    color: '#F97316', 
                                    bgColor: '#FFF7ED' 
                                },
                                { 
                                    key: 'n2', 
                                    name: 'Pré-leitor N2', 
                                    desc: 'Identificou letras', 
                                    color: '#EF4444', 
                                    bgColor: '#FEF2F2' 
                                },
                                { 
                                    key: 'n1', 
                                    name: 'Pré-leitor N1', 
                                    desc: 'Não leu', 
                                    color: '#DC2626', 
                                    bgColor: '#FEF2F2' 
                                }
                            ].map((lvl) => {
                                const countDiag = counts[lvl.key as 'fluente'].diag;
                                const countForm1 = counts[lvl.key as 'fluente'].form1;
                                const countForm2 = counts[lvl.key as 'fluente'].form2;
                                const countSoma = counts[lvl.key as 'fluente'].somativa;

                                return (
                                    <tr key={lvl.key} className="bg-white print-keep-bg shadow-sm" style={{ border: 'none' }}>
                                        {/* Nível Label */}
                                        <td 
                                            style={{ 
                                                border: '1px solid #E2E8F0', 
                                                borderRight: 'none',
                                                borderLeft: `5px solid ${lvl.color}`,
                                                padding: '8px 10px', 
                                                fontSize: '11px', 
                                                fontWeight: 900,
                                                color: '#1E293B',
                                                borderRadius: '6px 0 0 6px'
                                            }}
                                        >
                                            {lvl.name}
                                        </td>
                                        
                                        {/* Descrição */}
                                        <td 
                                            style={{ 
                                                border: '1px solid #E2E8F0', 
                                                borderRight: 'none', 
                                                borderLeft: 'none',
                                                padding: '8px 10px', 
                                                fontSize: '9.5px', 
                                                fontWeight: 700, 
                                                color: '#FFFFFF',
                                                backgroundColor: lvl.color,
                                                width: '28%'
                                            }}
                                            className="print-keep-bg"
                                        >
                                            {lvl.desc}
                                        </td>

                                        {/* Diagnóstico Column */}
                                        <td style={{ border: '1px solid #E2E8F0', borderRight: 'none', borderLeft: 'none', padding: '6px 4px', textAlign: 'center' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#1E293B', display: 'block' }}>
                                                {totals.diag > 0 ? countDiag : '—'}
                                            </span>
                                            {totals.diag > 0 && (
                                                <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#94A3B8' }}>
                                                    {getPercent(countDiag, totals.diag)}%
                                                </span>
                                            )}
                                        </td>

                                        {/* 1ª Formativa Column */}
                                        <td style={{ border: '1px solid #E2E8F0', borderRight: 'none', borderLeft: 'none', padding: '6px 4px', textAlign: 'center' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#1E293B', display: 'block' }}>
                                                {totals.form1 > 0 ? countForm1 : '—'}
                                            </span>
                                            {totals.form1 > 0 && (
                                                <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#94A3B8' }}>
                                                    {getPercent(countForm1, totals.form1)}%
                                                </span>
                                            )}
                                        </td>

                                        {/* 2ª Formativa Column */}
                                        <td style={{ border: '1px solid #E2E8F0', borderRight: 'none', borderLeft: 'none', padding: '6px 4px', textAlign: 'center' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#1E293B', display: 'block' }}>
                                                {totals.form2 > 0 ? countForm2 : '—'}
                                            </span>
                                            {totals.form2 > 0 && (
                                                <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#94A3B8' }}>
                                                    {getPercent(countForm2, totals.form2)}%
                                                </span>
                                            )}
                                        </td>

                                        {/* Somativa Column */}
                                        <td 
                                            style={{ 
                                                border: '1px solid #E2E8F0', 
                                                borderLeft: 'none', 
                                                padding: '6px 4px', 
                                                textAlign: 'center',
                                                borderRadius: '0 6px 6px 0'
                                            }}
                                        >
                                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#1E293B', display: 'block' }}>
                                                {totals.somativa > 0 ? countSoma : '—'}
                                            </span>
                                            {totals.somativa > 0 && (
                                                <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#94A3B8' }}>
                                                    {getPercent(countSoma, totals.somativa)}%
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <p className="text-[7.5px] italic text-slate-500 text-center mt-2">
                        Registre o nº de estudantes em cada nível após cada avaliação para acompanhar a evolução.
                    </p>
                </div>
            </div>

            {/* ====== FOOTER METAS BLOCK ====== */}
            <div className="border-t-2 border-yellow-300 pt-4 mt-auto">
                <h4 style={{ fontSize: '11px', fontWeight: 950, color: '#1E293B', textAlign: 'center', marginBottom: '8px', letterSpacing: '0.05em' }}>
                    METAS DE ALFABETIZAÇÃO — CALENDÁRIO DE AVALIAÇÕES
                </h4>

                <div className="grid grid-cols-4 gap-3">
                    {/* Diagnóstico Card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-2.5 text-center print-keep-bg shadow-sm">
                        <span style={{ fontSize: '8px', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', display: 'block' }}>DIAGNÓSTICO</span>
                        <span style={{ fontSize: '6.5px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Fevereiro</span>
                        <p style={{ fontSize: '20px', fontWeight: 900, color: '#1E293B', margin: '2px 0' }}>
                            {pctAlfabetizadosDiag.toFixed(0)}%
                        </p>
                        <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#64748B' }}>
                            {countAlfabetizadosDiag} de {totals.diag || totalStudents}
                        </span>
                    </div>

                    {/* 1ª Formativa Card */}
                    <div className="bg-white rounded-xl border border-orange-200 p-2.5 text-center print-keep-bg shadow-sm" style={{ border: '1.5px solid #F97316' }}>
                        <span style={{ fontSize: '8px', fontWeight: 800, color: '#F97316', textTransform: 'uppercase', display: 'block' }}>1ª FORMATIVA</span>
                        <span style={{ fontSize: '6.5px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Maio</span>
                        <p style={{ fontSize: '20px', fontWeight: 900, color: '#1E293B', margin: '2px 0' }}>
                            {displayForm1Pct.toFixed(0)}%
                        </p>
                        <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#64748B' }}>
                            {pctForm1Real !== null ? 'Realizado' : 'Meta'}: {displayForm1Count} de {totals.form1 || totalStudents}
                        </span>
                    </div>

                    {/* 2ª Formativa Card */}
                    <div className="bg-white rounded-xl border border-amber-500 p-2.5 text-center print-keep-bg shadow-sm" style={{ border: '1.5px solid #F59E0B' }}>
                        <span style={{ fontSize: '8px', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', display: 'block' }}>2ª FORMATIVA</span>
                        <span style={{ fontSize: '6.5px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Agosto</span>
                        <p style={{ fontSize: '20px', fontWeight: 900, color: '#1E293B', margin: '2px 0' }}>
                            {displayForm2Pct.toFixed(0)}%
                        </p>
                        <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#64748B' }}>
                            {pctForm2Real !== null ? 'Realizado' : 'Meta'}: {displayForm2Count} de {totals.form2 || totalStudents}
                        </span>
                    </div>

                    {/* Somativa Card */}
                    <div className="bg-emerald-50 rounded-xl border border-emerald-500 p-2.5 text-center print-keep-bg shadow-sm" style={{ border: '1.5px solid #10B981', backgroundColor: '#ECFDF5' }}>
                        <span style={{ fontSize: '8px', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', display: 'block' }}>SOMATIVA</span>
                        <span style={{ fontSize: '6.5px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Novembro</span>
                        <p style={{ fontSize: '20px', fontWeight: 900, color: '#059669', margin: '2px 0' }}>
                            {displaySomativaPct.toFixed(0)}%
                        </p>
                        <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#047857' }}>
                            {pctSomativaReal !== null ? 'Realizado' : 'Meta'}: {displaySomativaCount} de {totals.somativa || totalStudents}
                        </span>
                    </div>
                </div>

                <p className="text-[7.5px] font-medium text-slate-500 mt-3 text-center leading-relaxed">
                    Metas progressivas de <strong>estudantes alfabetizados</strong> (Leitor Iniciante + Leitor Fluente), partindo do diagnóstico atual em direção à meta final do ano. Avaliações: 1ª Formativa (Maio), 2ª Formativa (Agosto) e Somativa (Novembro).
                </p>
            </div>

            {/* ====== FOOTER SIGNATURE & SYSTEM INFO ====== */}
            <div className="print-signatures flex justify-between items-center gap-6 mt-6">
                <div className="text-center flex-1">
                    <div className="border-t border-slate-900 w-full mb-1" />
                    <p style={{ fontSize: '6.5px', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>Professor(a) Aplicador(a)</p>
                </div>
                <div className="text-center flex-1">
                    <div className="border-t border-slate-900 w-full mb-1" />
                    <p style={{ fontSize: '6.5px', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>Coordenador(a) Pedagógico(a)</p>
                </div>
                <div className="text-center flex-1">
                    <div className="border-t border-slate-900 w-full mb-1" />
                    <p style={{ fontSize: '6.5px', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>Gestor(a) Escolar</p>
                </div>
            </div>

            <div className="print-footer flex justify-between items-center border-t border-slate-200 pt-2 mt-4" style={{ fontSize: '6px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                <span>SIGAR • SISTEMA INTEGRADO DE GESTÃO</span>
                <span>RELATÓRIO EMITIDO EM {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
        </div>
    );
};

export interface PrintableAlfabetometroReportProps {
    isOpen: boolean;
    schoolName: string;
    grade: string;
    year: number;
    records: any[];
}

export const PrintableAlfabetometroReport: React.FC<PrintableAlfabetometroReportProps> = ({
    isOpen,
    schoolName,
    grade,
    year,
    records = []
}) => {
    if (!isOpen) return null;

    return createPortal(
        <AlfabetometroDocumentView 
            schoolName={schoolName}
            grade={grade}
            year={year}
            records={records}
            isInline={false}
        />,
        document.body
    );
};
