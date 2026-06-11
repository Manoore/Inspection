import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, Alert, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import { CreateModuleModal } from "@/components/training/CreateModuleModal";
import { TrainingModule, TrainingCompletion, User } from "@/types";
import { COLORS, SERVICE_LINE_LABELS } from "@/constants";

export default function CorporateTrainingScreen() {
  const [modules,     setModules]     = useState<TrainingModule[]>([]);
  const [completions, setCompletions] = useState<TrainingCompletion[]>([]);
  const [users,       setUsers]       = useState<User[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [createModal,     setCreateModal]     = useState(false);
  const [notifyModal,     setNotifyModal]     = useState<TrainingModule | null>(null);
  const [completionModal, setCompletionModal] = useState<TrainingModule | null>(null);
  const [notifyRole,      setNotifyRole]      = useState("all");

  const load = async () => {
    setLoading(true);
    const [modRes, compRes, usrRes] = await Promise.all([
      supabase.from("training_modules").select("*").order("title"),
      supabase.from("training_completions").select("*").order("completed_at", { ascending: false }).limit(200),
      supabase.from("users").select("*"),
    ]);
    setModules(modRes.data ?? []);
    setCompletions(compRes.data ?? []);
    setUsers(usrRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const expiringSoon = completions.filter((c) => {
    const diff = new Date(c.cert_expires_at).getTime() - Date.now();
    return diff > 0 && diff < 30 * 86400000;
  });

  const staffUsers = users.filter((u) => u.role !== "corporate_admin");

  const completionRate = (mod: TrainingModule) => {
    const done = new Set(completions.filter((c) => c.module_id === mod.id).map((c) => c.user_id)).size;
    const total = staffUsers.length || 1;
    return Math.round((done / total) * 100);
  };

  const getUserComp = (userId: string, modId: string) =>
    completions.filter((c) => c.user_id === userId && c.module_id === modId)
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0] ?? null;

  const certStatus = (c: TrainingCompletion | null) => {
    if (!c) return "pending";
    if (new Date(c.cert_expires_at) < new Date()) return "expired";
    return "valid";
  };

  const handleModuleSaved = (mod: TrainingModule, targetRole: string) => {
    setModules((prev) => [...prev, mod]);
    setNotifyRole(targetRole);
    Alert.alert("Module created", `"${mod.title}" is now available. Notify staff?`, [
      { text: "Later", style: "cancel" },
      { text: "Notify Now", onPress: () => setNotifyModal(mod) },
    ]);
  };

  const sendNotifications = async (mod: TrainingModule) => {
    const targets = users.filter((u) => {
      if (notifyRole === "all") return u.role !== "corporate_admin";
      return u.role === notifyRole;
    });
    await new Promise((r) => setTimeout(r, 600));
    setNotifyModal(null);
    Alert.alert("Notifications sent", `${targets.length} staff member${targets.length !== 1 ? "s" : ""} notified about "${mod.title}"`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.gray900 }}>Training</Text>
          <Text style={{ fontSize: 13, color: COLORS.gray400, marginTop: 1 }}>
            {modules.length} modules · {expiringSoon.length} certs expiring soon
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setCreateModal(true)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.brand, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Expiry alert */}
      {expiringSoon.length > 0 && (
        <View style={{
          marginHorizontal: 16, marginTop: 12, padding: 14,
          backgroundColor: "#fef3c7", borderRadius: 12,
          flexDirection: "row", alignItems: "center", gap: 10,
        }}>
          <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
          <Text style={{ fontSize: 13, color: COLORS.warning, fontWeight: "600", flex: 1 }}>
            {expiringSoon.length} certificate{expiringSoon.length > 1 ? "s" : ""} expiring within 30 days
          </Text>
        </View>
      )}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {modules.map((mod) => {
          const rate = completionRate(mod);
          const doneCount = new Set(completions.filter((c) => c.module_id === mod.id).map((c) => c.user_id)).size;
          return (
            <Card key={mod.id} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 10 }}>
                <View style={{
                  width: 42, height: 42, borderRadius: 10,
                  backgroundColor: `${COLORS.brand}12`, alignItems: "center",
                  justifyContent: "center", marginRight: 12,
                }}>
                  <Ionicons name="school-outline" size={20} color={COLORS.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.gray900 }}>{mod.title}</Text>
                  {mod.description ? (
                    <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 2 }} numberOfLines={2}>{mod.description}</Text>
                  ) : null}
                </View>
              </View>

              {/* Service line badges */}
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {mod.service_lines.slice(0, 3).map((sl) => (
                  <Badge key={sl} label={SERVICE_LINE_LABELS[sl]} variant="info" />
                ))}
                {mod.service_lines.length > 3 && (
                  <Badge label={`+${mod.service_lines.length - 3}`} variant="default" />
                )}
                <Badge label={`${mod.duration_minutes}m`} variant="default" />
              </View>

              {/* Completion bar */}
              <View style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: COLORS.gray400 }}>Completion</Text>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.gray900 }}>
                    {doneCount}/{users.length} ({rate}%)
                  </Text>
                </View>
                <View style={{ height: 6, backgroundColor: COLORS.gray200, borderRadius: 3 }}>
                  <View style={{
                    height: 6, borderRadius: 3,
                    backgroundColor: rate >= 80 ? COLORS.success : rate >= 50 ? COLORS.warning : COLORS.danger,
                    width: `${rate}%`,
                  }} />
                </View>
              </View>

              {/* Actions */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setCompletionModal(mod)}
                  style={{
                    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: 6, borderWidth: 1.5, borderColor: COLORS.success,
                    borderRadius: 10, paddingVertical: 9,
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="people-outline" size={15} color={COLORS.success} />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.success }}>Who Completed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setNotifyModal(mod)}
                  style={{
                    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: 6, borderWidth: 1.5, borderColor: COLORS.brand,
                    borderRadius: 10, paddingVertical: 9,
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="notifications-outline" size={15} color={COLORS.brand} />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.brand }}>Notify Staff</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <CreateModuleModal
        visible={createModal}
        onClose={() => setCreateModal(false)}
        onSaved={handleModuleSaved}
      />

      <Modal visible={!!notifyModal} transparent animationType="fade" onRequestClose={() => setNotifyModal(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 28 }}>
          <View style={{ backgroundColor: "#FFF", borderRadius: 20, padding: 28 }}>
            <View style={{
              width: 56, height: 56, borderRadius: 14,
              backgroundColor: `${COLORS.brand}12`, alignItems: "center",
              justifyContent: "center", alignSelf: "center", marginBottom: 16,
            }}>
              <Ionicons name="notifications" size={28} color={COLORS.brand} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.gray900, textAlign: "center", marginBottom: 8 }}>
              Notify Staff
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.gray400, textAlign: "center", marginBottom: 24, lineHeight: 22 }}>
              Send a notification to all field staff and auditors about:
              {"\n\n"}<Text style={{ fontWeight: "700", color: COLORS.gray900 }}>{notifyModal?.title}</Text>
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setNotifyModal(null)}
                style={{ flex: 1, borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
                activeOpacity={0.8}
              >
                <Text style={{ fontWeight: "700", color: COLORS.gray400 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => notifyModal && sendNotifications(notifyModal)}
                style={{ flex: 1, backgroundColor: COLORS.brand, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
                activeOpacity={0.85}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Send Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Who Completed Modal ── */}
      <Modal visible={!!completionModal} transparent animationType="slide" onRequestClose={() => setCompletionModal(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: "800", color: COLORS.gray900 }}>Completion Status</Text>
                <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 2 }} numberOfLines={1}>{completionModal?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setCompletionModal(null)}>
                <Ionicons name="close" size={24} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>

            {/* Summary row */}
            {completionModal && (() => {
              const validCount   = staffUsers.filter((u) => certStatus(getUserComp(u.id, completionModal.id)) === "valid").length;
              const expiredCount = staffUsers.filter((u) => certStatus(getUserComp(u.id, completionModal.id)) === "expired").length;
              const pendingCount = staffUsers.filter((u) => certStatus(getUserComp(u.id, completionModal.id)) === "pending").length;
              return (
                <View style={{ flexDirection: "row", padding: 16, gap: 10 }}>
                  {[
                    { label: "Completed", count: validCount,   color: COLORS.success },
                    { label: "Expired",   count: expiredCount, color: COLORS.danger  },
                    { label: "Pending",   count: pendingCount, color: COLORS.gray400 },
                  ].map((s) => (
                    <View key={s.label} style={{
                      flex: 1, alignItems: "center", padding: 10,
                      backgroundColor: `${s.color}10`, borderRadius: 10,
                    }}>
                      <Text style={{ fontSize: 20, fontWeight: "800", color: s.color }}>{s.count}</Text>
                      <Text style={{ fontSize: 10, color: s.color, fontWeight: "600" }}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              );
            })()}

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
              {staffUsers.map((u) => {
                const comp   = completionModal ? getUserComp(u.id, completionModal.id) : null;
                const status = certStatus(comp);
                const statusColor = status === "valid" ? COLORS.success : status === "expired" ? COLORS.danger : COLORS.gray400;
                const initials = u.full_name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <View key={u.id} style={{
                    flexDirection: "row", alignItems: "center",
                    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
                  }}>
                    <View style={{
                      width: 38, height: 38, borderRadius: 19,
                      backgroundColor: `${COLORS.brand}18`, alignItems: "center", justifyContent: "center", marginRight: 12,
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.brand }}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.gray900 }}>{u.full_name}</Text>
                      <Text style={{ fontSize: 11, color: COLORS.gray400 }}>{u.role === "field_manager" ? "Field Staff" : "Auditor"}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <View style={{
                        paddingHorizontal: 10, paddingVertical: 4,
                        backgroundColor: `${statusColor}14`, borderRadius: 8,
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: statusColor, textTransform: "capitalize" }}>
                          {status}
                        </Text>
                      </View>
                      {comp && (
                        <Text style={{ fontSize: 10, color: COLORS.gray400, marginTop: 3 }}>
                          {comp.score}% · {new Date(comp.completed_at).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
