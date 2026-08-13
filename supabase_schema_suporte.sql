-- ======================================================================================
-- TABELA DE CHAMADOS DE SUPORTE TÉCNICO
-- Gerencia as solicitações de suporte enviadas pelos usuários ao Administrador do SIGAR
-- ======================================================================================

CREATE TABLE IF NOT EXISTS public.suporte_chamados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    protocolo TEXT UNIQUE NOT NULL,
    usuario_id TEXT,
    usuario_nome TEXT NOT NULL,
    usuario_email TEXT NOT NULL,
    usuario_funcao TEXT,
    usuario_contato TEXT,
    escola_id TEXT,
    escola_nome TEXT,
    categoria TEXT NOT NULL DEFAULT 'Dúvidas de Uso',
    prioridade TEXT NOT NULL DEFAULT 'Média',
    assunto TEXT NOT NULL,
    descricao TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aberto',
    atendente_nome TEXT,
    resposta_admin TEXT,
    mensagens JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolvido_em TIMESTAMP WITH TIME ZONE
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_suporte_chamados_email ON public.suporte_chamados(usuario_email);
CREATE INDEX IF NOT EXISTS idx_suporte_chamados_status ON public.suporte_chamados(status);
CREATE INDEX IF NOT EXISTS idx_suporte_chamados_created_at ON public.suporte_chamados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suporte_chamados_protocolo ON public.suporte_chamados(protocolo);

-- Habilitar RLS
ALTER TABLE public.suporte_chamados ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso permissivas
DROP POLICY IF EXISTS "allow_select_suporte_chamados" ON public.suporte_chamados;
DROP POLICY IF EXISTS "allow_insert_suporte_chamados" ON public.suporte_chamados;
DROP POLICY IF EXISTS "allow_update_suporte_chamados" ON public.suporte_chamados;
DROP POLICY IF EXISTS "allow_delete_suporte_chamados" ON public.suporte_chamados;

CREATE POLICY "allow_select_suporte_chamados" ON public.suporte_chamados FOR SELECT USING (true);
CREATE POLICY "allow_insert_suporte_chamados" ON public.suporte_chamados FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_suporte_chamados" ON public.suporte_chamados FOR UPDATE USING (true);
CREATE POLICY "allow_delete_suporte_chamados" ON public.suporte_chamados FOR DELETE USING (true);
