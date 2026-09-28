-- 20260928150000_zerar_vendas_comissao_terceiros.sql
-- Solicitação do usuário: "RAIMUNDO MARIANO DA SILVA JUNIOR — Terceiro retirar da folha de vendas, nao tem comissao, pertence quinzena e mensal, incluir em mensal conforme quinzena e 60% sem desconto".
--
-- Zera vendas_obra, comissao e vendas_ajuda de todas as linhas de vinculo/tipo 'Terceiro' (ex.: Raimundo Mariano da Silva Junior e Marcio Luan da Silva).
-- A comissão de 0,5% é exclusiva de funcionários/vendedores da concreteira.
-- Alinha o mensal_liquido das linhas de terceiros para o valor base integral (R$ 4.270 no caso de Raimundo),
-- pois o cálculo de quinzena (40%) e mensal líquido (60%) é automático e sem desconto.

UPDATE public.folha_pagamento_linhas
SET
  vendas_obra = 0,
  comissao = 0,
  vendas_ajuda = 0,
  modo_calculo = 'Calculado',
  mensal_liquido = CASE
    WHEN bruto > 0 THEN bruto
    WHEN salario_base > 0 THEN salario_base
    ELSE mensal_liquido
  END,
  salario_liquido = CASE
    WHEN bruto > 0 THEN bruto
    WHEN salario_base > 0 THEN salario_base
    ELSE salario_liquido
  END,
  updated_at = NOW()
WHERE
  tipo = 'Terceiro'
  OR nome ILIKE '%RAIMUNDO MARIANO DA SILVA JUNIOR%'
  OR nome ILIKE '%MARCIO LUAN DA SILVA%';
