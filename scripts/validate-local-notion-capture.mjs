import assert from "node:assert/strict";
import {
  buildLocalNotionPageInput,
  LocalNotionCaptureError,
  normalizeLocalNotionCapture,
  submitLocalNotionCapture,
} from "./local-notion-capture-server.mjs";

const rawCapture = {
  evidence: [
    "Button: Create plan; token=should-not-survive",
    "Selector: [data-testid=plan-create]",
  ],
  kind: "content_bug",
  note: "Wrong Portuguese label; Authorization: Bearer should-not-survive",
  pageTitle: "Calendar",
  route: "/calendar?token=should-not-survive#private",
  source: "inspector_batch",
  theme: "dark",
  title: "Portuguese Create plan label is wrong",
  viewport: { height: 812, width: 375 },
};

const capture = normalizeLocalNotionCapture(rawCapture);
const sameCapture = normalizeLocalNotionCapture(structuredClone(rawCapture));
const changedCapture = normalizeLocalNotionCapture({ ...rawCapture, kind: "bug" });

assert.equal(capture.route, "/calendar");
assert.doesNotMatch(JSON.stringify(capture), /should-not-survive/);
assert.match(capture.note, /\[redacted\]/);
assert.equal(capture.sourceKey, sameCapture.sourceKey);
assert.notEqual(capture.sourceKey, changedCapture.sourceKey);
assert.match(capture.sourceKey, /^local-debugger:v1:[a-f0-9]{64}$/);

assert.throws(
  () => normalizeLocalNotionCapture({ ...rawCapture, kind: "incident" }),
  (error) => error instanceof LocalNotionCaptureError && error.code === "invalid_capture_kind",
);
assert.throws(
  () => normalizeLocalNotionCapture({ ...rawCapture, evidence: [], note: "" }),
  (error) => error instanceof LocalNotionCaptureError && error.code === "empty_capture",
);

const pageInput = buildLocalNotionPageInput(capture);
assert.equal(pageInput.parent.data_source_id, "3c1fe5f5-8cf5-8036-bbcb-000b43565fa9");
assert.equal(pageInput.properties.Status.select.name, "Backlog");
assert.equal(pageInput.properties.Phase.select.name, "Intake");
assert.equal(pageInput.properties.Owner.select.name, "PRODUCT");
assert.equal(pageInput.properties.Category.select.name, "Bug");
assert.equal(pageInput.properties.Priority.select.name, "Medium");
assert.equal(pageInput.properties["Primary Area"].select.name, "Runner");
assert.match(JSON.stringify(pageInput.children), /Content bug/);
assert.doesNotMatch(JSON.stringify(pageInput), /should-not-survive|\?|#private/);

const taskPageInput = buildLocalNotionPageInput(
  normalizeLocalNotionCapture({ ...rawCapture, kind: "task", route: "/hitoDS" }),
);
assert.equal(taskPageInput.properties.Category.select.name, "Maintenance");
assert.equal(taskPageInput.properties["Primary Area"].select.name, "Design System");

const existingPage = notionPage({
  id: "existing-page",
  number: 990,
  url: "https://notion.so/existing",
});
const dedupeCalls = [];
const deduplicated = await submitLocalNotionCapture({
  capture,
  fetchImpl: async (url, init) => {
    dedupeCalls.push({ body: JSON.parse(init.body), url });
    return jsonResponse({ results: [existingPage] });
  },
  token: "test-token",
});
assert.equal(dedupeCalls.length, 1);
assert.match(dedupeCalls[0].url, /\/query$/);
assert.equal(dedupeCalls[0].body.filter.rich_text.equals, capture.sourceKey);
assert.deepEqual(deduplicated, {
  deduplicated: true,
  hitoId: "HITO-990",
  pageId: "existing-page",
  pageUrl: "https://notion.so/existing",
});

const createdPage = notionPage({
  id: "created-page",
  number: 991,
  url: "https://notion.so/created",
});
const createCalls = [];
const created = await submitLocalNotionCapture({
  capture,
  fetchImpl: async (url, init) => {
    createCalls.push({ body: JSON.parse(init.body), url });
    return createCalls.length === 1 ? jsonResponse({ results: [] }) : jsonResponse(createdPage);
  },
  token: "test-token",
});
assert.equal(createCalls.length, 2);
assert.match(createCalls[0].url, /\/query$/);
assert.equal(createCalls[1].url, "https://api.notion.com/v1/pages");
assert.equal(
  createCalls[1].body.properties["Source key"].rich_text[0].text.content,
  capture.sourceKey,
);
assert.deepEqual(created, {
  deduplicated: false,
  hitoId: "HITO-991",
  pageId: "created-page",
  pageUrl: "https://notion.so/created",
});

await assert.rejects(
  () =>
    submitLocalNotionCapture({
      capture,
      fetchImpl: async () => jsonResponse({ message: "raw provider detail" }, 500),
      token: "test-token",
    }),
  (error) =>
    error instanceof LocalNotionCaptureError &&
    error.code === "notion_write_failed" &&
    !error.message.includes("raw provider detail"),
);

console.log("Local Notion capture contract checks passed.", {
  categories: ["Maintenance", "Bug"],
  kinds: ["task", "bug", "content_bug"],
  sourceKeyVersion: "local-debugger:v1",
});

function notionPage({ id, number, url }) {
  return {
    id,
    properties: { "Hito ID": { unique_id: { number, prefix: "HITO" } } },
    url,
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}
