/**
 * Killer Sudoku generator.
 *
 * Extends classic Sudoku with "cages" – groups of cells that must
 * sum to a specific total with no repeated digits.
 */

import type { KillerCage, Puzzle } from "./types.js";
import { generateSudoku, createRng } from "./generator.js";

interface CageCell {
  row: number;
  col: number;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Orthogonal neighbours of a cell index, without row-wrap. */
function neighboursOf(idx: number): number[] {
  const out: number[] = [];
  if (idx - 9 >= 0) out.push(idx - 9);
  if (idx + 9 < 81) out.push(idx + 9);
  if (idx % 9 !== 0) out.push(idx - 1);
  if (idx % 9 !== 8) out.push(idx + 1);
  return out;
}

/**
 * Grow connected cage regions from a solved grid.
 *
 * Cells are marked visited only when actually committed to a cage (never merely
 * queued), so every cell lands in exactly one cage — no coverage holes.
 */
function buildCages(
  solution: number[],
  rng: () => number
): KillerCage[] {
  const visited = new Array(81).fill(false);
  const cages: KillerCage[] = [];
  let cageId = 0;

  // Order cells randomly so cage shapes vary per seed
  const order = shuffle(
    Array.from({ length: 81 }, (_, i) => i),
    rng
  );

  for (const start of order) {
    if (visited[start]) continue;

    const size = Math.floor(rng() * 4) + 2; // target cage size 2–5
    const cage: CageCell[] = [];
    // Digits already used in this cage — Killer cages may not repeat a digit.
    const usedDigits = new Set<number>();

    // Commit the start cell, then grow into committed cells' free neighbours.
    visited[start] = true;
    cage.push({ row: Math.floor(start / 9), col: start % 9 });
    usedDigits.add(solution[start]);

    while (cage.length < size) {
      // Free orthogonal neighbours whose digit isn't already in the cage.
      const frontier: number[] = [];
      for (const { row, col } of cage) {
        for (const nb of neighboursOf(row * 9 + col)) {
          if (!visited[nb] && !usedDigits.has(solution[nb])) frontier.push(nb);
        }
      }
      if (frontier.length === 0) break;
      const pick = frontier[Math.floor(rng() * frontier.length)];
      visited[pick] = true;
      usedDigits.add(solution[pick]);
      cage.push({ row: Math.floor(pick / 9), col: pick % 9 });
    }

    const sum = cage.reduce((acc, { row, col }) => acc + solution[row * 9 + col], 0);
    cages.push({
      id: `cage-${cageId++}`,
      sum,
      cells: cage.map(({ row, col }) => [row, col]),
    });
  }

  return cages;
}

export function createKillerPuzzle(seed: string, puzzleId: string): Puzzle {
  const rng = createRng(seed);
  const { solution } = generateSudoku("hard", seed);
  const solutionNums = solution.split("").map(Number);
  const cages = buildCages(solutionNums, rng);

  // In Killer Sudoku the board starts fully empty (clues = 81 zeros)
  const clues = "0".repeat(81);

  return {
    id: puzzleId,
    variant: "killer",
    difficulty: "hard",
    clues,
    solution,
    seed,
    killerCages: cages,
  };
}

/** Validate a single cage: no repeats and sum matches */
export function validateCage(cage: KillerCage, board: number[][]): boolean {
  const values = cage.cells.map(([r, c]) => board[r][c]);
  if (values.includes(0)) return true; // incomplete – not invalid yet
  if (new Set(values).size !== values.length) return false;
  return values.reduce((a, b) => a + b, 0) === cage.sum;
}

/** Are a cage's cells orthogonally connected? */
function cageConnected(cage: KillerCage): boolean {
  if (cage.cells.length === 0) return false;
  const set = new Set(cage.cells.map(([r, c]) => r * 9 + c));
  const seen = new Set<number>();
  const stack = [cage.cells[0][0] * 9 + cage.cells[0][1]];
  while (stack.length) {
    const idx = stack.pop()!;
    if (seen.has(idx)) continue;
    seen.add(idx);
    for (const nb of neighboursOf(idx)) if (set.has(nb) && !seen.has(nb)) stack.push(nb);
  }
  return seen.size === cage.cells.length;
}

/**
 * Validate a generated Killer puzzle's cage structure against its solution:
 *  - all 81 cells covered exactly once
 *  - no cell in two cages
 *  - every cage is orthogonally connected
 *  - every cage sum matches the solution and has no repeated digits
 *
 * Note: full puzzle uniqueness (solvable from cages alone) is not yet enforced;
 * see docs/game-engine-contract.md.
 */
export function validateKillerPuzzle(puzzle: Puzzle): { ok: boolean; error?: string } {
  const cages = puzzle.killerCages;
  if (!cages || cages.length === 0) return { ok: false, error: "no cages" };

  const solution = puzzle.solution.split("").map(Number);
  const owner = new Array(81).fill(-1);

  for (const cage of cages) {
    if (!cageConnected(cage)) return { ok: false, error: `cage ${cage.id} is not connected` };

    const values: number[] = [];
    for (const [r, c] of cage.cells) {
      const idx = r * 9 + c;
      if (idx < 0 || idx >= 81) return { ok: false, error: `cage ${cage.id} has out-of-range cell` };
      if (owner[idx] !== -1) return { ok: false, error: `cell ${idx} is in two cages` };
      owner[idx] = 1;
      values.push(solution[idx]);
    }
    if (new Set(values).size !== values.length) {
      return { ok: false, error: `cage ${cage.id} repeats a digit` };
    }
    if (values.reduce((a, b) => a + b, 0) !== cage.sum) {
      return { ok: false, error: `cage ${cage.id} sum does not match solution` };
    }
  }

  for (let i = 0; i < 81; i++) {
    if (owner[i] === -1) return { ok: false, error: `cell ${i} is not covered by any cage` };
  }
  return { ok: true };
}

// ─── Killer-aware solver (uniqueness) ────────────────────────────────────────────

function sudokuLegal(grid: number[], pos: number, n: number): boolean {
  const row = Math.floor(pos / 9);
  const col = pos % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 9; i++) {
    if (grid[row * 9 + i] === n) return false;
    if (grid[i * 9 + col] === n) return false;
    const br = boxRow + Math.floor(i / 3);
    const bc = boxCol + (i % 3);
    if (grid[br * 9 + bc] === n) return false;
  }
  return true;
}

export interface KillerSolveCount {
  count: number;
  /** True when the node budget was hit before the search finished. */
  exhausted: boolean;
}

/**
 * Count solutions (up to `limit`) of a Killer puzzle, honouring Sudoku rules
 * *and* cage constraints (distinct digits per cage, sums match). `clues` may be
 * an 81-char string ('0' = empty) or omitted for an all-empty board.
 *
 * Bounded by `maxNodes` so it always terminates; check `exhausted` before
 * trusting a `count` of 0 or 1.
 */
export function countKillerSolutions(
  cages: KillerCage[],
  clues?: string,
  opts: { limit?: number; maxNodes?: number } = {}
): KillerSolveCount {
  const limit = opts.limit ?? 2;
  const maxNodes = opts.maxNodes ?? 500_000;

  const grid = clues ? clues.split("").map(Number) : new Array(81).fill(0);
  const cageOf = new Array(81).fill(-1);
  cages.forEach((cg, ci) => cg.cells.forEach(([r, c]) => (cageOf[r * 9 + c] = ci)));

  // Cages already fully filled by the clues are never revisited during the
  // search, so validate them (distinct digits + exact sum) upfront.
  for (const cg of cages) {
    const vals = cg.cells.map(([r, c]) => grid[r * 9 + c]);
    if (vals.every((v) => v !== 0)) {
      const sum = vals.reduce((a, b) => a + b, 0);
      if (new Set(vals).size !== vals.length || sum !== cg.sum) {
        return { count: 0, exhausted: false };
      }
    }
  }

  let count = 0;
  let nodes = 0;
  let exhausted = false;

  const cageFeasible = (pos: number, n: number): boolean => {
    const ci = cageOf[pos];
    if (ci < 0) return true;
    const cg = cages[ci];
    let sum = 0;
    let filled = 0;
    const used = new Set<number>();
    for (const [r, c] of cg.cells) {
      const v = grid[r * 9 + c];
      if (v) {
        sum += v;
        filled++;
        used.add(v);
      }
    }
    if (used.has(n)) return false;
    const newSum = sum + n;
    const remaining = cg.cells.length - (filled + 1);
    if (remaining === 0) return newSum === cg.sum;

    const avail: number[] = [];
    for (let d = 1; d <= 9; d++) if (d !== n && !used.has(d)) avail.push(d);
    if (avail.length < remaining) return false;
    let minR = 0;
    let maxR = 0;
    for (let k = 0; k < remaining; k++) {
      minR += avail[k];
      maxR += avail[avail.length - 1 - k];
    }
    return newSum + minR <= cg.sum && newSum + maxR >= cg.sum;
  };

  const recurse = (): void => {
    if (count >= limit || exhausted) return;
    if (++nodes > maxNodes) {
      exhausted = true;
      return;
    }
    const pos = grid.indexOf(0);
    if (pos === -1) {
      count++;
      return;
    }
    for (let n = 1; n <= 9; n++) {
      if (count >= limit || exhausted) return;
      if (sudokuLegal(grid, pos, n) && cageFeasible(pos, n)) {
        grid[pos] = n;
        recurse();
        grid[pos] = 0;
      }
    }
  };

  recurse();
  return { count, exhausted };
}

/**
 * Does the Killer puzzle have exactly one solution from its cages (+ any clues)?
 * Returns false if ambiguous, unsolvable, or the search was bounded out.
 */
export function hasUniqueKillerSolution(
  puzzle: Puzzle,
  maxNodes = 500_000
): boolean {
  const r = countKillerSolutions(puzzle.killerCages ?? [], puzzle.clues, {
    limit: 2,
    maxNodes,
  });
  return !r.exhausted && r.count === 1;
}
