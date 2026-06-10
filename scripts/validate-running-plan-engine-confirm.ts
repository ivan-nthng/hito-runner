import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildReviewedRunningPlanPreview,
  confirmRunningPlanDraftForUser,
  type RunningPlanPreviewActionInput,
} from "../src/lib/running-plan-engine-actions";
import {
  buildRunningPlanCanonicalPlan,
  validateRunningPlanReviewExactness,
  type RunningPlanPreviewDraft,
  type RunningPlanReviewedPreviewDraft,
} from "../src/lib/running-plan-engine-review";
import {
  HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
  MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
  TEN_K_PLAN_BUILDER_SOURCE_KIND,
} from "../src/lib/plan-creation-engine";
import type { RunningPlanDistanceFamily } from "../src/lib/plan-creation-engine";
import { buildImportedPlanSeed } from "../src/lib/imported-plan";
import type { Database, Json } from "../src/lib/supabase/database";
import { createAdminSupabaseClient } from "../src/lib/supabase/server";

type PersistedPlanCycleRow = Database["public"]["Tables"]["plan_cycles"]["Row"];
type PersistedWorkoutRow = Database["public"]["Tables"]["planned_workouts"]["Row"];
type DisposableCleanupProof = {
  workoutLogsRemaining: 0;
  planCyclesRemaining: 0;
  plannedWorkoutsRemaining: 0;
  runnerProfilesRemaining: 0;
  authUserDeleted: true;
};
type DisposableCleanupProofCountKey = Exclude<keyof DisposableCleanupProof, "authUserDeleted">;
type DisposableTableName = "workout_logs" | "planned_workouts" | "plan_cycles" | "runner_profiles";
type DisposableTableRow<TableName extends DisposableTableName> =
  Database["public"]["Tables"][TableName]["Row"];
type DisposableCleanupSpec<TableName extends DisposableTableName = DisposableTableName> = {
  table: TableName;
  userColumn: Extract<keyof DisposableTableRow<TableName>, string>;
  countColumn: Extract<keyof DisposableTableRow<TableName>, string>;
  proofKey: DisposableCleanupProofCountKey;
};

const REQUIRE_PERSISTENCE_FLAG = "--require-persistence";
const REMOTE_MUTATION_FLAG = "--allow-remote-disposable-supabase-mutation";
const REMOTE_MUTATION_ENV = "HITO_RUNNING_PLAN_CONFIRM_ALLOW_REMOTE_MUTATION";
const REMOTE_MUTATION_ENV_VALUE = "I_UNDERSTAND_THIS_MUTATES_REMOTE_DISPOSABLE_SUPABASE";
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const DISPOSABLE_CLEANUP_SPECS = [
  {
    table: "workout_logs",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "workoutLogsRemaining",
  },
  {
    table: "planned_workouts",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "plannedWorkoutsRemaining",
  },
  {
    table: "plan_cycles",
    userColumn: "user_id",
    countColumn: "id",
    proofKey: "planCyclesRemaining",
  },
  {
    table: "runner_profiles",
    userColumn: "user_id",
    countColumn: "user_id",
    proofKey: "runnerProfilesRemaining",
  },
] as const satisfies readonly [
  DisposableCleanupSpec<"workout_logs">,
  DisposableCleanupSpec<"planned_workouts">,
  DisposableCleanupSpec<"plan_cycles">,
  DisposableCleanupSpec<"runner_profiles">,
];

const baseInput = {
  age: 36,
  heightCm: 178,
  weightKg: 74,
  daysPerWeek: 5,
  fixedRestDays: ["Wednesday", "Saturday"],
  preferredLongRunDay: "Sunday",
  startDate: "2026-06-08",
} as const;

const supportedFixtures: readonly Array<{
  family: RunningPlanDistanceFamily;
  sourceKind:
    | typeof TEN_K_PLAN_BUILDER_SOURCE_KIND
    | typeof HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND
    | typeof MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND;
  runnerLevel: RunningPlanPreviewActionInput["runnerLevel"];
  expectedRows: number;
  expectedNonRestRows: number;
  expectedEndpointMeters: number | null;
  expectedFinalSourceWorkoutType: "final_selected_distance_day" | "marathon_base_endpoint";
}> = [
  {
    family: "10K",
    sourceKind: TEN_K_PLAN_BUILDER_SOURCE_KIND,
    runnerLevel: "sometimes_runs",
    expectedRows: 70,
    expectedNonRestRows: 50,
    expectedEndpointMeters: 10_000,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
  },
  {
    family: "Half Marathon",
    sourceKind: HALF_MARATHON_PLAN_BUILDER_SOURCE_KIND,
    runnerLevel: "runs_a_lot",
    expectedRows: 98,
    expectedNonRestRows: 70,
    expectedEndpointMeters: 21_100,
    expectedFinalSourceWorkoutType: "final_selected_distance_day",
  },
  {
    family: "Marathon Base",
    sourceKind: MARATHON_BASE_PLAN_BUILDER_SOURCE_KIND,
    runnerLevel: "runs_a_lot",
    expectedRows: 112,
    expectedNonRestRows: 80,
    expectedEndpointMeters: null,
    expectedFinalSourceWorkoutType: "marathon_base_endpoint",
  },
] as const;

async function main() {
  const options = readCliOptions();
  const reviewedDrafts = await validateStableReviewContract();
  await validateFailureBoundaries(reviewedDrafts[0]);
  validatePlanPresetConfirmRemainsPreviewOnly();

  const persistencePreflight = resolvePersistencePreflight(options);

  if (!persistencePreflight.shouldRun && options.requirePersistence) {
    throw new Error(formatPersistenceBlocker(persistencePreflight));
  }

  const persistenceResults = persistencePreflight.shouldRun
    ? await validatePersistenceContract(reviewedDrafts, persistencePreflight)
    : buildSkippedPersistenceResult(persistencePreflight);

  console.log("Running plan engine confirm contract checks passed.", {
    stableReviewDrafts: reviewedDrafts.map((draft) => ({
      sourceKind: draft.sourceKind,
      planFamily: draft.planFamily,
      rows: draft.canonicalRowCount,
      nonRestRows: draft.canonicalNonRestRowCount,
      reviewContractVersion: draft.reviewContractVersion,
    })),
    persistence: persistenceResults,
  });
}

async function validateStableReviewContract() {
  const reviewedDrafts: Array<RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>> = [];

  for (const fixture of supportedFixtures) {
    const result = await buildReviewedRunningPlanPreview(buildFixtureInput(fixture));
    assert.equal(result.ok, true, `${fixture.family} preview must be reviewable.`);
    if (!result.ok) {
      throw new Error(result.unavailable.error.message);
    }

    const draft = result.draft;
    const canonicalPlan = buildRunningPlanCanonicalPlan(draft);
    const importedSeed = buildImportedPlanSeed(canonicalPlan);
    const nonRestRows = canonicalPlan.planned_workouts.filter(
      (workout) => workout.workout_type !== "rest",
    );
    const finalNonRestRow = nonRestRows.at(-1);

    assert.equal(draft.sourceKind, fixture.sourceKind);
    assert.equal(draft.source_kind, fixture.sourceKind);
    assert.equal(draft.sourceStatus, "preview_ready");
    assert.equal(draft.persisted, false);
    assert.equal(draft.mutates, false);
    assert.equal(draft.callsOpenAi, false);
    assert.equal(draft.canonicalRowCount, fixture.expectedRows);
    assert.equal(draft.canonicalNonRestRowCount, fixture.expectedNonRestRows);
    assert.equal(canonicalPlan.source_kind, fixture.sourceKind);
    assert.equal(canonicalPlan.planned_workouts.length, fixture.expectedRows);
    assert.equal(nonRestRows.length, fixture.expectedNonRestRows);
    assert.equal(finalNonRestRow?.source_workout_type, fixture.expectedFinalSourceWorkoutType);
    assert.equal(draft.endpointProof.endpointDistanceMeters, fixture.expectedEndpointMeters);
    assert.equal(draft.endpointProof.endpointMainDistanceMeters, fixture.expectedEndpointMeters);
    assert.equal(importedSeed.workouts.length, fixture.expectedRows);
    assert.equal(
      importedSeed.workouts.filter((workout) => workout.workoutType !== "rest").length,
      fixture.expectedNonRestRows,
    );

    validateNoFakePaceOrPersonalHr(canonicalPlan.planned_workouts);
    validateCanonicalRowsAreNumeric(canonicalPlan.planned_workouts);

    const exactness = await validateRunningPlanReviewExactness({
      draft,
      reviewToken: draft.reviewToken,
      reviewChecksum: draft.reviewChecksum,
    });
    assert.equal(exactness.ok, true, `${fixture.family} fresh review token must validate.`);

    reviewedDrafts.push(draft);
  }

  return reviewedDrafts;
}

async function validateFailureBoundaries(
  reviewedDraft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>,
) {
  const changedStartResult = await buildReviewedRunningPlanPreview({
    ...buildFixtureInput({
      family: reviewedDraft.planFamily,
      sourceKind: reviewedDraft.sourceKind as (typeof supportedFixtures)[number]["sourceKind"],
      runnerLevel: reviewedDraft.normalizedInputSummary.runnerLevel,
      expectedRows: reviewedDraft.canonicalRowCount,
      expectedNonRestRows: reviewedDraft.canonicalNonRestRowCount,
      expectedEndpointMeters: reviewedDraft.endpointProof.endpointDistanceMeters,
      expectedFinalSourceWorkoutType:
        reviewedDraft.planFamily === "Marathon Base"
          ? "marathon_base_endpoint"
          : "final_selected_distance_day",
    }),
    startDate: "2026-06-15",
  });
  assert.equal(changedStartResult.ok, true, "Changed-start fixture should still build.");
  if (!changedStartResult.ok) throw new Error(changedStartResult.unavailable.error.message);

  const changedStartExactness = await validateRunningPlanReviewExactness({
    draft: changedStartResult.draft,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
  });
  assert.equal(changedStartExactness.ok, false);
  if (!changedStartExactness.ok) {
    assert.equal(changedStartExactness.reason, "stale_review");
  }

  const changedSetupResult = await buildReviewedRunningPlanPreview({
    ...buildFixtureInput({
      family: reviewedDraft.planFamily,
      sourceKind: reviewedDraft.sourceKind as (typeof supportedFixtures)[number]["sourceKind"],
      runnerLevel: reviewedDraft.normalizedInputSummary.runnerLevel,
      expectedRows: reviewedDraft.canonicalRowCount,
      expectedNonRestRows: reviewedDraft.canonicalNonRestRowCount,
      expectedEndpointMeters: reviewedDraft.endpointProof.endpointDistanceMeters,
      expectedFinalSourceWorkoutType:
        reviewedDraft.planFamily === "Marathon Base"
          ? "marathon_base_endpoint"
          : "final_selected_distance_day",
    }),
    fixedRestDays: ["Tuesday", "Saturday"],
  });
  assert.equal(changedSetupResult.ok, true, "Changed-setup fixture should still build.");
  if (!changedSetupResult.ok) throw new Error(changedSetupResult.unavailable.error.message);

  const changedSetupExactness = await validateRunningPlanReviewExactness({
    draft: changedSetupResult.draft,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
  });
  assert.equal(changedSetupExactness.ok, false);
  if (!changedSetupExactness.ok) {
    assert.equal(changedSetupExactness.reason, "stale_review");
  }

  const invalidTokenExactness = await validateRunningPlanReviewExactness({
    draft: reviewedDraft,
    reviewToken: `${reviewedDraft.reviewToken.slice(0, -1)}0`,
    reviewChecksum: reviewedDraft.reviewChecksum,
  });
  assert.equal(invalidTokenExactness.ok, false);
  if (!invalidTokenExactness.ok) {
    assert.equal(invalidTokenExactness.reason, "invalid_review");
  }

  const mismatchedChecksumExactness = await validateRunningPlanReviewExactness({
    draft: reviewedDraft,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: "0".repeat(64),
  });
  assert.equal(mismatchedChecksumExactness.ok, false);
  if (!mismatchedChecksumExactness.ok) {
    assert.equal(mismatchedChecksumExactness.reason, "stale_review");
  }

  const tamperedRowsDraft = {
    ...reviewedDraft,
    calendarRows: reviewedDraft.calendarRows.map((row, index) =>
      index === 0 ? { ...row, title: `${row.title} tampered` } : row,
    ),
  } satisfies RunningPlanPreviewDraft;
  const tamperedRowsExactness = await validateRunningPlanReviewExactness({
    draft: tamperedRowsDraft,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
  });
  assert.equal(tamperedRowsExactness.ok, false);
  if (!tamperedRowsExactness.ok) {
    assert.equal(tamperedRowsExactness.reason, "stale_review");
  }

  const cardMismatch = await confirmRunningPlanDraftForUser("dry-run-user", {
    previewInput: buildFixtureInput(supportedFixtures[0]),
    planFamily: "Half Marathon",
    sourceKind: TEN_K_PLAN_BUILDER_SOURCE_KIND,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
  });
  assert.equal(cardMismatch.ok, false);
  if (!cardMismatch.ok) {
    assert.equal(cardMismatch.reason, "input_mismatch");
  }

  const clientRowsPayload = await confirmRunningPlanDraftForUser("dry-run-user", {
    previewInput: buildFixtureInput(supportedFixtures[0]),
    planFamily: "10K",
    sourceKind: TEN_K_PLAN_BUILDER_SOURCE_KIND,
    reviewToken: reviewedDraft.reviewToken,
    reviewChecksum: reviewedDraft.reviewChecksum,
    calendarRows: reviewedDraft.calendarRows,
  });
  assert.equal(clientRowsPayload.ok, false);
  if (!clientRowsPayload.ok) {
    assert.equal(clientRowsPayload.reason, "invalid_review");
  }

  const unsupportedPreview = await buildReviewedRunningPlanPreview({
    ...buildFixtureInput({
      ...supportedFixtures[1],
      runnerLevel: "beginner_new_runner",
    }),
  });
  assert.equal(unsupportedPreview.ok, false);
  if (!unsupportedPreview.ok) {
    assert.equal(unsupportedPreview.unavailable.sourceStatus, "preview_unavailable");
    assert.equal(unsupportedPreview.unavailable.persisted, false);
  }
}

function validatePlanPresetConfirmRemainsPreviewOnly() {
  const source = readFileSync("src/lib/plan-preset-actions.ts", "utf8");

  assert.match(
    source,
    /reason:\s*"preview_only"/,
    "Legacy Plan Preset confirm path must remain preview-only while selected running-plan confirm is introduced.",
  );
}

async function validatePersistenceContract(
  reviewedDrafts: readonly RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>[],
  preflight: Extract<PersistencePreflight, { shouldRun: true }>,
) {
  const supabase = createAdminSupabaseClient();
  const persistedFamilies: Array<{
    family: RunningPlanDistanceFamily;
    rows: number;
    sourceKind: string;
    cleanup: DisposableCleanupProof;
  }> = [];

  for (const draft of reviewedDrafts) {
    const userId = await createDisposableUser(supabase, draft.planFamily);
    let familyProof: Omit<(typeof persistedFamilies)[number], "cleanup"> | null = null;
    let cleanupProof: DisposableCleanupProof | null = null;

    try {
      const result = await confirmRunningPlanDraftForUser(userId, {
        previewInput: buildInputFromDraft(draft),
        planFamily: draft.planFamily,
        sourceKind: draft.sourceKind,
        reviewToken: draft.reviewToken,
        reviewChecksum: draft.reviewChecksum,
      });
      assert.equal(result.ok, true, `${draft.planFamily} confirm should persist.`);
      if (!result.ok) throw new Error(result.message);

      const persisted = await loadPersistedPlanForUser(supabase, userId);
      assert.equal(persisted.plan.source_kind, draft.sourceKind);
      assert.equal(persisted.workouts.length, draft.canonicalRowCount);
      assert.equal(
        persisted.workouts.filter((workout) => workout.workout_type !== "rest").length,
        draft.canonicalNonRestRowCount,
      );
      assert.equal(
        (persisted.plan.goal_metadata as { selected_plan_engine?: { source_status?: string } })
          .selected_plan_engine?.source_status,
        "confirmed_selected_plan",
      );
      assert.equal(
        (persisted.plan.goal_metadata as { selected_plan_engine?: { review_checksum?: string } })
          .selected_plan_engine?.review_checksum,
        draft.reviewChecksum,
      );
      validateNoFakePaceOrPersonalHr(persisted.workouts);
      validateNoClientRowsTrusted(persisted.workouts);

      const duplicate = await confirmRunningPlanDraftForUser(userId, {
        previewInput: buildInputFromDraft(draft),
        planFamily: draft.planFamily,
        sourceKind: draft.sourceKind,
        reviewToken: draft.reviewToken,
        reviewChecksum: draft.reviewChecksum,
      });
      assert.equal(duplicate.ok, false);
      if (!duplicate.ok) {
        assert.equal(duplicate.reason, "active_plan_exists");
      }

      familyProof = {
        family: draft.planFamily,
        rows: persisted.workouts.length,
        sourceKind: draft.sourceKind,
      };
    } finally {
      cleanupProof = await cleanupDisposableUser(supabase, userId);
    }

    if (familyProof && cleanupProof) {
      persistedFamilies.push({
        ...familyProof,
        cleanup: cleanupProof,
      });
    }
  }

  return {
    mode: preflight.mode,
    target: preflight.target,
    persistedFamilies,
  };
}

function readCliOptions() {
  const args = new Set(process.argv.slice(2));

  return {
    requirePersistence: args.has(REQUIRE_PERSISTENCE_FLAG),
    allowRemoteDisposableSupabaseMutation:
      args.has(REMOTE_MUTATION_FLAG) &&
      process.env[REMOTE_MUTATION_ENV] === REMOTE_MUTATION_ENV_VALUE,
  };
}

type PersistenceTarget = {
  url: string;
  hostname: string;
  projectRef: string | null;
  isLoopback: boolean;
};

type PersistencePreflight =
  | {
      mode: "no_supabase_env";
      shouldRun: false;
      target: null;
      reason: string;
      overrideHint: string;
    }
  | {
      mode: "remote_supabase_blocked";
      shouldRun: false;
      target: PersistenceTarget;
      reason: string;
      overrideHint: string;
    }
  | {
      mode: "local_disposable_supabase";
      shouldRun: true;
      target: PersistenceTarget;
    }
  | {
      mode: "remote_disposable_supabase_override";
      shouldRun: true;
      target: PersistenceTarget;
    };

function resolvePersistencePreflight(
  options: ReturnType<typeof readCliOptions>,
): PersistencePreflight {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !publishableKey || !serviceKey) {
    return {
      mode: "no_supabase_env",
      shouldRun: false,
      target: null,
      reason:
        "Supabase persistence env is incomplete; non-mutating review exactness checks ran only.",
      overrideHint:
        "Start local Supabase and export NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY, then rerun with --require-persistence.",
    };
  }

  const target = parsePersistenceTarget(url);
  if (!target) {
    return {
      mode: "no_supabase_env",
      shouldRun: false,
      target: null,
      reason: "NEXT_PUBLIC_SUPABASE_URL is not a valid URL; persistence proof was not attempted.",
      overrideHint:
        "Use a valid local Supabase URL such as http://127.0.0.1:54321 and rerun with --require-persistence.",
    };
  }

  if (target.isLoopback) {
    return {
      mode: "local_disposable_supabase",
      shouldRun: true,
      target,
    };
  }

  if (options.allowRemoteDisposableSupabaseMutation) {
    return {
      mode: "remote_disposable_supabase_override",
      shouldRun: true,
      target,
    };
  }

  return {
    mode: "remote_supabase_blocked",
    shouldRun: false,
    target,
    reason:
      "Remote Supabase mutation is blocked by default. This harness only mutates local/disposable targets unless an explicit remote-disposable override is supplied.",
    overrideHint: `Use a local Supabase URL, or set ${REMOTE_MUTATION_ENV}=${REMOTE_MUTATION_ENV_VALUE} and pass ${REMOTE_MUTATION_FLAG} only for an approved disposable remote validation target.`,
  };
}

function parsePersistenceTarget(url: string): PersistenceTarget | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const projectRef = hostname.endsWith(".supabase.co")
      ? hostname.split(".supabase.co")[0] || null
      : null;

    return {
      url: parsed.origin,
      hostname,
      projectRef,
      isLoopback: LOOPBACK_HOSTNAMES.has(hostname),
    };
  } catch {
    return null;
  }
}

function formatPersistenceBlocker(preflight: Extract<PersistencePreflight, { shouldRun: false }>) {
  return [
    `Running-plan confirm persistence proof is blocked: ${preflight.reason}`,
    preflight.target
      ? `Target: ${preflight.target.url} (${preflight.target.projectRef ?? preflight.target.hostname}).`
      : "Target: none.",
    preflight.overrideHint,
  ].join(" ");
}

function buildSkippedPersistenceResult(
  preflight: Extract<PersistencePreflight, { shouldRun: false }>,
) {
  return {
    mode: preflight.mode,
    target: preflight.target,
    reason: preflight.reason,
    overrideHint: preflight.overrideHint,
  };
}

function buildFixtureInput(fixture: {
  family: RunningPlanDistanceFamily;
  runnerLevel: RunningPlanPreviewActionInput["runnerLevel"];
}): RunningPlanPreviewActionInput {
  return {
    ...baseInput,
    runnerLevel: fixture.runnerLevel,
    distanceFamily: fixture.family,
  };
}

function buildInputFromDraft(draft: RunningPlanReviewedPreviewDraft<RunningPlanPreviewDraft>) {
  return {
    age: draft.normalizedInputSummary.age,
    heightCm: draft.normalizedInputSummary.heightCm,
    weightKg: draft.normalizedInputSummary.weightKg,
    runnerLevel: draft.normalizedInputSummary.runnerLevel,
    distanceFamily: draft.normalizedInputSummary.distanceFamily,
    daysPerWeek: draft.normalizedInputSummary.daysPerWeek,
    fixedRestDays: [...draft.normalizedInputSummary.fixedRestDays],
    preferredLongRunDay: draft.normalizedInputSummary.preferredLongRunDay,
    startDate: draft.normalizedInputSummary.startDate,
  } satisfies RunningPlanPreviewActionInput;
}

function validateCanonicalRowsAreNumeric(
  rows: readonly ReturnType<typeof buildRunningPlanCanonicalPlan>["planned_workouts"][number][],
) {
  for (const row of rows) {
    if (row.workout_type === "rest") continue;

    assert.ok(row.segments.length > 0, `${row.workout_id} must have segments.`);
    assert.ok(row.metric_mode, `${row.workout_id} must have metric mode.`);
    assert.equal(row.metric_mode?.executable_mode, "structure_only_executable");
    assert.equal(row.metric_mode?.pace_targets_allowed, false);
    assert.equal(row.metric_mode?.hr_targets_allowed, false);

    for (const segment of row.segments) {
      assert.ok(segment.prescription, `${row.workout_id}.${segment.segment_type} lacks structure.`);
      assert.notEqual(
        segment.prescription?.mode,
        "none",
        `${row.workout_id}.${segment.segment_type} must not be vague/none.`,
      );
    }
  }
}

function validateNoFakePaceOrPersonalHr(rows: readonly unknown[]) {
  const serialized = JSON.stringify(rows);

  assert.doesNotMatch(serialized, /"pace_min_per_km_range"|"pace_range_min_km"|"pace"/i);
  assert.doesNotMatch(
    serialized,
    /personal_hr|personalized_hr|hr_zone_truth|"hr_targets_allowed":true/i,
  );
}

function validateNoClientRowsTrusted(rows: readonly PersistedWorkoutRow[]) {
  for (const row of rows) {
    assert.notEqual(row.title, "client tampered row");
  }
}

async function createDisposableUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  family: RunningPlanDistanceFamily,
) {
  const slug = family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const email = `running-plan-confirm-${slug}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}@example.test`;
  const created = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Disposable user creation failed.");
  }

  return created.data.user.id;
}

async function loadPersistedPlanForUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
) {
  const planResult = await supabase
    .from("plan_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (planResult.error || !planResult.data) {
    throw new Error(planResult.error?.message ?? "Persisted active plan was not found.");
  }

  const workoutsResult = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_cycle_id", planResult.data.id)
    .order("display_order", { ascending: true });

  if (workoutsResult.error || !workoutsResult.data) {
    throw new Error(workoutsResult.error?.message ?? "Persisted workouts were not found.");
  }

  return {
    plan: planResult.data,
    workouts: workoutsResult.data,
  };
}

async function cleanupDisposableUser(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
): Promise<DisposableCleanupProof> {
  for (const spec of DISPOSABLE_CLEANUP_SPECS) {
    await deleteRows(supabase.from(spec.table).delete().eq(spec.userColumn, userId));
  }

  const deleted = await supabase.auth.admin.deleteUser(userId);
  if (deleted.error) {
    throw new Error(deleted.error.message);
  }

  const remainingCounts = new Map<DisposableCleanupProofCountKey, number>(
    await Promise.all(
      DISPOSABLE_CLEANUP_SPECS.map(async (spec) => [
        spec.proofKey,
        await countRowsForUser(supabase, spec, userId),
      ]),
    ),
  );

  return {
    workoutLogsRemaining: assertZeroCleanupCount(
      remainingCounts,
      "workoutLogsRemaining",
      "Disposable workout logs must be cleaned up.",
    ),
    planCyclesRemaining: assertZeroCleanupCount(
      remainingCounts,
      "planCyclesRemaining",
      "Disposable plan cycles must be cleaned up.",
    ),
    plannedWorkoutsRemaining: assertZeroCleanupCount(
      remainingCounts,
      "plannedWorkoutsRemaining",
      "Disposable planned workouts must be cleaned up.",
    ),
    runnerProfilesRemaining: assertZeroCleanupCount(
      remainingCounts,
      "runnerProfilesRemaining",
      "Disposable runner profile must be cleaned up.",
    ),
    authUserDeleted: true,
  };
}

async function countRowsForUser<TableName extends DisposableTableName>(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  spec: DisposableCleanupSpec<TableName>,
  userId: string,
) {
  const result = await supabase
    .from(spec.table)
    .select(spec.countColumn, { count: "exact", head: true })
    .eq(spec.userColumn, userId);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.count ?? 0;
}

function assertZeroCleanupCount(
  counts: ReadonlyMap<DisposableCleanupProofCountKey, number>,
  proofKey: DisposableCleanupProofCountKey,
  message: string,
): 0 {
  const count = counts.get(proofKey) ?? 0;

  assert.equal(count, 0, message);

  return 0;
}

async function deleteRows(
  query: PromiseLike<{
    error: { message: string } | null;
  }>,
) {
  const result = await query;

  if (result.error) {
    throw new Error(result.error.message);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
