import type { AdaptiveContinuationInput } from "@/lib/adaptive-blueprint-product-contract";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const continuationPreferenceSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("avoid_projection_date"),
      projectionId: z.string().min(1).max(160),
      date: isoDateSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("swap_projection_slots"),
      firstProjectionId: z.string().min(1).max(160),
      secondProjectionId: z.string().min(1).max(160),
    })
    .strict(),
]);
const horizonCheckInSchema = z
  .object({
    confirmationId: z.string().uuid(),
    goalAssumptionCurrent: z.boolean(),
    availabilityConfirmed: z.boolean(),
    manageability: z.enum(["too_much", "manageable", "too_little"]),
    materialChangeReason: z.string().max(500).nullable(),
    healthLimitation: z.enum(["no", "yes", "unsure"]),
    interruptionStatus: z.enum(["none", "resolved", "unresolved"]),
    clinicianGuidance: z.enum([
      "not_applicable",
      "permits_running",
      "restricts_running",
      "unclear",
    ]),
  })
  .strict();
const continuationInputSchema: z.ZodType<AdaptiveContinuationInput> = z
  .object({
    expectedBlueprint: z
      .object({
        id: z.string().uuid(),
        version: z.number().int().positive(),
        sha256: sha256Schema,
      })
      .strict(),
    expectedConfirmationId: z.string().uuid(),
    activeProjectionPreferences: z.array(continuationPreferenceSchema).max(64),
    horizonCheckIn: horizonCheckInSchema.nullable(),
  })
  .strict();
const prepareInputSchema = z.object({}).strict();

export const submitAdaptiveContinuationInputAction = createServerFn({ method: "POST" })
  .validator((value: unknown) => continuationInputSchema.parse(value))
  .handler(async ({ data }) => submitAdaptiveContinuationInputForServer(data));

export const prepareAdaptiveContinuationCandidateAction = createServerFn({ method: "POST" })
  .validator((value: unknown) => prepareInputSchema.parse(value))
  .handler(async () => prepareAdaptiveContinuationCandidateForServer());

const submitAdaptiveContinuationInputForServer = createServerOnlyFn(
  async (input: AdaptiveContinuationInput) => {
    const { submitAdaptiveContinuationInputForCurrentRequest } =
      await import("@/lib/adaptive-blueprint-actions.server");

    return submitAdaptiveContinuationInputForCurrentRequest(input);
  },
);

const prepareAdaptiveContinuationCandidateForServer = createServerOnlyFn(async () => {
  const { prepareAdaptiveContinuationCandidateForCurrentRequest } =
    await import("@/lib/adaptive-blueprint-actions.server");

  return prepareAdaptiveContinuationCandidateForCurrentRequest();
});
