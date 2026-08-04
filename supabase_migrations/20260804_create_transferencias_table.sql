-- Migration: Create transferencias_estudantes table
-- Tabela para gerenciar solicitações de transferência de estudantes (interna e externa)

CREATE TABLE IF NOT EXISTS transferencias_estudantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id INTEGER NOT NULL,
  aluno_nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('INTERNA', 'EXTERNA')),
  
  -- Escola de origem
  escola_origem_id TEXT NOT NULL,
  escola_origem_nome TEXT NOT NULL,
  turma_origem_id TEXT,
  
  -- Escola de destino (transferência interna)
  escola_destino_id TEXT,
  escola_destino_nome TEXT,
  turma_destino_id TEXT,
  turma_destino_nome TEXT,
  turno_destino TEXT,
  
  -- Escola externa (transferência externa)
  escola_externa_nome TEXT,
  
  -- Controle de status
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_ANALISE', 'APROVADO', 'NEGADO')),
  motivo TEXT,
  motivo_resposta TEXT,
  
  solicitado_por TEXT,
  respondido_por TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transferencias_estudantes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated" ON transferencias_estudantes
  FOR ALL USING (true);

-- Index for faster lookups by escola destino (pendências)
CREATE INDEX idx_transferencias_escola_destino ON transferencias_estudantes (escola_destino_id, status);

-- Index for lookups by aluno
CREATE INDEX idx_transferencias_aluno ON transferencias_estudantes (aluno_id);
