"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { analyzeGame } from "@sudoku-2026/core";
import { useGameStore } from "@/store/gameStore";
import GameAnalysisSheet from "./GameAnalysisSheet";

/** Rank title + "see analysis" button for a finished game, with the analysis sheet. */
export default function AnalysisLauncher(): React.ReactElement | null {
  const game = useGameStore((s) => s.game);
  const [open, setOpen] = useState(false);

  const analysis = useMemo(
    () =>
      game && game.status === "won"
        ? analyzeGame({
            clues: game.puzzle.clues,
            moves: game.moves,
            elapsed: game.elapsed,
            mistakes: game.mistakes,
            hintsUsed: game.hintsUsed,
          })
        : null,
    [game]
  );

  if (!game || !analysis) return null;

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.96 }}
        className="w-full rounded-2xl px-4 py-3 flex items-center justify-between gap-3 cursor-pointer text-left"
        style={{ background: "var(--accent-2-light)", border: "1.5px solid rgba(191,156,69,0.45)" }}
      >
        <span className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent-2)" }}>
            Din tittel
          </span>
          <span className="text-base font-black" style={{ color: "var(--text)" }}>
            {analysis.title.name}
          </span>
        </span>
        <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: "var(--accent)" }}>
          Se analysen →
        </span>
      </motion.button>
      <AnimatePresence>
        {open && <GameAnalysisSheet analysis={analysis} clues={game.puzzle.clues} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
