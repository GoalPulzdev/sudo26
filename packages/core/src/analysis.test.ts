import { describe, it, expect } from "vitest";
import { analyzeGame, createPuzzle, solvePath, type MoveRecord } from "./index.js";

const puzzle = createPuzzle("medium", "analysis-seed", "a1");

/** Replay the canonical path, spending `think(k)` seconds on the k-th placement. */
function simulate(think: (k: number) => number, opts: { wrongAt?: number[]; hintAt?: number[] } = {}): {
  moves: MoveRecord[];
  elapsed: number;
} {
  const placements = solvePath(puzzle.clues).steps.filter((s) => s.placement);
  const moves: MoveRecord[] = [];
  let t = 0;
  placements.forEach((s, k) => {
    t += think(k);
    const { cell, value } = s.placement!;
    if (opts.wrongAt?.includes(k)) {
      moves.push({ t, cell, value: ((value % 9) + 1) as MoveRecord["value"], correct: false, source: "player" });
    }
    const source = opts.hintAt?.includes(k) ? "hint" : "player";
    moves.push({ t, cell, value: value as MoveRecord["value"], correct: true, source });
  });
  return { moves, elapsed: t };
}

describe("analyzeGame", () => {
  it("builds a tempo curve that reaches every empty cell", () => {
    const { moves, elapsed } = simulate(() => 5);
    const a = analyzeGame({ clues: puzzle.clues, moves, elapsed, mistakes: 0, hintsUsed: 0 });
    expect(a.hasTimeline).toBe(true);
    expect(a.tempo[0]).toEqual({ t: 0, filled: 0 });
    expect(a.tempo[a.tempo.length - 1].filled).toBe(a.emptyCells);
    expect(a.cells).toHaveLength(a.emptyCells);
    const counted = Object.values(a.techniqueCounts).reduce((x, y) => x + y, 0);
    expect(counted).toBe(a.emptyCells);
  });

  it("finds the longest stuck moment and names its box", () => {
    const { moves, elapsed } = simulate((k) => (k === 10 ? 180 : 4));
    const a = analyzeGame({ clues: puzzle.clues, moves, elapsed, mistakes: 0, hintsUsed: 0 });
    const stuckCell = solvePath(puzzle.clues).steps.filter((s) => s.placement)[10].placement!.cell;
    expect(a.stuck[0].cell).toBe(stuckCell);
    expect(a.stuck[0].seconds).toBe(180);
    expect(a.insights.some((s) => s.includes(`boks ${a.stuck[0].box + 1}`))).toBe(true);
  });

  it("ignores short gaps as stuck moments", () => {
    const { moves, elapsed } = simulate(() => 3);
    const a = analyzeGame({ clues: puzzle.clues, moves, elapsed, mistakes: 0, hintsUsed: 0 });
    expect(a.stuck).toEqual([]);
  });

  it("attributes mistakes to boxes and hint cells to byHint", () => {
    const { moves, elapsed } = simulate(() => 10, { wrongAt: [0, 1], hintAt: [2] });
    const a = analyzeGame({ clues: puzzle.clues, moves, elapsed, mistakes: 2, hintsUsed: 1 });
    expect(a.boxes.reduce((s, b) => s + b.mistakes, 0)).toBe(2);
    expect(a.cells.filter((c) => c.byHint)).toHaveLength(1);
  });

  it("detects a strong finish", () => {
    const { moves, elapsed } = simulate((k) => (k < 25 ? 30 : 5));
    const a = analyzeGame({ clues: puzzle.clues, moves, elapsed, mistakes: 1, hintsUsed: 0 });
    expect(a.pace!.secondHalf).toBeLessThan(a.pace!.firstHalf);
    expect(a.insights.some((s) => s.includes("raskere"))).toBe(true);
  });

  it("titles a clean, fast game", () => {
    const { moves, elapsed } = simulate(() => 1);
    const a = analyzeGame({ clues: puzzle.clues, moves, elapsed, mistakes: 0, hintsUsed: 0 });
    expect(a.title.name).toBe("Iskald Logiker");
    expect(a.insights).toContain("**Null feil og null hint.** Rent.");
  });

  it("handles a game without a move log", () => {
    const a = analyzeGame({ clues: puzzle.clues, moves: undefined, elapsed: 300, mistakes: 0, hintsUsed: 0 });
    expect(a.hasTimeline).toBe(false);
    expect(a.tempo).toEqual([{ t: 0, filled: 0 }]);
    expect(a.stuck).toEqual([]);
    expect(a.title.name.length).toBeGreaterThan(0);
  });
});
