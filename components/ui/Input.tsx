import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Input({ label, error, secureToggle = false, icon, ...props }: Props) {
  const [hidden, setHidden] = useState(secureToggle);

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray600, marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1.5,
          borderColor: error ? COLORS.danger : COLORS.gray200,
          borderRadius: 10,
          backgroundColor: COLORS.white,
          paddingHorizontal: 14,
          height: 48,
        }}
      >
        {icon && (
          <Ionicons name={icon} size={18} color={COLORS.gray400} style={{ marginRight: 8 }} />
        )}
        <TextInput
          {...props}
          secureTextEntry={hidden}
          style={{ flex: 1, fontSize: 15, color: COLORS.gray900 }}
          placeholderTextColor={COLORS.gray400}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setHidden((h) => !h)}>
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.gray400} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={{ fontSize: 12, color: COLORS.danger, marginTop: 4 }}>{error}</Text>}
    </View>
  );
}
