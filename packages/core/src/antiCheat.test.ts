import { describe, it, expect } from "vitest";
import { validateSubmission } from "./index.js";
import type { SubmissionContext, SubmissionInput } from "./index.js";

const ctx: SubmissionContext = {
  puzzleExists: true,
  expectedVariant: "classic",
  expectedDifficulty: "medium",
  minPlausibleSeconds: 30,
};

const good: SubmissionInput = {
  variant: "classic",
  difficulty: "medium",
  elapsedSeconds: 300,
  mistakes: 1,
  hintsUsed: 0,
};

describe("validateSubmission", () => {
  it("accepts a plausible submission", () => {
    expect(validateSubmission(good, ctx).verdict).toBe("accepted");
  });

  it("rejects a non-existent puzzle", () => {
    const r = validateSubmission(good, { ...ctx, puzzleExists: false });
    expect(r.verdict).toBe("rejected");
    expect(r.reasons).toContain("puzzle does not exist");
  });

  it("rejects variant / difficulty mismatch", () => {
    expect(validateSubmission({ ...good, variant: "killer" }, ctx).verdict).toBe("rejected");
    expect(validateSubmission({ ...good, difficulty: "extreme" }, ctx).verdict).toBe("rejected");
  });

  it("rejects non-positive or non-integer elapsed", () => {
    expect(validateSubmission({ ...good, elapsedSeconds: 0 }, ctx).verdict).toBe("rejected");
    expect(validateSubmission({ ...good, elapsedSeconds: -5 }, ctx).verdict).toBe("rejected");
    expect(validateSubmission({ ...good, elapsedSeconds: 12.5 }, ctx).verdict).toBe("rejected");
  });

  it("rejects negative counters", () => {
    expect(validateSubmission({ ...good, mistakes: -1 }, ctx).verdict).toBe("rejected");
    expect(validateSubmission({ ...good, hintsUsed: -1 }, ctx).verdict).toBe("rejected");
  });

  it("flags an impossibly fast solve as suspicious", () => {
    const r = validateSubmission({ ...good, elapsedSeconds: 5 }, ctx);
    expect(r.verdict).toBe("suspicious");
    expect(r.reasons).toContain("solve time faster than humanly plausible");
  });

  it("flags client completed-before-started as suspicious", () => {
    const r = validateSubmission(
      { ...good, clientStartedAt: "2026-06-30T10:05:00Z", clientCompletedAt: "2026-06-30T10:00:00Z" },
      ctx
    );
    expect(r.verdict).toBe("suspicious");
    expect(r.reasons).toContain("client completed before it started");
  });

  it("flags elapsed exceeding wall-clock time as suspicious", () => {
    const r = validateSubmission(
      {
        ...good,
        elapsedSeconds: 3600,
        clientStartedAt: "2026-06-30T10:00:00Z",
        clientCompletedAt: "2026-06-30T10:05:00Z",
      },
      ctx
    );
    expect(r.verdict).toBe("suspicious");
    expect(r.reasons).toContain("elapsed time exceeds client wall-clock time");
  });
});
