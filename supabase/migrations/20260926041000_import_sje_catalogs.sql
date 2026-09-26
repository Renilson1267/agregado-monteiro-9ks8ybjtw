-- Migração: Importação direta dos dados operacionais da unidade SJE
-- Empresa SJE: '22222222-2222-2222-2222-222222222222'::uuid

DO $$
DECLARE
  v_empresa_id UUID := '22222222-2222-2222-2222-222222222222'::uuid;
  v_mat_brita12 UUID;
  v_mat_brita19 UUID;
  v_mat_areia UUID;
  v_mat_po_pedra UUID;
  v_mat_cimento UUID;
  v_mat_aditivo UUID;
  v_traco_id UUID;
BEGIN
  -- Garantir que a empresa SJE existe
  INSERT INTO public.empresas (id, nome, slug, ativo)
  VALUES (v_empresa_id, 'SJE', 'sje', true)
  ON CONFLICT (slug) DO UPDATE SET nome = 'SJE', ativo = true;

  -- 1. Materiais da SJE
  INSERT INTO public.materiais (id, empresa_id, codigo, nome, unidade, estoque_minimo, ordem)
  VALUES (gen_random_uuid(), v_empresa_id, 'brita12', 'Brita 12', 'kg', 10000, 1)
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  INSERT INTO public.materiais (id, empresa_id, codigo, nome, unidade, estoque_minimo, ordem)
  VALUES (gen_random_uuid(), v_empresa_id, 'brita19', 'Brita 19', 'kg', 10000, 2)
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  INSERT INTO public.materiais (id, empresa_id, codigo, nome, unidade, estoque_minimo, ordem)
  VALUES (gen_random_uuid(), v_empresa_id, 'areia', 'Areia', 'kg', 15000, 3)
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  INSERT INTO public.materiais (id, empresa_id, codigo, nome, unidade, estoque_minimo, ordem)
  VALUES (gen_random_uuid(), v_empresa_id, 'po_pedra', 'Pó de Brita', 'kg', 5000, 4)
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  INSERT INTO public.materiais (id, empresa_id, codigo, nome, unidade, estoque_minimo, ordem)
  VALUES (gen_random_uuid(), v_empresa_id, 'cimento', 'Cimento CP-IV / CP-II', 'kg', 10000, 5)
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  INSERT INTO public.materiais (id, empresa_id, codigo, nome, unidade, estoque_minimo, ordem)
  VALUES (gen_random_uuid(), v_empresa_id, 'aditivo', 'Aditivo Plastificante', 'litros', 500, 6)
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  -- Obter IDs dos materiais
  SELECT id INTO v_mat_brita12 FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'brita12';
  SELECT id INTO v_mat_brita19 FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'brita19';
  SELECT id INTO v_mat_areia FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'areia';
  SELECT id INTO v_mat_po_pedra FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'po_pedra';
  SELECT id INTO v_mat_cimento FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'cimento';
  SELECT id INTO v_mat_aditivo FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'aditivo';

  -- 2. Estoque Inicial (Movimentações de ABERTURA)
  IF NOT EXISTS (SELECT 1 FROM public.movimentacoes_estoque WHERE empresa_id = v_empresa_id AND tipo = 'ABERTURA') THEN
    INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, documento, observacao)
    VALUES
      (v_empresa_id, v_mat_cimento, 'ABERTURA', 35706, '2026-09-01', 'ESTOQUE-INICIAL', 'Saldo inicial planilha SJE'),
      (v_empresa_id, v_mat_aditivo, 'ABERTURA', 2183, '2026-09-01', 'ESTOQUE-INICIAL', 'Saldo inicial planilha SJE'),
      (v_empresa_id, v_mat_brita12, 'ABERTURA', 0, '2026-09-01', 'ESTOQUE-INICIAL', 'Saldo inicial planilha SJE'),
      (v_empresa_id, v_mat_brita19, 'ABERTURA', 0, '2026-09-01', 'ESTOQUE-INICIAL', 'Saldo inicial planilha SJE'),
      (v_empresa_id, v_mat_areia, 'ABERTURA', 0, '2026-09-01', 'ESTOQUE-INICIAL', 'Saldo inicial planilha SJE'),
      (v_empresa_id, v_mat_po_pedra, 'ABERTURA', 0, '2026-09-01', 'ESTOQUE-INICIAL', 'Saldo inicial planilha SJE');
  END IF;

  -- 3. Cargas de Entrada (Entradas de Cimento e Aditivo)
  IF NOT EXISTS (SELECT 1 FROM public.movimentacoes_estoque WHERE empresa_id = v_empresa_id AND tipo = 'ENTRADA') THEN
    INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, documento, observacao)
    VALUES
      -- Cimento
      (v_empresa_id, v_mat_cimento, 'ENTRADA', 38380, '2026-09-03', 'CARGA-CIMENTO-01', 'Carga recebida SJE'),
      (v_empresa_id, v_mat_cimento, 'ENTRADA', 37710, '2026-09-04', 'CARGA-CIMENTO-02', 'Carga recebida SJE'),
      (v_empresa_id, v_mat_cimento, 'ENTRADA', 31310, '2026-09-10', 'CARGA-CIMENTO-03', 'Carga recebida SJE'),
      (v_empresa_id, v_mat_cimento, 'ENTRADA', 34700, '2026-09-15', 'CARGA-CIMENTO-04', 'Carga recebida SJE'),
      (v_empresa_id, v_mat_cimento, 'ENTRADA', 38440, '2026-09-18', 'CARGA-CIMENTO-05', 'Carga recebida SJE'),
      (v_empresa_id, v_mat_cimento, 'ENTRADA', 34640, '2026-09-23', 'CARGA-CIMENTO-06', 'Carga recebida SJE'),
      -- Aditivo
      (v_empresa_id, v_mat_aditivo, 'ENTRADA', 3000, '2026-09-09', 'CARGA-ADITIVO-01', 'Carga recebida SJE');
  END IF;

  -- 4. Cadastros da Aba "Cadastro"
  -- Motoristas
  INSERT INTO public.motoristas (empresa_id, nome, ativo) VALUES
    (v_empresa_id, 'ARLINDO', true),
    (v_empresa_id, 'BRITO', true),
    (v_empresa_id, 'IRINALDO', true),
    (v_empresa_id, 'JUNIANO', true),
    (v_empresa_id, 'VICTOR', true),
    (v_empresa_id, 'MAGO', true)
  ON CONFLICT (empresa_id, nome) DO NOTHING;

  -- Veículos (Placas)
  INSERT INTO public.veiculos (empresa_id, placa, modelo, ativo) VALUES
    (v_empresa_id, 'PEG6G21', 'Betoneira SJE', true),
    (v_empresa_id, 'PEX8A95', 'Betoneira SJE', true),
    (v_empresa_id, 'SLF1G52', 'Betoneira SJE', true),
    (v_empresa_id, 'TPE8A06', 'Betoneira SJE', true),
    (v_empresa_id, 'PFD6F23', 'Betoneira SJE', true),
    (v_empresa_id, 'PEX8B15', 'Betoneira SJE', true),
    (v_empresa_id, 'PEG6E61', 'Betoneira SJE', true)
  ON CONFLICT (empresa_id, placa) DO NOTHING;

  -- Cidades
  INSERT INTO public.cidades (empresa_id, nome, uf) VALUES
    (v_empresa_id, 'SÃO DOMINGOS DO CARIRI', 'PB'),
    (v_empresa_id, 'SERTANIA', 'PE'),
    (v_empresa_id, 'CUSTODIA', 'PE'),
    (v_empresa_id, 'PRATA', 'PB'),
    (v_empresa_id, 'MONTEIRO', 'PB'),
    (v_empresa_id, 'SERRA BRANCA', 'PB'),
    (v_empresa_id, 'COXIXOLA', 'PB'),
    (v_empresa_id, 'AFOGADOS DA INGAZEIRA', 'PE'),
    (v_empresa_id, 'GURJÃO', 'PB')
  ON CONFLICT (empresa_id, nome) DO NOTHING;

  -- 5. Custos Unitários da Aba "Custo" (09/2026)
  INSERT INTO public.precos_material (empresa_id, material_codigo, mes_ano, preco_unitario, unidade) VALUES
    (v_empresa_id, 'brita12', '09/2026', 0.115942029, 'kg'),
    (v_empresa_id, 'brita19', '09/2026', 0.1111111111, 'kg'),
    (v_empresa_id, 'areia', '09/2026', 0.04, 'kg'),
    (v_empresa_id, 'po_pedra', '09/2026', 0.0, 'kg'),
    (v_empresa_id, 'cimento', '09/2026', 0.74, 'kg'),
    (v_empresa_id, 'aditivo', '09/2026', 4.0, 'litros')
  ON CONFLICT (empresa_id, material_codigo, mes_ano) DO NOTHING;

  -- 6. Traços Derivados das Dosagens da SJE
  INSERT INTO public.tracos (empresa_id, nome, descricao, fck_mpa, consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra, consumo_cimento, consumo_aditivo, ativo) VALUES
    (v_empresa_id, 'Traço SJE 325kg (B12:480 / B19:480 / Areia:845)', 'Traço padrão SJE 325kg de cimento', 30, 480, 480, 845, 0, 325, 3.25, true),
    (v_empresa_id, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)', 'Traço intermediário SJE 290kg de cimento', 25, 480, 480, 845, 0, 290, 2.75, true),
    (v_empresa_id, 'Traço SJE 290kg Especial (B12:370 / B19:580 / Areia:870)', 'Traço SJE brita pesada 290kg cimento', 25, 370, 580, 870, 0, 290, 2.30, true),
    (v_empresa_id, 'Traço SJE 280kg (B12:480 / B19:480 / Areia:845)', 'Traço econômico SJE 280kg cimento', 20, 480, 480, 845, 0, 280, 2.40, true),
    (v_empresa_id, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)', 'Traço estrutural SJE 320kg cimento', 30, 480, 480, 845, 0, 320, 3.125, true),
    (v_empresa_id, 'Traço SJE 340kg (B12:480 / B19:480 / Areia:845)', 'Traço alta resistência SJE 340kg cimento', 35, 480, 480, 845, 0, 340, 3.0, true),
    (v_empresa_id, 'Traço SJE 315kg (B12:480 / B19:480 / Areia:850)', 'Traço modificado SJE 315kg cimento', 30, 480, 480, 850, 0, 315, 3.25, true),
    (v_empresa_id, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)', 'Traço consolidado segunda quinzena SJE', 25, 480, 480, 850, 0, 290, 2.60, true),
    (v_empresa_id, 'Traço SJE 310kg (B12:480 / B19:480 / Areia:850)', 'Traço intermediário SJE 310kg cimento', 28, 480, 480, 850, 0, 310, 2.30, true)
  ON CONFLICT (empresa_id, nome) DO NOTHING;
END $$;
