import React, { useCallback, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, Modal, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import { CorrectiveAction, ActionLogEntry } from "@/types";
import { COLORS } from "@/constants";

type Filter = "all" | "open" | "overdue" | "resolved";
const FILTERS: Filter[] = ["all", "open", "overdue", "resolved"];

const LVL_COLOR: Record<number, string> = { 1: COLORS.brand, 2: COLORS.warning, 3: COLORS.danger };
const LVL_LABEL: Record<number, string> = { 1: "L1", 2: "L2 — Escalated", 3: "L3 — Critical" };
const EVT_ICON: Record<string, string>  = {
  created: "add-circle-outline", assigned: "person-outline",
  escalated: "arrow-up-circle-outline", status_changed: "pencil-outline", resolved: "checkmark-circle-outline",
};
const EVT_COLOR: Record<string, string> = {
  created: COLORS.gray400, assigned: COLORS.brand,
  escalated: COLORS.warning, status_changed: "#0891B2", resolved: COLORS.success,
};

function statusBadge(status: string): { label: string; variant: "danger" | "success" | "warning" | "info" } {
  if (status === "overdue")     return { label: "Overdue",     variant: "danger"  };
  if (status === "resolved")    return { label: "Resolved",    variant: "success" };
  if (status === "in_progress") return { label: "In Progress", variant: "info"    };
  return                               { label: "Open",        variant: "warning" };
}

function LevelBadge({ level }: { level: number }) {
  const c = LVL_COLOR[level] ?? COLORS.brand;
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: `${c}14` }}>
      <Text style={{ fontSize: 10, fontWeight: "700", color: c }}>{LVL_LABEL[level]}</Text>
    </View>
  );
}

function HistoryModal({ action, onClose }: { action: CorrectiveAction | null; onClose: () => void }) {
  if (!action) return null;
  const log = action.log ?? [];
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: "85%", paddingBottom: 36 }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 20,
            borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
            <View style={{ flex: 1 }}>
              <LevelBadge level={action.escalation_level} />
              <Text style={{ fontSize: 15, fontWeight: "800", color: COLORS.gray900, marginTop: 6 }} numberOfLines={2}>
                {action.description}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ marginLeft: 12 }}>
              <Ionicons name="close" size={24} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: COLORS.gray900, marginBottom: 16 }}>
              Escalation Log
            </Text>
            {log.length === 0 && (
              <Text style={{ color: COLORS.gray400, fontStyle: "italic" }}>No log entries yet</Text>
            )}
            {log.map((e, idx) => {
              const isLast = idx === log.length - 1;
              const ec = EVT_COLOR[e.event] ?? COLORS.gray400;
              return (
                <View key={e.id} style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ alignItems: "center", width: 30 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: `${ec}15`,
                      alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name={EVT_ICON[e.event] as any ?? "ellipse-outline"} size={14} color={ec} />
                    </View>
                    {!isLast && <View style={{ width: 2, flex: 1, backgroundColor: COLORS.gray200, marginVertical: 3, minHeight: 12 }} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: ec, textTransform: "capitalize" }}>
                        {e.event.replace("_", " ")}
                      </Text>
                      {e.from_level != null && e.to_level != null && (
                        <View style={{ backgroundColor: `${COLORS.warning}14`, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.warning }}>
                            L{e.from_level} → L{e.to_level}
                          </Text>
                        </View>
                      )}
                    </View>
                    {e.note ? <Text style={{ fontSize: 12, color: COLORS.gray600, marginTop: 3, lineHeight: 18 }}>{e.note}</Text> : null}
                    <Text style={{ fontSize: 11, color: COLORS.gray400, marginTop: 4 }}>
                      {e.user_name} · {new Date(e.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function ActionsScreen() {
  const { user } = useAuthStore();
  const [actions,  setActions]  = useState<CorrectiveAction[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<Filter>("open");
  const [history,  setHistory]  = useState<CorrectiveAction | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("corrective_actions")
      .select("*")
      .in("location_id", user.assigned_location_ids)
      .order("due_date");
    setActions(data ?? []);
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = actions.filter((a) => filter === "all" || a.status === filter);

  const resolve = async (action: CorrectiveAction) => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled) return;
    const now = new Date().toISOString();
    const entry: ActionLogEntry = {
      id: `lg-${Date.now()}`, action_id: action.id, event: "resolved",
      user_id: user?.id, user_name: user?.full_name ?? "Field Staff",
      note: "Resolved with photo evidence.", timestamp: now,
    };
    await supabase.from("corrective_actions").update({
      status: "resolved", resolved_at: now, evidence_photo_url: result.assets[0].uri,
      log: [...(action.log ?? []), entry],
    }).eq("id", action.id);
    load();
  };

  const escalationCounts = {
    l2: actions.filter((a) => a.escalation_level === 2 && a.status !== "resolved").length,
    l3: actions.filter((a) => a.escalation_level === 3 && a.status !== "resolved").length,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.gray900 }}>My Actions</Text>
        <Text style={{ fontSize: 13, color: COLORS.gray400 }}>{filtered.length} items</Text>
      </View>

      {/* Escalation warning banner */}
      {(escalationCounts.l2 > 0 || escalationCounts.l3 > 0) && (
        <View style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 12,
          backgroundColor: escalationCounts.l3 > 0 ? `${COLORS.danger}0E` : `${COLORS.warning}0E`,
          flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Ionicons name="alert-circle-outline" size={20}
            color={escalationCounts.l3 > 0 ? COLORS.danger : COLORS.warning} />
          <Text style={{ flex: 1, fontSize: 13, fontWeight: "600",
            color: escalationCounts.l3 > 0 ? COLORS.danger : COLORS.warning, lineHeight: 19 }}>
            {escalationCounts.l3 > 0
              ? `${escalationCounts.l3} action(s) reached Critical (Level 3) — leadership notified.`
              : `${escalationCounts.l2} action(s) escalated to Level 2 — supervisor assigned.`}
          </Text>
        </View>
      )}

      {/* Filter chips */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 12 }}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
              backgroundColor: filter === f ? COLORS.brand : COLORS.white,
              borderWidth: 1.5, borderColor: filter === f ? COLORS.brand : COLORS.gray200 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: filter === f ? COLORS.white : COLORS.gray600 }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.brand} />}
        renderItem={({ item }) => {
          const { label, variant } = statusBadge(item.status);
          const overdue = item.status !== "resolved" && new Date(item.due_date) < new Date();
          const lc = LVL_COLOR[item.escalation_level] ?? COLORS.brand;
          return (
            <Card style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: lc }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                    <LevelBadge level={item.escalation_level} />
                    <Badge label={label} variant={variant} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.gray900 }}>
                    {item.description}
                  </Text>
                  <Text style={{ fontSize: 11, color: overdue ? COLORS.danger : COLORS.gray400, marginTop: 4 }}>
                    Due: {item.due_date}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8, borderTopWidth: 1, borderTopColor: COLORS.gray200, paddingTop: 10 }}>
                <TouchableOpacity onPress={() => setHistory(item)}
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 5 }}
                  activeOpacity={0.75}>
                  <Ionicons name="time-outline" size={14} color={COLORS.brand} />
                  <Text style={{ fontSize: 12, color: COLORS.brand, fontWeight: "600" }}>History</Text>
                </TouchableOpacity>
                {item.status !== "resolved" && (
                  <TouchableOpacity onPress={() => resolve(item)}
                    style={{ flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 5 }}
                    activeOpacity={0.75}>
                    <Ionicons name="camera-outline" size={14} color={COLORS.success} />
                    <Text style={{ fontSize: 12, color: COLORS.success, fontWeight: "600" }}>
                      Resolve with photo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success} />
            <Text style={{ color: COLORS.gray400, marginTop: 8 }}>No {filter} actions</Text>
          </View>
        }
      />

      <HistoryModal action={history} onClose={() => setHistory(null)} />
    </SafeAreaView>
  );
}
