"use client";

import { useEffect, useState } from "react";
import type React from "react";

function untilMidnight(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
}

function hms(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** "Neste brett om 5:12:33" — counts down to local midnight (when todayString() rolls over). */
export default function NextDailyCountdown({
  className,
  onDark,
}: {
  className?: string;
  /** Render for a dark background. */
  onDark?: boolean;
}): React.ReactElement | null {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    setLeft(untilMidnight());
    const id = setInterval(() => setLeft(untilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);
  if (left === null) return null;
  return (
    <p className={className} style={{ color: onDark ? "rgba(255,255,255,0.65)" : "var(--text-muted)" }}>
      Neste brett om{" "}
      <span className="font-mono font-bold tabular-nums" style={{ color: onDark ? "#fff" : "var(--text)" }}>
        {hms(left)}
      </span>
    </p>
  );
}
