import { supabase } from './supabase';
import { normalizeSubjectName } from '../utils';

export interface PeriodoLetivo {
    id: string;
    nome: string;
    inicio: string; // YYYY-MM-DD
    fim: string;    // YYYY-MM-DD
    bloqueado: boolean;
}

export interface HorariosTurnoConfig {
    inicio: string;             // ex: "07:30"
    duracaoIntervalo: number;   // minutos, ex: 20
    intervaloAposAula: number;  // número da aula após a qual ocorre o intervalo, ex: 2
    aulasPorTurno: number;      // quantidade de aulas no turno, ex: 5
}

export interface DuracaoAulasEtapaConfig {
    educacaoInfantil: number;   // minutos por aula na Educação Infantil, ex: 50
    anosIniciais: number;       // minutos por aula nos Anos Iniciais, ex: 50
    anosFinais: number;         // minutos por aula nos Anos Finais, ex: 50
}

export interface HorariosConfig {
    turnos: {
        matutino: HorariosTurnoConfig;
        vespertino: HorariosTurnoConfig;
        noturno: HorariosTurnoConfig;
    };
    duracaoAulas: DuracaoAulasEtapaConfig;
}

export interface SlotHorarioCalculado {
    numero: number;
    inicio: string;
    fim: string;
    intervalo?: boolean;
}

export interface ItemMatrizCurricular {
    id: string;
    area?: string;              // ex: "LINGUAGENS", "MATEMÁTICA", "CIÊNCIAS DA NATUREZA", "CIÊNCIAS HUMANAS", "ENSINO RELIGIOSO"
    componente: string;        // ex: "LÍNGUA PORTUGUESA", "O EU, O OUTRO E O NÓS"
    aulasSemanais: number;     // ex: 6
    duracaoMinutos: number;    // ex: 50 ou 40
    observacao?: string;       // ex: "*" para indicar duração diferenciada
}

export interface MatrizCurricularConfig {
    titulo: string;
    subtitulo?: string;
    etapaId: 'infantil' | 'fundamental_iniciais' | 'fundamental_finais' | 'eja_iniciais' | 'eja_finais';
    tipoPeriodo: 'anual' | 'semestral';
    diasLetivos: number;       // 200 (regular) ou 100 (EJA)
    semanasPeriodo: number;    // 40 (anual) ou 20 (semestral)
    aulasDia: number | string; // 5 ou 4 ou "4/5"
    duracaoPadraoMinutos: number; // 50
    duracaoDiferenciadaMinutos?: number; // 40
    itens: ItemMatrizCurricular[];
}

export interface MatrizesCurricularesRede {
    infantil: MatrizCurricularConfig;
    fundamentalIniciais: MatrizCurricularConfig;
    fundamentalFinais: MatrizCurricularConfig;
    ejaIniciais: MatrizCurricularConfig;
    ejaFinais: MatrizCurricularConfig;
}

export interface ConfiguracaoRede {
    id: string;
    nota_minima_aprovacao: number;
    periodos_letivos: PeriodoLetivo[];
    componentes_curriculares: string[];
    campos_experiencia: string[];
    horarios_config: HorariosConfig;
    matrizes_curriculares: MatrizesCurricularesRede;
}

export const DEFAULT_HORARIOS_CONFIG: HorariosConfig = {
    turnos: {
        matutino: {
            inicio: '07:30',
            duracaoIntervalo: 20,
            intervaloAposAula: 2,
            aulasPorTurno: 5,
        },
        vespertino: {
            inicio: '13:00',
            duracaoIntervalo: 20,
            intervaloAposAula: 2,
            aulasPorTurno: 5,
        },
        noturno: {
            inicio: '19:00',
            duracaoIntervalo: 15,
            intervaloAposAula: 2,
            aulasPorTurno: 4,
        },
    },
    duracaoAulas: {
        educacaoInfantil: 50,
        anosIniciais: 50,
        anosFinais: 50,
    }
};

export function calcularGradeHorarios(
    turnoConfig: HorariosTurnoConfig,
    duracaoAulaMinutos: number
): SlotHorarioCalculado[] {
    if (!turnoConfig) return [];
    const duracao = Math.max(duracaoAulaMinutos || 50, 15);
    const slots: SlotHorarioCalculado[] = [];
    const [startH, startM] = (turnoConfig.inicio || '07:30').split(':').map(Number);
    let currentMinutes = (isNaN(startH) ? 7 : startH) * 60 + (isNaN(startM) ? 30 : startM);

    const toTimeStr = (totalMinutes: number) => {
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const aulas = Math.max(turnoConfig.aulasPorTurno || 5, 1);
    const intervaloApos = turnoConfig.intervaloAposAula || 2;
    const duracaoInt = Number(turnoConfig.duracaoIntervalo) || 0;

    for (let aula = 1; aula <= aulas; aula++) {
        const inicioStr = toTimeStr(currentMinutes);
        currentMinutes += duracao;
        const fimStr = toTimeStr(currentMinutes);

        slots.push({
            numero: aula,
            inicio: inicioStr,
            fim: fimStr,
        });

        // Inserir intervalo se for após esta aula e ainda restarem aulas
        if (aula === intervaloApos && aula < aulas && duracaoInt > 0) {
            const intInicioStr = toTimeStr(currentMinutes);
            currentMinutes += duracaoInt;
            const intFimStr = toTimeStr(currentMinutes);

            slots.push({
                numero: 0,
                inicio: intInicioStr,
                fim: intFimStr,
                intervalo: true,
            });
        }
    }

    return slots;
}

export function formatarMinutosParaHoras(minutosTotais: number): string {
    const horas = Math.floor(minutosTotais / 60);
    const minutos = minutosTotais % 60;
    return `${horas}:${String(minutos).padStart(2, '0')}:00`;
}

export function formatarCargaComponente(duracaoMinutos: number): string {
    const h = Math.floor(duracaoMinutos / 60);
    const m = duracaoMinutos % 60;
    return `${h}:${String(m).padStart(2, '0')}:00`;
}

export function calcularTotaisMatriz(matriz: MatrizCurricularConfig) {
    let aulasSemanais = 0;
    let aulasTotais = 0;
    let minutosTotais = 0;

    (matriz?.itens || []).forEach(item => {
        const itemSemanais = Number(item.aulasSemanais) || 0;
        const itemDuracao = Number(item.duracaoMinutos) || matriz.duracaoPadraoMinutos || 50;
        const itemTotais = itemSemanais * matriz.semanasPeriodo;
        const itemMinutos = itemTotais * itemDuracao;

        aulasSemanais += itemSemanais;
        aulasTotais += itemTotais;
        minutosTotais += itemMinutos;
    });

    return {
        aulasSemanais,
        aulasTotais,
        minutosTotais,
        horasFormatadas: formatarMinutosParaHoras(minutosTotais),
    };
}

export const DEFAULT_MATRIZES_CURRICULARES: MatrizesCurricularesRede = {
    infantil: {
        titulo: 'MATRIZ CURRICULAR EDUCAÇÃO INFANTIL – CRECHE E PRÉ-ESCOLA',
        subtitulo: 'Educação Infantil – Creche e Pré-Escola',
        etapaId: 'infantil',
        tipoPeriodo: 'anual',
        diasLetivos: 200,
        semanasPeriodo: 40,
        aulasDia: 5,
        duracaoPadraoMinutos: 50,
        duracaoDiferenciadaMinutos: 40,
        itens: [
            { id: 'inf-1', componente: 'O EU, O OUTRO E O NÓS', aulasSemanais: 3, duracaoMinutos: 50 },
            { id: 'inf-2', componente: 'CORPO, GESTOS E MOVIMENTOS', aulasSemanais: 5, duracaoMinutos: 40, observacao: '*' },
            { id: 'inf-3', componente: 'ESCUTA, FALA, PENSAMENTO E IMAGINAÇÃO', aulasSemanais: 7, duracaoMinutos: 50 },
            { id: 'inf-4', componente: 'TRAÇOS, SONS, CORES E FORMAS', aulasSemanais: 3, duracaoMinutos: 50 },
            { id: 'inf-5', componente: 'ESPAÇOS, TEMPOS, QUANTIDADES, RELAÇÕES E TRANSFORMAÇÕES', aulasSemanais: 7, duracaoMinutos: 50 },
        ]
    },
    fundamentalIniciais: {
        titulo: 'MATRIZ CURRICULAR ENSINO FUNDAMENTAL – 1º ao 5º ano',
        subtitulo: 'Ensino Fundamental – Anos Iniciais (1º ao 5º ano)',
        etapaId: 'fundamental_iniciais',
        tipoPeriodo: 'anual',
        diasLetivos: 200,
        semanasPeriodo: 40,
        aulasDia: 5,
        duracaoPadraoMinutos: 50,
        duracaoDiferenciadaMinutos: 40,
        itens: [
            { id: 'fund-ini-1', area: 'LINGUAGENS', componente: 'Língua Portuguesa', aulasSemanais: 6, duracaoMinutos: 50 },
            { id: 'fund-ini-2', area: 'LINGUAGENS', componente: 'Arte', aulasSemanais: 1, duracaoMinutos: 40, observacao: '*' },
            { id: 'fund-ini-3', area: 'LINGUAGENS', componente: 'Educação Física', aulasSemanais: 2, duracaoMinutos: 50 },
            { id: 'fund-ini-4', area: 'MATEMÁTICA', componente: 'Matemática', aulasSemanais: 6, duracaoMinutos: 50 },
            { id: 'fund-ini-5', area: 'CIÊNCIAS DA NATUREZA', componente: 'Ciências', aulasSemanais: 3, duracaoMinutos: 50 },
            { id: 'fund-ini-6', area: 'CIÊNCIAS HUMANAS', componente: 'Geografia', aulasSemanais: 3, duracaoMinutos: 40, observacao: '*' },
            { id: 'fund-ini-7', area: 'CIÊNCIAS HUMANAS', componente: 'História', aulasSemanais: 3, duracaoMinutos: 50 },
            { id: 'fund-ini-8', area: 'ENSINO RELIGIOSO', componente: 'Ensino Religioso', aulasSemanais: 1, duracaoMinutos: 40, observacao: '*' },
        ]
    },
    fundamentalFinais: {
        titulo: 'MATRIZ CURRICULAR ENSINO FUNDAMENTAL – 6º ao 9º ano',
        subtitulo: 'Ensino Fundamental – Anos Finais (6º ao 9º ano)',
        etapaId: 'fundamental_finais',
        tipoPeriodo: 'anual',
        diasLetivos: 200,
        semanasPeriodo: 40,
        aulasDia: 5,
        duracaoPadraoMinutos: 50,
        itens: [
            { id: 'fund-fin-1', area: 'LINGUAGENS', componente: 'Língua Portuguesa', aulasSemanais: 5, duracaoMinutos: 50 },
            { id: 'fund-fin-2', area: 'LINGUAGENS', componente: 'Língua Inglesa', aulasSemanais: 2, duracaoMinutos: 50 },
            { id: 'fund-fin-3', area: 'LINGUAGENS', componente: 'Arte', aulasSemanais: 1, duracaoMinutos: 50 },
            { id: 'fund-fin-4', area: 'LINGUAGENS', componente: 'Educação Física', aulasSemanais: 2, duracaoMinutos: 50 },
            { id: 'fund-fin-5', area: 'MATEMÁTICA', componente: 'Matemática', aulasSemanais: 5, duracaoMinutos: 50 },
            { id: 'fund-fin-6', area: 'CIÊNCIAS DA NATUREZA', componente: 'Ciências', aulasSemanais: 3, duracaoMinutos: 50 },
            { id: 'fund-fin-7', area: 'CIÊNCIAS HUMANAS', componente: 'Geografia', aulasSemanais: 3, duracaoMinutos: 50 },
            { id: 'fund-fin-8', area: 'CIÊNCIAS HUMANAS', componente: 'História', aulasSemanais: 3, duracaoMinutos: 50 },
            { id: 'fund-fin-9', area: 'ENSINO RELIGIOSO', componente: 'Ensino Religioso', aulasSemanais: 1, duracaoMinutos: 50 },
        ]
    },
    ejaIniciais: {
        titulo: 'MATRIZ CURRICULAR EJA ENSINO FUNDAMENTAL ANOS INICIAIS | 2 SEMESTRES',
        subtitulo: 'EJA – Ensino Fundamental Anos Iniciais (2 Semestres)',
        etapaId: 'eja_iniciais',
        tipoPeriodo: 'semestral',
        diasLetivos: 100,
        semanasPeriodo: 20,
        aulasDia: 4,
        duracaoPadraoMinutos: 50,
        itens: [
            { id: 'eja-ini-1', area: 'LINGUAGENS', componente: 'Língua Portuguesa', aulasSemanais: 5, duracaoMinutos: 50 },
            { id: 'eja-ini-2', area: 'LINGUAGENS', componente: 'Arte', aulasSemanais: 2, duracaoMinutos: 50 },
            { id: 'eja-ini-3', area: 'LINGUAGENS', componente: 'Educação Física', aulasSemanais: 1, duracaoMinutos: 50 },
            { id: 'eja-ini-4', area: 'MATEMÁTICA', componente: 'Matemática', aulasSemanais: 5, duracaoMinutos: 50 },
            { id: 'eja-ini-5', area: 'CIÊNCIAS DA NATUREZA', componente: 'Ciências', aulasSemanais: 2, duracaoMinutos: 50 },
            { id: 'eja-ini-6', area: 'CIÊNCIAS HUMANAS', componente: 'Geografia', aulasSemanais: 2, duracaoMinutos: 50 },
            { id: 'eja-ini-7', area: 'CIÊNCIAS HUMANAS', componente: 'História', aulasSemanais: 2, duracaoMinutos: 50 },
            { id: 'eja-ini-8', area: 'ENSINO RELIGIOSO', componente: 'Ensino Religioso', aulasSemanais: 1, duracaoMinutos: 50 },
        ]
    },
    ejaFinais: {
        titulo: 'MATRIZ CURRICULAR EJA ENSINO FUNDAMENTAL ANOS FINAIS | 4 SEMESTRES',
        subtitulo: 'EJA – Ensino Fundamental Anos Finais (4 Semestres)',
        etapaId: 'eja_finais',
        tipoPeriodo: 'semestral',
        diasLetivos: 100,
        semanasPeriodo: 20,
        aulasDia: '4/5',
        duracaoPadraoMinutos: 50,
        itens: [
            { id: 'eja-fin-1', area: 'LINGUAGENS', componente: 'Língua Portuguesa', aulasSemanais: 5, duracaoMinutos: 50 },
            { id: 'eja-fin-2', area: 'LINGUAGENS', componente: 'Língua Inglesa', aulasSemanais: 2, duracaoMinutos: 50 },
            { id: 'eja-fin-3', area: 'LINGUAGENS', componente: 'Arte', aulasSemanais: 2, duracaoMinutos: 50 },
            { id: 'eja-fin-4', area: 'LINGUAGENS', componente: 'Educação Física', aulasSemanais: 1, duracaoMinutos: 50 },
            { id: 'eja-fin-5', area: 'MATEMÁTICA', componente: 'Matemática', aulasSemanais: 6, duracaoMinutos: 50 },
            { id: 'eja-fin-6', area: 'CIÊNCIAS DA NATUREZA', componente: 'Ciências', aulasSemanais: 4, duracaoMinutos: 50 },
            { id: 'eja-fin-7', area: 'CIÊNCIAS HUMANAS', componente: 'História', aulasSemanais: 2, duracaoMinutos: 50 },
            { id: 'eja-fin-8', area: 'CIÊNCIAS HUMANAS', componente: 'Geografia', aulasSemanais: 1, duracaoMinutos: 50 },
            { id: 'eja-fin-9', area: 'ENSINO RELIGIOSO', componente: 'Ensino Religioso', aulasSemanais: 1, duracaoMinutos: 50 },
        ]
    }
};

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
    ],
    horarios_config: DEFAULT_HORARIOS_CONFIG,
    matrizes_curriculares: DEFAULT_MATRIZES_CURRICULARES
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

            const hc = data.horarios_config;
            const mergedHorarios: HorariosConfig = hc ? {
                turnos: {
                    matutino: { ...DEFAULT_HORARIOS_CONFIG.turnos.matutino, ...(hc.turnos?.matutino || {}) },
                    vespertino: { ...DEFAULT_HORARIOS_CONFIG.turnos.vespertino, ...(hc.turnos?.vespertino || {}) },
                    noturno: { ...DEFAULT_HORARIOS_CONFIG.turnos.noturno, ...(hc.turnos?.noturno || {}) },
                },
                duracaoAulas: {
                    educacaoInfantil: Number(hc.duracaoAulas?.educacaoInfantil || DEFAULT_HORARIOS_CONFIG.duracaoAulas.educacaoInfantil),
                    anosIniciais: Number(hc.duracaoAulas?.anosIniciais || DEFAULT_HORARIOS_CONFIG.duracaoAulas.anosIniciais),
                    anosFinais: Number(hc.duracaoAulas?.anosFinais || DEFAULT_HORARIOS_CONFIG.duracaoAulas.anosFinais),
                }
            } : DEFAULT_HORARIOS_CONFIG;

            const mc = data.matrizes_curriculares;
            const mergedMatrizes: MatrizesCurricularesRede = mc ? {
                infantil: { ...DEFAULT_MATRIZES_CURRICULARES.infantil, ...(mc.infantil || {}), itens: mc.infantil?.itens || DEFAULT_MATRIZES_CURRICULARES.infantil.itens },
                fundamentalIniciais: { ...DEFAULT_MATRIZES_CURRICULARES.fundamentalIniciais, ...(mc.fundamentalIniciais || {}), itens: mc.fundamentalIniciais?.itens || DEFAULT_MATRIZES_CURRICULARES.fundamentalIniciais.itens },
                fundamentalFinais: { ...DEFAULT_MATRIZES_CURRICULARES.fundamentalFinais, ...(mc.fundamentalFinais || {}), itens: mc.fundamentalFinais?.itens || DEFAULT_MATRIZES_CURRICULARES.fundamentalFinais.itens },
                ejaIniciais: { ...DEFAULT_MATRIZES_CURRICULARES.ejaIniciais, ...(mc.ejaIniciais || {}), itens: mc.ejaIniciais?.itens || DEFAULT_MATRIZES_CURRICULARES.ejaIniciais.itens },
                ejaFinais: { ...DEFAULT_MATRIZES_CURRICULARES.ejaFinais, ...(mc.ejaFinais || {}), itens: mc.ejaFinais?.itens || DEFAULT_MATRIZES_CURRICULARES.ejaFinais.itens },
            } : DEFAULT_MATRIZES_CURRICULARES;

            const rawComponentes = (data.componentes_curriculares || DEFAULT_CONFIG.componentes_curriculares) as string[];
            const seenComp = new Set<string>();
            const deduplicatedComponentes: string[] = [];
            for (const c of rawComponentes) {
                if (!c) continue;
                const norm = normalizeSubjectName(c);
                const key = norm.toLowerCase();
                if (norm && !seenComp.has(key)) {
                    seenComp.add(key);
                    deduplicatedComponentes.push(norm);
                }
            }

            const rawCampos = (data.campos_experiencia || DEFAULT_CONFIG.campos_experiencia) as string[];
            const seenCampos = new Set<string>();
            const deduplicatedCampos: string[] = [];
            for (const ce of rawCampos) {
                if (!ce) continue;
                const clean = ce.replace(/\*/g, '').trim().toUpperCase();
                if (clean && !seenCampos.has(clean)) {
                    seenCampos.add(clean);
                    deduplicatedCampos.push(clean);
                }
            }

            return {
                id: data.id,
                nota_minima_aprovacao: Number(data.nota_minima_aprovacao ?? 7.0),
                periodos_letivos: data.periodos_letivos || DEFAULT_CONFIG.periodos_letivos,
                componentes_curriculares: deduplicatedComponentes.length > 0 ? deduplicatedComponentes : DEFAULT_CONFIG.componentes_curriculares,
                campos_experiencia: deduplicatedCampos.length > 0 ? deduplicatedCampos : DEFAULT_CONFIG.campos_experiencia,
                horarios_config: mergedHorarios,
                matrizes_curriculares: mergedMatrizes
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
