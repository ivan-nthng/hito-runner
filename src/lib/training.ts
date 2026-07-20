import { signedOutPreviewPlanSeed } from "@/data/signed-out-preview-plan";
import type { ActivePlanWorkoutSourceEditingCapabilities } from "@/lib/active-plan-workout-editing/source-capabilities";
import type { BodyNote } from "@/lib/body-notes";
import {
  buildPlannedWorkoutLanguage,
  type PlannedWorkoutLanguageBlock,
  type PlannedWorkoutLanguageReadModel,
  type RunnerFacingWorkoutType,
} from "@/lib/planned-workout-language";
import { plannedWorkoutRepeatChildLabel } from "@/lib/planned-workout-block-contract";
import {
  workoutSectionColorVar,
  workoutTypeColorVar,
  type WorkoutSectionColorRole,
} from "@/lib/workout-color-tokens";
import {
  normalizeCanonicalGoalContext,
  resolveCanonicalWorkoutModel,
  type CalendarIconKey,
  type CanonicalGoalContext,
  type CanonicalMetricMode,
  type CanonicalWorkoutFamily,
  type CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
import type { WorkoutFeedbackMarkerSummary } from "@/lib/workout-result-import/types";
import {
  workoutDocumentRepeatChildRoleForSection,
  workoutDocumentRepeatChildren,
  workoutDocumentRepeatCount,
  type WorkoutDocumentPrescription,
  type WorkoutDocumentRepeatChildPrescription,
  type WorkoutDocumentSection,
  type WorkoutDocumentTarget,
  type WorkoutDocumentType,
  type WorkoutDocumentUnitPrescription,
} from "@/lib/workout-document";

export type WorkoutType = WorkoutDocumentType;
type VisibleWorkoutType = CanonicalWorkoutFamily | "quality";
export type Status = "completed" | "partial" | "skipped" | "today" | "upcoming" | "rest";
type WeekStatus = "on_track" | "partially_off_track" | "needs_reset";
type TrainingMode = "preview" | "onboarding" | "authenticated";
type WorkoutOutcome = Extract<Status, "completed" | "partial" | "skipped">;

export type StepTarget = WorkoutDocumentTarget;

type SegmentTone = "warmup" | "run" | "walk" | "work" | "recovery" | "finish" | "cooldown";

interface SegmentColorMeta {
  tone: SegmentTone;
  label: string;
  color: string;
  background: string;
  border: string;
  foreground: string;
  glow: string;
}

export type StepUnitPrescription = WorkoutDocumentUnitPrescription;
export type StepRepeatChildPrescription = WorkoutDocumentRepeatChildPrescription;
export type StepPrescription = WorkoutDocumentPrescription;
export type Step = WorkoutDocumentSection;

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
  plannedWorkoutLanguage: PlannedWorkoutLanguageReadModel;
  title: string;
  notes: string | null;
  steps: Step[];
  feedbackMarker: WorkoutFeedbackMarkerSummary | null;
  sourceEditing: ActivePlanWorkoutSourceEditingCapabilities | null;
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

export type ActivePlanWorkoutEditingOperation =
  | "add_workout"
  | "clear_workout"
  | "move_workout"
  | "edit_workout";

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
  editWorkout: ActivePlanWorkoutEditingCapability;
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

interface ShellSnapshot {
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

const TYPE_META: Record<
  WorkoutType,
  { label: string; short: string; color: string; ring: string }
> = {
  easy: {
    label: "Easy run",
    short: "Easy",
    color: workoutTypeColorVar("easy"),
    ring: workoutTypeColorVar("easy", "ring"),
  },
  steady_or_easy: {
    label: "Steady",
    short: "Steady",
    color: workoutTypeColorVar("steady"),
    ring: workoutTypeColorVar("steady", "ring"),
  },
  long_run: {
    label: "Long run",
    short: "Long",
    color: workoutTypeColorVar("long_run"),
    ring: workoutTypeColorVar("long_run", "ring"),
  },
  quality: {
    label: "Quality / Intervals",
    short: "Quality",
    color: workoutTypeColorVar("tempo"),
    ring: workoutTypeColorVar("tempo", "ring"),
  },
  rest: {
    label: "Rest",
    short: "Rest",
    color: workoutTypeColorVar("rest"),
    ring: workoutTypeColorVar("rest", "ring"),
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

const RUNNER_FACING_VISIBLE_TYPE: Record<RunnerFacingWorkoutType, VisibleWorkoutType> = {
  rest: "rest",
  recovery: "recovery",
  easy: "easy",
  steady: "steady",
  long_run: "long",
  progression: "progression",
  tempo: "tempo",
  intervals: "intervals",
  hills: "hills",
  run_walk: "recovery",
};

type WorkoutVisibleInput = Pick<Workout, "type" | "title" | "steps" | "sourceWorkoutType"> &
  Partial<
    Pick<
      Workout,
      | "workoutFamily"
      | "workoutIdentity"
      | "calendarIconKey"
      | "metricMode"
      | "plannedWorkoutLanguage"
    >
  >;

export function workoutPlannedLanguage(
  workout: WorkoutVisibleInput,
): PlannedWorkoutLanguageReadModel {
  if (isPlannedWorkoutLanguageReadModel(workout.plannedWorkoutLanguage)) {
    return workout.plannedWorkoutLanguage;
  }

  return buildPlannedWorkoutLanguage({
    workoutType: workout.type,
    sourceWorkoutType: workout.sourceWorkoutType,
    workoutFamily: workout.workoutFamily,
    workoutIdentity: workout.workoutIdentity,
    calendarIconKey: workout.calendarIconKey,
    metricMode: workout.metricMode,
    title: workout.title,
    steps: workout.steps,
  });
}

export function workoutTypeMeta(workout: WorkoutVisibleInput): {
  label: string;
  short: string;
  color: string;
  ring: string;
} {
  const language = workoutPlannedLanguage(workout);
  const visibleType = resolveWorkoutVisibleType(workout);
  const meta = visibleType ? VISIBLE_TYPE_META[visibleType] : TYPE_META[workout.type];

  return {
    ...meta,
    color: workoutTypeColorVar(language.runnerFacingWorkoutType),
    label: language.runnerFacingWorkoutTypeLabel,
    ring: workoutTypeColorVar(language.runnerFacingWorkoutType, "ring"),
    short: language.runnerFacingWorkoutTypeLabel,
  };
}

export function workoutStatusLabel(status: Status) {
  switch (status) {
    case "completed":
      return "Completed";
    case "partial":
      return "Partial";
    case "skipped":
      return "Skipped";
    case "today":
      return "Today";
    case "upcoming":
      return "Planned";
    case "rest":
      return "Rest";
  }
}

function resolveWorkoutVisibleType(workout: WorkoutVisibleInput): VisibleWorkoutType | null {
  const language = workoutPlannedLanguage(workout);

  return RUNNER_FACING_VISIBLE_TYPE[language.runnerFacingWorkoutType] ?? "quality";
}

function isPlannedWorkoutLanguageReadModel(
  value: unknown,
): value is PlannedWorkoutLanguageReadModel {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PlannedWorkoutLanguageReadModel>;

  return (
    typeof candidate.runnerFacingWorkoutType === "string" &&
    typeof candidate.runnerFacingWorkoutTypeLabel === "string" &&
    Array.isArray(candidate.runnerFacingBlocks)
  );
}

export function formatPlannedWorkoutBlockSummary(blocks: PlannedWorkoutLanguageBlock[]) {
  const labels = blocks.map((block) => block.label).filter(Boolean);

  if (!labels.length) {
    return null;
  }

  return labels.join(" -> ");
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
  const previewPlan = buildSignedOutPreviewPlan(currentDate);
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
      sourceEditing: null,
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

function buildSignedOutPreviewPlan(currentDate: string): TemplatePlan {
  const startDate = startOfWeekIso(currentDate);

  return {
    meta: {
      plan_name: signedOutPreviewPlanSeed.meta.planName,
      created_for: signedOutPreviewPlanSeed.meta.createdFor,
      created_at: startDate,
      start_date: startDate,
      goal: signedOutPreviewPlanSeed.meta.goal,
    },
    schedule: signedOutPreviewPlanSeed.workouts.map((workout) => {
      const date = addDaysIso(startDate, workout.dayOffset);

      return {
        id: workout.id,
        date,
        weekday: weekdayLong(date),
        week: workout.week,
        phase: workout.phase,
        type: workout.type,
        title: workout.title,
        notes: workout.notes,
        steps: workout.steps,
      };
    }),
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
      sourceEditing: null,
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
  sourceKind,
  title,
  steps,
}: {
  type: WorkoutType;
  sourceWorkoutType?: string | null;
  sourceKind?: string | null;
  workoutFamily?: string | null;
  workoutIdentity?: string | null;
  calendarIconKey?: string | null;
  goalContext?: unknown;
  metricMode?: unknown;
  title: string;
  steps: Step[];
}): Pick<
  Workout,
  | "workoutFamily"
  | "workoutIdentity"
  | "calendarIconKey"
  | "goalContext"
  | "metricMode"
  | "plannedWorkoutLanguage"
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
  const plannedWorkoutLanguage = buildPlannedWorkoutLanguage({
    workoutType: type,
    sourceWorkoutType,
    sourceKind,
    workoutFamily: richWorkout.workoutFamily,
    workoutIdentity: richWorkout.workoutIdentity,
    calendarIconKey: richWorkout.calendarIconKey,
    metricMode: richWorkout.metricMode,
    title,
    steps,
  });

  return {
    workoutFamily: richWorkout.workoutFamily,
    workoutIdentity: richWorkout.workoutIdentity,
    calendarIconKey: richWorkout.calendarIconKey,
    goalContext: normalizeCanonicalGoalContext(goalContext),
    metricMode: richWorkout.metricMode,
    plannedWorkoutLanguage,
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

export function workoutStructureDuration(workout: Pick<Workout, "steps" | "type">): number {
  let total = 0;

  for (const step of workout.steps) {
    total += stepStructureDurationMin(step, workout.type);
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

export function repeatCountForStep(step: Step): number | null {
  return workoutDocumentRepeatCount(step);
}

export function repeatChildSteps(step: Step): Step[] {
  if (!isRepeatStructureStep(step)) {
    return [];
  }

  return workoutDocumentRepeatChildren(step);
}

export function primaryWorkoutTarget(workout: Pick<Workout, "steps">): StepTarget | undefined {
  const preferredTypes = new Set(["run", "tempo", "intervals", "work"]);

  for (const step of workout.steps) {
    const preferredChildTarget = firstPreferredStepTarget(
      childStepsForReadback(step),
      preferredTypes,
    );
    if (preferredChildTarget) {
      return preferredChildTarget;
    }

    if (step.target && preferredTypes.has(step.type)) {
      return step.target;
    }
  }

  for (const step of workout.steps) {
    if (step.target) {
      return step.target;
    }

    const childTarget = firstAnyStepTarget(childStepsForReadback(step));
    if (childTarget) {
      return childTarget;
    }
  }

  return undefined;
}

function firstPreferredStepTarget(
  steps: Step[],
  preferredTypes: ReadonlySet<string>,
): StepTarget | undefined {
  for (const step of steps) {
    if (step.target && preferredTypes.has(step.type)) {
      return step.target;
    }

    const childTarget = firstPreferredStepTarget(childStepsForReadback(step), preferredTypes);
    if (childTarget) {
      return childTarget;
    }
  }

  return undefined;
}

function firstAnyStepTarget(steps: Step[]): StepTarget | undefined {
  for (const step of steps) {
    if (step.target) {
      return step.target;
    }

    const childTarget = firstAnyStepTarget(childStepsForReadback(step));
    if (childTarget) {
      return childTarget;
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
  const pushEntry = (key: string, value: string | number | undefined, labelOverride?: string) => {
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
      label: labelOverride ?? humanizeTargetLabel(key),
      value: humanizeTargetValue(key, stringValue),
    });
  };

  pushEntry("intensity", target.intensity);
  pushEntry(
    "hr_bpm_range",
    target.hr_bpm_range ?? target.hr_bpm,
    target.hr_target_source === "default_estimated_hr"
      ? "Estimated HR"
      : target.hr_target_source === "personal_hr_zone"
        ? "Personal HR"
        : undefined,
  );
  pushEntry("pace_min_per_km_range", target.pace_min_per_km_range ?? target.pace_range_min_km);
  pushEntry("pace", target.pace);
  pushEntry("rpe", target.rpe);
  pushEntry("cadence_spm_range", target.cadence_spm_range);
  pushEntry("cue", target.cue);
  pushEntry("hint", target.hint);
  pushEntry("source_note", target.source_note);

  for (const [key, value] of Object.entries(target.extra ?? {})) {
    if (
      !INTERNAL_TARGET_PROVENANCE_KEYS.has(key) &&
      (typeof value === "string" || typeof value === "number")
    ) {
      pushEntry(key, value);
    }
  }

  return entries;
}

const INTERNAL_TARGET_PROVENANCE_KEYS = new Set([
  "hr_zone",
  "hr_zone_reference",
  "hr_profile_source",
]);

const EXECUTABLE_TARGET_ENTRY_KEYS = new Set([
  "hr_bpm_range",
  "pace_min_per_km_range",
  "pace",
  "cadence_spm_range",
]);

const SUPPORT_TARGET_ENTRY_KEYS = new Set([
  "intensity",
  "cue",
  "hint",
  "source_note",
  "coaching_hint",
]);

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

    if (
      isHrTargetEntry(entry.key) &&
      metricMode &&
      !metricMode.hrTargetsAllowed &&
      target?.hr_target_source !== "default_estimated_hr"
    ) {
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
    const repeatCount = repeatCountForStep(step);
    if (isPositiveNumber(repeatCount)) {
      push("repeats", "Repeats", `${repeatCount} x`);
    }
  } else if (repeatCountForStep(step)) {
    push("repeats", "Repeats", `${repeatCountForStep(step)} x`);
  }

  if (repeatCountForStep(step)) {
    for (const [index, child] of repeatChildSteps(step).entries()) {
      const childRole = workoutDocumentRepeatChildRoleForSection(child);
      push(
        `repeat_child_${index + 1}`,
        child.label ??
          (childRole
            ? plannedWorkoutRepeatChildLabel(childRole)
            : (child.segment_type ?? child.type)),
        describeStepStructureUnit(child),
      );
    }
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

type TargetReadbackOptions = {
  includeStructureWithTargets?: boolean;
  limit?: number;
  omitStructureLabels?: string[];
  supportFallbackLimit?: number;
};

export function displayStepTargetReadbackEntries(
  step: Step,
  metricMode?: Pick<CanonicalMetricMode, "paceTargetsAllowed" | "hrTargetsAllowed"> | null,
  options: TargetReadbackOptions = {},
): Array<{ key: string; label: string; value: string }> {
  const executableEntries = displayExecutableTargetEntries(step.target, metricMode);
  const structureEntries = filterAlreadyDisplayedStructureEntries(
    displayStepStructureEntries(step),
    options.omitStructureLabels,
  );

  if (options.includeStructureWithTargets) {
    const combinedEntries = [...structureEntries, ...executableEntries];

    if (combinedEntries.length > 0) {
      return limitReadbackEntries(combinedEntries, options.limit);
    }
  }

  if (executableEntries.length > 0) {
    return limitReadbackEntries(executableEntries, options.limit);
  }

  if (structureEntries.length > 0) {
    return limitReadbackEntries(structureEntries, options.limit);
  }

  const supportFallbackLimit = options.supportFallbackLimit ?? 0;

  return supportFallbackLimit > 0
    ? displayTargetSupportEntries(step.target).slice(0, supportFallbackLimit)
    : [];
}

export function displayWorkoutTargetReadbackEntries(
  workout: Pick<Workout, "steps" | "type" | "metricMode">,
  options: TargetReadbackOptions = {},
): Array<{ key: string; label: string; value: string }> {
  const targetEntries = displayExecutableTargetEntries(
    primaryWorkoutTarget(workout),
    workout.metricMode,
  );

  if (targetEntries.length > 0) {
    return limitReadbackEntries(targetEntries, options.limit);
  }

  return limitReadbackEntries(
    filterAlreadyDisplayedStructureEntries(
      displayWorkoutStructureEntries(workout),
      options.omitStructureLabels,
    ),
    options.limit,
  );
}

function limitReadbackEntries<T>(entries: T[], limit: number | undefined) {
  return typeof limit === "number" ? entries.slice(0, limit) : entries;
}

function filterAlreadyDisplayedStructureEntries(
  entries: Array<{ key: string; label: string; value: string }>,
  omitStructureLabels: string[] | undefined,
) {
  if (!omitStructureLabels?.length) {
    return entries;
  }

  const omitted = new Set(omitStructureLabels.map((label) => label.toLowerCase()));

  return entries.filter(
    (entry) => !omitted.has(entry.key.toLowerCase()) && !omitted.has(entry.label.toLowerCase()),
  );
}

function describeStepStructureUnit(step: Step) {
  return (
    describeDistanceStructure(step.distance_km) ?? describeDurationStructure(step.duration_min)
  );
}

function childStepsForReadback(step: Step) {
  return isRepeatStructureStep(step) ? repeatChildSteps(step) : (step.children ?? []);
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

function normalizeExecutableStepInstruction(step: Step): Step {
  const children = isRepeatStructureStep(step) ? repeatChildSteps(step) : (step.children ?? []);
  const normalized: Step = {
    ...step,
    ...(step.target ? { target: { ...step.target } } : {}),
    ...(children.length > 0
      ? { children: children.map((child) => normalizeExecutableStepInstruction(child)) }
      : {}),
  };

  if (isRepeatStructureStep(normalized)) {
    const { target: _target, ...structuralRepeat } = normalized;
    void _target;

    return structuralRepeat;
  }

  return normalized;
}

function isRepeatStructureStep(step: Step) {
  return Boolean(step.repeats) || step.prescription?.mode === "repeats";
}

export function stepPlannedDistanceKm(step: Step) {
  let total = step.distance_km ?? 0;
  const repeatCount = repeatCountForStep(step);
  const repeatChildren = repeatChildSteps(step);

  if (repeatCount && repeatChildren.length) {
    total +=
      repeatCount * repeatChildren.reduce((sum, child) => sum + stepPlannedDistanceKm(child), 0);
    return total;
  }

  return total;
}

export function stepPlannedDurationMin(step: Step, workoutType: WorkoutType) {
  let total = step.duration_min ?? 0;
  const repeatCount = repeatCountForStep(step);
  const repeatChildren = repeatChildSteps(step);

  if (repeatCount && repeatChildren.length) {
    total +=
      repeatCount *
      repeatChildren.reduce((sum, child) => sum + stepPlannedDurationMin(child, workoutType), 0);
    return total;
  }

  return total;
}

export function stepStructureDurationMin(step: Step, workoutType: WorkoutType) {
  const direct = stepPlannedDurationMin(step, workoutType);
  if (direct > 0) {
    return direct;
  }

  if (!step.distance_km) {
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

  return Math.round(step.distance_km * pace);
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
  warmup: segmentColorRoleMeta("warmup", "warm_up", "Warm-up"),
  run: segmentColorRoleMeta("run", "run", "Run"),
  walk: segmentColorRoleMeta("walk", "walk", "Walk"),
  work: segmentColorRoleMeta("work", "work", "Work"),
  recovery: segmentColorRoleMeta("recovery", "recover", "Recover"),
  finish: segmentColorRoleMeta("finish", "finish", "Finish"),
  cooldown: segmentColorRoleMeta("cooldown", "cooldown", "Cooldown"),
};

function segmentColorRoleMeta(
  tone: SegmentTone,
  role: WorkoutSectionColorRole,
  label: string,
): SegmentColorMeta {
  return {
    tone,
    label,
    color: workoutSectionColorVar(role),
    background: workoutSectionColorVar(role, "surface"),
    border: workoutSectionColorVar(role, "border"),
    foreground: workoutSectionColorVar(role, "foreground"),
    glow: `0 0 22px ${workoutSectionColorVar(role, "ring")}`,
  };
}

function segmentToneForKind(kind: string, target?: StepTarget): SegmentTone {
  const normalizedKind = kind.trim().toLowerCase().replace(/_/g, " ");
  const intensity = target?.intensity?.trim().toLowerCase() ?? "";
  const cue = `${target?.cue ?? ""} ${target?.hint ?? ""}`.toLowerCase();

  if (/cool|down/.test(normalizedKind)) {
    return "cooldown";
  }

  if (/\bwalk\b|\bwalking\b/.test(normalizedKind)) {
    return "walk";
  }

  if (/recover|rest|float/.test(normalizedKind)) {
    return "recovery";
  }

  if (/finish|closing|checkpoint/.test(normalizedKind)) {
    return "finish";
  }

  if (
    /mobil|drill|activation|prep|stride|dynamic/.test(normalizedKind) ||
    /drill|activation/.test(cue)
  ) {
    return "warmup";
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

  return "run";
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
