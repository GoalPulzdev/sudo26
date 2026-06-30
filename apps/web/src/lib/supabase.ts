import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when both Supabase env vars are set. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

// Singleton browser client (safe to call many times)
let _client: SupabaseClient | null = null;

/**
 * Returns the Supabase client, or `null` when Supabase is not configured.
 * Callers must handle the null case (local mock mode) — we never create a
 * client with empty credentials.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  if (typeof window === "undefined") {
    // SSR – create a one-off client (not cached)
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storage: window.localStorage,
        storageKey: "sudoku-auth",
      },
    });
  }
  return _client;
}
