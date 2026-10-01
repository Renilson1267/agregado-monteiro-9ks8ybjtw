-- Migration: Corrigir mensal_liquido e salario_liquido das linhas da SJE do Valdercleiton (competências jun-set/2026)
-- Recalcula o mensal puro = bruto - inss - quinzena por linha, evitando embutir comissão ou ajuda de custo em duplicidade

UPDATE public.folha_pagamento_linhas
SET
  mensal_liquido = ROUND(COALESCE(bruto, 0) - COALESCE(inss, 0) - COALESCE(quinzena, 0), 2),
  salario_liquido = ROUND(COALESCE(bruto, 0) - COALESCE(inss, 0) - COALESCE(quinzena, 0), 2),
  updated_at = NOW()
WHERE
  UPPER(TRIM(nome)) LIKE '%VALDERCLEITON%'
  AND competencia IN ('2026-06', '2026-07', '2026-08', '2026-09');
