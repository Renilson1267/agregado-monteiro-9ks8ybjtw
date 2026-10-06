DO $$
DECLARE
  v_req_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://saovgdnepweivuzzsvqr.supabase.co/functions/v1/deduplicar-analise',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) INTO v_req_id;
END $$;
