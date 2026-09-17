import React from 'react';
import { createPortal } from 'react-dom';
import { Escola, Coordenador, RecursoHumano } from '../types';

interface PrintableSchoolTeachersReportProps {
  escola: Escola;
  teachers: Coordenador[];
  turmas: any[];
  coordenador?: Coordenador;
}

export const PrintableSchoolTeachersReport: React.FC<PrintableSchoolTeachersReportProps> = ({
  escola,
  teachers,
  turmas,
  coordenador,
}) => {
  const emissionDate = new Date().toLocaleDateString('pt-BR');
  const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Map each teacher to their RH record in this school (if registered)
  const getTeacherRh = (teacher: Coordenador): RecursoHumano | undefined => {
    const rhs = escola.recursosHumanos || [];
    return rhs.find(r =>
      (r.email && teacher.contato && r.email.toLowerCase().trim() === teacher.contato.toLowerCase().trim()) ||
      (r.cpf && teacher.cpf && r.cpf.replace(/\D/g, '') === teacher.cpf.replace(/\D/g, '')) ||
      (r.nome && teacher.nome && r.nome.toLowerCase().trim() === teacher.nome.toLowerCase().trim())
    );
  };

  // Compute stats
  const totalProfessores = teachers.length;
  const professoresComTurmas = teachers.filter(t => (t.turmasIds || []).length > 0).length;
  const turmasAtendidasIds = new Set(teachers.flatMap(t => t.turmasIds || []));
  const totalTurmasAtendidas = turmasAtendidasIds.size;

  let efetivosCount = 0;
  let contratadosCount = 0;
  let permutadosCount = 0;

  teachers.forEach(t => {
    const rh = getTeacherRh(t);
    if (rh?.tipoVinculo === 'Efetivo') efetivosCount++;
    else if (rh?.tipoVinculo === 'Contratado') contratadosCount++;
    else if (rh?.tipoVinculo === 'Permutado') permutadosCount++;
  });

  const sortedTeachers = [...teachers].sort((a, b) => a.nome.localeCompare(b.nome));

  return createPortal(
    <div id="print-report" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

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
        <h1 style={{ fontSize: '15pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 3pt' }}>
          Quadro de Lotação Docente e Vínculo de Turmas
        </h1>
        <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Relação de Professores, Turmas e Componentes Curriculares
        </p>
      </div>

      {/* ====== SCHOOL & EMISSION INFO ====== */}
      <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6pt 10pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '10pt' }}>
        <div>
          <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
            Unidade Escolar
          </p>
          <p style={{ fontSize: '11pt', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em', margin: 0 }}>
            {escola.nome}
          </p>
          <div style={{ fontSize: '7pt', color: '#64748b', marginTop: '2pt', display: 'flex', gap: '12pt' }}>
            {escola.gestor && <span><strong>Gestor(a):</strong> {escola.gestor}</span>}
            {escola.localizacao && <span><strong>Localização:</strong> {escola.localizacao}</span>}
            {escola.polo && <span><strong>Polo:</strong> {escola.polo}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
            Emissão do Sistema
          </p>
          <p style={{ fontSize: '9pt', fontWeight: 600, color: '#475569', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
            {emissionDate} às {emissionTime}
          </p>
        </div>
      </div>

      {/* ====== SUMMARY STATISTICS ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '12pt', display: 'flex', gap: '8pt' }}>
        <div style={{ flex: 1, padding: '6pt 8pt', border: '0.5pt solid #e2e8f0', background: '#f1f5f9' }}>
          <p style={{ fontSize: '6.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2pt' }}>Total Professores</p>
          <p style={{ fontSize: '13pt', fontWeight: 900, color: '#0f172a', margin: 0 }}>{totalProfessores}</p>
        </div>
        <div style={{ flex: 1, padding: '6pt 8pt', border: '0.5pt solid #e2e8f0', background: '#ecfdf5' }}>
          <p style={{ fontSize: '6.5pt', fontWeight: 800, color: '#047857', textTransform: 'uppercase', marginBottom: '2pt' }}>Com Turmas</p>
          <p style={{ fontSize: '13pt', fontWeight: 900, color: '#065f46', margin: 0 }}>{professoresComTurmas}</p>
        </div>
        <div style={{ flex: 1, padding: '6pt 8pt', border: '0.5pt solid #e2e8f0', background: '#eff6ff' }}>
          <p style={{ fontSize: '6.5pt', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '2pt' }}>Turmas Atendidas</p>
          <p style={{ fontSize: '13pt', fontWeight: 900, color: '#1e40af', margin: 0 }}>{totalTurmasAtendidas}</p>
        </div>
        {efetivosCount > 0 && (
          <div style={{ flex: 1, padding: '6pt 8pt', border: '0.5pt solid #e2e8f0', background: '#f0fdf4' }}>
            <p style={{ fontSize: '6.5pt', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '2pt' }}>Efetivos</p>
            <p style={{ fontSize: '13pt', fontWeight: 900, color: '#14532d', margin: 0 }}>{efetivosCount}</p>
          </div>
        )}
        {contratadosCount > 0 && (
          <div style={{ flex: 1, padding: '6pt 8pt', border: '0.5pt solid #e2e8f0', background: '#fff7ed' }}>
            <p style={{ fontSize: '6.5pt', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', marginBottom: '2pt' }}>Contratados</p>
            <p style={{ fontSize: '13pt', fontWeight: 900, color: '#9a3412', margin: 0 }}>{contratadosCount}</p>
          </div>
        )}
        {permutadosCount > 0 && (
          <div style={{ flex: 1, padding: '6pt 8pt', border: '0.5pt solid #e2e8f0', background: '#f5f3ff' }}>
            <p style={{ fontSize: '6.5pt', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '2pt' }}>Permutados</p>
            <p style={{ fontSize: '13pt', fontWeight: 900, color: '#5b21b6', margin: 0 }}>{permutadosCount}</p>
          </div>
        )}
      </div>

      {/* ====== LISTING OF TEACHERS ====== */}
      <div style={{ marginBottom: '14pt' }}>
        <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
          Relação Docente e Atribuições
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '5pt 6pt', border: '0.5pt solid #cbd5e1', fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', background: '#f8fafc', textAlign: 'center', width: '4%' }}>Nº</th>
              <th style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', background: '#f8fafc', textAlign: 'left', width: '28%' }}>Professor / Contato</th>
              <th style={{ padding: '5pt 6pt', border: '0.5pt solid #cbd5e1', fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', background: '#f8fafc', textAlign: 'center', width: '14%' }}>Vínculo / C.H.</th>
              <th style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '6.5pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', background: '#f8fafc', textAlign: 'left', width: '54%' }}>Turmas e Componentes Vinculados</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeachers.map((teacher, index) => {
              const rh = getTeacherRh(teacher);
              const teacherTurmas = turmas.filter(t => (teacher.turmasIds || []).includes(t.id));

              return (
                <tr key={teacher.id} style={{ pageBreakInside: 'avoid' }}>
                  <td style={{ padding: '4pt 6pt', border: '0.5pt solid #e2e8f0', fontSize: '7.5pt', fontWeight: 700, color: '#64748b', textAlign: 'center', verticalAlign: 'top' }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: '4pt 8pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{teacher.nome}</div>
                    {teacher.contato && (
                      <div style={{ fontSize: '6.5pt', color: '#2563eb', marginTop: '1pt' }}>{teacher.contato}</div>
                    )}
                    {rh?.telefone && (
                      <div style={{ fontSize: '6.5pt', color: '#64748b' }}>Tel: {rh.telefone}</div>
                    )}
                    {(teacher.cpf || rh?.cpf) && (
                      <div style={{ fontSize: '6.5pt', color: '#94a3b8' }}>CPF: {teacher.cpf || rh?.cpf}</div>
                    )}
                  </td>
                  <td style={{ padding: '4pt 6pt', border: '0.5pt solid #e2e8f0', fontSize: '7.5pt', textAlign: 'center', verticalAlign: 'top' }}>
                    {rh?.tipoVinculo ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '1pt 4pt',
                        borderRadius: '3pt',
                        fontSize: '6.5pt',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: rh.tipoVinculo === 'Efetivo' ? '#ecfdf5' : rh.tipoVinculo === 'Permutado' ? '#eff6ff' : '#fff7ed',
                        color: rh.tipoVinculo === 'Efetivo' ? '#047857' : rh.tipoVinculo === 'Permutado' ? '#1d4ed8' : '#c2410c',
                        border: '0.5pt solid currentColor',
                        marginBottom: '2pt'
                      }}>
                        {rh.tipoVinculo}
                      </span>
                    ) : (
                      <span style={{ fontSize: '6.5pt', color: '#94a3b8' }}>-</span>
                    )}
                    {rh?.cargaHoraria && (
                      <div style={{ fontSize: '6.5pt', fontWeight: 600, color: '#475569' }}>
                        C.H.: {rh.cargaHoraria}
                      </div>
                    )}
                    {rh?.etapaAtuacao && (
                      <div style={{ fontSize: '6pt', color: '#64748b' }}>
                        {rh.etapaAtuacao}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '4pt 8pt', border: '0.5pt solid #e2e8f0', fontSize: '7.5pt', verticalAlign: 'top' }}>
                    {teacherTurmas.length === 0 ? (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '7pt' }}>
                        Nenhuma turma vinculada nesta unidade escolar.
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3pt' }}>
                        {teacherTurmas.map(t => {
                          const comps = teacher.turmaComponentes?.[t.id] || [];
                          const turmaNome = `${(t.year || t.anoSerie) ? `${t.year || t.anoSerie} - ` : ''}${t.name || ''}`;
                          const turno = t.shift || t.turno || '';

                          return (
                            <div key={t.id} style={{
                              padding: '3pt 5pt',
                              background: '#f8fafc',
                              border: '0.5pt solid #e2e8f0',
                              borderRadius: '3pt'
                            }}>
                              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '7.5pt' }}>
                                🎓 {turmaNome} {turno ? `• ${turno}` : ''}
                              </div>
                              {comps.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2pt', marginTop: '2pt' }}>
                                  {comps.map(comp => (
                                    <span key={comp} style={{
                                      fontSize: '6pt',
                                      fontWeight: 700,
                                      padding: '1pt 3.5pt',
                                      borderRadius: '2pt',
                                      background: '#ffedd5',
                                      color: '#c2410c',
                                      border: '0.5pt solid #fed7aa',
                                      textTransform: 'uppercase'
                                    }}>
                                      {comp}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ fontSize: '6pt', color: '#94a3b8', fontStyle: 'italic' }}>
                                  Todos os componentes da turma
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {sortedTeachers.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '14pt', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '8.5pt' }}>
                  Nenhum professor vinculado a esta unidade escolar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ====== SIGNATURES ====== */}
      <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '24pt', pageBreakInside: 'avoid' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 5pt' }} />
          <p style={{ fontSize: '8.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', margin: '0 0 2pt' }}>
            {escola.gestor || 'Gestor(a) Escolar'}
          </p>
          <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
            GESTOR(A) ESCOLAR
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 5pt' }} />
          <p style={{ fontSize: '8.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', margin: '0 0 2pt' }}>
            {coordenador?.nome || 'Coordenação Pedagógica'}
          </p>
          <p style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
            SECRETARIA MUNICIPAL DE EDUCAÇÃO
          </p>
        </div>
      </div>

    </div>,
    document.body
  );
};
