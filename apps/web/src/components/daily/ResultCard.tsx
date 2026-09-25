import type React from "react";
import type { DailyResult } from "@sudoku-2026/core";
import { RANK_TITLES, levelName } from "@sudoku-2026/core";
import {
  LEVEL_RANK,
  OUTCOME_COLORS,
  OUTCOME_LABELS,
  dailyDateLabel,
  formatClock,
  resultBadges,
} from "@/lib/dailyFormat";

/** The daily result as a collectible card. Mirrors the share image (`/d/[code]/opengraph-image`). */
export default function ResultCard({ result }: { result: DailyResult }): React.ReactElement {
  const title = RANK_TITLES[result.titleId];
  return (
    <div
      className="w-full rounded-3xl overflow-hidden text-left"
      style={{
        background: "linear-gradient(160deg, #fffdf8 0%, #f4f1ea 100%)",
        border: "1.5px solid var(--border-2)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div className="h-1.5" style={{ background: "linear-gradient(90deg,#bf9c45,#e0c873)" }} />
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-dim)" }}>
              Sudoku 2026 · Daglig
            </p>
            <p className="text-sm font-bold mt-0.5" style={{ color: "var(--text)" }}>
              {dailyDateLabel(result.date)}
            </p>
          </div>
          <LevelPill level={result.level} />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <p className="text-5xl font-black tabular-nums tracking-tight leading-none" style={{ color: "var(--accent)" }}>
              {formatClock(result.elapsed)}
            </p>
            <p className="text-xs font-semibold leading-snug" style={{ color: "var(--text-muted)" }}>
              {resultBadges(result).map((b, i) => (
                <span key={b} className="whitespace-nowrap">
                  {i > 0 && " · "}
                  {b}
                </span>
              ))}
            </p>
            <p className="text-lg font-black leading-tight mt-1" style={{ color: "#8a6d2a" }}>
              {title.name}
            </p>
            {result.name && (
              <p className="text-xs font-semibold truncate" style={{ color: "var(--text-muted)" }}>
                {result.name}
              </p>
            )}
          </div>
          <OutcomeGrid result={result} size={128} />
        </div>

        <Legend />
      </div>
    </div>
  );
}

export function LevelPill({ level }: { level: DailyResult["level"] }) {
  const rank = LEVEL_RANK[level];
  return (
    <span
      className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
      style={{ background: "var(--accent-light)", color: "var(--accent)" }}
    >
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4].map((k) => (
          <span key={k} className="w-1.5 h-1.5 rounded-full" style={{ background: k <= rank ? "var(--accent)" : "var(--border-2)" }} />
        ))}
      </span>
      {levelName(level)}
    </span>
  );
}

export function OutcomeGrid({ result, size }: { result: DailyResult; size: number }) {
  const counts = { clean: 0, hint: 0, mistake: 0 };
  for (const c of result.cells) if (c !== "given") counts[c]++;
  const gap = Math.max(1, Math.round(size / 90));
  const seam = gap * 2.5;
  return (
    <div
      role="img"
      aria-label={`Rutenett: ${counts.clean} ruter med egen logikk, ${counts.hint} med hint, ${counts.mistake} med feil`}
      className="shrink-0 flex flex-col rounded-lg"
      style={{ width: size, height: size, gap: seam, padding: 4, background: "var(--surface)", border: "1.5px solid var(--border-2)" }}
    >
      {[0, 1, 2].map((band) => (
        <div key={band} className="flex-1 flex flex-col" style={{ gap }}>
          {[0, 1, 2].map((rr) => {
            const row = band * 3 + rr;
            return (
              <div key={rr} className="flex-1 flex" style={{ gap: seam }}>
                {[0, 1, 2].map((stack) => (
                  <div key={stack} className="flex-1 flex" style={{ gap }}>
                    {[0, 1, 2].map((cc) => {
                      const c = result.cells[row * 9 + stack * 3 + cc];
                      return (
                        <span
                          key={cc}
                          className="flex-1 rounded-[2px]"
                          style={{ background: OUTCOME_COLORS[c], opacity: c === "given" ? 0.85 : 1 }}
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
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
      {(["clean", "hint", "mistake"] as const).map((k) => (
        <span key={k} className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: OUTCOME_COLORS[k] }} />
          {OUTCOME_LABELS[k]}
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: OUTCOME_COLORS.given, opacity: 0.85 }} />
        gitt
      </span>
    </div>
  );
}
