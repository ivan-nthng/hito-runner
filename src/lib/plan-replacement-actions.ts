import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { applyImportedPlanForUser } from "@/lib/active-plan-persistence";
import { importedPlanSchema } from "@/lib/imported-plan";
import { generateCanonicalPlanFromText } from "@/lib/openai-plan-authoring";
import { buildPlanScopedStructuredAuthoringMetadata } from "@/lib/plan-authoring-snapshot";
import { type FirstDayResolution, type PlanApplyResult } from "@/lib/plan-apply-policy";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import { requireAuthenticatedUser } from "@/lib/backend/auth";

type ImportedPlanInput = z.infer<typeof importedPlanSchema>;

const firstDayResolutionSchema = z.enum(["replace_first_day", "ignore_first_day"]);
const requestedStartDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date in YYYY-MM-DD format.");

const onboardingInputSchema = z.object({
  importedPlan: importedPlanSchema,
  firstDayResolution: firstDayResolutionSchema.optional().nullable(),
  requestedStartDate: requestedStartDateSchema.optional().nullable(),
});

const textAuthoringInputSchema = z.object({
  authoringText: z.string().trim().min(20).max(4000),
  firstDayResolution: firstDayResolutionSchema.optional().nullable(),
});

export const completeOnboarding = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => onboardingInputSchema.parse(value))
  .handler(async ({ data }) => {
    return persistImportedPlanForCurrentRequest(
      data.importedPlan,
      data.firstDayResolution ?? null,
      data.requestedStartDate ?? null,
    );
  });

export const completeTextOnboarding = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => textAuthoringInputSchema.parse(value))
  .handler(async ({ data }) => {
    const generatedPlan = await generateCanonicalPlanFromText(data.authoringText, {
      enableRichWorkoutDraft: true,
    });
    const applyResult = await persistImportedPlanForCurrentRequest(
      generatedPlan.canonicalPlan,
      data.firstDayResolution ?? null,
      null,
      buildPlanScopedStructuredAuthoringMetadata({
        source: "text_authoring",
        authoringInput: generatedPlan.authoringInput,
        reviewAssumptions: generatedPlan.richDraftMetadata.reviewAssumptions,
      }),
    );

    return applyResult.ok
      ? {
          ...applyResult,
          schemaVersion: generatedPlan.canonicalPlan.schema_version,
          sourceKind: generatedPlan.canonicalPlan.source_kind,
          workoutCount: generatedPlan.canonicalPlan.planned_workouts.length,
          model: generatedPlan.model,
          responseId: generatedPlan.responseId,
          richDraftStatus: generatedPlan.richDraftMetadata.status,
          richDraftFallbackReason: generatedPlan.richDraftMetadata.fallbackReason,
          richDraftResponseId: generatedPlan.richDraftResponseId,
        }
      : {
          ...applyResult,
          schemaVersion: generatedPlan.canonicalPlan.schema_version,
          sourceKind: generatedPlan.canonicalPlan.source_kind,
          workoutCount: generatedPlan.canonicalPlan.planned_workouts.length,
          model: generatedPlan.model,
          responseId: generatedPlan.responseId,
          richDraftStatus: generatedPlan.richDraftMetadata.status,
          richDraftFallbackReason: generatedPlan.richDraftMetadata.fallbackReason,
          richDraftResponseId: generatedPlan.richDraftResponseId,
          importedPlan: generatedPlan.canonicalPlan,
        };
  });

async function persistImportedPlanForCurrentRequest(
  importedPlan: ImportedPlanInput,
  firstDayResolution: FirstDayResolution | null,
  requestedStartDate: string | null = null,
  planMetadata: Parameters<typeof applyImportedPlanForUser>[5] = null,
): Promise<PlanApplyResult> {
  const auth = requireAuthenticatedUser();
  const persistedUserId = await getPersistedUserIdForAuthContext(auth);

  if (!persistedUserId) {
    throw new Error("Authentication is required for this action.");
  }

  return applyImportedPlanForUser(
    persistedUserId,
    importedPlan,
    firstDayResolution,
    requestedStartDate,
    null,
    planMetadata,
  );
}
