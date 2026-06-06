-- Adiciona a coluna turma à tabela registros_cnca
ALTER TABLE public.registros_cnca ADD COLUMN IF NOT EXISTS turma text;

-- Remove constraint de unicidade antiga que não considerava a turma
ALTER TABLE public.registros_cnca DROP CONSTRAINT IF EXISTS registros_cnca_unique_key;

-- Define valor padrão de string vazia e impede valores nulos na coluna turma
UPDATE public.registros_cnca SET turma = '' WHERE turma IS NULL;
ALTER TABLE public.registros_cnca ALTER COLUMN turma SET DEFAULT '';
ALTER TABLE public.registros_cnca ALTER COLUMN turma SET NOT NULL;

-- Adiciona a nova constraint de unicidade incluindo a coluna turma
ALTER TABLE public.registros_cnca ADD CONSTRAINT registros_cnca_unique_key UNIQUE (escola_id, ano, tipo_avaliacao, componente_curricular, ano_serie, turma);
