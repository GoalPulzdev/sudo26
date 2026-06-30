"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getSupabase } from "@/lib/supabase";

export interface AuthProfile {
  userId: string;
  username: string | null;
  color: string;
  isAnonymous: boolean;
}

interface AuthStore {
  profile: AuthProfile | null;
  isLoading: boolean;
  /** Called once on app boot — signs in anonymously if no session exists */
  init: () => Promise<void>;
  /** Set or update display name + color, syncs to Supabase profiles table */
  updateProfile: (username: string, color: string) => Promise<void>;
}

const DEFAULT_COLORS = [
  "#3a4a66", "#bf9c45", "#5f8a6a", "#b4554a",
  "#4a6aa0", "#8a6d3b", "#2c3a4f", "#7a6a8a",
];

function pickDefaultColor(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  return DEFAULT_COLORS[h % DEFAULT_COLORS.length];
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: true,

      init: async () => {
        const sb = getSupabase();
        set({ isLoading: true });

        // Local mock mode — Supabase not configured. Use a stable local profile,
        // no network, no errors.
        if (!sb) {
          const existing = get().profile;
          if (existing) {
            set({ isLoading: false });
          } else {
            const userId = `local-${crypto.randomUUID()}`;
            set({
              profile: {
                userId,
                username: null,
                color: pickDefaultColor(userId),
                isAnonymous: true,
              },
              isLoading: false,
            });
          }
          return;
        }

        try {
          // Get existing session
          const { data: { session } } = await sb.auth.getSession();
          let userId = session?.user?.id;

          if (!userId) {
            // Sign in anonymously
            const { data, error } = await sb.auth.signInAnonymously();
            if (error || !data.user) {
              console.error("[auth] anonymous sign-in failed:", error?.message);
              set({ isLoading: false });
              return;
            }
            userId = data.user.id;
          }

          // Fetch or create profile
          const { data: existing } = await sb
            .from("profiles")
            .select("username, color")
            .eq("id", userId)
            .single();

          const color = existing?.color ?? pickDefaultColor(userId);

          if (!existing) {
            await sb.from("profiles").insert({ id: userId, color });
          }

          set({
            profile: {
              userId,
              username: existing?.username ?? null,
              color,
              isAnonymous: !session?.user?.email,
            },
            isLoading: false,
          });
        } catch (err) {
          console.error("[auth] init error:", err);
          set({ isLoading: false });
        }
      },

      updateProfile: async (username: string, color: string) => {
        const { profile } = get();
        if (!profile) return;

        const sb = getSupabase();
        // Local mock mode — persist the profile locally only.
        if (!sb) {
          set({ profile: { ...profile, username: username.trim(), color } });
          return;
        }

        const { error } = await sb
          .from("profiles")
          .upsert({ id: profile.userId, username: username.trim(), color });

        if (!error) {
          set({ profile: { ...profile, username: username.trim(), color } });
        } else {
          console.error("[auth] updateProfile error:", error.message);
          throw new Error(error.message);
        }
      },
    }),
    {
      name: "sudoku-auth-v1",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return window.localStorage;
      }),
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);
