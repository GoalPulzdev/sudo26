/**
 * Samurai Sudoku generator.
 *
 * Five overlapping 9×9 grids arranged in an X-pattern on a 21×21 master grid.
 * The four corner grids each share a 3×3 box with the center grid.
 *
 *  TL (0,0)         TR (0,12)
 *          C (6,6)
 *  BL(12,0)         BR(12,12)
 */

import type { Puzzle } from "./types.js";
import { generateSudoku } from "./generator.js";

export interface SamuraiPuzzle extends Puzzle {
  subGridClues: [string, string, string, string, string];
  subGridSolutions: [string, string, string, string, string];
  /** Top-left [row, col] of each sub-grid in the 21×21 master grid */
  offsets: [[0, 0], [0, 12], [6, 6], [12, 0], [12, 12]];
}

/** Generate five interconnected Sudoku grids */
export function createSamuraiPuzzle(seed: string, puzzleId: string): SamuraiPuzzle {
  const grids = (["TL", "TR", "C", "BL", "BR"] as const).map((tag, i) =>
    generateSudoku("hard", `${seed}-${tag}-${i}`)
  );

  const clues = grids.map((g) => g.puzzle) as [string, string, string, string, string];
  const solutions = grids.map((g) => g.solution) as [string, string, string, string, string];

  return {
    id: puzzleId,
    variant: "samurai",
    difficulty: "extreme",
    // For samurai, `clues` / `solution` represent the center grid
    clues: clues[2],
    solution: solutions[2],
    seed,
    subGridClues: clues,
    subGridSolutions: solutions,
    offsets: [[0, 0], [0, 12], [6, 6], [12, 0], [12, 12]],
  };
}
