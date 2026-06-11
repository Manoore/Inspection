import { mockSupabase } from "./mockSupabase";

const supabaseUrl     = process.env.EXPO_PUBLIC_SUPABASE_URL     ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const isMock =
  !supabaseUrl ||
  supabaseUrl.includes("your-project-id") ||
  !supabaseAnonKey ||
  supabaseAnonKey.includes("your-anon-key");

function makeRealClient() {
  // Lazy require so Metro doesn't init Supabase during SSR when mock
  const { createClient } = require("@supabase/supabase-js");
  const { Platform }     = require("react-native");
  const SecureStore      = require("expo-secure-store");

  const storage = {
    getItem: (key: string): any => {
      if (Platform.OS === "web") {
        return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
      }
      return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
        return;
      }
      SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") localStorage.removeItem(key);
        return;
      }
      SecureStore.deleteItemAsync(key);
    },
  };

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      transport: typeof WebSocket !== "undefined" ? WebSocket : require("ws"),
    },
  });
}

export const supabase: typeof mockSupabase = isMock ? mockSupabase : makeRealClient();
export const IS_MOCK = isMock;
