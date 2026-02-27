-- ======================================================================================
-- SUPABASE SCHEMA - CALENDÁRIO INTERNO
-- Tabelas para gerenciar o calendário oficial da SEMED e calendário interno das escolas.
-- ======================================================================================

-- 1. Calendário Oficial (SEMED)
CREATE TABLE IF NOT EXISTS public.ig_calendario_oficial (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data DATE NOT NULL,
    data_fim DATE,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'letivo_especial', -- 'feriado', 'recesso', 'pedagogico', 'letivo_especial'
    obrigatorio BOOLEAN DEFAULT true,
    ano_letivo TEXT NOT NULL DEFAULT '2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Calendário Interno (Escola)
CREATE TABLE IF NOT EXISTS public.ig_calendario_interno (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    escola_id UUID,
    data DATE NOT NULL,
    data_fim DATE,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'outro', -- 'reuniao_pedagogica', 'conselho_classe', 'evento_escolar', 'projeto', 'formacao_interna', 'outro'
    classificacao TEXT NOT NULL DEFAULT 'letivo', -- 'letivo', 'nao_letivo', 'institucional'
    descricao TEXT,
    responsavel TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.ig_calendario_oficial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_calendario_interno ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas
CREATE POLICY "allow_select_cal_oficial" ON public.ig_calendario_oficial FOR SELECT USING (true);
CREATE POLICY "allow_insert_cal_oficial" ON public.ig_calendario_oficial FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_cal_oficial" ON public.ig_calendario_oficial FOR UPDATE USING (true);
CREATE POLICY "allow_delete_cal_oficial" ON public.ig_calendario_oficial FOR DELETE USING (true);

CREATE POLICY "allow_select_cal_interno" ON public.ig_calendario_interno FOR SELECT USING (true);
CREATE POLICY "allow_insert_cal_interno" ON public.ig_calendario_interno FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_cal_interno" ON public.ig_calendario_interno FOR UPDATE USING (true);
CREATE POLICY "allow_delete_cal_interno" ON public.ig_calendario_interno FOR DELETE USING (true);
