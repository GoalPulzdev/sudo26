import type { Difficulty } from "@sudoku-2026/core";
import type { AppStats } from "./statsTypes";

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
  { key: "samurai_win",   emoji: "🥷", name: "Samurai-mester", desc: "Fullfør Samurai Sudoku" },
  { key: "veteran",       emoji: "👑", name: "Veteran",       desc: "50 brett totalt" },
] as const;

export interface WinEvent {
  difficulty: Difficulty;
  timeSecs: number;
  mistakes: number;
}

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

  if (totalWon >= 1) earn("first_win");
  if (event.mistakes === 0) earn("no_mistakes");
  if (event.difficulty === "easy" && event.timeSecs < 180) earn("speed_easy");
  if (event.difficulty === "mini" && event.timeSecs < 90) earn("speed_mini");
  if (stats.currentStreak >= 7) earn("streak_7");
  if (stats.currentStreak >= 30) earn("streak_30");
  if (stats.byDifficulty.hard.won >= 1 || event.difficulty === "hard") earn("killer_win");
  const wonVariants = allDiff.filter((d) => d.won > 0).length;
  if (wonVariants >= 4) earn("all_variants");
  if (event.difficulty === "extreme" || event.difficulty === "daily") earn("samurai_win");
  if (totalWon >= 50) earn("veteran");

  return earned;
}
