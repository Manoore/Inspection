import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { Location, HealthScore, Inspection, CorrectiveAction } from "@/types";
import { COLORS, SCORE_THRESHOLDS, SERVICE_LINE_LABELS } from "@/constants";

interface InspectionResponse {
  id: string;
  item_id: string;
  value: string;
  passed: boolean;
  notes?: string;
  photo_url?: string;
  checklist_items?: { label: string; type: string } | null;
}

function InspectionDetailModal({
  inspection, visible, onClose,
}: { inspection: Inspection | null; visible: boolean; onClose: () => void }) {
  const [responses, setResponses] = useState<InspectionResponse[]>([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (!inspection) return;
    setLoading(true);
    supabase
      .from("inspection_responses")
      .select("*, checklist_items(label, type)")
      .eq("inspection_id", inspection.id)
      .then(({ data }) => {
        setResponses(data ?? []);
        setLoading(false);
      });
  }, [inspection?.id]);

  if (!inspection) return null;

  const passed  = responses.filter((r) => r.passed).length;
  const failed  = responses.filter((r) => !r.passed).length;
  const dateStr = new Date(inspection.started_at).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: "92%", paddingBottom: 36 }}>

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", padding: 20,
            borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "800", color: COLORS.gray900 }}>Inspection Detail</Text>
              <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 2 }}>{dateStr}</Text>
            </View>
            {inspection.score != null && (
              <View style={{ alignItems: "center", marginRight: 12 }}>
                <Text style={{ fontSize: 24, fontWeight: "800",
                  color: inspection.score >= 75 ? COLORS.success : COLORS.danger }}>
                  {inspection.score}%
                </Text>
                <Text style={{ fontSize: 10, color: COLORS.gray400 }}>Score</Text>
              </View>
            )}
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>

          {/* Summary bar */}
          <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingVertical: 12, gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: `${COLORS.success}12`, borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.success }}>{passed}</Text>
              <Text style={{ fontSize: 11, color: COLORS.success, fontWeight: "600" }}>Passed</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: `${COLORS.danger}12`, borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.danger }}>{failed}</Text>
              <Text style={{ fontSize: 11, color: COLORS.danger, fontWeight: "600" }}>Failed</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: `${COLORS.brand}12`, borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.brand }}>{responses.length}</Text>
              <Text style={{ fontSize: 11, color: COLORS.brand, fontWeight: "600" }}>Total Items</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.brand} style={{ marginTop: 40 }} />
          ) : responses.length === 0 ? (
            <Text style={{ textAlign: "center", color: COLORS.gray400, marginTop: 32, fontStyle: "italic" }}>
              No response data recorded for this inspection
            </Text>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}>
              {responses.map((r) => (
                <View key={r.id} style={{
                  flexDirection: "row", alignItems: "flex-start", gap: 12,
                  paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 ?? "#F3F4F6",
                }}>
                  {/* Pass/fail icon */}
                  <View style={{ width: 32, height: 32, borderRadius: 16, marginTop: 2,
                    backgroundColor: r.passed ? `${COLORS.success}15` : `${COLORS.danger}15`,
                    alignItems: "center", justifyContent: "center" }}>
                    <Ionicons
                      name={r.passed ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={r.passed ? COLORS.success : COLORS.danger}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray900, lineHeight: 19 }}>
                      {r.checklist_items?.label ?? "Unknown item"}
                    </Text>

                    {/* Value row */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <View style={{ backgroundColor: COLORS.gray100 ?? "#F3F4F6", borderRadius: 6,
                        paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 11, color: COLORS.gray600, fontWeight: "600" }}>
                          {r.checklist_items?.type?.toUpperCase() ?? ""}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: COLORS.gray600 }}>{r.value}</Text>
                    </View>

                    {r.notes ? (
                      <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 4, fontStyle: "italic" }}>
                        Note: {r.notes}
                      </Text>
                    ) : null}

                    {r.photo_url ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
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

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [location,    setLocation]    = useState<Location | null>(null);
  const [health,      setHealth]      = useState<HealthScore | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [actions,     setActions]     = useState<CorrectiveAction[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [detailIns,   setDetailIns]   = useState<Inspection | null>(null);

  useEffect(() => {
    (async () => {
      const [locRes, hsRes, insRes, actRes] = await Promise.all([
        supabase.from("locations").select("*").eq("id", id).single(),
        supabase.from("health_scores").select("*").eq("location_id", id).single(),
        supabase.from("inspections").select("*").eq("location_id", id).order("started_at", { ascending: false }).limit(10),
        supabase.from("corrective_actions").select("*").eq("location_id", id).neq("status", "resolved").order("due_date"),
      ]);
      setLocation(locRes.data);
      setHealth(hsRes.data);
      setInspections(insRes.data ?? []);
      setActions(actRes.data ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading || !location) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={COLORS.brand} size="large" />
      </View>
    );
  }

  const score = health?.score ?? location.health_score;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.brand }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: "700", color: COLORS.white, marginLeft: 12 }} numberOfLines={1}>
          {location.name}
        </Text>
        <ScoreRing score={score} size={44} strokeWidth={5} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Address + Service lines */}
        <Card style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.gray400 }}>{location.address}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {location.service_lines.map((sl) => (
              <Badge key={sl} label={SERVICE_LINE_LABELS[sl]} variant="info" />
            ))}
          </View>
        </Card>

        {/* Score breakdown */}
        {health && (
          <Card style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.gray900, marginBottom: 12 }}>Health Score Breakdown</Text>
            {[
              { label: "Inspection Pass Rate",      value: `${health.inspection_pass_rate}%`, weight: "40%", alert: false },
              { label: "Open Corrective Actions",   value: health.open_actions_count,         weight: "25%", alert: health.open_actions_count > 3 },
              { label: "Overdue Training",           value: health.overdue_training_count,     weight: "20%", alert: health.overdue_training_count > 0 },
              { label: "Missed Inspection Rounds",  value: health.missed_rounds_count,         weight: "15%", alert: health.missed_rounds_count > 0 },
            ].map((row) => (
              <View key={row.label} style={{ flexDirection: "row", alignItems: "center",
                paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: COLORS.gray600 }}>{row.label}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.gray400 }}>Weight: {row.weight}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: row.alert ? COLORS.danger : COLORS.gray900 }}>
                  {row.value}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Recent Inspections — tap to see full item results */}
        <Card style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.gray900, marginBottom: 4 }}>Recent Inspections</Text>
          <Text style={{ fontSize: 12, color: COLORS.gray400, marginBottom: 12 }}>Tap any row to see all inspected items</Text>
          {inspections.length === 0
            ? <Text style={{ color: COLORS.gray400, fontSize: 13 }}>No inspections yet</Text>
            : inspections.map((ins) => {
              const scoreColor = ins.score == null ? COLORS.gray400 : ins.score >= 75 ? COLORS.success : COLORS.danger;
              return (
                <TouchableOpacity key={ins.id} onPress={() => setDetailIns(ins)} activeOpacity={0.7}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10,
                    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18,
                    backgroundColor: ins.status === "completed" ? `${COLORS.success}15` : `${COLORS.warning}15`,
                    alignItems: "center", justifyContent: "center" }}>
                    <Ionicons
                      name={ins.status === "completed" ? "checkmark-circle" : "time-outline"}
                      size={20}
                      color={ins.status === "completed" ? COLORS.success : COLORS.warning}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray900 }}>
                      {new Date(ins.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </Text>
                    <Text style={{ fontSize: 11, color: COLORS.gray400, marginTop: 1, textTransform: "capitalize" }}>
                      {ins.status.replace("_", " ")}
                      {ins.completed_at ? ` · ${Math.round((new Date(ins.completed_at).getTime() - new Date(ins.started_at).getTime()) / 60000)} min` : ""}
                    </Text>
                  </View>
                  {ins.score != null && (
                    <View style={{ backgroundColor: `${scoreColor}14`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: scoreColor }}>{ins.score}%</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
                </TouchableOpacity>
              );
            })
          }
        </Card>

        {/* Open Actions */}
        <Card>
          <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.gray900, marginBottom: 10 }}>Open Corrective Actions</Text>
          {actions.length === 0
            ? <Text style={{ color: COLORS.success, fontSize: 13 }}>No open actions</Text>
            : actions.map((a) => (
              <View key={a.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
                <Text style={{ fontSize: 13, color: COLORS.gray900 }}>{a.description}</Text>
                <Text style={{ fontSize: 11, color: a.status === "overdue" ? COLORS.danger : COLORS.gray400, marginTop: 2 }}>
                  Due: {a.due_date} · {a.status.toUpperCase()}
                </Text>
              </View>
            ))
          }
        </Card>

      </ScrollView>

      <InspectionDetailModal
        inspection={detailIns}
        visible={!!detailIns}
        onClose={() => setDetailIns(null)}
      />
    </SafeAreaView>
  );
}
