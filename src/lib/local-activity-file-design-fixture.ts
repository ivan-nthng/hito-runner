import { isAiGeneratedRunningPlanDevFixtureEnabled } from "@/lib/ai-generated-running-plan-dev-fixture";
import type { RequestAuthContext } from "@/lib/backend/auth";
import { isLoopbackRuntimeUrl } from "@/lib/supabase/env";

export const LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_FIELD = "localQaFixture";
export const LOCAL_ACTIVITY_FILE_DURABLE_FIXTURE_SAMPLE = "sample-fit-from-zip.fit";

/** Restricts local activity-file controls to the authenticated loopback qa_fixture runtime. */
export function isLocalActivityFileDesignFixtureEnabled(auth: RequestAuthContext) {
  return (
    auth.provider === "local" &&
    isLoopbackRuntimeUrl(auth.appBaseUrl) &&
    isAiGeneratedRunningPlanDevFixtureEnabled()
  );
}
