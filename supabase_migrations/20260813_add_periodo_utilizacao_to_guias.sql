-- ======================================================================================
-- Adiciona período de utilização (data de início e término) e data de criação
-- às tabelas guias_aprendizagem e guias_aprendizagem_infantil
-- ======================================================================================

ALTER TABLE public.guias_aprendizagem 
  ADD COLUMN IF NOT EXISTS data_inicio DATE,
  ADD COLUMN IF NOT EXISTS data_termino DATE,
  ADD COLUMN IF NOT EXISTS data_criacao DATE;

ALTER TABLE public.guias_aprendizagem_infantil 
  ADD COLUMN IF NOT EXISTS data_inicio DATE,
  ADD COLUMN IF NOT EXISTS data_termino DATE,
  ADD COLUMN IF NOT EXISTS data_criacao DATE;
