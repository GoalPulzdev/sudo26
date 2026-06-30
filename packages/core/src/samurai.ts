/**
 * Samurai Sudoku generator — five overlapping 9×9 grids on a 21×21 master grid.
 *
 *  TL (0,0)            TR (0,12)
 *             C (6,6)
 *  BL (12,0)           BR (12,12)
 *
 * Each corner shares one 3×3 box with the center. Those overlap cells MUST be
 * identical in both grids, otherwise it is five independent puzzles, not a real
 * Samurai. This generator builds the center first, then completes each corner
 * with the shared box fixed from the center — so overlaps match by construction.
 *
 * Array order is [TL, TR, C, BL, BR]; index 2 is the center.
 */

import type { Puzzle } from "./types.js";
import { createRng } from "./generator.js";
import { countSolutions } from "./solver.js";

export interface SamuraiPuzzle extends Puzzle {
  subGridClues: [string, string, string, string, string];
  subGridSolutions: [string, string, string, string, string];
  /** Top-left [row, col] of each sub-grid in the 21×21 master grid */
  offsets: [[0, 0], [0, 12], [6, 6], [12, 0], [12, 12]];
}

type Grid = number[]; // 81 cells, row-major

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isLegal(grid: Grid, pos: number, num: number): boolean {
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

/** Complete a grid (respecting pre-filled cells) with seeded backtracking. */
function fillConstrained(grid: Grid, rng: () => number): boolean {
  const pos = grid.indexOf(0);
  if (pos === -1) return true;
  for (const num of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)) {
    if (isLegal(grid, pos, num)) {
      grid[pos] = num;
      if (fillConstrained(grid, rng)) return true;
      grid[pos] = 0;
    }
  }
  return false;
}

/** Local cell indices of a 3×3 box, addressed by box-row/box-col (0–2). */
function boxCells(boxRow: number, boxCol: number): number[] {
  const out: number[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) out.push((boxRow * 3 + r) * 9 + (boxCol * 3 + c));
  return out;
}

/**
 * Which box each corner shares with the center.
 * cornerBox ← centerBox (same 3×3 of the master overlap).
 */
const OVERLAP: { cornerBox: [number, number]; centerBox: [number, number] }[] = [
  { cornerBox: [2, 2], centerBox: [0, 0] }, // TL bottom-right  ← center top-left
  { cornerBox: [2, 0], centerBox: [0, 2] }, // TR bottom-left   ← center top-right
  { cornerBox: [0, 2], centerBox: [2, 0] }, // BL top-right     ← center bottom-left
  { cornerBox: [0, 0], centerBox: [2, 2] }, // BR top-left      ← center bottom-right
];

/** Build a corner solution whose shared box equals the center's matching box. */
function buildCorner(center: Grid, overlapIdx: number, rng: () => number): Grid {
  const { cornerBox, centerBox } = OVERLAP[overlapIdx];
  const corner: Grid = new Array(81).fill(0);
  const cCells = boxCells(cornerBox[0], cornerBox[1]);
  const centerCells = boxCells(centerBox[0], centerBox[1]);
  for (let k = 0; k < 9; k++) corner[cCells[k]] = center[centerCells[k]];
  fillConstrained(corner, rng);
  return corner;
}

/**
 * Remove clues from a sub-grid while keeping a unique solution, but never remove
 * the overlap-box cells (kept as givens so overlaps stay visible and identical).
 */
function makeClues(
  solution: Grid,
  keepGiven: Set<number>,
  minClues: number,
  rng: () => number
): string {
  const puzzle = [...solution];
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => i).filter((i) => !keepGiven.has(i)),
    rng
  );
  let clues = 81;
  for (const pos of positions) {
    if (clues <= minClues) break;
    const backup = puzzle[pos];
    puzzle[pos] = 0;
    if (countSolutions(puzzle.join("")) === 1) clues--;
    else puzzle[pos] = backup;
  }
  return puzzle.join("");
}

export function createSamuraiPuzzle(seed: string, puzzleId: string): SamuraiPuzzle {
  const rng = createRng(seed);

  // 1. Center solution.
  const center: Grid = new Array(81).fill(0);
  fillConstrained(center, rng);

  // 2. Corner solutions, each pinned to the center's shared box.
  const tl = buildCorner(center, 0, rng);
  const tr = buildCorner(center, 1, rng);
  const bl = buildCorner(center, 2, rng);
  const br = buildCorner(center, 3, rng);

  // 3. Clues — keep overlap boxes as givens in every grid.
  const cornerKeep = (idx: number): Set<number> =>
    new Set(boxCells(OVERLAP[idx].cornerBox[0], OVERLAP[idx].cornerBox[1]));
  const centerKeep = new Set<number>([
    ...boxCells(0, 0), ...boxCells(0, 2), ...boxCells(2, 0), ...boxCells(2, 2),
  ]);

  const solutions: [string, string, string, string, string] = [
    tl.join(""), tr.join(""), center.join(""), bl.join(""), br.join(""),
  ];
  const clues: [string, string, string, string, string] = [
    makeClues(tl, cornerKeep(0), 30, rng),
    makeClues(tr, cornerKeep(1), 30, rng),
    makeClues(center, centerKeep, 32, rng),
    makeClues(bl, cornerKeep(2), 30, rng),
    makeClues(br, cornerKeep(3), 30, rng),
  ];

  return {
    id: puzzleId,
    variant: "samurai",
    difficulty: "extreme",
    // `clues` / `solution` mirror the center grid for the shared game engine.
    clues: clues[2],
    solution: solutions[2],
    seed,
    subGridClues: clues,
    subGridSolutions: solutions,
    offsets: [[0, 0], [0, 12], [6, 6], [12, 0], [12, 12]],
  };
}

/**
 * Verify the defining Samurai invariant: every corner's shared box equals the
 * center's matching box (in both the solution and the clues).
 */
export function validateSamurai(puzzle: SamuraiPuzzle): { ok: boolean; error?: string } {
  const center = puzzle.subGridSolutions[2].split("").map(Number);
  const centerClues = puzzle.subGridClues[2].split("").map(Number);
  const cornerOrder = [0, 1, 3, 4]; // TL, TR, BL, BR in subGrid array
  const overlapOrder = [0, 1, 2, 3]; // matching OVERLAP entries

  for (let k = 0; k < 4; k++) {
    const sub = cornerOrder[k];
    const { cornerBox, centerBox } = OVERLAP[overlapOrder[k]];
    const cornerSol = puzzle.subGridSolutions[sub].split("").map(Number);
    const cornerClue = puzzle.subGridClues[sub].split("").map(Number);
    const cCells = boxCells(cornerBox[0], cornerBox[1]);
    const centerCells = boxCells(centerBox[0], centerBox[1]);
    for (let i = 0; i < 9; i++) {
      if (cornerSol[cCells[i]] !== center[centerCells[i]]) {
        return { ok: false, error: `solution overlap mismatch on corner ${sub}` };
      }
      if (cornerClue[cCells[i]] !== centerClues[centerCells[i]]) {
        return { ok: false, error: `clue overlap mismatch on corner ${sub}` };
      }
    }
  }
  return { ok: true };
}
