import assert from "node:assert/strict";
import type {
  CalendarWorkoutContext,
  PersistedPlannedWorkoutRow,
  PersistedWorkoutLogRow,
} from "../../src/lib/runner-calendar-persistence";
import type { PersistedPlanCycleRow } from "../../src/lib/active-plan-persistence";
import type { Database } from "../../src/lib/supabase/database";
import type { ManualWorkoutActivePlanAddDependencies } from "../../src/lib/manual-workout-authoring/active-plan-add";
import { buildImportedPlanSeed } from "../../src/lib/imported-plan";
import {
  buildManualWorkoutUserBuiltTrainingPlan,
  reviewManualWorkoutDraft,
  reviewManualWorkoutMoveForUser,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
} from "../../src/lib/manual-workout-authoring";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
} from "../../src/lib/manual-workout-authoring/schema";
import { buildPersistedWorkoutInsertRows } from "../../src/lib/persisted-plan-replacement";
import { formatResult } from "./move-proof-assertions";

export type MoveDependencies = NonNullable<Parameters<typeof reviewManualWorkoutMoveForUser>[2]>;
type CalendarWorkoutMutationEventRow =
  Database["public"]["Tables"]["calendar_workout_mutation_events"]["Row"];
type FakeAddPersistRecord = Parameters<
  NonNullable<ManualWorkoutActivePlanAddDependencies["persistWorkoutAdd"]>
>[0];

export function buildFakeActivePlanMutationDependencyBase(input: {
  activePlan: PersistedPlanCycleRow | null;
  workouts: PersistedPlannedWorkoutRow[];
  logsByWorkoutId?: Map<string, PersistedWorkoutLogRow>;
  evidenceWorkoutIds?: Set<string>;
}) {
  return {
    currentDate: "2026-06-10",
    getCalendarWorkoutContextForUser: async () =>
      ({
        sourcePlansById: input.activePlan
          ? new Map([[input.activePlan.id, input.activePlan]])
          : new Map(),
        existingWorkouts: {
          workouts: input.workouts,
          logsByWorkoutId: input.logsByWorkoutId ?? new Map(),
        },
      }) satisfies CalendarWorkoutContext,
    fetchEvidenceWorkoutIds: async () => input.evidenceWorkoutIds ?? new Set(),
  };
}

export function assertReady(
  label: string,
  input: ManualWorkoutDraftInput,
): Extract<ManualWorkoutDraftReviewResult, { ok: true }> {
  const result = reviewManualWorkoutDraft(input);

  assert.equal(result.ok, true, `${label} should be accepted: ${formatResult(result)}`);
  assert.equal(result.status, "draft_ready");
  assert.equal(result.draft.persisted, false);
  assert.equal(result.reviewToken.startsWith("manual-workout-review-v1."), true);
  assert.equal(result.reviewChecksum.length, 64);

  return result;
}

export function buildOrderedRepeatDraftInput(workoutDate: string): ManualWorkoutDraftInput {
  return {
    templateKey: "controlled_tempo_session",
    workoutDate,
    entries: [
      {
        kind: "block",
        block: { blockKey: "warmup_block", durationSeconds: 12 * 60 },
      },
      {
        kind: "repeat_group",
        group: {
          repeatCount: 4,
          safetyKind: "tempo_repeats",
          groupLabel: "Tempo ladder",
          children: [
            { blockKey: "easy_run_block", durationSeconds: 3 * 60, label: "Settle" },
            {
              blockKey: "tempo_block",
              durationSeconds: 2 * 60,
              label: "Tempo press",
              target: { rpe: 7, cue: "Controlled, not all-out." },
            },
            { blockKey: "interval_recovery_block", durationSeconds: 60, label: "Float" },
          ],
        },
      },
      {
        kind: "block",
        block: { blockKey: "cooldown_block", durationSeconds: 10 * 60 },
      },
    ],
  };
}

export function buildReviewConfirmInput(
  draftInput: unknown,
  review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>,
) {
  return {
    draftInput,
    reviewToken: review.reviewToken,
    reviewChecksum: review.reviewChecksum,
  };
}

export function buildFakeAddDependencies(input: {
  activePlan: PersistedPlanCycleRow | null;
  workouts: PersistedPlannedWorkoutRow[];
  logsByWorkoutId?: Map<string, PersistedWorkoutLogRow>;
  evidenceWorkoutIds?: Set<string>;
  persistError?: Error;
  currentDate?: string;
  plannedWorkoutId?: string;
  onPersist?: (record: {
    workoutSeed: FakeAddPersistRecord["workoutSeed"];
    reviewMetadata: FakeAddPersistRecord["reviewMetadata"];
    copySourceWorkout: PersistedPlannedWorkoutRow | null;
  }) => void;
}): ManualWorkoutActivePlanAddDependencies {
  return {
    ...buildFakeActivePlanMutationDependencyBase(input),
    currentDate: input.currentDate ?? "2026-06-10",
    persistWorkoutAdd: async (record) => {
      if (input.persistError) {
        throw input.persistError;
      }

      input.onPersist?.({
        workoutSeed: record.workoutSeed,
        reviewMetadata: record.reviewMetadata,
        copySourceWorkout: record.copySourceWorkout,
      });

      return {
        plannedWorkout: buildFakePlannedWorkout({
          userId: record.userId,
          planCycleId: record.copySourceWorkout?.plan_cycle_id ?? null,
          originKind: record.copySourceWorkout?.origin_kind ?? "manual",
          id: input.plannedWorkoutId ?? "66666666-6666-4666-8666-666666666666",
          date: record.workoutSeed.workoutDate,
          displayOrder: record.workoutSeed.displayOrder,
          title: record.workoutSeed.title,
          workoutIdentity: record.workoutSeed.workoutIdentity,
        }),
        mutationEvent: buildFakeMutationEvent({
          userId: record.userId,
          plannedWorkoutId: input.plannedWorkoutId ?? "66666666-6666-4666-8666-666666666666",
          mutationKind: record.copySourceWorkout ? "user_copied_workout" : "user_added_workout",
          sourceWorkoutId: record.copySourceWorkout?.id ?? null,
          sourceWorkoutDate: record.copySourceWorkout?.workout_date ?? null,
          targetDate: record.workoutSeed.workoutDate,
          eventPayload: record.reviewMetadata,
        }),
      };
    },
  };
}

export function buildFakeMoveDependencies(input: {
  activePlan: PersistedPlanCycleRow | null;
  workouts: PersistedPlannedWorkoutRow[];
  logsByWorkoutId?: Map<string, PersistedWorkoutLogRow>;
  evidenceWorkoutIds?: Set<string>;
  persistError?: Error;
  now?: () => Date;
  onPersist?: (record: Parameters<NonNullable<MoveDependencies["persistWorkoutMove"]>>[0]) => void;
}): MoveDependencies {
  return {
    currentDate: "2026-06-10",
    getCalendarWorkoutContextForUser: async () =>
      ({
        sourcePlansById: input.activePlan
          ? new Map([[input.activePlan.id, input.activePlan]])
          : new Map(),
        existingWorkouts: {
          workouts: input.workouts,
          logsByWorkoutId: input.logsByWorkoutId ?? new Map(),
        },
      }) satisfies CalendarWorkoutContext,
    fetchEvidenceWorkoutIds: async () => input.evidenceWorkoutIds ?? new Set(),
    persistWorkoutMove: async (record) => {
      if (input.persistError) {
        throw input.persistError;
      }

      input.onPersist?.(record);

      const movedWorkout = {
        ...record.sourceWorkout,
        workout_date: record.review.targetDate,
        weekday: record.review.targetWeekday,
        week_number: record.targetWeekNumber,
      };

      return {
        movedWorkout,
        restoredWorkout: null,
        mutationEvent: buildFakeMutationEvent({
          userId: record.userId,
          plannedWorkoutId: record.sourceWorkout.id,
          mutationKind: "user_moved_workout",
          sourceWorkoutId: record.sourceWorkout.id,
          sourceWorkoutDate: record.sourceWorkout.workout_date,
          targetDate: record.review.targetDate,
          eventPayload: record.review,
        }),
        undoExpiresAt: record.targetReplacementWorkout ? "2026-06-10T00:00:45.000Z" : null,
      };
    },
  };
}

export function buildCanonicalPersistedPlannedWorkoutFromReview({
  userId,
  planCycleId,
  id,
  review,
}: {
  userId: string;
  planCycleId: string;
  id: string;
  review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
}): PersistedPlannedWorkoutRow {
  const canonicalPlan = buildManualWorkoutUserBuiltTrainingPlan(review.draft);
  const importedSeed = buildImportedPlanSeed(canonicalPlan);
  const [insertRow] = buildPersistedWorkoutInsertRows(
    planCycleId,
    userId,
    importedSeed.workouts,
    "manual",
  );

  assert.ok(insertRow, "canonical persisted workout fixture should produce one insert row");

  return {
    id,
    created_at: "2026-06-10T00:00:00.000Z",
    ...insertRow,
  } satisfies PersistedPlannedWorkoutRow;
}

export function buildFakePlanCycle({
  userId,
  id,
  sourceKind,
  startDate,
  endDate,
}: {
  userId: string;
  id: string;
  sourceKind: string | null;
  startDate: string;
  endDate: string;
}): PersistedPlanCycleRow {
  const isManualPlan = sourceKind === MANUAL_USER_BUILT_PLAN_SOURCE_KIND;

  return {
    id,
    user_id: userId,
    status: "archived",
    title: "Manual user-built plan",
    goal_summary: "Manual user-built plan",
    source_template: "training-plan-v2",
    schema_version: "training-plan-v2",
    source_kind: sourceKind,
    start_date: startDate,
    end_date: endDate,
    target_date: null,
    goal_metadata: isManualPlan
      ? {
          manual_user_built_plan: {
            source_kind: sourceKind,
            source_status: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
          },
        }
      : {},
    plan_preferences: isManualPlan
      ? {
          manual_workout_authoring_reviews: [],
        }
      : {},
    created_at: "2026-06-10T00:00:00.000Z",
    updated_at: "2026-06-10T00:00:00.000Z",
  };
}

export function buildFakePlannedWorkoutFromReview({
  userId,
  planCycleId,
  id,
  date,
  displayOrder,
  review,
  weekday,
}: {
  userId: string;
  planCycleId: string;
  id: string;
  date: string;
  displayOrder: number;
  review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
  weekday?: string;
}): PersistedPlannedWorkoutRow {
  return buildFakePlannedWorkout({
    userId,
    planCycleId,
    id,
    date,
    displayOrder,
    title: review.draft.title,
    notes: review.draft.notes,
    weekday: weekday ?? review.draft.weekday,
    workoutType: review.draft.workoutType,
    sourceWorkoutType: review.draft.sourceWorkoutType,
    workoutFamily: review.draft.workoutFamily,
    workoutIdentity: review.draft.workoutIdentity,
    calendarIconKey: review.draft.calendarIconKey,
    metricMode: cloneJson(review.draft.metricMode) as PersistedPlannedWorkoutRow["metric_mode"],
    steps: cloneJson(review.draft.steps) as PersistedPlannedWorkoutRow["steps"],
  });
}

export function buildFakePlannedWorkout({
  userId,
  planCycleId,
  originKind = "manual",
  id,
  date,
  displayOrder,
  title = "Easy aerobic run",
  notes = null,
  weekday = "Tuesday",
  workoutType = "easy",
  sourceWorkoutType = "easy",
  workoutFamily = "easy",
  workoutIdentity = "easy_aerobic_run",
  calendarIconKey = "easy",
  metricMode = null,
  steps = [],
}: {
  userId: string;
  planCycleId: string | null;
  originKind?: PersistedPlannedWorkoutRow["origin_kind"];
  id: string;
  date: string;
  displayOrder: number;
  title?: string;
  notes?: string | null;
  weekday?: string;
  workoutType?: PersistedPlannedWorkoutRow["workout_type"];
  sourceWorkoutType?: string | null;
  workoutFamily?: string | null;
  workoutIdentity?: string | null;
  calendarIconKey?: string | null;
  metricMode?: PersistedPlannedWorkoutRow["metric_mode"];
  steps?: PersistedPlannedWorkoutRow["steps"];
}): PersistedPlannedWorkoutRow {
  return {
    id,
    user_id: userId,
    plan_cycle_id: planCycleId,
    origin_kind: originKind,
    workout_date: date,
    weekday,
    week_number: 1,
    phase: "Manual build",
    workout_type: workoutType,
    source_workout_id: `manual-${date}-easy_aerobic_run`,
    source_workout_type: sourceWorkoutType,
    workout_family: workoutFamily,
    workout_identity: workoutIdentity,
    calendar_icon_key: calendarIconKey,
    goal_context: null,
    metric_mode: metricMode,
    title,
    notes,
    planned_rpe: null,
    estimated_fatigue: null,
    recovery_priority: null,
    steps,
    display_order: displayOrder,
    created_at: "2026-06-10T00:00:00.000Z",
  };
}

function buildFakeMutationEvent(input: {
  userId: string;
  plannedWorkoutId: string;
  mutationKind: CalendarWorkoutMutationEventRow["mutation_kind"];
  sourceWorkoutId: string | null;
  sourceWorkoutDate: string | null;
  targetDate: string;
  eventPayload: unknown;
}): CalendarWorkoutMutationEventRow {
  return {
    id: 1,
    user_id: input.userId,
    mutation_kind: input.mutationKind,
    planned_workout_id: input.plannedWorkoutId,
    source_workout_id: input.sourceWorkoutId,
    target_workout_id: input.plannedWorkoutId,
    source_workout_date: input.sourceWorkoutDate,
    target_date: input.targetDate,
    before_workout: null,
    after_workout: null,
    displaced_workout: null,
    review_payload_version: "fixture_review_v1",
    review_checksum: "a".repeat(64),
    mutation_payload_version: null,
    mutation_checksum: null,
    event_payload:
      input.eventPayload as Database["public"]["Tables"]["calendar_workout_mutation_events"]["Row"]["event_payload"],
    occurred_at: "2026-06-10T00:00:00.000Z",
    undo_expires_at: null,
    undo_of_event_id: null,
    migrated_from_plan_id: null,
    legacy_ordinal: null,
    created_at: "2026-06-10T00:00:00.000Z",
  };
}

export function buildFakeWorkoutLog({
  userId,
  plannedWorkoutId,
}: {
  userId: string;
  plannedWorkoutId: string;
}): PersistedWorkoutLogRow {
  return {
    id: "77777777-7777-4777-8777-777777777777",
    user_id: userId,
    planned_workout_id: plannedWorkoutId,
    outcome: "completed",
    actual_distance_km: 5,
    actual_duration_min: 35,
    rpe: 3,
    notes: null,
    body_notes: null,
    intervals_completed: null,
    logged_at: "2026-06-17T12:00:00.000Z",
    updated_at: "2026-06-17T12:00:00.000Z",
  };
}

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
