import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildStructuredFirstPlanAuthoringInput,
  buildStructuredFirstPlanDraftReview,
  parseStructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanOnboardingRequestInput,
} from "../src/lib/structured-first-plan-onboarding";
import { structuredAuthoringOpenAiSchema } from "../src/lib/openai-plan-authoring";
import { buildPlanScopedStructuredAuthoringMetadata } from "../src/lib/plan-authoring-snapshot";
import { prepareImportedPlanApplyPolicy } from "../src/lib/plan-apply-policy";
import { buildPersistedWorkoutInsertRows } from "../src/lib/persisted-plan-replacement";
import {
  deriveExecutableModeFromSegments,
  resolveCanonicalWorkoutModel,
} from "../src/lib/rich-workout-model";
import { allowsDefaultEstimatedHrTarget } from "../src/lib/default-estimated-hr-target-policy";
import { assertFirstPlanReleaseGateContracts } from "./plan-authoring-doctrine/first-plan-release-gates";
import {
  assertAiFirstPlanBlueprintEnvelopeContracts,
  buildAiFirstPlanAuthoringInput,
  buildAiFirstPlanBlueprintFixture,
  buildBalancedHalfEnvelopeAuthoringInput,
  buildLongHorizonMarathonAiFirstPlanAuthoringInput,
  countNonRestWorkouts,
  readAiFirstPlanReferenceFixture,
} from "./plan-authoring-doctrine/ai-first-plan-blueprint-envelope";
import {
  assertActivePlanRefreshDraftReviewContracts,
  assertActivePlanRefreshRichDraftContracts,
} from "./plan-authoring-doctrine/active-plan-refresh";
import {
  assertGoalFamilyQualityPolicyContracts,
  assertGoalFamilyTerrainSpecificityContracts,
  assertMountainTrailDoctrine,
  assertNoRoadRaceSharpening,
  assertRoadPerformanceQualityCadence,
} from "./plan-authoring-doctrine/goal-family-quality-policy";
import { assertRichWorkoutImportExportContracts } from "./plan-authoring-doctrine/rich-workout-import-export";
import {
  assertMetricTargetReadbackContracts,
  assertEffortOnlyHrGuidance,
  assertNoDefaultEstimatedHrTargets,
  assertNoFakeMetricTargetRegression,
  assertStructureOnlyExecutableContract,
  hasTargetKey,
} from "./plan-authoring-doctrine/metric-target-readback";
import {
  assertRichWorkoutDraftNormalizerContracts,
  buildAiLikeRichWorkoutDraft,
  openAiFixtureResponse,
} from "./plan-authoring-doctrine/rich-workout-draft-normalizer";
import {
  buildStructuredAuthoringPlan,
  type StructuredPlanAuthoringInput,
} from "../src/lib/structured-plan-authoring";
import { addDaysIso, diffDaysIso, weekdayLong } from "../src/lib/training";
import { parseVoiceToPlanConfirmRequest } from "../src/lib/voice-to-plan-authoring";
import type { WeekdayName } from "../src/lib/weekday-rest-invariants";
import type { TrainingPlanV2 } from "../src/lib/imported-plan";

type SegmentRecord = Record<string, unknown>;

const fixedRestDays = ["Wednesday", "Sunday"] as const;
const forbiddenStructuredReviewDisplayTitleTerms = [
  "blueprint",
  "opening blueprint",
  "repaired_ai_draft",
  "backendExtendedWeeks",
  "requestedHorizonWeeks",
  "aiAuthoredHorizonWeeks",
  "ai_first_plan_blueprint_v1",
] as const;

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

function assertStructuredReviewDisplayTitleIsRunnerFacing(
  review: { displayTitle: string },
  label: string,
) {
  const normalizedTitle = review.displayTitle.toLowerCase();

  for (const term of forbiddenStructuredReviewDisplayTitleTerms) {
    assert.equal(
      normalizedTitle.includes(term.toLowerCase()),
      false,
      `${label} display title must not expose internal term ${term}`,
    );
  }
}

function buildPlanWithNoAge(input: StructuredFirstPlanOnboardingRequestInput) {
  const { authoringInput } = buildPlan(input);

  return buildStructuredAuthoringPlan({
    ...authoringInput,
    runnerProfile: {
      ...authoringInput.runnerProfile,
      age: null,
    },
  });
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

function planWithoutGeneratedTimestamp(plan: TrainingPlanV2) {
  const { created_at: _createdAt, ...stablePlan } = plan;

  return stablePlan;
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

function targetKeys(segment: SegmentRecord) {
  const target = segment.target as Record<string, unknown> | undefined;

  return target ? Object.keys(target).filter((key) => target[key] != null) : [];
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

function supportWorkoutSample(plan: TrainingPlanV2, sourceWorkoutType: string) {
  return plan.planned_workouts.find((workout) => workout.source_workout_type === sourceWorkoutType);
}

function assertSupportRunRichness(plan: TrainingPlanV2, label: string) {
  for (const sourceWorkoutType of ["easy_aerobic_run", "steady_aerobic_run", "long_aerobic_run"]) {
    const workout = supportWorkoutSample(plan, sourceWorkoutType);

    assert.ok(workout, `${label}: expected ${sourceWorkoutType} support workout`);
    assert.ok(
      workout.segments.length > 1,
      `${label}: ${sourceWorkoutType} should have opener/main/finish structure`,
    );

    for (const segment of workout.segments as SegmentRecord[]) {
      assert.ok(
        typeof segment.guidance === "string" && segment.guidance.trim().length > 0,
        `${label}: ${sourceWorkoutType} segment should include guidance`,
      );
      assert.ok(
        targetKeys(segment).includes("cue") ||
          targetKeys(segment).includes("hint") ||
          targetKeys(segment).includes("intensity"),
        `${label}: ${sourceWorkoutType} segment should include target cue, hint, or intensity`,
      );
    }
    assert.ok(
      workout.metric_mode.executable_mode,
      `${label}: metric_mode should expose executable_mode`,
    );
    if (
      workout.workout_type !== "rest" &&
      workout.metric_mode.pace_targets_allowed !== true &&
      workout.metric_mode.hr_targets_allowed !== true
    ) {
      assert.equal(
        workout.metric_mode.executable_mode,
        deriveExecutableModeFromSegments(workout.segments),
        `${label}: structure-only executable mode should match numeric segment structure`,
      );
    }
  }
}

function assertSubstantialWorkoutIdentitiesAreStructured({
  plan,
  label,
  sourceWorkoutTypes,
  minimumDurationMin,
  expectedText,
}: {
  plan: TrainingPlanV2;
  label: string;
  sourceWorkoutTypes: string[];
  minimumDurationMin: number;
  expectedText: RegExp[];
}) {
  const matchingWorkouts = plan.planned_workouts.filter(
    (workout) =>
      sourceWorkoutTypes.includes(workout.source_workout_type ?? "") &&
      workoutDurationMin(workout) >= minimumDurationMin,
  );

  assert.ok(
    matchingWorkouts.length > 0,
    `${label}: expected at least one substantial ${sourceWorkoutTypes.join(", ")} workout`,
  );

  const singleSegmentWorkouts = matchingWorkouts.map((workout) => {
    if (workout.segments.length > 1) return null;

    return `${workout.date}:${workout.source_workout_type}:${workoutDurationMin(workout)}min`;
  });

  assert.deepEqual(
    singleSegmentWorkouts.filter(Boolean),
    [],
    `${label}: substantial terrain/endurance workouts should not persist as one block`,
  );

  for (const workout of matchingWorkouts) {
    for (const segment of workout.segments as SegmentRecord[]) {
      assert.ok(
        typeof segment.guidance === "string" && segment.guidance.trim().length > 0,
        `${label}: ${workout.source_workout_type} segment should include runner guidance`,
      );
      assert.ok(
        targetKeys(segment).includes("cue") ||
          targetKeys(segment).includes("hint") ||
          targetKeys(segment).includes("intensity"),
        `${label}: ${workout.source_workout_type} segment should include target cue, hint, or intensity`,
      );
    }
  }

  const text = JSON.stringify(matchingWorkouts);

  for (const pattern of expectedText) {
    assert.match(text, pattern, `${label}: expected meaningful terrain/endurance guidance`);
  }
}

function assertNoSingleSegmentNonRestRows(
  rows: ReturnType<typeof buildPersistedWorkoutInsertRows>,
  label: string,
) {
  const singleSegmentRows = rows
    .filter(
      (row) => row.workout_type !== "rest" && ((row.steps as SegmentRecord[]) ?? []).length <= 1,
    )
    .map((row) => `${row.workout_date}:${row.workout_identity ?? row.source_workout_type}`);

  assert.deepEqual(
    singleSegmentRows,
    [],
    `${label}: saved non-rest workouts should not be anonymous one-block rows`,
  );
}

function assertNoSingleSegmentNonRestWorkouts(plan: TrainingPlanV2, label: string) {
  const singleSegmentWorkouts = nonRestWorkouts(plan)
    .filter((workout) => workout.segments.length <= 1)
    .map((workout) => `${workout.date}:${workoutIdentityLabel(workout)}`);

  assert.deepEqual(
    singleSegmentWorkouts,
    [],
    `${label}: non-rest workouts should not regress into one-block shells`,
  );
}

function assertNoSingleSegmentNonRestWorkoutsThroughWeek(
  plan: TrainingPlanV2,
  label: string,
  maxWeekNumber: number,
) {
  const singleSegmentWorkouts = nonRestWorkouts(plan)
    .filter((workout) => workout.week_number <= maxWeekNumber && workout.segments.length <= 1)
    .map((workout) => `${workout.date}:${workoutIdentityLabel(workout)}`);

  assert.deepEqual(
    singleSegmentWorkouts,
    [],
    `${label}: early non-rest workouts should not regress into one-block shells`,
  );
}

function assertStructuredCreatePersistsRichWorkoutTruth(
  input: StructuredFirstPlanOnboardingRequestInput,
  label: string,
) {
  const { plan } = buildPlan(input);
  const preparedApply = prepareImportedPlanApplyPolicy(
    plan,
    { workouts: [], logsByWorkoutId: new Map() },
    null,
    null,
    plan.start_date,
    null,
  );
  const rows = buildPersistedWorkoutInsertRows(
    "00000000-0000-4000-8000-000000000950",
    "00000000-0000-4000-8000-000000000951",
    preparedApply.importedSeed.workouts,
  );
  const missingRichRows = rows
    .filter(
      (row) =>
        !row.workout_family ||
        !row.workout_identity ||
        !row.calendar_icon_key ||
        !row.goal_context ||
        !row.metric_mode,
    )
    .map((row) => `${row.workout_date}:${row.title}`);

  assert.deepEqual(missingRichRows, [], `${label}: saved rows should persist rich workout fields`);
  assertNoSingleSegmentNonRestRows(rows, label);
  assertRichWorkoutContract(plan, label);
  assertFixedRestDays(plan);

  return { plan, rows };
}

function assertFixedRestDays(plan: TrainingPlanV2) {
  const violations = nonRestWorkouts(plan).filter((workout) =>
    fixedRestDays.includes(workout.weekday as (typeof fixedRestDays)[number]),
  );

  assert.equal(violations.length, 0, "fixed rest days must not contain non-rest workouts");
}

function assertFixedRestDayNames(plan: TrainingPlanV2, restDays: WeekdayName[], label: string) {
  const restDaySet = new Set(restDays);
  const violations = nonRestWorkouts(plan).filter((workout) =>
    restDaySet.has(workout.weekday as WeekdayName),
  );

  assert.deepEqual(
    violations.map((workout) => `${workout.date}:${workout.weekday}:${workout.title}`),
    [],
    `${label}: fixed rest days must not contain non-rest workouts`,
  );
}

function assertWeeklyLongRunDay(plan: TrainingPlanV2, expectedWeekday: WeekdayName, label: string) {
  const weekNumbers = [...new Set(plan.planned_workouts.map((workout) => workout.week_number))];

  for (const weekNumber of weekNumbers) {
    const longRuns = plan.planned_workouts.filter(
      (workout) =>
        workout.week_number === weekNumber &&
        (workout.workout_family === "long" || workout.workout_type === "long_run"),
    );

    assert.equal(longRuns.length, 1, `${label}: week ${weekNumber} should have one long run`);
    assert.equal(
      longRuns[0]!.weekday,
      expectedWeekday,
      `${label}: week ${weekNumber} long run should land on ${expectedWeekday}`,
    );
  }
}

function assertRecoveryFirstAfterLongRuns(plan: TrainingPlanV2, label: string) {
  const runningWorkouts = nonRestWorkouts(plan).sort((left, right) =>
    left.date.localeCompare(right.date),
  );

  for (let index = 0; index < runningWorkouts.length; index += 1) {
    const longRun = runningWorkouts[index]!;

    if (!isLongRunLikeWorkout(longRun)) {
      continue;
    }

    const nextWorkout = runningWorkouts[index + 1] ?? null;

    if (!nextWorkout) {
      continue;
    }

    const nextIdentity =
      nextWorkout.workout_identity ?? nextWorkout.source_workout_type ?? nextWorkout.workout_type;

    assert.ok(
      nextIdentity === "recovery_jog" || nextIdentity === "easy_aerobic_run",
      `${label}: ${nextWorkout.date} follows long run ${longRun.date} and must be recovery/easy, not ${nextIdentity}`,
    );
    assert.notEqual(
      nextIdentity,
      "steady_aerobic_run",
      `${label}: next running slot after long run must not be steady_aerobic_run`,
    );
  }
}

function isLongRunLikeWorkout(workout: TrainingPlanV2["planned_workouts"][number]) {
  const identity = workout.workout_identity ?? workout.source_workout_type ?? workout.workout_type;

  return (
    workout.workout_family === "long" ||
    workout.workout_type === "long_run" ||
    identity === "hike_run_endurance" ||
    identity === "mountain_long_run_time_on_feet" ||
    identity === "ultra_time_on_feet_durability"
  );
}

function workoutIdentityLabel(workout: TrainingPlanV2["planned_workouts"][number]) {
  return workout.workout_identity ?? workout.source_workout_type ?? workout.workout_type;
}

function assertLowSupportMarathonExtensionRichness({
  plan,
  extensionStartWeek,
  label,
}: {
  plan: TrainingPlanV2;
  extensionStartWeek: number;
  label: string;
}) {
  const extensionWeeks = weekIdentitySequences(plan, extensionStartWeek);

  assert.ok(extensionWeeks.length > 0, `${label}: expected backend-extended weeks`);
  assert.ok(
    extensionWeeks.some((week) => week.identities.includes("easy_run_with_strides")),
    `${label}: extension should include gentle strides support when safely placed`,
  );
  assert.ok(
    extensionWeeks.some((week) => week.identities.includes("cutback_aerobic_run")),
    `${label}: extension should include cutback aerobic support in lower-load weeks`,
  );
  assert.ok(
    extensionWeeks.some((week) => week.identities.includes("long_run_with_steady_finish")),
    `${label}: extension should include safe long-run steady-finish variation`,
  );
  assert.ok(
    extensionWeeks.some((week) => week.identities.includes("cutback_long_run")),
    `${label}: extension should preserve cutback long-run archetypes`,
  );
  assert.ok(
    extensionWeeks.some((week) => week.identities.includes("taper_long_run")),
    `${label}: extension should preserve taper long-run archetypes`,
  );

  const uniqueSequences = new Set(extensionWeeks.map((week) => week.identities.join(" > ")));
  assert.ok(
    uniqueSequences.size >= 4,
    `${label}: extension should use multiple safe week archetypes; saw ${Array.from(
      uniqueSequences,
    ).join(" | ")}`,
  );
  assert.ok(
    longestRepeatedSequenceRun(extensionWeeks) <= 3,
    `${label}: extension should not repeat the exact same non-rest identity sequence for too many consecutive weeks`,
  );

  const hardQualityIdentities = new Set([
    "time_intervals",
    "distance_intervals",
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "controlled_tempo_session",
    "half_marathon_threshold_durability",
    "race_pace_session",
    "marathon_steady_specificity",
    "progression_run",
    "rolling_hills_session",
    "hill_repeats",
  ]);
  const hardQualityViolations = extensionWeeks.flatMap((week) =>
    week.identities
      .filter((identity) => hardQualityIdentities.has(identity))
      .map((identity) => `week ${week.weekNumber}:${identity}`),
  );

  assert.deepEqual(
    hardQualityViolations,
    [],
    `${label}: low-support marathon extension should not add hard intervals, tempo, hills, or marathon-specific quality by default`,
  );
}

function assertBeginnerRunWalkAdaptation({
  plan,
  adaptationWeeks,
  label,
}: {
  plan: TrainingPlanV2;
  adaptationWeeks: number;
  label: string;
}) {
  const earlyWorkouts = nonRestWorkouts(plan).filter(
    (workout) => workout.week_number <= adaptationWeeks,
  );
  const runWalkWorkouts = earlyWorkouts.filter((workout) => hasRunWalkAdaptationMarker(workout));
  const forbiddenEarlyIntensity = new Set([
    "steady_aerobic_run",
    "easy_run_with_strides",
    "controlled_tempo_session",
    "time_intervals",
    "distance_intervals",
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "half_marathon_threshold_durability",
    "marathon_steady_specificity",
    "race_pace_session",
    "progression_run",
    "taper_tuneup_run",
  ]);
  const forbiddenEarlyWorkouts = earlyWorkouts
    .filter((workout) => forbiddenEarlyIntensity.has(workoutIdentityLabel(workout)))
    .map((workout) => `${workout.date}:${workoutIdentityLabel(workout)}`);
  const longRunAdaptationCount = earlyWorkouts.filter(
    (workout) => isLongRunLikeWorkout(workout) && hasRunWalkAdaptationMarker(workout),
  ).length;

  assert.ok(earlyWorkouts.length > 0, `${label}: expected early non-rest workouts`);
  assert.ok(
    runWalkWorkouts.length >= Math.min(earlyWorkouts.length, adaptationWeeks * 2),
    `${label}: expected run/walk adaptation markers in early weeks; summary=${JSON.stringify(
      runWalkAdaptationSummary(plan, adaptationWeeks),
    )}`,
  );
  assert.ok(
    longRunAdaptationCount >= Math.min(adaptationWeeks, earlyWorkouts.length),
    `${label}: early long-run slots should include run/walk endurance adaptation`,
  );
  assert.deepEqual(
    forbiddenEarlyWorkouts,
    [],
    `${label}: early adaptation should not include steady, tempo, intervals, race, progression, or strides overload`,
  );
}

function hasRunWalkAdaptationMarker(workout: TrainingPlanV2["planned_workouts"][number]) {
  return (workout.segments as SegmentRecord[]).some((segment) => {
    const target = segment.target as Record<string, unknown> | undefined;

    return target?.intensity === "run_walk_adaptation";
  });
}

function runWalkAdaptationSummary(plan: TrainingPlanV2, adaptationWeeks: number) {
  return Array.from({ length: adaptationWeeks }, (_value, index) => {
    const weekNumber = index + 1;
    const workouts = nonRestWorkouts(plan).filter((workout) => workout.week_number === weekNumber);

    return {
      weekNumber,
      identities: workouts.map(workoutIdentityLabel),
      runWalkCount: workouts.filter(hasRunWalkAdaptationMarker).length,
      postLongRunSamples: workouts
        .filter((workout, workoutIndex) => {
          const previousWorkout = workouts[workoutIndex - 1];

          return previousWorkout ? isLongRunLikeWorkout(previousWorkout) : false;
        })
        .map(workoutIdentityLabel),
    };
  });
}

function weekIdentitySequences(plan: TrainingPlanV2, startWeek: number) {
  const weeks = new Map<number, string[]>();

  for (const workout of nonRestWorkouts(plan).sort((left, right) =>
    left.date.localeCompare(right.date),
  )) {
    if (workout.week_number < startWeek) {
      continue;
    }

    const identities = weeks.get(workout.week_number) ?? [];
    identities.push(workoutIdentityLabel(workout));
    weeks.set(workout.week_number, identities);
  }

  return Array.from(weeks.entries()).map(([weekNumber, identities]) => ({
    weekNumber,
    identities,
  }));
}

function longestRepeatedSequenceRun(weeks: Array<{ identities: string[] }>) {
  let longestRun = 0;
  let currentRun = 0;
  let previousSequence: string | null = null;

  for (const week of weeks) {
    const sequence = week.identities.join(" > ");

    if (sequence === previousSequence) {
      currentRun += 1;
    } else {
      previousSequence = sequence;
      currentRun = 1;
    }

    longestRun = Math.max(longestRun, currentRun);
  }

  return longestRun;
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

function assertRichWorkoutContract(plan: TrainingPlanV2, label: string) {
  for (const workout of plan.planned_workouts) {
    assert.ok(workout.workout_family, `${label}: workout_family should be present`);
    assert.ok(workout.workout_identity, `${label}: workout_identity should be present`);
    assert.ok(workout.calendar_icon_key, `${label}: calendar_icon_key should be present`);
    assert.ok(workout.metric_mode, `${label}: metric_mode should be present`);

    const resolved = resolveCanonicalWorkoutModel({
      workoutType: workout.workout_type,
      sourceWorkoutType: workout.source_workout_type ?? null,
      workoutFamily: workout.workout_family,
      workoutIdentity: workout.workout_identity,
      calendarIconKey: workout.calendar_icon_key,
      metricMode: workout.metric_mode,
      title: workout.title,
      steps: workout.segments as SegmentRecord[],
    });

    assert.equal(
      workout.workout_family,
      resolved.workoutFamily,
      `${label}: workout_family should match backend compatibility mapping`,
    );
    assert.equal(
      workout.workout_identity,
      resolved.workoutIdentity,
      `${label}: workout_identity should match backend compatibility mapping`,
    );
    assert.equal(
      workout.calendar_icon_key,
      resolved.calendarIconKey,
      `${label}: calendar_icon_key should match backend compatibility mapping`,
    );
    if (hasTargetKey({ ...plan, planned_workouts: [workout] }, "pace_min_per_km_range")) {
      assert.equal(
        workout.metric_mode.pace_targets_allowed,
        true,
        `${label}: emitted pace targets require pace-enabled metric mode`,
      );
    }
    if (hasTargetKey({ ...plan, planned_workouts: [workout] }, "hr_bpm_range")) {
      const hasDefaultEstimatedHrTargets = workout.segments.some((segment) => {
        const target = segment.target as Record<string, unknown> | undefined;
        const recoveryTarget = segment.recovery_target as Record<string, unknown> | undefined;

        return [target, recoveryTarget].some(
          (candidate) =>
            candidate?.hr_target_source === "default_estimated_hr" &&
            typeof candidate.hr_bpm_range === "string",
        );
      });

      if (hasDefaultEstimatedHrTargets) {
        const defaultEstimatedHrOffenders = (workout.segments as SegmentRecord[]).flatMap(
          (segment) => {
            const target = segment.target as Record<string, unknown> | undefined;
            const recoveryTarget = segment.recovery_target as Record<string, unknown> | undefined;

            return [
              { target, targetKind: "target" as const },
              { target: recoveryTarget, targetKind: "recovery_target" as const },
            ]
              .filter(
                (entry) =>
                  entry.target?.hr_target_source === "default_estimated_hr" &&
                  typeof entry.target.hr_bpm_range === "string" &&
                  !allowsDefaultEstimatedHrTarget({
                    sourceWorkoutType: workout.source_workout_type,
                    workoutType: workout.workout_type,
                    segmentType: String(segment.segment_type ?? ""),
                    segmentId: String(segment.segment_id ?? ""),
                    targetKind: entry.targetKind,
                  }),
              )
              .map(
                (entry) =>
                  `${workout.workout_id}.${String(segment.segment_type ?? "unknown")}.${
                    entry.targetKind
                  }`,
              );
          },
        );

        assert.deepEqual(
          defaultEstimatedHrOffenders,
          [],
          `${label}: default estimated HR targets are allowed only on aerobic support main work`,
        );
        assert.equal(
          workout.metric_mode.hr_targets_allowed,
          false,
          `${label}: default estimated HR targets must not enable personal HR target mode`,
        );
        assert.equal(
          workout.metric_mode.hr_target_source,
          "default_estimated_hr",
          `${label}: default estimated HR targets should preserve source metadata`,
        );
        continue;
      }

      assert.equal(
        workout.metric_mode.hr_targets_allowed,
        true,
        `${label}: emitted HR targets require HR-enabled metric mode`,
      );
    }
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
  assertNoDefaultEstimatedHrTargets(plan, `${goalDistance} with age but no personal HR zones`);
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
assertGoalFamilyTerrainSpecificityContracts({ buildPlan, buildRequest });

const ultraEffortOnlyRichnessPlan = buildPlan(
  buildRequest("ultra_marathon", {
    benchmark: { kind: "unknown" },
    execution: { watchAccess: "none", guidancePreference: "effort" },
  }),
).plan;
assertSubstantialWorkoutIdentitiesAreStructured({
  plan: ultraEffortOnlyRichnessPlan,
  label: "S7 ultra effort-only richness",
  sourceWorkoutTypes: ["ultra_time_on_feet_durability"],
  minimumDurationMin: 45,
  expectedText: [/time[- ]on[- ]feet/i, /hike/i, /durability|recovery protection/i],
});

const mountainEffortOnlyRichnessPlan = buildPlan(
  buildRequest("mountain_running", {
    benchmark: { kind: "unknown" },
    execution: { watchAccess: "none", guidancePreference: "effort" },
  }),
).plan;
assertSubstantialWorkoutIdentitiesAreStructured({
  plan: mountainEffortOnlyRichnessPlan,
  label: "S8 mountain technical trail richness",
  sourceWorkoutTypes: ["technical_trail_easy"],
  minimumDurationMin: 30,
  expectedText: [/technical|trail|footing/i, /control|risky|cautious/i],
});
assertSubstantialWorkoutIdentitiesAreStructured({
  plan: mountainEffortOnlyRichnessPlan,
  label: "S8 mountain climbing steady richness",
  sourceWorkoutTypes: ["climbing_steady_run"],
  minimumDurationMin: 35,
  expectedText: [/climb|hill|hilly/i, /controlled|grade|descent/i],
});
assertGoalFamilyQualityPolicyContracts({
  assertBeginnerRunWalkAdaptation,
  assertFixedRestDayNames,
  assertNoDefaultEstimatedHrTargets,
  assertNoFakeMetricTargetRegression,
  assertNoSingleSegmentNonRestWorkouts,
  assertNoSingleSegmentNonRestWorkoutsThroughWeek,
  assertRecoveryFirstAfterLongRuns,
  assertRichWorkoutContract,
  assertWeeklyLongRunDay,
  buildPlan,
  buildRequest,
  hasTargetKey,
});
assertMetricTargetReadbackContracts({
  buildPlan,
  buildPlanWithNoAge,
  buildRequest,
});
assertRichWorkoutImportExportContracts({
  buildPlan,
  buildRequest,
  readAiFirstPlanReferenceFixture,
});
await assertRichWorkoutDraftNormalizerContracts({
  assertRichWorkoutContract,
  buildPlan,
  buildPlanWithNoAge,
  buildRequest,
});
assertAiFirstPlanBlueprintEnvelopeContracts({
  assertFixedRestDays,
  assertFixedRestDayNames,
  assertNoDefaultEstimatedHrTargets,
  assertRichWorkoutContract,
  assertRoadPerformanceQualityCadence,
  assertWeeklyLongRunDay,
});
await assertFirstPlanReleaseGateContracts({
  assertBeginnerRunWalkAdaptation,
  assertFixedRestDays,
  assertFixedRestDayNames,
  assertLowSupportMarathonExtensionRichness,
  assertNoFakeMetricTargetRegression,
  assertNoSingleSegmentNonRestWorkouts,
  assertRecoveryFirstAfterLongRuns,
  assertRichWorkoutContract,
  assertStructureOnlyExecutableContract,
  assertWeeklyLongRunDay,
  buildAiFirstPlanAuthoringInput,
  buildAiFirstPlanBlueprintFixture,
  buildBalancedHalfEnvelopeAuthoringInput,
  buildLongHorizonMarathonAiFirstPlanAuthoringInput,
  buildRequest,
  countNonRestWorkouts,
  openAiFixtureResponse,
  readAiFirstPlanReferenceFixture,
});
await assertActivePlanRefreshRichDraftContracts({
  assertFixedRestDays,
  assertMountainTrailDoctrine,
  assertNoRoadRaceSharpening,
  assertNoTaperPeakLongRun,
  assertRichWorkoutContract,
  buildAiLikeRichWorkoutDraft,
  buildPlan,
  buildRequest,
  hasTargetKey,
  planWithoutGeneratedTimestamp,
  sourceWorkoutTypes,
});
assertRichWorkoutContract(buildPlan(buildRequest("5k")).plan, "5K rich contract");
assertRichWorkoutContract(buildPlan(buildRequest("half_marathon")).plan, "half rich contract");
assertRichWorkoutContract(
  buildPlan(buildRequest("mountain_running")).plan,
  "mountain rich contract",
);

{
  const { plan: halfBalancedNoBenchmark } = assertStructuredCreatePersistsRichWorkoutTruth(
    buildRequest("half_marathon", {
      benchmark: { fitnessLevel: "running_regularly", recent5kTime: null },
      execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
    }),
    "saved structured half marathon balanced without benchmark",
  );

  assert.equal(
    hasTargetKey(halfBalancedNoBenchmark, "pace_min_per_km_range"),
    false,
    "saved half marathon without benchmark should stay effort-only",
  );
  assertNoDefaultEstimatedHrTargets(
    halfBalancedNoBenchmark,
    "saved half marathon without benchmark but with age",
  );
}

{
  const request = buildRequest("half_marathon", {
    benchmark: { kind: "unknown" },
    goal: {
      goalDistance: "half_marathon",
      goalStyle: "target_time",
      terrainFocus: "standard",
      targetTime: "2:00:00",
      targetDate: "2026-08-30",
    },
    execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
  });
  const { input, authoringInput, plan } = buildPlan(request);
  const pollutedPlanName = {
    ...plan,
    plan_name:
      "Opening blueprint ai_first_plan_blueprint_v1 repaired_ai_draft backendExtendedWeeks requestedHorizonWeeks aiAuthoredHorizonWeeks",
  };
  const review = buildStructuredFirstPlanDraftReview(input, pollutedPlanName, authoringInput);
  const persistenceMetadata = buildPlanScopedStructuredAuthoringMetadata({
    source: "structured_first_plan",
    authoringInput,
    goalStyle: input.goal.goalStyle,
    targetTime: input.goal.targetTime,
    metricPolicySummary: review.planShape.metricPolicy,
    reviewAssumptions: review.assumptions,
  });
  const goalMetadata = persistenceMetadata.goalMetadata as Record<string, unknown>;
  const planPreferences = persistenceMetadata.planPreferences as Record<string, unknown>;
  const storedAuthoringInput = planPreferences.structured_authoring_input as Record<
    string,
    unknown
  >;

  assert.equal(
    review.displayTitle,
    "Half marathon 2:00:00 target plan through 2026-08-30",
    "target-date structured review display title should describe the full plan through target date",
  );
  assert.equal(
    /16-week/i.test(review.displayTitle),
    false,
    "target-date structured review display title must not imply only an opening 16-week review",
  );
  assertStructuredReviewDisplayTitleIsRunnerFacing(
    review,
    "target-date structured first-plan review",
  );
  assert.equal(
    goalMetadata.goal_style,
    "target_time",
    "structured target-time plans should persist goal style as plan metadata",
  );
  assert.equal(
    goalMetadata.target_time,
    "2:00:00",
    "structured target-time plans should persist target time as bounded plan metadata",
  );
  assert.equal(
    plan.target_date,
    "2026-08-30",
    "structured target-time plans should persist target date in canonical plan metadata",
  );
  assert.deepEqual(
    (storedAuthoringInput.goal as Record<string, unknown>).goalStyle,
    "target_time",
    "structured authoring snapshot should preserve goal style for refresh",
  );
  assert.equal(
    hasTargetKey(plan, "pace_min_per_km_range"),
    false,
    "target-time half marathon without benchmark must stay effort-only even with watch/app mixed guidance",
  );
  assertNoDefaultEstimatedHrTargets(
    plan,
    "target-time half marathon without benchmark but with age",
  );
  assert.equal(
    sourceWorkoutTypes(plan).has("time_intervals") ||
      sourceWorkoutTypes(plan).has("distance_intervals") ||
      sourceWorkoutTypes(plan).has("race_pace_session"),
    false,
    "target-time half marathon without benchmark should not unlock intervals or race-pace work",
  );
  assertSupportRunRichness(plan, "target-time half marathon without benchmark");
  assertStructuredCreatePersistsRichWorkoutTruth(
    request,
    "saved structured half marathon target-time without benchmark",
  );
}

{
  const plan = buildPlan(
    buildRequest("half_marathon", {
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: null,
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "pace" },
    }),
  ).plan;

  assert.equal(
    hasTargetKey(plan, "pace_min_per_km_range"),
    true,
    "target-time half marathon with recent 5K and watch/app pace guidance should keep pace targets",
  );
  assertSupportRunRichness(plan, "target-time half marathon with benchmark");
}

{
  const { plan } = assertStructuredCreatePersistsRichWorkoutTruth(
    buildRequest("marathon", {
      benchmark: { fitnessLevel: "beginner", recent5kTime: null },
      availability: {
        runningDaysPerWeek: 5,
        fixedRestDays: [...fixedRestDays],
        preferredLongRunDay: "Saturday",
      },
      execution: { watchAccess: "none", guidancePreference: "effort" },
    }),
    "saved structured marathon balanced low-support",
  );
  const sourceTypes = sourceWorkoutTypes(plan);
  const forbiddenHardIdentities = [
    "controlled_tempo_session",
    "time_intervals",
    "distance_intervals",
    "5k_sharpening_repeats",
    "10k_rhythm_intervals",
    "half_marathon_threshold_durability",
    "marathon_steady_specificity",
  ];

  assert.ok(
    sourceTypes.has("recovery_jog") && sourceTypes.has("cutback_aerobic_run"),
    "low-support balanced marathon should vary safe support-run purpose without adding hard days",
  );
  assert.equal(
    forbiddenHardIdentities.some((identity) => sourceTypes.has(identity)),
    false,
    "low-support balanced marathon should not add hard quality identities for calendar variety",
  );
  assert.equal(
    hasTargetKey(plan, "pace_min_per_km_range"),
    false,
    "low-support balanced marathon without benchmark/watch support should not emit pace targets",
  );
  assertNoDefaultEstimatedHrTargets(
    plan,
    "low-support balanced marathon with age but no personal HR zones",
  );
}

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
  const review = buildStructuredFirstPlanDraftReview(
    request,
    {
      ...plan,
      plan_name: "AI blueprint raw marathon plan repaired_ai_draft",
    },
    authoringInput,
  );
  const horizonWeeks =
    plan.preparation_horizon_weeks ?? authoringInput.schedule.preparationHorizonWeeks;

  assert.equal(
    review.displayTitle,
    `${horizonWeeks}-week Marathon 3:30:00 target plan`,
    "non-target-date structured review display title should use actual plan length framing",
  );
  assert.equal(
    /through \d{4}-\d{2}-\d{2}/i.test(review.displayTitle),
    false,
    "non-target-date structured review display title must not imply race-day coverage",
  );
  assertStructuredReviewDisplayTitleIsRunnerFacing(
    review,
    "default-horizon structured first-plan review",
  );

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

assertActivePlanRefreshDraftReviewContracts({
  assertFixedRestDays,
  assertMountainTrailDoctrine,
  assertNoRoadRaceSharpening,
  assertNoTaperPeakLongRun,
  assertRichWorkoutContract,
  buildAiLikeRichWorkoutDraft,
  buildPlan,
  buildRequest,
  hasTargetKey,
  planWithoutGeneratedTimestamp,
  sourceWorkoutTypes,
});

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

  if (parsedVoiceConfirm.ok) {
    assert.deepEqual(
      planWithoutGeneratedTimestamp(parsedVoiceConfirm.canonicalPlan),
      planWithoutGeneratedTimestamp(buildStructuredAuthoringPlan(authoringInput)),
      "voice confirm should rebuild deterministic canonical plan truth from authoring input",
    );
  }

  assert.match(
    readFileSync("src/lib/voice-to-plan-authoring.ts", "utf8"),
    /enableRichWorkoutDraft:\s*false/,
    "voice draft generation should explicitly keep rich workout drafts disabled for Slice 4A",
  );
}

console.log("Plan authoring doctrine fixtures passed.");
