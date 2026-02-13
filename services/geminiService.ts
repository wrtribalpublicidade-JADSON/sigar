
import { GoogleGenAI } from "@google/genai";
import { Escola, Visita } from "../types";

/**
 * Generates an intervention suggestion based on the school's indicators and recent visit observations.
 */
export const gerarSugestaoIntervencao = async (
  escola: Escola,
  observacoesVisita: string,
  focos: string[]
): Promise<string> => {
  // Always use process.env.API_KEY directly and assume it is available as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Atue como um Coordenador Pedagógico Regional Sênior especialista em gestão escolar.
    Analise os dados da seguinte escola municipal de Humberto de Campos:
    
    Nome: ${escola.nome}
    Segmentos: ${escola.segmentos.join(', ')}
    
    Indicadores Atuais:
    - IDEB: ${escola.indicadores.ideb}
    - Frequência Média: ${escola.indicadores.frequenciaMedia}%
    - Fluência Leitora: ${escola.indicadores.fluenciaLeitora}%
    - Taxa de Aprovação: ${escola.indicadores.taxaAprovacao}%
    
    Dados da Visita Recente:
    - Foco da Visita: ${focos.join(', ')}
    - Observações Coletadas: "${observacoesVisita}"
    
    Com base no "Plano de Ação e Avaliações Externas" e nas diretrizes de gestão pedagógica:
    1. Identifique o problema crítico.
    2. Sugira 2 ações práticas e imediatas para o Coordenador Regional propor ao Gestor Escolar.
    3. Sugira uma meta de curto prazo (mensurável).
    
    Responda de forma concisa, em tópicos, com tom profissional e acolhedor.
  `;

  try {
    // Using recommended model for complex reasoning and direct property access for response text.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar sugestões no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Erro ao processar a solicitação com a IA. Verifique sua conexão.";
  }
};

/**
 * Generates a consolidated summary of the regional coordination status.
 */
export const gerarResumoConsolidado = async (
  stats: any,
  visitas: Visita[],
  coordenadorNome?: string
): Promise<string> => {
  // Always use process.env.API_KEY directly as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const summaryData = visitas.map(v => ({
    escola: v.escolaNome,
    tipo: v.tipo,
    focos: v.foco.join(', '),
    encaminhamentos: v.encaminhamentosRegistrados.length
  })).slice(0, 10); // Limit to top 10 for context window

  const prompt = `
    Atue como Consultor Pedagógico da Secretaria Municipal de Educação.
    Produza um Relatório Executivo de IA baseado nos seguintes dados da Coordenação Regional ${coordenadorNome ? `de ${coordenadorNome}` : ''}:
    
    Estatísticas do Período:
    - Total de Visitas: ${stats.total}
    - Visitas Realizadas: ${stats.realizadas}
    - Escolas Atendidas: ${stats.escolasAtendidas}
    - Pendências Críticas (Encaminhamentos em aberto): ${stats.encaminhamentosPendentes}
    
    Resumo das Últimas Intervenções:
    ${JSON.stringify(summaryData)}
    
    Estruture sua resposta em:
    1. Panorama Geral (Análise dos números).
    2. Alertas Críticos (Onde a supervisão deve focar imediatamente).
    3. Recomendações Estratégicas para a próxima semana.
    
    Use uma linguagem executiva, direta e propositiva. Máximo 250 palavras.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // The .text property returns the string output directly.
    return response.text || "Sem resumo disponível.";
  } catch (error) {
    console.error("Erro:", error);
    return "Falha ao gerar resumo consolidado.";
  }
};
