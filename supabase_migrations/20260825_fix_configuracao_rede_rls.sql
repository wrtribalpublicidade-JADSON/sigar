-- Correção de Permissões RLS na tabela configuracao_rede
-- Permite leitura e escrita global para as configurações da rede de ensino

ALTER TABLE public.configuracao_rede ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access configuracao_rede" ON public.configuracao_rede;
DROP POLICY IF EXISTS "Permitir leitura configuracao_rede" ON public.configuracao_rede;
DROP POLICY IF EXISTS "Permitir insercao configuracao_rede" ON public.configuracao_rede;
DROP POLICY IF EXISTS "Permitir update configuracao_rede" ON public.configuracao_rede;
DROP POLICY IF EXISTS "Permitir delete configuracao_rede" ON public.configuracao_rede;

CREATE POLICY "Public full access configuracao_rede" 
ON public.configuracao_rede 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);
