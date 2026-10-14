-- Migration para controle de silos de cimento e tanques de aditivo separados por unidade (exclusivo Patos)
-- Idempotente e segura

-- 1. Colunas opcionais nas tabelas cargas e movimentacoes_estoque
ALTER TABLE public.cargas ADD COLUMN IF NOT EXISTS silo_cimento TEXT;
ALTER TABLE public.cargas ADD COLUMN IF NOT EXISTS tanque_aditivo TEXT;

ALTER TABLE public.movimentacoes_estoque ADD COLUMN IF NOT EXISTS recipiente_id UUID;
ALTER TABLE public.movimentacoes_estoque ADD COLUMN IF NOT EXISTS recipiente_nome TEXT;

-- 2. Tabela recipientes_estoque
CREATE TABLE IF NOT EXISTS public.recipientes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  material_codigo TEXT NOT NULL,
  material_nome TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'SILO' ou 'TANQUE'
  identificador TEXT NOT NULL, -- 'silo_1', 'silo_2', 'tanque_1', 'tanque_2'
  unidade TEXT NOT NULL DEFAULT 'kg',
  saldo_atual NUMERIC NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_recipiente_empresa_identificador UNIQUE (empresa_id, identificador)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_recipientes_empresa_id ON public.recipientes_estoque(empresa_id);

-- RLS
ALTER TABLE public.recipientes_estoque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipientes_select" ON public.recipientes_estoque;
CREATE POLICY "recipientes_select" ON public.recipientes_estoque FOR SELECT USING (true);

DROP POLICY IF EXISTS "recipientes_insert" ON public.recipientes_estoque;
CREATE POLICY "recipientes_insert" ON public.recipientes_estoque FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "recipientes_update" ON public.recipientes_estoque;
CREATE POLICY "recipientes_update" ON public.recipientes_estoque FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "recipientes_delete" ON public.recipientes_estoque;
CREATE POLICY "recipientes_delete" ON public.recipientes_estoque FOR DELETE USING (true);

-- Seed recipientes de Patos caso não existam
DO $$
DECLARE
  v_empresa_patos UUID;
  v_mat_cimento UUID;
  v_mat_aditivo UUID;
BEGIN
  SELECT id INTO v_empresa_patos FROM public.empresas WHERE slug = 'patos' OR nome ILIKE '%Patos%' LIMIT 1;
  
  IF v_empresa_patos IS NOT NULL THEN
    SELECT id INTO v_mat_cimento FROM public.materiais WHERE empresa_id = v_empresa_patos AND codigo = 'cimento' LIMIT 1;
    SELECT id INTO v_mat_aditivo FROM public.materiais WHERE empresa_id = v_empresa_patos AND codigo = 'aditivo' LIMIT 1;

    IF v_mat_cimento IS NOT NULL THEN
      INSERT INTO public.recipientes_estoque (empresa_id, material_id, material_codigo, material_nome, nome, tipo, identificador, unidade, saldo_atual, estoque_minimo, ordem)
      VALUES
        (v_empresa_patos, v_mat_cimento, 'cimento', 'Cimento CP II F 40', 'Silo 1', 'SILO', 'silo_1', 'kg', 0, 15000, 1),
        (v_empresa_patos, v_mat_cimento, 'cimento', 'Cimento CP II F 40', 'Silo 2', 'SILO', 'silo_2', 'kg', 0, 15000, 2)
      ON CONFLICT (empresa_id, identificador) DO NOTHING;
    END IF;

    IF v_mat_aditivo IS NOT NULL THEN
      INSERT INTO public.recipientes_estoque (empresa_id, material_id, material_codigo, material_nome, nome, tipo, identificador, unidade, saldo_atual, estoque_minimo, ordem)
      VALUES
        (v_empresa_patos, v_mat_aditivo, 'aditivo', 'Aditivo Plastificante', 'Tanque 1', 'TANQUE', 'tanque_1', 'L', 0, 900, 1),
        (v_empresa_patos, v_mat_aditivo, 'aditivo', 'Aditivo Plastificante', 'Tanque 2', 'TANQUE', 'tanque_2', 'L', 0, 900, 2)
      ON CONFLICT (empresa_id, identificador) DO NOTHING;
    END IF;
  END IF;
END $$;
