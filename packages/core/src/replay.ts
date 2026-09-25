/**
 * Replays and ghost duels.
 *
 * A replay is a game's full move log plus a reference to its puzzle. Curated
 * and daily puzzles are deterministic from (level, seed) or date, so the
 * reference is tiny and the whole game fits in a link (~250–400 chars for a
 * typical game). The same code drives:
 *  - `/replay/<code>`: watch the game unfold,
 *  - `/duel/<code>`: play the same board against the recorded "ghost".
 *
 * Like result codes, replays are unverified — they prove nothing on their own.
 *
 * Binary layout (v1), then base64url:
 *   u8  version (1)
 *   u8  puzzle kind: 0 = daily, 1 = curated
 *       daily:   u16 day index
 *       curated: u8 level index, u8 seed length, ASCII seed bytes (≤ 40)
 *   u24 elapsed seconds (final time)
 *   u8  name length + UTF-8 name bytes (≤ 24)
 *   u16 move count (≤ 500)
 *   per move: u8 cell | hint flag (bit 7), u8 value, varint Δt seconds
 */

import type { MoveRecord, Puzzle } from "./types.js";
import { CURATED_DIFFICULTIES, createCuratedPuzzle, createDailyPuzzle, isCuratedDifficulty, type CuratedDifficulty } from "./curated.js";
import { boxOf } from "./coach.js";
import { clamp, dateFromIndex, dayIndex, fromBase64Url, nameBytes, toBase64Url, utf8Decode } from "./codec.js";

export type PuzzleRef = { kind: "daily"; date: string } | { kind: "curated"; level: CuratedDifficulty; seed: string };

export interface ReplayMove {
  t: number;
  cell: number;
  value: number;
  hint: boolean;
}

export interface Replay {
  puzzle: PuzzleRef;
  elapsed: number;
  name?: string;
  moves: ReplayMove[];
}

const MAX_MOVES = 500;
const MAX_SEED = 40;
const MAX_NAME_BYTES = 24;

// ─── Puzzle references ─────────────────────────────────────────────────────────

/** Rebuild the puzzle a reference points to. */
export function puzzleFromRef(ref: PuzzleRef, id?: string): Puzzle {
  if (ref.kind === "daily") {
    const p = createDailyPuzzle(ref.date);
    return id ? { ...p, id } : p;
  }
  return createCuratedPuzzle(ref.level, ref.seed, id ?? `curated-${ref.seed}`);
}

/**
 * The reference that regenerates `puzzle`, or null if it can't be rebuilt
 * (a variant other than classic, or a puzzle not made by the curated bank).
 */
export function refFromPuzzle(puzzle: Puzzle): PuzzleRef | null {
  if (puzzle.variant !== "classic" || !puzzle.seed) return null;
  let ref: PuzzleRef | null = null;
  if (puzzle.difficulty === "daily" && puzzle.date) ref = { kind: "daily", date: puzzle.date };
  else if (isCuratedDifficulty(puzzle.difficulty) && /^[\x20-\x7e]*$/.test(puzzle.seed) && puzzle.seed.length <= MAX_SEED) {
    ref = { kind: "curated", level: puzzle.difficulty, seed: puzzle.seed };
  }
  if (!ref) return null;
  // Guard against puzzles from older generators that share a seed format.
  return puzzleFromRef(ref).clues === puzzle.clues ? ref : null;
}

export function replayFromGame(puzzle: Puzzle, moves: MoveRecord[] | undefined, elapsed: number, name?: string): Replay | null {
  const ref = refFromPuzzle(puzzle);
  if (!ref || !moves || moves.length === 0) return null;
  return {
    puzzle: ref,
    elapsed,
    ...(name ? { name } : {}),
    moves: moves.slice(-MAX_MOVES).map((m) => ({ t: m.t, cell: m.cell, value: m.value, hint: m.source === "hint" })),
  };
}

// ─── Encode / decode ───────────────────────────────────────────────────────────

function pushVarint(out: number[], n: number): void {
  let v = Math.max(0, Math.round(n));
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v = Math.floor(v / 128);
  }
  out.push(v);
}

export function encodeReplay(r: Replay): string {
  const b: number[] = [1];
  if (r.puzzle.kind === "daily") {
    const day = clamp(dayIndex(r.puzzle.date), 0xffff);
    b.push(0, day >> 8, day & 255);
  } else {
    const seed = [...r.puzzle.seed.slice(0, MAX_SEED)].map((c) => c.charCodeAt(0) & 0x7f);
    b.push(1, CURATED_DIFFICULTIES.indexOf(r.puzzle.level), seed.length, ...seed);
  }
  const t = clamp(r.elapsed, 0xffffff);
  b.push(t >> 16, (t >> 8) & 255, t & 255);
  const name = r.name ? nameBytes(r.name, MAX_NAME_BYTES) : [];
  b.push(name.length, ...name);
  const moves = [...r.moves].sort((x, y) => x.t - y.t).slice(-MAX_MOVES);
  b.push(moves.length >> 8, moves.length & 255);
  let prev = 0;
  for (const m of moves) {
    b.push((m.cell & 0x7f) | (m.hint ? 0x80 : 0), m.value & 0x0f);
    pushVarint(b, m.t - prev);
    prev = Math.max(prev, m.t);
  }
  return toBase64Url(b);
}

/** Decode a replay code; null if malformed, oversized or from an unknown version. */
export function decodeReplay(code: string): Replay | null {
  if (code.length > 4000) return null;
  const b = fromBase64Url(code);
  if (!b || b[0] !== 1) return null;
  let i = 1;
  const need = (n: number) => i + n <= b.length;

  let puzzle: PuzzleRef;
  if (!need(1)) return null;
  const kind = b[i++];
  if (kind === 0) {
    if (!need(2)) return null;
    puzzle = { kind: "daily", date: dateFromIndex((b[i] << 8) | b[i + 1]) };
    i += 2;
  } else if (kind === 1) {
    if (!need(2)) return null;
    const level = CURATED_DIFFICULTIES[b[i++]];
    const len = b[i++];
    if (!level || len > MAX_SEED || !need(len)) return null;
    const seed = String.fromCharCode(...b.slice(i, i + len));
    if (!/^[\x20-\x7e]*$/.test(seed)) return null;
    i += len;
    puzzle = { kind: "curated", level, seed };
  } else return null;

  if (!need(4)) return null;
  const elapsed = (b[i] << 16) | (b[i + 1] << 8) | b[i + 2];
  i += 3;
  const nameLen = b[i++];
  if (nameLen > MAX_NAME_BYTES || !need(nameLen)) return null;
  const name = nameLen ? utf8Decode(b.slice(i, i + nameLen)) : "";
  if (name === null) return null;
  i += nameLen;

  if (!need(2)) return null;
  const count = (b[i] << 8) | b[i + 1];
  i += 2;
  if (count > MAX_MOVES) return null;
  const moves: ReplayMove[] = [];
  let t = 0;
  for (let k = 0; k < count; k++) {
    if (!need(3)) return null;
    const cell = b[i] & 0x7f;
    const hint = (b[i] & 0x80) !== 0;
    const value = b[i + 1];
    i += 2;
    let dt = 0;
    let shift = 1;
    for (let guard = 0; ; guard++) {
      if (!need(1) || guard > 4) return null;
      const byte = b[i++];
      dt += (byte & 0x7f) * shift;
      shift *= 128;
      if (byte < 0x80) break;
    }
    t += dt;
    if (cell > 80 || value < 1 || value > 9) return null;
    moves.push({ t, cell, value, hint });
  }
  if (i !== b.length) return null;
  return { puzzle, elapsed, ...(name ? { name } : {}), moves };
}

// ─── Using a replay ────────────────────────────────────────────────────────────

export interface GhostTimeline {
  /** First correct placement per cell, in time order. */
  placements: { t: number; cell: number }[];
  /** Cells the ghost had to fill. */
  total: number;
  /** Empty cells per box (0–8). */
  boxTotals: number[];
  /** True when the replay fills every empty cell correctly. */
  complete: boolean;
}

export function ghostTimeline(replay: Replay, clues: string, solution: string): GhostTimeline {
  const seen = new Set<number>();
  const placements: { t: number; cell: number }[] = [];
  for (const m of [...replay.moves].sort((a, b) => a.t - b.t)) {
    if (clues[m.cell] !== "0" || seen.has(m.cell)) continue;
    if (Number(solution[m.cell]) !== m.value) continue;
    seen.add(m.cell);
    placements.push({ t: m.t, cell: m.cell });
  }
  const boxTotals = Array(9).fill(0);
  let total = 0;
  for (let i = 0; i < 81; i++) {
    if (clues[i] === "0") {
      total++;
      boxTotals[boxOf(i)]++;
    }
  }
  return { placements, total, boxTotals, complete: placements.length === total };
}

/** How far the ghost is at elapsed second `t`: cells filled overall and per box. */
export function ghostProgressAt(timeline: GhostTimeline, t: number): { filled: number; boxes: number[] } {
  const boxes = Array(9).fill(0);
  let filled = 0;
  for (const p of timeline.placements) {
    if (p.t > t) break;
    filled++;
    boxes[boxOf(p.cell)]++;
  }
  return { filled, boxes };
}

export interface ReplayFrame {
  /** Values on the board (clues + moves so far); 0 = empty. */
  values: number[];
  /** Cells currently holding a wrong value. */
  wrong: Set<number>;
  /** Cells whose current value came from a hint. */
  hinted: Set<number>;
  /** Index of the last applied move (-1 before the first). */
  lastMove: number;
}

/** Board state at elapsed second `t`. Moves at exactly `t` are applied. */
export function replayFrameAt(replay: Replay, clues: string, solution: string, t: number): ReplayFrame {
  const values = clues.split("").map(Number);
  const wrong = new Set<number>();
  const hinted = new Set<number>();
  let lastMove = -1;
  replay.moves.forEach((m, k) => {
    if (m.t > t || clues[m.cell] !== "0") return;
    values[m.cell] = m.value;
    if (Number(solution[m.cell]) === m.value) wrong.delete(m.cell);
    else wrong.add(m.cell);
    if (m.hint) hinted.add(m.cell);
    else hinted.delete(m.cell);
    lastMove = k;
  });
  return { values, wrong, hinted, lastMove };
}
