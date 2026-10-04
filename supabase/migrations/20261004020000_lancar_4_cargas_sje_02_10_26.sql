-- Migração: Lançamento das 4 cargas de 02/10/26 na unidade SJE e saídas de estoque
-- Data: 2026-10-02
-- Unidade: SJdoEgito (empresa_id = '22222222-2222-2222-2222-222222222222')
--
-- Cargas a lançar:
-- (1) 8,0 m³ cimento 320/m³ (2560 kg), B12 230 (1840 kg), B19 750 (6000 kg), Areia 850 (6800 kg), aditivo 26 L real
-- (2) 8,0 m³ cimento 290/m³ (2320 kg), B12 230 (1840 kg), B19 750 (6000 kg), Areia 850 (6800 kg), aditivo 19 L real
-- (3) 4,0 m³ cimento 320/m³ (1280 kg), B12 480 (1920 kg), B19 480 (1920 kg), Areia 850 (3400 kg), aditivo 10 L real
-- (4) 4,0 m³ cimento 290/m³ (1160 kg), B12 480 (1920 kg), B19 480 (1920 kg), Areia 850 (3400 kg), aditivo 8 L real
--
-- Observação: 'Carga SJE 02/10/26'
-- Motorista / Placa / Cidade vazios
-- Aditivo: valor TOTAL REAL informado (não multiplicar por m³)
-- Movimentações de estoque geradas por carga para: cimento, aditivo, brita12, brita19, areia

DO $$
DECLARE
  v_empresa_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  v_mat_cimento UUID;
  v_mat_aditivo UUID;
  v_mat_brita12 UUID;
  v_mat_brita19 UUID;
  v_mat_areia UUID;

  v_next_num INT;
  v_carga_id UUID;
  v_doc_name TEXT;
BEGIN
  -- 1. Obter IDs dos materiais da unidade SJE
  SELECT id INTO v_mat_cimento FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'cimento';
  SELECT id INTO v_mat_aditivo FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'aditivo';
  SELECT id INTO v_mat_brita12 FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'brita12';
  SELECT id INTO v_mat_brita19 FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'brita19';
  SELECT id INTO v_mat_areia FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'areia';

  IF v_mat_cimento IS NULL OR v_mat_aditivo IS NULL OR v_mat_brita12 IS NULL OR v_mat_brita19 IS NULL OR v_mat_areia IS NULL THEN
    RAISE EXCEPTION 'Materiais obrigatórios da SJE não encontrados (cimento, aditivo, brita12, brita19, areia).';
  END IF;

  -- 2. Obter próximo sequencial de carga para a SJE
  SELECT COALESCE(MAX(numero_carga), 0) + 1 INTO v_next_num FROM public.cargas WHERE empresa_id = v_empresa_id;

  -- =========================================================================
  -- Carga 1: 8,0 m³, cimento 320/m³ (2560), B12 230 (1840), B19 750 (6000), Areia 850 (6800), aditivo 26 L real
  -- =========================================================================
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas
    WHERE empresa_id = v_empresa_id
      AND data = '2026-10-02'
      AND volume_m3 = 8.0
      AND consumo_cimento = 2560
      AND consumo_brita12 = 1840
      AND consumo_brita19 = 6000
      AND consumo_aditivo = 26
  ) THEN
    v_carga_id := gen_random_uuid();
    v_doc_name := 'CARGA-SJE-' || LPAD(v_next_num::TEXT, 4, '0');

    INSERT INTO public.cargas (
      id,
      empresa_id,
      numero_carga,
      data,
      volume_m3,
      traco_id,
      traco_nome,
      motorista_id,
      motorista_nome,
      veiculo_id,
      veiculo_placa,
      cidade_id,
      cidade_nome,
      consumo_brita12,
      consumo_brita19,
      consumo_areia,
      consumo_po_pedra,
      consumo_cimento,
      consumo_aditivo,
      consumo_agua,
      carga_zerada,
      observacao
    ) VALUES (
      v_carga_id,
      v_empresa_id,
      v_next_num,
      '2026-10-02',
      8.0,
      NULL,
      'Traço SJE 320kg (B12:230 / B19:750 / Areia:850)',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      1840, -- 8.0 * 230
      6000, -- 8.0 * 750
      6800, -- 8.0 * 850
      0,
      2560, -- 8.0 * 320
      26,   -- 26L real
      0,
      false,
      'Carga SJE 02/10/26'
    );

    -- Movimentações de estoque
    INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
    VALUES
      (v_empresa_id, v_mat_cimento, 'SAIDA', 2560, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (8m³)'),
      (v_empresa_id, v_mat_aditivo, 'SAIDA', 26, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (8m³)'),
      (v_empresa_id, v_mat_areia, 'SAIDA', 6800, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (8m³)'),
      (v_empresa_id, v_mat_brita12, 'SAIDA', 1840, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (8m³)'),
      (v_empresa_id, v_mat_brita19, 'SAIDA', 6000, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (8m³)');

    v_next_num := v_next_num + 1;
  END IF;

  -- =========================================================================
  -- Carga 2: 8,0 m³, cimento 290/m³ (2320), B12 230 (1840), B19 750 (6000), Areia 850 (6800), aditivo 19 L real
  -- =========================================================================
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas
    WHERE empresa_id = v_empresa_id
      AND data = '2026-10-02'
      AND volume_m3 = 8.0
      AND consumo_cimento = 2320
      AND consumo_brita12 = 1840
      AND consumo_brita19 = 6000
      AND consumo_aditivo = 19
  ) THEN
    v_carga_id := gen_random_uuid();
    v_doc_name := 'CARGA-SJE-' || LPAD(v_next_num::TEXT, 4, '0');

    INSERT INTO public.cargas (
      id,
      empresa_id,
      numero_carga,
      data,
      volume_m3,
      traco_id,
      traco_nome,
      motorista_id,
      motorista_nome,
      veiculo_id,
      veiculo_placa,
      cidade_id,
      cidade_nome,
      consumo_brita12,
      consumo_brita19,
      consumo_areia,
      consumo_po_pedra,
      consumo_cimento,
      consumo_aditivo,
      consumo_agua,
      carga_zerada,
      observacao
    ) VALUES (
      v_carga_id,
      v_empresa_id,
      v_next_num,
      '2026-10-02',
      8.0,
      NULL,
      'Traço SJE 290kg (B12:230 / B19:750 / Areia:850)',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      1840, -- 8.0 * 230
      6000, -- 8.0 * 750
      6800, -- 8.0 * 850
      0,
      2320, -- 8.0 * 290
      19,   -- 19L real
      0,
      false,
      'Carga SJE 02/10/26'
    );

    -- Movimentações de estoque
    INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
    VALUES
      (v_empresa_id, v_mat_cimento, 'SAIDA', 2320, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (8m³)'),
      (v_empresa_id, v_mat_aditivo, 'SAIDA', 19, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (8m³)'),
      (v_empresa_id, v_mat_areia, 'SAIDA', 6800, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (8m³)'),
      (v_empresa_id, v_mat_brita12, 'SAIDA', 1840, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (8m³)'),
      (v_empresa_id, v_mat_brita19, 'SAIDA', 6000, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (8m³)');

    v_next_num := v_next_num + 1;
  END IF;

  -- =========================================================================
  -- Carga 3: 4,0 m³, cimento 320/m³ (1280), B12 480 (1920), B19 480 (1920), Areia 850 (3400), aditivo 10 L real
  -- =========================================================================
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas
    WHERE empresa_id = v_empresa_id
      AND data = '2026-10-02'
      AND volume_m3 = 4.0
      AND consumo_cimento = 1280
      AND consumo_brita12 = 1920
      AND consumo_brita19 = 1920
      AND consumo_aditivo = 10
  ) THEN
    v_carga_id := gen_random_uuid();
    v_doc_name := 'CARGA-SJE-' || LPAD(v_next_num::TEXT, 4, '0');

    INSERT INTO public.cargas (
      id,
      empresa_id,
      numero_carga,
      data,
      volume_m3,
      traco_id,
      traco_nome,
      motorista_id,
      motorista_nome,
      veiculo_id,
      veiculo_placa,
      cidade_id,
      cidade_nome,
      consumo_brita12,
      consumo_brita19,
      consumo_areia,
      consumo_po_pedra,
      consumo_cimento,
      consumo_aditivo,
      consumo_agua,
      carga_zerada,
      observacao
    ) VALUES (
      v_carga_id,
      v_empresa_id,
      v_next_num,
      '2026-10-02',
      4.0,
      NULL,
      'Traço SJE 320kg (B12:480 / B19:480 / Areia:850)',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      1920, -- 4.0 * 480
      1920, -- 4.0 * 480
      3400, -- 4.0 * 850
      0,
      1280, -- 4.0 * 320
      10,   -- 10L real
      0,
      false,
      'Carga SJE 02/10/26'
    );

    -- Movimentações de estoque
    INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
    VALUES
      (v_empresa_id, v_mat_cimento, 'SAIDA', 1280, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (4m³)'),
      (v_empresa_id, v_mat_aditivo, 'SAIDA', 10, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (4m³)'),
      (v_empresa_id, v_mat_areia, 'SAIDA', 3400, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (4m³)'),
      (v_empresa_id, v_mat_brita12, 'SAIDA', 1920, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (4m³)'),
      (v_empresa_id, v_mat_brita19, 'SAIDA', 1920, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (4m³)');

    v_next_num := v_next_num + 1;
  END IF;

  -- =========================================================================
  -- Carga 4: 4,0 m³, cimento 290/m³ (1160), B12 480 (1920), B19 480 (1920), Areia 850 (3400), aditivo 8 L real
  -- =========================================================================
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas
    WHERE empresa_id = v_empresa_id
      AND data = '2026-10-02'
      AND volume_m3 = 4.0
      AND consumo_cimento = 1160
      AND consumo_brita12 = 1920
      AND consumo_brita19 = 1920
      AND consumo_aditivo = 8
  ) THEN
    v_carga_id := gen_random_uuid();
    v_doc_name := 'CARGA-SJE-' || LPAD(v_next_num::TEXT, 4, '0');

    INSERT INTO public.cargas (
      id,
      empresa_id,
      numero_carga,
      data,
      volume_m3,
      traco_id,
      traco_nome,
      motorista_id,
      motorista_nome,
      veiculo_id,
      veiculo_placa,
      cidade_id,
      cidade_nome,
      consumo_brita12,
      consumo_brita19,
      consumo_areia,
      consumo_po_pedra,
      consumo_cimento,
      consumo_aditivo,
      consumo_agua,
      carga_zerada,
      observacao
    ) VALUES (
      v_carga_id,
      v_empresa_id,
      v_next_num,
      '2026-10-02',
      4.0,
      NULL,
      'Traço SJE 290kg (B12:480 / B19:480 / Areia:850)',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      1920, -- 4.0 * 480
      1920, -- 4.0 * 480
      3400, -- 4.0 * 850
      0,
      1160, -- 4.0 * 290
      8,    -- 8L real
      0,
      false,
      'Carga SJE 02/10/26'
    );

    -- Movimentações de estoque
    INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
    VALUES
      (v_empresa_id, v_mat_cimento, 'SAIDA', 1160, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (4m³)'),
      (v_empresa_id, v_mat_aditivo, 'SAIDA', 8, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (4m³)'),
      (v_empresa_id, v_mat_areia, 'SAIDA', 3400, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (4m³)'),
      (v_empresa_id, v_mat_brita12, 'SAIDA', 1920, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (4m³)'),
      (v_empresa_id, v_mat_brita19, 'SAIDA', 1920, '2026-10-02', v_carga_id, v_doc_name, 'Consumo da carga ' || v_next_num || ' (4m³)');

    v_next_num := v_next_num + 1;
  END IF;
END $$;
