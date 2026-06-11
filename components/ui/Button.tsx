import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { COLORS } from "@/constants";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size    = "sm" | "md" | "lg";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary:   { bg: COLORS.brand,   text: COLORS.white },
  secondary: { bg: COLORS.white,   text: COLORS.brand,   border: COLORS.brand },
  danger:    { bg: COLORS.danger,  text: COLORS.white },
  ghost:     { bg: "transparent",  text: COLORS.brand },
};

const sizeStyles: Record<Size, { py: number; px: number; fontSize: number; radius: number }> = {
  sm: { py: 6,  px: 12, fontSize: 13, radius: 6  },
  md: { py: 12, px: 20, fontSize: 15, radius: 10 },
  lg: { py: 16, px: 24, fontSize: 17, radius: 12 },
};

export function Button({
  label, onPress, variant = "primary", size = "md",
  loading = false, disabled = false, icon, fullWidth = false,
}: Props) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={{
        backgroundColor: v.bg,
        paddingVertical: s.py,
        paddingHorizontal: s.px,
        borderRadius: s.radius,
        borderWidth: v.border ? 1.5 : 0,
        borderColor: v.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        opacity: isDisabled ? 0.55 : 1,
        width: fullWidth ? "100%" : undefined,
      }}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={{ color: v.text, fontSize: s.fontSize, fontWeight: "600" }}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
