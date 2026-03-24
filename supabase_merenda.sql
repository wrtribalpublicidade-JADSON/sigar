-- EXECUTE ESSE SCRIPT INTEIRO NO MÓDULO SQL EDITOR DO SEU SUPABASE
-- Ele criará as tabelas, triggers e RLS necessários para a Merenda Escolar funcionar automaticamente.

-- 1. Criação das Tabelas
CREATE TABLE IF NOT EXISTS public.merenda_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    estoque_inicial NUMERIC NOT NULL DEFAULT 0,
    estoque_atual NUMERIC NOT NULL DEFAULT 0,
    estoque_ideal NUMERIC NOT NULL DEFAULT 100,
    unidade TEXT NOT NULL,
    ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.merenda_entradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.merenda_itens(id) ON DELETE CASCADE,
    data TIMESTAMPTZ DEFAULT NOW(),
    quantidade NUMERIC NOT NULL,
    origem TEXT NOT NULL, -- 'Licitação' or 'Agricultura Familiar'
    observacao TEXT,
    usuario_id UUID,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.merenda_entregas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID, -- Referência solta para não obrigar restrição externa dura, mas conecta à sua lista
    data TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'Entregue',
    observacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.merenda_entrega_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrega_id UUID NOT NULL REFERENCES public.merenda_entregas(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.merenda_itens(id) ON DELETE CASCADE,
    quantidade NUMERIC NOT NULL
);

-- 2. Gatilhos (Triggers) Inteligentes
-- A) Atualizar 'estoque_inicial' e 'estoque_atual' sempre que uma entrada for inserida
CREATE OR REPLACE FUNCTION trg_merenda_entrada_ai()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.merenda_itens
    SET 
        estoque_inicial = estoque_inicial + NEW.quantidade,
        estoque_atual = estoque_atual + NEW.quantidade,
        ultima_atualizacao = NOW()
    WHERE id = NEW.item_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_entrada_ai ON public.merenda_entradas;
CREATE TRIGGER trg_entrada_ai 
AFTER INSERT ON public.merenda_entradas
FOR EACH ROW EXECUTE FUNCTION trg_merenda_entrada_ai();

-- B) Excluir ou reverter entrada (Caso precise cancelar)
CREATE OR REPLACE FUNCTION trg_merenda_entrada_ad()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.merenda_itens
    SET 
        estoque_inicial = estoque_inicial - OLD.quantidade,
        estoque_atual = estoque_atual - OLD.quantidade,
        ultima_atualizacao = NOW()
    WHERE id = OLD.item_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_entrada_ad ON public.merenda_entradas;
CREATE TRIGGER trg_entrada_ad 
AFTER DELETE ON public.merenda_entradas
FOR EACH ROW EXECUTE FUNCTION trg_merenda_entrada_ad();

-- C) Atualizar 'estoque_atual' deduzindo a saída/entrega
CREATE OR REPLACE FUNCTION trg_merenda_saida_ai()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.merenda_itens
    SET 
        estoque_atual = estoque_atual - NEW.quantidade,
        ultima_atualizacao = NOW()
    WHERE id = NEW.item_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_saida_ai ON public.merenda_entrega_itens;
CREATE TRIGGER trg_saida_ai 
AFTER INSERT ON public.merenda_entrega_itens
FOR EACH ROW EXECUTE FUNCTION trg_merenda_saida_ai();

-- 3. Habilitar Segurança por Linha (RLS) - Permite leitura e acesso para todos (pois o app já controla interface auth)
ALTER TABLE public.merenda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merenda_entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merenda_entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merenda_entrega_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público merenda_itens" ON public.merenda_itens FOR ALL USING (true);
CREATE POLICY "Acesso público merenda_entradas" ON public.merenda_entradas FOR ALL USING (true);
CREATE POLICY "Acesso público merenda_entregas" ON public.merenda_entregas FOR ALL USING (true);
CREATE POLICY "Acesso público merenda_entrega_itens" ON public.merenda_entrega_itens FOR ALL USING (true);
