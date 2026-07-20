import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  recordLocalRuntimeActionFailure,
  recordLocalRuntimeActionOutcome,
  recordLocalRuntimeRequestFailure,
  recordLocalRuntimeRequestOutcome,
  writeLocalRuntimeEvent,
  type LocalRuntimeEvent,
} from "../src/lib/local-runtime-observability";

const root = await mkdtemp(join(tmpdir(), "hito-local-runtime-observability-"));
const blockedRoot = `${root}-blocked`;
const previousRuntimeUrl = process.env[LOCAL_RUNTIME_URL_ENV];
const previousRoot = process.env[LOCAL_RUNTIME_OBSERVABILITY_ROOT_ENV];
const privacyCanaries = {
  secret: "sk_LOCAL_OBSERVABILITY_SECRET_CANARY",
  cookie: "LOCAL_OBSERVABILITY_COOKIE_CANARY",
  runner: "runner-private+canary@example.test",
  provider: "LOCAL_OBSERVABILITY_PROVIDER_PAYLOAD_CANARY",
  error: "LOCAL_OBSERVABILITY_ERROR_MESSAGE_CANARY",
};

try {
  process.env[LOCAL_RUNTIME_URL_ENV] = "http://127.0.0.1:3000";
  process.env[LOCAL_RUNTIME_OBSERVABILITY_ROOT_ENV] = root;

  const archivedDateKey = await seedRotationProof(root);

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
    responseSchemaMode: "responses_json_schema_plan_first_strict",
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
    responseSchemaMode: "responses_json_schema_plan_first_strict",
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
  });
} finally {
  restoreEnv(LOCAL_RUNTIME_URL_ENV, previousRuntimeUrl);
  restoreEnv(LOCAL_RUNTIME_OBSERVABILITY_ROOT_ENV, previousRoot);
  await rm(root, { recursive: true, force: true });
  await rm(blockedRoot, { recursive: true, force: true });
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
  };
  await writeFile(join(activeDay, "events.jsonl"), `${JSON.stringify(archivedEvent)}\n`, "utf8");
  return archivedDateKey;
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
