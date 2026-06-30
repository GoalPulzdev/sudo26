/**
 * Leaderboard data source.
 *
 * Env-gated: when Supabase env vars are present it reads real
 * `leaderboard_entries`; otherwise it returns clearly-labelled seeded mock data
 * so the UI works in local dev without a backend.
 *
 * `isLeaderboardLive()` lets the UI show whether data is real or mock.
 */

import type { LeaderboardEntry } from "@sudoku-2026/core";
import { createRng } from "@sudoku-2026/core";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isLeaderboardLive(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

const NAMES = [
  "NordicSolver", "SudokuMaestro", "GridWizard", "PuzzlePhD",
  "ZenSudoku", "BinaryBrain", "MathMagician", "LogicLord",
  "CryptoSolver", "SudokuSaga", "PuzzleNerd", "NightOwl99",
];

function mockLeaderboard(puzzleId: string, count: number): LeaderboardEntry[] {
  const rng = createRng(`lb-${puzzleId}`);
  return Array.from({ length: count }, (_, i) => {
    const baseTime = 90 + i * 15 + Math.floor(rng() * 30);
    const name = NAMES[Math.floor(rng() * NAMES.length)];
    const date = new Date(Date.now() - Math.floor(rng() * 7 * 86_400_000));
    return {
      userId: `user-${i}`,
      username: name,
      puzzleId,
      elapsed: baseTime,
      mistakes: Math.floor(rng() * 3),
      completedAt: date.toISOString(),
    };
  });
}

async function liveLeaderboard(
  puzzleId: string,
  limit: number
): Promise<LeaderboardEntry[]> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await client
    .from("leaderboard_entries")
    .select("user_id, username, puzzle_id, elapsed_seconds, mistakes, completed_at")
    .eq("puzzle_id", puzzleId)
    .order("elapsed_seconds", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`leaderboard query failed: ${error.message}`);

  return (data ?? []).map((row) => ({
    userId: row.user_id as string,
    username: row.username as string,
    puzzleId: row.puzzle_id as string,
    elapsed: row.elapsed_seconds as number,
    mistakes: row.mistakes as number,
    completedAt: row.completed_at as string,
  }));
}

/** Fetch leaderboard entries, live when configured, mock otherwise. */
export async function getLeaderboard(
  puzzleId: string,
  limit: number
): Promise<{ entries: LeaderboardEntry[]; live: boolean }> {
  if (isLeaderboardLive()) {
    return { entries: await liveLeaderboard(puzzleId, limit), live: true };
  }
  return { entries: mockLeaderboard(puzzleId, limit), live: false };
}
