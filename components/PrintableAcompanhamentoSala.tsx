import React from 'react';
import { createPortal } from 'react-dom';

interface PrintableAcompanhamentoSalaProps {
    acompanhamento: any; // The record from Supabase
    escolaNome: string;
}

const QUESTION_MAP: Record<string, string> = {
    // 1.1 Planejamento - Infantil
    p1: 'Apresenta planejamento alinhado aos Campos de Experiência e à BNCC',
    p2: 'Define objetivos claros adequados à faixa etária',
    p3: 'Explicita intencionalidade pedagógica nas propostas',
    p4: 'Organiza a rotina diária (acolhida, roda, exploração, lanche, parque)',
    p5: 'Prepara materiais e experiências adequadas ao desenvolvimento infantil',
    p6: 'Prevê registros de acompanhamento das crianças',
    p7: 'Planejamento estruturado por Campos de Experiência',
    p8: 'Aprendizagem mediada por interações e brincadeiras',
    p9: 'Organização equilibrada entre atividades dirigidas e livres',
    // 1.1 Planejamento - EF
    p1_ef: 'Plano alinhado ao Plano de Curso e à BNCC',
    p2_ef: 'Objetivos de aprendizagem claros (habilidades)',
    p3_ef: 'Estratégias diferenciadas previstas',
    p4_ef: 'Organização equilibrada do tempo pedagógico',
    p5_ef: 'Recursos didáticos adequados',
    p6_ef: 'Instrumentos de avaliação coerentes',
    p7_ef: 'Foco em alfabetização/letramento',
    p8_ef: 'Estratégias de recomposição previstas',
    p9_ef: 'Uso de sequências didáticas',
    p10_ef: 'Progressão conceitual estruturada',
    p11_ef: 'Metodologias ativas quando pertinente',
    p12_ef: 'Articulação entre conteúdos e competências',
    // 1.2 Organização do Ambiente - Infantil
    oa1: 'Espaço organizado e funcional',
    oa2: 'Cantinhos pedagógicos estruturados',
    oa3: 'Materiais manipuláveis acessíveis',
    oa4: 'Ambiente acolhedor, seguro e estimulante',
    oa5: 'Uso de diferentes espaços (pátio, parque, biblioteca)',
    // 1.2 Organização do Ambiente - EF
    oa1_ef: 'Sala organizada e funcional',
    oa2_ef: 'Recursos visuais pedagógicos expostos',
    oa3_ef: 'Materiais acessíveis',
    oa4_ef: 'Uso de espaços diversificados',
    // 2.1 Desenvolvimento da Aula - Infantil
    da1: 'Estimula oralidade e expressão',
    da2: 'Promove experiências sensoriais',
    da3: 'Incentiva autonomia e protagonismo',
    da4: 'Media conflitos pedagogicamente',
    da5: 'Respeita o ritmo individual das crianças',
    da6: 'Observa e intervém com intencionalidade',
    // 2.1 Desenvolvimento da Aula - EF
    da1_ef: 'Retoma conhecimentos prévios',
    da2_ef: 'Explica objetivos da aula',
    da3_ef: 'Apresentação clara e estruturada',
    da4_ef: 'Estratégias diversificadas',
    da5_ef: 'Participação ativa dos estudantes',
    da6_ef: 'Intervenções pedagógicas qualificadas',
    // 2.2 Alfabetização e Linguagem - Infantil
    al1: 'Trabalha consciência fonológica de forma lúdica',
    al2: 'Desenvolve contato significativo com textos',
    al3: 'Incentiva produção oral e registros espontâneos',
    // 2.2 Alfabetização e Recomposição - EF
    ar1_ef: 'Consciência fonológica (1º/2º ano)',
    ar2_ef: 'Desenvolvimento da fluência leitora',
    ar3_ef: 'Trabalho com compreensão textual',
    ar4_ef: 'Diferenciação por nível',
    ar5_ef: 'Uso de dados diagnósticos (SAMAHC)',
    // 2.3 Metodologias e Recursos - Infantil
    mr1: 'Aprendizagem baseada em brincadeira',
    mr2: 'Exploração corporal e sensorial',
    mr3: 'Interações qualificadas adulto-criança',
    mr4: 'Integração entre diferentes campos de experiência',
    // 2.3 Metodologias e Recursos - EF
    mr1_ef: 'Uso de recursos além do livro didático',
    mr2_ef: 'Resolução de problemas (Matemática)',
    mr3_ef: 'Leitura significativa',
    mr4_ef: 'Integra teoria e prática',
    mr5_ef: 'Aprendizagem colaborativa',
    // 3. Relação Professor-Aluno - Infantil
    rpa1: 'Postura ética e respeitosa',
    rpa2: 'Afetividade e escuta sensível',
    rpa3: 'Ambiente emocionalmente seguro',
    rpa4: 'Incentivo à expressão e autonomia',
    rpa5: 'Respeito ao ritmo infantil',
    // 3. Relação Professor-Aluno - EF
    rpa1_ef: 'Postura ética e respeitosa',
    rpa2_ef: 'Ambiente emocionalmente seguro',
    rpa3_ef: 'Estimula autonomia',
    rpa4_ef: 'Valoriza participação',
    rpa5_ef: 'Media conflitos pedagogicamente',
    rpa6_ef: 'Estabelece combinados claros',
    // 4. Avaliação da Aprendizagem - Infantil
    aa1: 'Observação sistemática',
    aa2: 'Registros descritivos organizados',
    aa3: 'Portfólio atualizado',
    aa4: 'Replanejamento com base nas observações',
    // 4. Avaliação da Aprendizagem - EF
    aa1_ef: 'Avaliação contínua e formativa',
    aa2_ef: 'Registros organizados',
    aa3_ef: 'Devolutiva construtiva',
    aa4_ef: 'Replanejamento com base nos resultados',
    aa5_ef: 'Instrumentos variados (provas, rubricas, projetos)',
    aa6_ef: 'Análise de erros como estratégia pedagógica',
    aa7_ef: 'Monitoramento de metas (especialmente alfabetização)',
    // 5. Indicadores de Impacto - Infantil
    ii1: 'Participação ativa das crianças',
    ii2: 'Evidência de desenvolvimento nas interações',
    ii3: 'Coerência entre planejamento e prática',
    ii4: 'Adequação das propostas à faixa etária',
    // 5. Indicadores de Impacto - EF
    ii1_ef: 'Participação ativa dos estudantes',
    ii2_ef: 'Evidência de aprendizagem durante a aula',
    ii3_ef: 'Clareza na devolutiva',
    ii4_ef: 'Coerência entre planejamento e execução',
    ii5_ef: 'Adequação ao nível real da turma',
};

export const PrintableAcompanhamentoSala: React.FC<PrintableAcompanhamentoSalaProps> = ({ acompanhamento, escolaNome }) => {
    if (!acompanhamento) return null;

    const currentYear = new Date().getFullYear();
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const dataObs = acompanhamento.data_observacao ? new Date(acompanhamento.data_observacao).toLocaleDateString('pt-BR') : '-';
    const dets = acompanhamento.detalhes_observacao || {};

    // Group items for display based on the answers given in the form
    // Since we don't have the full questions array here, we will render the ones that have YES/NO/PARTIAL answers
    const respostas = dets.respostas || {};
    const obsAdicionais = dets.observacoesAdicionais || {};
    const coordenacao = dets.registroCoordenador || {};

    const renderRespostaTag = (status: string) => {
        let style = { background: '#f1f5f9', color: '#64748b' };
        if (status === 'SIM') style = { background: '#ecfdf5', color: '#047857' };
        if (status === 'NÃO') style = { background: '#fef2f2', color: '#b91c1c' };
        if (status === 'PARCIALMENTE') style = { background: '#fefce8', color: '#a16207' };

        return (
            <span style={{
                ...style,
                padding: '2pt 6pt',
                borderRadius: '4pt',
                fontSize: '7pt',
                fontWeight: 800,
                letterSpacing: '0.05em'
            }}>
                {status || 'NÃO AVALIADO'}
            </span>
        );
    };

    const getCategoryName = (id: string) => {
        if (id.startsWith('oa')) return '1.2 Organização do Ambiente';
        if (id.startsWith('da')) return '2.1 Desenvolvimento da Aula';
        if (id.startsWith('al')) return '2.2 Alfabetização e Linguagem';
        if (id.startsWith('ar')) return '2.2 Alfabetização e Recomposição';
        if (id.startsWith('mr')) return '2.3 Metodologias e Recursos';
        if (id.startsWith('rpa')) return '3. Relação Professor-Aluno';
        if (id.startsWith('aa')) return '4. Avaliação da Aprendizagem';
        if (id.startsWith('ii')) return '5. Indicadores de Impacto';
        if (id.startsWith('p')) return '1.1 Planejamento';
        return 'Outros';
    };

    const categoriasOrdem = [
        '1.1 Planejamento',
        '1.2 Organização do Ambiente',
        '2.1 Desenvolvimento da Aula',
        '2.2 Alfabetização e Linguagem',
        '2.2 Alfabetização e Recomposição',
        '2.3 Metodologias e Recursos',
        '3. Relação Professor-Aluno',
        '4. Avaliação da Aprendizagem',
        '5. Indicadores de Impacto',
        'Outros'
    ];

    const respostasPorCategoria: Record<string, [string, string][]> = {};
    Object.entries(respostas).forEach(([pergunta, status]) => {
        const cat = getCategoryName(pergunta);
        if (!respostasPorCategoria[cat]) respostasPorCategoria[cat] = [];
        respostasPorCategoria[cat].push([pergunta, status as string]);
    });

    return createPortal(
        <div id="print-acompanhamento-sala" className="hidden print:block bg-white text-slate-900" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

            {/* ====== INSTITUTIONAL HEADER ====== */}
            <div className="text-center mb-4 pb-3" style={{ borderBottom: '2pt solid #0f172a' }}>
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
                    FICHA DE ACOMPANHAMENTO DA PRÁTICA PEDAGÓGICA (AULA)
                </h1>
                <p style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    {escolaNome}
                </p>
            </div>

            {/* ====== INFO DO PROFESSOR ====== */}
            <div style={{ padding: '8pt 10pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', marginBottom: '15pt', borderRadius: '4pt' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '15pt' }}>
                    <div>
                        <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2pt' }}>
                            Professor(a) Observado(a)
                        </p>
                        <p style={{ fontSize: '11pt', fontWeight: 900, color: '#0f172a' }}>
                            {acompanhamento.professor_nome}
                        </p>
                        <p style={{ fontSize: '8pt', fontWeight: 600, color: '#475569', marginTop: '2pt' }}>
                            Etapa de Ensino: {acompanhamento.etapa}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '7pt', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2pt' }}>
                            Data da Observação
                        </p>
                        <p style={{ fontSize: '11pt', fontWeight: 900, color: '#0f172a' }}>
                            {dataObs}
                        </p>
                    </div>
                </div>
            </div>

            {/* ====== DESENVOLVIMENTO DA AULA ====== */}
            <div style={{ marginBottom: '15pt' }}>
                <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#0f172a', color: '#fff', padding: '5pt 10pt', marginBottom: '8pt' }}>
                    1. Aspectos Observados (Resumo Pedagógico)
                </div>

                {Object.keys(respostas).length === 0 ? (
                    <p style={{ fontSize: '9pt', color: '#64748b', fontStyle: 'italic', padding: '10pt', textAlign: 'center' }}>
                        Nenhum item avaliado neste acompanhamento.
                    </p>
                ) : (
                    <div style={{ display: 'block' }}>
                        {categoriasOrdem.filter(cat => respostasPorCategoria[cat]).map(cat => (
                            <div key={cat} style={{ marginBottom: '8pt' }}>
                                <div style={{ fontSize: '7.5pt', fontWeight: 800, textTransform: 'uppercase', color: '#475569', background: '#f1f5f9', padding: '4pt 8pt', borderLeft: '2pt solid #0f172a' }}>
                                    {cat}
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1pt solid #e2e8f0', borderTop: 'none' }}>
                                    <tbody>
                                        {respostasPorCategoria[cat].map(([pergunta, status]) => (
                                            <tr key={pergunta} style={{ borderBottom: '0.5pt solid #e2e8f0', pageBreakInside: 'avoid' }}>
                                                <td style={{ padding: '6pt 10pt', fontSize: '8.5pt', color: '#334155', fontWeight: 500, width: '75%' }}>
                                                    {QUESTION_MAP[pergunta] || pergunta}
                                                </td>
                                                <td style={{ padding: '6pt 10pt', textAlign: 'right', width: '25%' }}>
                                                    {renderRespostaTag(status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ====== OBSERVAÇÕES ADICIONAIS DAS ETAPAS ====== */}
            {Object.keys(obsAdicionais).length > 0 && (
                <div className="print-avoid-break" style={{ marginBottom: '15pt' }}>
                    <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#f1f5f9', color: '#334155', padding: '4pt 10pt', borderLeft: '3pt solid #0f172a', marginBottom: '8pt' }}>
                        Observações Específicas
                    </div>
                    <div style={{ padding: '0 10pt' }}>
                        {Object.entries(obsAdicionais).map(([etapa, obs]) => (
                            obs ? (
                                <div key={etapa} style={{ marginBottom: '6pt' }}>
                                    <p style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '1pt' }}>{etapa}</p>
                                    <p style={{ fontSize: '8.5pt', color: '#0f172a', lineHeight: 1.4 }}>{obs as string}</p>
                                </div>
                            ) : null
                        ))}
                    </div>
                </div>
            )}

            {/* ====== REGISTRO DO COORDENADOR ====== */}
            <div className="print-avoid-break" style={{ marginBottom: '20pt', border: '1pt solid #cbd5e1', borderRadius: '4pt', overflow: 'hidden' }}>
                <div style={{ fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', background: '#e2e8f0', color: '#0f172a', padding: '5pt 10pt' }}>
                    2. Registro e Parecer da Coordenação
                </div>
                <div style={{ padding: '10pt', display: 'flex', flexDirection: 'column', gap: '10pt' }}>
                    <div>
                        <p style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '3pt', letterSpacing: '0.05em' }}>Pontos Fortes da Prática</p>
                        <div style={{ fontSize: '9pt', color: '#1e293b', padding: '6pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', minHeight: '40pt' }}>
                            {coordenacao.pontosFortes || '-'}
                        </div>
                    </div>
                    <div>
                        <p style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '3pt', letterSpacing: '0.05em' }}>Pontos a Desenvolver / Melhoria</p>
                        <div style={{ fontSize: '9pt', color: '#1e293b', padding: '6pt', background: '#f8fafc', border: '0.5pt solid #e2e8f0', minHeight: '40pt' }}>
                            {coordenacao.pontosMelhoria || '-'}
                        </div>
                    </div>
                    <div>
                        <p style={{ fontSize: '7.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '3pt', letterSpacing: '0.05em' }}>Encaminhamentos / Intervenções</p>
                        <div style={{ fontSize: '9pt', color: '#1e293b', padding: '6pt', background: '#fffbeb', border: '1pt solid #fef08a', minHeight: '40pt' }}>
                            {coordenacao.encaminhamentos || '-'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '15pt', marginTop: '5pt' }}>
                        <div style={{ flex: 1, padding: '6pt', background: '#f1f5f9', border: '0.5pt solid #cbd5e1' }}>
                            <p style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2pt' }}>Status do Plano</p>
                            <p style={{ fontSize: '9pt', fontWeight: 800, color: coordenacao.statusPlano === 'Concluído' ? '#047857' : '#9a3412' }}>
                                {coordenacao.statusPlano || '-'}
                            </p>
                        </div>
                        <div style={{ flex: 1, padding: '6pt', background: '#f1f5f9', border: '0.5pt solid #cbd5e1' }}>
                            <p style={{ fontSize: '7pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2pt' }}>Data Prevista p/ Retorno</p>
                            <p style={{ fontSize: '9pt', fontWeight: 800, color: '#0f172a' }}>
                                {coordenacao.dataRetorno ? new Date(coordenacao.dataRetorno).toLocaleDateString('pt-BR') : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ====== SIGNATURES ====== */}
            <div className="print-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40pt', paddingTop: '40pt', pageBreakInside: 'avoid' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        Coordenação Pedagógica
                    </p>
                    <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                        RESPONSÁVEL PELA OBSERVAÇÃO
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1.5pt solid #0f172a', width: '80%', margin: '0 auto 6pt' }} />
                    <p style={{ fontSize: '9pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2pt' }}>
                        {acompanhamento.professor_nome}
                    </p>
                    <p style={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: '2pt' }}>
                        PROFESSOR(A) ACOMPANHADO(A)
                    </p>
                </div>
            </div>

            {/* ====== FOOTER ====== */}
            <div className="print-footer" style={{ marginTop: '20pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5pt', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em', borderTop: '0.5pt solid #e2e8f0', paddingTop: '6pt' }}>
                <span>SIGAR • Sistema Integrado de Gestão</span>
                <span>Ficha Gerada em {emissionDate} às {emissionTime}</span>
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .print-avoid-break { page-break-inside: avoid; }
                }
            `}</style>
        </div>,
        document.body
    );
};
