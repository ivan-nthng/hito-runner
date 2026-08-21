import assert from "node:assert/strict";

import {
  confirmWorkoutCommandForUser,
  createEmptyManualActivePlanForUser,
  deleteManualWorkoutSavedTemplateForUser,
  initializeWorkoutDocumentForUser,
  listManualWorkoutSavedTemplatesForUser,
  reviewWorkoutCommandForUser,
} from "../../src/lib/manual-workout-authoring";
import type { PersistedPlannedWorkoutRow } from "../../src/lib/runner-calendar-persistence";
import type { Json } from "../../src/lib/supabase/database";
import { createAdminSupabaseClient } from "../../src/lib/supabase/server";
import { addDaysIso, todayIso } from "../../src/lib/training";
import { updateRunnerCalendarTimezoneForUserId } from "../../src/lib/user-settings-actions";
import { normalizePersistedWorkoutDocument } from "../../src/lib/workout-document";
import {
  acquireQaPoolSupabaseUser,
  DISPOSABLE_REQUIRE_PERSISTENCE_FLAG,
  readDisposablePersistenceCliOptions,
  releaseQaPoolSupabaseUser,
  resolveDisposablePersistencePreflight,
  type DisposablePersistencePreflight,
  type QaPoolSupabaseCleanupProof,
} from "../lib/qa-pool-persistence-proof";

type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>;
type QaPoolUserLease = Awaited<ReturnType<typeof acquireQaPoolSupabaseUser>>;

const DISPOSABLE_TEST_PASSWORD = "Canonical-Workout-Local-Aa1!";

export const MANUAL_REQUIRE_PERSISTENCE_FLAG = DISPOSABLE_REQUIRE_PERSISTENCE_FLAG;
export type ManualPersistencePreflight = DisposablePersistencePreflight;

export function readManualPersistenceCliOptions(args = process.argv.slice(2)) {
  return readDisposablePersistenceCliOptions(args);
}

export function resolveManualPersistencePreflight(
  options: ReturnType<typeof readManualPersistenceCliOptions>,
): ManualPersistencePreflight {
  return resolveDisposablePersistencePreflight({
    options,
    includeNotRequested: true,
    notRequestedReason:
      "Canonical Workout persistence proof was not requested; default validation remains non-mutating.",
    notRequestedOverrideHint: `Pass ${MANUAL_REQUIRE_PERSISTENCE_FLAG} with local disposable Supabase env to run persistence proof.`,
    envIncompleteReason:
      "Supabase persistence env is incomplete; canonical Workout persistence proof was not attempted.",
    envIncompleteOverrideHint:
      "Start local Supabase and configure the repository-managed local environment before retrying.",
    invalidUrlReason:
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL; persistence proof was not attempted.",
    invalidUrlOverrideHint: "Use the repository-managed local Supabase lifecycle and retry.",
    nonLoopbackBlockedReason:
      "Canonical Workout persistence proof supports only the admitted local Supabase target.",
    nonLoopbackOverrideHint: "Use the repository-managed local Supabase lifecycle and retry.",
  });
}

export async function validateManualWorkoutDisposablePersistenceProof({
  preflight,
}: {
  preflight: Extract<ManualPersistencePreflight, { shouldRun: true }>;
}) {
  const supabase = createAdminSupabaseClient();
  const owner = await acquireQaPoolSupabaseUser({
    supabase,
    poolRole: "provider-engine",
    password: DISPOSABLE_TEST_PASSWORD,
    creationErrorMessage: "Disposable canonical Workout owner acquisition failed.",
  });
  let isolationUser: QaPoolUserLease | null = null;
  let proof: Record<string, unknown> | null = null;
  let cleanup: QaPoolSupabaseCleanupProof | null = null;
  let isolationCleanup: QaPoolSupabaseCleanupProof | null = null;

  try {
    isolationUser = await acquireQaPoolSupabaseUser({
      supabase,
      poolRole: "isolation-b",
      password: DISPOSABLE_TEST_PASSWORD,
      creationErrorMessage: "Disposable canonical Workout isolation user acquisition failed.",
    });
    await updateRunnerCalendarTimezoneForUserId(owner.userId, {
      calendarTimezone: processCalendarTimezone(),
      source: "user",
    });
    const setup = await createEmptyManualActivePlanForUser(owner.userId, {
      age: 36,
      heightCm: 178,
      weightKg: 74,
      runningLevel: "beginner",
    });
    assert.equal(setup.ok, true, JSON.stringify(setup));
    assert.equal((await loadCalendarRows(supabase, owner.userId)).length, 0);
    assert.equal((await loadTemplateRows(supabase, owner.userId)).length, 0);

    const workoutDate = addDaysIso(todayIso(), 1);
    const initializer = await initializeWorkoutDocumentForUser(owner.userId, {
      origin: "built_in",
      templateKey: "easy_aerobic_run",
      workoutDate,
    });
    assert.equal(initializer.ok, true, JSON.stringify(initializer));
    if (!initializer.ok) throw new Error(initializer.message);

    const materializeReview = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "materialize",
      documents: [initializer.document],
      provenanceReferences: [initializer.provenanceReference],
    });
    assert.equal(materializeReview.ok, true, JSON.stringify(materializeReview));
    if (!materializeReview.ok) throw new Error(materializeReview.issues[0]?.message);

    const materialized = await confirmWorkoutCommandForUser(owner.userId, {
      command: materializeReview.candidate.command,
      candidateId: materializeReview.candidate.candidateId,
      reviewToken: materializeReview.candidate.reviewToken,
      reviewChecksum: materializeReview.candidate.reviewChecksum,
    });
    assert.equal(materialized.ok, true, JSON.stringify(materialized));
    if (!materialized.ok) throw new Error(materialized.message);
    const plannedWorkoutId = readPlannedWorkoutId(materialized.result);
    const createdRow = requiredWorkout(
      await loadCalendarRows(supabase, owner.userId),
      plannedWorkoutId,
      "canonical Easy materialization",
    );
    const createdDocument = normalizePersistedWorkoutDocument(createdRow);
    assert.equal(createdDocument.ok, true, JSON.stringify(createdDocument));
    if (!createdDocument.ok) throw new Error(createdDocument.message);
    assert.deepEqual(createdDocument.value.steps, initializer.document.steps);

    const collisionReview = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "materialize",
      documents: [initializer.document],
      provenanceReferences: [initializer.provenanceReference],
    });
    assert.equal(collisionReview.ok, true, JSON.stringify(collisionReview));
    if (!collisionReview.ok) throw new Error(collisionReview.issues[0]?.message);
    const collision = await confirmWorkoutCommandForUser(owner.userId, {
      command: collisionReview.candidate.command,
      candidateId: collisionReview.candidate.candidateId,
      reviewToken: collisionReview.candidate.reviewToken,
      reviewChecksum: collisionReview.candidate.reviewChecksum,
    });
    assert.equal(collision.ok, false, "occupied date must reject atomically");
    assert.equal((await loadCalendarRows(supabase, owner.userId)).length, 1);

    const calendarInitializer = await initializeWorkoutDocumentForUser(owner.userId, {
      origin: "calendar",
      workoutId: plannedWorkoutId,
    });
    assert.equal(calendarInitializer.ok, true, JSON.stringify(calendarInitializer));
    if (!calendarInitializer.ok || calendarInitializer.origin !== "calendar") {
      throw new Error("Calendar initializer did not return authoritative edit truth.");
    }
    const originalRoot = {
      id: createdRow.id,
      planCycleId: createdRow.plan_cycle_id,
      originKind: createdRow.origin_kind,
      sourceWorkoutId: createdRow.source_workout_id,
      sourceWorkoutType: createdRow.source_workout_type,
    };
    const editedDocument = {
      ...calendarInitializer.document,
      title: "Canonical Easy reload",
    };
    const replaceReview = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "replace_document",
      workoutId: plannedWorkoutId,
      document: editedDocument,
      expectedFingerprint: calendarInitializer.expectedFingerprint,
      provenanceReference: calendarInitializer.provenanceReference,
    });
    assert.equal(replaceReview.ok, true, JSON.stringify(replaceReview));
    if (!replaceReview.ok) throw new Error(replaceReview.issues[0]?.message);

    const staleReplace = await confirmWorkoutCommandForUser(owner.userId, {
      command: replaceReview.candidate.command,
      candidateId: `${replaceReview.candidate.candidateId}-stale`,
      reviewToken: replaceReview.candidate.reviewToken,
      reviewChecksum: replaceReview.candidate.reviewChecksum,
    });
    assert.equal(staleReplace.ok, false, "stale candidate identity must reject before mutation");

    const replaced = await confirmWorkoutCommandForUser(owner.userId, {
      command: replaceReview.candidate.command,
      candidateId: replaceReview.candidate.candidateId,
      reviewToken: replaceReview.candidate.reviewToken,
      reviewChecksum: replaceReview.candidate.reviewChecksum,
    });
    assert.equal(replaced.ok, true, JSON.stringify(replaced));
    const replacedRow = requiredWorkout(
      await loadCalendarRows(supabase, owner.userId),
      plannedWorkoutId,
      "canonical same-row edit",
    );
    assert.equal(replacedRow.title, editedDocument.title);
    assert.deepEqual(
      {
        id: replacedRow.id,
        planCycleId: replacedRow.plan_cycle_id,
        originKind: replacedRow.origin_kind,
        sourceWorkoutId: replacedRow.source_workout_id,
        sourceWorkoutType: replacedRow.source_workout_type,
      },
      originalRoot,
      "replace_document must preserve Calendar identity and root provenance",
    );

    const saveReview = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "save_template",
      document: editedDocument,
      displayName: "Canonical Easy source",
      iconKey: editedDocument.calendarIconKey,
      provenanceReference: calendarInitializer.provenanceReference,
    });
    assert.equal(saveReview.ok, true, JSON.stringify(saveReview));
    if (!saveReview.ok) throw new Error(saveReview.issues[0]?.message);
    const saved = await confirmWorkoutCommandForUser(owner.userId, {
      command: saveReview.candidate.command,
      candidateId: saveReview.candidate.candidateId,
      reviewToken: saveReview.candidate.reviewToken,
      reviewChecksum: saveReview.candidate.reviewChecksum,
    });
    assert.equal(saved.ok, true, JSON.stringify(saved));
    if (!saved.ok) throw new Error(saved.message);
    const templateId = readTemplateId(saved.result);
    const templateRow = requiredTemplate(
      await loadTemplateRows(supabase, owner.userId),
      templateId,
    );
    assert.deepEqual(Object.keys(asRecord(templateRow.draft_payload)).sort(), [
      "content",
      "provenance",
      "version",
    ]);

    const catalog = await listManualWorkoutSavedTemplatesForUser(owner.userId);
    assert.equal(catalog.ok, true, JSON.stringify(catalog));
    if (!catalog.ok) throw new Error(catalog.message);
    assert.equal(
      catalog.templates.some((template) => template.id === templateId),
      true,
    );

    const foreignTemplate = await initializeWorkoutDocumentForUser(isolationUser.userId, {
      origin: "saved_template",
      templateId,
      workoutDate: addDaysIso(workoutDate, 6),
    });
    assert.equal(foreignTemplate.ok, false);
    if (!foreignTemplate.ok) assert.equal(foreignTemplate.reason, "not_found");

    const savedDate = addDaysIso(workoutDate, 6);
    const savedInitializer = await initializeWorkoutDocumentForUser(owner.userId, {
      origin: "saved_template",
      templateId,
      workoutDate: savedDate,
    });
    assert.equal(savedInitializer.ok, true, JSON.stringify(savedInitializer));
    if (!savedInitializer.ok) throw new Error(savedInitializer.message);
    assert.deepEqual(savedInitializer.document.steps, editedDocument.steps);

    const savedMaterializeReview = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "materialize",
      documents: [savedInitializer.document],
      provenanceReferences: [savedInitializer.provenanceReference],
    });
    assert.equal(savedMaterializeReview.ok, true, JSON.stringify(savedMaterializeReview));
    if (!savedMaterializeReview.ok) {
      throw new Error(savedMaterializeReview.issues[0]?.message);
    }
    const deleted = await deleteManualWorkoutSavedTemplateForUser(owner.userId, { templateId });
    assert.equal(deleted.ok, true, JSON.stringify(deleted));
    const savedMaterialized = await confirmWorkoutCommandForUser(owner.userId, {
      command: savedMaterializeReview.candidate.command,
      candidateId: savedMaterializeReview.candidate.candidateId,
      reviewToken: savedMaterializeReview.candidate.reviewToken,
      reviewChecksum: savedMaterializeReview.candidate.reviewChecksum,
    });
    assert.equal(savedMaterialized.ok, true, JSON.stringify(savedMaterialized));
    assert.equal(
      (await loadCalendarRows(supabase, owner.userId)).some(
        (workout) => workout.workout_date === savedDate,
      ),
      true,
    );

    const restDate = addDaysIso(workoutDate, 4);
    const restInitializer = await initializeWorkoutDocumentForUser(owner.userId, {
      origin: "built_in",
      templateKey: "rest_day",
      workoutDate: restDate,
    });
    assert.equal(restInitializer.ok, true, JSON.stringify(restInitializer));
    if (!restInitializer.ok) throw new Error(restInitializer.message);
    const restReview = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "materialize",
      documents: [restInitializer.document],
      provenanceReferences: [restInitializer.provenanceReference],
    });
    assert.equal(restReview.ok, true, JSON.stringify(restReview));
    if (!restReview.ok) throw new Error(restReview.issues[0]?.message);
    const restMaterialized = await confirmWorkoutCommandForUser(owner.userId, {
      command: restReview.candidate.command,
      candidateId: restReview.candidate.candidateId,
      reviewToken: restReview.candidate.reviewToken,
      reviewChecksum: restReview.candidate.reviewChecksum,
    });
    assert.equal(restMaterialized.ok, true, JSON.stringify(restMaterialized));
    if (!restMaterialized.ok) throw new Error(restMaterialized.message);
    const restWorkoutId = readPlannedWorkoutId(restMaterialized.result);

    const copyDate = addDaysIso(workoutDate, 2);
    const copyReview = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "copy",
      workoutId: plannedWorkoutId,
      targetDate: copyDate,
    });
    assert.equal(copyReview.ok, true, JSON.stringify(copyReview));
    if (!copyReview.ok) throw new Error(copyReview.issues[0]?.message);
    assert.equal(copyReview.candidate.command.operation, "copy");
    const staleCopyCommand = {
      ...copyReview.candidate.command,
      expectedFingerprint: { stale: true },
    };
    const staleCopy = await confirmWorkoutCommandForUser(owner.userId, {
      command: staleCopyCommand,
      candidateId: copyReview.candidate.candidateId,
      reviewToken: copyReview.candidate.reviewToken,
      reviewChecksum: copyReview.candidate.reviewChecksum,
    });
    assert.equal(staleCopy.ok, false, "stale Copy fingerprints must fail before mutation");
    const copied = await confirmWorkoutCommandForUser(owner.userId, {
      command: copyReview.candidate.command,
      candidateId: copyReview.candidate.candidateId,
      reviewToken: copyReview.candidate.reviewToken,
      reviewChecksum: copyReview.candidate.reviewChecksum,
    });
    assert.equal(copied.ok, true, JSON.stringify(copied));
    if (!copied.ok) throw new Error(copied.message);
    const copiedWorkoutId = readJsonString(copied.result, "targetWorkoutId");
    const copiedBeforeMove = requiredWorkout(
      await loadCalendarRows(supabase, owner.userId),
      copiedWorkoutId,
      "explicit-confirm Copy",
    );
    assert.equal(copiedBeforeMove.workout_date, copyDate);

    const occupiedCopy = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "copy",
      workoutId: plannedWorkoutId,
      targetDate: copyDate,
    });
    assert.equal(occupiedCopy.ok, false, "Copy must reject an occupied target before signing");
    if (!occupiedCopy.ok) assert.equal(occupiedCopy.issues[0]?.code, "calendar_collision");
    const foreignCopy = await reviewWorkoutCommandForUser(isolationUser.userId, {
      operation: "copy",
      workoutId: plannedWorkoutId,
      targetDate: addDaysIso(workoutDate, 3),
    });
    assert.equal(foreignCopy.ok, false, "Copy must not reveal a foreign workout");
    if (!foreignCopy.ok) assert.equal(foreignCopy.issues[0]?.code, "not_found");

    const moveReview = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "move",
      workoutId: copiedWorkoutId,
      targetDate: restDate,
    });
    assert.equal(moveReview.ok, true, JSON.stringify(moveReview));
    if (!moveReview.ok) throw new Error(moveReview.issues[0]?.message);
    assert.equal(moveReview.candidate.command.operation, "move");
    if (moveReview.candidate.command.operation !== "move") {
      throw new Error("Move review returned the wrong command operation.");
    }
    assert.deepEqual(moveReview.candidate.command.targetPolicy, {
      targetDayKind: "rest_day",
      targetReplacementWorkoutId: restWorkoutId,
      restDisplacement: "stored_rest",
    });
    const restBeforeMove = requiredWorkout(
      await loadCalendarRows(supabase, owner.userId),
      restWorkoutId,
      "stored Rest before Move",
    );
    const moved = await confirmWorkoutCommandForUser(owner.userId, {
      command: moveReview.candidate.command,
      candidateId: moveReview.candidate.candidateId,
      reviewToken: moveReview.candidate.reviewToken,
      reviewChecksum: moveReview.candidate.reviewChecksum,
    });
    assert.equal(moved.ok, true, JSON.stringify(moved));
    if (!moved.ok) throw new Error(moved.message);
    const afterMoveRows = await loadCalendarRows(supabase, owner.userId);
    assert.equal(
      requiredWorkout(afterMoveRows, copiedWorkoutId, "explicit-confirm Move").workout_date,
      restDate,
    );
    assert.equal(
      afterMoveRows.some((workout) => workout.workout_date === copyDate),
      false,
      "the source date stays empty until an exact reverse Move restores displaced Rest",
    );
    const moveAudit = await loadLatestMutationEvent(supabase, owner.userId, copiedWorkoutId);
    assert.equal(moveAudit.mutation_kind, "user_moved_workout");
    assert.equal(moveAudit.review_checksum, moveReview.candidate.reviewChecksum);
    assert.ok(moveAudit.undo_expires_at, "Move audit must retain its bounded Undo window");
    assert.ok(moveAudit.displaced_workout, "Move audit must retain the displaced Rest row");

    const undoReview = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "move",
      workoutId: copiedWorkoutId,
      targetDate: copyDate,
    });
    assert.equal(undoReview.ok, true, JSON.stringify(undoReview));
    if (!undoReview.ok) throw new Error(undoReview.issues[0]?.message);
    assert.equal(undoReview.candidate.command.operation, "move");
    if (undoReview.candidate.command.operation !== "move") {
      throw new Error("Undo review returned the wrong command operation.");
    }
    assert.deepEqual(undoReview.candidate.command.targetPolicy, {
      targetDayKind: "rest_day",
      targetReplacementWorkoutId: null,
      restDisplacement: "none",
    });
    const undone = await confirmWorkoutCommandForUser(owner.userId, {
      command: undoReview.candidate.command,
      candidateId: undoReview.candidate.candidateId,
      reviewToken: undoReview.candidate.reviewToken,
      reviewChecksum: undoReview.candidate.reviewChecksum,
    });
    assert.equal(undone.ok, true, JSON.stringify(undone));
    if (!undone.ok) throw new Error(undone.message);
    const afterUndoRows = await loadCalendarRows(supabase, owner.userId);
    assert.deepEqual(
      requiredWorkout(afterUndoRows, copiedWorkoutId, "Undo-restored Move source"),
      copiedBeforeMove,
    );
    assert.deepEqual(
      requiredWorkout(afterUndoRows, restWorkoutId, "Undo-restored displaced Rest"),
      restBeforeMove,
    );

    const deleteCopyDate = addDaysIso(workoutDate, 3);
    const deleteCopyReview = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "copy",
      workoutId: plannedWorkoutId,
      targetDate: deleteCopyDate,
    });
    assert.equal(deleteCopyReview.ok, true, JSON.stringify(deleteCopyReview));
    if (!deleteCopyReview.ok) throw new Error(deleteCopyReview.issues[0]?.message);
    const deleteCopy = await confirmWorkoutCommandForUser(owner.userId, {
      command: deleteCopyReview.candidate.command,
      candidateId: deleteCopyReview.candidate.candidateId,
      reviewToken: deleteCopyReview.candidate.reviewToken,
      reviewChecksum: deleteCopyReview.candidate.reviewChecksum,
    });
    assert.equal(deleteCopy.ok, true, JSON.stringify(deleteCopy));
    if (!deleteCopy.ok) throw new Error(deleteCopy.message);
    const deleteWorkoutId = readJsonString(deleteCopy.result, "targetWorkoutId");
    const deleteReview = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "delete",
      workoutId: deleteWorkoutId,
    });
    assert.equal(deleteReview.ok, true, JSON.stringify(deleteReview));
    if (!deleteReview.ok) throw new Error(deleteReview.issues[0]?.message);
    const deletedWorkout = await confirmWorkoutCommandForUser(owner.userId, {
      command: deleteReview.candidate.command,
      candidateId: deleteReview.candidate.candidateId,
      reviewToken: deleteReview.candidate.reviewToken,
      reviewChecksum: deleteReview.candidate.reviewChecksum,
    });
    assert.equal(deletedWorkout.ok, true, JSON.stringify(deletedWorkout));
    assert.equal(
      (await loadCalendarRows(supabase, owner.userId)).some(
        (workout) => workout.id === deleteWorkoutId,
      ),
      false,
    );

    const clearReview = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "clear",
      workoutDate: savedDate,
    });
    assert.equal(clearReview.ok, true, JSON.stringify(clearReview));
    if (!clearReview.ok) throw new Error(clearReview.issues[0]?.message);
    const cleared = await confirmWorkoutCommandForUser(owner.userId, {
      command: clearReview.candidate.command,
      candidateId: clearReview.candidate.candidateId,
      reviewToken: clearReview.candidate.reviewToken,
      reviewChecksum: clearReview.candidate.reviewChecksum,
    });
    assert.equal(cleared.ok, true, JSON.stringify(cleared));
    assert.equal(
      (await loadCalendarRows(supabase, owner.userId)).some(
        (workout) => workout.workout_date === savedDate,
      ),
      false,
    );

    const malformedTemplateId = crypto.randomUUID();
    const malformedInsert = await supabase.from("runner_manual_workout_templates").insert({
      user_id: owner.userId,
      id: malformedTemplateId,
      display_name: "Malformed canonical source",
      icon_key: templateRow.icon_key,
      template_key: templateRow.template_key,
      template_version: templateRow.template_version,
      source_kind: templateRow.source_kind,
      source_status: templateRow.source_status,
      workout_source_kind: templateRow.workout_source_kind,
      review_payload_version: templateRow.review_payload_version,
      source_review_checksum: templateRow.source_review_checksum,
      source_workout_identity: templateRow.source_workout_identity,
      source_workout_family: templateRow.source_workout_family,
      target_truth_mode: templateRow.target_truth_mode,
      draft_payload: {
        version: "workout_document_content_template_v1",
        content: { malformed: true },
        provenance: null,
      } as Json,
    });
    assert.equal(malformedInsert.error, null, malformedInsert.error?.message);
    const malformed = await initializeWorkoutDocumentForUser(owner.userId, {
      origin: "saved_template",
      templateId: malformedTemplateId,
      workoutDate: addDaysIso(workoutDate, 8),
    });
    assert.equal(malformed.ok, false);
    if (!malformed.ok) assert.equal(malformed.reason, "unsupported_payload");

    const evidence = await insertProtectedWorkoutEvidence(supabase, owner.userId, replacedRow);
    const protectedDelete = await reviewWorkoutCommandForUser(owner.userId, {
      operation: "delete",
      workoutId: plannedWorkoutId,
    });
    assert.equal(protectedDelete.ok, false);
    if (!protectedDelete.ok) assert.equal(protectedDelete.issues[0]?.code, "protected_operation");
    const protectedInitializer = await initializeWorkoutDocumentForUser(owner.userId, {
      origin: "calendar",
      workoutId: plannedWorkoutId,
    });
    assert.equal(protectedInitializer.ok, false);
    if (!protectedInitializer.ok) assert.equal(protectedInitializer.reason, "protected");
    const foreignWorkout = await initializeWorkoutDocumentForUser(isolationUser.userId, {
      origin: "calendar",
      workoutId: plannedWorkoutId,
    });
    assert.equal(foreignWorkout.ok, false);
    if (!foreignWorkout.ok) assert.equal(foreignWorkout.reason, "not_found");
    await assertEvidenceStillPresent(supabase, evidence);

    proof = {
      easyInitializerMaterializeReload: true,
      occupiedDateRejectedAtomically: true,
      staleCandidateRejected: true,
      sameRowEditAndRootProvenance: true,
      canonicalSavedTemplateRoundTrip: true,
      sourceRemovalAfterReviewStable: true,
      malformedTemplateRejected: true,
      ownerIsolation: true,
      fitEvidenceProtection: true,
      explicitConfirmLifecycleCommands: ["copy", "move", "delete", "clear"],
      storedRestDisplacementAndUndoAudit: true,
      callsOpenAi: false,
      finalCalendarRows: (await loadCalendarRows(supabase, owner.userId)).length,
    };
  } finally {
    if (isolationUser) {
      isolationCleanup = await releaseQaPoolSupabaseUser({
        supabase,
        userId: isolationUser.userId,
        poolRole: isolationUser.poolRole,
        leaseToken: isolationUser.leaseToken,
      });
    }
    cleanup = await releaseQaPoolSupabaseUser({
      supabase,
      userId: owner.userId,
      poolRole: owner.poolRole,
      leaseToken: owner.leaseToken,
    });
  }

  assert.ok(proof, "Canonical Workout persistence proof must complete.");
  assert.ok(cleanup, "Owner cleanup proof must be captured.");
  assert.ok(isolationCleanup, "Isolation cleanup proof must be captured.");

  return {
    mode: preflight.mode,
    target: preflight.target,
    persisted: proof,
    cleanup,
    isolationCleanup,
  };
}

async function loadCalendarRows(supabase: AdminSupabaseClient, userId: string) {
  const rows = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("user_id", userId)
    .order("workout_date", { ascending: true });
  if (rows.error) throw new Error(rows.error.message);
  return rows.data;
}

async function loadTemplateRows(supabase: AdminSupabaseClient, userId: string) {
  const rows = await supabase
    .from("runner_manual_workout_templates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (rows.error) throw new Error(rows.error.message);
  return rows.data;
}

function requiredWorkout(
  rows: PersistedPlannedWorkoutRow[],
  workoutId: string,
  label: string,
): PersistedPlannedWorkoutRow {
  const row = rows.find((candidate) => candidate.id === workoutId);
  assert.ok(row, `${label} must retain one planned workout.`);
  return row;
}

function requiredTemplate(rows: Awaited<ReturnType<typeof loadTemplateRows>>, templateId: string) {
  const row = rows.find((candidate) => candidate.id === templateId);
  assert.ok(row, "canonical saved-template row must exist");
  return row;
}

function asRecord(value: Json): Record<string, Json | undefined> {
  assert.ok(value && typeof value === "object" && !Array.isArray(value));
  return value as Record<string, Json | undefined>;
}

function readPlannedWorkoutId(value: Json): string {
  const id = asRecord(value).plannedWorkoutId;
  assert.equal(typeof id, "string");
  return id;
}

function readTemplateId(value: Json): string {
  const id = asRecord(value).templateId;
  assert.equal(typeof id, "string");
  return id;
}

function readJsonString(value: Json, field: string): string {
  const result = asRecord(value)[field];
  assert.equal(typeof result, "string", `${field} must be present in the command receipt`);
  return result;
}

async function loadLatestMutationEvent(
  supabase: AdminSupabaseClient,
  userId: string,
  plannedWorkoutId: string,
) {
  const row = await supabase
    .from("calendar_workout_mutation_events")
    .select("mutation_kind, review_checksum, undo_expires_at, displaced_workout")
    .eq("user_id", userId)
    .eq("planned_workout_id", plannedWorkoutId)
    .order("id", { ascending: false })
    .limit(1)
    .single();
  if (row.error) throw new Error(row.error.message);
  return row.data;
}

async function insertProtectedWorkoutEvidence(
  supabase: AdminSupabaseClient,
  userId: string,
  workout: PersistedPlannedWorkoutRow,
) {
  const workoutLogId = crypto.randomUUID();
  const workoutLog = await supabase
    .from("workout_logs")
    .insert({
      id: workoutLogId,
      user_id: userId,
      planned_workout_id: workout.id,
      outcome: "completed",
      actual_distance_km: 5,
      actual_duration_min: 35,
      rpe: 5,
      notes: "Canonical Workout protection proof",
      intervals_completed: null,
      body_notes: [],
    })
    .select("id")
    .single();
  if (workoutLog.error) throw new Error(workoutLog.error.message);

  const resultAssetId = crypto.randomUUID();
  const resultAsset = await supabase
    .from("workout_result_assets")
    .insert({
      id: resultAssetId,
      user_id: userId,
      planned_workout_id: workout.id,
      workout_log_id: workoutLogId,
      asset_kind: "garmin_fit",
      storage_bucket: "workout-result-assets",
      storage_path: `canonical-workout-proof/${resultAssetId}.fit`,
      original_file_name: "canonical-workout-proof.fit",
      mime_type: "application/octet-stream",
      file_size_bytes: 1,
      parse_status: "uploaded",
      primary_file_kind: "fit",
      primary_file_name: "canonical-workout-proof.fit",
    })
    .select("id")
    .single();
  if (resultAsset.error) throw new Error(resultAsset.error.message);

  return { workoutLogId, resultAssetId };
}

async function assertEvidenceStillPresent(
  supabase: AdminSupabaseClient,
  evidence: { workoutLogId: string; resultAssetId: string },
) {
  const [log, asset] = await Promise.all([
    supabase.from("workout_logs").select("id").eq("id", evidence.workoutLogId).single(),
    supabase.from("workout_result_assets").select("id").eq("id", evidence.resultAssetId).single(),
  ]);
  assert.equal(log.error, null);
  assert.equal(asset.error, null);
}

function processCalendarTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
