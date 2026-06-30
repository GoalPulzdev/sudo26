import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSupabase } from "../lib/supabase";

export interface AuthProfile {
  userId: string;
  username: string | null;
  color: string;
  isAnonymous: boolean;
}

interface AuthStore {
  profile: AuthProfile | null;
  isLoading: boolean;
  init: () => Promise<void>;
  updateProfile: (username: string, color: string) => Promise<void>;
}

const DEFAULT_COLORS = [
  "#7c3aed", "#0891b2", "#059669", "#d97706",
  "#dc2626", "#db2777", "#4f46e5", "#0d9488",
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

        // Local mock mode — Supabase not configured. Stable local profile, no network.
        if (!sb) {
          const existing = get().profile;
          if (existing) {
            set({ isLoading: false });
          } else {
            const userId = `local-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
            set({
              profile: { userId, username: null, color: pickDefaultColor(userId), isAnonymous: true },
              isLoading: false,
            });
          }
          return;
        }

        try {
          const { data: { session } } = await sb.auth.getSession();
          let userId = session?.user?.id;

          if (!userId) {
            const { data, error } = await sb.auth.signInAnonymously();
            if (error || !data.user) {
              set({ isLoading: false });
              return;
            }
            userId = data.user.id;
          }

          const { data: existing } = await (sb as any)
            .from("profiles")
            .select("username, color")
            .eq("id", userId)
            .single();

          const color = (existing as any)?.color ?? pickDefaultColor(userId);
          if (!existing) {
            await (sb as any).from("profiles").insert({ id: userId, color });
          }

          set({
            profile: {
              userId,
              username: (existing as any)?.username ?? null,
              color,
              isAnonymous: !session?.user?.email,
            },
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      updateProfile: async (username, color) => {
        const sb = getSupabase();
        // Local mock mode — persist locally only.
        if (!sb) {
          set((s) => ({ profile: s.profile ? { ...s.profile, username, color } : null }));
          return;
        }
        const { data: { session } } = await sb.auth.getSession();
        if (!session?.user?.id) throw new Error("Ikke logget inn");
        const { error } = await (sb as any).from("profiles").upsert({
          id: session.user.id,
          username,
          color,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        set((s) => ({
          profile: s.profile ? { ...s.profile, username, color } : null,
        }));
      },
    }),
    {
      name: "sudoku-auth-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
