import React from 'react';
import { createPortal } from 'react-dom';
import { Escola, RecursoHumano } from '../types';

export type TipoRelatorio = 'professores' | 'gestores' | 'coordenadores';
export type FiltroVinculo = 'Todos' | 'Efetivo' | 'Contratado';
export type SubtipoGestor = 'Todos' | 'Gestor(a) Geral' | 'Gestor(a) Pedagógico(a)';

interface PrintableGerencialReportProps {
    tipo: TipoRelatorio;
    vinculo: FiltroVinculo;
    subtipoGestor?: SubtipoGestor;
    escolas: Escola[];
}

interface ServidorComEscola extends RecursoHumano {
    escolaNome: string;
}

const TITULO_MAP: Record<TipoRelatorio, string> = {
    professores: 'Relação de Professores',
    gestores: 'Relação de Gestores',
    coordenadores: 'Relação de Coordenadores Pedagógicos',
};

const SUBTITULO_MAP: Record<TipoRelatorio, string> = {
    professores: 'Corpo Docente da Rede Municipal de Ensino',
    gestores: 'Gestores das Unidades Escolares',
    coordenadores: 'Coordenadores Pedagógicos das Unidades Escolares',
};

function filtrarServidores(
    escolas: Escola[],
    tipo: TipoRelatorio,
    vinculo: FiltroVinculo,
    subtipoGestor?: SubtipoGestor
): ServidorComEscola[] {
    const resultado: ServidorComEscola[] = [];

    escolas.forEach(escola => {
        const servidores = escola.recursosHumanos || [];
        servidores.forEach(srv => {
            let match = false;

            if (tipo === 'professores') {
                match = srv.funcao === 'Professor(a)';
            } else if (tipo === 'gestores') {
                if (subtipoGestor && subtipoGestor !== 'Todos') {
                    match = srv.funcao === subtipoGestor;
                } else {
                    match = srv.funcao === 'Gestor(a) Geral' || srv.funcao === 'Gestor(a) Pedagógico(a)';
                }
            } else if (tipo === 'coordenadores') {
                match = srv.funcao === 'Coordenador(a) Pedagógico(a)';
            }

            if (match && (vinculo === 'Todos' || srv.tipoVinculo === vinculo)) {
                resultado.push({ ...srv, escolaNome: escola.nome });
            }
        });
    });

    return resultado.sort((a, b) => {
        const dateA = a.dataNomeacao ? new Date(a.dataNomeacao).getTime() : Infinity;
        const dateB = b.dataNomeacao ? new Date(b.dataNomeacao).getTime() : Infinity;
        return dateA - dateB;
    });
}

export const PrintableGerencialReport: React.FC<PrintableGerencialReportProps> = ({
    tipo,
    vinculo,
    subtipoGestor,
    escolas,
}) => {
    const currentYear = new Date().getFullYear();
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const servidores = filtrarServidores(escolas, tipo, vinculo, subtipoGestor);
    const efetivos = servidores.filter(s => s.tipoVinculo === 'Efetivo').length;
    const contratados = servidores.filter(s => s.tipoVinculo === 'Contratado').length;

    const filtroDescricao = vinculo === 'Todos'
        ? 'Todos os Vínculos'
        : `Somente ${vinculo}s`;

    return createPortal(
        <div id="print-gerencial-report" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

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
                    {TITULO_MAP[tipo]}
                </h1>
                <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    {SUBTITULO_MAP[tipo]}
                </p>
            </div>

            {/* ====== EMISSION INFO ====== */}
            <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6pt 10pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '10pt' }}>
                <div>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                        Filtro Aplicado
                    </p>
                    <p style={{ fontSize: '10pt', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                        {filtroDescricao}
                        {tipo === 'gestores' && subtipoGestor && subtipoGestor !== 'Todos' && ` • ${subtipoGestor}`}
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

            {/* ====== SUMMARY STATISTICS ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '14pt', display: 'flex', gap: '10pt' }}>
                <div style={{ flex: 1, padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#f1f5f9' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2pt' }}>Total de Servidores</p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, color: '#0f172a' }}>{servidores.length}</p>
                </div>
                <div style={{ flex: 1, padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#ecfdf5' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#047857', textTransform: 'uppercase', marginBottom: '2pt' }}>Efetivos</p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, color: '#065f46' }}>{efetivos}</p>
                </div>
                <div style={{ flex: 1, padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#fff7ed' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', marginBottom: '2pt' }}>Contratados</p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, color: '#9a3412' }}>{contratados}</p>
                </div>
                <div style={{ flex: 1, padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#eff6ff' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '2pt' }}>Unidades Escolares</p>
                    <p style={{ fontSize: '14pt', fontWeight: 900, color: '#1e40af' }}>{new Set(servidores.map(s => s.escolaNome)).size}</p>
                </div>
            </div>

            {/* ====== TABLE ====== */}
            <div style={{ marginBottom: '10pt' }}>
                <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt' }}>
                    Relação Nominal — {TITULO_MAP[tipo]}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'center', width: '5%' }}>Nº</th>
                            <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'left' }}>Nome do Servidor</th>
                            <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'left' }}>Unidade Escolar</th>
                            <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'left' }}>Função / Cargo</th>
                            <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'center', width: '12%' }}>Vínculo</th>
                            <th style={{ padding: '5pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'center', width: '12%' }}>Data Nomeação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {servidores.map((servidor, index) => (
                            <tr key={`${servidor.id}-${servidor.escolaNome}`}>
                                <td style={{ padding: '4pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 600, color: '#94a3b8', textAlign: 'center' }}>
                                    {index + 1}
                                </td>
                                <td style={{ padding: '4pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#334155' }}>
                                    {servidor.nome}
                                    {servidor.email && <div style={{ fontSize: '7pt', fontWeight: 400, color: '#64748b', marginTop: '1pt' }}>{servidor.email}</div>}
                                </td>
                                <td style={{ padding: '4pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 600, color: '#475569' }}>
                                    {servidor.escolaNome}
                                </td>
                                <td style={{ padding: '4pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', color: '#334155' }}>
                                    <div style={{ fontWeight: 600 }}>{servidor.funcao}</div>
                                    {tipo === 'professores' && servidor.etapaAtuacao && (
                                        <div style={{ fontSize: '7pt', color: '#64748b' }}>
                                            {servidor.etapaAtuacao}
                                            {servidor.componenteCurricular ? ` • ${servidor.componenteCurricular}` : ''}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '4pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 600, color: '#475569', textAlign: 'center', textTransform: 'uppercase' }}>
                                    {servidor.tipoVinculo}
                                </td>
                                <td style={{ padding: '4pt 10pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', color: '#475569', textAlign: 'center' }}>
                                    {servidor.dataNomeacao ? new Date(servidor.dataNomeacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                                </td>
                            </tr>
                        ))}
                        {servidores.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '10pt', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '9pt' }}>
                                    Nenhum servidor encontrado com os filtros selecionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ====== SIGNATURES ====== */}
            <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '30pt', pageBreakInside: 'avoid' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Secretário(a) Municipal de Educação
                    </p>
                    <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                        SEMED
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Coordenação Regional
                    </p>
                    <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                        VISTO / RECEBIDO
                    </p>
                </div>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ marginTop: '30pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '6pt' }}>
                <span>SIGAR • Sistema Integrado de Gestão</span>
                <span>Relatórios Gerenciais • {currentYear}</span>
            </div>
        </div>,
        document.body
    );
};
