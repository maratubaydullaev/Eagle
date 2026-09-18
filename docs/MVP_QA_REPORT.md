# ПОЧЕМУЧКА — MVP QA Report
Date: 2026-09-18
Baseline: main after PR #6 and PR #7

## Implemented and checked by code review
- React + TypeScript + Vite foundation
- Typed domain/content schemas
- 3 active worlds and 10 MVP lessons
- Quiz, Drag & Drop, Matching
- Child profile and age filtering
- Home, world map, lesson, progress and parent-gated dashboard
- XP/stars with replay-safe reward transactions
- Server-derived completion scoring from recorded activity attempts
- Activity-attempt persistence and rolling activity mastery
- 1/3/7-day review scheduling with `next_review_at`
- Due-review retrieval and prioritization
- Telegram initData server-side validation
- Supabase schema plus reproducible MVP content seed
- PWA manifest, icons and offline shell
- Keyboard alternative for drag/drop controls
- Legacy prototype preserved unchanged

## Automated checks configured
GitHub Actions is configured to run:
1. `npm install`
2. `npm test`
3. `npm run build`

At the time of this audit, the GitHub connector returned no workflow-run records/statuses for the merge commits, so a green CI result could not be independently verified here.

## Manual checks still required
- Run the app in Telegram WebView on current iOS and Android.
- Deploy/apply `supabase/schema.sql` and `supabase/seed.sql` to a real Supabase project.
- Verify Edge Function secrets and real Telegram initData validation with a real bot.
- Test drag/drop and keyboard fallback on touch/mobile devices.
- Test PWA installability and offline navigation on target browsers.
- Review educational content with a human content QA pass.
- Verify analytics events and backend error handling in production-like conditions.
- Test repeat/review flow across 1/3/7-day boundaries.

## Known limitations
- LocalStorage remains the browser fallback and source of truth when Supabase/Telegram backend is not configured; configured Telegram sessions use the backend for profile/progress persistence.
- Parent Gate is a prototype arithmetic gate and is not a production parental-consent mechanism.
- Activity mastery is currently a rolling per-activity signal derived from attempts; richer topic/world mastery remains future work.
- The MVP content intentionally contains two activities per lesson; the legacy 8-question/3-life/15-second gameplay remains a reference, not the new lesson contract.

## Production exit criteria
Do not treat the MVP as production-ready until the configured CI is green and the manual checks above pass on the real deployment environment.
