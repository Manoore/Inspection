export type UserRole = "corporate_admin" | "field_manager" | "auditor";

export type ServiceLine =
  | "urgent_care"
  | "occupational_health"
  | "primary_care"
  | "clinical_research"
  | "vibrance_wellness"
  | "telehealth";

export type OhioRegion =
  | "akron"
  | "cleveland"
  | "columbus"
  | "cincinnati"
  | "dayton"
  | "ne_ohio";

export type ChecklistItemType =
  | "pass_fail"
  | "yes_no"
  | "number"
  | "text"
  | "photo"
  | "signature"
  | "temperature";

export type InspectionStatus = "pending" | "in_progress" | "completed" | "failed";
export type ActionStatus = "open" | "in_progress" | "resolved" | "overdue";
export type AlertType = "missed_round" | "critical_failure" | "cert_expiry" | "score_drop";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  assigned_location_ids: string[];
  avatar_url?: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  region: OhioRegion;
  service_lines: ServiceLine[];
  health_score: number;
  manager_id?: string;
  phone?: string;
  created_at: string;
}

export interface Checklist {
  id: string;
  name: string;
  service_line: ServiceLine;
  version: number;
  is_active: boolean;
  items: ChecklistItem[];
  created_by: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  order: number;
  label: string;
  type: ChecklistItemType;
  required: boolean;
  requires_photo_on_fail: boolean;
  conditional_on?: { item_id: string; value: string };
  standard_refs: string[];
}

export interface Inspection {
  id: string;
  location_id: string;
  checklist_id: string;
  inspector_id: string;
  status: InspectionStatus;
  started_at: string;
  completed_at?: string;
  pdf_url?: string;
  signature_url?: string;
  responses: InspectionResponse[];
  score?: number;
  risk_briefing?: string;
}

export interface InspectionResponse {
  id: string;
  inspection_id: string;
  item_id: string;
  value: string;
  passed: boolean;
  photo_url?: string;
  notes?: string;
}

export interface ActionLogEntry {
  id: string;
  action_id: string;
  event: "created" | "assigned" | "escalated" | "status_changed" | "resolved";
  user_name?: string;
  user_id?: string;
  from_level?: number;
  to_level?: number;
  note?: string;
  timestamp: string;
}

export interface EscalationLevelConfig {
  level: 1 | 2 | 3;
  role: UserRole;
  label: string;
  hours_to_escalate: number;
}

export interface EscalationConfig {
  id: string;
  levels: EscalationLevelConfig[];
  created_at: string;
  updated_at: string;
}

export interface CorrectiveAction {
  id: string;
  inspection_id: string;
  location_id: string;
  item_id: string;
  description: string;
  status: ActionStatus;
  assigned_to?: string;
  due_date: string;
  evidence_photo_url?: string;
  created_at: string;
  resolved_at?: string;
  escalation_level: 1 | 2 | 3;
  escalated_at?: string;
  log?: ActionLogEntry[];
}

export interface TrainingQuestion {
  id: string;
  module_id: string;
  order: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  service_lines: ServiceLine[];
  content_url?: string;
  content_type?: "video" | "pdf" | "slides";
  video_url?: string;
  content?: string;
  pass_threshold?: number;
  questions?: TrainingQuestion[];
  duration_minutes: number;
  quiz_id?: string;
  cert_validity_days: number;
  qr_code?: string | null;
  created_at: string;
}

export interface TrainingCompletion {
  id: string;
  user_id: string;
  module_id: string;
  location_id?: string;
  completed_by_name?: string;
  completed_at: string;
  cert_expires_at: string;
  score?: number;
}

export type InquiryStatus = "new" | "contacted" | "closed";

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization: string;
  location_count?: string;
  message?: string;
  status: InquiryStatus;
  submitted_at: string;
}

export interface HealthScore {
  location_id: string;
  score: number;
  inspection_pass_rate: number;
  open_actions_count: number;
  overdue_training_count: number;
  missed_rounds_count: number;
  trend: { date: string; score: number }[];
  calculated_at: string;
}
