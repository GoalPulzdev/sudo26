# Testing strategy

Truth before features. The engine is the product; it must be proven by tests,
not asserted by the README.

## Current state

- Runner: **Vitest** (`pnpm test`, via `packages/core`).
- 37 tests across generator, reducer, streaks, solver, and difficulty.

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
- `solver.test.ts`
  - `validatePuzzle` accepts legal grids, rejects bad length/chars/conflicts
  - `countSolutions` = 1 for generated puzzles, 2 (capped) for ambiguous grids
  - `solveWithBacktracking` solves back to the generator's solution
  - `solveWithLogic` solves an easy puzzle with pure logic, flags `guess_required` when stalled
  - `solve` always yields a solution for solvable puzzles
- `difficulty.test.ts`
  - singles-solvable puzzle → `easy`; logic-unsolvable grid → `extreme`
  - score increases with harder required techniques

Also implemented:

- `samurai.test.ts` — 5 legal sub-grid solutions, corner⇄center overlaps
  identical (solution + clues), deterministic, center mirrors index 2.
- `killer.test.ts` — cages cover all 81 cells exactly once, connected, sums
  match, no-repeat; negative case (uncovered cell) rejected; `validateCage`.
- `rated.test.ts` — `createRatedPuzzle` attaches a technique-based rating.
- `matched.test.ts` — `generateMatchedPuzzle` / `createMatchedPuzzle` regenerate
  until the measured logic-label matches the requested bucket; deterministic.
- `mini.test.ts` — 36-char output, legal 6×6 solution (2×3 boxes), clue subset,
  deterministic, clue count scales with difficulty.
- `killer.test.ts` (solver) — `countKillerSolutions` honours cages: one
  completion when clued, zero when a cage sum is corrupted (incl. fully-clued
  cages), bounded by a node budget.
- `hints.test.ts` — null on a solved board; valid strategy + coordinates; the
  last empty cell is solved with a correct single; every hint has an explanation.

## Gaps to close (tracked, not yet done)

- Killer: prove uniqueness for *clueless* generated puzzles (search may hit the
  node budget — `hasUniqueKillerSolution` returns false when `exhausted`).
- Hints: dedicated triggers for naked-pair / pointing-pair on crafted boards.
- Web + mobile: automated flows (still manual).

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
