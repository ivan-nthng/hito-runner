import { getRequestAuthContext, requireAuthenticatedUser } from "@/lib/backend/auth";
import type { RequestAuthContext } from "@/lib/backend/auth";
import { findLocalAuthAccountByUserId } from "@/lib/local-auth";
import { ensureLocalAuthSupabaseUserId } from "@/lib/local-auth-supabase";

export async function requirePersistedUserIdForCurrentRequest() {
  const auth = requireAuthenticatedUser();
  return await getPersistedUserIdForAuth(auth);
}

export async function getPersistedUserIdForRequestAuthContext() {
  const auth = getRequestAuthContext();

  if (!auth.userId) {
    return null;
  }

  return await getPersistedUserIdForAuth(auth);
}

export async function getPersistedUserIdForAuthContext(auth: RequestAuthContext) {
  if (!auth.userId) {
    return null;
  }

  return await getPersistedUserIdForAuth(auth);
}

async function getPersistedUserIdForAuth(auth: ReturnType<typeof requireAuthenticatedUser>) {
  if (auth.provider === "admin") {
    return null;
  }

  if (auth.provider !== "local") {
    return auth.userId;
  }

  if (!auth.userId) {
    throw new Error("Temporary local auth bypass could not resolve the current account.");
  }

  const localConfig = await findLocalAuthAccountByUserId(auth.userId);

  if (!localConfig) {
    throw new Error("Temporary local auth bypass is not configured in this environment.");
  }

  return ensureLocalAuthSupabaseUserId(localConfig);
}
