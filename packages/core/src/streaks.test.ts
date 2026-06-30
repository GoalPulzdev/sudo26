import { describe, it, expect } from "vitest";
import { recordCompletion, createEmptyStreak } from "./index.js";

describe("streaks", () => {
  it("first completion starts a streak of 1", () => {
    const s = recordCompletion(createEmptyStreak("u1"), "2026-06-01");
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(1);
    expect(s.lastCompletedDate).toBe("2026-06-01");
  });

  it("consecutive days extend the streak", () => {
    let s = createEmptyStreak("u1");
    s = recordCompletion(s, "2026-06-01");
    s = recordCompletion(s, "2026-06-02");
    s = recordCompletion(s, "2026-06-03");
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });

  it("a gap resets the current streak but keeps the longest", () => {
    let s = createEmptyStreak("u1");
    s = recordCompletion(s, "2026-06-01");
    s = recordCompletion(s, "2026-06-02");
    s = recordCompletion(s, "2026-06-05"); // 3-day gap
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(2);
  });

  it("recording the same date twice is a no-op", () => {
    let s = recordCompletion(createEmptyStreak("u1"), "2026-06-01");
    const again = recordCompletion(s, "2026-06-01");
    expect(again).toBe(s);
    expect(again.completedDates).toHaveLength(1);
  });
});
