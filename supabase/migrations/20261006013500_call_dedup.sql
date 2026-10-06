DO $$
DECLARE
  v_req_id bigint;
BEGIN
  PERFORM pg_sleep(1);
  SELECT net.http_post(
    url := 'https://saovgdnepweivuzzsvqr.supabase.co/functions/v1/deduplicar-analise',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) INTO v_req_id;
END $$;
