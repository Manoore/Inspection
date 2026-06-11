import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import { User } from "@/types";
import { COLORS } from "@/constants";

const ROLE_LABELS: Record<string, string> = {
  corporate_admin: "Admin",
  field_manager:   "Field Manager",
  auditor:         "Auditor",
};
const ROLE_OPTS = ["corporate_admin", "field_manager", "auditor"] as const;
const ROLE_COLORS: Record<string, string> = {
  corporate_admin: COLORS.brand,
  field_manager:   COLORS.success ?? "#16a34a",
  auditor:         COLORS.warning ?? "#d97706",
};

export default function UsersScreen() {
  const [users,    setUsers]    = useState<User[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<User | null>(null);
  const [roleModal, setRoleModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").order("full_name");
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (user: User, newRole: string) => {
    await supabase.from("users").update({ role: newRole }).eq("id", user.id);
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole as any } : u));
    setRoleModal(false);
    setSelected(null);
    Alert.alert("Updated", `${user.full_name}'s role changed to ${ROLE_LABELS[newRole]}`);
  };

  const initials = (name: string) =>
    name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

  const colorFor = (i: number) => {
    const palette = [COLORS.brand, "#7C3AED", "#059669", "#DC2626", "#D97706"];
    return palette[i % palette.length];
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.gray900 }}>User Management</Text>
        <Text style={{ fontSize: 13, color: COLORS.gray400, marginTop: 2 }}>
          {users.length} users · Manage roles & access
        </Text>
      </View>

      {/* Role summary pills */}
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 12 }}>
        {ROLE_OPTS.map((r) => {
          const count = users.filter((u) => u.role === r).length;
          return (
            <View key={r} style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              backgroundColor: `${ROLE_COLORS[r]}18`,
              borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ROLE_COLORS[r] }} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: ROLE_COLORS[r] }}>
                {ROLE_LABELS[r]} ({count})
              </Text>
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
              {/* Avatar */}
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: colorFor(i), alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#FFF" }}>
                  {initials(user.full_name)}
                </Text>
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
                <View style={{
                  backgroundColor: `${ROLE_COLORS[user.role]}18`,
                  borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: ROLE_COLORS[user.role] }}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => { setSelected(user); setRoleModal(true); }}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 4,
                    paddingHorizontal: 8, paddingVertical: 4,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={14} color={COLORS.brand} />
                  <Text style={{ fontSize: 11, color: COLORS.brand, fontWeight: "600" }}>Edit role</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Role change modal */}
      <Modal visible={roleModal} transparent animationType="fade" onRequestClose={() => setRoleModal(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 32 }}
          activeOpacity={1} onPress={() => setRoleModal(false)}
        >
          <View style={{ backgroundColor: "#FFF", borderRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.gray900, marginBottom: 4 }}>
              Change Role
            </Text>
            {selected && (
              <Text style={{ fontSize: 13, color: COLORS.gray400, marginBottom: 20 }}>
                {selected.full_name} · currently {ROLE_LABELS[selected.role]}
              </Text>
            )}
            {ROLE_OPTS.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => selected && changeRole(selected, r)}
                style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 6,
                  backgroundColor: selected?.role === r ? `${ROLE_COLORS[r]}14` : "#F9FAFB",
                  borderWidth: selected?.role === r ? 1.5 : 0,
                  borderColor: ROLE_COLORS[r],
                }}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.gray900 }}>
                  {ROLE_LABELS[r]}
                </Text>
                {selected?.role === r && (
                  <Ionicons name="checkmark-circle" size={20} color={ROLE_COLORS[r]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}
