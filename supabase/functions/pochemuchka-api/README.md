# POCHEMUCHKA API

The function is the server-side persistence boundary for Telegram Mini App users. The browser sends Telegram `initData`; the function validates the Telegram HMAC before any profile, progress, reward, or analytics operation.

## Required Supabase secrets

Set these in the Supabase project, never in Vite environment variables:

- `TELEGRAM_BOT_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_URL` is provided by the Supabase Edge Functions runtime.

## Deploy

```bash
supabase functions deploy pochemuchka-api
supabase secrets set TELEGRAM_BOT_TOKEN=... SUPABASE_SERVICE_ROLE_KEY=...
```

Run `supabase/schema.sql` before using the function.

## Browser configuration

Set `VITE_SUPABASE_URL` in the frontend build environment. The frontend does not receive or store the service-role key.

The backend client is enabled only when a Telegram WebApp provides `initData`. Outside Telegram, the app keeps its local fallback until a separate web authentication provider is introduced.
