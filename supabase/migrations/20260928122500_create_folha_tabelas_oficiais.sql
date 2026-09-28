-- Migration: Criar tabela folha_tabelas_oficiais e adicionar colunas na folha
-- Data: 2026-09-28

-- 1. Colunas extras em folha_competencias
ALTER TABLE public.folha_competencias
  ADD COLUMN IF NOT EXISTS data_competencia date,
  ADD COLUMN IF NOT EXISTS percentual_quinzena numeric NOT NULL DEFAULT 0.40;

-- 2. Colunas extras em folha_pagamento_linhas
ALTER TABLE public.folha_pagamento_linhas
  ADD COLUMN IF NOT EXISTS feriado numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observacao_linha text;

-- 3. Tabela folha_tabelas_oficiais
CREATE TABLE IF NOT EXISTS public.folha_tabelas_oficiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano integer NOT NULL DEFAULT 2026,
  descricao text NOT NULL DEFAULT 'Tabela Oficial 2026',
  salario_minimo numeric NOT NULL DEFAULT 1621.00,
  teto_inss numeric NOT NULL DEFAULT 8475.55,
  familia_cota_por_filho numeric NOT NULL DEFAULT 67.54,
  familia_teto_salario numeric NOT NULL DEFAULT 1980.38,
  ir_isento_ate numeric NOT NULL DEFAULT 5000.00,
  ir_desconto_gradual_ate numeric NOT NULL DEFAULT 7350.00,
  ir_parcela_fixa_reducao numeric NOT NULL DEFAULT 978.62,
  ir_coeficiente_reducao numeric NOT NULL DEFAULT 0.133145,
  inss_faixas jsonb NOT NULL DEFAULT '[
    {"de": 0, "ate": 1621.00, "aliquota": 0.075, "deducao": 0},
    {"de": 1621.01, "ate": 2902.84, "aliquota": 0.09, "deducao": 24.32},
    {"de": 2902.85, "ate": 4354.27, "aliquota": 0.12, "deducao": 111.40},
    {"de": 4354.28, "ate": 8475.55, "aliquota": 0.14, "deducao": 198.49}
  ]'::jsonb,
  irrf_faixas jsonb NOT NULL DEFAULT '[
    {"de": 0, "ate": 2428.80, "aliquota": 0.00, "deducao": 0},
    {"de": 2428.81, "ate": 2826.65, "aliquota": 0.075, "deducao": 182.16},
    {"de": 2826.66, "ate": 3751.05, "aliquota": 0.15, "deducao": 394.16},
    {"de": 3751.06, "ate": 4664.68, "aliquota": 0.225, "deducao": 675.49},
    {"de": 4664.69, "ate": 999999999, "aliquota": 0.275, "deducao": 908.73}
  ]'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índice único por empresa_id e ano (tratando NULL empresa_id com índice parcial se necessário, ou tabela por empresa)
CREATE UNIQUE INDEX IF NOT EXISTS idx_folha_tabelas_empresa_ano
  ON public.folha_tabelas_oficiais (empresa_id, ano);

-- RLS policies para folha_tabelas_oficiais
ALTER TABLE public.folha_tabelas_oficiais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_folha_tabelas_oficiais" ON public.folha_tabelas_oficiais;
CREATE POLICY "anon_all_folha_tabelas_oficiais" ON public.folha_tabelas_oficiais
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- Seed das tabelas oficiais 2026 para as duas empresas (SJE e Monteiro)
DO $$
DECLARE
  v_sje_id uuid := '22222222-2222-2222-2222-222222222222'::uuid;
  v_monteiro_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.empresas WHERE id = v_sje_id) THEN
    INSERT INTO public.folha_tabelas_oficiais (
      empresa_id, ano, descricao, salario_minimo, teto_inss,
      familia_cota_por_filho, familia_teto_salario,
      ir_isento_ate, ir_desconto_gradual_ate, ir_parcela_fixa_reducao, ir_coeficiente_reducao,
      inss_faixas, irrf_faixas
    ) VALUES (
      v_sje_id, 2026, 'Tabelas Oficiais 2026 (Portaria MPS/MF 13/2026 + Lei 15.270/2025)',
      1621.00, 8475.55, 67.54, 1980.38,
      5000.00, 7350.00, 978.62, 0.133145,
      '[
        {"de": 0, "ate": 1621.00, "aliquota": 0.075, "deducao": 0},
        {"de": 1621.01, "ate": 2902.84, "aliquota": 0.09, "deducao": 24.32},
        {"de": 2902.85, "ate": 4354.27, "aliquota": 0.12, "deducao": 111.40},
        {"de": 4354.28, "ate": 8475.55, "aliquota": 0.14, "deducao": 198.49}
      ]'::jsonb,
      '[
        {"de": 0, "ate": 2428.80, "aliquota": 0.00, "deducao": 0},
        {"de": 2428.81, "ate": 2826.65, "aliquota": 0.075, "deducao": 182.16},
        {"de": 2826.66, "ate": 3751.05, "aliquota": 0.15, "deducao": 394.16},
        {"de": 3751.06, "ate": 4664.68, "aliquota": 0.225, "deducao": 675.49},
        {"de": 4664.69, "ate": 999999999, "aliquota": 0.275, "deducao": 908.73}
      ]'::jsonb
    ) ON CONFLICT (empresa_id, ano) DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM public.empresas WHERE id = v_monteiro_id) THEN
    INSERT INTO public.folha_tabelas_oficiais (
      empresa_id, ano, descricao, salario_minimo, teto_inss,
      familia_cota_por_filho, familia_teto_salario,
      ir_isento_ate, ir_desconto_gradual_ate, ir_parcela_fixa_reducao, ir_coeficiente_reducao,
      inss_faixas, irrf_faixas
    ) VALUES (
      v_monteiro_id, 2026, 'Tabelas Oficiais 2026 (Portaria MPS/MF 13/2026 + Lei 15.270/2025)',
      1621.00, 8475.55, 67.54, 1980.38,
      5000.00, 7350.00, 978.62, 0.133145,
      '[
        {"de": 0, "ate": 1621.00, "aliquota": 0.075, "deducao": 0},
        {"de": 1621.01, "ate": 2902.84, "aliquota": 0.09, "deducao": 24.32},
        {"de": 2902.85, "ate": 4354.27, "aliquota": 0.12, "deducao": 111.40},
        {"de": 4354.28, "ate": 8475.55, "aliquota": 0.14, "deducao": 198.49}
      ]'::jsonb,
      '[
        {"de": 0, "ate": 2428.80, "aliquota": 0.00, "deducao": 0},
        {"de": 2428.81, "ate": 2826.65, "aliquota": 0.075, "deducao": 182.16},
        {"de": 2826.66, "ate": 3751.05, "aliquota": 0.15, "deducao": 394.16},
        {"de": 3751.06, "ate": 4664.68, "aliquota": 0.225, "deducao": 675.49},
        {"de": 4664.69, "ate": 999999999, "aliquota": 0.275, "deducao": 908.73}
      ]'::jsonb
    ) ON CONFLICT (empresa_id, ano) DO NOTHING;
  END IF;
END $$;
