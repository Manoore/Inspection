import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { COLORS, COMPLIANCE_STANDARDS } from "@/constants";

export default function AuditorComplianceScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.gray900 }}>Compliance</Text>
        <Text style={{ fontSize: 13, color: COLORS.gray400 }}>Standards coverage across all locations</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {COMPLIANCE_STANDARDS.map((std) => (
          <Card key={std} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center", marginRight: 10,
              }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.gray900 }}>{std}</Text>
                <Badge label="Active" variant="success" />
              </View>
            </View>
            <Text style={{ fontSize: 12, color: COLORS.gray400 }}>
              Checklist items mapped to {std} are tracked per inspection.
              Generate evidence packages from the Corporate Admin Reports tab.
            </Text>
          </Card>
        ))}

        <Card style={{ backgroundColor: "#f0fdf4" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.success} />
            <Text style={{ flex: 1, fontSize: 13, color: COLORS.success, fontWeight: "600" }}>
              Auditor access is read-only. Contact a Corporate Admin for PDF evidence exports.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
