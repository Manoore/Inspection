import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import { COLORS, COMPLIANCE_STANDARDS } from "@/constants";

type Standard = typeof COMPLIANCE_STANDARDS[number];

export default function ReportsScreen() {
  const [selected,  setSelected]  = useState<Standard | null>(null);
  const [exporting, setExporting] = useState(false);

  const exportReport = async () => {
    if (!selected) { Alert.alert("Select a standard first"); return; }
    setExporting(true);

    const { data } = await supabase
      .from("inspection_responses")
      .select("*, item:checklist_items(label, standard_refs), inspection:inspections(location_id, completed_at)")
      .contains("item.standard_refs", [selected])
      .not("inspection.completed_at", "is", null);

    // In production: generate PDF via edge function and open Sharing.shareAsync()
    setExporting(false);
    Alert.alert("Export ready", `${data?.length ?? 0} records for ${selected}. PDF generation requires backend.`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.gray900 }}>Compliance Reports</Text>
        <Text style={{ fontSize: 13, color: COLORS.gray400 }}>One-tap PDF evidence packages</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.gray600, marginBottom: 10 }}>
          Select Compliance Standard
        </Text>

        {COMPLIANCE_STANDARDS.map((std) => (
          <TouchableOpacity
            key={std}
            onPress={() => setSelected(std)}
            activeOpacity={0.8}
          >
            <Card style={{
              marginBottom: 10, flexDirection: "row", alignItems: "center",
              borderWidth: selected === std ? 2 : 1,
              borderColor: selected === std ? COLORS.brand : COLORS.gray200,
            }}>
              <View style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: selected === std ? `${COLORS.brand}18` : COLORS.gray50,
                alignItems: "center", justifyContent: "center", marginRight: 12,
              }}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={selected === std ? COLORS.brand : COLORS.gray400}
                />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.gray900 }}>{std}</Text>
              {selected === std && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.brand} />
              )}
            </Card>
          </TouchableOpacity>
        ))}

        <Card style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.gray900, marginBottom: 4 }}>
            Export Options
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.gray400, marginBottom: 14 }}>
            Generates a timestamped PDF with all inspection responses mapped to the selected standard.
          </Text>

          {[
            { label: "Last 30 days", icon: "calendar-outline" as const },
            { label: "Last 90 days", icon: "calendar-outline" as const },
            { label: "All time",     icon: "archive-outline"  as const },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.label}
              onPress={exportReport}
              style={{
                flexDirection: "row", alignItems: "center",
                paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.gray200,
                gap: 10,
              }}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={COLORS.brand} />
              ) : (
                <Ionicons name={opt.icon} size={18} color={COLORS.brand} />
              )}
              <Text style={{ flex: 1, fontSize: 14, color: COLORS.gray600 }}>{opt.label}</Text>
              <Ionicons name="download-outline" size={16} color={COLORS.gray400} />
            </TouchableOpacity>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
