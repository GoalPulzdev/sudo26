# Game engine contract

Every variant (classic, mini, killer, samurai) must speak the same shape so the
UI shell stays identical and logic stays in `packages/core`.

## Target interface

```ts
interface PuzzleEngine {
  variant: GameVariant;
  createPuzzle(seed: string, options: PuzzleOptions): Puzzle;
  parseBoard(puzzle: Puzzle): BoardModel;
  validateMove(board: BoardModel, move: Move): MoveValidation;
  checkComplete(board: BoardModel, puzzle: Puzzle): boolean;
  getHint(board: BoardModel, puzzle: Puzzle): Hint | null;
}
```

Status: **not yet a single interface.** Variants currently expose ad-hoc
functions (`createPuzzle`, `createMiniPuzzle`, `createSamuraiPuzzle`,
`generateKillerPuzzle`). Converging them onto `PuzzleEngine` is Variant Engine
Agent work (roadmap Fase 3).

## Difficulty rating (target)

Difficulty must be derived from the **logic required to solve**, not just the
clue count.

```ts
type SolvingTechnique =
  | "naked_single" | "hidden_single" | "naked_pair"
  | "pointing_pair" | "box_line_reduction" | "x_wing" | "guess_required";

interface DifficultyRating {
  label: "easy" | "medium" | "hard" | "extreme";
  score: number;
  requiredTechniques: SolvingTechnique[];
  estimatedMinutes: number;
}
```

Rules:
- easy → solvable with singles
- medium → may require pairs
- hard → may require pointing / box-line
- extreme → may require X-Wing or harder
- no puzzle requires pure guessing unless labelled extreme/experimental

Implemented in `difficulty.ts`: `rateDifficulty(clues)` solves with the logic
engine and returns `{ label, score, requiredTechniques, estimatedMinutes }`.
`generator.ts` adds `generateMatchedPuzzle` / `createMatchedPuzzle`, which
regenerate (deterministically, `${seed}#i`) until the measured logic-label
matches the requested bucket — so difficulty reflects solving logic, not just
clue count.

## Solver (target)

```ts
solveWithLogic(puzzle)        // human techniques, returns the steps used
solveWithBacktracking(puzzle) // brute force
countSolutions(puzzle)        // uniqueness

interface SolveResult {
  solved: boolean;
  solution?: string;
  unique: boolean;
  steps: SolveStep[];
  error?: string;
}
```

Validate input length, characters 0–9, and that clues don't already break Sudoku
rules. Return a structured result, never a bare string/null.

Implemented in `solver.ts`: `validatePuzzle`, `countSolutions` (exposed),
`solveWithBacktracking`, `solveWithLogic` (records required `SolvingTechnique`s),
and `solve` returning a `SolveResult { solved, solution?, unique, techniques, error? }`.
The legacy `solvePuzzle` (string|null) remains for backward compatibility.

## Hint contract (target)

Pipeline order (easiest applicable wins): naked single → hidden single →
naked pair → pointing pair → box-line reduction → X-Wing → reveal fallback.

The fallback is **not** AI. Until a model is wired in, it must be named
`Solution Reveal` / `Guided Hint`, not `ai_suggestion`.

```ts
interface Hint {
  strategy: HintStrategy;
  row: number;
  col: number;
  value?: CellValue;
  explanation: string;
  affectedCells?: [number, number][];
  eliminations?: { row: number; col: number; value: CellValue }[];
}
```

Today (`hints.ts`): the play-UI pipeline surfaces naked single, hidden single,
naked pair, pointing pair, then a `solution_reveal` fallback (renamed from the
misleading `ai_suggestion` — it is not AI). X-Wing and box-line reduction are
implemented in the **solver/difficulty engine** (`solver.ts`), where elimination
logic is testable, rather than in the placement-only hint UI. `Hint` now carries
optional `affectedCells` / `eliminations` for future UI highlighting.

## Variant specifics

- **Mini (6×6):** 2×3 boxes, values 1–6, uniqueness enforced. Needs to move onto
  the shared shell instead of local component state.
- **Killer:** `validateKillerPuzzle` proves all 81 cells covered, no cell in two
  cages, cages connected, no repeated digit per cage, and sums match the
  solution. The generator now grows cages digit-distinct (a connected region may
  not reuse a digit). `countKillerSolutions` / `hasUniqueKillerSolution` add a
  bounded killer-aware solver (Sudoku + cage sum/distinct pruning). Remaining
  gap: clueless generated puzzles may exceed the node budget before uniqueness
  is proven.
- **Samurai:** 21×21 master grid, 5 overlapping 9×9 grids at offsets
  `[0,0] [0,12] [6,6] [12,0] [12,12]`. The generator builds the center first,
  then completes each corner with the shared 3×3 box fixed from the center, so
  overlap cells are identical by construction. `validateSamurai` checks the
  invariant on both solution and clues.
