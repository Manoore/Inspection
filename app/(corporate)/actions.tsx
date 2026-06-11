import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Modal,
  ScrollView, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { CorrectiveAction, User, Location, ActionLogEntry } from "@/types";
import { COLORS } from "@/constants";

type LvlFilter = "all" | 1 | 2 | 3 | "resolved";

const LVL_COLOR: Record<number, string> = { 1: COLORS.brand, 2: COLORS.warning, 3: COLORS.danger };
const LVL_LABEL: Record<number, string> = { 1: "Level 1", 2: "Level 2", 3: "Level 3 — Critical" };
const EVT_ICON: Record<string, string>  = {
  created: "add-circle-outline", assigned: "person-outline",
  escalated: "arrow-up-circle-outline", status_changed: "pencil-outline", resolved: "checkmark-circle-outline",
};
const EVT_COLOR: Record<string, string> = {
  created: COLORS.gray400, assigned: COLORS.brand,
  escalated: COLORS.warning, status_changed: "#0891B2", resolved: COLORS.success,
};

function LevelBadge({ level }: { level: number }) {
  const c = LVL_COLOR[level] ?? COLORS.gray400;
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: `${c}14` }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: c }}>{LVL_LABEL[level] ?? `Level ${level}`}</Text>
    </View>
  );
}

function Timeline({ log }: { log: ActionLogEntry[] }) {
  if (!log.length) return <Text style={{ color: COLORS.gray400, fontStyle: "italic", fontSize: 13 }}>No log entries yet</Text>;
  return (
    <>
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
                <Text style={{ fontSize: 13, fontWeight: "700", color: ec, textTransform: "capitalize" }}>
                  {e.event.replace("_", " ")}
                </Text>
                {e.from_level != null && e.to_level != null && (
                  <View style={{ backgroundColor: `${COLORS.warning}14`, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.warning }}>L{e.from_level} → L{e.to_level}</Text>
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
    </>
  );
}

export default function CorporateActionsScreen() {
  const [actions,   setActions]   = useState<CorrectiveAction[]>([]);
  const [users,     setUsers]     = useState<User[]>([]);
  const [locs,      setLocs]      = useState<Location[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<LvlFilter>("all");
  const [detail,    setDetail]    = useState<CorrectiveAction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [aRes, uRes, lRes] = await Promise.all([
      supabase.from("corrective_actions").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("*"),
      supabase.from("locations").select("*"),
    ]);
    setActions(aRes.data ?? []);
    setUsers(uRes.data ?? []);
    setLocs(lRes.data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const userName = (id?: string) => users.find((u) => u.id === id)?.full_name ?? "Unassigned";
  const locName  = (id: string)  => locs.find((l) => l.id === id)?.name ?? id;

  const doEscalate = async (action: CorrectiveAction) => {
    if (action.escalation_level >= 3) return;
    const nextLvl = (action.escalation_level + 1) as 2 | 3;
    const now = new Date().toISOString();
    const entry: ActionLogEntry = {
      id: `lg-${Date.now()}`, action_id: action.id, event: "escalated",
      user_name: "Admin (Manual)", from_level: action.escalation_level, to_level: nextLvl,
      note: `Manually escalated to Level ${nextLvl} by admin.`, timestamp: now,
    };
    await supabase.from("corrective_actions").update({
      escalation_level: nextLvl, escalated_at: now,
      log: [...(action.log ?? []), entry],
    }).eq("id", action.id);
    load(); setDetail(null);
  };

  const doResolve = async (action: CorrectiveAction) => {
    const now = new Date().toISOString();
    const entry: ActionLogEntry = {
      id: `lg-${Date.now()}`, action_id: action.id, event: "resolved",
      user_name: "Admin (Manual)", note: "Marked resolved by admin.", timestamp: now,
    };
    await supabase.from("corrective_actions").update({
      status: "resolved", resolved_at: now,
      log: [...(action.log ?? []), entry],
    }).eq("id", action.id);
    load(); setDetail(null);
  };

  const counts = {
    all:      actions.filter((a) => a.status !== "resolved").length,
    l1:       actions.filter((a) => a.escalation_level === 1 && a.status !== "resolved").length,
    l2:       actions.filter((a) => a.escalation_level === 2 && a.status !== "resolved").length,
    l3:       actions.filter((a) => a.escalation_level === 3 && a.status !== "resolved").length,
    resolved: actions.filter((a) => a.status === "resolved").length,
  };

  const filtered = actions.filter((a) => {
    if (filter === "resolved") return a.status === "resolved";
    if (filter === "all")      return a.status !== "resolved";
    return a.escalation_level === filter && a.status !== "resolved";
  });

  const TABS: { key: LvlFilter; label: string; color: string }[] = [
    { key: "all",      label: `All (${counts.all})`,           color: COLORS.brand   },
    { key: 1,          label: `Level 1 (${counts.l1})`,        color: COLORS.brand   },
    { key: 2,          label: `Level 2 (${counts.l2})`,        color: COLORS.warning },
    { key: 3,          label: `Critical L3 (${counts.l3})`,    color: COLORS.danger  },
    { key: "resolved", label: `Resolved (${counts.resolved})`, color: COLORS.success },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.gray900 }}>Corrective Actions</Text>
        <Text style={{ fontSize: 13, color: COLORS.gray400 }}>All locations · {actions.length} total</Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        {[
          { label: "Open",     value: counts.all,  color: COLORS.brand   },
          { label: "Escalated",value: counts.l2 + counts.l3, color: COLORS.warning },
          { label: "Critical", value: counts.l3,   color: COLORS.danger  },
          { label: "Resolved", value: counts.resolved, color: COLORS.success },
        ].map((s) => (
          <View key={s.label} style={{ flex: 1, backgroundColor: "#FFF", borderRadius: 12, padding: 10,
            alignItems: "center", borderWidth: 1, borderColor: COLORS.gray200 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: s.color }}>{s.value}</Text>
            <Text style={{ fontSize: 10, color: COLORS.gray400, marginTop: 2, textAlign: "center" }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingTop: 4, paddingBottom: 10 }}>
        {TABS.map((t) => {
          const sel = filter === t.key;
          return (
            <TouchableOpacity key={String(t.key)} onPress={() => setFilter(t.key)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
                borderColor: sel ? t.color : COLORS.gray200, backgroundColor: sel ? `${t.color}12` : "#FFF" }}
              activeOpacity={0.75}>
              <Text style={{ fontSize: 12, fontWeight: sel ? "700" : "400", color: sel ? t.color : COLORS.gray600 }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.brand} />}
        renderItem={({ item }) => {
          const overdue = item.status !== "resolved" && new Date(item.due_date) < new Date();
          const lc = LVL_COLOR[item.escalation_level] ?? COLORS.brand;
          return (
            <TouchableOpacity onPress={() => setDetail(item)} activeOpacity={0.8}>
              <Card style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "stretch", gap: 10 }}>
                  <View style={{ width: 4, borderRadius: 2, backgroundColor: lc }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                      <LevelBadge level={item.escalation_level} />
                      {overdue && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: `${COLORS.danger}14` }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.danger }}>Overdue</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.gray900, marginBottom: 4 }} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.brand, fontWeight: "600", marginBottom: 6 }} numberOfLines={1}>
                      {locName(item.location_id)}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 14 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="person-outline" size={12} color={COLORS.gray400} />
                        <Text style={{ fontSize: 11, color: COLORS.gray400 }}>{userName(item.assigned_to)}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="calendar-outline" size={12} color={overdue ? COLORS.danger : COLORS.gray400} />
                        <Text style={{ fontSize: 11, color: overdue ? COLORS.danger : COLORS.gray400 }}>Due {item.due_date}</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} style={{ alignSelf: "center" }} />
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success} />
            <Text style={{ color: COLORS.gray400, marginTop: 8 }}>No actions in this category</Text>
          </View>
        }
      />

      {/* Detail modal */}
      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%", paddingBottom: 36 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", padding: 20,
              borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
              <View style={{ flex: 1 }}>
                {detail && <LevelBadge level={detail.escalation_level} />}
                <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.gray900, marginTop: 8 }} numberOfLines={2}>
                  {detail?.description}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.brand, marginTop: 2 }}>
                  {detail && locName(detail.location_id)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDetail(null)} style={{ marginLeft: 12 }}>
                <Ionicons name="close" size={24} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              {/* Info chips */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, padding: 12 }}>
                  <Text style={{ fontSize: 11, color: COLORS.gray400, marginBottom: 4 }}>Assigned To</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.gray900 }}>{userName(detail?.assigned_to)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, padding: 12 }}>
                  <Text style={{ fontSize: 11, color: COLORS.gray400, marginBottom: 4 }}>Due Date</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700",
                    color: detail && new Date(detail.due_date) < new Date() ? COLORS.danger : COLORS.gray900 }}>
                    {detail?.due_date}
                  </Text>
                </View>
              </View>

              {/* Timeline */}
              <Text style={{ fontSize: 15, fontWeight: "800", color: COLORS.gray900, marginBottom: 16 }}>Escalation Log</Text>
              <Timeline log={detail?.log ?? []} />

              {/* Admin actions */}
              {detail?.status !== "resolved" && (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
                  {detail && detail.escalation_level < 3 && (
                    <TouchableOpacity onPress={() => doEscalate(detail)}
                      style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                        paddingVertical: 14, borderRadius: 12, backgroundColor: `${COLORS.warning}14`,
                        borderWidth: 1.5, borderColor: COLORS.warning }}
                      activeOpacity={0.8}>
                      <Ionicons name="arrow-up-circle-outline" size={18} color={COLORS.warning} />
                      <Text style={{ fontWeight: "700", color: COLORS.warning, fontSize: 13 }}>Escalate Now</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => detail && doResolve(detail)}
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                      paddingVertical: 14, borderRadius: 12, backgroundColor: `${COLORS.success}14`,
                      borderWidth: 1.5, borderColor: COLORS.success }}
                    activeOpacity={0.8}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.success} />
                    <Text style={{ fontWeight: "700", color: COLORS.success, fontSize: 13 }}>Mark Resolved</Text>
                  </TouchableOpacity>
                </View>
              )}
              {detail?.status === "resolved" && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20, padding: 14,
                  backgroundColor: `${COLORS.success}0E`, borderRadius: 12 }}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={{ color: COLORS.success, fontWeight: "700", fontSize: 14 }}>Action Resolved</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
