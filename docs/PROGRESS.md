# Fremdriftsrapport — Alpha → produkt

Status per 2026-06-30. `main` på `04b9499`. CI grønn. 71 core-tester grønne.

Denne rapporten dekker arbeidet gjort fra basis-commit `1fab38f ("ysys")` og
fremover. Alt nevnt er **merget til `main` og pushet**, og hver merge er verifisert
grønn på GitHub Actions.

---

## 1. Oppsummering

Repoet er hardnet fra Alpha mot produksjon, stein for stein:

- **CI på plass og ekte grønn** (type-check · lint · test · build).
- **Core-motor herdet**: strukturert solver, teknikk-basert difficulty, ekte
  X-Wing, ærlige hints, ekte Samurai, validert Killer, anti-cheat — 71 tester.
- **Supabase-backend skrevet** (SQL + RLS + typer), men ikke provisjonert.
- **Web env-gated**: kjører fullt uten backend (lokal mock-auth, mock-leaderboard).
- **Delt GameShell** + **design-tokens**.
- **Nordic premium UI** over hele web.

Demoen kjører i dag (single-player, uten backend).

---

## 2. Commits (eldst → nyest)

| SHA | Hva |
|-----|-----|
| `ef1bb71` | Foundation: CI, grønn build, 6 docs, ærlig README, 23 tester |
| `b07fa70` | Core: solver (validate/uniqueness/logic), teknikk-difficulty, X-Wing, rename `ai_suggestion`→`solution_reveal` |
| `5367deb` | Ekte Samurai (matchende overlapp), validert Killer (dekningshull-fiks), rated puzzles |
| `c391cf5` | Supabase schema + RLS-migrasjon, anti-cheat `validateSubmission`, env-gated leaderboard |
| `a4b9207` | Fjernet villedende "AI"-labels i hint-UI/metadata |
| `e50ef27` | Env-gate Supabase/auth (client=null uten env, lokal mock-modus) + CI-diagnostikk |
| `dd3704e` | **CI-fiks**: committet `expo-env.d.ts`, `pnpm build` før `type-check` |
| `59c686a` | README: auth krever env, leaderboard mock-fallback, schema-status |
| `1ee6d40` | Generator difficulty-wiring, Killer uniqueness-solver, mini/hint-tester |
| `260267c` | Delt `GameShell` + `packages/design` tokens; migrert classic + daily |
| `9ef7ebd` | Migrert Killer onto GameShell (custom `board`-slot) |
| `0c3c1c8` | Demo-klar: app-ikon/PWA, skjul backend-only-knapper uten Supabase |
| `7fb6d73` | Home stats-strip, `reduced-motion` (a11y), ikon-rydding |
| `f1b99ac` | Nordic premium restyle (tokens: linne/ink/slate/gull) |
| `04b9499` | Nordic palett over alle sider/overlays/ikon |

---

## 3. Utført per område

### Fase 1 — Repo-grunnmur ✅
- `.github/workflows/ci.yml` (type-check · lint · test · build). Bygger først så
  `packages/core/dist` finnes når appene type-sjekker.
- Fikset baseline-feil: mobile `expo-env.d.ts` (committet, ikke gitignored), web
  `React.ReactElement` return-typer (TS2742 under pnpm), ekte ESLint + `<Link>`.
- `docs/`: architecture, product-roadmap, game-engine-contract, testing-strategy,
  supabase-schema, release-checklist.
- README delt i Implemented / Mock / Planned — ingen falske claims.

### Fase 2 — Core engine ✅ (`packages/core`, 71 tester)
- `solver.ts`: `validatePuzzle`, `countSolutions`, `solveWithBacktracking`,
  `solveWithLogic` (teknikk-sporing inkl. naked/hidden single, naked/pointing
  pair, box-line, **X-Wing**), `solve()` → `SolveResult`.
- `difficulty.ts`: `rateDifficulty()` — label fra løsningslogikk, ikke clue-count.
- `generator.ts`: `generateMatchedPuzzle`/`createMatchedPuzzle` regenererer til
  målt logikk-label matcher bucket. `createRatedPuzzle` fester rating.
- `hints.ts`: rename `ai_suggestion`→`solution_reveal` (ikke fake AI).
- `antiCheat.ts`: `validateSubmission` (accepted/suspicious/rejected) — pure, testet.
- `db.ts`: typed DB-rows som speiler SQL-schema.

### Fase 3 — Variant engines ✅
- **Samurai**: ekte 21×21 — senter genereres først, hver corner fullføres med delt
  3×3-boks fast fra senter → overlapp identisk. `validateSamurai`.
- **Killer**: fikset dekningshull (celler markert visited ved kø, ikke commit);
  cages vokser siffer-distinkt; `validateKillerPuzzle` (dekning/connected/no-dup/sum);
  `countKillerSolutions`/`hasUniqueKillerSolution` (bounded killer-solver).
- **Mini**: strukturelle + determinisme-tester (egen 6×6-state i UI, ikke shared reducer).

### Fase 4 — Data/Supabase 🟡 (skrevet, ikke provisjonert)
- `supabase/migrations/0001_initial_schema.sql`: alle tabeller + RLS (bruker rører
  bare egne rader; leaderboard/achievements skrives kun av service-role).
- `apps/web/src/lib/leaderboardSource.ts`: ekte Supabase når env satt, mock ellers
  (`live`-flagg). `.env.example` dokumentert.
- Auth env-gated: ingen client uten `NEXT_PUBLIC_SUPABASE_*`; lokal mock-profil.

### Web frontend ✅
- `components/game/GameShell.tsx`: delt chrome (back-link, header/timer/feil/hint/
  progress, board, numberpad, keyboard, tick) + reducer-wiring. Slots: `aboveHeader`,
  `board(hint)`, `belowPad`, `overlay`.
  - Migrert: **classic, daily, killer**.
- `packages/design`: delte tokens (colors/radius/shadow/space); web speiler i
  `globals.css :root` med `--color-*`/`--radius-*`/`--shadow-card`-aliaser.
- Demo-klar: SVG app-ikon (`app/icon.svg` + `public/icons/icon.svg`), PWA-manifest,
  ChallengeButton skjult uten Supabase.
- A11y: `MotionProvider` (`reducedMotion="user"`).
- **Nordic premium UI**: token-drevet palett (linne-papir, ink, slate-blå, gull,
  sage, terracotta) over alle sider, overlays, numberpad, board, ikon, manifest.

---

## 4. Hvordan kjøre demo (uten backend)

```bash
pnpm install
pnpm --filter @sudoku-2026/web dev   # http://localhost:3000
```

Funker: hjem, classic/daily/mini/killer/samurai, lokal auth (mock), lokale rekorder,
daily streak + del-tekst, PWA-install.

Kvalitetsport (det CI kjører):
```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
```

---

## 5. Gjenstår

### Infra-gated (krever eksterne ressurser — kan ikke fullføres/test uten dem)
- **Provisjonere Supabase**: opprett prosjekt, sett env (se `.env.example`), kjør
  migrasjon (`supabase db push`), wire leaderboard-writer (service-role).
- **Ekte leaderboard** (Fase 8): avhenger av Supabase.
- **Realtime multiplayer** (Fase 9/14): Supabase Realtime eller PartyKit. Siden
  finnes, men er ikke funksjonell; ikke linket fra hjem.
- **Mobile store** (Fase 6/12): EAS + Apple/Google-kontoer.
- **Deploy/Beta** (Fase 13/15): hosting + ekte enhets-test (PWA).

### Kodbar (ingen ekstern blocker)
- **GameShell-migrering** av resten: `mini` (krever core 6×6-reducer først — i dag
  egen lokal state), `samurai` (5 brett), `multiplayer` (realtime). Disse er
  bevisst standalone; ikke tvangs-migrert.
- **Killer uniqueness for clueless puzzles**: solver kan treffe node-budsjett før
  unikhet bevises (`hasUniqueKillerSolution` returnerer false ved `exhausted`).
- **Hint-tester**: dedikerte triggere for naked-pair/pointing-pair på craftede brett.
- **Generator label-wiring**: `createMatchedPuzzle` finnes, men dailys/sidene bruker
  fortsatt `createPuzzle`/`createDailyPuzzle` (clue-bucket). Kan byttes til matched.
- **Mobil-app Nordic-tema**: Expo har egen palett; synk til `packages/design`.
- **Win-overlay-finpuss**: farger er Nordic, men layout/struktur kan løftes videre.
- **Mistake policy** (docx 5.4): `MistakePolicy`-typer ikke implementert i reducer
  (utsatt for å ikke destabilisere alle spill).
- **Mini into shared engine** (docx Fase 3): flytt mini 6×6 til core-reducer.

### Dokumentert som kjent gap
- `apps/web/src/app/api/rooms` er fortsatt mock/in-memory.
- Web/mobile har ingen automatiserte UI-tester (kun manuell + 71 core-tester).

---

## 6. Tekniske notater (for neste økt)

- **CI var ekte rød en stund** (ikke bare lokal-vs-CI). To rotårsaker, begge fikset:
  `expo-env.d.ts` var gitignored (manglet på fresh checkout → mobile mistet
  `EXPO_PUBLIC_*`-typer), og `core/dist` fantes ikke når appene type-sjekket
  (→ "Cannot find module @sudoku-2026/core" + implicit-any kaskade). CI bygger nå
  før type-check; årsak funnet via Actions annotations-API.
- **pnpm/CI**: `pnpm --filter X type-check` omgår turbos `^build` — bruk `pnpm
  type-check` (turbo) eller bygg core først.
- **Screenshot-fallgruve**: headless Chrome `--screenshot` rendrer på
  `innerWidth≈482` men cropper til `--window-size` → falskt "innhold kuttet".
  Verifiser ekte overflow via CDP (`document.scrollWidth` vs `innerWidth`).
  Bruk `--force-prefers-reduced-motion` (krever `MotionProvider`) for
  deterministiske bilder uten framer-motion-stagger.
- **Palett er token-drevet**: endre `globals.css :root` (+ `packages/design/
  src/tokens.ts`) ett sted → propagerer til alle komponenter som bruker `var(--*)`.

---

## 7. Anbefalt neste steg

1. Provisjoner Supabase → aktiver ekte completed_games + leaderboard (Fase 7→8).
2. Synk mobil-app til Nordic-tokens (Fase 6 design-konsistens).
3. Deretter: realtime multiplayer v1, så beta-release.

Den beste veien videre er fortsatt å gjøre kjernen uangripelig før mer bygges —
kjernen er nå bevist (71 tester), backend er skrevet og venter på provisjonering.
