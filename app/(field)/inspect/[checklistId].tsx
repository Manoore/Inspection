import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ChecklistItemRow } from "@/components/inspection/ChecklistItemRow";
import { RiskBriefing } from "@/components/inspection/RiskBriefing";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useInspectionStore } from "@/store/inspection";
import { useRiskBriefing } from "@/hooks/useChecklist";
import { useAuthStore } from "@/store/auth";
import { Checklist, ChecklistItem, InspectionResponse } from "@/types";
import { COLORS } from "@/constants";

export default function RunInspectionScreen() {
  const { checklistId, locationId } = useLocalSearchParams<{ checklistId: string; locationId: string }>();
  const { user } = useAuthStore();
  const { startInspection, saveResponse, completeInspection, responses } = useInspectionStore();
  const [checklist, setChecklist]   = useState<Checklist & { items: ChecklistItem[] } | null>(null);
  const [loading,   setLoading]     = useState(true);
  const [submitting,setSubmitting]  = useState(false);
  const briefing = useRiskBriefing(locationId);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("checklists")
        .select("*, items:checklist_items(*)")
        .eq("id", checklistId)
        .single();
      setChecklist(data);

      await startInspection({
        location_id:  locationId,
        checklist_id: checklistId,
        inspector_id: user?.id,
      });
      setLoading(false);
    })();
  }, []);

  const responseMap = responses.reduce<Record<string, Partial<InspectionResponse>>>((acc, r) => {
    acc[r.item_id] = r;
    return acc;
  }, {});

  const completedCount = responses.length;
  const requiredCount  = checklist?.items.filter((i) => i.required).length ?? 0;
  const progress       = requiredCount > 0 ? completedCount / requiredCount : 0;

  const handleSubmit = async () => {
    const missing = checklist?.items.filter((i) => i.required && !responseMap[i.id]);
    if (missing?.length) {
      Alert.alert("Incomplete", `${missing.length} required item${missing.length > 1 ? "s" : ""} unanswered.`);
      return;
    }
    setSubmitting(true);
    await completeInspection();
    setSubmitting(false);
    Alert.alert("Inspection complete", "Corrective actions created for any failed items.", [
      { text: "Done", onPress: () => router.replace("/(field)/dashboard") },
    ]);
  };

  if (loading || !checklist) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={COLORS.brand} size="large" />
      </View>
    );
  }

  const sortedItems = [...checklist.items].sort((a, b) => a.order - b.order);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      {/* Header */}
      <View style={{ backgroundColor: COLORS.brand, paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.white }} numberOfLines={1}>
              {checklist.name}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              {completedCount} / {checklist.items.length} items answered
            </Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={{
          height: 4, backgroundColor: "rgba(255,255,255,0.2)",
          borderRadius: 2, marginTop: 10,
        }}>
          <View style={{
            height: 4, borderRadius: 2,
            backgroundColor: COLORS.white,
            width: `${Math.round(progress * 100)}%`,
          }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {briefing && <RiskBriefing briefing={briefing} />}

        {sortedItems.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            response={responseMap[item.id]}
            onUpdate={saveResponse}
          />
        ))}
      </ScrollView>

      {/* Sticky submit */}
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: COLORS.white, paddingHorizontal: 20,
        paddingVertical: 16, paddingBottom: 32,
        borderTopWidth: 1, borderTopColor: COLORS.gray200,
        shadowColor: "#000", shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08, shadowRadius: 8, elevation: 10,
      }}>
        <Button
          label="Submit Inspection"
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}
