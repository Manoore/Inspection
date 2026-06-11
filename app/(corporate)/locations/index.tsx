import React, { useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  Modal, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { HealthScoreCard } from "@/components/location/HealthScoreCard";
import { useLocations } from "@/hooks/useLocations";
import { supabase } from "@/lib/supabase";
import { COLORS, REGION_LABELS, SERVICE_LINE_LABELS } from "@/constants";
import { OhioRegion, ServiceLine } from "@/types";

const ALL = "all";
const REGIONS: (OhioRegion | "all")[] = [ALL, "akron", "cleveland", "columbus", "cincinnati", "dayton", "ne_ohio"];
const ALL_SERVICE_LINES: ServiceLine[] = [
  "urgent_care", "occupational_health", "primary_care",
  "clinical_research", "vibrance_wellness", "telehealth",
];
const ALL_REGIONS: OhioRegion[] = ["akron", "cleveland", "columbus", "cincinnati", "dayton", "ne_ohio"];

interface NewLocForm {
  name: string;
  address: string;
  region: OhioRegion | "";
  service_lines: ServiceLine[];
}

const BLANK: NewLocForm = { name: "", address: "", region: "", service_lines: [] };

const label$ = { fontSize: 13, fontWeight: "600" as const, color: COLORS.gray600, marginBottom: 8 };
const inp$ = {
  borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10,
  padding: 13, fontSize: 14, color: COLORS.gray900, backgroundColor: "#FFF",
  marginBottom: 20,
};

function AddLocationModal({ visible, onClose, onSaved }: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<NewLocForm>(BLANK);
  const [saving, setSaving] = useState(false);

  const toggleLine = (sl: ServiceLine) =>
    setForm((f) => ({
      ...f,
      service_lines: f.service_lines.includes(sl)
        ? f.service_lines.filter((x) => x !== sl)
        : [...f.service_lines, sl],
    }));

  const handleClose = () => { setForm(BLANK); onClose(); };

  const save = async () => {
    if (!form.name.trim())            { Alert.alert("Name required"); return; }
    if (!form.address.trim())         { Alert.alert("Address required"); return; }
    if (!form.region)                 { Alert.alert("Select a region"); return; }
    if (form.service_lines.length === 0) { Alert.alert("Select at least one service line"); return; }
    setSaving(true);
    const id  = `loc-${Date.now()}`;
    const now = new Date().toISOString();
    await supabase.from("locations").insert({
      id,
      name:          form.name.trim(),
      address:       form.address.trim(),
      region:        form.region,
      service_lines: form.service_lines,
      health_score:  75,
      created_at:    now,
    });
    await supabase.from("health_scores").insert({
      location_id:            id,
      score:                  75,
      inspection_pass_rate:   0,
      open_actions_count:     0,
      overdue_training_count: 0,
      missed_rounds_count:    0,
      trend:                  [],
      calculated_at:          now,
    });
    setSaving(false);
    setForm(BLANK);
    onSaved();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%", paddingBottom: 36 }}>

            <View style={{ flexDirection: "row", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: "800", color: COLORS.gray900 }}>Add Location</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              <Text style={label$}>Location Name *</Text>
              <TextInput
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="e.g. Hometown Akron – West Market"
                placeholderTextColor={COLORS.gray400}
                style={inp$}
              />

              <Text style={label$}>Address *</Text>
              <TextInput
                value={form.address}
                onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                placeholder="Street, City, OH"
                placeholderTextColor={COLORS.gray400}
                style={inp$}
              />

              <Text style={label$}>Region *</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {ALL_REGIONS.map((r) => {
                  const sel = form.region === r;
                  return (
                    <TouchableOpacity key={r} onPress={() => setForm((f) => ({ ...f, region: r }))}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
                        borderColor: sel ? COLORS.brand : COLORS.gray200,
                        backgroundColor: sel ? `${COLORS.brand}14` : "#FFF" }}
                      activeOpacity={0.75}>
                      <Text style={{ fontSize: 13, fontWeight: sel ? "700" : "400",
                        color: sel ? COLORS.brand : COLORS.gray600 }}>
                        {REGION_LABELS[r]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={label$}>Service Lines *</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                {ALL_SERVICE_LINES.map((sl) => {
                  const sel = form.service_lines.includes(sl);
                  return (
                    <TouchableOpacity key={sl} onPress={() => toggleLine(sl)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 6,
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
                        borderColor: sel ? COLORS.brand : COLORS.gray200,
                        backgroundColor: sel ? `${COLORS.brand}14` : "#FFF" }}
                      activeOpacity={0.75}>
                      {sel && <Ionicons name="checkmark" size={13} color={COLORS.brand} />}
                      <Text style={{ fontSize: 12, fontWeight: sel ? "700" : "400",
                        color: sel ? COLORS.brand : COLORS.gray600 }}>
                        {SERVICE_LINE_LABELS[sl]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity onPress={save} disabled={saving}
                style={{ backgroundColor: saving ? COLORS.gray200 : COLORS.brand,
                  borderRadius: 12, paddingVertical: 16, alignItems: "center" }}
                activeOpacity={0.85}>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 16 }}>
                  {saving ? "Saving…" : "Add Location"}
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function LocationsScreen() {
  const { locations, healthScores, loading, refresh } = useLocations();
  const [search,  setSearch]  = useState("");
  const [region,  setRegion]  = useState<OhioRegion | "all">(ALL);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = locations.filter((l) => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase());
    const matchRegion = region === ALL || l.region === region;
    return matchSearch && matchRegion;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.gray900 }}>Locations</Text>
          <Text style={{ fontSize: 13, color: COLORS.gray400 }}>{locations.length} clinics across 6 regions</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAdd(true)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: COLORS.brand, borderRadius: 10,
            paddingHorizontal: 14, paddingVertical: 9 }}
          activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        marginHorizontal: 20, backgroundColor: COLORS.white,
        borderRadius: 12, paddingHorizontal: 14, height: 44,
        borderWidth: 1, borderColor: COLORS.gray200, marginBottom: 12,
      }}>
        <Ionicons name="search-outline" size={18} color={COLORS.gray400} />
        <TextInput
          placeholder="Search locations…"
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.gray900 }}
          placeholderTextColor={COLORS.gray400}
        />
      </View>

      {/* Region filter */}
      <FlatList
        horizontal
        data={REGIONS}
        keyExtractor={(r) => r}
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setRegion(item)}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
              backgroundColor: region === item ? COLORS.brand : COLORS.white,
              borderWidth: 1.5,
              borderColor: region === item ? COLORS.brand : COLORS.gray200,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600",
              color: region === item ? COLORS.white : COLORS.gray600 }}>
              {item === ALL ? "All Regions" : REGION_LABELS[item as OhioRegion]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Location list — flex:1 fills remaining space so all cards scroll */}
      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        onRefresh={refresh}
        refreshing={loading}
        renderItem={({ item }) => (
          <HealthScoreCard location={item} healthScore={healthScores[item.id]} />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="location-outline" size={48} color={COLORS.gray200} />
            <Text style={{ color: COLORS.gray400, marginTop: 8 }}>No locations found</Text>
          </View>
        }
      />

      <AddLocationModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={refresh}
      />

    </SafeAreaView>
  );
}
