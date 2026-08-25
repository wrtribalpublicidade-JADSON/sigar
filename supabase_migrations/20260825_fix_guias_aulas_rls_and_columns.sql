-- ======================================================================================
-- Migração: Correção de RLS e Colunas para Guias de Aprendizagem e Aulas Ministradas
-- Data: 25/08/2026
-- ======================================================================================

-- 1. Adicionar coluna professor em guias_aprendizagem e guias_aprendizagem_infantil
ALTER TABLE public.guias_aprendizagem 
  ADD COLUMN IF NOT EXISTS professor TEXT;

ALTER TABLE public.guias_aprendizagem_infantil 
  ADD COLUMN IF NOT EXISTS professor TEXT;

-- 2. Atualizar políticas RLS de guias_aprendizagem para acesso público completo
DROP POLICY IF EXISTS "Public full access guias_aprendizagem" ON public.guias_aprendizagem;
CREATE POLICY "Public full access guias_aprendizagem" ON public.guias_aprendizagem 
  FOR ALL TO public 
  USING (true) 
  WITH CHECK (true);

-- 3. Atualizar políticas RLS de guias_aprendizagem_infantil para acesso público completo
DROP POLICY IF EXISTS "Public full access guias_aprendizagem_infantil" ON public.guias_aprendizagem_infantil;
CREATE POLICY "Public full access guias_aprendizagem_infantil" ON public.guias_aprendizagem_infantil 
  FOR ALL TO public 
  USING (true) 
  WITH CHECK (true);

-- 4. Atualizar políticas RLS de aulas_ministradas para acesso público completo
DROP POLICY IF EXISTS "Public full access aulas_ministradas" ON public.aulas_ministradas;
CREATE POLICY "Public full access aulas_ministradas" ON public.aulas_ministradas 
  FOR ALL TO public 
  USING (true) 
  WITH CHECK (true);

-- 5. Atualizar políticas RLS de aulas_ministradas_infantil para acesso público completo
DROP POLICY IF EXISTS "Public full access aulas_ministradas_infantil" ON public.aulas_ministradas_infantil;
CREATE POLICY "Public full access aulas_ministradas_infantil" ON public.aulas_ministradas_infantil 
  FOR ALL TO public 
  USING (true) 
  WITH CHECK (true);
