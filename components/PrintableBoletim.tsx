import React from 'react';
import { createPortal } from 'react-dom';

interface StudentGrade {
  id: string | number;
  name: string;
  av1: number | '';
  av2: number | '';
  qualitativa: number | '';
  recuperacao: number | '';
  mediaFinal: number;
}

interface GradeSheet {
  id: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  componente: string;
  bimestre: string;
  mediaTurma: number;
  taxaAprovacao: number;
  students: StudentGrade[];
  criadoEm: string;
}

interface PrintableBoletimProps {
  sheet: GradeSheet;
}

export const PrintableBoletim: React.FC<PrintableBoletimProps> = ({ sheet }) => {
  const emissionDate = new Date().toLocaleDateString('pt-BR');
  const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const sheetDate = sheet.criadoEm 
    ? new Date(sheet.criadoEm).toLocaleDateString('pt-BR') 
    : emissionDate;

  const formatValue = (val: number | '') => {
    if (val === '') return '-';
    return Number(val).toFixed(1);
  };

  return createPortal(
    <div id="print-report" className="hidden print:block bg-white text-slate-900 p-2" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      
      {/* ====== INSTITUTIONAL HEADER ====== */}
      <div className="text-center mb-4 pb-3" style={{ borderBottom: '2pt solid #0f172a' }}>
        <p style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '2pt' }}>
          Estado do Maranhão
        </p>
        <p style={{ fontSize: '10pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '2pt' }}>
          Prefeitura Municipal de Humberto de Campos
        </p>
        <p style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '10pt' }}>
          Secretaria Municipal de Educação
        </p>
        <div style={{ width: '60pt', height: '1.5pt', background: '#f97316', margin: '0 auto 6pt' }} />
        <h1 style={{ fontSize: '14pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 4pt' }}>
          Pauta de Notas e Fechamento
        </h1>
        <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Diário de Classe • Controle de Rendimento Escolar
        </p>
      </div>

      {/* ====== IDENTIFICATION BLOCK ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '12pt' }}>
        <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt', marginBottom: '0' }}>
          Identificação da Turma e Componente
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '22%', background: '#f8fafc' }}>
                Unidade Escolar
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9.5pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                {sheet.escolaNome}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                Turma / Turno
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                {sheet.turmaNome}
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '18%', background: '#f8fafc' }}>
                Período
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#334155' }}>
                {sheet.bimestre}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                Comp. Curricular
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#f97316' }}>
                {sheet.componente}
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                Data de Lançamento
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                {sheetDate}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== GRADES TABLE ====== */}
      <div style={{ marginBottom: '14pt' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '0.5pt solid #e2e8f0' }}>
          <thead>
            <tr style={{ background: '#0f172a' }}>
              <th style={{ padding: '6pt 8pt', fontSize: '7.5pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center', width: '6%' }}>Nº</th>
              <th style={{ padding: '6pt 8pt', fontSize: '7.5pt', color: '#fff', textTransform: 'uppercase', textAlign: 'left', width: '44%' }}>Estudante</th>
              <th style={{ padding: '6pt 8pt', fontSize: '7.5pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center', width: '9%' }}>AV1</th>
              <th style={{ padding: '6pt 8pt', fontSize: '7.5pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center', width: '9%' }}>AV2</th>
              <th style={{ padding: '6pt 8pt', fontSize: '7.5pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center', width: '10%' }}>Qualitativa</th>
              <th style={{ padding: '6pt 8pt', fontSize: '7.5pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center', width: '11%' }}>Recuperação</th>
              <th style={{ padding: '6pt 8pt', fontSize: '7.5pt', color: '#fff', textTransform: 'uppercase', textAlign: 'center', width: '11%' }}>Média Final</th>
            </tr>
          </thead>
          <tbody>
            {sheet.students.map((student, idx) => {
              const isApproved = student.mediaFinal >= 6.0;
              return (
                <tr key={student.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '0.5pt solid #e2e8f0' }}>
                  <td style={{ padding: '5pt 8pt', fontSize: '8pt', fontWeight: 700, color: '#64748b', textAlign: 'center' }}>
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td style={{ padding: '5pt 8pt', fontSize: '8.5pt', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                    {student.name}
                  </td>
                  <td style={{ padding: '5pt 8pt', fontSize: '8.5pt', color: '#475569', textAlign: 'center' }}>
                    {formatValue(student.av1)}
                  </td>
                  <td style={{ padding: '5pt 8pt', fontSize: '8.5pt', color: '#475569', textAlign: 'center' }}>
                    {formatValue(student.av2)}
                  </td>
                  <td style={{ padding: '5pt 8pt', fontSize: '8.5pt', color: '#475569', textAlign: 'center' }}>
                    {formatValue(student.qualitativa)}
                  </td>
                  <td style={{ padding: '5pt 8pt', fontSize: '8.5pt', color: '#b45309', textAlign: 'center', fontWeight: student.recuperacao !== '' ? 700 : 400 }}>
                    {formatValue(student.recuperacao)}
                  </td>
                  <td style={{ padding: '5pt 8pt', fontSize: '9pt', fontWeight: 900, color: isApproved ? '#059669' : '#e11d48', textAlign: 'center' }}>
                    {Number(student.mediaFinal).toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ====== PERFORMANCE SUMMARY ====== */}
      <div className="print-avoid-break" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15pt', marginBottom: '16pt' }}>
        <div style={{ padding: '8pt 12pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', borderRadius: '4pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Média Geral da Turma
          </span>
          <span style={{ fontSize: '13pt', fontWeight: 900, color: sheet.mediaTurma >= 6.0 ? '#059669' : '#b45309' }}>
            {Number(sheet.mediaTurma).toFixed(1)}
          </span>
        </div>
        <div style={{ padding: '8pt 12pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', borderRadius: '4pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Taxa de Aprovação
          </span>
          <span style={{ fontSize: '13pt', fontWeight: 900, color: '#059669' }}>
            {sheet.taxaAprovacao}%
          </span>
        </div>
      </div>

      {/* ====== SIGNATURES ====== */}
      <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20pt', paddingTop: '30pt', marginBottom: '10pt' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1pt solid #0f172a', width: '100%', marginBottom: '4pt' }} />
          <p style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase', color: '#334155' }}>Professor(a) Regente</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1pt solid #0f172a', width: '100%', marginBottom: '4pt' }} />
          <p style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase', color: '#334155' }}>Coordenação Pedagógica</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1pt solid #0f172a', width: '100%', marginBottom: '4pt' }} />
          <p style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase', color: '#334155' }}>Direção Escolar</p>
        </div>
      </div>

      {/* ====== FOOTER ====== */}
      <div className="print-footer" style={{ marginTop: '20pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '6pt' }}>
        <span>SIGAR • Sistema Integrado de Gestão</span>
        <span>Relatório Gerado em {emissionDate} às {emissionTime}</span>
      </div>
    </div>,
    document.body
  );
};
