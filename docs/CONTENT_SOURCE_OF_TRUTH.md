# POCHEMUЧКА content source of truth

## MVP rule

`src/content/content.ts` is the canonical authoring source for the WebApp gameplay content.

`supabase/seed.sql` is the database bootstrap copy used to seed production. It must remain structurally aligned with the canonical TypeScript content until a generated content pipeline is introduced.

## Required QA

When lesson/activity content changes:

1. Update `src/content/content.ts` first.
2. Update the matching rows in `supabase/seed.sql`.
3. Run `npm test` and `npm run build`.
4. Re-run the Supabase seed only when the database content is intentionally updated.
5. Verify the production API returns the expected activity data and that server-side correctness is based on database content, not client answers.

## Future improvement

The next content-system step should generate `supabase/seed.sql` from the canonical content model to remove the second hand-maintained copy. This is not required for the current MVP bug fix, but it should be completed before the content library grows materially.
