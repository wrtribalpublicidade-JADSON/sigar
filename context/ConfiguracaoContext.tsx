import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { configuracaoService, ConfiguracaoRede, PeriodoLetivo } from '../services/configuracaoService';

interface ConfiguracaoContextData {
    configuracao: ConfiguracaoRede;
    loading: boolean;
    refreshConfiguracao: () => Promise<void>;
    isPeriodoBloqueado: (periodoNome: string, userRole?: string) => boolean;
    isDataBloqueada: (dateStr: string, userRole?: string) => boolean;
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
        "Língua Portuguesa", "Matemática", "Ciências", "História", "Geografia", "Arte", "Educação Física", "Ensino Religioso", "Inglês"
    ],
    campos_experiencia: [
        "O EU, O OUTRO E O NÓS",
        "CORPO, GESTOS E MOVIMENTOS",
        "TRAÇOS, SONS, CORES E FORMAS",
        "ESCUTA, FALA, PENSAMENTO E IMAGINAÇÃO",
        "ESPAÇOS, TEMPOS, QUANTIDADES, RELAÇÕES E TRANSFORMAÇÕES"
    ]
};

const ConfiguracaoContext = createContext<ConfiguracaoContextData>({} as ConfiguracaoContextData);

export const useConfiguracao = () => {
    const context = useContext(ConfiguracaoContext);
    if (!context) {
        throw new Error('useConfiguracao must be used within a ConfiguracaoProvider');
    }
    return context;
};

export const ConfiguracaoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [configuracao, setConfiguracao] = useState<ConfiguracaoRede>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);

    const refreshConfiguracao = useCallback(async () => {
        setLoading(true);
        try {
            const data = await configuracaoService.getConfiguracao();
            setConfiguracao(data);
        } catch (err) {
            console.error('Error in refreshConfiguracao:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshConfiguracao();
    }, [refreshConfiguracao]);

    const isPeriodoBloqueado = useCallback((periodoNome: string, userRole?: string): boolean => {
        // Admin bypass
        if (userRole === 'Administrador') {
            return false;
        }

        // Find the selected period
        const period = configuracao.periodos_letivos.find(
            p => p.nome.toLowerCase() === periodoNome.toLowerCase() || p.id.toLowerCase() === periodoNome.toLowerCase()
        );

        if (!period) {
            return false; // If period is not found, don't block
        }

        // 1. Check manual lock flag
        if (period.bloqueado) {
            return true;
        }

        // 2. Check date range (only if the period has not started yet)
        const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
        
        if (period.inicio && todayStr < period.inicio) {
            return true; // Not started yet
        }

        return false;
    }, [configuracao]);

    const isDataBloqueada = useCallback((dateStr: string, userRole?: string): boolean => {
        // Admin bypass
        if (userRole === 'Administrador') {
            return false;
        }

        // Find which period contains this date
        const period = configuracao.periodos_letivos.find(p => {
            if (!p.inicio || !p.fim) return false;
            return dateStr >= p.inicio && dateStr <= p.fim;
        });

        if (!period) {
            // Outside of all configured periods letivos, so lock!
            return true;
        }

        return period.bloqueado;
    }, [configuracao]);

    return (
        <ConfiguracaoContext.Provider value={{ configuracao, loading, refreshConfiguracao, isPeriodoBloqueado, isDataBloqueada }}>
            {children}
        </ConfiguracaoContext.Provider>
    );
};
