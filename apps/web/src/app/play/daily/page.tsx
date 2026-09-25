"use client";

import { Suspense, useEffect, useState } from "react";
import type React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import type { DailyResult } from "@sudoku-2026/core";
import {
  analyzeGame,
  cellOutcomes,
  createDailyPuzzle,
  createEmptyStreak,
  dailyDifficulty,
  levelName,
  recordCompletion,
  todayString,
} from "@sudoku-2026/core";
import { useGameStore } from "@/store/gameStore";
import { useAuthStore } from "@/store/authStore";
import { useDailyStore, type StoredDaily } from "@/store/dailyStore";
import { useHydrated } from "@/lib/useHydrated";
import { formatClock } from "@/lib/dailyFormat";
import GameShell from "@/components/game/GameShell";
import AnalysisLauncher from "@/components/analysis/AnalysisLauncher";
import ResultCard from "@/components/daily/ResultCard";
import ShareActions from "@/components/daily/ShareActions";
import NextDailyCountdown from "@/components/daily/NextDailyCountdown";
import WeekStrip from "@/components/daily/WeekStrip";
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

/** `?date=YYYY-MM-DD` opens an earlier daily (archive); anything else means today. */
function useDailyDate(): { date: string; today: string; isToday: boolean } {
  const params = useSearchParams();
  const today = todayString();
  const requested = params.get("date");
  const date = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested < today ? requested : today;
  return { date, today, isToday: date === today };
}

export default function DailyPage(): React.ReactElement {
  return (
    <Suspense fallback={null}>
      <DailyGame />
    </Suspense>
  );
}

function DailyGame(): React.ReactElement {
  const { date, isToday } = useDailyDate();
  const { game, loadPuzzle } = useGameStore();
  const stored = useDailyStore((s) => s.results[date]);
  const record = useDailyStore((s) => s.record);
  const username = useAuthStore((s) => s.profile?.username ?? null);
  const hydrated = useHydrated();
  const [streak, setStreak] = useState(0);
  const [replay, setReplay] = useState(false);
  /** The completion this visit produced, and whether it was the first (official) one. */
  const [finished, setFinished] = useState<{ official: boolean; elapsed: number } | null>(null);

  useEffect(() => {
    const puzzle = createDailyPuzzle(date);
    // Live store, not the hydration snapshot — otherwise today's progress resets on reload.
    if (useGameStore.getState().game?.puzzle.id !== puzzle.id) loadPuzzle(puzzle);
    setStreak(loadStreak("local").currentStreak);
    setReplay(false);
    setFinished(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // On a win: bump the streak (today only) and store the first completion as the official result.
  useEffect(() => {
    if (!game || game.status !== "won" || game.puzzle.date !== date) return;
    const already = useDailyStore.getState().results[date];
    if (already) {
      // A replay finishing now. (Reloading an already-recorded win just shows the result view.)
      if (replay) setFinished((f) => f ?? { official: false, elapsed: game.elapsed });
      return;
    }
    let currentStreak = 0;
    if (isToday) {
      const updated = recordCompletion(loadStreak("local"), date);
      saveStreak(updated);
      currentStreak = updated.currentStreak;
      setStreak(currentStreak);
    }
    const analysis = analyzeGame({
      clues: game.puzzle.clues,
      moves: game.moves,
      elapsed: game.elapsed,
      mistakes: game.mistakes,
      hintsUsed: game.hintsUsed,
    });
    const result: DailyResult = {
      date,
      level: dailyDifficulty(date),
      elapsed: game.elapsed,
      mistakes: game.mistakes,
      hintsUsed: game.hintsUsed,
      streak: currentStreak,
      titleId: analysis.title.id,
      cells: cellOutcomes(game.puzzle.clues, game.moves),
      ...(username ? { name: username } : {}),
    };
    record(result);
    setFinished({ official: true, elapsed: game.elapsed });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status, game?.puzzle.id, date, replay]);

  const level = levelName(dailyDifficulty(date));
  const [, mo, d] = date.split("-");
  const title = isToday ? `Daglig · ${level}` : `Daglig ${d}.${mo} · ${level}`;

  // Already solved (and not playing it again): show the result instead of a board.
  const playingThisDaily = game?.puzzle.date === date && game.status !== "won";
  if (hydrated && stored && !replay && !finished && !(playingThisDaily && game.moves?.length)) {
    return <DailyDone stored={stored} isToday={isToday} onReplay={() => {
      loadPuzzle(createDailyPuzzle(date));
      setReplay(true);
    }} />;
  }

  const streakBanner =
    isToday && streak > 0 ? (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 rounded-full px-4 py-1.5"
        style={{ background: "rgba(58,107,115,0.10)", border: "1px solid rgba(58,107,115,0.30)" }}
      >
        <span className="text-base">🔥</span>
        <span className="text-sm font-bold" style={{ color: "#3a6b73" }}>{streak} dager på rad!</span>
      </motion.div>
    ) : !isToday ? (
      <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
        Arkivbrett — teller ikke på streaken.
      </p>
    ) : null;

  return (
    <GameShell
      title={title}
      aboveHeader={streakBanner}
      overlay={
        game?.status === "won" && game.puzzle.date === date && stored && finished ? (
          <DailyWinOverlay stored={stored} official={finished.official} elapsed={finished.elapsed} isToday={isToday} />
        ) : null
      }
    />
  );
}

function DailyDone({ stored, isToday, onReplay }: { stored: StoredDaily; isToday: boolean; onReplay: () => void }) {
  return (
    <main className="min-h-screen flex flex-col items-center gap-5 px-4 py-6">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <Link href="/" className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          ← Hjem
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text)" }}>
            {isToday ? "Dagens brett er løst" : "Du har løst dette brettet"}
          </h1>
          {isToday && <NextDailyCountdown className="text-sm mt-1" />}
        </div>
        <ResultCard result={stored.result} />
        <ShareActions stored={stored} />
        <AnalysisLauncher />
        <section className="flex flex-col gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--text-dim)" }}>
            Denne uken
          </h2>
          <WeekStrip />
        </section>
        <button
          onClick={onReplay}
          className="text-xs font-bold uppercase tracking-widest cursor-pointer"
          style={{ color: "var(--text-muted)" }}
        >
          Spill brettet igjen (teller ikke)
        </button>
      </div>
    </main>
  );
}

function DailyWinOverlay({
  stored,
  official,
  elapsed,
  isToday,
}: {
  stored: StoredDaily;
  official: boolean;
  elapsed: number;
  isToday: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 overflow-y-auto py-6"
      style={{ background: "rgba(35,34,40,0.35)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="rounded-3xl max-w-sm w-full mx-4 flex flex-col gap-4 p-5"
        style={{ background: "var(--surface)", boxShadow: "0 24px 80px rgba(44,58,79,0.28)" }}
      >
        <div className="text-center">
          <h2 className="text-2xl font-black" style={{ color: "var(--text)" }}>
            {isToday ? "Dagens brett løst!" : "Arkivbrett løst!"}
          </h2>
          {isToday && <NextDailyCountdown className="text-xs mt-1" />}
          {!official && (
            <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
              Omspill på {formatClock(elapsed)} teller ikke — kortet viser første løsning.
            </p>
          )}
        </div>
        <ResultCard result={stored.result} />
        <ShareActions stored={stored} />
        <DailyChallenge elapsed={stored.result.elapsed} />
        <AnalysisLauncher />
        {isToday && <WeekStrip />}
        <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
          <Link href="/" style={{ color: "var(--text-dim)" }}>
            Meny
          </Link>
          <Link href="/stats" style={{ color: "var(--text-dim)" }}>
            Statistikk →
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Supabase-backed challenge (renders nothing without a backend). */
function DailyChallenge({ elapsed }: { elapsed: number }) {
  const puzzle = useGameStore((s) => s.game?.puzzle ?? null);
  if (!puzzle) return null;
  return <ChallengeButton puzzle={puzzle} elapsed={elapsed} />;
}
