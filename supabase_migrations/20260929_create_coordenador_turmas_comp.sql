-- Migration: Create coordenador_turmas_comp association table
-- Purpose: Link monitors (Monitor de Atividade Complementar) to specific turmas complementares
-- This allows filtering which turmas a monitor can see in the Atividades Complementares module

CREATE TABLE IF NOT EXISTS coordenador_turmas_comp (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coordenador_id UUID NOT NULL REFERENCES coordenadores(id) ON DELETE CASCADE,
    turma_comp_id UUID NOT NULL REFERENCES turmas_atividades_comp(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(coordenador_id, turma_comp_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_coord_turmas_comp_coord ON coordenador_turmas_comp(coordenador_id);
CREATE INDEX IF NOT EXISTS idx_coord_turmas_comp_turma ON coordenador_turmas_comp(turma_comp_id);

-- Enable RLS
ALTER TABLE coordenador_turmas_comp ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "coordenador_turmas_comp_select" ON coordenador_turmas_comp
    FOR SELECT USING (true);

-- Allow all authenticated users to insert/update/delete
CREATE POLICY "coordenador_turmas_comp_insert" ON coordenador_turmas_comp
    FOR INSERT WITH CHECK (true);

CREATE POLICY "coordenador_turmas_comp_update" ON coordenador_turmas_comp
    FOR UPDATE USING (true);

CREATE POLICY "coordenador_turmas_comp_delete" ON coordenador_turmas_comp
    FOR DELETE USING (true);
