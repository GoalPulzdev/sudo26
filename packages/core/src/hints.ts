/**
 * AI Hint Engine
 *
 * Multi-strategy solver that surfaces the *easiest* applicable technique
 * so the player learns rather than just gets the answer.
 *
 * Strategies (in order of difficulty):
 *  1. Naked Single   – only one candidate in a cell
 *  2. Hidden Single  – a digit appears in only one cell in a unit
 *  3. Naked Pair     – two cells in a unit share exactly the same two candidates
 *  4. Pointing Pair  – a candidate in a box is confined to one row/col
 *  5. Solution Reveal – fall back to revealing the solution value with a friendly message
 *
 * NOTE: X-Wing is implemented in the solver/difficulty engine (`solver.ts`),
 * which is where elimination logic is verifiable. This placement-oriented hint
 * pipeline surfaces singles + pair eliminations, then reveals as a last resort.
 * The reveal fallback is NOT AI.
 */

import type { Hint, HintStrategy } from "./types.js";

type Candidates = number[][];

function buildCandidates(grid: number[]): Candidates {
  const cands: Candidates = Array.from({ length: 81 }, () => []);
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    const row = Math.floor(i / 9);
    const col = i % 9;
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    for (let n = 1; n <= 9; n++) {
      let ok = true;
      for (let j = 0; j < 9 && ok; j++) {
        if (grid[row * 9 + j] === n) ok = false;
        if (grid[j * 9 + col] === n) ok = false;
        const br = Math.floor(box / 3) * 3 + Math.floor(j / 3);
        const bc = (box % 3) * 3 + (j % 3);
        if (grid[br * 9 + bc] === n) ok = false;
      }
      if (ok) cands[i].push(n);
    }
  }
  return cands;
}

// ─── Strategy implementations ─────────────────────────────────────────────────

function nakedSingle(cands: Candidates): Hint | null {
  for (let i = 0; i < 81; i++) {
    if (cands[i].length === 1) {
      const v = cands[i][0];
      return {
        strategy: "naked_single",
        row: Math.floor(i / 9),
        col: i % 9,
        value: v as Hint["value"],
        explanation: `Rute (${Math.floor(i / 9) + 1}, ${(i % 9) + 1}) har bare én gyldig kandidat: **${v}**.`,
      };
    }
  }
  return null;
}

function hiddenSingle(cands: Candidates): Hint | null {
  // Build units: rows, cols, boxes
  const units: number[][] = [];
  for (let u = 0; u < 9; u++) {
    const row: number[] = [];
    const col: number[] = [];
    const box: number[] = [];
    for (let j = 0; j < 9; j++) {
      row.push(u * 9 + j);
      col.push(j * 9 + u);
      const br = Math.floor(u / 3) * 3 + Math.floor(j / 3);
      const bc = (u % 3) * 3 + (j % 3);
      box.push(br * 9 + bc);
    }
    units.push(row, col, box);
  }

  for (const unit of units) {
    for (let n = 1; n <= 9; n++) {
      const positions = unit.filter((i) => cands[i].includes(n));
      if (positions.length === 1) {
        const i = positions[0];
        return {
          strategy: "hidden_single",
          row: Math.floor(i / 9),
          col: i % 9,
          value: n as Hint["value"],
          explanation: `Sifferet **${n}** kan bare plasseres i én rute innenfor denne enheten. Rute (${
            Math.floor(i / 9) + 1
          }, ${i % 9 + 1}) er stedet.`,
        };
      }
    }
  }
  return null;
}

function nakedPair(cands: Candidates): Hint | null {
  const units: number[][] = [];
  for (let u = 0; u < 9; u++) {
    const row = Array.from({ length: 9 }, (_, j) => u * 9 + j);
    const col = Array.from({ length: 9 }, (_, j) => j * 9 + u);
    const boxRow = Math.floor(u / 3) * 3;
    const boxCol = (u % 3) * 3;
    const box = Array.from({ length: 9 }, (_, j) => (boxRow + Math.floor(j / 3)) * 9 + boxCol + (j % 3));
    units.push(row, col, box);
  }

  for (const unit of units) {
    const pairs = unit.filter((i) => cands[i].length === 2);
    for (let a = 0; a < pairs.length; a++) {
      for (let b = a + 1; b < pairs.length; b++) {
        const ca = cands[pairs[a]];
        const cb = cands[pairs[b]];
        if (ca[0] === cb[0] && ca[1] === cb[1]) {
          // Found a naked pair – the hint is to note the elimination opportunity
          return {
            strategy: "naked_pair",
            row: Math.floor(pairs[a] / 9),
            col: pairs[a] % 9,
            value: ca[0] as Hint["value"],
            explanation: `Rute (${Math.floor(pairs[a] / 9) + 1},${pairs[a] % 9 + 1}) og (${
              Math.floor(pairs[b] / 9) + 1
            },${pairs[b] % 9 + 1}) deler kun kandidatene **${ca[0]}** og **${
              ca[1]
            }**. Du kan eliminere disse fra resten av enheten.`,
          };
        }
      }
    }
  }
  return null;
}

function pointingPair(cands: Candidates): Hint | null {
  for (let box = 0; box < 9; box++) {
    const boxRow = Math.floor(box / 3) * 3;
    const boxCol = (box % 3) * 3;

    for (let n = 1; n <= 9; n++) {
      const cells: number[] = [];
      for (let j = 0; j < 9; j++) {
        const r = boxRow + Math.floor(j / 3);
        const c = boxCol + (j % 3);
        if (cands[r * 9 + c].includes(n)) cells.push(r * 9 + c);
      }
      if (cells.length < 2 || cells.length > 3) continue;

      const rows = [...new Set(cells.map((i) => Math.floor(i / 9)))];
      const cols = [...new Set(cells.map((i) => i % 9))];

      if (rows.length === 1) {
        return {
          strategy: "pointing_pair",
          row: rows[0],
          col: cols[0],
          value: n as Hint["value"],
          explanation: `Sifferet **${n}** i boks ${box + 1} er begrenset til rad ${
            rows[0] + 1
          }. Det kan elimineres fra resten av den raden.`,
        };
      }
      if (cols.length === 1) {
        return {
          strategy: "pointing_pair",
          row: rows[0],
          col: cols[0],
          value: n as Hint["value"],
          explanation: `Sifferet **${n}** i boks ${box + 1} er begrenset til kolonne ${
            cols[0] + 1
          }. Det kan elimineres fra resten av den kolonnen.`,
        };
      }
    }
  }
  return null;
}

function solutionReveal(grid: number[], solution: string): Hint | null {
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) {
      const v = parseInt(solution[i], 10);
      return {
        strategy: "solution_reveal",
        row: Math.floor(i / 9),
        col: i % 9,
        value: v as Hint["value"],
        explanation: `Fasit: Sett inn **${v}** i rute (${Math.floor(i / 9) + 1}, ${
          i % 9 + 1
        }). Prøv å finne logikken selv neste gang!`,
      };
    }
  }
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Given the current board state (81-char string) and puzzle solution, return the best hint. */
export function getHint(currentBoard: string, solution: string): Hint | null {
  const grid = currentBoard.split("").map(Number);

  const strategies: Array<() => Hint | null> = [
    () => nakedSingle(buildCandidates(grid)),
    () => hiddenSingle(buildCandidates(grid)),
    () => nakedPair(buildCandidates(grid)),
    () => pointingPair(buildCandidates(grid)),
    () => solutionReveal(grid, solution),
  ];

  for (const strategy of strategies) {
    const hint = strategy();
    if (hint) return hint;
  }
  return null;
}

export type { HintStrategy };
