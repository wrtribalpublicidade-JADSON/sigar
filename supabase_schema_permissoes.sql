-- ======================================================================================
-- TABELA DE PERMISSÕES POR PERFIL
-- Armazena as permissões de acesso de cada perfil de usuário a cada módulo do sistema.
-- ======================================================================================

CREATE TABLE IF NOT EXISTS public.permissoes_perfil (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perfil TEXT NOT NULL,           -- Ex: 'Coordenador Regional', 'Professor', 'Gestor Geral'
    modulo_id TEXT NOT NULL,        -- Ex: 'dashboard', 'escolas', 'indicadores'
    acesso TEXT NOT NULL DEFAULT 'full',  -- 'none', 'readonly', 'full'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(perfil, modulo_id)       -- Um perfil só pode ter uma entrada por módulo
);

-- Habilitar RLS
ALTER TABLE public.permissoes_perfil ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (qualquer usuário autenticado ou anon pode ler/escrever)
CREATE POLICY "allow_select_permissoes" ON public.permissoes_perfil FOR SELECT USING (true);
CREATE POLICY "allow_insert_permissoes" ON public.permissoes_perfil FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_permissoes" ON public.permissoes_perfil FOR UPDATE USING (true);
CREATE POLICY "allow_delete_permissoes" ON public.permissoes_perfil FOR DELETE USING (true);
