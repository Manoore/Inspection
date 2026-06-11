import React, { useState } from "react";
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth";
import { COLORS } from "@/constants";
import { StatusBar } from "expo-status-bar";

const schema = z.object({
  email:    z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async ({ email, password }: FormData) => {
    setLoading(true);
    const error = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert("Login failed", error);
    }
    // RootGuard in _layout.tsx handles redirect once user state is set
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.brand }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />
      {/* Back to landing */}
      <TouchableOpacity
        onPress={() => router.replace("/")}
        style={{ position: "absolute", top: 52, left: 20, zIndex: 10, flexDirection: "row", alignItems: "center", gap: 6 }}
        activeOpacity={0.75}
      >
        <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.8)" />
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600" }}>Back</Text>
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Constrained center column */}
        <View style={{ width: "100%", maxWidth: 460 }}>

          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 36 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}>
              <Text style={{ fontSize: 36 }}>🏥</Text>
            </View>
            <Text style={{ fontSize: 26, fontWeight: "700", color: COLORS.white }}>
              ClinicOps
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
              Inspection & Training Platform
            </Text>
          </View>

          {/* Form card */}
          <View style={{
            backgroundColor: COLORS.white, borderRadius: 20,
            padding: 28, shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15,
            shadowRadius: 20, elevation: 10,
          }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.gray900, marginBottom: 22 }}>
              Sign in
            </Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  icon="mail-outline"
                  placeholder="you@clinic.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  icon="lock-closed-outline"
                  placeholder="••••••••"
                  secureToggle
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <Button
              label="Sign in"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <Text style={{ color: "rgba(255,255,255,0.45)", textAlign: "center", marginTop: 20, fontSize: 12 }}>
            ClinicOps • Confidential
          </Text>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
