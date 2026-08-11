-- Add status and approval tracking columns to guias_aprendizagem and guias_aprendizagem_infantil
ALTER TABLE guias_aprendizagem 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Em Análise',
  ADD COLUMN IF NOT EXISTS observacao_coordenacao TEXT,
  ADD COLUMN IF NOT EXISTS avaliado_por TEXT,
  ADD COLUMN IF NOT EXISTS avaliado_em TIMESTAMP WITH TIME ZONE;

ALTER TABLE guias_aprendizagem_infantil 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Em Análise',
  ADD COLUMN IF NOT EXISTS observacao_coordenacao TEXT,
  ADD COLUMN IF NOT EXISTS avaliado_por TEXT,
  ADD COLUMN IF NOT EXISTS avaliado_em TIMESTAMP WITH TIME ZONE;
