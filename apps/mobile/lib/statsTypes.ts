/** Shared stats types used by both gameStore and achievements */

export interface DifficultyStats {
  played: number;
  won: number;
  bestTime: number | null;
  totalTime: number;
}

export interface AppStats {
  byDifficulty: Record<string, DifficultyStats>;
  currentStreak: number;
  bestStreak: number;
  lastWonDate: string | null;
}
