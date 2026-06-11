import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import { Checklist } from "@/types";
import { COLORS, SERVICE_LINE_LABELS } from "@/constants";

type ServiceLine = keyof typeof SERVICE_LINE_LABELS;
const ALL_SL = Object.keys(SERVICE_LINE_LABELS) as ServiceLine[];

interface DraftItem { id: string; text: string; required: boolean }
interface DraftChecklist { name: string; service_line: ServiceLine | ""; items: DraftItem[] }

const BLANK: DraftChecklist = { name: "", service_line: "", items: [] };

export default function ChecklistsScreen() {
  const [checklists,   setChecklists]   = useState<Checklist[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [createModal,  setCreateModal]  = useState(false);
  const [detailModal,  setDetailModal]  = useState<Checklist | null>(null);
  const [draft,        setDraft]        = useState<DraftChecklist>(BLANK);
  const [newItemText,  setNewItemText]  = useState("");
  const [saving,       setSaving]       = useState(false);

  const importFromExcel = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "*/*",
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    try {
      const b64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
      const wb  = XLSX.read(b64, { type: "base64" });
      const ws  = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
      const items: DraftItem[] = rows
        .filter((r) => r[0]?.toString().trim())
        .map((r, i) => ({ id: `xl-${Date.now()}-${i}`, text: r[0].toString().trim(), required: true }));
      if (items.length === 0) { Alert.alert("No items found", "Column A must contain checklist items."); return; }
      setDraft((d) => ({ ...d, items: [...d.items, ...items] }));
      setCreateModal(true);
      Alert.alert("Imported", `${items.length} items loaded from Excel. Fill in name & service line, then save.`);
    } catch {
      Alert.alert("Error", "Could not parse the Excel file. Make sure items are in column A.");
    }
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("checklists").select("*").order("name");
    setChecklists(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addItem = () => {
    const text = newItemText.trim();
    if (!text) return;
    setDraft((d) => ({
      ...d,
      items: [...d.items, { id: `i-${Date.now()}`, text, required: true }],
    }));
    setNewItemText("");
  };

  const removeItem = (id: string) =>
    setDraft((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));

  const toggleRequired = (id: string) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((i) => i.id === id ? { ...i, required: !i.required } : i),
    }));

  const saveChecklist = async () => {
    if (!draft.name.trim()) { Alert.alert("Name required"); return; }
    if (!draft.service_line) { Alert.alert("Select a service line"); return; }
    if (draft.items.length === 0) { Alert.alert("Add at least one item"); return; }
    setSaving(true);
    const payload: Partial<Checklist> = {
      name: draft.name.trim(),
      service_line: draft.service_line,
      version: 1,
      is_active: true,
      created_by: "user-admin-1",
      items: draft.items.map((it, idx) => ({
        id: it.id,
        checklist_id: `cl-${Date.now()}`,
        order: idx + 1,
        label: it.text,
        required: it.required,
        type: "yes_no" as const,
        requires_photo_on_fail: false,
        standard_refs: [],
      })),
    };
    const { data } = await supabase.from("checklists").insert(payload).single();
    const newCl = (data ?? { ...payload, id: `cl-${Date.now()}` }) as Checklist;
    setChecklists((prev) => [...prev, newCl]);
    setSaving(false);
    setCreateModal(false);
    setDraft(BLANK);
    Alert.alert("Checklist created", `"${newCl.name}" is ready for inspections.`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>

      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.gray900 }}>Checklists</Text>
          <Text style={{ fontSize: 13, color: COLORS.gray400, marginTop: 1 }}>{checklists.length} templates</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={importFromExcel}
            style={{ flexDirection: "row", alignItems: "center", gap: 6,
              borderWidth: 1.5, borderColor: COLORS.brand, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}
            activeOpacity={0.85}
          >
            <Ionicons name="document-attach-outline" size={16} color={COLORS.brand} />
            <Text style={{ color: COLORS.brand, fontWeight: "700", fontSize: 13 }}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCreateModal(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6,
              backgroundColor: COLORS.brand, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {checklists.map((cl) => (
          <Card key={cl.id} style={{ marginBottom: 10 }}>
            <TouchableOpacity onPress={() => setDetailModal(cl)} activeOpacity={0.8}>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={{
                  width: 42, height: 42, borderRadius: 10,
                  backgroundColor: `${COLORS.brand}12`, alignItems: "center",
                  justifyContent: "center", marginRight: 12,
                }}>
                  <Ionicons name="checkbox-outline" size={20} color={COLORS.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.gray900 }}>{cl.name}</Text>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    <Badge label={SERVICE_LINE_LABELS[cl.service_line] ?? cl.service_line} variant="info" />
                    <Badge label={`v${cl.version}`} variant="neutral" />
                    <Badge label={`${cl.items?.length ?? 0} items`} variant="default" />
                    {!cl.is_active && <Badge label="Inactive" variant="danger" />}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.gray400} />
              </View>
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>

      {/* ── Detail Modal (view items) ── */}
      <Modal visible={!!detailModal} transparent animationType="slide" onRequestClose={() => setDetailModal(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: "800", color: COLORS.gray900 }}>{detailModal?.name}</Text>
                <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 2 }}>
                  {detailModal?.items?.length ?? 0} items · {SERVICE_LINE_LABELS[detailModal?.service_line ?? ""] ?? ""}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModal(null)}>
                <Ionicons name="close" size={24} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {(detailModal?.items ?? []).map((item, idx) => (
                <View key={item.id} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                  <View style={{
                    width: 26, height: 26, borderRadius: 6,
                    backgroundColor: `${COLORS.brand}12`, alignItems: "center", justifyContent: "center", marginTop: 1,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.brand }}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: COLORS.gray900 }}>{item.label}</Text>
                    {item.required && (
                      <Text style={{ fontSize: 11, color: COLORS.danger, marginTop: 2, fontWeight: "600" }}>Required</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Create Checklist Modal ── */}
      <Modal visible={createModal} transparent animationType="slide" onRequestClose={() => setCreateModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "95%" }}>

            <View style={{ flexDirection: "row", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: "800", color: COLORS.gray900 }}>New Checklist</Text>
              <TouchableOpacity onPress={() => { setCreateModal(false); setDraft(BLANK); setNewItemText(""); }}>
                <Ionicons name="close" size={24} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

              {/* Name */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray900, marginBottom: 6 }}>Checklist Name *</Text>
              <TextInput
                value={draft.name}
                onChangeText={(t) => setDraft((d) => ({ ...d, name: t }))}
                placeholder="e.g. Daily Urgent Care Opening Check"
                style={{
                  borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10,
                  padding: 12, fontSize: 14, color: COLORS.gray900, marginBottom: 16,
                }}
                placeholderTextColor={COLORS.gray400}
              />

              {/* Service line */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray900, marginBottom: 8 }}>Service Line *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {ALL_SL.map((sl) => {
                    const sel = draft.service_line === sl;
                    return (
                      <TouchableOpacity
                        key={sl}
                        onPress={() => setDraft((d) => ({ ...d, service_line: sl }))}
                        style={{
                          paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
                          borderWidth: 1.5,
                          borderColor: sel ? COLORS.brand : COLORS.gray200,
                          backgroundColor: sel ? `${COLORS.brand}12` : "#FFF",
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={{ fontSize: 12, fontWeight: sel ? "700" : "400", color: sel ? COLORS.brand : COLORS.gray400 }}>
                          {SERVICE_LINE_LABELS[sl]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Items */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray900, marginBottom: 8 }}>
                Checklist Items * ({draft.items.length})
              </Text>

              {/* Add item input */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                <TextInput
                  value={newItemText}
                  onChangeText={setNewItemText}
                  onSubmitEditing={addItem}
                  placeholder="Type an item and press +"
                  returnKeyType="done"
                  style={{
                    flex: 1, borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10,
                    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.gray900,
                  }}
                  placeholderTextColor={COLORS.gray400}
                />
                <TouchableOpacity
                  onPress={addItem}
                  style={{ backgroundColor: COLORS.brand, borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Item list */}
              {draft.items.map((item, idx) => (
                <View key={item.id} style={{
                  flexDirection: "row", alignItems: "center", gap: 10,
                  backgroundColor: "#F9FAFB", borderRadius: 10,
                  padding: 12, marginBottom: 8,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.gray400, width: 20 }}>{idx + 1}.</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: COLORS.gray900 }}>{item.text}</Text>
                  <TouchableOpacity onPress={() => toggleRequired(item.id)} activeOpacity={0.7}>
                    <View style={{
                      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
                      backgroundColor: item.required ? `${COLORS.danger}18` : COLORS.gray200,
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: item.required ? COLORS.danger : COLORS.gray400 }}>
                        {item.required ? "REQ" : "OPT"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeItem(item.id)} activeOpacity={0.7}>
                    <Ionicons name="close-circle-outline" size={20} color={COLORS.gray400} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={{ marginTop: 12, marginBottom: 8 }}>
                <TouchableOpacity
                  onPress={saveChecklist}
                  disabled={saving}
                  style={{
                    backgroundColor: saving ? COLORS.gray200 : COLORS.brand,
                    borderRadius: 12, paddingVertical: 16, alignItems: "center",
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15 }}>
                    {saving ? "Saving…" : `Save Checklist (${draft.items.length} items)`}
                  </Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
