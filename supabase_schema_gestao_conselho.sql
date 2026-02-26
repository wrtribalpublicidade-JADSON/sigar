-- ======================================================================================
-- SUPABASE SCHEMA - INSTRUMENTAIS DE GESTÃO E CONSELHO DE CLASSE
-- Este arquivo cria as tabelas e políticas RLS para persistir dados das duas sessões.
-- ======================================================================================

-- --------------------------------------------------------------------------------------
-- PARTE 1: INSTRUMENTAIS DE GESTÃO
-- (Ciclo de Reuniões, Plano de Formação, Plano de Ação, Proposta Pedagógica, Acompanhamento em Sala)
-- --------------------------------------------------------------------------------------

-- 1. Ciclo de Reuniões
CREATE TABLE IF NOT EXISTS public.ig_ciclo_reunioes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    escola_id UUID, -- Relacionamento com escola (se houver tabela de escolas)
    data_reuniao DATE NOT NULL,
    hora_inicio TIME,
    hora_fim TIME,
    tipo TEXT NOT NULL DEFAULT 'Pedagógica',
    pauta TEXT NOT NULL,
    local_reuniao TEXT,
    registro TEXT,
    encaminhamentos TEXT,
    status TEXT DEFAULT 'Agendada',
    responsavel TEXT,
    participantes JSONB DEFAULT '[]'::jsonb, -- Array de nomes (strings)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Plano de Formação
CREATE TABLE IF NOT EXISTS public.ig_plano_formacao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    escola_id UUID,
    especificacao TEXT NOT NULL,
    objetivo TEXT,
    data_formacao DATE,
    publico_alvo TEXT,
    responsavel TEXT,
    custo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Plano de Ação (Metas)
CREATE TABLE IF NOT EXISTS public.ig_plano_acao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    escola_id UUID,
    descricao TEXT NOT NULL,
    prazo DATE,
    status TEXT DEFAULT 'Não Iniciado',
    responsavel TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Proposta Pedagógica (PPP)
CREATE TABLE IF NOT EXISTS public.ig_proposta_pedagogica (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    escola_id UUID,
    arquivo TEXT NOT NULL, -- Nome do arquivo (ex: ppp-2024.pdf)
    arquivo_url TEXT, -- URL de acesso no Cloud Storage
    data_envio TIMESTAMP WITH TIME ZONE,
    usuario TEXT,
    coordenador_regional TEXT,
    status TEXT DEFAULT 'Aguardando Análise',
    tamanho_kb TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Acompanhamento em Sala
CREATE TABLE IF NOT EXISTS public.ig_acompanhamento_sala (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    escola_id UUID,
    professor_id TEXT, -- Ou UUID se houver tabela de professores (rh)
    professor_nome TEXT NOT NULL,
    etapa TEXT, -- Ex: Ensino Fundamental
    data_observacao DATE,
    status TEXT DEFAULT 'Não Iniciado', -- 'Concluído', 'Rascunho', 'Não Iniciado'
    detalhes_observacao JSONB, -- JSON para salvar estrutura dinâmica (pautas, pontos fortes, fracas)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- --------------------------------------------------------------------------------------
-- PARTE 2: CONSELHO DE CLASSE
-- (Reunião Estudantil, Avaliação Docente, Acompanhamento Docente, Encaminhamentos)
-- --------------------------------------------------------------------------------------

-- 6. Reunião Estudantil
CREATE TABLE IF NOT EXISTS public.cc_reuniao_estudantil (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    escola_id UUID,
    turma_id TEXT, -- Pode ser UUID dependendo do schema
    turma_nome TEXT,
    ano_letivo TEXT,
    periodo_letivo TEXT, -- Ex: 1º Bimestre
    pauta TEXT,
    auto_avaliacao JSONB, -- { "0": "E", "1": "B" ... }
    compromissos TEXT,
    outras_questoes TEXT,
    assinaturas JSONB, -- JSON dos estudantes e seus status de assinatura
    status TEXT DEFAULT 'Em Andamento',
    protocolo_envio TEXT, -- Ex: #2024-3B-7742
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Avaliação Docente / Conceitos do Aluno
CREATE TABLE IF NOT EXISTS public.cc_avaliacao_docente (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    escola_id UUID,
    turma_id TEXT,
    estudante_id TEXT,
    nome_estudante TEXT NOT NULL,
    periodo_letivo TEXT NOT NULL, -- Ex: '1º Bimestre' ou 'Resultado Consolidado'
    frequencia_conceito TEXT, -- 'I', 'R', 'B', 'E'
    participacao_conceito TEXT,
    material_conceito TEXT,
    atividades_conceito TEXT,
    comunicacao_conceito TEXT,
    pesquisa_conceito TEXT,
    conduta_conceito TEXT,
    notas_json JSONB, -- { "av1": 7, "av2": 8, "av3": 7.5, "rec": null }
    media_final NUMERIC(4,2), -- Ex: 7.50
    parecer_etapa TEXT, -- 'PLENO', 'REGULAR', 'BOM', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Acompanhamento Docente
CREATE TABLE IF NOT EXISTS public.cc_acompanhamento_docente (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    escola_id UUID,
    professor_nome TEXT NOT NULL,
    componente_curricular TEXT,
    turma TEXT,
    periodo_letivo TEXT,
    data_registro DATE,
    estudante_alvo TEXT,
    lider_turma TEXT,
    dificuldades TEXT,
    intervencao_sugerida TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Encaminhamentos e Intervenções
CREATE TABLE IF NOT EXISTS public.cc_encaminhamentos_intervencoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    escola_id UUID,
    estudante_nome TEXT NOT NULL,
    turma TEXT,
    tipo_encaminhamento TEXT DEFAULT 'Pedagógico', -- Pedagógico, Psicológico, etc.
    descricao TEXT,
    encaminhamento_realizado TEXT,
    data_registro DATE,
    periodo_letivo TEXT,
    status TEXT DEFAULT 'Pendente', -- Pendente, Em Andamento, Concluído
    responsavel TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- --------------------------------------------------------------------------------------
-- PARTE 3: POLÍTICAS DE SEGURANÇA (Row Level Security - RLS)
-- --------------------------------------------------------------------------------------
-- Habilitar RLS em todas as tabelas:
ALTER TABLE public.ig_ciclo_reunioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_plano_formacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_plano_acao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_proposta_pedagogica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_acompanhamento_sala ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cc_reuniao_estudantil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cc_avaliacao_docente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cc_acompanhamento_docente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cc_encaminhamentos_intervencoes ENABLE ROW LEVEL SECURITY;

-- Exemplo Básico de Políticas - Garantindo que somente usuários autenticados 
-- (professores, gestores, coordenadores) com conta válida possam acessar e alterar

do
$$
declare
  tabela text;
begin
  for tabela in 
    select tablename 
    from pg_tables 
    where schemaname = 'public' and 
          tablename in (
              'ig_ciclo_reunioes', 'ig_plano_formacao', 'ig_plano_acao', 
              'ig_proposta_pedagogica', 'ig_acompanhamento_sala',
              'cc_reuniao_estudantil', 'cc_avaliacao_docente', 
              'cc_acompanhamento_docente', 'cc_encaminhamentos_intervencoes'
          )
  loop
    execute format('CREATE POLICY "Permitir leitura para usuários autenticados" ON %I FOR SELECT USING (auth.role() = ''authenticated'');', tabela);
    execute format('CREATE POLICY "Permitir inserção para usuários autenticados" ON %I FOR INSERT WITH CHECK (auth.role() = ''authenticated'');', tabela);
    execute format('CREATE POLICY "Permitir atualização para usuários autenticados" ON %I FOR UPDATE USING (auth.role() = ''authenticated'');', tabela);
    execute format('CREATE POLICY "Permitir exclusão para usuários autenticados" ON %I FOR DELETE USING (auth.role() = ''authenticated'');', tabela);
  end loop;
end;
$$;
