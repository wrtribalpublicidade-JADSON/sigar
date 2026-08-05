import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Escola, Aluno } from '../types';
import { supabase } from '../services/supabase';
import { isEducaInfantilYear } from '../utils';

interface PrintableBoletimIndividualEstudanteProps {
  escola: Escola;
  student: Aluno;
  turmaInfo?: string;
  onClose: () => void;
}

interface ComponentGrade {
  componente: string;
  bim1: number | '';
  bim2: number | '';
  bim3: number | '';
  bim4: number | '';
  mediaAnual: number | '';
  recuperacaoFinal: number | '';
  mediaFinal: number | '';
  faltas: number;
  situacao: string;
}

const DEFAULT_COMPONENTES_FUNDAMENTAL = [
  'Língua Portuguesa',
  'Matemática',
  'Ciências',
  'História',
  'Geografia',
  'Arte',
  'Educação Física',
  'Língua Inglesa',
  'Ensino Religioso'
];

const CAMPOS_EXPERIENCIA_INFANTIL = [
  'O EU, O OUTRO E O NÓS',
  'CORPO, GESTOS E MOVIMENTOS',
  'TRAÇOS, SONS, CORES E FORMAS',
  'ESCUTA, FALA, PENSAMENTO E IMAGINAÇÃO',
  'ESPAÇOS, TEMPOS, QUANTIDADES, RELAÇÕES E TRANSFORMAÇÕES'
];

export const PrintableBoletimIndividualEstudante: React.FC<PrintableBoletimIndividualEstudanteProps> = ({
  escola,
  student,
  turmaInfo = '',
  onClose
}) => {
  const [gradesData, setGradesData] = useState<ComponentGrade[]>([]);
  const [infantilConcepts, setInfantilConcepts] = useState<Record<string, Record<number, string>>>({});
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const emissionDate = new Date().toLocaleDateString('pt-BR');
  const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const isInfantil = isEducaInfantilYear(student.stage || '') || isEducaInfantilYear(turmaInfo || '');

  useEffect(() => {
    let isMounted = true;

    const fetchStudentGrades = async () => {
      setIsLoading(true);
      try {
        if (isInfantil) {
          // Fetch infantil evaluation concepts from DB if present
          const { data, error } = await supabase
            .from('pareceres_infantil')
            .select('*')
            .eq('student_id', student.id);

          if (!error && data && data.length > 0) {
            const map: Record<string, Record<number, string>> = {};
            data.forEach((item: any) => {
              const campo = item.campo_experiencia || item.campo;
              const bim = Number(item.bimestre) || 1;
              const conc = item.conceito || 'D';
              if (campo) {
                if (!map[campo]) map[campo] = {};
                map[campo][bim] = conc;
              }
            });
            if (isMounted) setInfantilConcepts(map);
          }
        } else {
          // Fetch Ensino Fundamental grades from notas_sheets
          let query = supabase
            .from('notas_sheets')
            .select('*')
            .eq('ativo', true);

          if (student.class_id) {
            query = query.eq('turma_id', student.class_id);
          } else if (escola.id) {
            query = query.eq('escola_id', escola.id);
          }

          const { data, error } = await query;
          if (error) throw error;

          const studentIdStr = String(student.id);
          const studentNameLower = (student.name || '').toLowerCase().trim();

          const compMap: Record<string, { bim1: any; bim2: any; bim3: any; bim4: any; recup: any }> = {};

          DEFAULT_COMPONENTES_FUNDAMENTAL.forEach(comp => {
            compMap[comp] = { bim1: '', bim2: '', bim3: '', bim4: '', recup: '' };
          });

          if (data && data.length > 0) {
            data.forEach((sheet: any) => {
              const comp = sheet.componente || 'Geral';
              const bimStr = String(sheet.bimestre || '');
              let bimNum = 1;
              if (bimStr.includes('1')) bimNum = 1;
              else if (bimStr.includes('2')) bimNum = 2;
              else if (bimStr.includes('3')) bimNum = 3;
              else if (bimStr.includes('4')) bimNum = 4;

              const studentEntry = (sheet.students || []).find((s: any) =>
                String(s.id) === studentIdStr ||
                (s.name && String(s.name).toLowerCase().trim() === studentNameLower)
              );

              if (studentEntry) {
                if (!compMap[comp]) {
                  compMap[comp] = { bim1: '', bim2: '', bim3: '', bim4: '', recup: '' };
                }

                const media = studentEntry.mediaFinal !== undefined && studentEntry.mediaFinal !== ''
                  ? Number(studentEntry.mediaFinal)
                  : '';

                if (bimNum === 1) compMap[comp].bim1 = media;
                else if (bimNum === 2) compMap[comp].bim2 = media;
                else if (bimNum === 3) compMap[comp].bim3 = media;
                else if (bimNum === 4) compMap[comp].bim4 = media;

                if (studentEntry.recuperacao !== undefined && studentEntry.recuperacao !== '') {
                  compMap[comp].recup = Number(studentEntry.recuperacao);
                }
              }
            });
          }

          // Build final component grades list
          const formatted: ComponentGrade[] = Object.keys(compMap).map(comp => {
            const item = compMap[comp];
            const validMediaVals = [item.bim1, item.bim2, item.bim3, item.bim4].filter(v => typeof v === 'number') as number[];
            
            const mediaAnualVal = validMediaVals.length > 0
              ? Number((validMediaVals.reduce((a, b) => a + b, 0) / validMediaVals.length).toFixed(1))
              : '';

            const recupVal = typeof item.recup === 'number' ? item.recup : '';
            
            let mediaFinalVal: number | '' = mediaAnualVal;
            if (recupVal !== '' && typeof mediaAnualVal === 'number') {
              mediaFinalVal = Math.max(mediaAnualVal, Number(recupVal));
            }

            let situacao = 'Em Andamento';
            if (validMediaVals.length === 4) {
              situacao = (typeof mediaFinalVal === 'number' && mediaFinalVal >= 6.0) ? 'Aprovado(a)' : 'Retido(a)';
            } else if (typeof mediaFinalVal === 'number' && mediaFinalVal >= 6.0) {
              situacao = 'Desempenho Adequado';
            }

            return {
              componente: comp,
              bim1: item.bim1,
              bim2: item.bim2,
              bim3: item.bim3,
              bim4: item.bim4,
              mediaAnual: mediaAnualVal,
              recuperacaoFinal: recupVal,
              mediaFinal: mediaFinalVal,
              faltas: 0,
              situacao
            };
          });

          if (isMounted) setGradesData(formatted);
        }
      } catch (err) {
        console.error("Erro ao buscar notas do boletim:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchStudentGrades();

    return () => { isMounted = false; };
  }, [student, escola, isInfantil, turmaInfo]);

  // Trigger print once data loaded
  useEffect(() => {
    if (!isLoading) {
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
    }
  }, [isLoading, onClose]);

  const formatGrade = (val: number | '') => {
    if (val === '' || val === undefined || val === null) return '-';
    return Number(val).toFixed(1).replace('.', ',');
  };

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
        <h1 style={{ fontSize: '15pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0f172a', margin: '0 0 3pt' }}>
          Boletim de Desempenho Escolar
        </h1>
        <p style={{ fontSize: '8.5pt', fontWeight: 800, color: '#f97316', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Ano Letivo {currentYear}
        </p>
      </div>

      {/* ====== SCHOOL & STUDENT IDENTIFICATION ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '12pt' }}>
        <div style={{ fontSize: '8.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
          Ficha de Registro do Estudante
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', width: '20%', background: '#f8fafc' }}>
                Unidade Escolar
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '9.5pt', fontWeight: 900, color: '#0f172a' }} colSpan={3}>
                {escola.nome}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', background: '#f8fafc' }}>
                Nome do Estudante
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '10pt', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }} colSpan={3}>
                {student.name}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', background: '#f8fafc' }}>
                Matrícula / CPF
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#334155' }}>
                MAT: {student.registration_number || '---'} {student.cpf ? `• CPF: ${student.cpf}` : ''}
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', width: '18%', background: '#f8fafc' }}>
                Ano / Turma / Turno
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                {turmaInfo || student.stage || '---'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', background: '#f8fafc' }}>
                Etapa de Ensino
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                {student.stage || (isInfantil ? 'Educação Infantil' : 'Ensino Fundamental')}
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', background: '#f8fafc' }}>
                Data de Emissão
              </td>
              <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#334155' }}>
                {emissionDate} às {emissionTime}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== PERFORMANCE GRADES TABLE ====== */}
      {isInfantil ? (
        /* EDUCAÇÃO INFANTIL CAMPOS DE EXPERIÊNCIA */
        <div className="print-avoid-break" style={{ marginBottom: '14pt' }}>
          <div style={{ fontSize: '8.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#f97316', color: '#fff', padding: '5pt 10pt' }}>
            Avaliação por Campos de Experiência (BNCC - Educação Infantil)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '6pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'left', color: '#334155' }}>
                  Campo de Experiência
                </th>
                <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '13%', color: '#334155' }}>
                  1º Bimestre
                </th>
                <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '13%', color: '#334155' }}>
                  2º Bimestre
                </th>
                <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '13%', color: '#334155' }}>
                  3º Bimestre
                </th>
                <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '13%', color: '#334155' }}>
                  4º Bimestre
                </th>
              </tr>
            </thead>
            <tbody>
              {CAMPOS_EXPERIENCIA_INFANTIL.map(campo => {
                const b1 = infantilConcepts[campo]?.[1] || 'D';
                const b2 = infantilConcepts[campo]?.[2] || 'D';
                const b3 = infantilConcepts[campo]?.[3] || 'D';
                const b4 = infantilConcepts[campo]?.[4] || 'D';

                return (
                  <tr key={campo}>
                    <td style={{ padding: '6pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8pt', fontWeight: 800, color: '#0f172a' }}>
                      {campo}
                    </td>
                    <td style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 900, textAlign: 'center', color: '#166534' }}>
                      {b1}
                    </td>
                    <td style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 900, textAlign: 'center', color: '#166534' }}>
                      {b2}
                    </td>
                    <td style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 900, textAlign: 'center', color: '#166534' }}>
                      {b3}
                    </td>
                    <td style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 900, textAlign: 'center', color: '#166534' }}>
                      {b4}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{ fontSize: '7pt', fontWeight: 700, color: '#64748b', marginTop: '4pt' }}>
            Legenda de Conceitos: <strong>D / C</strong> = Desenvolvido / Conquistado | <strong>EM / ED</strong> = Em Desenvolvimento | <strong>ND</strong> = Não Desenvolvido
          </p>
        </div>
      ) : (
        /* ENSINO FUNDAMENTAL NOTAS */
        <div className="print-avoid-break" style={{ marginBottom: '14pt' }}>
          <div style={{ fontSize: '8.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
            Rendimento Escolar por Componente Curricular
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '6pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'left', color: '#334155' }}>
                  Componente Curricular
                </th>
                <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '9%', color: '#334155' }}>
                  1º Bim
                </th>
                <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '9%', color: '#334155' }}>
                  2º Bim
                </th>
                <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '9%', color: '#334155' }}>
                  3º Bim
                </th>
                <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '9%', color: '#334155' }}>
                  4º Bim
                </th>
                <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '11%', color: '#0f172a', background: '#e2e8f0' }}>
                  Média Anual
                </th>
                <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '10%', color: '#334155' }}>
                  Recup.
                </th>
                <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '11%', color: '#0f172a', background: '#ffedd5' }}>
                  Média Final
                </th>
                <th style={{ padding: '6pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', width: '14%', color: '#334155' }}>
                  Situação
                </th>
              </tr>
            </thead>
            <tbody>
              {gradesData.map((row) => (
                <tr key={row.componente}>
                  <td style={{ padding: '5pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8pt', fontWeight: 800, color: '#0f172a' }}>
                    {row.componente}
                  </td>
                  <td style={{ padding: '5pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, textAlign: 'center', color: '#334155' }}>
                    {formatGrade(row.bim1)}
                  </td>
                  <td style={{ padding: '5pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, textAlign: 'center', color: '#334155' }}>
                    {formatGrade(row.bim2)}
                  </td>
                  <td style={{ padding: '5pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, textAlign: 'center', color: '#334155' }}>
                    {formatGrade(row.bim3)}
                  </td>
                  <td style={{ padding: '5pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, textAlign: 'center', color: '#334155' }}>
                    {formatGrade(row.bim4)}
                  </td>
                  <td style={{ padding: '5pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 900, textAlign: 'center', color: '#0f172a', background: '#f8fafc' }}>
                    {formatGrade(row.mediaAnual)}
                  </td>
                  <td style={{ padding: '5pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, textAlign: 'center', color: '#64748b' }}>
                    {formatGrade(row.recuperacaoFinal)}
                  </td>
                  <td style={{ padding: '5pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '9pt', fontWeight: 900, textAlign: 'center', color: '#ea580c', background: '#fff7ed' }}>
                    {formatGrade(row.mediaFinal)}
                  </td>
                  <td style={{ padding: '5pt 4pt', border: '0.5pt solid #cbd5e1', fontSize: '7.5pt', fontWeight: 900, textAlign: 'center', textTransform: 'uppercase', color: row.situacao === 'Aprovado(a)' ? '#166534' : row.situacao === 'Retido(a)' ? '#991b1b' : '#1e40af' }}>
                    {row.situacao}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ====== OBSERVAÇÕES E PARECER ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '20pt' }}>
        <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: '#f8fafc', color: '#334155', border: '0.5pt solid #cbd5e1', padding: '4pt 8pt', borderBottom: 'none' }}>
          Observações Pedagogicas e Frequência Global
        </div>
        <div style={{ border: '0.5pt solid #cbd5e1', padding: '8pt 10pt', fontSize: '8pt', color: '#334155', minHeight: '40pt', lineHeight: 1.5 }}>
          <p style={{ margin: 0 }}>
            Média para aprovação direta: <strong>6,0 (seis)</strong>. Frequência escolar mínima exigida: <strong>75%</strong> do total de horas letivas.
          </p>
          <p style={{ margin: '4pt 0 0', color: '#64748b', fontStyle: 'italic' }}>
            Documento expedido pela Secretaria da Unidade Escolar e autenticado pelo Sistema Integrado de Gestão (SIGAR).
          </p>
        </div>
      </div>

      {/* ====== OFFICIAL SIGNATURES ====== */}
      <div className="print-avoid-break" style={{ marginTop: '35pt' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30pt' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '80%', margin: '0 auto 4pt', borderBottom: '1pt solid #0f172a' }} />
            <p style={{ fontSize: '8.5pt', fontWeight: 900, color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
              {escola.gestor || 'Gestor(a) Escolar'}
            </p>
            <p style={{ fontSize: '7.5pt', fontWeight: 700, color: '#64748b', margin: '2pt 0 0', textTransform: 'uppercase' }}>
              Direção / Gestão Escolar
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
