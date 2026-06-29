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

/** Flood-fill to build connected cage regions from a solved grid */
function buildCages(
  solution: number[],
  rng: () => number
): KillerCage[] {
  const visited = new Array(81).fill(false);
  const cages: KillerCage[] = [];
  let cageId = 0;

  // Order cells randomly so cage shapes vary per seed
  const order = Array.from({ length: 81 }, (_, i) => i).sort(() => rng() - 0.5);

  for (const start of order) {
    if (visited[start]) continue;

    const size = Math.floor(rng() * 4) + 2; // cage size 2–5
    const cage: CageCell[] = [];
    const queue = [start];
    visited[start] = true;

    while (queue.length > 0 && cage.length < size) {
      const idx = queue.shift()!;
      const r = Math.floor(idx / 9);
      const c = idx % 9;
      cage.push({ row: r, col: c });

      // Add unvisited neighbours
      const neighbours = [
        idx - 9, idx + 9, idx - 1, idx + 1,
      ].filter((n) => {
        if (n < 0 || n >= 81) return false;
        if (visited[n]) return false;
        // Prevent row wrap
        if ((idx % 9 === 0 && n === idx - 1) || (idx % 9 === 8 && n === idx + 1))
          return false;
        return true;
      });

      for (const nb of neighbours) {
        if (!visited[nb]) {
          visited[nb] = true;
          queue.push(nb);
        }
      }
    }

    const sum = cage.reduce((acc, { row, col }) => acc + solution[row * 9 + col], 0);
    cages.push({
      id: `cage-${cageId++}`,
      sum,
      cells: cage.map(({ row, col }) => [row, col]),
    });
  }

  // Ensure all 81 cells are covered (stragglers become size-1 cages)
  for (let i = 0; i < 81; i++) {
    if (!visited[i]) {
      const r = Math.floor(i / 9);
      const c = i % 9;
      cages.push({
        id: `cage-${cageId++}`,
        sum: solution[i],
        cells: [[r, c]],
      });
    }
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
