import assert from "node:assert/strict";
import { buildImportedPlanSeed, type TrainingPlanV2 } from "../../src/lib/imported-plan";
import {
  deriveExecutableModeFromSegments,
  normalizeCanonicalMetricMode,
} from "../../src/lib/rich-workout-model";
import {
  allowsDefaultEstimatedHrTarget,
  targetIsDefaultEstimatedHr,
} from "../../src/lib/default-estimated-hr-target-policy";
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
  return allSegments(plan).some((segment) =>
    collectSegmentTargets(segment).some((target) => Boolean(target[key])),
  );
}

function stepHasTargetKey(step: Step, key: string): boolean {
  const target = step.target as Record<string, unknown> | undefined;

  return Boolean(target?.[key] || step.children?.some((child) => stepHasTargetKey(child, key)));
}

function collectSegmentTargets(segment: SegmentRecord) {
  const target = segment.target as Record<string, unknown> | undefined;
  const recoveryTarget = segment.recovery_target as Record<string, unknown> | undefined;
  const childTargets = Array.isArray(
    (segment.prescription as { children?: unknown } | undefined)?.children,
  )
    ? (
        (segment.prescription as { children?: Array<{ target?: Record<string, unknown> }> })
          .children ?? []
      )
        .map((child) => child.target)
        .filter((childTarget): childTarget is Record<string, unknown> => Boolean(childTarget))
    : [];

  return [target, recoveryTarget, ...childTargets].filter(
    (candidate): candidate is Record<string, unknown> => Boolean(candidate),
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
    `${label}: structure-only saved workout readback should keep duration/distance/repeat/children anatomy`,
  );
}

function hrTargetRecords(plan: TrainingPlanV2) {
  return plan.planned_workouts.flatMap((workout) =>
    (workout.segments as SegmentRecord[]).flatMap((segment) => {
      const targets = [
        { target: segment.target as Record<string, unknown> | undefined, targetKind: "target" },
        {
          target: segment.recovery_target as Record<string, unknown> | undefined,
          targetKind: "recovery_target",
        },
      ] as const;

      return targets
        .filter(
          (entry): entry is (typeof targets)[number] & { target: Record<string, unknown> } =>
            typeof entry.target?.hr_bpm_range === "string" ||
            typeof entry.target?.hr_bpm === "string",
        )
        .map((entry) => ({
          workout,
          segment,
          target: entry.target,
          targetKind: entry.targetKind,
        }));
    }),
  );
}

export function assertNoDefaultEstimatedHrTargets(plan: TrainingPlanV2, label: string) {
  assertDefaultEstimatedHrTargetsAreAdvisory(plan, label);
}

export function assertDefaultEstimatedHrTargetsAreAdvisory(plan: TrainingPlanV2, label: string) {
  const hrTargets = hrTargetRecords(plan);

  for (const { workout, segment, target, targetKind } of hrTargets) {
    assert.equal(
      target.hr_target_source,
      "default_estimated_hr",
      `${label}: HR target ranges without personal zones must be explicitly default-estimated`,
    );
    assert.notEqual(
      target.hr_target_source,
      "personal_hr_zone",
      `${label}: default estimated HR must not become personal HR-zone truth`,
    );
    assert.equal(
      allowsDefaultEstimatedHrTarget({
        sourceWorkoutType: workout.source_workout_type,
        workoutType: workout.workout_type,
        segmentType: String(segment.segment_type ?? ""),
        segmentId: String(segment.segment_id ?? ""),
        targetKind,
      }),
      true,
      `${label}: ${workout.workout_id}.${String(
        segment.segment_type ?? "unknown",
      )}.${targetKind} default estimated HR is allowed only on aerobic support main work`,
    );
  }

  for (const workout of plan.planned_workouts) {
    assert.equal(
      workout.metric_mode?.hr_targets_allowed,
      false,
      `${label}: metric_mode must not claim HR targets without personal zone truth`,
    );
    assert.notEqual(
      workout.metric_mode?.hr_target_source,
      "personal_hr_zone",
      `${label}: metric_mode must not claim personal HR-zone source without personal zones`,
    );
  }
}

function assertDefaultEstimatedHrReadbackSurvivesSavedWorkoutReadback(
  plan: TrainingPlanV2,
  label: string,
) {
  const importedSeed = buildImportedPlanSeed(plan);
  const defaultHrWorkouts = importedSeed.workouts.filter((workout) => {
    const metricMode = normalizeCanonicalMetricMode(workout.metricMode);
    const primaryTarget = primaryWorkoutTarget({ steps: workout.steps });
    const executableTargets = displayExecutableTargetEntries(primaryTarget, metricMode);

    return executableTargets.some((entry) => entry.key === "hr_bpm_range");
  });

  assert.ok(
    defaultHrWorkouts.length > 0,
    `${label}: expected saved-readback workouts with default estimated HR target guidance`,
  );

  for (const workout of defaultHrWorkouts) {
    const metricMode = normalizeCanonicalMetricMode(workout.metricMode);
    const primaryTarget = primaryWorkoutTarget({ steps: workout.steps });
    const executableTargets = displayExecutableTargetEntries(primaryTarget, metricMode);

    assert.equal(
      metricMode?.hrTargetsAllowed,
      false,
      `${label}: ${workout.workoutDate} default HR readback must not claim personal HR targets`,
    );
    assert.equal(
      metricMode?.hrTargetSource,
      "default_estimated_hr",
      `${label}: ${workout.workoutDate} default HR readback should preserve source metadata`,
    );
    assert.ok(
      executableTargets.some(
        (entry) => entry.key === "hr_bpm_range" && entry.label === "Estimated HR",
      ),
      `${label}: ${workout.workoutDate} should expose default HR as Estimated HR, not hidden structure-only readback`,
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

function targetHasNonDefaultHr(target: Record<string, unknown> | undefined) {
  return targetHasHr(target) && !targetIsDefaultEstimatedHr(target);
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
      .filter((segment) =>
        targetHasNonDefaultHr(segment.target as Record<string, unknown> | undefined),
      )
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
  assertDefaultEstimatedHrTargetsAreAdvisory(plan, label);
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
  assertDefaultEstimatedHrReadbackSurvivesSavedWorkoutReadback(
    noBenchmarkMixedGuidance,
    "mixed guidance without usable recent 5K truth",
  );

  for (const plan of [supportedPace, buildPlan(buildRequest("marathon")).plan, mountainPlan]) {
    assertDefaultEstimatedHrTargetsAreAdvisory(
      plan,
      "age-supported plan without personal HR zones should keep default HR advisory",
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
    .filter((segment) =>
      targetHasNonDefaultHr(segment.target as Record<string, unknown> | undefined),
    );

  assert.deepEqual(
    sustainedTempoHrTargets,
    [],
    "sustained tempo/threshold blocks must not receive HR ranges without personal zones",
  );
  assertStructureOnlyExecutableContract(halfPlan, "half-marathon metric-truth executable contract");
}
