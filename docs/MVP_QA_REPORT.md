# ПОЧЕМУЧКА — MVP QA Report
Date: 2026-09-18
Branch: feature/pochemuchka-mvp

## Implemented
- React + TypeScript + Vite foundation
- Typed domain/content schemas
- 3 active worlds and 10 MVP lessons
- Quiz, Drag & Drop, Matching
- Child profile and age filtering
- Home, world map, lesson, progress and parent-gated dashboard
- XP/stars and idempotent lesson reward behavior
- Basic repetition rules (1/3/7 days)
- Telegram lifecycle/haptics service
- PWA manifest and offline shell
- Supabase schema and server-side Telegram initData validation function
- Legacy prototype preserved unchanged

## Automated checks
CI runs npm ci, npm test, and npm run build on push and pull request.

## Manual checks still required
- Run the app on iOS/Android Telegram WebView.
- Validate Supabase credentials, RLS policies and repository adapters in a real project.
- Verify Telegram initData against a real bot and reject stale auth data according to deployment policy.
- Test drag/drop on touch devices and provide/validate keyboard alternative.
- Test PWA installability and offline behavior on target browsers.
- Review all migrated educational content with a human content QA pass.
- Measure actual learning time and add analytics events.

## Known MVP limitations
- LocalRepository is still the active source of truth in this branch; Supabase persistence is scaffolded, not connected.
- Parent Gate is a functional MVP prototype, not a production-grade parental consent/authentication mechanism.
- Mastery is currently derived from lesson accuracy; topic-level aggregation and richer spaced repetition remain to be completed.
- The legacy 8-question/3-life/15-second gameplay is preserved as a reference, while the new lesson engine uses configurable activities.

## Exit criteria
The MVP is ready for production only after CI is green and the manual checks above are completed.