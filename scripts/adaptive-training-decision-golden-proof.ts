import assert from "node:assert/strict";
import {
  CONTINUATION_DECISION_CONTRACT_VERSION,
  CONTINUATION_DECISION_POLICY_VERSION,
  decideAdaptiveContinuation,
  type ContinuationDecisionInputV1,
} from "../src/lib/adaptive-training-decision";
import type { RunnerFitnessProfileContinuationProjectionV1 } from "../src/lib/runner-activity/product-contract";
import {
  ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
  buildAdaptiveContinuationAuthoringPrompt,
  compileAdaptiveContinuationProviderResponse,
  type AdaptiveContinuationAuthoringBriefV2,
} from "../src/lib/adaptive-continuation-authoring";
import { compileAiAuthoredPlanFirstDraft } from "../src/lib/ai-authored-plan-first-compiler";
import {
  buildAiGeneratedContinuationDevFixtureProviderResponse,
  buildAiGeneratedRunningPlanDevFixtureProviderDraft,
  buildAiGeneratedRunningPlanQaFixtureAuthoringInput,
} from "../src/lib/ai-generated-running-plan-dev-fixture";

function continuationProjection(
  input: Pick<RunnerFitnessProfileContinuationProjectionV1, "quality" | "comparableGroups"> & {
    missingReasons?: string[];
  },
): RunnerFitnessProfileContinuationProjectionV1 {
  return {
    version: "runner_fitness_profile_continuation_projection_v1",
    snapshotDefinitionVersion: "runner_fitness_profile_snapshot_v1",
    formulaVersions: {
      profile: "runner_fitness_profile_formula_v1",
      runnerActivity: ["runner_fitness_profile_history_v1"],
      sessionRpeLoad: null,
    },
    snapshotId: "1".repeat(64),
    runnerFactsRevision: "2".repeat(64),
    cutoffDate: "2026-07-14",
    profileConstraintsFingerprint: "3".repeat(64),
    calendarOutcomeFingerprint: "4".repeat(64),
    evidenceRevisionFingerprint: "5".repeat(64),
    quality: input.quality,
    constraints: {
      fitnessLevel: null,
      trainingPreferences: null,
      currentGoal: null,
      preferredUnits: null,
      limitationState: null,
      runnerEnteredFacts: {
        source: "runner_profile",
        revision: null,
        lastConfirmedAt: null,
      },
    },
    comparableGroups: input.comparableGroups,
    missingReasons: input.missingReasons ?? [],
  };
}

export function validateAdaptiveTrainingDecisionGoldenProof() {
  const noFitProfile = continuationProjection({
    quality: "partial",
    comparableGroups: [],
    missingReasons: ["evidence_missing"],
  });
  const fitProfile = continuationProjection({
    quality: "available",
    comparableGroups: [
      {
        contextKey: "easy",
        acceptedActualDays: ["2026-07-01", "2026-07-08"],
        compatibleRpeDays: ["2026-07-01", "2026-07-08"],
      },
    ],
  });
  assert.equal(noFitProfile.quality, "partial");
  assert.equal(noFitProfile.comparableGroups.length, 0);
  assert.deepEqual(fitProfile.comparableGroups[0]?.acceptedActualDays, [
    "2026-07-01",
    "2026-07-08",
  ]);
  const incompatibleRpeProfile = continuationProjection({
    quality: "partial",
    comparableGroups: [
      {
        contextKey: "easy",
        acceptedActualDays: ["2026-07-01"],
        compatibleRpeDays: ["2026-07-01"],
      },
      {
        contextKey: "long",
        acceptedActualDays: ["2026-07-08"],
        compatibleRpeDays: [],
      },
    ],
  });
  assert.ok(
    incompatibleRpeProfile.comparableGroups.every(
      (group) => group.acceptedActualDays.length < 2 || group.compatibleRpeDays.length < 2,
    ),
  );

  const base: ContinuationDecisionInputV1 = {
    version: CONTINUATION_DECISION_CONTRACT_VERSION,
    policyVersion: CONTINUATION_DECISION_POLICY_VERSION,
    asOfDate: "2026-07-15",
    blueprint: {
      id: "blueprint-1",
      version: 1,
      sha256: "a".repeat(64),
      selectedTargetDate: "2026-10-18",
    },
    predecessorConfirmation: { id: "confirmation-1", intervalEndDate: "2026-07-19" },
    window: {
      intervalStartDate: "2026-07-20",
      intervalEndDate: "2026-08-16",
      evidenceCutoffDate: "2026-07-14",
      readinessOpensDate: "2026-07-06",
      mode: "normal_four_week",
    },
    continuationInput: {
      id: "input-1",
      revision: 1,
      sha256: "b".repeat(64),
      confirmationId: "confirmation-1",
      goalAssumptionCurrent: true,
      availabilityConfirmed: true,
      manageability: "manageable",
      healthLimitation: "no",
      interruptionStatus: "none",
      clinicianGuidance: "not_applicable",
      activePreferenceCount: 0,
    },
    projections: [
      {
        projectionId: "projection-1",
        date: "2026-07-21",
        phase: "Build",
        workoutFamily: "easy",
        targetAssumption: "Half Marathon",
        reviewTiming: "details_closer_to_date",
      },
    ],
    facts: {
      profileConstraintsFingerprint: "c".repeat(64),
      calendarOutcomeFingerprint: "d".repeat(64),
      evidenceRevisionFingerprint: "e".repeat(64),
      targetIntervalOccupancyFingerprint: "f".repeat(64),
      unresolvedCalendarOutcomeCount: 0,
      fitnessProfile: noFitProfile,
    },
  };
  const blueprintFaithful = decideAdaptiveContinuation(base);
  assert.equal(blueprintFaithful.status, "authoring_ready");
  if (blueprintFaithful.status !== "authoring_ready") throw new Error("Decision was not ready.");
  assert.equal(blueprintFaithful.authoringMode, "blueprint_faithful");
  assert.deepEqual(decideAdaptiveContinuation(base), blueprintFaithful);

  const factShaped = decideAdaptiveContinuation({
    ...base,
    facts: { ...base.facts, fitnessProfile: fitProfile },
  });
  assert.equal(factShaped.status, "authoring_ready");
  if (factShaped.status !== "authoring_ready") throw new Error("Decision was not ready.");
  assert.equal(factShaped.authoringMode, "fact_shaped");
  assert.deepEqual(factShaped.comparableContextKeys, ["easy"]);

  const constraintOnly = decideAdaptiveContinuation({
    ...base,
    continuationInput: { ...base.continuationInput!, activePreferenceCount: 1 },
  });
  assert.equal(constraintOnly.status, "authoring_ready");
  if (constraintOnly.status !== "authoring_ready") throw new Error("Decision was not ready.");
  assert.equal(constraintOnly.authoringMode, "constraint_only");

  const missingCheckIn = decideAdaptiveContinuation({ ...base, continuationInput: null });
  assert.equal(missingCheckIn.status, "no_prescription");
  if (missingCheckIn.status !== "no_prescription")
    throw new Error("Decision was unexpectedly ready.");
  assert.deepEqual(missingCheckIn.reasons, ["check_in_missing"]);

  const stale = decideAdaptiveContinuation({
    ...base,
    continuationInput: { ...base.continuationInput!, confirmationId: "confirmation-stale" },
  });
  assert.equal(stale.status, "no_prescription");
  if (stale.status !== "no_prescription") throw new Error("Decision was unexpectedly ready.");
  assert.ok(stale.reasons.includes("check_in_stale"));

  for (const mode of ["target_taper_boundary", "resolved_interruption_bridge"] as const) {
    const decision = decideAdaptiveContinuation({
      ...base,
      window: { ...base.window!, mode },
    });
    assert.equal(decision.status, "authoring_ready");
    if (decision.status !== "authoring_ready") throw new Error("Decision was not ready.");
    assert.equal(decision.interval.blockMode, mode);
  }

  return validateContinuationAuthoringCompilerModes();
}

function validateSteadyFamilyFidelity(input: {
  authoringInput: Omit<
    ReturnType<typeof buildAiGeneratedRunningPlanQaFixtureAuthoringInput>,
    "requestContext"
  >;
  blueprint: Extract<ReturnType<typeof compileAiAuthoredPlanFirstDraft>, { ok: true }>["blueprint"];
}) {
  const sourceProjections = input.blueprint.projections.slice(0, 2);
  const startDate = sourceProjections[0]?.date;
  const endDate = sourceProjections[1]?.date;
  assert.ok(startDate && endDate);
  const projections = [
    {
      projectionId: "steady-fidelity-easy",
      date: startDate!,
      phase: sourceProjections[0]!.phase,
      workoutFamily: "easy",
      targetAssumption: sourceProjections[0]!.target_assumption,
      reviewTiming: sourceProjections[0]!.review_timing,
    },
    {
      projectionId: "steady-fidelity-steady",
      date: endDate!,
      phase: sourceProjections[1]!.phase,
      workoutFamily: "steady",
      targetAssumption: sourceProjections[1]!.target_assumption,
      reviewTiming: sourceProjections[1]!.review_timing,
    },
  ];
  const brief: AdaptiveContinuationAuthoringBriefV2 = {
    version: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
    decision: {
      version: "continuation_decision_result_v1",
      policyVersion: CONTINUATION_DECISION_POLICY_VERSION,
      status: "authoring_ready",
      authoringMode: "fact_shaped",
      interval: { startDate: startDate!, endDate: endDate!, blockMode: "normal_four_week" },
      projectionIds: projections.map((projection) => projection.projectionId),
      comparableContextKeys: ["easy"],
      progress: {
        quality: "available",
        explicitMissingReasons: [],
        comparableContexts: [
          {
            contextKey: "easy",
            acceptedFitDayCount: 2,
            compatibleRpeDayCount: 2,
            detailChangeEligible: true,
          },
        ],
      },
    },
    blueprint: {
      id: "steady-fidelity-blueprint",
      version: 1,
      sha256: "a".repeat(64),
      selectedTargetDate: input.blueprint.selectedTargetDate,
    },
    predecessorConfirmationId: "steady-fidelity-confirmation",
    projections,
    constraints: {
      profileFingerprint: "b".repeat(64),
      continuationInputFingerprint: "c".repeat(64),
      targetIntervalOccupancyFingerprint: "d".repeat(64),
      calendarOutcomeFingerprint: "e".repeat(64),
      evidenceRevisionFingerprint: "f".repeat(64),
      activePreferenceCount: 0,
      occupiedDates: [],
    },
  };
  const response = buildAiGeneratedContinuationDevFixtureProviderResponse({
    authoringInput: input.authoringInput,
    brief,
  });
  const authored = [...response.detailed_block.workouts, response.detailed_block.final_workout];
  const easy = authored.find((day) => day.workout_identity === "easy_aerobic_run");
  const steady = authored.find((day) => day.workout_identity === "steady_aerobic_run");
  assert.ok(easy && steady);
  assert.notDeepEqual(steady.sections, easy.sections);
  const compiled = compileAdaptiveContinuationProviderResponse({
    response,
    brief,
    blueprint: input.blueprint,
    originalAuthoringInput: input.authoringInput,
  });
  assert.equal(compiled.ok, true, compiled.ok ? "" : compiled.issues[0]?.message);

  const duplicated = structuredClone(response);
  const duplicateSteady = [
    ...duplicated.detailed_block.workouts,
    duplicated.detailed_block.final_workout,
  ].find((day) => day.workout_identity === "steady_aerobic_run");
  const duplicateEasy = [
    ...duplicated.detailed_block.workouts,
    duplicated.detailed_block.final_workout,
  ].find((day) => day.workout_identity === "easy_aerobic_run");
  assert.ok(duplicateSteady && duplicateEasy);
  duplicateSteady.sections = structuredClone(duplicateEasy.sections);
  const rejected = compileAdaptiveContinuationProviderResponse({
    response: duplicated,
    brief,
    blueprint: input.blueprint,
    originalAuthoringInput: input.authoringInput,
  });
  assert.equal(rejected.ok, false);
  if (rejected.ok) throw new Error("A steady command duplicated from easy unexpectedly compiled.");
  assert.ok(
    rejected.issues.some(
      (issue) => issue.code === "adaptive_continuation_steady_aerobic_matches_easy_signature",
    ),
  );
}

function validateContinuationAuthoringCompilerModes() {
  const structuredInput = buildAiGeneratedRunningPlanQaFixtureAuthoringInput("2026-06-15");
  const { requestContext: _requestContext, ...authoringInput } = structuredInput;
  const noPaceAuthoringInput = {
    ...authoringInput,
    runnerFacts: {
      ...authoringInput.runnerFacts,
      benchmark: null,
    },
    planGoalIntent: {
      ...authoringInput.planGoalIntent,
      targetFinishTime: null,
    },
  };
  const initial = compileAiAuthoredPlanFirstDraft({
    draft: buildAiGeneratedRunningPlanDevFixtureProviderDraft(structuredInput),
    authoringInput,
  });
  assert.equal(initial.ok, true);
  if (!initial.ok) throw new Error(initial.issues[0]?.message);
  validateSteadyFamilyFidelity({ authoringInput, blueprint: initial.blueprint });
  const future = initial.blueprint.projections;
  assert.ok(future.length > 0);

  const modeSelections = [
    { mode: "normal_four_week" as const, projections: future.slice(0, 4) },
    { mode: "resolved_interruption_bridge" as const, projections: future.slice(0, 2) },
    {
      mode: "target_taper_boundary" as const,
      projections: future.slice(-8),
    },
  ];
  let reductionMetrics: {
    legacyPromptChars: number;
    compactPromptChars: number;
    removedPromptChars: number;
    projectionCount: number;
  } | null = null;
  for (const selection of modeSelections) {
    const projections = selection.projections.map((projection) => ({
      projectionId: projection.projection_id,
      date: projection.date,
      phase: projection.phase,
      workoutFamily: projection.cadence_or_workout_family,
      targetAssumption: projection.target_assumption,
      reviewTiming: projection.review_timing,
    }));
    const first = projections[0];
    const last = projections.at(-1);
    assert.ok(first && last);
    const brief: AdaptiveContinuationAuthoringBriefV2 = {
      version: ADAPTIVE_CONTINUATION_AUTHORING_BRIEF_VERSION,
      decision: {
        version: "continuation_decision_result_v1",
        policyVersion: CONTINUATION_DECISION_POLICY_VERSION,
        status: "authoring_ready",
        authoringMode: "blueprint_faithful",
        interval: {
          startDate: first!.date,
          endDate: last!.date,
          blockMode: selection.mode,
        },
        projectionIds: projections.map((projection) => projection.projectionId),
        comparableContextKeys: [],
        progress: {
          quality: "partial",
          explicitMissingReasons: ["evidence_missing"],
          comparableContexts: [],
        },
      },
      blueprint: {
        id: "blueprint-golden",
        version: 1,
        sha256: "a".repeat(64),
        selectedTargetDate: initial.blueprint.selectedTargetDate,
      },
      predecessorConfirmationId: "confirmation-golden",
      projections,
      constraints: {
        profileFingerprint: "b".repeat(64),
        continuationInputFingerprint: "c".repeat(64),
        targetIntervalOccupancyFingerprint: "d".repeat(64),
        calendarOutcomeFingerprint: "e".repeat(64),
        evidenceRevisionFingerprint: "f".repeat(64),
        activePreferenceCount: 0,
        occupiedDates: [],
      },
    };
    const prompt = buildAdaptiveContinuationAuthoringPrompt({
      brief,
      originalAuthoringInput: authoringInput,
    });
    const noPaceAuthorityPrompt = buildAdaptiveContinuationAuthoringPrompt({
      brief,
      originalAuthoringInput: noPaceAuthoringInput,
    });
    assert.match(
      noPaceAuthorityPrompt.systemPrompt,
      /neither a factual benchmark nor an explicit target finish time/,
    );
    assert.match(noPaceAuthorityPrompt.systemPrompt, /Do not use primary_execution_mode=pace/);
    assert.match(
      noPaceAuthorityPrompt.systemPrompt,
      /Those fixed recovery children use controlled_short_recovery/,
    );
    assert.match(
      noPaceAuthorityPrompt.systemPrompt,
      /cue exactly to Relaxed controlled recovery; recover fully/,
    );
    const repeatChildCueSchema = (
      noPaceAuthorityPrompt.responseSchema.$defs as {
        repeat_child?: { properties?: { cue?: { type?: string; anyOf?: unknown } } };
      }
    ).repeat_child?.properties?.cue;
    assert.equal(repeatChildCueSchema?.type, "string");
    assert.equal(repeatChildCueSchema?.anyOf, undefined);
    assert.match(noPaceAuthorityPrompt.systemPrompt, /Never use BPM as the primary command/);
    assert.match(
      noPaceAuthorityPrompt.systemPrompt,
      /controlled_tempo_session.*exact full accepted Z4.*exact full accepted Z2/s,
    );
    assert.doesNotMatch(
      prompt.systemPrompt,
      /neither a factual benchmark nor an explicit target finish time/,
    );
    for (const zone of authoringInput.runnerFacts.heartRateProfile.zones) {
      assert.match(
        prompt.systemPrompt,
        new RegExp(`${zone.reference} ${zone.minBpm}-${zone.maxBpm} bpm`),
      );
    }
    const payload = JSON.parse(prompt.userPrompt) as { brief: Record<string, unknown> };
    assert.deepEqual(Object.keys(payload.brief).sort(), [
      "blueprint",
      "constraints",
      "decision",
      "predecessorConfirmationId",
      "projections",
      "version",
    ]);
    for (const forbidden of [
      "acceptedFitDays",
      "compatibleRpeDays",
      "originalAuthoringInput",
      "planned_workouts",
      "providerHistory",
      "requestContext",
      "response_body",
      "workoutDocuments",
    ]) {
      assert.equal(
        prompt.userPrompt.includes(forbidden),
        false,
        `${forbidden} leaked into prompt.`,
      );
    }
    const legacyPromptChars = JSON.stringify({
      contractVersion: "adaptive_continuation_provider_response_v4",
      brief: {
        ...brief,
        decision: {
          ...brief.decision,
          progress: undefined,
          progressProfile: {
            version: "continuation_progress_profile_v1",
            quality: "complete",
            comparableGroups: [
              {
                contextKey: "easy",
                acceptedFitDays: ["2026-07-01", "2026-07-08"],
                compatibleRpeDays: ["2026-07-01", "2026-07-08"],
                detailChangeEligible: true,
              },
            ],
            missingReasons: [],
          },
        },
        facts: {
          calendarOutcomeFingerprint: brief.constraints.calendarOutcomeFingerprint,
          evidenceRevisionFingerprint: brief.constraints.evidenceRevisionFingerprint,
          explicitMissingReasons: [],
          comparableContexts: [
            {
              contextKey: "easy",
              acceptedFitDayCount: 2,
              compatibleRpeDayCount: 2,
              detailChangeEligible: true,
            },
          ],
        },
      },
    }).length;
    assert.ok(prompt.userPrompt.length < legacyPromptChars);
    const response = buildAiGeneratedContinuationDevFixtureProviderResponse({
      authoringInput,
      brief,
    });
    const compiled = compileAdaptiveContinuationProviderResponse({
      response,
      brief,
      blueprint: initial.blueprint,
      originalAuthoringInput: authoringInput,
    });
    assert.equal(compiled.ok, true, compiled.ok ? "" : compiled.issues[0]?.message);
    if (!compiled.ok) throw new Error(compiled.issues[0]?.message);
    assert.deepEqual(
      compiled.workoutDocuments.map((document) => document.workoutDate),
      projections.map((projection) => projection.date),
    );

    if (selection.mode === "normal_four_week") {
      const noPaceResponse = buildAiGeneratedContinuationDevFixtureProviderResponse({
        authoringInput: noPaceAuthoringInput,
        brief,
      });
      const strideSource = buildAiGeneratedRunningPlanDevFixtureProviderDraft({
        ...structuredInput,
        runnerFacts: noPaceAuthoringInput.runnerFacts,
        planGoalIntent: noPaceAuthoringInput.planGoalIntent,
      }).detailed_block.workouts.find(
        (workout) => workout.workout_identity === "easy_run_with_strides",
      );
      const recoveryStrideResponse = structuredClone(noPaceResponse);
      const recoveryStrideWorkout = recoveryStrideResponse.detailed_block.workouts[0];
      assert.ok(strideSource && recoveryStrideWorkout);
      recoveryStrideWorkout.workout_identity = "recovery_jog";
      recoveryStrideWorkout.title = "Recovery with controlled strides";
      recoveryStrideWorkout.sections = structuredClone(strideSource.sections);
      const recoveryBrief = structuredClone(brief);
      recoveryBrief.projections[0]!.workoutFamily = "recovery";
      const recoveryBlueprint = structuredClone(initial.blueprint);
      const recoveryProjection = recoveryBlueprint.projections.find(
        (projection) => projection.date === recoveryStrideWorkout.date,
      );
      assert.ok(recoveryProjection);
      recoveryProjection.cadence_or_workout_family = "recovery";
      const recoveryCompiled = compileAdaptiveContinuationProviderResponse({
        response: recoveryStrideResponse,
        brief: recoveryBrief,
        blueprint: recoveryBlueprint,
        originalAuthoringInput: noPaceAuthoringInput,
      });
      assert.equal(
        recoveryCompiled.ok,
        true,
        recoveryCompiled.ok ? "" : recoveryCompiled.issues[0]?.message,
      );

      const overlongStride = structuredClone(recoveryStrideResponse);
      const overlongStrideSection = overlongStride.detailed_block.workouts[0]?.sections.find(
        (section) => section.kind === "repeat" && section.segment_type === "strides",
      );
      const overlongWork =
        overlongStrideSection?.kind === "repeat"
          ? overlongStrideSection.children.find((child) => child.role === "work")
          : null;
      assert.ok(overlongWork && overlongWork.prescription.mode === "time");
      if (overlongWork.prescription.mode === "time") {
        overlongWork.prescription.duration_min = 0.75;
      }
      const overlongRejected = compileAdaptiveContinuationProviderResponse({
        response: overlongStride,
        brief: recoveryBrief,
        blueprint: recoveryBlueprint,
        originalAuthoringInput: noPaceAuthoringInput,
      });
      assert.equal(overlongRejected.ok, false);
      if (overlongRejected.ok)
        throw new Error("An overlong effort-only stride unexpectedly compiled.");
      assert.ok(
        overlongRejected.issues.some(
          (issue) => issue.code === "ai_authored_plan_first_effort_context_invalid",
        ),
      );
    }

    if (selection.mode === "resolved_interruption_bridge") {
      const unsafeBridge = structuredClone(response);
      const openingWorkout = unsafeBridge.detailed_block.workouts[0];
      const openingTimedUnit = openingWorkout?.sections.find(
        (section) => section.kind === "unit" && section.prescription.mode === "time",
      );
      assert.ok(openingTimedUnit && openingTimedUnit.kind === "unit");
      if (openingTimedUnit.kind === "unit" && openingTimedUnit.prescription.mode === "time") {
        openingTimedUnit.prescription.duration_min = 50;
      }
      const rejectedBridge = compileAdaptiveContinuationProviderResponse({
        response: unsafeBridge,
        brief,
        blueprint: initial.blueprint,
        originalAuthoringInput: authoringInput,
      });
      assert.equal(rejectedBridge.ok, false);
      if (rejectedBridge.ok) throw new Error("An unsafe dense bridge unexpectedly compiled.");
      assert.ok(
        rejectedBridge.issues.some(
          (issue) => issue.code === "adaptive_continuation_bridge_opening_session_too_dense",
        ),
      );
    }

    if (selection.mode === "target_taper_boundary") {
      const distanceIntervalWorkout = response.detailed_block.workouts.find((workout) =>
        ["distance_intervals", "10k_rhythm_intervals"].includes(workout.workout_identity),
      );
      assert.ok(
        distanceIntervalWorkout,
        `Target/taper fixture identities: ${response.detailed_block.workouts.map((workout) => workout.workout_identity).join(",")}`,
      );
      const unprovenEndpoint = structuredClone(response);
      const endpointMain = unprovenEndpoint.detailed_block.final_workout.sections.find(
        (section) => section.kind === "unit" && section.segment_type === "main",
      );
      assert.ok(endpointMain && endpointMain.kind === "unit");
      if (endpointMain.kind === "unit") {
        assert.equal(endpointMain.target.primary_execution_mode, "pace");
        if (endpointMain.target.primary_execution_mode === "pace") {
          endpointMain.target.command = "4:55-5:15/km";
        }
      }
      const rejectedEndpoint = compileAdaptiveContinuationProviderResponse({
        response: unprovenEndpoint,
        brief,
        blueprint: initial.blueprint,
        originalAuthoringInput: authoringInput,
      });
      assert.equal(rejectedEndpoint.ok, false);
      if (rejectedEndpoint.ok) {
        throw new Error("An unproven target-boundary endpoint unexpectedly compiled.");
      }
      assert.ok(
        rejectedEndpoint.issues.some(
          (issue) =>
            issue.code === "adaptive_continuation_target_endpoint_unproven_performance_precision",
        ),
      );
      const repairedEndpoint = compileAdaptiveContinuationProviderResponse({
        response: unprovenEndpoint,
        brief,
        blueprint: initial.blueprint,
        originalAuthoringInput: authoringInput,
        explicitRetainedTargetBoundaryRepair: true,
      });
      assert.equal(
        repairedEndpoint.ok,
        true,
        repairedEndpoint.ok ? "" : repairedEndpoint.issues[0]?.message,
      );
      if (!repairedEndpoint.ok) throw new Error(repairedEndpoint.issues[0]?.message);
      const repairedDocument = repairedEndpoint.workoutDocuments.find(
        (document) => document.workoutIdentity === "selected_distance_completion_or_checkpoint",
      );
      const repairedMain = repairedDocument?.steps.find((step) => step.type === "run");
      assert.equal(repairedMain?.target?.primary_execution_mode, "pace");
      assert.equal(repairedMain?.target?.pace, "5:30-5:45/km");

      const unprovenIntervals = structuredClone(response);
      const unsafeIntervalWorkout = unprovenIntervals.detailed_block.workouts.find(
        (workout) => workout.date === distanceIntervalWorkout.date,
      );
      const unsafeRepeat = unsafeIntervalWorkout?.sections.find(
        (section) => section.kind === "repeat",
      );
      assert.ok(unsafeRepeat && unsafeRepeat.kind === "repeat");
      const unsafeWorkChild = unsafeRepeat.children.find((child) => child.role === "work");
      assert.ok(unsafeWorkChild);
      if (!unsafeWorkChild) throw new Error("The target/taper interval work child is absent.");
      assert.equal(unsafeWorkChild.target.primary_execution_mode, "pace");
      if (unsafeWorkChild.target.primary_execution_mode === "pace") {
        unsafeWorkChild.target.command = "4:40-4:55/km";
      }
      unsafeWorkChild.cue = "Smooth and controlled.";
      const rejectedIntervals = compileAdaptiveContinuationProviderResponse({
        response: unprovenIntervals,
        brief,
        blueprint: initial.blueprint,
        originalAuthoringInput: authoringInput,
      });
      assert.equal(rejectedIntervals.ok, false);
      if (rejectedIntervals.ok) {
        throw new Error("Unproven late-taper intervals unexpectedly compiled.");
      }
      assert.ok(
        rejectedIntervals.issues.some(
          (issue) =>
            issue.code ===
            "adaptive_continuation_target_taper_distance_intervals_unproven_intensity",
        ),
      );
      const repairedIntervals = compileAdaptiveContinuationProviderResponse({
        response: unprovenIntervals,
        brief,
        blueprint: initial.blueprint,
        originalAuthoringInput: authoringInput,
        explicitRetainedTargetBoundaryRepair: true,
      });
      assert.equal(
        repairedIntervals.ok,
        true,
        repairedIntervals.ok ? "" : repairedIntervals.issues[0]?.message,
      );
      if (!repairedIntervals.ok) throw new Error(repairedIntervals.issues[0]?.message);
      const repairedIntervalDocument = repairedIntervals.workoutDocuments.find(
        (document) => document.workoutDate === distanceIntervalWorkout.date,
      );
      const repairedIntervalStep = repairedIntervalDocument?.steps.find(
        (step) => step.type === "intervals",
      );
      assert.ok(repairedIntervalStep && repairedIntervalStep.type === "intervals");
      const repairedWorkChild = repairedIntervalStep.children.find(
        (child) => child.type === "work",
      );
      assert.equal(repairedWorkChild?.target?.pace, "5:30-5:45/km");
      assert.match(repairedWorkChild?.guidance ?? "", /RPE max 8\/10/);
    }

    const wrongFamily = structuredClone(response);
    const firstAuthored = wrongFamily.detailed_block.workouts[0];
    if (firstAuthored) {
      firstAuthored.workout_identity =
        projections[0]?.workoutFamily === "easy" ? "long_aerobic_run" : "easy_aerobic_run";
      const rejected = compileAdaptiveContinuationProviderResponse({
        response: wrongFamily,
        brief,
        blueprint: initial.blueprint,
        originalAuthoringInput: authoringInput,
      });
      assert.equal(rejected.ok, false);
      if (rejected.ok) throw new Error("A changed projection family unexpectedly compiled.");
      assert.ok(
        rejected.issues.some((issue) => issue.code === "adaptive_continuation_family_mismatch"),
      );
    }

    if (selection.mode === "normal_four_week") {
      reductionMetrics = {
        legacyPromptChars,
        compactPromptChars: prompt.userPrompt.length,
        removedPromptChars: legacyPromptChars - prompt.userPrompt.length,
        projectionCount: projections.length,
      };
    }
  }
  if (!reductionMetrics) {
    throw new Error("The deterministic continuation proof did not exercise a normal block.");
  }
  return reductionMetrics;
}
