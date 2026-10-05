-- Migration: restaurar_tracos_sje_e_reapontar_cargas_legadas
-- (1) RESTAURAR os traços oficiais da SJE que sumiram do catálogo:
--     Hoje a SJE só tem F15B01S12 CP II F 40 (260kg) e F45B01S12 CP II F 40 (420kg).
--     Recriar via migration (idempotente, INSERT ... WHERE NOT EXISTS) os traços padrão da SJE
--     no formato oficial "FxxB01S12 CP II F 40":
--     - F10: 240kg cimento, aditivo 2.4, brita 480/480, areia 845, agua 0
--     - F20: 270kg cimento, aditivo 2.7, brita 480/480, areia 845, agua 0
--     - F25: 290kg cimento, aditivo 2.9, brita 480/480, areia 845, agua 0
--     - F30: 320kg cimento, aditivo 3.2, brita 480/480, areia 845, agua 0
--     - F35: 380kg cimento, aditivo 3.5, brita 480/480, areia 845, agua 0
--     - F40: 390kg cimento, aditivo 3.9, brita 480/480, areia 845, agua 0
--
-- (2) REAPONTAR as cargas históricas da SJE com traco_id nulo e nome legado tipo "Traço SJE ...":
--     - 260kg -> F15B01S12 CP II F 40
--     - 270/280kg -> F20B01S12 CP II F 40
--     - 290kg (inclui "290kg Especial" e "290kg Padrão") -> F25B01S12 CP II F 40
--     - 300/310/315/320/325/330/340kg -> F30B01S12 CP II F 40
--     Preenchendo traco_id com o traço padrão SJE correspondente e normalizando traco_nome para "FxxB01S12 CP II F 40".

DO $$
DECLARE
  v_emp_sje uuid := '22222222-2222-2222-2222-222222222222'::uuid;

  v_sje_f10 uuid;
  v_sje_f15 uuid;
  v_sje_f20 uuid;
  v_sje_f25 uuid;
  v_sje_f30 uuid;
  v_sje_f35 uuid;
  v_sje_f40 uuid;
  v_sje_f45 uuid;
BEGIN
  ----------------------------------------------------------------------
  -- 1. RESTAURAR TRAÇOS OFICIAIS SJE NO CATÁLOGO
  ----------------------------------------------------------------------

  -- F10: 240kg cimento, aditivo 2.4, brita 480/480, areia 845
  SELECT id INTO v_sje_f10
  FROM public.tracos
  WHERE empresa_id = v_emp_sje AND nome = 'F10B01S12 CP II F 40';

  IF v_sje_f10 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_sje, 'F10B01S12 CP II F 40', 'Traço F10 Padrão Oficial SJE', 10,
      240, 480, 480, 845, 0, 0, 2.4, true
    ) RETURNING id INTO v_sje_f10;
  END IF;

  -- F15: já existente (260kg cimento, aditivo 2.4, brita 480/480, areia 845)
  SELECT id INTO v_sje_f15
  FROM public.tracos
  WHERE empresa_id = v_emp_sje AND nome = 'F15B01S12 CP II F 40';

  IF v_sje_f15 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_sje, 'F15B01S12 CP II F 40', 'Traço F15 Padrão Oficial SJE', 15,
      260, 480, 480, 845, 0, 0, 2.4, true
    ) RETURNING id INTO v_sje_f15;
  END IF;

  -- F20: 270kg cimento, aditivo 2.7, brita 480/480, areia 845
  SELECT id INTO v_sje_f20
  FROM public.tracos
  WHERE empresa_id = v_emp_sje AND nome = 'F20B01S12 CP II F 40';

  IF v_sje_f20 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_sje, 'F20B01S12 CP II F 40', 'Traço F20 Padrão Oficial SJE', 20,
      270, 480, 480, 845, 0, 0, 2.7, true
    ) RETURNING id INTO v_sje_f20;
  END IF;

  -- F25: 290kg cimento, aditivo 2.9, brita 480/480, areia 845
  SELECT id INTO v_sje_f25
  FROM public.tracos
  WHERE empresa_id = v_emp_sje AND nome = 'F25B01S12 CP II F 40';

  IF v_sje_f25 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_sje, 'F25B01S12 CP II F 40', 'Traço F25 Padrão Oficial SJE', 25,
      290, 480, 480, 845, 0, 0, 2.9, true
    ) RETURNING id INTO v_sje_f25;
  END IF;

  -- F30: 320kg cimento, aditivo 3.2, brita 480/480, areia 845
  SELECT id INTO v_sje_f30
  FROM public.tracos
  WHERE empresa_id = v_emp_sje AND nome = 'F30B01S12 CP II F 40';

  IF v_sje_f30 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_sje, 'F30B01S12 CP II F 40', 'Traço F30 Padrão Oficial SJE', 30,
      320, 480, 480, 845, 0, 0, 3.2, true
    ) RETURNING id INTO v_sje_f30;
  END IF;

  -- F35: 380kg cimento, aditivo 3.5, brita 480/480, areia 845
  SELECT id INTO v_sje_f35
  FROM public.tracos
  WHERE empresa_id = v_emp_sje AND nome = 'F35B01S12 CP II F 40';

  IF v_sje_f35 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_sje, 'F35B01S12 CP II F 40', 'Traço F35 Padrão Oficial SJE', 35,
      380, 480, 480, 845, 0, 0, 3.5, true
    ) RETURNING id INTO v_sje_f35;
  END IF;

  -- F40: 390kg cimento, aditivo 3.9, brita 480/480, areia 845
  SELECT id INTO v_sje_f40
  FROM public.tracos
  WHERE empresa_id = v_emp_sje AND nome = 'F40B01S12 CP II F 40';

  IF v_sje_f40 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_sje, 'F40B01S12 CP II F 40', 'Traço F40 Padrão Oficial SJE', 40,
      390, 480, 480, 845, 0, 0, 3.9, true
    ) RETURNING id INTO v_sje_f40;
  END IF;

  -- F45: já existente (420kg cimento, aditivo 4.2, brita 480/480, areia 845)
  SELECT id INTO v_sje_f45
  FROM public.tracos
  WHERE empresa_id = v_emp_sje AND nome = 'F45B01S12 CP II F 40';

  IF v_sje_f45 IS NULL THEN
    INSERT INTO public.tracos (
      empresa_id, nome, descricao, fck_mpa,
      consumo_cimento, consumo_brita12, consumo_brita19, consumo_areia,
      consumo_po_pedra, consumo_agua, consumo_aditivo, ativo
    ) VALUES (
      v_emp_sje, 'F45B01S12 CP II F 40', 'Traço F45 Padrão Oficial SJE', 45,
      420, 480, 480, 845, 0, 0, 4.2, true
    ) RETURNING id INTO v_sje_f45;
  END IF;

  ----------------------------------------------------------------------
  -- 2. REAPONTAR AS CARGAS HISTÓRICAS DA SJE
  ----------------------------------------------------------------------

  -- 2.a) 260kg -> F15B01S12 CP II F 40
  UPDATE public.cargas
  SET traco_id = v_sje_f15,
      traco_nome = 'F15B01S12 CP II F 40'
  WHERE empresa_id = v_emp_sje
    AND (traco_nome ILIKE '%260kg%' OR traco_id IS NULL AND traco_nome ILIKE '%260%');

  -- 2.b) 270kg / 280kg -> F20B01S12 CP II F 40
  UPDATE public.cargas
  SET traco_id = v_sje_f20,
      traco_nome = 'F20B01S12 CP II F 40'
  WHERE empresa_id = v_emp_sje
    AND (
      traco_nome ILIKE '%270kg%'
      OR traco_nome ILIKE '%280kg%'
      OR (traco_id IS NULL AND (traco_nome ILIKE '%270%' OR traco_nome ILIKE '%280%'))
    );

  -- 2.c) 290kg (inclui "290kg Especial" e "290kg Padrão") -> F25B01S12 CP II F 40
  UPDATE public.cargas
  SET traco_id = v_sje_f25,
      traco_nome = 'F25B01S12 CP II F 40'
  WHERE empresa_id = v_emp_sje
    AND (
      traco_nome ILIKE '%290kg%'
      OR (traco_id IS NULL AND traco_nome ILIKE '%290%')
    );

  -- 2.d) 300/310/315/320/325/330/340kg -> F30B01S12 CP II F 40
  UPDATE public.cargas
  SET traco_id = v_sje_f30,
      traco_nome = 'F30B01S12 CP II F 40'
  WHERE empresa_id = v_emp_sje
    AND (
      traco_nome ILIKE '%300kg%'
      OR traco_nome ILIKE '%310kg%'
      OR traco_nome ILIKE '%315kg%'
      OR traco_nome ILIKE '%320kg%'
      OR traco_nome ILIKE '%325kg%'
      OR traco_nome ILIKE '%330kg%'
      OR traco_nome ILIKE '%340kg%'
      OR (
        traco_id IS NULL
        AND (
          traco_nome ILIKE '%300%'
          OR traco_nome ILIKE '%310%'
          OR traco_nome ILIKE '%315%'
          OR traco_nome ILIKE '%320%'
          OR traco_nome ILIKE '%325%'
          OR traco_nome ILIKE '%330%'
          OR traco_nome ILIKE '%340%'
        )
      )
    );

END $$;
