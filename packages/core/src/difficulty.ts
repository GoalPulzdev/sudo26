/**
 * Technique-based difficulty rating.
 *
 * Difficulty is derived from the *logic required to solve*, not the clue count:
 *  - easy    → solvable with singles
 *  - medium  → requires pairs
 *  - hard    → requires pointing / box-line
 *  - extreme → requires X-Wing (or only solvable by guessing)
 */

import type { DifficultyRating, SolvingTechnique } from "./types.js";
import { solveWithLogic } from "./solver.js";

/** Weight of each technique toward the difficulty score. */
const TECHNIQUE_WEIGHT: Record<SolvingTechnique, number> = {
  naked_single: 1,
  hidden_single: 2,
  naked_pair: 4,
  pointing_pair: 6,
  box_line_reduction: 7,
  x_wing: 12,
  guess_required: 20,
};

function labelFor(techniques: SolvingTechnique[]): DifficultyRating["label"] {
  if (techniques.includes("guess_required") || techniques.includes("x_wing")) return "extreme";
  if (techniques.includes("pointing_pair") || techniques.includes("box_line_reduction")) return "hard";
  if (techniques.includes("naked_pair")) return "medium";
  return "easy";
}

function estimateMinutes(score: number): number {
  // Rough heuristic: harder techniques cost more reading/scanning time.
  return Math.max(2, Math.round(2 + score / 4));
}

/**
 * Rate a puzzle by solving it with the logic engine and inspecting which
 * techniques were required.
 */
export function rateDifficulty(clues: string): DifficultyRating {
  const result = solveWithLogic(clues);
  const techniques = result.techniques;

  const score = techniques.reduce((sum, t) => sum + (TECHNIQUE_WEIGHT[t] ?? 0), 0);

  return {
    label: labelFor(techniques),
    score,
    requiredTechniques: techniques,
    estimatedMinutes: estimateMinutes(score),
  };
}
