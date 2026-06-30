# Architecture

Sudoku 2026 is a **Turborepo monorepo**. Web and mobile share one TypeScript
game engine so game logic lives in exactly one place.

```
sudo26/
├── apps/
│   ├── web/      Next.js 15 (App Router, PWA)   → @sudoku-2026/web
│   └── mobile/   Expo / React Native            → @sudoku-2026/mobile
└── packages/
    ├── core/     Framework-free game engine     → @sudoku-2026/core
    └── design/   Shared design tokens           → @sudoku-2026/design
```

## packages/design — design tokens

The single source of truth for colors, radius, shadow, and spacing
(`src/tokens.ts`). Web mirrors these as CSS variables in
`apps/web/src/app/globals.css` (`:root`, including stable `--color-*` /
`--radius-*` / `--shadow-card` aliases); mobile will consume them via StyleSheet
(roadmap Fase 6). Keep `tokens.ts` and the web `:root` block in sync.

## packages/core — the engine

Pure TypeScript, zero framework dependencies. Built with `tsup` to ESM + CJS +
`.d.ts`. Everything is exported from `src/index.ts`.

| File | Responsibility | State |
|------|----------------|-------|
| `generator.ts` | Classic 9×9 generate / solve, seeded RNG, daily seeding | implemented |
| `board.ts` | `Board` model, clone, serialize, build-from-puzzle | implemented |
| `gameState.ts` | Pure reducer: select, input, notes, erase, undo, timer, win | implemented |
| `hints.ts` | Hint pipeline: naked/hidden single, naked/pointing pair, reveal fallback | partial — X-Wing declared but not implemented |
| `mini.ts` | 6×6 generator with uniqueness check | implemented |
| `killer.ts` | Killer cage generation / validation | partial — see `game-engine-contract.md` |
| `samurai.ts` | 5×9×9 generator | prototype — sub-grids are independent, overlaps do not match |
| `streaks.ts` | Daily streak math | implemented |
| `types.ts` | Shared types across web + mobile | implemented |

### Determinism

All generators take a `seed` string and use the same `xoshiro128**` / `splitmix32`
RNG, so a seed always yields the same puzzle. Daily puzzles seed from the date
(`daily-YYYY-MM-DD`) — every player gets the identical board, which is the
foundation for fair leaderboards.

## apps/web — Next.js 15

App Router. Game state in Zustand (`store/gameStore.ts`) persisted to
localStorage. Pages under `src/app/play/*`. API routes (`/api/leaderboard`,
`/api/rooms`) are **mock / in-memory** today — see README status table.

Variant pages share `components/game/GameShell.tsx`, which owns the common chrome
(back-link, header/timer/mistakes/hints/progress + hint banner, board, number
pad, keyboard input, per-second timer) and the standard reducer wiring. A page
loads a puzzle and supplies page-specific extras via `aboveHeader`, a custom
`board(hint)` renderer (defaults to the 9×9 `SudokuBoard`), `belowPad`, and
`overlay`.

Migrated: **classic**, **daily**, **killer** (its cage board is passed via the
`board` slot). Intentionally standalone — they don't fit a single-board,
shared-reducer shell:
- **mini** — own local 6×6 state, not the shared `GameState`/reducer (needs the
  "Mini into shared engine" work from Fase 3 first);
- **samurai** — five overlapping boards with an active-grid switcher;
- **multiplayer** — realtime opponents and room state.

## apps/mobile — Expo

Expo Router. Consumes `@sudoku-2026/core` directly. Local game state in
`store/gameStore.ts`. `expo-env.d.ts` is committed so `tsc` resolves Expo's
`process.env.EXPO_PUBLIC_*` ambient types in CI without running the Expo plugin.

## Shared data flow

```
core (puzzle + reducer)  →  store (Zustand)  →  UI (web / mobile)
```

The UI never owns game rules. A variant supplies grid + rules + hint logic; the
shell supplies timer, mistakes, input, completion. This boundary is the target
contract (`game-engine-contract.md`); some variants still hold local state and
need to be migrated onto it.
