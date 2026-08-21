import type { PersistedPlannedWorkoutRow } from "@/lib/runner-calendar-persistence";
import type { Json } from "@/lib/supabase/database";
import {
  buildManualWorkoutReviewToken,
  stableManualWorkoutChecksum64Hex,
  validateManualWorkoutReviewProof,
} from "@/lib/manual-workout-authoring/review-exactness";
import { CALENDAR_ICON_KEY_VALUES, type CalendarIconKey } from "@/lib/rich-workout-model";
import { normalizeWorkoutDocument, type WorkoutDocument } from "@/lib/workout-document";

export const WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION = "workout_command_review_v1" as const;
export const WORKOUT_COMMAND_SAVED_TEMPLATE_PAYLOAD_VERSION =
  "workout_document_content_template_v1" as const;

const WORKOUT_COMMAND_REVIEW_TOKEN_PREFIX = "workout-command-review-v1.";
const WORKOUT_TEMPLATE_DISPLAY_NAME_MAX_LENGTH = 80;
const ISO_CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type WorkoutCommandMoveTargetPolicy = {
  targetDayKind: "rest_day" | "workout_day";
  targetReplacementWorkoutId: string | null;
  restDisplacement: "none" | "stored_rest";
};

export type WorkoutCommandMoveExpectedFingerprints = {
  source: Json;
  target: Json;
};

export type WorkoutCommand =
  | {
      operation: "materialize";
      documents: WorkoutDocument[];
      provenanceReferences: Json[];
    }
  | {
      operation: "replace_document";
      workoutId: string;
      document: WorkoutDocument;
      expectedFingerprint: Json;
      provenanceReference: Json;
    }
  | {
      operation: "save_template";
      document: WorkoutDocument;
      displayName: string;
      iconKey: CalendarIconKey;
      expectedFingerprint?: Json;
      provenanceReference: Json;
    }
  | {
      operation: "copy";
      workoutId: string;
      targetDate: string;
      expectedFingerprint: Json;
      document?: never;
    }
  | {
      operation: "move";
      workoutId: string;
      targetDate: string;
      targetPolicy: WorkoutCommandMoveTargetPolicy;
      expectedFingerprints: WorkoutCommandMoveExpectedFingerprints;
      document?: never;
    }
  | {
      operation: "delete";
      workoutId: string;
      expectedFingerprint: Json;
      document?: never;
    }
  | {
      operation: "clear";
      workoutDate: string;
      expectedFingerprint: Json;
      document?: never;
    };

export type WorkoutCommandInput =
  | {
      operation: "materialize";
      documents: readonly unknown[];
      provenanceReferences: readonly Json[];
    }
  | {
      operation: "replace_document";
      workoutId: string;
      document: unknown;
      expectedFingerprint: Json;
      provenanceReference: Json;
    }
  | {
      operation: "save_template";
      document: unknown;
      displayName: string;
      iconKey: CalendarIconKey;
      expectedFingerprint?: Json;
      provenanceReference: Json;
    }
  | {
      operation: "copy";
      workoutId: string;
      targetDate: string;
      expectedFingerprint?: Json;
    }
  | {
      operation: "move";
      workoutId: string;
      targetDate: string;
      targetPolicy?: WorkoutCommandMoveTargetPolicy;
      expectedFingerprints?: WorkoutCommandMoveExpectedFingerprints;
    }
  | {
      operation: "delete";
      workoutId: string;
      expectedFingerprint?: Json;
    }
  | {
      operation: "clear";
      workoutDate: string;
      expectedFingerprint?: Json;
    };

export interface WorkoutCommandCollision {
  code: "duplicate_candidate_date" | "occupied_date";
  workoutDate: string;
}

export interface WorkoutCommandReviewIssue {
  code:
    | "invalid_document"
    | "invalid_operation"
    | "invalid_provenance"
    | "invalid_template"
    | "stale_reference"
    | "protected_operation"
    | "calendar_collision"
    | "not_found"
    | "persistence_failed";
  message: string;
  path: Array<string | number>;
}

export interface ReviewedWorkoutCommandCandidate {
  candidateId: string;
  command: WorkoutCommand;
  issues: [];
  warnings: string[];
  collisions: WorkoutCommandCollision[];
  reviewChecksum: string;
  reviewToken: string;
  expiresAt: null;
}

export type WorkoutCommandReviewResult =
  | { ok: true; candidate: ReviewedWorkoutCommandCandidate }
  | { ok: false; issues: WorkoutCommandReviewIssue[] };

export function reviewWorkoutCommand(input: {
  command: WorkoutCommandInput;
  warnings?: readonly string[];
  collisions?: readonly WorkoutCommandCollision[];
}): WorkoutCommandReviewResult {
  const normalized = normalizeWorkoutCommand(input.command);
  if (!normalized.ok) {
    return normalized;
  }

  const command = normalized.command;
  const warnings = [...(input.warnings ?? [])];
  const collisions = [...materializeDuplicateDateCollisions(command), ...(input.collisions ?? [])];
  const reviewChecksum = workoutCommandChecksum({ command, warnings, collisions });

  return {
    ok: true,
    candidate: {
      candidateId: workoutCommandCandidateId(reviewChecksum),
      command,
      issues: [],
      warnings,
      collisions,
      reviewChecksum,
      reviewToken: buildManualWorkoutReviewToken(
        WORKOUT_COMMAND_REVIEW_TOKEN_PREFIX,
        reviewChecksum,
      ),
      expiresAt: null,
    },
  };
}

export function confirmWorkoutCommand(input: {
  candidate: ReviewedWorkoutCommandCandidate;
  candidateId: string;
  reviewToken: string;
  reviewChecksum: string;
}):
  | { ok: true; candidate: ReviewedWorkoutCommandCandidate }
  | { ok: false; reason: "invalid_review" | "stale_review" | "collision"; message: string } {
  if (input.candidate.collisions.length > 0) {
    return {
      ok: false,
      reason: "collision",
      message: "The reviewed Workout command has a Calendar date collision.",
    };
  }

  const rebuiltChecksum = workoutCommandChecksum({
    command: input.candidate.command,
    warnings: input.candidate.warnings,
    collisions: input.candidate.collisions,
  });
  if (
    input.candidateId !== input.candidate.candidateId ||
    rebuiltChecksum !== input.candidate.reviewChecksum
  ) {
    return {
      ok: false,
      reason: "stale_review",
      message: "The Workout command no longer matches the server review.",
    };
  }

  const proof = validateManualWorkoutReviewProof({
    expectedChecksum: input.candidate.reviewChecksum,
    reviewChecksum: input.reviewChecksum,
    reviewToken: input.reviewToken,
    tokenPrefix: WORKOUT_COMMAND_REVIEW_TOKEN_PREFIX,
  });

  return proof.ok
    ? { ok: true, candidate: input.candidate }
    : {
        ok: false,
        reason: proof.reason,
        message:
          proof.reason === "stale_review"
            ? "The Workout command review no longer matches server truth."
            : "The Workout command review token is invalid.",
      };
}

export function workoutCommandCandidateId(reviewChecksum: string) {
  return `workout-command-${reviewChecksum.slice(0, 32)}`;
}

export function buildFullCalendarWorkoutFingerprint(workout: PersistedPlannedWorkoutRow): Json {
  return { ...workout } as Json;
}

export function rejectWorkoutCommandReview(
  code: WorkoutCommandReviewIssue["code"],
  message: string,
  path: Array<string | number>,
): Extract<WorkoutCommandReviewResult, { ok: false }> {
  return { ok: false, issues: [{ code, message, path }] };
}

function normalizeWorkoutCommand(
  input: WorkoutCommandInput,
): { ok: true; command: WorkoutCommand } | { ok: false; issues: WorkoutCommandReviewIssue[] } {
  if (input.operation === "materialize") {
    if (input.documents.length === 0) {
      return invalidCommand("Materialisation requires at least one WorkoutDocument.", [
        "command",
        "documents",
      ]);
    }
    if (input.provenanceReferences.length !== input.documents.length) {
      return {
        ok: false,
        issues: [
          {
            code: "invalid_provenance",
            message: "Every materialised WorkoutDocument requires one provenance reference.",
            path: ["command", "provenanceReferences"],
          },
        ],
      };
    }

    const documents = normalizeCommandDocuments(input.documents, ["command", "documents"]);
    return documents.ok
      ? {
          ok: true,
          command: {
            operation: "materialize",
            documents: documents.documents,
            provenanceReferences: [...input.provenanceReferences],
          },
        }
      : documents;
  }

  if (input.operation === "copy") {
    if (
      !input.workoutId.trim() ||
      !ISO_CALENDAR_DATE_PATTERN.test(input.targetDate) ||
      !isJsonObject(input.expectedFingerprint ?? null)
    ) {
      return invalidCommand(
        "Copy requires one identified Calendar workout, target date and source fingerprint.",
        ["command", "workoutId"],
      );
    }
    return {
      ok: true,
      command: {
        operation: "copy",
        workoutId: input.workoutId,
        targetDate: input.targetDate,
        expectedFingerprint: input.expectedFingerprint!,
      },
    };
  }

  if (input.operation === "move") {
    const policy = input.targetPolicy;
    const replacementId = policy?.targetReplacementWorkoutId;
    const targetFingerprint = input.expectedFingerprints?.target;
    const policyIsConsistent =
      policy !== undefined &&
      input.expectedFingerprints !== undefined &&
      ((replacementId === null &&
        targetFingerprint === null &&
        policy.targetDayKind === "rest_day" &&
        policy.restDisplacement === "none") ||
        (Boolean(replacementId?.trim()) &&
          isJsonObject(targetFingerprint ?? null) &&
          ((policy.targetDayKind === "rest_day" && policy.restDisplacement === "stored_rest") ||
            (policy.targetDayKind === "workout_day" && policy.restDisplacement === "none"))));
    if (
      !input.workoutId.trim() ||
      !ISO_CALENDAR_DATE_PATTERN.test(input.targetDate) ||
      !isJsonObject(input.expectedFingerprints?.source ?? null) ||
      !policyIsConsistent
    ) {
      return invalidCommand(
        "Move requires exact source, target policy and authoritative Calendar fingerprints.",
        ["command", "expectedFingerprints"],
      );
    }
    return {
      ok: true,
      command: {
        operation: "move",
        workoutId: input.workoutId,
        targetDate: input.targetDate,
        targetPolicy: { ...policy! },
        expectedFingerprints: { ...input.expectedFingerprints! },
      },
    };
  }

  if (input.operation === "delete") {
    if (!input.workoutId.trim() || !isJsonObject(input.expectedFingerprint ?? null)) {
      return invalidCommand("Delete requires one identified Calendar workout fingerprint.", [
        "command",
        "workoutId",
      ]);
    }
    return {
      ok: true,
      command: {
        operation: "delete",
        workoutId: input.workoutId,
        expectedFingerprint: input.expectedFingerprint!,
      },
    };
  }

  if (input.operation === "clear") {
    if (
      !ISO_CALENDAR_DATE_PATTERN.test(input.workoutDate) ||
      !isJsonObject(input.expectedFingerprint ?? null)
    ) {
      return invalidCommand(
        "Clear requires one Calendar date and authoritative workout fingerprint.",
        ["command", "workoutDate"],
      );
    }
    return {
      ok: true,
      command: {
        operation: "clear",
        workoutDate: input.workoutDate,
        expectedFingerprint: input.expectedFingerprint!,
      },
    };
  }

  const document = normalizeWorkoutDocument(input.document);
  if (!document.ok) {
    return {
      ok: false,
      issues: [
        {
          code: "invalid_document",
          message: document.message,
          path: ["command", "document"],
        },
      ],
    };
  }

  if (input.operation === "replace_document") {
    if (!input.workoutId.trim() || !isJsonObject(input.expectedFingerprint)) {
      return invalidCommand(
        "Replacing a WorkoutDocument requires one identified Calendar workout fingerprint.",
        ["command", "workoutId"],
      );
    }

    return {
      ok: true,
      command: {
        operation: "replace_document",
        workoutId: input.workoutId,
        document: document.value,
        expectedFingerprint: input.expectedFingerprint,
        provenanceReference: input.provenanceReference,
      },
    };
  }

  const displayName = input.displayName.trim().replace(/\s+/g, " ");
  if (
    !displayName ||
    displayName.length > WORKOUT_TEMPLATE_DISPLAY_NAME_MAX_LENGTH ||
    !CALENDAR_ICON_KEY_VALUES.includes(input.iconKey)
  ) {
    return {
      ok: false,
      issues: [
        {
          code: "invalid_template",
          message: "Saving a Workout template requires valid catalog metadata.",
          path: ["command", !displayName ? "displayName" : "iconKey"],
        },
      ],
    };
  }

  return {
    ok: true,
    command: {
      operation: "save_template",
      document: document.value,
      displayName,
      iconKey: input.iconKey,
      ...(input.expectedFingerprint !== undefined
        ? { expectedFingerprint: input.expectedFingerprint }
        : {}),
      provenanceReference: input.provenanceReference,
    },
  };
}

function normalizeCommandDocuments(
  documents: readonly unknown[],
  path: Array<string | number>,
): { ok: true; documents: WorkoutDocument[] } | { ok: false; issues: WorkoutCommandReviewIssue[] } {
  const canonicalDocuments: WorkoutDocument[] = [];
  const issues: WorkoutCommandReviewIssue[] = [];

  documents.forEach((document, index) => {
    const normalized = normalizeWorkoutDocument(document);
    if (!normalized.ok) {
      issues.push({
        code: "invalid_document",
        message: normalized.message,
        path: [...path, index],
      });
      return;
    }
    canonicalDocuments.push(normalized.value);
  });

  return issues.length > 0 ? { ok: false, issues } : { ok: true, documents: canonicalDocuments };
}

function materializeDuplicateDateCollisions(command: WorkoutCommand) {
  if (command.operation !== "materialize") return [];

  return Array.from(
    command.documents.reduce((dates, document) => {
      dates.set(document.workoutDate, (dates.get(document.workoutDate) ?? 0) + 1);
      return dates;
    }, new Map<string, number>()),
  )
    .filter(([, count]) => count > 1)
    .map(([workoutDate]) => ({
      code: "duplicate_candidate_date" as const,
      workoutDate,
    }));
}

function workoutCommandChecksum(input: {
  command: WorkoutCommand;
  warnings: readonly string[];
  collisions: readonly WorkoutCommandCollision[];
}) {
  return stableManualWorkoutChecksum64Hex({
    version: WORKOUT_COMMAND_REVIEW_PAYLOAD_VERSION,
    command: input.command,
    warnings: input.warnings,
    collisions: input.collisions,
  });
}

function invalidCommand(
  message: string,
  path: Array<string | number>,
): { ok: false; issues: WorkoutCommandReviewIssue[] } {
  return {
    ok: false,
    issues: [{ code: "invalid_operation", message, path }],
  };
}

function isJsonObject(value: Json): value is { [key: string]: Json | undefined } {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
