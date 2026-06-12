import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
  buildAiFirstPlanBlueprintPrompt,
  buildAiFirstPlanBlueprintTrace,
  normalizeAiFirstPlanBlueprintToTrainingPlan,
  type AiFirstPlanBlueprint,
} from "../../src/lib/ai-first-plan-blueprint-authoring";
import { resolveAiFirstPlanBlueprintHorizonStrategy } from "../../src/lib/ai-first-plan-blueprint-horizon";
import { decodeAndValidateAiFirstPlanEnvelope } from "../../src/lib/ai-first-plan-envelope-decode";
import { expandAiFirstPlanEnvelopeToTrainingPlan } from "../../src/lib/ai-first-plan-envelope-expand";
import { buildMockAiFirstPlanEnvelope } from "../../src/lib/ai-first-plan-envelope-policy";
import { AI_FIRST_PLAN_ENVELOPE_SCHEMA_VERSION } from "../../src/lib/ai-first-plan-envelope-schema";
import { buildAiFirstPlanEnvelopeTrace } from "../../src/lib/ai-first-plan-envelope-trace";
import type { TrainingPlanV2 } from "../../src/lib/imported-plan";
import {
  resolveCanonicalWorkoutModel,
  type CalendarIconKey,
  type CanonicalWorkoutFamily,
  type CanonicalWorkoutIdentity,
} from "../../src/lib/rich-workout-model";
import {
  buildStructuredFirstPlanAuthoringInput,
  parseStructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanOnboardingRequestInput,
} from "../../src/lib/structured-first-plan-onboarding";
import {
  structuredPlanAuthoringInputSchema,
  type StructuredPlanAuthoringInput,
} from "../../src/lib/structured-plan-authoring";
import { addDaysIso, weekdayLong } from "../../src/lib/training";
import type { WeekdayName } from "../../src/lib/weekday-rest-invariants";
import { buildMinimalAiFirstPlanBlueprintForAuthoringInput } from "./first-plan-release-gates";

type SegmentRecord = Record<string, unknown>;

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

export function assertAiFirstPlanBlueprintEnvelopeContracts(
  deps: AiFirstPlanBlueprintEnvelopeDependencies,
) {
  activeDeps = deps;

  try {
    assertAiFirstPlanBlueprintGoalFamilyCadence();
    assertAiFirstPlanBlueprintContract();
    assertAiFirstPlanEnvelopeContract();
  } finally {
    activeDeps = null;
  }
}

function deps() {
  assert.ok(activeDeps, "AI first-plan blueprint/envelope doctrine dependencies should be active");

  return activeDeps;
}

function assertRichWorkoutContract(plan: TrainingPlanV2, label: string) {
  deps().assertRichWorkoutContract(plan, label);
}

function assertFixedRestDays(plan: TrainingPlanV2) {
  deps().assertFixedRestDays(plan);
}

function assertFixedRestDayNames(plan: TrainingPlanV2, restDays: WeekdayName[], label: string) {
  deps().assertFixedRestDayNames(plan, restDays, label);
}

function assertWeeklyLongRunDay(plan: TrainingPlanV2, expectedWeekday: WeekdayName, label: string) {
  deps().assertWeeklyLongRunDay(plan, expectedWeekday, label);
}

function assertNoDefaultEstimatedHrTargets(plan: TrainingPlanV2, label: string) {
  deps().assertNoDefaultEstimatedHrTargets(plan, label);
}

function assertRoadPerformanceQualityCadence(plan: TrainingPlanV2, label: string) {
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

function nonRestWorkouts(plan: TrainingPlanV2) {
  return plan.planned_workouts.filter((workout) => workout.workout_type !== "rest");
}

function allSegments(plan: TrainingPlanV2): SegmentRecord[] {
  return plan.planned_workouts.flatMap((workout) => workout.segments as SegmentRecord[]);
}

function hasTargetKey(plan: TrainingPlanV2, key: string) {
  return allSegments(plan).some((segment) => {
    const target = segment.target as Record<string, unknown> | undefined;
    const recoveryTarget = segment.recovery_target as Record<string, unknown> | undefined;

    return Boolean(target?.[key] || recoveryTarget?.[key]);
  });
}

function targetHasHr(target: Record<string, unknown> | undefined) {
  return typeof target?.hr_bpm_range === "string" || typeof target?.hr_bpm === "string";
}

function assertNoHrOnMainTargetsForIdentities(
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

function workoutDurationMin(workout: TrainingPlanV2["planned_workouts"][number]) {
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

function sourceWorkoutTypes(plan: TrainingPlanV2) {
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

function assertNoTwoQualityWeeks(plan: TrainingPlanV2, label: string) {
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

function buildShortRoadEnvelopeAuthoringInput(
  goalType: "5k" | "10k",
): StructuredPlanAuthoringInput {
  const base = buildAiFirstPlanAuthoringInput();

  return structuredPlanAuthoringInputSchema.parse({
    ...base,
    goal: {
      goalType,
      goalLabel: goalType === "5k" ? "5K balanced envelope" : "10K balanced envelope",
      goalStyle: "balanced",
      targetTime: null,
      targetEventName: null,
    },
    schedule: {
      startDate: "2026-05-29",
      targetDate: null,
      preparationHorizonWeeks: 8,
    },
    runnerProfile: {
      ...base.runnerProfile,
      age: 36,
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 4,
      baselineLongRunKm: null,
      baselineLongRunDurationMin: 55,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      ...base.currentLevel,
      recentResultSummary: "Recent 5K benchmark supports broad training guidance.",
      recentRaceResults: [],
      recent5kPaceSecondsPerKm: 330,
      currentEasyPaceRange: null,
      currentTrainingLoadSummary: null,
    },
    availability: {
      ...base.availability,
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Saturday"],
      unavailableDays: ["Wednesday", "Friday", "Sunday"],
      maxRunningDaysPerWeek: 4,
      allowBackToBackDays: false,
      preferredLongRunDay: "Saturday",
    },
    preferences: {
      ...base.preferences,
      preferredWorkoutMix: "balanced",
      terrainFocus: "standard",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes: "Doctrine envelope road-specificity fixture.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  });
}

export function buildBalancedHalfEnvelopeAuthoringInput(): StructuredPlanAuthoringInput {
  const base = buildAiFirstPlanAuthoringInput();

  return structuredPlanAuthoringInputSchema.parse({
    ...base,
    goal: {
      goalType: "half_marathon",
      goalLabel: "Half marathon balanced envelope",
      goalStyle: "balanced",
      targetTime: null,
      targetEventName: "Balanced half marathon plan",
    },
    schedule: {
      startDate: "2026-06-01",
      targetDate: "2026-07-12",
      preparationHorizonWeeks: 6,
    },
    runnerProfile: {
      ...base.runnerProfile,
      age: 38,
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: 11,
      baselineLongRunDurationMin: null,
      preferredEffortLanguage: "mixed",
    },
    currentLevel: {
      ...base.currentLevel,
      recentResultSummary: "Recent 5K time: 24:30.",
      recentRaceResults: [{ distance: "5K", resultTime: "24:30", resultDate: null }],
      recent5kPaceSecondsPerKm: 294,
      currentEasyPaceRange: "6:25-7:20/km",
      currentTrainingLoadSummary: null,
    },
    availability: {
      ...base.availability,
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: 5,
      allowBackToBackDays: false,
      preferredLongRunDay: "Saturday",
    },
    preferences: {
      ...base.preferences,
      preferredWorkoutMix: "balanced",
      terrainFocus: "standard",
      strengthOrMobilityInterest: "mobility",
      indoorTreadmillOk: false,
      notes: "Doctrine envelope balanced half-specificity fixture.",
    },
    execution: {
      watchAccess: "watch_or_app",
      guidancePreference: "mixed",
    },
  });
}

export function buildAiFirstPlanBlueprintFixture(): AiFirstPlanBlueprint {
  const startDate = "2026-06-01";
  const workoutsByDay = [
    {
      family: "easy",
      identity: "easy_aerobic_run",
      icon: "easy",
      title: "Easy aerobic run",
      summary: "Easy support run with relaxed mechanics and a controlled finish.",
      rpe: 4,
      fatigue: "low",
      recovery: "medium",
      segmentIntent: "easy_aerobic",
      metricIntent: "mixed_if_allowed",
    },
    {
      family: "tempo",
      identity: "controlled_tempo_session",
      icon: "tempo",
      title: "Controlled tempo session",
      summary: "Controlled tempo durability without forcing target pace.",
      rpe: 6,
      fatigue: "medium_high",
      recovery: "medium",
      segmentIntent: "tempo_sustained",
      metricIntent: "mixed_if_allowed",
    },
    null,
    {
      family: "steady",
      identity: "steady_aerobic_run",
      icon: "steady",
      title: "Steady aerobic run",
      summary: "Steady support run that builds half-marathon durability.",
      rpe: 5,
      fatigue: "medium",
      recovery: "medium",
      segmentIntent: "steady_aerobic",
      metricIntent: "mixed_if_allowed",
    },
    {
      family: "recovery",
      identity: "recovery_jog",
      icon: "recovery",
      title: "Recovery jog",
      summary: "Very easy recovery day to absorb the week's work.",
      rpe: 3,
      fatigue: "very_low",
      recovery: "high",
      segmentIntent: "recovery",
      metricIntent: "effort_only",
    },
    {
      family: "long",
      identity: "long_aerobic_run",
      icon: "long",
      title: "Long aerobic run",
      summary: "Aerobic long run that preserves durability without adding a second stimulus.",
      rpe: 5,
      fatigue: "medium_high",
      recovery: "high",
      segmentIntent: "long_durability",
      metricIntent: "mixed_if_allowed",
    },
    null,
  ] as const;

  const weeks = [1, 2].map((weekNumber) => ({
    weekNumber,
    phase: weekNumber === 1 ? ("Base" as const) : ("Build" as const),
    theme: weekNumber === 1 ? "Settle into rhythm" : "Add controlled durability",
    microcycleIntent:
      weekNumber === 1
        ? "Introduce half-marathon rhythm while keeping easy days truly easy."
        : "Progress steady durability and keep the long run on Saturday.",
    cutbackWeek: false,
    taperWeek: false,
    longRunIntent: "Keep Saturday durability progressing without forcing race effort.",
    longRunProgression: "Use backend expansion to preserve safe long-run progression.",
    plannedWorkouts: workoutsByDay.flatMap((template, dayIndex) => {
      if (!template) {
        return [];
      }

      const effectiveTemplate =
        weekNumber === 2 && template.identity === "controlled_tempo_session"
          ? {
              ...template,
              family: "easy",
              identity: "easy_aerobic_run",
              icon: "easy",
              title: "Easy aerobic run",
              summary: "Easy taper support run that preserves freshness.",
              rpe: 4,
              fatigue: "low",
              recovery: "medium",
              segmentIntent: "easy_aerobic",
              metricIntent: "mixed_if_allowed",
            }
          : template;
      const date = addDaysIso(startDate, (weekNumber - 1) * 7 + dayIndex);

      return [
        {
          date,
          weekday: weekdayLong(
            date,
          ) as AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["weekday"],
          workoutFamily: effectiveTemplate.family,
          workoutIdentity: effectiveTemplate.identity,
          calendarIconKey: effectiveTemplate.icon,
          title: effectiveTemplate.title,
          summary: effectiveTemplate.summary,
          plannedRpe: effectiveTemplate.rpe,
          estimatedFatigue: effectiveTemplate.fatigue,
          recoveryPriority: effectiveTemplate.recovery,
          segmentIntent: effectiveTemplate.segmentIntent,
          metricIntent: effectiveTemplate.metricIntent,
        },
      ];
    }),
  }));

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: "AI blueprint half marathon",
    generatedFor: "Doctrine fixture",
    goalSummary: "Half marathon target-time plan",
    startDate,
    targetDate: "2026-06-14",
    preparationHorizonWeeks: 2,
    planPreferences: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      maxRunningDaysPerWeek: 5,
    },
    reviewAssumptions: [
      "Target-time work is included only where benchmark support allows pace guidance.",
      "Backend expands compact workout intent into canonical segments and metric truth.",
    ],
    metricPolicySummary:
      "AI supplies metric intent only; backend applies pace and personal HR truth gates.",
    weeks,
  };
}

function buildAiFirstPlanBlueprintIdentityFixture(): AiFirstPlanBlueprint {
  const startDate = "2026-06-01";
  const weekdayOffsets = new Map([
    ["Monday", 0],
    ["Tuesday", 1],
    ["Wednesday", 2],
    ["Thursday", 3],
    ["Friday", 4],
    ["Saturday", 5],
    ["Sunday", 6],
  ]);
  const weeks = [
    {
      phase: "Base" as const,
      theme: "Establish rhythm",
      microcycleIntent: "Pair easy support with threshold durability and a steady-finish long run.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate("Monday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Tuesday",
          "tempo",
          "half_marathon_threshold_durability",
          "tempo",
          "Half marathon threshold durability",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "steady",
          "steady_aerobic_run",
          "steady",
          "Steady aerobic run",
        ),
        blueprintWorkoutTemplate(
          "Friday",
          "intervals",
          "time_intervals",
          "intervals",
          "Time intervals",
        ),
        blueprintWorkoutTemplate(
          "Saturday",
          "long",
          "long_run_with_steady_finish",
          "long",
          "Long run with steady finish",
        ),
      ],
    },
    {
      phase: "Build" as const,
      theme: "Build repeatability",
      microcycleIntent:
        "Use controlled repeats and steady support without adding terrain-specific work.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate("Monday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate(
          "Tuesday",
          "intervals",
          "distance_intervals",
          "intervals",
          "Distance intervals",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "tempo",
          "controlled_tempo_session",
          "tempo",
          "Controlled tempo session",
        ),
        blueprintWorkoutTemplate("Friday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate(
          "Saturday",
          "long",
          "long_run_with_steady_finish",
          "long",
          "Long run with steady finish",
        ),
      ],
    },
  ];

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: "AI blueprint identity matrix",
    generatedFor: "Doctrine fixture",
    goalSummary: "Half marathon identity-aware blueprint expansion",
    startDate,
    targetDate: "2026-06-14",
    preparationHorizonWeeks: 2,
    planPreferences: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      maxRunningDaysPerWeek: 5,
    },
    reviewAssumptions: [
      "Backend expands compact identity intent into executable workout details.",
      "AI supplies no numeric metric truth; backend owns pace and HR policy.",
    ],
    metricPolicySummary:
      "AI supplies metric intent only; backend applies pace and personal HR truth gates.",
    weeks: weeks.map((week, weekIndex) => ({
      weekNumber: weekIndex + 1,
      phase: week.phase,
      theme: week.theme,
      microcycleIntent: week.microcycleIntent,
      cutbackWeek: week.cutbackWeek,
      taperWeek: week.taperWeek,
      longRunIntent: "Keep Saturday durability specific but controlled.",
      longRunProgression: "Backend validates long-run and taper sanity after expansion.",
      plannedWorkouts: week.workouts.map((workout) => {
        const offset = weekIndex * 7 + (weekdayOffsets.get(workout.weekday) ?? 0);
        const date = addDaysIso(startDate, offset);

        return {
          ...workout,
          date,
        };
      }),
    })),
  };
}

function buildAiFirstPlanBlueprintMissingIdentityFixture(): AiFirstPlanBlueprint {
  const startDate = "2026-07-06";
  const weekdayOffsets = new Map([
    ["Monday", 0],
    ["Tuesday", 1],
    ["Wednesday", 2],
    ["Thursday", 3],
    ["Friday", 4],
    ["Saturday", 5],
    ["Sunday", 6],
  ]);
  const weeks = [
    {
      phase: "Base" as const,
      theme: "Sharpen without overload",
      microcycleIntent: "Introduce trail skill, controlled climbing, and mountain time-on-feet.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate("Monday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Tuesday",
          "trail",
          "technical_trail_easy",
          "trail",
          "Technical trail easy run",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "hills",
          "climbing_steady_run",
          "hills",
          "Climbing steady run",
        ),
        blueprintWorkoutTemplate("Friday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate(
          "Saturday",
          "trail",
          "mountain_long_run_time_on_feet",
          "trail",
          "Mountain long run time on feet",
        ),
      ],
    },
    {
      phase: "Build" as const,
      theme: "Rhythm and terrain control",
      microcycleIntent:
        "Pair rolling terrain with controlled downhill durability and hike-run endurance.",
      cutbackWeek: false,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate(
          "Monday",
          "steady",
          "steady_aerobic_run",
          "steady",
          "Steady aerobic run",
        ),
        blueprintWorkoutTemplate(
          "Tuesday",
          "hills",
          "rolling_hills_session",
          "hills",
          "Rolling hills session",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "hills",
          "controlled_downhill_durability",
          "hills",
          "Controlled downhill durability",
        ),
        blueprintWorkoutTemplate("Friday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Saturday",
          "trail",
          "hike_run_endurance",
          "trail",
          "Hike-run endurance",
        ),
      ],
    },
    {
      phase: "Specific" as const,
      theme: "Controlled race rhythm",
      microcycleIntent:
        "Use uphill strength while keeping terrain support and cutback durability conservative.",
      cutbackWeek: true,
      taperWeek: false,
      workouts: [
        blueprintWorkoutTemplate("Monday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate("Tuesday", "hills", "uphill_repeats", "hills", "Uphill repeats"),
        blueprintWorkoutTemplate(
          "Thursday",
          "trail",
          "technical_trail_easy",
          "trail",
          "Technical trail easy run",
        ),
        blueprintWorkoutTemplate("Friday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Saturday",
          "trail",
          "ultra_time_on_feet_durability",
          "trail",
          "Ultra time-on-feet durability",
        ),
      ],
    },
    {
      phase: "Taper" as const,
      theme: "Freshness and terrain control",
      microcycleIntent: "Keep light terrain rhythm and reduce the long-run load for freshness.",
      cutbackWeek: false,
      taperWeek: true,
      workouts: [
        blueprintWorkoutTemplate("Monday", "easy", "easy_aerobic_run", "easy", "Easy aerobic run"),
        blueprintWorkoutTemplate(
          "Tuesday",
          "trail",
          "technical_trail_easy",
          "trail",
          "Technical trail easy run",
        ),
        blueprintWorkoutTemplate(
          "Thursday",
          "steady",
          "steady_aerobic_run",
          "steady",
          "Steady aerobic run",
        ),
        blueprintWorkoutTemplate("Friday", "recovery", "recovery_jog", "recovery", "Recovery jog"),
        blueprintWorkoutTemplate("Saturday", "long", "taper_long_run", "long", "Taper long run"),
      ],
    },
  ].slice(0, 1);

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName: "AI blueprint full identity coverage",
    generatedFor: "Doctrine fixture",
    goalSummary: "Mountain identity-aware blueprint expansion",
    startDate,
    targetDate: "2026-07-12",
    preparationHorizonWeeks: 1,
    planPreferences: {
      preferredRunningDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      fixedRestDays: ["Wednesday", "Sunday"],
      preferredLongRunDay: "Saturday",
      maxRunningDaysPerWeek: 5,
    },
    reviewAssumptions: [
      "Backend expands performance and mountain blueprint identities into executable detail.",
      "AI supplies no numeric metric truth; backend owns pace and HR policy.",
    ],
    metricPolicySummary:
      "AI supplies metric intent only; backend applies pace and personal HR truth gates.",
    weeks: weeks.map((week, weekIndex) => ({
      weekNumber: weekIndex + 1,
      phase: week.phase,
      theme: week.theme,
      microcycleIntent: week.microcycleIntent,
      cutbackWeek: week.cutbackWeek,
      taperWeek: week.taperWeek,
      longRunIntent: "Keep Saturday durability specific but controlled.",
      longRunProgression: "Backend validates long-run and taper sanity after expansion.",
      plannedWorkouts: week.workouts.map((workout) => {
        const offset = weekIndex * 7 + (weekdayOffsets.get(workout.weekday) ?? 0);
        const date = addDaysIso(startDate, offset);

        return {
          ...workout,
          date,
        };
      }),
    })),
  };
}

function blueprintWorkoutTemplate(
  weekday: AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["weekday"],
  workoutFamily: CanonicalWorkoutFamily,
  workoutIdentity: CanonicalWorkoutIdentity,
  calendarIconKey: CalendarIconKey,
  title: string,
): AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number] {
  const segmentIntentByFamily: Record<
    CanonicalWorkoutFamily,
    AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["segmentIntent"]
  > = {
    easy: "easy_aerobic",
    recovery: "recovery",
    steady: "steady_aerobic",
    long: "long_durability",
    tempo: "tempo_sustained",
    intervals: "interval_repeats",
    hills: "hill_strength",
    trail: "trail_terrain",
    progression: "progression",
    race: "race_tuneup",
    rest: "rest",
  };

  return {
    date: null,
    weekday,
    workoutFamily,
    workoutIdentity,
    calendarIconKey,
    title,
    summary: `${title} authored as compact blueprint intent for backend expansion.`,
    plannedRpe:
      workoutFamily === "recovery"
        ? 3
        : workoutFamily === "long"
          ? 5
          : workoutFamily === "easy"
            ? 4
            : 6,
    estimatedFatigue:
      workoutFamily === "recovery"
        ? "very_low"
        : workoutFamily === "long"
          ? "medium_high"
          : "medium",
    recoveryPriority: workoutFamily === "long" || workoutFamily === "recovery" ? "high" : "medium",
    segmentIntent: segmentIntentByFamily[workoutFamily],
    metricIntent: "mixed_if_allowed",
  };
}

function blueprintWorkoutFromIdentity(
  weekday: AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["weekday"],
  workoutIdentity: CanonicalWorkoutIdentity,
) {
  const title = titleFromIdentity(workoutIdentity);
  const resolved = resolveCanonicalWorkoutModel({ workoutIdentity, title });

  return blueprintWorkoutTemplate(
    weekday,
    resolved.workoutFamily,
    resolved.workoutIdentity,
    resolved.calendarIconKey,
    title,
  );
}

function titleFromIdentity(identity: CanonicalWorkoutIdentity) {
  return identity
    .split("_")
    .map((part) => (part.length > 0 ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function buildGoalFamilyCadenceAuthoringInput({
  goalDistance,
  goalStyle = "ambitious",
  targetTime = null,
  targetDate = "2026-07-12",
  terrainFocus = "standard",
  experienceLevel = "experienced_runner",
  runningDays = ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
  horizonWeeks = 6,
}: {
  goalDistance: StructuredFirstPlanOnboardingRequestInput["goal"]["goalDistance"];
  goalStyle?: StructuredFirstPlanOnboardingRequestInput["goal"]["goalStyle"];
  targetTime?: string | null;
  targetDate?: string | null;
  terrainFocus?: StructuredFirstPlanOnboardingRequestInput["goal"]["terrainFocus"];
  experienceLevel?: ReturnType<
    typeof structuredPlanAuthoringInputSchema.parse
  >["runnerProfile"]["experienceLevel"];
  runningDays?: string[];
  horizonWeeks?: number;
}) {
  const startDate = "2026-06-01";
  const baselineLongRunDurationMin =
    goalDistance === "ultra_marathon" || goalDistance === "mountain_running"
      ? 80
      : goalDistance === "marathon"
        ? 75
        : goalDistance === "half_marathon"
          ? 65
          : goalDistance === "build_consistency"
            ? 35
            : 55;

  return buildAiFirstPlanAuthoringInput({
    goal: {
      goalType: goalDistance,
      goalLabel: titleFromIdentity(
        goalDistance === "build_consistency" ? "easy_aerobic_run" : "long_aerobic_run",
      ),
      goalStyle,
      targetTime,
    },
    runnerProfile: {
      age: 34,
      experienceLevel,
      baselineSessionsPerWeek: runningDays.length,
      baselineLongRunDurationMin,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "mixed",
    },
    preferences: {
      terrainFocus,
      preferredWorkoutMix: "balanced",
      strengthTraining: "some",
    },
    schedule: {
      startDate,
      targetDate,
      preparationHorizonWeeks: horizonWeeks,
    },
    availability: {
      preferredRunningDays: runningDays,
      unavailableDays: ["Wednesday", "Sunday"],
      maxRunningDaysPerWeek: runningDays.length,
      preferredLongRunDay: "Saturday",
    },
  });
}

function buildGoalFamilyCadenceBlueprint({
  planName,
  goalSummary,
  authoringInput,
  weeklyIdentities,
}: {
  planName: string;
  goalSummary: string;
  authoringInput: ReturnType<typeof structuredPlanAuthoringInputSchema.parse>;
  weeklyIdentities: CanonicalWorkoutIdentity[][];
}): AiFirstPlanBlueprint {
  const weekdayOffsets = new Map([
    ["Monday", 0],
    ["Tuesday", 1],
    ["Wednesday", 2],
    ["Thursday", 3],
    ["Friday", 4],
    ["Saturday", 5],
    ["Sunday", 6],
  ]);
  const runningDays = authoringInput.availability.preferredRunningDays;

  return {
    schemaVersion: AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    planName,
    generatedFor: "Goal-family doctrine fixture",
    goalSummary,
    startDate: authoringInput.schedule.startDate,
    targetDate: authoringInput.schedule.targetDate,
    preparationHorizonWeeks: authoringInput.schedule.preparationHorizonWeeks,
    planPreferences: {
      preferredRunningDays: runningDays,
      fixedRestDays: authoringInput.availability.unavailableDays,
      preferredLongRunDay: authoringInput.availability.preferredLongRunDay,
      maxRunningDaysPerWeek: authoringInput.availability.maxRunningDaysPerWeek,
    },
    reviewAssumptions: ["Goal-family identity cadence is backend-validated."],
    metricPolicySummary: "Backend owns pace and HR target truth.",
    weeks: weeklyIdentities.map((identities, weekIndex) => ({
      weekNumber: weekIndex + 1,
      phase:
        weekIndex >= weeklyIdentities.length - 1
          ? ("Taper" as const)
          : weekIndex >= Math.floor(weeklyIdentities.length * 0.6)
            ? ("Specific" as const)
            : weekIndex >= Math.floor(weeklyIdentities.length * 0.25)
              ? ("Build" as const)
              : ("Base" as const),
      theme: `Week ${weekIndex + 1} goal-family cadence`,
      microcycleIntent: `Use ${goalSummary} identities without random filler.`,
      cutbackWeek: weekIndex === 2,
      taperWeek: weekIndex >= weeklyIdentities.length - 1,
      longRunIntent: "Keep the Saturday long-run slot durable and controlled.",
      longRunProgression: "Backend validates long-run and taper sanity after expansion.",
      plannedWorkouts: identities.map((identity, dayIndex) => {
        const weekday = runningDays[dayIndex]!;
        const date = addDaysIso(
          authoringInput.schedule.startDate,
          weekIndex * 7 + (weekdayOffsets.get(weekday) ?? 0),
        );

        return {
          ...blueprintWorkoutFromIdentity(
            weekday as AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number]["weekday"],
            identity,
          ),
          date,
        };
      }),
    })),
  };
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

function assertAiFirstPlanBlueprintGoalFamilyCadence() {
  const fiveDay = ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"];
  const cases = [
    {
      label: "beginner consistency",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "build_consistency",
        goalStyle: "relaxed",
        targetDate: null,
        experienceLevel: "new_runner",
        runningDays: ["Monday", "Thursday", "Saturday"],
      }),
      weeks: Array.from({ length: 6 }, (_value, index) => [
        index === 2 ? "cutback_aerobic_run" : "easy_aerobic_run",
        "steady_aerobic_run",
        index === 5 ? "taper_long_run" : "long_aerobic_run",
      ]),
      expected: ["easy_aerobic_run", "steady_aerobic_run"],
      forbidden: ["controlled_tempo_session", "time_intervals", "race_pace_session"],
      cadence: [],
    },
    {
      label: "5K supported",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "5k",
        goalStyle: "ambitious",
        runningDays: fiveDay,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "5k_sharpening_repeats",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "time_intervals",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "distance_intervals",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
        ],
        [
          "easy_aerobic_run",
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "5k_sharpening_repeats",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "taper_tuneup_run",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: ["5k_sharpening_repeats", "time_intervals"],
      forbidden: ["10k_rhythm_intervals", "marathon_steady_specificity"],
      cadence: [
        "5k_sharpening_repeats",
        "time_intervals",
        "distance_intervals",
        "controlled_tempo_session",
        "taper_tuneup_run",
      ],
    },
    {
      label: "10K supported",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "10k",
        goalStyle: "ambitious",
        runningDays: fiveDay,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "10k_rhythm_intervals",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "time_intervals",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
        ],
        [
          "easy_aerobic_run",
          "distance_intervals",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "race_pace_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "taper_tuneup_run",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: ["10k_rhythm_intervals", "race_pace_session"],
      forbidden: ["5k_sharpening_repeats", "mountain_long_run_time_on_feet"],
      cadence: [
        "10k_rhythm_intervals",
        "controlled_tempo_session",
        "time_intervals",
        "distance_intervals",
        "race_pace_session",
        "taper_tuneup_run",
      ],
    },
    {
      label: "half marathon target-time",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        targetTime: "2:00:00",
        runningDays: fiveDay,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "half_marathon_threshold_durability",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "distance_intervals",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
        ],
        [
          "easy_aerobic_run",
          "race_pace_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "half_marathon_threshold_durability",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "taper_tuneup_run",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: ["half_marathon_threshold_durability", "controlled_tempo_session"],
      forbidden: ["5k_sharpening_repeats", "mountain_long_run_time_on_feet"],
      cadence: [
        "half_marathon_threshold_durability",
        "controlled_tempo_session",
        "long_run_with_steady_finish",
        "taper_tuneup_run",
      ],
    },
    {
      label: "half marathon balanced supported",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "half_marathon",
        goalStyle: "balanced",
        targetTime: null,
        runningDays: fiveDay,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "progression_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "half_marathon_threshold_durability",
          "steady_aerobic_run",
          "recovery_jog",
          "long_run_with_steady_finish",
        ],
        [
          "easy_aerobic_run",
          "taper_tuneup_run",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: ["progression_run", "long_run_with_steady_finish"],
      forbidden: ["5k_sharpening_repeats", "race_pace_session", "mountain_long_run_time_on_feet"],
      cadence: [],
    },
    {
      label: "marathon",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "marathon",
        goalStyle: "target_time",
        targetTime: "4:15:00",
        runningDays: fiveDay,
        horizonWeeks: 12,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "marathon_steady_specificity",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "marathon_steady_specificity",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
        ],
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "marathon_steady_specificity",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "taper_tuneup_run",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
        [
          "easy_aerobic_run",
          "marathon_steady_specificity",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
        ],
        [
          "easy_aerobic_run",
          "marathon_steady_specificity",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "taper_tuneup_run",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
        [
          "easy_aerobic_run",
          "taper_tuneup_run",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: ["marathon_steady_specificity", "controlled_tempo_session"],
      forbidden: ["5k_sharpening_repeats", "10k_rhythm_intervals"],
      cadence: ["marathon_steady_specificity", "controlled_tempo_session", "taper_tuneup_run"],
    },
    {
      label: "ultra",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "ultra_marathon",
        goalStyle: "balanced",
        runningDays: fiveDay,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "technical_trail_easy",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "rolling_hills_session",
          "steady_aerobic_run",
          "recovery_jog",
          "hike_run_endurance",
        ],
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "technical_trail_easy",
          "steady_aerobic_run",
          "recovery_jog",
          "ultra_time_on_feet_durability",
        ],
        [
          "easy_aerobic_run",
          "technical_trail_easy",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: ["ultra_time_on_feet_durability", "hike_run_endurance"],
      forbidden: ["5k_sharpening_repeats", "race_pace_session"],
      cadence: [
        "ultra_time_on_feet_durability",
        "hike_run_endurance",
        "technical_trail_easy",
        "rolling_hills_session",
        "climbing_steady_run",
      ],
    },
    {
      label: "mountain/trail",
      authoringInput: buildGoalFamilyCadenceAuthoringInput({
        goalDistance: "mountain_running",
        goalStyle: "ambitious",
        terrainFocus: "mountain",
        runningDays: fiveDay,
      }),
      weeks: [
        [
          "easy_aerobic_run",
          "technical_trail_easy",
          "climbing_steady_run",
          "recovery_jog",
          "mountain_long_run_time_on_feet",
        ],
        [
          "easy_aerobic_run",
          "steady_aerobic_run",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "controlled_downhill_durability",
          "steady_aerobic_run",
          "recovery_jog",
          "hike_run_endurance",
        ],
        [
          "easy_aerobic_run",
          "rolling_hills_session",
          "steady_aerobic_run",
          "recovery_jog",
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "uphill_repeats",
          "climbing_steady_run",
          "recovery_jog",
          "mountain_long_run_time_on_feet",
        ],
        [
          "easy_aerobic_run",
          "technical_trail_easy",
          "steady_aerobic_run",
          "recovery_jog",
          "taper_long_run",
        ],
      ],
      expected: [
        "technical_trail_easy",
        "controlled_downhill_durability",
        "mountain_long_run_time_on_feet",
      ],
      forbidden: ["5k_sharpening_repeats", "race_pace_session"],
      cadence: [
        "technical_trail_easy",
        "controlled_downhill_durability",
        "rolling_hills_session",
        "uphill_repeats",
        "mountain_long_run_time_on_feet",
      ],
    },
  ] as const;

  for (const testCase of cases) {
    const result = normalizeAiFirstPlanBlueprintToTrainingPlan({
      blueprint: buildGoalFamilyCadenceBlueprint({
        planName: `${testCase.label} cadence`,
        goalSummary: testCase.label,
        authoringInput: testCase.authoringInput,
        weeklyIdentities: testCase.weeks,
      }),
      authoringInput: testCase.authoringInput,
    });

    assert.equal(
      result.ok,
      true,
      result.ok
        ? `${testCase.label} goal-family cadence should normalize`
        : `${testCase.label} goal-family cadence should normalize: ${JSON.stringify(result.issues)}`,
    );

    if (!result.ok) continue;

    const firstSix = firstSixWeekIdentityReport(result.canonicalPlan);
    const identities = new Set(firstSix.flat());

    for (const expected of testCase.expected) {
      assert.ok(identities.has(expected), `${testCase.label}: expected ${expected}`);
    }

    for (const forbidden of testCase.forbidden) {
      assert.ok(!identities.has(forbidden), `${testCase.label}: should not include ${forbidden}`);
    }

    if (testCase.cadence.length > 0) {
      assertGoalFamilyCadence(firstSix, [...testCase.cadence], testCase.label);
      assert.ok(
        !onlyGenericSupportIdentities(firstSix),
        `${testCase.label}: supported plan should not collapse into generic support filler`,
      );
    }
  }

  const genericBalancedHalfInput = buildGoalFamilyCadenceAuthoringInput({
    goalDistance: "half_marathon",
    goalStyle: "balanced",
    targetTime: null,
    runningDays: fiveDay,
  });
  const genericBalancedHalfResult = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: buildGoalFamilyCadenceBlueprint({
      planName: "Generic balanced half cadence should fail",
      goalSummary: "balanced half without early specificity",
      authoringInput: genericBalancedHalfInput,
      weeklyIdentities: Array.from({ length: 6 }, (_value, index) => [
        "easy_aerobic_run",
        "steady_aerobic_run",
        "steady_aerobic_run",
        "recovery_jog",
        index === 2 ? "cutback_long_run" : index === 5 ? "taper_long_run" : "long_aerobic_run",
      ]),
    }),
    authoringInput: genericBalancedHalfInput,
  });

  assert.equal(
    genericBalancedHalfResult.ok,
    false,
    "supported balanced half-marathon blueprints should not pass with empty early cadence",
  );

  if (!genericBalancedHalfResult.ok) {
    assert.ok(
      genericBalancedHalfResult.issues.some(
        (issue) => issue.code === "missing_required_goal_family_cadence",
      ),
      "supported balanced half-marathon fallback should explain missing required cadence",
    );
  }

  assertMarathonCadenceAvoidsPostLongRunQuality();
}

function firstSixWeekIdentityReport(plan: TrainingPlanV2) {
  return Array.from({ length: 6 }, (_value, weekIndex) =>
    nonRestWorkouts(plan)
      .filter((workout) => workout.week_number === weekIndex + 1)
      .map(
        (workout) =>
          workout.source_workout_type ?? workout.workout_identity ?? workout.workout_type,
      ),
  );
}

function onlyGenericSupportIdentities(firstSixWeekIdentities: Array<Array<string | null>>) {
  const generic = new Set([
    "easy_aerobic_run",
    "steady_aerobic_run",
    "recovery_jog",
    "long_aerobic_run",
  ]);

  return firstSixWeekIdentities.flat().every((identity) => identity && generic.has(identity));
}

function assertGoalFamilyCadence(
  firstSixWeekIdentities: Array<Array<string | null>>,
  cadenceIdentities: string[],
  label: string,
) {
  const cadenceSet = new Set(cadenceIdentities);

  for (let index = 0; index < firstSixWeekIdentities.length; index += 2) {
    const current = firstSixWeekIdentities[index] ?? [];
    const next = firstSixWeekIdentities[index + 1] ?? [];
    const hasCadence = [...current, ...next].some((identity) =>
      identity ? cadenceSet.has(identity) : false,
    );

    assert.ok(
      hasCadence,
      `${label}: expected goal-family cadence in weeks ${index + 1}-${index + 2}`,
    );
  }
}

function assertMarathonCadenceAvoidsPostLongRunQuality() {
  const authoringInput = buildAiFirstPlanAuthoringInput({
    goal: {
      goalType: "marathon",
      goalLabel: "Marathon · Balanced cadence placement",
      goalStyle: "balanced",
      targetTime: null,
    },
    schedule: {
      startDate: "2026-05-29",
      targetDate: null,
      preparationHorizonWeeks: 16,
    },
    runnerProfile: {
      age: 38,
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunDurationMin: 120,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "rpe",
    },
    currentLevel: {
      recentResultSummary: null,
      recentRaceResults: [],
      recent5kPaceSecondsPerKm: null,
      currentEasyPaceRange: null,
      currentTrainingLoadSummary: null,
    },
    availability: {
      preferredRunningDays: ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"],
      unavailableDays: ["Tuesday", "Thursday"],
      maxRunningDaysPerWeek: 5,
      allowBackToBackDays: false,
      preferredLongRunDay: "Sunday",
    },
    execution: {
      watchAccess: "unknown",
      guidancePreference: "effort",
    },
  });

  const trace = buildAiFirstPlanBlueprintTrace({
    authoringInput,
    blueprint: null,
    normalizedWorkouts: null,
    sourceStatus: "blueprint_unavailable",
    sourceKind: "ai_first_plan_blueprint_v1",
    fallbackReason: null,
    issues: [],
    repairs: [],
  });
  const cadenceWeekdays = new Set(trace.requiredCadenceSlots.map((slot) => slot.weekday));

  assert.ok(
    cadenceWeekdays.has("Wednesday") || cadenceWeekdays.has("Friday"),
    "marathon Sunday-long cadence should choose Wednesday or Friday quality",
  );
  assert.ok(
    !cadenceWeekdays.has("Monday"),
    "marathon Sunday-long cadence must not force Monday quality after Sunday long run",
  );
  assert.ok(
    !cadenceWeekdays.has("Saturday"),
    "marathon Sunday-long cadence must not force Saturday quality before Sunday long run",
  );

  const prompt = buildAiFirstPlanBlueprintPrompt({ authoringInput, today: "2026-05-28" });
  const promptSlots = extractRequiredWorkoutSlotsFromPrompt(prompt.userPrompt);
  const firstWeek = promptSlots[0]!;
  const sundayLongSlot = firstWeek.slots.find((slot) => slot.weekday === "Sunday");
  const mondaySlot = firstWeek.slots.find((slot) => slot.weekday === "Monday");
  const qualitySlot = promptSlots.flatMap((week) => week.slots).find((slot) => slot.mustBeQuality);

  assert.equal(sundayLongSlot?.mustBeLongRun, true, "Sunday should remain the long-run slot");
  assert.equal(
    mondaySlot?.mustBeQuality,
    false,
    "Monday after Sunday long run should not be marked as required quality",
  );
  assert.ok(
    qualitySlot && ["Wednesday", "Friday"].includes(qualitySlot.weekday),
    "required quality slot should land on Wednesday or Friday when Sunday is long run",
  );
}

function extractRequiredWorkoutSlotsFromPrompt(userPrompt: string): Array<{
  weekNumber: number;
  slots: Array<{
    date: string;
    weekday: string;
    mustBeLongRun: boolean;
    mustBeQuality: boolean;
  }>;
}> {
  const match = userPrompt.match(
    /Required authored workout slots:\n(?<json>[\s\S]*?)\nUse every required slot exactly once/,
  );

  assert.ok(match?.groups?.json, "prompt should include parseable required workout slots JSON");

  return JSON.parse(match.groups.json) as Array<{
    weekNumber: number;
    slots: Array<{
      date: string;
      weekday: string;
      mustBeLongRun: boolean;
      mustBeQuality: boolean;
    }>;
  }>;
}

function assertAiFirstPlanBlueprintContract() {
  const authoringInput = buildAiFirstPlanAuthoringInput();
  const referenceFixture = readAiFirstPlanReferenceFixture();
  const prompt = buildAiFirstPlanBlueprintPrompt({
    authoringInput,
    today: "2026-05-26",
    referenceExample: referenceFixture,
  });

  assert.equal(
    prompt.responseSchema.properties.schemaVersion.enum[0],
    AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
    "AI first-plan blueprint prompt should expose the blueprint schema version",
  );
  assert.match(
    prompt.systemPrompt,
    /backend expands it into canonical training-plan-v2/,
    "AI first-plan blueprint prompt should make backend expansion ownership explicit",
  );
  assert.doesNotMatch(
    prompt.userPrompt,
    /garmin_sync_placeholder|completion_state|user_feedback_placeholder/,
    "AI first-plan blueprint prompt must not include runtime placeholder truth",
  );
  assert.match(
    prompt.userPrompt,
    /Required authored workout slots/,
    "AI first-plan blueprint prompt should provide exact required date slots",
  );
  assert.match(
    prompt.userPrompt,
    /mustBeQuality/,
    "AI first-plan blueprint prompt should require quality slots for supported road target-time plans",
  );
  assert.match(
    prompt.userPrompt,
    /Goal-family identity policy/,
    "AI first-plan blueprint prompt should expose the backend goal-family identity policy",
  );
  assert.match(
    prompt.systemPrompt,
    /required cadence slots/,
    "AI first-plan blueprint prompt should require goal-family cadence slots for supported plans",
  );
  assert.equal(
    prompt.responseSchema.properties.weeks.items.properties.plannedWorkouts.minItems,
    authoringInput.availability.maxRunningDaysPerWeek,
    "AI first-plan blueprint response schema should require the validated weekly running-day count",
  );
  assert.equal(
    prompt.responseSchema.properties.weeks.items.properties.plannedWorkouts.maxItems,
    authoringInput.availability.maxRunningDaysPerWeek,
    "AI first-plan blueprint response schema should reject extra authored weekly workouts",
  );
  assert.doesNotMatch(
    JSON.stringify(prompt.responseSchema.properties.weeks.items.properties.plannedWorkouts),
    /rest_and_recovery/,
    "AI first-plan blueprint authored workout schema should exclude rest identities",
  );

  const blueprint = buildAiFirstPlanBlueprintFixture();
  const normalized = normalizeAiFirstPlanBlueprintToTrainingPlan({ blueprint, authoringInput });

  assert.equal(
    normalized.ok,
    true,
    normalized.ok
      ? "valid compact AI first-plan blueprint should normalize"
      : `valid compact AI first-plan blueprint should normalize: ${JSON.stringify(normalized.issues)}`,
  );

  if (normalized.ok) {
    assert.equal(
      normalized.metadata.status,
      "ai_authored",
      `valid AI first-plan blueprint should report ai_authored metadata: ${JSON.stringify(
        normalized.metadata.repairs,
      )}`,
    );
    assert.equal(
      normalized.metadata.source,
      "openai_ai_first_plan_blueprint",
      "valid AI first-plan blueprint should report blueprint source metadata",
    );
    assert.equal(
      normalized.canonicalPlan.source_kind,
      "ai_first_plan_blueprint_v1",
      "AI first-plan blueprint output should be source-visible canonical training-plan-v2",
    );
    assertRichWorkoutContract(normalized.canonicalPlan, "AI first-plan blueprint output");
    assertFixedRestDays(normalized.canonicalPlan);
    assertNoDefaultEstimatedHrTargets(
      normalized.canonicalPlan,
      "AI first-plan blueprint age-estimated HR exclusion",
    );
    assert.equal(
      hasTargetKey(normalized.canonicalPlan, "pace_min_per_km_range"),
      true,
      "AI first-plan blueprint may keep pace only when backend gates allow it",
    );
    assertRoadPerformanceQualityCadence(normalized.canonicalPlan, "valid AI first-plan blueprint");
    assert.equal(
      normalized.canonicalPlan.planned_workouts.some(
        (workout) =>
          workout.workout_type !== "rest" &&
          workout.segments.length < 3 &&
          workoutDurationMin(workout) >= 35,
      ),
      false,
      "AI first-plan blueprint expansion must not create one-block substantial workouts",
    );
  }

  const identityAuthoringInput = buildAiFirstPlanAuthoringInput({
    schedule: {
      startDate: "2026-06-01",
      targetDate: "2026-06-14",
      preparationHorizonWeeks: 2,
    },
    currentLevel: {
      recentRaceResults: [],
      recent5kPaceSecondsPerKm: 288,
      currentTrainingLoadSummary: "Identity coverage fixture bypasses beginner cadence quota.",
    },
  });
  const identityBlueprint = buildAiFirstPlanBlueprintIdentityFixture();
  const identityNormalized = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: identityBlueprint,
    authoringInput: identityAuthoringInput,
  });

  assert.equal(
    identityNormalized.ok,
    true,
    identityNormalized.ok
      ? "AI first-plan blueprint identity matrix should normalize"
      : `AI first-plan blueprint identity matrix should normalize: ${JSON.stringify(
          identityNormalized.issues,
        )}`,
  );

  if (identityNormalized.ok) {
    const plan = identityNormalized.canonicalPlan;
    assertBlueprintIdentityExpansion(plan, "half_marathon_threshold_durability", [
      /threshold/i,
      /sustained|durability/i,
    ]);
    assertBlueprintIdentityExpansion(plan, "long_run_with_steady_finish", [/steady finish/i]);
    assertBlueprintIdentityExpansion(plan, "time_intervals", [/repeat|3 min/i], true);
    assertBlueprintIdentityExpansion(plan, "distance_intervals", [/400m|distance/i], true);
    assertBlueprintIdentityExpansion(plan, "controlled_tempo_session", [/tempo|controlled/i]);
    assertBlueprintIdentityExpansion(plan, "recovery_jog", [/recovery/i]);
    assertBlueprintIdentityExpansion(plan, "steady_aerobic_run", [/steady aerobic/i]);
    assertBlueprintIdentityExpansion(plan, "easy_aerobic_run", [/easy aerobic|conversational/i]);
    assert.deepEqual(
      nonRestWorkouts(plan)
        .filter((workout) => workoutDurationMin(workout) >= 35)
        .filter((workout) => workout.segments.length < 3)
        .map((workout) => workout.source_workout_type),
      [],
      "AI first-plan blueprint identity expansion should not create substantial one-block shells",
    );
    assertNoHrOnMainTargetsForIdentities(
      plan,
      [
        "time_intervals",
        "distance_intervals",
        "rolling_hills_session",
        "uphill_repeats",
        "technical_trail_easy",
        "climbing_steady_run",
      ],
      "AI first-plan blueprint identity expansion",
    );
  }

  const missingIdentityAuthoringInput = buildAiFirstPlanAuthoringInput({
    goal: {
      goalType: "mountain_running",
      goalLabel: "Mountain running",
      goalStyle: "ambitious",
      targetTime: null,
    },
    preferences: {
      terrainFocus: "mountain",
      preferredWorkoutMix: "balanced",
      strengthTraining: "some",
    },
    schedule: {
      startDate: "2026-07-06",
      targetDate: "2026-07-12",
      preparationHorizonWeeks: 1,
    },
  });
  const missingIdentityBlueprint = buildAiFirstPlanBlueprintMissingIdentityFixture();
  const missingIdentityNormalized = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: missingIdentityBlueprint,
    authoringInput: missingIdentityAuthoringInput,
  });

  assert.equal(
    missingIdentityNormalized.ok,
    true,
    missingIdentityNormalized.ok
      ? "AI first-plan blueprint full identity coverage should normalize"
      : `AI first-plan blueprint full identity coverage should normalize: ${JSON.stringify(
          missingIdentityNormalized.issues,
        )}`,
  );

  if (missingIdentityNormalized.ok) {
    const plan = missingIdentityNormalized.canonicalPlan;
    assertBlueprintIdentityExpansion(plan, "technical_trail_easy", [/technical|trail|footing/i]);
    assertBlueprintIdentityExpansion(plan, "climbing_steady_run", [/climbing|hill|grade/i]);
    assertBlueprintIdentityExpansion(plan, "mountain_long_run_time_on_feet", [
      /mountain|time-on-feet|terrain/i,
      /fueling|hydration|effort/i,
    ]);
    assert.deepEqual(
      nonRestWorkouts(plan)
        .filter((workout) => workoutDurationMin(workout) >= 35)
        .filter((workout) => workout.segments.length < 3)
        .map((workout) => workout.source_workout_type),
      [],
      "AI first-plan blueprint full identity coverage should not create substantial one-block shells",
    );
    assertNoHrOnMainTargetsForIdentities(
      plan,
      ["mountain_long_run_time_on_feet"],
      "AI first-plan blueprint full identity coverage",
    );
  }

  const noPaceAuthoringInput = buildAiFirstPlanAuthoringInput({
    currentLevel: { recentRaceResults: [], recent5kPaceSecondsPerKm: 288 },
    runnerProfile: {
      age: 36,
      experienceLevel: "consistent_runner",
      baselineSessionsPerWeek: 5,
      baselineLongRunDurationMin: 65,
      recentInjuryRecoveryContext: null,
      preferredEffortLanguage: "rpe",
    },
    execution: { watchAccess: "none", guidancePreference: "effort" },
  });
  const unsupportedPaceNormalized = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint,
    authoringInput: noPaceAuthoringInput,
  });

  assert.equal(
    unsupportedPaceNormalized.ok,
    true,
    unsupportedPaceNormalized.ok
      ? "AI first-plan blueprint normalizer should repair unsupported pace intent instead of failing"
      : `AI first-plan blueprint normalizer should repair unsupported pace intent instead of failing: ${JSON.stringify(
          unsupportedPaceNormalized.issues,
        )}`,
  );

  if (unsupportedPaceNormalized.ok) {
    assert.equal(
      hasTargetKey(unsupportedPaceNormalized.canonicalPlan, "pace_min_per_km_range"),
      false,
      "AI first-plan blueprint normalizer must strip unsupported pace targets",
    );
  }

  const fixedRestViolationBlueprint = structuredClone(blueprint);
  fixedRestViolationBlueprint.weeks[0]!.plannedWorkouts[0]!.date = "2026-06-03";
  fixedRestViolationBlueprint.weeks[0]!.plannedWorkouts[0]!.weekday = "Wednesday";
  const fixedRestViolation = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: fixedRestViolationBlueprint,
    authoringInput,
  });

  assert.equal(fixedRestViolation.ok, false, "blueprint fixed rest-day violations are rejected");

  const missingQualityBlueprint = structuredClone(blueprint);
  missingQualityBlueprint.weeks[0]!.plannedWorkouts[1] = {
    ...missingQualityBlueprint.weeks[0]!.plannedWorkouts[1]!,
    workoutFamily: "steady",
    workoutIdentity: "steady_aerobic_run",
    calendarIconKey: "steady",
    title: "Steady aerobic run",
    segmentIntent: "steady_aerobic",
  };
  const missingQualityResult = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: missingQualityBlueprint,
    authoringInput,
  });

  assert.equal(
    missingQualityResult.ok,
    false,
    "supported road target-time blueprints must preserve required weekly quality cadence",
  );

  const invalidTaxonomyBlueprint = structuredClone(blueprint) as unknown as Record<string, unknown>;
  (
    (
      invalidTaxonomyBlueprint.weeks as Array<{ plannedWorkouts: Array<Record<string, unknown>> }>
    )[0]!.plannedWorkouts[0] as Record<string, unknown>
  ).workoutIdentity = "banana_repeats";
  const invalidTaxonomyResult = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: invalidTaxonomyBlueprint,
    authoringInput,
  });

  assert.equal(invalidTaxonomyResult.ok, false, "invalid blueprint taxonomy is rejected");

  const partialLongHorizonAuthoringInput = buildLongHorizonMarathonAiFirstPlanAuthoringInput();
  const partialLongHorizonBlueprint = {
    ...buildMinimalAiFirstPlanBlueprintForAuthoringInput(partialLongHorizonAuthoringInput, {
      horizonWeeks: 29,
    }),
  };
  partialLongHorizonBlueprint.weeks = partialLongHorizonBlueprint.weeks.slice(0, 5);
  const partialLongHorizonResult = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: partialLongHorizonBlueprint,
    authoringInput: partialLongHorizonAuthoringInput,
  });

  assert.equal(
    partialLongHorizonResult.ok,
    false,
    "partial long-horizon AI blueprint responses must be rejected before review",
  );

  if (!partialLongHorizonResult.ok) {
    assert.equal(
      partialLongHorizonResult.reason,
      "ai_first_plan_blueprint_incomplete",
      "partial long-horizon AI blueprint responses should expose incomplete-blueprint reason",
    );
    assert.ok(
      partialLongHorizonResult.issues.some((issue) => issue.code === "incomplete_blueprint_weeks"),
      "partial long-horizon AI blueprint responses should report missing weeks",
    );
    assert.ok(
      partialLongHorizonResult.issues.some(
        (issue) => issue.code === "incomplete_blueprint_required_slots",
      ),
      "partial long-horizon AI blueprint responses should report missing required slots",
    );
    assert.equal(
      partialLongHorizonResult.fallback.blueprintTrace?.blueprintCompleteness?.expectedWeekCount,
      29,
      "partial blueprint trace should expose the expected 29-week horizon",
    );
    assert.equal(
      partialLongHorizonResult.fallback.blueprintTrace?.blueprintCompleteness?.actualWeekCount,
      5,
      "partial blueprint trace should expose the authored 5-week response",
    );
    assert.equal(
      partialLongHorizonResult.fallback.blueprintTrace?.deterministicFallbackBoundary.used,
      false,
      "partial blueprint rejection must not silently use deterministic fallback",
    );
  }

  const fakeHrBlueprint = structuredClone(blueprint);
  fakeHrBlueprint.weeks[0]!.plannedWorkouts[0]!.summary =
    "Easy run with fake 150-160 bpm personal threshold HR.";
  const fakeHrResult = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: fakeHrBlueprint,
    authoringInput,
  });

  assert.equal(fakeHrResult.ok, false, "fake personalized HR claims in blueprint are rejected");
}

function assertAiFirstPlanEnvelopeContract() {
  const authoringInput = buildLongHorizonMarathonAiFirstPlanAuthoringInput();
  const envelope = buildMockAiFirstPlanEnvelope(authoringInput);
  const decoded = decodeAndValidateAiFirstPlanEnvelope({ envelope, authoringInput });

  assert.equal(
    envelope.schemaVersion,
    AI_FIRST_PLAN_ENVELOPE_SCHEMA_VERSION,
    "AI first-plan envelope should expose the compact envelope schema version",
  );
  assert.equal(decoded.ok, true, "valid AI first-plan envelope should decode and validate");

  if (decoded.ok) {
    assert.equal(
      decoded.decoded.horizonWeeks,
      29,
      "decoded long target-date envelope should preserve the requested horizon",
    );
    assert.equal(
      decoded.decoded.weeklyRhythm.longRunDay,
      "Sunday",
      "decoded long target-date envelope should preserve preferred long-run day",
    );
  }

  const expanded = expandAiFirstPlanEnvelopeToTrainingPlan({ envelope, authoringInput });

  assert.equal(
    expanded.ok,
    true,
    expanded.ok
      ? "valid AI first-plan envelope should expand canonically"
      : `valid AI first-plan envelope should expand canonically: ${JSON.stringify(
          expanded.issues,
        )}`,
  );

  if (expanded.ok) {
    const plan = expanded.canonicalPlan;

    assert.equal(
      plan.source_kind,
      "ai_first_plan_envelope_v1",
      "AI first-plan envelope expansion should be source-visible and non-blueprint-production",
    );
    assert.equal(
      plan.preparation_horizon_weeks,
      29,
      "AI first-plan envelope expansion should cover the full long target-date horizon",
    );
    assert.equal(
      plan.planned_workouts.length,
      29 * 7,
      "AI first-plan envelope expansion should include one reviewed row per calendar date",
    );
    assert.equal(
      countNonRestWorkouts(plan),
      145,
      "AI first-plan envelope expansion should preserve every validated running slot",
    );
    assertRichWorkoutContract(plan, "AI first-plan envelope expansion");
    assertFixedRestDayNames(plan, ["Wednesday", "Saturday"], "AI first-plan envelope expansion");
    assertWeeklyLongRunDay(plan, "Sunday", "AI first-plan envelope expansion");
    assert.equal(
      hasTargetKey(plan, "pace_min_per_km_range"),
      false,
      "AI first-plan envelope expansion must preserve backend pace gates",
    );

    const horizonStrategy = resolveAiFirstPlanBlueprintHorizonStrategy({
      authoringInput,
      today: "2026-05-29",
      referenceExample: null,
    });
    const fullBlueprint = buildMinimalAiFirstPlanBlueprintForAuthoringInput(authoringInput, {
      horizonWeeks: horizonStrategy.requestedHorizonWeeks,
    });
    const boundedBlueprint = buildMinimalAiFirstPlanBlueprintForAuthoringInput(
      horizonStrategy.openAiAuthoringInput,
      { horizonWeeks: horizonStrategy.aiAuthoredHorizonWeeks },
    );
    const sizeComparison = {
      envelopeOutputChars: JSON.stringify(envelope).length,
      blueprintFullOutputChars: JSON.stringify(fullBlueprint).length,
      blueprintBoundedOutputChars: JSON.stringify(boundedBlueprint).length,
      blueprintPromptCharEstimateBefore: horizonStrategy.promptCharEstimateBefore,
      blueprintPromptCharEstimateAfter: horizonStrategy.promptCharEstimateAfter,
    };
    const trace = buildAiFirstPlanEnvelopeTrace({
      envelope,
      authoringInput,
      result: expanded,
      sizeComparison,
    });

    assert.ok(
      sizeComparison.envelopeOutputChars < sizeComparison.blueprintBoundedOutputChars,
      "AI first-plan envelope should be materially smaller than bounded row-level blueprint output",
    );
    assert.equal(
      trace.expandedPlan?.weekCount,
      29,
      "AI first-plan envelope trace should expose expanded week count",
    );
    assert.equal(
      trace.expandedPlan?.richRowCompleteness.missingRichRows,
      0,
      "AI first-plan envelope trace should prove rich row completeness",
    );
    assert.equal(
      trace.safetyMetadata.productionBlueprintPathChanged,
      false,
      "AI first-plan envelope proof must not change production blueprint behavior",
    );
  }

  const invalidEnvelope = {
    ...envelope,
    weeklyRhythm: {
      ...envelope.weeklyRhythm,
      longRunDay: "we",
      qualityFrequency: "w",
      specialtyFrequency: "w",
    },
  };
  const missingPhaseEnvelope = {
    ...envelope,
    phases: [],
  };
  const invalid = expandAiFirstPlanEnvelopeToTrainingPlan({
    envelope: invalidEnvelope,
    authoringInput,
  });

  assert.equal(invalid.ok, false, "invalid AI first-plan envelope should fail bounded");

  if (!invalid.ok) {
    assert.equal(
      invalid.reason,
      "ai_first_plan_envelope_invalid",
      "invalid AI first-plan envelope should fail before canonical expansion",
    );
    assert.ok(
      invalid.issues.some(
        (issue) =>
          issue.code === "envelope_long_run_day_mismatch" ||
          issue.code === "envelope_long_run_on_fixed_rest_day",
      ),
      "invalid AI first-plan envelope should report long-run safety issues",
    );
  }

  const missingPhases = expandAiFirstPlanEnvelopeToTrainingPlan({
    envelope: missingPhaseEnvelope,
    authoringInput,
  });

  assert.equal(missingPhases.ok, false, "missing envelope phases should fail bounded");

  if (!missingPhases.ok) {
    assert.ok(
      missingPhases.issues.some(
        (issue) =>
          issue.code === "envelope_missing_phases" || issue.code === "envelope_schema_invalid",
      ),
      "invalid AI first-plan envelope should report missing phases",
    );
  }

  assertAiFirstPlanEnvelopeRoadSpecificityContract();
}

function assertAiFirstPlanEnvelopeRoadSpecificityContract() {
  const cases: Array<{
    label: string;
    authoringInput: StructuredPlanAuthoringInput;
    expectedIdentity: string;
    expectedFulfilledMinimum: number;
  }> = [
    {
      label: "AI envelope 5K road specificity",
      authoringInput: buildShortRoadEnvelopeAuthoringInput("5k"),
      expectedIdentity: "5k_sharpening_repeats",
      expectedFulfilledMinimum: 2,
    },
    {
      label: "AI envelope 10K road specificity",
      authoringInput: buildShortRoadEnvelopeAuthoringInput("10k"),
      expectedIdentity: "10k_rhythm_intervals",
      expectedFulfilledMinimum: 2,
    },
    {
      label: "AI envelope balanced half road specificity",
      authoringInput: buildBalancedHalfEnvelopeAuthoringInput(),
      expectedIdentity: "half_marathon_threshold_durability",
      expectedFulfilledMinimum: 2,
    },
  ];

  for (const { label, authoringInput, expectedIdentity, expectedFulfilledMinimum } of cases) {
    const envelope = buildMockAiFirstPlanEnvelope(authoringInput);
    const expanded = expandAiFirstPlanEnvelopeToTrainingPlan({ envelope, authoringInput });

    assert.equal(
      expanded.ok,
      true,
      expanded.ok
        ? `${label}: envelope should expand`
        : `${label}: envelope should expand: ${JSON.stringify(expanded.issues)}`,
    );

    if (!expanded.ok) {
      continue;
    }

    const plan = expanded.canonicalPlan;
    const identities = sourceWorkoutTypes(plan);

    assertRichWorkoutContract(plan, label);
    assert.ok(identities.has(expectedIdentity), `${label}: should include ${expectedIdentity}`);
    assertNoTwoQualityWeeks(plan, label);

    const specificityTrace = expanded.metadata.specificityTrace;
    const fulfilled = specificityTrace.fulfilledIdentities.filter(
      (entry) => entry.toIdentity === expectedIdentity,
    );

    assert.ok(
      fulfilled.length >= expectedFulfilledMinimum,
      `${label}: should prove declared envelope specificity was fulfilled`,
    );

    const trace = buildAiFirstPlanEnvelopeTrace({
      envelope,
      authoringInput,
      result: expanded,
      sizeComparison: {
        envelopePromptCharEstimate: null,
        envelopeSystemPromptChars: null,
        envelopeUserPromptChars: null,
        envelopeResponseSchemaChars: null,
        envelopeOutputChars: JSON.stringify(envelope).length,
        envelopeLiveOutputChars: null,
        blueprintFullOutputChars: null,
        blueprintBoundedOutputChars: null,
        blueprintPromptCharEstimateBefore: null,
        blueprintPromptCharEstimateAfter: null,
      },
    });
    const traceValidation = trace.validation as {
      specificityTrace?: { fulfilledIdentities: Array<{ toIdentity: string }> };
    };

    assert.ok(
      traceValidation.specificityTrace?.fulfilledIdentities.some(
        (entry) => entry.toIdentity === expectedIdentity,
      ),
      `${label}: trace should expose declared-to-fulfilled specificity mapping`,
    );
  }
}

function assertBlueprintIdentityExpansion(
  plan: TrainingPlanV2,
  identity: CanonicalWorkoutIdentity,
  expectedPatterns: RegExp[],
  expectRepeatBlock = false,
) {
  const workout = plan.planned_workouts.find(
    (candidate) => candidate.source_workout_type === identity,
  );

  assert.ok(workout, `AI first-plan blueprint should include ${identity}`);
  assert.ok(
    workout.segments.length >= 3,
    `AI first-plan blueprint ${identity} should expand into executable segment structure`,
  );

  const segmentText = JSON.stringify(workout.segments);

  for (const pattern of expectedPatterns) {
    assert.match(
      segmentText,
      pattern,
      `AI first-plan blueprint ${identity} should include identity-specific guidance matching ${pattern}`,
    );
  }

  if (expectRepeatBlock) {
    assert.ok(
      (workout.segments as SegmentRecord[]).some(
        (segment) =>
          segment.segment_type === "interval_block" &&
          (segment.prescription as Record<string, unknown> | undefined)?.mode === "repeats",
      ),
      `AI first-plan blueprint ${identity} should use repeat-aware interval structure`,
    );
  }
}

export function countNonRestWorkouts(plan: TrainingPlanV2) {
  return plan.planned_workouts.filter(
    (workout) => workout.workout_family !== "rest" && workout.workout_type !== "rest",
  ).length;
}
