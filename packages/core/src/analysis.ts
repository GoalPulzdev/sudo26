/**
 * Post-game analysis.
 *
 * Combines two views of a finished game:
 *  - the puzzle's *canonical* logic path (`solvePath`): which technique each
 *    empty cell needed, and
 *  - the player's *actual* move log: when each cell was placed, where the
 *    mistakes went, and which cells came from hints.
 *
 * Think time for a cell is the gap between it and the previous correct
 * placement, so long gaps show where the player was stuck — and the canonical
 * path tells us which technique would have unlocked it.
 */

import type { MoveRecord, SolvingTechnique } from "./types.js";
import { solvePath, boxOf, cellName, techniqueRank, hardestTechnique, TECHNIQUE_INFO } from "./coach.js";
import { rateDifficulty } from "./difficulty.js";

export interface CellInsight {
  cell: number;
  /** Technique the canonical path needed to place this cell. */
  technique: SolvingTechnique;
  /** Seconds since the previous correct placement (null if never placed correctly). */
  thinkTime: number | null;
  /** Elapsed seconds when the cell was placed correctly. */
  placedAt: number | null;
  mistakes: number;
  byHint: boolean;
}

export interface StuckMoment {
  cell: number;
  box: number;
  technique: SolvingTechnique;
  seconds: number;
  /** Elapsed seconds when the player got unstuck. */
  at: number;
  byHint: boolean;
}

export interface RankTitle {
  name: string;
  description: string;
}

export interface GameAnalysis {
  /** False when there was no move log (e.g. a game saved before logging existed). */
  hasTimeline: boolean;
  elapsed: number;
  mistakes: number;
  hintsUsed: number;
  /** Cells the player had to fill. */
  emptyCells: number;
  /** Techniques the puzzle required, with how many placements needed each. */
  techniqueCounts: Partial<Record<SolvingTechnique, number>>;
  hardestTechnique: SolvingTechnique | null;
  /** Hardest technique behind a cell the player solved without a hint. */
  hardestMastered: SolvingTechnique | null;
  /** One entry per initially empty cell. */
  cells: CellInsight[];
  /** Per box (0–8): summed think time and mistakes. */
  boxes: { box: number; thinkTime: number; mistakes: number }[];
  /** Longest gaps, longest first (max 3). */
  stuck: StuckMoment[];
  /** Cumulative correct placements over time, starting at (0, 0). */
  tempo: { t: number; filled: number }[];
  /** Average seconds per cell in the first and second half of the placements. */
  pace: { firstHalf: number; secondHalf: number } | null;
  /** The logic solver's time estimate for this puzzle, in seconds. */
  expectedSeconds: number;
  title: RankTitle;
  /** Short Norwegian observations, most interesting first. `**bold**` marks emphasis. */
  insights: string[];
}

export interface AnalyzeInput {
  clues: string;
  moves: MoveRecord[] | undefined;
  elapsed: number;
  mistakes: number;
  hintsUsed: number;
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function analyzeGame(input: AnalyzeInput): GameAnalysis {
  const { clues, elapsed, mistakes, hintsUsed } = input;
  const moves = input.moves ?? [];
  const path = solvePath(clues);
  const expectedSeconds = rateDifficulty(clues).estimatedMinutes * 60;

  // ── Canonical techniques ──
  const empty: number[] = [];
  for (let i = 0; i < 81; i++) if (clues[i] === "0") empty.push(i);
  const techniqueCounts: Partial<Record<SolvingTechnique, number>> = {};
  for (const i of empty) {
    const t = path.cellTechnique[i] ?? "guess_required";
    techniqueCounts[t] = (techniqueCounts[t] ?? 0) + 1;
  }
  const hardest = hardestTechnique(Object.keys(techniqueCounts) as SolvingTechnique[]) ?? null;

  // ── Player timeline ──
  const firstCorrect = new Map<number, MoveRecord>();
  const wrongByCell = new Map<number, number>();
  for (const m of moves) {
    if (m.correct) {
      if (!firstCorrect.has(m.cell)) firstCorrect.set(m.cell, m);
    } else {
      wrongByCell.set(m.cell, (wrongByCell.get(m.cell) ?? 0) + 1);
    }
  }
  const placements = [...firstCorrect.values()].sort((a, b) => a.t - b.t);
  const thinkByCell = new Map<number, number>();
  let prevT = 0;
  for (const p of placements) {
    thinkByCell.set(p.cell, Math.max(0, p.t - prevT));
    prevT = p.t;
  }

  const cells: CellInsight[] = empty.map((cell) => {
    const placed = firstCorrect.get(cell);
    return {
      cell,
      technique: path.cellTechnique[cell] ?? "guess_required",
      thinkTime: thinkByCell.get(cell) ?? null,
      placedAt: placed?.t ?? null,
      mistakes: wrongByCell.get(cell) ?? 0,
      byHint: placed?.source === "hint",
    };
  });

  const boxes = Array.from({ length: 9 }, (_, box) => ({ box, thinkTime: 0, mistakes: 0 }));
  for (const c of cells) {
    boxes[boxOf(c.cell)].thinkTime += c.thinkTime ?? 0;
    boxes[boxOf(c.cell)].mistakes += c.mistakes;
  }

  const stuck: StuckMoment[] = cells
    .filter((c) => c.thinkTime !== null && c.placedAt !== null)
    .sort((a, b) => b.thinkTime! - a.thinkTime!)
    .slice(0, 3)
    .filter((c) => c.thinkTime! >= 20)
    .map((c) => ({
      cell: c.cell,
      box: boxOf(c.cell),
      technique: c.technique,
      seconds: c.thinkTime!,
      at: c.placedAt!,
      byHint: c.byHint,
    }));

  const tempo = [{ t: 0, filled: 0 }, ...placements.map((p, k) => ({ t: p.t, filled: k + 1 }))];

  let pace: GameAnalysis["pace"] = null;
  if (placements.length >= 6) {
    const half = Math.floor(placements.length / 2);
    const midT = placements[half - 1].t;
    const endT = placements[placements.length - 1].t;
    pace = {
      firstHalf: midT / half,
      secondHalf: (endT - midT) / (placements.length - half),
    };
  }

  const mastered = cells.filter((c) => c.placedAt !== null && !c.byHint).map((c) => c.technique);
  const hardestMastered = hardestTechnique(mastered.filter((t) => t !== "guess_required")) ?? null;

  const hasTimeline = placements.length > 0;
  const title = pickTitle({ elapsed, mistakes, hintsUsed, expectedSeconds, pace, hardestMastered });
  const insights = buildInsights({
    hasTimeline,
    mistakes,
    hintsUsed,
    elapsed,
    expectedSeconds,
    hardest,
    hardestMastered,
    stuck,
    boxes,
    pace,
  });

  return {
    hasTimeline,
    elapsed,
    mistakes,
    hintsUsed,
    emptyCells: empty.length,
    techniqueCounts,
    hardestTechnique: hardest,
    hardestMastered,
    cells,
    boxes,
    stuck,
    tempo,
    pace,
    expectedSeconds,
    title,
    insights,
  };
}

function pickTitle(a: {
  elapsed: number;
  mistakes: number;
  hintsUsed: number;
  expectedSeconds: number;
  pace: GameAnalysis["pace"];
  hardestMastered: SolvingTechnique | null;
}): RankTitle {
  const clean = a.mistakes === 0 && a.hintsUsed === 0;
  const fast = a.elapsed <= a.expectedSeconds * 0.6;
  if (clean && fast) return { name: "Iskald Logiker", description: "Feilfritt, uten hint, og langt under forventet tid." };
  if (clean && a.hardestMastered === "x_wing") return { name: "X-Wing-pilot", description: "Du fant et X-Wing på egen hånd — og gjorde ingen feil." };
  if (clean) return { name: "Feilfri Mester", description: "Ingen feil, ingen hint. Bare ren logikk." };
  if (fast && a.hintsUsed === 0) return { name: "Skarp Hjerne", description: "Raskere enn forventet, helt uten hjelp." };
  if (a.pace && a.pace.secondHalf < a.pace.firstHalf * 0.6) return { name: "Sluttspurter", description: "Du fant rytmen og løste andre halvdel i rekordfart." };
  if (a.hintsUsed >= 3) return { name: "Nysgjerrig Elev", description: "Du brukte coachen for å lære — det er slik man blir god." };
  return { name: "Stødig Løser", description: "Brettet er løst. Neste gang: færre feil, raskere tid." };
}

function buildInsights(a: {
  hasTimeline: boolean;
  mistakes: number;
  hintsUsed: number;
  elapsed: number;
  expectedSeconds: number;
  hardest: SolvingTechnique | null;
  hardestMastered: SolvingTechnique | null;
  stuck: StuckMoment[];
  boxes: GameAnalysis["boxes"];
  pace: GameAnalysis["pace"];
}): string[] {
  const out: string[] = [];

  if (a.hardest && techniqueRank(a.hardest) >= techniqueRank("naked_pair")) {
    const name = TECHNIQUE_INFO[a.hardest].name;
    out.push(
      a.hardestMastered === a.hardest
        ? `Brettet krevde **${name}** — og du fant den selv.`
        : `Brettet krevde **${name}**, den vanskeligste teknikken på dette brettet.`
    );
  }

  if (a.hasTimeline && a.stuck.length > 0) {
    const s = a.stuck[0];
    const tech = TECHNIQUE_INFO[s.technique].name.toLowerCase();
    out.push(
      `Du satt lengst fast i **boks ${s.box + 1}** (${fmt(s.seconds)}). ` +
        `${cellName(s.cell)} ${s.byHint ? "ble løst med hint" : "låste seg opp"} med ${tech}.`
    );
  }

  if (a.pace && a.pace.firstHalf > 0) {
    const change = 1 - a.pace.secondHalf / a.pace.firstHalf;
    if (change >= 0.25) out.push(`Du løste andre halvdel **${Math.round(change * 100)} % raskere** enn første — du fant rytmen.`);
    else if (change <= -0.25) out.push(`Andre halvdel gikk **${Math.round(-change * 100)} % tregere** — de siste rutene krevde mest.`);
  }

  if (a.mistakes > 1) {
    const worst = [...a.boxes].sort((x, y) => y.mistakes - x.mistakes)[0];
    if (worst.mistakes >= 2) out.push(`**${worst.mistakes} av ${a.mistakes} feil** kom i boks ${worst.box + 1}.`);
  }

  if (a.mistakes === 0 && a.hintsUsed === 0) out.push("**Null feil og null hint.** Rent.");
  else if (a.mistakes === 0) out.push("**Ingen feil** underveis.");

  if (a.elapsed > 0 && a.expectedSeconds > 0) {
    const ratio = a.elapsed / a.expectedSeconds;
    if (ratio <= 0.8) out.push(`Du brukte **${fmt(a.elapsed)}** — under forventet tid på ${fmt(a.expectedSeconds)}.`);
  }

  return out;
}
