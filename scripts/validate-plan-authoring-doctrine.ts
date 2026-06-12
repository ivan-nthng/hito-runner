import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildStructuredFirstPlanAuthoringInput,
  buildStructuredFirstPlanDraftReview,
  parseStructuredFirstPlanOnboardingInput,
  type StructuredFirstPlanOnboardingRequestInput,
} from "../src/lib/structured-first-plan-onboarding";
import {
  generateCanonicalPlanFromText,
  structuredAuthoringOpenAiSchema,
} from "../src/lib/openai-plan-authoring";
import { buildPlanScopedStructuredAuthoringMetadata } from "../src/lib/plan-authoring-snapshot";
import { prepareImportedPlanApplyPolicy } from "../src/lib/plan-apply-policy";
import { buildPersistedWorkoutInsertRows } from "../src/lib/persisted-plan-replacement";
import {
  canonicalFamilyToLegacyWorkoutType,
  deriveExecutableModeFromSegments,
  resolveCanonicalWorkoutModel,
  type CalendarIconKey,
  type CanonicalWorkoutFamily,
  type CanonicalWorkoutIdentity,
} from "../src/lib/rich-workout-model";
import {
  RICH_WORKOUT_DRAFT_SCHEMA_VERSION,
  buildDeterministicRichWorkoutFallbackMetadata,
  normalizeRichWorkoutDraftToTrainingPlan,
} from "../src/lib/rich-workout-draft-authoring";
import { normalizeAiFirstPlanBlueprintToTrainingPlan } from "../src/lib/ai-first-plan-blueprint-authoring";
import {
  assertFirstPlanReleaseGateContracts,
  buildMinimalAiFirstPlanBlueprintForAuthoringInput,
} from "./plan-authoring-doctrine/first-plan-release-gates";
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
import { assertRichWorkoutImportExportContracts } from "./plan-authoring-doctrine/rich-workout-import-export";
import {
  buildStructuredAuthoringPlan,
  structuredPlanAuthoringInputSchema,
  type StructuredPlanAuthoringInput,
} from "../src/lib/structured-plan-authoring";
import { addDaysIso, diffDaysIso, weekdayLong } from "../src/lib/training";
import { parseVoiceToPlanConfirmRequest } from "../src/lib/voice-to-plan-authoring";
import { serverEnv } from "../src/lib/supabase/env";
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

function hrTargetRecords(plan: TrainingPlanV2) {
  return allSegments(plan).flatMap((segment) => {
    const targets = [segment.target, segment.recovery_target] as Array<
      Record<string, unknown> | undefined
    >;

    return targets.filter(
      (target): target is Record<string, unknown> =>
        typeof target?.hr_bpm_range === "string" || typeof target?.hr_bpm === "string",
    );
  });
}

function assertNoDefaultEstimatedHrTargets(plan: TrainingPlanV2, label: string) {
  const hrTargets = hrTargetRecords(plan);

  assert.deepEqual(hrTargets, [], `${label}: age-estimated HR must not emit HR target ranges`);

  for (const workout of plan.planned_workouts) {
    assert.equal(
      workout.metric_mode?.hr_targets_allowed,
      false,
      `${label}: metric_mode must not claim HR targets without personal zone truth`,
    );
  }
}

function assertEffortOnlyHrGuidance(plan: TrainingPlanV2, label: string) {
  assert.equal(hasTargetKey(plan, "hr_bpm_range"), false, `${label}: should not emit HR ranges`);
  assert.equal(hasTargetKey(plan, "hr_bpm"), false, `${label}: should not emit HR values`);

  for (const workout of plan.planned_workouts) {
    assert.equal(
      workout.metric_mode?.hr_targets_allowed,
      false,
      `${label}: metric_mode should keep HR disabled when no age or personal zones exist`,
    );
    assert.equal(
      workout.metric_mode?.hr_target_source,
      "effort_only",
      `${label}: metric_mode should identify effort-only HR policy`,
    );
  }
}

function assertStructureOnlyExecutableContract(plan: TrainingPlanV2, label: string) {
  for (const workout of plan.planned_workouts) {
    assert.ok(workout.metric_mode, `${label}: metric_mode should be present`);

    if (workout.workout_type === "rest") {
      assert.equal(
        workout.metric_mode?.executable_mode,
        "none",
        `${label}: rest rows should expose executable_mode=none`,
      );
      continue;
    }

    const derivedExecutableMode = deriveExecutableModeFromSegments(workout.segments);

    if (
      workout.metric_mode?.pace_targets_allowed === true ||
      workout.metric_mode?.hr_targets_allowed === true
    ) {
      assert.notEqual(
        workout.metric_mode?.executable_mode,
        "structure_only_executable",
        `${label}: metric-target rows should not be mislabeled structure-only`,
      );
      continue;
    }

    assert.equal(
      derivedExecutableMode,
      "structure_only_executable",
      `${label}: non-metric rows need numeric duration, distance, repeat, work, and recovery structure`,
    );
    assert.equal(
      workout.metric_mode?.executable_mode,
      "structure_only_executable",
      `${label}: non-metric generated rows should be structure-only executable`,
    );
  }
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
      .map((segment) => `${workout.workout_id}:${workout.source_workout_type}:${segment.label}`);
  });

  assert.deepEqual(
    offenders,
    [],
    `${label}: interval/hill/trail work targets should not carry misleading HR ranges`,
  );
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

function assertNoFakeMetricTargetRegression(plan: TrainingPlanV2, label: string) {
  assert.equal(
    hasTargetKey(plan, "pace_min_per_km_range"),
    false,
    `${label}: should not add fake pace targets`,
  );
  assertNoDefaultEstimatedHrTargets(plan, label);
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

function assertRoadPerformanceQualityCadence(plan: TrainingPlanV2, label: string) {
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
      assert.equal(
        workout.metric_mode.hr_targets_allowed,
        true,
        `${label}: emitted HR targets require HR-enabled metric mode`,
      );
    }
  }
}

function assertRichAiDraftNormalizer() {
  const paceEnabledPlan = buildPlan(buildRequest("10k")).plan;
  const defaultEstimatedHrPlan = buildPlan(
    buildRequest("half_marathon", {
      benchmark: { kind: "unknown" },
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: "2026-08-30",
      },
      execution: { watchAccess: "unknown", guidancePreference: "effort" },
    }),
  ).plan;
  const noAgeEffortOnlyPlan = buildPlanWithNoAge(
    buildRequest("half_marathon", {
      benchmark: { kind: "unknown" },
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: "2026-08-30",
      },
      execution: { watchAccess: "unknown", guidancePreference: "effort" },
    }),
  );

  const normalizedValid = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: paceEnabledPlan,
    draft: buildAiLikeRichWorkoutDraft(paceEnabledPlan),
  });

  assert.equal(normalizedValid.ok, true, "valid AI-like rich draft should normalize");

  if (normalizedValid.ok) {
    assert.equal(
      normalizedValid.metadata.status,
      "rich_draft_applied",
      "valid rich draft should report applied metadata",
    );
    assertRichWorkoutContract(normalizedValid.canonicalPlan, "normalized AI-like rich draft");

    for (const workout of nonRestWorkouts(normalizedValid.canonicalPlan)) {
      const segmentTypes = workout.segments.map((segment) => segment.segment_type);
      assert.ok(
        segmentTypes.includes("warmup"),
        "normalized non-rest rich draft should include warmup",
      );
      assert.ok(
        segmentTypes.some((segmentType) =>
          ["main", "tempo_block", "interval_block", "strides"].includes(segmentType),
        ),
        "normalized non-rest rich draft should include main-equivalent work",
      );
      assert.ok(
        segmentTypes.includes("cooldown"),
        "normalized non-rest rich draft should include cooldown",
      );
    }
  }

  const fakeHrNormalized = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: noAgeEffortOnlyPlan,
    draft: buildAiLikeRichWorkoutDraft(noAgeEffortOnlyPlan, { includeFakeHr: true }),
  });

  assert.equal(
    fakeHrNormalized.ok,
    true,
    "fake HR draft should strip unsafe HR instead of failing",
  );

  if (fakeHrNormalized.ok) {
    assertEffortOnlyHrGuidance(
      fakeHrNormalized.canonicalPlan,
      "AI rich draft normalization without age",
    );
    assert.equal(
      hasTargetKey(fakeHrNormalized.canonicalPlan, "pace_min_per_km_range"),
      false,
      "AI rich draft normalization must not invent pace targets without benchmark support",
    );
  }

  const fakeHrWithDefaultNormalized = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: defaultEstimatedHrPlan,
    draft: buildAiLikeRichWorkoutDraft(defaultEstimatedHrPlan, { includeFakeHr: true }),
  });

  assert.equal(
    fakeHrWithDefaultNormalized.ok,
    true,
    "fake HR draft with age should normalize through backend default HR policy",
  );

  if (fakeHrWithDefaultNormalized.ok) {
    assertNoDefaultEstimatedHrTargets(
      fakeHrWithDefaultNormalized.canonicalPlan,
      "AI rich draft normalization with age but no personal HR zones",
    );
    assert.equal(
      JSON.stringify(fakeHrWithDefaultNormalized.canonicalPlan).includes("150-160"),
      false,
      "AI rich draft normalization must not preserve unsupported AI-supplied HR ranges",
    );
  }

  const malformedDraft = buildAiLikeRichWorkoutDraft(defaultEstimatedHrPlan);
  const firstRunningWorkout = malformedDraft.workouts.find(
    (workout) => workout.workoutFamily !== "rest",
  );

  assert.ok(firstRunningWorkout, "malformed rich draft fixture needs one running workout");
  firstRunningWorkout!.segments = firstRunningWorkout!.segments.filter(
    (segment) => segment.segmentType === "main",
  );

  const malformedResult = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: defaultEstimatedHrPlan,
    draft: malformedDraft,
  });

  assert.equal(
    malformedResult.ok,
    false,
    "single-segment non-rest rich draft should fail normalization and trigger fallback",
  );

  if (!malformedResult.ok) {
    assert.equal(
      malformedResult.fallback.status,
      "deterministic_fallback",
      "malformed rich draft should expose deterministic fallback metadata",
    );
    assert.ok(
      malformedResult.fallback.reviewAssumptions.some((assumption) =>
        /deterministic structured generator/i.test(assumption),
      ),
      "malformed rich draft fallback should be detectable in assumptions",
    );
  }
}

async function assertTextAuthoringRichDraftOptInContract() {
  const { authoringInput } = buildPlan(buildRequest("10k"));
  const deterministicPlan = buildStructuredAuthoringPlan(authoringInput);
  const originalFetch = globalThis.fetch;
  const originalOpenAiApiKey = serverEnv.openAiApiKey;
  const originalOpenAiPlanModel = serverEnv.openAiPlanModel;
  let richDraftMode: "valid" | "malformed" = "valid";
  let requestedSchemas: string[] = [];

  serverEnv.openAiApiKey = "test-openai-key";
  serverEnv.openAiPlanModel = "test-openai-model";
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as {
      text?: { format?: { name?: string } };
    };
    const schemaName = body.text?.format?.name ?? "unknown";
    requestedSchemas.push(schemaName);

    if (schemaName === "structured_plan_authoring_input") {
      return openAiFixtureResponse(`structured-${requestedSchemas.length}`, authoringInput);
    }

    if (schemaName === "rich_workout_draft") {
      const draft = buildAiLikeRichWorkoutDraft(deterministicPlan);

      if (richDraftMode === "malformed") {
        const firstRunningWorkout = draft.workouts.find(
          (workout) => workout.workoutFamily !== "rest",
        );

        assert.ok(firstRunningWorkout, "rich draft opt-in fixture needs one running workout");
        firstRunningWorkout!.segments = firstRunningWorkout!.segments.filter(
          (segment) => segment.segmentType === "main",
        );
      }

      return openAiFixtureResponse(`rich-${requestedSchemas.length}`, draft);
    }

    return new Response(
      JSON.stringify({
        error: { message: `Unexpected schema request: ${schemaName}` },
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const defaultResult = await generateCanonicalPlanFromText(
      "Create a 10K plan with normal structure.",
    );

    assert.deepEqual(
      requestedSchemas,
      ["structured_plan_authoring_input"],
      "generateCanonicalPlanFromText should not request rich drafts by default",
    );
    assert.equal(
      defaultResult.richDraftMetadata.status,
      "not_requested",
      "default text authoring helper result should report rich draft as not requested",
    );
    assert.deepEqual(
      planWithoutGeneratedTimestamp(defaultResult.canonicalPlan),
      planWithoutGeneratedTimestamp(deterministicPlan),
      "default text authoring helper result should remain deterministic",
    );

    requestedSchemas = [];
    richDraftMode = "valid";
    const richResult = await generateCanonicalPlanFromText(
      "Create a 10K plan with rich workout structure.",
      { enableRichWorkoutDraft: true },
    );

    assert.deepEqual(
      requestedSchemas,
      ["structured_plan_authoring_input", "rich_workout_draft"],
      "opted-in text authoring should request the rich workout draft schema",
    );
    assert.equal(
      richResult.richDraftMetadata.status,
      "rich_draft_applied",
      "valid opted-in rich draft should be applied",
    );
    assert.ok(
      richResult.canonicalPlan.planned_workouts.some((workout) =>
        /^Coach-shaped /.test(workout.title),
      ),
      "opted-in rich draft should affect normalized canonical workout structure",
    );

    requestedSchemas = [];
    richDraftMode = "malformed";
    const fallbackResult = await generateCanonicalPlanFromText(
      "Create a 10K plan with malformed rich workout structure.",
      { enableRichWorkoutDraft: true },
    );

    assert.deepEqual(
      requestedSchemas,
      ["structured_plan_authoring_input", "rich_workout_draft"],
      "malformed opted-in text authoring should still request the rich draft schema",
    );
    assert.equal(
      fallbackResult.richDraftMetadata.status,
      "deterministic_fallback",
      "malformed opted-in rich draft should fall back detectably",
    );
    assert.deepEqual(
      planWithoutGeneratedTimestamp(fallbackResult.canonicalPlan),
      planWithoutGeneratedTimestamp(deterministicPlan),
      "malformed opted-in rich draft should keep deterministic canonical plan truth",
    );
  } finally {
    globalThis.fetch = originalFetch;
    serverEnv.openAiApiKey = originalOpenAiApiKey;
    serverEnv.openAiPlanModel = originalOpenAiPlanModel;
  }
}

function openAiFixtureResponse(responseId: string, payload: unknown) {
  return new Response(
    JSON.stringify({
      id: responseId,
      output_text: JSON.stringify(payload),
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function buildAiLikeRichWorkoutDraft(
  plan: TrainingPlanV2,
  options: { includeFakeHr?: boolean } = {},
) {
  return {
    schemaVersion: RICH_WORKOUT_DRAFT_SCHEMA_VERSION,
    assumptions: ["Rich draft kept Hito's deterministic rest days and metric safety gates."],
    workouts: plan.planned_workouts.map((workout) => {
      if (workout.workout_type === "rest") {
        return {
          workoutId: workout.workout_id,
          date: workout.date,
          workoutFamily: "rest",
          workoutIdentity: "rest_and_recovery",
          calendarIconKey: "rest",
          title: workout.title,
          summary: workout.summary,
          goalContext: toDraftGoalContext(workout),
          metricMode: toDraftMetricMode(workout),
          segments: [
            {
              segmentId: `${workout.workout_id}_draft_rest`,
              segmentType: "rest",
              label: "Rest",
              sequence: 1,
              prescription: emptyDraftPrescription("none"),
              guidance: "No running scheduled.",
              target: emptyDraftTarget(),
            },
          ],
        };
      }

      return {
        workoutId: workout.workout_id,
        date: workout.date,
        workoutFamily: workout.workout_family ?? "easy",
        workoutIdentity: workout.workout_identity ?? "easy_aerobic_run",
        calendarIconKey: workout.calendar_icon_key ?? "easy",
        title: `Coach-shaped ${workout.title}`,
        summary: `Richer ${workout.summary}`,
        goalContext: toDraftGoalContext(workout),
        metricMode: toDraftMetricMode(workout),
        segments: [
          buildDraftSegment(workout, "warmup", 1, "Warm up", 8, options),
          buildDraftSegment(workout, "main", 2, "Purposeful main set", 24, options),
          buildDraftSegment(workout, "cooldown", 3, "Cool down", 6, options),
        ],
      };
    }),
  };
}

function buildDraftSegment(
  workout: TrainingPlanV2["planned_workouts"][number],
  segmentType: "warmup" | "main" | "cooldown",
  sequence: number,
  label: string,
  durationMin: number,
  options: { includeFakeHr?: boolean },
) {
  return {
    segmentId: `${workout.workout_id}_draft_${sequence}`,
    segmentType,
    label,
    sequence,
    prescription: {
      mode: "time",
      durationMin,
      distanceKm: null,
      repeatCount: null,
      repeatUnit: null,
      recoveryUnit: null,
    },
    guidance: `${label} with clear effort control and no invented metrics.`,
    target: {
      ...emptyDraftTarget(),
      intensity: segmentType === "main" ? "controlled_effort" : "easy",
      cue: segmentType === "main" ? "Stay smooth and purposeful." : "Keep it relaxed.",
      hint:
        segmentType === "cooldown"
          ? "Finish able to speak comfortably."
          : "Let effort guide the segment.",
      hrBpmRange: options.includeFakeHr ? "150-160" : null,
      hrBpm: options.includeFakeHr ? "155" : null,
      paceMinPerKmRange: options.includeFakeHr ? "4:45-5:00" : null,
    },
  };
}

function toDraftGoalContext(workout: TrainingPlanV2["planned_workouts"][number]) {
  return {
    goalType: workout.goal_context?.goal_type ?? "build_consistency",
    goalStyle: workout.goal_context?.goal_style ?? null,
    terrainFocus: workout.goal_context?.terrain_focus ?? "standard",
    targetDate: workout.goal_context?.target_date ?? null,
    targetTime: workout.goal_context?.target_time ?? null,
  };
}

function toDraftMetricMode(workout: TrainingPlanV2["planned_workouts"][number]) {
  return {
    guidance: workout.metric_mode?.guidance ?? "effort",
    paceTargetsAllowed: workout.metric_mode?.pace_targets_allowed ?? false,
    hrTargetsAllowed: workout.metric_mode?.hr_targets_allowed ?? false,
    reason: workout.metric_mode?.reason ?? "Fixture metric mode mirrors deterministic truth.",
  };
}

function emptyDraftPrescription(mode: "none") {
  return {
    mode,
    durationMin: null,
    distanceKm: null,
    repeatCount: null,
    repeatUnit: null,
    recoveryUnit: null,
  };
}

function emptyDraftTarget() {
  return {
    intensity: null,
    rpe: null,
    cue: null,
    hint: null,
    paceMinPerKmRange: null,
    pace: null,
    hrBpmRange: null,
    hrBpm: null,
  };
}

function assertRichIdentityMapping(
  sourceWorkoutType: string | null,
  workoutType: TrainingPlanV2["planned_workouts"][number]["workout_type"],
  expected: {
    identity: CanonicalWorkoutIdentity;
    family: CanonicalWorkoutFamily;
    icon: CalendarIconKey;
    legacyWorkoutType?: ReturnType<typeof canonicalFamilyToLegacyWorkoutType>;
  },
) {
  const resolved = resolveCanonicalWorkoutModel({
    workoutType,
    sourceWorkoutType,
    title: sourceWorkoutType ?? workoutType,
    steps: [],
  });

  assert.equal(
    resolved.workoutIdentity,
    expected.identity,
    `${sourceWorkoutType ?? workoutType} should map to canonical workout identity`,
  );
  assert.equal(
    resolved.workoutFamily,
    expected.family,
    `${sourceWorkoutType ?? workoutType} should map to canonical workout family`,
  );
  assert.equal(
    resolved.calendarIconKey,
    expected.icon,
    `${sourceWorkoutType ?? workoutType} should map to canonical calendar icon`,
  );
  assert.equal(
    canonicalFamilyToLegacyWorkoutType(resolved.workoutFamily, resolved.workoutIdentity),
    expected.legacyWorkoutType ??
      (workoutType === "tempo" ||
      workoutType === "intervals" ||
      workoutType === "progression" ||
      workoutType === "race" ||
      workoutType === "quality"
        ? "quality"
        : workoutType === "recovery"
          ? "easy"
          : workoutType),
    `${sourceWorkoutType ?? workoutType} should map back to the expected legacy workout type`,
  );
}

function assertLegacyCompactOnlyInference(
  title: string,
  expected: {
    identity: CanonicalWorkoutIdentity;
    family: CanonicalWorkoutFamily;
    icon: CalendarIconKey;
  },
  steps: SegmentRecord[] = [],
) {
  const resolved = resolveCanonicalWorkoutModel({
    workoutType: "quality",
    sourceWorkoutType: null,
    title,
    steps,
  });

  assert.equal(
    resolved.workoutIdentity,
    expected.identity,
    `compact-only title "${title}" should infer useful workout identity`,
  );
  assert.equal(
    resolved.workoutFamily,
    expected.family,
    `compact-only title "${title}" should infer useful workout family`,
  );
  assert.equal(
    resolved.calendarIconKey,
    expected.icon,
    `compact-only title "${title}" should infer useful calendar icon`,
  );
}

function assertRichCompatibilityMapping() {
  assertRichIdentityMapping("easy_aerobic_run", "easy", {
    identity: "easy_aerobic_run",
    family: "easy",
    icon: "easy",
  });
  assertRichIdentityMapping("steady_aerobic_run", "steady_or_easy", {
    identity: "steady_aerobic_run",
    family: "steady",
    icon: "steady",
  });
  assertRichIdentityMapping("aerobic_strides", "easy", {
    identity: "easy_run_with_strides",
    family: "easy",
    icon: "easy",
  });
  assertRichIdentityMapping("5k_sharpening_repeats", "quality", {
    identity: "5k_sharpening_repeats",
    family: "intervals",
    icon: "intervals",
  });
  assertRichIdentityMapping("10k_rhythm_intervals", "quality", {
    identity: "10k_rhythm_intervals",
    family: "intervals",
    icon: "intervals",
  });
  assertRichIdentityMapping("half_marathon_threshold_durability", "tempo", {
    identity: "half_marathon_threshold_durability",
    family: "tempo",
    icon: "tempo",
  });
  assertRichIdentityMapping("marathon_steady_specificity", "steady_or_easy", {
    identity: "marathon_steady_specificity",
    family: "steady",
    icon: "steady",
  });
  assertRichIdentityMapping("ultra_time_on_feet_durability", "steady_or_easy", {
    identity: "ultra_time_on_feet_durability",
    family: "long",
    icon: "long",
    legacyWorkoutType: "long_run",
  });
  assertRichIdentityMapping("controlled_downhill_durability", "quality", {
    identity: "controlled_downhill_durability",
    family: "hills",
    icon: "hills",
  });
  assertRichIdentityMapping("hike_run_endurance", "steady_or_easy", {
    identity: "hike_run_endurance",
    family: "trail",
    icon: "trail",
    legacyWorkoutType: "long_run",
  });
  assertRichIdentityMapping("mountain_long_run_time_on_feet", "long_run", {
    identity: "mountain_long_run_time_on_feet",
    family: "trail",
    icon: "trail",
  });
  assertRichIdentityMapping("rest_and_recovery", "rest", {
    identity: "rest_and_recovery",
    family: "rest",
    icon: "rest",
  });
  assertRichIdentityMapping(null, "quality", {
    identity: "quality_session",
    family: "intervals",
    icon: "intervals",
  });
  assertLegacyCompactOnlyInference("Controlled tempo session", {
    identity: "controlled_tempo_session",
    family: "tempo",
    icon: "tempo",
  });
  assertLegacyCompactOnlyInference("Distance intervals", {
    identity: "distance_intervals",
    family: "intervals",
    icon: "intervals",
  });
  assertLegacyCompactOnlyInference("Time intervals", {
    identity: "time_intervals",
    family: "intervals",
    icon: "intervals",
  });
  assertLegacyCompactOnlyInference("Introductory Controlled Intervals", {
    identity: "distance_intervals",
    family: "intervals",
    icon: "intervals",
  });
  assertLegacyCompactOnlyInference("Reduced Load Race Rhythm", {
    identity: "race_pace_session",
    family: "race",
    icon: "race",
  });
  assertLegacyCompactOnlyInference("Race Week Leg Opener", {
    identity: "taper_tuneup_run",
    family: "race",
    icon: "race",
  });
  assertLegacyCompactOnlyInference(
    "Quality session",
    {
      identity: "distance_intervals",
      family: "intervals",
      icon: "intervals",
    },
    [
      {
        type: "intervals",
        segment_type: "interval_block",
        label: "Intervals",
        target: { intensity: "hard but controlled" },
      },
    ],
  );
  assertLegacyCompactOnlyInference("Progression run", {
    identity: "progression_run",
    family: "progression",
    icon: "progression",
  });
  assertLegacyCompactOnlyInference("Race pace tune-up", {
    identity: "taper_tuneup_run",
    family: "race",
    icon: "race",
  });
  assertLegacyCompactOnlyInference("Rolling hills session", {
    identity: "rolling_hills_session",
    family: "hills",
    icon: "hills",
  });
  assertLegacyCompactOnlyInference("Uphill repeats", {
    identity: "uphill_repeats",
    family: "hills",
    icon: "hills",
  });
  assertLegacyCompactOnlyInference("Quality session", {
    identity: "quality_session",
    family: "intervals",
    icon: "intervals",
  });
  assertLegacyCompactOnlyInference(
    "Quality session",
    {
      identity: "controlled_tempo_session",
      family: "tempo",
      icon: "tempo",
    },
    [
      {
        type: "run",
        segment_type: "tempo_block",
        label: "Controlled tempo block",
        target: { intensity: "tempo" },
      },
    ],
  );

  const restMetricMode = resolveCanonicalWorkoutModel({
    workoutType: "rest",
    sourceWorkoutType: null,
    title: "Rest day",
    steps: [],
  }).metricMode;

  assert.equal(
    restMetricMode.reason,
    "Rest day has no execution metric targets.",
    "rest metric mode should not imply effort execution cues",
  );

  const defaultHrMetricMode = resolveCanonicalWorkoutModel({
    workoutType: "easy",
    sourceWorkoutType: null,
    title: "Easy aerobic run",
    steps: [
      {
        segment_type: "main",
        label: "Easy aerobic block",
        target: {
          hr_bpm_range: "110-130 bpm",
          hr_target_source: "default_estimated_hr",
          label: "Default HR guidance",
          source_note: "Estimated from age, not personalized zones.",
        },
      },
    ],
  }).metricMode;

  assert.equal(
    defaultHrMetricMode.hrTargetSource,
    "default_estimated_hr",
    "metric-mode fallback should preserve target-level default HR source",
  );
  assert.equal(
    defaultHrMetricMode.hrTargetLabel,
    "Default HR guidance",
    "metric-mode fallback should preserve default HR label",
  );
  assert.equal(
    defaultHrMetricMode.hrTargetsAllowed,
    false,
    "metric-mode fallback must not treat default HR source as personal HR target truth",
  );
  assert.equal(
    defaultHrMetricMode.executableMode,
    "correction_required",
    "metric-mode fallback without numeric structure should request correction instead of effort-only execution",
  );
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

function assertBeginnerRecreationalSupportedIntensityCadence() {
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

function assertSupportedHalfMarathonMarathonSpecificity() {
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

  const beginnerMarathonBase = buildPlan(
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
      ...beginnerMarathonBase,
      schedule: {
        ...beginnerMarathonBase.schedule,
        targetDate: null,
        preparationHorizonWeeks: 16,
      },
      runnerProfile: {
        ...beginnerMarathonBase.runnerProfile,
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

  const recreationalMarathonBase = buildPlan(
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
      ...recreationalMarathonBase,
      schedule: {
        ...recreationalMarathonBase.schedule,
        targetDate: null,
        preparationHorizonWeeks: 18,
      },
      runnerProfile: {
        ...recreationalMarathonBase.runnerProfile,
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
      ...recreationalMarathonBase,
      schedule: {
        ...recreationalMarathonBase.schedule,
        targetDate: null,
        preparationHorizonWeeks: 18,
      },
      runnerProfile: {
        ...recreationalMarathonBase.runnerProfile,
        experienceLevel: "experienced_runner",
        baselineSessionsPerWeek: 5,
        baselineLongRunKm: null,
        baselineLongRunDurationMin: 95,
      },
      currentLevel: {
        ...recreationalMarathonBase.currentLevel,
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

function assertMetricTargetPolicy() {
  const supportedPace = buildPlan(buildRequest("10k")).plan;
  const mountainPlan = buildPlan(buildRequest("mountain_running")).plan;

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

  const staleUnknownWatchPacePlan = buildPlan(
    buildRequest("10k", {
      execution: { watchAccess: "unknown", guidancePreference: "pace" },
    }),
  );
  assert.equal(
    staleUnknownWatchPacePlan.authoringInput.execution.watchAccess,
    "watch_or_app",
    "supported new-plan authoring should normalize stale unknown watch access server-side",
  );
  assert.equal(
    hasTargetKey(staleUnknownWatchPacePlan.plan, "pace_min_per_km_range"),
    true,
    "usable recent 5K plus pace preference may emit pace targets after server-side watch/app normalization",
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

  for (const plan of [supportedPace, buildPlan(buildRequest("marathon")).plan, mountainPlan]) {
    assertNoDefaultEstimatedHrTargets(
      plan,
      "age-supported plan without personal HR zones should not emit default HR targets",
    );
  }

  assertEffortOnlyHrGuidance(
    buildPlanWithNoAge(buildRequest("10k")),
    "plan without age or personal HR zones",
  );

  assertNoHrOnMainTargetsForIdentities(
    supportedPace,
    ["distance_intervals", "time_intervals", "10k_rhythm_intervals", "5k_sharpening_repeats"],
    "short rep and interval workouts",
  );
  assertNoHrOnMainTargetsForIdentities(
    mountainPlan,
    [
      "uphill_repeats",
      "rolling_hills_session",
      "technical_trail_easy",
      "controlled_downhill_durability",
      "climbing_steady_run",
    ],
    "hill and technical trail workouts",
  );

  const halfPlan = buildPlan(buildRequest("half_marathon")).plan;
  const sustainedTempoHrTargets = nonRestWorkouts(halfPlan)
    .filter((workout) =>
      ["controlled_tempo_session", "half_marathon_threshold_durability"].includes(
        workout.source_workout_type ?? "",
      ),
    )
    .flatMap((workout) => workout.segments as SegmentRecord[])
    .filter((segment) =>
      ["main", "tempo_block", "interval_block"].includes(String(segment.segment_type ?? "")),
    )
    .filter((segment) => targetHasHr(segment.target as Record<string, unknown> | undefined));

  assert.deepEqual(
    sustainedTempoHrTargets,
    [],
    "sustained tempo/threshold blocks must not receive age-estimated HR ranges without personal zones",
  );
  assertStructureOnlyExecutableContract(halfPlan, "half-marathon metric-truth executable contract");
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
assertGoalFamilyWorkoutIdentity();
assertBeginnerBuildConsistencyQualityCap();
assertBeginnerRecreationalSupportedIntensityCadence();
assertSupportedHalfMarathonMarathonSpecificity();
assertMetricTargetPolicy();
assertRichCompatibilityMapping();
assertRichWorkoutImportExportContracts({
  buildPlan,
  buildRequest,
  readAiFirstPlanReferenceFixture,
});
assertRichAiDraftNormalizer();
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
await assertTextAuthoringRichDraftOptInContract();
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
