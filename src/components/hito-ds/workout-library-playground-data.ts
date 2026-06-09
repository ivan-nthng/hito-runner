import type {
  HitoCalendarDayResultState,
  HitoCalendarFeedbackState,
  HitoCalendarWorkoutIdentity,
} from "@/components/ui/hito-calendar-day";
import type { CanonicalWorkoutFamily, CanonicalWorkoutIdentity } from "@/lib/rich-workout-model";

export type WorkoutLibraryProviderState =
  | "none"
  | "garmin_evidence_attached"
  | "garmin_feedback_ready"
  | "future_strava_attached"
  | "future_provider_comparison_ready";

export type WorkoutLibraryResultState = Exclude<HitoCalendarDayResultState, "none">;
export type WorkoutLibraryDetailDensity = "compact" | "full";
export type WorkoutLibraryViewMode = "desktop" | "mobile";
export type WorkoutLibraryFamilyFilter = "all" | CanonicalWorkoutFamily;
export type WorkoutLibraryTargetTruthMode = "none" | "structure_only" | "editable_default_hr";

export type WorkoutLibraryOption<T extends string> = {
  value: T;
  label: string;
};

type WorkoutLibrarySegmentCode =
  | "WU"
  | "OP"
  | "SUP"
  | "MAIN"
  | "WORK"
  | "REC"
  | "CHK"
  | "FIN"
  | "CD"
  | "END";

export type WorkoutLibrarySegment = {
  code: WorkoutLibrarySegmentCode;
  label: string;
  prescription: string;
  cue: string;
};

export type WorkoutLibrarySpecimen = {
  identity: CanonicalWorkoutIdentity;
  family: CanonicalWorkoutFamily;
  displayLabel: string;
  calendarLabel: string;
  detailTitle: string;
  purpose: string;
  sequence: string;
  segments: WorkoutLibrarySegment[];
  targetTruthMode: WorkoutLibraryTargetTruthMode;
  editableDefaultHrNote: string | null;
  allowedProviderStates: readonly WorkoutLibraryProviderState[];
  resultStates: readonly WorkoutLibraryResultState[];
  proves: string;
  mustNotImply: string;
  date: {
    day: string;
    month: "Jun" | "Jul";
    weekday: string;
  };
  workout: HitoCalendarWorkoutIdentity;
};

export type WorkoutLibraryState = {
  providerState: WorkoutLibraryProviderState;
  resultState: WorkoutLibraryResultState;
  detailDensity: WorkoutLibraryDetailDensity;
  viewMode: WorkoutLibraryViewMode;
  familyFilter: WorkoutLibraryFamilyFilter;
};

const ALL_PROVIDER_STATES = [
  "none",
  "garmin_evidence_attached",
  "garmin_feedback_ready",
  "future_strava_attached",
  "future_provider_comparison_ready",
] as const satisfies readonly WorkoutLibraryProviderState[];

const REST_PROVIDER_STATES = [
  "none",
  "garmin_evidence_attached",
  "future_strava_attached",
] as const satisfies readonly WorkoutLibraryProviderState[];

const ALL_RESULT_STATES = [
  "planned",
  "completed",
  "partial",
  "skipped",
] as const satisfies readonly WorkoutLibraryResultState[];

const REST_RESULT_STATES = [
  "planned",
  "skipped",
] as const satisfies readonly WorkoutLibraryResultState[];
const ENDPOINT_RESULT_STATES = [
  "planned",
  "completed",
  "partial",
] as const satisfies readonly WorkoutLibraryResultState[];

export const PROVIDER_STATE_OPTIONS: Array<WorkoutLibraryOption<WorkoutLibraryProviderState>> = [
  { value: "none", label: "None" },
  { value: "garmin_evidence_attached", label: "Garmin evidence" },
  { value: "garmin_feedback_ready", label: "Garmin feedback" },
  { value: "future_strava_attached", label: "Strava future" },
  { value: "future_provider_comparison_ready", label: "Provider compare future" },
];

export const RESULT_STATE_OPTIONS: Array<WorkoutLibraryOption<WorkoutLibraryResultState>> = [
  { value: "planned", label: "Planned" },
  { value: "completed", label: "Completed" },
  { value: "partial", label: "Partial" },
  { value: "skipped", label: "Skipped" },
];

export const DETAIL_DENSITY_OPTIONS: Array<WorkoutLibraryOption<WorkoutLibraryDetailDensity>> = [
  { value: "compact", label: "Compact" },
  { value: "full", label: "Full segments" },
];

export const VIEW_MODE_OPTIONS: Array<WorkoutLibraryOption<WorkoutLibraryViewMode>> = [
  { value: "desktop", label: "Desktop" },
  { value: "mobile", label: "Mobile" },
];

export const FAMILY_FILTER_OPTIONS: Array<WorkoutLibraryOption<WorkoutLibraryFamilyFilter>> = [
  { value: "all", label: "All families" },
  { value: "rest", label: "Rest" },
  { value: "recovery", label: "Recovery" },
  { value: "easy", label: "Easy" },
  { value: "steady", label: "Steady" },
  { value: "long", label: "Long" },
  { value: "tempo", label: "Tempo" },
  { value: "intervals", label: "Intervals" },
  { value: "progression", label: "Progression" },
  { value: "race", label: "Race" },
  { value: "hills", label: "Hills" },
  { value: "trail", label: "Trail" },
];

export const DEFAULT_WORKOUT_LIBRARY_STATE: WorkoutLibraryState = {
  providerState: "none",
  resultState: "planned",
  detailDensity: "compact",
  viewMode: "desktop",
  familyFilter: "all",
};

export const PROVIDER_STATE_COPY: Record<
  WorkoutLibraryProviderState,
  { label: string; detail: string; future: boolean; feedback: HitoCalendarFeedbackState }
> = {
  none: {
    label: "No evidence",
    detail: "Static specimen only; no provider input is attached.",
    future: false,
    feedback: "none",
  },
  garmin_evidence_attached: {
    label: "Garmin evidence attached",
    detail: "Current product language for an attached Garmin activity specimen.",
    future: false,
    feedback: "evidence_attached",
  },
  garmin_feedback_ready: {
    label: "Garmin feedback ready",
    detail: "Current product language for deterministic comparison-ready readback.",
    future: false,
    feedback: "feedback_ready",
  },
  future_strava_attached: {
    label: "Strava activity attached",
    detail: "Future/specimen-only provider state. No real Strava sync is implied.",
    future: true,
    feedback: "evidence_attached",
  },
  future_provider_comparison_ready: {
    label: "Provider comparison ready",
    detail: "Future/specimen-only comparison state. No real comparison rows are created.",
    future: true,
    feedback: "feedback_ready",
  },
};

export const TARGET_TRUTH_MODE_COPY: Record<WorkoutLibraryTargetTruthMode, string> = {
  none: "No executable run target.",
  structure_only: "Executable structure only; no fake pace or personal HR.",
  editable_default_hr: "Editable default HR guidance only; not personal HR truth.",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function fakeDate(index: number): WorkoutLibrarySpecimen["date"] {
  const dayNumber = index + 1;
  return {
    day: String(dayNumber <= 30 ? dayNumber : dayNumber - 30),
    month: dayNumber <= 30 ? "Jun" : "Jul",
    weekday: WEEKDAYS[index % WEEKDAYS.length],
  };
}

function identity(
  label: string,
  short: string,
  color: string,
  glyph: HitoCalendarWorkoutIdentity["glyph"],
): HitoCalendarWorkoutIdentity {
  return { label, short, color, glyph };
}

function segment(
  code: WorkoutLibrarySegmentCode,
  label: string,
  prescription: string,
  cue: string,
): WorkoutLibrarySegment {
  return { code, label, prescription, cue };
}

const rows = [
  {
    identity: "rest_and_recovery",
    family: "rest",
    displayLabel: "Rest and recovery",
    calendarLabel: "Rest",
    detailTitle: "Rest and recovery day",
    purpose: "Show a true no-run day.",
    sequence: "none",
    segments: [] as WorkoutLibrarySegment[],
    targetTruthMode: "none",
    editableDefaultHrNote: null,
    allowedProviderStates: REST_PROVIDER_STATES,
    resultStates: REST_RESULT_STATES,
    proves: "Rest cells and quiet detail state exist.",
    mustNotImply: "A hidden run, provider compare, or active recovery workout.",
    workout: identity("Rest and recovery", "Rest", "var(--color-muted-foreground)", "rest"),
  },
  {
    identity: "recovery_jog",
    family: "recovery",
    displayLabel: "Recovery jog",
    calendarLabel: "Recovery",
    detailTitle: "Recovery jog",
    purpose: "Very light post-load aerobic reset.",
    sequence: "OP -> MAIN -> CD",
    segments: [
      segment("OP", "Opener", "5 min easy", "Softer than normal easy."),
      segment("MAIN", "Main", "20-30 min easy", "Finish fresher than you started."),
      segment("CD", "Cooldown", "5 min easy", "Let the legs settle."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote:
      "Optional product copy may mention an editable default cap only as secondary.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Recovery identity is distinct from easy.",
    mustNotImply: "Hard recovery, fake pace, or personal HR truth.",
    workout: identity("Recovery jog", "Recovery", "var(--easy)", "recovery"),
  },
  {
    identity: "easy_aerobic_run",
    family: "easy",
    displayLabel: "Easy aerobic run",
    calendarLabel: "Easy",
    detailTitle: "Easy aerobic run",
    purpose: "Conversational aerobic support.",
    sequence: "WU -> MAIN -> CD",
    segments: [
      segment("WU", "Warmup", "10 min", "Settle gradually."),
      segment("MAIN", "Main", "30-45 min easy", "Keep a conversational rhythm."),
      segment("CD", "Cooldown", "5 min", "Finish controlled."),
    ],
    targetTruthMode: "editable_default_hr",
    editableDefaultHrNote: "Editable default HR cap, not personal HR truth.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Standard easy-run anatomy and default-HR readback.",
    mustNotImply: "Target-time pace or personalized HR.",
    workout: identity("Easy aerobic run", "Easy", "var(--easy)", "easy"),
  },
  {
    identity: "cutback_aerobic_run",
    family: "easy",
    displayLabel: "Cutback aerobic run",
    calendarLabel: "Cutback",
    detailTitle: "Cutback aerobic run",
    purpose: "Lighter support day in reduced-load week.",
    sequence: "WU -> MAIN -> FIN -> CD",
    segments: [
      segment("WU", "Warmup", "8-10 min", "Keep the start light."),
      segment("MAIN", "Main", "20-35 min reduced easy", "Clearly lighter than prior support day."),
      segment("FIN", "Finish", "3 min settle", "No intensity hidden in the close."),
      segment("CD", "Cooldown", "5 min", "End fresh."),
    ],
    targetTruthMode: "editable_default_hr",
    editableDefaultHrNote: "Editable default HR cap, not personal HR truth.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Cutback easy differs from generic easy.",
    mustNotImply: "Hidden intensity or volume peak.",
    workout: identity("Cutback aerobic run", "Cutback", "var(--easy)", "easy"),
  },
  {
    identity: "easy_run_with_strides",
    family: "easy",
    displayLabel: "Easy run with strides",
    calendarLabel: "Strides",
    detailTitle: "Easy run with strides",
    purpose: "Neuromuscular sharpening without hard quality.",
    sequence: "WU -> SUP -> WORK -> REC -> CD",
    segments: [
      segment("WU", "Warmup", "10 min", "Easy first."),
      segment("SUP", "Support", "10-20 min easy", "Keep the aerobic support relaxed."),
      segment("WORK", "Work", "4-8 x 20 sec", "Quick feet, relaxed body."),
      segment("REC", "Recovery", "60 sec easy jog", "Fully reset before each stride."),
      segment("CD", "Cooldown", "5 min", "Finish easy."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Stride anatomy and repeat readback.",
    mustNotImply: "Formal interval session or fake pace target.",
    workout: identity("Easy run with strides", "Strides", "var(--easy)", "quality"),
  },
  {
    identity: "steady_aerobic_run",
    family: "steady",
    displayLabel: "Steady aerobic run",
    calendarLabel: "Steady",
    detailTitle: "Steady aerobic run",
    purpose: "Moderate durable aerobic support.",
    sequence: "WU -> MAIN -> FIN -> CD",
    segments: [
      segment("WU", "Warmup", "10 min", "Ease toward the work."),
      segment("MAIN", "Main", "25-45 min steady", "Controlled, not pressing."),
      segment("FIN", "Finish", "5 min controlled settle", "Smoothly back off."),
      segment("CD", "Cooldown", "5 min", "Leave a little in reserve."),
    ],
    targetTruthMode: "editable_default_hr",
    editableDefaultHrNote: "Default HR guidance is editable and advisory.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Steady reads differently from easy.",
    mustNotImply: "Race-pace precision or threshold overclaim.",
    workout: identity("Steady aerobic run", "Steady", "var(--easy)", "steady"),
  },
  {
    identity: "marathon_steady_specificity",
    family: "steady",
    displayLabel: "Marathon steady",
    calendarLabel: "Marathon",
    detailTitle: "Marathon steady specificity",
    purpose: "Marathon-specific durability, not tempo.",
    sequence: "WU -> MAIN -> CHK -> FIN -> CD",
    segments: [
      segment("WU", "Warmup", "10 min", "Calm start."),
      segment("MAIN", "Main", "35-60 min durable steady", "Durable composure, never forced."),
      segment("CHK", "Checkpoint", "3 min posture/fueling", "Check form and fueling."),
      segment("FIN", "Finish", "5 min controlled", "Do not race the finish."),
      segment("CD", "Cooldown", "5-8 min", "Let effort unwind."),
    ],
    targetTruthMode: "editable_default_hr",
    editableDefaultHrNote: "Default HR guidance is editable and advisory.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Marathon-specific steady identity exists.",
    mustNotImply: "Full-race readiness, tempo hardness, or target-time pace.",
    workout: identity("Marathon steady", "Marathon", "var(--easy)", "steady"),
  },
  {
    identity: "long_aerobic_run",
    family: "long",
    displayLabel: "Long aerobic run",
    calendarLabel: "Long",
    detailTitle: "Long aerobic run",
    purpose: "Core endurance and durability.",
    sequence: "OP -> MAIN -> CHK -> FIN -> CD",
    segments: [
      segment("OP", "Opener", "10 min", "Patient start."),
      segment("MAIN", "Main", "60-120 min easy", "Durable, not rushed."),
      segment("CHK", "Checkpoint", "3-5 min fueling/posture", "Check fueling and posture."),
      segment("FIN", "Finish", "5 min easy settle", "Stay relaxed."),
      segment("CD", "Cooldown", "5 min", "Close gently."),
    ],
    targetTruthMode: "editable_default_hr",
    editableDefaultHrNote: "Editable default HR guidance only; not personal HR truth.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Long run is not an anonymous one-block shell.",
    mustNotImply: "Race effort, hidden fast finish, or fake pace.",
    workout: identity("Long aerobic run", "Long", "var(--long)", "long"),
  },
  {
    identity: "long_run_with_steady_finish",
    family: "long",
    displayLabel: "Long run with steady finish",
    calendarLabel: "Long finish",
    detailTitle: "Long run with steady finish",
    purpose: "Long-run specificity with controlled closing segment.",
    sequence: "OP -> MAIN -> CHK -> FIN -> CD",
    segments: [
      segment("OP", "Opener", "10 min", "Start patient."),
      segment("MAIN", "Main", "60-90 min easy", "Keep the long body calm."),
      segment("CHK", "Checkpoint", "3 min fueling", "Fuel before the finish."),
      segment("FIN", "Finish", "15-25 min steady", "Hold form through the close, not race."),
      segment("CD", "Cooldown", "5 min", "Back down fully."),
    ],
    targetTruthMode: "editable_default_hr",
    editableDefaultHrNote:
      "Easy and finish blocks may both use editable default guidance visually.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Distinct long-run finish structure.",
    mustNotImply: "Threshold finish, race simulation, or exact pace.",
    workout: identity("Long run with steady finish", "Long finish", "var(--long)", "long"),
  },
  {
    identity: "base_endpoint_marker",
    family: "long",
    displayLabel: "Base endpoint",
    calendarLabel: "Base end",
    detailTitle: "Base endpoint marker",
    purpose: "Honest durability closeout for base block.",
    sequence: "WU -> MAIN -> FIN -> CD",
    segments: [
      segment("WU", "Warmup", "10 min", "Ease in."),
      segment("MAIN", "Main", "40-60 min durable steady", "Finish durable, not depleted."),
      segment("FIN", "Finish", "5 min settle", "Return to control."),
      segment("CD", "Cooldown", "5-10 min easy", "Cool down completely."),
    ],
    targetTruthMode: "editable_default_hr",
    editableDefaultHrNote: "Editable default HR guidance only; not personal HR truth.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ENDPOINT_RESULT_STATES,
    proves: "Base endpoint is visible and distinct.",
    mustNotImply: "Full-marathon readiness or selected-distance race endpoint.",
    workout: identity("Base endpoint", "Base end", "var(--long)", "long"),
  },
  {
    identity: "cutback_long_run",
    family: "long",
    displayLabel: "Cutback long run",
    calendarLabel: "Cutback long",
    detailTitle: "Cutback long run",
    purpose: "Lighter long-run week.",
    sequence: "OP -> MAIN -> FIN -> CD",
    segments: [
      segment("OP", "Opener", "10 min", "Begin gently."),
      segment("MAIN", "Main", "40-80 min reduced long", "Clearly easier than prior peak."),
      segment("FIN", "Finish", "5 min easy settle", "No hidden fast close."),
      segment("CD", "Cooldown", "5 min", "End controlled."),
    ],
    targetTruthMode: "editable_default_hr",
    editableDefaultHrNote: "Editable default HR guidance only; not personal HR truth.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Cutback long is visibly different from normal long.",
    mustNotImply: "Disguised peak week.",
    workout: identity("Cutback long run", "Cutback long", "var(--long)", "long"),
  },
  {
    identity: "taper_long_run",
    family: "long",
    displayLabel: "Taper long run",
    calendarLabel: "Taper long",
    detailTitle: "Taper long run",
    purpose: "Reduced long-run touch during taper.",
    sequence: "OP -> MAIN -> FIN -> CD",
    segments: [
      segment("OP", "Opener", "8-10 min", "Light start."),
      segment("MAIN", "Main", "35-60 min light long", "Reduce stress, keep rhythm."),
      segment("FIN", "Finish", "3 min settle", "Stay loose."),
      segment("CD", "Cooldown", "5 min", "Keep stress low."),
    ],
    targetTruthMode: "editable_default_hr",
    editableDefaultHrNote: "Editable default HR guidance only; not personal HR truth.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Taper long specimen exists.",
    mustNotImply: "Pre-race overload or peak long run.",
    workout: identity("Taper long run", "Taper long", "var(--long)", "long"),
  },
  {
    identity: "ultra_time_on_feet_durability",
    family: "long",
    displayLabel: "Ultra durability",
    calendarLabel: "Ultra TOF",
    detailTitle: "Ultra time-on-feet durability",
    purpose: "Prolonged endurance and fueling discipline.",
    sequence: "OP -> MAIN -> CHK -> FIN -> CD",
    segments: [
      segment("OP", "Opener", "10 min", "Stay patient."),
      segment("MAIN", "Main", "90-180 min time-on-feet", "Durable movement, not speed."),
      segment("CHK", "Checkpoint", "5 min fueling/equipment", "Check fuel and gear."),
      segment("FIN", "Finish", "10 min easy settle", "Keep it sustainable."),
      segment("CD", "Cooldown", "5 min walk-jog", "Transition down safely."),
    ],
    targetTruthMode: "editable_default_hr",
    editableDefaultHrNote: "Editable default HR guidance only; not personal HR truth.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Ultra specimen shows time-on-feet identity.",
    mustNotImply: "Exact elevation, pace precision, or race readiness.",
    workout: identity("Ultra durability", "Ultra TOF", "var(--long)", "long"),
  },
  {
    identity: "controlled_tempo_session",
    family: "tempo",
    displayLabel: "Controlled tempo",
    calendarLabel: "Tempo",
    detailTitle: "Controlled tempo session",
    purpose: "Sustained controlled quality.",
    sequence: "WU -> WORK -> REC -> CD",
    segments: [
      segment("WU", "Warmup", "12-15 min", "Smooth start."),
      segment("WORK", "Work", "2-3 x 8-12 min", "Strong and smooth, repeatable."),
      segment("REC", "Recovery", "2-3 min easy jog", "Reset between blocks."),
      segment("CD", "Cooldown", "8-10 min", "Downshift fully."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: "Optional default HR mention only as secondary.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Tempo session anatomy and repeat logic.",
    mustNotImply: "Precise pace prescription or personal HR.",
    workout: identity("Controlled tempo", "Tempo", "var(--quality)", "tempo"),
  },
  {
    identity: "half_marathon_threshold_durability",
    family: "tempo",
    displayLabel: "Half threshold",
    calendarLabel: "Threshold",
    detailTitle: "Half marathon threshold durability",
    purpose: "Longer sustainable half-specific work.",
    sequence: "WU -> WORK -> REC -> CD",
    segments: [
      segment("WU", "Warmup", "15 min", "Prepare gradually."),
      segment("WORK", "Work", "3 x 8-10 min threshold-like", "Controlled strength, no racing."),
      segment("REC", "Recovery", "3 min easy jog", "Stay repeatable."),
      segment("CD", "Cooldown", "10 min", "Finish composed."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: "Optional default HR note only as clearly default.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Half-specific threshold specimen exists.",
    mustNotImply: "Target-time threshold pace or aggressive race simulation.",
    workout: identity("Half threshold", "Threshold", "var(--quality)", "tempo"),
  },
  {
    identity: "half_readiness_marker",
    family: "tempo",
    displayLabel: "Half marker",
    calendarLabel: "Half marker",
    detailTitle: "Half readiness marker",
    purpose: "Specimen of older half-specific checkpoint style.",
    sequence: "WU -> MAIN -> FIN -> CD",
    segments: [
      segment("WU", "Warmup", "10 min", "Start easy."),
      segment(
        "MAIN",
        "Main",
        "30-45 min controlled half-specific rhythm",
        "Checkpoint, not verdict.",
      ),
      segment("FIN", "Finish", "5 min settle", "Keep it honest."),
      segment("CD", "Cooldown", "5-8 min", "Close calmly."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "A legacy/readiness-style identity can be rendered honestly.",
    mustNotImply: "Exact race readiness, selected-distance endpoint, or pace truth.",
    workout: identity("Half marker", "Half marker", "var(--quality)", "tempo"),
  },
  {
    identity: "distance_intervals",
    family: "intervals",
    displayLabel: "Distance intervals",
    calendarLabel: "Intervals",
    detailTitle: "Distance intervals",
    purpose: "Repeatable distance-based quality.",
    sequence: "WU -> WORK -> REC -> CD",
    segments: [
      segment("WU", "Warmup", "15 min", "Get ready before reps."),
      segment("WORK", "Work", "4-6 x 400-1000m", "Same controlled rhythm each rep."),
      segment("REC", "Recovery", "200m easy jog", "Keep recoveries honest."),
      segment("CD", "Cooldown", "10 min", "Return to easy."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Distance-first interval anatomy.",
    mustNotImply: "Fake race pace or official provider-step fidelity.",
    workout: identity("Distance intervals", "Intervals", "var(--quality)", "intervals"),
  },
  {
    identity: "time_intervals",
    family: "intervals",
    displayLabel: "Time intervals",
    calendarLabel: "Time reps",
    detailTitle: "Time intervals",
    purpose: "Repeatable time-based quality.",
    sequence: "WU -> WORK -> REC -> CD",
    segments: [
      segment("WU", "Warmup", "15 min", "Prepare for reps."),
      segment("WORK", "Work", "4-7 x 3 min", "Hold form across reps."),
      segment("REC", "Recovery", "2 min easy jog", "Recover enough to repeat."),
      segment("CD", "Cooldown", "10 min", "Finish easy."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Time-first interval anatomy.",
    mustNotImply: "Benchmark-derived pace truth.",
    workout: identity("Time intervals", "Time reps", "var(--quality)", "intervals"),
  },
  {
    identity: "5k_sharpening_repeats",
    family: "intervals",
    displayLabel: "5K sharpening repeats",
    calendarLabel: "5K reps",
    detailTitle: "5K sharpening repeats",
    purpose: "Short controlled 5K-specific sharpening.",
    sequence: "WU -> WORK -> REC -> CD",
    segments: [
      segment("WU", "Warmup", "15 min", "Open gradually."),
      segment("WORK", "Work", "6-10 x 400m", "Quick, controlled, not sprinting."),
      segment("REC", "Recovery", "2 min easy jog", "Reset each rep."),
      segment("CD", "Cooldown", "10 min", "Downshift fully."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "5K-specific repeat specimen exists.",
    mustNotImply: "Guaranteed race-pace exactness.",
    workout: identity("5K sharpening repeats", "5K reps", "var(--quality)", "intervals"),
  },
  {
    identity: "10k_rhythm_intervals",
    family: "intervals",
    displayLabel: "10K rhythm intervals",
    calendarLabel: "10K reps",
    detailTitle: "10K rhythm intervals",
    purpose: "Sustained controlled 10K rhythm.",
    sequence: "WU -> WORK -> REC -> CD",
    segments: [
      segment("WU", "Warmup", "15 min", "Prepare calmly."),
      segment("WORK", "Work", "4-6 x 3 min", "Durable rhythm, no pressing."),
      segment("REC", "Recovery", "2 min easy jog", "Stay repeatable."),
      segment("CD", "Cooldown", "10 min", "Close easy."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "10K-specific interval specimen exists.",
    mustNotImply: "Target-time 10K pace.",
    workout: identity("10K rhythm intervals", "10K reps", "var(--quality)", "intervals"),
  },
  {
    identity: "quality_session",
    family: "intervals",
    displayLabel: "Quality session",
    calendarLabel: "Quality",
    detailTitle: "Quality session",
    purpose: "Generic fallback quality specimen.",
    sequence: "WU -> WORK -> REC -> CD",
    segments: [
      segment("WU", "Warmup", "12-15 min", "Build into quality."),
      segment(
        "WORK",
        "Work",
        "4-6 repeats of bounded quality block",
        "Use generic quality only when exact identity is unknown.",
      ),
      segment("REC", "Recovery", "Easy jog recovery", "Reset between repeats."),
      segment("CD", "Cooldown", "8-10 min", "End cleanly."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Fallback quality can still be rich and executable.",
    mustNotImply: "That generic quality is preferable to specific identities.",
    workout: identity("Quality session", "Quality", "var(--quality)", "quality"),
  },
  {
    identity: "progression_run",
    family: "progression",
    displayLabel: "Progression run",
    calendarLabel: "Progression",
    detailTitle: "Progression run",
    purpose: "Gradual rise from easy to moderate.",
    sequence: "WU -> MAIN -> FIN -> CD",
    segments: [
      segment("WU", "Warmup", "10 min", "Start easy."),
      segment(
        "MAIN",
        "Main",
        "20-30 min easy-to-steady progression",
        "Lift gradually, never surge.",
      ),
      segment("FIN", "Finish", "8-12 min stronger controlled close", "Controlled close only."),
      segment("CD", "Cooldown", "5 min", "Return to easy."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Progression is distinct from tempo and steady.",
    mustNotImply: "Race effort or exact pace ladder.",
    workout: identity("Progression run", "Progression", "var(--quality)", "progression"),
  },
  {
    identity: "race_pace_session",
    family: "race",
    displayLabel: "Race pace session",
    calendarLabel: "Race pace",
    detailTitle: "Race pace session",
    purpose: "Race-rhythm specimen without fake precision.",
    sequence: "WU -> WORK -> REC -> CD",
    segments: [
      segment("WU", "Warmup", "15 min", "Prepare gradually."),
      segment(
        "WORK",
        "Work",
        "2-4 x bounded race-rhythm block",
        "Rhythm and posture over numbers.",
      ),
      segment("REC", "Recovery", "2-3 min easy", "Stay in control."),
      segment("CD", "Cooldown", "10 min", "Cool down fully."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Race-identity can render without fake pace.",
    mustNotImply: "Exact race pace target or official race readiness.",
    workout: identity("Race pace session", "Race pace", "var(--quality)", "race"),
  },
  {
    identity: "taper_tuneup_run",
    family: "race",
    displayLabel: "Taper tune-up",
    calendarLabel: "Tune-up",
    detailTitle: "Taper tuneup run",
    purpose: "Light sharpening during taper.",
    sequence: "WU -> WORK -> REC -> CD",
    segments: [
      segment("WU", "Warmup", "10-12 min", "Keep stress low."),
      segment("WORK", "Work", "4-6 x 20-60 sec light opener", "Stay sharp."),
      segment("REC", "Recovery", "Easy jog", "Keep recoveries relaxed."),
      segment("CD", "Cooldown", "8 min", "Finish light."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Tune-up identity exists and stays light.",
    mustNotImply: "Hard interval workout.",
    workout: identity("Taper tune-up", "Tune-up", "var(--quality)", "race"),
  },
  {
    identity: "tenk_completion_or_checkpoint",
    family: "race",
    displayLabel: "Final 10K day",
    calendarLabel: "Final 10K",
    detailTitle: "10K completion or checkpoint",
    purpose: "Selected-distance endpoint specimen.",
    sequence: "WU -> END -> FIN -> CD",
    segments: [
      segment("WU", "Warmup", "10-12 min", "Prepare calmly."),
      segment("END", "Endpoint", "10000m", "Complete the full distance honestly."),
      segment("FIN", "Finish", "3 min easy settle", "Keep the finish honest."),
      segment("CD", "Cooldown", "5-8 min", "Close safely."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Exact 10K endpoint specimen and endpoint anatomy.",
    mustNotImply: "Target-time promise, real race result, or plan mutation.",
    workout: identity("Final 10K day", "Final 10K", "var(--warn)", "race"),
  },
  {
    identity: "uphill_repeats",
    family: "hills",
    displayLabel: "Uphill repeats",
    calendarLabel: "Uphill",
    detailTitle: "Uphill repeats",
    purpose: "Repeatable uphill strength.",
    sequence: "WU -> WORK -> REC -> CD",
    segments: [
      segment("WU", "Warmup", "15 min", "Prepare before climbing."),
      segment("WORK", "Work", "6-10 x 45 sec uphill", "Relaxed upper body, controlled drive."),
      segment("REC", "Recovery", "75-90 sec jog/walk down", "Recover safely."),
      segment("CD", "Cooldown", "10 min", "Return to easy."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: "Optional default HR note only for secondary readback.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Uphill repeat anatomy is explicit.",
    mustNotImply: "Exact grade or elevation prescription.",
    workout: identity("Uphill repeats", "Uphill", "var(--quality)", "hills"),
  },
  {
    identity: "rolling_hills_session",
    family: "hills",
    displayLabel: "Rolling hills",
    calendarLabel: "Rolling hills",
    detailTitle: "Rolling hills session",
    purpose: "Hill rhythm on rolling terrain.",
    sequence: "WU -> MAIN -> FIN -> CD",
    segments: [
      segment("WU", "Warmup", "12-15 min", "Ease into terrain."),
      segment("MAIN", "Main", "25-40 min rolling steady", "Flow over terrain, not attack."),
      segment("FIN", "Finish", "5 min controlled", "Return to rhythm."),
      segment("CD", "Cooldown", "8-10 min", "Finish composed."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: "Optional default HR note secondary only.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Rolling-hills identity differs from repeats.",
    mustNotImply: "Mapped route or exact climb profile.",
    workout: identity("Rolling hills", "Rolling hills", "var(--quality)", "hills"),
  },
  {
    identity: "controlled_downhill_durability",
    family: "hills",
    displayLabel: "Controlled downhill",
    calendarLabel: "Downhill",
    detailTitle: "Controlled downhill durability",
    purpose: "Careful downhill skill and durability.",
    sequence: "WU -> WORK -> REC -> CD",
    segments: [
      segment("WU", "Warmup", "15 min", "Prepare legs."),
      segment("WORK", "Work", "4-8 controlled descents", "Quick feet, soft landings."),
      segment("REC", "Recovery", "Easy climb-back or flat reset", "Reset safely."),
      segment("CD", "Cooldown", "10 min", "Finish easy."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Downhill-specific specimen exists.",
    mustNotImply: "Exact gradient or aggressive downhill racing.",
    workout: identity("Controlled downhill", "Downhill", "var(--quality)", "hills"),
  },
  {
    identity: "climbing_steady_run",
    family: "hills",
    displayLabel: "Climbing steady",
    calendarLabel: "Climbing",
    detailTitle: "Climbing steady run",
    purpose: "Sustained uphill or rolling climb rhythm.",
    sequence: "WU -> MAIN -> FIN -> CD",
    segments: [
      segment("WU", "Warmup", "12 min", "Prepare posture."),
      segment("MAIN", "Main", "20-35 min steady climbing", "Durable climbing posture."),
      segment("FIN", "Finish", "5 min settle", "Stay controlled."),
      segment("CD", "Cooldown", "8 min", "Return easy."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: "Optional default HR note secondary only.",
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Climbing steady is distinct from repeats.",
    mustNotImply: "Exact ascent target or mountain race block.",
    workout: identity("Climbing steady", "Climbing", "var(--quality)", "hills"),
  },
  {
    identity: "technical_trail_easy",
    family: "trail",
    displayLabel: "Technical trail easy",
    calendarLabel: "Trail",
    detailTitle: "Technical trail easy",
    purpose: "Easy terrain-specific movement.",
    sequence: "OP -> MAIN -> CHK -> FIN -> CD",
    segments: [
      segment("OP", "Opener", "10 min", "Short steps."),
      segment("MAIN", "Main", "30-50 min easy trail", "Stay smooth."),
      segment("CHK", "Checkpoint", "3 min footing/posture", "Check footing and posture."),
      segment("FIN", "Finish", "5 min easy settle", "Do not chase pace."),
      segment("CD", "Cooldown", "5 min", "Finish safely."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Trail easy identity exists.",
    mustNotImply: "Exact route, elevation, or mountain race effort.",
    workout: identity("Technical trail easy", "Trail", "var(--long)", "trail"),
  },
  {
    identity: "hike_run_endurance",
    family: "trail",
    displayLabel: "Hike-run endurance",
    calendarLabel: "Hike-run",
    detailTitle: "Hike-run endurance",
    purpose: "Mixed hike/run durability.",
    sequence: "OP -> WORK -> REC -> FIN -> CD",
    segments: [
      segment("OP", "Opener", "10 min", "Ease into terrain."),
      segment("WORK", "Work", "4-8 x hike-run cycle", "Power-hike when terrain says so."),
      segment("REC", "Recovery", "Easy walk/jog reset", "Reset by terrain."),
      segment("FIN", "Finish", "10 min smooth trail", "Stay durable."),
      segment("CD", "Cooldown", "5 min", "Cool down gently."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Hike-run identity is explicit.",
    mustNotImply: "Exact elevation gain or real mountain route.",
    workout: identity("Hike-run endurance", "Hike-run", "var(--long)", "trail"),
  },
  {
    identity: "mountain_long_run_time_on_feet",
    family: "trail",
    displayLabel: "Mountain long run",
    calendarLabel: "Mountain long",
    detailTitle: "Mountain long run time on feet",
    purpose: "Long mountain-specific time-on-feet durability.",
    sequence: "OP -> MAIN -> CHK -> FIN -> CD",
    segments: [
      segment("OP", "Opener", "10 min", "Respect terrain."),
      segment(
        "MAIN",
        "Main",
        "90-180 min mountain time on feet",
        "Durable movement, terrain caution.",
      ),
      segment("CHK", "Checkpoint", "5 min fueling/equipment", "Check fuel and equipment."),
      segment("FIN", "Finish", "10 min easy descent/settle", "Stay careful late."),
      segment("CD", "Cooldown", "5 min walk-jog", "Return safely."),
    ],
    targetTruthMode: "structure_only",
    editableDefaultHrNote: null,
    allowedProviderStates: ALL_PROVIDER_STATES,
    resultStates: ALL_RESULT_STATES,
    proves: "Mountain long specimen shows long-form trail identity.",
    mustNotImply: "Exact elevation, route match, or race readiness.",
    workout: identity("Mountain long run", "Mountain long", "var(--long)", "trail"),
  },
] as const satisfies readonly Omit<WorkoutLibrarySpecimen, "date">[];

export const WORKOUT_LIBRARY_SPECIMENS: readonly WorkoutLibrarySpecimen[] = rows.map(
  (row, index) => ({
    ...row,
    date: fakeDate(index),
  }),
);

export const WORKOUT_LIBRARY_IDENTITY_COUNT = WORKOUT_LIBRARY_SPECIMENS.length;
