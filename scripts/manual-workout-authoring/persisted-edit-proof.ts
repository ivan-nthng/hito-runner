import assert from "node:assert/strict";
import type { PersistedPlanCycleRow } from "../../src/lib/active-plan-persistence";
import type { PersistedPlannedWorkoutRow } from "../../src/lib/runner-calendar-persistence";
import {
  confirmManualWorkoutPersistedEditForUser,
  reconstructManualWorkoutPersistedEditDraftForUser,
  reviewManualWorkoutPersistedEditDraftForUser,
  type ManualWorkoutPersistedEditDependencies,
} from "../../src/lib/manual-workout-authoring";
import {
  CALENDAR_WORKOUT_MUTATION_KIND,
  CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
} from "../../src/lib/active-plan-workout-editing/policy";
import { MANUAL_USER_BUILT_PLAN_SOURCE_KIND } from "../../src/lib/manual-workout-authoring/schema";
import { stableJsonEqual } from "../../src/lib/review-token-signing";
import type { Json } from "../../src/lib/supabase/database";
import type {
  WorkoutDocument,
  WorkoutDocumentEditProjection,
} from "../../src/lib/workout-document";
import {
  assertReady,
  buildCanonicalPersistedPlannedWorkoutFromReview,
  buildFakePlanCycle,
  buildFakeWorkoutLog,
} from "./move-proof-fixtures";

const USER_ID = "00000000-0000-4000-8000-000000000801";
const CURRENT_DATE = "2026-06-18";

export async function validateManualPersistedTodayAndFutureWorkoutEditContract() {
  const manualPlan = buildFakePlanCycle({
    userId: USER_ID,
    id: "99999999-9999-4999-8999-000000000801",
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
    startDate: CURRENT_DATE,
    endDate: "2026-06-30",
  });
  const manualReview = assertReady("origin-neutral manual document", {
    templateKey: "easy_aerobic_run",
    workoutDate: CURRENT_DATE,
    title: "Manual current run",
  });
  const manualWorkout = buildCanonicalPersistedPlannedWorkoutFromReview({
    userId: USER_ID,
    planCycleId: manualPlan.id,
    id: "99999999-9999-4999-8999-000000000802",
    review: manualReview,
  });

  const aiPlan = buildFakePlanCycle({
    userId: USER_ID,
    id: "99999999-9999-4999-8999-000000000811",
    sourceKind: "ai_authored_plan_first_v1",
    startDate: CURRENT_DATE,
    endDate: "2026-06-30",
  });
  const aiWorkout = buildRichWorkout({
    id: "99999999-9999-4999-8999-000000000812",
    planCycleId: aiPlan.id,
    date: "2026-06-20",
    sourceWorkoutId: "ai-source-root-1",
    sourceWorkoutType: "controlled_tempo_session",
    title: "AI tempo repeats",
    originKind: "ai",
  });

  const importedPlan = buildFakePlanCycle({
    userId: USER_ID,
    id: "99999999-9999-4999-8999-000000000821",
    sourceKind: "training_plan_v2_import",
    startDate: CURRENT_DATE,
    endDate: "2026-06-30",
  });
  const importedWorkout = buildRichWorkout({
    id: "99999999-9999-4999-8999-000000000822",
    planCycleId: importedPlan.id,
    date: "2026-06-22",
    sourceWorkoutId: "import-source-root-1",
    sourceWorkoutType: "imported_controlled_tempo_session",
    title: "Imported tempo repeats",
    originKind: "file_import",
  });

  for (const [label, plan, workout] of [
    ["manual", manualPlan, manualWorkout],
    ["AI-authored", aiPlan, aiWorkout],
    ["imported", importedPlan, importedWorkout],
  ] as const) {
    await assertOriginNeutralPositive(label, plan, workout);
  }

  await assertRichTargetAndRepeatExactness(aiPlan, aiWorkout);
  await assertReviewAndFailureProtection(manualPlan, manualWorkout);
  await assertProtectedAndMalformedNegatives(manualPlan, manualWorkout);
  await assertRepeatedEditRootProvenance(aiPlan, aiWorkout);
}

async function assertOriginNeutralPositive(
  label: string,
  plan: PersistedPlanCycleRow,
  workout: PersistedPlannedWorkoutRow,
) {
  const dependencies = buildFakeEditDependencies({ plan, workouts: [workout] });
  const reconstructed = await reconstructManualWorkoutPersistedEditDraftForUser(
    USER_ID,
    sourceInput(plan, workout),
    dependencies,
  );
  assert.equal(reconstructed.ok, true, `${label} document should reconstruct`);
  if (!reconstructed.ok) return;

  assert.equal(reconstructed.status, "document_ready");
  assert.equal(reconstructed.provenancePlanId, plan.id);
  assert.equal(reconstructed.safety.strictDocumentVerified, true);
  assert.equal(reconstructed.safety.originNeutral, true);

  const editProjection = {
    ...reconstructed.editProjection,
    title: `${label} title-only edit`,
  } satisfies WorkoutDocumentEditProjection;
  const reviewed = await reviewManualWorkoutPersistedEditDraftForUser(
    USER_ID,
    { ...sourceInput(plan, workout), editProjection },
    dependencies,
  );
  assert.equal(reviewed.ok, true, `${label} document should review`);
  if (!reviewed.ok) return;

  let persistedCandidate: WorkoutDocument | null = null;
  const confirmed = await confirmManualWorkoutPersistedEditForUser(
    USER_ID,
    {
      ...sourceInput(plan, workout),
      editProjection,
      reviewChecksum: reviewed.review.reviewChecksum,
      reviewToken: reviewed.review.reviewToken,
    },
    buildFakeEditDependencies({
      plan,
      workouts: [workout],
      persistWorkoutEdit: async (input) => {
        persistedCandidate = input.candidateDocument;
        return {
          ok: true,
          editedWorkout: workoutRowFromDocument(workout, input.candidateDocument),
          mutationEventId: 1,
        };
      },
    }),
  );
  assert.equal(confirmed.ok, true, `${label} document should confirm`);
  if (!confirmed.ok || !persistedCandidate) return;

  assert.equal(confirmed.sourceMetadata.mutationMode, "workout_document_edit");
  assert.equal(confirmed.safety.updatesSamePlannedWorkoutRow, true);
  assert.equal(persistedCandidate.title, `${label} title-only edit`);
  assertStableWorkoutIdentity(workout, workoutRowFromDocument(workout, persistedCandidate));
}

async function assertRichTargetAndRepeatExactness(
  plan: PersistedPlanCycleRow,
  workout: PersistedPlannedWorkoutRow,
) {
  const before = structuredClone(workout);
  const dependencies = buildFakeEditDependencies({ plan, workouts: [workout] });
  const reconstructed = await reconstructManualWorkoutPersistedEditDraftForUser(
    USER_ID,
    sourceInput(plan, workout),
    dependencies,
  );
  assert.equal(reconstructed.ok, true);
  if (!reconstructed.ok) return;

  const noOpReview = await reviewManualWorkoutPersistedEditDraftForUser(
    USER_ID,
    { ...sourceInput(plan, workout), editProjection: reconstructed.editProjection },
    dependencies,
  );
  assert.equal(noOpReview.ok, true, "a no-op rich document must review losslessly");
  if (!noOpReview.ok) return;
  assert.ok(
    stableJsonEqual(noOpReview.candidateDocument, reconstructed.document),
    "no-op normalized candidate should equal the normalized source document",
  );

  const titleProjection = {
    ...reconstructed.editProjection,
    title: "Rich title-only edit",
  } satisfies WorkoutDocumentEditProjection;
  const titleReview = await reviewManualWorkoutPersistedEditDraftForUser(
    USER_ID,
    { ...sourceInput(plan, workout), editProjection: titleProjection },
    dependencies,
  );
  assert.equal(titleReview.ok, true, "rich target/repeat title edit should review");
  if (!titleReview.ok) return;
  assert.ok(
    stableJsonEqual(titleReview.candidateDocument.steps, reconstructed.document.steps),
    "ordered repeats, child targets, provenance, and arbitrary extras must remain exact",
  );

  const tamperedProjection = structuredClone(reconstructed.editProjection);
  const repeatTarget = readRepeatTarget(tamperedProjection);
  repeatTarget.pace = "3:30/km";
  delete tamperedProjection.steps[1]?.children;
  const tamperedReview = await reviewManualWorkoutPersistedEditDraftForUser(
    USER_ID,
    { ...sourceInput(plan, workout), editProjection: tamperedProjection },
    dependencies,
  );
  assertBlocked(tamperedReview, "client_payload_rejected", "AI target tampering");

  const runnerProjection = structuredClone(reconstructed.editProjection);
  const runnerTarget = readRepeatTarget(runnerProjection);
  runnerTarget.target_source = "runner_entered";
  runnerTarget.pace = "5:05/km";
  delete runnerTarget.hr_target_source;
  delete runnerProjection.steps[1]?.children;
  const runnerReview = await reviewManualWorkoutPersistedEditDraftForUser(
    USER_ID,
    { ...sourceInput(plan, workout), editProjection: runnerProjection },
    dependencies,
  );
  assert.equal(runnerReview.ok, true, "explicit runner target replacement should review");
  assert.ok(stableJsonEqual(workout, before), "review/cancel must not mutate source bytes");
}

async function assertReviewAndFailureProtection(
  plan: PersistedPlanCycleRow,
  workout: PersistedPlannedWorkoutRow,
) {
  const before = structuredClone(workout);
  const dependencies = buildFakeEditDependencies({ plan, workouts: [workout] });
  const reconstructed = await reconstructManualWorkoutPersistedEditDraftForUser(
    USER_ID,
    sourceInput(plan, workout),
    dependencies,
  );
  assert.equal(reconstructed.ok, true);
  if (!reconstructed.ok) return;

  const editProjection = {
    ...reconstructed.editProjection,
    title: "Reviewed title",
  } satisfies WorkoutDocumentEditProjection;
  const reviewed = await reviewManualWorkoutPersistedEditDraftForUser(
    USER_ID,
    { ...sourceInput(plan, workout), editProjection },
    dependencies,
  );
  assert.equal(reviewed.ok, true);
  if (!reviewed.ok) return;

  const invalidToken = await confirmManualWorkoutPersistedEditForUser(
    USER_ID,
    {
      ...sourceInput(plan, workout),
      editProjection,
      reviewChecksum: reviewed.review.reviewChecksum,
      reviewToken: `${reviewed.review.reviewToken.slice(0, -1)}x`,
    },
    dependencies,
  );
  assertBlocked(invalidToken, "invalid_review", "invalid review token");

  const staleProjection = { ...editProjection, title: "Changed after review" };
  const staleReview = await confirmManualWorkoutPersistedEditForUser(
    USER_ID,
    {
      ...sourceInput(plan, workout),
      editProjection: staleProjection,
      reviewChecksum: reviewed.review.reviewChecksum,
      reviewToken: reviewed.review.reviewToken,
    },
    dependencies,
  );
  assertBlocked(staleReview, "stale_review", "stale candidate review");

  const raceRejected = await confirmManualWorkoutPersistedEditForUser(
    USER_ID,
    {
      ...sourceInput(plan, workout),
      editProjection,
      reviewChecksum: reviewed.review.reviewChecksum,
      reviewToken: reviewed.review.reviewToken,
    },
    buildFakeEditDependencies({
      plan,
      workouts: [workout],
      persistWorkoutEdit: async () => ({
        ok: false,
        reason: "protected_day",
        message: "Evidence appeared before commit.",
      }),
    }),
  );
  assertBlocked(raceRejected, "protected_day", "atomic eligibility race");

  const persistenceFailure = await confirmManualWorkoutPersistedEditForUser(
    USER_ID,
    {
      ...sourceInput(plan, workout),
      editProjection,
      reviewChecksum: reviewed.review.reviewChecksum,
      reviewToken: reviewed.review.reviewToken,
    },
    buildFakeEditDependencies({
      plan,
      workouts: [workout],
      persistWorkoutEdit: async () => {
        throw new Error("forced failure");
      },
    }),
  );
  assertBlocked(persistenceFailure, "persistence_failed", "transaction failure");
  assert.ok(stableJsonEqual(workout, before), "all failed paths must leave source bytes unchanged");
}

async function assertProtectedAndMalformedNegatives(
  plan: PersistedPlanCycleRow,
  workout: PersistedPlannedWorkoutRow,
) {
  const past = { ...workout, workout_date: "2026-06-17" };
  assertBlocked(
    await reconstructManualWorkoutPersistedEditDraftForUser(
      USER_ID,
      sourceInput(plan, past),
      buildFakeEditDependencies({ plan, workouts: [past] }),
    ),
    "protected_day",
    "past workout",
  );

  const loggedDependencies = buildFakeEditDependencies({
    plan,
    workouts: [workout],
    logs: new Map([
      [workout.id, buildFakeWorkoutLog({ userId: USER_ID, plannedWorkoutId: workout.id })],
    ]),
  });
  assertBlocked(
    await reconstructManualWorkoutPersistedEditDraftForUser(
      USER_ID,
      sourceInput(plan, workout),
      loggedDependencies,
    ),
    "logged_workout",
    "logged workout",
  );

  assertBlocked(
    await reconstructManualWorkoutPersistedEditDraftForUser(
      USER_ID,
      sourceInput(plan, workout),
      buildFakeEditDependencies({ plan, workouts: [workout], evidence: new Set([workout.id]) }),
    ),
    "evidence_backed_workout",
    "evidence-backed workout",
  );

  const malformed = { ...workout, steps: [{ type: "work" }] as Json };
  assertBlocked(
    await reconstructManualWorkoutPersistedEditDraftForUser(
      USER_ID,
      sourceInput(plan, malformed),
      buildFakeEditDependencies({ plan, workouts: [malformed] }),
    ),
    "source_workout_not_supported",
    "malformed document",
  );

  const rest = {
    ...workout,
    workout_type: "rest" as const,
    workout_family: "rest",
    workout_identity: "rest_and_recovery",
    calendar_icon_key: "rest",
    source_workout_type: "rest",
    steps: [],
  };
  assertBlocked(
    await reconstructManualWorkoutPersistedEditDraftForUser(
      USER_ID,
      sourceInput(plan, rest),
      buildFakeEditDependencies({ plan, workouts: [rest] }),
    ),
    "source_workout_not_supported",
    "Rest document",
  );
}

async function assertRepeatedEditRootProvenance(
  plan: PersistedPlanCycleRow,
  workout: PersistedPlannedWorkoutRow,
) {
  const rootEvent = {
    mutation_source: CALENDAR_WORKOUT_MUTATION_SOURCE_KIND,
    mutation_kind: CALENDAR_WORKOUT_MUTATION_KIND.editWorkout,
    planned_workout_id: workout.id,
    original_plan_source_kind: "training_plan_v2_import",
    original_plan_source_status: "confirmed",
    original_plan_origin_source_kind: "coach_library_v2",
    original_plan_origin_source_status: "accepted",
    original_workout_source_id: "root-workout-id",
    original_workout_source_type: "root-workout-type",
    original_workout_family: "tempo",
    original_workout_identity: "controlled_tempo_session",
  };
  const repeatedPlan = plan;
  const reconstructed = await reconstructManualWorkoutPersistedEditDraftForUser(
    USER_ID,
    sourceInput(repeatedPlan, workout),
    buildFakeEditDependencies({
      plan: repeatedPlan,
      workouts: [workout],
      earliestMutationEvent: { event_payload: rootEvent as Json },
    }),
  );
  assert.equal(reconstructed.ok, true);
  if (!reconstructed.ok) return;

  const reviewed = await reviewManualWorkoutPersistedEditDraftForUser(
    USER_ID,
    { ...sourceInput(repeatedPlan, workout), editProjection: reconstructed.editProjection },
    buildFakeEditDependencies({
      plan: repeatedPlan,
      workouts: [workout],
      earliestMutationEvent: { event_payload: rootEvent as Json },
    }),
  );
  assert.equal(reviewed.ok, true);
  if (!reviewed.ok) return;

  const confirmed = await confirmManualWorkoutPersistedEditForUser(
    USER_ID,
    {
      ...sourceInput(repeatedPlan, workout),
      editProjection: reconstructed.editProjection,
      reviewChecksum: reviewed.review.reviewChecksum,
      reviewToken: reviewed.review.reviewToken,
    },
    buildFakeEditDependencies({
      plan: repeatedPlan,
      workouts: [workout],
      persistWorkoutEdit: async (input) => ({
        ok: true,
        editedWorkout: workoutRowFromDocument(workout, input.candidateDocument),
        mutationEventId: 2,
      }),
      earliestMutationEvent: { event_payload: rootEvent as Json },
    }),
  );
  assert.equal(confirmed.ok, true);
  if (!confirmed.ok) return;
  assert.equal(confirmed.sourceMetadata.originalPlanSourceKind, "training_plan_v2_import");
  assert.equal(confirmed.sourceMetadata.originalPlanOriginSourceKind, "coach_library_v2");
  assert.equal(confirmed.sourceMetadata.originalWorkoutSourceId, "root-workout-id");
  assert.equal(confirmed.sourceMetadata.originalWorkoutSourceType, "root-workout-type");
}

function buildFakeEditDependencies(input: {
  plan: PersistedPlanCycleRow;
  workouts: PersistedPlannedWorkoutRow[];
  logs?: Map<string, ReturnType<typeof buildFakeWorkoutLog>>;
  evidence?: Set<string>;
  earliestMutationEvent?: { event_payload: Json } | null;
  persistWorkoutEdit?: NonNullable<ManualWorkoutPersistedEditDependencies["persistWorkoutEdit"]>;
}): ManualWorkoutPersistedEditDependencies {
  return {
    currentDate: CURRENT_DATE,
    getCalendarWorkoutContextForUser: async () => ({
      sourcePlansById: new Map([[input.plan.id, input.plan]]),
      existingWorkouts: {
        workouts: input.workouts,
        logsByWorkoutId: input.logs ?? new Map(),
      },
    }),
    fetchEvidenceWorkoutIds: async () => input.evidence ?? new Set(),
    getEarliestMutationEventForWorkout: async () => input.earliestMutationEvent ?? null,
    ...(input.persistWorkoutEdit ? { persistWorkoutEdit: input.persistWorkoutEdit } : {}),
  };
}

function sourceInput(plan: PersistedPlanCycleRow, workout: PersistedPlannedWorkoutRow) {
  return {
    provenancePlanId: plan.id,
    plannedWorkoutId: workout.id,
    workoutDate: workout.workout_date,
  };
}

function workoutRowFromDocument(
  source: PersistedPlannedWorkoutRow,
  document: WorkoutDocument,
): PersistedPlannedWorkoutRow {
  return {
    ...source,
    workout_type: document.workoutType,
    workout_family: document.workoutFamily,
    workout_identity: document.workoutIdentity,
    calendar_icon_key: document.calendarIconKey,
    metric_mode: document.metricMode as Json,
    title: document.title,
    notes: document.notes,
    steps: document.steps as unknown as Json,
  };
}

function assertStableWorkoutIdentity(
  source: PersistedPlannedWorkoutRow,
  edited: PersistedPlannedWorkoutRow,
) {
  assert.deepEqual(
    {
      id: edited.id,
      userId: edited.user_id,
      planId: edited.plan_cycle_id,
      date: edited.workout_date,
      weekday: edited.weekday,
      weekNumber: edited.week_number,
      phase: edited.phase,
      displayOrder: edited.display_order,
      sourceWorkoutId: edited.source_workout_id,
      sourceWorkoutType: edited.source_workout_type,
      goalContext: edited.goal_context,
      plannedRpe: edited.planned_rpe,
      estimatedFatigue: edited.estimated_fatigue,
      recoveryPriority: edited.recovery_priority,
    },
    {
      id: source.id,
      userId: source.user_id,
      planId: source.plan_cycle_id,
      date: source.workout_date,
      weekday: source.weekday,
      weekNumber: source.week_number,
      phase: source.phase,
      displayOrder: source.display_order,
      sourceWorkoutId: source.source_workout_id,
      sourceWorkoutType: source.source_workout_type,
      goalContext: source.goal_context,
      plannedRpe: source.planned_rpe,
      estimatedFatigue: source.estimated_fatigue,
      recoveryPriority: source.recovery_priority,
    },
  );
}

function assertBlocked(result: { ok: boolean; reason?: string }, reason: string, label: string) {
  assert.equal(result.ok, false, `${label} should be blocked`);
  if (!result.ok) assert.equal(result.reason, reason, `${label} reason`);
}

function readRepeatTarget(projection: WorkoutDocumentEditProjection) {
  const target = projection.steps[1]?.prescription?.children?.[0]?.target;
  assert.ok(target, "rich repeat target should exist");
  return target;
}

function buildRichWorkout(input: {
  id: string;
  planCycleId: string;
  date: string;
  sourceWorkoutId: string;
  sourceWorkoutType: string;
  title: string;
  originKind: PersistedPlannedWorkoutRow["origin_kind"];
}): PersistedPlannedWorkoutRow {
  return {
    id: input.id,
    user_id: USER_ID,
    plan_cycle_id: input.planCycleId,
    origin_kind: input.originKind,
    workout_date: input.date,
    weekday: "Saturday",
    week_number: 1,
    phase: "Build",
    workout_type: "quality",
    source_workout_id: input.sourceWorkoutId,
    source_workout_type: input.sourceWorkoutType,
    workout_family: "tempo",
    workout_identity: "controlled_tempo_session",
    calendar_icon_key: "tempo",
    goal_context: { goalType: "10k", distanceKm: 10 } as Json,
    metric_mode: null,
    title: input.title,
    notes: "Preserve this note.",
    planned_rpe: 7,
    estimated_fatigue: "moderate",
    recovery_priority: "normal",
    steps: [
      {
        type: "warmup",
        segment_id: "warmup-1",
        segment_type: "warmup",
        label: "Warm up",
        sequence: 1,
        prescription: { mode: "time", duration_min: 10 },
        duration_min: 10,
      },
      {
        type: "intervals",
        segment_id: "tempo-repeat-1",
        segment_type: "interval_block",
        label: "3 x tempo",
        sequence: 2,
        prescription: {
          mode: "repeats",
          repeat_count: 3,
          children: [
            {
              role: "work",
              label: "Tempo work",
              sequence: 1,
              guidance: "Stay controlled.",
              prescription: { mode: "time", duration_min: 8 },
              target: {
                primary_execution_mode: "pace",
                target_source: "ai_authored_plan_guidance",
                pace: "4:50-5:00/km",
                hr_target_source: "effort_only",
                source_note: "Signed coach guidance.",
                extra: { hr_zone: "Z3", target_tier: 2 },
              },
            },
            {
              role: "recover",
              label: "Easy jog",
              sequence: 2,
              prescription: { mode: "distance", distance_km: 0.4 },
              target: {
                primary_execution_mode: "effort",
                target_source: "runner_entered",
                rpe: 2,
                cue: "Relax shoulders.",
              },
            },
            {
              role: "work",
              label: "Tempo close",
              sequence: 3,
              prescription: { mode: "time", duration_min: 4 },
              target: {
                primary_execution_mode: "effort",
                target_source: "runner_entered",
                rpe: 6,
                cadence_spm_range: "170-178",
                hint: "Finish smooth.",
              },
            },
          ],
        },
        repeats: 3,
      },
    ] as unknown as Json,
    display_order: 4,
    created_at: "2026-06-18T00:00:00.000Z",
  };
}
