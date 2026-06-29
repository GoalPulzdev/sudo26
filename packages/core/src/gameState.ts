/**
 * Game state reducer – pure functions, no side effects.
 * Compatible with React useReducer or Zustand.
 */

import type { GameState, CellValue } from "./types.js";
import { cloneBoard, getCellSolution, boardToString } from "./board.js";

export type GameAction =
  | { type: "SELECT_CELL"; row: number; col: number }
  | { type: "INPUT_VALUE"; value: CellValue }
  | { type: "TOGGLE_NOTE"; value: CellValue }
  | { type: "TOGGLE_NOTE_MODE" }
  | { type: "ERASE" }
  | { type: "UNDO" }
  | { type: "TICK" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "APPLY_HINT"; row: number; col: number; value: CellValue }
  | { type: "RESET" };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SELECT_CELL": {
      const board = cloneBoard(state.board);
      // Remove previous highlights
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
          board[r][c].highlighted = false;

      const { row, col } = action;
      const val = board[row][col].value;

      // Highlight same-value cells and peers
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++) {
          const sameVal = val !== 0 && board[r][c].value === val;
          const samePeer =
            r === row ||
            c === col ||
            (Math.floor(r / 3) === Math.floor(row / 3) &&
              Math.floor(c / 3) === Math.floor(col / 3));
          board[r][c].highlighted = sameVal || samePeer;
        }

      return { ...state, board, selectedCell: [row, col] };
    }

    case "INPUT_VALUE": {
      if (!state.selectedCell) return state;
      const [row, col] = state.selectedCell;
      const board = cloneBoard(state.board);
      const cell = board[row][col];
      if (cell.given) return state;

      // Block if value already exists in same row, column, or 3×3 box
      if (action.value !== 0) {
        const br = Math.floor(row / 3) * 3;
        const bc = Math.floor(col / 3) * 3;
        for (let i = 0; i < 9; i++) {
          if (i !== col && board[row][i].value === action.value) return state;
          if (i !== row && board[i][col].value === action.value) return state;
        }
        for (let r = br; r < br + 3; r++)
          for (let c = bc; c < bc + 3; c++)
            if ((r !== row || c !== col) && board[r][c].value === action.value) return state;
      }

      cell.value = action.value;
      cell.notes = new Set();
      cell.error = action.value !== 0 && getCellSolution(cell) !== action.value;

      const newMistakes = cell.error
        ? state.mistakes + 1
        : state.mistakes;

      const solved = isComplete(board);
      return {
        ...state,
        board,
        mistakes: newMistakes,
        status: solved ? "won" : state.status,
        history: [...(state.history ?? []).slice(-19), cloneBoard(state.board)],
      };
    }

    case "TOGGLE_NOTE": {
      if (!state.selectedCell || !state.noteMode) return state;
      const [row, col] = state.selectedCell;
      const board = cloneBoard(state.board);
      const cell = board[row][col];
      if (cell.given || cell.value !== 0) return state;
      if (cell.notes.has(action.value)) cell.notes.delete(action.value);
      else cell.notes.add(action.value);
      return { ...state, board, history: [...(state.history ?? []).slice(-19), cloneBoard(state.board)] };
    }

    case "TOGGLE_NOTE_MODE":
      return { ...state, noteMode: !state.noteMode };

    case "ERASE": {
      if (!state.selectedCell) return state;
      const [row, col] = state.selectedCell;
      const board = cloneBoard(state.board);
      const cell = board[row][col];
      if (cell.given) return state;
      if (cell.value === 0 && cell.notes.size === 0) return state;
      cell.value = 0;
      cell.error = false;
      cell.notes = new Set();
      return { ...state, board, history: [...(state.history ?? []).slice(-19), cloneBoard(state.board)] };
    }

    case "UNDO": {
      const history = state.history ?? [];
      if (history.length === 0) return state;
      const prev = history[history.length - 1];
      return { ...state, board: cloneBoard(prev), history: history.slice(0, -1) };
    }

    case "TICK":
      if (state.status !== "playing") return state;
      return { ...state, elapsed: state.elapsed + 1 };

    case "PAUSE":
      return state.status === "playing"
        ? { ...state, status: "paused" }
        : state;

    case "RESUME":
      return state.status === "paused"
        ? { ...state, status: "playing" }
        : state;

    case "APPLY_HINT": {
      const { row, col, value } = action;
      const board = cloneBoard(state.board);
      const cell = board[row][col];
      if (cell.given) return state;
      cell.value = value;
      cell.error = false;
      cell.notes = new Set();
      return {
        ...state,
        board,
        hintsUsed: state.hintsUsed + 1,
        status: isComplete(board) ? "won" : state.status,
      };
    }

    case "RESET": {
      const board = cloneBoard(state.board);
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++) {
          if (!board[r][c].given) {
            board[r][c].value = 0;
            board[r][c].error = false;
            board[r][c].notes = new Set();
          }
          board[r][c].highlighted = false;
        }
      return {
        ...state,
        board,
        elapsed: 0,
        mistakes: 0,
        hintsUsed: 0,
        status: "playing",
        selectedCell: null,
        history: [],
      };
    }

    default:
      return state;
  }
}

function isComplete(board: GameState["board"]): boolean {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const cell = board[r][c];
      if (cell.value === 0 || cell.error) return false;
    }
  return true;
}

export { boardToString };
