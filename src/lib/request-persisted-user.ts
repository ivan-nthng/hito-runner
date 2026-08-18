import "@tanstack/react-start/server-only";

import { requireAuthenticatedUser } from "@/lib/backend/auth";
import type { RequestAuthContext } from "@/lib/backend/auth";
import { classifyAdminAnalyticsUser } from "@/lib/admin-user-classification";
import { findLocalAuthAccountByUserId } from "@/lib/local-auth";
import { ensureLocalAuthSupabaseUserId } from "@/lib/local-auth-supabase";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export interface PersistedUserResolutionDependencies {
  resolveVerifiedAdminUserId: (userId: string) => Promise<string | null>;
}

const defaultPersistedUserResolutionDependencies: PersistedUserResolutionDependencies = {
  resolveVerifiedAdminUserId: resolveVerifiedAdminUserIdFromSupabase,
};

export async function requirePersistedUserIdForCurrentRequest(): Promise<string> {
  const auth = requireAuthenticatedUser();
  const persistedUserId = await getPersistedUserIdForAuth(
    auth,
    defaultPersistedUserResolutionDependencies,
  );

  if (!persistedUserId) {
    throw new Error("Authentication is required for this action.");
  }

  return persistedUserId;
}

export async function getPersistedUserIdForAuthContext(
  auth: RequestAuthContext,
  dependencies: PersistedUserResolutionDependencies = defaultPersistedUserResolutionDependencies,
) {
  if (!auth.userId) {
    return null;
  }

  return await getPersistedUserIdForAuth(auth, dependencies);
}

async function getPersistedUserIdForAuth(
  auth: RequestAuthContext,
  dependencies: PersistedUserResolutionDependencies,
) {
  const userId = auth.userId;

  if (!userId) {
    throw new Error("Authentication is required for this action.");
  }

  if (auth.provider === "admin") {
    return dependencies.resolveVerifiedAdminUserId(userId);
  }

  if (auth.provider !== "local") {
    return userId;
  }

  const localConfig = await findLocalAuthAccountByUserId(userId);

  if (!localConfig) {
    throw new Error("Temporary local auth bypass is not configured in this environment.");
  }

  return ensureLocalAuthSupabaseUserId(localConfig);
}

async function resolveVerifiedAdminUserIdFromSupabase(userId: string) {
  try {
    const result = await createAdminSupabaseClient().auth.admin.getUserById(userId);
    if (result.error || !result.data.user || result.data.user.id !== userId) {
      return null;
    }

    const classification = classifyAdminAnalyticsUser({
      email: result.data.user.email ?? null,
      appMetadata: result.data.user.app_metadata,
    });

    return classification.classification === "supabase_admin" ? result.data.user.id : null;
  } catch {
    return null;
  }
}
