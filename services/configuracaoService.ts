import { supabase } from './supabase';

export interface PeriodoLetivo {
    id: string;
    nome: string;
    inicio: string; // YYYY-MM-DD
    fim: string;    // YYYY-MM-DD
    bloqueado: boolean;
}

export interface ConfiguracaoRede {
    id: string;
    nota_minima_aprovacao: number;
    periodos_letivos: PeriodoLetivo[];
    componentes_curriculares: string[];
    campos_experiencia: string[];
}

const DEFAULT_CONFIG: ConfiguracaoRede = {
    id: 'default',
    nota_minima_aprovacao: 7.0,
    periodos_letivos: [
        { id: 'b1', nome: '1º Bimestre', inicio: '2026-02-01', fim: '2026-04-30', bloqueado: false },
        { id: 'b2', nome: '2º Bimestre', inicio: '2026-05-01', fim: '2026-07-31', bloqueado: false },
        { id: 'b3', nome: '3º Bimestre', inicio: '2026-08-01', fim: '2026-10-31', bloqueado: false },
        { id: 'b4', nome: '4º Bimestre', inicio: '2026-11-01', fim: '2026-12-31', bloqueado: false }
    ],
    componentes_curriculares: [
        "Língua Portuguesa", "Matemática", "Ciências", "História", "Geografia", "Arte", "Educação Física", "Ensino Religioso", "Língua Inglesa"
    ],
    campos_experiencia: [
        "O EU, O OUTRO E O NÓS",
        "CORPO, GESTOS E MOVIMENTOS",
        "TRAÇOS, SONS, CORES E FORMAS",
        "ESCUTA, FALA, PENSAMENTO E IMAGINAÇÃO",
        "ESPAÇOS, TEMPOS, QUANTIDADES, RELAÇÕES E TRANSFORMAÇÕES"
    ]
};

export const configuracaoService = {
    async getConfiguracao(): Promise<ConfiguracaoRede> {
        try {
            const { data, error } = await supabase
                .from('configuracao_rede')
                .select('*')
                .eq('id', 'default')
                .maybeSingle();

            if (error) throw error;
            if (!data) return DEFAULT_CONFIG;

            return {
                id: data.id,
                nota_minima_aprovacao: Number(data.nota_minima_aprovacao ?? 7.0),
                periodos_letivos: data.periodos_letivos || DEFAULT_CONFIG.periodos_letivos,
                componentes_curriculares: data.componentes_curriculares || DEFAULT_CONFIG.componentes_curriculares,
                campos_experiencia: data.campos_experiencia || DEFAULT_CONFIG.campos_experiencia
            };
        } catch (err) {
            console.error('Error fetching system configurations:', err);
            return DEFAULT_CONFIG;
        }
    },

    async saveConfiguracao(config: Omit<ConfiguracaoRede, 'id'>): Promise<ConfiguracaoRede> {
        const { data, error } = await supabase
            .from('configuracao_rede')
            .upsert({
                id: 'default',
                ...config,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
