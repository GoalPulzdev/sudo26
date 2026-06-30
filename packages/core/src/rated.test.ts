import { describe, it, expect } from "vitest";
import { createRatedPuzzle } from "./index.js";

describe("createRatedPuzzle", () => {
  it("attaches a technique-based rating to the puzzle", () => {
    const p = createRatedPuzzle("medium", "rated-seed", "rp-1");
    expect(p.rating).toBeDefined();
    expect(p.rating?.requiredTechniques.length).toBeGreaterThan(0);
    expect(["easy", "medium", "hard", "extreme"]).toContain(p.rating?.label);
    expect(p.rating?.estimatedMinutes).toBeGreaterThanOrEqual(2);
  });

  it("is deterministic for a given seed", () => {
    const a = createRatedPuzzle("hard", "same", "id");
    const b = createRatedPuzzle("hard", "same", "id");
    expect(a.clues).toBe(b.clues);
    expect(a.rating).toEqual(b.rating);
  });
});
