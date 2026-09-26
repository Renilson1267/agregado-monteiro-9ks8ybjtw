-- Seed catalog data: Materiais, Cidades, Motoristas, Veículos, Traços

INSERT INTO public.materiais (id, codigo, nome, unidade, estoque_minimo, ordem) VALUES
  ('11111111-1111-1111-1111-000000000001', 'cimento', 'Cimento CP II / CP IV', 'kg', 25000, 1),
  ('11111111-1111-1111-1111-000000000002', 'aditivo', 'Aditivo Plastificante', 'L', 1500, 2),
  ('11111111-1111-1111-1111-000000000003', 'areia', 'Areia Média/Lavada', 'kg', 50000, 3),
  ('11111111-1111-1111-1111-000000000004', 'brita12', 'Brita 12 (Brita 0)', 'kg', 40000, 4),
  ('11111111-1111-1111-1111-000000000005', 'brita19', 'Brita 19 (Brita 1)', 'kg', 40000, 5),
  ('11111111-1111-1111-1111-000000000006', 'po_pedra', 'Pó de Pedra', 'kg', 30000, 6)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  unidade = EXCLUDED.unidade,
  estoque_minimo = EXCLUDED.estoque_minimo,
  ordem = EXCLUDED.ordem;

INSERT INTO public.cidades (nome, uf) VALUES
  ('Monteiro', 'PB'),
  ('Sertânia', 'PE'),
  ('Prata', 'PB'),
  ('Sumé', 'PB'),
  ('Zabelê', 'PB'),
  ('São Sebastião do Umbuzeiro', 'PB'),
  ('Camalaú', 'PB'),
  ('Serra Branca', 'PB')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.motoristas (nome, ativo) VALUES
  ('José Carlos', true),
  ('Antônio Silva', true),
  ('Marcos Souza', true),
  ('Severino Lima', true),
  ('Raimundo Nonato', true)
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.veiculos (placa, modelo) VALUES
  ('QFB-4821', 'Betoneira 8m³ - Mercedes Benz 2729'),
  ('QFC-9102', 'Betoneira 8m³ - Ford Cargo 2629'),
  ('MNZ-3490', 'Betoneira 6m³ - VW Constellation 26.280'),
  ('KJR-7715', 'Betoneira 8m³ - Volvo VM 330')
ON CONFLICT (placa) DO NOTHING;

INSERT INTO public.tracos (id, nome, descricao, fck_mpa, consumo_brita12, consumo_brita19, consumo_areia, consumo_po_pedra, consumo_cimento, consumo_aditivo) VALUES
  ('22222222-2222-2222-2222-000000000001', 'FCK 25 MPa - Traço Padrão 480/480/850', 'Traço convencional 25 MPa (480 Brita 12, 480 Brita 19, 850 Areia, 320 Cimento, 2.5L Aditivo)', 25, 480, 480, 850, 0, 320, 2.5),
  ('22222222-2222-2222-2222-000000000002', 'FCK 30 MPa - Traço Estrutural 450/550/750', 'Traço alta resistência 30 MPa (450 Brita 12, 550 Brita 19, 750 Areia, 360 Cimento, 3.0L Aditivo)', 30, 450, 550, 750, 0, 360, 3.0),
  ('22222222-2222-2222-2222-000000000003', 'FCK 20 MPa - Traço Pavimentação 230/750/850', 'Traço econômico piso/pavimentação (230 Brita 12, 750 Brita 19, 850 Areia, 280 Cimento, 2.0L Aditivo)', 20, 230, 750, 850, 0, 280, 2.0),
  ('22222222-2222-2222-2222-000000000004', 'FCK 35 MPa - Traço Bombeável 300/700/780', 'Traço bombeável com aditivo redutor (300 Brita 12, 700 Brita 19, 780 Areia, 390 Cimento, 3.5L Aditivo)', 35, 300, 700, 780, 0, 390, 3.5),
  ('22222222-2222-2222-2222-000000000005', 'FCK 25 MPa - Misto com Pó de Pedra', 'Traço com substituição parcial de agregado por pó de pedra (400 Brita 12, 400 Brita 19, 500 Areia, 350 Pó de Pedra, 320 Cimento, 2.5L Aditivo)', 25, 400, 400, 500, 350, 320, 2.5)
ON CONFLICT (nome) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  fck_mpa = EXCLUDED.fck_mpa,
  consumo_brita12 = EXCLUDED.consumo_brita12,
  consumo_brita19 = EXCLUDED.consumo_brita19,
  consumo_areia = EXCLUDED.consumo_areia,
  consumo_po_pedra = EXCLUDED.consumo_po_pedra,
  consumo_cimento = EXCLUDED.consumo_cimento,
  consumo_aditivo = EXCLUDED.consumo_aditivo;
