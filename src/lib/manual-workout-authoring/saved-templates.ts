import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestAuthContext } from "@/lib/backend/auth";
import {
  reviewManualWorkoutDraft,
  validateManualWorkoutReviewExactness,
} from "@/lib/manual-workout-authoring/actions";
import {
  MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
  MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
  manualWorkoutConstructorEntrySchema,
  manualWorkoutDraftContextSchema,
  manualWorkoutDraftInputSchema,
  type ManualWorkoutDraftInput,
  type ManualWorkoutDraftReviewResult,
  type ManualWorkoutTargetTruthMode,
  type ManualWorkoutTemplateKey,
} from "@/lib/manual-workout-authoring/schema";
import { validateManualWorkoutDraft } from "@/lib/manual-workout-authoring/validator";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import {
  CALENDAR_ICON_KEY_VALUES,
  type CalendarIconKey,
  type CanonicalWorkoutFamily,
  type CanonicalWorkoutIdentity,
} from "@/lib/rich-workout-model";
import {
  createSupabaseSavedTemplateRepository,
  toManualSavedTemplateJson,
  type ManualWorkoutSavedTemplateRepository,
  type RunnerManualWorkoutTemplateRow,
} from "@/lib/manual-workout-authoring/saved-template-repository";

export type { ManualWorkoutSavedTemplateRepository };

export const MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND =
  "manual_saved_workout_template_v1" as const;
export const MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS =
  "saved_from_reviewed_manual_workout" as const;
export const MANUAL_SAVED_WORKOUT_TEMPLATE_PAYLOAD_VERSION =
  "manual_saved_workout_template_payload_v1" as const;
export const MANUAL_WORKOUT_TEMPLATE_REGISTRY_VERSION =
  "manual_workout_template_registry_v1" as const;

const MANUAL_SAVED_WORKOUT_TEMPLATE_NAME_MAX_LENGTH = 80;
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const savedTemplateDisplayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(MANUAL_SAVED_WORKOUT_TEMPLATE_NAME_MAX_LENGTH)
  .refine((value) => !hasControlCharacters(value), {
    message: "Template names cannot include control characters.",
  })
  .transform((value) => value.replace(/\s+/g, " "));

const savedTemplateDraftPayloadSchema = z
  .object({
    version: z.literal(MANUAL_SAVED_WORKOUT_TEMPLATE_PAYLOAD_VERSION),
    templateKey: z.string(),
    templateVersion: z.literal(MANUAL_WORKOUT_TEMPLATE_REGISTRY_VERSION),
    sourceKind: z.literal(MANUAL_WORKOUT_AUTHORING_SOURCE_KIND),
    sourceReviewPayloadVersion: z.literal(MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION),
    sourceReviewChecksum: z.string().length(64),
    sourceWorkoutDate: isoDateSchema,
    sourceTitle: z.string().trim().min(1).max(120),
    sourceNotes: z.string().trim().max(1000).nullable(),
    sourceWorkoutIdentity: z.string(),
    sourceWorkoutFamily: z.string(),
    sourceCalendarIconKey: z.string(),
    targetTruthMode: z.enum(["structure_only", "editable_default_hr", "none"]),
    entries: z.array(manualWorkoutConstructorEntrySchema).min(0).max(20),
    totalDurationMin: z.number().min(0),
    totalDistanceKm: z.number().min(0),
    mappingGaps: z.array(z.string()),
  })
  .strict();

type ManualWorkoutSavedTemplateDraftPayload = z.output<typeof savedTemplateDraftPayloadSchema>;

export const manualWorkoutSavedTemplateSaveInputSchema = z
  .object({
    displayName: savedTemplateDisplayNameSchema,
    iconKey: z.enum(CALENDAR_ICON_KEY_VALUES),
    draftInput: z.unknown(),
    reviewToken: z.string().trim().min(16),
    reviewChecksum: z.string().trim().length(64),
  })
  .strict();

export type ManualWorkoutSavedTemplateSaveInput = z.output<
  typeof manualWorkoutSavedTemplateSaveInputSchema
>;

export const manualWorkoutSavedTemplateReviewInputSchema = z
  .object({
    templateId: z.string().uuid(),
    workoutDate: isoDateSchema,
    title: z.string().trim().min(1).max(120).optional(),
    notes: z.string().trim().max(1000).optional().nullable(),
    context: manualWorkoutDraftContextSchema.optional(),
  })
  .strict();

export type ManualWorkoutSavedTemplateReviewInput = z.output<
  typeof manualWorkoutSavedTemplateReviewInputSchema
>;

export interface ManualWorkoutSavedTemplateView {
  id: string;
  displayName: string;
  iconKey: CalendarIconKey;
  templateKey: ManualWorkoutTemplateKey;
  templateVersion: typeof MANUAL_WORKOUT_TEMPLATE_REGISTRY_VERSION;
  sourceKind: typeof MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND;
  sourceStatus: typeof MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS;
  sourceReviewChecksum: string;
  sourceWorkoutIdentity: CanonicalWorkoutIdentity;
  sourceWorkoutFamily: CanonicalWorkoutFamily;
  targetTruthMode: ManualWorkoutTargetTruthMode;
  createdAt: string;
  updatedAt: string;
  draftPayload: ManualWorkoutSavedTemplateDraftPayload;
}

export type ManualWorkoutSavedTemplateFailureReason =
  | "unauthenticated"
  | "invalid_input"
  | "invalid_name"
  | "invalid_icon"
  | "invalid_review"
  | "stale_review"
  | "manual_workout_required"
  | "unsupported_template"
  | "unsupported_payload"
  | "unsupported_mapping"
  | "unsafe_block_structure"
  | "unsafe_metric_truth"
  | "protected_date_conflict"
  | "active_plan_conflict"
  | "not_found"
  | "forbidden"
  | "persistence_failed";

export type ManualWorkoutSavedTemplateSaveResult =
  | {
      ok: true;
      status: "saved";
      persisted: true;
      sourceKind: typeof MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND;
      sourceStatus: typeof MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS;
      workoutSourceKind: typeof MANUAL_WORKOUT_AUTHORING_SOURCE_KIND;
      template: ManualWorkoutSavedTemplateView;
      safety: {
        serverRebuiltReview: true;
        trustedClientRows: false;
        callsOpenAi: false;
      };
    }
  | ManualWorkoutSavedTemplateBlockedResult;

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

export type ManualWorkoutSavedTemplateReviewResult =
  | {
      ok: true;
      status: "draft_ready";
      persisted: false;
      sourceKind: typeof MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND;
      sourceStatus: "reconstructed_for_review";
      template: ManualWorkoutSavedTemplateView;
      draftInput: ManualWorkoutDraftInput;
      review: Extract<ManualWorkoutDraftReviewResult, { ok: true }>;
      safety: {
        reconstructedFromSavedTemplate: true;
        reviewedThroughManualAuthoring: true;
        trustedClientRows: false;
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

export const saveManualWorkoutSavedTemplate = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutSavedTemplateSaveResult> => {
    const userId = await getCurrentPersistedUserId();

    if (!userId) {
      return buildSavedTemplateBlocked({
        reason: "unauthenticated",
        message: "Sign in before saving a personal workout template.",
      });
    }

    return saveManualWorkoutSavedTemplateForUser(userId, data);
  });

export const listManualWorkoutSavedTemplates = createServerFn({ method: "GET" }).handler(
  async (): Promise<ManualWorkoutSavedTemplateListResult> => {
    const userId = await getCurrentPersistedUserId();

    if (!userId) {
      return buildSavedTemplateBlocked({
        reason: "unauthenticated",
        message: "Sign in before viewing personal workout templates.",
      });
    }

    return listManualWorkoutSavedTemplatesForUser(userId);
  },
);

export const reviewManualWorkoutSavedTemplate = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value)
  .handler(async ({ data }): Promise<ManualWorkoutSavedTemplateReviewResult> => {
    const userId = await getCurrentPersistedUserId();

    if (!userId) {
      return buildSavedTemplateBlocked({
        reason: "unauthenticated",
        message: "Sign in before using a personal workout template.",
      });
    }

    return reviewManualWorkoutSavedTemplateForUser(userId, data);
  });

export async function saveManualWorkoutSavedTemplateForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutSavedTemplateDependencies = {},
): Promise<ManualWorkoutSavedTemplateSaveResult> {
  const parsed = manualWorkoutSavedTemplateSaveInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildSavedTemplateBlocked({
      reason: mapSavedTemplateInputIssue(parsed.error),
      message: "The saved workout template payload is invalid.",
    });
  }

  const exactness = validateManualWorkoutReviewExactness({
    draftInput: parsed.data.draftInput,
    reviewToken: parsed.data.reviewToken,
    reviewChecksum: parsed.data.reviewChecksum,
  });

  if (!exactness.ok) {
    return buildSavedTemplateBlocked({
      reason: exactness.reason,
      message: exactness.message,
    });
  }

  const draftPayloadResult = buildSavedTemplateDraftPayload({
    draftInput: parsed.data.draftInput,
    reviewChecksum: exactness.reviewChecksum,
  });

  if (!draftPayloadResult.ok) {
    return buildSavedTemplateBlocked({
      reason: draftPayloadResult.reason,
      message: draftPayloadResult.message,
    });
  }

  const repository = dependencies.repository ?? createSupabaseSavedTemplateRepository();

  try {
    const row = await repository.insertTemplate({
      user_id: userId,
      display_name: parsed.data.displayName,
      icon_key: parsed.data.iconKey,
      template_key: exactness.draft.templateKey,
      template_version: MANUAL_WORKOUT_TEMPLATE_REGISTRY_VERSION,
      source_kind: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
      source_status: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS,
      workout_source_kind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      review_payload_version: MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
      source_review_checksum: exactness.reviewChecksum,
      source_workout_identity: exactness.draft.workoutIdentity,
      source_workout_family: exactness.draft.workoutFamily,
      target_truth_mode: exactness.targetTruthMode,
      draft_payload: toManualSavedTemplateJson(draftPayloadResult.payload),
    });
    const template = rowToSavedTemplateView(row, userId);

    if (!template.ok) {
      return buildSavedTemplateBlocked({
        reason: template.reason,
        message: template.message,
      });
    }

    return {
      ok: true,
      status: "saved",
      persisted: true,
      sourceKind: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
      sourceStatus: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS,
      workoutSourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      template: template.view,
      safety: {
        serverRebuiltReview: true,
        trustedClientRows: false,
        callsOpenAi: false,
      },
    };
  } catch {
    return buildSavedTemplateBlocked({
      reason: "persistence_failed",
      message: "The personal workout template could not be saved. No plan was changed.",
    });
  }
}

export async function listManualWorkoutSavedTemplatesForUser(
  userId: string,
  dependencies: ManualWorkoutSavedTemplateDependencies = {},
): Promise<ManualWorkoutSavedTemplateListResult> {
  const repository = dependencies.repository ?? createSupabaseSavedTemplateRepository();

  try {
    const rows = await repository.listTemplatesForUser(userId);
    const templates: ManualWorkoutSavedTemplateView[] = [];

    for (const row of rows) {
      const template = rowToSavedTemplateView(row, userId);

      if (!template.ok) {
        return buildSavedTemplateBlocked({
          reason: template.reason,
          message: template.message,
        });
      }

      templates.push(template.view);
    }

    return {
      ok: true,
      status: "templates_ready",
      sourceKind: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
      templates,
      safety: {
        currentUserScoped: true,
        callsOpenAi: false,
      },
    };
  } catch {
    return buildSavedTemplateBlocked({
      reason: "persistence_failed",
      message: "Personal workout templates could not be loaded.",
    });
  }
}

export async function reviewManualWorkoutSavedTemplateForUser(
  userId: string,
  input: unknown,
  dependencies: ManualWorkoutSavedTemplateDependencies = {},
): Promise<ManualWorkoutSavedTemplateReviewResult> {
  const parsed = manualWorkoutSavedTemplateReviewInputSchema.safeParse(input);

  if (!parsed.success) {
    return buildSavedTemplateBlocked({
      reason: "invalid_input",
      message: "The saved workout template review payload is invalid.",
    });
  }

  const repository = dependencies.repository ?? createSupabaseSavedTemplateRepository();

  try {
    const row = await repository.getTemplateForUser(userId, parsed.data.templateId);

    if (!row) {
      return buildSavedTemplateBlocked({
        reason: "not_found",
        message: "This personal workout template was not found for the current runner.",
      });
    }

    const template = rowToSavedTemplateView(row, userId);

    if (!template.ok) {
      return buildSavedTemplateBlocked({
        reason: template.reason,
        message: template.message,
      });
    }

    const draftInput = buildDraftInputFromSavedTemplate(template.view, parsed.data);
    const review = reviewManualWorkoutDraft(draftInput);

    if (!review.ok) {
      return buildSavedTemplateBlocked({
        reason: review.reason,
        message: review.message,
      });
    }

    return {
      ok: true,
      status: "draft_ready",
      persisted: false,
      sourceKind: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
      sourceStatus: "reconstructed_for_review",
      template: template.view,
      draftInput,
      review,
      safety: {
        reconstructedFromSavedTemplate: true,
        reviewedThroughManualAuthoring: true,
        trustedClientRows: false,
        callsOpenAi: false,
      },
    };
  } catch {
    return buildSavedTemplateBlocked({
      reason: "persistence_failed",
      message: "The personal workout template could not be prepared for review.",
    });
  }
}

function buildSavedTemplateDraftPayload(input: {
  draftInput: unknown;
  reviewChecksum: string;
}):
  | { ok: true; payload: ManualWorkoutSavedTemplateDraftPayload }
  | { ok: false; reason: ManualWorkoutSavedTemplateFailureReason; message: string } {
  const parsedDraft = manualWorkoutDraftInputSchema.safeParse(input.draftInput);

  if (!parsedDraft.success) {
    return {
      ok: false,
      reason: "invalid_review",
      message: "The reviewed manual workout draft is no longer valid.",
    };
  }

  const validation = validateManualWorkoutDraft(parsedDraft.data);

  if (!validation.ok) {
    return {
      ok: false,
      reason: "unsupported_payload",
      message: "The reviewed manual workout cannot be saved as a reusable template.",
    };
  }

  const review = reviewManualWorkoutDraft(parsedDraft.data);

  if (!review.ok) {
    return {
      ok: false,
      reason: review.reason,
      message: review.message,
    };
  }

  return {
    ok: true,
    payload: {
      version: MANUAL_SAVED_WORKOUT_TEMPLATE_PAYLOAD_VERSION,
      templateKey: review.draft.templateKey,
      templateVersion: MANUAL_WORKOUT_TEMPLATE_REGISTRY_VERSION,
      sourceKind: MANUAL_WORKOUT_AUTHORING_SOURCE_KIND,
      sourceReviewPayloadVersion: MANUAL_WORKOUT_REVIEW_PAYLOAD_VERSION,
      sourceReviewChecksum: input.reviewChecksum,
      sourceWorkoutDate: review.draft.workoutDate,
      sourceTitle: review.draft.title,
      sourceNotes: review.draft.notes,
      sourceWorkoutIdentity: review.draft.workoutIdentity,
      sourceWorkoutFamily: review.draft.workoutFamily,
      sourceCalendarIconKey: review.draft.calendarIconKey,
      targetTruthMode: validation.targetTruthMode,
      entries: validation.entries,
      totalDurationMin: review.draft.totalDurationMin,
      totalDistanceKm: review.draft.totalDistanceKm,
      mappingGaps: review.draft.mappingGaps,
    },
  };
}

function buildDraftInputFromSavedTemplate(
  template: ManualWorkoutSavedTemplateView,
  input: ManualWorkoutSavedTemplateReviewInput,
): ManualWorkoutDraftInput {
  return {
    templateKey: template.templateKey,
    workoutDate: input.workoutDate,
    title: input.title ?? template.displayName,
    notes: input.notes !== undefined ? input.notes : template.draftPayload.sourceNotes,
    targetTruthMode: normalizeSavedTemplateTargetTruthMode(template.draftPayload.targetTruthMode),
    entries: template.draftPayload.entries,
    ...(input.context ? { context: input.context } : {}),
  };
}

function rowToSavedTemplateView(
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

  if (
    row.source_kind !== MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND ||
    row.source_status !== MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS ||
    row.workout_source_kind !== MANUAL_WORKOUT_AUTHORING_SOURCE_KIND ||
    row.template_version !== MANUAL_WORKOUT_TEMPLATE_REGISTRY_VERSION
  ) {
    return {
      ok: false,
      reason: "unsupported_payload",
      message: "This saved workout template uses an unsupported source contract.",
    };
  }

  const payload = savedTemplateDraftPayloadSchema.safeParse(row.draft_payload);

  const icon = z.enum(CALENDAR_ICON_KEY_VALUES).safeParse(row.icon_key);

  if (
    !payload.success ||
    !icon.success ||
    payload.data.templateKey !== row.template_key ||
    payload.data.sourceReviewChecksum !== row.source_review_checksum ||
    payload.data.sourceWorkoutIdentity !== row.source_workout_identity ||
    payload.data.sourceWorkoutFamily !== row.source_workout_family ||
    payload.data.targetTruthMode !== row.target_truth_mode
  ) {
    return {
      ok: false,
      reason: "unsupported_payload",
      message: "This saved workout template payload is not supported.",
    };
  }

  const draftInputCheck = manualWorkoutDraftInputSchema.safeParse({
    templateKey: payload.data.templateKey,
    workoutDate: "2026-01-05",
    title: row.display_name,
    notes: payload.data.sourceNotes,
    targetTruthMode: payload.data.targetTruthMode,
    entries: payload.data.entries,
  });

  if (!draftInputCheck.success) {
    return {
      ok: false,
      reason: "unsupported_payload",
      message: "This saved workout template cannot reconstruct a manual draft.",
    };
  }

  return {
    ok: true,
    view: {
      id: row.id,
      displayName: row.display_name,
      iconKey: icon.data as CalendarIconKey,
      templateKey: row.template_key as ManualWorkoutTemplateKey,
      templateVersion: MANUAL_WORKOUT_TEMPLATE_REGISTRY_VERSION,
      sourceKind: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
      sourceStatus: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_STATUS,
      sourceReviewChecksum: row.source_review_checksum,
      sourceWorkoutIdentity: row.source_workout_identity as CanonicalWorkoutIdentity,
      sourceWorkoutFamily: row.source_workout_family as CanonicalWorkoutFamily,
      targetTruthMode: normalizeSavedTemplateTargetTruthMode(row.target_truth_mode),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      draftPayload: payload.data as ManualWorkoutSavedTemplateDraftPayload,
    },
  };
}

function normalizeSavedTemplateTargetTruthMode(value: unknown): ManualWorkoutTargetTruthMode {
  if (value === "none") {
    return "none";
  }

  return "structure_only";
}

async function getCurrentPersistedUserId() {
  const auth = getRequestAuthContext();

  if (!auth.userId) {
    return null;
  }

  try {
    return await getPersistedUserIdForAuthContext(auth);
  } catch {
    return null;
  }
}

function mapSavedTemplateInputIssue(error: z.ZodError): ManualWorkoutSavedTemplateFailureReason {
  const paths = error.issues.map((issue) => issue.path[0]);

  if (paths.includes("displayName")) {
    return "invalid_name";
  }

  if (paths.includes("iconKey")) {
    return "invalid_icon";
  }

  return "invalid_input";
}

function hasControlCharacters(value: string) {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);

    return code <= 31 || code === 127;
  });
}

function buildSavedTemplateBlocked(input: {
  reason: ManualWorkoutSavedTemplateFailureReason;
  message: string;
}): ManualWorkoutSavedTemplateBlockedResult {
  return {
    ok: false,
    status: "blocked",
    persisted: false,
    reason: input.reason,
    message: input.message,
    sourceKind: MANUAL_SAVED_WORKOUT_TEMPLATE_SOURCE_KIND,
  };
}
