-- Add escola_id column
ALTER TABLE public.atividades_complementares ADD COLUMN IF NOT EXISTS escola_id UUID REFERENCES public.escolas(id);

-- Exact match update
UPDATE public.atividades_complementares ac
SET escola_id = e.id
FROM public.escolas e
WHERE ac.unidade_escolar = e.nome;

-- Fuzzy match update (common abbreviations)
UPDATE public.atividades_complementares ac
SET escola_id = e.id
FROM public.escolas e
WHERE ac.escola_id IS NULL
AND (
    UPPER(REPLACE(ac.unidade_escolar, '.', '')) = UPPER(REPLACE(e.nome, '.', ''))
    OR UPPER(REPLACE(ac.unidade_escolar, 'E.M.', 'E M')) = UPPER(e.nome)
    OR UPPER(REPLACE(e.nome, 'E.M.', 'E M')) = UPPER(ac.unidade_escolar)
);

-- Index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_atividades_complementares_escola_id ON public.atividades_complementares(escola_id);
