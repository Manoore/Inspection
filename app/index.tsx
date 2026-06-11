import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Animated } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

const BRAND = "#1B3A6B";
const ACCENT = "#2563EB";
const SUCCESS = "#10B981";
const WARNING = "#F59E0B";
const DANGER  = "#EF4444";

const FEATURES = [
  { icon: "build-outline" as const,            name: "Inspection Builder",       color: "#0f4c81", what: "Build custom checklists per location or department — infection control, medication storage, equipment checks, and more." },
  { icon: "phone-portrait-outline" as const,   name: "Field Manager App",        color: "#7C3AED", what: "iOS & Android app to run inspections, log results, capture photo evidence, add notes, and collect digital signatures." },
  { icon: "person-add-outline" as const,       name: "Task Assignment Engine",   color: "#0891B2", what: "Assign corrective actions from any failed item directly to a staff member with a due date and automatic follow-up." },
  { icon: "speedometer-outline" as const,      name: "Real-Time Dashboard",      color: "#059669", what: "Admin view showing % completion, open issues, and overdue tasks across every location — updated live." },
  { icon: "notifications-outline" as const,    name: "Alert System",             color: "#DC2626", what: "Push and email alerts fire the moment a critical item fails or a round is missed, before issues can escalate." },
  { icon: "download-outline" as const,         name: "Audit Export",             color: "#D97706", what: "One-click PDF or CSV export of all inspection records, ready for Joint Commission or state health inspectors." },
  { icon: "albums-outline" as const,           name: "Template Library",         color: "#EC4899", what: "Pre-loaded urgent care checklists — medication, equipment, facility safety, and infection control — ready on day one." },
  { icon: "shield-checkmark-outline" as const, name: "Acknowledgement Tracking", color: "#6366F1", what: "Staff confirm they've read SOPs or policy updates. Every acknowledgement is logged with name, date, and timestamp." },
];

const STATS = [
  { value: "500+", label: "Locations Managed"    },
  { value: "99%",  label: "Inspection Compliance"},
  { value: "3×",   label: "Faster Audit Prep"    },
  { value: "100%", label: "Digital, No Paper"    },
];

const TESTIMONIALS = [
  { name: "Dr. Angela Ross", role: "Regional Director, MedFirst Ohio",   quote: "ClinicOps cut our audit prep time from 3 days to 4 hours. Every location is inspection-ready every day.", initials: "AR", c: "#7C3AED" },
  { name: "Kevin Marsh",     role: "COO, PrimeCare Group",               quote: "The training certification tracking alone saved us two FTEs. OSHA compliance went from 71% to 98%.",          initials: "KM", c: "#0891B2" },
  { name: "Dr. Priya Nair",  role: "VP Operations, QuickMed Centers",    quote: "Real-time health scores per location changed how we manage our 14 sites. Nothing slips through anymore.",      initials: "PN", c: "#059669" },
];

// ── Slide screen mockups ──────────────────────────────────────────────────────

function ScreenDashboard() {
  const locs = [{ n: "West Market", s: 88 }, { n: "Fairlawn", s: 72 }, { n: "Beachwood", s: 94 }, { n: "Strongsville", s: 55 }];
  return (
    <View style={{ backgroundColor: "#FFF", borderRadius: 16, overflow: "hidden" }}>
      <View style={{ backgroundColor: BRAND, padding: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="grid-outline" size={16} color="rgba(255,255,255,0.7)" />
        <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "700" }}>Location Overview</Text>
      </View>
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
        {[{ v: "87%", l: "Avg Score", c: SUCCESS }, { v: "9/12", l: "On Track", c: ACCENT }, { v: "4", l: "Actions", c: WARNING }].map((s, i) => (
          <View key={s.l} style={{ flex: 1, alignItems: "center", paddingVertical: 14, borderRightWidth: i < 2 ? 1 : 0, borderRightColor: "#F3F4F6" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: s.c }}>{s.v}</Text>
            <Text style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{s.l}</Text>
          </View>
        ))}
      </View>
      <View style={{ padding: 14, gap: 2 }}>
        {locs.map((l) => {
          const c = l.s >= 90 ? SUCCESS : l.s >= 75 ? WARNING : DANGER;
          return (
            <View key={l.n} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#F9FAFB", gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
              <Text style={{ flex: 1, fontSize: 12, color: "#374151", fontWeight: "500" }}>{l.n}</Text>
              <Text style={{ fontSize: 12, fontWeight: "800", color: c }}>{l.s}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ScreenInspect() {
  const items = [
    { label: "Medication fridge 35–46°F", done: true  },
    { label: "PPE stock adequate",        done: true  },
    { label: "Sharps containers <¾ full", done: true  },
    { label: "Autoclave log current",     done: false },
    { label: "Lab calibration stickers",  done: false },
  ];
  return (
    <View style={{ backgroundColor: "#FFF", borderRadius: 16, overflow: "hidden" }}>
      <View style={{ backgroundColor: "#7C3AED", padding: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="clipboard-outline" size={16} color="rgba(255,255,255,0.8)" />
        <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "700", flex: 1 }}>Daily Inspection</Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>3/5</Text>
      </View>
      <View style={{ height: 4, backgroundColor: "#F3F4F6" }}>
        <View style={{ height: 4, width: "60%", backgroundColor: "#7C3AED" }} />
      </View>
      <View style={{ padding: 14, gap: 0 }}>
        {items.map((item) => (
          <View key={item.label} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#F9FAFB", gap: 10 }}>
            <Ionicons name={item.done ? "checkmark-circle" : "ellipse-outline"} size={20} color={item.done ? SUCCESS : "#D1D5DB"} />
            <Text style={{ flex: 1, fontSize: 12, color: item.done ? "#374151" : "#9CA3AF", fontWeight: item.done ? "500" : "400" }}>{item.label}</Text>
            {item.done && <Ionicons name="camera-outline" size={14} color="#9CA3AF" />}
          </View>
        ))}
      </View>
      <View style={{ padding: 14, paddingTop: 4 }}>
        <View style={{ backgroundColor: `${"#7C3AED"}14`, borderRadius: 10, paddingVertical: 11, alignItems: "center" }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#7C3AED" }}>Continue Inspection →</Text>
        </View>
      </View>
    </View>
  );
}

function ScreenTraining() {
  const modules = [
    { title: "Bloodborne Pathogens",  pct: 100, c: SUCCESS, badge: "Certified"   },
    { title: "Infection Control",     pct: 75,  c: WARNING, badge: "In Progress" },
    { title: "DOT Recertification",   pct: 40,  c: DANGER,  badge: "Due Soon"    },
    { title: "GLP-1 Cold Chain",      pct: 0,   c: "#9CA3AF", badge: "Not Started"},
  ];
  return (
    <View style={{ backgroundColor: "#FFF", borderRadius: 16, overflow: "hidden" }}>
      <View style={{ backgroundColor: "#0891B2", padding: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="school-outline" size={16} color="rgba(255,255,255,0.8)" />
        <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "700", flex: 1 }}>My Training</Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>1/4 certified</Text>
      </View>
      <View style={{ padding: 14, gap: 12 }}>
        {modules.map((m) => (
          <View key={m.title}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
              <Text style={{ flex: 1, fontSize: 12, color: "#374151", fontWeight: "500" }} numberOfLines={1}>{m.title}</Text>
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, backgroundColor: `${m.c}14` }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: m.c }}>{m.badge}</Text>
              </View>
            </View>
            <View style={{ height: 5, backgroundColor: "#F3F4F6", borderRadius: 3 }}>
              <View style={{ height: 5, borderRadius: 3, backgroundColor: m.c, width: `${m.pct}%` }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ScreenReports() {
  const bars = [{ r: "Akron", s: 88 }, { r: "Cleveland", s: 72 }, { r: "Columbus", s: 94 }, { r: "Cincinnati", s: 91 }, { r: "Dayton", s: 78 }];
  return (
    <View style={{ backgroundColor: "#FFF", borderRadius: 16, overflow: "hidden" }}>
      <View style={{ backgroundColor: "#059669", padding: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="bar-chart-outline" size={16} color="rgba(255,255,255,0.8)" />
        <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "700" }}>Regional Scores</Text>
      </View>
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", height: 90, gap: 8, marginBottom: 8 }}>
          {bars.map((b) => {
            const c = b.s >= 90 ? SUCCESS : b.s >= 75 ? WARNING : DANGER;
            const h = Math.round((b.s / 100) * 78);
            return (
              <View key={b.r} style={{ flex: 1, alignItems: "center", height: 90, justifyContent: "flex-end" }}>
                <Text style={{ fontSize: 9, fontWeight: "700", color: c, marginBottom: 3 }}>{b.s}</Text>
                <View style={{ width: "70%", height: h, backgroundColor: c, borderRadius: 4 }} />
              </View>
            );
          })}
        </View>
        <View style={{ height: 1, backgroundColor: "#F3F4F6", marginBottom: 6 }} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          {bars.map((b) => (
            <Text key={b.r} style={{ flex: 1, fontSize: 9, textAlign: "center", color: "#9CA3AF" }}>{b.r.slice(0, 3)}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── Animated slideshow ────────────────────────────────────────────────────────

const SLIDES = [
  { icon: "grid-outline" as const,      label: "Dashboard", title: "Live health scores, every location",      desc: "See every clinic's compliance score in real time. Drill down to find issues before audits do.",         color: BRAND,     Screen: ScreenDashboard },
  { icon: "clipboard-outline" as const, label: "Inspect",   title: "Digital checklists, zero paper",           desc: "Field staff run inspections on mobile — photo evidence, auto-scoring, and corrective actions.",        color: "#7C3AED", Screen: ScreenInspect   },
  { icon: "school-outline" as const,    label: "Training",  title: "Certifications tracked automatically",     desc: "Video modules, quizzes, and digital certificates. Expiry alerts sent before deadlines hit.",           color: "#0891B2", Screen: ScreenTraining  },
  { icon: "bar-chart-outline" as const, label: "Reports",   title: "Regional benchmarks at a glance",          desc: "Spot under-performing regions, surface patterns, and present data to leadership in one click.",        color: "#059669", Screen: ScreenReports   },
];

function AppSlideshow() {
  const [active, setActive] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const goTo = (idx: number) => {
    Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setActive(idx);
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  useEffect(() => {
    const t = setInterval(() => goTo((active + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, [active]);

  const slide = SLIDES[active];
  const Screen = slide.Screen;

  return (
    <View style={{ backgroundColor: "#F9FAFB", paddingVertical: 72, paddingHorizontal: wide ? 64 : 24 }}>
      <Text style={{ fontSize: 13, fontWeight: "700", color: ACCENT, letterSpacing: 1.5, textAlign: "center", marginBottom: 10 }}>THE PLATFORM IN ACTION</Text>
      <Text style={{ fontSize: wide ? 34 : 24, fontWeight: "800", color: "#111827", textAlign: "center", marginBottom: 36 }}>See every feature, live</Text>

      {/* Tab buttons */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 36, flexWrap: "wrap" }}>
        {SLIDES.map((s, i) => {
          const sel = i === active;
          return (
            <TouchableOpacity key={s.label} onPress={() => goTo(i)}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10,
                borderRadius: 24, borderWidth: 2,
                borderColor: sel ? s.color : "#E5E7EB",
                backgroundColor: sel ? `${s.color}12` : "#FFF" }}
              activeOpacity={0.75}>
              <Ionicons name={s.icon} size={16} color={sel ? s.color : "#9CA3AF"} />
              <Text style={{ fontSize: 13, fontWeight: sel ? "700" : "500", color: sel ? s.color : "#6B7280" }}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Slide content */}
      <View style={{ flexDirection: wide ? "row" : "column", gap: 40, alignItems: "center", maxWidth: 1000, alignSelf: "center", width: "100%" }}>
        {/* Screen mockup */}
        <Animated.View style={{ opacity, width: wide ? 320 : "100%", maxWidth: 360, alignSelf: "center" }}>
          <View style={{ borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 12 }}>
            <Screen />
          </View>
        </Animated.View>

        {/* Text */}
        <Animated.View style={{ opacity, flex: 1, alignItems: wide ? "flex-start" : "center" }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: `${slide.color}18`,
            alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <Ionicons name={slide.icon} size={24} color={slide.color} />
          </View>
          <Text style={{ fontSize: wide ? 28 : 22, fontWeight: "800", color: "#111827", marginBottom: 14, textAlign: wide ? "left" : "center", lineHeight: 36 }}>
            {slide.title}
          </Text>
          <Text style={{ fontSize: 16, color: "#6B7280", lineHeight: 26, textAlign: wide ? "left" : "center", maxWidth: 420 }}>
            {slide.desc}
          </Text>
          {/* Dot indicators */}
          <View style={{ flexDirection: "row", gap: 6, marginTop: 28 }}>
            {SLIDES.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
                <View style={{ height: 8, borderRadius: 4,
                  width: i === active ? 24 : 8,
                  backgroundColor: i === active ? slide.color : "#D1D5DB" }} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

// ── Landing page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { width } = useWindowDimensions();
  const wide   = width >= 960;
  const mobile = width < 500;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <StatusBar style="light" />

      {/* Navbar */}
      <View style={{ backgroundColor: BRAND, flexDirection: "row", alignItems: "center", paddingHorizontal: wide ? 64 : 20, paddingVertical: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#FFF", letterSpacing: -0.5 }}>ClinicOps</Text>
          <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>INSPECTION & TRAINING</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")}
          style={{ borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)", borderRadius: 8, paddingHorizontal: 18, paddingVertical: 9 }}
          activeOpacity={0.8}>
          <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 14 }}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={{ backgroundColor: BRAND, paddingHorizontal: wide ? 64 : 20, paddingTop: mobile ? 40 : 56, paddingBottom: mobile ? 48 : 72 }}>
          <View style={{ maxWidth: 1200, alignSelf: "center", width: "100%" }}>
            <View style={{ flexDirection: wide ? "row" : "column", alignItems: wide ? "center" : "stretch", gap: wide ? 48 : 28 }}>
              <View style={{ flex: 1 }}>
                <View style={{ backgroundColor: "rgba(37,99,235,0.35)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16, alignSelf: "flex-start" }}>
                  <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: mobile ? 11 : 12, fontWeight: "600", letterSpacing: 0.4 }}>Built for multi-site urgent care & primary care</Text>
                </View>
                <Text style={{ fontSize: wide ? 48 : mobile ? 26 : 32, fontWeight: "800", color: "#FFF", lineHeight: wide ? 56 : mobile ? 34 : 40, marginBottom: 16 }}>
                  Inspect Smarter.{"\n"}Train Faster.{"\n"}Operate Better.
                </Text>
                <Text style={{ fontSize: mobile ? 14 : 17, color: "rgba(255,255,255,0.72)", lineHeight: mobile ? 22 : 28, marginBottom: 28 }}>
                  The all-in-one compliance platform for healthcare organizations managing multiple locations, staff certifications, and inspection schedules.
                </Text>
                <View style={{ flexDirection: mobile ? "column" : "row", gap: 12 }}>
                  <TouchableOpacity onPress={() => router.push("/(auth)/contact")}
                    style={{ backgroundColor: "#FFF", borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, alignItems: "center" }}
                    activeOpacity={0.85}>
                    <Text style={{ color: BRAND, fontWeight: "800", fontSize: 15 }}>Get Started Free →</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push("/(auth)/login")}
                    style={{ borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, alignItems: "center" }}
                    activeOpacity={0.85}>
                    <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 15 }}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* Screen preview — hide on mobile to avoid clutter */}
              {!mobile && (
                <View style={{ width: wide ? 320 : "100%", maxWidth: 360, alignSelf: "center" }}>
                  <View style={{ borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.25, shadowRadius: 40, elevation: 20 }}>
                    <ScreenDashboard />
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={{ backgroundColor: ACCENT, paddingVertical: 24, paddingHorizontal: mobile ? 20 : 0 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
            {STATS.map((s, i) => (
              <View key={s.label} style={{
                alignItems: "center", paddingHorizontal: mobile ? 0 : 28, paddingVertical: mobile ? 14 : 8,
                width: mobile ? "50%" : undefined,
                borderRightWidth: mobile ? (i % 2 === 0 ? 1 : 0) : (i < STATS.length - 1 ? 1 : 0),
                borderBottomWidth: mobile && i < 2 ? 1 : 0,
                borderColor: "rgba(255,255,255,0.2)",
              }}>
                <Text style={{ fontSize: mobile ? 28 : 26, fontWeight: "800", color: "#FFF" }}>{s.value}</Text>
                <Text style={{ fontSize: mobile ? 11 : 12, color: "rgba(255,255,255,0.75)", marginTop: 3, textAlign: "center" }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features grid */}
        {(() => {
          const cols = wide ? 4 : mobile ? 1 : 2;
          const rows: typeof FEATURES[] = [];
          for (let i = 0; i < FEATURES.length; i += cols) rows.push(FEATURES.slice(i, i + cols));
          return (
            <View style={{ paddingHorizontal: wide ? 64 : 24, paddingVertical: 72, backgroundColor: "#EEF2FF" }}>
              <View style={{ maxWidth: 1200, alignSelf: "center", width: "100%" }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: ACCENT, letterSpacing: 1.8, textAlign: "center", marginBottom: 10, textTransform: "uppercase" }}>
                  Everything you need
                </Text>
                <Text style={{ fontSize: wide ? 36 : 24, fontWeight: "800", color: "#111827", textAlign: "center", marginBottom: 12, lineHeight: wide ? 44 : 32 }}>
                  One platform.{"\n"}Every compliance need covered.
                </Text>
                <Text style={{ fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 25, marginBottom: 48, maxWidth: 500, alignSelf: "center" }}>
                  From building checklists to exporting audit reports — every tool your operations team needs is already built in.
                </Text>
                {rows.map((row, ri) => (
                  <View key={ri} style={{ flexDirection: "row", gap: 14, marginBottom: 14 }}>
                    {row.map((f) => (
                      <View key={f.name} style={{ flex: 1, backgroundColor: "#FFF", borderRadius: 18, padding: mobile ? 20 : 22,
                        borderWidth: 1, borderColor: "#E0E7FF",
                        shadowColor: f.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 3 }}>
                        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: `${f.color}14`,
                          alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                          <Ionicons name={f.icon} size={24} color={f.color} />
                        </View>
                        <Text style={{ fontSize: wide ? 14 : 13, fontWeight: "800", color: "#111827", marginBottom: 8, lineHeight: 20 }}>{f.name}</Text>
                        <Text style={{ fontSize: wide ? 13 : 12, color: "#6B7280", lineHeight: 19 }}>{f.what}</Text>
                      </View>
                    ))}
                    {row.length < cols && [...Array(cols - row.length)].map((_, i) => (
                      <View key={`gap-${i}`} style={{ flex: 1 }} />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

        {/* Animated slideshow */}
        <AppSlideshow />

        {/* Testimonials */}
        <View style={{ paddingHorizontal: wide ? 64 : 24, paddingVertical: 64 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: ACCENT, letterSpacing: 1.5, textAlign: "center", marginBottom: 10 }}>TRUSTED BY HEALTHCARE OPERATORS</Text>
          <Text style={{ fontSize: wide ? 34 : 24, fontWeight: "800", color: "#111827", textAlign: "center", marginBottom: 36 }}>Real results from real clinics</Text>
          <View style={{ flexDirection: wide ? "row" : "column", gap: 16 }}>
            {TESTIMONIALS.map((t) => (
              <View key={t.name} style={{ flex: 1, backgroundColor: "#FFF", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#E5E7EB",
                shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={ACCENT} style={{ marginBottom: 14 }} />
                <Text style={{ fontSize: 14, color: "#374151", lineHeight: 22, marginBottom: 20, fontStyle: "italic" }}>"{t.quote}"</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.c, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "700" }}>{t.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>{t.name}</Text>
                    <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>{t.role}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={{ backgroundColor: BRAND, paddingHorizontal: wide ? 64 : 24, paddingVertical: 64, alignItems: "center" }}>
          <Text style={{ fontSize: wide ? 36 : 24, fontWeight: "800", color: "#FFF", textAlign: "center", marginBottom: 12 }}>Ready to modernize your ops?</Text>
          <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", textAlign: "center", marginBottom: 32, maxWidth: 480, lineHeight: 26 }}>
            Join hundreds of urgent care and primary care organizations running inspections and training on ClinicOps.
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/contact")}
            style={{ backgroundColor: "#FFF", borderRadius: 12, paddingHorizontal: 40, paddingVertical: 18 }}
            activeOpacity={0.85}>
            <Text style={{ color: BRAND, fontWeight: "800", fontSize: 17 }}>Start for Free →</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={{ backgroundColor: "#111827", paddingHorizontal: wide ? 64 : 24, paddingVertical: 28,
          flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFF" }}>ClinicOps</Text>
          <Text style={{ fontSize: 12, color: "#6B7280" }}>© {new Date().getFullYear()} ClinicOps. Built for healthcare operations.</Text>
        </View>

      </ScrollView>
    </View>
  );
}
