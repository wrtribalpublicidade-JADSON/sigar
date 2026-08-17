-- ======================================================================================
-- MIGRAÇÃO: ADICIONAR COLUNAS DE ANEXO DE IMAGEM / PRINT NA TABELA SUPORTE_CHAMADOS
-- ======================================================================================

ALTER TABLE public.suporte_chamados 
ADD COLUMN IF NOT EXISTS anexo_url TEXT,
ADD COLUMN IF NOT EXISTS anexo_nome TEXT;

-- Comentários das colunas
COMMENT ON COLUMN public.suporte_chamados.anexo_url IS 'URL ou dados base64 da imagem/print de erro anexada ao chamado';
COMMENT ON COLUMN public.suporte_chamados.anexo_nome IS 'Nome original do arquivo de imagem anexado';
