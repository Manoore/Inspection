import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HealthScoreCard } from "./HealthScoreCard";
import { Location, HealthScore, OhioRegion } from "@/types";
import { COLORS, REGION_LABELS } from "@/constants";

interface Props {
  region: OhioRegion;
  locations: Location[];
  healthScores: Record<string, HealthScore>;
}

function regionAvgScore(locations: Location[], scores: Record<string, HealthScore>) {
  if (!locations.length) return 0;
  const total = locations.reduce((sum, loc) => sum + (scores[loc.id]?.score ?? loc.health_score), 0);
  return Math.round(total / locations.length);
}

export function RegionGroup({ region, locations, healthScores }: Props) {
  const [expanded, setExpanded] = useState(true);
  const avgScore = regionAvgScore(locations, healthScores);

  const scoreColor =
    avgScore < 60 ? COLORS.danger :
    avgScore < 75 ? COLORS.warning :
    COLORS.success;

  return (
    <View style={{ marginBottom: 8 }}>
      <TouchableOpacity
        onPress={() => setExpanded((e) => !e)}
        style={{
          flexDirection: "row", alignItems: "center",
          paddingVertical: 10, paddingHorizontal: 4,
        }}
        activeOpacity={0.7}
      >
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: `${scoreColor}18`,
          alignItems: "center", justifyContent: "center", marginRight: 10,
        }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: scoreColor }}>{avgScore}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.gray900 }}>
            {REGION_LABELS[region]}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.gray400 }}>
            {locations.length} location{locations.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={COLORS.gray400}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingLeft: 4 }}>
          {locations.map((loc) => (
            <HealthScoreCard
              key={loc.id}
              location={loc}
              healthScore={healthScores[loc.id]}
            />
          ))}
        </View>
      )}
    </View>
  );
}
