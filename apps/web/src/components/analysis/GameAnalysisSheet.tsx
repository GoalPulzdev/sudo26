"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { motion } from "framer-motion";
import type { GameAnalysis, SolvingTechnique } from "@sudoku-2026/core";
import { TECHNIQUE_INFO, cellName } from "@sudoku-2026/core";
import { Rich } from "@/lib/rich";

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Sequential ramp (one hue, light → dark) for think time. */
const RAMP = ["#eef0f4", "#c9d0dd", "#97a5bd", "#5f7196", "#2f3d57"];
const BINS = [5, 15, 40, 90]; // seconds; upper bounds of the first four steps
const BIN_LABELS = ["< 5 s", "5–15 s", "15–40 s", "40–90 s", "> 90 s"];

function binOf(seconds: number): number {
  const i = BINS.findIndex((b) => seconds < b);
  return i === -1 ? BINS.length : i;
}

const TECHNIQUE_ORDER: SolvingTechnique[] = [
  "hidden_single",
  "naked_single",
  "naked_pair",
  "pointing_pair",
  "box_line_reduction",
  "x_wing",
  "guess_required",
];

export default function GameAnalysisSheet({
  analysis,
  clues,
  onClose,
}: {
  analysis: GameAnalysis;
  clues: string;
  onClose: () => void;
}): React.ReactElement {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center backdrop-blur-sm"
      style={{ background: "rgba(35,34,40,0.35)" }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Analyse av spillet"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl text-left"
        style={{ background: "var(--surface)", boxShadow: "0 24px 64px rgba(44,58,79,0.25)" }}
      >
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#bf9c45,#e0c873)" }} />
        <div className="px-5 sm:px-7 pt-5 pb-8 flex flex-col gap-7">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--accent-2)" }}>
                Analyse
              </p>
              <h2 className="text-3xl font-black tracking-tight mt-1" style={{ color: "var(--text)" }}>
                {analysis.title.name}
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                {analysis.title.description}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Lukk analysen"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Tile label="Tid" value={fmt(analysis.elapsed)} sub={`Forventet ${fmt(analysis.expectedSeconds)}`} />
            <Tile label="Feil" value={String(analysis.mistakes)} />
            <Tile label="Hint" value={String(analysis.hintsUsed)} />
            <Tile
              label="Brettets nøkkel"
              value={analysis.hardestTechnique ? TECHNIQUE_INFO[analysis.hardestTechnique].name : "–"}
              small
            />
          </div>

          {analysis.insights.length > 0 && (
            <section className="flex flex-col gap-2">
              <SectionTitle>Innsikt</SectionTitle>
              <ul className="flex flex-col gap-2">
                {analysis.insights.map((line, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed rounded-xl px-3.5 py-2.5"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                  >
                    <Rich text={line} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {analysis.hasTimeline ? (
            <>
              <section className="flex flex-col gap-2">
                <SectionTitle>Tempo</SectionTitle>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Riktig utfylte ruter over tid. Flate partier er der du tenkte.
                </p>
                <TempoChart analysis={analysis} />
              </section>

              <section className="flex flex-col gap-2">
                <SectionTitle>Tenketid per rute</SectionTitle>
                <ThinkHeatmap analysis={analysis} clues={clues} />
              </section>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Dette spillet ble startet før trekk ble logget, så tempo og tenketid mangler. Neste spill får full analyse.
            </p>
          )}

          <section className="flex flex-col gap-2">
            <SectionTitle>Teknikker brettet krevde</SectionTitle>
            <TechniqueBars analysis={analysis} />
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--text-dim)" }}>
      {children}
    </h3>
  );
}

function Tile({ label, value, sub, small }: { label: string; value: string; sub?: string; small?: boolean }) {
  return (
    <div className="rounded-xl px-3 py-2.5 flex flex-col gap-0.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
        {label}
      </span>
      <span className={`${small ? "text-sm" : "text-xl"} font-black tabular-nums leading-tight`} style={{ color: "var(--text)" }}>
        {value}
      </span>
      {sub && (
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

// ─── Tempo: cumulative correct placements over time ─────────────────────────────

function TempoChart({ analysis }: { analysis: GameAnalysis }) {
  const W = 320;
  const H = 150;
  const pad = { l: 26, r: 10, t: 10, b: 20 };
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;
  const { tempo, emptyCells, stuck } = analysis;
  const maxT = Math.max(tempo[tempo.length - 1].t, 1);
  const x = (t: number) => pad.l + (t / maxT) * pw;
  const y = (n: number) => pad.t + ph - (n / Math.max(emptyCells, 1)) * ph;
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const line = useMemo(() => {
    let d = `M ${x(0)} ${y(0)}`;
    for (let k = 1; k < tempo.length; k++) d += ` H ${x(tempo[k].t)} V ${y(tempo[k].filled)}`;
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempo, maxT, emptyCells]);
  const area = `${line} H ${x(maxT)} V ${y(0)} Z`;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const t = (((e.clientX - rect.left) / rect.width) * W - pad.l) / pw * maxT;
    let k = 0;
    for (let i = 0; i < tempo.length; i++) if (tempo[i].t <= t) k = i;
    setActive(k);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") setActive((a) => Math.min((a ?? 0) + 1, tempo.length - 1));
    if (e.key === "ArrowLeft") setActive((a) => Math.max((a ?? 0) - 1, 0));
  }

  const point = active !== null ? tempo[active] : null;
  const stuckTimes = new Set(stuck.map((s) => s.at));

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto touch-none outline-none"
        role="img"
        aria-label={`Tempokurve: ${emptyCells} ruter på ${fmt(maxT)}`}
        tabIndex={0}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        {/* Recessive grid + axes */}
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(emptyCells * f)} y2={y(emptyCells * f)} stroke="var(--border)" strokeWidth={1} />
            <text x={pad.l - 6} y={y(emptyCells * f) + 3} textAnchor="end" fontSize={9} fill="var(--text-dim)">
              {Math.round(emptyCells * f)}
            </text>
          </g>
        ))}
        {[0, 0.5, 1].map((f) => (
          <text key={f} x={x(maxT * f)} y={H - 5} textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"} fontSize={9} fill="var(--text-dim)">
            {fmt(maxT * f)}
          </text>
        ))}

        <path d={area} fill="rgba(58,74,102,0.07)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />

        {/* Stuck moments: where a long flat stretch ended */}
        {stuck.map((s) => {
          const k = tempo.findIndex((p) => p.t === s.at);
          if (k < 0) return null;
          const px = x(s.at);
          const py = y(tempo[k].filled);
          return (
            <g key={s.cell}>
              <circle cx={px} cy={py} r={5} fill="var(--accent-2)" stroke="var(--surface)" strokeWidth={2} />
              <text x={px - 7} y={py - 8} textAnchor="end" fontSize={9} fontWeight={700} fill="var(--text-muted)">
                boks {s.box + 1}
              </text>
            </g>
          );
        })}

        {point && (
          <g pointerEvents="none">
            <line x1={x(point.t)} x2={x(point.t)} y1={pad.t} y2={pad.t + ph} stroke="var(--text-dim)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(point.t)} cy={y(point.filled)} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>

      <div className="h-9 mt-1 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }} aria-live="polite">
        {point ? (
          <>
            <span className="inline-block w-3 h-[2px]" style={{ background: "var(--accent)" }} aria-hidden="true" />
            <strong className="text-sm tabular-nums" style={{ color: "var(--text)" }}>
              {point.filled} av {emptyCells} ruter
            </strong>
            <span>etter {fmt(point.t)}</span>
            {stuckTimes.has(point.t) && <span style={{ color: "var(--accent-2)" }}>· etter lang tenkepause</span>}
          </>
        ) : (
          <span>Pek eller bruk piltastene for å lese av kurven.</span>
        )}
      </div>
    </div>
  );
}

// ─── Heatmap: think time per cell ──────────────────────────────────────────────

function ThinkHeatmap({ analysis, clues }: { analysis: GameAnalysis; clues: string }) {
  const byCell = useMemo(() => new Map(analysis.cells.map((c) => [c.cell, c])), [analysis]);
  const [active, setActive] = useState<number | null>(null);
  const info = active !== null ? byCell.get(active) : undefined;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="grid rounded-xl overflow-hidden mx-auto"
        style={{
          gridTemplateColumns: "repeat(9, 1fr)",
          width: "min(100%, 300px)",
          aspectRatio: "1",
          border: "2px solid var(--box-border)",
        }}
        onPointerLeave={() => setActive(null)}
      >
        {Array.from({ length: 81 }, (_, i) => {
          const r = Math.floor(i / 9);
          const c = i % 9;
          const cell = byCell.get(i);
          const given = clues[i] !== "0";
          const bin = cell?.thinkTime != null ? binOf(cell.thinkTime) : null;
          const bg = given ? "var(--surface-2)" : bin !== null ? RAMP[bin] : "var(--surface)";
          const label = given
            ? `${cellName(i)}: gitt ${clues[i]}`
            : `${cellName(i)}: ${cell?.thinkTime != null ? fmt(cell.thinkTime) : "–"} tenketid`;
          return (
            <button
              key={i}
              type="button"
              aria-label={label}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className="relative flex items-center justify-center text-[10px] font-bold cursor-default focus:outline-none"
              style={{
                background: bg,
                color: given ? "var(--text-dim)" : "transparent",
                borderRight: c === 8 ? "none" : c % 3 === 2 ? "2px solid var(--box-border)" : "1px solid var(--surface)",
                borderBottom: r === 8 ? "none" : r % 3 === 2 ? "2px solid var(--box-border)" : "1px solid var(--surface)",
                boxShadow: active === i ? "inset 0 0 0 2px var(--accent-2)" : undefined,
              }}
            >
              {given ? clues[i] : ""}
              {cell?.byHint && (
                <span className="absolute top-[3px] right-[3px] w-[5px] h-[5px] rounded-full" style={{ background: "var(--accent-2)" }} />
              )}
              {cell && cell.mistakes > 0 && (
                <span className="absolute bottom-[3px] left-[3px] w-[5px] h-[5px] rounded-full" style={{ background: "var(--error)" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
        {RAMP.map((color, k) => (
          <span key={color} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ background: color, border: "1px solid var(--border)" }} />
            {BIN_LABELS[k]}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--accent-2)" }} /> hint
        </span>
        <span className="flex items-center gap-1">
          <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--error)" }} /> feil
        </span>
      </div>

      <div className="min-h-[40px] rounded-xl px-3 py-2 text-xs" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }} aria-live="polite">
        {info ? (
          <>
            <strong className="text-sm tabular-nums" style={{ color: "var(--text)" }}>
              {info.thinkTime != null ? fmt(info.thinkTime) : "–"}
            </strong>{" "}
            i {cellName(info.cell)} · {TECHNIQUE_INFO[info.technique].name.toLowerCase()}
            {info.byHint ? " · løst med hint" : ""}
            {info.mistakes > 0 ? ` · ${info.mistakes} feil` : ""}
          </>
        ) : active !== null ? (
          <>Gitt siffer i {cellName(active)}.</>
        ) : (
          <>Pek på en rute for å se tenketid og hvilken teknikk den krevde.</>
        )}
      </div>
    </div>
  );
}

// ─── Techniques the puzzle required ────────────────────────────────────────────

function TechniqueBars({ analysis }: { analysis: GameAnalysis }) {
  const rows = TECHNIQUE_ORDER.filter((t) => (analysis.techniqueCounts[t] ?? 0) > 0);
  const max = Math.max(...rows.map((t) => analysis.techniqueCounts[t] ?? 0), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((t) => {
        const n = analysis.techniqueCounts[t] ?? 0;
        return (
          <div key={t} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold" style={{ color: "var(--text)" }}>
                {TECHNIQUE_INFO[t].name}
              </span>
              <span className="tabular-nums font-bold" style={{ color: "var(--text-muted)" }}>
                {n} {n === 1 ? "rute" : "ruter"}
              </span>
            </div>
            <div className="h-2.5 rounded-full" style={{ background: "var(--surface-2)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${(n / max) * 100}%`, minWidth: 6, background: "var(--accent)" }}
                title={`${TECHNIQUE_INFO[t].name}: ${n}`}
              />
            </div>
            <span className="text-[11px] leading-snug" style={{ color: "var(--text-dim)" }}>
              {TECHNIQUE_INFO[t].summary}
            </span>
          </div>
        );
      })}
    </div>
  );
}
