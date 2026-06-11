export const RUNNING_PLAN_FORBIDDEN_RUNNER_FACING_LANGUAGE_PATTERNS = [
  {
    signal: "fake_precise_pace_token",
    pattern: /\bpace[\s_-]*(?:min|target|range)\b/i,
  },
  {
    signal: "race_pace_claim",
    pattern: /\brace[\s_-]*pace\b/i,
  },
  {
    signal: "goal_pace_claim",
    pattern: /\bgoal[\s_-]*pace\b/i,
  },
  {
    signal: "target_pace_claim",
    pattern: /\btarget[\s_-]*pace\b/i,
  },
  {
    signal: "target_time_claim",
    pattern: /\btarget[\s_-]*time\b/i,
  },
  {
    signal: "race_readiness_claim",
    pattern: /\brace[\s_-]*readiness\b/i,
  },
  {
    signal: "race_peak_claim",
    pattern: /\brace[\s_-]*peak\b/i,
  },
  {
    signal: "fake_personal_hr_token",
    pattern: /\bpersonal[\s_-]*hr\b/i,
  },
  {
    signal: "legacy_effort_only_token",
    pattern: /\beffort[\s_-]*only\b/i,
  },
] as const;

export type RunningPlanForbiddenRunnerFacingLanguageSignal =
  (typeof RUNNING_PLAN_FORBIDDEN_RUNNER_FACING_LANGUAGE_PATTERNS)[number]["signal"];

export interface RunningPlanForbiddenRunnerFacingLanguageMatch {
  signal: RunningPlanForbiddenRunnerFacingLanguageSignal;
  value: string;
}

export function findForbiddenRunnerFacingLanguageMatchesInText(
  value: string,
): readonly RunningPlanForbiddenRunnerFacingLanguageMatch[] {
  return RUNNING_PLAN_FORBIDDEN_RUNNER_FACING_LANGUAGE_PATTERNS.filter(({ pattern }) =>
    pattern.test(value),
  ).map(({ signal }) => ({ signal, value }));
}

export function findForbiddenRunnerFacingLanguageMatches(
  value: unknown,
): readonly RunningPlanForbiddenRunnerFacingLanguageMatch[] {
  return findForbiddenRunnerFacingLanguageMatchesInText(JSON.stringify(value));
}
