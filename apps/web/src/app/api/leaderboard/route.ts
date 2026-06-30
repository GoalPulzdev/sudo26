/**
 * Leaderboard API — GET /api/leaderboard?variant=classic&limit=20
 *
 * Data comes from `getLeaderboard`, which reads real Supabase
 * `leaderboard_entries` when env is configured and falls back to seeded mock
 * data otherwise. The response includes `live` so the UI can label mock data.
 */

import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboardSource";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const variant = searchParams.get("variant") ?? "classic";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

  try {
    const { entries, live } = await getLeaderboard(`daily-${variant}`, limit);
    return NextResponse.json({ entries, live }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
