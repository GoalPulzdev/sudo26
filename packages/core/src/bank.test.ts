import { describe, it, expect } from "vitest";
import {
  PUZZLE_BANK,
  CURATED_DIFFICULTIES,
  applyTransform,
  countSolutions,
  createCuratedPuzzle,
  createDailyPuzzle,
  createRng,
  dailyDifficulty,
  randomTransform,
  rateDifficulty,
  solvePath,
  validatePuzzle,
} from "./index.js";

describe("puzzle bank", () => {
  for (const d of CURATED_DIFFICULTIES) {
    it(`every ${d} entry is unique, coach-solvable, and rated ${d}`, () => {
      expect(PUZZLE_BANK[d].length).toBeGreaterThan(0);
      for (const clues of PUZZLE_BANK[d]) {
        expect(validatePuzzle(clues).ok).toBe(true);
        expect(countSolutions(clues)).toBe(1);
        expect(solvePath(clues).solved).toBe(true);
        expect(rateDifficulty(clues).label).toBe(d);
      }
    });
  }
});

describe("transforms", () => {
  const base = PUZZLE_BANK.hard[0];

  it("preserve validity, uniqueness, clue count, and difficulty", () => {
    for (let k = 0; k < 20; k++) {
      const t = applyTransform(base, randomTransform(createRng(`t-${k}`)));
      expect(validatePuzzle(t).ok).toBe(true);
      expect(countSolutions(t)).toBe(1);
      expect(t.replace(/0/g, "").length).toBe(base.replace(/0/g, "").length);
      expect(rateDifficulty(t).label).toBe("hard");
    }
  });

  it("actually changes the grid", () => {
    const seen = new Set<string>();
    for (let k = 0; k < 20; k++) seen.add(applyTransform(base, randomTransform(createRng(`v-${k}`))));
    expect(seen.size).toBe(20);
  });
});

describe("createCuratedPuzzle", () => {
  it("delivers the requested technique level with a matching solution", () => {
    for (const d of CURATED_DIFFICULTIES) {
      const p = createCuratedPuzzle(d, `seed-${d}`, `id-${d}`);
      expect(p.rating?.label).toBe(d);
      expect(p.difficulty).toBe(d);
      for (let i = 0; i < 81; i++) if (p.clues[i] !== "0") expect(p.solution[i]).toBe(p.clues[i]);
    }
  });

  it("is deterministic per seed", () => {
    expect(createCuratedPuzzle("medium", "same", "a").clues).toBe(createCuratedPuzzle("medium", "same", "b").clues);
  });
});

describe("daily", () => {
  it("ramps from easy on Monday to extreme on Saturday", () => {
    expect(dailyDifficulty("2026-09-21")).toBe("easy"); // Monday
    expect(dailyDifficulty("2026-09-26")).toBe("extreme"); // Saturday
  });

  it("keeps the daily label and rates to the weekday's level", () => {
    const p = createDailyPuzzle("2026-09-26");
    expect(p.difficulty).toBe("daily");
    expect(p.rating?.label).toBe("extreme");
    expect(solvePath(p.clues).solved).toBe(true);
  });
});
