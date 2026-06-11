import {
  User, Location, Checklist, ChecklistItem,
  HealthScore, Inspection, InspectionResponse,
  CorrectiveAction, TrainingModule, TrainingCompletion, TrainingQuestion, Inquiry,
  EscalationConfig,
} from "@/types";

// ── Users ────────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: "user-admin-1",
    email: "admin@test.com",
    full_name: "Sarah Mitchell",
    role: "corporate_admin",
    assigned_location_ids: [],
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "user-field-1",
    email: "field@test.com",
    full_name: "James Carter",
    role: "field_manager",
    assigned_location_ids: ["loc-1", "loc-2", "loc-3"],
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "user-auditor-1",
    email: "auditor@test.com",
    full_name: "Linda Park",
    role: "auditor",
    assigned_location_ids: [],
    created_at: "2024-01-01T00:00:00Z",
  },
];

// ── Locations ─────────────────────────────────────────────────────────────────

export const MOCK_LOCATIONS: Location[] = [
  { id: "loc-1", name: "Hometown Akron – West Market",     address: "1234 W Market St, Akron, OH",        region: "akron",     service_lines: ["urgent_care", "occupational_health"], health_score: 88, created_at: "2024-01-01T00:00:00Z" },
  { id: "loc-2", name: "Hometown Akron – Fairlawn",        address: "567 Medina Rd, Fairlawn, OH",         region: "akron",     service_lines: ["urgent_care", "primary_care"],         health_score: 72, created_at: "2024-01-01T00:00:00Z" },
  { id: "loc-3", name: "Hometown Cleveland – Beachwood",   address: "3900 Orange Pl, Beachwood, OH",       region: "cleveland", service_lines: ["urgent_care", "vibrance_wellness"],     health_score: 94, created_at: "2024-01-01T00:00:00Z" },
  { id: "loc-4", name: "Hometown Cleveland – Strongsville", address: "18099 Royalton Rd, Strongsville, OH", region: "cleveland", service_lines: ["urgent_care", "telehealth"],             health_score: 55, created_at: "2024-01-01T00:00:00Z" },
  { id: "loc-5", name: "Hometown Columbus – Easton",       address: "4120 Easton Way, Columbus, OH",       region: "columbus",  service_lines: ["urgent_care", "clinical_research"],     health_score: 81, created_at: "2024-01-01T00:00:00Z" },
  { id: "loc-6", name: "Hometown Columbus – Dublin",       address: "6800 Hospital Dr, Dublin, OH",        region: "columbus",  service_lines: ["urgent_care", "primary_care"],          health_score: 67, created_at: "2024-01-01T00:00:00Z" },
  { id: "loc-7", name: "Hometown Cincinnati – Anderson",   address: "8040 Beechmont Ave, Cincinnati, OH",  region: "cincinnati", service_lines: ["urgent_care", "occupational_health"], health_score: 91, created_at: "2024-01-01T00:00:00Z" },
  { id: "loc-8", name: "Hometown Dayton – Beavercreek",   address: "2300 N Fairfield Rd, Beavercreek, OH", region: "dayton",   service_lines: ["urgent_care", "telehealth"],             health_score: 78, created_at: "2024-01-01T00:00:00Z" },
  { id: "loc-9", name: "Hometown NE Ohio – Mentor",        address: "7789 Reynolds Rd, Mentor, OH",        region: "ne_ohio",   service_lines: ["urgent_care", "vibrance_wellness"],    health_score: 85, created_at: "2024-01-01T00:00:00Z" },
];

// ── Health Scores ─────────────────────────────────────────────────────────────

function trend(base: number) {
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0],
    score: Math.min(100, Math.max(40, base + Math.round((Math.random() - 0.5) * 10))),
  }));
}

export const MOCK_HEALTH_SCORES: HealthScore[] = MOCK_LOCATIONS.map((loc) => ({
  location_id:             loc.id,
  score:                   loc.health_score,
  inspection_pass_rate:    parseFloat((loc.health_score * 0.95 + Math.random() * 5).toFixed(1)),
  open_actions_count:      loc.health_score < 70 ? 5 : loc.health_score < 85 ? 2 : 0,
  overdue_training_count:  loc.health_score < 65 ? 3 : 0,
  missed_rounds_count:     loc.health_score < 60 ? 2 : 0,
  trend:                   trend(loc.health_score),
  calculated_at:           new Date().toISOString(),
}));

// ── Checklist Items ───────────────────────────────────────────────────────────

export const MOCK_CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: "item-1",  checklist_id: "cl-1", order: 1,  label: "Medication fridge temp 35–46°F",                    type: "temperature", required: true,  requires_photo_on_fail: true,  conditional_on: undefined, standard_refs: ["Ohio DOH §3701-28-03", "Joint Commission RC.02.01.01"] },
  { id: "item-2",  checklist_id: "cl-1", order: 2,  label: "Vaccine fridge temp 35–46°F",                       type: "temperature", required: true,  requires_photo_on_fail: true,  conditional_on: undefined, standard_refs: ["Ohio DOH §3701-28-03"] },
  { id: "item-3",  checklist_id: "cl-1", order: 3,  label: "PPE stock (gloves, masks, gowns) adequate",         type: "pass_fail",   required: true,  requires_photo_on_fail: false, conditional_on: undefined, standard_refs: ["OSHA 29 CFR 1910.132"] },
  { id: "item-4",  checklist_id: "cl-1", order: 4,  label: "Exam rooms cleaned & disinfected",                  type: "pass_fail",   required: true,  requires_photo_on_fail: false, conditional_on: undefined, standard_refs: ["Joint Commission IC.02.02.01"] },
  { id: "item-5",  checklist_id: "cl-1", order: 5,  label: "Sharps containers <¾ full",                         type: "pass_fail",   required: true,  requires_photo_on_fail: true,  conditional_on: undefined, standard_refs: ["OSHA 29 CFR 1910.1030"] },
  { id: "item-6",  checklist_id: "cl-1", order: 6,  label: "Autoclave log current (last cycle <24 hrs)",        type: "yes_no",      required: true,  requires_photo_on_fail: false, conditional_on: undefined, standard_refs: ["Joint Commission IC.02.02.01"] },
  { id: "item-7",  checklist_id: "cl-1", order: 7,  label: "Lab equipment calibration stickers current",        type: "pass_fail",   required: false, requires_photo_on_fail: true,  conditional_on: undefined, standard_refs: ["Ohio DOH §3701-83-09"] },
  { id: "item-8",  checklist_id: "cl-1", order: 8,  label: "EKG machine functional test passed",               type: "pass_fail",   required: false, requires_photo_on_fail: false, conditional_on: undefined, standard_refs: [] },
  { id: "item-9",  checklist_id: "cl-2", order: 1,  label: "DOT drug test kits not expired",                    type: "pass_fail",   required: true,  requires_photo_on_fail: true,  conditional_on: undefined, standard_refs: ["DOT 49 CFR Part 40"] },
  { id: "item-10", checklist_id: "cl-2", order: 2,  label: "Breathalyzer calibration current (<12 months)",     type: "yes_no",      required: true,  requires_photo_on_fail: true,  conditional_on: undefined, standard_refs: ["DOT 49 CFR Part 40.233"] },
  { id: "item-11", checklist_id: "cl-2", order: 3,  label: "Chain-of-custody forms stocked",                    type: "pass_fail",   required: true,  requires_photo_on_fail: false, conditional_on: undefined, standard_refs: ["DOT 49 CFR Part 40"] },
  { id: "item-12", checklist_id: "cl-2", order: 4,  label: "BWC case logs up to date",                          type: "yes_no",      required: true,  requires_photo_on_fail: false, conditional_on: undefined, standard_refs: ["Ohio BWC §4123"] },
];

// ── Checklists ────────────────────────────────────────────────────────────────

export const MOCK_CHECKLISTS: (Checklist & { items: ChecklistItem[] })[] = [
  {
    id: "cl-1", name: "Urgent Care Daily Inspection", service_line: "urgent_care",
    version: 3, is_active: true, created_by: "user-admin-1", created_at: "2024-01-01T00:00:00Z",
    items: MOCK_CHECKLIST_ITEMS.filter((i) => i.checklist_id === "cl-1"),
  },
  {
    id: "cl-2", name: "Occupational Health Compliance Check", service_line: "occupational_health",
    version: 2, is_active: true, created_by: "user-admin-1", created_at: "2024-01-01T00:00:00Z",
    items: MOCK_CHECKLIST_ITEMS.filter((i) => i.checklist_id === "cl-2"),
  },
];

// ── Inspections ───────────────────────────────────────────────────────────────

export const MOCK_INSPECTIONS: Inspection[] = [
  { id: "ins-1", location_id: "loc-1", checklist_id: "cl-1", inspector_id: "user-field-1", status: "completed", started_at: "2026-06-09T09:00:00Z", completed_at: "2026-06-09T09:45:00Z", score: 88, responses: [] },
  { id: "ins-2", location_id: "loc-1", checklist_id: "cl-1", inspector_id: "user-field-1", status: "completed", started_at: "2026-06-05T08:30:00Z", completed_at: "2026-06-05T09:10:00Z", score: 75, responses: [] },
  { id: "ins-3", location_id: "loc-2", checklist_id: "cl-1", inspector_id: "user-field-1", status: "completed", started_at: "2026-06-08T10:00:00Z", completed_at: "2026-06-08T10:50:00Z", score: 62, responses: [] },
  { id: "ins-4", location_id: "loc-4", checklist_id: "cl-2", inspector_id: "user-field-1", status: "completed", started_at: "2026-06-07T14:00:00Z", completed_at: "2026-06-07T14:40:00Z", score: 50, responses: [] },
];

// ── Corrective Actions ────────────────────────────────────────────────────────

export const MOCK_ESCALATION_CONFIG: EscalationConfig = {
  id: "esc-cfg-1",
  levels: [
    { level: 1, role: "field_manager",   label: "Field Manager",     hours_to_escalate: 24 },
    { level: 2, role: "auditor",         label: "Site Supervisor",   hours_to_escalate: 48 },
    { level: 3, role: "corporate_admin", label: "Regional Director", hours_to_escalate: 72 },
  ],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

export const MOCK_CORRECTIVE_ACTIONS: CorrectiveAction[] = [
  {
    id: "act-1", inspection_id: "ins-2", location_id: "loc-1", item_id: "item-1",
    description: "Medication fridge temp out of range — check door seal",
    status: "open", assigned_to: "user-field-1", due_date: "2026-06-15",
    created_at: "2026-06-05T09:10:00Z", escalation_level: 1,
    log: [
      { id: "lg-1a", action_id: "act-1", event: "created",  user_name: "System",          note: "Auto-created from failed inspection item.",         timestamp: "2026-06-05T09:10:00Z" },
      { id: "lg-1b", action_id: "act-1", event: "assigned", user_name: "Sarah Mitchell",  note: "Assigned to Field Manager (Level 1).", to_level: 1, timestamp: "2026-06-05T09:10:00Z" },
    ],
  },
  {
    id: "act-2", inspection_id: "ins-3", location_id: "loc-2", item_id: "item-5",
    description: "Sharps container >¾ full in exam room 3",
    status: "overdue", assigned_to: "user-auditor-1", due_date: "2026-06-10",
    created_at: "2026-06-08T10:50:00Z", escalated_at: "2026-06-10T10:50:00Z", escalation_level: 2,
    log: [
      { id: "lg-2a", action_id: "act-2", event: "created",   user_name: "System",         note: "Auto-created from failed inspection item.",         timestamp: "2026-06-08T10:50:00Z" },
      { id: "lg-2b", action_id: "act-2", event: "assigned",  user_name: "Sarah Mitchell", note: "Assigned to Field Manager (Level 1).", to_level: 1, timestamp: "2026-06-08T10:50:00Z" },
      { id: "lg-2c", action_id: "act-2", event: "escalated", user_name: "System (Auto)",  note: "No action taken within 24 hours. Escalated to Site Supervisor.", from_level: 1, to_level: 2, timestamp: "2026-06-10T10:50:00Z" },
    ],
  },
  {
    id: "act-3", inspection_id: "ins-3", location_id: "loc-2", item_id: "item-3",
    description: "PPE stock low — reorder gloves (S/M)",
    status: "in_progress", assigned_to: "user-field-1", due_date: "2026-06-14",
    created_at: "2026-06-08T10:50:00Z", escalation_level: 1,
    log: [
      { id: "lg-3a", action_id: "act-3", event: "created",        user_name: "System",        note: "Auto-created from failed inspection item.",                 timestamp: "2026-06-08T10:50:00Z" },
      { id: "lg-3b", action_id: "act-3", event: "assigned",       user_name: "Sarah Mitchell",note: "Assigned to Field Manager (Level 1).", to_level: 1,        timestamp: "2026-06-08T10:50:00Z" },
      { id: "lg-3c", action_id: "act-3", event: "status_changed", user_name: "James Carter",  note: "Marked In Progress — order placed with vendor.",           timestamp: "2026-06-09T08:30:00Z" },
    ],
  },
  {
    id: "act-4", inspection_id: "ins-4", location_id: "loc-4", item_id: "item-10",
    description: "Breathalyzer calibration expired — schedule service",
    status: "open", assigned_to: "user-field-1", due_date: "2026-06-18",
    created_at: "2026-06-07T14:40:00Z", escalation_level: 1,
    log: [
      { id: "lg-4a", action_id: "act-4", event: "created",  user_name: "System",         note: "Auto-created from failed inspection item.",         timestamp: "2026-06-07T14:40:00Z" },
      { id: "lg-4b", action_id: "act-4", event: "assigned", user_name: "Sarah Mitchell", note: "Assigned to Field Manager (Level 1).", to_level: 1, timestamp: "2026-06-07T14:40:00Z" },
    ],
  },
  {
    id: "act-5", inspection_id: "ins-4", location_id: "loc-4", item_id: "item-9",
    description: "DOT drug test kits expired — immediate replacement required",
    status: "overdue", assigned_to: "user-admin-1", due_date: "2026-06-05",
    created_at: "2026-06-01T10:00:00Z", escalated_at: "2026-06-07T10:00:00Z", escalation_level: 3,
    log: [
      { id: "lg-5a", action_id: "act-5", event: "created",   user_name: "System",        note: "Auto-created from failed inspection item.",                                    timestamp: "2026-06-01T10:00:00Z" },
      { id: "lg-5b", action_id: "act-5", event: "assigned",  user_name: "Sarah Mitchell",note: "Assigned to Field Manager (Level 1).", to_level: 1,                           timestamp: "2026-06-01T10:00:00Z" },
      { id: "lg-5c", action_id: "act-5", event: "escalated", user_name: "System (Auto)", note: "No action within 24 hours. Escalated to Site Supervisor.", from_level: 1, to_level: 2, timestamp: "2026-06-02T10:00:00Z" },
      { id: "lg-5d", action_id: "act-5", event: "escalated", user_name: "System (Auto)", note: "No action within 48 hours. FINAL ESCALATION to Regional Director.", from_level: 2, to_level: 3, timestamp: "2026-06-07T10:00:00Z" },
    ],
  },
];

// ── Training ──────────────────────────────────────────────────────────────────

const BBP_QUESTIONS: TrainingQuestion[] = [
  { id: "q-1-1", module_id: "tm-1", order: 1, question: "Which OSHA standard governs Bloodborne Pathogens training?", options: ["29 CFR 1910.132", "29 CFR 1910.1030", "29 CFR 1904.35", "29 CFR 1910.145"], correct_index: 1, explanation: "OSHA 29 CFR 1910.1030 is the Bloodborne Pathogens standard requiring annual training for at-risk employees." },
  { id: "q-1-2", module_id: "tm-1", order: 2, question: "What is the first action after a needlestick injury?", options: ["Complete an incident report", "Notify your supervisor", "Wash the area with soap and water", "Apply a bandage and continue working"], correct_index: 2, explanation: "Immediately wash with soap and water, then report the incident." },
  { id: "q-1-3", module_id: "tm-1", order: 3, question: "Standard Precautions require treating which patients as potentially infectious?", options: ["Only patients with known infections", "Patients with visible symptoms only", "All patients regardless of diagnosis", "Only immunocompromised patients"], correct_index: 2, explanation: "Standard Precautions apply to ALL patients — you cannot rely on visible symptoms." },
  { id: "q-1-4", module_id: "tm-1", order: 4, question: "Which of the following is NOT a Bloodborne Pathogen?", options: ["HIV", "Hepatitis B (HBV)", "Influenza A", "Hepatitis C (HCV)"], correct_index: 2, explanation: "Influenza A is airborne, not bloodborne. HIV, HBV, and HCV are all bloodborne pathogens." },
];

const IC_QUESTIONS: TrainingQuestion[] = [
  { id: "q-4-1", module_id: "tm-4", order: 1, question: "How long should you wash hands with soap and water per CDC guidelines?", options: ["5 seconds", "10 seconds", "20 seconds", "60 seconds"], correct_index: 2, explanation: "CDC recommends at least 20 seconds — roughly the time to sing Happy Birthday twice." },
  { id: "q-4-2", module_id: "tm-4", order: 2, question: "When is alcohol-based hand rub NOT sufficient and soap/water required?", options: ["Before patient contact", "After glove removal", "When hands are visibly soiled", "Between patient rooms"], correct_index: 2, explanation: "Soap and water must be used when hands are visibly dirty or contaminated." },
  { id: "q-4-3", module_id: "tm-4", order: 3, question: "Which Joint Commission standard covers Infection Prevention and Control?", options: ["EC.02.06.01", "IC.02.02.01", "NPSG.07.01.01", "RC.02.01.01"], correct_index: 2, explanation: "NPSG.07.01.01 is the National Patient Safety Goal for hand hygiene compliance." },
];

const DOT_QUESTIONS: TrainingQuestion[] = [
  { id: "q-2-1", module_id: "tm-2", order: 1, question: "How often must DOT drug/alcohol collectors be recertified?", options: ["Every 6 months", "Annually", "Every 2 years", "Every 5 years"], correct_index: 1, explanation: "DOT collectors must complete refresher training and recertification annually." },
  { id: "q-2-2", module_id: "tm-2", order: 2, question: "Which federal regulation governs DOT workplace drug testing?", options: ["49 CFR Part 40", "29 CFR 1910.1030", "21 CFR Part 11", "45 CFR Part 164"], correct_index: 0, explanation: "49 CFR Part 40 sets DOT procedures for transportation workplace drug and alcohol testing." },
  { id: "q-2-3", module_id: "tm-2", order: 3, question: "What document must accompany every DOT urine specimen?", options: ["Employee consent form", "Chain-of-custody form", "Medical examination report", "Lab requisition slip"], correct_index: 1, explanation: "A chain-of-custody form (CCF) documents every step of the specimen collection and testing process." },
];

const GLP_QUESTIONS: TrainingQuestion[] = [
  { id: "q-3-1", module_id: "tm-3", order: 1, question: "What is the required storage temperature range for GLP-1 injectables?", options: ["15–25°C (room temp)", "2–8°C (refrigerator)", "-20°C (freezer)", "0–2°C (near freezing)"], correct_index: 1, explanation: "GLP-1 medications must be refrigerated at 2–8°C until dispensed. Never freeze." },
  { id: "q-3-2", module_id: "tm-3", order: 2, question: "How long can GLP-1 pens typically remain at room temperature after first use?", options: ["24 hours", "3 days", "Up to 30 days (product-dependent)", "Indefinitely if capped"], correct_index: 2, explanation: "Most GLP-1 pens are stable at room temperature for up to 30 days after first use — verify per product PI." },
  { id: "q-3-3", module_id: "tm-3", order: 3, question: "What action should you take if a GLP-1 medication was left unrefrigerated overnight?", options: ["Use it immediately to avoid further exposure", "Return to refrigerator and use within 24 hours", "Quarantine and check with pharmacy/manufacturer", "Discard immediately without documentation"], correct_index: 2, explanation: "Quarantine the product, document the incident, and consult pharmacy or the manufacturer's guidelines before use or disposal." },
];

export const MOCK_TRAINING_MODULES: TrainingModule[] = [
  {
    id: "tm-1", title: "Bloodborne Pathogens Annual",
    description: "OSHA-required BBP training for all clinical staff.",
    service_lines: ["urgent_care","occupational_health","primary_care"],
    duration_minutes: 45, cert_validity_days: 365, qr_code: "https://example.com/qr/bbp",
    content_url: "https://example.com/bbp", content_type: "video",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    pass_threshold: 80,
    content: "Bloodborne pathogens (BBP) are microorganisms present in human blood that can cause serious disease. The three primary BBPs are HIV, Hepatitis B (HBV), and Hepatitis C (HCV).\n\nOSHA Standard 29 CFR 1910.1030 requires annual training for all employees with reasonably anticipated exposure.\n\nStandard Precautions: Treat ALL blood and body fluids as potentially infectious — regardless of patient diagnosis.\n\nRequired PPE: Gloves for any contact with blood or body fluids. Add face shield, gown, and mask when splatter is possible.\n\nNeedlestick Protocol:\n1. Wash with soap and water immediately\n2. Do not squeeze or suck the wound\n3. Report to supervisor and complete incident report\n4. Seek medical evaluation within 2 hours",
    questions: BBP_QUESTIONS,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "tm-2", title: "DOT Collector Recertification",
    description: "Recertification for drug/alcohol test collectors.",
    service_lines: ["occupational_health"],
    duration_minutes: 60, cert_validity_days: 365, qr_code: "https://example.com/qr/dot",
    content_url: "https://example.com/dot", content_type: "slides",
    pass_threshold: 75,
    content: "DOT Collector Certification is required under 49 CFR Part 40 for all personnel performing DOT-mandated drug and alcohol testing.\n\nKey Responsibilities:\n• Verify donor identity with photo ID\n• Ensure chain-of-custody form (CCF) is complete and accurate\n• Maintain direct observation protocols when required\n• Never leave a specimen unattended after collection\n\nBreathalyzer Calibration:\nCalibration records must be current (within 12 months). Expired calibration = test is invalid.\n\nCommon Errors to Avoid:\n• Missing or incorrect employee info on CCF\n• Incorrect collection temperature (must be 90–100°F within 4 min)\n• Broken or missing security seals on bottles",
    questions: DOT_QUESTIONS,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "tm-3", title: "GLP-1 Cold Chain Handling",
    description: "Proper storage and handling of GLP-1 injectables.",
    service_lines: ["vibrance_wellness"],
    duration_minutes: 30, cert_validity_days: 180, qr_code: null,
    content_url: "https://example.com/glp", content_type: "pdf",
    pass_threshold: 75,
    content: "GLP-1 receptor agonists (semaglutide, tirzepatide, liraglutide) require strict cold-chain management to maintain efficacy and patient safety.\n\nStorage Requirements:\n• Unopened: Refrigerate at 2–8°C (36–46°F)\n• Never freeze — freezing permanently damages the medication\n• Keep away from direct sunlight and heat sources\n\nAfter First Use:\n• Most pens: stable at room temp (up to 25°C/77°F) for up to 30 days\n• Always verify per product Prescribing Information (PI)\n• Mark date of first use on pen cap\n\nCold Chain Breach Protocol:\n1. Remove product from service immediately\n2. Document: product name, lot #, duration out of range, temperature\n3. Quarantine and contact pharmacy\n4. Do NOT dispense until pharmacist clears the product\n\nFridge Monitoring:\n• Log temperatures twice daily\n• Alert threshold: <2°C or >8°C for more than 15 minutes",
    questions: GLP_QUESTIONS,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "tm-4", title: "Infection Control & Hand Hygiene",
    description: "Joint Commission IC standards and hand hygiene protocols.",
    service_lines: ["urgent_care","primary_care","clinical_research"],
    duration_minutes: 20, cert_validity_days: 365, qr_code: "https://example.com/qr/ic",
    content_url: "https://example.com/ic", content_type: "video",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    pass_threshold: 80,
    content: "Infection prevention is the single most effective way to reduce healthcare-associated infections (HAIs). Hand hygiene compliance is monitored under Joint Commission NPSG.07.01.01.\n\nThe 5 Moments for Hand Hygiene (WHO):\n1. Before touching a patient\n2. Before a clean/aseptic procedure\n3. After body fluid exposure risk\n4. After touching a patient\n5. After touching patient surroundings\n\nSoap & Water vs. Alcohol Rub:\n• Alcohol-based hand rub (ABHR): preferred for most clinical situations\n• Soap and water REQUIRED when: hands are visibly soiled, after C. diff contact, before eating\n• Minimum 20 seconds for soap/water wash\n\nPPE Donning/Doffing Order:\nDon: gown → gloves → mask → eye protection\nDoff: gloves → eye protection → gown → mask (wash hands between each step)\n\nEnvironmental Cleaning:\n• High-touch surfaces disinfected between every patient\n• Use EPA-registered disinfectants per product dwell time",
    questions: IC_QUESTIONS,
    created_at: "2024-01-01T00:00:00Z",
  },
];

export const MOCK_TRAINING_COMPLETIONS: TrainingCompletion[] = [
  { id: "tc-1", user_id: "user-field-1",   module_id: "tm-1", location_id: "loc-1", completed_by_name: "Amy Torres",   completed_at: "2026-01-15T00:00:00Z", cert_expires_at: "2027-01-15T00:00:00Z", score: 92 },
  { id: "tc-2", user_id: "user-auditor-1", module_id: "tm-1", location_id: "loc-2", completed_by_name: "Brian Lee",    completed_at: "2025-12-01T00:00:00Z", cert_expires_at: "2026-06-28T00:00:00Z", score: 85 },
  { id: "tc-3", user_id: "user-auditor-1", module_id: "tm-2", location_id: "loc-1", completed_by_name: "Carol Diaz",   completed_at: "2025-11-20T00:00:00Z", cert_expires_at: "2026-06-20T00:00:00Z", score: 78 },
  { id: "tc-4", user_id: "user-field-1",   module_id: "tm-4", location_id: "loc-3", completed_by_name: "David Nguyen", completed_at: "2026-03-10T00:00:00Z", cert_expires_at: "2027-03-10T00:00:00Z", score: 96 },
];

// ── Inspection Responses ─────────────────────────────────────────────────────
// Each row mirrors what the field inspector recorded per checklist item.
// checklist_items is pre-embedded so the mock join resolver can return it.

export const MOCK_INSPECTION_RESPONSES = [
  // ins-1: West Market · Jun 9 · 88% (7 pass, 1 fail out of 8)
  { id: "r-1-1", inspection_id: "ins-1", item_id: "item-1", passed: true,  value: "41°F",  notes: undefined, photo_url: undefined, checklist_items: { label: "Medication fridge temp 35–46°F",         type: "temperature" } },
  { id: "r-1-2", inspection_id: "ins-1", item_id: "item-2", passed: false, value: "48°F",  notes: "Slightly above range — reported to facility manager, corrective steps initiated", photo_url: undefined, checklist_items: { label: "Vaccine fridge temp 35–46°F",            type: "temperature" } },
  { id: "r-1-3", inspection_id: "ins-1", item_id: "item-3", passed: true,  value: "Pass",  notes: undefined, photo_url: undefined, checklist_items: { label: "PPE stock (gloves, masks, gowns) adequate", type: "pass_fail"   } },
  { id: "r-1-4", inspection_id: "ins-1", item_id: "item-4", passed: true,  value: "Pass",  notes: undefined, photo_url: undefined, checklist_items: { label: "Exam rooms cleaned & disinfected",         type: "pass_fail"   } },
  { id: "r-1-5", inspection_id: "ins-1", item_id: "item-5", passed: true,  value: "Pass",  notes: undefined, photo_url: undefined, checklist_items: { label: "Sharps containers <¾ full",                 type: "pass_fail"   } },
  { id: "r-1-6", inspection_id: "ins-1", item_id: "item-6", passed: true,  value: "Yes",   notes: undefined, photo_url: undefined, checklist_items: { label: "Autoclave log current (last cycle <24 hrs)", type: "yes_no"      } },
  { id: "r-1-7", inspection_id: "ins-1", item_id: "item-7", passed: true,  value: "Pass",  notes: undefined, photo_url: undefined, checklist_items: { label: "Lab equipment calibration stickers current",  type: "pass_fail"   } },
  { id: "r-1-8", inspection_id: "ins-1", item_id: "item-8", passed: true,  value: "Pass",  notes: undefined, photo_url: undefined, checklist_items: { label: "EKG machine functional test passed",         type: "pass_fail"   } },

  // ins-2: West Market · Jun 5 · 75% (6 pass, 2 fail out of 8)
  { id: "r-2-1", inspection_id: "ins-2", item_id: "item-1", passed: false, value: "50°F",  notes: "Door seal may be failing — corrective action raised", photo_url: undefined, checklist_items: { label: "Medication fridge temp 35–46°F",         type: "temperature" } },
  { id: "r-2-2", inspection_id: "ins-2", item_id: "item-2", passed: true,  value: "38°F",  notes: undefined, photo_url: undefined, checklist_items: { label: "Vaccine fridge temp 35–46°F",            type: "temperature" } },
  { id: "r-2-3", inspection_id: "ins-2", item_id: "item-3", passed: true,  value: "Pass",  notes: undefined, photo_url: undefined, checklist_items: { label: "PPE stock (gloves, masks, gowns) adequate", type: "pass_fail"   } },
  { id: "r-2-4", inspection_id: "ins-2", item_id: "item-4", passed: true,  value: "Pass",  notes: undefined, photo_url: undefined, checklist_items: { label: "Exam rooms cleaned & disinfected",         type: "pass_fail"   } },
  { id: "r-2-5", inspection_id: "ins-2", item_id: "item-5", passed: true,  value: "Pass",  notes: undefined, photo_url: undefined, checklist_items: { label: "Sharps containers <¾ full",                 type: "pass_fail"   } },
  { id: "r-2-6", inspection_id: "ins-2", item_id: "item-6", passed: true,  value: "Yes",   notes: undefined, photo_url: undefined, checklist_items: { label: "Autoclave log current (last cycle <24 hrs)", type: "yes_no"      } },
  { id: "r-2-7", inspection_id: "ins-2", item_id: "item-7", passed: false, value: "Fail",  notes: "Calibration sticker on centrifuge expired 2026-05-20", photo_url: undefined, checklist_items: { label: "Lab equipment calibration stickers current",  type: "pass_fail"   } },
  { id: "r-2-8", inspection_id: "ins-2", item_id: "item-8", passed: true,  value: "Pass",  notes: undefined, photo_url: undefined, checklist_items: { label: "EKG machine functional test passed",         type: "pass_fail"   } },

  // ins-3: Fairlawn · Jun 8 · 62% (5 pass, 3 fail out of 8)
  { id: "r-3-1", inspection_id: "ins-3", item_id: "item-1", passed: true,  value: "43°F",  notes: undefined, photo_url: undefined, checklist_items: { label: "Medication fridge temp 35–46°F",         type: "temperature" } },
  { id: "r-3-2", inspection_id: "ins-3", item_id: "item-2", passed: true,  value: "40°F",  notes: undefined, photo_url: undefined, checklist_items: { label: "Vaccine fridge temp 35–46°F",            type: "temperature" } },
  { id: "r-3-3", inspection_id: "ins-3", item_id: "item-3", passed: false, value: "Fail",  notes: "Gloves (S) and N95 masks below reorder threshold", photo_url: undefined, checklist_items: { label: "PPE stock (gloves, masks, gowns) adequate", type: "pass_fail"   } },
  { id: "r-3-4", inspection_id: "ins-3", item_id: "item-4", passed: true,  value: "Pass",  notes: undefined, photo_url: undefined, checklist_items: { label: "Exam rooms cleaned & disinfected",         type: "pass_fail"   } },
  { id: "r-3-5", inspection_id: "ins-3", item_id: "item-5", passed: false, value: "Fail",  notes: "Container in Exam Room 3 is >¾ full — needs immediate swap", photo_url: undefined, checklist_items: { label: "Sharps containers <¾ full",                 type: "pass_fail"   } },
  { id: "r-3-6", inspection_id: "ins-3", item_id: "item-6", passed: true,  value: "Yes",   notes: undefined, photo_url: undefined, checklist_items: { label: "Autoclave log current (last cycle <24 hrs)", type: "yes_no"      } },
  { id: "r-3-7", inspection_id: "ins-3", item_id: "item-7", passed: false, value: "Fail",  notes: "Centrifuge sticker expired 2026-05-15, blood analyzer due 2026-06-01", photo_url: undefined, checklist_items: { label: "Lab equipment calibration stickers current",  type: "pass_fail"   } },
  { id: "r-3-8", inspection_id: "ins-3", item_id: "item-8", passed: true,  value: "Pass",  notes: undefined, photo_url: undefined, checklist_items: { label: "EKG machine functional test passed",         type: "pass_fail"   } },

  // ins-4: Beachwood Occ Health · Jun 7 · 50% (2 pass, 2 fail out of 4)
  { id: "r-4-1", inspection_id: "ins-4", item_id: "item-9",  passed: false, value: "Fail", notes: "DOT kits expired 2026-06-01 — emergency replacement ordered", photo_url: undefined, checklist_items: { label: "DOT drug test kits not expired",                type: "pass_fail" } },
  { id: "r-4-2", inspection_id: "ins-4", item_id: "item-10", passed: false, value: "No",   notes: "Last calibrated 2025-05-10 — 13 months ago, overdue by 1 month", photo_url: undefined, checklist_items: { label: "Breathalyzer calibration current (<12 months)", type: "yes_no"    } },
  { id: "r-4-3", inspection_id: "ins-4", item_id: "item-11", passed: true,  value: "Pass", notes: undefined, photo_url: undefined, checklist_items: { label: "Chain-of-custody forms stocked",              type: "pass_fail" } },
  { id: "r-4-4", inspection_id: "ins-4", item_id: "item-12", passed: true,  value: "Yes",  notes: undefined, photo_url: undefined, checklist_items: { label: "BWC case logs up to date",                    type: "yes_no"    } },
];

// ── Inquiries ─────────────────────────────────────────────────────────────────

export const MOCK_INQUIRIES: Inquiry[] = [
  { id: "inq-1", name: "Dr. Rachel Kim",    email: "rkim@meridianhealth.com",   phone: "(614) 555-0182", organization: "Meridian Health Group",   location_count: "12", message: "We operate 12 urgent care sites in Ohio and need a compliance tracking solution. Very interested in your inspection and training modules.", status: "new",       submitted_at: "2026-06-10T14:23:00Z" },
  { id: "inq-2", name: "Tom Walters",       email: "twalters@fastcareohio.com", phone: "(330) 555-0247", organization: "FastCare Ohio",            location_count: "5",  message: "Looking to replace our paper-based inspection process. Do you support DOT drug testing workflows?", status: "contacted", submitted_at: "2026-06-08T09:11:00Z" },
  { id: "inq-3", name: "Maria Santos",      email: "msantos@premiermed.org",    phone: "(513) 555-0319", organization: "Premier Med Centers",      location_count: "8",  message: "Interested in the training certification feature. We have OSHA compliance requirements across all locations.", status: "new",       submitted_at: "2026-06-07T16:45:00Z" },
  { id: "inq-4", name: "James Holloway",    email: "jholloway@clinicpro.net",   phone: "",               organization: "ClinicPro Networks",       location_count: "20+",message: "Enterprise inquiry — we have 20+ locations across 3 states. Need multi-region support and custom reporting.", status: "contacted", submitted_at: "2026-06-05T11:30:00Z" },
  { id: "inq-5", name: "Lisa Tran",         email: "ltran@swifturgentcare.com", phone: "(937) 555-0461", organization: "Swift Urgent Care",        location_count: "3",  message: "Small group, 3 locations in Dayton area. Looking for an affordable solution to manage daily inspections.", status: "closed",    submitted_at: "2026-06-03T08:55:00Z" },
];
