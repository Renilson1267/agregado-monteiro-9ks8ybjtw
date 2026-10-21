-- Migration: 20261021163000_multiplas_compras_britas_e_cheque_por_compra.sql
-- Objetivo:
-- 1. Permitir que compras de britas ocorram MAIS DE UMA VEZ NO MÊS:
--    - Remover restrições únicas (empresa+tipo+competência / uq_controle_britas_compras_mes / uq_controle_britas_compras)
--    - Acrescentar colunas data (DATE), fornecedor (TEXT), observacao (TEXT)
--    - Tornar tipo_brita anulável se existir coluna
--    - Migrar compras existentes: preencher data = 1º dia da competência ('YYYY-MM-01'), fornecedor = 'Compra mensal'
-- 2. Em controle_britas_cheques:
--    - Acrescentar coluna compra_id UUID REFERENCES controle_britas_compras(id) ON DELETE CASCADE (nullable para preservar cheques legados)
--    - Criar índice para compra_id

DO $$
BEGIN
  -- 1. Remover constraints únicas antigas de controle_britas_compras se existirem
  ALTER TABLE public.controle_britas_compras DROP CONSTRAINT IF EXISTS uq_controle_britas_compras_mes;
  ALTER TABLE public.controle_britas_compras DROP CONSTRAINT IF EXISTS uq_controle_britas_compras;
  ALTER TABLE public.controle_britas_compras DROP CONSTRAINT IF EXISTS controle_britas_compras_empresa_id_competencia_key;

  -- Dropar índices únicos que possam existir com esses nomes
  DROP INDEX IF EXISTS public.uq_controle_britas_compras_mes;
  DROP INDEX IF EXISTS public.uq_controle_britas_compras;

  -- 2. Adicionar novas colunas em controle_britas_compras
  ALTER TABLE public.controle_britas_compras ADD COLUMN IF NOT EXISTS data DATE;
  ALTER TABLE public.controle_britas_compras ADD COLUMN IF NOT EXISTS fornecedor TEXT;
  ALTER TABLE public.controle_britas_compras ADD COLUMN IF NOT EXISTS observacao TEXT;

  -- Se porventura existir coluna tipo_brita, torna-la anulavel
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'controle_britas_compras'
      AND column_name = 'tipo_brita'
  ) THEN
    ALTER TABLE public.controle_britas_compras ALTER COLUMN tipo_brita DROP NOT NULL;
  END IF;

  -- 3. Migrar dados existentes de controle_britas_compras:
  -- Preencher data = 1º dia da competência, fornecedor = 'Compra mensal' (onde for nulo)
  UPDATE public.controle_britas_compras
  SET
    data = COALESCE(data, (competencia || '-01')::date),
    fornecedor = COALESCE(fornecedor, 'Compra mensal')
  WHERE data IS NULL OR fornecedor IS NULL;

  -- Default para novas compras caso não informado
  ALTER TABLE public.controle_britas_compras ALTER COLUMN data SET DEFAULT CURRENT_DATE;

  -- Criar índice comum (não-único) para consultas rápidas por empresa, competência e data
  CREATE INDEX IF NOT EXISTS idx_controle_britas_compras_emp_comp ON public.controle_britas_compras(empresa_id, competencia);
  CREATE INDEX IF NOT EXISTS idx_controle_britas_compras_data ON public.controle_britas_compras(data);

  -- 4. Em controle_britas_cheques, acrescentar compra_id uuid references controle_britas_compras (nullable)
  ALTER TABLE public.controle_britas_cheques
    ADD COLUMN IF NOT EXISTS compra_id UUID REFERENCES public.controle_britas_compras(id) ON DELETE CASCADE;

  CREATE INDEX IF NOT EXISTS idx_controle_britas_cheques_compra_id ON public.controle_britas_cheques(compra_id);

END $$;
