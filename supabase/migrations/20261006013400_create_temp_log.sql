CREATE TABLE IF NOT EXISTS public._dedup_temp_log (
  id serial primary key,
  resultado jsonb,
  created_at timestamptz default now()
);

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
