import assert from "node:assert/strict";
import { normalizeAiFirstPlanBlueprintToTrainingPlan } from "../../src/lib/ai-first-plan-blueprint-authoring";
import type { TrainingPlanV2 } from "../../src/lib/imported-plan";
import {
  buildStructuredFirstPlanDraftReview,
  type StructuredFirstPlanOnboardingRequestInput,
} from "../../src/lib/structured-first-plan-onboarding";
import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
  type StructuredPlanAuthoringInput,
} from "../../src/lib/structured-plan-authoring";
import type { WeekdayName } from "../../src/lib/weekday-rest-invariants";
import { buildMinimalAiFirstPlanBlueprintForAuthoringInput } from "./first-plan-release-gates";

const fixedRestDays = ["Wednesday", "Sunday"] as const;

export type DoctrineRequestBuilder = (
  goalDistance: StructuredFirstPlanOnboardingRequestInput["goal"]["goalDistance"],
  overrides?: Partial<StructuredFirstPlanOnboardingRequestInput>,
) => StructuredFirstPlanOnboardingRequestInput;

export interface GoalFamilyTerrainSpecificityDependencies {
  buildPlan: (input: StructuredFirstPlanOnboardingRequestInput) => {
    authoringInput: StructuredPlanAuthoringInput;
    input: StructuredFirstPlanOnboardingRequestInput;
    plan: TrainingPlanV2;
  };
  buildRequest: DoctrineRequestBuilder;
}

export interface GoalFamilyQualityPolicyDependencies extends GoalFamilyTerrainSpecificityDependencies {
  assertBeginnerRunWalkAdaptation: (input: {
    plan: TrainingPlanV2;
    adaptationWeeks: number;
    label: string;
  }) => void;
  assertFixedRestDayNames: (plan: TrainingPlanV2, restDays: WeekdayName[], label: string) => void;
  assertNoDefaultEstimatedHrTargets: (plan: TrainingPlanV2, label: string) => void;
  assertNoFakeMetricTargetRegression: (plan: TrainingPlanV2, label: string) => void;
  assertNoSingleSegmentNonRestWorkouts: (plan: TrainingPlanV2, label: string) => void;
  assertNoSingleSegmentNonRestWorkoutsThroughWeek: (
    plan: TrainingPlanV2,
    label: string,
    lastWeekNumber: number,
  ) => void;
  assertRecoveryFirstAfterLongRuns: (plan: TrainingPlanV2, label: string) => void;
  assertRichWorkoutContract: (plan: TrainingPlanV2, label: string) => void;
  assertWeeklyLongRunDay: (
    plan: TrainingPlanV2,
    expectedWeekday: WeekdayName,
    label: string,
  ) => void;
  hasTargetKey: (plan: TrainingPlanV2, key: string) => boolean;
}

export function assertGoalFamilyTerrainSpecificityContracts({
  buildPlan,
  buildRequest,
}: GoalFamilyTerrainSpecificityDependencies) {
  assertPhaseSpecificity(buildPlan(buildRequest("marathon")).plan);
  assertMountainTrailDoctrine(
    buildPlan(buildRequest("mountain_running")).plan,
    "mountain balanced",
  );
  assertMountainTrailDoctrine(
    buildPlan(
      buildRequest("mountain_running", {
        availability: {
          runningDaysPerWeek: 5,
          fixedRestDays: [...fixedRestDays],
          preferredLongRunDay: "Saturday",
        },
        goal: {
          goalDistance: "mountain_running",
          goalStyle: "ambitious",
          terrainFocus: "mountain",
          targetTime: null,
          targetDate: null,
        },
        execution: { watchAccess: "watch_or_app", guidancePreference: "pace" },
      }),
    ).plan,
    "mountain ambitious",
  );
  assertMountainTrailDoctrine(
    buildPlan(
      buildRequest("ultra_marathon", {
        goal: {
          goalDistance: "ultra_marathon",
          goalStyle: "balanced",
          terrainFocus: "mountain",
          targetTime: null,
          targetDate: null,
        },
      }),
    ).plan,
    "ultra with mountain terrain",
  );
}

export function assertGoalFamilyQualityPolicyContracts(deps: GoalFamilyQualityPolicyDependencies) {
  assertGoalFamilyWorkoutIdentity(deps);
  assertBeginnerBuildConsistencyQualityCap(deps);
  assertBeginnerRecreationalSupportedIntensityCadence(deps);
  assertSupportedHalfMarathonMarathonSpecificity(deps);
}

export function assertRoadPerformanceQualityCadence(plan: TrainingPlanV2, label: string) {
  const qualityIdentities = new Set([
    "time_intervals",
    "distance_intervals",
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "controlled_tempo_session",
    "half_marathon_threshold_durability",
    "race_pace_session",
    "taper_tuneup_run",
    "progression_run",
    "easy_run_with_strides",
    "aerobic_strides",
  ]);
  const qualityWeeks = new Set(
    nonRestWorkouts(plan)
      .filter((workout) =>
        qualityIdentities.has(workout.source_workout_type ?? workout.workout_identity ?? ""),
      )
      .map((workout) => workout.week_number),
  );
  const weekNumbers = Array.from(
    new Set(plan.planned_workouts.map((workout) => workout.week_number)),
  ).sort((left, right) => left - right);

  for (let index = 0; index < weekNumbers.length; index += 2) {
    const week = weekNumbers[index]!;
    const nextWeek = weekNumbers[index + 1];

    assert.ok(
      qualityWeeks.has(week) || (nextWeek != null && qualityWeeks.has(nextWeek)),
      `${label}: road performance quality should appear at least every 1-2 weeks`,
    );
  }
}

export function assertMountainTrailDoctrine(plan: TrainingPlanV2, label: string) {
  const identities = sourceWorkoutTypes(plan);
  const identitiesByPhase = sourceWorkoutTypesByPhase(plan);
  const text = planSearchText(plan);
  const taperIdentities = identitiesByPhase.get("Taper") ?? new Set<string>();

  assert.ok(
    identities.has("technical_trail_easy") ||
      identities.has("controlled_downhill_durability") ||
      identities.has("hike_run_endurance") ||
      identities.has("mountain_long_run_time_on_feet"),
    `${label}: mountain/trail plans should include mountain-specific identities beyond generic hill labels`,
  );
  assert.ok(
    identities.has("controlled_downhill_durability"),
    `${label}: controlled downhill or eccentric durability should appear before taper`,
  );
  assert.ok(
    identities.has("mountain_long_run_time_on_feet") || identities.has("hike_run_endurance"),
    `${label}: longer mountain plans should include time-on-feet or hike-run endurance framing`,
  );
  assert.ok(
    /controlled descents?|controlled descent|eccentric durability/.test(text),
    `${label}: controlled descent or eccentric durability guidance should be visible`,
  );
  assert.ok(
    /power-hike|hike-run|time-on-feet|time on feet/.test(text),
    `${label}: hike-run, power-hike, or time-on-feet language should be visible`,
  );
  assert.ok(
    /technical|footing|risky terrain|risky sections/.test(text),
    `${label}: technical terrain caution should be present`,
  );
  assert.equal(
    /\b(?:elevation gain|vertical gain)\b|\b\d+\s*(?:meters|metres|feet|ft)\b/i.test(text),
    false,
    `${label}: mountain doctrine must not prescribe exact elevation gain or route metrics`,
  );

  assert.ok(
    identitiesByPhase.get("Base")?.has("technical_trail_easy") ||
      identitiesByPhase.get("Base")?.has("rolling_hills_session"),
    `${label}: Base phase should start with easy terrain exposure or low-risk hills`,
  );
  assert.ok(
    identitiesByPhase.get("Build")?.has("uphill_repeats") ||
      identitiesByPhase.get("Build")?.has("rolling_hills_session") ||
      identitiesByPhase.get("Build")?.has("climbing_steady_run"),
    `${label}: Build phase should add climbing or rolling-hill strength`,
  );
  assert.ok(
    identitiesByPhase.get("Specific")?.has("controlled_downhill_durability") ||
      identitiesByPhase.get("Specific")?.has("hike_run_endurance") ||
      identitiesByPhase.get("Specific")?.has("mountain_long_run_time_on_feet"),
    `${label}: Specific phase should add race-like mountain durability work`,
  );
  assert.equal(
    taperIdentities.has("controlled_downhill_durability") ||
      taperIdentities.has("hike_run_endurance"),
    false,
    `${label}: Taper phase should not contain peak downhill or hike-run durability stress`,
  );
  assertNoRoadRaceSharpeningInTaper(plan, label);
  assert.ok(
    text.includes("terrain stress") || text.includes("preserve freshness"),
    `${label}: taper copy should reduce terrain stress and preserve freshness`,
  );
}

export function assertNoRoadRaceSharpening(plan: TrainingPlanV2, label: string) {
  const identities = sourceWorkoutTypes(plan);
  const forbiddenRoadSharpening = [
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "half_marathon_threshold_durability",
    "marathon_steady_specificity",
  ];

  assert.equal(
    forbiddenRoadSharpening.some((identity) => identities.has(identity)),
    false,
    `${label}: should not receive road-race sharpening identities`,
  );
}

function assertGoalFamilyWorkoutIdentity({
  buildPlan,
  buildRequest,
  hasTargetKey,
}: GoalFamilyQualityPolicyDependencies) {
  const fiveK = buildPlan(
    buildRequest("5k", {
      availability: {
        runningDaysPerWeek: 5,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      goal: {
        goalDistance: "5k",
        goalStyle: "ambitious",
        terrainFocus: "standard",
        targetTime: null,
        targetDate: null,
      },
    }),
  ).plan;
  const fiveKTypes = sourceWorkoutTypes(fiveK);
  const fiveKText = planSearchText(fiveK);

  assert.ok(
    fiveKTypes.has("aerobic_strides") ||
      fiveKTypes.has("progression_run") ||
      fiveKTypes.has("5k_sharpening_repeats"),
    "ambitious 5K should include safe short-rep, progression, or stride sharpening",
  );
  assert.ok(
    /short controlled reps|relaxed strides|controlled faster running|progression|controlled steady/.test(
      fiveKText,
    ),
    "5K sharpening should use controlled faster-running or progression cues",
  );

  const tenK = buildPlan(
    buildRequest("10k", {
      availability: {
        runningDaysPerWeek: 4,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      goal: {
        goalDistance: "10k",
        goalStyle: "ambitious",
        terrainFocus: "standard",
        targetTime: null,
        targetDate: null,
      },
    }),
  ).plan;
  const tenKTypes = sourceWorkoutTypes(tenK);

  assert.ok(
    tenKTypes.has("10k_rhythm_intervals") ||
      tenKTypes.has("controlled_tempo_session") ||
      tenKTypes.has("progression_run"),
    "10K should include rhythm, controlled tempo, or progression work",
  );
  assert.ok(
    /rhythm|sustained quality|controlled tempo|progression/.test(planSearchText(tenK)),
    "10K work should include rhythm, controlled-tempo, or progression cues",
  );

  const half = buildPlan(
    buildRequest("half_marathon", {
      availability: {
        runningDaysPerWeek: 5,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
    }),
  ).plan;
  const halfTypes = sourceWorkoutTypes(half);

  assert.ok(
    halfTypes.has("half_marathon_threshold_durability") ||
      halfTypes.has("controlled_tempo_session") ||
      halfTypes.has("progression_run"),
    "half marathon should include threshold, controlled tempo, or progression work",
  );
  assert.ok(
    /threshold|steady durability|sustained aerobic strength|controlled tempo|progression/.test(
      planSearchText(half),
    ),
    "half marathon work should include threshold, controlled-tempo, or progression cues",
  );

  const marathon = buildPlan(
    buildRequest("marathon", {
      goal: {
        goalDistance: "marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "3:45:00",
        targetDate: null,
      },
    }),
  ).plan;
  const marathonTypes = sourceWorkoutTypes(marathon);
  const marathonText = planSearchText(marathon);

  assert.ok(
    marathonTypes.has("marathon_steady_specificity") ||
      marathonTypes.has("long_run_with_steady_finish"),
    "marathon should include controlled steady or steady-finish long-run specificity",
  );
  assert.ok(
    /marathon-steady|marathon durability|familiar fueling|time-on-feet/.test(marathonText),
    "marathon work should include controlled steady, fueling, or time-on-feet cues",
  );

  const ultraNoPace = buildPlan(
    buildRequest("ultra_marathon", {
      benchmark: { kind: "unknown" },
      execution: { watchAccess: "none", guidancePreference: "effort" },
    }),
  ).plan;
  const ultraTypes = sourceWorkoutTypes(ultraNoPace);

  assert.ok(
    ultraTypes.has("ultra_time_on_feet_durability") ||
      ultraTypes.has("mountain_long_run_time_on_feet"),
    "ultra should keep time-on-feet durability identity",
  );
  assertNoRoadRaceSharpening(
    ultraNoPace,
    "ultra should not receive inappropriate road-race sharpening identities",
  );
  assert.equal(
    hasTargetKey(ultraNoPace, "pace_min_per_km_range"),
    false,
    "ultra with no pace support should remain effort-based",
  );

  const limitedFiveK = buildPlan(
    buildRequest("5k", {
      benchmark: { kind: "unknown" },
      availability: {
        runningDaysPerWeek: 3,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      execution: { watchAccess: "none", guidancePreference: "effort" },
    }),
  ).plan;
  const limitedFiveKTypes = sourceWorkoutTypes(limitedFiveK);

  assert.equal(
    limitedFiveKTypes.has("5k_sharpening_repeats"),
    false,
    "limited-support 5K should not receive aggressive sharpening repeats",
  );
  assert.equal(
    hasTargetKey(limitedFiveK, "pace_min_per_km_range"),
    false,
    "limited-support 5K should not invent pace targets",
  );
}

function assertBeginnerBuildConsistencyQualityCap({
  assertBeginnerRunWalkAdaptation,
  assertFixedRestDayNames,
  assertNoDefaultEstimatedHrTargets,
  assertNoSingleSegmentNonRestWorkoutsThroughWeek,
  assertRecoveryFirstAfterLongRuns,
  assertRichWorkoutContract,
  assertWeeklyLongRunDay,
  buildPlan,
  buildRequest,
  hasTargetKey,
}: GoalFamilyQualityPolicyDependencies) {
  const beginnerRequest = buildRequest("build_consistency", {
    benchmark: { fitnessLevel: "beginner" },
    availability: {
      runningDaysPerWeek: 3,
      fixedRestDays: [...fixedRestDays],
      preferredLongRunDay: "Saturday",
    },
    execution: { watchAccess: "none", guidancePreference: "effort" },
  });
  const { input, authoringInput, plan } = buildPlan(beginnerRequest);
  const review = buildStructuredFirstPlanDraftReview(input, plan, authoringInput);
  const sourceTypes = sourceWorkoutTypes(plan);
  const forbiddenQualityTypes = [
    "controlled_tempo_session",
    "time_intervals",
    "distance_intervals",
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "half_marathon_threshold_durability",
    "marathon_steady_specificity",
    "taper_tuneup_run",
  ];
  const allowedConsistencyTypes = new Set([
    "easy_aerobic_run",
    "recovery_jog",
    "steady_aerobic_run",
    "long_aerobic_run",
    "cutback_aerobic_run",
    "cutback_long_run",
    "taper_long_run",
    "aerobic_strides",
    "progression_run",
  ]);

  assert.equal(
    authoringInput.runnerProfile.experienceLevel,
    "new_runner",
    "product beginner fitness level should map to backend new_runner",
  );
  assert.ok(
    review.runnerUnderstanding.benchmark.includes("beginner"),
    "review should show the runner-facing beginner label",
  );
  assert.equal(
    review.runnerUnderstanding.benchmark.includes("returning_runner"),
    false,
    "review should not expose internal returning-runner wording for beginner fitness level",
  );
  assert.equal(
    review.planShape.qualityRhythm,
    "No regular quality day; runs stay mostly easy.",
    "beginner consistency review should not promise a regular quality day",
  );
  assert.equal(
    forbiddenQualityTypes.some((identity) => sourceTypes.has(identity)),
    false,
    "beginner low-support build-consistency plan should not emit tempo, interval, or race-like identities",
  );
  assert.deepEqual(
    [...sourceTypes].filter((identity) => !allowedConsistencyTypes.has(identity)),
    [],
    "beginner build-consistency plan should stay within easy/steady/long/cutback identities",
  );
  assert.equal(
    hasTargetKey(plan, "pace_min_per_km_range"),
    false,
    "beginner consistency plan without watch/benchmark support should not emit pace targets",
  );
  assertNoDefaultEstimatedHrTargets(
    plan,
    "beginner consistency plan with age but no personal HR zones",
  );
  assertBeginnerRunWalkAdaptation({
    plan,
    adaptationWeeks: 3,
    label: "beginner consistency plan",
  });
  assertFixedRestDayNames(plan, [...fixedRestDays], "beginner consistency plan");
  assertWeeklyLongRunDay(plan, "Saturday", "beginner consistency plan");
  assertRecoveryFirstAfterLongRuns(plan, "beginner consistency plan");
  assertRichWorkoutContract(plan, "beginner consistency plan");
  assertNoSingleSegmentNonRestWorkoutsThroughWeek(plan, "beginner consistency plan", 3);

  const weakSupportConsistency = buildPlan(
    buildRequest("build_consistency", {
      benchmark: { kind: "unknown" },
      availability: {
        runningDaysPerWeek: 4,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      execution: { watchAccess: "none", guidancePreference: "effort" },
    }),
  ).plan;

  assert.equal(
    forbiddenQualityTypes.some((identity) =>
      sourceWorkoutTypes(weakSupportConsistency).has(identity),
    ),
    false,
    "build-consistency plans with no usable benchmark and no target-time pressure should stay conservative",
  );
}

function assertBeginnerRecreationalSupportedIntensityCadence({
  assertBeginnerRunWalkAdaptation,
  assertFixedRestDayNames,
  assertNoFakeMetricTargetRegression,
  assertNoSingleSegmentNonRestWorkouts,
  assertRecoveryFirstAfterLongRuns,
  assertRichWorkoutContract,
  assertWeeklyLongRunDay,
  buildPlan,
  buildRequest,
  hasTargetKey,
}: GoalFamilyQualityPolicyDependencies) {
  const beginnerFiveKAuthoringInput = buildPlan(
    buildRequest("5k", {
      benchmark: { fitnessLevel: "beginner" },
      availability: {
        runningDaysPerWeek: 5,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      execution: { watchAccess: "none", guidancePreference: "effort" },
    }),
  ).authoringInput;
  const beginnerFiveKPlan = buildStructuredAuthoringPlan(
    structuredPlanAuthoringInputSchema.parse({
      ...beginnerFiveKAuthoringInput,
      schedule: {
        ...beginnerFiveKAuthoringInput.schedule,
        targetDate: null,
        preparationHorizonWeeks: 12,
      },
    }),
  );

  assertBeginnerRunWalkAdaptation({
    plan: beginnerFiveKPlan,
    adaptationWeeks: 3,
    label: "beginner 5K supported cadence",
  });
  assertNoForbiddenHardIntensity(
    beginnerFiveKPlan,
    "beginner 5K supported cadence should avoid hard intervals",
  );
  assertModerateTouchCadenceAtMostEveryTwoWeeks(beginnerFiveKPlan, "beginner 5K supported cadence");
  assertModerateTouchIdentitiesWithin(
    beginnerFiveKPlan,
    ["easy_run_with_strides", "progression_run"],
    "beginner 5K supported cadence",
  );
  assert.ok(
    moderateTouchWeeks(beginnerFiveKPlan).some((weekNumber) => weekNumber > 3),
    "beginner 5K supported cadence should introduce safe moderate support after adaptation",
  );
  assertFixedRestDayNames(beginnerFiveKPlan, [...fixedRestDays], "beginner 5K supported cadence");
  assertWeeklyLongRunDay(beginnerFiveKPlan, "Saturday", "beginner 5K supported cadence");
  assertRecoveryFirstAfterLongRuns(beginnerFiveKPlan, "beginner 5K supported cadence");
  assertRichWorkoutContract(beginnerFiveKPlan, "beginner 5K supported cadence");
  assertNoSingleSegmentNonRestWorkouts(beginnerFiveKPlan, "beginner 5K supported cadence");
  assertNoFakeMetricTargetRegression(beginnerFiveKPlan, "beginner 5K supported cadence");

  const recreationalHalfAuthoringInput = buildPlan(
    buildRequest("half_marathon", {
      availability: {
        runningDaysPerWeek: 4,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: null,
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
    }),
  ).authoringInput;
  const recreationalHalfPlan = buildStructuredAuthoringPlan(
    structuredPlanAuthoringInputSchema.parse({
      ...recreationalHalfAuthoringInput,
      runnerProfile: {
        ...recreationalHalfAuthoringInput.runnerProfile,
        baselineLongRunKm: null,
        baselineLongRunDurationMin: 70,
      },
    }),
  );

  assertWeeklyModerateTouchCadence(
    recreationalHalfPlan,
    "recreational half target-time supported cadence",
  );
  assertModerateTouchIdentitiesWithin(
    recreationalHalfPlan,
    [
      "controlled_tempo_session",
      "half_marathon_threshold_durability",
      "progression_run",
      "easy_run_with_strides",
    ],
    "recreational half target-time supported cadence",
  );
  assertNoTwoQualityWeeks(recreationalHalfPlan, "recreational half target-time supported cadence");
  assertFixedRestDayNames(
    recreationalHalfPlan,
    [...fixedRestDays],
    "recreational half target-time supported cadence",
  );
  assertWeeklyLongRunDay(
    recreationalHalfPlan,
    "Saturday",
    "recreational half target-time supported cadence",
  );
  assertRichWorkoutContract(
    recreationalHalfPlan,
    "recreational half target-time supported cadence",
  );

  const unsupportedTargetTimeMarathonResult = buildPlan(
    buildRequest("marathon", {
      benchmark: { fitnessLevel: "beginner" },
      availability: {
        runningDaysPerWeek: 5,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      goal: {
        goalDistance: "marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "3:50:00",
        targetDate: null,
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
    }),
  );
  const unsupportedTargetTimeMarathon = unsupportedTargetTimeMarathonResult.plan;

  assertBeginnerRunWalkAdaptation({
    plan: unsupportedTargetTimeMarathon,
    adaptationWeeks: 4,
    label: "beginner marathon target-time unsupported cadence",
  });
  assertNoIntervalsOrRacePace(
    unsupportedTargetTimeMarathon,
    "beginner marathon target-time unsupported cadence should not unlock intervals or race pace",
  );
  assertModerateTouchCadenceAtMostEveryTwoWeeks(
    unsupportedTargetTimeMarathon,
    "beginner marathon target-time unsupported cadence",
  );
  assertNoTwoQualityWeeks(
    unsupportedTargetTimeMarathon,
    "beginner marathon target-time unsupported cadence",
  );
  assertRecoveryFirstAfterLongRuns(
    unsupportedTargetTimeMarathon,
    "beginner marathon target-time unsupported cadence",
  );
  assert.equal(
    hasTargetKey(unsupportedTargetTimeMarathon, "pace_min_per_km_range"),
    false,
    "beginner marathon target-time without benchmark must not unlock pace targets",
  );

  const blueprintAuthoringInput = structuredPlanAuthoringInputSchema.parse({
    ...unsupportedTargetTimeMarathonResult.authoringInput,
    schedule: {
      ...unsupportedTargetTimeMarathonResult.authoringInput.schedule,
      targetDate: null,
      preparationHorizonWeeks: 8,
    },
  });
  const overAuthoredBlueprint = buildMinimalAiFirstPlanBlueprintForAuthoringInput(
    blueprintAuthoringInput,
    { horizonWeeks: 8 },
  );

  for (const week of overAuthoredBlueprint.weeks) {
    let changedOneWorkout = false;

    for (const workout of week.plannedWorkouts) {
      if (changedOneWorkout || workout.workoutFamily === "long" || workout.weekday !== "Tuesday") {
        continue;
      }

      workout.workoutFamily = "race";
      workout.workoutIdentity = "race_pace_session";
      workout.calendarIconKey = "race";
      workout.title = "Unsupported race-rhythm block";
      workout.summary = "Doctrine fixture intentionally overstates beginner race specificity.";
      workout.plannedRpe = 8;
      workout.estimatedFatigue = "high";
      workout.recoveryPriority = "high";
      workout.segmentIntent = "race_tuneup";
      workout.metricIntent = "pace_if_allowed";
      changedOneWorkout = true;
    }
  }

  const repairedBlueprint = normalizeAiFirstPlanBlueprintToTrainingPlan({
    blueprint: overAuthoredBlueprint,
    authoringInput: blueprintAuthoringInput,
  });

  assert.equal(
    repairedBlueprint.ok,
    true,
    repairedBlueprint.ok
      ? "beginner over-authored blueprint should normalize after bounded cadence repair"
      : `beginner over-authored blueprint should repair: ${JSON.stringify(
          repairedBlueprint.issues,
        )}`,
  );

  if (repairedBlueprint.ok) {
    assertNoIntervalsOrRacePace(
      repairedBlueprint.canonicalPlan,
      "beginner over-authored blueprint repair",
    );
    assertModerateTouchCadenceAtMostEveryTwoWeeks(
      repairedBlueprint.canonicalPlan,
      "beginner over-authored blueprint repair",
    );
    assert.ok(
      repairedBlueprint.metadata.repairs.some((repair) =>
        repair.includes("supported-intensity cadence changed"),
      ),
      "beginner over-authored blueprint should expose bounded cadence repair metadata",
    );
  }
}

function assertSupportedHalfMarathonMarathonSpecificity({
  buildPlan,
  buildRequest,
  hasTargetKey,
}: GoalFamilyQualityPolicyDependencies) {
  const weakHalfBase = buildPlan(
    buildRequest("half_marathon", {
      benchmark: { kind: "unknown" },
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:10:00",
        targetDate: null,
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
    }),
  ).authoringInput;
  const weakHalfPlan = buildStructuredAuthoringPlan(
    structuredPlanAuthoringInputSchema.parse({
      ...weakHalfBase,
      schedule: { ...weakHalfBase.schedule, targetDate: null, preparationHorizonWeeks: 12 },
      runnerProfile: {
        ...weakHalfBase.runnerProfile,
        experienceLevel: "returning_runner",
        baselineSessionsPerWeek: 3,
        baselineLongRunKm: null,
        baselineLongRunDurationMin: 65,
      },
      currentLevel: {
        recentRaceResults: [],
        recent5kPaceSecondsPerKm: null,
        recentResultSummary: null,
        currentEasyPaceRange: null,
        currentTrainingLoadSummary: null,
      },
    }),
  );

  assertModerateTouchCadenceAtMostEveryTwoWeeks(
    weakHalfPlan,
    "beginner half target-time weak benchmark specificity",
  );
  assertModerateTouchIdentitiesWithin(
    weakHalfPlan,
    ["progression_run", "controlled_tempo_session", "easy_run_with_strides"],
    "beginner half target-time weak benchmark specificity",
  );
  assertNoIntervalsOrRacePace(weakHalfPlan, "beginner half target-time weak benchmark specificity");

  const recreationalHalfBase = buildPlan(
    buildRequest("half_marathon", {
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "1:55:00",
        targetDate: null,
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
    }),
  ).authoringInput;
  const recreationalHalfPlan = buildStructuredAuthoringPlan(
    structuredPlanAuthoringInputSchema.parse({
      ...recreationalHalfBase,
      schedule: {
        ...recreationalHalfBase.schedule,
        targetDate: null,
        preparationHorizonWeeks: 12,
      },
      runnerProfile: {
        ...recreationalHalfBase.runnerProfile,
        experienceLevel: "consistent_runner",
        baselineSessionsPerWeek: 4,
        baselineLongRunKm: null,
        baselineLongRunDurationMin: 70,
      },
    }),
  );
  const recreationalHalfTypes = sourceWorkoutTypes(recreationalHalfPlan);

  assertWeeklyModerateTouchCadence(
    recreationalHalfPlan,
    "recreational half target-time usable benchmark specificity",
  );
  assert.ok(
    recreationalHalfTypes.has("controlled_tempo_session") ||
      recreationalHalfTypes.has("half_marathon_threshold_durability"),
    "recreational half target-time should use controlled tempo or threshold durability",
  );
  assertNoTwoSpecificStimulusWeeks(
    recreationalHalfPlan,
    "recreational half target-time usable benchmark specificity",
  );

  const beginnerMarathonAuthoringInput = buildPlan(
    buildRequest("marathon", {
      benchmark: { kind: "unknown" },
      goal: {
        goalDistance: "marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "3:50:00",
        targetDate: null,
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
    }),
  ).authoringInput;
  const beginnerMarathonPlan = buildStructuredAuthoringPlan(
    structuredPlanAuthoringInputSchema.parse({
      ...beginnerMarathonAuthoringInput,
      schedule: {
        ...beginnerMarathonAuthoringInput.schedule,
        targetDate: null,
        preparationHorizonWeeks: 16,
      },
      runnerProfile: {
        ...beginnerMarathonAuthoringInput.runnerProfile,
        experienceLevel: "returning_runner",
        baselineSessionsPerWeek: 3,
        baselineLongRunKm: null,
        baselineLongRunDurationMin: 80,
      },
      currentLevel: {
        recentRaceResults: [],
        recent5kPaceSecondsPerKm: null,
        recentResultSummary: null,
        currentEasyPaceRange: null,
        currentTrainingLoadSummary: null,
      },
    }),
  );
  const beginnerMarathonTypes = sourceWorkoutTypes(beginnerMarathonPlan);

  assertModerateTouchCadenceAtMostEveryTwoWeeks(
    beginnerMarathonPlan,
    "beginner marathon target-time no-benchmark specificity",
  );
  assert.ok(
    beginnerMarathonTypes.has("marathon_steady_specificity") ||
      beginnerMarathonTypes.has("long_run_with_steady_finish"),
    "beginner marathon target-time should use marathon steady or steady-finish long-run specificity",
  );
  assertNoIntervalsOrRacePace(
    beginnerMarathonPlan,
    "beginner marathon target-time no-benchmark specificity",
  );
  assert.equal(
    hasTargetKey(beginnerMarathonPlan, "pace_min_per_km_range"),
    false,
    "beginner marathon target-time without benchmark should not emit numeric race pace",
  );

  const recreationalMarathonAuthoringInput = buildPlan(
    buildRequest("marathon", {
      goal: {
        goalDistance: "marathon",
        goalStyle: "ambitious",
        terrainFocus: "standard",
        targetTime: null,
        targetDate: null,
      },
    }),
  ).authoringInput;
  const recreationalMarathonPlan = buildStructuredAuthoringPlan(
    structuredPlanAuthoringInputSchema.parse({
      ...recreationalMarathonAuthoringInput,
      schedule: {
        ...recreationalMarathonAuthoringInput.schedule,
        targetDate: null,
        preparationHorizonWeeks: 18,
      },
      runnerProfile: {
        ...recreationalMarathonAuthoringInput.runnerProfile,
        experienceLevel: "consistent_runner",
        baselineSessionsPerWeek: 4,
        baselineLongRunKm: null,
        baselineLongRunDurationMin: 85,
      },
    }),
  );
  const recreationalMarathonTypes = sourceWorkoutTypes(recreationalMarathonPlan);

  assert.ok(
    recreationalMarathonTypes.has("marathon_steady_specificity"),
    "recreational marathon improvement should include marathon steady specificity",
  );
  assert.ok(
    recreationalMarathonTypes.has("controlled_tempo_session"),
    "recreational marathon improvement can include occasional controlled tempo when supported",
  );
  assertNoTwoSpecificStimulusWeeks(
    recreationalMarathonPlan,
    "recreational marathon improvement specificity",
  );
  assertNoIntervalsOrRacePace(recreationalMarathonPlan, "recreational marathon improvement");

  const experiencedMarathonPlan = buildStructuredAuthoringPlan(
    structuredPlanAuthoringInputSchema.parse({
      ...recreationalMarathonAuthoringInput,
      schedule: {
        ...recreationalMarathonAuthoringInput.schedule,
        targetDate: null,
        preparationHorizonWeeks: 18,
      },
      runnerProfile: {
        ...recreationalMarathonAuthoringInput.runnerProfile,
        experienceLevel: "experienced_runner",
        baselineSessionsPerWeek: 5,
        baselineLongRunKm: null,
        baselineLongRunDurationMin: 95,
      },
      currentLevel: {
        ...recreationalMarathonAuthoringInput.currentLevel,
        currentTrainingLoadSummary: null,
      },
    }),
  );

  assert.ok(
    specificStimulusWeeks(experiencedMarathonPlan).length >= 8,
    "experienced-but-not-advanced marathon should allow weekly specificity",
  );
  assertNoTwoSpecificStimulusWeeks(
    experiencedMarathonPlan,
    "experienced-but-not-advanced marathon specificity",
  );
}

function assertPhaseSpecificity(plan: TrainingPlanV2) {
  const identitiesByPhase = new Map<string, Set<string>>();

  for (const workout of nonRestWorkouts(plan)) {
    const identities = identitiesByPhase.get(workout.phase) ?? new Set<string>();
    identities.add(workout.source_workout_type ?? workout.workout_type);
    identitiesByPhase.set(workout.phase, identities);
  }

  assert.ok(identitiesByPhase.has("Base"), "plan should include Base phase");
  assert.ok(identitiesByPhase.has("Build"), "plan should include Build phase");
  assert.ok(identitiesByPhase.has("Specific"), "plan should include Specific phase");
  assert.ok(identitiesByPhase.has("Taper"), "plan should include Taper phase");
  assert.ok(
    identitiesByPhase.get("Specific")?.has("progression_run") ||
      identitiesByPhase.get("Specific")?.has("uphill_repeats") ||
      identitiesByPhase.get("Specific")?.has("climbing_steady_run") ||
      identitiesByPhase.get("Specific")?.has("marathon_steady_specificity") ||
      identitiesByPhase.get("Specific")?.has("long_run_with_steady_finish"),
    "Specific phase should affect workout selection",
  );
  assert.ok(
    identitiesByPhase.get("Taper")?.has("taper_tuneup_run"),
    "Taper phase should include a taper tune-up identity",
  );
}

function assertNoRoadRaceSharpeningInTaper(plan: TrainingPlanV2, label: string) {
  const taperIdentities = sourceWorkoutTypesByPhase(plan).get("Taper") ?? new Set<string>();
  const forbiddenRoadSharpening = [
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "half_marathon_threshold_durability",
    "marathon_steady_specificity",
  ];

  assert.equal(
    forbiddenRoadSharpening.some((identity) => taperIdentities.has(identity)),
    false,
    `${label}: taper should avoid road-race sharpening identities`,
  );
}

function assertNoForbiddenHardIntensity(plan: TrainingPlanV2, label: string) {
  const forbiddenHardIdentities = new Set([
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
  const violations = nonRestWorkouts(plan)
    .filter((workout) => forbiddenHardIdentities.has(workoutIdentityLabel(workout)))
    .map((workout) => `${workout.date}:${workoutIdentityLabel(workout)}`);

  assert.deepEqual(violations, [], `${label}: should not include hard interval/race identities`);
}

function assertNoIntervalsOrRacePace(plan: TrainingPlanV2, label: string) {
  const forbiddenIdentities = new Set([
    "time_intervals",
    "distance_intervals",
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "race_pace_session",
  ]);
  const violations = nonRestWorkouts(plan)
    .filter((workout) => forbiddenIdentities.has(workoutIdentityLabel(workout)))
    .map((workout) => `${workout.date}:${workoutIdentityLabel(workout)}`);

  assert.deepEqual(violations, [], `${label}: should not include intervals or race-pace work`);
}

function assertModerateTouchCadenceAtMostEveryTwoWeeks(plan: TrainingPlanV2, label: string) {
  const weeks = moderateTouchWeeks(plan);
  const consecutiveWeeks = weeks.filter((weekNumber, index) => {
    const previousWeek = weeks[index - 1];

    return previousWeek != null && weekNumber - previousWeek < 2;
  });

  assert.deepEqual(
    consecutiveWeeks,
    [],
    `${label}: moderate touches should not appear in consecutive weeks`,
  );
  assertNoTwoQualityWeeks(plan, label);
}

function assertWeeklyModerateTouchCadence(plan: TrainingPlanV2, label: string) {
  const weeks = new Set(moderateTouchWeeks(plan));

  for (const weekNumber of [1, 2, 3, 5, 6]) {
    assert.ok(weeks.has(weekNumber), `${label}: expected moderate support in week ${weekNumber}`);
  }

  assertNoTwoQualityWeeks(plan, label);
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
    .map(([weekNumber, count]) => `week ${weekNumber}:${count}`);

  assert.deepEqual(overloadedWeeks, [], `${label}: should not create two-quality weeks`);
}

function assertModerateTouchIdentitiesWithin(
  plan: TrainingPlanV2,
  allowedIdentities: string[],
  label: string,
) {
  const allowed = new Set(allowedIdentities);
  const unexpected = moderateTouchWorkouts(plan)
    .filter((workout) => !allowed.has(workoutIdentityLabel(workout)))
    .map((workout) => `${workout.date}:${workoutIdentityLabel(workout)}`);

  assert.deepEqual(unexpected, [], `${label}: moderate touches should use the safe ladder`);
}

function moderateTouchWeeks(plan: TrainingPlanV2) {
  return [...new Set(moderateTouchWorkouts(plan).map((workout) => workout.week_number))].sort(
    (left, right) => left - right,
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

function specificStimulusWeeks(plan: TrainingPlanV2) {
  return [...new Set(specificStimulusWorkouts(plan).map((workout) => workout.week_number))].sort(
    (left, right) => left - right,
  );
}

function specificStimulusWorkouts(plan: TrainingPlanV2) {
  const specificityIdentities = new Set([
    "easy_run_with_strides",
    "progression_run",
    "controlled_tempo_session",
    "half_marathon_threshold_durability",
    "marathon_steady_specificity",
    "race_pace_session",
    "long_run_with_steady_finish",
  ]);

  return nonRestWorkouts(plan).filter((workout) =>
    specificityIdentities.has(workoutIdentityLabel(workout)),
  );
}

function assertNoTwoSpecificStimulusWeeks(plan: TrainingPlanV2, label: string) {
  const countsByWeek = new Map<number, number>();

  for (const workout of specificStimulusWorkouts(plan)) {
    countsByWeek.set(workout.week_number, (countsByWeek.get(workout.week_number) ?? 0) + 1);
  }

  const overloadedWeeks = [...countsByWeek.entries()]
    .filter(([, count]) => count > 1)
    .map(([weekNumber, count]) => `week ${weekNumber}:${count}`);

  assert.deepEqual(overloadedWeeks, [], `${label}: should not create hidden two-specificity weeks`);
}

function sourceWorkoutTypes(plan: TrainingPlanV2) {
  return new Set(
    nonRestWorkouts(plan).map((workout) => workout.source_workout_type ?? workout.workout_type),
  );
}

function sourceWorkoutTypesByPhase(plan: TrainingPlanV2) {
  const identitiesByPhase = new Map<string, Set<string>>();

  for (const workout of nonRestWorkouts(plan)) {
    const identities = identitiesByPhase.get(workout.phase) ?? new Set<string>();
    identities.add(workout.source_workout_type ?? workout.workout_type);
    identitiesByPhase.set(workout.phase, identities);
  }

  return identitiesByPhase;
}

function nonRestWorkouts(plan: TrainingPlanV2) {
  return plan.planned_workouts.filter((workout) => workout.workout_type !== "rest");
}

function workoutIdentityLabel(workout: TrainingPlanV2["planned_workouts"][number]) {
  return workout.workout_identity ?? workout.source_workout_type ?? workout.workout_type;
}

function planSearchText(plan: TrainingPlanV2) {
  return JSON.stringify(plan).toLowerCase();
}
