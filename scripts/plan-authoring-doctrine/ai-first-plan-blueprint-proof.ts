import assert from "node:assert/strict";
import {
  AI_FIRST_PLAN_BLUEPRINT_SCHEMA_VERSION,
  buildAiFirstPlanBlueprintPrompt,
  normalizeAiFirstPlanBlueprintToTrainingPlan,
  type AiFirstPlanBlueprint,
} from "../../src/lib/ai-first-plan-blueprint-authoring";
import type { TrainingPlanV2 } from "../../src/lib/imported-plan";
import type { CanonicalWorkoutIdentity } from "../../src/lib/rich-workout-model";
import type { StructuredFirstPlanOnboardingRequestInput } from "../../src/lib/structured-first-plan-onboarding";
import { structuredPlanAuthoringInputSchema } from "../../src/lib/structured-plan-authoring";
import { addDaysIso } from "../../src/lib/training";
import { buildMinimalAiFirstPlanBlueprintForAuthoringInput } from "./first-plan-release-gates";
import {
  blueprintWorkoutFromIdentity,
  buildAiFirstPlanBlueprintFixture,
  buildAiFirstPlanBlueprintIdentityFixture,
  buildAiFirstPlanBlueprintMissingIdentityFixture,
  titleFromIdentity,
} from "./ai-first-plan-blueprint-fixtures";
import {
  assertFixedRestDays,
  assertNoDefaultEstimatedHrTargets,
  assertNoHrOnMainTargetsForIdentities,
  assertRichWorkoutContract,
  assertRoadPerformanceQualityCadence,
  buildAiFirstPlanAuthoringInput,
  buildLongHorizonMarathonAiFirstPlanAuthoringInput,
  hasTargetKey,
  nonRestWorkouts,
  readAiFirstPlanReferenceFixture,
  workoutDurationMin,
  type SegmentRecord,
} from "./ai-first-plan-proof-shared";

export { buildAiFirstPlanBlueprintFixture };

export function assertAiFirstPlanBlueprintContracts() {
  assertAiFirstPlanBlueprintGoalFamilyCadence();
  assertAiFirstPlanBlueprintContract();
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
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
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
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
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
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
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
          "controlled_tempo_session",
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
          "controlled_tempo_session",
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
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
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
          "long_aerobic_run",
        ],
        [
          "easy_aerobic_run",
          "controlled_tempo_session",
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
          "controlled_tempo_session",
          "steady_aerobic_run",
          "recovery_jog",
          "cutback_long_run",
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
        (issue) => issue.code === "goal_family_identity_cadence_gap",
      ),
      "supported balanced half-marathon draft should explain missing authored specificity cadence",
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

  const prompt = buildAiFirstPlanBlueprintPrompt({ authoringInput, today: "2026-05-28" });

  assert.match(
    prompt.userPrompt,
    /OpenAI-authored dated plan constraints/,
    "Prompt should make OpenAI author the dated workout placement.",
  );
  assert.match(
    prompt.userPrompt,
    /fixedRestDays/,
    "Prompt should expose fixed rest days as validation constraints instead of backend slot scheduling.",
  );
  assert.match(
    prompt.userPrompt,
    /preferredLongRunDay/,
    "Prompt should expose the preferred long-run day without backend-selecting required quality slots.",
  );
  assert.doesNotMatch(
    prompt.userPrompt,
    /Required authored workout slots|mustBeQuality/,
    "Prompt must not provide backend-authored required slot truth.",
  );
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
    /OpenAI-authored dated plan constraints/,
    "AI first-plan blueprint prompt should require OpenAI-authored dated workouts",
  );
  assert.match(
    prompt.userPrompt,
    /Goal-family identity policy/,
    "AI first-plan blueprint prompt should expose the backend goal-family identity policy",
  );
  assert.doesNotMatch(
    prompt.systemPrompt,
    /required cadence slots|backend required slots/i,
    "AI first-plan blueprint prompt must not keep backend slot scheduling vocabulary",
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
      false,
      "AI first-plan blueprint fixture must not invent executable pace targets from authored prose",
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
        (issue) =>
          issue.code === "incomplete_blueprint_weeks" ||
          issue.code === "missing_explicit_workout_date",
      ),
      "partial long-horizon AI blueprint responses should report incomplete dated plan coverage",
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
