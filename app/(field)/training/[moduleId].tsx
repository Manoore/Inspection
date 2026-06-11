import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import { TrainingModule, TrainingQuestion, TrainingCompletion } from "@/types";
import { COLORS } from "@/constants";

type Step = "content" | "quiz" | "review";

function StepBar({ labels, current }: { labels: string[]; current: number }) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: "#FFF", paddingVertical: 12, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
      {labels.map((label, i) => (
        <React.Fragment key={label}>
          <View style={{ alignItems: "center" }}>
            <View style={{
              width: 26, height: 26, borderRadius: 13,
              backgroundColor: i < current ? COLORS.success : i === current ? COLORS.brand : COLORS.gray200,
              alignItems: "center", justifyContent: "center",
            }}>
              {i < current
                ? <Ionicons name="checkmark" size={14} color="#FFF" />
                : <Text style={{ fontSize: 11, fontWeight: "700", color: i === current ? "#FFF" : COLORS.gray400 }}>{i + 1}</Text>}
            </View>
            <Text style={{ fontSize: 10, marginTop: 3, color: i === current ? COLORS.brand : COLORS.gray400, fontWeight: i === current ? "700" : "400" }}>
              {label}
            </Text>
          </View>
          {i < labels.length - 1 && (
            <View style={{ flex: 1, height: 2, backgroundColor: i < current ? COLORS.success : COLORS.gray200, marginTop: 12, marginHorizontal: 4 }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

function NavHeader({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack: () => void; right?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.brand }}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFF" }} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{subtitle}</Text> : null}
      </View>
      {right ? <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{right}</Text> : null}
    </View>
  );
}

function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20,
      backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.gray200 }}>
      {children}
    </View>
  );
}

export default function TrainingPlayerScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const { user } = useAuthStore();
  const [mod,     setMod]     = useState<TrainingModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [step,    setStep]    = useState<Step>("content");
  const [qIndex,  setQIndex]  = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score,   setScore]   = useState(0);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    supabase.from("training_modules").select("*").eq("id", moduleId).single()
      .then(({ data }) => { setMod(data); setLoading(false); });
  }, [moduleId]);

  if (loading || !mod) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={COLORS.brand} size="large" />
      </View>
    );
  }

  const questions: TrainingQuestion[] = mod.questions ?? [];
  const threshold = mod.pass_threshold ?? 70;
  const hasQuiz = questions.length > 0;
  const stepLabels = hasQuiz ? ["Content", "Quiz", "Review"] : ["Content", "Complete"];
  const stepIdx = step === "content" ? 0 : step === "quiz" ? 1 : hasQuiz ? 2 : 1;

  const submitQuiz = () => {
    let correct = 0;
    questions.forEach((q) => { if (answers[q.order] === q.correct_index) correct++; });
    setScore(questions.length > 0 ? Math.round((correct / questions.length) * 100) : 100);
    setStep("review");
  };

  const claim = async () => {
    if (!user) return;
    setSaving(true);
    const now = new Date();
    const exp = new Date(now.getTime() + mod.cert_validity_days * 86400000);
    const payload: Partial<TrainingCompletion> = {
      user_id: user.id, module_id: mod.id,
      completed_at: now.toISOString(), cert_expires_at: exp.toISOString(), score,
    };
    await supabase.from("training_completions").insert(payload).single();
    setSaving(false);
    router.back();
  };

  // ── Content step ──────────────────────────────────────────────────────────────
  if (step === "content") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
        <NavHeader title={mod.title} subtitle={`${mod.duration_minutes} min · ${mod.cert_validity_days}d cert`} onBack={() => router.back()} />
        <StepBar labels={stepLabels} current={stepIdx} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {mod.video_url ? (
            <TouchableOpacity onPress={() => Linking.openURL(mod.video_url!)}
              style={{ backgroundColor: COLORS.gray900, borderRadius: 14, height: 190, alignItems: "center", justifyContent: "center", marginBottom: 20 }}
              activeOpacity={0.85}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="play" size={30} color="#FFF" />
              </View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 10 }}>Tap to watch training video</Text>
            </TouchableOpacity>
          ) : null}
          {mod.content ? (
            <View style={{ backgroundColor: "#FFF", borderRadius: 14, padding: 18, marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.brand} />
                <Text style={{ fontSize: 13, fontWeight: "800", color: COLORS.brand, textTransform: "uppercase", letterSpacing: 0.8 }}>Training Content</Text>
              </View>
              <Text style={{ fontSize: 14, color: COLORS.gray900, lineHeight: 24 }}>{mod.content}</Text>
            </View>
          ) : null}
          {!mod.video_url && !mod.content && (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <Ionicons name="school-outline" size={52} color={COLORS.gray200} />
              <Text style={{ color: COLORS.gray400, marginTop: 10, fontSize: 15 }}>Review your training materials before continuing</Text>
            </View>
          )}
        </ScrollView>
        <BottomBar>
          <TouchableOpacity onPress={() => hasQuiz ? setStep("quiz") : setStep("review")}
            style={{ backgroundColor: COLORS.brand, borderRadius: 12, paddingVertical: 16, alignItems: "center" }}
            activeOpacity={0.85}>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15 }}>
              {hasQuiz ? `Take Quiz  (${questions.length} questions)` : "Mark as Reviewed"}
            </Text>
          </TouchableOpacity>
        </BottomBar>
      </SafeAreaView>
    );
  }

  // ── Quiz step ─────────────────────────────────────────────────────────────────
  if (step === "quiz") {
    const q = questions[qIndex];
    const chosen = answers[q.order];
    const allAnswered = questions.every((qq) => answers[qq.order] !== undefined);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
        <NavHeader title="Quiz" onBack={() => setStep("content")} right={`${qIndex + 1}/${questions.length}`} />
        <StepBar labels={stepLabels} current={stepIdx} />
        <View style={{ height: 3, backgroundColor: COLORS.gray200 }}>
          <View style={{ height: 3, backgroundColor: COLORS.brand, width: `${((qIndex + 1) / questions.length) * 100}%` }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 12, color: COLORS.gray400, marginBottom: 8, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Question {qIndex + 1} of {questions.length}
          </Text>
          <Text style={{ fontSize: 17, fontWeight: "700", color: COLORS.gray900, lineHeight: 26, marginBottom: 24 }}>{q.question}</Text>
          {q.options.map((opt, i) => {
            const sel = chosen === i;
            return (
              <TouchableOpacity key={i} onPress={() => setAnswers((prev) => ({ ...prev, [q.order]: i }))}
                style={{ flexDirection: "row", alignItems: "center", gap: 14,
                  backgroundColor: sel ? `${COLORS.brand}10` : "#FFF",
                  borderWidth: 2, borderColor: sel ? COLORS.brand : COLORS.gray200,
                  borderRadius: 12, padding: 16, marginBottom: 10 }}
                activeOpacity={0.7}>
                <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2,
                  borderColor: sel ? COLORS.brand : COLORS.gray300,
                  backgroundColor: sel ? COLORS.brand : "transparent",
                  alignItems: "center", justifyContent: "center" }}>
                  {sel && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: sel ? COLORS.brand : COLORS.gray700, fontWeight: sel ? "600" : "400" }}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <BottomBar>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {qIndex > 0 && (
              <TouchableOpacity onPress={() => setQIndex((i) => i - 1)}
                style={{ flex: 0.4, borderWidth: 1.5, borderColor: COLORS.gray200, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
                activeOpacity={0.8}>
                <Text style={{ fontWeight: "700", color: COLORS.gray600 }}>Back</Text>
              </TouchableOpacity>
            )}
            {qIndex < questions.length - 1 ? (
              <TouchableOpacity onPress={() => setQIndex((i) => i + 1)} disabled={chosen === undefined}
                style={{ flex: 1, backgroundColor: chosen !== undefined ? COLORS.brand : COLORS.gray200, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
                activeOpacity={0.85}>
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={submitQuiz} disabled={!allAnswered}
                style={{ flex: 1, backgroundColor: allAnswered ? COLORS.success : COLORS.gray200, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
                activeOpacity={0.85}>
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Submit Quiz</Text>
              </TouchableOpacity>
            )}
          </View>
        </BottomBar>
      </SafeAreaView>
    );
  }

  // ── Review step ───────────────────────────────────────────────────────────────
  const passed = score >= threshold;
  const scoreColor = passed ? COLORS.success : COLORS.danger;
  const correct = questions.filter((q) => answers[q.order] === q.correct_index).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      <NavHeader title="Results" onBack={() => router.back()} />
      <StepBar labels={stepLabels} current={stepIdx} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Score card */}
        <View style={{ backgroundColor: "#FFF", borderRadius: 16, padding: 28, alignItems: "center", marginBottom: 20 }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: `${scoreColor}14`,
            alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: scoreColor, marginBottom: 14 }}>
            <Text style={{ fontSize: 26, fontWeight: "800", color: scoreColor }}>{score}%</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.gray900, marginBottom: 6 }}>
            {passed ? "Passed!" : "Not Passed"}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.gray400, textAlign: "center", lineHeight: 20 }}>
            {passed
              ? `Your certificate is valid for ${mod.cert_validity_days} days.`
              : `Minimum passing score is ${threshold}%. Please review and retake.`}
          </Text>
          {hasQuiz && (
            <Text style={{ fontSize: 12, color: COLORS.gray500, marginTop: 8 }}>{correct}/{questions.length} correct answers</Text>
          )}
        </View>

        {/* Answer breakdown */}
        {hasQuiz && (
          <>
            <Text style={{ fontSize: 13, fontWeight: "800", color: COLORS.gray600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
              Answer Review
            </Text>
            {questions.map((q) => {
              const chosen = answers[q.order];
              const isCorrect = chosen === q.correct_index;
              const qColor = isCorrect ? COLORS.success : COLORS.danger;
              return (
                <View key={q.id} style={{ backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: qColor }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <Ionicons name={isCorrect ? "checkmark-circle" : "close-circle"} size={18} color={qColor} style={{ marginTop: 1 }} />
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.gray900, lineHeight: 20 }}>{q.question}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: COLORS.gray500, marginBottom: 2 }}>
                    Your answer: <Text style={{ color: qColor, fontWeight: "600" }}>
                      {chosen !== undefined ? q.options[chosen] : "Not answered"}
                    </Text>
                  </Text>
                  {!isCorrect && (
                    <Text style={{ fontSize: 12, color: COLORS.success, marginBottom: 2 }}>
                      Correct: <Text style={{ fontWeight: "600" }}>{q.options[q.correct_index]}</Text>
                    </Text>
                  )}
                  {q.explanation ? (
                    <Text style={{ fontSize: 11, color: COLORS.gray400, fontStyle: "italic", marginTop: 4, lineHeight: 16 }}>{q.explanation}</Text>
                  ) : null}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <BottomBar>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {!passed && (
            <TouchableOpacity onPress={() => { setAnswers({}); setQIndex(0); setScore(0); setStep("content"); }}
              style={{ flex: 1, borderWidth: 1.5, borderColor: COLORS.brand, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
              activeOpacity={0.8}>
              <Text style={{ fontWeight: "700", color: COLORS.brand }}>Retake</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={passed ? claim : () => router.back()} disabled={saving}
            style={{ flex: 2, backgroundColor: passed ? COLORS.brand : COLORS.gray200, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
            activeOpacity={0.85}>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15 }}>
              {saving ? "Saving…" : passed ? "Claim Certificate" : "Exit"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomBar>
    </SafeAreaView>
  );
}
