import type React from "react";
import type { DailyResult } from "@sudoku-2026/core";
import { RANK_TITLES, levelName } from "@sudoku-2026/core";
import { LEVEL_RANK, OUTCOME_COLORS, OUTCOME_LABELS, dailyDateLabel, formatClock, resultBadges } from "@/lib/dailyFormat";

/**
 * 1200×630 share image for a daily result, rendered by Satori (next/og).
 * Satori supports a flexbox subset: every element with several children
 * needs `display: flex`. No emoji — they would be fetched over the network.
 */
export function DailyCardImage({ r }: { r: DailyResult }): React.ReactElement {
  const title = RANK_TITLES[r.titleId];
  const rank = LEVEL_RANK[r.level];
  const cell = 40;
  const gap = 4;
  const seam = 10;
  return (
    <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", background: "#f4f1ea", fontFamily: "Inter" }}>
      <div style={{ height: 14, width: "100%", display: "flex", backgroundImage: "linear-gradient(90deg,#bf9c45,#e0c873)" }} />
      <div style={{ flex: 1, display: "flex", padding: "48px 64px", gap: 56 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 5, color: "#a89f8f", fontWeight: 600 }}>
            SUDOKU 2026 · DAGLIG
          </div>
          <div style={{ display: "flex", fontSize: 40, color: "#232228", fontWeight: 800, marginTop: 10 }}>
            {dailyDateLabel(r.date)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4].map((k) => (
                <div key={k} style={{ width: 14, height: 14, borderRadius: 7, background: k <= rank ? "#33415a" : "#d3cab6" }} />
              ))}
            </div>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 800, letterSpacing: 3, color: "#33415a" }}>
              {levelName(r.level).toUpperCase()}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 800, color: "#33415a", lineHeight: 1, marginTop: 22, letterSpacing: -4 }}>
            {formatClock(r.elapsed)}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#6f6a5f", fontWeight: 600, marginTop: 14 }}>
            {resultBadges(r).join("  ·  ")}
          </div>
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", fontSize: 54, fontWeight: 800, color: "#8a6d2a" }}>{title.name}</div>
          {r.name ? (
            <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: "#6f6a5f", marginTop: 4 }}>{r.name}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: seam,
              padding: 16,
              background: "#fffdf8",
              border: "3px solid #d3cab6",
              borderRadius: 24,
            }}
          >
            {[0, 1, 2].map((band) => (
              <div key={band} style={{ display: "flex", flexDirection: "column", gap }}>
                {[0, 1, 2].map((rr) => {
                  const row = band * 3 + rr;
                  return (
                    <div key={row} style={{ display: "flex", gap: seam }}>
                      {[0, 1, 2].map((stack) => (
                        <div key={stack} style={{ display: "flex", gap }}>
                          {[0, 1, 2].map((cc) => {
                            const c = r.cells[row * 9 + stack * 3 + cc];
                            return (
                              <div
                                key={cc}
                                style={{
                                  width: cell,
                                  height: cell,
                                  borderRadius: 6,
                                  background: OUTCOME_COLORS[c],
                                  opacity: c === "given" ? 0.85 : 1,
                                }}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 22, fontSize: 20, color: "#6f6a5f", fontWeight: 600 }}>
            {(["clean", "hint", "mistake"] as const).map((k) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: OUTCOME_COLORS[k] }} />
                {OUTCOME_LABELS[k]}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
