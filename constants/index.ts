import { OhioRegion, ServiceLine } from "@/types";

export const SERVICE_LINE_LABELS: Record<ServiceLine, string> = {
  urgent_care:        "Urgent Care",
  occupational_health:"Occupational Health",
  primary_care:       "Primary Care",
  clinical_research:  "Clinical Research",
  vibrance_wellness:  "Vibrance Wellness",
  telehealth:         "Telehealth",
};

export const REGION_LABELS: Record<OhioRegion, string> = {
  akron:     "Akron",
  cleveland: "Cleveland",
  columbus:  "Columbus",
  cincinnati:"Cincinnati",
  dayton:    "Dayton",
  ne_ohio:   "NE Ohio",
};

export const COMPLIANCE_STANDARDS = [
  "Ohio DOH",
  "OSHA",
  "Joint Commission",
  "DOT",
] as const;

export const SCORE_THRESHOLDS = {
  critical: 60,
  warning:  75,
  good:     90,
} as const;

export const SCORE_WEIGHTS = {
  inspection_pass_rate:   0.4,
  open_actions:           0.25,
  overdue_training:       0.2,
  missed_rounds:          0.15,
} as const;

export const COLORS = {
  brand:   "#0f4c81",
  success: "#16a34a",
  warning: "#d97706",
  danger:  "#dc2626",
  surface: "#f8fafc",
  white:   "#ffffff",
  gray50:  "#f9fafb",
  gray200: "#e5e7eb",
  gray400: "#9ca3af",
  gray600: "#4b5563",
  gray900: "#111827",
} as const;
