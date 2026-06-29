/**
 * 6×6 Mini Sudoku generator & solver.
 *
 * Grid layout: 6 rows × 6 cols, values 1–6.
 * Boxes are 2 rows × 3 cols (6 boxes total).
 *
 *  ┌───┬───┬───┬───┬───┬───┐
 *  │ · │ · │ · │ · │ · │ · │  box(0,0)=[r0-1,c0-2]  box(0,1)=[r0-1,c3-5]
 *  ├───┼───┼───┼───┼───┼───┤
 *  │ · │ · │ · │ · │ · │ · │
 *  ├───┴───┴───┴───┴───┴───┤
 *  │ · │ · │ · │ · │ · │ · │  box(1,0)=[r2-3,c0-2]  box(1,1)=[r2-3,c3-5]
 *  ├───┼───┼───┼───┼───┼───┤
 *  │ · │ · │ · │ · │ · │ · │
 *  ├───┴───┴───┴───┴───┴───┤
 *  │ · │ · │ · │ · │ · │ · │  box(2,0)=[r4-5,c0-2]  box(2,1)=[r4-5,c3-5]
 *  ├───┼───┼───┼───┼───┼───┤
 *  │ · │ · │ · │ · │ · │ · │
 *  └───┴───┴───┴───┴───┴───┘
 */

import type { Puzzle } from "./types.js";

// ─── RNG (same xoshiro128** as generator.ts) ──────────────────────────────────

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

function createRng(seed: string): () => number {
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

// ─── 6×6 solver ───────────────────────────────────────────────────────────────

type MiniGrid = number[]; // 36 elements, row-major, values 0 (empty) or 1–6

/** box index for a cell at (row, col) in a 6×6 grid with 2×3 boxes */
function boxIndex(row: number, col: number): number {
  return Math.floor(row / 2) * 2 + Math.floor(col / 3);
}

function isMiniValid(grid: MiniGrid, pos: number, num: number): boolean {
  const row = Math.floor(pos / 6);
  const col = pos % 6;
  const boxRow = Math.floor(row / 2) * 2;
  const boxCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 6; i++) {
    if (grid[row * 6 + i] === num) return false; // row
    if (grid[i * 6 + col] === num) return false; // col
  }
  // 2×3 box
  for (let br = boxRow; br < boxRow + 2; br++) {
    for (let bc = boxCol; bc < boxCol + 3; bc++) {
      if (grid[br * 6 + bc] === num) return false;
    }
  }
  return true;
}

/** Fill grid completely with backtracking. Returns true on success. */
function fillMiniGrid(grid: MiniGrid, rng?: () => number): boolean {
  const pos = grid.indexOf(0);
  if (pos === -1) return true;

  const nums = rng
    ? shuffle([1, 2, 3, 4, 5, 6], rng)
    : [1, 2, 3, 4, 5, 6];

  for (const n of nums) {
    if (isMiniValid(grid, pos, n)) {
      grid[pos] = n;
      if (fillMiniGrid(grid, rng)) return true;
      grid[pos] = 0;
    }
  }
  return false;
}

/** Count solutions (stops at limit=2 for uniqueness check). */
function countMiniSolutions(grid: MiniGrid, limit = 2): number {
  const pos = grid.indexOf(0);
  if (pos === -1) return 1;

  let count = 0;
  for (let n = 1; n <= 6; n++) {
    if (isMiniValid(grid, pos, n)) {
      grid[pos] = n;
      count += countMiniSolutions(grid, limit);
      grid[pos] = 0;
      if (count >= limit) return count;
    }
  }
  return count;
}

// ─── Clue counts by difficulty ────────────────────────────────────────────────

const MINI_CLUES: Record<string, [number, number]> = {
  easy:   [20, 24],
  medium: [16, 19],
  hard:   [12, 15],
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a 6×6 Mini Sudoku puzzle.
 * Returns `{ clues, solution }` as 36-char strings ('0' = empty).
 */
export function generateMini(
  difficulty: "easy" | "medium" | "hard",
  seed: string
): { clues: string; solution: string } {
  const rng = createRng(seed);

  // Generate a full solution
  const solution: MiniGrid = Array(36).fill(0);
  fillMiniGrid(solution, rng);
  const solutionStr = solution.join("");

  // Remove clues while maintaining unique solution
  const [minClues, maxClues] = MINI_CLUES[difficulty];
  const targetClues = minClues + Math.floor(rng() * (maxClues - minClues + 1));

  const puzzle = [...solution];
  const positions = shuffle(
    Array.from({ length: 36 }, (_, i) => i),
    rng
  );

  let clueCount = 36;
  for (const pos of positions) {
    if (clueCount <= targetClues) break;
    const backup = puzzle[pos];
    puzzle[pos] = 0;
    if (countMiniSolutions([...puzzle]) === 1) {
      clueCount--;
    } else {
      puzzle[pos] = backup;
    }
  }

  return { clues: puzzle.join(""), solution: solutionStr };
}

/**
 * Create a full Puzzle object for a 6×6 Mini Sudoku.
 */
export function createMiniPuzzle(
  difficulty: "easy" | "medium" | "hard",
  seed: string,
  id: string
): Puzzle {
  const { clues, solution } = generateMini(difficulty, seed);
  return {
    id,
    variant: "mini",
    difficulty: "mini",
    clues,
    solution,
  };
}

// Re-export helpers consumers may need
export { boxIndex as miniBoxIndex };
