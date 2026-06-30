"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Board, CellValue, Hint } from "@sudoku-2026/core";
import {
  createDailyPuzzle,
  getHint,
  boardToString,
  todayString,
  recordCompletion,
  createEmptyStreak,
} from "@sudoku-2026/core";
import { useGameStore } from "@/store/gameStore";
import SudokuBoard from "@/components/SudokuBoard";
import NumberPad from "@/components/NumberPad";
import GameHeader from "@/components/GameHeader";
import ChallengeButton from "@/components/ChallengeButton";

const STREAK_KEY = "sudoku-streak";

function loadStreak(userId: string) {
  if (typeof window === "undefined") return createEmptyStreak(userId);
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : createEmptyStreak(userId);
  } catch {
    return createEmptyStreak(userId);
  }
}

function saveStreak(data: ReturnType<typeof createEmptyStreak>) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  }
}

export default function DailyPage(): React.JSX.Element {
  const today = todayString();
  const { game, loadPuzzle, dispatch } = useGameStore();
  const [hint, setHint] = useState<Hint | null>(null);
  const [streak, setStreak] = useState(0);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const puzzle = createDailyPuzzle(today);
    if (game?.puzzle.id !== puzzle.id) {
      loadPuzzle(puzzle);
    }
    const s = loadStreak("local");
    setStreak(s.currentStreak);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  useEffect(() => {
    if (game?.status === "won" && game.puzzle.date === today) {
      const s = loadStreak("local");
      const updated = recordCompletion(s, today);
      saveStreak(updated);
      setStreak(updated.currentStreak);
    }
  }, [game?.status, game?.puzzle.date, today]);

  useEffect(() => {
    if (game?.status === "playing") {
      tickRef.current = setInterval(() => dispatch({ type: "TICK" }), 1000);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [game?.status, dispatch]);

  // Reset error tracking when a new puzzle is loaded
  useEffect(() => {
    setErrorCells(new Set());
  }, [game?.puzzle.id]);

  // Accumulate cells that have ever had an error (for share grid)
  useEffect(() => {
    if (!game?.board) return;
    game.board.forEach((row, r) => row.forEach((cell, c) => {
      if (cell.error) {
        setErrorCells(prev => {
          if (prev.has(`${r},${c}`)) return prev;
          const next = new Set(prev);
          next.add(`${r},${c}`);
          return next;
        });
      }
    }));
  }, [game?.board]);

  const handleHint = useCallback(() => {
    if (!game) return;
    const h = getHint(boardToString(game.board), game.puzzle.solution);
    setHint(h);
    if (h) dispatch({ type: "APPLY_HINT", row: h.row, col: h.col, value: h.value });
  }, [game, dispatch]);

  const { filledCount, totalCells } = useMemo(() => {
    if (!game) return { filledCount: 0, totalCells: 81 };
    let filled = 0, total = 0;
    for (const row of game.board) for (const cell of row) {
      if (!cell.given) { total++; if (cell.value !== 0) filled++; }
    }
    return { filledCount: filled, totalCells: total };
  }, [game]);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center gap-5 px-4 py-6">
      {/* Streak banner */}
      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-full px-4 py-1.5"
          style={{ background: "rgba(8,145,178,0.10)", border: "1px solid rgba(8,145,178,0.30)" }}
        >
          <span className="text-base">🔥</span>
          <span className="text-sm font-bold" style={{ color: "#0891b2" }}>{streak} dager på rad!</span>
        </motion.div>
      )}

      <GameHeader
        title={`Daglig utfordring · ${today}`}
        elapsed={game.elapsed}
        mistakes={game.mistakes}
        hintsUsed={game.hintsUsed}
        isPlaying={game.status === "playing"}
        hint={hint}
        onDismissHint={() => setHint(null)}
        onPause={() => dispatch({ type: game.status === "playing" ? "PAUSE" : "RESUME" })}
        filledCount={filledCount}
        totalCells={totalCells}
      />

      <SudokuBoard
        board={game.board}
        selectedCell={game.selectedCell}
        onCellClick={(row, col) => dispatch({ type: "SELECT_CELL", row, col })}
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

      <AnimatePresence>
        {game.status === "won" && (
          <DailyWinOverlay
            streak={streak}
            elapsed={game.elapsed}
            mistakes={game.mistakes}
            board={game.board}
            errorCells={errorCells}
            today={today}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function DailyWinOverlay({
  streak,
  elapsed,
  mistakes,
  board,
  errorCells,
  today,
}: {
  streak: number;
  elapsed: number;
  mistakes: number;
  board: Board;
  errorCells: Set<string>;
  today: string;
}) {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");

  function buildShareText(): string {
    const [y, mo, d] = today.split("-");
    const dateLabel = `${d}.${mo}.${y}`;
    const timePart = `${m}:${s}`;
    const mistakePart = mistakes === 0 ? "✨ Perfekt" : `${mistakes} feil`;
    const streakPart = streak > 0 ? ` | 🔥 ${streak}` : "";
    const grid = board
      .map((row, r) =>
        row.map((cell, c) => {
          if (cell.given) return "⬛";
          return errorCells.has(`${r},${c}`) ? "🟧" : "🟩";
        }).join("")
      ).join("\n");
    const url = typeof window !== "undefined" ? window.location.origin : "";
    return `🎯 Sudoku – Daglig ${dateLabel}\n⏱️ ${timePart} | ${mistakePart}${streakPart}\n\n${grid}${url ? `\n\n${url}` : ""}`;
  }

  async function handleShare() {
    const text = buildShareText();
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2000);
      }
    } catch {
      // User cancelled or clipboard unavailable — ignore
    }
  }

  const confetti = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * 360 + Math.random() * 22;
    const dist  = 90 + Math.random() * 110;
    const rad   = (angle * Math.PI) / 180;
    const tx    = Math.round(Math.cos(rad) * dist);
    const ty    = Math.round(Math.sin(rad) * dist + 60);
    const tr    = Math.round((Math.random() - 0.5) * 540);
    const colors = ["#7c3aed","#4f46e5","#0891b2","#f59e0b","#10b981","#f43f5e","#a78bfa"];
    return { tx, ty, tr, color: colors[i % colors.length], size: 6 + Math.random() * 7 };
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
      style={{ background: "rgba(90,70,150,0.22)" }}
    >
      {confetti.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm pointer-events-none"
          style={{ width: p.size, height: p.size * 0.55, background: p.color, top: "50%", left: "50%", marginTop: -p.size / 2, marginLeft: -p.size / 2 }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0.6 }}
          animate={{ x: p.tx, y: p.ty, rotate: p.tr, opacity: 0, scale: 1 }}
          transition={{ duration: 0.9 + Math.random() * 0.4, delay: 0.1 + i * 0.025, ease: "easeOut" }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.82, opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="rounded-3xl max-w-sm w-full mx-4 text-center flex flex-col overflow-hidden"
        style={{ background: "var(--surface)", boxShadow: "0 24px 80px rgba(8,145,178,0.28), 0 0 0 1.5px rgba(8,145,178,0.20)" }}
      >
        {/* Header */}
        <div className="px-7 pt-8 pb-5"
          style={{ background: "linear-gradient(135deg, #0891b2 0%, #0369a1 100%)" }}>
          <div className="text-5xl mb-2">📅</div>
          <h2 className="text-2xl font-black text-white">Dagens brett løst!</h2>
          {streak > 0 && (
            <p className="text-sm text-white/75 mt-1.5 font-semibold">
              🔥 {streak} dag{streak === 1 ? "" : "er"} på rad
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="px-6 py-5 grid grid-cols-3 gap-3">
          {[
            { label: "Tid",    value: `${m}:${s}`, accent: "#0891b2" },
            { label: "Feil",   value: String(mistakes), accent: mistakes === 0 ? "#059669" : "#dc2626" },
            { label: "Streak", value: String(streak),   accent: "#d97706" },
          ].map(({ label, value, accent }) => (
            <div key={label} className="rounded-xl py-3 flex flex-col items-center gap-0.5 relative overflow-hidden"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-xl" style={{ background: accent }} />
              <span className="text-sm font-black tabular-nums" style={{ color: "var(--text)" }}>{value}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 pb-7 flex flex-col gap-3">
          <button
            onClick={handleShare}
            className="w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest text-center transition-all"
            style={shareState === "copied"
              ? { background: "linear-gradient(135deg, #059669, #047857)", color: "#fff", boxShadow: "0 4px 20px rgba(5,150,105,0.35), 0 2px 0 rgba(4,120,87,0.5)" }
              : { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", boxShadow: "0 4px 20px rgba(124,58,237,0.35), 0 2px 0 rgba(79,70,229,0.5)" }
            }
          >
            {shareState === "copied" ? "✓ Kopiert!" : "📤 Del resultatet"}
          </button>
          <a
            href="/stats"
            className="block w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest text-center"
            style={{ background: "linear-gradient(135deg, #0891b2, #0369a1)", color: "#fff", boxShadow: "0 4px 20px rgba(8,145,178,0.35), 0 2px 0 rgba(3,105,161,0.5)" }}
          >
            Se statistikk
          </a>
          <DailyChallengeRow elapsed={elapsed} />
          <Link href="/" className="block text-xs font-bold uppercase tracking-widest transition-colors"
            style={{ color: "var(--text-dim)" }}>
            Tilbake til meny
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DailyChallengeRow({ elapsed }: { elapsed: number }) {
  const puzzle = useGameStore((s) => s.game?.puzzle ?? null);
  if (!puzzle) return null;
  return <ChallengeButton puzzle={puzzle} elapsed={elapsed} />;
}
