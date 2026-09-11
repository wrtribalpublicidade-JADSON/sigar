-- Migration: Create horarios_docentes table
-- Quadro de Horário Docente - Distribuição semanal de aulas por professor

CREATE TABLE IF NOT EXISTS public.horarios_docentes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    turma_id TEXT NOT NULL,
    componente TEXT NOT NULL DEFAULT '',
    dia_semana TEXT NOT NULL CHECK (dia_semana IN ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA')),
    turno TEXT NOT NULL CHECK (turno IN ('MATUTINO', 'VESPERTINO', 'NOTURNO')),
    horario_inicio TEXT NOT NULL,
    horario_fim TEXT NOT NULL,
    numero_aula INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.horarios_docentes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all for authenticated users" ON public.horarios_docentes
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_horarios_docentes_school_id ON public.horarios_docentes(school_id);
CREATE INDEX idx_horarios_docentes_teacher_id ON public.horarios_docentes(teacher_id);
CREATE INDEX idx_horarios_docentes_turno ON public.horarios_docentes(turno);
CREATE INDEX idx_horarios_docentes_dia_semana ON public.horarios_docentes(dia_semana);
