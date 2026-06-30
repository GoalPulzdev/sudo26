"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { motion } from "framer-motion";
import type { Hint, KillerCage } from "@sudoku-2026/core";
import { createKillerPuzzle, validateCage } from "@sudoku-2026/core";
import { useGameStore } from "@/store/gameStore";
import GameShell from "@/components/game/GameShell";
import ChallengeButton from "@/components/ChallengeButton";
import clsx from "clsx";

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

// Assign a color per cage index for visual grouping (light-theme friendly)
const CAGE_COLORS = [
  "bg-violet-100",  "bg-cyan-100",    "bg-rose-100",
  "bg-emerald-100", "bg-amber-100",   "bg-sky-100",
  "bg-pink-100",    "bg-teal-100",    "bg-indigo-100",
];

export default function KillerPage(): React.ReactElement {
  const { game, loadPuzzle } = useGameStore();
  const [cages, setCages] = useState<KillerCage[]>([]);

  useEffect(() => {
    const seed = `killer-${randomId()}`;
    const puzzle = createKillerPuzzle(seed, randomId());
    loadPuzzle(puzzle);
    setCages(puzzle.killerCages ?? []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GameShell
      title="Killer Sudoku"
      board={(hint) => <KillerBoard cages={cages} hint={hint} />}
      overlay={
        game?.status === "won" ? (
          <KillerWinOverlay
            elapsed={game.elapsed}
            mistakes={game.mistakes}
            onNewGame={() => {
              const seed = `killer-${randomId()}`;
              const puzzle = createKillerPuzzle(seed, randomId());
              loadPuzzle(puzzle);
              setCages(puzzle.killerCages ?? []);
            }}
          />
        ) : null
      }
    />
  );
}

/** Killer board with cage colouring + sum labels; reads state from the store. */
function KillerBoard({ cages, hint }: { cages: KillerCage[]; hint: Hint | null }) {
  const { game, dispatch } = useGameStore();
  if (!game) return null;

  const cellToCage = new Map<string, { cage: KillerCage; idx: number }>();
  cages.forEach((cage, idx) => {
    cage.cells.forEach(([r, c]) => cellToCage.set(`${r}-${c}`, { cage, idx }));
  });

  const isTopLeft = (r: number, c: number, cage: KillerCage): boolean => {
    const sorted = [...cage.cells].sort(([ar, ac], [br, bc]) =>
      ar !== br ? ar - br : ac - bc
    );
    return sorted[0][0] === r && sorted[0][1] === c;
  };

  const boardValues = game.board.map((row) => row.map((c) => c.value));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(9, 1fr)",
        width: "min(95vw, 500px)",
        aspectRatio: "1",
        border: "2px solid var(--box-border)",
        borderRadius: "12px",
        overflow: "hidden",
        background: "var(--surface)",
      }}
      className="select-none"
    >
      {game.board.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`;
          const cageInfo = cellToCage.get(key);
          const isSelected =
            game.selectedCell?.[0] === r && game.selectedCell?.[1] === c;
          const isHint = hint?.row === r && hint?.col === c;
          const isInvalid = cageInfo
            ? !validateCage(cageInfo.cage, boardValues)
            : false;

          const borderRight =
            (c + 1) % 3 === 0 && c !== 8
              ? "2px solid var(--box-border)"
              : "1px solid var(--border)";
          const borderBottom =
            (r + 1) % 3 === 0 && r !== 8
              ? "2px solid var(--box-border)"
              : "1px solid var(--border)";

          return (
            <motion.button
              key={key}
              onClick={() => dispatch({ type: "SELECT_CELL", row: r, col: c })}
              whileTap={{ scale: 0.95 }}
              style={{ borderRight, borderBottom }}
              className={clsx(
                "relative flex items-center justify-center text-lg font-semibold",
                "cursor-pointer transition-colors focus:outline-none",
                cageInfo ? CAGE_COLORS[cageInfo.idx % CAGE_COLORS.length] : "",
                isSelected && "!bg-violet-300/60",
                cell.error || isInvalid ? "text-[var(--error)]" : "text-[var(--player)]",
                cell.given && "!text-[var(--given)] font-extrabold"
              )}
            >
              {cageInfo && isTopLeft(r, c, cageInfo.cage) && (
                <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-amber-400 leading-none pointer-events-none">
                  {cageInfo.cage.sum}
                </span>
              )}
              {isHint && (
                <motion.span
                  className="absolute inset-0 pointer-events-none"
                  style={{ boxShadow: "inset 0 0 0 2.5px #d97706" }}
                  animate={{ opacity: [1, 0.35, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="absolute inset-0" style={{ background: "rgba(251,191,36,0.22)" }} />
                </motion.span>
              )}
              {cell.value !== 0 && (
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {cell.value}
                </motion.span>
              )}
            </motion.button>
          );
        })
      )}
    </div>
  );
}

function KillerChallengeRow({ elapsed }: { elapsed: number }) {
  const puzzle = useGameStore((s) => s.game?.puzzle ?? null);
  if (!puzzle) return null;
  return <ChallengeButton puzzle={puzzle} elapsed={elapsed} />;
}

function KillerWinOverlay({
  elapsed,
  mistakes,
  onNewGame,
}: {
  elapsed: number;
  mistakes: number;
  onNewGame: () => void;
}) {
  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");

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
        style={{ background: "var(--surface)", boxShadow: "0 24px 80px rgba(124,58,237,0.28), 0 0 0 1.5px rgba(124,58,237,0.18)" }}
      >
        {/* Header bar */}
        <div className="px-7 pt-8 pb-5"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #0891b2 100%)" }}>
          <div className="text-5xl mb-2">🔪</div>
          <h2 className="text-2xl font-black text-white">Killer Sudoku løst!</h2>
          <p className="text-sm text-white/70 mt-1">Imponerende</p>
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
            style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)", color: "#fff", boxShadow: "0 4px 20px rgba(124,58,237,0.35), 0 2px 0 rgba(79,70,229,0.5)" }}
          >
            Nytt spill
          </motion.button>
          <KillerChallengeRow elapsed={elapsed} />
          <a href="/stats" className="block text-xs font-bold uppercase tracking-widest transition-colors"
            style={{ color: "var(--text-dim)" }}>
            Se statistikk →
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
