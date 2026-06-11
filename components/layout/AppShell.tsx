import React from "react";
import { View, useWindowDimensions } from "react-native";
import { Slot } from "expo-router";
import { Sidebar, NavItem } from "./Sidebar";
import { BottomNav } from "./BottomNav";

const BREAKPOINT = 768;

interface Props { navItems: NavItem[] }

export function AppShell({ navItems }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= BREAKPOINT;

  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      {wide && <Sidebar navItems={navItems} />}
      <View style={{ flex: 1, flexDirection: "column" }}>
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
        {!wide && <BottomNav navItems={navItems} />}
      </View>
    </View>
  );
}
