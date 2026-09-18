# POCHEMUCHKA API

Server-side persistence boundary for the Telegram Mini App. The browser sends Telegram `initData`; the function validates the Telegram HMAC before profile, progress, reward, or analytics operations.

## Required secrets

Keep these only in Supabase Edge Function secrets:

- `TELEGRAM_BOT_TOKEN`
- `SUPABASE_SECRET_KEYS` (preferred current Supabase secret-key dictionary)

For projects still using the legacy key system, `SUPABASE_SERVICE_ROLE_KEY` is accepted as a fallback. Never expose either secret in the browser or source control.

## Deploy

```bash
supabase functions deploy pochemuchka-api
supabase secrets set TELEGRAM_BOT_TOKEN=...
```

Set the Supabase secret key through the Dashboard/Secrets mechanism appropriate to the project. Run `supabase/schema.sql` before first use.

## Browser configuration

Set `VITE_SUPABASE_URL` in the frontend build environment. The frontend receives no privileged database key.

The backend client activates when Telegram WebApp `initData` is present. Outside Telegram, the app keeps its local fallback until a web authentication provider is introduced.
