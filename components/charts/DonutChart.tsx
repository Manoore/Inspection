import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { COLORS } from "@/constants";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string | number;
  title?: string;
}

export function DonutChart({ data, size = 140, strokeWidth = 24, centerLabel, centerValue, title }: Props) {
  const r    = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);

  let acc = 0;
  const segments = data.map((d) => {
    const arc = total > 0 ? (d.value / total) * circ : 0;
    const seg = { ...d, arc, offset: acc };
    acc += arc;
    return seg;
  });

  return (
    <View style={{ alignItems: "center" }}>
      {title && (
        <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.gray600, marginBottom: 8 }}>
          {title}
        </Text>
      )}

      <View style={{ position: "relative", width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* background ring */}
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth}
          />
          <G rotation={-90} origin={`${size / 2},${size / 2}`}>
            {segments.map((seg) => (
              <Circle
                key={seg.label}
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg.arc} ${circ - seg.arc}`}
                strokeDashoffset={-seg.offset}
                strokeLinecap="butt"
              />
            ))}
          </G>
        </Svg>

        {/* Center text */}
        {centerValue != null && (
          <View style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.gray900 }}>
              {centerValue}
            </Text>
            {centerLabel && (
              <Text style={{ fontSize: 10, color: COLORS.gray400, marginTop: 2 }}>{centerLabel}</Text>
            )}
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 12, gap: 8 }}>
        {data.map((d) => (
          <View key={d.label} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: d.color }} />
            <Text style={{ fontSize: 11, color: COLORS.gray600 ?? "#4B5563" }}>{d.label} ({d.value})</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
