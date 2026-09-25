"use client";

import type React from "react";
import Link from "next/link";
import type { DailyResult } from "@sudoku-2026/core";
import { todayString } from "@sudoku-2026/core";
import { useDailyStore } from "@/store/dailyStore";
import { useHydrated } from "@/lib/useHydrated";
import { formatClock } from "@/lib/dailyFormat";
import ShareActions from "@/components/daily/ShareActions";

/** Play the same board — or, if you already have, see how you compare. */
export default function ChallengeCta({ result, code }: { result: DailyResult; code: string }): React.ReactElement {
  const hydrated = useHydrated();
  const mine = useDailyStore((s) => s.results[result.date]);
  const today = hydrated ? todayString() : null;
  const isToday = result.date === today;
  const href = isToday ? "/play/daily" : `/play/daily?date=${result.date}`;
  const themSubject = result.name ?? "de";
  const themObject = result.name ?? "dem";

  // Your own card: offer sharing instead of a comparison with yourself.
  if (hydrated && mine && mine.code === code) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-center" style={{ color: "var(--text-muted)" }}>
          Dette er ditt resultat.
        </p>
        <ShareActions stored={mine} />
      </div>
    );
  }

  if (hydrated && mine) {
    const diff = mine.result.elapsed - result.elapsed;
    const verdict =
      diff < 0 ? `Du var ${formatClock(-diff)} raskere.` : diff > 0 ? `${capitalize(themSubject)} var ${formatClock(diff)} raskere.` : "Helt likt!";
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: "var(--surface)", border: "1.5px solid var(--border-2)" }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
            Du mot {themObject}
          </p>
          <p className="text-3xl font-black tabular-nums" style={{ color: "var(--accent)" }}>
            {formatClock(mine.result.elapsed)} <span className="text-base" style={{ color: "var(--text-muted)" }}>vs {formatClock(result.elapsed)}</span>
          </p>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{verdict}</p>
        </div>
        <Link href={`/d/${mine.code}`} className="text-center text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
          Se ditt kort →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Link
        href={href}
        className="w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest text-center"
        style={{ background: "var(--gradient-brand)", color: "#fff", boxShadow: "0 4px 20px rgba(58,74,102,0.3)" }}
      >
        {isToday ? "Spill dagens brett" : "Spill samme brett"}
      </Link>
      {!isToday && hydrated && (
        <Link href="/play/daily" className="text-center text-xs font-bold uppercase tracking-widest py-2" style={{ color: "var(--text-muted)" }}>
          Eller dagens brett →
        </Link>
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
