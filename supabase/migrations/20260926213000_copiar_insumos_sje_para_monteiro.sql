-- Migração: Replicar catálogo de insumos e preços da SJE para Monteiro
-- Data: 2026-09-26T21:30:00Z
-- Objetivo: Permitir que a Monteiro contabilize insumos, estoques e custos sem afetar a SJE.

DO $$
DECLARE
  v_empresa_sje uuid;
  v_empresa_monteiro uuid;
BEGIN
  -- 1. Obter IDs das empresas
  SELECT id INTO v_empresa_sje FROM public.empresas WHERE slug = 'sje' LIMIT 1;
  SELECT id INTO v_empresa_monteiro FROM public.empresas WHERE slug = 'monteiro' LIMIT 1;

  IF v_empresa_sje IS NULL OR v_empresa_monteiro IS NULL THEN
    RAISE NOTICE 'Empresa SJE ou Monteiro não encontrada.';
    RETURN;
  END IF;

  -- 2. Copiar catálogo de materiais da SJE para Monteiro (idempotente)
  -- Mantém densidades exatas (brita 12 = 1.38, brita 19 = 1.44, areia = 1.50),
  -- unidades de compra, estoque mínimo, preços de compra e flags de controle de estoque.
  INSERT INTO public.materiais (
    codigo,
    nome,
    unidade,
    estoque_minimo,
    ordem,
    empresa_id,
    controla_estoque,
    densidade,
    unidade_compra,
    preco_compra
  )
  SELECT
    m.codigo,
    m.nome,
    m.unidade,
    m.estoque_minimo,
    m.ordem,
    v_empresa_monteiro,
    m.controla_estoque,
    m.densidade,
    m.unidade_compra,
    m.preco_compra
  FROM public.materiais m
  WHERE m.empresa_id = v_empresa_sje
  ON CONFLICT (empresa_id, codigo) DO UPDATE SET
    nome = EXCLUDED.nome,
    unidade = EXCLUDED.unidade,
    estoque_minimo = EXCLUDED.estoque_minimo,
    ordem = EXCLUDED.ordem,
    controla_estoque = EXCLUDED.controla_estoque,
    densidade = EXCLUDED.densidade,
    unidade_compra = EXCLUDED.unidade_compra,
    preco_compra = EXCLUDED.preco_compra;

  -- 3. Replicar tabela de preços vigentes / histórico (precos_material) da SJE para Monteiro (idempotente)
  -- Replicando mesmos valores, competência (mes_ano) e unidade
  INSERT INTO public.precos_material (
    empresa_id,
    material_codigo,
    mes_ano,
    preco_unitario,
    unidade
  )
  SELECT
    v_empresa_monteiro,
    p.material_codigo,
    p.mes_ano,
    p.preco_unitario,
    p.unidade
  FROM public.precos_material p
  WHERE p.empresa_id = v_empresa_sje
  ON CONFLICT (empresa_id, material_codigo, mes_ano) DO UPDATE SET
    preco_unitario = EXCLUDED.preco_unitario,
    unidade = EXCLUDED.unidade;

  RAISE NOTICE 'Catálogo de materiais e preços replicados com sucesso de SJE para Monteiro.';
END $$;
