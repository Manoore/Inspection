import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { supabase } from "@/lib/supabase";
import { useChecklist } from "@/hooks/useChecklist";
import { useAuthStore } from "@/store/auth";
import { Location, Inspection, HealthScore } from "@/types";
import { COLORS, SERVICE_LINE_LABELS } from "@/constants";

function statusColor(s: string) {
  if (s === "completed") return COLORS.success;
  if (s === "failed")    return COLORS.danger;
  if (s === "in_progress") return COLORS.warning;
  return COLORS.gray400;
}
function statusLabel(s: string) {
  if (s === "completed")   return "Completed";
  if (s === "failed")      return "Failed";
  if (s === "in_progress") return "In Progress";
  return "Pending";
}

// ── Per-item detail modal ─────────────────────────────────────────────────────

interface InspResponse {
  id: string; passed: boolean; value: string; notes?: string; photo_url?: string;
  checklist_items?: { label: string; type: string } | null;
}

function InspDetailModal({ detail, locName, onClose }: {
  detail: Inspection | null; locName: string; onClose: () => void;
}) {
  const [responses, setResponses] = useState<InspResponse[]>([]);
  const [fetching,  setFetching]  = useState(false);

  useEffect(() => {
    if (!detail) return;
    setFetching(true);
    supabase.from("inspection_responses")
      .select("*, checklist_items(label, type)")
      .eq("inspection_id", detail.id)
      .then(({ data }) => { setResponses(data ?? []); setFetching(false); });
  }, [detail?.id]);

  if (!detail) return null;
  const sc     = detail.score ?? 0;
  const color  = sc >= 90 ? COLORS.success : sc >= 75 ? COLORS.warning : COLORS.danger;
  const passed = responses.filter((r) => r.passed).length;
  const failed = responses.filter((r) => !r.passed).length;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: "92%", paddingBottom: 36 }}>

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", padding: 20,
            borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "800", color: COLORS.gray900 }}>Inspection Details</Text>
              <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 2 }}>{locName}</Text>
            </View>
            <View style={{ alignItems: "center", marginRight: 14 }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color }}>{sc}%</Text>
              <Text style={{ fontSize: 10, color: COLORS.gray400 }}>Score</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>

          {/* Meta */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
            <View style={{ backgroundColor: `${statusColor(detail.status)}14`, borderRadius: 8,
              paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: statusColor(detail.status) }}>
                {statusLabel(detail.status)}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: COLORS.gray400 }}>
              {new Date(detail.started_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
            {detail.completed_at && (
              <Text style={{ fontSize: 12, color: COLORS.gray400 }}>
                · {Math.round((new Date(detail.completed_at).getTime() - new Date(detail.started_at).getTime()) / 60000)} min
              </Text>
            )}
          </View>

          {/* Summary counts */}
          <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 8 }}>
            {[
              { n: passed,           label: "Passed", c: COLORS.success },
              { n: failed,           label: "Failed", c: COLORS.danger  },
              { n: responses.length, label: "Total",  c: COLORS.brand   },
            ].map((s) => (
              <View key={s.label} style={{ flex: 1, backgroundColor: `${s.c}12`,
                borderRadius: 10, padding: 10, alignItems: "center" }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: s.c }}>{s.n}</Text>
                <Text style={{ fontSize: 11, color: s.c, fontWeight: "600" }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Items */}
          {fetching ? (
            <ActivityIndicator color={COLORS.brand} style={{ marginVertical: 28 }} />
          ) : responses.length === 0 ? (
            <Text style={{ textAlign: "center", color: COLORS.gray400, margin: 32, fontStyle: "italic" }}>
              No response data recorded
            </Text>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}>
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
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                      {r.checklist_items?.type ? (
                        <View style={{ backgroundColor: "#F3F4F6", borderRadius: 5,
                          paddingHorizontal: 7, paddingVertical: 2 }}>
                          <Text style={{ fontSize: 10, color: COLORS.gray600, fontWeight: "600" }}>
                            {r.checklist_items.type.toUpperCase()}
                          </Text>
                        </View>
                      ) : null}
                      <Text style={{ fontSize: 12, color: COLORS.gray600 }}>{r.value}</Text>
                    </View>
                    {r.notes ? (
                      <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 3, fontStyle: "italic" }}>
                        Note: {r.notes}
                      </Text>
                    ) : null}
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

// ── Hub screen (no locationId) ────────────────────────────────────────────────

function InspectHub() {
  const { user } = useAuthStore();
  const [locations,   setLocations]   = useState<Location[]>([]);
  const [scores,      setScores]      = useState<Record<string, HealthScore>>({});
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [locMap,      setLocMap]      = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(true);
  const [detail,      setDetail]      = useState<Inspection | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const locIds = user.assigned_location_ids;
    if (!locIds.length) { setLoading(false); return; }

    const [locRes, hsRes, insRes] = await Promise.all([
      supabase.from("locations").select("*").in("id", locIds),
      supabase.from("health_scores").select("*").in("location_id", locIds),
      supabase.from("inspections").select("*").in("location_id", locIds)
        .order("started_at", { ascending: false }).limit(30),
    ]);

    const locs = locRes.data ?? [];
    setLocations(locs);
    const map: Record<string, HealthScore> = {};
    (hsRes.data ?? []).forEach((h: HealthScore) => { map[h.location_id] = h; });
    setScores(map);
    setInspections(insRes.data ?? []);
    const lm: Record<string, string> = {};
    locs.forEach((l: Location) => { lm[l.id] = l.name; });
    setLocMap(lm);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={COLORS.brand} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.gray900 }}>Inspections</Text>
        <Text style={{ fontSize: 13, color: COLORS.gray400, marginTop: 2 }}>
          {locations.length} locations · {inspections.length} inspections
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.brand} />}
      >
        {/* My Locations */}
        <Text style={{ fontSize: 13, fontWeight: "800", color: COLORS.brand, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
          My Locations
        </Text>
        {locations.map((loc) => {
          const score = scores[loc.id]?.score ?? loc.health_score;
          const sc = score >= 90 ? COLORS.success : score >= 75 ? COLORS.warning : COLORS.danger;
          return (
            <Card key={loc.id} style={{ marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 4, borderRadius: 2, backgroundColor: sc, alignSelf: "stretch", marginRight: 12 }} />
              <ScoreRing score={score} size={48} strokeWidth={5} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.gray900 }} numberOfLines={1}>
                  {loc.name.split("–")[1]?.trim() ?? loc.name}
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.gray400 }} numberOfLines={1}>{loc.address}</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/(field)/inspect?locationId=${loc.id}` as any)}
                style={{ backgroundColor: COLORS.brand, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 8 }}
                activeOpacity={0.85}
              >
                <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>Inspect</Text>
              </TouchableOpacity>
            </Card>
          );
        })}

        {/* Inspection History */}
        <Text style={{ fontSize: 13, fontWeight: "800", color: COLORS.gray600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, marginTop: 20 }}>
          Inspection History
        </Text>
        {inspections.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <Ionicons name="clipboard-outline" size={40} color={COLORS.gray200} />
            <Text style={{ color: COLORS.gray400, marginTop: 8 }}>No inspections yet</Text>
          </View>
        )}
        {inspections.map((ins) => {
          const sc = ins.score ?? 0;
          const color = sc >= 90 ? COLORS.success : sc >= 75 ? COLORS.warning : COLORS.danger;
          const locName = locMap[ins.location_id] ?? ins.location_id;
          return (
            <TouchableOpacity key={ins.id} onPress={() => setDetail(ins)} activeOpacity={0.8}>
              <Card style={{ marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
                {/* Score circle */}
                <View style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: `${color}18`, alignItems: "center",
                  justifyContent: "center", borderWidth: 2, borderColor: `${color}40`,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: "800", color }}>{sc}%</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.gray900 }} numberOfLines={1}>
                    {locName.split("–")[1]?.trim() ?? locName}
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.gray400, marginTop: 1 }}>
                    {new Date(ins.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <View style={{ backgroundColor: `${statusColor(ins.status)}14`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: statusColor(ins.status) }}>
                      {statusLabel(ins.status)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.gray400} />
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <InspDetailModal
        detail={detail}
        locName={locMap[detail?.location_id ?? ""] ?? ""}
        onClose={() => setDetail(null)}
      />
    </SafeAreaView>
  );
}

// ── Checklist selection (locationId provided) ─────────────────────────────────

function ChecklistSelect({ locationId }: { locationId: string }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    supabase.from("locations").select("*").eq("id", locationId).single()
      .then(({ data }) => { setLocation(data); setLoading(false); });
  }, [locationId]);

  const { checklists, loading: clLoading } = useChecklist(location?.service_lines ?? []);

  if (loading || clLoading || !location) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={COLORS.brand} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.brand }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.white }} numberOfLines={1}>{location.name}</Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Select checklist</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {checklists.map((cl) => (
          <Card key={cl.id} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.gray900 }}>{cl.name}</Text>
                <View style={{ marginTop: 4 }}>
                  <Badge label={SERVICE_LINE_LABELS[cl.service_line]} variant="info" />
                </View>
              </View>
              <Text style={{ fontSize: 11, color: COLORS.gray400 }}>v{cl.version}</Text>
            </View>
            <Text style={{ fontSize: 12, color: COLORS.gray400, marginBottom: 12 }}>
              {cl.items.length} item{cl.items.length !== 1 ? "s" : ""}
            </Text>
            <Button
              label="Start Inspection"
              onPress={() => router.push(`/(field)/inspect/${cl.id}?locationId=${locationId}` as any)}
              size="sm"
            />
          </Card>
        ))}
        {checklists.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="clipboard-outline" size={48} color={COLORS.gray200} />
            <Text style={{ color: COLORS.gray400, marginTop: 8 }}>No active checklists for this location</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Route entry point ─────────────────────────────────────────────────────────

export default function InspectScreen() {
  const { locationId } = useLocalSearchParams<{ locationId: string }>();
  return locationId ? <ChecklistSelect locationId={locationId} /> : <InspectHub />;
}
