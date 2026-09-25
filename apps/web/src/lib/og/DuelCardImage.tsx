import type React from "react";
import type { GhostTimeline, Replay } from "@sudoku-2026/core";
import { formatClock, levelName } from "@sudoku-2026/core";

/** 1200×630 share image for `/duel/<code>` and `/replay/<code>`: who, time to beat, and the ghost's tempo curve. */
export function DuelCardImage({
  replay,
  timeline,
  level,
}: {
  replay: Replay;
  timeline: GhostTimeline;
  level: Parameters<typeof levelName>[0] | undefined;
}): React.ReactElement {
  const W = 520;
  const H = 300;
  const end = Math.max(replay.elapsed, 1);
  const x = (t: number) => (t / end) * W;
  const y = (n: number) => H - (n / Math.max(timeline.total, 1)) * H;
  let d = `M 0 ${H}`;
  timeline.placements.forEach((p, k) => {
    d += ` H ${x(p.t).toFixed(1)} V ${y(k + 1).toFixed(1)}`;
  });
  d += ` H ${W}`;

  return (
    <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", background: "#f4f1ea", fontFamily: "Inter" }}>
      <div style={{ height: 14, width: "100%", display: "flex", backgroundImage: "linear-gradient(90deg,#bf9c45,#e0c873)" }} />
      <div style={{ flex: 1, display: "flex", padding: "56px 64px", gap: 56, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 5, color: "#a89f8f", fontWeight: 600 }}>
            {`DUELL${level ? ` · ${levelName(level).toUpperCase()}` : ""}`}
          </div>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: "#232228", marginTop: 16, lineHeight: 1.1 }}>
            {`${replay.name ?? "En venn"} utfordrer deg`}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#6f6a5f", fontWeight: 600, marginTop: 36 }}>Tid å slå</div>
          <div style={{ display: "flex", fontSize: 140, fontWeight: 800, color: "#33415a", lineHeight: 1, letterSpacing: -4 }}>
            {formatClock(replay.elapsed)}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#8a6d2a", fontWeight: 800, marginTop: 24 }}>
            Spill mot spøkelset →
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: 28,
            background: "#fffdf8",
            border: "3px solid #d3cab6",
            borderRadius: 24,
            gap: 12,
          }}
        >
          <div style={{ display: "flex", fontSize: 20, color: "#a89f8f", fontWeight: 600, letterSpacing: 3 }}>TEMPO</div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <path d={`${d} V ${H} Z`} fill="rgba(58,74,102,0.08)" />
            <path d={d} fill="none" stroke="#33415a" strokeWidth={4} strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "#a89f8f", fontWeight: 600 }}>
            <span>0:00</span>
            <span>{`${timeline.total} ruter`}</span>
            <span>{formatClock(replay.elapsed)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
