"use client";

import type React from "react";
import { motion } from "framer-motion";
import type { GhostTimeline } from "@sudoku-2026/core";
import { ghostProgressAt } from "@sudoku-2026/core";
import { formatClock } from "@/lib/dailyFormat";

/**
 * Race HUD for a duel: the ghost's and your progress, and a 3×3 box map of
 * where the ghost has filled cells. Never shows the ghost's digits — only how
 * far along each box is — so it can't give answers away.
 */
export default function GhostBar({
  timeline,
  ghostName,
  ghostElapsed,
  elapsed,
  yourFilled,
}: {
  timeline: GhostTimeline;
  ghostName: string;
  ghostElapsed: number;
  elapsed: number;
  yourFilled: number;
}): React.ReactElement {
  const ghost = ghostProgressAt(timeline, elapsed);
  const ghostDone = elapsed >= ghostElapsed;
  const lead = yourFilled - ghost.filled;
  const status = ghostDone
    ? `${ghostName} kom i mål på ${formatClock(ghostElapsed)}`
    : lead > 0
    ? `Du leder med ${lead} ${lead === 1 ? "rute" : "ruter"}`
    : lead < 0
    ? `${ghostName} leder med ${-lead} ${lead === -1 ? "rute" : "ruter"}`
    : "Dødt løp";

  return (
    <section
      aria-label="Duell"
      className="rounded-2xl px-4 py-3 flex items-center gap-4"
      style={{ width: "min(92vw, 480px)", background: "var(--surface)", border: "1.5px solid var(--border-2)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <Lane label={`👻 ${ghostName}`} filled={ghostDone ? timeline.total : ghost.filled} total={timeline.total} color="var(--accent-2)" />
        <Lane label="Du" filled={yourFilled} total={timeline.total} color="var(--accent)" />
        <p className="text-[11px] font-semibold" aria-live="polite" style={{ color: lead < 0 || ghostDone ? "var(--text-muted)" : "var(--accent)" }}>
          {status}
        </p>
      </div>
      <BoxMap boxes={ghostDone ? timeline.boxTotals : ghost.boxes} totals={timeline.boxTotals} />
    </section>
  );
}

function Lane({ label, filled, total, color }: { label: string; filled: number; total: number; color: string }) {
  const pct = total > 0 ? (filled / total) * 100 : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[11px] font-bold">
        <span className="truncate" style={{ color: "var(--text)" }}>{label}</span>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
          {filled}/{total}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
      </div>
    </div>
  );
}

/** Ghost progress per box — fill level only, no digits. */
function BoxMap({ boxes, totals }: { boxes: number[]; totals: number[] }) {
  return (
    <div
      className="shrink-0 grid grid-cols-3 gap-[3px] p-[3px] rounded-lg"
      style={{ width: 58, height: 58, background: "var(--box-border)" }}
      role="img"
      aria-label={`Spøkelsets fremdrift per boks: ${boxes.map((b, i) => `${b}/${totals[i]}`).join(", ")}`}
    >
      {boxes.map((b, i) => {
        const f = totals[i] > 0 ? b / totals[i] : 1;
        return (
          <span key={i} className="relative rounded-[3px] overflow-hidden" style={{ background: "var(--surface)" }}>
            <motion.span
              className="absolute inset-x-0 bottom-0"
              style={{ background: "var(--accent-2)" }}
              animate={{ height: `${f * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </span>
        );
      })}
    </div>
  );
}
