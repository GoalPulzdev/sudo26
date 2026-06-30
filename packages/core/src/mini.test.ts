import { describe, it, expect } from "vitest";
import { generateMini, createMiniPuzzle } from "./index.js";

/** Validate a 36-char string is a complete legal 6×6 Sudoku (2×3 boxes). */
function isValidMiniSolution(s: string): boolean {
  if (!/^[1-6]{36}$/.test(s)) return false;
  const unit = (idxs: number[]) => new Set(idxs.map((i) => s[i])).size === 6;
  for (let u = 0; u < 6; u++) {
    const row: number[] = [];
    const col: number[] = [];
    for (let j = 0; j < 6; j++) {
      row.push(u * 6 + j);
      col.push(j * 6 + u);
    }
    if (!unit(row) || !unit(col)) return false;
  }
  // 6 boxes of 2 rows × 3 cols
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 2; bc++) {
      const box: number[] = [];
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 3; c++) box.push((br * 2 + r) * 6 + (bc * 3 + c));
      if (new Set(box.map((i) => s[i])).size !== 6) return false;
    }
  }
  return true;
}

describe("generateMini", () => {
  it("produces 36-char clues and a legal complete solution", () => {
    const { clues, solution } = generateMini("easy", "mini-seed");
    expect(clues).toHaveLength(36);
    expect(solution).toHaveLength(36);
    expect(isValidMiniSolution(solution)).toBe(true);
  });

  it("clues are a subset of the solution", () => {
    const { clues, solution } = generateMini("medium", "mini-seed-2");
    for (let i = 0; i < 36; i++) {
      if (clues[i] !== "0") expect(clues[i]).toBe(solution[i]);
    }
  });

  it("is deterministic and scales clue count with difficulty", () => {
    const a = generateMini("easy", "d");
    const b = generateMini("easy", "d");
    expect(a.clues).toBe(b.clues);
    const count = (s: string) => s.split("").filter((c) => c !== "0").length;
    expect(count(generateMini("easy", "x").clues)).toBeGreaterThanOrEqual(
      count(generateMini("hard", "x").clues)
    );
  });
});

describe("createMiniPuzzle", () => {
  it("tags variant and difficulty as mini", () => {
    const p = createMiniPuzzle("easy", "mp-seed", "mp-1");
    expect(p.variant).toBe("mini");
    expect(p.difficulty).toBe("mini");
    expect(p.clues).toHaveLength(36);
  });
});
