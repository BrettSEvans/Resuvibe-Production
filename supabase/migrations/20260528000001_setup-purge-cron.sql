-- Enable pg_cron and pg_net (both are available on Supabase Pro and above)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the purge-deleted-data edge function to run nightly at 02:00 UTC.
--
-- Prerequisites (set once via Supabase dashboard → Project Settings → Database → Parameters,
-- or via `ALTER DATABASE <db> SET ...` in the SQL editor):
--   app.settings.supabase_url = 'https://<your-project-ref>.supabase.co'
--   app.settings.cron_secret  = '<same value as CRON_SECRET edge function secret>'
--
-- The x-cron-secret header is verified inside purge-deleted-data/index.ts.
SELECT cron.schedule(
  'purge-deleted-data-nightly',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.settings.supabase_url') || '/functions/v1/purge-deleted-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);
