import type { Board, Cell, CellValue } from "./types.js";

export function createEmptyCell(): Cell {
  return {
    value: 0,
    given: false,
    solution: 0,
    notes: new Set<CellValue>(),
    error: false,
    highlighted: false,
  };
}

export function createEmptyBoard(): Board {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => createEmptyCell())
  );
}

/** Build a playable board from an 81-char clue string and solution string */
export function boardFromPuzzle(clues: string, solution: string): Board {
  const board = createEmptyBoard();
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const clue = parseInt(clues[i], 10) as CellValue;
    const sol = parseInt(solution[i], 10) as CellValue;
    board[r][c] = {
      value: clue,
      given: clue !== 0,
      solution: sol,
      notes: new Set<CellValue>(),
      error: false,
      highlighted: false,
    };
  }
  return board;
}

export function getCellSolution(cell: Cell): CellValue {
  return cell.solution ?? 0;
}

/** Serialize board to an 81-char string of current values */
export function boardToString(board: Board): string {
  return board.flat().map((c) => c.value).join("");
}

/** Deep-clone a board (preserves notes, given, _solution, etc.) */
export function cloneBoard(board: Board): Board {
  return board.map((row) =>
    row.map((cell) => {
      // After JSON serialization (Zustand persist), Sets become plain objects.
      // Reconstruct a proper Set from whatever form notes arrived in.
      const rawNotes = (cell as unknown as { notes: unknown }).notes;
      const notes: Set<CellValue> =
        rawNotes instanceof Set
          ? new Set(rawNotes)
          : Array.isArray(rawNotes)
          ? new Set(rawNotes as CellValue[])
          : new Set(); // serialized as {} — empty set is correct
      const cloned = { ...cell, notes };
      return cloned;
    })
  );
}
