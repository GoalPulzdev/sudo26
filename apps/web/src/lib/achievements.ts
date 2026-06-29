import type { Difficulty } from "@sudoku-2026/core";
import type { AppStats } from "@/store/gameStore";

export interface AchievementDef {
  key: string;
  emoji: string;
  name: string;
  desc: string;
}

export const ACHIEVEMENT_DEFS: readonly AchievementDef[] = [
  { key: "first_win",     emoji: "🏅", name: "Første seier",  desc: "Fullfør ett brett" },
  { key: "no_mistakes",   emoji: "💎", name: "Perfekt spill", desc: "Vinn uten feil" },
  { key: "speed_easy",    emoji: "⚡", name: "Lynrask",       desc: "Classic Easy < 3 min" },
  { key: "speed_mini",    emoji: "🔋", name: "Mini-mester",   desc: "Mini < 90 sek" },
  { key: "streak_7",      emoji: "🔥", name: "Uke-rekke",     desc: "7 dagers streak" },
  { key: "streak_30",     emoji: "🌟", name: "Måneds-rekke",  desc: "30 dagers streak" },
  { key: "killer_win",    emoji: "🔪", name: "Hensynsløs",    desc: "Vinn Killer Sudoku" },
  { key: "all_variants",  emoji: "🎨", name: "Variert",       desc: "Spill alle varianter" },
  { key: "challenge_win", emoji: "🏆", name: "Utfordrer",     desc: "Løs en venneutfordring" },
  { key: "veteran",       emoji: "👑", name: "Veteran",       desc: "50 brett totalt" },
] as const;

export interface WinEvent {
  difficulty: Difficulty;
  timeSecs: number;
  mistakes: number;
  fromChallenge?: boolean;
}

/**
 * Returns the set of newly earned achievement keys given the current stats and
 * an incoming win event. Already-earned keys should be passed in `alreadyEarned`
 * so we don't return duplicates.
 */
export function checkAchievements(
  stats: AppStats,
  event: WinEvent,
  alreadyEarned: Set<string>
): string[] {
  const earned: string[] = [];

  function earn(key: string) {
    if (!alreadyEarned.has(key)) earned.push(key);
  }

  const allDiff = Object.values(stats.byDifficulty) as Array<{ won: number; played: number; bestTime: number | null; totalTime: number }>;
  const totalWon = allDiff.reduce((sum, d) => sum + d.won, 0);

  // first_win: first time winning anything
  if (totalWon >= 1) earn("first_win");

  // no_mistakes
  if (event.mistakes === 0) earn("no_mistakes");

  // speed_easy: Easy < 3 min (180s)
  if (event.difficulty === "easy" && event.timeSecs < 180) earn("speed_easy");

  // speed_mini: Mini < 90s
  if (event.difficulty === "mini" && event.timeSecs < 90) earn("speed_mini");

  // streak_7 / streak_30
  if (stats.currentStreak >= 7) earn("streak_7");
  if (stats.currentStreak >= 30) earn("streak_30");

  // killer_win
  if (event.difficulty === "hard" || stats.byDifficulty.hard.won > 0) {
    // Killer uses "hard" difficulty in the store — check if the board was from killer
    // (we can't distinguish killer from classic hard here without extra info, but
    //  the kill overlay calls recordWin("hard") → mark as earned when any hard won)
    if (stats.byDifficulty.hard.won >= 1) earn("killer_win");
  }

  // all_variants: played at least 1 won game in >= 4 difficulties
  const wonVariants = allDiff.filter((d) => d.won > 0).length;
  if (wonVariants >= 4) earn("all_variants");

  // challenge_win
  if (event.fromChallenge) earn("challenge_win");

  // veteran: 50 total wins
  if (totalWon >= 50) earn("veteran");

  return earned;
}
