/**
 * Validity-preserving Sudoku transformations.
 *
 * Relabelling digits, permuting bands/stacks, permuting rows within a band or
 * columns within a stack, and transposing all map a valid puzzle to a valid
 * puzzle with the same number of solutions — and the same logical structure,
 * so the techniques needed (and hence the difficulty) are unchanged. One base
 * puzzle yields up to 9! · 6⁸ · 2 ≈ 1.2 · 10¹² distinct-looking variants.
 */

function shuffled<T>(items: T[], rng: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface SudokuTransform {
  /** digitMap[d] = new digit for d (index 0 maps to 0). */
  digitMap: number[];
  /** Source row for each target row. */
  rows: number[];
  /** Source column for each target column. */
  cols: number[];
  transpose: boolean;
}

/** A random transform; deterministic for a given rng. */
export function randomTransform(rng: () => number): SudokuTransform {
  const digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  const lines = () => shuffled([0, 1, 2], rng).flatMap((band) => shuffled([0, 1, 2], rng).map((r) => band * 3 + r));
  return { digitMap: [0, ...digits], rows: lines(), cols: lines(), transpose: rng() < 0.5 };
}

/** Apply a transform to an 81-char grid string ('0' = empty). */
export function applyTransform(grid: string, t: SudokuTransform): string {
  const out: string[] = new Array(81);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const [sr, sc] = t.transpose ? [t.cols[c], t.rows[r]] : [t.rows[r], t.cols[c]];
      out[r * 9 + c] = String(t.digitMap[Number(grid[sr * 9 + sc])]);
    }
  }
  return out.join("");
}
