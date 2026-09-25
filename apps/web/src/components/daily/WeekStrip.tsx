"use client";

import type React from "react";
import Link from "next/link";
import { dailyDifficulty, levelName, todayString } from "@sudoku-2026/core";
import { useDailyStore } from "@/store/dailyStore";
import { useHydrated } from "@/lib/useHydrated";
import { LEVEL_RANK } from "@/lib/dailyFormat";

const LETTERS = ["M", "T", "O", "T", "F", "L", "S"];

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** This week, Monday → Sunday: which dailies are solved, and how hard each day is. */
export default function WeekStrip(): React.ReactElement | null {
  const results = useDailyStore((s) => s.results);
  const hydrated = useHydrated();
  if (!hydrated) return <div className="h-[62px]" aria-hidden="true" />;

  const today = todayString();
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, k) => isoLocal(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + k)));

  return (
    <nav aria-label="Denne uken" className="grid grid-cols-7 gap-1.5 w-full">
      {days.map((date, k) => {
        const solved = Boolean(results[date]);
        const isToday = date === today;
        const future = date > today;
        const rank = LEVEL_RANK[dailyDifficulty(date)];
        const label = `${LETTERS[k]} ${date}: ${levelName(dailyDifficulty(date))}${solved ? ", løst" : future ? "" : ", ikke løst"}`;
        const body = (
          <span
            className="flex flex-col items-center gap-1 rounded-xl py-2"
            style={{
              background: solved ? "var(--accent)" : "var(--surface)",
              border: `1.5px solid ${isToday ? "var(--accent-2)" : solved ? "var(--accent)" : "var(--border)"}`,
              opacity: future ? 0.45 : 1,
            }}
          >
            <span className="text-[11px] font-black" style={{ color: solved ? "#fff" : "var(--text)" }}>
              {solved ? "✓" : LETTERS[k]}
            </span>
            <span className="flex gap-[2px]" aria-hidden="true">
              {[1, 2, 3, 4].map((d) => (
                <span
                  key={d}
                  className="w-1 h-1 rounded-full"
                  style={{
                    background: d <= rank ? (solved ? "#fff" : "var(--accent)") : solved ? "rgba(255,255,255,0.3)" : "var(--border-2)",
                  }}
                />
              ))}
            </span>
          </span>
        );
        return future || isToday || solved ? (
          <span key={date} aria-label={label} title={label}>
            {body}
          </span>
        ) : (
          <Link key={date} href={`/play/daily?date=${date}`} aria-label={`${label} — spill nå`} title={`${label} — spill nå`}>
            {body}
          </Link>
        );
      })}
    </nav>
  );
}
