import React from 'react';
import { createPortal } from 'react-dom';
import { Escola } from '../types';

interface PrintableReuniaoEstudantilAtaProps {
    reuniao: any;
    escola?: Escola | null;
    turma?: any | null;
    estudantes?: any[];
}

export const PrintableReuniaoEstudantilAta: React.FC<PrintableReuniaoEstudantilAtaProps> = ({ 
    reuniao, 
    escola, 
    turma, 
    estudantes = [] 
}) => {
    if (!reuniao) return null;

    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const isInfantil = turma?.etapa === 'Educação Infantil';

    const CAMPOS_EXPERIENCIA = [
        'O Eu, o Outro e o Nós',
        'Corpo, Gestos e Movimentos',
        'Traços, Sons, Cores e Formas',
        'Escuta, Fala, Pensamento e Imaginação',
        'Espaços, Tempos, Quantidades, Relações e Transformações'
    ];

    const COMPONENTES_CURRICULARES = [
        'Língua Portuguesa',
        'Matemática',
        'Ciências',
        'História',
        'Geografia',
        'Artes',
        'Educação Física',
        'Ensino Religioso',
        'Língua Inglesa'
    ];

    const categoriasParaExibir = isInfantil ? CAMPOS_EXPERIENCIA : COMPONENTES_CURRICULARES;
    
    // Extrai dados das avaliações do wrapper
    const autoAvaliacaoTurma = reuniao.auto_avaliacao?.turma || reuniao.auto_avaliacao || {};
    const avaliacaoBncc = reuniao.auto_avaliacao?.bncc || reuniao.avaliacao_bncc || {};

    return createPortal(
        <div id="print-ata" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

            {/* ====== INSTITUTIONAL HEADER ====== */}
            <div className="text-center mb-6 pb-4" style={{ borderBottom: '2pt solid #0f172a' }}>
                <p style={{ fontSize: '10pt', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748b', marginBottom: '2pt' }}>
                    ESTADO DO MARANHÃO
                </p>
                <p style={{ fontSize: '12pt', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '4pt' }}>
                    PREFEITURA MUNICIPAL DE HUMBERTO DE CAMPOS
                </p>
                <p style={{ fontSize: '10pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b', marginBottom: '10pt' }}>
                    SECRETARIA MUNICIPAL DE EDUCAÇÃO
                </p>
                <div style={{ width: '80pt', height: '2pt', background: '#f97316', margin: '0 auto 8pt' }} />
                <h1 style={{ fontSize: '16pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#0f172a', margin: '0 0 4pt' }}>
                    ATA DE REUNIÃO ESTUDANTIL
                </h1>
                <p style={{ fontSize: '10pt', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    {reuniao.periodo_letivo} - {reuniao.ano_letivo}
                </p>
            </div>

            {/* ====== IDENTIFICATION BLOCK ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '16pt' }}>
                <div style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '6pt 12pt', marginBottom: '0' }}>
                    Identificação
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '20%', background: '#f8fafc' }}>
                                Unidade Escolar
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '11pt', fontWeight: 700, color: '#0f172a' }} colSpan={3}>
                                {escola?.nome || 'Não informada'}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                                Turma / Ano
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', color: '#334155' }}>
                                {turma ? `${turma.anoSerie} - ${turma.identificacao} (${turma.turno})` : reuniao.turma_nome}
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', width: '20%', background: '#f8fafc' }}>
                                Data do Registro
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', fontWeight: 600, color: '#334155' }}>
                                {new Date(reuniao.created_at || new Date()).toLocaleDateString('pt-BR')}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                                Pauta
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', color: '#334155' }} colSpan={3}>
                                {reuniao.pauta}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ====== AUTOAVALIAÇÃO DA TURMA ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '16pt' }}>
                <div style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '6pt 12pt', marginBottom: '0' }}>
                    Autoavaliação da Turma (Pontos Positivos / A Melhorar)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', color: '#64748b', width: '50%', background: '#f8fafc' }}>
                                O que foi bem este bimestre? (Avanços)
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', color: '#64748b', width: '50%', background: '#f8fafc' }}>
                                O que a turma precisa melhorar? (Desafios)
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', color: '#334155', minHeight: '40pt', verticalAlign: 'top' }}>
                                {autoAvaliacaoTurma[1] || '-'}
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', color: '#334155', minHeight: '40pt', verticalAlign: 'top' }}>
                                {autoAvaliacaoTurma[2] || '-'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ====== AVALIAÇÃO BNCC ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '16pt' }}>
                <div style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '6pt 12pt', marginBottom: '0' }}>
                    Avaliação dos {isInfantil ? 'Campos de Experiência' : 'Componentes Curriculares'}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '6pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 800, color: '#64748b', background: '#f8fafc', textAlign: 'left', width: '30%' }}>Componente / Campo</th>
                            <th style={{ padding: '6pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 800, color: '#64748b', background: '#f8fafc', textAlign: 'center', width: '15%' }}>Dificuldade?</th>
                            <th style={{ padding: '6pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 800, color: '#64748b', background: '#f8fafc', textAlign: 'left' }}>Motivos e Sugestões</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categoriasParaExibir.map((cat) => {
                            const data = avaliacaoBncc[cat];
                            if (!data || !data.dificuldade) return null;
                            return (
                                <tr key={cat}>
                                    <td style={{ padding: '6pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', fontWeight: 700, color: '#0f172a' }}>{cat}</td>
                                    <td style={{ padding: '6pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', color: '#0f172a', textAlign: 'center' }}>Sim</td>
                                    <td style={{ padding: '6pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', color: '#334155' }}>
                                        {data.motivos ? <div><strong>Motivos:</strong> {data.motivos}</div> : null}
                                        {data.sugestoes ? <div style={{ marginTop: '2pt' }}><strong>Sugestões:</strong> {data.sugestoes}</div> : null}
                                    </td>
                                </tr>
                            );
                        })}
                        {Object.values(avaliacaoBncc).filter((d: any) => d?.dificuldade).length === 0 && (
                            <tr>
                                <td colSpan={3} style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', color: '#64748b', textAlign: 'center', fontStyle: 'italic' }}>
                                    Nenhuma dificuldade específica assinalada para os componentes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ====== COMPROMISSOS E OUTRAS QUESTÕES ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '16pt' }}>
                <div style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '6pt 12pt', marginBottom: '0' }}>
                    Compromissos e Observações
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', width: '20%' }}>
                                Compromissos
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', color: '#334155', whiteSpace: 'pre-wrap' }}>
                                {reuniao.compromissos || '-'}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontWeight: 800, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc' }}>
                                Outras Questões
                            </td>
                            <td style={{ padding: '8pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '10pt', color: '#334155', whiteSpace: 'pre-wrap' }}>
                                {reuniao.outras_questoes || '-'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ====== LISTA DE PRESENÇA (ASSINATURAS) ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '24pt' }}>
                <div style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '6pt 12pt', marginBottom: '0' }}>
                    Assinaturas dos Estudantes
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '6pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'left', width: '50%' }}>
                                Nome do Estudante
                            </th>
                            <th style={{ padding: '6pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '8pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', background: '#f8fafc', textAlign: 'center', width: '50%' }}>
                                Assinatura Digital
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {estudantes.length > 0 ? estudantes.map((estudante) => {
                            const hasSignature = reuniao.assinaturas && reuniao.assinaturas[estudante.id];
                            return (
                                <tr key={estudante.id}>
                                    <td style={{ padding: '6pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', color: '#334155' }}>
                                        {estudante.name}
                                    </td>
                                    <td style={{ padding: '2pt', border: '0.5pt solid #e2e8f0', height: '40pt', textAlign: 'center', verticalAlign: 'middle' }}>
                                        {hasSignature ? (
                                            <img src={reuniao.assinaturas[estudante.id]} alt="Assinatura" style={{ maxHeight: '35pt', maxWidth: '100%', objectFit: 'contain', margin: '0 auto' }} />
                                        ) : (
                                            <span style={{ fontSize: '8pt', color: '#cbd5e1', fontStyle: 'italic' }}>Ausente/Não Assinou</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={2} style={{ padding: '10pt 12pt', border: '0.5pt solid #e2e8f0', fontSize: '9pt', color: '#64748b', textAlign: 'center' }}>
                                    Lista de estudantes não carregada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ marginTop: '40pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '7pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '8pt' }}>
                <span>SIGAR • Documento Gerado em {emissionDate} às {emissionTime}</span>
                <span>Conselho de Classe Participativo</span>
            </div>
        </div>,
        document.body
    );
};
