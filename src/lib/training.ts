import planJson from "@/data/training-plan.json";
import type { BodyNote } from "@/lib/body-notes";
import type { WorkoutFeedbackMarkerSummary } from "@/lib/workout-result-import/types";

export type WorkoutType = "easy" | "steady_or_easy" | "rest" | "long_run" | "quality";
export type Status = "completed" | "partial" | "skipped" | "today" | "upcoming" | "rest";
export type WeekStatus = "on_track" | "partially_off_track" | "needs_reset";
export type TrainingMode = "preview" | "onboarding" | "authenticated";
export type WorkoutOutcome = Extract<Status, "completed" | "partial" | "skipped">;

export interface StepTarget {
  intensity?: string;
  hr_bpm_range?: string;
  hr_bpm?: string;
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
  title: string;
  notes: string | null;
  steps: Step[];
  feedbackMarker: WorkoutFeedbackMarkerSummary | null;
  status: Status;
  log: WorkoutLog | null;
}

export interface PlanMeta {
  title: string;
  createdFor: string;
  createdAt: string;
  startDate: string;
  raceDate: string | null;
  goal: string;
  source: "preview" | "persisted";
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

export function workoutTypeMeta(
  workout: Pick<Workout, "type" | "title" | "steps" | "sourceWorkoutType">,
): {
  label: string;
  short: string;
  color: string;
  ring: string;
} {
  const base = TYPE_META[workout.type];
  const sourceType = workout.sourceWorkoutType?.trim().toLowerCase() ?? null;

  if (workout.type !== "quality") {
    if (workout.type === "easy" && sourceType === "recovery") {
      return {
        ...base,
        label: "Recovery",
        short: "Recovery",
      };
    }

    return base;
  }

  if (sourceType === "intervals") {
    return {
      ...base,
      label: "Intervals",
      short: "Intervals",
    };
  }

  if (sourceType === "progression") {
    return {
      ...base,
      label: "Progression",
      short: "Progression",
    };
  }

  if (sourceType === "race") {
    return {
      ...base,
      label: "Race pace",
      short: "Race",
    };
  }

  if (sourceType === "tempo") {
    return {
      ...base,
      label: "Tempo",
      short: "Tempo",
    };
  }

  const hasTempoIdentity =
    /tempo/i.test(workout.title) ||
    workout.steps.some(
      (step) =>
        step.type === "tempo" ||
        step.segment_type === "tempo_block" ||
        /tempo/i.test(step.label ?? ""),
    );

  if (!hasTempoIdentity) {
    return base;
  }

  return {
    ...base,
    label: "Tempo",
    short: "Tempo",
  };
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
  const workouts = previewPlan.schedule.map((workout) => ({
    id: workout.id,
    date: workout.date,
    weekday: workout.weekday,
    week: workout.week,
    phase: workout.phase,
    type: workout.type,
    title: workout.title,
    notes: workout.notes ?? null,
    steps: normalizeExecutableStepInstructions(workout.steps),
    feedbackMarker: null,
    log: null,
    status: inferWorkoutStatus(workout.type, workout.date, currentDate, null),
  }));

  return {
    mode: "preview",
    source: "preview",
    backend: "preview",
    currentDate,
    planMeta: {
      title: previewPlan.meta.plan_name,
      createdFor: previewPlan.meta.created_for,
      createdAt: previewPlan.meta.created_at,
      startDate: previewPlan.meta.start_date,
      raceDate: previewPlan.meta.race_date ?? null,
      goal: previewPlan.meta.goal,
      source: "preview",
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

export function formatDurationMin(
  durationMin: number | null | undefined,
  unit: "min" | "prime" = "min",
): string {
  if (durationMin == null || !Number.isFinite(durationMin)) {
    return "—";
  }

  const rounded = Math.round(durationMin * 10) / 10;
  const value = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(rounded);

  return unit === "prime" ? `${value}′` : `${value} min`;
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

  for (const [key, value] of Object.entries(target.extra ?? {})) {
    if (typeof value === "string" || typeof value === "number") {
      pushEntry(key, value);
    }
  }

  return entries;
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
