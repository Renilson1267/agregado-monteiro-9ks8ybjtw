-- Migration: Importar todos os lançamentos da Folha de Pagamento do Backup GC MIX (2023-07 a 2026-09)
-- Multi-empresa (SJE e Monteiro), garantindo idempotência e cálculo exato das regras do backup legado.

DO $$
BEGIN

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2023-07', 2023, 7, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-07', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-07', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-07', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-07', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-07', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-07', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-07', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-07', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-07', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 4000000, 20000, 0, 0, 0, 22520, 0, 22520, 22520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-07', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-07', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-07', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2023-07', 2023, 7, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-07', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-07', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-07', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-07', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-07', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-07', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-07', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2023-08', 2023, 8, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-08', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-08', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-08', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-08', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-08', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-08', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-08', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-08', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-08', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 4000000, 20000, 0, 0, 0, 22520, 0, 22520, 22520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-08', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-08', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-08', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2023-08', 2023, 8, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-08', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-08', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-08', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-08', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-08', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-08', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-08', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2023-09', 2023, 9, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-09', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-09', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-09', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-09', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-09', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-09', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-09', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-09', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-09', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-09', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-09', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-09', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4270, 0, 4270, 4270, 'Calculado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2023-09', 2023, 9, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-09', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-09', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-09', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-09', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-09', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-09', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-09', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2023-10', 2023, 10, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-10', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-10', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-10', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-10', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-10', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-10', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-10', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-10', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-10', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-10', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-10', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-10', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4270, 0, 4270, 4270, 'Calculado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2023-10', 2023, 10, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-10', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-10', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-10', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-10', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-10', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-10', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-10', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2023-11', 2023, 11, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-11', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 41, 20, 820, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3380, 0, 3380, 3380, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-11', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 49, 20, 980, 200, 50, 0, 0, 0, 0, 0, 0, 0, 3640, 0, 3640, 3640, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-11', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3560, 0, 3560, 3560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-11', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-11', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 44, 20, 880, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3440, 0, 3440, 3440, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-11', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-11', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-11', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-11', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-11', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-11', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 10000, 50, 0, 0, 0, 2570, 0, 2570, 2570, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-11', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2023-11', 2023, 11, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-11', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-11', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2920, 0, 2920, 2920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-11', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-11', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-11', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-11', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-11', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2023-12', 2023, 12, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-12', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-12', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-12', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-12', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-12', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-12', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-12', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-12', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-12', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-12', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-12', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2023-12', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4270, 0, 4270, 4270, 'Calculado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2023-12', 2023, 12, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-12', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-12', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-12', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-12', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-12', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-12', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2023-12', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-01', 2024, 1, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-01', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-01', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-01', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-01', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-01', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-01', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-01', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-01', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-01', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-01', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-01', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-01', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4270, 0, 4270, 4270, 'Calculado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2024-01', 2024, 1, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-01', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-01', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-01', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-01', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-01', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-01', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-01', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-02', 2024, 2, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-02', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 10, 20, 200, 200, 0, 0, 0, 0, 0, 0, 0, 0, 2810, 0, 2810, 2810, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-02', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-02', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-02', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-02', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-02', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-02', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-02', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-02', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-02', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-02', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-02', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4270, 0, 4270, 4270, 'Calculado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2024-02', 2024, 2, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-02', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-02', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-02', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-02', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-02', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-02', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-02', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-03', 2024, 3, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-03', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 41, 20, 820, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3380, 0, 3380, 3380, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-03', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 49, 20, 980, 200, 50, 0, 0, 0, 0, 0, 0, 0, 3640, 0, 3640, 3640, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-03', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3560, 0, 3560, 3560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-03', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-03', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 44, 20, 880, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3440, 0, 3440, 3440, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-03', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-03', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-03', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-03', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-03', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-03', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-03', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2024-03', 2024, 3, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-03', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-03', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2920, 0, 2920, 2920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-03', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-03', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-03', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-03', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-03', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-04', 2024, 4, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-04', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-04', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-04', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-04', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-04', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-04', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-04', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-04', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-04', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-04', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-04', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-04', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4270, 0, 4270, 4270, 'Calculado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2024-04', 2024, 4, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-04', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-04', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-04', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-04', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-04', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-04', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-04', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-05', 2024, 5, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-05', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-05', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-05', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-05', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-05', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-05', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-05', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-05', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-05', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-05', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-05', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-05', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4270, 0, 4270, 4270, 'Calculado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2024-05', 2024, 5, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-05', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-05', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-05', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-05', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-05', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-05', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-05', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-06', 2024, 6, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-06', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-06', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-06', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-06', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-06', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-06', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-06', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-06', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-06', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-06', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-06', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-06', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4270, 0, 4270, 4270, 'Calculado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2024-06', 2024, 6, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-06', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-06', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-06', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-06', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-06', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-06', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-06', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-07', 2024, 7, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-07', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-07', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-07', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-07', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-07', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-07', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-07', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-07', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-07', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-07', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-07', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 100000, 500, 0, 0, 0, 3020, 0, 3020, 3020, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-07', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 100000, 2500, 0, 0, 0, 6770, 0, 6770, 6770, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2024-07', 2024, 7, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-07', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-07', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-07', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-07', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-07', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-07', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-07', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-08', 2024, 8, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-08', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 41, 20, 820, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3380, 0, 3380, 3380, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-08', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 49, 20, 980, 200, 50, 0, 0, 0, 0, 0, 0, 0, 3640, 0, 3640, 3640, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-08', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3560, 0, 3560, 3560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-08', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-08', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 44, 20, 880, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3440, 0, 3440, 3440, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-08', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-08', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-08', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-08', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-08', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-08', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-08', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 100000, 2500, 0, 0, 0, 6770, 0, 6770, 6770, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2024-08', 2024, 8, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-08', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-08', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2920, 0, 2920, 2920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-08', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-08', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-08', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-08', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-08', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-09', 2024, 9, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-09', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-09', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-09', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-09', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-09', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-09', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-09', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-09', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-09', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-09', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-09', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-09', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 1000000, 13000, 0, 0, 0, 17270, 0, 17270, 17270, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2024-09', 2024, 9, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-09', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-09', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-09', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-09', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-09', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-09', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-09', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-10', 2024, 10, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-10', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 41, 20, 820, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3380, 0, 3380, 3380, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-10', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 49, 20, 980, 200, 50, 0, 0, 0, 0, 0, 0, 0, 3640, 0, 3640, 3640, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-10', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3560, 0, 3560, 3560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-10', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-10', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 44, 20, 880, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3440, 0, 3440, 3440, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-10', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-10', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-10', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-10', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-10', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-10', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 10000, 50, 0, 0, 0, 2570, 0, 2570, 2570, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-10', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 1000, 1000000, 13000, 1000, 0, 0, 18270, 0, 18270, 18270, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2024-10', 2024, 10, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-10', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-10', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2920, 0, 2920, 2920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-10', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-10', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-10', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-10', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-10', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-11', 2024, 11, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-11', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-11', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-11', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-11', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-11', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-11', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-11', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-11', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-11', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-11', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-11', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-11', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4270, 0, 4270, 4270, 'Calculado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2024-11', 2024, 11, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-11', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-11', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-11', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-11', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-11', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-11', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-11', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2024-12', 2024, 12, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-12', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-12', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-12', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-12', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-12', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-12', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-12', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-12', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-12', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-12', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-12', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2024-12', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4270, 0, 4270, 4270, 'Calculado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2024-12', 2024, 12, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-12', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-12', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-12', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-12', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-12', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-12', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2024-12', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2025-01', 2025, 1, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-01', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-01', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-01', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-01', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-01', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-01', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-01', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-01', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-01', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-01', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-01', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-01', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4270, 0, 4270, 4270, 'Calculado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2025-01', 2025, 1, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-01', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2520, 0, 2520, 2520, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-01', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-01', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-01', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-01', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-01', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-01', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2410, 0, 2410, 2410, 'Calculado', false, false, 'id1017', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2025-02', 2025, 2, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-02', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 41, 20, 820, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3380, 0, 3380, 3380, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-02', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 49, 20, 980, 200, 50, 0, 0, 0, 0, 0, 0, 0, 3640, 0, 3640, 3640, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-02', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3560, 0, 3560, 3560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-02', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-02', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-02', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 44, 20, 880, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3440, 0, 3440, 3440, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-02', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-02', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-02', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-02', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-02', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-02', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2025-02', 2025, 2, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-02', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-02', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2920, 0, 2920, 2920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-02', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-02', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-02', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-02', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-02', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2025-03', 2025, 3, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-03', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 41, 20, 820, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3380, 0, 3380, 3380, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-03', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 49, 20, 980, 200, 50, 0, 0, 0, 0, 0, 0, 0, 3640, 0, 3640, 3640, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-03', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3560, 0, 3560, 3560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-03', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-03', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-03', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 44, 20, 880, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3440, 0, 3440, 3440, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-03', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-03', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-03', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-03', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-03', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-03', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2025-03', 2025, 3, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-03', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-03', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2920, 0, 2920, 2920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-03', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-03', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-03', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-03', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-03', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2025-04', 2025, 4, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-04', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 41, 20, 820, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3380, 0, 3380, 3380, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-04', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 49, 20, 980, 200, 50, 0, 0, 0, 0, 0, 0, 0, 3640, 0, 3640, 3640, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-04', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3560, 0, 3560, 3560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-04', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-04', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-04', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 44, 20, 880, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3440, 0, 3440, 3440, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-04', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-04', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-04', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-04', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-04', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-04', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2025-04', 2025, 4, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-04', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-04', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2920, 0, 2920, 2920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-04', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-04', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-04', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-04', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-04', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2025-05', 2025, 5, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-05', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-05', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 200, 50, 0, 0, 0, 0, 0, 0, 0, 2660, 0, 2660, 2660, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-05', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-05', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 1870, 0, 1870, 1870, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-05', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 1870, 0, 1870, 1870, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-05', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-05', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2670, 0, 2670, 2670, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-05', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2670, 0, 2670, 2670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-05', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-05', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-05', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-05', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2025-05', 2025, 5, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-05', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-05', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 1920, 0, 1920, 1920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-05', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1720, 0, 1720, 1720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-05', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-05', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-05', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-05', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2025-06', 2025, 6, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-06', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-06', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 200, 50, 0, 0, 0, 0, 0, 0, 0, 2660, 0, 2660, 2660, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-06', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-06', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 1870, 0, 1870, 1870, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-06', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 1870, 0, 1870, 1870, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-06', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-06', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2670, 0, 2670, 2670, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-06', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2670, 0, 2670, 2670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-06', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-06', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-06', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-06', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2025-06', 2025, 6, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-06', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-06', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 1920, 0, 1920, 1920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-06', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-06', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-06', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-06', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-06', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2025-07', 2025, 7, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-07', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-07', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 200, 50, 0, 0, 0, 0, 0, 0, 0, 2660, 0, 2660, 2660, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-07', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-07', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 1870, 0, 1870, 1870, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-07', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 1870, 0, 1870, 1870, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-07', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-07', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2670, 0, 2670, 2670, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-07', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2670, 0, 2670, 2670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-07', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-07', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-07', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-07', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2025-07', 2025, 7, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-07', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-07', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 1920, 0, 1920, 1920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-07', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-07', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-07', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-07', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-07', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2025-08', 2025, 8, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-08', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-08', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 200, 50, 0, 0, 0, 0, 0, 0, 0, 2660, 0, 2660, 2660, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-08', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-08', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 1870, 0, 1870, 1870, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-08', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 1870, 0, 1870, 1870, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-08', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-08', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2670, 0, 2670, 2670, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-08', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2670, 0, 2670, 2670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-08', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-08', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-08', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-08', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2025-08', 2025, 8, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-08', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-08', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 1920, 0, 1920, 1920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-08', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-08', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-08', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-08', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-08', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2025-09', 2025, 9, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-09', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-09', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 200, 50, 0, 0, 0, 0, 0, 0, 0, 2660, 0, 2660, 2660, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-09', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-09', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 1870, 0, 1870, 1870, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-09', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 1870, 0, 1870, 1870, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-09', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-09', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2670, 0, 2670, 2670, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-09', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2670, 0, 2670, 2670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-09', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-09', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-09', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-09', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2025-09', 2025, 9, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-09', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-09', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 1920, 0, 1920, 1920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-09', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-09', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-09', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-09', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-09', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2025-10', 2025, 10, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-10', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-10', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 0, 20, 0, 200, 50, 0, 0, 0, 0, 0, 0, 0, 2660, 0, 2660, 2660, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-10', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-10', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 1870, 0, 1870, 1870, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-10', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 1870, 0, 1870, 1870, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-10', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2560, 0, 2560, 2560, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-10', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2670, 0, 2670, 2670, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-10', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 0, 20, 0, 100, 50, 0, 0, 0, 0, 0, 0, 0, 2670, 0, 2670, 2670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-10', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-10', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-10', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-10', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2025-10', 2025, 10, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-10', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-10', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 1920, 0, 1920, 1920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-10', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-10', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-10', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-10', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-10', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2025-11', 2025, 11, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-11', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 39, 20, 780, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3340, 0, 3340, 3340, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-11', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 47, 20, 940, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3500, 0, 3500, 3500, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-11', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 40, 20, 800, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3360, 0, 3360, 3360, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-11', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 52, 20, 1040, 50, 0, 0, 0, 0, 0, 0, 0, 0, 2810, 0, 2810, 2810, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-11', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 52, 20, 1040, 50, 0, 0, 0, 0, 0, 0, 0, 0, 2810, 0, 2810, 2810, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-11', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 40, 20, 800, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3360, 0, 3360, 3360, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-11', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 54, 20, 1080, 100, 0, 0, 0, 0, 0, 0, 0, 0, 3700, 0, 3700, 3700, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-11', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 47, 20, 940, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3610, 0, 3610, 3610, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-11', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-11', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-11', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-11', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2025-11', 2025, 11, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-11', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-11', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 1920, 0, 1920, 1920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-11', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-11', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-11', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-11', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-11', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2025-12', 2025, 12, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-12', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 39, 20, 780, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3340, 0, 3340, 3340, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-12', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 47, 20, 940, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3500, 0, 3500, 3500, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-12', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 40, 20, 800, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3360, 0, 3360, 3360, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-12', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 52, 20, 1040, 50, 0, 0, 0, 0, 0, 0, 0, 0, 2810, 0, 2810, 2810, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-12', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 52, 20, 1040, 50, 0, 0, 0, 0, 0, 0, 0, 0, 2810, 0, 2810, 2810, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-12', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 40, 20, 800, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3360, 0, 3360, 3360, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-12', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 54, 20, 1080, 100, 0, 0, 0, 0, 0, 0, 0, 0, 3700, 0, 3700, 3700, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-12', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 47, 20, 940, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3610, 0, 3610, 3610, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-12', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-12', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-12', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2025-12', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2025-12', 2025, 12, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-12', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-12', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 1920, 0, 1920, 1920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-12', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-12', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-12', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-12', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2025-12', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2026-01', 2026, 1, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-01', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 39, 20, 780, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3340, 0, 3340, 3340, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-01', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 47, 20, 940, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3500, 0, 3500, 3500, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-01', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 40, 20, 800, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3360, 0, 3360, 3360, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-01', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 52, 20, 1040, 50, 0, 0, 0, 0, 0, 0, 0, 0, 2810, 0, 2810, 2810, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-01', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 52, 20, 1040, 50, 0, 0, 0, 0, 0, 0, 0, 0, 2810, 0, 2810, 2810, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-01', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 40, 20, 800, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3360, 0, 3360, 3360, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-01', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 54, 20, 1080, 100, 0, 0, 0, 0, 0, 0, 0, 0, 3700, 0, 3700, 3700, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-01', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 47, 20, 940, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3610, 0, 3610, 3610, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-01', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-01', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-01', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-01', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2026-01', 2026, 1, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-01', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-01', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 1920, 0, 1920, 1920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-01', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-01', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-01', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-01', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-01', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2026-02', 2026, 2, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-02', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 39, 20, 780, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3340, 0, 3340, 3340, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-02', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 47, 20, 940, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3500, 0, 3500, 3500, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-02', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 40, 20, 800, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3360, 0, 3360, 3360, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-02', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 52, 20, 1040, 50, 0, 0, 0, 0, 0, 0, 0, 0, 2810, 0, 2810, 2810, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-02', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 52, 20, 1040, 50, 0, 0, 0, 0, 0, 0, 0, 0, 2810, 0, 2810, 2810, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-02', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 40, 20, 800, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3360, 0, 3360, 3360, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-02', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 54, 20, 1080, 100, 0, 0, 0, 0, 0, 0, 0, 0, 3700, 0, 3700, 3700, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-02', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 47, 20, 940, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3610, 0, 3610, 3610, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-02', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-02', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-02', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-02', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2026-02', 2026, 2, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-02', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 41, 20, 820, 0, 50, 0, 200, 0, 0, 0, 0, 0, 3590, 0, 3590, 3590, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-02', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 41, 20, 820, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2540, 0, 2540, 2540, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-02', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 41, 20, 820, 0, 50, 0, 0, 0, 0, 0, 0, 0, 2590, 0, 2590, 2590, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-02', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 31, 20, 620, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3230, 0, 3230, 3230, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-02', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-02', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-02', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2026-03', 2026, 3, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-03', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 39, 20, 780, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3340, 0, 3340, 3340, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-03', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 47, 20, 940, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3500, 0, 3500, 3500, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-03', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 40, 20, 800, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3360, 0, 3360, 3360, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-03', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 52, 20, 1040, 50, 0, 0, 0, 0, 0, 0, 0, 0, 2810, 0, 2810, 2810, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-03', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 52, 20, 1040, 50, 0, 0, 0, 0, 0, 0, 0, 0, 2810, 0, 2810, 2810, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-03', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 40, 20, 800, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3360, 0, 3360, 3360, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-03', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 54, 20, 1080, 100, 0, 0, 0, 0, 0, 0, 0, 0, 3700, 0, 3700, 3700, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-03', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 47, 20, 940, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3610, 0, 3610, 3610, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-03', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1321718.11, 6608.59, 1100, 0, 0, 10228.59, 0, 10228.59, 10228.59, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-03', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-03', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-03', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2026-03', 2026, 3, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-03', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 41, 20, 820, 0, 50, 0, 200, 0, 0, 0, 0, 0, 3590, 0, 3590, 3590, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-03', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 41, 20, 820, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2540, 0, 2540, 2540, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-03', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 41, 20, 820, 0, 50, 0, 0, 0, 0, 0, 0, 0, 2590, 0, 2590, 2590, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-03', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 31, 20, 620, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3230, 0, 3230, 3230, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-03', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-03', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-03', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2026-04', 2026, 4, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-04', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 41, 20, 820, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3380, 0, 3380, 3380, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-04', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 49, 20, 980, 200, 50, 0, 0, 0, 0, 0, 0, 0, 3640, 0, 3640, 3640, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-04', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3560, 0, 3560, 3560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-04', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-04', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-04', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 44, 20, 880, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3440, 0, 3440, 3440, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-04', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-04', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-04', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-04', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-04', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-04', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2026-04', 2026, 4, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-04', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-04', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2920, 0, 2920, 2920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-04', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-04', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-04', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-04', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-04', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2026-05', 2026, 5, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-05', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 41, 20, 820, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3380, 0, 3380, 3380, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-05', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 49, 20, 980, 200, 50, 0, 0, 0, 0, 0, 0, 0, 3640, 0, 3640, 3640, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-05', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3560, 0, 3560, 3560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-05', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-05', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-05', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 44, 20, 880, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3440, 0, 3440, 3440, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-05', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-05', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-05', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 0, 0, 0, 9024.16, 0, 9024.16, 9024.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-05', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-05', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-05', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 0, 169884, 3897.68, 0, 0, 0, 8167.68, 0, 8167.68, 8167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2026-05', 2026, 5, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-05', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-05', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2920, 0, 2920, 2920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-05', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-05', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-05', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-05', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-05', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2026-06', 2026, 6, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-06', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 41, 20, 820, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3380, 0, 3380, 3380, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-06', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 49, 20, 980, 200, 50, 0, 0, 0, 0, 0, 0, 0, 3640, 0, 3640, 3640, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-06', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3560, 0, 3560, 3560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-06', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-06', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-06', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 44, 20, 880, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3440, 0, 3440, 3440, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-06', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-06', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-06', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 1100, 0, 0, 10124.16, 0, 10124.16, 10124.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-06', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-06', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-06', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 1000, 169884, 3897.68, 1000, 0, 0, 9167.68, 0, 9167.68, 9167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2026-06', 2026, 6, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-06', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-06', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2920, 0, 2920, 2920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-06', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-06', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-06', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-06', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-06', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2026-07', 2026, 7, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-07', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 41, 20, 820, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3380, 0, 3380, 3380, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-07', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 49, 20, 980, 200, 50, 0, 0, 0, 0, 0, 0, 0, 3640, 0, 3640, 3640, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-07', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3560, 0, 3560, 3560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-07', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-07', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-07', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 44, 20, 880, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3440, 0, 3440, 3440, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-07', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-07', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-07', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 1100, 0, 0, 10124.16, 0, 10124.16, 10124.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-07', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-07', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7000, 0, 7000, 7000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-07', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 1000, 169884, 3897.68, 1000, 0, 0, 9167.68, 0, 9167.68, 9167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2026-07', 2026, 7, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-07', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-07', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2920, 0, 2920, 2920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-07', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-07', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-07', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-07', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-07', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2026-08', 2026, 8, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-08', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 41, 20, 820, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3380, 0, 3380, 3380, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-08', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 49, 20, 980, 200, 50, 0, 0, 0, 0, 0, 0, 0, 3640, 0, 3640, 3640, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-08', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3560, 0, 3560, 3560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-08', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-08', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-08', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 44, 20, 880, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3440, 0, 3440, 3440, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-08', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-08', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-08', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 1100, 0, 0, 10124.16, 0, 10124.16, 10124.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-08', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-08', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-08', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 1000, 169884, 3897.68, 1000, 0, 0, 9167.68, 0, 9167.68, 9167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2026-08', 2026, 8, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-08', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-08', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2920, 0, 2920, 2920, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-08', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-08', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-08', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-08', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-08', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488')
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('22222222-2222-2222-2222-222222222222', '2026-09', 2026, 9, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'ARLINDO LEITE DE BRITO JUNIOR', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '', '87999146340', '87999146340', 41, 20, 820, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3380, 0, 3380, 3380, 'Calculado', false, false, 'id1000', '40883990482'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'CARLOS ALBERTO FERREIRA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/82316-4', '', '', 49, 20, 980, 200, 50, 0, 0, 0, 0, 0, 0, 0, 3640, 0, 3640, 3640, 'Calculado', false, false, 'id1001', '07713625445'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'IRINALDO DOS SANTOS BRITO', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '1563/76509-1', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3560, 0, 3560, 3560, 'Calculado', false, false, 'id1002', '07075099477'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'JOSÉ EDNALDO XAVIER SOARES', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 1, '3506/336083-1', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1003', '10410100447'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'JOSE PEDRO DA SILVA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'SJE', 1720, 1720, 2, '', '87996349221', '87996349221', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3110, 0, 3110, 3110, 'Calculado', false, false, 'id1004', '46089700894'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'JOSÉ EUGENIO BRITO ALVES', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'SJE', 2410, 2410, 0, '6240/255425-10', '', '', 44, 20, 880, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3440, 0, 3440, 3440, 'Calculado', false, false, 'id1005', '04285666421'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 1100, 0, 0, 10124.16, 0, 10124.16, 10124.16, 'Calculado', false, false, 'id1009', '10130785431'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', NULL),
    ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 1000, 169884, 3897.68, 1000, 0, 0, 9167.68, 0, 9167.68, 9167.68, 'Digitado', false, false, 'terc_1', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  INSERT INTO public.folha_competencias (empresa_id, competencia, ano, mes, status, observacoes)
  VALUES ('11111111-1111-1111-1111-111111111111', '2026-09', 2026, 9, 'ABERTA', 'Importado do backup legado')
  ON CONFLICT (empresa_id, competencia) DO NOTHING;
  INSERT INTO public.folha_pagamento_linhas (
    empresa_id, competencia_id, competencia, nome, cargo, tipo, funcao, unidade,
    bruto, salario_base, filhos, conta, chave_pix, pix,
    obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo,
    vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao,
    total_proventos, total_descontos, salario_liquido, mensal_liquido,
    modo_calculo, oculto, inativo, backup_id, cpf
  )
  SELECT
    v.empresa_id, c.id, v.competencia, v.nome, v.cargo, v.tipo, v.funcao, v.unidade,
    v.bruto, v.salario_base, v.filhos, v.conta, v.chave_pix, v.pix,
    v.obras, v.valor_obra, v.producao, v.limpeza, v.sabado, v.ferias, v.ajuda_custo,
    v.vendas_obra, v.comissao, v.vendas_ajuda, v.adiantamento, v.gratificacao,
    v.total_proventos, v.total_descontos, v.salario_liquido, v.mensal_liquido,
    v.modo_calculo, v.oculto, v.inativo, v.backup_id, v.cpf
  FROM (VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1012', '11954383460'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 31, 20, 620, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3230, 0, 3230, 3230, 'Calculado', false, false, 'id1016', '05371714448'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', NULL),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
    ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'MARCIO LUAN DA SILVA', 'Terceiro', 'Terceiro', 'Terceiro', 'MONTEIRO', 0, 0, 0, '', '12175804410', '12175804410', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'Calculado', false, false, 'terc_0', NULL)
  ) AS v(empresa_id, competencia, nome, cargo, tipo, funcao, unidade, bruto, salario_base, filhos, conta, chave_pix, pix, obras, valor_obra, producao, limpeza, sabado, ferias, ajuda_custo, vendas_obra, comissao, vendas_ajuda, adiantamento, gratificacao, total_proventos, total_descontos, salario_liquido, mensal_liquido, modo_calculo, oculto, inativo, backup_id, cpf)
  JOIN public.folha_competencias c ON c.empresa_id = v.empresa_id AND c.competencia = v.competencia
  ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
  DO UPDATE SET
    competencia_id = EXCLUDED.competencia_id,
    cargo = EXCLUDED.cargo,
    tipo = EXCLUDED.tipo,
    funcao = EXCLUDED.funcao,
    unidade = EXCLUDED.unidade,
    bruto = EXCLUDED.bruto,
    salario_base = EXCLUDED.salario_base,
    filhos = EXCLUDED.filhos,
    conta = EXCLUDED.conta,
    chave_pix = EXCLUDED.chave_pix,
    pix = EXCLUDED.pix,
    obras = EXCLUDED.obras,
    valor_obra = EXCLUDED.valor_obra,
    producao = EXCLUDED.producao,
    limpeza = EXCLUDED.limpeza,
    sabado = EXCLUDED.sabado,
    ferias = EXCLUDED.ferias,
    ajuda_custo = EXCLUDED.ajuda_custo,
    vendas_obra = EXCLUDED.vendas_obra,
    comissao = EXCLUDED.comissao,
    vendas_ajuda = EXCLUDED.vendas_ajuda,
    adiantamento = EXCLUDED.adiantamento,
    gratificacao = EXCLUDED.gratificacao,
    total_proventos = EXCLUDED.total_proventos,
    total_descontos = EXCLUDED.total_descontos,
    salario_liquido = EXCLUDED.salario_liquido,
    mensal_liquido = EXCLUDED.mensal_liquido,
    modo_calculo = EXCLUDED.modo_calculo,
    oculto = EXCLUDED.oculto,
    inativo = EXCLUDED.inativo,
    backup_id = EXCLUDED.backup_id,
    cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
    updated_at = now();

  -- Vincula funcionario_id existente nas linhas
  UPDATE public.folha_pagamento_linhas l
  SET funcionario_id = f.id
  FROM public.funcionarios f
  WHERE l.empresa_id = f.empresa_id
    AND lower(trim(l.nome)) = lower(trim(f.nome))
    AND l.funcionario_id IS NULL;

  -- Recalcula totais em todas as competências
  UPDATE public.folha_competencias c
  SET
    total_colaboradores = COALESCE(s.cont, 0),
    total_proventos = COALESCE(s.tot_prov, 0),
    total_descontos = COALESCE(s.tot_desc, 0),
    total_liquido = COALESCE(s.tot_liq, 0),
    updated_at = now()
  FROM (
    SELECT
      competencia_id,
      count(*) as cont,
      sum(total_proventos) as tot_prov,
      sum(total_descontos) as tot_desc,
      sum(mensal_liquido) as tot_liq
    FROM public.folha_pagamento_linhas
    GROUP BY competencia_id
  ) s
  WHERE c.id = s.competencia_id;

END $$;
