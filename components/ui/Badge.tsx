import React from "react";
import { View, Text } from "react-native";
import { COLORS } from "@/constants";

type Variant = "success" | "warning" | "danger" | "info" | "neutral" | "default";

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  success: { bg: "#dcfce7", text: COLORS.success },
  warning: { bg: "#fef3c7", text: COLORS.warning },
  danger:  { bg: "#fee2e2", text: COLORS.danger  },
  info:    { bg: "#dbeafe", text: COLORS.brand   },
  neutral: { bg: COLORS.gray200, text: COLORS.gray600 },
  default: { bg: COLORS.gray200, text: COLORS.gray600 },
};

interface Props {
  label: string;
  variant?: Variant;
  size?: "sm" | "md";
}

export function Badge({ label, variant = "neutral", size = "sm" }: Props) {
  const c = COLOR_MAP[variant] ?? COLOR_MAP["neutral"];
  const isSmall = size === "sm";

  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderRadius: 20,
        paddingHorizontal: isSmall ? 8 : 12,
        paddingVertical: isSmall ? 2 : 4,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: c.text, fontSize: isSmall ? 11 : 13, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}
