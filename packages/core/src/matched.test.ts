import { describe, it, expect } from "vitest";
import { generateMatchedPuzzle, createMatchedPuzzle, rateDifficulty } from "./index.js";

describe("generateMatchedPuzzle", () => {
  it("matches an easy bucket to a singles-only logic label", () => {
    const m = generateMatchedPuzzle("easy", "match-easy");
    expect(m.matched).toBe(true);
    expect(m.rating.label).toBe("easy");
    // the measured rating agrees with a fresh rating of the clues
    expect(rateDifficulty(m.puzzle).label).toBe("easy");
  });

  it("is deterministic for a given seed", () => {
    const a = generateMatchedPuzzle("medium", "same-seed");
    const b = generateMatchedPuzzle("medium", "same-seed");
    expect(a.puzzle).toBe(b.puzzle);
    expect(a.attempt).toBe(b.attempt);
  });

  it("always returns a rated puzzle even if no attempt matches", () => {
    const m = generateMatchedPuzzle("hard", "match-hard", 3);
    expect(m.puzzle).toHaveLength(81);
    expect(m.rating.requiredTechniques.length).toBeGreaterThan(0);
    expect(typeof m.matched).toBe("boolean");
  });
});

describe("createMatchedPuzzle", () => {
  it("produces a classic puzzle whose rating matches the easy bucket", () => {
    const p = createMatchedPuzzle("easy", "cm-seed", "cm-1");
    expect(p.variant).toBe("classic");
    expect(p.rating?.label).toBe("easy");
    expect(p.clues).toHaveLength(81);
  });
});
