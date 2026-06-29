"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type React from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Difficulty, CellValue, Hint, Puzzle } from "@sudoku-2026/core";
import { createPuzzle, getHint, boardToString } from "@sudoku-2026/core";
import { useGameStore } from "@/store/gameStore";
import { useAuthStore } from "@/store/authStore";
import { createChallenge } from "@/lib/challenges";
import SudokuBoard from "@/components/SudokuBoard";
import NumberPad from "@/components/NumberPad";
import GameHeader from "@/components/GameHeader";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Enkel", medium: "Middels", hard: "Vanskelig", extreme: "Ekstrem", daily: "Daglig", mini: "Mini 6×6",
};

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ClassicGamePage(): React.JSX.Element {
  const params = useParams();
  const difficulty = (params?.difficulty as Difficulty | undefined) ?? "medium";

  const { game, loadPuzzle, dispatch } = useGameStore();
  const [hint, setHint] = useState<Hint | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start a game if none loaded or difficulty changed
  useEffect(() => {
    if (!game || game.puzzle.difficulty !== difficulty) {
      const seed = `${difficulty}-${randomId()}`;
      const puzzle = createPuzzle(difficulty, seed, randomId());
      loadPuzzle(puzzle);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  // Tick timer
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
      if (game?.noteMode) {
        dispatch({ type: "TOGGLE_NOTE", value });
      } else {
        dispatch({ type: "INPUT_VALUE", value });
      }
    },
    [dispatch, game?.noteMode]
  );

  const handleHint = useCallback(() => {
    if (!game) return;
    const currentStr = boardToString(game.board);
    const h = getHint(currentStr, game.puzzle.solution);
    setHint(h);
    if (h) dispatch({ type: "APPLY_HINT", row: h.row, col: h.col, value: h.value });
  }, [game, dispatch]);

  // Board fill stats for progress bar
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

  // Keyboard support
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!game) return;
      const num = parseInt(e.key, 10) as CellValue;
      if (num >= 1 && num <= 9) handleNumber(num);
      if (e.key === "Backspace" || e.key === "Delete") dispatch({ type: "ERASE" });
      if (e.key === "n") dispatch({ type: "TOGGLE_NOTE_MODE" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, handleNumber, dispatch]);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start gap-4 px-4 py-6 relative">
      {/* Back link */}
      <div style={{ width: "min(92vw, 480px)" }} className="self-start">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Hjem
        </a>
      </div>

      <GameHeader
        title={`Klassisk · ${DIFFICULTY_LABELS[difficulty]}`}
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
        onCellClick={handleCellClick}
        hintCell={hint ? [hint.row, hint.col] : null}
      />

      <NumberPad
        noteMode={game.noteMode}
        onNumber={handleNumber}
        onErase={() => dispatch({ type: "ERASE" })}
        onNote={() => dispatch({ type: "TOGGLE_NOTE_MODE" })}
        onHint={handleHint}
      />

      <DifficultyPicker current={difficulty} />

      <AnimatePresence>
        {game.status === "won" && (
          <WinOverlay
            elapsed={game.elapsed}
            mistakes={game.mistakes}
            difficulty={difficulty}
            onNewGame={() => {
              const seed = `${difficulty}-${randomId()}`;
              loadPuzzle(createPuzzle(difficulty, seed, randomId()));
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function DifficultyPicker({ current }: { current: Difficulty }) {
  const levels: Difficulty[] = ["easy", "medium", "hard", "extreme"];
  const LABELS: Record<Difficulty, string> = { easy: "Enkel", medium: "Middels", hard: "Vanskelig", extreme: "Ekstrem", daily: "Daglig", mini: "Mini 6×6" };
  return (
    <div className="flex gap-2" style={{ width: "min(92vw, 480px)" }}>
      {levels.map((d) => (
        <a
          key={d}
          href={`/play/classic/${d}`}
          className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-center transition-all duration-150"
          style={{
            background: d === current ? "rgba(124,58,237,0.12)" : "var(--surface)",
            border: `1.5px solid ${d === current ? "var(--accent)" : "var(--border-2)"}`,
            color: d === current ? "var(--accent)" : "var(--text-muted)",
            boxShadow: d === current ? "0 0 0 3px rgba(124,58,237,0.12)" : "var(--shadow-sm)",
          }}
        >
          {LABELS[d]}
        </a>
      ))}
    </div>
  );
}

function WinOverlay({
  elapsed,
  mistakes,
  difficulty,
  onNewGame,
}: {
  elapsed: number;
  mistakes: number;
  difficulty: Difficulty;
  onNewGame: () => void;
}) {
  const stats = useGameStore((s) => s.stats);
  const ds = stats.byDifficulty[difficulty];
  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  const LABELS: Record<Difficulty, string> = { easy: "Enkel", medium: "Middels", hard: "Vanskelig", extreme: "Ekstrem", daily: "Daglig", mini: "Mini 6×6" };
  const isPersonalBest = ds.bestTime !== null && elapsed <= ds.bestTime;

  // Confetti particle config
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
      {/* Confetti burst */}
      {confetti.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm pointer-events-none"
          style={{
            width: p.size, height: p.size * 0.55,
            background: p.color,
            top: "50%", left: "50%",
            marginTop: -p.size / 2, marginLeft: -p.size / 2,
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0.6 }}
          animate={{
            x: p.tx, y: p.ty,
            rotate: p.tr,
            opacity: 0,
            scale: 1,
          }}
          transition={{ duration: 0.9 + Math.random() * 0.4, delay: 0.1 + i * 0.025, ease: "easeOut" }}
        />
      ))}

      {/* Card  */}
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.82, opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="rounded-3xl max-w-sm w-full mx-4 text-center flex flex-col overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1.5px solid var(--border-2)",
          boxShadow: "0 24px 64px rgba(79,70,229,0.22), 0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {/* Top colour band */}
        <div className="h-1.5 w-full" style={{ background: isPersonalBest
          ? "linear-gradient(90deg,#d97706,#fbbf24)"
          : "linear-gradient(90deg,#7c3aed,#4f46e5,#0891b2)" }} />

        <div className="p-8 flex flex-col gap-5">
          {/* Trophy */}
          <motion.div
            className="text-7xl mx-auto"
            style={{ animation: "float 3s ease-in-out infinite" }}
            animate={{ scale: [0.5, 1.15, 0.95, 1] }}
            transition={{ duration: 0.55, delay: 0.15 }}
          >
            {isPersonalBest ? "🥇" : "🏆"}
          </motion.div>

          {/* Headline */}
          <div>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: "var(--text)" }}>
              Fullført!
            </h2>
            {isPersonalBest && (
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xs font-bold uppercase tracking-widest mt-1"
                style={{ color: "#d97706" }}
              >
                ✨ Personlig rekord!
              </motion.p>
            )}
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              {LABELS[difficulty]}
            </p>
          </div>

          {/* Hero time */}
          <div
            className="rounded-2xl py-3 px-4 mx-auto min-w-[120px]"
            style={{ background: "var(--accent-light)", border: "1.5px solid var(--border-2)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--text-dim)" }}>Tid</p>
            <p className="text-4xl font-black font-mono tabular-nums tracking-tight" style={{ color: "var(--accent)" }}>
              {m}:{s}
            </p>
            {mistakes > 0 && (
              <p className="text-[11px] mt-0.5" style={{ color: "var(--error)" }}>
                {mistakes} feil
              </p>
            )}
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Streak" value={`${stats.currentStreak}`} accent="#d97706" unit="🔥" />
            <MiniStat label="Vunnet" value={`${ds.won}`}              accent="#059669" />
            <MiniStat
              label="Best"
              value={ds.bestTime !== null
                ? `${Math.floor(ds.bestTime/60)}:${String(ds.bestTime%60).padStart(2,"0")}`
                : "–"}
              accent="var(--accent)"
            />
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-2">
            <motion.button
              onClick={onNewGame}
              whileTap={{ scale: 0.96 }}
              className="w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(124,58,237,0.35), 0 2px 0 rgba(79,70,229,0.5)",
              }}
            >
              Nytt spill
            </motion.button>
            <ChallengeButton elapsed={elapsed} />
          </div>
          <a
            href="/stats"
            className="block text-xs font-bold uppercase tracking-widest transition-colors"
            style={{ color: "var(--text-dim)" }}
          >
            Se statistikk →
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MiniStat({ label, value, accent, unit }: { label: string; value: string; accent: string; unit?: string }) {
  return (
    <div
      className="rounded-xl py-2.5 px-1 flex flex-col items-center gap-0.5 relative overflow-hidden"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-xl" style={{ background: accent }} />
      <span className="text-sm font-black tabular-nums" style={{ color: "var(--text)" }}>
        {value}{unit && <span className="ml-0.5">{unit}</span>}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>{label}</span>
    </div>
  );
}

function ChallengeButton({ elapsed }: { elapsed: number }) {
  const puzzle = useGameStore((s) => s.game?.puzzle ?? null);
  const profile = useAuthStore((s) => s.profile);
  const [link, setLink] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!puzzle) return null;

  const handleCreate = async () => {
    if (link) {
      void navigator.clipboard.writeText(window.location.origin + link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    setCreating(true);
    try {
      const id = await createChallenge(puzzle, profile?.userId ?? "anon", elapsed);
      const l = `/challenge/${id}`;
      setLink(l);
      void navigator.clipboard.writeText(window.location.origin + l);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.button
      onClick={() => void handleCreate()}
      whileTap={{ scale: 0.96 }}
      className="w-full py-3 rounded-2xl font-bold text-sm tracking-wide cursor-pointer"
      style={{
        background: copied ? "#059669" : "var(--surface-2)",
        color: copied ? "#fff" : "var(--text)",
        border: "1.5px solid var(--border-2)",
      }}
    >
      {creating ? "Oppretter…" : copied ? "✓ Lenke kopiert!" : link ? "Kopier lenke" : "🤝 Utfordre en venn"}
    </motion.button>
  );
}



