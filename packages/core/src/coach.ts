/**
 * Coach engine — step-by-step human logic with full explanations.
 *
 * Where `solver.ts` answers "which techniques does this puzzle need?", the
 * coach answers "what is the *next* thing a human should notice, and why?".
 * Every step carries the cells that form the pattern, the cells that justify
 * it (witnesses), the candidates it removes, and a Norwegian explanation, so a
 * UI can draw the reasoning on the board instead of just revealing a digit.
 *
 * Cells are indexed 0–80, row-major. Digits are 1–9.
 */

import type { SolvingTechnique } from "./types.js";

export type CoachTechnique = Exclude<SolvingTechnique, "guess_required">;

export type HouseKind = "row" | "col" | "box";

export interface House {
  kind: HouseKind;
  index: number;
}

export interface CoachStep {
  technique: CoachTechnique;
  /** Set when the step fills a cell. */
  placement?: { cell: number; value: number };
  /** Candidates the step proves impossible. */
  eliminations: { cell: number; value: number }[];
  /** Cells that form the pattern (the single, the pair, the X-Wing corners…). */
  pattern: number[];
  /** Filled cells whose digit justifies the step (e.g. the 7s that block a box). */
  witnesses: number[];
  /** Digits the step is about. */
  digits: number[];
  /** Houses to highlight. */
  houses: House[];
  /** Points in the right direction without giving the answer away. `**bold**` marks emphasis. */
  nudge: string;
  /** Full reasoning. `**bold**` marks emphasis. */
  explanation: string;
}

export type CoachIssue =
  | { kind: "wrong_value"; cell: number; value: number }
  | { kind: "missing_note"; cell: number; value: number };

export interface CoachPlan {
  /** Problems on the player's board that should be fixed first. */
  issues: CoachIssue[];
  /** Elimination steps (if any) followed by the placement they unlock. */
  steps: CoachStep[];
  /** Set when logic stalls: the cell and value to reveal instead. */
  reveal?: { cell: number; value: number };
}

// ─── Geometry ──────────────────────────────────────────────────────────────────

export function rowOf(i: number): number {
  return Math.floor(i / 9);
}
export function colOf(i: number): number {
  return i % 9;
}
export function boxOf(i: number): number {
  return Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
}

export function houseCells(h: House): number[] {
  const out: number[] = [];
  for (let j = 0; j < 9; j++) {
    if (h.kind === "row") out.push(h.index * 9 + j);
    else if (h.kind === "col") out.push(j * 9 + h.index);
    else {
      const br = Math.floor(h.index / 3) * 3;
      const bc = (h.index % 3) * 3;
      out.push((br + Math.floor(j / 3)) * 9 + bc + (j % 3));
    }
  }
  return out;
}

const HOUSE_NAME: Record<HouseKind, string> = { row: "rad", col: "kolonne", box: "boks" };

export function houseName(h: House): string {
  return `${HOUSE_NAME[h.kind]} ${h.index + 1}`;
}

/** Compact cell label, e.g. `r3k5` (rad 3, kolonne 5). */
export function cellName(i: number): string {
  return `r${rowOf(i) + 1}k${colOf(i) + 1}`;
}

/** Boxes first — that is how most people scan. */
const HOUSES: House[] = [
  ...Array.from({ length: 9 }, (_, index): House => ({ kind: "box", index })),
  ...Array.from({ length: 9 }, (_, index): House => ({ kind: "row", index })),
  ...Array.from({ length: 9 }, (_, index): House => ({ kind: "col", index })),
];
const HOUSE_CELLS = HOUSES.map(houseCells);

const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
  const set = new Set<number>([
    ...houseCells({ kind: "row", index: rowOf(i) }),
    ...houseCells({ kind: "col", index: colOf(i) }),
    ...houseCells({ kind: "box", index: boxOf(i) }),
  ]);
  set.delete(i);
  return [...set];
});

// ─── Candidates ────────────────────────────────────────────────────────────────

export type Candidates = Set<number>[];

export function computeCandidates(grid: number[]): Candidates {
  return grid.map((v, i) => {
    const s = new Set<number>();
    if (v !== 0) return s;
    for (let n = 1; n <= 9; n++) s.add(n);
    for (const p of PEERS[i]) s.delete(grid[p]);
    return s;
  });
}

/** Apply a step to a grid + candidate state (mutates both). */
export function applyStep(grid: number[], cands: Candidates, step: CoachStep): void {
  for (const e of step.eliminations) cands[e.cell].delete(e.value);
  if (step.placement) {
    const { cell, value } = step.placement;
    grid[cell] = value;
    cands[cell].clear();
    for (const p of PEERS[cell]) cands[p].delete(value);
  }
}

/** A filled peer of `cell` holding `digit`, if any. */
function witnessFor(grid: number[], cell: number, digit: number): number | undefined {
  return PEERS[cell].find((p) => grid[p] === digit);
}

// ─── Techniques ────────────────────────────────────────────────────────────────

const BLOCKERS: Record<HouseKind, string> = {
  box: "i samme rad eller kolonne",
  row: "i samme kolonne eller boks",
  col: "i samme rad eller boks",
};

function hiddenSingle(grid: number[], cands: Candidates): CoachStep | null {
  for (let h = 0; h < HOUSES.length; h++) {
    const house = HOUSES[h];
    const cells = HOUSE_CELLS[h];
    for (let n = 1; n <= 9; n++) {
      if (cells.some((i) => grid[i] === n)) continue;
      const spots = cells.filter((i) => grid[i] === 0 && cands[i].has(n));
      if (spots.length !== 1) continue;
      const cell = spots[0];
      const witnesses = new Set<number>();
      for (const other of cells) {
        if (other === cell || grid[other] !== 0) continue;
        const w = witnessFor(grid, other, n);
        if (w !== undefined) witnesses.add(w);
      }
      const where = houseName(house);
      return {
        technique: "hidden_single",
        placement: { cell, value: n },
        eliminations: [],
        pattern: [cell],
        witnesses: [...witnesses],
        digits: [n],
        houses: [house],
        nudge: `Se etter sifferet **${n}** i ${where}.`,
        explanation:
          `${capitalize(where)} mangler en **${n}**. Alle de andre ledige rutene er blokkert ` +
          `av en ${n} ${BLOCKERS[house.kind]} — så den må stå i **${cellName(cell)}**.`,
      };
    }
  }
  return null;
}

function nakedSingle(grid: number[], cands: Candidates): CoachStep | null {
  for (let cell = 0; cell < 81; cell++) {
    if (grid[cell] !== 0 || cands[cell].size !== 1) continue;
    const value = [...cands[cell]][0];
    const seen = [...new Set(PEERS[cell].map((p) => grid[p]).filter((v) => v !== 0))].sort();
    const witnesses: number[] = [];
    for (const d of seen) {
      const w = witnessFor(grid, cell, d);
      if (w !== undefined) witnesses.push(w);
    }
    return {
      technique: "naked_single",
      placement: { cell, value },
      eliminations: [],
      pattern: [cell],
      witnesses,
      digits: [value],
      houses: [
        { kind: "row", index: rowOf(cell) },
        { kind: "col", index: colOf(cell) },
        { kind: "box", index: boxOf(cell) },
      ],
      nudge: `Én rute i boks ${boxOf(cell) + 1} har bare ett mulig siffer igjen.`,
      explanation:
        seen.length === 8
          ? `Rad ${rowOf(cell) + 1}, kolonne ${colOf(cell) + 1} og boks ${boxOf(cell) + 1} inneholder ` +
            `til sammen alle sifre unntatt ett. **${cellName(cell)}** kan bare være **${value}**.`
          : `Alle andre kandidater i **${cellName(cell)}** er utelukket. Den kan bare være **${value}**.`,
    };
  }
  return null;
}

function nakedPair(grid: number[], cands: Candidates): CoachStep | null {
  for (let h = 0; h < HOUSES.length; h++) {
    const house = HOUSES[h];
    const cells = HOUSE_CELLS[h];
    const twos = cells.filter((i) => grid[i] === 0 && cands[i].size === 2);
    for (let a = 0; a < twos.length; a++) {
      for (let b = a + 1; b < twos.length; b++) {
        const [x, y] = [...cands[twos[a]]].sort();
        if (!cands[twos[b]].has(x) || !cands[twos[b]].has(y)) continue;
        const eliminations: CoachStep["eliminations"] = [];
        for (const i of cells) {
          if (i === twos[a] || i === twos[b] || grid[i] !== 0) continue;
          for (const v of [x, y]) if (cands[i].has(v)) eliminations.push({ cell: i, value: v });
        }
        if (eliminations.length === 0) continue;
        const where = houseName(house);
        return {
          technique: "naked_pair",
          eliminations,
          pattern: [twos[a], twos[b]],
          witnesses: [],
          digits: [x, y],
          houses: [house],
          nudge: `To ruter i ${where} deler nøyaktig de samme to kandidatene.`,
          explanation:
            `**${cellName(twos[a])}** og **${cellName(twos[b])}** kan begge bare være **${x}** eller **${y}**. ` +
            `De to sifrene må altså fordele seg på akkurat disse to rutene, og kan fjernes fra resten av ${where}.`,
        };
      }
    }
  }
  return null;
}

function pointingPair(grid: number[], cands: Candidates): CoachStep | null {
  for (let b = 0; b < 9; b++) {
    const box = houseCells({ kind: "box", index: b });
    for (let n = 1; n <= 9; n++) {
      const spots = box.filter((i) => grid[i] === 0 && cands[i].has(n));
      if (spots.length < 2 || spots.length > 3) continue;
      const rows = new Set(spots.map(rowOf));
      const cols = new Set(spots.map(colOf));
      let line: House | null = null;
      if (rows.size === 1) line = { kind: "row", index: [...rows][0] };
      else if (cols.size === 1) line = { kind: "col", index: [...cols][0] };
      if (!line) continue;
      const eliminations = houseCells(line)
        .filter((i) => boxOf(i) !== b && grid[i] === 0 && cands[i].has(n))
        .map((cell) => ({ cell, value: n }));
      if (eliminations.length === 0) continue;
      const lineName = houseName(line);
      return {
        technique: "pointing_pair",
        eliminations,
        pattern: spots,
        witnesses: [],
        digits: [n],
        houses: [{ kind: "box", index: b }, line],
        nudge: `Se hvor **${n}** kan stå i boks ${b + 1}.`,
        explanation:
          `I boks ${b + 1} kan **${n}** bare stå i ${lineName}. Uansett hvilken av rutene den havner i, ` +
          `bruker den opp ${n}-eren til ${lineName} — så **${n}** kan fjernes fra resten av ${lineName}.`,
      };
    }
  }
  return null;
}

function boxLineReduction(grid: number[], cands: Candidates): CoachStep | null {
  for (let h = 9; h < HOUSES.length; h++) {
    const line = HOUSES[h];
    const cells = HOUSE_CELLS[h];
    for (let n = 1; n <= 9; n++) {
      const spots = cells.filter((i) => grid[i] === 0 && cands[i].has(n));
      if (spots.length < 2) continue;
      const boxes = new Set(spots.map(boxOf));
      if (boxes.size !== 1) continue;
      const b = [...boxes][0];
      const eliminations = houseCells({ kind: "box", index: b })
        .filter((i) => !cells.includes(i) && grid[i] === 0 && cands[i].has(n))
        .map((cell) => ({ cell, value: n }));
      if (eliminations.length === 0) continue;
      const lineName = houseName(line);
      return {
        technique: "box_line_reduction",
        eliminations,
        pattern: spots,
        witnesses: [],
        digits: [n],
        houses: [line, { kind: "box", index: b }],
        nudge: `Se hvor **${n}** kan stå i ${lineName}.`,
        explanation:
          `I ${lineName} kan **${n}** bare stå inne i boks ${b + 1}. Da er boksens ${n} låst til ${lineName}, ` +
          `og **${n}** kan fjernes fra de andre rutene i boks ${b + 1}.`,
      };
    }
  }
  return null;
}

function xWing(grid: number[], cands: Candidates): CoachStep | null {
  for (const [baseKind, coverKind] of [["row", "col"], ["col", "row"]] as const) {
    for (let n = 1; n <= 9; n++) {
      const positions: number[][] = [];
      for (let k = 0; k < 9; k++) {
        positions[k] = houseCells({ kind: baseKind, index: k })
          .filter((i) => grid[i] === 0 && cands[i].has(n))
          .map((i) => (coverKind === "col" ? colOf(i) : rowOf(i)));
      }
      for (let a = 0; a < 9; a++) {
        if (positions[a].length !== 2) continue;
        for (let b = a + 1; b < 9; b++) {
          if (positions[b].length !== 2) continue;
          if (positions[a][0] !== positions[b][0] || positions[a][1] !== positions[b][1]) continue;
          const [c1, c2] = positions[a];
          const at = (base: number, cover: number) => (baseKind === "row" ? base * 9 + cover : cover * 9 + base);
          const corners = [at(a, c1), at(a, c2), at(b, c1), at(b, c2)];
          const eliminations: CoachStep["eliminations"] = [];
          for (const cover of [c1, c2]) {
            for (const i of houseCells({ kind: coverKind, index: cover })) {
              if (corners.includes(i) || grid[i] !== 0 || !cands[i].has(n)) continue;
              eliminations.push({ cell: i, value: n });
            }
          }
          if (eliminations.length === 0) continue;
          const base = baseKind === "row" ? "rad" : "kolonne";
          const cover = coverKind === "row" ? "rad" : "kolonne";
          const coverPair = `${cover} ${c1 + 1} og ${c2 + 1}`;
          return {
            technique: "x_wing",
            eliminations,
            pattern: corners,
            witnesses: [],
            digits: [n],
            houses: [
              { kind: baseKind, index: a },
              { kind: baseKind, index: b },
              { kind: coverKind, index: c1 },
              { kind: coverKind, index: c2 },
            ],
            nudge: `Sifferet **${n}** danner et rektangel over to ${baseKind === "row" ? "rader" : "kolonner"}.`,
            explanation:
              `I ${base} ${a + 1} og ${base} ${b + 1} kan **${n}** bare stå i ${coverPair}. ` +
              `Enten står de to ${n}-erne på den ene diagonalen eller den andre — begge veier dekker de ` +
              `${coverPair}. **${n}** kan derfor fjernes fra resten av ${coverPair}.`,
          };
        }
      }
    }
  }
  return null;
}

const TECHNIQUES: [CoachTechnique, (g: number[], c: Candidates) => CoachStep | null][] = [
  ["hidden_single", hiddenSingle],
  ["naked_single", nakedSingle],
  ["naked_pair", nakedPair],
  ["pointing_pair", pointingPair],
  ["box_line_reduction", boxLineReduction],
  ["x_wing", xWing],
];

/**
 * The easiest logical step available, or null if logic stalls (or the grid is full).
 * `maxTechnique` limits the search to techniques up to and including that one.
 */
export function findNextStep(grid: number[], cands: Candidates, maxTechnique?: CoachTechnique): CoachStep | null {
  const limit = maxTechnique ? TECHNIQUE_RANK[maxTechnique] : Infinity;
  for (const [technique, fn] of TECHNIQUES) {
    if (TECHNIQUE_RANK[technique] > limit) break;
    const step = fn(grid, cands);
    if (step) return step;
  }
  return null;
}

// ─── Plans & paths ─────────────────────────────────────────────────────────────

const TECHNIQUE_RANK: Record<SolvingTechnique, number> = {
  hidden_single: 0,
  naked_single: 1,
  naked_pair: 2,
  pointing_pair: 3,
  box_line_reduction: 4,
  x_wing: 5,
  guess_required: 6,
};

export function techniqueRank(t: SolvingTechnique): number {
  return TECHNIQUE_RANK[t];
}

export function hardestTechnique<T extends SolvingTechnique>(ts: T[]): T | undefined {
  return ts.reduce<T | undefined>((a, t) => (a === undefined || TECHNIQUE_RANK[t] > TECHNIQUE_RANK[a] ? t : a), undefined);
}

/** A safety cap: no real puzzle needs this many eliminations before a placement. */
const MAX_STEPS = 400;

/**
 * Coach the player from their current board to the next placement.
 *
 * @param board    81 chars, the player's current values ('0' = empty)
 * @param solution 81 chars
 * @param notes    optional pencil marks per cell, to catch notes that exclude the answer
 */
export function coachPlan(board: string, solution: string, notes?: ReadonlyArray<Iterable<number> | null>): CoachPlan {
  const grid = board.split("").map(Number);
  const sol = solution.split("").map(Number);
  const issues: CoachIssue[] = [];

  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0 && grid[i] !== sol[i]) {
      issues.push({ kind: "wrong_value", cell: i, value: grid[i] });
      grid[i] = 0; // reason from the correct part of the board
    }
  }
  if (notes) {
    for (let i = 0; i < 81; i++) {
      if (grid[i] !== 0 || board[i] !== "0") continue;
      const marks = notes[i] ? [...notes[i]!] : [];
      if (marks.length > 0 && !marks.includes(sol[i])) {
        issues.push({ kind: "missing_note", cell: i, value: sol[i] });
      }
    }
  }

  const cands = computeCandidates(grid);
  const steps: CoachStep[] = [];
  if (!grid.includes(0)) return { issues, steps };

  while (steps.length < MAX_STEPS) {
    const step = findNextStep(grid, cands);
    if (!step) break;
    if (step.placement && step.placement.value !== sol[step.placement.cell]) break; // non-unique puzzle
    steps.push(step);
    applyStep(grid, cands, step);
    if (step.placement) return { issues, steps };
  }

  // Logic stalled: reveal the most constrained empty cell.
  let best = -1;
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    if (best === -1 || cands[i].size < cands[best].size) best = i;
  }
  return { issues, steps: [], reveal: best === -1 ? undefined : { cell: best, value: sol[best] } };
}

export interface SolvePath {
  steps: CoachStep[];
  solved: boolean;
  /**
   * For each cell that starts empty: the hardest technique needed to place it,
   * counting the eliminations since the previous placement. `guess_required`
   * for cells logic could not reach. null for givens.
   */
  cellTechnique: (SolvingTechnique | null)[];
}

/**
 * Solve from the clues with the coach's techniques, recording every step.
 * `maxTechnique` restricts which techniques may be used.
 */
export function solvePath(clues: string, opts: { maxTechnique?: CoachTechnique } = {}): SolvePath {
  const grid = clues.split("").map(Number);
  const cands = computeCandidates(grid);
  const steps: CoachStep[] = [];
  const cellTechnique: (SolvingTechnique | null)[] = grid.map(() => null);
  let pending: CoachTechnique[] = [];

  while (grid.includes(0) && steps.length < 81 * 20) {
    const step = findNextStep(grid, cands, opts.maxTechnique);
    if (!step) break;
    steps.push(step);
    applyStep(grid, cands, step);
    pending.push(step.technique);
    if (step.placement) {
      cellTechnique[step.placement.cell] = hardestTechnique(pending) ?? step.technique;
      pending = [];
    }
  }

  const solved = !grid.includes(0);
  for (let i = 0; i < 81; i++) if (grid[i] === 0) cellTechnique[i] = "guess_required";
  return { steps, solved, cellTechnique };
}

// ─── Technique catalogue ───────────────────────────────────────────────────────

export const TECHNIQUE_INFO: Record<SolvingTechnique, { name: string; summary: string }> = {
  hidden_single: {
    name: "Skjult singel",
    summary: "Et siffer har bare én mulig plass i en rad, kolonne eller boks.",
  },
  naked_single: {
    name: "Naken singel",
    summary: "En rute har bare ett mulig siffer igjen.",
  },
  naked_pair: {
    name: "Nakent par",
    summary: "To ruter i samme enhet deler de samme to kandidatene — de sifrene kan fjernes fra resten.",
  },
  pointing_pair: {
    name: "Pekende par",
    summary: "Et siffer i en boks er låst til én linje — det kan fjernes fra resten av linjen.",
  },
  box_line_reduction: {
    name: "Boks/linje-reduksjon",
    summary: "Et siffer i en linje er låst til én boks — det kan fjernes fra resten av boksen.",
  },
  x_wing: {
    name: "X-Wing",
    summary: "Et siffer danner et rektangel over to linjer — det kan fjernes fra kryssende linjer.",
  },
  guess_required: {
    name: "Prøving og feiling",
    summary: "Krever teknikker utover det coachen kan, eller gjetting.",
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
