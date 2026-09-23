import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Escola, Coordenador } from '../types';
import { SlotHorarioCalculado } from '../services/configuracaoService';

export interface HorarioSlotData {
  id: string;
  school_id: string;
  teacher_id: string;
  turma_id: string;
  componente: string;
  dia_semana: string;
  turno: string;
  horario_inicio: string;
  horario_fim: string;
  numero_aula: number;
  etapa?: string;
}

interface PrintableQuadroHorarioDocenteProps {
  escola?: Escola;
  activeEtapa: string;
  activeTurno: 'MATUTINO' | 'VESPERTINO' | 'NOTURNO';
  currentTurnoDef: { id: string; label: string };
  currentTurnoConfig: { inicio: string; fim: string; duracaoIntervalo: number; intervaloAposAula: number };
  duracaoAulaAtiva: number;
  currentTurnoHorarios: SlotHorarioCalculado[];
  horarios: HorarioSlotData[];
  schoolTeachers: Coordenador[];
  schoolTurmas: any[];
  selectedTurmaFilter?: string;
  onClose: () => void;
}

const DIAS_SEMANA = [
  { id: 'SEGUNDA', label: 'Segunda-feira', short: 'SEG' },
  { id: 'TERCA', label: 'Terça-feira', short: 'TER' },
  { id: 'QUARTA', label: 'Quarta-feira', short: 'QUA' },
  { id: 'QUINTA', label: 'Quinta-feira', short: 'QUI' },
  { id: 'SEXTA', label: 'Sexta-feira', short: 'SEX' },
];

export const PrintableQuadroHorarioDocente: React.FC<PrintableQuadroHorarioDocenteProps> = ({
  escola,
  activeEtapa,
  activeTurno,
  currentTurnoDef,
  currentTurnoConfig,
  duracaoAulaAtiva,
  currentTurnoHorarios,
  horarios,
  schoolTeachers,
  schoolTurmas,
  selectedTurmaFilter = 'ALL',
  onClose
}) => {
  const currentYear = new Date().getFullYear();
  const emissionDate = new Date().toLocaleDateString('pt-BR');
  const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 450);

    const handleAfterPrint = () => {
      onClose();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClose]);

  // Helper para obter nome do professor
  const getTeacherName = (id: string): string => {
    return schoolTeachers.find(t => t.id === id)?.nome || '—';
  };

  // Helper para rótulo da turma (com suporte a multisseriada)
  const getTurmaLabel = (turmaIdStr: string): { label: string; isMulti: boolean } => {
    if (!turmaIdStr) return { label: '—', isMulti: false };
    const ids = turmaIdStr.split(',').map(s => s.trim()).filter(Boolean);

    if (ids.length > 1) {
      const labels = ids.map(id => {
        const t = schoolTurmas.find(item => String(item.id) === String(id));
        if (!t) return 'Turma';
        return `${t.year || t.anoSerie || ''} ${t.name || ''}`.trim();
      });
      return { label: labels.join(' + '), isMulti: true };
    }

    const t = schoolTurmas.find(item => String(item.id) === String(turmaIdStr));
    if (!t) return { label: '—', isMulti: false };
    const isMulti = t.modality === 'MULTISSERIADA' || t.tipo === 'MULTISSERIADA' || t.modality === 'MULTIETAPA';
    const base = `${t.year || t.anoSerie || ''} - ${t.name || ''}`.trim();
    return { label: base, isMulti };
  };

  // Turmas da etapa ativa (para visão empilhada na impressão)
  const etapaTurmas = schoolTurmas.filter(t => {
    const stage = (t.stage || '').toLowerCase();
    const level = (t.level || '').toLowerCase();
    const year = (t.year || t.anoSerie || '').toLowerCase();

    if (activeEtapa === 'Educação Infantil') {
      return stage.includes('infantil') || stage.includes('creche') || stage.includes('pré') || level === 'infantil';
    }
    if (activeEtapa === 'Anos Iniciais') {
      return stage.includes('iniciais') || (!stage.includes('finais') && (/^[1-5]º?\s*ano/i.test(year) || /fundamental\s*i\b/i.test(stage)));
    }
    if (activeEtapa === 'Anos Finais') {
      return stage.includes('finais') || /^[6-9]º?\s*ano/i.test(year) || /fundamental\s*ii\b/i.test(stage);
    }
    return true;
  });

  // Filtrar slots por grupo de turmas (para visão empilhada)
  const getCellSlotsForGroup = (diaId: string, numeroAula: number, turmaIds: string[]): HorarioSlotData[] => {
    return horarios.filter(h => {
      if (h.dia_semana !== diaId) return false;
      if (h.numero_aula !== numeroAula) return false;
      if (h.turno !== activeTurno) return false;
      if (h.etapa && h.etapa !== activeEtapa) return false;
      const ids = (h.turma_id || '').split(',').map(s => s.trim());
      return ids.some(id => turmaIds.includes(id));
    });
  };

  // Agrupar turmas multisseriadas em um único grupo
  const turmaGroups = (() => {
    type TG = { id: string; turmaIds: string[]; label: string; isMulti: boolean };
    const multiGroupSets: Set<string>[] = [];
    const turmaToGroup = new Map<string, number>();

    horarios.forEach(h => {
      if (h.turno !== activeTurno) return;
      if (h.etapa && h.etapa !== activeEtapa) return;
      const ids = (h.turma_id || '').split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length <= 1) return;

      let existingIdx = -1;
      for (const id of ids) {
        if (turmaToGroup.has(id)) { existingIdx = turmaToGroup.get(id)!; break; }
      }
      if (existingIdx >= 0) {
        for (const id of ids) { multiGroupSets[existingIdx].add(id); turmaToGroup.set(id, existingIdx); }
      } else {
        const newIdx = multiGroupSets.length;
        multiGroupSets.push(new Set(ids));
        for (const id of ids) { turmaToGroup.set(id, newIdx); }
      }
    });

    const groups: TG[] = [];
    const processedIds = new Set<string>();

    for (const groupSet of multiGroupSets) {
      const ids = Array.from(groupSet);
      const turmas = ids.map(id => etapaTurmas.find((t: any) => String(t.id) === id)).filter(Boolean);
      if (turmas.length === 0) continue;
      const labels = turmas.map((t: any) => `${t.year || t.anoSerie || ''} ${t.name || ''}`.trim());
      groups.push({ id: `multi-${ids.sort().join('-')}`, turmaIds: ids, label: labels.join(' + '), isMulti: true });
      ids.forEach(id => processedIds.add(id));
    }

    for (const turma of etapaTurmas) {
      if (processedIds.has(String(turma.id))) continue;
      groups.push({
        id: String(turma.id),
        turmaIds: [String(turma.id)],
        label: `${turma.year || turma.anoSerie || ''} - ${turma.name || ''}`.trim(),
        isMulti: false,
      });
    }

    return groups;
  })();

  // Filtrar os slots que pertencem a este turno e etapa (e turma se filtrada) — para visão de turma individual
  const getCellSlots = (diaId: string, numeroAula: number): HorarioSlotData[] => {
    return horarios.filter(h => {
      if (h.dia_semana !== diaId) return false;
      if (h.numero_aula !== numeroAula) return false;
      if (h.turno !== activeTurno) return false;
      if (h.etapa && h.etapa !== activeEtapa) return false;

      if (selectedTurmaFilter && selectedTurmaFilter !== 'ALL') {
        const ids = (h.turma_id || '').split(',').map(s => s.trim());
        if (!ids.includes(selectedTurmaFilter)) return false;
      }

      return true;
    });
  };

  // Docentes presentes nesta grade para legenda
  const relevantTeacherIds = new Set(
    horarios
      .filter(h => h.turno === activeTurno && (!h.etapa || h.etapa === activeEtapa))
      .map(h => h.teacher_id)
  );
  const activeTeachers = schoolTeachers.filter(t => relevantTeacherIds.has(t.id));

  // Filtro de turma selecionada para o cabeçalho
  const selectedTurmaObj = selectedTurmaFilter !== 'ALL'
    ? schoolTurmas.find(t => String(t.id) === String(selectedTurmaFilter))
    : null;
  const turmaFiltroTexto = selectedTurmaObj
    ? `${selectedTurmaObj.year || selectedTurmaObj.anoSerie || ''} - ${selectedTurmaObj.name || ''}`.trim()
    : 'Todas as Turmas da Unidade';

  // Helper para renderizar a grade de um grupo de turmas (reutilizado em ambos os modos)
  const renderScheduleGrid = (turmaIds?: string[], turmaLabel?: string, isMultiGroup?: boolean) => {
    const getSlotsForCell = (diaId: string, numero: number) => 
      turmaIds ? getCellSlotsForGroup(diaId, numero, turmaIds) : getCellSlots(diaId, numero);

    return (
      <div className="print-avoid-break" style={{ marginBottom: turmaIds ? '14pt' : '12pt' }}>
        {/* Cabeçalho da turma/grupo (apenas no modo empilhado) */}
        {turmaLabel && (
          <div style={{ 
            padding: '5pt 10pt', 
            background: isMultiGroup ? '#faf5ff' : '#fff7ed', 
            border: `0.5pt solid ${isMultiGroup ? '#e9d5ff' : '#fed7aa'}`, 
            borderBottom: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6pt'
          }}>
            {isMultiGroup && (
              <span style={{ fontSize: '6.5pt', fontWeight: 900, background: '#f3e8ff', color: '#6b21a8', padding: '1pt 4pt', borderRadius: '2pt', textTransform: 'uppercase', marginRight: '2pt' }}>
                Multisseriada
              </span>
            )}
            <span style={{ fontSize: '9pt', fontWeight: 900, color: isMultiGroup ? '#7e22ce' : '#c2410c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              📋 {turmaLabel}
            </span>
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#ffffff' }}>
              <th style={{ padding: '5pt 6pt', border: '0.5pt solid #0f172a', width: '13%', textAlign: 'center', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Horário / Aula
              </th>
              {DIAS_SEMANA.map(dia => (
                <th key={dia.id} style={{ padding: '5pt 6pt', border: '0.5pt solid #0f172a', width: '17.4%', textAlign: 'center', fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {dia.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentTurnoHorarios.map((horario, idx) => {
              if (horario.intervalo) {
                return (
                  <tr key={`intervalo-${idx}`} style={{ background: '#fef3c7' }}>
                    <td 
                      colSpan={6} 
                      style={{ 
                        padding: '4pt 8pt', 
                        border: '0.5pt solid #cbd5e1', 
                        textAlign: 'center', 
                        fontSize: '7.5pt', 
                        fontWeight: 900, 
                        color: '#92400e', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.08em' 
                      }}
                    >
                      ☕ Intervalo / Recreio — {horario.inicio} às {horario.fim} ({currentTurnoConfig.duracaoIntervalo} min)
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={`aula-${horario.numero}`}>
                  {/* Coluna Horário */}
                  <td style={{ padding: '4pt 6pt', border: '0.5pt solid #cbd5e1', background: '#f8fafc', textAlign: 'center', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 900, fontSize: '8pt', color: '#0f172a' }}>
                      {horario.numero}ª Aula
                    </div>
                    <div style={{ fontSize: '7pt', fontWeight: 700, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                      {horario.inicio} - {horario.fim}
                    </div>
                  </td>

                  {/* Colunas Dias da Semana */}
                  {DIAS_SEMANA.map(dia => {
                    const cellSlots = getSlotsForCell(dia.id, horario.numero);

                    return (
                      <td 
                        key={dia.id} 
                        style={{ 
                          padding: '3pt 4pt', 
                          border: '0.5pt solid #cbd5e1', 
                          verticalAlign: 'top', 
                          background: cellSlots.length > 0 ? '#ffffff' : '#fafafa' 
                        }}
                      >
                        {cellSlots.length === 0 ? (
                          <div style={{ height: '32pt', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '9pt' }}>
                            —
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3pt' }}>
                            {cellSlots.map((slot, sIdx) => {
                              const turmaInfo = getTurmaLabel(slot.turma_id);
                              const teacherName = getTeacherName(slot.teacher_id);

                              return (
                                <div 
                                  key={slot.id || sIdx} 
                                  style={{ 
                                    padding: '3pt 4pt', 
                                    borderRadius: '4pt', 
                                    border: '0.5pt solid #e2e8f0', 
                                    background: turmaInfo.isMulti ? '#faf5ff' : '#f8fafc',
                                    borderLeft: turmaInfo.isMulti ? '2.5pt solid #9333ea' : '2.5pt solid #ea580c'
                                  }}
                                >
                                  {/* Professor */}
                                  <div style={{ fontWeight: 800, fontSize: '7.5pt', color: '#0f172a', lineHeight: 1.2 }}>
                                    {teacherName}
                                  </div>

                                  {/* Turma / Multisseriada */}
                                  <div style={{ fontSize: '7pt', fontWeight: 700, color: turmaInfo.isMulti ? '#7e22ce' : '#ea580c', marginTop: '1pt' }}>
                                    {turmaInfo.isMulti && (
                                      <span style={{ fontSize: '6pt', fontWeight: 900, background: '#f3e8ff', color: '#6b21a8', padding: '0.5pt 2.5pt', borderRadius: '2pt', marginRight: '2pt', textTransform: 'uppercase' }}>
                                        Multisseriada
                                      </span>
                                    )}
                                    {turmaInfo.label}
                                  </div>

                                  {/* Componente */}
                                  {slot.componente && (
                                    <div style={{ fontSize: '6.5pt', fontWeight: 600, color: '#475569', marginTop: '1pt', textTransform: 'uppercase' }}>
                                      {slot.componente}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return createPortal(
    <div 
      id="print-report" 
      className="hidden print:block bg-white text-slate-900" 
      style={{ 
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", 
        padding: '12pt 16pt 30pt 16pt'
      }}
    >
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm 10mm 10mm 10mm;
          }
          #print-report {
            display: block !important;
            visibility: visible !important;
          }
          .print-avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* ====== INSTITUTIONAL HEADER ====== */}
      <div className="text-center mb-3 pb-2" style={{ borderBottom: '2pt solid #0f172a' }}>
        <p style={{ fontSize: '7.5pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '1pt' }}>
          ESTADO DO MARANHÃO • PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
        </p>
        <p style={{ fontSize: '9.5pt', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '2pt' }}>
          SECRETARIA MUNICIPAL DE EDUCAÇÃO — SEMED
        </p>
        <div style={{ width: '45pt', height: '1.5pt', background: '#f97316', margin: '0 auto 4pt' }} />
        <h1 style={{ fontSize: '14pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 2pt' }}>
          Quadro de Horário Docente — Distribuição Semanal
        </h1>
        <p style={{ fontSize: '7.5pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          SIGAR • Sistema Integrado de Gestão e Acompanhamento Regional ({currentYear})
        </p>
      </div>

      {/* ====== METADATA BLOCK ====== */}
      <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', color: '#64748b', width: '14%', background: '#f8fafc' }}>
                Unidade Escolar:
              </td>
              <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '9pt', fontWeight: 700, color: '#0f172a', width: '36%' }}>
                {escola?.nome || 'Unidade Escolar'}
              </td>
              <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', color: '#64748b', width: '14%', background: '#f8fafc' }}>
                Etapa de Ensino:
              </td>
              <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '9pt', fontWeight: 700, color: '#ea580c', width: '36%' }}>
                {activeEtapa}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', color: '#64748b', background: '#f8fafc' }}>
                Turno & Horário:
              </td>
              <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 600, color: '#334155' }}>
                {currentTurnoDef.label} • Início: {currentTurnoConfig.inicio} • Aula: {duracaoAulaAtiva} min • Recreio: {currentTurnoConfig.duracaoIntervalo} min
              </td>
              <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', color: '#64748b', background: '#f8fafc' }}>
                Escopo / Turma:
              </td>
              <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8.5pt', fontWeight: 700, color: '#0f172a' }}>
                {turmaFiltroTexto}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', color: '#64748b', background: '#f8fafc' }}>
                Gestão / Coordenação:
              </td>
              <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8pt', fontWeight: 600, color: '#475569' }}>
                {escola?.gestor || escola?.coordenador || 'Equipe Gestora'}
              </td>
              <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', color: '#64748b', background: '#f8fafc' }}>
                Emissão do Sistema:
              </td>
              <td style={{ padding: '4pt 8pt', border: '0.5pt solid #cbd5e1', fontSize: '8pt', fontWeight: 600, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                {emissionDate} às {emissionTime}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== GRADE HORÁRIA SEMANAL ====== */}
      {selectedTurmaFilter === 'ALL' && turmaGroups.length > 0 ? (
        /* Visão empilhada: uma grade por grupo/turma */
        <>
          {turmaGroups.map(group => (
            <React.Fragment key={group.id}>
              {renderScheduleGrid(group.turmaIds, group.label, group.isMulti)}
            </React.Fragment>
          ))}
        </>
      ) : (
        /* Grade única para turma selecionada */
        renderScheduleGrid()
      )}

      {/* ====== LEGENDA DE DOCENTES ====== */}
      {activeTeachers.length > 0 && (
        <div className="print-avoid-break" style={{ marginBottom: '14pt', padding: '5pt 8pt', background: '#f8fafc', border: '0.5pt solid #cbd5e1' }}>
          <p style={{ fontSize: '7pt', fontWeight: 900, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.1em', marginBottom: '3pt' }}>
            Docentes Alocados no Turno ({activeTeachers.length}):
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4pt 12pt', fontSize: '7pt', color: '#334155' }}>
            {activeTeachers.map(t => (
              <span key={t.id} style={{ fontWeight: 700 }}>
                • {t.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ====== ASSINATURAS ====== */}
      <div 
        className="print-avoid-break" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '20pt', 
          paddingTop: '20pt', 
          marginTop: '10pt',
          pageBreakInside: 'avoid'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1pt solid #0f172a', width: '85%', margin: '0 auto 4pt' }} />
          <p style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', marginBottom: '1pt' }}>
            Coordenação Pedagógica
          </p>
          <p style={{ fontSize: '6.5pt', fontWeight: 600, color: '#64748b' }}>
            {escola?.coordenador || 'Coordenador(a) da Unidade'}
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1pt solid #0f172a', width: '85%', margin: '0 auto 4pt' }} />
          <p style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', marginBottom: '1pt' }}>
            Direção Escolar
          </p>
          <p style={{ fontSize: '6.5pt', fontWeight: 600, color: '#64748b' }}>
            {escola?.gestor || 'Gestor(a) Escolar'}
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1pt solid #0f172a', width: '85%', margin: '0 auto 4pt' }} />
          <p style={{ fontSize: '7.5pt', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', marginBottom: '1pt' }}>
            Secretaria de Educação — SEMED
          </p>
          <p style={{ fontSize: '6.5pt', fontWeight: 600, color: '#64748b' }}>
            Supervisão e Inspeção Escolar
          </p>
        </div>
      </div>

      {/* ====== RODAPÉ ====== */}
      <div 
        style={{ 
          marginTop: '18pt', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          fontSize: '6.5pt', 
          fontWeight: 700, 
          color: '#94a3b8', 
          textTransform: 'uppercase', 
          letterSpacing: '0.12em', 
          borderTop: '0.5pt solid #cbd5e1', 
          paddingTop: '4pt' 
        }}
      >
        <span>SIGAR • SISTEMA INTEGRADO DE GESTÃO E ACOMPANHAMENTO REGIONAL</span>
        <span>SEMED • HUMBERTO DE CAMPOS / MA</span>
      </div>
    </div>,
    document.body
  );
};
