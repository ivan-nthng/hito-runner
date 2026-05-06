import planJson from "@/data/training-plan.json";

export type WorkoutType = "easy" | "steady_or_easy" | "rest" | "long_run" | "quality";
export type Status = "completed" | "partial" | "skipped" | "today" | "upcoming" | "rest";
export type WeekStatus = "on_track" | "partially_off_track" | "needs_reset";
export type TrainingMode = "preview" | "onboarding" | "authenticated";
export type WorkoutOutcome = Extract<Status, "completed" | "partial" | "skipped">;

export interface Step {
  type: string;
  duration_min?: number;
  distance_km?: number;
  repeats?: number;
  work?: Step;
  recovery?: Step;
  target?: Record<string, string | number>;
}

export interface WorkoutLog {
  id?: string;
  outcome: WorkoutOutcome;
  actualDistanceKm: number | null;
  actualDurationMin: number | null;
  rpe: number | null;
  notes: string | null;
  intervalsCompleted: number | null;
  loggedAt: string | null;
}

export interface Workout {
  id: string;
  date: string;
  weekday: string;
  week: number;
  phase: string;
  type: WorkoutType;
  title: string;
  notes: string | null;
  steps: Step[];
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
}

export interface TrainingSnapshot {
  mode: TrainingMode;
  source: "preview" | "persisted";
  backend: "preview" | "supabase" | "temporary_local";
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
  backend: "preview" | "supabase" | "temporary_local";
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

let previewSnapshotCache: TrainingSnapshot | null = null;

export function getPreviewSnapshot(): TrainingSnapshot {
  if (previewSnapshotCache) {
    return previewSnapshotCache;
  }

  const currentDate = previewPlan.meta.start_date;
  const workouts = previewPlan.schedule.map((workout) => ({
    id: workout.id,
    date: workout.date,
    weekday: workout.weekday,
    week: workout.week,
    phase: workout.phase,
    type: workout.type,
    title: workout.title,
    notes: workout.notes ?? null,
    steps: workout.steps,
    log: null,
    status: inferWorkoutStatus(workout.type, workout.date, currentDate, null),
  }));

  previewSnapshotCache = {
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

  return previewSnapshotCache;
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

export function workoutDuration(workout: Pick<Workout, "steps">): number {
  let total = 0;

  for (const step of workout.steps) {
    if (step.duration_min) total += step.duration_min;
    if (step.repeats && step.work && step.recovery) {
      total += step.repeats * ((step.work.duration_min || 0) + (step.recovery.duration_min || 0));
    }
  }

  return total;
}

export function workoutDistanceKm(workout: Pick<Workout, "steps" | "type">): number | null {
  let km = 0;
  let anyDistance = false;

  for (const step of workout.steps) {
    if (step.distance_km) {
      km += step.distance_km;
      anyDistance = true;
    }
  }

  if (anyDistance) return km;

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

  return +(duration / pace).toFixed(1);
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

function dateFromIso(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
