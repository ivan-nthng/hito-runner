import { createHash } from "node:crypto";
import { z } from "zod";
import {
  manualWorkoutDraftInputSchema,
  type ManualWorkoutCanonicalDraft,
  type ManualWorkoutDraftConflict,
  type ManualWorkoutDraftIssue,
  type ManualWorkoutDraftReviewResult,
  type ParsedManualWorkoutDraftInput,
} from "@/lib/manual-workout-authoring/schema";
import { normalizeManualWorkoutDraft } from "@/lib/manual-workout-authoring/normalize";
import { validateManualWorkoutDraft } from "@/lib/manual-workout-authoring/validator";

type ManualWorkoutDraftRejectionReason = Extract<
  ManualWorkoutDraftReviewResult,
  { ok: false }
>["reason"];

export function reviewManualWorkoutDraft(input: unknown): ManualWorkoutDraftReviewResult {
  const parsed = manualWorkoutDraftInputSchema.safeParse(input);

  if (!parsed.success) {
    return rejectManualWorkoutDraft({
      reason: "invalid_input",
      message: "Manual workout draft input is invalid.",
      issues: parsed.error.issues.map(zodIssueToManualIssue),
      conflicts: [],
    });
  }

  const lifecycleConflict = buildLifecycleConflict(parsed.data);

  if (lifecycleConflict) {
    return rejectManualWorkoutDraft({
      reason:
        lifecycleConflict.code === "existing_active_plan_not_supported"
          ? "active_plan_conflict"
          : "protected_date_conflict",
      message: lifecycleConflict.message,
      issues: [
        {
          code:
            lifecycleConflict.code === "existing_active_plan_not_supported"
              ? "active_plan_conflict"
              : "protected_date_conflict",
          message: lifecycleConflict.message,
          path: ["context"],
        },
      ],
      conflicts: [lifecycleConflict],
    });
  }

  const validation = validateManualWorkoutDraft(parsed.data);

  if (!validation.ok) {
    return rejectManualWorkoutDraft({
      reason: deriveRejectionReason(validation.issues),
      message: validation.issues[0]?.message ?? "Manual workout draft was rejected.",
      issues: validation.issues,
      conflicts: [],
    });
  }

  const normalized = normalizeManualWorkoutDraft({
    parsedInput: parsed.data,
    template: validation.template,
    targetTruthMode: validation.targetTruthMode,
    entries: validation.entries,
  });
  const exactnessPayload = buildManualWorkoutReviewExactnessPayload(normalized.draft);
  const reviewChecksum = stableSha256(exactnessPayload);

  return {
    ok: true,
    status: "draft_ready",
    draft: normalized.draft,
    review: {
      headline: `${normalized.draft.title} is ready for review.`,
      bullets: [
        `Template: ${normalized.draft.templateKey}.`,
        normalized.draft.workoutType === "rest"
          ? "Rest day has no executable run targets."
          : `Executable structure: ${normalized.draft.steps.length} segment${normalized.draft.steps.length === 1 ? "" : "s"}, ${normalized.draft.totalDurationMin} min planned duration.`,
        "No Supabase write happens in this review step.",
      ],
      warnings: normalized.reviewWarnings,
    },
    reviewToken: `manual-workout-review-v1.${reviewChecksum}`,
    reviewChecksum,
    exactnessPayloadVersion: "manual_workout_review_payload_v1",
    conflicts: [],
  };
}

export function buildManualWorkoutReviewExactnessPayload(draft: ManualWorkoutCanonicalDraft) {
  return {
    version: "manual_workout_review_payload_v1",
    sourceKind: draft.sourceKind,
    sourceStatus: draft.sourceStatus,
    persisted: draft.persisted,
    templateKey: draft.templateKey,
    workoutDate: draft.workoutDate,
    weekday: draft.weekday,
    title: draft.title,
    notes: draft.notes,
    workoutType: draft.workoutType,
    sourceWorkoutType: draft.sourceWorkoutType,
    workoutFamily: draft.workoutFamily,
    workoutIdentity: draft.workoutIdentity,
    calendarIconKey: draft.calendarIconKey,
    metricMode: draft.metricMode,
    steps: draft.steps,
    plannedRpe: draft.plannedRpe,
    estimatedFatigue: draft.estimatedFatigue,
    recoveryPriority: draft.recoveryPriority,
    totalDurationMin: draft.totalDurationMin,
    totalDistanceKm: draft.totalDistanceKm,
  };
}

function buildLifecycleConflict(
  input: ParsedManualWorkoutDraftInput,
): ManualWorkoutDraftConflict | null {
  const context = input.context ?? {
    mode: "no_active_plan_draft" as const,
    targetDateProtection: "none" as const,
  };

  if (context.mode === "existing_active_plan") {
    return {
      code: "existing_active_plan_not_supported",
      message:
        "Manual workout authoring v1 is review-only for no-active-plan or user-built-plan draft contexts.",
      workoutDate: input.workoutDate,
      activePlanId: context.activePlanId ?? null,
    };
  }

  if (context.targetDateProtection === "none") {
    return null;
  }

  return {
    code:
      context.targetDateProtection === "provider_evidence" ||
      context.targetDateProtection === "actual_metrics" ||
      context.targetDateProtection === "comparison_or_ai_insight"
        ? "protected_provider_or_analysis"
        : "protected_past_or_history",
    message: `Manual workout authoring is blocked for ${context.targetDateProtection} on ${input.workoutDate}.`,
    workoutDate: input.workoutDate,
    activePlanId: context.activePlanId ?? null,
  };
}

function rejectManualWorkoutDraft(input: {
  reason: ManualWorkoutDraftRejectionReason;
  message: string;
  issues: ManualWorkoutDraftIssue[];
  conflicts: ManualWorkoutDraftConflict[];
}): ManualWorkoutDraftReviewResult {
  return {
    ok: false,
    status: "draft_rejected",
    reason: input.reason,
    message: input.message,
    issues: input.issues,
    conflicts: input.conflicts,
    persisted: false,
  };
}

function deriveRejectionReason(
  issues: ManualWorkoutDraftIssue[],
): ManualWorkoutDraftRejectionReason {
  if (issues.some((issue) => issue.code === "unsupported_mapping")) {
    return "unsupported_mapping";
  }

  if (issues.some((issue) => issue.code === "unsupported_template")) {
    return "unsupported_template";
  }

  if (issues.some((issue) => issue.code === "unsafe_metric_truth")) {
    return "unsafe_metric_truth";
  }

  return "unsafe_block_structure";
}

function zodIssueToManualIssue(issue: z.ZodIssue): ManualWorkoutDraftIssue {
  return {
    code: "invalid_input",
    message: issue.message,
    path: issue.path,
  };
}

function stableSha256(value: unknown) {
  return createHash("sha256").update(stableJsonStringify(value)).digest("hex");
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, sortJsonValue(nestedValue)]),
    );
  }

  return value;
}
