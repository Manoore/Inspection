import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card } from "@/components/ui/Card";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import { Location, HealthScore, CorrectiveAction, Inspection } from "@/types";
import { COLORS } from "@/constants";

export default function FieldDashboard() {
  const { user, signOut }  = useAuthStore();
  const [locations,   setLocations]   = useState<Location[]>([]);
  const [scores,      setScores]      = useState<Record<string, HealthScore>>({});
  const [openActions, setOpenActions] = useState<CorrectiveAction[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading,     setLoading]     = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const locIds = user.assigned_location_ids;
    if (!locIds.length) { setLoading(false); return; }

    const [locRes, hsRes, actRes, insRes] = await Promise.all([
      supabase.from("locations").select("*").in("id", locIds),
      supabase.from("health_scores").select("*").in("location_id", locIds),
      supabase.from("corrective_actions").select("*").in("location_id", locIds).neq("status", "resolved"),
      supabase.from("inspections").select("*").in("location_id", locIds).order("completed_at", { ascending: false }).limit(20),
    ]);

    setLocations(locRes.data ?? []);
    const map: Record<string, HealthScore> = {};
    (hsRes.data ?? []).forEach((h: HealthScore) => { map[h.location_id] = h; });
    setScores(map);
    setOpenActions(actRes.data ?? []);
    setInspections(insRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  // ── Chart data ────────────────────────────────────────────────
  const locationBarData = locations.map((l) => ({
    label: l.name.split("–")[1]?.trim() ?? l.name.split(" ").slice(-1)[0],
    value: scores[l.id]?.score ?? l.health_score,
    color: (scores[l.id]?.score ?? l.health_score) >= 90 ? COLORS.success
         : (scores[l.id]?.score ?? l.health_score) >= 75 ? COLORS.warning : COLORS.danger,
  }));

  const passed = inspections.filter((i) => i.status === "completed").length;
  const failed = inspections.filter((i) => i.status === "failed").length;
  const inProg = inspections.filter((i) => i.status === "in_progress").length;
  const donutData = [
    { label: "Completed", value: passed, color: COLORS.success },
    { label: "Failed",    value: failed, color: COLORS.danger  },
    { label: "In Progress", value: inProg, color: COLORS.warning },
  ].filter((d) => d.value > 0);

  const avgScore = locations.length
    ? Math.round(locations.reduce((s, l) => s + (scores[l.id]?.score ?? l.health_score), 0) / locations.length)
    : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.brand }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.white }}>
            {user?.full_name?.split(" ")[0]}
          </Text>
        </View>
        <View style={{ alignItems: "center", marginRight: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.white }}>{avgScore}</Text>
          <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>avg score</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={{ marginLeft: 12 }}>
          <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Open actions alert */}
        {openActions.length > 0 && (
          <Card style={{ backgroundColor: "#fef3c7", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="warning" size={20} color={COLORS.warning} />
              <Text style={{ fontWeight: "700", color: COLORS.warning, marginLeft: 8 }}>
                {openActions.length} open action{openActions.length !== 1 ? "s" : ""} need attention
              </Text>
            </View>
          </Card>
        )}

        {/* ── Charts row ── */}
        {locations.length > 0 && (
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>

            {/* Location scores */}
            <View style={{
              flex: 1, minWidth: 220, backgroundColor: COLORS.white, borderRadius: 16,
              padding: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
            }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.gray900, marginBottom: 12 }}>
                My Location Scores
              </Text>
              <BarChart data={locationBarData} unit="" maxValue={100} />
            </View>

            {/* Inspection status donut */}
            {donutData.length > 0 && (
              <View style={{
                backgroundColor: COLORS.white, borderRadius: 16,
                padding: 16, alignItems: "center",
                shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
              }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.gray900, marginBottom: 10 }}>
                  Inspections
                </Text>
                <DonutChart
                  data={donutData}
                  size={120}
                  strokeWidth={20}
                  centerValue={inspections.length}
                  centerLabel="total"
                />
              </View>
            )}
          </View>
        )}

        {/* Locations list */}
        <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.gray900, marginBottom: 10 }}>
          My Locations
        </Text>

        {locations.map((loc) => {
          const score = scores[loc.id]?.score ?? loc.health_score;
          return (
            <Card key={loc.id} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ScoreRing score={score} size={52} strokeWidth={6} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.gray900 }}>{loc.name}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.gray400 }}>{loc.address}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`/(field)/inspect?locationId=${loc.id}` as any)}
                  style={{ backgroundColor: COLORS.brand, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
                >
                  <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: "700" }}>Inspect</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}

        {locations.length === 0 && !loading && (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="location-outline" size={48} color={COLORS.gray200} />
            <Text style={{ color: COLORS.gray400, marginTop: 8 }}>No assigned locations</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
