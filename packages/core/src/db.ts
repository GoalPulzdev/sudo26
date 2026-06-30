/**
 * Database row shapes — mirror of `supabase/migrations/0001_initial_schema.sql`.
 *
 * These are the canonical TypeScript types for Supabase rows so web and mobile
 * share one definition. Until a Supabase project is provisioned and wired in,
 * they describe the target contract (roadmap Fase 4).
 */

export interface ProfileRow {
  id: string; // uuid, references auth.users(id)
  username: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export type ValidationStatus = "pending" | "accepted" | "suspicious" | "rejected";

export interface CompletedGameRow {
  id: string;
  user_id: string;
  puzzle_id: string;
  variant: string;
  difficulty: string;
  elapsed_seconds: number;
  mistakes: number;
  hints_used: number;
  completed_at: string;
  client_started_at: string | null;
  client_completed_at: string | null;
  validation_status: ValidationStatus;
}

export interface LeaderboardEntryRow {
  user_id: string;
  username: string;
  avatar_url: string | null;
  puzzle_id: string;
  variant: string;
  difficulty: string;
  elapsed_seconds: number;
  mistakes: number;
  completed_at: string;
}

export interface AchievementRow {
  id: string;
  key: string;
  name: string;
  description: string;
}

export interface UserAchievementRow {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}
