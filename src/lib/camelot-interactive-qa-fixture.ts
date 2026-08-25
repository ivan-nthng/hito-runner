export const CAMELOT_INTERACTIVE_QA_PROFILE = "camelot" as const;
export const CAMELOT_INTERACTIVE_QA_FIXTURE_VERSION = "camelot_interactive_qa_fixture_v1" as const;
export const CAMELOT_SIMULATED_FIT_OUTCOME_VERSION = "camelot_simulated_fit_outcome_v1" as const;
export const CAMELOT_QA_FIXTURE_PROFILE_ENV = "HITO_QA_FIXTURE_PROFILE" as const;

type RuntimeEnv = Record<string, string | undefined>;

export type CamelotRuntimeBoundaryInput = {
  authProvider: string;
  appBaseUrl: string | null;
  supabaseUrl: string | null;
  env?: RuntimeEnv;
};

export type CamelotRuntimeBoundary =
  | { allowed: true; profile: typeof CAMELOT_INTERACTIVE_QA_PROFILE }
  | {
      allowed: false;
      reason:
        | "profile_not_selected"
        | "hosted_runtime"
        | "real_provider_mode"
        | "non_local_auth"
        | "non_loopback_application"
        | "non_loopback_supabase";
    };

export type CamelotSimulatedFitOutcomeV1 = {
  version: typeof CAMELOT_SIMULATED_FIT_OUTCOME_VERSION;
  profile: typeof CAMELOT_INTERACTIVE_QA_PROFILE;
  presentationFileName: string;
  selectedBytesDiscardedBeforeParserOrStorage: true;
  syntheticEvidenceSource: "canonical_local_fit_fixture";
  externalProviderDispatchCount: 0;
};

export function isCamelotInteractiveQaProfileSelected(env: RuntimeEnv = process.env) {
  return env[CAMELOT_QA_FIXTURE_PROFILE_ENV] === CAMELOT_INTERACTIVE_QA_PROFILE;
}

export function isLocalAuthAccountAllowedForCamelotProfile(
  username: string,
  env: RuntimeEnv = process.env,
) {
  return (
    !isCamelotInteractiveQaProfileSelected(env) ||
    username.trim().toLowerCase() === CAMELOT_INTERACTIVE_QA_PROFILE
  );
}

export function evaluateCamelotRuntimeBoundary(
  input: CamelotRuntimeBoundaryInput,
): CamelotRuntimeBoundary {
  const env = input.env ?? process.env;
  if (!isCamelotInteractiveQaProfileSelected(env)) {
    return { allowed: false, reason: "profile_not_selected" };
  }
  if (env.VERCEL === "1" || env.CI === "true") {
    return { allowed: false, reason: "hosted_runtime" };
  }
  if (
    env.HITO_AI_GENERATED_PLAN_PROVIDER_MODE !== "qa_fixture" ||
    env.HITO_AI_GENERATED_PLAN_DEV_FIXTURE !== "true"
  ) {
    return { allowed: false, reason: "real_provider_mode" };
  }
  if (input.authProvider !== "local") {
    return { allowed: false, reason: "non_local_auth" };
  }
  if (!isLoopbackUrl(input.appBaseUrl)) {
    return { allowed: false, reason: "non_loopback_application" };
  }
  if (!isLoopbackUrl(input.supabaseUrl)) {
    return { allowed: false, reason: "non_loopback_supabase" };
  }
  return { allowed: true, profile: CAMELOT_INTERACTIVE_QA_PROFILE };
}

export function sanitizeCamelotPresentationFileName(value: string) {
  const baseName = value.split(/[\\/]/).at(-1) ?? "";
  const printableBaseName = [...baseName.normalize("NFKC")]
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint > 0x1f && codePoint !== 0x7f;
    })
    .join("");
  const sanitized = printableBaseName
    .replace(/[^\p{L}\p{N}._ ()-]/gu, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return sanitized || "selected-activity.fit";
}

function isLoopbackUrl(value: string | null) {
  if (!value) return false;
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}
