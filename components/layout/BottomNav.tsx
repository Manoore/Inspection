import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { usePathname, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import { NavItem } from "./Sidebar";

interface Props { navItems: NavItem[] }

const PRIMARY_COUNT = 4;

export function BottomNav({ navItems }: Props) {
  const pathname   = usePathname();
  const [more, setMore] = useState(false);

  const primary   = navItems.slice(0, PRIMARY_COUNT);
  const secondary = navItems.slice(PRIMARY_COUNT);

  const isActive = (item: NavItem) =>
    pathname === item.matchPath || pathname.startsWith(item.matchPath + "/");

  const go = (href: string) => {
    setMore(false);
    router.replace(href as any);
  };

  const anySecondaryActive = secondary.some(isActive);

  return (
    <>
      <View style={{
        flexDirection: "row",
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray200,
        paddingBottom: 8,
      }}>
        {primary.map((item) => {
          const active = isActive(item);
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => go(item.href)}
              style={{ flex: 1, alignItems: "center", paddingVertical: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon as any} size={24} color={active ? COLORS.brand : COLORS.gray400} />
              <Text style={{ fontSize: 10, fontWeight: "600", marginTop: 3,
                color: active ? COLORS.brand : COLORS.gray400 }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* More button */}
        {secondary.length > 0 && (
          <TouchableOpacity
            onPress={() => setMore(true)}
            style={{ flex: 1, alignItems: "center", paddingVertical: 10 }}
            activeOpacity={0.7}
          >
            <View style={{ position: "relative" }}>
              <Ionicons name="grid-outline" size={24}
                color={anySecondaryActive || more ? COLORS.brand : COLORS.gray400} />
              {anySecondaryActive && (
                <View style={{ position: "absolute", top: -2, right: -2,
                  width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.brand }} />
              )}
            </View>
            <Text style={{ fontSize: 10, fontWeight: "600", marginTop: 3,
              color: anySecondaryActive || more ? COLORS.brand : COLORS.gray400 }}>
              More
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* More drawer */}
      <Modal visible={more} transparent animationType="slide" onRequestClose={() => setMore(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={() => setMore(false)}>
          <Pressable style={{ position: "absolute", bottom: 0, left: 0, right: 0,
            backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
            paddingTop: 12, paddingBottom: 40 }}
            onPress={(e) => e.stopPropagation()}>

            {/* Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.gray200,
              alignSelf: "center", marginBottom: 16 }} />

            <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.gray400,
              paddingHorizontal: 20, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>
              More
            </Text>

            {secondary.map((item) => {
              const active = isActive(item);
              return (
                <TouchableOpacity key={item.name} onPress={() => go(item.href)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 16,
                    paddingHorizontal: 20, paddingVertical: 14,
                    backgroundColor: active ? `${COLORS.brand}08` : "transparent" }}
                  activeOpacity={0.7}>
                  <View style={{ width: 44, height: 44, borderRadius: 14,
                    backgroundColor: active ? `${COLORS.brand}14` : COLORS.gray100 ?? "#F3F4F6",
                    alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={item.icon as any} size={22}
                      color={active ? COLORS.brand : COLORS.gray400} />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: active ? "700" : "500",
                    color: active ? COLORS.brand : COLORS.gray900 }}>
                    {item.label}
                  </Text>
                  {active && (
                    <View style={{ marginLeft: "auto" }}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.brand} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
