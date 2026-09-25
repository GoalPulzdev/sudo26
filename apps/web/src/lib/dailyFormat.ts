import type { CellOutcome, CuratedDifficulty, DailyResult } from "@sudoku-2026/core";
import { formatClock } from "@sudoku-2026/core";

/**
 * Result-grid colours, validated for colour-vision deficiency (all pairs ΔE ≥ 19)
 * against the paper surface. Gold is low-contrast, so every rendering carries a
 * labelled legend. `given` is structural ink, not a category.
 */
export const OUTCOME_COLORS: Record<CellOutcome, string> = {
  given: "#2c3a4f",
  clean: "#4f78c4",
  hint: "#d0a23a",
  mistake: "#b8474a",
};

export const OUTCOME_LABELS: Record<Exclude<CellOutcome, "given">, string> = {
  clean: "egen logikk",
  hint: "hint",
  mistake: "feil",
};

export const LEVEL_RANK: Record<CuratedDifficulty, number> = { easy: 1, medium: 2, hard: 3, extreme: 4 };

/** "Lørdag 26. september" (UTC, so it matches the puzzle date everywhere). */
export function dailyDateLabel(date: string): string {
  const s = new Date(`${date}T00:00:00Z`).toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Short stat phrases: "Feilfri", "1 hint", "12 dager på rad". */
export function resultBadges(r: DailyResult): string[] {
  return [
    r.mistakes === 0 ? "Feilfri" : `${r.mistakes} feil`,
    r.hintsUsed === 0 ? "Uten hint" : `${r.hintsUsed} hint`,
    ...(r.streak > 1 ? [`${r.streak} dager på rad`] : []),
  ];
}

export { formatClock };
