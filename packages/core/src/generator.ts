/**
 * Sudoku puzzle generator & solver.
 *
 * Uses a seeded pseudo-random number generator (xoshiro128**)
 * so puzzles are reproducible from a seed string.
 */

import type { Difficulty, Puzzle } from "./types.js";
import { boardFromPuzzle } from "./board.js";
import { rateDifficulty } from "./difficulty.js";

// ─── Seeded RNG (xoshiro128**) ────────────────────────────────────────────────

function splitmix32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t ^= t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return ((t ^= t >>> 15) >>> 0) / 4294967296;
  };
}

function seedToNumber(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function createRng(seed: string): () => number {
  return splitmix32(seedToNumber(seed));
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Core solver ─────────────────────────────────────────────────────────────

const EMPTY = 0;
type Grid = number[];

function isValid(grid: Grid, pos: number, num: number): boolean {
  const row = Math.floor(pos / 9);
  const col = pos % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 9; i++) {
    if (grid[row * 9 + i] === num) return false;
    if (grid[i * 9 + col] === num) return false;
    const br = boxRow + Math.floor(i / 3);
    const bc = boxCol + (i % 3);
    if (grid[br * 9 + bc] === num) return false;
  }
  return true;
}

function findEmpty(grid: Grid): number {
  return grid.indexOf(EMPTY);
}

/** Fill the grid completely. Returns true on success. */
function fillGrid(grid: Grid, rng?: () => number): boolean {
  const pos = findEmpty(grid);
  if (pos === -1) return true;

  const nums = rng
    ? shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)
    : [1, 2, 3, 4, 5, 6, 7, 8, 9];

  for (const num of nums) {
    if (isValid(grid, pos, num)) {
      grid[pos] = num;
      if (fillGrid(grid, rng)) return true;
      grid[pos] = EMPTY;
    }
  }
  return false;
}

/** Count solutions (up to 2) to determine uniqueness. */
function countSolutions(grid: Grid, limit = 2): number {
  const pos = findEmpty(grid);
  if (pos === -1) return 1;

  let count = 0;
  for (let num = 1; num <= 9; num++) {
    if (isValid(grid, pos, num)) {
      grid[pos] = num;
      count += countSolutions(grid, limit);
      grid[pos] = EMPTY;
      if (count >= limit) break;
    }
  }
  return count;
}

// ─── Clue removal ────────────────────────────────────────────────────────────

const CLUE_COUNTS: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 36, max: 46 },
  medium: { min: 28, max: 35 },
  hard: { min: 22, max: 27 },
  extreme: { min: 17, max: 21 },
  daily: { min: 26, max: 32 },
  mini: { min: 16, max: 24 }, // not used by classic generator, but satisfies Record<Difficulty>
};

function removeClues(
  solution: Grid,
  difficulty: Difficulty,
  rng: () => number
): Grid {
  const puzzle = [...solution];
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => i),
    rng
  );
  const { min } = CLUE_COUNTS[difficulty];
  let cluesLeft = 81;

  for (const pos of positions) {
    if (cluesLeft <= min) break;
    const backup = puzzle[pos];
    puzzle[pos] = EMPTY;
    const copy = [...puzzle];
    if (countSolutions(copy) === 1) {
      cluesLeft--;
    } else {
      puzzle[pos] = backup;
    }
  }
  return puzzle;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateSudoku(
  difficulty: Difficulty,
  seed: string
): { puzzle: string; solution: string } {
  const rng = createRng(seed);
  const solution: Grid = new Array(81).fill(EMPTY);
  fillGrid(solution, rng);
  const puzzle = removeClues(solution, difficulty, rng);
  return {
    puzzle: puzzle.join(""),
    solution: solution.join(""),
  };
}

export function solvePuzzle(clues: string): string | null {
  const grid: Grid = clues.split("").map(Number);
  if (!fillGrid(grid)) return null;
  return grid.join("");
}

export function createPuzzle(
  difficulty: Difficulty,
  seed: string,
  puzzleId: string,
  date?: string
): Puzzle {
  const { puzzle, solution } = generateSudoku(difficulty, seed);
  return {
    id: puzzleId,
    variant: "classic",
    difficulty,
    clues: puzzle,
    solution,
    seed,
    ...(date ? { date } : {}),
  };
}

/** Generate a deterministic daily puzzle based on the date string (YYYY-MM-DD) */
export function createDailyPuzzle(date: string): Puzzle {
  const seed = `daily-${date}`;
  const id = `daily-${date}`;
  return createPuzzle("daily", seed, id, date);
}

/**
 * Like `createPuzzle`, but attaches a technique-based `DifficultyRating` measured
 * by solving the puzzle with the logic engine. The `difficulty` label still comes
 * from the requested clue bucket; `rating` reports the actual solving difficulty.
 */
export function createRatedPuzzle(
  difficulty: Difficulty,
  seed: string,
  puzzleId: string,
  date?: string
): Puzzle {
  const puzzle = createPuzzle(difficulty, seed, puzzleId, date);
  return { ...puzzle, rating: rateDifficulty(puzzle.clues) };
}

export { boardFromPuzzle };
