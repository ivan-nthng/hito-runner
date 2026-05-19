import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getActivePlan, getPlanWorkouts } from "@/lib/active-plan-persistence";
import {
  buildActivePlanExportPayload,
  buildPlanExportDocument,
  type PlanExportDocument,
} from "@/lib/plan-export";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import { requireAuthenticatedUser } from "@/lib/backend/auth";

const planExportInputSchema = z.object({
  format: z.enum(["json", "markdown"]),
});

export interface ExportActivePlanResult extends PlanExportDocument {
  ok: true;
}

export const exportActivePlan = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => planExportInputSchema.parse(value))
  .handler(async ({ data }): Promise<ExportActivePlanResult> => {
    const auth = requireAuthenticatedUser();
    const persistedUserId = await getPersistedUserIdForAuthContext(auth);

    if (!persistedUserId) {
      throw new Error("Authentication is required for this action.");
    }

    return exportActivePlanForUser(persistedUserId, data.format);
  });

export async function exportActivePlanForUser(
  userId: string,
  format: "json" | "markdown",
): Promise<ExportActivePlanResult> {
  const planCycle = await getActivePlan(userId);

  if (!planCycle) {
    throw new Error("There is no active plan to export.");
  }

  const workouts = await getPlanWorkouts(planCycle.id);
  const payload = buildActivePlanExportPayload({
    planCycle,
    workouts,
  });
  const document = buildPlanExportDocument(payload, format);

  return {
    ok: true,
    ...document,
  };
}
