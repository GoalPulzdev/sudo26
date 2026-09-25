/**
 * Shareable daily results.
 *
 * A finished daily is packed into a short, URL-safe code (~60 chars) so a link
 * like `/d/<code>` can render the result card — and its preview image — with no
 * backend. The code is a brag card, not proof: anyone can craft one. Verified
 * results come with the server-side leaderboard.
 *
 * Binary layout (v1), then base64url:
 *   u8  version (1)
 *   u16 day index (days since 2024-01-01, UTC)
 *   u8  level (index into CURATED_DIFFICULTIES)
 *   u24 elapsed seconds
 *   u8  mistakes (capped 255)
 *   u8  hints used (capped 255)
 *   u16 streak (capped 65535)
 *   u8  rank title (index into RANK_TITLE_IDS)
 *   21B cell outcomes, 2 bits each, 81 cells, row-major
 *   u8  name length + UTF-8 name bytes (optional, ≤ 24 bytes)
 */

import type { MoveRecord } from "./types.js";
import { CURATED_DIFFICULTIES, type CuratedDifficulty } from "./curated.js";
import { RANK_TITLE_IDS, type RankTitleId } from "./analysis.js";

/** Per-cell outcome of a finished game. */
export type CellOutcome = "given" | "clean" | "hint" | "mistake";
const OUTCOMES: CellOutcome[] = ["given", "clean", "hint", "mistake"];

export interface DailyResult {
  date: string; // YYYY-MM-DD
  level: CuratedDifficulty;
  elapsed: number;
  mistakes: number;
  hintsUsed: number;
  streak: number;
  titleId: RankTitleId;
  cells: CellOutcome[]; // 81
  name?: string;
}

/** Outcome per cell from the clues and the move log. */
export function cellOutcomes(clues: string, moves: MoveRecord[] | undefined): CellOutcome[] {
  const out: CellOutcome[] = [...clues].map((c) => (c === "0" ? "clean" : "given"));
  for (const m of moves ?? []) {
    if (out[m.cell] === "given") continue;
    if (!m.correct) out[m.cell] = "mistake";
    else if (m.source === "hint" && out[m.cell] !== "mistake") out[m.cell] = "hint";
  }
  return out;
}

// ─── Date <-> day index ────────────────────────────────────────────────────────

const EPOCH = Date.UTC(2024, 0, 1);
const DAY = 86_400_000;

function dayIndex(date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - EPOCH) / DAY);
}

function dateFromIndex(i: number): string {
  return new Date(EPOCH + i * DAY).toISOString().slice(0, 10);
}

// ─── base64url (no Buffer / btoa, so it runs in any runtime) ───────────────────

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function toBase64Url(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
    for (let k = 0; k < chars; k++) out += B64[(n >> (18 - 6 * k)) & 63];
  }
  return out;
}

function fromBase64Url(s: string): number[] | null {
  const bytes: number[] = [];
  let buf = 0;
  let bits = 0;
  for (const ch of s) {
    const v = B64.indexOf(ch);
    if (v < 0) return null;
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buf >> bits) & 255);
    }
  }
  return bytes;
}

// ─── Encode / decode ───────────────────────────────────────────────────────────

const MAX_NAME_BYTES = 24;

function clamp(n: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(n)));
}

function utf8Encode(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

/** Strict UTF-8 decode; null on malformed input. */
function utf8Decode(bytes: number[]): string | null {
  let out = "";
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i];
    const n = b < 0x80 ? 0 : (b & 0xe0) === 0xc0 ? 1 : (b & 0xf0) === 0xe0 ? 2 : (b & 0xf8) === 0xf0 ? 3 : -1;
    if (n < 0) return null;
    let c = n === 0 ? b : b & (0x3f >> n);
    for (let k = 1; k <= n; k++) {
      const cont = bytes[i + k];
      if (cont === undefined || (cont & 0xc0) !== 0x80) return null;
      c = (c << 6) | (cont & 63);
    }
    const min = [0, 0x80, 0x800, 0x10000][n];
    if (c < min || c > 0x10ffff || (c >= 0xd800 && c <= 0xdfff)) return null; // overlong / out of range / surrogate
    out += String.fromCodePoint(c);
    i += n + 1;
  }
  return out;
}

function utf8(name: string): number[] {
  const bytes = utf8Encode(name.trim());
  // Don't cut a multi-byte character in half.
  let end = Math.min(bytes.length, MAX_NAME_BYTES);
  while (end > 0 && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
  return bytes.slice(0, end);
}

export function encodeDailyResult(r: DailyResult): string {
  const bytes: number[] = [1];
  const day = clamp(dayIndex(r.date), 0xffff);
  bytes.push(day >> 8, day & 255);
  bytes.push(Math.max(0, CURATED_DIFFICULTIES.indexOf(r.level)));
  const t = clamp(r.elapsed, 0xffffff);
  bytes.push(t >> 16, (t >> 8) & 255, t & 255);
  bytes.push(clamp(r.mistakes, 255), clamp(r.hintsUsed, 255));
  const st = clamp(r.streak, 0xffff);
  bytes.push(st >> 8, st & 255);
  bytes.push(Math.max(0, RANK_TITLE_IDS.indexOf(r.titleId)));
  for (let i = 0; i < 81; i += 4) {
    let b = 0;
    for (let k = 0; k < 4; k++) b |= Math.max(0, OUTCOMES.indexOf(r.cells[i + k] ?? "clean")) << (6 - 2 * k);
    bytes.push(b);
  }
  const name = r.name ? utf8(r.name) : [];
  if (name.length > 0) bytes.push(name.length, ...name);
  return toBase64Url(bytes);
}

/** Decode a share code; null if it is malformed or from an unknown version. */
export function decodeDailyResult(code: string): DailyResult | null {
  if (code.length > 200) return null;
  const b = fromBase64Url(code);
  if (!b || b.length < 32 || b[0] !== 1) return null;
  const level = CURATED_DIFFICULTIES[b[3]];
  const titleId = RANK_TITLE_IDS[b[11]];
  if (!level || !titleId) return null;

  const cells: CellOutcome[] = [];
  for (let i = 0; i < 81; i++) cells.push(OUTCOMES[(b[12 + (i >> 2)] >> (6 - 2 * (i & 3))) & 3]);

  let name: string | undefined;
  if (b.length > 33) {
    const len = b[33];
    if (len > MAX_NAME_BYTES || b.length < 34 + len) return null;
    const decoded = utf8Decode(b.slice(34, 34 + len));
    if (decoded === null) return null;
    name = decoded;
  }

  return {
    date: dateFromIndex((b[1] << 8) | b[2]),
    level,
    elapsed: (b[4] << 16) | (b[5] << 8) | b[6],
    mistakes: b[7],
    hintsUsed: b[8],
    streak: (b[9] << 8) | b[10],
    titleId,
    cells,
    ...(name ? { name } : {}),
  };
}

// ─── Text share ────────────────────────────────────────────────────────────────

const LEVEL_NAME: Record<CuratedDifficulty, string> = {
  easy: "Enkel",
  medium: "Middels",
  hard: "Vanskelig",
  extreme: "Ekstrem",
};

const EMOJI: Record<CellOutcome, string> = { given: "⬛", clean: "🟦", hint: "🟨", mistake: "🟥" };

export function levelName(level: CuratedDifficulty): string {
  return LEVEL_NAME[level];
}

export function formatClock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** Wordle-style share text: header, stats line, 9×9 emoji grid, link. */
export function dailyShareText(r: DailyResult, titleName: string, url?: string): string {
  const [y, mo, d] = r.date.split("-");
  const stats = [
    `⏱ ${formatClock(r.elapsed)}`,
    r.mistakes === 0 ? "✨ Feilfri" : `${r.mistakes} feil`,
    ...(r.hintsUsed > 0 ? [`💡 ${r.hintsUsed}`] : []),
    ...(r.streak > 1 ? [`🔥 ${r.streak}`] : []),
  ].join(" · ");
  const grid = Array.from({ length: 9 }, (_, row) =>
    r.cells.slice(row * 9, row * 9 + 9).map((c) => EMOJI[c]).join("")
  ).join("\n");
  return [
    `Sudoku 2026 · Daglig ${d}.${mo}.${y} · ${LEVEL_NAME[r.level]}`,
    stats,
    titleName,
    "",
    grid,
    ...(url ? ["", url] : []),
  ].join("\n");
}
