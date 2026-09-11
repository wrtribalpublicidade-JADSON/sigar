-- Migration: Add horarios_config to configuracao_rede and etapa to horarios_docentes
-- Date: 2026-09-09

-- 1. Add horarios_config column to configuracao_rede
ALTER TABLE public.configuracao_rede 
ADD COLUMN IF NOT EXISTS horarios_config JSONB;

-- 2. Populate default horarios_config if null
UPDATE public.configuracao_rede 
SET horarios_config = '{
  "turnos": {
    "matutino": {
      "inicio": "07:30",
      "duracaoIntervalo": 20,
      "intervaloAposAula": 2,
      "aulasPorTurno": 5
    },
    "vespertino": {
      "inicio": "13:00",
      "duracaoIntervalo": 20,
      "intervaloAposAula": 2,
      "aulasPorTurno": 5
    },
    "noturno": {
      "inicio": "19:00",
      "duracaoIntervalo": 15,
      "intervaloAposAula": 2,
      "aulasPorTurno": 4
    }
  },
  "duracaoAulas": {
    "educacaoInfantil": 50,
    "anosIniciais": 50,
    "anosFinais": 50
  }
}'::jsonb
WHERE id = 'default' AND (horarios_config IS NULL OR horarios_config = '{}'::jsonb);

-- 3. Add etapa column to horarios_docentes
ALTER TABLE public.horarios_docentes 
ADD COLUMN IF NOT EXISTS etapa TEXT;
