import { z } from "zod";
import type { CapabilityLockedResponse } from "@/lib/entitlements/types";
import type { ActivePlanRefreshProposal } from "@/lib/plan-refresh-proposal";
import type { TrainingSnapshot } from "@/lib/training";

const requestedStartDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date in YYYY-MM-DD format.");

export const activePlanRefreshProposalInputSchema = z.object({
  runnerPrompt: z.string().trim().min(8).max(1200),
});

const activePlanRefreshFingerprintSchema = z.object({
  schemaVersion: z.literal("active-plan-refresh-fingerprint-v1"),
  today: requestedStartDateSchema,
  activePlanId: z.string().uuid(),
  activePlanUpdatedAt: z.string().trim().min(1),
  firstMutableDate: requestedStartDateSchema.nullable(),
  lastMutableDate: requestedStartDateSchema.nullable(),
  weekdayRestInvariantSignature: z.string().trim(),
  remainingScheduleSignature: z.array(z.string()).max(80),
  recentHistorySignature: z.array(z.string()).max(80),
});

export const activePlanRefreshApplyInputSchema = z.object({
  proposal: z.object({
    model: z.string().trim().min(1),
    responseId: z.string().trim().min(1).nullable(),
    output: z.object({
      proposalStatus: z.literal("proposal_only"),
      applyContext: z.object({
        generatedAt: z.string().trim().min(1),
        fingerprint: activePlanRefreshFingerprintSchema,
      }),
      review: z.object({
        summary: z.string().trim().min(1).max(400),
        proposedChanges: z.array(z.string().trim().min(1).max(220)).min(1).max(8),
      }),
      safety: z.object({
        requiresExplicitApply: z.literal(true),
        preservesPastAndLoggedHistory: z.literal(true),
        doesNotMutatePlan: z.literal(true),
      }),
      recommendedAuthoringPrompt: z.string().trim().min(20).max(1600),
    }),
  }),
});

export type ActivePlanRefreshProposalInput = z.output<typeof activePlanRefreshProposalInputSchema>;

export type ActivePlanRefreshApplyPayload = z.output<
  typeof activePlanRefreshApplyInputSchema
>["proposal"];

export type ProposeActivePlanRefreshResult =
  | {
      ok: true;
      proposal: ActivePlanRefreshProposal;
    }
  | CapabilityLockedResponse;

export type ApplyActivePlanRefreshProposalResult =
  | {
      ok: true;
      status: "applied";
      archivedPlanId: string;
      activePlanId: string;
      fixedWorkoutCount: number;
      refreshedWorkoutCount: number;
      snapshot: TrainingSnapshot;
    }
  | {
      ok: false;
      status: "stale";
      reason: "stale_proposal";
      message: string;
    }
  | {
      ok: false;
      status: "blocked";
      reason: "invalid_refresh_plan";
      message: string;
    };
