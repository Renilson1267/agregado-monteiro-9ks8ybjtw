-- Migração para replicar o catálogo de insumos/materiais de Monteiro para Caicó e Patos
-- Mínimos de estoque: cimento 15.000 kg, aditivo 900 L (padrão já usado nas outras unidades)
-- Areia: 15.000 kg, Brita 12: 10.000 kg, Brita 19: 10.000 kg, Pó de pedra: 5.000 kg, Água: 0 L
-- Sem saldo inicial (movimentações_estoque zeradas)
-- Também garante competências da folha, tabelas oficiais de impostos 2026, prazos de exames e metas padrão

DO $$
DECLARE
  v_emp_monteiro UUID := '11111111-1111-1111-1111-111111111111'::uuid;
  v_emp_caico UUID := '43208b25-5cce-4b94-94fd-9f7639a0960c'::uuid;
  v_emp_patos UUID := '2da7537f-9f91-42b9-8020-f53c8fb52ec7'::uuid;
  v_emp_alvo UUID;
  v_mat RECORD;
  v_ano INT;
  v_mes INT;
  v_comp TEXT;
  v_data_comp DATE;
BEGIN
  -- Iterar sobre as duas unidades: Caicó e Patos
  FOREACH v_emp_alvo IN ARRAY ARRAY[v_emp_caico, v_emp_patos]
  LOOP
    -- 1. Inserir materiais copiando as definições de Monteiro, garantindo mínimos especificados
    FOR v_mat IN
      SELECT codigo, nome, unidade, controla_estoque, densidade, unidade_compra, preco_compra, ordem
      FROM public.materiais
      WHERE empresa_id = v_emp_monteiro
      ORDER BY ordem
    LOOP
      INSERT INTO public.materiais (
        id,
        empresa_id,
        codigo,
        nome,
        unidade,
        estoque_minimo,
        controla_estoque,
        densidade,
        unidade_compra,
        preco_compra,
        ordem,
        created_at
      )
      VALUES (
        gen_random_uuid(),
        v_emp_alvo,
        v_mat.codigo,
        v_mat.nome,
        v_mat.unidade,
        CASE
          WHEN v_mat.codigo = 'cimento' THEN 15000
          WHEN v_mat.codigo = 'aditivo' THEN 900
          WHEN v_mat.codigo = 'areia' THEN 15000
          WHEN v_mat.codigo = 'brita12' THEN 10000
          WHEN v_mat.codigo = 'brita19' THEN 10000
          WHEN v_mat.codigo = 'po_pedra' THEN 5000
          ELSE 0
        END,
        v_mat.controla_estoque,
        v_mat.densidade,
        v_mat.unidade_compra,
        v_mat.preco_compra,
        v_mat.ordem,
        NOW()
      )
      ON CONFLICT (empresa_id, codigo) DO UPDATE
      SET
        nome = EXCLUDED.nome,
        unidade = EXCLUDED.unidade,
        estoque_minimo = EXCLUDED.estoque_minimo,
        controla_estoque = EXCLUDED.controla_estoque,
        densidade = EXCLUDED.densidade,
        unidade_compra = EXCLUDED.unidade_compra,
        preco_compra = EXCLUDED.preco_compra,
        ordem = EXCLUDED.ordem;
    END LOOP;

    -- 2. Garantir Preços de Material (precos_material) de 09/2026 e 10/2026 copiados de Monteiro
    INSERT INTO public.precos_material (
      id, empresa_id, material_codigo, mes_ano, preco_unitario, unidade, created_at
    )
    SELECT
      gen_random_uuid(),
      v_emp_alvo,
      pm.material_codigo,
      pm.mes_ano,
      pm.preco_unitario,
      pm.unidade,
      NOW()
    FROM public.precos_material pm
    WHERE pm.empresa_id = v_emp_monteiro
    ON CONFLICT (empresa_id, material_codigo, mes_ano) DO NOTHING;

    -- 3. Garantir Meta de Produção padrão para Caicó e Patos
    INSERT INTO public.metas_producao (
      id, empresa_id, meta_diaria_m3, meta_mensal_m3, observacao, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_emp_alvo,
      50,
      1000,
      'Meta padrão',
      NOW(),
      NOW()
    )
    ON CONFLICT (empresa_id) DO NOTHING;

    -- 4. Garantir Tabela Oficial de Impostos 2026 (folha_tabelas_oficiais)
    INSERT INTO public.folha_tabelas_oficiais (
      id,
      empresa_id,
      ano,
      descricao,
      salario_minimo,
      teto_inss,
      familia_cota_por_filho,
      familia_teto_salario,
      ir_isento_ate,
      ir_desconto_gradual_ate,
      ir_parcela_fixa_reducao,
      ir_coeficiente_reducao,
      inss_faixas,
      irrf_faixas,
      ativo,
      created_at,
      updated_at
    )
    SELECT
      gen_random_uuid(),
      v_emp_alvo,
      t.ano,
      t.descricao,
      t.salario_minimo,
      t.teto_inss,
      t.familia_cota_por_filho,
      t.familia_teto_salario,
      t.ir_isento_ate,
      t.ir_desconto_gradual_ate,
      t.ir_parcela_fixa_reducao,
      t.ir_coeficiente_reducao,
      t.inss_faixas,
      t.irrf_faixas,
      true,
      NOW(),
      NOW()
    FROM public.folha_tabelas_oficiais t
    WHERE t.empresa_id = v_emp_monteiro AND t.ano = 2026
    ON CONFLICT (empresa_id, ano) DO NOTHING;

    -- 5. Garantir Competências da Folha (folha_competencias) de 2023 a 2026
    FOR v_ano IN 2023..2026 LOOP
      FOR v_mes IN 1..12 LOOP
        -- Se for 2023 antes de julho, pula (histórico começa em 2023-07)
        IF v_ano = 2023 AND v_mes < 7 THEN
          CONTINUE;
        END IF;

        v_comp := v_ano || '-' || LPAD(v_mes::text, 2, '0');
        v_data_comp := (v_comp || '-01')::date;

        INSERT INTO public.folha_competencias (
          id,
          empresa_id,
          competencia,
          ano,
          mes,
          status,
          observacoes,
          data_competencia,
          percentual_quinzena,
          created_at,
          updated_at
        )
        VALUES (
          gen_random_uuid(),
          v_emp_alvo,
          v_comp,
          v_ano,
          v_mes,
          'ABERTA',
          'Competência criada automaticamente',
          v_data_comp,
          0.40,
          NOW(),
          NOW()
        )
        ON CONFLICT (empresa_id, competencia) DO NOTHING;
      END LOOP;
    END LOOP;

    -- 6. Garantir Prazos de Exames por Empresa (prazos_exame_por_empresa)
    INSERT INTO public.prazos_exame_por_empresa (
      id,
      empresa_id,
      tipo_exame,
      nome_exame,
      validade_padrao_meses,
      norma_referencia,
      descricao_norma,
      created_at,
      updated_at
    )
    SELECT
      gen_random_uuid(),
      v_emp_alvo,
      p.tipo_exame,
      p.nome_exame,
      p.validade_padrao_meses,
      p.norma_referencia,
      p.descricao_norma,
      NOW(),
      NOW()
    FROM public.prazos_exame_por_empresa p
    WHERE p.empresa_id = v_emp_monteiro
    ON CONFLICT (empresa_id, tipo_exame) DO NOTHING;

  END LOOP;
END $$;
