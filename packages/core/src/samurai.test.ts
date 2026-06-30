import { describe, it, expect } from "vitest";
import { createSamuraiPuzzle, validateSamurai } from "./index.js";

function isValidCompleteGrid(s: string): boolean {
  if (!/^[1-9]{81}$/.test(s)) return false;
  for (let u = 0; u < 9; u++) {
    const row = new Set<string>();
    const col = new Set<string>();
    const box = new Set<string>();
    for (let j = 0; j < 9; j++) {
      row.add(s[u * 9 + j]);
      col.add(s[j * 9 + u]);
      const br = Math.floor(u / 3) * 3 + Math.floor(j / 3);
      const bc = (u % 3) * 3 + (j % 3);
      box.add(s[br * 9 + bc]);
    }
    if (row.size !== 9 || col.size !== 9 || box.size !== 9) return false;
  }
  return true;
}

describe("createSamuraiPuzzle", () => {
  it("produces five legal complete sub-grid solutions", () => {
    const p = createSamuraiPuzzle("sam-seed", "sam-1");
    expect(p.subGridSolutions).toHaveLength(5);
    for (const sol of p.subGridSolutions) {
      expect(isValidCompleteGrid(sol)).toBe(true);
    }
  });

  it("overlap cells are identical between each corner and the center", () => {
    const p = createSamuraiPuzzle("sam-seed-2", "sam-2");
    expect(validateSamurai(p).ok).toBe(true);
  });

  it("is deterministic for a given seed", () => {
    const a = createSamuraiPuzzle("same", "id");
    const b = createSamuraiPuzzle("same", "id");
    expect(a.subGridSolutions).toEqual(b.subGridSolutions);
    expect(a.subGridClues).toEqual(b.subGridClues);
  });

  it("center mirror matches sub-grid index 2", () => {
    const p = createSamuraiPuzzle("sam-seed-3", "sam-3");
    expect(p.solution).toBe(p.subGridSolutions[2]);
    expect(p.clues).toBe(p.subGridClues[2]);
  });
});
