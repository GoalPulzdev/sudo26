/**
 * Curated puzzles: a verified bank + validity-preserving transforms.
 *
 * Random clue removal can't promise a technique level quickly — a "hard"
 * request often needs guessing, and X-Wing puzzles are rare. The bank
 * (`bank.ts`, built offline by `scripts/build-bank.mjs`) holds puzzles that are
 * unique, fully solvable by the coach, and rated exactly their bucket. Each
 * request picks one by seed and applies a random symmetry transform, so the
 * player sees a fresh-looking grid with exactly the promised difficulty —
 * instantly and deterministically.
 */

import type { Difficulty, Puzzle } from "./types.js";
import { PUZZLE_BANK } from "./bank.js";
import { createRng } from "./generator.js";
import { applyTransform, randomTransform } from "./transform.js";
import { solveWithBacktracking } from "./solver.js";
import { rateDifficulty } from "./difficulty.js";

export type CuratedDifficulty = keyof typeof PUZZLE_BANK;

export const CURATED_DIFFICULTIES: CuratedDifficulty[] = ["easy", "medium", "hard", "extreme"];

export function isCuratedDifficulty(d: string): d is CuratedDifficulty {
  return (CURATED_DIFFICULTIES as string[]).includes(d);
}

/** A classic puzzle whose technique-based difficulty is exactly `difficulty`. */
export function createCuratedPuzzle(
  difficulty: CuratedDifficulty,
  seed: string,
  puzzleId: string,
  date?: string
): Puzzle {
  const rng = createRng(seed);
  const list = PUZZLE_BANK[difficulty];
  const base = list[Math.floor(rng() * list.length)];
  const clues = applyTransform(base, randomTransform(rng));
  const solution = solveWithBacktracking(clues);
  if (!solution) throw new Error("curated puzzle has no solution"); // bank.test.ts guards this
  return {
    id: puzzleId,
    variant: "classic",
    difficulty,
    clues,
    solution,
    seed,
    rating: rateDifficulty(clues),
    ...(date ? { date } : {}),
  };
}

/**
 * The daily ramps through the week like a newspaper puzzle: gentle on Monday,
 * hardest on Saturday. Indexed by UTC weekday (0 = Sunday).
 */
const DAILY_SCHEDULE: CuratedDifficulty[] = ["hard", "easy", "medium", "medium", "hard", "hard", "extreme"];

/** Technique level of the daily puzzle for a `YYYY-MM-DD` date. */
export function dailyDifficulty(date: string): CuratedDifficulty {
  return DAILY_SCHEDULE[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

/** Generate a deterministic daily puzzle based on the date string (YYYY-MM-DD). */
export function createDailyPuzzle(date: string): Puzzle {
  const puzzle = createCuratedPuzzle(dailyDifficulty(date), `daily-${date}`, `daily-${date}`, date);
  return { ...puzzle, difficulty: "daily" satisfies Difficulty };
}
