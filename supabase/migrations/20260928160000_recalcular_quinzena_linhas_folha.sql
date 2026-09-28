-- Migration: Recalcular coluna quinzena de todas as linhas da folha
-- Regra vigente: QUINZENA = % da competência (padrão 40%) * SALÁRIO BRUTO
-- Aplica para todas as linhas de funcionários e terceiros em todas as competências.
-- Apenas linhas explicitamente marcadas com modo_calculo = 'Digitado' (se houver alguma) com quinzena > 0 seriam mantidas,
-- mas atualmente nenhuma linha foi digitada.

DO $$
BEGIN
  -- Atualiza o valor da quinzena em public.folha_pagamento_linhas
  -- Usando o percentual_quinzena da folha_competencias (ou 0.40 como padrão) e o salário bruto
  UPDATE public.folha_pagamento_linhas l
  SET
    quinzena = ROUND(COALESCE(l.bruto, 0) * COALESCE(c.percentual_quinzena, 0.40), 2),
    updated_at = NOW()
  FROM public.folha_competencias c
  WHERE l.competencia_id = c.id
    AND COALESCE(l.modo_calculo, 'Calculado') <> 'Digitado';

  -- Para quaisquer linhas que porventura não tenham competencia_id associado:
  UPDATE public.folha_pagamento_linhas l
  SET
    quinzena = ROUND(COALESCE(l.bruto, 0) * 0.40, 2),
    updated_at = NOW()
  WHERE l.competencia_id IS NULL
    AND COALESCE(l.modo_calculo, 'Calculado') <> 'Digitado';

  -- Garantir que para Terceiros o mensal_liquido continue sendo o bruto (pois a tela calcula quinzena 40% e mensal 60% sem desconto)
  -- e não haja confusão de dados
  UPDATE public.folha_pagamento_linhas
  SET
    salario_liquido = bruto,
    mensal_liquido = bruto
  WHERE tipo = 'Terceiro'
    AND bruto > 0;

END $$;
