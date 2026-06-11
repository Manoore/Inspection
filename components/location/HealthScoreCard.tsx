import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Location, HealthScore } from "@/types";
import { COLORS, SCORE_THRESHOLDS, SERVICE_LINE_LABELS } from "@/constants";

interface Props {
  location: Location;
  healthScore?: HealthScore;
}

function scoreColor(score: number) {
  if (score < SCORE_THRESHOLDS.critical) return COLORS.danger;
  if (score < SCORE_THRESHOLDS.warning)  return COLORS.warning;
  if (score < SCORE_THRESHOLDS.good)     return "#2563EB";
  return COLORS.success;
}

function scoreLabel(score: number) {
  if (score < SCORE_THRESHOLDS.critical) return "Critical";
  if (score < SCORE_THRESHOLDS.warning)  return "At Risk";
  if (score < SCORE_THRESHOLDS.good)     return "Good";
  return "Excellent";
}

export function HealthScoreCard({ location, healthScore }: Props) {
  const score  = healthScore?.score ?? location.health_score;
  const color  = scoreColor(score);
  const label  = scoreLabel(score);
  const shortName = location.name.split("–")[1]?.trim() ?? location.name;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => router.push(`/(corporate)/locations/${location.id}` as any)}
      style={{ marginBottom: 10 }}
    >
      <View style={{
        backgroundColor: COLORS.white,
        borderRadius: 14,
        flexDirection: "row",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
      }}>
        {/* Left color strip */}
        <View style={{ width: 5, backgroundColor: color }} />

        {/* Score circle */}
        <View style={{
          width: 62, alignItems: "center", justifyContent: "center",
          paddingVertical: 16, paddingLeft: 10,
        }}>
          <View style={{
            width: 48, height: 48, borderRadius: 24,
            backgroundColor: `${color}18`,
            alignItems: "center", justifyContent: "center",
            borderWidth: 2, borderColor: `${color}40`,
          }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color }}>{score}</Text>
          </View>
          <Text style={{ fontSize: 9, fontWeight: "700", color, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
            {label}
          </Text>
        </View>

        {/* Main content */}
        <View style={{ flex: 1, paddingVertical: 12, paddingRight: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.gray900, marginBottom: 2 }} numberOfLines={1}>
            {shortName}
          </Text>
          <Text style={{ fontSize: 11, color: COLORS.gray400, marginBottom: 6 }} numberOfLines={1}>
            {location.address}
          </Text>

          {/* Service line pills */}
          <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap" }}>
            {location.service_lines.slice(0, 2).map((sl) => (
              <View key={sl} style={{
                backgroundColor: "#EFF6FF",
                borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
              }}>
                <Text style={{ fontSize: 9, fontWeight: "600", color: "#2563EB" }}>
                  {SERVICE_LINE_LABELS[sl]}
                </Text>
              </View>
            ))}
          </View>

          {/* Health stats row */}
          {healthScore && (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <StatPill
                icon="warning-outline"
                value={healthScore.open_actions_count}
                label="actions"
                alert={healthScore.open_actions_count > 3}
              />
              <StatPill
                icon="ribbon-outline"
                value={`${healthScore.inspection_pass_rate}%`}
                label="pass"
              />
              {healthScore.overdue_training_count > 0 && (
                <StatPill
                  icon="time-outline"
                  value={healthScore.overdue_training_count}
                  label="overdue"
                  alert
                />
              )}
            </View>
          )}
        </View>

        {/* Chevron */}
        <View style={{ justifyContent: "center", paddingRight: 12 }}>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatPill({
  icon, value, label, alert = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  label: string;
  alert?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      <Ionicons name={icon} size={11} color={alert ? COLORS.danger : COLORS.gray400} />
      <Text style={{ fontSize: 11, color: alert ? COLORS.danger : COLORS.gray600, fontWeight: "600" }}>
        {value} {label}
      </Text>
    </View>
  );
}
