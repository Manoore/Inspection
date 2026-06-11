import "../global.css";
import { useEffect, useRef } from "react";
import { Stack, router, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth";

function RootGuard() {
  const { user, loading, loadSession } = useAuthStore();
  const segments = useSegments();
  const navigating = useRef(false);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (navigating.current) return;

    const inAuth    = segments[0] === "(auth)";
    const isLanding = segments.length === 0;
    const isPublic  = inAuth || isLanding;

    if (!user && !isPublic) {
      navigating.current = true;
      router.replace("/(auth)/login");
      setTimeout(() => { navigating.current = false; }, 500);
    } else if (user && inAuth) {
      navigating.current = true;
      if (user.role === "corporate_admin") router.replace("/(corporate)/dashboard");
      else if (user.role === "field_manager") router.replace("/(field)/dashboard");
      else router.replace("/(auditor)/dashboard");
      setTimeout(() => { navigating.current = false; }, 500);
    }
  }, [user, loading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootGuard />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(corporate)" />
          <Stack.Screen name="(field)" />
          <Stack.Screen name="(auditor)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
