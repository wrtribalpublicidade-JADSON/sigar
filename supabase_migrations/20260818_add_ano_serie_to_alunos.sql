-- ======================================================================================
-- MIGRAÇÃO: ADICIONAR COLUNA ANO_SERIE NA TABELA ALUNOS
-- ======================================================================================

ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS ano_serie TEXT;

-- Comentário da coluna
COMMENT ON COLUMN public.alunos.ano_serie IS 'Ano ou série do estudante (ex: Pré-Escola I, 1º Ano, 5º Ano, etc.)';

-- Atualiza registros existentes a partir da turma vinculada
UPDATE public.alunos a
SET ano_serie = t.year
FROM public.turmas t
WHERE a.class_id = t.id AND a.ano_serie IS NULL AND t.year IS NOT NULL;
