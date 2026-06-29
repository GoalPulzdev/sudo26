/**
 * Leaderboard API route – GET /api/leaderboard?variant=classic&limit=20
 *
 * In production this should query a real database (Supabase, Postgres, etc.)
 * For now it returns seeded mock data so the UI is fully functional.
 */

import { NextRequest, NextResponse } from "next/server";
import type { LeaderboardEntry } from "@sudoku-2026/core";
import { createRng } from "@sudoku-2026/core";

const NAMES = [
  "NordicSolver", "SudokuMaestro", "GridWizard", "PuzzlePhD",
  "ZenSudoku", "BinaryBrain", "MathMagician", "LogicLord",
  "CryptoSolver", "SudokuSaga", "PuzzleNerd", "NightOwl99",
];

function generateMockLeaderboard(
  puzzleId: string,
  count: number
): LeaderboardEntry[] {
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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const variant = searchParams.get("variant") ?? "classic";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

  const entries = generateMockLeaderboard(`daily-${variant}`, limit);
  return NextResponse.json({ entries }, { status: 200 });
}
