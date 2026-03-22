import React from 'react';
import { createPortal } from 'react-dom';
import { Escola, Segmento } from '../types';

interface PrintableMatriculaReportProps {
    escolas: Escola[];
    filtroLocalizacao: string;
}

export const PrintableMatriculaReport: React.FC<PrintableMatriculaReportProps> = ({
    escolas,
    filtroLocalizacao,
}) => {
    const currentYear = new Date().getFullYear();
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const filteredEscolas = escolas.filter(e => 
        filtroLocalizacao === 'Todas' || e.localizacao === filtroLocalizacao
    ).sort((a, b) => a.nome.localeCompare(b.nome));

    const stats = filteredEscolas.reduce((acc, e) => {
        acc.total += e.alunosMatriculados || 0;
        acc.infantil += e.dadosEducacionais?.matricula?.infantil || 0;
        acc.iniciais += e.dadosEducacionais?.matricula?.anosIniciais || 0;
        acc.finais += e.dadosEducacionais?.matricula?.anosFinais || 0;
        acc.eja += e.dadosEducacionais?.matricula?.eja || 0;
        return acc;
    }, { total: 0, infantil: 0, iniciais: 0, finais: 0, eja: 0 });

    return createPortal(
        <div id="print-matricula-report" className="hidden print:block bg-white text-slate-900 px-8 py-4" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

            {/* ====== INSTITUTIONAL HEADER ====== */}
            <div className="text-center mb-6 pb-4" style={{ borderBottom: '2pt solid #0f172a' }}>
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
                    Controle de Matrículas na Rede
                </h1>
                <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Consolidado Geral de Unidades Escolares - {currentYear}
                </p>
            </div>

            {/* ====== EMISSION INFO ====== */}
            <div className="print-avoid-break" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8pt 12pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '12pt' }}>
                <div>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                        Filtro de Localização
                    </p>
                    <p style={{ fontSize: '10pt', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                        {filtroLocalizacao}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2pt' }}>
                        Data de Emissão
                    </p>
                    <p style={{ fontSize: '9pt', fontWeight: 600, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                        {emissionDate} às {emissionTime}
                    </p>
                </div>
            </div>

            {/* ====== SUMMARY STATISTICS ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '16pt', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8pt' }}>
                <div style={{ padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#0f172a' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2pt' }}>Total Geral</p>
                    <p style={{ fontSize: '12pt', fontWeight: 900, color: '#fff' }}>{stats.total}</p>
                </div>
                <div style={{ padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#f8fafc' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2pt' }}>Infantil</p>
                    <p style={{ fontSize: '12pt', fontWeight: 900, color: '#0f172a' }}>{stats.infantil}</p>
                </div>
                <div style={{ padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#f8fafc' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2pt' }}>Anos Iniciais</p>
                    <p style={{ fontSize: '12pt', fontWeight: 900, color: '#0f172a' }}>{stats.iniciais}</p>
                </div>
                <div style={{ padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#f8fafc' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2pt' }}>Anos Finais</p>
                    <p style={{ fontSize: '12pt', fontWeight: 900, color: '#0f172a' }}>{stats.finais}</p>
                </div>
                <div style={{ padding: '8pt', border: '0.5pt solid #e2e8f0', background: '#f8fafc' }}>
                    <p style={{ fontSize: '6pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2pt' }}>EJA</p>
                    <p style={{ fontSize: '12pt', fontWeight: 900, color: '#0f172a' }}>{stats.eja}</p>
                </div>
            </div>

            {/* ====== TABLE ====== */}
            <div style={{ marginBottom: '20pt' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#0f172a' }}>
                            <th style={{ padding: '6pt 8pt', border: '0.5pt solid #334155', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', color: '#fff', textAlign: 'left' }}>Unidade Escolar</th>
                            <th style={{ padding: '6pt 4pt', border: '0.5pt solid #334155', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', color: '#fff', textAlign: 'center', width: '15%' }}>Localiz.</th>
                            <th style={{ padding: '6pt 4pt', border: '0.5pt solid #334155', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', color: '#fff', textAlign: 'center', width: '10%' }}>Infantil</th>
                            <th style={{ padding: '6pt 4pt', border: '0.5pt solid #334155', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', color: '#fff', textAlign: 'center', width: '10%' }}>Iniciais</th>
                            <th style={{ padding: '6pt 4pt', border: '0.5pt solid #334155', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', color: '#fff', textAlign: 'center', width: '10%' }}>Finais</th>
                            <th style={{ padding: '6pt 4pt', border: '0.5pt solid #334155', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', color: '#fff', textAlign: 'center', width: '10%' }}>EJA</th>
                            <th style={{ padding: '6pt 4pt', border: '0.5pt solid #334155', fontSize: '7pt', fontWeight: 800, textTransform: 'uppercase', color: '#fff', textAlign: 'center', width: '12%', background: '#1e293b' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEscolas.map((escola, index) => (
                            <tr key={escola.id} style={{ background: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={{ padding: '5pt 8pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 700, color: '#334155' }}>
                                    {escola.nome}
                                </td>
                                <td style={{ padding: '5pt 4pt', border: '0.5pt solid #e2e8f0', fontSize: '7pt', fontWeight: 600, color: '#64748b', textAlign: 'center' }}>
                                    {escola.localizacao}
                                </td>
                                <td style={{ padding: '5pt 4pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 600, color: '#334155', textAlign: 'center' }}>
                                    {escola.dadosEducacionais?.matricula?.infantil || 0}
                                </td>
                                <td style={{ padding: '5pt 4pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 600, color: '#334155', textAlign: 'center' }}>
                                    {escola.dadosEducacionais?.matricula?.anosIniciais || 0}
                                </td>
                                <td style={{ padding: '5pt 4pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 600, color: '#334155', textAlign: 'center' }}>
                                    {escola.dadosEducacionais?.matricula?.anosFinais || 0}
                                </td>
                                <td style={{ padding: '5pt 4pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 600, color: '#334155', textAlign: 'center' }}>
                                    {escola.dadosEducacionais?.matricula?.eja || 0}
                                </td>
                                <td style={{ padding: '5pt 4pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 900, color: '#0f172a', textAlign: 'center', background: index % 2 === 0 ? '#f1f5f9' : '#e2e8f0' }}>
                                    {escola.alunosMatriculados}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ====== SIGNATURES ====== */}
            <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '40pt', pageBreakInside: 'avoid' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Responsável pelo Censo/Matrícula
                    </p>
                    <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                        SME - HUMBERTO DE CAMPOS
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Secretário(a) Municipal de Educação
                    </p>
                    <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                        VISTO / HOMOLOGADO
                    </p>
                </div>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ marginTop: '40pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '8pt' }}>
                <span>SIGAR • Sistema Integrado de Gestão</span>
                <span>Controle de Matrículas • {currentYear}</span>
            </div>
        </div>,
        document.body
    );
};
