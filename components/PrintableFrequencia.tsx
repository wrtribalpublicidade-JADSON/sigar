import React from 'react';
import { createPortal } from 'react-dom';

interface StudentAttendance {
  id: string | number;
  name: string;
  present: boolean;
}

interface AttendanceSheet {
  id: string;
  data: string;
  escolaId: string;
  escolaNome: string;
  turmaId: string;
  turmaNome: string;
  anoSerie?: string;
  componente: string;
  bimestre?: string;
  presentesCount: number;
  totalCount: number;
  rate: number;
  students: StudentAttendance[];
  criadoEm: string;
  professor?: string;
}

interface PrintableFrequenciaProps {
  sheet: AttendanceSheet | null;
}

export const PrintableFrequencia: React.FC<PrintableFrequenciaProps> = ({ sheet }) => {
  if (!sheet) return null;

  const emissionDate = new Date().toLocaleDateString('pt-BR');
  const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const sheetFormattedDate = sheet.data 
    ? new Date(sheet.data + 'T12:00:00').toLocaleDateString('pt-BR') 
    : emissionDate;

  const absentsCount = sheet.totalCount - sheet.presentesCount;

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
          Relatório de Frequência Escolar
        </h1>
        <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Diário de Classe • Pauta de Controle de Assiduidade
        </p>
      </div>

      {/* ====== IDENTIFICATION BLOCK ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '12pt' }}>
        <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt', marginBottom: '0' }}>
          Identificação da Turma e Frequência
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
                Ano / Turma / Turno
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                {sheet.anoSerie ? `${sheet.anoSerie} • ${sheet.turmaNome}` : sheet.turmaNome}
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '18%', background: '#f8fafc' }}>
                Data da Chamada
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#334155' }}>
                {sheetFormattedDate}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                Comp. Curricular
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9.5pt', fontWeight: 800, color: '#ea580c' }}>
                {sheet.componente}
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                Professor(a) / Resp.
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8.5pt', fontWeight: 600, color: '#334155' }}>
                {sheet.professor || '---'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== SUMMARY METRICS ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '12pt', display: 'flex', gap: '8pt' }}>
        <div style={{ flex: 1, border: '0.5pt solid #cbd5e1', borderRadius: '4pt', padding: '6pt 8pt', textAlign: 'center', background: '#f8fafc' }}>
          <p style={{ margin: 0, fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Total Estudantes</p>
          <p style={{ margin: '2pt 0 0', fontSize: '12pt', fontWeight: 900, color: '#0f172a' }}>{sheet.totalCount}</p>
        </div>
        <div style={{ flex: 1, border: '0.5pt solid #bbf7d0', borderRadius: '4pt', padding: '6pt 8pt', textAlign: 'center', background: '#f0fdf4' }}>
          <p style={{ margin: 0, fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', color: '#166534' }}>Presentes</p>
          <p style={{ margin: '2pt 0 0', fontSize: '12pt', fontWeight: 900, color: '#15803d' }}>{sheet.presentesCount}</p>
        </div>
        <div style={{ flex: 1, border: '0.5pt solid #fecaca', borderRadius: '4pt', padding: '6pt 8pt', textAlign: 'center', background: '#fef2f2' }}>
          <p style={{ margin: 0, fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', color: '#991b1b' }}>Ausentes</p>
          <p style={{ margin: '2pt 0 0', fontSize: '12pt', fontWeight: 900, color: '#dc2626' }}>{absentsCount}</p>
        </div>
        <div style={{ flex: 1, border: '0.5pt solid #fed7aa', borderRadius: '4pt', padding: '6pt 8pt', textAlign: 'center', background: '#fff7ed' }}>
          <p style={{ margin: 0, fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', color: '#c2410c' }}>Índice Frequência</p>
          <p style={{ margin: '2pt 0 0', fontSize: '12pt', fontWeight: 900, color: '#ea580c' }}>{sheet.rate}%</p>
        </div>
      </div>

      {/* ====== STUDENTS LIST TABLE ====== */}
      <div style={{ marginBottom: '16pt' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
          <thead>
            <tr style={{ background: '#0f172a', backgroundColor: '#0f172a', color: '#ffffff' }}>
              <th style={{ padding: '5.5pt 8pt', border: '0.5pt solid #0f172a', background: '#0f172a', backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'center', width: '35pt', fontWeight: 900, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.04em', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>#</th>
              <th style={{ padding: '5.5pt 8pt', border: '0.5pt solid #0f172a', background: '#0f172a', backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'left', fontWeight: 900, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.04em', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Nome do Estudante</th>
              <th style={{ padding: '5.5pt 8pt', border: '0.5pt solid #0f172a', background: '#0f172a', backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'center', width: '110pt', fontWeight: 900, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.04em', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Status Frequência</th>
            </tr>
          </thead>
          <tbody>
            {(sheet.students || []).map((student, idx) => (
              <tr key={student.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 700, color: '#1e293b' }}>
                  {student.name}
                </td>
                <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', textAlign: 'center', fontWeight: 900 }}>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '1.5pt 8pt',
                    borderRadius: '10pt',
                    fontSize: '7.5pt',
                    letterSpacing: '0.05em',
                    background: student.present ? '#dcfce7' : '#fee2e2',
                    color: student.present ? '#15803d' : '#b91c1c'
                  }}>
                    {student.present ? 'PRESENTE' : 'AUSENTE'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ====== SIGNATURE BLOCK ====== */}
      <div className="print-avoid-break" style={{ marginTop: '24pt', paddingTop: '10pt' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '30pt' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderTop: '1pt solid #0f172a', paddingTop: '4pt', fontSize: '8pt', fontWeight: 800, textTransform: 'uppercase', color: '#334155' }}>
              Assinatura do(a) Professor(a)
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderTop: '1pt solid #0f172a', paddingTop: '4pt', fontSize: '8pt', fontWeight: 800, textTransform: 'uppercase', color: '#334155' }}>
              Visto da Coordenação Pedagógica
            </div>
          </div>
        </div>

        {/* FOOTER METADATA */}
        <div style={{ marginTop: '20pt', borderTop: '0.5pt solid #e2e8f0', paddingTop: '6pt', display: 'flex', justifyContent: 'space-between', fontSize: '7pt', color: '#94a3b8', fontWeight: 600 }}>
          <span>SIGAR - Sistema Integrado de Gestão Aprendizagem e Rendimento</span>
          <span>Impresso em: {emissionDate} às {emissionTime}</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
