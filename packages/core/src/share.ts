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
import { clamp, dateFromIndex, dayIndex, fromBase64Url, nameBytes, toBase64Url, utf8Decode } from "./codec.js";

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

// ─── Encode / decode ───────────────────────────────────────────────────────────

const MAX_NAME_BYTES = 24;

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
  const name = r.name ? nameBytes(r.name, MAX_NAME_BYTES) : [];
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
