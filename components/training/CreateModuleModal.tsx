import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { TrainingModule, TrainingQuestion } from "@/types";
import { COLORS, SERVICE_LINE_LABELS } from "@/constants";

type ServiceLine = keyof typeof SERVICE_LINE_LABELS;
const ALL_SL = Object.keys(SERVICE_LINE_LABELS) as ServiceLine[];
const ROLE_OPTS = [
  { value: "all",           label: "Everyone"    },
  { value: "field_manager", label: "Field Staff" },
  { value: "auditor",       label: "Auditors"    },
];

interface DraftQ {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}
interface Form {
  title: string; description: string; video_url: string; content: string;
  duration_minutes: string; cert_validity_days: string; pass_threshold: string;
  service_lines: ServiceLine[]; target_role: string;
}
const BLANK: Form = {
  title: "", description: "", video_url: "", content: "",
  duration_minutes: "30", cert_validity_days: "365", pass_threshold: "80",
  service_lines: [], target_role: "all",
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: (mod: TrainingModule, targetRole: string) => void;
}

export function CreateModuleModal({ visible, onClose, onSaved }: Props) {
  const [form,     setForm]     = useState<Form>(BLANK);
  const [questions,setQuestions]= useState<DraftQ[]>([]);
  const [draftQ,   setDraftQ]   = useState<DraftQ | null>(null);
  const [saving,   setSaving]   = useState(false);

  const close = () => { setForm(BLANK); setQuestions([]); setDraftQ(null); onClose(); };

  const toggleSL = (sl: ServiceLine) =>
    setForm((f) => ({
      ...f,
      service_lines: f.service_lines.includes(sl)
        ? f.service_lines.filter((s) => s !== sl)
        : [...f.service_lines, sl],
    }));

  const newDraftQ = (): DraftQ => ({
    id: `dq-${Date.now()}`, question: "", options: ["", ""], correct_index: 0, explanation: "",
  });

  const addOption = () => {
    if (!draftQ || draftQ.options.length >= 4) return;
    setDraftQ((d) => d ? { ...d, options: [...d.options, ""] } : d);
  };
  const setOption = (i: number, text: string) =>
    setDraftQ((d) => d ? { ...d, options: d.options.map((o, idx) => idx === i ? text : o) } : d);
  const removeOption = (i: number) =>
    setDraftQ((d) => {
      if (!d || d.options.length <= 2) return d;
      const opts = d.options.filter((_, idx) => idx !== i);
      return { ...d, options: opts, correct_index: Math.min(d.correct_index, opts.length - 1) };
    });

  const saveQuestion = () => {
    if (!draftQ) return;
    if (!draftQ.question.trim()) { Alert.alert("Enter question text"); return; }
    if (draftQ.options.some((o) => !o.trim())) { Alert.alert("Fill all options"); return; }
    setQuestions((prev) => {
      const existing = prev.findIndex((q) => q.id === draftQ.id);
      if (existing >= 0) { const next = [...prev]; next[existing] = draftQ; return next; }
      return [...prev, draftQ];
    });
    setDraftQ(null);
  };

  const save = async () => {
    if (!form.title.trim()) { Alert.alert("Title required"); return; }
    if (form.service_lines.length === 0) { Alert.alert("Select at least one service line"); return; }
    setSaving(true);
    const qs: TrainingQuestion[] = questions.map((q, i) => ({
      id: q.id, module_id: "", order: i + 1,
      question: q.question, options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation || undefined,
    }));
    const payload: Partial<TrainingModule> = {
      title: form.title.trim(), description: form.description.trim(),
      video_url: form.video_url.trim() || undefined,
      content: form.content.trim() || undefined,
      pass_threshold: parseInt(form.pass_threshold) || 80,
      duration_minutes: parseInt(form.duration_minutes) || 30,
      cert_validity_days: parseInt(form.cert_validity_days) || 365,
      service_lines: form.service_lines,
      questions: qs.length ? qs : undefined,
    };
    const { data } = await supabase.from("training_modules").insert(payload).single();
    const mod = (data ?? { ...payload, id: `mod-${Date.now()}`, qr_code: null, created_at: new Date().toISOString() }) as TrainingModule;
    setSaving(false);
    close();
    onSaved(mod, form.target_role);
  };

  const inp = (style?: object) => ({
    borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10,
    padding: 12, fontSize: 14, color: COLORS.gray900, ...style,
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "96%" }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: "800", color: COLORS.gray900 }}>New Training Module</Text>
            <TouchableOpacity onPress={close}>
              <Ionicons name="close" size={24} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

            {/* Title */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray900, marginBottom: 6 }}>Title *</Text>
            <TextInput value={form.title} onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
              placeholder="e.g. Hand Hygiene Protocol" placeholderTextColor={COLORS.gray400}
              style={{ ...inp(), marginBottom: 14 }} />

            {/* Description */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray900, marginBottom: 6 }}>Description</Text>
            <TextInput value={form.description} onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
              placeholder="Brief summary…" multiline numberOfLines={2}
              placeholderTextColor={COLORS.gray400}
              style={{ ...inp(), minHeight: 64, textAlignVertical: "top", marginBottom: 14 }} />

            {/* Video URL */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray900, marginBottom: 6 }}>Video URL (optional)</Text>
            <TextInput value={form.video_url} onChangeText={(t) => setForm((f) => ({ ...f, video_url: t }))}
              placeholder="https://…" autoCapitalize="none" keyboardType="url"
              placeholderTextColor={COLORS.gray400} style={{ ...inp(), marginBottom: 14 }} />

            {/* Content */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray900, marginBottom: 6 }}>Training Content</Text>
            <TextInput value={form.content} onChangeText={(t) => setForm((f) => ({ ...f, content: t }))}
              placeholder="Enter context, protocols, key points…" multiline numberOfLines={6}
              placeholderTextColor={COLORS.gray400}
              style={{ ...inp(), minHeight: 120, textAlignVertical: "top", marginBottom: 14 }} />

            {/* Duration + Cert + Pass */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              {[
                { label: "Duration (min)", key: "duration_minutes", placeholder: "30" },
                { label: "Cert days", key: "cert_validity_days", placeholder: "365" },
                { label: "Pass %", key: "pass_threshold", placeholder: "80" },
              ].map(({ label, key, placeholder }) => (
                <View key={key} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: COLORS.gray900, marginBottom: 4 }}>{label}</Text>
                  <TextInput value={(form as any)[key]} keyboardType="numeric" placeholder={placeholder}
                    onChangeText={(t) => setForm((f) => ({ ...f, [key]: t }))}
                    placeholderTextColor={COLORS.gray400} style={inp()} />
                </View>
              ))}
            </View>

            {/* Assign to */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray900, marginBottom: 8 }}>Assign To</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {ROLE_OPTS.map((r) => {
                const sel = form.target_role === r.value;
                return (
                  <TouchableOpacity key={r.value} onPress={() => setForm((f) => ({ ...f, target_role: r.value }))}
                    style={{ flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
                      borderColor: sel ? COLORS.brand : COLORS.gray200,
                      backgroundColor: sel ? `${COLORS.brand}12` : "#FFF" }}
                    activeOpacity={0.75}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: sel ? COLORS.brand : COLORS.gray400 }}>{r.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Service lines */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.gray900, marginBottom: 8 }}>Service Lines *</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {ALL_SL.map((sl) => {
                const sel = form.service_lines.includes(sl);
                return (
                  <TouchableOpacity key={sl} onPress={() => toggleSL(sl)}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5,
                      borderColor: sel ? COLORS.brand : COLORS.gray200,
                      backgroundColor: sel ? `${COLORS.brand}12` : "#FFF" }}
                    activeOpacity={0.75}>
                    <Text style={{ fontSize: 12, fontWeight: sel ? "700" : "400", color: sel ? COLORS.brand : COLORS.gray400 }}>
                      {SERVICE_LINE_LABELS[sl]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quiz questions */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: "800", color: COLORS.gray900 }}>
                Quiz Questions ({questions.length})
              </Text>
              <TouchableOpacity onPress={() => setDraftQ(newDraftQ())}
                style={{ flexDirection: "row", alignItems: "center", gap: 4,
                  backgroundColor: `${COLORS.brand}12`, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 }}
                activeOpacity={0.8}>
                <Ionicons name="add" size={16} color={COLORS.brand} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.brand }}>Add Question</Text>
              </TouchableOpacity>
            </View>

            {questions.map((q, i) => (
              <View key={q.id} style={{ backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.gray900 }} numberOfLines={2}>{i + 1}. {q.question}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.success, marginTop: 3 }}>✓ {q.options[q.correct_index]}</Text>
                  <Text style={{ fontSize: 10, color: COLORS.gray400 }}>{q.options.length} options</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity onPress={() => setDraftQ({ ...q })} activeOpacity={0.7}>
                    <Ionicons name="pencil-outline" size={18} color={COLORS.brand} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setQuestions((prev) => prev.filter((x) => x.id !== q.id))} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Draft question editor */}
            {draftQ && (
              <View style={{ backgroundColor: "#F0F4FF", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: `${COLORS.brand}40` }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.brand, marginBottom: 10 }}>
                  {questions.find((q) => q.id === draftQ.id) ? "Edit Question" : "New Question"}
                </Text>
                <TextInput value={draftQ.question} onChangeText={(t) => setDraftQ((d) => d ? { ...d, question: t } : d)}
                  placeholder="Enter question…" multiline placeholderTextColor={COLORS.gray400}
                  style={{ ...inp({ backgroundColor: "#FFF" }), minHeight: 60, textAlignVertical: "top", marginBottom: 10 }} />

                {draftQ.options.map((opt, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <TouchableOpacity onPress={() => setDraftQ((d) => d ? { ...d, correct_index: i } : d)}
                      style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                        borderColor: draftQ.correct_index === i ? COLORS.success : COLORS.gray300,
                        backgroundColor: draftQ.correct_index === i ? COLORS.success : "transparent",
                        alignItems: "center", justifyContent: "center" }}
                      activeOpacity={0.7}>
                      {draftQ.correct_index === i && <Ionicons name="checkmark" size={12} color="#FFF" />}
                    </TouchableOpacity>
                    <TextInput value={opt} onChangeText={(t) => setOption(i, t)} placeholder={`Option ${i + 1}`}
                      placeholderTextColor={COLORS.gray400} style={{ ...inp({ backgroundColor: "#FFF" }), flex: 1, paddingVertical: 8 }} />
                    {draftQ.options.length > 2 && (
                      <TouchableOpacity onPress={() => removeOption(i)} activeOpacity={0.7}>
                        <Ionicons name="close-circle-outline" size={20} color={COLORS.gray400} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {draftQ.options.length < 4 && (
                  <TouchableOpacity onPress={addOption} style={{ marginBottom: 10 }} activeOpacity={0.7}>
                    <Text style={{ fontSize: 12, color: COLORS.brand, fontWeight: "600" }}>+ Add option</Text>
                  </TouchableOpacity>
                )}
                <TextInput value={draftQ.explanation} onChangeText={(t) => setDraftQ((d) => d ? { ...d, explanation: t } : d)}
                  placeholder="Explanation (shown after quiz)" placeholderTextColor={COLORS.gray400}
                  style={{ ...inp({ backgroundColor: "#FFF" }), marginBottom: 12 }} />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity onPress={() => setDraftQ(null)}
                    style={{ flex: 1, borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 10, paddingVertical: 10, alignItems: "center" }}
                    activeOpacity={0.8}>
                    <Text style={{ fontWeight: "700", color: COLORS.gray400 }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveQuestion}
                    style={{ flex: 2, backgroundColor: COLORS.brand, borderRadius: 10, paddingVertical: 10, alignItems: "center" }}
                    activeOpacity={0.85}>
                    <Text style={{ color: "#FFF", fontWeight: "700" }}>Save Question</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity onPress={save} disabled={saving}
              style={{ backgroundColor: saving ? COLORS.gray200 : COLORS.brand, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8, marginBottom: 8 }}
              activeOpacity={0.85}>
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15 }}>
                {saving ? "Creating…" : `Create Module${questions.length > 0 ? ` (${questions.length} questions)` : ""}`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
