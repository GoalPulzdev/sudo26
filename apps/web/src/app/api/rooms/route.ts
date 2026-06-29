/**
 * Multiplayer room management API
 * POST /api/rooms        – create a room
 * GET  /api/rooms/:id    – get room state
 * POST /api/rooms/:id/join – join a room
 *
 * In production, use a real-time backend (e.g. Supabase Realtime, Ably, Pusher).
 * This in-memory store is suitable for a single-server dev environment.
 */

import { NextRequest, NextResponse } from "next/server";
import type { MultiplayerRoom, MultiplayerPlayer, Puzzle } from "@sudoku-2026/core";
import { createDailyPuzzle, todayString } from "@sudoku-2026/core";

// ─── In-memory room store (replace with Redis/DB in production) ───────────────
const rooms = new Map<string, MultiplayerRoom>();
const puzzles = new Map<string, Puzzle>();

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    username?: string;
    userId?: string;
  };

  const userId = body.userId ?? `anon-${Math.random().toString(36).slice(2, 8)}`;
  const username = body.username ?? "Anonym";

  const puzzle = createDailyPuzzle(todayString());
  const roomId = generateRoomCode();

  const host: MultiplayerPlayer = {
    id: userId,
    username,
    progress: 0,
    finished: false,
  };

  const room: MultiplayerRoom = {
    id: roomId,
    puzzleId: puzzle.id,
    players: [host],
    status: "waiting",
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);
  puzzles.set(roomId, puzzle);

  // Return room + puzzle so client can start playing
  return NextResponse.json({ room, puzzle }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing room id" }, { status: 400 });
  }
  const roomKey = id.toUpperCase();
  const room = rooms.get(roomKey);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  const puzzle = puzzles.get(roomKey) ?? null;
  return NextResponse.json({ room, puzzle }, { status: 200 });
}
