import { describe, it, expect } from "vitest";
import {
  cellOutcomes,
  dailyShareText,
  decodeDailyResult,
  encodeDailyResult,
  formatClock,
  type CellOutcome,
  type DailyResult,
  type MoveRecord,
} from "./index.js";

function sample(overrides: Partial<DailyResult> = {}): DailyResult {
  const cells: CellOutcome[] = Array.from({ length: 81 }, (_, i) =>
    (["given", "clean", "hint", "mistake"] as const)[(i * 7) % 4]
  );
  return {
    date: "2026-09-26",
    level: "extreme",
    elapsed: 766,
    mistakes: 2,
    hintsUsed: 1,
    streak: 12,
    titleId: "finisher",
    cells,
    ...overrides,
  };
}

describe("daily result codes", () => {
  it("round-trip every field", () => {
    const r = sample({ name: "Tom" });
    expect(decodeDailyResult(encodeDailyResult(r))).toEqual(r);
  });

  it("round-trip without a name", () => {
    const r = sample();
    expect(decodeDailyResult(encodeDailyResult(r))).toEqual(r);
  });

  it("are short and URL-safe", () => {
    const code = encodeDailyResult(sample({ name: "Kari Nordmann" }));
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(code.length).toBeLessThan(70);
  });

  it("keep non-ASCII names intact and cap long ones on a character boundary", () => {
    const r = decodeDailyResult(encodeDailyResult(sample({ name: "Ærlige Øystein på ÅS 😀😀😀" })))!;
    expect(r.name!.startsWith("Ærlige Øystein")).toBe(true);
    expect(Buffer.byteLength(r.name!, "utf8")).toBeLessThanOrEqual(24);
    expect(r.name).not.toContain("�");
  });

  it("clamp out-of-range numbers instead of wrapping", () => {
    const r = decodeDailyResult(encodeDailyResult(sample({ mistakes: 999, elapsed: -5 })))!;
    expect(r.mistakes).toBe(255);
    expect(r.elapsed).toBe(0);
  });

  it("reject a name with invalid UTF-8", () => {
    const code = encodeDailyResult(sample({ name: "ab" }));
    // Corrupt the last name byte into a lone continuation byte (0x80).
    const bytes = Buffer.from(code, "base64url");
    bytes[bytes.length - 1] = 0x80;
    expect(decodeDailyResult(bytes.toString("base64url"))).toBeNull();
  });

  it("reject garbage", () => {
    expect(decodeDailyResult("")).toBeNull();
    expect(decodeDailyResult("not a code!")).toBeNull();
    expect(decodeDailyResult("AAAA")).toBeNull();
    expect(decodeDailyResult("x".repeat(500))).toBeNull();
    const code = encodeDailyResult(sample());
    expect(decodeDailyResult("B" + code.slice(1))).toBeNull(); // wrong version
  });
});

describe("cellOutcomes", () => {
  it("marks givens, hints and mistakes; a mistake outranks a later hint", () => {
    const clues = "5" + "0".repeat(80);
    const moves: MoveRecord[] = [
      { t: 1, cell: 1, value: 3, correct: false, source: "player" },
      { t: 2, cell: 1, value: 4, correct: true, source: "hint" },
      { t: 3, cell: 2, value: 4, correct: true, source: "hint" },
      { t: 4, cell: 3, value: 4, correct: true, source: "player" },
    ];
    const out = cellOutcomes(clues, moves);
    expect(out.slice(0, 4)).toEqual(["given", "mistake", "hint", "clean"]);
  });
});

describe("share text", () => {
  it("has header, stats, title, a 9×9 grid and the link", () => {
    const text = dailyShareText(sample(), "Sluttspurter", "https://example.com/d/abc");
    const lines = text.split("\n");
    expect(lines[0]).toBe("Sudoku 2026 · Daglig 26.09.2026 · Ekstrem");
    expect(lines[1]).toBe("⏱ 12:46 · 2 feil · 💡 1 · 🔥 12");
    expect(lines[2]).toBe("Sluttspurter");
    expect(lines.slice(4, 13)).toHaveLength(9);
    expect([...lines[4]]).toHaveLength(9);
    expect(lines[lines.length - 1]).toBe("https://example.com/d/abc");
  });

  it("formats clocks", () => {
    expect(formatClock(59)).toBe("0:59");
    expect(formatClock(766)).toBe("12:46");
    expect(formatClock(3725)).toBe("1:02:05");
  });
});
