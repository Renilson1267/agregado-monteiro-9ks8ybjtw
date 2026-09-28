-- Migração de importação completa dos dados da Folha GC MIX
-- Backup legado: 18 funcionários, 2 terceiros, ~30 competências (2023-07 a 2026-09)
-- Totalmente idempotente

DO $$
DECLARE
  v_emp_sje uuid := '22222222-2222-2222-2222-222222222222';
  v_emp_monteiro uuid := '11111111-1111-1111-1111-111111111111';
BEGIN

  -- 1. FUNCIONÁRIOS SJE
  -- Arlindo Leite de Brito Junior
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_sje, 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', '40883990482', '2026-03-02', true, '', 2410, 0, '', '87999146340', false, false, 'SJE')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- Carlos Alberto Ferreira
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_sje, 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', '07713625445', '2025-09-01', true, '', 2410, 0, '1563/82316-4', '', false, false, 'SJE')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- Irinaldo dos Santos Brito
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_sje, 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', '07075099477', '2022-11-01', true, '', 2410, 0, '1563/76509-1', '', false, false, 'SJE')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- José Ednaldo Xavier Soares
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_sje, 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', '10410100447', '2025-04-01', true, '', 1720, 1, '3506/336083-1', '', false, false, 'SJE')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- Jose Pedro da Silva
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_sje, 'JOSE PEDRO DA SILVA', 'AJUDANTE', '46089700894', '2026-02-02', true, '', 1720, 2, '', '87996349221', false, false, 'SJE')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- José Eugenio Brito Alves
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_sje, 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', '04285666421', '2022-10-01', true, '', 2410, 0, '6240/255425-10', '', false, false, 'SJE')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- José Ilton Lacerda Ramalho Junior (pode não ter CPF no backup)
  IF EXISTS (SELECT 1 FROM public.funcionarios WHERE empresa_id = v_emp_sje AND (cpf = '04480839496' OR lower(TRIM(nome)) LIKE '%ILTON%')) THEN
    UPDATE public.funcionarios SET
      nome = 'JOSÉ ILTON LACERDA R. JUNIOR',
      funcao = 'MOTORISTA BOMBISTA',
      bruto = 2520,
      filhos = 0,
      conta = '1563/52004-8',
      pix = '',
      inativo = false,
      oculto = false,
      unidade = 'SJE',
      updated_at = now()
    WHERE empresa_id = v_emp_sje AND (cpf = '04480839496' OR lower(TRIM(nome)) LIKE '%ILTON%');
  ELSE
    INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
    VALUES (v_emp_sje, 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', '04480839496', NULL, true, '', 2520, 0, '1563/52004-8', '', false, false, 'SJE');
  END IF;

  -- José Marinaldo Pereira de Araújo
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_sje, 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', '70581240430', '2022-01-17', true, '', 2520, 0, '6240/251525-4', '', false, false, 'SJE')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- Patrícia de Lima Gonçalves
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_sje, 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', '11169396496', '2022-01-17', true, '', 2080, 0, '6045/7335-1', '', false, false, 'SJE')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- Valdercleiton Freire de Oliveira
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_sje, 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', '10130785431', '2025-09-01', true, '', 2520, 0, '6347/396600-4', '', false, false, 'SJE')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- Renilson Ferreira de Melo (SJE, sem CPF no backup, oculto)
  IF EXISTS (SELECT 1 FROM public.funcionarios WHERE empresa_id = v_emp_sje AND lower(TRIM(nome)) LIKE '%RENILSON%') THEN
    UPDATE public.funcionarios SET
      nome = 'RENILSON FERREIRA DE MELO',
      funcao = 'ENG. ELETRICO',
      bruto = 7000,
      filhos = 0,
      conta = '',
      pix = '',
      inativo = false,
      oculto = true,
      unidade = 'SJE',
      updated_at = now()
    WHERE empresa_id = v_emp_sje AND lower(TRIM(nome)) LIKE '%RENILSON%';
  ELSE
    INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
    VALUES (v_emp_sje, 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', NULL, NULL, true, '', 7000, 0, '', '', false, true, 'SJE');
  END IF;

  -- 2. FUNCIONÁRIOS MONTEIRO (7)
  -- Carlos Willington Firmino da Silva
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_monteiro, 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', '10349879419', '2026-07-02', true, '', 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', false, false, 'MONTEIRO')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- Cristiano Virgulino Cordeiro
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_monteiro, 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', '11954383460', '2026-07-03', true, '', 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', false, false, 'MONTEIRO')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- Edilson Pereira de Oliveira
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_monteiro, 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', '08347788405', '2025-11-15', true, '', 2200, 0, 'ag6347 / c/c 529292-1', '', false, false, 'MONTEIRO')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- Guilherme Alves Cordeiro do Amaral
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_monteiro, 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', '09236130488', '2025-12-04', true, '', 4000, 0, 'ag1563 / c/c 82960-9', '', false, false, 'MONTEIRO')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- José Claudio Moura Barbosa
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_monteiro, 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', '09789135408', '2026-07-02', true, '', 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', false, false, 'MONTEIRO')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- Juliano Cesar Firmino da Silva
  INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
  VALUES (v_emp_monteiro, 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', '05371714448', '2026-08-03', true, '', 2410, 0, '', '83998136003', false, false, 'MONTEIRO')
  ON CONFLICT (empresa_id, cpf) WHERE ((cpf IS NOT NULL) AND (cpf <> ''))
  DO UPDATE SET nome = EXCLUDED.nome, funcao = EXCLUDED.funcao, data_admissao = EXCLUDED.data_admissao, ativo = EXCLUDED.ativo, bruto = EXCLUDED.bruto, filhos = EXCLUDED.filhos, conta = EXCLUDED.conta, pix = EXCLUDED.pix, inativo = EXCLUDED.inativo, oculto = EXCLUDED.oculto, unidade = EXCLUDED.unidade, updated_at = now();

  -- Victor Emanoel Romão da Silva (MONTEIRO, sem CPF)
  IF EXISTS (SELECT 1 FROM public.funcionarios WHERE empresa_id = v_emp_monteiro AND lower(TRIM(nome)) LIKE '%VICTOR%EMANOEL%') THEN
    UPDATE public.funcionarios SET
      nome = 'VICTOR EMANOEL ROMÃO DA SILVA',
      funcao = 'MOTORISTA',
      bruto = 2410,
      filhos = 0,
      conta = '',
      pix = '83998297676',
      inativo = false,
      oculto = false,
      unidade = 'MONTEIRO',
      updated_at = now()
    WHERE empresa_id = v_emp_monteiro AND lower(TRIM(nome)) LIKE '%VICTOR%EMANOEL%';
  ELSE
    INSERT INTO public.funcionarios (empresa_id, nome, funcao, cpf, data_admissao, ativo, observacoes, bruto, filhos, conta, pix, inativo, oculto, unidade)
    VALUES (v_emp_monteiro, 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', NULL, NULL, true, '', 2410, 0, '', '83998297676', false, false, 'MONTEIRO');
  END IF;

  -- 3. TERCEIROS (2)
  -- Raimundo Mariano (SJE)
  INSERT INTO public.folha_terceiros (empresa_id, nome, bruto, conta, pix, obs, unidade, ativo)
  VALUES (v_emp_sje, 'RAIMUNDO MARIANO DA SILVA JUNIOR', 4270, '', 'raimundojunior100@gmail.com', 'Terceiro — folha à parte, sem desconto', 'SJE', true)
  ON CONFLICT (empresa_id, lower(TRIM(nome)))
  DO UPDATE SET bruto = EXCLUDED.bruto, conta = EXCLUDED.conta, pix = EXCLUDED.pix, obs = EXCLUDED.obs, unidade = EXCLUDED.unidade, ativo = EXCLUDED.ativo, updated_at = now();

  -- Marcio Luan da Silva (Monteiro)
  INSERT INTO public.folha_terceiros (empresa_id, nome, bruto, conta, pix, obs, unidade, ativo)
  VALUES (v_emp_monteiro, 'MARCIO LUAN DA SILVA', 0, '', '12175804410', 'Comissão de vendas', 'MONTEIRO', true)
  ON CONFLICT (empresa_id, lower(TRIM(nome)))
  DO UPDATE SET bruto = EXCLUDED.bruto, conta = EXCLUDED.conta, pix = EXCLUDED.pix, obs = EXCLUDED.obs, unidade = EXCLUDED.unidade, ativo = EXCLUDED.ativo, updated_at = now();

END $$;
