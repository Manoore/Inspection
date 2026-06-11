import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/constants";

const BRAND = "#1B3A6B";
const LOC_OPTIONS = ["1–3", "4–10", "11–25", "26–50", "51+"];

interface Form {
  name: string; email: string; phone: string;
  organization: string; location_count: string; message: string;
}

const BLANK: Form = { name: "", email: "", phone: "", organization: "", location_count: "", message: "" };

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 }}>
        {label}{required ? <Text style={{ color: COLORS.danger }}> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

const inp = {
  borderWidth: 1.5, borderColor: "#D1D5DB", borderRadius: 10,
  padding: 13, fontSize: 14, color: "#111827", backgroundColor: "#FFF",
};

export default function ContactScreen() {
  const [form,      setForm]      = useState<Form>(BLANK);
  const [saving,    setSaving]    = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof Form) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const submit = async () => {
    if (!form.name.trim())         { Alert.alert("Name required"); return; }
    if (!form.email.trim())        { Alert.alert("Email required"); return; }
    if (!form.organization.trim()) { Alert.alert("Organization required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { Alert.alert("Valid email required"); return; }
    setSaving(true);
    await supabase.from("inquiries").insert({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || undefined,
      organization: form.organization.trim(),
      location_count: form.location_count || undefined,
      message: form.message.trim() || undefined,
      status: "new",
      submitted_at: new Date().toISOString(),
    });
    setSaving(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={{ flex: 1, backgroundColor: BRAND, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <StatusBar style="light" />
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <Ionicons name="checkmark-circle" size={48} color="#FFF" />
        </View>
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#FFF", textAlign: "center", marginBottom: 12 }}>
          We'll be in touch!
        </Text>
        <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 24, marginBottom: 36 }}>
          Thanks for reaching out. Our team will contact you within 1 business day.
        </Text>
        <TouchableOpacity onPress={() => router.replace("/")}
          style={{ backgroundColor: "#FFF", borderRadius: 12, paddingHorizontal: 32, paddingVertical: 16 }}
          activeOpacity={0.85}>
          <Text style={{ color: BRAND, fontWeight: "800", fontSize: 16 }}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F9FAFB" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={{ backgroundColor: BRAND, paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => router.replace("/")}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 }}
          activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.8)" />
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600" }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#FFF" }}>Get Started</Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 6, lineHeight: 22 }}>
          Tell us about your organization and we'll set you up with a free demo.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Value props */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          {[
            { icon: "flash-outline" as const, text: "Free demo" },
            { icon: "time-outline" as const, text: "Setup in 1 day" },
            { icon: "shield-checkmark-outline" as const, text: "No commitment" },
          ].map((v) => (
            <View key={v.text} style={{ flex: 1, backgroundColor: "#FFF", borderRadius: 10, padding: 12, alignItems: "center", gap: 6 }}>
              <Ionicons name={v.icon} size={20} color={BRAND} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center" }}>{v.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: "#FFF", borderRadius: 16, padding: 20 }}>

          <Field label="Full Name" required>
            <TextInput value={form.name} onChangeText={set("name")}
              placeholder="Dr. Jane Smith" placeholderTextColor="#9CA3AF" style={inp} />
          </Field>

          <Field label="Work Email" required>
            <TextInput value={form.email} onChangeText={set("email")}
              placeholder="jane@yourclinic.com" keyboardType="email-address"
              autoCapitalize="none" placeholderTextColor="#9CA3AF" style={inp} />
          </Field>

          <Field label="Phone Number">
            <TextInput value={form.phone} onChangeText={set("phone")}
              placeholder="(555) 000-0000" keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF" style={inp} />
          </Field>

          <Field label="Organization Name" required>
            <TextInput value={form.organization} onChangeText={set("organization")}
              placeholder="Hometown Urgent Care" placeholderTextColor="#9CA3AF" style={inp} />
          </Field>

          <Field label="Number of Locations">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {LOC_OPTIONS.map((opt) => {
                  const sel = form.location_count === opt;
                  return (
                    <TouchableOpacity key={opt} onPress={() => set("location_count")(opt)}
                      style={{
                        paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
                        borderColor: sel ? BRAND : "#D1D5DB",
                        backgroundColor: sel ? `${BRAND}12` : "#FFF",
                      }}
                      activeOpacity={0.75}>
                      <Text style={{ fontSize: 13, fontWeight: sel ? "700" : "400", color: sel ? BRAND : "#6B7280" }}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </Field>

          <Field label="Message">
            <TextInput value={form.message} onChangeText={set("message")}
              placeholder="Tell us what you're looking for, any specific requirements, or questions…"
              multiline numberOfLines={4} placeholderTextColor="#9CA3AF"
              style={{ ...inp, minHeight: 100, textAlignVertical: "top" }} />
          </Field>

          <TouchableOpacity onPress={submit} disabled={saving}
            style={{ backgroundColor: saving ? "#D1D5DB" : BRAND, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
            activeOpacity={0.85}>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 16 }}>
              {saving ? "Submitting…" : "Request Free Demo →"}
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 14, lineHeight: 18 }}>
            By submitting you agree to our terms. We'll never share your information.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
