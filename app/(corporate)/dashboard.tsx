import React, { useState } from "react";
import {
  View, Text, ScrollView, RefreshControl, TextInput, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { RegionGroup } from "@/components/location/RegionGroup";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { useLocations } from "@/hooks/useLocations";
import { useAuthStore } from "@/store/auth";
import { COLORS, REGION_LABELS, SCORE_THRESHOLDS } from "@/constants";
import { OhioRegion } from "@/types";

const REGIONS = Object.keys(REGION_LABELS) as OhioRegion[];

export default function CorporateDashboard() {
  const { user, signOut }  = useAuthStore();
  const { byRegion, healthScores, locations, overallScore, loading, refresh } = useLocations();
  const [search, setSearch] = useState("");

  // ── Chart data ────────────────────────────────────────────────
  const regionBarData = REGIONS
    .filter((r) => (byRegion[r] ?? []).length > 0)
    .map((r) => {
      const locs = byRegion[r] ?? [];
      const avg  = locs.length
        ? Math.round(locs.reduce((s, l) => s + (healthScores[l.id]?.score ?? l.health_score), 0) / locs.length)
        : 0;
      const color = avg >= SCORE_THRESHOLDS.good ? COLORS.success : avg >= SCORE_THRESHOLDS.warning ? COLORS.warning : COLORS.danger;
      return { label: REGION_LABELS[r].split(" ")[0], value: avg, color };
    });

  const critical  = locations.filter((l) => (healthScores[l.id]?.score ?? l.health_score) < SCORE_THRESHOLDS.warning).length;
  const atRisk    = locations.filter((l) => { const s = healthScores[l.id]?.score ?? l.health_score; return s >= SCORE_THRESHOLDS.warning && s < SCORE_THRESHOLDS.good; }).length;
  const good      = locations.filter((l) => { const s = healthScores[l.id]?.score ?? l.health_score; return s >= SCORE_THRESHOLDS.good && s < 90; }).length;
  const excellent = locations.filter((l) => (healthScores[l.id]?.score ?? l.health_score) >= 90).length;

  const donutData = [
    { label: "Critical",  value: critical,  color: COLORS.danger  },
    { label: "At Risk",   value: atRisk,    color: COLORS.warning },
    { label: "Good",      value: good,      color: COLORS.brand   },
    { label: "Excellent", value: excellent, color: COLORS.success },
  ].filter((d) => d.value > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.brand }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            {new Date().getHours() < 12 ? "Good morning" : "Good afternoon"}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.white }}>{user?.full_name ?? "Admin"}</Text>
        </View>
        <ScoreRing score={overallScore} size={52} strokeWidth={5} />
        <TouchableOpacity onPress={signOut} style={{ marginLeft: 12 }}>
          <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={{ backgroundColor: COLORS.brand, paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", gap: 24 }}>
        {[{ label: "Locations", value: "33" }, { label: "Network Score", value: `${overallScore}` }, { label: "Regions", value: "6" }].map((s) => (
          <View key={s.label} style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.white }}>{s.value}</Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Charts row ── */}
        <View style={{ margin: 16, flexDirection: "row", gap: 12, flexWrap: "wrap" }}>

          {/* Region scores bar chart */}
          <View style={{
            flex: 1, minWidth: 260, backgroundColor: COLORS.white, borderRadius: 16,
            padding: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
          }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.gray900, marginBottom: 14 }}>
              Score by Region
            </Text>
            <BarChart data={regionBarData} unit="" maxValue={100} />
          </View>

          {/* Donut score distribution */}
          <View style={{
            backgroundColor: COLORS.white, borderRadius: 16,
            padding: 16, alignItems: "center",
            shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
            minWidth: 200,
          }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.gray900, marginBottom: 10 }}>
              Location Status
            </Text>
            <DonutChart
              data={donutData}
              size={130}
              strokeWidth={22}
              centerValue={locations.length}
              centerLabel="locations"
            />
          </View>
        </View>

        {/* Search */}
        <View style={{
          flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 12,
          backgroundColor: COLORS.white, borderRadius: 12,
          paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: COLORS.gray200,
        }}>
          <Ionicons name="search-outline" size={18} color={COLORS.gray400} />
          <TextInput
            placeholder="Search locations…" value={search} onChangeText={setSearch}
            style={{ flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.gray900 }}
            placeholderTextColor={COLORS.gray400}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Locations by region */}
        <View style={{ paddingHorizontal: 16 }}>
          {REGIONS.map((region) => {
            const locs = (byRegion[region] ?? []).filter((l) =>
              !search || l.name.toLowerCase().includes(search.toLowerCase())
            );
            if (!locs.length) return null;
            return (
              <RegionGroup key={region} region={region} locations={locs} healthScores={healthScores} />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
