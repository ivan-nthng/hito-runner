import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import type { AiFirstPlanBlueprint } from "../src/lib/ai-first-plan-blueprint-schema";
import type { AiPlanGenerationLedgerTrace } from "../src/lib/ai-plan-generation-ledger";
import type { buildImportedPlanSeed } from "../src/lib/imported-plan";
import { selectedDistanceEndpointMainDistanceMeters } from "../src/lib/plan-creation-engine";
import { summarizeRunnerFacingCanonicalRichness } from "../src/lib/plan-creation-engine/runner-facing-richness";
import {
  collectTenKBeginnerDosePolicyIssues,
  type TenKBeginnerDoseValidationRow,
} from "../src/lib/plan-creation-engine/ten-k-beginner-dose-policy";
import type {
  buildReviewedAiGeneratedRunningPlanPreview,
  RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import {
  buildRunningPlanPersistenceMetadata,
  canonicalWorkoutToTenKDoseValidationRow,
  type buildRunningPlanCanonicalPlan,
  type RunningPlanPreviewDraft,
  type RunningPlanReviewedPreviewDraft,
} from "../src/lib/running-plan-engine-review";
import { diffDaysIso, startOfWeekIso } from "../src/lib/training";

type CanonicalPlan = ReturnType<typeof buildRunningPlanCanonicalPlan>;
type CanonicalWorkout = CanonicalPlan["planned_workouts"][number];
export type AiBlueprintWorkout = AiFirstPlanBlueprint["weeks"][number]["plannedWorkouts"][number];
type BlueprintSection = AiBlueprintWorkout["sections"][number];
export type EarlyHardWorkoutKind =
  | "half_threshold"
  | "tempo"
  | "time_intervals"
  | "marathon_specific"
  | "steady";

type DatePlacementTrace = {
  mode: string;
  authoredDateSource: string;
  validationStatus: string;
  explicitAuthoredWorkoutDateCount: number | null;
  missingAuthoredWorkoutDateCount: number | null;
  backendExtendedWeeks: number | null;
};

export function assertInternalValidationUnavailable(
  result: Awaited<ReturnType<typeof buildReviewedAiGeneratedRunningPlanPreview>>,
  message: string,
  issuePattern: RegExp,
  issueMessage = message,
) {
  assert.equal(result.ok, false, message);
  if (result.ok) {
    throw new Error(`${message} Unexpectedly produced reviewed preview.`);
  }

  assert.equal(result.unavailable.previewOutcome, "internal_validation_bug");
  assert.equal(result.unavailable.persisted, false);
  assert.match(
    JSON.stringify({
      message: result.unavailable.error.message,
      issues: result.unavailable.error.issues,
      traceIssues: result.unavailable.debug.previewActionTrace.validationIssues,
    }),
    issuePattern,
    issueMessage,
  );
}

export function blueprintTimedSection(
  kind: "warm_up" | "cooldown",
  label: string,
  durationMin: number,
  guidance: string,
  rpe: number,
): BlueprintSection {
  return {
    kind,
    label,
    guidance,
    purpose: null,
    prescription: {
      mode: "time",
      duration_min: durationMin,
      distance_km: null,
      repeat_count: null,
      children: null,
    },
    target: blueprintTarget(guidance, rpe),
  };
}

export function blueprintDistanceSection(
  kind: "run" | "finish",
  label: string,
  distanceKm: number,
  guidance: string,
  rpe: number,
): BlueprintSection {
  return {
    kind,
    label,
    guidance,
    purpose: null,
    prescription: {
      mode: "distance",
      duration_min: null,
      distance_km: distanceKm,
      repeat_count: null,
      children: null,
    },
    target: blueprintTarget(guidance, rpe),
  };
}

export function blueprintRepeatSection(
  children: NonNullable<BlueprintSection["prescription"]["children"]>,
): BlueprintSection {
  return {
    kind: "repeat",
    label: "Selected-distance main work",
    guidance: "Repeat the child sequence as the selected-distance main work.",
    purpose: "Structural parent only.",
    prescription: {
      mode: "repeats",
      duration_min: null,
      distance_km: null,
      repeat_count: 1,
      children,
    },
    target: null,
  };
}

export function blueprintRepeatDistanceChild(
  kind: "run" | "finish",
  label: string,
  distanceKm: number,
  guidance: string,
  rpe: number,
): NonNullable<BlueprintSection["prescription"]["children"]>[number] {
  return {
    kind,
    label,
    guidance,
    purpose: null,
    prescription: {
      mode: "distance",
      duration_min: null,
      distance_km: distanceKm,
    },
    target: blueprintTarget(guidance, rpe),
  };
}

function blueprintTarget(cue: string, rpe: number) {
  return {
    intensity: "controlled effort",
    cue,
    hint: "Use effort first; no pace or HR target.",
    rpe,
  };
}

export function assertReviewedGenerationTrace(input: {
  scenarioName: string;
  trace: AiPlanGenerationLedgerTrace | null;
  expectedResponseId: string | null;
  expectedProviderKind: "openai_responses_api" | "local_dev_fixture";
  expectedPaidProviderCall: boolean;
  expectedArtifactRoot: string;
  expectedCanonicalRowCount: number;
  expectedRunningWorkoutCount: number;
}) {
  assert.notEqual(input.trace, null, `${input.scenarioName} must return a generation trace.`);
  if (!input.trace) {
    throw new Error(`${input.scenarioName} missing generation trace.`);
  }

  assert.equal(input.trace.provider.responseId, input.expectedResponseId);
  assert.equal(input.trace.provider.kind, input.expectedProviderKind);
  assert.equal(input.trace.provider.paidProviderCall, input.expectedPaidProviderCall);
  assert.equal(input.trace.pipeline.parseStatus, "parsed_json");
  assert.equal(input.trace.pipeline.normalizationStatus, "normalized");
  assert.equal(input.trace.pipeline.finalOutcome, "reviewed_draft_signed");
  assert.equal(input.trace.pipeline.canonicalRowCount, input.expectedCanonicalRowCount);
  assert.equal(input.trace.pipeline.runningWorkoutCount, input.expectedRunningWorkoutCount);
  assert.equal(input.trace.output.sanitizedPayloadStored, false);
  assert.match(input.trace.request.promptHash, /^[a-f0-9]{64}$/);
  assert.match(input.trace.output.rawOutputHash ?? "", /^[a-f0-9]{64}$/);
  assert.equal(input.trace.artifacts.written, true);
  assert.ok(input.trace.artifacts.path?.startsWith(input.expectedArtifactRoot));
  assert.ok(input.trace.artifacts.path && existsSync(input.trace.artifacts.path));
}

export function assertNormalPreviewEntrypointUsesAiGeneratedPath() {
  const source = readFileSync("src/lib/running-plan-engine-actions.ts", "utf8");
  const handlerStart = source.indexOf("export const previewRunningPlanDraft");
  const handlerEnd = source.indexOf("export const confirmRunningPlanDraft", handlerStart);
  const handlerSource = source.slice(handlerStart, handlerEnd);

  assert.match(
    handlerSource,
    /buildReviewedAiGeneratedRunningPlanPreview/,
    "Runner-facing selected-plan preview must call the unified AI-generated plan path.",
  );
  assert.doesNotMatch(
    handlerSource,
    /buildReviewedRunningPlanPreview\(data\)|buildRunningPlanPreview\(data\)/,
    "Runner-facing selected-plan preview must not silently use deterministic builders.",
  );
}

export function assertGeneratedPathUsesDatedOpenAiContract() {
  const generatedSource = readFileSync("src/lib/ai-generated-running-plan.ts", "utf8");
  const fixtureSource = readFileSync("src/lib/ai-generated-running-plan-dev-fixture.ts", "utf8");
  const serviceSource = readFileSync("src/lib/ai-first-plan-draft-service.ts", "utf8");
  const promptSource = readFileSync("src/lib/ai-first-plan-blueprint-prompt.ts", "utf8");

  assert.doesNotMatch(
    generatedSource,
    /blueprintDateAuthorshipMode|blueprintMaxAuthoredHorizonWeeks|allowDeterministicFallback/,
    "Generated-plan preview must not expose legacy date-authorship mode toggles.",
  );
  assert.match(
    promptSource,
    /OpenAI-authored dated plan constraints/,
    "Generated-plan prompt must make OpenAI/local fixture author dated workouts.",
  );
  assert.doesNotMatch(
    fixtureSource,
    /buildStructuredAuthoringPlan|buildRequiredCadenceSlots|Required authored workout slots|backend_required_slots/,
    "Local QA/dev fixture must not build product plans through deterministic required slots.",
  );
  assert.match(
    serviceSource,
    /useDeterministicSupport:\s*false/,
    "Generated-plan normalization must not use deterministic support as hidden dated plan truth.",
  );
  assert.doesNotMatch(
    serviceSource,
    /allowDeterministicFallback|deterministicFallback\(|backend_required_slots/,
    "Generated-plan service must not keep a deterministic fallback product path.",
  );
}

export function assertOpenAiAuthoredDatePlacement(input: {
  scenarioName: string;
  canonicalPlan: CanonicalPlan;
  metadata: {
    datePlacement?: DatePlacementTrace | null;
    blueprintTrace?: { datePlacement?: DatePlacementTrace | null } | null;
  };
  fixedRestDays: readonly string[];
}) {
  const datePlacement =
    input.metadata.datePlacement ?? input.metadata.blueprintTrace?.datePlacement ?? null;
  const nonRestWorkouts = input.canonicalPlan.planned_workouts.filter(
    (workout) => workout.workout_type !== "rest",
  );

  assert.notEqual(datePlacement, null, `${input.scenarioName} must return date placement trace.`);
  if (!datePlacement) throw new Error(`${input.scenarioName} missing date placement trace.`);
  assert.equal(datePlacement.mode, "openai_authored_dated_plan");
  assert.equal(datePlacement.authoredDateSource, "local_fixture_authored_date");
  assert.notEqual(datePlacement.validationStatus, "backend_rejected_date");
  assert.equal(datePlacement.explicitAuthoredWorkoutDateCount, nonRestWorkouts.length);
  assert.equal(datePlacement.missingAuthoredWorkoutDateCount, 0);
  assert.equal(datePlacement.backendExtendedWeeks, 0);

  for (const workout of nonRestWorkouts) {
    assert.match(workout.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(
      input.fixedRestDays.includes(workout.weekday),
      false,
      `${input.scenarioName} must not author workouts on fixed rest day ${workout.weekday}.`,
    );
  }
}

export function assertRunnerFacingRichnessClean(input: {
  scenarioName: string;
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>;
  canonicalPlan: CanonicalPlan;
  expectedEndpointMeters: number;
}) {
  const richness = summarizeRunnerFacingCanonicalRichness({
    family: qualityFamilyForDistanceMeters(input.expectedEndpointMeters),
    runnerLevel: input.draft.normalizedInputSummary.runnerLevel,
    loadContext: input.draft.normalizedInputSummary.loadContext,
    rows: input.canonicalPlan.planned_workouts,
  });

  assert.deepEqual(
    richness.issues,
    [],
    `${input.scenarioName} richness issues: ${JSON.stringify({
      issues: richness.issues,
      sourceTypes: input.canonicalPlan.planned_workouts
        .filter((workout) => workout.workout_type !== "rest")
        .map((workout) => ({
          week: workout.week_number,
          type: workout.source_workout_type,
          identity: workout.workout_identity,
          family: workout.workout_family,
          title: workout.title,
        })),
    })}`,
  );
}

export function assertConservativeEarlyAdaptationTable(input: {
  scenarioName: string;
  canonicalPlan: CanonicalPlan;
}) {
  const table = input.canonicalPlan.planned_workouts
    .filter((workout) => workout.workout_type !== "rest" && workout.week_number <= 4)
    .map((workout) => ({
      week: workout.week_number,
      date: workout.date,
      sourceType: workout.source_workout_type,
      identity: workout.workout_identity,
      family: workout.workout_family,
      title: workout.title,
    }));
  const forbiddenRows = table.filter((row) =>
    /controlled_tempo_session|half_marathon_threshold_durability|marathon_steady_specificity|distance_intervals|time_intervals|10k_rhythm_intervals|progression_run|long_run_with_steady_finish|race_pace_session/i.test(
      `${row.sourceType} ${row.identity} ${row.title}`,
    ),
  );

  assert.ok(table.length > 0, `${input.scenarioName} must expose W1-W4 adaptation evidence.`);
  assert.deepEqual(
    forbiddenRows,
    [],
    `${input.scenarioName} W1-W4 adaptation table contains early specificity: ${JSON.stringify(
      table,
    )}`,
  );

  return table;
}

export function assertLowSupportTenKDosePolicy(input: {
  scenarioName: string;
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>;
  canonicalPlan: CanonicalPlan;
}) {
  const rows = input.canonicalPlan.planned_workouts.map(canonicalWorkoutToTenKDoseValidationRow);
  const issues = collectTenKBeginnerDosePolicyIssues({
    runnerLevel: input.draft.normalizedInputSummary.runnerLevel,
    benchmarkPaceTruth: input.draft.normalizedInputSummary.benchmarkPaceTruth,
    rows,
  });

  assert.deepEqual(
    issues,
    [],
    `${input.scenarioName} must satisfy low-support beginner 10K dose policy: ${JSON.stringify({
      issues,
      rows: rows.map((row) => ({
        rowId: row.rowId,
        weekNumber: row.weekNumber,
        workoutDayKind: row.workoutDayKind,
        endpointDistanceMeters: row.endpointDistanceMeters,
      })),
    })}`,
  );

  const dayKinds = rows.map((row) => row.workoutDayKind);
  for (const forbiddenKind of ["tempo", "threshold", "intervals", "hills"] as const) {
    assert.equal(
      dayKinds.includes(forbiddenKind),
      false,
      `${input.scenarioName} must not preserve ${forbiddenKind} for low-support 10K.`,
    );
  }

  const finalNonRestRow = rows.filter((row) => !row.isRestDay).at(-1);
  assert.equal(finalNonRestRow?.workoutDayKind, "final_selected_distance_day");
  assert.equal(finalNonRestRow?.endpointDistanceMeters, 10_000);
}

export function validateBadBeginnerTenKOverloadPolicyIsRejected() {
  const timeRow = (
    rowId: string,
    date: string,
    workoutDayKind: TenKBeginnerDoseValidationRow["workoutDayKind"],
    minutes: number,
  ): TenKBeginnerDoseValidationRow => ({
    rowId,
    date,
    weekNumber: 1,
    isRestDay: false,
    workoutDayKind,
    segments: [{ primaryPrescription: { mode: "time", durationSeconds: seconds(minutes) } }],
  });
  const rows: TenKBeginnerDoseValidationRow[] = [
    timeRow("w1-easy-1", "2026-07-06", "easy", 30),
    timeRow("w1-easy-2", "2026-07-07", "easy", 35),
    timeRow("w1-long", "2026-07-08", "long_run", 45),
    {
      rowId: "endpoint",
      date: "2026-09-24",
      weekNumber: 12,
      isRestDay: false,
      workoutDayKind: "final_selected_distance_day",
      endpointDistanceMeters: 10_000,
      segments: [
        {
          primaryPrescription: {
            mode: "distance",
            distanceMeters: { min: 10_000, max: 10_000 },
          },
        },
      ],
    },
  ];
  const issues = collectTenKBeginnerDosePolicyIssues({
    runnerLevel: "beginner_new_runner",
    benchmarkPaceTruth: null,
    rows,
  });

  for (const expected of [
    /Week 1 running minutes/,
    /Week 1 long run/,
    /consecutive running days/,
  ]) {
    assert.match(
      issues.join("\n"),
      expected,
      `Bad beginner 10K W1 overload must be rejected by canonical dose policy: ${JSON.stringify(
        issues,
      )}`,
    );
  }
}

function seconds(minutes: number) {
  return { min: minutes * 60, max: minutes * 60 };
}

export function assertLocalDevFixtureAvailabilityGating(
  isAiGeneratedRunningPlanDevFixtureEnabled: (env: Record<string, string | undefined>) => boolean,
  localDevFixtureEnv: () => Record<string, string | undefined>,
) {
  assert.equal(
    isAiGeneratedRunningPlanDevFixtureEnabled(localDevFixtureEnv()),
    true,
    "Local QA/dev fixture should auto-enable only for local-auth non-deployed runtime.",
  );
  assert.equal(
    isAiGeneratedRunningPlanDevFixtureEnabled({
      ...localDevFixtureEnv(),
      HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "false",
    }),
    false,
    "Explicit false must disable the local QA/dev fixture.",
  );
  assert.equal(
    isAiGeneratedRunningPlanDevFixtureEnabled({
      ...localDevFixtureEnv(),
      VERCEL: "1",
    }),
    false,
    "Deployed runtimes must not enable the local QA/dev fixture.",
  );
  assert.equal(
    isAiGeneratedRunningPlanDevFixtureEnabled({
      HITO_AI_GENERATED_PLAN_DEV_FIXTURE: "true",
      LOCAL_AUTH_BYPASS_ENABLED: "false",
      LOCAL_AUTH_BYPASS_ACCOUNTS_FILE: "",
    }),
    false,
    "Explicit true still requires local auth bypass so production cannot opt in accidentally.",
  );
}

export function assertNoRunnerFacingFixtureCopy(input: {
  scenarioName: string;
  canonicalPlan: CanonicalPlan;
  importedSeed: ReturnType<typeof buildImportedPlanSeed>;
  previewRows: unknown;
  decodedCanonicalPlan: unknown;
}) {
  const serialized = JSON.stringify({
    canonicalPlan: input.canonicalPlan,
    importedSeed: input.importedSeed,
    previewRows: input.previewRows,
    decodedCanonicalPlan: input.decodedCanonicalPlan,
  });

  assert.doesNotMatch(
    serialized,
    /Mock AI|Local QA\/dev AI fixture|Local QA\/dev mock|mock OpenAI/i,
    `${input.scenarioName} runner-facing canonical/readback output must not expose fixture copy.`,
  );
}

export function assertAiAuthoredStructuredSectionsSurvive(input: {
  scenarioName: string;
  canonicalPlan: CanonicalPlan;
  importedSeed: ReturnType<typeof buildImportedPlanSeed>;
  expectedEndpointMeters: number;
}) {
  const nonRestWorkouts = input.canonicalPlan.planned_workouts.filter(
    (workout) => workout.workout_type !== "rest",
  );
  const missingWorkoutPurpose = nonRestWorkouts.filter(
    (workout) =>
      !workout.summary?.trim() ||
      typeof workout.planned_rpe !== "number" ||
      !workout.metric_mode?.reason,
  );
  assert.deepEqual(
    missingWorkoutPurpose.map((workout) => `${workout.date}:${workout.workout_identity}`),
    [],
    `${input.scenarioName} every generated workout must preserve workout-level purpose, RPE, and metric-policy target context.`,
  );

  const sectionSegments = input.canonicalPlan.planned_workouts.flatMap((workout) =>
    workout.segments.filter((segment) => segment.segment_id?.includes("_ai_section_")),
  );
  assert.ok(
    sectionSegments.length > 0,
    `${input.scenarioName} must persist AI-authored section-backed segment ids.`,
  );
  assert.ok(
    sectionSegments.some((segment) => segment.segment_type === "warmup"),
    `${input.scenarioName} must preserve authored warm-up sections.`,
  );
  assert.ok(
    sectionSegments.some((segment) => segment.segment_type === "cooldown"),
    `${input.scenarioName} must preserve authored cooldown sections.`,
  );

  const repeatSegment = sectionSegments.find(
    (segment) => segment.prescription?.mode === "repeats" && segment.prescription.children?.length,
  );
  assert.notEqual(
    repeatSegment,
    undefined,
    `${input.scenarioName} must preserve at least one authored repeat set with ordered children.`,
  );
  if (!repeatSegment || repeatSegment.prescription?.mode !== "repeats") {
    throw new Error(`${input.scenarioName} missing repeat segment after section normalization.`);
  }
  assert.equal(
    repeatSegment.target,
    undefined,
    `${input.scenarioName} repeat parent must remain structural only after normalization.`,
  );
  assert.ok(
    repeatSegment.prescription.children?.some(
      (child) =>
        child.target?.target_source === "ai_authored_effort_guidance" &&
        typeof child.target.rpe === "number",
    ),
    `${input.scenarioName} repeat children must preserve AI-authored effort and RPE target metadata.`,
  );

  const endpointWorkout = input.canonicalPlan.planned_workouts.find(
    (workout) => workout.source_workout_type === "final_selected_distance_day",
  );
  assert.notEqual(
    endpointWorkout,
    undefined,
    `${input.scenarioName} must include an authored final selected-distance endpoint row.`,
  );
  if (!endpointWorkout) {
    throw new Error(`${input.scenarioName} missing selected-distance endpoint row.`);
  }
  assert.ok(
    endpointWorkout.segments.some((segment) => segment.segment_type === "warmup"),
    `${input.scenarioName} endpoint row must preserve authored warm-up support.`,
  );
  assert.ok(
    endpointWorkout.segments.some((segment) => segment.segment_type === "cooldown"),
    `${input.scenarioName} endpoint row must preserve authored cooldown or walk-down support.`,
  );
  const endpointRepeatSegment = endpointWorkout.segments.find(
    (segment) =>
      segment.prescription?.mode === "repeats" &&
      (segment.prescription.children ?? []).filter(
        (child) => child.prescription.mode === "distance",
      ).length >= 3,
  );
  assert.notEqual(
    endpointRepeatSegment,
    undefined,
    `${input.scenarioName} endpoint row must preserve nested coach-authored child distance dynamics, not flat arithmetic distance sections.`,
  );
  if (!endpointRepeatSegment || endpointRepeatSegment.prescription?.mode !== "repeats") {
    throw new Error(`${input.scenarioName} missing endpoint nested dynamics.`);
  }
  assert.equal(
    endpointRepeatSegment.target,
    undefined,
    `${input.scenarioName} endpoint main-work repeat parent must remain structural only.`,
  );
  const endpointDistanceChildren = (endpointRepeatSegment.prescription.children ?? []).filter(
    (child) => child.prescription.mode === "distance",
  );
  assert.ok(
    !isTwentySixtyTwentySplit(
      endpointDistanceChildren.map((child) => child.prescription.distance_km ?? 0),
    ),
    `${input.scenarioName} endpoint child distances must not be a fixed 20/60/20 arithmetic split.`,
  );
  assert.ok(
    new Set(endpointDistanceChildren.map(endpointChildGuidanceFingerprint)).size >= 2,
    `${input.scenarioName} endpoint child targets/cues must vary across opening, body, and finish dynamics.`,
  );
  assert.equal(
    selectedDistanceEndpointMainDistanceMeters({
      endpointKind: endpointWorkout.source_workout_type,
      segments: endpointWorkout.segments,
    }),
    input.expectedEndpointMeters,
    `${input.scenarioName} endpoint distance sections must sum to exact selected-distance truth.`,
  );

  const missingSectionTargets = nonRestWorkouts.flatMap((workout) =>
    workout.segments.flatMap((segment) => {
      if (segment.prescription?.mode === "repeats") {
        return (segment.prescription.children ?? [])
          .filter((child) => !hasMeaningfulAiTarget(child.target))
          .map((child) => `${workout.date}:${workout.workout_identity}:child:${child.label}`);
      }

      return hasMeaningfulAiTarget(segment.target)
        ? []
        : [`${workout.date}:${workout.workout_identity}:${segment.label}`];
    }),
  );
  assert.deepEqual(
    missingSectionTargets,
    [],
    `${input.scenarioName} every generated section/repeat child must preserve target cue, intensity, hint, or RPE.`,
  );

  const serializedSeed = JSON.stringify(input.importedSeed);
  assert.match(
    serializedSeed,
    /ai_authored_effort_guidance/,
    `${input.scenarioName} import seed must retain AI-authored effort target metadata.`,
  );
  assert.match(
    serializedSeed,
    /_ai_section_/,
    `${input.scenarioName} import seed must retain AI-authored section provenance ids.`,
  );
  assert.doesNotMatch(
    JSON.stringify({
      canonicalPlan: input.canonicalPlan,
      importedSeed: input.importedSeed,
    }),
    /(?:42\.2|42\.195|21\.1|15|10)\s*km\s*\/\s*16\s*min/i,
    `${input.scenarioName} backend readback must not collapse endpoint distance into stale 16 min duration copy.`,
  );
}

function hasMeaningfulAiTarget(target: unknown) {
  if (!target || typeof target !== "object") {
    return false;
  }

  const record = target as Record<string, unknown>;

  return Boolean(
    record.target_source === "ai_authored_effort_guidance" &&
    (record.intensity || record.cue || record.hint || typeof record.rpe === "number"),
  );
}

function isTwentySixtyTwentySplit(distanceKm: readonly number[]) {
  const total = distanceKm.reduce((sum, km) => sum + km, 0);
  if (distanceKm.length < 3 || total <= 0) {
    return false;
  }

  const opening = distanceKm[0] ?? 0;
  const finish = distanceKm.at(-1) ?? 0;
  const body = total - opening - finish;

  return (
    Math.abs(opening / total - 0.2) < 0.015 &&
    Math.abs(body / total - 0.6) < 0.015 &&
    Math.abs(finish / total - 0.2) < 0.015
  );
}

function endpointChildGuidanceFingerprint(child: {
  role: string;
  label: string;
  guidance: string;
  target?: {
    intensity?: string;
    cue?: string;
    hint?: string;
    rpe?: number;
  };
}) {
  return [
    child.guidance,
    child.target?.intensity,
    child.target?.cue,
    child.target?.hint,
    child.target?.rpe,
  ]
    .join("|")
    .toLowerCase()
    .replaceAll(/\s+/g, " ")
    .trim();
}

export function assertNoPersistedLegacyRepeatSignals(input: {
  scenarioName: string;
  draft: { validation: unknown };
  decodedDraft: unknown;
}) {
  const serialized = JSON.stringify({
    validation: input.draft.validation,
    decodedDraft: input.decodedDraft,
  });

  assert.doesNotMatch(
    serialized,
    /repeat_unit|recovery_unit/,
    `${input.scenarioName} persisted review metadata must not carry stale repeat_unit/recovery_unit vocabulary.`,
  );
}

export function assertDistanceGoalTruth(input: {
  scenarioName: string;
  canonicalPlan: CanonicalPlan;
  draft: {
    normalizedInputSummary: { planGoalIntent: { distance: { distanceMeters: number } | null } };
  };
  expectedEndpointMeters: number;
}) {
  assert.equal(
    input.canonicalPlan.goal.goal_type,
    "distance_build",
    `${input.scenarioName} canonical plan goal must use unified distance_build truth.`,
  );
  assert.equal(
    input.draft.normalizedInputSummary.planGoalIntent.distance?.distanceMeters,
    input.expectedEndpointMeters,
    `${input.scenarioName} signed normalized goal intent must carry exact distanceMeters.`,
  );
  assertWorkoutGoalType(input.canonicalPlan, input.scenarioName, "distance_build");
}

export function assertDistanceGoalPersistenceMetadata(input: {
  scenarioName: string;
  draft: Parameters<typeof buildRunningPlanPersistenceMetadata>[0]["draft"];
  canonicalPlan: CanonicalPlan;
  expectedEndpointMeters: number;
}) {
  const metadata = buildRunningPlanPersistenceMetadata({
    draft: input.draft,
    canonicalPlan: input.canonicalPlan,
    reviewChecksum: input.draft.reviewChecksum,
  });
  const goalMetadata = metadata.goalMetadata as {
    selected_plan_engine?: {
      family?: string;
      legacy_family_bucket?: string;
      ui_distance_family?: string;
      distance_goal?: { goal_type?: string; distance_meters?: number };
    };
  };

  assert.equal(
    goalMetadata.selected_plan_engine?.family,
    undefined,
    `${input.scenarioName} AI-generated persistence metadata must not store family as product truth.`,
  );
  assert.equal(
    goalMetadata.selected_plan_engine?.legacy_family_bucket,
    undefined,
    `${input.scenarioName} persistence metadata must not store legacy family buckets.`,
  );
  assert.equal(
    goalMetadata.selected_plan_engine?.ui_distance_family,
    undefined,
    `${input.scenarioName} persistence metadata must not store UI distance family buckets.`,
  );
  assert.equal(
    goalMetadata.selected_plan_engine?.distance_goal?.goal_type,
    "distance_build",
    `${input.scenarioName} persistence metadata must expose distance_goal product truth.`,
  );
  assert.equal(
    goalMetadata.selected_plan_engine?.distance_goal?.distance_meters,
    input.expectedEndpointMeters,
    `${input.scenarioName} persistence metadata must preserve exact distanceMeters.`,
  );
}

export function assertWorkoutGoalType(
  plan: CanonicalPlan,
  scenarioName: string,
  expectedGoalType: string,
) {
  const nonRestGoalTypes = new Set(
    plan.planned_workouts
      .filter((workout) => workout.workout_type !== "rest")
      .map((workout) => workout.goal_context?.goal_type ?? null),
  );

  assert.deepEqual(
    [...nonRestGoalTypes],
    [expectedGoalType],
    `${scenarioName} persisted workout goal_context must remain ${expectedGoalType}.`,
  );
}

export function assertNoFakeMetricTruth(plan: CanonicalPlan) {
  const serialized = JSON.stringify(plan);

  assert.doesNotMatch(serialized, /personal_hr|personal_hr_zone|measured_threshold/i);
  assert.doesNotMatch(serialized, /goal[_-]?pace|target_outcome_pace_as_workout_target/i);
}

export function assertNoLegacyRepeatFieldsOrParentRepeatTargets(plan: CanonicalPlan) {
  const serialized = JSON.stringify(plan);

  assert.doesNotMatch(serialized, /repeat_unit|recovery_unit/);

  for (const workout of plan.planned_workouts) {
    for (const segment of workout.segments) {
      if (segment.prescription?.mode === "repeats") {
        assert.equal(
          segment.target,
          undefined,
          "Repeat parent must stay structural-only; child blocks own target/readback truth.",
        );
      }
    }
  }
}

export function assertRepeatRichChildrenWhereSportsSafe(plan: CanonicalPlan, scenarioName: string) {
  const repeatSegments = plan.planned_workouts.flatMap((workout) =>
    workout.segments.filter((segment) => segment.prescription?.mode === "repeats"),
  );
  const repeatWithChildren = repeatSegments.find(
    (segment) =>
      segment.prescription?.mode === "repeats" &&
      Array.isArray(segment.prescription.children) &&
      segment.prescription.children.length >= 2,
  );

  assert.ok(
    repeatWithChildren,
    `${scenarioName} fixture plan should include at least one structural Repeat set with ordered children[].`,
  );
}

export function assertMarathonCompletionReadinessQuality(input: {
  scenarioName: string;
  canonicalPlan: CanonicalPlan;
}) {
  const endpoint = input.canonicalPlan.planned_workouts.find(
    (workout) => workout.source_workout_type === "final_selected_distance_day",
  );
  assert.notEqual(endpoint, undefined, `${input.scenarioName} must include marathon endpoint.`);
  if (!endpoint) {
    throw new Error(`${input.scenarioName} missing marathon endpoint.`);
  }

  const preTaperLongRunPeakMinutes = Math.max(
    0,
    ...input.canonicalPlan.planned_workouts
      .filter(
        (workout) =>
          workout.workout_type === "long_run" &&
          workout.source_workout_type !== "final_selected_distance_day" &&
          workout.source_workout_type !== "taper_long_run" &&
          workout.week_number < endpoint.week_number,
      )
      .map(canonicalWorkoutLoadMinutes),
  );
  assert.ok(
    preTaperLongRunPeakMinutes >= 150,
    `${input.scenarioName} must build a credible marathon long-run peak before taper, got ${preTaperLongRunPeakMinutes} min.`,
  );

  const unsafeRaceWeekRows = input.canonicalPlan.planned_workouts
    .filter((workout) => workout.workout_type !== "rest" && workout !== endpoint)
    .filter((workout) => {
      if (!isRaceWeekPreEndpointWorkout(endpoint.date, workout.date)) {
        return false;
      }

      return (
        canonicalWorkoutLoadMinutes(workout) > 45 ||
        /steady|progression|tempo|threshold|interval|hill|quality/i.test(
          `${workout.source_workout_type} ${workout.workout_identity} ${workout.workout_family}`,
        )
      );
    })
    .map((workout) => ({
      date: workout.date,
      type: workout.source_workout_type,
      identity: workout.workout_identity,
      loadMinutes: canonicalWorkoutLoadMinutes(workout),
    }));
  assert.deepEqual(
    unsafeRaceWeekRows,
    [],
    `${input.scenarioName} race week must stay easy/recovery-only before endpoint.`,
  );

  const raceWeekPreEndpointRows = input.canonicalPlan.planned_workouts
    .filter((workout) => workout.workout_type !== "rest" && workout !== endpoint)
    .filter((workout) => isRaceWeekPreEndpointWorkout(endpoint.date, workout.date));
  const raceWeekPreEndpointLoadMinutes = raceWeekPreEndpointRows.reduce(
    (total, workout) => total + canonicalWorkoutLoadMinutes(workout),
    0,
  );
  assert.ok(
    raceWeekPreEndpointLoadMinutes <= 45,
    `${input.scenarioName} total pre-endpoint race-week load must stay <=45 min, got ${raceWeekPreEndpointLoadMinutes} min from ${JSON.stringify(
      raceWeekPreEndpointRows.map((workout) => ({
        date: workout.date,
        type: workout.source_workout_type,
        identity: workout.workout_identity,
        loadMinutes: canonicalWorkoutLoadMinutes(workout),
      })),
    )}.`,
  );
}

function isRaceWeekPreEndpointWorkout(endpointDate: string, workoutDate: string) {
  const raceWeekStart = startOfWeekIso(endpointDate);

  return workoutDate >= raceWeekStart && workoutDate < endpointDate;
}

export function withEarlySpecificityCanonicalPlan(
  canonicalPlan: CanonicalPlan,
  kind: EarlyHardWorkoutKind,
) {
  const fields = earlyHardWorkoutFields(kind);
  let changed = false;
  const plannedWorkouts = canonicalPlan.planned_workouts.map((workout) => {
    if (
      changed ||
      workout.week_number > 2 ||
      workout.workout_type === "rest" ||
      workout.source_workout_type === "final_selected_distance_day" ||
      workout.workout_family === "long"
    ) {
      return workout;
    }

    changed = true;
    return {
      ...workout,
      source_workout_type: fields.identity,
      workout_identity: fields.identity,
      workout_family: fields.family,
      workout_type: fields.family === "steady" ? "steady_or_easy" : fields.family,
      calendar_icon_key: fields.icon,
      title: fields.title,
    };
  });

  assert.equal(changed, true, "Expected an early non-long workout to mutate.");

  return {
    ...canonicalPlan,
    planned_workouts: plannedWorkouts,
  };
}

export function stripRunningPlanReviewProofForProof(
  draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
): RunningPlanPreviewDraft {
  const {
    canonicalNonRestRowCount: _canonicalNonRestRowCount,
    canonicalRowCount: _canonicalRowCount,
    reviewChecksum: _reviewChecksum,
    reviewContractVersion: _reviewContractVersion,
    reviewToken: _reviewToken,
    ...unreviewedDraft
  } = draft;

  return unreviewedDraft;
}

export function earlyHardWorkoutMutation(
  blueprint: AiFirstPlanBlueprint,
  weekNumber: number,
  kind: EarlyHardWorkoutKind,
) {
  return {
    blueprint,
    weekNumber,
    ...earlyHardWorkoutFields(kind),
  };
}

function earlyHardWorkoutFields(kind: EarlyHardWorkoutKind) {
  switch (kind) {
    case "half_threshold":
      return {
        identity: "half_marathon_threshold_durability",
        family: "tempo",
        icon: "tempo",
        title: "Half-marathon threshold durability",
        segmentIntent: "tempo_sustained",
        plannedRpe: 7,
      } as const;
    case "tempo":
      return {
        identity: "controlled_tempo_session",
        family: "tempo",
        icon: "tempo",
        title: "Controlled tempo session",
        segmentIntent: "tempo_sustained",
        plannedRpe: 7,
      } as const;
    case "time_intervals":
      return {
        identity: "time_intervals",
        family: "intervals",
        icon: "intervals",
        title: "Time intervals",
        segmentIntent: "interval_repeats",
        plannedRpe: 8,
      } as const;
    case "marathon_specific":
      return {
        identity: "marathon_steady_specificity",
        family: "steady",
        icon: "steady",
        title: "Marathon steady specificity",
        segmentIntent: "steady_aerobic",
        plannedRpe: 6,
      } as const;
    case "steady":
      return {
        identity: "steady_aerobic_run",
        family: "steady",
        icon: "steady",
        title: "Steady aerobic run",
        segmentIntent: "steady_aerobic",
        plannedRpe: 5,
      } as const;
  }
}

export function forceFirstNonLongWorkoutIdentityInWeek(input: {
  blueprint: AiFirstPlanBlueprint;
  weekNumber: number;
  identity: AiBlueprintWorkout["workoutIdentity"];
  family: AiBlueprintWorkout["workoutFamily"];
  icon: AiBlueprintWorkout["calendarIconKey"];
  title: string;
  segmentIntent: AiBlueprintWorkout["segmentIntent"];
  plannedRpe: number;
}) {
  const week = input.blueprint.weeks.find((candidate) => candidate.weekNumber === input.weekNumber);
  assert.notEqual(week, undefined, `Missing fixture week ${input.weekNumber}.`);
  if (!week) {
    throw new Error(`Missing fixture week ${input.weekNumber}.`);
  }

  const workout = week.plannedWorkouts.find(
    (candidate) =>
      candidate.workoutFamily !== "long" &&
      candidate.workoutIdentity !== "selected_distance_completion_or_checkpoint",
  );
  assert.notEqual(
    workout,
    undefined,
    `Missing mutable non-long workout in week ${input.weekNumber}.`,
  );
  if (!workout) {
    throw new Error(`Missing mutable non-long workout in week ${input.weekNumber}.`);
  }

  workout.workoutFamily = input.family;
  workout.workoutIdentity = input.identity;
  workout.calendarIconKey = input.icon;
  workout.title = input.title;
  workout.segmentIntent = input.segmentIntent;
  workout.plannedRpe = input.plannedRpe;
  workout.estimatedFatigue = input.plannedRpe >= 7 ? "high" : "medium_high";
}

export function forceNonLongWorkoutIdentitySequenceInWeek(input: {
  blueprint: AiFirstPlanBlueprint;
  weekNumber: number;
  sequence: readonly EarlyHardWorkoutKind[];
}) {
  const week = input.blueprint.weeks.find((candidate) => candidate.weekNumber === input.weekNumber);
  assert.notEqual(week, undefined, `Missing fixture week ${input.weekNumber}.`);
  if (!week) {
    throw new Error(`Missing fixture week ${input.weekNumber}.`);
  }

  const workouts = week.plannedWorkouts.filter(
    (candidate) =>
      candidate.workoutFamily !== "long" &&
      candidate.workoutIdentity !== "selected_distance_completion_or_checkpoint",
  );
  assert.ok(
    workouts.length >= input.sequence.length,
    `Missing mutable workout sequence in week ${input.weekNumber}.`,
  );

  input.sequence.forEach((kind, index) => {
    const workout = workouts[index]!;
    const fields = earlyHardWorkoutFields(kind);

    workout.workoutFamily = fields.family;
    workout.workoutIdentity = fields.identity;
    workout.calendarIconKey = fields.icon;
    workout.title = fields.title;
    workout.segmentIntent = fields.segmentIntent;
    workout.plannedRpe = fields.plannedRpe;
    workout.estimatedFatigue = fields.plannedRpe >= 7 ? "high" : "medium";
  });
}

export function capMarathonPreTaperLongRunsBelowReadinessFloor(blueprint: AiFirstPlanBlueprint) {
  for (const workout of blueprint.weeks.flatMap((week) => week.plannedWorkouts)) {
    if (
      workout.workoutIdentity !== "long_aerobic_run" &&
      workout.workoutIdentity !== "long_run_with_steady_finish" &&
      workout.workoutIdentity !== "cutback_long_run"
    ) {
      continue;
    }

    for (const section of workout.sections) {
      if (section.prescription.mode === "time" && (section.prescription.duration_min ?? 0) > 98) {
        section.prescription.duration_min = 98;
      }
    }
  }
}

export function replaceBlueprintWorkoutOnDate(input: {
  blueprint: AiFirstPlanBlueprint;
  date: string;
  weekday: AiBlueprintWorkout["weekday"];
  workout: AiBlueprintWorkout;
}) {
  const weekNumber = Math.floor(diffDaysIso(input.date, input.blueprint.startDate) / 7) + 1;
  const week =
    input.blueprint.weeks.find((candidate) =>
      candidate.plannedWorkouts.some((workout) => workout.date === input.date),
    ) ?? input.blueprint.weeks.find((candidate) => candidate.weekNumber === weekNumber);
  assert.notEqual(week, undefined, `Missing fixture week for ${input.date}.`);
  if (!week) {
    throw new Error(`Missing fixture week for ${input.date}.`);
  }

  const nextWorkout = {
    ...input.workout,
    date: input.date,
    weekday: input.weekday,
  };
  const index = week.plannedWorkouts.findIndex((workout) => workout.date === input.date);
  if (index >= 0) {
    week.plannedWorkouts[index] = nextWorkout;
  } else {
    const replacementIndex = week.plannedWorkouts.findIndex(
      (workout) => workout.workoutIdentity !== "selected_distance_completion_or_checkpoint",
    );
    assert.notEqual(replacementIndex, -1, `Missing replaceable fixture workout for ${input.date}.`);
    week.plannedWorkouts[replacementIndex] = nextWorkout;
  }
}

export function marathonFixtureWorkoutFromFixture(
  blueprint: AiFirstPlanBlueprint,
  identity: "progression_run" | "steady_aerobic_run" | "recovery_jog",
): AiBlueprintWorkout {
  const workouts = blueprint.weeks.flatMap((week) => week.plannedWorkouts);
  const template =
    workouts.find((workout) => workout.workoutIdentity === identity) ??
    (identity === "recovery_jog"
      ? undefined
      : workouts.find((workout) => !/rest/i.test(workout.workoutFamily)));

  assert.notEqual(template, undefined, `Missing ${identity} fixture workout template.`);
  if (!template) {
    throw new Error(`Missing ${identity} fixture workout template.`);
  }

  if (identity === "recovery_jog") {
    return {
      ...jsonStable(template),
      workoutFamily: "recovery",
      workoutIdentity: "recovery_jog",
      calendarIconKey: "recovery",
      title: "Recovery jog",
      segmentIntent: "recovery",
      plannedRpe: 3,
      estimatedFatigue: "low",
      recoveryPriority: "high",
    };
  }

  if (identity === "progression_run") {
    return {
      ...jsonStable(template),
      workoutFamily: "progression",
      workoutIdentity: "progression_run",
      calendarIconKey: "progression",
      title: "Progression run",
      segmentIntent: "progression",
      plannedRpe: 6,
      estimatedFatigue: "medium_high",
    };
  }

  return {
    ...jsonStable(template),
    workoutFamily: "steady",
    workoutIdentity: "steady_aerobic_run",
    calendarIconKey: "steady",
    title: "Steady aerobic run",
    segmentIntent: "steady_aerobic",
    plannedRpe: 5,
    estimatedFatigue: "medium",
  };
}

export function upsertBlueprintWorkoutOnDate(input: {
  blueprint: AiFirstPlanBlueprint;
  date: string;
  weekday: AiBlueprintWorkout["weekday"];
  workout: AiBlueprintWorkout;
}) {
  const weekNumber = Math.floor(diffDaysIso(input.date, input.blueprint.startDate) / 7) + 1;
  const week =
    input.blueprint.weeks.find((candidate) =>
      candidate.plannedWorkouts.some((workout) => workout.date === input.date),
    ) ?? input.blueprint.weeks.find((candidate) => candidate.weekNumber === weekNumber);
  assert.notEqual(week, undefined, `Missing fixture week for ${input.date}.`);
  if (!week) {
    throw new Error(`Missing fixture week for ${input.date}.`);
  }

  const nextWorkout = {
    ...input.workout,
    date: input.date,
    weekday: input.weekday,
  };
  const index = week.plannedWorkouts.findIndex((workout) => workout.date === input.date);
  if (index >= 0) {
    week.plannedWorkouts[index] = nextWorkout;
  } else {
    week.plannedWorkouts.push(nextWorkout);
    week.plannedWorkouts.sort((left, right) => left.date.localeCompare(right.date));
  }
}

function canonicalWorkoutLoadMinutes(workout: CanonicalWorkout) {
  return workout.segments.reduce((total, segment) => {
    const prescription = segment.prescription;
    if (!prescription || prescription.mode === "none") {
      return total;
    }

    if (prescription.mode === "time") {
      return total + (prescription.duration_min ?? 0);
    }

    if (prescription.mode === "distance") {
      return total + (prescription.distance_km ?? 0) * 6;
    }

    if (prescription.mode === "repeats") {
      const childMinutes = (prescription.children ?? []).reduce((sum, child) => {
        if (child.prescription.mode === "distance") {
          return sum + (child.prescription.distance_km ?? 0) * 6;
        }

        return sum + (child.prescription.duration_min ?? 0);
      }, 0);

      return total + childMinutes * (prescription.repeat_count ?? 1);
    }

    return total;
  }, 0);
}

function qualityFamilyForDistanceMeters(
  meters: number,
): RunningPlanPreviewActionInput["distanceFamily"] {
  if (meters <= 10_000) return "10K";
  if (meters <= 21_100) return "Half Marathon";
  return "Marathon Completion";
}

export function jsonStable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function slugForProof(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function snapshotEnv(keys: readonly string[]) {
  return Object.fromEntries(keys.map((key) => [key, process.env[key]]));
}

export function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (typeof value === "string") {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }
}
