import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { TrainingPlanV2 } from "../../src/lib/imported-plan";
import {
  buildStructuredFirstPlanAuthoringInput,
  parseStructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanOnboardingRequestInput,
} from "../../src/lib/structured-first-plan-onboarding";
import { structuredPlanAuthoringInputSchema } from "../../src/lib/structured-plan-authoring";
import type { WeekdayName } from "../../src/lib/weekday-rest-invariants";

export type SegmentRecord = Record<string, unknown>;

const aiFirstPlanFixtureFixedRestDays = ["Wednesday", "Sunday"] as const;

export interface AiFirstPlanBlueprintEnvelopeDependencies {
  assertFixedRestDays: (plan: TrainingPlanV2) => void;
  assertFixedRestDayNames: (plan: TrainingPlanV2, restDays: WeekdayName[], label: string) => void;
  assertNoDefaultEstimatedHrTargets: (plan: TrainingPlanV2, label: string) => void;
  assertRichWorkoutContract: (plan: TrainingPlanV2, label: string) => void;
  assertRoadPerformanceQualityCadence: (plan: TrainingPlanV2, label: string) => void;
  assertWeeklyLongRunDay: (
    plan: TrainingPlanV2,
    expectedWeekday: WeekdayName,
    label: string,
  ) => void;
}

let activeDeps: AiFirstPlanBlueprintEnvelopeDependencies | null = null;

export function withAiFirstPlanBlueprintEnvelopeDependencies<T>(
  providedDeps: AiFirstPlanBlueprintEnvelopeDependencies,
  run: () => T,
) {
  activeDeps = providedDeps;

  try {
    return run();
  } finally {
    activeDeps = null;
  }
}

function deps() {
  assert.ok(activeDeps, "AI first-plan blueprint/envelope doctrine dependencies should be active");

  return activeDeps;
}

export function assertRichWorkoutContract(plan: TrainingPlanV2, label: string) {
  deps().assertRichWorkoutContract(plan, label);
}

export function assertFixedRestDays(plan: TrainingPlanV2) {
  deps().assertFixedRestDays(plan);
}

export function assertFixedRestDayNames(
  plan: TrainingPlanV2,
  restDays: WeekdayName[],
  label: string,
) {
  deps().assertFixedRestDayNames(plan, restDays, label);
}

export function assertWeeklyLongRunDay(
  plan: TrainingPlanV2,
  expectedWeekday: WeekdayName,
  label: string,
) {
  deps().assertWeeklyLongRunDay(plan, expectedWeekday, label);
}

export function assertNoDefaultEstimatedHrTargets(plan: TrainingPlanV2, label: string) {
  deps().assertNoDefaultEstimatedHrTargets(plan, label);
}

export function assertRoadPerformanceQualityCadence(plan: TrainingPlanV2, label: string) {
  deps().assertRoadPerformanceQualityCadence(plan, label);
}

function buildAiFirstPlanRequest(
  goalDistance: StructuredFirstPlanOnboardingRequestInput["goal"]["goalDistance"],
  overrides: Partial<StructuredFirstPlanOnboardingRequestInput> = {},
): StructuredFirstPlanOnboardingRequestInput {
  return {
    profile: { age: 34, weightKg: 72, heightCm: 178 },
    benchmark: { kind: "recent_5k_time", recent5kTime: "24:00" },
    availability: {
      runningDaysPerWeek: 5,
      fixedRestDays: [...aiFirstPlanFixtureFixedRestDays],
      preferredLongRunDay: "Saturday",
    },
    goal: {
      goalDistance,
      goalStyle: "balanced",
      terrainFocus: goalDistance === "mountain_running" ? "mountain" : "standard",
      targetTime: null,
      targetDate: null,
    },
    strength: { preference: "mobility" },
    execution: { watchAccess: "watch_or_app", guidancePreference: "pace" },
    comment: null,
    ...overrides,
  };
}

function buildAiFirstPlanFixturePlan(input: StructuredFirstPlanOnboardingRequestInput) {
  const parsedInput = parseStructuredFirstPlanOnboardingInput(input);
  const authoringInput = buildStructuredFirstPlanAuthoringInput(parsedInput);

  return { input: parsedInput, authoringInput };
}

export function nonRestWorkouts(plan: TrainingPlanV2) {
  return plan.planned_workouts.filter((workout) => workout.workout_type !== "rest");
}

export function allSegments(plan: TrainingPlanV2): SegmentRecord[] {
  return plan.planned_workouts.flatMap((workout) => workout.segments as SegmentRecord[]);
}

export function hasTargetKey(plan: TrainingPlanV2, key: string) {
  return allSegments(plan).some((segment) => {
    const target = segment.target as Record<string, unknown> | undefined;
    const recoveryTarget = segment.recovery_target as Record<string, unknown> | undefined;

    return Boolean(target?.[key] || recoveryTarget?.[key]);
  });
}

function targetHasHr(target: Record<string, unknown> | undefined) {
  return typeof target?.hr_bpm_range === "string" || typeof target?.hr_bpm === "string";
}

export function assertNoHrOnMainTargetsForIdentities(
  plan: TrainingPlanV2,
  identities: string[],
  label: string,
) {
  const identitySet = new Set(identities);
  const offenders = nonRestWorkouts(plan).flatMap((workout) => {
    if (!identitySet.has(workout.source_workout_type ?? "")) {
      return [];
    }

    return (workout.segments as SegmentRecord[])
      .filter((segment) =>
        ["main", "tempo_block", "interval_block", "strides"].includes(
          String(segment.segment_type ?? ""),
        ),
      )
      .filter((segment) => targetHasHr(segment.target as Record<string, unknown> | undefined))
      .map(
        (segment) =>
          String(workout.workout_id) +
          ":" +
          String(workout.source_workout_type) +
          ":" +
          String(segment.label),
      );
  });

  assert.deepEqual(
    offenders,
    [],
    label + ": interval/hill/trail work targets should not carry misleading HR ranges",
  );
}

export function workoutDurationMin(workout: TrainingPlanV2["planned_workouts"][number]) {
  return (workout.segments as SegmentRecord[]).reduce((sum, segment) => {
    const prescription = segment.prescription as Record<string, unknown> | undefined;
    const duration =
      typeof segment.duration_min === "number"
        ? segment.duration_min
        : typeof prescription?.duration_min === "number"
          ? prescription.duration_min
          : 0;

    return sum + duration;
  }, 0);
}

function workoutIdentityLabel(workout: TrainingPlanV2["planned_workouts"][number]) {
  return workout.workout_identity ?? workout.source_workout_type ?? workout.workout_type;
}

export function sourceWorkoutTypes(plan: TrainingPlanV2) {
  return new Set(
    nonRestWorkouts(plan).map((workout) => workout.source_workout_type ?? workout.workout_type),
  );
}

function moderateTouchWorkouts(plan: TrainingPlanV2) {
  const moderateIdentities = new Set([
    "easy_run_with_strides",
    "progression_run",
    "controlled_tempo_session",
    "time_intervals",
    "distance_intervals",
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "half_marathon_threshold_durability",
    "marathon_steady_specificity",
    "race_pace_session",
    "rolling_hills_session",
    "hill_repeats",
    "uphill_repeats",
  ]);

  return nonRestWorkouts(plan).filter((workout) =>
    moderateIdentities.has(workoutIdentityLabel(workout)),
  );
}

export function assertNoTwoQualityWeeks(plan: TrainingPlanV2, label: string) {
  const moderateCountsByWeek = new Map<number, number>();

  for (const workout of moderateTouchWorkouts(plan)) {
    moderateCountsByWeek.set(
      workout.week_number,
      (moderateCountsByWeek.get(workout.week_number) ?? 0) + 1,
    );
  }

  const overloadedWeeks = [...moderateCountsByWeek.entries()]
    .filter(([, count]) => count > 1)
    .map(([weekNumber, count]) => "week " + String(weekNumber) + ":" + String(count));

  assert.deepEqual(overloadedWeeks, [], label + ": should not create two-quality weeks");
}

export function buildAiFirstPlanAuthoringInput(
  overrides: Partial<ReturnType<typeof structuredPlanAuthoringInputSchema.parse>> = {},
) {
  const { authoringInput } = buildAiFirstPlanFixturePlan(
    buildAiFirstPlanRequest("half_marathon", {
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: "2026-07-12",
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
    }),
  );

  return structuredPlanAuthoringInputSchema.parse({
    ...authoringInput,
    ...overrides,
    schedule: {
      ...authoringInput.schedule,
      startDate: "2026-06-01",
      targetDate: "2026-06-14",
      preparationHorizonWeeks: 2,
      ...(overrides.schedule ?? {}),
    },
    availability: {
      ...authoringInput.availability,
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: 5,
      preferredLongRunDay: "Saturday",
      ...(overrides.availability ?? {}),
    },
  });
}

export function buildLongHorizonMarathonAiFirstPlanAuthoringInput() {
  const base = buildAiFirstPlanAuthoringInput();

  return structuredPlanAuthoringInputSchema.parse({
    ...base,
    goal: {
      ...base.goal,
      goalType: "marathon",
      goalLabel: "Marathon target-time plan",
      goalStyle: "target_time",
      targetTime: "3:50:00",
      targetEventName: null,
    },
    schedule: {
      ...base.schedule,
      startDate: "2026-05-29",
      targetDate: "2026-12-11",
      preparationHorizonWeeks: null,
    },
    runnerProfile: {
      ...base.runnerProfile,
      age: 36,
      experienceLevel: "new_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: null,
      baselineLongRunDurationMin: 60,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      ...base.currentLevel,
      recentResultSummary: null,
      recentRaceResults: [],
      recent5kPaceSecondsPerKm: null,
      currentEasyPaceRange: null,
      currentTrainingLoadSummary: null,
    },
    availability: {
      ...base.availability,
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Sunday"],
      unavailableDays: ["Wednesday", "Saturday"],
      maxRunningDaysPerWeek: 5,
      allowBackToBackDays: false,
      preferredLongRunDay: "Sunday",
    },
    preferences: {
      ...base.preferences,
      preferredWorkoutMix: "balanced",
      terrainFocus: "rolling",
      strengthOrMobilityInterest: "mobility",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  });
}

export function readAiFirstPlanReferenceFixture() {
  try {
    return JSON.parse(
      readFileSync(
        "/Users/ivan/Downloads/ivan_half_marathon_training_plan_v2_full_2026-05-05.json",
        "utf8",
      ),
    ) as unknown;
  } catch {
    return null;
  }
}

export function countNonRestWorkouts(plan: TrainingPlanV2) {
  return plan.planned_workouts.filter(
    (workout) => workout.workout_family !== "rest" && workout.workout_type !== "rest",
  ).length;
}
