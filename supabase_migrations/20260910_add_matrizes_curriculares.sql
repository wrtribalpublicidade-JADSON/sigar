-- Migration: Add matrizes_curriculares to configuracao_rede
-- Date: 2026-09-10

ALTER TABLE public.configuracao_rede 
ADD COLUMN IF NOT EXISTS matrizes_curriculares JSONB;
