"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CellValue, CoachPlan, CoachStep, GameState, Hint } from "@sudoku-2026/core";
import { boardToString, coachPlan, houseCells } from "@sudoku-2026/core";
import { useGameStore } from "@/store/gameStore";
import type { CoachOverlay } from "@/components/SudokuBoard";

export interface CoachSession {
  plan: CoachPlan;
  /** Index into `plan.steps`. */
  step: number;
  /** 1 = nudge (where to look), 2 = full reasoning drawn on the board. */
  level: 1 | 2;
  /** Board the plan was computed for; any other change closes the coach. */
  boardKey: string;
}

export type CoachView =
  | { kind: "issues"; wrong: number[]; wrongValues: number[] }
  | { kind: "step"; step: CoachStep; index: number; total: number; level: 1 | 2 }
  | { kind: "reveal"; cell: number; value: number; level: 1 | 2 };

function planFor(game: GameState): CoachPlan {
  return coachPlan(
    boardToString(game.board),
    game.puzzle.solution,
    game.board.flat().map((c) => c.notes)
  );
}

const cellRC = (i: number) => ({ row: Math.floor(i / 9), col: i % 9 });

/**
 * The coach: a three-level hint.
 *  1. nudge – highlights where to look,
 *  2. reasoning – draws the pattern, witnesses and eliminations on the board,
 *  3. action – places the digit (or removes the eliminated notes and moves on).
 *
 * Opening the coach counts as one hint; walking through its steps does not.
 */
export function useCoach() {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const [session, setSession] = useState<CoachSession | null>(null);
  const boardKey = game ? boardToString(game.board) : "";

  // The player changed a value themselves: the plan is stale.
  useEffect(() => {
    if (session && session.boardKey !== boardKey) setSession(null);
  }, [boardKey, session]);

  // New puzzle or game over.
  useEffect(() => {
    setSession(null);
  }, [game?.puzzle.id]);
  useEffect(() => {
    if (game?.status === "won") setSession(null);
  }, [game?.status]);

  const view: CoachView | null = useMemo(() => {
    if (!session) return null;
    const { plan, step, level } = session;
    const wrong = plan.issues.filter((i) => i.kind === "wrong_value");
    if (wrong.length > 0) {
      return { kind: "issues", wrong: wrong.map((w) => w.cell), wrongValues: wrong.map((w) => w.value) };
    }
    if (plan.steps[step]) {
      return { kind: "step", step: plan.steps[step], index: step, total: plan.steps.length, level };
    }
    if (plan.reveal) return { kind: "reveal", cell: plan.reveal.cell, value: plan.reveal.value, level };
    return null;
  }, [session]);

  const missingNotes = useMemo(
    () => session?.plan.issues.filter((i) => i.kind === "missing_note").map((i) => i.cell) ?? [],
    [session]
  );

  const open = useCallback(() => {
    if (!game || game.status !== "playing") return;
    const plan = planFor(game);
    if (plan.steps.length === 0 && !plan.reveal && plan.issues.length === 0) return;
    dispatch({ type: "USE_HINT" });
    setSession({ plan, step: 0, level: 1, boardKey });
  }, [game, dispatch, boardKey]);

  const close = useCallback(() => setSession(null), []);

  const explain = useCallback(() => {
    setSession((s) => (s ? { ...s, level: 2 } : s));
  }, []);

  const fixIssues = useCallback(() => {
    if (!session) return;
    for (const issue of session.plan.issues) {
      if (issue.kind === "wrong_value") dispatch({ type: "CLEAR_CELL", ...cellRC(issue.cell) });
    }
    const next = useGameStore.getState().game;
    if (!next) return setSession(null);
    const plan = planFor(next);
    setSession({ plan, step: 0, level: 1, boardKey: boardToString(next.board) });
  }, [session, dispatch]);

  /** The primary action for the current view. */
  const act = useCallback(() => {
    if (!session || !view || !game) return;
    if (view.kind === "issues") return fixIssues();
    if (view.kind === "reveal") {
      dispatch({ type: "APPLY_HINT", ...cellRC(view.cell), value: view.value as CellValue, counted: true });
      return setSession(null);
    }
    const { step } = view;
    if (step.placement) {
      const { cell, value } = step.placement;
      dispatch({ type: "APPLY_HINT", ...cellRC(cell), value: value as CellValue, counted: true });
      return setSession(null);
    }
    // Elimination step: clear the proven-impossible marks the player has noted, then move on.
    const notes = step.eliminations
      .filter((e) => game.board[Math.floor(e.cell / 9)][e.cell % 9].notes.has(e.value as CellValue))
      .map((e) => ({ ...cellRC(e.cell), value: e.value as CellValue }));
    if (notes.length > 0) dispatch({ type: "REMOVE_NOTES", notes });
    setSession((s) => (s ? { ...s, step: s.step + 1, level: 2 } : s));
  }, [session, view, game, dispatch, fixIssues]);

  /** Hint button / "h" key: open, then explain, then act. */
  const advance = useCallback(() => {
    if (!session) return open();
    if (view && view.kind !== "issues" && view.level === 1) return explain();
    act();
  }, [session, view, open, explain, act]);

  const overlay: CoachOverlay | null = useMemo(() => {
    if (!view) return null;
    const empty: CoachOverlay = {
      houses: new Set(),
      pattern: new Set(),
      witnesses: new Set(),
      target: null,
      patternDigits: [],
      eliminations: new Map(),
      issues: new Set(),
    };
    if (view.kind === "issues") return { ...empty, issues: new Set(view.wrong) };
    if (view.kind === "reveal") {
      const box = Math.floor(view.cell / 27) * 3 + Math.floor((view.cell % 9) / 3);
      return view.level === 1
        ? { ...empty, houses: new Set(houseCells({ kind: "box", index: box })) }
        : { ...empty, target: view.cell };
    }
    const { step, level } = view;
    const houses = new Set(step.houses.flatMap(houseCells));
    if (level === 1) return { ...empty, houses };
    const eliminations = new Map<number, number[]>();
    for (const e of step.eliminations) eliminations.set(e.cell, [...(eliminations.get(e.cell) ?? []), e.value]);
    return {
      ...empty,
      houses,
      pattern: new Set(step.placement ? [] : step.pattern),
      patternDigits: step.placement ? [] : step.digits,
      witnesses: new Set(step.witnesses),
      target: step.placement?.cell ?? null,
      eliminations,
    };
  }, [view]);

  /** Legacy `Hint` for custom boards (e.g. Killer) that only know a single hint cell. */
  const hint: Hint | null = useMemo(() => {
    if (overlay?.target == null || !view || view.kind === "issues") return null;
    const value = view.kind === "reveal" ? view.value : view.step.placement?.value ?? 0;
    return {
      strategy: view.kind === "reveal" ? "solution_reveal" : view.step.technique,
      ...cellRC(overlay.target),
      value: value as CellValue,
      explanation: view.kind === "reveal" ? "" : view.step.explanation,
    };
  }, [overlay, view]);

  return { view, missingNotes, overlay, hint, open, close, explain, act, advance };
}
