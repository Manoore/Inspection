import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  return data ?? null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:    null,
  session: null,
  loading: true,

  loadSession: async () => {
    const { data } = await supabase.auth.getSession();
    const session  = data?.session ?? null;

    if (!session) {
      set({ loading: false });
      return;
    }

    const profile = await fetchProfile(session.user.id);
    set({ session, user: profile, loading: false });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data) return (error as any)?.message ?? "Login failed";

    const profile = await fetchProfile(data.user.id);
    set({ session: data.session, user: profile });
    return null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));
