import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PrintableEncaminhamentoProps {
    encaminhamento: any;
    onClose: () => void;
}

export const PrintableEncaminhamento: React.FC<PrintableEncaminhamentoProps> = ({
    encaminhamento,
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

    if (!encaminhamento) return null;

    const isInfantil = encaminhamento.etapa === 'infantil';

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
              Registro de Encaminhamento e Intervenção
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
                REG. Nº {encaminhamento.id ? String(encaminhamento.id).split('-')[0].toUpperCase() : 'REF'}/{new Date().getFullYear()}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                Emissão do Sistema
              </p>
              <p style={{ fontSize: '9pt', fontWeight: 600, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '22%', background: '#f8fafc' }}>
                    {isInfantil ? 'Criança' : 'Estudante'}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                    {isInfantil ? encaminhamento.crianca : encaminhamento.estudante}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '22%' }}>
                    {isInfantil ? 'Agrupamento / Turma' : 'Turma'}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155', width: '28%' }}>
                    {isInfantil ? encaminhamento.agrupamento : encaminhamento.turma}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '22%' }}>
                    Período Letivo
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155', width: '28%' }}>
                    {encaminhamento.periodoLetivo}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Data do Registro
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 600, color: '#334155' }}>
                    {encaminhamento.data}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    {isInfantil ? 'Campo de Experiência' : 'Tipo de Intervenção'}
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a' }}>
                    {isInfantil ? encaminhamento.campoExperiencia : encaminhamento.tipo}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                    Status
                  </td>
                  <td style={{ padding: '6pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                    {encaminhamento.status}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ====== EVIDÊNCIAS / DESCRIÇÃO ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
              {isInfantil ? 'Evidências Observadas / Motivo do Registro' : 'Descrição do Caso / Motivo'}
            </div>
            <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt', textAlign: 'justify' }}>
              <p className="whitespace-pre-wrap" style={{ margin: 0 }}>{isInfantil ? encaminhamento.evidencias : encaminhamento.descricao}</p>
            </div>
          </div>

          {/* ====== ESTRATÉGIA / ENCAMINHAMENTO ====== */}
          <div className="print-avoid-break" style={{ marginBottom: '10pt' }}>
            <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
              {isInfantil ? 'Estratégia Pedagógica / Intervenção Proposta' : 'Encaminhamento / Ação Proposta'}
            </div>
            <div style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', borderTop: 'none', fontSize: '9pt', color: '#334155', lineHeight: '1.6', minHeight: '35pt', textAlign: 'justify' }}>
              <p className="whitespace-pre-wrap" style={{ margin: 0 }}>{isInfantil ? encaminhamento.estrategia : encaminhamento.encaminhamento}</p>
            </div>
          </div>

          {/* ====== SIGNATURES ====== */}
          <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '24pt', marginTop: '16pt' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1.5pt solid #0f172a', width: '100%', marginBottom: '6pt' }} />
              <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                {isInfantil ? (encaminhamento.professor || 'Professor(a)') : (encaminhamento.responsavel || 'Responsável pela Ação')}
              </p>
              <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                {isInfantil ? 'ASSINATURA DO(A) DOCENTE' : 'ASSINATURA DO(A) RESPONSÁVEL'}
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
