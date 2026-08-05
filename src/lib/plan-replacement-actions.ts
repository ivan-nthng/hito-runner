import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { applyImportedPlanForUser } from "@/lib/active-plan-persistence";
import { importedPlanSchema } from "@/lib/imported-plan";
import { type FirstDayResolution } from "@/lib/plan-apply-policy";
import { requirePersistedUserIdForCurrentRequest } from "@/lib/request-persisted-user";

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
  clearBeforeImport: z.boolean().optional(),
});

export const completeOnboarding = createServerFn({ method: "POST" })
  .validator((value: unknown) => onboardingInputSchema.parse(value))
  .handler(async ({ data }) => {
    try {
      return await persistImportedPlanForCurrentRequest(
        data.importedPlan,
        data.firstDayResolution ?? null,
        data.requestedStartDate ?? null,
        data.clearBeforeImport ?? false,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        [
          "Authentication is required for this action.",
          "A first plan cannot be created while another active plan exists.",
          "An empty active plan cannot be created while another active plan exists.",
          "Atomic plan replacement did not return the archived plan.",
          "The current schedule changed before clear-before-import could be applied.",
        ].includes(error.message)
      ) {
        throw error;
      }

      console.error("[server-action/complete-onboarding] unexpected failure", error);
      throw new Error("The imported plan could not be saved. Try again shortly.");
    }
  });

async function persistImportedPlanForCurrentRequest(
  importedPlan: ImportedPlanInput,
  firstDayResolution: FirstDayResolution | null,
  requestedStartDate: string | null = null,
  clearBeforeImport = false,
) {
  return applyImportedPlanForUser(
    await requirePersistedUserIdForCurrentRequest(),
    importedPlan,
    firstDayResolution,
    requestedStartDate,
    null,
    { clearBeforeImport },
  );
}
