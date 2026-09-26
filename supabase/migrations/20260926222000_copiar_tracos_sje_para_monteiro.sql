-- Migração: Copiar traços (recipes) da empresa SJE para a empresa Monteiro
-- Data: 2026-09-26T22:20:00Z
-- Objetivo: Garantir que a empresa Monteiro utilize os mesmos traços/dosagens cadastrados na SJE,
-- preservando a integridade dos dados existentes sem afetar a SJE nem as cargas existentes.

DO $$
DECLARE
  v_empresa_sje uuid;
  v_empresa_monteiro uuid;
BEGIN
  -- 1. Obter IDs das empresas SJE e Monteiro
  SELECT id INTO v_empresa_sje FROM public.empresas WHERE slug = 'sje' LIMIT 1;
  SELECT id INTO v_empresa_monteiro FROM public.empresas WHERE slug = 'monteiro' LIMIT 1;

  -- Fallback para IDs padrão conhecidos se não localizados por slug
  IF v_empresa_sje IS NULL THEN
    v_empresa_sje := '22222222-2222-2222-2222-222222222222'::uuid;
  END IF;

  IF v_empresa_monteiro IS NULL THEN
    v_empresa_monteiro := '11111111-1111-1111-1111-111111111111'::uuid;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.empresas WHERE id = v_empresa_sje) OR
     NOT EXISTS (SELECT 1 FROM public.empresas WHERE id = v_empresa_monteiro) THEN
    RAISE NOTICE 'Empresa SJE ou Monteiro não encontrada no banco.';
    RETURN;
  END IF;

  -- 2. Copiar traços da SJE para Monteiro de forma idempotente
  -- Mapeamento direto de colunas: nome, descricao, fck_mpa, consumo_brita12, consumo_brita19,
  -- consumo_areia, consumo_po_pedra, consumo_cimento, consumo_aditivo, consumo_agua, ativo.
  -- Usando ON CONFLICT (empresa_id, nome) para não duplicar e atualizar dosagens caso já existam.
  INSERT INTO public.tracos (
    empresa_id,
    nome,
    descricao,
    fck_mpa,
    consumo_brita12,
    consumo_brita19,
    consumo_areia,
    consumo_po_pedra,
    consumo_cimento,
    consumo_aditivo,
    consumo_agua,
    ativo
  )
  SELECT
    v_empresa_monteiro,
    t.nome,
    t.descricao,
    t.fck_mpa,
    t.consumo_brita12,
    t.consumo_brita19,
    t.consumo_areia,
    t.consumo_po_pedra,
    t.consumo_cimento,
    t.consumo_aditivo,
    COALESCE(t.consumo_agua, 0),
    t.ativo
  FROM public.tracos t
  WHERE t.empresa_id = v_empresa_sje
  ON CONFLICT (empresa_id, nome) DO UPDATE SET
    descricao = EXCLUDED.descricao,
    fck_mpa = EXCLUDED.fck_mpa,
    consumo_brita12 = EXCLUDED.consumo_brita12,
    consumo_brita19 = EXCLUDED.consumo_brita19,
    consumo_areia = EXCLUDED.consumo_areia,
    consumo_po_pedra = EXCLUDED.consumo_po_pedra,
    consumo_cimento = EXCLUDED.consumo_cimento,
    consumo_aditivo = EXCLUDED.consumo_aditivo,
    consumo_agua = EXCLUDED.consumo_agua,
    ativo = EXCLUDED.ativo;

  RAISE NOTICE 'Traços copiados com sucesso da SJE para a Monteiro.';
END $$;
