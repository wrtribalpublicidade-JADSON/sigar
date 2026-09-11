-- Migration: Add enrollment history and evasion tracking to alunos table
-- Date: 2026-09-11

ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS historico_matriculas JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS data_evasao DATE,
ADD COLUMN IF NOT EXISTS motivo_evasao TEXT,
ADD COLUMN IF NOT EXISTS observacoes_evasao TEXT,
ADD COLUMN IF NOT EXISTS acoes_busca_ativa TEXT[];

COMMENT ON COLUMN public.alunos.historico_matriculas IS 'Histórico cronológico de matrículas e movimentações escolares do estudante (JSONB)';
COMMENT ON COLUMN public.alunos.data_evasao IS 'Data em que ocorreu a evasão / abandono escolar do estudante';
COMMENT ON COLUMN public.alunos.motivo_evasao IS 'Motivo declarado ou apurado para a evasão escolar';
COMMENT ON COLUMN public.alunos.observacoes_evasao IS 'Observações complementares e histórico de diligências sobre a evasão';
COMMENT ON COLUMN public.alunos.acoes_busca_ativa IS 'Lista de ações de busca ativa realizadas para resgate do estudante evadido';
