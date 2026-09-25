"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Replay } from "@sudoku-2026/core";
import { decodeReplay, formatClock, ghostTimeline, levelName, puzzleFromRef } from "@sudoku-2026/core";
import { useGameStore } from "@/store/gameStore";
import { duelPuzzleId, useOwnReplayCode } from "@/lib/replayLink";
import { useHydrated } from "@/lib/useHydrated";
import GameShell from "@/components/game/GameShell";
import GhostBar from "@/components/duel/GhostBar";
import DuelInviteButton from "@/components/duel/DuelInviteButton";
import AnalysisLauncher from "@/components/analysis/AnalysisLauncher";

export default function DuelGame({ code }: { code: string }): React.ReactElement {
  const replay = useMemo(() => decodeReplay(code), [code]);
  const puzzle = useMemo(() => (replay ? puzzleFromRef(replay.puzzle, duelPuzzleId(code)) : null), [replay, code]);
  const timeline = useMemo(
    () => (replay && puzzle ? ghostTimeline(replay, puzzle.clues, puzzle.solution) : null),
    [replay, puzzle]
  );
  const { game, loadPuzzle } = useGameStore();
  const hydrated = useHydrated();
  const [started, setStarted] = useState(false);

  // Reloading mid-duel resumes it (the store already holds this duel's game).
  useEffect(() => {
    if (puzzle && useGameStore.getState().game?.puzzle.id === puzzle.id) setStarted(true);
  }, [puzzle]);

  if (!replay || !puzzle || !timeline) return <Invalid reason="Lenken er ugyldig eller ufullstendig." />;
  if (!timeline.complete) return <Invalid reason="Dette partiet ble ikke fullført, så det kan ikke brukes som spøkelse." />;
  if (!hydrated) return <main className="min-h-screen" />;

  const ghostName = replay.name ?? "Spøkelset";
  const level = puzzle.rating ? levelName(puzzle.rating.label) : "";

  if (!started || game?.puzzle.id !== puzzle.id) {
    return (
      <Intro
        ghostName={ghostName}
        level={level}
        ghostElapsed={replay.elapsed}
        code={code}
        onStart={() => {
          loadPuzzle(puzzle);
          setStarted(true);
        }}
      />
    );
  }

  const yourFilled = game.board.flat().filter((c) => !c.given && c.value !== 0 && !c.error).length;

  return (
    <GameShell
      title={`Duell · ${level}`}
      aboveHeader={
        <GhostBar
          timeline={timeline}
          ghostName={ghostName}
          ghostElapsed={replay.elapsed}
          elapsed={game.elapsed}
          yourFilled={yourFilled}
        />
      }
      overlay={
        game.status === "won" ? (
          <DuelResult
            replay={replay}
            ghostName={ghostName}
            ghostMistakes={replay.moves.filter((m) => Number(puzzle.solution[m.cell]) !== m.value).length}
            code={code}
            you={{ elapsed: game.elapsed, mistakes: game.mistakes, hints: game.hintsUsed }}
          />
        ) : null
      }
    />
  );
}

function Intro({
  ghostName,
  level,
  ghostElapsed,
  code,
  onStart,
}: {
  ghostName: string;
  level: string;
  ghostElapsed: number;
  code: string;
  onStart: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-6 text-center">
        <div className="text-6xl" aria-hidden="true">👻</div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--accent-2)" }}>
            Duell · {level}
          </p>
          <h1 className="text-3xl font-black tracking-tight mt-2" style={{ color: "var(--text)" }}>
            {ghostName} utfordrer deg
          </h1>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Samme brett. Spøkelset fyller ruter i samme tempo som {ghostName === "Spøkelset" ? "originalen" : ghostName} gjorde —
            du ser fremdriften per boks, men aldri sifrene.
          </p>
        </div>
        <div className="rounded-2xl py-4" style={{ background: "var(--surface)", border: "1.5px solid var(--border-2)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
            Tid å slå
          </p>
          <p className="text-4xl font-black tabular-nums" style={{ color: "var(--accent)" }}>
            {formatClock(ghostElapsed)}
          </p>
        </div>
        <motion.button
          onClick={onStart}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest cursor-pointer"
          style={{ background: "var(--gradient-brand)", color: "#fff", boxShadow: "0 4px 20px rgba(58,74,102,0.3)" }}
        >
          Start duellen
        </motion.button>
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
          Dueller teller ikke på streak eller daglig resultat.{" "}
          <Link href={`/replay/${code}`} className="underline">
            Se replayen i stedet
          </Link>
        </p>
      </div>
    </main>
  );
}

function DuelResult({
  replay,
  ghostName,
  ghostMistakes,
  code,
  you,
}: {
  replay: Replay;
  ghostName: string;
  ghostMistakes: number;
  code: string;
  you: { elapsed: number; mistakes: number; hints: number };
}) {
  const myCode = useOwnReplayCode();
  const diff = you.elapsed - replay.elapsed;
  const won = diff < 0;
  const ghostHints = new Set(replay.moves.filter((m) => m.hint).map((m) => m.cell)).size;
  const headline = won ? "Du vant duellen!" : diff === 0 ? "Uavgjort!" : `${ghostName} vant`;
  const margin = diff === 0 ? "På sekundet likt." : `${won ? "Du" : ghostName} var ${formatClock(Math.abs(diff))} raskere.`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto py-6 backdrop-blur-sm"
      style={{ background: "rgba(35,34,40,0.35)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="rounded-3xl max-w-sm w-full mx-4 p-6 flex flex-col gap-5"
        style={{ background: "var(--surface)", boxShadow: "0 24px 80px rgba(44,58,79,0.28)" }}
      >
        <div className="text-center">
          <div className="text-5xl" aria-hidden="true">{won ? "🏆" : diff === 0 ? "🤝" : "👻"}</div>
          <h2 className="text-2xl font-black mt-2" style={{ color: "var(--text)" }}>{headline}</h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{margin}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Side label="Du" time={you.elapsed} mistakes={you.mistakes} hints={you.hints} highlight={won} />
          <Side label={ghostName} time={replay.elapsed} mistakes={ghostMistakes} hints={ghostHints} highlight={!won && diff !== 0} />
        </div>
        {myCode && <DuelInviteButton label={won ? "Send revansj-lenke" : "Send ditt spøkelse tilbake"} />}
        <AnalysisLauncher />
        <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
          <Link href={`/replay/${code}`} style={{ color: "var(--text-dim)" }}>
            {ghostName}s replay
          </Link>
          {myCode && (
            <Link href={`/replay/${myCode}`} style={{ color: "var(--text-dim)" }}>
              Din replay →
            </Link>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Side({ label, time, mistakes, hints, highlight }: { label: string; time: number; mistakes: number; hints: number; highlight: boolean }) {
  return (
    <div
      className="rounded-2xl p-3 flex flex-col gap-0.5"
      style={{
        background: highlight ? "var(--accent-2-light)" : "var(--surface-2)",
        border: `1.5px solid ${highlight ? "rgba(191,156,69,0.5)" : "var(--border)"}`,
      }}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest truncate" style={{ color: "var(--text-dim)" }}>{label}</span>
      <span className="text-2xl font-black tabular-nums" style={{ color: "var(--text)" }}>{formatClock(time)}</span>
      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        {mistakes} feil · {hints} hint
      </span>
    </div>
  );
}

function Invalid({ reason }: { reason: string }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl" aria-hidden="true">👻</p>
      <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Fant ikke duellen</h1>
      <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>{reason}</p>
      <Link href="/" className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
        Til forsiden →
      </Link>
    </main>
  );
}
