import type { AiFirstPlanDraftServiceInputKind } from "../../src/lib/ai-first-plan-draft-service";

export type ParsedArgs = Record<string, string | true>;
export type ScriptMode = "mock" | "mock_invalid" | "mock_timeout" | "live";
export type FixtureKind = "representative_10k";

export function resolveMode(options: ParsedArgs): ScriptMode {
  if (hasFlag(options, "live")) {
    return "live";
  }

  if (hasFlag(options, "mock-timeout")) {
    return "mock_timeout";
  }

  if (hasFlag(options, "mock-invalid")) {
    return "mock_invalid";
  }

  return "mock";
}

export function parseInputKind(value: string | true | undefined): AiFirstPlanDraftServiceInputKind {
  const normalized = stringOption(value);

  if (normalized === "structured_onboarding" || normalized === "structured_authoring") {
    return normalized;
  }

  if (normalized) {
    throw new Error("--input-kind must be structured_authoring or structured_onboarding.");
  }

  return "structured_authoring";
}

export function parseFixtureKind(value: string | true | undefined): FixtureKind {
  const normalized = stringOption(value);

  if (normalized === "representative-10k" || normalized === "representative_10k") {
    return "representative_10k";
  }

  if (normalized) {
    throw new Error("--fixture must be representative-10k.");
  }

  return "representative_10k";
}

export function parsePositiveIntegerOption(value: string | true | undefined) {
  if (value == null || value === true) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("--timeout-ms and --max-output-tokens must be positive integers.");
  }

  return parsed;
}

export function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];

    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const next = args[index + 1];

    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

export function hasFlag(options: ParsedArgs, key: string) {
  const value = options[key];

  return value === true || value === "true" || value === "1";
}

export function stringOption(value: string | true | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function printHelp() {
  console.log(
    [
      "Usage:",
      "  npm run author-ai-first-plan-draft -- --mock-openai",
      "  npm run author-ai-first-plan-draft -- --mock-invalid",
      "  npm run author-ai-first-plan-draft -- --mock-timeout --timeout-ms 20",
      "  OPENAI_PLAN_MODEL=gpt-4.1-mini npm run author-ai-first-plan-draft -- --live --fixture representative-10k --timeout-ms 120000 --max-output-tokens 8000 --require-plan-first-proof",
      "",
      "Options:",
      "  --live                         Use the real OpenAI Responses API.",
      "  --mock-openai                  Use deterministic mock OpenAI output. This is the default.",
      "  --mock-invalid                 Use invalid plan-first output and verify unavailable failure.",
      "  --mock-timeout                 Simulate a hung OpenAI request and verify unavailable failure.",
      "  --input-file <path>            JSON structured authoring input or onboarding input.",
      "  --input-kind <kind>            structured_authoring or structured_onboarding.",
      "  --fixture <kind>               representative-10k when no input file is supplied.",
      "  --timeout-ms <number>          Bounded OpenAI timeout. Default: 45000.",
      "  --max-output-tokens <number>   Bounded OpenAI output limit. Default: 32000.",
      "  --require-plan-first-proof     Fail when compiled output lacks endpoint, repeat, distance-goal, or metric-safety proof.",
      "",
      "The script is non-mutating and prints bounded plan-first metadata only; it does not persist plans.",
    ].join("\n"),
  );
}
