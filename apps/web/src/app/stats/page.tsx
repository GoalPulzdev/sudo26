"use client";

import { useEffect, useRef } from "react";
import type React from "react";
import { useGameStore } from "@/store/gameStore";
import type { Difficulty } from "@sudoku-2026/core";
import Link from "next/link";
import { motion } from "framer-motion";

function IconFlame() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 14c0 2.485 1.567 4 3.5 4s3.5-1.515 3.5-4c0-4-3.5-6-3.5-6S8.5 10 8.5 14z"/>
      <path d="M12 22c4.418 0 8-3.582 8-8 0-3.5-2-7-5-9 0 0 1 4-3 6-1.5 1-3 .5-3 .5S7 9 4.5 11C3 12.5 2 14 2 15.5A6.5 6.5 0 0 0 12 22z"/>
    </svg>
  );
}

const LABELS: Record<Difficulty, string> = {
  easy: "Enkel", medium: "Middels", hard: "Vanskelig", extreme: "Ekstrem", daily: "Daglig", mini: "Mini 6×6",
};

const DIFFICULTY_ACCENT: Record<Difficulty, string> = {
  easy: "#059669", medium: "#d97706", hard: "#dc2626", extreme: "#7c3aed", daily: "#0891b2", mini: "#10b981",
};

function fmt(secs: number | null): string {
  if (secs === null) return "–";
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function pct(won: number, played: number): string {
  if (played === 0) return "–";
  return Math.round((won / played) * 100) + "%";
}

function useCountUp(target: number, duration = 900): number {
  const ref = useRef(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const [, forceUpdate] = require("react").useState(0);

  useEffect(() => {
    const startVal = ref.current;
    const startTime = performance.now();
    startRef.current = startTime;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      ref.current = Math.round(startVal + (target - startVal) * ease);
      forceUpdate((n: number) => n + 1);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return ref.current;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const row = {
  hidden: { opacity: 0, x: -12 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16,1,0.3,1] as [number,number,number,number] } },
};

export default function StatsPage() {
  const stats = useGameStore((s) => s.stats);
  const levels: Difficulty[] = ["easy", "medium", "hard", "extreme", "daily", "mini"];

  const totalPlayed  = levels.reduce((a, d) => a + stats.byDifficulty[d].played, 0);
  const totalWon     = levels.reduce((a, d) => a + stats.byDifficulty[d].won,    0);
  const totalTimeSec = levels.reduce((a, d) => a + stats.byDifficulty[d].totalTime, 0);
  const winPct       = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;

  const animStreak  = useCountUp(stats.currentStreak);
  const animBest    = useCountUp(stats.bestStreak);
  const animWinPct  = useCountUp(winPct);

  function fmtTotal(s: number): string {
    if (s === 0) return "0";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}t ${m}m`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
  }

  return (
    <main className="min-h-screen flex flex-col items-center gap-8 px-4 py-10">
      {/* Back */}
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)"; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Hjem
        </Link>
      </div>

      <div className="w-full max-w-lg flex flex-col gap-7">
        {/* Heading */}
        <div>
          <h1
            className="text-4xl font-black tracking-tight"
            style={{
              background: "linear-gradient(120deg, #7c3aed 0%, #4f46e5 55%, #0891b2 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}
          >
            Statistikk
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {totalPlayed} spill — {totalWon} seire
          </p>
        </div>

        {/* Big stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <BigStat label="Streak"  value={animStreak} unit="" suffix=" dager" accent="#d97706" icon={<IconFlame />} />
          <BigStat label="Beste"   value={animBest}   unit="" suffix=" dager" accent="#0891b2" />
          <BigStat label="Vunnet"  value={animWinPct} unit="" suffix="%"      accent="#059669" note={`${totalWon}/${totalPlayed}`} />
          <BigStatText label="Totaltid" value={fmtTotal(totalTimeSec)} accent="#7c3aed" />
        </div>

        {/* Per-difficulty table */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="rounded-2xl overflow-hidden"
          style={{ border: "1.5px solid var(--border-2)", boxShadow: "var(--shadow)" }}
        >
          {/* Header */}
          <div
            className="grid grid-cols-5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-dim)",
              borderBottom: "1px solid var(--border-2)",
            }}
          >
            <span>Nivå</span>
            <span className="text-center">Spill</span>
            <span className="text-center">Vunnet</span>
            <span className="text-center">Best tid</span>
            <span className="text-center">Tot. tid</span>
          </div>

          {levels.map((d) => {
            const ds = stats.byDifficulty[d];
            const accent = DIFFICULTY_ACCENT[d];
            return (
              <motion.div
                key={d}
                variants={row}
                className="grid grid-cols-5 px-4 py-3.5 items-center transition-colors duration-100"
                style={{
                  background: "var(--surface)",
                  borderBottom: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--surface-2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--surface)"; }}
              >
                {/* Level name with colour dot */}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accent }} />
                  <span className="font-bold text-sm" style={{ color: "var(--text)" }}>{LABELS[d]}</span>
                </div>
                <span className="text-center font-mono text-sm" style={{ color: "var(--text-muted)" }}>
                  {ds.played || "–"}
                </span>
                <span className="text-center font-mono font-bold text-sm" style={{ color: ds.won > 0 ? "#059669" : "var(--text-dim)" }}>
                  {pct(ds.won, ds.played)}
                </span>
                <span className="text-center font-mono text-sm font-bold" style={{ color: accent }}>
                  {fmt(ds.bestTime)}
                </span>
                <span className="text-center font-mono text-sm" style={{ color: "var(--text-muted)" }}>
                  {fmtTotal(ds.totalTime)}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <Link
          href="/play/classic"
          className="w-full py-4 rounded-2xl text-center font-black text-sm tracking-wide"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "#fff",
            boxShadow: "0 4px 20px rgba(124,58,237,0.32), 0 2px 0 rgba(79,70,229,0.5)",
          }}
        >
          Spill nå →
        </Link>
      </div>
    </main>
  );
}

function BigStat({
  label, value, unit, suffix, accent, note, icon,
}: {
  label: string; value: number; unit?: string; suffix?: string; accent: string; note?: string; icon?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col items-center gap-1 text-center relative overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1.5px solid var(--border-2)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Colour top bar */}
      <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: accent }} />
      {icon && (
        <span className="mt-1" style={{ color: accent }}>{icon}</span>
      )}
      <span className="text-3xl font-black tabular-nums" style={{ color: accent }}>
        {value}{suffix ?? ""}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
        {label}
      </span>
      {unit && (
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{unit}</span>
      )}
      {note && (
        <span className="text-[10px] font-mono" style={{ color: "var(--text-dim)" }}>{note}</span>
      )}
    </div>
  );
}

function BigStatText({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col items-center gap-1 text-center relative overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1.5px solid var(--border-2)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: accent }} />
      <span className="text-3xl font-black tabular-nums mt-1" style={{ color: accent }}>
        {value}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
        {label}
      </span>
    </div>
  );
}