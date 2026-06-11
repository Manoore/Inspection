import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { EscalationConfig, EscalationLevelConfig, UserRole } from "@/types";
import { COLORS } from "@/constants";

const ROLE_OPTIONS: { role: UserRole; label: string }[] = [
  { role: "field_manager",   label: "Field Manager"   },
  { role: "auditor",         label: "Site Supervisor" },
  { role: "corporate_admin", label: "Corporate Admin" },
];
const HOURS_OPTIONS = [8, 24, 48, 72];
const LEVEL_COLORS  = [COLORS.brand, COLORS.warning, COLORS.danger];
const LEVEL_NAMES   = ["Level 1 — Initial Assignment", "Level 2 — First Escalation", "Level 3 — Final Escalation"];
const LEVEL_DESCS   = [
  "First person assigned to address the action. They have a set window to resolve it.",
  "Senior staff notified when Level 1 misses the deadline. Second chance to close the issue.",
  "Leadership escalation. No further auto-reassignment — action stays here until resolved.",
];
const DEFAULT_LEVELS: EscalationLevelConfig[] = [
  { level: 1, role: "field_manager",   label: "Field Manager",     hours_to_escalate: 24 },
  { level: 2, role: "auditor",         label: "Site Supervisor",   hours_to_escalate: 48 },
  { level: 3, role: "corporate_admin", label: "Regional Director", hours_to_escalate: 72 },
];

export default function EscalationScreen() {
  const [levels, setLevels] = useState<EscalationLevelConfig[]>(DEFAULT_LEVELS);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [cfgId,  setCfgId]  = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("escalation_configs").select("*").single();
      if (data) { setLevels(data.levels); setCfgId(data.id); }
    })();
  }, []);

  const updateLevel = (idx: number, patch: Partial<EscalationLevelConfig>) =>
    setLevels((prev) => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));

  const save = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    if (cfgId) {
      await supabase.from("escalation_configs").update({ levels, updated_at: now }).eq("id", cfgId);
    } else {
      await supabase.from("escalation_configs").insert({ id: "esc-cfg-1", levels, created_at: now, updated_at: now });
      setCfgId("esc-cfg-1");
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.gray900 }}>Escalation Policy</Text>
        <Text style={{ fontSize: 13, color: COLORS.gray400, marginTop: 2 }}>
          Define who gets reassigned when an action deadline is missed
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* Explainer banner */}
        <View style={{ backgroundColor: `${COLORS.brand}0E`, borderRadius: 14, padding: 16, marginBottom: 28,
          flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
          <Ionicons name="information-circle-outline" size={22} color={COLORS.brand} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.brand, marginBottom: 4 }}>How it works</Text>
            <Text style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 20 }}>
              When a corrective action is created, it assigns to Level 1. If unresolved by the deadline,
              it auto-reassigns to Level 2, then Level 3. Every reassignment is logged with a timestamp.
            </Text>
          </View>
        </View>

        {levels.map((lvl, i) => {
          const color  = LEVEL_COLORS[i];
          const isLast = i === levels.length - 1;
          return (
            <View key={lvl.level}>
              <View style={{ backgroundColor: "#FFF", borderRadius: 20, borderWidth: 1.5, borderColor: `${color}28`,
                padding: 20, shadowColor: color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 }}>

                {/* Level header */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color,
                    alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 18 }}>{lvl.level}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "800", color: COLORS.gray900 }}>{LEVEL_NAMES[i]}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 2, lineHeight: 17 }}>{LEVEL_DESCS[i]}</Text>
                  </View>
                </View>

                {/* Custom label */}
                <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.gray600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Role Title
                </Text>
                <TextInput
                  value={lvl.label}
                  onChangeText={(v) => updateLevel(i, { label: v })}
                  style={{ borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 12, padding: 13,
                    fontSize: 14, color: COLORS.gray900, backgroundColor: "#FFF", marginBottom: 18 }}
                  placeholder="e.g. Field Manager"
                  placeholderTextColor={COLORS.gray400}
                />

                {/* Role selector */}
                <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.gray600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Assign to Role
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                  {ROLE_OPTIONS.map((opt) => {
                    const sel = lvl.role === opt.role;
                    return (
                      <TouchableOpacity key={opt.role} onPress={() => updateLevel(i, { role: opt.role })}
                        style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, borderWidth: 1.5,
                          borderColor: sel ? color : COLORS.gray200,
                          backgroundColor: sel ? `${color}12` : "#FFF" }}
                        activeOpacity={0.75}>
                        <Text style={{ fontSize: 13, fontWeight: sel ? "700" : "400", color: sel ? color : COLORS.gray600 }}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Hours picker (only for non-last levels) */}
                {!isLast ? (
                  <>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.gray600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Escalate After
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {HOURS_OPTIONS.map((h) => {
                        const sel = lvl.hours_to_escalate === h;
                        return (
                          <TouchableOpacity key={h} onPress={() => updateLevel(i, { hours_to_escalate: h })}
                            style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
                              borderColor: sel ? color : COLORS.gray200,
                              backgroundColor: sel ? `${color}12` : "#FFF" }}
                            activeOpacity={0.75}>
                            <Text style={{ fontSize: 15, fontWeight: sel ? "800" : "400", color: sel ? color : COLORS.gray600 }}>{h}h</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                ) : (
                  <View style={{ backgroundColor: `${COLORS.danger}0E`, borderRadius: 10, padding: 12,
                    flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                    <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
                    <Text style={{ flex: 1, fontSize: 12, color: COLORS.danger, lineHeight: 18 }}>
                      Final level — no further auto-reassignment. Action stays here until resolved or admin intervenes.
                    </Text>
                  </View>
                )}
              </View>

              {/* Arrow connector */}
              {!isLast && (
                <View style={{ alignItems: "center", paddingVertical: 10 }}>
                  <Text style={{ fontSize: 12, color: COLORS.gray400, marginBottom: 4 }}>
                    If unresolved after {lvl.hours_to_escalate}h →
                  </Text>
                  <Ionicons name="arrow-down" size={22} color={LEVEL_COLORS[i + 1]} />
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity onPress={save} disabled={saving}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            backgroundColor: saved ? COLORS.success : saving ? COLORS.gray200 : COLORS.brand,
            borderRadius: 14, paddingVertical: 17, marginTop: 28 }}
          activeOpacity={0.85}>
          <Ionicons name={saved ? "checkmark-circle" : "save-outline"} size={20} color="#FFF" />
          <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 16 }}>
            {saved ? "Policy Saved!" : saving ? "Saving…" : "Save Escalation Policy"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
