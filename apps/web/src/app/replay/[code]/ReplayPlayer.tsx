"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import Link from "next/link";
import type { Board, CellValue } from "@sudoku-2026/core";
import { boardFromPuzzle, decodeReplay, formatClock, levelName, puzzleFromRef, replayFrameAt } from "@sudoku-2026/core";
import SudokuBoard from "@/components/SudokuBoard";

const SPEEDS = [1, 4, 16, 64];

/** Watch a recorded game: play/pause, speed, and a scrubber with mistake/hint ticks. */
export default function ReplayPlayer({ code }: { code: string }): React.ReactElement {
  const replay = useMemo(() => decodeReplay(code), [code]);
  const puzzle = useMemo(() => (replay ? puzzleFromRef(replay.puzzle) : null), [replay]);
  const end = replay ? Math.max(replay.elapsed, replay.moves.at(-1)?.t ?? 0) : 0;

  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(16);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const step = (now: number) => {
      const dt = last.current === null ? 0 : (now - last.current) / 1000;
      last.current = now;
      setT((prev) => {
        const next = Math.min(end, prev + dt * speed);
        if (next >= end) setPlaying(false);
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      last.current = null;
    };
  }, [playing, speed, end]);

  const second = Math.floor(t);
  const frame = useMemo(
    () => (replay && puzzle ? replayFrameAt(replay, puzzle.clues, puzzle.solution, second) : null),
    [replay, puzzle, second]
  );

  const board: Board | null = useMemo(() => {
    if (!puzzle || !frame) return null;
    const b = boardFromPuzzle(puzzle.clues, puzzle.solution);
    frame.values.forEach((v, i) => {
      const cell = b[Math.floor(i / 9)][i % 9];
      if (!cell.given) {
        cell.value = v as CellValue;
        cell.error = frame.wrong.has(i);
      }
    });
    return b;
  }, [puzzle, frame]);

  if (!replay || !puzzle || !frame || !board) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Fant ikke replayen</h1>
        <Link href="/" className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>Til forsiden →</Link>
      </main>
    );
  }

  const done = replay.moves.filter((m) => m.t <= second);
  const mistakes = done.filter((m) => Number(puzzle.solution[m.cell]) !== m.value).length;
  const hints = done.filter((m) => m.hint).length;
  const empty = [...puzzle.clues].filter((c) => c === "0").length;
  const filled = frame.values.filter((v, i) => puzzle.clues[i] === "0" && v !== 0 && !frame.wrong.has(i)).length;
  const lastCell = frame.lastMove >= 0 ? replay.moves[frame.lastMove].cell : null;
  const who = replay.name ?? "Spilleren";
  const level = puzzle.rating ? levelName(puzzle.rating.label) : "";
  const label = replay.puzzle.kind === "daily" ? `Daglig ${replay.puzzle.date.slice(8)}.${replay.puzzle.date.slice(5, 7)}` : "Klassisk";

  return (
    <main className="min-h-screen flex flex-col items-center gap-4 px-4 py-6">
      <div className="flex flex-col gap-1 self-center" style={{ width: "min(92vw, 480px)" }}>
        <Link href="/" className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>← Hjem</Link>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] mt-3" style={{ color: "var(--accent-2)" }}>
          Replay · {label} · {level}
        </p>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text)" }}>
          {who} på {formatClock(replay.elapsed)}
        </h1>
      </div>

      <div className="flex justify-between items-baseline text-sm" style={{ width: "min(92vw, 480px)", color: "var(--text-muted)" }}>
        <span className="font-mono font-bold tabular-nums" style={{ color: "var(--text)" }}>
          {formatClock(second)} <span style={{ color: "var(--text-dim)" }}>/ {formatClock(end)}</span>
        </span>
        <span className="tabular-nums">{filled}/{empty} ruter · {mistakes} feil · {hints} hint</span>
      </div>

      <SudokuBoard board={board} selectedCell={null} onCellClick={() => {}} hintCell={lastCell === null ? null : [Math.floor(lastCell / 9), lastCell % 9]} />

      <div className="flex flex-col gap-3" style={{ width: "min(92vw, 480px)" }}>
        <div className="relative h-6 flex items-center">
          {/* Mistake / hint ticks under the scrubber */}
          <div className="absolute inset-x-[8px] top-1/2 h-3 -translate-y-1/2 pointer-events-none" aria-hidden="true">
            {replay.moves.map((m, k) => {
              const wrong = Number(puzzle.solution[m.cell]) !== m.value;
              if (!wrong && !m.hint) return null;
              return (
                <span
                  key={k}
                  className="absolute top-0 w-[3px] h-full rounded-full"
                  style={{ left: `${(m.t / Math.max(end, 1)) * 100}%`, background: wrong ? "var(--error)" : "var(--accent-2)" }}
                />
              );
            })}
          </div>
          <input
            type="range"
            min={0}
            max={end}
            step={1}
            value={second}
            onChange={(e) => {
              setPlaying(false);
              setT(Number(e.target.value));
            }}
            aria-label="Tidslinje"
            className="relative w-full accent-[#33415a] cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (t >= end) setT(0);
              setPlaying((p) => !p);
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-black cursor-pointer"
            style={{ background: "var(--gradient-brand)", color: "#fff" }}
          >
            {playing ? "Pause" : t >= end ? "Spill igjen" : "Spill av"}
          </button>
          <div className="flex gap-1 ml-auto" role="group" aria-label="Hastighet">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                aria-pressed={speed === s}
                className="px-2.5 py-2 rounded-lg text-xs font-bold tabular-nums cursor-pointer"
                style={{
                  background: speed === s ? "var(--accent)" : "var(--surface)",
                  color: speed === s ? "#fff" : "var(--text-muted)",
                  border: "1.5px solid var(--border-2)",
                }}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1"><span className="w-[3px] h-3 rounded-full" style={{ background: "var(--error)" }} /> feil</span>
          <span className="flex items-center gap-1"><span className="w-[3px] h-3 rounded-full" style={{ background: "var(--accent-2)" }} /> hint</span>
        </div>

        <Link
          href={`/duel/${code}`}
          className="w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest text-center mt-2"
          style={{ background: "var(--surface)", color: "var(--text)", border: "1.5px solid var(--border-2)" }}
        >
          👻 Spill mot {who === "Spilleren" ? "spøkelset" : who}
        </Link>
      </div>
    </main>
  );
}
