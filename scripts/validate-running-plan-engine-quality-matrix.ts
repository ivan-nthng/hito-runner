import assert from "node:assert/strict";
import {
  buildReviewedRunningPlanPreview,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import {
  buildRunningPlanCanonicalPlan,
  type RunningPlanPreviewDraft,
  type RunningPlanReviewedPreviewDraft,
} from "../src/lib/running-plan-engine-review";
import {
  summarizeRunnerFacingCanonicalRichness,
  summarizeRunningPlanCanonicalPrescriptionGrammar,
  type RunningPlanDistanceFamily,
  type RunningPlanRunnerLevel,
} from "../src/lib/plan-creation-engine";
import {
  collectTenKBeginnerDosePolicyIssues,
  resolveTenKBeginnerDosePolicyRunnerLevel,
} from "../src/lib/plan-creation-engine/ten-k-beginner-dose-policy";
import {
  benchmarkPaceUsefulWorkoutKinds,
  validateRunnerFacingTargetReadbackContract,
} from "./running-plan-engine-target-readback-contract";

const RECENT_5K_BENCHMARK = {
  kind: "recent_5k_time",
  recent5kTime: "25:00",
} as const satisfies NonNullable<RunningPlanPreviewActionInput["benchmark"]>;

type MatrixFixture = {
  id:
    | "10k_beginner_no_benchmark"
    | "10k_beginner_recent_5k_benchmark"
    | "10k_visible_beginner_sometimes_no_benchmark"
    | "10k_sometimes_recent_5k_benchmark"
    | "10k_target_time_pressure_diagnostic"
    | "half_beginner_no_benchmark"
    | "half_supported_no_benchmark"
    | "half_professional_recent_5k_benchmark"
    | "half_target_time_pressure_diagnostic"
    | "marathon_base_beginner_no_benchmark"
    | "marathon_base_supported_no_benchmark"
    | "marathon_base_professional_recent_5k_benchmark"
    | "marathon_base_target_time_pressure_diagnostic"
    | "marathon_completion_beginner_no_benchmark"
    | "marathon_completion_supported_no_benchmark"
    | "marathon_completion_professional_recent_5k_benchmark"
    | "marathon_completion_target_time_pressure_diagnostic";
  input: RunningPlanPreviewActionInput;
  expectedEndpointMeters: number | null;
  expectedFinalSourceWorkoutType: "final_selected_distance_day" | "marathon_base_endpoint";
  benchmarkBacked: boolean;
  benchmarkPaceUsefulRowsRequired?: boolean;
  lowSupportTenK?: boolean;
  beginnerHardGateWeeks?: number;
};

type CanonicalPlan = ReturnType<typeof buildRunningPlanCanonicalPlan>;
type CanonicalWorkout = CanonicalPlan["planned_workouts"][number];

const baseInput = {
  age: 36,
  heightCm: 178,
  weightKg: 74,
  daysPerWeek: 5,
  fixedRestDays: ["Wednesday", "Saturday"],
  preferredLongRunDay: "Sunday",
  startDate: "2026-06-23",
} as const;

const fixtures: readonly MatrixFixture[] = [
  fixture("10k_beginner_no_benchmark", "10K", "beginner_new_runner", {
    expectedEndpointMeters: 10_000,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
    lowSupportTenK: true,
  }),
  fixture("10k_beginner_recent_5k_benchmark", "10K", "beginner_new_runner", {
    expectedEndpointMeters: 10_000,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
    benchmark: RECENT_5K_BENCHMARK,
    benchmarkPaceUsefulRowsRequired: false,
    lowSupportTenK: true,
  }),
  fixture("10k_visible_beginner_sometimes_no_benchmark", "10K", "sometimes_runs", {
    expectedEndpointMeters: 10_000,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
    lowSupportTenK: true,
  }),
  fixture("10k_sometimes_recent_5k_benchmark", "10K", "sometimes_runs", {
    expectedEndpointMeters: 10_000,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
    benchmark: RECENT_5K_BENCHMARK,
  }),
  fixture("10k_target_time_pressure_diagnostic", "10K", "runs_a_lot", {
    expectedEndpointMeters: 10_000,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
    extraInput: { planGoalIntent: { targetFinishTime: "45:00" } },
  }),
  fixture("half_beginner_no_benchmark", "Half Marathon", "beginner_new_runner", {
    expectedEndpointMeters: 21_100,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
    beginnerHardGateWeeks: 4,
  }),
  fixture("half_supported_no_benchmark", "Half Marathon", "runs_a_lot", {
    expectedEndpointMeters: 21_100,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
  }),
  fixture("half_professional_recent_5k_benchmark", "Half Marathon", "professional_competitive", {
    expectedEndpointMeters: 21_100,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
    benchmark: RECENT_5K_BENCHMARK,
  }),
  fixture("half_target_time_pressure_diagnostic", "Half Marathon", "runs_a_lot", {
    expectedEndpointMeters: 21_100,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
    extraInput: { planGoalIntent: { targetFinishTime: "1:45:00" } },
  }),
  fixture("marathon_base_beginner_no_benchmark", "Marathon Base", "beginner_new_runner", {
    expectedEndpointMeters: null,
    expectedFinalSourceWorkoutType: "marathon_base_endpoint",
    beginnerHardGateWeeks: 4,
  }),
  fixture("marathon_base_supported_no_benchmark", "Marathon Base", "runs_a_lot", {
    expectedEndpointMeters: null,
    expectedFinalSourceWorkoutType: "marathon_base_endpoint",
  }),
  fixture(
    "marathon_base_professional_recent_5k_benchmark",
    "Marathon Base",
    "professional_competitive",
    {
      expectedEndpointMeters: null,
      expectedFinalSourceWorkoutType: "marathon_base_endpoint",
      benchmark: RECENT_5K_BENCHMARK,
    },
  ),
  fixture("marathon_base_target_time_pressure_diagnostic", "Marathon Base", "runs_a_lot", {
    expectedEndpointMeters: null,
    expectedFinalSourceWorkoutType: "marathon_base_endpoint",
    extraInput: { planGoalIntent: { targetFinishTime: "3:30:00" } },
  }),
  fixture(
    "marathon_completion_beginner_no_benchmark",
    "Marathon Completion",
    "beginner_new_runner",
    {
      expectedEndpointMeters: 42_195,
      expectedFinalSourceWorkoutType: "final_selected_distance_day",
      beginnerHardGateWeeks: 8,
    },
  ),
  fixture("marathon_completion_supported_no_benchmark", "Marathon Completion", "runs_a_lot", {
    expectedEndpointMeters: 42_195,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
  }),
  fixture(
    "marathon_completion_professional_recent_5k_benchmark",
    "Marathon Completion",
    "professional_competitive",
    {
      expectedEndpointMeters: 42_195,
      expectedFinalSourceWorkoutType: "final_selected_distance_day",
      benchmark: RECENT_5K_BENCHMARK,
    },
  ),
  fixture(
    "marathon_completion_target_time_pressure_diagnostic",
    "Marathon Completion",
    "runs_a_lot",
    {
      expectedEndpointMeters: 42_195,
      expectedFinalSourceWorkoutType: "final_selected_distance_day",
      extraInput: { planGoalIntent: { targetFinishTime: "3:45:00" } },
    },
  ),
] as const;

async function main() {
  const summaries = [];

  for (const currentFixture of fixtures) {
    const result = await buildReviewedRunningPlanPreview(currentFixture.input);
    assert.equal(result.ok, true, `${currentFixture.id} must build a reviewed preview.`);
    if (!result.ok) {
      throw new Error(result.unavailable.error.message);
    }

    const draft = result.draft;
    const canonicalPlan = buildRunningPlanCanonicalPlan(draft);
    validateFixture(currentFixture, draft, canonicalPlan);
    summaries.push(summarizeFixture(currentFixture, canonicalPlan));
  }

  console.log("Running plan engine no-write quality matrix passed.", {
    fixtureCount: summaries.length,
    fixtures: summaries,
  });
}

function fixture(
  id: MatrixFixture["id"],
  distanceFamily: RunningPlanDistanceFamily,
  runnerLevel: RunningPlanRunnerLevel,
  options: Pick<MatrixFixture, "expectedEndpointMeters" | "expectedFinalSourceWorkoutType"> & {
    benchmark?: RunningPlanPreviewActionInput["benchmark"];
    benchmarkPaceUsefulRowsRequired?: boolean;
    lowSupportTenK?: boolean;
    beginnerHardGateWeeks?: number;
    extraInput?: Partial<RunningPlanPreviewActionInput>;
  },
): MatrixFixture {
  const input = {
    ...baseInput,
    distanceFamily,
    runnerLevel,
    ...(options.benchmark ? { benchmark: options.benchmark } : {}),
    ...options.extraInput,
  } satisfies RunningPlanPreviewActionInput;

  return {
    id,
    input,
    expectedEndpointMeters: options.expectedEndpointMeters,
    expectedFinalSourceWorkoutType: options.expectedFinalSourceWorkoutType,
    benchmarkBacked: Boolean(options.benchmark),
    benchmarkPaceUsefulRowsRequired: options.benchmarkPaceUsefulRowsRequired,
    lowSupportTenK: options.lowSupportTenK,
    beginnerHardGateWeeks: options.beginnerHardGateWeeks,
  };
}

function validateFixture(
  currentFixture: MatrixFixture,
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
  canonicalPlan: CanonicalPlan,
) {
  const nonRestRows = canonicalPlan.planned_workouts.filter((row) => row.workout_type !== "rest");
  const finalNonRestRow = nonRestRows.at(-1);
  const qualityGateRunnerLevel = resolveQualityGateRunnerLevel(draft);
  const richness = summarizeRunnerFacingCanonicalRichness({
    family: draft.planFamily,
    runnerLevel: qualityGateRunnerLevel,
    loadContext: draft.normalizedInputSummary.loadContext,
    rows: canonicalPlan.planned_workouts,
  });
  const prescriptionGrammar = summarizeRunningPlanCanonicalPrescriptionGrammar(
    canonicalPlan.planned_workouts,
  );

  assert.equal(
    finalNonRestRow?.source_workout_type,
    currentFixture.expectedFinalSourceWorkoutType,
    `${currentFixture.id} must preserve the expected final workout kind.`,
  );
  assert.equal(
    draft.endpointProof.endpointDistanceMeters,
    currentFixture.expectedEndpointMeters,
    `${currentFixture.id} must preserve exact endpoint truth.`,
  );
  assert.deepEqual(richness.issues, [], `${currentFixture.id} must not collapse into flat filler.`);
  assert.deepEqual(
    prescriptionGrammar.issues,
    [],
    `${currentFixture.id} must keep numeric device-friendly prescription grammar.`,
  );

  validateRunnerFacingTargetReadbackContract(canonicalPlan, currentFixture.id);
  validateMetricTruth(currentFixture, draft, canonicalPlan);
  validateLongRunShape(currentFixture, canonicalPlan);
  validateEarlyHardWorkGate(currentFixture, canonicalPlan);
  validateChildFirstRepeatContract(currentFixture, canonicalPlan);

  if (currentFixture.lowSupportTenK) {
    const doseIssues = collectTenKBeginnerDosePolicyIssues({
      runnerLevel: draft.normalizedInputSummary.runnerLevel,
      benchmarkPaceTruth: draft.normalizedInputSummary.benchmarkPaceTruth,
      rows: draft.calendarRows.map((row) => ({
        rowId: row.rowId,
        weekNumber: row.weekNumber,
        isRestDay: row.isRestDay,
        workoutDayKind: row.workoutDayKind,
        endpointDistanceMeters: row.endpointDistanceMeters,
        segments: row.segments.map((segment) => ({
          primaryPrescription: segment.primaryPrescription,
        })),
      })),
    });
    assert.deepEqual(doseIssues, [], `${currentFixture.id} must satisfy low-support 10K dose.`);
  }
}

function validateChildFirstRepeatContract(
  currentFixture: MatrixFixture,
  canonicalPlan: CanonicalPlan,
) {
  const repeatSegments = canonicalPlan.planned_workouts.flatMap((row) =>
    row.segments
      .filter((segment) => segment.prescription?.mode === "repeats")
      .map((segment) => ({ row, segment })),
  );
  const serialized = JSON.stringify(repeatSegments);

  assert.doesNotMatch(
    serialized,
    /"work"\s*:|"recovery"\s*:/,
    `${currentFixture.id} generated repeat output must not serialize pair-shaped repeat work/recovery fields.`,
  );

  for (const { row, segment } of repeatSegments) {
    assert.equal(
      segment.target,
      undefined,
      `${currentFixture.id}.${row.workout_id}.${segment.segment_id} Repeat set parent must not carry a target.`,
    );
    assert.ok(
      segment.prescription?.children?.length,
      `${currentFixture.id}.${row.workout_id}.${segment.segment_id} must emit repeat children[].`,
    );
    assert.deepEqual(
      segment.prescription?.children?.map((child, index) => child.sequence ?? index + 1),
      segment.prescription?.children?.map((_, index) => index + 1),
      `${currentFixture.id}.${row.workout_id}.${segment.segment_id} repeat children must preserve ordered sequence.`,
    );
  }

  if (
    currentFixture.id === "half_beginner_no_benchmark" ||
    currentFixture.id === "marathon_completion_beginner_no_benchmark"
  ) {
    assert.ok(
      repeatSegments.some(({ segment }) => childRoles(segment).join(">") === "run>walk"),
      `${currentFixture.id} must express beginner adaptation as Run/Walk repeat children.`,
    );
  }

  if (currentFixture.input.distanceFamily === "Marathon Base") {
    const hillRepeat = repeatSegments.find(({ row }) => row.source_workout_type === "hills");
    if (hillRepeat) {
      assert.ok(
        childRoles(hillRepeat.segment).includes("walk"),
        `${currentFixture.id} hills must use a child-first walk/downhill recovery block.`,
      );
    }
  }

  const thresholdRepeat = repeatSegments.find(({ row }) => row.source_workout_type === "threshold");
  if (thresholdRepeat) {
    assert.deepEqual(
      childRoles(thresholdRepeat.segment),
      ["run", "work", "recover"],
      `${currentFixture.id} threshold repeats must prove arbitrary ordered children beyond Work/Recover pairs.`,
    );
  }
}

function validateMetricTruth(
  currentFixture: MatrixFixture,
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
  canonicalPlan: CanonicalPlan,
) {
  const nonRestRows = canonicalPlan.planned_workouts.filter((row) => row.workout_type !== "rest");
  const paceRows = nonRestRows.filter(rowHasPaceTargets);
  const defaultHrHardRows = nonRestRows.filter(
    (row) =>
      !defaultEstimatedHrAllowedWorkoutKinds.has(String(row.source_workout_type)) &&
      JSON.stringify(row.segments).includes("default_estimated_hr"),
  );
  const serialized = JSON.stringify(canonicalPlan.planned_workouts);

  assert.equal(
    draft.normalizedInputSummary.benchmarkPaceTruth?.kind === "recent_5k",
    currentFixture.benchmarkBacked,
    `${currentFixture.id} benchmark truth must match fixture setup.`,
  );

  if (currentFixture.benchmarkBacked) {
    const usefulPaceRows = paceRows.filter((row) =>
      benchmarkPaceUsefulWorkoutKinds(draft.planFamily).has(String(row.source_workout_type)),
    );
    assert.ok(paceRows.length > 0, `${currentFixture.id} must emit benchmark-backed pace rows.`);
    if (currentFixture.benchmarkPaceUsefulRowsRequired !== false) {
      assert.ok(
        usefulPaceRows.length > 0,
        `${currentFixture.id} must use benchmark pace on quality/specific rows.`,
      );
    }
  } else {
    assert.equal(paceRows.length, 0, `${currentFixture.id} must not emit pace without benchmark.`);
  }

  assert.equal(
    defaultHrHardRows.length,
    0,
    `${currentFixture.id} must not put default estimated HR on hard/non-aerobic work.`,
  );
  assert.doesNotMatch(serialized, /personal[_ -]?hr|personalized[_ -]?hr|hr_zone_truth/i);

  for (const row of nonRestRows) {
    assert.equal(
      row.metric_mode?.hr_targets_allowed,
      false,
      `${currentFixture.id}.${row.workout_id} must not enable personal HR targets.`,
    );
  }
}

function validateLongRunShape(currentFixture: MatrixFixture, canonicalPlan: CanonicalPlan) {
  const nonRestRows = canonicalPlan.planned_workouts.filter((row) => row.workout_type !== "rest");
  const longRows = nonRestRows.filter((row) => row.source_workout_type === "long_run");
  const cutbackRows = nonRestRows.filter((row) => row.source_workout_type === "cutback_long_run");
  const longDurations = longRows.map((row) => ({ row, minutes: rowDurationMinutes(row) }));
  const positiveLongDurations = longDurations.filter((entry) => entry.minutes > 0);
  const firstLong = positiveLongDurations[0];
  const peakLong = positiveLongDurations.reduce<typeof firstLong>(
    (peak, entry) => (!peak || entry.minutes > peak.minutes ? entry : peak),
    firstLong,
  );

  assert.ok(longRows.length > 0, `${currentFixture.id} must include long-run progression.`);
  assert.ok(
    cutbackRows.length > 0,
    `${currentFixture.id} must include cutback long-run protection.`,
  );

  if (firstLong && peakLong) {
    assert.ok(
      peakLong.minutes >= firstLong.minutes,
      `${currentFixture.id} long-run progression must not shrink from the opening long run.`,
    );
    if (currentFixture.expectedEndpointMeters !== null) {
      assert.ok(
        peakLong.row.week_number < Math.max(...nonRestRows.map((row) => row.week_number)),
        `${currentFixture.id} peak long run must happen before the endpoint/taper finish.`,
      );
    }
  }
}

function validateEarlyHardWorkGate(currentFixture: MatrixFixture, canonicalPlan: CanonicalPlan) {
  if (!currentFixture.beginnerHardGateWeeks && !currentFixture.lowSupportTenK) {
    return;
  }

  const gatedWeeks = currentFixture.lowSupportTenK
    ? Infinity
    : (currentFixture.beginnerHardGateWeeks ?? 0);
  const earlyHardRows = canonicalPlan.planned_workouts.filter(
    (row) =>
      row.workout_type !== "rest" &&
      row.week_number <= gatedWeeks &&
      hardWorkoutKinds.has(String(row.source_workout_type)),
  );

  assert.deepEqual(
    earlyHardRows.map((row) => `${row.week_number}:${row.source_workout_type}`),
    [],
    `${currentFixture.id} must gate early hard work for beginner/low-support context.`,
  );
}

function summarizeFixture(currentFixture: MatrixFixture, canonicalPlan: CanonicalPlan) {
  const nonRestRows = canonicalPlan.planned_workouts.filter((row) => row.workout_type !== "rest");
  const paceRows = nonRestRows.filter(rowHasPaceTargets);
  const defaultHrRows = nonRestRows.filter((row) =>
    JSON.stringify(row.segments).includes("default_estimated_hr"),
  );

  return {
    id: currentFixture.id,
    family: currentFixture.input.distanceFamily,
    runnerLevel: currentFixture.input.runnerLevel,
    rows: canonicalPlan.planned_workouts.length,
    nonRestRows: nonRestRows.length,
    paceRows: paceRows.length,
    defaultEstimatedHrRows: defaultHrRows.length,
    endpointMeters: currentFixture.expectedEndpointMeters,
  };
}

function resolveQualityGateRunnerLevel(
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) {
  if (draft.planFamily !== "10K") {
    return draft.normalizedInputSummary.runnerLevel;
  }

  return resolveTenKBeginnerDosePolicyRunnerLevel({
    runnerLevel: draft.normalizedInputSummary.runnerLevel,
    benchmarkPaceTruth: draft.normalizedInputSummary.benchmarkPaceTruth,
  });
}

function rowHasPaceTargets(row: CanonicalWorkout) {
  return JSON.stringify(row.segments).includes("pace_min_per_km_range");
}

function childRoles(segment: CanonicalWorkout["segments"][number]) {
  if (segment.prescription?.mode !== "repeats") {
    return [];
  }

  return (segment.prescription.children ?? []).map((child) => child.role);
}

function rowDurationMinutes(row: CanonicalWorkout) {
  return row.segments.reduce((total, segment) => {
    const prescription = segment.prescription;
    if (!prescription || prescription.mode === "none") {
      return total;
    }

    if (prescription.mode === "time") {
      return total + (prescription.duration_min ?? 0);
    }

    if (prescription.mode === "repeats") {
      const repeatCount = prescription.repeat_count ?? 0;
      const repeatMinutes = (prescription.children ?? []).reduce(
        (total, child) =>
          total + (child.prescription.mode === "time" ? (child.prescription.duration_min ?? 0) : 0),
        0,
      );

      return total + repeatCount * repeatMinutes;
    }

    return total;
  }, 0);
}

const hardWorkoutKinds = new Set(["tempo", "threshold", "intervals", "hills"]);
const defaultEstimatedHrAllowedWorkoutKinds = new Set([
  "recovery",
  "easy",
  "long_run",
  "cutback_long_run",
]);

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
