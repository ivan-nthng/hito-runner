import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

export const LOCAL_NOTION_CAPTURE_PATH = "/__hito/local-notion-task";
export const LOCAL_NOTION_CAPTURE_VERSION = "local_debugger_notion_capture_v1";

const NOTION_API_VERSION = "2026-03-11";
const NOTION_TASKS_DATA_SOURCE_ID = "3c1fe5f5-8cf5-8036-bbcb-000b43565fa9";
const NOTION_ENV_PATH = resolve(homedir(), ".config/hito/notion.env");
const MAX_BODY_BYTES = 64 * 1024;
const MAX_EVIDENCE_LINES = 8;
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const SECRET_PATTERN =
  /\b(?:bearer\s+[a-z0-9._-]+|authorization\s*:|password\s*[=:]|token\s*[=:]|secret\s*[=:]|cookie\s*[=:]|session\s*[=:]|jwt\s*[=:]|api[_-]?key\s*[=:]|eyJ[a-z0-9_-]{8,}\.[a-z0-9_-]{8,})[^\s,;]*/gi;

export class LocalNotionCaptureError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function normalizeLocalNotionCapture(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new LocalNotionCaptureError("invalid_capture", "Capture payload is required.");
  }

  const kind = normalizeKind(input.kind);
  const source = normalizeSource(input.source);
  const route = normalizeRoute(input.route);
  const pageTitle = sanitizeText(input.pageTitle, 180);
  const note = sanitizeText(input.note, 1_200);
  const title = buildTaskTitle({ kind, note, route, title: input.title });
  const viewport = normalizeViewport(input.viewport);
  const theme = normalizeTheme(input.theme);
  const evidence = normalizeEvidence(input.evidence);

  if (!note && evidence.length === 0) {
    throw new LocalNotionCaptureError(
      "empty_capture",
      "Add a note or selected-element evidence before submitting.",
    );
  }

  const normalized = {
    evidence,
    kind,
    note,
    pageTitle,
    route,
    source,
    theme,
    title,
    viewport,
  };

  return {
    ...normalized,
    sourceKey: buildSourceKey(normalized),
  };
}

export function buildLocalNotionPageInput(capture) {
  const captureLabel = getCaptureKindLabel(capture.kind);
  const area = inferPrimaryArea(capture.route);
  const category = capture.kind === "task" ? "Maintenance" : "Bug";
  const latestUpdate = `${captureLabel} captured explicitly from the local Debugger. No implementation has been admitted.`;
  const nextAction =
    "PRODUCT reviews the bounded capture, confirms scope, area, owner and priority, then admits or cancels the Task.";
  const evidenceLines = [
    `Capture type: ${captureLabel}`,
    `Source: ${LOCAL_NOTION_CAPTURE_VERSION}`,
    `Route: ${capture.route}`,
    capture.pageTitle ? `Page title: ${capture.pageTitle}` : null,
    capture.viewport
      ? `Viewport: ${capture.viewport.width}x${capture.viewport.height}; theme: ${capture.theme}`
      : `Theme: ${capture.theme}`,
    `Capture source: ${capture.source === "screen_capture" ? "Screen" : "Inspector batch"}`,
  ].filter(Boolean);

  return {
    parent: { data_source_id: NOTION_TASKS_DATA_SOURCE_ID },
    properties: {
      Category: { select: { name: category } },
      "Latest update": { rich_text: richText(latestUpdate) },
      "Next action": { rich_text: richText(nextAction) },
      Owner: { select: { name: "PRODUCT" } },
      Phase: { select: { name: "Intake" } },
      "Primary Area": { select: { name: area } },
      Priority: { select: { name: "Medium" } },
      "Source key": { rich_text: richText(capture.sourceKey) },
      Status: { select: { name: "Backlog" } },
      Task: { title: richText(capture.title) },
    },
    children: [
      paragraph(
        "Outcome: retain the explicitly submitted local Debugger capture as one canonical Notion Task for Product triage. No implementation or dispatch is implied by capture.",
      ),
      heading("Captured evidence"),
      ...evidenceLines.map(bullet),
      ...(capture.note ? [heading("Ivan note"), paragraph(capture.note)] : []),
      ...(capture.evidence.length
        ? [heading("Selected target evidence"), ...capture.evidence.map(bullet)]
        : []),
      paragraph(
        "Boundary: local-only explicit submission; no screenshot, query string, hash, cookie, session, credential, product payload or automatic duplicate was retained.",
      ),
    ],
  };
}

export async function submitLocalNotionCapture({ capture, fetchImpl = fetch, token }) {
  const queryResponse = await notionRequest({
    fetchImpl,
    token,
    url: `https://api.notion.com/v1/data_sources/${NOTION_TASKS_DATA_SOURCE_ID}/query`,
    body: {
      filter: { property: "Source key", rich_text: { equals: capture.sourceKey } },
      page_size: 1,
    },
  });
  const existing = Array.isArray(queryResponse.results) ? queryResponse.results[0] : null;

  if (existing) {
    return formatSubmissionResult(existing, true);
  }

  const created = await notionRequest({
    fetchImpl,
    token,
    url: "https://api.notion.com/v1/pages",
    body: buildLocalNotionPageInput(capture),
  });

  return formatSubmissionResult(created, false);
}

export async function startLocalNotionCaptureServer({ appPort, host = "127.0.0.1", port }) {
  const server = createServer(async (request, response) => {
    const origin = readAllowedOrigin(request, appPort);
    setCorsHeaders(response, origin);

    if (request.method === "OPTIONS") {
      response.writeHead(origin ? 204 : 403).end();
      return;
    }

    if (
      request.url !== LOCAL_NOTION_CAPTURE_PATH ||
      request.method !== "POST" ||
      !origin ||
      !isLoopbackAddress(request.socket.remoteAddress) ||
      request.headers["x-hito-local-debugger"] !== "v1"
    ) {
      writeJson(response, 404, { ok: false, reason: "local_capture_unavailable" });
      return;
    }

    try {
      const body = await readJsonBody(request);
      const capture = normalizeLocalNotionCapture(body);
      const token = await readNotionToken();
      const result = await submitLocalNotionCapture({ capture, token });
      writeJson(response, result.deduplicated ? 200 : 201, { ok: true, ...result });
    } catch (error) {
      const failure = normalizeFailure(error);
      writeJson(response, failure.status, {
        message: failure.message,
        ok: false,
        reason: failure.code,
      });
    }
  });

  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolvePromise();
    });
  });

  return {
    close: () => new Promise((resolvePromise) => server.close(resolvePromise)),
    host,
    port,
  };
}

async function notionRequest({ body, fetchImpl, token, url }) {
  const response = await fetchImpl(url, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
    },
    method: "POST",
  });

  if (!response.ok) {
    const status = response.status === 429 ? 503 : 502;
    throw new LocalNotionCaptureError(
      "notion_write_failed",
      "Notion could not accept the capture. The local draft is unchanged.",
      status,
    );
  }

  return response.json();
}

async function readNotionToken() {
  let values;
  try {
    values = parseEnv(await readFile(NOTION_ENV_PATH, "utf8"));
  } catch {
    throw new LocalNotionCaptureError(
      "notion_unavailable",
      "The local Notion connection is unavailable. The local draft is unchanged.",
      503,
    );
  }

  const token = values.NOTION_TOKEN || values.NOTION_API_KEY || values.NOTION_SECRET;
  if (!token) {
    throw new LocalNotionCaptureError(
      "notion_unavailable",
      "The local Notion connection is unavailable. The local draft is unchanged.",
      503,
    );
  }
  return token;
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new LocalNotionCaptureError("capture_too_large", "Capture payload is too large.", 413);
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new LocalNotionCaptureError("invalid_capture", "Capture payload must be JSON.");
  }
}

function normalizeKind(value) {
  if (value === "task" || value === "bug" || value === "content_bug") return value;
  throw new LocalNotionCaptureError("invalid_capture_kind", "Choose Task, Bug, or Content bug.");
}

function normalizeSource(value) {
  if (value === "inspector_batch" || value === "screen_capture") return value;
  throw new LocalNotionCaptureError("invalid_capture_source", "Capture source is unsupported.");
}

function normalizeRoute(value) {
  const text = sanitizeText(value, 300) || "/";
  try {
    const route = new URL(text, "http://hito.local").pathname;
    return route.startsWith("/") ? route : "/";
  } catch {
    return "/";
  }
}

function normalizeViewport(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const width = normalizeDimension(value.width);
  const height = normalizeDimension(value.height);
  return width && height ? { height, width } : null;
}

function normalizeDimension(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 && number <= 10_000 ? Math.round(number) : null;
}

function normalizeTheme(value) {
  return value === "dark" || value === "light" || value === "system" ? value : "unknown";
}

function normalizeEvidence(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_EVIDENCE_LINES)
    .map((line) => sanitizeText(line, 500))
    .filter(Boolean);
}

function sanitizeText(value, limit) {
  if (typeof value !== "string") return "";
  return value.replace(SECRET_PATTERN, "[redacted]").replace(/\s+/g, " ").trim().slice(0, limit);
}

function buildTaskTitle({ kind, note, route, title }) {
  const explicit = sanitizeText(title, 120);
  if (explicit) return explicit;
  const source = note || `${getCaptureKindLabel(kind)} on ${route}`;
  return source.length <= 96 ? source : `${source.slice(0, 93).trimEnd()}…`;
}

function buildSourceKey(capture) {
  const material = JSON.stringify({
    evidence: capture.evidence,
    kind: capture.kind,
    note: capture.note,
    pageTitle: capture.pageTitle,
    route: capture.route,
    source: capture.source,
    theme: capture.theme,
    title: capture.title,
    viewport: capture.viewport,
  });
  return `local-debugger:v1:${createHash("sha256").update(material).digest("hex")}`;
}

function inferPrimaryArea(route) {
  if (route.startsWith("/admin")) return "Admin & Business Operations";
  if (route.startsWith("/hitoDS")) return "Design System";
  if (route.startsWith("/progress") || route.startsWith("/history")) return "History";
  if (route.startsWith("/marketing")) return "Marketing";
  return "Runner";
}

function getCaptureKindLabel(kind) {
  if (kind === "content_bug") return "Content bug";
  if (kind === "bug") return "Bug";
  return "Task";
}

function formatSubmissionResult(page, deduplicated) {
  const uniqueId = page?.properties?.["Hito ID"]?.unique_id;
  return {
    deduplicated,
    hitoId: uniqueId?.number ? `${uniqueId.prefix || "HITO"}-${uniqueId.number}` : null,
    pageId: page.id,
    pageUrl: page.url,
  };
}

function richText(content) {
  return [{ type: "text", text: { content } }];
}

function paragraph(content) {
  return { object: "block", type: "paragraph", paragraph: { rich_text: richText(content) } };
}

function heading(content) {
  return { object: "block", type: "heading_2", heading_2: { rich_text: richText(content) } };
}

function bullet(content) {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: richText(content) },
  };
}

function readAllowedOrigin(request, appPort) {
  const origin = request.headers.origin;
  if (typeof origin !== "string") return null;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "http:" &&
      LOOPBACK_HOSTNAMES.has(parsed.hostname.toLowerCase()) &&
      Number(parsed.port) === Number(appPort)
      ? parsed.origin
      : null;
  } catch {
    return null;
  }
}

function isLoopbackAddress(value) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "127.0.0.1" ||
    normalized === "::ffff:127.0.0.1" ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(normalized)
  );
}

function setCorsHeaders(response, origin) {
  if (origin) response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Hito-Local-Debugger");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Vary", "Origin");
}

function writeJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

function normalizeFailure(error) {
  if (error instanceof LocalNotionCaptureError) return error;
  return new LocalNotionCaptureError(
    "notion_write_failed",
    "Notion could not accept the capture. The local draft is unchanged.",
    502,
  );
}
