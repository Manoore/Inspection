import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import { Inspection } from "@/types";
import { COLORS } from "@/constants";

export default function AuditorInspectionsScreen() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading,     setLoading]     = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("inspections")
      .select("*, location:locations(name), inspector:users(full_name)")
      .order("started_at", { ascending: false })
      .limit(100);
    setInspections(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.gray900 }}>Inspections</Text>
        <Text style={{ fontSize: 13, color: COLORS.gray400 }}>Read-only audit view</Text>
      </View>

      <FlatList
        data={inspections}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        onRefresh={load}
        refreshing={loading}
        renderItem={({ item }: { item: any }) => (
          <Card style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Ionicons
                name={item.status === "completed" ? "checkmark-circle" : "time-outline"}
                size={20}
                color={item.status === "completed" ? COLORS.success : COLORS.warning}
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.gray900 }}>
                  {item.location?.name ?? "Unknown location"}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 2 }}>
                  By {item.inspector?.full_name ?? "Unknown"} •{" "}
                  {new Date(item.started_at).toLocaleDateString()}
                </Text>
              </View>
              {item.score != null && (
                <Badge
                  label={`${item.score}%`}
                  variant={item.score >= 75 ? "success" : item.score >= 60 ? "warning" : "danger"}
                />
              )}
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="clipboard-outline" size={48} color={COLORS.gray200} />
            <Text style={{ color: COLORS.gray400, marginTop: 8 }}>No inspections found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
