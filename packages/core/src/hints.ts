/**
 * Hint engine — a thin, placement-oriented view of the coach.
 *
 * `getHint` asks the coach for the chain of logical steps that leads to the
 * next placement and folds it into one `Hint`: the cell and (always correct)
 * value to place, the hardest technique the chain needed, the cells involved,
 * and the candidates the chain eliminated along the way.
 *
 * When logic stalls it falls back to `solution_reveal`, which simply reveals a
 * value from the solution. That fallback is NOT AI and is named honestly.
 */

import type { CellValue, Hint, HintStrategy } from "./types.js";
import { coachPlan, cellName, hardestTechnique, rowOf, colOf } from "./coach.js";

/** Given the current board state (81-char string) and puzzle solution, return the best hint. */
export function getHint(currentBoard: string, solution: string): Hint | null {
  if (currentBoard === solution) return null;

  const plan = coachPlan(currentBoard, solution);
  const final = plan.steps[plan.steps.length - 1];

  if (final?.placement) {
    const { cell, value } = final.placement;
    const strategy = hardestTechnique(plan.steps.map((s) => s.technique)) ?? final.technique;
    const lead = plan.steps.slice(0, -1);
    const explanation =
      lead.length > 0
        ? `${lead[lead.length - 1].explanation} Da gjenstår: ${final.explanation}`
        : final.explanation;
    const affected = new Set<number>(plan.steps.flatMap((s) => s.pattern));
    return {
      strategy,
      row: rowOf(cell),
      col: colOf(cell),
      value: value as CellValue,
      explanation,
      affectedCells: [...affected].map((i) => [rowOf(i), colOf(i)] as [number, number]),
      eliminations: lead.flatMap((s) =>
        s.eliminations.map((e) => ({ row: rowOf(e.cell), col: colOf(e.cell), value: e.value as CellValue }))
      ),
    };
  }

  const target =
    plan.reveal ??
    // Board is full but contains mistakes: point at the first wrong value.
    (plan.issues[0] ? { cell: plan.issues[0].cell, value: Number(solution[plan.issues[0].cell]) } : undefined);
  if (!target) return null;
  return {
    strategy: "solution_reveal",
    row: rowOf(target.cell),
    col: colOf(target.cell),
    value: target.value as CellValue,
    explanation: `Fasit: Sett inn **${target.value}** i ${cellName(target.cell)}. Prøv å finne logikken selv neste gang!`,
  };
}

export type { HintStrategy };
