import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  RefreshControl, Alert, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { User } from "@/types";
import { COLORS } from "@/constants";

const ROLE_LABELS: Record<string, string> = {
  corporate_admin: "Admin",
  field_manager:   "Field Manager",
  auditor:         "Auditor",
};
const ROLE_OPTS = ["corporate_admin", "field_manager", "auditor"] as const;
type RoleOpt = typeof ROLE_OPTS[number];
const ROLE_COLORS: Record<string, string> = {
  corporate_admin: COLORS.brand,
  field_manager:   "#059669",
  auditor:         "#D97706",
};

const inp$ = {
  borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10,
  padding: 13, fontSize: 14, color: COLORS.gray900, backgroundColor: "#FFF",
  marginBottom: 18,
};
const lbl$ = { fontSize: 12, fontWeight: "700" as const, color: COLORS.gray600, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.5 };

function AddUserModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState<RoleOpt>("field_manager");
  const [saving,   setSaving]   = useState(false);

  const reset = () => { setName(""); setEmail(""); setPassword(""); setRole("field_manager"); };
  const close = () => { reset(); onClose(); };

  const save = async () => {
    if (!name.trim())     { Alert.alert("Name required"); return; }
    if (!email.trim())    { Alert.alert("Email required"); return; }
    if (password.length < 8) { Alert.alert("Password must be at least 8 characters"); return; }
    setSaving(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: name.trim(), role } },
    });
    setSaving(false);
    if (error) { Alert.alert("Error", error.message); return; }
    Alert.alert(
      "User Created",
      `Confirmation email sent to ${email.trim()}. Once they confirm, they can log in as ${ROLE_LABELS[role]}.`
    );
    reset();
    onSaved();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%", paddingBottom: 36 }}>

            <View style={{ flexDirection: "row", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: "800", color: COLORS.gray900 }}>Add New User</Text>
              <TouchableOpacity onPress={close}>
                <Ionicons name="close" size={24} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              {/* Info banner */}
              <View style={{ backgroundColor: `${COLORS.brand}0E`, borderRadius: 12, padding: 14, flexDirection: "row", gap: 10, marginBottom: 24, alignItems: "flex-start" }}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.brand} />
                <Text style={{ flex: 1, fontSize: 12, color: COLORS.brand, lineHeight: 18 }}>
                  A confirmation email is sent to the user. They log in after confirming. Their role is applied automatically.
                </Text>
              </View>

              <Text style={lbl$}>Full Name</Text>
              <TextInput value={name} onChangeText={setName} placeholder="e.g. James Carter"
                placeholderTextColor={COLORS.gray400} style={inp$} />

              <Text style={lbl$}>Email</Text>
              <TextInput value={email} onChangeText={setEmail} placeholder="user@clinic.com"
                placeholderTextColor={COLORS.gray400} style={inp$}
                autoCapitalize="none" keyboardType="email-address" />

              <Text style={lbl$}>Temporary Password</Text>
              <TextInput value={password} onChangeText={setPassword} placeholder="Min 8 characters"
                placeholderTextColor={COLORS.gray400} style={inp$} secureTextEntry />

              <Text style={lbl$}>Role</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
                {ROLE_OPTS.map((r) => {
                  const sel = role === r;
                  const c   = ROLE_COLORS[r];
                  return (
                    <TouchableOpacity key={r} onPress={() => setRole(r)}
                      style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, borderWidth: 1.5,
                        borderColor: sel ? c : COLORS.gray200, backgroundColor: sel ? `${c}14` : "#FFF" }}
                      activeOpacity={0.75}>
                      <Text style={{ fontSize: 13, fontWeight: sel ? "700" : "400", color: sel ? c : COLORS.gray600 }}>
                        {ROLE_LABELS[r]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity onPress={save} disabled={saving}
                style={{ backgroundColor: saving ? COLORS.gray200 : COLORS.brand,
                  borderRadius: 12, paddingVertical: 16, alignItems: "center" }}
                activeOpacity={0.85}>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 16 }}>
                  {saving ? "Creating…" : "Create User & Send Invite"}
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RoleModal({ user, visible, onClose, onChanged }: {
  user: User | null; visible: boolean; onClose: () => void;
  onChanged: (id: string, role: string) => void;
}) {
  const changeRole = async (newRole: string) => {
    if (!user) return;
    await supabase.from("users").update({ role: newRole }).eq("id", user.id);
    onChanged(user.id, newRole);
    onClose();
    Alert.alert("Updated", `${user.full_name}'s role → ${ROLE_LABELS[newRole]}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 32 }}
        activeOpacity={1} onPress={onClose}>
        <View style={{ backgroundColor: "#FFF", borderRadius: 20, padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.gray900, marginBottom: 4 }}>Change Role</Text>
          {user && <Text style={{ fontSize: 13, color: COLORS.gray400, marginBottom: 20 }}>{user.full_name} · currently {ROLE_LABELS[user.role]}</Text>}
          {ROLE_OPTS.map((r) => {
            const sel = user?.role === r;
            const c   = ROLE_COLORS[r];
            return (
              <TouchableOpacity key={r} onPress={() => changeRole(r)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 6,
                  backgroundColor: sel ? `${c}14` : "#F9FAFB",
                  borderWidth: sel ? 1.5 : 0, borderColor: c }}
                activeOpacity={0.75}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.gray900 }}>{ROLE_LABELS[r]}</Text>
                {sel && <Ionicons name="checkmark-circle" size={20} color={c} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const colorFor = (i: number) => {
  const p = [COLORS.brand, "#7C3AED", "#059669", "#DC2626", "#D97706"];
  return p[i % p.length];
};
const initials = (name: string) => name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

export default function UsersScreen() {
  const [users,     setUsers]     = useState<User[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<User | null>(null);
  const [showRole,  setShowRole]  = useState(false);
  const [showAdd,   setShowAdd]   = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").order("full_name");
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChanged = (id: string, role: string) =>
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: role as any } : u));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
        flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.gray900 }}>User Management</Text>
          <Text style={{ fontSize: 13, color: COLORS.gray400, marginTop: 2 }}>{users.length} users · Manage roles & access</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAdd(true)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.brand,
            borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }}
          activeOpacity={0.85}>
          <Ionicons name="person-add-outline" size={16} color="#FFF" />
          <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>Add User</Text>
        </TouchableOpacity>
      </View>

      {/* Role summary pills */}
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 12, flexWrap: "wrap" }}>
        {ROLE_OPTS.map((r) => {
          const count = users.filter((u) => u.role === r).length;
          const c = ROLE_COLORS[r];
          return (
            <View key={r} style={{ flexDirection: "row", alignItems: "center", gap: 6,
              backgroundColor: `${c}18`, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: c }}>{ROLE_LABELS[r]} ({count})</Text>
            </View>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {users.map((user, i) => (
          <Card key={user.id} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 44, height: 44, borderRadius: 22,
                backgroundColor: colorFor(i), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#FFF" }}>{initials(user.full_name)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.gray900 }}>{user.full_name}</Text>
                <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 1 }}>{user.email}</Text>
                {user.assigned_location_ids?.length > 0 && (
                  <Text style={{ fontSize: 11, color: COLORS.gray400, marginTop: 2 }}>
                    {user.assigned_location_ids.length} location{user.assigned_location_ids.length > 1 ? "s" : ""} assigned
                  </Text>
                )}
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <View style={{ backgroundColor: `${ROLE_COLORS[user.role]}18`,
                  borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: ROLE_COLORS[user.role] }}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => { setSelected(user); setShowRole(true); }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4 }}
                  activeOpacity={0.7}>
                  <Ionicons name="create-outline" size={14} color={COLORS.brand} />
                  <Text style={{ fontSize: 11, color: COLORS.brand, fontWeight: "600" }}>Edit role</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      <AddUserModal visible={showAdd} onClose={() => setShowAdd(false)} onSaved={load} />
      <RoleModal user={selected} visible={showRole} onClose={() => { setShowRole(false); setSelected(null); }} onChanged={handleRoleChanged} />

    </SafeAreaView>
  );
}
