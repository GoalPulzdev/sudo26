import { describe, it, expect } from "vitest";
import { generateSudoku } from "./index.js";
import {
  validatePuzzle,
  countSolutions,
  solveWithBacktracking,
  solveWithLogic,
  solve,
} from "./index.js";

// Canonical "easy" Sudoku, solvable with human logic (no guessing).
const EASY =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";

describe("validatePuzzle", () => {
  it("accepts a generated puzzle and its solution", () => {
    const { puzzle, solution } = generateSudoku("medium", "v-seed");
    expect(validatePuzzle(puzzle).ok).toBe(true);
    expect(validatePuzzle(solution).ok).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(validatePuzzle("123").ok).toBe(false);
  });

  it("rejects non-digit characters", () => {
    expect(validatePuzzle("x".repeat(81)).ok).toBe(false);
  });

  it("rejects clues that break Sudoku rules", () => {
    // two 5s in the first row
    const bad = "55" + "0".repeat(79);
    expect(validatePuzzle(bad).ok).toBe(false);
  });
});

describe("countSolutions", () => {
  it("a generated puzzle has exactly one solution", () => {
    const { puzzle } = generateSudoku("hard", "u-seed");
    expect(countSolutions(puzzle)).toBe(1);
  });

  it("an almost-empty grid has multiple solutions (capped at 2)", () => {
    const sparse = "1" + "0".repeat(80);
    expect(countSolutions(sparse)).toBe(2);
  });
});

describe("solveWithBacktracking", () => {
  it("solves a generated puzzle back to its solution", () => {
    const { puzzle, solution } = generateSudoku("medium", "b-seed");
    expect(solveWithBacktracking(puzzle)).toBe(solution);
  });
});

describe("solveWithLogic", () => {
  it("solves an easy puzzle with pure logic", () => {
    const r = solveWithLogic(EASY);
    expect(r.solved).toBe(true);
    expect(r.unique).toBe(true);
    expect(r.solution).toBe(solveWithBacktracking(EASY));
    expect(r.techniques).toContain("naked_single");
    expect(r.techniques).not.toContain("guess_required");
  });

  it("reports guess_required when logic stalls", () => {
    const sparse = "1" + "0".repeat(80);
    const r = solveWithLogic(sparse);
    expect(r.solved).toBe(false);
    expect(r.techniques).toContain("guess_required");
  });

  it("returns a structured error for invalid input", () => {
    const r = solveWithLogic("nope");
    expect(r.solved).toBe(false);
    expect(r.error).toBeDefined();
  });
});

describe("solve (structured)", () => {
  it("always yields a solution for a solvable puzzle, even when logic stalls", () => {
    const { puzzle, solution } = generateSudoku("extreme", "s-seed");
    const r = solve(puzzle);
    expect(r.solved).toBe(true);
    expect(r.solution).toBe(solution);
    expect(r.unique).toBe(true);
  });
});
