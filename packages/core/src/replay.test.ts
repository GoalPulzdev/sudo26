import { describe, it, expect } from "vitest";
import {
  createCuratedPuzzle,
  createDailyPuzzle,
  createPuzzle,
  decodeReplay,
  encodeReplay,
  ghostProgressAt,
  ghostTimeline,
  puzzleFromRef,
  refFromPuzzle,
  replayFrameAt,
  replayFromGame,
  solvePath,
  type MoveRecord,
  type Puzzle,
  type Replay,
} from "./index.js";

/** A plausible finished game: canonical order, a mistake, a hint, growing gaps. */
function playedGame(puzzle: Puzzle): { moves: MoveRecord[]; elapsed: number } {
  const placements = solvePath(puzzle.clues).steps.filter((s) => s.placement).map((s) => s.placement!);
  const moves: MoveRecord[] = [];
  let t = 0;
  placements.forEach(({ cell, value }, k) => {
    t += 3 + (k % 7) * 4 + (k === 10 ? 200 : 0);
    if (k === 5) moves.push({ t: t - 1, cell, value: ((value % 9) + 1) as MoveRecord["value"], correct: false, source: "player" });
    moves.push({ t, cell, value: value as MoveRecord["value"], correct: true, source: k === 7 ? "hint" : "player" });
  });
  return { moves, elapsed: t + 2 };
}

describe("puzzle references", () => {
  it("rebuild curated and daily puzzles exactly", () => {
    const curated = createCuratedPuzzle("hard", "hard-abc123", "x");
    expect(refFromPuzzle(curated)).toEqual({ kind: "curated", level: "hard", seed: "hard-abc123" });
    expect(puzzleFromRef(refFromPuzzle(curated)!).clues).toBe(curated.clues);

    const daily = createDailyPuzzle("2026-09-26");
    expect(refFromPuzzle(daily)).toEqual({ kind: "daily", date: "2026-09-26" });
    expect(puzzleFromRef(refFromPuzzle(daily)!).clues).toBe(daily.clues);
  });

  it("refuse puzzles that can't be rebuilt from their seed", () => {
    // Old clue-bucket generator: same seed shape, different puzzle.
    expect(refFromPuzzle(createPuzzle("hard", "hard-abc123", "x"))).toBeNull();
    expect(refFromPuzzle({ ...createCuratedPuzzle("easy", "s", "x"), variant: "killer" })).toBeNull();
  });
});

describe("replay codes", () => {
  const puzzle = createCuratedPuzzle("medium", "medium-k2j3h4g5", "p");
  const { moves, elapsed } = playedGame(puzzle);
  const replay = replayFromGame(puzzle, moves, elapsed, "Kari")!;

  it("round-trip a full game", () => {
    expect(decodeReplay(encodeReplay(replay))).toEqual(replay);
  });

  it("round-trip a daily replay without a name", () => {
    const daily = createDailyPuzzle("2026-09-21");
    const g = playedGame(daily);
    const r = replayFromGame(daily, g.moves, g.elapsed)!;
    expect(decodeReplay(encodeReplay(r))).toEqual(r);
  });

  it("stay link-sized for a typical game", () => {
    const code = encodeReplay(replay);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(code.length).toBeLessThan(400);
  });

  it("reject truncated, padded or corrupted codes", () => {
    const code = encodeReplay(replay);
    expect(decodeReplay(code.slice(0, -4))).toBeNull();
    expect(decodeReplay(code + "AAAA")).toBeNull();
    expect(decodeReplay("B" + code.slice(1))).toBeNull();
    expect(decodeReplay("")).toBeNull();
    expect(decodeReplay("%%%")).toBeNull();
  });
});

describe("ghost", () => {
  const puzzle = createCuratedPuzzle("hard", "ghost-seed", "g");
  const { moves, elapsed } = playedGame(puzzle);
  const replay = replayFromGame(puzzle, moves, elapsed)!;
  const timeline = ghostTimeline(replay, puzzle.clues, puzzle.solution);

  it("ignores wrong values and counts a complete game", () => {
    expect(timeline.complete).toBe(true);
    expect(timeline.placements).toHaveLength(timeline.total);
    expect(timeline.boxTotals.reduce((a, b) => a + b, 0)).toBe(timeline.total);
  });

  it("progresses monotonically to the full board", () => {
    let prev = -1;
    for (let t = 0; t <= elapsed; t += 17) {
      const p = ghostProgressAt(timeline, t);
      expect(p.filled).toBeGreaterThanOrEqual(prev);
      expect(p.boxes.reduce((a, b) => a + b, 0)).toBe(p.filled);
      prev = p.filled;
    }
    expect(ghostProgressAt(timeline, elapsed).filled).toBe(timeline.total);
    expect(ghostProgressAt(timeline, 0).filled).toBe(0);
  });
});

describe("replay frames", () => {
  const puzzle = createCuratedPuzzle("easy", "frame-seed", "f");
  const { moves, elapsed } = playedGame(puzzle);
  const replay = replayFromGame(puzzle, moves, elapsed)!;

  it("start at the clues and end at the solution", () => {
    expect(replayFrameAt(replay, puzzle.clues, puzzle.solution, -1).values.join("")).toBe(puzzle.clues);
    const end = replayFrameAt(replay, puzzle.clues, puzzle.solution, elapsed);
    expect(end.values.join("")).toBe(puzzle.solution);
    expect(end.wrong.size).toBe(0);
    expect(end.hinted.size).toBe(1);
  });

  it("show a mistake until it is corrected", () => {
    const wrongMove = replay.moves.find((m) => Number(puzzle.solution[m.cell]) !== m.value)!;
    const during = replayFrameAt(replay, puzzle.clues, puzzle.solution, wrongMove.t);
    expect(during.wrong.has(wrongMove.cell)).toBe(true);
  });

  it("ignores moves on given cells (hostile input)", () => {
    const given = puzzle.clues.search(/[1-9]/);
    const hostile: Replay = { ...replay, moves: [{ t: 0, cell: given, value: 1, hint: false }] };
    expect(replayFrameAt(hostile, puzzle.clues, puzzle.solution, 10).values.join("")).toBe(puzzle.clues);
  });
});
