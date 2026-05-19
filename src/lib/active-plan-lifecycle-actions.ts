import { createServerFn } from "@tanstack/react-start";
import { getActivePlan } from "@/lib/active-plan-persistence";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";
import { requireAuthenticatedUser } from "@/lib/backend/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { todayIso, type TrainingSnapshot } from "@/lib/training";

type PersistedSnapshotLoader = (userId: string) => Promise<TrainingSnapshot>;

export interface DeleteActivePlanResult {
  ok: true;
  status: "archived";
  archivedPlanId: string;
  snapshot: TrainingSnapshot;
}

export interface ClearUpcomingScheduleResult {
  ok: true;
  status: "cleared";
  clearedFromDate: string;
  archivedPlanId: string;
  snapshot: TrainingSnapshot;
}

export function createDeleteActivePlanAction(loadSnapshot: PersistedSnapshotLoader) {
  return createServerFn({ method: "POST" }).handler(async () => {
    const userId = await requireLifecycleUserId();

    return archiveActivePlanForUser(userId, loadSnapshot);
  });
}

export function createClearUpcomingScheduleAction(loadSnapshot: PersistedSnapshotLoader) {
  return createServerFn({ method: "POST" }).handler(async () => {
    const userId = await requireLifecycleUserId();

    return clearUpcomingScheduleForUser(userId, loadSnapshot);
  });
}

export async function archiveActivePlanForUser(
  userId: string,
  loadSnapshot: PersistedSnapshotLoader,
): Promise<DeleteActivePlanResult> {
  const archivedPlanId = await archiveCurrentActivePlanForUser(
    userId,
    "There is no active plan to delete.",
  );

  return {
    ok: true,
    status: "archived",
    archivedPlanId,
    snapshot: await loadSnapshot(userId),
  };
}

export async function clearUpcomingScheduleForUser(
  userId: string,
  loadSnapshot: PersistedSnapshotLoader,
  clearedFromDate: string = todayIso(),
): Promise<ClearUpcomingScheduleResult> {
  const archivedPlanId = await archiveCurrentActivePlanForUser(
    userId,
    "There is no active schedule to clear.",
  );

  return {
    ok: true,
    status: "cleared",
    clearedFromDate,
    archivedPlanId,
    snapshot: await loadSnapshot(userId),
  };
}

async function requireLifecycleUserId() {
  const auth = requireAuthenticatedUser();
  const persistedUserId = await getPersistedUserIdForAuthContext(auth);

  if (!persistedUserId) {
    throw new Error("Authentication is required for this action.");
  }

  return persistedUserId;
}

async function archiveCurrentActivePlanForUser(userId: string, missingMessage: string) {
  const supabase = createAdminSupabaseClient();
  const activePlan = await getActivePlan(userId);

  if (!activePlan) {
    throw new Error(missingMessage);
  }

  const archived = await supabase
    .from("plan_cycles")
    .update({ status: "archived" })
    .eq("id", activePlan.id)
    .eq("user_id", userId)
    .eq("status", "active")
    .select("id")
    .single();

  if (archived.error) {
    throw new Error(archived.error.message);
  }

  return archived.data.id;
}
