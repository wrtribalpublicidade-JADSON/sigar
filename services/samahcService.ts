import { supabase } from './supabase';
import { RegistroFluenciaSAMAHC } from '../types';

export const samahcService = {
  async getPaginatedRecords(params: {
    page: number;
    pageSize: number;
    searchTerm?: string;
    polo?: string;
    regional?: string;
    schoolIds?: string[];
    // Novos filtros
    escola_id?: string;
    ano?: number;
    ano_serie?: string;
    turno?: string;
    tipo_avaliacao?: string;
    nivel_desempenho?: string;
  }) {
    const { 
      page, pageSize, searchTerm, polo, regional, schoolIds,
      escola_id, ano, ano_serie, turno, tipo_avaliacao, nivel_desempenho 
    } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    console.log('--- SAMAHC DEBUG ---');
    console.log('Filters:', { page, pageSize, searchTerm, polo, regional, escola_id, ano, ano_serie, turno, tipo_avaliacao, nivel_desempenho });
    console.log('School IDs Count:', schoolIds?.length);

    let query = supabase
      .from('registros_fluencia_samahc')
      .select('*, escolas(id, nome)', { count: 'exact' });

    // 1. Filtros de Segurança / Regional (baseados no usuário autenticado)
    if (schoolIds && Array.isArray(schoolIds) && schoolIds.length > 0) {
      query = query.in('escola_id', schoolIds);
    }

    // 2. Filtros Específicos do Dashboard (Novos)
    if (escola_id && escola_id !== 'Todas') {
      query = query.eq('escola_id', escola_id);
    }
    
    // Check for "Todos" etc strings or 0
    if (ano && Number(ano) > 0) {
      query = query.eq('ano', ano);
    }
    if (ano_serie && ano_serie !== 'Todas') {
      query = query.eq('ano_serie', ano_serie);
    }
    if (turno && turno !== 'Todos') {
      query = query.eq('turno', turno);
    }
    if (tipo_avaliacao && tipo_avaliacao !== 'Todas') {
      query = query.eq('tipo_avaliacao', tipo_avaliacao);
    }
    if (nivel_desempenho && nivel_desempenho !== 'Todos') {
      query = query.eq('nivel_desempenho', nivel_desempenho);
    }

    // 3. Filtro de Polo (Global ou Específico)
    if (polo && polo !== 'Todos' && polo !== 'Todos os Polos' && polo !== '') {
      // Se não houver escola_id específico selecionado, filtra pelo polo
      if (!escola_id || escola_id === 'Todas') {
        query = query.ilike('polo', `%${polo}%`);
      }
    }

    // 4. Busca por Texto (Habilita pesquisa combinada)
    if (searchTerm) {
      query = query.or(`estudante_nome.ilike.%${searchTerm}%,turma.ilike.%${searchTerm}%`);
    }

    const { data, error, count } = await query
      .order('estudante_nome', { ascending: true })
      .range(from, to);

    console.log('Supabase Result:', { count, error, dataLength: data?.length });
    if (data && data.length > 0) console.log('First Record Raw:', JSON.stringify(data[0]));

    if (error) {
      console.error('Supabase Query Error:', error);
      throw error;
    }

    return {
      records: data.map(r => ({
        ...r,
        // Map database snake_case to frontend camelCase
        estudanteNome: r.estudante_nome,
        anoSerie: r.ano_serie,
        nivelDesempenho: r.nivel_desempenho,
        tipoAvaliacao: r.tipo_avaliacao,
        escola: r.escolas
      })),
      totalCount: count || 0
    };
  },

  async getAllForEvolution(studentName: string) {
    const { data, error } = await supabase
      .from('registros_fluencia_samahc')
      .select(`
        *,
        escolas (
          id,
          nome
        )
      `)
      .ilike('estudante_nome', studentName.trim())
      .order('ano', { ascending: true });

    if (error) throw error;
    return data.map(r => ({
      ...r,
      estudanteNome: r.estudante_nome,
      anoSerie: r.ano_serie,
      nivelDesempenho: r.nivel_desempenho,
      tipoAvaliacao: r.tipo_avaliacao,
      escola: r.escolas
    }));
  }
};
