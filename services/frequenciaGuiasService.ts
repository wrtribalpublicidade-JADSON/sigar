import { supabase } from './supabase';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de cache em memória

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

// 1. Colunas específicas para frequencia_sheets:
// Nunca busca 'students' em listagens, relatórios e painéis (Regra 3)
export const FREQUENCIA_LIST_COLUMNS = 'id, data, escola_id, turma_id, componente, presentes_count, total_count, rate, ativo';
export const FREQUENCIA_AGGREGATION_COLUMNS = 'id, data, escola_id, turma_id, componente, students, ativo';

// 2. Colunas específicas para guias_aprendizagem (Regra 6)
export const GUIAS_LIST_COLUMNS = 'id, data, data_inicio, data_termino, escola_id, turma_id, ano_serie, componente, periodo, titulo, objetivos, habilidades, metodologia, recursos, avaliacao, status, observacao_coordenacao, avaliado_por, avaliado_em, professor, created_by, updated_by, created_at, updated_at, ativo';
export const GUIAS_LIGHT_COLUMNS = 'id, escola_id, turma_id, ano_serie, componente, periodo, data_inicio, data_termino, data, titulo, status, ativo';

// Caches em memória
const frequenciaListCache = new Map<string, CacheEntry<any[]>>();
const frequenciaDetailCache = new Map<string, CacheEntry<any>>();
const frequenciaAggCache = new Map<string, CacheEntry<any[]>>();
const guiasListCache = new Map<string, CacheEntry<any[]>>();
const guiasLightCache = new Map<string, CacheEntry<any[]>>();
const guiasDetailCache = new Map<string, CacheEntry<any>>();

function isCacheValid<T>(entry: CacheEntry<T> | undefined): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

export interface FrequenciaFilterOptions {
  escolaId?: string;
  turmaId?: string;
  startDate?: string;
  endDate?: string;
  rangeFrom?: number;
  rangeTo?: number;
}

export interface GuiasFilterOptions {
  escolaId?: string;
  turmaId?: string;
  anoSerie?: string;
  periodo?: string;
  rangeFrom?: number;
  rangeTo?: number;
}

export const frequenciaGuiasService = {
  /**
   * Consulta listagem de folhas de frequência SEM a coluna students (Regras 3 e 4).
   * Cache de 5 minutos, paginação via range e filtro obrigatório por escola ou turma.
   */
  getFrequenciaSheetsList: async (options: FrequenciaFilterOptions, forceRefresh = false): Promise<any[]> => {
    const rangeFrom = options.rangeFrom ?? 0;
    const rangeTo = options.rangeTo ?? 999;
    const key = `freq_list:${options.escolaId || ''}:${options.turmaId || ''}:${options.startDate || ''}:${options.endDate || ''}:${rangeFrom}:${rangeTo}`;

    if (!forceRefresh) {
      const cached = frequenciaListCache.get(key);
      if (isCacheValid(cached)) {
        return cached!.data;
      }
    }

    let query = supabase
      .from('frequencia_sheets')
      .select(FREQUENCIA_LIST_COLUMNS)
      .or('ativo.eq.true,ativo.is.null')
      .order('data', { ascending: false });

    if (options.turmaId) {
      query = query.eq('turma_id', options.turmaId);
    } else if (options.escolaId) {
      query = query.eq('escola_id', options.escolaId);
    }

    if (options.startDate) {
      query = query.gte('data', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('data', options.endDate);
    }

    query = query.range(rangeFrom, rangeTo);

    const { data, error } = await query;
    if (error) throw error;

    const result = data || [];
    frequenciaListCache.set(key, { data: result, timestamp: Date.now() });
    return result;
  },

  /**
   * Busca UMA folha específica de frequência por id com a lista completa de alunos (Regra 3).
   */
  getFrequenciaSheetById: async (id: string, forceRefresh = false): Promise<any> => {
    const key = `freq_detail:${id}`;
    if (!forceRefresh) {
      const cached = frequenciaDetailCache.get(key);
      if (isCacheValid(cached)) {
        return cached!.data;
      }
    }

    const { data, error } = await supabase
      .from('frequencia_sheets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (data) {
      frequenciaDetailCache.set(key, { data, timestamp: Date.now() });
    }
    return data;
  },

  /**
   * Consulta folhas de frequência filtradas por escola ou turma para relatórios/agregação de presenças.
   * Seleciona apenas id, data, escola_id, turma_id, componente, students, ativo (evita colunas desnecessárias).
   * Cache de 5 minutos.
   */
  getFrequenciaSheetsAggregation: async (
    options: { escolaId?: string; turmaId?: string; startDate?: string; endDate?: string; isInfantil?: boolean },
    forceRefresh = false
  ): Promise<any[]> => {
    const table = options.isInfantil ? 'frequencia_sheets_infantil' : 'frequencia_sheets';
    const key = `freq_agg:${table}:${options.escolaId || ''}:${options.turmaId || ''}:${options.startDate || ''}:${options.endDate || ''}`;

    if (!forceRefresh) {
      const cached = frequenciaAggCache.get(key);
      if (isCacheValid(cached)) {
        return cached!.data;
      }
    }

    const selectCols = options.isInfantil
      ? 'id, data, escola_id, turma_id, ano_serie, periodo, students, ativo'
      : 'id, data, escola_id, turma_id, componente, students, ativo';

    let query = supabase
      .from(table)
      .select(selectCols)
      .or('ativo.eq.true,ativo.is.null');

    if (options.turmaId) {
      query = query.eq('turma_id', options.turmaId);
    } else if (options.escolaId) {
      query = query.eq('escola_id', options.escolaId);
    }

    if (options.startDate) {
      query = query.gte('data', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('data', options.endDate);
    }

    query = query.range(0, 1999);

    const { data, error } = await query;
    if (error) throw error;

    const result = data || [];
    frequenciaAggCache.set(key, { data: result, timestamp: Date.now() });
    return result;
  },

  /**
   * Contagem estimada para frequencia_sheets sem ler linhas (Regra 5).
   */
  getFrequenciaEstimatedCount: async (options: { escolaId?: string; turmaId?: string }): Promise<number> => {
    let query = supabase
      .from('frequencia_sheets')
      .select('id', { count: 'estimated', head: true })
      .or('ativo.eq.true,ativo.is.null');

    if (options.turmaId) {
      query = query.eq('turma_id', options.turmaId);
    } else if (options.escolaId) {
      query = query.eq('escola_id', options.escolaId);
    }

    const { count, error } = await query;
    if (error) {
      console.warn('Erro ao obter count estimado de frequencia:', error);
      return 0;
    }
    return count || 0;
  },

  /**
   * Consulta listagem de guias_aprendizagem com colunas explícitas e filtros (Regra 6).
   * Cache de 5 minutos e paginação via range.
   */
  getGuiasAprendizagem: async (options: GuiasFilterOptions, forceRefresh = false): Promise<any[]> => {
    const rangeFrom = options.rangeFrom ?? 0;
    const rangeTo = options.rangeTo ?? 999;
    const key = `guias_list:${options.escolaId || ''}:${options.turmaId || ''}:${options.anoSerie || ''}:${options.periodo || ''}:${rangeFrom}:${rangeTo}`;

    if (!forceRefresh) {
      const cached = guiasListCache.get(key);
      if (isCacheValid(cached)) {
        return cached!.data;
      }
    }

    let query = supabase
      .from('guias_aprendizagem')
      .select(GUIAS_LIST_COLUMNS)
      .or('ativo.eq.true,ativo.is.null')
      .order('data', { ascending: false });

    if (options.turmaId) {
      query = query.eq('turma_id', options.turmaId);
    } else if (options.escolaId) {
      query = query.eq('escola_id', options.escolaId);
    }

    if (options.anoSerie) {
      query = query.eq('ano_serie', options.anoSerie);
    }
    if (options.periodo) {
      query = query.eq('periodo', options.periodo);
    }

    query = query.range(rangeFrom, rangeTo);

    const { data, error } = await query;
    if (error) throw error;

    const result = data || [];
    guiasListCache.set(key, { data: result, timestamp: Date.now() });
    return result;
  },

  /**
   * Consulta leve de guias_aprendizagem para vinculação em AulasMinistradas (Regra 6).
   */
  getGuiasAprendizagemLight: async (options: { escolaId?: string; turmaId?: string }, forceRefresh = false): Promise<any[]> => {
    const key = `guias_light:${options.escolaId || ''}:${options.turmaId || ''}`;

    if (!forceRefresh) {
      const cached = guiasLightCache.get(key);
      if (isCacheValid(cached)) {
        return cached!.data;
      }
    }

    let query = supabase
      .from('guias_aprendizagem')
      .select(GUIAS_LIGHT_COLUMNS)
      .or('ativo.eq.true,ativo.is.null')
      .order('data', { ascending: false });

    if (options.turmaId) {
      query = query.eq('turma_id', options.turmaId);
    } else if (options.escolaId) {
      query = query.eq('escola_id', options.escolaId);
    }

    query = query.range(0, 999);

    const { data, error } = await query;
    if (error) throw error;

    const result = data || [];
    guiasLightCache.set(key, { data: result, timestamp: Date.now() });
    return result;
  },

  /**
   * Contagem estimada para guias_aprendizagem sem carregar linhas (Regra 5).
   */
  getGuiasEstimatedCount: async (options: { escolaId?: string; turmaId?: string }): Promise<number> => {
    let query = supabase
      .from('guias_aprendizagem')
      .select('id', { count: 'estimated', head: true })
      .or('ativo.eq.true,ativo.is.null');

    if (options.turmaId) {
      query = query.eq('turma_id', options.turmaId);
    } else if (options.escolaId) {
      query = query.eq('escola_id', options.escolaId);
    }

    const { count, error } = await query;
    if (error) {
      console.warn('Erro ao obter count estimado de guias:', error);
      return 0;
    }
    return count || 0;
  },

  /**
   * Invalidação de cache ao salvar/editar/excluir registros
   */
  invalidateFrequenciaCache: (escolaId?: string, turmaId?: string) => {
    if (!escolaId && !turmaId) {
      frequenciaListCache.clear();
      frequenciaDetailCache.clear();
      frequenciaAggCache.clear();
      return;
    }
    for (const k of frequenciaListCache.keys()) {
      if ((escolaId && k.includes(escolaId)) || (turmaId && k.includes(turmaId))) {
        frequenciaListCache.delete(k);
      }
    }
    for (const k of frequenciaAggCache.keys()) {
      if ((escolaId && k.includes(escolaId)) || (turmaId && k.includes(turmaId))) {
        frequenciaAggCache.delete(k);
      }
    }
  },

  invalidateGuiasCache: (escolaId?: string, turmaId?: string) => {
    if (!escolaId && !turmaId) {
      guiasListCache.clear();
      guiasLightCache.clear();
      guiasDetailCache.clear();
      return;
    }
    for (const k of guiasListCache.keys()) {
      if ((escolaId && k.includes(escolaId)) || (turmaId && k.includes(turmaId))) {
        guiasListCache.delete(k);
      }
    }
    for (const k of guiasLightCache.keys()) {
      if ((escolaId && k.includes(escolaId)) || (turmaId && k.includes(turmaId))) {
        guiasLightCache.delete(k);
      }
    }
  },

  clearAllCache: () => {
    frequenciaListCache.clear();
    frequenciaDetailCache.clear();
    frequenciaAggCache.clear();
    guiasListCache.clear();
    guiasLightCache.clear();
    guiasDetailCache.clear();
  }
};
