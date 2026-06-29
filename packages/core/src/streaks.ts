/**
 * Streak & daily challenge utilities.
 * Pure functions – storage is handled by the app layer.
 */

import type { StreakData } from "./types.js";

/** Returns today's date as YYYY-MM-DD in local time */
export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round(Math.abs(da - db) / 86_400_000);
}

/** Record a completed daily puzzle and recalculate streak */
export function recordCompletion(
  data: StreakData,
  date: string = todayString()
): StreakData {
  if (data.completedDates.includes(date)) return data;

  const newDates = [...data.completedDates, date].sort();
  const last = data.lastCompletedDate;
  const gap = last ? daysBetween(last, date) : null;

  const currentStreak =
    gap === null || gap === 1
      ? data.currentStreak + 1
      : gap === 0
      ? data.currentStreak
      : 1;

  return {
    ...data,
    currentStreak,
    longestStreak: Math.max(currentStreak, data.longestStreak),
    lastCompletedDate: date,
    completedDates: newDates,
  };
}

export function createEmptyStreak(userId: string): StreakData {
  return {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    completedDates: [],
  };
}
