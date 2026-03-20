import React from 'react';
import { createPortal } from 'react-dom';
import { Escola, RecursoHumano, Coordenador } from '../types';

interface PrintableCartaApresentacaoProps {
    escola: Escola;
    servidor: RecursoHumano;
    coordenadorRegional?: Coordenador;
}

const isGestorGeral = (funcao: string) =>
    funcao.toLowerCase().includes('gestor') && funcao.toLowerCase().includes('geral');

const isDestinatarioGestor = (funcao: string) =>
    funcao.toLowerCase().includes('professor') ||
    (funcao.toLowerCase().includes('gestor') && funcao.toLowerCase().includes('pedagóg')) ||
    funcao.toLowerCase().includes('coordenador');

export const PrintableCartaApresentacao: React.FC<PrintableCartaApresentacaoProps> = ({
    escola,
    servidor,
    coordenadorRegional,
}) => {
    const emissionDate = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    const gestorGeral = isGestorGeral(servidor.funcao);
    // determinar destinatário
    const destinatarioNome = gestorGeral
        ? (coordenadorRegional?.nome || 'Coordenador(a) Regional')
        : (escola.gestor || 'Gestor(a) Geral');
    const destinatarioCargo = gestorGeral
        ? 'Coordenador(a) Regional'
        : 'Gestor(a) Geral da Unidade Escolar';

    const assunto = gestorGeral
        ? `Apresentação e Encaminhamento — ${servidor.funcao}`
        : `Apresentação e Encaminhamento — ${servidor.funcao}`;

    return createPortal(
        <div
            id="print-carta"
            className="hidden print:block bg-white text-slate-900"
            style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", padding: '40pt 50pt' }}
        >
            {/* ===== INSTITUTIONAL HEADER ===== */}
            <div style={{ textAlign: 'center', marginBottom: '24pt', paddingBottom: '16pt', borderBottom: '2pt solid #0f172a' }}>
                <p style={{ fontSize: '7.5pt', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#64748b', marginBottom: '3pt' }}>
                    ESTADO DO MARANHÃO
                </p>
                <p style={{ fontSize: '11pt', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '3pt' }}>
                    PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
                </p>
                <p style={{ fontSize: '8.5pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '10pt' }}>
                    SECRETARIA MUNICIPAL DE EDUCAÇÃO
                </p>
                <div style={{ width: '50pt', height: '2pt', background: '#f97316', margin: '0 auto' }} />
            </div>

            {/* ===== DOCUMENT TITLE ===== */}
            <div style={{ textAlign: 'center', marginBottom: '28pt' }}>
                <p style={{ fontSize: '10pt', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '4pt' }}>
                    Carta de Apresentação e Encaminhamento
                </p>
                <p style={{ fontSize: '7.5pt', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Documento Oficial — SIGAR
                </p>
            </div>

            {/* ===== LOCATION & DATE ===== */}
            <p style={{ textAlign: 'right', fontWeight: 600, fontSize: '9pt', color: '#475569', marginBottom: '20pt' }}>
                Humberto de Campos - MA, {emissionDate}.
            </p>

            {/* ===== ADDRESSEE ===== */}
            <div style={{ marginBottom: '20pt' }}>
                <p style={{ fontSize: '9.5pt', fontWeight: 700, color: '#0f172a' }}>
                    Ao(À) Sr(a). <strong>{destinatarioNome}</strong>
                </p>
                <p style={{ fontSize: '9pt', fontWeight: 600, color: '#475569' }}>
                    {destinatarioCargo}
                </p>
                {!gestorGeral && (
                    <p style={{ fontSize: '9pt', fontWeight: 600, color: '#475569' }}>
                        {escola.nome}
                    </p>
                )}
            </div>

            {/* ===== SUBJECT ===== */}
            <p style={{ fontSize: '9pt', fontWeight: 800, color: '#0f172a', marginBottom: '20pt', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Assunto: {assunto}
            </p>

            {/* ===== BODY ===== */}
            <div style={{ lineHeight: 1.85, fontSize: '10pt', color: '#1e293b', textAlign: 'justify' }}>
                <p style={{ marginBottom: '14pt' }}>
                    Cumprimentando-o(a) cordialmente, venho por meio desta apresentar e encaminhar o(a) servidor(a){' '}
                    <strong>{servidor.nome}</strong>, portador(a) do cargo/função de <strong>{servidor.funcao}</strong>
                    {servidor.cpf ? <>, inscrito(a) no CPF sob o nº <strong>{servidor.cpf}</strong></> : ''}, com tipo de vínculo{' '}
                    <strong>{servidor.tipoVinculo}</strong>
                    {servidor.cargaHoraria ? <>, carga horária de <strong>{servidor.cargaHoraria}</strong></> : ''}
                    {servidor.dataNomeacao
                        ? `, nomeado(a) em ${new Date(servidor.dataNomeacao + 'T12:00:00').toLocaleDateString('pt-BR')}`
                        : ''}
                    {servidor.etapaAtuacao ? `, atuando na etapa de ${servidor.etapaAtuacao}` : ''}
                    {servidor.componenteCurricular ? ` — ${servidor.componenteCurricular}` : ''}.
                </p>

                {gestorGeral ? (
                    <p style={{ marginBottom: '14pt' }}>
                        O(A) referido(a) servidor(a) está sendo encaminhado(a) à <strong>Coordenação Regional</strong> para
                        os devidos registros, ciência e providências que se fizerem necessárias, considerando sua designação
                        como Gestor(a) Geral da unidade escolar <strong>{escola.nome}</strong>.
                    </p>
                ) : (
                    <p style={{ marginBottom: '14pt' }}>
                        O(A) referido(a) servidor(a) está sendo encaminhado(a) ao <strong>Gestor(a) Geral</strong> da
                        unidade escolar <strong>{escola.nome}</strong> para os devidos registros e início de suas atividades,
                        solicitando a boa acolhida e os encaminhamentos necessários.
                    </p>
                )}

                <p style={{ marginBottom: '14pt' }}>
                    Certos de vossa atenção e colaboração, colocamo-nos à disposição para quaisquer esclarecimentos
                    adicionais que se façam necessários.
                </p>

                <p style={{ marginBottom: '8pt' }}>Respeitosamente,</p>
            </div>

            {/* ===== SIGNATURES ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50pt', marginTop: '50pt' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '85%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        {coordenadorRegional?.nome || 'Coordenador(a) Regional'}
                    </p>
                    <p style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b' }}>
                        Coordenador(a) Regional — SEMED
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '85%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        {servidor.nome}
                    </p>
                    <p style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b' }}>
                        Servidor(a) — Ciente e de Acordo
                    </p>
                </div>
            </div>

            {/* ===== FOOTER ===== */}
            <div style={{ marginTop: '40pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '6pt' }}>
                <span>SIGAR • Sistema Integrado de Gestão</span>
                <span>{escola.nome}</span>
            </div>
        </div>,
        document.body
    );
};
