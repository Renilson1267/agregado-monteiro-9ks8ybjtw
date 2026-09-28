-- Migration: Inserir linhas de folha do legado GC MIX para 2026-09
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
  ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'JOSÉ ILTON LACERDA R. JUNIOR', 'MOTORISTA BOMBISTA', 'Funcionario', 'MOTORISTA BOMBISTA', 'SJE', 2520, 2520, 0, '1563/52004-8', '', '', 62, 20, 1240, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3910, 0, 3910, 3910, 'Calculado', false, false, 'id1006', null),
  ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'JOSÉ MARINALDO PEREIRA DE ARAÚJO', 'BALANCEIRO', 'Funcionario', 'BALANCEIRO', 'SJE', 2520, 2520, 0, '6240/251525-4', '', '', 50, 20, 1000, 100, 50, 0, 0, 0, 0, 0, 0, 0, 3670, 0, 3670, 3670, 'Calculado', false, false, 'id1007', '70581240430'),
  ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'PATRÍCIA DE LIMA GONÇALVES', 'SECRETARIA', 'Funcionario', 'SECRETARIA', 'SJE', 2080, 2080, 0, '6045/7335-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2080, 0, 2080, 2080, 'Calculado', false, false, 'id1008', '11169396496'),
  ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'VALDERCLEITON FREIRE DE OLIVEIRA', 'VENDEDOR', 'Funcionario', 'VENDEDOR', 'SJE', 2520, 2520, 0, '6347/396600-4', '', '', 0, 20, 0, 0, 0, 0, 0, 1300832.38, 6504.16, 1100, 0, 0, 10124.16, 0, 10124.16, 10124.16, 'Calculado', false, false, 'id1009', '10130785431'),
  ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'RENILSON FERREIRA DE MELO', 'ENG. ELETRICO', 'Funcionario', 'ENG. ELETRICO', 'SJE', 7000, 7000, 0, '', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2000, 9000, 0, 9000, 9000, 'Calculado', true, false, 'id1010', null),
  ('22222222-2222-2222-2222-222222222222'::uuid, '2026-09', 'RAIMUNDO MARIANO DA SILVA JUNIOR', 'Terceiro', 'Terceiro', 'Terceiro', 'SJE', 4270, 4270, 0, '', 'raimundojunior100@gmail.com', 'raimundojunior100@gmail.com', 0, 20, 0, 0, 0, 0, 1000, 169884, 3897.68, 1000, 0, 0, 9167.68, 0, 9167.68, 9167.68, 'Digitado', false, false, 'terc_1', null),
  
  ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'CARLOS WILLINGTON FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2520, 2520, 0, 'ag3205 / c/c 81429-6', '10349879419', '10349879419', 50, 20, 1000, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3720, 0, 3720, 3720, 'Calculado', false, false, 'id1011', '10349879419'),
  ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'CRISTIANO VIRGULINO CORDEIRO', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 0, 'ag5781 / c/c 26103-3', '83996926111', '83996926111', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1012', '11954383460'),
  ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'EDILSON PEREIRA DE OLIVEIRA', 'VIGIA', 'Funcionario', 'VIGIA', 'MONTEIRO', 2200, 2200, 0, 'ag6347 / c/c 529292-1', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2200, 0, 2200, 2200, 'Calculado', false, false, 'id1013', '08347788405'),
  ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'GUILHERME ALVES CORDEIRO DO AMARAL', 'ADM', 'Funcionario', 'ADM', 'MONTEIRO', 4000, 4000, 0, 'ag1563 / c/c 82960-9', '', '', 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4000, 0, 4000, 4000, 'Calculado', false, false, 'id1014', '09236130488'),
  ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'JOSÉ CLAUDIO MOURA BARBOSA', 'AJUDANTE', 'Funcionario', 'AJUDANTE', 'MONTEIRO', 1720, 1720, 1, 'ag5781 / c/c 26096-7', '83999280696', '83999280696', 50, 20, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2720, 0, 2720, 2720, 'Calculado', false, false, 'id1015', '09789135408'),
  ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'JULIANO CESAR FIRMINO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998136003', '83998136003', 31, 20, 620, 0, 0, 0, 200, 0, 0, 0, 0, 0, 3230, 0, 3230, 3230, 'Calculado', false, false, 'id1016', '05371714448'),
  ('11111111-1111-1111-1111-111111111111'::uuid, '2026-09', 'VICTOR EMANOEL ROMÃO DA SILVA', 'MOTORISTA', 'Funcionario', 'MOTORISTA', 'MONTEIRO', 2410, 2410, 0, '', '83998297676', '83998297676', 0, 20, 0, 0, 0, 0, 200, 0, 0, 0, 0, 0, 2610, 0, 2610, 2610, 'Calculado', false, false, 'id1017', null)
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

UPDATE public.folha_pagamento_linhas l
SET funcionario_id = f.id
FROM public.funcionarios f
WHERE l.empresa_id = f.empresa_id
  AND lower(trim(l.nome)) = lower(trim(f.nome))
  AND l.funcionario_id IS NULL;
