# Testing strategy

Truth before features. The engine is the product; it must be proven by tests,
not asserted by the README.

## Current state

- Runner: **Vitest** (`pnpm test`, via `packages/core`).
- 23 tests across generator, reducer, and streaks.

## Core (`packages/core`) — must stay high-coverage

Implemented:

- `generator.test.ts`
  - puzzle + solution are 81 chars
  - solution is a legal complete grid (rows / cols / boxes hold 1–9)
  - clues are a subset of the solution
  - deterministic per seed; different seeds differ
  - clue count scales with difficulty
  - `solvePuzzle` returns the generator's solution and a legal grid
  - daily puzzle is deterministic per date
- `gameState.test.ts`
  - select, input (given no-op, correct vs wrong), erase, undo
  - timer ticks only while playing; reset clears
  - win declared only when fully and correctly solved
- `streaks.test.ts`
  - first completion, consecutive extend, gap resets, duplicate is a no-op

## Gaps to close (tracked, not yet done)

- Generator: assert **unique** solution explicitly (expose `countSolutions`).
- Difficulty: rating matches required solving technique, not just clue count.
- Mini: 36-char output, unique solution, 2×3 box rule.
- Killer: cages cover all 81 cells, no cell in two cages, sums match solution,
  cages connected, unique solution.
- Samurai: overlapping cells between corner and center grids are identical.
- Hints: each pipeline stage triggers on a crafted board.

## Web (`apps/web`)

Not yet automated. Manual flows for now: play classic, enter numbers, notes,
mistake, win modal, daily loads same puzzle per date, profile update,
leaderboard fetch, offline fallback.

## Mobile (`apps/mobile`)

Manual: navigation, local save, timer pause, input, board render, app resume.

## CI gate

`.github/workflows/ci.yml` runs on every PR and on push to `main`:

```
pnpm install --frozen-lockfile
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

No PR merges to `main` without green CI.
