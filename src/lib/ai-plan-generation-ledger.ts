export type AiPlanGenerationProviderKind = "openai_responses_api" | "local_dev_fixture";

export type AiPlanGenerationFinalOutcome =
  | "request_created"
  | "response_received"
  | "canonical_draft_ready"
  | "reviewed_draft_signed"
  | "persisted_plan_created"
  | "unavailable"
  | "rejected"
  | "timeout"
  | "provider_error";

export type AiPlanGenerationParseStatus =
  | "not_started"
  | "parsed_json"
  | "non_json"
  | "empty_output";

export type AiPlanGenerationNormalizationStatus =
  | "not_started"
  | "normalized"
  | "failed"
  | "finalization_failed";

export interface AiPlanGenerationLedgerOptions {
  disabled?: boolean;
  forceArtifactWrite?: boolean;
  artifactRoot?: string | null;
}

export interface AiPlanGenerationLedgerTrace {
  artifactKind: "ai_plan_generation_ledger_trace_v1";
  generationId: string;
  createdAt: string;
  updatedAt: string;
  provider: {
    kind: AiPlanGenerationProviderKind;
    paidProviderCall: boolean;
    model: string;
    responseId: string | null;
    responseStatus: string | null;
    responseIncompleteReason: string | null;
  };
  request: {
    contractMode: string;
    responseSchemaMode: string;
    promptHash: string;
    systemPromptHash: string;
    userPromptHash: string;
    responseSchemaHash: string;
    promptCharEstimate: number;
    systemPromptChars: number;
    userPromptChars: number;
    responseSchemaChars: number;
    timeoutMs: number;
    maxOutputTokens: number;
  };
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
  output: {
    rawOutputHash: string | null;
    rawOutputChars: number | null;
    sanitizedSummaryHash: string | null;
    sanitizedSummary: Record<string, unknown> | null;
    sanitizedPayloadStored: false;
  };
  pipeline: {
    parseStatus: AiPlanGenerationParseStatus;
    normalizationStatus: AiPlanGenerationNormalizationStatus;
    repairs: readonly string[];
    validationIssues: readonly string[];
    canonicalRowCount: number | null;
    runningWorkoutCount: number | null;
    finalOutcome: AiPlanGenerationFinalOutcome;
    unavailableReason: string | null;
  };
  artifacts: {
    written: boolean;
    path: string | null;
    writeError: string | null;
  };
}

export async function createAiPlanGenerationLedgerTrace(input: {
  providerKind: AiPlanGenerationProviderKind;
  model: string;
  contractMode: string;
  responseSchemaMode: string;
  systemPrompt: string;
  userPrompt: string;
  responseSchema: unknown;
  timeoutMs: number;
  maxOutputTokens: number;
}): Promise<AiPlanGenerationLedgerTrace> {
  const timestamp = new Date().toISOString();
  const responseSchemaJson = stableJsonStringify(input.responseSchema);

  return {
    artifactKind: "ai_plan_generation_ledger_trace_v1",
    generationId: createGenerationId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    provider: {
      kind: input.providerKind,
      paidProviderCall: input.providerKind === "openai_responses_api",
      model: input.model,
      responseId: null,
      responseStatus: null,
      responseIncompleteReason: null,
    },
    request: {
      contractMode: input.contractMode,
      responseSchemaMode: input.responseSchemaMode,
      promptHash: await digestSha256Hex(
        stableJsonStringify({
          systemPrompt: input.systemPrompt,
          userPrompt: input.userPrompt,
          responseSchema: JSON.parse(responseSchemaJson) as unknown,
        }),
      ),
      systemPromptHash: await digestSha256Hex(input.systemPrompt),
      userPromptHash: await digestSha256Hex(input.userPrompt),
      responseSchemaHash: await digestSha256Hex(responseSchemaJson),
      promptCharEstimate:
        input.systemPrompt.length + input.userPrompt.length + responseSchemaJson.length,
      systemPromptChars: input.systemPrompt.length,
      userPromptChars: input.userPrompt.length,
      responseSchemaChars: responseSchemaJson.length,
      timeoutMs: input.timeoutMs,
      maxOutputTokens: input.maxOutputTokens,
    },
    usage: {
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
    },
    output: {
      rawOutputHash: null,
      rawOutputChars: null,
      sanitizedSummaryHash: null,
      sanitizedSummary: null,
      sanitizedPayloadStored: false,
    },
    pipeline: {
      parseStatus: "not_started",
      normalizationStatus: "not_started",
      repairs: [],
      validationIssues: [],
      canonicalRowCount: null,
      runningWorkoutCount: null,
      finalOutcome: "request_created",
      unavailableReason: null,
    },
    artifacts: {
      written: false,
      path: null,
      writeError: null,
    },
  };
}

export async function updateAiPlanGenerationLedgerTrace(
  trace: AiPlanGenerationLedgerTrace | null,
  patch: Partial<AiPlanGenerationLedgerTrace>,
  options?: AiPlanGenerationLedgerOptions,
): Promise<AiPlanGenerationLedgerTrace | null> {
  if (!trace) {
    return null;
  }

  const next: AiPlanGenerationLedgerTrace = {
    ...trace,
    ...patch,
    updatedAt: new Date().toISOString(),
    provider: {
      ...trace.provider,
      ...(patch.provider ?? {}),
    },
    request: {
      ...trace.request,
      ...(patch.request ?? {}),
    },
    usage: {
      ...trace.usage,
      ...(patch.usage ?? {}),
    },
    output: {
      ...trace.output,
      ...(patch.output ?? {}),
      sanitizedPayloadStored: false,
    },
    pipeline: {
      ...trace.pipeline,
      ...(patch.pipeline ?? {}),
    },
    artifacts: {
      ...trace.artifacts,
      ...(patch.artifacts ?? {}),
    },
  };

  return writeAiPlanGenerationLedgerTrace(next, options);
}

export async function attachOutputToAiPlanGenerationLedgerTrace(input: {
  trace: AiPlanGenerationLedgerTrace | null;
  rawOutput: string;
  parsedOutput: unknown | null;
  options?: AiPlanGenerationLedgerOptions;
}): Promise<AiPlanGenerationLedgerTrace | null> {
  const sanitizedSummary =
    input.parsedOutput == null ? null : summarizeAiPlanGenerationOutput(input.parsedOutput);

  return updateAiPlanGenerationLedgerTrace(
    input.trace,
    {
      output: {
        rawOutputHash: await digestSha256Hex(input.rawOutput),
        rawOutputChars: input.rawOutput.length,
        sanitizedSummaryHash:
          sanitizedSummary == null
            ? null
            : await digestSha256Hex(stableJsonStringify(sanitizedSummary)),
        sanitizedSummary,
        sanitizedPayloadStored: false,
      },
      pipeline: {
        ...input.trace?.pipeline,
        parseStatus: input.parsedOutput == null ? "non_json" : "parsed_json",
      },
    },
    input.options,
  );
}

export async function markAiPlanGenerationReviewedDraftSigned(input: {
  trace: AiPlanGenerationLedgerTrace | null;
  options?: AiPlanGenerationLedgerOptions;
}) {
  return updateAiPlanGenerationLedgerTrace(
    input.trace,
    {
      pipeline: {
        ...input.trace?.pipeline,
        finalOutcome: "reviewed_draft_signed",
      },
    },
    input.options,
  );
}

export async function markAiPlanGenerationPersisted(input: {
  trace: AiPlanGenerationLedgerTrace | null;
  options?: AiPlanGenerationLedgerOptions;
}) {
  return updateAiPlanGenerationLedgerTrace(
    input.trace,
    {
      pipeline: {
        ...input.trace?.pipeline,
        finalOutcome: "persisted_plan_created",
      },
    },
    input.options,
  );
}

export function summarizeAiPlanGenerationOutput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return { valueKind: typeof value };
  }

  const record = value as Record<string, unknown>;
  const weeks = Array.isArray(record.weeks) ? record.weeks : [];
  const plannedWorkouts = weeks.flatMap((week) =>
    week &&
    typeof week === "object" &&
    Array.isArray((week as { plannedWorkouts?: unknown }).plannedWorkouts)
      ? (week as { plannedWorkouts: unknown[] }).plannedWorkouts
      : [],
  );

  return {
    valueKind: "object",
    topLevelKeys: Object.keys(record).sort(),
    schemaVersion: typeof record.schemaVersion === "string" ? record.schemaVersion : null,
    startDate: typeof record.startDate === "string" ? record.startDate : null,
    targetDate: typeof record.targetDate === "string" ? record.targetDate : null,
    preparationHorizonWeeks:
      typeof record.preparationHorizonWeeks === "number" ? record.preparationHorizonWeeks : null,
    weekCount: weeks.length,
    plannedWorkoutCount: plannedWorkouts.length,
    workoutIdentityCount: new Set(
      plannedWorkouts
        .map((workout) =>
          workout && typeof workout === "object"
            ? (workout as { workoutIdentity?: unknown }).workoutIdentity
            : null,
        )
        .filter((identity): identity is string => typeof identity === "string"),
    ).size,
  };
}

async function writeAiPlanGenerationLedgerTrace(
  trace: AiPlanGenerationLedgerTrace,
  options?: AiPlanGenerationLedgerOptions,
): Promise<AiPlanGenerationLedgerTrace> {
  if (!shouldWriteAiPlanGenerationLedgerTrace(trace, options)) {
    return trace;
  }

  try {
    const fsModule = "node:fs/promises";
    const pathModule = "node:path";
    const { mkdir, writeFile } = (await import(
      /* @vite-ignore */ fsModule
    )) as typeof import("node:fs/promises");
    const { join } = (await import(/* @vite-ignore */ pathModule)) as typeof import("node:path");
    const processLike = getProcessLike();
    const artifactRoot =
      options?.artifactRoot?.trim() || join(processLike?.cwd?.() ?? ".", "qa-artifacts", "debug");
    const date = trace.createdAt.slice(0, 10);
    const artifactDir = join(artifactRoot, date, "ai-plan-generation-ledger");
    const artifactPath =
      trace.artifacts.path ??
      join(artifactDir, `${trace.createdAt.replace(/[:.]/g, "-")}-${trace.generationId}.json`);
    const artifact: AiPlanGenerationLedgerTrace = {
      ...trace,
      artifacts: {
        written: true,
        path: artifactPath,
        writeError: null,
      },
    };

    await mkdir(artifactDir, { recursive: true });
    await writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

    return artifact;
  } catch (error) {
    return {
      ...trace,
      artifacts: {
        ...trace.artifacts,
        written: false,
        writeError: error instanceof Error ? error.message.slice(0, 300) : "unknown_write_error",
      },
    };
  }
}

function shouldWriteAiPlanGenerationLedgerTrace(
  trace: AiPlanGenerationLedgerTrace,
  options?: AiPlanGenerationLedgerOptions,
) {
  if (options?.disabled) {
    return false;
  }

  const processLike = getProcessLike();
  const env = processLike?.env ?? {};

  if (env.HITO_AI_PLAN_GENERATION_LEDGER === "0") {
    return false;
  }

  return (
    options?.forceArtifactWrite === true ||
    env.HITO_AI_PLAN_GENERATION_LEDGER === "1" ||
    trace.provider.paidProviderCall
  );
}

async function digestSha256Hex(payload: string) {
  const subtle = globalThis.crypto?.subtle;

  if (subtle) {
    const data = new TextEncoder().encode(payload);
    const digest = await subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  const cryptoModule = "node:crypto";
  const { createHash } = (await import(
    /* @vite-ignore */ cryptoModule
  )) as typeof import("node:crypto");
  return createHash("sha256").update(payload).digest("hex");
}

function stableJsonStringify(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortJsonValue(entry)]),
    );
  }

  return value;
}

function createGenerationId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `ai-plan-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function getProcessLike():
  | {
      cwd?: () => string;
      env?: Record<string, string | undefined>;
    }
  | undefined {
  return typeof process === "undefined" ? undefined : process;
}
