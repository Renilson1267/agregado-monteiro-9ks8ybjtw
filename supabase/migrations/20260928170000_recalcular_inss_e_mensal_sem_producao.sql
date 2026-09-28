-- Migration: Recalcular INSS sobre salário bruto e mensal_liquido sem produção
-- Produção (obras * valor_obra) é um pagamento à parte e fica apenas na aba GERAL.
-- Na tabela folha_pagamento_linhas, mensal_liquido = bruto - inss - ir + familia + gratificacao - quinzena - adiantamento + limpeza + sabado + ferias + ajuda_custo + vendas_ajuda + comissao (SEM producao).
-- Para Terceiros: permanecem sem desconto (mensal_liquido = bruto, quinzena = 40% de bruto, mensal = 60%).

DO $$
BEGIN
  -- 1. Recalcular mensal_liquido e salario_liquido para FUNCIONÁRIOS (sem produção)
  UPDATE public.folha_pagamento_linhas
  SET
    mensal_liquido = ROUND(
      COALESCE(bruto, 0)
      - COALESCE(inss, 0)
      - COALESCE(ir, 0)
      + COALESCE(familia, 0)
      + COALESCE(gratificacao, 0)
      - COALESCE(quinzena, 0)
      - COALESCE(quinzena_2, 0)
      - COALESCE(adiantamento, 0)
      + COALESCE(limpeza, 0)
      + COALESCE(sabado, 0)
      + COALESCE(feriado, 0)
      + COALESCE(ferias, 0)
      + COALESCE(ajuda_custo, 0)
      + COALESCE(vendas_ajuda, 0)
      + COALESCE(comissao, 0),
      2
    ),
    salario_liquido = ROUND(
      COALESCE(bruto, 0)
      - COALESCE(inss, 0)
      - COALESCE(ir, 0)
      + COALESCE(familia, 0)
      + COALESCE(gratificacao, 0)
      - COALESCE(quinzena, 0)
      - COALESCE(quinzena_2, 0)
      - COALESCE(adiantamento, 0)
      + COALESCE(limpeza, 0)
      + COALESCE(sabado, 0)
      + COALESCE(feriado, 0)
      + COALESCE(ferias, 0)
      + COALESCE(ajuda_custo, 0)
      + COALESCE(vendas_ajuda, 0)
      + COALESCE(comissao, 0),
      2
    ),
    updated_at = NOW()
  WHERE (tipo IS NULL OR tipo = 'Funcionario')
    AND nome NOT ILIKE '%RAIMUNDO MARIANO%'
    AND nome NOT ILIKE '%MARCIO LUAN%';

  -- 2. Garantir regra de Terceiros: mensal_liquido e salario_liquido = bruto (sem desconto)
  UPDATE public.folha_pagamento_linhas
  SET
    salario_liquido = bruto,
    mensal_liquido = bruto,
    inss = 0,
    ir = 0,
    comissao = 0,
    vendas_obra = 0,
    updated_at = NOW()
  WHERE tipo = 'Terceiro'
     OR nome ILIKE '%RAIMUNDO MARIANO%'
     OR nome ILIKE '%MARCIO LUAN%';

  -- 3. Atualizar total_liquido em folha_competencias com a soma do mensal_liquido
  UPDATE public.folha_competencias c
  SET
    total_liquido = COALESCE(s.soma_liq, 0),
    updated_at = NOW()
  FROM (
    SELECT competencia_id, SUM(COALESCE(mensal_liquido, 0)) AS soma_liq
    FROM public.folha_pagamento_linhas
    WHERE competencia_id IS NOT NULL
    GROUP BY competencia_id
  ) s
  WHERE c.id = s.competencia_id;

END $$;
