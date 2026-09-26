-- Migration: Importação das 114 cargas diárias da unidade SJE e baixas de estoque
-- Saldo final esperado: Cimento = 4326 kg, Aditivo = 3018 litros
-- Total M3 = 831 m3
-- A anomalia da última linha ("2466-") corresponde a consumo de 24 litros de aditivo (saldo 3042 - 24 = 3018).

DO $$
DECLARE
  v_empresa_id UUID := '22222222-2222-2222-2222-222222222222'::uuid;
  v_mat_brita12 UUID;
  v_mat_brita19 UUID;
  v_mat_areia UUID;
  v_mat_po_pedra UUID;
  v_mat_cimento UUID;
  v_mat_aditivo UUID;
  
  -- Record para loop
  r RECORD;
BEGIN
  -- Verificar se já importou
  IF EXISTS (SELECT 1 FROM public.cargas WHERE empresa_id = v_empresa_id) THEN
    RETURN;
  END IF;

  -- Obter IDs dos materiais da SJE
  SELECT id INTO v_mat_brita12 FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'brita12';
  SELECT id INTO v_mat_brita19 FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'brita19';
  SELECT id INTO v_mat_areia FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'areia';
  SELECT id INTO v_mat_po_pedra FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'po_pedra';
  SELECT id INTO v_mat_cimento FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'cimento';
  SELECT id INTO v_mat_aditivo FROM public.materiais WHERE empresa_id = v_empresa_id AND codigo = 'aditivo';

  -- Criar tabela temporária para as 114 cargas
  CREATE TEMP TABLE temp_sje_cargas (
    num INT,
    dt DATE,
    vol NUMERIC,
    b12 NUMERIC,
    b19 NUMERIC,
    areia NUMERIC,
    po NUMERIC,
    cim NUMERIC,
    adit NUMERIC,
    traco TEXT
  ) ON COMMIT DROP;

  -- Inserir dados das cargas
  INSERT INTO temp_sje_cargas VALUES
  (1, '2026-09-01', 8, 3840, 3840, 6760, 0, 2600, 26, 'Traço SJE 325kg (B12:480 / B19:480 / Areia:845)'),
  (2, '2026-09-01', 8, 3840, 3840, 6760, 0, 2600, 26, 'Traço SJE 325kg (B12:480 / B19:480 / Areia:845)'),
  (3, '2026-09-01', 8, 3840, 3840, 6760, 0, 2600, 26, 'Traço SJE 325kg (B12:480 / B19:480 / Areia:845)'),
  (4, '2026-09-01', 8, 3840, 3840, 6760, 0, 2600, 26, 'Traço SJE 325kg (B12:480 / B19:480 / Areia:845)'),
  (5, '2026-09-01', 8, 3840, 3840, 6760, 0, 2320, 19, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (6, '2026-09-01', 8, 3840, 3840, 6760, 0, 2320, 19, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (7, '2026-09-02', 8, 3840, 3840, 6760, 0, 2320, 21, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (8, '2026-09-02', 8, 3840, 3840, 6760, 0, 2320, 23, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (9, '2026-09-02', 7, 2590, 4060, 6090, 0, 2030, 16, 'Traço SJE 290kg Especial (B12:370 / B19:580 / Areia:870)'),
  (10, '2026-09-02', 8, 3840, 3840, 6760, 0, 2320, 23, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (11, '2026-09-02', 3.5, 1295, 2030, 3045, 0, 1015, 8, 'Traço SJE 290kg Especial (B12:370 / B19:580 / Areia:870)'),
  (12, '2026-09-02', 8, 3840, 3840, 6760, 0, 2320, 23, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (13, '2026-09-02', 8, 3840, 3840, 6760, 0, 2320, 21, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (14, '2026-09-02', 5, 2400, 2400, 4225, 0, 1450, 11, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (15, '2026-09-02', 8, 3840, 3840, 6760, 0, 2320, 21, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (16, '2026-09-03', 8, 3840, 3840, 6760, 0, 2320, 23, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (17, '2026-09-03', 8, 3840, 3840, 6760, 0, 2320, 23, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (18, '2026-09-03', 8, 3840, 3840, 6760, 0, 2320, 24, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (19, '2026-09-03', 8, 3840, 3840, 6760, 0, 2320, 23, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (20, '2026-09-03', 8, 3840, 3840, 6760, 0, 2320, 23, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (21, '2026-09-04', 8, 3840, 3840, 6760, 0, 2320, 24, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (22, '2026-09-04', 7, 3360, 3360, 5915, 0, 2030, 18, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (23, '2026-09-04', 10, 4800, 4800, 8450, 0, 2900, 29, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (24, '2026-09-04', 8, 3840, 3840, 6760, 0, 2320, 17, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (25, '2026-09-04', 8, 3840, 3840, 6760, 0, 2320, 17, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (26, '2026-09-04', 8, 3840, 3840, 6760, 0, 2320, 16, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (27, '2026-09-04', 8, 3840, 3840, 6760, 0, 2320, 16, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (28, '2026-09-04', 8, 3840, 3840, 6760, 0, 2320, 20, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (29, '2026-09-04', 7.5, 3600, 3600, 6337.5, 0, 2175, 18, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (30, '2026-09-04', 7.5, 3600, 3675, 6337.5, 0, 2175, 16, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (31, '2026-09-04', 7, 3360, 3360, 5915, 0, 1960, 16, 'Traço SJE 280kg (B12:480 / B19:480 / Areia:845)'),
  (32, '2026-09-08', 6.5, 3120, 3120, 5492.5, 0, 1820, 16, 'Traço SJE 280kg (B12:480 / B19:480 / Areia:845)'),
  (33, '2026-09-09', 8, 3840, 3840, 6760, 0, 2560, 25, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)'),
  (34, '2026-09-09', 8, 3840, 3840, 6760, 0, 2560, 25, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)'),
  (35, '2026-09-09', 8, 3840, 3840, 6760, 0, 2560, 25, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)'),
  (36, '2026-09-09', 8, 7680, 0, 6760, 0, 2320, 14, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (37, '2026-09-09', 8, 3840, 3840, 6760, 0, 2320, 21, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (38, '2026-09-09', 8, 3840, 3840, 6760, 0, 2320, 21, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (39, '2026-09-09', 5, 2400, 2400, 4225, 0, 1450, 11, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (40, '2026-09-10', 4.5, 2160, 2160, 3802.5, 0, 1440, 12, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)'),
  (41, '2026-09-10', 6, 2880, 2880, 5070, 0, 1740, 15, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (42, '2026-09-10', 5, 2400, 2400, 4225, 0, 1450, 12, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (43, '2026-09-11', 10.5, 5040, 5040, 8872.5, 0, 3360, 33, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)'),
  (44, '2026-09-11', 4.5, 2160, 2160, 3802.5, 0, 1440, 14, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)'),
  (45, '2026-09-11', 7, 3360, 3360, 5915, 0, 2380, 21, 'Traço SJE 340kg (B12:480 / B19:480 / Areia:845)'),
  (46, '2026-09-11', 6, 2880, 2880, 5070, 0, 2040, 18, 'Traço SJE 340kg (B12:480 / B19:480 / Areia:845)'),
  (47, '2026-09-14', 8, 3840, 3840, 6760, 0, 2320, 24, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (48, '2026-09-14', 8, 3840, 3840, 6760, 0, 2320, 24, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (49, '2026-09-14', 6, 2880, 2880, 5070, 0, 1740, 14, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (50, '2026-09-14', 6, 2880, 2880, 5070, 0, 1740, 14, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (51, '2026-09-14', 7.5, 3600, 3600, 6337.5, 0, 2175, 18, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (52, '2026-09-14', 1, 480, 480, 845, 0, 290, 2, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (53, '2026-09-15', 8, 3840, 3840, 6760, 0, 2560, 26, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)'),
  (54, '2026-09-15', 8, 3840, 3840, 6760, 0, 2560, 26, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)'),
  (55, '2026-09-15', 8, 3840, 3840, 6760, 0, 2560, 26, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)'),
  (56, '2026-09-15', 10, 4800, 4800, 8450, 0, 2900, 23, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (57, '2026-09-15', 10, 4800, 4800, 8450, 0, 2900, 23, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (58, '2026-09-15', 4, 1920, 1920, 3380, 0, 1160, 10, 'Traço SJE 290kg (B12:480 / B19:480 / Areia:845)'),
  (59, '2026-09-16', 8, 3840, 3840, 6800, 0, 2520, 26, 'Traço SJE 315kg (B12:480 / B19:480 / Areia:850)'),
  (60, '2026-09-16', 8, 3840, 3840, 6800, 0, 2520, 26, 'Traço SJE 315kg (B12:480 / B19:480 / Areia:850)'),
  (61, '2026-09-16', 8, 3840, 3840, 6800, 0, 2520, 26, 'Traço SJE 315kg (B12:480 / B19:480 / Areia:850)'),
  (62, '2026-09-16', 10, 4800, 4800, 8500, 0, 3150, 31, 'Traço SJE 315kg (B12:480 / B19:480 / Areia:850)'),
  (63, '2026-09-16', 8, 3840, 3840, 6800, 0, 2520, 26, 'Traço SJE 315kg (B12:480 / B19:480 / Areia:850)'),
  (64, '2026-09-17', 7, 3360, 3360, 5950, 0, 2030, 16, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (65, '2026-09-17', 7, 3360, 3360, 5950, 0, 2030, 16, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (66, '2026-09-17', 6, 2880, 2880, 5100, 0, 1740, 14, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (67, '2026-09-17', 8, 3840, 3840, 6800, 0, 2320, 18, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (68, '2026-09-17', 7, 3360, 3360, 5950, 0, 2030, 16, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (69, '2026-09-17', 8.5, 4080, 4080, 7225, 0, 2465, 23, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (70, '2026-09-17', 8, 3840, 3840, 6800, 0, 2320, 21, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (71, '2026-09-18', 8, 3840, 3840, 6800, 0, 2320, 19, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (72, '2026-09-18', 8, 3840, 3840, 6800, 0, 2320, 19, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (73, '2026-09-18', 7.5, 3600, 3600, 6375, 0, 2175, 18, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (74, '2026-09-18', 7, 3360, 3360, 5950, 0, 2030, 16, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (75, '2026-09-18', 9.5, 4560, 4560, 8075, 0, 2755, 23, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (76, '2026-09-18', 6, 2880, 2880, 5100, 0, 1740, 16, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (77, '2026-09-18', 8, 3840, 3840, 6800, 0, 2320, 18, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (78, '2026-09-18', 7, 3360, 3360, 5950, 0, 2030, 16, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (79, '2026-09-18', 5, 2400, 2400, 4250, 0, 1450, 12, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (80, '2026-09-18', 6.5, 3120, 3120, 5525, 0, 1885, 15, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (81, '2026-09-21', 6, 2880, 2880, 5100, 0, 1740, 14, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (82, '2026-09-21', 7.5, 3600, 3600, 6375, 0, 2175, 18, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (83, '2026-09-21', 6, 2880, 2880, 5100, 0, 1920, 16, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)'),
  (84, '2026-09-21', 8, 3840, 3840, 6800, 0, 2320, 20, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (85, '2026-09-21', 5.5, 2640, 2640, 4675, 0, 1595, 12, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (86, '2026-09-21', 5, 2400, 2400, 4250, 0, 1450, 11, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (87, '2026-09-22', 8, 3840, 3840, 6800, 0, 2320, 18, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (88, '2026-09-22', 8, 3840, 3840, 6800, 0, 2320, 18, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (89, '2026-09-22', 8, 3840, 3840, 6800, 0, 2320, 18, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (90, '2026-09-22', 8, 3840, 3840, 6800, 0, 2320, 18, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (91, '2026-09-22', 8, 3840, 3840, 6800, 0, 2320, 18, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (92, '2026-09-22', 8, 3840, 3840, 6800, 0, 2320, 18, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (93, '2026-09-22', 5, 2400, 2400, 4250, 0, 1450, 11, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (94, '2026-09-22', 5, 2400, 2400, 4250, 0, 1450, 11, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (95, '2026-09-23', 6, 2880, 2880, 5100, 0, 1920, 19, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)'),
  (96, '2026-09-23', 6, 2880, 2880, 5100, 0, 1920, 19, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)'),
  (97, '2026-09-23', 6, 2880, 2880, 5100, 0, 1920, 19, 'Traço SJE 320kg (B12:480 / B19:480 / Areia:845)'),
  (98, '2026-09-23', 7, 3360, 3360, 5950, 0, 2030, 16, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (99, '2026-09-23', 6, 2880, 2880, 5100, 0, 1740, 14, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (100, '2026-09-24', 7.5, 3600, 3600, 6375, 0, 2175, 17, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (101, '2026-09-24', 7.5, 3600, 3600, 6375, 0, 2175, 17, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (102, '2026-09-24', 7, 3360, 3360, 5950, 0, 2030, 16, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (103, '2026-09-24', 7, 3360, 3360, 5950, 0, 2170, 16, 'Traço SJE 310kg (B12:480 / B19:480 / Areia:850)'),
  (104, '2026-09-24', 8, 3840, 3840, 6800, 0, 2320, 21, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (105, '2026-09-24', 4, 1920, 1920, 3400, 0, 1160, 8, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (106, '2026-09-25', 8, 3840, 3840, 6800, 0, 2320, 24, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (107, '2026-09-25', 7.5, 3600, 3600, 6375, 0, 2175, 22, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (108, '2026-09-25', 7.5, 3600, 3600, 6375, 0, 2175, 22, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (109, '2026-09-25', 7.5, 3600, 3600, 6375, 0, 2175, 22, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (110, '2026-09-25', 7.5, 3600, 3600, 6375, 0, 2175, 22, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (111, '2026-09-25', 9.5, 4560, 4560, 8075, 0, 2755, 28, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (112, '2026-09-25', 7.5, 3600, 3600, 6375, 0, 2175, 22, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  (113, '2026-09-25', 8, 3840, 3840, 6800, 0, 2320, 24, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)'),
  -- Linha 114: A anomalia da planilha original continha "2466-", que representa 24L consumidos na carga, levando o saldo final a 3018L (3042 - 24 = 3018).
  (114, '2026-09-25', 8, 3840, 3840, 6800, 0, 2320, 24, 'Traço SJE 290kg Padrão Areia 850 (B12:480 / B19:480 / Areia:850)');

  -- Inserir cargas e gerar baixas de estoque
  FOR r IN SELECT * FROM temp_sje_cargas ORDER BY num ASC LOOP
    DECLARE
      v_carga_id UUID := gen_random_uuid();
      v_doc_name TEXT := 'CARGA-SJE-' || LPAD(r.num::text, 4, '0');
    BEGIN
      INSERT INTO public.cargas (
        id,
        empresa_id,
        numero_carga,
        data,
        volume_m3,
        traco_nome,
        consumo_brita12,
        consumo_brita19,
        consumo_areia,
        consumo_po_pedra,
        consumo_cimento,
        consumo_aditivo,
        carga_zerada,
        observacao
      ) VALUES (
        v_carga_id,
        v_empresa_id,
        r.num,
        r.dt,
        r.vol,
        r.traco,
        r.b12,
        r.b19,
        r.areia,
        r.po,
        r.cim,
        r.adit,
        false,
        CASE WHEN r.num = 114 THEN 'Importado da planilha SJE. Aditivo ajustado da anomalia "2466-" para 24L.' ELSE 'Importado da planilha SJE' END
      );

      -- Baixas no estoque correspondentes
      IF r.cim > 0 THEN
        INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
        VALUES (v_empresa_id, v_mat_cimento, 'SAIDA', r.cim, r.dt, v_carga_id, v_doc_name, 'Consumo da carga ' || r.num || ' (' || r.vol || 'm³)');
      END IF;

      IF r.adit > 0 THEN
        INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
        VALUES (v_empresa_id, v_mat_aditivo, 'SAIDA', r.adit, r.dt, v_carga_id, v_doc_name, 'Consumo da carga ' || r.num || ' (' || r.vol || 'm³)');
      END IF;

      IF r.areia > 0 THEN
        INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
        VALUES (v_empresa_id, v_mat_areia, 'SAIDA', r.areia, r.dt, v_carga_id, v_doc_name, 'Consumo da carga ' || r.num || ' (' || r.vol || 'm³)');
      END IF;

      IF r.b12 > 0 THEN
        INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
        VALUES (v_empresa_id, v_mat_brita12, 'SAIDA', r.b12, r.dt, v_carga_id, v_doc_name, 'Consumo da carga ' || r.num || ' (' || r.vol || 'm³)');
      END IF;

      IF r.b19 > 0 THEN
        INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
        VALUES (v_empresa_id, v_mat_brita19, 'SAIDA', r.b19, r.dt, v_carga_id, v_doc_name, 'Consumo da carga ' || r.num || ' (' || r.vol || 'm³)');
      END IF;

      IF r.po > 0 THEN
        INSERT INTO public.movimentacoes_estoque (empresa_id, material_id, tipo, quantidade, data, carga_id, documento, observacao)
        VALUES (v_empresa_id, v_mat_po_pedra, 'SAIDA', r.po, r.dt, v_carga_id, v_doc_name, 'Consumo da carga ' || r.num || ' (' || r.vol || 'm³)');
      END IF;
    END;
  END LOOP;
END $$;
