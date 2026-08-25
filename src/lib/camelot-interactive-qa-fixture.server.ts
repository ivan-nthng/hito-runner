import "@tanstack/react-start/server-only";

import type { RequestAuthContext } from "@/lib/backend/auth";
import {
  CAMELOT_INTERACTIVE_QA_PROFILE,
  evaluateCamelotRuntimeBoundary,
} from "@/lib/camelot-interactive-qa-fixture";
import { findLocalAuthAccountByUserId } from "@/lib/local-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const CAMELOT_QA_POOL_VERSION = "hito_qa_tester_pool_v1";

export async function isCamelotFixtureSessionAuthorized(input: {
  auth: RequestAuthContext;
  persistedUserId: string | null;
}) {
  if (!input.auth.userId || !input.persistedUserId) return false;
  const boundary = evaluateCamelotRuntimeBoundary({
    authProvider: input.auth.provider,
    appBaseUrl: input.auth.appBaseUrl,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
  });
  if (!boundary.allowed) return false;

  const localAccount = await findLocalAuthAccountByUserId(input.auth.userId);
  if (!localAccount) return false;
  const result = await createAdminSupabaseClient().auth.admin.getUserById(input.persistedUserId);
  if (result.error || !result.data.user) return false;
  const metadata = result.data.user.app_metadata ?? {};
  return (
    result.data.user.email === localAccount.email &&
    metadata.hito_test_user === true &&
    metadata.hito_qa_pool_version === CAMELOT_QA_POOL_VERSION &&
    metadata.hito_qa_pool_role === CAMELOT_INTERACTIVE_QA_PROFILE
  );
}
