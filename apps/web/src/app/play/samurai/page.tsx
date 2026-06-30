"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { CellValue, Hint } from "@sudoku-2026/core";
import { createSamuraiPuzzle, getHint, boardToString, boardFromPuzzle } from "@sudoku-2026/core";
import type { SamuraiPuzzle } from "@sudoku-2026/core";
import { useGameStore } from "@/store/gameStore";
import NumberPad from "@/components/NumberPad";
import GameHeader from "@/components/GameHeader";
import SudokuBoard from "@/components/SudokuBoard";

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function SamuraiPage(): React.ReactElement {
  const { game, loadPuzzle, dispatch } = useGameStore();
  const [samurai, setSamurai] = useState<SamuraiPuzzle | null>(null);
  const [activeGrid, setActiveGrid] = useState(2); // Start with center (2)
  const [hint, setHint] = useState<Hint | null>(null);
  const [boards, setBoards] = useState<ReturnType<typeof boardFromPuzzle>[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const seed = `samurai-${randomId()}`;
    const puzzle = createSamuraiPuzzle(seed, randomId());
    setSamurai(puzzle);
    setBoards(
      puzzle.subGridClues.map((clues, i) =>
        boardFromPuzzle(clues, puzzle.subGridSolutions[i])
      )
    );
    // Load center grid into game state for timer / hint engine
    loadPuzzle(puzzle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (game?.status === "playing") {
      tickRef.current = setInterval(() => dispatch({ type: "TICK" }), 1000);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [game?.status, dispatch]);

  const handleHint = useCallback(() => {
    if (!game) return;
    const h = getHint(boardToString(game.board), game.puzzle.solution);
    setHint(h);
    if (h) dispatch({ type: "APPLY_HINT", row: h.row, col: h.col, value: h.value });
  }, [game, dispatch]);

  const GRID_LABELS = ["Nord-vest", "Nord-øst", "Senter", "Sør-vest", "Sør-øst"];

  if (!game || boards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center gap-5 px-4 py-6">
      <GameHeader
        title="Samurai Sudoku"
        elapsed={game.elapsed}
        mistakes={game.mistakes}
        hintsUsed={game.hintsUsed}
        isPlaying={game.status === "playing"}
        hint={hint}
        onDismissHint={() => setHint(null)}
        onPause={() => dispatch({ type: game.status === "playing" ? "PAUSE" : "RESUME" })}
        filledCount={0}
        totalCells={81}
      />

      {/* Grid picker */}
      <div className="flex flex-wrap justify-center gap-2">
        {GRID_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => setActiveGrid(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeGrid === i
                ? "bg-amber-600 text-white"
                : "bg-[var(--surface)] text-slate-400 border border-[var(--border)] hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-slate-500 text-xs">
        Hvert brett er uavhengig, men i full Samurai deler de boks-overlapp.
      </p>

      {/* Active sub-grid */}
      <SudokuBoard
        board={boards[activeGrid]}
        selectedCell={activeGrid === 2 ? game.selectedCell : null}
        onCellClick={(r, c) => {
          if (activeGrid === 2) dispatch({ type: "SELECT_CELL", row: r, col: c });
        }}
        hintCell={hint ? [hint.row, hint.col] : null}
      />

      <NumberPad
        noteMode={game.noteMode}
        onNumber={(v: CellValue) =>
          dispatch(game.noteMode ? { type: "TOGGLE_NOTE", value: v } : { type: "INPUT_VALUE", value: v })
        }
        onErase={() => dispatch({ type: "ERASE" })}
        onNote={() => dispatch({ type: "TOGGLE_NOTE_MODE" })}
        onHint={handleHint}
      />
    </main>
  );
}
