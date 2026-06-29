import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GameState, Puzzle, CellValue, Difficulty } from "@sudoku-2026/core";
import { boardFromPuzzle, gameReducer, type GameAction } from "@sudoku-2026/core";
import { checkAchievements } from "../lib/achievements";
import type { DifficultyStats, AppStats } from "../lib/statsTypes";

export type { DifficultyStats, AppStats };

function emptyDiffStats(): DifficultyStats {
  return { played: 0, won: 0, bestTime: null, totalTime: 0 };
}

function emptyStats(): AppStats {
  return {
    byDifficulty: {
      easy: emptyDiffStats(),
      medium: emptyDiffStats(),
      hard: emptyDiffStats(),
      extreme: emptyDiffStats(),
      daily: emptyDiffStats(),
      mini: emptyDiffStats(),
    },
    currentStreak: 0,
    bestStreak: 0,
    lastWonDate: null,
  };
}

interface GameStore {
  game: GameState | null;
  stats: AppStats;
  earnedAchievements: string[];
  pendingAchievement: string | null;
  loadPuzzle: (puzzle: Puzzle) => void;
  dispatch: (action: GameAction) => void;
  clearGame: () => void;
  recordWin: (difficulty: Difficulty, elapsed: number, mistakes: number) => void;
  dismissAchievement: () => void;
}

function buildInitialState(puzzle: Puzzle): GameState {
  return {
    puzzle,
    board: boardFromPuzzle(puzzle.clues, puzzle.solution),
    elapsed: 0,
    mistakes: 0,
    hintsUsed: 0,
    status: "playing",
    selectedCell: null,
    noteMode: false,
    history: [],
  };
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: null,
      stats: emptyStats(),
      earnedAchievements: [],
      pendingAchievement: null,

      loadPuzzle: (puzzle) => {
        set({ game: buildInitialState(puzzle) });
      },

      dispatch: (action) => {
        const { game } = get();
        if (!game) return;
        const next = gameReducer(game, action);
        set({ game: next });
        if (game.status !== "won" && next.status === "won") {
          get().recordWin(next.puzzle.difficulty, next.elapsed, next.mistakes);
        }
      },

      recordWin: (difficulty, elapsed, mistakes) => {
        set((state) => {
          const stats = { ...state.stats };
          const ds = { ...stats.byDifficulty[difficulty] };
          ds.played += 1;
          ds.won += 1;
          ds.totalTime += elapsed;
          if (ds.bestTime === null || elapsed < ds.bestTime) ds.bestTime = elapsed;
          stats.byDifficulty = { ...stats.byDifficulty, [difficulty]: ds };

          const today = todayStr();
          const prevDate = stats.lastWonDate;
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          if (prevDate !== today) {
            stats.currentStreak = (prevDate === yesterday) ? stats.currentStreak + 1 : 1;
            stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
            stats.lastWonDate = today;
          }

          const alreadyEarned = new Set(state.earnedAchievements);
          const newlyEarned = checkAchievements(stats, { difficulty, timeSecs: elapsed, mistakes }, alreadyEarned);
          const earnedAchievements = [...state.earnedAchievements, ...newlyEarned];
          const pendingAchievement = newlyEarned.length > 0 ? newlyEarned[0] : state.pendingAchievement;

          return { stats, earnedAchievements, pendingAchievement };
        });
      },

      clearGame: () => set({ game: null }),
      dismissAchievement: () => set({ pendingAchievement: null }),
    }),
    {
      name: "sudoku-game-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
