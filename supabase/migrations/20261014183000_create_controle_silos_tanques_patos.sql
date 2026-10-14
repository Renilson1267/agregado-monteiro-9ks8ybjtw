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
  material_id UUID REFERENCES public.materiais(id) ON DELETE SET NULL,
  material_codigo TEXT NOT NULL, -- 'cimento' ou 'aditivo'
  material_nome TEXT NOT NULL,
  nome TEXT NOT NULL, -- 'Silo de Cimento 1', 'Silo de Cimento 2', 'Tanque de Aditivo 1', 'Tanque de Aditivo 2'
  tipo TEXT NOT NULL, -- 'silo' ou 'tanque'
  identificador TEXT NOT NULL, -- 'silo_1', 'silo_2', 'tanque_1', 'tanque_2'
  unidade TEXT NOT NULL, -- 'kg' ou 'litros'
  saldo_atual NUMERIC NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC NOT NULL DEFAULT 0,
  ordem INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_recipiente_empresa_identificador UNIQUE (empresa_id, identificador)
);

-- RLS para recipientes_estoque
ALTER TABLE public.recipientes_estoque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipientes_select" ON public.recipientes_estoque;
CREATE POLICY "recipientes_select" ON public.recipientes_estoque
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "recipientes_insert" ON public.recipientes_estoque;
CREATE POLICY "recipientes_insert" ON public.recipientes_estoque
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "recipientes_update" ON public.recipientes_estoque;
CREATE POLICY "recipientes_update" ON public.recipientes_estoque
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "recipientes_delete" ON public.recipientes_estoque;
CREATE POLICY "recipientes_delete" ON public.recipientes_estoque
  FOR DELETE TO authenticated USING (true);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_recipientes_empresa_id ON public.recipientes_estoque(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_recipiente_id ON public.movimentacoes_estoque(recipiente_id);

-- 3. Seed dos 4 recipientes da unidade PATOS
DO $$
DECLARE
  v_patos_id UUID := '2da7537f-9f91-42b9-8020-f53c8fb52ec7'::UUID;
  v_mat_cimento_id UUID;
  v_mat_aditivo_id UUID;
  v_saldo_cimento NUMERIC := 0;
  v_saldo_aditivo NUMERIC := 0;
  v_min_cimento NUMERIC := 15000;
  v_min_aditivo NUMERIC := 900;
BEGIN
  -- Buscar IDs dos materiais de Patos
  SELECT id, COALESCE(estoque_minimo, 15000) INTO v_mat_cimento_id, v_min_cimento
  FROM public.materiais
  WHERE empresa_id = v_patos_id AND codigo = 'cimento'
  LIMIT 1;

  SELECT id, COALESCE(estoque_minimo, 900) INTO v_mat_aditivo_id, v_min_aditivo
  FROM public.materiais
  WHERE empresa_id = v_patos_id AND codigo = 'aditivo'
  LIMIT 1;

  -- Calcular saldos atuais consolidados de Patos (se houver)
  SELECT COALESCE(SUM(
    CASE WHEN tipo IN ('ENTRADA', 'ABERTURA') THEN quantidade ELSE -quantidade END
  ), 0) INTO v_saldo_cimento
  FROM public.movimentacoes_estoque
  WHERE empresa_id = v_patos_id AND material_id = v_mat_cimento_id;

  SELECT COALESCE(SUM(
    CASE WHEN tipo IN ('ENTRADA', 'ABERTURA') THEN quantidade ELSE -quantidade END
  ), 0) INTO v_saldo_aditivo
  FROM public.movimentacoes_estoque
  WHERE empresa_id = v_patos_id AND material_id = v_mat_aditivo_id;

  -- Inserir os 4 recipientes para Patos caso ainda não existam.
  -- Todo o saldo atual existente é alocado inicialmente no Silo 1 / Tanque 1 (podendo ser editado pelo lápis a qualquer momento)
  INSERT INTO public.recipientes_estoque (
    empresa_id, material_id, material_codigo, material_nome, nome, tipo, identificador, unidade, saldo_atual, estoque_minimo, ordem
  ) VALUES
  (
    v_patos_id,
    v_mat_cimento_id,
    'cimento',
    'CP II F-40 / CP V ARI',
    'Silo de Cimento 1',
    'silo',
    'silo_1',
    'kg',
    COALESCE(v_saldo_cimento, 0),
    ROUND(COALESCE(v_min_cimento, 15000) / 2),
    1
  ),
  (
    v_patos_id,
    v_mat_cimento_id,
    'cimento',
    'CP II F-40 / CP V ARI',
    'Silo de Cimento 2',
    'silo',
    'silo_2',
    'kg',
    0,
    ROUND(COALESCE(v_min_cimento, 15000) / 2),
    2
  ),
  (
    v_patos_id,
    v_mat_aditivo_id,
    'aditivo',
    'Aditivo Plastificante',
    'Tanque de Aditivo 1',
    'tanque',
    'tanque_1',
    'litros',
    COALESCE(v_saldo_aditivo, 0),
    ROUND(COALESCE(v_min_aditivo, 900) / 2),
    3
  ),
  (
    v_patos_id,
    v_mat_aditivo_id,
    'aditivo',
    'Aditivo Plastificante',
    'Tanque de Aditivo 2',
    'tanque',
    'tanque_2',
    'litros',
    0,
    ROUND(COALESCE(v_min_aditivo, 900) / 2),
    4
  )
  ON CONFLICT (empresa_id, identificador) DO NOTHING;
END $$;
