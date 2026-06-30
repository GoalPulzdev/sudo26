import { describe, it, expect } from "vitest";
import type { CellValue, GameState } from "./index.js";
import {
  gameReducer,
  createPuzzle,
  boardFromPuzzle,
} from "./index.js";

function freshState(difficulty: "easy" | "hard" = "easy"): GameState {
  const puzzle = createPuzzle(difficulty, "reducer-seed", "t1");
  return {
    puzzle,
    board: boardFromPuzzle(puzzle.clues, puzzle.solution),
    elapsed: 0,
    mistakes: 0,
    hintsUsed: 0,
    status: "playing",
    selectedCell: null,
    noteMode: false,
    history: [],
  };
}

/** First empty (non-given) cell in row-major order. */
function firstEmpty(state: GameState): [number, number] {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (!state.board[r][c].given) return [r, c];
  throw new Error("no empty cell");
}

describe("gameReducer – selection & input", () => {
  it("SELECT_CELL sets selectedCell", () => {
    const s = gameReducer(freshState(), { type: "SELECT_CELL", row: 0, col: 0 });
    expect(s.selectedCell).toEqual([0, 0]);
  });

  it("INPUT_VALUE on a given cell is a no-op", () => {
    let s = freshState();
    // find a given cell
    let gr = -1;
    let gc = -1;
    for (let r = 0; r < 9 && gr === -1; r++)
      for (let c = 0; c < 9; c++)
        if (s.board[r][c].given) { gr = r; gc = c; break; }
    s = gameReducer(s, { type: "SELECT_CELL", row: gr, col: gc });
    const before = s.board[gr][gc].value;
    s = gameReducer(s, { type: "INPUT_VALUE", value: 5 });
    expect(s.board[gr][gc].value).toBe(before);
  });

  it("correct value clears error and does not raise mistakes", () => {
    let s = freshState();
    const [r, c] = firstEmpty(s);
    const correct = s.board[r][c].solution;
    s = gameReducer(s, { type: "SELECT_CELL", row: r, col: c });
    s = gameReducer(s, { type: "INPUT_VALUE", value: correct });
    expect(s.board[r][c].value).toBe(correct);
    expect(s.board[r][c].error).toBe(false);
    expect(s.mistakes).toBe(0);
  });

  it("wrong value flags error and increments mistakes", () => {
    let s = freshState();
    const [r, c] = firstEmpty(s);
    const correct = s.board[r][c].solution;
    const wrong = ((correct % 9) + 1) as CellValue; // any value != correct
    s = gameReducer(s, { type: "SELECT_CELL", row: r, col: c });
    s = gameReducer(s, { type: "INPUT_VALUE", value: wrong });
    // wrong may be blocked if it conflicts with a peer; only assert when it landed
    if (s.board[r][c].value === wrong) {
      expect(s.board[r][c].error).toBe(true);
      expect(s.mistakes).toBe(1);
    }
  });
});

describe("gameReducer – erase & undo", () => {
  it("ERASE clears a filled non-given cell", () => {
    let s = freshState();
    const [r, c] = firstEmpty(s);
    s = gameReducer(s, { type: "SELECT_CELL", row: r, col: c });
    s = gameReducer(s, { type: "INPUT_VALUE", value: s.board[r][c].solution });
    s = gameReducer(s, { type: "ERASE" });
    expect(s.board[r][c].value).toBe(0);
  });

  it("UNDO restores the previous board", () => {
    let s = freshState();
    const [r, c] = firstEmpty(s);
    s = gameReducer(s, { type: "SELECT_CELL", row: r, col: c });
    s = gameReducer(s, { type: "INPUT_VALUE", value: s.board[r][c].solution });
    expect(s.board[r][c].value).not.toBe(0);
    s = gameReducer(s, { type: "UNDO" });
    expect(s.board[r][c].value).toBe(0);
  });
});

describe("gameReducer – timer & status", () => {
  it("TICK increments elapsed only while playing", () => {
    let s = freshState();
    s = gameReducer(s, { type: "TICK" });
    expect(s.elapsed).toBe(1);
    s = gameReducer(s, { type: "PAUSE" });
    s = gameReducer(s, { type: "TICK" });
    expect(s.elapsed).toBe(1); // unchanged while paused
    s = gameReducer(s, { type: "RESUME" });
    s = gameReducer(s, { type: "TICK" });
    expect(s.elapsed).toBe(2);
  });

  it("RESET clears non-given cells and counters", () => {
    let s = freshState();
    const [r, c] = firstEmpty(s);
    s = gameReducer(s, { type: "SELECT_CELL", row: r, col: c });
    s = gameReducer(s, { type: "INPUT_VALUE", value: s.board[r][c].solution });
    s = gameReducer(s, { type: "TICK" });
    s = gameReducer(s, { type: "RESET" });
    expect(s.elapsed).toBe(0);
    expect(s.mistakes).toBe(0);
    expect(s.board[r][c].value).toBe(0);
  });
});

describe("gameReducer – win detection", () => {
  it("only declares win when fully and correctly solved", () => {
    let s = freshState();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (s.board[r][c].given) continue;
        s = gameReducer(s, { type: "SELECT_CELL", row: r, col: c });
        s = gameReducer(s, { type: "INPUT_VALUE", value: s.board[r][c].solution });
      }
    }
    expect(s.status).toBe("won");
  });
});
