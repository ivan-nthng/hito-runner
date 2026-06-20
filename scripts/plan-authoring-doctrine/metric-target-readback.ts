import assert from "node:assert/strict";
import { buildImportedPlanSeed, type TrainingPlanV2 } from "../../src/lib/imported-plan";
import {
  deriveExecutableModeFromSegments,
  normalizeCanonicalMetricMode,
} from "../../src/lib/rich-workout-model";
import type { StructuredFirstPlanOnboardingRequestInput } from "../../src/lib/structured-first-plan-onboarding";
import type { StructuredPlanAuthoringInput } from "../../src/lib/structured-plan-authoring";
import {
  displayExecutableTargetEntries,
  displayWorkoutStructureEntries,
  primaryWorkoutTarget,
  type Step,
} from "../../src/lib/training";

type SegmentRecord = Record<string, unknown>;

export type DoctrineRequestBuilder = (
  goalDistance: StructuredFirstPlanOnboardingRequestInput["goal"]["goalDistance"],
  overrides?: Partial<StructuredFirstPlanOnboardingRequestInput>,
) => StructuredFirstPlanOnboardingRequestInput;

export interface MetricTargetReadbackDependencies {
  buildPlan: (input: StructuredFirstPlanOnboardingRequestInput) => {
    authoringInput: StructuredPlanAuthoringInput;
    plan: TrainingPlanV2;
  };
  buildPlanWithNoAge: (input: StructuredFirstPlanOnboardingRequestInput) => TrainingPlanV2;
  buildRequest: DoctrineRequestBuilder;
}

function allSegments(plan: TrainingPlanV2): SegmentRecord[] {
  return plan.planned_workouts.flatMap((workout) => workout.segments as SegmentRecord[]);
}

export function hasTargetKey(plan: TrainingPlanV2, key: string) {
  return allSegments(plan).some((segment) => {
    const target = segment.target as Record<string, unknown> | undefined;
    const recoveryTarget = segment.recovery_target as Record<string, unknown> | undefined;

    return Boolean(target?.[key] || recoveryTarget?.[key]);
  });
}

function stepHasTargetKey(step: Step, key: string): boolean {
  const target = step.target as Record<string, unknown> | undefined;

  return Boolean(
    target?.[key] ||
    (step.work && stepHasTargetKey(step.work, key)) ||
    (step.recovery && stepHasTargetKey(step.recovery, key)),
  );
}

function assertBenchmarkPaceTargetsSurviveSavedWorkoutReadback(
  plan: TrainingPlanV2,
  label: string,
) {
  const importedSeed = buildImportedPlanSeed(plan);
  const paceWorkouts = importedSeed.workouts.filter((workout) =>
    workout.steps.some((step) => stepHasTargetKey(step, "pace_min_per_km_range")),
  );

  assert.ok(
    paceWorkouts.length > 0,
    `${label}: expected at least one saved-readback workout with benchmark-backed pace targets`,
  );

  const hiddenPaceWorkouts = paceWorkouts
    .filter((workout) => {
      const metricMode = normalizeCanonicalMetricMode(workout.metricMode);
      const primaryTarget = primaryWorkoutTarget({ steps: workout.steps });
      const executableTargets = displayExecutableTargetEntries(primaryTarget, metricMode);

      return !executableTargets.some(
        (entry) => entry.key === "pace_min_per_km_range" || entry.key === "pace",
      );
    })
    .map((workout) => `${workout.workoutDate}:${workout.sourceWorkoutType}`);

  assert.deepEqual(
    hiddenPaceWorkouts,
    [],
    `${label}: saved workout detail readback should expose allowed benchmark-backed pace targets instead of degrading to duration-only`,
  );

  for (const workout of paceWorkouts) {
    const metricMode = normalizeCanonicalMetricMode(workout.metricMode);

    assert.equal(
      metricMode?.paceTargetsAllowed,
      true,
      `${label}: ${workout.workoutDate} metric mode should keep pace targets allowed through saved readback`,
    );
    assert.equal(
      metricMode?.hrTargetsAllowed,
      false,
      `${label}: ${workout.workoutDate} should not gain executable HR targets without personal zones`,
    );
  }
}

function assertStructureOnlyReadbackKeepsNumericAnatomy(plan: TrainingPlanV2, label: string) {
  const importedSeed = buildImportedPlanSeed(plan);
  const structureOnlyWorkouts = importedSeed.workouts.filter((workout) => {
    const metricMode = normalizeCanonicalMetricMode(workout.metricMode);

    return (
      workout.workoutType !== "rest" &&
      metricMode?.executableMode === "structure_only_executable" &&
      workout.steps.length > 0
    );
  });

  assert.ok(
    structureOnlyWorkouts.length > 0,
    `${label}: expected structure-only workouts in saved-readback seed`,
  );

  const structurelessWorkouts = structureOnlyWorkouts
    .filter((workout) => displayWorkoutStructureEntries(workout).length === 0)
    .map((workout) => `${workout.workoutDate}:${workout.sourceWorkoutType}`);

  assert.deepEqual(
    structurelessWorkouts,
    [],
    `${label}: structure-only saved workout readback should keep duration/distance/repeat/work/recovery anatomy`,
  );
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

export function assertNoDefaultEstimatedHrTargets(plan: TrainingPlanV2, label: string) {
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

export function assertEffortOnlyHrGuidance(plan: TrainingPlanV2, label: string) {
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

export function assertStructureOnlyExecutableContract(plan: TrainingPlanV2, label: string) {
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

function nonRestWorkouts(plan: TrainingPlanV2) {
  return plan.planned_workouts.filter((workout) => workout.workout_type !== "rest");
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

export function assertNoFakeMetricTargetRegression(plan: TrainingPlanV2, label: string) {
  assert.equal(
    hasTargetKey(plan, "pace_min_per_km_range"),
    false,
    `${label}: should not add fake pace targets`,
  );
  assertNoDefaultEstimatedHrTargets(plan, label);
}

export function assertMetricTargetReadbackContracts({
  buildPlan,
  buildPlanWithNoAge,
  buildRequest,
}: MetricTargetReadbackDependencies) {
  const supportedPace = buildPlan(buildRequest("10k")).plan;
  const mountainPlan = buildPlan(buildRequest("mountain_running")).plan;
  const noBenchmarkMixedGuidance = buildPlan(
    buildRequest("10k", {
      benchmark: { kind: "unknown" },
      execution: { watchAccess: "watch_or_app", guidancePreference: "mixed" },
    }),
  ).plan;

  assert.equal(
    hasTargetKey(supportedPace, "pace_min_per_km_range"),
    true,
    "watch/app plus pace preference plus usable recent 5K should emit pace targets",
  );
  assertBenchmarkPaceTargetsSurviveSavedWorkoutReadback(
    supportedPace,
    "watch/app plus pace preference plus usable recent 5K",
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
    hasTargetKey(noBenchmarkMixedGuidance, "pace_min_per_km_range"),
    false,
    "mixed guidance must not invent pace targets without usable recent 5K truth",
  );
  assertStructureOnlyReadbackKeepsNumericAnatomy(
    noBenchmarkMixedGuidance,
    "mixed guidance without usable recent 5K truth",
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
