import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/constants";

type Filter = "all" | "completed" | "in_progress" | "failed";
const FILTERS: { key: Filter; label: string; color: string }[] = [
  { key: "all",         label: "All",         color: COLORS.brand   },
  { key: "completed",   label: "Completed",   color: COLORS.success },
  { key: "in_progress", label: "In Progress", color: COLORS.warning },
  { key: "failed",      label: "Failed",      color: COLORS.danger  },
];

interface InspRow {
  id: string; location_id: string; checklist_id: string; inspector_id: string;
  status: string; started_at: string; completed_at?: string; score?: number;
  locations?: { name: string } | null;
  users?: { full_name: string } | null;
}
interface Response {
  id: string; item_id: string; value: string; passed: boolean; notes?: string; photo_url?: string;
  checklist_items?: { label: string; type: string } | null;
}

function DetailModal({ insp, onClose }: { insp: InspRow | null; onClose: () => void }) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading,   setLoading]   = useState(false);

  React.useEffect(() => {
    if (!insp) return;
    setLoading(true);
    supabase.from("inspection_responses")
      .select("*, checklist_items(label, type)")
      .eq("inspection_id", insp.id)
      .then(({ data }) => { setResponses(data ?? []); setLoading(false); });
  }, [insp?.id]);

  if (!insp) return null;
  const passed = responses.filter((r) => r.passed).length;
  const failed = responses.filter((r) => !r.passed).length;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: "92%", paddingBottom: 36 }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 20,
            borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.gray900 }}>
                {insp.locations?.name ?? "Inspection"}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 2 }}>
                {new Date(insp.started_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                {insp.users?.full_name ? ` · ${insp.users.full_name}` : ""}
              </Text>
            </View>
            {insp.score != null && (
              <View style={{ alignItems: "center", marginRight: 14 }}>
                <Text style={{ fontSize: 26, fontWeight: "800",
                  color: insp.score >= 75 ? COLORS.success : COLORS.danger }}>{insp.score}%</Text>
                <Text style={{ fontSize: 10, color: COLORS.gray400 }}>Score</Text>
              </View>
            )}
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>

          {/* Summary */}
          <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingVertical: 12, gap: 10 }}>
            {[
              { n: passed,           label: "Passed",  c: COLORS.success },
              { n: failed,           label: "Failed",  c: COLORS.danger  },
              { n: responses.length, label: "Total",   c: COLORS.brand   },
            ].map((s) => (
              <View key={s.label} style={{ flex: 1, backgroundColor: `${s.c}12`, borderRadius: 10, padding: 10, alignItems: "center" }}>
                <Text style={{ fontSize: 22, fontWeight: "800", color: s.c }}>{s.n}</Text>
                <Text style={{ fontSize: 11, color: s.c, fontWeight: "600" }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {loading
            ? <ActivityIndicator color={COLORS.brand} style={{ marginTop: 32 }} />
            : responses.length === 0
              ? <Text style={{ textAlign: "center", color: COLORS.gray400, marginTop: 32, fontStyle: "italic" }}>No items recorded</Text>
              : (
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                  {responses.map((r) => (
                    <View key={r.id} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12,
                      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, marginTop: 2,
                        backgroundColor: r.passed ? `${COLORS.success}15` : `${COLORS.danger}15`,
                        alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name={r.passed ? "checkmark-circle" : "close-circle"} size={20}
                          color={r.passed ? COLORS.success : COLORS.danger} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray900, lineHeight: 19 }}>
                          {r.checklist_items?.label ?? "Unknown item"}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <View style={{ backgroundColor: "#F3F4F6", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 10, color: COLORS.gray600, fontWeight: "600" }}>
                              {r.checklist_items?.type?.toUpperCase() ?? ""}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 12, color: COLORS.gray600 }}>{r.value}</Text>
                        </View>
                        {r.notes ? <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 3, fontStyle: "italic" }}>Note: {r.notes}</Text> : null}
                        {r.photo_url ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                            <Ionicons name="camera-outline" size={12} color={COLORS.brand} />
                            <Text style={{ fontSize: 11, color: COLORS.brand }}>Photo attached</Text>
                          </View>
                        ) : null}
                      </View>
                      {!r.passed && (
                        <View style={{ backgroundColor: `${COLORS.danger}12`, borderRadius: 6,
                          paddingHorizontal: 7, paddingVertical: 3, marginTop: 4 }}>
                          <Text style={{ fontSize: 10, fontWeight: "700", color: COLORS.danger }}>FAIL</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
        </View>
      </View>
    </Modal>
  );
}

export default function InspectionsScreen() {
  const [inspections, setInspections] = useState<InspRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<Filter>("all");
  const [detail,      setDetail]      = useState<InspRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("inspections")
      .select("*, locations(name), users(full_name)")
      .order("started_at", { ascending: false })
      .limit(100);
    setInspections(data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = inspections.filter((i) => filter === "all" || i.status === filter);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.gray900 }}>Inspection History</Text>
        <Text style={{ fontSize: 13, color: COLORS.gray400 }}>{inspections.length} inspections across all locations</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingTop: 10, paddingBottom: 10 }}>
        {FILTERS.map((f) => {
          const sel = filter === f.key;
          return (
            <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
                borderColor: sel ? f.color : COLORS.gray200, backgroundColor: sel ? `${f.color}12` : "#FFF" }}
              activeOpacity={0.75}>
              <Text style={{ fontSize: 12, fontWeight: sel ? "700" : "400", color: sel ? f.color : COLORS.gray600 }}>
                {f.label} ({inspections.filter((i) => f.key === "all" || i.status === f.key).length})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.brand} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="clipboard-outline" size={48} color={COLORS.gray200} />
            <Text style={{ color: COLORS.gray400, marginTop: 8 }}>No inspections found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const scoreColor = item.score == null ? COLORS.gray400 : item.score >= 75 ? COLORS.success : COLORS.danger;
          const statusColor = item.status === "completed" ? COLORS.success : item.status === "failed" ? COLORS.danger : COLORS.warning;
          return (
            <TouchableOpacity onPress={() => setDetail(item)} activeOpacity={0.75}>
              <Card style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14,
                    backgroundColor: `${statusColor}14`, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={item.status === "completed" ? "checkmark-circle" : item.status === "failed" ? "close-circle" : "time-outline"}
                      size={24} color={statusColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.gray900 }} numberOfLines={1}>
                      {item.locations?.name ?? item.location_id}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 2 }}>
                      {new Date(item.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {item.users?.full_name ? ` · ${item.users.full_name}` : ""}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    {item.score != null && (
                      <View style={{ backgroundColor: `${scoreColor}14`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 14, fontWeight: "800", color: scoreColor }}>{item.score}%</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={14} color={COLORS.gray400} />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />

      <DetailModal insp={detail} onClose={() => setDetail(null)} />
    </SafeAreaView>
  );
}
