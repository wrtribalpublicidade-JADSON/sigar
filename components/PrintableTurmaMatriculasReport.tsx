import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Escola, Aluno } from '../types';

interface PrintableTurmaMatriculasReportProps {
  escola: Escola;
  turma: {
    id?: string;
    name?: string;
    stage?: string;
    year?: string;
    anoSerie?: string;
    shift?: string;
    modality?: string;
  };
  professoresNomes?: string;
  students: Aluno[];
  onClose: () => void;
}

export const PrintableTurmaMatriculasReport: React.FC<PrintableTurmaMatriculasReportProps> = ({
  escola,
  turma,
  professoresNomes,
  students,
  onClose
}) => {
  const currentYear = new Date().getFullYear();
  const protocolNumber = (turma.id || '01').split('-')[0].toUpperCase();
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

  const turmaNomeCompleto = [
    turma.year || turma.anoSerie,
    turma.name
  ].filter(Boolean).join(' - ') || 'Turma Sem Nome';

  return createPortal(
    <div id="print-report" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", padding: '20pt 20pt 50pt 20pt' }}>
      
      {/* ====== INSTITUTIONAL HEADER ====== */}
      <div className="text-center mb-3 pb-3" style={{ borderBottom: '2pt solid #0f172a' }}>
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
        <h1 style={{ fontSize: '16pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 4pt' }}>
          Relatório da Turma — Nominal de Alunos
        </h1>
        <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Controle de Matrículas • Rede Municipal de Ensino ({currentYear})
        </p>
      </div>

      {/* ====== PROTOCOL & EMISSION ====== */}
      <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6pt 10pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '10pt' }}>
        <div>
          <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
            Identificação do Documento
          </p>
          <p style={{ fontSize: '13pt', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
            RELATÓRIO Nº TURMA-{protocolNumber}/{currentYear}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
            Emissão do Sistema
          </p>
          <p style={{ fontSize: '9pt', fontWeight: 600, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
            {emissionDate} às {emissionTime}
          </p>
        </div>
      </div>

      {/* ====== IDENTIFICATION BLOCK ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '14pt' }}>
        <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt', marginBottom: '0' }}>
          Dados de Identificação
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '22%', background: '#f8fafc' }}>
                Unidade Escolar
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                {escola.nome}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                Turma / Ano-Série
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#ea580c' }}>
                {turmaNomeCompleto}
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '18%', background: '#f8fafc' }}>
                Etapa & Turno
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                {turma.stage || 'Regular'} • {turma.shift || 'MANHÃ'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                Professor(a) Resp.
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                {professoresNomes || 'Não Atribuído'}
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                Gestor(a) / Coord.
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                {escola.gestor || escola.coordenador || 'N/A'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                Total de Alunos
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a' }}>
                {students.length} Estudante(s)
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                Status da Turma
              </td>
              <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>
                <span style={{ padding: '2pt 6pt', borderRadius: '12pt', fontSize: '7.5pt', fontWeight: 800, backgroundColor: '#d1fae5', color: '#047857' }}>
                  ATIVA
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== LISTA NOMINAL DE ESTUDANTES ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '14pt' }}>
        <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
          Lista Nominal de Estudantes
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '5%', textAlign: 'center' }}>
                Nº
              </th>
              <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '14%', textAlign: 'left' }}>
                Matrícula
              </th>
              <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'left' }}>
                Nome do Estudante
              </th>
              <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '14%', textAlign: 'left' }}>
                CPF
              </th>
              <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '12%', textAlign: 'center' }}>
                Status
              </th>
              <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '25%', textAlign: 'center' }}>
                Assinatura / Obs.
              </th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '15pt', border: '0.5pt solid #e2e8f0', textAlign: 'center', fontSize: '9pt', color: '#94a3b8', fontStyle: 'italic' }}>
                  Nenhum estudante matriculado nesta turma para o filtro selecionado.
                </td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr key={student.id || index}>
                  <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>
                    {student.registration_number || '---'}
                  </td>
                  <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a' }}>
                    {student.name}
                  </td>
                  <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>
                    {student.cpf || '---'}
                  </td>
                  <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', textAlign: 'center' }}>
                    <span style={{
                      padding: '2pt 6pt',
                      borderRadius: '12pt',
                      fontSize: '7.5pt',
                      fontWeight: 800,
                      backgroundColor: student.status === 'Ativo' ? '#d1fae5' : '#f1f5f9',
                      color: student.status === 'Ativo' ? '#047857' : '#64748b'
                    }}>
                      {student.status || 'Ativo'}
                    </span>
                  </td>
                  <td style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0' }}>
                    {/* Espaço para assinatura/observação */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ====== ASSINATURAS ====== */}
      <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '25pt', marginBottom: '40pt', pageBreakInside: 'avoid' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
          <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
            Professor(a) Responsável
          </p>
          <p style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', lineHeight: '1.4', wordBreak: 'break-word' }}>
            {professoresNomes || 'Docente Responsável'}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
          <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
            Gestão Escolar / Secretaria
          </p>
          <p style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', lineHeight: '1.4', wordBreak: 'break-word' }}>
            {escola.nome}
          </p>
        </div>
      </div>

      {/* ====== RODAPÉ ====== */}
      <div className="print-footer" style={{ marginTop: '30pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '7pt', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', borderTop: '0.5pt solid #cbd5e1', paddingTop: '6pt', paddingBottom: '6pt', backgroundColor: '#ffffff' }}>
        <span>SIGAR • SISTEMA INTEGRADO DE GESTÃO E ACOMPANHAMENTO REGIONAL</span>
        <span>SECRETARIA MUNICIPAL DE EDUCAÇÃO • HUMBERTO DE CAMPOS/MA</span>
      </div>
    </div>,
    document.body
  );
};
