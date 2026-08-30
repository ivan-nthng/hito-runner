import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmod, mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  createAiPlanGenerationLedgerTrace,
  markAiPlanGenerationPersistenceFailed,
  updateAiPlanGenerationLedgerTrace,
} from "../src/lib/ai-plan-generation-ledger";
import {
  LOCAL_RUNTIME_OBSERVABILITY_ROOT_ENV,
  LOCAL_RUNTIME_URL_ENV,
  createLocalRuntimeRequestContext,
  queryLocalRuntimeEvents,
  readLocalRuntimeArtifact,
  recordHitoRuntimeEvent,
  recordLocalProviderTranscript,
  recordLocalRuntimeActionFailure,
  recordLocalRuntimeActionOutcome,
  recordLocalRuntimeRequestFailure,
  recordLocalRuntimeRequestOutcome,
  resolveLocalRuntimeRoot,
  writeLocalRuntimeEvent,
  type LocalRuntimeEvent,
} from "../src/lib/local-runtime-observability";
import { WORKOUT_RESULT_OBSERVABILITY_OUTCOME_HEADER } from "../src/lib/workout-result-import/internal-types";

const root = await mkdtemp(join(tmpdir(), "hito-local-runtime-observability-"));
const blockedRoot = `${root}-blocked`;
const metadataFailureRoot = `${root}-metadata-failure`;
const previousRuntimeUrl = process.env[LOCAL_RUNTIME_URL_ENV];
const previousRoot = process.env[LOCAL_RUNTIME_OBSERVABILITY_ROOT_ENV];
const previousOpenAiApiKey = process.env.OPENAI_API_KEY;
const previousSupabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const privacyCanaries = {
  secret: "sk_LOCAL_OBSERVABILITY_SECRET_CANARY",
  cookie: "LOCAL_OBSERVABILITY_COOKIE_CANARY",
  runner: "runner-private+canary@example.test",
  provider: "LOCAL_OBSERVABILITY_PROVIDER_PAYLOAD_CANARY",
  error: "LOCAL_OBSERVABILITY_ERROR_MESSAGE_CANARY",
};
const forbiddenRawCanaries = {
  openAiKey: "sk_LOCAL_RAW_TRANSCRIPT_SECRET_CANARY",
  supabaseKey: "LOCAL_RAW_TRANSCRIPT_SUPABASE_SECRET_CANARY",
};

try {
  process.env[LOCAL_RUNTIME_URL_ENV] = "http://127.0.0.1:3000";
  process.env[LOCAL_RUNTIME_OBSERVABILITY_ROOT_ENV] = root;
  process.env.OPENAI_API_KEY = forbiddenRawCanaries.openAiKey;
  process.env.SUPABASE_SECRET_KEY = forbiddenRawCanaries.supabaseKey;

  const archivedDateKey = await seedRotationProof(root);
  const transcriptProof = await proveRawProviderTranscripts(root);

  const successContext = createLocalRuntimeRequestContext({
    request: new Request(
      `http://127.0.0.1:3000/workout/2026-07-18?runner=${privacyCanaries.runner}`,
      {
        headers: {
          authorization: `Bearer ${privacyCanaries.secret}`,
          cookie: `session=${privacyCanaries.cookie}`,
        },
      },
    ),
    pathname: `/workout/2026-07-18?runner=${privacyCanaries.runner}`,
    serverFunctionId: "server_fn_plan_preview",
  });
  await recordLocalRuntimeRequestOutcome({
    context: successContext,
    response: new Response(null, { status: 200 }),
    startedAtMs: Date.now() - 12,
  });

  const handledFailureContext = createLocalRuntimeRequestContext({
    request: new Request("http://127.0.0.1:3000/settings"),
    pathname: "/settings",
    serverFunctionId: "server_fn_settings_save",
  });
  await recordLocalRuntimeRequestOutcome({
    context: handledFailureContext,
    response: new Response(null, { status: 422 }),
    startedAtMs: Date.now() - 8,
  });

  const uploadFailureContext = createLocalRuntimeRequestContext({
    request: new Request("http://127.0.0.1:3000/api/workout-result/upload?file=private.fit", {
      method: "POST",
    }),
    pathname: "/api/:segment/:segment",
    serverFunctionId: null,
  });
  await recordLocalRuntimeRequestOutcome({
    context: uploadFailureContext,
    response: Response.json(
      {
        ok: false,
        code: "invalid_upload",
        message: privacyCanaries.error,
      },
      {
        status: 400,
        headers: { [WORKOUT_RESULT_OBSERVABILITY_OUTCOME_HEADER]: "invalid_upload" },
      },
    ),
    startedAtMs: Date.now() - 7,
  });

  const removeSuccessContext = createLocalRuntimeRequestContext({
    request: new Request("http://127.0.0.1:3000/api/workout-result/remove", { method: "POST" }),
    pathname: "/api/:segment/:segment",
    serverFunctionId: null,
  });
  await recordLocalRuntimeRequestOutcome({
    context: removeSuccessContext,
    response: Response.json({ ok: true }),
    startedAtMs: Date.now() - 6,
  });

  const unlistedApiFailureContext = createLocalRuntimeRequestContext({
    request: new Request("http://127.0.0.1:3000/api/private-route", { method: "POST" }),
    pathname: "/api/:segment",
    serverFunctionId: null,
  });
  await recordLocalRuntimeRequestOutcome({
    context: unlistedApiFailureContext,
    response: Response.json(
      { code: "invalid_upload", message: privacyCanaries.error },
      {
        status: 400,
        headers: { [WORKOUT_RESULT_OBSERVABILITY_OUTCOME_HEADER]: "invalid_upload" },
      },
    ),
    startedAtMs: Date.now() - 5,
  });

  const thrownFailureContext = createLocalRuntimeRequestContext({
    request: new Request("http://127.0.0.1:3000/api/auth/confirm"),
    pathname: "/api/auth/confirm",
    serverFunctionId: null,
  });
  await recordLocalRuntimeRequestFailure({
    context: thrownFailureContext,
    startedAtMs: Date.now() - 5,
    error: new Error(privacyCanaries.error),
  });

  let trace = await createAiPlanGenerationLedgerTrace({
    providerKind: "local_dev_fixture",
    model: "local-observability-proof",
    contractMode: "plan_first",
    responseSchemaMode: "responses_json_schema_plan_first_direct_v1_strict",
    systemPrompt: `system ${privacyCanaries.secret}`,
    userPrompt: `runner ${privacyCanaries.runner}`,
    responseSchema: {
      type: "object",
      properties: {
        providerCanary: { const: privacyCanaries.provider },
      },
    },
    timeoutMs: 0,
    maxOutputTokens: 4000,
  });
  trace =
    (await updateAiPlanGenerationLedgerTrace(
      trace,
      {
        provider: {
          ...trace.provider,
          responseId: "resp_local_observability_proof",
          responseStatus: "completed",
        },
        pipeline: {
          ...trace.pipeline,
          parseStatus: "parsed_json",
          normalizationStatus: "failed",
          issueCodes: ["fixed_rest_day_violation", "unknown_workout_atom"],
          finalOutcome: "rejected",
          unavailableReason: "ai_authored_plan_first_rejected_before_review",
        },
      },
      {
        forceArtifactWrite: true,
        artifactRoot: root,
        runtimeUrl: "http://127.0.0.1:3000",
      },
    )) ?? trace;

  assert.equal(trace.artifacts.written, true);
  assert.ok(trace.artifacts.path);
  assert.ok(trace.artifacts.expiresAt);
  assert.equal(trace.artifacts.path!.startsWith("/"), false);
  const ledgerPath = join(root, trace.artifacts.path!);
  assert.equal((await stat(ledgerPath)).mode & 0o777, 0o600);

  const compilerEvents = await queryLocalRuntimeEvents({
    root,
    generationId: trace.generationId,
    outcomeCode: "compiler_rejection",
  });
  assert.equal(compilerEvents.length, 1);
  assert.deepEqual(compilerEvents[0]?.diagnosticCodes, [
    "fixed_rest_day_violation",
    "unknown_workout_atom",
  ]);

  let persistenceTrace = await createAiPlanGenerationLedgerTrace({
    providerKind: "local_dev_fixture",
    model: "local-observability-proof",
    contractMode: "plan_first",
    responseSchemaMode: "responses_json_schema_plan_first_direct_v1_strict",
    systemPrompt: "redacted",
    userPrompt: "redacted",
    responseSchema: { type: "object" },
    timeoutMs: 0,
    maxOutputTokens: 4000,
  });
  persistenceTrace = {
    ...persistenceTrace,
    pipeline: {
      ...persistenceTrace.pipeline,
      parseStatus: "parsed_json",
      normalizationStatus: "normalized",
      finalOutcome: "reviewed_draft_signed",
    },
  };
  persistenceTrace =
    (await markAiPlanGenerationPersistenceFailed({
      trace: persistenceTrace,
      reason: "persistence_failed",
      options: {
        forceArtifactWrite: true,
        artifactRoot: root,
        runtimeUrl: "http://127.0.0.1:3000",
      },
    })) ?? persistenceTrace;
  const persistenceEvents = await queryLocalRuntimeEvents({
    root,
    generationId: persistenceTrace.generationId,
    outcomeCode: "persistence_failed",
  });
  assert.equal(persistenceEvents.length, 1);
  assert.equal(persistenceEvents[0]?.phase, "persistence");

  const requestEvents = await queryLocalRuntimeEvents({
    root,
    requestId: successContext.requestId,
  });
  assert.equal(requestEvents.length, 1);
  assert.equal(requestEvents[0]?.route, "/workout/:date");
  assert.equal(requestEvents[0]?.outcomeCode, "request_completed");

  const routeEvents = await queryLocalRuntimeEvents({
    root,
    route: "/settings",
    outcomeCode: "http_client_error",
  });
  assert.equal(routeEvents.length, 1);
  assert.equal(routeEvents[0]?.httpStatus, 422);

  const uploadEvents = await queryLocalRuntimeEvents({
    root,
    operation: "workout_result_upload",
    outcomeCode: "invalid_upload",
  });
  assert.equal(uploadEvents.length, 1);
  assert.equal(uploadEvents[0]?.route, "/api/:segment/:segment");
  assert.equal(uploadEvents[0]?.operation, "workout_result_upload");
  assert.deepEqual(uploadEvents[0]?.diagnosticCodes, []);

  const removeEvents = await queryLocalRuntimeEvents({
    root,
    operation: "workout_result_remove",
    outcomeCode: "request_completed",
  });
  assert.equal(removeEvents.length, 1);
  assert.equal(removeEvents[0]?.operation, "workout_result_remove");

  const unlistedApiEvents = await queryLocalRuntimeEvents({
    root,
    requestId: unlistedApiFailureContext.requestId,
  });
  assert.equal(unlistedApiEvents.length, 1);
  assert.equal(unlistedApiEvents[0]?.operation, null);
  assert.equal(unlistedApiEvents[0]?.outcomeCode, "http_client_error");

  const failureEvents = await queryLocalRuntimeEvents({
    root,
    outcomeCode: "unhandled_request_error",
  });
  assert.equal(failureEvents.length, 1);
  assert.deepEqual(failureEvents[0]?.diagnosticCodes, ["error"]);

  await recordLocalRuntimeActionOutcome({
    result: {
      ok: false,
      reason: "stale_review",
      message: privacyCanaries.runner,
    },
    method: "POST",
    serverFunctionId: "server_fn_plan_confirm",
    startedAtMs: Date.now() - 4,
  });
  await recordLocalRuntimeActionOutcome({
    result: {
      ok: false,
      reason: privacyCanaries.runner,
    },
    method: "POST",
    serverFunctionId: "server_fn_privacy_proof",
    startedAtMs: Date.now() - 3,
  });
  await recordLocalRuntimeActionFailure({
    method: "POST",
    serverFunctionId: "server_fn_throw_proof",
    startedAtMs: Date.now() - 2,
    error: new Error(privacyCanaries.error),
  });
  const actionEvents = await queryLocalRuntimeEvents({
    root,
    outcomeCode: "stale_review",
  });
  assert.equal(actionEvents.length, 1);
  const genericActionFailures = await queryLocalRuntimeEvents({
    root,
    outcomeCode: "action_failed",
  });
  assert.equal(genericActionFailures.length, 1);
  const thrownActionFailures = await queryLocalRuntimeEvents({
    root,
    outcomeCode: "action_threw",
  });
  assert.equal(thrownActionFailures.length, 1);

  const defaultEvents = await queryLocalRuntimeEvents({ root, limit: 1000 });
  assert.equal(
    defaultEvents.some((event) => event.outcomeCode === "archived_proof_event"),
    false,
  );
  const archiveEvents = await queryLocalRuntimeEvents({
    root,
    includeArchive: true,
    outcomeCode: "archived_proof_event",
    limit: 1000,
  });
  assert.equal(archiveEvents.length, 1);

  await writeLocalRuntimeEvent(
    {
      category: "request",
      event: "request_failed",
      status: "failure",
      phase: "request",
      outcomeCode: "must_not_write",
    },
    {
      forceWrite: true,
      root: blockedRoot,
      runtimeUrl: "https://hosted.example.test",
    },
  );
  await assert.rejects(stat(blockedRoot), /ENOENT/);

  const productionSafeLogs: string[] = [];
  const originalConsoleInfo = console.info;
  console.info = (...values: unknown[]) => productionSafeLogs.push(values.join(" "));
  try {
    await recordHitoRuntimeEvent(
      {
        category: "plan_generation",
        event: "initial_plan_preflight_rejected",
        status: "blocked",
        phase: "persistence",
        outcomeCode: "initial_plan_request_facts_mismatch",
        requestId: "request_redacted_proof",
        providerKind: "not_started",
        diagnosticCodes: ["age", "height_cm"],
      },
      { runtimeUrl: "https://www.hitocajon.com" },
    );
  } finally {
    console.info = originalConsoleInfo;
  }
  assert.equal(productionSafeLogs.length, 1);
  assert.match(productionSafeLogs[0]!, /hito_production_safe_event_v1/);
  assert.match(productionSafeLogs[0]!, /request_redacted_proof/);
  assert.match(productionSafeLogs[0]!, /"diagnosticFields":\["age","height_cm"\]/);
  assert.doesNotMatch(productionSafeLogs[0]!, /providerResponseId|rawArtifactPath/);

  const activeDays = (await stat(join(root, "active"))).isDirectory();
  const archivedOldDay = (await stat(join(root, "archive", archivedDateKey))).isDirectory();
  assert.equal(activeDays, true);
  assert.equal(archivedOldDay, true);

  const persistedText = await readPersistedProof(root, trace.artifacts.path!);
  for (const canary of Object.values(privacyCanaries)) {
    assert.doesNotMatch(persistedText, new RegExp(escapeRegExp(canary), "i"));
  }
  assert.doesNotMatch(persistedText, /authorization|cookie|raw.?prompt|provider.?payload/i);

  console.log("Local runtime observability contract passed.", {
    requestId: successContext.requestId,
    generationId: trace.generationId,
    activeEventCount: defaultEvents.length,
    compilerDiagnosticCodes: compilerEvents[0]?.diagnosticCodes,
    archivedOldDay: archivedDateKey,
    nonLoopbackWriteBlocked: true,
    rawTranscriptGenerationId: transcriptProof.completedGenerationId,
    rawTranscriptArchived: transcriptProof.incompleteArchived,
    defaultRoot: transcriptProof.defaultRoot,
  });
} finally {
  restoreEnv(LOCAL_RUNTIME_URL_ENV, previousRuntimeUrl);
  restoreEnv(LOCAL_RUNTIME_OBSERVABILITY_ROOT_ENV, previousRoot);
  restoreEnv("OPENAI_API_KEY", previousOpenAiApiKey);
  restoreEnv("SUPABASE_SECRET_KEY", previousSupabaseSecretKey);
  await rm(root, { recursive: true, force: true });
  await rm(blockedRoot, { recursive: true, force: true });
  await rm(metadataFailureRoot, { recursive: true, force: true });
}

async function seedRotationProof(observabilityRoot: string) {
  const oldDate = new Date();
  oldDate.setHours(12, 0, 0, 0);
  oldDate.setDate(oldDate.getDate() - 4);
  const archivedDateKey = localDateKey(oldDate);
  const activeDay = join(observabilityRoot, "active", archivedDateKey);
  await mkdir(activeDay, { recursive: true });
  const archivedEvent: LocalRuntimeEvent = {
    artifactKind: "hito_local_runtime_event_v1",
    timestamp: oldDate.toISOString(),
    category: "request",
    event: "request_failed",
    status: "failure",
    phase: "request",
    outcomeCode: "archived_proof_event",
    requestId: null,
    generationId: null,
    route: "/",
    operation: null,
    method: "get",
    serverFunctionId: null,
    httpStatus: 500,
    elapsedMs: 1,
    providerKind: null,
    providerResponseId: null,
    parseStatus: null,
    normalizationStatus: null,
    diagnosticCodes: [],
    canonicalRowCount: null,
    rawArtifactPath: null,
  };
  await writeFile(join(activeDay, "events.jsonl"), `${JSON.stringify(archivedEvent)}\n`, "utf8");
  return archivedDateKey;
}

async function proveRawProviderTranscripts(observabilityRoot: string) {
  const completedGenerationId = "generation_completed_transcript_proof";
  const completedRequestId = "request_completed_transcript_proof";
  const completedRequestCanary = "RAW_COMPLETED_REQUEST_BODY_CANARY";
  const completedResponseCanary = "RAW_COMPLETED_RESPONSE_BODY_CANARY";
  const redactedRunnerContextCanary = "RUNNER_CONTEXT_TRANSCRIPT_REDACTION_CANARY";
  const completedAt = new Date();
  completedAt.setHours(12, 0, 0, 0);
  const completed = await recordLocalProviderTranscript(
    {
      requestId: completedRequestId,
      generationId: completedGenerationId,
      providerResponseId: "resp_completed_transcript_proof",
      model: "gpt-proof",
      outcome: "completed",
      providerStatus: "completed",
      httpStatus: 200,
      responseContentType: "application/json",
      requestStartedAt: completedAt.toISOString(),
      responseReceivedAt: new Date(completedAt.getTime() + 500).toISOString(),
      requestBody: JSON.stringify({
        input: completedRequestCanary,
        runnerContext: redactedRunnerContextCanary,
      }),
      responseBody: JSON.stringify({
        output: completedResponseCanary,
        echoedRunnerContext: redactedRunnerContextCanary,
      }),
      redactedValues: [redactedRunnerContextCanary],
    },
    {
      forceWrite: true,
      root: observabilityRoot,
      runtimeUrl: "http://127.0.0.1:3000",
      now: completedAt,
    },
  );
  assert.equal(completed.written, true);
  assert.ok(completed.rawArtifactPath);

  const completedEvents = await queryLocalRuntimeEvents({
    root: observabilityRoot,
    generationId: completedGenerationId,
    outcomeCode: "provider_transcript_completed",
  });
  assert.equal(completedEvents.length, 1);
  assert.equal(completedEvents[0]?.requestId, completedRequestId);
  assert.equal(completedEvents[0]?.providerResponseId, "resp_completed_transcript_proof");
  assert.equal(completedEvents[0]?.rawArtifactPath, completed.rawArtifactPath);
  const metadataOnly = JSON.stringify(completedEvents);
  assert.doesNotMatch(metadataOnly, new RegExp(completedRequestCanary));
  assert.doesNotMatch(metadataOnly, new RegExp(completedResponseCanary));

  const completedArtifactPath = await readLocalRuntimeArtifact({
    root: observabilityRoot,
    rawArtifactPath: completed.rawArtifactPath!,
  }).then((artifact) => artifact.absolutePath);
  await chmod(completedArtifactPath, 0o000);
  try {
    const listingWithUnreadableRaw = await queryLocalRuntimeEvents({
      root: observabilityRoot,
      generationId: completedGenerationId,
    });
    assert.equal(listingWithUnreadableRaw.length, 1);
  } finally {
    await chmod(completedArtifactPath, 0o600);
  }

  const completedArtifact = await readLocalRuntimeArtifact({
    root: observabilityRoot,
    rawArtifactPath: completed.rawArtifactPath!,
  });
  assert.match(completedArtifact.contents, new RegExp(completedRequestCanary));
  assert.match(completedArtifact.contents, new RegExp(completedResponseCanary));
  assert.doesNotMatch(completedArtifact.contents, new RegExp(redactedRunnerContextCanary));
  assert.match(completedArtifact.contents, /\[REDACTED_RUNNER_CONTEXT\]/);
  for (const canary of Object.values(forbiddenRawCanaries)) {
    assert.doesNotMatch(completedArtifact.contents, new RegExp(canary));
  }
  assert.equal((await stat(completedArtifact.absolutePath)).mode & 0o777, 0o600);
  assert.equal((await stat(dirname(completedArtifact.absolutePath))).mode & 0o777, 0o700);

  const metadataCli = runLocalLogsCli([
    "--generation-id",
    completedGenerationId,
    "--root",
    observabilityRoot,
  ]);
  assert.doesNotMatch(metadataCli, new RegExp(completedRequestCanary));
  assert.match(metadataCli, /rawArtifactPath/);
  const retrievalCli = runLocalLogsCli([
    "--generation-id",
    completedGenerationId,
    "--raw-transcript",
    "--root",
    observabilityRoot,
  ]);
  assert.match(retrievalCli, new RegExp(completedRequestCanary));
  assert.match(retrievalCli, new RegExp(completedResponseCanary));

  const malformedGenerationId = "generation_malformed_transcript_redaction_proof";
  const malformedRunnerContextCanary = 'Recent "threshold" run\nfelt controlled.';
  const escapedRunnerContextCanary = JSON.stringify(
    JSON.stringify(malformedRunnerContextCanary),
  ).slice(1, -1);
  const malformed = await recordLocalProviderTranscript(
    {
      requestId: "request_malformed_transcript_redaction_proof",
      generationId: malformedGenerationId,
      providerResponseId: "resp_malformed_transcript_redaction_proof",
      model: "gpt-proof",
      outcome: "malformed_response",
      providerStatus: "failed",
      httpStatus: 200,
      responseContentType: "application/json",
      requestStartedAt: new Date(completedAt.getTime() + 1_000).toISOString(),
      responseReceivedAt: new Date(completedAt.getTime() + 1_500).toISOString(),
      requestBody: JSON.stringify({ runnerContext: malformedRunnerContextCanary }),
      responseBody: `{"output_text":"${escapedRunnerContextCanary}`,
      redactedValues: [malformedRunnerContextCanary],
    },
    {
      forceWrite: true,
      root: observabilityRoot,
      runtimeUrl: "http://127.0.0.1:3000",
      now: completedAt,
    },
  );
  assert.equal(malformed.written, true);
  assert.ok(malformed.rawArtifactPath);
  const malformedArtifact = await readLocalRuntimeArtifact({
    root: observabilityRoot,
    rawArtifactPath: malformed.rawArtifactPath!,
  });
  assert.doesNotMatch(malformedArtifact.contents, /Recent/);
  assert.doesNotMatch(malformedArtifact.contents, /threshold/);
  assert.doesNotMatch(malformedArtifact.contents, /felt controlled/);
  assert.match(malformedArtifact.contents, /\[REDACTED_RUNNER_CONTEXT\]/);

  const oldAt = new Date(completedAt);
  oldAt.setDate(oldAt.getDate() - 4);
  const incompleteGenerationId = "generation_incomplete_transcript_proof";
  const incomplete = await recordLocalProviderTranscript(
    {
      requestId: "request_incomplete_transcript_proof",
      generationId: incompleteGenerationId,
      providerResponseId: "resp_incomplete_transcript_proof",
      model: "gpt-proof",
      outcome: "incomplete",
      providerStatus: "incomplete",
      httpStatus: 200,
      responseContentType: "application/json",
      requestStartedAt: oldAt.toISOString(),
      responseReceivedAt: new Date(oldAt.getTime() + 500).toISOString(),
      requestBody: JSON.stringify({ input: "RAW_INCOMPLETE_REQUEST_BODY_CANARY" }),
      responseBody: JSON.stringify({ status: "incomplete" }),
    },
    {
      forceWrite: true,
      root: observabilityRoot,
      runtimeUrl: "http://127.0.0.1:3000",
      now: oldAt,
    },
  );
  assert.equal(incomplete.written, true);
  assert.ok(incomplete.rawArtifactPath);

  await writeLocalRuntimeEvent(
    {
      category: "request",
      event: "rotation_trigger",
      status: "success",
      phase: "request",
      outcomeCode: "rotation_trigger",
      timestamp: completedAt.toISOString(),
    },
    {
      forceWrite: true,
      root: observabilityRoot,
      runtimeUrl: "http://127.0.0.1:3000",
      now: completedAt,
    },
  );
  const incompleteEvents = await queryLocalRuntimeEvents({
    root: observabilityRoot,
    includeArchive: true,
    generationId: incompleteGenerationId,
  });
  assert.equal(incompleteEvents.length, 1);
  const archivedArtifact = await readLocalRuntimeArtifact({
    root: observabilityRoot,
    rawArtifactPath: incomplete.rawArtifactPath!,
  });
  assert.match(archivedArtifact.absolutePath, /\/archive\//);

  const hosted = await recordLocalProviderTranscript(
    {
      generationId: "generation_hosted_blocked",
      model: "gpt-proof",
      outcome: "failed",
      requestStartedAt: completedAt.toISOString(),
      requestBody: "{}",
      responseBody: "{}",
    },
    {
      forceWrite: true,
      root: `${observabilityRoot}-hosted`,
      runtimeUrl: "https://hosted.example.test",
    },
  );
  assert.equal(hosted.written, false);
  await assert.rejects(stat(`${observabilityRoot}-hosted`), /ENOENT/);

  const repositoryRawRoot = join(process.cwd(), "logs", "unsafe-raw-transcript-proof");
  const repositoryWrite = await recordLocalProviderTranscript(
    {
      generationId: "generation_repository_blocked",
      model: "gpt-proof",
      outcome: "failed",
      requestStartedAt: completedAt.toISOString(),
      requestBody: "{}",
      responseBody: "{}",
    },
    {
      forceWrite: true,
      root: repositoryRawRoot,
      runtimeUrl: "http://127.0.0.1:3000",
    },
  );
  assert.equal(repositoryWrite.written, false);
  await assert.rejects(stat(repositoryRawRoot), /ENOENT/);

  const metadataFailureDate = localDateKey(completedAt);
  await mkdir(join(metadataFailureRoot, "active", metadataFailureDate, "events.jsonl"), {
    recursive: true,
  });
  const metadataFailure = await recordLocalProviderTranscript(
    {
      generationId: "generation_metadata_failure",
      model: "gpt-proof",
      outcome: "completed",
      requestStartedAt: completedAt.toISOString(),
      requestBody: "{}",
      responseBody: "{}",
    },
    {
      forceWrite: true,
      root: metadataFailureRoot,
      runtimeUrl: "http://127.0.0.1:3000",
      now: completedAt,
    },
  );
  assert.equal(metadataFailure.written, false);
  const orphanPath = join(
    metadataFailureRoot,
    "active",
    metadataFailureDate,
    "provider-transcripts",
    `${completedAt.toISOString().replace(/[:.]/g, "-")}-generation_metadata_failure.json`,
  );
  await assert.rejects(stat(orphanPath), /ENOENT/);

  delete process.env[LOCAL_RUNTIME_OBSERVABILITY_ROOT_ENV];
  const defaultRoot = resolveLocalRuntimeRoot();
  process.env[LOCAL_RUNTIME_OBSERVABILITY_ROOT_ENV] = observabilityRoot;
  assert.equal(defaultRoot.startsWith(process.cwd()), false);
  assert.match(defaultRoot, /\/Library\/Caches\/hito-running\/local-runtime-observability$/);

  return {
    completedGenerationId,
    incompleteArchived: true,
    defaultRoot,
  };
}

function runLocalLogsCli(args: string[]) {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "./scripts/query-local-runtime-events.ts", ...args],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

async function readPersistedProof(observabilityRoot: string, ledgerRelativePath: string) {
  const activeRoot = join(observabilityRoot, "active");
  const dayDirectories = await import("node:fs/promises").then(({ readdir }) =>
    readdir(activeRoot, { withFileTypes: true }),
  );
  const contents = await Promise.all(
    dayDirectories
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => [
        readFile(join(activeRoot, entry.name, "events.jsonl"), "utf8").catch(() => ""),
      ]),
  );
  contents.push(await readFile(join(observabilityRoot, ledgerRelativePath), "utf8"));
  return contents.join("\n");
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function localDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
