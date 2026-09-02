import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabase';
import { useConfiguracao } from '../context/ConfiguracaoContext';
import { 
  FileText, Printer, Download, Users, AlertTriangle, Loader2, CheckCircle, XCircle, ArrowRightLeft 
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Escola } from '../types';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface AtasFinaisTabProps {
  escola: Escola;
  schoolTurmas: any[];
  isDemoMode: boolean;
  userRole?: string;
}

interface AlunoAtaData {
  id: string | number;
  name: string;
  grades: Record<string, number | null>; // componente -> media anual
  preschoolConcepts?: Record<string, string>; // campo -> status
  mediaGeral: number;
  frequenciaRate: number;
  situacaoFinal: string;
  isTransferido?: boolean;
  transferenciaInfo?: {
    tipo?: string;
    status?: string;
    destino?: string;
    data?: string;
    motivo?: string;
  };
}

export const AtasFinaisTab: React.FC<AtasFinaisTabProps> = ({
  escola,
  schoolTurmas,
  isDemoMode,
  userRole
}) => {
  const { configuracao } = useConfiguracao();
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [selectedAnoSerie, setSelectedAnoSerie] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('');

  const availableAnosSeries = useMemo(() => {
    const years = schoolTurmas.map(t => t.year).filter(Boolean);
    return Array.from(new Set(years)).sort();
  }, [schoolTurmas]);

  const filteredTurmasByYear = useMemo(() => {
    if (!selectedAnoSerie) return [];
    return schoolTurmas.filter(t => t.year === selectedAnoSerie);
  }, [schoolTurmas, selectedAnoSerie]);

  const availableShifts = useMemo(() => {
    if (!selectedTurmaId) return [];
    const match = schoolTurmas.find(t => String(t.id) === String(selectedTurmaId));
    return match?.shift ? [match.shift] : ['MANHÃ', 'TARDE', 'NOITE'];
  }, [schoolTurmas, selectedTurmaId]);
  const [students, setStudents] = useState<any[]>([]);
  const [transferencias, setTransferencias] = useState<any[]>([]);
  const [gradesSheets, setGradesSheets] = useState<any[]>([]);
  const [frequencias, setFrequencias] = useState<any[]>([]);
  const [preschoolEvals, setPreschoolEvals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const targetTurma = useMemo(() => {
    return schoolTurmas.find(t => String(t.id) === String(selectedTurmaId));
  }, [schoolTurmas, selectedTurmaId]);

  const isInfantil = useMemo(() => {
    if (!targetTurma) return false;
    const stage = (targetTurma.stage || '').toLowerCase();
    const level = (targetTurma.level || '').toLowerCase();
    const year = (targetTurma.year || '').toLowerCase();
    return level.includes('infantil') || stage.includes('infantil') || year.includes('creche') || year.includes('pré');
  }, [targetTurma]);

  // List of active subjects or fields of experience
  const listColumnNames = useMemo(() => {
    if (isInfantil) {
      return configuracao?.campos_experiencia?.length > 0 
        ? configuracao.campos_experiencia 
        : [
            'O eu, o outro e o nós',
            'Corpo, gestos e movimentos',
            'Traços, sons, cores e formas',
            'Escuta, fala, pensamento e imaginação',
            'Espaços, tempos, quantidades, relações e transformações'
          ];
    } else {
      return configuracao?.componentes_curriculares?.length > 0
        ? configuracao.componentes_curriculares
        : [
            'Língua Portuguesa', 'Matemática', 'Ciências', 'Geografia', 'História', 'Educação Física', 'Arte', 'Ensino Religioso', 'Língua Inglesa'
          ];
    }
  }, [isInfantil, configuracao]);

  // Load class data
  useEffect(() => {
    const loadClassData = async () => {
      if (!selectedTurmaId) {
        setStudents([]);
        setGradesSheets([]);
        setFrequencias([]);
        setPreschoolEvals([]);
        return;
      }

      setLoading(true);
      try {
        if (isDemoMode) {
          // Mock data for demo mode
          const mockAlunos = [
            { id: 'm1', name: 'Alice Silveira Barbosa', status: 'Ativo' },
            { id: 'm2', name: 'Arthur Gabriel Fernandes', status: 'Ativo' },
            { id: 'm3', name: 'Beatriz Costa Rodrigues', status: 'Transferido', situacao_vinculo: 'Transferido' },
            { id: 'm4', name: 'Caio Roberto Lima', status: 'Ativo' },
            { id: 'm5', name: 'Eduarda Vitória Gomes', status: 'Ativo' }
          ];
          setStudents(mockAlunos);

          const mockTransf = [
            {
              id: 't-mock-1',
              aluno_id: 'm3',
              aluno_nome: 'Beatriz Costa Rodrigues',
              tipo: 'INTERNA',
              escola_origem_id: escola.id,
              turma_origem_id: selectedTurmaId,
              escola_destino_nome: 'U.E.B. Professor Paulo Freire',
              turma_destino_nome: 'Turma B',
              status: 'APROVADO',
              created_at: '2026-06-15T10:00:00Z'
            }
          ];
          setTransferencias(mockTransf);

          if (isInfantil) {
            // Generate mock evaluations for preschool
            const mockEvals: any[] = [];
            mockAlunos.forEach(student => {
              listColumnNames.forEach(campo => {
                mockEvals.push({
                  student_id: student.id,
                  campo_experiencia: campo.toUpperCase(),
                  status: 'DS'
                });
              });
            });
            setPreschoolEvals(mockEvals);
          } else {
            // Generate mock grades for Ensino Fundamental
            const mockSheets: any[] = [];
            listColumnNames.forEach(comp => {
              ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'].forEach(bim => {
                const sheetStudents = mockAlunos.map((student, idx) => ({
                  id: student.id,
                  name: student.name,
                  mediaFinal: 7.0 + (idx % 3) * 0.5 + (bim === '1º Bimestre' ? -0.5 : 0.5)
                }));
                mockSheets.push({
                  id: `${comp}-${bim}`,
                  turma_id: selectedTurmaId,
                  componente: comp,
                  bimestre: bim,
                  students: sheetStudents
                });
              });
            });
            setGradesSheets(mockSheets);
          }

          // Mock attendance sheets
          const mockFreqs: any[] = [];
          for (let i = 1; i <= 10; i++) {
            mockFreqs.push({
              id: `f-${i}`,
              students: mockAlunos.map(student => ({
                id: student.id,
                present: Math.random() > 0.05 // 95% attendance
              }))
            });
          }
          setFrequencias(mockFreqs);
        } else {
          // Live Database Load
          // 1. Fetch Students
          const { data: dbAlunos, error: errA } = await supabase
            .from('alunos')
            .select('*')
            .eq('class_id', selectedTurmaId)
            .order('name');
          if (errA) throw errA;

          // 2. Fetch Transfers associated with this class
          let dbTransf: any[] = [];
          try {
            const { data: tData, error: errT } = await supabase
              .from('transferencias_estudantes')
              .select('*')
              .or(`turma_origem_id.eq.${selectedTurmaId},turma_destino_id.eq.${selectedTurmaId}`);
            if (!errT && tData) {
              dbTransf = tData;
            }
          } catch (tError) {
            console.warn('Could not fetch transferencias_estudantes:', tError);
          }

          let allAlunos = [...(dbAlunos || [])];

          // Include students who transferred out of this class during the school year
          if (dbTransf.length > 0) {
            const outTransfers = dbTransf.filter(
              (t: any) => String(t.turma_origem_id) === String(selectedTurmaId) && t.status !== 'NEGADO'
            );
            const missingStudentIds = outTransfers
              .map((t: any) => t.aluno_id)
              .filter((id: any) => id && !allAlunos.some((a: any) => String(a.id) === String(id)));

            if (missingStudentIds.length > 0) {
              try {
                const { data: outStudents } = await supabase
                  .from('alunos')
                  .select('*')
                  .in('id', missingStudentIds);
                if (outStudents && outStudents.length > 0) {
                  allAlunos = [...allAlunos, ...outStudents];
                }
              } catch (outErr) {
                console.warn('Could not fetch transferred out students:', outErr);
              }
            }
          }

          allAlunos.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
          setStudents(allAlunos);
          setTransferencias(dbTransf);

          const studentIds = allAlunos.map(s => s.id);

          if (allAlunos && allAlunos.length > 0) {
            // 3. Fetch Grades Sheets
            if (!isInfantil) {
              const { data: dbSheets, error: errS } = await supabase
                .from('notas_sheets')
                .select('*')
                .eq('turma_id', selectedTurmaId)
                .eq('ativo', true);
              if (errS) throw errS;
              setGradesSheets(dbSheets || []);
            } else {
              // Fetch preschool evaluations
              const { data: dbEvals, error: errE } = await supabase
                .from('cc_i_avaliacoes')
                .select('*')
                .eq('turma_id', selectedTurmaId);
              if (errE) throw errE;
              setPreschoolEvals(dbEvals || []);
            }

            // 4. Fetch Frequencies
            const { data: dbFreq, error: errF } = await supabase
              .from(isInfantil ? 'frequencia_sheets_infantil' : 'frequencia_sheets')
              .select('*')
              .eq('turma_id', selectedTurmaId)
              .eq('ativo', true);
            if (errF) throw errF;
            setFrequencias(dbFreq || []);
          }
        }
      } catch (err) {
        console.error('Error fetching Ata data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadClassData();
  }, [selectedTurmaId, isDemoMode, isInfantil, listColumnNames]);

  // Aggregate results per student
  const aggregatedData = useMemo<AlunoAtaData[]>(() => {
    if (students.length === 0) return [];

    const notaMinima = configuracao?.nota_minima_aprovacao ?? 7.0;

    return students.map(student => {
      // 1. Check transfer records
      const transferRecord = transferencias.find((t: any) =>
        String(t.aluno_id) === String(student.id) &&
        (String(t.turma_origem_id) === String(selectedTurmaId) || !t.turma_origem_id)
      );

      const isTransferStatus = 
        (student.status && String(student.status).toLowerCase().includes('transf')) ||
        (student.situacao_vinculo && String(student.situacao_vinculo).toLowerCase().includes('transf')) ||
        (transferRecord && transferRecord.status !== 'NEGADO');

      let isTransferido = false;
      let transferenciaInfo: any = undefined;
      let situacaoTransferencia = '';

      if (isTransferStatus) {
        isTransferido = true;
        const tipo = transferRecord?.tipo || 'EXTERNA';
        const statusTransf = transferRecord?.status || 'APROVADO';
        const destino = transferRecord?.tipo === 'EXTERNA'
          ? (transferRecord?.escola_externa_nome || 'Rede Externa')
          : (transferRecord?.escola_destino_nome ? `${transferRecord.escola_destino_nome}${transferRecord.turma_destino_nome ? ` (${transferRecord.turma_destino_nome})` : ''}` : 'Outra Unidade Escolar');

        transferenciaInfo = {
          tipo,
          status: statusTransf,
          destino: destino || student.observations || 'Transferido(a)',
          data: transferRecord?.updated_at || transferRecord?.created_at,
          motivo: transferRecord?.motivo
        };

        if (statusTransf === 'PENDENTE') {
          situacaoTransferencia = 'TRANSF. PENDENTE';
        } else if (statusTransf === 'EM_ANALISE') {
          situacaoTransferencia = 'TRANSF. EM ANÁLISE';
        } else {
          situacaoTransferencia = 'TRANSFERIDO(A)';
        }
      }

      // 2. Calculate Attendance
      let presentDays = 0;
      let totalDays = 0;

      frequencias.forEach(sheet => {
        const match = sheet.students?.find((s: any) => String(s.id) === String(student.id));
        if (match) {
          totalDays++;
          if (match.present) presentDays++;
        }
      });

      const frequenciaRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

      if (isInfantil) {
        // Preschool Aggregation
        const preschoolConcepts: Record<string, string> = {};
        let dsCount = 0;
        let edCount = 0;

        listColumnNames.forEach(campo => {
          const campoUpper = campo.toUpperCase();
          const studentEvals = preschoolEvals.filter(
            e => String(e.student_id) === String(student.id) && e.campo_experiencia === campoUpper
          );

          if (studentEvals.length > 0) {
            // Find most common status
            const statusList = studentEvals.map(e => e.status || 'ND');
            const ds = statusList.filter(s => s === 'DS').length;
            const ed = statusList.filter(s => s === 'ED').length;

            if (ds >= ed) {
              preschoolConcepts[campo] = 'DS';
              dsCount++;
            } else {
              preschoolConcepts[campo] = 'ED';
              edCount++;
            }
          } else {
            preschoolConcepts[campo] = 'DS'; // Default to DS if no evaluations recorded
            dsCount++;
          }
        });

        const situacaoFinal = isTransferido 
          ? situacaoTransferencia 
          : (frequenciaRate >= 75 ? 'PROMOVIDO(A)' : 'REPROVADO POR FALTA');

        return {
          id: student.id,
          name: student.name,
          grades: {},
          preschoolConcepts,
          mediaGeral: 0,
          frequenciaRate,
          situacaoFinal,
          isTransferido,
          transferenciaInfo
        };
      } else {
        // Fundamental Aggregation
        const grades: Record<string, number | null> = {};
        let totalSum = 0;
        let subjectsCount = 0;
        let isReprovadoByGrades = false;

        listColumnNames.forEach(comp => {
          // Get all grades across 4 bimestres for this student and component
          const compSheets = gradesSheets.filter(s => s.componente === comp);
          let gradeSum = 0;
          let bimCount = 0;

          compSheets.forEach(sheet => {
            const studentGradeObj = sheet.students?.find((s: any) => String(s.id) === String(student.id));
            if (studentGradeObj && studentGradeObj.mediaFinal !== undefined) {
              gradeSum += Number(studentGradeObj.mediaFinal);
              bimCount++;
            }
          });

          const finalAverage = bimCount > 0 ? parseFloat((gradeSum / bimCount).toFixed(2)) : null;
          grades[comp] = finalAverage;

          if (finalAverage !== null) {
            totalSum += finalAverage;
            subjectsCount++;
            if (finalAverage < notaMinima) {
              isReprovadoByGrades = true;
            }
          }
        });

        const mediaGeral = subjectsCount > 0 ? parseFloat((totalSum / subjectsCount).toFixed(2)) : 0;

        let situacaoFinal = '';
        if (isTransferido) {
          situacaoFinal = situacaoTransferencia;
        } else if (frequenciaRate < 75) {
          situacaoFinal = 'REPROVADO POR FALTA';
        } else if (isReprovadoByGrades) {
          situacaoFinal = 'REPROVADO(A)';
        } else {
          situacaoFinal = 'APROVADO(A)';
        }

        return {
          id: student.id,
          name: student.name,
          grades,
          mediaGeral,
          frequenciaRate,
          situacaoFinal,
          isTransferido,
          transferenciaInfo
        };
      }
    });
  }, [students, transferencias, selectedTurmaId, gradesSheets, frequencias, preschoolEvals, isInfantil, listColumnNames, configuracao]);

  const transferredStudents = useMemo(() => {
    return aggregatedData.filter(s => s.isTransferido);
  }, [aggregatedData]);

  // Browser print action
  const handlePrintAta = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 200);
  };

  // Export to docx document
  const handleExportDocx = async () => {
    if (!targetTurma || aggregatedData.length === 0) return;

    const currentYear = new Date().getFullYear();
    const dateStr = new Date().toLocaleDateString('pt-BR');

    // Create table headers
    const headersCells = [
      new TableCell({ 
        children: [new Paragraph({ children: [new TextRun({ text: 'Nº', bold: true })], alignment: AlignmentType.CENTER })], 
        width: { size: 500, type: WidthType.DXA } 
      }),
      new TableCell({ 
        children: [new Paragraph({ children: [new TextRun({ text: 'Estudante', bold: true })] })], 
        width: { size: 3000, type: WidthType.DXA } 
      })
    ];

    listColumnNames.forEach(col => {
      // Abbreviate column name
      const abbrev = col.length > 12 ? col.substring(0, 10) + '.' : col;
      headersCells.push(
        new TableCell({ 
          children: [new Paragraph({ children: [new TextRun({ text: abbrev, bold: true })], alignment: AlignmentType.CENTER })], 
          width: { size: 1000, type: WidthType.DXA } 
        })
      );
    });

    if (!isInfantil) {
      headersCells.push(
        new TableCell({ 
          children: [new Paragraph({ children: [new TextRun({ text: 'Média Geral', bold: true })], alignment: AlignmentType.CENTER })], 
          width: { size: 800, type: WidthType.DXA } 
        })
      );
    }

    headersCells.push(
      new TableCell({ 
        children: [new Paragraph({ children: [new TextRun({ text: 'Frequência', bold: true })], alignment: AlignmentType.CENTER })], 
        width: { size: 800, type: WidthType.DXA } 
      }),
      new TableCell({ 
        children: [new Paragraph({ children: [new TextRun({ text: 'Situação', bold: true })], alignment: AlignmentType.CENTER })], 
        width: { size: 1500, type: WidthType.DXA } 
      })
    );

    const rows = [
      new TableRow({
        children: headersCells
      })
    ];

    // Add student data rows
    aggregatedData.forEach((student, idx) => {
      const cells = [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(idx + 1) })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.name })] })] })
      ];

      listColumnNames.forEach(col => {
        const val = isInfantil 
          ? (student.preschoolConcepts?.[col] || '-') 
          : (student.grades[col] !== undefined && student.grades[col] !== null ? student.grades[col]!.toFixed(1).replace('.', ',') : '-');
        cells.push(
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(val) })], alignment: AlignmentType.CENTER })] })
        );
      });

      if (!isInfantil) {
        cells.push(
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.mediaGeral.toFixed(1).replace('.', ',') })], alignment: AlignmentType.CENTER })] })
        );
      }

      cells.push(
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${student.frequenciaRate}%` })], alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: student.situacaoFinal })], alignment: AlignmentType.CENTER })] })
      );

      rows.push(new TableRow({ children: cells }));
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'ESTADO DO MARANHÃO', bold: true, size: 20 }),
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS', bold: true, size: 22 }),
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'SECRETARIA MUNICIPAL DE EDUCAÇÃO', bold: true, size: 20 }),
              ]
            }),
            new Paragraph({ text: '', spacing: { after: 200 } }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'ATA ANUAL DE RESULTADOS FINAIS', bold: true, size: 28 }),
              ]
            }),
            new Paragraph({ text: '', spacing: { after: 400 } }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Escola: ', bold: true }),
                new TextRun({ text: escola.nome }),
                new TextRun({ text: '   Turma: ', bold: true }),
                new TextRun({ text: `${targetTurma.name || targetTurma.year} • ${targetTurma.shift || 'MANHÃ'}` }),
                new TextRun({ text: '   Ano Letivo: ', bold: true }),
                new TextRun({ text: String(currentYear) })
              ]
            }),
            new Paragraph({ text: '', spacing: { after: 300 } }),
            new Paragraph({
              text: `Aos dezoito dias do mês de dezembro do ano de ${currentYear}, nesta unidade escolar, reuniu-se o conselho de classe final para consolidar e homologar os resultados anuais dos estudantes abaixo elencados no presente documento.`,
              spacing: { after: 400 }
            }),
            new Table({
              rows: rows
            }),
            ...(transferredStudents.length > 0 ? [
              new Paragraph({ text: '', spacing: { before: 200 } }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'RELAÇÃO DE ESTUDANTES TRANSFERIDOS:', bold: true, size: 20 })
                ],
                spacing: { after: 100 }
              }),
              ...transferredStudents.map(s => new Paragraph({
                children: [
                  new TextRun({ text: `• ${s.name}: `, bold: true, size: 18 }),
                  new TextRun({ 
                    text: `${s.transferenciaInfo?.tipo === 'EXTERNA' ? 'Transferência Externa' : 'Transferência Interna'}${s.transferenciaInfo?.destino ? ` para ${s.transferenciaInfo.destino}` : ''} - Situação da Transferência: ${s.situacaoFinal}${s.transferenciaInfo?.data ? ` (${new Date(s.transferenciaInfo.data).toLocaleDateString('pt-BR')})` : ''}`,
                    size: 18 
                  })
                ],
                spacing: { after: 60 }
              }))
            ] : []),
            new Paragraph({ text: '', spacing: { after: 800 } }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Gestor(a) Geral: ___________________________   Coord. Pedagógico: ___________________________' }),
              ]
            }),
            new Paragraph({ text: '', spacing: { after: 400 } }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Secretário(a) Escolar: ___________________________   Docentes Presentes: ___________________________' }),
              ]
            })
          ]
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Ata_Final_Turma_${targetTurma.name || targetTurma.year}.docx`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Atas Finais de Resultados</h3>
          <p className="text-slate-500 text-sm mt-1">
            Gere a ata de fechamento e resultado consolidado de aproveitamento anual da turma.
          </p>
        </div>
      </div>

      <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            {/* ANO/SÉRIE */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Selecionar ANO/SÉRIE</label>
              <select
                value={selectedAnoSerie}
                onChange={e => {
                  setSelectedAnoSerie(e.target.value);
                  setSelectedTurmaId('');
                  setSelectedTurno('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold"
              >
                <option value="">Selecione o ano/série...</option>
                {availableAnosSeries.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* TURMA */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Selecionar TURMA</label>
              <select
                value={selectedTurmaId}
                onChange={e => {
                  const id = e.target.value;
                  setSelectedTurmaId(id);
                  const matched = schoolTurmas.find(t => String(t.id) === String(id));
                  setSelectedTurno(matched?.shift || '');
                }}
                disabled={!selectedAnoSerie}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione a turma...</option>
                {filteredTurmasByYear.map(t => (
                  <option key={t.id} value={t.id}>{t.name || t.year}</option>
                ))}
              </select>
            </div>

            {/* TURNO */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Selecionar TURNO</label>
              <select
                value={selectedTurno}
                onChange={e => setSelectedTurno(e.target.value)}
                disabled={!selectedTurmaId}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione o turno...</option>
                {availableShifts.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedTurmaId && aggregatedData.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 text-[11px] font-bold text-slate-500">
                <span className="px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
                  Total: {aggregatedData.length}
                </span>
                <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Aprovados: {aggregatedData.filter(s => s.situacaoFinal.includes('APROVADO') || s.situacaoFinal.includes('PROMOVIDO')).length}
                </span>
                {aggregatedData.some(s => s.situacaoFinal.includes('REPROVADO')) && (
                  <span className="px-2.5 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200">
                    Reprovados: {aggregatedData.filter(s => s.situacaoFinal.includes('REPROVADO')).length}
                  </span>
                )}
                {transferredStudents.length > 0 && (
                  <span className="px-2.5 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3" />
                    Transferidos: {transferredStudents.length}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handlePrintAta}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold bg-brand-orange hover:bg-orange-600 shadow-sm flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Ata
                </Button>
                <Button
                  onClick={handleExportDocx}
                  variant="secondary"
                  className="rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 border-slate-200 shadow-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar Word
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-brand-orange animate-spin mb-3" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Carregando dados da Ata...</p>
        </div>
      ) : !selectedTurmaId ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h4 className="text-sm font-black text-slate-700 uppercase">Selecione uma turma</h4>
          <p className="text-slate-400 text-xs mt-1">Escolha uma turma acima para gerar e pré-visualizar a ata anual.</p>
        </div>
      ) : aggregatedData.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h4 className="text-sm font-black text-slate-700 uppercase">Turma Sem Alunos</h4>
          <p className="text-slate-400 text-xs mt-1">Esta turma não possui nenhum estudante matriculado.</p>
        </div>
      ) : (
        <div className="bg-slate-100 rounded-3xl border border-slate-200 p-6 overflow-x-auto">
          {/* Document Preview (Paper Mockup) */}
          <div className="bg-white shadow-xl max-w-5xl mx-auto p-12 text-slate-800 font-serif border border-slate-200 rounded-sm overflow-hidden min-h-[800px] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                <h4 className="text-xs font-black tracking-widest text-slate-500">ESTADO DO MARANHÃO</h4>
                <h2 className="text-sm font-black tracking-wider text-slate-800 mt-1 uppercase">PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS</h2>
                <h5 className="text-[10px] font-black tracking-widest text-slate-500 mt-0.5 uppercase">Secretaria Municipal de Educação</h5>
                <div className="w-24 h-0.5 bg-brand-orange mx-auto my-3" />
                <h1 className="text-lg font-black text-slate-800 tracking-tight uppercase">Ata Anual de Resultados Finais</h1>
              </div>

              {/* Identification Block */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-6 border p-4 bg-slate-50/50 rounded-lg">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[9px] block">Unidade Escolar</span>
                  <span className="font-bold text-slate-800 uppercase">{escola.nome}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[9px] block">Turma / Turno</span>
                  <span className="font-bold text-slate-800 uppercase">{targetTurma.name || targetTurma.year} • {targetTurma.shift || 'MANHÃ'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[9px] block">Segmento</span>
                  <span className="font-bold text-slate-800 uppercase">{isInfantil ? 'Educação Infantil' : 'Ensino Fundamental'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[9px] block">Ano Letivo</span>
                  <span className="font-bold text-slate-800">2026</span>
                </div>
              </div>

              {/* Minute opening statement */}
              <p className="text-xs leading-relaxed text-justify indent-8 mb-6 font-serif">
                Aos dezoito dias do mês de dezembro do ano de dois mil e vinte e seis, na unidade escolar municipal acima indicada, reuniu-se a equipe diretiva, coordenação pedagógica e o corpo docente de professores para a sessão de encerramento do Conselho de Classe Final. Diante dos registros de aproveitamento acadêmico e apuração da frequência dos educandos ao longo do ano letivo, lavrou-se a presente ata contendo as médias anuais consolidadas e a homologação dos resultados de aproveitamento escolar correspondente:
              </p>

              {/* Table */}
              <table className="w-full text-xs border-collapse border border-slate-300 font-sans">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-2 py-2 text-center w-8">Nº</th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Estudante</th>
                    {listColumnNames.map(col => (
                      <th key={col} className="border border-slate-300 p-2 text-center text-[10px] h-36 align-bottom">
                        <div 
                          className="inline-block whitespace-nowrap text-left font-bold" 
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', maxHeight: '130px' }}
                        >
                          {col}
                        </div>
                      </th>
                    ))}
                    {!isInfantil && (
                      <th className="border border-slate-300 p-2 text-center text-[10px] h-36 align-bottom">
                        <div 
                          className="inline-block whitespace-nowrap text-left font-bold" 
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}
                        >
                          Média Geral
                        </div>
                      </th>
                    )}
                    <th className="border border-slate-300 p-2 text-center text-[10px] h-36 align-bottom">
                      <div 
                        className="inline-block whitespace-nowrap text-left font-bold" 
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto' }}
                      >
                        Frequência
                      </div>
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-24">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedData.map((student, idx) => {
                    const isApproved = student.situacaoFinal.includes('APROVADO') || student.situacaoFinal.includes('PROMOVIDO');
                    return (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-400">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-800 uppercase text-[10px]">
                          <div>{student.name}</div>
                          {student.isTransferido && (
                            <div className="flex items-center gap-1 mt-0.5 no-print">
                              <span className="inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-sans">
                                <ArrowRightLeft className="w-2.5 h-2.5 text-sky-600" />
                                {student.transferenciaInfo?.tipo === 'EXTERNA' ? 'Transferência Externa' : 'Transferência Interna'}
                                {student.transferenciaInfo?.destino ? ` • Destino: ${student.transferenciaInfo.destino}` : ''}
                              </span>
                            </div>
                          )}
                        </td>
                        {listColumnNames.map(col => {
                          const val = isInfantil 
                            ? (student.preschoolConcepts?.[col] || '-') 
                            : (student.grades[col] !== undefined && student.grades[col] !== null ? student.grades[col]!.toFixed(1).replace('.', ',') : '-');
                          const isLowGrade = !student.isTransferido && !isInfantil && student.grades[col] !== null && student.grades[col]! < (configuracao?.nota_minima_aprovacao ?? 7.0);
                          
                          return (
                            <td 
                              key={col} 
                              className={`border border-slate-300 px-1 py-1.5 text-center font-semibold text-[10px]
                                ${isLowGrade ? 'text-red-600 font-bold bg-red-50/30' : 'text-slate-700'}`}
                            >
                              {val}
                            </td>
                          );
                        })}
                        {!isInfantil && (
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-800">
                            {student.mediaGeral > 0 ? student.mediaGeral.toFixed(1).replace('.', ',') : '-'}
                          </td>
                        )}
                        <td className={`border border-slate-300 px-2 py-1.5 text-center font-semibold
                          ${!student.isTransferido && student.frequenciaRate < 75 ? 'text-red-600 font-bold bg-red-50/30' : 'text-slate-700'}`}
                        >
                          {student.frequenciaRate}%
                        </td>
                        <td className="border border-slate-300 px-3 py-1.5 text-center">
                          <span className={`inline-block font-black text-[9px] px-2 py-0.5 rounded-full uppercase
                            ${student.isTransferido 
                              ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-sm' 
                              : isApproved 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-red-50 text-red-600 border border-red-100'}`}
                          >
                            {student.situacaoFinal}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Relação de Alunos Transferidos / Observações da Ata */}
              {transferredStudents.length > 0 && (
                <div className="mt-6 border border-slate-300 rounded-lg p-3 bg-slate-50 text-xs font-sans">
                  <div className="flex items-center justify-between mb-2 border-b border-slate-200 pb-1.5">
                    <span className="font-black text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" />
                      Relação de Estudantes Transferidos no Decorrer do Ano Letivo
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      {transferredStudents.length} {transferredStudents.length === 1 ? 'estudante' : 'estudantes'}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold">
                          <th className="py-1">Estudante</th>
                          <th className="py-1">Tipo Transferência</th>
                          <th className="py-1">Destino</th>
                          <th className="py-1 text-center">Situação da Transferência</th>
                          <th className="py-1 text-right">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {transferredStudents.map((s) => (
                          <tr key={s.id} className="text-slate-700 font-medium">
                            <td className="py-1.5 font-bold uppercase">{s.name}</td>
                            <td className="py-1.5">{s.transferenciaInfo?.tipo === 'EXTERNA' ? 'Transferência Externa' : 'Transferência Interna'}</td>
                            <td className="py-1.5 text-slate-600">{s.transferenciaInfo?.destino || '-'}</td>
                            <td className="py-1.5 text-center">
                              <span className="font-black text-sky-800 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-full text-[9px] uppercase">
                                {s.situacaoFinal}
                              </span>
                            </td>
                            <td className="py-1.5 text-right text-slate-500">
                              {s.transferenciaInfo?.data ? new Date(s.transferenciaInfo.data).toLocaleDateString('pt-BR') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="mt-16 font-sans">
              <div className="grid grid-cols-2 gap-8 text-center text-[10px] font-bold text-slate-600">
                <div className="border-t border-slate-300 pt-2">
                  <p className="uppercase font-black text-slate-800">Gestor(a) Geral</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Assinatura e Carimbo</p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p className="uppercase font-black text-slate-800">Coordenador(a) Pedagógico(a)</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Assinatura e Carimbo</p>
                </div>
                <div className="border-t border-slate-300 pt-2 mt-4">
                  <p className="uppercase font-black text-slate-800">Secretário(a) Escolar</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Assinatura e Carimbo</p>
                </div>
                <div className="border-t border-slate-300 pt-2 mt-4">
                  <p className="uppercase font-black text-slate-800">Docentes do Conselho</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Rubrica de Presença</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Area - Hidden on Screen */}
      {selectedTurmaId && targetTurma && aggregatedData.length > 0 && createPortal(
        <div id="print-report" className="hidden print:block bg-white p-8 text-black text-xs font-serif leading-relaxed">
          <style>{`
            @media print {
              @page {
                size: A4 landscape;
                margin: 12mm;
              }
              body {
                font-family: 'Times New Roman', serif !important;
                color: black !important;
                background: white !important;
              }
              table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin-top: 15px !important;
              }
              th, td {
                border: 0.5pt solid black !important;
                padding: 4px 6px !important;
                font-size: 8pt !important;
              }
              th {
                background-color: #f2f2f2 !important;
                font-weight: bold !important;
                text-align: center !important;
              }
              .text-center {
                text-align: center !important;
              }
              .text-justify {
                text-align: justify !important;
              }
            }
          `}</style>

          {/* Institutional Header */}
          <div className="text-center border-b pb-3 mb-4">
            <h4 className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">ESTADO DO MARANHÃO</h4>
            <h2 className="text-xs font-bold tracking-wider text-black mt-0.5 uppercase">PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS</h2>
            <h5 className="text-[9px] font-bold tracking-widest text-gray-500 mt-0.5 uppercase">Secretaria Municipal de Educação</h5>
            <h1 className="text-sm font-bold text-black mt-2 uppercase">Ata Anual de Resultados Finais - Ano Letivo 2026</h1>
          </div>

          {/* Identificadores */}
          <div className="grid grid-cols-4 gap-4 text-[10px] mb-4 border p-2 bg-gray-50">
            <div>
              <strong>Escola:</strong> <span className="uppercase">{escola.nome}</span>
            </div>
            <div>
              <strong>Turma:</strong> <span className="uppercase">{targetTurma.name || targetTurma.year} • {targetTurma.shift || 'MANHÃ'}</span>
            </div>
            <div>
              <strong>Segmento:</strong> <span className="uppercase">{isInfantil ? 'Educação Infantil' : 'Ensino Fundamental'}</span>
            </div>
            <div>
              <strong>Ano Letivo:</strong> <span>2026</span>
            </div>
          </div>

          {/* Preamble */}
          <p className="text-[10px] text-justify mb-4">
            Aos dezoito dias do mês de dezembro do ano de dois mil e vinte e seis, na unidade escolar municipal acima indicada, reuniu-se a equipe diretiva, coordenação pedagógica e o corpo docente de professores para a sessão de encerramento do Conselho de Classe Final. Diante dos registros de aproveitamento acadêmico e apuração da frequência dos educandos ao longo do ano letivo, lavrou-se a presente ata contendo as médias anuais consolidadas e a homologação dos resultados de aproveitamento escolar correspondente:
          </p>

          {/* Table */}
          <table className="w-full text-[9px] border-collapse">
            <thead>
              <tr>
                <th style={{ width: '4%' }}>Nº</th>
                <th>Estudante</th>
                {listColumnNames.map(col => (
                  <th key={col} style={{ height: '140px', verticalAlign: 'bottom', padding: '6px 2px' }} className="text-center">
                    <div 
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block', whiteSpace: 'nowrap', textAlign: 'left' }}
                    >
                      {col}
                    </div>
                  </th>
                ))}
                {!isInfantil && (
                  <th style={{ height: '140px', verticalAlign: 'bottom', padding: '6px 2px' }} className="text-center">
                    <div 
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block', whiteSpace: 'nowrap', textAlign: 'left', fontWeight: 'bold' }}
                    >
                      Média Geral
                    </div>
                  </th>
                )}
                <th style={{ height: '140px', verticalAlign: 'bottom', padding: '6px 2px' }} className="text-center">
                  <div 
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block', whiteSpace: 'nowrap', textAlign: 'left', fontWeight: 'bold' }}
                  >
                    Frequência
                  </div>
                </th>
                <th style={{ width: '15%' }} className="text-center">Situação</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedData.map((student, idx) => (
                <tr key={student.id}>
                  <td className="text-center font-bold">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="uppercase font-bold text-[9px]">{student.name}</td>
                  {listColumnNames.map(col => {
                    const val = isInfantil 
                      ? (student.preschoolConcepts?.[col] || '-') 
                      : (student.grades[col] !== undefined && student.grades[col] !== null ? student.grades[col]!.toFixed(1).replace('.', ',') : '-');
                    return (
                      <td key={col} className="text-center">{val}</td>
                    );
                  })}
                  {!isInfantil && (
                    <td className="text-center font-bold">{student.mediaGeral > 0 ? student.mediaGeral.toFixed(1).replace('.', ',') : '-'}</td>
                  )}
                  <td className="text-center">{student.frequenciaRate}%</td>
                  <td className="text-center font-bold uppercase">{student.situacaoFinal}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Printed Section for Transferred Students */}
          {transferredStudents.length > 0 && (
            <div className="mt-4 border border-black p-2 text-[8pt] font-sans">
              <div className="font-bold uppercase text-[8pt] mb-1">Relação de Estudantes Transferidos:</div>
              <table className="w-full text-[7.5pt] border-collapse mt-1">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-1.5 py-0.5 text-left">Estudante</th>
                    <th className="border border-black px-1.5 py-0.5 text-left">Tipo Transferência</th>
                    <th className="border border-black px-1.5 py-0.5 text-left">Destino</th>
                    <th className="border border-black px-1.5 py-0.5 text-center">Situação da Transferência</th>
                    <th className="border border-black px-1.5 py-0.5 text-center">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {transferredStudents.map((s) => (
                    <tr key={s.id}>
                      <td className="border border-black px-1.5 py-0.5 font-bold uppercase">{s.name}</td>
                      <td className="border border-black px-1.5 py-0.5">{s.transferenciaInfo?.tipo === 'EXTERNA' ? 'Externa' : 'Interna'}</td>
                      <td className="border border-black px-1.5 py-0.5">{s.transferenciaInfo?.destino || '-'}</td>
                      <td className="border border-black px-1.5 py-0.5 text-center font-bold">{s.situacaoFinal}</td>
                      <td className="border border-black px-1.5 py-0.5 text-center">{s.transferenciaInfo?.data ? new Date(s.transferenciaInfo.data).toLocaleDateString('pt-BR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signatures */}
          <div className="mt-12">
            <div className="grid grid-cols-2 gap-6 text-center text-[9px] font-bold">
              <div className="border-t border-black pt-1">
                <span className="uppercase">Gestor(a) Geral</span>
              </div>
              <div className="border-t border-black pt-1">
                <span className="uppercase">Coordenador(a) Pedagógico(a)</span>
              </div>
              <div className="border-t border-black pt-1 mt-6">
                <span className="uppercase">Secretário(a) Escolar</span>
              </div>
              <div className="border-t border-black pt-1 mt-6">
                <span className="uppercase">Professores do Conselho</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
