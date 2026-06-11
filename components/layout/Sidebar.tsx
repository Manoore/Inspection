import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { usePathname, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth";
import { COLORS } from "@/constants";

export interface NavItem {
  name: string;
  label: string;
  icon: string;
  href: string;
  matchPath: string;
}

interface Props { navItems: NavItem[] }

export function Sidebar({ navItems }: Props) {
  const pathname  = usePathname();
  const { user, signOut } = useAuthStore();

  return (
    <View style={{ width: 224, backgroundColor: COLORS.brand, flexDirection: "column" }}>

      {/* Brand */}
      <View style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.white, lineHeight: 26 }}>
          ClinicOps
        </Text>
        <Text style={{
          fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
          color: "rgba(255,255,255,0.45)", marginTop: 3,
        }}>
          Inspection & Training
        </Text>
      </View>

      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginHorizontal: 16, marginBottom: 10 }} />

      {/* Nav */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
        {navItems.map((item) => {
          const active = pathname === item.matchPath || pathname.startsWith(item.matchPath + "/");
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => router.replace(item.href as any)}
              activeOpacity={0.75}
              style={{
                flexDirection: "row", alignItems: "center",
                paddingVertical: 11, paddingHorizontal: 16,
                marginHorizontal: 8, marginVertical: 1,
                borderRadius: 10,
                backgroundColor: active ? "rgba(255,255,255,0.14)" : "transparent",
              }}
            >
              {/* Active indicator */}
              <View style={{
                position: "absolute", left: 8,
                width: 3, height: 20, borderRadius: 2,
                backgroundColor: active ? COLORS.white : "transparent",
              }} />
              <Ionicons
                name={item.icon as any}
                size={19}
                color={active ? COLORS.white : "rgba(255,255,255,0.5)"}
                style={{ marginLeft: 10 }}
              />
              <Text style={{
                marginLeft: 11, fontSize: 14,
                fontWeight: active ? "700" : "400",
                color: active ? COLORS.white : "rgba(255,255,255,0.62)",
              }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User footer */}
      <View style={{
        padding: 16,
        borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)",
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <View style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: "rgba(255,255,255,0.18)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.white }}>
              {user?.full_name?.charAt(0) ?? "U"}
            </Text>
          </View>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.white }} numberOfLines={1}>
              {user?.full_name ?? "User"}
            </Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }} numberOfLines={1}>
              {user?.email ?? ""}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={signOut} activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Ionicons name="log-out-outline" size={16} color="rgba(255,255,255,0.4)" />
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>
            Sign out
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
