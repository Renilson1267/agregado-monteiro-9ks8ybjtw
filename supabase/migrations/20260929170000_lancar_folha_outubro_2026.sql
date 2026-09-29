-- Migration: Lançar competência OUTUBRO/2026 (2026-10) nas duas empresas (Monteiro e SJE)
-- Copia funcionários ativos/ocultos e terceiros da competência 2026-09 como base.
-- Salários brutos, filhos, cargos, contas e dados cadastrais replicados de 2026-09.
-- Quinzena = 40% × salário bruto (padrão da competência).
-- INSS e IRRF calculados estritamente sobre o salário bruto usando folha_tabelas_oficiais 2026 ativas da empresa.
-- Salário-família calculado conforme tabela oficial 2026.
-- Mensal líquido SEM produção.
-- Variáveis zeradas para digitação posterior: obras=0, producao=0, limpeza=0, sabado=0, ferias=0, ajuda_custo=0, vendas_obra=0, comissao=0, vendas_ajuda=0, gratificacao=0, adiantamento=0, quinzena_2=0.
-- Terceiro SJE (Raimundo Mariano da Silva Júnior): fora de vendas, comissao=0, quinzena 40% (1.708,00), mensal 60% (2.562,00, totalizando bruto 4.270,00 sem desconto).
-- Terceiro Monteiro (Márcio Luan da Silva, eh_vendedor=true): bruto 0, quinzena 0, vendas 0, comissão 0 (recalculada quando vendas forem digitadas).

DO $$
DECLARE
  comp_rec RECORD;
  ref_linha RECORD;
  tabela RECORD;
  v_bruto NUMERIC;
  v_quinzena NUMERIC;
  v_inss NUMERIC;
  v_irrf NUMERIC;
  v_familia NUMERIC;
  v_mensal NUMERIC;
  v_base_irrf NUMERIC;
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
  v_is_raimundo BOOLEAN;
  v_is_marcio BOOLEAN;
  v_is_terceiro BOOLEAN;
BEGIN
  -- Percorre as competências 2026-10 para Monteiro e SJE
  FOR comp_rec IN
    SELECT id, empresa_id, competencia, COALESCE(percentual_quinzena, 0.40) AS pct_quinzena
    FROM public.folha_competencias
    WHERE competencia = '2026-10'
      AND empresa_id IN (
        '11111111-1111-1111-1111-111111111111'::uuid, -- Monteiro
        '22222222-2222-2222-2222-222222222222'::uuid  -- SJE
      )
  LOOP
    -- Carrega a tabela oficial de 2026 para a empresa
    SELECT * INTO tabela
    FROM public.folha_tabelas_oficiais
    WHERE empresa_id = comp_rec.empresa_id
      AND ano = 2026
    LIMIT 1;

    -- Percorre as linhas base de 2026-09 da mesma empresa
    FOR ref_linha IN
      SELECT *
      FROM public.folha_pagamento_linhas
      WHERE empresa_id = comp_rec.empresa_id
        AND competencia = '2026-09'
      ORDER BY nome ASC
    LOOP
      v_is_raimundo := (ref_linha.nome ILIKE '%RAIMUNDO MARIANO%');
      v_is_marcio := (ref_linha.nome ILIKE '%MARCIO LUAN%');
      v_is_terceiro := (ref_linha.tipo = 'Terceiro' OR v_is_raimundo OR v_is_marcio);

      v_bruto := COALESCE(ref_linha.bruto, 0);

      -- Regras específicas de terceiros
      IF v_is_marcio THEN
        -- Márcio Luan (Monteiro, vendedor autônomo): bruto 0, pagamento por comissão progressiva
        v_bruto := 0;
        v_quinzena := 0;
        v_inss := 0;
        v_irrf := 0;
        v_familia := 0;
        v_mensal := 0;
      ELSIF v_is_raimundo THEN
        -- Raimundo Mariano (SJE, terceiro): bruto 4.270, quinzena 40% (1.708), mensal 60% (2.562)
        v_quinzena := ROUND(v_bruto * comp_rec.pct_quinzena, 2);
        v_inss := 0;
        v_irrf := 0;
        v_familia := 0;
        v_mensal := ROUND(v_bruto - v_quinzena, 2); -- 60% restante
      ELSIF v_is_terceiro THEN
        v_quinzena := ROUND(v_bruto * comp_rec.pct_quinzena, 2);
        v_inss := 0;
        v_irrf := 0;
        v_familia := 0;
        v_mensal := ROUND(v_bruto - v_quinzena, 2);
      ELSE
        -- Funcionários (incluindo ocultos como Renilson)
        -- Quinzena = 40% × salário bruto
        v_quinzena := ROUND(v_bruto * comp_rec.pct_quinzena, 2);

        -- Cálculo INSS sobre salário bruto
        v_inss := 0;
        v_irrf := 0;
        v_familia := 0;

        IF v_bruto > 0 AND tabela.inss_faixas IS NOT NULL AND jsonb_array_length(tabela.inss_faixas) > 0 THEN
          v_teto_inss := COALESCE(tabela.teto_inss, 8475.55);
          v_base_inss := LEAST(v_bruto, v_teto_inss);

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
        END IF;

        -- Salário-Família
        v_qtd_filhos := COALESCE(ref_linha.filhos, 0);
        v_teto_familia := COALESCE(tabela.familia_teto_salario, 1980.38);
        v_cota_filho := COALESCE(tabela.familia_cota_por_filho, 67.54);
        IF v_qtd_filhos > 0 AND v_bruto <= v_teto_familia THEN
          v_familia := ROUND(v_qtd_filhos * v_cota_filho, 2);
        ELSE
          v_familia := 0;
        END IF;

        -- IRRF sobre (Bruto - INSS)
        v_ir_isento := COALESCE(tabela.ir_isento_ate, 5000.00);
        IF v_bruto <= v_ir_isento THEN
          v_irrf := 0;
        ELSE
          v_base_irrf := GREATEST(0, v_bruto - v_inss);
          v_ir_tabela := 0;

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
          END IF;
        END IF;

        -- Mensal Líquido SEM produção:
        -- Mensal = Bruto - INSS - IRRF + Família - Quinzena (variáveis extras zeradas)
        v_mensal := ROUND(v_bruto - v_inss - v_irrf + v_familia - v_quinzena, 2);
      END IF;

      -- Inserção ou atualização da linha para 2026-10
      INSERT INTO public.folha_pagamento_linhas (
        empresa_id,
        competencia_id,
        competencia,
        funcionario_id,
        nome,
        cargo,
        funcao,
        unidade,
        tipo,
        bruto,
        salario_base,
        filhos,
        quinzena,
        quinzena_2,
        inss,
        ir,
        familia,
        adiantamento,
        gratificacao,
        obras,
        valor_obra,
        producao,
        limpeza,
        sabado,
        feriado,
        ferias,
        ajuda_custo,
        vendas_obra,
        comissao,
        vendas_ajuda,
        salario_liquido,
        mensal_liquido,
        base_inss,
        base_irrf,
        inss_retido,
        irrf_retido,
        total_proventos,
        total_descontos,
        conta,
        pix,
        chave_pix,
        modo_calculo,
        oculto,
        inativo,
        cpf,
        matricula,
        observacao_linha,
        observacoes,
        itens_discriminados,
        created_at,
        updated_at
      ) VALUES (
        comp_rec.empresa_id,
        comp_rec.id,
        '2026-10',
        ref_linha.funcionario_id,
        ref_linha.nome,
        ref_linha.cargo,
        ref_linha.funcao,
        ref_linha.unidade,
        ref_linha.tipo,
        v_bruto,
        v_bruto,
        COALESCE(ref_linha.filhos, 0),
        v_quinzena,
        0,
        v_inss,
        v_irrf,
        v_familia,
        0, -- adiantamento zerado
        0, -- gratificacao zerada
        0, -- obras zeradas
        COALESCE(ref_linha.valor_obra, 20),
        0, -- producao zerada
        0, -- limpeza zerada
        0, -- sabado zerado
        0, -- feriado zerado
        0, -- ferias zeradas
        0, -- ajuda zerada
        0, -- vendas_obra zeradas
        0, -- comissao zerada
        0, -- vendas_ajuda zeradas
        v_mensal,
        v_mensal,
        LEAST(v_bruto, COALESCE(tabela.teto_inss, 8475.55)),
        GREATEST(0, v_bruto - v_inss),
        v_inss,
        v_irrf,
        v_bruto + v_familia,
        v_inss + v_irrf + v_quinzena,
        COALESCE(ref_linha.conta, ''),
        COALESCE(ref_linha.pix, ''),
        COALESCE(ref_linha.chave_pix, ''),
        'Calculado',
        COALESCE(ref_linha.oculto, false),
        COALESCE(ref_linha.inativo, false),
        ref_linha.cpf,
        ref_linha.matricula,
        ref_linha.observacao_linha,
        ref_linha.observacoes,
        '[]'::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (empresa_id, competencia, lower(TRIM(BOTH FROM nome)))
      DO UPDATE SET
        competencia_id = EXCLUDED.competencia_id,
        funcionario_id = COALESCE(EXCLUDED.funcionario_id, folha_pagamento_linhas.funcionario_id),
        cargo = EXCLUDED.cargo,
        funcao = EXCLUDED.funcao,
        unidade = EXCLUDED.unidade,
        tipo = EXCLUDED.tipo,
        bruto = EXCLUDED.bruto,
        salario_base = EXCLUDED.salario_base,
        filhos = EXCLUDED.filhos,
        quinzena = EXCLUDED.quinzena,
        inss = EXCLUDED.inss,
        ir = EXCLUDED.ir,
        familia = EXCLUDED.familia,
        salario_liquido = EXCLUDED.salario_liquido,
        mensal_liquido = EXCLUDED.mensal_liquido,
        base_inss = EXCLUDED.base_inss,
        base_irrf = EXCLUDED.base_irrf,
        inss_retido = EXCLUDED.inss_retido,
        irrf_retido = EXCLUDED.irrf_retido,
        total_proventos = EXCLUDED.total_proventos,
        total_descontos = EXCLUDED.total_descontos,
        conta = EXCLUDED.conta,
        pix = EXCLUDED.pix,
        chave_pix = EXCLUDED.chave_pix,
        oculto = EXCLUDED.oculto,
        cpf = COALESCE(EXCLUDED.cpf, folha_pagamento_linhas.cpf),
        updated_at = NOW();
    END LOOP;
  END LOOP;

  -- Atualiza totais na folha_competencias para 2026-10
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
    WHERE competencia = '2026-10'
    GROUP BY competencia_id
  ) s
  WHERE c.id = s.competencia_id;

END $$;
