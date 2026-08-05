import "@tanstack/react-start/server-only";

import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { RUNNER_RECORD_STANDARD_DISTANCES } from "@/lib/runner-activity/metric-formulas";

const activityRevisionInputSchema = z.object({
  activityId: z.string().uuid(),
  activityRevisionId: z.string().uuid(),
});

const sessionRpeInputSchema = activityRevisionInputSchema.extend({
  rpe: z.number().int().min(1).max(10),
  outcome: z.enum(["completed", "partial"]),
  expectedEvidenceRevisionId: z.string().uuid().nullable().default(null),
});

const officialResultInputSchema = activityRevisionInputSchema.extend({
  distanceMeters: z
    .number()
    .positive()
    .refine(
      (value) =>
        RUNNER_RECORD_STANDARD_DISTANCES.some(
          (distance) => Math.abs(distance.meters - value) <= 0.0001,
        ),
      "Choose one accepted standard record distance.",
    ),
  elapsedSeconds: z.number().positive(),
  eventDate: z.string().date(),
  context: z.string().trim().max(200).nullable().default(null),
});

type EvidenceKind = "session_rpe" | "official_result";

type RunnerActivityEvidenceReceipt = {
  activityId: string;
  activityRevisionId: string;
  evidenceRevisionId: string;
  revisionNumber: number;
  reusedExactEvidence: boolean;
};

export async function recordRunnerActivitySessionRpeForUser(
  userId: string,
  value: z.input<typeof sessionRpeInputSchema>,
) {
  const input = sessionRpeInputSchema.parse(value);
  const receipt = await appendEvidence({
    userId,
    activityId: input.activityId,
    activityRevisionId: input.activityRevisionId,
    evidenceKind: "session_rpe",
    lifecycleState: "asserted",
    sessionRpe: input.rpe,
    completionOutcome: input.outcome,
    origin: "runner_direct",
    changeReason: input.expectedEvidenceRevisionId ? "correction" : "initial",
    expectedPredecessorId: input.expectedEvidenceRevisionId,
  });
  return evidenceMutationReadback(userId, receipt);
}

export async function confirmRunnerActivityOfficialResultForUser(
  userId: string,
  value: z.input<typeof officialResultInputSchema>,
) {
  const input = officialResultInputSchema.parse(value);
  const receipt = await appendEvidence({
    userId,
    activityId: input.activityId,
    activityRevisionId: input.activityRevisionId,
    evidenceKind: "official_result",
    lifecycleState: "asserted",
    officialDistanceM: input.distanceMeters,
    officialElapsedSeconds: input.elapsedSeconds,
    officialEventDate: input.eventDate,
    officialContext: input.context || null,
    origin: "runner_direct",
    changeReason: "initial",
  });
  return evidenceMutationReadback(userId, receipt);
}

export async function correctRunnerActivityOfficialResultForUser(
  userId: string,
  value: z.input<typeof officialResultInputSchema> & { expectedEvidenceRevisionId: string },
) {
  const input = officialResultInputSchema
    .extend({ expectedEvidenceRevisionId: z.string().uuid() })
    .parse(value);
  const receipt = await appendEvidence({
    userId,
    activityId: input.activityId,
    activityRevisionId: input.activityRevisionId,
    evidenceKind: "official_result",
    lifecycleState: "asserted",
    officialDistanceM: input.distanceMeters,
    officialElapsedSeconds: input.elapsedSeconds,
    officialEventDate: input.eventDate,
    officialContext: input.context || null,
    origin: "runner_direct",
    changeReason: "correction",
    expectedPredecessorId: input.expectedEvidenceRevisionId,
  });
  return evidenceMutationReadback(userId, receipt);
}

export async function withdrawRunnerActivityOfficialResultForUser(
  userId: string,
  value: z.input<typeof activityRevisionInputSchema> & { expectedEvidenceRevisionId: string },
) {
  const input = activityRevisionInputSchema
    .extend({ expectedEvidenceRevisionId: z.string().uuid() })
    .parse(value);
  const receipt = await appendEvidence({
    userId,
    activityId: input.activityId,
    activityRevisionId: input.activityRevisionId,
    evidenceKind: "official_result",
    lifecycleState: "withdrawn",
    origin: "runner_direct",
    changeReason: "withdrawal",
    expectedPredecessorId: input.expectedEvidenceRevisionId,
  });
  return evidenceMutationReadback(userId, receipt);
}

export async function readCurrentRunnerActivityEvidenceForUser(input: {
  userId: string;
  activityId: string;
  evidenceKind: EvidenceKind;
}) {
  const parsed = z
    .object({
      userId: z.string().uuid(),
      activityId: z.string().uuid(),
      evidenceKind: z.enum(["session_rpe", "official_result"]),
    })
    .parse(input);
  const result = await createAdminSupabaseClient()
    .from("runner_activity_evidence_revisions")
    .select("*")
    .eq("user_id", parsed.userId)
    .eq("activity_id", parsed.activityId)
    .eq("evidence_kind", parsed.evidenceKind)
    .order("revision_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

async function appendEvidence(input: {
  userId: string;
  activityId: string;
  activityRevisionId: string;
  evidenceKind: EvidenceKind;
  lifecycleState: "asserted" | "withdrawn";
  sessionRpe?: number;
  completionOutcome?: "completed" | "partial" | "skipped";
  officialDistanceM?: number;
  officialElapsedSeconds?: number;
  officialEventDate?: string;
  officialContext?: string | null;
  origin: "runner_direct";
  changeReason: "initial" | "correction" | "withdrawal";
  expectedPredecessorId?: string | null;
}): Promise<RunnerActivityEvidenceReceipt> {
  const result = await createAdminSupabaseClient().rpc("append_runner_activity_evidence_revision", {
    p_user_id: input.userId,
    p_activity_id: input.activityId,
    p_expected_activity_revision_id: input.activityRevisionId,
    p_evidence_kind: input.evidenceKind,
    p_lifecycle_state: input.lifecycleState,
    p_session_rpe: input.sessionRpe ?? null,
    p_completion_outcome: input.completionOutcome ?? null,
    p_official_distance_m: input.officialDistanceM ?? null,
    p_official_elapsed_seconds: input.officialElapsedSeconds ?? null,
    p_official_event_date: input.officialEventDate ?? null,
    p_official_context: input.officialContext ?? null,
    p_origin: input.origin,
    p_workout_log_id: null,
    p_change_reason: input.changeReason,
    p_captured_at: new Date().toISOString(),
    p_expected_predecessor_id: input.expectedPredecessorId ?? null,
  });
  if (result.error || !result.data?.[0]) {
    throw new Error(result.error?.message ?? "Runner activity evidence was not saved.");
  }
  const row = result.data[0];
  return {
    activityId: input.activityId,
    activityRevisionId: input.activityRevisionId,
    evidenceRevisionId: row.evidence_revision_id,
    revisionNumber: row.revision_number,
    reusedExactEvidence: row.reused_exact_evidence,
  };
}

async function evidenceMutationReadback(userId: string, evidence: RunnerActivityEvidenceReceipt) {
  const { getRunnerActivityProgressForUser } = await import("@/lib/runner-activity/read-model");
  return {
    evidence,
    progress: await getRunnerActivityProgressForUser({
      userId,
      creationCause: "evidence_mutation",
    }),
  };
}
