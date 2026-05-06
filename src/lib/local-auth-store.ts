import {
  addDaysIso,
  diffDaysIso,
  deriveWeekStatus,
  getPreviewSnapshot,
  inferWorkoutStatus,
  type RunnerProfileSummary,
  type Step,
  type TrainingSnapshot,
  type WorkoutLog,
  type WorkoutOutcome,
  weekdayLong,
} from "@/lib/training";
import type { LocalAuthConfig } from "@/lib/local-auth";

interface LocalProfileRecord {
  goalType: RunnerProfileSummary["goalType"];
  goalLabel: string;
  baselineSessionsPerWeek: number;
  baselineLongRunKm: number;
  baselineNotes: string | null;
  setupState: "completed";
  setupCompletedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface LocalPlanCycleRecord {
  id: string;
  userId: string;
  status: "active";
  title: string;
  goalSummary: string;
  sourceTemplate: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface LocalPlannedWorkoutRecord {
  id: string;
  planCycleId: string;
  userId: string;
  workoutDate: string;
  weekday: string;
  weekNumber: number;
  phase: string;
  workoutType: "easy" | "steady_or_easy" | "rest" | "long_run" | "quality";
  title: string;
  notes: string | null;
  steps: Step[];
  displayOrder: number;
  createdAt: string;
}

interface LocalWorkoutLogRecord {
  id: string;
  plannedWorkoutId: string;
  userId: string;
  outcome: WorkoutOutcome;
  actualDistanceKm: number | null;
  actualDurationMin: number | null;
  rpe: number | null;
  notes: string | null;
  intervalsCompleted: number | null;
  loggedAt: string;
  updatedAt: string;
}

interface LocalAuthState {
  version: 1;
  userId: string;
  email: string;
  profile: LocalProfileRecord | null;
  planCycle: LocalPlanCycleRecord | null;
  plannedWorkouts: LocalPlannedWorkoutRecord[];
  workoutLogs: LocalWorkoutLogRecord[];
}

const goalLabels = {
  build_consistency: "Build consistency",
  first_race: "Finish a first race",
  distance_build: "Build distance",
} as const;

export async function getLocalAuthSnapshot(config: LocalAuthConfig): Promise<TrainingSnapshot> {
  const state = await readState(config);

  if (!state.profile) {
    return {
      mode: "onboarding",
      source: "persisted",
      backend: "temporary_local",
      currentDate: todayIso(),
      planMeta: null,
      profile: null,
      workouts: [],
      weekStatus: "on_track",
    };
  }

  const ensuredState = state.planCycle ? state : await ensureLocalPlan(state, config);
  const logsByWorkoutId = new Map(
    ensuredState.workoutLogs.map((log) => [log.plannedWorkoutId, log] as const),
  );
  const currentDate = todayIso();
  const workouts = ensuredState.plannedWorkouts
    .slice()
    .sort(
      (left, right) =>
        left.workoutDate.localeCompare(right.workoutDate) || left.displayOrder - right.displayOrder,
    )
    .map((workout) => {
      const log = logsByWorkoutId.get(workout.id) ?? null;
      const mappedLog = log ? mapLocalLog(log) : null;

      return {
        id: workout.id,
        date: workout.workoutDate,
        weekday: workout.weekday,
        week: workout.weekNumber,
        phase: workout.phase,
        type: workout.workoutType,
        title: workout.title,
        notes: workout.notes,
        steps: workout.steps,
        log: mappedLog,
        status: inferWorkoutStatus(
          workout.workoutType,
          workout.workoutDate,
          currentDate,
          mappedLog,
        ),
      };
    });

  return {
    mode: "authenticated",
    source: "persisted",
    backend: "temporary_local",
    currentDate,
    planMeta: {
      title: ensuredState.planCycle!.title,
      createdFor: "You",
      createdAt: ensuredState.planCycle!.createdAt,
      startDate: ensuredState.planCycle!.startDate,
      raceDate: ensuredState.planCycle!.endDate,
      goal: ensuredState.planCycle!.goalSummary,
      source: "persisted",
    },
    profile: mapLocalProfile(ensuredState.profile),
    workouts,
    weekStatus: deriveWeekStatus(workouts, currentDate),
  };
}

export async function completeLocalAuthOnboarding(
  config: LocalAuthConfig,
  input: {
    goalType: RunnerProfileSummary["goalType"];
    baselineSessionsPerWeek: number;
    baselineLongRunKm: number;
    baselineNotes: string | null;
  },
) {
  const state = await readState(config);
  const now = new Date().toISOString();
  const profile: LocalProfileRecord = {
    goalType: input.goalType,
    goalLabel: goalLabels[input.goalType],
    baselineSessionsPerWeek: input.baselineSessionsPerWeek,
    baselineLongRunKm: input.baselineLongRunKm,
    baselineNotes: input.baselineNotes,
    setupState: "completed",
    setupCompletedAt: state.profile?.setupCompletedAt ?? now,
    createdAt: state.profile?.createdAt ?? now,
    updatedAt: now,
  };

  const nextState: LocalAuthState = {
    ...state,
    profile,
  };

  const withPlan = nextState.planCycle ? nextState : await ensureLocalPlan(nextState, config);
  await writeState(config, withPlan);
}

export async function saveLocalAuthWorkoutLog(
  config: LocalAuthConfig,
  input: {
    plannedWorkoutId: string;
    outcome: WorkoutOutcome;
    actualDistanceKm: number | null;
    actualDurationMin: number | null;
    rpe: number | null;
    notes: string | null;
    intervalsCompleted: number | null;
  },
) {
  const state = await readState(config);
  const plannedWorkout = state.plannedWorkouts.find(
    (workout) => workout.id === input.plannedWorkoutId,
  );

  if (!plannedWorkout || plannedWorkout.userId !== config.userId) {
    throw new Error("Planned workout not found.");
  }

  if (plannedWorkout.workoutType === "rest") {
    throw new Error("Rest days cannot be logged as completed workouts.");
  }

  const now = new Date().toISOString();
  const existingIndex = state.workoutLogs.findIndex(
    (log) => log.plannedWorkoutId === input.plannedWorkoutId,
  );
  const nextLog: LocalWorkoutLogRecord = {
    id: existingIndex >= 0 ? state.workoutLogs[existingIndex].id : crypto.randomUUID(),
    plannedWorkoutId: input.plannedWorkoutId,
    userId: config.userId,
    outcome: input.outcome,
    actualDistanceKm: input.outcome === "skipped" ? null : input.actualDistanceKm,
    actualDurationMin: input.outcome === "skipped" ? null : input.actualDurationMin,
    rpe: input.outcome === "skipped" ? null : input.rpe,
    notes: input.notes,
    intervalsCompleted: input.outcome === "skipped" ? null : input.intervalsCompleted,
    loggedAt: existingIndex >= 0 ? state.workoutLogs[existingIndex].loggedAt : now,
    updatedAt: now,
  };

  const workoutLogs = state.workoutLogs.slice();

  if (existingIndex >= 0) {
    workoutLogs[existingIndex] = nextLog;
  } else {
    workoutLogs.push(nextLog);
  }

  await writeState(config, {
    ...state,
    workoutLogs,
  });

  return {
    id: nextLog.id,
  };
}

async function ensureLocalPlan(state: LocalAuthState, config: LocalAuthConfig) {
  if (!state.profile) {
    return state;
  }

  const preview = getPreviewSnapshot();
  const startDate = todayIso();
  const templateStart = preview.planMeta?.startDate ?? startDate;
  const endDate = addDaysIso(
    startDate,
    diffDaysIso(preview.workouts.at(-1)?.date ?? startDate, templateStart),
  );
  const createdAt = new Date().toISOString();
  const planCycle: LocalPlanCycleRecord = {
    id: crypto.randomUUID(),
    userId: config.userId,
    status: "active",
    title: `${goalLabels[state.profile.goalType]} plan`,
    goalSummary: `${goalLabels[state.profile.goalType]} with ${state.profile.baselineSessionsPerWeek} running day${
      state.profile.baselineSessionsPerWeek === 1 ? "" : "s"
    } per week.`,
    sourceTemplate: "baseline-import-v1-local-bypass",
    startDate,
    endDate,
    createdAt,
    updatedAt: createdAt,
  };
  const plannedWorkouts = preview.workouts.map((workout, index) => ({
    id: crypto.randomUUID(),
    planCycleId: planCycle.id,
    userId: config.userId,
    workoutDate: addDaysIso(startDate, diffDaysIso(workout.date, templateStart)),
    weekday: weekdayLong(addDaysIso(startDate, diffDaysIso(workout.date, templateStart))),
    weekNumber: workout.week,
    phase: workout.phase,
    workoutType: workout.type,
    title: workout.title,
    notes: workout.notes,
    steps: workout.steps,
    displayOrder: index,
    createdAt,
  }));
  const nextState = {
    ...state,
    planCycle,
    plannedWorkouts,
  };

  await writeState(config, nextState);
  return nextState;
}

async function readState(config: LocalAuthConfig): Promise<LocalAuthState> {
  const filePath = await resolveStatePath(config);
  const defaultState = buildDefaultState(config);
  const { readFile } = await import("node:fs/promises");

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalAuthState>;

    return {
      ...defaultState,
      ...parsed,
      version: 1,
      userId: config.userId,
      email: config.email,
      profile: parsed.profile ?? null,
      planCycle: parsed.planCycle ?? null,
      plannedWorkouts: parsed.plannedWorkouts ?? [],
      workoutLogs: parsed.workoutLogs ?? [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return defaultState;
    }

    throw error;
  }
}

async function writeState(config: LocalAuthConfig, state: LocalAuthState) {
  const filePath = await resolveStatePath(config);
  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function resolveStatePath(config: LocalAuthConfig) {
  const path = await import("node:path");
  return path.resolve(config.statePath);
}

function buildDefaultState(config: LocalAuthConfig): LocalAuthState {
  return {
    version: 1,
    userId: config.userId,
    email: config.email,
    profile: null,
    planCycle: null,
    plannedWorkouts: [],
    workoutLogs: [],
  };
}

function mapLocalProfile(profile: LocalProfileRecord | null): RunnerProfileSummary | null {
  if (!profile) {
    return null;
  }

  return {
    goalType: profile.goalType,
    goalLabel: profile.goalLabel,
    baselineSessionsPerWeek: profile.baselineSessionsPerWeek,
    baselineLongRunKm: profile.baselineLongRunKm,
    baselineNotes: profile.baselineNotes,
  };
}

function mapLocalLog(log: LocalWorkoutLogRecord): WorkoutLog {
  return {
    id: log.id,
    outcome: log.outcome,
    actualDistanceKm: log.actualDistanceKm,
    actualDurationMin: log.actualDurationMin,
    rpe: log.rpe,
    notes: log.notes,
    intervalsCompleted: log.intervalsCompleted,
    loggedAt: log.loggedAt,
  };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
