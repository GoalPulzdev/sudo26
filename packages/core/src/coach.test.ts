import { describe, it, expect } from "vitest";
import {
  coachPlan,
  computeCandidates,
  createPuzzle,
  findNextStep,
  getHint,
  solvePath,
  solveWithLogic,
  type Candidates,
  type Difficulty,
} from "./index.js";

const EASY =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";

function puzzles(): { clues: string; solution: string }[] {
  const out: { clues: string; solution: string }[] = [];
  const levels: Difficulty[] = ["easy", "medium", "hard", "extreme"];
  for (const d of levels) for (let k = 0; k < 3; k++) out.push(createPuzzle(d, `coach-${d}-${k}`, `c${k}`));
  return out;
}

/** An empty grid whose candidates are "everything", with some removed. */
function openCands(remove: [cell: number, digit: number][]): { grid: number[]; cands: Candidates } {
  const grid = Array(81).fill(0);
  const cands = computeCandidates(grid);
  for (const [cell, d] of remove) cands[cell].delete(d);
  return { grid, cands };
}

describe("solvePath", () => {
  it("never places a wrong digit or eliminates the true one", () => {
    for (const { clues, solution } of puzzles()) {
      const path = solvePath(clues);
      for (const step of path.steps) {
        if (step.placement) expect(step.placement.value).toBe(Number(solution[step.placement.cell]));
        for (const e of step.eliminations) expect(e.value).not.toBe(Number(solution[e.cell]));
      }
    }
  });

  it("solves every puzzle the difficulty solver can solve", () => {
    for (const { clues } of puzzles()) {
      if (solveWithLogic(clues).solved) expect(solvePath(clues).solved).toBe(true);
    }
  });

  it("assigns a technique to every empty cell and none to givens", () => {
    const path = solvePath(EASY);
    for (let i = 0; i < 81; i++) {
      if (EASY[i] === "0") expect(path.cellTechnique[i]).not.toBeNull();
      else expect(path.cellTechnique[i]).toBeNull();
    }
  });
});

describe("techniques on crafted candidate states", () => {
  it("naked pair eliminates both digits from the rest of the house", () => {
    const remove: [number, number][] = [];
    for (const cell of [0, 1]) for (let d = 1; d <= 9; d++) if (d !== 3 && d !== 7) remove.push([cell, d]);
    const { grid, cands } = openCands(remove);
    const step = findNextStep(grid, cands)!;
    expect(step.technique).toBe("naked_pair");
    expect(step.pattern.sort()).toEqual([0, 1]);
    expect(step.digits).toEqual([3, 7]);
    expect(step.eliminations.every((e) => e.cell !== 0 && e.cell !== 1)).toBe(true);
    expect(step.eliminations.length).toBeGreaterThan(0);
  });

  it("pointing pair eliminates along the line outside the box", () => {
    // In box 0, digit 5 only in r1k1 and r1k2 (cells 0 and 1).
    const remove: [number, number][] = [2, 9, 10, 11, 18, 19, 20].map((c) => [c, 5]);
    const { grid, cands } = openCands(remove);
    const step = findNextStep(grid, cands)!;
    expect(step.technique).toBe("pointing_pair");
    expect(step.eliminations.map((e) => e.cell).sort((a, b) => a - b)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(step.eliminations.every((e) => e.value === 5)).toBe(true);
  });

  it("box/line reduction eliminates inside the box off the line", () => {
    // In row 1, digit 5 only in its first three cells (box 1).
    const remove: [number, number][] = [3, 4, 5, 6, 7, 8].map((c) => [c, 5]);
    const { grid, cands } = openCands(remove);
    const step = findNextStep(grid, cands)!;
    expect(step.technique).toBe("box_line_reduction");
    expect(step.eliminations.map((e) => e.cell).sort((a, b) => a - b)).toEqual([9, 10, 11, 18, 19, 20]);
  });

  it("X-Wing eliminates from the two cover columns", () => {
    // Digit 5: row 2 and row 6 only in columns 3 and 7.
    const remove: [number, number][] = [];
    for (const r of [1, 5]) for (let c = 0; c < 9; c++) if (c !== 2 && c !== 6) remove.push([r * 9 + c, 5]);
    const { grid, cands } = openCands(remove);
    const step = findNextStep(grid, cands)!;
    expect(step.technique).toBe("x_wing");
    expect(step.pattern.sort((a, b) => a - b)).toEqual([11, 15, 47, 51]);
    for (const e of step.eliminations) {
      expect([2, 6]).toContain(e.cell % 9);
      expect([1, 5]).not.toContain(Math.floor(e.cell / 9));
    }
    expect(step.eliminations).toHaveLength(14);
  });
});

describe("coachPlan", () => {
  it("ends in a correct placement on a fresh puzzle", () => {
    for (const { clues, solution } of puzzles()) {
      const plan = coachPlan(clues, solution);
      const last = plan.steps[plan.steps.length - 1];
      if (plan.reveal) {
        expect(plan.reveal.value).toBe(Number(solution[plan.reveal.cell]));
      } else {
        expect(last.placement).toBeDefined();
        expect(last.placement!.value).toBe(Number(solution[last.placement!.cell]));
        expect(plan.steps.slice(0, -1).every((s) => !s.placement)).toBe(true);
      }
      for (const s of plan.steps) expect(s.explanation.length).toBeGreaterThan(20);
    }
  });

  it("flags wrong values and still coaches from the correct part of the board", () => {
    const { clues, solution } = createPuzzle("easy", "coach-wrong", "w");
    const i = clues.indexOf("0");
    const wrong = ((Number(solution[i]) % 9) + 1).toString();
    const board = clues.slice(0, i) + wrong + clues.slice(i + 1);
    const plan = coachPlan(board, solution);
    expect(plan.issues).toContainEqual({ kind: "wrong_value", cell: i, value: Number(wrong) });
    expect(plan.steps.length).toBeGreaterThan(0);
  });

  it("flags pencil marks that exclude the answer", () => {
    const { clues, solution } = createPuzzle("easy", "coach-notes", "n");
    const i = clues.indexOf("0");
    const answer = Number(solution[i]);
    const notes: (number[] | null)[] = Array(81).fill(null);
    notes[i] = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => d !== answer).slice(0, 2);
    const plan = coachPlan(clues, solution, notes);
    expect(plan.issues).toContainEqual({ kind: "missing_note", cell: i, value: answer });
  });

  it("returns no steps for a solved board", () => {
    const { solution } = createPuzzle("easy", "coach-done", "d");
    expect(coachPlan(solution, solution).steps).toEqual([]);
  });
});

describe("getHint (coach-backed)", () => {
  it("always hints the solution value, from many partial boards", () => {
    for (const { clues, solution } of puzzles()) {
      // Fill a growing prefix of the empty cells with correct values.
      const empties = [...clues].map((c, i) => (c === "0" ? i : -1)).filter((i) => i >= 0);
      for (const frac of [0, 0.3, 0.6, 0.9]) {
        const board = clues.split("");
        for (const i of empties.slice(0, Math.floor(empties.length * frac))) board[i] = solution[i];
        const h = getHint(board.join(""), solution)!;
        expect(h).not.toBeNull();
        expect(board[h.row * 9 + h.col]).toBe("0");
        expect(h.value).toBe(Number(solution[h.row * 9 + h.col]));
      }
    }
  });
});
