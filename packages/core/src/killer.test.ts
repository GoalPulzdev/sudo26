import { describe, it, expect } from "vitest";
import {
  createKillerPuzzle,
  validateKillerPuzzle,
  validateCage,
  countKillerSolutions,
} from "./index.js";
import type { KillerCage } from "./index.js";

/** Blank `n` deterministic cells of an 81-char solution to make clues. */
function blank(solution: string, n: number): string {
  const arr = solution.split("");
  for (let i = 0; i < n; i++) arr[i * 7 % 81] = "0";
  return arr.join("");
}

describe("createKillerPuzzle", () => {
  it("covers all 81 cells with valid, connected cages summing to the solution", () => {
    for (const seed of ["k1", "k2", "k3", "k4", "k5"]) {
      const p = createKillerPuzzle(seed, `id-${seed}`);
      const res = validateKillerPuzzle(p);
      expect(res.ok, res.error).toBe(true);
    }
  });

  it("no cell appears in two cages", () => {
    const p = createKillerPuzzle("k-dup", "id");
    const seen = new Set<number>();
    for (const cage of p.killerCages ?? []) {
      for (const [r, c] of cage.cells) {
        const idx = r * 9 + c;
        expect(seen.has(idx)).toBe(false);
        seen.add(idx);
      }
    }
    expect(seen.size).toBe(81);
  });

  it("is deterministic for a given seed", () => {
    const a = createKillerPuzzle("same", "id");
    const b = createKillerPuzzle("same", "id");
    expect(a.killerCages).toEqual(b.killerCages);
  });
});

describe("validateKillerPuzzle (negative)", () => {
  it("rejects a puzzle with an uncovered cell", () => {
    const p = createKillerPuzzle("neg", "id");
    // drop the last cage → leaves cells uncovered
    p.killerCages = (p.killerCages ?? []).slice(0, -1);
    expect(validateKillerPuzzle(p).ok).toBe(false);
  });
});

describe("countKillerSolutions", () => {
  it("finds exactly one completion when most cells are clued", () => {
    const p = createKillerPuzzle("ks", "id");
    const clues = blank(p.solution, 8); // 8 blanks, cages + clues pin the rest
    const r = countKillerSolutions(p.killerCages ?? [], clues, { limit: 2 });
    expect(r.exhausted).toBe(false);
    expect(r.count).toBe(1);
  });

  it("finds no completion when a cage sum is corrupted", () => {
    const p = createKillerPuzzle("ks2", "id");
    const clues = blank(p.solution, 8);
    const cages = (p.killerCages ?? []).map((c, i) =>
      i === 0 ? { ...c, sum: c.sum + 1 } : c
    );
    const r = countKillerSolutions(cages, clues, { limit: 2 });
    expect(r.exhausted).toBe(false);
    expect(r.count).toBe(0);
  });

  it("the real solution satisfies the cages (count >= 1 from full clues)", () => {
    const p = createKillerPuzzle("ks3", "id");
    const r = countKillerSolutions(p.killerCages ?? [], p.solution, { limit: 2 });
    expect(r.count).toBe(1);
  });
});

describe("validateCage", () => {
  it("passes a complete correct cage and fails a wrong sum", () => {
    const cage: KillerCage = { id: "c", sum: 6, cells: [[0, 0], [0, 1]] };
    const board = Array.from({ length: 9 }, () => new Array(9).fill(0));
    board[0][0] = 2;
    board[0][1] = 4;
    expect(validateCage(cage, board)).toBe(true);
    board[0][1] = 5; // sum now 7
    expect(validateCage(cage, board)).toBe(false);
  });
});
