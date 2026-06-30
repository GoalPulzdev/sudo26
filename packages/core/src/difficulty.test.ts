import { describe, it, expect } from "vitest";
import { rateDifficulty } from "./index.js";

const EASY =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";

describe("rateDifficulty", () => {
  it("rates a singles-solvable puzzle as easy", () => {
    const r = rateDifficulty(EASY);
    expect(r.label).toBe("easy");
    expect(r.requiredTechniques).toContain("naked_single");
    expect(r.requiredTechniques).not.toContain("guess_required");
    expect(r.score).toBeGreaterThan(0);
    expect(r.estimatedMinutes).toBeGreaterThanOrEqual(2);
  });

  it("rates a logic-unsolvable grid as extreme", () => {
    const sparse = "1" + "0".repeat(80);
    const r = rateDifficulty(sparse);
    expect(r.label).toBe("extreme");
    expect(r.requiredTechniques).toContain("guess_required");
  });

  it("score increases with harder required techniques", () => {
    const easy = rateDifficulty(EASY).score;
    const extreme = rateDifficulty("1" + "0".repeat(80)).score;
    expect(extreme).toBeGreaterThan(easy);
  });
});
