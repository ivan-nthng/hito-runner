export type ParsedArgs = Record<string, string | true>;
export type ScriptMode = "mock" | "mock_invalid" | "mock_timeout" | "live";
export type FixtureKind = "representative_10k" | "representative_half";
export type DirectCanaryTimeoutPolicy = {
  timeoutMs: number;
  deadline: "none" | "bounded";
  source: "explicit_cli" | "mock_default";
};

const DEFAULT_MOCK_TIMEOUT_MS = 45_000;
const MAX_NODE_TIMEOUT_MS = 2_147_483_647;

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

export function parseFixtureKind(value: string | true | undefined): FixtureKind {
  const normalized = stringOption(value);

  if (normalized === "representative-10k" || normalized === "representative_10k") {
    return "representative_10k";
  }

  if (normalized === "representative-half" || normalized === "representative_half") {
    return "representative_half";
  }

  if (normalized) {
    throw new Error("--fixture must be representative-10k or representative-half.");
  }

  return "representative_10k";
}

export function parsePositiveIntegerOption(value: string | true | undefined) {
  if (value == null || value === true) {
    return null;
  }

  const parsed = parseStrictInteger(value);

  if (parsed == null || parsed <= 0) {
    throw new Error("--max-output-tokens must be a positive integer.");
  }

  return parsed;
}

export function resolveDirectCanaryTimeoutPolicy(
  options: ParsedArgs,
  mode: ScriptMode,
): DirectCanaryTimeoutPolicy {
  const timeoutMs = parseNonNegativeIntegerOption(options["timeout-ms"]);

  if (mode === "live" && timeoutMs == null) {
    throw new Error(
      "--live requires an explicit --timeout-ms value; use 0 for no client deadline.",
    );
  }

  const effectiveTimeoutMs = timeoutMs ?? DEFAULT_MOCK_TIMEOUT_MS;
  return {
    timeoutMs: effectiveTimeoutMs,
    deadline: effectiveTimeoutMs === 0 ? "none" : "bounded",
    source: timeoutMs == null ? "mock_default" : "explicit_cli",
  };
}

function parseNonNegativeIntegerOption(value: string | true | undefined) {
  if (value == null || value === true) {
    return null;
  }

  const parsed = parseStrictInteger(value);

  if (parsed == null || parsed < 0 || parsed > MAX_NODE_TIMEOUT_MS) {
    throw new Error(`--timeout-ms must be an integer between 0 and ${MAX_NODE_TIMEOUT_MS}.`);
  }

  return parsed;
}

function parseStrictInteger(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
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
      "  npm run author-ai-first-plan-draft -- --live --fixture representative-10k --timeout-ms 0 --max-output-tokens 32000 --require-plan-first-proof",
      "",
      "Options:",
      "  --live                         Use the real OpenAI Responses API.",
      "  --mock-openai                  Use the loopback provider-shaped fixture. This is the default.",
      "  --mock-invalid                 Use invalid plan-first output and verify unavailable failure.",
      "  --mock-timeout                 Simulate a hung OpenAI request and verify unavailable failure.",
      "  --input-file <path>            JSON structured authoring input.",
      "  --fixture <kind>               representative-10k or representative-half when no input file is supplied.",
      `  --timeout-ms <number>          Required with --live. Use 0 for no client deadline; bounded range: 1-${MAX_NODE_TIMEOUT_MS} ms. Mock default: 45000.`,
      "  --max-output-tokens <number>   Bounded OpenAI output limit. Default: 32000.",
      "  --require-plan-first-proof     Fail when compiled output lacks endpoint, repeat, distance-goal, or metric-safety proof.",
      "",
      "The script is non-mutating and prints bounded plan-first metadata only; it does not persist plans.",
    ].join("\n"),
  );
}
