import { getRequestAuthContext } from "@/lib/backend/auth";
import { getPersistedUserIdForAuthContext } from "@/lib/request-persisted-user";

export type ManualWorkoutAuthoringUserResolution =
  | { ok: true; userId: string }
  | { ok: false; reason: "missing_auth" | "unpersisted_session" };

export async function resolveCurrentManualWorkoutAuthoringUser(): Promise<ManualWorkoutAuthoringUserResolution> {
  const auth = getRequestAuthContext();

  if (!auth.userId) {
    return { ok: false, reason: "missing_auth" };
  }

  try {
    const userId = await getPersistedUserIdForAuthContext(auth);

    return userId ? { ok: true, userId } : { ok: false, reason: "unpersisted_session" };
  } catch {
    return { ok: false, reason: "unpersisted_session" };
  }
}

export async function getCurrentManualWorkoutAuthoringUserId() {
  const resolution = await resolveCurrentManualWorkoutAuthoringUser();

  return resolution.ok ? resolution.userId : null;
}
