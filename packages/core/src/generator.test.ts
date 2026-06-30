import { describe, it, expect } from "vitest";
import {
  generateSudoku,
  solvePuzzle,
  createPuzzle,
  createDailyPuzzle,
} from "./index.js";

/** Validate that an 81-char string is a complete, legal Sudoku solution. */
function isValidCompleteGrid(s: string): boolean {
  if (s.length !== 81) return false;
  if (!/^[1-9]{81}$/.test(s)) return false;

  const unitHasAll = (idxs: number[]): boolean => {
    const seen = new Set<string>();
    for (const i of idxs) seen.add(s[i]);
    return seen.size === 9;
  };

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
    if (!unitHasAll(row) || !unitHasAll(col) || !unitHasAll(box)) return false;
  }
  return true;
}

describe("generateSudoku", () => {
  it("produces 81-char puzzle and solution", () => {
    const { puzzle, solution } = generateSudoku("easy", "seed-a");
    expect(puzzle).toHaveLength(81);
    expect(solution).toHaveLength(81);
  });

  it("produces a legal complete solution", () => {
    const { solution } = generateSudoku("medium", "seed-b");
    expect(isValidCompleteGrid(solution)).toBe(true);
  });

  it("puzzle clues are a subset of the solution", () => {
    const { puzzle, solution } = generateSudoku("hard", "seed-c");
    for (let i = 0; i < 81; i++) {
      if (puzzle[i] !== "0") {
        expect(puzzle[i]).toBe(solution[i]);
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generateSudoku("easy", "same-seed");
    const b = generateSudoku("easy", "same-seed");
    expect(a.puzzle).toBe(b.puzzle);
    expect(a.solution).toBe(b.solution);
  });

  it("different seeds give different puzzles", () => {
    const a = generateSudoku("easy", "seed-1");
    const b = generateSudoku("easy", "seed-2");
    expect(a.puzzle).not.toBe(b.puzzle);
  });

  it("clue count scales with difficulty", () => {
    const clues = (s: string) => s.split("").filter((c) => c !== "0").length;
    const easy = clues(generateSudoku("easy", "d1").puzzle);
    const hard = clues(generateSudoku("hard", "d1").puzzle);
    expect(easy).toBeGreaterThanOrEqual(36);
    expect(hard).toBeGreaterThanOrEqual(22);
    expect(easy).toBeGreaterThan(hard);
  });
});

describe("solvePuzzle", () => {
  it("solves clues back to the generator's solution", () => {
    const { puzzle, solution } = generateSudoku("medium", "solve-seed");
    expect(solvePuzzle(puzzle)).toBe(solution);
  });

  it("solution it returns is a legal grid", () => {
    const { puzzle } = generateSudoku("hard", "solve-seed-2");
    const solved = solvePuzzle(puzzle);
    expect(solved).not.toBeNull();
    expect(isValidCompleteGrid(solved as string)).toBe(true);
  });
});

describe("createPuzzle / createDailyPuzzle", () => {
  it("createPuzzle tags variant classic and carries id", () => {
    const p = createPuzzle("easy", "seed", "puzzle-1");
    expect(p.variant).toBe("classic");
    expect(p.id).toBe("puzzle-1");
    expect(p.clues).toHaveLength(81);
  });

  it("daily puzzle is deterministic per date", () => {
    const a = createDailyPuzzle("2026-06-30");
    const b = createDailyPuzzle("2026-06-30");
    const c = createDailyPuzzle("2026-07-01");
    expect(a.clues).toBe(b.clues);
    expect(a.clues).not.toBe(c.clues);
    expect(a.date).toBe("2026-06-30");
  });
});
