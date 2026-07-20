import {
  resolveLocalRuntimeArtifactRelativePath,
  resolveLocalRuntimeArchiveAfter,
  writeLocalRuntimeArtifact,
  writeLocalRuntimeEvent,
  type LocalRuntimeEventPhase,
  type LocalRuntimeEventStatus,
  type LocalRuntimeObservabilityOptions,
} from "@/lib/local-runtime-observability";

export type AiPlanGenerationProviderKind =
  | "openai_responses_api"
  | "local_dev_fixture"
  | "not_started";

export type AiPlanGenerationFinalOutcome =
  | "request_created"
  | "response_received"
  | "canonical_draft_ready"
  | "reviewed_draft_signed"
  | "persisted_plan_created"
  | "unavailable"
  | "rejected"
  | "cancelled"
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
  runtimeUrl?: string | null;
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
    issueCodes: readonly string[];
    canonicalRowCount: number | null;
    runningWorkoutCount: number | null;
    finalOutcome: AiPlanGenerationFinalOutcome;
    unavailableReason: string | null;
  };
  artifacts: {
    written: boolean;
    path: string | null;
    expiresAt: string | null;
    writeError: string | null;
  };
}

type AiPlanGenerationLedgerTracePatch = Omit<
  Partial<AiPlanGenerationLedgerTrace>,
  "provider" | "request" | "usage" | "output" | "pipeline" | "artifacts"
> & {
  provider?: Partial<AiPlanGenerationLedgerTrace["provider"]>;
  request?: Partial<AiPlanGenerationLedgerTrace["request"]>;
  usage?: Partial<AiPlanGenerationLedgerTrace["usage"]>;
  output?: Partial<AiPlanGenerationLedgerTrace["output"]>;
  pipeline?: Partial<AiPlanGenerationLedgerTrace["pipeline"]>;
  artifacts?: Partial<AiPlanGenerationLedgerTrace["artifacts"]>;
};

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
      issueCodes: [],
      canonicalRowCount: null,
      runningWorkoutCount: null,
      finalOutcome: "request_created",
      unavailableReason: null,
    },
    artifacts: {
      written: false,
      path: null,
      expiresAt: null,
      writeError: null,
    },
  };
}

export async function recordAiPlanGenerationPreflightFailure(input: {
  reason: string;
  options?: AiPlanGenerationLedgerOptions;
}) {
  const trace = await createAiPlanGenerationLedgerTrace({
    providerKind: "not_started",
    model: "not_started",
    contractMode: "plan_first",
    responseSchemaMode: "not_started",
    systemPrompt: "",
    userPrompt: "",
    responseSchema: {},
    timeoutMs: 0,
    maxOutputTokens: 0,
  });

  return updateAiPlanGenerationLedgerTrace(
    trace,
    {
      pipeline: {
        ...trace.pipeline,
        issueCodes: [input.reason],
        finalOutcome: "rejected",
        unavailableReason: input.reason,
      },
    },
    input.options,
  );
}

export async function updateAiPlanGenerationLedgerTrace(
  trace: AiPlanGenerationLedgerTrace | null,
  patch: AiPlanGenerationLedgerTracePatch,
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

export async function markAiPlanGenerationReviewRefused(input: {
  trace: AiPlanGenerationLedgerTrace | null;
  options?: AiPlanGenerationLedgerOptions;
}) {
  return updateAiPlanGenerationLedgerTrace(
    input.trace,
    {
      pipeline: {
        ...input.trace?.pipeline,
        issueCodes: ["running_plan_review_refused"],
        finalOutcome: "rejected",
        unavailableReason: "running_plan_review_refused",
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

export async function markAiPlanGenerationPersistenceFailed(input: {
  trace: AiPlanGenerationLedgerTrace | null;
  reason: string;
  options?: AiPlanGenerationLedgerOptions;
}) {
  return updateAiPlanGenerationLedgerTrace(
    input.trace,
    {
      pipeline: {
        ...input.trace?.pipeline,
        issueCodes: [input.reason],
        finalOutcome: "rejected",
        unavailableReason: input.reason,
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
    weekCount: weeks.length,
    plannedWorkoutCount: plannedWorkouts.length,
  };
}

async function writeAiPlanGenerationLedgerTrace(
  trace: AiPlanGenerationLedgerTrace,
  options?: AiPlanGenerationLedgerOptions,
): Promise<AiPlanGenerationLedgerTrace> {
  try {
    const filename = `${trace.createdAt.replace(/[:.]/g, "-")}-${trace.generationId}.json`;
    const artifactPath =
      trace.artifacts.path ??
      resolveLocalRuntimeArtifactRelativePath({
        category: "ai-plan-generation",
        filename,
        timestamp: trace.createdAt,
      });
    const artifact = sanitizeAiPlanGenerationLedgerTrace({
      ...trace,
      artifacts: {
        written: true,
        path: artifactPath,
        expiresAt: resolveLocalRuntimeArchiveAfter(trace.createdAt),
        writeError: null,
      },
    });
    const localOptions = toLocalRuntimeObservabilityOptions(options);
    const artifactWrite = await writeLocalRuntimeArtifact({
      category: "ai-plan-generation",
      filename,
      timestamp: trace.createdAt,
      payload: `${JSON.stringify(artifact, null, 2)}\n`,
      existingRelativePath: artifactPath,
      options: localOptions,
    });

    if (!artifactWrite.written) {
      return trace;
    }

    await writeLocalRuntimeEvent(
      {
        category: "plan_generation",
        event: `plan_generation_${artifact.pipeline.finalOutcome}`,
        status: resolveLocalRuntimePlanGenerationStatus(artifact),
        phase: resolveLocalRuntimePlanGenerationPhase(artifact),
        outcomeCode: resolveLocalRuntimePlanGenerationOutcomeCode(artifact),
        generationId: artifact.generationId,
        providerKind: artifact.provider.kind,
        providerResponseId: artifact.provider.responseId,
        parseStatus: artifact.pipeline.parseStatus,
        normalizationStatus: artifact.pipeline.normalizationStatus,
        diagnosticCodes: artifact.pipeline.issueCodes,
        canonicalRowCount: artifact.pipeline.canonicalRowCount,
      },
      localOptions,
    );

    return artifact;
  } catch (error) {
    return {
      ...trace,
      artifacts: {
        ...trace.artifacts,
        written: false,
        writeError: safeArtifactWriteError(error),
      },
    };
  }
}

function sanitizeAiPlanGenerationLedgerTrace(
  trace: AiPlanGenerationLedgerTrace,
): AiPlanGenerationLedgerTrace {
  return {
    ...trace,
    provider: {
      ...trace.provider,
      model: sanitizeDiagnosticValue(trace.provider.model),
      responseId: sanitizeNullableDiagnosticValue(trace.provider.responseId),
      responseStatus: sanitizeNullableDiagnosticValue(trace.provider.responseStatus),
      responseIncompleteReason: sanitizeNullableDiagnosticValue(
        trace.provider.responseIncompleteReason,
      ),
    },
    pipeline: {
      ...trace.pipeline,
      issueCodes: trace.pipeline.issueCodes.map(sanitizeDiagnosticValue),
      unavailableReason: sanitizeNullableDiagnosticValue(trace.pipeline.unavailableReason),
    },
    artifacts: {
      ...trace.artifacts,
      writeError: sanitizeNullableDiagnosticValue(trace.artifacts.writeError),
    },
  };
}

function sanitizeNullableDiagnosticValue(value: string | null) {
  return value == null ? null : sanitizeDiagnosticValue(value);
}

function sanitizeDiagnosticValue(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_");
  return normalized.slice(0, 120) || "unknown";
}

function toLocalRuntimeObservabilityOptions(
  options?: AiPlanGenerationLedgerOptions,
): LocalRuntimeObservabilityOptions {
  return {
    disabled: options?.disabled,
    forceWrite: options?.forceArtifactWrite,
    root: options?.artifactRoot,
    runtimeUrl: options?.runtimeUrl,
  };
}

function resolveLocalRuntimePlanGenerationPhase(
  trace: AiPlanGenerationLedgerTrace,
): LocalRuntimeEventPhase {
  if (
    trace.pipeline.finalOutcome === "persisted_plan_created" ||
    trace.pipeline.unavailableReason === "persistence_failed" ||
    trace.pipeline.unavailableReason === "active_plan_exists"
  ) {
    return "persistence";
  }
  if (
    trace.pipeline.finalOutcome === "reviewed_draft_signed" ||
    trace.pipeline.unavailableReason === "running_plan_review_refused"
  ) {
    return "review";
  }
  if (trace.pipeline.unavailableReason === "ai_authored_plan_first_provider_schema_invalid") {
    return "schema";
  }
  if (
    trace.pipeline.normalizationStatus !== "not_started" ||
    trace.pipeline.finalOutcome === "canonical_draft_ready"
  ) {
    return "compiler";
  }
  if (trace.pipeline.parseStatus !== "not_started") return "parse";
  return "provider";
}

function resolveLocalRuntimePlanGenerationStatus(
  trace: AiPlanGenerationLedgerTrace,
): LocalRuntimeEventStatus {
  if (trace.pipeline.finalOutcome === "request_created") return "started";
  if (
    [
      "response_received",
      "canonical_draft_ready",
      "reviewed_draft_signed",
      "persisted_plan_created",
    ].includes(trace.pipeline.finalOutcome)
  ) {
    return "success";
  }
  return trace.pipeline.finalOutcome === "cancelled" ? "blocked" : "failure";
}

function resolveLocalRuntimePlanGenerationOutcomeCode(trace: AiPlanGenerationLedgerTrace) {
  if (trace.pipeline.unavailableReason === "ai_authored_plan_first_rejected_before_review") {
    return "compiler_rejection";
  }
  if (trace.pipeline.unavailableReason === "running_plan_review_refused") {
    return "review_refusal";
  }
  return trace.pipeline.unavailableReason ?? trace.pipeline.finalOutcome;
}

function safeArtifactWriteError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return sanitizeDiagnosticValue(`artifact_write_${(error as { code: string }).code}`);
  }
  return "artifact_write_failed";
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
