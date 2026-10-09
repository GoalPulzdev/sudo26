"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Hint } from "@sudoku-2026/core";
import { Rich } from "@/lib/rich";

interface GameHeaderProps {
  elapsed: number;
  mistakes: number;
  hintsUsed: number;
  isPlaying: boolean;
  canPause?: boolean;
  /** Legacy hint banner (pages not on GameShell). GameShell uses the coach panel instead. */
  hint?: Hint | null;
  onDismissHint?: () => void;
  onPause: () => void;
  title: string;
  filledCount: number;
  totalCells: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function IconPause() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1"/>
      <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/>
    </svg>
  );
}

export default function GameHeader({
  elapsed,
  mistakes,
  hintsUsed,
  isPlaying,
  canPause = true,
  hint,
  onDismissHint,
  onPause,
  title,
  filledCount,
  totalCells,
}: GameHeaderProps): React.ReactElement {
  const pct = totalCells > 0 ? Math.round((filledCount / totalCells) * 100) : 0;

  return (
    <div className="obsidian-hud flex flex-col gap-2" style={{ width: "min(92vw, 480px)" }}>
      {/* HUD stats bar */}
      <div
        className="obsidian-hud-main flex items-center justify-between px-4 py-3 rounded-2xl"
        style={{
          background: "var(--surface)",
          border: "1.5px solid var(--border-2)",
          boxShadow: "var(--shadow)",
        }}
      >
        <h2 className="obsidian-hud-title text-sm font-bold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
          {title}
        </h2>
        <div className="flex items-center gap-3">
          <Stat label="TID"  value={formatTime(elapsed)} color="var(--accent)"                                  large />
          <Div />
          <Stat label="FEIL" value={String(mistakes)}    color={mistakes > 0 ? "var(--error)" : "var(--text-dim)"} />
          <Div />
          <Stat label="HINT" value={String(hintsUsed)}   color="#bf9c45" />
          <Div />
          <button
            onClick={onPause}
            disabled={!canPause}
            aria-label={!canPause ? "Spillet er fullført" : isPlaying ? "Pause" : "Fortsett"}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       transition-all duration-150 cursor-pointer focus:outline-none"
            style={{
              background: isPlaying ? "rgba(58,74,102,0.10)" : "rgba(111,154,120,0.10)",
              color: isPlaying ? "var(--accent)" : "#5f8a6a",
              border: isPlaying ? "1.5px solid rgba(58,74,102,0.30)" : "1.5px solid rgba(111,154,120,0.30)",
            }}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="obsidian-hud-progress w-full rounded-full overflow-hidden"
        role="progressbar"
        aria-label="Brett fullført"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        style={{ height: "5px", background: "var(--border)" }}
        title={`${pct}% fullfort`}
      >
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: pct === 100
              ? "linear-gradient(90deg, #5f8a6a, #8fb89a)"
              : "linear-gradient(90deg, #3a4a66, #2c3a4f)",
          }}
        />
      </div>

      {/* Hint banner */}
      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="rounded-2xl px-4 py-3 overflow-hidden"
            style={{
              background: "rgba(224,200,115,0.08)",
              border: "1.5px solid rgba(191,156,69,0.28)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "#bf9c45" }}>
                  Hint
                  <span className="font-medium normal-case ml-1 opacity-70">
                    · {hint.strategy.replace(/_/g, " ")}
                  </span>
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                  <Rich text={hint.explanation} strongColor="var(--obsidian-gold, #bf9c45)" />
                </p>
              </div>
              <button
                onClick={onDismissHint}
                aria-label="Lukk hint"
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg
                           opacity-50 hover:opacity-100 transition-opacity cursor-pointer focus:outline-none"
                style={{ color: "var(--text)", background: "rgba(0,0,0,0.06)" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, color, large }: { label: string; value: string; color: string; large?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>{label}</span>
      <span
        className={`font-mono font-black tabular-nums ${large ? "text-base" : "text-sm"}`}
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

function Div() {
  return <span className="w-px h-7" style={{ background: "var(--border)" }} />;
}