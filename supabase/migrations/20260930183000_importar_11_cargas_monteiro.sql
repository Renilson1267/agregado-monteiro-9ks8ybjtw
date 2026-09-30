-- Migração: Importar 11 cargas reais para a empresa Monteiro (Setembro/2026)
-- Cargas fornecidas pelo usuário:
-- 28/09/2026 | 8 m³    | B12: 480 | B19: 480 | Areia: 850 | Pó: 0 | Cimento: 290 | Aditivo: 22L | VICTOR  | PFD6F23 | (sem destino)
-- 28/09/2026 | 10 m³   | B12: 480 | B19: 480 | Areia: 850 | Pó: 0 | Cimento: 290 | Aditivo: 28L | JUNIANO | TPE8A06 | (sem destino)
-- 29/09/2026 | 8,5 m³  | B12: 480 | B19: 480 | Areia: 850 | Pó: 0 | Cimento: 290 | Aditivo: 18L | JUNIANO | TPE8A06 | MONTEIRO
-- 29/09/2026 | 8 m³    | B12: 480 | B19: 480 | Areia: 850 | Pó: 0 | Cimento: 290 | Aditivo: 17L | VICTOR  | PFD6F23 | MONTEIRO
-- 29/09/2026 | 10 m³   | B12: 480 | B19: 480 | Areia: 850 | Pó: 0 | Cimento: 290 | Aditivo: 21L | JUNIANO | TPE8A06 | MONTEIRO
-- 29/09/2026 | 4,5 m³  | B12: 480 | B19: 480 | Areia: 850 | Pó: 0 | Cimento: 290 | Aditivo: 9L  | VICTOR  | PFD6F23 | MONTEIRO
-- 29/09/2026 | 7,5 m³  | B12: 480 | B19: 480 | Areia: 850 | Pó: 0 | Cimento: 290 | Aditivo: 16L | JUNIANO | TPE8A06 | MONTEIRO
-- 29/09/2026 | 8 m³    | B12: 480 | B19: 480 | Areia: 850 | Pó: 0 | Cimento: 290 | Aditivo: 18L | VICTOR  | PFD6F23 | SERTANIA
-- 29/09/2026 | 10,5 m³ | B12: 480 | B19: 480 | Areia: 850 | Pó: 0 | Cimento: 290 | Aditivo: 25L | JUNIANO | TPE8A06 | SERTANIA
-- 30/09/2026 | 9 m³    | B12: 480 | B19: 480 | Areia: 850 | Pó: 0 | Cimento: 320 | Aditivo: 28L | JUNIANO | TPE8A06 | (sem destino)
-- 30/09/2026 | 7 m³    | B12: 480 | B19: 480 | Areia: 850 | Pó: 0 | Cimento: 320 | Aditivo: 22L | VICTOR  | PFD6F23 | (sem destino)
-- Total de volume: 8 + 10 + 8.5 + 8 + 10 + 4.5 + 7.5 + 8 + 10.5 + 9 + 7 = 91.5 m³

DO $$
DECLARE
  v_empresa_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  
  -- IDs dos Traços
  v_traco_290_id UUID;
  v_traco_290_nome TEXT;
  v_traco_320_id UUID;
  v_traco_320_nome TEXT;

  -- IDs dos Motoristas
  v_mot_victor_id UUID;
  v_mot_juniano_id UUID;

  -- IDs dos Veículos
  v_veic_pfd6f23_id UUID;
  v_veic_tpe8a06_id UUID;

  -- IDs das Cidades
  v_cid_monteiro_id UUID;
  v_cid_sertania_id UUID;

  -- IDs dos Materiais com controle de estoque (cimento e aditivo)
  v_mat_cimento_id UUID;
  v_mat_aditivo_id UUID;

  -- Variáveis de iteração
  v_next_num INT;
  v_carga_id UUID;
  v_doc_name TEXT;
BEGIN
  -- 1. Resolver traço 290kg (B12:480 / B19:480 / Areia:850) para Monteiro
  SELECT id, nome INTO v_traco_290_id, v_traco_290_nome
  FROM public.tracos
  WHERE empresa_id = v_empresa_id
    AND consumo_cimento = 290
    AND consumo_brita12 = 480
    AND consumo_brita19 = 480
    AND consumo_areia = 850
  LIMIT 1;

  IF v_traco_290_id IS NULL THEN
    SELECT id, nome INTO v_traco_290_id, v_traco_290_nome
    FROM public.tracos
    WHERE empresa_id = v_empresa_id AND consumo_cimento = 290
    LIMIT 1;
  END IF;

  -- 2. Resolver traço 320kg (B12:480 / B19:480 / Areia:845 ou 850) para Monteiro
  SELECT id, nome INTO v_traco_320_id, v_traco_320_nome
  FROM public.tracos
  WHERE empresa_id = v_empresa_id
    AND consumo_cimento = 320
    AND consumo_brita12 = 480
    AND consumo_brita19 = 480
  LIMIT 1;

  IF v_traco_320_id IS NULL THEN
    SELECT id, nome INTO v_traco_320_id, v_traco_320_nome
    FROM public.tracos
    WHERE empresa_id = v_empresa_id AND consumo_cimento = 320
    LIMIT 1;
  END IF;

  -- 3. Resolver Motoristas da Monteiro
  SELECT id INTO v_mot_victor_id FROM public.motoristas WHERE empresa_id = v_empresa_id AND UPPER(nome) = 'VICTOR';
  IF v_mot_victor_id IS NULL THEN
    INSERT INTO public.motoristas (empresa_id, nome, ativo) VALUES (v_empresa_id, 'VICTOR', true) RETURNING id INTO v_mot_victor_id;
  END IF;

  SELECT id INTO v_mot_juniano_id FROM public.motoristas WHERE empresa_id = v_empresa_id AND UPPER(nome) = 'JUNIANO';
  IF v_mot_juniano_id IS NULL THEN
    INSERT INTO public.motoristas (empresa_id, nome, ativo) VALUES (v_empresa_id, 'JUNIANO', true) RETURNING id INTO v_mot_juniano_id;
  END IF;

  -- 4. Resolver Veículos da Monteiro
  SELECT id INTO v_veic_pfd6f23_id FROM public.veiculos WHERE empresa_id = v_empresa_id AND UPPER(placa) = 'PFD6F23';
  IF v_veic_pfd6f23_id IS NULL THEN
    INSERT INTO public.veiculos (empresa_id, placa, modelo, ativo) VALUES (v_empresa_id, 'PFD6F23', 'Betoneira', true) RETURNING id INTO v_veic_pfd6f23_id;
  END IF;

  SELECT id INTO v_veic_tpe8a06_id FROM public.veiculos WHERE empresa_id = v_empresa_id AND UPPER(placa) = 'TPE8A06';
  IF v_veic_tpe8a06_id IS NULL THEN
    INSERT INTO public.veiculos (empresa_id, placa, modelo, ativo) VALUES (v_empresa_id, 'TPE8A06', 'Betoneira', true) RETURNING id INTO v_veic_tpe8a06_id;
  END IF;

  -- 5. Resolver Cidades da Monteiro
  SELECT id INTO v_cid_monteiro_id FROM public.cidades WHERE empresa_id = v_empresa_id AND UPPER(nome) = 'MONTEIRO';
  SELECT id INTO v_cid_sertania_id FROM public.cidades WHERE empresa_id = v_empresa_id AND UPPER(nome) = 'SERTANIA';

  -- 6. Resolver Materiais controlados (cimento e aditivo) para saída de estoque
  SELECT id INTO v_mat_cimento_id FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'cimento' AND controla_estoque IS NOT FALSE LIMIT 1;
  SELECT id INTO v_mat_aditivo_id FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'aditivo' AND controla_estoque IS NOT FALSE LIMIT 1;

  -- 7. Próximo número sequencial de carga para a Monteiro
  SELECT COALESCE(MAX(numero_carga), 0) + 1 INTO v_next_num FROM public.cargas WHERE empresa_id = v_empresa_id;

  -- Inserir as 11 cargas se ainda não existirem no período com estes volumes e motoristas
  -- Carga 1: 28/09/2026, 8 m3, VICTOR, PFD6F23, 22L aditivo, traço 290
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas 
    WHERE empresa_id = v_empresa_id 
      AND data = '2026-09-28' 
      AND volume_m3 = 8 
      AND motorista_nome = 'VICTOR' 
      AND veiculo_placa = 'PFD6F23'
      AND consumo_aditivo = 22
  ) THEN
    INSERT INTO public.cargas (
      empresa_id, numero_carga, data, volume_m3, traco_id, traco_nome,
      motorista_id, motorista_nome, veiculo_id, veiculo_placa,
      cidade_id, cidade_nome,
      consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra,
      consumo_cimento, consumo_aditivo, consumo_agua,
      observacao, carga_zerada
    ) VALUES (
      v_empresa_id, v_next_num, '2026-09-28', 8.0, v_traco_290_id, v_traco_290_nome,
      v_mot_victor_id, 'VICTOR', v_veic_pfd6f23_id, 'PFD6F23',
      NULL, NULL,
      8.0 * 480, 8.0 * 480, 8.0 * 850, 0,
      8.0 * 290, 22.0, 0,
      'Lançamento de carga Setembro/2026', false
    ) RETURNING id INTO v_carga_id;

    v_doc_name := 'CARGA-' || LPAD(v_next_num::TEXT, 5, '0');
    IF v_mat_cimento_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_cimento_id, 'SAIDA', 8.0 * 290, '2026-09-28', v_carga_id, v_doc_name, 'Consumo na carga de 8m³');
    END IF;
    IF v_mat_aditivo_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_aditivo_id, 'SAIDA', 22.0, '2026-09-28', v_carga_id, v_doc_name, 'Consumo na carga de 8m³');
    END IF;
    v_next_num := v_next_num + 1;
  END IF;

  -- Carga 2: 28/09/2026, 10 m3, JUNIANO, TPE8A06, 28L aditivo, traço 290
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas 
    WHERE empresa_id = v_empresa_id 
      AND data = '2026-09-28' 
      AND volume_m3 = 10 
      AND motorista_nome = 'JUNIANO' 
      AND veiculo_placa = 'TPE8A06'
      AND consumo_aditivo = 28
  ) THEN
    INSERT INTO public.cargas (
      empresa_id, numero_carga, data, volume_m3, traco_id, traco_nome,
      motorista_id, motorista_nome, veiculo_id, veiculo_placa,
      cidade_id, cidade_nome,
      consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra,
      consumo_cimento, consumo_aditivo, consumo_agua,
      observacao, carga_zerada
    ) VALUES (
      v_empresa_id, v_next_num, '2026-09-28', 10.0, v_traco_290_id, v_traco_290_nome,
      v_mot_juniano_id, 'JUNIANO', v_veic_tpe8a06_id, 'TPE8A06',
      NULL, NULL,
      10.0 * 480, 10.0 * 480, 10.0 * 850, 0,
      10.0 * 290, 28.0, 0,
      'Lançamento de carga Setembro/2026', false
    ) RETURNING id INTO v_carga_id;

    v_doc_name := 'CARGA-' || LPAD(v_next_num::TEXT, 5, '0');
    IF v_mat_cimento_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_cimento_id, 'SAIDA', 10.0 * 290, '2026-09-28', v_carga_id, v_doc_name, 'Consumo na carga de 10m³');
    END IF;
    IF v_mat_aditivo_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_aditivo_id, 'SAIDA', 28.0, '2026-09-28', v_carga_id, v_doc_name, 'Consumo na carga de 10m³');
    END IF;
    v_next_num := v_next_num + 1;
  END IF;

  -- Carga 3: 29/09/2026, 8.5 m3, JUNIANO, TPE8A06, MONTEIRO, 18L aditivo, traço 290
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas 
    WHERE empresa_id = v_empresa_id 
      AND data = '2026-09-29' 
      AND volume_m3 = 8.5 
      AND motorista_nome = 'JUNIANO' 
      AND veiculo_placa = 'TPE8A06'
      AND consumo_aditivo = 18
  ) THEN
    INSERT INTO public.cargas (
      empresa_id, numero_carga, data, volume_m3, traco_id, traco_nome,
      motorista_id, motorista_nome, veiculo_id, veiculo_placa,
      cidade_id, cidade_nome,
      consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra,
      consumo_cimento, consumo_aditivo, consumo_agua,
      observacao, carga_zerada
    ) VALUES (
      v_empresa_id, v_next_num, '2026-09-29', 8.5, v_traco_290_id, v_traco_290_nome,
      v_mot_juniano_id, 'JUNIANO', v_veic_tpe8a06_id, 'TPE8A06',
      v_cid_monteiro_id, 'MONTEIRO',
      8.5 * 480, 8.5 * 480, 8.5 * 850, 0,
      8.5 * 290, 18.0, 0,
      'Lançamento de carga Setembro/2026', false
    ) RETURNING id INTO v_carga_id;

    v_doc_name := 'CARGA-' || LPAD(v_next_num::TEXT, 5, '0');
    IF v_mat_cimento_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_cimento_id, 'SAIDA', 8.5 * 290, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 8.5m³');
    END IF;
    IF v_mat_aditivo_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_aditivo_id, 'SAIDA', 18.0, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 8.5m³');
    END IF;
    v_next_num := v_next_num + 1;
  END IF;

  -- Carga 4: 29/09/2026, 8 m3, VICTOR, PFD6F23, MONTEIRO, 17L aditivo, traço 290
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas 
    WHERE empresa_id = v_empresa_id 
      AND data = '2026-09-29' 
      AND volume_m3 = 8.0 
      AND motorista_nome = 'VICTOR' 
      AND veiculo_placa = 'PFD6F23'
      AND consumo_aditivo = 17
  ) THEN
    INSERT INTO public.cargas (
      empresa_id, numero_carga, data, volume_m3, traco_id, traco_nome,
      motorista_id, motorista_nome, veiculo_id, veiculo_placa,
      cidade_id, cidade_nome,
      consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra,
      consumo_cimento, consumo_aditivo, consumo_agua,
      observacao, carga_zerada
    ) VALUES (
      v_empresa_id, v_next_num, '2026-09-29', 8.0, v_traco_290_id, v_traco_290_nome,
      v_mot_victor_id, 'VICTOR', v_veic_pfd6f23_id, 'PFD6F23',
      v_cid_monteiro_id, 'MONTEIRO',
      8.0 * 480, 8.0 * 480, 8.0 * 850, 0,
      8.0 * 290, 17.0, 0,
      'Lançamento de carga Setembro/2026', false
    ) RETURNING id INTO v_carga_id;

    v_doc_name := 'CARGA-' || LPAD(v_next_num::TEXT, 5, '0');
    IF v_mat_cimento_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_cimento_id, 'SAIDA', 8.0 * 290, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 8m³');
    END IF;
    IF v_mat_aditivo_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_aditivo_id, 'SAIDA', 17.0, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 8m³');
    END IF;
    v_next_num := v_next_num + 1;
  END IF;

  -- Carga 5: 29/09/2026, 10 m3, JUNIANO, TPE8A06, MONTEIRO, 21L aditivo, traço 290
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas 
    WHERE empresa_id = v_empresa_id 
      AND data = '2026-09-29' 
      AND volume_m3 = 10.0 
      AND motorista_nome = 'JUNIANO' 
      AND veiculo_placa = 'TPE8A06'
      AND consumo_aditivo = 21
  ) THEN
    INSERT INTO public.cargas (
      empresa_id, numero_carga, data, volume_m3, traco_id, traco_nome,
      motorista_id, motorista_nome, veiculo_id, veiculo_placa,
      cidade_id, cidade_nome,
      consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra,
      consumo_cimento, consumo_aditivo, consumo_agua,
      observacao, carga_zerada
    ) VALUES (
      v_empresa_id, v_next_num, '2026-09-29', 10.0, v_traco_290_id, v_traco_290_nome,
      v_mot_juniano_id, 'JUNIANO', v_veic_tpe8a06_id, 'TPE8A06',
      v_cid_monteiro_id, 'MONTEIRO',
      10.0 * 480, 10.0 * 480, 10.0 * 850, 0,
      10.0 * 290, 21.0, 0,
      'Lançamento de carga Setembro/2026', false
    ) RETURNING id INTO v_carga_id;

    v_doc_name := 'CARGA-' || LPAD(v_next_num::TEXT, 5, '0');
    IF v_mat_cimento_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_cimento_id, 'SAIDA', 10.0 * 290, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 10m³');
    END IF;
    IF v_mat_aditivo_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_aditivo_id, 'SAIDA', 21.0, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 10m³');
    END IF;
    v_next_num := v_next_num + 1;
  END IF;

  -- Carga 6: 29/09/2026, 4.5 m3, VICTOR, PFD6F23, MONTEIRO, 9L aditivo, traço 290
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas 
    WHERE empresa_id = v_empresa_id 
      AND data = '2026-09-29' 
      AND volume_m3 = 4.5 
      AND motorista_nome = 'VICTOR' 
      AND veiculo_placa = 'PFD6F23'
      AND consumo_aditivo = 9
  ) THEN
    INSERT INTO public.cargas (
      empresa_id, numero_carga, data, volume_m3, traco_id, traco_nome,
      motorista_id, motorista_nome, veiculo_id, veiculo_placa,
      cidade_id, cidade_nome,
      consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra,
      consumo_cimento, consumo_aditivo, consumo_agua,
      observacao, carga_zerada
    ) VALUES (
      v_empresa_id, v_next_num, '2026-09-29', 4.5, v_traco_290_id, v_traco_290_nome,
      v_mot_victor_id, 'VICTOR', v_veic_pfd6f23_id, 'PFD6F23',
      v_cid_monteiro_id, 'MONTEIRO',
      4.5 * 480, 4.5 * 480, 4.5 * 850, 0,
      4.5 * 290, 9.0, 0,
      'Lançamento de carga Setembro/2026', false
    ) RETURNING id INTO v_carga_id;

    v_doc_name := 'CARGA-' || LPAD(v_next_num::TEXT, 5, '0');
    IF v_mat_cimento_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_cimento_id, 'SAIDA', 4.5 * 290, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 4.5m³');
    END IF;
    IF v_mat_aditivo_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_aditivo_id, 'SAIDA', 9.0, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 4.5m³');
    END IF;
    v_next_num := v_next_num + 1;
  END IF;

  -- Carga 7: 29/09/2026, 7.5 m3, JUNIANO, TPE8A06, MONTEIRO, 16L aditivo, traço 290
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas 
    WHERE empresa_id = v_empresa_id 
      AND data = '2026-09-29' 
      AND volume_m3 = 7.5 
      AND motorista_nome = 'JUNIANO' 
      AND veiculo_placa = 'TPE8A06'
      AND consumo_aditivo = 16
  ) THEN
    INSERT INTO public.cargas (
      empresa_id, numero_carga, data, volume_m3, traco_id, traco_nome,
      motorista_id, motorista_nome, veiculo_id, veiculo_placa,
      cidade_id, cidade_nome,
      consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra,
      consumo_cimento, consumo_aditivo, consumo_agua,
      observacao, carga_zerada
    ) VALUES (
      v_empresa_id, v_next_num, '2026-09-29', 7.5, v_traco_290_id, v_traco_290_nome,
      v_mot_juniano_id, 'JUNIANO', v_veic_tpe8a06_id, 'TPE8A06',
      v_cid_monteiro_id, 'MONTEIRO',
      7.5 * 480, 7.5 * 480, 7.5 * 850, 0,
      7.5 * 290, 16.0, 0,
      'Lançamento de carga Setembro/2026', false
    ) RETURNING id INTO v_carga_id;

    v_doc_name := 'CARGA-' || LPAD(v_next_num::TEXT, 5, '0');
    IF v_mat_cimento_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_cimento_id, 'SAIDA', 7.5 * 290, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 7.5m³');
    END IF;
    IF v_mat_aditivo_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_aditivo_id, 'SAIDA', 16.0, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 7.5m³');
    END IF;
    v_next_num := v_next_num + 1;
  END IF;

  -- Carga 8: 29/09/2026, 8 m3, VICTOR, PFD6F23, SERTANIA, 18L aditivo, traço 290
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas 
    WHERE empresa_id = v_empresa_id 
      AND data = '2026-09-29' 
      AND volume_m3 = 8.0 
      AND motorista_nome = 'VICTOR' 
      AND veiculo_placa = 'PFD6F23'
      AND cidade_nome = 'SERTANIA'
      AND consumo_aditivo = 18
  ) THEN
    INSERT INTO public.cargas (
      empresa_id, numero_carga, data, volume_m3, traco_id, traco_nome,
      motorista_id, motorista_nome, veiculo_id, veiculo_placa,
      cidade_id, cidade_nome,
      consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra,
      consumo_cimento, consumo_aditivo, consumo_agua,
      observacao, carga_zerada
    ) VALUES (
      v_empresa_id, v_next_num, '2026-09-29', 8.0, v_traco_290_id, v_traco_290_nome,
      v_mot_victor_id, 'VICTOR', v_veic_pfd6f23_id, 'PFD6F23',
      v_cid_sertania_id, 'SERTANIA',
      8.0 * 480, 8.0 * 480, 8.0 * 850, 0,
      8.0 * 290, 18.0, 0,
      'Lançamento de carga Setembro/2026', false
    ) RETURNING id INTO v_carga_id;

    v_doc_name := 'CARGA-' || LPAD(v_next_num::TEXT, 5, '0');
    IF v_mat_cimento_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_cimento_id, 'SAIDA', 8.0 * 290, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 8m³');
    END IF;
    IF v_mat_aditivo_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_aditivo_id, 'SAIDA', 18.0, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 8m³');
    END IF;
    v_next_num := v_next_num + 1;
  END IF;

  -- Carga 9: 29/09/2026, 10.5 m3, JUNIANO, TPE8A06, SERTANIA, 25L aditivo, traço 290
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas 
    WHERE empresa_id = v_empresa_id 
      AND data = '2026-09-29' 
      AND volume_m3 = 10.5 
      AND motorista_nome = 'JUNIANO' 
      AND veiculo_placa = 'TPE8A06'
      AND cidade_nome = 'SERTANIA'
      AND consumo_aditivo = 25
  ) THEN
    INSERT INTO public.cargas (
      empresa_id, numero_carga, data, volume_m3, traco_id, traco_nome,
      motorista_id, motorista_nome, veiculo_id, veiculo_placa,
      cidade_id, cidade_nome,
      consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra,
      consumo_cimento, consumo_aditivo, consumo_agua,
      observacao, carga_zerada
    ) VALUES (
      v_empresa_id, v_next_num, '2026-09-29', 10.5, v_traco_290_id, v_traco_290_nome,
      v_mot_juniano_id, 'JUNIANO', v_veic_tpe8a06_id, 'TPE8A06',
      v_cid_sertania_id, 'SERTANIA',
      10.5 * 480, 10.5 * 480, 10.5 * 850, 0,
      10.5 * 290, 25.0, 0,
      'Lançamento de carga Setembro/2026', false
    ) RETURNING id INTO v_carga_id;

    v_doc_name := 'CARGA-' || LPAD(v_next_num::TEXT, 5, '0');
    IF v_mat_cimento_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_cimento_id, 'SAIDA', 10.5 * 290, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 10.5m³');
    END IF;
    IF v_mat_aditivo_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_aditivo_id, 'SAIDA', 25.0, '2026-09-29', v_carga_id, v_doc_name, 'Consumo na carga de 10.5m³');
    END IF;
    v_next_num := v_next_num + 1;
  END IF;

  -- Carga 10: 30/09/2026, 9 m3, JUNIANO, TPE8A06, 28L aditivo, traço 320
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas 
    WHERE empresa_id = v_empresa_id 
      AND data = '2026-09-30' 
      AND volume_m3 = 9.0 
      AND motorista_nome = 'JUNIANO' 
      AND veiculo_placa = 'TPE8A06'
      AND consumo_cimento = 9.0 * 320
  ) THEN
    INSERT INTO public.cargas (
      empresa_id, numero_carga, data, volume_m3, traco_id, traco_nome,
      motorista_id, motorista_nome, veiculo_id, veiculo_placa,
      cidade_id, cidade_nome,
      consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra,
      consumo_cimento, consumo_aditivo, consumo_agua,
      observacao, carga_zerada
    ) VALUES (
      v_empresa_id, v_next_num, '2026-09-30', 9.0, v_traco_320_id, v_traco_320_nome,
      v_mot_juniano_id, 'JUNIANO', v_veic_tpe8a06_id, 'TPE8A06',
      NULL, NULL,
      9.0 * 480, 9.0 * 480, 9.0 * 850, 0,
      9.0 * 320, 28.0, 0,
      'Lançamento de carga Setembro/2026', false
    ) RETURNING id INTO v_carga_id;

    v_doc_name := 'CARGA-' || LPAD(v_next_num::TEXT, 5, '0');
    IF v_mat_cimento_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_cimento_id, 'SAIDA', 9.0 * 320, '2026-09-30', v_carga_id, v_doc_name, 'Consumo na carga de 9m³');
    END IF;
    IF v_mat_aditivo_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_aditivo_id, 'SAIDA', 28.0, '2026-09-30', v_carga_id, v_doc_name, 'Consumo na carga de 9m³');
    END IF;
    v_next_num := v_next_num + 1;
  END IF;

  -- Carga 11: 30/09/2026, 7 m3, VICTOR, PFD6F23, 22L aditivo, traço 320
  IF NOT EXISTS (
    SELECT 1 FROM public.cargas 
    WHERE empresa_id = v_empresa_id 
      AND data = '2026-09-30' 
      AND volume_m3 = 7.0 
      AND motorista_nome = 'VICTOR' 
      AND veiculo_placa = 'PFD6F23'
      AND consumo_cimento = 7.0 * 320
  ) THEN
    INSERT INTO public.cargas (
      empresa_id, numero_carga, data, volume_m3, traco_id, traco_nome,
      motorista_id, motorista_nome, veiculo_id, veiculo_placa,
      cidade_id, cidade_nome,
      consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra,
      consumo_cimento, consumo_aditivo, consumo_agua,
      observacao, carga_zerada
    ) VALUES (
      v_empresa_id, v_next_num, '2026-09-30', 7.0, v_traco_320_id, v_traco_320_nome,
      v_mot_victor_id, 'VICTOR', v_veic_pfd6f23_id, 'PFD6F23',
      NULL, NULL,
      7.0 * 480, 7.0 * 480, 7.0 * 850, 0,
      7.0 * 320, 22.0, 0,
      'Lançamento de carga Setembro/2026', false
    ) RETURNING id INTO v_carga_id;

    v_doc_name := 'CARGA-' || LPAD(v_next_num::TEXT, 5, '0');
    IF v_mat_cimento_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_cimento_id, 'SAIDA', 7.0 * 320, '2026-09-30', v_carga_id, v_doc_name, 'Consumo na carga de 7m³');
    END IF;
    IF v_mat_aditivo_id IS NOT NULL THEN
      INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
      VALUES (v_empresa_id, v_mat_aditivo_id, 'SAIDA', 22.0, '2026-09-30', v_carga_id, v_doc_name, 'Consumo na carga de 7m³');
    END IF;
    v_next_num := v_next_num + 1;
  END IF;

END $$;
