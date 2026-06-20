import type {
  AiFirstPlanDraftServiceInputKind,
  AiFirstPlanGenerationContract,
} from "../../src/lib/ai-first-plan-draft-service";

export type ParsedArgs = Record<string, string | true>;
export type ScriptMode = "mock" | "mock_invalid" | "mock_partial" | "mock_timeout" | "live";
export type ScriptContractMode = AiFirstPlanGenerationContract;
export type FixtureKind =
  | "one_week_smoke"
  | "compact_smoke"
  | "balanced_half"
  | "five_k_short"
  | "ten_k_short"
  | "marathon_balanced"
  | "marathon_target_long"
  | "ultra_trail"
  | "mountain_trail"
  | "full_half"
  | "identity_coverage";

export const DEFAULT_REFERENCE_FILE =
  "/Users/ivan/Downloads/ivan_half_marathon_training_plan_v2_full_2026-05-05.json";
export const DEFAULT_ENVELOPE_LIVE_MODEL = "gpt-4.1-mini";

export function resolveMode(options: ParsedArgs): ScriptMode {
  if (hasFlag(options, "live")) {
    return "live";
  }

  if (hasFlag(options, "mock-timeout")) {
    return "mock_timeout";
  }

  if (hasFlag(options, "mock-partial")) {
    return "mock_partial";
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

export function parseContractMode(value: string | true | undefined): ScriptContractMode {
  const normalized = stringOption(value);

  if (normalized === "envelope") {
    return "envelope";
  }

  if (normalized === "blueprint") {
    return "blueprint";
  }

  if (normalized === "strict-draft" || normalized === "strict_draft" || normalized === "draft") {
    throw new Error(
      "--contract strict-draft was removed from this ops script; use blueprint or envelope.",
    );
  }

  if (normalized) {
    throw new Error("--contract must be blueprint or envelope.");
  }

  return "blueprint";
}

export function parseContractModeOrExit(value: string | true | undefined): ScriptContractMode {
  try {
    return parseContractMode(value);
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          reason: "unsupported_contract",
          message:
            error instanceof Error
              ? error.message.slice(0, 240)
              : "Unsupported first-plan draft contract.",
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }
}

export function parseFixtureKind(value: string | true | undefined): FixtureKind {
  const normalized = stringOption(value);

  if (normalized === "one-week-smoke" || normalized === "one_week_smoke") {
    return "one_week_smoke";
  }

  if (normalized === "compact-smoke" || normalized === "compact_smoke") {
    return "compact_smoke";
  }

  if (normalized === "balanced-half" || normalized === "balanced_half") {
    return "balanced_half";
  }

  if (normalized === "five-k-short" || normalized === "five_k_short" || normalized === "5k-short") {
    return "five_k_short";
  }

  if (normalized === "ten-k-short" || normalized === "ten_k_short" || normalized === "10k-short") {
    return "ten_k_short";
  }

  if (normalized === "marathon-balanced" || normalized === "marathon_balanced") {
    return "marathon_balanced";
  }

  if (
    normalized === "marathon-target-long" ||
    normalized === "marathon_target_long" ||
    normalized === "long-marathon-target"
  ) {
    return "marathon_target_long";
  }

  if (normalized === "full-half" || normalized === "full_half") {
    return "full_half";
  }

  if (normalized === "ultra-trail" || normalized === "ultra_trail") {
    return "ultra_trail";
  }

  if (normalized === "mountain-trail" || normalized === "mountain_trail") {
    return "mountain_trail";
  }

  if (normalized === "identity-coverage" || normalized === "identity_coverage") {
    return "identity_coverage";
  }

  if (normalized) {
    throw new Error(
      "--fixture must be one-week-smoke, compact-smoke, balanced-half, five-k-short, ten-k-short, marathon-balanced, marathon-target-long, ultra-trail, mountain-trail, full-half, or identity-coverage.",
    );
  }

  return "full_half";
}

export function parsePositiveIntegerOption(value: string | true | undefined) {
  if (value == null || value === true) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("--timeout-ms must be a positive integer.");
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
      "  npm run author-ai-first-plan-draft -- --mock-partial --contract blueprint --trace-blueprint",
      "  npm run author-ai-first-plan-draft -- --mock-openai --contract envelope --fixture marathon-target-long",
      "  npm run author-ai-first-plan-draft -- --mock-invalid --contract envelope",
      "  npm run author-ai-first-plan-draft -- --mock-invalid",
      "  npm run author-ai-first-plan-draft -- --mock-timeout --timeout-ms 20",
      "  OPENAI_PLAN_MODEL=gpt-4.1-mini npm run author-ai-first-plan-draft -- --live --contract blueprint --fixture compact-smoke --no-reference --timeout-ms 120000 --max-output-tokens 8000",
      "  OPENAI_PLAN_MODEL=gpt-4.1-mini npm run author-ai-first-plan-draft -- --live --contract blueprint --fixture marathon-balanced --no-reference --timeout-ms 120000 --max-output-tokens 12000 --trace-blueprint",
      "  npm run author-ai-first-plan-draft -- --mock-openai --contract blueprint --fixture marathon-target-long --trace-blueprint",
      "",
      "Options:",
      "  --live                         Use the real OpenAI Responses API.",
      "  --mock-openai                  Use deterministic mock OpenAI output. This is the default.",
      "  --mock-invalid                 Use invalid mock output and verify blueprint-unavailable failure.",
      "  --mock-partial                 Simulate truncated partial blueprint output and verify incomplete-blueprint failure.",
      "  --mock-timeout                 Simulate a hung OpenAI request and verify blueprint-unavailable failure.",
      "  --input-file <path>            JSON structured authoring input or onboarding input.",
      "  --input-kind <kind>            structured_authoring or structured_onboarding.",
      "  --contract <kind>              blueprint (default) or envelope non-live proof.",
      "  --fixture <kind>               one-week-smoke, compact-smoke, balanced-half, five-k-short, ten-k-short, marathon-balanced, marathon-target-long, ultra-trail, mountain-trail, full-half, or identity-coverage when no input file is supplied.",
      "  --reference-file <path>        Optional rich reference JSON for prompt style guidance.",
      "  --no-reference                 Omit reference-style guidance for compact live latency smoke.",
      "  --timeout-ms <number>          Bounded OpenAI timeout. Default: 45000.",
      "  --max-output-tokens <number>   Bounded OpenAI output limit. Default: 32000.",
      "  --coach-sample                 Include bounded expanded segment bodies for coach review.",
      "  --trace-blueprint              Include bounded blueprint pipeline trace metadata.",
      "",
      "The script is non-mutating and prints bounded review metadata only; it does not persist plans.",
    ].join("\n"),
  );
}
