-- Migration: Recalcular INSS e IRRF sobre o salário bruto para TODAS as linhas de folha de pagamento
-- Cobrindo todas as competências e ambas as empresas (Monteiro e SJE), incluindo linhas ocultas (ex: Renilson).
-- Base de cálculo fiscal: apenas SALÁRIO BRUTO (produção, limpeza, sábado, férias, ajuda, comissões fora da base).
-- Para Terceiros: permanecem sem descontos fiscais (inss = 0, ir = 0, quinzena 40%, mensal 60%).
-- Onde as tabelas oficiais estiverem zeradas/vazias para o ano, mantém 0.

DO $$
DECLARE
  rec RECORD;
  tabela RECORD;
  v_inss NUMERIC := 0;
  v_irrf NUMERIC := 0;
  v_familia NUMERIC := 0;
  v_mensal NUMERIC := 0;
  v_base_irrf NUMERIC := 0;
  v_ano INT;
  v_teto_inss NUMERIC;
  v_base_inss NUMERIC;
  v_faixa RECORD;
  v_ir_isento NUMERIC;
  v_ir_teto_gradual NUMERIC;
  v_ir_parcela_fixa NUMERIC;
  v_ir_coef_reducao NUMERIC;
  v_reducao NUMERIC;
  v_ir_tabela NUMERIC;
  v_qtd_filhos INT;
  v_teto_familia NUMERIC;
  v_cota_filho NUMERIC;
BEGIN
  -- Percorre todas as linhas de folha de pagamento
  FOR rec IN
    SELECT 
      l.id,
      l.empresa_id,
      l.competencia,
      l.tipo,
      l.nome,
      l.oculto,
      COALESCE(l.bruto, 0) AS bruto,
      COALESCE(l.filhos, 0) AS filhos,
      COALESCE(l.gratificacao, 0) AS gratificacao,
      COALESCE(l.quinzena, 0) AS quinzena,
      COALESCE(l.quinzena_2, 0) AS quinzena_2,
      COALESCE(l.adiantamento, 0) AS adiantamento,
      COALESCE(l.limpeza, 0) AS limpeza,
      COALESCE(l.sabado, 0) AS sabado,
      COALESCE(l.feriado, 0) AS feriado,
      COALESCE(l.ferias, 0) AS ferias,
      COALESCE(l.ajuda_custo, 0) AS ajuda_custo,
      COALESCE(l.vendas_ajuda, 0) AS vendas_ajuda,
      COALESCE(l.comissao, 0) AS comissao
    FROM public.folha_pagamento_linhas l
  LOOP
    -- 1. Regra de Terceiros: sem desconto fiscal, sem comissão
    IF rec.tipo = 'Terceiro' 
       OR rec.nome ILIKE '%RAIMUNDO MARIANO%' 
       OR rec.nome ILIKE '%MARCIO LUAN%' THEN
      UPDATE public.folha_pagamento_linhas
      SET
        inss = 0,
        ir = 0,
        familia = 0,
        comissao = 0,
        vendas_obra = 0,
        salario_liquido = rec.bruto,
        mensal_liquido = rec.bruto,
        updated_at = NOW()
      WHERE id = rec.id;

    ELSE
      -- 2. Funcionários (incluindo linhas ocultas como Renilson)
      -- Extrai o ano da competência (ex: '2026-09' -> 2026)
      BEGIN
        v_ano := SPLIT_PART(rec.competencia, '-', 1)::INT;
      EXCEPTION WHEN OTHERS THEN
        v_ano := 2026;
      END;

      -- Busca a tabela oficial da empresa para o ano (ou fallback para qualquer ano ativo da empresa)
      SELECT * INTO tabela
      FROM public.folha_tabelas_oficiais
      WHERE empresa_id = rec.empresa_id
        AND ano = v_ano
      LIMIT 1;

      IF NOT FOUND THEN
        SELECT * INTO tabela
        FROM public.folha_tabelas_oficiais
        WHERE empresa_id = rec.empresa_id
        ORDER BY ano DESC
        LIMIT 1;
      END IF;

      v_inss := 0;
      v_irrf := 0;
      v_familia := 0;

      -- Se existe tabela oficial configurada e com faixas válidas
      IF FOUND AND tabela.inss_faixas IS NOT NULL AND jsonb_array_length(tabela.inss_faixas) > 0 THEN
        IF rec.bruto > 0 THEN
          -- CÁLCULO DE INSS PROGRESSIVO SOBRE O SALÁRIO BRUTO
          v_teto_inss := COALESCE(tabela.teto_inss, 8475.55);
          v_base_inss := LEAST(rec.bruto, v_teto_inss);

          -- Encontra a faixa aplicável (ordenada por `de` ASC)
          FOR v_faixa IN
            SELECT (elem->>'de')::NUMERIC AS de,
                   (elem->>'ate')::NUMERIC AS ate,
                   (elem->>'aliquota')::NUMERIC AS aliquota,
                   (elem->>'deducao')::NUMERIC AS deducao
            FROM jsonb_array_elements(tabela.inss_faixas) AS elem
            ORDER BY (elem->>'de')::NUMERIC ASC
          LOOP
            IF v_base_inss >= v_faixa.de THEN
              v_inss := ROUND(GREATEST(0, (v_base_inss * v_faixa.aliquota) - COALESCE(v_faixa.deducao, 0)), 2);
            END IF;
          END LOOP;

          -- CÁLCULO DE SALÁRIO-FAMÍLIA SOBRE O BRUTO
          v_qtd_filhos := rec.filhos;
          v_teto_familia := COALESCE(tabela.familia_teto_salario, 1980.38);
          v_cota_filho := COALESCE(tabela.familia_cota_por_filho, 67.54);
          IF v_qtd_filhos > 0 AND rec.bruto <= v_teto_familia THEN
            v_familia := ROUND(v_qtd_filhos * v_cota_filho, 2);
          ELSE
            v_familia := 0;
          END IF;

          -- CÁLCULO DE IRRF SOBRE O SALÁRIO BRUTO
          -- Regra: se bruto <= ir_isento_ate (R$ 5.000,00), IRRF = 0
          v_ir_isento := COALESCE(tabela.ir_isento_ate, 5000.00);
          IF rec.bruto <= v_ir_isento THEN
            v_irrf := 0;
          ELSE
            -- Base IRRF = Bruto - INSS
            v_base_irrf := GREATEST(0, rec.bruto - v_inss);
            v_ir_tabela := 0;

            -- Percorre faixas do IRRF
            IF tabela.irrf_faixas IS NOT NULL AND jsonb_array_length(tabela.irrf_faixas) > 0 THEN
              FOR v_faixa IN
                SELECT (elem->>'de')::NUMERIC AS de,
                       (elem->>'ate')::NUMERIC AS ate,
                       (elem->>'aliquota')::NUMERIC AS aliquota,
                       (elem->>'deducao')::NUMERIC AS deducao
                FROM jsonb_array_elements(tabela.irrf_faixas) AS elem
                ORDER BY (elem->>'de')::NUMERIC ASC
              LOOP
                IF v_base_irrf >= v_faixa.de THEN
                  v_ir_tabela := GREATEST(0, (v_base_irrf * v_faixa.aliquota) - COALESCE(v_faixa.deducao, 0));
                END IF;
              END LOOP;

              v_irrf := v_ir_tabela;

              -- Redução gradual da Lei 15.270/2025 para base até ir_desconto_gradual_ate
              v_ir_teto_gradual := COALESCE(tabela.ir_desconto_gradual_ate, 7350.00);
              v_ir_parcela_fixa := COALESCE(tabela.ir_parcela_fixa_reducao, 978.62);
              v_ir_coef_reducao := COALESCE(tabela.ir_coeficiente_reducao, 0.133145);

              IF v_base_irrf > v_ir_isento 
                 AND v_base_irrf <= v_ir_teto_gradual 
                 AND v_ir_parcela_fixa > 0 
                 AND v_ir_coef_reducao > 0 THEN
                v_reducao := GREATEST(0, v_ir_parcela_fixa - (v_ir_coef_reducao * v_base_irrf));
                v_irrf := GREATEST(0, v_irrf - v_reducao);
              END IF;

              v_irrf := ROUND(v_irrf, 2);
            ELSE
              v_irrf := 0;
            END IF;
          END IF;
        END IF;
      END IF;

      -- CÁLCULO DO MENSAL LÍQUIDO (sem produção):
      -- MENSAL = bruto - inss - ir + familia + gratificacao - quinzena - quinzena_2 - adiantamento
      --          + limpeza + sabado + feriado + ferias + ajuda_custo + vendas_ajuda + comissao
      v_mensal := ROUND(
        rec.bruto
        - v_inss
        - v_irrf
        + v_familia
        + rec.gratificacao
        - rec.quinzena
        - rec.quinzena_2
        - rec.adiantamento
        + rec.limpeza
        + rec.sabado
        + rec.feriado
        + rec.ferias
        + rec.ajuda_custo
        + rec.vendas_ajuda
        + rec.comissao,
        2
      );

      UPDATE public.folha_pagamento_linhas
      SET
        inss = v_inss,
        ir = v_irrf,
        familia = v_familia,
        mensal_liquido = v_mensal,
        salario_liquido = v_mensal,
        base_inss = LEAST(rec.bruto, COALESCE(tabela.teto_inss, 8475.55)),
        base_irrf = GREATEST(0, rec.bruto - v_inss),
        inss_retido = v_inss,
        irrf_retido = v_irrf,
        updated_at = NOW()
      WHERE id = rec.id;
    END IF;
  END LOOP;

  -- 3. Atualizar totais de todas as competências
  UPDATE public.folha_competencias c
  SET
    total_colaboradores = COALESCE(s.qtd, 0),
    total_liquido = COALESCE(s.soma_mensal, 0),
    total_descontos = COALESCE(s.soma_descontos, 0),
    total_proventos = COALESCE(s.soma_proventos, 0),
    updated_at = NOW()
  FROM (
    SELECT 
      competencia_id,
      COUNT(*) AS qtd,
      SUM(COALESCE(mensal_liquido, 0)) AS soma_mensal,
      SUM(COALESCE(inss, 0) + COALESCE(ir, 0) + COALESCE(quinzena, 0) + COALESCE(adiantamento, 0)) AS soma_descontos,
      SUM(COALESCE(bruto, 0) + COALESCE(gratificacao, 0) + COALESCE(producao, 0) + COALESCE(comissao, 0) + COALESCE(familia, 0)) AS soma_proventos
    FROM public.folha_pagamento_linhas
    WHERE competencia_id IS NOT NULL
    GROUP BY competencia_id
  ) s
  WHERE c.id = s.competencia_id;

END $$;
