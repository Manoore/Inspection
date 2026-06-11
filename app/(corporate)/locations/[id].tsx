import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { Location, HealthScore, Inspection, CorrectiveAction } from "@/types";
import { COLORS, SCORE_THRESHOLDS, SERVICE_LINE_LABELS } from "@/constants";

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [location,   setLocation]   = useState<Location | null>(null);
  const [health,     setHealth]     = useState<HealthScore | null>(null);
  const [inspections,setInspections]= useState<Inspection[]>([]);
  const [actions,    setActions]    = useState<CorrectiveAction[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    (async () => {
      const [locRes, hsRes, insRes, actRes] = await Promise.all([
        supabase.from("locations").select("*").eq("id", id).single(),
        supabase.from("health_scores").select("*").eq("location_id", id).single(),
        supabase.from("inspections").select("*").eq("location_id", id).order("started_at", { ascending: false }).limit(5),
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
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: COLORS.brand,
      }}>
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
            <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.gray900, marginBottom: 12 }}>
              Health Score Breakdown
            </Text>
            {[
              { label: "Inspection Pass Rate", value: `${health.inspection_pass_rate}%`, weight: "40%" },
              { label: "Open Corrective Actions", value: health.open_actions_count, weight: "25%", alert: health.open_actions_count > 3 },
              { label: "Overdue Training",         value: health.overdue_training_count, weight: "20%", alert: health.overdue_training_count > 0 },
              { label: "Missed Inspection Rounds", value: health.missed_rounds_count,   weight: "15%", alert: health.missed_rounds_count > 0 },
            ].map((row) => (
              <View key={row.label} style={{
                flexDirection: "row", alignItems: "center",
                paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
              }}>
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

        {/* Recent Inspections */}
        <Card style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.gray900, marginBottom: 10 }}>
            Recent Inspections
          </Text>
          {inspections.length === 0
            ? <Text style={{ color: COLORS.gray400, fontSize: 13 }}>No inspections yet</Text>
            : inspections.map((ins) => (
              <View key={ins.id} style={{
                flexDirection: "row", alignItems: "center",
                paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
              }}>
                <Ionicons
                  name={ins.status === "completed" ? "checkmark-circle" : "time-outline"}
                  size={18}
                  color={ins.status === "completed" ? COLORS.success : COLORS.warning}
                />
                <Text style={{ flex: 1, marginLeft: 8, fontSize: 13, color: COLORS.gray600 }}>
                  {new Date(ins.started_at).toLocaleDateString()}
                </Text>
                {ins.score != null && (
                  <Badge
                    label={`${ins.score}%`}
                    variant={ins.score >= 75 ? "success" : "danger"}
                  />
                )}
              </View>
            ))
          }
        </Card>

        {/* Open Actions */}
        <Card>
          <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.gray900, marginBottom: 10 }}>
            Open Corrective Actions
          </Text>
          {actions.length === 0
            ? <Text style={{ color: COLORS.success, fontSize: 13 }}>No open actions</Text>
            : actions.map((a) => (
              <View key={a.id} style={{
                paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
              }}>
                <Text style={{ fontSize: 13, color: COLORS.gray900 }}>{a.description}</Text>
                <Text style={{ fontSize: 11, color: a.status === "overdue" ? COLORS.danger : COLORS.gray400, marginTop: 2 }}>
                  Due: {a.due_date} • {a.status.toUpperCase()}
                </Text>
              </View>
            ))
          }
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
