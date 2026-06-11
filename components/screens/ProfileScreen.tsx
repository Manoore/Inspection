import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/constants";

const ROLE_LABELS: Record<string, string> = {
  corporate_admin:  "Corporate Admin",
  field_manager:    "Field Manager",
  field_inspector:  "Field Inspector",
  auditor:          "Auditor",
};

interface MyInspection {
  id: string; started_at: string; status: string; score?: number;
  locations?: { name: string } | null;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [name,         setName]         = useState(user?.full_name ?? "");
  const [avatarUri,    setAvatarUri]    = useState<string | null>(user?.avatar_url ?? null);
  const [newUri,       setNewUri]       = useState<string | null>(null);
  const [inspections,  setInspections]  = useState<MyInspection[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("inspections")
      .select("id, started_at, status, score, locations(name)")
      .eq("inspector_id", user.id)
      .order("started_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { setInspections(data ?? []); setLoading(false); });
  }, [user?.id]);

  const pickPhoto = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert("Permission needed", "Allow photo library access to upload a profile photo."); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images", allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) {
      setNewUri(res.assets[0].uri);
      setAvatarUri(res.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    if (!user || !name.trim()) { Alert.alert("Name required"); return; }
    setSaving(true);
    let avatar_url = user.avatar_url;

    if (newUri) {
      try {
        const ext  = newUri.split(".").pop()?.split("?")[0] ?? "jpg";
        const path = `avatars/${user.id}.${ext}`;
        const b64  = await FileSystem.readAsStringAsync(newUri, { encoding: FileSystem.EncodingType.Base64 });
        const bstr = atob(b64);
        const bytes = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) bytes[i] = bstr.charCodeAt(i);
        const { error: upErr } = await supabase.storage
          .from("avatars").upload(path, bytes, { contentType: `image/${ext}`, upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          avatar_url = urlData.publicUrl;
        }
      } catch {}
    }

    await supabase.from("users").update({ full_name: name.trim(), avatar_url }).eq("id", user.id);
    setSaving(false);
    setNewUri(null);
    Alert.alert("Saved", "Profile updated.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.gray900 }}>My Profile</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={COLORS.brand} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}>

          {/* Avatar */}
          <View style={{ alignItems: "center", paddingVertical: 28 }}>
            <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }}
                  style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.gray200 }} />
              ) : (
                <View style={{ width: 96, height: 96, borderRadius: 48,
                  backgroundColor: `${COLORS.brand}15`, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="person" size={48} color={COLORS.brand} />
                </View>
              )}
              <View style={{ position: "absolute", bottom: 0, right: 0, width: 30, height: 30,
                borderRadius: 15, backgroundColor: COLORS.brand, alignItems: "center",
                justifyContent: "center", borderWidth: 2, borderColor: "#FFF" }}>
                <Ionicons name="camera" size={15} color="#FFF" />
              </View>
            </TouchableOpacity>
            <View style={{ backgroundColor: `${COLORS.brand}12`, borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 6, marginTop: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.brand }}>
                {ROLE_LABELS[user?.role ?? ""] ?? user?.role ?? "Staff"}
              </Text>
            </View>
          </View>

          {/* Form */}
          <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray600, marginBottom: 6 }}>Full Name</Text>
          <TextInput
            value={name} onChangeText={setName} placeholder="Enter full name"
            style={{ borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.gray900, marginBottom: 14 }}
            placeholderTextColor={COLORS.gray400}
          />

          <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray600, marginBottom: 6 }}>Email</Text>
          <View style={{ borderWidth: 1.5, borderColor: "#F3F4F6", borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20, backgroundColor: "#F9FAFB" }}>
            <Text style={{ fontSize: 15, color: COLORS.gray400 }}>{user?.email ?? "—"}</Text>
          </View>

          <TouchableOpacity onPress={saveProfile} disabled={saving}
            style={{ backgroundColor: saving ? COLORS.gray200 : COLORS.brand,
              borderRadius: 12, paddingVertical: 15, alignItems: "center", marginBottom: 32 }}
            activeOpacity={0.85}>
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 15 }}>
              {saving ? "Saving…" : "Save Changes"}
            </Text>
          </TouchableOpacity>

          {/* Inspection history */}
          <Text style={{ fontSize: 17, fontWeight: "800", color: COLORS.gray900, marginBottom: 4 }}>
            My Inspection History
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.gray400, marginBottom: 12 }}>
            {inspections.length} inspection{inspections.length !== 1 ? "s" : ""} logged under your account
          </Text>

          {inspections.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 24, backgroundColor: "#F9FAFB",
              borderRadius: 12 }}>
              <Ionicons name="clipboard-outline" size={36} color={COLORS.gray200} />
              <Text style={{ color: COLORS.gray400, marginTop: 6, fontSize: 13 }}>No inspections yet</Text>
            </View>
          ) : inspections.map((ins) => {
            const scoreColor  = ins.score == null ? COLORS.gray400 : ins.score >= 75 ? COLORS.success : COLORS.danger;
            const statusColor = ins.status === "completed" ? COLORS.success
              : ins.status === "failed" ? COLORS.danger : COLORS.warning;
            return (
              <View key={ins.id} style={{ flexDirection: "row", alignItems: "center", gap: 12,
                paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12,
                  backgroundColor: `${statusColor}14`, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons
                    name={ins.status === "completed" ? "checkmark-circle" : ins.status === "failed" ? "close-circle" : "time-outline"}
                    size={20} color={statusColor}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray900 }} numberOfLines={1}>
                    {ins.locations?.name ?? "Unknown location"}
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.gray400, marginTop: 2 }}>
                    {new Date(ins.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {" · "}
                    <Text style={{ color: statusColor, fontWeight: "600" }}>
                      {ins.status.replace("_", " ")}
                    </Text>
                  </Text>
                </View>
                {ins.score != null && (
                  <View style={{ backgroundColor: `${scoreColor}14`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: scoreColor }}>{ins.score}%</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Sign out */}
          <TouchableOpacity onPress={signOut}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              marginTop: 32, paddingVertical: 14, borderRadius: 12,
              borderWidth: 1.5, borderColor: COLORS.gray200 }}
            activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.danger }}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
