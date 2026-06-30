import { getSupabase } from "@/lib/supabase";
import type { Puzzle } from "@sudoku-2026/core";

export interface ChallengeRecord {
  id: string;
  created_by: string;
  creator_username: string | null;
  creator_color: string;
  creator_time_seconds: number;
  puzzle_clues: string;
  puzzle_solution: string;
  puzzle_id: string;
  variant: string;
  difficulty: string;
  killer_cages: unknown | null;
  expires_at: string;
}

export interface ChallengeAttempt {
  id: string;
  user_id: string;
  username: string | null;
  color: string;
  time_seconds: number;
  mistakes: number;
  completed_at: string;
}

/**
 * Create a new challenge from a completed puzzle.
 * Returns the challenge UUID.
 */
export async function createChallenge(
  puzzle: Puzzle,
  userId: string,
  creatorTimeSec: number
): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error("Challenges require Supabase configuration");

  const { data, error } = await sb
    .from("challenges")
    .insert({
      created_by: userId,
      creator_time_seconds: creatorTimeSec,
      puzzle_clues: puzzle.clues,
      puzzle_solution: puzzle.solution,
      puzzle_id: puzzle.id,
      variant: puzzle.variant,
      difficulty: puzzle.difficulty,
      killer_cages: puzzle.killerCages ?? null,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create challenge");
  return data.id as string;
}

/**
 * Fetch a challenge and its top attempts (leaderboard).
 */
export async function getChallenge(
  id: string
): Promise<{ challenge: ChallengeRecord; attempts: ChallengeAttempt[] }> {
  const sb = getSupabase();
  if (!sb) throw new Error("Challenges require Supabase configuration");

  const { data: challengeRaw, error: ce } = await sb
    .from("challenges")
    .select("*, profiles!created_by(username, color)")
    .eq("id", id)
    .single();

  if (ce || !challengeRaw) throw new Error(ce?.message ?? "Challenge not found");

  const profiles = challengeRaw.profiles as { username: string | null; color: string } | null;

  const challenge: ChallengeRecord = {
    ...(challengeRaw as Omit<ChallengeRecord, "creator_username" | "creator_color">),
    creator_username: profiles?.username ?? null,
    creator_color: profiles?.color ?? "#7c3aed",
  };

  const { data: attemptsRaw } = await sb
    .from("challenge_attempts")
    .select("*, profiles!user_id(username, color)")
    .eq("challenge_id", id)
    .order("time_seconds", { ascending: true })
    .limit(10);

  const attempts: ChallengeAttempt[] = (attemptsRaw ?? []).map((a) => {
    const p = a.profiles as { username: string | null; color: string } | null;
    return {
      id: a.id as string,
      user_id: a.user_id as string,
      username: p?.username ?? null,
      color: p?.color ?? "#7c3aed",
      time_seconds: a.time_seconds as number,
      mistakes: a.mistakes as number,
      completed_at: a.completed_at as string,
    };
  });

  return { challenge, attempts };
}

/**
 * Submit a completed challenge attempt.
 */
export async function submitChallengeAttempt(
  challengeId: string,
  userId: string,
  timeSec: number,
  mistakes: number
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Challenges require Supabase configuration");
  const { error } = await sb.from("challenge_attempts").upsert({
    challenge_id: challengeId,
    user_id: userId,
    time_seconds: timeSec,
    mistakes,
  });
  if (error) throw new Error(error.message);
}
