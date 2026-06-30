# Product roadmap

From Alpha (prototype) to a production Sudoku product across web, PWA, iOS,
Android. Built stone by stone — no feature stacks on an unproven core.

## Principle

> Alpha must not be polished. Alpha must be hardened.

Don't add modes before the core is proven. Don't ship a leaderboard before
results can be validated. Don't call Samurai "Samurai" before overlaps work.
Don't claim a feature in the README before it exists.

## Phases

1. **Repo foundation** — CI, stable scripts, strict-ish TS, docs, honest README. *(in progress)*
2. **Core engine** — solver levels, technique-based difficulty, real hint pipeline, reducer + tests.
3. **Variant engines** — one shared `PuzzleEngine`; Mini onto the shell; Killer validation; real Samurai.
4. **Data / Supabase** — schema, RLS, profiles, completed games, leaderboards, light anti-cheat.
5. **Web frontend** — premium `GameShell`, design tokens, daily, profile/stats, PWA, a11y.
6. **Mobile** — Expo, shared design tokens, native UX, local save, store readiness.
7. **Profile & retention** — streaks, achievements, shareable daily result card.
8. **Leaderboards** — real, server-validated, never trusts the client.
9. **Multiplayer v1** — room code, same puzzle, first-done-wins (Supabase Realtime first).
10. **Testing** — high core coverage, web + mobile flows.
11. **Release readiness** — green CI, honest README, error boundaries, legal pages.

## Recommended build order

Repo foundation → core engine tests → classic hardening → web GameShell →
daily → profile/local stats → Supabase profile/completed games → real
leaderboard → mini shared engine → killer validation → real samurai → mobile
sync → PWA polish → multiplayer v1 → beta.

Do **not** start Samurai, multiplayer, or advanced UI before phases 1–2 are done.

## "Real product" definition

Classic correct and tested · daily stable · profiles · server-side results ·
real leaderboard · correct streaks · premium mobile UI · working PWA · a README
that doesn't lie · CI protecting `main` · Samurai/Killer either real or clearly
Beta · data survives real users.
