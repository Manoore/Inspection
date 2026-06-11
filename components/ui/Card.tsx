import React from "react";
import { View, ViewStyle } from "react-native";
import { COLORS } from "@/constants";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  shadow?: boolean;
}

export function Card({ children, style, padding = 16, shadow = true }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: COLORS.white,
          borderRadius: 14,
          padding,
          ...(shadow && {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 3,
          }),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
