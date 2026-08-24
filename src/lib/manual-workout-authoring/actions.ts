import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { executeReviewedSourceWorkoutBatchMaterializationForUser } from "@/lib/active-plan-persistence";
import { addReviewedManualWorkoutToActivePlanForUser } from "@/lib/manual-workout-authoring/active-plan-add";
import {
  MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
  manualEmptyPlanSetupInputSchema,
  MANUAL_EMPTY_PLAN_SETUP_PAYLOAD_VERSION,
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS,
  MANUAL_WORKOUT_TEMPLATE_KEY_VALUES,
  type ManualEmptyPlanCreateFailureReason,
  type ManualEmptyPlanCreateResult,
  type ManualWorkoutTemplateKey,
} from "@/lib/manual-workout-authoring/schema";
import { resolveCurrentManualWorkoutAuthoringUser } from "@/lib/manual-workout-authoring/request-auth";
import {
  createSupabaseSavedTemplateRepository,
  toManualSavedTemplateJson,
  type ManualWorkoutSavedTemplateRepository,
} from "@/lib/manual-workout-authoring/saved-template-repository";
import { getRunnerCalendarDateForUserId } from "@/lib/runner-calendar-context";
import type { WorkoutDocumentPersistedEditDependencies } from "@/lib/manual-workout-authoring/edit-workout";
import {
  getManualWorkoutTemplate,
  type ManualWorkoutTemplate,
} from "@/lib/manual-workout-authoring/templates";
import { saveRunnerBaselineForUserId } from "@/lib/user-settings-actions";
import type { Json } from "@/lib/supabase/database";
import { assertWorkoutDurationTitleContract } from "@/lib/workout-duration-title-contract";
import { stableJsonEqual } from "@/lib/review-token-signing";
import { stepPlannedDistanceKm, weekdayLong } from "@/lib/training";
import { CALENDAR_ICON_KEY_VALUES } from "@/lib/rich-workout-model";
import {
  confirmWorkoutCommand as confirmWorkoutCommandReview,
  reviewWorkoutCommand,
  WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION,
  type ReviewedWorkoutCommandCandidate,
  type WorkoutCommandInput,
  type WorkoutCommandReviewResult,
} from "@/lib/workout-authoring-review";
import {
  normalizeWorkoutDocument,
  normalizeWorkoutDocumentContent,
  workoutDocumentExecutableDurationForSections,
  type WorkoutDocument,
} from "@/lib/workout-document";

export type WorkoutDocumentInitializerResult =
  | {
      ok: true;
      origin: "scratch" | "built_in" | "saved_template";
      document: WorkoutDocument;
      provenanceReference: Json;
      safety: {
        serverOwned: true;
        ownerScoped: true;
        canonicalDocumentOnly: true;
        callsOpenAi: false;
      };
    }
  | {
      ok: true;
      origin: "calendar";
      document: WorkoutDocument;
      expectedFingerprint: Json;
      provenanceReference: Json;
      safety: {
        serverOwned: true;
        ownerScoped: true;
        canonicalDocumentOnly: true;
        sourceWorkoutVerified: true;
        rootProvenanceVerified: true;
        editProtectionVerified: true;
        callsOpenAi: false;
      };
    }
  | {
      ok: false;
      reason:
        | "unauthenticated"
        | "invalid_input"
        | "not_found"
        | "protected"
        | "unsupported_payload"
        | "persistence_failed";
      message: string;
    };

export type WorkoutDocumentInitializerDependencies = {
  savedTemplateRepository?: ManualWorkoutSavedTemplateRepository;
  calendarEditDependencies?: WorkoutDocumentPersistedEditDependencies;
};

export type WorkoutCommandExecutionDependencies = {
  sourceBatchCalendarInstant?: Date;
  adaptiveContinuationAsOfDate?: string;
};

type WorkoutCommandReviewDependencies = {
  adaptiveContinuationAsOfDate?: string;
};

type ManualEmptyPlanCreateDependencies = {
  saveBaselineForUser?: typeof saveRunnerBaselineForUserId;
  currentDate?: string;
};

const workoutCommandSchema = z.discriminatedUnion("operation", [
  z
    .object({
      operation: z.literal("materialize"),
      documents: z.array(z.unknown()).min(1),
      provenanceReferences: z.array(z.unknown()),
    })
    .strict(),
  z
    .object({
      operation: z.literal("replace_document"),
      workoutId: z.string().trim().min(1),
      document: z.unknown(),
      expectedFingerprint: z.unknown(),
      provenanceReference: z.unknown(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("save_template"),
      document: z.unknown(),
      displayName: z.string(),
      iconKey: z.enum(CALENDAR_ICON_KEY_VALUES),
      expectedFingerprint: z.unknown().optional(),
      provenanceReference: z.unknown(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("copy"),
      workoutId: z.string().uuid(),
      targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      expectedFingerprint: z.unknown().optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("move"),
      workoutId: z.string().uuid(),
      targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      targetPolicy: z
        .object({
          targetDayKind: z.enum(["rest_day", "workout_day"]),
          targetReplacementWorkoutId: z.string().uuid().nullable(),
          restDisplacement: z.enum(["none", "stored_rest"]),
        })
        .strict()
        .optional(),
      expectedFingerprints: z
        .object({ source: z.unknown(), target: z.unknown() })
        .strict()
        .optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("delete"),
      workoutId: z.string().uuid(),
      expectedFingerprint: z.unknown().optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("clear"),
      workoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      expectedFingerprint: z.unknown().optional(),
    })
    .strict(),
]);

const workoutCommandConfirmSchema = z
  .object({
    command: workoutCommandSchema,
    candidateId: z.string().trim().min(16),
    reviewToken: z.string().trim().min(16),
    reviewChecksum: z.string().trim().length(64),
  })
  .strict();

const scratchWorkoutDocumentInitializerSchema = z
  .object({
    origin: z.literal("scratch"),
    workoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();
const builtInWorkoutDocumentInitializerSchema = z
  .object({
    origin: z.literal("built_in"),
    templateKey: z.enum(MANUAL_WORKOUT_TEMPLATE_KEY_VALUES),
    workoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();
const savedTemplateWorkoutDocumentInitializerSchema = z
  .object({
    origin: z.literal("saved_template"),
    templateId: z.string().uuid(),
    workoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();
const calendarWorkoutDocumentInitializerSchema = z
  .object({
    origin: z.literal("calendar"),
    workoutId: z.string().uuid(),
  })
  .strict();
const localWorkoutDocumentInitializerSchema = z.discriminatedUnion("origin", [
  scratchWorkoutDocumentInitializerSchema,
  builtInWorkoutDocumentInitializerSchema,
]);
const workoutDocumentInitializerSchema = z.discriminatedUnion("origin", [
  scratchWorkoutDocumentInitializerSchema,
  builtInWorkoutDocumentInitializerSchema,
  savedTemplateWorkoutDocumentInitializerSchema,
  calendarWorkoutDocumentInitializerSchema,
]);

export type WorkoutCommandConfirmationResult =
  | {
      ok: true;
      operation:
        | "materialize"
        | "replace_document"
        | "save_template"
        | "copy"
        | "move"
        | "delete"
        | "clear";
      result: Json;
    }
  | {
      ok: false;
      reason:
        | "unauthenticated"
        | "invalid_input"
        | "invalid_review"
        | "stale_review"
        | "collision"
        | "not_found"
        | "protected"
        | "persistence_failed"
        | "unsupported_operation";
      message: string;
    };

export const reviewWorkoutCommandAction = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<WorkoutCommandReviewResult> => {
    const user = await resolveCurrentManualWorkoutAuthoringUser();
    if (!user.ok) {
      return rejectWorkoutCommand("Sign in before reviewing a Workout command.");
    }
    return reviewWorkoutCommandForUser(user.userId, data);
  });

export const initializeWorkoutDocumentAction = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<WorkoutDocumentInitializerResult> => {
    const user = await resolveCurrentManualWorkoutAuthoringUser();
    if (!user.ok) {
      return {
        ok: false,
        reason: "unauthenticated",
        message: "Sign in before initializing a Workout document.",
      };
    }
    return initializeWorkoutDocumentForUser(user.userId, data);
  });

export function initializeWorkoutDocument(input: unknown): WorkoutDocumentInitializerResult {
  const parsed = localWorkoutDocumentInitializerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "Choose a supported Workout initializer and Calendar date.",
    };
  }

  const templateKey =
    parsed.data.origin === "scratch" ? "easy_aerobic_run" : parsed.data.templateKey;
  const initializer = buildCanonicalBuiltInWorkoutDocument(
    getManualWorkoutTemplate(templateKey),
    parsed.data.workoutDate,
  );
  if (!initializer.ok) {
    return {
      ok: false,
      reason: "invalid_input",
      message: initializer.message,
    };
  }

  return {
    ok: true,
    origin: parsed.data.origin,
    document: initializer.document,
    provenanceReference: {
      initializer: parsed.data.origin,
      sourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      sourceStatus: MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS,
      templateKey,
    },
    safety: {
      serverOwned: true,
      ownerScoped: true,
      canonicalDocumentOnly: true,
      callsOpenAi: false,
    },
  };
}

function buildCanonicalBuiltInWorkoutDocument(
  template: ManualWorkoutTemplate,
  workoutDate: string,
): { ok: true; document: WorkoutDocument } | { ok: false; message: string } {
  const normalized = normalizeWorkoutDocument({
    workoutDate,
    weekday: weekdayLong(workoutDate),
    weekNumber: 1,
    phase: "Manual build",
    sourceWorkoutId: `manual-${workoutDate}-${template.templateKey}`,
    title: template.defaultTitle,
    notes: template.defaultNotes,
    workoutType: template.workoutType,
    sourceWorkoutType: template.templateKey,
    workoutFamily: template.workoutFamily,
    workoutIdentity: template.workoutIdentity,
    calendarIconKey: template.calendarIconKey,
    steps: template.defaultSteps,
    goalContext: {
      goalType: "build_consistency",
      goalStyle: "manual_user_built",
      terrainFocus: "standard",
      targetDate: null,
      targetTime: null,
    },
    plannedRpe: null,
    estimatedFatigue: null,
    recoveryPriority: null,
    displayOrder: 0,
  });
  if (!normalized.ok) {
    return { ok: false, message: normalized.message };
  }

  try {
    assertWorkoutDurationTitleContract([
      { title: normalized.value.title, segments: normalized.value.steps },
    ]);
  } catch {
    return {
      ok: false,
      message: "The built-in Workout initializer violates the duration title contract.",
    };
  }

  return { ok: true, document: normalized.value };
}

export async function initializeWorkoutDocumentForUser(
  userId: string,
  input: unknown,
  dependencies: WorkoutDocumentInitializerDependencies = {},
): Promise<WorkoutDocumentInitializerResult> {
  const parsed = workoutDocumentInitializerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "Choose a supported Workout initializer and authoritative source.",
    };
  }
  if (parsed.data.origin !== "saved_template") {
    if (parsed.data.origin !== "calendar") {
      return initializeWorkoutDocument(parsed.data);
    }

    const { initializeCalendarWorkoutDocumentForUser } =
      await import("@/lib/manual-workout-authoring/edit-workout");
    const initialized = await initializeCalendarWorkoutDocumentForUser(
      userId,
      { workoutId: parsed.data.workoutId },
      dependencies.calendarEditDependencies,
    );
    if (!initialized.ok) {
      return {
        ok: false,
        reason:
          initialized.reason === "source_workout_not_found" ||
          initialized.reason === "source_workout_not_owned"
            ? "not_found"
            : initialized.reason === "logged_workout" ||
                initialized.reason === "evidence_backed_workout" ||
                initialized.reason === "protected_day"
              ? "protected"
              : initialized.reason === "source_workout_not_supported" ||
                  initialized.reason === "unsupported_source_metadata"
                ? "unsupported_payload"
                : initialized.reason === "persistence_failed"
                  ? "persistence_failed"
                  : "invalid_input",
        message: initialized.message,
      };
    }

    return {
      ok: true,
      origin: "calendar",
      document: initialized.document,
      expectedFingerprint: initialized.expectedFingerprint,
      provenanceReference: initialized.provenanceReference,
      safety: {
        serverOwned: true,
        ownerScoped: true,
        canonicalDocumentOnly: true,
        sourceWorkoutVerified: true,
        rootProvenanceVerified: true,
        editProtectionVerified: true,
        callsOpenAi: false,
      },
    };
  }

  const { initializeManualWorkoutSavedTemplateForUser } =
    await import("@/lib/manual-workout-authoring/saved-templates");
  const initialized = await initializeManualWorkoutSavedTemplateForUser(
    userId,
    {
      templateId: parsed.data.templateId,
      workoutDate: parsed.data.workoutDate,
    },
    dependencies.savedTemplateRepository
      ? { repository: dependencies.savedTemplateRepository }
      : undefined,
  );
  if (!initialized.ok) {
    return {
      ok: false,
      reason:
        initialized.reason === "not_found" ||
        initialized.reason === "unsupported_payload" ||
        initialized.reason === "persistence_failed"
          ? initialized.reason
          : "invalid_input",
      message: initialized.message,
    };
  }

  return {
    ok: true,
    origin: "saved_template",
    document: initialized.document,
    provenanceReference: initialized.provenanceReference,
    safety: {
      serverOwned: true,
      ownerScoped: initialized.safety.ownerScoped,
      canonicalDocumentOnly: initialized.safety.canonicalDocumentOnly,
      callsOpenAi: initialized.safety.callsOpenAi,
    },
  };
}

export const confirmWorkoutCommandAction = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<WorkoutCommandConfirmationResult> => {
    const user = await resolveCurrentManualWorkoutAuthoringUser();
    if (!user.ok) {
      return {
        ok: false,
        reason: "unauthenticated",
        message: "Sign in before confirming a Workout command.",
      };
    }
    return confirmWorkoutCommandForUser(user.userId, data);
  });

export async function reviewWorkoutCommandForUser(
  userId: string,
  input: unknown,
  dependencies: WorkoutCommandReviewDependencies = {},
): Promise<WorkoutCommandReviewResult> {
  const { isAdaptiveContinuationReviewRequest, reviewAdaptiveContinuationCandidateForUser } =
    await import("@/lib/adaptive-blueprint-confirmation");
  if (isAdaptiveContinuationReviewRequest(input)) {
    return reviewAdaptiveContinuationCandidateForUser(userId, input, {
      asOfDate: dependencies.adaptiveContinuationAsOfDate,
    });
  }

  const parsed = workoutCommandSchema.safeParse(input);
  if (!parsed.success) {
    return rejectWorkoutCommand("The Workout command payload is invalid.");
  }
  const command = parsed.data as unknown as WorkoutCommandInput;

  if (command.operation === "copy") {
    const { reviewCalendarWorkoutCopyCommandForUser } =
      await import("@/lib/manual-workout-authoring/copy-paste");
    return reviewCalendarWorkoutCopyCommandForUser(userId, command);
  }

  if (command.operation === "move") {
    const { reviewCalendarWorkoutMoveCommandForUser } =
      await import("@/lib/manual-workout-authoring/move-workout");
    return reviewCalendarWorkoutMoveCommandForUser(userId, command);
  }

  if (command.operation === "delete" || command.operation === "clear") {
    const { reviewCalendarWorkoutDeleteClearCommandForUser } =
      await import("@/lib/manual-workout-authoring/delete-clear");
    return reviewCalendarWorkoutDeleteClearCommandForUser(userId, command);
  }

  if (command.operation === "replace_document") {
    const { reviewWorkoutDocumentPersistedEditForUser } =
      await import("@/lib/manual-workout-authoring/edit-workout");
    const reviewed = await reviewWorkoutDocumentPersistedEditForUser(userId, {
      plannedWorkoutId: command.workoutId,
      workoutDate:
        typeof command.document === "object" &&
        command.document &&
        "workoutDate" in command.document
          ? (command.document as { workoutDate: unknown }).workoutDate
          : null,
      document: command.document,
    });
    if (!reviewed.ok) return rejectWorkoutCommand(reviewed.message);
    if (
      reviewed.candidate.command.operation !== "replace_document" ||
      !stableJsonEqual(
        command.expectedFingerprint,
        reviewed.candidate.command.expectedFingerprint,
      ) ||
      !stableJsonEqual(command.provenanceReference, reviewed.candidate.command.provenanceReference)
    ) {
      return rejectWorkoutCommand(
        "The Calendar workout changed after initialization. Reopen it before reviewing edits.",
      );
    }
    return { ok: true, candidate: reviewed.candidate };
  }

  if (command.operation === "materialize") {
    const {
      isAdaptiveContinuationMaterializeCommand,
      reviewAdaptiveContinuationMaterializeCommandForUser,
    } = await import("@/lib/adaptive-blueprint-confirmation");
    if (isAdaptiveContinuationMaterializeCommand(command)) {
      return reviewAdaptiveContinuationMaterializeCommandForUser(userId, command, {
        asOfDate: dependencies.adaptiveContinuationAsOfDate,
      });
    }
    const { getCalendarWorkoutMutationContext } = await import("@/lib/runner-calendar-persistence");
    try {
      const context = await getCalendarWorkoutMutationContext(userId);
      const dates = new Set(
        command.documents
          .map((document) =>
            typeof document === "object" && document && "workoutDate" in document
              ? (document as { workoutDate: unknown }).workoutDate
              : null,
          )
          .filter((date): date is string => typeof date === "string"),
      );
      const collisions = context.existingWorkouts.workouts
        .filter((workout) => dates.has(workout.workout_date))
        .map((workout) => ({
          code: "occupied_date" as const,
          workoutDate: workout.workout_date,
        }));
      return reviewWorkoutCommand({ command, collisions });
    } catch {
      return rejectWorkoutCommand("The Calendar could not verify the Workout command.");
    }
  }

  return reviewWorkoutCommand({ command });
}

export async function confirmWorkoutCommandForUser(
  userId: string,
  input: unknown,
  dependencies: WorkoutCommandExecutionDependencies = {},
): Promise<WorkoutCommandConfirmationResult> {
  const parsed = workoutCommandConfirmSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "The Workout command confirmation payload is invalid.",
    };
  }

  const reviewed = await reviewWorkoutCommandForUser(userId, parsed.data.command, {
    adaptiveContinuationAsOfDate: dependencies.adaptiveContinuationAsOfDate,
  });
  if (!reviewed.ok) {
    return {
      ok: false,
      reason: mapWorkoutCommandReviewIssue(reviewed.issues[0]?.code),
      message: reviewed.issues[0]?.message ?? "The Workout command could not be reviewed.",
    };
  }
  const proof = confirmWorkoutCommandReview({
    candidate: reviewed.candidate,
    candidateId: parsed.data.candidateId,
    reviewToken: parsed.data.reviewToken,
    reviewChecksum: parsed.data.reviewChecksum,
  });
  if (!proof.ok) {
    return { ok: false, reason: proof.reason, message: proof.message };
  }

  switch (proof.candidate.command.operation) {
    case "materialize":
      return executeMaterializeWorkoutCommand(userId, proof.candidate, dependencies);
    case "replace_document": {
      const { confirmWorkoutDocumentPersistedEditForUser } =
        await import("@/lib/manual-workout-authoring/edit-workout");
      const command = proof.candidate.command;
      const result = await confirmWorkoutDocumentPersistedEditForUser(userId, {
        plannedWorkoutId: command.workoutId,
        workoutDate: command.document.workoutDate,
        document: command.document,
        candidateId: proof.candidate.candidateId,
        reviewToken: proof.candidate.reviewToken,
        reviewChecksum: proof.candidate.reviewChecksum,
      });
      return result.ok
        ? { ok: true, operation: command.operation, result: result as unknown as Json }
        : {
            ok: false,
            reason: mapWorkoutCommandFailure(result.reason),
            message: result.message,
          };
    }
    case "save_template": {
      return executeSaveTemplateWorkoutCommand(userId, proof.candidate);
    }
    case "copy": {
      const { executeCalendarWorkoutCopyCommandForUser } =
        await import("@/lib/manual-workout-authoring/copy-paste");
      const result = await executeCalendarWorkoutCopyCommandForUser(userId, proof.candidate);
      return result.ok
        ? { ok: true, operation: proof.candidate.command.operation, result: result.result }
        : {
            ok: false,
            reason: mapWorkoutCommandFailure(result.reason),
            message: result.message,
          };
    }
    case "move": {
      const { executeCalendarWorkoutMoveCommandForUser } =
        await import("@/lib/manual-workout-authoring/move-workout");
      const result = await executeCalendarWorkoutMoveCommandForUser(userId, proof.candidate);
      return result.ok
        ? { ok: true, operation: proof.candidate.command.operation, result: result.result }
        : {
            ok: false,
            reason: mapWorkoutCommandFailure(result.reason),
            message: result.message,
          };
    }
    case "delete":
    case "clear": {
      const { executeCalendarWorkoutDeleteClearCommandForUser } =
        await import("@/lib/manual-workout-authoring/delete-clear");
      const result = await executeCalendarWorkoutDeleteClearCommandForUser(userId, proof.candidate);
      return result.ok
        ? { ok: true, operation: proof.candidate.command.operation, result: result.result }
        : {
            ok: false,
            reason: mapWorkoutCommandFailure(result.reason),
            message: result.message,
          };
    }
  }
}

async function executeMaterializeWorkoutCommand(
  userId: string,
  candidate: ReviewedWorkoutCommandCandidate,
  dependencies: WorkoutCommandExecutionDependencies,
): Promise<WorkoutCommandConfirmationResult> {
  if (candidate.command.operation !== "materialize") {
    return {
      ok: false,
      reason: "unsupported_operation",
      message: "The reviewed command is not a materialize operation.",
    };
  }
  const {
    executeAdaptiveContinuationMaterializeCommandForUser,
    isAdaptiveContinuationMaterializeCommand,
  } = await import("@/lib/adaptive-blueprint-confirmation");
  if (isAdaptiveContinuationMaterializeCommand(candidate.command)) {
    try {
      const result = await executeAdaptiveContinuationMaterializeCommandForUser(userId, candidate, {
        asOfDate: dependencies.adaptiveContinuationAsOfDate,
      });
      return {
        ok: true,
        operation: candidate.command.operation,
        result: {
          ...result,
          reviewChecksum: candidate.reviewChecksum,
          explicitConfirm: true,
          trustedClientRows: false,
        } as unknown as Json,
      };
    } catch (error) {
      return {
        ok: false,
        reason:
          error instanceof Error && /occupied|collision/u.test(error.message)
            ? "collision"
            : error instanceof Error && /stale|changed|current|confirmed/u.test(error.message)
              ? "stale_review"
              : "persistence_failed",
        message:
          error instanceof Error
            ? error.message
            : "The reviewed adaptive continuation could not be materialized.",
      };
    }
  }
  const sourceBatch = resolveReviewedSourceWorkoutBatch(candidate);
  if (sourceBatch.kind === "invalid") {
    return {
      ok: false,
      reason: "invalid_input",
      message: "The reviewed AI/file Workout batch is missing immutable source provenance.",
    };
  }
  if (sourceBatch.kind === "source_batch") {
    try {
      const result = await executeReviewedSourceWorkoutBatchMaterializationForUser(userId, {
        sourcePlanId: sourceBatch.sourcePlanId,
        sourceKind: sourceBatch.sourceKind,
        documents: candidate.command.documents,
        ...(dependencies.sourceBatchCalendarInstant
          ? { calendarInstant: dependencies.sourceBatchCalendarInstant }
          : {}),
      });
      return {
        ok: true,
        operation: candidate.command.operation,
        result: {
          ...result,
          sourcePlanId: sourceBatch.sourcePlanId,
          sourceKind: sourceBatch.sourceKind,
          reviewChecksum: candidate.reviewChecksum,
          explicitConfirm: true,
        } as unknown as Json,
      };
    } catch (error) {
      return {
        ok: false,
        reason:
          error instanceof Error && /upcoming Calendar workouts|already exist/u.test(error.message)
            ? "collision"
            : error instanceof Error && /changed|does not match/u.test(error.message)
              ? "stale_review"
              : "persistence_failed",
        message:
          error instanceof Error
            ? error.message
            : "The reviewed Workout batch could not be materialized.",
      };
    }
  }

  if (candidate.command.documents.length !== 1) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "A multi-Workout materialize command requires one immutable AI or file source.",
    };
  }

  const document = candidate.command.documents[0]!;
  const totalDurationMin = Number(
    workoutDocumentExecutableDurationForSections(document.steps).toFixed(2),
  );
  const totalDistanceKm = Number(
    document.steps
      .reduce(
        (total, step) =>
          total + stepPlannedDistanceKm(step as Parameters<typeof stepPlannedDistanceKm>[0]),
        0,
      )
      .toFixed(2),
  );
  const result = await addReviewedManualWorkoutToActivePlanForUser(userId, {
    document,
    candidate,
    reviewMetadata: {
      sourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      sourceStatus: MANUAL_WORKOUT_AUTHORING_SOURCE_STATUS,
      templateKey: (document.sourceWorkoutType ?? "easy_aerobic_run") as ManualWorkoutTemplateKey,
      targetTruthMode: document.workoutType === "rest" ? "none" : "structure_only",
      totalDurationMin,
      totalDistanceKm,
      mappingGaps: [],
    },
    reviewChecksum: candidate.reviewChecksum,
    targetTruthMode: document.workoutType === "rest" ? "none" : "structure_only",
    reviewWarnings: candidate.warnings,
  });

  return result.ok
    ? {
        ok: true,
        operation: candidate.command.operation,
        result: result as unknown as Json,
      }
    : {
        ok: false,
        reason: mapWorkoutCommandFailure(result.reason),
        message: result.message,
      };
}

function resolveReviewedSourceWorkoutBatch(candidate: ReviewedWorkoutCommandCandidate):
  | { kind: "manual" }
  | { kind: "invalid" }
  | {
      kind: "source_batch";
      sourcePlanId: string;
      sourceKind: "ai_authored_plan_first_v1" | "training_plan_v2_import";
    } {
  if (candidate.command.operation !== "materialize") return { kind: "manual" };

  const claimsSourceBatch = candidate.command.provenanceReferences.some(
    (reference) =>
      reference !== null &&
      typeof reference === "object" &&
      !Array.isArray(reference) &&
      (reference.sourceKind === "ai_authored_plan_first_v1" ||
        reference.sourceKind === "training_plan_v2_import"),
  );
  if (!claimsSourceBatch) return { kind: "manual" };

  const references = candidate.command.provenanceReferences.map((reference, index) => {
    if (!reference || typeof reference !== "object" || Array.isArray(reference)) return null;
    const sourcePlanId = reference.sourcePlanId;
    const sourceKind = reference.sourceKind;
    const sourceWorkoutId = reference.sourceWorkoutId;
    const document =
      candidate.command.operation === "materialize" ? candidate.command.documents[index] : null;
    if (
      typeof sourcePlanId !== "string" ||
      !sourcePlanId ||
      (sourceKind !== "ai_authored_plan_first_v1" && sourceKind !== "training_plan_v2_import") ||
      typeof sourceWorkoutId !== "string" ||
      sourceWorkoutId !== document?.sourceWorkoutId
    ) {
      return null;
    }
    return {
      sourcePlanId,
      sourceKind: sourceKind as "ai_authored_plan_first_v1" | "training_plan_v2_import",
    };
  });
  const first = references[0];
  if (
    !first ||
    references.some(
      (reference) =>
        !reference ||
        reference.sourcePlanId !== first.sourcePlanId ||
        reference.sourceKind !== first.sourceKind,
    )
  ) {
    return { kind: "invalid" };
  }
  return { kind: "source_batch", ...first };
}

async function executeSaveTemplateWorkoutCommand(
  userId: string,
  candidate: ReviewedWorkoutCommandCandidate,
): Promise<WorkoutCommandConfirmationResult> {
  if (candidate.command.operation !== "save_template") {
    return {
      ok: false,
      reason: "unsupported_operation",
      message: "The reviewed command is not a save-template operation.",
    };
  }

  const command = candidate.command;
  const content = normalizeWorkoutDocumentContent({
    workoutType: command.document.workoutType,
    sourceWorkoutType: command.document.sourceWorkoutType,
    workoutFamily: command.document.workoutFamily,
    workoutIdentity: command.document.workoutIdentity,
    calendarIconKey: command.document.calendarIconKey,
    metricMode: command.document.metricMode,
    title: command.document.title,
    notes: command.document.notes,
    steps: command.document.steps,
  });
  if (!content.ok) {
    return { ok: false, reason: "invalid_input", message: content.message };
  }

  try {
    const repository = createSupabaseSavedTemplateRepository();
    const row = await repository.insertTemplate({
      user_id: userId,
      display_name: command.displayName,
      icon_key: command.iconKey,
      template_key: command.document.sourceWorkoutType ?? "workout_document",
      template_version: "manual_workout_template_registry_v1",
      source_kind: "manual_saved_workout_template_v1",
      source_status: "saved_from_reviewed_manual_workout",
      workout_source_kind: "manual_workout_authoring_v1",
      review_payload_version: "manual_workout_review_payload_v1",
      source_review_checksum: candidate.reviewChecksum,
      source_workout_identity: command.document.workoutIdentity,
      source_workout_family: command.document.workoutFamily,
      target_truth_mode: command.document.workoutType === "rest" ? "none" : "structure_only",
      draft_payload: toManualSavedTemplateJson({
        version: WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION,
        content: content.value,
        provenance: command.provenanceReference,
      }),
    });
    if (row.user_id !== userId) {
      return {
        ok: false,
        reason: "invalid_input",
        message: "The saved Workout template owner could not be verified.",
      };
    }

    return {
      ok: true,
      operation: command.operation,
      result: {
        templateId: row.id,
        displayName: row.display_name,
        iconKey: row.icon_key,
        content: content.value,
        reviewChecksum: candidate.reviewChecksum,
        payloadVersion: WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION,
        safety: {
          ownerScoped: true,
          canonicalContentOnly: true,
          trustedClientRows: false,
          callsOpenAi: false,
        },
      } as unknown as Json,
    };
  } catch {
    return {
      ok: false,
      reason: "invalid_input",
      message: "The canonical Workout template could not be saved.",
    };
  }
}

function rejectWorkoutCommand(message: string): WorkoutCommandReviewResult {
  return {
    ok: false,
    issues: [{ code: "invalid_operation", message, path: ["command"] }],
  };
}

function mapWorkoutCommandFailure(
  reason: string,
): Exclude<Extract<WorkoutCommandConfirmationResult, { ok: false }>["reason"], "unauthenticated"> {
  if (reason === "stale_review") return "stale_review";
  if (reason === "invalid_review") return "invalid_review";
  if (reason === "occupied_day" || reason === "collision") return "collision";
  if (
    reason === "not_found" ||
    reason === "source_workout_not_found" ||
    reason === "source_workout_not_owned" ||
    reason === "target_workout_not_found" ||
    reason === "target_workout_not_in_active_plan"
  )
    return "not_found";
  if (
    reason === "protected_day" ||
    reason === "protected_operation" ||
    reason === "source_workout_not_supported" ||
    reason === "target_workout_not_supported" ||
    reason === "unsafe_target_state"
  )
    return "protected";
  if (reason === "persistence_failed") return "persistence_failed";
  return "invalid_input";
}

function mapWorkoutCommandReviewIssue(
  code: string | undefined,
): Extract<WorkoutCommandConfirmationResult, { ok: false }>["reason"] {
  if (code === "stale_reference") return "stale_review";
  if (code === "calendar_collision") return "collision";
  if (code === "not_found") return "not_found";
  if (code === "protected_operation") return "protected";
  if (code === "persistence_failed") return "persistence_failed";
  return "invalid_review";
}

export const createEmptyManualActivePlan = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualEmptyPlanCreateResult> => {
    const user = await resolveCurrentManualWorkoutAuthoringUser();

    if (!user.ok) {
      return buildManualEmptyPlanCreateFailure({
        reason: "unauthenticated",
        message:
          user.reason === "missing_auth"
            ? "Sign in before creating a manual user-built plan."
            : "This session cannot create a persisted manual plan yet.",
      });
    }

    return createEmptyManualActivePlanForUser(user.userId, data);
  });

export async function createEmptyManualActivePlanForUser(
  userId: string,
  input: unknown,
  dependencies: ManualEmptyPlanCreateDependencies = {},
): Promise<ManualEmptyPlanCreateResult> {
  const parsed = manualEmptyPlanSetupInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildManualEmptyPlanCreateFailure({
      reason: "invalid_input",
      message: "Manual setup input is invalid.",
    });
  }

  const saveBaselineForUser = dependencies.saveBaselineForUser ?? saveRunnerBaselineForUserId;
  const currentDate = dependencies.currentDate ?? (await getRunnerCalendarDateForUserId(userId));

  try {
    await saveBaselineForUser(userId, {
      age: parsed.data.age,
      heightCm: parsed.data.heightCm,
      weightKg: parsed.data.weightKg,
      fitnessLevel: parsed.data.runningLevel,
    });
    return {
      ok: true,
      status: "created",
      persisted: true,
      sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
      sourceStatus: MANUAL_USER_BUILT_PLAN_SOURCE_STATUS,
      schemaVersion: "training-plan-v2",
      activePlanId: null,
      effectiveStartDate: currentDate,
      appliedStartDate: currentDate,
      workoutCount: 0,
      calendarRowCount: 0,
      nonRestWorkoutCount: 0,
      setup: parsed.data,
      sourceMetadata: {
        creationMode: "empty_manual_setup",
        setupPayloadVersion: MANUAL_EMPTY_PLAN_SETUP_PAYLOAD_VERSION,
        rowCount: 0,
        nonRestRowCount: 0,
        runningLevel: parsed.data.runningLevel,
      },
      safety: {
        createsFakeWorkout: false,
        trustedClientRows: false,
        callsOpenAi: false,
        readyForManualAdd: true,
      },
    };
  } catch {
    return buildManualEmptyPlanCreateFailure({
      reason: "persistence_failed",
      message: "The runner setup could not be saved. The Calendar was not changed.",
    });
  }
}

function buildManualEmptyPlanCreateFailure(input: {
  reason: ManualEmptyPlanCreateFailureReason;
  message: string;
}): Extract<ManualEmptyPlanCreateResult, { ok: false }> {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason: input.reason,
    message: input.message,
    sourceKind: MANUAL_USER_BUILT_PLAN_SOURCE_KIND,
  };
}
