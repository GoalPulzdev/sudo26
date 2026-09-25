"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import type React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { CellValue, Hint } from "@sudoku-2026/core";
import { useGameStore } from "@/store/gameStore";
import SudokuBoard from "@/components/SudokuBoard";
import NumberPad from "@/components/NumberPad";
import GameHeader from "@/components/GameHeader";
import CoachPanel from "@/components/game/CoachPanel";
import { useCoach } from "@/lib/useCoach";

interface GameShellProps {
  /** Header title, e.g. "Klassisk · Middels". */
  title: string;
  /** Optional content rendered above the header (e.g. a streak banner). */
  aboveHeader?: React.ReactNode;
  /**
   * Custom board renderer. Receives the coach's target cell as a `Hint` so the
   * board can highlight it. Defaults to the standard 9×9 `SudokuBoard`. Variants with a
   * bespoke board (e.g. Killer cages) supply their own.
   */
  board?: (hint: Hint | null) => React.ReactNode;
  /** Optional content rendered under the number pad (e.g. a difficulty picker). */
  belowPad?: React.ReactNode;
  /** Optional overlay (e.g. a completion modal); page decides when to show it. */
  overlay?: React.ReactNode;
}

/**
 * Shared game shell: back-link, header (timer/mistakes/hints/pause/progress),
 * coach panel, board, number pad, keyboard input, and the per-second timer.
 *
 * It owns all the chrome and the standard reducer wiring so variant pages only
 * load a puzzle and supply page-specific extras (`belowPad`, `overlay`). State
 * comes from the shared `useGameStore`.
 */
export default function GameShell({
  title,
  aboveHeader,
  board,
  belowPad,
  overlay,
}: GameShellProps): React.ReactElement {
  const { game, dispatch } = useGameStore();
  const coach = useCoach();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Per-second timer while playing.
  useEffect(() => {
    if (game?.status === "playing") {
      tickRef.current = setInterval(() => dispatch({ type: "TICK" }), 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [game?.status, dispatch]);

  const handleCellClick = useCallback(
    (row: number, col: number) => dispatch({ type: "SELECT_CELL", row, col }),
    [dispatch]
  );

  const handleNumber = useCallback(
    (value: CellValue) => {
      if (game?.noteMode) dispatch({ type: "TOGGLE_NOTE", value });
      else dispatch({ type: "INPUT_VALUE", value });
    },
    [dispatch, game?.noteMode]
  );

  const { advance: handleHint, close: closeCoach } = coach;

  const { filledCount, totalCells } = useMemo(() => {
    if (!game) return { filledCount: 0, totalCells: 81 };
    let filled = 0;
    let total = 0;
    for (const row of game.board) {
      for (const cell of row) {
        if (!cell.given) {
          total++;
          if (cell.value !== 0) filled++;
        }
      }
    }
    return { filledCount: filled, totalCells: total };
  }, [game]);

  // Keyboard support: digits input, backspace/delete erase, "n" toggles notes,
  // "h" asks the coach (again to go deeper), Escape closes it.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!game) return;
      const num = parseInt(e.key, 10) as CellValue;
      if (num >= 1 && num <= 9) handleNumber(num);
      if (e.key === "Backspace" || e.key === "Delete") dispatch({ type: "ERASE" });
      if (e.key === "n") dispatch({ type: "TOGGLE_NOTE_MODE" });
      if (e.key === "h") handleHint();
      if (e.key === "Escape") closeCoach();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, handleNumber, dispatch, handleHint, closeCoach]);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 rounded-full"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start gap-4 px-4 py-6 relative">
      <div style={{ width: "min(92vw, 480px)" }} className="self-start">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest transition-colors"
          style={{ color: "var(--color-muted)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--color-muted)")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Hjem
        </Link>
      </div>

      {aboveHeader}

      <GameHeader
        title={title}
        elapsed={game.elapsed}
        mistakes={game.mistakes}
        hintsUsed={game.hintsUsed}
        isPlaying={game.status === "playing"}
        onPause={() => dispatch({ type: game.status === "playing" ? "PAUSE" : "RESUME" })}
        filledCount={filledCount}
        totalCells={totalCells}
      />

      <CoachPanel
        view={coach.view}
        missingNotes={coach.missingNotes}
        onExplain={coach.explain}
        onAct={coach.act}
        onClose={coach.close}
      />

      {board ? (
        board(coach.hint)
      ) : (
        <SudokuBoard
          board={game.board}
          selectedCell={game.selectedCell}
          onCellClick={handleCellClick}
          coach={coach.overlay}
        />
      )}

      <NumberPad
        noteMode={game.noteMode}
        onNumber={handleNumber}
        onErase={() => dispatch({ type: "ERASE" })}
        onNote={() => dispatch({ type: "TOGGLE_NOTE_MODE" })}
        onHint={handleHint}
      />

      {belowPad}

      <AnimatePresence>{overlay}</AnimatePresence>
    </main>
  );
}
