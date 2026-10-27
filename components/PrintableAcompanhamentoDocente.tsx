import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PrintableAcompanhamentoDocenteProps {
    acompanhamento: any;
    escolaNome?: string;
    onClose: () => void;
}

export const PrintableAcompanhamentoDocente: React.FC<PrintableAcompanhamentoDocenteProps> = ({
    acompanhamento,
    escolaNome,
    onClose
}) => {
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

    if (!acompanhamento) return null;

    const isInfantil = acompanhamento.etapa === 'infantil' || Boolean(acompanhamento.crianca) || Boolean(acompanhamento.agrupamento);
    const currentYear = new Date().getFullYear();
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const formatDisplayDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        if (typeof dateStr === 'string' && dateStr.includes('-')) {
            const clean = dateStr.split('T')[0];
            const parts = clean.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        }
        return dateStr;
    };

    const resolvedEscolaNome = escolaNome || acompanhamento.escola_nome || acompanhamento.escolaNome || acompanhamento.escola;
    const estudanteNome = isInfantil
        ? (acompanhamento.crianca || acompanhamento.estudante_alvo || acompanhamento.estudante)
        : (acompanhamento.estudante || acompanhamento.estudante_nome || acompanhamento.estudante_alvo);
    const professorNome = acompanhamento.professor || acompanhamento.professor_nome;
    const turmaNome = isInfantil
        ? (acompanhamento.agrupamento || acompanhamento.turma_nome || acompanhamento.turma)
        : (acompanhamento.turma || acompanhamento.turma_nome);
    const componenteNome = isInfantil
        ? (acompanhamento.campoExperiencia || acompanhamento.campo_experiencia || acompanhamento.componente_curricular || acompanhamento.componente)
        : (acompanhamento.componente || acompanhamento.componente_curricular);
    const periodoLetivo = acompanhamento.periodoLetivo || acompanhamento.periodo_letivo;
    const dataRegistro = formatDisplayDate(acompanhamento.data || acompanhamento.data_registro);
    const extraIdentificacao = isInfantil
        ? (acompanhamento.tipoInteracao || acompanhamento.tipo_interacao)
        : (acompanhamento.lider || acompanhamento.lider_turma);

    const dificuldadesTexto = isInfantil
        ? (acompanhamento.evidencias || acompanhamento.dificuldades)
        : (acompanhamento.dificuldades || acompanhamento.evidencias);

    const intervencaoTexto = isInfantil
        ? (acompanhamento.intencionalidade || acompanhamento.intervencao_pedagogica || acompanhamento.intervencao_sugerida || acompanhamento.intervencao)
        : (acompanhamento.intervencao || acompanhamento.intervencao_pedagogica || acompanhamento.intervencao_sugerida);

    const content = (
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
            <h1 style={{ fontSize: '14pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 4pt' }}>
              Acompanhamento Docente
            </h1>
            <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Conselho de Classe — {isInfantil ? 'Educação Infantil' : 'Ensino Fundamental'}
            </p>
          </div>

          {/* ====== PROTOCOL & EMISSION ====== */}
          <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6pt 10pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '10pt' }}>
            <div>
              <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                Identificação do Documento
              </p>
              <p style={{ fontSize: '12pt', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                REG. Nº {acompanhamento.id ? String(acompanhamento.id).split('-')[0].toUpperCase() : 'REF'}/{currentYear}
              </p>
            </div>
            {resolvedEscolaNome && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                  Unidade Escolar
                </p>
                <p style={{ fontSize: '9.5pt', fontWeight: 800, color: '#0f172a' }}>
                  {resolvedEscolaNome}
                </p>
              </div>
            )}
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
          <div className="print-avoid-break" style={{ marginBottom: '12pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt', marginBottom: '0' }}>
              Dados de Identificação
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {resolvedEscolaNome && (
                  <tr>
                    <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '22%', background: '#f8fafc' }}>
                      Unidade Escolar
                    </td>
                    <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9.5pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                      {resolvedEscolaNome}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '22%', background: '#f8fafc' }}>
                    {isInfantil ? 'Criança em Observação' : 'Estudante com Dificuldade'}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                    {estudanteNome || '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '22%' }}>
                    Professor(a) Responsável
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#0f172a', width: '28%' }}>
                    {professorNome || '—'}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '22%' }}>
                    {isInfantil ? 'Agrupamento / Turma' : 'Turma'}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155', width: '28%' }}>
                    {turmaNome || '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    {isInfantil ? 'Campo de Experiência (BNCC)' : 'Componente Curricular'}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                    {componenteNome || '—'}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Período Letivo
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                    {periodoLetivo || '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Data do Registro
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                    {dataRegistro}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    {isInfantil ? 'Tipo de Interação' : 'Líder de Turma'}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                    {extraIdentificacao || '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ====== DIFICULDADES / EVIDÊNCIAS ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
              {isInfantil ? 'Evidências de Aprendizagem e Desenvolvimento' : 'Dificuldades Encontradas'}
            </div>
            <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt', textAlign: 'justify' }}>
              <p className="whitespace-pre-wrap" style={{ margin: 0 }}>
                {dificuldadesTexto || 'Nenhuma dificuldade registrada.'}
              </p>
            </div>
          </div>

          {/* ====== INTERVENÇÃO / MEDIAÇÃO ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
              {isInfantil ? 'Intencionalidade Pedagógica / Mediação do Professor' : 'Intervenção Pedagógica do Professor'}
            </div>
            <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt', textAlign: 'justify' }}>
              <p className="whitespace-pre-wrap" style={{ margin: 0 }}>
                {intervencaoTexto || 'Nenhuma intervenção registrada.'}
              </p>
            </div>
          </div>

          {/* ====== SIGNATURES ====== */}
          <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '24pt', marginTop: '16pt' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1.5pt solid #0f172a', width: '100%', marginBottom: '6pt' }} />
              <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                {professorNome || 'Professor(a) Responsável'}
              </p>
              <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                ASSINATURA DO(A) DOCENTE
              </p>
              <p style={{ fontSize: '7pt', color: '#94a3b8', fontStyle: 'italic' }}>
                Assinatura e Carimbo
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1.5pt solid #0f172a', width: '100%', marginBottom: '6pt' }} />
              <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                Coordenação Pedagógica
              </p>
              <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                EQUIPE GESTORA / VISTO
              </p>
              <p style={{ fontSize: '7pt', color: '#94a3b8', fontStyle: 'italic' }}>
                Assinatura e Carimbo
              </p>
            </div>
          </div>

          {/* ====== FOOTER ====== */}
          <div className="print-footer" style={{ marginTop: '24pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '6pt' }}>
            <span>SIGAR • Sistema Integrado de Gestão de Aprendizagem</span>
            <span>Secretaria Municipal de Educação • Humberto de Campos/MA</span>
          </div>
        </div>
    );

    return createPortal(content, document.body);
};
