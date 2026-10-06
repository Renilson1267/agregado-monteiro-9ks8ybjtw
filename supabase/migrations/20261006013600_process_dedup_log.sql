CREATE TABLE IF NOT EXISTS public._dedup_resultado_resumo (
  mes text,
  excesso numeric,
  candidato_vol numeric,
  candidato_data date,
  candidato_cimento numeric,
  candidato_aditivo numeric,
  candidato_motorista text,
  candidato_placa text,
  cargas_db_ids uuid[],
  cargas_db_count int,
  carga_db_id_para_remover uuid
);

DO $$
DECLARE
  v_res jsonb;
  v_cands jsonb;
  v_cand jsonb;
  v_dup jsonb;
  v_db_rows jsonb;
  v_db_id uuid;
  v_db_ids uuid[];
  i int;
BEGIN
  -- Aguarda resposta chegar no _dedup_temp_log se houver
  SELECT resultado INTO v_res FROM public._dedup_temp_log ORDER BY id DESC LIMIT 1;
  IF v_res IS NOT NULL THEN
    v_cands := v_res->'candidatosComIdsBanco';
    FOR i IN 0 .. jsonb_array_length(v_cands) - 1 LOOP
      v_cand := v_cands->i;
      v_dup := v_cand->'dup';
      v_db_rows := v_cand->'dbRows';
      
      -- Coletar IDs
      v_db_ids := ARRAY[]::uuid[];
      FOR j IN 0 .. jsonb_array_length(v_db_rows) - 1 LOOP
        v_db_ids := array_append(v_db_ids, (v_db_rows->j->>'id')::uuid);
      END LOOP;
      
      -- Pegar o último ID para remoção se houver mais de 1
      IF array_length(v_db_ids, 1) > 1 THEN
        v_db_id := v_db_ids[array_length(v_db_ids, 1)];
      ELSE
        v_db_id := NULL;
      END IF;

      INSERT INTO public._dedup_resultado_resumo (
        mes, candidato_vol, candidato_data, candidato_cimento, candidato_aditivo,
        candidato_motorista, candidato_placa, cargas_db_ids, cargas_db_count,
        carga_db_id_para_remover
      ) VALUES (
        to_char((v_dup->>'dataIso')::date, 'YYYY-MM'),
        (v_dup->>'m3')::numeric,
        (v_dup->>'dataIso')::date,
        (v_dup->>'cimento')::numeric,
        (v_dup->>'aditivo')::numeric,
        v_dup->>'motorista',
        v_dup->>'placa',
        v_db_ids,
        jsonb_array_length(v_db_rows),
        v_db_id
      );
    END LOOP;
  END IF;
END $$;
