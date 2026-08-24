import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  compileAiAuthoredPlanFirstDraft,
  type AiAuthoredBlueprintSummary,
} from "../src/lib/ai-authored-plan-first-compiler";
import {
  buildAiAuthoredPlanFirstOpenAiSchema,
  buildAiAuthoredPlanFirstPrompt,
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
  buildAiGeneratedRunningPlanQaFixtureAuthoringInput,
} from "../src/lib/ai-generated-running-plan-dev-fixture";
import { addDaysIso, startOfWeekIso, weekdayLong } from "../src/lib/training";

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
import { buildProofInitialPlanProfile } from "./runner-fitness-profile-initial-plan-proof-helpers";

const authoringInput = buildAiGeneratedRunningPlanQaFixtureAuthoringInput("2026-08-21");

export function buildAiGeneratedRunningPlanAuthoringInput(
  input: RunningPlanPreviewActionInput,
  profile = buildProofInitialPlanProfile(input),
) {
  return buildAiGeneratedRunningPlanAuthoringInputRuntime(
    input,
    profile.initialPlanProfile,
    profile.acceptedHeartRateProfile,
  );
}

export function buildReviewedAiGeneratedRunningPlanPreview(
  input: AiGeneratedRunningPlanPreviewInput,
  options: Parameters<typeof buildReviewedAiGeneratedRunningPlanPreviewRuntime>[1] = {},
) {
  const profile = buildProofInitialPlanProfile(input);
  return buildReviewedAiGeneratedRunningPlanPreviewRuntime(input, {
    ...options,
    initialPlanProfile: options.initialPlanProfile ?? profile.initialPlanProfile,
    acceptedHeartRateProfile: options.acceptedHeartRateProfile ?? profile.acceptedHeartRateProfile,
  });
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
  assert.ok(
    fullHorizon.blueprint.projections.some((projection) =>
      ["intervals", "steady"].includes(projection.cadence_or_workout_family),
    ),
    "The deterministic Blueprint fixture must retain a future quality family.",
  );

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
        initial_plan_profile: {
          components: {
            constraints: Record<string, unknown>;
          };
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
    "trainingPreferences" in
      promptPayload.runnerFacts.runner.initial_plan_profile.components.constraints,
    false,
    "The provider payload must receive the one resolved Calendar availability, not a second settings-owned schedule.",
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

  const reducedPhaseCadenceDraft = structuredClone(providerDraft);
  reducedPhaseCadenceDraft.blueprint.phases[0]!.expected_weekly_cadence = 3;
  const reducedPhaseCadenceResult = compileAiAuthoredPlanFirstDraft({
    draft: reducedPhaseCadenceDraft,
    authoringInput,
  });
  assert.equal(reducedPhaseCadenceResult.ok, false);
  if (reducedPhaseCadenceResult.ok) {
    throw new Error("A reduced Blueprint phase cadence unexpectedly compiled.");
  }
  assert.ok(
    reducedPhaseCadenceResult.issues.some(
      (issue) => issue.code === "ai_authored_blueprint_requested_weekly_cadence_mismatch",
    ),
  );

  const reducedDetailedCadenceDraft = structuredClone(providerDraft);
  const firstFullWeekStart = startOfWeekIso(reducedDetailedCadenceDraft.detailed_block.start_date);
  const removableWorkoutIndex = reducedDetailedCadenceDraft.detailed_block.workouts.findIndex(
    (workout) => startOfWeekIso(workout.date) === firstFullWeekStart,
  );
  assert.ok(removableWorkoutIndex >= 0, "Fixture requires a removable first-week workout.");
  reducedDetailedCadenceDraft.detailed_block.workouts.splice(removableWorkoutIndex, 1);
  const reducedDetailedCadenceResult = compileAiAuthoredPlanFirstDraft({
    draft: reducedDetailedCadenceDraft,
    authoringInput,
  });
  assert.equal(reducedDetailedCadenceResult.ok, false);
  if (reducedDetailedCadenceResult.ok) {
    throw new Error("A reduced full detailed-week cadence unexpectedly compiled.");
  }
  assert.ok(
    reducedDetailedCadenceResult.issues.some(
      (issue) => issue.code === "ai_authored_plan_first_requested_weekly_cadence_mismatch",
    ),
  );

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
  assert.equal(sparseProjectionResult.ok, false);
  if (sparseProjectionResult.ok) {
    throw new Error("A sparse future projection set was unexpectedly accepted.");
  }
  assert.ok(
    sparseProjectionResult.issues.some(
      (issue) => issue.code === "ai_authored_blueprint_projection_cadence_incomplete",
    ),
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
  assert.equal(unsafeTempoResult.ok, false);
  if (unsafeTempoResult.ok) throw new Error("An unsafe benchmark-relative tempo pace compiled.");
  assert.ok(
    unsafeTempoResult.issues.some(
      (issue) => issue.code === "ai_authored_plan_first_tempo_pace_not_slower_than_recent_5k",
    ),
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
  assert.equal(missingTempoCeilingResult.ok, false);
  if (missingTempoCeilingResult.ok) {
    throw new Error("A benchmark-backed tempo pace without an RPE ceiling compiled.");
  }
  assert.ok(
    missingTempoCeilingResult.issues.some(
      (issue) => issue.code === "ai_authored_plan_first_tempo_rpe_ceiling_missing",
    ),
  );

  const unsafe10kRhythmDraft = structuredClone(providerDraft);
  const rhythmWorkout = [
    ...unsafe10kRhythmDraft.detailed_block.workouts,
    unsafe10kRhythmDraft.detailed_block.final_workout,
  ].find((workout) => workout.workout_identity === "controlled_tempo_session");
  assert.ok(rhythmWorkout, "Fixture requires a workout that can prove 10K rhythm safety.");
  rhythmWorkout.workout_identity = "10k_rhythm_intervals";
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
  assert.equal(unsafe10kRhythmResult.ok, false);
  if (unsafe10kRhythmResult.ok) throw new Error("An unsafe 10K rhythm pace compiled.");
  assert.ok(
    unsafe10kRhythmResult.issues.some(
      (issue) => issue.code === "ai_authored_plan_first_10k_rhythm_pace_not_slower_than_recent_5k",
    ),
  );
  assert.ok(
    unsafe10kRhythmResult.issues.some(
      (issue) => issue.code === "ai_authored_plan_first_10k_rhythm_rpe_ceiling_missing",
    ),
  );

  unsafe10kRhythmLeaf.target.command = "5:40-5:55/km";
  unsafe10kRhythmLeaf.cue = "Keep the session controlled at RPE max 8/10.";
  const safe10kRhythmResult = compileAiAuthoredPlanFirstDraft({
    draft: unsafe10kRhythmDraft,
    authoringInput,
  });
  assert.equal(safe10kRhythmResult.ok, true, "A benchmark-safe 10K rhythm session must compile.");

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
  assert.equal(denseQualityResult.ok, false);
  if (denseQualityResult.ok) throw new Error("An over-dense four-day quality week compiled.");
  assert.ok(
    denseQualityResult.issues.some(
      (issue) => issue.code === "ai_authored_plan_first_four_day_week_quality_density_exceeded",
    ),
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
  assert.equal(steepLongRunResult.ok, false);
  if (steepLongRunResult.ok) throw new Error("A steep missing-baseline long-run build compiled.");
  assert.ok(
    steepLongRunResult.issues.some(
      (issue) =>
        issue.code === "ai_authored_plan_first_missing_baseline_long_run_progression_exceeded",
    ),
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
  assert.equal(qualityFinishResult.ok, false);
  if (qualityFinishResult.ok) {
    throw new Error("A missing-baseline long-run quality finish unexpectedly compiled.");
  }
  assert.ok(
    qualityFinishResult.issues.some(
      (issue) =>
        issue.code === "ai_authored_plan_first_missing_baseline_long_run_quality_forbidden",
    ),
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
  assert.equal(steepWeeklyDurationResult.ok, false);
  if (steepWeeklyDurationResult.ok) {
    throw new Error("A steep missing-baseline weekly duration build compiled.");
  }
  assert.ok(
    steepWeeklyDurationResult.issues.some(
      (issue) =>
        issue.code ===
        "ai_authored_plan_first_missing_baseline_weekly_duration_progression_exceeded",
    ),
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
  assert.equal(missingLongRunCutbackResult.ok, false);
  if (missingLongRunCutbackResult.ok) {
    throw new Error("A fourth week without a long-run cutback unexpectedly compiled.");
  }
  assert.ok(
    missingLongRunCutbackResult.issues.some(
      (issue) =>
        issue.code ===
        "ai_authored_plan_first_missing_baseline_fourth_week_long_run_cutback_missing",
    ),
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
  assert.equal(missingWeeklyCutbackResult.ok, false);
  if (missingWeeklyCutbackResult.ok) {
    throw new Error("A fourth week without a total-duration cutback unexpectedly compiled.");
  }
  assert.ok(
    missingWeeklyCutbackResult.issues.some(
      (issue) =>
        issue.code === "ai_authored_plan_first_missing_baseline_fourth_week_cutback_missing",
    ),
  );

  const targetBoundaryInput = {
    ...authoringInput,
    availability: { ...authoringInput.availability, maxRunningDaysPerWeek: null },
    planGoalIntent: {
      ...authoringInput.planGoalIntent,
      targetDate: addDaysIso(authoringInput.schedule.startDate, 13),
    },
  };
  const targetBoundary = await generateFixturePreview(targetBoundaryInput);
  assert.equal(targetBoundary.blueprint.detailedHorizon.targetBoundary, true);
  assert.equal(targetBoundary.blueprint.detailedHorizon.calendarWeekCount, 2);
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

  const evidence = {
    adaptiveBlueprintCompiler: "passed",
    fullTargetBlueprint: true,
    detailedCalendarWeeks: 4,
    targetBoundaryWeeks: targetBoundary.blueprint.detailedHorizon.calendarWeekCount,
    projectionsNonExecutable: true,
    weekdayConflictReviewable: true,
    hardStructuralRejection: true,
    targetTaperBoundary: true,
    tempoBenchmarkSafety: true,
    tenKilometreRhythmBenchmarkSafety: true,
    fourDayWeekQualityDensitySafety: true,
    missingBaselineLongRunProgressionSafety: true,
    missingBaselineWeeklyDurationProgressionSafety: true,
    missingBaselineLongRunQualityFinishSafety: true,
    requestedWeeklyCadencePreserved: true,
    fixedRestProjectionConflictReviewable: true,
    fourthWeekCutbackSafety: true,
    completedResponseRetainedBeforeCompilerOutcome: true,
    providerCalls: 0,
    calendarWrites: 0,
  };
  return evidence;
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
  assert.equal(requestCount, 1, "The source authoring seam must use one server-owned request.");
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error(result.issues.join("\n"));
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
