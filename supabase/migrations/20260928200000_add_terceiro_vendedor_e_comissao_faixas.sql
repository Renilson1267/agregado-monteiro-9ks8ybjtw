-- Migration: criar flag eh_vendedor em folha_terceiros e tabela folha_comissao_faixas
-- Data: 2026-09-28

-- 1. Nova flag eh_vendedor em folha_terceiros (default false)
ALTER TABLE public.folha_terceiros
  ADD COLUMN IF NOT EXISTS eh_vendedor boolean NOT NULL DEFAULT false;

-- Marcar Márcio Luan como vendedor terceiro (Monteiro), Raimundo segue eh_vendedor = false
UPDATE public.folha_terceiros
SET eh_vendedor = true
WHERE nome ILIKE '%MARCIO LUAN%';

-- 2. Tabela para Faixas da Tabela Progressiva de Comissões por Empresa
CREATE TABLE IF NOT EXISTS public.folha_comissao_faixas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  de_valor numeric NOT NULL DEFAULT 0,
  ate_valor numeric NOT NULL DEFAULT 0,
  percentual numeric NOT NULL DEFAULT 0, -- Ex: 0.025 para 2.5% ou 2.5 dependendo do padrão da UI
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_folha_comissao_faixas_empresa
  ON public.folha_comissao_faixas (empresa_id);

-- RLS
ALTER TABLE public.folha_comissao_faixas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_folha_comissao_faixas" ON public.folha_comissao_faixas;
CREATE POLICY "anon_all_folha_comissao_faixas" ON public.folha_comissao_faixas
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);
