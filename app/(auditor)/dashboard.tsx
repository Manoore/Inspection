import React from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { HealthScoreCard } from "@/components/location/HealthScoreCard";
import { useLocations } from "@/hooks/useLocations";
import { useAuthStore } from "@/store/auth";
import { COLORS } from "@/constants";

export default function AuditorDashboard() {
  const { user } = useAuthStore();
  const { locations, healthScores, overallScore, loading, refresh } = useLocations();

  const critical = locations.filter((l) => (healthScores[l.id]?.score ?? l.health_score) < 60);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: COLORS.brand,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Auditor View</Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.white }}>
            {user?.full_name}
          </Text>
        </View>
        <ScoreRing score={overallScore} size={52} strokeWidth={5} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {critical.length > 0 && (
          <View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.danger, marginBottom: 8 }}>
              Critical Locations ({critical.length})
            </Text>
            {critical.map((loc) => (
              <HealthScoreCard key={loc.id} location={loc} healthScore={healthScores[loc.id]} />
            ))}
          </View>
        )}

        <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.gray900, marginBottom: 8, marginTop: 8 }}>
          All Locations
        </Text>
        {locations.map((loc) => (
          <HealthScoreCard key={loc.id} location={loc} healthScore={healthScores[loc.id]} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
