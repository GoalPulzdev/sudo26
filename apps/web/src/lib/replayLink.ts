"use client";

import { useMemo } from "react";
import { encodeReplay, replayFromGame } from "@sudoku-2026/core";
import { useGameStore } from "@/store/gameStore";
import { useAuthStore } from "@/store/authStore";

/**
 * Replay code for the current finished game, or null when the game can't be
 * replayed (not won, no move log, or a puzzle that can't be rebuilt from a
 * seed — e.g. Killer). Drives `/replay/<code>` and `/duel/<code>`.
 * `forPuzzleId` restricts it to one puzzle, for pages that may hold another game.
 */
export function useOwnReplayCode(forPuzzleId?: string): string | null {
  const game = useGameStore((s) => s.game);
  const name = useAuthStore((s) => s.profile?.username ?? undefined);
  return useMemo(() => {
    if (!game || game.status !== "won") return null;
    if (forPuzzleId && game.puzzle.id !== forPuzzleId) return null;
    const replay = replayFromGame(game.puzzle, game.moves, game.elapsed, name ?? undefined);
    return replay ? encodeReplay(replay) : null;
  }, [game, name, forPuzzleId]);
}

/** Stable, short id for a duel so reloading the page resumes the same game. */
export function duelPuzzleId(code: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < code.length; i++) h = Math.imul(h ^ code.charCodeAt(i), 0x01000193);
  return `duel-${(h >>> 0).toString(36)}`;
}
