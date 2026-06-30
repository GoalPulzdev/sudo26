import { describe, it, expect } from "vitest";
import { getHint, solveWithBacktracking } from "./index.js";

const EASY =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
const SOLUTION = solveWithBacktracking(EASY) as string;

const KNOWN_STRATEGIES = [
  "naked_single",
  "hidden_single",
  "naked_pair",
  "pointing_pair",
  "solution_reveal",
];

describe("getHint", () => {
  it("returns null for a completed board", () => {
    expect(getHint(SOLUTION, SOLUTION)).toBeNull();
  });

  it("returns a hint with a known strategy and in-range coordinates", () => {
    const h = getHint(EASY, SOLUTION);
    expect(h).not.toBeNull();
    expect(KNOWN_STRATEGIES).toContain(h!.strategy);
    expect(h!.row).toBeGreaterThanOrEqual(0);
    expect(h!.row).toBeLessThan(9);
    expect(h!.col).toBeGreaterThanOrEqual(0);
    expect(h!.col).toBeLessThan(9);
  });

  it("solves the last empty cell with a single (correct value)", () => {
    // Blank exactly one cell of the full solution.
    const k = 40;
    const board = SOLUTION.slice(0, k) + "0" + SOLUTION.slice(k + 1);
    const h = getHint(board, SOLUTION);
    expect(h).not.toBeNull();
    expect(h!.row * 9 + h!.col).toBe(k);
    expect(h!.value).toBe(Number(SOLUTION[k]));
    expect(["naked_single", "hidden_single"]).toContain(h!.strategy);
  });

  it("each hint carries a human-readable explanation", () => {
    const h = getHint(EASY, SOLUTION);
    expect(h!.explanation.length).toBeGreaterThan(0);
  });
});
