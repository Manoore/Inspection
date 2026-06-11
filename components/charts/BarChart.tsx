import React from "react";
import { View, Text } from "react-native";
import { COLORS } from "@/constants";

export interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  data: BarData[];
  unit?: string;
  maxValue?: number;
  barColor?: string;
  chartHeight?: number;
}

export function BarChart({ data, unit = "%", maxValue, barColor, chartHeight = 120 }: Props) {
  if (!data.length) return null;
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <View>
      {/* Bar columns */}
      <View style={{ height: chartHeight, flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
        {data.map((bar) => {
          const ratio     = max > 0 ? bar.value / max : 0;
          const barPx     = Math.max(Math.round(ratio * chartHeight), ratio > 0 ? 4 : 0);
          const color     = bar.color ?? barColor ?? COLORS.brand;
          const remaining = chartHeight - barPx;

          return (
            <View key={bar.label} style={{ flex: 1, alignItems: "center", height: chartHeight, justifyContent: "flex-end" }}>
              {/* value label */}
              <Text style={{
                fontSize: 10, fontWeight: "700",
                color: COLORS.gray600,
                marginBottom: 3,
                position: "absolute",
                top: remaining - 16 < 0 ? 0 : remaining - 16,
              }}>
                {bar.value}{unit}
              </Text>
              {/* bar */}
              <View style={{
                width: "72%",
                height: barPx,
                backgroundColor: color,
                borderRadius: 5,
                opacity: 0.9,
              }} />
            </View>
          );
        })}
      </View>

      {/* Baseline */}
      <View style={{ height: 1, backgroundColor: COLORS.gray200, marginBottom: 6 }} />

      {/* X-axis labels */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        {data.map((bar) => (
          <Text
            key={bar.label}
            style={{ flex: 1, fontSize: 10, color: COLORS.gray400, textAlign: "center" }}
            numberOfLines={1}
          >
            {bar.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
