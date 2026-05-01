import { create } from "zustand";
import { supabase } from "@/services/supabase";
import type { UserProfile } from "@/types";

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: UserProfile | null) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  refreshProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ user: null, isAuthenticated: false }); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      set({ user: profile as UserProfile, isAuthenticated: true });
    }
  },
}));

/**
 * Initialises the auth listener. Call once at app startup.
 * Listens for Supabase auth state changes (login, logout, token refresh).
 */
export function initAuthListener() {
  const { data: listener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (!session) {
        useAuthStore.getState().setUser(null);
        return;
      }

      // Fetch full profile from Supabase
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      useAuthStore.getState().setUser(
        profile
          ? (profile as UserProfile)
          : {
              id: session.user.id,
              email: session.user.email ?? "",
              display_name: null,
              preferred_difficulty: "Intermediate",
              dark_mode: false,
              subscription_status: "free",
              subscription_expires_at: null,
              daily_solves_used: 0,
            }
      );
    }
  );

  return () => listener.subscription.unsubscribe();
}
