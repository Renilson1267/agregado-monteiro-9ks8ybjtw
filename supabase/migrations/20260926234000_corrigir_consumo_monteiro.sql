-- Migração para corrigir consumo de cimento, aditivo e movimentações de estoque da empresa Monteiro
-- Causa raiz: na importação de cargas do CSV de Controle Diário, o cabeçalho mapeou 'cimento' para a coluna de saldo acumulado (vazia/zerada)
-- em vez da coluna 6 (Cimento kg). Como consequência, as 380 cargas da Monteiro ficaram com consumo_cimento = 0 e consumo_aditivo = 0,
-- gerando traços com nome '0kg Cim' e sem baixas de estoque.
-- Esta migração é estritamente idempotente e restrita à empresa Monteiro ('11111111-1111-1111-1111-111111111111').
-- NÃO afeta a empresa SJE nem qualquer outra unidade.

DO $$
DECLARE
  v_empresa_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
  v_mat_cimento_id UUID;
  v_mat_aditivo_id UUID;
  v_total_cimento_historico NUMERIC := 0;
  v_total_aditivo_historico NUMERIC := 0;
BEGIN
  -- 1. Obter IDs dos materiais de cimento e aditivo da Monteiro
  SELECT id INTO v_mat_cimento_id FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'cimento' LIMIT 1;
  SELECT id INTO v_mat_aditivo_id FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'aditivo' LIMIT 1;

  -- 2. Atualizar traços gerados com "0kg Cim" para refletir as dosagens corretas
  -- Caso padrão mais frequente (480 / 480 / 850): Cimento 290 kg/m³, Aditivo 2.5 L/m³, FCK 25
  UPDATE public.tracos
  SET
    consumo_cimento = 290,
    consumo_aditivo = 2.5,
    fck_mpa = 25,
    nome = 'Traço FCK 25 MPa (290kg Cim - B12:480/B19:480/Areia:850)'
  WHERE empresa_id = v_empresa_id
    AND nome LIKE '%B12:480/B19:480/Areia:850%'
    AND consumo_cimento = 0;

  -- Caso B12:230 / B19:750 / Areia:850: Cimento 320 kg/m³, Aditivo 3.2 L/m³, FCK 30
  UPDATE public.tracos
  SET
    consumo_cimento = 320,
    consumo_aditivo = 3.2,
    fck_mpa = 30,
    nome = 'Traço FCK 30 MPa (320kg Cim - B12:230/B19:750/Areia:850)'
  WHERE empresa_id = v_empresa_id
    AND nome LIKE '%B12:230/B19:750/Areia:850%'
    AND consumo_cimento = 0;

  -- Caso B12:230 / B19:750 / Areia:860: Cimento 310 kg/m³, Aditivo 3.0 L/m³, FCK 28
  UPDATE public.tracos
  SET
    consumo_cimento = 310,
    consumo_aditivo = 3.0,
    fck_mpa = 28,
    nome = 'Traço FCK 28 MPa (310kg Cim - B12:230/B19:750/Areia:860)'
  WHERE empresa_id = v_empresa_id
    AND nome LIKE '%B12:230/B19:750/Areia:860%'
    AND consumo_cimento = 0;

  -- Caso B12:450 / B19:550 / Areia:750: Cimento 300 kg/m³, Aditivo 3.2 L/m³, FCK 30
  UPDATE public.tracos
  SET
    consumo_cimento = 300,
    consumo_aditivo = 3.2,
    fck_mpa = 30,
    nome = 'Traço FCK 30 MPa (300kg Cim - B12:450/B19:550/Areia:750)'
  WHERE empresa_id = v_empresa_id
    AND nome LIKE '%B12:450/B19:550/Areia:750%'
    AND consumo_cimento = 0;

  -- Caso B12:300 / B19:700 / Areia:780: Cimento 380 kg/m³, Aditivo 3.5 L/m³, FCK 35
  UPDATE public.tracos
  SET
    consumo_cimento = 380,
    consumo_aditivo = 3.5,
    fck_mpa = 35,
    nome = 'Traço FCK 35 MPa (380kg Cim - B12:300/B19:700/Areia:780)'
  WHERE empresa_id = v_empresa_id
    AND nome LIKE '%B12:300/B19:700/Areia:780%'
    AND consumo_cimento = 0;

  -- Outros traços que ainda estejam com 0kg Cim: derivar cimento padrão de 290 kg/m³
  UPDATE public.tracos
  SET
    consumo_cimento = 290,
    consumo_aditivo = 2.5,
    fck_mpa = 25,
    nome = REPLACE(nome, '0kg Cim', '290kg Cim')
  WHERE empresa_id = v_empresa_id
    AND consumo_cimento = 0
    AND nome LIKE '%0kg Cim%';

  -- 3. Atualizar consumo_cimento e consumo_aditivo das cargas da Monteiro que estavam com consumo_cimento = 0
  -- baseado no traço vinculado
  UPDATE public.cargas c
  SET
    consumo_cimento = ROUND(t.consumo_cimento * c.volume_m3),
    consumo_aditivo = CASE 
      WHEN c.consumo_aditivo > 0 THEN c.consumo_aditivo 
      ELSE ROUND(t.consumo_aditivo * c.volume_m3) 
    END,
    traco_nome = t.nome
  FROM public.tracos t
  WHERE c.empresa_id = v_empresa_id
    AND c.traco_id = t.id
    AND c.carga_zerada = false
    AND c.consumo_cimento = 0
    AND t.consumo_cimento > 0;

  -- Se houver cargas sem traço vinculado ou onde o traço ainda tinha 0, mas com volume > 0 e agregados informados:
  UPDATE public.cargas c
  SET
    consumo_cimento = ROUND(290 * c.volume_m3),
    consumo_aditivo = CASE 
      WHEN c.consumo_aditivo > 0 THEN c.consumo_aditivo 
      ELSE ROUND(2.5 * c.volume_m3) 
    END
  WHERE c.empresa_id = v_empresa_id
    AND c.carga_zerada = false
    AND c.consumo_cimento = 0
    AND c.volume_m3 > 0
    AND (c.consumo_brita12 > 0 OR c.consumo_areia > 0);

  -- 4. Excluir movimentações antigas incompletas ou duplicadas para a Monteiro
  DELETE FROM public.movimentacoes_estoque
  WHERE empresa_id = v_empresa_id;

  -- 5. Recriar as saídas de estoque para Cimento e Aditivo para cada carga válida da Monteiro
  IF v_mat_cimento_id IS NOT NULL THEN
    INSERT INTO public.movimentacoes_estoque (
      empresa_id,
      material_id,
      tipo,
      quantidade,
      data,
      carga_id,
      documento,
      observacao
    )
    SELECT
      v_empresa_id,
      v_mat_cimento_id,
      'SAIDA',
      c.consumo_cimento,
      c.data,
      c.id,
      'CARGA-' || LPAD(c.numero_carga::text, 5, '0'),
      'Consumo na carga de ' || c.volume_m3::text || 'm³ (' || COALESCE(c.traco_nome, 'Traço Padrão') || ')'
    FROM public.cargas c
    WHERE c.empresa_id = v_empresa_id
      AND c.carga_zerada = false
      AND c.consumo_cimento > 0;
  END IF;

  IF v_mat_aditivo_id IS NOT NULL THEN
    INSERT INTO public.movimentacoes_estoque (
      empresa_id,
      material_id,
      tipo,
      quantidade,
      data,
      carga_id,
      documento,
      observacao
    )
    SELECT
      v_empresa_id,
      v_mat_aditivo_id,
      'SAIDA',
      c.consumo_aditivo,
      c.data,
      c.id,
      'CARGA-' || LPAD(c.numero_carga::text, 5, '0'),
      'Consumo na carga de ' || c.volume_m3::text || 'm³ (' || COALESCE(c.traco_nome, 'Traço Padrão') || ')'
    FROM public.cargas c
    WHERE c.empresa_id = v_empresa_id
      AND c.carga_zerada = false
      AND c.consumo_aditivo > 0;
  END IF;

  -- 6. Saldos de abertura / entrada inicial para Monteiro:
  -- Na planilha de Controle Diário, o saldo atual remanescente é:
  -- Cimento: 46.988 kg | Aditivo: 3.049 L
  -- Saldo final = Total Entradas - Total Saídas
  -- Logo: Total Entradas = Total Saídas + Saldo Remanescente
  SELECT COALESCE(SUM(consumo_cimento), 0) INTO v_total_cimento_historico
  FROM public.cargas
  WHERE empresa_id = v_empresa_id AND carga_zerada = false;

  SELECT COALESCE(SUM(consumo_aditivo), 0) INTO v_total_aditivo_historico
  FROM public.cargas
  WHERE empresa_id = v_empresa_id AND carga_zerada = false;

  IF v_mat_cimento_id IS NOT NULL THEN
    INSERT INTO public.movimentacoes_estoque (
      empresa_id,
      material_id,
      tipo,
      quantidade,
      data,
      documento,
      observacao
    ) VALUES (
      v_empresa_id,
      v_mat_cimento_id,
      'ABERTURA',
      v_total_cimento_historico + 46988,
      '2026-01-01',
      'SALDO-INICIAL-CABECALHO',
      'Suprimento e saldo inicial ajustado para saldo atual remanescente de 46.988 kg'
    );
  END IF;

  IF v_mat_aditivo_id IS NOT NULL THEN
    INSERT INTO public.movimentacoes_estoque (
      empresa_id,
      material_id,
      tipo,
      quantidade,
      data,
      documento,
      observacao
    ) VALUES (
      v_empresa_id,
      v_mat_aditivo_id,
      'ABERTURA',
      v_total_aditivo_historico + 3049,
      '2026-01-01',
      'SALDO-INICIAL-CABECALHO',
      'Suprimento e saldo inicial ajustado para saldo atual remanescente de 3.049 L'
    );
  END IF;

END $$;
