"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GameState, Puzzle, CellValue, Difficulty } from "@sudoku-2026/core";
import {
  boardFromPuzzle,
  gameReducer,
  type GameAction,
} from "@sudoku-2026/core";
import { checkAchievements } from "@/lib/achievements";

export interface DifficultyStats {
  played: number;
  won: number;
  bestTime: number | null; // seconds
  totalTime: number;
}

export interface AppStats {
  byDifficulty: Record<Difficulty, DifficultyStats>;
  currentStreak: number;
  bestStreak: number;
  lastWonDate: string | null; // ISO date string YYYY-MM-DD
}

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
  earnedAchievements: Set<string>;
  loadPuzzle: (puzzle: Puzzle) => void;
  dispatch: (action: GameAction) => void;
  clearGame: () => void;
  recordWin: (difficulty: Difficulty, elapsed: number) => void;
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
      earnedAchievements: new Set<string>(),

      loadPuzzle: (puzzle) => {
        set({ game: buildInitialState(puzzle) });
      },

      dispatch: (action) => {
        const { game } = get();
        if (!game) return;
        const next = gameReducer(game, action);
        set({ game: next });
        // Auto-record win when game transitions to "won"
        if (game.status !== "won" && next.status === "won") {
          get().recordWin(next.puzzle.difficulty, next.elapsed);
        }
      },

      recordWin: (difficulty, elapsed) => {
        set((state) => {
          const stats = { ...state.stats };
          const ds = { ...stats.byDifficulty[difficulty] };
          ds.played += 1;
          ds.won += 1;
          ds.totalTime += elapsed;
          ds.bestTime = ds.bestTime === null ? elapsed : Math.min(ds.bestTime, elapsed);
          stats.byDifficulty = { ...stats.byDifficulty, [difficulty]: ds };

          // Streak: increment if last win was yesterday or today
          const today = todayStr();
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          if (stats.lastWonDate === today) {
            // already counted today
          } else if (stats.lastWonDate === yesterday || stats.lastWonDate === null) {
            stats.currentStreak += 1;
          } else {
            stats.currentStreak = 1;
          }
          stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
          stats.lastWonDate = today;

          // Check achievements (fire-and-forget to avoid blocking state update)
          const earned = state.earnedAchievements ?? new Set<string>();
          const newKeys = checkAchievements(stats, { difficulty, timeSecs: elapsed, mistakes: 0 }, earned);
          if (newKeys.length > 0) {
            setTimeout(async () => {
              const { triggerAchievementToast } = await import("@/components/AchievementToast");
              newKeys.forEach((k) => triggerAchievementToast(k));
            }, 300);
          }

          return {
            stats,
            earnedAchievements: new Set([...earned, ...newKeys]),
          };
        });
      },

      clearGame: () => set({ game: null }),
    }),
    {
      name: "sudoku-game-v2",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return window.localStorage;
      }),
      partialize: (state) => ({
        stats: state.stats,
        game: state.game
          ? {
              ...state.game,
              selectedCell: null,
              board: state.game.board.map((row) =>
                row.map((cell) => ({
                  ...cell,
                  highlighted: false,
                  notes: Array.from(cell.notes),
                }))
              ),
            }
          : null,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<GameStore> | null;
        const base = { ...current };
        if (p?.stats) base.stats = p.stats;
        if (!p?.game) return base;
        const game = p.game as GameState & {
          board: Array<Array<{ notes: CellValue[] | Set<CellValue> }>>;
        };
        return {
          ...base,
          game: {
            ...game,
            board: game.board.map((row) =>
              row.map((cell) => ({
                ...cell,
                notes: new Set(cell.notes),
              }))
            ),
          },
        };
      },
    }
  )
);

export type { CellValue, GameState, Puzzle };
