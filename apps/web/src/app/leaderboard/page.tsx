"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import type { Difficulty } from "@sudoku-2026/core";
import Link from "next/link";

const LABELS: Record<Difficulty, string> = {
  easy: "Enkel", medium: "Middels", hard: "Vanskelig", extreme: "Ekstrem", daily: "Daglig", mini: "Mini 6×6",
};
const ACCENTS: Record<Difficulty, string> = {
  easy: "#5f8a6a", medium: "#bf9c45", hard: "#b4554a", extreme: "#3a4a66", daily: "#3a6b73", mini: "#6f9a78",
};
const ORDER: Difficulty[] = ["easy", "medium", "hard", "extreme", "daily", "mini"];

function fmt(secs: number | null): string {
  if (secs === null) return "–";
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function fmtTotal(secs: number): string {
  if (secs === 0) return "–";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}t ${m}m`;
  if (m > 0) return `${m}m ${secs % 60}s`;
  return `${secs}s`;
}

function pct(won: number, played: number): string {
  if (played === 0) return "–";
  return Math.round((won / played) * 100) + "%";
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const row = {
  hidden: { opacity: 0, x: -12 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
};

export default function LeaderboardPage(): React.ReactElement {
  const stats = useGameStore((s) => s.stats);

  // Sort difficulties by best time (played first, null last)
  const sorted = [...ORDER].sort((a, b) => {
    const ta = stats.byDifficulty[a].bestTime;
    const tb = stats.byDifficulty[b].bestTime;
    if (ta === null && tb === null) return ORDER.indexOf(a) - ORDER.indexOf(b);
    if (ta === null) return 1;
    if (tb === null) return -1;
    return ta - tb;
  });

  // Medal for top 3 by best time (only if actually played)
  const medals = ["🥇", "🥈", "🥉"];

  const totalPlayed = ORDER.reduce((a, d) => a + stats.byDifficulty[d].played, 0);

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
              background: "linear-gradient(120deg, #3a4a66 0%, #2c3a4f 55%, #3a6b73 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}
          >
            Mine rekorder
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {totalPlayed > 0 ? `${totalPlayed} spill fullført` : "Ingen spill fullført ennå – start spilling!"}
          </p>
        </div>

        {/* Per-difficulty records */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="rounded-2xl overflow-hidden"
          style={{ border: "1.5px solid var(--border-2)", boxShadow: "var(--shadow)" }}
        >
          {/* Header */}
          <div
            className="grid grid-cols-4 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "var(--surface-2)", color: "var(--text-dim)", borderBottom: "1px solid var(--border-2)" }}
          >
            <span>Nivå</span>
            <span className="text-center">Spill</span>
            <span className="text-center">Vunnet</span>
            <span className="text-center">Beste tid</span>
          </div>

          {sorted.map((d, idx) => {
            const ds = stats.byDifficulty[d];
            const accent = ACCENTS[d];
            const hasMedal = ds.bestTime !== null && idx < 3;
            return (
              <motion.div
                key={d}
                variants={row}
                className="grid grid-cols-4 px-4 py-3.5 items-center"
                style={{
                  background: "var(--surface)",
                  borderBottom: "1px solid var(--border)",
                  borderLeft: `3px solid ${accent}`,
                }}
              >
                <div className="flex items-center gap-2">
                  {hasMedal && <span className="text-base leading-none">{medals[idx]}</span>}
                  <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    {LABELS[d]}
                  </span>
                </div>
                <span className="text-center text-sm font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {ds.played || "–"}
                </span>
                <span className="text-center text-sm font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {pct(ds.won, ds.played)}
                </span>
                <span className="text-center text-sm font-black tabular-nums" style={{ color: ds.bestTime ? accent : "var(--text-dim)" }}>
                  {fmt(ds.bestTime)}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Total time summary */}
        {totalPlayed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)" }}
          >
            <span className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>Total tid spilt</span>
            <span className="text-lg font-black tabular-nums" style={{ color: "var(--accent)" }}>
              {fmtTotal(ORDER.reduce((a, d) => a + stats.byDifficulty[d].totalTime, 0))}
            </span>
          </motion.div>
        )}

        {/* Empty state */}
        {totalPlayed === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
            style={{ color: "var(--text-dim)" }}
          >
            <div className="text-4xl mb-3">🎮</div>
            <p className="text-sm font-semibold">Ingen rekorder ennå</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>Fullfør et spill for å se rekordene dine her</p>
            <Link
              href="/"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Start spilling
            </Link>
          </motion.div>
        )}
      </div>
    </main>
  );
}
