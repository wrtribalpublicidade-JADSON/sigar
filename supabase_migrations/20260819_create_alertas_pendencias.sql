-- Tabela para central de alertas de pendências
CREATE TABLE IF NOT EXISTS public.alertas_pendencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id TEXT,
    usuario_nome TEXT,
    usuario_perfil TEXT,
    usuario_email TEXT,
    tipo_pendencia TEXT NOT NULL,
    modulo TEXT NOT NULL,
    view_destino TEXT,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    entidade_id TEXT,
    escola_id TEXT,
    escola_nome TEXT,
    turma_id TEXT,
    turma_nome TEXT,
    componente TEXT,
    periodo TEXT,
    bimestre TEXT,
    etapa_ensino TEXT,
    data_identificacao TIMESTAMPTZ DEFAULT now(),
    prazo DATE,
    status TEXT DEFAULT 'PENDENTE',
    prioridade TEXT DEFAULT 'MEDIA',
    nivel_escalonamento INTEGER DEFAULT 0,
    gerado_por TEXT,
    gerado_em TIMESTAMPTZ,
    observacao_alerta TEXT,
    resolvido_em TIMESTAMPTZ,
    resolvido_por TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de histórico/timeline dos alertas
CREATE TABLE IF NOT EXISTS public.alertas_pendencias_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pendencia_id UUID REFERENCES public.alertas_pendencias(id) ON DELETE CASCADE,
    acao TEXT NOT NULL,
    descricao TEXT NOT NULL,
    usuario_id TEXT,
    executado_por TEXT,
    dados_extras JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de configurações da central de alertas
CREATE TABLE IF NOT EXISTS public.alertas_pendencias_configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prazo_padrao_dias INTEGER DEFAULT 5,
    dias_para_lembrete INTEGER DEFAULT 2,
    dias_para_escalonamento INTEGER DEFAULT 3,
    escalonar_para_perfil TEXT DEFAULT 'Coordenador Pedagógico',
    notificar_por_email BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de desempenho
CREATE INDEX IF NOT EXISTS idx_alertas_pendencias_usuario ON public.alertas_pendencias(usuario_id, status);
CREATE INDEX IF NOT EXISTS idx_alertas_pendencias_escola ON public.alertas_pendencias(escola_id, status);
CREATE INDEX IF NOT EXISTS idx_alertas_pendencias_tipo ON public.alertas_pendencias(tipo_pendencia, status);
CREATE INDEX IF NOT EXISTS idx_alertas_pendencias_status ON public.alertas_pendencias(status);
CREATE INDEX IF NOT EXISTS idx_alertas_pendencias_prazo ON public.alertas_pendencias(prazo);
CREATE INDEX IF NOT EXISTS idx_alertas_pendencias_historico_pendencia ON public.alertas_pendencias_historico(pendencia_id);

-- Habilitar RLS e criar políticas
ALTER TABLE public.alertas_pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_pendencias_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_pendencias_configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access alertas_pendencias" ON public.alertas_pendencias;
CREATE POLICY "Public full access alertas_pendencias" ON public.alertas_pendencias FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access alertas_pendencias_historico" ON public.alertas_pendencias_historico;
CREATE POLICY "Public full access alertas_pendencias_historico" ON public.alertas_pendencias_historico FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access alertas_pendencias_configuracoes" ON public.alertas_pendencias_configuracoes;
CREATE POLICY "Public full access alertas_pendencias_configuracoes" ON public.alertas_pendencias_configuracoes FOR ALL USING (true) WITH CHECK (true);
