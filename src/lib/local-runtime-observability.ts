import { getGlobalStartContext } from "@tanstack/react-start";
import { isLoopbackRuntimeUrl } from "@/lib/supabase/env";

export const LOCAL_RUNTIME_OBSERVABILITY_ROOT_ENV = "HITO_LOCAL_RUNTIME_OBSERVABILITY_ROOT";
export const LOCAL_RUNTIME_URL_ENV = "HITO_LOCAL_RUNTIME_URL";
export const LOCAL_RUNTIME_OBSERVABILITY_ENABLED_ENV = "HITO_LOCAL_RUNTIME_OBSERVABILITY";
export const LOCAL_RUNTIME_ACTIVE_CALENDAR_DAYS = 3;
export const LOCAL_PROVIDER_TRANSCRIPT_CATEGORY = "provider-transcripts";

export type LocalProviderTranscriptOutcome =
  | "completed"
  | "incomplete"
  | "failed"
  | "cancelled"
  | "provider_not_completed"
  | "http_error"
  | "malformed_response"
  | "response_read_failed"
  | "transport_error"
  | "timeout";

export type LocalRuntimeEventCategory = "request" | "action" | "plan_generation";
export type LocalRuntimeEventStatus = "started" | "success" | "failure" | "blocked";
export type LocalRuntimeEventPhase =
  | "request"
  | "action"
  | "provider"
  | "parse"
  | "schema"
  | "compiler"
  | "review"
  | "persistence";

export interface LocalRuntimeRequestContext {
  requestId: string;
  runtimeUrl: string;
  route: string;
  method: string;
  serverFunctionId: string | null;
}

export interface LocalRuntimeEventInput {
  category: LocalRuntimeEventCategory;
  event: string;
  status: LocalRuntimeEventStatus;
  phase: LocalRuntimeEventPhase;
  outcomeCode: string;
  timestamp?: string;
  requestId?: string | null;
  generationId?: string | null;
  route?: string | null;
  method?: string | null;
  serverFunctionId?: string | null;
  httpStatus?: number | null;
  elapsedMs?: number | null;
  providerKind?: string | null;
  providerResponseId?: string | null;
  parseStatus?: string | null;
  normalizationStatus?: string | null;
  diagnosticCodes?: readonly string[];
  canonicalRowCount?: number | null;
  rawArtifactPath?: string | null;
}

export interface LocalRuntimeEvent {
  artifactKind: "hito_local_runtime_event_v1";
  timestamp: string;
  category: LocalRuntimeEventCategory;
  event: string;
  status: LocalRuntimeEventStatus;
  phase: LocalRuntimeEventPhase;
  outcomeCode: string;
  requestId: string | null;
  generationId: string | null;
  route: string | null;
  method: string | null;
  serverFunctionId: string | null;
  httpStatus: number | null;
  elapsedMs: number | null;
  providerKind: string | null;
  providerResponseId: string | null;
  parseStatus: string | null;
  normalizationStatus: string | null;
  diagnosticCodes: readonly string[];
  canonicalRowCount: number | null;
  rawArtifactPath: string | null;
}

export interface LocalRuntimeObservabilityOptions {
  disabled?: boolean;
  forceWrite?: boolean;
  root?: string | null;
  runtimeUrl?: string | null;
  now?: Date;
}

export interface LocalRuntimeEventQuery {
  root?: string | null;
  includeArchive?: boolean;
  since?: string | null;
  until?: string | null;
  requestId?: string | null;
  generationId?: string | null;
  providerResponseId?: string | null;
  route?: string | null;
  outcomeCode?: string | null;
  limit?: number;
}

export interface LocalProviderTranscriptInput {
  requestId?: string | null;
  generationId: string;
  providerResponseId?: string | null;
  model: string;
  outcome: LocalProviderTranscriptOutcome;
  providerStatus?: string | null;
  httpStatus?: number | null;
  responseContentType?: string | null;
  requestStartedAt: string;
  responseReceivedAt?: string | null;
  requestBody: string;
  responseBody?: string | null;
}

export function createLocalRuntimeRequestContext(input: {
  request: Request;
  pathname: string;
  serverFunctionId?: string | null;
}): LocalRuntimeRequestContext {
  return {
    requestId: createCorrelationId(),
    runtimeUrl: safeOrigin(input.request.url) ?? input.request.url,
    route: sanitizeRoute(input.pathname),
    method: sanitizeCode(input.request.method, 12),
    serverFunctionId: sanitizeNullableCode(input.serverFunctionId, 160),
  };
}

export function getCurrentLocalRuntimeRequestContext(): LocalRuntimeRequestContext | null {
  try {
    const context = getGlobalStartContext() as
      | { localRuntimeObservability?: LocalRuntimeRequestContext }
      | undefined;
    return context?.localRuntimeObservability ?? null;
  } catch {
    return null;
  }
}

export async function recordLocalRuntimeRequestOutcome(input: {
  context: LocalRuntimeRequestContext;
  response: Response;
  startedAtMs: number;
}) {
  const failure = input.response.status >= 400;

  return writeLocalRuntimeEvent(
    {
      category: "request",
      event: failure ? "request_failed" : "request_completed",
      status: failure ? "failure" : "success",
      phase: "request",
      outcomeCode:
        input.response.status >= 500
          ? "http_server_error"
          : input.response.status >= 400
            ? "http_client_error"
            : "request_completed",
      requestId: input.context.requestId,
      route: input.context.route,
      method: input.context.method,
      serverFunctionId: input.context.serverFunctionId,
      httpStatus: input.response.status,
      elapsedMs: Date.now() - input.startedAtMs,
    },
    { runtimeUrl: input.context.runtimeUrl },
  );
}

export async function recordLocalRuntimeRequestFailure(input: {
  context: LocalRuntimeRequestContext;
  startedAtMs: number;
  error: unknown;
}) {
  return writeLocalRuntimeEvent(
    {
      category: "request",
      event: "request_failed",
      status: "failure",
      phase: "request",
      outcomeCode: "unhandled_request_error",
      requestId: input.context.requestId,
      route: input.context.route,
      method: input.context.method,
      serverFunctionId: input.context.serverFunctionId,
      elapsedMs: Date.now() - input.startedAtMs,
      diagnosticCodes: [safeErrorClass(input.error)],
    },
    { runtimeUrl: input.context.runtimeUrl },
  );
}

export async function recordLocalRuntimeActionOutcome(input: {
  result: unknown;
  method: string;
  serverFunctionId: string | null;
  startedAtMs: number;
}) {
  const requestContext = getCurrentLocalRuntimeRequestContext();
  const outcome = classifyActionOutcome(input.result);

  return writeLocalRuntimeEvent(
    {
      category: "action",
      event: outcome.failed ? "action_failed" : "action_completed",
      status: outcome.failed ? "failure" : "success",
      phase: "action",
      outcomeCode: outcome.code,
      requestId: requestContext?.requestId,
      route: requestContext?.route,
      method: input.method,
      serverFunctionId: input.serverFunctionId,
      elapsedMs: Date.now() - input.startedAtMs,
    },
    { runtimeUrl: requestContext?.runtimeUrl },
  );
}

export async function recordLocalRuntimeActionFailure(input: {
  method: string;
  serverFunctionId: string | null;
  startedAtMs: number;
  error: unknown;
}) {
  const requestContext = getCurrentLocalRuntimeRequestContext();

  return writeLocalRuntimeEvent(
    {
      category: "action",
      event: "action_failed",
      status: "failure",
      phase: "action",
      outcomeCode: "action_threw",
      requestId: requestContext?.requestId,
      route: requestContext?.route,
      method: input.method,
      serverFunctionId: input.serverFunctionId,
      elapsedMs: Date.now() - input.startedAtMs,
      diagnosticCodes: [safeErrorClass(input.error)],
    },
    { runtimeUrl: requestContext?.runtimeUrl },
  );
}

export async function writeLocalRuntimeEvent(
  input: LocalRuntimeEventInput,
  options?: LocalRuntimeObservabilityOptions,
): Promise<{ event: LocalRuntimeEvent; written: boolean; relativePath: string | null }> {
  const event = sanitizeLocalRuntimeEvent(input);
  const resolved = resolveLocalRuntimeWrite(options);

  if (!resolved) {
    return { event, written: false, relativePath: null };
  }

  const { appendFile, chmod, mkdir } = await importNodeFsPromises();
  const { dirname, join } = await importNodePath();
  await prepareLocalRuntimeRoot({
    root: resolved.root,
    now: resolved.now,
  });

  const dateKey = localCalendarDateKey(new Date(event.timestamp));
  const relativePath = join("active", dateKey, "events.jsonl");
  const absolutePath = join(resolved.root, relativePath);
  await mkdir(join(resolved.root, "active", dateKey), { recursive: true, mode: 0o700 });
  await chmod(dirname(absolutePath), 0o700);
  await appendFile(absolutePath, `${JSON.stringify(event)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  await chmod(absolutePath, 0o600);

  return { event, written: true, relativePath };
}

export async function writeLocalRuntimeArtifact(input: {
  category: string;
  filename: string;
  timestamp: string;
  payload: string;
  existingRelativePath?: string | null;
  options?: LocalRuntimeObservabilityOptions;
}): Promise<
  | {
      written: true;
      relativePath: string;
      archiveAfter: string;
    }
  | {
      written: false;
      relativePath: null;
      archiveAfter: null;
    }
> {
  const resolved = resolveLocalRuntimeWrite(input.options);
  if (!resolved) {
    return { written: false, relativePath: null, archiveAfter: null };
  }

  const { chmod, mkdir, rename, writeFile } = await importNodeFsPromises();
  const { dirname, resolve } = await importNodePath();
  await prepareLocalRuntimeRoot({
    root: resolved.root,
    now: resolved.now,
  });

  const defaultRelativePath = resolveLocalRuntimeArtifactRelativePath({
    category: input.category,
    filename: input.filename,
    timestamp: input.timestamp,
  });
  const relativePath = isSafeRelativeArtifactPath(input.existingRelativePath)
    ? input.existingRelativePath!
    : defaultRelativePath;
  const absolutePath = resolve(resolved.root, relativePath);
  const normalizedRoot = withTrailingSeparator(resolve(resolved.root));
  if (!withTrailingSeparator(absolutePath).startsWith(normalizedRoot)) {
    throw new Error("local_runtime_artifact_path_outside_root");
  }

  const temporaryPath = `${absolutePath}.${createCorrelationId()}.tmp`;
  await mkdir(dirname(absolutePath), { recursive: true, mode: 0o700 });
  await Promise.all([
    chmod(dirname(absolutePath), 0o700),
    chmod(dirname(dirname(absolutePath)), 0o700),
  ]);
  await writeFile(temporaryPath, input.payload, { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, absolutePath);
  await chmod(absolutePath, 0o600);

  return {
    written: true,
    relativePath,
    archiveAfter: archiveAfterTimestamp(new Date(input.timestamp)),
  };
}

export async function recordLocalProviderTranscript(
  input: LocalProviderTranscriptInput,
  options?: LocalRuntimeObservabilityOptions,
): Promise<{ written: boolean; rawArtifactPath: string | null }> {
  const requestContext = getCurrentLocalRuntimeRequestContext();
  const processLike = getProcessLike();
  const runtimeUrl =
    options?.runtimeUrl?.trim() ||
    requestContext?.runtimeUrl ||
    processLike?.env?.[LOCAL_RUNTIME_URL_ENV]?.trim();
  if (options?.disabled || !isLoopbackRuntimeUrl(runtimeUrl)) {
    return { written: false, rawArtifactPath: null };
  }

  const root = resolveLocalRuntimeRoot(options?.root);
  if (!(await isPrivateLocalArtifactRoot(root))) {
    return { written: false, rawArtifactPath: null };
  }

  const generationId = sanitizeCode(input.generationId, 120);
  const requestStartedAt = safeTimestamp(input.requestStartedAt);
  const filename = `${requestStartedAt.replace(/[:.]/g, "-")}-${generationId}.json`;
  const localOptions: LocalRuntimeObservabilityOptions = {
    ...options,
    forceWrite: true,
    root,
    runtimeUrl,
  };
  let transcriptRelativePath: string | null = null;

  try {
    const transcriptWrite = await writeLocalRuntimeArtifact({
      category: LOCAL_PROVIDER_TRANSCRIPT_CATEGORY,
      filename,
      timestamp: requestStartedAt,
      payload: `${JSON.stringify(
        {
          artifactKind: "hito_local_provider_transcript_v1",
          requestId: sanitizeNullableCode(input.requestId ?? requestContext?.requestId, 120),
          generationId,
          providerResponseId: sanitizeNullableCode(input.providerResponseId, 160),
          providerKind: "openai_responses_api",
          model: sanitizeCode(input.model, 120),
          outcome: input.outcome,
          providerStatus: sanitizeNullableCode(input.providerStatus, 80),
          httpStatus: boundedInteger(input.httpStatus, 100, 599),
          requestStartedAt,
          responseReceivedAt:
            input.responseReceivedAt == null ? null : safeTimestamp(input.responseReceivedAt),
          recordedAt: new Date().toISOString(),
          request: {
            method: "POST",
            url: "https://api.openai.com/v1/responses",
            contentType: "application/json",
            body: input.requestBody,
          },
          response: {
            contentType: sanitizeNullableCode(input.responseContentType, 120),
            body: input.responseBody ?? null,
          },
        },
        null,
        2,
      )}\n`,
      options: localOptions,
    });
    if (!transcriptWrite.written) {
      return { written: false, rawArtifactPath: null };
    }
    transcriptRelativePath = transcriptWrite.relativePath;

    const rawArtifactPath = toArtifactLocator(transcriptWrite.relativePath);
    const eventWrite = await writeLocalRuntimeEvent(
      {
        category: "plan_generation",
        event: "provider_transcript_recorded",
        status: input.outcome === "completed" ? "success" : "failure",
        phase: "provider",
        outcomeCode: `provider_transcript_${input.outcome}`,
        timestamp: requestStartedAt,
        requestId: input.requestId ?? requestContext?.requestId,
        generationId,
        providerKind: "openai_responses_api",
        providerResponseId: input.providerResponseId,
        httpStatus: input.httpStatus,
        rawArtifactPath,
      },
      localOptions,
    );
    if (!eventWrite.written) {
      throw new Error("provider_transcript_metadata_write_failed");
    }
    return {
      written: true,
      rawArtifactPath,
    };
  } catch {
    if (transcriptRelativePath) {
      await removeLocalRuntimeArtifact(root, transcriptRelativePath).catch(() => undefined);
    }
    await writeLocalRuntimeEvent(
      {
        category: "plan_generation",
        event: "provider_transcript_write_failed",
        status: "failure",
        phase: "provider",
        outcomeCode: "provider_transcript_write_failed",
        timestamp: requestStartedAt,
        requestId: input.requestId ?? requestContext?.requestId,
        generationId,
        providerKind: "openai_responses_api",
        providerResponseId: input.providerResponseId,
      },
      localOptions,
    ).catch(() => undefined);
    return { written: false, rawArtifactPath: null };
  }
}

export async function readLocalRuntimeArtifact(input: {
  rawArtifactPath: string;
  root?: string | null;
}): Promise<{ absolutePath: string; contents: string }> {
  if (!isSafeArtifactLocator(input.rawArtifactPath)) {
    throw new Error("local_runtime_artifact_path_invalid");
  }

  const root = resolveLocalRuntimeRoot(input.root);
  const { readFile, readdir } = await importNodeFsPromises();
  const { join, resolve } = await importNodePath();
  const [dateKey, ...artifactSegments] = input.rawArtifactPath.split("/");
  const archiveDates = (await readDirectories(join(root, "archive"), readdir)).filter(
    (entry) => entry === dateKey || entry.startsWith(`${dateKey}-`),
  );
  const candidates = [
    join(root, "active", dateKey!, ...artifactSegments),
    ...archiveDates.map((entry) => join(root, "archive", entry, ...artifactSegments)),
  ];
  const normalizedRoot = withTrailingSeparator(resolve(root));

  for (const candidate of candidates) {
    const absolutePath = resolve(candidate);
    if (!withTrailingSeparator(absolutePath).startsWith(normalizedRoot)) {
      continue;
    }
    try {
      return {
        absolutePath,
        contents: await readFile(absolutePath, "utf8"),
      };
    } catch (error) {
      if (!isNodeErrorCode(error, "ENOENT")) {
        throw error;
      }
    }
  }

  throw new Error("local_runtime_artifact_not_found");
}

export async function queryLocalRuntimeEvents(
  query: LocalRuntimeEventQuery = {},
): Promise<LocalRuntimeEvent[]> {
  const root = resolveLocalRuntimeRoot(query.root);
  const { readFile, readdir } = await importNodeFsPromises();
  const { join } = await importNodePath();
  const roots = [join(root, "active")];
  if (query.includeArchive) {
    roots.push(join(root, "archive"));
  }

  const eventPaths: string[] = [];
  for (const eventsRoot of roots) {
    const dateDirectories = await readDirectories(eventsRoot, readdir);
    for (const dateDirectory of dateDirectories) {
      const candidate = join(eventsRoot, dateDirectory, "events.jsonl");
      if (await fileExists(candidate)) {
        eventPaths.push(candidate);
      }
    }
  }

  const events: LocalRuntimeEvent[] = [];
  for (const eventPath of eventPaths.sort()) {
    const contents = await readFile(eventPath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const event = parseLocalRuntimeEvent(line);
      if (event && localRuntimeEventMatches(event, query)) {
        events.push(event);
      }
    }
  }

  const limit =
    typeof query.limit === "number" && Number.isInteger(query.limit) && query.limit > 0
      ? Math.min(query.limit, 1000)
      : 50;
  return events.sort((left, right) => left.timestamp.localeCompare(right.timestamp)).slice(-limit);
}

export function resolveLocalRuntimeRoot(configuredRoot?: string | null) {
  const processLike = getProcessLike();
  const configured =
    configuredRoot?.trim() || processLike?.env?.[LOCAL_RUNTIME_OBSERVABILITY_ROOT_ENV]?.trim();
  if (configured) {
    return configured;
  }

  const home = processLike?.env?.HOME?.trim() || "/tmp";
  return `${home}/Library/Caches/hito-running/local-runtime-observability`;
}

export function resolveLocalRuntimeArchiveAfter(timestamp: string | Date) {
  return archiveAfterTimestamp(timestamp instanceof Date ? timestamp : new Date(timestamp));
}

export function resolveLocalRuntimeArtifactRelativePath(input: {
  category: string;
  filename: string;
  timestamp: string | Date;
}) {
  const date = input.timestamp instanceof Date ? input.timestamp : new Date(input.timestamp);
  return [
    "active",
    localCalendarDateKey(date),
    sanitizeCode(input.category, 80),
    sanitizeFilename(input.filename),
  ].join("/");
}

async function prepareLocalRuntimeRoot(input: { root: string; now: Date }) {
  const { chmod, mkdir, readdir, rename } = await importNodeFsPromises();
  const { join } = await importNodePath();
  const activeRoot = join(input.root, "active");
  const archiveRoot = join(input.root, "archive");
  await mkdir(input.root, { recursive: true, mode: 0o700 });
  await mkdir(activeRoot, { recursive: true, mode: 0o700 });
  await mkdir(archiveRoot, { recursive: true, mode: 0o700 });
  await Promise.all([
    chmod(input.root, 0o700),
    chmod(activeRoot, 0o700),
    chmod(archiveRoot, 0o700),
  ]);

  const retainedDates = activeCalendarDateKeys(input.now);
  const activeDates = await readDirectories(activeRoot, readdir);
  for (const activeDate of activeDates) {
    if (!isCalendarDateKey(activeDate) || retainedDates.has(activeDate)) {
      continue;
    }

    const source = join(activeRoot, activeDate);
    const destination = join(archiveRoot, activeDate);
    try {
      await rename(source, destination);
    } catch (error) {
      if (isNodeErrorCode(error, "EEXIST") || isNodeErrorCode(error, "ENOTEMPTY")) {
        await rename(source, join(archiveRoot, `${activeDate}-${input.now.getTime()}`));
      } else if (!isNodeErrorCode(error, "ENOENT")) {
        throw error;
      }
    }
  }
}

function resolveLocalRuntimeWrite(
  options?: LocalRuntimeObservabilityOptions,
): { root: string; now: Date } | null {
  if (options?.disabled) {
    return null;
  }

  const processLike = getProcessLike();
  const env = processLike?.env ?? {};
  if (env[LOCAL_RUNTIME_OBSERVABILITY_ENABLED_ENV] === "0") {
    return null;
  }

  const requestContext = getCurrentLocalRuntimeRequestContext();
  const runtimeUrl =
    options?.runtimeUrl?.trim() || requestContext?.runtimeUrl || env[LOCAL_RUNTIME_URL_ENV]?.trim();
  if (!isLoopbackRuntimeUrl(runtimeUrl)) {
    return null;
  }

  return {
    root: resolveLocalRuntimeRoot(options?.root),
    now: options?.now ?? new Date(),
  };
}

function sanitizeLocalRuntimeEvent(input: LocalRuntimeEventInput): LocalRuntimeEvent {
  const currentRequest = getCurrentLocalRuntimeRequestContext();

  return {
    artifactKind: "hito_local_runtime_event_v1",
    timestamp: safeTimestamp(input.timestamp),
    category: input.category,
    event: sanitizeCode(input.event, 80),
    status: input.status,
    phase: input.phase,
    outcomeCode: sanitizeCode(input.outcomeCode, 120),
    requestId: sanitizeNullableCode(input.requestId ?? currentRequest?.requestId, 120),
    generationId: sanitizeNullableCode(input.generationId, 120),
    route:
      input.route == null && currentRequest?.route == null
        ? null
        : sanitizeRoute(input.route ?? currentRequest?.route ?? "/"),
    method: sanitizeNullableCode(input.method ?? currentRequest?.method, 12),
    serverFunctionId: sanitizeNullableCode(
      input.serverFunctionId ?? currentRequest?.serverFunctionId,
      160,
    ),
    httpStatus: boundedInteger(input.httpStatus, 100, 599),
    elapsedMs: boundedInteger(input.elapsedMs, 0, 86_400_000),
    providerKind: sanitizeNullableCode(input.providerKind, 80),
    providerResponseId: sanitizeNullableCode(input.providerResponseId, 160),
    parseStatus: sanitizeNullableCode(input.parseStatus, 80),
    normalizationStatus: sanitizeNullableCode(input.normalizationStatus, 80),
    diagnosticCodes: (input.diagnosticCodes ?? [])
      .slice(0, 16)
      .map((value) => sanitizeCode(value, 120)),
    canonicalRowCount: boundedInteger(input.canonicalRowCount, 0, 100_000),
    rawArtifactPath: isSafeArtifactLocator(input.rawArtifactPath) ? input.rawArtifactPath! : null,
  };
}

function classifyActionOutcome(result: unknown) {
  if (!result || typeof result !== "object") {
    return { failed: false, code: "action_completed" };
  }

  const record = result as Record<string, unknown>;
  const status = typeof record.status === "string" ? record.status : null;
  const failed =
    record.ok === false || ["blocked", "error", "failed", "unavailable"].includes(status ?? "");
  if (!failed) {
    return { failed: false, code: "action_completed" };
  }

  const nestedError =
    record.error && typeof record.error === "object"
      ? (record.error as Record<string, unknown>)
      : null;
  const unavailable =
    record.unavailable && typeof record.unavailable === "object"
      ? (record.unavailable as Record<string, unknown>)
      : null;
  const unavailableError =
    unavailable?.error && typeof unavailable.error === "object"
      ? (unavailable.error as Record<string, unknown>)
      : null;
  const candidates = [record.reason, nestedError?.code, unavailableError?.code, status];
  const code = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && /^[a-z][a-z0-9_.-]{1,119}$/.test(candidate),
  );

  return { failed: true, code: code ?? "action_failed" };
}

function sanitizeRoute(value: string) {
  let pathname = "/";
  try {
    pathname = value.startsWith("http") ? new URL(value).pathname : value.split(/[?#]/, 1)[0]!;
  } catch {
    pathname = "/";
  }

  const safeStaticSegments = new Set([
    "",
    "_serverFn",
    "admin",
    "analytics",
    "api",
    "auth",
    "body",
    "capture",
    "change-log",
    "changelog",
    "confirm",
    "hitoDS",
    "integrations",
    "local-login",
    "login",
    "logout",
    "progress",
    "settings",
    "workout",
    ":date",
    ":id",
    ":number",
    ":segment",
  ]);
  const segments = pathname.split("/").map((segment) => {
    if (safeStaticSegments.has(segment)) return segment;
    if (/^\d{4}-\d{2}-\d{2}$/.test(segment)) return ":date";
    if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment)) return ":id";
    if (/^\d+$/.test(segment)) return ":number";
    return ":segment";
  });

  return `/${segments.filter(Boolean).join("/")}`.slice(0, 180) || "/";
}

function parseLocalRuntimeEvent(line: string): LocalRuntimeEvent | null {
  try {
    const parsed = JSON.parse(line) as Partial<LocalRuntimeEvent>;
    if (parsed.artifactKind !== "hito_local_runtime_event_v1") {
      return null;
    }
    return {
      ...(parsed as LocalRuntimeEvent),
      rawArtifactPath: isSafeArtifactLocator(parsed.rawArtifactPath)
        ? parsed.rawArtifactPath!
        : null,
    };
  } catch {
    return null;
  }
}

function localRuntimeEventMatches(event: LocalRuntimeEvent, query: LocalRuntimeEventQuery) {
  if (query.since && event.timestamp < query.since) return false;
  if (query.until && event.timestamp > query.until) return false;
  if (query.requestId && event.requestId !== query.requestId) return false;
  if (query.generationId && event.generationId !== query.generationId) return false;
  if (query.providerResponseId && event.providerResponseId !== query.providerResponseId) {
    return false;
  }
  if (query.route && event.route !== sanitizeRoute(query.route)) return false;
  if (query.outcomeCode && event.outcomeCode !== sanitizeCode(query.outcomeCode, 120)) return false;
  return true;
}

function activeCalendarDateKeys(now: Date) {
  return new Set(
    Array.from({ length: LOCAL_RUNTIME_ACTIVE_CALENDAR_DAYS }, (_, index) => {
      const date = new Date(now);
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - index);
      return localCalendarDateKey(date);
    }),
  );
}

function archiveAfterTimestamp(timestamp: Date) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + LOCAL_RUNTIME_ACTIVE_CALENDAR_DAYS);
  return date.toISOString();
}

function localCalendarDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isCalendarDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function readDirectories(root: string, readdir: typeof import("node:fs/promises").readdir) {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

async function fileExists(path: string) {
  const { stat } = await importNodeFsPromises();
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function safeTimestamp(value: string | undefined) {
  if (value && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
}

function safeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function sanitizeNullableCode(value: string | null | undefined, limit: number) {
  return value == null ? null : sanitizeCode(value, limit);
}

function sanitizeCode(value: string, limit: number) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "_");
  return normalized.slice(0, limit) || "unknown";
}

function sanitizeFilename(value: string) {
  return value.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 220) || "artifact.json";
}

function boundedInteger(value: number | null | undefined, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, Math.round(value)))
    : null;
}

function safeErrorClass(error: unknown) {
  return error instanceof Error ? sanitizeCode(error.name, 80) : "unknown_error";
}

function isSafeRelativeArtifactPath(value: string | null | undefined) {
  return Boolean(
    value && !value.startsWith("/") && !value.includes("..") && value.startsWith("active/"),
  );
}

function toArtifactLocator(relativePath: string) {
  return relativePath.replace(/^(?:active|archive)\//, "");
}

function isSafeArtifactLocator(value: string | null | undefined) {
  return Boolean(
    value &&
    !value.startsWith("/") &&
    !value.includes("..") &&
    /^\d{4}-\d{2}-\d{2}\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(value),
  );
}

async function isPrivateLocalArtifactRoot(root: string) {
  const { resolve } = await importNodePath();
  const normalizedRoot = withTrailingSeparator(resolve(root)).replaceAll("\\", "/");
  const workspaceRoot = withTrailingSeparator(resolve(getProcessLike()?.cwd?.() ?? ".")).replaceAll(
    "\\",
    "/",
  );
  return (
    !normalizedRoot.startsWith(workspaceRoot) &&
    !normalizedRoot.includes("/Library/Mobile Documents/")
  );
}

async function removeLocalRuntimeArtifact(root: string, relativePath: string) {
  if (!isSafeRelativeArtifactPath(relativePath)) {
    return;
  }
  const { rm } = await importNodeFsPromises();
  const { resolve } = await importNodePath();
  const absoluteRoot = withTrailingSeparator(resolve(root));
  const absolutePath = resolve(root, relativePath);
  if (withTrailingSeparator(absolutePath).startsWith(absoluteRoot)) {
    await rm(absolutePath, { force: true });
  }
}

function withTrailingSeparator(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function createCorrelationId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function isNodeErrorCode(error: unknown, code: string) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === code,
  );
}

async function importNodeFsPromises() {
  const moduleName = "node:fs/promises";
  return (await import(/* @vite-ignore */ moduleName)) as typeof import("node:fs/promises");
}

async function importNodePath() {
  const moduleName = "node:path";
  return (await import(/* @vite-ignore */ moduleName)) as typeof import("node:path");
}

function getProcessLike():
  | {
      cwd?: () => string;
      env?: Record<string, string | undefined>;
    }
  | undefined {
  return typeof process === "undefined" ? undefined : process;
}
