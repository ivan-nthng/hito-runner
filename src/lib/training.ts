import planJson from "@/data/training-plan.json";
import type { BodyNote } from "@/lib/body-notes";
import {
  normalizeCanonicalGoalContext,
  normalizeCalendarIconKey,
  normalizeWorkoutFamily,
  resolveCanonicalWorkoutModel,
  type CalendarIconKey,
  type CanonicalGoalContext,
  type CanonicalMetricMode,
  type CanonicalWorkoutFamily,
  type CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
import type { WorkoutFeedbackMarkerSummary } from "@/lib/workout-result-import/types";

export type WorkoutType = "easy" | "steady_or_easy" | "rest" | "long_run" | "quality";
export type VisibleWorkoutType = CanonicalWorkoutFamily | "quality";
export type Status = "completed" | "partial" | "skipped" | "today" | "upcoming" | "rest";
export type WeekStatus = "on_track" | "partially_off_track" | "needs_reset";
export type TrainingMode = "preview" | "onboarding" | "authenticated";
export type WorkoutOutcome = Extract<Status, "completed" | "partial" | "skipped">;

export interface StepTarget {
  intensity?: string;
  hr_bpm_range?: string;
  hr_bpm?: string;
  hr_target_source?: string;
  label?: string;
  source_note?: string;
  pace_min_per_km_range?: string;
  pace_range_min_km?: string;
  pace?: string;
  rpe?: string | number;
  cadence_spm_range?: string;
  cue?: string;
  hint?: string;
  extra?: Record<string, string | number>;
}

export type SegmentTone = "warmup" | "prep" | "work" | "recovery" | "cooldown" | "easy";

export interface SegmentColorMeta {
  tone: SegmentTone;
  label: string;
  color: string;
  background: string;
  border: string;
  glow: string;
}

export interface StepUnitPrescription {
  mode: "time" | "distance" | "none";
  duration_min?: number;
  distance_km?: number;
}

export interface StepPrescription {
  mode: "time" | "distance" | "repeats" | "none";
  duration_min?: number;
  distance_km?: number;
  repeat_count?: number;
  repeat_unit?: StepUnitPrescription;
  recovery_unit?: StepUnitPrescription;
}

export interface Step {
  type: string;
  segment_id?: string;
  segment_type?: string;
  label?: string | null;
  sequence?: number;
  prescription?: StepPrescription;
  guidance?: string | null;
  duration_min?: number;
  distance_km?: number;
  repeats?: number;
  work?: Step;
  recovery?: Step;
  target?: StepTarget;
}

export interface WorkoutLog {
  id?: string;
  outcome: WorkoutOutcome;
  actualDistanceKm: number | null;
  actualDurationMin: number | null;
  rpe: number | null;
  notes: string | null;
  intervalsCompleted: number | null;
  bodyNotes: BodyNote[];
  loggedAt: string | null;
}

export interface Workout {
  id: string;
  date: string;
  weekday: string;
  week: number;
  phase: string;
  type: WorkoutType;
  sourceWorkoutType?: string | null;
  workoutFamily: CanonicalWorkoutFamily;
  workoutIdentity: CanonicalWorkoutIdentity;
  calendarIconKey: CalendarIconKey;
  goalContext: CanonicalGoalContext | null;
  metricMode: CanonicalMetricMode;
  title: string;
  notes: string | null;
  steps: Step[];
  feedbackMarker: WorkoutFeedbackMarkerSummary | null;
  status: Status;
  log: WorkoutLog | null;
}

export interface PlanMeta {
  id: string | null;
  title: string;
  createdFor: string;
  createdAt: string;
  startDate: string;
  raceDate: string | null;
  goal: string;
  source: "preview" | "persisted";
  sourceKind: string | null;
  schedulePreferences: PlanSchedulePreferencesSummary | null;
  workoutEditing: ActivePlanWorkoutEditingCapabilities | null;
}

export interface PlanSchedulePreferencesSummary {
  fixedRestDays: string[];
  runningDaysPerWeek: number | null;
  preferredLongRunDay: string | null;
}

export type ActivePlanWorkoutEditingOperation = "add_workout" | "clear_workout" | "move_workout";

export type ActivePlanWorkoutEditingCapability =
  | {
      allowed: true;
      operation: ActivePlanWorkoutEditingOperation;
      sourceKind: string;
      sourceStatus: string | null;
    }
  | {
      allowed: false;
      operation: ActivePlanWorkoutEditingOperation;
      reason: "no_active_plan" | "unsupported_active_plan_source" | "unsupported_source_metadata";
      message: string;
    };

export interface ActivePlanWorkoutEditingCapabilities {
  addWorkout: ActivePlanWorkoutEditingCapability;
  clearWorkout: ActivePlanWorkoutEditingCapability;
  moveWorkout: ActivePlanWorkoutEditingCapability;
}

export interface RunnerProfileSummary {
  goalType: "build_consistency" | "first_race" | "distance_build";
  goalLabel: string;
  baselineSessionsPerWeek: number;
  baselineLongRunKm: number;
  baselineNotes: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  avatarStoragePath: string | null;
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
}

export interface TrainingSnapshot {
  mode: TrainingMode;
  source: "preview" | "persisted";
  backend: "preview" | "supabase";
  currentDate: string;
  weekStatus: WeekStatus;
  planMeta: PlanMeta | null;
  profile: RunnerProfileSummary | null;
  workouts: Workout[];
}

export interface ShellSnapshot {
  currentDate: string;
  weekStatus: WeekStatus;
  mode: TrainingMode;
  source: "preview" | "persisted";
  backend: "preview" | "supabase";
}

interface TemplateWorkout {
  id: string;
  date: string;
  weekday: string;
  week: number;
  phase: string;
  type: WorkoutType;
  title: string;
  notes?: string | null;
  steps: Step[];
}

interface TemplatePlan {
  meta: {
    plan_name: string;
    created_for: string;
    created_at: string;
    start_date: string;
    race_date?: string;
    goal: string;
  };
  schedule: TemplateWorkout[];
}

const previewPlan = planJson as TemplatePlan;

export const TYPE_META: Record<
  WorkoutType,
  { label: string; short: string; color: string; ring: string }
> = {
  easy: {
    label: "Easy run",
    short: "Easy",
    color: "var(--easy)",
    ring: "rgb(from var(--easy) r g b / 0.2)",
  },
  steady_or_easy: {
    label: "Steady",
    short: "Steady",
    color: "var(--easy)",
    ring: "rgb(from var(--easy) r g b / 0.2)",
  },
  long_run: {
    label: "Long run",
    short: "Long",
    color: "var(--long)",
    ring: "rgb(from var(--long) r g b / 0.2)",
  },
  quality: {
    label: "Quality / Intervals",
    short: "Quality",
    color: "var(--quality)",
    ring: "rgb(from var(--quality) r g b / 0.2)",
  },
  rest: {
    label: "Rest",
    short: "Rest",
    color: "var(--rest)",
    ring: "rgb(from var(--rest) r g b / 0.2)",
  },
};

const VISIBLE_TYPE_META: Record<
  VisibleWorkoutType,
  { label: string; short: string; color: string; ring: string }
> = {
  easy: {
    ...TYPE_META.easy,
    label: "Easy run",
    short: "Easy",
  },
  recovery: {
    ...TYPE_META.easy,
    label: "Recovery",
    short: "Recovery",
  },
  steady: {
    ...TYPE_META.steady_or_easy,
    label: "Steady",
    short: "Steady",
  },
  long: {
    ...TYPE_META.long_run,
    label: "Long run",
    short: "Long",
  },
  tempo: {
    ...TYPE_META.quality,
    label: "Tempo",
    short: "Tempo",
  },
  intervals: {
    ...TYPE_META.quality,
    label: "Intervals",
    short: "Intervals",
  },
  progression: {
    ...TYPE_META.quality,
    label: "Progression",
    short: "Progression",
  },
  race: {
    ...TYPE_META.quality,
    label: "Race pace",
    short: "Race",
  },
  hills: {
    ...TYPE_META.quality,
    label: "Hills",
    short: "Hills",
  },
  trail: {
    ...TYPE_META.long_run,
    label: "Trail",
    short: "Trail",
  },
  quality: TYPE_META.quality,
  rest: TYPE_META.rest,
};

const WORKOUT_IDENTITY_VISIBLE_META: Partial<
  Record<CanonicalWorkoutIdentity, { label: string; short: string; color: string; ring: string }>
> = {
  marathon_steady_specificity: {
    ...TYPE_META.long_run,
    label: "Marathon steady",
    short: "Marathon",
  },
};

const SOURCE_WORKOUT_VISIBLE_TYPE: Record<string, VisibleWorkoutType> = {
  recovery: "recovery",
  intervals: "intervals",
  distance_intervals: "intervals",
  time_intervals: "intervals",
  "5k_sharpening_repeats": "intervals",
  "10k_rhythm_intervals": "intervals",
  tenk_completion_or_checkpoint: "race",
  uphill_repeats: "hills",
  tempo: "tempo",
  controlled_tempo_session: "tempo",
  half_marathon_threshold_durability: "tempo",
  half_readiness_marker: "tempo",
  marathon_steady_specificity: "steady",
  base_endpoint_marker: "long",
  progression: "progression",
  progression_run: "progression",
  race: "race",
  race_pace: "race",
  tune_up: "race",
  tuneup: "race",
  race_tune_up: "race",
  ultra_time_on_feet_durability: "long",
  hike_run_endurance: "trail",
  mountain_long_run_time_on_feet: "trail",
  technical_trail_easy: "trail",
  controlled_downhill_durability: "hills",
  rolling_hills_session: "hills",
  climbing_steady_run: "hills",
  aerobic_strides: "easy",
  quality_session: "quality",
};

type WorkoutVisibleInput = Pick<Workout, "type" | "title" | "steps" | "sourceWorkoutType"> &
  Partial<Pick<Workout, "workoutFamily" | "workoutIdentity" | "calendarIconKey">>;

export function workoutTypeMeta(workout: WorkoutVisibleInput): {
  label: string;
  short: string;
  color: string;
  ring: string;
} {
  const base = TYPE_META[workout.type];
  const identityMeta = resolveWorkoutVisibleMetaFromIdentity(workout.workoutIdentity);

  if (identityMeta) {
    return identityMeta;
  }

  const visibleType = resolveWorkoutVisibleType(workout);

  if (!visibleType) {
    return base;
  }

  return VISIBLE_TYPE_META[visibleType];
}

function resolveWorkoutVisibleMetaFromIdentity(
  workoutIdentity: CanonicalWorkoutIdentity | null | undefined,
) {
  return workoutIdentity ? WORKOUT_IDENTITY_VISIBLE_META[workoutIdentity] : null;
}

export function resolveWorkoutVisibleType(workout: WorkoutVisibleInput): VisibleWorkoutType | null {
  const richVisibleType = resolveVisibleTypeFromRichFields(workout);

  if (richVisibleType) {
    return richVisibleType;
  }

  if (workout.type === "rest") {
    return "rest";
  }

  const sourceType = normalizeWorkoutSourceType(workout.sourceWorkoutType);
  const sourceVisibleType = sourceType ? resolveVisibleTypeFromSource(sourceType) : null;

  if (sourceVisibleType) {
    return sourceVisibleType;
  }

  if (workout.type === "long_run") {
    return "long";
  }

  if (workout.type === "easy" || workout.type === "steady_or_easy") {
    return "easy";
  }

  return resolveVisibleTypeFromWorkoutStructure(workout);
}

function resolveVisibleTypeFromRichFields(
  workout: Partial<Pick<Workout, "workoutFamily" | "calendarIconKey">>,
): CanonicalWorkoutFamily | null {
  return (
    normalizeCalendarIconKey(workout.calendarIconKey) ??
    normalizeWorkoutFamily(workout.workoutFamily) ??
    null
  );
}

function normalizeWorkoutSourceType(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return normalized.replace(/[\s-]+/g, "_").replace(/_+/g, "_");
}

function resolveVisibleTypeFromSource(sourceType: string): VisibleWorkoutType | null {
  const exactMatch = SOURCE_WORKOUT_VISIBLE_TYPE[sourceType];

  if (exactMatch) {
    return exactMatch;
  }

  if (/race_(pace|specific)|(?:^|_)tune_?up(?:_|$)/.test(sourceType)) {
    return "race";
  }

  if (/progression/.test(sourceType)) {
    return "progression";
  }

  if (/tempo|threshold/.test(sourceType)) {
    return "tempo";
  }

  if (/hill|climb|uphill|downhill|rolling/.test(sourceType)) {
    return "hills";
  }

  if (/trail|mountain|hike_run/.test(sourceType)) {
    return "trail";
  }

  if (/interval|repeat/.test(sourceType)) {
    return "intervals";
  }

  if (/long_run|time_on_feet|endurance/.test(sourceType)) {
    return "long";
  }

  if (/recovery/.test(sourceType)) {
    return "recovery";
  }

  if (/easy/.test(sourceType)) {
    return "easy";
  }

  return null;
}

function resolveVisibleTypeFromWorkoutStructure(
  workout: Pick<Workout, "title" | "steps">,
): VisibleWorkoutType {
  if (/\bprogression\b/i.test(workout.title)) {
    return "progression";
  }

  if (/\b(intervals?|repeats?|reps)\b/i.test(workout.title)) {
    return "intervals";
  }

  if (/\b(race\s*pace|tune\s*up|tune-up)\b/i.test(workout.title)) {
    return "race";
  }

  const hasTempoIdentity =
    /\b(tempo|threshold)\b/i.test(workout.title) ||
    workout.steps.some(
      (step) =>
        step.type === "tempo" ||
        step.segment_type === "tempo_block" ||
        /\b(tempo|threshold)\b/i.test(step.label ?? ""),
    );

  if (hasTempoIdentity) {
    return "tempo";
  }

  return "quality";
}

export const WEEK_STATUS_META: Record<WeekStatus, { label: string; helper: string }> = {
  on_track: {
    label: "On track",
    helper: "You're keeping up with the current week as planned.",
  },
  partially_off_track: {
    label: "Partially off track",
    helper: "You missed or shortened part of the week, but the plan still holds together.",
  },
  needs_reset: {
    label: "Needs reset",
    helper: "Too much of the week shifted to keep following it blindly.",
  },
};

export function feedbackMarkerMeta(marker: WorkoutFeedbackMarkerSummary | null) {
  if (!marker) {
    return null;
  }

  switch (marker.state) {
    case "evidence_attached":
      return {
        state: marker.state,
        label: "Evidence attached",
        shortLabel: "Evidence",
      };
    case "feedback_ready":
      return {
        state: marker.state,
        label: "Feedback ready",
        shortLabel: "Feedback",
      };
    default:
      return null;
  }
}

export function getPreviewSnapshot(): TrainingSnapshot {
  const currentDate = todayIso();
  const workouts = previewPlan.schedule.map((workout) => {
    const steps = normalizeExecutableStepInstructions(workout.steps);
    const richWorkout = deriveWorkoutRichModel({
      type: workout.type,
      sourceWorkoutType: null,
      title: workout.title,
      steps,
    });

    return {
      id: workout.id,
      date: workout.date,
      weekday: workout.weekday,
      week: workout.week,
      phase: workout.phase,
      type: workout.type,
      ...richWorkout,
      title: workout.title,
      notes: workout.notes ?? null,
      steps,
      feedbackMarker: null,
      log: null,
      status: inferWorkoutStatus(workout.type, workout.date, currentDate, null),
    };
  });

  return {
    mode: "preview",
    source: "preview",
    backend: "preview",
    currentDate,
    planMeta: {
      id: null,
      title: previewPlan.meta.plan_name,
      createdFor: previewPlan.meta.created_for,
      createdAt: previewPlan.meta.created_at,
      startDate: previewPlan.meta.start_date,
      raceDate: previewPlan.meta.race_date ?? null,
      goal: previewPlan.meta.goal,
      source: "preview",
      sourceKind: null,
      schedulePreferences: null,
      workoutEditing: null,
    },
    profile: null,
    workouts,
    weekStatus: deriveWeekStatus(workouts, currentDate),
  };
}

export function getShellSnapshot(snapshot?: TrainingSnapshot | null): ShellSnapshot {
  const resolved = snapshot ?? getPreviewSnapshot();

  return {
    currentDate: resolved.currentDate,
    weekStatus: resolved.weekStatus,
    mode: resolved.mode,
    source: resolved.source,
    backend: resolved.backend,
  };
}

export function findWorkout(workouts: Workout[], date: string): Workout | undefined {
  return workouts.find((workout) => workout.date === date);
}

export function weekOf(workouts: Workout[], date: string): Workout[] {
  const monday = startOfWeekIso(date);
  const out: Workout[] = [];

  for (let index = 0; index < 7; index += 1) {
    const iso = addDaysIso(monday, index);
    const found = findWorkout(workouts, iso);

    if (found) {
      out.push(found);
      continue;
    }

    out.push({
      id: `rest-${iso}`,
      date: iso,
      weekday: weekdayLong(iso),
      week: 0,
      phase: "Recovery",
      type: "rest",
      ...deriveWorkoutRichModel({
        type: "rest",
        sourceWorkoutType: "rest_and_recovery",
        title: "Rest",
        steps: [],
      }),
      title: "Rest",
      notes: null,
      steps: [],
      feedbackMarker: null,
      log: null,
      status: "rest",
    });
  }

  return out;
}

export function deriveWorkoutRichModel({
  type,
  sourceWorkoutType,
  workoutFamily,
  workoutIdentity,
  calendarIconKey,
  goalContext,
  metricMode,
  title,
  steps,
}: {
  type: WorkoutType;
  sourceWorkoutType?: string | null;
  workoutFamily?: string | null;
  workoutIdentity?: string | null;
  calendarIconKey?: string | null;
  goalContext?: unknown;
  metricMode?: unknown;
  title: string;
  steps: Step[];
}): Pick<
  Workout,
  "workoutFamily" | "workoutIdentity" | "calendarIconKey" | "goalContext" | "metricMode"
> {
  const richWorkout = resolveCanonicalWorkoutModel({
    workoutType: type,
    sourceWorkoutType,
    workoutFamily,
    workoutIdentity,
    calendarIconKey,
    metricMode,
    title,
    steps,
  });

  return {
    workoutFamily: richWorkout.workoutFamily,
    workoutIdentity: richWorkout.workoutIdentity,
    calendarIconKey: richWorkout.calendarIconKey,
    goalContext: normalizeCanonicalGoalContext(goalContext),
    metricMode: richWorkout.metricMode,
  };
}

export function deriveWeekStatus(workouts: Workout[], currentDate: string): WeekStatus {
  const resolved = weekOf(workouts, currentDate).filter(
    (workout) => workout.type !== "rest" && workout.date <= currentDate,
  );
  const skipped = resolved.filter((workout) => workout.status === "skipped").length;
  const partial = resolved.filter((workout) => workout.status === "partial").length;

  if (skipped >= 2 || (skipped >= 1 && partial >= 1)) return "needs_reset";
  if (skipped >= 1 || partial >= 1) return "partially_off_track";
  return "on_track";
}

export function workoutDuration(workout: Pick<Workout, "steps" | "type">): number {
  let total = 0;

  for (const step of workout.steps) {
    total += stepPlannedDurationMin(step, workout.type);
  }

  return total;
}

export function workoutDistanceKm(workout: Pick<Workout, "steps" | "type">): number | null {
  let km = 0;
  let anyDistance = false;

  for (const step of workout.steps) {
    const stepKm = stepPlannedDistanceKm(step);

    if (stepKm > 0) {
      km += stepKm;
      anyDistance = true;
    }
  }

  if (anyDistance) return roundDistanceKm(km);

  const duration = workoutDuration(workout);
  if (!duration) return null;

  const paceMap: Record<WorkoutType, number> = {
    easy: 7.0,
    steady_or_easy: 6.6,
    long_run: 6.8,
    quality: 5.8,
    rest: 0,
  };
  const pace = paceMap[workout.type];

  if (!pace) return null;

  return roundDistanceKm(duration / pace);
}

export function formatDistanceKm(distanceKm: number | null | undefined): string {
  if (distanceKm == null || !Number.isFinite(distanceKm)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(roundDistanceKm(distanceKm));
}

export function formatDistanceMeters(distanceMeters: number | null | undefined): string {
  if (distanceMeters == null || !Number.isFinite(distanceMeters)) {
    return "—";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(distanceMeters))} m`;
}

export function formatPrescriptionDistanceKm(distanceKm: number | null | undefined): string {
  if (distanceKm == null || !Number.isFinite(distanceKm)) {
    return "—";
  }

  if (distanceKm > 0 && distanceKm < 2) {
    return formatDistanceMeters(distanceKm * 1000);
  }

  return `${formatDistanceKm(distanceKm)} km`;
}

export function formatDurationMin(
  durationMin: number | null | undefined,
  unit: "min" | "prime" | "segment" = "min",
): string {
  if (durationMin == null || !Number.isFinite(durationMin)) {
    return "—";
  }

  if (unit === "segment") {
    return formatSegmentDurationMin(durationMin);
  }

  const rounded = Math.max(1, Math.round(durationMin));
  const value = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);

  return `${value} min`;
}

export function formatSegmentDurationMin(durationMin: number | null | undefined): string {
  if (durationMin == null || !Number.isFinite(durationMin)) {
    return "—";
  }

  const totalSeconds = Math.max(1, Math.round(durationMin * 60));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds} sec`;
  }

  if (seconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${seconds} sec`;
}

export function segmentColorMeta(kind: string, target?: StepTarget): SegmentColorMeta {
  const tone = segmentToneForKind(kind, target);
  return SEGMENT_COLOR_META[tone];
}

export function primaryWorkoutTarget(workout: Pick<Workout, "steps">): StepTarget | undefined {
  const preferredTypes = new Set(["run", "tempo", "intervals", "work"]);

  for (const step of workout.steps) {
    if (step.repeats && step.work?.target) {
      return step.work.target;
    }

    if (step.target && preferredTypes.has(step.type)) {
      return step.target;
    }
  }

  for (const step of workout.steps) {
    if (step.target) {
      return step.target;
    }

    if (step.work?.target) {
      return step.work.target;
    }
  }

  return undefined;
}

export function displayTargetEntries(target: StepTarget | undefined) {
  if (!target) {
    return [];
  }

  const entries: Array<{ key: string; label: string; value: string }> = [];
  const seen = new Set<string>();
  const pushEntry = (key: string, value: string | number | undefined) => {
    if (value == null) {
      return;
    }

    const stringValue = typeof value === "number" ? String(value) : value.trim();

    if (!stringValue || seen.has(key)) {
      return;
    }

    seen.add(key);
    entries.push({
      key,
      label: humanizeTargetLabel(key),
      value: humanizeTargetValue(key, stringValue),
    });
  };

  pushEntry("intensity", target.intensity);
  pushEntry("hr_bpm_range", target.hr_bpm_range ?? target.hr_bpm);
  pushEntry("pace_min_per_km_range", target.pace_min_per_km_range ?? target.pace_range_min_km);
  pushEntry("pace", target.pace);
  pushEntry("rpe", target.rpe);
  pushEntry("cadence_spm_range", target.cadence_spm_range);
  pushEntry("cue", target.cue);
  pushEntry("hint", target.hint);
  pushEntry("source_note", target.source_note);

  for (const [key, value] of Object.entries(target.extra ?? {})) {
    if (typeof value === "string" || typeof value === "number") {
      pushEntry(key, value);
    }
  }

  return entries;
}

const EXECUTABLE_TARGET_ENTRY_KEYS = new Set([
  "hr_bpm_range",
  "pace_min_per_km_range",
  "pace",
  "cadence_spm_range",
  "rpe",
  "intensity",
]);

const SUPPORT_TARGET_ENTRY_KEYS = new Set(["cue", "hint", "source_note", "coaching_hint"]);

export function displayExecutableTargetEntries(
  target: StepTarget | undefined,
  metricMode?: Pick<CanonicalMetricMode, "paceTargetsAllowed" | "hrTargetsAllowed"> | null,
) {
  return displayTargetEntries(target).filter((entry) => {
    if (!EXECUTABLE_TARGET_ENTRY_KEYS.has(entry.key)) {
      return false;
    }

    if (isPaceTargetEntry(entry.key) && metricMode && !metricMode.paceTargetsAllowed) {
      return false;
    }

    if (isHrTargetEntry(entry.key) && metricMode && !metricMode.hrTargetsAllowed) {
      return false;
    }

    return true;
  });
}

export function displayTargetSupportEntries(target: StepTarget | undefined) {
  return displayTargetEntries(target).filter((entry) => SUPPORT_TARGET_ENTRY_KEYS.has(entry.key));
}

export function displayStepStructureEntries(
  step: Step,
): Array<{ key: string; label: string; value: string }> {
  const entries: Array<{ key: string; label: string; value: string }> = [];
  const prescription = step.prescription;
  const push = (key: string, label: string, value: string | null | undefined) => {
    const trimmed = value?.trim();
    if (!trimmed || trimmed === "—" || entries.some((entry) => entry.label === label)) {
      return;
    }

    entries.push({ key, label, value: trimmed });
  };

  if (prescription?.mode === "time") {
    push("duration", "Duration", formatDurationMin(prescription.duration_min, "segment"));
  }

  if (prescription?.mode === "distance") {
    push("distance", "Distance", formatPrescriptionDistanceKm(prescription.distance_km));
  }

  if (prescription?.mode === "repeats") {
    const repeatCount = prescription.repeat_count ?? step.repeats;
    if (isPositiveNumber(repeatCount)) {
      push("repeats", "Repeats", `${repeatCount} x`);
    }

    push("work", "Work", describeStepUnitPrescription(prescription.repeat_unit));
    push("recovery", "Recovery", describeStepUnitPrescription(prescription.recovery_unit));
  }

  if (step.repeats && step.work) {
    push("repeats", "Repeats", `${step.repeats} x`);
    push("work", "Work", describeStepStructureUnit(step.work));
    push("recovery", "Recovery", step.recovery ? describeStepStructureUnit(step.recovery) : null);
  }

  push("duration", "Duration", describeDurationStructure(step.duration_min));
  push("distance", "Distance", describeDistanceStructure(step.distance_km));

  if (!entries.some((entry) => entry.label === "Repeats") && isPositiveNumber(step.repeats)) {
    push("repeats", "Repeats", `${step.repeats} x`);
  }

  return entries;
}

export function displayWorkoutStructureEntries(
  workout: Pick<Workout, "steps" | "type">,
): Array<{ key: string; label: string; value: string }> {
  for (const step of workout.steps) {
    const entries = displayStepStructureEntries(step);

    if (entries.some((entry) => entry.label === "Repeats")) {
      return entries;
    }
  }

  const firstStructuredStep = workout.steps
    .map((step) => displayStepStructureEntries(step))
    .find((entries) => entries.length > 0);

  if (firstStructuredStep?.length) {
    return firstStructuredStep;
  }

  const duration = workoutDuration(workout);
  return duration > 0
    ? [{ key: "duration", label: "Duration", value: formatDurationMin(duration) }]
    : [];
}

function describeStepUnitPrescription(
  unit:
    | { mode: "time" | "distance" | "none"; duration_min?: number; distance_km?: number }
    | undefined,
) {
  if (!unit || typeof unit !== "object") {
    return null;
  }

  if (unit.mode === "time") {
    return describeDurationStructure(unit.duration_min);
  }

  if (unit.mode === "distance") {
    return describeDistanceStructure(unit.distance_km);
  }

  return null;
}

function describeStepStructureUnit(step: Step) {
  return (
    describeDistanceStructure(step.distance_km) ?? describeDurationStructure(step.duration_min)
  );
}

function describeDurationStructure(durationMin: number | null | undefined) {
  return isPositiveNumber(durationMin) ? formatDurationMin(durationMin, "segment") : null;
}

function describeDistanceStructure(distanceKm: number | null | undefined) {
  return isPositiveNumber(distanceKm) ? formatPrescriptionDistanceKm(distanceKm) : null;
}

function isPositiveNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isPaceTargetEntry(key: string) {
  return key === "pace" || key === "pace_min_per_km_range";
}

function isHrTargetEntry(key: string) {
  return key === "hr_bpm_range";
}

export function normalizeExecutableStepInstructions(steps: Step[]): Step[] {
  return steps.map((step) => normalizeExecutableStepInstruction(step));
}

function normalizeExecutableStepInstruction(step: Step, role?: "work" | "recovery"): Step {
  const normalized: Step = {
    ...step,
    ...(step.target ? { target: { ...step.target } } : {}),
    ...(step.work ? { work: normalizeExecutableStepInstruction(step.work, "work") } : {}),
    ...(step.recovery
      ? {
          recovery: isExecutableStep(step.recovery)
            ? normalizeExecutableStepInstruction(step.recovery, "recovery")
            : {
                ...step.recovery,
                ...(step.recovery.target ? { target: { ...step.recovery.target } } : {}),
              },
        }
      : {}),
  };

  if (!isExecutableStep(normalized)) {
    return normalized;
  }

  const guidance = readStepGuidance(normalized);

  if (hasStepInstruction(normalized)) {
    if (!hasTargetInstruction(normalized.target) && guidance) {
      return {
        ...normalized,
        guidance,
        target: addHintTarget(normalized.target, guidance),
      };
    }

    return normalized;
  }

  const fallbackInstruction = fallbackInstructionForStep(normalized, role);

  return {
    ...normalized,
    guidance: guidance ?? fallbackInstruction,
    target: addHintTarget(normalized.target, fallbackInstruction),
  };
}

function isExecutableStep(step: Step) {
  const kind = `${step.segment_type ?? ""} ${step.type ?? ""}`.toLowerCase();

  if (/\b(rest|fueling)\b/.test(kind)) {
    return false;
  }

  if (
    /\brecovery\b/.test(kind) &&
    step.prescription?.mode === "none" &&
    !step.duration_min &&
    !step.distance_km
  ) {
    return false;
  }

  return true;
}

function hasStepInstruction(step: Step) {
  return hasTargetInstruction(step.target) || Boolean(readStepGuidance(step));
}

function hasTargetInstruction(target: StepTarget | undefined) {
  if (!target) {
    return false;
  }

  return displayTargetEntries(target).length > 0;
}

function addHintTarget(target: StepTarget | undefined, hint: string): StepTarget {
  const trimmedHint = hint.trim();

  return {
    ...(target ?? {}),
    hint: target?.hint?.trim() ? target.hint : trimmedHint,
  };
}

function readStepGuidance(step: Step) {
  const guidance = (step as { guidance?: unknown }).guidance;

  if (typeof guidance === "string") {
    const trimmed = guidance.trim();
    return trimmed || null;
  }

  if (guidance && typeof guidance === "object" && "guidance" in guidance) {
    const nestedGuidance = (guidance as { guidance?: unknown }).guidance;

    if (typeof nestedGuidance !== "string") {
      return null;
    }

    const trimmed = nestedGuidance.trim();
    return trimmed || null;
  }

  return null;
}

function fallbackInstructionForStep(step: Step, role?: "work" | "recovery") {
  const kind = `${role ?? ""} ${step.segment_type ?? ""} ${step.type ?? ""} ${step.label ?? ""}`
    .toLowerCase()
    .trim();

  if (/\bwarm\s*up\b|\bwarmup\b/.test(kind)) {
    return "Easy and controlled.";
  }

  if (/\bcool\s*down\b|\bcooldown\b/.test(kind)) {
    return "Easy jog or walk before stopping.";
  }

  if (/\brecovery\b/.test(kind)) {
    return "Very easy jog or walk; let breathing settle.";
  }

  if (/\bmobility\b|\bstrength\b|\bactivation\b|\bdrills\b/.test(kind)) {
    return "Move smoothly; keep this supportive, not maximal.";
  }

  if (/\bwork\b|\binterval\b|\btempo\b|\bstride\b|\bhill\b|\bquality\b/.test(kind)) {
    return "Controlled hard effort; stay repeatable.";
  }

  return "Easy and controlled.";
}

export function stepPlannedDistanceKm(step: Step) {
  let total = step.distance_km ?? 0;

  if (step.repeats && step.work?.distance_km) {
    total += step.repeats * step.work.distance_km;
  }

  if (step.repeats && step.recovery?.distance_km) {
    total += step.repeats * step.recovery.distance_km;
  }

  return total;
}

export function stepPlannedDurationMin(step: Step, workoutType: WorkoutType) {
  let total = step.duration_min ?? 0;

  if (step.repeats && step.work) {
    const workDuration =
      step.work.duration_min ??
      estimateDurationFromDistanceKm(step.work.distance_km ?? 0, workoutType);
    const recoveryDuration =
      step.recovery?.duration_min ??
      estimateDurationFromDistanceKm(step.recovery?.distance_km ?? 0, "easy");
    total += step.repeats * (workDuration + recoveryDuration);
  }

  return total;
}

function estimateDurationFromDistanceKm(distanceKm: number, workoutType: WorkoutType) {
  if (!distanceKm) {
    return 0;
  }

  const paceMap: Record<WorkoutType, number> = {
    easy: 7.0,
    steady_or_easy: 6.6,
    long_run: 6.8,
    quality: 5.8,
    rest: 0,
  };
  const pace = paceMap[workoutType];

  if (!pace) {
    return 0;
  }

  return Math.round(distanceKm * pace);
}

function roundDistanceKm(distanceKm: number) {
  return Number(distanceKm.toFixed(2));
}

function humanizeTargetLabel(key: string) {
  switch (key) {
    case "intensity":
      return "Effort";
    case "hr_bpm_range":
      return "Heart rate";
    case "label":
      return "Target";
    case "source_note":
      return "Source";
    case "pace_min_per_km_range":
    case "pace":
      return "Pace";
    case "cadence_spm_range":
      return "Cadence";
    case "rpe":
      return "RPE";
    case "cue":
      return "Focus";
    case "hint":
      return "Note";
    case "coaching_hint":
      return "Coach note";
    default:
      return key.replace(/_/g, " ");
  }
}

function humanizeTargetValue(key: string, value: string) {
  const normalized = value.trim().toLowerCase();

  if (key === "pace" || key === "pace_min_per_km_range") {
    if (normalized === "not_measured") {
      return "By feel";
    }
  }

  if (key === "intensity") {
    switch (normalized) {
      case "easy_aerobic":
        return "Easy aerobic";
      case "controlled_fast":
        return "Controlled fast running";
      case "controlled":
        return "Controlled";
      case "fast":
        return "Fast";
      default:
        break;
    }
  }

  return value.replace(/_/g, " ");
}

const SEGMENT_COLOR_META: Record<SegmentTone, SegmentColorMeta> = {
  warmup: {
    tone: "warmup",
    label: "Warm-up",
    color: "rgb(122 162 247)",
    background: "color-mix(in oklch, rgb(122 162 247) 64%, transparent)",
    border: "color-mix(in oklch, rgb(122 162 247) 72%, white 8%)",
    glow: "0 0 22px rgb(122 162 247 / 0.28)",
  },
  prep: {
    tone: "prep",
    label: "Prep",
    color: "rgb(135 196 190)",
    background: "color-mix(in oklch, rgb(135 196 190) 62%, transparent)",
    border: "color-mix(in oklch, rgb(135 196 190) 74%, white 8%)",
    glow: "0 0 20px rgb(135 196 190 / 0.24)",
  },
  work: {
    tone: "work",
    label: "Work",
    color: "rgb(239 112 101)",
    background: "color-mix(in oklch, rgb(239 112 101) 82%, transparent)",
    border: "color-mix(in oklch, rgb(239 112 101) 80%, white 10%)",
    glow: "0 0 24px rgb(239 112 101 / 0.32)",
  },
  recovery: {
    tone: "recovery",
    label: "Recovery",
    color: "rgb(148 163 184)",
    background: "color-mix(in oklch, rgb(148 163 184) 38%, transparent)",
    border: "color-mix(in oklch, rgb(148 163 184) 54%, white 6%)",
    glow: "0 0 16px rgb(148 163 184 / 0.16)",
  },
  cooldown: {
    tone: "cooldown",
    label: "Cool-down",
    color: "rgb(128 149 176)",
    background: "color-mix(in oklch, rgb(128 149 176) 46%, transparent)",
    border: "color-mix(in oklch, rgb(128 149 176) 58%, white 6%)",
    glow: "0 0 18px rgb(128 149 176 / 0.18)",
  },
  easy: {
    tone: "easy",
    label: "Easy",
    color: "rgb(112 171 201)",
    background: "color-mix(in oklch, rgb(112 171 201) 54%, transparent)",
    border: "color-mix(in oklch, rgb(112 171 201) 64%, white 8%)",
    glow: "0 0 20px rgb(112 171 201 / 0.2)",
  },
};

function segmentToneForKind(kind: string, target?: StepTarget): SegmentTone {
  const normalizedKind = kind.trim().toLowerCase().replace(/_/g, " ");
  const intensity = target?.intensity?.trim().toLowerCase() ?? "";
  const cue = `${target?.cue ?? ""} ${target?.hint ?? ""}`.toLowerCase();

  if (/cool|down/.test(normalizedKind)) {
    return "cooldown";
  }

  if (/recover|rest|walk|float/.test(normalizedKind)) {
    return "recovery";
  }

  if (
    /mobil|drill|activation|prep|stride|dynamic/.test(normalizedKind) ||
    /drill|activation/.test(cue)
  ) {
    return "prep";
  }

  if (/warm/.test(normalizedKind)) {
    return "warmup";
  }

  if (
    /work|tempo|interval|repeat|threshold|race|hill|quality/.test(normalizedKind) ||
    /fast|hard|tempo|threshold|race|5k|10k|controlled/.test(intensity)
  ) {
    return "work";
  }

  return "easy";
}

export function weeklyMileage(snapshot: TrainingSnapshot) {
  const buckets = new Map<string, { km: number; planned: number }>();

  for (const workout of snapshot.workouts) {
    const weekStart = startOfWeekIso(workout.date);
    const bucket = buckets.get(weekStart) ?? { km: 0, planned: 0 };
    const km = workoutDistanceKm(workout) ?? 0;

    bucket.planned += km;

    if (workout.status === "completed") bucket.km += km;
    if (workout.status === "partial") bucket.km += km * 0.6;

    buckets.set(weekStart, bucket);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, value]) => ({ weekStart, ...value }));
}

export function statsTotals(snapshot: TrainingSnapshot) {
  const past = snapshot.workouts.filter(
    (workout) => workout.date <= snapshot.currentDate && workout.type !== "rest",
  );
  const completed = past.filter((workout) => workout.status === "completed").length;
  const total = past.length;
  const longest = Math.max(
    ...snapshot.workouts
      .filter((workout) => workout.date <= snapshot.currentDate && workout.status === "completed")
      .map((workout) => workoutDistanceKm(workout) ?? 0),
    0,
  );
  const totalKm = snapshot.workouts
    .filter((workout) => workout.date <= snapshot.currentDate)
    .reduce((sum, workout) => {
      const km = workoutDistanceKm(workout) ?? 0;
      if (workout.status === "completed") return sum + km;
      if (workout.status === "partial") return sum + km * 0.6;
      return sum;
    }, 0);

  return {
    completionPct: total ? Math.round((completed / total) * 100) : 0,
    completed,
    total,
    longestKm: +longest.toFixed(1),
    totalKm: +totalKm.toFixed(0),
  };
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return dateFromIso(iso).toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric" });
}

export function weekdayShort(iso: string): string {
  return dateFromIso(iso).toLocaleDateString("en-US", { weekday: "short" });
}

export function weekdayLong(iso: string): string {
  return dateFromIso(iso).toLocaleDateString("en-US", { weekday: "long" });
}

export function inferWorkoutStatus(
  type: WorkoutType,
  date: string,
  currentDate: string,
  log: WorkoutLog | null,
): Status {
  if (type === "rest") return "rest";
  if (log) return log.outcome;
  if (date > currentDate) return "upcoming";
  if (date === currentDate) return "today";
  return "skipped";
}

export function addDaysIso(iso: string, days: number) {
  const date = dateFromIso(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function diffDaysIso(a: string, b: string) {
  const ms = dateFromIso(a).getTime() - dateFromIso(b).getTime();
  return Math.round(ms / 86_400_000);
}

export function startOfWeekIso(iso: string) {
  const date = dateFromIso(iso);
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday);
  return toIsoDate(date);
}

export function todayIso() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateFromIso(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
