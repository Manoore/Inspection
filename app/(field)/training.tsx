import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import { TrainingModule, TrainingCompletion } from "@/types";
import { COLORS, SERVICE_LINE_LABELS } from "@/constants";

interface CertView extends TrainingCompletion { module?: TrainingModule }

function SectionHeader({ title, count, color = COLORS.gray900 }: { title: string; count: number; color?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, marginTop: 4 }}>
      <Text style={{ fontSize: 13, fontWeight: "800", color, textTransform: "uppercase", letterSpacing: 0.8, flex: 1 }}>
        {title}
      </Text>
      <View style={{ backgroundColor: `${color}18`, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color }}>{count}</Text>
      </View>
    </View>
  );
}

export default function FieldTrainingScreen() {
  const { user } = useAuthStore();
  const [modules,     setModules]     = useState<TrainingModule[]>([]);
  const [completions, setCompletions] = useState<TrainingCompletion[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [certModal,   setCertModal]   = useState<CertView | null>(null);

  const load = async () => {
    setLoading(true);
    const [modRes, compRes] = await Promise.all([
      supabase.from("training_modules").select("*").order("title"),
      supabase.from("training_completions").select("*").eq("user_id", user?.id ?? ""),
    ]);
    setModules(modRes.data ?? []);
    setCompletions(compRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);
  useFocusEffect(useCallback(() => { load(); }, [user]));

  const getComp     = (modId: string) => completions.find((c) => c.module_id === modId);
  const isExpired   = (c: TrainingCompletion) => new Date(c.cert_expires_at) < new Date();
  const expiringSoon = (c: TrainingCompletion) => {
    const diff = new Date(c.cert_expires_at).getTime() - Date.now();
    return diff > 0 && diff < 30 * 86400000;
  };

  const pending   = modules.filter((m) => { const c = getComp(m.id); return !c || isExpired(c); });
  const completed = modules.filter((m) => { const c = getComp(m.id); return c && !isExpired(c); });
  const completedCount = completed.length;

  const startModule = (mod: TrainingModule) => {
    router.push(`/(field)/training/${mod.id}` as any);
  };

  const ModuleCard = ({ mod, showCert }: { mod: TrainingModule; showCert: boolean }) => {
    const comp = getComp(mod.id);
    const soon = comp && expiringSoon(comp);
    const expired = comp && isExpired(comp);
    const statusColor = showCert ? (soon ? COLORS.warning : COLORS.success) : expired ? COLORS.danger : COLORS.gray200;

    return (
      <Card style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          {/* Status strip */}
          <View style={{ width: 4, borderRadius: 2, backgroundColor: statusColor, marginRight: 12, alignSelf: "stretch", minHeight: 48 }} />

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <Ionicons
                name={showCert ? "checkmark-circle" : expired ? "alert-circle-outline" : "school-outline"}
                size={18}
                color={showCert ? (soon ? COLORS.warning : COLORS.success) : COLORS.brand}
                style={{ marginRight: 6 }}
              />
              <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.gray900, flex: 1 }} numberOfLines={1}>
                {mod.title}
              </Text>
            </View>

            {mod.description ? (
              <Text style={{ fontSize: 12, color: COLORS.gray400, marginBottom: 6 }} numberOfLines={2}>{mod.description}</Text>
            ) : null}

            <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
              {mod.service_lines.slice(0, 2).map((sl) => (
                <Badge key={sl} label={SERVICE_LINE_LABELS[sl]} variant="info" />
              ))}
              <Badge label={`${mod.duration_minutes} min`} variant="neutral" />
            </View>

            {showCert && comp ? (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, color: soon ? COLORS.warning : COLORS.success, fontWeight: "600" }}>
                  {soon
                    ? `⚠ Expires ${new Date(comp.cert_expires_at).toLocaleDateString()}`
                    : `Valid to ${new Date(comp.cert_expires_at).toLocaleDateString()}`}
                  {comp.score ? `  ·  ${comp.score}%` : ""}
                </Text>
                <TouchableOpacity
                  onPress={() => setCertModal({ ...comp, module: mod })}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ribbon-outline" size={14} color={COLORS.brand} />
                  <Text style={{ fontSize: 12, color: COLORS.brand, fontWeight: "600" }}>Certificate</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => startModule(mod)}
                style={{
                  backgroundColor: expired ? COLORS.warning : COLORS.brand,
                  borderRadius: 10, paddingVertical: 9, alignItems: "center",
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>
                  {expired ? "Recertify Now" : "Start Training"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>

      {/* Header with progress */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.gray900 }}>My Training</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 }}>
          <View style={{ flex: 1 }}>
            <View style={{ height: 8, backgroundColor: COLORS.gray200, borderRadius: 4 }}>
              <View style={{
                height: 8, borderRadius: 4, backgroundColor: COLORS.success,
                width: modules.length > 0 ? `${Math.round((completedCount / modules.length) * 100)}%` : "0%",
              }} />
            </View>
          </View>
          <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.gray600 }}>
            {completedCount}/{modules.length}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Pending section */}
        {pending.length > 0 && (
          <>
            <SectionHeader title="To Do" count={pending.length} color={COLORS.brand} />
            {pending.map((mod) => <ModuleCard key={mod.id} mod={mod} showCert={false} />)}
          </>
        )}

        {/* Completed section */}
        {completed.length > 0 && (
          <View style={{ marginTop: pending.length > 0 ? 16 : 0 }}>
            <SectionHeader title="Completed" count={completed.length} color={COLORS.success} />
            {completed.map((mod) => <ModuleCard key={mod.id} mod={mod} showCert />)}
          </View>
        )}

        {modules.length === 0 && !loading && (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="school-outline" size={48} color={COLORS.gray200} />
            <Text style={{ color: COLORS.gray400, marginTop: 8 }}>No training modules assigned yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Certificate Modal */}
      <Modal visible={!!certModal} transparent animationType="fade" onRequestClose={() => setCertModal(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: "#FFF", borderRadius: 20, overflow: "hidden" }}>
            <View style={{ backgroundColor: COLORS.brand, padding: 28, alignItems: "center" }}>
              <Ionicons name="ribbon" size={44} color="#FFD700" />
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: 2, marginTop: 10, textTransform: "uppercase" }}>
                Certificate of Completion
              </Text>
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#FFF", marginTop: 4 }}>ClinicOps Training</Text>
            </View>
            <View style={{ padding: 28, alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: COLORS.gray400, marginBottom: 4 }}>This certifies that</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.gray900, marginBottom: 4 }}>{user?.full_name}</Text>
              <Text style={{ fontSize: 13, color: COLORS.gray400, marginBottom: 4 }}>has successfully completed</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.brand, textAlign: "center", marginBottom: 20 }}>
                {certModal?.module?.title}
              </Text>
              <View style={{ flexDirection: "row", gap: 24, marginBottom: 24 }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.success }}>{certModal?.score ?? 0}%</Text>
                  <Text style={{ fontSize: 11, color: COLORS.gray400 }}>Score</Text>
                </View>
                <View style={{ width: 1, backgroundColor: COLORS.gray200 }} />
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.gray900 }}>
                    {certModal?.completed_at ? new Date(certModal.completed_at).toLocaleDateString() : ""}
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.gray400 }}>Completed</Text>
                </View>
                <View style={{ width: 1, backgroundColor: COLORS.gray200 }} />
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.gray900 }}>
                    {certModal?.cert_expires_at ? new Date(certModal.cert_expires_at).toLocaleDateString() : ""}
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.gray400 }}>Expires</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setCertModal(null)}
                style={{ backgroundColor: COLORS.brand, borderRadius: 12, paddingVertical: 14, width: "100%" }}
                activeOpacity={0.85}
              >
                <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 15, textAlign: "center" }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
