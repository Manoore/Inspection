import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { usePathname, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import { NavItem } from "./Sidebar";

interface Props { navItems: NavItem[] }

export function BottomNav({ navItems }: Props) {
  const pathname = usePathname();

  return (
    <View style={{
      flexDirection: "row",
      backgroundColor: COLORS.white,
      borderTopWidth: 1,
      borderTopColor: COLORS.gray200,
      paddingBottom: 4,
    }}>
      {navItems.map((item) => {
        const active = pathname === item.matchPath || pathname.startsWith(item.matchPath + "/");
        return (
          <TouchableOpacity
            key={item.name}
            onPress={() => router.replace(item.href as any)}
            style={{ flex: 1, alignItems: "center", paddingVertical: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name={item.icon as any} size={22} color={active ? COLORS.brand : COLORS.gray400} />
            <Text style={{
              fontSize: 10, fontWeight: "600", marginTop: 2,
              color: active ? COLORS.brand : COLORS.gray400,
            }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
