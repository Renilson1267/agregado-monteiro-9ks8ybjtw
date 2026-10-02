-- Migration: 20261002004500_excluir_recibos_4337_4338_e_estornar_estoque_sje.sql
-- Descrição: Excluir recibos/OS 4337 e 4338 e carga vinculada na SJE,
-- preservando a numeração sequencial (mínimo 4339 para próximas OSs na SJE) e
-- estornando o estoque para que cimento fique em 41.696,00 kg e aditivo em 245,00 L.

-- 1. Desabilitar temporariamente a trigger que impede exclusão de OS
ALTER TABLE public.ordens_servico DISABLE TRIGGER trg_impedir_exclusao_os;

DO $$
DECLARE
  v_empresa_sje uuid := '22222222-2222-2222-2222-222222222222'::uuid;
  v_mat_cimento uuid;
  v_mat_aditivo uuid;

  v_saldo_cimento_atual numeric := 0;
  v_saldo_aditivo_atual numeric := 0;
  v_ajuste_cimento numeric := 0;
  v_ajuste_aditivo numeric := 0;
BEGIN
  -- Identificar materiais de Cimento e Aditivo na SJE
  SELECT id INTO v_mat_cimento
  FROM public.materiais
  WHERE empresa_id = v_empresa_sje AND codigo = 'cimento';

  SELECT id INTO v_mat_aditivo
  FROM public.materiais
  WHERE empresa_id = v_empresa_sje AND codigo = 'aditivo';

  -- a. Excluir movimentações vinculadas à carga cc834744-cf0a-4677-9f6e-553732effc69 ou com documento CARGA-16190
  DELETE FROM public.movimentacoes_estoque
  WHERE carga_id = 'cc834744-cf0a-4677-9f6e-553732effc69'::uuid
     OR (empresa_id = v_empresa_sje AND documento IN ('CARGA-16190', 'CARGA-00115', 'CARGA-115') AND (observacao ILIKE '%4337%' OR observacao ILIKE '%4338%' OR observacao ILIKE '%8m³%' OR observacao ILIKE '%16190%'));

  -- b. Desvincular e Excluir as Ordens de Serviço nº 4337 e 4338 da SJE (e pelos IDs informados se existirem)
  DELETE FROM public.ordens_servico
  WHERE (empresa_id = v_empresa_sje AND numero_os IN (4337, 4338))
     OR id IN ('061d4a02-5ee3-4632-bdfe-aeb2bfd519b5'::uuid, 'a93b4832-6a6c-48ae-94a2-11c5f32ebf07'::uuid, '6fcf09aa-2172-47ac-ad55-bea7bc1f9101'::uuid, '22f3416d-8db6-43ef-a68f-e6c1145b4e30'::uuid);

  -- c. Excluir a Carga cc834744-cf0a-4677-9f6e-553732effc69 ou nº 16190 na SJE
  DELETE FROM public.cargas
  WHERE id = 'cc834744-cf0a-4677-9f6e-553732effc69'::uuid
     OR (empresa_id = v_empresa_sje AND (numero_carga = 16190 OR observacao ILIKE '%OS 4337%' OR observacao ILIKE '%OS 4338%'));

  -- d. Calcular o saldo de cimento e aditivo após a exclusão das saídas da carga
  IF v_mat_cimento IS NOT NULL THEN
    SELECT COALESCE(SUM(CASE WHEN tipo IN ('ENTRADA', 'ABERTURA') THEN quantidade WHEN tipo = 'SAIDA' THEN -quantidade ELSE 0 END), 0)
    INTO v_saldo_cimento_atual
    FROM public.movimentacoes_estoque
    WHERE empresa_id = v_empresa_sje AND material_id = v_mat_cimento;

    -- Alvo: 41.696,00 kg de cimento
    v_ajuste_cimento := 41696.00 - v_saldo_cimento_atual;

    IF v_ajuste_cimento <> 0 THEN
      INSERT INTO public.movimentacoes_estoque (
        empresa_id,
        material_id,
        tipo,
        quantidade,
        data,
        documento,
        observacao
      ) VALUES (
        v_empresa_sje,
        v_mat_cimento,
        CASE WHEN v_ajuste_cimento > 0 THEN 'ENTRADA' ELSE 'SAIDA' END,
        ABS(v_ajuste_cimento),
        '2026-09-25',
        'ESTORNO-OS-4337-4338',
        'Estorno / devolução de estoque ref. exclusão de Recibos 4337/4338 e Carga 16190'
      );
    END IF;
  END IF;

  IF v_mat_aditivo IS NOT NULL THEN
    SELECT COALESCE(SUM(CASE WHEN tipo IN ('ENTRADA', 'ABERTURA') THEN quantidade WHEN tipo = 'SAIDA' THEN -quantidade ELSE 0 END), 0)
    INTO v_saldo_aditivo_atual
    FROM public.movimentacoes_estoque
    WHERE empresa_id = v_empresa_sje AND material_id = v_mat_aditivo;

    -- Alvo: 245,00 L de aditivo
    v_ajuste_aditivo := 245.00 - v_saldo_aditivo_atual;

    IF v_ajuste_aditivo <> 0 THEN
      INSERT INTO public.movimentacoes_estoque (
        empresa_id,
        material_id,
        tipo,
        quantidade,
        data,
        documento,
        observacao
      ) VALUES (
        v_empresa_sje,
        v_mat_aditivo,
        CASE WHEN v_ajuste_aditivo > 0 THEN 'ENTRADA' ELSE 'SAIDA' END,
        ABS(v_ajuste_aditivo),
        '2026-09-25',
        'ESTORNO-OS-4337-4338',
        'Estorno / devolução de estoque ref. exclusão de Recibos 4337/4338 e Carga 16190'
      );
    END IF;
  END IF;

END $$;

-- 2. Reabilitar a trigger trg_impedir_exclusao_os
ALTER TABLE public.ordens_servico ENABLE TRIGGER trg_impedir_exclusao_os;

-- 3. Atualizar função proximo_numero_os para preservar o sequencial
-- Garantir que para a empresa SJE a próxima numeração não volte para 4337 ou 4338,
-- gerando a partir de 4339 (ou do maior número já emitido).
CREATE OR REPLACE FUNCTION public.proximo_numero_os(
  p_empresa_id text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_prox integer;
  v_emp_uuid uuid;
BEGIN
  IF p_empresa_id IS NULL OR trim(p_empresa_id) = '' THEN
    SELECT GREATEST(COALESCE(MAX(numero_os), 4336) + 1, 4339)
    INTO v_prox
    FROM public.ordens_servico;
    RETURN v_prox;
  END IF;

  v_emp_uuid := p_empresa_id::uuid;

  -- Se for a empresa SJE, não reutilizar 4337 e 4338; próximo deve ser no mínimo 4339
  IF v_emp_uuid = '22222222-2222-2222-2222-222222222222'::uuid THEN
    SELECT GREATEST(COALESCE(MAX(numero_os), 4338) + 1, 4339)
    INTO v_prox
    FROM public.ordens_servico
    WHERE empresa_id = v_emp_uuid;
  ELSE
    SELECT COALESCE(MAX(numero_os), 4336) + 1
    INTO v_prox
    FROM public.ordens_servico
    WHERE empresa_id = v_emp_uuid;
  END IF;

  RETURN v_prox;
END;
$$;

GRANT EXECUTE ON FUNCTION public.proximo_numero_os(text) TO authenticated, anon;
