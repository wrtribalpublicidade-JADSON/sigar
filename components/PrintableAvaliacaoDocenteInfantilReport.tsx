import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Aluno } from '../types';

interface ObjectiveDef {
  code: string;
  short: string;
  desc: string;
}

interface PrintableAvaliacaoDocenteInfantilReportProps {
  escolaNome: string;
  grupoFaixaEtaria: string;
  turmaNome: string;
  turno?: string;
  periodoBimestre: string;
  campoExperiencia: string;
  students: Aluno[];
  objectives: ObjectiveDef[];
  evaluations: Record<string, 'D' | 'ED' | 'ND'>;
  stats: {
    completionRate: number;
    consolidationRate: number;
    pending: number;
  };
  onClose: () => void;
}

export const PrintableAvaliacaoDocenteInfantilReport: React.FC<PrintableAvaliacaoDocenteInfantilReportProps> = ({
  escolaNome,
  grupoFaixaEtaria,
  turmaNome,
  turno,
  periodoBimestre,
  campoExperiencia,
  students,
  objectives,
  evaluations,
  stats,
  onClose
}) => {
  const currentYear = new Date().getFullYear();
  const emissionDate = new Date().toLocaleDateString('pt-BR');
  const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 400);

    const handleAfterPrint = () => {
      onClose();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClose]);

  // Calculate objective summary statistics
  const objectiveStats = objectives.map(obj => {
    let dCount = 0;
    let edCount = 0;
    let ndCount = 0;

    students.forEach(student => {
      const conc = evaluations[`${student.id}_${obj.code}`];
      if (conc === 'D') dCount++;
      else if (conc === 'ED') edCount++;
      else if (conc === 'ND') ndCount++;
    });

    const evaluated = dCount + edCount + ndCount;
    const consolidationPercent = evaluated > 0 ? Math.round(((dCount * 2 + edCount) / (evaluated * 2)) * 100) : 0;

    return {
      ...obj,
      dCount,
      edCount,
      ndCount,
      evaluated,
      consolidationPercent
    };
  });

  return createPortal(
    <div id="print-report" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", padding: '20pt 24pt 40pt 24pt' }}>
      
      {/* ====== INSTITUTIONAL HEADER ====== */}
      <div className="text-center mb-4 pb-3" style={{ borderBottom: '2.5pt solid #0f172a' }}>
        <p style={{ fontSize: '8pt', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '2pt' }}>
          Estado do Maranhão
        </p>
        <p style={{ fontSize: '11pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '2pt' }}>
          Prefeitura Municipal de Humberto de Campos
        </p>
        <p style={{ fontSize: '8.5pt', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '8pt' }}>
          Secretaria Municipal de Educação • SIGAR
        </p>
        <div style={{ width: '80pt', height: '2pt', background: '#f97316', margin: '0 auto 6pt' }} />
        <h1 style={{ fontSize: '14pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#0f172a', margin: '0 0 3pt' }}>
          Relatório de Avaliação Docente - Educação Infantil
        </h1>
        <p style={{ fontSize: '8.5pt', fontWeight: 800, color: '#ea580c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Diário de Classe • Acompanhamento BNCC ({currentYear})
        </p>
      </div>

      {/* ====== IDENTIFICATION & SUMMARY BLOCK ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '12pt' }}>
        <div style={{ fontSize: '8.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
          Identificação da Turma e Campo de Experiência
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', width: '20%', background: '#f8fafc' }}>
                Unidade Escolar
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '9.5pt', fontWeight: 900, color: '#0f172a' }} colSpan={3}>
                {escolaNome}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', background: '#f8fafc' }}>
                Grupo / Turma
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                {grupoFaixaEtaria} • {turmaNome} {turno ? `(${turno})` : ''}
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', width: '18%', background: '#f8fafc' }}>
                Período Avaliativo
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>
                {periodoBimestre}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', background: '#f8fafc' }}>
                Campo de Experiência
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }} colSpan={3}>
                {campoExperiencia}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', background: '#f8fafc' }}>
                Indicadores Globais
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#334155' }} colSpan={3}>
                <strong>{students.length}</strong> Estudantes • Preenchimento: <strong>{stats.completionRate}%</strong> • Consolidação Média: <strong>{stats.consolidationRate}%</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== EVALUATION TABLE PER STUDENT ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '14pt' }}>
        <div style={{ fontSize: '8.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
          Avaliação dos Estudantes por Objetivo de Aprendizagem
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '5%', color: '#334155' }}>
                #
              </th>
              <th style={{ padding: '6pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'left', color: '#334155' }}>
                Estudante
              </th>
              {objectives.map(obj => (
                <th key={obj.code} style={{ padding: '6pt 3pt', border: '0.5pt solid #cbd5e1', fontSize: '7pt', fontWeight: 900, textAlign: 'center', color: '#ea580c', width: `${Math.floor(70 / Math.max(objectives.length, 1))}%` }}>
                  <div>{obj.code}</div>
                  <div style={{ fontSize: '6.5pt', fontWeight: 600, color: '#64748b', textTransform: 'lowercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{obj.short}</div>
                </th>
              ))}
              <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '12%', color: '#0f172a', background: '#e2e8f0' }}>
                Consolidação
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => {
              let totalScore = 0;
              let objEvaluatedCount = 0;

              objectives.forEach(obj => {
                const concept = evaluations[`${student.id}_${obj.code}`];
                if (concept) {
                  objEvaluatedCount++;
                  if (concept === 'D') totalScore += 2;
                  else if (concept === 'ED') totalScore += 1;
                }
              });

              const studentConsolidation = objEvaluatedCount > 0 
                ? Math.round((totalScore / (objEvaluatedCount * 2)) * 100) 
                : 0;

              return (
                <tr key={student.id}>
                  <td style={{ padding: '5pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '8pt', fontWeight: 700, textAlign: 'center', color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                    {student.name}
                  </td>
                  {objectives.map(obj => {
                    const conc = evaluations[`${student.id}_${obj.code}`];
                    const bg = conc === 'D' ? '#dcfce7' : conc === 'ED' ? '#dbeafe' : conc === 'ND' ? '#f1f5f9' : '#ffffff';
                    const fg = conc === 'D' ? '#15803d' : conc === 'ED' ? '#1d4ed8' : conc === 'ND' ? '#475569' : '#94a3b8';

                    return (
                      <td key={obj.code} style={{ padding: '5pt 3pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 900, textAlign: 'center', background: bg, color: fg }}>
                        {conc || '-'}
                      </td>
                    );
                  })}
                  <td style={{ padding: '5pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 900, textAlign: 'center', color: studentConsolidation >= 80 ? '#15803d' : studentConsolidation >= 50 ? '#1d4ed8' : '#b91c1c', background: '#f8fafc' }}>
                    {studentConsolidation}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ====== OBJECTIVES DETAILED SUMMARY ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '16pt' }}>
        <div style={{ fontSize: '8.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#ea580c', color: '#fff', padding: '5pt 10pt' }}>
          Descrição dos Objetivos de Aprendizagem e Alcance (BNCC)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '5pt 6pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '12%', color: '#334155' }}>
                Código
              </th>
              <th style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'left', color: '#334155' }}>
                Descrição Detalhada do Objetivo (BNCC)
              </th>
              <th style={{ padding: '5pt 6pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '22%', color: '#334155' }}>
                Distribuição (D / ED / ND)
              </th>
              <th style={{ padding: '5pt 6pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '12%', color: '#334155' }}>
                Alcance
              </th>
            </tr>
          </thead>
          <tbody>
            {objectiveStats.map(obj => (
              <tr key={obj.code}>
                <td style={{ padding: '5pt 6pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 900, textAlign: 'center', color: '#ea580c' }}>
                  {obj.code}
                </td>
                <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8pt', color: '#334155', lineHeight: 1.3 }}>
                  {obj.desc}
                </td>
                <td style={{ padding: '5pt 6pt', border: '0.5pt solid #cbd5e1', fontSize: '8pt', fontWeight: 700, textAlign: 'center', color: '#334155' }}>
                  <span style={{ color: '#15803d', fontWeight: 900 }}>D: {obj.dCount}</span> • <span style={{ color: '#1d4ed8', fontWeight: 900 }}>ED: {obj.edCount}</span> • <span style={{ color: '#475569', fontWeight: 900 }}>ND: {obj.ndCount}</span>
                </td>
                <td style={{ padding: '5pt 6pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 900, textAlign: 'center', color: '#0f172a' }}>
                  {obj.consolidationPercent}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ====== LEGENDA ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '20pt', border: '0.5pt solid #cbd5e1', padding: '8pt 12pt', background: '#f8fafc', borderRadius: '4pt' }}>
        <p style={{ margin: 0, fontSize: '8pt', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>
          Legenda dos Conceitos Avaliativos:
        </p>
        <p style={{ margin: '3pt 0 0', fontSize: '8pt', color: '#475569', lineHeight: 1.4 }}>
          <strong>D</strong> = Desenvolvido (Estudante demonstra autonomia e consolidação da habilidade) | <strong>ED</strong> = Em Desenvolvimento (Estudante apresenta a habilidade com auxílio) | <strong>ND</strong> = Não Desenvolvido (Habilidade ainda não manifestada no período).
        </p>
      </div>

      {/* ====== OFFICIAL SIGNATURES ====== */}
      <div className="print-avoid-break" style={{ marginTop: '35pt' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30pt' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '80%', margin: '0 auto 4pt', borderBottom: '1pt solid #0f172a' }} />
            <p style={{ fontSize: '8.5pt', fontWeight: 900, color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
              Professor(a) Regente
            </p>
            <p style={{ fontSize: '7.5pt', fontWeight: 700, color: '#64748b', margin: '2pt 0 0', textTransform: 'uppercase' }}>
              Docente Responsável pela Avaliação
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '80%', margin: '0 auto 4pt', borderBottom: '1pt solid #0f172a' }} />
            <p style={{ fontSize: '8.5pt', fontWeight: 900, color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
              Secretaria / Coordenação Pedagógica
            </p>
            <p style={{ fontSize: '7.5pt', fontWeight: 700, color: '#64748b', margin: '2pt 0 0', textTransform: 'uppercase' }}>
              Secretário(a) / Coordenador(a) Pedagógico(a)
            </p>
          </div>
        </div>
      </div>

    </div>,
    document.body
  );
};
