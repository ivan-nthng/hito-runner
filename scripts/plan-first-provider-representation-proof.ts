import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  compileAiAuthoredPlanFirstDraft,
  type AiAuthoredBlueprintSummary,
} from "../src/lib/ai-authored-plan-first-compiler";
import {
  buildAiAuthoredFirstSessionAdaptationContext,
  buildAiAuthoredPlanFirstOpenAiSchema,
  buildAiAuthoredPlanFirstPrompt,
  deriveAiAuthoredPlanFirstSelfAudit,
  type AiAuthoredPlanFirstCompilerDraft,
} from "../src/lib/ai-authored-plan-first-provider-contract";
import { generateAiFirstPlanDraftPreview } from "../src/lib/ai-first-plan-draft-service";
import {
  buildAiGeneratedRunningPlanAuthoringInput as buildAiGeneratedRunningPlanAuthoringInputRuntime,
  type AiGeneratedRunningPlanPreviewInput,
} from "../src/lib/ai-generated-running-plan";
import {
  AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
  buildAiGeneratedRunningPlanDevFixtureOpenAiFetch,
  buildAiGeneratedRunningPlanDevFixtureProviderDraft,
  buildAiGeneratedRunningPlanQaFixtureAuthoringInput,
} from "../src/lib/ai-generated-running-plan-dev-fixture";
import { addDaysIso, startOfWeekIso, weekdayLong } from "../src/lib/training";
import type { StructuredPlanAuthoringInput } from "../src/lib/structured-plan-authoring-schema";

const PROOF_LONG_RUN_IDENTITIES = new Set([
  "long_aerobic_run",
  "cutback_long_run",
  "taper_long_run",
  "long_run_with_steady_finish",
  "marathon_steady_specificity",
  "hike_run_endurance",
  "mountain_long_run_time_on_feet",
  "ultra_time_on_feet_durability",
]);
import {
  buildReviewedAiGeneratedRunningPlanPreview as buildReviewedAiGeneratedRunningPlanPreviewRuntime,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import { buildProofRunnerCapability } from "./runner-plan-capability-proof-helpers";

const authoringInput = buildAiGeneratedRunningPlanQaFixtureAuthoringInput("2026-08-21");

export function buildAiGeneratedRunningPlanAuthoringInput(
  input: RunningPlanPreviewActionInput,
  profile = buildProofRunnerCapability(input),
) {
  return buildAiGeneratedRunningPlanAuthoringInputRuntime(
    input,
    profile.runnerCapability,
    profile.acceptedHeartRateProfile,
  );
}

export function buildReviewedAiGeneratedRunningPlanPreview(
  input: AiGeneratedRunningPlanPreviewInput,
  options: Parameters<typeof buildReviewedAiGeneratedRunningPlanPreviewRuntime>[1] = {},
) {
  const profile = buildProofRunnerCapability(input);
  return buildReviewedAiGeneratedRunningPlanPreviewRuntime(input, {
    ...options,
    runnerCapability: options.runnerCapability ?? profile.runnerCapability,
    acceptedHeartRateProfile: options.acceptedHeartRateProfile ?? profile.acceptedHeartRateProfile,
  });
}

function assertCoachingPreferenceIsReviewable(
  result: ReturnType<typeof compileAiAuthoredPlanFirstDraft>,
  diagnosticCode: string,
) {
  assert.equal(
    result.ok,
    true,
    result.ok
      ? ""
      : `${diagnosticCode} remained a compiler admission rule: ${JSON.stringify(result.issues)}`,
  );
}

export async function validatePlanFirstProviderRepresentationContract() {
  const fullHorizon = await generateFixturePreview(authoringInput);

  assert.equal(fullHorizon.blueprint.startDate, authoringInput.schedule.startDate);
  assert.equal(fullHorizon.blueprint.detailedHorizon.calendarWeekCount, 4);
  assert.equal(fullHorizon.canonicalPlan.planned_workouts.length, 28);
  assert.equal(fullHorizon.blueprint.detailedHorizon.targetBoundary, false);
  assert.ok(
    fullHorizon.blueprint.selectedTargetDate > fullHorizon.blueprint.detailedHorizon.endDate,
    "The immutable Blueprint must extend beyond the first detailed block.",
  );
  assert.deepEqual(
    fullHorizon.reviewConflicts.find(
      (conflict) => conflict.date === fullHorizon.blueprint.selectedTargetDate,
    ),
    {
      code: "fixed_rest_day_preference_conflict",
      date: fullHorizon.blueprint.selectedTargetDate,
      message: `The selected target date is Sunday, a preferred Rest day; preserve the target only after explicit review.`,
    },
    "A future selected target on a fixed Rest weekday must remain reviewable rather than silently contradictory.",
  );
  assertBlueprintIsFullAndNonExecutable(fullHorizon.blueprint);
  assert.ok(
    fullHorizon.blueprint.projections.some(
      (projection) => projection.cadence_or_workout_family === "long",
    ),
    "The deterministic Blueprint fixture must retain a future long-run family.",
  );
  const hasFutureQualityFamily = fullHorizon.blueprint.projections.some((projection) =>
    ["intervals", "steady"].includes(projection.cadence_or_workout_family),
  );
  assert.equal(
    hasFutureQualityFamily,
    true,
    "The provider-authored Blueprint fixture must retain a future quality family.",
  );

  const capabilityClass = authoringInput.runnerCapability.additionalEasyContact.decision;

  const openAiSchema = buildAiAuthoredPlanFirstOpenAiSchema(authoringInput) as unknown as {
    required: string[];
    properties: Record<string, unknown>;
  };
  assert.deepEqual(openAiSchema.required, ["blueprint", "detailed_block"]);
  assert.equal("workouts" in openAiSchema.properties, false);
  assert.equal("endpoint" in openAiSchema.properties, false);
  const prompt = buildAiAuthoredPlanFirstPrompt({ authoringInput });
  assert.match(prompt.systemPrompt, /immutable full-horizon Blueprint/);
  assert.match(prompt.systemPrompt, /exactly the bounded first detailed block/);
  assert.match(
    prompt.systemPrompt,
    /Preserve a supplied selected target date even when it falls on one of those weekdays/,
  );
  assert.match(prompt.systemPrompt, /runner\.benchmark_relative_quality_safety is not null/);
  assert.match(prompt.systemPrompt, /RPE max N\/10/);
  const promptPayload = JSON.parse(prompt.userPrompt) as {
    runnerFacts: {
      calendar: {
        requested_workouts_per_full_week: number | null;
      };
      runner: {
        benchmark_relative_quality_safety: Record<string, unknown> | null;
        weekly_quality_density: Record<string, unknown> | null;
        initial_block_progression_safety: Record<string, unknown>;
        runner_capability: {
          version: string;
          sevenDaySlices: unknown[];
          openingAnchor: { basis: string };
        };
      };
    };
  };
  assert.equal(promptPayload.runnerFacts.calendar.requested_workouts_per_full_week, 4);
  assert.match(prompt.systemPrompt, /requested_workouts_per_full_week is not null/);
  assert.match(prompt.systemPrompt, /explicit dated review conflict/);
  assert.deepEqual(promptPayload.runnerFacts.runner.benchmark_relative_quality_safety, {
    basis: "recent_5k_without_separate_threshold_truth",
    benchmark_pace_seconds_per_km: 330,
    fastest_permitted_pace_seconds_per_km: 331,
    fastest_permitted_pace: "5:31/km",
    required_local_cue_marker: "RPE max N/10",
    applicable_workout_identities: [
      "controlled_tempo_session",
      "half_marathon_threshold_durability",
      "half_readiness_marker",
      "10k_rhythm_intervals",
    ],
    maximum_rpe_by_workout_identity: {
      controlled_tempo_session: 7,
      half_marathon_threshold_durability: 7,
      half_readiness_marker: 7,
      "10k_rhythm_intervals": 8,
    },
  });
  assert.deepEqual(promptPayload.runnerFacts.runner.weekly_quality_density, {
    applies_when_max_running_days_per_week_at_most: 4,
    maximum_non_long_quality_sessions_per_calendar_week: 1,
    maximum_long_run_sessions_per_calendar_week: 1,
    non_long_quality_families: ["steady", "tempo", "intervals", "progression", "race", "hills"],
    remaining_session_families: ["easy", "recovery"],
    long_run_with_quality_finish_occupies_long_stress_slot: true,
  });
  assert.deepEqual(promptPayload.runnerFacts.runner.initial_block_progression_safety, {
    basis: "no_recent_volume_or_longest_run_baseline",
    maximum_timed_long_run_build_step_minutes: 10,
    maximum_fully_time_based_weekly_duration_increase_percent: 15,
    long_run_quality_finish_allowed: false,
    fourth_full_week_cutback: {
      minimum_weekly_duration_reduction_from_week_three_percent: 15,
      minimum_timed_long_run_reduction_from_week_three_percent: 15,
      maximum_runnable_contact_increase_from_week_three: 0,
    },
  });
  assert.equal(
    promptPayload.runnerFacts.runner.runner_capability.version,
    "runner_plan_capability_vector_v1",
  );
  assert.equal(promptPayload.runnerFacts.runner.runner_capability.sevenDaySlices.length, 12);
  assert.equal(
    promptPayload.runnerFacts.runner.runner_capability.openingAnchor.basis,
    "unavailable",
  );
  assert.match(prompt.systemPrompt, /fully time-based long run may increase by at most 10 minutes/);
  assert.match(
    prompt.systemPrompt,
    /summed explicitly timed runnable minutes .* may increase by at most 15 percent/,
  );
  assert.match(
    prompt.systemPrompt,
    /three conservative build weeks followed by a fourth-week cutback/,
  );
  assert.match(prompt.systemPrompt, /runnable contact count must not exceed week three/);

  const historyAwareAuthoringInput = structuredClone(authoringInput);
  historyAwareAuthoringInput.runnerCapability.openingAnchor.basis = "duration_seconds";
  historyAwareAuthoringInput.runnerFacts.selfReportedLevel = "runs_a_lot";
  historyAwareAuthoringInput.schedule.startDate = "2026-08-29";
  historyAwareAuthoringInput.planGoalIntent.targetDate = "2026-12-06";
  assert.equal(
    buildAiAuthoredFirstSessionAdaptationContext(historyAwareAuthoringInput).adaptation.required,
    true,
  );
  const historyAwarePrompt = buildAiAuthoredPlanFirstPrompt({
    authoringInput: historyAwareAuthoringInput,
  });
  assert.match(historyAwarePrompt.systemPrompt, /inclusive from 2026-08-29 through 2026-09-11/);
  assert.match(
    historyAwarePrompt.systemPrompt,
    /first true Long Run and first controlled quality role may begin only on or after 2026-09-12/,
  );
  assert.match(
    historyAwarePrompt.systemPrompt,
    /recent Activity volume and longest-contact facts may inform absolute volume, but they never waive or shorten this bridge/,
  );
  const historyAwareProviderContext = JSON.parse(historyAwarePrompt.userPrompt) as {
    runnerFacts: {
      calendar: { detailed_block_end_date: string; future_projection_start_date: string };
    };
  };
  assert.equal(
    historyAwareProviderContext.runnerFacts.calendar.detailed_block_end_date,
    "2026-09-27",
  );
  assert.equal(
    historyAwareProviderContext.runnerFacts.calendar.future_projection_start_date,
    "2026-09-28",
  );
  assert.match(
    historyAwarePrompt.systemPrompt,
    /complete terminal Monday-Sunday calendar week 2026-09-21 through 2026-09-27/,
  );
  assert.match(
    historyAwarePrompt.systemPrompt,
    /Week four at exactly 75 to 85 percent of Week-three repeat-expanded runnable minutes/,
  );
  assert.match(historyAwarePrompt.systemPrompt, /Sunday long-run-family contact/);
  assert.match(
    historyAwarePrompt.systemPrompt,
    /week two and week three must each increase repeat-expanded runnable minutes by 5 to 15 percent/,
  );
  assert.match(
    historyAwarePrompt.systemPrompt,
    /week four must contain 75 to 85 percent of week-three repeat-expanded runnable minutes/,
  );
  assert.match(
    historyAwarePrompt.systemPrompt,
    /if week two is 172 minutes, week three must total 180\.6 to 197\.8 minutes, so 180 minutes is below the accepted minimum/,
  );
  assert.match(
    historyAwarePrompt.systemPrompt,
    /after choosing a compliant week three, calculate week four from that exact week-three total/,
  );
  assert.match(historyAwarePrompt.systemPrompt, /Backend validates but never clamps, repairs/);
  assert.match(
    historyAwarePrompt.systemPrompt,
    /author exactly one controlled short-turnover session in the third full detailed calendar week/,
  );
  assert.match(historyAwarePrompt.systemPrompt, /effort_kind=controlled_short_repetition/);
  assert.match(historyAwarePrompt.systemPrompt, /effort_kind=controlled_short_recovery/);
  assert.match(historyAwarePrompt.systemPrompt, /never inserts, moves, rewrites, or repairs/);

  const providerDraft = await readFixtureDraft(authoringInput);
  assert.deepEqual(Object.keys(providerDraft).sort(), ["blueprint", "detailed_block"]);
  assert.equal(providerDraft.detailed_block.start_date, authoringInput.schedule.startDate);
  assert.equal(
    providerDraft.detailed_block.end_date,
    addDaysIso(authoringInput.schedule.startDate, 27),
  );

  const taperDraft = structuredClone(providerDraft);
  const taperStartDate = addDaysIso(taperDraft.detailed_block.end_date, 1);
  taperDraft.blueprint.phases = [
    {
      phase: "Base",
      start_date: taperDraft.blueprint.start_date,
      end_date: taperDraft.detailed_block.end_date,
      expected_weekly_cadence: 4,
      workout_families: [...providerDraft.blueprint.phases[0]!.workout_families],
    },
    {
      phase: "Taper",
      start_date: taperStartDate,
      end_date: taperDraft.blueprint.selected_target_date,
      expected_weekly_cadence: 4,
      workout_families: ["easy", "race"],
    },
  ];
  for (const workout of taperDraft.detailed_block.workouts) workout.phase = "Base";
  taperDraft.detailed_block.final_workout.phase = "Base";
  taperDraft.blueprint.projections = projectionCadenceForPhase(
    taperDraft.blueprint.projections,
    "Taper",
    4,
  );
  const taperResult = compileAiAuthoredPlanFirstDraft({ draft: taperDraft, authoringInput });
  assert.equal(taperResult.ok, true, "A Blueprint-owned taper phase must survive compilation.");
  if (!taperResult.ok) throw new Error(JSON.stringify(taperResult.issues));
  assert.equal(taperResult.blueprint.phases.at(-1)?.phase, "Taper");
  assert.equal(
    taperResult.blueprint.projections.find(
      (projection) => projection.review_timing === "target_review",
    )?.phase,
    "Taper",
  );

  const softConflictDraft = structuredClone(providerDraft);
  const conflictWorkout = softConflictDraft.detailed_block.workouts[0];
  assert.ok(conflictWorkout, "Fixture requires one detailed workout for conflict proof.");
  const fixedRestDate = firstUnoccupiedDate({
    startDate: softConflictDraft.detailed_block.start_date,
    endDate: softConflictDraft.detailed_block.end_date,
    weekday: authoringInput.availability.fixedRestDays?.[0] ?? "Wednesday",
    occupiedDates: new Set([
      ...softConflictDraft.detailed_block.workouts.slice(1).map((workout) => workout.date),
      softConflictDraft.detailed_block.final_workout.date,
    ]),
  });
  conflictWorkout.date = fixedRestDate;
  conflictWorkout.phase = phaseForDate(softConflictDraft, fixedRestDate);
  softConflictDraft.detailed_block.workouts.sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const softConflict = compileAiAuthoredPlanFirstDraft({
    draft: softConflictDraft,
    authoringInput,
  });
  assert.equal(softConflict.ok, true, "A weekday preference conflict must remain reviewable.");
  if (!softConflict.ok) throw new Error("Soft-conflict compiler result was unexpectedly rejected.");
  assert.ok(
    softConflict.reviewConflicts.some(
      (conflict) => conflict.code === "fixed_rest_day_preference_conflict",
    ),
  );

  if (capabilityClass !== "not_applicable_reentry") {
    const reducedPhaseCadenceDraft = structuredClone(providerDraft);
    reducedPhaseCadenceDraft.blueprint.phases[0]!.expected_weekly_cadence = 3;
    const reducedPhaseCadenceResult = compileAiAuthoredPlanFirstDraft({
      draft: reducedPhaseCadenceDraft,
      authoringInput,
    });
    assertCoachingPreferenceIsReviewable(
      reducedPhaseCadenceResult,
      "ai_authored_blueprint_requested_weekly_cadence_mismatch",
    );

    const reducedDetailedCadenceDraft = structuredClone(providerDraft);
    const firstFullWeekStart = startOfWeekIso(
      reducedDetailedCadenceDraft.detailed_block.start_date,
    );
    const removableWorkoutIndex = reducedDetailedCadenceDraft.detailed_block.workouts.findIndex(
      (workout) => startOfWeekIso(workout.date) === firstFullWeekStart,
    );
    assert.ok(removableWorkoutIndex >= 0, "Fixture requires a removable first-week workout.");
    reducedDetailedCadenceDraft.detailed_block.workouts.splice(removableWorkoutIndex, 1);
    const reducedDetailedCadenceResult = compileAiAuthoredPlanFirstDraft({
      draft: reducedDetailedCadenceDraft,
      authoringInput,
    });
    assertCoachingPreferenceIsReviewable(
      reducedDetailedCadenceResult,
      "ai_authored_plan_first_requested_weekly_cadence_mismatch",
    );
  }

  const projectionConflictDraft = structuredClone(providerDraft);
  const futureProjection = projectionConflictDraft.blueprint.projections.find(
    (projection) => projection.date !== projectionConflictDraft.blueprint.selected_target_date,
  );
  assert.ok(futureProjection, "Fixture requires a non-target future projection.");
  futureProjection.date = addDaysIso(startOfWeekIso(futureProjection.date), 2);
  const projectionConflictResult = compileAiAuthoredPlanFirstDraft({
    draft: projectionConflictDraft,
    authoringInput,
  });
  assert.equal(
    projectionConflictResult.ok,
    true,
    projectionConflictResult.ok ? "" : JSON.stringify(projectionConflictResult.issues),
  );
  if (!projectionConflictResult.ok) {
    throw new Error("A future fixed-rest projection conflict must remain reviewable.");
  }
  assert.ok(
    projectionConflictResult.reviewConflicts.some(
      (conflict) =>
        conflict.date === futureProjection.date &&
        conflict.code === "fixed_rest_day_preference_conflict",
    ),
  );

  const malformedProjection = structuredClone(providerDraft) as AiAuthoredPlanFirstCompilerDraft & {
    blueprint: { projections: Array<Record<string, unknown>> };
  };
  assert.ok(malformedProjection.blueprint.projections[0]);
  malformedProjection.blueprint.projections[0]!.duration_min = 30;
  const malformedProjectionResult = compileAiAuthoredPlanFirstDraft({
    draft: malformedProjection,
    authoringInput,
  });
  assert.equal(malformedProjectionResult.ok, false);

  const sparseProjectionDraft = structuredClone(providerDraft);
  sparseProjectionDraft.blueprint.projections.splice(1, 1);
  const sparseProjectionResult = compileAiAuthoredPlanFirstDraft({
    draft: sparseProjectionDraft,
    authoringInput,
  });
  assert.equal(
    sparseProjectionResult.ok,
    true,
    "Future projection density is a coaching concern, not compiler admission authority.",
  );
  if (malformedProjectionResult.ok) {
    throw new Error("Executable projection unexpectedly passed strict compiler validation.");
  }
  assert.equal(malformedProjectionResult.reason, "ai_authored_plan_first_provider_schema_invalid");

  const duplicatePlacement = structuredClone(providerDraft);
  duplicatePlacement.detailed_block.workouts[1]!.date =
    duplicatePlacement.detailed_block.workouts[0]!.date;
  const duplicateResult = compileAiAuthoredPlanFirstDraft({
    draft: duplicatePlacement,
    authoringInput,
  });
  assert.equal(duplicateResult.ok, false);
  if (duplicateResult.ok) throw new Error("Duplicate detailed placement unexpectedly compiled.");
  assert.ok(
    duplicateResult.issues.some((issue) => issue.code === "ai_authored_plan_first_duplicate_date"),
  );

  const unsafeTempoDraft = structuredClone(providerDraft);
  const unsafeTempoLeaf = requireSubstantiveQualityPaceLeaf(
    unsafeTempoDraft,
    "controlled_tempo_session",
  );
  unsafeTempoLeaf.target.command = "5:10-5:25/km";
  unsafeTempoLeaf.cue = "Keep the effort controlled at RPE max 7/10.";
  const unsafeTempoResult = compileAiAuthoredPlanFirstDraft({
    draft: unsafeTempoDraft,
    authoringInput,
  });
  assertCoachingPreferenceIsReviewable(
    unsafeTempoResult,
    "ai_authored_plan_first_tempo_pace_not_slower_than_recent_5k",
  );

  const missingTempoCeilingDraft = structuredClone(providerDraft);
  const missingTempoCeilingLeaf = requireSubstantiveQualityPaceLeaf(
    missingTempoCeilingDraft,
    "controlled_tempo_session",
  );
  missingTempoCeilingLeaf.target.command = "5:40-5:55/km";
  missingTempoCeilingLeaf.cue = null;
  const missingTempoCeilingResult = compileAiAuthoredPlanFirstDraft({
    draft: missingTempoCeilingDraft,
    authoringInput,
  });
  assertCoachingPreferenceIsReviewable(
    missingTempoCeilingResult,
    "ai_authored_plan_first_tempo_rpe_ceiling_missing",
  );

  const unsafe10kRhythmDraft = structuredClone(providerDraft);
  const rhythmWorkout = [
    ...unsafe10kRhythmDraft.detailed_block.workouts,
    unsafe10kRhythmDraft.detailed_block.final_workout,
  ].find((workout) => workout.workout_identity === "controlled_tempo_session");
  assert.ok(rhythmWorkout, "Fixture requires a workout that can prove 10K rhythm safety.");
  rhythmWorkout.workout_identity = "10k_rhythm_intervals";
  const rhythmPhase = unsafe10kRhythmDraft.blueprint.phases.find(
    (phase) => rhythmWorkout.date >= phase.start_date && rhythmWorkout.date <= phase.end_date,
  );
  assert.ok(rhythmPhase?.workout_families.includes("intervals"));
  rhythmPhase.workout_families = rhythmPhase.workout_families.filter(
    (family) => family !== "intervals",
  );
  const unsafe10kRhythmLeaf = requireSubstantiveQualityPaceLeaf(
    unsafe10kRhythmDraft,
    "10k_rhythm_intervals",
  );
  unsafe10kRhythmLeaf.target.command = "5:15-5:25/km";
  unsafe10kRhythmLeaf.cue = null;
  const unsafe10kRhythmResult = compileAiAuthoredPlanFirstDraft({
    draft: unsafe10kRhythmDraft,
    authoringInput,
  });
  assertCoachingPreferenceIsReviewable(
    unsafe10kRhythmResult,
    "ai_authored_plan_first_10k_rhythm_pace_not_slower_than_recent_5k",
  );

  unsafe10kRhythmLeaf.target.command = "5:40-5:55/km";
  unsafe10kRhythmLeaf.cue = "Keep the session controlled at RPE max 8/10.";
  const safe10kRhythmResult = compileAiAuthoredPlanFirstDraft({
    draft: unsafe10kRhythmDraft,
    authoringInput,
  });
  assert.equal(safe10kRhythmResult.ok, true, "A benchmark-safe 10K rhythm session must compile.");
  if (!safe10kRhythmResult.ok) {
    throw new Error("A benchmark-safe 10K rhythm session unexpectedly failed compilation.");
  }
  assert.ok(
    safe10kRhythmResult.validationIssues.some((issue) =>
      issue.includes(
        `ai_authored_blueprint_detailed_family_derived:blueprint.phases.${unsafe10kRhythmDraft.blueprint.phases.indexOf(rhythmPhase)}.workout_families:intervals:detailed_block.days.${rhythmWorkout.date}`,
      ),
    ),
    "The unchanged 10K rhythm workout must derive its redundant Blueprint family visibly.",
  );

  const denseQualityDraft = structuredClone(providerDraft);
  const tempoDay = [...denseQualityDraft.detailed_block.workouts].find(
    (workout) => workout.workout_identity === "controlled_tempo_session",
  );
  assert.ok(tempoDay, "Fixture requires one tempo day for weekly density proof.");
  const tempoWeek = startOfWeekIso(tempoDay.date);
  const extraQualityDay = denseQualityDraft.detailed_block.workouts.find(
    (workout) =>
      startOfWeekIso(workout.date) === tempoWeek &&
      workout.date !== tempoDay.date &&
      workout.workout_identity === "easy_aerobic_run",
  );
  assert.ok(extraQualityDay, "Fixture requires one easy day in the tempo week.");
  extraQualityDay.workout_identity = "distance_intervals";
  const denseQualityResult = compileAiAuthoredPlanFirstDraft({
    draft: denseQualityDraft,
    authoringInput,
  });
  assertCoachingPreferenceIsReviewable(
    denseQualityResult,
    "ai_authored_plan_first_four_day_week_quality_density_exceeded",
  );

  const steepLongRunDraft = structuredClone(providerDraft);
  const timedLongRuns = steepLongRunDraft.detailed_block.workouts.filter(
    (workout) => workout.workout_identity === "long_aerobic_run",
  );
  assert.ok(timedLongRuns.length >= 2, "Fixture requires two long runs for progression proof.");
  const secondLongRunBody = timedLongRuns[1]!.sections.find(
    (section) => section.kind === "unit" && section.segment_type === "main",
  );
  assert.ok(secondLongRunBody?.kind === "unit");
  assert.equal(secondLongRunBody.prescription.mode, "time");
  if (secondLongRunBody.prescription.mode !== "time") {
    throw new Error("Fixture long-run body must be time based.");
  }
  secondLongRunBody.prescription.duration_min += 15;
  const steepLongRunResult = compileAiAuthoredPlanFirstDraft({
    draft: steepLongRunDraft,
    authoringInput,
  });
  assertCoachingPreferenceIsReviewable(
    steepLongRunResult,
    "ai_authored_plan_first_missing_baseline_long_run_progression_exceeded",
  );

  const qualityFinishDraft = structuredClone(providerDraft);
  const qualityFinishLongRun = qualityFinishDraft.detailed_block.workouts.find(
    (workout) => workout.workout_identity === "long_aerobic_run",
  );
  assert.ok(qualityFinishLongRun, "Fixture requires one long run for quality-finish proof.");
  qualityFinishLongRun.workout_identity = "long_run_with_steady_finish";
  const qualityFinishResult = compileAiAuthoredPlanFirstDraft({
    draft: qualityFinishDraft,
    authoringInput,
  });
  assertCoachingPreferenceIsReviewable(
    qualityFinishResult,
    "ai_authored_plan_first_missing_baseline_long_run_quality_forbidden",
  );

  const steepWeeklyDurationDraft = structuredClone(providerDraft);
  const firstWeekStart = startOfWeekIso(steepWeeklyDurationDraft.detailed_block.start_date);
  const secondWeekWorkouts = steepWeeklyDurationDraft.detailed_block.workouts.filter(
    (workout) => startOfWeekIso(workout.date) === addDaysIso(firstWeekStart, 7),
  );
  assert.ok(secondWeekWorkouts.length > 0, "Fixture requires a second week for load proof.");
  for (const workout of secondWeekWorkouts) {
    for (const section of workout.sections) {
      if (section.kind === "unit" && section.prescription.mode === "distance") {
        section.prescription = { mode: "time", duration_min: 5 };
      } else if (section.kind === "repeat") {
        for (const child of section.children) {
          if (child.prescription.mode === "distance") {
            child.prescription = { mode: "time", duration_min: 5 };
          }
        }
      }
    }
  }
  const secondWeekTimedBody = secondWeekWorkouts
    .flatMap((workout) => workout.sections)
    .find((section) => section.kind === "unit" && section.prescription.mode === "time");
  assert.ok(secondWeekTimedBody?.kind === "unit");
  assert.equal(secondWeekTimedBody.prescription.mode, "time");
  if (secondWeekTimedBody.prescription.mode !== "time") {
    throw new Error("Fixture second-week body must be time based.");
  }
  secondWeekTimedBody.prescription.duration_min += 180;
  const steepWeeklyDurationResult = compileAiAuthoredPlanFirstDraft({
    draft: steepWeeklyDurationDraft,
    authoringInput,
  });
  assertCoachingPreferenceIsReviewable(
    steepWeeklyDurationResult,
    "ai_authored_plan_first_missing_baseline_weekly_duration_progression_exceeded",
  );

  const missingLongRunCutbackDraft = structuredClone(providerDraft);
  convertDraftToTimeBasedForProgressionProof(missingLongRunCutbackDraft);
  const cutbackLongRuns = [
    ...missingLongRunCutbackDraft.detailed_block.workouts,
    missingLongRunCutbackDraft.detailed_block.final_workout,
  ].filter((workout) => PROOF_LONG_RUN_IDENTITIES.has(workout.workout_identity));
  assert.ok(cutbackLongRuns.length >= 4, "Fixture requires four long runs for cutback proof.");
  cutbackLongRuns[3]!.workout_identity = cutbackLongRuns[2]!.workout_identity;
  cutbackLongRuns[3]!.sections = structuredClone(cutbackLongRuns[2]!.sections);
  const missingLongRunCutbackResult = compileAiAuthoredPlanFirstDraft({
    draft: missingLongRunCutbackDraft,
    authoringInput,
  });
  assertCoachingPreferenceIsReviewable(
    missingLongRunCutbackResult,
    "ai_authored_plan_first_missing_baseline_fourth_week_long_run_cutback_missing",
  );

  const missingWeeklyCutbackDraft = structuredClone(providerDraft);
  convertDraftToTimeBasedForProgressionProof(missingWeeklyCutbackDraft);
  const fourthWeekStart = addDaysIso(firstWeekStart, 21);
  const fourthWeekTimedUnit = missingWeeklyCutbackDraft.detailed_block.workouts
    .filter((workout) => startOfWeekIso(workout.date) === fourthWeekStart)
    .flatMap((workout) => workout.sections)
    .find((section) => section.kind === "unit" && section.prescription.mode === "time");
  assert.ok(fourthWeekTimedUnit?.kind === "unit");
  if (fourthWeekTimedUnit.kind !== "unit" || fourthWeekTimedUnit.prescription.mode !== "time") {
    throw new Error("Fixture fourth week requires a timed unit for cutback proof.");
  }
  fourthWeekTimedUnit.prescription.duration_min += 90;
  const missingWeeklyCutbackResult = compileAiAuthoredPlanFirstDraft({
    draft: missingWeeklyCutbackDraft,
    authoringInput,
  });
  assertCoachingPreferenceIsReviewable(
    missingWeeklyCutbackResult,
    "ai_authored_plan_first_missing_baseline_fourth_week_cutback_missing",
  );

  let targetBoundaryWeeks: number | null = null;
  if (capabilityClass !== "not_applicable_reentry") {
    const targetBoundaryInput = {
      ...authoringInput,
      availability: { ...authoringInput.availability, maxRunningDaysPerWeek: null },
      planGoalIntent: {
        ...authoringInput.planGoalIntent,
        targetDate: addDaysIso(authoringInput.schedule.startDate, 13),
      },
    };
    const targetBoundary = await generateFixturePreview(targetBoundaryInput);
    targetBoundaryWeeks = targetBoundary.blueprint.detailedHorizon.calendarWeekCount;
    assert.equal(targetBoundary.blueprint.detailedHorizon.targetBoundary, true);
    assert.equal(targetBoundaryWeeks, 2);
    assert.equal(targetBoundary.canonicalPlan.planned_workouts.length, 14);
    assert.equal(targetBoundary.blueprint.projections.length, 0);
    assert.equal(
      targetBoundary.canonicalPlan.planned_workouts.at(-1)?.workout_identity,
      "selected_distance_completion_or_checkpoint",
    );
    assert.equal(
      targetBoundary.canonicalPlan.planned_workouts.at(-1)?.date,
      targetBoundary.blueprint.selectedTargetDate,
    );
  }

  const serviceSource = await readFile(
    new URL("../src/lib/ai-first-plan-draft-service.ts", import.meta.url),
    "utf8",
  );
  const retentionIndex = serviceSource.indexOf("retainCompletedAiPlanGenerationResponseForUser({");
  const compilerIndex = serviceSource.indexOf("normalizeOpenAiFirstPlanContractOutput({");
  const outcomeIndex = serviceSource.indexOf("recordRetainedResponseOutcome({", compilerIndex);
  assert.ok(retentionIndex >= 0 && compilerIndex > retentionIndex && outcomeIndex > compilerIndex);

  for (const file of [
    "../src/lib/ai-authored-plan-first-compiler.ts",
    "../src/lib/ai-authored-plan-first-provider-contract.ts",
  ] as const) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /runner-calendar-(?:persistence|mutations)/);
    assert.doesNotMatch(source, /planned_workouts[^\n]*(?:insert|update|upsert|delete)/i);
  }

  const beginnerZeroHistoryQuality = await validateBeginnerZeroHistoryQualityBoundary();

  const evidence = {
    adaptiveBlueprintCompiler: "passed",
    fullTargetBlueprint: true,
    detailedCalendarWeeks: 4,
    targetBoundaryWeeks,
    projectionsNonExecutable: true,
    weekdayConflictReviewable: true,
    hardStructuralRejection: true,
    targetTaperBoundary: true,
    tempoBenchmarkReviewable: true,
    tenKilometreRhythmBenchmarkReviewable: true,
    fourDayWeekQualityDensityReviewable: true,
    missingBaselineLongRunProgressionReviewable: true,
    missingBaselineWeeklyDurationProgressionReviewable: true,
    missingBaselineLongRunQualityFinishReviewable: true,
    requestedWeeklyCadenceReviewable: true,
    fixedRestProjectionConflictReviewable: true,
    fourthWeekCutbackReviewable: true,
    completedResponseRetainedBeforeCompilerOutcome: true,
    beginnerZeroHistoryQuality,
    providerCalls: 0,
    calendarWrites: 0,
  };
  return evidence;
}

async function validateBeginnerZeroHistoryQualityBoundary() {
  const scenarios = [
    { goal: "10K" as const, targetDate: "2026-12-06" },
    { goal: "Half Marathon" as const, targetDate: "2027-02-14" },
    { goal: "Marathon" as const, targetDate: "2027-04-18" },
  ];
  const compiledDrafts: AiAuthoredPlanFirstCompilerDraft[] = [];

  for (const scenario of scenarios) {
    const input = buildBeginnerZeroHistoryAuthoringInput(scenario);
    const draft = buildBeginnerZeroHistoryProviderDraft(input, scenario.goal);
    const prompt = buildAiAuthoredPlanFirstPrompt({ authoringInput: input });
    const payload = JSON.parse(prompt.userPrompt) as {
      providerContractVersion: string;
      runnerFacts: {
        calendar: {
          allowed_running_weekdays: string[] | null;
          requested_workouts_per_full_week: number | null;
        };
        runner: {
          beginner_zero_history_quality_boundary: {
            version: string;
            goal_specific: { goal: string };
          } | null;
          runner_capability: { version: string; sevenDaySlices: unknown[] };
        };
      };
    };
    assert.equal(payload.providerContractVersion, "adaptive-blueprint-four-week-direct-v35");
    assert.equal(payload.runnerFacts.calendar.requested_workouts_per_full_week, null);
    assert.deepEqual(payload.runnerFacts.calendar.allowed_running_weekdays, [
      "Monday",
      "Wednesday",
      "Friday",
      "Sunday",
    ]);
    assert.equal(
      payload.runnerFacts.runner.beginner_zero_history_quality_boundary?.version,
      "beginner_zero_history_four_week_quality_v1",
    );
    assert.equal(
      payload.runnerFacts.runner.beginner_zero_history_quality_boundary?.goal_specific.goal,
      scenario.goal,
    );
    assert.equal(
      payload.runnerFacts.runner.runner_capability.version,
      "runner_plan_capability_vector_v1",
    );
    assert.equal(payload.runnerFacts.runner.runner_capability.sevenDaySlices.length, 12);
    assert.match(prompt.systemPrompt, /75 to 105 total active minutes/);
    assert.match(prompt.systemPrompt, /six to eight spaced contacts/);
    assert.match(prompt.systemPrompt, /sole author/);
    assert.match(prompt.systemPrompt, /allowed_running_weekdays is the exhaustive allowlist/);
    if (scenario.goal === "10K") {
      const dynamicSchema = prompt.responseSchema as {
        $defs: {
          blueprint_projection: { properties: { date: { enum: string[] } } };
          workout: { properties: { date: { enum: string[] } } };
        };
      };
      const allowedDetailedDates = dynamicSchema.$defs.workout.properties.date.enum;
      assert.equal(allowedDetailedDates.length, 16);
      assert.ok(
        allowedDetailedDates.every((date) =>
          ["Monday", "Wednesday", "Friday", "Sunday"].includes(weekdayLong(date)),
        ),
      );
      assert.equal(allowedDetailedDates.includes("2026-09-24"), false);
      assert.equal(allowedDetailedDates.includes("2026-09-26"), false);
      assert.ok(
        dynamicSchema.$defs.blueprint_projection.properties.date.enum.every(
          (date) =>
            date === scenario.targetDate ||
            ["Monday", "Wednesday", "Friday", "Sunday"].includes(weekdayLong(date)),
        ),
      );
      assert.match(prompt.systemPrompt, /week three must be 5 to 15 percent above week two/i);
      assert.match(prompt.systemPrompt, /10k_rhythm_intervals/);
      assert.match(prompt.systemPrompt, /week one must total 75 to 105 minutes/);
      assert.match(prompt.systemPrompt, /Treat those authored totals as hard budgets/);
      assert.match(prompt.systemPrompt, /effort_kind=controlled_short_repetition/);
      assert.match(prompt.systemPrompt, /effort_kind=controlled_short_recovery/);
      assert.match(prompt.systemPrompt, /never use pace or heart rate/);
      assert.match(
        prompt.systemPrompt,
        /Sunday first true long run totaling 35 to 45 active minutes/,
      );
      assert.match(prompt.systemPrompt, /75 to 85 percent of week three/);
      assert.match(prompt.systemPrompt, /Sunday long run totaling 30 to 40 active minutes/);
      assert.match(
        prompt.systemPrompt,
        /Backend independently derives and binds the same measurements/,
      );
      assert.match(prompt.systemPrompt, /do not return a duplicate audit ledger/);
      assert.match(prompt.systemPrompt, /Monday, Wednesday, Friday, and Sunday/);
      assert.match(
        prompt.systemPrompt,
        /retain all four Monday\/Wednesday\/Friday\/Sunday contacts/,
      );
      assert.doesNotMatch(JSON.stringify(prompt.responseSchema), /self_audit/);
    }
    assert.match(JSON.stringify(prompt.responseSchema), /exact four-week zero-history boundary/);

    const compiled = compileAiAuthoredPlanFirstDraft({ draft, authoringInput: input });
    assert.equal(
      compiled.ok,
      true,
      compiled.ok ? "" : `${scenario.goal}: ${JSON.stringify(compiled.issues)}`,
    );
    if (!compiled.ok) throw new Error(`${scenario.goal} positive boundary draft failed.`);
    compiledDrafts.push(structuredClone(draft));

    let providerRequests = 0;
    const preview = await generateAiFirstPlanDraftPreview({
      input,
      apiKey: "local-fixture-only",
      model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
      candidateOwnerUserId: null,
      generationLedger: { disabled: true },
      fetchImpl: async () => {
        providerRequests += 1;
        return new Response(
          JSON.stringify({
            id: `hito-294-${scenario.goal.toLowerCase().replaceAll(" ", "-")}`,
            status: "completed",
            output_text: JSON.stringify(draft),
            usage: { input_tokens: 100, output_tokens: 100, total_tokens: 200 },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    });
    assert.equal(preview.ok, true, preview.ok ? "" : JSON.stringify(preview.issues));
    assert.equal(providerRequests, 1, "C0 must reach exactly one provider authoring request.");
    if (scenario.goal === "10K") {
      const expectedSelfAudit = deriveAiAuthoredPlanFirstSelfAudit({
        draft,
        authoringInput: input,
      });
      assert.equal(expectedSelfAudit.ok, true);
      if (!expectedSelfAudit.ok) throw new Error(expectedSelfAudit.message);
      assert.deepEqual(preview.ok ? preview.selfAudit : null, expectedSelfAudit.selfAudit);
      assertZeroHistoryTenKSelfAuditBoundary({ input, draft });
    } else {
      assert.equal(preview.ok ? preview.selfAudit : null, null);
      assertBeginnerZeroHistoryNegativeGates({ input, draft });
    }
  }

  assert.notDeepEqual(
    compiledDrafts[0]!.detailed_block,
    compiledDrafts[1]!.detailed_block,
    "10K and Half Marathon must differ materially inside the detailed block.",
  );
  assert.notDeepEqual(
    compiledDrafts[1]!.detailed_block,
    compiledDrafts[2]!.detailed_block,
    "Half Marathon and Marathon must differ materially inside the detailed block.",
  );
  return {
    providerContract: "adaptive-blueprint-four-week-direct-v35",
    compiler: "adaptive_blueprint_compiler_v16",
    goals: scenarios.map((scenario) => scenario.goal),
    providerRequestsPerGoal: 1,
    providerDispatches: 0,
    calendarWrites: 0,
  };
}

function buildBeginnerZeroHistoryAuthoringInput(input: {
  goal: "10K" | "Half Marathon" | "Marathon";
  targetDate: string;
}): StructuredPlanAuthoringInput {
  const previewInput: RunningPlanPreviewActionInput = {
    age: 34,
    heightCm: 178,
    weightKg: 72,
    runnerLevel: "beginner_new_runner",
    daysPerWeek: 4,
    fixedRestDays: ["Tuesday", "Thursday", "Saturday"],
    preferredLongRunDay: "Sunday",
    currentRunningLimitation: "no",
    startDate: "2026-09-07",
    benchmark: { kind: "unknown" },
    planGoalIntent: {
      distance: { kind: "preset", preset: input.goal },
      targetDate: input.targetDate,
    },
  };
  const profile = buildProofRunnerCapability(previewInput, {
    recentState: "unavailable",
    rollingState: "unavailable",
    latestState: "unavailable",
    constraintsState: "available",
  });
  const authoring = buildAiGeneratedRunningPlanAuthoringInputRuntime(
    previewInput,
    profile.runnerCapability,
    profile.acceptedHeartRateProfile,
  );
  assert.equal(authoring.ok, true, authoring.ok ? "" : authoring.message);
  if (!authoring.ok) throw new Error(authoring.message);
  return authoring.authoringInput;
}

function buildBeginnerZeroHistoryProviderDraft(
  input: StructuredPlanAuthoringInput,
  goal: "10K" | "Half Marathon" | "Marathon",
) {
  const draft = buildAiGeneratedRunningPlanDevFixtureProviderDraft(input);
  const workout = beginnerWorkoutBuilder(input);
  const start = input.schedule.startDate;
  const firstTwoWeeks = [
    workout.runWalk(addDaysIso(start, 0), 20),
    workout.simple(addDaysIso(start, 2), "easy_aerobic_run", "Easy", 20),
    workout.simple(addDaysIso(start, 4), "recovery_jog", "Recovery", 20),
    workout.simple(addDaysIso(start, 6), "easy_aerobic_run", "Easy", 30),
    workout.runWalk(addDaysIso(start, 9), 30),
    workout.simple(addDaysIso(start, 11), "easy_aerobic_run", "Easy", 35),
    workout.simple(addDaysIso(start, 13), "recovery_jog", "Recovery", 38),
  ];
  const weekThree =
    goal === "10K"
      ? [
          workout.simple(addDaysIso(start, 14), "easy_aerobic_run", "Easy", 20),
          workout.turnover(addDaysIso(start, 16), 29),
          workout.simple(addDaysIso(start, 18), "recovery_jog", "Recovery", 20),
          workout.long(addDaysIso(start, 20), 40, "long_aerobic_run"),
        ]
      : goal === "Half Marathon"
        ? [
            workout.simple(addDaysIso(start, 14), "easy_aerobic_run", "Easy", 20),
            workout.steady(addDaysIso(start, 16), 33, 15, "Half Marathon controlled aerobic"),
            workout.simple(addDaysIso(start, 18), "recovery_jog", "Recovery", 12),
            workout.long(addDaysIso(start, 20), 50, "long_aerobic_run"),
          ]
        : [
            workout.simple(addDaysIso(start, 14), "easy_aerobic_run", "Easy", 11),
            workout.steady(addDaysIso(start, 16), 40, 25, "Marathon aerobic durability"),
            workout.simple(addDaysIso(start, 18), "recovery_jog", "Recovery", 12),
            workout.long(addDaysIso(start, 20), 55, "long_aerobic_run"),
          ];
  const weekFourLong = goal === "10K" ? 35 : goal === "Half Marathon" ? 40 : 45;
  const weekFour = [
    workout.simple(addDaysIso(start, 23), "easy_aerobic_run", "Easy cutback", 30),
    workout.simple(addDaysIso(start, 25), "recovery_jog", "Recovery", 20),
    workout.long(addDaysIso(start, 27), weekFourLong, "cutback_long_run"),
  ];
  const days = [...firstTwoWeeks, ...weekThree, ...weekFour];
  const finalWorkout = days.at(-1)!;
  draft.detailed_block.workouts = days.slice(0, -1);
  draft.detailed_block.final_workout = finalWorkout;
  draft.blueprint.phases[0]!.workout_families = [
    "recovery",
    "easy",
    "steady",
    "long",
    "intervals",
    "race",
  ];
  return draft;
}

function assertZeroHistoryTenKSelfAuditBoundary(input: {
  input: StructuredPlanAuthoringInput;
  draft: AiAuthoredPlanFirstCompilerDraft;
}) {
  const expectedSelfAudit = deriveAiAuthoredPlanFirstSelfAudit({
    draft: input.draft,
    authoringInput: input.input,
  });
  assert.equal(expectedSelfAudit.ok, true);
  if (!expectedSelfAudit.ok) throw new Error(expectedSelfAudit.message);
  assert.equal(expectedSelfAudit.selfAudit?.gate_outcomes.all_passed, true);

  const providerLedger = {
    ...structuredClone(input.draft),
    self_audit: expectedSelfAudit.selfAudit,
  };
  const providerLedgerResult = compileAiAuthoredPlanFirstDraft({
    draft: providerLedger,
    authoringInput: input.input,
  });
  assert.equal(providerLedgerResult.ok, false);
  if (providerLedgerResult.ok) throw new Error("A provider-authored audit ledger was accepted.");
  assert.equal(providerLedgerResult.reason, "ai_authored_plan_first_provider_schema_invalid");
  assert.ok(
    providerLedgerResult.issues.some(
      (issue) =>
        issue.code === "ai_authored_plan_first_provider_schema_invalid" &&
        issue.message.includes("self_audit"),
    ),
  );

  const failedGate = structuredClone(input.draft);
  const weekTwoSection = failedGate.detailed_block.workouts
    .find((workout) => workout.date === addDaysIso(failedGate.detailed_block.start_date, 11))
    ?.sections.find((section) => section.kind === "unit" && section.prescription.mode === "time");
  assert.ok(weekTwoSection && weekTwoSection.kind === "unit");
  if (weekTwoSection?.kind === "unit" && weekTwoSection.prescription.mode === "time") {
    weekTwoSection.prescription.duration_min += 60;
  }
  const failedGateResult = compileAiAuthoredPlanFirstDraft({
    draft: failedGate,
    authoringInput: input.input,
  });
  assert.equal(failedGateResult.ok, true);
  if (!failedGateResult.ok) throw new Error("A reviewable coaching diagnostic was fatal.");
  assert.equal(failedGateResult.selfAudit?.gate_outcomes.week_two_growth_within_range, false);
  assert.ok(
    failedGateResult.validationIssues.includes(
      "ai_authored_plan_first_self_audit_gate_failed:week_two_growth_within_range",
    ),
  );
}

function beginnerWorkoutBuilder(input: StructuredPlanAuthoringInput) {
  type Workout = AiAuthoredPlanFirstCompilerDraft["detailed_block"]["workouts"][number];
  type Identity = Workout["workout_identity"];
  type SegmentType = Extract<Workout["sections"][number], { kind: "unit" }>["segment_type"];
  const hr = (reference: "Z1" | "Z2" | "Z3") => {
    const zone = input.runnerFacts.heartRateProfile.zones.find(
      (candidate) => candidate.reference === reference,
    );
    assert.ok(zone, `Fixture requires accepted ${reference}.`);
    return {
      primary_execution_mode: "heart_rate" as const,
      band_reference: reference,
      command: `${zone.minBpm}-${zone.maxBpm} bpm`,
    };
  };
  const unit = (
    segmentType: SegmentType,
    label: string,
    minutes: number,
    reference: "Z1" | "Z2",
  ) => ({
    kind: "unit" as const,
    segment_type: segmentType,
    label,
    cue: `${label} with controlled breathing.`,
    prescription: { mode: "time" as const, duration_min: minutes },
    target: hr(reference),
  });
  const day = (
    date: string,
    identity: Identity,
    title: string,
    sections: Workout["sections"],
  ): Workout => ({
    date,
    phase: "Training plan",
    workout_identity: identity,
    title,
    cue: `${title} supports the selected goal without claiming observed capacity.`,
    sections,
  });
  const simple = (date: string, identity: Identity, title: string, total: number) =>
    day(date, identity, title, [
      unit("warmup", "Warm up", 5, "Z1"),
      unit(
        identity === "recovery_jog" ? "recovery_jog" : "main",
        "Active work",
        total - 10,
        identity === "recovery_jog" ? "Z1" : "Z2",
      ),
      unit("cooldown", "Cool down", 5, "Z1"),
    ]);
  const runWalk = (date: string, total: number) => {
    const repeated = total - 10;
    const rounds = repeated / 5;
    assert.equal(Number.isInteger(rounds), true);
    return day(date, "recovery_jog", "Run/Walk", [
      unit("warmup", "Warm up walk", 5, "Z1"),
      {
        kind: "repeat" as const,
        segment_type: "interval_block" as const,
        label: "Run/Walk set",
        cue: "Alternate controlled running and walking.",
        rounds,
        children: [
          {
            role: "run" as const,
            label: "Run",
            cue: "Run with controlled breathing.",
            prescription: { mode: "time" as const, duration_min: 3 },
            target: hr("Z2"),
          },
          {
            role: "walk" as const,
            label: "Walk",
            cue: "Walk and settle breathing.",
            prescription: { mode: "time" as const, duration_min: 2 },
            target: hr("Z1"),
          },
        ],
      },
      unit("cooldown", "Cool down walk", 5, "Z1"),
    ]);
  };
  const turnover = (date: string, total: number) =>
    day(date, "10k_rhythm_intervals", "Controlled 10K turnover", [
      unit("warmup", "Warm up", 5, "Z1"),
      {
        kind: "repeat" as const,
        segment_type: "interval_block" as const,
        label: "Controlled turnover",
        cue: "Keep every repetition controlled and recover fully.",
        rounds: 4,
        children: [
          {
            role: "work" as const,
            label: "Controlled work",
            cue: "Controlled turnover without a race-pace claim.",
            prescription: { mode: "time" as const, duration_min: 3 },
            target: hr("Z3"),
          },
          {
            role: "recover" as const,
            label: "Recovery",
            cue: "Recover fully and keep breathing relaxed.",
            prescription: { mode: "time" as const, duration_min: 2 },
            target: hr("Z1"),
          },
        ],
      },
      unit("cooldown", "Cool down", total - 25, "Z1"),
    ]);
  const steady = (date: string, total: number, work: number, title: string) =>
    day(date, "steady_aerobic_run", title, [
      unit("warmup", "Warm up", 10, "Z1"),
      unit("main", "Controlled aerobic work", work, "Z2"),
      unit("cooldown", "Cool down", total - 10 - work, "Z1"),
    ]);
  const long = (date: string, total: number, identity: Identity) =>
    day(date, identity, identity === "cutback_long_run" ? "Cutback Long Run" : "Long Run", [
      unit("warmup", "Warm up", 5, "Z2"),
      unit("main", "Aerobic endurance", total - 10, "Z2"),
      unit("cooldown", "Cool down", 5, "Z2"),
    ]);
  return { simple, runWalk, turnover, steady, long };
}

function assertBeginnerZeroHistoryNegativeGates(input: {
  input: StructuredPlanAuthoringInput;
  draft: AiAuthoredPlanFirstCompilerDraft;
}) {
  const expectReviewable = (
    code: string,
    mutate: (draft: AiAuthoredPlanFirstCompilerDraft) => void,
  ) => {
    const draft = structuredClone(input.draft);
    mutate(draft);
    const result = compileAiAuthoredPlanFirstDraft({ draft, authoringInput: input.input });
    assertCoachingPreferenceIsReviewable(result, code);
  };
  expectReviewable(
    "ai_authored_plan_first_beginner_zero_history_adaptation_contacts_invalid",
    (draft) => {
      draft.detailed_block.workouts.splice(0, 2);
    },
  );
  expectReviewable(
    "ai_authored_plan_first_beginner_zero_history_opening_minutes_invalid",
    (draft) => {
      const day = draft.detailed_block.workouts.find(
        (workout) => workout.date === addDaysIso(draft.detailed_block.start_date, 6),
      )!;
      const section = day.sections.find(
        (candidate) => candidate.kind === "unit" && candidate.segment_type === "main",
      );
      assert.ok(section && section.kind === "unit");
      if (section?.kind === "unit") section.prescription = { mode: "time", duration_min: 1 };
    },
  );
  expectReviewable(
    "ai_authored_plan_first_beginner_zero_history_build_progression_invalid",
    (draft) => {
      const day = draft.detailed_block.workouts.find(
        (workout) => workout.date === addDaysIso(draft.detailed_block.start_date, 11),
      )!;
      const section = day.sections.find((candidate) => candidate.kind === "unit");
      assert.ok(section && section.kind === "unit");
      if (section?.kind === "unit") section.prescription = { mode: "time", duration_min: 60 };
    },
  );
  expectReviewable("ai_authored_plan_first_beginner_zero_history_cutback_invalid", (draft) => {
    const day = draft.detailed_block.workouts.find(
      (workout) => workout.date === addDaysIso(draft.detailed_block.start_date, 23),
    )!;
    const section = day.sections.find(
      (candidate) => candidate.kind === "unit" && candidate.segment_type === "main",
    );
    assert.ok(section && section.kind === "unit");
    if (section?.kind === "unit") section.prescription = { mode: "time", duration_min: 70 };
  });
  expectReviewable(
    "ai_authored_plan_first_beginner_zero_history_early_quality_or_long_forbidden",
    (draft) => {
      draft.detailed_block.workouts[0]!.workout_identity = "long_aerobic_run";
    },
  );
  expectReviewable(
    "ai_authored_plan_first_beginner_zero_history_long_duration_invalid",
    (draft) => {
      const long = draft.detailed_block.workouts.find(
        (workout) => workout.date === addDaysIso(draft.detailed_block.start_date, 20),
      )!;
      const section = long.sections.find(
        (candidate) => candidate.kind === "unit" && candidate.segment_type === "main",
      );
      assert.ok(section && section.kind === "unit");
      if (section?.kind === "unit") section.prescription = { mode: "time", duration_min: 90 };
    },
  );
  expectReviewable(
    "ai_authored_plan_first_beginner_zero_history_execution_authority_invalid",
    (draft) => {
      const section = draft.detailed_block.workouts[0]!.sections[0]!;
      assert.equal(section.kind, "unit");
      if (section.kind === "unit") {
        section.target = {
          primary_execution_mode: "effort",
          effort_kind: "controlled_stride",
        };
      }
    },
  );
  expectReviewable("ai_authored_plan_first_beginner_zero_history_unsupported_claim", (draft) => {
    draft.detailed_block.workouts[0]!.cue = "This makes the runner race-ready.";
  });
}

function requireSubstantiveQualityPaceLeaf(
  draft: AiAuthoredPlanFirstCompilerDraft,
  workoutIdentity: "controlled_tempo_session" | "10k_rhythm_intervals",
) {
  const workout = [...draft.detailed_block.workouts, draft.detailed_block.final_workout].find(
    (candidate) => candidate.workout_identity === workoutIdentity,
  );
  assert.ok(workout, `Fixture requires a ${workoutIdentity} workout.`);

  for (const section of workout.sections) {
    if (
      section.kind === "unit" &&
      !["warmup", "cooldown", "recovery", "recovery_jog"].includes(section.segment_type) &&
      section.target.primary_execution_mode === "pace"
    ) {
      return section;
    }
    if (section.kind === "repeat") {
      const child = section.children.find(
        (candidate) =>
          ["work", "run", "finish"].includes(candidate.role) &&
          candidate.target.primary_execution_mode === "pace",
      );
      if (child) return child;
    }
  }

  throw new Error(`Fixture requires a substantive ${workoutIdentity} pace leaf.`);
}

function convertDraftToTimeBasedForProgressionProof(draft: AiAuthoredPlanFirstCompilerDraft) {
  for (const workout of [...draft.detailed_block.workouts, draft.detailed_block.final_workout]) {
    for (const section of workout.sections) {
      if (section.kind === "unit" && section.prescription.mode === "distance") {
        section.prescription = { mode: "time", duration_min: 5 };
      } else if (section.kind === "repeat") {
        for (const child of section.children) {
          if (child.prescription.mode === "distance") {
            child.prescription = { mode: "time", duration_min: 5 };
          }
        }
      }
    }
  }
}

function projectionCadenceForPhase(
  projections: AiAuthoredPlanFirstCompilerDraft["blueprint"]["projections"],
  phase: string,
  cadence: number,
) {
  const byWeek = new Map<string, typeof projections>();
  for (const projection of projections) {
    const week = startOfWeekIso(projection.date);
    const entries = byWeek.get(week) ?? [];
    entries.push({
      ...projection,
      phase,
      cadence_or_workout_family: projection.review_timing === "target_review" ? "race" : "easy",
    });
    byWeek.set(week, entries);
  }
  return Array.from(byWeek.values()).flatMap((entries) => {
    const selected = entries.slice(0, cadence);
    const target = entries.find((projection) => projection.review_timing === "target_review");
    if (target && !selected.includes(target) && selected.length > 0) {
      selected[selected.length - 1] = target;
    }
    return selected;
  });
}

if (process.argv[1]?.endsWith("plan-first-provider-representation-proof.ts")) {
  console.log(JSON.stringify(await validatePlanFirstProviderRepresentationContract(), null, 2));
}

async function generateFixturePreview(
  input: typeof authoringInput,
): Promise<Extract<Awaited<ReturnType<typeof generateAiFirstPlanDraftPreview>>, { ok: true }>> {
  let requestCount = 0;
  const fixtureFetch = buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({ authoringInput: input });
  const result = await generateAiFirstPlanDraftPreview({
    input,
    apiKey: "local-fixture-only",
    model: AI_GENERATED_RUNNING_PLAN_DEV_FIXTURE_MODEL,
    fetchImpl: async (...args) => {
      requestCount += 1;
      return fixtureFetch(...args);
    },
    candidateOwnerUserId: null,
    generationLedger: { disabled: true },
  });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error(result.issues.join("\n"));
  assert.equal(requestCount, 1, "Every initial plan must use one server-owned provider request.");
  assert.equal(result.metadata.source, "openai_adaptive_blueprint_four_week_draft");
  assert.equal(result.metadata.generationTrace?.provider.kind, "local_dev_fixture");
  assert.equal(result.metadata.generationTrace?.provider.paidProviderCall, false);
  return result;
}

async function readFixtureDraft(input: typeof authoringInput) {
  const response = await buildAiGeneratedRunningPlanDevFixtureOpenAiFetch({
    authoringInput: input,
  })("https://fixture.invalid");
  const envelope = (await response.json()) as { output_text: string };
  return JSON.parse(envelope.output_text) as AiAuthoredPlanFirstCompilerDraft;
}

function assertBlueprintIsFullAndNonExecutable(blueprint: AiAuthoredBlueprintSummary) {
  assert.equal(blueprint.phases[0]?.start_date, blueprint.startDate);
  assert.equal(blueprint.phases.at(-1)?.end_date, blueprint.selectedTargetDate);
  assert.ok(blueprint.projections.length > 0);
  assert.ok(
    blueprint.projections.some(
      (projection) =>
        projection.date === blueprint.selectedTargetDate &&
        projection.review_timing === "target_review",
    ),
  );
  const allowedKeys = new Set([
    "projection_id",
    "date",
    "phase",
    "cadence_or_workout_family",
    "target_assumption",
    "review_timing",
    "label",
  ]);
  for (const projection of blueprint.projections) {
    assert.deepEqual(
      Object.keys(projection).sort(),
      [...allowedKeys].sort(),
      "A Blueprint projection must remain a non-executable intent DTO.",
    );
  }
}

function firstUnoccupiedDate(input: {
  startDate: string;
  endDate: string;
  weekday: string;
  occupiedDates: Set<string>;
}) {
  for (let date = input.startDate; date <= input.endDate; date = addDaysIso(date, 1)) {
    if (weekdayLong(date) === input.weekday && !input.occupiedDates.has(date)) return date;
  }
  throw new Error(`No free ${input.weekday} exists in the detailed fixture horizon.`);
}

function phaseForDate(draft: AiAuthoredPlanFirstCompilerDraft, date: string) {
  const phase = draft.blueprint.phases.find(
    (candidate) => date >= candidate.start_date && date <= candidate.end_date,
  );
  if (!phase) throw new Error(`No Blueprint phase owns ${date}.`);
  return phase.phase;
}
