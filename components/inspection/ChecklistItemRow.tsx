import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ChecklistItem, InspectionResponse } from "@/types";
import { COLORS } from "@/constants";

interface Props {
  item: ChecklistItem;
  response?: Partial<InspectionResponse>;
  onUpdate: (update: Partial<InspectionResponse>) => void;
}

export function ChecklistItemRow({ item, response, onUpdate }: Props) {
  const [notes, setNotes] = useState(response?.notes ?? "");
  const passed = response?.passed ?? true;
  const showPhoto = item.requires_photo_on_fail && !passed;

  const handlePassFail = (p: boolean) => {
    onUpdate({ item_id: item.id, passed: p, value: p ? "pass" : "fail" });
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      onUpdate({ item_id: item.id, photo_url: result.assets[0].uri });
    }
  };

  return (
    <View style={{
      backgroundColor: COLORS.white, borderRadius: 12,
      padding: 14, marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: response ? (passed ? COLORS.success : COLORS.danger) : COLORS.gray200,
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    }}>
      {/* Standard refs */}
      {item.standard_refs.length > 0 && (
        <Text style={{ fontSize: 10, color: COLORS.gray400, marginBottom: 4 }}>
          {item.standard_refs.join(" • ")}
        </Text>
      )}

      <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.gray900, marginBottom: 10 }}>
        {item.label}
        {item.required && <Text style={{ color: COLORS.danger }}> *</Text>}
      </Text>

      {/* Pass / Fail buttons */}
      {(item.type === "pass_fail" || item.type === "yes_no") && (
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[true, false].map((p) => {
            const active = response ? response.passed === p : false;
            const label  = item.type === "yes_no" ? (p ? "Yes" : "No") : (p ? "Pass" : "Fail");
            const color  = p ? COLORS.success : COLORS.danger;
            return (
              <TouchableOpacity
                key={String(p)}
                onPress={() => handlePassFail(p)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 10,
                  borderWidth: 2,
                  borderColor: active ? color : COLORS.gray200,
                  backgroundColor: active ? `${color}18` : COLORS.white,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "700", fontSize: 13, color: active ? color : COLORS.gray400 }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Temperature input */}
      {item.type === "temperature" && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TextInput
            placeholder="°F"
            keyboardType="decimal-pad"
            onChangeText={(v) => onUpdate({ item_id: item.id, value: v, passed: true })}
            style={{
              flex: 1, borderWidth: 1.5, borderColor: COLORS.gray200,
              borderRadius: 10, paddingHorizontal: 12, height: 44,
              fontSize: 15, color: COLORS.gray900,
            }}
          />
          <Text style={{ fontSize: 14, color: COLORS.gray600 }}>°F</Text>
        </View>
      )}

      {/* Notes */}
      {response && !passed && (
        <TextInput
          placeholder="Add notes…"
          value={notes}
          onChangeText={(v) => { setNotes(v); onUpdate({ item_id: item.id, notes: v }); }}
          multiline
          style={{
            marginTop: 10, borderWidth: 1.5, borderColor: COLORS.gray200,
            borderRadius: 10, padding: 10, fontSize: 13,
            color: COLORS.gray900, minHeight: 60, textAlignVertical: "top",
          }}
        />
      )}

      {/* Photo capture */}
      {showPhoto && (
        <TouchableOpacity
          onPress={pickPhoto}
          style={{
            marginTop: 10, borderWidth: 1.5, borderStyle: "dashed",
            borderColor: COLORS.danger, borderRadius: 10,
            padding: 12, alignItems: "center",
          }}
        >
          {response?.photo_url ? (
            <Image source={{ uri: response.photo_url }} style={{ width: "100%", height: 160, borderRadius: 8 }} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={24} color={COLORS.danger} />
              <Text style={{ fontSize: 12, color: COLORS.danger, marginTop: 4, fontWeight: "600" }}>
                Photo required for failed item
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
