import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildExactActivePlanRefreshDraft,
  mutableWorkoutGuardsStillOpen,
  parseActivePlanRefreshDraftPayload,
  rebuildActivePlanRefreshDraftWithRichWorkoutDraft,
} from "../../src/lib/active-plan-refresh-draft";
import type {
  PersistedPlanCycleRow,
  PersistedPlannedWorkoutRow,
} from "../../src/lib/active-plan-persistence";
import {
  generateRichWorkoutDraftForCanonicalPlan,
  buildRichDraftFallbackReason,
} from "../../src/lib/openai-plan-authoring";
import {
  buildPlanScopedStructuredAuthoringMetadata,
  mergePlanPersistenceMetadata,
} from "../../src/lib/plan-authoring-snapshot";
import {
  buildActivePlanRefreshFingerprint,
  buildDeterministicActivePlanRefreshProposal,
  generateActivePlanRefreshProposal,
} from "../../src/lib/plan-refresh-proposal";
import {
  buildDeterministicRichWorkoutFallbackMetadata,
  normalizeRichWorkoutDraftToTrainingPlan,
} from "../../src/lib/rich-workout-draft-authoring";
import type { RunnerCoachContext } from "../../src/lib/runner-coach-context";
import { serverEnv } from "../../src/lib/supabase/env";
import type { StructuredFirstPlanOnboardingRequestInput } from "../../src/lib/structured-first-plan-onboarding";
import type { StructuredPlanAuthoringInput } from "../../src/lib/structured-plan-authoring";
import { addDaysIso, weekdayLong } from "../../src/lib/training";
import type { TrainingPlanV2 } from "../../src/lib/imported-plan";

type RichWorkoutDraftFixture = Parameters<
  typeof normalizeRichWorkoutDraftToTrainingPlan
>[0]["draft"];

export type DoctrineRequestBuilder = (
  goalDistance: StructuredFirstPlanOnboardingRequestInput["goal"]["goalDistance"],
  overrides?: Partial<StructuredFirstPlanOnboardingRequestInput>,
) => StructuredFirstPlanOnboardingRequestInput;

export interface ActivePlanRefreshDoctrineDependencies {
  assertFixedRestDays: (plan: TrainingPlanV2) => void;
  assertMountainTrailDoctrine: (plan: TrainingPlanV2, label: string) => void;
  assertNoRoadRaceSharpening: (plan: TrainingPlanV2, label: string) => void;
  assertNoTaperPeakLongRun: (plan: TrainingPlanV2) => void;
  assertRichWorkoutContract: (plan: TrainingPlanV2, label: string) => void;
  buildAiLikeRichWorkoutDraft: (plan: TrainingPlanV2) => RichWorkoutDraftFixture;
  buildPlan: (input: StructuredFirstPlanOnboardingRequestInput) => {
    authoringInput: StructuredPlanAuthoringInput;
    plan: TrainingPlanV2;
  };
  buildRequest: DoctrineRequestBuilder;
  hasTargetKey: (plan: TrainingPlanV2, key: string) => boolean;
  planWithoutGeneratedTimestamp: (plan: TrainingPlanV2) => Omit<TrainingPlanV2, "created_at">;
  sourceWorkoutTypes: (plan: TrainingPlanV2) => Set<string>;
}

export async function assertActivePlanRefreshRichDraftContracts(
  deps: ActivePlanRefreshDoctrineDependencies,
) {
  assertActivePlanRefreshRichDraftContract(deps);
  assertActivePlanRefreshApplyDoesNotGenerate();
  await assertActivePlanRefreshTimeoutFallbackContract(deps);
}

export function assertActivePlanRefreshDraftReviewContracts(
  deps: ActivePlanRefreshDoctrineDependencies,
) {
  assertActivePlanRefreshDraftReviewMetadata(deps);
  assertActivePlanRefreshStoredAuthoringTruth(deps);
  assertActivePlanRefreshProtectedHistoryGuards();
  assertActivePlanRefreshMountainDoctrine(deps);
}

function assertActivePlanRefreshRichDraftContract({
  assertFixedRestDays,
  assertRichWorkoutContract,
  buildAiLikeRichWorkoutDraft,
  hasTargetKey,
  planWithoutGeneratedTimestamp,
}: ActivePlanRefreshDoctrineDependencies) {
  const context = buildRefreshFixtureContext();
  const currentPlan = buildRefreshFixturePlanRow(context);
  const existingWorkouts = {
    workouts: context.remainingActiveSchedule.map((workout, index) =>
      buildRefreshFixtureWorkoutRow(context, workout, index),
    ),
    logsByWorkoutId: new Map(),
  };
  const proposalOutput = {
    applyContext: { generatedAt: context.generatedAt },
    review: {
      summary:
        "Refresh the remaining marathon block with richer workout structure while keeping protected history fixed.",
      proposedChanges: [
        "Improve future mutable workouts with richer warmup, main, and cooldown guidance.",
      ],
    },
    recommendedAuthoringPrompt:
      "Refresh this as a marathon plan with credible long-run progression, fixed rest days, and no fake HR or pace targets.",
  };
  const deterministicDraft = buildExactActivePlanRefreshDraft({
    context,
    currentPlan,
    existingWorkouts,
    proposalOutput,
    fingerprint: buildActivePlanRefreshFingerprint(context),
    weekdayRestInvariant: context.weekdayRestInvariant,
    evidenceSets: { loggedWorkoutIds: new Set(), evidenceWorkoutIds: new Set() },
  });

  assert.equal(
    deterministicDraft.richWorkoutDraftMetadata.status,
    "not_requested",
    "deterministic refresh draft should report rich draft as not requested by default",
  );

  const normalizedRichDraft = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: deterministicDraft.canonicalPlan,
    draft: buildAiLikeRichWorkoutDraft(deterministicDraft.canonicalPlan),
  });

  assert.equal(
    normalizedRichDraft.ok,
    true,
    "refresh rich draft fixture should normalize against the deterministic refreshed schedule",
  );

  if (normalizedRichDraft.ok) {
    const richRefreshDraft = rebuildActivePlanRefreshDraftWithRichWorkoutDraft({
      draft: deterministicDraft,
      canonicalPlan: normalizedRichDraft.canonicalPlan,
      metadata: normalizedRichDraft.metadata,
    });
    const parsedRichDraft = parseActivePlanRefreshDraftPayload(richRefreshDraft);

    assert.equal(parsedRichDraft.ok, true, "rich refresh draft checksum should verify");
    assert.equal(
      richRefreshDraft.richWorkoutDraftMetadata.status,
      "rich_draft_applied",
      "valid refresh rich draft should expose applied metadata",
    );
    assert.ok(
      richRefreshDraft.canonicalPlan.planned_workouts.some((workout) =>
        /^Coach-shaped /.test(workout.title),
      ),
      "refresh rich draft should persist the normalized rich canonical plan into the reviewed draft",
    );
    assertRichWorkoutContract(richRefreshDraft.canonicalPlan, "rich active-plan refresh draft");
    assertFixedRestDays(richRefreshDraft.canonicalPlan);
    assert.equal(
      hasTargetKey(richRefreshDraft.canonicalPlan, "hr_bpm_range"),
      false,
      "refresh rich draft must not emit HR targets without HR-zone truth",
    );
    assert.equal(
      mutableWorkoutGuardsStillOpen(richRefreshDraft, {
        loggedWorkoutIds: new Set([richRefreshDraft.mutableWorkoutGuards[0]!.workoutId]),
        evidenceWorkoutIds: new Set(),
      }),
      false,
      "rich refresh draft must preserve protected mutable guard stale-blocking",
    );
  }

  const malformedDraft = buildAiLikeRichWorkoutDraft(deterministicDraft.canonicalPlan);
  const firstRunningWorkout = malformedDraft.workouts.find(
    (workout) => workout.workoutFamily !== "rest",
  );

  assert.ok(firstRunningWorkout, "refresh malformed rich draft fixture needs one running workout");
  firstRunningWorkout!.segments = firstRunningWorkout!.segments.filter(
    (segment) => segment.segmentType === "main",
  );

  const malformedResult = normalizeRichWorkoutDraftToTrainingPlan({
    canonicalPlan: deterministicDraft.canonicalPlan,
    draft: malformedDraft,
  });

  assert.equal(
    malformedResult.ok,
    false,
    "malformed refresh rich draft should fail normalization before review",
  );

  if (!malformedResult.ok) {
    const fallbackRefreshDraft = rebuildActivePlanRefreshDraftWithRichWorkoutDraft({
      draft: deterministicDraft,
      canonicalPlan: deterministicDraft.canonicalPlan,
      metadata: buildDeterministicRichWorkoutFallbackMetadata(malformedResult.reason),
    });
    const parsedFallbackDraft = parseActivePlanRefreshDraftPayload(fallbackRefreshDraft);

    assert.equal(parsedFallbackDraft.ok, true, "fallback refresh draft checksum should verify");
    assert.equal(
      fallbackRefreshDraft.richWorkoutDraftMetadata.status,
      "deterministic_fallback",
      "malformed refresh rich draft should fall back detectably",
    );
    assert.deepEqual(
      planWithoutGeneratedTimestamp(fallbackRefreshDraft.canonicalPlan),
      planWithoutGeneratedTimestamp(deterministicDraft.canonicalPlan),
      "malformed refresh rich draft fallback should keep deterministic canonical plan truth",
    );
  }
}

function assertActivePlanRefreshApplyDoesNotGenerate() {
  const source = readFileSync("src/lib/active-plan-refresh-actions.ts", "utf8");
  const applyStart = source.indexOf("export async function applyActivePlanRefreshProposalForUser");
  const applyEnd = source.indexOf("function staleActivePlanRefreshResult", applyStart);
  const applySection = source.slice(applyStart, applyEnd);

  assert.ok(applyStart >= 0 && applyEnd > applyStart, "apply function source should be readable");
  assert.doesNotMatch(
    applySection,
    /generateRichWorkoutDraftForCanonicalPlan|generateActivePlanRefreshProposal|openai-plan-authoring/,
    "active-plan refresh apply must not call OpenAI, regenerate, or reinterpret the reviewed draft",
  );
}

async function assertActivePlanRefreshTimeoutFallbackContract({
  planWithoutGeneratedTimestamp,
}: ActivePlanRefreshDoctrineDependencies) {
  const context = buildRefreshFixtureContext();
  const currentPlan = buildRefreshFixturePlanRow(context);
  const existingWorkouts = {
    workouts: context.remainingActiveSchedule.map((workout, index) =>
      buildRefreshFixtureWorkoutRow(context, workout, index),
    ),
    logsByWorkoutId: new Map(),
  };
  const runnerPrompt = "Refresh the future plan with richer workouts but keep protected history.";
  const originalFetch = globalThis.fetch;
  const originalOpenAiApiKey = serverEnv.openAiApiKey;
  const originalOpenAiPlanModel = serverEnv.openAiPlanModel;

  serverEnv.openAiApiKey = "test-openai-key";
  serverEnv.openAiPlanModel = "test-openai-model";
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const rejectAsAbort = () => {
        const error = new Error("The mocked OpenAI request was aborted.");
        error.name = "AbortError";
        reject(error);
      };

      if (init?.signal?.aborted) {
        rejectAsAbort();
        return;
      }

      init?.signal?.addEventListener("abort", rejectAsAbort, { once: true });
    })) as typeof fetch;

  try {
    let proposalTimedOut = false;
    const proposal = await generateActivePlanRefreshProposal({
      context,
      runnerPrompt,
      timeoutMs: 5,
    }).catch((error: unknown) => {
      assert.equal(
        error instanceof Error && error.name === "AbortError",
        true,
        "mocked proposal timeout should surface as an abort",
      );
      proposalTimedOut = true;

      return buildDeterministicActivePlanRefreshProposal({
        context,
        runnerPrompt,
        fallbackReason: "refresh_proposal_timed_out",
      });
    });

    assert.equal(
      proposalTimedOut,
      true,
      "refresh proposal timeout fixture should exercise deterministic proposal fallback",
    );
    assert.equal(
      proposal.model,
      "deterministic_refresh_fallback",
      "timed-out refresh proposal should return deterministic fallback proposal metadata",
    );

    const deterministicDraft = buildExactActivePlanRefreshDraft({
      context,
      currentPlan,
      existingWorkouts,
      proposalOutput: proposal.output,
      fingerprint: proposal.output.applyContext.fingerprint,
      weekdayRestInvariant: context.weekdayRestInvariant,
      evidenceSets: { loggedWorkoutIds: new Set(), evidenceWorkoutIds: new Set() },
    });
    const proposalFallbackDraft = rebuildActivePlanRefreshDraftWithRichWorkoutDraft({
      draft: deterministicDraft,
      canonicalPlan: deterministicDraft.canonicalPlan,
      metadata: buildDeterministicRichWorkoutFallbackMetadata("refresh_proposal_timed_out"),
    });

    assert.equal(
      parseActivePlanRefreshDraftPayload(proposalFallbackDraft).ok,
      true,
      "timed-out proposal fallback refresh draft checksum should verify",
    );
    assert.equal(
      proposalFallbackDraft.richWorkoutDraftMetadata.status,
      "deterministic_fallback",
      "timed-out proposal should still return bounded rich draft fallback metadata",
    );
    assert.equal(
      proposalFallbackDraft.richWorkoutDraftMetadata.fallbackReason,
      "refresh_proposal_timed_out",
      "timed-out proposal fallback metadata should explain that the proposal step timed out",
    );

    const richTimeoutDraft = await generateRichWorkoutDraftForCanonicalPlan({
      authoringText: runnerPrompt,
      authoringInput: deterministicDraft.authoringSnapshot.authoringInput,
      deterministicPlan: deterministicDraft.canonicalPlan,
      timeoutMs: 5,
    }).catch((error: unknown) =>
      rebuildActivePlanRefreshDraftWithRichWorkoutDraft({
        draft: deterministicDraft,
        canonicalPlan: deterministicDraft.canonicalPlan,
        metadata: buildDeterministicRichWorkoutFallbackMetadata(
          buildRichDraftFallbackReason(error),
        ),
      }),
    );

    assert.equal(
      richTimeoutDraft.richWorkoutDraftMetadata.status,
      "deterministic_fallback",
      "timed-out rich draft should fall back to deterministic refresh draft metadata",
    );
    assert.equal(
      richTimeoutDraft.richWorkoutDraftMetadata.fallbackReason,
      "rich_draft_timed_out",
      "timed-out rich draft fallback metadata should use the bounded timeout reason",
    );
    assert.deepEqual(
      planWithoutGeneratedTimestamp(richTimeoutDraft.canonicalPlan),
      planWithoutGeneratedTimestamp(deterministicDraft.canonicalPlan),
      "timed-out rich draft should keep deterministic canonical refresh truth",
    );
  } finally {
    globalThis.fetch = originalFetch;
    serverEnv.openAiApiKey = originalOpenAiApiKey;
    serverEnv.openAiPlanModel = originalOpenAiPlanModel;
  }
}

function assertActivePlanRefreshDraftReviewMetadata({
  assertFixedRestDays,
  assertNoTaperPeakLongRun,
  hasTargetKey,
  sourceWorkoutTypes,
}: ActivePlanRefreshDoctrineDependencies) {
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
  assert.equal(
    draft.authoringSnapshot.source,
    "reconstructed_active_plan",
    "legacy plans without stored authoring truth should use reconstructed refresh fallback",
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

function assertActivePlanRefreshStoredAuthoringTruth({
  buildPlan,
  buildRequest,
  hasTargetKey,
}: ActivePlanRefreshDoctrineDependencies) {
  const context = buildRefreshFixtureContext();
  const stored = buildPlan(
    buildRequest("half_marathon", {
      goal: {
        goalDistance: "half_marathon",
        goalStyle: "target_time",
        terrainFocus: "standard",
        targetTime: "2:00:00",
        targetDate: "2026-08-23",
      },
      availability: {
        runningDaysPerWeek: 5,
        fixedRestDays: ["Wednesday", "Sunday"],
        preferredLongRunDay: "Saturday",
      },
      execution: { watchAccess: "watch_or_app", guidancePreference: "pace" },
    }),
  );
  const storedMetadata = buildPlanScopedStructuredAuthoringMetadata({
    source: "structured_first_plan",
    authoringInput: stored.authoringInput,
    goalStyle: "target_time",
    targetTime: "2:00:00",
  });
  const currentPlan = {
    ...buildRefreshFixturePlanRow(context),
    goal_metadata: mergePlanPersistenceMetadata(
      buildRefreshFixturePlanRow(context).goal_metadata,
      storedMetadata.goalMetadata,
    ),
    plan_preferences: mergePlanPersistenceMetadata(
      buildRefreshFixturePlanRow(context).plan_preferences,
      storedMetadata.planPreferences,
    ),
  };
  const existingWorkouts = {
    workouts: context.remainingActiveSchedule.map((workout, index) =>
      buildRefreshFixtureWorkoutRow(context, workout, index),
    ),
    logsByWorkoutId: new Map(),
  };
  const draft = buildExactActivePlanRefreshDraft({
    context,
    currentPlan,
    existingWorkouts,
    proposalOutput: {
      applyContext: { generatedAt: context.generatedAt },
      review: {
        summary:
          "Refresh the remaining half-marathon target-time block while preserving saved setup truth.",
        proposedChanges: [
          "Use the saved benchmark and execution mode rather than reconstructing from generic plan text.",
        ],
      },
      recommendedAuthoringPrompt:
        "Refresh this half-marathon target-time plan using the saved structured authoring truth.",
    },
    fingerprint: buildActivePlanRefreshFingerprint(context),
    weekdayRestInvariant: context.weekdayRestInvariant,
    evidenceSets: { loggedWorkoutIds: new Set(), evidenceWorkoutIds: new Set() },
  });

  assert.equal(
    draft.authoringSnapshot.source,
    "stored_authoring_input",
    "refresh should prefer stored structured authoring truth when available",
  );
  assert.equal(
    draft.authoringSnapshot.authoringInput.goal.goalType,
    "half_marathon",
    "stored authoring truth should preserve the original goal family during refresh",
  );
  assert.equal(
    draft.authoringSnapshot.authoringInput.goal.goalStyle,
    "target_time",
    "stored authoring truth should preserve target-time style during refresh",
  );
  assert.equal(
    draft.authoringSnapshot.authoringInput.execution.guidancePreference,
    "pace",
    "stored authoring truth should preserve execution-mode guidance preference",
  );
  assert.equal(
    hasTargetKey(draft.canonicalPlan, "pace_min_per_km_range"),
    true,
    "stored benchmark plus watch/app pace truth should survive into refresh draft pace targets",
  );
}

function assertActivePlanRefreshProtectedHistoryGuards() {
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

function assertActivePlanRefreshMountainDoctrine({
  assertFixedRestDays,
  assertMountainTrailDoctrine,
  assertNoRoadRaceSharpening,
  hasTargetKey,
}: ActivePlanRefreshDoctrineDependencies) {
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
    workout_family: null,
    workout_identity: null,
    calendar_icon_key: null,
    goal_context: null,
    metric_mode: null,
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
