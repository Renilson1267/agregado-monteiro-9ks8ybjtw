-- Migração: Criação da tabela de metas de produção e correção dos saldos de aditivo
-- Versão 0.0.32

-- 1. Tabela de Metas de Produção por Empresa
CREATE TABLE IF NOT EXISTS public.metas_producao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  meta_diaria_m3 NUMERIC NOT NULL DEFAULT 50,
  meta_mensal_m3 NUMERIC NOT NULL DEFAULT 1000,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT metas_producao_empresa_id_unique UNIQUE (empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_metas_producao_empresa ON public.metas_producao(empresa_id);

ALTER TABLE public.metas_producao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_metas_producao" ON public.metas_producao;
CREATE POLICY "anon_all_metas_producao" ON public.metas_producao
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Seed de metas padrão para Monteiro e SJE caso não existam
INSERT INTO public.metas_producao (empresa_id, meta_diaria_m3, meta_mensal_m3, observacao)
VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 60, 1200, 'Meta padrão Monteiro'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 40, 800, 'Meta padrão SJE')
ON CONFLICT (empresa_id) DO NOTHING;

-- 2. Correção dos saldos de estoque de Aditivo e Cimento
DO $$
DECLARE
  v_empresa_monteiro UUID := '11111111-1111-1111-1111-111111111111'::uuid;
  v_empresa_sje UUID := '22222222-2222-2222-2222-222222222222'::uuid;

  v_mat_aditivo_monteiro UUID;
  v_mat_cimento_monteiro UUID;
  v_mat_aditivo_sje UUID;
  v_mat_cimento_sje UUID;

  v_saidas_aditivo_monteiro NUMERIC := 0;
  v_saidas_cimento_monteiro NUMERIC := 0;

  v_saidas_aditivo_sje NUMERIC := 0;
  v_saidas_cimento_sje NUMERIC := 0;
  v_entradas_aditivo_sje NUMERIC := 0;
  v_entradas_cimento_sje NUMERIC := 0;
BEGIN
  -- Identificar IDs dos materiais
  SELECT id INTO v_mat_aditivo_monteiro FROM public.materiais WHERE empresa_id = v_empresa_monteiro AND codigo = 'aditivo';
  SELECT id INTO v_mat_cimento_monteiro FROM public.materiais WHERE empresa_id = v_empresa_monteiro AND codigo = 'cimento';
  SELECT id INTO v_mat_aditivo_sje FROM public.materiais WHERE empresa_id = v_empresa_sje AND codigo = 'aditivo';
  SELECT id INTO v_mat_cimento_sje FROM public.materiais WHERE empresa_id = v_empresa_sje AND codigo = 'cimento';

  -- MONTEIRO:
  -- Saldo declarado na realidade: 3.049 L de aditivo e 46.988 kg de cimento.
  -- Calcular soma de saídas de cargas na Monteiro
  SELECT COALESCE(SUM(quantidade), 0) INTO v_saidas_aditivo_monteiro
  FROM public.movimentacoes_estoque
  WHERE empresa_id = v_empresa_monteiro AND material_id = v_mat_aditivo_monteiro AND tipo = 'SAIDA';

  SELECT COALESCE(SUM(quantidade), 0) INTO v_saidas_cimento_monteiro
  FROM public.movimentacoes_estoque
  WHERE empresa_id = v_empresa_monteiro AND material_id = v_mat_cimento_monteiro AND tipo = 'SAIDA';

  -- Ajustar o movimento de ABERTURA de aditivo na Monteiro para bater exatamente em 3.049 L
  IF v_mat_aditivo_monteiro IS NOT NULL THEN
    UPDATE public.movimentacoes_estoque
    SET quantidade = v_saidas_aditivo_monteiro + 3049,
        observacao = 'Suprimento e saldo inicial ajustado para saldo atual remanescente de 3.049 L'
    WHERE empresa_id = v_empresa_monteiro
      AND material_id = v_mat_aditivo_monteiro
      AND tipo = 'ABERTURA';

    IF NOT FOUND THEN
      INSERT INTO public.movimentacoes_estoque (
        empresa_id, material_id, tipo, quantidade, data, documento, observacao
      ) VALUES (
        v_empresa_monteiro, v_mat_aditivo_monteiro, 'ABERTURA', v_saidas_aditivo_monteiro + 3049, '2026-01-01', 'SALDO-INICIAL', 'Suprimento e saldo inicial ajustado para saldo atual remanescente de 3.049 L'
      );
    END IF;
  END IF;

  -- Ajustar o movimento de ABERTURA de cimento na Monteiro para bater exatamente em 46.988 kg
  IF v_mat_cimento_monteiro IS NOT NULL THEN
    UPDATE public.movimentacoes_estoque
    SET quantidade = v_saidas_cimento_monteiro + 46988,
        observacao = 'Suprimento e saldo inicial ajustado para saldo atual remanescente de 46.988 kg'
    WHERE empresa_id = v_empresa_monteiro
      AND material_id = v_mat_cimento_monteiro
      AND tipo = 'ABERTURA';
  END IF;

  -- SJE:
  -- Na planilha Controle_Insumos_SJE, o saldo ao final das 114 cargas é 3.018 L de aditivo e 4.326 kg de cimento.
  -- Cargas posteriores (115 a 124) lançadas no sistema também deram baixa de estoque.
  -- Saldo final atual deve ser: Saldo das 114 cargas (3.018 L) - saídas das cargas > 114.
  -- Ou seja, ABERTURA (2.183 L) + ENTRADAS (3.000 L) - SAÍDAS (2.462,54 L) = 2.720,46 L.
  -- Caso a abertura inicial da SJE deva refletir o saldo inicial da planilha antes das saídas (2.183 L) + entradas (3.000 L),
  -- garantimos que a ABERTURA e ENTRADAS existam de forma única e limpa.
  IF v_mat_aditivo_sje IS NOT NULL THEN
    -- Garantir que não há duplicidade de abertura
    DELETE FROM public.movimentacoes_estoque
    WHERE empresa_id = v_empresa_sje
      AND material_id = v_mat_aditivo_sje
      AND tipo = 'ABERTURA'
      AND id NOT IN (
        SELECT id FROM public.movimentacoes_estoque
        WHERE empresa_id = v_empresa_sje AND material_id = v_mat_aditivo_sje AND tipo = 'ABERTURA'
        ORDER BY created_at ASC LIMIT 1
      );
  END IF;

END $$;
