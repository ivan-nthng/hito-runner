import type { Database } from "@/lib/supabase/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export type SourcePlanProvenanceRow = Pick<
  Database["public"]["Tables"]["plan_cycles"]["Row"],
  "id" | "source_kind" | "goal_metadata"
>;

export async function getSourcePlanProvenancesForUser(
  userId: string,
  planIds: readonly (string | null)[],
) {
  const uniquePlanIds = [...new Set(planIds.filter((planId): planId is string => Boolean(planId)))];
  if (uniquePlanIds.length === 0) {
    return new Map<string, SourcePlanProvenanceRow>();
  }

  const supabase = createAdminSupabaseClient();
  const plans = await supabase
    .from("plan_cycles")
    .select("id, source_kind, goal_metadata")
    .eq("user_id", userId)
    .in("id", uniquePlanIds);

  if (plans.error) {
    throw new Error(plans.error.message);
  }

  return new Map(plans.data.map((plan) => [plan.id, plan]));
}
