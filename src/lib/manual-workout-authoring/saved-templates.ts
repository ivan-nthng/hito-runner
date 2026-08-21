import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getCurrentManualWorkoutAuthoringUserId } from "@/lib/manual-workout-authoring/request-auth";
import {
  createSupabaseSavedTemplateRepository,
  type ManualWorkoutSavedTemplateRepository,
  type RunnerManualWorkoutTemplateRow,
} from "@/lib/manual-workout-authoring/saved-template-repository";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_WORKOUT_TEMPLATE_KEY_VALUES,
  type ManualWorkoutTargetTruthMode,
  type ManualWorkoutTemplateKey,
} from "@/lib/manual-workout-authoring/schema";
import { CALENDAR_ICON_KEY_VALUES, type CalendarIconKey } from "@/lib/rich-workout-model";
import type { Json } from "@/lib/supabase/database";
import { stepPlannedDistanceKm, weekdayLong } from "@/lib/training";
import { WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION } from "@/lib/workout-authoring-review";
import {
  normalizeWorkoutDocument,
  normalizeWorkoutDocumentContent,
  workoutDocumentExecutableDurationForSections,
  type WorkoutDocument,
  type WorkoutDocumentContent,
} from "@/lib/workout-document";

export type { ManualWorkoutSavedTemplateRepository };

export const MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND =
  "manual_saved_workout_template_v1" as const;
export const MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS =
  "saved_from_reviewed_manual_workout" as const;
export const MANUAL_WORKOUT_TEMPLATE_REGISTRY_VERSION =
  "manual_workout_template_registry_v1" as const;
const SAVED_TEMPLATE_REVIEW_METADATA_VERSION = "manual_workout_review_payload_v1" as const;

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const canonicalSavedTemplatePayloadSchema = z
  .object({
    version: z.literal(WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION),
    content: z.unknown(),
    provenance: z.unknown(),
  })
  .strict();

export const manualWorkoutSavedTemplateDeleteInputSchema = z
  .object({ templateId: z.string().uuid() })
  .strict();

type ManualWorkoutSavedTemplateCatalogSummary = {
  version: typeof WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION;
  totalDurationMin: number;
  totalDistanceKm: number;
};

export interface ManualWorkoutSavedTemplateView {
  id: string;
  displayName: string;
  iconKey: CalendarIconKey;
  templateKey: ManualWorkoutTemplateKey;
  templateVersion: typeof MANUAL_WORKOUT_TEMPLATE_REGISTRY_VERSION;
  sourceKind: typeof MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND;
  sourceStatus: typeof MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS;
  sourceReviewChecksum: string;
  sourceWorkoutIdentity: WorkoutDocumentContent["workoutIdentity"];
  sourceWorkoutFamily: WorkoutDocumentContent["workoutFamily"];
  targetTruthMode: ManualWorkoutTargetTruthMode;
  createdAt: string;
  updatedAt: string;
  draftPayload: ManualWorkoutSavedTemplateCatalogSummary;
}

export type ManualWorkoutSavedTemplateFailureReason =
  | "unauthenticated"
  | "invalid_input"
  | "unsupported_payload"
  | "not_found"
  | "forbidden"
  | "persistence_failed";

export type ManualWorkoutSavedTemplateListResult =
  | {
      ok: true;
      status: "templates_ready";
      sourceKind: typeof MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND;
      templates: ManualWorkoutSavedTemplateView[];
      safety: {
        currentUserScoped: true;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutSavedTemplateBlockedResult;

export type ManualWorkoutSavedTemplateDeleteResult =
  | {
      ok: true;
      status: "deleted";
      persisted: true;
      sourceKind: typeof MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND;
      templateId: string;
      safety: {
        currentUserScoped: true;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutSavedTemplateBlockedResult;

export type ManualWorkoutSavedTemplateBlockedResult = {
  ok: false;
  status: "blocked";
  persisted: false;
  reason: ManualWorkoutSavedTemplateFailureReason;
  message: string;
  sourceKind: typeof MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND;
};

export type ManualWorkoutSavedTemplateDependencies = {
  repository?: ManualWorkoutSavedTemplateRepository;
};

export const deleteManualWorkoutSavedTemplate = createServerFn({ method: "POST" })
  .validator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutSavedTemplateDeleteResult> => {
    const userId = await getCurrentManualWorkoutAuthoringUserId();
    if (!userId) {
      return savedTemplateBlocked(
        "unauthenticated",
        "Sign in before deleting a personal workout template.",
      );
    }
    return deleteManualWorkoutSavedTemplateForUser(userId, data);
  });

export async function listManualWorkoutSavedTemplatesForUser(
  userId: string,
  dependencies: ManualWorkoutSavedTemplateDependencies = {},
): Promise<ManualWorkoutSavedTemplateListResult> {
  const repository = dependencies.repository ?? createSupabaseSavedTemplateRepository();

  try {
    const rows = await repository.listTemplatesForUser(userId);
    const templates: ManualWorkoutSavedTemplateView[] = [];
    for (const row of rows) {
      const resolved = resolveCanonicalSavedTemplateCatalogView(row, userId);
      if (!resolved.ok) {
        return savedTemplateBlocked(resolved.reason, resolved.message);
      }
      templates.push(resolved.view);
    }

    return {
      ok: true,
      status: "templates_ready",
      sourceKind: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
      templates,
      safety: { currentUserScoped: true, callsOpenAi: false },
    };
  } catch {
    return savedTemplateBlocked(
      "persistence_failed",
      "Personal workout templates could not be loaded.",
    );
  }
}

export async function deleteManualWorkoutSavedTemplateForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutSavedTemplateDependencies = {},
): Promise<ManualWorkoutSavedTemplateDeleteResult> {
  const parsed = manualWorkoutSavedTemplateDeleteInputSchema.safeParse(input);
  if (!parsed.success) {
    return savedTemplateBlocked(
      "invalid_input",
      "The personal workout template delete payload is invalid.",
    );
  }

  const repository = dependencies.repository ?? createSupabaseSavedTemplateRepository();
  try {
    const deleted = await repository.deleteTemplateForUser(userId, parsed.data.templateId);
    return deleted
      ? {
          ok: true,
          status: "deleted",
          persisted: true,
          sourceKind: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
          templateId: parsed.data.templateId,
          safety: { currentUserScoped: true, callsOpenAi: false },
        }
      : savedTemplateBlocked(
          "not_found",
          "This personal workout template was not found for the current runner.",
        );
  } catch {
    return savedTemplateBlocked(
      "persistence_failed",
      "The personal workout template could not be deleted.",
    );
  }
}

export async function initializeManualWorkoutSavedTemplateForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutSavedTemplateDependencies = {},
): Promise<
  | {
      ok: true;
      document: WorkoutDocument;
      provenanceReference: Json;
      safety: {
        ownerScoped: true;
        serverRebased: true;
        canonicalDocumentOnly: true;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutSavedTemplateBlockedResult
> {
  const parsed = z
    .object({ templateId: z.string().uuid(), workoutDate: isoDateSchema })
    .strict()
    .safeParse(input);
  if (!parsed.success) {
    return savedTemplateBlocked(
      "invalid_input",
      "The saved Workout initializer payload is invalid.",
    );
  }

  const repository = dependencies.repository ?? createSupabaseSavedTemplateRepository();
  try {
    const row = await repository.getTemplateForUser(userId, parsed.data.templateId);
    if (!row || row.user_id !== userId) {
      return savedTemplateBlocked(
        "not_found",
        "This personal workout template was not found for the current runner.",
      );
    }

    const payload = canonicalSavedTemplatePayloadSchema.safeParse(row.draft_payload);
    if (!payload.success) {
      return savedTemplateBlocked(
        "unsupported_payload",
        "This saved Workout template requires canonical conversion before use.",
      );
    }

    const content = resolveCanonicalSavedTemplateContent(row, payload.data);
    if (!content.ok) {
      return savedTemplateBlocked("unsupported_payload", content.message);
    }
    const document = normalizeWorkoutDocument({
      ...content.content,
      workoutDate: parsed.data.workoutDate,
      weekday: weekdayLong(parsed.data.workoutDate),
      weekNumber: 1,
      phase: "Manual build",
      sourceWorkoutId: `saved-template-${row.id}-${parsed.data.workoutDate}`,
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
    if (!document.ok) {
      return savedTemplateBlocked("unsupported_payload", document.message);
    }

    return {
      ok: true,
      document: document.value,
      provenanceReference: {
        initializer: "saved_template",
        templateId: row.id,
        sourceKind: row.source_kind,
        sourceStatus: row.source_status,
        sourceReviewChecksum: row.source_review_checksum,
        payloadVersion: payload.data.version,
        sourceProvenance: payload.data.provenance as Json,
      },
      safety: {
        ownerScoped: true,
        serverRebased: true,
        canonicalDocumentOnly: true,
        callsOpenAi: false,
      },
    };
  } catch {
    return savedTemplateBlocked(
      "persistence_failed",
      "The saved Workout template could not be initialized.",
    );
  }
}

function resolveCanonicalSavedTemplateCatalogView(
  row: RunnerManualWorkoutTemplateRow,
  currentUserId: string,
):
  | { ok: true; view: ManualWorkoutSavedTemplateView }
  | { ok: false; reason: ManualWorkoutSavedTemplateFailureReason; message: string } {
  if (row.user_id !== currentUserId) {
    return {
      ok: false,
      reason: "forbidden",
      message: "This personal workout template belongs to a different runner.",
    };
  }

  const payload = canonicalSavedTemplatePayloadSchema.safeParse(row.draft_payload);
  if (!payload.success) {
    return {
      ok: false,
      reason: "unsupported_payload",
      message: "This saved Workout template requires canonical conversion before use.",
    };
  }
  const content = resolveCanonicalSavedTemplateContent(row, payload.data);
  const icon = z.enum(CALENDAR_ICON_KEY_VALUES).safeParse(row.icon_key);
  const templateKey = z.enum(MANUAL_WORKOUT_TEMPLATE_KEY_VALUES).safeParse(row.template_key);
  const checksum = z.string().length(64).safeParse(row.source_review_checksum);
  if (!content.ok || !icon.success || !templateKey.success || !checksum.success) {
    return {
      ok: false,
      reason: "unsupported_payload",
      message: content.ok
        ? "This canonical saved Workout template catalog entry is malformed."
        : content.message,
    };
  }

  return {
    ok: true,
    view: {
      id: row.id,
      displayName: row.display_name,
      iconKey: icon.data,
      templateKey: templateKey.data,
      templateVersion: MANUAL_WORKOUT_TEMPLATE_REGISTRY_VERSION,
      sourceKind: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
      sourceStatus: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS,
      sourceReviewChecksum: checksum.data,
      sourceWorkoutIdentity: content.content.workoutIdentity,
      sourceWorkoutFamily: content.content.workoutFamily,
      targetTruthMode: content.content.workoutType === "rest" ? "none" : "structure_only",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      draftPayload: canonicalSavedTemplateCatalogSummary(content.content),
    },
  };
}

function resolveCanonicalSavedTemplateContent(
  row: RunnerManualWorkoutTemplateRow,
  payload: z.output<typeof canonicalSavedTemplatePayloadSchema>,
): { ok: true; content: WorkoutDocumentContent } | { ok: false; message: string } {
  if (
    row.source_kind !== MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND ||
    row.source_status !== MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS ||
    row.workout_source_kind !== MANUAL_WORKOUT_AUTHORING_SOURCE_KIND ||
    row.template_version !== MANUAL_WORKOUT_TEMPLATE_REGISTRY_VERSION ||
    row.review_payload_version !== SAVED_TEMPLATE_REVIEW_METADATA_VERSION
  ) {
    return { ok: false, message: "This saved Workout template source contract is unsupported." };
  }

  const content = normalizeWorkoutDocumentContent(payload.content);
  if (
    !content.ok ||
    row.template_key !==
      (content.ok ? (content.value.sourceWorkoutType ?? "workout_document") : "") ||
    row.source_workout_identity !== (content.ok ? content.value.workoutIdentity : "") ||
    row.source_workout_family !== (content.ok ? content.value.workoutFamily : "") ||
    row.target_truth_mode !==
      (content.ok && content.value.workoutType === "rest" ? "none" : "structure_only")
  ) {
    return {
      ok: false,
      message: "This canonical saved Workout template is internally inconsistent.",
    };
  }

  return { ok: true, content: content.value };
}

function canonicalSavedTemplateCatalogSummary(
  content: WorkoutDocumentContent,
): ManualWorkoutSavedTemplateCatalogSummary {
  return {
    version: WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION,
    totalDurationMin: Number(
      workoutDocumentExecutableDurationForSections(content.steps).toFixed(2),
    ),
    totalDistanceKm: Number(
      content.steps
        .reduce(
          (total, step) =>
            total + stepPlannedDistanceKm(step as Parameters<typeof stepPlannedDistanceKm>[0]),
          0,
        )
        .toFixed(2),
    ),
  };
}

function savedTemplateBlocked(
  reason: ManualWorkoutSavedTemplateFailureReason,
  message: string,
): ManualWorkoutSavedTemplateBlockedResult {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason,
    message,
    sourceKind: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
  };
}
