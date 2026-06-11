import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";

interface Props {
  briefing: string;
}

export function RiskBriefing({ briefing }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <View style={{
      backgroundColor: "#fffbeb",
      borderWidth: 1.5,
      borderColor: "#fde68a",
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
    }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{
          width: 32, height: 32, borderRadius: 8,
          backgroundColor: "#fde68a", alignItems: "center", justifyContent: "center",
          marginRight: 10,
        }}>
          <Ionicons name="bulb" size={18} color={COLORS.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.warning, marginBottom: 4 }}>
            AI RISK BRIEFING
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 18 }}>
            {briefing}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setDismissed(true)} style={{ padding: 4 }}>
          <Ionicons name="close" size={16} color={COLORS.gray400} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
