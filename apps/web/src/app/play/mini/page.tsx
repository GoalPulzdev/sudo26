"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createMiniPuzzle } from "@sudoku-2026/core";
import { useGameStore } from "@/store/gameStore";
import ChallengeButton from "@/components/ChallengeButton";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

type MiniDifficulty = "easy" | "medium" | "hard";
type Val = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface MCell {
  value: Val;
  given: boolean;
  error: boolean;
  notes: Set<Val>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function parseMiniBoard(clues: string, solution: string): MCell[][] {
  return Array.from({ length: 6 }, (_, r) =>
    Array.from({ length: 6 }, (_, c) => {
      const i = r * 6 + c;
      const raw = Number(clues[i]);
      const val = (raw >= 1 && raw <= 6 ? raw : 0) as Val;
      return { value: val, given: val !== 0, error: false, notes: new Set<Val>() };
    })
  );
}

function isMiniCellValid(board: MCell[][], row: number, col: number): boolean {
  const v = board[row][col].value;
  if (v === 0) return true;
  const boxRow = Math.floor(row / 2) * 2;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 6; i++) {
    if (i !== col && board[row][i].value === v) return false;
    if (i !== row && board[i][col].value === v) return false;
  }
  for (let br = boxRow; br < boxRow + 2; br++) {
    for (let bc = boxCol; bc < boxCol + 3; bc++) {
      if ((br !== row || bc !== col) && board[br][bc].value === v) return false;
    }
  }
  return true;
}

function checkComplete(board: MCell[][], solution: string): boolean {
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 6; c++)
      if (board[r][c].value !== Number(solution[r * 6 + c])) return false;
  return true;
}

const DIFFICULTY_LABELS: Record<MiniDifficulty, string> = {
  easy: "Enkel",
  medium: "Middels",
  hard: "Vanskelig",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MiniPage(): React.JSX.Element {
  const recordWin = useGameStore((s) => s.recordWin);

  const [difficulty, setDifficulty] = useState<MiniDifficulty>("easy");
  const [board, setBoard] = useState<MCell[][] | null>(null);
  const [solution, setSolution] = useState("");
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [status, setStatus] = useState<"playing" | "won">("playing");
  const [currentPuzzle, setCurrentPuzzle] = useState<import("@sudoku-2026/core").Puzzle | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startNewGame = useCallback((diff: MiniDifficulty) => {
    const seed = `mini-${diff}-${randomId()}`;
    const puzzle = createMiniPuzzle(diff, seed, randomId());
    setSolution(puzzle.solution);
    setCurrentPuzzle(puzzle);
    setBoard(parseMiniBoard(puzzle.clues, puzzle.solution));
    setSelected(null);
    setNoteMode(false);
    setElapsed(0);
    setMistakes(0);
    setStatus("playing");
    setDifficulty(diff);
  }, []);

  useEffect(() => { startNewGame("easy"); }, [startNewGame]);

  useEffect(() => {
    if (status === "playing") {
      tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [status]);

  const handleInput = useCallback((val: Val) => {
    if (!board || !selected || status === "won") return;
    const [r, c] = selected;
    if (board[r][c].given) return;

    const next = board.map((row) => row.map((cell) => ({ ...cell, notes: new Set(cell.notes) })));

    if (noteMode) {
      const notes = next[r][c].notes;
      if (val === 0) { notes.clear(); } else { notes.has(val) ? notes.delete(val) : notes.add(val); }
    } else {
      next[r][c].value = val;
      next[r][c].notes.clear();
      // Mark errors across row/col/box
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
          if (!next[row][col].given) {
            next[row][col].error = !isMiniCellValid(next, row, col);
          }
        }
      }
      if (val !== 0 && !isMiniCellValid(next, r, c)) {
        setMistakes((m) => m + 1);
      }
      if (checkComplete(next, solution)) {
        setBoard(next);
        setStatus("won");
        recordWin("mini", elapsed);
        return;
      }
    }
    setBoard(next);
  }, [board, selected, status, noteMode, solution, elapsed, recordWin]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selected || !board) return;
    const [r, c] = selected;
    const key = e.key;
    if (key >= "1" && key <= "6") { handleInput(Number(key) as Val); return; }
    if (key === "0" || key === "Backspace" || key === "Delete") { handleInput(0); return; }
    if (key === "ArrowUp"    && r > 0) { setSelected([r - 1, c]); e.preventDefault(); }
    if (key === "ArrowDown"  && r < 5) { setSelected([r + 1, c]); e.preventDefault(); }
    if (key === "ArrowLeft"  && c > 0) { setSelected([r, c - 1]); e.preventDefault(); }
    if (key === "ArrowRight" && c < 5) { setSelected([r, c + 1]); e.preventDefault(); }
  }, [selected, board, handleInput]);

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  const total = 36 - board.flat().filter((c) => c.given).length;
  const filled = board.flat().filter((c) => !c.given && c.value !== 0).length;
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

  return (
    <main
      className="min-h-screen flex flex-col items-center gap-5 px-4 py-6"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Header */}
      <div className="flex flex-col gap-2" style={{ width: "min(92vw, 420px)" }}>
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <Link href="/" className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--text-dim)" }}>← Hjem</Link>
          <span className="text-sm font-black" style={{ color: "var(--text)" }}>Mini Sudoku</span>
          <div className="flex items-center gap-2 text-xs tabular-nums font-bold" style={{ color: "var(--text-muted)" }}>
            <span>{m}:{s}</span>
            {mistakes > 0 && <span style={{ color: "var(--error)" }}>✕{mistakes}</span>}
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as MiniDifficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => startNewGame(d)}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              style={{
                background: difficulty === d ? "var(--accent)" : "var(--surface)",
                color: difficulty === d ? "#fff" : "var(--text-muted)",
                border: `1.5px solid ${difficulty === d ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <motion.div className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #059669, #10b981)", width: `${pct}%` }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 80 }}
          />
        </div>
      </div>

      {/* 6×6 Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          width: "min(92vw, 360px)",
          aspectRatio: "1",
          border: "2.5px solid var(--box-border)",
          borderRadius: "12px",
          overflow: "hidden",
          background: "var(--surface)",
        }}
        className="select-none"
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isSameVal = selected && board[selected[0]][selected[1]].value !== 0
              && cell.value === board[selected[0]][selected[1]].value;
            const isPeer =
              selected &&
              (selected[0] === r ||
               selected[1] === c ||
               (Math.floor(selected[0] / 2) === Math.floor(r / 2) &&
                Math.floor(selected[1] / 3) === Math.floor(c / 3)));

            // Box borders: thick every 2 rows, 3 cols
            const borderRight =
              c === 2 ? "2.5px solid var(--box-border)"
              : c < 5 ? "1px solid var(--border)"
              : "none";
            const borderBottom =
              r === 1 || r === 3 ? "2.5px solid var(--box-border)"
              : r < 5 ? "1px solid var(--border)"
              : "none";

            return (
              <motion.button
                key={`${r}-${c}`}
                onClick={() => setSelected([r, c])}
                whileTap={{ scale: 0.92 }}
                className={clsx(
                  "relative flex items-center justify-center text-xl font-semibold",
                  "cursor-pointer transition-colors focus:outline-none",
                )}
                style={{
                  borderRight,
                  borderBottom,
                  background: isSelected
                    ? "rgba(5,150,105,0.25)"
                    : isSameVal
                    ? "rgba(5,150,105,0.12)"
                    : isPeer
                    ? "var(--surface-2)"
                    : "transparent",
                  color: cell.error
                    ? "var(--error)"
                    : cell.given
                    ? "var(--given)"
                    : "var(--player)",
                  fontWeight: cell.given ? 800 : 600,
                }}
              >
                {cell.value !== 0 ? (
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={cell.value}
                  >
                    {cell.value}
                  </motion.span>
                ) : cell.notes.size > 0 ? (
                  <div className="grid grid-cols-3" style={{ fontSize: "7px", lineHeight: 1, color: "var(--text-dim)", gap: 0 }}>
                    {([1, 2, 3, 4, 5, 6] as Val[]).map((n) => (
                      <span key={n} style={{ opacity: cell.notes.has(n) ? 1 : 0, textAlign: "center" }}>{n}</span>
                    ))}
                  </div>
                ) : null}
              </motion.button>
            );
          })
        )}
      </div>

      {/* Number Pad 1–6 */}
      <div className="flex flex-col gap-2" style={{ width: "min(92vw, 360px)" }}>
        <div className="grid grid-cols-6 gap-1.5">
          {([1, 2, 3, 4, 5, 6] as Val[]).map((n) => (
            <motion.button
              key={n}
              onClick={() => handleInput(n)}
              whileTap={{ scale: 0.91 }}
              className="flex items-center justify-center rounded-xl text-xl font-black"
              style={{
                height: "54px",
                background: "var(--surface)",
                border: "1.5px solid var(--border-2)",
                color: "var(--text)",
                boxShadow: "var(--key-shadow)",
              }}
            >
              {n}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {/* Erase */}
          <motion.button
            onClick={() => handleInput(0)}
            whileTap={{ scale: 0.91 }}
            className="flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold uppercase tracking-widest"
            style={{ height: "44px", background: "var(--surface)", border: "1.5px solid var(--border-2)", color: "var(--text-muted)", boxShadow: "var(--key-shadow)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
            </svg>
            Slett
          </motion.button>

          {/* Notes */}
          <motion.button
            onClick={() => setNoteMode((n) => !n)}
            whileTap={{ scale: 0.91 }}
            className="flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold uppercase tracking-widest"
            style={{
              height: "44px",
              background: noteMode ? "rgba(5,150,105,0.15)" : "var(--surface)",
              border: `1.5px solid ${noteMode ? "#059669" : "var(--border-2)"}`,
              color: noteMode ? "#059669" : "var(--text-muted)",
              boxShadow: "var(--key-shadow)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Notat
          </motion.button>

          {/* New game */}
          <motion.button
            onClick={() => startNewGame(difficulty)}
            whileTap={{ scale: 0.91 }}
            className="flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold uppercase tracking-widest"
            style={{ height: "44px", background: "var(--surface)", border: "1.5px solid var(--border-2)", color: "var(--text-muted)", boxShadow: "var(--key-shadow)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Nytt
          </motion.button>
        </div>
      </div>

      {/* Win overlay */}
      <AnimatePresence>
        {status === "won" && (
          <MiniWinOverlay
            elapsed={elapsed}
            mistakes={mistakes}
            difficulty={difficulty}
            puzzle={currentPuzzle}
            onNewGame={() => startNewGame(difficulty)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ─── Win Overlay ──────────────────────────────────────────────────────────────

function MiniWinOverlay({
  elapsed,
  mistakes,
  difficulty,
  puzzle,
  onNewGame,
}: {
  elapsed: number;
  mistakes: number;
  difficulty: MiniDifficulty;
  puzzle: import("@sudoku-2026/core").Puzzle | null;
  onNewGame: () => void;
}) {
  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");

  const confetti = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * 360 + Math.random() * 22;
    const dist  = 80 + Math.random() * 100;
    const rad   = (angle * Math.PI) / 180;
    const tx    = Math.round(Math.cos(rad) * dist);
    const ty    = Math.round(Math.sin(rad) * dist + 50);
    const tr    = Math.round((Math.random() - 0.5) * 540);
    const colors = ["#059669","#10b981","#34d399","#6ee7b7","#f59e0b","#7c3aed","#f43f5e"];
    return { tx, ty, tr, color: colors[i % colors.length], size: 6 + Math.random() * 7 };
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
      style={{ background: "rgba(5,150,105,0.15)" }}
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
        style={{ background: "var(--surface)", boxShadow: "0 24px 80px rgba(5,150,105,0.28), 0 0 0 1.5px rgba(5,150,105,0.2)" }}
      >
        {/* Header */}
        <div className="px-7 pt-8 pb-5"
          style={{ background: "linear-gradient(135deg, #059669 0%, #0891b2 100%)" }}>
          <div className="text-5xl mb-2">⚡</div>
          <h2 className="text-2xl font-black text-white">Mini løst!</h2>
          <p className="text-sm text-white/70 mt-1">{DIFFICULTY_LABELS[difficulty]} — godt jobbet!</p>
        </div>

        {/* Stats */}
        <div className="px-6 py-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl py-3 flex flex-col items-center gap-0.5 relative overflow-hidden"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-xl" style={{ background: "#0891b2" }} />
            <span className="text-base font-black tabular-nums" style={{ color: "var(--text)" }}>{m}:{s}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>Tid</span>
          </div>
          <div className="rounded-xl py-3 flex flex-col items-center gap-0.5 relative overflow-hidden"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-xl" style={{ background: mistakes === 0 ? "#059669" : "#dc2626" }} />
            <span className="text-base font-black tabular-nums" style={{ color: "var(--text)" }}>{mistakes}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>Feil</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-7 flex flex-col gap-3">
          <motion.button
            onClick={onNewGame}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest"
            style={{ background: "linear-gradient(135deg, #059669, #0891b2)", color: "#fff", boxShadow: "0 4px 20px rgba(5,150,105,0.35)" }}
          >
            Nytt spill
          </motion.button>
          {puzzle && <ChallengeButton puzzle={puzzle} elapsed={elapsed} />}
          <Link href="/stats" className="block text-xs font-bold uppercase tracking-widest transition-colors"
            style={{ color: "var(--text-dim)" }}>
            Se statistikk →
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
