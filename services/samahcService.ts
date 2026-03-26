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
  }) {
    const { page, pageSize, searchTerm, polo, regional, schoolIds } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    console.log('--- SAMAHC DEBUG ---');
    console.log('Filters:', { page, pageSize, searchTerm, polo, regional });
    console.log('School IDs Count:', schoolIds?.length);
    if (schoolIds && schoolIds.length > 0) console.log('First 3 School IDs:', schoolIds.slice(0, 3));

    let query = supabase
      .from('registros_fluencia_samahc')
      .select('*', { count: 'exact' });

    console.log('SAMAHC Query Init - Range:', { from, to });

    // Apply security filters (linked schools)
    // Only apply if the array is provided AND has items
    if (schoolIds && Array.isArray(schoolIds) && schoolIds.length > 0) {
      query = query.in('escola_id', schoolIds);
    }

    // Apply UI filters - Use the 'polo' column directly from the main table
    // Use ilike to match e.g. '01 - SEDE' when user selects 'Sede'
    // Ensure we don't filter if it's "Todos" or "Todos os Polos"
    if (polo && polo !== 'Todos' && polo !== 'Todos os Polos' && polo !== '') {
      query = query.ilike('polo', `%${polo}%`);
    }

    // Regional filter - handled by schoolIds

    // Search logic (Server-side)
    if (searchTerm) {
      // Or filter for multiple fields
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
          nome,
          polo
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
