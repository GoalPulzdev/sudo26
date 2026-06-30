/**
 * Structured Sudoku solver.
 *
 * Three layers:
 *  - validatePuzzle      – input is well-formed and clues are legal
 *  - countSolutions      – uniqueness (backtracking, capped)
 *  - solveWithBacktracking – brute force, always finds a solution if one exists
 *  - solveWithLogic      – human techniques, records which were required
 *
 * `solvePuzzle` style helpers return structured results, never a bare string.
 */

import type { SolveResult, SolvingTechnique } from "./types.js";

type Grid = number[]; // 81 cells, row-major, 0 = empty

// ─── Units ─────────────────────────────────────────────────────────────────────

function rowIdx(r: number): number[] {
  return Array.from({ length: 9 }, (_, c) => r * 9 + c);
}
function colIdx(c: number): number[] {
  return Array.from({ length: 9 }, (_, r) => r * 9 + c);
}
function boxIdx(b: number): number[] {
  const br = Math.floor(b / 3) * 3;
  const bc = (b % 3) * 3;
  return Array.from({ length: 9 }, (_, j) => (br + Math.floor(j / 3)) * 9 + bc + (j % 3));
}

/** All 27 units (9 rows, 9 cols, 9 boxes). */
const UNITS: number[][] = (() => {
  const u: number[][] = [];
  for (let i = 0; i < 9; i++) u.push(rowIdx(i), colIdx(i), boxIdx(i));
  return u;
})();

function boxOf(i: number): number {
  return Math.floor(i / 9 / 3) * 3 + Math.floor((i % 9) / 3);
}

// ─── Parsing & validation ───────────────────────────────────────────────────────

function parse(clues: string): Grid {
  return clues.split("").map((c) => Number(c));
}

/** Validate length, characters, and that givens don't break Sudoku rules. */
export function validatePuzzle(clues: string): { ok: boolean; error?: string } {
  if (clues.length !== 81) return { ok: false, error: "puzzle must be 81 characters" };
  if (!/^[0-9]{81}$/.test(clues)) return { ok: false, error: "puzzle must contain only digits 0-9" };

  const grid = parse(clues);
  for (const unit of UNITS) {
    const seen = new Set<number>();
    for (const i of unit) {
      const v = grid[i];
      if (v === 0) continue;
      if (seen.has(v)) return { ok: false, error: "clues violate Sudoku rules" };
      seen.add(v);
    }
  }
  return { ok: true };
}

// ─── Backtracking ────────────────────────────────────────────────────────────────

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

function fill(grid: Grid): boolean {
  const pos = grid.indexOf(0);
  if (pos === -1) return true;
  for (let n = 1; n <= 9; n++) {
    if (isLegal(grid, pos, n)) {
      grid[pos] = n;
      if (fill(grid)) return true;
      grid[pos] = 0;
    }
  }
  return false;
}

/** Brute-force solve. Returns the solved 81-char string, or null if unsolvable. */
export function solveWithBacktracking(clues: string): string | null {
  const grid = parse(clues);
  return fill(grid) ? grid.join("") : null;
}

/** Count solutions up to `limit` (default 2 — enough to prove uniqueness). */
export function countSolutions(clues: string, limit = 2): number {
  const grid = parse(clues);
  let count = 0;
  const recurse = (): void => {
    if (count >= limit) return;
    const pos = grid.indexOf(0);
    if (pos === -1) {
      count++;
      return;
    }
    for (let n = 1; n <= 9 && count < limit; n++) {
      if (isLegal(grid, pos, n)) {
        grid[pos] = n;
        recurse();
        grid[pos] = 0;
      }
    }
  };
  recurse();
  return count;
}

// ─── Candidate-based logic solver ────────────────────────────────────────────────

type Cands = Set<number>[]; // candidates per cell

function buildCands(grid: Grid): Cands {
  const cands: Cands = Array.from({ length: 81 }, () => new Set<number>());
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    for (let n = 1; n <= 9; n++) if (isLegal(grid, i, n)) cands[i].add(n);
  }
  return cands;
}

/** Place a value and remove it as a candidate from its peers. */
function place(grid: Grid, cands: Cands, i: number, n: number): void {
  grid[i] = n;
  cands[i].clear();
  const row = Math.floor(i / 9);
  const col = i % 9;
  for (const j of [...rowIdx(row), ...colIdx(col), ...boxIdx(boxOf(i))]) cands[j].delete(n);
}

function nakedSingle(grid: Grid, cands: Cands): boolean {
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0 && cands[i].size === 1) {
      place(grid, cands, i, [...cands[i]][0]);
      return true;
    }
  }
  return false;
}

function hiddenSingle(grid: Grid, cands: Cands): boolean {
  for (const unit of UNITS) {
    for (let n = 1; n <= 9; n++) {
      const spots = unit.filter((i) => grid[i] === 0 && cands[i].has(n));
      if (spots.length === 1) {
        place(grid, cands, spots[0], n);
        return true;
      }
    }
  }
  return false;
}

/** Naked pair: two cells in a unit share the same two candidates → eliminate elsewhere. */
function nakedPair(grid: Grid, cands: Cands): boolean {
  for (const unit of UNITS) {
    const cells = unit.filter((i) => grid[i] === 0 && cands[i].size === 2);
    for (let a = 0; a < cells.length; a++) {
      for (let b = a + 1; b < cells.length; b++) {
        const pa = [...cands[cells[a]]];
        const pb = [...cands[cells[b]]];
        if (pa[0] === pb[0] && pa[1] === pb[1]) {
          let changed = false;
          for (const i of unit) {
            if (i === cells[a] || i === cells[b]) continue;
            for (const v of pa) if (cands[i].delete(v)) changed = true;
          }
          if (changed) return true;
        }
      }
    }
  }
  return false;
}

/** Pointing / box-line: a candidate confined to one row/col of a box eliminates it from the rest of that row/col. */
function pointingPair(grid: Grid, cands: Cands): boolean {
  for (let b = 0; b < 9; b++) {
    const box = boxIdx(b);
    for (let n = 1; n <= 9; n++) {
      const spots = box.filter((i) => grid[i] === 0 && cands[i].has(n));
      if (spots.length < 2 || spots.length > 3) continue;
      const rows = new Set(spots.map((i) => Math.floor(i / 9)));
      const cols = new Set(spots.map((i) => i % 9));
      let changed = false;
      if (rows.size === 1) {
        const r = [...rows][0];
        for (const i of rowIdx(r)) if (boxOf(i) !== b && cands[i].delete(n)) changed = true;
      } else if (cols.size === 1) {
        const c = [...cols][0];
        for (const i of colIdx(c)) if (boxOf(i) !== b && cands[i].delete(n)) changed = true;
      }
      if (changed) return true;
    }
  }
  return false;
}

/** Box-line reduction: candidate in a row/col confined to one box eliminates it from the rest of that box. */
function boxLineReduction(grid: Grid, cands: Cands): boolean {
  const lines = [
    ...Array.from({ length: 9 }, (_, r) => rowIdx(r)),
    ...Array.from({ length: 9 }, (_, c) => colIdx(c)),
  ];
  for (const line of lines) {
    for (let n = 1; n <= 9; n++) {
      const spots = line.filter((i) => grid[i] === 0 && cands[i].has(n));
      if (spots.length < 2) continue;
      const boxes = new Set(spots.map(boxOf));
      if (boxes.size !== 1) continue;
      const b = [...boxes][0];
      let changed = false;
      for (const i of boxIdx(b)) {
        if (line.includes(i)) continue;
        if (cands[i].delete(n)) changed = true;
      }
      if (changed) return true;
    }
  }
  return false;
}

/** X-Wing: a candidate forms a rectangle across two rows/cols → eliminate from the crossing lines. */
function xWing(grid: Grid, cands: Cands): boolean {
  for (let n = 1; n <= 9; n++) {
    // Row-based X-Wing
    const rowCols: number[][] = [];
    for (let r = 0; r < 9; r++) {
      rowCols[r] = rowIdx(r).filter((i) => grid[i] === 0 && cands[i].has(n)).map((i) => i % 9);
    }
    for (let r1 = 0; r1 < 9; r1++) {
      if (rowCols[r1].length !== 2) continue;
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        if (rowCols[r2].length !== 2) continue;
        if (rowCols[r1][0] === rowCols[r2][0] && rowCols[r1][1] === rowCols[r2][1]) {
          const [c1, c2] = rowCols[r1];
          let changed = false;
          for (const c of [c1, c2]) {
            for (const i of colIdx(c)) {
              const r = Math.floor(i / 9);
              if (r === r1 || r === r2) continue;
              if (cands[i].delete(n)) changed = true;
            }
          }
          if (changed) return true;
        }
      }
    }
    // Column-based X-Wing
    const colRows: number[][] = [];
    for (let c = 0; c < 9; c++) {
      colRows[c] = colIdx(c).filter((i) => grid[i] === 0 && cands[i].has(n)).map((i) => Math.floor(i / 9));
    }
    for (let c1 = 0; c1 < 9; c1++) {
      if (colRows[c1].length !== 2) continue;
      for (let c2 = c1 + 1; c2 < 9; c2++) {
        if (colRows[c2].length !== 2) continue;
        if (colRows[c1][0] === colRows[c2][0] && colRows[c1][1] === colRows[c2][1]) {
          const [r1, r2] = colRows[c1];
          let changed = false;
          for (const r of [r1, r2]) {
            for (const i of rowIdx(r)) {
              const c = i % 9;
              if (c === c1 || c === c2) continue;
              if (cands[i].delete(n)) changed = true;
            }
          }
          if (changed) return true;
        }
      }
    }
  }
  return false;
}

/**
 * Solve using human techniques, hardest-required tracked.
 * Placement techniques fill cells; elimination techniques prune candidates so
 * that placements open up. If the board stalls, the puzzle needs guessing.
 */
export function solveWithLogic(clues: string): SolveResult {
  const valid = validatePuzzle(clues);
  if (!valid.ok) {
    return { solved: false, unique: false, techniques: [], error: valid.error };
  }

  const grid = parse(clues);
  const cands = buildCands(grid);
  const used = new Set<SolvingTechnique>();

  const elimination: [SolvingTechnique, (g: Grid, c: Cands) => boolean][] = [
    ["naked_pair", nakedPair],
    ["pointing_pair", pointingPair],
    ["box_line_reduction", boxLineReduction],
    ["x_wing", xWing],
  ];

  for (;;) {
    if (grid.indexOf(0) === -1) break;

    if (nakedSingle(grid, cands)) { used.add("naked_single"); continue; }
    if (hiddenSingle(grid, cands)) { used.add("hidden_single"); continue; }

    let progressed = false;
    for (const [tech, fn] of elimination) {
      if (fn(grid, cands)) {
        used.add(tech);
        progressed = true;
        break;
      }
    }
    if (progressed) continue;
    break; // stalled
  }

  const solved = grid.indexOf(0) === -1;
  const techniques = orderTechniques(used);
  if (!solved) techniques.push("guess_required");

  return {
    solved,
    solution: solved ? grid.join("") : undefined,
    unique: countSolutions(clues) === 1,
    techniques,
  };
}

const TECHNIQUE_ORDER: SolvingTechnique[] = [
  "naked_single",
  "hidden_single",
  "naked_pair",
  "pointing_pair",
  "box_line_reduction",
  "x_wing",
  "guess_required",
];

function orderTechniques(used: Set<SolvingTechnique>): SolvingTechnique[] {
  return TECHNIQUE_ORDER.filter((t) => used.has(t));
}

/**
 * Structured solve: validates, solves (logic first, backtracking fallback),
 * and reports uniqueness. Never returns a bare string.
 */
export function solve(clues: string): SolveResult {
  const logic = solveWithLogic(clues);
  if (logic.solved) return logic;

  // Logic stalled — fall back to backtracking so we still return a solution.
  if (logic.error) return logic;
  const brute = solveWithBacktracking(clues);
  return {
    solved: brute !== null,
    solution: brute ?? undefined,
    unique: countSolutions(clues) === 1,
    techniques: logic.techniques, // includes "guess_required"
    error: brute === null ? "no solution" : undefined,
  };
}
