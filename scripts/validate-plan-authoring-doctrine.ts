import assert from "node:assert/strict";
import {
  buildStructuredFirstPlanAuthoringInput,
  buildStructuredFirstPlanDraftReview,
  parseStructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanOnboardingRequestInput,
} from "../src/lib/structured-first-plan-onboarding";
import {
  buildExactActivePlanRefreshDraft,
  mutableWorkoutGuardsStillOpen,
  parseActivePlanRefreshDraftPayload,
} from "../src/lib/active-plan-refresh-draft";
import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
} from "../src/lib/active-plan-persistence";
import { structuredAuthoringOpenAiSchema } from "../src/lib/openai-plan-authoring";
import { buildActivePlanRefreshFingerprint } from "../src/lib/plan-refresh-proposal";
import type { RunnerCoachContext } from "../src/lib/runner-coach-context";
import { buildStructuredAuthoringPlan } from "../src/lib/structured-plan-authoring";
import { addDaysIso, weekdayLong } from "../src/lib/training";
import { parseVoiceToPlanConfirmRequest } from "../src/lib/voice-to-plan-authoring";
import type { TrainingPlanV2 } from "../src/lib/imported-plan";

type SegmentRecord = Record<string, unknown>;

const fixedRestDays = ["Wednesday", "Sunday"] as const;

function buildRequest(
  goalDistance: StructuredFirstPlanOnboardingRequestInput["goal"]["goalDistance"],
  overrides: Partial<StructuredFirstPlanOnboardingRequestInput> = {},
): StructuredFirstPlanOnboardingRequestInput {
  return {
    profile: { age: 34, weightKg: 72, heightCm: 178 },
    benchmark: { kind: "recent_5k_time", recent5kTime: "24:00" },
    availability: {
      runningDaysPerWeek: 5,
      fixedRestDays: [...fixedRestDays],
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

function buildPlan(input: StructuredFirstPlanOnboardingRequestInput) {
  const parsedInput = parseStructuredFirstPlanOnboardingInput(input);
  const authoringInput = buildStructuredFirstPlanAuthoringInput(parsedInput);

  return {
    input: parsedInput,
    authoringInput,
    plan: buildStructuredAuthoringPlan(authoringInput),
  };
}

function buildPlanWithHorizon(
  goalDistance: StructuredFirstPlanOnboardingRequestInput["goal"]["goalDistance"],
  horizonWeeks: number,
) {
  const authoringInput = buildStructuredFirstPlanAuthoringInput(buildRequest(goalDistance));

  return buildStructuredAuthoringPlan({
    ...authoringInput,
    schedule: {
      ...authoringInput.schedule,
      targetDate: null,
      preparationHorizonWeeks: horizonWeeks,
    },
  });
}

function nonRestWorkouts(plan: TrainingPlanV2) {
  return plan.planned_workouts.filter((workout) => workout.workout_type !== "rest");
}

function longRunDistances(plan: TrainingPlanV2) {
  return plan.planned_workouts
    .filter((workout) => workout.workout_type === "long_run")
    .map((workout) => ({
      week: workout.week_number,
      phase: workout.phase,
      title: workout.title,
      km: Number(
        workout.segments
          .reduce((sum, segment) => {
            const record = segment as SegmentRecord;
            const prescription = record.prescription as Record<string, unknown> | undefined;
            const distance =
              typeof record.distance_km === "number"
                ? record.distance_km
                : typeof prescription?.distance_km === "number"
                  ? prescription.distance_km
                  : 0;

            return sum + distance;
          }, 0)
          .toFixed(1),
      ),
    }));
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

function assertFixedRestDays(plan: TrainingPlanV2) {
  const violations = nonRestWorkouts(plan).filter((workout) =>
    fixedRestDays.includes(workout.weekday as (typeof fixedRestDays)[number]),
  );

  assert.equal(violations.length, 0, "fixed rest days must not contain non-rest workouts");
}

function assertLongRunDoctrine(plan: TrainingPlanV2, minPeakKm: number) {
  const longRuns = longRunDistances(plan);
  const peak = Math.max(...longRuns.map((entry) => entry.km));
  const first = longRuns[0]!;
  const last = longRuns.at(-1)!;

  assert.ok(peak >= minPeakKm, `long-run peak ${peak}km should reach at least ${minPeakKm}km`);
  assert.ok(peak > first.km + 3, "long runs should progress beyond the opening long run");

  assertWeekFourCutback(plan, "long-run doctrine");

  assert.ok(last.km <= peak * 0.75, "final taper long run should be materially below peak");
  assertNoTaperPeakLongRun(plan);
}

function assertWeekFourCutback(plan: TrainingPlanV2, label: string) {
  const longRuns = longRunDistances(plan);
  const week3 = longRuns.find((entry) => entry.week === 3);
  const week4 = longRuns.find((entry) => entry.week === 4);
  const week5 = longRuns.find((entry) => entry.week === 5);

  assert.ok(week3 && week4 && week5, `${label}: fixture should include weeks 3/4/5`);
  assert.ok(
    week4.km < week3.km,
    `${label}: week 4 cutback ${week4.km}km should reduce from week 3 ${week3.km}km`,
  );
  assert.ok(
    week4.km < week5.km,
    `${label}: week 4 cutback ${week4.km}km should be lower than week 5 rebuild ${week5.km}km`,
  );
}

function assertNoTaperPeakLongRun(plan: TrainingPlanV2) {
  const longRuns = longRunDistances(plan);
  const taperLongRuns = longRuns.filter((entry) => entry.phase === "Taper");

  if (taperLongRuns.length === 0) {
    return;
  }

  const peak = Math.max(...longRuns.map((entry) => entry.km));
  const firstTaperWeek = Math.min(...taperLongRuns.map((entry) => entry.week));
  const peakRuns = longRuns.filter((entry) => entry.km === peak);

  assert.ok(
    peakRuns.every((entry) => entry.phase !== "Taper" && entry.week < firstTaperWeek),
    `peak long run ${peak}km must occur before taper, not inside a Taper phase week`,
  );

  for (const taperRun of taperLongRuns) {
    assert.ok(
      taperRun.km < peak,
      `Taper week ${taperRun.week} long run ${taperRun.km}km must be below peak ${peak}km`,
    );
  }
}

function assertTaperReducesLongRun(plan: TrainingPlanV2) {
  const longRuns = longRunDistances(plan);
  const firstTaperWeek = longRuns.find((entry) => entry.phase === "Taper")?.week;

  assert.ok(firstTaperWeek, "plan should include a taper long run");

  const preTaperPeak = Math.max(
    ...longRuns.filter((entry) => entry.week < firstTaperWeek).map((entry) => entry.km),
  );
  const taperPeak = Math.max(
    ...longRuns.filter((entry) => entry.week >= firstTaperWeek).map((entry) => entry.km),
  );
  const finalLongRun = longRuns.at(-1)!;

  assert.ok(
    taperPeak <= preTaperPeak * 0.92,
    `taper long-run peak ${taperPeak}km should reduce from pre-taper peak ${preTaperPeak}km`,
  );
  assert.ok(
    finalLongRun.km <= preTaperPeak * 0.75,
    `final taper long run ${finalLongRun.km}km should be meaningfully below pre-taper peak ${preTaperPeak}km`,
  );
}

function structuredReviewAssumptions(input: StructuredFirstPlanOnboardingRequestInput) {
  const { input: parsedInput, authoringInput, plan } = buildPlan(input);

  return buildStructuredFirstPlanDraftReview(parsedInput, plan, authoringInput).assumptions;
}

function hasLongDistanceHonesty(assumptions: string[]) {
  return assumptions.some((assumption) =>
    /finish-oriented|durability-limited|longer horizon|more running days|race-specific durability|conservative/i.test(
      assumption,
    ),
  );
}

function assertLongDistanceHonesty(
  input: StructuredFirstPlanOnboardingRequestInput,
  message: string,
) {
  assert.ok(hasLongDistanceHonesty(structuredReviewAssumptions(input)), message);
}

function assertNoLongDistanceHonesty(
  input: StructuredFirstPlanOnboardingRequestInput,
  message: string,
) {
  assert.equal(hasLongDistanceHonesty(structuredReviewAssumptions(input)), false, message);
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
      identitiesByPhase.get("Specific")?.has("marathon_steady_specificity"),
    "Specific phase should affect workout selection",
  );
  assert.ok(
    identitiesByPhase.get("Taper")?.has("taper_tuneup_run"),
    "Taper phase should include a taper tune-up identity",
  );
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

function planSearchText(plan: TrainingPlanV2) {
  return JSON.stringify(plan).toLowerCase();
}

function assertMountainTrailDoctrine(plan: TrainingPlanV2, label: string) {
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

function assertNoRoadRaceSharpening(plan: TrainingPlanV2, label: string) {
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

function assertGoalFamilyWorkoutIdentity() {
  const fiveK = buildPlan(
    buildRequest("5k", {
      availability: {
        runningDaysPerWeek: 4,
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
    fiveKTypes.has("aerobic_strides") || fiveKTypes.has("5k_sharpening_repeats"),
    "ambitious 5K should include safe short-rep or stride sharpening",
  );
  assert.ok(
    /short controlled reps|relaxed strides|controlled faster running/.test(fiveKText),
    "5K sharpening should use controlled faster-running cues",
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

  assert.ok(tenKTypes.has("10k_rhythm_intervals"), "10K should include rhythm intervals");
  assert.ok(
    /rhythm|sustained quality/.test(planSearchText(tenK)),
    "10K work should include rhythm or sustained-quality cues",
  );

  const half = buildPlan(
    buildRequest("half_marathon", {
      availability: {
        runningDaysPerWeek: 4,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
    }),
  ).plan;
  const halfTypes = sourceWorkoutTypes(half);

  assert.ok(
    halfTypes.has("half_marathon_threshold_durability"),
    "half marathon should include threshold/steady durability work",
  );
  assert.ok(
    /threshold|steady durability|sustained aerobic strength/.test(planSearchText(half)),
    "half marathon work should include threshold or steady durability cues",
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
    marathonTypes.has("marathon_steady_specificity"),
    "marathon should include controlled steady specificity",
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

function assertBeginnerBuildConsistencyQualityCap() {
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
  assert.equal(
    hasTargetKey(plan, "hr_bpm_range"),
    false,
    "beginner consistency plan should not emit HR targets without HR-zone truth",
  );

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

function assertMetricTargetPolicy() {
  const supportedPace = buildPlan(buildRequest("10k")).plan;

  assert.equal(
    hasTargetKey(supportedPace, "pace_min_per_km_range"),
    true,
    "watch/app plus pace preference plus usable recent 5K should emit pace targets",
  );

  assert.equal(
    hasTargetKey(
      buildPlan(
        buildRequest("10k", {
          execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
        }),
      ).plan,
      "pace_min_per_km_range",
    ),
    true,
    "mixed guidance with watch/app plus usable recent 5K should emit pace targets",
  );

  assert.equal(
    hasTargetKey(
      buildPlan(
        buildRequest("10k", {
          execution: { watchAccess: "watch_or_app", guidancePreference: "effort" },
        }),
      ).plan,
      "pace_min_per_km_range",
    ),
    false,
    "effort guidance should not emit pace targets even with a usable benchmark",
  );

  assert.equal(
    hasTargetKey(
      buildPlan(
        buildRequest("10k", {
          execution: { watchAccess: "unknown", guidancePreference: "pace" },
        }),
      ).plan,
      "pace_min_per_km_range",
    ),
    false,
    "pace targets require known watch/app access",
  );

  assert.equal(
    hasTargetKey(
      buildPlan(
        buildRequest("10k", {
          benchmark: { kind: "unknown" },
          execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
        }),
      ).plan,
      "pace_min_per_km_range",
    ),
    false,
    "mixed guidance must not invent pace targets without usable recent 5K truth",
  );

  for (const plan of [
    supportedPace,
    buildPlan(buildRequest("marathon")).plan,
    buildPlan(buildRequest("mountain_running")).plan,
  ]) {
    assert.equal(
      hasTargetKey(plan, "hr_bpm_range"),
      false,
      "HR targets remain absent without runner-level HR-zone truth",
    );
  }
}

for (const goalDistance of [
  "5k",
  "10k",
  "half_marathon",
  "marathon",
  "ultra_marathon",
  "mountain_running",
] as const) {
  const { plan } = buildPlan(buildRequest(goalDistance));

  assertFixedRestDays(plan);
  assert.equal(hasTargetKey(plan, "hr_bpm_range"), false, "HR targets require real HR-zone truth");
  assert.equal(
    hasTargetKey(plan, "pace_min_per_km_range"),
    true,
    "known benchmark plus watch/app pace guidance should emit pace targets",
  );
}

assertLongRunDoctrine(buildPlan(buildRequest("half_marathon")).plan, 16);
assertLongRunDoctrine(buildPlan(buildRequest("marathon")).plan, 26);
assertLongRunDoctrine(buildPlan(buildRequest("ultra_marathon")).plan, 30);
assertLongRunDoctrine(buildPlan(buildRequest("mountain_running")).plan, 22);
assertWeekFourCutback(buildPlan(buildRequest("5k")).plan, "5K cutback fixture");
assertWeekFourCutback(buildPlan(buildRequest("10k")).plan, "10K cutback fixture");
assertTaperReducesLongRun(buildPlan(buildRequest("marathon")).plan);
assertTaperReducesLongRun(buildPlan(buildRequest("ultra_marathon")).plan);
assertTaperReducesLongRun(buildPlanWithHorizon("5k", 8));
assertNoTaperPeakLongRun(buildPlanWithHorizon("10k", 9));
assertPhaseSpecificity(buildPlan(buildRequest("marathon")).plan);
assertMountainTrailDoctrine(buildPlan(buildRequest("mountain_running")).plan, "mountain balanced");
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
assertGoalFamilyWorkoutIdentity();
assertBeginnerBuildConsistencyQualityCap();
assertMetricTargetPolicy();

{
  const request = buildRequest("marathon", {
    benchmark: { kind: "unknown" },
    goal: {
      goalDistance: "marathon",
      goalStyle: "target_time",
      terrainFocus: "standard",
      targetTime: "3:30:00",
      targetDate: null,
    },
  });
  const { authoringInput, plan } = buildPlan(request);
  const review = buildStructuredFirstPlanDraftReview(request, plan, authoringInput);

  assert.ok(
    review.assumptions.some((assumption) => /stays effort-based/i.test(assumption)),
    "target-time review should be honest when benchmark support is missing",
  );
  assert.ok(
    review.assumptions.some((assumption) =>
      /Target-time intent is treated as directional/i.test(assumption),
    ),
    "target-time pressure without benchmark support should add long-distance honesty",
  );
}

{
  const request = buildRequest("marathon", {
    goal: {
      goalDistance: "marathon",
      goalStyle: "target_time",
      terrainFocus: "standard",
      targetTime: "3:30:00",
      targetDate: null,
    },
  });
  const { authoringInput, plan } = buildPlan(request);
  const review = buildStructuredFirstPlanDraftReview(request, plan, authoringInput);

  assert.ok(
    review.assumptions.some((assumption) => /looks aggressive/i.test(assumption)),
    "target-time review should flag aggressive benchmark support",
  );
}

assertLongDistanceHonesty(
  buildRequest("marathon", {
    benchmark: { kind: "unknown" },
    availability: {
      runningDaysPerWeek: 2,
      fixedRestDays: [...fixedRestDays],
      preferredLongRunDay: "Saturday",
    },
  }),
  "low-frequency marathon should be labeled finish-oriented or durability-limited",
);

assertLongDistanceHonesty(
  buildRequest("marathon", {
    benchmark: { kind: "unknown" },
    availability: {
      runningDaysPerWeek: 3,
      fixedRestDays: [...fixedRestDays],
      preferredLongRunDay: "Saturday",
    },
  }),
  "3-day marathon with weak benchmark support should be labeled conservative",
);

assertLongDistanceHonesty(
  buildRequest("ultra_marathon", {
    benchmark: { kind: "unknown" },
    availability: {
      runningDaysPerWeek: 3,
      fixedRestDays: [...fixedRestDays],
      preferredLongRunDay: "Saturday",
    },
  }),
  "low-frequency ultra with unknown current load should include durability honesty",
);

assertLongDistanceHonesty(
  buildRequest("mountain_running", {
    benchmark: { kind: "unknown" },
    availability: {
      runningDaysPerWeek: 2,
      fixedRestDays: [...fixedRestDays],
      preferredLongRunDay: "Saturday",
    },
    goal: {
      goalDistance: "mountain_running",
      goalStyle: "target_time",
      terrainFocus: "mountain",
      targetTime: "2:30:00",
      targetDate: null,
    },
  }),
  "low-frequency mountain target-time plan should include conservative durability honesty",
);

assertNoLongDistanceHonesty(
  buildRequest("half_marathon"),
  "supported half marathon should not receive long-distance limitation copy",
);

assertNoLongDistanceHonesty(
  buildRequest("10k"),
  "supported 10K should not receive long-distance limitation copy",
);

const goalEnum = structuredAuthoringOpenAiSchema.properties.goal.properties.goalType.enum;
assert.ok(goalEnum.includes("ultra_marathon"), "text authoring schema should accept ultra goals");
assert.ok(
  goalEnum.includes("mountain_running"),
  "text authoring schema should accept mountain goals",
);
assert.ok(
  "execution" in structuredAuthoringOpenAiSchema.properties,
  "text authoring schema should include execution mode",
);
assert.ok(
  "terrainFocus" in structuredAuthoringOpenAiSchema.properties.preferences.properties,
  "text authoring schema should include terrain focus",
);

{
  const context = buildRefreshFixtureContext();
  const currentPlan = buildRefreshFixturePlanRow(context);
  const existingWorkouts = {
    workouts: context.remainingActiveSchedule.map((workout, index) =>
      buildRefreshFixtureWorkoutRow(context, workout, index),
    ),
    logsByWorkoutId: new Map(),
  };
  const fingerprint = buildActivePlanRefreshFingerprint(context);
  const draft = buildExactActivePlanRefreshDraft({
    context,
    currentPlan,
    existingWorkouts,
    proposalOutput: {
      applyContext: { generatedAt: context.generatedAt },
      review: {
        summary:
          "Rebuild the remaining marathon block with better long-run progression while keeping fixed rest days.",
        proposedChanges: [
          "Progress the remaining long runs more credibly while keeping the plan conservative.",
        ],
      },
      recommendedAuthoringPrompt:
        "Refresh this as a marathon plan with credible long-run progression, cutback weeks, taper behavior, and effort-based guidance only.",
    },
    fingerprint,
    weekdayRestInvariant: context.weekdayRestInvariant,
    evidenceSets: { loggedWorkoutIds: new Set(), evidenceWorkoutIds: new Set() },
  });
  const parsedDraft = parseActivePlanRefreshDraftPayload(draft);

  assert.equal(parsedDraft.ok, true, "refresh draft checksum should verify");
  assert.equal(
    draft.reviewMetadata.affectedDateRange.startDate,
    context.refreshBoundary.firstMutableDate,
    "refresh draft metadata should expose the mutable date boundary",
  );
  assert.equal(
    draft.reviewMetadata.affectedDateRange.endDate,
    context.refreshBoundary.lastMutableDate,
    "refresh draft metadata should expose the affected end date",
  );
  assert.equal(
    draft.reviewMetadata.sourceAssumption,
    draft.authoringSnapshot.sourceAssumption,
    "refresh draft review metadata should mirror the authoring source assumption",
  );
  assert.ok(
    draft.reviewMetadata.longDistanceHonestyAssumptions.some((assumption) =>
      /durability|conservative|finish-oriented/i.test(assumption),
    ),
    "refresh draft should expose long-distance honesty metadata",
  );
  assert.ok(
    sourceWorkoutTypes(draft.canonicalPlan).has("marathon_steady_specificity"),
    "marathon refresh draft should use the same marathon-specific identity as first-plan generation",
  );
  assert.ok(
    (draft.reviewMetadata.longRunPeakAfterKm ?? 0) >
      (draft.reviewMetadata.longRunPeakBeforeKm ?? 0) + 8,
    "refresh draft should improve a shallow marathon long-run structure",
  );
  assertFixedRestDays(draft.canonicalPlan);
  assertNoTaperPeakLongRun(draft.canonicalPlan);
  assert.equal(
    hasTargetKey(draft.canonicalPlan, "hr_bpm_range"),
    false,
    "refresh draft must not emit HR targets without HR-zone truth",
  );
  assert.equal(
    hasTargetKey(draft.canonicalPlan, "pace_min_per_km_range"),
    false,
    "reconstructed refresh draft must not emit pace targets without execution and benchmark truth",
  );
  assert.equal(
    mutableWorkoutGuardsStillOpen(draft, {
      loggedWorkoutIds: new Set(),
      evidenceWorkoutIds: new Set(),
    }),
    true,
    "unlogged mutable workouts should remain open before apply",
  );
  assert.equal(
    mutableWorkoutGuardsStillOpen(draft, {
      loggedWorkoutIds: new Set([draft.mutableWorkoutGuards[0]!.workoutId]),
      evidenceWorkoutIds: new Set(),
    }),
    false,
    "a formerly mutable logged workout should stale-block apply",
  );
  assert.equal(
    mutableWorkoutGuardsStillOpen(draft, {
      loggedWorkoutIds: new Set(),
      evidenceWorkoutIds: new Set([draft.mutableWorkoutGuards[1]!.workoutId]),
    }),
    false,
    "a formerly mutable evidence-backed workout should stale-block apply",
  );
}

{
  const context = buildRefreshFixtureContext();
  const currentPlan = buildRefreshFixturePlanRow(context);
  const existingWorkouts = {
    workouts: context.remainingActiveSchedule.map((workout, index) =>
      buildRefreshFixtureWorkoutRow(context, workout, index),
    ),
    logsByWorkoutId: new Map(),
  };
  const protectedLoggedWorkout = existingWorkouts.workouts.find(
    (workout) => workout.workout_type !== "rest",
  )!;
  const protectedEvidenceWorkout = existingWorkouts.workouts.find(
    (workout) => workout.workout_type !== "rest" && workout.id !== protectedLoggedWorkout.id,
  )!;
  const evidenceSets = {
    loggedWorkoutIds: new Set([protectedLoggedWorkout.id]),
    evidenceWorkoutIds: new Set([protectedEvidenceWorkout.id]),
  };
  const draft = buildExactActivePlanRefreshDraft({
    context,
    currentPlan,
    existingWorkouts,
    proposalOutput: {
      applyContext: { generatedAt: context.generatedAt },
      review: {
        summary:
          "Rebuild the remaining marathon block with better long-run progression while keeping protected history fixed.",
        proposedChanges: [
          "Preserve logged or evidence-backed future workouts and regenerate only still-mutable rows.",
        ],
      },
      recommendedAuthoringPrompt:
        "Refresh this as a marathon plan while preserving logged and evidence-backed workouts.",
    },
    fingerprint: buildActivePlanRefreshFingerprint(context),
    weekdayRestInvariant: context.weekdayRestInvariant,
    evidenceSets,
  });

  assert.equal(
    draft.reviewMetadata.preservedWorkoutCount,
    2,
    "refresh draft should count logged and evidence-backed mutable workouts as preserved",
  );
  assert.equal(
    draft.mutableWorkoutGuards.some(
      (guard) =>
        guard.workoutId === protectedLoggedWorkout.id ||
        guard.workoutId === protectedEvidenceWorkout.id,
    ),
    false,
    "logged and evidence-backed workouts should not remain in mutable guard rows",
  );
  assert.equal(
    mutableWorkoutGuardsStillOpen(draft, evidenceSets),
    true,
    "already-protected workouts should not stale-block their own draft",
  );
}

{
  const context = buildMountainRefreshFixtureContext();
  const currentPlan = buildMountainRefreshFixturePlanRow(context);
  const existingWorkouts = {
    workouts: context.remainingActiveSchedule.map((workout, index) =>
      buildRefreshFixtureWorkoutRow(context, workout, index),
    ),
    logsByWorkoutId: new Map(),
  };
  const fingerprint = buildActivePlanRefreshFingerprint(context);
  const draft = buildExactActivePlanRefreshDraft({
    context,
    currentPlan,
    existingWorkouts,
    proposalOutput: {
      applyContext: { generatedAt: context.generatedAt },
      review: {
        summary:
          "Refresh the remaining mountain block with better trail specificity while keeping fixed rest days.",
        proposedChanges: [
          "Replace generic hill-only future workouts with controlled descents, time-on-feet, and cautious trail guidance.",
        ],
      },
      recommendedAuthoringPrompt:
        "Refresh this as a mountain running plan with controlled descents, power-hike allowance, time-on-feet long runs, technical-terrain caution, and effort-based guidance only.",
    },
    fingerprint,
    weekdayRestInvariant: context.weekdayRestInvariant,
    evidenceSets: { loggedWorkoutIds: new Set(), evidenceWorkoutIds: new Set() },
  });
  const parsedDraft = parseActivePlanRefreshDraftPayload(draft);

  assert.equal(parsedDraft.ok, true, "mountain refresh draft checksum should verify");
  assertMountainTrailDoctrine(draft.canonicalPlan, "mountain refresh draft");
  assertNoRoadRaceSharpening(draft.canonicalPlan, "mountain refresh draft");
  assertFixedRestDays(draft.canonicalPlan);
  assert.equal(
    hasTargetKey(draft.canonicalPlan, "hr_bpm_range"),
    false,
    "mountain refresh draft must not emit HR targets without HR-zone truth",
  );
  assert.equal(
    hasTargetKey(draft.canonicalPlan, "pace_min_per_km_range"),
    false,
    "mountain refresh draft must not emit pace targets without execution and benchmark truth",
  );
}

{
  const { authoringInput, plan } = buildPlan(buildRequest("ultra_marathon"));
  const parsedVoiceConfirm = parseVoiceToPlanConfirmRequest({
    draft: {
      authoringInput,
      canonicalPlan: plan,
    },
    supplement: {
      age: 34,
      weightKg: 72,
      heightCm: 178,
      fixedRestDays: [...fixedRestDays],
      runningDaysPerWeek: 5,
      goalDistance: "ultra_marathon",
      goalStyle: "balanced",
      terrainFocus: "mountain",
      watchAccess: "watch_or_app",
      guidancePreference: "pace",
    },
  });

  assert.equal(
    parsedVoiceConfirm.ok,
    true,
    "voice confirm should accept expanded structured goal contract",
  );
}

console.log("Plan authoring doctrine fixtures passed.");

function buildRefreshFixtureContext(): RunnerCoachContext {
  const today = "2026-06-01";
  const activePlanId = fixtureUuid(1);
  const remainingWeeks = 10;
  const remainingActiveSchedule = Array.from({ length: remainingWeeks * 7 }, (_, index) => {
    const date = addDaysIso(today, index);
    const weekday = weekdayLong(date);
    const weekNumber = Math.floor(index / 7) + 1;
    const isRest = weekday === "Wednesday" || weekday === "Sunday";
    const isLongRun = weekday === "Saturday";
    const workoutType = isRest ? "rest" : isLongRun ? "long_run" : "easy";
    const title = isRest
      ? "Rest and recovery"
      : isLongRun
        ? "Short marathon long run"
        : "Easy aerobic run";

    return {
      id: fixtureUuid(index + 10),
      date,
      title,
      workoutType,
      phase:
        weekNumber <= 3
          ? "Base"
          : weekNumber <= 7
            ? "Build"
            : weekNumber <= 10
              ? "Specific"
              : "Taper",
      weekNumber,
      plannedDurationMin: isRest ? 0 : isLongRun ? 70 + weekNumber * 2 : 40,
      plannedDistanceKm: isRest ? null : isLongRun ? 8 + weekNumber * 0.5 : 6,
      stepCount: isRest ? 0 : 1,
      notes: null,
    } satisfies RunnerCoachContext["remainingActiveSchedule"][number];
  });

  return {
    schemaVersion: "runner-coach-context-v1",
    generatedAt: "2026-06-01T12:00:00.000Z",
    today,
    runner: {
      userId: fixtureUuid(2),
      displayName: "Refresh Fixture",
      goalType: "distance_build",
      goalLabel: "Marathon",
      baselineSessionsPerWeek: 5,
      baselineLongRunKm: 10,
      baselineNotes: null,
    },
    activePlan: {
      id: activePlanId,
      title: "Old shallow marathon plan",
      goalSummary: "Marathon",
      sourceKind: "structured_authoring_v1",
      sourceTemplate: "training-plan-v2",
      schemaVersion: "training-plan-v2",
      startDate: "2026-05-01",
      endDate: "2026-08-23",
      targetDate: "2026-08-23",
      updatedAt: "2026-06-01T11:00:00.000Z",
    },
    weekdayRestInvariant: {
      blockedWeekdays: ["Wednesday", "Sunday"],
      source: "active_plan",
    },
    refreshBoundary: {
      target: "remaining_active_schedule_only",
      firstMutableDate: today,
      lastMutableDate: addDaysIso(today, remainingWeeks * 7 - 1),
      pastAndLoggedHistoryIsFixed: true,
      requiresExplicitApply: true,
    },
    remainingActiveSchedule,
    recentWorkoutHistory: [],
    recentAdherence: {
      lookbackDays: 56,
      plannedNonRestCount: 0,
      completedCount: 0,
      partialCount: 0,
      skippedCount: 0,
      unloggedPastNonRestCount: 0,
    },
    recentActualLoad: {
      loggedWorkoutCount: 0,
      totalDurationMin: 0,
      totalDistanceKm: 0,
      garminActivityCount: 0,
    },
    recentComparisonSignals: [],
    bodyNoteCautions: [],
  };
}

function buildRefreshFixturePlanRow(context: RunnerCoachContext): PersistedPlanCycleRow {
  return {
    id: context.activePlan!.id,
    user_id: context.runner.userId,
    status: "active",
    title: context.activePlan!.title,
    goal_summary: context.activePlan!.goalSummary,
    source_template: context.activePlan!.sourceTemplate,
    schema_version: context.activePlan!.schemaVersion,
    source_kind: context.activePlan!.sourceKind,
    start_date: context.activePlan!.startDate,
    end_date: context.activePlan!.endDate,
    target_date: context.activePlan!.targetDate,
    goal_metadata: { goal_type: "marathon", goal_label: "Marathon" },
    plan_preferences: {
      blocked_days: ["Wednesday", "Sunday"],
      preferred_run_days: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      preferred_long_run_day: "Saturday",
      max_running_days_per_week: 5,
    },
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: context.activePlan!.updatedAt,
  };
}

function buildMountainRefreshFixtureContext(): RunnerCoachContext {
  const context = buildRefreshFixtureContext();

  return {
    ...context,
    runner: {
      ...context.runner,
      goalType: "mountain_running",
      goalLabel: "Mountain running",
      baselineLongRunKm: 9,
    },
    activePlan: context.activePlan
      ? {
          ...context.activePlan,
          title: "Old hill-only mountain plan",
          goalSummary: "Mountain running",
        }
      : null,
    remainingActiveSchedule: context.remainingActiveSchedule.map((workout) => ({
      ...workout,
      title:
        workout.workoutType === "long_run"
          ? "Generic hilly long run"
          : workout.workoutType === "rest"
            ? workout.title
            : "Generic hill run",
      notes:
        workout.workoutType === "rest"
          ? workout.notes
          : "Older mountain-like plan with generic hill wording only.",
    })),
  };
}

function buildMountainRefreshFixturePlanRow(context: RunnerCoachContext): PersistedPlanCycleRow {
  const plan = buildRefreshFixturePlanRow(context);

  return {
    ...plan,
    title: "Old hill-only mountain plan",
    goal_summary: "Mountain running",
    goal_metadata: { goal_type: "mountain_running", goal_label: "Mountain running" },
    plan_preferences: {
      ...((plan.plan_preferences as Record<string, unknown>) ?? {}),
      blocked_days: ["Wednesday", "Sunday"],
      preferred_run_days: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      preferred_long_run_day: "Saturday",
      max_running_days_per_week: 5,
      terrain_focus: "mountain",
    },
  };
}

function buildRefreshFixtureWorkoutRow(
  context: RunnerCoachContext,
  workout: RunnerCoachContext["remainingActiveSchedule"][number],
  index: number,
): PersistedPlannedWorkoutRow {
  return {
    id: workout.id,
    plan_cycle_id: context.activePlan!.id,
    user_id: context.runner.userId,
    workout_date: workout.date,
    weekday: weekdayLong(workout.date),
    week_number: workout.weekNumber,
    phase: workout.phase,
    workout_type: workout.workoutType,
    source_workout_id: `old-${index}`,
    source_workout_type: workout.workoutType,
    title: workout.title,
    notes: workout.notes,
    planned_rpe: workout.workoutType === "rest" ? null : 4,
    estimated_fatigue: null,
    recovery_priority: null,
    steps: [],
    display_order: index,
    created_at: "2026-05-01T00:00:00.000Z",
  };
}

function fixtureUuid(index: number) {
  return `00000000-0000-4000-8000-${index.toString().padStart(12, "0")}`;
}
