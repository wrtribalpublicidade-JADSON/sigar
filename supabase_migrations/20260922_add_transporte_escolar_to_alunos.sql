-- Migration: Add transporte_escolar to alunos table
-- Description: Adiciona coluna para registrar se o estudante utiliza transporte escolar público

ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS transporte_escolar TEXT DEFAULT 'Não';

COMMENT ON COLUMN public.alunos.transporte_escolar IS 'Indica se o estudante utiliza transporte escolar público (Sim / Não)';
