import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { Inquiry, InquiryStatus } from "@/types";
import { COLORS } from "@/constants";

const STATUS_MAP: Record<InquiryStatus, { label: string; color: string; bg: string }> = {
  new:       { label: "New",       color: COLORS.brand,   bg: `${COLORS.brand}14`   },
  contacted: { label: "Contacted", color: COLORS.warning, bg: `${COLORS.warning}14` },
  closed:    { label: "Closed",    color: COLORS.gray400, bg: `${COLORS.gray400}14` },
};

const ALL_STATUSES: InquiryStatus[] = ["new", "contacted", "closed"];

function StatusBadge({ status }: { status: InquiryStatus }) {
  const s = STATUS_MAP[status];
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: s.bg }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: s.color }}>{s.label}</Text>
    </View>
  );
}

export default function InquiriesScreen() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<InquiryStatus | "all">("all");
  const [detail,    setDetail]    = useState<Inquiry | null>(null);
  const [updating,  setUpdating]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("inquiries").select("*").order("submitted_at", { ascending: false });
    setInquiries(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: InquiryStatus) => {
    setUpdating(true);
    await supabase.from("inquiries").update({ status }).eq("id", id);
    setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    if (detail?.id === id) setDetail((d) => d ? { ...d, status } : d);
    setUpdating(false);
  };

  const filtered = filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter);
  const counts = {
    all: inquiries.length,
    new: inquiries.filter((i) => i.status === "new").length,
    contacted: inquiries.filter((i) => i.status === "contacted").length,
    closed: inquiries.filter((i) => i.status === "closed").length,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top"]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.gray900 }}>Inquiries</Text>
        <Text style={{ fontSize: 13, color: COLORS.gray400, marginTop: 1 }}>
          {counts.new} new · {counts.contacted} contacted · {counts.closed} closed
        </Text>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}
        contentContainerStyle={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        {(["all", ...ALL_STATUSES] as const).map((f) => {
          const sel = filter === f;
          const label = f === "all" ? `All (${counts.all})` : `${STATUS_MAP[f].label} (${counts[f]})`;
          return (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
                borderColor: sel ? COLORS.brand : COLORS.gray200,
                backgroundColor: sel ? `${COLORS.brand}12` : "#FFF" }}
              activeOpacity={0.75}>
              <Text style={{ fontSize: 12, fontWeight: sel ? "700" : "400", color: sel ? COLORS.brand : COLORS.gray500 }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 && !loading && (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="mail-outline" size={48} color={COLORS.gray200} />
            <Text style={{ color: COLORS.gray400, marginTop: 8 }}>No inquiries in this category</Text>
          </View>
        )}

        {filtered.map((inq) => (
          <TouchableOpacity key={inq.id} onPress={() => setDetail(inq)} activeOpacity={0.8}>
            <Card style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                {/* Avatar */}
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${COLORS.brand}14`,
                  alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.brand }}>
                    {inq.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.gray900, flex: 1 }} numberOfLines={1}>
                      {inq.name}
                    </Text>
                    <StatusBadge status={inq.status} />
                  </View>
                  <Text style={{ fontSize: 13, color: COLORS.brand, fontWeight: "600" }} numberOfLines={1}>{inq.organization}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 2 }} numberOfLines={1}>{inq.email}</Text>
                  {inq.location_count && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Ionicons name="location-outline" size={12} color={COLORS.gray400} />
                      <Text style={{ fontSize: 11, color: COLORS.gray400 }}>{inq.location_count} locations</Text>
                    </View>
                  )}
                  {inq.message && (
                    <Text style={{ fontSize: 12, color: COLORS.gray500, marginTop: 6, lineHeight: 18 }} numberOfLines={2}>
                      {inq.message}
                    </Text>
                  )}
                  <Text style={{ fontSize: 11, color: COLORS.gray400, marginTop: 6 }}>
                    {new Date(inq.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.gray300} style={{ marginTop: 2 }} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Detail modal */}
      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%", paddingBottom: 36 }}>
            {/* Modal header */}
            <View style={{ flexDirection: "row", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: "800", color: COLORS.gray900 }}>{detail?.name}</Text>
                <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 2 }}>{detail?.organization}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetail(null)}>
                <Ionicons name="close" size={24} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {/* Status + date */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
                {detail && <StatusBadge status={detail.status} />}
                <Text style={{ fontSize: 12, color: COLORS.gray400 }}>
                  {detail && new Date(detail.submitted_at).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
                </Text>
              </View>

              {/* Info grid */}
              {[
                { icon: "mail-outline" as const,     label: "Email",    value: detail?.email },
                { icon: "call-outline" as const,     label: "Phone",    value: detail?.phone || "—" },
                { icon: "business-outline" as const, label: "Org",      value: detail?.organization },
                { icon: "location-outline" as const, label: "Locations",value: detail?.location_count || "—" },
              ].map((row) => (
                <View key={row.label} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 }}>
                  <Ionicons name={row.icon} size={18} color={COLORS.brand} />
                  <Text style={{ fontSize: 13, color: COLORS.gray400, width: 72 }}>{row.label}</Text>
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: COLORS.gray900 }}>{row.value}</Text>
                </View>
              ))}

              {/* Message */}
              {detail?.message ? (
                <View style={{ marginTop: 16, backgroundColor: COLORS.surface, borderRadius: 12, padding: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.gray400, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Message</Text>
                  <Text style={{ fontSize: 14, color: COLORS.gray900, lineHeight: 22 }}>{detail.message}</Text>
                </View>
              ) : null}

              {/* Status actions */}
              <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.gray900, marginTop: 20, marginBottom: 10 }}>Update Status</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {ALL_STATUSES.map((s) => {
                  const sm = STATUS_MAP[s];
                  const active = detail?.status === s;
                  return (
                    <TouchableOpacity key={s}
                      onPress={() => detail && !active && !updating && updateStatus(detail.id, s)}
                      style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10, borderWidth: 2,
                        borderColor: active ? sm.color : COLORS.gray200,
                        backgroundColor: active ? sm.bg : "#FFF" }}
                      activeOpacity={0.8}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: active ? sm.color : COLORS.gray400 }}>
                        {sm.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
