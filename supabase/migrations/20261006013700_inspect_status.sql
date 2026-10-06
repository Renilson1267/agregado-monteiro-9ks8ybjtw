-- Inspecionar se _dedup_resultado_resumo tem linhas
DO $$
DECLARE
  v_cnt int;
  v_res_cnt int;
  v_resp_cnt int;
  v_last_code int;
  v_last_body text;
BEGIN
  SELECT count(*) INTO v_cnt FROM public._dedup_resultado_resumo;
  SELECT count(*) INTO v_res_cnt FROM public._dedup_temp_log;
  SELECT count(*) INTO v_resp_cnt FROM net._http_response;
  SELECT status_code, content INTO v_last_code, v_last_body FROM net._http_response ORDER BY id DESC LIMIT 1;
  
  RAISE NOTICE 'Resumo count: %, Temp log count: %, Responses count: %, Last code: %, Last body: %',
    v_cnt, v_res_cnt, v_resp_cnt, v_last_code, substring(v_last_body from 1 for 200);
END $$;
