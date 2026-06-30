"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import type React from "react";
import type { CellValue } from "@sudoku-2026/core";
import {
  getChallenge,
  submitChallengeAttempt,
  type ChallengeRecord,
  type ChallengeAttempt,
} from "@/lib/challenges";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import SudokuBoard from "@/components/SudokuBoard";
import NumberPad from "@/components/NumberPad";

// ─── Mini board types (same as play/mini) ────────────────────────────────────
type Val = 0 | 1 | 2 | 3 | 4 | 5 | 6;
interface MCell {
  value: Val;
  given: boolean;
  error: boolean;
  notes: Set<Val>;
}

function fmt(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function parseMiniBoard(clues: string): MCell[][] {
  return Array.from({ length: 6 }, (_, r) =>
    Array.from({ length: 6 }, (_, c) => {
      const raw = Number(clues[r * 6 + c]);
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

// ─── Score bar ───────────────────────────────────────────────────────────────

function ScoreRow({
  rank,
  username,
  color,
  timeSecs,
  mistakes,
  isCreator,
  isYou,
}: {
  rank: number;
  username: string | null;
  color: string;
  timeSecs: number;
  mistakes: number;
  isCreator: boolean;
  isYou: boolean;
}) {
  const display = username ?? "Anonym";
  const initial = display[0].toUpperCase();
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ borderBottom: "1px solid var(--border)", background: isYou ? `${color}0c` : undefined }}
    >
      <span className="w-5 text-xs font-black tabular-nums" style={{ color: rank <= 3 ? "#d4b25a" : "var(--text-dim)" }}>
        {rank}
      </span>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, color: "#fff" }}>
        {initial}
      </div>
      <span className="flex-1 text-sm font-bold truncate" style={{ color: "var(--text)" }}>
        {display}
        {isCreator && <span className="ml-1 text-[9px] uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>▲</span>}
        {isYou && <span className="ml-1 text-[9px] uppercase tracking-widest" style={{ color: "var(--accent)" }}>deg</span>}
      </span>
      <span className="text-sm tabular-nums font-semibold" style={{ color: "var(--text)" }}>{fmt(timeSecs)}</span>
      {mistakes > 0 && (
        <span className="text-xs" style={{ color: "var(--error)" }}>+{mistakes}</span>
      )}
    </div>
  );
}

// ─── Win overlay ─────────────────────────────────────────────────────────────

function ChallengeWinOverlay({
  timeSecs,
  mistakes,
  challenge,
  attempts,
  userId,
}: {
  timeSecs: number;
  mistakes: number;
  challenge: ChallengeRecord;
  attempts: ChallengeAttempt[];
  userId: string;
}) {
  const creatorFaster = challenge.creator_time_seconds < timeSecs;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex flex-col items-center justify-start pt-20 px-4 z-40 backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="rounded-3xl overflow-hidden w-full"
        style={{ maxWidth: 420, background: "var(--surface)", boxShadow: "var(--shadow)" }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-1 px-6 pt-7 pb-5"
          style={{ borderBottom: "1.5px solid var(--border-2)" }}>
          <span className="text-3xl">{creatorFaster ? "👍" : "🏆"}</span>
          <p className="text-xl font-black" style={{ color: "var(--text)" }}>
            {creatorFaster ? "Bra forsøk!" : "Du slo utfordreren!"}
          </p>
          <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
            Du løste det på <strong>{fmt(timeSecs)}</strong>
            {mistakes > 0 && ` med ${mistakes} feil`}.
            {" "}{challenge.creator_username ?? "Utfordreren"} brukte{" "}
            <strong>{fmt(challenge.creator_time_seconds)}</strong>.
          </p>
        </div>

        {/* Leaderboard */}
        {attempts.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest"
              style={{ color: "var(--text-dim)" }}>Ledertavle</p>
            {attempts.slice(0, 5).map((a, i) => (
              <ScoreRow
                key={a.id}
                rank={i + 1}
                username={a.username}
                color={a.color}
                timeSecs={a.time_seconds}
                mistakes={a.mistakes}
                isCreator={a.user_id === challenge.created_by}
                isYou={a.user_id === userId}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="p-5 flex flex-col gap-2">
          <Link href="/" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl text-center text-sm font-black uppercase tracking-widest"
              style={{ background: "var(--surface-2)", color: "var(--text)" }}
            >
              ← Hjem
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Mini 6×6 board renderer ─────────────────────────────────────────────────

function MiniBoardView({
  board,
  selected,
  onSelect,
}: {
  board: MCell[][];
  selected: [number, number] | null;
  onSelect: (r: number, c: number) => void;
}) {
  const selRow = selected?.[0] ?? -1;
  const selCol = selected?.[1] ?? -1;
  const selVal = selected ? board[selRow][selCol].value : 0;

  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{ border: "2.5px solid var(--box-border)" }}>
      {board.map((row, r) => (
        <div key={r} className="flex">
          {row.map((cell, c) => {
            const isSel = r === selRow && c === selCol;
            const isHighRow = r === selRow || c === selCol;
            const isHighVal = selVal !== 0 && cell.value === selVal && !isSel;
            const boxRow = Math.floor(r / 2) * 2;
            const boxCol = Math.floor(c / 3) * 3;
            const isBox = selRow >= 0 && Math.floor(selRow / 2) * 2 === boxRow && Math.floor(selCol / 3) * 3 === boxCol;
            const bg = isSel
              ? "var(--accent)"
              : isHighVal
              ? "rgba(58,74,102,0.18)"
              : isHighRow || isBox
              ? "var(--surface-2)"
              : "var(--surface)";
            const textColor = isSel
              ? "#fff"
              : cell.error
              ? "var(--error)"
              : cell.given
              ? "var(--given)"
              : "var(--player)";
            return (
              <button
                key={c}
                onClick={() => onSelect(r, c)}
                className="flex items-center justify-center font-bold text-base select-none aspect-square"
                style={{
                  width: "16.667%",
                  background: bg,
                  color: textColor,
                  borderRight: c === 2 ? "2.5px solid var(--box-border)" : c < 5 ? "1px solid var(--border)" : "none",
                  borderBottom: r === 1 || r === 3 ? "2.5px solid var(--box-border)" : r < 5 ? "1px solid var(--border)" : "none",
                  transition: "background 0.08s",
                }}
              >
                {cell.value !== 0 ? cell.value : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChallengePage(): React.JSX.Element {
  const params = useParams();
  const id = params?.id as string;

  const profile = useAuthStore((s) => s.profile);
  const { loadPuzzle, game, dispatch: gameDispatch } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<ChallengeRecord | null>(null);
  const [attempts, setAttempts] = useState<ChallengeAttempt[]>([]);
  const [status, setStatus] = useState<"playing" | "won">("playing");
  const [elapsed, setElapsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mini-specific state (only used when variant === "mini")
  const [miniBoard, setMiniBoard] = useState<MCell[][]>([]);
  const [miniSelected, setMiniSelected] = useState<[number, number] | null>(null);

  const isMini = challenge?.variant === "mini";

  // ── Load challenge ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    getChallenge(id)
      .then(({ challenge: ch, attempts: att }) => {
        setChallenge(ch);
        setAttempts(att);

        if (ch.variant === "mini") {
          setMiniBoard(parseMiniBoard(ch.puzzle_clues));
        } else {
          // Classic/killer/samurai: use gameStore
          loadPuzzle({
            id: ch.puzzle_id,
            clues: ch.puzzle_clues,
            solution: ch.puzzle_solution,
            difficulty: ch.difficulty as never,
            variant: ch.variant as never,
            killerCages: ch.killer_cages as never,
          });
        }
        setLoading(false);
      })
      .catch((e: unknown) => {
        setLoadError(e instanceof Error ? e.message : "Ukjent feil");
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Timer ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "playing" || loading) return;
    tickRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [status, loading]);

  // ── Win detection (classic) ─────────────────────────────────────────────
  useEffect(() => {
    if (!isMini && game?.status === "won" && status === "playing") {
      setStatus("won");
      handleWin(game.elapsed, game.mistakes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status]);

  // ── Win handler ─────────────────────────────────────────────────────────
  const handleWin = useCallback(async (timeSec: number, err: number) => {
    if (tickRef.current) clearInterval(tickRef.current);
    setStatus("won");
    if (!profile?.userId || !challenge) return;
    try {
      await submitChallengeAttempt(challenge.id, profile.userId, timeSec, err);
      const { attempts: fresh } = await getChallenge(challenge.id);
      setAttempts(fresh);
    } catch {
      // Non-critical: don't block the win experience
    }
  }, [profile?.userId, challenge]);

  // ── Mini input ──────────────────────────────────────────────────────────
  const handleMiniNumber = useCallback((val: number) => {
    if (!miniSelected || status !== "playing") return;
    const [r, c] = miniSelected;
    const board = miniBoard;
    if (board[r][c].given) return;
    const v = (val >= 1 && val <= 6 ? val : 0) as Val;
    const next = board.map((row) => row.map((cell) => ({ ...cell, notes: new Set<Val>(cell.notes) })));
    next[r][c].value = next[r][c].value === v ? 0 : v;

    // Validate all non-given cells
    for (let gr = 0; gr < 6; gr++) {
      for (let gc = 0; gc < 6; gc++) {
        if (!next[gr][gc].given) {
          next[gr][gc].error = !isMiniCellValid(next, gr, gc);
        }
      }
    }
    setMiniBoard(next);

    const solution = challenge?.puzzle_solution ?? "";
    const filled = next.flat().every((cell) => cell.value !== 0);
    const correct = next.flat().every((cell, i) => String(cell.value) === solution[i]);
    if (filled && correct) {
      void handleWin(elapsed, mistakes);
    } else if (filled && !correct) {
      setMistakes((m) => m + 1);
    }
  }, [miniSelected, miniBoard, status, challenge?.puzzle_solution, elapsed, mistakes, handleWin]);

  const handleMiniErase = useCallback(() => {
    if (!miniSelected) return;
    const [r, c] = miniSelected;
    if (miniBoard[r][c].given) return;
    const next = miniBoard.map((row) => row.map((cell) => ({ ...cell, notes: new Set<Val>(cell.notes) })));
    next[r][c].value = 0;
    next[r][c].error = false;
    setMiniBoard(next);
  }, [miniSelected, miniBoard]);

  // ── Keyboard (mini) ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMini) return;
    function onKey(e: KeyboardEvent) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 6) handleMiniNumber(n);
      if (e.key === "Backspace" || e.key === "Delete") handleMiniErase();
      if (!miniSelected) return;
      const [r, c] = miniSelected;
      if (e.key === "ArrowUp") setMiniSelected([Math.max(0, r - 1), c]);
      if (e.key === "ArrowDown") setMiniSelected([Math.min(5, r + 1), c]);
      if (e.key === "ArrowLeft") setMiniSelected([r, Math.max(0, c - 1)]);
      if (e.key === "ArrowRight") setMiniSelected([r, Math.min(5, c + 1)]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMini, handleMiniNumber, handleMiniErase, miniSelected]);

  // ── Classic keyboard ────────────────────────────────────────────────────
  useEffect(() => {
    if (isMini) return;
    function onKey(e: KeyboardEvent) {
      const n = parseInt(e.key, 10) as CellValue;
      if (n >= 1 && n <= 9) gameDispatch({ type: "INPUT_VALUE", value: n });
      if (e.key === "Backspace" || e.key === "Delete") gameDispatch({ type: "ERASE" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMini, gameDispatch]);

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (loadError || !challenge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-bold" style={{ color: "var(--text)" }}>Utfordringen ble ikke funnet.</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{loadError}</p>
        <Link href="/" className="text-sm font-bold" style={{ color: "var(--accent)" }}>← Hjem</Link>
      </div>
    );
  }

  const creatorName = challenge.creator_username ?? "Anonym";

  return (
    <main className="min-h-screen flex flex-col items-center gap-5 px-4 py-6">
      <div className="flex flex-col gap-5 w-full" style={{ maxWidth: 420 }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
            ← Hjem
          </Link>
          <span className="text-sm tabular-nums font-bold" style={{ color: "var(--text-muted)" }}>
            {fmt(elapsed)}
          </span>
        </div>

        {/* Challenge banner */}
        <div className="rounded-2xl px-4 py-4 flex items-center gap-3"
          style={{ background: "var(--surface)", border: "1.5px solid var(--border-2)" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${challenge.creator_color}, ${challenge.creator_color}bb)`, color: "#fff" }}>
            {creatorName[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold" style={{ color: "var(--text)" }}>
              {creatorName} utfordrer deg!
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Slå {fmt(challenge.creator_time_seconds)}
            </p>
          </div>
          {"🏆"}
        </div>

        {/* Board */}
        {isMini ? (
          <MiniBoardView board={miniBoard} selected={miniSelected} onSelect={(r, c) => setMiniSelected([r, c])} />
        ) : (
          game && (
            <SudokuBoard
              board={game.board}
              selectedCell={game.selectedCell}
              onCellClick={(r, c) => gameDispatch({ type: "SELECT_CELL", row: r, col: c })}
            />
          )
        )}

        {/* Number pad */}
        {isMini ? (
          <div className="flex items-center justify-center gap-2">
            {([1, 2, 3, 4, 5, 6] as const).map((n) => (
              <motion.button
                key={n}
                onClick={() => handleMiniNumber(n)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                className="flex-1 h-12 rounded-xl text-lg font-black"
                style={{ background: "var(--surface)", border: "1.5px solid var(--border-2)", color: "var(--text)" }}
              >
                {n}
              </motion.button>
            ))}
            <motion.button
              onClick={handleMiniErase}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              className="h-12 px-3 rounded-xl text-xs font-bold"
              style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1.5px solid var(--border-2)" }}
            >
              ⌫
            </motion.button>
          </div>
        ) : (
          game && (
            <NumberPad
              onNumber={(n) => gameDispatch({ type: "INPUT_VALUE", value: n as CellValue })}
              onErase={() => gameDispatch({ type: "ERASE" })}
              onNote={() => gameDispatch({ type: "TOGGLE_NOTE_MODE" })}
              onHint={() => { /* no hints in challenges */ }}
              noteMode={game.noteMode}
            />
          )
        )}

        {/* Existing attempts */}
        {attempts.length > 0 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1.5px solid var(--border-2)" }}>
            <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest"
              style={{ color: "var(--text-dim)", borderBottom: "1px solid var(--border-2)", background: "var(--surface-2)" }}>
              Ledertavle
            </p>
            {attempts.slice(0, 5).map((a, i) => (
              <ScoreRow
                key={a.id}
                rank={i + 1}
                username={a.username}
                color={a.color}
                timeSecs={a.time_seconds}
                mistakes={a.mistakes}
                isCreator={a.user_id === challenge.created_by}
                isYou={a.user_id === (profile?.userId ?? "")}
              />
            ))}
          </div>
        )}

      </div>

      <AnimatePresence>
        {status === "won" && (
          <ChallengeWinOverlay
            timeSecs={elapsed}
            mistakes={mistakes}
            challenge={challenge}
            attempts={attempts}
            userId={profile?.userId ?? ""}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
