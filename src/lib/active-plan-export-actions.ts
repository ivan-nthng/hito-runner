import { getActivePlan, getPlanWorkouts } from "@/lib/active-plan-persistence";
import {
  buildActivePlanExportPayload,
  buildPlanExportDocument,
  type PlanExportDocument,
} from "@/lib/plan-export";

export interface ExportActivePlanResult extends PlanExportDocument {
  ok: true;
}

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
