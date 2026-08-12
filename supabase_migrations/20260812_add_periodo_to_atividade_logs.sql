-- Add periodo column to atividade_logs table for Atividades Complementares
ALTER TABLE atividade_logs 
  ADD COLUMN IF NOT EXISTS periodo TEXT DEFAULT '1º Bimestre';
