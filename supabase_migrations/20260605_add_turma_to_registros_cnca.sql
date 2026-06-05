-- Adiciona a coluna turma à tabela registros_cnca
ALTER TABLE public.registros_cnca ADD COLUMN IF NOT EXISTS turma text;
