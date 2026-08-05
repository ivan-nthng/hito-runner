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
    return persistImportedPlanForCurrentRequest(
      data.importedPlan,
      data.firstDayResolution ?? null,
      data.requestedStartDate ?? null,
      data.clearBeforeImport ?? false,
    );
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
